import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  UsersIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { ArrowRightIcon } from '@heroicons/react/24/solid'
import { adminGetDashboard } from '@/services/api'
import type { AdminDashboardOverview } from '@/services/api'
import { cn } from '@/lib'

/* ── Dark glassmorphism stat card ──────────────────────────────────────────── */

const GLOW: Record<string, string> = {
  violet: 'shadow-[0_0_40px_-8px_rgba(124,58,237,.35)]',
  sky: 'shadow-[0_0_40px_-8px_rgba(56,189,248,.25)]',
  emerald: 'shadow-[0_0_40px_-8px_rgba(52,211,153,.25)]',
  amber: 'shadow-[0_0_40px_-8px_rgba(251,191,36,.25)]',
}
const ICON_BG: Record<string, string> = {
  violet: 'bg-violet-500/20 text-violet-300',
  sky: 'bg-sky-500/20 text-sky-300',
  emerald: 'bg-emerald-500/20 text-emerald-300',
  amber: 'bg-amber-500/20 text-amber-300',
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'violet',
  onClick,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#141414] to-[#0a0a0a] p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110',
        GLOW[accent] ?? GLOW.violet
      )}
    >
      {/* Glass overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.12] to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.08]" />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/50">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-white">{value}</p>
        </div>
        <div className={cn('rounded-lg p-2', ICON_BG[accent] ?? ICON_BG.violet)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Hover arrow */}
      <div className="pointer-events-none absolute bottom-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
        <ArrowRightIcon className="h-3.5 w-3.5 text-white/40" />
      </div>
    </button>
  )
}

/* ── Signup chart ──────────────────────────────────────────────────────────── */

function MiniChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <p className="text-sm text-gray-400">No signup data yet</p>
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-[3px]" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full min-w-[3px] rounded-t bg-[#3730a3]/60 transition-colors group-hover:bg-[#3730a3]"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 1 }}
          />
          <div className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block">
            <span className="font-semibold">{d.count}</span>
            <span className="ml-1.5 text-white/50">{d.date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminDashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    adminGetDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3730a3]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="px-6 py-6">
      <h1 className="text-lg font-semibold text-gray-900">Platform Overview</h1>
      <p className="mt-0.5 text-sm text-gray-400">Real-time metrics across Lira AI</p>

      {/* Stat cards grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Total Users"
          value={data.totalUsers}
          icon={UsersIcon}
          accent="violet"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          label="Organizations"
          value={data.totalOrgs}
          icon={BuildingOffice2Icon}
          accent="sky"
          onClick={() => navigate('/admin/organizations')}
        />
        <StatCard
          label="New (7 days)"
          value={data.newSignups7d}
          icon={ArrowTrendingUpIcon}
          accent="emerald"
          onClick={() => navigate('/admin/users?filter=recent_7d')}
        />
        <StatCard
          label="Verified"
          value={data.verifiedUsers}
          icon={CheckBadgeIcon}
          accent="emerald"
          onClick={() => navigate('/admin/users?filter=verified')}
        />
        <StatCard
          label="Unverified"
          value={data.unverifiedUsers}
          icon={ExclamationTriangleIcon}
          accent="amber"
          onClick={() => navigate('/admin/users?filter=unverified')}
        />
      </div>

      {/* Signup trend */}
      <div className="mt-6 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Signups — Last 30 Days</h2>
            <p className="mt-0.5 text-xs text-gray-400">{data.newSignups30d} total in period</p>
          </div>
        </div>
        <div className="mt-4">
          <MiniChart data={data.signupTrend} />
        </div>
      </div>

      {/* Attribution — "how did you hear about us" */}
      <AttributionCard breakdown={data.attributionBreakdown ?? []} totalUsers={data.totalUsers} />
    </div>
  )
}

/**
 * Renders the self-reported "how did you hear about us" breakdown as a
 * simple horizontal bar chart. Counts come from the dashboard endpoint
 * pre-grouped + sorted desc. `null` source = user skipped the question
 * (or signed up before the field existed).
 */
function AttributionCard({
  breakdown,
  totalUsers,
}: {
  breakdown: { source: string | null; count: number }[]
  totalUsers: number
}) {
  if (breakdown.length === 0) {
    return null
  }
  const reported = breakdown.filter((row) => row.source !== null)
  const skipped = breakdown.find((row) => row.source === null)?.count ?? 0
  const maxCount = Math.max(...reported.map((row) => row.count), 1)

  const labelMap: Record<string, string> = {
    google: 'Google search',
    linkedin: 'LinkedIn',
    friend: 'Friend or colleague',
    youtube: 'YouTube',
    twitter: 'X / Twitter',
    ai_tool: 'ChatGPT or another AI tool',
    blog: 'Blog post or article',
    podcast: 'Podcast',
    event: 'Conference or event',
    sales_outreach: 'Lira team reached out',
    other: 'Other',
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">How users found us</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            {reported.reduce((s, r) => s + r.count, 0)} of {totalUsers} answered
            {skipped > 0 && ` · ${skipped} skipped`}
          </p>
        </div>
      </div>
      {reported.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">
          No one has answered yet. Data appears as new users complete onboarding.
        </p>
      ) : (
        <div className="mt-4 space-y-2.5">
          {reported.map((row) => {
            const label = labelMap[row.source ?? ''] ?? row.source
            const pct = (row.count / maxCount) * 100
            return (
              <div key={row.source ?? 'unknown'} className="flex items-center gap-3">
                <div className="w-44 shrink-0 text-xs text-gray-600">{label}</div>
                <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-gray-100">
                  <div
                    className="h-full rounded-md bg-gradient-to-r from-[#3730a3] to-[#6366f1]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-8 shrink-0 text-right text-xs font-semibold text-gray-700">
                  {row.count}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
