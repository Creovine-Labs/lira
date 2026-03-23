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
  }
> = {
  owner: {
    label: 'Owner',
    icon: TrophyIcon,
    pill: 'bg-[#3730a3]/15 text-[#a5b4fc]',
    gradient: 'from-[#3730a3] to-[#1e1b4b]',
    banner: 'from-[#1e1b4b] via-[#3730a3] to-[#0f0f0f]',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheckIcon,
    pill: 'bg-[#4f46e5]/15 text-[#c7d2fe]',
    gradient: 'from-[#4f46e5] to-[#1e1b4b]',
    banner: 'from-[#0f0f0f] via-[#312e81] to-[#1e1b4b]',
  },
  member: {
    label: 'Member',
    icon: ShieldCheckIcon,
    pill: 'bg-white/10 text-white/60',
    gradient: 'from-[#374151] to-[#0f0f0f]',
    banner: 'from-[#0f0f0f] via-[#1f2937] to-[#111827]',
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
  accent: 'purple' | 'dark' | 'indigo' | 'slate'
}) {
  const _dark = {
    bg: 'from-[#1c1c1e] via-[#141414] to-[#0a0a0a]',
    glow: 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
  }
  const palettes = { purple: _dark, dark: _dark, indigo: _dark, slate: _dark }
  const { bg, glow } = palettes[accent]
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${bg} ${glow} p-5`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.12] to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.08]" />
      <div className="relative">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60">
          <Icon className="h-[15px] w-[15px]" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {label}
        </p>
        {sub && <p className="mt-1 text-[11px] text-white/30">{sub}</p>}
      </div>
    </div>
  )
}

type ProfileTab = 'profile' | 'tasks' | 'contributions'

function MemberProfilePage() {
  const { userId: paramUserId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { currentOrgId, organizations } = useOrgStore()
  const { userId: myUserId } = useAuthStore()
  // When accessed via /profile (no param), default to the logged-in user
  const userId = paramUserId ?? myUserId
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
  const [activeTab, setActiveTab] = useState<ProfileTab>('profile')
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
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-xl bg-gray-300/60" />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
            <div className="h-64 animate-pulse rounded-2xl bg-gray-300/60" />
            <div className="space-y-4 lg:col-span-3">
              <div className="h-44 animate-pulse rounded-2xl bg-gray-400/30" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-300/60" />
                ))}
              </div>
            </div>
          </div>
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

  const NAV_TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'My Profile', icon: ShieldCheckIcon },
    { id: 'tasks', label: 'Assigned Tasks', icon: ClipboardDocumentCheckIcon },
    { id: 'contributions', label: 'Contributions', icon: MicrophoneIcon },
  ]

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        {/* ── Back nav ── */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => navigate('/org/members')}
            className="group flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Members
          </button>

          {isOwnProfile && organizations.length > 0 && (
            <div className="relative" ref={orgDropRef}>
              <button
                onClick={() => setOrgDropOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-white/60 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:shadow-md"
              >
                <BuildingOffice2Icon className="h-3.5 w-3.5 text-[#3730a3]" />
                {selectedOrgId === 'all'
                  ? 'All Organizations'
                  : (organizations.find((o) => o.org_id === (selectedOrgId ?? currentOrgId))
                      ?.name ?? 'Current Org')}
                <ChevronDownIcon className="h-3 w-3 text-gray-400" />
              </button>
              {orgDropOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                  {organizations.length > 1 && (
                    <button
                      onClick={() => {
                        setSelectedOrgId('all')
                        setOrgDropOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-gray-50',
                        selectedOrgId === 'all' ? 'font-semibold text-[#3730a3]' : 'text-gray-700'
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
                        'flex w-full items-center gap-2 px-3 py-2 text-xs transition hover:bg-gray-50',
                        (selectedOrgId ?? currentOrgId) === org.org_id && selectedOrgId !== 'all'
                          ? 'font-semibold text-[#3730a3]'
                          : 'text-gray-700'
                      )}
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[#3730a3]/10 text-[9px] font-bold text-[#3730a3]">
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

        {/* ── Main layout: left sidebar nav + right content ── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {/* ── Left panel ── */}
          <div className="flex flex-col gap-4">
            {/* Profile card */}
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              {/* Avatar */}
              <div className="flex flex-col items-center px-5 pt-6 pb-5">
                <div className="relative mb-3">
                  {member.picture ? (
                    <img
                      src={member.picture}
                      alt={member.name ?? ''}
                      referrerPolicy="no-referrer"
                      className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                    />
                  ) : (
                    <div
                      className={cn(
                        'flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-xl font-bold text-white shadow-lg ring-4 ring-white',
                        role.gradient
                      )}
                    >
                      {initials}
                    </div>
                  )}
                  {isOwnProfile && (
                    <>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPic}
                        className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#3730a3] shadow-md ring-2 ring-white transition hover:bg-[#312e81] disabled:opacity-50"
                        title="Change photo"
                      >
                        {uploadingPic ? (
                          <ArrowPathIcon className="h-3 w-3 animate-spin text-white" />
                        ) : (
                          <CameraIcon className="h-3 w-3 text-white" />
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
                <p className="text-center text-sm font-bold text-gray-900">
                  {member.name ?? member.email ?? 'Unknown'}
                </p>
                {member.name && member.email && (
                  <p className="mt-0.5 text-center text-xs text-gray-400">{member.email}</p>
                )}
                <span
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    role.pill,
                    'bg-[#3730a3]/10 text-[#3730a3]'
                  )}
                >
                  <RoleIcon className="h-3 w-3" />
                  {role.label}
                </span>
                <div className="mt-3 w-full space-y-1.5 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
                    Joined{' '}
                    {joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                  {monthsActive > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <BoltIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {monthsActive} month{monthsActive !== 1 ? 's' : ''} active
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Nav tabs */}
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              <div className="px-3 py-2">
                <p className="mb-1 px-2 pt-1 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  Menu
                </p>
                {NAV_TABS.map((tab) => {
                  const TabIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all',
                        activeTab === tab.id
                          ? 'bg-[#3730a3] font-semibold text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <TabIcon className="h-4 w-4 shrink-0" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Right content ── */}
          <div className="space-y-4 lg:col-span-3">
            {/* ── PROFILE TAB ── */}
            {activeTab === 'profile' && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard
                    icon={ClipboardDocumentCheckIcon}
                    label="Total Tasks"
                    value={tasks.length}
                    sub={tasks.length === 0 ? 'None assigned' : undefined}
                    accent="purple"
                  />
                  <StatCard
                    icon={ArrowTrendingUpIcon}
                    label="Completion"
                    value={`${completionRate}%`}
                    sub={tasks.length > 0 ? `${completedCount} of ${tasks.length}` : undefined}
                    accent="dark"
                  />
                  <StatCard
                    icon={MicrophoneIcon}
                    label="Meetings"
                    value={contributions.length}
                    sub={contributions.length > 0 ? 'contributed' : 'None yet'}
                    accent="indigo"
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
                    accent="slate"
                  />
                </div>

                {/* Personal info card */}
                <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Full name
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{member.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Email address
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {member.email ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Role
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{role.label}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                        Member since
                      </p>
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {joinDate.toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {selectedOrgId === 'all' && organizations.length > 1 && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                          Organizations
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#3730a3]">
                          {organizations.length} workspaces
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── TASKS TAB ── */}
            {activeTab === 'tasks' && (
              <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-[#3730a3]" />
                    <h2 className="text-sm font-semibold text-gray-900">Assigned Tasks</h2>
                    {tasks.length > 0 && (
                      <span className="rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-xs font-semibold text-[#3730a3]">
                        {tasks.length}
                      </span>
                    )}
                  </div>
                  {tasks.length > 0 && (
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {pendingCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                          {pendingCount} pending
                        </span>
                      )}
                      {inProgressCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#3730a3]" />
                          {inProgressCount} active
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {tasks.length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
                      <span>Completion rate</span>
                      <span className="font-semibold text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#3730a3] to-[#4f46e5] transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="p-4">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                        <ClipboardDocumentCheckIcon className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">No tasks assigned yet</p>
                      <p className="mt-1 text-xs text-gray-400">
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
                            className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 transition hover:border-[#3730a3]/30 hover:bg-white hover:shadow-sm"
                          >
                            <div className={cn('h-8 w-1 shrink-0 rounded-full', p.bar)} />
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  'truncate text-sm font-medium transition group-hover:text-[#3730a3]',
                                  task.status === 'completed'
                                    ? 'text-gray-400 line-through'
                                    : 'text-gray-900'
                                )}
                              >
                                {task.title}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
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
              </div>
            )}

            {/* ── CONTRIBUTIONS TAB ── */}
            {activeTab === 'contributions' && (
              <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MicrophoneIcon className="h-4 w-4 text-[#3730a3]" />
                    <h2 className="text-sm font-semibold text-gray-900">Meeting Contributions</h2>
                    {contributions.length > 0 && (
                      <span className="rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-xs font-semibold text-[#3730a3]">
                        {contributions.length}
                      </span>
                    )}
                  </div>
                  {contribStats.total_words > 0 && (
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="hidden sm:inline">
                        {contribStats.total_words.toLocaleString()} words
                      </span>
                      <span className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="h-3 w-3" />
                        {contribStats.total_messages} msgs
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  {contributions.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                        <MicrophoneIcon className="h-5 w-5 text-gray-300" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        No speaking contributions yet
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        Meeting transcripts will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contributions.map((c) => {
                        const maxMsgs = Math.max(...contributions.map((x) => x.message_count))
                        const barPct =
                          maxMsgs > 0 ? Math.round((c.message_count / maxMsgs) * 100) : 0
                        return (
                          <div
                            key={c.session_id}
                            className="group overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50 transition hover:border-[#3730a3]/30 hover:bg-white hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
                              <Link
                                to={`/meetings/${c.session_id}`}
                                className="min-w-0 flex-1 line-clamp-1 text-sm font-semibold text-gray-900 transition group-hover:text-[#3730a3]"
                              >
                                {c.title || 'Untitled Meeting'}
                              </Link>
                              <div className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
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
                            <div className="px-4 pb-2">
                              <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#3730a3] to-[#4f46e5]"
                                  style={{ width: `${barPct}%` }}
                                />
                              </div>
                            </div>
                            {c.highlights.length > 0 && (
                              <div className="space-y-1 border-t border-gray-100 bg-gray-50 px-4 py-2.5">
                                {c.highlights.slice(0, 2).map((h, i) => (
                                  <p key={i} className="line-clamp-1 text-xs italic text-gray-400">
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
              </div>
            )}
          </div>
          {/* end right col */}
        </div>
        {/* end grid */}
      </div>
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
