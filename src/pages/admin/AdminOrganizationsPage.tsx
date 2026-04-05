import { useEffect, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { adminListOrganizations, adminGetOrganization } from '@/services/api'
import type { AdminOrgItem, AdminOrgDetail } from '@/services/api'
import { cn } from '@/lib'

const USAGE_KEYS = [
  { key: 'meetings', label: 'Meetings' },
  { key: 'meeting_minutes', label: 'Minutes' },
  { key: 'interviews', label: 'Interviews' },
  { key: 'interview_evaluations', label: 'Evaluations' },
  { key: 'ai_tasks', label: 'AI Tasks' },
  { key: 'documents', label: 'Documents' },
  { key: 'knowledge_pages', label: 'KB Pages' },
]

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-[#3730a3]'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs text-gray-400">
        {used}/{limit}
      </span>
    </div>
  )
}

export function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AdminOrgDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    adminListOrganizations()
      .then(setOrgs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSelect(orgId: string) {
    setDetailLoading(true)
    try {
      const detail = await adminGetOrganization(orgId)
      setSelected(detail)
    } catch {
      /* ignore */
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-lg font-semibold text-gray-900">Organizations</h1>
      <p className="mt-0.5 text-sm text-gray-400">{orgs.length} organizations</p>

      <div className="mt-5 flex flex-col gap-5 lg:flex-row">
        {/* Orgs table */}
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
                    Organization
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 sm:table-cell">
                    Owner
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    Members
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                    Usage
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400 md:table-cell">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orgs.map((org) => {
                  const totalUsed = Object.values(org.usage).reduce((a, b) => a + b, 0)
                  const totalLimit = Object.values(org.limits).reduce((a, b) => a + b, 0)
                  const overallPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0

                  return (
                    <tr
                      key={org.org_id}
                      onClick={() => handleSelect(org.org_id)}
                      className={cn(
                        'cursor-pointer transition-colors hover:bg-gray-50',
                        selected?.org_id === org.org_id && 'bg-[#3730a3]/[0.03]'
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{org.name}</p>
                        {org.industry && <p className="text-xs text-gray-400">{org.industry}</p>}
                      </td>
                      <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">
                        {org.owner_email ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{org.member_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            overallPct >= 80
                              ? 'bg-red-100 text-red-700'
                              : overallPct >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          )}
                        >
                          {overallPct}%
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-400 md:table-cell">
                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-400">
                      No organizations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Org detail panel */}
        {selected && (
          <div className="w-full shrink-0 rounded-2xl border border-white/60 bg-white p-5 shadow-sm lg:w-80">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#3730a3]" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                {selected.industry && (
                  <p className="mt-1 text-sm text-gray-500">{selected.industry}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  Invite:{' '}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px]">
                    {selected.invite_code}
                  </code>
                </p>

                {/* Usage breakdown */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Beta Usage
                  </p>
                  <div className="mt-3 space-y-3">
                    {USAGE_KEYS.map(({ key, label }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>{label}</span>
                          <span className="font-medium">
                            {Math.round(
                              ((selected.usage[key] ?? 0) / (selected.limits[key] ?? 1)) * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="mt-1">
                          <UsageBar
                            used={selected.usage[key] ?? 0}
                            limit={selected.limits[key] ?? 0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Members */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Members ({selected.members.length})
                  </p>
                  <ul className="mt-2 space-y-2">
                    {selected.members.map((m) => (
                      <li key={m.user_id} className="rounded-xl border border-gray-100 px-3 py-2">
                        <p className="text-sm font-medium text-gray-700">
                          {m.name || m.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {m.role} · {m.emailVerified ? 'verified' : 'unverified'}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
