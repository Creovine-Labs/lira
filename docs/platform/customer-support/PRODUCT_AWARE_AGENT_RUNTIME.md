# Product-Aware Agent Runtime

> **Version:** 0.1 — 2026-05-24
> **Status:** Draft implementation plan
> **Audience:** Product, engineering, support-agent implementation work
> **Scope:** Build Lira's internal onboarding assistant as the canonical draft of the future customer-facing SDK.

---

> This document is now a dogfood sub-track of the broader
> [`AGENTIC_ORGANIZATION_RUNTIME.md`](./AGENTIC_ORGANIZATION_RUNTIME.md)
> plan. Keep this file focused on the internal Lira dashboard implementation,
> and use the agentic runtime plan for the shared context, resource, action,
> policy, and audit architecture.

---

## 0. Purpose

Lira should not behave like a generic chatbot embedded in a product. It should
behave like a product-aware support agent that knows:

- who the visitor is
- which organisation they are setting up
- what page, tab, step, or form they are currently on
- which important toggles and fields are selected
- what backend state already exists
- which actions it is allowed to perform

The immediate goal is to build this inside the Lira admin dashboard first, then
extract the stable parts into a customer-facing SDK once the internal version is
proven.

This document is the working contract for that process.

---

## 1. Product Decision

We will build the internal version as if it is already the draft of a future
SDK.

That means:

1. Internal implementation details can change quickly.
2. The context shape, event names, action model, and permissions model should be
   treated as an evolving SDK contract.
3. When a bug appears, we should classify it as either:
   - **Internal runtime issue:** Lira admin dashboard is publishing bad/missing
     state.
   - **Agent/runtime issue:** backend is not storing, merging, or injecting state
     correctly.
   - **SDK contract issue:** the event/context/action API itself is unclear,
     incomplete, or hard to reuse.
4. Every phase should update this document with what we learned before moving
   on.

The internal build is not a throwaway implementation. It is the dogfood version
of the SDK.

---

## 2. Current Foundation

The repo already has the first version of this architecture:

| Area                            | Current file                                                         | Current capability                                                                                   |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Internal dashboard widget mount | `src/components/LiraOnboardingWidget.tsx`                            | Embeds Lira's own widget inside the Lira admin dashboard.                                            |
| Initial context snapshot        | `src/components/LiraOnboardingWidget.tsx`                            | Sends user/org/profile data through `data-demo-context` at widget mount.                             |
| Signed widget identity          | `creovine-backend/src/routes/platform-auth.routes.ts`                | Issues HMAC-signed credentials for the internal Lira widget.                                         |
| Onboarding tools                | `creovine-backend/src/services/agent-tools/packs/lira-onboarding.ts` | Checks setup progress, navigates dashboard, starts crawl, generates snippet, changes greeting/color. |
| Onboarding prompt               | `creovine-backend/src/services/lira-support-agent.service.ts`        | Tells the agent how to guide a new Lira customer through setup.                                      |

The gap: context is mostly a one-time snapshot. We need live product state.

---

## 3. Target Architecture

Build three layers.

### Layer 1 — Live Product Context

The host product publishes clean application state to Lira. The agent should not
scrape the DOM or guess from page text.

Internal draft API:

```ts
LiraRuntime.setContext({
  app: 'lira-admin-dashboard',
  route: '/org/knowledge',
  page_title: 'Knowledge Base',
  tab: 'web',
  workflow: {
    name: 'support_onboarding',
    step: 'seed_knowledge_base',
  },
  visitor: {
    user_id: 'user_123',
    name: 'Ada',
    email: 'ada@lemonpay.com',
  },
  organisation: {
    org_id: 'org_123',
    name: 'Lemonpay',
    website: 'https://lemonpay.com',
    industry: 'fintech',
  },
  support: {
    activated: false,
    chat_enabled: true,
    portal_enabled: false,
    auto_reply_enabled: true,
  },
  knowledge: {
    source_type: 'web',
    crawl_url: 'https://lemonpay.com',
    crawl_status: 'idle',
    pages_indexed: 0,
  },
})
```

The public SDK can later expose the same idea:

```ts
import { Lira } from '@liraintelligence/support-runtime'

Lira.init({ orgId: 'org_123' })
Lira.identify({ email: currentUser.email, name: currentUser.name, sig })
Lira.setContext({ route, account, billing, onboarding })
Lira.track('support_activation_toggled', { chat_enabled: true })
```

### Layer 2 — Agent Runtime Context

The widget or support surface sends context updates to the backend. The backend
stores and merges the latest context per conversation, then injects it into each
agent run.

Internal websocket message:

```json
{
  "type": "context_update",
  "context": {
    "route": "/support/activate",
    "support": {
      "chat_enabled": true,
      "portal_enabled": false
    }
  }
}
```

Backend responsibilities:

- validate context size and allowed keys
- merge partial updates into the conversation runtime context
- attach context to the agent tool context
- format the latest context into the system prompt
- keep context scoped by org, customer, conversation, and authenticated identity

### Layer 3 — Action Tools

The agent should read state and act through tools, not through fragile UI hacks.

Initial internal tools:

| Tool                            | Purpose                                    | Approval                           |
| ------------------------------- | ------------------------------------------ | ---------------------------------- |
| `lira_get_runtime_context`      | Return latest live page/workflow state.    | Auto                               |
| `lira_open_dashboard_path`      | Navigate user to a dashboard page.         | Auto                               |
| `lira_prefill_field`            | Ask host page to prefill a specific field. | Auto or confirm depending on field |
| `lira_get_setup_progress`       | Read backend setup state.                  | Auto                               |
| `lira_ingest_kb_url`            | Start a KB crawl.                          | Confirm                            |
| `lira_update_support_channels`  | Enable/disable chat, portal, auto-reply.   | Confirm                            |
| `lira_generate_install_snippet` | Generate install code.                     | Auto                               |
| `lira_set_greeting`             | Update widget greeting.                    | Confirm                            |
| `lira_update_brand_color`       | Update widget brand color.                 | Confirm                            |

External SDK version:

Customers should be able to register their own read/action tools later:

```ts
Lira.registerAction({
  name: 'retry_payment',
  description: 'Retry the latest failed invoice payment.',
  approval: 'confirm',
  handler: async ({ invoice_id }) => {
    return billing.retryPayment(invoice_id)
  },
})
```

For production customers, these actions should normally be backend-registered,
not browser-only, so secrets and privileged operations stay server-side.

---

## 4. Internal Implementation Phases

### Phase 1 — Context Contract

**Goal:** define and publish live context from the Lira admin dashboard.

Deliverables:

- Create a typed `LiraRuntimeContext` model in the frontend.
- Add a small internal runtime publisher around the dashboard app.
- Include route, tab, current org, visitor, support config, KB/crawl state, and
  onboarding workflow state.
- Update `LiraOnboardingWidget` so it no longer sends only a mount-time snapshot.
- Add debug logging in local/dev mode so we can inspect what context was sent.

Acceptance tests:

- On `/org/knowledge?tab=web`, context includes `route`, `tab: "web"`,
  selected org, and website.
- On `/support/activate`, context includes `chat_enabled`, `portal_enabled`,
  `activated`, and `onboarding_step`.
- Changing a toggle or switching tabs sends an updated context without remounting
  the widget.

Status: In progress. Initial typed context model, dashboard publisher, widget
event bridge, and `context_update` transport are implemented. Debug inspector
and broader page-specific field coverage are still pending.

### Phase 2 — Backend Runtime Context

**Goal:** receive, merge, persist, and inject live context into the agent.

Deliverables:

- Add `context_update` handling to the support chat websocket.
- Store latest runtime context per active conversation/session.
- Merge partial updates safely instead of replacing the whole context.
- Add size limits and key allow-listing.
- Include the latest runtime context in `ToolContext`.
- Format runtime context into the onboarding system prompt separately from the
  older `demo_context` snapshot.

Acceptance tests:

- Send a context update, ask "where am I?", and Lira answers from live context.
- Toggle portal off, ask "what have I enabled?", and Lira says chat is enabled
  but portal is not.
- Refreshing the page does not leak context across users or orgs.

Status: In progress. The chat websocket now accepts `context_update`, sanitises
and merges session-scoped runtime context, passes it into the agent runtime, and
formats it into the Lira-internal onboarding prompt. Persistence and a dev
inspection endpoint are still pending.

### Phase 3 — Internal Actions

**Goal:** let Lira guide and perform setup through product-aware tools.

Deliverables:

- Add or update tools for:
  - runtime context read
  - field prefill
  - support channel update
  - crawl start/status
  - onboarding step verification
- Emit host action events from backend/tool results to the widget.
- Add frontend listeners for safe host actions:
  - navigate
  - prefill
  - focus field/section
  - show inline setup hint
- Keep write actions behind confirmation.

Acceptance tests:

- "Set up my knowledge base" navigates to the Web Sources tab and references the
  organisation website.
- "Use my website" pre-fills the crawl URL or starts crawl with approval.
- "I only enabled chat, what else?" reads the support activation micro-state and
  points out portal is still off.
- "Generate the widget install code" produces the exact snippet for the current
  org.

Status: Not started.

### Phase 4 — Dogfood Test Script

**Goal:** make this testable during normal platform testing.

Deliverables:

- Add a dogfood script for the Lira admin onboarding assistant.
- Include prompts for context awareness, action execution, navigation, and
  failure handling.
- Add "bug classification" notes for internal runtime vs backend runtime vs SDK
  contract issues.
- Track each failed prompt with:
  - current page
  - context sent
  - agent answer
  - tool calls
  - expected behavior

Acceptance tests:

- A tester can run the onboarding flow end-to-end without reading the code.
- Every failure is easy to classify and route to the right layer.

Status: Not started.

### Phase 5 — SDK Extraction Readiness

**Goal:** freeze the reusable contract and separate internal-only code from SDK
code.

Deliverables:

- Move stable types into an SDK-ready package boundary.
- Document the public API:
  - `init`
  - `identify`
  - `setContext`
  - `track`
  - `open`
  - `registerAction` or server-side action registration
- Define browser package, React helpers, and backend action-registration API.
- Produce customer-facing integration examples:
  - SaaS dashboard
  - billing page
  - onboarding checklist
  - full support page

Acceptance tests:

- A demo app can integrate the draft SDK without importing internal Lira admin
  code.
- Runtime context and tool actions behave the same in the demo app as they do in
  the Lira admin dashboard.

Status: Not started.

---

## 5. Internal Runtime vs SDK Contract

Use this table when deciding where a change belongs.

| Change                                         | Internal runtime | SDK contract               |
| ---------------------------------------------- | ---------------- | -------------------------- |
| Lira dashboard route names                     | Yes              | No                         |
| Lira support activation fields                 | Yes              | Maybe, as generic examples |
| `setContext` API shape                         | Yes              | Yes                        |
| `context_update` message type                  | Yes              | Yes                        |
| Context merge semantics                        | Yes              | Yes                        |
| Lira-only tool names like `lira_ingest_kb_url` | Yes              | No                         |
| Generic action model                           | Yes              | Yes                        |
| Approval policy                                | Yes              | Yes                        |
| Debug inspector/dev logs                       | Yes              | Optional SDK devtool       |

Rule: if a feature would be useful to any customer integrating Lira into their
own product, treat it as SDK contract pressure and document it here.

---

## 6. Context Design Rules

1. Send business state, not raw UI state.
2. Prefer small partial updates over giant snapshots.
3. Never send secrets, tokens, private API keys, or hidden form values.
4. Treat context as advisory, not as permission.
5. Backend tools must re-read authoritative state before mutating anything.
6. Every write action needs an approval policy.
7. Runtime context must be scoped to the active visitor, org, and conversation.
8. Context should help the agent avoid asking questions the product already
   answered.

---

## 7. Example Internal Flow

User opens `/org/knowledge?tab=web`.

Frontend sends:

```json
{
  "route": "/org/knowledge",
  "tab": "web",
  "workflow": {
    "name": "support_onboarding",
    "step": "seed_knowledge_base"
  },
  "organisation": {
    "name": "Lemonpay",
    "website": "https://lemonpay.com"
  },
  "knowledge": {
    "source_type": "web",
    "crawl_status": "idle",
    "pages_indexed": 0
  }
}
```

User asks:

> What should I do here?

Expected Lira answer:

> You're on Web Sources. I see Lemonpay's website is `https://lemonpay.com`.
> This is the fastest way to seed your knowledge base. I can start the crawl
> now, or you can use a different URL.

Expected tools:

1. Read runtime context.
2. Suggest next actions.
3. If user approves, call the crawl tool.

---

## 8. Example External Customer Flow

A SaaS customer integrates the SDK on their billing page.

```ts
Lira.setContext({
  route: '/settings/billing',
  page_title: 'Billing',
  account: {
    id: 'acct_123',
    plan: 'Growth',
    subscription_status: 'past_due',
  },
  billing: {
    last_invoice_status: 'failed',
    card_last4: '4242',
  },
})
```

Their customer asks:

> Why can't I access my account?

Expected Lira answer:

> Your account is restricted because the latest invoice failed. I can help you
> retry the payment or update your card.

This is the same architecture as the internal onboarding assistant, with a
different context schema and different action tools.

---

## 9. Implementation Log

Use this section as the living "internal version update" while we build.

| Date       | Phase     | Change                                                                                                                                                                    | Lesson / SDK pressure                                                                                                                                                                                                                 |
| ---------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-24 | Planning  | Created Product-Aware Agent Runtime spec.                                                                                                                                 | Internal onboarding should be built as the draft SDK contract, not a one-off widget feature.                                                                                                                                          |
| 2026-05-24 | Phase 1/2 | Added internal `LiraRuntimeContext`, frontend publish event, widget `context_update` forwarding, backend session merge, prompt injection, and `lira_get_runtime_context`. | The SDK contract needs a framework-free event/API layer that the vanilla widget can consume without React. Runtime context should be advisory and session-scoped; backend tools must still re-read authoritative state before writes. |

---

## 10. Open Questions

1. Should external customers register browser-side actions, server-side actions,
   or both?
2. How much context history should the backend retain: latest snapshot only, or
   event timeline plus snapshot?
3. Should context be persisted long-term for analytics, or treated as ephemeral
   runtime state?
4. What customer-facing pricing tier includes action tools?
5. Do we expose a React provider first, or a framework-free JS SDK first?

---

## 11. Near-Term Recommendation

Start with Phase 1 and Phase 2 inside the Lira admin dashboard.

Do not package an SDK yet. Build the internal runtime with SDK discipline, test
it against real onboarding flows, then extract the stable contract once the
context shape and action model stop changing every day.
