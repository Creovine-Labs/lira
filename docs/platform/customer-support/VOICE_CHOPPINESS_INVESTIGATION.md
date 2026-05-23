# Voice Choppiness — Investigation & Architecture Doc

**Status:** Unresolved as of 2026-05-23. Voice cracks/stutters when Lira speaks, especially on longer answers. Multiple fixes tried, problem persists. Document is for the user to review with fresh eyes / pull in another opinion / hand off to a different engineer.

---

## 1. Product context

Lira is a **B2B customer-support AI agent** that embeds as a widget on customer websites. It has two channels:

- **Chat** — text-based, customer types, AI types back. Tools (Stripe actions, password reset, escalation, KB search, etc.) execute live.
- **Voice** — customer clicks "Call", browser captures mic, speaks to AI in real time, AI speaks back.

Voice is the differentiator. Chat is table stakes.

## 2. New architecture decision (2026-05-23)

After hitting persistent voice quality issues during the migration to Pipecat, we re-architected the voice path:

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  VOICE (live, must be smooth)                              │
│    Browser ─wss─> EC2 (Node) ─bidi-stream─> AWS Bedrock    │
│                                            (Nova Sonic v2) │
│                                                            │
│    What happens on the call:                               │
│      • Lira greets, listens, answers KB-grounded questions │
│      • Lira does NOT execute tools / actions live          │
│      • Lira summarises action intent at end-of-call        │
│      • Lira says "I'll process these in the chat below"    │
│      • User (or Lira) hangs up                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  POST-CALL (text-based, deterministic, takes a few sec)    │
│    EC2 reads voice transcript from DDB                     │
│    Text LLM (OpenAI / Bedrock text) runs a tool-call loop  │
│    Each tool's lifecycle streams into the widget chat:     │
│      "Cancelling subscription…" → "✅ Cancelled."          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Why this split?** Voice has tight timing (sub-100ms per audio chunk). Trying to run tool calls (which take 500ms–5s) inside the voice loop introduces audio pauses. Separating them means each AI does what it's best at.

**Current implementation status:**

- ✅ Voice = legacy direct path to Nova Sonic (no Pipecat)
- ✅ Voice system prompt rewritten (capture intent, summarise, defer to chat)
- ❌ Post-call processor (text-LLM tool loop reading the transcript) — **not built yet**
- ❌ Widget chat side rendering post-call action lifecycle — **not built yet**
- ❌ Voice transcript persistence improvements — partial (legacy already saves on hang-up)

So right now: voice can do conversation, but actions won't execute even after hang-up because the post-call processor doesn't exist yet. We were going to build it next. **But voice quality regressed before we got there.**

## 3. The voice issue

**Symptom:** Lira's voice output cracks / stutters / cuts mid-word. Worse on longer answers (e.g. anything that pulls from the KB). Greetings and short replies sound fine.

**User's exact observation (2026-05-23):**

> When I am trying to access knowledge from the database or the knowledge base… it started to crack. But prior to that, it was pretty fluent… The greetings, the hello there and everything was smooth. Also, when I told it about like when it said it didn't have some information, it was smooth. But then when I start to ask it for actual data, it starts to crack.

**Important reference point:** voice was **smooth for months** on this same EC2 hardware, same AWS account, same network — before the migration began. So the regression came from changes WE made, not from environment.

## 4. Architecture stack (voice path, current)

```
Browser
  └─ Web Audio API: AudioContext @ 24kHz
       PcmPlayer with jitter buffer of 350ms leadtime
       Source: lira-ai/src/components/support-widget/voice.ts

Native WebSocket → wss://api.creovine.com/lira/v1/support/chat/voice/:orgId

EC2 (32.195.87.5, t3.small, 2 vCPU, 1.9GB RAM, 50GB EBS)
  └─ creovine-api.service (Node 20, Fastify)
       └─ lira-support-chat.routes.ts handles the WS
       └─ lira-sonic.service.ts forwards audio bidi to Bedrock
            Source: creovine-backend/src/services/lira-sonic.service.ts

AWS Bedrock
  └─ amazon.nova-2-sonic-v1:0 in us-east-1
       Input: PCM Linear16, 16 kHz, mono
       Output: PCM Linear16, 24 kHz, mono
```

The path is intentionally simple — Node just relays audio bytes both directions, almost no CPU work in the middle.

Other things running on the same EC2:
- lira-pipecat.service (Python, ~244 MB) — used for chat sessions
- qdrant Docker container (vector DB, ~120 MB)
- nginx
- system services

Total memory typically: 1.6 GB used / 1.9 GB total. Free: ~100-300 MB.

## 5. What we've tried (chronologically)

| # | Hypothesis | Action | Result |
|---|---|---|---|
| 1 | Pipecat overhead is causing it | Routed voice through Pipecat with full stack | **Worse** (heavier than legacy) |
| 2 | WavMediaManager (DailyMediaManager actually) was wrong choice | Forced Pipecat to use WavMediaManager | Voice connected but still choppy |
| 3 | Smart Turn ONNX is too heavy | Disabled it | **Much worse** (broke audio flow) |
| 4 | Smart Turn ONNX still too heavy, swap for Silero VAD | Swapped to SileroVADAnalyzer | Still choppy |
| 5 | Pipecat itself is the problem | Rolled voice all the way back to legacy direct-Nova-Sonic path | **Better but initial cracks remained** |
| 6 | EBS at 89% causing swap/cache pressure | Resized 8→50 GB (cleared 75% disk) | Some improvement |
| 7 | Pipecat process competing for RAM | Stopped lira-pipecat during voice test | Slightly better but still some cracks |
| 8 | Jitter buffer 120 ms too small for v2's bursty output | Bumped widget jitter buffer 120 → 350 ms | **🎯 Voice smooth!** User confirmed. |
| 9 | Wrote new (longer) voice system prompt for post-call architecture | Deployed | **❌ Choppy again** |
| 10 | The longer prompt is making Nova Sonic think more → burstier audio | Cut prompt by ~60%, KB results 8→4 | **Still choppy** (user just confirmed) |

### What we ruled out

- ✅ Not a Pipecat-specific issue (legacy path is also choppy now)
- ✅ Not a network jitter issue (jitter buffer is large)
- ✅ Not the user's MacBook (server generates the audio — every client would experience the same)
- ✅ Not new AWS account / new EC2 hardware needed (was smooth months ago on same)

### What we did NOT rule out

- ❓ Cumulative EC2 resource pressure now vs months ago (more processes running, more memory pressure)
- ❓ Nova Sonic v2's streaming behaviour vs v1 (forced switch — v1 was deprecated)
- ❓ Something subtle in the recent Node deploy that changed how creovine-api handles the WS
- ❓ The Pipecat Python process *still being on the box* contributes to CPU/RAM contention even when not in active use
- ❓ Bedrock-side issue (regional latency, account-level throttling on Nova Sonic — but no error logs to confirm)
- ❓ Conversation history accumulating in Nova Sonic session causing longer per-turn inference

## 6. Key suspect: prompt size / Nova Sonic v2 bursty output

The strongest correlation we observed:

- **Short prompts + short answers** → smooth
- **Long prompts OR long answers** → cracks

Hypothesis: Nova Sonic v2 generates audio in **bursts** — model thinks for some tokens, flushes audio, thinks more, flushes more. The bigger the response, the more pause-burst-pause-burst pattern. The widget's jitter buffer absorbs short pauses but not long ones.

What we tried:
- 120 → 350 ms jitter buffer ✓ (smoothed for short prompt)
- Trimmed prompt by 60% ✗ (still choppy after trim)

What we have not tried:
- Even larger jitter buffer (500 ms, 750 ms, 1 s)
- Truncating conversation history sent back to Nova Sonic per turn
- A different output sample rate
- Testing with the *original* (pre-migration) prompt verbatim, to see if the prompt's content matters or just length
- Network capture (Wireshark-style) of exact chunk timing browser-side

## 7. The frustrating part

The voice WAS smooth a few hours ago (step 8 above). Something between then and now regressed it. The only changes in between:

1. Node redeploy with new (longer) voice prompt → reverted by step 10 trim
2. Cross-channel context code in `/internal/context/build` → not on the voice path
3. Pipecat agent restart (no source changes since)
4. Git commit + push (no functional change)

Even after trimming the prompt back (step 10), voice didn't return to smooth. That suggests the prompt size theory is partially right but not the only factor.

**Open theory:** Nova Sonic Session State accumulates *per-session* state (conversation history, AWS-side context). Maybe each subsequent test is creating heavier sessions on Bedrock's side, and a fresh session would be smooth. We could test by reloading the page completely (fresh WS, fresh Bedrock session).

## 8. Code references

**Voice path (legacy, currently in use):**
- WS endpoint definition: [`creovine-backend/src/routes/lira-support-chat.routes.ts`](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts) — see `fastify.get('/voice/:orgId'...)` around line 178
- Nova Sonic streaming: [`creovine-backend/src/services/lira-sonic.service.ts`](../../../../creovine-backend/src/services/lira-sonic.service.ts)
- Audio I/O config: [`creovine-backend/src/models/lira.models.ts`](../../../../creovine-backend/src/models/lira.models.ts) — `AUDIO_INPUT_CONFIG` / `AUDIO_OUTPUT_CONFIG`
- Current voice system prompt: same as WS endpoint, look for `supportPrompt = ...`

**Browser side:**
- Voice call manager + audio playback: [`lira-ai/src/components/support-widget/voice.ts`](../../src/components/support-widget/voice.ts)
- Jitter buffer constant: `PcmPlayer.LEADTIME_SEC` (currently 0.35)
- Widget overall entry: [`lira-ai/src/components/support-widget/widget.ts`](../../src/components/support-widget/widget.ts), see `startVoiceCall()`

**Pipecat (chat only, NOT on the voice path):**
- Agent: `creovine-backend/pipecat/agent.py`
- Internal routes for tools / context: `creovine-backend/src/routes/lira-internal.routes.ts`

**Migration plan with phases:** [`PIPECAT_MIGRATION_PLAN.md`](./PIPECAT_MIGRATION_PLAN.md) — Phase 4 (AgentCore Runtime) was the original "production target" for voice. We deferred it because the EC2 free-plan blocks instance changes, AND because the post-call architecture (this doc, §2) may make AgentCore unnecessary if we don't need real-time tools in voice.

## 9. Decisions made (so the next reader doesn't redo them)

- Voice always uses the legacy direct-Nova-Sonic path. Pipecat is **chat-only**. This is forced in `widget.ts startVoiceCall()` — the `?pipecat=1` URL flag is ignored for voice on purpose.
- AWS Free Plan upgrade is **not done**. Blocks: changing instance type (m6i.large was the proposed bigger box), and may block AgentCore Runtime.
- Elastic IP `32.195.87.5` is attached to the instance. Don't stop the instance without an EIP (you lose the IP).
- DNS A record for `api.creovine.com` has TTL=60 (lowered for the EIP migration). Bump it back to 1800 once you're sure no more IP changes are coming.
- Cross-channel context (text → voice) IS working through Pipecat chat. The legacy voice path does NOT yet load prior chat messages into Nova Sonic — that's a different code path that needs the same treatment.

## 10. Possible next steps (for fresh perspective)

In rough order of "least invasive" to "most invasive":

| Option | Cost | What it tells us |
|---|---|---|
| **A. Test with a completely fresh page reload** (new tab, no session history) | 0 min | Whether per-session state on Bedrock is contributing |
| **B. Even larger jitter buffer (500–750 ms)** | 5 min | Whether v2's bursts are simply longer than 350 ms |
| **C. Diff today's `supportPrompt` against the version on git HEAD pre-this-session** | 10 min | Is there something *specific* in the prompt content (not size) that triggers bursts? |
| **D. Restore the exact pre-migration prompt and config** | 20 min | Whether prompt content is irrelevant and the issue is elsewhere |
| **E. Stop Pipecat permanently + restart Node** | 5 min | Whether cumulative process memory pressure (not just CPU) is the cause |
| **F. Capture audio chunk arrival timing browser-side** | 30 min | Direct evidence of gap durations between Nova Sonic chunks |
| **G. Server-side log: time between each chunk written to the WS** | 30 min | Whether bursts are originating on Bedrock or in transit |
| **H. Upgrade AWS Free Plan → m6i.large EC2 (~$55/mo extra, flat)** | 15 min + downtime | Throwing hardware at it. If it doesn't fix voice, we know it's not resources. |
| **I. AgentCore Runtime deployment (Phase 4)** | 1–2 days | Dedicated container per call. Costly time investment if the issue isn't compute. |
| **J. Switch from Nova Sonic to Pipecat's recommended STT + LLM + TTS stack** | 1–2 days | Different audio architecture; smooth on small EC2 per Pipecat docs. But different voice character. |

## 11. The user's frustration (worth recording)

The user has spent a full day on voice quality, made multiple compromises (EBS upgrade, EIP allocation, DNS TTL changes, accepting Pipecat-for-chat-only, accepting post-call instead of real-time tool execution), and we are still here. **Multiple fixes I claimed would work didn't.** They asked for a write-up so they can step back and bring a fresh perspective. That request itself is the right move — I have been too in-the-weeds to spot what's actually causing the recurrence.

If a different engineer or AI picks this up: don't keep guessing. Pick one of options F or G from §10 first — **measure the actual chunk timing** before proposing any more fixes. Everything else has been theoretical.

---

*Written 2026-05-23 by the AI pair working with the user on the Pipecat migration. Voice was confirmed smooth at one point during this session (after step 8 in §5) and then regressed without an obvious single trigger.*
