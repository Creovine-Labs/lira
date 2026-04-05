import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import {
  HomeIcon,
  UsersIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

const NAV_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: '/admin', icon: HomeIcon, label: 'Overview', end: true },
  { to: '/admin/users', icon: UsersIcon, label: 'Users' },
  { to: '/admin/organizations', icon: BuildingOffice2Icon, label: 'Organizations' },
  { to: '/admin/email', icon: EnvelopeIcon, label: 'Email' },
]

const SUPER_ADMIN_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: '/admin/admins', icon: ShieldCheckIcon, label: 'Admin Management' },
]

export function AdminShell() {
  const role = useAuthStore((s) => s.userRole)

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const allItems = isSuperAdmin ? [...NAV_ITEMS, ...SUPER_ADMIN_ITEMS] : NAV_ITEMS

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <ShieldCheckIcon className="h-6 w-6 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-900">Admin Dashboard</span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {allItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-indigo-50 font-medium text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-2 py-3">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to App
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
