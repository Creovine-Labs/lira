import { useEffect } from 'react'
import { env } from '@/env'

/**
 * Nimbus — a fake SaaS landing page we use to demo the Lira support widget
 * on a neutral-looking site. Lives at /demo (and, once DNS is configured,
 * at demo.liraintelligence.com).
 *
 * The widget is loaded from the public CDN and uses data-org-id to identify
 * the demo org in production. Order of precedence for the org id:
 *   1. ?org=<id> query param (lets you point it at any org for live demos)
 *   2. VITE_DEMO_ORG_ID env var (set in Vercel)
 *   3. Hard-coded fallback (update after you create a demo org)
 */

const WIDGET_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const WIDGET_SCRIPT_ID = 'lira-support-widget'
const FALLBACK_ORG_ID = 'demo-org-replace-me'

function resolveOrgId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('org')
    if (fromQuery) return fromQuery
  }
  const fromEnv = (env as unknown as Record<string, string | undefined>).VITE_DEMO_ORG_ID
  if (fromEnv) return fromEnv
  return FALLBACK_ORG_ID
}

function useLiraWidget(): void {
  useEffect(() => {
    const orgId = resolveOrgId()

    // Remove any existing widget instance (guards HMR + repeated navigations)
    const existing = document.getElementById(WIDGET_SCRIPT_ID)
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = WIDGET_SCRIPT_ID
    script.src = WIDGET_SRC
    script.async = true
    script.setAttribute('data-org-id', orgId)
    script.setAttribute('data-position', 'bottom-right')
    document.body.appendChild(script)

    return () => {
      script.remove()
      // Also remove the mounted widget host if present
      document.querySelectorAll('[id^="lira-widget"]').forEach((el) => el.remove())
    }
  }, [])
}

const FEATURES = [
  {
    title: 'Invoices that get paid in days, not weeks.',
    body: 'Automatic reminders, one-click payment links, and recurring billing — built for the teams your accountant actually likes working with.',
  },
  {
    title: 'Expenses without the spreadsheet tax.',
    body: 'Snap a receipt, tag the project, done. Everything is reconciled nightly and ready for month-end.',
  },
  {
    title: 'Reporting your CFO will screenshot.',
    body: 'Cash flow, runway, and MRR surfaced in plain English. No pivot tables required.',
  },
]

const LOGOS = ['Arcadia', 'Northwind', 'Kite & Co', 'Halcyon', 'Foxglove', 'Lumen Studio']

export function DemoSitePage() {
  useLiraWidget()

  return (
    <div
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}
      className="min-h-screen bg-[#fafaf7] text-slate-900"
    >
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2 text-slate-900">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              className="h-6 w-6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A5.5 5.5 0 0 1 19 16H4z" />
            </svg>
            <span className="text-lg font-bold tracking-tight">Nimbus</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#product" className="hover:text-slate-900">
              Product
            </a>
            <a href="#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <a href="#customers" className="hover:text-slate-900">
              Customers
            </a>
            <a href="#help" className="hover:text-slate-900">
              Help
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="hidden md:inline text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Log in
            </a>
            <a
              href="#pricing"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Start free
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="px-6 pt-24 pb-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            New — AI support agent available 24/7
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Finance software your team will <em className="italic">actually</em> open on Monday.
          </h1>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
            Nimbus is the invoicing, expense, and reporting platform for 10–200 person teams that
            have outgrown spreadsheets but aren't ready for SAP.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#pricing"
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Start 14-day free trial
            </a>
            <a
              href="#help"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Watch 2-min demo
            </a>
          </div>
          <p className="mt-5 text-xs text-slate-500">
            No credit card · Cancel anytime · SOC 2 Type II
          </p>
        </div>

        {/* Fake product mockup */}
        <div className="mx-auto mt-16 max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/5 overflow-hidden">
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="ml-3 text-xs font-medium text-slate-500">app.nimbus.finance</span>
          </div>
          <div className="grid grid-cols-12 text-left">
            <aside className="col-span-3 border-r border-slate-100 p-4 space-y-1 text-sm">
              {['Dashboard', 'Invoices', 'Expenses', 'Reports', 'Team', 'Settings'].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`px-3 py-2 rounded-lg ${
                      i === 0 ? 'bg-slate-900 text-white' : 'text-slate-600'
                    }`}
                  >
                    {item}
                  </div>
                )
              )}
            </aside>
            <main className="col-span-9 p-6">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                This month
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-4">
                {[
                  { label: 'Invoiced', value: '$128,410' },
                  { label: 'Collected', value: '$94,220' },
                  { label: 'Outstanding', value: '$34,190' },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-slate-200 p-4 bg-slate-50/50"
                  >
                    <p className="text-xs font-medium text-slate-500">{s.label}</p>
                    <p className="mt-1 text-xl font-bold text-slate-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl border border-slate-200">
                <div className="px-4 py-3 border-b border-slate-100 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Recent invoices
                </div>
                {[
                  ['Arcadia Studios', '#INV-0212', '$4,200', 'Paid'],
                  ['Northwind Labs', '#INV-0211', '$12,800', 'Due Apr 24'],
                  ['Kite & Co', '#INV-0210', '$6,450', 'Overdue'],
                ].map(([name, inv, amount, status]) => (
                  <div
                    key={inv}
                    className="flex items-center justify-between px-4 py-3 border-b border-slate-100 last:border-0 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900">{name}</span>
                      <span className="text-xs text-slate-500">{inv}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-700">{amount}</span>
                      <span
                        className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                          status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : status === 'Overdue'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </main>
          </div>
        </div>
      </section>

      {/* ── Logo strip ──────────────────────────────────────────────────── */}
      <section className="px-6 py-12 border-y border-slate-200 bg-white">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
          Trusted by forward-thinking teams
        </p>
        <div className="mx-auto mt-6 max-w-5xl flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-slate-400">
          {LOGOS.map((logo) => (
            <span key={logo} className="text-lg font-bold tracking-tight">
              {logo}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="product" className="px-6 py-24">
        <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="h-5 w-5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl md:text-4xl font-bold tracking-tight">
            Simple pricing. No seat tax.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: 'Starter', price: '$19', seats: 'Up to 3 users' },
              { name: 'Growth', price: '$49', seats: 'Up to 15 users', highlight: true },
              { name: 'Business', price: '$129', seats: 'Unlimited users' },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-2xl p-8 ${
                  tier.highlight
                    ? 'bg-slate-900 text-white shadow-xl'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <p className="text-sm font-semibold uppercase tracking-widest opacity-70">
                  {tier.name}
                </p>
                <p className="mt-4 text-4xl font-bold">
                  {tier.price}
                  <span className="text-base font-normal opacity-60"> / mo</span>
                </p>
                <p className="mt-1 text-sm opacity-70">{tier.seats}</p>
                <a
                  href="#help"
                  className={`mt-6 block text-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tier.highlight
                      ? 'bg-white text-slate-900 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-700'
                  }`}
                >
                  Start free
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Help / CTA ──────────────────────────────────────────────────── */}
      <section id="help" className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Questions? Our AI assistant is online right now.
          </h2>
          <p className="mt-5 text-slate-600 leading-relaxed">
            Click the chat bubble in the bottom-right corner. Ask anything about invoicing,
            expenses, pricing, or account setup — you'll get answers in seconds, any hour of the
            day.
          </p>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Support online — avg. first reply under 3s
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer id="customers" className="px-6 py-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Nimbus — a demonstration site for{' '}
            <a href="https://liraintelligence.com" className="underline hover:text-slate-900">
              Lira AI
            </a>
            . No real product, no real users.
          </div>
          <div className="flex items-center gap-4">
            <a href="#top" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="#top" className="hover:text-slate-900">
              Terms
            </a>
            <a href="#top" className="hover:text-slate-900">
              Status
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
