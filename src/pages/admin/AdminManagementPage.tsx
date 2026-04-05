import { useEffect, useState, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { adminListAdmins, adminListUsers, adminPromoteUser, adminDemoteUser } from '@/services/api'
import type { AdminUser } from '@/services/api'
import { useAuthStore } from '@/app/store'
import { cn } from '@/lib'

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
      /* ignore */
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
      const adminIds = new Set(admins.map((a) => a.id))
      setSearchResults(users.filter((u) => !adminIds.has(u.id) && u.role === 'USER'))
    } catch {
      /* ignore */
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
      /* ignore */
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
      /* ignore */
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-lg font-semibold text-gray-900">Admin Management</h1>
      <p className="mt-0.5 text-sm text-gray-400">
        Manage platform admins. Only super-admins can access this.
      </p>

      {/* Current admins */}
      <div className="mt-5 max-w-2xl rounded-2xl border border-white/60 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900">Current Admins</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#3730a3]" />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
                      admin.role === 'SUPER_ADMIN' ? 'bg-purple-600' : 'bg-[#3730a3]'
                    )}
                  >
                    {(admin.name ?? admin.email ?? '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{admin.name || admin.email}</p>
                    <p className="text-xs text-gray-400">{admin.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      admin.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-[#3730a3]/10 text-[#3730a3]'
                    )}
                  >
                    {admin.role}
                  </span>
                  {admin.role === 'ADMIN' && admin.id !== userId && (
                    <button
                      onClick={() => handleDemote(admin)}
                      disabled={actionLoading === admin.id}
                      className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
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
      <div className="mt-5 max-w-2xl rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-gray-900">Add Admin</p>
        <p className="mt-0.5 text-xs text-gray-400">Search for a user to promote to ADMIN</p>

        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#3730a3]/30 focus:ring-2 focus:ring-[#3730a3]/10"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <ul className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100">
            {searchResults.map((user) => (
              <li key={user.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">{user.name || user.email}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
                <button
                  onClick={() => handlePromote(user)}
                  disabled={actionLoading === user.id}
                  className="flex items-center gap-1 rounded-xl bg-[#3730a3]/5 px-3 py-1.5 text-xs font-semibold text-[#3730a3] transition hover:bg-[#3730a3]/10 disabled:opacity-50"
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
