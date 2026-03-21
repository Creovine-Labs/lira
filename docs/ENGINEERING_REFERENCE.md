# Lira AI — Engineering Reference

**Status:** Active Development · March 2026  
**Audience:** AI Engineers, Backend Engineers, Frontend Engineers  
**Purpose:** Authoritative reference on what has been built, how it fits together, and where work remains or can be improved.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Frontend Application](#4-frontend-application)
   - [4.1 Route Map](#41-route-map)
   - [4.2 State Management](#42-state-management-zustand)
   - [4.3 Service Layer](#43-service-layer)
   - [4.4 Feature Modules](#44-feature-modules)
   - [4.5 Component Library](#45-component-library)
   - [4.6 Type System & Runtime Validation](#46-type-system--runtime-validation)
5. [Backend System (API + AWS)](#5-backend-system-api--aws)
   - [5.1 REST API Surface](#51-rest-api-surface)
   - [5.2 WebSocket Protocol](#52-websocket-protocol)
   - [5.3 Organization Context System (7 Phases)](#53-organization-context-system-7-phases)
   - [5.4 AWS Infrastructure](#54-aws-infrastructure)
6. [AI Layer](#6-ai-layer)
   - [6.1 Amazon Nova Sonic (Speech-to-Speech)](#61-amazon-nova-sonic-speech-to-speech)
   - [6.2 GPT-4o (Task Extraction & Evaluation)](#62-gpt-4o-task-extraction--evaluation)
   - [6.3 OpenAI Embeddings (Vector Search)](#63-openai-embeddings-vector-search)
   - [6.4 Qdrant (Vector Store)](#64-qdrant-vector-store)
   - [6.5 Context Injection Pipeline](#65-context-injection-pipeline)
7. [Bot Deployment System](#7-bot-deployment-system)
8. [Interview System](#8-interview-system)
9. [Data Models](#9-data-models)
10. [End-to-End Data Flows](#10-end-to-end-data-flows)
    - [10.1 Voice Meeting Flow](#101-voice-meeting-flow)
    - [10.2 Bot Deploy Flow](#102-bot-deploy-flow)
    - [10.3 Interview Lifecycle Flow](#103-interview-lifecycle-flow)
11. [Build, Testing & Deployment](#11-build-testing--deployment)
12. [Known Gaps & Engineering Opportunities](#12-known-gaps--engineering-opportunities)

---

## 1. Product Overview

Lira AI is a voice-powered AI meeting participant. It is **not** a passive transcription tool — it actively joins meetings, speaks, responds, conducts interviews, extracts tasks, and applies organizational knowledge. The product has three distinct modes of interaction:

| Mode | Description |
|------|-------------|
| **Direct Meeting** | User speaks into browser mic; Lira responds via Nova Sonic speech-to-speech |
| **Bot Deploy** | Lira's bot is injected into a live Google Meet or Zoom via Puppeteer automation |
| **Interview Mode** | Bot conducts a structured AI-driven candidate interview end-to-end |

All three modes share the same backend infrastructure (Nova Sonic, org context pipeline, task engine), but differ in how audio/input enters and exits the system.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React 19)                 │
│  Pages → Features → Hooks → Services → Zustand      │
│           │                      │                   │
│      REST API Client        WS Client                │
└──────────────┬───────────────────┬──────────────────┘
               │ HTTPS             │ WSS
┌──────────────▼───────────────────▼──────────────────┐
│           Backend API (Fastify 4, Node.js 20)        │
│                 https://api.creovine.com              │
│                                                      │
│  /lira/v1/meetings   /lira/v1/orgs   /lira/v1/bots  │
│  /lira/v1/interviews /lira/v1/tasks  /lira/v1/docs   │
│  /lira/v1/ws  (WebSocket upgrade)                    │
└──────────────────────────────┬──────────────────────┘
                               │
         ┌─────────────────────┼────────────────────┐
         │                     │                    │
┌────────▼──────┐   ┌──────────▼──────┐   ┌────────▼──────┐
│ Amazon Nova   │   │  AWS DynamoDB   │   │   AWS S3      │
│ Sonic (STT+   │   │  3 Tables:      │   │  Documents +  │
│ TTS + LLM)    │   │  meetings       │   │  Resume S3    │
│               │   │  connections    │   │  bucket       │
│ Nova Pro/Lite │   │  organizations  │   └───────────────┘
│ (Reasoning)   │   └─────────────────┘
└───────────────┘
         │
┌────────▼──────┐   ┌─────────────────┐
│  OpenAI API   │   │ Qdrant (Docker) │
│  GPT-4o       │   │ EC2 :6333       │
│  text-embed-  │   │ lira_org_embed  │
│  3-small      │   │ (1536 dims)     │
└───────────────┘   └─────────────────┘
         │
┌────────▼──────┐
│ Puppeteer Bot │
│ (Google Meet  │
│  / Zoom       │
│  automation)  │
└───────────────┘
```

**Key insight for engineers:** The frontend is a React SPA deployed to Vercel. The backend is a single Node.js Fastify process running on EC2. There is no microservices split yet — all routes, WebSocket handling, Nova Sonic streaming, Qdrant search, and bot orchestration live in the same `creovine-api` process.

---

## 3. Tech Stack

### Frontend

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.2 |
| Language | TypeScript | 5.9 |
| Build | Vite | 7.3 |
| Routing | React Router DOM | 7.13 |
| State | Zustand (with persist) | 5.0 |
| Styling | Tailwind CSS | 3.4 |
| UI Primitives | Radix UI / Shadcn | latest |
| Forms | React Hook Form + Zod | 7.71 / 4.3 |
| WebSocket | reconnecting-websocket | 4.4 |
| WebRTC | simple-peer | 9.11 |
| Auth | @react-oauth/google | 0.13 |
| Notifications | sonner | 2.0 |
| Icons | Lucide React | latest |
| Date utils | date-fns | 4.1 |
| Monitoring | @sentry/react | 10.39 |
| Testing | Vitest + @testing-library/react | 4.0 |
| E2E | Playwright | 1.58 |
| Deployment | Vercel | — |

### Backend

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | 20+ |
| Framework | Fastify | 4.29.1 |
| Language | TypeScript | 5.3.3 |
| AI (speech) | Amazon Nova Sonic | — |
| AI (reasoning) | GPT-4o | — |
| Embeddings | OpenAI text-embedding-3-small | 1536 dims |
| Vector DB | Qdrant | Docker on EC2 |
| Relational DB | Amazon DynamoDB | — |
| File Storage | Amazon S3 | — |
| Bot Automation | Puppeteer | — |
| Deployment | EC2 t3.small, Ubuntu 22.04 | — |
| Process Manager | systemd (`creovine-api.service`) | — |

---

## 4. Frontend Application

### 4.1 Route Map

Routes are defined as constants in [`src/app/router/index.ts`](../src/app/router/index.ts) and composed in [`src/App.tsx`](../src/App.tsx).

All authenticated routes are wrapped in `AppShell`, which provides the persistent sidebar navigation, org switcher, user menu, and notification badges.

#### Public Routes
| Path | Page | Description |
|------|------|-------------|
| `/` | `HomePage` | Landing page with Google OAuth + email/password login |
| `/onboarding` | `OnboardingPage` | Post-signup org creation wizard |
| `/ui-lab` | `UiLabPage` | Internal component showcase |

#### Authenticated Routes
| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | `DashboardPage` | Activity hub: recent meetings, tasks, quick actions |
| `/settings` | `SettingsPage` | User prefs: AI name, voice, personality, billing |
| `/organizations` | `OrganizationsPage` | Browse and switch orgs |
| `/meeting` | `MeetingPage` | Browser-based voice meeting (direct mic) |
| `/meetings` | `MeetingsPage` | Meeting history + bot deployment panel |
| `/meetings/:id` | `MeetingDetailPage` | Meeting detail: summary, transcript, action items |
| `/org/settings` | `OrgSettingsPage` | Org profile: industry, products, culture, terminology |
| `/org/knowledge` | `KnowledgeBasePage` | Web crawl management + indexed page browser |
| `/org/documents` | `DocumentsPage` | Document upload, status, search |
| `/org/tasks` | `TasksPage` | Task list + create, filter by status/priority |
| `/org/tasks/:taskId` | `OrgTaskDetailPage` | Task detail view |
| `/org/members` | `OrgMembersPage` | Team member roster |
| `/org/members/:userId` | `MemberProfilePage` | Individual member profile |
| `/org/webhooks` | `WebhooksPage` | Slack/email webhook config |
| `/org/roles` | `InterviewsPage` | All interview roles grouped by job title |
| `/org/roles/new` | `InterviewCreatePage` | Create/edit interview, upload resume, generate questions |
| `/org/roles/:roleSlug` | `InterviewRolePage` | Role overview — all candidates for a role |
| `/org/interviews/:id` | `InterviewDetailPage` | Evaluation view: scores, feedback, recording |
| `/org/interviews/:id/edit` | `InterviewCreatePage` | Edit interview settings (same page, different mode) |

---

### 4.2 State Management (Zustand)

All state is defined in [`src/app/store/index.ts`](../src/app/store/index.ts). There are 10 Zustand slices.

#### `useAuthStore` — User identity
```
token: string | null
userId, userEmail, userName, userPicture: string | null
setCredentials(token, email?, name?, picture?, id?)
clearCredentials()
```
- Persisted to `localStorage` key: `lira-auth`
- JWTs are stored here; the API service reads `credentials.getToken()` before every request

#### `useMeetingStore` — Active meeting state
```
meetingId, meetingTitle: string | null
isConnected: boolean
aiStatus: 'idle' | 'listening' | 'thinking' | 'speaking'
transcript: TranscriptLine[]
lastAiResponse: string | null
```
- `addTranscriptLine()` implements deduplication: skips lines with identical text from the same speaker (Nova Sonic can emit duplicate content blocks)
- Hard limit of 200 transcript lines (circular buffer via `.slice(-199)`)

#### `useBotStore` — Deployed bot instance
```
botId, meetingUrl, platform: string | null
botState: 'launching'|'navigating'|'in_lobby'|'joining'|'active'|'leaving'|'terminated'|'error'
error: string | null
deployedAt, lastTerminatedAt: string/number | null
```

#### `useUserPrefsStore` — AI personality + voice
```
aiName: string (default: 'Lira')
voiceId: 'tiffany' | 'ruth' | 'matthew' | 'stephen'
personality: 'supportive' | 'challenger' | 'facilitator' | 'analyst'
```
- Persisted to `lira-user-prefs`

#### `useOrgStore` — Multi-tenant org context
```
currentOrgId: string | null
organizations: Organization[]
```
- Persisted to `lira-org`
- Switching org triggers clearing of `useKBStore`, `useDocumentStore`, `useInterviewStore`, `useTaskStore`

#### `useKBStore` — Knowledge base entries
```
entries: KBEntry[]
crawlStatus: CrawlStatus | null
loading: boolean
```

#### `useDocumentStore` — Uploaded documents
```
documents: DocumentRecord[]
loading: boolean
```

#### `useTaskStore` — Tasks & action items
```
tasks: TaskRecord[]
statusFilter: TaskStatus | null
loading: boolean
```

#### `useInterviewStore` — Interview records
```
interviews: Interview[]
statusFilter: InterviewStatus | null
loading: boolean
```

#### `useNotifStore` — In-app notifications
```
entries: NotificationEntry[]
readTaskNotifIds: string[]
meetingSeenAt: number
interviewSeenAt: number
```
- Drives badge counters in AppShell sidebar

---

### 4.3 Service Layer

#### REST API Client — [`src/services/api/index.ts`](../src/services/api/index.ts) (~500 LOC)

Base fetch wrapper `apiFetch<T>(path, init?)`:
- Reads JWT from `credentials.getToken()`
- Attaches `Authorization: Bearer <token>` header
- On `401`, clears token and dispatches `window.dispatchEvent(new Event('lira:auth-expired'))`
- Returns typed responses; throws on non-OK status

All API calls target `VITE_API_URL` (default: `https://api.creovine.com`).

**Organized API namespaces:**

| Namespace | Methods |
|-----------|---------|
| Auth | `googleLogin`, `login`, `signup` |
| Meetings | `createMeeting`, `listMeetings`, `getMeeting`, `getMeetingSummary`, `updateMeeting`, `updateMeetingSettings`, `deleteMeeting` |
| Bot | `deployBot`, `getBotStatus`, `terminateBot`, `terminateAllBots`, `refreshBotAuth`, `getBotAuthStatus`, `listActiveBots` |
| Organizations | `createOrganization`, `listOrganizations`, `getOrganization`, `updateOrganization`, `listOrgMembers` |
| Knowledge Base | `listKBEntries`, `triggerCrawl`, `getCrawlStatus`, `deleteKBEntry`, `clearKnowledgeBase` |
| Documents | `uploadDocument`, `listDocuments`, `deleteDocument`, `getDocumentDownloadUrl`, `reprocessDocument` |
| Tasks | `listTasks`, `createTask`, `updateTask`, `deleteTask` |
| Interviews | `listInterviews`, `createInterviewRecord`, `getInterviewRecord`, `updateInterviewRecord`, `deleteInterviewRecord`, `uploadInterviewResume`, `draftInterviewRecord`, `generateInterviewQuestions`, `startInterviewSession`, `cancelInterviewSession`, `runInterviewEvaluation`, `recordInterviewDecision`, `getRelatedInterviews` |
| WebSocket helpers | `buildWsUrl`, `createTypedWebSocketClient` |

#### WebSocket Client — [`src/services/websocket/websocket-client.ts`](../src/services/websocket/websocket-client.ts) (~400 LOC)

`TypedWebSocketClient` — production-grade WebSocket implementation:

**Features:**
- Discriminated union Zod schemas for all inbound and outbound messages
- Auto-reconnect with exponential backoff (base 500ms → max 10s, ±10–20% jitter)
- Heartbeat ping every 15s; server must respond with pong within 8s or connection is dropped
- Outbound message queue (max 100) — messages buffered while reconnecting
- Full event emitter API with typed per-event listeners (`onTranscriptDelta`, `onAiStatus`, etc.)
- Optional injectable `webSocketFactory` for unit testing

**Connection State Machine:**
```
idle → connecting → open → retrying → closed
                    ↑______________|  (on disconnect if autoReconnect=true)
```

**Inbound Events (Server → Client):**
```
transcript_delta  { speaker, text, isFinal, at? }
ai_status         { status: idle|listening|thinking|speaking, at? }
ai_response       { text, at? }
error             { code?, message, retryable? }
pong              { at? }
```

**Outbound Events (Client → Server):**
```
join              { meetingId, participantId, role: 'human'|'ai' }
settings_update   { personality?, responseStyle?, interruptionPolicy? }
ping              { at? }
audio_chunk_meta  { chunkId, durationMs, codec?, sampleRate? }
```

#### Audio Service — [`src/services/audio/index.ts`](../src/services/audio/index.ts)
**Status: Stub — empty file.**  
Intended to encapsulate:
- `startCapture()` / `stopCapture()` — `getUserMedia` + PCM 16kHz capture
- `getMicLevel()` — RMS energy for level meter
- `initPlayback()` / `playPcmChunk()` / `flushPlayback()` / `destroyPlayback()` — Web Audio API for AI speech output
- Barge-in detection — mute playback when user starts speaking

Currently this logic lives inline inside `useAudioMeeting`. **This is a refactoring opportunity.**

#### WebRTC Service — [`src/services/webrtc/index.ts`](../src/services/webrtc/index.ts)
**Status: Stub — empty file.**  
`simple-peer` (9.11) is installed but unused. Intended for future peer-to-peer audio bridging or video tile support.

---

### 4.4 Feature Modules

#### Meeting Feature — [`src/features/meeting/use-audio-meeting.ts`](../src/features/meeting/use-audio-meeting.ts) (~300 LOC)

The main hook `useAudioMeeting()` owns the full lifecycle of a browser-based voice meeting:

```
Phase: 'idle' → 'connecting' → 'joined' → 'live' → 'error'
```

**Lifecycle stages:**
1. `startMeeting(title, settings)` → `createMeeting()` REST call → get `session_id`
2. `buildWsUrl()` → construct `wss://...` with JWT in query param
3. `createTypedWebSocketClient()` → wire event handlers
4. `client.connect()` → wait for state `open`
5. `client.sendJoin({ meetingId, participantId, role: 'human' })`
6. `startCapture()` → `getUserMedia({ audio: true })` → 16kHz PCM
7. PCM binary frames → `client.send()` (raw binary over WebSocket)
8. `transcript_delta` events → `addTranscriptLine()` → live transcript UI
9. `ai_status` events → update `aiStatus` for pulsing indicator
10. Inbound binary frames → `playPcmChunk()` → Web Audio API playback
11. `endMeeting()` → `stopCapture()` → `client.disconnect()` → `clearMeeting()`

**Server message protocol (handled by this hook):**
```
joined, transcript, ai_response, ai_response_end, interruption,
audio_ready, participant_event, settings_updated, task_created, error
```

**Key states exposed to UI:**
```typescript
phase: 'idle' | 'connecting' | 'joined' | 'live' | 'error'
micOn: boolean
micLevel: 0–100      // for level meter visualization
aiStatus: 'idle' | 'listening' | 'thinking' | 'speaking'
transcript: TranscriptLine[]
```

#### Interview Feature — [`src/features/interview/use-interview.ts`](../src/features/interview/use-interview.ts)

Hook `useInterview()` wraps all interview CRUD and lifecycle transitions:

```typescript
// CRUD
create(input: CreateInterviewInput): Promise<Interview>
update(id, patch): Promise<void>
remove(id): Promise<void>
list(orgId, statusFilter?): Promise<void>

// Lifecycle
generateQuestions(input)         // AI-generated questions from JD + resume
uploadResume(orgId, file)        // Upload PDF → S3 → parse
startSession(orgId, interviewId) // Deploy bot, transition to in_progress
cancelSession(orgId, id)         // Terminate bot
runEvaluation(orgId, id)         // Trigger GPT-4o scoring
recordDecision(orgId, id, outcome, notes) // hire | no_hire | on_hold
getRelated(orgId, id)            // Similar past candidates
```

**Interview mode logic (backend):**
- **Solo** — Lira asks all questions, evaluates answers independently
- **Copilot** — Lira assists human interviewer with follow-up prompts
- **Shadow** — Lira observes silently, evaluates without speaking

#### AI Participant Feature — [`src/features/ai-participant/index.ts`](../src/features/ai-participant/index.ts)
**Status: Placeholder.** Intended for AI personality customization UI and per-meeting AI settings.

#### Participants Feature — [`src/features/participants/index.ts`](../src/features/participants/index.ts)
**Status: Placeholder.** Intended for managing participant video tiles and diarization.

#### Settings Feature — [`src/features/settings/index.ts`](../src/features/settings/index.ts)
**Status: Placeholder.** Intended to be extracted from SettingsPage into a composable hook.

---

### 4.5 Component Library

#### UI Primitives — `components/ui/` (Shadcn/Radix)
All base UI building blocks: `avatar`, `badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `scroll-area`, `separator`, `skeleton`, `slider`, `switch`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`.

#### Common Components — `components/common/`
Higher-level wrappers: `Avatar`, `Badge`, `Button`, `Card`, `Cluster` (horizontal group), `ConfirmDialog`, `EmptyState`, `ErrorState`, `Grid`, `LoadingState`, `Modal`, `Stack`, `Tooltip`.

#### Shell — `components/shell/`
`AppShell`: Main application frame.  
Responsibilities:
- Persistent left sidebar with icon + label nav links
- Top bar with org switcher dropdown (reads `useOrgStore`)
- User menu (avatar, profile link, logout)
- Notification center with unread badge counters (`useNotifStore`)
- Responsive mobile hamburger menu
- Renders `<Outlet />` for nested route content

`OrgLayout` (`components/org/`): Thin wrapper for org-scoped routes. Handles org guard (redirect to onboarding if no currentOrgId).

#### Meeting Room — `components/meeting-room/`
- `MeetingHeader` — Title, live connection status dot, participant count
- `MeetingControlsBar` — Mic toggle, mute indicator, end meeting button
- `MeetingSidebar` — Scroll-locked live transcript with speaker labels
- `ParticipantTile` — Individual video/audio participant tile
- `AiParticipantCard` — Lira's status card with animated pulse (idle → listening → thinking → speaking)

#### Bot Deploy — `components/bot-deploy/`
- `BotDeployPanel` — Meeting URL input field + "Deploy Bot" button; platform auto-detected from URL
- `AuthStatusCard` — Displays Google/Zoom session health; warns on expiry

#### Placeholder modules (declared, not yet implemented)
- `components/transcript/` — Planned standalone transcript viewer
- `components/controls/` — Planned advanced meeting controls
- `components/ai/` — Planned AI-specific UI components

---

### 4.6 Type System & Runtime Validation

#### WebSocket Events — [`src/types/events.ts`](../src/types/events.ts)
All WebSocket message schemas are defined as Zod discriminated unions. Every message received from the server is validated before routing. Any message failing schema validation is silently dropped and logged.

```typescript
// Inbound (server → client)
InboundEventSchema = z.discriminatedUnion('type', [
  transcript_delta,
  ai_status,
  ai_response,
  error,
  pong
])

// Outbound (client → server)
OutboundEventSchema = z.discriminatedUnion('type', [
  join,
  settings_update,
  ping,
  audio_chunk_meta
])
```

#### Environment — [`src/env.ts`](../src/env.ts)
Environment variables validated with Zod at application startup. Hard crashes on missing required vars (fail-fast design).

```typescript
VITE_API_URL        // default: https://api.creovine.com
VITE_WS_URL         // default: wss://api.creovine.com/lira/v1/ws
VITE_GOOGLE_CLIENT_ID  // required — Google OAuth
```

---

## 5. Backend System (API + AWS)

> **Note:** The backend lives in the `creovine-api` repository at `https://github.com/Creovine-Labs/creovine-api.git`. This section documents the API surface as consumed by the frontend, plus known backend architecture facts from repository memory.

### 5.1 REST API Surface

Base URL: `https://api.creovine.com`  
Auth: `Authorization: Bearer <JWT>` on all authenticated routes.

#### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/lira/v1/auth/google` | Google OAuth credential → JWT |
| POST | `/lira/v1/auth/login` | Email + password → JWT |
| POST | `/lira/v1/auth/signup` | Register new user + optional company |

#### Meetings
| Method | Path | Description |
|--------|------|-------------|
| POST | `/lira/v1/meetings` | Create new meeting session |
| GET | `/lira/v1/meetings` | List meetings (optional `?orgId=`) |
| GET | `/lira/v1/meetings/:id` | Get meeting by session ID |
| GET | `/lira/v1/meetings/:id/summary` | Get/regenerate AI summary |
| PATCH | `/lira/v1/meetings/:id` | Update meeting metadata |
| PATCH | `/lira/v1/meetings/:id/settings` | Update AI settings mid-meeting |
| DELETE | `/lira/v1/meetings/:id` | Delete meeting |

#### Bot Deployment
| Method | Path | Description |
|--------|------|-------------|
| POST | `/lira/v1/bots/deploy` | Launch Puppeteer bot into Google Meet/Zoom |
| GET | `/lira/v1/bots/:botId/status` | Poll bot lifecycle state |
| DELETE | `/lira/v1/bots/:botId` | Terminate specific bot |
| DELETE | `/lira/v1/bots` | Terminate all bots for user |
| POST | `/lira/v1/bots/auth/refresh` | Refresh Google/Zoom session |
| GET | `/lira/v1/bots/auth/status` | Check auth session health |
| GET | `/lira/v1/bots` | List all active bots |

#### Organizations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/lira/v1/orgs` | Create organization |
| GET | `/lira/v1/orgs` | List orgs for authenticated user |
| GET | `/lira/v1/orgs/:orgId` | Get org by ID |
| PATCH | `/lira/v1/orgs/:orgId` | Update org profile / settings |
| GET | `/lira/v1/orgs/:orgId/members` | List org members |

#### Knowledge Base
| Method | Path | Description |
|--------|------|-------------|
| GET | `/lira/v1/orgs/:orgId/kb` | List all KB entries |
| POST | `/lira/v1/orgs/:orgId/kb/crawl` | Trigger website crawl |
| GET | `/lira/v1/orgs/:orgId/kb/crawl/status` | Poll crawl progress |
| DELETE | `/lira/v1/orgs/:orgId/kb/:id` | Delete single KB entry |
| DELETE | `/lira/v1/orgs/:orgId/kb` | Clear entire knowledge base |

#### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/lira/v1/orgs/:orgId/documents` | Upload document (multipart/form-data) |
| GET | `/lira/v1/orgs/:orgId/documents` | List all documents |
| DELETE | `/lira/v1/orgs/:orgId/documents/:docId` | Delete document |
| GET | `/lira/v1/orgs/:orgId/documents/:docId/download` | Get presigned S3 download URL |
| POST | `/lira/v1/orgs/:orgId/documents/:docId/reprocess` | Retry indexing for failed document |

#### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/lira/v1/orgs/:orgId/tasks` | List tasks (optional `?status=&priority=`) |
| POST | `/lira/v1/orgs/:orgId/tasks` | Create task |
| PATCH | `/lira/v1/orgs/:orgId/tasks/:taskId` | Update task |
| DELETE | `/lira/v1/orgs/:orgId/tasks/:taskId` | Delete task |

#### Interviews
| Method | Path | Description |
|--------|------|-------------|
| GET | `/lira/v1/orgs/:orgId/interviews` | List interviews (optional `?status=`) |
| POST | `/lira/v1/orgs/:orgId/interviews` | Create interview record |
| GET | `/lira/v1/orgs/:orgId/interviews/:id` | Get interview |
| PATCH | `/lira/v1/orgs/:orgId/interviews/:id` | Update interview |
| DELETE | `/lira/v1/orgs/:orgId/interviews/:id` | Delete interview |
| POST | `/lira/v1/orgs/:orgId/interviews/upload-resume` | Upload candidate resume |
| POST | `/lira/v1/orgs/:orgId/interviews/draft` | Draft interview from job description |
| POST | `/lira/v1/orgs/:orgId/interviews/generate-questions` | AI-generate question set |
| POST | `/lira/v1/orgs/:orgId/interviews/:id/start` | Start session + deploy bot |
| POST | `/lira/v1/orgs/:orgId/interviews/:id/cancel` | Cancel and terminate bot |
| POST | `/lira/v1/orgs/:orgId/interviews/:id/evaluate` | Trigger GPT-4o evaluation |
| POST | `/lira/v1/orgs/:orgId/interviews/:id/decision` | Record hire/no-hire |
| GET | `/lira/v1/orgs/:orgId/interviews/:id/related` | Fetch similar past candidates |

#### WebSocket
| Protocol | Path | Description |
|----------|------|-------------|
| WSS | `/lira/v1/ws?token=<JWT>` | Audio + event stream (bidirectional) |

---

### 5.2 WebSocket Protocol

The WebSocket connection is the heart of the real-time experience. JWT is passed as a query parameter (not in headers, since WebSocket upgrade requests cannot carry custom headers in all browsers).

**Binary frames:** Raw PCM audio (16kHz, 16-bit LE, mono from client; 24kHz from server)  
**Text frames:** JSON-encoded typed events (schema defined in `src/types/events.ts`)

**Session lifecycle on WS:**
1. Client connects: `wss://api.creovine.com/lira/v1/ws?token=<JWT>`
2. Client sends `join` event with `meetingId`
3. Server confirms with `joined` event
4. Client sends binary PCM frames continuously while mic is on
5. Server sends `transcript_delta` as speech is recognized
6. Server sends `ai_status: thinking` when Nova begins processing
7. Server sends binary PCM (AI voice) + `ai_response` text in parallel
8. Server sends `ai_status: idle` when response ends
9. Client sends `ping` every 15s; server replies `pong`
10. Client sends `audio_chunk_meta` before each binary chunk for ordering

---

### 5.3 Organization Context System (7 Phases)

The backend has implemented all 7 phases of the organization context system.

#### Phase 1 — Organization CRUD & Membership
- Create org, invite users by code
- Soft-delete semantics; owner always has admin privileges
- DynamoDB table: `lira-organizations`

#### Phase 2 — Organization Profile & Context Injection
- Structured org profile: `company_name`, `industry`, `description`, `website`, `size`, `culture`, `products[]`, `terminology[]`, `custom_instructions`
- Profile is serialized into Lira's system prompt at session start
- Injected as top of `system` message block in Nova Sonic

#### Phase 3 — Website Crawl & Knowledge Base
- URL submitted → backend launches crawler (Puppeteer or HTTP fetch)  
- Pages are summarized with Nova Pro/Lite (not stored raw)
- Summary entries stored in DynamoDB with category tag: `about | product | docs | blog | other`
- Max pages configurable per request (default 50)
- Crawl is async; frontend polls `GET /kb/crawl/status`

#### Phase 4 — Document Upload, Parsing & RAG Pipeline
- Files uploaded via `multipart/form-data` → stored in S3 bucket `creovine-lira-documents`
- Backend parses: PDF → text (pdf-parse), DOCX → text (mammoth), TXT/MD/CSV/XLSX plain read
- Parsed text chunked into ~500-token segments
- Each chunk embedded and stored in Qdrant
- Document record in DynamoDB tracks `status`: `uploaded → processing → indexed → failed`
- `reprocess` endpoint re-runs the pipeline for `failed` documents

#### Phase 5 — Vector Search & Semantic Retrieval
- Qdrant running as Docker container on EC2 (`:6333`, `--restart always`)
- Collection: `lira_org_embeddings`, cosine similarity, 1536 dimensions
- Embeddings: OpenAI `text-embedding-3-small`
- Services: `lira-embedding.service.ts`, `lira-vector-search.service.ts`
- Query at meeting start: top-K chunks relevant to meeting topic
- Graceful fallback to keyword search when Qdrant is unavailable

#### Phase 6 — Context Injection into Nova Sonic
- Token-aware selection: retrieved knowledge chunks are trimmed to fit Nova Sonic context window
- Caching: context computed once per session, stored in-memory on the backend process
- Mid-meeting refresh: if meeting topic changes (detected via LLM), context is recomputed
- Injection order in system prompt: `[org profile] → [KB summaries] → [document chunks] → [custom instructions]`

#### Phase 7 — Task Execution Engine
- During and after meetings, Nova Sonic detects action items and emits `task_created` events on the WebSocket
- Extraction: GPT-4o parses meeting transcript for tasks, assigns `task_type`, `priority`, and `assigned_to`
- AI execution: some task types can be auto-executed by the backend (e.g., `draft_document`, `follow_up_email`)
- Webhooks: completed tasks can trigger Slack or custom HTTP webhooks (org-level webhook config)
- DynamoDB: `lira-meetings` table stores `tasks[]` embedded in meeting record, also mirrored to task-specific queries

---

### 5.4 AWS Infrastructure

| Resource | Detail |
|----------|--------|
| EC2 Instance | t3.small, Ubuntu 22.04, IP: 98.92.255.171 |
| API URL | https://api.creovine.com |
| Deploy method | `./deploy-auto.sh` — build → rsync → npm install → systemd restart |
| SSH access | `~/.ssh/creovine-api-key.pem`, user: `ubuntu` |
| DynamoDB region | us-east-1 |
| DynamoDB tables | `lira-meetings`, `lira-connections`, `lira-organizations` |
| S3 bucket | `creovine-lira-documents` (us-east-1) |
| AWS Account | 912921195732 (main) |
| EC2 role account | 735235719497 |
| Qdrant | Docker container on same EC2 instance, port 6333 |

**Important:** The deploy script excludes `.env`. New environment variables must be manually added to the server `.env` file before deploying code that depends on them.

---

## 6. AI Layer

### 6.1 Amazon Nova Sonic (Speech-to-Speech)

Nova Sonic is the core of Lira's conversational ability. It handles:
- **STT** — Transcribes incoming PCM audio to text
- **LLM reasoning** — Generates response using conversation context + org context
- **TTS** — Converts response text back to natural speech PCM

Lira's personality is injected as part of the Nova Sonic system prompt. Options: `supportive`, `challenger`, `facilitator`, `analyst`.

Voice options available (Nova-backed TTS):
| Voice ID | Description |
|----------|-------------|
| `tiffany` | Female, professional, clear |
| `ruth` | Female, warm, conversational |
| `matthew` | Male, confident, articulate |
| `stephen` | Male, deep, authoritative |

**Audio specs:**
- Client → Server: PCM 16kHz, 16-bit little-endian, mono
- Server → Client: PCM 24kHz

**Key behavior:** Nova Sonic supports barge-in — when the user starts speaking, the frontend detects the mic level increase and mutes incoming AI audio. The `interruption` event from the server signals that Nova has stopped mid-response.

### 6.2 GPT-4o (Task Extraction & Evaluation)

GPT-4o is used in two scenarios:

**Task Extraction (Phase 7):**
After a meeting ends, a structured prompt is sent to GPT-4o with the full transcript. GPT-4o returns a JSON array of tasks with: `title`, `description`, `assigned_to`, `task_type`, `priority`, `due_date`, `source_quote`.

**Interview Evaluation:**
After an interview completes, GPT-4o scores each answer against the defined evaluation criteria. Output includes:
- Per-criterion score (0–10)
- Evidence quotes from the transcript
- Strengths, concerns, recommendation
- Overall recommendation: `strong_hire | hire | no_hire | strong_no_hire`

### 6.3 OpenAI Embeddings (Vector Search)

Model: `text-embedding-3-small` (1536 dimensions)  
Used for: embedding document chunks and KB summaries into Qdrant.  
At meeting start, the meeting topic/title is embedded and used to query Qdrant for the top-K most relevant context chunks.

### 6.4 Qdrant (Vector Store)

- Self-hosted Docker container on EC2 (same instance as API)
- Collection: `lira_org_embeddings`
- Distance metric: Cosine similarity
- Dimensions: 1536
- Client library: `@qdrant/js-client-rest`
- Environment variable: `QDRANT_URL=http://localhost:6333`
- **Risk:** Single point of failure — Qdrant on the same EC2 as the API. If the instance restarts, both the API and vector store go down simultaneously.

### 6.5 Context Injection Pipeline

When a new Nova Sonic session starts:
1. Load org profile from DynamoDB
2. Query Qdrant for top-K document/KB chunks matching meeting topic
3. Load any manually-specified `custom_instructions`
4. Serialize all of the above into a single `system` block
5. Pass to Nova Sonic at session initialization
6. Monitor meeting for topic drift (via LLM periodic check)
7. If topic drift detected, re-embed new topic and refresh context chunks mid-session

Token budget is enforced: chunks are sorted by relevance score and trimmed to fit within a configured max token count.

---

## 7. Bot Deployment System

Lira's bot is a Puppeteer-controlled Chromium instance that:
1. Opens a new browser window
2. Navigates to the Google Meet or Zoom URL
3. Authenticates using a pre-configured Google/Zoom account
4. Clicks "Join" and enters the meeting
5. Connects its internal audio to the Nova Sonic WebSocket pipeline
6. Participates in the meeting (listens, speaks via TTS)
7. Leaves when terminated or when meeting ends

**Platform detection (frontend):**
```typescript
// google_meet: /meet.google.com/
// zoom: /zoom.us/j/ or /us02web.zoom.us/
```

**Bot state machine:**
```
launching → navigating → in_lobby → joining → active → leaving → terminated
                                                              ↘ error
```

**Frontend polling:** `getBotStatus()` is called every 2 seconds. Polling stops when state is `terminated` or `error`. Bot state is cleared from UI 4 seconds after termination.

**Auth health:** `getBotAuthStatus()` returns whether the Google/Zoom session is still valid and when it expires. The `AuthStatusCard` component warns users when the session is near expiry. `refreshBotAuth()` triggers a re-authentication flow.

**Meeting types passed to bot at deploy time:**
`meeting | interview | standup | one_on_one | technical | brainstorming | sales`

This `meetingType` shapes the Nova Sonic system prompt. For `interview`, the bot is given the full interview record (questions, evaluation criteria, candidate info) and enters structured interview mode.

---

## 8. Interview System

The interview system is the most complex feature in the codebase. It involves coordination across: frontend forms, document upload, AI question generation, bot deployment, structured AI conversation, LLM evaluation, and human review.

### Status Flow
```
draft → scheduled → bot_deployed → in_progress → evaluating → completed
                                                      ↘ cancelled
```

### Data Inputs at Create Time
- `title` — Role name (e.g., "Senior Backend Engineer")
- `department` — Optional department tag
- `job_description` — Full JD text (used for question generation)
- `required_skills[]` — Skill checklist
- `experience_level` — junior / mid / senior / lead / executive
- `candidate_name`, `candidate_email`
- `candidate_resume_url` — Optional; set after resume upload
- `mode` — `solo | copilot | shadow`
- `meeting_link` — Google Meet URL
- `scheduled_at` — ISO datetime
- `time_limit_minutes` — Interview duration cap
- `personality` — Lira's personality for this interview
- `questions[]` — Array of `{ id, question, follow_up_prompt?, category, weight }`
- `evaluation_criteria[]` — Array of `{ id, name, description, weight, max_score }`

### AI Question Generation
Frontend calls `generateInterviewQuestions(orgId, input)` where `input` is:
```typescript
{
  job_description: string
  required_skills: string[]
  experience_level: string
  candidate_resume_text?: string  // extracted from uploaded resume
  num_questions?: number
}
```
Returns structured questions with categories and suggested follow-up prompts.

### During the Interview (Bot Mode)
The bot receives the full `Interview` record as metadata at deploy time. The Nova Sonic context includes:
- Company context (from org profile)
- Role description and required skills
- Candidate background (from resume, if provided)
- Ordered question list with follow-up prompts
- Evaluation criteria and scoring rubric

Lira does **not** read questions robotically; the system prompt instructs it to weave questions naturally into conversation, ask follow-ups based on answers, and manage time.

### Evaluation (GPT-4o)
Triggered by `runInterviewEvaluation(orgId, interviewId)` after interview ends.
GPT-4o receives:
- Full meeting transcript
- Evaluation criteria with weights
- Original questions asked and model answers (if any)

Output `InterviewEvaluation`:
```typescript
{
  overall_score: number (0-100)
  criteria_scores: { criterion_id, score, evidence_quote, notes }[]
  strengths: string[]
  concerns: string[]
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire'
  evaluation_notes: string
  qa_summary: QASummary[]  // per question: question, answer_summary, score
}
```

### Human Decision
HR/hiring manager reviews the evaluation in `InterviewDetailPage` and calls `recordInterviewDecision()` with:
- `outcome`: `hire | no_hire | on_hold`
- `notes`: free-form decision context

---

## 9. Data Models

### Meeting
```typescript
{
  session_id: string
  title: string
  user_id: string
  org_id?: string
  created_at: string           // ISO datetime
  updated_at: string
  status?: string
  meeting_type?: MeetingType   // meeting|interview|standup|one_on_one|technical|brainstorming|sales
  meeting_topic?: string
  settings?: {
    personality?: string
    wake_word_enabled?: boolean
    proactive_suggest?: boolean
    ai_name?: string
    voice_id?: string
  }
  messages?: Message[]
  participants?: string[]
  audio_url?: string
  summary_short?: string
  summary_long?: string
  summary_generated_at?: string
}
```

### Interview
```typescript
{
  interview_id: string
  org_id: string
  session_id?: string          // linked meeting session once started
  title: string
  department?: string
  job_description: string
  required_skills: string[]
  experience_level: string
  candidate_name: string
  candidate_email: string
  candidate_resume_url?: string
  mode: 'solo' | 'copilot' | 'shadow'
  meeting_link: string
  scheduled_at?: string
  time_limit_minutes: number
  personality: string
  questions: InterviewQuestion[]
  evaluation_criteria: EvaluationCriterion[]
  status: InterviewStatus      // see state flow above
  evaluation?: InterviewEvaluation
  internal_notes?: string
  decision?: 'hire' | 'no_hire' | 'on_hold'
  decided_by?: string
  decided_at?: string
}
```

### Organization
```typescript
{
  org_id: string
  name: string
  owner_id: string
  invite_code: string
  profile: {
    company_name?: string
    industry?: string
    description?: string
    website?: string
    websites?: string[]
    size?: string
    culture?: OrgCulture        // { values, communication_style, decision_making_style }
    products?: OrgProduct[]     // { name, description, target_audience, key_features }
    terminology?: OrgTerminology[] // { term, definition, context }
    custom_instructions?: string
  }
  created_at: string
  updated_at: string
}
```

### Task
```typescript
{
  task_id: string
  org_id: string
  session_id?: string          // source meeting
  title: string
  description: string
  assigned_to?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  task_type: 'action_item' | 'draft_document' | 'follow_up_email' | 'research' | 'summary' | 'decision'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  source_quote?: string        // exact transcript segment that triggered this task
  due_date?: string
  created_by: string
  execution_status?: string
  execution_result?: string
  execution_s3_key?: string    // if result is a document (draft, etc.)
  executed_at?: string
  created_at: string
  updated_at: string
}
```

### Document
```typescript
{
  doc_id: string
  org_id: string
  filename: string
  file_type: string            // pdf | docx | txt | md | csv | xlsx
  s3_key: string
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  uploaded_at: string
  indexed_at?: string
  error_message?: string
  chunk_count?: number
}
```

---

## 10. End-to-End Data Flows

### 10.1 Voice Meeting Flow
```
User opens /meeting
    ↓
Enters title + selects org (optional)
    ↓
Click "Start Meeting"
    ↓
useAudioMeeting.startMeeting()
    ↓
POST /lira/v1/meetings → { session_id }
    ↓
buildWsUrl(session_id, JWT)
    ↓
createTypedWebSocketClient().connect()
    ↓
WebSocket state: open
    ↓
sendJoin({ meetingId: session_id, participantId: userId, role: 'human' })
    ↓
Server responds: joined event
    ↓
phase = 'joined'
    ↓
User clicks mic button
    ↓
getUserMedia({ audio: true }) → MediaStream
    ↓
AudioWorkletProcessor → 16kHz PCM binary frames
    ↓
WS send(binary) [continuous while mic is on]
    ↓
Server: Nova Sonic receives PCM
    ↓
Server: STT → transcript text
    ↓
Server → Client: transcript_delta events
    ↓
addTranscriptLine() → UI updates
    ↓
Server: Nova Sonic generates response
    ↓
Server → Client: ai_status: thinking
    ↓
Server → Client: ai_status: speaking
    ↓
Server → Client: binary PCM (24kHz AI voice) + ai_response text
    ↓
Web Audio API playback → user hears Lira
    ↓
User clicks "End Meeting"
    ↓
stopCapture() + client.disconnect()
    ↓
PATCH /lira/v1/meetings/:id (mark ended)
    ↓
Navigate to /meetings/:id for summary
```

### 10.2 Bot Deploy Flow
```
User opens /meetings
    ↓
Pastes Google Meet URL into BotDeployPanel
    ↓
Auto-detect platform: google_meet | zoom
    ↓
Select meeting type, org, personality
    ↓
Click "Deploy Bot"
    ↓
POST /lira/v1/bots/deploy
    ↓
Server: launch Puppeteer instance
    ↓
{ botId } returned → useBotStore.setBotDeployed()
    ↓
Frontend: start polling getBotStatus() every 2s
    ↓
Bot state progression:
  launching → navigating → in_lobby → joining → active
    ↓
Bot is in meeting — participates autonomously
    ↓
User clicks "Terminate Bot"
    ↓
DELETE /lira/v1/bots/:botId
    ↓
Bot state: terminated → clearBot() after 4s
```

### 10.3 Interview Lifecycle Flow
```
HR opens /org/roles/new
    ↓
Fill: title, JD, skills, experience level
    ↓
Optionally: upload resume → uploadInterviewResume()
    ↓
Optionally: generateInterviewQuestions() → AI suggests questions
    ↓
Fill: candidate info, meeting link, schedule
    ↓
POST /orgs/:orgId/interviews → { interview_id }
    ↓
Status: draft
    ↓
HR reviews questions, adjusts criteria weights
    ↓
Click "Schedule" → PATCH status = scheduled
    ↓
On interview day: Click "Start Interview"
    ↓
POST /orgs/:orgId/interviews/:id/start
    ↓
Backend: deployBot(meeting_link, mode=interview, with full interview record)
    ↓
Status: bot_deployed → in_progress
    ↓
Bot joins Google Meet meeting
    ↓
Bot: "Hi [candidate name], I'm Lira from [company]. 
      Today we're interviewing for [role]..."
    ↓
Structured Q&A — Lira manages question flow
    ↓
Interview ends (time limit or manual cancel)
    ↓
Status: evaluating
    ↓
POST /orgs/:orgId/interviews/:id/evaluate
    ↓
GPT-4o processes transcript → evaluation scores
    ↓
Status: completed
    ↓
HR opens /org/interviews/:id → InterviewDetailPage
    ↓
Reviews: per-criterion scores, quotes, strengths/concerns
    ↓
Records decision: hire | no_hire | on_hold
    ↓
POST /orgs/:orgId/interviews/:id/decision
```

---

## 11. Build, Testing & Deployment

### Development
```bash
npm run dev          # Vite dev server with HMR (http://localhost:5173)
```

### Build
```bash
npm run build        # TypeScript check + Vite production build → dist/
```

### Linting & Formatting
```bash
npm run lint         # ESLint 9 (flat config)
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier 3.8
npm run format:check # Dry-run Prettier check
npm run check        # lint + typecheck + test (CI gate)
```

### Testing
```bash
npm run test           # Vitest single run
npm run test:watch     # Vitest watch mode
npm run test:coverage  # Coverage report
npm run test:e2e       # Playwright e2e (requires dev server running)
```

Current test coverage:
- `src/App.test.tsx` — basic app render smoke test
- `e2e/page-load.spec.ts` — Playwright page load test
- **Unit and integration tests for hooks and services are largely absent — this is a gap.**

### Pre-Commit Hooks
- Husky + lint-staged auto-runs ESLint + Prettier on staged `.ts/.tsx` files
- commitlint validates commit messages against Conventional Commits format

### Frontend Deployment (Vercel)
1. Push to main branch
2. Vercel auto-deploys from `dist/`
3. Configure environment variables on Vercel dashboard:
   - `VITE_API_URL`
   - `VITE_WS_URL`
   - `VITE_GOOGLE_CLIENT_ID`

### Backend Deployment (EC2)
```bash
./deploy-auto.sh     # build → rsync to EC2 → npm install → systemd restart
```
- Service: `creovine-api.service` (systemd, auto-restart on failure)
- New `.env` vars must be added to server manually before deploying
- SSH: `ssh -i ~/.ssh/creovine-api-key.pem ubuntu@98.92.255.171`

---

## 12. Known Gaps & Engineering Opportunities

This section is structured by discipline for each engineering role.

---

### For AI Engineers

#### 1. Nova Sonic Context Quality
- **Gap:** Context injection is token-limited but there is no feedback loop. Lira does not know which retrieved chunks were actually useful.
- **Opportunity:** Implement relevance feedback — track which chunks were referenced in responses, use this to improve retrieval over time.

#### 2. Interview Evaluation Prompt Engineering
- **Gap:** GPT-4o evaluation is a single-pass prompt. There is no chain-of-thought enforcement, no calibration against past interviews, and no inter-rater reliability check.
- **Opportunity:** Add structured CoT (chain-of-thought) prompting, multi-pass re-evaluation at different temperatures, and calibration samples from historical interviews.

#### 3. Nova Sonic Barge-In Handling
- **Gap:** Barge-in detection is handled client-side by mic level threshold. Nova Sonic has native interruption support, but the handoff between client-detected interruption and server-side Nova interruption is not well-documented.
- **Opportunity:** Clarify exactly how `interruption` events work, ensure client mutes playback atomically on barge-in.

#### 4. Topic Drift Detection
- **Gap:** Mid-meeting context refresh is described in Phase 6 but the implementation details (LLM call timing, cost control) are not documented.
- **Opportunity:** Define a lightweight drift detection model (embedding cosine distance between recent transcript window and original topic embedding) to avoid expensive LLM calls.

#### 5. Task Extraction Accuracy
- **Gap:** GPT-4o task extraction fires after the meeting ends on the full transcript. For long meetings this is expensive and latency-heavy.
- **Opportunity:** Implement sliding-window real-time extraction during the meeting (every N minutes, process the new transcript since last extraction), or use Nova Sonic's own native function-calling for inline task detection.

#### 6. Resume Parsing Quality
- **Gap:** Resume → structured data extraction is not explicitly documented. If it relies on a simple text extraction, quality for complex PDF layouts (tables, columns) will be poor.
- **Opportunity:** Use a specialized resume parsing model or a structured extraction prompt with GPT-4o Vision for PDF resumes with non-standard formatting.

---

### For Backend Engineers

#### 1. Single-Process Architecture (Scaling Risk)
- **Gap:** All routes, WebSocket sessions, Nova Sonic streaming, Qdrant queries, and bot orchestration run in a single Fastify process on a t3.small.
- **Opportunity:** Extract bot management (Puppeteer) to a separate worker process or container. Separate WebSocket session handling from REST API handling. Consider horizontal scaling behind a load balancer.

#### 2. Qdrant on Same Instance (Reliability Risk)
- **Gap:** Qdrant runs as a Docker container on the same EC2 as the API. Instance restart = both go down. No persistence backup configured.
- **Opportunity:** Move Qdrant to a dedicated instance or use Qdrant Cloud. Add a daily S3 snapshot of the `/qdrant/storage` volume.

#### 3. DynamoDB Data Model
- **Gap:** There are only 3 DynamoDB tables (`lira-meetings`, `lira-connections`, `lira-organizations`). Tasks, documents, interviews, and KB entries are likely stored as nested attributes on these tables or in undocumented ways.
- **Opportunity:** Audit the actual DynamoDB schema and document it. Consider whether tasks and documents need their own tables for querying efficiency (DynamoDB scan on large tables is expensive).

#### 4. WebSocket Session Persistence
- **Gap:** The `lira-connections` table presumably tracks active WebSocket sessions, but there is no documented cleanup strategy for stale connections (e.g., client crashes without sending close frame).
- **Opportunity:** Add TTL attribute to connection records (DynamoDB TTL feature). Add a periodic cleanup job for connections older than N minutes with no recent activity.

#### 5. Audio Pipeline Observability
- **Gap:** There is no instrumentation (metrics, logs) on audio chunk size, latency from PCM send to `transcript_delta` receive, or Nova Sonic API error rates.
- **Opportunity:** Add custom metrics (CloudWatch or Datadog) for: audio frame delivery latency, Nova Sonic error rate, WS reconnect frequency, transcript delta lag.

#### 6. Document Upload Security
- **Gap:** `uploadDocument` uses `@fastify/multipart@8.3.1` — file type validation and size limits need to be confirmed. Accepting arbitrary uploads without robust validation is a security risk.
- **Opportunity:** Enforce strict MIME type checking on backend (not just by extension), set max file size header, run virus scanning for uploaded documents before indexing.

#### 7. Webhook Security
- **Gap:** Org-level webhooks can point to arbitrary URLs. SSRF (Server-Side Request Forgery) is a risk if the backend fetches or POSTs to user-provided URLs without validation.
- **Opportunity:** Validate webhook URLs against an allowlist of protocols (HTTPS only), block private IP ranges (10.x, 172.x, 192.168.x, 127.x), and add HMAC signature to webhook payloads.

#### 8. JWT Strategy
- **Gap:** JWTs are stored in `localStorage` (via `credentials.getToken()`). This exposes them to XSS attacks.
- **Opportunity:** Migrate to HttpOnly cookies for JWT storage. Implement short-lived access tokens (15min) + rotate refresh tokens. Add CSRF protection for cookie-based auth.

#### 9. Missing Refresh Token Flow
- **Gap:** When a JWT expires, the frontend clears credentials and redirects to login. There is no silent refresh token mechanism.
- **Opportunity:** Implement refresh token rotation. Store refresh token in HttpOnly cookie. Use a background fetch interceptor to silently refresh access tokens before they expire.

---

### For Frontend Engineers

#### 1. Audio Service is Inline in the Hook
- **Gap:** All audio logic (mic capture, PCM encoding, level monitoring, playback) lives inside `useAudioMeeting`. This makes it hard to test, reuse, or swap implementations.
- **Opportunity:** Extract to `src/services/audio/index.ts` (currently a stub). Expose a clean interface: `startCapture`, `stopCapture`, `getMicLevel`, `playChunk`, `flushPlayback`.

#### 2. WebRTC Service is Unimplemented
- **Gap:** `simple-peer` is installed but `src/services/webrtc/index.ts` is empty. There is no peer-to-peer capability yet.
- **Opportunity:** Implement when video tile support or P2P audio is needed. Consider whether the current WebSocket audio model should migrate to WebRTC for better audio quality and lower latency.

#### 3. Feature Placeholders Not Implemented
- **Gap:** Three of five feature modules are stubs: `ai-participant`, `participants`, `settings`.
- **Opportunity:**
  - `ai-participant`: Build a hook + UI for per-meeting AI customization (wake word toggle, personality override, interruption sensitivity)
  - `participants`: Build participant management (list participants, speaker attribution, video tile layout)
  - `settings`: Extract settings logic from `SettingsPage` into `useSettings()` hook

#### 4. No Error Boundaries
- **Gap:** There are no React Error Boundaries in the component tree. A runtime error in any component will crash the entire app with a blank white screen.
- **Opportunity:** Add Error Boundaries at the route level (each page wrapped). Add a generic `ErrorFallback` component that shows a "Something went wrong" message with a retry button.

#### 5. No Suspense or Loading Architecture
- **Gap:** Loading states are handled ad-hoc per page (show spinner if `loading === true`). There is no consistent Suspense-based data fetching pattern.
- **Opportunity:** Introduce React Query (or SWR) for server state management, replacing manual `loading` flags and store updates. This provides automatic background refetch, cache invalidation, and built-in loading/error states.

#### 6. Component Test Coverage is Very Low
- **Gap:** Only `App.test.tsx` (smoke render) and one Playwright test exist. No unit tests for hooks, no component tests for meeting room or interview pages.
- **Opportunity:** Add Vitest unit tests for:
  - `useAudioMeeting` (mock WS, assert phase transitions)
  - `useInterview` (mock API calls, assert store updates)
  - `TypedWebSocketClient` (mock WebSocket, test reconnect behavior)
  - `addTranscriptLine` deduplication logic

#### 7. Notification System is Rudimentary
- **Gap:** `useNotifStore` stores entries but the notification UI is only badge counters. There is no notification drawer or notification history.
- **Opportunity:** Build a full notification center: sliding drawer from AppShell, list of recent notifications (task created, interview completed, crawl finished), mark-as-read, link to relevant page.

#### 8. MeetingPage Layout Not Adaptive
- **Gap:** `MeetingPage` handles both "idle" (waiting to start) and "live" (active meeting) states in the same page. The transition between these states should be clear.
- **Opportunity:** Use React Router navigation or distinct view modes with animated transitions between idle → connecting → live → ended states.

#### 9. No Optimistic Updates
- **Gap:** All mutations (create task, update interview status, delete document) wait for API response before updating the UI. This makes interactions feel sluggish.
- **Opportunity:** Implement optimistic updates in Zustand stores: apply the change immediately in the store, roll back if the API call fails.

#### 10. `UiLabPage` Could Be a Storybook
- **Gap:** Component showcase is a dedicated page inside the app, not a proper isolated component development environment.
- **Opportunity:** Integrate Storybook for component development, visual regression testing, and documentation. Can be deployed as a static site separate from the main app.

#### 11. Sentry Integration Not Configured
- **Gap:** `@sentry/react` is installed but there is no evidence it's initialized in `main.tsx` or that a Sentry DSN is configured.
- **Opportunity:** Initialize Sentry in `main.tsx` with proper environment configuration (`VITE_SENTRY_DSN`). Add error boundaries that report to Sentry. Add performance tracing for key interactions (meeting start, bot deploy).

---

### Cross-Cutting Concerns

#### Authentication Security
- JWTs in `localStorage` are XSS-vulnerable. Migrate to HttpOnly cookies.
- No rate limiting mentioned on auth endpoints.
- No MFA support.

#### Multi-Tenancy Isolation
- Organization context is enforced by `orgId` in URL paths. Backend must verify that the authenticated user is a member of the requested org on every request.
- Frontend clears stores on org switch, but a network race condition could theoretically show data from the previous org briefly.

#### Accessibility
- No mention of ARIA roles, keyboard navigation, or screen reader testing in any component.
- Meeting controls (mic toggle, end meeting) must be keyboard-accessible for ADA compliance.

#### Internationalization
- All text is hardcoded in English. No i18n infrastructure.
- AI name "Lira" is configurable, but all system text, labels, and AI prompts are English-only.

#### GDPR / Privacy
- Transcripts, meeting recordings, and interview evaluations contain PII.
- No data retention policy documented for transcript data in DynamoDB.
- No user-facing data deletion tool (right to be forgotten).
- Interview recordings/transcripts may need explicit candidate consent.
