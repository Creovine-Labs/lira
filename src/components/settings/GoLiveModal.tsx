import { useEffect, useState } from 'react'
import { getMyPlan, type MyPlan, type PlanTier } from '@/services/api'

const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  FREE: 'Free',
  PRO: 'Pro',
  SCALE: 'Scale',
  ENTERPRISE: 'Enterprise',
}

/**
 * Go-live confirmation — going live is the commercial event (billing starts,
 * plan limits replace sandbox caps), so it requires typing the org name.
 *
 * Relocated from pages/support/SupportSettingsPage.tsx (which is no longer
 * routed) so the routed Settings surface can reuse it.
 */
export function GoLiveModal({
  orgName,
  busy,
  onConfirm,
  onClose,
}: {
  orgName: string
  busy: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  const [plan, setPlan] = useState<MyPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [typed, setTyped] = useState('')

  useEffect(() => {
    getMyPlan()
      .then(setPlan)
      .catch(() => setPlan(null))
      .finally(() => setPlanLoading(false))
  }, [])

  const nameMatches = typed.trim() === orgName.trim() && orgName.trim().length > 0
  const price =
    plan === null
      ? null
      : plan.entitlements.basePriceUsd === null
        ? 'Custom pricing'
        : `$${plan.entitlements.basePriceUsd}/mo`
  const included =
    plan === null
      ? null
      : plan.entitlements.includedConversationsPerMonth === 0
        ? 'Unlimited conversations'
        : `${plan.entitlements.includedConversationsPerMonth.toLocaleString()} conversations / mo included`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/40"
        onClick={() => !busy && onClose()}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">Go live</h3>
        <p className="mt-1 text-sm text-gray-500">
          Switch this workspace from sandbox to production.
        </p>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          {planLoading ? (
            <p className="text-sm text-gray-400">Loading your plan…</p>
          ) : plan ? (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {PLAN_TIER_LABELS[plan.tier]} plan
                {price ? <span className="ml-2 font-normal text-gray-500">{price}</span> : null}
              </p>
              {included && <p className="mt-0.5 text-xs text-gray-500">{included}</p>}
            </>
          ) : (
            <p className="text-sm text-gray-500">
              Plan details are unavailable right now — your invited plan applies when you go live.
            </p>
          )}
        </div>

        <p className="mt-3 text-sm text-gray-700">
          Going live starts your billing period. Sandbox testing limits are replaced by your
          plan&apos;s volume.
        </p>

        <div className="mt-4">
          <label
            htmlFor="golive-confirm-name"
            className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-500"
          >
            Type <span className="normal-case text-gray-900">{orgName}</span> to confirm
          </label>
          <input
            id="golive-confirm-name"
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            disabled={busy}
            placeholder={orgName}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#020308] focus:ring-2 focus:ring-[#020308]/10"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy || !nameMatches}
            className="rounded-xl bg-[#020308] px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {busy ? 'Going live…' : 'Go live'}
          </button>
        </div>
      </div>
    </div>
  )
}
