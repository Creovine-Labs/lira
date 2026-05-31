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
  PauseCircleIcon,
  PlayCircleIcon,
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

const STATUS_FILTERS: { value: OutboxStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_flight', label: 'In flight' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
  { value: 'dead', label: 'Dead' },
]

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

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Integrations
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Delivery outbox
            </h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              Every outbound message to Slack, Linear, and webhooks queues here. Retries are
              automatic — this surface is for inspecting the trail when something goes wrong.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDrain}
            disabled={draining}
            title="Synchronously drain all due items. Use sparingly — the background worker handles normal traffic."
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-wait disabled:opacity-60'
            )}
          >
            <BoltIcon className="h-4 w-4" />
            {draining ? 'Draining…' : 'Drain now'}
          </button>
        </header>

        {lastDrain && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800">
            Last drain: <strong>{lastDrain.stats.drained}</strong> items touched ·{' '}
            <strong>{lastDrain.stats.succeeded}</strong> succeeded ·{' '}
            <strong>{lastDrain.stats.failed}</strong> failed
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl border border-white/60 bg-white p-1 shadow-sm">
            {STATUS_FILTERS.map((tab) => {
              const count = tab.value === 'all' ? items.length : counts[tab.value]
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                    filter === tab.value
                      ? 'bg-[#020308] text-white'
                      : 'text-gray-500 hover:bg-gray-50'
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded px-1.5 py-0.5 text-[10px] font-bold',
                      filter === tab.value ? 'bg-white/15 text-white' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <label className="ml-1 inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-gray-500">
            <input
              type="checkbox"
              checked={showOldCompleted}
              onChange={(e) => setShowOldCompleted(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-[#020308] focus:ring-[#020308]"
            />
            Show completed &gt; 7 days
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            hasAnyItems={items.length > 0}
            filter={filter}
            onClearFilter={() => setFilter('all')}
          />
        ) : (
          <OutboxTable
            items={visible}
            retrying={retrying}
            now={now}
            onRetry={handleRetry}
            onOpenTicket={(id) => navigate(`/support/tickets/${id}`)}
          />
        )}
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

const STATUS_STYLE: Record<
  OutboxStatus,
  { cls: string; label: string; Icon: typeof CheckCircleIcon }
> = {
  pending: { cls: 'bg-sky-50 text-sky-700 ring-sky-600/15', label: 'Pending', Icon: ClockIcon },
  in_flight: {
    cls: 'bg-indigo-50 text-indigo-700 ring-indigo-600/15',
    label: 'In flight',
    Icon: PlayCircleIcon,
  },
  completed: {
    cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    label: 'Completed',
    Icon: CheckCircleIcon,
  },
  failed: {
    cls: 'bg-rose-50 text-rose-700 ring-rose-600/15',
    label: 'Failed',
    Icon: ExclamationTriangleIcon,
  },
  dead: {
    cls: 'bg-slate-100 text-slate-700 ring-slate-600/15',
    label: 'Dead',
    Icon: XCircleIcon,
  },
}

function OutboxStatusBadge({ status }: { status: OutboxStatus }) {
  const { cls, label, Icon } = STATUS_STYLE[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset',
        cls
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {label}
    </span>
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
        <p className="text-sm font-semibold text-gray-500">Outbox is empty</p>
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
