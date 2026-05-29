# Backend integration audit — voice, chat, KB

> **Version:** 1.0 — 2026-05-22
> **Purpose:** Snapshot of how Lira's three core AI subsystems work today. Use this as the reference when deciding where to plug demo dashboard data so the AI can reason about a visitor's account.
> **Audience:** Eng, Product.

---

## 1. Nova Sonic voice integration

### Entry point

WebSocket route at `/lira/v1/support/chat/voice/:orgId` in
[creovine-backend/src/routes/lira-support-chat.routes.ts](../../../../creovine-backend/src/routes/lira-support-chat.routes.ts) (lines 260–569).

Query params: `visitorId` (optional). The handler:

1. Demo-org IP session quota check (Phase 0 guards)
2. Voice-enabled check (demo orgs get synthetic `voice_enabled=true`)
3. Resolves/creates a customer + voice conversation
4. Calls `sonic.startSession()` to hand off to Bedrock

### AWS Bedrock handoff

[creovine-backend/src/services/lira-sonic.service.ts](../../../../creovine-backend/src/services/lira-sonic.service.ts):

| Setting          | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **AWS client**   | `@aws-sdk/client-bedrock-runtime` → `BedrockRuntimeClient`                |
| **Region**       | `LIRA_BEDROCK_REGION` env, default `us-east-1`                            |
| **Model**        | `LIRA_NOVA_SONIC_MODEL_ID` env, default `'amazon.nova-sonic-v1:0'`        |
| **Protocol**     | `InvokeModelWithBidirectionalStreamCommand` with event-based message flow |
| **Input audio**  | PCM Linear16, 16 kHz, mono                                                |
| **Output audio** | PCM Linear16, 24 kHz, mono                                                |

### Voice system prompt

Generated **per call** inline in `lira-support-chat.routes.ts` lines 409–436. Distinct from chat:

- Hardcoded per-session, never persisted
- Stateless KB injection: pre-loaded with top-8 chunks from `searchForContext(orgId, "{orgName} company overview features products services", 8)` BEFORE the call starts
- Strong anti-hallucination guardrails ("ONLY answer using the KNOWLEDGE BASE below…")
- Brevity rules: 1–3 sentences per turn
- Explicit prohibition on "let me check" pretense (no fake system access)

KB context is loaded **once** at session start. Not refreshed mid-call.

### Tools for voice

**Voice does not call tools.** The `toolConfiguration` passed to Nova Sonic at line 499 is an empty array:

```
await sonic.startSession(sessionId, sessionId, settings, callbacks, [], supportPrompt);
//                                                                  ^^ no tools
```

Escalation is _implicit_: `voiceReplyIndicatesUnknown()` (lines 598–629) detects "I don't know"-shaped phrases in Lira's output and silently routes the conversation to the human queue via `escalationService.escalateConversation()`. No confirm flow, no tool invocation.

### Transcript persistence

In-memory array (`transcript: Array<{ role, text }>`) accumulates as Nova Sonic emits `textOutput` events. On session end, `saveVoiceTranscript()` (lines 511–531) appends each turn to the conversation row in DynamoDB with `channel: 'voice'`.

DDB key shape:

```
PK: ORG#<orgId>   SK: SUPPORT_CONV#<convId>
```

### Lifecycle

| Phase                | Mechanism                                                                                                                                                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Barge-in**         | `assistantWasOutputting` flag in [lira-sonic.service.ts](../../../../creovine-backend/src/services/lira-sonic.service.ts) line 638. New user `contentStart` while assistant is still emitting → `onInterruption()` callback fires (line 706). Browser stops playback. |
| **End-of-turn**      | `contentEnd` for ASSISTANT AUDIO block (lines 836–856). Audio bridge clears echo gate; wake-word timer refreshes for follow-up window.                                                                                                                                |
| **Escalation paths** | (1) silent "I don't know" trigger; (2) user says "speak to someone"; (3) demo voice-budget cap hit → polite cap message                                                                                                                                               |

---

## 2. OpenAI chat agent + tool system

### Entry point

WebSocket at `/lira/v1/support/chat/ws/:orgId` →
[creovine-backend/src/services/lira-support-chat.service.ts](../../../../creovine-backend/src/services/lira-support-chat.service.ts) `handleChatConnection()` (line 175):

1. Validates org chat-enabled config
2. Resolves customer (by email → visitor_id → anonymous)
3. Finds/creates conversation (can reopen resolved/escalated within 7 days)
4. Registers WS in `widgetConnections` map for push replies
5. Sends welcome + history

### Pipeline: `runAIReply()` (lines 539–774)

```
customer message
   ↓
searchForContext(orgId, message, 8)        ← RAG: top 8 KB chunks
   ↓
classifierService.classifyIntent(...)      ← intent + sentiment + confidence
   ↓
force-escalate intent? → escalate
confidence < threshold? → escalate
   ↓
agentService.runAgent({ orgId, customer, conversation, demoProfile })
```

### Agent runtime

[creovine-backend/src/services/lira-support-agent.service.ts](../../../../creovine-backend/src/services/lira-support-agent.service.ts) `runAgent()` lines 141–320.

| Setting          | Value                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| **Model**        | `LIRA_AGENT_MODEL` env, default `'gpt-4o'` (line 57)                  |
| **Max steps**    | 5 (line 56) — loop terminates after 5 iterations to prevent cascades  |
| **Tool calling** | Native OpenAI function calling via `tool_calls` in streamed responses |

System prompt built by `buildInitialMessages()` (lines 349–412):

```
You are {orgName}'s autonomous support agent on a live chat widget.

Visitor: Alice <alice@…> [VERIFIED], tier=Growth.
Auth scope: verified_customer.

AVAILABLE TOOLS
- kb_search: …
- get_customer_profile: …
- escalate_to_human: …
- create_ticket: …
- schedule_callback: …
- set_conversation_summary: …
[+ stripe tools when stripe pack enabled]

OPERATING RULES
1. ALWAYS call kb_search before answering any factual question…
2. For verified customers asking about their account…
[10 rules total]

{demoPersonaAddendum}  ← only when isDemoOrg(orgId)
{profileToPromptFacts(demoProfile)}  ← only when isDemoOrg + visitor has synthetic profile
```

### Auth scope ladder

Computed by `deriveAuthScope({ verified, hasCustomerEmail })`:

| Scope               | When                        |
| ------------------- | --------------------------- |
| `public`            | Anyone, no auth             |
| `verified_visitor`  | HMAC-signed visitor         |
| `verified_customer` | HMAC-signed + email on file |

Each tool declares its required scope. Insufficient scope → tool not exposed to the agent.

### Built-in tools

[creovine-backend/src/services/agent-tools/built-in.ts](../../../../creovine-backend/src/services/agent-tools/built-in.ts):

| Tool                       | Scope             | HITL    | Purpose                                                 |
| -------------------------- | ----------------- | ------- | ------------------------------------------------------- |
| `kb_search`                | public            | auto    | Hybrid semantic+keyword search over Qdrant vector store |
| `get_customer_profile`     | verified_customer | auto    | Fetch name/email/tier/stats                             |
| `escalate_to_human`        | public            | human   | Hand off to human queue                                 |
| `create_ticket`            | verified_visitor  | confirm | Create tracked ticket — requires customer approval      |
| `schedule_callback`        | public            | confirm | Request human callback                                  |
| `set_conversation_summary` | public            | auto    | Persist summary before resolve                          |

**Stripe pack** (optional, per-org): `stripe_get_customer`, `stripe_get_subscription`, `stripe_cancel_subscription`, `stripe_refund_charge`. All scope `verified_customer`.

### HITL gating

Three modes:

| Mode      | Behavior                                                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `auto`    | Execute immediately, append result to messages, continue loop                                                                        |
| `confirm` | Persist pending state to DDB, send confirm card to widget, exit loop. Resumed by `resumeAgent()` when customer clicks Approve/Cancel |
| `human`   | Used only by `escalate_to_human` — execute immediately, then break loop                                                              |

### Demo-only behavior

When `isDemoOrg(orgId)`:

- **Persona addendum** via `buildDemoPersonaAddendum()` lines 424–445 — adds D1–D5 rules (KB-grounded answers, Lira meta-reveal, PII guard, concise replies, opt-in email capture)
- **Synthetic profile injection** via `profileToPromptFacts()` — renders the visitor's test-profile facts (name, plan, signup date, last invoice, etc.) directly into the system prompt as a structured block

---

## 3. Knowledge base — ingestion + retrieval

### Three ingestion paths

| Path                | Service                                                                                              | What it does                                                                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Web crawl**       | [lira-crawl.service.ts](../../../../creovine-backend/src/services/lira-crawl.service.ts)             | Async worker. Fetches robots.txt, BFS up to N pages at depth D. Cheerio extraction (strips nav/footer/scripts, reformats FAQs). Per-page GPT-4o-mini summarizes + extracts keywords + guesses category. Chunks, embeds, indexes. |
| **Document upload** | [lira-doc-extract.service.ts](../../../../creovine-backend/src/services/lira-doc-extract.service.ts) | DOCX (Mammoth), TXT, MD, CSV, XLSX (SheetJS in worker thread) → plain text → chunk → embed → index                                                                                                                               |
| **Manual/API**      | `lira-org-store.service`                                                                             | Direct insert via admin endpoints                                                                                                                                                                                                |

### Storage architecture

**Vector store: Qdrant**

- Default URL: `http://localhost:6333`
- Collection: `lira_org_embeddings`
- Vectors: 1536-dim, OpenAI `text-embedding-3-small`
- Distance: cosine similarity
- Payloads: `org_id`, `text`, `source_type` (document|website), `source_id`, `file_name`, `page_title`, `chunk_index`, `category`, `keywords`
- Indexed filters: `org_id`, `source_type`, `source_id`
- Fail-soft: if Qdrant is down, returns empty (no DDB keyword fallback yet)

**Document metadata: DynamoDB**

- Table: `lira-organizations` (same as everything else)
- SK pattern: `KB#<docId>` for KB rows (extracted text, source type, upload date, category)

### Chunking strategy

[lira-doc-chunk.service.ts](../../../../creovine-backend/src/services/lira-doc-chunk.service.ts):

```
Tier 1: paragraph boundaries (double newlines)
Tier 2: sentence boundaries (if paragraph > 512 tokens)
Tier 3: token-count force-split (if a sentence is huge)
```

| Constant             | Value                                              |
| -------------------- | -------------------------------------------------- |
| MAX_TOKENS per chunk | 512                                                |
| OVERLAP_TOKENS       | 50 (prepended from previous chunk, except FAQ Q&A) |
| MIN_CHUNK_TOKENS     | 20 (merge tiny chunks with previous)               |
| Token estimation     | `max(chars/4, words * 1.3)` heuristic              |

**FAQ handling:** `^Q:\s` pattern → each Q&A becomes its own chunk, never merged.

**Contextual prefix:** Each chunk embedded with `[Source: <filename> — <section>]` prefix, stripped before display to LLM (line 243).

### Embedding generation

[lira-embedding.service.ts](../../../../creovine-backend/src/services/lira-embedding.service.ts):

- Model: OpenAI `text-embedding-3-small` (1536 dims)
- Batch: up to 100 texts per request
- Retry: exponential backoff (5 attempts, 500ms base) on 429/5xx

### Retrieval — `searchForContext()`

[lira-vector-search.service.ts](../../../../creovine-backend/src/services/lira-vector-search.service.ts) — alias for `hybridSearch()` (lines 278–311):

```
1. generateEmbedding(query)              → 1536-dim vector
2. Qdrant search: candidate pool = 32, score_threshold = 0.25
3. Keyword boost: per query word (len>2) that appears in candidate text,
   +15% × query_coverage
4. Re-rank by boosted score, return top N
```

No LLM reranking, no cross-encoder. Just embedding + keyword boost.

### When RAG fires

| Path      | Where                                   | When                                                                                                         |
| --------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Chat**  | `lira-support-chat.service.ts` line 559 | Every customer message → `searchForContext(orgId, message, 8)`                                               |
| **Voice** | `lira-support-chat.routes.ts` line 400  | Once, before session starts → `searchForContext(orgId, "{org} overview", 8)`. Stays in static system prompt. |
| **Tool**  | `kb_search` invoked by agent            | Agent-driven, on-demand within the OpenAI loop                                                               |

### Nimbus demo KB seeding

The demo org's KB is seeded by **web-crawling the prerendered Nimbus HTML** ([seo-prerender.cjs](../../../seo-prerender.cjs) at the lira-ai repo level — the static HTML the crawler generates for the demo subdomain). When admin enables crawl for the Nimbus org:

1. Fetches `https://nimbus-demo…/` (or configured base URL)
2. BFS up to 10 pages, depth 2
3. Summarizes + keywords + category per page
4. Chunks + embeds → 40–100 vectors land in Qdrant
5. DDB gets the metadata rows

No manual upload for the demo. The Nimbus marketing copy IS the KB.

---

## 4. Wiring opportunities — where dashboard data plugs in

The frontend now has rich client-side data (invoices, customers, expenses, plan, card, subscription status) keyed to a visitor's demo profile. Three paths to make this AI-reachable:

### Path 1 — Extend the synthetic profile (lowest effort, recommended for demo)

Today `SyntheticNimbusProfile` already injects facts into the system prompt via `profileToPromptFacts()`. Extend it with the dashboard data:

```ts
export interface SyntheticNimbusProfile {
  // existing fields
  invoices?: Array<{
    id: string
    date: string
    amount_usd: number
    status: string
    customer: string
  }>
  expenses?: Array<{
    id: string
    category: string
    vendor: string
    amount_usd: number
    date: string
  }>
  customers?: Array<{ name: string; email: string; plan: string; status: string }>
  integrations?: Array<{ name: string; status: string }>
  card?: { brand: string; last4: string; exp: string }
  subscription_status?: 'active' | 'canceled'
}
```

Then in `profileToPromptFacts()`, summarize each list:

```ts
if (profile.invoices?.length) {
  const recent = profile.invoices.slice(0, 5)
  lines.push(
    `  - Recent invoices: ${recent.map((i) => `#${i.id} ${i.customer} $${i.amount_usd} ${i.status}`).join('; ')}`
  )
}
```

The agent reads them from the system prompt. No tool call needed. Works today.

**Caveat:** Currently the synthetic profile is minted server-side in
[lira-demo-profile.service.ts](../../../../creovine-backend/src/services/lira-demo-profile.service.ts) and the frontend mints client-side (post the no-backend pivot). For this path to work, EITHER:

- Re-sync the client profile back to the server on creation (fire-and-forget POST)
- OR pass dashboard data via the widget's `data-context` attribute (requires widget patch)

### Path 2 — New tools for dashboard data (more structured, production-ready)

Add `get_invoices`, `get_expenses`, `get_customers`, `get_subscription` tools under
[creovine-backend/src/services/agent-tools/](../../../../creovine-backend/src/services/agent-tools/). Each `scope: 'verified_customer'`, `hitl: 'auto'`. Handler queries the dashboard data (synthetic profile DDB row, or a future real customer record).

The agent reasons: _"Customer asks about a refund → kb_search policy → get_invoices to find the one in question → stripe_refund_charge with confirm gate."_

This is the right architecture for real customer deployments. For demo, more setup than Path 1.

### Path 3 — Conversation-context enrichment

In `buildInitialMessages()` (line 384), after `customerLine`, append a one-shot account snapshot:

```ts
const dashboardSummary = customer ? await fetchDashboardContext(orgId, customer.customer_id) : null

const system = `…
${customerLine}
${dashboardSummary ? `\nCUSTOMER ACCOUNT SNAPSHOT:\n${dashboardSummary}\n` : ''}
AVAILABLE TOOLS…`
```

Static facts from the start, no tool call. Same shape as Path 1 but reads from a different source (server-side fetch on conversation start, not the synthetic profile row).

### Recommendation

**Path 1 for demo + Path 2 for production.**

Path 1 ships immediately, requires only:

1. Frontend POSTs dashboard data to a new `/lira/v1/demo-ops/test-profile/dashboard` endpoint when the profile is created (or fire-and-forget on mutation)
2. Backend extends `SyntheticNimbusProfile` schema + `profileToPromptFacts()` formatter

Path 2 lays the groundwork for real customer use — eventually `get_invoices` etc. hit the actual customer record (Stripe, QuickBooks, etc.).

---

## 5. Open questions

- **Demo profile sync.** Right now profile creation is pure-client. Should we sync back to the backend just so the AI has access? (Yes — but fire-and-forget so the demo still works if the backend is down.)
- **Voice tools.** Currently voice has no tools. Should we wire `kb_search` + dashboard tools so voice can also fetch fresh KB mid-call?
- **KB fail-soft fallback.** Today if Qdrant is down, `searchForContext` returns empty. Should DDB keyword fallback be added? Or is empty-KB graceful-degrade acceptable?
- **Action gating for demo.** Tools like `stripe_refund_charge` are dangerous in prod. In demo we'd want them to NEVER hit real Stripe — should they short-circuit on `isDemoOrg()` and just simulate the action against the synthetic profile?

---

_— End of audit. Update when Nova Sonic model rolls forward, agent model upgrades, or KB stack changes._
