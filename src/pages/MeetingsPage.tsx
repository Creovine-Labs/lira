import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, MessageSquare, Trash2, Loader2, Building2, Mic } from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import { listMeetings, deleteMeeting, type Meeting } from '@/services/api'
import { BotDeployPanel } from '@/components/bot-deploy'
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
              {bulkDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Delete {selectedIds.size} selected
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
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
          <div className="flex flex-col items-center gap-8 py-12">
            {/* CTA heading */}
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
                <Mic className="h-7 w-7 text-violet-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Deploy Lira to your first meeting</h2>
              <p className="mt-2 max-w-sm text-sm text-gray-500">
                Paste a Google Meet or Zoom link below and Lira will join as an AI participant, take
                notes, and respond in real-time.
              </p>
            </div>

            {/* Deploy panel */}
            <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <BotDeployPanel />
            </div>
          </div>
        )}

        {!loading && !error && meetings.length > 0 && (
          <div className="space-y-3">
            {meetings.map((m) => {
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
    </div>
  )
}

export { MeetingsPage }
