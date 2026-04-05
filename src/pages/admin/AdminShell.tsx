import { useState } from 'react'
import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import {
  Squares2X2Icon,
  UsersIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib'

const NAV_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: '/admin', icon: Squares2X2Icon, label: 'Overview', end: true },
  { to: '/admin/users', icon: UsersIcon, label: 'Users' },
  { to: '/admin/organizations', icon: BuildingOffice2Icon, label: 'Organizations' },
  { to: '/admin/email', icon: EnvelopeIcon, label: 'Email' },
]

const SUPER_ADMIN_ITEMS: { to: string; icon: React.ElementType; label: string; end?: boolean }[] = [
  { to: '/admin/admins', icon: ShieldCheckIcon, label: 'Admins' },
]

function SidebarContent({
  allItems,
  onNav,
}: {
  allItems: { to: string; icon: React.ElementType; label: string; end?: boolean }[]
  onNav?: () => void
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3730a3] text-[11px] font-bold text-white">
          A
        </div>
        <span className="text-sm font-semibold text-gray-900">Admin</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {allItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNav}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                isActive
                  ? 'font-semibold text-[#3730a3]'
                  : 'font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 px-2 py-3">
        <NavLink
          to="/dashboard"
          onClick={onNav}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to App
        </NavLink>
      </div>
    </>
  )
}

export function AdminShell() {
  const role = useAuthStore((s) => s.userRole)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  const isSuperAdmin = role === 'SUPER_ADMIN'
  const allItems = isSuperAdmin ? [...NAV_ITEMS, ...SUPER_ADMIN_ITEMS] : NAV_ITEMS

  return (
    <div className="flex h-screen bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden w-[180px] shrink-0 flex-col border-r border-gray-100 bg-white sm:flex">
        <SidebarContent allItems={allItems} />
      </aside>

      {/* Mobile backdrop + drawer */}
      {mobileOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 sm:hidden"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/30" />
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <aside
            role="dialog"
            className="relative flex h-full w-[220px] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <SidebarContent allItems={allItems} onNav={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 sm:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900">Admin</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
