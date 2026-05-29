# Lira AI — Pipecat Migration Plan

**Status:** Active. Phase 1 starts 2026-05-22.
**Owner:** Adna Labs / Claude
**Estimated duration:** 5 weeks (1 phase/week, with the user's AI-assisted velocity likely compressing this).
**Backup branch:** `backup/pre-pipecat-2026-05-22` (snapshot of current main before any migration code lands).

---

## Why we're doing this

Today's voice + chat realtime layer is ~3,500 lines of hand-rolled WebSocket-protocol code that reinvents primitives Pipecat ships as defaults (AWS Nova Sonic 8-min session continuation, client-ready handshake, typed app-message channel, async tool lifecycle, barge-in, parallel tool grouping). The current architecture has been bug-prone all session — every fix exposes another race. **Pipecat is the production-grade open-source framework for exactly this use case**, has tier-1 AWS Nova Sonic 2 support, runs on raw WebSocket (no forced WebRTC), and deploys natively on AWS Bedrock AgentCore Runtime.

**Decision rationale** (from the architectural audit, 2026-05-22):

- LiveKit Agents JS has **zero** AWS / Bedrock / Nova Sonic plugins — only the Python version does. Becoming the maintainer of an unblessed plugin is the worst long-term posture.
- Pipecat's `AWSNovaSonicLLMService` defaults to `amazon.nova-2-sonic-v1:0` (exactly our model) and bakes in the 8-minute session-continuation pattern we do not yet have.
- Pipecat's `OpenAILLMService` runs in the same pipeline → one agent, two transports (chat + voice), unified tool registry.
- AWS Bedrock AgentCore Runtime is the documented deployment target — AWS-native end-to-end, fits compliance constraints.

---

## Architecture after migration

```
┌─────────────────────────────────────────────────────────────────────┐
│  WIDGET (TypeScript, vanilla, Vite — same repo: lira-ai)            │
│  • @pipecat-ai/client-js + @pipecat-ai/websocket-transport          │
│  • Existing chat UI, action cards, PIN modal, escalation banner     │
│  • Single WS connection (replaces today's chat-WS + voice-WS pair)  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ pipecat WebSocket (RTVI-typed protocol)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PIPECAT AGENT (Python — new service, creovine-backend/pipecat/)    │
│  • AWSNovaSonicLLMService (voice)                                   │
│  • OpenAILLMService (chat)                                          │
│  • Stateless. Tool handlers are HTTP proxies to Node.               │
│  • Deployed in: AWS Bedrock AgentCore Runtime                       │
└──────────────┬──────────────────────────────┬──────────────────────┘
               │ HTTP                          │ HTTP
               │ POST /internal/tools/dispatch │ POST /internal/context/build
               ▼                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  FASTIFY NODE BACKEND (largely unchanged — creovine-backend/)       │
│  • Tool registry (agent-tools/), action-dispatcher (kept verbatim)  │
│  • DynamoDB conversation/customer/profile persistence               │
│  • Knowledge base vector search (Qdrant)                            │
│  • Escalation flow, CSAT, follow-ups, FCM, email reply              │
│  • ~40 of ~50 HTTP routes unchanged                                 │
└─────────────────────────────────────────────────────────────────────┘
```

Key principle: **Python owns the realtime protocol. Node owns the domain.** Adding a new tool, changing a prompt, updating a customer profile — all happens in Node. The Python service is a thin orchestration shell.

---

## What dies, what stays

### Dies (~3,500 LOC of bug-prone infra we shouldn't own)

- `creovine-backend/src/services/lira-sonic.service.ts` (1,904 lines) — replaced by `AWSNovaSonicLLMService` settings
- `creovine-backend/src/services/lira-bot/audio-bridge.ts`, `meeting-bot.ts` — meeting-product code; if kept, moved to a separate package
- `creovine-backend/src/services/lira-support-agent.service.ts` — chat agent loop, replaced by `OpenAILLMService`
- `creovine-backend/src/services/lira-wakeword.service.ts` — meeting-only feature; support never needed it
- `creovine-backend/src/routes/lira-support-chat.routes.ts` — the WebSocket handlers (~700 lines); kept only the HTTP widget-config + history endpoints
- `lira-ai/src/components/support-widget/voice.ts:247-330` — voice WS message handling + CustomEvent re-broadcast
- `lira-ai/src/components/support-widget/socket.ts` — chat WS handling
- `lira-ai/src/components/support-widget/widget.ts:303-365` — `lira-voice-widget-event` listener bridge

### Stays (the actually-good ~80% of the support product)

- **All** of `creovine-backend/src/services/agent-tools/` — types, registry, packs (built-in, stripe, demo), pack-config. Multi-tenant pack enablement, auth-scope filtering — kept as-is.
- `creovine-backend/src/services/agent-tools/action-dispatcher.ts` — kept verbatim. We just swap the `ActionEventSink` implementation from "WS JSON send" to "HTTP server-sent event back to the Pipecat agent."
- `creovine-backend/src/services/lira-vector-search.service.ts` — KB search with Qdrant + DDB fallback
- `creovine-backend/src/services/lira-support-escalation.service.ts` — human handoff
- `creovine-backend/src/services/lira-support-conversation.service.ts` — DDB persistence
- `creovine-backend/src/services/lira-support-customer.service.ts` — customer profile lookup
- `creovine-backend/src/services/lira-demo-*.service.ts` — demo profile (still client-side, with server cache as best-effort)
- All Fastify HTTP routes that aren't the chat/voice WebSocket — config, customers, inbox, tool-packs, actions, analytics, push, email, CSAT, portal, admin (~40 routes)
- Widget chat UI, action card renderer, PIN modal, escalation banner — only the transport layer changes
- HMAC widget signing (moves to a new endpoint that returns a signed Pipecat connect URL)

---

## Phases

Each phase has: **goal**, **tasks**, **deliverables**, **verification**, **rollback**. Phases land sequentially; the legacy code stays behind a feature flag until Phase 4.

---

### Phase 1 — Scaffold (Week 1)

**Goal:** Stand up the Python service skeleton + the Node internal endpoints it needs. Nothing in production touches Pipecat yet.

#### Tasks

1.1. **Create backup branch** `backup/pre-pipecat-2026-05-22` from current `main`. Push to origin.

1.2. **Create `creovine-backend/pipecat/` directory** with this structure:

```
creovine-backend/pipecat/
├── pyproject.toml          # uv-managed Python deps
├── Dockerfile              # for AgentCore deployment later
├── .env.example            # Pipecat-specific env vars
├── README.md               # how to run locally
├── agent.py                # the Pipecat agent entrypoint
├── services/
│   ├── __init__.py
│   ├── nova_sonic.py       # thin wrapper around AWSNovaSonicLLMService
│   ├── openai_chat.py      # thin wrapper around OpenAILLMService
│   ├── tool_proxy.py       # HTTP client to Node /internal/tools/dispatch
│   ├── context_loader.py   # HTTP client to Node /internal/context/build
│   └── pin_gate.py         # PIN-as-tool implementation (client-side tool)
├── prompts/
│   ├── system_voice.py     # voice system prompt
│   └── system_chat.py      # chat system prompt
└── tests/
    └── test_tool_proxy.py
```

1.3. **Pin Pipecat version** in `pyproject.toml`. Use the latest release tag (resolve from cloned `/tmp/audit-pipecat/pipecat/pyproject.toml`).

1.4. **Create Node internal endpoints** (in `creovine-backend/src/routes/lira-internal.routes.ts`):

- `POST /lira/v1/internal/tools/dispatch` — accepts `{ orgId, conversationId, toolName, input, actionId }`, routes through existing `dispatchTool(...)` from `action-dispatcher.ts`, returns the `ToolResult`. **Action events** (`pin_required`, `action_started`, `action_completed`, `action_failed`) are streamed back as Server-Sent Events (SSE) on the same response.
- `POST /lira/v1/internal/context/build` — accepts `{ orgId, conversationId, visitorId, channel }`, returns `{ orgName, supportConfig, customer, demoProfile, kbContextText, enabledPacks }`. The Python agent calls this once at session start to populate the system prompt and tool ctx.
- These endpoints are **only reachable from inside the VPC / by the Pipecat agent**. Auth via shared secret in `LIRA_INTERNAL_TOKEN` env var (matches the pattern in other internal endpoints).

  1.5. **Local dev story.** Add `docker-compose.pipecat.yml` (or extend existing `docker-compose.yml`) so a developer can run Postgres + Node backend + Pipecat agent locally with one command. The Pipecat agent uses `tsx watch`-equivalent (`uvicorn --reload` or `python -m pipecat run --watch`).

  1.6. **Stub agent.py** that:

- Opens a WebSocket transport (no Daily/WebRTC needed — `WebsocketServerTransport`)
- Echoes user input via `OpenAILLMService` with no tools registered yet
- Connects to Bedrock Nova Sonic via `AWSNovaSonicLLMService` (voice still mute since no tools)
- Verify: send a message via the Pipecat Python client → get a chat completion back. No tools, no PIN — just a sanity check that the framework is wired up.

#### Deliverables

- `creovine-backend/pipecat/` exists with skeleton files
- `creovine-backend/src/routes/lira-internal.routes.ts` registered in Fastify
- `docker-compose.pipecat.yml` brings up the agent locally
- A `curl`-able demonstration that Node's `/internal/context/build` and `/internal/tools/dispatch` work

#### Verification

- [ ] `python -m pipecat run` starts the agent locally without error
- [ ] `curl http://localhost:8000/health` returns 200
- [ ] Sending an OpenAI chat message via the Pipecat client returns a response
- [ ] `curl -X POST http://localhost:3000/lira/v1/internal/context/build -H "Authorization: Bearer $LIRA_INTERNAL_TOKEN" -d '{"orgId":"org-...", ...}'` returns a valid context object
- [ ] Tests pass: `pytest creovine-backend/pipecat/tests/`

#### Rollback

- Phase 1 changes are additive only. No production code is touched. If Phase 1 fails, the new files can be deleted and the backup branch is untouched.

---

### Phase 2 — Voice E2E on staging (Week 2)

**Goal:** A working voice call from widget → Pipecat agent → Nova Sonic → tool dispatch → Node → action card in widget. All on staging, behind a feature flag in the widget.

#### Tasks

2.1. **Wire `AWSNovaSonicLLMService`** in `agent.py` with `model="amazon.nova-2-sonic-v1:0"` and `SessionContinuationParams` (8-min rotation).

2.2. **Implement `tool_proxy.py`** — for each tool in our registry (fetched at startup from Node via `/internal/tools/list`), register a Pipecat function that:

- Calls `/internal/tools/dispatch` over HTTP
- Streams SSE events (`pin_required`, `action_started`, ...) and re-emits them via `rtvi.send_server_message(...)`
- Returns the final `ToolResult.summary` via `result_callback`

  2.3. **Implement `pin_gate.py`** — PIN-as-tool. When Node emits `pin_required` SSE event, the Python agent calls a client-side tool that the widget responds to. Pipecat handles this natively via `_handle_function_call_result` (from the audit). No more `pendingPins` Map.

  2.4. **Widget client changes** (in `lira-ai/src/components/support-widget/`):

- Add `pipecat-transport.ts` — wraps `@pipecat-ai/client-js` + `@pipecat-ai/websocket-transport`
- New `WidgetConfig.pipecatEnabled` flag (defaults to false initially, env-toggled)
- When enabled, mic click opens Pipecat WS instead of legacy voice WS
- Action card + PIN modal handlers reuse existing UI but consume Pipecat's typed `server-message` events
- Legacy `voice.ts` + `socket.ts` stay intact behind the flag

  2.5. **Staging deployment.** Stand up the Python service on staging (Fargate behind ALB initially — AgentCore deployment is Phase 4). Get a real `wss://` URL the staging widget can hit.

  2.6. **Test matrix:**

- Voice → "What's my plan?" → KB search → spoken answer ✓
- Voice → "Upgrade me to Business" → verbal confirm → PIN modal → 0000 → action card → dashboard update ✓
- Voice → "Cancel my subscription" → PIN flow → action card ✓
- Voice → 9-minute conversation → session continuation rotates without dropping audio ✓
- Voice → barge-in (user interrupts mid-response) → AI stops cleanly ✓
- Voice → "Talk to a human" → escalation triggers ✓

#### Deliverables

- Staging Pipecat agent reachable via wss://
- Widget feature-flag toggle
- All voice test-matrix cases passing on staging

#### Verification

- [ ] All test matrix items pass on staging
- [ ] Backend logs show no errors during a 10-minute voice conversation
- [ ] Action card progresses pending → success in real time
- [ ] PIN modal pops within 500ms of model calling the tool
- [ ] Dashboard plan badge updates within 1s of `action_completed`

#### Rollback

- Feature flag stays off in production
- Legacy `lira-sonic.service.ts` + WS routes still serve all production traffic
- Pipecat service can be left running on staging or torn down

---

### Phase 3 — Chat path migration (Week 3)

**Goal:** Chat (text) flows through the same Pipecat agent. One pipeline, two transports (voice via Nova Sonic, chat via OpenAI). Tools, prompts, action lifecycle: identical.

#### Tasks

3.1. **Register `OpenAILLMService`** in `agent.py` alongside Nova Sonic. Pipecat allows multiple LLM services in one pipeline.

3.2. **Move chat system prompt** from `creovine-backend/src/routes/lira-support-chat.routes.ts` into `pipecat/prompts/system_chat.py`. The Node `/internal/context/build` endpoint still produces the dynamic context (KB, customer profile, etc.).

3.3. **Widget chat path uses Pipecat transport.** Currently chat is its own WebSocket (`socket.ts`). Migrate to use the same Pipecat client.

3.4. **Test matrix:**

- Type "What's my plan?" → KB search → text answer ✓
- Type "Upgrade me to Business" → confirm card → click Approve → PIN modal → action card → dashboard update ✓
- All existing chat test cases from DOGFOOD_TEST_SCRIPT.md ✓

  3.5. **Cut chat traffic to Pipecat on staging.** Feature flag off → cut over for staging only. Production still on legacy.

#### Deliverables

- One Pipecat agent serves both voice and chat on staging
- Chat test matrix passes
- Legacy chat WS code is dormant on staging

#### Verification

- [ ] Chat test matrix passes
- [ ] No regressions vs legacy chat path
- [ ] System prompt + KB context behavior matches existing production

#### Rollback

- Toggle widget feature flag back to legacy chat WS path
- Legacy code is untouched in this phase

---

### Phase 4 — Production deployment + legacy code deletion (Week 4)

**Goal:** Pipecat agent live on production via AWS Bedrock AgentCore Runtime. Legacy voice + chat WS code deleted. Feature flag removed.

#### Tasks

4.1. **AWS Bedrock AgentCore setup.** Use the deployment template from `/tmp/audit-pipecat/pipecat-examples/deployment/aws-agentcore-websocket/`:

- Create IAM role with `BedrockAgentCoreFullAccess` (scoped to our resources)
- ECR repo for the Pipecat agent image
- Push image, create AgentCore Runtime resource
- New Fastify endpoint `POST /lira/v1/support/voice/connect-url` returns a SigV4-signed `wss://bedrock-agentcore.{region}.amazonaws.com/...` URL the widget connects to

  4.2. **Production widget update:**

- Build + deploy widget to S3 CDN with Pipecat transport as default (feature flag now defaults true)
- Vercel deploy of `lira-ai` (the demo page)

  4.3. **Gradual cutover.** First 24 hours: widget uses Pipecat for new sessions only; existing in-flight legacy sessions allowed to finish. Monitor:

- Pipecat agent health
- Bedrock invocation success rate
- Tool dispatch latency (Node side)
- Widget-side error rate

  4.4. **Delete legacy code** once 48 hours of production stability:

- `lira-sonic.service.ts`
- `lira-support-agent.service.ts` chat agent loop
- `lira-support-chat.routes.ts` WS handlers (keep HTTP endpoints)
- Widget: `voice.ts` (most of it), `socket.ts`
- All `lira-voice-widget-event` CustomEvent code in `widget.ts`

  4.5. **Remove feature flag** and the conditional code paths.

#### Deliverables

- Pipecat agent live on Bedrock AgentCore in production
- Widget hits production agent by default
- 3,500 LOC deleted from repo
- Migration complete

#### Verification

- [ ] 48 hours of production traffic without major incident
- [ ] No regression in voice quality, latency, or tool success rate
- [ ] Legacy code paths fully removed
- [ ] Repo size measurably smaller

#### Rollback

- Roll widget back to feature-flag-on legacy mode (one-line widget change)
- Pipecat agent stays running; legacy WS handlers still in code temporarily
- If during the 48h watch window: feature flag back to legacy + investigate

---

### Phase 5 — Hardening + multi-tenant load + telemetry (Week 5)

**Goal:** Production ready for paying customers. Observability in place. Performance verified.

#### Tasks

5.1. **Multi-tenant load test.** Simulate 50 concurrent orgs × 5 conversations each. Pipecat agents are stateless processes; AgentCore handles isolation. Verify:

- No cross-tenant data leakage
- Per-org rate limits work
- Bedrock concurrency limits not hit

  5.2. **Telemetry pipeline.** Pipecat emits `RealtimeModelMetrics` (TTFB, audio duration, token counts) — pipe into our existing analytics service. Per-org dashboards.

  5.3. **Error handling polish:**

- Pipecat agent restarts gracefully (AgentCore handles)
- Tool dispatch failures degrade gracefully (Lira says "let me get the team to look at this")
- Bedrock throttling backs off with verbal acknowledgment

  5.4. **Cost monitoring.** Bedrock cost per conversation, AgentCore runtime cost. Per-org attribution.

  5.5. **Documentation update:**

- `docs/platform/customer-support/ARCHITECTURE.md` — new architecture diagram
- `docs/platform/customer-support/DOGFOOD_TEST_SCRIPT.md` — update for Pipecat flow
- `creovine-backend/pipecat/README.md` — local dev, deploy, debug
- Update onboarding docs for new engineers

#### Deliverables

- Load test results documented
- Telemetry dashboards live
- Error handling verified
- Cost dashboards live
- Docs updated

#### Verification

- [ ] 50-org × 5-conv load test passes with no errors
- [ ] Latency at p99 within targets (voice < 2s TTFB, chat < 5s)
- [ ] Cost per conversation logged and within forecast
- [ ] Documentation reviewed and merged

#### Rollback

- N/A — this is the post-migration hardening phase

---

## Reference repos (cloned for live consultation during implementation)

These will be re-cloned to `/tmp/` during implementation. Authoritative source for any "how does X work in Pipecat?" question.

- **Pipecat core:** `https://github.com/pipecat-ai/pipecat`
- **Pipecat examples:** `https://github.com/pipecat-ai/pipecat-examples`
  - Key file: `examples/realtime/realtime-aws-nova-sonic-async-tool.py` — direct template for our agent
  - Key file: `examples/deployment/aws-agentcore-websocket/` — production deployment template
  - Key file: `examples/websocket/server/bot_websocket_server.py` — raw WebSocket transport (no Daily required)
- **AWS Nova samples:** `https://github.com/aws-samples/amazon-nova-samples`
  - Key file: `speech-to-speech/repeatable-patterns/customer-service/` — customer support reference for tool patterns
- **Pipecat client web:** `https://github.com/pipecat-ai/pipecat-client-web`
  - Key file: TypeScript client SDK used by the widget

---

## Risks (ranked by likelihood × impact)

1. **HTTP hop per tool call adds 10-30ms latency** (medium likelihood, low impact)
   - **Mitigation:** Move read-heavy tools (`kb_search`, `get_customer_profile`) into Pipecat as direct Python helpers that hit DynamoDB. Writes stay in Node.

2. **Bedrock AgentCore Runtime is new (GA late 2025)** (medium likelihood, medium impact)
   - The deployment template explicitly says it doesn't address auth, logging, rate limiting, CORS, input validation. We'll own those.
   - **Mitigation:** Fallback to plain Fargate behind ALB — same Pipecat agent, well-trodden path.

3. **ToolResult schema drift between Python and TS** (low likelihood, medium impact)
   - **Mitigation:** Single source-of-truth JSON Schema for `ToolResult`, validated by `ajv` (Node) and `pydantic` (Python).

4. **Python service operational overhead** (low likelihood, low impact)
   - Logging, monitoring, deploys are now bilingual.
   - **Mitigation:** Pipecat agent is a single container; use the same CloudWatch logs and AlarmManager already in use for the Node service.

5. **Pipecat upstream breaking changes** (low likelihood, medium impact)
   - Pipecat is pre-1.0 and evolving rapidly.
   - **Mitigation:** Pin to a tagged release. Subscribe to release notes. Test upgrades on staging before production. Track changes in `/tmp/audit-pipecat/pipecat/CHANGELOG.md`.

---

## Decision log

- **2026-05-22 — Initial decision.** User approved Pipecat migration over (a) 4 hand-rolled fixes and (b) LiveKit Agents Node. Audit verdict: Pipecat Python agent + Fastify Node backend. Backup branch created from `main` before any migration code lands. Repo structure: subdirectory `creovine-backend/pipecat/`.

(Add new entries here as decisions are made during implementation.)

---

## Open questions

- [ ] **Local dev: Python version.** Pin to 3.12? 3.11? Check Pipecat's minimum.
- [ ] **Internal endpoint auth.** Shared secret in `LIRA_INTERNAL_TOKEN`, or SigV4 if the agent calls from a known VPC?
- [ ] **Pipecat transport for staging.** Stick with raw WebSocket for the staging phase, or move to AgentCore-signed URLs from day 1?
- [ ] **Meeting bot product (lira-bot/).** Currently shares Sonic code with support. Migrate separately, or move it out of `creovine-backend` entirely?

Resolve these during Phase 1.
