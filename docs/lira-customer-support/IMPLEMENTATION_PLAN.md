# Lira Customer Support — Implementation Plan

> **Version:** 1.1 — April 10, 2026  
> **Author:** Engineering  
> **Status:** Reviewed — Ready for Implementation  
> **Backend:** `/creovine-api` (Fastify + DynamoDB + Qdrant + OpenAI)  
> **Frontend:** `/lira_ai` (React + Vite + Tailwind + shadcn/ui + Zustand)

---

## Guiding Principles

1. **Build backend-first.** Every frontend screen connects to a real API — no mock data ships to production.
2. **Match existing patterns.** DynamoDB single-table, Fastify route/service split, Zustand stores, shadcn/ui components. No new paradigms.
3. **Consolidate screens.** Use tabbed layouts (like KnowledgeBasePage) instead of 27 separate page files. Target ~8 frontend pages total for V1.
4. **Ship a working email support loop first.** Customer emails → AI classifies → RAG-grounded reply → escalation if unsure. Everything else builds on this core.
5. **Reuse what exists.** Email inbound pipeline (SES → S3 → SNS), Qdrant RAG, integration adapters (HubSpot/Salesforce/Linear/Slack), Nova Sonic voice — already built. Wire them, don't rebuild.

---

## Architecture Overview

```
                    ┌──────────────────────────────────────────────┐
                    │             INBOUND CHANNELS                 │
                    │  Email (SES→SNS)  │  Chat (WS)  │  Voice    │
                    └──────────┬───────────────────────────────────┘
                               │ normalize to SupportEvent
                    ┌──────────▼───────────────────────────────────┐
                    │         CUSTOMER IDENTITY RESOLVER           │
                    │  Match sender → CUSTOMER# in DynamoDB        │
                    │  Pull CRM context (HubSpot/Salesforce)       │
                    │  Load conversation history                   │
                    └──────────┬───────────────────────────────────┘
                               │
                    ┌──────────▼───────────────────────────────────┐
                    │         INTENT CLASSIFIER (GPT-4o-mini)      │
                    │  Classify: info / action / complaint / esc   │
                    │  Confidence score → autonomous vs escalate   │
                    └──────────┬───────────────────────────────────┘
                               │
                  ┌────────────┴────────────┐
                  ▼                         ▼
           AUTONOMOUS                 ESCALATION
           REPLY ENGINE               ENGINE
           (RAG + GPT-4o)             (Linear ticket +
           Reply via same channel      Slack notify +
                                       human inbox)
                  │                         │
                  └────────────┬────────────┘
                               ▼
                    ┌──────────────────────────────────────────────┐
                    │         OUTCOME LOGGER                       │
                    │  Log resolution to customer profile          │
                    │  Track: autonomous / escalated / failed      │
                    │  Trigger self-learning if escalated          │
                    └──────────────────────────────────────────────┘
```

---

## DynamoDB Key Design (New Items)

All new items follow the existing single-table pattern on `lira-organizations`.

| Entity                     | PK                                  | SK                              | Notes                                                                                                                           |
| -------------------------- | ----------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Support Config             | `ORG#<orgId>`                       | `SUPPORT_CONFIG`                | Module settings, enabled channels, onboarding state                                                                             |
| Customer Profile           | `ORG#<orgId>`                       | `CUSTOMER#<customerId>`         | Name, email, tier, churnScore, CRM IDs                                                                                          |
| Customer Reverse Lookup    | `CUSTOMER_EMAIL#<normalized_email>` | `ORG#<orgId>`                   | Resolves inbound email → customer + org. **Email MUST be lowercased before write and query** — DynamoDB keys are case-sensitive |
| Support Conversation       | `ORG#<orgId>`                       | `SUPPORT_CONV#<convId>`         | Thread: channel, status, messages[], customer ref                                                                               |
| Support Ticket             | `ORG#<orgId>`                       | `SUPPORT_TICKET#<ticketId>`     | Escalated items: assignee, priority, linked conv                                                                                |
| Action Log                 | `ORG#<orgId>`                       | `SUPPORT_ACTION#<actionId>`     | Integration actions executed per conversation                                                                                   |
| Proactive Trigger          | `ORG#<orgId>`                       | `SUPPORT_TRIGGER#<triggerId>`   | Event type, conditions, template, channel                                                                                       |
| Proactive Outreach Log     | `ORG#<orgId>`                       | `SUPPORT_OUTREACH#<outreachId>` | What was sent, to whom, outcome                                                                                                 |
| KB Draft (from escalation) | `ORG#<orgId>`                       | `KB_DRAFT#<draftId>`            | AI-drafted KB entry pending approval                                                                                            |

**GSI needed:** `GSI-CustomerEmail` — PK: `CUSTOMER_EMAIL#<normalized_email>`, SK: `ORG#<orgId>` — for fast inbound email → customer resolution.

**Critical: Email normalization.** All email addresses MUST be lowercased (`email.trim().toLowerCase()`) before writing to or querying this GSI. DynamoDB keys are case-sensitive — `Alice@Company.com` and `alice@company.com` are different keys. Enforce this in `resolveCustomerByEmail()` and `createCustomer()`.

**Critical: Tenant isolation on GSI queries.** Always query this GSI with BOTH the PK (`CUSTOMER_EMAIL#<email>`) AND the SK (`ORG#<orgId>`). Never query by email alone — a consultant could exist as a customer under multiple orgs. Omitting the SK filter leaks cross-tenant data.

---

## Phase Breakdown

---

### Phase 1 — Core Support Loop (Backend)

**Goal:** Customer sends email → Lira resolves or escalates → outcome logged  
**Duration estimate:** 2–3 weeks  
**Dependency:** None (builds on existing email pipeline)

#### 1.1 — Support Config & Module Activation

**Backend (`creovine-api`):**

| File                                          | What                                                                                                                                      |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/models/lira-support.models.ts`           | TypeScript interfaces for all new DynamoDB items: `SupportConfig`, `CustomerProfile`, `SupportConversation`, `SupportTicket`, `ActionLog` |
| `src/services/lira-support-config.service.ts` | CRUD for `SUPPORT_CONFIG` item. Default config factory. `activateModule(orgId)` writes initial config                                     |
| `src/routes/lira-support-config.routes.ts`    | `GET /lira/v1/orgs/:orgId/support/config` — get config. `PUT` — update config. `POST /activate` — first-time activation                   |

**Config shape:**

```ts
interface SupportConfig {
  PK: string // ORG#<orgId>
  SK: 'SUPPORT_CONFIG'
  org_id: string
  activated: boolean
  activated_at?: string

  // Channels
  email_enabled: boolean
  email_address?: string // support@company.com
  email_verified: boolean
  chat_enabled: boolean
  voice_enabled: boolean

  // Behavior
  auto_reply_enabled: boolean
  confidence_threshold: number // 0.0–1.0, default 0.7
  force_escalate_intents: string[] // intents that ALWAYS escalate regardless of confidence
  // default: ['data_privacy', 'account_security', 'legal', 'fraud']
  escalation_slack_channel?: string
  escalation_linear_team?: string

  // Volume limits (enforced via existing requireFeature() middleware)
  max_conversations_per_month: number // default: 500 (free), 5000 (pro), unlimited (enterprise)
  max_ai_replies_per_month: number // default: 200 (free), 2000 (pro), unlimited (enterprise)

  // Onboarding progress
  onboarding_completed: boolean
  onboarding_step: string // tracks where user left off

  created_at: string
  updated_at: string
}
```

**Auth:** All support routes use existing `jwtWithTenantAuth` middleware. `orgId` extracted from JWT + route param.

#### 1.2 — Customer Identity & Profiles

**Backend:**

| File                                            | What                                                                                                                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-customer.service.ts` | `resolveCustomerByEmail(orgId, email)` — lookup or auto-create. `getCustomer(orgId, customerId)`. `listCustomers(orgId, filters)`. `updateCustomer()`. `syncFromCRM(orgId, customerId)` — pull from HubSpot/Salesforce |
| `src/routes/lira-support-customer.routes.ts`    | `GET /orgs/:orgId/support/customers` — paginated list. `GET /:customerId` — profile. `PUT /:customerId` — update. `POST /` — create manually. `POST /import-crm` — bulk import from connected CRM                      |

**Customer resolution flow:**

1. Inbound email arrives → extract sender address → **normalize to lowercase**
2. Query GSI `CUSTOMER_EMAIL#<lowercased_email>` + `ORG#<orgId>` (always include both PK and SK)
3. If found → load full `CUSTOMER#<id>` profile
4. If not found → auto-create profile with name from email headers, tier=standard
5. If CRM connected → async enrich: pull HubSpot/Salesforce contact data, merge into profile

**Customer profile shape:**

```ts
interface CustomerProfile {
  PK: string // ORG#<orgId>
  SK: string // CUSTOMER#<customerId>
  customer_id: string
  org_id: string
  name: string
  email: string
  phone?: string
  company?: string

  // CRM links
  hubspot_contact_id?: string
  salesforce_contact_id?: string

  // Derived counters (updated on each conversation create/resolve)
  tier: 'standard' | 'vip' | 'enterprise' // set manually or via CRM sync
  total_conversations: number
  total_escalations: number
  last_contacted_at?: string

  // NOTE: churn_risk_score and sentiment_trend removed from V1.
  // These are computed fields with no defined computation source yet.
  // Add in V2 when we have enough conversation data to build a scoring model.
  // Shipping empty computed fields erodes trust in the dashboard.

  created_at: string
  updated_at: string
}
```

#### 1.3 — Support Conversation Engine

This is the core. Extends the existing email inbound pipeline to handle support conversations.

**Backend:**

| File                                                | What                                                                                                                                                                                                                                                                |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-conversation.service.ts` | `createConversation()`, `appendMessage()`, `getConversation()`, `listConversations(orgId, filters)`, `updateStatus()`, `resolveConversation()`                                                                                                                      |
| `src/services/lira-support-classifier.service.ts`   | `classifyIntent(message, customerProfile, ragContext)` → returns `{ intent, confidence, sentiment, suggestedActions }`. Uses GPT-4o-mini                                                                                                                            |
| `src/services/lira-support-reply.service.ts`        | `generateReply(conversation, customerProfile, ragContext, orgContext)` → grounded AI reply. `sendReply(conversation, replyText, channel)`                                                                                                                           |
| `src/routes/lira-support-inbox.routes.ts`           | `GET /orgs/:orgId/support/conversations` — list (filterable by status, channel, customer). `GET /:convId` — detail with messages. `POST /:convId/reply` — manual human reply. `POST /:convId/resolve` — mark resolved. `POST /:convId/escalate` — manual escalation |

**Conversation shape:**

```ts
interface SupportConversation {
  PK: string // ORG#<orgId>
  SK: string // SUPPORT_CONV#<convId>
  conv_id: string
  org_id: string
  customer_id: string

  channel: 'email' | 'chat' | 'voice'
  subject?: string
  status: 'open' | 'pending' | 'resolved' | 'escalated'
  resolution_type?: 'autonomous' | 'human' | 'failed'

  // AI classification
  intent?: string // billing, technical, account, general, etc.
  sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent'
  confidence?: number

  // Thread
  messages: ConversationMessage[]

  // Outcome
  csat_score?: number // 1–5
  csat_collected_at?: string

  // Linked resources
  ticket_id?: string // if escalated
  action_ids: string[] // actions executed
  knowledge_sources: string[] // KB entries used in reply

  created_at: string
  updated_at: string
  resolved_at?: string
}

interface ConversationMessage {
  id: string
  role: 'customer' | 'lira' | 'agent' // agent = human override
  body: string
  channel: 'email' | 'chat' | 'voice'
  timestamp: string
  metadata?: {
    email_message_id?: string
    confidence?: number
    grounded_in?: string[] // KB entry IDs used
  }
}
```

#### 1.4 — Inbound Email → Support Pipeline

**What changes:** The existing email inbound handler (`lira-email-reply.service.ts`) currently routes replies to internal org members via reply tokens. We need a **parallel path** for external customer support emails.

**Approach:** Do NOT modify the existing email reply flow. Instead:

1. Add a new inbound email route: `POST /lira/v1/support/email/inbound`
2. Configure a separate SES receipt rule for the org's support email address → SNS → this new endpoint
3. This handler does:
   - Parse MIME email (same `simpleParser` pattern)
   - Extract sender email
   - Resolve customer: `resolveCustomerByEmail(orgId, senderEmail)`
   - Match to existing conversation (by email thread headers `In-Reply-To` / `References`) OR create new
   - **Threading fallback:** If no thread headers match (mobile clients, forwarding apps, CRM systems strip headers), search for an open conversation from the same customer email within the last 7 days and link to it. Only create a new conversation if no open thread exists. Log all threading failures to a `threading_failures` counter for monitoring.
   - Enrich context: load customer profile + last 3 conversations + Qdrant RAG search
   - Classify intent via `classifyIntent()`
   - **Check `force_escalate_intents`:** If classified intent is in the org's `force_escalate_intents` list (e.g., `data_privacy`, `account_security`, `legal`, `fraud`), escalate immediately regardless of confidence score. The cost of a wrong autonomous reply on these topics is too high.
   - **Check volume limits:** If org has exceeded `max_ai_replies_per_month`, escalate to human instead of generating AI reply.
   - If confidence ≥ threshold AND intent not force-escalated → generate & send AI reply
   - If confidence < threshold OR force-escalated → escalate (create ticket, notify Slack)
   - Log outcome to conversation

| File                                         | What                                                                                                  |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/routes/lira-support-email.routes.ts`    | `POST /support/email/inbound` — SNS webhook handler (same signature verification pattern as existing) |
| `src/services/lira-support-email.service.ts` | `handleInboundSupportEmail(snsPayload)` — the full pipeline above                                     |

**Key decision:** Each org gets a unique support email: `support-<orgId>@liraintelligence.com`. SES receipt rules route to the correct org. This avoids multi-tenant confusion on a single inbox.

#### 1.5 — Escalation Engine

When Lira can't handle a conversation (low confidence, customer explicitly requests human, sensitive topic):

| File                                              | What                                                                                                  |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-escalation.service.ts` | `escalateConversation(orgId, convId, reason)` — creates ticket, notifies Slack/Teams, assigns to team |

**Escalation flow:**

1. Create `SUPPORT_TICKET#<ticketId>` in DynamoDB
2. If Linear connected → create Linear issue via existing `linearAdapter.createIssue()`
3. If Slack connected → post to escalation channel via existing `slackAdapter.postMessage()`
4. Update conversation status to `escalated`
5. Email customer: "I've connected you with our team. You'll hear back within [SLA]."

**SLA tracking:** Each ticket stores `escalated_at`, `sla_target` (configurable per org in SupportConfig), and `sla_breach_notified_at` (prevents duplicate alerts). A scheduled poller (reuse the existing SQS delayed message pattern) checks tickets approaching SLA breach and sends a proactive Slack/email notification 10 minutes before the target. This is a Phase 2 addition — but the `sla_breach_notified_at` field is included in the V1 data model so we don't need a migration later.

#### 1.6 — Manual Things Needed Before Phase 1

These require manual AWS / DNS setup:

| Task                                 | Who           | Details                                                                                                                                     |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| SES receipt rule for support emails  | You/DevOps    | Create SES receipt rule: `support-*@liraintelligence.com` → S3 bucket `lira-inbound-support-email` → SNS topic `lira-support-email-inbound` |
| SNS subscription                     | You/DevOps    | Subscribe the new endpoint `https://api.creovine.com/lira/v1/support/email/inbound` to the SNS topic                                        |
| DynamoDB GSI                         | You/DevOps    | Add `GSI-CustomerEmail` on the existing `lira-organizations` table. PK: `CUSTOMER_EMAIL_PK` (string), SK: `CUSTOMER_EMAIL_SK` (string)      |
| Verify `liraintelligence.com` in SES | Already done? | Needed for sending replies from `support-<orgId>@liraintelligence.com`                                                                      |

**Timing: Do these in parallel with the first week of Phase 1 development, not after.** Phase 1 code cannot be tested end-to-end without the SES receipt rule and GSI in place. Start the AWS setup on Day 1.

---

### Phase 2 — Frontend: Support Dashboard & Inbox

**Goal:** Admin can see support activity, read conversations, reply manually, manage customers  
**Duration estimate:** 2 weeks  
**Dependency:** Phase 1 backend APIs

#### 2.1 — Zustand Store

| File                             | What                                                                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/store/support-store.ts` | `useSupportStore` — mirrors existing store pattern (see `useTaskStore`, `useKBStore`). Holds: `config`, `conversations[]`, `customers[]`, `selectedConvId`, `filters`, `stats` |

**Store actions:**

```ts
interface SupportStore {
  // Config
  config: SupportConfig | null
  loadConfig: (orgId: string) => Promise<void>
  activateModule: (orgId: string) => Promise<void>

  // Conversations (inbox)
  conversations: SupportConversation[]
  loadConversations: (orgId: string, filters?) => Promise<void>
  selectedConversation: SupportConversation | null
  loadConversation: (orgId: string, convId: string) => Promise<void>
  sendReply: (orgId: string, convId: string, body: string) => Promise<void>
  resolveConversation: (orgId: string, convId: string) => Promise<void>
  escalateConversation: (orgId: string, convId: string, reason: string) => Promise<void>

  // Customers
  customers: CustomerProfile[]
  loadCustomers: (orgId: string, filters?) => Promise<void>
  selectedCustomer: CustomerProfile | null
  loadCustomer: (orgId: string, customerId: string) => Promise<void>

  // Stats
  stats: SupportStats | null
  loadStats: (orgId: string) => Promise<void>

  // Clear on org switch
  clear: () => void
}
```

#### 2.2 — API Service Layer

| File                          | What                                                                                                                                                                                                                                     |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/support-api.ts` | All API calls: `getSupportConfig()`, `activateSupport()`, `listConversations()`, `getConversation()`, `sendReply()`, `listCustomers()`, `getCustomer()`, `getSupportStats()`, etc. Follows existing `api.ts` patterns with `authFetch()` |

#### 2.3 — Frontend Pages (8 total)

All pages use **shadcn/ui + Tailwind** matching existing design language. No neumorphic styles.

**Route entry point:** `/support` redirects to `/support/inbox`. No separate dashboard page — stats are a collapsible header within the inbox.

| #   | Page                          | Route                    | Layout                                                                                                                                                                                                                                                                                        |
| --- | ----------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **SupportActivatePage**       | `/support/activate`      | Full-screen modal (no shell). First-time activation + onboarding stepper                                                                                                                                                                                                                      |
| 2   | **SupportInboxPage**          | `/support/inbox`         | Master-detail: conversation list (left) + conversation detail (right). Filters in a popover, not a column. **This is the primary landing page.** `/support` redirects here. Dashboard stats are a collapsible header within this page, not a separate page. Support agents live in the inbox. |
| 3   | **SupportConversationPage**   | `/support/inbox/:id`     | Full conversation view. Message thread + right sidebar (customer info, actions taken, KB sources). Tabs at bottom: "Reply" / "Escalate" / "Internal Note"                                                                                                                                     |
| 4   | **SupportCustomersPage**      | `/support/customers`     | Tabbed: **List** (searchable table) / **Import** (CRM sync)                                                                                                                                                                                                                                   |
| 5   | **SupportCustomerDetailPage** | `/support/customers/:id` | Tabbed: **Profile** (info + CRM links) / **Timeline** (all interactions) / **Conversations** (linked convs)                                                                                                                                                                                   |
| 6   | **SupportKnowledgePage**      | `/support/knowledge`     | Tabbed: **Library** (existing KB, reuse KnowledgeBasePage panels) / **AI Drafts** (pending approval queue) / **Gaps** (report)                                                                                                                                                                |
| 7   | **SupportSettingsPage**       | `/support/settings`      | Tabbed: **Channels** (email/chat/voice config) / **Behavior** (confidence threshold, force-escalate intents, auto-reply toggle, volume limits) / **Escalation** (Slack channel, Linear team, SLA)                                                                                             |

#### 2.4 — Sidebar Navigation

Add to `AppShell.tsx` NAV array:

```ts
{
  label: 'Support',
  icon: ChatBubbleLeftEllipsisIcon,
  badge: 'New',
  children: [
    { to: '/support/inbox',     icon: InboxIcon,       label: 'Inbox' },
    { to: '/support/customers', icon: UserGroupIcon,   label: 'Customers' },
    { to: '/support/knowledge', icon: BookOpenIcon,     label: 'Knowledge' },
    { to: '/support/settings',  icon: Cog6ToothIcon,   label: 'Settings' },
  ],
}
```

**Note:** "Proactive", "Actions", and "Analytics" nav items are added in later phases when built.

#### 2.5 — Onboarding Flow (inside SupportActivatePage)

Step-by-step wizard using shadcn `Dialog` + progress bar. 5 steps (not 7 — voice is optional and gets its own settings tab):

1. **Email Setup** — Input support email, verify ownership, configure sender name
2. **Chat Widget** — Enable/disable, color picker, greeting message, embed code
3. **Connect Integrations** — Show already-connected integrations, offer to connect new ones (reuses existing OAuth flows)
4. **Seed Knowledge** — Website URL crawl + file upload (reuses existing KB crawl/upload pipeline). **Crawl runs async — show "Crawling in progress, you can continue" state.** Reuse the existing `CrawlStatusBanner` component pattern. Do NOT block the stepper on crawl completion.
5. **Test & Activate** — Send test email, watch Lira respond, activate

Each step calls the backend to persist progress (`PATCH /support/config`).

---

### Phase 3 — Autonomous Action Engine (Backend + Frontend)

**Goal:** Lira doesn't just reply — she takes actions across integrations  
**Duration estimate:** 2–3 weeks  
**Dependency:** Phase 1 + Phase 2

#### 3.1 — Action Orchestration (Backend)

| File                                          | What                                                                                                                                                                                                        |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-action.service.ts` | `planActions(conversation, intent, customerProfile)` — LLM decides what actions to take. `executeActionChain(orgId, actions[])` — runs actions sequentially. `logAction()` — writes `SUPPORT_ACTION#` items |

**Action types (V1):**
| Action | Integration | What it does |
|---|---|---|
| `crm_lookup` | HubSpot / Salesforce | Query contact/deal for customer context |
| `crm_update` | HubSpot / Salesforce | Update contact field (e.g., mark as "support-active") |
| `ticket_create` | Linear | Create issue when escalated |
| `slack_notify` | Slack | Post to channel on escalation or resolution |
| `email_followup` | Resend | Schedule follow-up email |

**How it works:**

1. Intent classifier returns `suggestedActions[]`
2. Action planner validates each action against org's connected integrations
3. For low-risk actions (lookup, notify): execute immediately
4. For high-risk actions (refund, account change): queue for admin approval
5. Each action result is logged and fed back into conversation context
6. If all actions succeed → auto-reply to customer with summary

**Failure handling: stop-on-failure, no rollback.**

- `executeActionChain()` runs actions sequentially
- If action N fails (API down, rate limit, auth expired): **stop immediately**, do NOT continue with remaining actions
- Log all completed actions + the failed action with error details
- Do NOT attempt rollback — CRM updates, Slack messages, and Linear tickets are not easily reversible
- Surface partial execution clearly in the Action Chain panel: "3 of 5 actions completed. Action 4 (Salesforce update) failed: rate limit exceeded."
- Notify the assigned agent or escalation channel of the partial failure
- The conversation moves to `pending` status for human review

**Action approval thresholds** (configurable per org in SupportConfig):

```ts
interface ActionApprovalConfig {
  auto_approve: string[] // ['crm_lookup', 'slack_notify']
  require_approval: string[] // ['refund_initiate', 'account_update']
}
```

#### 3.2 — Action Frontend

Add to SupportInboxPage conversation detail:

- **Action Chain panel** — shows actions Lira took/plans to take for this conversation
- **Approval badge** in sidebar nav if pending approvals exist

Add new page:

| #   | Page                   | Route              | Layout                                                                                                                                                         |
| --- | ---------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8   | **SupportActionsPage** | `/support/actions` | Tabbed: **Approval Queue** (pending actions needing human OK) / **History** (all executed actions) / **Integration Health** (status of each connected service) |

Add nav item:

```ts
{ to: '/support/actions', icon: CpuChipIcon, label: 'Actions' }
```

---

### Phase 4 — Chat Widget (Backend + Frontend)

**Goal:** Embeddable chat widget for the org's website. Customers chat in real-time with Lira.  
**Duration estimate:** 2 weeks  
**Dependency:** Phase 1 (conversation engine)

#### 4.1 — Chat WebSocket Backend

| File                                        | What                                                                                                                                                |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/lira-support-chat.routes.ts`    | WebSocket endpoint: `WSS /lira/v1/support/chat`. Auth via signed widget token (HMAC, similar to existing WS auth)                                   |
| `src/services/lira-support-chat.service.ts` | `handleChatConnection(ws, orgId, customerId)` — manages WS lifecycle. Messages → same conversation engine as email. Real-time AI response streaming |

**Widget auth:** Org embeds a `<script>` that inits with `orgId` + optional signed `userId` (HMAC). Anonymous users get a session-based temporary ID. Authenticated users link to their CustomerProfile.

#### 4.2 — Embeddable Widget (Separate Build)

| File                             | What                                                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/support-widget/` | Self-contained React widget that compiles to a single JS file. Loaded via `<script src="https://cdn.liraintelligence.com/widget.js">` |

**Widget states:**

- Launcher button (floating, bottom-right)
- Open chat (greeting + message input)
- Active conversation (message thread, real-time)
- Closed / resolved (CSAT prompt)

**Build:** Separate Vite config in the same repo (`vite.widget.config.ts`), outputs to `dist/widget/`. Does not bundle with the main Lira dashboard.

**CDN hosting: S3 + CloudFront** (decided). The widget loads on third-party customer domains, so it needs proper CORS headers and a CDN that serves a standalone JS file reliably. Vercel adds unnecessary complexity for a single static asset. CloudFront also gives us cache invalidation control on widget updates.

- Widget URL: `https://widget.liraintelligence.com/v1/widget.js`
- CloudFront distribution with CORS: `Access-Control-Allow-Origin: *`
- Content Security Policy documentation for customers embedding the widget

#### 4.3 — Widget Settings in Dashboard

Added to **SupportSettingsPage** → "Chat Widget" tab:

- Toggle on/off
- Color picker, greeting, position
- Embed code snippet with copy button
- Live preview

---

### Phase 5 — Proactive Support Engine (Backend + Frontend)

**Goal:** Lira monitors product events and reaches out to customers before they complain  
**Duration estimate:** 2 weeks  
**Dependency:** Phase 1 (customer profiles + conversation engine)

#### 5.1 — Proactive Trigger Engine (Backend)

| File                                             | What                                                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/routes/lira-support-webhook.routes.ts`      | `POST /lira/v1/support/webhook/:orgId` — receives product events from client's system. HMAC-SHA256 signature verification. Responds 200 immediately, processes async                        |
| `src/services/lira-support-proactive.service.ts` | `evaluateTriggers(orgId, event)` — loads all `SUPPORT_TRIGGER#` items for org, checks conditions, fires outreach. `createTrigger()`, `updateTrigger()`, `listTriggers()`, `deleteTrigger()` |
| `src/services/lira-support-outreach.service.ts`  | `sendProactiveOutreach(orgId, customerId, trigger, eventData)` — compose message from template + event data, send via email (Resend) or voice (Nova Sonic). Log to `SUPPORT_OUTREACH#`      |

**Trigger evaluation:**

```ts
interface ProactiveTrigger {
  PK: string // ORG#<orgId>
  SK: string // SUPPORT_TRIGGER#<triggerId>
  trigger_id: string
  org_id: string
  name: string
  event_type: string // "payment.failed", "kyc.blocked", etc.
  conditions: TriggerCondition[] // [{ field: "data.amount", operator: "gt", value: 1000 }]
  outreach_template: string // Handlebars: "Hi {{customer.name}}, we noticed..."
  channel: 'email' | 'voice'
  enabled: boolean
  cooldown_hours: number // Don't re-trigger for same customer within N hours
  max_per_customer_per_day: number // Default: 1. Proactive outreach that feels excessive
  // destroys customer trust faster than no outreach at all.
  created_at: string
  updated_at: string
}
```

**Webhook payload format (what the client sends):**

```json
{
  "event": "payment.failed",
  "customerId": "cust_abc123",
  "timestamp": "2026-04-10T14:32:00Z",
  "data": {
    "amount": 2000,
    "currency": "USD",
    "failureCode": "insufficient_funds"
  }
}
```

**Security:**

- Each org gets a webhook signing secret (generated at activation, stored encrypted). The client signs payloads with HMAC-SHA256 using this secret. Lira validates before processing.
- **Payload size limit: 64KB.** Enforce via Fastify `bodyLimit` on this route. Prevents accidental or malicious oversized payloads. 64KB is more than sufficient for any reasonable event payload.
- **Schema validation:** Validate payload against Zod schema before processing — `event` (string, required), `customerId` (string, required), `timestamp` (ISO8601), `data` (object). Reject malformed payloads with 422 before any AI/DB processing.

#### 5.2 — Proactive Frontend

| #   | Page                     | Route                | Layout                                                                                                |
| --- | ------------------------ | -------------------- | ----------------------------------------------------------------------------------------------------- |
| 9   | **SupportProactivePage** | `/support/proactive` | Tabbed: **Triggers** (list of configured triggers + create new) / **Activity Log** (outreach history) |

Trigger creation uses a **wizard modal** (not a separate page):

1. Event type (text input or dropdown of common events)
2. Conditions (simple rule builder: field + operator + value)
3. Message template (textarea with variable insertion `{{customer.name}}`, `{{event.data.amount}}`)
4. Channel + cooldown
5. Test (send test outreach to self)

Add nav item:

```ts
{ to: '/support/proactive', icon: BoltIcon, label: 'Proactive' }
```

---

### Phase 6 — Self-Learning Knowledge Engine (Backend + Frontend)

**Goal:** Escalated conversations automatically generate KB draft entries  
**Duration estimate:** 1.5 weeks  
**Dependency:** Phase 1 (escalation) + Phase 3 (action engine)

#### 6.1 — Escalation Analysis Pipeline (Backend)

| File                                            | What                                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/services/lira-support-learning.service.ts` | `analyzeEscalation(orgId, convId)` — triggered after escalation is resolved by human. GPT-4o-mini analyzes: "Why couldn't Lira answer? What knowledge was missing?" Returns gap identification + draft KB entry. `createKBDraft(orgId, draft)` — writes `KB_DRAFT#` item |

**Flow:**

1. Human resolves an escalated conversation (via manual reply)
2. System triggers `analyzeEscalation()` async
3. GPT-4o-mini receives: the original customer question, Lira's failed attempt, the human's successful resolution
4. Output: `{ gap: "No documentation for API error 4023", draft: { title: "...", body: "..." } }`
5. Draft saved as `KB_DRAFT#<draftId>` with status `pending_review`
6. Admin sees it in the Knowledge → AI Drafts tab

**Admin actions on draft:**

- **Approve** → Index into Qdrant (reuses existing `bulkIndexEmbeddings()`), move to active KB
- **Edit + Approve** → Edit text first, then index
- **Reject** → Delete draft, optionally mark "not needed"

#### 6.2 — Weekly Improvement Metrics

| File                                             | What                                                                                                                                                                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-analytics.service.ts` | `getSupportStats(orgId, dateRange)` — queries conversations + tickets for: resolution rate, escalation rate, avg response time, top unresolved topics, CSAT average. `getWeeklyReport(orgId)` — formatted summary |
| `src/routes/lira-support-analytics.routes.ts`    | `GET /orgs/:orgId/support/analytics` — stats. `GET /analytics/weekly` — weekly report                                                                                                                             |

#### 6.3 — Knowledge Frontend Updates

Update **SupportKnowledgePage** tabs:

- **AI Drafts tab:** List of pending drafts with approve/edit/reject buttons
- **Gaps tab:** Report showing top unanswered question categories, number of escalations per topic

---

### Phase 7 — Analytics Dashboard (Frontend)

**Goal:** Complete visibility into support performance  
**Duration estimate:** 1 week  
**Dependency:** Phase 6 analytics backend

| #   | Page                     | Route                | Layout                                                                                                                                                     |
| --- | ------------------------ | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10  | **SupportAnalyticsPage** | `/support/analytics` | Tabbed: **Overview** (key metrics + charts) / **Proactive** (outreach performance) / **Self-Improvement** (weekly resolution/escalation trends, KB growth) |

**Overview tab metrics:**

- Resolution rate (autonomous vs escalated) — donut chart
- Average first response time — stat card
- Conversations over time — line chart
- CSAT distribution — bar chart
- Top intent categories — horizontal bar chart

Add nav item:

```ts
{ to: '/support/analytics', icon: ChartBarIcon, label: 'Analytics' }
```

---

### Phase 8 — Voice Support (Backend)

**Goal:** Customers call a phone number, Lira picks up  
**Duration estimate:** 2 weeks  
**Dependency:** Phase 1 + existing Nova Sonic infrastructure

#### 8.1 — Inbound Voice Pipeline

| File                                         | What                                                                                                                                                                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/lira-support-voice.service.ts` | `handleInboundCall(callSid, orgId, callerPhone)` — resolve customer by phone, start Nova Sonic session with support system prompt + customer context, stream conversation, on call end → transcribe → create/update conversation record |
| `src/routes/lira-support-voice.routes.ts`    | Twilio/SIP webhook handlers for call lifecycle events                                                                                                                                                                                   |

**Approach:** Reuse the existing Nova Sonic bidirectional streaming pipeline. The system prompt changes from "meeting participant" to "support agent." Customer context (profile + history) is injected into the prompt.

**Critical: Audio format conversion.** Twilio sends audio as µ-law encoded 8kHz by default. Nova Sonic expects 16kHz linear16 PCM. This is a non-trivial conversion that must happen in real-time with <50ms latency to stay within the ~200ms total voice latency budget. Implementation:

- Receive Twilio media stream (µ-law 8kHz, 20ms frames)
- Convert µ-law → linear16 PCM (lookup table, fast)
- Upsample 8kHz → 16kHz (linear interpolation or sinc resampling)
- Feed to Nova Sonic input stream
- Reverse path: Nova Sonic output (16kHz PCM) → downsample to 8kHz → encode µ-law → Twilio
- Use a Node.js Transform stream for the conversion pipeline

**What's needed externally:**

- Twilio account + phone number provisioning
- SIP trunking configuration → route to Nova Sonic handler
- Phone number management UI in SupportSettingsPage → "Voice" tab

---

### Phase 9 — CSAT Collection & Outcome Tracking

**Goal:** Verify customer satisfaction post-resolution. Track outcomes for future pricing model.  
**Duration estimate:** 1 week  
**Dependency:** Phase 1

#### 9.1 — CSAT Collection

**After a conversation is resolved:**

1. Wait 1 hour (configurable), then send CSAT email
2. Email contains 1-click rating (1–5 stars as links)
3. Each link hits: `GET /lira/v1/support/csat/:convId/:score/:token` — one-time token to prevent tampering
4. Score stored on conversation record

**For chat:** Show inline CSAT prompt in chat widget after resolution.

| File                                        | What                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/services/lira-support-csat.service.ts` | `scheduleCsatCollection(orgId, convId)` — **SQS delayed message** (not `setTimeout`). Uses the same SQS delayed delivery pattern as document processing and website crawling. A simple `setTimeout` in-process will be lost on server restart. `recordCsat(convId, score)` — update conversation |
| `src/routes/lira-support-csat.routes.ts`    | `GET /support/csat/:convId/:score/:token` — public, no auth, validated by one-time HMAC token                                                                                                                                                                                                    |

#### 9.2 — Outcome Tracking

Every resolved conversation logs:

```ts
{
  outcome: 'autonomous' | 'escalated_then_resolved' | 'failed',
  csat_score?: number,
  response_time_ms: number,
  actions_taken: number,
  knowledge_sources_used: number,
}
```

This data feeds into the analytics dashboard. Outcome-based pricing logic is deferred — the data collection happens now, the billing engine is a separate project when you have paying customers.

---

## Summary: What Ships When

| Phase | What                    | Backend Files (new)      | Frontend Pages (new)        | Est. Duration |
| ----- | ----------------------- | ------------------------ | --------------------------- | ------------- |
| **1** | Core support loop       | 7 services + 3 routes    | —                           | 2–3 weeks     |
| **2** | Dashboard + Inbox       | 1 API service            | 7 pages + store             | 2 weeks       |
| **3** | Action engine           | 1 service                | 1 page (Actions)            | 2–3 weeks     |
| **4** | Chat widget             | 2 services + 1 route     | Widget build + settings tab | 2 weeks       |
| **5** | Proactive engine        | 3 services + 1 route     | 1 page (Proactive)          | 2 weeks       |
| **6** | Self-learning KB        | 2 services + 1 route     | KB page updates             | 1.5 weeks     |
| **7** | Analytics dashboard     | — (uses Phase 6 backend) | 1 page (Analytics)          | 1 week        |
| **8** | Voice support           | 2 services + 1 route     | Settings tab update         | 2 weeks       |
| **9** | CSAT + Outcome tracking | 2 services + 1 route     | CSAT widget in chat         | 1 week        |

**Total: ~15–17 weeks if sequential. Phases 2+3 can partially overlap with Phase 1 testing.**

**Recommended release milestones:**

- **V1 (Phases 1+2):** Email-based AI support with inbox dashboard → 4–5 weeks
- **V2 (Phases 3+5):** Action engine + Proactive triggers → +4 weeks
- **V3 (Phases 4+6+7):** Chat widget + self-learning + analytics → +4 weeks
- **V4 (Phases 8+9):** Voice + CSAT → +3 weeks

---

## What I Need From You (Manual Steps)

| #   | What                                                  | When           | Notes                                                                                   |
| --- | ----------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| 1   | SES receipt rule for `support-*@liraintelligence.com` | Before Phase 1 | Route to new S3 bucket + SNS topic                                                      |
| 2   | DynamoDB GSI for customer email lookup                | Before Phase 1 | `GSI-CustomerEmail` on `lira-organizations` table                                       |
| 3   | Twilio account + phone number                         | Before Phase 8 | For voice support                                                                       |
| 4   | S3 bucket + CloudFront distribution for widget CDN    | Before Phase 4 | `widget.liraintelligence.com` → CloudFront → S3. CORS: `Access-Control-Allow-Origin: *` |
| 5   | Confirm SES sending limits                            | Before Phase 1 | Currently in sandbox? Need production access for bulk email                             |
| 6   | Review HMAC signing approach for widget auth          | Before Phase 4 | Confirm the org embeds a server-side HMAC, not client-side                              |

---

## What We're NOT Building (Scoped Out)

| Feature                                    | Why Not Now                                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------- |
| Outcome-based billing engine               | Need paying customers first. Track the data now, build billing later            |
| Auto-publish KB entries                    | Dangerous without human review. Keep approve-only for V1                        |
| Multi-language support                     | English-first, add i18n layer when needed                                       |
| SLA breach alerts (proactive notification) | V2 — data model includes `sla_breach_notified_at` now, poller logic added in V2 |
| Custom email domains per org               | V2 — enterprise requirement, adds DNS verification complexity per org           |
| Customer-facing portal / ticket tracker    | V2 — start with email/chat, no self-serve portal                                |
| Video support                              | Out of scope entirely                                                           |

---

## Resolved Decisions

Previously open questions, now resolved after review:

| #   | Question                | Decision                                                                                                                    |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | Support email routing   | Start with `support-<orgId>@liraintelligence.com`. Custom domains deferred to V2 when enterprise customers request it.      |
| 2   | Knowledge base sharing  | Share the existing org KB. No separate support KB — creates maintenance overhead with no benefit.                           |
| 3   | Route namespace         | `/support/*` top-level. Major product surface, not a sub-feature.                                                           |
| 4   | Chat widget build       | Separate Vite config (`vite.widget.config.ts`) in the same repo. CDN: S3 + CloudFront at `widget.liraintelligence.com`.     |
| 5   | Proactive rate limiting | Default: **1/day** per customer, configurable per org. Excessive proactive outreach destroys trust faster than no outreach. |
