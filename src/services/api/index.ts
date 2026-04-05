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
  meeting_type?: MeetingType
  meeting_topic?: string
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
    emailVerified?: boolean
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
    // Beta limit interceptor — show modal and throw
    if (res.status === 403 && errBody['code'] === 'BETA_LIMIT_REACHED') {
      const { useUsageStore } = await import('@/app/store')
      useUsageStore.getState().showLimitModal(errBody['feature'] ?? 'unknown', errBody['message'])
      throw new Error('Beta limit reached')
    }

    const msg = errBody['message'] ?? errBody['error'] ?? res.statusText
    const details = errBody['details']
    const fullMsg = details
      ? `${msg} — ${(details as unknown as Array<{ path: string[]; message: string }>)
          .map((d) => `${d.path.join('.')}: ${d.message}`)
          .join(', ')}`
      : msg
    throw new Error(`${res.status}: ${fullMsg}`)
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

/** Platform sign-up — creates a new account. No API key required. Returns { accessToken, user }. */
export async function signup(
  name: string,
  email: string,
  password: string,
  company?: string
): Promise<LoginResponse> {
  const res = await fetch(`${env.VITE_API_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, ...(company ? { company } : {}) }),
  })
  if (!res.ok) {
    let body: Record<string, string> = {}
    try {
      body = await res.json()
    } catch {
      /* ignore */
    }
    throw new Error(body['error'] ?? body['message'] ?? 'Sign-up failed')
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

// ── OTP / Email verification ──────────────────────────────────────────────────

/** Request a new OTP code for the currently-authenticated user's email. */
export async function sendOtp(): Promise<{ message: string }> {
  return apiFetch('/v1/auth/send-otp', { method: 'POST' })
}

/** Verify the 6-digit OTP code. Returns { verified, emailVerified }. */
export async function verifyOtp(
  code: string
): Promise<{ verified: boolean; emailVerified: boolean }> {
  return apiFetch('/v1/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

// ── Password Reset ────────────────────────────────────────────────────────────

/** Request a password reset email. Always resolves (no email enumeration). */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch('/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

/** Reset password using the token from the email link. */
export async function resetPassword(
  email: string,
  token: string,
  password: string
): Promise<{ message: string }> {
  return apiFetch('/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, token, password }),
  })
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

export async function chatAboutMeeting(id: string, message: string): Promise<{ answer: string }> {
  return apiFetch<{ answer: string }>(`/lira/v1/meetings/${encodeURIComponent(id)}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
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

export async function updateMeeting(id: string, patch: { title?: string }): Promise<Meeting> {
  return apiFetch<Meeting>(`/lira/v1/meetings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
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
  is_muted?: boolean
}

export interface DeployBotResponse {
  bot_id: string
  platform: 'google_meet' | 'zoom'
  state: BotState
  session_id: string
  display_name: string
}

export type MeetingType =
  | 'meeting'
  | 'interview'
  | 'standup'
  | 'one_on_one'
  | 'technical'
  | 'brainstorming'
  | 'sales'

/** Deploy a bot to a Google Meet / Zoom meeting */
export async function deployBot(
  meetingUrl: string,
  displayName?: string,
  settings?: Partial<MeetingSettings>,
  orgId?: string,
  meetingTopic?: string,
  meetingType?: MeetingType
): Promise<DeployBotResponse> {
  return apiFetch<DeployBotResponse>('/lira/v1/bot/deploy', {
    method: 'POST',
    body: JSON.stringify({
      meeting_url: meetingUrl,
      display_name: displayName,
      settings,
      ...(orgId ? { org_id: orgId } : {}),
      ...(meetingTopic ? { meeting_topic: meetingTopic } : {}),
      ...(meetingType ? { meeting_type: meetingType } : {}),
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
    body: JSON.stringify({}),
  })
}

/** List all active bots */
export async function listActiveBots(): Promise<BotStatusResponse[]> {
  const data = await apiFetch<{ bots: BotStatusResponse[] }>('/lira/v1/bot/active')
  return data.bots
}

/** Terminate all active bots for the current user */
export async function terminateAllBots(): Promise<{ message: string; terminated_count: number }> {
  return apiFetch('/lira/v1/bot/terminate-all', { method: 'POST', body: JSON.stringify({}) })
}

/** Mute a bot (Google Meet mic + AI output) */
export async function muteBotApi(botId: string): Promise<{ message: string; bot_id: string }> {
  return apiFetch(`/lira/v1/bot/${botId}/mute`, { method: 'POST', body: JSON.stringify({}) })
}

/** Unmute a bot (Google Meet mic + AI output) */
export async function unmuteBotApi(botId: string): Promise<{ message: string; bot_id: string }> {
  return apiFetch(`/lira/v1/bot/${botId}/unmute`, { method: 'POST', body: JSON.stringify({}) })
}

/** Trigger Lira to speak proactively based on conversation context */
export async function triggerBotSpeakApi(
  botId: string
): Promise<{ message: string; bot_id: string }> {
  return apiFetch(`/lira/v1/bot/${botId}/speak`, { method: 'POST', body: JSON.stringify({}) })
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
  logo_url?: string
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
  picture?: string
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
  assignee_user_id?: string
  assignee_email?: string
  priority: TaskPriority
  task_type: TaskType
  status: TaskStatus
  source_quote?: string
  due_date?: string
  created_by: string
  email_execution_enabled?: boolean
  missing_fields?: string[]
  execution_status: TaskExecutionStatus
  execution_result?: string
  execution_s3_key?: string
  executed_at?: string
  // Lira autonomous review
  lira_review_status?: 'reviewing' | 'needs_info' | 'approved'
  lira_needs?: string[]
  lira_message?: string
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

export async function getMe(): Promise<{
  id: string
  name: string | null
  email: string | null
  picture: string | null
}> {
  return apiFetch('/lira/v1/me')
}

export async function updateMyPicture(picture: string): Promise<void> {
  await apiFetch('/lira/v1/me/picture', {
    method: 'PUT',
    body: JSON.stringify({ picture }),
    headers: { 'Content-Type': 'application/json' },
  })
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

export interface DashboardStats {
  meetings_total: number
  tasks_pending: number
  interviews_total: number
  last_activity_at: string | null
}

export async function getDashboardStats(orgId: string): Promise<DashboardStats> {
  return apiFetch<DashboardStats>(`/lira/v1/orgs/${encodeURIComponent(orgId)}/stats`)
}

// ── Knowledge Base API ─────────────────────────────────────────────────────────

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

// ── Connected Documents API ───────────────────────────────────────────────────

export interface ConnectedFile {
  id: string
  name: string
  mimeType: string
  webUrl?: string
  createdTime?: string
  size?: number
  source: 'google_drive' | 'github'
  repo?: string // GitHub only
  path?: string // GitHub only
  ref?: string // GitHub only
}

export interface ConnectedSourceStatus {
  connected: boolean
  files: ConnectedFile[]
  error?: string
}

export interface ConnectedDocumentsResponse {
  sources: {
    google_drive: ConnectedSourceStatus
    github: ConnectedSourceStatus
  }
}

export async function listConnectedDocuments(orgId: string): Promise<ConnectedDocumentsResponse> {
  return apiFetch<ConnectedDocumentsResponse>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/connected`
  )
}

export async function importConnectedDocument(
  orgId: string,
  source: 'google_drive' | 'github',
  fileId: string,
  fileName: string,
  mimeType?: string,
  repo?: string,
  path?: string,
  ref?: string
): Promise<DocumentRecord> {
  const body: Record<string, string> = { source, file_id: fileId, file_name: fileName }
  if (mimeType) body.mime_type = mimeType
  if (repo) body.repo = repo
  if (path) body.path = path
  if (ref) body.ref = ref

  const data = await apiFetch<{ document: DocumentRecord }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents/import`,
    { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
  )
  return data.document
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
    Pick<
      TaskRecord,
      | 'status'
      | 'assigned_to'
      | 'assignee_email'
      | 'priority'
      | 'title'
      | 'description'
      | 'due_date'
      | 'email_execution_enabled'
    >
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

export async function liraReviewTask(orgId: string, taskId: string): Promise<TaskRecord> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/tasks/${encodeURIComponent(taskId)}/lira-review`,
    { method: 'POST', body: '{}' }
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

// ── User Notifications API ───────────────────────────────────────────────────

export interface UserBackendNotif {
  notif_id: string
  user_id: string
  kind: 'task_assigned'
  task_id: string
  task_title: string
  org_id: string
  assigned_by: string
  created_at: string
  read: boolean
}

export async function listMyNotifications(): Promise<UserBackendNotif[]> {
  const data = await apiFetch<{ notifications: UserBackendNotif[]; count: number }>(
    '/lira/v1/me/notifications'
  )
  return data.notifications ?? []
}

export async function markBackendNotifRead(notifId: string): Promise<void> {
  await apiFetch(`/lira/v1/me/notifications/${encodeURIComponent(notifId)}/read`, {
    method: 'PUT',
  })
}

// ── Member Contributions ──────────────────────────────────────────────────────

export interface MemberContribution {
  session_id: string
  title: string
  date: string
  message_count: number
  word_count: number
  highlights: string[]
}

export interface MemberContributionsResponse {
  contributions: MemberContribution[]
  total_meetings: number
  total_messages: number
  total_words: number
}

export async function getMemberContributions(
  orgId: string,
  userId: string
): Promise<MemberContributionsResponse> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/members/${encodeURIComponent(userId)}/contributions`
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
// ── Interview Types ───────────────────────────────────────────────────────────

export type InterviewStatus =
  | 'draft'
  | 'scheduled'
  | 'bot_deployed'
  | 'in_progress'
  | 'evaluating'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type InterviewMode = 'solo' | 'copilot' | 'shadow'
export type ExperienceLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal'
export type QuestionCategory =
  | 'technical'
  | 'behavioral'
  | 'situational'
  | 'cultural'
  | 'warm_up'
  | 'custom'
export type InterviewPersonality = 'supportive' | 'challenger' | 'facilitator' | 'analyst'
export type QuestionGenMethod = 'manual' | 'ai_generated' | 'hybrid'
export type DecisionOutcome = 'hire' | 'no_hire' | 'next_round' | 'undecided'
export type InterviewPurpose =
  | 'introduction'
  | 'technical'
  | 'cultural_fit'
  | 'system_design'
  | 'behavioral'
  | 'panel'
  | 'final'
  | 'onboarding'
  | 'alignment'
  | 'custom'

export interface InterviewQuestion {
  id: string
  text: string
  category: QuestionCategory
  skill_target?: string
  expected_depth: 'brief' | 'moderate' | 'detailed'
  follow_up_enabled: boolean
  order?: number
  ai_generated?: boolean
  asked?: boolean
}

export interface EvaluationCriterion {
  id: string
  name: string
  description: string
  weight: number
}

export interface CriterionScore {
  criterion_id: string
  criterion_name: string
  score: number
  rationale: string
  evidence_quotes: string[]
}

export interface QASummary {
  question: string
  answer_summary: string
  score: number
  analysis: string
  key_points: string[]
  answer_quality: 'excellent' | 'good' | 'adequate' | 'poor'
  follow_ups?: { question: string; answer_summary: string }[]
}

export interface InterviewEvaluation {
  // Phase 1: Always populated (auto after interview)
  qa_summary: QASummary[]
  interview_summary: string
  interview_duration_minutes: number
  questions_asked: number
  questions_answered: number
  questions_skipped: number
  generated_at: string
  re_evaluation_count?: number

  // Phase 2: Populated on demand (Generate Score button)
  overall_score: number | null
  recommendation: 'strongly_recommend' | 'recommend' | 'neutral' | 'not_recommended' | null
  recommendation_reasoning: string | null
  strengths: string[] | null
  concerns: string[] | null
  notable_quotes:
    | { quote: string; context: string; sentiment: 'positive' | 'neutral' | 'negative' }[]
    | null
  candidate_engagement: 'high' | 'moderate' | 'low' | null
  score_generated_at: string | null

  // Legacy fields (backward compat)
  criterion_scores?: CriterionScore[]
  ai_summary?: string
  ai_detailed_report?: string
}

export interface ResumeExperience {
  role: string
  company: string
  duration_months?: number
  highlights: string[]
}

export interface ResumeEducation {
  degree: string
  institution: string
  year?: number
}

export interface ResumeData {
  raw_text: string
  parsed?: {
    skills: string[]
    experience: ResumeExperience[]
    education: ResumeEducation[]
    summary?: string
  }
  s3_key: string
  filename: string
  uploaded_at: string
  parse_method: 'pdf_extract' | 'ai_extraction' | 'raw_text_only'
  parse_failed?: boolean
}

export interface Interview {
  interview_id: string
  org_id: string
  created_by: string
  parent_interview_id?: string
  round: number
  interview_purpose?: InterviewPurpose
  custom_purpose?: string
  title: string
  department?: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  salary_range?: string
  salary_currency?: string
  salary_min?: number
  salary_max?: number
  candidate_name: string
  candidate_email: string
  mode: InterviewMode
  meeting_link: string
  session_id?: string
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  time_limit_minutes: number
  personality: InterviewPersonality
  ai_name_override?: string
  no_show_timeout_seconds?: number
  status: InterviewStatus
  questions: InterviewQuestion[]
  question_generation: QuestionGenMethod
  evaluation_criteria: EvaluationCriterion[]
  evaluation?: InterviewEvaluation
  resume?: ResumeData
  decision?: DecisionOutcome
  decision_notes?: string
  decision_made_by?: string
  decision_made_at?: string
  language?: string
  created_at: string
  updated_at: string
}

export interface CreateInterviewInput {
  title: string
  department?: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  salary_range?: string
  salary_currency?: string
  salary_min?: number
  salary_max?: number
  candidate_name?: string
  candidate_email?: string
  mode: InterviewMode
  meeting_link?: string
  scheduled_at?: string
  time_limit_minutes: number
  personality: InterviewPersonality
  ai_name_override?: string
  no_show_timeout_seconds?: number
  parent_interview_id?: string
  interview_purpose?: InterviewPurpose
  custom_purpose?: string
  questions?: Omit<InterviewQuestion, 'id' | 'ai_generated' | 'asked'>[]
  question_generation: QuestionGenMethod
  evaluation_criteria?: Omit<EvaluationCriterion, 'id'>[]
  language?: string
}

export type UpdateInterviewInput = Partial<Omit<CreateInterviewInput, 'candidate_email'>>

export interface InterviewDraft {
  title: string
  department: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  salary_range: string
  time_limit_minutes: number
  personality: InterviewPersonality
  mode: InterviewMode
  questions: Omit<InterviewQuestion, 'id' | 'ai_generated' | 'asked'>[]
  meeting_link: ''
  scheduled_at: ''
  language?: string
}

export interface GenerateQuestionsInput {
  title: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  resume_text?: string
  question_count?: number
  categories: QuestionCategory[]
  language?: string
}

// ── Interview API ─────────────────────────────────────────────────────────────

export async function listInterviews(
  orgId: string,
  status?: InterviewStatus
): Promise<Interview[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : ''
  const data = await apiFetch<{ interviews: Interview[]; count: number }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews${params}`
  )
  return data.interviews ?? []
}

export async function createInterviewRecord(
  orgId: string,
  input: CreateInterviewInput
): Promise<Interview> {
  const data = await apiFetch<{ interview: Interview }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews`,
    { method: 'POST', body: JSON.stringify(input) }
  )
  return data.interview
}

export async function getInterviewRecord(orgId: string, interviewId: string): Promise<Interview> {
  const data = await apiFetch<{ interview: Interview }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}`
  )
  return data.interview
}

export async function getRelatedInterviews(
  orgId: string,
  interviewId: string
): Promise<Interview[]> {
  const data = await apiFetch<{ interviews: Interview[] }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/related`
  )
  return data.interviews ?? []
}

export async function updateInterviewRecord(
  orgId: string,
  interviewId: string,
  input: UpdateInterviewInput
): Promise<Interview> {
  const data = await apiFetch<{ interview: Interview }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}`,
    { method: 'PUT', body: JSON.stringify(input) }
  )
  return data.interview
}

export async function deleteInterviewRecord(orgId: string, interviewId: string): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}`,
    { method: 'DELETE' }
  )
}

export async function startInterviewSession(
  orgId: string,
  interviewId: string,
  options?: { meeting_link?: string; candidate_name?: string; language?: string }
): Promise<{ bot_id: string; session_id: string; interview: Interview }> {
  const body: Record<string, string> = {}
  if (options?.meeting_link) body.meeting_link = options.meeting_link
  if (options?.candidate_name) body.candidate_name = options.candidate_name
  if (options?.language) body.language = options.language
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/start`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  )
}

export async function cancelInterviewSession(orgId: string, interviewId: string): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/cancel`,
    { method: 'POST' }
  )
}

export async function uploadInterviewResume(
  orgId: string,
  interviewId: string,
  file: File
): Promise<{ resume: ResumeData | null; parse_failed: boolean; message: string }> {
  const token = credentials.getToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(
    `${env.VITE_API_URL}/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/resume`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }
  )
  if (res.status === 401) {
    credentials.clear()
    window.dispatchEvent(new CustomEvent('lira:auth-expired'))
    throw new Error('Session expired — please sign in again.')
  }
  if (!res.ok) {
    let errBody: Record<string, string> = {}
    try {
      errBody = await res.json()
    } catch {
      /* ignore */
    }
    throw new Error(errBody['error'] ?? res.statusText)
  }
  return res.json()
}

export async function runInterviewEvaluation(
  orgId: string,
  interviewId: string
): Promise<{ evaluation: InterviewEvaluation }> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/evaluate`,
    { method: 'POST', body: JSON.stringify({}) }
  )
}

export async function generateInterviewScore(
  orgId: string,
  interviewId: string
): Promise<{ evaluation: InterviewEvaluation }> {
  return apiFetch(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/generate-score`,
    { method: 'POST', body: JSON.stringify({}) }
  )
}

export async function recordInterviewDecision(
  orgId: string,
  interviewId: string,
  decision: DecisionOutcome,
  notes?: string
): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/${encodeURIComponent(interviewId)}/decision`,
    { method: 'PUT', body: JSON.stringify({ decision, notes }) }
  )
}

export async function draftInterviewRecord(orgId: string, prompt: string): Promise<InterviewDraft> {
  const data = await apiFetch<{ draft: InterviewDraft }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/draft`,
    { method: 'POST', body: JSON.stringify({ prompt }) }
  )
  return data.draft
}

export async function generateInterviewQuestions(
  orgId: string,
  input: GenerateQuestionsInput
): Promise<InterviewQuestion[]> {
  const data = await apiFetch<{ questions: InterviewQuestion[] }>(
    `/lira/v1/orgs/${encodeURIComponent(orgId)}/interviews/generate-questions`,
    { method: 'POST', body: JSON.stringify(input) }
  )
  return data.questions ?? []
}

// ── Email config ──────────────────────────────────────────────────────────────

export interface OrgEmailConfig {
  org_id: string
  mode: 'platform' | 'custom'
  custom_domain?: string
  domain_verified: boolean
  from_name?: string
  email_notifications_enabled: boolean
  notify_on: string[]
  ai_reply_enabled: boolean
  dns_records?: EmailDnsRecord[]
  updated_at: string
}

export type EmailNotifyEvent = 'task_created' | 'task_completed' | 'meeting_ended' | 'summary_ready'

export async function getEmailConfig(orgId: string): Promise<OrgEmailConfig> {
  return apiFetch<OrgEmailConfig>(`/lira/v1/email/config?orgId=${encodeURIComponent(orgId)}`)
}

export async function updateEmailConfig(
  orgId: string,
  updates: {
    from_name?: string
    email_notifications_enabled?: boolean
    notify_on?: string[]
    ai_reply_enabled?: boolean
  }
): Promise<OrgEmailConfig> {
  return apiFetch<OrgEmailConfig>(`/lira/v1/email/config?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

export interface EmailDnsRecord {
  type: string
  name: string
  value: string
  ttl?: string
  priority?: number
}

export async function registerEmailDomain(
  orgId: string,
  domain: string
): Promise<{ resendDomainId: string; dnsRecords: EmailDnsRecord[] }> {
  return apiFetch<{ resendDomainId: string; dnsRecords: EmailDnsRecord[] }>(
    `/lira/v1/email/domain?orgId=${encodeURIComponent(orgId)}`,
    { method: 'POST', body: JSON.stringify({ domain }) }
  )
}

export async function checkEmailDomainStatus(
  orgId: string
): Promise<{ status: string; verified: boolean }> {
  return apiFetch<{ status: string; verified: boolean }>(
    `/lira/v1/email/domain/status?orgId=${encodeURIComponent(orgId)}`
  )
}

// ── Email Threads (inbox) ─────────────────────────────────────────────────────

export interface ThreadMessage {
  role: 'lira' | 'member'
  body: string
  timestamp: string
}

export interface EmailThread {
  threadId: string
  orgId: string
  memberId: string
  contextType: string
  contextId: string
  subject?: string
  recipient?: string
  messages: ThreadMessage[]
  status: 'open' | 'escalated' | 'closed'
  created_at: string
  updated_at: string
}

export async function listEmailThreads(orgId: string): Promise<EmailThread[]> {
  return apiFetch<EmailThread[]>(`/lira/v1/email/threads?orgId=${encodeURIComponent(orgId)}`)
}

export async function getEmailThread(orgId: string, threadId: string): Promise<EmailThread> {
  return apiFetch<EmailThread>(
    `/lira/v1/email/threads/${encodeURIComponent(threadId)}?orgId=${encodeURIComponent(orgId)}`
  )
}

// ── Linear Integration API ────────────────────────────────────────────────────

export interface LinearStatus {
  connected: boolean
  sync_enabled?: boolean
  workspace_id?: string
  default_team_id?: string
  connected_at?: string
}

export interface LinearTeam {
  id: string
  name: string
  key?: string
}

export interface LinearMember {
  id: string
  name: string
  email?: string
  displayName?: string
}

export interface MemberMapping {
  userId: string
  orgId: string
  provider: 'linear'
  external_id: string
  external_email?: string
  status: 'resolved' | 'unresolved'
  created_at: string
  updated_at: string
}

export function getLinearAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/linear/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getLinearStatus(orgId: string): Promise<LinearStatus> {
  return apiFetch<LinearStatus>(
    `/lira/v1/integrations/linear/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectLinear(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/linear?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listLinearTeams(orgId: string): Promise<LinearTeam[]> {
  const data = await apiFetch<{ teams: LinearTeam[] }>(
    `/lira/v1/integrations/linear/teams?orgId=${encodeURIComponent(orgId)}`
  )
  return data.teams
}

export async function listLinearMembers(orgId: string): Promise<LinearMember[]> {
  const data = await apiFetch<{ members: LinearMember[] }>(
    `/lira/v1/integrations/linear/members?orgId=${encodeURIComponent(orgId)}`
  )
  return data.members
}

export async function setLinearDefaultTeam(orgId: string, teamId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/linear/team?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  })
}

export async function listMemberMappings(orgId: string): Promise<MemberMapping[]> {
  const data = await apiFetch<{ mappings: MemberMapping[] }>(
    `/lira/v1/integrations/linear/member-map?orgId=${encodeURIComponent(orgId)}`
  )
  return data.mappings
}

export async function saveMemberMapping(
  orgId: string,
  userId: string,
  externalId: string,
  externalEmail?: string
): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/integrations/linear/member-map?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, externalId, externalEmail }),
    }
  )
}

// ── Slack Integration API ─────────────────────────────────────────────────────

export interface SlackStatus {
  connected: boolean
  sync_enabled?: boolean
  workspace_id?: string
  default_channel_id?: string
  connected_at?: string
}

export interface SlackChannel {
  id: string
  name: string
  is_private: boolean
  num_members?: number
}

export interface SlackMember {
  id: string
  name: string
  real_name: string
  email?: string
  display_name?: string
}

export interface SlackMemberMapping {
  userId: string
  orgId: string
  provider: 'slack'
  external_id: string
  external_email?: string
  status: 'resolved' | 'unresolved'
  created_at: string
  updated_at: string
}

export function getSlackAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/slack/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getSlackStatus(orgId: string): Promise<SlackStatus> {
  return apiFetch<SlackStatus>(
    `/lira/v1/integrations/slack/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectSlack(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/slack?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listSlackChannels(orgId: string): Promise<SlackChannel[]> {
  const data = await apiFetch<{ channels: SlackChannel[] }>(
    `/lira/v1/integrations/slack/channels?orgId=${encodeURIComponent(orgId)}`
  )
  return data.channels
}

export async function setSlackDefaultChannel(orgId: string, channelId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/slack/channel?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId }),
  })
}

export async function listSlackMembers(orgId: string): Promise<SlackMember[]> {
  const data = await apiFetch<{ members: SlackMember[] }>(
    `/lira/v1/integrations/slack/members?orgId=${encodeURIComponent(orgId)}`
  )
  return data.members
}

export async function listSlackMemberMappings(orgId: string): Promise<SlackMemberMapping[]> {
  const data = await apiFetch<{ mappings: SlackMemberMapping[] }>(
    `/lira/v1/integrations/slack/member-map?orgId=${encodeURIComponent(orgId)}`
  )
  return data.mappings
}

export async function saveSlackMemberMapping(
  orgId: string,
  userId: string,
  externalId: string,
  externalEmail?: string
): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/integrations/slack/member-map?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, externalId, externalEmail }),
    }
  )
}

// ── Microsoft Teams Integration API ───────────────────────────────────────────

export interface TeamsStatus {
  connected: boolean
  sync_enabled?: boolean
  default_team_id?: string
  default_channel_id?: string
  connected_at?: string
}

export interface TeamsTeam {
  id: string
  displayName: string
  description?: string
}

export interface TeamsChannel {
  id: string
  displayName: string
  description?: string
  membershipType: string
}

export interface TeamsMember {
  id: string
  displayName: string
  mail?: string
  userPrincipalName: string
}

export interface TeamsMemberMapping {
  userId: string
  orgId: string
  provider: 'teams'
  external_id: string
  external_email?: string
  status: 'resolved' | 'unresolved'
  created_at: string
  updated_at: string
}

export function getTeamsAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/teams/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getTeamsStatus(orgId: string): Promise<TeamsStatus> {
  return apiFetch<TeamsStatus>(
    `/lira/v1/integrations/teams/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectTeams(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/teams?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listTeamsTeams(orgId: string): Promise<TeamsTeam[]> {
  const data = await apiFetch<{ teams: TeamsTeam[] }>(
    `/lira/v1/integrations/teams/teams?orgId=${encodeURIComponent(orgId)}`
  )
  return data.teams
}

export async function listTeamsChannels(orgId: string, teamId: string): Promise<TeamsChannel[]> {
  const data = await apiFetch<{ channels: TeamsChannel[] }>(
    `/lira/v1/integrations/teams/channels?orgId=${encodeURIComponent(orgId)}&teamId=${encodeURIComponent(teamId)}`
  )
  return data.channels
}

export async function setTeamsDefaultTeam(orgId: string, teamId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/teams/team?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamId }),
  })
}

export async function setTeamsDefaultChannel(orgId: string, channelId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/teams/channel?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channelId }),
  })
}

export async function listTeamsMembers(orgId: string, teamId: string): Promise<TeamsMember[]> {
  const data = await apiFetch<{ members: TeamsMember[] }>(
    `/lira/v1/integrations/teams/members?orgId=${encodeURIComponent(orgId)}&teamId=${encodeURIComponent(teamId)}`
  )
  return data.members
}

export async function listTeamsMemberMappings(orgId: string): Promise<TeamsMemberMapping[]> {
  const data = await apiFetch<{ mappings: TeamsMemberMapping[] }>(
    `/lira/v1/integrations/teams/member-map?orgId=${encodeURIComponent(orgId)}`
  )
  return data.mappings
}

export async function saveTeamsMemberMapping(
  orgId: string,
  userId: string,
  externalId: string,
  externalEmail?: string
): Promise<void> {
  await apiFetch<void>(
    `/lira/v1/integrations/teams/member-map?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, externalId, externalEmail }),
    }
  )
}

// ── Google Calendar + Drive ──────────────────────────────────────────────────

export interface GoogleStatus {
  connected: boolean
  default_calendar_id?: string
  default_folder_id?: string
  connected_at?: string
}

export interface GoogleCalendar {
  id: string
  summary: string
  primary?: boolean
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  htmlLink: string
  attendees?: { email: string; responseStatus?: string }[]
}

export interface GoogleDriveFolder {
  id: string
  name: string
  mimeType: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  createdTime?: string
  size?: string
  modifiedTime?: string
}

export interface GoogleFileContent {
  content: string
  mimeType: string
}

export interface GoogleSheetData {
  values: string[][]
  spreadsheetId: string
  range: string
}

export interface GoogleDocContent {
  title: string
  body: string
}

export function getGoogleAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/google/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getGoogleStatus(orgId: string): Promise<GoogleStatus> {
  return apiFetch<GoogleStatus>(
    `/lira/v1/integrations/google/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectGoogle(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/google?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listGoogleCalendars(orgId: string): Promise<GoogleCalendar[]> {
  const data = await apiFetch<{ calendars: GoogleCalendar[] }>(
    `/lira/v1/integrations/google/calendars?orgId=${encodeURIComponent(orgId)}`
  )
  return data.calendars
}

export async function setGoogleDefaultCalendar(orgId: string, calendarId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/google/calendar?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calendarId }),
  })
}

export async function listGoogleEvents(orgId: string): Promise<GoogleCalendarEvent[]> {
  const data = await apiFetch<{ events: GoogleCalendarEvent[] }>(
    `/lira/v1/integrations/google/events?orgId=${encodeURIComponent(orgId)}`
  )
  return data.events
}

export async function createGoogleEvent(
  orgId: string,
  event: { summary: string; description?: string; start: string; end: string; attendees?: string[] }
): Promise<GoogleCalendarEvent> {
  return apiFetch<{ event: GoogleCalendarEvent }>(
    `/lira/v1/integrations/google/events?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    }
  ).then((r) => r.event)
}

export async function listGoogleDriveFolders(
  orgId: string,
  parentId?: string
): Promise<GoogleDriveFolder[]> {
  let url = `/lira/v1/integrations/google/folders?orgId=${encodeURIComponent(orgId)}`
  if (parentId) url += `&parentId=${encodeURIComponent(parentId)}`
  const data = await apiFetch<{ folders: GoogleDriveFolder[] }>(url)
  return data.folders
}

export async function setGoogleDefaultFolder(orgId: string, folderId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/google/folder?orgId=${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folderId }),
  })
}

export async function createGoogleDriveFolder(
  orgId: string,
  name: string,
  parentId?: string
): Promise<GoogleDriveFolder> {
  return apiFetch<{ folder: GoogleDriveFolder }>(
    `/lira/v1/integrations/google/folders?orgId=${encodeURIComponent(orgId)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    }
  ).then((r) => r.folder)
}

// ── Google Drive file operations ─────────────────────────────────────────────

export async function listGoogleDriveFiles(
  orgId: string,
  folderId?: string
): Promise<GoogleDriveFile[]> {
  let url = `/lira/v1/integrations/google/files?orgId=${encodeURIComponent(orgId)}`
  if (folderId) url += `&folderId=${encodeURIComponent(folderId)}`
  const data = await apiFetch<{ files: GoogleDriveFile[] }>(url)
  return data.files
}

export async function searchGoogleDriveFiles(
  orgId: string,
  query: string
): Promise<GoogleDriveFile[]> {
  const url = `/lira/v1/integrations/google/files/search?orgId=${encodeURIComponent(orgId)}&q=${encodeURIComponent(query)}`
  const data = await apiFetch<{ files: GoogleDriveFile[] }>(url)
  return data.files
}

export async function getGoogleDriveFileMetadata(
  orgId: string,
  fileId: string
): Promise<GoogleDriveFile> {
  const data = await apiFetch<{ file: GoogleDriveFile }>(
    `/lira/v1/integrations/google/files/${encodeURIComponent(fileId)}?orgId=${encodeURIComponent(orgId)}`
  )
  return data.file
}

export async function readGoogleDriveFileContent(
  orgId: string,
  fileId: string,
  mimeType: string
): Promise<GoogleFileContent> {
  return apiFetch<GoogleFileContent>(
    `/lira/v1/integrations/google/files/${encodeURIComponent(fileId)}/content?orgId=${encodeURIComponent(orgId)}&mimeType=${encodeURIComponent(mimeType)}`
  )
}

export async function readGoogleSheetData(
  orgId: string,
  spreadsheetId: string,
  range?: string
): Promise<GoogleSheetData> {
  let url = `/lira/v1/integrations/google/sheets/${encodeURIComponent(spreadsheetId)}?orgId=${encodeURIComponent(orgId)}`
  if (range) url += `&range=${encodeURIComponent(range)}`
  return apiFetch<GoogleSheetData>(url)
}

export async function readGoogleDocContent(
  orgId: string,
  documentId: string
): Promise<GoogleDocContent> {
  return apiFetch<GoogleDocContent>(
    `/lira/v1/integrations/google/docs/${encodeURIComponent(documentId)}?orgId=${encodeURIComponent(orgId)}`
  )
}

// ── GitHub Integration Types ───────────────────────────────────────────────────

export interface GitHubStatus {
  connected: boolean
  username?: string
  connected_at?: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  description: string | null
  html_url: string
  default_branch: string
  language: string | null
  updated_at: string
}

export interface GitHubBranch {
  name: string
  commit: { sha: string }
  protected: boolean
}

export interface GitHubFile {
  name: string
  path: string
  sha: string
  size: number
  type: 'file' | 'dir' | 'submodule' | 'symlink'
  html_url: string
  download_url: string | null
}

export interface GitHubFileContent {
  name: string
  path: string
  sha: string
  content: string
  size: number
  html_url: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  html_url: string
  labels: { name: string; color: string }[]
  assignees: { login: string; avatar_url: string }[]
  created_at: string
  updated_at: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed' | 'merged'
  html_url: string
  head: { ref: string; sha: string }
  base: { ref: string }
  created_at: string
  updated_at: string
  merged: boolean
}

// ── GitHub Integration API ─────────────────────────────────────────────────────

export function getGitHubAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/github/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getGitHubStatus(orgId: string): Promise<GitHubStatus> {
  return apiFetch<GitHubStatus>(
    `/lira/v1/integrations/github/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectGitHub(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/github?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listGitHubRepos(orgId: string): Promise<GitHubRepo[]> {
  const data = await apiFetch<{ repos: GitHubRepo[] }>(
    `/lira/v1/integrations/github/repos?orgId=${encodeURIComponent(orgId)}`
  )
  return data.repos
}

export async function listGitHubBranches(
  orgId: string,
  owner: string,
  repo: string
): Promise<GitHubBranch[]> {
  const data = await apiFetch<{ branches: GitHubBranch[] }>(
    `/lira/v1/integrations/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?orgId=${encodeURIComponent(orgId)}`
  )
  return data.branches
}

export async function listGitHubFiles(
  orgId: string,
  owner: string,
  repo: string,
  path?: string,
  ref?: string
): Promise<GitHubFile[]> {
  let url = `/lira/v1/integrations/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/files?orgId=${encodeURIComponent(orgId)}`
  if (path) url += `&path=${encodeURIComponent(path)}`
  if (ref) url += `&ref=${encodeURIComponent(ref)}`
  const data = await apiFetch<{ files: GitHubFile[] }>(url)
  return data.files
}

export async function readGitHubFile(
  orgId: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
): Promise<GitHubFileContent> {
  let url = `/lira/v1/integrations/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/file?orgId=${encodeURIComponent(orgId)}&path=${encodeURIComponent(path)}`
  if (ref) url += `&ref=${encodeURIComponent(ref)}`
  const data = await apiFetch<{ file: GitHubFileContent }>(url)
  return data.file
}

export async function listGitHubIssues(
  orgId: string,
  owner: string,
  repo: string,
  state?: string
): Promise<GitHubIssue[]> {
  let url = `/lira/v1/integrations/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?orgId=${encodeURIComponent(orgId)}`
  if (state) url += `&state=${encodeURIComponent(state)}`
  const data = await apiFetch<{ issues: GitHubIssue[] }>(url)
  return data.issues
}

export async function listGitHubPullRequests(
  orgId: string,
  owner: string,
  repo: string,
  state?: string
): Promise<GitHubPullRequest[]> {
  let url = `/lira/v1/integrations/github/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?orgId=${encodeURIComponent(orgId)}`
  if (state) url += `&state=${encodeURIComponent(state)}`
  const data = await apiFetch<{ pulls: GitHubPullRequest[] }>(url)
  return data.pulls
}

// ── Greenhouse Integration Types ───────────────────────────────────────────────

export interface GreenhouseStatus {
  connected: boolean
  connected_at?: string
}

export interface GreenhouseJob {
  id: number
  name: string
  status: 'open' | 'closed' | 'draft'
  departments: { id: number; name: string }[]
  offices: { id: number; name: string }[]
  opened_at: string | null
  closed_at: string | null
  updated_at: string
}

export interface GreenhouseCandidate {
  id: number
  first_name: string
  last_name: string
  company: string | null
  title: string | null
  emails: { value: string; type: string }[]
  applications: { id: number; job: { id: number; name: string } | null; status: string }[]
  tags: string[]
  created_at: string
  updated_at: string
}

export interface GreenhouseApplication {
  id: number
  candidate_id: number
  job_id: number | null
  status: string
  current_stage: { id: number; name: string } | null
  source: { id: number; public_name: string } | null
  applied_at: string
  last_activity_at: string
}

export interface GreenhouseOffer {
  id: number
  application_id: number
  status: 'unresolved' | 'accepted' | 'rejected' | 'deprecated'
  created_at: string
  sent_at: string | null
  resolved_at: string | null
  starts_at: string | null
}

// ── Greenhouse Integration API ─────────────────────────────────────────────────

export async function connectGreenhouse(
  orgId: string,
  apiKey: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(
    `/lira/v1/integrations/greenhouse/connect?orgId=${encodeURIComponent(orgId)}`,
    { method: 'POST', body: JSON.stringify({ apiKey }) }
  )
}

export async function getGreenhouseStatus(orgId: string): Promise<GreenhouseStatus> {
  return apiFetch<GreenhouseStatus>(
    `/lira/v1/integrations/greenhouse/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectGreenhouse(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/greenhouse?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listGreenhouseJobs(orgId: string, status?: string): Promise<GreenhouseJob[]> {
  let url = `/lira/v1/integrations/greenhouse/jobs?orgId=${encodeURIComponent(orgId)}`
  if (status) url += `&status=${encodeURIComponent(status)}`
  const data = await apiFetch<{ jobs: GreenhouseJob[] }>(url)
  return data.jobs
}

export async function listGreenhouseCandidates(
  orgId: string,
  query?: string
): Promise<GreenhouseCandidate[]> {
  let url = `/lira/v1/integrations/greenhouse/candidates?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  const data = await apiFetch<{ candidates: GreenhouseCandidate[] }>(url)
  return data.candidates
}

export async function listGreenhouseApplications(
  orgId: string,
  jobId?: number
): Promise<GreenhouseApplication[]> {
  let url = `/lira/v1/integrations/greenhouse/applications?orgId=${encodeURIComponent(orgId)}`
  if (jobId) url += `&jobId=${encodeURIComponent(String(jobId))}`
  const data = await apiFetch<{ applications: GreenhouseApplication[] }>(url)
  return data.applications
}

export async function listGreenhouseOffers(orgId: string): Promise<GreenhouseOffer[]> {
  const data = await apiFetch<{ offers: GreenhouseOffer[] }>(
    `/lira/v1/integrations/greenhouse/offers?orgId=${encodeURIComponent(orgId)}`
  )
  return data.offers
}

// ── HubSpot Integration Types ────────────────────────────────────────────────

export interface HubSpotStatus {
  connected: boolean
  connected_at?: string
  connected_by?: string
}

export interface HubSpotContact {
  id: string
  properties: {
    firstname?: string
    lastname?: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    lifecyclestage?: string
    hs_lead_status?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: string | undefined
  }
  createdAt: string
  updatedAt: string
}

export interface HubSpotCompany {
  id: string
  properties: {
    name?: string
    domain?: string
    industry?: string
    phone?: string
    city?: string
    state?: string
    country?: string
    numberofemployees?: string
    annualrevenue?: string
    description?: string
    createdate?: string
    lastmodifieddate?: string
    [key: string]: string | undefined
  }
  createdAt: string
  updatedAt: string
}

export interface HubSpotDeal {
  id: string
  properties: {
    dealname?: string
    dealstage?: string
    pipeline?: string
    amount?: string
    closedate?: string
    hs_lastmodifieddate?: string
    createdate?: string
    hubspot_owner_id?: string
    [key: string]: string | undefined
  }
  createdAt: string
  updatedAt: string
}

export interface HubSpotPipeline {
  id: string
  label: string
  displayOrder: number
  stages: { id: string; label: string; displayOrder: number }[]
}

export interface HubSpotOwner {
  id: string
  email: string
  firstName: string
  lastName: string
}

// ── HubSpot Integration API ─────────────────────────────────────────────────

export function getHubSpotAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/hubspot/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getHubSpotStatus(orgId: string): Promise<HubSpotStatus> {
  return apiFetch<HubSpotStatus>(
    `/lira/v1/integrations/hubspot/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectHubSpot(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/hubspot?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listHubSpotContacts(
  orgId: string,
  query?: string,
  after?: string
): Promise<{ contacts: HubSpotContact[]; paging?: { next?: { after: string } } }> {
  let url = `/lira/v1/integrations/hubspot/contacts?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  if (after) url += `&after=${encodeURIComponent(after)}`
  return apiFetch(url)
}

export async function listHubSpotCompanies(
  orgId: string,
  query?: string,
  after?: string
): Promise<{ companies: HubSpotCompany[]; paging?: { next?: { after: string } } }> {
  let url = `/lira/v1/integrations/hubspot/companies?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  if (after) url += `&after=${encodeURIComponent(after)}`
  return apiFetch(url)
}

export async function listHubSpotDeals(
  orgId: string,
  query?: string,
  after?: string
): Promise<{ deals: HubSpotDeal[]; paging?: { next?: { after: string } } }> {
  let url = `/lira/v1/integrations/hubspot/deals?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  if (after) url += `&after=${encodeURIComponent(after)}`
  return apiFetch(url)
}

export async function listHubSpotPipelines(orgId: string): Promise<HubSpotPipeline[]> {
  const data = await apiFetch<{ pipelines: HubSpotPipeline[] }>(
    `/lira/v1/integrations/hubspot/pipelines?orgId=${encodeURIComponent(orgId)}`
  )
  return data.pipelines
}

export async function listHubSpotOwners(orgId: string): Promise<HubSpotOwner[]> {
  const data = await apiFetch<{ owners: HubSpotOwner[] }>(
    `/lira/v1/integrations/hubspot/owners?orgId=${encodeURIComponent(orgId)}`
  )
  return data.owners
}

// ── Salesforce Types ─────────────────────────────────────────────────────────

export interface SalesforceStatus {
  connected: boolean
  connected_at?: string
  connected_by?: string
}

export interface SalesforceContact {
  Id: string
  FirstName: string | null
  LastName: string
  Email: string | null
  Phone: string | null
  AccountId: string | null
  Title: string | null
  Department: string | null
}

export interface SalesforceAccount {
  Id: string
  Name: string
  Industry: string | null
  Type: string | null
  Phone: string | null
  Website: string | null
  BillingCity: string | null
  BillingState: string | null
}

export interface SalesforceOpportunity {
  Id: string
  Name: string
  StageName: string
  Amount: number | null
  CloseDate: string
  AccountId: string | null
  OwnerId: string | null
  Probability: number | null
  IsClosed: boolean
  IsWon: boolean
}

export interface SalesforceLead {
  Id: string
  FirstName: string | null
  LastName: string
  Email: string | null
  Company: string
  Phone: string | null
  Status: string
  Title: string | null
  LeadSource: string | null
}

// ── Salesforce Integration API ───────────────────────────────────────────────

export function getSalesforceAuthUrl(orgId: string): string {
  return `${env.VITE_API_URL}/lira/v1/integrations/salesforce/auth?orgId=${encodeURIComponent(orgId)}`
}

export async function getSalesforceStatus(orgId: string): Promise<SalesforceStatus> {
  return apiFetch<SalesforceStatus>(
    `/lira/v1/integrations/salesforce/status?orgId=${encodeURIComponent(orgId)}`
  )
}

export async function disconnectSalesforce(orgId: string): Promise<void> {
  await apiFetch<void>(`/lira/v1/integrations/salesforce?orgId=${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function listSalesforceContacts(
  orgId: string,
  query?: string
): Promise<{ contacts: SalesforceContact[] }> {
  let url = `/lira/v1/integrations/salesforce/contacts?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  return apiFetch(url)
}

export async function listSalesforceAccounts(
  orgId: string,
  query?: string
): Promise<{ accounts: SalesforceAccount[] }> {
  let url = `/lira/v1/integrations/salesforce/accounts?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  return apiFetch(url)
}

export async function listSalesforceOpportunities(
  orgId: string,
  query?: string
): Promise<{ opportunities: SalesforceOpportunity[] }> {
  let url = `/lira/v1/integrations/salesforce/opportunities?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  return apiFetch(url)
}

export async function listSalesforceLeads(
  orgId: string,
  query?: string
): Promise<{ leads: SalesforceLead[] }> {
  let url = `/lira/v1/integrations/salesforce/leads?orgId=${encodeURIComponent(orgId)}`
  if (query) url += `&q=${encodeURIComponent(query)}`
  return apiFetch(url)
}

// ── Beta Usage ────────────────────────────────────────────────────────────────

export interface BetaLimits {
  meetings: number
  meeting_minutes: number
  interviews: number
  interview_evaluations: number
  ai_tasks: number
  documents: number
  knowledge_pages: number
}

export interface OrgUsage {
  meetings: number
  meeting_minutes: number
  interviews: number
  interview_evaluations: number
  ai_tasks: number
  documents: number
  knowledge_pages: number
}

export interface UsageSummary {
  usage: OrgUsage
  limits: BetaLimits
}

export async function getOrgUsage(orgId: string): Promise<UsageSummary> {
  return apiFetch(`/lira/v1/usage/orgs/${encodeURIComponent(orgId)}`)
}

export function isBetaLimitError(err: unknown): boolean {
  return err instanceof Error && err.message === 'Beta limit reached'
}

// ── Knowledge Base Query (RAG) ─────────────────────────────────────────────────

export interface KBQueryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface KBQuerySource {
  type: 'document' | 'website'
  id: string
  name: string
  score: number
}

export interface KBQueryResponse {
  answer: string
  sources: KBQuerySource[]
  has_context: boolean
}

export async function queryKnowledgeBase(
  orgId: string,
  query: string,
  conversationHistory?: KBQueryMessage[]
): Promise<KBQueryResponse> {
  return apiFetch(`/lira/v1/orgs/${encodeURIComponent(orgId)}/kb/query`, {
    method: 'POST',
    body: JSON.stringify({
      query,
      ...(conversationHistory?.length ? { conversation_history: conversationHistory } : {}),
    }),
  })
}

// ── Meeting Schedules ─────────────────────────────────────────────────────────

export type RecurrenceType = 'daily' | 'weekdays' | 'weekly'

export interface Recurrence {
  type: RecurrenceType
  days_of_week?: number[] // 0=Sun…6=Sat
}

export type ScheduleMeetingType =
  | 'meeting'
  | 'standup'
  | 'one_on_one'
  | 'technical'
  | 'brainstorming'
  | 'sales'

export interface MeetingSchedule {
  schedule_id: string
  org_id: string
  user_id: string
  name: string
  meeting_url: string
  meeting_type: ScheduleMeetingType
  time: string // "HH:mm"
  timezone: string // IANA timezone
  recurrence: Recurrence
  enabled: boolean
  settings?: {
    personality?: string
    ai_name?: string
    voice_id?: string
  }
  created_at: string
  updated_at: string
  last_run_date?: string
  next_run_at: string | null
}

export interface CreateScheduleInput {
  name: string
  meeting_url: string
  meeting_type?: ScheduleMeetingType
  time: string
  timezone: string
  recurrence: Recurrence
  settings?: {
    personality?: string
    ai_name?: string
    voice_id?: string
  }
  org_id?: string
}

export interface UpdateScheduleInput {
  name?: string
  meeting_url?: string
  meeting_type?: ScheduleMeetingType
  time?: string
  timezone?: string
  recurrence?: Recurrence
  settings?: {
    personality?: string
    ai_name?: string
    voice_id?: string
  }
  enabled?: boolean
}

export async function createSchedule(input: CreateScheduleInput): Promise<MeetingSchedule> {
  return apiFetch('/lira/v1/schedules', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function listSchedules(orgId?: string): Promise<MeetingSchedule[]> {
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiFetch(`/lira/v1/schedules${params}`)
}

export async function getSchedule(scheduleId: string, orgId?: string): Promise<MeetingSchedule> {
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiFetch(`/lira/v1/schedules/${encodeURIComponent(scheduleId)}${params}`)
}

export async function updateSchedule(
  scheduleId: string,
  input: UpdateScheduleInput,
  orgId?: string
): Promise<MeetingSchedule> {
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiFetch(`/lira/v1/schedules/${encodeURIComponent(scheduleId)}${params}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteSchedule(
  scheduleId: string,
  orgId?: string
): Promise<{ success: boolean }> {
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiFetch(`/lira/v1/schedules/${encodeURIComponent(scheduleId)}${params}`, {
    method: 'DELETE',
  })
}

export async function toggleSchedule(
  scheduleId: string,
  enabled: boolean,
  orgId?: string
): Promise<{ schedule_id: string; enabled: boolean }> {
  const params = orgId ? `?org_id=${encodeURIComponent(orgId)}` : ''
  return apiFetch(`/lira/v1/schedules/${encodeURIComponent(scheduleId)}/toggle${params}`, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  })
}

// ── Admin Dashboard API ───────────────────────────────────────────────────────

export interface AdminDashboardOverview {
  totalUsers: number
  totalOrgs: number
  newSignups7d: number
  newSignups30d: number
  verifiedUsers: number
  unverifiedUsers: number
  signupTrend: { date: string; count: number }[]
}

export interface AdminOrgItem {
  org_id: string
  name: string
  industry?: string
  owner_id?: string
  owner_email?: string
  owner_name?: string
  member_count: number
  created_at?: string
  invite_code?: string
  usage: Record<string, number>
  limits: Record<string, number>
}

export interface AdminOrgDetail extends AdminOrgItem {
  members: {
    user_id: string
    role: string
    joined_at: string
    email?: string
    name?: string
    emailVerified?: boolean
  }[]
}

export interface AdminUser {
  id: string
  email: string | null
  name: string | null
  role: string
  emailVerified: boolean
  createdAt: string
}

export interface AdminUserDetail extends AdminUser {
  organizations: {
    org_id: string
    org_name: string
    role: string
    joined_at: string
  }[]
}

export async function adminGetDashboard(): Promise<AdminDashboardOverview> {
  return apiFetch('/v1/platform/admin/lira/dashboard')
}

export async function adminListOrganizations(): Promise<AdminOrgItem[]> {
  return apiFetch('/v1/platform/admin/lira/organizations')
}

export async function adminGetOrganization(orgId: string): Promise<AdminOrgDetail> {
  return apiFetch(`/v1/platform/admin/lira/organizations/${encodeURIComponent(orgId)}`)
}

export async function adminDeleteOrganization(orgId: string): Promise<void> {
  return apiFetch(`/v1/platform/admin/lira/organizations/${encodeURIComponent(orgId)}`, {
    method: 'DELETE',
  })
}

export async function adminListUsers(search?: string, filter?: string): Promise<AdminUser[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (filter) params.set('filter', filter)
  const q = params.toString() ? `?${params.toString()}` : ''
  return apiFetch(`/v1/platform/admin/lira/users${q}`)
}

export async function adminGetUser(userId: string): Promise<AdminUserDetail> {
  return apiFetch(`/v1/platform/admin/lira/users/${encodeURIComponent(userId)}`)
}

export async function adminDeleteUser(userId: string): Promise<void> {
  return apiFetch(`/v1/platform/admin/lira/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
}

export async function adminSendEmail(
  to: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: string[] }> {
  return apiFetch('/v1/platform/admin/lira/email/send', {
    method: 'POST',
    body: JSON.stringify({ to, subject, html }),
  })
}

export async function adminBroadcastEmail(
  subject: string,
  html: string,
  filter?: { emailVerified?: boolean }
): Promise<{ sent: number; total: number; failed: string[] }> {
  return apiFetch('/v1/platform/admin/lira/email/broadcast', {
    method: 'POST',
    body: JSON.stringify({ subject, html, filter }),
  })
}

export async function adminListAdmins(): Promise<AdminUser[]> {
  return apiFetch('/v1/platform/admin/admins')
}

export async function adminPromoteUser(userId: string): Promise<AdminUser> {
  return apiFetch(`/v1/platform/admin/users/${encodeURIComponent(userId)}/promote`, {
    method: 'POST',
  })
}

export async function adminDemoteUser(userId: string): Promise<AdminUser> {
  return apiFetch(`/v1/platform/admin/users/${encodeURIComponent(userId)}/demote`, {
    method: 'POST',
  })
}
