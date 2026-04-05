import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  TrashIcon,
  CheckBadgeIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { adminListUsers, adminDeleteUser, adminGetUser } from '@/services/api'
import type { AdminUser, AdminUserDetail } from '@/services/api'
import { cn } from '@/lib'

const FILTER_LABELS: Record<string, string> = {
  recent_7d: 'New (last 7 days)',
  verified: 'Verified users',
  unverified: 'Unverified users',
}

export function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filterParam = searchParams.get('filter') ?? undefined

  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(
    async (q?: string) => {
      setLoading(true)
      try {
        const data = await adminListUsers(q, filterParam)
        setUsers(data)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    },
    [filterParam]
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers(search.trim() || undefined)
  }

  function clearFilter() {
    setSearchParams({})
  }

  async function handleViewDetail(userId: string) {
    setDetailLoading(true)
    try {
      const detail = await adminGetUser(userId)
      setSelectedUser(detail)
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false)
    }
  }

  async function handleDelete(userId: string) {
    setDeleting(true)
    try {
      await adminDeleteUser(userId)
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setDeleteConfirm(null)
      if (selectedUser?.id === userId) setSelectedUser(null)
    } catch {
      /* ignore */
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="px-6 py-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="mt-0.5 text-sm text-gray-400">{users.length} users</p>
        </div>
      </div>

      {/* Active filter chip */}
      {filterParam && (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3730a3]/20 bg-[#3730a3]/5 px-3 py-1 text-xs font-semibold text-[#3730a3]">
            {FILTER_LABELS[filterParam] ?? filterParam}
            <button onClick={clearFilter} className="hover:text-[#312e81]">
              <XMarkIcon className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Search */}
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
          className="rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81]"
        >
          Search
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row">
        {/* Users table */}
        <div className="flex-1 overflow-x-auto rounded-2xl border border-white/60 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#3730a3]" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    User
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 sm:table-cell">
                    Role
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 md:table-cell">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 md:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-gray-400">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleViewDetail(u.id)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-gray-50',
                      selectedUser?.id === u.id && 'bg-[#3730a3]/[0.03]'
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="truncate font-medium text-gray-900">{u.name || '—'}</p>
                      <p className="truncate text-xs text-gray-400">{u.email}</p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={cn(
                          'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'ADMIN'
                              ? 'bg-[#3730a3]/10 text-[#3730a3]'
                              : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {u.emailVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckBadgeIcon className="h-4 w-4" />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-500">
                          <XCircleIcon className="h-4 w-4" />
                          Unverified
                        </span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-400 md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'SUPER_ADMIN' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(u.id)
                          }}
                          className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
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
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
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
          <div className="w-full shrink-0 rounded-2xl border border-white/60 bg-white p-5 shadow-sm lg:w-80">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#3730a3]" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{selectedUser.name || 'No Name'}</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-500">{selectedUser.email}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      selectedUser.role === 'SUPER_ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : selectedUser.role === 'ADMIN'
                          ? 'bg-[#3730a3]/10 text-[#3730a3]'
                          : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {selectedUser.role}
                  </span>
                  {selectedUser.emailVerified ? (
                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      Unverified
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs text-gray-400">
                  Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                </p>

                {/* Organizations */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Organizations
                  </p>
                  {selectedUser.organizations.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-400">No organizations</p>
                  ) : (
                    <ul className="mt-2 space-y-2">
                      {selectedUser.organizations.map((org) => (
                        <li
                          key={org.org_id}
                          className="rounded-xl border border-gray-100 px-3 py-2"
                        >
                          <p className="text-sm font-medium text-gray-700">{org.org_name}</p>
                          <p className="text-xs text-gray-400">
                            {org.role} · joined{' '}
                            {org.joined_at ? new Date(org.joined_at).toLocaleDateString() : '—'}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Delete action */}
                {selectedUser.role !== 'SUPER_ADMIN' && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <button
                      onClick={() => setDeleteConfirm(selectedUser.id)}
                      className="flex items-center gap-2 text-sm text-red-500 transition hover:text-red-600"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete this user
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-gray-900">Delete User</h3>
            <p className="mt-2 text-sm text-gray-500">
              This will permanently delete the user and remove them from all organizations. This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
