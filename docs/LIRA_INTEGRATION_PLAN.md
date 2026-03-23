# Lira AI — Integration Plan

> **Author:** Copilot · **Date:** 2025-05-20 · **Reviewed:** 2026-03-23
> **Status:** Reviewed / Pre-Implementation
> **Scope:** Task Management (Jira / Linear / ClickUp), Auto-Meeting Scheduling, Email via Resend

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Architecture Snapshot](#2-current-architecture-snapshot)
3. [Pillar 1 — Task Management Platform](#3-pillar-1--task-management-platform)
   - 3.1 Platform Comparison
   - 3.2 Recommendation: Linear (primary) + Jira (secondary)
   - 3.3 Architecture Design
   - 3.4 Data Flow
   - 3.5 Implementation Steps
4. [Pillar 2 — Auto-Meeting Scheduling](#4-pillar-2--auto-meeting-scheduling)
   - 4.1 Concept
   - 4.2 Architecture Design
   - 4.3 What Works / What Doesn't
   - 4.4 Implementation Steps
5. [Pillar 3 — Email via Resend](#5-pillar-3--email-via-resend)
   - 5.1 Why Resend
   - 5.2 Architecture Design
   - 5.3 Email Types
   - 5.4 Implementation Steps
6. [Unified Integration Architecture](#6-unified-integration-architecture)
7. [DynamoDB Schema Additions](#7-dynamodb-schema-additions)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [What Will Work / What Won't](#9-what-will-work--what-wont)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

Lira already has a mature post-meeting pipeline: GPT-4o extracts tasks from transcripts, stores them in DynamoDB, and fires Slack webhook notifications. The three proposed integrations **extend** this pipeline rather than replace it:

| Integration         | What It Does                                                                         | Key Benefit                                                       |
| ------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Task Management** | Syncs Lira-extracted tasks to Linear/Jira/ClickUp                                    | Tasks flow into the team's actual workflow tool                   |
| **Auto-Scheduling** | Detects meeting mentions in conversation → creates calendar events → Lira auto-joins | Meetings get booked without leaving the current meeting           |
| **Email (Resend)**  | Sends meeting summaries, task assignments, and invites via email                     | Participants and stakeholders stay informed without needing Slack |

All three share a common **Integration Connection** model (OAuth tokens stored per-org in DynamoDB) and a common **Integration Event Bus** pattern (the notification service dispatches events, adapters push to connected services).

---

## 2. Current Architecture Snapshot

```
┌──────────────────────────────────────────────────┐
│                    LIRA BACKEND                   │
│  Fastify 4 + TypeScript · EC2 · Node.js          │
├──────────────────────────────────────────────────┤
│                                                   │
│  Bot Manager ──► Lira Sonic (Nova Sonic)          │
│       │               │                           │
│       │          transcript                       │
│       ▼               ▼                           │
│  Meeting Ends ──► extractPostMeetingTasks()       │
│       │               │                           │
│       │          GPT-4o analysis                  │
│       ▼               ▼                           │
│  lira-task.service ◄─ TaskRecord[] saved          │
│       │                                           │
│       ▼                                           │
│  lira-notification.service                        │
│       │                                           │
│       ├──► Slack webhook (org-level)              │
│       ├──► DynamoDB notification (per-user)       │
│       └──► [FUTURE] Integration adapters          │
│                                                   │
├──────────────────────────────────────────────────┤
│  DATA STORES                                      │
│  • DynamoDB: lira-organizations (single-table)    │
│  • DynamoDB: lira-meetings                        │
│  • DynamoDB: lira-connections (WebSocket)          │
│  • PostgreSQL (Prisma): TenantUsers (email, name) │
│  • S3: audio recordings, task execution results   │
│  • Qdrant: vector search for KB/docs              │
└──────────────────────────────────────────────────┘
```

**Existing Webhook Config** (per org):

```ts
{
  PK: "ORG#<orgId>",
  SK: "WEBHOOK_CONFIG",
  slack_webhook_url: string,
  email_notifications: boolean, // placeholder, unused
  notify_on: string[]           // ["task_created", "meeting_ended", ...]
}
```

**TaskRecord fields already available:**

```
task_id, org_id, session_id, title, description, assigned_to,
priority (low|medium|high|urgent),
task_type (action_item|draft_document|follow_up_email|research|summary|decision),
status (pending|in_progress|completed|cancelled),
source_quote, due_date, created_by,
execution_status, execution_result, execution_s3_key
```

**Members have emails** via `TenantUser` in PostgreSQL — `email`, `name`, `picture`, `googleId`.

---

## 3. Pillar 1 — Task Management Platform

### 3.1 Platform Comparison

| Criteria                | Linear                                                                   | Jira                                                            | ClickUp                                         |
| ----------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------- |
| **API Type**            | GraphQL (modern, introspectable)                                         | REST v3 (verbose, complex)                                      | REST v2 (moderate)                              |
| **Auth**                | OAuth 2.0 + PKCE, API keys, client credentials                           | OAuth 2.0 (3LO), API tokens, Forge/Connect                      | OAuth 2.0, API keys                             |
| **TypeScript SDK**      | `@linear/sdk` — first-party, strongly typed                              | `jira.js` — community, adequate                                 | None official; REST only                        |
| **Webhooks**            | Yes — Issue/Comment/Project/Cycle events, HMAC signature verification    | Yes — all resource events, but requires Connect/Forge app setup | Yes — task events, but webhook setup is fragile |
| **Issue Creation**      | 1 GraphQL mutation (`issueCreate`) — simple                              | REST POST with ADF body format — complex                        | REST POST — moderate                            |
| **Rate Limits**         | Generous (complexity-based, ~1500 points/min)                            | Standard (~REST, varies by endpoint)                            | 100 req/min per token                           |
| **Target Users**        | Engineering/product teams, startups, modern orgs                         | Enterprise, legacy-heavy, large orgs                            | Mixed teams, broad use cases                    |
| **Pricing**             | Free (up to 250 issues), cheap paid tiers                                | Free tier limited, paid per user                                | Free tier generous                              |
| **AI Agent Support**    | First-class — Agent Interaction Guidelines (AIG), `app:assignable` scope | Limited — no native agent concept                               | None                                            |
| **Bi-directional Sync** | Webhooks + GraphQL mutations = full two-way                              | Possible but complex (Atlassian Cloud, cloudId routing)         | Possible but less reliable                      |

### 3.2 Recommendation: Linear (Primary) + Jira (Secondary)

**Start with Linear.** Here's why:

1. **Modern GraphQL API** — One mutation creates an issue. No ADF format complexity, no cloudId routing, no Atlassian Connect overhead.
2. **First-party TypeScript SDK** (`@linear/sdk`) — Strongly typed, well-maintained. Lira's backend is TypeScript; natural fit.
3. **Agent-first design** — Linear's Agent Interaction Guidelines and `app:assignable` / `app:mentionable` scopes mean Lira can be a first-class participant in Linear workflows.
4. **OAuth 2.0 with client credentials** — Server-to-server token grants (30-day validity) simplify the connection flow. No user-initiated OAuth for background sync.
5. **Clean webhooks** — HMAC-SHA256 signed, typed payloads, retry logic built in. Perfect for two-way sync.
6. **Target audience match** — Lira's customers are engineering/product teams who likely already use Linear (or would adopt it).

**Add Jira later** as a second connector for enterprise customers. The integration layer is designed to be adapter-based, so adding Jira is a matter of writing a `JiraAdapter` that implements the same interface.

**ClickUp** is the lowest priority — no official SDK, less reliable webhooks, and a smaller developer ecosystem. Defer unless customer demand drives it.

### 3.3 Architecture Design

```
┌─────────────────────────────────────────────────┐
│           INTEGRATION CONNECTION MODEL            │
│  (DynamoDB: ORG#<orgId> | INTEGRATION#<provider>) │
├─────────────────────────────────────────────────┤
│  provider: "linear" | "jira" | "clickup"         │
│  access_token: encrypted string (AES-256-GCM)    │
│  refresh_token: encrypted string (if applicable)  │
│  encrypted_data_key: string (KMS-encrypted DEK)   │
│  token_expires_at: ISO string                     │
│  workspace_id: string (Linear org / Jira cloudId) │
│  default_team_id: string (Linear team)            │
│  default_project_key: string (Jira project)       │
│  field_mapping: JSON (Lira priority → platform)   │
│  sync_enabled: boolean                            │
│  connected_by: userId                             │
│  connected_at: ISO string                         │
└─────────────────────────────────────────────────┘
```

**Token Encryption (Decision: KMS Envelope Encryption):**

Each org's integration tokens are encrypted with a unique per-org data encryption key (DEK):

1. On connect: call `KMS.generateDataKey()` → returns plaintext DEK + KMS-encrypted DEK.
2. Encrypt `access_token` and `refresh_token` with plaintext DEK using AES-256-GCM (include IV + auth tag).
3. Store `encrypted_data_key` (KMS-encrypted DEK) alongside the ciphertext. Discard plaintext DEK.
4. On read: call `KMS.decrypt(encrypted_data_key)` → plaintext DEK → decrypt tokens.
5. On token refresh: re-encrypt new tokens with the same DEK (no KMS round-trip for the key itself).

Benefits over a shared Secrets Manager key:

- Per-org key isolation — compromising one org's DEK doesn't expose others.
- KMS audit trail — every decrypt operation logged in CloudTrail per org.
- Key rotation — rotate the KMS CMK; existing DEKs remain valid, new DEKs use the new CMK.
- Enterprise offboarding — disable/delete an org's DEK to make their tokens permanently inaccessible.

**Webhook Architecture (Decision: Global Endpoint, Not Per-Org):**

Linear limits the number of webhooks per workspace. Registering one webhook per Lira org would hit this limit at scale. Instead:

- Register **one global webhook** per Linear workspace during OAuth connect: `POST /lira/v1/webhooks/inbound/linear`.
- The webhook receives all events for that workspace. Use `organizationId` in the payload to route to the correct Lira org connection.
- Store the webhook signing secret globally per Linear workspace, not per Lira org.
- On disconnect: only delete the webhook if no other Lira orgs in that workspace are still connected.

**Adapter Interface:**

```ts
interface TaskPlatformAdapter {
  // Connection
  getAuthUrl(orgId: string, redirectUri: string): string
  exchangeCode(code: string, redirectUri: string): Promise<TokenSet>
  refreshToken(connection: IntegrationConnection): Promise<TokenSet>

  // Sync outbound (Lira → Platform)
  createIssue(conn: IntegrationConnection, task: TaskRecord): Promise<ExternalIssue>
  updateIssue(
    conn: IntegrationConnection,
    externalId: string,
    updates: Partial<TaskRecord>
  ): Promise<void>
  // ^ Must handle 404 gracefully: clear external_id + delete TASK_MAP record

  // Sync inbound (Platform → Lira) via webhooks
  parseWebhookPayload(headers: Record<string, string>, body: string): WebhookEvent
  verifyWebhookSignature(headers: Record<string, string>, body: string, secret: string): boolean

  // Queries
  listTeams(conn: IntegrationConnection): Promise<Team[]>
  listMembers(conn: IntegrationConnection, teamId: string): Promise<Member[]>
  listStatuses(conn: IntegrationConnection, teamId: string): Promise<Status[]>
}
```

### 3.4 Data Flow

#### Outbound: Lira Task → Linear Issue

```
1. Meeting ends
2. extractPostMeetingTasks() → GPT-4o extracts tasks → saved to DynamoDB
3. notificationService.notifyTasksCreated(tasks)
4. FOR EACH task WHERE org has Linear connection AND sync_enabled:
   a. linearAdapter.createIssue(connection, task)
      → mutation issueCreate { title, description, teamId, priority, assigneeId? }
   b. Save external_id (Linear issue ID) on TaskRecord
   c. Store mapping: ORG#<orgId> | TASK_MAP#<taskId> → { external_id, provider }
5. Slack/email notifications fire as normal
```

#### Inbound: Linear Issue Updated → Lira Task Updated

```
1. Linear fires webhook to POST /lira/v1/webhooks/inbound/linear
2. Verify HMAC-SHA256 signature + check webhookTimestamp within 60s
3. Check idempotency: has this Linear-Delivery header UUID been processed?
   → YES: return 200 immediately (deduplicate retries)
   → NO: proceed
4. Return HTTP 200 immediately, process event async (prevents Linear
   retry on slow DynamoDB lookups; Linear retries if no 200 within 5s)
5. Parse payload → { action, type, data, updatedFrom, organizationId }
6. Route by organizationId → find matching Lira org connection
7. Look up TaskRecord by external_id
8. IF action == "remove" (issue deleted in Linear):
   → Clear external_id from TaskRecord, delete TASK_MAP record
   → Do NOT delete the Lira task itself
9. IF status changed in Linear → update TaskRecord.status
10. IF assignee changed → update TaskRecord.assigned_to
11. Fire internal notification if relevant
12. Store Linear-Delivery UUID in a short-TTL (24h) idempotency record
```

**Webhook endpoint hardening:**

- **Rate limiting:** Apply Fastify rate-limit plugin to the inbound webhook route (e.g., 100 req/s). Linear can fire rapidly on bulk updates.
- **Idempotency:** Use the `Linear-Delivery` header UUID as an idempotency key. Store processed UUIDs in a DynamoDB record with 24h TTL.
- **Async processing:** Return HTTP 200 immediately after signature verification, then process the event asynchronously. Linear retries after 5s if no 200, so slow downstream operations would cause duplicate deliveries.
- **Deleted issue handling:** When Linear returns `action: "remove"` or the adapter's `updateIssue()` gets a 404 response, clear the `external_id` from the TaskRecord and delete the TASK_MAP record. Do not surface an error to the user.

#### Member Mapping

Lira members ↔ Linear members need a mapping table. Options:

- **Email match** (recommended): Match Lira member email to Linear user email. Auto-map on first sync.
- **Manual mapping**: Admin maps members in settings UI. More control but more friction.
- **Hybrid** (chosen): Auto-map by email, allow manual overrides.

**Fallback when email match fails:** If a Lira task is assigned to a user whose email doesn't match any Linear workspace member:

1. Create the Linear issue **unassigned**.
2. Add a comment: `"Originally assigned to: alice@company.com — please assign manually in Linear."`
3. Store the MEMBER_MAP record with `status: "unresolved"` and `lira_email: "alice@company.com"`.
4. Surface a notification in Lira: "Task 'X' could not be auto-assigned in Linear — manual assignment required."
5. When the admin later maps the member manually, re-assign all unresolved issues for that member.

#### Task & Mapping Cleanup

**On task deletion:** When `deleteTask(taskId)` is called, also delete the corresponding `TASK_MAP#<taskId>` record. Otherwise orphaned mapping records accumulate indefinitely.

**On integration disconnect:** When an org disconnects their Linear integration:

1. Delete all `TASK_MAP#*` records for that org (batch delete).
2. Delete all `MEMBER_MAP#*` records for that org.
3. Clear `external_id` from all TaskRecords that had synced issues.
4. Only delete the Linear workspace webhook if no other Lira orgs share that workspace.

### 3.5 Implementation Steps

| #   | Step                             | Details                                                                                                                                                                                                |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Create Linear OAuth app**      | Register at linear.app/settings/api/applications. Scopes: `read`, `write`, `issues:create`. Redirect URI: `https://liraintelligence.com/integrations/linear/callback`                                  |
| 2   | **Integration connection model** | Add `INTEGRATION#<provider>` record to DynamoDB `lira-organizations` table                                                                                                                             |
| 3   | **OAuth flow routes**            | `GET /lira/v1/integrations/linear/auth` → redirect to Linear. `GET /lira/v1/integrations/linear/callback` → exchange code, save tokens                                                                 |
| 4   | **Linear adapter**               | Install `@linear/sdk`. Implement `TaskPlatformAdapter` for Linear                                                                                                                                      |
| 5   | **Task sync hook**               | After `extractPostMeetingTasks()`, check for connected platform → push tasks                                                                                                                           |
| 6   | **Webhook endpoint**             | `POST /lira/v1/webhooks/inbound/linear` — global endpoint routing by `organizationId` in payload. Rate-limited (100 req/s), idempotent via `Linear-Delivery` UUID, async processing after 200 response |
| 7   | **Settings UI**                  | Frontend page: Connect/disconnect Linear, select default team, map members, resolve unmatched members                                                                                                  |
| 8   | **Two-way status sync**          | When Linear issue moves to "Done" → mark Lira task completed, and vice versa                                                                                                                           |

---

## 4. Pillar 2 — Auto-Meeting Scheduling

### 4.1 Concept

During a meeting, someone says:

> "We should have a follow-up meeting with just the front-end team on Saturday at 2 PM."

Lira detects this, extracts the meeting intent, and:

1. Creates a scheduled meeting record
2. Sends calendar invites (via email/Google Calendar)
3. Auto-joins when the meeting time arrives

### 4.2 Architecture Design

#### Detection Layer (in `lira-sonic.service.ts`)

Add a **meeting scheduling detector** to the post-meeting task extraction pipeline. This is better than real-time detection because:

- Real-time detection during audio stream is unreliable (partial sentences, corrections)
- Post-meeting extraction can use the full context of the transcript
- GPT-4o can disambiguate "we should meet" (intent) vs "we met last week" (past tense)

**Extend the GPT-4o extraction prompt** to identify a new task type: `schedule_meeting`.

```ts
// New task_type added to extraction
type TaskType =
  | 'action_item'
  | 'draft_document'
  | 'follow_up_email'
  | 'research'
  | 'summary'
  | 'decision'
  | 'schedule_meeting' // NEW

// Extracted meeting schedule data
interface ScheduledMeetingExtraction {
  title: string // "Front-end team sync"
  suggested_date?: string // "Saturday" / "2025-05-24" / "next week"
  suggested_time?: string // "2 PM" / "afternoon"
  suggested_duration_minutes?: number // 30 / 60
  participants?: string[] // ["front-end team"] / ["Alice", "Bob"]
  source_quote: string // The actual transcript snippet
  confidence: 'high' | 'medium' | 'low'
}
```

#### Scheduling Pipeline

```
1. Meeting ends → extractPostMeetingTasks() runs
2. GPT-4o returns tasks including type: "schedule_meeting"
3. FOR EACH schedule_meeting task:
   a. Parse natural language date/time → ISO datetime
      - Use chrono-node (or @the-brane/chrono fork) for NL date parsing
      - Resolve "Saturday" relative to meeting date
      - CRITICAL: pass the org's configured timezone (or meeting
        creator's locale) to the parser. Without this, "2 PM" is
        parsed in server timezone (us-east-1), producing silent
        scheduling errors for teams in other timezones.
   b. Apply confidence filter:
      - HIGH confidence → create as "proposed", auto-confirm after 24h
      - MEDIUM/LOW confidence → create as "proposed" only, require
        explicit confirmation via notification/UI
   c. Create ScheduledMeeting record in DynamoDB (status: proposed)
   d. Send proposal notification via email/Slack:
      "Lira detected a scheduling intent: Front-end sync on Saturday 2 PM.
       Confirm or cancel: [link]"
   e. On confirmation:
      - IF meeting_link provided → schedule auto-join timer at T-2min
      - IF no meeting_link → mark as confirmed but skip auto-join;
        prompt user to add meeting link
   f. Send email invites via Resend (if email integration active)
4. Auto-join ONLY fires if a valid meeting URL exists on the record
```

#### Auto-Join Mechanism

```
┌─────────────────────────────────────────────────┐
│      SCHEDULED MEETING RECORD                    │
│  PK: ORG#<orgId>  SK: SCHED_MTG#<schedId>      │
├─────────────────────────────────────────────────┤
│  sched_id, org_id, title                        │
│  scheduled_at: ISO datetime (in org timezone)    │
│  timezone: string (e.g. "America/Lagos")         │
│  duration_minutes: number                        │
│  meeting_link?: string (Google Meet URL)          │
│  └─ auto-join ONLY attempted if this is set       │
│  participants: string[] (emails or member IDs)    │
│  source_session_id: string (origin meeting)       │
│  source_quote: string                             │
│  confidence: high | medium | low                  │
│  status: proposed | confirmed | cancelled         │
│  bot_deployed: boolean                            │
│  created_by: userId                               │
│  created_at, updated_at                           │
└─────────────────────────────────────────────────┘
```

**Meeting link is required for auto-join.** The `meeting_link` field is optional on the record (proposals may not have one yet), but auto-join is **only** attempted when a valid URL is present. The frontend must make `meeting_link` a required field when confirming a scheduled meeting that should have Lira auto-join. Email invites can be sent without a link (with a placeholder "Meeting link TBD"), but bot deployment is skipped.

**Cron/Timer approach for auto-join:**

- Option A: **Node-cron** — In-process scheduler. Simple but doesn't survive restarts.
- Option B: **AWS EventBridge Scheduler** — Create a one-time schedule rule that invokes a Lambda or hits a Fastify endpoint at T-2min. Survives restarts, scales well.
- Option C: **DynamoDB TTL + Stream** — Set a TTL on a "timer" record to fire at T-2min. DynamoDB Streams trigger a Lambda. Creative but TTL precision is ~15min (unreliable).

**Recommendation:** Use **AWS EventBridge Scheduler** for production reliability. For MVP, **node-cron** with a "re-scan upcoming meetings on startup" pattern is acceptable.

### 4.3 What Works / What Doesn't

| Approach                                         | Works?                      | Notes                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Post-meeting extraction of scheduling intent** | Yes                         | GPT-4o is excellent at identifying "we should meet on X" patterns                                                                                                                                                                                                                                              |
| **Natural language date parsing**                | Yes (with caveats)          | `chrono-node` handles "next Saturday at 2 PM" well. **Must** pass org/user timezone explicitly — server default (us-east-1) will produce wrong times for other timezones. Consider `@the-brane/chrono` (active fork) if chrono-node has TS5.x issues. Edge cases: "in a couple days", ambiguous relative dates |
| **Auto-creating Google Meet links**              | Needs Google Calendar API   | Requires OAuth to Google Workspace. Can use service account for org-owned calendar                                                                                                                                                                                                                             |
| **Auto-join at scheduled time**                  | Yes (if meeting URL exists) | Bot manager already deploys bots to URLs. Just need a timer to trigger deploy. **Auto-join must be gated on `meeting_link` being present** — without a URL the bot has nowhere to go                                                                                                                           |
| **Real-time in-meeting scheduling**              | Not recommended for V1      | Audio stream detection is too unreliable. "Should we schedule?" ≠ "Schedule this." Post-meeting is safer                                                                                                                                                                                                       |
| **Participant resolution**                       | Partial                     | "front-end team" needs mapping to actual members. "Alice and Bob" can match by name. Unresolvable → assign to meeting organizer for manual resolution                                                                                                                                                          |

### 4.4 Implementation Steps

| #   | Step                                      | Details                                                                                                                                                                                                                                                                                                    |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Extend GPT-4o extraction prompt**       | Add `schedule_meeting` type with date/time/participant extraction                                                                                                                                                                                                                                          |
| 2   | **Date parser utility**                   | Install `chrono-node` (or `@the-brane/chrono` if TS5.x compat issues arise — verify before committing). Build `parseScheduleDate(text, referenceDate, timezone)` — timezone param is **required**, derived from org settings or meeting creator's locale. Without it, "2 PM" is parsed in server timezone. |
| 3   | **ScheduledMeeting model**                | Add `SCHED_MTG#<schedId>` records to DynamoDB                                                                                                                                                                                                                                                              |
| 4   | **Scheduling service**                    | `lira-schedule.service.ts` — create, confirm, cancel scheduled meetings                                                                                                                                                                                                                                    |
| 5   | **Auto-join timer**                       | MVP: node-cron job that checks for meetings in next 5 minutes. Production: EventBridge Scheduler                                                                                                                                                                                                           |
| 6   | **Email invites**                         | Use Resend (Pillar 3) to send meeting invite emails                                                                                                                                                                                                                                                        |
| 7   | **Frontend UI**                           | Scheduled meetings list page, confirm/edit/cancel actions                                                                                                                                                                                                                                                  |
| 8   | **Google Calendar integration** (Phase 2) | OAuth to Google, create calendar events with Meet links                                                                                                                                                                                                                                                    |

---

## 5. Pillar 3 — Email via Resend

### 5.1 Why Resend

- **Simple REST API** — `POST /emails` with `from`, `to`, `subject`, `html`. Done.
- **Node.js SDK** — `npm install resend`, 3 lines to send an email.
- **Scheduled sending** — `scheduledAt` parameter supports natural language ("in 1 min") and ISO 8601.
- **Templates** — Publish email templates in Resend dashboard, reference by ID. Variables get substituted.
- **Deliverability** — Built-in DKIM, SPF, DMARC compliance.
- **Cost** — Free tier: 100 emails/day, 3000/month. Paid: $20/mo for 50k emails.
- **No vendor lock-in** — Standard SMTP relay available if you outgrow the API.

### 5.2 Architecture Design

```
┌─────────────────────────────────────────────────┐
│           LIRA EMAIL SERVICE                     │
│  lira-email.service.ts                           │
├─────────────────────────────────────────────────┤
│                                                   │
│  Dependencies:                                    │
│  • resend (npm package)                           │
│  • Email templates (in Resend dashboard)          │
│  • Org member emails (from TenantUser/Prisma)     │
│                                                   │
│  Methods:                                         │
│  • sendMeetingSummary(orgId, sessionId, to[])     │
│  • sendTaskAssignment(orgId, taskId, assigneeEmail)│
│  • sendMeetingInvite(orgId, schedMtgId, to[])    │
│  • sendGenericNotification(orgId, subject, body)  │
│                                                   │
│  Config (per org or global):                      │
│  • RESEND_API_KEY (env var)                       │
│  • from: resolved from org EMAIL_CONFIG:          │
│    Platform: lira@liraintelligence.com            │
│    Custom:   lira@{org-verified-domain}           │
│  • replyTo: reply+<jwt>@liraintelligence.com      │
│                                                   │
└─────────────────────────────────────────────────┘
```

**Email Sending Mode — Two Options Per Org:**

Every org independently chooses their email mode. Both are available to all orgs — no pricing tier gates either option.

**Mode A — Platform Domain (default, zero-config):**

- Emails sent as: `Lira · Truth Vote <lira@liraintelligence.com>`
- No setup required by the org. Works immediately on account creation.
- `liraintelligence.com` is permanently verified in Resend once at launch (Lira team does this one time).
- The org name in the display name makes it feel org-specific without any configuration.

**Mode B — Custom Org Domain (org admin self-configures):**

- Emails sent as: `Lira <lira@truthvote.com>` — fully from the org's own domain.
- Org admin enters their domain in Lira Settings → Email → Use custom domain.
- Lira calls Resend's domain API: `POST /domains → { name: "truthvote.com" }` → Resend returns DNS records.
- Lira stores DNS records in `EMAIL_CONFIG` and displays them in the settings UI with copy-to-clipboard.
- Org admin adds records to their DNS provider (Namecheap, Cloudflare, Route 53, etc.).
- Lira polls `GET /domains/:id` until `status === "verified"`, then activates custom mode for that org.
- No extra cost from Resend — additional domains are included in all Resend plans.

**Reply-To (set on every outgoing email, both modes):**

- `Reply-To: reply+<jwt>@liraintelligence.com`
- JWT encodes context for the inbound reply engine (see §5.5).
- Enables AI-powered replies regardless of which sending mode the org uses.

**Platform domain DNS (one-time setup on `liraintelligence.com` by Lira team):**

| Type  | Host                 | Value                                                           | Purpose                             |
| ----- | -------------------- | --------------------------------------------------------------- | ----------------------------------- |
| ---   |
| CNAME | `resend._domainkey`  | _(from Resend dashboard)_                                       | DKIM key 1                          |
| CNAME | `resend2._domainkey` | _(from Resend dashboard)_                                       | DKIM key 2                          |
| CNAME | `resend3._domainkey` | _(from Resend dashboard)_                                       | DKIM key 3                          |
| TXT   | `@`                  | `v=spf1 include:amazonses.com ~all`                             | SPF (covers Resend + SES inbound)   |
| TXT   | `_dmarc`             | `v=DMARC1; p=quarantine; rua=mailto:dmarc@liraintelligence.com` | DMARC                               |
| MX    | `reply`              | `inbound-smtp.us-east-1.amazonaws.com`                          | SES inbound for `reply+*` addresses |

**Per-org EMAIL_CONFIG record (DynamoDB: `ORG#<orgId> | EMAIL_CONFIG`):**

```ts
{
  mode: "platform" | "custom",         // default: "platform"
  custom_domain?: string,              // e.g. "truthvote.com"
  resend_domain_id?: string,           // Resend domain ID for API management
  domain_verified: boolean,            // true once Resend confirms DNS propagation
  dns_records?: DnsRecord[],           // stored to redisplay in settings UI
  from_name?: string,                  // display name, e.g. "Lira · Truth Vote"
  email_notifications_enabled: boolean,
  notify_on: string[],                 // ["task_created", "meeting_ended", ...]
  updated_at: string,
}
```

### 5.3 Email Types

#### 1. Meeting Summary Email

**Trigger:** Meeting ends → summary generated
**Recipients:** All meeting participants (matched by email) + org admins if configured
**Content:**

```
Subject: Meeting Summary — "Sprint Planning" (May 20, 2025)

Hi team,

Here's the summary from today's meeting:

[Short summary paragraph]

Action Items:
• Task title — assigned to Alice — due May 25
• Task title — assigned to Bob — due May 27

Decisions Made:
• Decision 1
• Decision 2

Full transcript and details: [link to Lira meeting page]

—
Lira AI · Creovine Labs
```

#### 2. Task Assignment Email

**Trigger:** Task extracted and assigned to a member
**Recipient:** Assigned member
**Content:**

```
Subject: New task assigned: "Update API docs"

Hi Alice,

A new task from the Sprint Planning meeting has been assigned to you:

Title: Update API docs
Priority: High
Due: May 25, 2025
Source: "Alice, can you update the API documentation by end of week?"

View in Lira: [link]
View in Linear: [link] (if connected)

—
Lira AI
```

#### 3. Meeting Invite Email

**Trigger:** Scheduled meeting created (Pillar 2)
**Recipients:** Listed participants
**Content:**

```
Subject: Meeting scheduled: "Front-end Team Sync" — Saturday 2 PM

Hi team,

A follow-up meeting has been scheduled from your Sprint Planning session:

Title: Front-end Team Sync
Date: Saturday, May 24, 2025 at 2:00 PM EST
Duration: 30 minutes
Meeting Link: [Google Meet URL]

Originally mentioned by: "We should have a meeting with just the front-end
individuals on Saturday"

Lira will automatically join this meeting.

—
Lira AI
```

#### 4. Weekly Digest Email (Future)

**Trigger:** Cron (Monday 9 AM)
**Recipients:** All org members
**Content:** Summary of past week's meetings, tasks created, tasks completed.

### 5.4 Implementation Steps

| #   | Step                               | Details                                                                                                                                                                                                                                                                 |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Platform domain verification**   | Add `liraintelligence.com` to Resend as the shared sending domain. Configure DNS (DKIM CNAMEs, SPF TXT, DMARC TXT) on Namecheap. One-time setup by Lira team at launch.                                                                                                 |
| 2   | **Install SDK**                    | `npm install resend` in backend                                                                                                                                                                                                                                         |
| 3   | **Unsubscribe infrastructure**     | Set up Resend Audiences for each org. All emails must include a functional unsubscribe link from day one (CAN-SPAM / GDPR). Implement before sending the first email.                                                                                                   |
| 4   | **Email service**                  | `lira-email.service.ts` — wrapper around Resend SDK. Resolves `from` address from org's `EMAIL_CONFIG` (platform vs custom mode). Generates `reply+<jwt>` token for every email sent. Passes audience context so Resend enforces unsubscribe preferences.               |
| 5   | **Per-org custom domain API**      | `POST /lira/v1/email/domain` → call `resend.domains.create({ name })` → return DNS records to frontend. `GET /lira/v1/email/domain/status` → poll Resend verification status. On verified: update `EMAIL_CONFIG.domain_verified = true`, activate custom mode.          |
| 6   | **Email templates**                | Create templates in Resend dashboard for each email type (meeting summary, task assignment, meeting invite)                                                                                                                                                             |
| 7   | **Hook into notification service** | Extend `lira-notification.service.ts` to call email service alongside Slack                                                                                                                                                                                             |
| 8   | **Org email settings**             | `EMAIL_CONFIG` DynamoDB record per org: mode, custom_domain, resend_domain_id, domain_verified, dns_records, from_name, notify_on                                                                                                                                       |
| 9   | **Frontend email settings UI**     | Two-option config: (A) Platform default — shows `lira@liraintelligence.com`, zero config; (B) Custom domain wizard — domain input, generated DNS records table with copy buttons, live verification status badge, retry verification button. Per-member opt-out toggle. |

---

### 5.5 Inbound Reply System

Lira's emails are not one-way notifications. Every email includes a `Reply-To` address that routes replies into an AI-powered response engine. Lira reads the reply in context, queries the org's knowledge base, and either responds directly or escalates to the right human. The conversation can continue back and forth — each reply from Lira carries a new token referencing the full thread.

#### Architecture

```
OUTBOUND (Resend):
  Lira → sends email
  Reply-To: reply+<jwt>@liraintelligence.com
            └─ JWT: { orgId, memberId, contextType, contextId, threadId, exp }

INBOUND (AWS SES → Fastify):
  Person replies → reply+<jwt>@liraintelligence.com
  ↓
  SES receives (MX record on `reply` subdomain of liraintelligence.com)
  ↓
  Receipt rule → store raw email to S3 → SNS notification
  ↓
  POST /lira/v1/email/inbound (Fastify)
  ↓
  Decode JWT → fetch context → GPT-4o decision
  ↓
  ┌────────────────────┐        ┌──────────────────┐
  │ CAN ANSWER        │        │ CANNOT ANSWER    │
  │ Draft reply       │        │ Canned reply to  │
  │ Send via Resend   │        │ sender + notify  │
  │ New JWT in Reply- │        │ org admin        │
  │ To for next reply │        └──────────────────┘
  └────────────────────┘
```

#### JWT Reply Token

Generated per recipient, per email sent. Includes a `threadId` so the full conversation history is preserved across multiple back-and-forth replies:

```ts
const replyToken = jwt.sign(
  {
    orgId: 'org_123',
    memberId: 'user_456',
    contextType: 'meeting_summary', // "task_assignment" | "meeting_invite"
    contextId: 'session_789',
    threadId: 'thread_abc', // groups all replies in a conversation
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30-day expiry
  },
  process.env.REPLY_TOKEN_SECRET
)

// Set in every outgoing email (initial + replies):
replyTo: `reply+${replyToken}@liraintelligence.com`
```

**Thread storage (DynamoDB: `ORG#<orgId> | EMAIL_THREAD#<threadId>`):**

```ts
{
  threadId: string,
  orgId: string,
  memberId: string,
  contextType: string,
  contextId: string,
  messages: Array<{
    role: "lira" | "member",
    body: string,
    timestamp: string,
  }>,
  status: "open" | "escalated" | "closed",
  created_at: string,
  updated_at: string,
}
```

#### GPT-4o Reply Decision Prompt

```
You are Lira, an AI assistant embedded in {orgName}'s workspace.
A team member is in an email conversation with you about: {contextType} — "{contextTitle}".

Conversation history:
{threadMessages}   ← full prior back-and-forth for this thread

Context from original email:
{meetingSummary or taskDetails}

Relevant org knowledge (from knowledge base):
{qdrantSearchResults}  ← top-k vector search on their latest message

Their latest message:
{inboundEmailBody}

Decision rules:
1. If you can answer confidently from the context → write a direct, concise reply.
   Sign off as "Lira · {orgName}". Set Reply-To with a new token for the next reply.
2. If the reply requires internal decisions, approvals, or data you don't have →
   respond: "Thanks for your message. I’ve flagged this for {adminName} who will
   follow up shortly." Then set action: "escalate".
3. NEVER fabricate org-specific information. NEVER invent decisions or data.

Output JSON: { action: "reply" | "escalate", draft?: string }
```

#### Escalation Flow

When GPT-4o returns `action: "escalate"`:

1. Send canned reply to the original sender (immediate acknowledgement).
2. Create a DynamoDB notification record for the org admin.
3. Forward the full thread (original email + all replies + context summary) to the org admin's email.
4. Mark thread `status: "escalated"` in DynamoDB.
5. Admin replies directly from their own email client — Lira is out of the loop from that point.

#### Implementation Steps

| #   | Step                         | Details                                                                                                                                                                                                     |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **SES domain verification**  | Verify `liraintelligence.com` in AWS SES. Create receipt rule set: match `reply+*@liraintelligence.com` → store to S3 bucket + publish to SNS                                                               |
| 2   | **MX record**                | Add MX record on `reply` subdomain: `reply.liraintelligence.com → inbound-smtp.us-east-1.amazonaws.com` (Namecheap)                                                                                         |
| 3   | **S3 bucket**                | Create `lira-inbound-email` S3 bucket. SES receipt rule writes raw MIME email here.                                                                                                                         |
| 4   | **Inbound Fastify endpoint** | `POST /lira/v1/email/inbound` — validate SNS message signature, fetch raw email from S3, parse MIME (use `mailparser` npm package), strip quoted original, decode JWT                                       |
| 5   | **Reply engine service**     | `lira-email-reply.service.ts` — load thread history from DynamoDB, fetch context (meeting/task), run Qdrant search on reply body, call GPT-4o, execute reply or escalation                                  |
| 6   | **Thread storage**           | `EMAIL_THREAD#<threadId>` records in DynamoDB. Append each inbound + outbound message.                                                                                                                      |
| 7   | **JWT token generation**     | `generateReplyToken(orgId, memberId, contextType, contextId, threadId)` in email service. Called in `sendMeetingSummary()`, `sendTaskAssignment()`, `sendMeetingInvite()` and in every outbound Lira reply. |
| 8   | **Escalation notifications** | On escalate: send canned Resend reply + DynamoDB admin notification + forward full thread to admin email                                                                                                    |

---

## 6. Unified Integration Architecture

All three pillars share a common pattern:

```
                    ┌──────────────────────┐
                    │   MEETING ENDS       │
                    │   (bot-manager.ts)   │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │  POST-MEETING        │
                    │  PIPELINE            │
                    │  • Extract tasks     │
                    │  • Generate summary  │
                    │  • Detect schedule   │
                    │    intents (NEW)     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
   ┌──────────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
   │  TASK SYNC      │ │  EMAIL      │ │  MEETING      │
   │  ADAPTER        │ │  SERVICE    │ │  SCHEDULER    │
   │  (Linear/Jira)  │ │  (Resend)   │ │  (EventBridge)│
   └──────────┬──────┘ └──────┬──────┘ └───────┬───────┘
              │                │                │
   ┌──────────▼──────┐ ┌──────▼──────┐ ┌───────▼───────┐
   │  Linear API     │ │  Resend API │ │  Google Cal   │
   │  (GraphQL)      │ │  (REST)     │ │  API (future) │
   └─────────────────┘ └─────────────┘ └───────────────┘
```

**New Backend Files:**

```
src/services/
  lira-integration.service.ts      # Integration connection CRUD, token refresh
  lira-email.service.ts            # Resend wrapper
  lira-schedule.service.ts         # Meeting scheduling logic
  integrations/
    adapter.interface.ts           # TaskPlatformAdapter interface
    linear.adapter.ts              # Linear implementation
    jira.adapter.ts                # Jira implementation (Phase 2)

src/routes/
  lira-integration.routes.ts       # OAuth callbacks, connection management
  lira-schedule.routes.ts          # Scheduled meeting CRUD
  lira-webhook-external.routes.ts  # Inbound webhooks from Linear/Jira
```

**New npm Dependencies:**

```
@linear/sdk        # Linear TypeScript SDK
resend             # Resend email SDK
chrono-node        # Natural language date parsing (verify TS5.x compat;
                   #   fallback: @the-brane/chrono or custom Temporal wrapper)
```

---

## 7. DynamoDB Schema Additions

New record types in `lira-organizations` table:

| PK                            | SK                        | Purpose                                                                                                             |
| ----------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ORG#<orgId>`                 | `EMAIL_CONFIG`            | Email mode (platform/custom), custom domain, Resend domain ID, DNS records, verification status, notification prefs |
| `ORG#<orgId>`                 | `EMAIL_THREAD#<threadId>` | Inbound reply conversation thread — full message history, status (open/escalated/closed)                            |
| `ORG#<orgId>`                 | `INTEGRATION#linear`      | Linear OAuth connection (encrypted tokens + KMS DEK)                                                                |
| `ORG#<orgId>`                 | `INTEGRATION#jira`        | Jira OAuth connection (encrypted tokens + KMS DEK)                                                                  |
| `ORG#<orgId>`                 | `SCHED_MTG#<schedId>`     | Scheduled meeting record                                                                                            |
| `ORG#<orgId>`                 | `TASK_MAP#<taskId>`       | Task ↔ external issue mapping (**cleaned up on task deletion and integration disconnect**)                          |
| `ORG#<orgId>`                 | `MEMBER_MAP#<userId>`     | Member ↔ external user mapping (status: resolved/unresolved)                                                        |
| `WEBHOOK#<linearWorkspaceId>` | `CONFIG`                  | Global Linear webhook signing secret + webhook ID (shared across Lira orgs in same workspace)                       |
| `IDEMPOTENCY#<deliveryUUID>`  | `—`                       | Webhook idempotency record (24h TTL)                                                                                |

**Token encryption: KMS Envelope Encryption** (decided — see §3.3 for full details):

- Per-org data encryption key (DEK) generated via `KMS.generateDataKey()`.
- Tokens encrypted with AES-256-GCM using the plaintext DEK; KMS-encrypted DEK stored alongside.
- `KMS.decrypt()` called on read to recover plaintext DEK.
- Automatic key rotation via KMS CMK. Per-org key isolation. Full CloudTrail audit.
- Enterprise offboarding: disable an org's DEK to make tokens permanently inaccessible.

---

## 8. Implementation Roadmap

### Phase 1: Email via Resend (Lowest friction, highest immediate value)

**Why first:** No OAuth complexity, no webhook setup, no two-way sync. Just `POST /emails`. And it unlocks meeting summaries, task assignment notifications, and meeting invites — immediate value for every user.

**Status: Implementation-ready.** No blocking decisions remain.

1. Platform domain verification (`liraintelligence.com`) + DNS records on Namecheap (DKIM, SPF, DMARC, MX on `reply` subdomain)
2. Install `resend`, write `lira-email.service.ts` — resolves `from` from `EMAIL_CONFIG`, generates reply JWT
3. **Unsubscribe infrastructure from day one** — Resend Audiences, functional unsubscribe link in all emails (CAN-SPAM / GDPR)
4. Per-org custom domain flow — Resend domain API (`POST /email/domain`), verification polling, `EMAIL_CONFIG` DynamoDB record
5. Frontend email settings: platform default vs custom domain wizard (DNS records display + copy buttons + verification badge)
6. Hook into `notifyTasksCreated()` and `notifyMeetingEnded()`
7. `EMAIL_THREAD` DynamoDB records + routes
8. **Inbound reply system** — AWS SES setup, S3 bucket, `POST /email/inbound` endpoint, `lira-email-reply.service.ts`, GPT-4o reply engine, thread storage, escalation flow

### Phase 2: Linear Integration (Core differentiator)

**Pre-implementation decisions (now resolved):**

- Token encryption: KMS envelope encryption with per-org DEK (§3.3)
- Webhook architecture: Global endpoint routing by `organizationId` (§3.3)
- Member mapping fallback: Create unassigned + comment (§3.4)

**Status: Implementation-ready.** All blocking decisions resolved in this review.

1. Register Linear OAuth app
2. Integration connection model + KMS encryption
3. OAuth flow endpoints
4. Linear adapter (`@linear/sdk`)
5. Outbound sync: tasks → Linear issues
6. Inbound webhook: global endpoint with rate limiting, idempotency, async processing
7. Frontend: Connect Linear page, team selection, member mapping, unresolved member alerts
8. Two-way status sync + deleted issue handling (404 → clear mapping)
9. Task/mapping cleanup on disconnect

### Phase 3: Auto-Meeting Scheduling

**Pre-implementation decisions (now resolved):**

- Confirmation flow: Propose-first, not auto-create (§4.2)
- Timezone handling: Required param in `parseScheduleDate()` (§4.2)
- Meeting link: Required for auto-join, optional for proposal (§4.2)

**Status: Implementation-ready** after verifying chrono-node TS5.x compatibility.

1. Verify chrono-node TypeScript 5.x compatibility (fallback: `@the-brane/chrono`)
2. Extend GPT-4o prompt for `schedule_meeting` extraction with confidence scoring
3. Build `parseScheduleDate(text, referenceDate, timezone)` utility
4. ScheduledMeeting model + service (propose-first flow)
5. Email invites (uses Phase 1 email service)
6. Auto-join timer: gated on `meeting_link` presence (node-cron MVP → EventBridge production)
7. Frontend: Scheduled meetings page with confirm/edit/cancel + required meeting link field
8. Google Calendar API integration (optional, requires separate OAuth)

### Phase 4: Jira Integration (Enterprise demand)

1. Register Atlassian OAuth app
2. Jira adapter implementing same `TaskPlatformAdapter` interface
3. Handle ADF format for descriptions
4. CloudId routing for API calls
5. Frontend: Connect Jira page

---

## 9. What Will Work / What Won't

### Will Work Well

| Feature                              | Why                                                                                                            |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Post-meeting task → Linear issue** | Lira already extracts high-quality tasks. Linear's `issueCreate` mutation is trivial. One-to-one mapping.      |
| **Email summaries via Resend**       | Dead simple API. Members already have emails in TenantUser. Templates handle formatting.                       |
| **Two-way status sync**              | Linear webhooks are reliable (HMAC signed, retries). Lira task status maps cleanly to Linear workflow states.  |
| **Meeting schedule detection**       | GPT-4o handles "we should meet on Saturday" extraction well in post-processing. Full transcript context helps. |
| **Auto-join scheduled meetings**     | Bot manager already deploys to URLs. Adding a timer is straightforward.                                        |

### Won't Work Well (Avoid These)

| Feature                                              | Why                                                                                                                                                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Real-time in-meeting task creation to Linear**     | Audio transcription has lag and corrections. Creating issues from half-sentences leads to garbage. Post-meeting extraction is far more reliable.                                                  |
| **Real-time scheduling during meeting**              | "We should meet" in audio might be hypothetical, not a commitment. Post-meeting extraction with confidence scoring is safer.                                                                      |
| **Bi-directional comment sync (Linear ↔ Lira)**      | Too noisy. Comments on Linear issues don't map cleanly to Lira's meeting context. Sync status, not conversations.                                                                                 |
| **Auto-assigning Linear issues to external members** | If the Lira member isn't in the Linear workspace, assignment fails. Need member mapping first.                                                                                                    |
| **ClickUp as primary integration**                   | No TypeScript SDK, less reliable webhooks, smaller developer ecosystem. Only invest if customers demand it.                                                                                       |
| **Google Calendar without user consent**             | Can't create events on someone's personal calendar without their OAuth consent. Service account only works for org-owned calendars. For V1, email invites are safer than forced calendar entries. |

### Edge Cases to Handle

| Edge Case                                                     | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Task assigned to "the front-end team"** (group, not person) | Create task unassigned in Linear, add a comment noting the intended group. Flag for manual assignment.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **"Next Saturday" is ambiguous**                              | Use the meeting's date as reference. **Parse in the org's configured timezone** (not server timezone). If confidence < high, create as "proposed" and require confirmation — do not auto-schedule.                                                                                                                                                                                                                                                                                                                                                                        |
| **Linear token expires**                                      | Linear OAuth tokens last 24h with refresh. Add token refresh middleware to adapter. Retry once on 401.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Duplicate task sync**                                       | Store `external_id` on TaskRecord. Before creating, check if mapping exists. Idempotency via task_id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Org disconnects Linear mid-sync**                           | Check `sync_enabled` before every outbound push. Queue failures for retry, don't crash. Batch-delete all TASK_MAP and MEMBER_MAP records on disconnect.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Linear issue deleted externally**                           | Adapter's `updateIssue()` handles 404 by clearing `external_id` from TaskRecord and deleting the TASK_MAP record. Lira task is preserved.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Webhook replay / duplicates**                               | Use `Linear-Delivery` header as idempotency key. Store processed UUIDs in DynamoDB with 24h TTL. Return 200 on duplicate.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **No meeting link for scheduled meeting**                     | Auto-join is only attempted if `meeting_link` is present. UI makes it a required field on confirmation. Email invite sent with "Meeting link TBD" placeholder if absent. **Upgrade path:** multi-platform support is a V2 feature (not a paid-tier gate). The connection model already supports multiple `INTEGRATION#<provider>` records per org. V2 adds a `priority` field to controls which platform gets synced first, and the task sync hook iterates all active connections instead of stopping at the first. No schema migration needed — just application logic. |

---

## 10. Open Questions

### Resolved (this review)

1. ~~**Custom domain for email?**~~ **Decision: Both modes available to all orgs.** Platform default (`lira@liraintelligence.com`) works with zero config. Custom org domain is self-serve via Resend domain management API — no pricing tier gate. See §5.2 for full two-mode architecture and per-org `EMAIL_CONFIG` model.

2. ~~**Scheduling confirmation flow?**~~ **Decision: Propose-first.** Auto-creating calendar events and deploying bots based on conversational intent will produce false positives ("we should really get together sometime" → bot deployed to a nonexistent meeting). The confidence score in the extraction schema exists for exactly this reason. Low/medium confidence → propose only. High confidence → propose with auto-confirm after 24h of no response.

3. ~~**Member mapping granularity?**~~ **Decision: Hybrid — auto by email, manual override.** See §3.4 for the explicit fallback behavior when email match fails (create unassigned, comment, flag as unresolved).

4. ~~**Encryption key management?**~~ **Decision: AWS KMS envelope encryption.** KMS provides automatic key rotation, CloudTrail audit logs of every decrypt operation per org, and the ability to revoke access to a specific org's tokens by disabling their data key. This matters for enterprise offboarding. See §3.3 for full implementation details.

### Still Open

2. **Google Calendar integration scope?** Full Calendar API requires significant OAuth work. For V1, email invites (with .ics attachment) may suffice without needing Google Calendar API.

3. **Rate limit handling?** Linear allows ~1500 complexity points/min. A large meeting with 20 tasks could hit limits if synced simultaneously. Solution: sequential sync with small delays between `issueCreate` mutations.

4. **Org timezone storage?** The scheduling pipeline requires the org's timezone for date parsing. Where should this be stored — org profile (`PROFILE` record) or a new setting? Currently org profile has `company_name`, `industry`, etc. Adding `timezone` to the org profile is the natural location. Needs a UI field in org settings + a sensible default (auto-detect from meeting creator's browser).

---

## Appendix A — Quick Reference: API Endpoints Needed

### Linear GraphQL Mutations (Task Sync)

```graphql
# Create issue
mutation {
  issueCreate(
    input: {
      title: "Task title"
      description: "Task description in markdown"
      teamId: "team-uuid"
      priority: 2 # 0=none, 1=urgent, 2=high, 3=medium, 4=low
      assigneeId: "user-uuid"
    }
  ) {
    success
    issue {
      id
      identifier
      title
      url
    }
  }
}

# Update issue status
mutation {
  issueUpdate(id: "issue-id", input: { stateId: "done-state-uuid" }) {
    success
  }
}
```

### Resend Email (Node.js)

```ts
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)

await resend.emails.send({
  from: 'Lira AI <lira@liraintelligence.com>',
  to: ['alice@company.com'],
  subject: 'Meeting Summary — Sprint Planning',
  html: '<h1>Summary</h1><p>...</p>',
  replyTo: 'noreply@lira.creovine.com',
})
```

### Priority Mapping

| Lira Priority | Linear Priority | Jira Priority |
| ------------- | --------------- | ------------- |
| `urgent`      | 1 (Urgent)      | Highest       |
| `high`        | 2 (High)        | High          |
| `medium`      | 3 (Medium)      | Medium        |
| `low`         | 4 (Low)         | Low           |

### Status Mapping

| Lira Status   | Linear State Category | Jira Status Category |
| ------------- | --------------------- | -------------------- |
| `pending`     | Backlog               | To Do                |
| `in_progress` | Started               | In Progress          |
| `completed`   | Completed             | Done                 |
| `cancelled`   | Cancelled             | Cancelled            |
