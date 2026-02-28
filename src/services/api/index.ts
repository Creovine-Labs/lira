import { env } from '@/env'

// ── Types (mirror backend lira.models.ts) ────────────────────────────────────

export interface MeetingSettings {
  personality?: 'supportive' | 'challenger' | 'facilitator' | 'technical' | 'business'
  participation_level?: number // 0.0 – 1.0
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
  created_at: string
  updated_at: string
  status?: string
  settings: MeetingSettings
  messages: Message[]
  participants: string[]
  audio_url?: string
}

export interface MeetingSummary {
  session_id: string
  summary: string
  key_points?: string[]
  action_items?: string[]
  generated_at: string
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
  return apiFetch<Meeting>('/lira/v1/meetings', {
    method: 'POST',
    body: JSON.stringify({ title, settings }),
  })
}

export async function listMeetings(): Promise<Meeting[]> {
  type Resp = { meetings: Meeting[] } | Meeting[]
  const data = await apiFetch<Resp>('/lira/v1/meetings')
  return Array.isArray(data) ? data : (data.meetings ?? [])
}

export async function getMeeting(id: string): Promise<Meeting> {
  return apiFetch<Meeting>(`/lira/v1/meetings/${id}`)
}

export async function getMeetingSummary(id: string): Promise<MeetingSummary> {
  return apiFetch<MeetingSummary>(`/lira/v1/meetings/${id}/summary`)
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
  displayName?: string
): Promise<DeployBotResponse> {
  return apiFetch<DeployBotResponse>('/lira/v1/bot/deploy', {
    method: 'POST',
    body: JSON.stringify({ meeting_url: meetingUrl, display_name: displayName }),
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

// ── WebSocket URL builder ─────────────────────────────────────────────────────

export function buildWsUrl(overrides?: { token?: string }): string {
  const token = overrides?.token ?? credentials.getToken() ?? ''
  const url = new URL(env.VITE_WS_URL)
  url.searchParams.set('token', token)
  return url.toString()
}
