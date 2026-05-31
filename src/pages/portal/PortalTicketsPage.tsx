// /portal/:orgId/tickets — token-scoped list of the customer's tickets.
//
// First-load behaviour: if the URL carries `?access_token=…` (the customer
// just clicked the email link), lift it into sessionStorage and strip it
// from the address bar before we render anything. From then on the token
// lives in sessionStorage and is appended to every request by `portal-api`.
//
// Polling cadence per SUPPORT_TICKETING_API.md §7:
//   • 10 s while the tab is focused
//   • 60 s when backgrounded (slightly more relaxed than the 5–10s the
//     operator inbox uses — the customer is not actively triaging).
// We diff against the previous list and animate only newly-arrived rows
// to avoid full re-renders.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChatBubbleLeftRightIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import {
  PortalTokenError,
  listPortalTickets,
  type PortalTicketSummary,
} from '@/services/api/portal-api'
import { clearPortalAuth, getPortalAuth } from '@/lib/portal-token'
import {
  PortalCard,
  PortalLayout,
  SerifHeading,
  StatusBadge,
  SubtleText,
  TicketNumber,
  usePortalSession,
} from './PortalChrome'
import { relativeTime } from './portal-format'

const POLL_FOCUSED_MS = 10_000
const POLL_BACKGROUND_MS = 60_000

export function PortalTicketsPage() {
  const { orgId = '' } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const { ready: sessionReady, mode, auth } = usePortalSession(orgId)
  const hasAuth = auth !== null
  const [verifiedExpired, setVerifiedExpired] = useState(false)

  // Forced sign-out — if any portal request 401s anywhere in the app:
  //   • magic-link mode: bounce back to the access page so they can
  //     request a new link
  //   • verified mode: show an in-page "session expired" state. The FE
  //     can't recover; the embedding SDK has to re-mint the URL.
  useEffect(() => {
    if (!orgId) return
    const handler = (e: Event) => {
      const evt = e as CustomEvent<{ orgId: string; authKind: 'magic_link' | 'verified' | null }>
      if (evt.detail?.orgId !== orgId) return
      if (evt.detail?.authKind === 'verified' || mode === 'verified') {
        setVerifiedExpired(true)
        return
      }
      navigate(`/portal/${orgId}/access`, { replace: true })
    }
    window.addEventListener('lira:portal-token-expired', handler)
    return () => window.removeEventListener('lira:portal-token-expired', handler)
  }, [orgId, mode, navigate])

  const [tickets, setTickets] = useState<PortalTicketSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<string>>(new Set())
  const previousIdsRef = useRef<Set<string>>(new Set())

  const load = useCallback(
    async ({ silent }: { silent: boolean }) => {
      if (!orgId || !getPortalAuth(orgId)) return
      if (!silent) setLoading(true)
      try {
        const next = await listPortalTickets(orgId)
        const prev = previousIdsRef.current
        const arrivedIds = new Set(
          next.filter((t) => !prev.has(t.ticket_id)).map((t) => t.ticket_id)
        )
        // First load shouldn't animate — only mark new arrivals when we
        // already had a baseline.
        if (prev.size > 0 && arrivedIds.size > 0) {
          setNewlyArrivedIds(arrivedIds)
          // Clear the highlight after the entry animation finishes so the
          // row settles into its resting state.
          window.setTimeout(() => setNewlyArrivedIds(new Set()), 1400)
        }
        previousIdsRef.current = new Set(next.map((t) => t.ticket_id))
        setTickets(next)
        setError(null)
      } catch (err) {
        if (err instanceof PortalTokenError) {
          // The expired-event handler will redirect — no need to set error.
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load your tickets.')
        if (silent) toast.error('Could not refresh tickets — will retry.')
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [orgId]
  )

  // Initial fetch + visibility-aware polling
  useEffect(() => {
    if (!sessionReady || !hasAuth || verifiedExpired) return
    void load({ silent: false })

    let intervalId: number | null = null
    const start = () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      const ms = document.visibilityState === 'visible' ? POLL_FOCUSED_MS : POLL_BACKGROUND_MS
      intervalId = window.setInterval(() => void load({ silent: true }), ms)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Fast catch-up: re-fetch immediately on tab focus.
        void load({ silent: true })
      }
      start()
    }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [sessionReady, hasAuth, verifiedExpired, load])

  if (!orgId) return <Navigate to="/" replace />
  if (!sessionReady) return null

  if (verifiedExpired) {
    return (
      <PortalLayout>
        <VerifiedExpiredCard />
      </PortalLayout>
    )
  }

  if (!hasAuth) {
    if (mode === 'verified') {
      return (
        <PortalLayout>
          <VerifiedMissingCard />
        </PortalLayout>
      )
    }
    return <Navigate to={`/portal/${orgId}/access`} replace />
  }

  return (
    <PortalLayout>
      <div className="space-y-8">
        <header className="space-y-3">
          <SerifHeading>Your tickets</SerifHeading>
          <SubtleText>
            Everything you've started with us, in one place. Tap a ticket to read the thread or
            reply.
          </SubtleText>
        </header>

        {loading && tickets.length === 0 ? (
          <TicketListSkeleton />
        ) : error && tickets.length === 0 ? (
          <PortalCard className="space-y-3">
            <p className="text-[14px] font-semibold text-[#020308]">
              We couldn't load your tickets.
            </p>
            <SubtleText>{error}</SubtleText>
            <button
              type="button"
              onClick={() => void load({ silent: false })}
              className="text-[13px] font-medium text-[#020308] underline-offset-2 hover:underline"
            >
              Try again
            </button>
          </PortalCard>
        ) : tickets.length === 0 ? (
          <EmptyState mode={mode} orgId={orgId} navigate={navigate} />
        ) : (
          <>
            <ul className="space-y-2.5">
              {tickets.map((t) => {
                const routeBase = mode === 'verified' ? '/verified' : '/portal'
                return (
                  <TicketRow
                    key={t.ticket_id}
                    ticket={t}
                    isNew={newlyArrivedIds.has(t.ticket_id)}
                    onClick={() =>
                      navigate(
                        `${routeBase}/${orgId}/tickets/${encodeURIComponent(t.ticket_number)}`
                      )
                    }
                  />
                )
              })}
            </ul>

            {mode === 'magic_link' && (
              <div className="flex items-center justify-center pt-4">
                <button
                  type="button"
                  onClick={() => {
                    clearPortalAuth(orgId)
                    navigate(`/portal/${orgId}/access`, { replace: true })
                  }}
                  className="text-[12px] text-[#020308]/45 underline-offset-2 transition hover:text-[#020308]/70 hover:underline"
                >
                  Sign out
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </PortalLayout>
  )
}

interface TicketRowProps {
  ticket: PortalTicketSummary
  isNew: boolean
  onClick: () => void
}

function TicketRow({ ticket, isNew, onClick }: TicketRowProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center gap-4 rounded-2xl border border-black/[0.06] bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:border-black/15 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${
          isNew ? 'animate-portal-row-in' : ''
        }`}
      >
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <TicketNumber value={ticket.ticket_number} />
            <StatusBadge status={ticket.status} />
            {ticket.priority === 'urgent' && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/15">
                Urgent
              </span>
            )}
          </div>
          <p className="truncate text-[15px] font-medium text-[#020308]">{ticket.subject}</p>
          <p className="text-[12px] text-[#020308]/50">Updated {relativeTime(ticket.updated_at)}</p>
        </div>

        <ChevronRightIcon className="h-4 w-4 shrink-0 text-[#020308]/30 transition group-hover:translate-x-0.5 group-hover:text-[#020308]/60" />
      </button>
    </li>
  )
}

function TicketListSkeleton() {
  return (
    <ul className="space-y-2.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-[92px] animate-pulse rounded-2xl border border-black/[0.06] bg-white"
        />
      ))}
    </ul>
  )
}

function EmptyState({
  mode,
  orgId,
  navigate,
}: {
  mode: 'magic_link' | 'verified'
  orgId: string
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <PortalCard className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#020308]/[0.04]">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-[#020308]/55" />
      </div>
      <div className="space-y-1.5">
        <p className="text-[14px] font-semibold text-[#020308]">No tickets here yet</p>
        <SubtleText className="max-w-[360px] text-[13px]">
          When you start a conversation that the team needs to follow up on, it'll show up here.
        </SubtleText>
      </div>
      {mode === 'magic_link' && (
        <button
          type="button"
          onClick={() => {
            clearPortalAuth(orgId)
            navigate(`/portal/${orgId}/access`, { replace: true })
          }}
          className="mt-2 text-[12px] text-[#020308]/55 underline-offset-2 transition hover:text-[#020308] hover:underline"
        >
          Sign in with a different email
        </button>
      )}
    </PortalCard>
  )
}

function VerifiedExpiredCard() {
  return (
    <PortalCard className="space-y-3 text-center">
      <p className="text-[14px] font-semibold text-[#020308]">Your session has expired.</p>
      <SubtleText className="text-[13px]">
        Refresh the page to start a new session. If the issue persists, contact the team that
        embedded this portal.
      </SubtleText>
    </PortalCard>
  )
}

function VerifiedMissingCard() {
  return (
    <PortalCard className="space-y-3 text-center">
      <p className="text-[14px] font-semibold text-[#020308]">No active session.</p>
      <SubtleText className="text-[13px]">
        This page expects to be opened from your support embed. Open it from there to continue.
      </SubtleText>
    </PortalCard>
  )
}
