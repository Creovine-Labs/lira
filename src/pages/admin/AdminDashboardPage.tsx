import { useEffect, useState } from 'react'
import {
  UsersIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { adminGetDashboard } from '@/services/api'
import type { AdminDashboardOverview } from '@/services/api'

function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'indigo',
}: {
  label: string
  value: string | number
  icon: React.ElementType
  accent?: string
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    sky: 'bg-sky-50 text-sky-600',
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2.5 ${colors[accent] ?? colors.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function MiniChart({ data }: { data: { date: string; count: number }[] }) {
  if (!data.length) return <p className="text-sm text-slate-400">No signup data yet</p>
  const max = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="flex items-end gap-1" style={{ height: 120 }}>
      {data.map((d) => (
        <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full min-w-[4px] rounded-t bg-indigo-400 transition-colors group-hover:bg-indigo-600"
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? 4 : 1 }}
          />
          <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
            {d.count}
            <br />
            {d.date}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AdminDashboardPage() {
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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Platform Overview</h1>
      <p className="mt-1 text-sm text-slate-500">Real-time metrics across the Lira AI platform</p>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Users" value={data.totalUsers} icon={UsersIcon} accent="indigo" />
        <StatCard
          label="Organizations"
          value={data.totalOrgs}
          icon={BuildingOffice2Icon}
          accent="sky"
        />
        <StatCard
          label="New (7 days)"
          value={data.newSignups7d}
          icon={ArrowTrendingUpIcon}
          accent="emerald"
        />
        <StatCard
          label="Verified"
          value={data.verifiedUsers}
          icon={CheckBadgeIcon}
          accent="emerald"
        />
        <StatCard
          label="Unverified"
          value={data.unverifiedUsers}
          icon={ExclamationTriangleIcon}
          accent="amber"
        />
      </div>

      {/* Signup trend */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Signups — Last 30 Days</h2>
        <p className="mt-0.5 text-xs text-slate-400">{data.newSignups30d} total in period</p>
        <div className="mt-4">
          <MiniChart data={data.signupTrend} />
        </div>
      </div>
    </div>
  )
}
