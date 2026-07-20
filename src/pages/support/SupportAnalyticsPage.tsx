// /support/analytics
//
// Left-rail layout (matches the Tickets / Inbox pages): a vertical nav of
// reports on the left, the selected report rendered on the right. Every
// metric is a chart, not a scattered box. No SLA report here (SLA lives in
// its own policies surface).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTrendingUpIcon,
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
  type AgentMetric,
  type CategoryAnalytics,
  type TicketAnalyticsOverview,
} from '@/services/api/support-api'
import {
  DistributionChart,
  GroupedBars,
  KpiTile,
  PALETTE,
  RateGauge,
  type ChartDatum,
  type ChartType,
} from './analytics-charts'
import { ExportButton } from './ExportButton'

const NAV = [
  { key: 'overview', label: 'Overview', icon: Squares2X2Icon },
  { key: 'categories', label: 'Categories', icon: TagIcon },
  { key: 'agents', label: 'Agents', icon: UsersIcon },
  { key: 'weekly', label: 'Weekly report', icon: ArrowTrendingUpIcon },
] as const

type NavKey = (typeof NAV)[number]['key']

// ── Page shell ────────────────────────────────────────────────────────────

function SupportAnalyticsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()
  const [active, setActive] = useState<NavKey>('overview')
  const [chartType, setChartType] = useState<ChartType>('bar')

  useEffect(() => {
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  const activeNav = NAV.find((n) => n.key === active) ?? NAV[0]
  const showToggle = active === 'overview'

  return (
    <div className="flex h-full overflow-hidden bg-[#ebebeb]">
      {/* ── Left rail ──────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white">
            <ChartBarIcon className="h-4 w-4" />
          </span>
          <h1 className="text-sm font-bold tracking-tight text-gray-900">Analytics</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Reports
          </p>
          {NAV.map((n) => {
            const isActive = active === n.key
            return (
              <button
                key={n.key}
                onClick={() => setActive(n.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
                  isActive ? 'bg-[#020308] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <n.icon
                  className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-gray-400')}
                />
                <span className="flex-1 truncate text-left">{n.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 p-3">
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            Docs
          </a>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <activeNav.icon className="h-4 w-4 text-gray-500 lg:hidden" />
              <h2 className="text-sm font-bold text-gray-900">{activeNav.label}</h2>
            </div>
            <div className="flex items-center gap-2">
              <ExportButton orgId={currentOrgId} kind="conversations" label="Conversations" />
              <ExportButton orgId={currentOrgId} kind="tickets" label="Tickets" />
              {showToggle && <ChartTypeToggle value={chartType} onChange={setChartType} />}
            </div>
          </div>

          {/* Mobile nav strip */}
          <div className="mt-2 flex gap-1 overflow-x-auto lg:hidden">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setActive(n.key)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  active === n.key
                    ? 'bg-[#020308] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="mx-auto max-w-5xl">
            {active === 'overview' && <OverviewView orgId={currentOrgId} chartType={chartType} />}
            {active === 'categories' && <CategoriesView orgId={currentOrgId} />}
            {active === 'agents' && <AgentsView orgId={currentOrgId} />}
            {active === 'weekly' && <WeeklyView orgId={currentOrgId} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Chart type toggle ──────────────────────────────────────────────────────

function ChartTypeToggle({
  value,
  onChange,
}: {
  value: ChartType
  onChange: (t: ChartType) => void
}) {
  const opts: Array<{ key: ChartType; label: string; Icon: typeof ChartBarIcon }> = [
    { key: 'bar', label: 'Bars', Icon: ChartBarIcon },
    { key: 'pie', label: 'Pie', Icon: ChartPieIcon },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-semibold transition',
            value === o.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          <o.Icon className="h-3.5 w-3.5" />
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Overview ────────────────────────────────────────────────────────────────

function OverviewView({ orgId, chartType }: { orgId: string; chartType: ChartType }) {
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

  const statusData: ChartDatum[] = [
    { name: 'Open', value: overview.open, color: '#0ea5e9' },
    { name: 'In progress', value: overview.in_progress, color: '#6366f1' },
    { name: 'Pending', value: overview.pending, color: '#f59e0b' },
    { name: 'On hold', value: overview.on_hold, color: '#64748b' },
    { name: 'Escalated', value: overview.escalated, color: '#f97316' },
    { name: 'Resolved', value: overview.resolved, color: '#10b981' },
    { name: 'Closed', value: overview.closed, color: '#9ca3af' },
  ].filter((d) => d.value > 0)

  const priorityData: ChartDatum[] = [
    { name: 'Urgent', value: overview.by_priority.urgent, color: '#ef4444' },
    { name: 'High', value: overview.by_priority.high, color: '#f97316' },
    { name: 'Medium', value: overview.by_priority.medium, color: '#0ea5e9' },
    { name: 'Low', value: overview.by_priority.low, color: '#9ca3af' },
  ].filter((d) => d.value > 0)

  const queueData: ChartDatum[] = Object.entries(overview.by_queue)
    .map(([name, value], i) => ({
      name: name || 'Unrouted',
      value,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((d) => d.value > 0)

  const aiConversion = learning.ai_to_ticket_conversion ?? 0
  const reopenRate = learning.reopen_rate ?? 0
  const csat = learning.csat_average ?? 0
  const negatives = learning.csat_negative_count ?? 0

  return (
    <div className="space-y-4">
      {/* Backlog KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiTile label="Total" value={overview.total} />
        <KpiTile
          label="Open"
          value={overview.open}
          tone={overview.open > 0 ? 'warning' : 'default'}
        />
        <KpiTile
          label="Unassigned"
          value={overview.unassigned}
          tone={overview.unassigned > 5 ? 'danger' : 'default'}
        />
        <KpiTile
          label="Escalated"
          value={overview.escalated}
          tone={overview.escalated > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Quality gauges */}
      <Card title="Resolution quality">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <RateGauge
            label="AI ticket conversion"
            value={aiConversion}
            display={`${aiConversion.toFixed(0)}%`}
            caption="Opened from an AI conversation"
            color="#0ea5e9"
          />
          <RateGauge
            label="Reopen rate"
            value={reopenRate}
            display={`${reopenRate.toFixed(1)}%`}
            caption="Resolved tickets that came back"
            color={reopenRate > 8 ? '#ef4444' : '#10b981'}
          />
          <RateGauge
            label="Avg CSAT"
            value={(csat / 5) * 100}
            display={`${csat.toFixed(1)} / 5`}
            caption={`${negatives} negative rating${negatives === 1 ? '' : 's'}`}
            color="#8b5cf6"
          />
        </div>
      </Card>

      {/* Distributions */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="By status">
          <DistributionChart data={statusData} type={chartType} />
        </Card>
        <Card title="By priority">
          <DistributionChart data={priorityData} type={chartType} />
        </Card>
      </div>

      <Card title="By queue">
        <DistributionChart data={queueData} type={chartType} height={260} />
      </Card>
    </div>
  )
}

// ── Categories ──────────────────────────────────────────────────────────────

function CategoriesView({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<CategoryAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const chartData = useMemo(() => {
    if (!data) return []
    return [...data.categories]
      .sort((a, b) => b.count - a.count)
      .map((c) => ({
        name: prettyCategory(c.category),
        Resolved: c.resolved,
        Escalated: c.escalated,
        Reopens: c.reopen_count,
        raw: c.category,
      }))
  }, [data])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  return (
    <div className="space-y-4">
      <Card
        title="Tickets by category"
        subtitle="Resolved, escalated, and reopened tickets grouped by what they were about."
      >
        <GroupedBars
          data={chartData}
          height={Math.max(200, chartData.length * 54)}
          series={[
            { key: 'Resolved', label: 'Resolved', color: '#10b981' },
            { key: 'Escalated', label: 'Escalated', color: '#f97316' },
            { key: 'Reopens', label: 'Reopens', color: '#ef4444' },
          ]}
        />
      </Card>

      <Card
        title="Root causes"
        subtitle="Clusters of tickets that share a fingerprint, so you can fix the underlying issue once."
      >
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
                        {r.sample_subjects[0] ?? 'No sample subject'}
                      </p>
                      {r.sample_subjects.length > 1 && (
                        <p className="mt-0.5 truncate text-[11px] text-gray-500">
                          plus {r.sample_subjects.length - 1} similar
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
      </Card>
    </div>
  )
}

// ── Agents ──────────────────────────────────────────────────────────────────

function AgentsView({ orgId }: { orgId: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<AgentMetric[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const chartData = useMemo(() => {
    if (!data) return []
    return [...data]
      .sort((a, b) => b.resolved_count + b.open_count - (a.resolved_count + a.open_count))
      .map((a) => ({
        name: a.user_name || 'Unnamed',
        Open: a.open_count,
        Resolved: a.resolved_count,
      }))
  }, [data])

  if (loading) return <SectionSpinner />
  if (error) return <SectionError message={error} onRetry={load} />
  if (!data) return null

  const sorted = [...data].sort((a, b) => b.resolved_count - a.resolved_count)

  return (
    <div className="space-y-4">
      <Card title="Workload by agent" subtitle="Open and resolved tickets per assignee.">
        <GroupedBars
          data={chartData}
          height={Math.max(200, chartData.length * 54)}
          series={[
            { key: 'Open', label: 'Open', color: '#0ea5e9' },
            { key: 'Resolved', label: 'Resolved', color: '#10b981' },
          ]}
        />
      </Card>

      <Card title="Per-agent detail" subtitle="Click a name to filter the ticket list by assignee.">
        {sorted.length === 0 ? (
          <p className="text-[12px] text-gray-400">No assigned tickets yet.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-100">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="px-4 py-2.5">Agent</th>
                  <th className="px-3 py-2.5 text-right">Open</th>
                  <th className="px-3 py-2.5 text-right">Resolved</th>
                  <th className="px-3 py-2.5 text-right">Avg resolution</th>
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
                    <td className="px-4 py-2.5 font-semibold text-gray-900">{a.user_name}</td>
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
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Weekly report (legacy) ──────────────────────────────────────────────────

function WeeklyView({ orgId }: { orgId: string }) {
  const { weeklyReport, loadWeeklyReport } = useSupportStore()

  useEffect(() => {
    loadWeeklyReport(orgId).catch((err) =>
      toast.error(err instanceof Error ? err.message : 'Failed to load weekly report')
    )
  }, [orgId, loadWeeklyReport])

  if (!weeklyReport) {
    return (
      <Card title="Weekly report">
        <div className="flex flex-col items-center justify-center py-16">
          <ArrowTrendingUpIcon className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-400">No weekly report available yet</p>
        </div>
      </Card>
    )
  }

  const intentData: ChartDatum[] = weeklyReport.top_intents.map((item, i) => ({
    name: item.intent,
    value: item.count,
    color: PALETTE[i % PALETTE.length],
  }))

  return (
    <div className="space-y-4">
      <Card
        title="Weekly summary"
        subtitle={`${new Date(weeklyReport.period_start).toLocaleDateString()} to ${new Date(
          weeklyReport.period_end
        ).toLocaleDateString()}`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiTile label="Conversations" value={weeklyReport.total_conversations} />
          <KpiTile label="Autonomous" value={weeklyReport.autonomous_resolutions} />
          <KpiTile label="Escalations" value={weeklyReport.escalations} />
          <KpiTile
            label="Avg CSAT"
            value={weeklyReport.avg_csat ? weeklyReport.avg_csat.toFixed(1) : '0.0'}
          />
        </div>
      </Card>

      {intentData.length > 0 && (
        <Card title="Top intents">
          <DistributionChart data={intentData} type="bar" />
        </Card>
      )}

      <Card title="Knowledge improvement">
        <div className="grid grid-cols-2 gap-3">
          <KpiTile label="KB drafts created" value={weeklyReport.kb_drafts_created} />
          <KpiTile label="KB drafts approved" value={weeklyReport.kb_drafts_approved} />
        </div>
      </Card>
    </div>
  )
}

// ── Shared bits ─────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-0.5 text-[11px] text-gray-500">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  )
}

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

function formatMinutes(min: number | null | undefined): string {
  if (!min || !Number.isFinite(min) || min <= 0) return '0m'
  if (min < 60) return `${Math.round(min)}m`
  const h = Math.floor(min / 60)
  const m = Math.round(min - h * 60)
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h - d * 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

function prettyCategory(c: string): string {
  if (!c) return 'Unclassified'
  return c
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export { SupportAnalyticsPage }
