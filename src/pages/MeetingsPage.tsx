import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MessageSquare, Trash2, Loader2, Building2 } from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
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
  const { organizations } = useOrgStore()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [filterOrgId, setFilterOrgId] = useState<string>('all')

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
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(sessionId)
        return next
      })
    } catch {
      // ignore
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
      // ignore partial failures
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
    if (selectedIds.size === filteredMeetings.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredMeetings.map((m) => m.session_id)))
    }
  }

  const filteredMeetings =
    filterOrgId === 'all'
      ? meetings
      : filterOrgId === 'none'
        ? meetings.filter((m) => !m.org_id)
        : meetings.filter((m) => m.org_id === filterOrgId)

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
        {/* Org filter + bulk actions */}
        {!loading && !error && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {organizations.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterOrgId}
                  onChange={(e) => {
                    setFilterOrgId(e.target.value)
                    setSelectedIds(new Set())
                  }}
                  className="rounded-lg border bg-background px-3 py-1.5 text-sm text-foreground"
                >
                  <option value="all">All organizations</option>
                  <option value="none">No organization</option>
                  {organizations.map((org) => (
                    <option key={org.org_id} value={org.org_id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filteredMeetings.length > 0 && (
              <button
                onClick={toggleSelectAll}
                className="text-xs text-muted-foreground hover:text-foreground transition"
              >
                {selectedIds.size === filteredMeetings.length ? 'Deselect all' : 'Select all'}
              </button>
            )}

            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50"
              >
                {bulkDeleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Delete {selectedIds.size} selected
              </button>
            )}
          </div>
        )}

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

        {!loading && !error && filteredMeetings.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {filterOrgId === 'all' ? 'No meetings yet' : 'No meetings for this organization'}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Meetings will appear here after Lira joins a call.
            </p>
          </div>
        )}

        {!loading && !error && filteredMeetings.length > 0 && (
          <div className="space-y-3">
            {filteredMeetings.map((m) => {
              const orgName = organizations.find((o) => o.org_id === m.org_id)?.name
              return (
                <div
                  key={m.session_id}
                  className={cn(
                    'relative flex items-start gap-3 rounded-xl border bg-card transition hover:border-violet-500/30 hover:shadow-md hover:shadow-violet-500/5',
                    deletingId === m.session_id && 'opacity-50 pointer-events-none',
                    selectedIds.has(m.session_id) && 'border-violet-500/50 bg-violet-500/5'
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
                          : 'border-muted-foreground/30 hover:border-violet-500'
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

                  {/* Clickable card body */}
                  <button
                    className="flex-1 py-4 pr-12 text-left"
                    onClick={() => navigate(`/meetings/${m.session_id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-foreground">
                          {m.title || 'Untitled Meeting'}
                        </h3>
                        {orgName && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-violet-500 font-medium mt-0.5">
                            <Building2 className="h-2.5 w-2.5" />
                            {orgName}
                          </span>
                        )}
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
                            {(m.messages ?? []).length} messages
                          </span>
                        </div>
                      </div>

                      {/* Status pill */}
                      {(m.messages ?? []).length > 0 && (
                        <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                          Transcript
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Delete button — always visible */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(m.session_id)
                    }}
                    className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground/60 transition hover:bg-destructive/10 hover:text-destructive"
                    title="Delete meeting"
                  >
                    {deletingId === m.session_id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

export { MeetingsPage }
