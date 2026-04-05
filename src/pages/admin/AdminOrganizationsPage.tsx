import { useEffect, useState } from 'react'
import { adminListOrganizations, adminGetOrganization } from '@/services/api'
import type { AdminOrgItem, AdminOrgDetail } from '@/services/api'

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
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 text-xs text-slate-500">
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
      // ignore
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Organizations</h1>
      <p className="mt-1 text-sm text-slate-500">{orgs.length} total organizations</p>

      <div className="mt-6 flex gap-6">
        {/* Orgs table */}
        <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 font-medium text-slate-600">Organization</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Owner</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Members</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Usage</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map((org) => {
                  const totalUsed = Object.values(org.usage).reduce((a, b) => a + b, 0)
                  const totalLimit = Object.values(org.limits).reduce((a, b) => a + b, 0)
                  const overallPct = totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0

                  return (
                    <tr
                      key={org.org_id}
                      onClick={() => handleSelect(org.org_id)}
                      className={`cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50 ${
                        selected?.org_id === org.org_id ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{org.name}</p>
                        {org.industry && <p className="text-xs text-slate-400">{org.industry}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{org.owner_email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{org.member_count}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            overallPct >= 80
                              ? 'bg-red-100 text-red-700'
                              : overallPct >= 50
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {overallPct}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {org.created_at ? new Date(org.created_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
                {orgs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400">
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
          <div className="w-80 shrink-0 rounded-xl border border-slate-200 bg-white p-5">
            {detailLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{selected.name}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Close
                  </button>
                </div>
                {selected.industry && (
                  <p className="mt-1 text-sm text-slate-500">{selected.industry}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Invite: <code className="rounded bg-slate-100 px-1">{selected.invite_code}</code>
                </p>

                {/* Usage breakdown */}
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Beta Usage
                  </h4>
                  <div className="mt-3 space-y-3">
                    {USAGE_KEYS.map(({ key, label }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs text-slate-600">
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
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    Members ({selected.members.length})
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {selected.members.map((m) => (
                      <li key={m.user_id} className="rounded-lg border border-slate-100 px-3 py-2">
                        <p className="text-sm font-medium text-slate-700">
                          {m.name || m.email || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400">
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
