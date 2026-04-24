# Agentic Customer Support — Competitive Analysis & Roadmap

> **Status:** Strategy draft — April 2026
> **Author:** Engineering + Product
> **Purpose:** Close the gap between "RAG-backed support widget" (what we have) and "Intercom Fin / agentic support platform" (what wins B2B contracts).

---

## 1. The question we're answering

> "If a customer says 'cancel my subscription', can Lira actually cancel it? If they say 'my payment failed', can Lira fix it? If they say 'I don't know how to find the export button', can Lira walk them there? These are the things Intercom Fin, Decagon, Sierra, and Ada do that turn a $99/mo chatbot into a $5k/mo support platform."

Right now we answer questions. We don't **do** things. Everything that matters for a serious B2B deal is in the "doing" column.

---

## 2. What we have today (honest inventory)

Verified by reading the codebase directly, not assumed.

### Backend (Node/Fastify, `creovine-api/src/services/`)

| File | What it actually does | Status |
| ---- | ---- | ---- |
| `lira-support-chat.service.ts` | WebSocket chat handler, RAG lookup, intent classification, force-escalation, streaming reply | ✅ Production |
| `lira-support-reply.service.ts` | One-shot LLM reply generation (GPT-4o) with KB context injection | ✅ Production |
| `lira-support-classifier.service.ts` | Intent classification (billing, tech, account, etc.) | ✅ Production |
| `lira-support-escalation.service.ts` | Hand-off to email/Slack when Lira can't answer | ✅ Production |
| `lira-support-customer.service.ts` | Customer profile lookup by email/visitor ID, CRM sync scaffolding | ⚠️ Scaffolded, not wired into chat |
| `lira-support-action.service.ts` | Action planner/executor for `crm_lookup`, `crm_update`, `ticket_create`, `slack_notify`, `email_followup` | ⚠️ Exists but **not invoked from the chat reply loop** |
| `lira-support-proactive.service.ts` | Outbound trigger engine (event → reach out via email/voice) | ⚠️ Scaffolded |
| `lira-support-autoresolve.service.ts` | Auto-resolution logic | ⚠️ Scaffolded |
| `lira-support-learning.service.ts` | Self-learning from escalations | ⚠️ Scaffolded |
| `lira-support-csat.service.ts` / `-analytics.service.ts` / `-summary.service.ts` | Metrics, summaries, CSAT | Mixed |
| `lira-crawl.service.ts` + `lira-doc-chunk.service.ts` + `lira-vector-search.service.ts` | KB ingestion & hybrid search (Qdrant + keyword boost) | ✅ Production |

### Widget (`lira_ai/src/components/support-widget/`)

- Plain-text chat, streaming, voice, escalation form, CSAT, HMAC-identified visitors (`visitorEmail` + `visitorSig` wire format exists)
- `IncomingWsMessage` types: `reply / reply_start / reply_chunk / reply_end / status / error / escalated / welcome / typing / agent_reply / handback / proactive`
- **No generative UI** — no card, form, button, confirmation, or action-result message types

### What the reply loop actually does today

```
message → classify intent → force-escalate? → RAG search → single GPT-4o call
  with system prompt + KB chunks → stream text back → done
```

**Critical gap:** The `lira-support-action.service.ts` is not in this flow. It's sitting on the shelf. The LLM cannot decide to call a tool, execute an action, or interact with external systems during a conversation. It can only produce text.

---

## 3. What the competitive landscape is actually shipping

### Intercom Fin (the one we lose deals to)

- Tool-use first: every connected system (Shopify, Stripe, HubSpot, internal APIs) becomes a callable tool the agent can invoke mid-conversation
- **Actions** are a first-class concept — defined per workspace with JSON schema, auth scope, confirmation gates, and human-approval rules
- Authenticated visitor context via `Intercom('boot', { user_id, user_hash })` — everything scoped to the verified user
- Generative UI — inline cards, forms, confirmation dialogs rendered in the widget from agent output
- Reports the **outcome** (refund processed: $47.99) not just the reply (I've refunded your order)

### Chatwoot (OSS — [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot), 28.8k ★, Ruby/Rails)

What we can learn:
- Captain AI agent is still essentially RAG + reply, same limitation as us
- Strong on **omnichannel inbox** (email, WhatsApp, Instagram, SMS, Telegram) — we do chat only
- Strong on **operations**: labels, assignments, macros, canned responses, teams, SLAs, business hours, auto-responders, agent capacity — this is what support leaders buy, not just AI
- Shopify integration lets an agent view/manage orders from inside a conversation — **but a human does it, not the AI**
- Contact segmentation, custom attributes, pre-chat forms — all worth stealing

What they don't have: agentic tool-calling. We can leapfrog.

### Botpress (OSS — [botpress/botpress](https://github.com/botpress/botpress), 14.6k ★, TypeScript)

What we can learn:
- **Integration SDK** — every third-party becomes a versioned, typed, deployable package (HubSpot, Slack, Trello, Shopify…). Registry-driven. Their CLI ships an integration in one file pair (`integration.definition.ts` + `src/index.ts`).
- Human-in-the-loop (HITL) was recently added as a first-class plugin — agent yields to a human, human replies, agent resumes
- "LLMz" (their agent runtime) is open-sourced — tool-calling with typed schemas

What they don't have: polished customer-facing widget, opinionated support-inbox UX. They're a bot-building platform, not a support product.

### LangGraph (OSS — [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph), 30.2k ★, Python + JS)

The orchestration primitive we should steal architecturally:

- **Durable execution** — agent persists through failures, resumes exactly where it left off. Critical for "cancel subscription → Stripe API error → retry → confirm" flows.
- **Human-in-the-loop interrupts** — pause graph, ask human/customer to confirm, resume with their input. This is how you get "Cancel subscription? [Confirm] [Keep]" safely.
- **Short-term + long-term memory** as separate tiers — matches what we need for `CustomerProfile` + session context
- Graph model makes multi-step flows (plan → confirm → execute → verify → reply) explicit and debuggable

We don't need to depend on LangGraph. We should adopt the **pattern**.

### Papercups (archived 2022)

Skip. Maintenance mode since 2022. Informative only as a "don't build a bare inbox without AI" cautionary tale.

### OpenCopilot (archived 2025)

Failed. Instructive: they tried to auto-generate tools from Swagger/OpenAPI with no auth or confirmation model. Didn't work because **real tool-calling needs human-written schemas, per-tenant auth, and guard rails** — not auto-discovery.

---

## 4. Gap analysis — what we're missing

The user's three concrete examples map cleanly to missing primitives:

| User scenario | Primitive we're missing | Why today's RAG loop can't do it |
| ---- | ---- | ---- |
| "Can Lira confirm the user's info after sign-in?" | **Authenticated visitor context in the reply pipeline** | `visitorEmail` + `visitorSig` arrive at the socket but don't get resolved to a `CustomerProfile` and injected into the prompt |
| "Can Lira say 'I can see your subscription, let me help you cancel it'?" | **Tool-calling runtime + org-provided tool registry + confirmation gates** | Reply is one text-gen call. No way for the model to call `getSubscription()` / `cancelSubscription()`. |
| "Can Lira help when someone doesn't understand the navigation?" | **Generative UI + optional co-browse pointer** | Widget only renders text. No card/button/pointer message type. |
| "Can Lira actively solve payment issues while on chat?" | **Durable multi-step agent loop (plan → confirm → execute → verify → reply)** | No state machine. One-shot reply. |

---

## 5. The architecture we need to build toward

```
┌─────────────────────────────────────────────────────────────┐
│  WIDGET (extended message types: text, card, form, confirm) │
└─────────────────────────────────────────────────────────────┘
                             │ WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  IDENTITY GATE                                              │
│  - Resolve visitorSig → verified CustomerProfile            │
│  - Attach auth scope (what tools can run for this user)     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  AGENT RUNTIME (new — replaces one-shot reply)              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Step loop (max N steps):                           │    │
│  │    1. LLM call with:                                │    │
│  │         - system prompt                             │    │
│  │         - KB context (RAG)                          │    │
│  │         - customer profile                          │    │
│  │         - conversation history                      │    │
│  │         - tool schemas (JSON, filtered by scope)    │    │
│  │    2. If LLM returns text → stream & exit           │    │
│  │    3. If LLM calls tool → check HITL policy:        │    │
│  │         - auto-exec (safe/reversible) → run → loop  │    │
│  │         - needs-confirm → send confirm card,        │    │
│  │           pause, resume on customer click           │    │
│  │         - needs-human → escalate                    │    │
│  │    4. Append tool result → loop                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  TOOL REGISTRY (per-org, per-tool)                          │
│  - Built-in: get_customer_profile, create_ticket,           │
│    schedule_callback, send_email, kb_search                 │
│  - Org-provided integrations:                               │
│    Stripe: get_subscription, cancel_subscription,           │
│            retry_payment, refund_charge                     │
│    QuickBooks: get_invoice, mark_paid, resend_invoice       │
│    HubSpot: get_contact, create_deal, update_property       │
│    Custom HTTP: any org can register an OpenAPI spec        │
│  Each tool: {schema, auth, hitl_policy, enabled_for_tiers}  │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. What this unlocks (concrete user scenarios, post-build)

### Scenario A — authenticated subscription cancel

```
User: "I want to cancel my Growth plan"

Lira: (tool_call: get_customer_profile → authed user matches)
Lira: (tool_call: stripe.get_subscription(customer_id))
Lira: "I can see you're on the Growth plan at $49/mo, renewing May 14.
       Are you sure you want to cancel? You'll keep access until May 14."
       [Confirm cancel] [Keep subscription] [Downgrade to Starter instead]

User: clicks Confirm cancel

Lira: (tool_call: stripe.cancel_subscription(sub_id, at_period_end=true))
Lira: "Done — cancellation confirmed. You have access until May 14.
       Email receipt sent to jane@acme.com. Anything else?"
```

### Scenario B — payment resolution in-chat

```
User: "My last invoice failed, what happened?"

Lira: (tool_call: stripe.get_customer_invoices(last=3))
Lira: (tool_call: stripe.get_payment_intent(inv_xyz))
Lira: "Your invoice from April 18 ($49) failed — card ending 4242
       was declined (insufficient funds). Want me to retry with
       a different payment method?"
       [Update card] [Retry same card] [Talk to billing team]

User: clicks Update card → Lira sends secure Stripe card-update URL
      scoped to this customer
```

### Scenario C — navigation / how-to

```
User: "Where do I export my data?"

Lira: (kb_search: "export data")
Lira: "You can export from Settings → Data → Export. Want me to
       open it for you?"
       [Take me there]

User: clicks → widget sends `navigate` postMessage to host page
      which opens `/settings/data?highlight=export-btn`
      (pointer overlay highlights the button)
```

### Scenario D — proactive

```
(Stripe webhook fires: payment_failed for customer jane@acme.com)
→ Lira proactive service sends email: "Hi Jane — your April 18 payment
   just failed. Click here to fix it in 30 seconds."
→ Link opens host site with widget pre-opened on the conversation,
   Lira already has the context, ready to help.
```

---

## 7. Priority sequencing (what to build and in what order)

Each item is sized by impact × effort. Ship the top 3 before outbound B2B sales.

### Tier 1 — the agentic core (✅ SHIPPED)

1. **Tool-calling runtime in the chat loop** — ✅ `lira-support-agent.service.ts` runs an OpenAI tool-use loop (max 5 steps, streaming text, structured tool results). Replaces `generateReply()` in `handleChatMessage`.

2. **Authenticated visitor resolution** — ✅ HMAC `sig` validated in `lira-support-chat.routes.ts`; `verified` boolean threaded through to the agent and used to compute `AuthScope` (`public` | `verified_visitor` | `verified_customer`). Tools requiring auth are filtered out for anonymous visitors.

3. **Built-in tools (shipped with every org)** — ✅ `agent-tools/built-in.ts`: `kb_search`, `get_customer_profile`, `escalate_to_human`, `create_ticket`, `schedule_callback`, `set_conversation_summary`.

4. **Generative UI message types** — ✅ widget WS protocol extended with `card`, `confirm`, `action_result`, `navigate`. Cards render as native bubbles with badge/fields/buttons; action chips show silent tool execution; navigate opens links in a new tab.

5. **HITL confirmation gate** — ✅ tools marked `hitl: 'confirm'` pause the agent loop, send a `confirm` card, persist the in-flight message stack server-side keyed by `conv_id`, and resume on the customer's `confirm_response`. Currently in-memory — promote to DynamoDB for multi-instance deploy (`SK: SUPPORT_PENDING_TOOL#{convId}`).

### Tier 2 — integrations as first-class tools

6. **Org tool registry** — ✅ DynamoDB-backed (`SK: SUPPORT_TOOL_PACK#{packId}`) with admin routes at `PUT/GET/DELETE /lira/v1/support/tool-packs/orgs/:orgId/:packId`. `agent-tools/registry.ts` filters tools per request by enabled packs + auth scope.

7. **Stripe integration pack** — ✅ `agent-tools/packs/stripe.ts` ships four tools: `stripe_get_subscription`, `stripe_cancel_subscription` (HITL confirm), `stripe_get_recent_invoices`, `stripe_create_billing_portal_link`. Resolves the customer by email (no extra mapping required). To enable for Nimbus:

   ```bash
   curl -X PUT https://api.creovine.com/lira/v1/support/tool-packs/orgs/$ORG_ID/stripe \
     -H "Authorization: Bearer $JWT" \
     -d '{"enabled": true, "config": {"secret_key": "sk_test_..."}}'
   ```

8. **QuickBooks + Xero packs** — Same pattern as Stripe. Fintech and accounting orgs (Nimbus itself, our dogfood customer).

9. **Custom HTTP tool** — org provides OpenAPI spec + auth method → Lira auto-generates tool schemas. This is what openCopilot tried to do and failed because they didn't add auth/confirm. We add both.

### Note on voice (Nova Sonic) — unify, don't fork

Nova Sonic’s `promptStart.toolConfiguration` already accepts a `tools[]` array; it is currently empty in `lira-sonic.service.ts:411`. The same registry that powers the text agent (`listToolsForRequest`) can populate this slot in a single line, giving us voice tool-calling for free. **Do not build a parallel voice agent runtime.** The natural integration point is wrapping `runAgent` so Sonic’s text-output channel is treated as another `AgentSender` implementation.

### Tier 3 — the moat

10. **Durable agent state (LangGraph-pattern)** — DynamoDB-checkpointed agent loop. A long-running action (Stripe → webhook → verify) can span minutes/hours with the widget closed.

11. **Navigation & co-browse** — `navigate` tool + widget-to-host `postMessage` bridge + optional DOM pointer overlay SDK for orgs that install it on their app.

12. **Outcome tracking & outcome-based billing hooks** — every tool result logged. "Refund processed: $47.99" is an outcome event, not just a message. Powers the pricing model from the product spec.

13. **Self-learning loop** — when a conversation ends without a successful tool call but the user was trying to do something, flag as a tool-gap and suggest to org admin "customers frequently ask about X; consider adding a `cancel_addon` tool." Closes the loop on the existing `lira-support-learning.service.ts` scaffolding.

### Tier 4 — parity features worth copying from Chatwoot

14. Canned responses, macros, labels, SLAs, business hours, auto-assignment, teams — agent-operations features. Boring but required to close enterprise deals.

15. Omnichannel inbox — email (have), WhatsApp/SMS/Instagram/Telegram (don't).

---

## 8. What NOT to build (yet)

- **Our own LLM framework.** Use OpenAI tool-use / Anthropic tool-use directly. No LangChain dependency. Thin wrapper, own the abstractions.
- **No-code agent builder UI (Botpress-style).** Ship hardcoded patterns first. Visual builder is a year-2 problem after we know which flows actually get used.
- **Agent-to-agent / multi-agent orchestration.** Single-agent-with-tools solves 95% of support. Multi-agent is a marketing story, not a customer need at our stage.
- **Voice tool-calling (yet).** ~~Get text right first.~~ Nova Sonic supports `toolConfiguration` natively; once Tier 1 text path is verified end-to-end on Nimbus, populate Sonic’s `tools[]` from the same registry. Same agent runtime, two surfaces.

---

## 9. How our existing scaffolding maps in

Good news: we're not starting from zero.

| Existing file | Becomes |
| ---- | ---- |
| `lira-support-action.service.ts` | Inner tool executor of the agent loop (already has `crm_lookup`, `crm_update`, `ticket_create`, `slack_notify`, `email_followup`) |
| `lira-support-customer.service.ts` | Identity gate; `get_customer_profile` built-in tool |
| `lira-support-proactive.service.ts` | Outbound agent (same agent loop, different entry point) |
| `lira-support-autoresolve.service.ts` | Wrapper that runs the agent loop headlessly for inbound emails |
| `lira-support-learning.service.ts` | Tool-gap detector (point 13 above) |
| `lira-support-reply.service.ts` | Becomes the text-only fallback path; agent loop is the default |

The bad news: none of these are wired into `lira-support-chat.service.ts`'s live loop. That's the integration work.

---

## 10. Testing this end-to-end

Add a **Phase 3h** to `NIMBUS_DOGFOOD_TEST_PLAN.md`:

### 3h. Agentic actions (once Tier 1 ships)

- [ ] Sign in on the Nimbus demo page with an identified visitor (HMAC signed) → Lira greets by name, confirms profile
- [ ] "Can you show me my active subscription?" → Lira calls `stripe.get_subscription`, confirms plan + renewal
- [ ] "I want to cancel" → Lira shows confirm card → click → Lira executes cancel → posts confirmation
- [ ] "I need to update my card" → Lira generates secure card-update link scoped to this customer
- [ ] Fire a test Stripe `payment_failed` webhook → Lira proactively emails the customer within 60s

Pass bar: every scenario completes **without human intervention**, and the widget reports the outcome (not just a text reply).

---

## 11. Pricing implication

The product spec (§6) promises outcome-based pricing. That is only defensible once tool calls are the primary unit of work.

- Today: we could charge per conversation or per seat (Intercom / Zendesk model). Weak differentiation.
- Post-Tier-1: we can charge **per successful tool call** or **per verified resolution**. Pricing page says "$X per action Lira executes autonomously, $0 when Lira punts to a human." That's a narrative Intercom structurally cannot match because they don't have outcome telemetry baked into the agent runtime.

---

## 12. Summary — the one-line thesis

> We have a well-built RAG support widget. Every OSS alternative has the same thing. The moat — and the reason B2B customers pay $5k/mo to Intercom instead of self-hosting Chatwoot — is **tool-calling with verified customer context, confirmation gates, and outcome tracking**. Build that next. Everything else is polish.

