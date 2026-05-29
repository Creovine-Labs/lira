# Lira Ticketing System Foundation Review

Generated: 2026-05-28

Status: Strategy proposal only. No product code has been changed from this
document. Use this as the approval point before implementing the ticketing
rebuild in phases.

## Executive Recommendation

Lira should not become a generic ticket-first helpdesk clone. The strongest
position is:

> Lira is conversation-first support, with tickets as the accountability layer.

That means the assistant keeps helping in chat, but when a customer issue needs
ownership, follow-up, SLA tracking, attachments, external work, or human review,
Lira opens a ticket that becomes the durable work record.

The current architecture is already pointing in the right direction. The next
step is to make the ticketing layer production-grade: structured categories,
routing, SLA, audit history, secure customer access, event-driven integrations,
and a better operator workflow.

## What Exists Today

### Strong Pieces Already Present

- `creovine-backend/src/services/lira-ticket.service.ts` correctly treats
  tickets as a separate async track from live assistant chat.
- Ticket rows and ticket messages are already separate records, which is the
  right shape for durable ticket threads.
- Tickets can be created manually from the dashboard.
- Tickets can be created from the assistant/handoff flow.
- Ticket records already include useful fields: source, subject, summary,
  priority, status, visitor email/name, ticket number, handoff trigger,
  handoff brief, attachments, Linear/Slack references, and SLA target.
- `lira-support-handoff.service.ts` already includes the right high-level
  concepts: trigger evaluation, structured handoff brief, and round-trip
  learning after resolution.
- `SupportTicketsPage.tsx` already gives operators a ticket list, detail view,
  reply flow, attachments, handoff brief regeneration, and resolve flow.
- The dogfood plan already tests the core ticket lifecycle in
  `docs/DOGFOOD_TEST_PLAN.md`.

### Main Gaps

1. There are multiple ticket creation paths.
   - Newer flow: `lira-ticket.service.createTicket`.
   - Legacy/escalation paths still exist around `escalate_to_human` and
     older escalation services.
   - This can lead to inconsistent ticket fields, missing ticket numbers, and
     fragmented behavior.

2. Ticket classification is not yet a first-class object.
   - Conversation has `intent`, `sentiment`, and `confidence`.
   - Ticket has `priority`, `summary`, and tags indirectly.
   - Missing: category, subcategory, product area, queue, confidence, evidence,
     priority reason, suggested owner, dedupe key, and required next actions.

3. Status lifecycle is too thin.
   - Current ticket states are `open`, `in_progress`, `resolved`, `closed`.
   - Mature ticketing needs at least: new, triaged, in progress, waiting on
     customer, waiting on internal/vendor, resolved, closed, reopened, merged.

4. SLA is only partially modeled.
   - Tickets have `sla_target`, but there is no full SLA policy engine,
     working-hours model, first-response due date, next-response due date,
     resolution due date, breach events, or escalation queue.

5. Routing is not yet a platform concept.
   - There is no durable Team/Queue model.
   - Assignee exists, but there is no routing rule engine, capacity logic,
     queue ownership, or assignment history.

6. Public visitor ticket access is too weak.
   - Visitor endpoints use email/ticket-number style checks.
   - This is fine for internal dogfood but should not become the final security
     model. We need signed ticket access tokens, verified visitor sessions, or
     customer auth integration.

7. No immutable ticket timeline.
   - Replies are stored, but operational events are not first-class.
   - A production ticket needs an audit trail for create, classify, assign,
     status change, priority change, SLA applied, external sync, reply,
     resolution, reopen, merge, and delete/archive.

8. Integrations are not abstracted around ticket events.
   - Slack and Linear exist as references/hooks, but the ticket system should
     emit events like `ticket.created`, `ticket.assigned`, `ticket.replied`,
     `ticket.resolved`, and `ticket.sla_breached`.
   - Adapters should subscribe through an outbox pattern so retries and
     idempotency are reliable.

9. Operator UX needs a stronger triage experience.
   - Current UI is usable, but world-class support teams expect search,
     saved views, queue filters, assignment, internal notes, macros/canned
     replies, merge/duplicate handling, and SLA/aging visibility.

10. Reporting is not ticket-native enough yet.
    - We need backlog, aging, SLA breach rate, first response time, resolution
      time, reopen rate, category volume, AI-to-ticket conversion rate,
      knowledge gaps, and owner/team performance.

## External Systems Reviewed

These references were used to understand mature open-source/helpdesk patterns:

- Chatwoot GitHub repository:
  https://github.com/chatwoot/chatwoot
- Chatwoot automation/SLA feature docs:
  https://www.chatwoot.com/features/automations
- Zammad ticket state docs:
  https://user-docs.zammad.org/en/6.2/basics/service-ticket/settings/state.html
- Zammad SLA docs:
  https://admin-docs.zammad.org/en/latest/manage/slas.html
- FreeScout GitHub repository:
  https://github.com/freescout-help-desk/freescout
- GitLab Service Desk docs:
  https://docs.gitlab.com/user/project/service_desk/
- GitLab Service Desk configuration/security docs:
  https://docs.gitlab.com/user/project/service_desk/configure/

### Lessons From Chatwoot

Chatwoot is conversation-centered. It focuses on omnichannel conversations,
labels, teams, assignment, canned responses, business hours, automation,
webhooks, APIs, and reporting.

Relevant lesson for Lira:

- Keep the conversation as the customer-facing entry point.
- Add operations primitives around it: labels/categories, teams, assignment,
  automation, SLA, and reports.
- Make repetitive work rule-driven but keep human judgment available through
  macros and approvals.

### Lessons From Zammad

Zammad treats ticket state and SLA as deeply connected. Its docs distinguish
between states such as new, open, and pending because SLA clocks depend on
state.

Relevant lesson for Lira:

- Status cannot be cosmetic. It must drive SLA clocks and queue behavior.
- Pending/waiting states matter because they pause or change SLA expectations.
- Agents need overviews for tickets that are escalated or approaching breach.

### Lessons From FreeScout

FreeScout is intentionally lightweight: shared inbox, conversations, mailboxes,
attachments, merge/move, collision detection, mobile-friendly UI, and privacy.

Relevant lesson for Lira:

- Do not overbuild the first version into a project-management suite.
- Make the operator workflow fast and obvious.
- Add collision detection/internal notes before adding complex enterprise
  features.

### Lessons From GitLab Service Desk

GitLab Service Desk is useful because support tickets map into the engineering
workflow. Customers interact by email without needing GitLab accounts, while
internal teams work inside issues.

Relevant lesson for Lira:

- External participants should not need a Lira account.
- Internal teams need strong integration with their work system.
- Security and identity matter. Email-only access is convenient but must be
  carefully controlled.

## Target Architecture

### Core Principle

The assistant should not "hand over" the live chat every time it creates a
ticket. Ticket creation should mean:

- The issue now has an owner and durable record.
- The customer gets a ticket number and expectations.
- The support team gets context, priority, SLA, and next action.
- The assistant can still continue helping if it can.

### Core Domain Objects

Add or formalize these models over time:

1. `SupportTicket`
   - Current state and denormalized fields for list views.

2. `SupportTicketMessage`
   - Public/customer/agent thread messages and attachments.

3. `TicketEvent`
   - Immutable audit and automation timeline.
   - Examples: created, classified, assigned, priority_changed,
     status_changed, sla_applied, reply_added, external_sync_started,
     external_sync_failed, resolved, reopened, merged.

4. `TicketClassification`
   - Assistant-generated structured understanding of the issue.

5. `TicketCategory`
   - Per-org taxonomy. Start with Lira defaults, then allow org overrides.

6. `SupportQueue` or `SupportTeam`
   - Routing target for tickets.

7. `SLAPolicy`
   - Defines response/resolution targets by priority, category, tier, and
     working hours.

8. `TicketAutomationRule`
   - Trigger/condition/action rules for assignment, tagging, notifications,
     and priority changes.

9. `ExternalTicketLink`
   - Links to Linear, Jira, GitHub, HubSpot, Slack, email thread, or CRM record.

10. `TicketRelation`
    - Duplicate, merged, parent/child, related incident, or linked task.

### Ticket Classification Schema

Every assistant-created ticket should run through a structured classifier before
creation. Manual tickets can optionally run through the same classifier as a
"Let Lira organize this" step.

Suggested schema:

```ts
type TicketClassification = {
  category: string
  subcategory?: string
  product_area?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  priority_reason: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  confidence: number
  suggested_queue?: string
  suggested_assignee_user_id?: string
  customer_impact?: string
  required_actions: string[]
  evidence_quotes: string[]
  dedupe_key?: string
  pii_flags: string[]
  security_flags: string[]
  should_create_ticket: boolean
  should_ask_clarifying_question: boolean
  clarifying_question?: string
  suggested_reply_to_customer?: string
}
```

Rules:

- If confidence is high, create the ticket with classification attached.
- If confidence is medium and the issue is not sensitive, ask one clarifying
  question with suggested reply chips.
- If the issue is security, legal, fraud, billing dispute, or account access,
  create or offer a ticket immediately based on org policy.
- Never invent a category. Use `uncategorized` with low confidence if needed.

### Ticket Lifecycle

Keep the existing public status compatibility but introduce internal states.

Recommended internal states:

- `new`: created, not reviewed.
- `triaged`: category/priority/queue set.
- `in_progress`: human or integration is actively working.
- `waiting_on_customer`: customer reply needed; customer-facing status is
  "Waiting for you".
- `waiting_on_internal`: engineering, billing, vendor, or another team needed.
- `resolved`: answer/work provided; can reopen.
- `closed`: final state after resolution window.
- `reopened`: customer responded after resolution or SLA requires reopening.
- `merged`: duplicate merged into another ticket.
- `archived`: hidden from default queues but retained for audit.

Compatibility mapping for current UI/API:

| Internal state                   | Existing API status                      |
| -------------------------------- | ---------------------------------------- |
| new, triaged                     | open                                     |
| in_progress, waiting_on_internal | in_progress                              |
| waiting_on_customer              | open or pending if we add pending to API |
| resolved, reopened               | resolved or open depending on transition |
| closed, merged, archived         | closed                                   |

Recommendation: add `pending` to `TicketStatus` rather than overloading `open`.
It will make SLA behavior and customer-facing messaging clearer.

### SLA Model

Add SLA as policy plus timestamps, not only one target field.

Suggested ticket fields:

```ts
sla_policy_id?: string
first_response_due_at?: string
next_response_due_at?: string
resolution_due_at?: string
first_response_at?: string
last_customer_reply_at?: string
last_agent_reply_at?: string
sla_status?: 'ok' | 'at_risk' | 'breached' | 'paused'
sla_breached_at?: string
```

SLA behavior:

- First response clock starts when ticket is created.
- Next response clock starts each time the customer replies.
- Resolution clock starts at creation unless policy says otherwise.
- `waiting_on_customer` pauses next-response and resolution clocks.
- `waiting_on_internal` may keep resolution clock running unless policy says
  it pauses.
- Breach and at-risk transitions emit `TicketEvent` records.

### Routing Model

Start simple, but make it structured from day one.

Routing inputs:

- category
- product area
- priority
- customer tier
- language
- source surface
- org-configured rules
- integration/tool availability
- security/PII flags

Routing outputs:

- queue/team
- assignee
- priority
- SLA policy
- external sync target
- notification target

Example default rules:

| Condition                                       | Action                                  |
| ----------------------------------------------- | --------------------------------------- |
| category = billing                              | queue = Billing                         |
| category = account_access                       | queue = Support, priority >= high       |
| customer tier = enterprise and priority >= high | queue = VIP Support                     |
| product_area = API or SDK                       | queue = Technical Support               |
| security_flags not empty                        | queue = Security, restricted visibility |
| confidence < 0.55                               | queue = Triage                          |

### Ticket Event Timeline

Add immutable events before adding complex automation. This makes debugging,
analytics, and integrations far easier.

Suggested event shape:

```ts
type TicketEvent = {
  event_id: string
  org_id: string
  ticket_id: string
  type:
    | 'ticket.created'
    | 'ticket.classified'
    | 'ticket.assigned'
    | 'ticket.status_changed'
    | 'ticket.priority_changed'
    | 'ticket.message_added'
    | 'ticket.sla_applied'
    | 'ticket.sla_at_risk'
    | 'ticket.sla_breached'
    | 'ticket.external_sync_started'
    | 'ticket.external_sync_completed'
    | 'ticket.external_sync_failed'
    | 'ticket.resolved'
    | 'ticket.reopened'
    | 'ticket.merged'
  actor_type: 'visitor' | 'agent' | 'assistant' | 'system' | 'integration'
  actor_id?: string
  data: Record<string, unknown>
  created_at: string
}
```

Every ticket action should write an event. The ticket row remains the fast
current-state snapshot.

### Integration Architecture

Use an outbox pattern rather than calling every external tool inline from the
request path.

Flow:

1. Ticket changes.
2. Write ticket row update.
3. Write `TicketEvent`.
4. Write `IntegrationOutboxItem` for configured integrations.
5. Worker processes outbox with retries and idempotency keys.
6. External IDs are stored in `ExternalTicketLink`.

Events to support:

- `ticket.created`
- `ticket.classified`
- `ticket.assigned`
- `ticket.message_added`
- `ticket.status_changed`
- `ticket.resolved`
- `ticket.sla_at_risk`
- `ticket.sla_breached`

Adapters:

- Slack: post channel notification, keep thread updated.
- Linear/Jira/GitHub: create or update issue/task.
- HubSpot/Salesforce: add support timeline activity.
- Email: send customer ticket receipt and reply notifications.
- Webhooks: customer-owned automation.

Lira ticket remains the source of truth. External tools are synced views, not
the primary record.

### Storage and Indexing

Current DynamoDB single-table storage can still work, but the access patterns
need explicit indexes.

Required access patterns:

- tickets by org and status
- tickets by org and assignee
- tickets by org and queue/team
- tickets by org and category
- tickets by org and SLA due time
- tickets by visitor email or verified visitor id
- ticket by human ticket number
- events/messages by ticket

Suggested logical keys:

```txt
PK = ORG#<orgId>
SK = SUPPORT_TICKET#<ticketId>

PK = ORG#<orgId>
SK = SUPPORT_TICKET_MSG#<ticketId>#<createdAt>#<messageId>

PK = ORG#<orgId>
SK = SUPPORT_TICKET_EVENT#<ticketId>#<createdAt>#<eventId>
```

Suggested secondary indexes:

```txt
GSI_STATUS:   ORG#<orgId>#STATUS#<status>      sort updated_at
GSI_ASSIGNEE: ORG#<orgId>#ASSIGNEE#<userId>    sort updated_at
GSI_QUEUE:    ORG#<orgId>#QUEUE#<queueId>      sort updated_at
GSI_VISITOR:  ORG#<orgId>#VISITOR#<visitorKey> sort created_at
GSI_SLA:      ORG#<orgId>#SLA_DUE              sort next_due_at
GSI_NUMBER:   TICKET_NUMBER#<ticketNumber>     sort org_id
```

If the current table can only support limited GSIs, use overloaded index keys:

```txt
GSI1PK = ORG#<orgId>#STATUS#<status>
GSI1SK = updated_at

GSI2PK = ORG#<orgId>#ASSIGNEE#<userId>
GSI2SK = updated_at

GSI3PK = ORG#<orgId>#VISITOR#<emailOrVisitorId>
GSI3SK = created_at
```

The immediate fix is to stop visitor ticket lookup from scanning all tickets.

### Secure Customer Access

Do not rely on email alone for final visitor ticket access.

Recommended layers:

1. Anonymous visitor opens ticket from widget.
   - Generate ticket number and one-time access token.
   - Email customer a magic ticket link.

2. Verified widget visitor.
   - Use existing HMAC identity mode.
   - Link tickets to verified visitor id and email.

3. Full support page/customer portal.
   - If the customer platform can identify the user, use signed identity.
   - If not, ask for email and send a magic link before showing ticket history.

4. Replies by email.
   - Include signed reply token in inbound email address or headers.
   - Do not accept arbitrary email + ticket number as enough proof forever.

### Operator UX Target

The ticket page should become a triage workspace, not only a list.

Recommended first operator screens:

1. Queue inbox
   - Saved views: Unassigned, Mine, Breaching soon, VIP, Waiting on customer,
     New, Engineering, Billing, Security.
   - Filters: status, priority, queue, assignee, category, source, SLA,
     customer tier, updated date.
   - Search: ticket number, subject, customer email/name, category.

2. Ticket detail
   - Customer profile card.
   - Handoff brief.
   - Timeline with messages and system events.
   - Internal notes.
   - Reply composer with canned responses/macros.
   - Classification card with category, priority reason, confidence, evidence.
   - Linked conversation transcript.
   - Linked external issues.
   - Assignment/queue/status controls.
   - SLA clock and breach warnings.

3. Triage command bar
   - Assign to me.
   - Change queue.
   - Change priority.
   - Merge duplicate.
   - Create Linear/Jira issue.
   - Ask Lira to summarize.
   - Ask Lira to draft reply.
   - Resolve and create KB draft.

4. Collision detection
   - Show when another teammate is viewing or replying to the same ticket.

### Customer-Facing Ticket UX

Customer should see:

- ticket number
- current status
- expected response window
- latest reply
- full thread
- attachments
- ability to add more detail
- ability to close or say "still need help"

Customer should not see:

- internal priority reason
- internal notes
- security flags
- assignee workload
- private external issue links

## Comparison With `Lira-Ticketing-Escalation-System.md`

Reviewed local source:

```txt
/Users/apple/Downloads/Lira-Ticketing-Escalation-System.md
```

That document is a useful market-standard support operations spec. It strongly
aligns with this review on classification, queues, assignment, SLA, escalation,
internal notes, audit trail, customer notifications, CSAT, and reopen logic.

The main difference is product philosophy:

- The downloaded document assumes every customer contact becomes a ticket.
- Lira should keep live assistant conversations as the first support surface,
  and create a ticket when accountability is needed.

In practice, this means Lira should have two related records:

1. `SupportConversation`
   - Every support interaction starts here.
   - The assistant can resolve simple questions without creating ticket backlog.

2. `SupportTicket`
   - Created when the issue needs follow-up, human ownership, SLA tracking,
     escalation, attachments, external work, or customer-visible case tracking.

This preserves the market-standard ticket lifecycle without turning every chat
message into operational noise.

### Additions To Adopt

The downloaded document adds several details that should be added to our build
plan.

#### 1. First Response as a Separate SLA Metric

Our review already proposed `first_response_due_at`, but the downloaded spec
makes the operational importance clearer.

Add:

- `first_response_due_at`
- `first_response_at`
- `first_response_actor_type`
- `first_response_sla_status`

Important product rule:

- A ticket creation acknowledgement is not the same as a human first response.
- If Lira sends an immediate receipt, that satisfies "customer notified" but
  should not always satisfy "human first response" unless the org config allows
  assistant response to count.

#### 2. Internal Notes as a First-Class Message Type

Our review mentions internal notes in the operator UX, but the data model should
make this explicit.

Add `SupportTicketMessage.visibility`:

```ts
visibility: 'public' | 'internal'
```

Rules:

- Public messages are visible to the customer.
- Internal notes are visible only to operators.
- Escalation handoff notes must be internal by default.
- Internal notes must never be returned by customer-facing APIs or SDK views.

#### 3. Pending Customer Reminders and Auto-Close

The downloaded spec defines the practical workflow for `pending`.

Add:

- `pending_since`
- `pending_reminder_due_at`
- `pending_auto_close_due_at`
- `pending_reason`

Default behavior:

- Move to `pending` when waiting on customer.
- Pause SLA according to policy.
- Send reminder after 24 hours.
- Auto-close after 72 hours or org-configured window.
- Reopen automatically when the customer replies.

#### 4. Escalation Tier and Acknowledgement Window

Our review includes queues and routing, but the downloaded spec adds a useful
distinction between assignment and escalation acknowledgement.

Add fields:

```ts
escalation_tier?: 1 | 2 | 3 | 4
escalated_from_queue_id?: string
escalated_to_queue_id?: string
escalated_to_user_id?: string
escalation_ack_due_at?: string
escalation_acknowledged_at?: string
escalation_acknowledged_by?: string
```

Add events:

- `ticket.escalated`
- `ticket.escalation_acknowledged`
- `ticket.escalation_ack_missed`
- `ticket.escalation_rerouted`

Default acknowledgement windows from the downloaded spec:

| Priority | Ack window |
| -------- | ---------- |
| urgent   | 5 minutes  |
| high     | 15 minutes |
| medium   | 1 hour     |
| low      | 4 hours    |

#### 5. Assignment Modes and Agent Capacity

Our review says "routing rules", but the downloaded spec is clearer about
assignment modes.

Add queue assignment modes:

- manual pick
- supervisor assign
- round robin
- least busy
- skills based
- preferred agent

Add agent capacity fields:

- availability: online, busy, away, offline
- max concurrent tickets
- current active ticket count
- skills/categories
- preferred customer relationships, later phase

This should be Phase 3B, after basic queues exist.

#### 6. Unassigned Ticket Alerts

Add an explicit unassigned alert policy:

- urgent unassigned after 10 minutes
- high unassigned after 30 minutes
- configurable by org and SLA policy

Add event:

- `ticket.unassigned_alerted`

#### 7. Resolution Variants

The downloaded spec has stronger closure semantics than our review.

Add resolution type:

```ts
resolution_type:
  | 'fixed'
  | 'workaround'
  | 'no_response'
  | 'duplicate'
  | 'customer_withdrew'
  | 'not_reproducible'
```

Keep `status` separate from `resolution_type`.

#### 8. Reopen Window and Reopen Count

Our review mentions reopen, but the downloaded spec adds useful guardrails.

Add:

- `reopen_window_ends_at`
- `reopen_count`
- `last_reopened_at`
- `reopen_reason`

Default:

- Customer reply within 7 days of `resolved` reopens the ticket.
- More than two reopens flags the ticket for supervisor review.

#### 9. Customer Notification Templates

Our review includes notification concepts, but the downloaded spec makes clear
which lifecycle points need templates.

Add templates for:

- ticket created
- first response
- escalated
- pending/customer info needed
- pending reminder
- resolved
- closed
- CSAT survey
- reopened

Each template should support channel-specific versions for email, chat widget,
full-page SDK, SMS/WhatsApp later, and voice-summary later.

#### 10. Negative CSAT Recovery

Add explicit workflow:

- CSAT 1 or 2 reopens or flags the ticket.
- Supervisor/team lead gets notified.
- CSAT comment is added as an internal note.
- Optional senior-agent outreach task is created.

This belongs in Phase 7 analytics/learning loop, but the schema should allow it
earlier.

#### 11. Roles and Permissions

The downloaded spec gives a practical role model.

Add support-domain permissions:

- agent: reply, assign self, escalate, resolve.
- senior agent: handle escalations and sensitive queues.
- specialist: domain-specific queues.
- supervisor/team lead: reassign, SLA override, escalation queue, reopen review.
- support manager: global support visibility and policy controls.
- admin: configuration, not necessarily ticket handling.

This should become a permission matrix before building supervisor controls.

#### 12. Audit Export

Our `TicketEvent` idea covers immutable audit, but the downloaded spec adds an
operational requirement:

- export audit trail as CSV and JSON.

This can ship after `TicketEvent` is in place.

### Things Not To Adopt Directly

#### Do Not Auto-Create a Ticket for Every Chat Session

The downloaded spec says live chat should auto-create a ticket. That is normal
for traditional helpdesks, but it works against Lira's value.

Lira should instead:

- create a `SupportConversation` for every chat;
- create a `SupportTicket` only when needed;
- optionally allow orgs to enable "ticket for every conversation" later if
  they operate like a traditional call center.

#### Do Not Reset SLA Blindly on Escalation

The downloaded spec says the SLA timer resets for the new tier after
acknowledgement. That can be useful internally, but customer-facing SLA should
not be erased.

Recommended Lira model:

- Keep original customer-facing SLA.
- Add internal escalation acknowledgement SLA.
- Add internal specialist-resolution SLA if needed.

This avoids hiding customer wait time behind internal transfers.

#### Do Not Build Whisper/Barge First

Supervisor whisper and barge are useful, but they are live-support controls.
They should come after core ticket lifecycle, queues, SLA, and audit are stable.

For Lira v1:

- supervisor reassign
- SLA override with reason
- escalation queue
- internal note

For later:

- whisper
- barge
- real-time agent coaching

### Updated Phase Order From This Comparison

The original phase plan still holds, with these refinements:

- Phase 1 must include internal/public message visibility and core ticket
  events.
- Phase 2 classification should include language, source system/product area,
  transaction value hooks, repeated-contact detection, and sentiment.
- Phase 3 should split into:
  - Phase 3A: queues, routing, SLA policy, pending state.
  - Phase 3B: assignment modes, agent availability, capacity, unassigned alerts.
- Phase 4 operator UX must include internal notes, SLA clocks, escalation ack,
  and resolution type.
- Phase 5 customer ticket tracking must include notification templates,
  pending reminders, auto-close, and reopen window.
- Phase 7 analytics must include CSAT recovery, reopen rate, SLA breach rate,
  queue health, and audit export.

## Recommended Phased Build

### Phase 0: Lock Semantics

Goal: agree on what a ticket means in Lira.

Tasks:

- Confirm that assistant chat continues after ticket creation.
- Confirm tickets are the durable async work record.
- Confirm whether public customer ticket tracking is in v1.
- Confirm initial default categories and queues.
- Confirm whether `pending` is added to `TicketStatus`.

Deliverable:

- Approved product/engineering semantics.

### Phase 1: Unify Ticket Creation and Add Events

Goal: every ticket is created through one service.

Tasks:

- Route all assistant-created tickets through `lira-ticket.service.createTicket`.
- Retire or wrap legacy escalation-created ticket rows.
- Add `TicketEvent` model and service.
- Write events on create, reply, status change, resolve, and brief generation.
- Backfill missing `ticket_number` for legacy tickets if practical.
- Add tests for manual ticket creation, assistant ticket creation, and reply.

Deliverable:

- One consistent ticket path and event timeline.

### Phase 2: Add Classification and Taxonomy

Goal: every ticket has structured meaning.

Tasks:

- Add ticket fields: category, subcategory, product_area, classification,
  classification_confidence, priority_reason, suggested_queue.
- Add classifier service.
- Add default Lira categories.
- Add org-level category overrides later, not in the first pass.
- Use classifier for assistant-created tickets.
- Add optional "organize this ticket" action in manual ticket creation.

Deliverable:

- AI-created tickets arrive categorized, prioritized, and explainable.

### Phase 3: Routing, Queues, Assignment, SLA

Goal: tickets move to the right people with deadlines.

Tasks:

- Add queue/team model.
- Add routing rules.
- Add SLA policy model.
- Add due timestamps and SLA status on ticket.
- Add scheduled worker for SLA at-risk and breach events.
- Add queue/status/assignee indexes.

Deliverable:

- Operators can work queues, not just a flat list.

### Phase 4: Operator Workspace Upgrade

Goal: make the dashboard feel like a real support operations product.

Tasks:

- Add saved views and richer filters.
- Add search.
- Add internal notes.
- Add macros/canned responses.
- Add collision detection.
- Add classification and SLA cards to ticket detail.
- Add timeline events to detail view.
- Add merge/duplicate flow.

Deliverable:

- Support team can triage and resolve tickets efficiently.

### Phase 5: Secure Customer Ticket Tracking

Goal: customers can safely track their tickets.

Tasks:

- Replace email-only ticket access with signed ticket links or verified visitor
  sessions.
- Add magic link flow for anonymous customers.
- Add customer-facing ticket history in full support page/SDK.
- Add reopen flow when customer replies after resolution.

Deliverable:

- Customer ticket tracking is usable without leaking private data.

### Phase 6: Integration Outbox

Goal: make external tools reliable and extensible.

Tasks:

- Add integration outbox item model.
- Emit outbox items from ticket events.
- Add retries, idempotency, and failure status.
- Move Slack/Linear sync to adapters.
- Add webhooks.

Deliverable:

- Slack, Linear/Jira/GitHub, email, and CRM sync become standard ticket
  integrations.

### Phase 7: Analytics and Learning Loop

Goal: turn tickets into product/support intelligence.

Tasks:

- Add ticket analytics: backlog, aging, SLA hit rate, breach rate, category
  volume, reopen rate, first response, resolution time.
- Add AI-assisted root cause summaries.
- Feed resolved ticket gaps into KB draft flow.
- Track deflection-to-ticket and ticket-to-resolution quality.

Deliverable:

- Lira can show what customers need, where support is slow, and where the
  knowledge base or product needs work.

## Immediate Implementation Recommendation

When implementation starts, do not begin with UI.

Start with the backend foundation:

1. Add `TicketEvent`.
2. Unify ticket creation paths.
3. Add structured ticket classification fields.
4. Add tests around assistant-created and manual-created tickets.
5. Add the first index/access-pattern improvement for visitor and status lookup.

Then build UI on top of that foundation.

Reason: if the UI comes first, it will look better but still be powered by a
weak lifecycle. Ticketing is a workflow system; the data model and state machine
need to be correct before the interface becomes robust.

## What Not To Do

- Do not create tickets for every unanswered question. Ask clarifying questions
  or offer a ticket when appropriate.
- Do not silently expose account/customer details in tickets or customer-facing
  portals without verified identity.
- Do not make Linear, Jira, Slack, or email the source of truth. Lira owns the
  ticket; external systems are synced destinations.
- Do not merge live assistant chat and async ticket thread into one ambiguous
  stream. Link them, but keep their responsibilities clear.
- Do not build a Jira clone. Lira needs support operations, not project
  management bloat.

## Approval Questions Before Build

1. Should we add `pending` as a public ticket status now, or keep the public API
   unchanged and use internal states first?
2. Should customer-facing ticket tracking ship in the first implementation
   phase, or only operator-side tickets first?
3. Should v1 categories be fixed Lira defaults, or should every org configure
   custom categories from day one?
4. Which external sync is the first priority after Slack: Linear, Jira, GitHub,
   HubSpot, or Salesforce?
5. Should assistant-created tickets require explicit user confirmation in all
   cases, or only for non-sensitive/ambiguous cases?
