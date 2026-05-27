import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { clearDemoProfile, PLAN_DETAILS, useDemoProfile } from '@/lib/demo-profile'
import { useLiraWidget } from '@/lib/demo-widget'

/**
 * Nimbus Help Center, the SDK full-page support surface.
 *
 * The Nimbus route owns the page shell, account context, and ticket/sidebar
 * layout. Lira owns the embedded support runtime inside #nimbus-support-root.
 * This mirrors the B2B integration model we want customers to use on their own
 * `company.com/support` route.
 */

const SUPPORT_ROOT_SELECTOR = '#nimbus-support-root'

const OPEN_TICKETS = [
  { id: 'NIM-1048', title: 'Invoice export questions', status: 'Waiting on customer' },
  { id: 'NIM-1042', title: 'QuickBooks sync review', status: 'Solved' },
  { id: 'NIM-1037', title: 'Billing owner changed', status: 'Solved' },
] as const

export function DemoHelpPage() {
  const profile = useDemoProfile()
  const navigate = useNavigate()

  useLiraWidget({ mode: 'fullscreen', target: SUPPORT_ROOT_SELECTOR, enabled: Boolean(profile) })

  useEffect(() => {
    if (!profile) {
      if (window.location.hostname === 'demo.liraintelligence.com') {
        window.location.replace('https://liraintelligence.com/')
        return
      }
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  if (!profile) return null

  const plan = PLAN_DETAILS[profile.plan]

  const handleSignOut = () => {
    clearDemoProfile()
    if (window.location.hostname === 'demo.liraintelligence.com') {
      window.location.replace('https://liraintelligence.com/')
      return
    }
    navigate('/', { replace: true })
  }

  return (
    <div
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}
      className="min-h-screen bg-slate-100 text-slate-950"
    >
      <SEO
        title="Nimbus Help Center"
        description="Nimbus help center powered by the Lira full-page support SDK."
        path="/demo/help"
        noIndex
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <a
              href="/demo"
              className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-slate-950 text-white"
              aria-label="Back to Nimbus"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </a>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-semibold tracking-tight text-slate-950">
                  Nimbus Help Center
                </h1>
                <span className="hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 sm:inline">
                  SDK embed
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Native support page, powered by Lira inside Nimbus.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <a
              href="/demo"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950"
            >
              Widget demo
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg bg-slate-950 px-3 py-1.5 font-medium text-white transition hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-900 px-5 py-3 text-white lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            <span className="font-medium">Nimbus is fictional.</span>
            <span className="text-slate-300">
              This page demonstrates a customer-owned support route using Lira infrastructure.
            </span>
          </div>
          <span className="text-xs text-slate-300">No external portal redirect required.</span>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <section className="min-w-0">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <ContextCard label="Customer" value={profile.name} detail={profile.card.brand} />
            <ContextCard label="Plan" value={plan.label} detail={`$${plan.price}/mo`} />
            <ContextCard
              label="Next invoice"
              value={profile.next_invoice_date}
              detail={`Last invoice $${profile.last_invoice_amount_usd}`}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">Ask Nimbus Support</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Same Lira runtime as the widget, mounted as a full support page.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                Live
              </span>
            </div>
            <div
              id="nimbus-support-root"
              className="h-[calc(100vh-330px)] min-h-[680px] bg-white"
              aria-label="Nimbus support conversation"
            />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-950">Your tickets</h2>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                Demo
              </span>
            </div>
            <div className="mt-3 divide-y divide-slate-100">
              {OPEN_TICKETS.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  className="block w-full py-3 text-left transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-slate-400">
                      {ticket.id}
                    </span>
                    <span className="text-[11px] text-slate-500">{ticket.status}</span>
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{ticket.title}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">What Lira knows</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <MetaRow label="Account" value={profile.name} />
              <MetaRow label="Seats" value={`${profile.team_seats}`} />
              <MetaRow label="Card" value={`${profile.card.brand} ending ${profile.card.last4}`} />
              <MetaRow label="Status" value={profile.subscription_status} />
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">Try these</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <PromptText>What plan am I on?</PromptText>
              <PromptText>Compare the Nimbus plans in a simple table.</PromptText>
              <PromptText>Change my card to a Mastercard ending in 1234, expires 12/30</PromptText>
            </div>
          </section>
        </aside>
      </main>
    </div>
  )
}

function ContextCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-slate-950">{value}</div>
      <div className="mt-0.5 truncate text-xs text-slate-500">{detail}</div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  )
}

function PromptText({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-[12px] leading-5 text-slate-700">
      {children}
    </div>
  )
}
