import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BotState } from '@/services/api'

interface AuthSlice {
  token: string | null
  userEmail: string | null
  userName: string | null
  userPicture: string | null
  setCredentials: (token: string, email?: string, name?: string, picture?: string) => void
  clearCredentials: () => void
}

export const useAuthStore = create<AuthSlice>()(
  persist(
    (set) => ({
      token: null,
      userEmail: null,
      userName: null,
      userPicture: null,
      setCredentials: (token, email, name, picture) =>
        set({
          token,
          userEmail: email ?? null,
          userName: name ?? null,
          userPicture: picture ?? null,
        }),
      clearCredentials: () =>
        set({ token: null, userEmail: null, userName: null, userPicture: null }),
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
  setBotDeployed: (botId, meetingUrl, platform, state) =>
    set({
      botId,
      meetingUrl,
      platform,
      botState: state,
      error: null,
      deployedAt: new Date().toISOString(),
    }),
  setBotState: (state) => set({ botState: state, error: null }),
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
