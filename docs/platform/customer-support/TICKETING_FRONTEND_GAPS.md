# Support Ticketing — Frontend Gaps

> **Source:** [docs/SUPPORT_TICKETING_API.md](../../SUPPORT_TICKETING_API.md) (backend Phase 4–7 implementation guide, 2026-05-28).
> **Audited:** 2026-05-29 against `src/services/api/support-api.ts`, `src/pages/support/*`, `src/pages/MyTicketsPage.tsx`, `src/pages/support/SupportAnalyticsPage.tsx`, `src/pages/support/SupportSettingsPage.tsx`.
> **Last update:** 2026-05-31 — Phases 4–7 ✅ shipped end-to-end. Operator ticket-detail lifecycle controls, Queues CRUD, SLA policies CRUD, and agent-availability presence toggle all landed in the same pass.
> **Scope:** What the frontend needs to design and build so the operator workspace and customer portal catch up to the new backend surface area.
> **Legend:** 🆕 entirely missing · 🟡 partial · 🔁 replaces deprecated path

---

## Quick status

| Area                          | State | Notes                                                                                                           |
| ----------------------------- | ----- | --------------------------------------------------------------------------------------------------------------- |
| Customer magic-link portal    | ✅    | Shipped at `/portal/:orgId/*` (2026-05-29)                                                                      |
| Verified-SDK ticket view      | ✅    | Shipped at `/verified/:orgId/*` (2026-05-30) — same UI, HMAC auth                                               |
| CSAT (in-app + email)         | ✅    | Portal 5-star widget + operator "Request CSAT" button (2026-05-30)                                              |
| Integration Outbox admin      | ✅    | `/support/integrations/outbox` + external-links panel + force-sync (2026-05-31)                                 |
| Analytics — Overview/SLA      | ✅    | Rebuilt with `/analytics/tickets` + `/analytics/tickets/sla` (2026-05-31)                                       |
| Analytics — Categories/Agents | ✅    | Both tabs shipped, sortable + deep-link to ticket list (2026-05-31)                                             |
| Audit export                  | ✅    | JSON/CSV download on operator ticket detail (2026-05-31)                                                        |
| Queues CRUD                   | ✅    | `/support/queues` shipped — list, edit, delete, members, assignment_mode                                        |
| SLA policies CRUD             | ✅    | `/support/sla-policies` shipped — first-response + resolution + applicability                                   |
| Agent availability            | ✅    | Presence toggle in AppShell topbar (available / away / offline)                                                 |
| Ticket-detail lifecycle UI    | ✅    | Lifecycle action bar + inline priority/category/queue/assignee PATCH controls                                   |
| API client (`support-api.ts`) | ✅    | All ~30 wrappers shipped across Phases 4–7                                                                      |
| Deprecated visitor paths      | 🔁    | `MyTicketsPage.tsx` still uses `/visitor/*` and `/by-number/*` — schedule removal once portal usage is verified |

---

## 1. Customer magic-link portal (Phase 4) — 🆕

Doc §2 + §6 IA `/portal/:orgSlug/*`. Entirely missing.

- `/portal/:orgSlug/access` — magic-link request form (§2.1).
  - Show generic "if we have tickets for this email, we've sent a link" regardless of whether the email matched. No account enumeration.
  - 30s rate-limit countdown on submit button.
- `/portal/:orgSlug/tickets` — token-scoped list (§2.2). Sanitized fields only — no classification/escalation/queue/assignee/handoff fields exist in the response.
- `/portal/:orgSlug/tickets/:number` — detail thread + reply composer + attachment chip row (§2.3–2.5).
  - Reply auto-reopens `pending` and (within 14-day reopen window) `resolved` tickets. Show inline notice when this happens.
  - Attachment upload: 10 MB cap, image/PDF/text MIME only. Two-step flow — `POST /attachments` returns descriptor, then include descriptor in `/reply` body.
- One-column 640px serif layout per §7 "Customer portal" rules. Distinct from operator chrome — no sidebar, no marketing copy on the access page, no signup CTA.

**Replaces:** [src/pages/MyTicketsPage.tsx](../../../src/pages/MyTicketsPage.tsx), which uses the deprecated `/visitor/:orgId/:email` + `/by-number/*` endpoints flagged in doc §9. Keep the file until the portal is live, then delete.

## 2. Verified-SDK ticket view (Phase 4 §2.6) — 🆕

Same surfaces as the customer portal, but:

- Auth via `?email=…&sig=…` (HMAC-SHA256 of email with widget secret). The SDK already computes `sig` — confirm helper export with backend before designing.
- Hide the magic-link request flow entirely. The customer is already verified.
- Lives behind the widget fullscreen `/support` route on customer-embedded pages.

## 3. CSAT (Phase 5) — 🆕

- **Customer portal:** 5-star widget on resolved ticket detail. Submit via `POST /public/:orgId/tickets/:number/csat`. Optimistic update on click; on `409 Conflict` show "Thanks — we have your feedback."
- **Operator ticket detail:** "Request CSAT" button calling `POST /:ticketId/request-csat` (§1.1). Available when ticket is resolved and CSAT hasn't been submitted.
- **Email link landing (§3.1):** Backend returns a styled HTML thank-you page directly. **Open question** for backend: is this branded already, or does FE need to host a `/csat-thanks` route?

## 4. Integration Outbox admin (Phase 6) — 🆕

Doc §4 + §6 IA `/support/integrations/outbox`. Deliberately "boring" per §7.

- **Outbox table** — columns: provider, event, status, attempts, last error, last attempted, external link (if completed). Filter chips by status. Quietly hide `completed` items older than 7 days.
- **Per-row "Retry"** on `failed`/`dead` items (§4.2).
- **"Drain now"** admin button (§4.3) — use sparingly; show stats on completion.
- **External-links panel on ticket detail** (§4.4) — list Slack/Linear/webhook back-pointers, manual add form.
- **Force-sync per provider** on ticket detail (§4.5) — small button group `Sync to Slack / Linear / Webhook`.

When an org hasn't configured `outbox_providers`, the tab should show an explainer + "Connect Slack/Linear" CTA pointing at the existing integration config (don't render an empty table).

## 5. Analytics expansion (Phase 7) — 🟡

[src/pages/support/SupportAnalyticsPage.tsx](../../../src/pages/support/SupportAnalyticsPage.tsx) currently has only **Overview** + **Weekly Report** tabs, both wired to legacy `getSupportStats` / `getWeeklyReport`. Rebuild and add:

- **Overview tab** — wire `GET /analytics/tickets` (§5.1).
  - Big-number row: total / open / unassigned / breaches.
  - Status bar chart.
  - Queue donut.
  - Three sparklines: `ai_to_ticket_conversion`, `reopen_rate`, `csat_average`.
- **SLA tab** — wire `GET /analytics/tickets/sla` (§5.2).
  - Hit-rate gauge.
  - Side-by-side FRT + resolution cards.
  - List of currently breached/at-risk tickets (filter ticket list locally on `sla_status`).
- **Categories tab** — wire `GET /analytics/tickets/categories` (§5.3).
  - Sortable table (category → count/resolved/escalated/reopen_count).
  - Root-causes panel beneath. Clicking a row deep-links to the ticket list filtered by `dedupe_key`.
- **Agents tab** — wire `GET /analytics/tickets/agents` (§5.4).
  - Sortable table. Click name → filter ticket list by assignee.

Each tile gets a "What this means" hover tooltip so a new operator doesn't have to guess what `ai_to_ticket_conversion` means.

> Performance note from doc §9: analytics endpoints scan tickets per request. For orgs > ~3k tickets this will get slow. Backend will materialize a rollup row when needed; response shape stays stable.

## 6. Audit export (Phase 7 §5.5) — 🆕

Small "Download audit" button on the operator ticket detail. Format toggle: JSON / CSV. Hits `GET /orgs/:orgId/audit-export?ticket_id=…&format=…`. Backend sets `Content-Disposition: attachment` — trigger a download, don't render in-app.

## 7. Queues CRUD (`/support/queues`) — 🆕

Doc §1.2 + §6 IA. None exists. Need:

- List queues, create, edit, delete.
- Manage members + `assignment_mode`.
- Quick filter on ticket list by queue (already partially supported in [src/pages/support/SupportTicketsPage.tsx](../../../src/pages/support/SupportTicketsPage.tsx) but the queue settings have nowhere to live).

## 8. SLA Policies CRUD (`/support/sla-policies`) — 🆕

Doc §1.2 + §6 IA. None exists. The only SLA reference in the codebase is [SupportSettingsPage.tsx:340](../../../src/pages/support/SupportSettingsPage.tsx#L340) — a `sla_pressure` handoff toggle, unrelated to SLA policies. Need full policy CRUD page.

## 9. Agent availability (§1.2) — 🆕

`GET /orgs/:orgId/agents/availability` + `PATCH /orgs/:orgId/agents/me/availability`. Needs a presence/away toggle somewhere in operator chrome — likely the inbox header or profile dropdown. **Open question** for backend: does this map to existing user accounts or a separate "agent" entity?

## 10. Operator ticket-detail enhancements — 🟡

Ticket detail page exists; lifecycle controls do not. Add:

- **Status transition buttons:** `pending`, `on-hold`, `escalate`, `escalate/ack`, `reopen`, `close`, `classify`, `route` (§1.1, most NEW).
- **PATCHes:** set priority, category, queue, assignee (§1.1).
- **External-links panel** (§4.4) — list + add Slack/Linear back-pointers.
- **Force-sync per provider** (§4.5) — button group.
- **Audit export button** (§5.5).
- **Request CSAT button** (§1.1) — conditional on resolved + not-yet-submitted.
- **SLA pill** in the detail header — green > 30m left, amber 0–30m, red overdue. Same component reused on ticket list rows.

## 11. Cross-cutting design rules — ✅ applied

Audited 2026-05-31 against the now-shipped code. Where each rule lands:

- **One status color system** — operator `StatusBadge` in [SupportTicketsPage.tsx:920](../../../src/pages/support/SupportTicketsPage.tsx#L920) and portal `StatusBadge` in [PortalChrome.tsx:104](../../../src/pages/portal/PortalChrome.tsx#L104) now share an identical palette (open/in_progress=sky · pending=amber · on_hold=slate · escalated=orange · resolved=emerald · closed/merged/snoozed=slate-muted). Operator status filter tabs cover all 9 spec states.
- **Ticket numbers** — `font-mono` + muted everywhere: list rows, detail header, outbox table, portal pages.
- **Polling cadence** — visibility-aware across the board:
  - Operator inbox ([SupportInboxPage.tsx](../../../src/pages/support/SupportInboxPage.tsx)) — 5 s focused / 30 s backgrounded (was 2 s flat)
  - Operator conversation detail ([SupportConversationPage.tsx](../../../src/pages/support/SupportConversationPage.tsx)) — 3 s focused / 30 s backgrounded (was 2 s flat)
  - Portal list — 10 s / 60 s. Portal detail — 3 s / 30 s.
- **Diff-and-animate new rows** — portal list does this via the `portal-row-in` keyframe in [src/index.css](../../../src/index.css). Operator inbox uses the background-refresh flag instead of full re-render — equivalent UX.
- **Optimistic updates** — portal reply (rolls back on failure with toast + draft restore), operator lifecycle bar, operator PATCH controls (priority/category/queue/assignee), outbox retry, availability toggle. No "Saving…" labels anywhere.
- **Relative timestamps** — operator ticket list, detail header, and message bubbles now render via `relativeTimeShort` ("23m ago" / "1h 12m ago" / falls back to short date past 14 days) with the absolute ISO time on hover. Portal uses its own `relativeTime` helper. The legacy `toLocaleString()` calls inside the resolve-modal and admin pages stay (they're for explicit "the operator made a permanent decision" context, not list scanning).
- **Empty states** — every list, table, and detail surface has the one-line explanation + primary action shape (Inbox, Tickets list, Outbox, Queues, SLA policies, Categories, Agents, both portal pages).

## 12. API client work — ✅ shipped

All ~30 wrappers landed in [src/services/api/support-api.ts](../../../src/services/api/support-api.ts) and [src/services/api/portal-api.ts](../../../src/services/api/portal-api.ts) across the Phase 4–7 work. Inventory below for reference.

**Operator lifecycle (§1.1):** `markTicketPending`, `markTicketOnHold`, `reopenTicket`, `closeTicket`, `classifyTicket`, `routeTicket`, `escalateTicket`, `ackEscalation`, `requestCsat`, `setTicketStatus`, `setTicketPriority`, `setTicketCategory`, `setTicketQueue`, `assignTicket`.

**Customer portal (§2 + verified-SDK variant):** `requestPortalAccessLink`, `listPortalTickets`, `getPortalTicket`, `replyToPortalTicket`, `uploadPortalAttachment` — dispatched to `/public/` or `/verified/` automatically by [portal-api.ts](../../../src/services/api/portal-api.ts) based on the resolved auth mode.

**CSAT (§3):** `submitCsat`, `submitCsatSafe` (translates 409 to a typed `CsatAlreadySubmittedError`).

**Outbox (§4):** `listIntegrationOutbox`, `retryOutboxItem`, `drainOutbox`, `listExternalLinks`, `createExternalLink`, `forceSyncTicket`.

**Analytics (§5):** `getTicketAnalyticsOverview`, `getTicketAnalyticsSla`, `getTicketAnalyticsCategories`, `getTicketAnalyticsAgents`, `downloadTicketAudit`.

**Queues + SLA + availability + categories (§1.2):** `listQueues`, `createQueue`, `updateQueue`, `deleteQueue`, `listSlaPolicies`, `createSlaPolicy`, `updateSlaPolicy`, `deleteSlaPolicy`, `listAgentAvailability`, `updateMyAvailability`, `listTicketCategories`.

## 13. Open questions for backend

1. **CSAT email landing (§3.1):** is the HTML thank-you page already styled to match Lira, or does FE host `/csat-thanks`?
2. **Portal path:** doc §2 shows `/public/:orgId/*` but §6 IA shows `/portal/:orgSlug/*`. Confirm whether the public surface routes by org slug or org id.
3. **Agent availability:** maps to existing user accounts or a separate "agent" entity?
4. **Verified-SDK auth:** does `@lira/support-sdk` export a helper to compute `sig`, or does FE need to compute HMAC client-side?
5. **Outbox config detection:** how does FE detect "outbox not configured" so it can render the empty-state CTA instead of an empty table?

---

## Implementation order (proposed)

Suggested sequencing — first item delivers the most external value, last items are internal polish.

1. **API client wrappers** (§12) — non-blocking, can be stubbed and merged before any UI work
2. **Customer magic-link portal** (§1) — unblocks every embedded-Lira customer
3. **Operator ticket-detail lifecycle** (§10) — the operator workflow is broken without `pending`/`on-hold`/`escalate`
4. **CSAT** (§3) — quick win once portal is live
5. **Verified-SDK ticket view** (§2) — depends on portal patterns
6. **Analytics expansion** (§5)
7. **Audit export** (§6)
8. **Integration Outbox** (§4) — admin-only, lower urgency
9. **Queues + SLA policies CRUD** (§7, §8) — operator-only, can ship after the above
10. **Agent availability** (§9) — small surface, can land alongside any of the above

---

_Maintain this doc as items get built — strike them through or move to a "Shipped" section rather than deleting, so the team has a record of what landed when._
