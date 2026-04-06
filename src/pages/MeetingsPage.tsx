import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTopRightOnSquareIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MicrophoneIcon,
  PencilIcon,
  PlusIcon,
  RadioIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  TrashIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore, useBotStore, useUserPrefsStore } from '@/app/store'
import { PageLoader } from '@/components/ui/page-loader'
import {
  listMeetings,
  deleteMeeting,
  updateMeeting,
  deployBot,
  getBotStatus,
  listActiveBots,
  terminateBot,
  muteBotApi,
  unmuteBotApi,
  triggerBotSpeakApi,
  listSchedules,
  createSchedule,
  updateSchedule as updateScheduleApi,
  deleteSchedule,
  toggleSchedule,
  type Meeting,
  type MeetingType,
  type MeetingSchedule,
  type CreateScheduleInput,
  type BotState,
} from '@/services/api'
import { BotDeployPanel as _BotDeployPanel } from '@/components/bot-deploy'
import { ScheduleModal } from '@/components/schedules'
import { cn } from '@/lib'

// ── Meeting type metadata ────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<string, string> = {
  meeting: 'General',
  standup: 'Stand-up',
  one_on_one: '1-on-1',
  technical: 'Technical',
  brainstorming: 'Brainstorm',
  sales: 'Sales',
  interview: 'Interview',
}

const MEETING_TYPE_COLORS: Record<string, string> = {
  meeting: 'bg-gray-100 text-gray-600',
  standup: 'bg-[#3730a3]/10 text-[#3730a3]',
  one_on_one: 'bg-[#4f46e5]/10 text-[#4f46e5]',
  technical: 'bg-amber-100 text-amber-700',
  brainstorming: 'bg-orange-100 text-orange-700',
  sales: 'bg-emerald-100 text-emerald-700',
  interview: 'bg-purple-100 text-purple-700',
}

const MEETING_TYPES: { value: MeetingType; label: string }[] = [
  { value: 'meeting', label: 'General' },
  { value: 'standup', label: 'Stand-up' },
  { value: 'one_on_one', label: '1-on-1' },
  { value: 'technical', label: 'Technical' },
  { value: 'brainstorming', label: 'Brainstorm' },
  { value: 'sales', label: 'Sales' },
]

const GOOGLE_MEET_RE = /^https?:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i
const ZOOM_RE = /^https?:\/\/[\w.-]*zoom\.us\/(j|my)\//i

function detectPlatform(url: string): 'google_meet' | 'zoom' | null {
  if (GOOGLE_MEET_RE.test(url)) return 'google_meet'
  if (ZOOM_RE.test(url)) return 'zoom'
  return null
}

const STATE_LABELS: Record<BotState, string> = {
  launching: 'Launching…',
  navigating: 'Opening meeting…',
  in_lobby: 'Waiting in lobby',
  joining: 'Joining…',
  active: 'Lira is in the meeting',
  leaving: 'Leaving…',
  terminated: 'Meeting ended',
  error: 'Something went wrong',
}

// ── CompactInviteBar ─────────────────────────────────────────────────────────

function CompactInviteBar() {
  const { aiName, voiceId, personality } = useUserPrefsStore()
  const { currentOrgId } = useOrgStore()
  const { botId, botState, platform, setBotDeployed, setBotState, clearBot } = useBotStore()

  const [meetingLink, setMeetingLink] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('meeting')
  const [deploying, setDeploying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Mute/speak state
  const [isMuted, setIsMuted] = useState(true)
  const [muteLoading, setMuteLoading] = useState(false)
  const [speakLoading, setSpeakLoading] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const status = await getBotStatus(id)
        setBotState(status.state)
        if (status.is_muted !== undefined) setIsMuted(status.is_muted)
        if (status.state === 'terminated' || status.state === 'error') {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch {
        setBotState('terminated')
        if (pollRef.current) clearInterval(pollRef.current)
        pollRef.current = null
      }
    }, 2000)
  }

  useEffect(() => {
    if (botId && botState && botState !== 'terminated' && botState !== 'error') {
      startPolling(botId)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // On mount: restore active bot
  useEffect(() => {
    if (botId && botState && botState !== 'terminated' && botState !== 'error') return
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

  // Auto-reset terminated state
  useEffect(() => {
    if (botState !== 'terminated') return
    const t = setTimeout(() => clearBot(), 4000)
    return () => clearTimeout(t)
  }, [botState, clearBot])

  async function handleDeploy() {
    const url = meetingLink.trim()
    if (!url) return
    const plat = detectPlatform(url)
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
        meetingType
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
      // polling will reconcile
    } finally {
      setMuteLoading(false)
    }
  }

  async function handleSpeak() {
    if (!botId || speakLoading) return
    setSpeakLoading(true)
    try {
      await triggerBotSpeakApi(botId)
      setIsMuted(false)
    } catch {
      // ignore
    } finally {
      setSpeakLoading(false)
    }
  }

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

  const isActive = botState && botState !== 'terminated' && botState !== 'error'
  const detectedPlatform = meetingLink.trim() ? detectPlatform(meetingLink.trim()) : null

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#0f0f0f] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
      {/* Glass shimmer */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.06]" />

      <div className="relative">
        {/* Active bot banner */}
        {botId && botState && botState !== 'terminated' && (
          <div className="mb-4 space-y-2">
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm',
                botState === 'active'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : botState === 'error'
                    ? 'border-red-500/30 bg-red-500/10 text-red-400'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              )}
            >
              <div className="flex items-center gap-2">
                {botState === 'active' ? (
                  <RadioIcon className="h-4 w-4 animate-pulse" />
                ) : (
                  <img
                    src="/lira_black.png"
                    alt="Loading"
                    className="h-4 w-4 animate-spin opacity-50"
                    style={{ animationDuration: '1.2s' }}
                  />
                )}
                <span className="font-semibold">{STATE_LABELS[botState]}</span>
                {botState === 'active' && isMuted && (
                  <span className="text-xs text-amber-400">(muted)</span>
                )}
                <span className="text-xs opacity-60">
                  {platform === 'google_meet'
                    ? '· Google Meet'
                    : platform === 'zoom'
                      ? '· Zoom'
                      : ''}
                </span>
              </div>
            </div>

            {/* Controls row */}
            {botState === 'active' && (
              <div className="flex gap-2">
                <button
                  onClick={handleMuteToggle}
                  disabled={muteLoading}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                    isMuted
                      ? 'bg-white text-[#3730a3] hover:bg-gray-100'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  )}
                >
                  {isMuted ? (
                    <>
                      <SpeakerWaveIcon className="h-3.5 w-3.5" /> Unmute
                    </>
                  ) : (
                    <>
                      <SpeakerXMarkIcon className="h-3.5 w-3.5" /> Mute
                    </>
                  )}
                </button>
                <button
                  onClick={handleSpeak}
                  disabled={speakLoading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3730a3] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#312e81]"
                >
                  <ChatBubbleLeftEllipsisIcon className="h-3.5 w-3.5" />
                  Speak
                </button>
                <button
                  onClick={handleTerminate}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                >
                  End
                </button>
              </div>
            )}

            {isActive && botState !== 'active' && (
              <button
                onClick={handleTerminate}
                className="w-full rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                End
              </button>
            )}
          </div>
        )}

        {botId && botState === 'terminated' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
            <CheckIcon className="h-4 w-4" />
            <span className="font-semibold">Lira has left the meeting</span>
          </div>
        )}

        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              Add Lira
            </p>
            <h2 className="text-base font-bold text-white">Invite to a meeting</h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3730a3]">
            <VideoCameraIcon className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Meeting type chips */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {MEETING_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMeetingType(value)}
              disabled={deploying || !!isActive}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                meetingType === value
                  ? 'border-[#3730a3] bg-[#3730a3] text-white'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Link input + deploy button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="url"
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 pr-16 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/30 disabled:opacity-40"
              placeholder="Paste Google Meet or Zoom link…"
              value={meetingLink}
              onChange={(e) => {
                setMeetingLink(e.target.value)
                setLocalError(null)
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
              disabled={deploying || !!isActive}
            />
            {detectedPlatform && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                    detectedPlatform === 'google_meet'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  )}
                >
                  {detectedPlatform === 'google_meet' ? 'Meet' : 'Zoom'}
                </span>
              </div>
            )}
            {!detectedPlatform && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20">
                <VideoCameraIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          <button
            onClick={handleDeploy}
            disabled={deploying || !meetingLink.trim() || !!isActive}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
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
              <>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                Add Lira
              </>
            )}
          </button>
        </div>

        {localError && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-400">
            <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" />
            {localError}
          </p>
        )}
      </div>
    </div>
  )
}

// ── MeetingTypeBadge ─────────────────────────────────────────────────────────

function MeetingTypeBadge({ type }: { type?: string }) {
  if (!type) return null
  const label = MEETING_TYPE_LABELS[type] ?? type
  const color = MEETING_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-500'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        color
      )}
    >
      {label}
    </span>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function duration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return '—'
  const mins = Math.round(ms / 60_000)
  if (mins < 1) return '<1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ── Schedule helpers ────────────────────────────────────────────────────────

const RECURRENCE_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays',
  weekly: 'Weekly',
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatRecurrence(rec: { type: string; days_of_week?: number[] }): string {
  if (rec.type === 'weekly' && rec.days_of_week?.length) {
    return rec.days_of_week.map((d) => SHORT_DAYS[d]).join(', ')
  }
  return RECURRENCE_LABELS[rec.type] ?? rec.type
}

function formatScheduleTime(time: string, timezone: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  const shortTz = timezone.split('/').pop()?.replace(/_/g, ' ') ?? timezone
  return `${h12}:${String(m).padStart(2, '0')} ${period} (${shortTz})`
}

function formatNextRun(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs < 0) return 'Soon'
  const diffH = Math.floor(diffMs / 3_600_000)
  if (diffH < 1) return `in ${Math.max(1, Math.floor(diffMs / 60_000))} min`
  if (diffH < 24) return `in ${diffH}h`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

// ── Component ────────────────────────────────────────────────────────────────

function MeetingsPage() {
  const navigate = useNavigate()
  const { token } = useAuthStore()
  const { currentOrgId } = useOrgStore()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Inline title editing
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [savingTitleId, setSavingTitleId] = useState<string | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Schedules
  const [schedules, setSchedules] = useState<MeetingSchedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<MeetingSchedule | null>(null)
  const [togglingScheduleId, setTogglingScheduleId] = useState<string | null>(null)
  const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    fetchMeetings()
    fetchSchedules()
  }, [token, currentOrgId, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editingTitleId && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [editingTitleId])

  async function fetchMeetings() {
    setLoading(true)
    setError(null)
    try {
      const data = await listMeetings(currentOrgId ?? undefined)
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setMeetings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  async function fetchSchedules() {
    setSchedulesLoading(true)
    try {
      const data = await listSchedules(currentOrgId ?? undefined)
      setSchedules(data)
    } catch {
      /* schedules fail silently — non-critical */
    } finally {
      setSchedulesLoading(false)
    }
  }

  async function handleCreateOrUpdateSchedule(input: CreateScheduleInput) {
    if (editingSchedule) {
      const updated = await updateScheduleApi(
        editingSchedule.schedule_id,
        input,
        currentOrgId ?? undefined
      )
      setSchedules((prev) => prev.map((s) => (s.schedule_id === updated.schedule_id ? updated : s)))
    } else {
      const created = await createSchedule({ ...input, org_id: currentOrgId ?? undefined })
      setSchedules((prev) => [created, ...prev])
    }
  }

  async function handleToggleSchedule(scheduleId: string, enabled: boolean) {
    setTogglingScheduleId(scheduleId)
    try {
      await toggleSchedule(scheduleId, enabled, currentOrgId ?? undefined)
      setSchedules((prev) =>
        prev.map((s) => (s.schedule_id === scheduleId ? { ...s, enabled } : s))
      )
    } catch {
      /* ignore */
    } finally {
      setTogglingScheduleId(null)
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    if (!confirm('Delete this schedule? Lira will stop joining this meeting.')) return
    setDeletingScheduleId(scheduleId)
    try {
      await deleteSchedule(scheduleId, currentOrgId ?? undefined)
      setSchedules((prev) => prev.filter((s) => s.schedule_id !== scheduleId))
    } catch {
      /* ignore */
    } finally {
      setDeletingScheduleId(null)
    }
  }

  async function handleSaveTitle(sessionId: string) {
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      setEditingTitleId(null)
      return
    }
    setSavingTitleId(sessionId)
    try {
      await updateMeeting(sessionId, { title: trimmed })
      setMeetings((prev) =>
        prev.map((m) => (m.session_id === sessionId ? { ...m, title: trimmed } : m))
      )
    } catch {
      /* ignore */
    } finally {
      setSavingTitleId(null)
      setEditingTitleId(null)
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Delete this meeting? This cannot be undone.')) return
    setDeletingId(sessionId)
    try {
      await deleteMeeting(sessionId)
      setMeetings((prev) => prev.filter((m) => m.session_id !== sessionId))
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null)
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} meeting(s)? This cannot be undone.`)) return
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map((id) => deleteMeeting(id)))
      setMeetings((prev) => prev.filter((m) => !selectedIds.has(m.session_id)))
      setSelectedIds(new Set())
    } catch {
      /* ignore */
    } finally {
      setBulkDeleting(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === meetings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(meetings.map((m) => m.session_id)))
    }
  }

  // ── Derived stats ────────────────────────────────────────────────────────
  const totalMessages = meetings.reduce((sum, m) => sum + (m.messages ?? []).length, 0)
  const withTranscripts = meetings.filter((m) => (m.messages ?? []).length > 0).length

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* ── Page header ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workspace
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Meetings</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://docs.liraintelligence.com/getting-started/navigation#meetings"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
            >
              <BookOpenIcon className="h-3.5 w-3.5" />
              Docs
            </a>
            {meetings.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSelectAll}
                  className="rounded-xl border border-white/60 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition hover:shadow-md"
                >
                  {selectedIds.size === meetings.length ? 'Deselect all' : 'Select all'}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="flex items-center gap-1.5 rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50"
                  >
                    {bulkDeleting ? (
                      <img
                        src="/lira_black.png"
                        alt="Loading"
                        className="h-3.5 w-3.5 animate-spin opacity-50"
                        style={{ animationDuration: '1.2s' }}
                      />
                    ) : (
                      <TrashIcon className="h-3.5 w-3.5" />
                    )}
                    Delete {selectedIds.size}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Dark deploy hero ── */}
        <div className="mb-5">
          <CompactInviteBar />
        </div>

        {/* ── Recurring Schedules ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDaysIcon className="h-4.5 w-4.5 text-[#3730a3]" />
              <h2 className="text-sm font-bold text-gray-900">Recurring Schedules</h2>
              {schedules.length > 0 && (
                <span className="rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-[10px] font-bold text-[#3730a3]">
                  {schedules.length}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setEditingSchedule(null)
                setShowScheduleModal(true)
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#312e81]"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New Schedule
            </button>
          </div>

          {schedulesLoading ? (
            <div className="flex items-center justify-center rounded-2xl border border-white/60 bg-white py-8">
              <img
                src="/lira_black.png"
                alt="Loading"
                className="h-5 w-5 animate-spin opacity-30"
                style={{ animationDuration: '1.2s' }}
              />
            </div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white/60 py-8 text-center">
              <CalendarDaysIcon className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No recurring schedules yet</p>
              <p className="mt-1 text-xs text-gray-300">
                Create one to have Lira auto-join your meetings
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedules.map((s) => (
                <div
                  key={s.schedule_id}
                  className={cn(
                    'group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/60 bg-white px-4 py-3.5 shadow-sm transition hover:border-[#3730a3]/30 hover:shadow-md',
                    deletingScheduleId === s.schedule_id && 'pointer-events-none opacity-50',
                    !s.enabled && 'opacity-60'
                  )}
                >
                  {/* Left accent */}
                  <div
                    className={cn(
                      'absolute left-0 top-0 h-full w-0.5',
                      s.enabled ? 'bg-[#3730a3]' : 'bg-gray-200'
                    )}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-gray-900">{s.name}</h3>
                      {s.meeting_type && <MeetingTypeBadge type={s.meeting_type} />}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <ClockIcon className="h-3 w-3" />
                        {formatScheduleTime(s.time, s.timezone)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatRecurrence(s.recurrence)}
                      </span>
                      {s.next_run_at && s.enabled && (
                        <span className="text-xs text-emerald-500 font-medium">
                          Next: {formatNextRun(s.next_run_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle switch */}
                    <button
                      onClick={() => handleToggleSchedule(s.schedule_id, !s.enabled)}
                      disabled={togglingScheduleId === s.schedule_id}
                      className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                        s.enabled ? 'bg-[#3730a3]' : 'bg-gray-200'
                      )}
                      title={s.enabled ? 'Disable' : 'Enable'}
                    >
                      <span
                        className={cn(
                          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform',
                          s.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                        )}
                      />
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingSchedule(s)
                        setShowScheduleModal(true)
                      }}
                      className="rounded-lg p-1.5 text-gray-300 transition hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                      title="Edit schedule"
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteSchedule(s.schedule_id)}
                      className="rounded-lg p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      title="Delete schedule"
                    >
                      {deletingScheduleId === s.schedule_id ? (
                        <img
                          src="/lira_black.png"
                          alt="Loading"
                          className="h-3.5 w-3.5 animate-spin opacity-50"
                          style={{ animationDuration: '1.2s' }}
                        />
                      ) : (
                        <TrashIcon className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Schedule Modal ── */}
        <ScheduleModal
          open={showScheduleModal}
          onClose={() => {
            setShowScheduleModal(false)
            setEditingSchedule(null)
          }}
          onSave={handleCreateOrUpdateSchedule}
          editing={editingSchedule}
        />

        {/* ── Stat strip ── */}
        {!loading && !error && (
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              {
                label: 'Total Meetings',
                value: meetings.length,
                accent: 'from-[#1c1c1e] via-[#141414] to-[#0a0a0a]',
                glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
              },
              {
                label: 'With Transcripts',
                value: withTranscripts,
                accent: 'from-[#1c1c1e] via-[#141414] to-[#0a0a0a]',
                glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
              },
              {
                label: 'Total Messages',
                value: totalMessages,
                accent: 'from-[#1c1c1e] via-[#141414] to-[#0a0a0a]',
                glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
              },
            ].map(({ label, value, accent, glow }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} ${glow} p-4`}
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.10] to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.07]" />
                <div className="relative">
                  <p className="text-xl font-bold text-white">{value}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                    {label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── States ── */}
        {loading && <PageLoader label="Loading meetings…" />}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-white px-5 py-4 text-sm text-red-600 shadow-sm">
            {error}
          </div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-white/60 bg-white py-16 text-center shadow-sm">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#3730a3]/10">
              <MicrophoneIcon className="h-7 w-7 text-[#3730a3]" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">No meetings yet</h2>
            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Use the deploy bar above to send Lira to your first meeting.
            </p>
          </div>
        )}

        {/* ── Meeting list ── */}
        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-2.5">
            {meetings.map((m) => (
              <div
                key={m.session_id}
                className={cn(
                  'group relative flex items-start gap-3 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm transition hover:border-[#3730a3]/30 hover:shadow-md',
                  deletingId === m.session_id && 'pointer-events-none opacity-50',
                  selectedIds.has(m.session_id) && 'border-[#3730a3]/40 bg-[#3730a3]/[0.03]'
                )}
              >
                {/* Left accent bar */}
                <div
                  className={cn(
                    'absolute left-0 top-0 h-full w-0.5 transition-all',
                    selectedIds.has(m.session_id)
                      ? 'bg-[#3730a3]'
                      : 'bg-transparent group-hover:bg-[#3730a3]/40'
                  )}
                />

                {/* Checkbox */}
                <button
                  className="shrink-0 pl-4 pt-4"
                  onClick={() => toggleSelect(m.session_id)}
                  aria-label="Select meeting"
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-md border-2 transition',
                      selectedIds.has(m.session_id)
                        ? 'border-[#3730a3] bg-[#3730a3]'
                        : 'border-gray-200 hover:border-[#3730a3]'
                    )}
                  >
                    {selectedIds.has(m.session_id) && (
                      <svg viewBox="0 0 10 8" fill="none" className="h-full w-full p-0.5">
                        <path
                          d="M1 4l3 3 5-6"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Body */}
                <div className="min-w-0 flex-1 py-3.5 pr-12">
                  {/* Title row */}
                  <div className="flex items-center gap-2">
                    {editingTitleId === m.session_id ? (
                      <div
                        role="presentation"
                        className="flex min-w-0 flex-1 items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <input
                          ref={titleInputRef}
                          className="min-w-0 flex-1 rounded-lg border border-[#3730a3]/50 bg-white px-2 py-0.5 text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#3730a3]/20"
                          value={titleDraft}
                          onChange={(e) => setTitleDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTitle(m.session_id)
                            if (e.key === 'Escape') setEditingTitleId(null)
                          }}
                          maxLength={200}
                        />
                        <button
                          onClick={() => handleSaveTitle(m.session_id)}
                          disabled={savingTitleId === m.session_id}
                          className="shrink-0 rounded-lg p-1 text-emerald-600 transition hover:bg-emerald-50"
                        >
                          {savingTitleId === m.session_id ? (
                            <img
                              src="/lira_black.png"
                              alt="Loading"
                              className="h-3.5 w-3.5 animate-spin opacity-50"
                              style={{ animationDuration: '1.2s' }}
                            />
                          ) : (
                            <CheckIcon className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => navigate(`/meetings/${m.session_id}`)}
                        >
                          <h3 className="truncate text-sm font-semibold text-gray-900 transition group-hover:text-[#3730a3]">
                            {m.title || 'Untitled Meeting'}
                          </h3>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTitleId(m.session_id)
                            setTitleDraft(m.title || '')
                          }}
                          className="shrink-0 rounded-lg p-1 text-gray-300 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100"
                          title="Edit title"
                        >
                          <PencilIcon className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {m.meeting_type && <MeetingTypeBadge type={m.meeting_type} />}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <CalendarIcon className="h-3 w-3" />
                      {formatDate(m.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ClockIcon className="h-3 w-3" />
                      {formatTime(m.created_at)} · {duration(m.created_at, m.updated_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <ChatBubbleLeftIcon className="h-3 w-3" />
                      {(m.messages ?? []).length} msg{(m.messages ?? []).length !== 1 ? 's' : ''}
                    </span>
                    {(m.messages ?? []).length > 0 && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                        Transcript
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete btn */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(m.session_id)
                  }}
                  className="absolute right-3 top-3 rounded-xl p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                  title="Delete meeting"
                >
                  {deletingId === m.session_id ? (
                    <img
                      src="/lira_black.png"
                      alt="Loading"
                      className="h-4 w-4 animate-spin opacity-50"
                      style={{ animationDuration: '1.2s' }}
                    />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export { MeetingsPage }
