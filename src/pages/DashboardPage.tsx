import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  InboxIcon,
  MicrophoneIcon,
  PlusIcon,
  RadioIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useBotStore, useOrgStore, useUserPrefsStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  deployBot,
  getBotStatus,
  getDashboardStats,
  listActiveBots,
  listMeetings,
  listTasks,
  muteBotApi,
  terminateBot,
  triggerBotSpeakApi,
  unmuteBotApi,
  type Meeting,
  type MeetingType,
  type TaskRecord,
  type DashboardStats,
} from '@/services/api'
import {
  getSupportStats,
  listConversations,
  type SupportStats,
  type SupportConversation,
} from '@/services/api/support-api'
import { cn } from '@/lib'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ── Stat card (glassmorphism gradient) ───────────────────────────────────────
const _DARK_CARD = {
  bg: 'from-[#1c1c1e] via-[#141414] to-[#0a0a0a]',
  glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
} as const
const STAT_PALETTES = {
  purple: _DARK_CARD,
  dark: _DARK_CARD,
  indigo: _DARK_CARD,
  slate: _DARK_CARD,
} as const
type StatAccent = keyof typeof STAT_PALETTES

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'purple',
  onClick,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent?: StatAccent
  onClick?: () => void
}) {
  const { bg, glow } = STAT_PALETTES[accent]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${bg} ${glow} p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110`}
    >
      {/* Glass shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.12] to-transparent" />
      {/* Inner border glow */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.08]" />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60 backdrop-blur-sm">
            <Icon className="h-[15px] w-[15px]" />
          </div>
          {onClick && (
            <ArrowRightIcon className="h-3 w-3 text-white/20 opacity-0 transition group-hover:opacity-100 group-hover:text-white/60" />
          )}
        </div>
        <p className="mt-4 text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {label}
        </p>
      </div>
    </Tag>
  )
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  accent = false,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3.5 rounded-xl px-4 py-3.5 text-left transition-all hover:bg-gray-50"
    >
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
          accent
            ? 'bg-[#3730a3] text-white group-hover:bg-[#312e81]'
            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-0.5 truncate text-[11px] text-gray-400">{description}</p>
      </div>
      <ArrowRightIcon className="h-3 w-3 shrink-0 text-gray-200 opacity-0 transition group-hover:opacity-100 group-hover:text-[#3730a3]" />
    </button>
  )
}

// ── Recent meetings list ──────────────────────────────────────────────────────
function RecentMeetings({ meetings }: { meetings: Meeting[] }) {
  const navigate = useNavigate()
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
          <MicrophoneIcon className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">No meetings yet</p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-gray-100">
      {meetings.map((m) => (
        <button
          key={m.session_id}
          onClick={() => navigate(`/meetings/${m.session_id}`)}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition hover:bg-gray-50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <MicrophoneIcon className="h-3.5 w-3.5 text-gray-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
            <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
          </div>
          <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        </button>
      ))}
    </div>
  )
}

// ── Recent tasks list ─────────────────────────────────────────────────────────
function RecentTasks({ tasks }: { tasks: TaskRecord[] }) {
  const navigate = useNavigate()
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
          <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">No tasks yet</p>
      </div>
    )
  }
  const statusColor: Record<string, string> = {
    pending: 'bg-amber-400',
    in_progress: 'bg-blue-400',
    completed: 'bg-green-400',
    cancelled: 'bg-gray-300',
  }
  return (
    <div className="divide-y divide-gray-100">
      {tasks.map((t) => (
        <button
          key={t.task_id}
          onClick={() => navigate(`/org/tasks/${t.task_id}`)}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition hover:bg-gray-50"
        >
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${statusColor[t.status] ?? 'bg-gray-300'}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
            <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
          </div>
          <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        </button>
      ))}
    </div>
  )
}

// ── Activity panel (tabbed) ───────────────────────────────────────────────────
type Tab = 'meetings' | 'tasks' | 'support'

function ActivityPanel({
  meetings,
  tasks,
  supportConversations,
  supportActivated,
  navigate,
}: {
  meetings: Meeting[]
  tasks: TaskRecord[]
  supportConversations: SupportConversation[]
  supportActivated: boolean
  navigate: (path: string) => void
}) {
  const [tab, setTab] = useState<Tab>('meetings')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'meetings', label: 'Meetings', count: meetings.length || undefined },
    { id: 'tasks', label: 'Tasks', count: tasks.length || undefined },
    ...(supportActivated
      ? [
          {
            id: 'support' as Tab,
            label: 'Support',
            count: supportConversations.length || undefined,
          },
        ]
      : []),
  ]

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/60 bg-white shadow-sm">
      {/* Underline tab bar — purple active */}
      <div className="flex items-center gap-0 border-b border-gray-100 px-4 pt-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-medium transition',
              tab === t.id
                ? 'border-[#3730a3] text-[#3730a3]'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  tab === t.id ? 'bg-[#3730a3]/10 text-[#3730a3]' : 'bg-gray-100 text-gray-400'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ── Meetings ── */}
        {tab === 'meetings' && (
          <div>
            <RecentMeetings meetings={meetings.slice(0, 8)} />
            {meetings.length > 0 && (
              <button
                onClick={() => navigate('/meetings')}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#3730a3] transition hover:text-[#312e81]"
              >
                View all meetings <ArrowRightIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* ── Tasks ── */}
        {tab === 'tasks' && (
          <div>
            <RecentTasks tasks={tasks.slice(0, 8)} />
            {tasks.length > 0 && (
              <button
                onClick={() => navigate('/org/tasks')}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#3730a3] transition hover:text-[#312e81]"
              >
                View all tasks <ArrowRightIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* ── Support ── */}
        {tab === 'support' && (
          <div>
            {supportConversations.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">No open conversations</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {supportConversations.slice(0, 8).map((c) => (
                    <button
                      key={c.conv_id}
                      onClick={() => navigate(`/support/inbox/${c.conv_id}`)}
                      className="flex w-full items-center gap-3 rounded-lg px-1 py-3 text-left transition hover:bg-gray-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                        <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {c.subject || 'No subject'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {c.status === 'open'
                            ? 'Open'
                            : c.status === 'escalated'
                              ? 'Escalated'
                              : c.status}
                          {' · '}
                          {timeAgo(c.updated_at || c.created_at)}
                        </p>
                      </div>
                      <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/support')}
                  className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#3730a3] transition hover:text-[#312e81]"
                >
                  Open support inbox <ArrowRightIcon className="h-3 w-3" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Platform detection ────────────────────────────────────────────────────────
const MEET_RE = /^https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i
const ZOOM_RE = /^https?:\/\/[\w.-]*zoom\.us\/(j|my)\//i

function detectMeetingPlatform(url: string): 'google_meet' | 'zoom' | null {
  if (MEET_RE.test(url)) return 'google_meet'
  if (ZOOM_RE.test(url)) return 'zoom'
  return null
}

// ── Deploy hero bar ───────────────────────────────────────────────────────────
function DeployHeroBar() {
  const navigate = useNavigate()
  const [meetingLink, setMeetingLink] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { aiName, voiceId, personality } = useUserPrefsStore()
  const { currentOrgId } = useOrgStore()
  const {
    botId,
    botState,
    platform,
    error: storeError,
    setBotDeployed,
    setBotState,
    setBotError,
    clearBot,
  } = useBotStore()

  const [isMuted, setIsMuted] = useState(true)
  const [muteLoading, setMuteLoading] = useState(false)
  const [speakLoading, setSpeakLoading] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const detectedPlatform = meetingLink.trim() ? detectMeetingPlatform(meetingLink.trim()) : null

  const isActive = botState && botState !== 'terminated' && botState !== 'error'
  const isInProgress =
    botState === 'launching' ||
    botState === 'navigating' ||
    botState === 'in_lobby' ||
    botState === 'joining'

  // ── Polling ──
  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(async () => {
        try {
          const status = await getBotStatus(id)
          setBotState(status.state)
          if (status.is_muted !== undefined) setIsMuted(status.is_muted)
          if (status.state === 'terminated' || status.state === 'error') {
            if (status.error) setBotError(status.error)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        } catch {
          // Bot no longer found on server (404) — treat as terminated
          setBotState('terminated')
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      }, 2_000)
    },
    [setBotState, setBotError]
  )

  // Restore active bot on mount
  useEffect(() => {
    if (botId && botState && botState !== 'terminated' && botState !== 'error') {
      startPolling(botId)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const bots = await listActiveBots()
        if (cancelled) return
        const active = bots.find((b) => b.state !== 'terminated' && b.state !== 'error')
        if (!active) return
        setBotDeployed(active.bot_id, '', active.platform as 'google_meet' | 'zoom', active.state)
        startPolling(active.bot_id)
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current)
    },
    []
  )

  // Auto-reset on terminate
  useEffect(() => {
    if (botState !== 'terminated') return
    const t = setTimeout(clearBot, 3_000)
    return () => clearTimeout(t)
  }, [botState, clearBot])

  // ── Deploy ──
  async function handleDeploy() {
    const url = meetingLink.trim()
    if (!url) return
    const plat = detectMeetingPlatform(url)
    if (!plat) {
      setLocalError('Paste a valid Google Meet or Zoom link.')
      return
    }
    setLocalError(null)
    setDeploying(true)
    try {
      const res = await deployBot(
        url,
        aiName,
        { ai_name: aiName, voice_id: voiceId, personality },
        currentOrgId ?? undefined,
        undefined,
        meetingType ?? 'meeting'
      )
      setBotDeployed(res.bot_id, url, res.platform, res.state)
      setMeetingLink('')
      startPolling(res.bot_id)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to deploy')
    } finally {
      setDeploying(false)
    }
  }

  // ── Mute / Unmute ──
  async function handleMuteToggle() {
    if (!botId || muteLoading) return
    setMuteLoading(true)
    try {
      if (isMuted) {
        await unmuteBotApi(botId)
        setIsMuted(false)
      } else {
        await muteBotApi(botId)
        setIsMuted(true)
      }
    } catch {
      /* polling will reconcile */
    } finally {
      setMuteLoading(false)
    }
  }

  // ── Speak ──
  async function handleSpeak() {
    if (!botId || speakLoading) return
    setSpeakLoading(true)
    try {
      await triggerBotSpeakApi(botId)
      setIsMuted(false)
    } catch {
      /* ignore */
    } finally {
      setSpeakLoading(false)
    }
  }

  // ── Terminate ──
  async function handleTerminate() {
    if (!botId) return
    try {
      await terminateBot(botId)
      setBotState('terminated')
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    } catch {
      /* ignore */
    }
  }

  const error = localError ?? storeError

  // ── Active / in-progress view ──
  if (botId && botState && botState !== 'terminated') {
    const stateLabel: Record<string, string> = {
      launching: 'Launching Lira…',
      navigating: 'Opening meeting…',
      in_lobby: 'Waiting in lobby',
      joining: 'Joining meeting…',
      active: 'Lira is in the meeting',
      leaving: 'Leaving meeting…',
      error: 'Something went wrong',
    }

    return (
      <div className="rounded-2xl bg-[#0f0f0f] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl',
                botState === 'active'
                  ? 'bg-emerald-500/20'
                  : botState === 'error'
                    ? 'bg-red-500/20'
                    : 'bg-amber-500/20'
              )}
            >
              {isInProgress ? (
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className="h-5 w-5 animate-spin opacity-50"
                  style={{ animationDuration: '1.2s' }}
                />
              ) : botState === 'active' ? (
                <RadioIcon className="h-5 w-5 animate-pulse text-emerald-400" />
              ) : (
                <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-semibold',
                  botState === 'active'
                    ? 'text-emerald-400'
                    : botState === 'error'
                      ? 'text-red-400'
                      : 'text-amber-400'
                )}
              >
                {stateLabel[botState] ?? botState}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
                <VideoCameraIcon className="h-3 w-3" />
                {platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
              </p>
            </div>
          </div>

          {isActive && !botState?.startsWith('leav') && (
            <span className="shrink-0 text-xs text-white/30">
              {platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
            </span>
          )}
          {botState === 'error' && (
            <button
              onClick={clearBot}
              className="shrink-0 rounded-full bg-[#3730a3] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#312e81]"
            >
              Try again
            </button>
          )}
        </div>

        {/* ── Mute / Speak / End controls ── */}
        {botState === 'active' && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleMuteToggle}
              disabled={muteLoading}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                isMuted
                  ? 'bg-white text-[#3730a3] hover:bg-gray-100'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              )}
            >
              {isMuted ? (
                <>
                  <SpeakerWaveIcon className="h-4 w-4" /> Unmute Lira
                </>
              ) : (
                <>
                  <SpeakerXMarkIcon className="h-4 w-4" /> Mute Lira
                </>
              )}
            </button>
            <button
              onClick={handleSpeak}
              disabled={speakLoading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
            >
              <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
              Lira, Speak
            </button>
            <button
              onClick={handleTerminate}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Remove from Call
            </button>
          </div>
        )}

        {/* Cancel / Force remove for non-active states */}
        {isActive && botState !== 'active' && (
          <div className="mt-4">
            <button
              onClick={handleTerminate}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              {botState === 'leaving' ? 'Force remove' : 'Cancel'}
            </button>
          </div>
        )}

        {storeError && <p className="mt-3 text-sm text-red-400">{storeError}</p>}

        {botState === 'in_lobby' && (
          <p className="mt-3 text-sm text-sky-400">Admit Lira from your meeting to let her join.</p>
        )}
      </div>
    )
  }

  // ── Deploy form ──
  const MEETING_TYPES: { value: MeetingType; label: string }[] = [
    { value: 'meeting', label: 'General' },
    { value: 'standup', label: 'Stand-up' },
    { value: 'one_on_one', label: '1:1' },
    { value: 'technical', label: 'Technical' },
    { value: 'brainstorming', label: 'Brainstorm' },
    { value: 'sales', label: 'Sales' },
  ]

  return (
    <div className="rounded-2xl bg-[#0f0f0f] p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Meeting
          </p>
          <h2 className="text-xl font-bold text-white">Invite Lira to a meeting</h2>
        </div>
      </div>

      {/* Meeting type chips */}
      <div className="mb-5 flex flex-wrap gap-2">
        {MEETING_TYPES.map(({ value, label }) => {
          const selected = (meetingType ?? 'meeting') === value
          return (
            <button
              key={value}
              onClick={() => setMeetingType(value === 'meeting' && !meetingType ? null : value)}
              className={cn(
                'rounded-full px-3.5 py-1 text-xs font-semibold transition-all duration-200',
                selected
                  ? 'bg-[#3730a3] text-white shadow-sm shadow-[#3730a3]/40'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Input + button */}
      <div className="flex gap-2 sm:gap-3">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
            <VideoCameraIcon className="h-4 w-4 text-white/25" />
          </div>
          <input
            type="url"
            className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-16 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#3730a3]/60 focus:ring-2 focus:ring-[#3730a3]/30"
            placeholder="Paste Google Meet or Zoom link…"
            value={meetingLink}
            onChange={(e) => {
              setMeetingLink(e.target.value)
              setLocalError(null)
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
            disabled={deploying}
          />
          {detectedPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                  detectedPlatform === 'google_meet'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-sky-500/20 text-sky-400'
                )}
              >
                {detectedPlatform === 'google_meet' ? 'Meet' : 'Zoom'}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleDeploy}
          disabled={deploying || !meetingLink.trim()}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#3730a3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {deploying ? (
            <>
              <img
                src="/lira_black.png"
                alt="Loading"
                className="h-4 w-4 animate-spin opacity-50"
                style={{ animationDuration: '1.2s' }}
              />
              Sending…
            </>
          ) : (
            'Add Lira'
          )}
        </button>
      </div>

      {error && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-red-400">
          <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}

      {/* Capability anchors */}
      <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-white/30">
        <span>Also:</span>
        <button
          onClick={() => navigate('/support')}
          className="text-white/50 transition hover:text-white"
        >
          Customer support
        </button>
        <span>·</span>
        <button
          onClick={() => navigate('/org/tasks')}
          className="text-white/50 transition hover:text-white"
        >
          Manage tasks
        </button>
        <span>·</span>
        <button
          onClick={() => navigate('/org/knowledge')}
          className="text-white/50 transition hover:text-white"
        >
          Knowledge base
        </button>
        <span>·</span>
        <span className="italic text-white/20">Sales calls (coming soon)</span>
      </div>
    </div>
  )
}

// ── Modules Overview ──────────────────────────────────────────────────────────
const PREFERRED_MODULE_KEY = 'lira.preferred_module'
type PreferredModule = 'support' | 'sales' | 'meetings' | 'unsure'

function ModulesOverview({
  supportActivated,
  supportStats,
  supportConvs,
  meetings,
}: {
  supportActivated: boolean
  supportStats: SupportStats | null
  supportConvs: SupportConversation[]
  meetings: Meeting[]
}) {
  const navigate = useNavigate()
  const preferred = (localStorage.getItem(PREFERRED_MODULE_KEY) ?? 'unsure') as PreferredModule

  const tiles = [
    {
      id: 'support' as PreferredModule,
      label: 'Customer Support',
      accent: '#3730a3',
      bg: 'bg-indigo-50/60',
      ring: 'ring-indigo-200/80',
      statusLabel: supportActivated ? 'Active' : 'Not set up',
      statusDot: supportActivated ? '#10b981' : '#d1d5db',
      metric: supportActivated
        ? `${supportStats?.open_conversations ?? supportConvs.length} open tickets`
        : 'Chat, portal, and email',
      cta: supportActivated ? 'Open inbox' : 'Set up',
      ctaRoute: supportActivated ? '/support' : '/support/activate',
      icon: ChatBubbleLeftEllipsisIcon,
    },
    {
      id: 'sales' as PreferredModule,
      label: 'Sales Coaching',
      accent: '#f59e0b',
      bg: 'bg-amber-50/60',
      ring: 'ring-amber-200/80',
      statusLabel: 'Coming soon',
      statusDot: '#d1d5db',
      metric: 'Real-time objection handling',
      cta: 'Learn more',
      ctaRoute: '/meetings',
      icon: ArrowTrendingUpIcon,
    },
    {
      id: 'meetings' as PreferredModule,
      label: 'Meetings',
      accent: '#8b5cf6',
      bg: 'bg-violet-50/60',
      ring: 'ring-violet-200/80',
      statusLabel: meetings.length > 0 ? 'Active' : 'Not set up',
      statusDot: meetings.length > 0 ? '#10b981' : '#d1d5db',
      metric: meetings.length > 0 ? `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''}` : 'Transcribe, summarize, act',
      cta: meetings.length > 0 ? 'Open' : 'Deploy Lira',
      ctaRoute: '/meetings',
      icon: VideoCameraIcon,
    },
  ]

  // Sort so the user's preferred module comes first
  const sorted = [...tiles].sort((a, b) => {
    if (a.id === preferred) return -1
    if (b.id === preferred) return 1
    return 0
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Your workspace
        </p>
        <img src="/lira_black.png" alt="Lira" className="h-4 opacity-30" />
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {sorted.map((tile) => {
          const { icon: Icon } = tile
          const isPreferred = tile.id === preferred
          return (
            <div key={tile.id} className={cn('relative p-5', isPreferred && 'bg-gray-50/70')}>
              {isPreferred && (
                <span className="absolute top-3 right-3 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gray-900/5 text-gray-400">
                  primary
                </span>
              )}
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${tile.accent}15`, color: tile.accent }}
              >
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">{tile.label}</p>
              <div className="flex items-center gap-1.5 mb-2">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: tile.statusDot }}
                />
                <span className="text-[11px] text-gray-500">{tile.statusLabel}</span>
              </div>
              <p className="text-[11.5px] text-gray-400 mb-4 leading-snug">{tile.metric}</p>
              <button
                onClick={() => navigate(tile.ctaRoute)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-semibold transition-colors"
                style={{ background: `${tile.accent}12`, color: tile.accent }}
              >
                {tile.cta}
                <ArrowRightIcon className="h-3 w-3" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────
function DashboardPage() {
  const navigate = useNavigate()
  const { token, userName } = useAuthStore()
  const { currentOrgId } = useOrgStore()
  const lastTerminatedAt = useBotStore((s) => s.lastTerminatedAt)
  const supportActivated = useSupportStore((s) => s.config?.activated ?? false)

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [supportStats, setSupportStats] = useState<SupportStats | null>(null)
  const [supportConvs, setSupportConvs] = useState<SupportConversation[]>([])
  const [loading, setLoading] = useState(true)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    // Clear stale data immediately so the old org's numbers don't show
    // while the new org's data is loading.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: reset stale UI before async fetch
    setStats(null)

    setSupportStats(null)

    setSupportConvs([])

    setMeetings([])

    setTasks([])

    setLoading(true)

    // Stats card numbers come from the dedicated stats endpoint (single call)
    const statsP = currentOrgId
      ? getDashboardStats(currentOrgId).catch(() => null)
      : Promise.resolve(null)

    // Full lists are still needed to render the activity panels below the cards
    const meetingP = listMeetings(currentOrgId ?? undefined).catch(() => [] as Meeting[])
    const taskP = currentOrgId
      ? listTasks(currentOrgId, { status: 'pending' })
          .then((r) => (Array.isArray(r) ? r : ((r as { tasks: TaskRecord[] }).tasks ?? [])))
          .catch(() => [] as TaskRecord[])
      : Promise.resolve([] as TaskRecord[])

    // Support data (only if activated)
    const supportStatsP =
      currentOrgId && supportActivated
        ? getSupportStats(currentOrgId).catch(() => null)
        : Promise.resolve(null)
    const supportConvsP =
      currentOrgId && supportActivated
        ? listConversations(currentOrgId, 'open').catch(() => [] as SupportConversation[])
        : Promise.resolve([] as SupportConversation[])

    Promise.all([statsP, meetingP, taskP, supportStatsP, supportConvsP]).then(
      ([s, m, t, ss, sc]) => {
        m.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        t.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setStats(s)
        setMeetings(m)
        setTasks(t)
        setSupportStats(ss)
        setSupportConvs(sc)
        setLoading(false)
      }
    )
  }, [token, currentOrgId, navigate, supportActivated])

  // Re-fetch stats + meetings silently whenever Lira leaves a meeting so
  // the meeting count and activity list update without a manual page refresh.
  useEffect(() => {
    if (!lastTerminatedAt || !token) return
    const statsP = currentOrgId
      ? getDashboardStats(currentOrgId).catch(() => null)
      : Promise.resolve(null)
    listMeetings(currentOrgId ?? undefined)
      .catch(() => [] as Meeting[])
      .then((m) => {
        m.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setMeetings(m)
      })
    statsP.then((s) => {
      if (s) setStats(s)
    })
  }, [lastTerminatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const firstName = userName?.split(' ')[0]

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-300/60" />
          <div className="h-52 animate-pulse rounded-2xl bg-gray-400/30" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-2xl bg-gray-300/60" />
            <div className="h-64 animate-pulse rounded-2xl bg-gray-300/60 lg:col-span-2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        {/* ── Header ── */}
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-gray-900">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </h1>
          </div>
        </div>

        {/* ── Modules overview ── */}
        <div className="mb-4">
          <ModulesOverview
            supportActivated={supportActivated}
            supportStats={supportStats}
            supportConvs={supportConvs}
            meetings={meetings}
          />
        </div>

        {/* ── Deploy hero bar (Meetings expand) ── */}
        <div className="mb-4">
          <DeployHeroBar />
        </div>

        {/* ── Stat strip ── */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Meetings"
            value={stats?.meetings_total ?? meetings.length}
            icon={MicrophoneIcon}
            accent="purple"
            onClick={() => navigate('/meetings')}
          />
          <StatCard
            label="Pending tasks"
            value={stats?.tasks_pending ?? tasks.length}
            icon={ClipboardDocumentCheckIcon}
            accent="dark"
            onClick={() => navigate('/org/tasks')}
          />
          <StatCard
            label="Open tickets"
            value={
              supportActivated ? (supportStats?.open_conversations ?? supportConvs.length) : '—'
            }
            icon={InboxIcon}
            accent="slate"
            onClick={() => navigate(supportActivated ? '/support' : '/support/activate')}
          />
        </div>

        {/* ── Bento: Quick actions + Activity ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Quick actions sidebar */}
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Quick Actions
              </p>
            </div>
            <div className="py-2">
              <QuickAction
                icon={MicrophoneIcon}
                label="Start a meeting"
                description="Invite Lira to a live conversation"
                onClick={() => navigate('/meetings')}
                accent
              />
              <QuickAction
                icon={ChatBubbleLeftEllipsisIcon}
                label="Support inbox"
                description="AI-powered customer support"
                onClick={() => navigate('/support')}
              />
              <QuickAction
                icon={BookOpenIcon}
                label="Add knowledge"
                description="Upload docs or crawl your website"
                onClick={() => navigate('/org/knowledge')}
              />
              <QuickAction
                icon={PlusIcon}
                label="Invite team members"
                description="Grow your workspace"
                onClick={() => navigate('/org/members')}
              />
            </div>
          </div>

          {/* Activity panel */}
          <div className="lg:col-span-2">
            <ActivityPanel
              meetings={meetings}
              tasks={tasks}
              supportConversations={supportConvs}
              supportActivated={supportActivated}
              navigate={navigate}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export { DashboardPage }
