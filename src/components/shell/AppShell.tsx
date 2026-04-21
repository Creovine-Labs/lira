import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  BellIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  FolderOpenIcon,
  MicrophoneIcon,
  PlusIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  useAuthStore,
  useOrgStore,
  useKBStore,
  useDocumentStore,
  useTaskStore,
  useNotifStore,
  useBotStore,
  useUsageStore,
} from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  listOrganizations,
  listMyNotifications,
  listTasks,
  getOrgUsage,
  type TaskRecord,
} from '@/services/api'
import { listEscalationAlerts, markEscalationAlertsRead } from '@/services/api/support-api'
import { BetaLimitModal } from '@/components/common/BetaLimitModal'
import { LiraLogo } from '@/components/LiraLogo'
import { cn } from '@/lib'

// ── Sidebar badge helper ──────────────────────────────────────────────────────
function NavBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}

// Task-specific 2-dot badge: red dot = pending, yellow dot = in_progress
function TaskNavBadge({ pending, inProgress }: { pending: number; inProgress: number }) {
  if (pending === 0 && inProgress === 0) return null
  return (
    <span className="ml-auto flex items-center gap-1">
      {pending > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {pending > 9 ? '9+' : pending}
        </span>
      )}
      {inProgress > 0 && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-bold text-white">
          {inProgress > 9 ? '9+' : inProgress}
        </span>
      )}
    </span>
  )
}

// ── useSidebarBadges — derive per-section unread counts ───────────────────────
function useSidebarBadges() {
  const { entries, meetingSeenAt, supportSeenAt } = useNotifStore()
  const { tasks } = useTaskStore()

  // Task status counts for the tri-color badge
  const taskPending = tasks.filter((t) => t.status === 'pending').length
  const taskInProgress = tasks.filter((t) => t.status === 'in_progress').length

  const meetingBadge = entries.filter(
    (e) => e.kind === 'meeting_ended' && (meetingSeenAt === 0 || e.createdAt > meetingSeenAt)
  ).length
  const supportBadge = entries.filter(
    (e) => e.kind === 'support_escalation' && (supportSeenAt === 0 || e.createdAt > supportSeenAt)
  ).length
  return {
    badges: {
      '/meetings': meetingBadge,
      '/support/inbox': supportBadge,
      '/support': supportBadge,
    } as Record<string, number>,
    taskPending,
    taskInProgress,
  }
}

// ── Sidebar nav structure ─────────────────────────────────────────────────────
type NavLeaf = {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}
type NavGroup = {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: NavLeaf[]
  to?: string // optional: clicking the label navigates here (WordPress-style)
}
type NavEntry = NavLeaf | NavGroup
function isNavGroup(entry: NavEntry): entry is NavGroup {
  return 'children' in entry
}

const NAV_CORE: NavEntry[] = [
  { to: '/dashboard', icon: Squares2X2Icon, label: 'Home' },
  { to: '/meetings', icon: MicrophoneIcon, label: 'Meetings' },
]

const SUPPORT_NAV_ACTIVATED: NavLeaf = {
  to: '/support',
  icon: ChatBubbleLeftEllipsisIcon,
  label: 'Support',
}

const SUPPORT_NAV_INACTIVE: NavLeaf = {
  to: '/support/activate',
  icon: ChatBubbleLeftEllipsisIcon,
  label: 'Support',
}

const NAV_WORKSPACE: NavGroup = {
  label: 'Workspace',
  icon: FolderOpenIcon,
  children: [
    { to: '/org/knowledge', icon: BookOpenIcon, label: 'Knowledge Base' },
    { to: '/org/tasks', icon: ClipboardDocumentCheckIcon, label: 'Tasks' },
    { to: '/org/email', icon: EnvelopeIcon, label: 'Email' },
    { to: '/org/integrations', icon: PuzzlePieceIcon, label: 'Integrations' },
    { to: '/org/usage', icon: ChartBarIcon, label: 'Usage' },
    { to: '/org/members', icon: UsersIcon, label: 'Members' },
  ],
}

const BOTTOM_NAV = [{ to: '/settings', icon: Cog6ToothIcon, label: 'Settings' }]

// ── Org switcher dropdown ──────────────────────────────────────────────────────
function OrgSwitcher() {
  const navigate = useNavigate()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const clearKB = useKBStore((s) => s.clear)
  const clearDocuments = useDocumentStore((s) => s.clear)
  const clearTasks = useTaskStore((s) => s.clear)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function handleSwitch(orgId: string, orgName: string) {
    if (orgId === currentOrgId) {
      setOpen(false)
      return
    }
    setSwitching(orgName)
    setOpen(false)
    clearKB()
    clearDocuments()
    clearTasks()
    setCurrentOrg(orgId)
    navigate('/dashboard', { replace: true })
    setTimeout(() => setSwitching(null), 800)
  }

  return (
    <>
      {switching && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-xl">
            <img
              src="/lira_black.png"
              alt=""
              className="h-5 w-5 animate-spin opacity-50"
              style={{ animationDuration: '1s' }}
            />
            <span className="text-sm font-semibold text-gray-700">Switching to {switching}…</span>
          </div>
        </div>
      )}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-[11px] font-bold text-white">
            {currentOrg?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <span className="min-w-0 flex-1 truncate text-left">
            {currentOrg?.name ?? 'Select org'}
          </span>
          <ChevronUpDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {organizations.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Your organizations
                </p>
                {organizations.map((org) => (
                  <button
                    key={org.org_id}
                    onClick={() => handleSwitch(org.org_id, org.name)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-gray-50',
                      org.org_id === currentOrgId
                        ? 'font-semibold text-violet-700'
                        : 'text-gray-700'
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-600">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{org.name}</span>
                    {org.org_id === currentOrgId && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
              </>
            )}
            <button
              onClick={() => {
                setOpen(false)
                navigate('/onboarding')
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4 text-gray-400" />
              New organization
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Topbar org switcher — always-visible clickable org pill in the header ────
function TopbarOrgSwitcher() {
  const navigate = useNavigate()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const clearKB = useKBStore((s) => s.clear)
  const clearDocuments = useDocumentStore((s) => s.clear)
  const clearTasks = useTaskStore((s) => s.clear)
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function handleSwitch(orgId: string, orgName: string) {
    if (orgId === currentOrgId) {
      setOpen(false)
      return
    }
    setSwitching(orgName)
    setOpen(false)
    clearKB()
    clearDocuments()
    clearTasks()
    setCurrentOrg(orgId)
    navigate('/dashboard', { replace: true })
    setTimeout(() => setSwitching(null), 800)
  }

  if (!currentOrg) return null

  return (
    <>
      {switching && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-xl">
            <img
              src="/lira_black.png"
              alt=""
              className="h-5 w-5 animate-spin opacity-50"
              style={{ animationDuration: '1s' }}
            />
            <span className="text-sm font-semibold text-gray-700">Switching to {switching}…</span>
          </div>
        </div>
      )}
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-gray-400/60 px-2 py-0.5 text-sm text-gray-400 transition hover:border-gray-500 hover:text-gray-500"
        >
          <span className="max-w-[72px] truncate sm:max-w-[120px]">{currentOrg.name}</span>
          <ChevronDownIcon
            className={cn(
              'h-3 w-3 shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            {organizations.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Your organizations
                </p>
                {organizations.map((org) => (
                  <button
                    key={org.org_id}
                    onClick={() => handleSwitch(org.org_id, org.name)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-gray-50',
                      org.org_id === currentOrgId
                        ? 'font-semibold text-violet-700'
                        : 'text-gray-700'
                    )}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-600">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate">{org.name}</span>
                    {org.org_id === currentOrgId && (
                      <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
              </>
            )}
            <button
              onClick={() => {
                setOpen(false)
                navigate('/onboarding')
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            >
              <PlusIcon className="h-4 w-4 text-gray-400" />
              New organization
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── UserIcon profile dropdown ─────────────────────────────────────────────────────
function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { userName, userEmail, userPicture, userRole } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const firstLetter = (userName || userEmail || 'U').charAt(0).toUpperCase()

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-100"
      >
        {userPicture ? (
          <img
            src={userPicture}
            alt={userName ?? 'UserIcon'}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {firstLetter}
          </div>
        )}
        <span className="hidden text-sm font-medium text-gray-700 sm:inline">
          {userName?.split(' ')[0] ?? 'Account'}
        </span>
        <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {/* Name header — shown on mobile where name is hidden in button */}
          {(userName || userEmail) && (
            <div className="border-b border-gray-100 px-3 py-2 sm:hidden">
              <p className="truncate text-sm font-semibold text-gray-900">
                {userName ?? userEmail}
              </p>
              {userName && userEmail && (
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setOpen(false)
              navigate('/profile')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <UserIcon className="h-4 w-4 text-gray-400" />
            My Profile
          </button>
          {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
            <button
              onClick={() => {
                setOpen(false)
                navigate('/admin')
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
              Admin Dashboard
            </button>
          )}
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ── Notification bell ─────────────────────────────────────────────────────────
function NotificationBell() {
  const navigate = useNavigate()
  const { token, userEmail, userName } = useAuthStore()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const clearKB = useKBStore((s) => s.clear)
  const clearDocuments = useDocumentStore((s) => s.clear)
  const clearTasks = useTaskStore((s) => s.clear)
  const lastTerminatedAt = useBotStore((s) => s.lastTerminatedAt)
  const { entries, addNotif, removeNotif, readTaskNotifIds, meetingSeenAt, markMeetingsSeen } =
    useNotifStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // ── Sync pending tasks into notif store (narrowed to current user) ──
  useEffect(() => {
    if (!token || !currentOrgId) return
    function refresh() {
      // 1. Pull backend notifications for this user (assignments, task created, needs_info)
      listMyNotifications()
        .then((notifs) => {
          notifs
            .filter((n) => !n.read)
            .forEach((n) => {
              let subtitle = `Assigned to you by ${n.assigned_by}`
              let link = `/org/tasks/${n.task_id}`
              if (n.kind === 'lira_needs_info') {
                subtitle = 'Lira needs more information to complete this task'
                link = `/org/tasks/${n.task_id}`
              } else if (n.kind === 'task_created') {
                subtitle = n.message || 'New tasks extracted from meeting'
                link = '/org/tasks'
              } else if (n.kind === 'integration_required') {
                subtitle = n.message || 'Integration required'
                link = `/org/tasks/${n.task_id}`
              }
              addNotif({
                id: `notif-${n.notif_id}`,
                kind: 'task',
                title: n.task_title,
                subtitle,
                orgId: n.org_id,
                link,
              })
            })
        })
        .catch(() => {})

      // 2. Pull pending tasks assigned to the current user by name/email
      const targets = [userEmail, userName].filter(Boolean) as string[]
      targets.forEach((identity) => {
        listTasks(currentOrgId!, { status: 'pending', assigned_to: identity })
          .then((result) => {
            const tasks: TaskRecord[] = Array.isArray(result)
              ? result
              : ((result as { tasks: TaskRecord[] }).tasks ?? [])
            tasks.forEach((t) =>
              addNotif({
                id: `task-${t.task_id}`,
                kind: 'task',
                title: t.title,
                subtitle: t.session_id ? 'Assigned to you · from meeting' : 'Assigned to you',
                orgId: currentOrgId ?? undefined,
                link: `/org/tasks/${t.task_id}`,
              })
            )
          })
          .catch(() => {})
      })
    }
    refresh()
    const id = setInterval(refresh, 15_000)
    return () => clearInterval(id)
  }, [token, currentOrgId, userEmail, userName, addNotif])

  // ── Support escalation alerts ──
  const { config: supportConfig } = useSupportStore()
  useEffect(() => {
    if (!token || !currentOrgId || !supportConfig?.activated) return
    function refreshAlerts() {
      listEscalationAlerts(currentOrgId!)
        .then(({ alerts }) => {
          alerts.forEach((a) => {
            addNotif({
              id: `support-alert-${a.alert_id}`,
              kind: 'support_escalation',
              title: `Escalation: ${a.subject}`,
              subtitle: a.reason,
              orgId: currentOrgId ?? undefined,
              link: `/support/notifications/${a.conv_id}`,
            })
          })
        })
        .catch(() => {})
    }
    refreshAlerts()
    const id = setInterval(refreshAlerts, 30_000)
    return () => clearInterval(id)
  }, [token, currentOrgId, supportConfig?.activated, addNotif])

  // ── Meeting-ended notification ──
  useEffect(() => {
    if (!lastTerminatedAt) return
    const id = `meeting-ended-${lastTerminatedAt}`
    addNotif({
      id,
      kind: 'meeting_ended',
      title: 'Meeting just ended',
      subtitle: 'Review the transcript and generate a summary',
      orgId: currentOrgId ?? undefined,
      link: '/meetings',
    })
  }, [lastTerminatedAt, addNotif, currentOrgId])

  // ── Outside click ──
  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  // Unread count: task entries not yet individually read + unseen meetings
  const unreadTaskCount = entries.filter(
    (e) => e.kind === 'task' && !readTaskNotifIds.includes(e.id)
  ).length
  const unreadOtherCount = entries.filter(
    (e) => e.kind !== 'task' && (meetingSeenAt === 0 || e.createdAt > meetingSeenAt)
  ).length
  const unreadCount = unreadTaskCount + unreadOtherCount

  function handleOpen() {
    setOpen((v) => !v)
    markMeetingsSeen()
  }

  const kindIcon: Record<string, React.ReactNode> = {
    task: <ClipboardDocumentListIcon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />,
    meeting_ended: <MicrophoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />,
    support_escalation: (
      <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
    ),
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <BellIcon className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {entries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <button
                      onClick={() => {
                        setOpen(false)
                        if (entry.orgId && entry.orgId !== currentOrgId) {
                          clearKB()
                          clearDocuments()
                          clearTasks()
                          setCurrentOrg(entry.orgId)
                        }
                        navigate(entry.link)
                      }}
                      className="flex flex-1 items-start gap-3 text-left transition hover:opacity-75"
                    >
                      {kindIcon[entry.kind] ?? kindIcon.task}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{entry.title}</p>
                        {entry.subtitle && (
                          <p className="mt-0.5 text-xs text-gray-400">{entry.subtitle}</p>
                        )}
                        {entry.orgId &&
                          (() => {
                            const orgName = organizations.find(
                              (o) => o.org_id === entry.orgId
                            )?.name
                            return orgName ? (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
                                <BuildingOffice2Icon className="h-2.5 w-2.5 shrink-0" />
                                {orgName}
                              </span>
                            ) : null
                          })()}
                      </div>
                    </button>
                    <button
                      onClick={() => removeNotif(entry.id)}
                      className="mt-0.5 shrink-0 rounded p-0.5 text-gray-300 hover:text-gray-500"
                      aria-label="Dismiss"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {entries.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/support/notifications')
                }}
                className="text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                View all notifications →
              </button>
              <button
                onClick={() => useNotifStore.getState().clearAll()}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── AppShell ──────────────────────────────────────────────────────────────────
function AppShell() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Workspace']))
  const { token, emailVerified, clearCredentials } = useAuthStore()
  const { organizations, setOrganizations, currentOrgId, clear } = useOrgStore()
  const [orgLoading, setOrgLoading] = useState(organizations.length === 0)

  // Load orgs on mount
  useEffect(() => {
    if (!token) return
    listOrganizations()
      .then((orgs) => setOrganizations(orgs))
      .catch(() => {})
      .finally(() => setOrgLoading(false))
  }, [token, setOrganizations])

  const { badges, taskPending, taskInProgress } = useSidebarBadges()
  const { markMeetingsSeen, markSupportSeen } = useNotifStore()
  const setSummary = useUsageStore((s) => s.setSummary)
  const supportConfig = useSupportStore((s) => s.config)
  const loadSupportConfig = useSupportStore((s) => s.loadConfig)

  // Load support config when org changes
  useEffect(() => {
    if (!currentOrgId) return
    loadSupportConfig(currentOrgId)
  }, [currentOrgId, loadSupportConfig])

  // Build nav with conditional Support entry
  const supportActivated = supportConfig?.activated ?? false
  const navEntries = useMemo<NavEntry[]>(
    () => [
      ...NAV_CORE,
      supportActivated ? SUPPORT_NAV_ACTIVATED : SUPPORT_NAV_INACTIVE,
      NAV_WORKSPACE,
    ],
    [supportActivated]
  )

  // Fetch usage summary when org changes
  useEffect(() => {
    if (!currentOrgId) return
    getOrgUsage(currentOrgId)
      .then(setSummary)
      .catch(() => {})
  }, [currentOrgId, setSummary])
  const location = useLocation()

  // Clear sidebar badge when user navigates to the relevant section
  // NOTE: tasks are NOT cleared here — they only clear when individual task detail is opened
  useEffect(() => {
    const p = location.pathname
    if (p.startsWith('/meetings') || p.startsWith('/meeting')) markMeetingsSeen()
    else if (p.startsWith('/support')) {
      markSupportSeen()
      if (currentOrgId) markEscalationAlertsRead(currentOrgId).catch(() => {})
    }
    // Auto-expand the nav group that contains the active route
    navEntries.forEach((entry) => {
      if (isNavGroup(entry) && entry.children.some((c) => p.startsWith(c.to))) {
        setExpanded((prev) => new Set([...prev, entry.label]))
      }
    })
  }, [location.pathname, markMeetingsSeen, markSupportSeen, currentOrgId, supportActivated])

  function handleSignOut() {
    clearCredentials()
    clear()
    navigate('/', { replace: true })
  }

  // Not authenticated — redirect to home/login
  if (!token) {
    return <Navigate to="/" replace />
  }

  // Email not verified — must complete OTP before accessing the app
  if (emailVerified === false) {
    return <Navigate to="/verify-email" replace />
  }

  // Loading orgs — show spinner to prevent flash of empty state
  if (orgLoading && organizations.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-8 w-8 animate-spin opacity-60"
          style={{ animationDuration: '1.2s' }}
        />
      </div>
    )
  }

  // No org yet — redirect to onboarding
  if (organizations.length === 0 && currentOrgId === null) {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Mobile drawer overlay ── */}
      {sidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            aria-label="Close sidebar"
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSidebarOpen(false)
            }}
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[200px] flex-col border-r border-gray-100 bg-white px-3 py-4 md:hidden">
            <div className="mb-4 flex items-center justify-between px-1">
              <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)}>
                <LiraLogo size="sm" />
              </NavLink>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4">
              <OrgSwitcher />
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
              {navEntries.map((entry) => {
                if (!isNavGroup(entry)) {
                  return (
                    <NavLink
                      key={entry.to}
                      to={entry.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'bg-[#1A1A1A] text-white'
                            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                        )
                      }
                    >
                      <entry.icon className="h-4 w-4 shrink-0" />
                      {entry.label}
                      {entry.to === '/org/tasks' ? (
                        <TaskNavBadge pending={taskPending} inProgress={taskInProgress} />
                      ) : (
                        <NavBadge count={badges[entry.to] ?? 0} />
                      )}
                    </NavLink>
                  )
                }
                const isOpen = expanded.has(entry.label)
                const toggleGroup = () =>
                  setExpanded((prev) => {
                    const next = new Set(prev)
                    if (next.has(entry.label)) next.delete(entry.label)
                    else next.add(entry.label)
                    return next
                  })
                return (
                  <div key={entry.label}>
                    <div className="flex items-center rounded-xl hover:bg-gray-100 transition-colors">
                      {entry.to ? (
                        <NavLink
                          to={entry.to}
                          onClick={() => {
                            setSidebarOpen(false)
                            setExpanded((prev) => new Set([...prev, entry.label]))
                          }}
                          className={({ isActive }) =>
                            cn(
                              'flex flex-1 items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors',
                              isActive ? 'text-gray-900' : 'text-gray-500'
                            )
                          }
                        >
                          <entry.icon className="h-4 w-4 shrink-0" />
                          {entry.label}
                        </NavLink>
                      ) : (
                        <button
                          onClick={toggleGroup}
                          className="flex flex-1 items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-500"
                        >
                          <entry.icon className="h-4 w-4 shrink-0" />
                          {entry.label}
                        </button>
                      )}
                      <button
                        onClick={toggleGroup}
                        className="px-2 py-2 text-gray-400 hover:text-gray-700"
                        aria-label="Toggle"
                      >
                        <ChevronDownIcon
                          className={cn(
                            'h-3.5 w-3.5 transition-transform duration-200',
                            isOpen && 'rotate-180'
                          )}
                        />
                      </button>
                    </div>
                    {isOpen && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                        {entry.children.map(({ to, icon: Icon, label }) => (
                          <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                                isActive
                                  ? 'bg-[#1A1A1A] text-white'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                              )
                            }
                          >
                            <Icon className="h-4 w-4 shrink-0" />
                            {label}
                            {to === '/org/tasks' ? (
                              <TaskNavBadge pending={taskPending} inProgress={taskInProgress} />
                            ) : (
                              <NavBadge count={badges[to] ?? 0} />
                            )}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
            <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-3">
              {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                      isActive
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
              <a
                href="https://docs.liraintelligence.com"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                <BookOpenIcon className="h-4 w-4 shrink-0" />
                Docs
              </a>
            </div>
          </aside>
        </>
      )}

      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          'hidden md:flex shrink-0 flex-col border-r border-gray-100 bg-white py-4 transition-all duration-200 ease-in-out',
          sidebarCollapsed ? 'w-16 px-2' : 'w-[210px] px-3'
        )}
      >
        {/* Logo + collapse toggle */}
        <div className="mb-4 flex items-center justify-between px-1">
          <NavLink to="/dashboard">
            <LiraLogo size="sm" mark={sidebarCollapsed} />
          </NavLink>
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Bars3Icon className="h-4 w-4" />
          </button>
        </div>

        {/* Org switcher — hidden when collapsed */}
        {!sidebarCollapsed && (
          <div className="mb-4">
            <OrgSwitcher />
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
          {navEntries.map((entry) => {
            if (!isNavGroup(entry)) {
              return (
                <NavLink
                  key={entry.to}
                  to={entry.to}
                  title={sidebarCollapsed ? entry.label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center rounded-xl py-2 text-[13px] font-medium transition-colors',
                      sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                      isActive
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    )
                  }
                >
                  <entry.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && entry.label}
                  {!sidebarCollapsed && entry.to === '/org/tasks' ? (
                    <TaskNavBadge pending={taskPending} inProgress={taskInProgress} />
                  ) : !sidebarCollapsed ? (
                    <NavBadge count={badges[entry.to] ?? 0} />
                  ) : null}
                </NavLink>
              )
            }
            const isOpen = expanded.has(entry.label)
            const hasActive = entry.children.some((c) => location.pathname.startsWith(c.to))
            if (sidebarCollapsed) {
              return (
                <div key={entry.label} className="relative">
                  <button
                    title={entry.label}
                    onClick={() => {
                      setExpanded((prev) => new Set([...prev, entry.label]))
                      setSidebarCollapsed(false)
                      if (entry.children.length > 0) navigate(entry.children[0].to)
                    }}
                    className={cn(
                      'flex w-full items-center justify-center rounded-xl px-2 py-2 text-[13px] font-medium transition-colors',
                      hasActive
                        ? 'bg-[#1A1A1A] text-white'
                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <entry.icon className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              )
            }
            const toggleGroup = () =>
              setExpanded((prev) => {
                const next = new Set(prev)
                if (next.has(entry.label)) next.delete(entry.label)
                else next.add(entry.label)
                return next
              })
            return (
              <div key={entry.label}>
                <div className="flex items-center rounded-xl hover:bg-gray-100 transition-colors">
                  {entry.to ? (
                    <NavLink
                      to={entry.to}
                      onClick={() => setExpanded((prev) => new Set([...prev, entry.label]))}
                      className={({ isActive }) =>
                        cn(
                          'flex flex-1 items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors',
                          isActive ? 'text-gray-900' : 'text-gray-500'
                        )
                      }
                    >
                      <entry.icon className="h-4 w-4 shrink-0" />
                      {entry.label}
                    </NavLink>
                  ) : (
                    <button
                      onClick={toggleGroup}
                      className="flex flex-1 items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-gray-500"
                    >
                      <entry.icon className="h-4 w-4 shrink-0" />
                      {entry.label}
                    </button>
                  )}
                  <button
                    onClick={toggleGroup}
                    className="px-2 py-2 text-gray-400 hover:text-gray-700"
                    aria-label="Toggle"
                  >
                    <ChevronDownIcon
                      className={cn(
                        'h-3.5 w-3.5 transition-transform duration-200',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-gray-100 pl-3">
                    {entry.children.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-[#1A1A1A] text-white'
                              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                          )
                        }
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {label}
                        {to === '/org/tasks' ? (
                          <TaskNavBadge pending={taskPending} inProgress={taskInProgress} />
                        ) : (
                          <NavBadge count={badges[to] ?? 0} />
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-3">
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              title={sidebarCollapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-xl py-2 text-[13px] font-medium transition-colors',
                  sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
                  isActive
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && label}
            </NavLink>
          ))}
          <a
            href="https://docs.liraintelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            title={sidebarCollapsed ? 'Docs' : undefined}
            className={cn(
              'flex items-center rounded-xl py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors',
              sidebarCollapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
            )}
          >
            <BookOpenIcon className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Docs'}
          </a>
        </div>
      </aside>

      {/* ── Right side: topbar + content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 bg-[#ebebeb] px-4 sm:px-6">
          {/* Left — hamburger on mobile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 md:hidden"
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
            <NavLink to="/dashboard" className="md:hidden">
              <LiraLogo size="sm" />
            </NavLink>
          </div>

          {/* Center — persistent org switcher (always visible) */}
          <div className="flex flex-1 items-center">
            <TopbarOrgSwitcher />
          </div>

          {/* Right — notifications + user */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu onSignOut={handleSignOut} />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#ebebeb]">
          <Outlet />
        </main>
      </div>

      {/* Beta limit modal (global) */}
      <BetaLimitModal />
    </div>
  )
}

export { AppShell }
