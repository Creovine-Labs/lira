import { useEffect, useState } from 'react'
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'

const TABS = [
  { key: 'overview', label: 'Overview', icon: ChartBarIcon },
  { key: 'weekly', label: 'Weekly Report', icon: ArrowTrendingUpIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportAnalyticsPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportAnalyticsPanel />
      </div>
    </div>
  )
}

function SupportAnalyticsPanel() {
  const [activeTab, setAnalyticsTab] = useState<TabKey>('overview')
  const { currentOrgId } = useOrgStore()
  const { stats, statsLoading, loadStats, weeklyReport, loadWeeklyReport } = useSupportStore()

  useEffect(() => {
    if (!currentOrgId) return
    loadStats(currentOrgId)
    loadWeeklyReport(currentOrgId)
  }, [currentOrgId, loadStats, loadWeeklyReport])

  return (
    <>
      {/* Sub-tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setAnalyticsTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#3730a3] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <>
          {statsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
            </div>
          ) : !stats ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
              <ChartBarIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">No analytics data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MetricCard
                  icon={ChatBubbleLeftEllipsisIcon}
                  label="Total Conversations"
                  value={stats.total_conversations}
                />
                <MetricCard
                  icon={SparklesIcon}
                  label="Autonomous"
                  value={stats.resolved_autonomous}
                  accent="indigo"
                />
                <MetricCard
                  icon={ExclamationTriangleIcon}
                  label="Escalated"
                  value={stats.escalated}
                  accent="red"
                />
                <MetricCard
                  icon={StarIcon}
                  label="Avg CSAT"
                  value={stats.avg_csat ? `${stats.avg_csat.toFixed(1)}/5` : '—'}
                  accent="amber"
                />
              </div>

              {/* Resolution breakdown */}
              <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-gray-900">Resolution Breakdown</h3>
                <div className="space-y-3">
                  <BarRow
                    label="Autonomous"
                    count={stats.resolved_autonomous}
                    total={stats.total_conversations}
                    color="bg-green-500"
                  />
                  <BarRow
                    label="Human"
                    count={stats.resolved_human}
                    total={stats.total_conversations}
                    color="bg-blue-500"
                  />
                  <BarRow
                    label="Escalated"
                    count={stats.escalated}
                    total={stats.total_conversations}
                    color="bg-red-500"
                  />
                  <BarRow
                    label="Open"
                    count={stats.open_conversations}
                    total={stats.total_conversations}
                    color="bg-amber-500"
                  />
                </div>
              </div>

              {/* Response time */}
              <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-sm font-bold text-gray-900">
                  Average First Response Time
                </h3>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.avg_response_time_ms > 0
                      ? `${(stats.avg_response_time_ms / 1000).toFixed(1)}s`
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Usage */}
              <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Monthly Usage</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Conversations this month</span>
                    <span className="font-medium text-gray-800">
                      {stats.conversations_this_month}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">AI replies this month</span>
                    <span className="font-medium text-gray-800">{stats.ai_replies_this_month}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Weekly report tab */}
      {activeTab === 'weekly' && (
        <>
          {!weeklyReport ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
              <ArrowTrendingUpIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-400">No weekly report available yet</p>
            </div>
          ) : (
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

              {/* Top intents */}
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

              {/* KB improvement */}
              <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-gray-900">Knowledge Improvement</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">KB drafts created</span>
                    <span className="font-medium text-gray-800">
                      {weeklyReport.kb_drafts_created}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">KB drafts approved</span>
                    <span className="font-medium text-gray-800">
                      {weeklyReport.kb_drafts_approved}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent = 'gray',
}: {
  icon: React.ElementType
  label: string
  value: string | number
  accent?: 'gray' | 'indigo' | 'red' | 'amber'
}) {
  const iconColor = {
    gray: 'text-gray-400',
    indigo: 'text-indigo-500',
    red: 'text-red-500',
    amber: 'text-amber-500',
  }[accent]

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <Icon className={cn('mb-2 h-5 w-5', iconColor)} />
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
        {label}
      </p>
    </div>
  )
}

function BarRow({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-800">
          {count} ({pct}%)
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
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

export { SupportAnalyticsPage, SupportAnalyticsPanel }
