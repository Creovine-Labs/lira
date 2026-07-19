import { useEffect, useState } from 'react'
import { PlusIcon, XMarkIcon, TrashIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  adminListOrganizations,
  adminGetOrganization,
  adminDeleteOrganization,
  adminCreateOrgForUser,
} from '@/services/api'
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
  const [deleteTarget, setDeleteTarget] = useState<AdminOrgDetail | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [provisionOpen, setProvisionOpen] = useState(false)
  const [provisionEmail, setProvisionEmail] = useState('')
  const [provisionTenant, setProvisionTenant] = useState('')
  const [provisionName, setProvisionName] = useState('')
  const [provisioning, setProvisioning] = useState(false)

  async function handleProvision() {
    const email = provisionEmail.trim().toLowerCase()
    const name = provisionName.trim()
    if (!email || !name) {
      toast.error('Owner email and organization name are required')
      return
    }
    setProvisioning(true)
    try {
      const res = await adminCreateOrgForUser({
        owner_email: email,
        tenant_id: provisionTenant.trim() || undefined,
        name,
      })
      toast.success(`Provisioned ${res.organization.name} for ${res.owner.email}`)
      // Refresh the table so the new org shows up immediately
      const refreshed = await adminListOrganizations().catch(() => null)
      if (refreshed) setOrgs(refreshed)
      setProvisionOpen(false)
      setProvisionEmail('')
      setProvisionTenant('')
      setProvisionName('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to provision organization'
      // The backend surfaces AMBIGUOUS_OWNER when one email matches multiple
      // tenants — prompt for tenant_id explicitly when that happens.
      if (msg.includes('Multiple users') || msg.includes('AMBIGUOUS_OWNER')) {
        toast.error(
          'Multiple accounts share that email — paste the tenant ID into the field below.'
        )
      } else {
        toast.error(msg)
      }
    } finally {
      setProvisioning(false)
    }
  }

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

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminDeleteOrganization(deleteTarget.org_id)
      setOrgs((prev) => prev.filter((o) => o.org_id !== deleteTarget.org_id))
      setSelected(null)
      setDeleteTarget(null)
      toast.success('Organization deleted')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Could not delete organization'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Organizations</h1>
          <p className="mt-0.5 text-sm text-gray-400">{orgs.length} organizations</p>
        </div>
        <button
          onClick={() => setProvisionOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#312e81]"
        >
          <PlusIcon className="h-4 w-4" />
          Provision org for existing user
        </button>
      </div>

      {/* Provision modal — for spinning up a second/third org under a
          customer who already has an account. New customers should go
          through the concierge invite flow on the Invites page instead. */}
      {provisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/40"
            onClick={() => !provisioning && setProvisionOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Provision a new organization</h3>
            <p className="mt-1 text-sm text-gray-500">
              Creates a new Lira organization owned by an existing user. They'll see it appear in
              their org switcher. For brand-new customers, use the Invites page instead.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="prov-email"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Owner email
                </label>
                <input
                  id="prov-email"
                  type="email"
                  value={provisionEmail}
                  onChange={(e) => setProvisionEmail(e.target.value)}
                  disabled={provisioning}
                  placeholder="owner@company.com"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="prov-name"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Organization name
                </label>
                <input
                  id="prov-name"
                  type="text"
                  value={provisionName}
                  onChange={(e) => setProvisionName(e.target.value)}
                  disabled={provisioning}
                  placeholder="Acme Corp — EMEA"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                />
              </div>
              <div>
                <label
                  htmlFor="prov-tenant"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                >
                  Tenant ID{' '}
                  <span className="font-normal normal-case text-gray-400">(optional)</span>
                </label>
                <input
                  id="prov-tenant"
                  type="text"
                  value={provisionTenant}
                  onChange={(e) => setProvisionTenant(e.target.value)}
                  disabled={provisioning}
                  placeholder="Only needed if the email maps to multiple tenants"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setProvisionOpen(false)}
                disabled={provisioning}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProvision}
                disabled={provisioning || !provisionEmail.trim() || !provisionName.trim()}
                className="rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#312e81] disabled:opacity-50"
              >
                {provisioning ? 'Provisioning…' : 'Provision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            role="presentation"
            className="absolute inset-0 bg-black/40"
            onClick={() => !deleting && setDeleteTarget(null)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900">Delete Organization</h3>
            <p className="mt-2 text-sm text-gray-500">
              Permanently delete{' '}
              <span className="font-medium text-gray-900">{deleteTarget.name}</span> and all its
              data? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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

                {/* Organization ID — exists from creation (before support
                    activation); shown for direct backend/terminal lookups */}
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Organization ID
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selected.org_id)
                      toast.success('Organization ID copied')
                    }}
                    title="Click to copy"
                    className="mt-2 w-full truncate rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-left font-mono text-xs text-gray-700 transition hover:border-gray-200 hover:bg-gray-100"
                  >
                    {selected.org_id}
                  </button>
                </div>

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

                {/* Delete action */}
                <div className="mt-5 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setDeleteTarget(selected)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete organization
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
