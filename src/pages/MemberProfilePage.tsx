import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  CameraIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  MicrophoneIcon,
  PlayCircleIcon,
  ShieldCheckIcon,
  TrophyIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listOrgMembers,
  listTasks,
  getMemberContributions,
  updateMyPicture,
  type MemberContribution,
  type OrgMembership,
  type TaskRecord,
  type TaskPriority,
  type TaskStatus,
} from '@/services/api'
import { cn } from '@/lib'

const ROLE_CONFIG: Record<
  OrgMembership['role'],
  {
    label: string
    icon: React.ElementType
    pill: string
    gradient: string
    banner: string
    bannerGlowA: string
    bannerGlowB: string
  }
> = {
  owner: {
    label: 'Owner',
    icon: TrophyIcon,
    pill: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    gradient: 'from-violet-500 to-purple-600',
    banner: 'from-violet-700 via-purple-600 to-fuchsia-700',
    bannerGlowA: 'rgba(196,181,253,0.4)',
    bannerGlowB: 'rgba(240,171,252,0.35)',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheckIcon,
    pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    gradient: 'from-blue-500 to-indigo-600',
    banner: 'from-blue-700 via-indigo-600 to-cyan-600',
    bannerGlowA: 'rgba(147,197,253,0.4)',
    bannerGlowB: 'rgba(165,243,252,0.3)',
  },
  member: {
    label: 'Member',
    icon: ShieldCheckIcon,
    pill: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    gradient: 'from-slate-500 to-slate-700',
    banner: 'from-indigo-700 via-violet-600 to-slate-700',
    bannerGlowA: 'rgba(165,180,252,0.35)',
    bannerGlowB: 'rgba(196,181,253,0.3)',
  },
}

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; dot: string; text: string; bg: string }
> = {
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    dot: 'bg-amber-400',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  in_progress: {
    label: 'In Progress',
    icon: PlayCircleIcon,
    dot: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircleIcon,
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircleIcon,
    dot: 'bg-slate-400',
    text: 'text-slate-500 dark:text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-900/30',
  },
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; bar: string; text: string }> = {
  urgent: { label: 'Urgent', bar: 'bg-red-500', text: 'text-red-500' },
  high: { label: 'High', bar: 'bg-orange-500', text: 'text-orange-500' },
  medium: { label: 'Medium', bar: 'bg-amber-400', text: 'text-amber-500' },
  low: { label: 'Low', bar: 'bg-slate-400', text: 'text-slate-400' },
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent: string
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
      <div className={cn('mb-1 flex h-8 w-8 items-center justify-center rounded-lg', accent)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
    </div>
  )
}

function MemberProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { currentOrgId, organizations } = useOrgStore()
  const { userId: myUserId } = useAuthStore()
  const isOwnProfile = myUserId === userId

  // Org selector: null = current org, 'all' = aggregate
  const [selectedOrgId, setSelectedOrgId] = useState<string | 'all' | null>(null)
  const [orgDropOpen, setOrgDropOpen] = useState(false)
  const orgDropRef = useRef<HTMLDivElement>(null)

  const effectiveOrgId = selectedOrgId === 'all' ? null : (selectedOrgId ?? currentOrgId)

  const [member, setMember] = useState<OrgMembership | null>(null)
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [contributions, setContributions] = useState<MemberContribution[]>([])
  const [contribStats, setContribStats] = useState({ total_messages: 0, total_words: 0 })
  const [loading, setLoading] = useState(true)
  const [uploadingPic, setUploadingPic] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close org dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (orgDropRef.current && !orgDropRef.current.contains(e.target as Node))
        setOrgDropOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadData = useCallback(async () => {
    if (!userId) return
    const orgsToFetch =
      selectedOrgId === 'all'
        ? organizations.map((o) => o.org_id)
        : [effectiveOrgId ?? currentOrgId ?? '']
    if (!orgsToFetch[0]) return
    setLoading(true)
    try {
      // Always use the first org to find member info (name/email/picture)
      const primaryOrgId = orgsToFetch[0]
      const [members, ...rest] = await Promise.all([
        listOrgMembers(primaryOrgId),
        ...orgsToFetch.map((oid) =>
          Promise.all([listTasks(oid), getMemberContributions(oid, userId)])
        ),
      ])

      const found = (members as OrgMembership[]).find((m) => m.user_id === userId)
      if (!found) {
        toast.error('Member not found')
        navigate('/org/members')
        return
      }
      setMember(found)

      // Aggregate tasks + contributions across selected orgs
      let allTasks: TaskRecord[] = []
      let allContribs: MemberContribution[] = []
      let totalMessages = 0
      let totalWords = 0

      for (const [taskResult, contribResult] of rest as Array<
        [
          { tasks: TaskRecord[] },
          { contributions: MemberContribution[]; total_messages: number; total_words: number },
        ]
      >) {
        const memberTasks = taskResult.tasks.filter(
          (t) => t.assigned_to && (t.assigned_to === found.name || t.assigned_to === found.email)
        )
        allTasks = [...allTasks, ...memberTasks]
        allContribs = [...allContribs, ...contribResult.contributions]
        totalMessages += contribResult.total_messages
        totalWords += contribResult.total_words
      }

      setTasks(allTasks)
      setContributions(allContribs)
      setContribStats({ total_messages: totalMessages, total_words: totalWords })
    } catch {
      toast.error('Failed to load member profile')
    } finally {
      setLoading(false)
    }
  }, [userId, selectedOrgId, effectiveOrgId, currentOrgId, organizations, navigate])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handlePictureUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !isOwnProfile) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setUploadingPic(true)
    try {
      // Resize + compress to max 200x200 JPEG in browser
      const dataUrl = await resizeImage(file, 200, 200)
      await updateMyPicture(dataUrl)
      // Update local member state so avatar refreshes immediately
      setMember((prev) => (prev ? { ...prev, picture: dataUrl } : prev))
      toast.success('Profile picture updated')
    } catch {
      toast.error('Failed to upload picture')
    } finally {
      setUploadingPic(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-3">
          <ArrowPathIcon className="h-7 w-7 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    )
  }

  if (!member) return null

  const role = ROLE_CONFIG[member.role]
  const RoleIcon = role.icon

  const initials = (member.name ?? member.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length
  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const joinDate = new Date(member.joined_at)
  const now = new Date()
  const monthsActive = Math.max(
    0,
    (now.getFullYear() - joinDate.getFullYear()) * 12 + (now.getMonth() - joinDate.getMonth())
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      {/* ── Back nav ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/org/members')}
          className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Members
        </button>

        {/* Org selector — only shown on own profile */}
        {isOwnProfile && organizations.length > 0 && (
          <div className="relative" ref={orgDropRef}>
            <button
              onClick={() => setOrgDropOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl border bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-muted/50 transition-colors"
            >
              <BuildingOffice2Icon className="h-3.5 w-3.5 text-violet-500" />
              {selectedOrgId === 'all'
                ? 'All Organizations'
                : (organizations.find((o) => o.org_id === (selectedOrgId ?? currentOrgId))?.name ??
                  'Current Org')}
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            </button>
            {orgDropOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border bg-white py-1 shadow-lg dark:bg-gray-900">
                {organizations.length > 1 && (
                  <button
                    onClick={() => {
                      setSelectedOrgId('all')
                      setOrgDropOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-gray-50 dark:hover:bg-gray-800',
                      selectedOrgId === 'all' ? 'font-semibold text-violet-600' : 'text-foreground'
                    )}
                  >
                    <BuildingOffice2Icon className="h-3.5 w-3.5" />
                    All Organizations
                  </button>
                )}
                {organizations.map((org) => (
                  <button
                    key={org.org_id}
                    onClick={() => {
                      setSelectedOrgId(org.org_id)
                      setOrgDropOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-gray-50 dark:hover:bg-gray-800',
                      (selectedOrgId ?? currentOrgId) === org.org_id && selectedOrgId !== 'all'
                        ? 'font-semibold text-violet-600'
                        : 'text-foreground'
                    )}
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-violet-100 text-[9px] font-bold text-violet-600">
                      {org.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate">{org.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* Banner */}
        <div className={cn('h-40 w-full bg-gradient-to-br relative overflow-hidden', role.banner)}>
          {/* Highlight glow top-left */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 70% 90% at -5% -20%, ${role.bannerGlowA}, transparent)`,
            }}
          />
          {/* Accent glow bottom-right */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse 55% 65% at 105% 110%, ${role.bannerGlowB}, transparent)`,
            }}
          />
          {/* Subtle bottom fade to card */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/25 to-transparent" />
          {/* Fine diagonal shimmer lines */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 12px)',
            }}
          />
        </div>

        {/* Avatar + name row */}
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
            {/* Avatar with optional upload */}
            <div className="relative shrink-0">
              {member.picture ? (
                <img
                  src={member.picture}
                  alt={member.name ?? ''}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl object-cover shadow-lg ring-4 ring-card"
                />
              ) : (
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl font-bold text-white shadow-lg ring-4 ring-card',
                    role.gradient
                  )}
                >
                  {initials}
                </div>
              )}
              {/* Role badge */}
              <span
                className={cn(
                  'absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-card',
                  role.gradient
                )}
              >
                <RoleIcon className="h-2.5 w-2.5 text-white" />
              </span>
              {/* ArrowUpTrayIcon button — only for own profile */}
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPic}
                    className="absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-card hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Change photo"
                  >
                    {uploadingPic ? (
                      <ArrowPathIcon className="h-3 w-3 animate-spin text-violet-600" />
                    ) : (
                      <CameraIcon className="h-3 w-3 text-violet-600" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureUpload}
                  />
                </>
              )}
            </div>

            {/* Name / meta */}
            <div className="flex flex-1 flex-col gap-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-tight text-foreground">
                  {member.name ?? member.email ?? 'Unknown Member'}
                </h1>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    role.pill
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {role.label}
                </span>
              </div>
              {member.name && member.email && (
                <p className="text-sm text-muted-foreground">{member.email}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Joined {joinDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                {monthsActive > 0 && (
                  <span className="flex items-center gap-1">
                    <BoltIcon className="h-3 w-3 text-amber-500" />
                    {monthsActive}mo active
                  </span>
                )}
                {selectedOrgId === 'all' && organizations.length > 1 && (
                  <span className="flex items-center gap-1 text-violet-600">
                    <BuildingOffice2Icon className="h-3 w-3" />
                    All {organizations.length} orgs
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={ClipboardDocumentCheckIcon}
          label="Total Tasks"
          value={tasks.length}
          sub={tasks.length === 0 ? 'None assigned' : undefined}
          accent="bg-violet-100 text-violet-600 dark:bg-violet-900/30"
        />
        <StatCard
          icon={ArrowTrendingUpIcon}
          label="Completion"
          value={`${completionRate}%`}
          sub={tasks.length > 0 ? `${completedCount} of ${tasks.length} done` : undefined}
          accent="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
        />
        <StatCard
          icon={MicrophoneIcon}
          label="Meetings"
          value={contributions.length}
          sub={contributions.length > 0 ? 'contributed to' : 'None yet'}
          accent="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
        />
        <StatCard
          icon={ChatBubbleLeftIcon}
          label="Messages"
          value={contribStats.total_messages}
          sub={
            contribStats.total_words > 0
              ? `${contribStats.total_words.toLocaleString()} words`
              : undefined
          }
          accent="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30"
        />
      </div>

      {/* ── Assigned Tasks ────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-card shadow-sm">
        {/* Section header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardDocumentCheckIcon className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">Assigned Tasks</h2>
            {tasks.length > 0 && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {tasks.length}
              </span>
            )}
          </div>
          {tasks.length > 0 && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {pendingCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  {pendingCount} pending
                </span>
              )}
              {inProgressCount > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {inProgressCount} active
                </span>
              )}
            </div>
          )}
        </div>

        {/* Completion progress bar */}
        {tasks.length > 0 && (
          <div className="px-6 pt-4 pb-2">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>Completion rate</span>
              <span className="font-semibold text-foreground">{completionRate}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="p-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No tasks assigned yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tasks assigned to this member will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const s = STATUS_CONFIG[task.status]
                const p = PRIORITY_CONFIG[task.priority]
                return (
                  <Link
                    key={task.task_id}
                    to={`/org/tasks/${task.task_id}`}
                    className="group flex items-center gap-3 rounded-xl border bg-background p-3.5 transition-all hover:border-violet-400/40 hover:shadow-sm"
                  >
                    {/* Priority bar */}
                    <div className={cn('h-8 w-1 shrink-0 rounded-full', p.bar)} />

                    {/* Title + meta */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm font-medium transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400',
                          task.status === 'completed'
                            ? 'text-muted-foreground line-through'
                            : 'text-foreground'
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className={cn('font-medium', p.text)}>{p.label}</span>
                        {task.due_date && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <ClockIcon className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn(
                        'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        s.bg,
                        s.text
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
                      {s.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Meeting Contributions ─────────────────────────────────────── */}
      <section className="rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <MicrophoneIcon className="h-4 w-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-foreground">Meeting Contributions</h2>
            {contributions.length > 0 && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                {contributions.length}
              </span>
            )}
          </div>
          {contribStats.total_words > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="hidden sm:inline">
                {contribStats.total_words.toLocaleString()} words spoken
              </span>
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="h-3 w-3" />
                {contribStats.total_messages} messages
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {contributions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <MicrophoneIcon className="h-5 w-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground">No speaking contributions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Meeting transcripts where this member spoke will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {contributions.map((c) => {
                const maxMsgs = Math.max(...contributions.map((x) => x.message_count))
                const barPct = maxMsgs > 0 ? Math.round((c.message_count / maxMsgs) * 100) : 0
                return (
                  <div
                    key={c.session_id}
                    className="group overflow-hidden rounded-xl border bg-background transition-all hover:border-violet-400/40 hover:shadow-sm"
                  >
                    {/* Meeting title row */}
                    <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
                      <Link
                        to={`/meetings/${c.session_id}`}
                        className="min-w-0 flex-1 text-sm font-semibold text-foreground transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400 line-clamp-1"
                      >
                        {c.title || 'Untitled Meeting'}
                      </Link>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ChatBubbleLeftIcon className="h-3 w-3" />
                          {c.message_count}
                        </span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">
                          {new Date(c.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Activity bar */}
                    <div className="px-4 pb-2">
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Highlights */}
                    {c.highlights.length > 0 && (
                      <div className="border-t bg-muted/30 px-4 py-2.5 space-y-1">
                        {c.highlights.slice(0, 2).map((h, i) => (
                          <p key={i} className="line-clamp-1 text-xs text-muted-foreground italic">
                            &ldquo;{h}&rdquo;
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export { MemberProfilePage }

// ── Image resize helper ───────────────────────────────────────────────────────

function resizeImage(file: File, maxW: number, maxH: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(maxW / img.width, maxH / img.height, 1)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
