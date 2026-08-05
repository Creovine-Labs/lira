import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { getViewMode, setViewMode, type LiraKeyMode } from '@/services/api/support-api'
import { GoLiveModal } from '@/components/settings/GoLiveModal'
import { cn } from '@/lib'

/**
 * Survives the reloads below so the confirmation is still shown once the
 * dashboard comes back up in the new mode.
 */
const WENT_LIVE_FLAG = 'lira:went-live'
const MODE_SWITCHED_FLAG = 'lira:mode-switched'

/**
 * Topbar mode switch.
 *
 * An org is no longer "sandbox OR production" — test and live keys are valid
 * at the same time, so the same workspace can be serving real customers while
 * a staging integration keeps sending test traffic. This control does the two
 * things that follow from that:
 *
 *   1. picks which set of data the dashboard shows (inbox, tickets, analytics
 *      and the dashboard counts all follow it), and
 *   2. is still the shortcut for going live, since an org that has never gone
 *      live has no live traffic to look at.
 *
 * The view is a local preference (localStorage), not org state — two teammates
 * can look at different modes at once, which is the point.
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
  const orgIsLive = config?.environment === 'production'
  // No explicit choice yet: show the mode the org itself is in.
  const viewMode: LiraKeyMode = getViewMode() ?? (orgIsLive ? 'live' : 'test')

  // Toasts for the far side of the reloads below. Deferred a tick because
  // sonner drops toasts published before its <Toaster/> (an ancestor, so it
  // subscribes after this effect) has mounted.
  useEffect(() => {
    const wentLive = sessionStorage.getItem(WENT_LIVE_FLAG) === '1'
    const switched = sessionStorage.getItem(MODE_SWITCHED_FLAG)
    if (!wentLive && !switched) return
    sessionStorage.removeItem(WENT_LIVE_FLAG)
    sessionStorage.removeItem(MODE_SWITCHED_FLAG)
    const t = setTimeout(() => {
      if (wentLive) {
        toast.success(
          "You're live — your plan's limits now apply and your billing period has started."
        )
      } else if (switched === 'test') {
        toast.success('Viewing test — traffic from your test keys.')
      } else {
        toast.success('Viewing live — traffic from your live keys.')
      }
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

  const switchView = (next: LiraKeyMode) => {
    setOpen(false)
    if (next === viewMode) return
    setViewMode(next)
    sessionStorage.setItem(MODE_SWITCHED_FLAG, next)
    // Conversations, tickets, analytics and the dashboard counts are all
    // scoped to the mode, and most of it lives in per-page state. A reload is
    // the honest way to swap the whole view at once.
    window.location.reload()
  }

  const goProduction = async (ctx?: { paid?: boolean }) => {
    if (!currentOrgId) return
    setBusy(true)
    // Paddle's checkout.completed fires before its subscription webhook is
    // guaranteed to have reached us, so an org that just paid can still look
    // unsubscribed to the backend's billing check. Retry briefly rather than
    // bouncing the user back into a checkout they already completed.
    const attempts = ctx?.paid ? 4 : 1
    try {
      for (let attempt = 0; attempt < attempts; attempt++) {
        try {
          await updateConfig(currentOrgId, { environment: 'production' })
          // Going live means live data is the interesting view.
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
      if (err instanceof Error && err.message.startsWith('402')) {
        // The backend is the billing authority — let its 402 put the modal
        // into checkout mode instead of re-deriving plan rules here.
        setRequiresPayment(true)
      }
      toast.error(
        err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Failed to switch environment'
      )
    } finally {
      setBusy(false)
    }
  }

  if (!config?.activated) return null

  const showingTest = viewMode === 'test'

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          title={
            showingTest
              ? 'Viewing TEST data — traffic from your test keys. Real sends are suppressed.'
              : 'Viewing LIVE data — traffic from your real customers.'
          }
          className={cn(
            'flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider transition',
            showingTest
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          )}
        >
          {showingTest ? 'VIEWING: TEST' : 'VIEWING: LIVE'}
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
            className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Viewing — which data this dashboard shows
            </p>

            <button
              type="button"
              role="menuitem"
              onClick={() => switchView('test')}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Test</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Traffic from your <span className="font-mono">lira_*_test_</span> keys. Real
                  emails, Slack, Linear and webhooks are suppressed, and it never touches your
                  plan&apos;s quota.
                </p>
              </div>
              {showingTest && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => switchView('live')}
              className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Live</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Traffic from your <span className="font-mono">lira_*_live_</span> keys — your real
                  customers.
                </p>
              </div>
              {!showingTest && <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />}
            </button>

            <div className="my-1 border-t border-gray-100" />
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Workspace — {orgIsLive ? 'live' : 'test mode only'}
            </p>

            {orgIsLive ? (
              <NavLink
                to="/settings"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
              >
                API keys &amp; environment settings
              </NavLink>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => {
                    setOpen(false)
                    setRequiresPayment(false)
                    setGoLiveOpen(true)
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left transition hover:bg-gray-50 disabled:opacity-60"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">Go live</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Turn on real sends for live-key traffic, apply your plan&apos;s limits and
                      start billing. Test keys keep working exactly as they do now.
                    </p>
                  </div>
                </button>
                <NavLink
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-xs text-gray-500 transition hover:bg-gray-50 hover:text-gray-700"
                >
                  API keys &amp; environment settings
                </NavLink>
              </>
            )}
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
