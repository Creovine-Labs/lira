// /support/integrations/outbox — Phase 6 §4.1–4.3.
//
// Deliberately boring (per doc §7 "Outbox" guidance). It's an admin-only
// surface that the operator visits when a Slack/Linear/webhook delivery
// is misbehaving. Dense table, monospace ids, single-row retry, status
// filter chips.
//
// Two ergonomic decisions worth calling out:
//   • `completed` items older than 7 days are hidden by default (they're
//     noise — the worker has already done its job). Toggle to surface.
//   • The "Drain now" button is rate-limited to one in-flight call at a
//     time and shows the returned stats so the operator knows what the
//     synchronous drain actually touched.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InboxArrowDownIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  Squares2X2Icon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import {
  drainOutbox,
  listIntegrationOutbox,
  retryOutboxItem,
  type OutboxItem,
  type OutboxStatus,
  type OutboxProvider,
} from '@/services/api/support-api'
import { cn } from '@/lib'
import { Pill, type PillTone } from './Pill'

const STATUS_FILTERS: {
  value: OutboxStatus | 'all'
  label: string
  Icon: typeof ClockIcon
}[] = [
  { value: 'all', label: 'All', Icon: Squares2X2Icon },
  { value: 'pending', label: 'Pending', Icon: ClockIcon },
  { value: 'in_flight', label: 'In flight', Icon: PlayCircleIcon },
  { value: 'completed', label: 'Completed', Icon: CheckCircleIcon },
  { value: 'failed', label: 'Failed', Icon: ExclamationTriangleIcon },
  { value: 'dead', label: 'Dead', Icon: XCircleIcon },
]

const OUTBOX_STATUS_META: Record<
  OutboxStatus,
  { tone: PillTone; label: string; Icon: typeof ClockIcon }
> = {
  pending: { tone: 'neutral', label: 'Pending', Icon: ClockIcon },
  in_flight: { tone: 'brand', label: 'In flight', Icon: PlayCircleIcon },
  completed: { tone: 'success', label: 'Completed', Icon: CheckCircleIcon },
  failed: { tone: 'danger', label: 'Failed', Icon: ExclamationTriangleIcon },
  dead: { tone: 'neutral', label: 'Dead', Icon: XCircleIcon },
}

const COMPLETED_HIDE_AFTER_MS = 7 * 24 * 60 * 60 * 1000

function SupportOutboxPage() {
  const { currentOrgId } = useOrgStore()
  const navigate = useNavigate()
  const [items, setItems] = useState<OutboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<OutboxStatus | 'all'>('all')
  const [showOldCompleted, setShowOldCompleted] = useState(false)
  const [retrying, setRetrying] = useState<string | null>(null)
  const [draining, setDraining] = useState(false)
  const [lastDrain, setLastDrain] = useState<{
    at: number
    stats: { drained: number; succeeded: number; failed: number }
  } | null>(null)
  // `now` captured once at mount — keeps the "hide completed > 7d" filter
  // pure during render (react-hooks/purity).
  const [now] = useState(() => Date.now())

  const load = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!currentOrgId) return
      if (!opts.silent) setLoading(true)
      try {
        const next = await listIntegrationOutbox(currentOrgId)
        setItems(next)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not load outbox')
      } finally {
        if (!opts.silent) setLoading(false)
      }
    },
    [currentOrgId]
  )

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    let subset = filter === 'all' ? items : items.filter((i) => i.status === filter)
    if (!showOldCompleted) {
      subset = subset.filter((i) => {
        if (i.status !== 'completed') return true
        const t = i.updated_at ? new Date(i.updated_at).getTime() : 0
        if (!Number.isFinite(t) || t === 0) return true
        return now - t < COMPLETED_HIDE_AFTER_MS
      })
    }
    // Most pressing first: failed/dead, then in_flight, then pending, then completed
    return [...subset].sort((a, b) => {
      const rank = (s: OutboxStatus) =>
        s === 'failed' || s === 'dead' ? 0 : s === 'in_flight' ? 1 : s === 'pending' ? 2 : 3
      const r = rank(a.status) - rank(b.status)
      if (r !== 0) return r
      const at = new Date(a.updated_at).getTime() || 0
      const bt = new Date(b.updated_at).getTime() || 0
      return bt - at
    })
  }, [items, filter, showOldCompleted, now])

  const counts = useMemo(() => {
    const out: Record<OutboxStatus, number> = {
      pending: 0,
      in_flight: 0,
      completed: 0,
      failed: 0,
      dead: 0,
    }
    for (const i of items) out[i.status] = (out[i.status] ?? 0) + 1
    return out
  }, [items])

  const handleRetry = useCallback(
    async (itemId: string) => {
      if (!currentOrgId) return
      setRetrying(itemId)
      // Optimistic: flip to pending in-place.
      setItems((prev) =>
        prev.map((i) => (i.item_id === itemId ? { ...i, status: 'pending' as const } : i))
      )
      try {
        await retryOutboxItem(currentOrgId, itemId)
        toast.success('Retry queued')
        void load({ silent: true })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Retry failed')
        // Roll back the optimistic flip via reload.
        void load({ silent: true })
      } finally {
        setRetrying(null)
      }
    },
    [currentOrgId, load]
  )

  const handleDrain = useCallback(async () => {
    if (!currentOrgId || draining) return
    setDraining(true)
    try {
      const stats = await drainOutbox(currentOrgId)
      setLastDrain({ at: Date.now(), stats })
      toast.success(
        `Drained ${stats.drained} (${stats.succeeded} succeeded, ${stats.failed} failed)`
      )
      void load({ silent: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Drain failed')
    } finally {
      setDraining(false)
    }
  }, [currentOrgId, draining, load])

  const activeLabel = STATUS_FILTERS.find((f) => f.value === filter)?.label ?? 'All'

  return (
    <div className="flex h-full overflow-hidden bg-[#ebebeb]">
      {/* ── Left rail: delivery-status views ─────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white">
            <InboxArrowDownIcon className="h-4 w-4" />
          </span>
          <h1 className="text-sm font-bold tracking-tight text-gray-900">Outreach</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Delivery status
          </p>
          {STATUS_FILTERS.map((v) => {
            const count = v.value === 'all' ? items.length : counts[v.value]
            const active = filter === v.value
            return (
              <button
                key={v.value}
                onClick={() => setFilter(v.value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
                  active ? 'bg-[#020308] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <v.Icon
                  className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-gray-400')}
                />
                <span className="flex-1 truncate text-left">{v.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-gray-100 p-3">
          <button
            type="button"
            onClick={handleDrain}
            disabled={draining}
            title="Synchronously drain all due items. Use sparingly — the background worker handles normal traffic."
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#020308] px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60"
          >
            <BoltIcon className="h-4 w-4" />
            {draining ? 'Draining…' : 'Drain now'}
          </button>
          <label className="flex cursor-pointer items-center gap-1.5 px-1 text-[11px] text-gray-500">
            <input
              type="checkbox"
              checked={showOldCompleted}
              onChange={(e) => setShowOldCompleted(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-[#020308] focus:ring-[#020308]"
            />
            Show completed &gt; 7 days
          </label>
        </div>
      </aside>

      {/* ── Main: toolbar + table ────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-gray-900">{activeLabel}</h2>
              <span className="text-xs font-medium text-gray-400">{visible.length}</span>
            </div>
            <button
              type="button"
              onClick={handleDrain}
              disabled={draining}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60 lg:hidden"
            >
              <BoltIcon className="h-4 w-4" />
              {draining ? 'Draining…' : 'Drain'}
            </button>
          </div>

          {/* Mobile-only horizontal status selector (rail hidden under lg) */}
          <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 lg:hidden">
            {STATUS_FILTERS.map((v) => (
              <button
                key={v.value}
                onClick={() => setFilter(v.value)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition',
                  filter === v.value ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {lastDrain && (
            <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
              Last drain: <strong>{lastDrain.stats.drained}</strong> items touched ·{' '}
              <strong>{lastDrain.stats.succeeded}</strong> succeeded ·{' '}
              <strong>{lastDrain.stats.failed}</strong> failed
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
            </div>
          ) : visible.length === 0 ? (
            <EmptyState
              hasAnyItems={items.length > 0}
              filter={filter}
              onClearFilter={() => setFilter('all')}
            />
          ) : (
            <div className="mx-auto max-w-6xl">
              <OutboxTable
                items={visible}
                retrying={retrying}
                now={now}
                onRetry={handleRetry}
                onOpenTicket={(id) => navigate(`/support/tickets/${id}`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Table ────────────────────────────────────────────────────────────────

function OutboxTable({
  items,
  retrying,
  now,
  onRetry,
  onOpenTicket,
}: {
  items: OutboxItem[]
  retrying: string | null
  now: number
  onRetry: (id: string) => void
  onOpenTicket: (ticketId: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-[12px]">
          <thead className="border-b border-gray-100 bg-gray-50/60 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <tr>
              <th className="px-3 py-2.5 font-bold">Provider</th>
              <th className="px-3 py-2.5 font-bold">Event</th>
              <th className="px-3 py-2.5 font-bold">Status</th>
              <th className="px-3 py-2.5 text-right font-bold">Attempts</th>
              <th className="px-3 py-2.5 font-bold">Last error</th>
              <th className="px-3 py-2.5 font-bold">Last attempted</th>
              <th className="px-3 py-2.5 font-bold">External</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.map((item) => (
              <OutboxRow
                key={item.item_id}
                item={item}
                retrying={retrying === item.item_id}
                now={now}
                onRetry={() => onRetry(item.item_id)}
                onOpenTicket={() => onOpenTicket(item.ticket_id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OutboxRow({
  item,
  retrying,
  now,
  onRetry,
  onOpenTicket,
}: {
  item: OutboxItem
  retrying: boolean
  now: number
  onRetry: () => void
  onOpenTicket: () => void
}) {
  const canRetry = item.status === 'failed' || item.status === 'dead'
  return (
    <tr className="text-gray-700">
      <td className="px-3 py-2.5 font-semibold text-gray-900">
        <ProviderBadge provider={item.provider} />
      </td>
      <td className="px-3 py-2.5 font-mono text-[11px] text-gray-600">{item.event_type}</td>
      <td className="px-3 py-2.5">
        <OutboxStatusBadge status={item.status} />
      </td>
      <td className="px-3 py-2.5 text-right font-mono text-[11px]">
        <span
          className={item.attempt_count >= item.max_attempts ? 'text-rose-700' : 'text-gray-600'}
        >
          {item.attempt_count}/{item.max_attempts}
        </span>
      </td>
      <td className="max-w-[220px] truncate px-3 py-2.5 text-rose-700" title={item.last_error}>
        {item.last_error ?? '—'}
      </td>
      <td className="px-3 py-2.5 text-gray-500">
        {item.last_attempted_at ? relativeTime(item.last_attempted_at, now) : '—'}
      </td>
      <td className="px-3 py-2.5">
        {item.external_url ? (
          <a
            href={item.external_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono text-[11px] text-[#020308] underline-offset-2 hover:underline"
            title={item.external_id}
          >
            <span className="max-w-[120px] truncate">{item.external_id ?? 'open'}</span>
            <ArrowTopRightOnSquareIcon className="h-3 w-3 text-gray-400" />
          </a>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>
      <td className="px-3 py-2.5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={onOpenTicket}
            className="rounded-md px-1.5 py-0.5 text-[11px] text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            title="Open ticket"
          >
            Ticket
          </button>
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="inline-flex items-center gap-1 rounded-md bg-[#020308] px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              <ArrowPathIcon className={cn('h-3 w-3', retrying && 'animate-spin')} aria-hidden />
              {retrying ? 'Retrying' : 'Retry'}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Status / provider badges ─────────────────────────────────────────────

function OutboxStatusBadge({ status }: { status: OutboxStatus }) {
  const { tone, label, Icon } = OUTBOX_STATUS_META[status]
  return (
    <Pill tone={tone} Icon={Icon}>
      {label}
    </Pill>
  )
}

const PROVIDER_COLOR: Record<OutboxProvider, string> = {
  slack: 'bg-[#4A154B]/10 text-[#4A154B]',
  linear: 'bg-[#5E6AD2]/10 text-[#5E6AD2]',
  webhook: 'bg-gray-100 text-gray-700',
}

function ProviderBadge({ provider }: { provider: OutboxProvider }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        PROVIDER_COLOR[provider]
      )}
    >
      {provider}
    </span>
  )
}

// ── Empty state ──────────────────────────────────────────────────────────

function EmptyState({
  hasAnyItems,
  filter,
  onClearFilter,
}: {
  hasAnyItems: boolean
  filter: OutboxStatus | 'all'
  onClearFilter: () => void
}) {
  if (!hasAnyItems) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16 shadow-sm">
        <PauseCircleIcon className="mb-3 h-9 w-9 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">Outreach is empty</p>
        <p className="mt-1 max-w-md text-center text-xs text-gray-400">
          No outbound integrations have fired yet. Once you connect Slack, Linear, or a webhook,
          delivery attempts will show up here.
        </p>
      </div>
    )
  }
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16 shadow-sm">
      <PauseCircleIcon className="mb-3 h-9 w-9 text-gray-300" />
      <p className="text-sm font-semibold text-gray-500">No {filter.replace('_', ' ')} items</p>
      <p className="mt-1 max-w-md text-center text-xs text-gray-400">
        Nothing matches this filter right now.
      </p>
      <button
        type="button"
        onClick={onClearFilter}
        className="mt-3 text-[12px] font-semibold text-[#020308] underline-offset-2 hover:underline"
      >
        Show all
      </button>
    </div>
  )
}

// ── Tiny relative-time helper ────────────────────────────────────────────
//
// Duplicates the portal helper rather than importing it across domains —
// the operator UI deserves its own copy that we can iterate on without
// affecting the customer-facing format.
function relativeTime(iso: string, now: number): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = now - t
  const abs = Math.abs(diff)
  if (abs < 60_000) return 'just now'
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m ago`
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ago`
  if (abs < 7 * 86_400_000) return `${Math.round(abs / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}

export { SupportOutboxPage }
