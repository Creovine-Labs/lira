import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowPathIcon,
  ArrowRightIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MicrophoneIcon,
  PlusIcon,
  RadioIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useBotStore, useOrgStore, useUserPrefsStore } from '@/app/store'
import {
  deployBot,
  getBotStatus,
  getDashboardStats,
  listActiveBots,
  listInterviews,
  listMeetings,
  listTasks,
  terminateBot,
  type Meeting,
  type MeetingType,
  type TaskRecord,
  type Interview,
  type DashboardStats,
} from '@/services/api'
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent: string
  onClick?: () => void
}) {
  const palette: Record<
    string,
    {
      bg: string
      iconBg: string
      iconText: string
      valueText: string
      labelText: string
      shadow: string
    }
  > = {
    orange: {
      bg: 'bg-gradient-to-br from-orange-100 to-orange-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-orange-600',
      valueText: 'text-orange-950',
      labelText: 'text-orange-700/70',
      shadow: 'shadow-orange-300/30',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-100 to-amber-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-amber-600',
      valueText: 'text-amber-950',
      labelText: 'text-amber-700/70',
      shadow: 'shadow-amber-300/30',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-100 to-violet-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-violet-600',
      valueText: 'text-violet-950',
      labelText: 'text-violet-700/70',
      shadow: 'shadow-violet-300/30',
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-100 to-teal-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-teal-600',
      valueText: 'text-teal-950',
      labelText: 'text-teal-700/70',
      shadow: 'shadow-teal-300/30',
    },
  }
  const c = palette[accent] ?? palette.violet

  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      {...(onClick ? { onClick } : {})}
      className={[
        'group relative flex w-full flex-col gap-4 rounded-2xl p-5 text-left',
        c.bg,
        'border border-white/40',
        'shadow-md',
        c.shadow,
        'transition-all duration-200 ease-out',
        onClick ? 'hover:-translate-y-0.5 hover:shadow-lg' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.iconBg} ${c.iconText}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        {onClick && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white opacity-0 transition group-hover:opacity-100">
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${c.valueText}`}>{value}</p>
        <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wider ${c.labelText}`}>
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
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:shadow-sm ${
        accent
          ? 'border-violet-200 bg-violet-50 hover:border-violet-300'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          accent
            ? 'bg-violet-100 text-violet-600 group-hover:bg-violet-200'
            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
      </div>
      <ArrowRightIcon className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-gray-500" />
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
          className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-gray-50/60 px-1 rounded-lg"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <MicrophoneIcon className="h-3.5 w-3.5 text-violet-600" />
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
          className="flex w-full items-center gap-3 py-3 text-left px-1 rounded-lg transition hover:bg-gray-50/60"
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
type Tab = 'actions' | 'meetings' | 'tasks' | 'interviews'

function ActivityPanel({
  meetings,
  tasks,
  interviews,
  navigate,
}: {
  meetings: Meeting[]
  tasks: TaskRecord[]
  interviews: Interview[]
  navigate: (path: string) => void
}) {
  const [tab, setTab] = useState<Tab>('actions')

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'actions', label: 'Actions' },
    { id: 'meetings', label: 'Meetings', count: meetings.length || undefined },
    { id: 'tasks', label: 'Tasks', count: tasks.length || undefined },
    { id: 'interviews', label: 'Interviews', count: interviews.length || undefined },
  ]

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-gray-100 px-4 pt-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-lg px-3.5 py-2 text-sm font-medium transition',
              tab === t.id
                ? 'border-b-2 border-violet-600 text-violet-700'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  tab === t.id ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
                )}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="p-5">
        {/* ── Quick Actions ── */}
        {tab === 'actions' && (
          <div className="space-y-2">
            <QuickAction
              icon={MicrophoneIcon}
              label="Start a meeting"
              description="Invite Lira to a live conversation"
              onClick={() => navigate('/meetings')}
              accent
            />
            <QuickAction
              icon={BriefcaseIcon}
              label="Start an interview"
              description="AI-assisted candidate interview"
              onClick={() => navigate('/org/roles')}
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
        )}

        {/* ── Meetings ── */}
        {tab === 'meetings' && (
          <div>
            <RecentMeetings meetings={meetings.slice(0, 8)} />
            {meetings.length > 0 && (
              <button
                onClick={() => navigate('/meetings')}
                className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
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
                className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                View all tasks <ArrowRightIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* ── Interviews ── */}
        {tab === 'interviews' && (
          <div>
            {interviews.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
                  <BriefcaseIcon className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">No interviews yet</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(interviews.map((iv) => iv.title))].slice(0, 10).map((role) => {
                    const count = interviews.filter((iv) => iv.title === role).length
                    return (
                      <button
                        key={role}
                        onClick={() => navigate('/org/roles')}
                        className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <BriefcaseIcon className="h-3.5 w-3.5" />
                        {role}
                        <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => navigate('/org/roles')}
                  className="mt-3 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                >
                  Manage interview roles <ArrowRightIcon className="h-3 w-3" />
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
          if (status.state === 'terminated' || status.state === 'error') {
            if (status.error) setBotError(status.error)
            if (pollRef.current) clearInterval(pollRef.current)
            pollRef.current = null
          }
        } catch {
          // CpuChipIcon no longer found on server (404) — treat as terminated
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
      <div className="mb-8 max-w-3xl">
        <div
          className={cn(
            'rounded-2xl border p-5 transition-colors',
            botState === 'active'
              ? 'border-emerald-200 bg-emerald-50/70'
              : botState === 'error'
                ? 'border-red-200 bg-red-50/70'
                : 'border-amber-200 bg-amber-50/70'
          )}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  botState === 'active'
                    ? 'bg-emerald-100'
                    : botState === 'error'
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                )}
              >
                {isInProgress ? (
                  <ArrowPathIcon className="h-5 w-5 animate-spin text-amber-600" />
                ) : botState === 'active' ? (
                  <RadioIcon className="h-5 w-5 animate-pulse text-emerald-600" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    botState === 'active'
                      ? 'text-emerald-800'
                      : botState === 'error'
                        ? 'text-red-800'
                        : 'text-amber-800'
                  )}
                >
                  {stateLabel[botState] ?? botState}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                  <VideoCameraIcon className="h-3 w-3" />
                  {platform === 'google_meet' ? 'Google Meet' : 'Zoom'}
                </p>
              </div>
            </div>

            {isActive && botState !== 'leaving' && (
              <button
                onClick={handleTerminate}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Remove from call
              </button>
            )}
            {botState === 'error' && (
              <button
                onClick={clearBot}
                className="shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Try again
              </button>
            )}
          </div>

          {storeError && <p className="mt-3 text-sm text-red-600">{storeError}</p>}

          {botState === 'in_lobby' && (
            <p className="mt-3 text-sm text-sky-700">
              Admit Lira from your meeting to let her join.
            </p>
          )}
        </div>
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
    <div className="mb-8 max-w-3xl">
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="mb-3.5 text-sm font-semibold text-gray-900">Invite Lira to your meeting</h2>

        {/* Meeting type chips */}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {MEETING_TYPES.map(({ value, label }) => {
            const selected = (meetingType ?? 'meeting') === value
            return (
              <button
                key={value}
                onClick={() => setMeetingType(value === 'meeting' && !meetingType ? null : value)}
                className={cn(
                  'rounded-full border px-3 py-0.5 text-xs font-medium transition',
                  selected
                    ? 'border-violet-300 bg-violet-50 text-violet-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="url"
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-16 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
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
                    'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                    detectedPlatform === 'google_meet'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-sky-100 text-sky-700'
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
            className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deploying ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Add Lira'
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2.5 flex items-center gap-1.5 text-sm text-red-600">
            <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}
      </div>

      {/* Capability anchors */}
      <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-0.5 px-1 text-xs text-gray-400">
        <span>Also:</span>
        <button
          onClick={() => navigate('/org/roles')}
          className="font-medium text-gray-500 transition hover:text-violet-600"
        >
          Conduct interviews
        </button>
        <span>·</span>
        <button
          onClick={() => navigate('/org/tasks')}
          className="font-medium text-gray-500 transition hover:text-violet-600"
        >
          Manage tasks
        </button>
        <span>·</span>
        <button
          onClick={() => navigate('/org/knowledge')}
          className="font-medium text-gray-500 transition hover:text-violet-600"
        >
          Knowledge base
        </button>
        <span>·</span>
        <span className="italic">Sales calls (coming soon)</span>
      </div>
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────
function DashboardPage() {
  const navigate = useNavigate()
  const { token, userName } = useAuthStore()
  const { currentOrgId, organizations } = useOrgStore()
  const lastTerminatedAt = useBotStore((s) => s.lastTerminatedAt)

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

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

    setMeetings([])

    setTasks([])

    setInterviews([])

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
    const interviewP = currentOrgId
      ? listInterviews(currentOrgId).catch(() => [] as Interview[])
      : Promise.resolve([] as Interview[])

    Promise.all([statsP, meetingP, taskP, interviewP]).then(([s, m, t, iv]) => {
      m.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      t.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setStats(s)
      setMeetings(m)
      setTasks(t)
      setInterviews(iv)
      setLoading(false)
    })
  }, [token, currentOrgId, navigate])

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
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 h-8 w-64 animate-pulse rounded-xl bg-gray-200" />
        <div className="mb-6 h-[104px] animate-pulse rounded-2xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Welcome header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {greeting}
            {firstName ? `, ${firstName}` : ''}!
          </h1>
          {currentOrg && (
            <p className="mt-1 text-sm text-gray-500">
              You're working in{' '}
              <span className="font-semibold text-gray-700">{currentOrg.name}</span>
            </p>
          )}
        </div>
      </div>

      {/* ── Deploy hero bar ── */}
      <DeployHeroBar />

      {/* ── Stat cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total meetings"
          value={stats?.meetings_total ?? meetings.length}
          icon={MicrophoneIcon}
          accent="orange"
          onClick={() => navigate('/meetings')}
        />
        <StatCard
          label="Pending tasks"
          value={stats?.tasks_pending ?? tasks.length}
          icon={ClipboardDocumentCheckIcon}
          accent="amber"
          onClick={() => navigate('/org/tasks')}
        />
        <StatCard
          label="Interviews"
          value={stats?.interviews_total ?? interviews.length}
          icon={BriefcaseIcon}
          accent="violet"
          onClick={() => navigate('/org/roles')}
        />
        <StatCard
          label="Last activity"
          value={(() => {
            // Find most recent item across meetings, tasks, interviews
            type AnyItem = { created_at: string; _kind: string }
            const candidates: AnyItem[] = [
              ...meetings.map((m) => ({ created_at: m.created_at, _kind: 'Meeting' })),
              ...tasks.map((t) => ({ created_at: t.created_at, _kind: 'Task' })),
              ...interviews.map((iv) => ({ created_at: iv.created_at, _kind: 'Interview' })),
            ]
            if (stats?.last_activity_at && candidates.length === 0) {
              return timeAgo(stats.last_activity_at)
            }
            if (candidates.length === 0) return '—'
            const latest = candidates.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            return `${latest._kind} · ${timeAgo(latest.created_at)}`
          })()}
          icon={ClockIcon}
          accent="teal"
        />
      </div>

      {/* ── Activity panel ── */}
      <ActivityPanel
        meetings={meetings}
        tasks={tasks}
        interviews={interviews}
        navigate={navigate}
      />
    </div>
  )
}

export { DashboardPage }
