import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  BriefcaseIcon,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Plus,
  Settings,
  Users,
  CheckSquare,
  X,
  User,
  ChevronsUpDown,
} from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import { listOrganizations, listTasks, type TaskRecord } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { cn } from '@/lib'

// ── Sidebar nav structure ─────────────────────────────────────────────────────
const NAV = [
  {
    group: null,
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Home' }],
  },
  {
    group: 'Conversations',
    items: [
      { to: '/meetings', icon: Mic, label: 'Meetings' },
      { to: '/org/roles', icon: BriefcaseIcon, label: 'Interviews' },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { to: '/org/knowledge', icon: BookOpen, label: 'Knowledge Base' },
      { to: '/org/documents', icon: FileText, label: 'Documents' },
      { to: '/org/tasks', icon: CheckSquare, label: 'Tasks' },
    ],
  },
  {
    group: 'Team',
    items: [{ to: '/org/members', icon: Users, label: 'Members' }],
  },
]

const BOTTOM_NAV = [{ to: '/settings', icon: Settings, label: 'Settings' }]

// ── Org switcher dropdown ──────────────────────────────────────────────────────
function OrgSwitcher() {
  const navigate = useNavigate()
  const { currentOrgId, organizations, setCurrentOrg } = useOrgStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

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
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-[11px] font-bold text-white">
          {currentOrg?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <span className="min-w-0 flex-1 truncate text-left">
          {currentOrg?.name ?? 'Select org'}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
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
                  onClick={() => {
                    setCurrentOrg(org.org_id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2 text-sm transition hover:bg-gray-50',
                    org.org_id === currentOrgId ? 'font-semibold text-violet-700' : 'text-gray-700'
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
            <Plus className="h-4 w-4 text-gray-400" />
            New organization
          </button>
        </div>
      )}
    </div>
  )
}

// ── User profile dropdown ─────────────────────────────────────────────────────
function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { userName, userEmail, userPicture } = useAuthStore()
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
            alt={userName ?? 'User'}
            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-[11px] font-bold text-white">
            {firstLetter}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700">
          {userName?.split(' ')[0] ?? 'Account'}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false)
              navigate('/settings')
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
          >
            <User className="h-4 w-4 text-gray-400" />
            Account settings
          </button>
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => {
              setOpen(false)
              onSignOut()
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
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
  const { token } = useAuthStore()
  const { currentOrgId } = useOrgStore()
  const [pendingTasks, setPendingTasks] = useState<TaskRecord[]>([])
  const [open, setOpen] = useState(false)
  const [seenVersion, setSeenVersion] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const lastSeenTaskId = currentOrgId
    ? localStorage.getItem(`lira_notif_seen_${currentOrgId}`)
    : null

  const fetchTasks = useCallback((): Promise<TaskRecord[]> => {
    if (!currentOrgId) return Promise.resolve([])
    return listTasks(currentOrgId, { status: 'pending' })
      .then((result) => {
        const tasks = Array.isArray(result)
          ? result
          : ((result as { tasks: TaskRecord[] }).tasks ?? [])
        tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return tasks
      })
      .catch(() => [] as TaskRecord[])
  }, [currentOrgId])

  useEffect(() => {
    if (!token || !currentOrgId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingTasks([])
      return
    }
    fetchTasks().then(setPendingTasks)
    const id = setInterval(() => fetchTasks().then(setPendingTasks), 60_000)
    return () => clearInterval(id)
  }, [token, currentOrgId, fetchTasks])

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const lastSeenIndex = lastSeenTaskId
    ? pendingTasks.findIndex((t) => t.task_id === lastSeenTaskId)
    : -1
  const unreadCount = lastSeenIndex === -1 ? pendingTasks.length : lastSeenIndex

  // suppress unused warning from seenVersion
  void seenVersion

  function handleOpen() {
    setOpen((v) => !v)
    if (pendingTasks.length > 0 && currentOrgId) {
      localStorage.setItem(`lira_notif_seen_${currentOrgId}`, pendingTasks[0].task_id)
      setSeenVersion((v) => v + 1)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <button onClick={() => setOpen(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-200" />
                <p className="text-sm text-gray-400">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingTasks.slice(0, 10).map((task) => (
                  <button
                    key={task.task_id}
                    onClick={() => {
                      setOpen(false)
                      navigate(`/org/tasks/${task.task_id}`)
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                  >
                    <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Pending task{task.session_id ? ' · from meeting' : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {pendingTasks.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5">
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/org/tasks')
                }}
                className="text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                View all tasks →
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
  const { token, clearCredentials } = useAuthStore()
  const { organizations, setOrganizations, currentOrgId, clear } = useOrgStore()

  // Load orgs on mount
  useEffect(() => {
    if (!token) return
    listOrganizations()
      .then((orgs) => setOrganizations(orgs))
      .catch(() => {})
  }, [token, setOrganizations])

  function handleSignOut() {
    clearCredentials()
    clear()
    navigate('/', { replace: true })
  }

  // Not authenticated — redirect to home/login
  if (!token) {
    return <Navigate to="/" replace />
  }

  // No org yet — prompt onboarding
  if (organizations.length === 0 && currentOrgId === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
            <Building2 className="h-6 w-6 text-violet-600" />
          </div>
          <p className="text-sm font-medium text-gray-900">No organization yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create or join an organization to get started.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            Get started
          </button>
        </div>
      </div>
    )
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
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4">
              <OrgSwitcher />
            </div>
            <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {NAV.map((section, si) => (
                <div key={si}>
                  {section.group && (
                    <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                      {section.group}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map(({ to, icon: Icon, label }) => (
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
                  </div>
                </div>
              ))}
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
            </div>
          </aside>
        </>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-[200px] shrink-0 flex-col border-r border-gray-100 bg-white px-3 py-4">
        {/* Logo */}
        <div className="mb-4 px-1">
          <NavLink to="/dashboard">
            <LiraLogo size="sm" />
          </NavLink>
        </div>

        {/* Org switcher */}
        <div className="mb-4">
          <OrgSwitcher />
        </div>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {NAV.map((section, si) => (
            <div key={si}>
              {section.group && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {section.group}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(({ to, icon: Icon, label }) => (
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
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom nav */}
        <div className="mt-2 space-y-0.5 border-t border-gray-100 pt-3">
          {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
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
            </NavLink>
          ))}
        </div>
      </aside>

      {/* ── Right side: topbar + content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 sm:px-6">
          {/* Left — hamburger on mobile, empty on desktop */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 md:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <NavLink to="/dashboard" className="md:hidden">
              <LiraLogo size="sm" />
            </NavLink>
          </div>

          {/* Right — notifications + user */}
          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu onSignOut={handleSignOut} />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { AppShell }
