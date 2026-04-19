# Lira Customer Support System — Implementation Plan

> Comprehensive reference for the 3-phase upgrade of Lira's customer support system.
> Written as a precise coding guide with exact file paths, DB schema changes, and API contracts.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [Phase 1 — Identity & Continuity](#phase-1--identity--continuity)
3. [Phase 2 — Inbox Intelligence](#phase-2--inbox-intelligence)
4. [Phase 3 — AI Summaries, CSAT & Real-time](#phase-3--ai-summaries-csat--real-time)
5. [File Change Manifest](#file-change-manifest)
6. [DB Schema Changes](#db-schema-changes)
7. [API Contract Changes](#api-contract-changes)
8. [Deploy Order](#deploy-order)

---

## Current Architecture

### Backend (`/Users/apple/creovine_main/creovine-api/`)

| File                                                | Purpose                                                      | Lines |
| --------------------------------------------------- | ------------------------------------------------------------ | ----- |
| `src/services/lira-support-chat.service.ts`         | WebSocket chat handler — session, classify, reply, escalate  | ~336  |
| `src/services/lira-support-conversation.service.ts` | Conversation CRUD — create, append, resolve, list, find-open | ~332  |
| `src/services/lira-support-customer.service.ts`     | Customer resolution by email, create, counters               | ~289  |
| `src/models/lira-support.models.ts`                 | TypeScript interfaces for all support entities               | ~379  |
| `src/services/lira-support-config.service.ts`       | Config CRUD, activation, usage tracking                      | —     |
| `src/services/lira-support-escalation.service.ts`   | Escalation flow — tickets, alerts, email/Slack/Linear        | —     |
| `src/routes/lira-support-inbox.routes.ts`           | Fastify routes for inbox CRUD + reply/resolve/escalate       | —     |

### Frontend (`/Users/apple/creovine_main/lira_ai/`)

| File                                            | Purpose                                            | Lines |
| ----------------------------------------------- | -------------------------------------------------- | ----- |
| `src/pages/support/SupportInboxPage.tsx`        | Inbox list with status filters, search, stat cards | ~304  |
| `src/pages/support/SupportConversationPage.tsx` | Conversation detail with reply/escalate/note tabs  | ~359  |
| `src/services/api/support-api.ts`               | Frontend API client for all support endpoints      | ~721  |
| `src/app/store/support-store.ts`                | Zustand store for support state                    | ~381  |

### Widget (`/Users/apple/creovine_main/lira_ai/src/components/support-widget/`)

| File        | Purpose                                                      |
| ----------- | ------------------------------------------------------------ | ----- |
| `widget.ts` | Main widget class — Shadow DOM, chat UI, voice overlay, CSAT | ~1050 |
| `socket.ts` | WebSocket manager — connect, reconnect, serialize            | ~100  |
| `types.ts`  | Shared types — WidgetConfig, ChatMessage, WS messages        | ~55   |
| `voice.ts`  | Voice call via WebSocket to Nova Sonic                       | —     |
| `styles.ts` | CSS for the widget                                           | —     |

### DynamoDB Schema (single table: `lira-organizations`)

| PK                       | SK                          | Entity                  |
| ------------------------ | --------------------------- | ----------------------- |
| `ORG#{orgId}`            | `SUPPORT_CONFIG`            | Module settings         |
| `ORG#{orgId}`            | `CUSTOMER#{customerId}`     | Customer profile        |
| `CUSTOMER_EMAIL#{email}` | `ORG#{orgId}`               | Email → customer lookup |
| `ORG#{orgId}`            | `SUPPORT_CONV#{convId}`     | Conversation            |
| `ORG#{orgId}`            | `SUPPORT_TICKET#{ticketId}` | Escalation ticket       |
| `ORG#{orgId}`            | `SUPPORT_ALERT#{alertId}`   | Notification alert      |

---

## Phase 1 — Identity & Continuity

### 1.1 Visitor ID Persistence in DynamoDB

**Problem**: Widget creates `visitor_id` in localStorage and sends it to backend, but backend ignores it. Anonymous visitors get `anon_{uuid}` each time, creating duplicate customers.

**Solution**: Store `VISITOR#{visitor_id}` → `customer_id` lookup in DynamoDB.

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add new interface:

```typescript
export interface VisitorLookup {
  PK: string // ORG#{orgId}
  SK: string // VISITOR#{visitor_id}
  customer_id: string
  org_id: string
  visitor_id: string
  created_at: string
  last_seen_at: string
}
```

Add `visitor_id?: string` to `CustomerProfile` interface.

**File: `src/services/lira-support-customer.service.ts`**
Add functions:

```typescript
// Look up customer by visitor_id
export async function resolveCustomerByVisitorId(
  orgId: string,
  visitorId: string
): Promise<CustomerProfile | null>

// Store visitor → customer mapping
export async function linkVisitorToCustomer(
  orgId: string,
  visitorId: string,
  customerId: string
): Promise<void>

// Update visitor's last_seen_at
export async function touchVisitor(orgId: string, visitorId: string): Promise<void>
```

**File: `src/services/lira-support-chat.service.ts`**
Modify `handleChatConnection()` resolution order:

1. If `email` provided → `resolveOrCreateCustomer(orgId, email, name)`
2. Else if `visitorId` provided → `resolveCustomerByVisitorId(orgId, visitorId)`
3. If found → reuse that customer; update `last_seen_at`
4. If not found → create customer with name="Visitor", link visitor→customer
5. Always call `linkVisitorToCustomer()` to keep mapping fresh

### 1.2 Pre-Chat Form (Configurable)

**Problem**: Anonymous visitors have no name/email → inbox shows "Chat visitor".

**Solution**: Optional pre-chat form that collects name + email before first message.

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add to `SupportConfig`:

```typescript
pre_chat_form_enabled?: boolean;       // default: false
pre_chat_form_fields?: string[];       // e.g. ['name', 'email'] — which fields to show
```

**File: `src/services/lira-support-config.service.ts`**
Include new fields in config update handler.

**File: Endpoint `GET /lira/v1/support/chat/widget/:orgId`**
Return `pre_chat_form_enabled` and `pre_chat_form_fields` in widget config response.

#### Widget Changes

**File: `widget.ts`**

- Add `WidgetView = 'launcher' | 'pre-chat' | 'chat' | 'csat'`
- On `open()`, if `pre_chat_form_enabled && !this.config.visitorEmail`, show pre-chat form
- Pre-chat form collects name + email → stores in `this.config.visitorName/Email`
- After form submit, proceed to chat view and connect socket with the collected data

#### Frontend Changes

**File: `SupportSettingsPage.tsx` (or wherever config is edited)**
Add toggle for pre-chat form + field selection.

### 1.3 Conversation Resume by Visitor ID

**Problem**: Same browser, same visitor_id, but new conversation created each session.

**Solution**: Use `findOpenConversationForCustomer()` (already exists) + restore from localStorage.

#### Backend Changes

Already works: `handleChatConnection()` calls `findOpenConversationForCustomer(orgId, customerId)`. The fix is making sure the same `customerId` is resolved via visitor_id (1.1 above).

After 1.1 is done, same visitor → same customer → existing open conversation is found → chat resumes.

#### Widget Changes (already done)

Widget already persists `convId` + messages in localStorage and restores them. No widget changes needed beyond 1.1.

### 1.4 Merge Voice and Chat Under Same Customer

**Problem**: Voice calls create separate conversations unlinked to chat.

**Solution**: Voice service should resolve customer by `visitor_id` same as chat.

#### Backend Changes

**File: `src/services/lira-sonic.service.ts`** (voice handler)

- Accept `visitorId` in voice connection params
- Use same resolution order: email → visitor_id → create-and-link
- Create conversation with `channel: 'voice'` linked to same customer
- If customer has open chat conversation, flag it (don't merge messages, but link via `customer_id`)

### 1.5 Auto-Resolve Stale Conversations

**Problem**: Conversations stay open forever.

**Solution**: Configurable `auto_resolve_hours` — periodic check resolves stale conversations.

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add to `SupportConfig`:

```typescript
auto_resolve_hours?: number;           // default: null (disabled). e.g. 24 = resolve after 24h idle
```

**File: New: `src/services/lira-support-autoresolve.service.ts`**

```typescript
export async function autoResolveStaleConversations(): Promise<void>
// Scans all orgs with auto_resolve_hours set
// For each: query open/pending convs where updated_at < now - auto_resolve_hours
// Resolve them with resolution_type = 'autonomous'
// Send 'resolved' WS message to widget if connected
```

**Trigger**: Register a `setInterval` in the Fastify startup or use a cron endpoint.
Recommended: Run every 15 minutes via `setInterval(autoResolveStaleConversations, 15 * 60 * 1000)`.

#### Frontend Changes

**File: Support settings UI**
Add `auto_resolve_hours` input (number, 0 = disabled).

---

## Phase 2 — Inbox Intelligence

### 2.1 Human-Readable Display IDs

**Problem**: Conversations use UUIDs like `conv-a1b2c3d4...` — no easy reference.

**Solution**: Auto-incrementing `display_id` per org (#1, #2, #3...).

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add to `SupportConversation`:

```typescript
display_id?: number;                   // Human-readable: #1, #2, ...
```

Add to `SupportConfig`:

```typescript
next_display_id?: number;              // Counter — starts at 1
```

**File: `src/services/lira-support-conversation.service.ts`**
In `createConversation()`:

1. Atomically increment `next_display_id` on the org's config item
2. Use the returned value as `display_id` on the new conversation

```typescript
// Atomic counter increment
const result = await client.send(
  new UpdateCommand({
    TableName: orgsTable(),
    Key: { PK: orgPK(orgId), SK: 'SUPPORT_CONFIG' },
    UpdateExpression: 'SET next_display_id = if_not_exists(next_display_id, :zero) + :one',
    ExpressionAttributeValues: { ':zero': 0, ':one': 1 },
    ReturnValues: 'UPDATED_NEW',
  })
)
const displayId = (result.Attributes as any).next_display_id
```

#### Frontend Changes

**File: `SupportInboxPage.tsx`**
Show `#${conv.display_id}` in the conversation row, next to the title/subject.

**File: `SupportConversationPage.tsx`**
Show `#${conv.display_id}` in the header.

**File: `support-api.ts`**
Add `display_id?: number` to `SupportConversation` type.

### 2.2 Meaningful Conversation Titles

**Problem**: Inbox shows "Chat visitor" and generic titles.

**Solution**: Already partially done — `ConversationRow` derives title from `subject ?? intent ?? first_customer_message`. The real fix is:

1. Set `subject` properly from the first customer message (already done in chat service)
2. Replace "Chat visitor" with the visitor's name (from pre-chat form or visitor record)
3. If no name, show truncated first message as the display name

#### Backend Changes

**File: `src/services/lira-support-chat.service.ts`**
In `handleChatMessage()` when creating conversation:

- Already sets `subject: messageBody.slice(0, 100)` ✓
- No changes needed here

**File: `src/services/lira-support-customer.service.ts`**
When a visitor provides their name via pre-chat form or email, update the customer profile name.

#### Frontend Changes

**File: `SupportInboxPage.tsx`**
Update `displayName` logic in `ConversationRow`:

```typescript
// Priority: customer name > email username > channel-derived > "Visitor"
const displayName =
  conv.customer?.name && conv.customer.name !== 'Visitor'
    ? conv.customer.name
    : conv.customer?.email
      ? conv.customer.email.split('@')[0]
      : conv.channel === 'voice'
        ? 'Voice caller'
        : 'Website visitor'
```

### 2.3 Customer Conversation Grouping

**Problem**: Inbox is a flat list. Can't see all conversations for one customer.

**Solution**: Add a "Customer" view that groups conversations by customer.

#### Backend Changes

The current DynamoDB schema already supports querying all conversations for an org. To get conversations for a specific customer, we filter by `customer_id`. This is already efficient since we query by PK and filter.

Add new endpoint:

```
GET /lira/v1/support/inbox/orgs/:orgId/customers/:customerId/conversations
```

**File: `src/routes/lira-support-inbox.routes.ts`**
Add route handler that queries conversations filtered by `customer_id`.

#### Frontend Changes

**File: New: `src/pages/support/SupportCustomerPage.tsx`**

- Shows customer profile + all their conversations
- Accessible from inbox row click on customer name, or from customer list
- Route: `/support/customers/:customerId`

**File: `SupportInboxPage.tsx`**
Make customer name clickable → navigates to customer profile page.

### 2.4 Conversation Tags (AI Auto-Applied)

**Problem**: No way to categorize conversations beyond intent classification.

**Solution**: Tags on conversations — auto-applied by AI during classification, manually editable.

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add to `SupportConversation`:

```typescript
tags?: string[];                       // e.g. ['billing', 'urgent', 'bug-report']
```

**File: `src/services/lira-support-conversation.service.ts`**
Add function:

```typescript
export async function updateConversationTags(
  orgId: string,
  convId: string,
  tags: string[]
): Promise<void>
```

**File: `src/services/lira-support-chat.service.ts`**
After classification, auto-apply tags based on intent + sentiment:

```typescript
const tags: string[] = []
if (classification.intent) tags.push(classification.intent)
if (classification.sentiment === 'urgent') tags.push('urgent')
if (classification.sentiment === 'negative') tags.push('needs-attention')
await conversationService.updateConversationTags(orgId, conv.conv_id, tags)
```

#### Frontend Changes

**File: `SupportInboxPage.tsx`**
Show tags as small colored pills in each conversation row.

**File: `SupportConversationPage.tsx`**
Show tags in header area, allow adding/removing tags manually.

**File: `support-api.ts`**
Add API function:

```typescript
export async function updateConversationTags(
  orgId: string,
  convId: string,
  tags: string[]
): Promise<void>
```

Add `tags?: string[]` to `SupportConversation` type.

### 2.5 Inbox Filter by Tag

**File: `SupportInboxPage.tsx`**
Add a tag filter dropdown next to the status filter. Filter `conversations` client-side by tag.

---

## Phase 3 — AI Summaries, CSAT & Real-time

### 3.1 AI Conversation Summaries

**Problem**: Long conversations are hard to scan. Agents need a quick synopsis.

**Solution**: Auto-generate a 2-3 sentence summary after resolution or on-demand.

#### Backend Changes

**File: `src/models/lira-support.models.ts`**
Add to `SupportConversation`:

```typescript
summary?: string;                      // AI-generated conversation summary
```

**File: New: `src/services/lira-support-summary.service.ts`**

```typescript
export async function generateConversationSummary(conv: SupportConversation): Promise<string>
// Uses Bedrock to generate a 2-3 sentence summary
// Prompt: "Summarize this customer support conversation in 2-3 sentences.
//          Include: what the customer asked, how it was resolved, and any notable details."
// Input: conversation messages
// Returns: summary string
```

**File: `src/services/lira-support-conversation.service.ts`**
In `resolveConversation()`, after setting status to resolved, generate summary:

```typescript
const summary = await summaryService.generateConversationSummary(conv)
// Store summary on the conversation
```

Add API endpoint for on-demand summary regeneration:

```
POST /lira/v1/support/inbox/orgs/:orgId/:convId/summarize
```

#### Frontend Changes

**File: `SupportConversationPage.tsx`**
Show summary card at the top of the conversation (collapsible).

**File: `SupportInboxPage.tsx`**
Show summary preview (first 80 chars) in the conversation row below the title.

**File: `support-api.ts`**
Add `summary?: string` to `SupportConversation`.
Add `summarizeConversation()` API function.

### 3.2 CSAT Collection

**Problem**: Widget already shows a CSAT form, but the backend `end` message handling needs to persist it properly and show it in the dashboard.

**Current state**: Widget sends `{ type: 'end', body: '4' }` via WebSocket. Need to verify backend stores it correctly.

#### Backend Changes

**File: `src/services/lira-support-chat.service.ts`**
In message handler, handle `type: 'end'`:

```typescript
if (msg.type === 'end') {
  const score = parseInt(msg.body, 10)
  if (score >= 1 && score <= 5 && session.conversation) {
    await conversationService.updateConversationCsat(orgId, session.conversation.conv_id, score)
  }
}
```

**File: `src/services/lira-support-conversation.service.ts`**
Add function:

```typescript
export async function updateConversationCsat(
  orgId: string,
  convId: string,
  score: number
): Promise<void>
// Sets csat_score and csat_collected_at on the conversation
```

#### Frontend Changes

**File: `SupportConversationPage.tsx`**
Show CSAT score in the sidebar (if available):

```
★★★★☆  4/5 — Collected 2h ago
```

**File: Stats dashboard**
Show average CSAT in stats cards (already partially wired — `SupportStats.avg_csat`).

### 3.3 Typing Indicators (Bidirectional)

**Problem**: No typing indicators from customer→agent or agent→customer.

**Solution**: Pass typing events through WebSocket in both directions.

#### Customer → Agent (Dashboard)

**Widget** already sends messages. Add a `typing` outgoing message:

```typescript
// In widget textarea 'input' event listener:
this.socket?.send({ type: 'typing' })
```

**Backend** relays customer typing to the dashboard via SSE or polling:

- Simple approach: Store `is_customer_typing: true` with TTL on the conversation
- Dashboard periodically checks or uses SSE

For MVP: Skip customer→agent typing. Agent→customer is more valuable.

#### Agent → Customer (Widget)

When an agent is typing a reply in the dashboard, notify the widget.

**File: `src/routes/lira-support-inbox.routes.ts`**
Add endpoint:

```
POST /lira/v1/support/inbox/orgs/:orgId/:convId/typing
```

This pushes `{ type: 'typing' }` to the widget via `widgetConnections.get(convId)`.

**File: `SupportConversationPage.tsx`**
Send typing notification when agent types in the reply textarea:

```typescript
// Debounced — send once per 3 seconds while typing
const handleTyping = useMemo(() => debounce(() => {
  supportApi.sendTypingIndicator(orgId, convId);
}, 3000, { leading: true, trailing: false }), [...]);
```

### 3.4 Contact Merge

**Problem**: Same person can have multiple customer records (one from email, one from anonymous chat).

**Solution**: Manual contact merge in the dashboard.

#### Backend Changes

**File: `src/services/lira-support-customer.service.ts`**
Add function:

```typescript
export async function mergeCustomers(
  orgId: string,
  primaryId: string, // keep this one
  secondaryId: string // merge into primary, then delete
): Promise<void>
// 1. Re-point all conversations from secondary → primary (update customer_id)
// 2. Re-point visitor lookups from secondary → primary
// 3. Re-point email lookup from secondary → primary
// 4. Sum counters (total_conversations, total_escalations)
// 5. Delete secondary customer record
```

Add endpoint:

```
POST /lira/v1/support/customers/orgs/:orgId/merge
Body: { primaryId, secondaryId }
```

#### Frontend Changes

**File: `SupportCustomerPage.tsx`**
Add "Merge with..." button that opens a search modal for selecting another customer to merge.

---

## File Change Manifest

### Backend Files to Modify

| File                                                | Changes                                                                                                                                                                                                                                                     |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/models/lira-support.models.ts`                 | Add `VisitorLookup`, add fields to `SupportConversation` (`display_id`, `tags`, `summary`), add fields to `SupportConfig` (`auto_resolve_hours`, `pre_chat_form_enabled`, `pre_chat_form_fields`, `next_display_id`), add `visitor_id` to `CustomerProfile` |
| `src/services/lira-support-customer.service.ts`     | Add `resolveCustomerByVisitorId()`, `linkVisitorToCustomer()`, `touchVisitor()`, `mergeCustomers()`                                                                                                                                                         |
| `src/services/lira-support-chat.service.ts`         | Update customer resolution order (email → visitor_id → create-and-link), auto-apply tags after classification, handle `type: 'end'` (CSAT), handle agent typing relay                                                                                       |
| `src/services/lira-support-conversation.service.ts` | Add display_id generation in `createConversation()`, add `updateConversationTags()`, `updateConversationCsat()`, add summary storage, auto-resolve query                                                                                                    |
| `src/services/lira-support-config.service.ts`       | Support new config fields                                                                                                                                                                                                                                   |
| `src/routes/lira-support-inbox.routes.ts`           | Add routes: customer conversations, typing indicator, summarize, tags update, customer merge                                                                                                                                                                |
| `src/services/lira-sonic.service.ts`                | Use visitor_id for customer resolution in voice calls                                                                                                                                                                                                       |

### Backend Files to Create

| File                                               | Purpose                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| `src/services/lira-support-autoresolve.service.ts` | Auto-resolve stale conversations on interval     |
| `src/services/lira-support-summary.service.ts`     | AI conversation summary generation using Bedrock |

### Frontend Files to Modify

| File                                            | Changes                                                                                                                                                              |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/api/support-api.ts`               | Add types (`display_id`, `tags`, `summary`, `visitor_id`), add API functions (updateTags, summarize, sendTypingIndicator, mergeCustomers, listCustomerConversations) |
| `src/app/store/support-store.ts`                | Add tag filter, typing indicator state, customer conversations list                                                                                                  |
| `src/pages/support/SupportInboxPage.tsx`        | Show display_id, improved display names, tags as pills, tag filter, customer name clickable                                                                          |
| `src/pages/support/SupportConversationPage.tsx` | Show display_id in header, summary card, tags (editable), CSAT in sidebar, typing indicator, agent typing debounce                                                   |

### Frontend Files to Create

| File                                        | Purpose                                    |
| ------------------------------------------- | ------------------------------------------ |
| `src/pages/support/SupportCustomerPage.tsx` | Customer profile + all their conversations |

### Widget Files to Modify

| File                                      | Changes                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `src/components/support-widget/widget.ts` | Add pre-chat form view, send typing events               |
| `src/components/support-widget/types.ts`  | Add `'pre-chat'` to `WidgetView`, pre-chat config fields |

---

## DB Schema Changes

### New Items

| PK            | SK                     | Purpose                    |
| ------------- | ---------------------- | -------------------------- |
| `ORG#{orgId}` | `VISITOR#{visitor_id}` | Visitor → customer mapping |

### Modified Items

**SupportConfig** (PK: `ORG#{orgId}`, SK: `SUPPORT_CONFIG`):

- `+ auto_resolve_hours?: number`
- `+ pre_chat_form_enabled?: boolean`
- `+ pre_chat_form_fields?: string[]`
- `+ next_display_id?: number`

**SupportConversation** (PK: `ORG#{orgId}`, SK: `SUPPORT_CONV#{convId}`):

- `+ display_id?: number`
- `+ tags?: string[]`
- `+ summary?: string`

**CustomerProfile** (PK: `ORG#{orgId}`, SK: `CUSTOMER#{customerId}`):

- `+ visitor_id?: string`

---

## API Contract Changes

### New Endpoints

| Method | Path                                                                     | Purpose                           |
| ------ | ------------------------------------------------------------------------ | --------------------------------- |
| `GET`  | `/lira/v1/support/inbox/orgs/:orgId/customers/:customerId/conversations` | List conversations for a customer |
| `POST` | `/lira/v1/support/inbox/orgs/:orgId/:convId/summarize`                   | Generate AI summary               |
| `PUT`  | `/lira/v1/support/inbox/orgs/:orgId/:convId/tags`                        | Update conversation tags          |
| `POST` | `/lira/v1/support/inbox/orgs/:orgId/:convId/typing`                      | Send typing indicator to widget   |
| `POST` | `/lira/v1/support/customers/orgs/:orgId/merge`                           | Merge two customer records        |

### Modified Responses

**`GET /lira/v1/support/inbox/orgs/:orgId`** (list conversations):

- Each conversation now includes `display_id`, `tags`, `summary`

**`GET /lira/v1/support/inbox/orgs/:orgId/:convId`** (get conversation):

- Now includes `display_id`, `tags`, `summary`

**`GET /lira/v1/support/chat/widget/:orgId`** (widget config):

- Now includes `pre_chat_form_enabled`, `pre_chat_form_fields`

---

## Deploy Order

1. **Backend** (EC2): `cd /Users/apple/creovine_main/creovine-api && bash deploy-auto.sh`
   - All DB schema changes are additive (new optional fields) — no migration needed
   - New DynamoDB items are created on-demand — no table changes needed
   - Start auto-resolve interval on server boot
2. **Frontend** (Vercel): `cd /Users/apple/creovine_main/lira_ai && bash deploy.sh`
3. **Widget** (S3/CloudFront): `cd /Users/apple/creovine_main/lira_ai && npm run deploy:widget`
   - Only if pre-chat form or typing indicator changes are ready

---

## Implementation Sequence

### Pass 1: Backend Models + Customer Resolution (Phase 1.1 + 1.3)

1. Update `lira-support.models.ts` with all new fields
2. Add visitor resolution functions to `lira-support-customer.service.ts`
3. Update `lira-support-chat.service.ts` to use visitor_id resolution
4. Deploy backend → test with existing widget (visitor_id already sent)

### Pass 2: Display IDs + Tags + Titles (Phase 2.1 + 2.2 + 2.4)

1. Add display_id counter to `lira-support-conversation.service.ts`
2. Add tags to conversation service
3. Auto-apply tags in chat service after classification
4. Deploy backend
5. Update frontend inbox + conversation pages
6. Deploy frontend

### Pass 3: Auto-Resolve + Summary + CSAT (Phase 1.5 + 3.1 + 3.2)

1. Create auto-resolve service
2. Create summary service
3. Wire CSAT handling in chat service
4. Deploy backend
5. Update frontend to show summaries + CSAT
6. Deploy frontend

### Pass 4: Pre-Chat Form + Customer Page + Merge (Phase 1.2 + 2.3 + 3.4)

1. Add pre-chat form to widget
2. Create SupportCustomerPage
3. Add merge endpoint
4. Deploy all three (backend → frontend → widget)

### Pass 5: Typing Indicators (Phase 3.3)

1. Add typing endpoint to backend
2. Add debounced typing in frontend
3. Add typing events from widget
4. Deploy all three

---

_Last updated: Session active — implementation in progress_
