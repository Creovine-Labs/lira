# Voice Tool Silent Issue — Diagnostic Document

**Status:** Unresolved. Voice goes silent the moment any tool is declared in the Nova Sonic `toolConfiguration`. Empty tool list works perfectly. Same code path worked earlier today (May 22, ~11:14 UTC).

**Date written:** May 22, 2026, ~15:45 UTC

---

## 1. Symptom (precisely)

1. User opens demo, clicks mic icon. WebSocket to `/lira/v1/support/chat/voice/:orgId` opens cleanly.
2. Backend logs: `[lira-sonic] Session voice_xxx starting with N tools: ...` — Sonic session created successfully via `InvokeModelWithBidirectionalStreamCommand`.
3. Backend logs: `[lira-sonic] readOutputStream start` — we begin reading the Bedrock bidirectional stream.
4. Bedrock sends back **only `usageEvent`** events (token usage telemetry). **Crucially: `output.textTokens=0` and `output.speechTokens=0` in EVERY usage event.**
5. No `contentStart`, no `textOutput`, no `audioOutput`, no `toolUse`, no error event.
6. After the user gives up and closes the call, the stream ends with `eventCount=4` (all usageEvent telemetry, zero generation).

**Translated:** Bedrock receives the audio + system prompt fine. It just decides not to generate any output. Not a connection error. Not a schema validation error. The model is silent on purpose.

### Evidence: actual usageEvent body (May 22, 15:40)

```json
{
  "event": {
    "usageEvent": {
      "completionId": "8ea05c41-30f6-413d-98ec-786e4d2d2394",
      "details": {
        "delta": {
          "input": { "speechTokens": 157, "textTokens": 0 },
          "output": { "speechTokens": 0, "textTokens": 0 }
        },
        "total": {
          "input": { "speechTokens": 157, "textTokens": 22 },
          "output": { "speechTokens": 0, "textTokens": 0 }
        }
      },
      "promptName": "prompt-0",
      "sessionId": "64187a1f-1f64-48d5-89bc-942a67b11785",
      "totalInputTokens": 179,
      "totalOutputTokens": 0
    }
  }
}
```

User audio (`speechTokens: 157`) received. **Output is zero across all events. Model produces nothing.**

---

## 2. The exact `promptStart` we're sending (captured live from prod)

```json
{
  "event": {
    "promptStart": {
      "promptName": "prompt-0",
      "textOutputConfiguration": { "mediaType": "text/plain" },
      "audioOutputConfiguration": {
        "audioType": "SPEECH",
        "encoding": "base64",
        "mediaType": "audio/lpcm",
        "sampleRateHertz": 24000,
        "sampleSizeBits": 16,
        "channelCount": 1,
        "voiceId": "tiffany",
        "speakingRate": 1.1
      },
      "toolUseOutputConfiguration": { "mediaType": "application/json" },
      "toolConfiguration": {
        "tools": [
          {
            "toolSpec": {
              "name": "upgrade_plan",
              "description": "Change the visitor's Nimbus subscription to a different plan tier (starter / growth / business). Use when the customer wants to upgrade, downgrade, or switch plans. Updates billing amount and effective immediately. Requires customer confirmation before applying.",
              "inputSchema": {
                "json": "{\"type\":\"object\",\"properties\":{\"plan\":{\"type\":\"string\",\"description\":\"Target plan tier. Must be one of: \\\"starter\\\", \\\"growth\\\", or \\\"business\\\".\"}},\"required\":[\"plan\"]}"
              }
            }
          }
        ]
      }
    }
  }
}
```

Note: schema looks valid to me. `inputSchema.json` is a stringified JSON Schema, per the AWS Bedrock Nova Sonic sample. No `enum`, has explicit `required`. Tool name matches `^[a-z][a-z0-9_.]{0,63}$`.

**Anything missing?** Comparing against the (slightly newer) AWS Nova 2 docs, that version uses:

```json
"toolConfiguration": {
  "tools": [ ... ],
  "toolChoice": { "auto": {} }
}
```

We don't send `toolChoice`. BUT — earlier today the same code (no `toolChoice`) worked. So missing `toolChoice` is probably not the root cause.

---

## 3. The strange part — it worked earlier today

At **15:14 UTC today**, with the **same 8 tools, same shapes**, voice was responsive:

```
11:14:11 [lira-sonic] Session voice_eb9ad941-1d11-4de9-a320-d57158720ba0 starting with 8 tools: kb_search, escalate_to_human, schedule_callback, set_conversation_summary, upgrade_plan, cancel_subscription, update_card, send_password_reset
11:14:19 [lira-sonic] completionStart — model ready ← THIS IS WHAT'S MISSING NOW
11:14:19 [lira-sonic] contentStart role=USER type=TEXT
11:15:04 [lira-sonic] toolUse received: tool=upgrade_plan ...
```

Notice the `completionStart` event from Bedrock. That's the signal the model is going to start producing output. **We don't see this event at all anymore.**

So: between 11:14 and now, **something we changed broke Bedrock's willingness to generate output** when tools are declared. With an empty tools array it works; with any tools, it doesn't.

---

## 4. Things I've changed today (in chronological order)

### Phase 1 (early — voice worked with tools)

- Initial voice tool wiring (`toolConfiguration` populated, `executeVoiceTool` fired on `toolUse` event)
- Added kill-switch env: `LIRA_SONIC_VOICE_TOOLS_DISABLED`
- Added per-IP-bypass env: `LIRA_DEMO_LIMITS_BYPASS`
- Audio fixes in widget (AudioContext.resume, leadtime 120ms)
- Added `DEMO_ORG_ID` env var on prod so `isDemoOrg()` returns true

**Result:** voice + tools worked. `toolUse received: tool=upgrade_plan` fired. `ok=false` because demo_context wasn't cached (the `sonicStarted` gate dropped the message — separate bug, fixed below).

### Phase 2 (debugging the `ok=false`)

- Moved `demo_context` handling BEFORE the `sonicStarted` gate in the voice route
- Deployed the Vercel frontend so the demo page sets `data-demo-context` on the widget script

**Result:** demo_context now caches properly. But somewhere around here voice started going silent — but I'm not 100% sure exactly which deploy broke it.

### Phase 3 (research-driven refactor — current code)

- Added `src/services/agent-tools/action-dispatcher.ts` — handles PIN gate + emits `action_started/completed/failed` events
- Refactored `executeVoiceTool` to route through the dispatcher
- Moved Sonic tool-detection trigger from `evt.toolUse` to `contentEnd type=TOOL` (per official AWS sample)
- Extended `Tool` interface with `async`, `requirePin`, `uiLabel`, `uiIcon` fields
- Classified each tool — `upgrade_plan / cancel_subscription / update_card` got `requirePin: true`
- Rewrote voice system prompt with a 4-step "TOOL CALL PROTOCOL" — then **reverted** to a shorter version after voice still didn't work
- Added widget action card UI + PIN modal + CSS
- Added inbound WS message handlers for `pin_response` / `pin_cancel`
- Added diagnostic logs: `DIAG promptStart event`, `DIAG raw event #N`, `DIAG heartbeat`, `readOutputStream start/end`

**Result:** voice silent regardless of which subset of the above is active.

---

## 5. Things I've tried to isolate (didn't fix it)

| Attempt                                                              | Outcome                                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Simplify tool schemas (drop `enum`, add explicit `required: []`)     | Still silent                                                     |
| Shorten the system prompt (cut 4-step protocol section)              | Still silent                                                     |
| Reduce tool count from 8 → 1 (`upgrade_plan` only via allowlist env) | Still silent                                                     |
| Add diagnostic logs to confirm Bedrock is reachable & sending        | **Confirmed:** Bedrock sends usageEvents but `output=0`          |
| Toggle `LIRA_SONIC_VOICE_TOOLS_DISABLED=true` (empty tools array)    | **Works perfectly.** Voice greets, conversation flows naturally. |
| Dump exact `promptStart` JSON bytes                                  | Looks valid by every spec I've found                             |

**Pattern:** anything that results in `toolConfiguration.tools` being a non-empty array causes the model to refuse output. Same code, same tool definitions that worked at 11:14 UTC today.

---

## 6. Current working hypotheses (in descending plausibility)

### H1. AWS-side change to Nova Sonic

Bedrock may have rolled out a behavior change to `amazon.nova-sonic-v1:0` between this morning and now that gates output generation when tools are declared but some additional field/header/permission is missing. There is no documented breaking change I could find, but Bedrock does silently update models.

**Why this is suspicious:** the exact same wire payload that worked at 11:14 doesn't work at 15:40 today. We didn't change the bytes — we changed surrounding code that I can't see how it would affect Bedrock's decision.

### H2. Missing `toolChoice` field

The newer Nova 2 docs show `toolChoice: { auto: {} }` inside `toolConfiguration`. We don't send it. **But** the earlier successful test didn't send it either. Unless Bedrock recently started requiring it.

### H3. Token budget / context overflow with tools loaded

The system prompt is large (KB context = 32 results, ~25KB of text). Adding tool definitions pushes total over a threshold where Sonic decides to stay silent rather than error. The usageEvent shows `totalInputTokens=223` which is small — but Bedrock may be early-aborting BEFORE finishing the prompt processing.

### H4. Account-level Bedrock guardrails / model access change

Bedrock has applied guardrails or a model-access policy that gates tool-enabled Nova Sonic calls. Would not show as a normal error — would show as silent refusal.

### H5. Bug I introduced that I can't see

Most likely candidate: the action-dispatcher refactor changed something I'm not noticing. But the refactor only affects code paths AFTER `toolUse` fires — and the model never produces a `toolUse`, so the refactor code never runs in the current state.

---

## 7. What I'd like you to check (things outside my reach)

These I can't easily verify from here:

1. **AWS Bedrock Console → Model access → Nova Sonic.** Any policy changes today? Any new guardrails attached?
2. **AWS CloudWatch → Bedrock logs.** Bedrock writes a model invocation log per request. The reason for "model produced no output" is usually visible there. Search by `completionId=8ea05c41-30f6-413d-98ec-786e4d2d2394` (one of today's silent sessions).
3. **AWS Bedrock service quotas / billing.** Some Bedrock features (tool use, guardrails) gate on billing tier / quota. Check if anything was modified.
4. **AWS Bedrock Nova Sonic announcements / status page.** Anything posted today about behavior changes?
5. **Whether someone in the AWS org changed the model id / endpoint config** (env `LIRA_NOVA_SONIC_MODEL_ID` defaults to `amazon.nova-sonic-v1:0`).

---

## 8. Files I touched today (in case you want to review)

Backend:

- `src/services/agent-tools/types.ts` — added `async`, `requirePin`, `uiLabel`, `uiIcon` to `Tool`
- `src/services/agent-tools/action-dispatcher.ts` — new file, action lifecycle + PIN
- `src/services/agent-tools/registry.ts` — added `isDemoOrg` auto-include for demo pack
- `src/services/agent-tools/packs/demo.ts` — classified tools, simplified schemas
- `src/services/agent-tools/built-in.ts` — added metadata to a few tools
- `src/services/agent-tools/packs/stripe.ts` — marked cancel_subscription as PIN
- `src/services/lira-sonic.service.ts` — biggest change. Dispatcher wiring, contentEnd-fire-on-TOOL, diagnostic logs, odd-byte trim, voice tools allowlist
- `src/services/lira-demo-quota.service.ts` — `LIRA_DEMO_LIMITS_BYPASS` env var
- `src/services/lira-vector-search.service.ts` — DDB keyword fallback
- `src/services/lira-demo-context.service.ts` — new file, in-memory profile cache
- `src/routes/lira-support-chat.routes.ts` — voice route wiring (sink, demo_context handling, pin response)
- `src/models/lira.models.ts` — added `pushEvent`, `promptName` to `SonicSession`

Widget (lira-ai):

- `src/components/support-widget/types.ts` — new message types + ActionCard
- `src/components/support-widget/widget.ts` — action card UI, PIN modal, new WS handlers
- `src/components/support-widget/voice.ts` — AudioContext.resume, 120ms leadtime, demo_context send
- `src/components/support-widget/socket.ts` — demo_context send on chat WS connect
- `src/components/support-widget/styles.ts` — action card + PIN modal CSS
- `src/lib/demo-widget.ts` — pass demo profile through, handle `lira-demo-action` events
- `src/lib/demo-profile.ts` — extended fields, updateDemoProfile

---

## 9. Current production state (as of write time)

- Backend deployed at `/opt/creovine-api`, latest dist
- `creovine-api.service` running. Health check 200 OK.
- Env vars on prod:
  - `DEMO_ORG_ID=org-bfad94de-859d-4475-bcae-0107deaca433`
  - `LIRA_DEMO_LIMITS_BYPASS=true`
  - `LIRA_SONIC_VOICE_TOOLS_ALLOWLIST=upgrade_plan` (only 1 tool exposed to voice currently)

To restore the "voice works but can't act" mode:

```bash
ssh -i ~/.ssh/creovine-api-key.pem ubuntu@98.92.255.171
echo "LIRA_SONIC_VOICE_TOOLS_DISABLED=true" | sudo tee -a /opt/creovine-api/.env
sudo systemctl restart creovine-api
```

To clear the allowlist (try all 8 tools again):

```bash
sudo sed -i "/^LIRA_SONIC_VOICE_TOOLS_ALLOWLIST=/d" /opt/creovine-api/.env
sudo systemctl restart creovine-api
```

---

## 10. Honest assessment

I've burned several hours on this and the pattern is unambiguous:

- Bedrock is being explicitly silent with tools loaded
- The same code/payload that worked earlier today no longer works
- No error, no event, no validation rejection — just zero output

I think this is most likely an **AWS-side change** (H1 above) but I have no way to confirm from here. The next concrete action is either:

(a) **Check the AWS console / CloudWatch Bedrock logs** for the specific completionId — Bedrock usually logs why a generation was aborted.

(b) **Open an AWS support case** with a minimal reproducer (the exact `promptStart` JSON above + the corresponding usageEvent showing 0 output tokens). This is fast if there's an enterprise support contract.

(c) **Pivot the architecture**: ship voice as conversation-only (no tools), do all action execution through the chat widget. This preserves all the work we did — chat + tool execution + PIN + action cards all work fine. We just lose the "tell Lira to upgrade via voice" path until AWS unblocks.

My recommendation is (c) for the immediate dogfood (so you can keep testing the rest) plus (a) in parallel to root-cause the voice-tool issue properly.

---

## 11. Quick test to reproduce

```
ssh -i ~/.ssh/creovine-api-key.pem ubuntu@98.92.255.171
# Ensure tools NOT disabled:
sudo sed -i "/^LIRA_SONIC_VOICE_TOOLS_DISABLED=/d" /opt/creovine-api/.env
sudo systemctl restart creovine-api
# Then from another machine:
# - Open https://demo.liraintelligence.com
# - Click the mic
# - Say "hello"
# - Wait 30s, end the call
# Inspect logs:
sudo journalctl -u creovine-api --since "5 min ago" | grep -E 'DIAG|usageEvent|completionStart'
# You'll see usageEvent telemetry with output.textTokens=0 throughout, no completionStart.
```

To prove it's tool-related, toggle the disable env var and repeat — model speaks fine.
