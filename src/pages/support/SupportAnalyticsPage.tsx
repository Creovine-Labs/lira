// /support/analytics — Phase 7 §5.1–5.4 + legacy Weekly Report.
//
// Five tabs:
//   • Overview    — §5.1 backlog + learning metrics
//   • SLA         — §5.2 hit-rate + averages + breached/at-risk picker hint
//   • Categories  — §5.3 category counts + root causes
//   • Agents      — §5.4 per-agent open/resolved + avg resolution
//   • Weekly      — legacy `getWeeklyReport` (kept until the team archives it)
//
// Each tab loads its endpoint on first activation (lazy) so opening the page
// doesn't fan out 5 parallel requests when the operator only wants one view.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTrendingUpIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChartPieIcon,
  ClockIcon,
  Squares2X2Icon,
  TagIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'
import {
  getTicketAnalyticsAgents,
  getTicketAnalyticsCategories,
  getTicketAnalyticsOverview,
  getTicketAnalyticsSla,
  type AgentMetric,
  type CategoryAnalytics,
  type TicketAnalyticsOverview,
  type TicketSlaMetrics,
} from '@/services/api/support-api'
import {
  Donut,
  HitGauge,
  HorizontalBars,
  MetricTile,
  StatCard,
  type BarDatum,
  type DonutSlice,
} from './analytics-charts'

const TABS = [
  { key: 'overview', label: 'Overview', icon: Squares2X2Icon },
  { key: 'sla', label: 'SLA', icon: ChartBarIcon },
  { key: 'categories', label: 'Categories', icon: TagIcon },
  { key: 'agents', label: 'Agents', icon: UsersIcon },
  { key: 'weekly', label: 'Weekly Report', icon: ArrowTrendingUpIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

// ── Top-level page chrome ────────────────────────────────────────────────

function SupportAnalyticsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()
  const loadStarted = useRef(false)

  useEffect(() => {
    if (configLoading) loadStarted.current = true
  }, [configLoading])

  useEffect(() => {
    if (!loadStarted.current) return
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-400">
              Backlog, SLA, categories, and per-agent metrics.
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-transparent px-2 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:border-gray-200 hover:bg-white hover:text-gray-600"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
        </div>
        <SupportAnalyticsPanel orgId={currentOrgId} />
      </div>
    </div>
  )
}

// ── Panel + tabs ─────────────────────────────────────────────────────────

function SupportAnalyticsPanel({ orgId }: { orgId: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  return (
    <>
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#020308] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' && <OverviewTab orgId={orgId} />}
      {activeTab === 'sla' && <SlaTab orgId={orgId} />}
      {activeTab === 'categories' && <CategoriesTab orgId={orgId} />}
      {activeTab === 'agents' && <AgentsTab orgId={orgId} />}
      {activeTab === 'weekly' && <WeeklyTab orgId={orgId} />}
    </>
  )
}

// ── Overview tab (§5.1) ──────────────────────────────────────────────────

function OverviewTab({ orgId }: { orgId: string }) {
  const [data, setData] = useState<TicketAnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getTicketAnalyticsOverview(orgId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  const { overview, learning } = data

  const statusBars: BarDatum[] = [
    { label: 'Open', value: overview.open, colorClass: 'bg-sky-500' },
    { label: 'In progress', value: overview.in_progress, colorClass: 'bg-indigo-500' },
    { label: 'Pending', value: overview.pending, colorClass: 'bg-amber-500' },
    { label: 'On hold', value: overview.on_hold, colorClass: 'bg-slate-500' },
    { label: 'Escalated', value: overview.escalated, colorClass: 'bg-orange-500' },
    { label: 'Resolved', value: overview.resolved, colorClass: 'bg-emerald-500' },
    { label: 'Closed', value: overview.closed, colorClass: 'bg-gray-400' },
  ]

  const queueSlices: DonutSlice[] = Object.entries(overview.by_queue).map(([name, value], idx) => ({
    label: name || '(unrouted)',
    value,
    color: QUEUE_PALETTE[idx % QUEUE_PALETTE.length],
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricTile label="Total" value={overview.total} tooltip="All tickets ever opened." />
        <MetricTile
          label="Open"
          value={overview.open}
          tooltip="Active tickets waiting for a first response or follow-up."
          tone={overview.open > 0 ? 'warning' : 'default'}
        />
        <MetricTile
          label="Unassigned"
          value={overview.unassigned}
          tooltip="Tickets in a queue with no agent assigned yet."
          tone={overview.unassigned > 5 ? 'danger' : 'default'}
        />
        <MetricTile
          label="Escalated"
          value={overview.escalated}
          tooltip="Currently sitting in an escalation tier."
          tone={overview.escalated > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">By status</h3>
          <HorizontalBars data={statusBars} />
        </div>

        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">By queue</h3>
          <Donut slices={queueSlices} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="AI ticket conversion"
          value={`${learning.ai_to_ticket_conversion.toFixed(1)}%`}
          hint="Tickets opened from a non-manual source (AI handed off)"
          tooltip="Percentage of all tickets that came from AI conversations rather than manual creation. Lower is better — the AI is resolving more on its own."
        />
        <StatCard
          label="Reopen rate"
          value={`${learning.reopen_rate.toFixed(1)}%`}
          hint="Resolved tickets that came back as not-actually-resolved"
          tooltip="Reopens divided by resolved tickets. Above 8% usually means resolutions are being declared too early."
          tone={learning.reopen_rate > 8 ? 'warning' : 'good'}
        />
        <StatCard
          label="Avg CSAT"
          value={learning.csat_average > 0 ? `${learning.csat_average.toFixed(1)} / 5` : '—'}
          hint={`${learning.csat_negative_count} negative rating${learning.csat_negative_count === 1 ? '' : 's'}`}
          tooltip="Average customer-satisfaction rating across submitted CSAT responses."
          tone={
            learning.csat_average >= 4.5
              ? 'good'
              : learning.csat_average >= 3.5
                ? 'default'
                : 'warning'
          }
        />
      </div>

      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">By priority</h3>
        <HorizontalBars
          data={[
            { label: 'Urgent', value: overview.by_priority.urgent, colorClass: 'bg-rose-500' },
            { label: 'High', value: overview.by_priority.high, colorClass: 'bg-orange-500' },
            { label: 'Medium', value: overview.by_priority.medium, colorClass: 'bg-sky-500' },
            { label: 'Low', value: overview.by_priority.low, colorClass: 'bg-gray-400' },
          ]}
        />
      </div>
    </div>
  )
}

// ── SLA tab (§5.2) ───────────────────────────────────────────────────────

function SlaTab({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<TicketSlaMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getTicketAnalyticsSla(orgId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load SLA')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-[260px_1fr]">
        <div className="flex items-center justify-center rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <HitGauge value={data.hit_rate} label="SLA hit rate" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatCard
            label="Avg first response"
            value={formatMinutes(data.avg_first_response_minutes)}
            hint={`Across ${data.total_with_first_response} tickets that have a first response logged`}
            tooltip="Average time from ticket creation to first agent response."
          />
          <StatCard
            label="Avg resolution"
            value={formatMinutes(data.avg_resolution_minutes)}
            hint={`Across ${data.total_resolved} resolved tickets`}
            tooltip="Average time from ticket creation to resolution."
          />
          <StatCard
            label="Breached"
            value={String(data.breach_count)}
            hint="Currently over the response or resolution due date"
            tone={data.breach_count > 0 ? 'danger' : 'good'}
            tooltip="Tickets that have already missed their SLA targets."
          />
          <StatCard
            label="At risk"
            value={String(data.at_risk_count)}
            hint="Approaching the SLA due date"
            tone={data.at_risk_count > 0 ? 'warning' : 'default'}
            tooltip="Tickets within the at-risk window (typically <30 minutes from breach)."
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Breached &amp; at-risk tickets</h3>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Filter the ticket list to focus on tickets that need immediate triage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/support/tickets?sla=at_risk')}
            className="inline-flex items-center gap-1 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Open ticket list
          </button>
        </div>
        <p className="mt-3 text-[12px] text-gray-500">
          Note — the ticket list filter for SLA status is wired by the operator detail page using
          local data. The aggregate counts here come from the backend scan.
        </p>
      </div>
    </div>
  )
}

// ── Categories tab (§5.3) ────────────────────────────────────────────────

function CategoriesTab({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<CategoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<keyof CategoryAnalytics['categories'][number]>('count')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getTicketAnalyticsCategories(orgId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const sortedCategories = useMemo(() => {
    if (!data) return []
    return [...data.categories].sort((a, b) => {
      const av = a[sortKey] as number | string
      const bv = b[sortKey] as number | string
      if (typeof av === 'number' && typeof bv === 'number') return bv - av
      return String(av).localeCompare(String(bv))
    })
  }, [data, sortKey])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-bold text-gray-900">By category</h3>
          <p className="mt-0.5 text-[11px] text-gray-500">
            Click a row to filter the ticket list by category.
          </p>
        </div>
        {sortedCategories.length === 0 ? (
          <p className="px-5 py-6 text-[12px] text-gray-400">
            No categorised tickets yet — Lira's classifier needs at least a few tickets to start
            grouping.
          </p>
        ) : (
          <table className="w-full text-left text-[12px]">
            <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
              <tr>
                <SortableTh
                  active={sortKey === 'category'}
                  onClick={() => setSortKey('category')}
                  className="w-[40%] px-5 py-2.5"
                >
                  Category
                </SortableTh>
                <SortableTh
                  active={sortKey === 'count'}
                  onClick={() => setSortKey('count')}
                  className="px-3 py-2.5 text-right"
                >
                  Total
                </SortableTh>
                <SortableTh
                  active={sortKey === 'resolved'}
                  onClick={() => setSortKey('resolved')}
                  className="px-3 py-2.5 text-right"
                >
                  Resolved
                </SortableTh>
                <SortableTh
                  active={sortKey === 'escalated'}
                  onClick={() => setSortKey('escalated')}
                  className="px-3 py-2.5 text-right"
                >
                  Escalated
                </SortableTh>
                <SortableTh
                  active={sortKey === 'reopen_count'}
                  onClick={() => setSortKey('reopen_count')}
                  className="px-3 py-2.5 text-right"
                >
                  Reopens
                </SortableTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCategories.map((c) => (
                <tr
                  key={c.category}
                  onClick={() =>
                    navigate(`/support/tickets?category=${encodeURIComponent(c.category)}`)
                  }
                  className="cursor-pointer text-gray-700 hover:bg-gray-50"
                >
                  <td className="px-5 py-2.5 font-semibold text-gray-900">{c.category}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{c.count}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-700">
                    {c.resolved}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-orange-700">
                    {c.escalated}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-rose-700">
                    {c.reopen_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <ChartPieIcon className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-900">Root causes</h3>
        </div>
        <p className="mb-3 text-[11px] text-gray-500">
          Dedupe-keyed clusters — tickets that share a fingerprint, so you can fix the underlying
          issue once. Click to filter the ticket list.
        </p>
        {data.root_causes.length === 0 ? (
          <p className="text-[12px] text-gray-400">No root-cause clusters surfaced yet.</p>
        ) : (
          <ul className="space-y-2">
            {data.root_causes.map((r) => (
              <li key={r.dedupe_key}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/support/tickets?dedupe_key=${encodeURIComponent(r.dedupe_key)}`)
                  }
                  className="block w-full cursor-pointer rounded-lg border border-gray-100 bg-gray-50/40 p-3 text-left transition hover:border-gray-300 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-[11px] text-gray-500">{r.dedupe_key}</p>
                      <p className="mt-0.5 truncate text-[13px] font-semibold text-gray-900">
                        {r.sample_subjects[0] ?? '(no sample subject)'}
                      </p>
                      {r.sample_subjects.length > 1 && (
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                          + {r.sample_subjects.length - 1} similar
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[14px] font-bold text-[#020308]">{r.count}</p>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400">tickets</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// ── Agents tab (§5.4) ────────────────────────────────────────────────────

function AgentsTab({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<AgentMetric[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<keyof AgentMetric>('resolved_count')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getTicketAnalyticsAgents(orgId)
      setData(res.agents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const sorted = useMemo(() => {
    if (!data) return []
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return bv - av
      return String(av).localeCompare(String(bv))
    })
  }, [data, sortKey])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-3">
        <h3 className="text-sm font-bold text-gray-900">Per-agent metrics</h3>
        <p className="mt-0.5 text-[11px] text-gray-500">
          Click a name to filter the ticket list by assignee.
        </p>
      </div>
      {sorted.length === 0 ? (
        <p className="px-5 py-6 text-[12px] text-gray-400">No assigned tickets yet.</p>
      ) : (
        <table className="w-full text-left text-[12px]">
          <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <tr>
              <SortableTh
                active={sortKey === 'user_name'}
                onClick={() => setSortKey('user_name')}
                className="px-5 py-2.5"
              >
                Agent
              </SortableTh>
              <SortableTh
                active={sortKey === 'open_count'}
                onClick={() => setSortKey('open_count')}
                className="px-3 py-2.5 text-right"
              >
                Open
              </SortableTh>
              <SortableTh
                active={sortKey === 'resolved_count'}
                onClick={() => setSortKey('resolved_count')}
                className="px-3 py-2.5 text-right"
              >
                Resolved
              </SortableTh>
              <SortableTh
                active={sortKey === 'avg_resolution_minutes'}
                onClick={() => setSortKey('avg_resolution_minutes')}
                className="px-3 py-2.5 text-right"
              >
                Avg resolution
              </SortableTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((a) => (
              <tr
                key={a.user_id}
                onClick={() =>
                  navigate(`/support/tickets?assignee=${encodeURIComponent(a.user_id)}`)
                }
                className="cursor-pointer text-gray-700 hover:bg-gray-50"
              >
                <td className="px-5 py-2.5 font-semibold text-gray-900">{a.user_name}</td>
                <td className="px-3 py-2.5 text-right font-mono">{a.open_count}</td>
                <td className="px-3 py-2.5 text-right font-mono text-emerald-700">
                  {a.resolved_count}
                </td>
                <td className="px-3 py-2.5 text-right font-mono text-gray-700">
                  {formatMinutes(a.avg_resolution_minutes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── Weekly tab (legacy — kept) ───────────────────────────────────────────

function WeeklyTab({ orgId }: { orgId: string }) {
  const { weeklyReport, loadWeeklyReport } = useSupportStore()

  useEffect(() => {
    loadWeeklyReport(orgId).catch((err) =>
      toast.error(err instanceof Error ? err.message : 'Failed to load weekly report')
    )
  }, [orgId, loadWeeklyReport])

  if (!weeklyReport) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
        <ArrowTrendingUpIcon className="mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-400">No weekly report available yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <h3 className="mb-1 text-sm font-bold text-gray-900">Weekly Summary</h3>
        <p className="mb-4 text-xs text-gray-400">
          {new Date(weeklyReport.period_start).toLocaleDateString()} –{' '}
          {new Date(weeklyReport.period_end).toLocaleDateString()}
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Conversations" value={weeklyReport.total_conversations} />
          <MiniStat label="Autonomous" value={weeklyReport.autonomous_resolutions} />
          <MiniStat label="Escalations" value={weeklyReport.escalations} />
          <MiniStat
            label="Avg CSAT"
            value={weeklyReport.avg_csat ? `${weeklyReport.avg_csat.toFixed(1)}` : '—'}
          />
        </div>
      </div>

      {weeklyReport.top_intents.length > 0 && (
        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">Top Intents</h3>
          <div className="space-y-2">
            {weeklyReport.top_intents.map((item) => (
              <div key={item.intent} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{item.intent}</span>
                <span className="font-medium text-gray-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-gray-900">Knowledge Improvement</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">KB drafts created</span>
            <span className="font-medium text-gray-800">{weeklyReport.kb_drafts_created}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">KB drafts approved</span>
            <span className="font-medium text-gray-800">{weeklyReport.kb_drafts_approved}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared bits ──────────────────────────────────────────────────────────

function SectionSpinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
    </div>
  )
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
      <div className="flex items-center gap-2">
        <ClockIcon className="h-4 w-4" />
        <p className="font-semibold">Couldn't load data</p>
      </div>
      <p className="mt-1 text-[12px]">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 rounded-md bg-rose-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-800"
      >
        Try again
      </button>
    </div>
  )
}

function SortableTh({
  children,
  active,
  onClick,
  className,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <th
      onClick={onClick}
      className={cn(
        'cursor-pointer select-none hover:bg-gray-100',
        active && 'text-[#020308]',
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && <span aria-hidden>▾</span>}
      </span>
    </th>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</p>
    </div>
  )
}

function formatMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return '—'
  if (min < 60) return `${Math.round(min)}m`
  const h = Math.floor(min / 60)
  const m = Math.round(min - h * 60)
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h - d * 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

// Distinct, colour-blind-friendly palette for queue donut slices.
const QUEUE_PALETTE = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#6366f1',
  '#84cc16',
  '#f97316',
]

export { SupportAnalyticsPage, SupportAnalyticsPanel }
