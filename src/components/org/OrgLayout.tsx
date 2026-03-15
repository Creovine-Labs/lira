import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Building2,
  Settings,
  Globe,
  FileText,
  CheckSquare,
  Users,
  Bell,
  ArrowLeft,
  ChevronDown,
  Plus,
  X,
  ClipboardList,
  BriefcaseIcon,
} from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import { listOrganizations, listTasks, type TaskRecord } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { cn } from '@/lib'

const NAV_ITEMS = [
  { to: '/org/settings', icon: Settings, label: 'Settings' },
  { to: '/org/knowledge', icon: Globe, label: 'Knowledge Base' },
  { to: '/org/documents', icon: FileText, label: 'Documents' },
  { to: '/org/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/org/roles', icon: BriefcaseIcon, label: 'Interviews' },
  { to: '/org/members', icon: Users, label: 'Members' },
  { to: '/org/webhooks', icon: Bell, label: 'Webhooks' },
]

function OrgLayout() {
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)
  const { currentOrgId, organizations, setOrganizations, setCurrentOrg } = useOrgStore()

  const [pendingTasks, setPendingTasks] = useState<TaskRecord[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [_seenVersion, setSeenVersion] = useState(0) // bump to force re-read from localStorage
  const notifRef = useRef<HTMLDivElement>(null)

  // Read last-seen task id directly from localStorage (no derived state needed)
  const lastSeenTaskId = currentOrgId
    ? localStorage.getItem(`lira_notif_seen_${currentOrgId}`)
    : null

  useEffect(() => {
    if (!token) return
    listOrganizations()
      .then((orgs) => setOrganizations(orgs))
      .catch(() => {})
  }, [token, setOrganizations])

  const fetchPendingTasks = useCallback((): Promise<TaskRecord[]> => {
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

  // Fetch pending tasks for notification badge
  useEffect(() => {
    if (!token || !currentOrgId) {
      Promise.resolve([]).then(setPendingTasks)
      return
    }
    fetchPendingTasks().then(setPendingTasks)
    const interval = setInterval(() => {
      fetchPendingTasks().then(setPendingTasks)
    }, 60_000) // refresh every minute
    return () => clearInterval(interval)
  }, [token, currentOrgId, fetchPendingTasks])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleOpenNotifications() {
    setShowNotifications((v) => !v)
    // Mark all current notifications as seen
    if (pendingTasks.length > 0 && currentOrgId) {
      const latestId = pendingTasks[0].task_id
      localStorage.setItem(`lira_notif_seen_${currentOrgId}`, latestId)
      setSeenVersion((v) => v + 1) // force re-read of localStorage
    }
  }

  const lastSeenIndex = lastSeenTaskId
    ? pendingTasks.findIndex((t) => t.task_id === lastSeenTaskId)
    : -1
  const unreadCount = lastSeenIndex === -1 ? pendingTasks.length : lastSeenIndex

  // Redirect to login if not authenticated
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Please sign in first.</p>
      </div>
    )
  }

  // If no orgs, redirect to onboarding
  if (organizations.length === 0 && currentOrgId === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            You are not currently a member of any organization.
          </p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            Create or Join an Organization
          </button>
        </div>
      </div>
    )
  }

  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* Top bar */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>
            <div className="h-5 w-px bg-border" />
            <LiraLogo size="sm" />
          </div>

          {/* Org switcher */}
          <div className="flex items-center gap-2">
            {organizations.length > 1 ? (
              <div className="relative">
                <select
                  value={currentOrgId ?? ''}
                  onChange={(e) => setCurrentOrg(e.target.value)}
                  className="appearance-none rounded-lg border bg-background px-3 py-1.5 pr-8 text-sm font-medium text-foreground"
                >
                  {organizations.map((org) => (
                    <option key={org.org_id} value={org.org_id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            ) : currentOrg ? (
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="h-4 w-4 text-violet-500" />
                {currentOrg.name}
              </div>
            ) : null}
            <button
              onClick={() => navigate('/organizations')}
              title="Create new organization"
              className="rounded-lg border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>

            {/* Notification bell */}
            {currentOrgId && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={handleOpenNotifications}
                  title="Notifications"
                  className="relative rounded-lg border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-10 z-50 w-80 rounded-xl border bg-card shadow-xl">
                    <div className="flex items-center justify-between border-b px-4 py-3">
                      <h3 className="text-sm font-semibold">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {pendingTasks.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-8 text-center">
                          <Bell className="h-8 w-8 text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {pendingTasks.slice(0, 10).map((task) => (
                            <button
                              key={task.task_id}
                              className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition"
                              onClick={() => {
                                setShowNotifications(false)
                                navigate(`/org/tasks/${task.task_id}`)
                              }}
                            >
                              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                  {task.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Pending task
                                  {task.session_id ? ' · from meeting' : ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {pendingTasks.length > 0 && (
                      <div className="border-t px-4 py-2.5">
                        <button
                          className="text-xs text-violet-500 hover:text-violet-600 font-medium"
                          onClick={() => {
                            setShowNotifications(false)
                            navigate('/org/tasks')
                          }}
                        >
                          View all tasks →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0">
        {/* Sidebar */}
        <nav className="w-56 shrink-0 border-r bg-card/50 px-3 py-6">
          <div className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content */}
        <main className="flex-1 px-8 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export { OrgLayout }
