# Support Ticketing API — Frontend Implementation Guide

Generated: 2026-05-28
Scope: Phases 4–7 of the backend ticketing implementation, plus a quick reference for the operator-side endpoints (Phases 1–3) the workspace already depends on. This is what the frontend team needs to build the operator inbox/ticket workspace and the customer-facing ticket tracking UI.

> **Quality bar:** the UI/UX here should feel **calm, confident, professional** — Linear/Height/Stripe Dashboard energy, not Zendesk. Lots of whitespace, monospaced ticket numbers, real-time-feeling polling (not jumpy), keyboard-first for operators, and zero "loading…" walls (skeletons, optimistic updates).

---

## 0. Base URL & Auth

| Environment       | Base URL                           |
| ----------------- | ---------------------------------- |
| Production        | `https://api.creovine.com/lira/v1` |
| (Replace per env) | —                                  |

All ticketing routes are mounted under `/support/tickets`.

Three auth surfaces — pick the right one per route:

| Surface                       | Header / Param                | Used by                                     |
| ----------------------------- | ----------------------------- | ------------------------------------------- |
| **Operator (JWT)**            | `Authorization: Bearer <jwt>` | All `/orgs/:orgId/*` routes — the dashboard |
| **Public (magic-link token)** | `?access_token=<jwt-lite>`    | `/public/*` — customer ticket portal        |
| **Verified SDK (HMAC)**       | `?email=…&sig=…`              | `/verified/*` — embedded widget portal      |

> Magic-link tokens are issued by `POST /public/:orgId/tickets/access-link` and emailed to the customer. They are self-validating (no DB hop), TTL 7 days for list scope / 30 days for per-ticket scope.

Common error shape:

```json
{ "error": "Access token has expired — request a new link" }
```

Status codes used: `200 OK`, `400` validation, `401` auth, `403` wrong-org/scope, `404` not found, `409` conflict, `413` file too large, `415` bad MIME, `500` internal.

---

## 1. Operator workspace — list, detail, replies, transitions

These are the routes the support team's dashboard uses. Auth: `Bearer <jwt>`, org membership enforced server-side. Most existed before Phase 4; the new lifecycle-related endpoints are flagged with **NEW**.

### 1.1 Tickets

| Method | Path                                              | Purpose                                            |
| ------ | ------------------------------------------------- | -------------------------------------------------- |
| GET    | `/orgs/:orgId`                                    | List all tickets for the org                       |
| GET    | `/orgs/:orgId/:ticketId`                          | Ticket detail + full thread (public + internal)    |
| GET    | `/orgs/:orgId/events/:ticketId`                   | Immutable event timeline                           |
| POST   | `/orgs/:orgId`                                    | Create a ticket manually                           |
| POST   | `/orgs/:orgId/:ticketId/reply`                    | Agent reply (visitor gets email)                   |
| POST   | `/orgs/:orgId/:ticketId/internal-notes`           | Internal-only note (never sent to customer)        |
| POST   | `/orgs/:orgId/:ticketId/resolve`                  | Mark resolved (with optional round-trip learning)  |
| POST   | `/orgs/:orgId/:ticketId/reopen`                   | Reopen                                             |
| POST   | `/orgs/:orgId/:ticketId/close`                    | Close                                              |
| POST   | `/orgs/:orgId/:ticketId/pending`                  | Mark pending customer reply (pauses SLA)           |
| POST   | `/orgs/:orgId/:ticketId/on-hold`                  | Mark on hold (vendor/internal blocker)             |
| POST   | `/orgs/:orgId/:ticketId/escalate`                 | Escalate to tier 2–4 / queue / user                |
| POST   | `/orgs/:orgId/:ticketId/escalation/ack`           | Acknowledge escalation                             |
| POST   | `/orgs/:orgId/:ticketId/classify`                 | Run the AI classifier + route                      |
| POST   | `/orgs/:orgId/:ticketId/route`                    | Re-route into queue based on category              |
| POST   | `/orgs/:orgId/:ticketId/request-csat`             | **NEW (Phase 5)** Email the customer a CSAT survey |
| PATCH  | `/orgs/:orgId/:ticketId/status`                   | Direct status transition                           |
| PATCH  | `/orgs/:orgId/:ticketId/priority`                 | Set priority + re-route                            |
| PATCH  | `/orgs/:orgId/:ticketId/category`                 | Set category + re-route                            |
| PATCH  | `/orgs/:orgId/:ticketId/queue`                    | Move into specific queue                           |
| PATCH  | `/orgs/:orgId/:ticketId/assign`                   | Assign / reassign                                  |
| POST   | `/orgs/:orgId/:ticketId/handoff-brief/regenerate` | Regenerate handoff brief                           |
| POST   | `/orgs/:orgId/attachments`                        | Upload attachment, returns descriptor              |

### 1.2 Queues, SLA policies, agent availability

| Method                      | Path                                       | Purpose                        |
| --------------------------- | ------------------------------------------ | ------------------------------ |
| GET / POST / PATCH / DELETE | `/orgs/:orgId/queues[/:queueId]`           | Queue CRUD                     |
| GET / POST / PATCH / DELETE | `/orgs/:orgId/sla-policies[/:slaPolicyId]` | SLA policy CRUD                |
| GET                         | `/orgs/:orgId/agents/availability`         | List agent availability        |
| PATCH                       | `/orgs/:orgId/agents/me/availability`      | Update my own availability     |
| GET                         | `/orgs/:orgId/categories`                  | List default ticket categories |

### 1.3 Operator-triggered scans (admin/testing)

| Method | Path                           | Purpose                                                  |
| ------ | ------------------------------ | -------------------------------------------------------- |
| POST   | `/orgs/:orgId/sla-scan`        | Run SLA at-risk/breach scan immediately                  |
| POST   | `/orgs/:orgId/assignment-scan` | Run unassigned + missed-ack scan                         |
| POST   | `/orgs/:orgId/pending-scan`    | **NEW (Phase 5)** Run pending reminder + auto-close scan |

---

## 2. Phase 4 — Public + verified customer ticket access

> Replaces the deprecated `/by-number/*` and `/visitor/:orgId/:email` endpoints, which still work but should not be used in new code.

### 2.1 Request magic link

`POST /public/:orgId/tickets/access-link`

Body:

```json
{
  "email": "customer@example.com",
  "ticket_number": "LIRA-A1B2" // optional — scopes the token to one ticket
}
```

Response (**always 200, even if email has no tickets** — prevents account enumeration):

```json
{ "ok": true }
```

curl:

```bash
curl -X POST "$BASE/support/tickets/public/$ORG/tickets/access-link" \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com"}'
```

**Frontend:** show a generic "If we have tickets for this email, we've sent a link to your inbox." Don't reveal whether the email exists. Disable the submit button + show a 30s rate-limit countdown to prevent spam.

### 2.2 List my tickets (token-scoped)

`GET /public/:orgId/tickets?access_token=…`

Response:

```json
{
  "tickets": [
    {
      "ticket_id": "uuid",
      "ticket_number": "LIRA-A1B2",
      "subject": "Refund question",
      "status": "open",
      "priority": "medium",
      "visitor_email": "customer@example.com",
      "created_at": "2026-05-20T…",
      "updated_at": "2026-05-21T…",
      "resolved_at": null,
      "first_response_at": "2026-05-20T…",
      "next_response_due_at": "2026-05-22T…",
      "resolution_due_at": "2026-05-23T…"
    }
  ]
}
```

> Customer-facing tickets are **sanitized** server-side — classification, escalation reason, queue id, assignee id, handoff brief, and SLA breach metadata are stripped. Don't bother defending against those in the UI.

### 2.3 Get one ticket detail

`GET /public/:orgId/tickets/:ticketNumber?access_token=…`

Response:

```json
{
  "ticket": { /* sanitized ticket */ },
  "messages": [
    {
      "message_id": "uuid",
      "ticket_id": "uuid",
      "sender": "visitor" | "agent" | "system",
      "sender_name": "Sarah",
      "body": "Hi, …",
      "attachments": [ { "id": "uuid", "name": "screenshot.png", "url": "https://…" } ],
      "created_at": "2026-05-20T…"
    }
  ]
}
```

Internal notes are never returned. `sender_user_id` is stripped.

### 2.4 Reply on my ticket

`POST /public/:orgId/tickets/:ticketNumber/reply?access_token=…`

Body:

```json
{
  "body": "Thanks for getting back to me — that worked.",
  "attachments": [
    { "id": "uuid", "name": "…", "content_type": "image/png", "size": 12345, "s3_key": "…" }
  ]
}
```

(Either `body` or at least one attachment is required.)

**Behavior:** if the ticket is `pending`, it auto-reopens. If `resolved` and the reopen window is still open (14 days), it auto-reopens. If `closed`/`merged`/`snoozed`, status stays the same — instruct the customer to open a new ticket.

### 2.5 Upload an attachment

`POST /public/:orgId/tickets/:ticketNumber/attachments?access_token=…`

Multipart form-data, single file field. Returns:

```json
{
  "attachment": {
    "id": "uuid",
    "name": "screenshot.png",
    "content_type": "image/png",
    "size": 12345,
    "s3_key": "…"
  }
}
```

Use the returned descriptor in a subsequent `/reply` call.

Limits: 10 MB per file, image/PDF/text MIME types.

### 2.6 Verified SDK variant

Same routes under `/verified/:orgId/tickets[...]` but auth is `?email=…&sig=…` where `sig = HMAC-SHA256(widget_secret, email.toLowerCase())`. The SDK already computes this; the FE rarely needs to. Use when the customer is identified in the embedded widget (SDK fullscreen mode `/support` page).

```
GET  /verified/:orgId/tickets?email=…&sig=…
GET  /verified/:orgId/tickets/:ticketNumber?email=…&sig=…
POST /verified/:orgId/tickets/:ticketNumber/reply?email=…&sig=…
```

**Frontend:** in the SDK's fullscreen embed, hide the "request access link" flow entirely — the customer is already verified.

---

## 3. Phase 5 — CSAT (public submission)

### 3.1 One-click CSAT (email link)

`GET /public/:orgId/csat/:ticketId/:score/:token`

`token` is an HMAC of `ticketId:score`. The customer gets 5 of these in the CSAT survey email (one per star). Returns a small HTML thank-you page — no JSON. Frontend doesn't call this directly; it's the destination for the email link.

### 3.2 JSON CSAT (in-app submission)

`POST /public/:orgId/tickets/:ticketNumber/csat?access_token=…`

Body:

```json
{ "score": 5 }
```

Response:

```json
{ "ok": true, "score": 5 }
```

Errors:

- `409 Conflict` — already submitted (idempotent at the ticket level, can't change score after first submission).

**Frontend (customer portal):** after viewing a resolved ticket, show a 5-star CSAT widget if `ticket.status === 'resolved'` and the user hasn't submitted. Optimistically update on click. On 409, show "Thanks — we have your feedback."

---

## 4. Phase 6 — Integration outbox + external links

For operators only.

### 4.1 List outbox items

`GET /orgs/:orgId/integration-outbox?status=pending|in_flight|completed|failed|dead`

Response:

```json
{
  "items": [
    {
      "item_id": "uuid",
      "ticket_id": "uuid",
      "provider": "slack" | "linear" | "webhook",
      "event_type": "ticket.created" | "ticket.escalated" | "ticket.resolved" | …,
      "status": "pending" | "in_flight" | "completed" | "failed" | "dead",
      "attempt_count": 2,
      "max_attempts": 8,
      "next_attempt_at": "2026-05-28T…",
      "last_attempted_at": "2026-05-28T…",
      "last_error": "Slack channel not found",
      "external_id": "1716895200.000123",
      "external_url": "https://…",
      "created_at": "…",
      "updated_at": "…"
    }
  ]
}
```

### 4.2 Retry a failed item

`POST /orgs/:orgId/integration-outbox/:itemId/retry` — resets status to `pending`, sets `next_attempt_at = now`. The worker drains it on the next pass.

### 4.3 Drain outbox immediately (admin)

`POST /orgs/:orgId/integration-outbox/drain` — synchronously drains all due items for this org. Returns stats. Use sparingly — the background worker handles normal traffic.

### 4.4 External links per ticket

`GET /orgs/:orgId/:ticketId/external-links` — list Slack/Linear/webhook back-pointers for the ticket.

`POST /orgs/:orgId/:ticketId/external-links` — manually record a link (e.g. operator pasted a Linear URL).

Body:

```json
{
  "provider": "linear",
  "external_id": "LIR-1234",
  "external_url": "https://linear.app/…"
}
```

### 4.5 Force a sync of a ticket

`POST /orgs/:orgId/:ticketId/sync/:provider` (provider: `slack` | `linear` | `webhook`) — enqueues an immediate sync. Useful after the operator changes Linear team or fixes a Slack channel id.

**Frontend (admin → Integrations → Outbox):** a small "delivery log" table. Columns: provider, event, status, attempts, last error, last attempted, external link (if completed). One-click retry on failed rows. Filter chips for status. Quietly hide `completed` items older than 7 days — they're noise.

---

## 5. Phase 7 — Analytics + audit export

For operators only. Read-only.

### 5.1 Backlog overview + learning metrics

`GET /orgs/:orgId/analytics/tickets`

Response:

```json
{
  "overview": {
    "total": 142,
    "open": 18,
    "in_progress": 7,
    "pending": 4,
    "on_hold": 2,
    "escalated": 1,
    "resolved": 95,
    "closed": 15,
    "unassigned": 6,
    "by_priority": { "low": 30, "medium": 80, "high": 25, "urgent": 7 },
    "by_queue": { "billing": 40, "tech": 60, "unrouted": 42 }
  },
  "learning": {
    "ai_to_ticket_conversion": 38.5, // % — non-manual sources / all
    "reopen_rate": 4.2, // % — reopens / resolved
    "csat_average": 4.3, // 1-5
    "csat_negative_count": 3
  }
}
```

### 5.2 SLA metrics

`GET /orgs/:orgId/analytics/tickets/sla`

```json
{
  "total_with_first_response": 130,
  "total_resolved": 110,
  "hit_rate": 87.3, // % — resolved-before-due / resolved
  "breach_count": 4,
  "at_risk_count": 2,
  "avg_first_response_minutes": 23,
  "avg_resolution_minutes": 245
}
```

### 5.3 Category metrics + root causes

`GET /orgs/:orgId/analytics/tickets/categories`

```json
{
  "categories": [
    {
      "category": "billing_payments",
      "count": 40,
      "resolved": 35,
      "escalated": 1,
      "reopen_count": 3
    }
  ],
  "root_causes": [
    {
      "category": "billing_payments",
      "dedupe_key": "stripe-invoice-failed",
      "count": 12,
      "sample_subjects": ["Invoice failed for May", "Why did my charge fail?"],
      "last_seen_at": "2026-05-27T…"
    }
  ]
}
```

### 5.4 Agent metrics

`GET /orgs/:orgId/analytics/tickets/agents`

```json
{
  "agents": [
    {
      "user_id": "usr-…",
      "user_name": "Sarah",
      "open_count": 5,
      "resolved_count": 22,
      "avg_resolution_minutes": 180
    }
  ]
}
```

### 5.5 Audit export

`GET /orgs/:orgId/audit-export?ticket_id=…&format=json|csv`

Returns a downloadable file:

- `json` — full event timeline as pretty JSON.
- `csv` — stable columns: `event_id, org_id, ticket_id, created_at, type, actor_type, actor_id, actor_name, data`.

Response headers: `Content-Disposition: attachment; filename="ticket-audit-LIRA-A1B2.csv"`. Trigger a download — don't render in-app.

**Frontend (Support → Analytics):**

- **Overview tab** — big numbers row (total / open / unassigned / breaches), bar chart by status, donut by queue, three sparklines for `ai_to_ticket_conversion`, `reopen_rate`, `csat_average`.
- **SLA tab** — hit rate gauge, avg first-response + resolution as side-by-side cards, list of currently breached/at-risk tickets (compose by filtering ticket list locally on `sla_status`).
- **Categories tab** — sorted table; clicking a row should deep-link to ticket list filtered by category. Root causes panel beneath — clicking a row deep-links to ticket list filtered by dedupe_key.
- **Agents tab** — sortable table; click name to filter ticket list by assignee.
- **Audit export** — small download button on each ticket detail (operator view).

---

## 6. Recommended frontend information architecture

```
/support
  /inbox              — conversation-first view (already built)
  /tickets            — operator ticket list (needs filters: status, priority, queue, assignee, category, sla_status)
    /:ticketId        — detail (existing, add Phase 5/6/7 surfaces)
  /analytics
    /overview         — Phase 7 §5.1 + §5.2
    /categories       — Phase 7 §5.3
    /agents           — Phase 7 §5.4
  /queues             — queue + member + assignment_mode CRUD
  /sla-policies       — SLA CRUD
  /integrations
    /outbox           — Phase 6 §4.1–4.3

/portal/:orgSlug      — customer-facing
  /                   — landing
  /access             — request magic link (Phase 4 §2.1)
  /tickets            — list (Phase 4 §2.2)
  /tickets/:number    — detail + reply (Phase 4 §2.3–2.5)
```

---

## 7. UX patterns — what "professional" looks like here

These are not rigid rules — call them table stakes.

**Status visualization**

- Use a single color system across status badges. Suggestion: `new/open` = blue, `pending` = amber, `on_hold` = slate, `escalated` = orange, `resolved` = emerald, `closed` = gray, `merged/snoozed` = muted. Consistent across inbox, ticket list, customer portal.
- Ticket numbers (`LIRA-A1B2`) **always** in monospace, slightly muted color. They're identifiers, not headlines.

**Real-time feel**

- Inbox + ticket list: poll every 5–10s (the existing inbox already does 5s). Diff against current state — only animate **new** rows in. Never full re-render.
- On the ticket detail view, poll messages every 3s while focused, every 30s when tab is backgrounded (use `document.visibilityState`).
- Show `customer_last_seen_at` next to the customer name when within 5 min ("seen just now") — small, gray, not loud.

**Optimistic updates**

- Reply send, status transitions, priority/category changes — show the new state instantly, roll back on failure with a toast. Don't show "Saving…" anywhere.

**Empty states**

- Never blank. Every empty list state needs a one-line explanation + a primary action button. Example for empty Actions Approval Queue: "No customer-facing emails waiting for your approval. New ones land here when Lira drafts a follow-up."

**SLA presentation**

- Don't show raw ISO timestamps. Use relative ("23 min ago", "in 1h 12m"). For deadlines, render as a pill with color shift: green > 30min left, amber 0–30, red overdue. Same component on ticket list rows and detail header.

**Customer portal (Phase 4)**

- One-column, max-width 640px, big serif headlines, ample padding. No sidebar — this is a customer surface, not a workspace.
- Magic-link landing page: a single form (`email`), confirmation message, that's it. No login button, no "sign up", no marketing copy.
- Ticket detail: message thread (chat-style bubbles), reply composer at bottom, attachment chip row above it. Status badge top-right. Show resolution date + CSAT prompt when resolved.

**Outbox (admin)**

- This is operator-only and rarely-used — make it boring on purpose. A dense table, monospace IDs, single-row retry. Don't dress it up.

**Analytics dashboards**

- One screen. No tab nesting deeper than 1 level. Numbers above charts, charts above tables. Each tile has a "What this means" tooltip on hover so a new operator doesn't have to guess what `ai_to_ticket_conversion` is.

---

## 8. Post-deploy smoke test (curl)

I added a smoke-test script at `scripts/smoke-test-ticketing.sh` in the **backend repo**. Run after deploying:

```bash
cd ~/creovine_main/creovine-backend
LIRA_API_BASE=https://api.creovine.com/lira/v1 \
LIRA_ORG_ID=org-xxxxxxxx-xxxx-… \
LIRA_JWT="<your operator jwt>" \
LIRA_TEST_EMAIL=you+ticketing-smoke@gmail.com \
  ./scripts/smoke-test-ticketing.sh
```

It hits every Phase 4–7 endpoint (and a couple of Phase 1–3 ones for plumbing) and prints `PASS`/`FAIL` per route. Read the script before running — it creates one real ticket and triggers one real email.

---

## 9. Notes for the frontend team

- The Phase 4 sanitization is enforced server-side. You can lean on it — don't write additional client-side filtering for the customer portal.
- All Phase 5 lifecycle emails fire automatically from the operator endpoints. You don't need to call extra "notify" routes after a status transition.
- The Phase 6 outbox is opt-in per org via `outbox_providers` in support config. If an org hasn't configured it, the Integrations → Outbox tab can show an explainer + "Connect Slack/Linear" CTA pointing at the existing integration config.
- The Phase 7 analytics endpoints scan tickets per request. For orgs > ~3k tickets this will get slow. The backend team will materialize a rollup row when that becomes a problem; the response shape will stay stable.
- **DEPRECATED endpoints** (still in the OpenAPI spec, marked deprecated): `/by-number/*`, `/visitor/:orgId/:email`. Don't reach for them in new code.

Questions / clarifications — drop them in the support-eng channel or open a comment on this doc. Keep the UI/UX deliberately calm and minimal; the product earns trust by being precise, not by being flashy.
