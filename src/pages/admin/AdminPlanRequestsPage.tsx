import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib'
import {
  adminListPlanRequests,
  adminDecidePlanRequest,
  type AdminPlanChangeRequest,
} from '@/services/api'

const STATUS_FILTERS = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const

const STATUS_STYLES: Record<AdminPlanChangeRequest['status'], string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 ring-gray-200',
}

/**
 * Plan change requests — the approval queue for customer-initiated
 * upgrades/downgrades. Approval applies the plan tier + limits to the
 * tenant/org immediately (downgrades defer limit cuts to the next monthly
 * usage reset). Billing is settled manually until Paddle automation lands.
 */
export function AdminPlanRequestsPage() {
  const [requests, setRequests] = useState<AdminPlanChangeRequest[]>([])
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('PENDING')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminListPlanRequests(status)
      setRequests(res.requests)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load plan requests')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const decide = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id)
    try {
      await adminDecidePlanRequest(id, decision)
      toast.success(decision === 'approve' ? 'Plan change applied' : 'Request rejected')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${decision} request`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Plan requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Customer-initiated plan changes. Approving applies the tier and limits — settle billing
          manually until Paddle automation is live. Downgrade limits take effect at the org's next
          monthly usage reset.
        </p>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              status === s
                ? 'bg-gray-900 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            )}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#3730a3]" />
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center text-sm text-gray-500">
          No {status.toLowerCase()} plan requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Change</th>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Requested</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {r.fromTier} → {r.toTier}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-600">{r.orgId}</span>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-gray-500">
                    {r.note ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                        STATUS_STYLES[r.status]
                      )}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === 'PENDING' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, 'reject')}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          disabled={busyId === r.id}
                          onClick={() => decide(r.id, 'approve')}
                          className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {r.decidedAt ? new Date(r.decidedAt).toLocaleDateString() : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
