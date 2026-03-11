import { env } from '@/env'

// ── Types (mirror backend lira.models.ts) ────────────────────────────────────

export interface MeetingSettings {
  personality?: 'supportive' | 'challenger' | 'facilitator' | 'analyst'
  wake_word_enabled?: boolean
  proactive_suggest?: boolean
  ai_name?: string // Name the AI responds to (default: "Lira")
  voice_id?: string
  language?: string
}

export interface Message {
  id: string
  speaker: string
  text: string
  timestamp: string
  is_ai: boolean
  sentiment?: string
}

export interface Meeting {
  session_id: string
  title: string
  user_id: string
  org_id?: string
  created_at: string
  updated_at: string
  status?: string
  settings?: MeetingSettings
  messages?: Message[]
  participants?: string[]
  audio_url?: string
  summary_short?: string
  summary_long?: string
  summary_generated_at?: string
}

export interface MeetingSummary {
  session_id: string
  summary: string
  title?: string
  key_points?: string[]
  action_items?: string[]
  generated_at: string
  cached?: boolean
}

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    tenantId: string
    role: string
  }
}

// ── Credentials helpers ───────────────────────────────────────────────────────

const TOKEN_KEY = 'lira_token'

export const credentials = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
  },
  isConfigured: () => Boolean(localStorage.getItem(TOKEN_KEY)),
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = credentials.getToken()

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  // Handle expired JWT — clear token and redirect to login
  if (res.status === 401) {
    credentials.clear()
    // Dispatch a custom event so the app shell can react (show login, toast, etc.)
    window.dispatchEvent(new CustomEvent('lira:auth-expired'))
    throw new Error('Session expired — please sign in again.')
  }

  if (!res.ok) {
    let errBody: Record<string, string> = {}
    try {
      errBody = (await res.json()) as Record<string, string>
    } catch {
      // ignore
    }
    const msg = errBody['message'] ?? errBody['error'] ?? res.statusText
    throw new Error(`${res.status}: ${msg}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/** Google Sign-In — pass the ID token returned by @react-oauth/google */
export async function googleLogin(credential: string): Promise<LoginResponse> {
  const res = await fetch(`${env.VITE_API_URL}/v1/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  if (!res.ok) {
    let body: Record<string, string> = {}
    try {
      body = await res.json()
    } catch {
      /* ignore */
    }
    throw new Error(body['error'] ?? body['message'] ?? 'Google sign-in failed')
  }
  const data = (await res.json()) as { accessToken: string; user: LoginResponse['user'] }
  return { token: data.accessToken, user: data.user }
}

/** Platform login — does not require X-API-Key header. Returns { accessToken, user }. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${env.VITE_API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    let body: Record<string, string> = {}
    try {
      body = await res.json()
    } catch {
      /* ignore */
    }
    throw new Error(body['error'] ?? body['message'] ?? 'Login failed')
  }
  const data = (await res.json()) as { accessToken: string; user: LoginResponse['user'] }
  return { token: data.accessToken, user: data.user }
}

// ── Meetings ──────────────────────────────────────────────────────────────────

export async function createMeeting(title: string, settings?: MeetingSettings): Promise<Meeting> {
  type Resp = { meeting: Meeting } | Meeting
  const data = await apiFetch<Resp>('/lira/v1/meetings', {
    method: 'POST',
    body: JSON.stringify({ title, settings }),
  })
  return 'meeting' in data ? data.meeting : data
}

export async function listMeetings(orgId?: string): Promise<Meeting[]> {
  type Resp = { meetings: Meeting[] } | Meeting[]
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  const data = await apiFetch<Resp>(`/lira/v1/meetings${params}`)
  return Array.isArray(data) ? data : (data.meetings ?? [])
}

export async function getMeeting(id: string): Promise<Meeting> {
  type Resp = { meeting: Meeting } | Meeting
  const data = await apiFetch<Resp>(`/lira/v1/meetings/${id}`)
  return 'meeting' in data ? data.meeting : data
}

export async function getMeetingSummary(
  id: string,
  mode: 'short' | 'long' = 'short',
  regenerate = false
): Promise<MeetingSummary> {
  const params = new URLSearchParams({ mode })
  if (regenerate) params.set('regenerate', 'true')
  return apiFetch<MeetingSummary>(`/lira/v1/meetings/${id}/summary?${params}`)
}

export async function updateMeetingSettings(
  id: string,
  settings: MeetingSettings
): Promise<Meeting> {
  return apiFetch<Meeting>(`/lira/v1/meetings/${id}/settings`, {
    method: 'PUT',
    body: JSON.stringify({ settings }),
  })
}

export async function deleteMeeting(id: string): Promise<void> {
  return apiFetch<void>(`/lira/v1/meetings/${id}`, { method: 'DELETE' })
}

// ── Bot Deploy API ────────────────────────────────────────────────────────────

export type BotState =
  | 'launching'
  | 'navigating'
  | 'in_lobby'
  | 'joining'
  | 'active'
  | 'leaving'
  | 'terminated'
  | 'error'

export interface BotStatusResponse {
  bot_id: string
  platform: 'google_meet' | 'zoom'
  state: BotState
  display_name: string
  session_id: string | null
  created_at: string
  joined_at?: string
  terminated_at?: string
  error?: string
}

export interface DeployBotResponse {
  bot_id: string
  platform: 'google_meet' | 'zoom'
  state: BotState
  session_id: string
  display_name: string
}

/** Deploy a bot to a Google Meet / Zoom meeting */
export async function deployBot(
  meetingUrl: string,
  displayName?: string,
  settings?: Partial<MeetingSettings>,
  orgId?: string,
  meetingTopic?: string
): Promise<DeployBotResponse> {
  return apiFetch<DeployBotResponse>('/lira/v1/bot/deploy', {
    method: 'POST',
    body: JSON.stringify({
      meeting_url: meetingUrl,
      display_name: displayName,
      settings,
      ...(orgId ? { org_id: orgId } : {}),
      ...(meetingTopic ? { meeting_topic: meetingTopic } : {}),
    }),
  })
}

/** Get the current status of a deployed bot */
export async function getBotStatus(botId: string): Promise<BotStatusResponse> {
  return apiFetch<BotStatusResponse>(`/lira/v1/bot/${botId}`)
}

/** Terminate a running bot */
export async function terminateBot(botId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/lira/v1/bot/${botId}/terminate`, {
    method: 'POST',
  })
}

/** List all active bots */
export async function listActiveBots(): Promise<BotStatusResponse[]> {
  const data = await apiFetch<{ bots: BotStatusResponse[] }>('/lira/v1/bot/active')
  return data.bots
}

/** Terminate all active bots for the current user */
export async function terminateAllBots(): Promise<{ message: string; terminated_count: number }> {
  return apiFetch('/lira/v1/bot/terminate-all', { method: 'POST' })
}

// ── Bot Auth Status API ───────────────────────────────────────────────────────

export interface PlatformAuthStatus {
  configured: boolean
  refreshedAt: string | null
  expiresAt: string | null
  daysRemaining: number | null
  urgency: 'ok' | 'warning' | 'critical' | 'expired' | 'not_configured'
  lastSilentRefresh: string | null
}

export interface AuthStatusResponse {
  google: PlatformAuthStatus
  zoom: PlatformAuthStatus
}

/** Get Google/Zoom session status + days until expiry */
export async function getBotAuthStatus(): Promise<AuthStatusResponse> {
  return apiFetch<AuthStatusResponse>('/lira/v1/bot/auth-status')
}

/** Trigger a silent background refresh of the Google session */
export async function refreshBotAuth(): Promise<{
  success: boolean
  message: string
  status: AuthStatusResponse
}> {
  return apiFetch('/lira/v1/bot/auth-refresh', { method: 'POST' })
}

// ── Organization Types ────────────────────────────────────────────────────────

export interface OrgCulture {
  communication_style?: string
  meeting_norms?: string
  values?: string[]
}

export interface OrgProduct {
  name: string
  description: string
  status?: string
}

export interface OrgTerminology {
  term: string
  definition: string
}

export interface OrgWebsite {
  url: string
  description?: string
}

export interface OrganizationProfile {
  company_name?: string
  industry?: string
  description?: string
  website?: string
  websites?: OrgWebsite[]
  size?: string
  culture?: OrgCulture
  products?: OrgProduct[]
  terminology?: OrgTerminology[]
  custom_instructions?: string
}

export interface Organization {
  org_id: string
  name: string
  owner_id: string
  invite_code: string
  profile: OrganizationProfile
  created_at: string
  updated_at: string
}

export interface OrgMembership {
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
  name?: string
  email?: string
}

// ── Knowledge Base Types ──────────────────────────────────────────────────────

export interface KBEntry {
  id: string
  org_id: string
  source_url: string
  title: string
  summary?: string
  keywords?: string[]
  category: 'about' | 'product' | 'docs' | 'blog' | 'other'
  crawled_at: string
  embedding_count: number
}

export interface CrawlStatus {
  status: 'idle' | 'crawling' | 'completed' | 'failed'
  pages_crawled?: number
  total_pages?: number
  started_at?: string
  completed_at?: string
  error?: string
  social_links?: string[]
}

// ── Document Types ────────────────────────────────────────────────────────────

export interface DocumentRecord {
  doc_id: string
  org_id: string
  filename: string
  mime_type: string
  file_size: number
  status: 'uploaded' | 'processing' | 'indexed' | 'failed'
  chunk_count?: number
  embedding_count?: number
  page_count?: number
  summary?: string
  keywords?: string[]
  uploaded_by: string
  created_at: string
  updated_at: string
}

// ── Task Types ────────────────────────────────────────────────────────────────

export type TaskType =
  | 'action_item'
  | 'draft_document'
  | 'follow_up_email'
  | 'research'
  | 'summary'
  | 'decision'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskExecutionStatus = 'not_started' | 'running' | 'completed' | 'failed'

export interface TaskRecord {
  task_id: string
  org_id: string
  session_id?: string
  title: string
  description: string
  assigned_to?: string
  priority: TaskPriority
  task_type: TaskType
  status: TaskStatus
  source_quote?: string
  due_date?: string
  created_by: string
  execution_status: TaskExecutionStatus
  execution_result?: string
  execution_s3_key?: string
  executed_at?: string
  created_at: string
  updated_at: string
}

// ── Webhook Types ─────────────────────────────────────────────────────────────

export type WebhookEvent = 'task_created' | 'task_completed' | 'meeting_ended' | 'summary_ready'

export interface WebhookConfig {
  org_id: string
  slack_webhook_url?: string
  email_notifications?: boolean
  notify_on: WebhookEvent[]
  updated_at: string
}

// ── Organization API ──────────────────────────────────────────────────────────

export async function createOrganization(
  name: string,
  profile?: OrganizationProfile
): Promise<{ organization: Organization; membership: OrgMembership }> {
  return apiFetch('/lira/v1/orgs', {
    method: 'POST',
    body: JSON.stringify({ name, profile }),
  })
}

export async function listOrganizations(): Promise<Organization[]> {
  const data = await apiFetch<{ organizations: Organization[] }>('/lira/v1/orgs')
  return data.organizations ?? []
}

export async function getOrganization(orgId: string): Promise<Organization> {
  const data = await apiFetch<{ organization: Organization }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}`
  )
  return data.organization
}

export async function updateOrganization(
  orgId: string,
  updates: { name?: string; profile?: Partial<OrganizationProfile> }
): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export async function deleteOrganization(orgId: string): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}`, { method: 'DELETE' })
}

export async function joinOrganization(
  inviteCode: string
): Promise<{ organization: Organization; membership: OrgMembership }> {
  return apiFetch('/lira/v1/orgs/join', {
    method: 'POST',
    body: JSON.stringify({ invite_code: inviteCode }),
  })
}

export async function leaveOrganization(orgId: string): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/leave`, { method: 'POST' })
}

export async function listOrgMembers(orgId: string): Promise<OrgMembership[]> {
  const data = await apiFetch<{ members: OrgMembership[] }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/members`
  )
  return data.members ?? []
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'admin' | 'member'
): Promise<void> {
  await apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}/role`,
    { method: 'PUT', body: JSON.stringify({ role }) }
  )
}

export async function removeMember(orgId: string, userId: string): Promise<void> {
  await apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}`,
    { method: 'DELETE' }
  )
}

export async function transferOwnership(orgId: string, newOwnerId: string): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/transfer-ownership`, {
    method: 'POST',
    body: JSON.stringify({ new_owner_id: newOwnerId }),
  })
}

export async function regenerateInviteCode(orgId: string): Promise<string> {
  const data = await apiFetch<{ invite_code: string }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/invite-code/regenerate`,
    { method: 'POST' }
  )
  return data.invite_code
}

export async function validateInviteCode(
  code: string
): Promise<{ valid: boolean; organization?: { name: string; org_id: string } }> {
  return apiFetch(`/lira/v1/orgs/invite/${encodeURIComponent(code)}/validate`)
}

// ── Knowledge Base API ────────────────────────────────────────────────────────

export async function triggerCrawl(
  orgId: string,
  url: string,
  options?: { max_pages?: number; max_depth?: number; include_urls?: string[] }
): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/crawl`, {
    method: 'POST',
    body: JSON.stringify({ url, options }),
  })
}

export async function getCrawlStatus(orgId: string): Promise<CrawlStatus> {
  const data = await apiFetch<{ status: Record<string, unknown> }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/crawl/status`
  )
  const s = data.status ?? data
  return {
    status: (s.status as CrawlStatus['status']) ?? 'idle',
    pages_crawled: (s.pages_processed ?? s.pages_crawled ?? 0) as number,
    total_pages: (s.pages_found ?? s.total_pages) as number | undefined,
    started_at: s.started_at as string | undefined,
    completed_at: s.completed_at as string | undefined,
    error: s.error as string | undefined,
  }
}

export async function listKBEntries(orgId: string): Promise<KBEntry[]> {
  const data = await apiFetch<{ entries: KBEntry[]; count: number }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base`
  )
  return data.entries ?? []
}

export async function deleteKBEntry(orgId: string, entryId: string): Promise<void> {
  await apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base/${encodeURIComponent(entryId)}`,
    { method: 'DELETE' }
  )
}

export async function clearKnowledgeBase(orgId: string): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base`, { method: 'DELETE' })
}

// ── Document API ──────────────────────────────────────────────────────────────

export async function uploadDocument(orgId: string, file: File): Promise<DocumentRecord> {
  const token = credentials.getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(
    `${env.VITE_API_URL}/lira/v1/orgs/${encodeURIComponent(orgId)}/documents`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  )

  if (res.status === 401) {
    credentials.clear()
    window.dispatchEvent(new CustomEvent('lira:auth-expired'))
    throw new Error('Session expired — please sign in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as Record<string, string>).error ?? `Upload failed: ${res.status}`)
  }

  const data = (await res.json()) as { document: DocumentRecord }
  return data.document
}

export async function listDocuments(orgId: string): Promise<DocumentRecord[]> {
  const data = await apiFetch<{ documents: DocumentRecord[]; count: number }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents`
  )
  return data.documents ?? []
}

export async function getDocument(orgId: string, docId: string): Promise<DocumentRecord> {
  const data = await apiFetch<{ document: DocumentRecord }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/${encodeURIComponent(docId)}`
  )
  return data.document
}

export async function getDocumentDownloadUrl(orgId: string, docId: string): Promise<string> {
  const data = await apiFetch<{ download_url: string }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/${encodeURIComponent(docId)}/download`
  )
  return data.download_url
}

export async function deleteDocument(orgId: string, docId: string): Promise<void> {
  await apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/${encodeURIComponent(docId)}`,
    { method: 'DELETE' }
  )
}

export async function reprocessDocument(orgId: string, docId: string): Promise<void> {
  await apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/${encodeURIComponent(docId)}/reprocess`,
    { method: 'POST' }
  )
}

// ── Task API ──────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  description: string
  assigned_to?: string
  priority?: TaskPriority
  task_type?: TaskType
  due_date?: string
  session_id?: string
}

export async function createTask(orgId: string, input: CreateTaskInput): Promise<TaskRecord> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function listTasks(
  orgId: string,
  filters?: { status?: TaskStatus; assigned_to?: string; session_id?: string }
): Promise<{ tasks: TaskRecord[]; count: number }> {
  const params = new URLSearchParams()
  if (filters?.status) params.set('status', filters.status)
  if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to)
  if (filters?.session_id) params.set('session_id', filters.session_id)
  const qs = params.toString()
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks${qs ? `?${qs}` : ''}`)
}

export async function getTask(orgId: string, taskId: string): Promise<TaskRecord> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}`)
}

export async function updateTask(
  orgId: string,
  taskId: string,
  updates: Partial<
    Pick<TaskRecord, 'status' | 'assigned_to' | 'priority' | 'title' | 'description' | 'due_date'>
  >
): Promise<TaskRecord> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}`,
    { method: 'PUT', body: JSON.stringify(updates) }
  )
}

export async function deleteTask(orgId: string, taskId: string): Promise<void> {
  await apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}`, {
    method: 'DELETE',
  })
}

export async function executeTask(
  orgId: string,
  taskId: string
): Promise<{ success: boolean; result: string }> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}/execute`,
    { method: 'POST' }
  )
}

export async function getTaskResult(
  orgId: string,
  taskId: string
): Promise<{
  task_id: string
  task_type: string
  execution_status: TaskExecutionStatus
  execution_result: string | null
  execution_s3_key: string | null
  executed_at: string | null
}> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}/result`
  )
}

export async function extractMeetingTasks(
  sessionId: string,
  orgId: string
): Promise<{ tasks: TaskRecord[]; count: number }> {
  return apiFetch(`/lira/v1/meetings/${encodeURIComponent(sessionId)}/extract-tasks`, {
    method: 'POST',
    body: JSON.stringify({ org_id: orgId }),
  })
}

export async function getMeetingTasks(
  sessionId: string,
  orgId: string
): Promise<{ tasks: TaskRecord[]; count: number }> {
  return apiFetch(
    `/lira/v1/meetings/${encodeURIComponent(sessionId)}/tasks?org_id=${encodeURIComponent(orgId)}`
  )
}

// ── Webhook API ───────────────────────────────────────────────────────────────

export async function getWebhookConfig(orgId: string): Promise<WebhookConfig> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/webhooks`)
}

export async function updateWebhookConfig(
  orgId: string,
  config: { slack_webhook_url?: string; email_notifications?: boolean; notify_on?: WebhookEvent[] }
): Promise<WebhookConfig> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/webhooks`, {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

export async function testWebhook(orgId: string): Promise<{ delivered: boolean }> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/webhooks/test`, {
    method: 'POST',
  })
}

export async function describeUrl(orgId: string, url: string): Promise<{ description: string }> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/describe-url`, {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

export async function describeUrlPublic(url: string): Promise<{ description: string }> {
  return apiFetch('/lira/v1/orgs/describe-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

// ── WebSocket URL builder ─────────────────────────────────────────────────────

export function buildWsUrl(overrides?: { token?: string }): string {
  const token = overrides?.token ?? credentials.getToken() ?? ''
  const url = new URL(env.VITE_WS_URL)
  url.searchParams.set('token', token)
  return url.toString()
}
