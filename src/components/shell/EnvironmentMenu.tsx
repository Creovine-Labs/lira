import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { getViewMode, setViewMode, type LiraKeyMode } from '@/services/api/support-api'
import { GoLiveModal } from '@/components/settings/GoLiveModal'
import { cn } from '@/lib'

/** Survives the reload so the confirmation still shows on the far side. */
const WENT_LIVE_FLAG = 'lira:went-live'
const MODE_SWITCHED_FLAG = 'lira:mode-switched'

/**
 * Environment switch — Sandbox / Production.
 *
 * ONE control, the way Paystack, Stripe and Hyperswitch do it. An earlier
 * version split this into a "viewing" switch plus a separate Go live button,
 * because internally a workspace can hold sandbox and production traffic at
 * the same time (test and live keys are both valid). That is true, and it is
 * our problem, not the operator's: picking Production silently showed
 * production data on a workspace that had never paid, which reads as "I just
 * went live for free".
 *
 * So: picking Production on a workspace that hasn't gone live opens the go-live
 * flow (plan, price, payment) instead of switching. Once live, the same control
 * flips between the two environments' data — a live workspace can still look at
 * sandbox, which is what a team with a staging integration needs.
 */
export function EnvironmentMenu() {
  const { currentOrgId, organizations } = useOrgStore()
  const config = useSupportStore((s) => s.config)
  const updateConfig = useSupportStore((s) => s.updateConfig)

  const [open, setOpen] = useState(false)
  const [goLiveOpen, setGoLiveOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [requiresPayment, setRequiresPayment] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const orgName = organizations.find((o) => o.org_id === currentOrgId)?.name ?? ''
  const workspaceIsLive = config?.environment === 'production'
  // Before go-live there is only one environment to be in, so the control
  // always reads Sandbox — no way to appear in production without paying.
  const viewMode: LiraKeyMode = workspaceIsLive ? (getViewMode() ?? 'live') : 'test'
  const inSandbox = viewMode === 'test'

  // Toasts for the far side of the reloads below (sonner drops toasts
  // published before its <Toaster/> mounts, hence the delay).
  useEffect(() => {
    const wentLive = sessionStorage.getItem(WENT_LIVE_FLAG) === '1'
    const switched = sessionStorage.getItem(MODE_SWITCHED_FLAG)
    if (!wentLive && !switched) return
    sessionStorage.removeItem(WENT_LIVE_FLAG)
    sessionStorage.removeItem(MODE_SWITCHED_FLAG)
    const t = setTimeout(() => {
      if (wentLive) toast.success("You're live — real sends are on and billing has started.")
      else if (switched === 'test') toast.success('Showing sandbox data.')
      else toast.success('Showing production data.')
    }, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  const choose = (next: LiraKeyMode) => {
    setOpen(false)
    // Production is gated on going live. Paystack does the same: you cannot
    // switch to live until the account is activated.
    if (next === 'live' && !workspaceIsLive) {
      setRequiresPayment(false)
      setGoLiveOpen(true)
      return
    }
    if (next === viewMode) return
    setViewMode(next)
    sessionStorage.setItem(MODE_SWITCHED_FLAG, next)
    // Inbox, tickets, analytics and dashboard counts are all scoped to the
    // environment and mostly live in per-page state — reload to swap it all.
    window.location.reload()
  }

  const goProduction = async (ctx?: { paid?: boolean }) => {
    if (!currentOrgId) return
    setBusy(true)
    // Paddle's checkout.completed can beat its subscription webhook, so an org
    // that just paid may still look unsubscribed. Retry rather than bouncing
    // them back into a checkout they already completed.
    const attempts = ctx?.paid ? 4 : 1
    try {
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          await updateConfig(currentOrgId, { environment: 'production' })
          setViewMode('live')
          sessionStorage.setItem(WENT_LIVE_FLAG, '1')
          window.location.reload()
          return
        } catch (err) {
          const needsBilling = err instanceof Error && err.message.startsWith('402')
          if (needsBilling && attempt < attempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, 2500))
            continue
          }
          throw err
        }
      }
    } catch (err) {
      // The backend is the billing authority — its 402 puts the modal into
      // checkout mode rather than us re-deriving plan rules here.
      if (err instanceof Error && err.message.startsWith('402')) setRequiresPayment(true)
      toast.error(
        err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Could not switch environment'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!config?.activated) return null

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider transition',
            inSandbox
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          )}
        >
          {inSandbox ? 'SANDBOX' : 'PRODUCTION'}
          <ChevronDownIcon
            className={cn(
              'h-3 w-3 shrink-0 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => choose('test')}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50"
            >
              <span className="flex-1 font-medium text-gray-900">Sandbox</span>
              {inSandbox && <CheckIcon className="h-4 w-4 shrink-0 text-gray-500" />}
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => choose('live')}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-gray-50 disabled:opacity-60"
            >
              <span className="flex-1 font-medium text-gray-900">Production</span>
              {!workspaceIsLive ? (
                <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">
                  Go live
                </span>
              ) : (
                !inSandbox && <CheckIcon className="h-4 w-4 shrink-0 text-gray-500" />
              )}
            </button>
          </div>
        )}
      </div>

      {goLiveOpen && (
        <GoLiveModal
          orgName={orgName}
          orgId={currentOrgId ?? undefined}
          busy={busy}
          requiresPayment={requiresPayment}
          onConfirm={(ctx) => void goProduction(ctx)}
          onClose={() => setGoLiveOpen(false)}
        />
      )}
    </>
  )
}
