import { useEffect, useState, useCallback } from 'react'
import {
  MagnifyingGlassIcon,
  TrashIcon,
  CheckBadgeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import { adminListUsers, adminDeleteUser, adminGetUser } from '@/services/api'
import type { AdminUser, AdminUserDetail } from '@/services/api'
import { useAuthStore } from '@/app/store'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const role = useAuthStore((s) => s.userRole)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true)
    try {
      const data = await adminListUsers(q)
      setUsers(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers(search.trim() || undefined)
  }

  async function handleViewDetail(userId: string) {
    setDetailLoading(true)
    try {
      const detail = await adminGetUser(userId)
      setSelectedUser(detail)
    } catch {
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleDelete(userId: string) {
    try {
      await adminDeleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setDeleteConfirm(null)
      if (selectedUser?.id === userId) setSelectedUser(null)
    } catch {
      // ignore
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">{users.length} total users</p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mt-4 flex gap-2">
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
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="mt-6 flex gap-6">
        {/* Users table */}
        <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-600">User</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Role</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Verified</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Joined</th>
                  <th className="px-4 py-3 font-medium text-slate-600" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleViewDetail(u.id)}
                    className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                      selectedUser?.id === u.id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{u.name || '—'}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'ADMIN'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.emailVerified ? (
                        <CheckBadgeIcon className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircleIcon className="h-5 w-5 text-amber-400" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {isSuperAdmin && u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(u.id)
                          }}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete user"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* User detail panel */}
        {selectedUser && (
          <div className="w-80 shrink-0 rounded-xl border border-slate-200 bg-white p-5">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{selectedUser.name || 'No Name'}</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                <p className="mt-1 text-sm text-slate-500">{selectedUser.email}</p>
                <div className="mt-3 flex gap-2">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      selectedUser.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : selectedUser.role === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedUser.role}
                  </span>
                  {selectedUser.emailVerified ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>

                {/* Organizations */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Organizations
                  </h4>
                  {selectedUser.organizations.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">No organizations</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selectedUser.organizations.map((org) => (
                        <li
                          key={org.org_id}
                          className="rounded-lg border border-slate-100 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-slate-700">{org.org_name}</p>
                          <p className="text-xs text-slate-400">
                            {org.role} · joined{' '}
                            {org.joined_at ? new Date(org.joined_at).toLocaleDateString() : '—'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="font-medium text-slate-900">Delete User</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently delete the user and remove them from all organizations. This
              cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
