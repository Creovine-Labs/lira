import { useEffect } from 'react'
import { useOrgStore, useUsageStore } from '@/app/store'
import { getOrgUsage } from '@/services/api'

const FEATURES: {
  key: string
  label: string
  desc: string
}[] = [
  { key: 'meetings', label: 'AI Meeting Sessions', desc: 'Live AI-assisted meetings' },
  { key: 'meeting_minutes', label: 'Meeting Minutes', desc: 'Total minutes across all meetings' },
  { key: 'interviews', label: 'Interviews', desc: 'AI interview sessions created' },
  {
    key: 'interview_evaluations',
    label: 'Interview Evaluations',
    desc: 'AI-generated interview evaluations',
  },
  { key: 'ai_tasks', label: 'AI Tasks', desc: 'Tasks delegated to Lira AI' },
  { key: 'documents', label: 'Documents', desc: 'Documents uploaded or created' },
  { key: 'knowledge_pages', label: 'Knowledge Pages', desc: 'Pages crawled for knowledge base' },
]

function percent(used: number, limit: number): number {
  if (limit <= 0) return 0
  return Math.min(Math.round((used / limit) * 100), 100)
}

function barColor(pct: number): string {
  if (pct >= 100) return 'bg-red-500'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function UsagePage() {
  const currentOrgId = useOrgStore((s) => s.currentOrgId)
  const { summary, loading, setSummary, setLoading } = useUsageStore()

  useEffect(() => {
    if (!currentOrgId) return
    let cancelled = false
    setLoading(true)
    getOrgUsage(currentOrgId)
      .then((s) => {
        if (!cancelled) setSummary(s)
      })
      .catch(() => {
        /* ignore */
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [currentOrgId, setLoading, setSummary])

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center py-32">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-8 w-8 animate-spin opacity-40"
          style={{ animationDuration: '1.2s' }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Usage</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your organization&apos;s feature usage during the beta period.
        </p>
      </div>

      <div className="space-y-5">
        {FEATURES.map(({ key, label, desc }) => {
          const used = summary.usage[key as keyof typeof summary.usage] ?? 0
          const limit = summary.limits[key as keyof typeof summary.limits] ?? 0
          const pct = percent(used, limit)

          return (
            <div key={key} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <span
                  className={`text-xs font-bold ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-amber-600' : 'text-gray-600'}`}
                >
                  {used} / {limit}
                </span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${barColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Beta info card */}
      <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/50 p-5">
        <h3 className="text-sm font-semibold text-blue-900">About the Beta</h3>
        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
          All features are available during the beta, with usage limits to keep the experience
          smooth for everyone. Once you hit a limit, that feature pauses until the full release.
          We&apos;d love your feedback —{' '}
          <a
            href="mailto:support@creovine.com?subject=Lira Beta Feedback"
            className="underline font-medium"
          >
            reach out anytime
          </a>
          .
        </p>
      </div>
    </div>
  )
}
