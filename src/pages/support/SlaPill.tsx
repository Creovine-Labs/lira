// SLA pill — shared between the operator ticket list rows and the ticket
// detail header. Reads `next_response_due_at` (preferred — it's the
// shorter clock) or falls back to `resolution_due_at`.
//
// Color shifts per SUPPORT_TICKETING_API.md §7:
//   • green  > 30m left
//   • amber  0–30m left
//   • red    overdue
//
// `now` is a prop so the parent can capture it once at mount (keeps render
// pure — react-hooks/purity disallows Date.now() during render).

import { ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import type { SupportTicketRecord } from '@/services/api/support-api'
import { cn } from '@/lib'

type TicketShape = Pick<SupportTicketRecord, 'status' | 'resolved_at' | 'created_at'> & {
  next_response_due_at?: string | null
  resolution_due_at?: string | null
}

interface SlaPillProps {
  ticket: TicketShape
  now: number
  /** Compact = single-letter style for use in dense table rows. */
  compact?: boolean
  className?: string
}

export function SlaPill({ ticket, now, compact, className }: SlaPillProps) {
  // Terminal statuses don't have an SLA clock anymore — render nothing.
  if (
    ticket.status === 'resolved' ||
    ticket.status === 'closed' ||
    (ticket.status as string) === 'merged'
  ) {
    return null
  }

  const due = ticket.next_response_due_at ?? ticket.resolution_due_at ?? null
  if (!due) return null
  const dueTime = new Date(due).getTime()
  if (!Number.isFinite(dueTime)) return null

  const diffMs = dueTime - now
  const minutes = Math.round(diffMs / 60_000)
  const overdue = diffMs < 0
  const atRisk = !overdue && minutes <= 30

  const tone = overdue
    ? 'bg-rose-50 text-rose-700 ring-rose-600/15'
    : atRisk
      ? 'bg-amber-50 text-amber-800 ring-amber-600/20'
      : 'bg-emerald-50 text-emerald-700 ring-emerald-600/15'

  const Icon = overdue ? ExclamationTriangleIcon : ClockIcon
  const label = formatRelative(diffMs)
  const display = overdue ? `${label} overdue` : `${label} left`

  return (
    <span
      title={
        ticket.next_response_due_at
          ? `Next response due ${new Date(ticket.next_response_due_at).toLocaleString()}`
          : `Resolution due ${due ? new Date(due).toLocaleString() : ''}`
      }
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        tone,
        className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {compact ? label : display}
    </span>
  )
}

// "1h 23m" / "5m" / "12h" — short-form for badges. Always positive; the
// caller decides what direction (over/left) to render.
function formatRelative(diffMs: number): string {
  const abs = Math.abs(diffMs)
  const totalMin = Math.round(abs / 60_000)
  if (totalMin < 60) return `${totalMin}m`
  const h = Math.floor(totalMin / 60)
  const m = totalMin - h * 60
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h - d * 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}
