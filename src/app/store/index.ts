import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BotState,
  Organization,
  TaskRecord,
  KBEntry,
  DocumentRecord,
  CrawlStatus,
  UsageSummary,
} from '@/services/api'

interface AuthSlice {
  token: string | null
  userId: string | null
  userEmail: string | null
  userName: string | null
  userPicture: string | null
  userRole: string | null
  emailVerified: boolean | null
  setCredentials: (
    token: string,
    email?: string,
    name?: string,
    picture?: string,
    id?: string,
    emailVerified?: boolean,
    role?: string
  ) => void
  setEmailVerified: (v: boolean) => void
  setUserPicture: (picture: string) => void
  setUserName: (name: string) => void
  setUserEmail: (email: string) => void
  clearCredentials: () => void
}

export const useAuthStore = create<AuthSlice>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      userEmail: null,
      userName: null,
      userPicture: null,
      userRole: null,
      emailVerified: null,
      setCredentials: (token, email, name, picture, id, emailVerified, role) =>
        set({
          token,
          userId: id ?? null,
          userEmail: email ?? null,
          userName: name ?? null,
          userPicture: picture ?? null,
          userRole: role ?? null,
          emailVerified: emailVerified ?? null,
        }),
      setEmailVerified: (v) => set({ emailVerified: v }),
      setUserPicture: (picture) => set({ userPicture: picture }),
      setUserName: (name) => set({ userName: name }),
      setUserEmail: (email) => set({ userEmail: email }),
      clearCredentials: () =>
        set({
          token: null,
          userId: null,
          userEmail: null,
          userName: null,
          userPicture: null,
          userRole: null,
          emailVerified: null,
        }),
    }),
    { name: 'lira-auth' }
  )
)

export interface TranscriptLine {
  speaker: string
  text: string
  isFinal: boolean
  at: string
  isAi?: boolean
}

export type AiStatus = 'idle' | 'listening' | 'thinking' | 'speaking'

interface MeetingSlice {
  meetingId: string | null
  meetingTitle: string | null
  isConnected: boolean
  aiStatus: AiStatus
  transcript: TranscriptLine[]
  lastAiResponse: string | null
  setMeeting: (id: string, title: string) => void
  clearMeeting: () => void
  setConnected: (v: boolean) => void
  setAiStatus: (status: AiStatus) => void
  addTranscriptLine: (line: TranscriptLine) => void
  setLastAiResponse: (text: string) => void
  clearTranscript: () => void
}

export const useMeetingStore = create<MeetingSlice>()((set) => ({
  meetingId: null,
  meetingTitle: null,
  isConnected: false,
  aiStatus: 'idle',
  transcript: [],
  lastAiResponse: null,
  setMeeting: (id, title) => set({ meetingId: id, meetingTitle: title }),
  clearMeeting: () =>
    set({
      meetingId: null,
      meetingTitle: null,
      isConnected: false,
      aiStatus: 'idle',
      transcript: [],
      lastAiResponse: null,
    }),
  setConnected: (v) => set({ isConnected: v }),
  setAiStatus: (status) => set({ aiStatus: status }),
  addTranscriptLine: (line) =>
    set((s) => {
      // Deduplicate: skip if the last line from the same speaker has identical text
      // (Nova Sonic can emit duplicate content blocks for the same spoken turn)
      const last = s.transcript[s.transcript.length - 1]
      if (last && last.isAi === line.isAi && last.text.trim() === line.text.trim()) {
        return {} // no-op
      }
      return { transcript: [...s.transcript.slice(-199), line] }
    }),
  setLastAiResponse: (text) => set({ lastAiResponse: text }),
  clearTranscript: () => set({ transcript: [] }),
}))

// ── Bot Deploy Store ──────────────────────────────────────────────────────────

interface BotSlice {
  botId: string | null
  meetingUrl: string | null
  platform: 'google_meet' | 'zoom' | null
  botState: BotState | null
  error: string | null
  deployedAt: string | null
  lastTerminatedAt: number
  setBotDeployed: (
    botId: string,
    meetingUrl: string,
    platform: 'google_meet' | 'zoom',
    state: BotState
  ) => void
  setBotState: (state: BotState) => void
  setBotError: (error: string) => void
  clearBot: () => void
}

// ── User Preferences Store ──────────────────────────────────────────────────

export type VoiceId = 'tiffany' | 'ruth' | 'matthew' | 'stephen'
export type Personality = 'supportive' | 'challenger' | 'facilitator' | 'analyst'

interface UserPrefsSlice {
  aiName: string
  voiceId: VoiceId
  personality: Personality
  setAiName: (name: string) => void
  setVoiceId: (voiceId: VoiceId) => void
  setPersonality: (personality: Personality) => void
}

export const useUserPrefsStore = create<UserPrefsSlice>()(
  persist(
    (set) => ({
      aiName: 'Lira',
      voiceId: 'tiffany',
      personality: 'supportive',
      setAiName: (aiName) => set({ aiName }),
      setVoiceId: (voiceId) => set({ voiceId }),
      setPersonality: (personality) => set({ personality }),
    }),
    { name: 'lira-user-prefs' }
  )
)

export const useBotStore = create<BotSlice>()((set) => ({
  botId: null,
  meetingUrl: null,
  platform: null,
  botState: null,
  error: null,
  deployedAt: null,
  lastTerminatedAt: 0,
  setBotDeployed: (botId, meetingUrl, platform, state) =>
    set({
      botId,
      meetingUrl,
      platform,
      botState: state,
      error: null,
      deployedAt: new Date().toISOString(),
    }),
  setBotState: (state) =>
    set({
      botState: state,
      error: null,
      ...(state === 'terminated' ? { lastTerminatedAt: Date.now() } : {}),
    }),
  setBotError: (error) => set({ botState: 'error', error }),
  clearBot: () =>
    set({
      botId: null,
      meetingUrl: null,
      platform: null,
      botState: null,
      error: null,
      deployedAt: null,
    }),
}))

// ── Organization Store ────────────────────────────────────────────────────────

interface OrgSlice {
  currentOrgId: string | null
  organizations: Organization[]
  setCurrentOrg: (orgId: string | null) => void
  setOrganizations: (orgs: Organization[]) => void
  addOrganization: (org: Organization) => void
  removeOrganization: (orgId: string) => void
  updateOrganization: (orgId: string, updates: Partial<Organization>) => void
  clear: () => void
}

export const useOrgStore = create<OrgSlice>()(
  persist(
    (set) => ({
      currentOrgId: null,
      organizations: [],
      setCurrentOrg: (orgId) => set({ currentOrgId: orgId }),
      setOrganizations: (organizations) =>
        set((s) => ({
          organizations,
          currentOrgId:
            s.currentOrgId && organizations.some((o) => o.org_id === s.currentOrgId)
              ? s.currentOrgId
              : (organizations[0]?.org_id ?? null),
        })),
      addOrganization: (org) =>
        set((s) => ({
          organizations: [...s.organizations, org],
          currentOrgId: s.currentOrgId ?? org.org_id,
        })),
      removeOrganization: (orgId) =>
        set((s) => {
          const filtered = s.organizations.filter((o) => o.org_id !== orgId)
          return {
            organizations: filtered,
            currentOrgId: s.currentOrgId === orgId ? (filtered[0]?.org_id ?? null) : s.currentOrgId,
          }
        }),
      updateOrganization: (orgId, updates) =>
        set((s) => ({
          organizations: s.organizations.map((o) =>
            o.org_id === orgId ? { ...o, ...updates } : o
          ),
        })),
      clear: () => set({ currentOrgId: null, organizations: [] }),
    }),
    { name: 'lira-org' }
  )
)

// ── Knowledge Base Store ──────────────────────────────────────────────────────

interface KBSlice {
  entries: KBEntry[]
  crawlStatus: CrawlStatus | null
  loading: boolean
  setEntries: (entries: KBEntry[]) => void
  setCrawlStatus: (status: CrawlStatus | null) => void
  setLoading: (v: boolean) => void
  removeEntry: (id: string) => void
  clear: () => void
}

export const useKBStore = create<KBSlice>()((set) => ({
  entries: [],
  crawlStatus: null,
  loading: false,
  setEntries: (entries) => set({ entries }),
  setCrawlStatus: (crawlStatus) => set({ crawlStatus }),
  setLoading: (loading) => set({ loading }),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  clear: () => set({ entries: [], crawlStatus: null }),
}))

// ── Document Store ────────────────────────────────────────────────────────────

interface DocumentSlice {
  documents: DocumentRecord[]
  loading: boolean
  setDocuments: (docs: DocumentRecord[]) => void
  addDocument: (doc: DocumentRecord) => void
  removeDocument: (docId: string) => void
  updateDocument: (docId: string, updates: Partial<DocumentRecord>) => void
  setLoading: (v: boolean) => void
  clear: () => void
}

export const useDocumentStore = create<DocumentSlice>()((set) => ({
  documents: [],
  loading: false,
  setDocuments: (documents) => set({ documents }),
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (docId) =>
    set((s) => ({ documents: s.documents.filter((d) => d.doc_id !== docId) })),
  updateDocument: (docId, updates) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.doc_id === docId ? { ...d, ...updates } : d)),
    })),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ documents: [] }),
}))

// ── Task Store ────────────────────────────────────────────────────────────────

interface TaskSlice {
  tasks: TaskRecord[]
  loading: boolean
  statusFilter: string | null
  setTasks: (tasks: TaskRecord[]) => void
  addTask: (task: TaskRecord) => void
  removeTask: (taskId: string) => void
  updateTask: (taskId: string, updates: Partial<TaskRecord>) => void
  setLoading: (v: boolean) => void
  setStatusFilter: (status: string | null) => void
  clear: () => void
}

export const useTaskStore = create<TaskSlice>()((set) => ({
  tasks: [],
  loading: false,
  statusFilter: null,
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  removeTask: (taskId) => set((s) => ({ tasks: s.tasks.filter((t) => t.task_id !== taskId) })),
  updateTask: (taskId, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.task_id === taskId ? { ...t, ...updates } : t)),
    })),
  setLoading: (loading) => set({ loading }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  clear: () => set({ tasks: [], statusFilter: null }),
}))

// ── Notification Store ────────────────────────────────────────────────────────
// Lightweight client-side badge counts keyed to sections.
// Persisted per org in localStorage so page refresh keeps counts.

export interface NotifEntry {
  id: string
  kind: 'task' | 'meeting_ended' | 'support_escalation'
  title: string
  subtitle?: string
  orgId?: string
  link: string
  createdAt: number
}

interface NotifSlice {
  entries: NotifEntry[]
  // timestamp-based "seen" for meetings (section-level)
  meetingSeenAt: number
  supportSeenAt: number
  // per-task read tracking — only clears when user opens the individual task detail
  readTaskNotifIds: string[]
  addNotif: (entry: Omit<NotifEntry, 'createdAt'>) => void
  removeNotif: (id: string) => void
  clearAll: () => void
  markTaskRead: (notifId: string) => void
  markMeetingsSeen: () => void
  markSupportSeen: () => void
}

export const useNotifStore = create<NotifSlice>()(
  persist(
    (set) => ({
      entries: [],
      meetingSeenAt: 0,
      supportSeenAt: 0,
      readTaskNotifIds: [],
      addNotif: (entry) =>
        set((s) => {
          // dedupe by id
          if (s.entries.some((e) => e.id === entry.id)) return s
          return { entries: [{ ...entry, createdAt: Date.now() }, ...s.entries].slice(0, 50) }
        }),
      removeNotif: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clearAll: () => set({ entries: [] }),
      markTaskRead: (notifId) =>
        set((s) =>
          s.readTaskNotifIds.includes(notifId)
            ? s
            : { readTaskNotifIds: [...s.readTaskNotifIds, notifId] }
        ),
      markMeetingsSeen: () => set({ meetingSeenAt: Date.now() }),
      markSupportSeen: () => set({ supportSeenAt: Date.now() }),
    }),
    { name: 'lira-notif' }
  )
)

// ── Usage store (beta limits) ─────────────────────────────────────────────────

interface UsageSlice {
  summary: UsageSummary | null
  loading: boolean
  limitFeature: string | null
  limitMessage: string | null
  setSummary: (s: UsageSummary) => void
  setLoading: (v: boolean) => void
  showLimitModal: (feature: string, message?: string) => void
  dismissLimitModal: () => void
}

export const useUsageStore = create<UsageSlice>()((set) => ({
  summary: null,
  loading: false,
  limitFeature: null,
  limitMessage: null,
  setSummary: (summary) => set({ summary }),
  setLoading: (loading) => set({ loading }),
  showLimitModal: (feature, message) =>
    set({ limitFeature: feature, limitMessage: message ?? null }),
  dismissLimitModal: () => set({ limitFeature: null, limitMessage: null }),
}))
