// Resolves whether the current user can export data for an org, so the UI can
// gate the export buttons WITHOUT relying on the backend 403 as the UX:
//
//   entitled       Scale/Enterprise/platform-owned + owner/admin → real export
//   upsell         owner/admin but Free/Pro → show lock + "Upgrade to Scale"
//   no-permission  not owner/admin → "Ask an org admin to export data"
//
// getMyPlan + listOrgMembers are fetched once per org and cached module-wide
// (with in-flight dedup) so placing the button on several pages costs one pair
// of requests per org, not per button.

import { useEffect, useState } from 'react'
import { getMyPlan, listOrgMembers, type OrgMembership } from '@/services/api'
import { useAuthStore } from '@/app/store'

export type ExportGate =
  | { status: 'loading' }
  | { status: 'entitled' }
  | { status: 'upsell'; tier: string }
  | { status: 'no-permission' }

const cache = new Map<string, ExportGate>()
const inflight = new Map<string, Promise<ExportGate>>()

async function resolveGate(orgId: string, userId: string | null): Promise<ExportGate> {
  const [plan, members] = await Promise.all([
    getMyPlan(orgId),
    listOrgMembers(orgId).catch(() => [] as OrgMembership[]),
  ])
  const me = userId ? members.find((m) => m.user_id === userId) : undefined
  // Mirror SettingsPage: unknown membership defaults to "can manage".
  const isAdmin = !me || me.role === 'owner' || me.role === 'admin'
  if (!isAdmin) return { status: 'no-permission' }
  const entitled = Boolean(
    plan.platformOwned || plan.billingExempt || plan.entitlements.advancedAnalytics
  )
  return entitled ? { status: 'entitled' } : { status: 'upsell', tier: plan.tier }
}

/** Clear the cached gate for an org (e.g. after a plan change). */
export function invalidateExportEntitlement(orgId: string): void {
  cache.delete(orgId)
  inflight.delete(orgId)
}

export function useExportEntitlement(orgId: string | null | undefined): ExportGate {
  const userId = useAuthStore((s) => s.userId)
  // The gate itself is DERIVED from the module cache on every render; the effect
  // only kicks off the fetch and forces a re-render when it resolves. This keeps
  // us clear of set-state-in-effect and never shows a stale org's entitlement.
  const [, bump] = useState(0)

  useEffect(() => {
    if (!orgId || cache.has(orgId)) return
    let active = true
    let promise = inflight.get(orgId)
    if (!promise) {
      promise = resolveGate(orgId, userId)
      inflight.set(orgId, promise)
    }
    promise
      .then((g) => {
        cache.set(orgId, g)
      })
      .catch(() => {
        // Plan fetch failed — fall back to allowing the attempt; the backend
        // gate is the safety net. (Error fallback, not the UX path.)
        cache.set(orgId, { status: 'entitled' })
      })
      .finally(() => {
        inflight.delete(orgId)
        if (active) bump((n) => n + 1)
      })
    return () => {
      active = false
    }
  }, [orgId, userId])

  if (!orgId) return { status: 'loading' }
  return cache.get(orgId) ?? { status: 'loading' }
}
