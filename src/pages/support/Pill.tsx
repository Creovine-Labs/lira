import type { ComponentType, ReactNode, SVGProps } from 'react'
import type { ConversationStatus, SupportTicketRecord } from '@/services/api/support-api'
import { cn } from '@/lib'

/**
 * The single, on-brand pill used for every status / tag / label across the
 * support surfaces. One shape, one restrained palette — purple ("brand") for
 * active work, green for done, amber for waiting, rose for needs-attention,
 * slate for neutral. This replaces the scattered ad-hoc badge colors so the
 * product reads as deliberately designed rather than defaulting to whatever
 * Tailwind hue was nearest.
 */

export type PillTone = 'brand' | 'success' | 'warn' | 'danger' | 'neutral'

const TONE: Record<PillTone, { wrap: string; dot: string }> = {
  brand: { wrap: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15', dot: 'bg-indigo-500' },
  success: { wrap: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  warn: { wrap: 'bg-amber-50 text-amber-700 ring-amber-600/15', dot: 'bg-amber-500' },
  danger: { wrap: 'bg-rose-50 text-rose-700 ring-rose-600/15', dot: 'bg-rose-500' },
  neutral: { wrap: 'bg-slate-100 text-slate-600 ring-slate-500/15', dot: 'bg-slate-400' },
}

type IconType = ComponentType<SVGProps<SVGSVGElement>>

export function Pill({
  tone = 'neutral',
  children,
  dot = false,
  Icon,
  uppercase = false,
  className,
}: {
  tone?: PillTone
  children: ReactNode
  dot?: boolean
  Icon?: IconType
  uppercase?: boolean
  className?: string
}) {
  const t = TONE[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        uppercase && 'uppercase tracking-wide',
        t.wrap,
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', t.dot)} />}
      {Icon && <Icon className="h-3 w-3 shrink-0" aria-hidden />}
      {children}
    </span>
  )
}

// ── Domain → tone/label maps ──────────────────────────────────────────────────

export function ticketStatusMeta(status: SupportTicketRecord['status']): {
  tone: PillTone
  label: string
} {
  switch (status) {
    case 'open':
      return { tone: 'brand', label: 'Open' }
    case 'in_progress':
      return { tone: 'brand', label: 'In progress' }
    case 'pending':
      return { tone: 'warn', label: 'Pending' }
    case 'on_hold':
      return { tone: 'neutral', label: 'On hold' }
    case 'escalated':
      return { tone: 'danger', label: 'Escalated' }
    case 'resolved':
      return { tone: 'success', label: 'Resolved' }
    case 'closed':
      return { tone: 'neutral', label: 'Closed' }
    case 'merged':
      return { tone: 'neutral', label: 'Merged' }
    case 'snoozed':
      return { tone: 'warn', label: 'Snoozed' }
    default:
      return { tone: 'neutral', label: status }
  }
}

export function conversationStatusMeta(status: ConversationStatus): {
  tone: PillTone
  label: string
} {
  switch (status) {
    case 'open':
      return { tone: 'brand', label: 'Open' }
    case 'pending':
      return { tone: 'warn', label: 'Pending' }
    case 'escalated':
      return { tone: 'danger', label: 'Escalated' }
    case 'resolved':
      return { tone: 'success', label: 'Resolved' }
    default:
      return { tone: 'neutral', label: status }
  }
}

export function priorityMeta(priority: SupportTicketRecord['priority']): {
  tone: PillTone
  label: string
} {
  switch (priority) {
    case 'urgent':
      return { tone: 'danger', label: 'Urgent' }
    case 'high':
      return { tone: 'warn', label: 'High' }
    default:
      return { tone: 'neutral', label: priority }
  }
}
