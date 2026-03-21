import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Loader2,
  MessageSquare,
  Mic,
  Pencil,
  Radio,
  Trash2,
  Video,
  X,
} from 'lucide-react'

import { useAuthStore, useOrgStore, useBotStore, useUserPrefsStore } from '@/app/store'
import {
  listMeetings,
  deleteMeeting,
  updateMeeting,
  deployBot,
  getBotStatus,
  listActiveBots,
  terminateBot,
  type Meeting,
  type MeetingType,
  type BotState,
} from '@/services/api'
import { BotDeployPanel as _BotDeployPanel } from '@/components/bot-deploy'
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
  meeting: 'bg-gray-100 text-gray-500',
  standup: 'bg-sky-100 text-sky-700',
  one_on_one: 'bg-violet-100 text-violet-700',
  technical: 'bg-amber-100 text-amber-700',
  brainstorming: 'bg-orange-100 text-orange-700',
  sales: 'bg-emerald-100 text-emerald-700',
  interview: 'bg-pink-100 text-pink-700',
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
  const {
    botId,
    botState,
    platform,
    setBotDeployed,
    setBotState,
    clearBot,
  } = useBotStore()

  const [meetingLink, setMeetingLink] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('meeting')
  const [deploying, setDeploying] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startPolling = (id: string) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      try {
        const status = await getBotStatus(id)
        setBotState(status.state)
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
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
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
        url, aiName, { ai_name: aiName, voice_id: voiceId, personality },
        currentOrgId ?? undefined, undefined, meetingType,
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

  async function handleTerminate() {
    if (!botId) return
    try {
      await terminateBot(botId)
      setBotState('terminated')
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    } catch { /* ignore */ }
  }

  const isActive = botState && botState !== 'terminated' && botState !== 'error'
  const detectedPlatform = meetingLink.trim() ? detectPlatform(meetingLink.trim()) : null

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      {/* Active bot status banner */}
      {botId && botState && botState !== 'terminated' && (
        <div className={cn(
          'mb-3 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm',
          botState === 'active'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : botState === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-700',
        )}>
          <div className="flex items-center gap-2">
            {botState === 'active' ? (
              <Radio className="h-4 w-4 animate-pulse" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span className="font-medium">{STATE_LABELS[botState]}</span>
            <span className="text-xs opacity-70">
              {platform === 'google_meet' ? '· Google Meet' : platform === 'zoom' ? '· Zoom' : ''}
            </span>
          </div>
          {isActive && (
            <button
              onClick={handleTerminate}
              className="shrink-0 rounded-lg border border-current/20 px-2.5 py-1 text-xs font-medium transition hover:bg-black/5"
            >
              End
            </button>
          )}
        </div>
      )}

      {/* Bot terminated banner */}
      {botId && botState === 'terminated' && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check className="h-4 w-4" />
          <span className="font-medium">Lira has left the meeting</span>
        </div>
      )}

      <h2 className="mb-3 text-sm font-semibold text-gray-900">Invite Lira to a meeting</h2>

      {/* Meeting type chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {MEETING_TYPES.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setMeetingType(value)}
            disabled={deploying || !!isActive}
            className={cn(
              'rounded-full border px-3 py-0.5 text-xs font-medium transition',
              meetingType === value
                ? 'border-violet-300 bg-violet-50 text-violet-700'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Link input + Send button */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-16 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
            placeholder="Paste Google Meet or Zoom link…"
            value={meetingLink}
            onChange={(e) => { setMeetingLink(e.target.value); setLocalError(null) }}
            onKeyDown={(e) => e.key === 'Enter' && handleDeploy()}
            disabled={deploying || !!isActive}
          />
          {detectedPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                detectedPlatform === 'google_meet'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-sky-100 text-sky-700',
              )}>
                {detectedPlatform === 'google_meet' ? 'Meet' : 'Zoom'}
              </span>
            </div>
          )}
          {!detectedPlatform && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Video className="h-4 w-4" />
            </div>
          )}
        </div>
        <button
          onClick={handleDeploy}
          disabled={deploying || !meetingLink.trim() || !!isActive}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deploying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Send Lira
            </>
          )}
        </button>
      </div>

      {localError && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {localError}
        </p>
      )}
    </div>
  )
}

// ── MeetingTypeBadge ─────────────────────────────────────────────────────────

function MeetingTypeBadge({ type }: { type?: string }) {
  if (!type) return null
  const label = MEETING_TYPE_LABELS[type] ?? type
  const color = MEETING_TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-500'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', color)}>
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

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    fetchMeetings()
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

  async function handleSaveTitle(sessionId: string) {
    const trimmed = titleDraft.trim()
    if (!trimmed) { setEditingTitleId(null); return }
    setSavingTitleId(sessionId)
    try {
      await updateMeeting(sessionId, { title: trimmed })
      setMeetings((prev) => prev.map((m) => m.session_id === sessionId ? { ...m, title: trimmed } : m))
    } catch { /* ignore */ } finally {
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
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(sessionId); return next })
    } catch { /* ignore */ } finally {
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
    } catch { /* ignore */ } finally {
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

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <Mic className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Meetings</h1>
            <p className="text-sm text-gray-500">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meetings.length > 1 && (
            <button
              onClick={toggleSelectAll}
              className="text-xs text-gray-400 hover:text-gray-700 transition"
            >
              {selectedIds.size === meetings.length ? 'Deselect all' : 'Select all'}
            </button>
          )}
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
            >
              {bulkDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">

        {/* Invite Lira bar — always visible at top */}
        <CompactInviteBar />

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-gray-500">Loading meetings…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <Mic className="h-7 w-7 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">No meetings yet</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Use the invite bar above to send Lira to your first meeting. She'll join as an AI
                participant, take notes, and respond in real-time.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((m) => (
              <div
                key={m.session_id}
                className={cn(
                  'relative flex items-start gap-3 rounded-xl border bg-card transition hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5',
                  deletingId === m.session_id && 'opacity-50 pointer-events-none',
                  selectedIds.has(m.session_id) && 'border-violet-500/50 bg-violet-500/5',
                )}
              >
                {/* Checkbox */}
                <button
                  className="shrink-0 pl-4 pt-4 pb-4"
                  onClick={() => toggleSelect(m.session_id)}
                  aria-label="Select meeting"
                >
                  <div
                    className={cn(
                      'h-4 w-4 rounded border-2 transition',
                      selectedIds.has(m.session_id)
                        ? 'bg-violet-600 border-violet-600'
                        : 'border-muted-foreground/30 hover:border-violet-500',
                    )}
                  >
                    {selectedIds.has(m.session_id) && (
                      <svg viewBox="0 0 10 8" fill="none" className="h-full w-full p-0.5">
                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Card body */}
                <div className="flex-1 py-4 pr-12 min-w-0">
                  {/* Title row with inline edit */}
                  <div className="flex items-center gap-2 min-w-0">
                    {editingTitleId === m.session_id ? (
                      <div className="flex flex-1 items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={titleInputRef}
                          className="flex-1 min-w-0 rounded-lg border border-violet-400 bg-white px-2 py-0.5 text-sm font-medium text-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
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
                          className="shrink-0 rounded p-1 text-emerald-600 hover:bg-emerald-50"
                          title="Save"
                        >
                          {savingTitleId === m.session_id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Check className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="min-w-0 flex-1 text-left"
                          onClick={() => navigate(`/meetings/${m.session_id}`)}
                        >
                          <h3 className="truncate font-medium text-foreground">
                            {m.title || 'Untitled Meeting'}
                          </h3>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTitleId(m.session_id)
                            setTitleDraft(m.title || '')
                          }}
                          className="shrink-0 rounded p-1 text-muted-foreground/40 opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-gray-100 transition [.relative:hover_&]:opacity-100"
                          title="Edit title"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Type badge + meta */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {m.meeting_type && <MeetingTypeBadge type={m.meeting_type} />}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(m.created_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatTime(m.created_at)} · {duration(m.created_at, m.updated_at)}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />
                      {(m.messages ?? []).length} messages
                    </span>
                  </div>

                  {/* Status pill */}
                  {(m.messages ?? []).length > 0 && (
                    <div className="mt-1.5">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                        Transcript
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(m.session_id) }}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-destructive/10 hover:text-destructive"
                  title="Delete meeting"
                >
                  {deletingId === m.session_id
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Trash2 className="h-4 w-4" />}
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
