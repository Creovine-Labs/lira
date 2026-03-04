import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MessageSquare, Trash2, Loader2 } from 'lucide-react'

import { useAuthStore } from '@/app/store'
import { listMeetings, deleteMeeting, type Meeting } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { cn } from '@/lib'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    fetchMeetings()
  }, [token, navigate])

  async function fetchMeetings() {
    setLoading(true)
    setError(null)
    try {
      const data = await listMeetings()
      // Sort newest first
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setMeetings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Delete this meeting? This cannot be undone.')) return
    setDeletingId(sessionId)
    try {
      await deleteMeeting(sessionId)
      setMeetings((prev) => prev.filter((m) => m.session_id !== sessionId))
    } catch {
      // ignore
    } finally {
      setDeletingId(null)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <LiraLogo size="sm" />
            <h1 className="text-lg font-semibold">Meeting History</h1>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-muted-foreground">Loading meetings…</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No meetings yet</p>
            <p className="text-xs text-muted-foreground/70">
              Meetings will appear here after Lira joins a call.
            </p>
          </div>
        )}

        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((m) => (
              <div
                key={m.session_id}
                className={cn(
                  'group relative rounded-xl border bg-card transition hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5',
                  deletingId === m.session_id && 'opacity-50 pointer-events-none'
                )}
              >
                {/* Clickable card body */}
                <button
                  className="w-full px-5 py-4 text-left"
                  onClick={() => navigate(`/meetings/${m.session_id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-foreground">
                        {m.title || 'Untitled Meeting'}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(m.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(m.created_at)} · {duration(m.created_at, m.updated_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {m.messages.length} messages
                        </span>
                      </div>
                    </div>

                    {/* Status pill */}
                    {m.messages.length > 0 && (
                      <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                        Transcript
                      </span>
                    )}
                  </div>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(m.session_id)
                  }}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground/50 opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  title="Delete meeting"
                >
                  {deletingId === m.session_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export { MeetingsPage }
