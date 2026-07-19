# Agentic Organization Runtime

Status: Draft implementation plan, revised after engineering review  
Owner: Lira platform  
Created: 2026-05-31  
Related docs:

- [`PRODUCT_AWARE_AGENT_RUNTIME.md`](./PRODUCT_AWARE_AGENT_RUNTIME.md)
- [`LIRA_SUPPORT_SDK_AND_FULL_PAGE_EMBED.md`](./LIRA_SUPPORT_SDK_AND_FULL_PAGE_EMBED.md)
- [`DOGFOOD_TEST_SCRIPT.md`](./DOGFOOD_TEST_SCRIPT.md)
- Backend plan: `/Users/apple/creovine_main/creovine-backend/docs/SUPPORT_TICKETING_BACKEND_IMPLEMENTATION_PLAN.md`

---

## 0. Immediate execution plan

This document has two jobs:

1. Define the long-term agentic runtime architecture.
2. Give engineering a concrete build order that starts from what Lira already
   shipped.

The second job is more urgent. The architecture is the destination, but the
next implementation should be three practical slices, not a 10-phase waterfall.

### 0.1 What changes Monday

Start with the runtime core that turns existing support actions into auditable,
policy-governed agent capabilities.

| Slice   | Timeline | Deliverable                                              | Why it matters                                                                      |
| ------- | -------: | -------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Slice 1 |  2 weeks | Audit + capability metadata                              | Every existing agent action becomes traceable, typed, and ready for policy.         |
| Slice 2 |  2 weeks | Central policy decision engine                           | HITL moves from scattered tool config into one enforceable runtime decision.        |
| Slice 3 |  2 weeks | SDK `registerResource` + server-side action registration | LemonPay-style customers can expose safe product data and approved backend actions. |
| Slice 4 |   1 week | Org-aware executable registry                            | Admin capability records can safely override or disable existing runtime tools.     |

After these slices, Lira has the practical runtime core:

- Agent-readable capabilities
- Central risk and identity policy
- Action runs and audit
- SDK resources for live product context
- Server-side actions for real business operations
- Org-specific capability overrides without exposing phantom executors

The broader phases in section 11 remain the roadmap, but these slices are
the first implementation track.

### 0.2 Slice 1: Audit + capability metadata

Goal:

Make every existing support action visible as an agentic capability and every
execution visible as an audit record.

Backend work:

- Add `kind: "resource" | "action"` to the existing backend tool type.
- Add `risk` to the existing backend tool type.
- Add `outputSchema` where useful.
- Add `AgentActionRun` persistence for action execution.
- Backfill action-run creation for:
  - `escalate_to_human`
  - `lira_create_support_ticket` / `create_ticket`
  - `lira_mark_install_step`
  - `lira_check_integration_health`
  - support settings actions already used by onboarding
- Link action runs to:
  - `orgId`
  - `conversationId`
  - `visitorId` or customer identity if available
  - `ticketId` if the action creates or updates a ticket
  - tool/capability name
  - status, input summary, output summary, and error
  - `estimatedTokensIn`
  - `estimatedTokensOut`
  - `estimatedModelCostUsd`

Frontend work:

- Add a dashboard audit list at Settings -> Support -> Audit.
- Gate the audit list to org admins.
- Make it paginated.
- Add filters for capability, status, and time range.
- Do not build the full runtime console yet.

Acceptance criteria:

- Every existing agent-triggered ticket, escalation, setup-step update, and
  integration health check creates an audit record.
- Admins can see recent agent action runs in the dashboard.
- No existing widget or onboarding flow regresses.

### 0.3 Slice 2: Central policy engine

Goal:

Move execution permission into one function:

```ts
policy.evaluate(capability, runtimeContext)
```

Backend work:

- Add risk tier enum:
  - `read_public`
  - `read_private`
  - `safe_write`
  - `customer_confirm`
  - `step_up`
  - `admin_approve`
  - `human_only`
- Map each tier to required identity and approval behavior.
- Convert current `hitl` behavior into policy output.
- Wire policy output through existing `pending-state.ts`.
- Keep current tool-level `hitl` fields as compatibility metadata until all
  callers are migrated.
- Remove tool-level `hitl` after Phase 3 ships and the compatibility migration
  window has run for six weeks.

Acceptance criteria:

- The model can request an action, but only policy decides whether it executes.
- Existing confirm-card behavior still works.
- Landing-page anonymous users cannot trigger private reads or account writes.

### 0.4 Slice 3: SDK resources + server-side actions

Goal:

Give customers a clean way to expose live product context and trusted backend
actions.

Frontend SDK work:

- Add `Lira.registerResource(...)` for browser-safe reads.
- Expand `Lira.registerAction(...)` metadata without breaking current users.
- Preserve SDK backward compatibility:
  - Existing legacy `registerAction(name, handler)` calls keep working.
  - New metadata fields such as `risk`, `authScope`, and `inputSchema` are
    optional.
  - When metadata is absent, default to `risk: "safe_write"` and
    `authScope: "verified_visitor"`.
  - Existing behavior should not become stricter silently.
  - Emit a console deprecation notice for action registrations without
    metadata, rate-limited to once per page load, but do not break them.
  - Current package consumers, including `@liraintelligence/support@0.3.0`,
    should not need code changes to upgrade.
- Add docs and examples for:
  - Widget install
  - Full-page support install
  - Browser-safe resource
  - Browser-safe action
  - Server-side action registration

Backend work:

- Add server-side action registration APIs for org admins.
- Start with built-in packs and explicit SDK/browser capabilities.
- Defer custom HTTP connectors to v2.

Acceptance criteria:

- A LemonPay-style app can expose safe browser state, such as current route,
  selected invoice, or visible transaction ID.
- A trusted server action, such as `billing.retry_payment`, can be configured
  without putting secrets in the browser.
- Custom HTTP connectors are not part of v1.

### 0.4A Slice 4: Org-aware executable registry

Goal:

Make capability records affect the real runtime safely.

Backend work:

- Add an async org-aware tool registry:
  `listToolsForOrgRequest({ orgId, enabledPacks, scope })`.
- Merge dynamic capability records into existing executable tools by name.
- Allow org capability records to:
  - override tool description
  - override input and output schemas
  - override kind, risk, and auth scope
  - disable an executable tool for that org
- Keep brand-new metadata-only capabilities hidden from the model until a real
  backend executor or connector exists.
- Use the org-aware registry in:
  - `lira-support-agent.service.ts`
  - `lira-internal.routes.ts` context build
  - `lira-internal.routes.ts` tool dispatch
- Decorate capability API responses with `executable: true | false`.

Frontend work:

- Show a clear badge in Settings -> Support -> Capabilities:
  - `runtime executable`
  - `metadata only`

Acceptance criteria:

- If an admin disables a known capability, the model cannot see or call it.
- If an admin tightens a known capability from `safe_write` to
  `customer_confirm`, the central policy engine applies the stricter behavior.
- If an admin registers `billing.retry_payment` before an executor exists, it is
  visible as metadata in Settings but not exposed to the model as callable.

### 0.5 What is already shipped

The runtime is not starting from zero. Current shipped work already covers part
of the original roadmap:

- Ticketing system with agent-created tickets, customer-visible threads, and
  support workflow foundation.
- Integration health endpoint.
- Widget console attribution and troubleshooting docs.
- `RULE 10C`, `RULE 10D`, and `RULE 11` prompt behavior for escalation,
  health checks, and integration debugging.
- `lira_check_integration_health` as a built-in agent capability.
- `planTier` wiring from invite flow, the first real org-level capability
  gating signal.
- Five-step onboarding stepper and `lira_get_setup_progress`, the first
  agent-readable structured org setup state.

These should be treated as production foundations to consolidate, not future
ideas to rebuild.

---

## 1. What we are building

Lira should not stop at being a support chatbot. The long-term product is an
agentic support and operations layer for organizations.

That means Lira should be able to:

- Understand the current organization, customer, account, page, workflow, and
  support history.
- Read trusted product data through approved resources, not only through
  uploaded documents or crawled KB pages.
- Safely perform useful actions, such as creating a ticket, updating a support
  setting, changing a subscription, retrying a payment, sending a reset link,
  escalating to a human, or updating a workflow.
- Explain what it checked and what it changed.
- Enforce permissions, approvals, tenant isolation, and audit logs outside the
  model.
- Work across surfaces: floating widget, full-page SDK embed, customer support
  portal/page, Lira admin dashboard, and future mobile SDK.

The product positioning should be closer to:

> Organization-aware customer support infrastructure with an agentic runtime.

Not:

> Just an AI chatbot.

The model is important, but the defensible product is the runtime around it:
identity, context, resources, actions, policies, approvals, audit, and customer
support UX.

---

## 2. Current foundation in Lira

The current platform already has important pieces. The agentic runtime should
extend these instead of replacing them.

| Area                    | Existing foundation                                                           | What it means                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Widget and SDK          | `packages/lira-support`, `src/components/support-widget/*`                    | We already have a customer-facing runtime that can mount as a widget or full-page embed.                              |
| Runtime context         | `src/lib/lira-runtime-context.ts`, widget `context_update` messages           | We already send page/org/onboarding context from React into the assistant.                                            |
| Support SDK             | `packages/lira-support/src/core.ts`, `types.ts`, `react.tsx`                  | We already expose `init`, `identify`, `setContext`, `track`, `mountWidget`, `mountSupportPage`, and `registerAction`. |
| Tool registry           | Backend `src/services/agent-tools/*`                                          | We already have a tool model with schemas, HITL policies, auth scopes, and static tool packs.                         |
| HITL/pending actions    | `pending-state.ts`, `lira-support-agent.service.ts`                           | Confirmable tool calls can pause and resume instead of executing blindly.                                             |
| Tool packs              | `stripe`, `nimbus`, `lira-onboarding`, built-ins                              | We already think in terms of per-org capabilities.                                                                    |
| Tool pack config        | `pack-config.ts`, `lira-support-tool-packs.routes.ts`                         | Admin-configured per-org packs already exist.                                                                         |
| Internal runtime API    | `lira-internal.routes.ts`                                                     | Node already exposes context and dispatch endpoints for an internal agent bridge.                                     |
| Ticketing/action logs   | `lira-support-action.service.ts`, ticketing services                          | We already have support actions, approvals, and ticket workflows to anchor real customer support.                     |
| Full-page support embed | `window.Lira.mountSupportPage(...)`                                           | We already have the direction needed for customer-owned `/support` pages.                                             |
| Ticketing system        | Backend ticket services, customer-visible threads, agent ticket tools         | Agent-created tickets and support threads already match the first real agentic action use case.                       |
| Integration health      | Integration health endpoint, widget console attribution, troubleshooting docs | We already have operational diagnostics that can become runtime health resources.                                     |
| Prompt policy rules     | `RULE 10C`, `RULE 10D`, `RULE 11` in the support prompt                       | The prompt already encodes early policy-like reasoning for escalation and health checks.                              |
| Health-check capability | `lira_check_integration_health`                                               | This is already a built-in runtime capability, not future connector work.                                             |
| Invite plan tier        | Invite `planTier` wiring                                                      | This is the first shipped org-level capability gating signal.                                                         |
| Onboarding state        | Five-step onboarding stepper, `lira_get_setup_progress`                       | The assistant can already read structured org setup state.                                                            |

The missing part is not "make the model smarter." The missing part is a
coherent runtime contract that turns organization data and operations into safe,
auditable agent capabilities.

---

## 3. Product principle

Every organization should be able to connect Lira to its product in three
controlled ways:

1. **Context**: "Here is where the visitor is, who they are, what they are
   doing, and what state the product is in."
2. **Resources**: "Here are safe read APIs the agent may query."
3. **Actions**: "Here are safe write operations the agent may request or
   execute, with approval rules."

The customer should not need to upload documents for everything. KB documents
answer policy and product questions. Runtime resources answer live account
questions.

Example:

- KB answers: "What is LemonPay's refund policy?"
- Runtime resource answers: "Why did my May 15, 2025 payout fail?"
- Action executes: "Retry that payout" or "Create a ticket for the finance
  team."

---

## 4. Non-goals

These boundaries matter because agentic systems can become unsafe quickly.

- We are not giving the model direct database access.
- We are not letting email-only identification unlock private account data.
- We are not letting browser-registered actions perform privileged server-side
  operations.
- We are not putting secrets, API keys, or raw connector credentials into model
  prompts.
- We are not relying on tool descriptions as security policy.
- We are not letting SDK/browser code inject system-prompt content, override
  agent instructions, or smuggle instructions through runtime context. Context
  is data, not instructions.
- We are not building arbitrary browser automation as the core product.
- We are not replacing human support. Human escalation remains a first-class
  path.

---

## 5. Target architecture

### 5.1 Surfaces

Lira should expose the same runtime through multiple surfaces:

- Floating support widget
- Full-page SDK embed inside the customer's own `/support` route
- Lira admin dashboard onboarding assistant
- Customer support inbox and ticket detail pages
- Future mobile SDK

Each surface can have different UI, but should use the same backend runtime:

- Same identity model
- Same conversation model
- Same resource/action registry
- Same policy engine
- Same audit trail

Architectural commitment:

The Lira-internal onboarding widget must use the same backend runtime as
customer widgets and full-page embeds. It can have Lira-specific tools and
prompts, but it should not have a special-case execution path. If internal
onboarding and customer support diverge into separate runtimes, the SDK stops
being a real dogfood path.

### 5.2 Identity and trust

The runtime needs explicit identity levels. This should be enforced in backend
code, not left to the model.

| Identity level            | Example                                       | Allowed capability                                                            |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Anonymous visitor         | Landing page user                             | Public KB, lead capture, meeting booking, generic integration help            |
| Claimed email, unverified | User typed an email in chat                   | Can create a ticket or request login/reset flow, but cannot read private data |
| Verified customer         | Host app identifies user with signed identity | Account-specific support, safe account reads, approved account actions        |
| Org admin                 | Logged into Lira dashboard                    | Configure support, manage KB, settings, tool packs, tickets, actions          |
| Internal service          | Lira-controlled worker/API                    | Execute backend jobs, crawl, sync, route tickets, run scheduled checks        |

Important rule:

> Email alone must never unlock private account data.

If a landing-page visitor says "my email is ceo@company.com," Lira can use that
email to start a login flow, send a reset link, or create a ticket, but it
should not reveal plan, invoices, transactions, or private account state until
the user is verified.

### 5.3 Live product context

Current foundation:

- Frontend already sends context through `setContext(...)` and widget
  `context_update` messages.
- `PRODUCT_AWARE_AGENT_RUNTIME.md` already defines the internal dashboard
  dogfood path.

Target:

Create a stable versioned context envelope:

```ts
type LiraRuntimeContextV1 = {
  schema: 'lira.runtime_context.v1'
  org: {
    id: string
    name?: string
    plan?: string
  }
  visitor?: {
    id?: string
    email?: string
    name?: string
    verified: boolean
    traits?: Record<string, unknown>
  }
  surface: {
    type: 'widget' | 'support_page' | 'admin_dashboard' | 'mobile'
    route?: string
    title?: string
    locale?: string
  }
  product?: {
    area?: string
    objectType?: string
    objectId?: string
    state?: Record<string, unknown>
  }
  support?: {
    ticketId?: string
    conversationId?: string
    channel?: string
  }
  capabilities?: {
    resources?: string[]
    actions?: string[]
  }
  updatedAt: string
}
```

This context should be:

- Sanitized before reaching the model.
- Stored against conversation/session for traceability.
- Versioned so future SDK changes do not break older installs.
- Visible in a developer/debug panel for org admins.

### 5.4 Resource layer

Resources are read-only capabilities that let Lira query live product data.

Examples:

- `customer.get_profile`
- `billing.get_subscription`
- `billing.list_invoices`
- `transactions.search`
- `orders.lookup`
- `tickets.search`
- `settings.get_support_config`
- `knowledge.search`

Each resource should declare:

- Name
- Description
- Input schema
- Output schema
- Required identity level
- Allowed data classification
- Rate limit
- Timeout
- Error behavior
- Whether output may be shown directly to the user

Example:

```ts
Lira.registerResource('transactions.search', {
  description: 'Search verified customer transactions by date, amount, merchant, or status.',
  authScope: 'verified_customer',
  inputSchema: {
    type: 'object',
    properties: {
      dateFrom: { type: 'string' },
      dateTo: { type: 'string' },
      status: { type: 'string' },
    },
  },
  outputSchema: {
    type: 'object',
    properties: {
      transactions: { type: 'array' },
    },
  },
  handler: async (input, ctx) => {
    return await lemonpayApi.searchTransactions({
      ...input,
      orgId: ctx.orgId,
      customerId: ctx.customerId,
    })
  },
})
```

Browser resources should only expose data already safe for that visitor. Server
resources should handle privileged reads.

### 5.5 Action layer

Actions are write operations.

Examples:

- `ticket.create`
- `ticket.assign`
- `subscription.cancel`
- `subscription.change_plan`
- `billing.retry_payment`
- `settings.update_support_home`
- `settings.toggle_channel`
- `password.send_reset`
- `conversation.escalate_to_human`

Each action should declare:

- Name
- Description
- Input schema
- Output schema
- Required identity level
- Risk tier
- Approval policy
- Idempotency behavior
- Audit fields
- Rollback/compensation behavior if available

Example:

```ts
Lira.registerAction('subscription.cancel', {
  description: "Cancel the verified customer's active subscription.",
  authScope: 'verified_customer',
  risk: 'customer_confirm',
  idempotencyKey: 'customerId:subscriptionId:cancel',
  inputSchema: {
    type: 'object',
    required: ['subscriptionId', 'reason'],
    properties: {
      subscriptionId: { type: 'string' },
      reason: { type: 'string' },
    },
  },
  handler: async (input, ctx) => {
    return await billing.cancelSubscription(input.subscriptionId, input.reason)
  },
})
```

### 5.6 Policy and approval engine

The current tool model has `hitl: "auto" | "confirm" | "human"` and
`authScope`. That is a good start, but the agentic runtime needs a central
policy engine.

Recommended risk tiers:

| Tier               | Meaning                        | Example                                   |
| ------------------ | ------------------------------ | ----------------------------------------- |
| `read_public`      | Public data only               | Pricing, docs, KB                         |
| `read_private`     | Verified account data          | Invoice lookup, transaction lookup        |
| `safe_write`       | Low-risk write                 | Create ticket, send reset email           |
| `customer_confirm` | Customer must approve          | Cancel subscription, change plan          |
| `step_up`          | Stronger verification required | Change payout account, refund money       |
| `admin_approve`    | Org admin approval required    | Change support settings, enable connector |
| `human_only`       | AI may draft, human executes   | Legal, compliance, high-risk finance      |

Policy must be enforced before execution. The model can request an action, but
the runtime decides whether it can proceed.

### 5.7 Agent executor

The current `lira-support-agent.service.ts` handles model calls, tools,
streaming, suggestions, HITL, and some execution details. Over time, this should
delegate execution to a dedicated agent runtime executor.

The executor should own:

- Tool/resource lookup
- Scope checks
- Policy checks
- Input validation
- Idempotency keys
- HITL state creation
- Action lifecycle events
- Audit logging
- Tool result formatting
- Retry and timeout behavior
- Max-step limits
- Evidence collection

The model should plan and respond. The executor should decide what is actually
allowed.

### 5.8 Memory, evidence, and audit

Every agentic interaction should produce traceable records:

- Conversation messages
- Runtime context snapshot used
- Resources called
- Actions requested
- Approvals requested
- Approvals granted/denied
- Final execution result
- Ticket created/updated
- Human handoff events

This should support:

- Debugging failed support flows
- Customer trust
- Internal QA
- Compliance and enterprise sales
- Agent evaluation tests

Important implementation note:

Do not store a full runtime snapshot for every message by default. That is too
expensive at scale. Store:

- A full snapshot at conversation start.
- A new full snapshot when identity, org, surface, or capability set changes.
- Diffs for normal message-to-message context changes.
- Full snapshots only for sampled debug sessions, failed action runs, policy
  denials, and explicit admin test-console runs.

### 5.9 Tenant isolation

Tenant isolation is the most important security property of the agentic
runtime. Every resource and action must be scoped by the authenticated
organization and verified visitor/customer identity before the model sees a
result.

Rules:

- `orgId` is always injected from the authenticated session, signed widget
  identity, or server-side route context.
- `orgId` supplied by the model, browser input, or tool arguments is ignored
  for authorization.
- Resource handlers run inside a scoped execution context:

```ts
type ScopedRuntimeContext = {
  orgId: string
  identityLevel: IdentityLevel
  visitorId?: string
  customerId?: string
  conversationId?: string
  allowedCapabilityNames: string[]
}
```

- Customer-specific resources must derive `customerId` from verified identity,
  not from model arguments.
- If a resource accepts an object ID, the handler must verify ownership before
  returning data.
- Dynamic SDK/browser resources can only provide data already visible to the
  current visitor.
- Server-side actions must check org ownership again at execution time, even if
  policy already approved the action.
- Audit logs must include the scoped `orgId`, but should not trust an `orgId`
  embedded in the tool input.

Example:

`transactions.search` should not accept arbitrary `orgId` and `customerId`
from the model. It should receive the search filters from the model, then add
the trusted org and customer scope inside the handler:

```ts
async function searchTransactions(input, ctx) {
  return db.transactions.findMany({
    where: {
      orgId: ctx.orgId,
      customerId: ctx.customerId,
      occurredAt: { gte: input.dateFrom, lte: input.dateTo },
      status: input.status,
    },
  })
}
```

Acceptance criteria:

- A LemonPay customer can never retrieve another LemonPay customer's data.
- A LemonPay tool can never retrieve another organization's data.
- No model-generated input is sufficient to cross tenant boundaries.

### 5.10 Cost, quota, and rate limits

Agentic capability calls create two kinds of cost:

- Model cost from planning and response generation.
- Downstream cost from resources/actions, such as Stripe, search, CRM, or
  customer backend APIs.

The runtime needs per-org and per-capability tracking, similar in spirit to
existing monthly AI reply counters.

Track:

- Model calls per conversation
- Tool/resource/action calls per conversation
- Capability calls per org per billing period
- Capability failures per org
- Average action latency
- Estimated model cost
- Estimated downstream connector cost where available
- Policy denials and approval abandonments

Initial quota model:

| Limit                         | Scope            | Reason                               |
| ----------------------------- | ---------------- | ------------------------------------ |
| `agent_messages_per_month`    | Org              | Existing support usage billing.      |
| `resource_calls_per_month`    | Org              | Prevent expensive live data lookups. |
| `action_runs_per_month`       | Org              | Prevent runaway write operations.    |
| `capability_calls_per_minute` | Org + capability | Protect downstream APIs.             |
| `failed_action_rate`          | Org + capability | Detect broken integrations.          |

Implementation notes:

- Add counters alongside current demo quota/rate-limit patterns.
- Show usage in admin settings before enforcing hard commercial limits.
- Policy should be able to block a capability when quota is exhausted.
- High-risk actions should have stricter limits than read resources.

### 5.11 PII and data classification

`dataClassification` must be a real enum, not a label with no behavior.

Recommended classes:

| Class                | Meaning                                   | Example                            | Model/log behavior                                    |
| -------------------- | ----------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| `public`             | Safe public information                   | Pricing, docs, product features    | Can be shown and logged.                              |
| `internal`           | Org configuration or operational metadata | Enabled channels, setup progress   | Can be shown to org admins, minimize public exposure. |
| `customer_personal`  | Customer identity or contact data         | Name, email, phone                 | Mask in logs unless needed.                           |
| `customer_financial` | Financial/account data                    | Invoice, subscription, transaction | Redact in logs, require verified identity.            |
| `sensitive_secret`   | Credentials or tokens                     | API keys, OAuth tokens             | Never send to model or logs.                          |
| `regulated`          | High-compliance data                      | Health, legal, government IDs      | Human-only or explicit enterprise policy.             |

Rules:

- Prompt context should contain summaries, not raw sensitive payloads.
- Logs should store redacted input/output summaries by default.
- Full raw payloads should only be stored when required for execution, encrypted,
  access-controlled, and retained for a defined period.
- `sensitive_secret` data must never be returned by a resource handler.
- Model-visible output should be filtered by identity level and surface.
- Ticket summaries should avoid unnecessary financial or personal details.

This is required for enterprise trust, SOC 2 readiness, GDPR handling, and any
future fintech/health/legal customer.

---

## 6. Proposed backend model

These names are conceptual. They can map onto DynamoDB items, Prisma models, or
existing tables depending on the service boundary.

V1 should not build separate registries for resources and actions. Use the
existing backend tool registry and evolve the tool type into a discriminated
union:

```ts
type AgentCapability =
  | ({ kind: 'resource' } & ResourceCapability)
  | ({ kind: 'action' } & ActionCapability)
```

This keeps the current tool-pack architecture intact while adding the metadata
needed for policy, audit, quota, and SDK integration.

### 6.1 AgentResource

Read-only capability available to an organization.

Fields:

- `orgId`
- `resourceId`
- `name`
- `description`
- `inputSchema`
- `outputSchema`
- `authScope`
- `dataClassification`
- `connectorId`
- `enabled`
- `rateLimit`
- `timeoutMs`
- `createdAt`
- `updatedAt`

### 6.2 AgentCapability

General definition for resources and actions.

Fields:

- `orgId`
- `capabilityId`
- `kind`: `resource` or `action`
- `name`
- `displayName`
- `description`
- `inputSchema`
- `outputSchema`
- `authScope`
- `risk`
- `enabled`
- `source`: `builtin`, `sdk`, `connector`, `custom_http`
- `packId`
- `createdAt`
- `updatedAt`

### 6.3 AgentPolicy

Execution policy for a capability.

Fields:

- `orgId`
- `policyId`
- `capabilityName`
- `risk`
- `requiredIdentity`
- `approvalMode`: `none`, `customer_confirm`, `step_up`, `admin_approve`, `human_only`
- `allowedSurfaces`
- `allowedRoles`
- `maxExecutionsPerHour`
- `requiresReason`
- `enabled`
- `createdAt`
- `updatedAt`

### 6.4 AgentActionRun

Audit record for every requested action.

Fields:

- `orgId`
- `runId`
- `conversationId`
- `visitorId`
- `customerId`
- `capabilityName`
- `input`
- `status`: `requested`, `blocked`, `pending_approval`, `approved`, `running`, `succeeded`, `failed`, `cancelled`
- `risk`
- `policyDecision`
- `approvalId`
- `idempotencyKey`
- `result`
- `error`
- `createdAt`
- `updatedAt`

### 6.5 AgentRuntimeSnapshot

Snapshot of context used for a model turn.

V1 should store full snapshots selectively and store diffs for normal
message-to-message changes.

Fields:

- `orgId`
- `conversationId`
- `messageId`
- `snapshotId`
- `schema`
- `identityLevel`
- `surface`
- `context`
- `availableResources`
- `availableActions`
- `createdAt`

### 6.6 AgentConnector

Connection to an external system.

Fields:

- `orgId`
- `connectorId`
- `type`: `stripe`, `slack`, `hubspot`, `custom_http`, `customer_backend`, etc.
- `status`
- `secretRef`
- `healthStatus`
- `lastCheckedAt`
- `scopes`
- `createdAt`
- `updatedAt`

Secrets should be encrypted. The current `pack-config.ts` TODO for KMS should
be resolved before broad customer rollout.

---

## 7. Backend API shape

The exact route names can follow current conventions, but the runtime needs a
clear API surface.

### 7.1 Admin runtime APIs

For Lira dashboard:

- `GET /lira/v1/support/agent-runtime/orgs/:orgId/capabilities`
- `POST /lira/v1/support/agent-runtime/orgs/:orgId/capabilities`
- `PATCH /lira/v1/support/agent-runtime/orgs/:orgId/capabilities/:capabilityId`
- `DELETE /lira/v1/support/agent-runtime/orgs/:orgId/capabilities/:capabilityId`
- `GET /lira/v1/support/agent-runtime/orgs/:orgId/policies`
- `PUT /lira/v1/support/agent-runtime/orgs/:orgId/policies/:policyId`
- `GET /lira/v1/support/agent-runtime/orgs/:orgId/action-runs`
- `GET /lira/v1/support/agent-runtime/orgs/:orgId/action-runs/:runId`
- `POST /lira/v1/support/agent-runtime/orgs/:orgId/simulate`

### 7.2 Runtime APIs

For widget/full-page SDK/internal agent:

- `POST /lira/v1/runtime/context`
- `POST /lira/v1/runtime/resources/:resourceName/query`
- `POST /lira/v1/runtime/actions/:actionName/request`
- `POST /lira/v1/runtime/actions/:runId/approve`
- `POST /lira/v1/runtime/actions/:runId/cancel`
- `POST /lira/v1/runtime/action-results`

### 7.3 Internal bridge

Current:

- `POST /lira/v1/internal/context/build`
- `POST /lira/v1/internal/tools/dispatch`

Target:

Keep these routes, but make them wrappers around the same runtime executor.
The Python/Pipecat side should stay stateless. Node should own:

- Tenant isolation
- Tool/resource registry
- Policy decisions
- Execution
- Audit
- HITL state

---

## 8. SDK contract evolution

Current SDK already exposes:

- `init`
- `identify`
- `logout`
- `setContext`
- `track`
- `mountWidget`
- `mountSupportPage`
- `registerAction`
- `unregisterAction`
- `listActions`

Recommended additions:

### 8.1 `setIdentity`

`identify` can remain as the public API, but internally we need a clearer
identity envelope.

```ts
Lira.setIdentity({
  externalId: 'cus_123',
  email: 'ada@lemonpay.com',
  name: 'Ada',
  verification: {
    method: 'host_jwt',
    token: signedIdentityJwt,
  },
})
```

### 8.2 `registerResource`

For safe client-readable resources.

```ts
Lira.registerResource('cart.current', {
  description: 'Read the current visitor cart.',
  authScope: 'verified_visitor',
  inputSchema: { type: 'object', properties: {} },
  outputSchema: { type: 'object' },
  handler: async () => window.app.cart.getCurrent(),
})
```

Browser resources should be treated as convenience context. Private or
privileged reads should be server-side resources.

### 8.3 Richer `registerAction`

Current action registration is useful, but it should include policy metadata.

```ts
Lira.registerAction('support.open_billing_page', {
  description: 'Navigate the verified user to the billing settings page.',
  authScope: 'verified_customer',
  risk: 'safe_write',
  inputSchema: {
    type: 'object',
    properties: {},
  },
  handler: async () => {
    router.push('/settings/billing')
    return { opened: true }
  },
})
```

### 8.4 Server-side action registration

For real businesses, many actions should be registered server-side through the
dashboard or API, not in the browser.

Examples:

- Cancel subscription
- Retry payment
- Issue refund
- Update CRM
- Change account limits
- Modify support workflows

Browser actions are good for navigation, UI prefill, local state, and low-risk
in-app operations. Server actions are required for trusted backend operations.

---

## 9. Admin dashboard experience

The dashboard needs an "Agent Runtime" or "Capabilities" area. This is where
organizations configure how agentic Lira is allowed to be.

V1 should not ship a nine-tab admin console. Collapse the dashboard to three
visible tabs and keep deeper debugging behind a developer toggle.

### 9.1 Capabilities

Shows resources and actions together because V1 uses one discriminated
capability registry.

Each capability should show:

- Kind: resource or action
- Source: built-in, connector, SDK/browser, server-side
- Enabled/disabled state
- Risk tier
- Required identity
- Approval mode
- Last success/failure
- Example prompt

V1 sources:

- Built-in packs
- Existing connector packs
- SDK/browser resources and actions
- Server-side actions registered through Lira

Do not include custom HTTP connectors in V1.

### 9.2 Policies

Admins choose how strict Lira should be.

Examples:

- "Creating tickets can run automatically."
- "Integration health checks can run automatically."
- "Cancelling subscriptions requires customer confirmation."
- "Refunds require human approval."
- "Changing support settings requires an admin."

This tab should use safe defaults and avoid exposing raw policy DSL in V1.

### 9.3 Audit

Shows:

- Every resource call
- Every action request
- Every approval
- Every execution result
- Who/what initiated it
- Conversation/ticket link
- Cost/quota metadata where available
- Redaction status for PII-bearing payloads

### 9.4 Developer-only views

These are useful, but should not block V1:

- Context inspector
- Test console
- Raw tool traces
- Runtime snapshots and diffs

Show them behind an internal/developer toggle until the main capability,
policy, and audit surfaces are stable.

---

## 10. Example flows

### 10.1 Fintech transaction lookup

Customer asks:

> I had a failed payment around May 15 last year. What happened?

Runtime flow:

1. Widget sends verified identity and page context.
2. Agent identifies this requires private account data.
3. Runtime verifies identity is `verified_customer`.
4. Agent calls `transactions.search` with date range around May 15.
5. Runtime returns only transactions for that verified customer.
6. Agent explains the result and cites the transaction status.
7. If unresolved, agent offers to create a ticket.
8. If user agrees, agent calls `ticket.create`.
9. Ticket includes conversation summary, transaction IDs, category, priority,
   and customer metadata.

Security rule:

- If the user is anonymous or only typed an email, the agent should ask them to
  log in or verify before looking up transactions.

### 10.2 Lira admin changes support settings

Admin asks:

> Turn off portal chat and update the home button to say Talk to support.

Runtime flow:

1. Dashboard sends org admin identity and route context.
2. Agent reads current support settings.
3. Agent proposes two changes.
4. Policy marks this as `admin_approve`.
5. Widget shows approval card.
6. Admin approves.
7. Runtime executes `settings.toggle_channel` and `settings.update_support_home`.
8. Audit records both changes.
9. Agent confirms what changed.

### 10.3 Landing-page visitor asks account-specific question

Visitor asks:

> I cannot upgrade my current plan.

Runtime flow:

1. Visitor is anonymous.
2. Agent acknowledges the issue.
3. Agent asks whether they already have an account.
4. If yes, agent offers login, Google sign-in, or password reset.
5. If no, agent offers demo, sales contact, or documentation.
6. Agent may create a lead/support ticket with email if provided.
7. Agent does not reveal account data until verified.

### 10.4 Customer cancellation

Customer asks:

> Cancel my subscription.

Runtime flow:

1. Runtime verifies customer identity.
2. Agent reads subscription state.
3. Agent summarizes impact: plan, renewal date, access period.
4. Policy requires `customer_confirm`.
5. User confirms.
6. Runtime executes cancellation with idempotency key.
7. Ticket/conversation/audit records are updated.

---

## 11. Implementation phases

These phases are the long-term roadmap, not the immediate build order. The
active engineering sequence is the three-slice plan in section 0.

### Phase 0: Architecture and vocabulary

Goal:

Align the platform around "agentic organization runtime" instead of isolated
widget features.

Deliverables:

- This document.
- Product vocabulary update: use "intelligent support", "agentic runtime",
  "organization-aware support", not "just AI chatbot."
- Add links from existing product-aware runtime and SDK docs.
- Define initial resource/action/policy vocabulary.

Acceptance criteria:

- Engineering can point to one doc for the full architecture.
- Existing docs clearly show how the internal runtime, SDK, tool packs, and
  ticketing fit together.

### Phase 1: Normalize runtime context

Goal:

Make context reliable, versioned, safe, and inspectable.

Frontend work:

- Update `src/lib/lira-runtime-context.ts` to emit a versioned context envelope.
- Update `packages/lira-support` `setContext` typing.
- Ensure widget, full-page embed, dashboard onboarding, and landing-page widget
  all use the same context contract.
- Add context reset on logout and identity changes.

Backend work:

- Add context schema validation.
- Sanitize context before model prompt injection.
- Store context snapshots economically: full snapshot at conversation start,
  diffs after that, and full snapshots for failures, policy denials, sampled
  debug sessions, and admin simulations.
- Add context hash/version to logs.

Admin UX:

- Add a context inspector in settings or developer tools.

Acceptance criteria:

- The assistant can answer "where am I?" from verified context.
- Logging out clears prior account context.
- Context is never blindly injected if schema validation fails.

### Phase 2: Dynamic capability registry

Goal:

Move from mostly static tool packs to one discriminated capability registry
that supports built-ins, existing connector packs, SDK-registered
resources/actions, and server-side actions.

Backend work:

- Extend `src/services/agent-tools/types.ts` with:
  - `kind`: resource/action
  - `risk`
  - `inputSchema`
  - `outputSchema`
  - `dataClassification`
  - `idempotency`
  - `audit`
- Extend `src/services/agent-tools/registry.ts` to merge:
  - Static built-ins
  - Enabled tool packs
  - Dynamic org capabilities
  - SDK/session capabilities where allowed
- Add persistence for capability definitions.
- Add admin routes for listing and configuring capabilities.

Frontend work:

- Add admin list of enabled capabilities.
- Show source: built-in, connector, SDK/browser, server-side.

Acceptance criteria:

- An org can enable/disable a capability without code changes.
- Agent tool availability changes based on org config and identity.

### Phase 3: Central policy and approval engine

Goal:

Replace scattered approval behavior with one enforceable policy layer.

Backend work:

- Add policy evaluation service.
- Convert existing `hitl` into policy decisions.
- Create `AgentActionRun` records for every action request.
- Route pending approvals through existing pending-state patterns.
- Support `customer_confirm`, `admin_approve`, `step_up`, and `human_only`.

Frontend work:

- Standardize action approval cards across widget, full-page embed, and
  dashboard assistant.
- Show why approval is needed.

Acceptance criteria:

- No action executes without policy approval.
- Action logs show requested, approved, executed, failed/cancelled states.
- Existing confirm-card flows continue working.

### Phase 4: SDK v2 resource/action contract

Goal:

Make the SDK a real agentic integration layer, not only a widget loader.

Frontend package work:

- Add `registerResource`.
- Expand `registerAction` with auth scope, risk, schemas, and metadata.
- Add `setIdentity` or formalize `identify` into verified identity handling.
- Add `setPolicyHints` only for UI hints, never backend enforcement.
- Add examples for:
  - React
  - Plain JavaScript
  - Full-page support page
  - Browser-safe action
  - Server-side action

Backend work:

- Accept SDK-advertised capabilities for session-scoped safe operations.
- Reject privileged browser-only capabilities.
- Add action result ingestion with validation.

Acceptance criteria:

- LemonPay-style customers can install the SDK and expose safe app context.
- The dashboard docs explain when to use browser actions vs server actions.

### Phase 5: Agent executor refactor

Goal:

Make the agent loop simpler and safer by moving execution into a dedicated
runtime executor.

Backend work:

- Create `agent-runtime-executor` service.
- Move validation, policy, approval, idempotency, audit, and result formatting
  out of `lira-support-agent.service.ts`.
- Keep `lira-support-agent.service.ts` focused on model interaction and
  streaming.
- Make `/lira/v1/internal/tools/dispatch` use the same executor.
- Add max-step limits and per-turn tool call budgets.

Acceptance criteria:

- Widget, full-page support, dashboard assistant, and internal routes execute
  tools through the same runtime.
- Tool failures produce useful user messages and developer logs.

### Phase 6: Admin Agent Runtime UI

Goal:

Give organizations control and visibility.

Frontend work:

- Add Agent Runtime section to support settings.
- Add V1 tabs:
  - Capabilities
  - Policies
  - Audit
- Add capability test runner.
- Add policy editor for common risk tiers.

Backend work:

- Add runtime admin APIs.
- Add simulation endpoint.
- Add audit query endpoint.

Acceptance criteria:

- An admin can see what Lira can read and do.
- An admin can disable risky actions.
- An admin can test a capability before exposing it to customers.

### Phase 7: Built-in support and operations packs

Goal:

Ship useful agentic behavior out of the box.

This phase is already partially shipped through ticketing, escalation,
integration health, setup progress, and onboarding tools. The work here is to
standardize them into the capability/policy/audit model, not to rebuild them.

Existing packs/capabilities to standardize into capability, policy, and audit:

- Support tickets
- Conversation escalation
- Support settings
- Knowledge base
- Integration health
- Setup progress and onboarding actions

New packs/capabilities to build later:

- Password reset
- Subscription changes
- Billing/invoices
- CRM notes
- Slack/internal alerts

Each standardized or new pack should include:

- Resources
- Actions
- Default policies
- Admin settings UI
- Tests

Acceptance criteria:

- Lira can handle common support workflows without custom code.
- Risky actions require confirmation or human approval.
- Existing ticketing, escalation, KB, settings, health, and onboarding tools
  are not rebuilt; they are formalized into the shared runtime model.

### Phase 8: Customer-facing agentic UX

Goal:

Make agentic behavior understandable and trustworthy in the widget.

Widget/full-page work:

- Show "what I checked" evidence for account-specific answers.
- Show action lifecycle cards.
- Show approval cards with clear impact.
- Show ticket creation summaries.
- Support multi-conversation topic threads.
- Preserve Home/Chat navigation across widget, dashboard, and embeds.

Acceptance criteria:

- Customers understand when Lira is reading data vs taking action.
- Customers can approve or cancel actions confidently.
- Conversations remain organized by topic.

### Phase 9: Evaluation and dogfood

Goal:

Prove safety and usefulness before broad rollout.

Test tracks:

- Lira internal admin onboarding
- Nimbus demo
- LemonPay-style fintech customer
- Anonymous landing-page visitor
- Verified customer account support
- Human handoff and ticketing

Required evals:

- Does not reveal private data to anonymous visitor.
- Uses resources instead of hallucinating live account facts.
- Creates correct ticket category/priority from conversation.
- Requires confirmation for destructive actions.
- Refuses or escalates unsupported operations.
- Logs complete audit trail.

Acceptance criteria:

- Dogfood script includes resource/action/policy tests.
- Backend logs show no unhandled execution failures.
- Product can demo agentic behavior without manual explanation.

Current status:

- Runtime diagnostics are partially covered by integration health, widget
  console attribution, and troubleshooting docs.
- Behavioral safety evals are still pending. Diagnostics answer "does the
  plumbing work?" Safety evals answer "does the agent do the right thing under
  risky or ambiguous conditions?"

### Phase 10: GA readiness

Goal:

Prepare for paid customer use.

Requirements:

- SDK docs published.
- Example apps published.
- Tenant isolation reviewed.
- Rate limits enforced.
- Connector secrets encrypted.
- Audit logs retained.
- Admin policy defaults safe.
- Support runbooks written.
- Versioning and migration strategy documented.

Acceptance criteria:

- A real customer can install the SDK, configure resources/actions, test them,
  and go live without Lira engineering manually wiring everything.

---

## 12. How current files should evolve

| Current file                                          | Direction                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `packages/lira-support/src/core.ts`                   | Add `registerResource`, richer `registerAction`, identity/context versioning, runtime action result contract. |
| `packages/lira-support/src/types.ts`                  | Add resource/action/policy/context types.                                                                     |
| `packages/lira-support/src/react.tsx`                 | Add provider/hooks for context, identity, and support page runtime.                                           |
| `src/components/support-widget/widget.ts`             | Support evidence cards, approval cards, multi-conversation topic list, Home/Chat consistency.                 |
| `src/lib/lira-runtime-context.ts`                     | Become the canonical frontend runtime context builder.                                                        |
| `src/pages/support/SupportSettingsPage.tsx`           | Add Agent Runtime entry points and home/widget customization controls.                                        |
| Backend `src/services/agent-tools/types.ts`           | Expand tool model into capability model with resources/actions/policies.                                      |
| Backend `src/services/agent-tools/registry.ts`        | Merge static and dynamic org capabilities.                                                                    |
| Backend `src/services/agent-tools/pack-config.ts`     | Add secret encryption, connector health, and pack policy defaults.                                            |
| Backend `src/services/lira-support-agent.service.ts`  | Delegate execution to runtime executor.                                                                       |
| Backend `src/services/lira-support-action.service.ts` | Consolidate with `AgentActionRun` and policy/audit engine.                                                    |
| Backend `src/routes/lira-internal.routes.ts`          | Keep as stateless bridge, but route through shared runtime executor.                                          |
| Backend ticketing services                            | Become first-class support action/resource pack.                                                              |

---

## 13. First implementation slice

The actual first implementation is the three-slice plan in section 0:

1. Audit + capability metadata.
2. Central policy decision engine.
3. SDK `registerResource` + server-side action registration.

Do not start with the full admin console, custom HTTP connectors, or a large
executor rewrite. Those become easier once the existing ticketing, health
check, onboarding, and support-setting actions are audited and policy-governed.

---

## 14. Open questions

- Which actions require step-up verification in the first paid release?
- How much of the runtime inspector should be visible to normal org admins vs
  Lira internal admins?

Answered decisions:

- Dynamic capabilities should live in DynamoDB for v1. That matches current
  support config storage, keeps the per-org partition model natural, and avoids
  introducing a second persistence path before the runtime shape stabilizes.
- Default customer-app identity verification for v1 is HMAC because that is
  already shipped. JWT can be added later for customers that prefer token-based
  identity.
- V1 should use built-in packs, existing connector packs, SDK/browser
  resources/actions, and server-side action registration. Custom HTTP
  connectors are deferred to v2 because they raise reliability, auth, PII, and
  policy risks.
- End users should see evidence summaries in the widget, such as "I checked
  your billing settings" or "I looked up your latest ticket." Org admins should
  see full resource/action traces in the audit view.

---

## 15. Recommended decision

Build this as a platform runtime, not as isolated widget intelligence.

The widget is only one surface. The real product is the shared runtime that
lets every surface safely understand the organization and take approved action.
That is what makes Lira agentic, defensible, and useful to B2B customers.
