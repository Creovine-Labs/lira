import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  ShieldCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import { adminListAdmins, adminListUsers, adminPromoteUser, adminDemoteUser } from '@/services/api'
import type { AdminUser } from '@/services/api'
import { useAuthStore } from '@/app/store'

export function AdminManagementPage() {
  const role = useAuthStore((s) => s.userRole)
  const userId = useAuthStore((s) => s.userId)

  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<AdminUser[]>([])
  const [searching, setSearching] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await adminListAdmins()
      setAdmins(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  if (role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!search.trim()) return
    setSearching(true)
    try {
      const users = await adminListUsers(search.trim())
      // Filter out already-admin users
      const adminIds = new Set(admins.map((a) => a.id))
      setSearchResults(users.filter((u) => !adminIds.has(u.id) && u.role === 'USER'))
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  async function handlePromote(user: AdminUser) {
    setActionLoading(user.id)
    try {
      await adminPromoteUser(user.id)
      setAdmins((prev) => [...prev, { ...user, role: 'ADMIN' }])
      setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDemote(adminUser: AdminUser) {
    if (adminUser.role === 'SUPER_ADMIN') return
    if (adminUser.id === userId) return
    setActionLoading(adminUser.id)
    try {
      await adminDemoteUser(adminUser.id)
      setAdmins((prev) => prev.filter((a) => a.id !== adminUser.id))
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Admin Management</h1>
      <p className="mt-1 text-sm text-slate-500">
        Manage platform admins. Only super-admins can access this.
      </p>

      {/* Current admins */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-medium text-slate-700">Current Admins</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon
                    className={`h-5 w-5 ${
                      admin.role === 'SUPER_ADMIN' ? 'text-purple-500' : 'text-indigo-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {admin.name || admin.email}
                    </p>
                    <p className="text-xs text-slate-500">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      admin.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {admin.role}
                  </span>
                  {admin.role === 'ADMIN' && admin.id !== userId && (
                    <button
                      onClick={() => handleDemote(admin)}
                      disabled={actionLoading === admin.id}
                      className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Demote to USER"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add new admin */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Add Admin</h2>
        <p className="mt-1 text-xs text-slate-400">Search for a user to promote to ADMIN</p>

        <form onSubmit={handleSearch} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="mt-3 divide-y divide-slate-50 rounded-lg border border-slate-100">
            {searchResults.map((user) => (
              <li key={user.id} className="flex items-center justify-between px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">{user.name || user.email}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={() => handlePromote(user)}
                  disabled={actionLoading === user.id}
                  className="flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                >
                  <ArrowUpIcon className="h-3 w-3" />
                  Promote
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
