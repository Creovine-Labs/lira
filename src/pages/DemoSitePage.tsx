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
 *
 * The page intentionally contains a lot of plain-prose product documentation
 * (features, pricing, FAQ, security, refund policy, getting started, etc.)
 * so the Lira KB crawler has real substance to ingest when demoing against
 * a Nimbus organisation.
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
      document.querySelectorAll('[id^="lira-widget"]').forEach((el) => el.remove())
    }
  }, [])
}

const LOGOS = ['Arcadia', 'Northwind', 'Kite & Co', 'Halcyon', 'Foxglove', 'Lumen Studio']

const FEATURES = [
  {
    title: 'Invoices that get paid in days, not weeks',
    body: 'Create and send branded invoices in under a minute. Automatic payment reminders kick in at 3, 7, and 14 days overdue. Customers pay with one click via Stripe, ACH, or credit card. Track who has viewed each invoice, when, and from which city. Nimbus customers reduce average days-to-payment from 42 to 11.',
  },
  {
    title: 'Expenses without the spreadsheet tax',
    body: 'Snap a receipt, tag the project, assign to a client — done. Nimbus OCR extracts vendor, amount, date, and tax automatically. Mileage tracking runs in the background on iOS and Android. Everything reconciles nightly against your bank and credit card feeds.',
  },
  {
    title: 'Reporting your CFO will actually read',
    body: 'Cash flow, runway, MRR, and project profitability surfaced in plain English. Every chart has a "why did this change?" button that writes a plain-language summary. Export to PDF, CSV, or a live-updating Google Sheets link.',
  },
  {
    title: 'Recurring billing on autopilot',
    body: 'Subscriptions, retainers, milestone-based contracts — all in one place. Proration, dunning, and failed-payment recovery are automatic. Connect any payment processor: Stripe, Braintree, Paddle, or direct-debit via GoCardless.',
  },
  {
    title: 'Multi-currency from day one',
    body: 'Invoice in 136 currencies, get paid in any of them. Daily FX rates pulled from the European Central Bank. Automatic gain/loss journal entries on settlement. No more copy-pasting from xe.com.',
  },
  {
    title: 'Built for teams, not accountants',
    body: 'Your designers, project managers, and ops people can log expenses and mark invoices paid without anyone teaching them double-entry bookkeeping. Role-based permissions keep the general ledger locked down for the people who need it.',
  },
]

const INTEGRATIONS = [
  { name: 'Stripe', body: 'Accept cards, ACH, and Apple Pay. Payouts reconciled automatically.' },
  { name: 'QuickBooks Online', body: 'Two-way sync of invoices, payments, and chart of accounts.' },
  { name: 'Xero', body: 'Same as QuickBooks. Push nightly or trigger sync on every invoice.' },
  { name: 'Slack', body: 'Get pinged in #finance when invoices are paid, overdue, or disputed.' },
  {
    name: 'Google Workspace',
    body: 'SSO, calendar-based billing, and Drive attachments on invoices.',
  },
  {
    name: 'Zapier',
    body: '800+ no-code triggers and actions. Build the automations we haven\u2019t.',
  },
  {
    name: 'HubSpot',
    body: 'Auto-create a Nimbus customer when a HubSpot deal moves to Closed Won.',
  },
  {
    name: 'Plaid',
    body: 'Connect any US, UK, or EU bank account. Balances refreshed every 2 hours.',
  },
]

const FAQ = [
  {
    q: 'How long is the free trial and do I need a credit card?',
    a: 'Nimbus is free for 14 days on any plan. We do not ask for a credit card to start your trial. On day 14 you pick a plan or your account is paused until you do \u2014 we never auto-charge without an explicit action.',
  },
  {
    q: 'Can I import data from QuickBooks, Xero, or FreshBooks?',
    a: 'Yes. We support one-click imports from QuickBooks Online, Xero, FreshBooks, and Wave. CSV imports are available for any other tool. Historical data (up to 24 months) is preserved including line items, customer records, and payment history.',
  },
  {
    q: 'What does Nimbus cost and what\u2019s the difference between the plans?',
    a: 'Starter is $19/month for up to 3 users and includes unlimited invoices, expenses, and reporting. Growth is $49/month for up to 15 users and adds recurring billing, multi-currency, and QuickBooks/Xero sync. Business is $129/month for unlimited users and adds SSO, advanced permissions, audit logs, custom approval workflows, and priority support.',
  },
  {
    q: 'Do you offer an annual discount?',
    a: 'Yes. Pay annually and get 20% off any plan. You can switch between monthly and annual at any time from Settings \u2192 Billing.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Settings \u2192 Billing \u2192 Cancel subscription. Your account stays active until the end of the current billing period. You can export all your data at any time, even after cancellation \u2014 we keep a read-only copy for 90 days.',
  },
  {
    q: 'Do you offer refunds?',
    a: 'Yes. If you cancel within 30 days of your first paid charge we refund the full amount, no questions asked. After 30 days we prorate refunds for annual plans if you cancel mid-year. Monthly plans are not prorated past the 30-day window.',
  },
  {
    q: 'Is Nimbus SOC 2 compliant?',
    a: 'Yes. We are SOC 2 Type II certified and undergo annual audits by Prescient Assurance. You can request our latest SOC 2 report and penetration test summary from legal@nimbus.finance. We are also GDPR compliant with a signed DPA available on request.',
  },
  {
    q: 'Where is my data stored?',
    a: 'All customer data is stored in AWS us-east-1 (N. Virginia) by default. EU customers can request data residency in eu-west-1 (Ireland) at no extra cost \u2014 available on Growth and Business plans.',
  },
  {
    q: 'How do you handle payment card data?',
    a: 'We do not store card data on our servers. All payments are tokenised by Stripe, which is PCI DSS Level 1 certified. Nimbus itself is PCI-SAQ-A scoped, meaning we never see raw card numbers.',
  },
  {
    q: 'Can I give my accountant access?',
    a: 'Yes, and it\u2019s free. Invite any external accountant or bookkeeper from Settings \u2192 Team \u2192 Invite accountant. They get a read-only seat that does not count against your user limit.',
  },
  {
    q: 'What happens if I go over my user limit?',
    a: 'Nothing breaks. We notify you by email and in-app. You then have 14 days to either remove users or upgrade. We never auto-upgrade your plan.',
  },
  {
    q: 'Do you support multi-entity or multi-company accounting?',
    a: 'Multi-entity is available on the Business plan. You can run up to 10 legal entities under one login, with inter-company invoices, consolidated reporting, and separate tax profiles per entity.',
  },
  {
    q: 'How do I contact support?',
    a: 'The fastest way is the chat bubble in the bottom-right corner of this page \u2014 our AI agent answers instantly 24/7 and escalates to a human when needed. You can also email support@nimbus.finance (Mon\u2013Fri, 9am\u20136pm GMT response within 4 hours) or book a call at nimbus.finance/book.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Yes. iOS and Android apps are free with any plan. You can create invoices, approve expenses, upload receipts, and view cash flow from your phone. Offline mode syncs when you\u2019re back online.',
  },
  {
    q: 'Can I white-label invoices with my own logo and colors?',
    a: 'Yes on all plans. Upload your logo, set a brand color, choose a typography preset, and add a custom email sending domain. Business plan adds custom invoice templates and a fully white-labelled payment page.',
  },
]

const GETTING_STARTED = [
  {
    step: '1',
    title: 'Create your workspace',
    body: 'Sign up at app.nimbus.finance with your work email. We auto-detect your company domain and suggest teammates to invite. Setup takes under 60 seconds.',
  },
  {
    step: '2',
    title: 'Connect your bank',
    body: 'Plaid-powered connection to any US, UK, or EU bank. Balances and transactions sync every 2 hours. Encrypted end-to-end; we never see your login credentials.',
  },
  {
    step: '3',
    title: 'Import existing customers or invoices',
    body: 'One-click import from QuickBooks, Xero, FreshBooks, Wave, or a CSV. Everything maps automatically \u2014 customer records, invoice numbers, payment history.',
  },
  {
    step: '4',
    title: 'Send your first invoice',
    body: 'Click New Invoice, pick a customer, add line items, hit Send. Your customer pays with one click. You get a Slack ping the moment it clears.',
  },
  {
    step: '5',
    title: 'Invite your team',
    body: 'Roles are granular \u2014 owner, admin, member, accountant (free), viewer. Every action is logged for audit.',
  },
]

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
            <a href="#security" className="hover:text-slate-900">
              Security
            </a>
            <a href="#faq" className="hover:text-slate-900">
              FAQ
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
      <section className="px-6 pt-24 pb-20 text-center" id="top">
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
            have outgrown spreadsheets but aren&rsquo;t ready for SAP. Used by 3,200+ service
            businesses to get paid 4× faster and close the books on day 2.
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
            No credit card · Cancel anytime · SOC 2 Type II · GDPR compliant
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

      {/* ── About ───────────────────────────────────────────────────────── */}
      <section id="about" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            About Nimbus
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            We started Nimbus because QuickBooks was built for accountants, not the people running
            the business.
          </h2>
          <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
            <p>
              Nimbus was founded in 2022 by three finance operators who had spent a combined
              eighteen years rebuilding the same spreadsheets at every new job. Our first customers
              were design studios and engineering consultancies in London and New York — small
              enough to feel the pain of disconnected tools, big enough to need more than
              FreshBooks.
            </p>
            <p>
              Today Nimbus powers invoicing, expenses, and financial reporting for more than 3,200
              service businesses across 34 countries. Our team is 47 people, remote-first with hubs
              in London, Lisbon, and Austin. We&rsquo;re backed by Point Nine, Seedcamp, and a
              handful of finance leaders from Stripe, Intercom, and GoCardless.
            </p>
            <p>
              Our guiding principle: finance software should be boring for the people who need it to
              be, and invisible for everyone else. Most days we get that right. When we don&rsquo;t,
              the chat bubble in the bottom-right corner is the fastest way to tell us.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="product" className="px-6 py-24 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            What Nimbus does
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Everything your finance stack should already do.
          </h2>
          <div className="mt-14 grid gap-10 md:grid-cols-2">
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
        </div>
      </section>

      {/* ── Integrations ────────────────────────────────────────────────── */}
      <section id="integrations" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            Integrations
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Connects to the tools you already use.
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Nimbus syncs two-way with your accounting, banking, payments, and CRM tools. Setup is
            one-click OAuth for every integration on this page.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-bold tracking-tight">{i.name}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{i.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ────────────────────────────────────────────────────── */}
      <section id="security" className="px-6 py-24 bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            Security & compliance
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Enterprise-grade security, without the sales call.
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-2 text-slate-300">
            <div>
              <h3 className="text-lg font-bold text-white">SOC 2 Type II</h3>
              <p className="mt-2 text-sm leading-relaxed">
                Certified annually by Prescient Assurance. Our latest report (and the bridge letter)
                is available under NDA from legal@nimbus.finance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">GDPR & CCPA compliant</h3>
              <p className="mt-2 text-sm leading-relaxed">
                DPA available on request. You can export or delete customer data from Settings →
                Privacy at any time. Data processing locations are disclosed in the DPA.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Encryption everywhere</h3>
              <p className="mt-2 text-sm leading-relaxed">
                TLS 1.3 in transit, AES-256 at rest. Per-tenant encryption keys on Business plan.
                Field-level encryption for PII and payment metadata on all plans.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">SSO & granular permissions</h3>
              <p className="mt-2 text-sm leading-relaxed">
                SAML and OIDC SSO on the Business plan (Okta, Google, Azure AD, OneLogin). Every
                action is logged to an append-only audit trail you can export any time.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Data residency</h3>
              <p className="mt-2 text-sm leading-relaxed">
                US customers are hosted in AWS us-east-1 by default. EU customers can pin residency
                to eu-west-1 (Ireland) at no extra cost on Growth and Business plans.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Uptime & backups</h3>
              <p className="mt-2 text-sm leading-relaxed">
                99.95% contractual SLA on the Business plan. Hourly point-in-time backups,
                cross-region replication, 30-day retention. Status at status.nimbus.finance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            Pricing
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Simple pricing. No seat tax.
          </h2>
          <p className="mt-4 text-center text-slate-600 max-w-xl mx-auto">
            All plans include unlimited invoices, unlimited expenses, and a free seat for your
            accountant. Save 20% with annual billing.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Starter',
                price: '$19',
                seats: 'Up to 3 users',
                features: [
                  'Unlimited invoices and expenses',
                  'Receipt OCR + mileage tracking',
                  'Stripe + ACH payments',
                  'Basic cash-flow reporting',
                  'Email support (24h SLA)',
                ],
              },
              {
                name: 'Growth',
                price: '$49',
                seats: 'Up to 15 users',
                highlight: true,
                features: [
                  'Everything in Starter, plus:',
                  'Recurring billing & subscriptions',
                  'Multi-currency (136 supported)',
                  'QuickBooks / Xero two-way sync',
                  'Slack notifications',
                  'Priority chat support (4h SLA)',
                ],
              },
              {
                name: 'Business',
                price: '$129',
                seats: 'Unlimited users',
                features: [
                  'Everything in Growth, plus:',
                  'SSO (SAML, OIDC)',
                  'Audit log export',
                  'Custom approval workflows',
                  'Multi-entity consolidation',
                  'Dedicated success manager',
                  '99.95% uptime SLA',
                ],
              },
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
                <ul className="mt-6 space-y-2 text-sm">
                  {tier.features.map((f) => (
                    <li key={f} className={tier.highlight ? 'text-gray-200' : 'text-gray-700'}>
                      • {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#help"
                  className={`mt-8 block text-center rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
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
          <p className="mt-8 text-center text-sm text-slate-500">
            Questions about pricing? Our AI support agent can answer instantly — click the chat
            bubble bottom-right.
          </p>
        </div>
      </section>

      {/* ── Getting started ────────────────────────────────────────────── */}
      <section id="getting-started" className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            Getting started
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Up and running in under an hour.
          </h2>
          <div className="mt-12 space-y-6">
            {GETTING_STARTED.map((s) => (
              <div
                key={s.step}
                className="flex gap-5 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
            Frequently asked questions
          </p>
          <h2 className="mt-3 text-center text-3xl md:text-4xl font-bold tracking-tight">
            Everything prospects usually ask.
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQ.map((item) => (
              <div key={item.q}>
                <dt className="text-base font-bold text-slate-900">{item.q}</dt>
                <dd className="mt-2 text-sm text-slate-600 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Billing & refund policy ────────────────────────────────────── */}
      <section id="billing-policy" className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Billing & refund policy
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Straightforward billing.
          </h2>
          <div className="mt-6 space-y-4 text-slate-600 leading-relaxed">
            <p>
              <strong className="text-slate-900">14-day free trial.</strong> You get full access to
              every feature on any plan for 14 days. We do not ask for a credit card to start. On
              day 14 you either pick a plan or your account is paused. We never auto-charge without
              an explicit action on your side.
            </p>
            <p>
              <strong className="text-slate-900">30-day money-back guarantee.</strong> If you cancel
              within 30 days of your first paid charge we refund the full amount, no questions
              asked. Email support@nimbus.finance and we&rsquo;ll process the refund within 3
              business days.
            </p>
            <p>
              <strong className="text-slate-900">Annual billing.</strong> Save 20% when you pay
              annually. You can switch between monthly and annual from Settings → Billing at any
              time. If you downgrade mid-annual-cycle we prorate the unused balance as credit toward
              future months.
            </p>
            <p>
              <strong className="text-slate-900">Going over your user limit.</strong> Nothing
              breaks. We notify you by email and in-app. You have 14 days to remove users or
              upgrade. We never auto-upgrade your plan.
            </p>
            <p>
              <strong className="text-slate-900">Cancellation.</strong> Settings → Billing → Cancel
              subscription. Your account stays active until the end of the current billing period.
              After cancellation we keep a read-only copy of your data for 90 days so you can still
              export it. After that it&rsquo;s permanently deleted.
            </p>
            <p>
              <strong className="text-slate-900">Failed payments.</strong> We retry 3 times over 10
              days and notify the workspace owner before any service disruption. If payment
              continues to fail we move your account to read-only (you can still export data) but
              never delete it without explicit confirmation.
            </p>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section id="contact" className="px-6 py-24 bg-slate-50 border-y border-slate-200">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">Talk to a human.</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-base font-bold">Support</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Fastest: chat bubble bottom-right (AI answers instantly, 24/7). Email{' '}
                <span className="font-medium text-slate-900">support@nimbus.finance</span> (Mon–Fri,
                9am–6pm GMT, 4h response).
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-base font-bold">Sales</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-900">sales@nimbus.finance</span> or book a
                call at nimbus.finance/book. Typical response within 2 business hours.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-base font-bold">Security & legal</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-900">legal@nimbus.finance</span> for SOC 2
                reports, DPAs, MSAs, security questionnaires.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-5">
              <h3 className="text-base font-bold">Press & partnerships</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                <span className="font-medium text-slate-900">hello@nimbus.finance</span>. Media kit
                and logo assets at nimbus.finance/press.
              </p>
            </div>
          </div>
          <p className="mt-8 text-xs text-slate-500">
            Registered office: Nimbus Finance Ltd, 1 Finsbury Avenue, London EC2M 2PF, United
            Kingdom. Company no. 13472918.
          </p>
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
            expenses, pricing, integrations, security, or account setup — you&rsquo;ll get answers
            in seconds, any hour of the day.
          </p>
          <div className="mt-10 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-5 py-2.5 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Support online — avg. first reply under 3s
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Nimbus Finance Ltd — a demonstration site for{' '}
            <a href="https://liraintelligence.com" className="underline hover:text-slate-900">
              Lira AI
            </a>
            . No real product, no real users.
          </div>
          <div className="flex items-center gap-4">
            <a href="#billing-policy" className="hover:text-slate-900">
              Billing
            </a>
            <a href="#security" className="hover:text-slate-900">
              Security
            </a>
            <a href="#contact" className="hover:text-slate-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
