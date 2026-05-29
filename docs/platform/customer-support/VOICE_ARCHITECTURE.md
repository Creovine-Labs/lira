# Voice Support — Architecture (as of 2026-05-23)

A complete breakdown of how voice support works today: every framework, every
piece of infra, every file that participates in a live call. Companion to
[VOICE_CHOPPINESS_INVESTIGATION.md](VOICE_CHOPPINESS_INVESTIGATION.md) (which
covers the open quality issue) and [PIPECAT_MIGRATION_PLAN.md](PIPECAT_MIGRATION_PLAN.md)
(which covers where we're going).

---

## 1. The two voice surfaces

Lira has **two distinct voice paths** that share almost nothing in common
besides the Nova Sonic model on the other end. Don't confuse them.

| Path                       | Channel                                      | Transport                                 | Handler                                                                                                                | Status                                      |
| -------------------------- | -------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Widget voice**           | Browser mic via `<Call>` button in the embed | Native browser WebSocket → Fastify        | [src/routes/lira-support-chat.routes.ts:180](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L180) | Production (smooth-ish, see choppiness doc) |
| **Telephony (PSTN) voice** | Phone call to a Twilio number                | Twilio Media Streams (μ-law) → Fastify WS | [src/routes/lira-support-voice.routes.ts](../../../../creovine-backend/src/routes/lira-support-voice.routes.ts)        | Wired but not the focus right now           |

**This document covers the widget voice path** — that's the differentiator and
the one customers will hit from a website embed. PSTN is referenced but not
analysed in depth.

---

## 2. High-level data flow (widget voice)

```
┌────────── BROWSER (visitor) ──────────┐
│                                       │
│  <Call> button click                  │
│    │                                  │
│    ▼                                  │
│  getUserMedia()  ──┐                  │
│    │               │                  │
│    ▼               │                  │
│  AudioContext (system rate, e.g.48k) │
│    │                                  │
│    ├─► AnalyserNode (mic level UI)    │
│    │                                  │
│    └─► AudioWorklet `pcm-capture`     │
│          │  buffers 4096 float32      │
│          ▼                            │
│        downsampleToPcm16(...→16kHz)   │
│          │                            │
│          ▼                            │
│        ws.send(ArrayBuffer)  ─────────┼──┐  PCM 16k 16-bit mono frames
│                                       │  │
│                                       │  │
│  ws.onmessage:                        │  │
│    instanceof ArrayBuffer? → PCM      │  │
│      └─► PcmPlayer.play()  ◄──────────┼──┼──┐  PCM 24k 16-bit mono frames
│              │                        │  │  │
│              ▼                        │  │  │
│            AudioWorklet               │  │  │
│            `lira-pcm-playback`        │  │  │
│            (350ms jitter buffer)      │  │  │
│              │                        │  │  │
│              ▼                        │  │  │
│            Speaker                    │  │  │
│                                       │  │  │
│    else JSON → transcript /           │  │  │
│      interruption / call_ended /      │  │  │
│      pin_required / demo_action       │  │  │
└───────────────────────────────────────┘  │  │
                                           │  │
                       wss://api.creovine.com/lira/v1/support/chat/voice/:orgId
                                           │  │
┌─────────── EC2 (Fastify) ────────────────┼──┼──┐
│                                          │  │  │
│  fastify.get('/voice/:orgId',            │  │  │
│              { websocket: true }, …)     │  │  │
│    │                                     │  │  │
│    ▼                                     │  │  │
│  Resolve visitor → customer (DDB)        │  │  │
│  Open / reuse voice conversation         │  │  │
│  Pre-load 4 KB chunks (Qdrant)           │  │  │
│  Build system prompt                     │  │  │
│  Register ws.on('message') BEFORE start  │  │  │
│    │  (browser is already streaming)     │  │  │
│    ▼                                     │  │  │
│  pendingAudioChunks buffer (8s cap)      │  │  │
│    │                                     │  │  │
│    ▼                                     │  │  │
│  sonic.startSession(...)                 │  │  │
│    │                                     │  │  │
│    ▼                                     │  │  │
│  Once session ready, flush queue, then   │  │  │
│  forward each binary frame:              │  │  │
│  sonic.sendAudio(sessionId, chunk)  ─────┘  │  │
│                                             │  │
│  Callbacks from sonic:                      │  │
│    onAudioOutput(pcm)   ── binary frame ───►│  │
│    onTextOutput(role, text) ── JSON ───────►│  │
│    onInterruption()  ── JSON ──────────────►│  │
│    onSessionEnd()  ── JSON + close ────────►│  │
│                                             │  │
│  On close: save transcript turns to DDB     │  │
└─────────────────────────────────────────────┘  │
                                                 │
                                                 ▼
                              AWS Bedrock — InvokeModelWithBidirectionalStream
                              Model: amazon.nova-sonic-v1:0 (legacy direct path)
                              Region: us-east-1
                              Inference cfg: maxTokens=512, temp=0.4, topP=0.9
                              Voice: tiffany, speakingRate=1.1
                              Tool config: EMPTY (see VOICE_TOOL_SILENT_ISSUE.md)
```

---

## 3. Browser side — `lira-ai`

All widget voice code lives in a single file:
[src/components/support-widget/voice.ts](../../../src/components/support-widget/voice.ts).
It's intentionally framework-free TypeScript so it bundles into the vanilla-JS
widget without React/Next runtime.

### 3.1 Capture pipeline

| Step           | Code                                                                          | Detail                                                                                                                                                                                                                          |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mic permission | [voice.ts:303-306](../../../src/components/support-widget/voice.ts#L303-L306) | `getUserMedia({ audio: { echoCancellation, noiseSuppression, autoGainControl } })`. We rely on the browser's AEC/NS/AGC — we don't ship our own.                                                                                |
| AudioContext   | [voice.ts:309](../../../src/components/support-widget/voice.ts#L309)          | Default sample rate (typically 48k on desktop, 44.1k on iOS). We **do not** force 16k here because Safari's WebAudio implementation gets buggy at non-native rates.                                                             |
| AnalyserNode   | [voice.ts:311-313](../../../src/components/support-widget/voice.ts#L311-L313) | 256-point FFT, polled every 100ms ([voice.ts:358-368](../../../src/components/support-widget/voice.ts#L358-L368)) to drive the mic-level indicator.                                                                             |
| AudioWorklet   | [voice.ts:316-339](../../../src/components/support-widget/voice.ts#L316-L339) | Inline `PcmCaptureProcessor` registered from a Blob URL. Accumulates float32 input, flushes to main thread in **4096-sample chunks** via `port.postMessage`. Off-main-thread by design — no `ScriptProcessorNode` (deprecated). |
| Resample       | [voice.ts:33-47](../../../src/components/support-widget/voice.ts#L33-L47)     | `downsampleToPcm16(float32, fromRate, 16000)`. Linear interpolation + clamp + int16 conversion.                                                                                                                                 |
| Transport      | [voice.ts:344-353](../../../src/components/support-widget/voice.ts#L344-L353) | Each 4096-sample chunk → PCM16 → `ws.send(ArrayBuffer)`. Binary frame, no framing header.                                                                                                                                       |

### 3.2 Playback pipeline (`PcmPlayer`)

[voice.ts:51-257](../../../src/components/support-widget/voice.ts#L51-L257) —
the most carefully tuned part of the file.

| Aspect                        | Value                                                                                                                                                                             | Why                                                                                                                                                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Output AudioContext rate      | **24000 Hz** (hard-coded)                                                                                                                                                         | Matches Nova Sonic v2 output. If the browser allocates a different system rate (Chrome can override), `resampleFloat32()` re-pitches before pushing to the worklet ([voice.ts:96-99](../../../src/components/support-widget/voice.ts#L96-L99)). |
| `START_BUFFER_SEC = 0.5`      | Wait for 500ms of audio before starting playback                                                                                                                                  | Smooths out Nova Sonic's burst/gap/burst delivery pattern.                                                                                                                                                                                      |
| `START_TIMEOUT_SEC = 0.22`    | Start anyway after 220ms even if buffer not full                                                                                                                                  | Latency safety net — don't make the caller wait when only a short reply is coming.                                                                                                                                                              |
| `MIN_START_BUFFER_SEC = 0.12` | Floor on the start threshold                                                                                                                                                      | After the timeout fires, still require at least 120ms.                                                                                                                                                                                          |
| `MAX_BUFFER_SEC = 4`          | Drop oldest queued samples beyond 4s                                                                                                                                              | Prevents unbounded growth if the WS pumps faster than playback.                                                                                                                                                                                 |
| Worklet `lira-pcm-playback`   | [voice.ts:127-218](../../../src/components/support-widget/voice.ts#L127-L218)                                                                                                     | Owns the jitter buffer on the audio thread, so playback timing is independent of main-thread stalls or WebSocket arrival jitter.                                                                                                                |
| `ctx.resume()` on construct   | [voice.ts:74](../../../src/components/support-widget/voice.ts#L74) and on every `play()` if suspended ([voice.ts:92-94](../../../src/components/support-widget/voice.ts#L92-L94)) | The mic-click handler counts as a user gesture, but the gesture window can close before the first audio frame arrives — so we resume defensively.                                                                                               |
| `flush()`                     | [voice.ts:109-116](../../../src/components/support-widget/voice.ts#L109-L116)                                                                                                     | Called on `interruption` JSON message — drop everything queued, let new speech play immediately.                                                                                                                                                |

### 3.3 WebSocket protocol (browser side)

**Endpoint:** `wss://api.creovine.com/lira/v1/support/chat/voice/{orgId}?visitorId={visitorId}` ([voice.ts:374](../../../src/components/support-widget/voice.ts#L374))

**Binary frames** (both directions):

- Browser → server: raw PCM **16k 16-bit mono** mic audio, no header
- Server → browser: raw PCM **24k 16-bit mono** Lira audio, no header
- Discriminated at receive time by `instanceof ArrayBuffer` ([voice.ts:394](../../../src/components/support-widget/voice.ts#L394))

**JSON frames** (control / out-of-band):

| Direction | Message                                                                              | Purpose                                                                                                                                                                                           | Code                                                                          |
| --------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| → server  | `{ type: 'demo_context', profile }`                                                  | Push the visitor's demo profile on connect (Nimbus interactive demo only)                                                                                                                         | [voice.ts:384-388](../../../src/components/support-widget/voice.ts#L384-L388) |
| → server  | `{ action: 'end_call' }`                                                             | Customer hung up                                                                                                                                                                                  | [voice.ts:492](../../../src/components/support-widget/voice.ts#L492)          |
| → server  | `{ action: 'pin_response' / 'pin_cancel', ... }`                                     | PIN confirmation routed back over the SAME voice WS (so chat WS can't answer a voice-issued PIN) — via `sendJson()` [voice.ts:476-484](../../../src/components/support-widget/voice.ts#L476-L484) |
| ← server  | `{ type: 'transcript', text, role }`                                                 | Live transcript — each turn fires separately                                                                                                                                                      | [voice.ts:401-402](../../../src/components/support-widget/voice.ts#L401-L402) |
| ← server  | `{ type: 'interruption' }`                                                           | Customer barged in — flush playback                                                                                                                                                               | [voice.ts:403-404](../../../src/components/support-widget/voice.ts#L403-L404) |
| ← server  | `{ type: 'call_ended' }`                                                             | Server-side hangup                                                                                                                                                                                | [voice.ts:405-406](../../../src/components/support-widget/voice.ts#L405-L406) |
| ← server  | `{ type: 'error', message }`                                                         | Hard error, ends the call                                                                                                                                                                         | [voice.ts:407-409](../../../src/components/support-widget/voice.ts#L407-L409) |
| ← server  | `{ type: 'demo_action_executed', action_type, payload }`                             | Demo dashboard re-render hook (CustomEvent re-dispatched on window)                                                                                                                               | [voice.ts:410-422](../../../src/components/support-widget/voice.ts#L410-L422) |
| ← server  | `{ type: 'pin_required' / 'action_started' / 'action_completed' / 'action_failed' }` | Voice-issued tool lifecycle — forwarded via CustomEvent so the chat widget renders the action card + PIN modal                                                                                    | [voice.ts:423-444](../../../src/components/support-widget/voice.ts#L423-L444) |

**Important:** tool-lifecycle events are currently dead code on the voice WS
because tools are disabled in Nova Sonic (see §6.6). They'll come alive when
post-call processing is wired up.

### 3.4 State machine

[voice.ts:14](../../../src/components/support-widget/voice.ts#L14): `'idle' | 'connecting' | 'active' | 'ended'`.

```
idle ── start() ──► connecting ── ws.onopen ──► active
                       │                          │
                       │  failure                 │ end() / ws.onclose / error
                       ▼                          ▼
                      idle ◄── 2s timeout ──── ended
```

---

## 4. Transport — between browser and backend

| Hop           | Component                                                                                                                                                                                                                                         | Notes                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Browser → DNS | `api.creovine.com` → `32.195.87.5` (Elastic IP)                                                                                                                                                                                                   | TTL 60s for rapid failover during EIP migration                                                                                                                          |
| 443 ingress   | **nginx** (TLS termination, WS upgrade proxy)                                                                                                                                                                                                     | Reverse-proxies to Fastify on localhost                                                                                                                                  |
| 443 → Fastify | [`@fastify/websocket`](https://github.com/fastify/fastify-websocket) plugin                                                                                                                                                                       | Registered globally; the `/voice/:orgId` route opts in via `{ websocket: true }`                                                                                         |
| Route prefix  | `/lira/v1/support`                                                                                                                                                                                                                                | Set in [src/index.ts:823-830ish](../../../../creovine-backend/src/index.ts) when `liraSupportChatRoutes` is registered under `/v1` then internally under `/lira/support` |
| Authn         | None per-WS. **`visitorId` is the only identifier** — it's a long-lived UUID stored in `localStorage` on the embedding site. Treated as a capability token; the only protected operation it gates is "post messages as this customer in this org" | The org config layer enforces `voice_enabled` ([routes:202](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L202))                                   |
| TLS           | Let's Encrypt cert managed by nginx                                                                                                                                                                                                               | Auto-renew via certbot systemd timer                                                                                                                                     |

**No load balancer.** All traffic hits one EC2 instance. **No sticky-session
config** because all session state lives in per-WS closures on that single
process. Horizontal scaling = future work (see §10).

---

## 5. Backend — `creovine-backend`

### 5.1 Routes & services involved

| File                                                                                                                | Role                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| [src/routes/lira-support-chat.routes.ts](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts)       | Widget HTTP (chat) + widget WS (chat) + widget WS (voice — yes, voice is registered here despite the filename, lines 180-473)                         |
| [src/services/lira-sonic.service.ts](../../../../creovine-backend/src/services/lira-sonic.service.ts)               | The Nova Sonic bidi-stream wrapper. Owns `activeSessions` map, builds events, parses output events, handles barge-in, dedupes repeated assistant text |
| [src/services/lira-support-chat.service.ts](../../../../creovine-backend/src/services/lira-support-chat.service.ts) | In-memory `widgetConnections` / `customerActiveSession` maps for chat → voice cross-channel handoff                                                   |
| `customerService`, `conversationService`, `configService`                                                           | DDB-backed: customer resolution, conversation CRUD, per-org support config                                                                            |
| `searchForContext()`                                                                                                | KB vector search hitting Qdrant (running locally on the same EC2)                                                                                     |

### 5.2 Voice WS lifecycle — in execution order

[lira-support-chat.routes.ts:180-473](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L180-L473):

1. **Gate** — fetch `configService.getSupportConfig(orgId)`; close with code `4004` if `voice_enabled !== true`.
2. **Identify** — derive a `sessionId = voice_${uuidv4()}`. Resolve the `visitorId` query param to a customer:
   - If not `voice_anon_*`: look up via `customerService.resolveCustomerByVisitorId`, or create a new "Voice Caller" customer and link the visitor.
   - Otherwise: synthesise an in-memory `anon_*` customer ID.
3. **Conversation** — find an open conversation for this customer or create a `channel: 'voice'` one with the marker message `[Voice call started]`.
4. **KB pre-load** — `searchForContext(orgId, "{orgName} company overview features products services", 4)`. **Capped at 4 results on purpose** (lines 263-280) — bigger prompts cause Nova Sonic to think longer before flushing audio, which exceeds the widget's jitter buffer and causes choppiness.
5. **System prompt** — hand-tuned for voice (lines 294-318). Short. Imperative. Bans lists. Tells the model **not to execute actions** — voice is read-only Q&A; actions are captured as intent and deferred to post-call (see §8). Note: the prompt is actually passed as `orgContextText` to a shared meeting-mode prompt builder, so the final string sent to Sonic is meeting-shaped with the support prompt appended — see §7.2 for why and what to fix.
6. **Register `ws.on('message')` BEFORE starting the Sonic session** (line 363) — the browser starts streaming mic frames the instant the WS opens, but Bedrock takes a few seconds to provision the bidi stream. We buffer up to **8 seconds (256 KB)** of PCM in `pendingAudioChunks` until Sonic is ready.
7. **Start the Sonic session** — `sonic.startSession(sessionId, ...)` with callbacks for `onAudioOutput`, `onTextOutput`, `onInterruption`, `onSessionEnd`, `onError`.
8. **Flush buffered audio** to Sonic once the session is ready.
9. **Run** — for each subsequent binary frame: trim odd bytes (PCM16 needs even length), `sonic.sendAudio(sessionId, chunk)`.
10. **Closeout** — on WS close / error / `end_call`: `sonic.endSession(sessionId)`, then `saveVoiceTranscript()` writes each accumulated turn to DDB as a separate message with `channel: 'voice'`, and resolves the conversation unless an escalation was triggered mid-call.

### 5.3 Escalation hook

`voiceReplyIndicatesUnknown()` — pattern-matches Lira's text output for "I
don't know" / "I'm not sure" / "let me have someone follow up" style replies.
When a customer asks a question and Lira can't answer, the backend silently
flips the conversation to `escalated` so a human agent gets notified after the
call ends, even though we're not telling the customer mid-call.

---

## 6. Speech model — Amazon Nova Sonic

### 6.1 What it is

A single Bedrock model that does **end-to-end speech**: PCM in → reasoning →
PCM out, with text transcripts as a side-channel. No separate STT/TTS/LLM
services. One bidirectional gRPC-ish stream.

### 6.2 SDK & invocation

- **SDK**: `@aws-sdk/client-bedrock-runtime`
- **Command**: `InvokeModelWithBidirectionalStreamCommand`
- **Model ID** (widget voice, legacy path): `amazon.nova-2-sonic-v1:0` (override via `LIRA_NOVA_SONIC_MODEL_ID` env var). **Upgraded from v1 → v2 on 2026-05-23** — V1 silently degrades, never auto-fall back.
- **Region**: `us-east-1`
- **Credentials**: instance-profile (EC2 role)

### 6.3 Audio format

| Direction                | Format | Sample rate | Channels | Encoding |
| ------------------------ | ------ | ----------- | -------- | -------- |
| Browser → Sonic (input)  | LPCM   | 16000 Hz    | mono     | int16 LE |
| Sonic → Browser (output) | LPCM   | 24000 Hz    | mono     | int16 LE |

### 6.4 Session event sequence

`sessionStart` → `promptStart` → `contentStart(USER, AUDIO, interactive)` →
many `audioInput` chunks (base64-wrapped) → `contentEnd` → `promptEnd` →
`sessionEnd`. Output events arrive concurrently: `contentStart` /
`textOutput` / `audioOutput` / `usageEvent` / `sessionEnd`.

Inference config (`sessionStart`):

```json
{
  "inferenceConfiguration": {
    "maxTokens": 512,
    "temperature": 0.4,
    "topP": 0.9
  }
}
```

Output config (`promptStart`):

- Audio: PCM 24000 Hz, voice `tiffany`, `speakingRate=1.1`
- Text: text/plain
- Tools: empty (see §6.6)

### 6.5 Output handling

- `audioOutput` frames are filtered: only forwarded when the current content block was opened with `type === 'AUDIO'`. Nova Sonic sometimes duplicates audio inside text blocks; the filter prevents the "double voice" bug.
- `textOutput`:
  - **USER role** → always forwarded to widget as `{ type: 'transcript', role: 'customer', text }`.
  - **ASSISTANT role** → buffered, deduplicated against a recent-5 window, flushed at `contentEnd`. The dedupe was added because STT mis-recognition of non-English speech caused Sonic to loop the same response repeatedly.
- **Barge-in**: detected when a USER `contentStart` arrives while an ASSISTANT block is open. Backend fires `onInterruption()` → widget receives `{ type: 'interruption' }` → `PcmPlayer.flush()` drops queued samples.
- **Keepalive**: a `SILENT_PCM` buffer is sent every 5s of inactivity so the bidi stream doesn't time out on quiet calls.

### 6.6 Tools — currently disabled

`toolConfiguration: { tools: [] }`. Per [VOICE_TOOL_SILENT_ISSUE.md](VOICE_TOOL_SILENT_ISSUE.md), declaring any tool on Nova Sonic v1 caused it to silently produce no audio output (regression observed on 2026-05-22). That's the trigger for the new architecture: **voice does Q&A, post-call text-LLM does actions** (see §8).

### 6.7 Hard limits

- **8-minute session cap** per Sonic stream. The legacy widget path **does not** rotate sessions, so calls longer than ~8 min will drop. Pipecat's `SessionContinuationParams` handles this; we don't have it on the live voice path yet.

---

## 7. Agentic configuration

A breakdown of every knob that controls **how Lira behaves** on a voice call:
persona, system prompt, inference parameters, tools, retrieval, escalation,
per-org overrides. Most of these live in code today; making them per-org-tunable
is part of the next phase.

### 7.1 The `settings` object

Defined in [src/models/lira.models.ts:20-28](../../../../creovine-backend/src/models/lira.models.ts#L20-L28) as `DEFAULT_SETTINGS`:

```ts
export const DEFAULT_SETTINGS: MeetingSettings = {
  personality: 'supportive',
  participation_level: 0.6,
  wake_word_enabled: true,
  proactive_suggest: true,
  ai_name: 'Lira',
  voice_id: 'tiffany',
  language: 'en-US',
}
```

This is a **shared object across meetings and support voice** — the type is
literally `MeetingSettings` because the Sonic service was originally built for
meetings. The widget voice route overrides four of them per call at
[lira-support-chat.routes.ts:320-326](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L320-L326):

```ts
const settings = {
  ...DEFAULT_SETTINGS,
  personality: 'supportive',
  wake_word_enabled: false, // 1-on-1 call — always respond
  proactive_suggest: false,
  ai_name: 'Lira',
}
```

What each field controls in the voice path:

| Field                 | Effect on voice                                                                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `personality`         | Picks one of four prompt blocks in [lira-sonic.service.ts:232-257](../../../../creovine-backend/src/services/lira-sonic.service.ts#L232-L257): `supportive` / `challenger` / `facilitator` / `analyst`. Voice always uses `supportive`. |
| `wake_word_enabled`   | When `true`, injects the "name-triggered" listening rules. Voice forces `false` so Lira always responds.                                                                                                                                |
| `proactive_suggest`   | Adds "contribute proactively" language to the prompt. Voice forces `false`.                                                                                                                                                             |
| `ai_name`             | Substituted into the prompt as `${name}`. Default `'Lira'`; no per-org override on the widget today.                                                                                                                                    |
| `voice_id`            | Passed through to Nova Sonic's `audioOutputConfiguration.voiceId`. Default `'tiffany'`.                                                                                                                                                 |
| `participation_level` | Used in meeting prompt only — not surfaced in widget voice prompt.                                                                                                                                                                      |
| `language`            | Used in meeting prompt only — not surfaced in widget voice prompt.                                                                                                                                                                      |

### 7.2 System prompt composition (important gotcha)

The widget voice route builds a hand-tuned support prompt
([lira-support-chat.routes.ts:294-318](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L294-L318))
covering style, what-Lira-does, what-Lira-doesn't-do, end-of-call protocol,
and the KB section.

But it's **not sent as the system prompt directly**. It's passed as the
`orgContextText` argument to `sonic.startSession()`:

```ts
await sonic.startSession(sessionId, sessionId, settings, { ...callbacks }, [], supportPrompt)
//                                                                          ^^^ orgContextText
```

Inside [lira-sonic.service.ts:116-362](../../../../creovine-backend/src/services/lira-sonic.service.ts#L116-L362), `buildSystemPrompt()` checks for two markers in `orgContextText`:

- `'═══ INTERVIEW MODE'` → uses a minimal interview wrapper + appends the text
- otherwise → builds the **full meeting-mode prompt** (identity, voice, engagement, prohibited patterns, rejection awareness, personality, optional wake-word, optional participants) and **appends `orgContextText` as the "ORG CONTEXT" section** ([line 347-348](../../../../creovine-backend/src/services/lira-sonic.service.ts#L347-L348))

**Net effect:** the actual system prompt sent to Nova Sonic for a voice
support call is a **meeting-mode prompt with a support addendum bolted onto
the end**. The meeting framing ("you are a participant in a live meeting
alongside human teammates") is technically wrong for a 1-on-1 support call,
but it hasn't visibly hurt behavior because the support addendum (and the
`wake_word_enabled: false` setting) overrides most of the meeting-specific
rules.

**This is unintentional and worth cleaning up** — a dedicated support-mode
branch in `buildSystemPrompt()` (parallel to the existing interview branch)
is the obvious fix.

### 7.3 Inference parameters

Set at session start, all hard-coded in [lira-sonic.service.ts:372-416](../../../../creovine-backend/src/services/lira-sonic.service.ts#L372-L416):

```ts
sessionStart.inferenceConfiguration = {
  maxTokens: 512,
  temperature: 0.4,
  topP: 0.9,
}

promptStart.audioOutputConfiguration = {
  voiceId: settings.voice_id ?? 'tiffany',
  speakingRate: 1.1,
}
```

Not per-org-tunable today. Pipecat path uses the same defaults via
[pipecat/agent.py:280-296](../../../../creovine-backend/pipecat/agent.py#L280-L296)
but with **Nova Sonic v2** (`amazon.nova-2-sonic-v1:0`) and
`SessionContinuationParams(enabled=True)` for >8-min calls.

### 7.4 Tool catalogue

**Currently empty for voice.** Sent as `toolConfiguration: { tools: [] }`.

The registry exists — see
[src/services/agent-tools/registry.ts](../../../../creovine-backend/src/services/agent-tools/registry.ts)
and [src/services/agent-tools/built-in.ts](../../../../creovine-backend/src/services/agent-tools/built-in.ts)
(`kb_search`, `escalate_to_human`, `set_conversation_summary`, Stripe actions,
password reset, etc.). It's wired into the chat WS today, **off for voice**
per [VOICE_TOOL_SILENT_ISSUE.md](VOICE_TOOL_SILENT_ISSUE.md).

Dispatch protocol (used by Pipecat and intended for the future post-call
processor):

- **Endpoint:** `POST /lira/v1/internal/tools/dispatch` ([lira-internal.routes.ts:188-271](../../../../creovine-backend/src/routes/lira-internal.routes.ts#L188-L271))
- **Auth:** `Authorization: Bearer ${LIRA_INTERNAL_TOKEN}`
- **Payload:** `{ orgId, conversationId, visitorId, toolName, arguments }`
- **Response:** SSE stream — `action_started` → `pin_required?` → `action_completed | action_failed` → `tool_result`
- **Tool context** ([lira-internal.routes.ts:283-308](../../../../creovine-backend/src/routes/lira-internal.routes.ts#L283-L308)): `{ orgId, orgName, config, customer, verified, conversation, kbSearch }`

Tool schemas registered with Pipecat strip Node-only metadata (`hitl`, `async`, `requirePin`, `uiLabel`, `uiIcon`) — the LLM only sees `name`, `description`, `parameters`, `required`. See [pipecat/services/pipecat_tools.py:27-79](../../../../creovine-backend/pipecat/services/pipecat_tools.py#L27-L79).

PIN-gated tools (`requirePin: true`) emit a `pin_required` event mid-stream;
the widget renders a modal; user submits PIN → response routed back over the
SAME voice WS via `sendJson()` (so a voice-issued PIN can't be answered on
the chat channel). The bridge already exists in
[voice.ts:423-484](../../../src/components/support-widget/voice.ts#L423-L484); it just has nothing to bridge yet.

### 7.5 Per-org `SupportConfig`

Stored in DDB, fetched via `configService.getSupportConfig(orgId)`. Schema in
[src/models/lira-support.models.ts](../../../../creovine-backend/src/models/lira-support.models.ts).
Voice-relevant fields:

| Field                         | Default                                | Effect                                                           |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `activated`                   | `false`                                | Master gate — WS closes 4004 if false                            |
| `voice_enabled`               | `false`                                | Widget voice gate — WS closes 4004 if false                      |
| `portal_voice_enabled`        | `false`                                | Separate gate for in-portal voice (different surface)            |
| `greeting_message`            | `"Hello! How can I help?"`             | Widget chat opener (not voice — voice greeting is in the prompt) |
| `confidence_threshold`        | `0.7`                                  | Used by chat/escalation today; voice doesn't read it yet         |
| `force_escalate_intents`      | `['account_security','legal','fraud']` | Auto-escalate if matched (chat today; voice could)               |
| `escalation_slack_channel`    | —                                      | Where escalation notifications go                                |
| `escalation_email`            | —                                      | Email notify on escalation                                       |
| `sla_hours`                   | `4`                                    | SLA target on escalated tickets                                  |
| `max_conversations_per_month` | `500`                                  | Quota                                                            |
| `max_ai_replies_per_month`    | `200`                                  | Quota                                                            |

What's **not yet** per-org configurable for voice but probably should be:
voice persona / voice ID / speaking rate / greeting line / system-prompt
overrides / allowed tool list.

### 7.6 Retrieval — knowledge base injection

The "agentic context" Lira gets is constructed at session start, not retrieved
mid-call:

| Path                   | Query                                                      | Top-K | Where it ends up                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Widget voice           | `"${orgName} company overview features products services"` | **4** | `KNOWLEDGE BASE` section of the support prompt ([routes:264-280](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L264-L280))             |
| Pipecat (chat & voice) | Same generic query                                         | **8** | `systemPromptAddendum` on the session context ([lira-internal.routes.ts:119-131](../../../../creovine-backend/src/routes/lira-internal.routes.ts#L119-L131)) |

Voice was deliberately trimmed from 8 → 4 on 2026-05-23 to shrink the prompt
and stop Nova Sonic from "thinking too long" before flushing audio. See the
comment block at [routes:264-280](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L264-L280).

There's **no mid-call retrieval** today on voice (no `kb_search` tool because
tools are off). Specific lookups will be served by the post-call processor.

### 7.7 Conversation history

Cross-channel: voice and chat share the same `conv_id` for the same customer,
so:

- A returning visitor who chatted yesterday gets that history surfaced when they call today.
- Voice transcripts written on hangup show up in the chat thread (each turn as a separate message tagged `channel: 'voice'`).

For the Pipecat / OpenAI path, prior messages are mapped:

- `customer` → `user`
- `lira` / `agent` → `assistant`

And capped at the **last 40 messages** ([lira-internal.routes.ts:133-162](../../../../creovine-backend/src/routes/lira-internal.routes.ts#L133-L162)) because Nova Sonic degrades on large contexts.

For the legacy direct path, prior history is **not** currently re-injected
into Sonic — each call starts fresh (apart from the KB chunks). This is a
gap.

### 7.8 Escalation triggers

The only "agentic" decision the voice path makes today is whether to escalate.

**Pattern matching** ([routes:502-525](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L502-L525)):

```ts
function voiceReplyIndicatesUnknown(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes("don't know") ||
    lower.includes("don't have") ||
    lower.includes("i'm not sure") ||
    // … plus several more
    lower.includes('let me have someone follow up')
  )
}
```

When Lira's assistant text matches AND the customer actually asked something
(`lastUserUtterance` non-empty), the route silently escalates
([routes:419-427](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L419-L427)):

```ts
escalationService.escalateConversation(orgId, config, {
  conv_id: voiceConv.conv_id,
  customer_id: customerId,
  subject: `Voice call question`,
  reason: `AI could not answer: "${lastUserUtterance.slice(0, 200)}"`,
})
```

Escalation builds a `SupportTicket` with `priority: 'medium'`, `sla_target =
now + config.sla_hours`, fires Slack/Linear/email notifications per the org's
`SupportConfig`, and prevents the conversation from being auto-resolved on
hangup. See [src/services/lira-support-escalation.service.ts:51-90](../../../../creovine-backend/src/services/lira-support-escalation.service.ts#L51-L90).

`force_escalate_intents` exists on the config but isn't read on the voice
path — only on chat. Same with `confidence_threshold`.

### 7.9 Demo agent (Nimbus interactive demo)

When the widget runs on liraintelligence.com's demo page, the browser sends
a JSON message on connect ([voice.ts:384-388](../../../src/components/support-widget/voice.ts#L384-L388)):

```ts
ws.send(JSON.stringify({ type: 'demo_context', profile: demoContext }))
```

The `demoContext` is the visitor's local dashboard snapshot (plan, usage,
mock customer details). On the backend, `lira-demo-context.service.ts`
caches it in memory keyed on the WS connection, and any future tool calls
check `isDemoOrg(orgId)` to mock side-effects instead of hitting Stripe /
DDB. The demo agent's "actions" are pure UI feedback via
`demo_action_executed` events forwarded to the dashboard.

This means **the demo and production paths use the exact same agent
configuration** — same prompt, same model, same settings. The only
difference is the side-effect layer of the tool dispatcher.

### 7.10 Settings that are NOT used on widget voice (but exist in the shared service)

Because the Sonic service is shared with meetings/interviews, several knobs
flow through but don't fire:

| Knob                                                                                                                                | Source                                                                              | Why it doesn't apply                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Wake-word system** ([lira-wakeword.service.ts:21-40](../../../../creovine-backend/src/services/lira-wakeword.service.ts#L21-L40)) | `WAKE_WORD_COOLDOWN_MS`, fuzzy/phonetic name matching, `FUZZY_EXCLUSIONS` blacklist | Voice forces `wake_word_enabled: false` — Lira always responds                |
| **`participation_level`**                                                                                                           | `MeetingSettings`                                                                   | Only read by the meeting prompt builder; not surfaced in the support addendum |
| **`language`**                                                                                                                      | `MeetingSettings`                                                                   | Same — meeting-only                                                           |
| **Multi-participant logic**                                                                                                         | `participantNames` arg to `startSession`                                            | Voice passes `[]` — 1-on-1 call                                               |
| **Personality variants beyond `supportive`**                                                                                        | `personalities` map                                                                 | Voice hard-codes `supportive`; the other three are meeting-only               |

### 7.11 Environment variable overrides

| Variable                                                            | Default                                                               | Path                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- |
| `LIRA_NOVA_SONIC_MODEL_ID`                                          | `amazon.nova-2-sonic-v1:0` (both legacy and Pipecat as of 2026-05-23) | both                               |
| `LIRA_NOVA_SONIC_VOICE`                                             | `tiffany`                                                             | Pipecat only                       |
| `LIRA_BEDROCK_REGION` / `AWS_REGION`                                | `us-east-1`                                                           | both                               |
| `LIRA_OPENAI_CHAT_MODEL`                                            | `gpt-4o`                                                              | Pipecat chat                       |
| `LIRA_INTERNAL_TOKEN`                                               | required                                                              | Pipecat ↔ Node tool bridge         |
| `LIRA_INTERNAL_BASE_URL`                                            | required                                                              | Pipecat ↔ Node tool bridge         |
| `OPENAI_API_KEY`                                                    | required                                                              | Pipecat chat                       |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_SESSION_TOKEN` | conditional                                                           | Pipecat static creds (else IMDSv2) |

### 7.12 Agentic surface — what's truly "agentic" today vs. planned

Today on voice, "agentic" mostly means **a single LLM turn with no tools and
no mid-call retrieval**. Decision points are:

| Decision                | Where                                                                           | How                                                      |
| ----------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| What to say next        | Inside Nova Sonic                                                               | Black box — model decides from prompt + audio history    |
| Whether to escalate     | After each AI turn                                                              | Pattern-match on AI text + customer-asked-question check |
| Whether to interrupt    | Nova Sonic VAD                                                                  | Native to the model                                      |
| Whether to end the call | Customer-initiated; Lira can suggest ("you can hang up") but doesn't disconnect | —                                                        |

**Planned (post-call processor — not built):**

- Read transcript from DDB
- Run a text-LLM (probably OpenAI or Claude) tool loop
- Each iteration: pick a tool from the registry, call `/internal/tools/dispatch`, observe result, decide next action
- Stream each tool's lifecycle into the widget chat thread
- This is where the "agent loop" pattern actually shows up in the system

---

## 8. The architecture decision (2026-05-23) — voice vs. actions split

Captured in [VOICE_CHOPPINESS_INVESTIGATION.md §2](VOICE_CHOPPINESS_INVESTIGATION.md) but restated here because it's load-bearing:

```
LIVE CALL (Nova Sonic, smooth):
  Greet → Listen → Answer KB questions → Capture intent → Summarise → Hang up

POST-CALL (text LLM, deterministic, runs after hang-up):
  Read transcript from DDB → Run tool-call loop → Stream each tool's lifecycle
  into the widget chat ("Cancelling subscription…" → "✅ Cancelled.")
```

**Status:**

- Live voice (Q&A, no actions) — done.
- Post-call processor — **not built yet**. So today: a customer can ask Lira to cancel their plan during a call, Lira will say "got it, you'll see it in chat in a few seconds" — and nothing will actually happen because the post-call processor doesn't exist. **This is the next thing to build.**

---

## 9. Pipecat — what's wired and what isn't

`pipecat/` lives under `creovine-backend/` as a separate Python service.

### 9.1 What's in the folder

| Path                                                              | Role                                                                                              |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [pipecat/agent.py](../../../../creovine-backend/pipecat/agent.py) | FastAPI WebSocket entry point. ~544 lines. Builds one Pipecat pipeline per WS connection.         |
| `pipecat/services/tool_proxy.py`                                  | HTTP client that round-trips tool calls to the Node `/internal/tools/dispatch` endpoint over SSE. |
| `pipecat/services/context_loader.py`                              | HTTP client to the Node `/internal/context/build` endpoint.                                       |
| `pipecat/services/pipecat_tools.py`                               | Registers Node-side tools with the Pipecat LLM services.                                          |
| `pipecat/pyproject.toml`                                          | `uv`-managed deps; `pipecat-ai` with `nova-sonic`, `openai`, `websocket` extras.                  |
| `pipecat/Dockerfile`                                              | Multi-stage Python 3.13-slim + ffmpeg.                                                            |
| `pipecat/systemd/`, `pipecat/deploy-systemd.sh`                   | EC2 deployment as `lira-pipecat.service`.                                                         |
| `pipecat/nginx/`                                                  | nginx vhost snippet.                                                                              |

### 9.2 Pipeline composition

```
transport.input()
  → rtvi (Pipecat ↔ widget RTVI protocol bridge)
  → user_aggregator (VAD-segmented utterances)
  → llm (AWSNovaSonicLLMService for voice, OpenAILLMService for chat)
  → transport.output()
  → assistant_aggregator (metrics)
```

- **VAD**: `SileroVADAnalyzer` (lightweight, ~1-2ms). We explicitly chose Silero over Pipecat's default `LocalSmartTurnAnalyzerV3` to keep per-chunk latency low.
- **Voice LLM**: `AWSNovaSonicLLMService` with `amazon.nova-2-sonic-v1:0` (note: **v2**, vs. v1 on the legacy direct path).
- **Chat LLM**: `OpenAILLMService` with `gpt-4o`.
- **Tools**: registered on both services; execution proxied to Node.

### 9.3 What's actually running where

| Surface          | Today                                                                                                               | Plan                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Widget **chat**  | Pipecat (behind a feature flag, recent commit `f4c054a feat(widget): pipecat chat transport + voice quality fixes`) | Keep                                                                |
| Widget **voice** | **Legacy direct Nova Sonic path** (this document's main subject)                                                    | Move to Pipecat once choppiness is resolved and tools are unblocked |
| PSTN voice       | Legacy direct path                                                                                                  | Move to Pipecat                                                     |

Pipecat-for-voice was paused mid-migration because of (a) the voice
choppiness regression and (b) the Nova Sonic tools-silent issue. Both are
documented in their own files.

---

## 10. Infrastructure

### 10.1 Compute

**One EC2 instance.** Everything backend runs here.

- **Type**: `t3.small` (2 vCPU, 1.9 GB RAM)
- **Storage**: 50 GB EBS gp3
- **IP**: Elastic IP `32.195.87.5`
- **Region**: `us-east-1`
- **OS**: Amazon Linux 2023
- **AWS profile** (local ops): `creovine` — never `default`, that's a different account

Services running on it:

- `creovine-api.service` — Node 20 / Fastify backend (systemd)
- `lira-pipecat.service` — Python 3.13 / FastAPI Pipecat agent (systemd, chat-only today)
- `nginx` — TLS termination, WS upgrade proxy
- `qdrant` — vector DB, single-node Docker container, data on EBS

### 10.2 External services

| Service                  | Used for                                                                                     | Notes                                                                             |
| ------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **AWS Bedrock**          | Nova Sonic bidi inference; eventual text-LLM for post-call processing                        | us-east-1                                                                         |
| **DynamoDB**             | Conversations, customers, orgs, visitors, KB metadata                                        | Accessed via Prisma where possible; native DDB client for voice transcript writes |
| **S3**                   | Widget JS bundle (CDN-fronted at `widget.liraintelligence.com`); future call recordings      |                                                                                   |
| **Qdrant** (self-hosted) | KB vector search (`searchForContext`)                                                        | Pre-loaded with org KB chunks                                                     |
| **Twilio**               | PSTN voice ingress (the other voice path)                                                    | Media Streams → our WS                                                            |
| **Vercel**               | Frontend hosting for [lira-ai](../../../) (Next.js + the embed demo at liraintelligence.com) |                                                                                   |

### 10.3 Deployment

- **Local-only policy**: see `feedback_deployment.md`. Nothing is pushed/deployed without explicit user approval.
- **Backend**: `git push` → SSH into EC2 → `git pull` → `pnpm build` → `sudo systemctl restart creovine-api`.
- **Pipecat**: similar, but `uv sync` then `sudo systemctl restart lira-pipecat`.
- **Widget**: built into `lira-ai`'s static assets, uploaded to S3.
- **Frontend (Next.js)**: Vercel auto-deploy on push to `main`.

### 10.4 Observability

- **Logs**: `journalctl -u creovine-api`, `journalctl -u lira-pipecat`.
- **Metrics**: Pipecat collects `enable_metrics=True` in-pipeline but there's no exporter yet — they sit in the process.
- **CloudWatch**: not integrated. Logs stay on EBS.
- **No APM**, no Sentry, no Datadog — yet.

---

## 11. Scalability ceiling — and what breaks first

Everything is **single-process, single-instance, all-in-memory**.

| Resource                                           | Lives in                            | Breaks when                                                                      |
| -------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| `activeSessions` Map                               | Sonic service in-memory             | EC2 process dies → all active calls drop                                         |
| `widgetConnections` / `customerActiveSession` Maps | Chat service in-memory              | Same                                                                             |
| KB embeddings                                      | Qdrant on local EBS                 | EBS volume goes (snapshots help)                                                 |
| Conversations / customers                          | DDB                                 | Resilient                                                                        |
| **Concurrent calls cap**                           | t3.small RAM (~5-10 MB per session) | ~150-200 active sessions before swap/OOM                                         |
| **Bedrock concurrency**                            | AWS account quota                   | Default Nova Sonic concurrent stream quota — check Service Quotas before scaling |

To scale horizontally we'd need: distributed session store (Redis), sticky
sessions at the load balancer (or session-handoff over the bus), and a way to
migrate active Bedrock streams between processes (currently impossible — a
bidi stream is tied to the process that opened it). The path of least
resistance is **partition by org**: each org gets routed to a specific node.

---

## 12. Demo vs production paths

The interactive demo at liraintelligence.com (Nimbus dashboard) shares the
same widget code and the same WS path. The only differences:

| Concern           | Production embed                                   | Demo embed                                                                            |
| ----------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `visitorId`       | UUID in `localStorage`, persistent across sessions | UUID in `sessionStorage`, ephemeral                                                   |
| `demoContext`     | undefined                                          | object pushed as `{ type: 'demo_context', profile }` on `ws.onopen`                   |
| Customer record   | DDB row                                            | Backend caches profile in-memory (no DDB write)                                       |
| Tool side effects | Real (Stripe, DDB writes, etc.)                    | Mocked — emits `demo_action_executed` so the dashboard re-renders, but no real charge |
| Action card UI    | Same — widget doesn't know it's a demo             | Same                                                                                  |

The `demo_action_executed` and `lira-voice-widget-event` CustomEvents
([voice.ts:415-444](../../../src/components/support-widget/voice.ts#L415-L444))
are the bridge between the voice WS and the React dashboard on the demo page.

---

## 13. Known issues & open work

1. **Voice choppiness on KB answers** — open. See [VOICE_CHOPPINESS_INVESTIGATION.md](VOICE_CHOPPINESS_INVESTIGATION.md). Mitigated by trimming KB context to 4 chunks; root cause not pinned.
2. **Nova Sonic tools-silent regression** — see [VOICE_TOOL_SILENT_ISSUE.md](VOICE_TOOL_SILENT_ISSUE.md). Tools are off; new architecture works around it by punting actions to post-call.
3. **Post-call action processor — not built.** Voice captures intent but can't execute. **This is the next build.**
4. **No session continuation** on the legacy path — calls drop at 8 min.
5. **Single-process state** — caps concurrency and means a restart kills all live calls.
6. **No observability beyond journalctl** — metrics, traces, error reporting all TBD.

---

## 14. File map (quick reference)

**Browser (lira-ai):**

- [src/components/support-widget/voice.ts](../../../src/components/support-widget/voice.ts) — the entire voice client

**Backend (creovine-backend):**

- [src/routes/lira-support-chat.routes.ts:180-473](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts#L180-L473) — widget voice WS handler
- [src/services/lira-sonic.service.ts](../../../../creovine-backend/src/services/lira-sonic.service.ts) — Nova Sonic bidi wrapper
- [src/services/lira-support-chat.service.ts](../../../../creovine-backend/src/services/lira-support-chat.service.ts) — in-memory connection maps
- [src/routes/lira-support-voice.routes.ts](../../../../creovine-backend/src/routes/lira-support-voice.routes.ts) — PSTN/Twilio voice (separate path)
- [pipecat/agent.py](../../../../creovine-backend/pipecat/agent.py) — Pipecat agent (chat-only today)

**Docs:**

- [VOICE_CHOPPINESS_INVESTIGATION.md](VOICE_CHOPPINESS_INVESTIGATION.md) — open issue
- [VOICE_TOOL_SILENT_ISSUE.md](VOICE_TOOL_SILENT_ISSUE.md) — Nova Sonic regression
- [PIPECAT_MIGRATION_PLAN.md](PIPECAT_MIGRATION_PLAN.md) — target state
