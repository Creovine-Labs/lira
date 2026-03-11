# Lira AI — Frontend Implementation: Organization Context System

> **Last updated:** March 10, 2026
> **Status:** Deployed to https://lira.creovine.com

---

## Revision Notes (March 10, 2026)

Post-review fixes applied to all 8 areas identified in code review:

| #   | Area                                   | Fix                                                                                                                                               |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `useOrgStore` localStorage persistence | Added `clear()` action; called alongside `credentials.clear()` on logout and `lira:auth-expired` — org data no longer persists after session ends |
| 2   | `DocumentsPage` polling resilience     | Polling now stops after 3 consecutive fetch errors and shows a **Connection lost** banner instead of silently hammering a down server             |
| 3   | `OrgMembership` type                   | Added optional `name?` and `email?`; `OrgMembersPage` now shows name/email as primary identifier, falling back to `user_id`                       |
| 4   | KB max pages cap                       | Input capped at 50 (matching backend crawl limit); value clamped on change — no more silent 50-cap discrepancy                                    |
| 5   | Webhooks test button                   | **Send Test** button added, wired to `POST /webhooks/test`; disabled when no Slack URL configured                                                 |
| 6   | Invite code validation                 | Min-length check (8 chars, full `LRA-XXXX` format) before firing validation API — prevents 404 errors on partial input                            |
| 7   | Empty-org state message                | Changed from "No organization found" to "You are not currently a member of any organization"                                                      |
| 8   | `executeTask` UX clarity               | "AI is generating — this may take a few seconds" subtitle shown while executing; clarifies it is a synchronous POST, not a stream                 |

**New Features (March 10, 2026):**

| #   | Feature                            | Implementation                                                                                                                                                                                   |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9   | Industry dropdown in OrgSettings   | Replaced text input with dropdown of 18 common industries + "Other" option; strict equality matching preserves exact stored values, edge cases fall through to "Other" + custom input            |
| 10  | Multi-website with AI descriptions | Replaced single website field with list manager; "Add" button fetches URL content and uses GPT-4o-mini to auto-generate descriptions; legacy `website` field preserved for KB page compatibility |
| 11  | Backend SSRF protection            | Enhanced `POST /:orgId/describe-url` with DNS resolution and IP filtering — blocks RFC 1918, loopback, link-local (AWS metadata), and EC2-specific endpoints                                     |
| 12  | OnboardingPage industry + websites | Applied same industry dropdown and multi-website manager to the create-org flow; uses JWT-only `POST /lira/v1/orgs/describe-url` endpoint (no org ID required)                                   |

---

## Table of Contents

1. [Routing](#1-routing)
2. [Layout Shell — OrgLayout](#2-layout-shell--orglayout)
3. [State Management](#3-state-management)
4. [API Service Layer](#4-api-service-layer)
5. [Pages](#5-pages)
   - 5.1 [OnboardingPage](#51-onboardingpage--onboarding)
   - 5.2 [OrgSettingsPage](#52-orgsettingspage--orgsettings)
   - 5.3 [KnowledgeBasePage](#53-knowledgebasepage--orgknowledge)
   - 5.4 [DocumentsPage](#54-documentspage--orgdocuments)
   - 5.5 [OrgMembersPage](#55-orgmemberspage--orgmembers)
   - 5.6 [TasksPage](#56-taskspage--orgtasks)
   - 5.7 [OrgTaskDetailPage](#57-orgtaskdetailpage--orgtaskstaskid)
   - 5.8 [WebhooksPage](#58-webhookspage--orgwebhooks)
6. [Auth & Error Handling](#6-auth--error-handling)

---

## 1. Routing

Defined in `src/app/router/index.ts`. All `/org/*` routes are nested under `OrgLayout`.

| Route                | Page                | Description                                        |
| -------------------- | ------------------- | -------------------------------------------------- |
| `/onboarding`        | `OnboardingPage`    | Create or join an organization                     |
| `/org/settings`      | `OrgSettingsPage`   | Profile, culture, products, terminology            |
| `/org/knowledge`     | `KnowledgeBasePage` | Crawl website, view & delete KB entries            |
| `/org/documents`     | `DocumentsPage`     | Upload, list, reprocess, download docs             |
| `/org/tasks`         | `TasksPage`         | Task list with filters and create form             |
| `/org/tasks/:taskId` | `OrgTaskDetailPage` | Task detail, edit, AI execution                    |
| `/org/members`       | `OrgMembersPage`    | Member management, invite code, ownership transfer |
| `/org/webhooks`      | `WebhooksPage`      | Webhook URL and event subscriptions                |

Wired in `src/App.tsx`:

```tsx
<Route path="/onboarding" element={<OnboardingPage />} />
<Route path="/org" element={<OrgLayout />}>
  <Route path="settings"         element={<OrgSettingsPage />} />
  <Route path="knowledge"        element={<KnowledgeBasePage />} />
  <Route path="documents"        element={<DocumentsPage />} />
  <Route path="tasks"            element={<TasksPage />} />
  <Route path="tasks/:taskId"    element={<OrgTaskDetailPage />} />
  <Route path="members"          element={<OrgMembersPage />} />
  <Route path="webhooks"         element={<WebhooksPage />} />
</Route>
```

---

## 2. Layout Shell — OrgLayout

**File:** `src/components/org/OrgLayout.tsx`

- **Top bar**: Home back-button, Lira logo, org switcher dropdown (visible when user has multiple orgs)
- **Sidebar nav**: Settings · Knowledge Base · Documents · Tasks · Members · Webhooks (with icons)
- **On mount**: calls `listOrganizations()`, populates `useOrgStore`, auto-selects first org
- **Guard states**:
  - Not authenticated → "Please sign in" message
  - No organizations → "No organization found" + button to `/onboarding`

---

## 3. State Management

**File:** `src/app/store/index.ts`

### `useOrgStore` — persisted to `localStorage` (`lira-org`)

```typescript
interface OrgSlice {
  currentOrgId: string | null
  organizations: Organization[]

  setCurrentOrg(orgId: string | null): void
  setOrganizations(orgs: Organization[]): void // auto-sets currentOrgId to first if current is gone
  addOrganization(org: Organization): void // sets currentOrgId if none selected
  removeOrganization(orgId: string): void // switches currentOrgId to next available
  updateOrganization(orgId: string, updates: Partial<Organization>): void
  clear(): void // resets to empty — called on logout and auth-expiry
}
```

### `useKBStore`

```typescript
interface KBSlice {
  entries: KBEntry[]
  crawlStatus: CrawlStatus | null
  loading: boolean

  setEntries(entries: KBEntry[]): void
  setCrawlStatus(status: CrawlStatus | null): void
  setLoading(v: boolean): void
  removeEntry(id: string): void
  clear(): void
}
```

### `useDocumentStore`

```typescript
interface DocumentSlice {
  documents: DocumentRecord[]
  loading: boolean

  setDocuments(docs: DocumentRecord[]): void
  addDocument(doc: DocumentRecord): void
  removeDocument(docId: string): void
  updateDocument(docId: string, updates: Partial<DocumentRecord>): void
  setLoading(v: boolean): void
  clear(): void
}
```

### `useTaskStore`

```typescript
interface TaskSlice {
  tasks: TaskRecord[]
  loading: boolean
  statusFilter: string | null

  setTasks(tasks: TaskRecord[]): void
  addTask(task: TaskRecord): void
  removeTask(taskId: string): void
  updateTask(taskId: string, updates: Partial<TaskRecord>): void
  setLoading(v: boolean): void
  setStatusFilter(status: string | null): void
  clear(): void
}
```

---

## 4. API Service Layer

**File:** `src/services/api/index.ts`

### Types

| Type                  | Description                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Organization`        | Org record with `org_id`, `name`, `invite_code`, `profile`                                                                                            |
| `OrganizationProfile` | Nested profile: `company_name`, `industry`, `website`, `websites`, `size`, `description`, `custom_instructions`, `culture`, `products`, `terminology` |
| `OrgCulture`          | `communication_style`, `meeting_norms`, `values: string[]`                                                                                            |
| `OrgProduct`          | `name`, `description`                                                                                                                                 |
| `OrgTerminology`      | `term`, `definition`                                                                                                                                  |
| `OrgWebsite`          | `url`, `description?` — for multi-website manager                                                                                                     |
| `OrgMembership`       | `org_id`, `user_id`, `role` (`owner`/`admin`/`member`), `joined_at`, `name?`, `email?`                                                                |
| `KBEntry`             | `id`, `org_id`, `url`, `title`, `category`, `word_count`, `crawled_at`                                                                                |
| `CrawlStatus`         | `status` (`crawling`/`completed`/`failed`), `pages_crawled`, `error?`                                                                                 |
| `DocumentRecord`      | `doc_id`, `org_id`, `filename`, `size_bytes`, `status` (`uploaded`/`processing`/`indexed`/`failed`), `uploaded_at`                                    |
| `TaskRecord`          | `task_id`, `org_id`, `title`, `type`, `status`, `priority`, `description`, `due_date`, `execution_status`, `execution_result`                         |
| `TaskType`            | `action_item` · `draft_document` · `follow_up_email` · `research` · `summary` · `decision`                                                            |
| `TaskStatus`          | `pending` · `in_progress` · `completed` · `cancelled`                                                                                                 |
| `TaskPriority`        | `low` · `medium` · `high` · `urgent`                                                                                                                  |
| `WebhookConfig`       | `url`, `events: WebhookEvent[]`                                                                                                                       |
| `WebhookEvent`        | `task_created` · `task_completed` · `meeting_ended` · `summary_ready`                                                                                 |

### Org CRUD

```typescript
createOrganization(name, profile?)         // POST  /lira/v1/orgs
listOrganizations()                        // GET   /lira/v1/orgs
getOrganization(orgId)                     // GET   /lira/v1/orgs/:id
updateOrganization(orgId, data)            // PUT   /lira/v1/orgs/:id
deleteOrganization(orgId)                  // DELETE /lira/v1/orgs/:id
```

### Membership

```typescript
joinOrganization(inviteCode) // POST  /lira/v1/orgs/join
leaveOrganization(orgId) // POST  /lira/v1/orgs/:id/leave
listOrgMembers(orgId) // GET   /lira/v1/orgs/:id/members
updateMemberRole(orgId, userId, role) // PUT   /lira/v1/orgs/:id/members/:userId
removeMember(orgId, userId) // DELETE /lira/v1/orgs/:id/members/:userId
transferOwnership(orgId, newOwnerId) // POST  /lira/v1/orgs/:id/transfer-ownership
regenerateInviteCode(orgId) // POST  /lira/v1/orgs/:id/regenerate-invite
validateInviteCode(code) // GET   /lira/v1/orgs/validate-invite/:code
describeUrl(orgId, url) // POST  /lira/v1/orgs/:id/describe-url
describeUrlPublic(url) // POST  /lira/v1/orgs/describe-url  (no org, JWT only)
```

### Knowledge Base

```typescript
triggerCrawl(orgId, url, { max_pages }) // POST  /lira/v1/orgs/:id/crawl
getCrawlStatus(orgId) // GET   /lira/v1/orgs/:id/crawl/status
listKBEntries(orgId) // GET   /lira/v1/orgs/:id/knowledge-base
deleteKBEntry(orgId, entryId) // DELETE /lira/v1/orgs/:id/knowledge-base/:entryId
clearKnowledgeBase(orgId) // DELETE /lira/v1/orgs/:id/knowledge-base
```

### Documents

```typescript
uploadDocument(orgId, file) // POST  /lira/v1/orgs/:id/documents  (multipart)
listDocuments(orgId) // GET   /lira/v1/orgs/:id/documents
getDocument(orgId, docId) // GET   /lira/v1/orgs/:id/documents/:docId
getDocumentDownloadUrl(orgId, docId) // GET   /lira/v1/orgs/:id/documents/:docId/download-url
deleteDocument(orgId, docId) // DELETE /lira/v1/orgs/:id/documents/:docId
reprocessDocument(orgId, docId) // POST  /lira/v1/orgs/:id/documents/:docId/reprocess
```

### Tasks

```typescript
createTask(orgId, input)                  // POST  /lira/v1/orgs/:id/tasks
listTasks(orgId, filters?)                // GET   /lira/v1/orgs/:id/tasks
getTask(orgId, taskId)                    // GET   /lira/v1/orgs/:id/tasks/:taskId
updateTask(orgId, taskId, data)           // PUT   /lira/v1/orgs/:id/tasks/:taskId
deleteTask(orgId, taskId)                 // DELETE /lira/v1/orgs/:id/tasks/:taskId
executeTask(orgId, taskId)                // POST  /lira/v1/orgs/:id/tasks/:taskId/execute
getTaskResult(orgId, taskId)              // GET   /lira/v1/orgs/:id/tasks/:taskId/result
```

### Webhooks

```typescript
getWebhookConfig(orgId) // GET  /lira/v1/orgs/:id/webhooks
updateWebhookConfig(orgId, config) // PUT  /lira/v1/orgs/:id/webhooks
testWebhook(orgId) // POST /lira/v1/orgs/:id/webhooks/test
```

---

## 5. Pages

### 5.1 OnboardingPage (`/onboarding`)

**File:** `src/pages/OnboardingPage.tsx`

Two tabs: **Create** and **Join**.

**Create tab:**

- Fields: org name (required), **industry dropdown** (same 18 options + "Other" as OrgSettingsPage), **multi-website manager** with AI auto-description, description
- Industry dropdown: strict equality matching, "Other" reveals custom text input
- Multi-website: "Add" button fetches URL via `POST /lira/v1/orgs/describe-url` (JWT-only, no org required) and auto-generates a description using GPT-4o-mini
- Each added website shows URL + editable description + remove button
- On create: saves `websites` array, legacy `website` field set to first URL (or empty), resolves industry from dropdown/custom
- Calls `createOrganization` → adds to store → navigates to `/org/settings`

**Join tab:**

- Invite code input (auto-uppercased)
- `validateInviteCode` on blur — minimum 8-character check (`LRA-XXXX` format) before firing to prevent premature 404 errors mid-entry; shows org name preview on success
- `joinOrganization` → adds to store → navigates to `/org/settings`

---

### 5.2 OrgSettingsPage (`/org/settings`)

**File:** `src/pages/OrgSettingsPage.tsx`

Five collapsible sections, all saved in a single `updateOrganization` call:

| Section                 | Fields                                                                                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Basic Information       | Org name, company name, **industry dropdown** (18 options + "Other"), company size (dropdown: 1–10 / 11–50 / 51–200 / 201–500 / 500–1000 / 1000+), description, **multi-website manager** |
| Meeting AI Instructions | `custom_instructions` textarea — team preferences injected into Lira's meeting context                                                                                                    |
| Culture & Communication | Communication style, meeting norms, company values (chip list with add/remove)                                                                                                            |
| Products & Services     | Add/remove product cards (name + description)                                                                                                                                             |
| Glossary / Terminology  | Add/remove term cards (term + definition)                                                                                                                                                 |

**Industry Dropdown:**

- 18 predefined options: Technology, Healthcare, Finance & Banking, Education, Retail & E-commerce, Manufacturing, Real Estate, Legal, Marketing & Advertising, Consulting, Media & Entertainment, Transportation & Logistics, Food & Beverage, Non-profit, Government, Energy, Telecommunications, Other
- Strict equality matching: if stored value exactly matches a dropdown option, that option is selected
- Edge cases (e.g., "Fintech", "SaaS") fall through to "Other" + custom text input
- "Other" selection reveals a custom text field for freeform industry description

**Multi-Website Manager:**

- Replaces single URL input with a dynamic list of websites
- Each entry: URL display + editable description textarea + remove button
- "Add" row: URL input + "Add" button (or Enter key)
- On "Add": calls `POST /:orgId/describe-url` → backend fetches page content + GPT-4o-mini auto-generates 1–2 sentence description
- If AI description fails, URL is still added (without description) with explanatory toast
- Migration logic: existing single `website` field seeds the websites array on load
- Legacy compatibility: `websites[0].url` is written back to `profile.website` field for Knowledge Base page
- Empty websites array: legacy `website` field is saved as empty string (not undefined)

On save: calls `updateOrganization`, updates `useOrgStore` cache, shows success toast.

---

### 5.3 KnowledgeBasePage (`/org/knowledge`)

**File:** `src/pages/KnowledgeBasePage.tsx`

**On load:**

- `listKBEntries` + `getOrganization` (pre-fills crawl URL from `org.profile.website`)

**Crawl form:**

- URL input
- Max pages number input (1–50, default 20; capped at backend crawl limit)
- Crawl button → calls `triggerCrawl` → starts 3-second polling of `getCrawlStatus`
- Status banner shows `pages_crawled` counter while crawling; toast on complete/fail

**Entry list:**

- URL, category badge (color-coded), word count, crawled date, delete button
- Category colors: `about` → blue, `product` → violet, `docs` → emerald, `blog` → amber, `other` → slate

**Clear All** button with `window.confirm` guard → calls `clearKnowledgeBase`.

---

### 5.4 DocumentsPage (`/org/documents`)

**File:** `src/pages/DocumentsPage.tsx`

**Upload:**

- Full-width drag-and-drop zone + hidden `<input>` for click-to-browse
- Accepted: `.pdf .docx .doc .txt .md .csv .xlsx`
- Uploads files individually in a loop, counts successes, toasts per-file failure

**Status badges with icons:**

| Status       | Icon               | Color   |
| ------------ | ------------------ | ------- |
| `uploaded`   | Clock              | amber   |
| `processing` | Loader2 (spinning) | blue    |
| `indexed`    | CheckCircle2       | emerald |
| `failed`     | AlertCircle        | red     |

**Auto-polling:** every 5 seconds while any doc has `processing` or `uploaded` status. Tracks consecutive fetch errors via a ref counter — after 3 consecutive failures the interval is cleared and a **Connection lost** banner is shown instead of silently hammering a down server. Counter resets on successful load.

**Per-row actions:**

- Download → calls `getDocumentDownloadUrl` → opens presigned URL in new tab
- Reprocess button (failed docs only) → calls `reprocessDocument`
- Delete → calls `deleteDocument`

File size formatted with `formatBytes` helper (B / KB / MB).

---

### 5.5 OrgMembersPage (`/org/members`)

**File:** `src/pages/OrgMembersPage.tsx`

**Invite Code section:**

- Displays code in monospace font
- Copy-to-clipboard button
- Regenerate button (owner/admin only) → calls `regenerateInviteCode`

**Members list:**

Each row shows: initials avatar, display name (prefers `name` → `email` → `user_id`) with "(you)" label, secondary line showing email or user_id when name is available, join date, role badge.

| Role     | Badge style               |
| -------- | ------------------------- |
| `owner`  | amber · Crown icon        |
| `admin`  | violet · ShieldCheck icon |
| `member` | slate · Shield icon       |

**Actions** (shown for owner/admin on other non-owner members):

- Role dropdown (`member` ↔ `admin`) → calls `updateMemberRole`
- Remove button (red hover) → calls `removeMember`
- **Transfer ownership button** (amber `↔` icon) — visible to owner only

**Transfer Ownership modal:**

- Confirms target user ID
- Warning: "You will be demoted to admin. This cannot be undone without their cooperation."
- Cancel / Transfer buttons with loading spinner
- On success: reloads member list, dismisses modal, success toast
- On 409 (concurrent transfer race): error toast with backend message

---

### 5.6 TasksPage (`/org/tasks`)

**File:** `src/pages/TasksPage.tsx`

- Lists all tasks for the current org
- **Status colors:** `pending` → amber, `in_progress` → blue, `completed` → emerald, `cancelled` → slate
- **Priority badges:** `low` → slate, `medium` → blue, `high` → amber, `urgent` → red
- **Task type labels:** Action Item, Draft Document, Follow-up Email, Research, Summary, Decision
- Click a task row → navigates to `/org/tasks/:taskId`
- **Create Task** form: title, type, priority, due date, description → calls `createTask`

---

### 5.7 OrgTaskDetailPage (`/org/tasks/:taskId`)

**File:** `src/pages/OrgTaskDetailPage.tsx`

- Loads task via `getTask`
- **Editable fields:** status dropdown (updates immediately via `updateTask`)
- **Metadata display:** type label, priority badge, due date, description
- **Execute with AI** (`Zap` icon) → calls `executeTask` (synchronous POST — waits for AI to complete, not a stream) → shows spinner + "AI is generating — this may take a few seconds" while waiting → renders result as Markdown via `ReactMarkdown`
- **Copy result** button for execution output
- **Delete** → calls `deleteTask` → navigates back to `/org/tasks`
- Back navigation arrow to task list

---

### 5.8 WebhooksPage (`/org/webhooks`)

**File:** `src/pages/WebhooksPage.tsx`

- Slack webhook URL input
- Email notifications toggle checkbox
- Checkbox group for event subscriptions:
  - `task_created`
  - `task_completed`
  - `meeting_ended`
  - `summary_ready`
- **Send Test** button (disabled when no Slack URL configured) → calls `testWebhook`, toasts delivery confirmation
- **Save Settings** button → calls `updateWebhookConfig`

---

## 6. Auth & Error Handling

**File:** `src/services/api/index.ts` — `apiFetch` wrapper

```typescript
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T>
```

**Behaviour:**

- Reads Bearer token from `localStorage` (`lira_token`) and injects it into every request
- **401 response** → clears token from localStorage + fires `window.dispatchEvent(new CustomEvent('lira:auth-expired'))` so the app shell can react
- **Non-2xx** → parses JSON body, throws `Error` using `.error` or `.message` field from response
- **Multipart uploads** skip `Content-Type` header so the browser sets the `multipart/form-data` boundary automatically

**`AuthExpiryGuard`** (`src/App.tsx`) listens for `lira:auth-expired` and calls:

1. `credentials.clear()` — removes JWT from localStorage
2. `clearCredentials()` — clears auth store
3. `useOrgStore.clear()` — wipes org data including product names, custom instructions, and terminology from localStorage
4. `navigate('/', { replace: true })`

**Token helpers (`credentials`):**

```typescript
credentials.getToken() // read from localStorage
credentials.set(token) // write to localStorage
credentials.clear() // remove from localStorage
credentials.isConfigured() // boolean check
```
