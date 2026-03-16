import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseIcon,
  Calendar,
  CheckSquare,
  Mic,
  Plus,
  Sparkles,
  BookOpen,
  Clock,
} from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listMeetings,
  listTasks,
  listInterviews,
  getDashboardStats,
  type Meeting,
  type TaskRecord,
  type Interview,
  type DashboardStats,
} from '@/services/api'

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  onClick,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  accent: string
  onClick?: () => void
}) {
  const palette: Record<
    string,
    {
      bg: string
      iconBg: string
      iconText: string
      valueText: string
      labelText: string
      shadow: string
    }
  > = {
    orange: {
      bg: 'bg-gradient-to-br from-orange-100 to-orange-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-orange-600',
      valueText: 'text-orange-950',
      labelText: 'text-orange-700/70',
      shadow: 'shadow-orange-300/30',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-100 to-amber-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-amber-600',
      valueText: 'text-amber-950',
      labelText: 'text-amber-700/70',
      shadow: 'shadow-amber-300/30',
    },
    violet: {
      bg: 'bg-gradient-to-br from-violet-100 to-violet-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-violet-600',
      valueText: 'text-violet-950',
      labelText: 'text-violet-700/70',
      shadow: 'shadow-violet-300/30',
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-100 to-teal-200/80',
      iconBg: 'bg-white/50',
      iconText: 'text-teal-600',
      valueText: 'text-teal-950',
      labelText: 'text-teal-700/70',
      shadow: 'shadow-teal-300/30',
    },
  }
  const c = palette[accent] ?? palette.violet

  return (
    <button
      onClick={onClick}
      className={[
        'group relative flex w-full flex-col gap-4 rounded-2xl p-5 text-left',
        c.bg,
        'border border-white/40',
        'shadow-md',
        c.shadow,
        'transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:shadow-lg',
      ].join(' ')}
    >
      <div className="flex items-start justify-between">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.iconBg} ${c.iconText}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white opacity-0 transition group-hover:opacity-100">
          <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold tracking-tight ${c.valueText}`}>{value}</p>
        <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wider ${c.labelText}`}>
          {label}
        </p>
      </div>
    </button>
  )
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
  accent = false,
}: {
  icon: React.ElementType
  label: string
  description: string
  onClick: () => void
  accent?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:shadow-sm ${
        accent
          ? 'border-violet-200 bg-violet-50 hover:border-violet-300'
          : 'border-gray-100 bg-white hover:border-gray-200'
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
          accent
            ? 'bg-violet-100 text-violet-600 group-hover:bg-violet-200'
            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="mt-0.5 truncate text-xs text-gray-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-gray-500" />
    </button>
  )
}

// ── Recent meetings list ──────────────────────────────────────────────────────
function RecentMeetings({ meetings }: { meetings: Meeting[] }) {
  const navigate = useNavigate()
  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
          <Mic className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">No meetings yet</p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-gray-100">
      {meetings.map((m) => (
        <button
          key={m.session_id}
          onClick={() => navigate(`/meetings/${m.session_id}`)}
          className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-gray-50/60 px-1 rounded-lg"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100">
            <Mic className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{m.title}</p>
            <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        </button>
      ))}
    </div>
  )
}

// ── Recent tasks list ─────────────────────────────────────────────────────────
function RecentTasks({ tasks }: { tasks: TaskRecord[] }) {
  const navigate = useNavigate()
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100">
          <CheckSquare className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-400">No tasks yet</p>
      </div>
    )
  }
  const statusColor: Record<string, string> = {
    pending: 'bg-amber-400',
    in_progress: 'bg-blue-400',
    completed: 'bg-green-400',
    cancelled: 'bg-gray-300',
  }
  return (
    <div className="divide-y divide-gray-100">
      {tasks.map((t) => (
        <button
          key={t.task_id}
          onClick={() => navigate(`/org/tasks/${t.task_id}`)}
          className="flex w-full items-center gap-3 py-3 text-left px-1 rounded-lg transition hover:bg-gray-50/60"
        >
          <span
            className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${statusColor[t.status] ?? 'bg-gray-300'}`}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">{t.title}</p>
            <p className="text-xs text-gray-400">{timeAgo(t.created_at)}</p>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-300" />
        </button>
      ))}
    </div>
  )
}

// ── Dashboard page ────────────────────────────────────────────────────────────
function DashboardPage() {
  const navigate = useNavigate()
  const { token, userName } = useAuthStore()
  const { currentOrgId, organizations } = useOrgStore()

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)

    // Stats card numbers come from the dedicated stats endpoint (single call)
    const statsP = currentOrgId
      ? getDashboardStats(currentOrgId).catch(() => null)
      : Promise.resolve(null)

    // Full lists are still needed to render the activity panels below the cards
    const meetingP = listMeetings().catch(() => [] as Meeting[])
    const taskP = currentOrgId
      ? listTasks(currentOrgId, { status: 'pending' })
          .then((r) => (Array.isArray(r) ? r : ((r as { tasks: TaskRecord[] }).tasks ?? [])))
          .catch(() => [] as TaskRecord[])
      : Promise.resolve([] as TaskRecord[])
    const interviewP = currentOrgId
      ? listInterviews(currentOrgId).catch(() => [] as Interview[])
      : Promise.resolve([] as Interview[])

    Promise.all([statsP, meetingP, taskP, interviewP]).then(([s, m, t, iv]) => {
      m.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      t.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setStats(s)
      setMeetings(m)
      setTasks(t)
      setInterviews(iv)
      setLoading(false)
    })
  }, [token, currentOrgId, navigate])

  const firstName = userName?.split(' ')[0]

  // Loading skeleton
  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <div className="mb-8 h-8 w-64 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-8 sm:py-8">
      {/* ── Welcome header ── */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-gray-900">
            {greeting}
            {firstName ? `, ${firstName}` : ''}!
          </h1>
          {currentOrg && (
            <p className="mt-1 text-sm text-gray-500">
              You're working in{' '}
              <span className="font-semibold text-gray-700">{currentOrg.name}</span>
            </p>
          )}
        </div>

        {/* AI activity badge */}
        <div className="hidden items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 sm:flex">
          <Sparkles className="h-4 w-4" />
          Lira is ready
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total meetings"
          value={stats?.meetings_total ?? meetings.length}
          icon={Mic}
          accent="orange"
          onClick={() => navigate('/meetings')}
        />
        <StatCard
          label="Pending tasks"
          value={stats?.tasks_pending ?? tasks.length}
          icon={CheckSquare}
          accent="amber"
          onClick={() => navigate('/org/tasks')}
        />
        <StatCard
          label="Interviews"
          value={stats?.interviews_total ?? interviews.length}
          icon={BriefcaseIcon}
          accent="violet"
          onClick={() => navigate('/org/roles')}
        />
        <StatCard
          label="Recent activity"
          value={
            stats?.last_activity_at
              ? timeAgo(stats.last_activity_at)
              : meetings.length + tasks.length > 0
                ? timeAgo(
                    [...meetings, ...tasks].sort(
                      (a, b) =>
                        new Date(
                          (b as Meeting).created_at ?? (b as TaskRecord).created_at
                        ).getTime() -
                        new Date(
                          (a as Meeting).created_at ?? (a as TaskRecord).created_at
                        ).getTime()
                    )[0]?.created_at
                  )
                : '—'
          }
          icon={Clock}
          accent="teal"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick actions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
          </div>
          <div className="space-y-2.5">
            <QuickAction
              icon={Mic}
              label="Start a meeting"
              description="Deploy Lira to a live meeting"
              onClick={() => navigate('/meetings')}
              accent
            />
            <QuickAction
              icon={BriefcaseIcon}
              label="Start an interview"
              description="AI-assisted candidate interview"
              onClick={() => navigate('/org/roles')}
            />
            <QuickAction
              icon={BookOpen}
              label="Add knowledge"
              description="Upload docs or crawl your website"
              onClick={() => navigate('/org/knowledge')}
            />
            <QuickAction
              icon={Plus}
              label="Invite team members"
              description="Grow your workspace"
              onClick={() => navigate('/org/members')}
            />
          </div>
        </div>

        {/* Recent meetings */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Recent meetings</h2>
            <button
              onClick={() => navigate('/meetings')}
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <RecentMeetings meetings={meetings.slice(0, 5)} />
        </div>

        {/* Tasks + Interviews column */}
        <div className="flex flex-col gap-6">
          {/* Pending tasks */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Pending tasks</h2>
              <button
                onClick={() => navigate('/org/tasks')}
                className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <RecentTasks tasks={tasks.slice(0, 4)} />
          </div>

          {/* AI Settings CTA */}
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <Sparkles className="h-4 w-4 text-violet-600" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Configure Lira AI</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Set voice, context sources, and speaking style to match your team's workflow.
            </p>
            <button
              onClick={() => navigate('/org/settings')}
              className="mt-4 flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
            >
              Open Settings
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Recent interviews row (if any) ── */}
      {interviews.length > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Interview roles</h2>
            <button
              onClick={() => navigate('/org/roles')}
              className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set(interviews.map((iv) => iv.title))].slice(0, 8).map((role) => {
              const count = interviews.filter((iv) => iv.title === role).length
              return (
                <button
                  key={role}
                  onClick={() => navigate('/org/roles')}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  <BriefcaseIcon className="h-3.5 w-3.5" />
                  {role}
                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Calendar hint (empty state for meetings) ── */}
      {meetings.length === 0 && (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-dashed border-gray-200 bg-white p-6 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
            <Calendar className="h-6 w-6 text-violet-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">No meetings yet</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Deploy Lira to your first meeting to start generating transcripts, summaries, and
              action items.
            </p>
          </div>
          <button
            onClick={() => navigate('/meetings')}
            className="shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            Start a meeting
          </button>
        </div>
      )}
    </div>
  )
}

export { DashboardPage }
