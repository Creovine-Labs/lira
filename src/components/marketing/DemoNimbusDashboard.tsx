import { useMemo, useState } from 'react'
import {
  PLAN_DETAILS,
  PLAN_TIERS,
  updateDemoProfile,
  type CardBrand,
  type DemoProfile,
  type PaymentCard,
  type PlanTier,
} from '@/lib/demo-profile'

/**
 * DemoNimbusDashboard — the "signed-in" view of the Nimbus demo.
 *
 * Replaces the marketing landing page once a visitor creates a test profile.
 * The point is to make Lira's demo feel like a real B2B SaaS dashboard the
 * AI is embedded in — not just a chatbot on a marketing site. Buyers see
 * the depth: a dashboard, fake-but-realistic financial data, integrations,
 * recent activity, all referenceable by the AI in conversation.
 *
 * All data is derived from the synthetic profile + deterministic hashing,
 * so the dashboard feels personalized to the visitor without any real
 * backend behind it. Same profile + same view = same data every time.
 */

interface DemoNimbusDashboardProps {
  profile: DemoProfile
  onSignOut: () => void
}

type NavItem = 'Dashboard' | 'Invoices' | 'Expenses' | 'Reports' | 'Customers' | 'Settings'

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashFromString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function fmtDateLong(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

// ── Static catalogs ──────────────────────────────────────────────────────────

const CUSTOMER_NAMES = [
  'Arcadia Goods',
  'Northwind Co.',
  'Halcyon Studio',
  'Foxglove Capital',
  'Lumen Studio',
  'Beacon Bakery',
  'Kite & Co',
  'Verity Labs',
  'Pinedale Hotels',
  'Mercator Trade',
  'Cascade Roasters',
  'Ironwood Legal',
  'Boreal Logistics',
  'Sandbar Studios',
  'Hollow Hill Farm',
] as const

const CUSTOMER_DOMAINS = [
  'arcadia.co',
  'northwind.io',
  'halcyon.studio',
  'foxglovecap.com',
  'lumenstudio.co',
  'beacon.bakery',
  'kite-co.com',
  'veritylabs.dev',
  'pinedalehotels.com',
  'mercatortrade.com',
  'cascaderoasters.com',
  'ironwoodlegal.com',
  'borealogistics.com',
  'sandbarstudios.com',
  'hollowhillfarm.com',
] as const

const INVOICE_STATUSES = ['Paid', 'Paid', 'Paid', 'Paid', 'Pending', 'Overdue'] as const

const INTEGRATIONS = [
  {
    name: 'Stripe',
    detail: 'Payments & subscriptions',
    status: 'Connected',
    color: '#635BFF',
    lastSync: '2 minutes ago',
  },
  {
    name: 'QuickBooks Online',
    detail: 'Two-way sync',
    status: 'Connected',
    color: '#2CA01C',
    lastSync: '14 minutes ago',
  },
  {
    name: 'Slack',
    detail: '#finance channel',
    status: 'Connected',
    color: '#4A154B',
    lastSync: 'Active',
  },
  {
    name: 'Plaid',
    detail: 'Bank connections',
    status: 'Connected',
    color: '#0C7CBA',
    lastSync: '47 minutes ago',
  },
  {
    name: 'HubSpot',
    detail: 'Auto-create customers',
    status: 'Connected',
    color: '#FF7A59',
    lastSync: '1 hour ago',
  },
  {
    name: 'Xero',
    detail: 'Off — flip to enable',
    status: 'Disabled',
    color: '#13B5EA',
    lastSync: '—',
  },
  {
    name: 'Google Workspace',
    detail: 'SSO + calendar billing',
    status: 'Connected',
    color: '#4285F4',
    lastSync: '6 hours ago',
  },
  {
    name: 'Zapier',
    detail: '4 active zaps',
    status: 'Connected',
    color: '#FF4F00',
    lastSync: '12 minutes ago',
  },
] as const

const EXPENSE_CATEGORIES = [
  { label: 'Software', icon: '💻' },
  { label: 'Travel', icon: '✈️' },
  { label: 'Marketing', icon: '📣' },
  { label: 'Office', icon: '🏢' },
  { label: 'Contractors', icon: '🧑‍💼' },
] as const

const EXPENSE_VENDORS = [
  'Figma',
  'AWS',
  'GitHub',
  'Linear',
  'Notion',
  'Vercel',
  'Anthropic',
  'OpenAI',
  'United Airlines',
  'Uber',
  'Marriott',
  'Stripe Atlas',
  'Google Ads',
  'LinkedIn Premium',
  'Mailchimp',
  'Office supplies — Staples',
  'WeWork',
] as const

// ── Data generators ──────────────────────────────────────────────────────────

interface Invoice {
  id: string
  customer: string
  amount: number
  date: string
  dueDate: string
  status: (typeof INVOICE_STATUSES)[number]
}

function generateInvoices(seedBase: string, planAmount: number, count = 20): Invoice[] {
  const out: Invoice[] = []
  for (let i = 0; i < count; i++) {
    const seed = `${seedBase}|inv${i}`
    const h = hashFromString(seed)
    const customer = CUSTOMER_NAMES[h % CUSTOMER_NAMES.length]
    const amountMode = h % 3
    const amount =
      amountMode === 0 ? planAmount : amountMode === 1 ? planAmount * 2 + 30 : 80 + (h % 600)
    const daysAgo = 1 + ((h >>> 4) % 60)
    const date = new Date(Date.now() - daysAgo * 86_400_000)
    const due = new Date(date)
    due.setDate(due.getDate() + 30)
    const status = INVOICE_STATUSES[(h >>> 8) % INVOICE_STATUSES.length]
    out.push({
      id: `INV-${(2000 + (h % 8000)).toString().padStart(4, '0')}`,
      customer,
      amount,
      date: date.toISOString(),
      dueDate: due.toISOString(),
      status,
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

interface ExpenseSummary {
  label: string
  icon: string
  amount: number
}

function generateExpenseSummary(seedBase: string): ExpenseSummary[] {
  return EXPENSE_CATEGORIES.map((c, i) => {
    const seed = `${seedBase}|exp${i}`
    const h = hashFromString(seed)
    const amount = 200 + (h % 2800)
    return { label: c.label, icon: c.icon, amount }
  })
}

interface ExpenseRow {
  id: string
  vendor: string
  category: string
  categoryIcon: string
  amount: number
  date: string
  paymentMethod: string
}

function generateExpenseRows(seedBase: string, count = 14): ExpenseRow[] {
  const out: ExpenseRow[] = []
  const methods = ['Amex •• 4011', 'Chase •• 9032', 'ACH transfer', 'Wire'] as const
  for (let i = 0; i < count; i++) {
    const seed = `${seedBase}|expr${i}`
    const h = hashFromString(seed)
    const vendor = EXPENSE_VENDORS[h % EXPENSE_VENDORS.length]
    const cat = EXPENSE_CATEGORIES[(h >>> 3) % EXPENSE_CATEGORIES.length]
    const amount = 40 + (h % 980)
    const daysAgo = (h >>> 6) % 28
    const date = new Date(Date.now() - daysAgo * 86_400_000)
    const paymentMethod = methods[(h >>> 11) % methods.length]
    out.push({
      id: `EXP-${(5000 + (h % 4000)).toString().padStart(4, '0')}`,
      vendor,
      category: cat.label,
      categoryIcon: cat.icon,
      amount,
      date: date.toISOString(),
      paymentMethod,
    })
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

interface Customer {
  id: string
  name: string
  email: string
  plan: 'Starter' | 'Growth' | 'Business'
  status: 'Active' | 'Trialing' | 'Past due' | 'Churned'
  lastInvoiceAmount: number
  lastInvoiceDate: string
  joinedAt: string
}

function generateCustomers(seedBase: string, count = 14): Customer[] {
  const plans: Customer['plan'][] = ['Starter', 'Growth', 'Business']
  const statuses: Customer['status'][] = ['Active', 'Active', 'Active', 'Trialing', 'Past due']
  const out: Customer[] = []
  for (let i = 0; i < count; i++) {
    const seed = `${seedBase}|cust${i}`
    const h = hashFromString(seed)
    const idx = h % CUSTOMER_NAMES.length
    const name = CUSTOMER_NAMES[idx]
    const email = `billing@${CUSTOMER_DOMAINS[idx]}`
    const plan = plans[(h >>> 4) % plans.length]
    const status = statuses[(h >>> 7) % statuses.length]
    const planAmount = plan === 'Starter' ? 19 : plan === 'Growth' ? 49 : 129
    const daysAgo = 1 + ((h >>> 10) % 28)
    const lastDate = new Date(Date.now() - daysAgo * 86_400_000)
    const joinDaysAgo = 30 + ((h >>> 14) % 540)
    const joinedAt = new Date(Date.now() - joinDaysAgo * 86_400_000)
    out.push({
      id: `CUS-${(1000 + (h % 9000)).toString().padStart(4, '0')}`,
      name,
      email,
      plan,
      status,
      lastInvoiceAmount: planAmount,
      lastInvoiceDate: lastDate.toISOString(),
      joinedAt: joinedAt.toISOString(),
    })
  }
  return out.sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1))
}

// Monthly revenue series for the Reports view
function generateRevenueSeries(seedBase: string, planAmount: number) {
  const months = [] as { month: string; revenue: number }[]
  const baseCount = 12 + (hashFromString(seedBase + 'count') % 24)
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const seed = `${seedBase}|rev${i}`
    const h = hashFromString(seed)
    // Slight growth trend + noise
    const noise = (h % 1000) / 1000 - 0.3
    const growth = 1 + (11 - i) * 0.04
    const revenue = Math.round((baseCount + noise * 4) * planAmount * growth)
    const label = d.toLocaleDateString('en-US', { month: 'short' })
    months.push({ month: label, revenue })
  }
  return months
}

// ── Component ────────────────────────────────────────────────────────────────

export function DemoNimbusDashboard({ profile, onSignOut }: DemoNimbusDashboardProps) {
  // Retain the legacy demo integrations view for future reactivation while
  // keeping it out of the current demo navigation.
  void IntegrationsView
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<NavItem>('Dashboard')
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [cardModalOpen, setCardModalOpen] = useState(false)

  const seed = profile.name + profile.plan
  const planAmount = profile.last_invoice_amount_usd

  const invoices = useMemo(() => generateInvoices(seed, planAmount, 20), [seed, planAmount])
  const expenseSummary = useMemo(() => generateExpenseSummary(seed), [seed])
  const expenseRows = useMemo(() => generateExpenseRows(seed, 14), [seed])
  const customers = useMemo(() => generateCustomers(seed, 14), [seed])
  const revenueSeries = useMemo(() => generateRevenueSeries(seed, planAmount), [seed, planAmount])

  const mrr = useMemo(() => {
    const baseCust = 12 + (hashFromString(seed + 'mrr') % 36)
    return baseCust * planAmount
  }, [seed, planAmount])
  const outstanding = useMemo(
    () => invoices.filter((i) => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0),
    [invoices]
  )
  const revenueThisMonth = useMemo(
    () => invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0),
    [invoices]
  )
  const customerCount = useMemo(() => 12 + (hashFromString(seed + 'cust') % 36), [seed])

  const userInitials = profile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const greetingHour = new Date().getHours()
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="ndb-root">
      {/* ── Lira demo banner (top of everything) ────────────────────────── */}
      <div className="ndb-demo-banner">
        <div className="ndb-banner-bg" aria-hidden="true">
          <span className="ndb-banner-blur ndb-banner-blur-left" />
          <span className="ndb-banner-blur ndb-banner-blur-right" />
        </div>
        <div className="ndb-banner-inner">
          <span className="ndb-banner-pill">
            <span className="ndb-banner-dot" />
            Lira demo
          </span>
          <span className="ndb-banner-msg">
            Nimbus is fictional. Click the chat bubble to talk to Lira.
          </span>
          <a className="ndb-banner-switch" href="/demo/help">
            Switch to full support page →
          </a>
        </div>
      </div>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="ndb-topbar">
        <div className="ndb-brand">
          <span className="ndb-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </span>
          <span className="ndb-brand-name">Nimbus</span>
        </div>
        <nav className="ndb-top-nav" aria-label="Primary">
          {(['Dashboard', 'Invoices', 'Expenses', 'Reports', 'Customers'] as NavItem[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={`ndb-top-link ${activeNav === item ? 'is-active' : ''}`}
                onClick={() => setActiveNav(item)}
              >
                {item}
              </button>
            )
          )}
        </nav>
        <div className="ndb-top-actions">
          <button type="button" className="ndb-icon-btn" aria-label="Search">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button
            type="button"
            className="ndb-icon-btn ndb-icon-btn-bell"
            aria-label="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span className="ndb-bell-dot" aria-hidden="true" />
          </button>
          <div className="ndb-user-wrap">
            <button
              type="button"
              className="ndb-user-btn"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
            >
              <span className="ndb-avatar">{userInitials}</span>
              <span className="ndb-user-name">{profile.name}</span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ndb-chevron"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {userMenuOpen && (
              <div className="ndb-user-menu" role="menu">
                <div className="ndb-user-menu-header">
                  <div className="ndb-user-menu-name">{profile.name}</div>
                  <div className="ndb-user-menu-plan">
                    {profile.plan_label} plan · Member since {fmtDate(profile.signed_up_at)}
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  className="ndb-user-menu-item"
                  onClick={() => {
                    setActiveNav('Settings')
                    setUserMenuOpen(false)
                  }}
                >
                  Account settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="ndb-user-menu-item"
                  onClick={() => {
                    setActiveNav('Settings')
                    setUserMenuOpen(false)
                  }}
                >
                  Billing
                </button>
                <div className="ndb-user-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  className="ndb-user-menu-item ndb-user-menu-signout"
                  onClick={() => {
                    setUserMenuOpen(false)
                    onSignOut()
                  }}
                >
                  Sign out of Nimbus demo
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile nav ──────────────────────────────────────────────────
          The sidebar and top-nav are both hidden under 760px, so this
          horizontally-scrollable bar is the only way to move between sections
          on a phone. Hidden on desktop via CSS. */}
      <nav className="ndb-mobile-nav" aria-label="Sections">
        {(
          [
            { name: 'Dashboard', icon: '📊' },
            { name: 'Invoices', icon: '📄' },
            { name: 'Expenses', icon: '💳' },
            { name: 'Reports', icon: '📈' },
            { name: 'Customers', icon: '👥' },
            { name: 'Settings', icon: '⚙️' },
          ] as { name: NavItem; icon: string }[]
        ).map((item) => (
          <button
            key={item.name}
            type="button"
            className={`ndb-mobile-link ${activeNav === item.name ? 'is-active' : ''}`}
            onClick={() => setActiveNav(item.name)}
          >
            <span className="ndb-mobile-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.name}
          </button>
        ))}
      </nav>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="ndb-body">
        <aside className="ndb-sidebar" aria-label="Secondary">
          {(
            [
              { name: 'Dashboard', icon: '📊' },
              { name: 'Invoices', icon: '📄' },
              { name: 'Expenses', icon: '💳' },
              { name: 'Reports', icon: '📈' },
              { name: 'Customers', icon: '👥' },
              { name: 'Settings', icon: '⚙️' },
            ] as { name: NavItem; icon: string }[]
          ).map((item) => (
            <button
              key={item.name}
              type="button"
              className={`ndb-side-link ${activeNav === item.name ? 'is-active' : ''}`}
              onClick={() => setActiveNav(item.name)}
            >
              <span className="ndb-side-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </button>
          ))}
          <div className="ndb-side-foot">
            <div className="ndb-plan-mini">
              <div className="ndb-plan-mini-eyebrow">Current plan</div>
              <div className="ndb-plan-mini-name">{profile.plan_label}</div>
              <div className="ndb-plan-mini-price">
                ${profile.last_invoice_amount_usd}
                <span>/mo</span>
              </div>
              {profile.subscription_status === 'canceled' ? (
                <div className="ndb-plan-mini-canceled">
                  Canceled · ends {fmtDate(profile.next_invoice_date)}
                </div>
              ) : (
                <div className="ndb-plan-mini-meta">
                  Renews {fmtDate(profile.next_invoice_date)}
                </div>
              )}
              <button
                type="button"
                className="ndb-plan-mini-btn"
                onClick={() => setPlanModalOpen(true)}
              >
                Change plan
              </button>
            </div>
          </div>
        </aside>

        <main className="ndb-main">
          {activeNav === 'Dashboard' && (
            <DashboardView
              profile={profile}
              invoices={invoices}
              expenseSummary={expenseSummary}
              mrr={mrr}
              outstanding={outstanding}
              revenueThisMonth={revenueThisMonth}
              customerCount={customerCount}
              greeting={greeting}
              onJumpTo={(nav) => setActiveNav(nav)}
              onChangePlan={() => setPlanModalOpen(true)}
            />
          )}
          {activeNav === 'Invoices' && <InvoicesView invoices={invoices} />}
          {activeNav === 'Expenses' && (
            <ExpensesView expenseSummary={expenseSummary} expenseRows={expenseRows} />
          )}
          {activeNav === 'Reports' && (
            <ReportsView revenueSeries={revenueSeries} invoices={invoices} customers={customers} />
          )}
          {activeNav === 'Customers' && <CustomersView customers={customers} />}
          {activeNav === 'Settings' && (
            <SettingsView
              profile={profile}
              onChangePlan={() => setPlanModalOpen(true)}
              onUpdateCard={() => setCardModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Open-issues toast (only renders if visitor flagged something at signup) */}
      {profile.open_issues && (
        <div className="ndb-open-issue" role="status">
          <div className="ndb-open-issue-eyebrow">Open issue at signup</div>
          <p>{profile.open_issues}</p>
          <p className="ndb-open-issue-cta">Ask Lira in the chat to look at it.</p>
        </div>
      )}

      {/* ── Modals (drive local mutations against the profile) ─────────── */}
      <UpgradePlanModal
        open={planModalOpen}
        currentPlan={profile.plan}
        onClose={() => setPlanModalOpen(false)}
      />
      <UpdateCardModal
        open={cardModalOpen}
        currentCard={profile.card}
        onClose={() => setCardModalOpen(false)}
      />

      <Styles />
    </div>
  )
}

// ── Dashboard view ──────────────────────────────────────────────────────────

function DashboardView({
  profile,
  invoices,
  expenseSummary,
  mrr,
  outstanding,
  revenueThisMonth,
  customerCount,
  greeting,
  onJumpTo,
  onChangePlan,
}: {
  profile: DemoProfile
  invoices: Invoice[]
  expenseSummary: ExpenseSummary[]
  mrr: number
  outstanding: number
  revenueThisMonth: number
  customerCount: number
  greeting: string
  onJumpTo: (nav: NavItem) => void
  onChangePlan: () => void
}) {
  return (
    <>
      <div className="ndb-greeting ndb-greeting-row">
        <div>
          <h1>
            {greeting}, {profile.name}
          </h1>
          <p>Here's what's happening with Nimbus today.</p>
        </div>
        <div className="ndb-plan-badge">
          <div className="ndb-plan-badge-eyebrow">Current plan</div>
          <div className="ndb-plan-badge-name">
            {profile.plan_label}
            <span className="ndb-plan-badge-price">
              ${profile.last_invoice_amount_usd}
              <span>/mo</span>
            </span>
          </div>
          <button
            type="button"
            className="ndb-secondary-btn ndb-plan-badge-btn"
            onClick={onChangePlan}
          >
            Change plan
          </button>
        </div>
      </div>

      <section className="ndb-kpis" aria-label="Key metrics">
        {[
          { label: 'Monthly recurring revenue', value: fmtUSD(mrr), trend: '+8.4%' },
          { label: 'Outstanding invoices', value: fmtUSD(outstanding), trend: '-2.1%' },
          { label: 'This month revenue', value: fmtUSD(revenueThisMonth), trend: '+12%' },
          { label: 'Active customers', value: customerCount.toString(), trend: '+3' },
        ].map((kpi) => (
          <div key={kpi.label} className="ndb-kpi">
            <div className="ndb-kpi-label">{kpi.label}</div>
            <div className="ndb-kpi-value">{kpi.value}</div>
            <div className={`ndb-kpi-trend ${kpi.trend.startsWith('-') ? 'is-down' : 'is-up'}`}>
              {kpi.trend}
            </div>
          </div>
        ))}
      </section>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Recent invoices</h2>
          <button type="button" className="ndb-link-btn" onClick={() => onJumpTo('Invoices')}>
            View all →
          </button>
        </div>
        <div className="ndb-table">
          <div className="ndb-table-head">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Date</span>
            <span>Amount</span>
            <span>Status</span>
          </div>
          {invoices.slice(0, 6).map((inv) => (
            <div key={inv.id} className="ndb-table-row">
              <span className="ndb-table-id">#{inv.id}</span>
              <span>{inv.customer}</span>
              <span className="ndb-table-muted">{fmtDate(inv.date)}</span>
              <span>{fmtUSD(inv.amount)}</span>
              <span>
                <StatusPill status={inv.status} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="ndb-two-col">
        <section className="ndb-card">
          <div className="ndb-card-head">
            <h2>Expenses by category</h2>
            <span className="ndb-card-sub">Last 30 days</span>
          </div>
          <ul className="ndb-expense-list">
            {expenseSummary.map((e) => {
              const max = Math.max(...expenseSummary.map((x) => x.amount))
              const pct = Math.round((e.amount / max) * 100)
              return (
                <li key={e.label} className="ndb-expense-row">
                  <span className="ndb-expense-icon" aria-hidden="true">
                    {e.icon}
                  </span>
                  <span className="ndb-expense-label">{e.label}</span>
                  <span className="ndb-expense-bar">
                    <span className="ndb-expense-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="ndb-expense-amount">{fmtUSD(e.amount)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="ndb-prompt">
        <div className="ndb-prompt-eyebrow">Need help with this dashboard?</div>
        <p>
          Lira knows your account. Try asking <em>"what's my next invoice?"</em>,{' '}
          <em>"how do I add a new customer?"</em>, or <em>"refund my last payment"</em> in the chat
          bubble.
        </p>
      </section>
    </>
  )
}

// ── Invoices view ───────────────────────────────────────────────────────────

function InvoicesView({ invoices }: { invoices: Invoice[] }) {
  type Filter = 'All' | 'Paid' | 'Pending' | 'Overdue'
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')

  const filtered = invoices.filter((i) => {
    if (filter !== 'All' && i.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!i.customer.toLowerCase().includes(q) && !i.id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const totals = {
    Paid: invoices.filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0),
    Pending: invoices.filter((i) => i.status === 'Pending').reduce((s, i) => s + i.amount, 0),
    Overdue: invoices.filter((i) => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0),
  }

  return (
    <>
      <div className="ndb-greeting">
        <h1>Invoices</h1>
        <p>Send, track, and follow up on every customer invoice.</p>
      </div>

      <section className="ndb-kpis">
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Paid this month</div>
          <div className="ndb-kpi-value">{fmtUSD(totals.Paid)}</div>
          <div className="ndb-kpi-trend is-up">
            {invoices.filter((i) => i.status === 'Paid').length} invoices
          </div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Pending</div>
          <div className="ndb-kpi-value">{fmtUSD(totals.Pending)}</div>
          <div className="ndb-kpi-trend">
            {invoices.filter((i) => i.status === 'Pending').length} invoices
          </div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Overdue</div>
          <div className="ndb-kpi-value">{fmtUSD(totals.Overdue)}</div>
          <div className="ndb-kpi-trend is-down">
            {invoices.filter((i) => i.status === 'Overdue').length} need follow-up
          </div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Avg invoice</div>
          <div className="ndb-kpi-value">
            {fmtUSD(Math.round(invoices.reduce((s, i) => s + i.amount, 0) / invoices.length))}
          </div>
          <div className="ndb-kpi-trend">across {invoices.length} invoices</div>
        </div>
      </section>

      <section className="ndb-card">
        <div className="ndb-toolbar">
          <div className="ndb-tabs">
            {(['All', 'Paid', 'Pending', 'Overdue'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`ndb-tab ${filter === f ? 'is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ndb-toolbar-right">
            <input
              type="search"
              placeholder="Search by customer or invoice #"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ndb-search"
            />
            <button type="button" className="ndb-primary-btn">
              + New invoice
            </button>
          </div>
        </div>

        <div className="ndb-table ndb-table-wide">
          <div className="ndb-table-head">
            <span>Invoice</span>
            <span>Customer</span>
            <span>Issued</span>
            <span>Due</span>
            <span>Amount</span>
            <span>Status</span>
            <span></span>
          </div>
          {filtered.map((inv) => (
            <div key={inv.id} className="ndb-table-row">
              <span className="ndb-table-id">#{inv.id}</span>
              <span>{inv.customer}</span>
              <span className="ndb-table-muted">{fmtDate(inv.date)}</span>
              <span className="ndb-table-muted">{fmtDate(inv.dueDate)}</span>
              <span>{fmtUSD(inv.amount)}</span>
              <span>
                <StatusPill status={inv.status} />
              </span>
              <span>
                <button type="button" className="ndb-row-btn">
                  …
                </button>
              </span>
            </div>
          ))}
          {filtered.length === 0 && <div className="ndb-empty">No invoices match this filter.</div>}
        </div>
      </section>
    </>
  )
}

// ── Expenses view ───────────────────────────────────────────────────────────

function ExpensesView({
  expenseSummary,
  expenseRows,
}: {
  expenseSummary: ExpenseSummary[]
  expenseRows: ExpenseRow[]
}) {
  const total = expenseRows.reduce((s, e) => s + e.amount, 0)
  const max = Math.max(...expenseSummary.map((x) => x.amount))

  return (
    <>
      <div className="ndb-greeting">
        <h1>Expenses</h1>
        <p>Track, categorize, and reconcile every business expense.</p>
      </div>

      <section className="ndb-kpis">
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">This month</div>
          <div className="ndb-kpi-value">{fmtUSD(total)}</div>
          <div className="ndb-kpi-trend is-up">+6.3% vs last</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Largest category</div>
          <div className="ndb-kpi-value">
            {expenseSummary.reduce((m, e) => (e.amount > m.amount ? e : m)).label}
          </div>
          <div className="ndb-kpi-trend">
            {fmtUSD(expenseSummary.reduce((m, e) => (e.amount > m.amount ? e : m)).amount)}
          </div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Avg receipt</div>
          <div className="ndb-kpi-value">{fmtUSD(Math.round(total / expenseRows.length))}</div>
          <div className="ndb-kpi-trend">{expenseRows.length} receipts</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Auto-reconciled</div>
          <div className="ndb-kpi-value">87%</div>
          <div className="ndb-kpi-trend is-up">via Plaid + Stripe</div>
        </div>
      </section>

      <div className="ndb-two-col">
        <section className="ndb-card">
          <div className="ndb-card-head">
            <h2>By category</h2>
            <span className="ndb-card-sub">Last 30 days</span>
          </div>
          <ul className="ndb-expense-list">
            {expenseSummary.map((e) => {
              const pct = Math.round((e.amount / max) * 100)
              return (
                <li key={e.label} className="ndb-expense-row">
                  <span className="ndb-expense-icon">{e.icon}</span>
                  <span className="ndb-expense-label">{e.label}</span>
                  <span className="ndb-expense-bar">
                    <span className="ndb-expense-fill" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="ndb-expense-amount">{fmtUSD(e.amount)}</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="ndb-card">
          <div className="ndb-card-head">
            <h2>Auto-reconciliation</h2>
            <span className="ndb-card-sub">Last 24h</span>
          </div>
          <ul className="ndb-activity">
            <li>
              <span className="ndb-activity-dot ndb-activity-dot-success" />
              <span>
                <strong>Stripe</strong> matched 14 charges to receipts
                <span className="ndb-activity-time">2 minutes ago</span>
              </span>
            </li>
            <li>
              <span className="ndb-activity-dot ndb-activity-dot-success" />
              <span>
                <strong>QuickBooks</strong> synced 23 transactions to chart of accounts
                <span className="ndb-activity-time">14 minutes ago</span>
              </span>
            </li>
            <li>
              <span className="ndb-activity-dot ndb-activity-dot-warn" />
              <span>
                <strong>Plaid</strong> flagged 2 unmatched bank items for review
                <span className="ndb-activity-time">1 hour ago</span>
              </span>
            </li>
            <li>
              <span className="ndb-activity-dot ndb-activity-dot-success" />
              <span>
                <strong>OCR</strong> extracted 9 new receipts from email forwards
                <span className="ndb-activity-time">3 hours ago</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="ndb-card">
        <div className="ndb-toolbar">
          <h2 className="ndb-toolbar-title">Recent expenses</h2>
          <div className="ndb-toolbar-right">
            <button type="button" className="ndb-primary-btn">
              + Add expense
            </button>
          </div>
        </div>
        <div className="ndb-table ndb-table-wide">
          <div className="ndb-table-head">
            <span>ID</span>
            <span>Vendor</span>
            <span>Category</span>
            <span>Date</span>
            <span>Method</span>
            <span>Amount</span>
            <span></span>
          </div>
          {expenseRows.map((e) => (
            <div key={e.id} className="ndb-table-row">
              <span className="ndb-table-id">#{e.id}</span>
              <span>{e.vendor}</span>
              <span className="ndb-table-muted">
                <span style={{ marginRight: 6 }}>{e.categoryIcon}</span>
                {e.category}
              </span>
              <span className="ndb-table-muted">{fmtDate(e.date)}</span>
              <span className="ndb-table-muted">{e.paymentMethod}</span>
              <span>{fmtUSD(e.amount)}</span>
              <span>
                <button type="button" className="ndb-row-btn">
                  …
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

// ── Reports view ────────────────────────────────────────────────────────────

function ReportsView({
  revenueSeries,
  invoices,
  customers,
}: {
  revenueSeries: { month: string; revenue: number }[]
  invoices: Invoice[]
  customers: Customer[]
}) {
  const maxRev = Math.max(...revenueSeries.map((m) => m.revenue))
  const total = revenueSeries.reduce((s, m) => s + m.revenue, 0)
  const last = revenueSeries[revenueSeries.length - 1].revenue
  const prev = revenueSeries[revenueSeries.length - 2].revenue
  const trend = prev === 0 ? 0 : Math.round(((last - prev) / prev) * 100)

  // Top customers by total billed (mocked from latest invoices)
  const customerTotals = invoices.reduce<Record<string, number>>((acc, i) => {
    acc[i.customer] = (acc[i.customer] ?? 0) + i.amount
    return acc
  }, {})
  const topCustomers = Object.entries(customerTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Outstanding aging — `now` is captured at mount via lazy useState init so
  // render stays pure (react-hooks/purity disallows Date.now() during render,
  // even inside useMemo). Stable for the dashboard's session, which matches
  // the "refreshed every 15 minutes" framing.
  const [now] = useState(() => Date.now())
  const aging = useMemo(() => {
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
    invoices
      .filter((i) => i.status !== 'Paid')
      .forEach((i) => {
        const daysOverdue = Math.floor((now - new Date(i.dueDate).getTime()) / 86_400_000)
        if (daysOverdue <= 30) buckets['0-30'] += i.amount
        else if (daysOverdue <= 60) buckets['31-60'] += i.amount
        else if (daysOverdue <= 90) buckets['61-90'] += i.amount
        else buckets['90+'] += i.amount
      })
    return buckets
  }, [invoices, now])

  return (
    <>
      <div className="ndb-greeting">
        <h1>Reports</h1>
        <p>Cash flow, revenue trends, and aging — refreshed every 15 minutes.</p>
      </div>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <div>
            <h2>Revenue · last 12 months</h2>
            <div className="ndb-stat-pair">
              <strong>{fmtUSD(total)}</strong>
              <span className={`ndb-kpi-trend ${trend < 0 ? 'is-down' : 'is-up'}`}>
                {trend >= 0 ? '+' : ''}
                {trend}% MoM
              </span>
            </div>
          </div>
          <div className="ndb-toolbar-right">
            <button type="button" className="ndb-secondary-btn">
              Export CSV
            </button>
            <button type="button" className="ndb-secondary-btn">
              Export PDF
            </button>
          </div>
        </div>
        <div className="ndb-chart">
          {revenueSeries.map((m) => {
            const h = Math.max(8, Math.round((m.revenue / maxRev) * 160))
            return (
              <div key={m.month} className="ndb-chart-col">
                <div
                  className="ndb-chart-bar"
                  style={{ height: `${h}px` }}
                  title={fmtUSD(m.revenue)}
                />
                <span className="ndb-chart-label">{m.month}</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="ndb-two-col">
        <section className="ndb-card">
          <div className="ndb-card-head">
            <h2>Top customers</h2>
            <span className="ndb-card-sub">Last 60 days</span>
          </div>
          <ul className="ndb-rank">
            {topCustomers.map(([name, amt], i) => (
              <li key={name}>
                <span className="ndb-rank-num">{i + 1}</span>
                <span className="ndb-rank-name">{name}</span>
                <span className="ndb-rank-amount">{fmtUSD(amt)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="ndb-card">
          <div className="ndb-card-head">
            <h2>Outstanding aging</h2>
            <span className="ndb-card-sub">Unpaid invoices</span>
          </div>
          <ul className="ndb-expense-list">
            {(['0-30', '31-60', '61-90', '90+'] as const).map((bucket) => {
              const max = Math.max(...Object.values(aging))
              const pct = max === 0 ? 0 : Math.round((aging[bucket] / max) * 100)
              return (
                <li key={bucket} className="ndb-expense-row">
                  <span className="ndb-expense-icon" aria-hidden="true">
                    📅
                  </span>
                  <span className="ndb-expense-label">{bucket} days</span>
                  <span className="ndb-expense-bar">
                    <span
                      className="ndb-expense-fill"
                      style={{
                        width: `${pct}%`,
                        background:
                          bucket === '90+'
                            ? 'linear-gradient(90deg, #dc2626, #ef4444)'
                            : bucket === '61-90'
                              ? 'linear-gradient(90deg, #ea580c, #f97316)'
                              : 'linear-gradient(90deg, #4b3edb, #7c3aed)',
                      }}
                    />
                  </span>
                  <span className="ndb-expense-amount">{fmtUSD(aging[bucket])}</span>
                </li>
              )
            })}
          </ul>
          <p className="ndb-note">
            <strong>{fmtUSD(aging['90+'])}</strong> over 90 days. Ask Lira to draft follow-up emails
            for these.
          </p>
        </section>
      </div>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Customer health</h2>
          <span className="ndb-card-sub">
            Subscription status across {customers.length} customers
          </span>
        </div>
        <div className="ndb-health-grid">
          {(['Active', 'Trialing', 'Past due', 'Churned'] as Customer['status'][]).map((s) => {
            const count = customers.filter((c) => c.status === s).length
            return (
              <div key={s} className="ndb-health-cell">
                <div className="ndb-health-label">{s}</div>
                <div className="ndb-health-value">{count}</div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

// ── Customers view ──────────────────────────────────────────────────────────

function CustomersView({ customers }: { customers: Customer[] }) {
  type Filter = 'All' | 'Active' | 'Trialing' | 'Past due' | 'Churned'
  const [filter, setFilter] = useState<Filter>('All')
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) => {
    if (filter !== 'All' && c.status !== filter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  return (
    <>
      <div className="ndb-greeting">
        <h1>Customers</h1>
        <p>Every customer who's ever paid Nimbus. Sortable, filterable, exportable.</p>
      </div>

      <section className="ndb-kpis">
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Total customers</div>
          <div className="ndb-kpi-value">{customers.length}</div>
          <div className="ndb-kpi-trend is-up">+3 this month</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Active</div>
          <div className="ndb-kpi-value">
            {customers.filter((c) => c.status === 'Active').length}
          </div>
          <div className="ndb-kpi-trend">paying</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Trialing</div>
          <div className="ndb-kpi-value">
            {customers.filter((c) => c.status === 'Trialing').length}
          </div>
          <div className="ndb-kpi-trend">no card</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Past due</div>
          <div className="ndb-kpi-value">
            {customers.filter((c) => c.status === 'Past due').length}
          </div>
          <div className="ndb-kpi-trend is-down">follow-up needed</div>
        </div>
      </section>

      <section className="ndb-card">
        <div className="ndb-toolbar">
          <div className="ndb-tabs">
            {(['All', 'Active', 'Trialing', 'Past due', 'Churned'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`ndb-tab ${filter === f ? 'is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="ndb-toolbar-right">
            <input
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ndb-search"
            />
            <button type="button" className="ndb-primary-btn">
              + Add customer
            </button>
          </div>
        </div>

        <div className="ndb-table ndb-table-wide">
          <div className="ndb-table-head">
            <span>Customer</span>
            <span>Email</span>
            <span>Plan</span>
            <span>Status</span>
            <span>Last invoice</span>
            <span>Joined</span>
            <span></span>
          </div>
          {filtered.map((c) => (
            <div key={c.id} className="ndb-table-row">
              <span>
                <span className="ndb-cust-avatar">{c.name.slice(0, 1)}</span>
                <span style={{ marginLeft: 10 }}>{c.name}</span>
              </span>
              <span className="ndb-table-muted">{c.email}</span>
              <span>{c.plan}</span>
              <span>
                <CustomerStatusPill status={c.status} />
              </span>
              <span className="ndb-table-muted">
                {fmtUSD(c.lastInvoiceAmount)} · {fmtDate(c.lastInvoiceDate)}
              </span>
              <span className="ndb-table-muted">{fmtDate(c.joinedAt)}</span>
              <span>
                <button type="button" className="ndb-row-btn">
                  …
                </button>
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="ndb-empty">No customers match this filter.</div>
          )}
        </div>
      </section>
    </>
  )
}

// ── Integrations view ───────────────────────────────────────────────────────

function IntegrationsView() {
  const [toggled, setToggled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTEGRATIONS.map((i) => [i.name, i.status === 'Connected']))
  )

  return (
    <>
      <div className="ndb-greeting">
        <h1>Integrations</h1>
        <p>Connect Nimbus to your existing finance, sales, and ops stack.</p>
      </div>

      <section className="ndb-kpis">
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Connected</div>
          <div className="ndb-kpi-value">{Object.values(toggled).filter(Boolean).length}</div>
          <div className="ndb-kpi-trend is-up">syncing</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Last sync</div>
          <div className="ndb-kpi-value">2 min</div>
          <div className="ndb-kpi-trend">ago, via Stripe</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Auto-actions</div>
          <div className="ndb-kpi-value">87</div>
          <div className="ndb-kpi-trend">this week</div>
        </div>
        <div className="ndb-kpi">
          <div className="ndb-kpi-label">Available</div>
          <div className="ndb-kpi-value">{INTEGRATIONS.length}</div>
          <div className="ndb-kpi-trend">apps</div>
        </div>
      </section>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Your integrations</h2>
          <span className="ndb-card-sub">Click to toggle (demo only)</span>
        </div>
        <div className="ndb-integ-list">
          {INTEGRATIONS.map((i) => {
            const isOn = toggled[i.name]
            return (
              <div key={i.name} className="ndb-integ-row">
                <div className="ndb-integ-row-left">
                  <span className="ndb-integ-logo" style={{ background: i.color }}>
                    {i.name.slice(0, 1)}
                  </span>
                  <div>
                    <div className="ndb-integ-name">{i.name}</div>
                    <div className="ndb-integ-detail">{i.detail}</div>
                  </div>
                </div>
                <div className="ndb-integ-row-right">
                  <span className="ndb-integ-sync">
                    {isOn ? `Last sync: ${i.lastSync}` : 'Not connected'}
                  </span>
                  <button
                    type="button"
                    className={`ndb-toggle ${isOn ? 'is-on' : ''}`}
                    onClick={() => setToggled((prev) => ({ ...prev, [i.name]: !prev[i.name] }))}
                    aria-pressed={isOn}
                    aria-label={`${isOn ? 'Disconnect' : 'Connect'} ${i.name}`}
                  >
                    <span className="ndb-toggle-knob" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

// ── Settings view ───────────────────────────────────────────────────────────

function SettingsView({
  profile,
  onChangePlan,
  onUpdateCard,
}: {
  profile: DemoProfile
  onChangePlan: () => void
  onUpdateCard: () => void
}) {
  const [emailNotif, setEmailNotif] = useState(true)
  const [paymentNotif, setPaymentNotif] = useState(true)
  const [reportNotif, setReportNotif] = useState(false)
  const [revealKey, setRevealKey] = useState(false)

  const canceled = profile.subscription_status === 'canceled'

  const apiKey = `nim_live_${hashFromString(profile.name).toString(16).padStart(8, '0')}d4cf2b7a91f0`

  return (
    <>
      <div className="ndb-greeting">
        <h1>Settings</h1>
        <p>Profile, billing, notifications, API keys — all in one place.</p>
      </div>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Profile</h2>
        </div>
        <div className="ndb-settings-grid">
          <div className="ndb-settings-field">
            <label htmlFor="ndb-profile-name">Full name</label>
            <input
              id="ndb-profile-name"
              type="text"
              defaultValue={profile.name}
              className="ndb-input"
            />
          </div>
          <div className="ndb-settings-field">
            <label htmlFor="ndb-profile-email">Work email</label>
            <input
              id="ndb-profile-email"
              type="email"
              defaultValue={`${profile.name.toLowerCase().replace(/\s+/g, '.')}@nimbus.finance`}
              className="ndb-input"
            />
          </div>
          <div className="ndb-settings-field">
            <label htmlFor="ndb-profile-company">Company</label>
            <input
              id="ndb-profile-company"
              type="text"
              defaultValue="Nimbus Finance, Inc."
              className="ndb-input"
            />
          </div>
          <div className="ndb-settings-field">
            <label htmlFor="ndb-profile-tz">Time zone</label>
            <select id="ndb-profile-tz" className="ndb-input">
              <option>(UTC-08:00) Pacific Time</option>
              <option>(UTC-05:00) Eastern Time</option>
              <option>(UTC+00:00) UTC</option>
              <option>(UTC+01:00) Central European</option>
            </select>
          </div>
        </div>
      </section>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Plan & billing</h2>
        </div>
        <div className="ndb-plan-grid">
          <div className="ndb-plan-card">
            <div className="ndb-plan-name">
              {profile.plan_label}
              {canceled ? (
                <span className="ndb-plan-canceled">Canceled</span>
              ) : (
                <span className="ndb-plan-current">Current plan</span>
              )}
            </div>
            <div className="ndb-plan-price">
              ${profile.last_invoice_amount_usd}
              <span>/mo</span>
            </div>
            <div className="ndb-plan-meta">
              {canceled
                ? `Access ends on ${fmtDateLong(profile.next_invoice_date)}`
                : `Renews on ${fmtDateLong(profile.next_invoice_date)}`}
            </div>
            <div className="ndb-plan-actions">
              <button type="button" className="ndb-primary-btn" onClick={onChangePlan}>
                Change plan
              </button>
              {canceled ? (
                <button
                  type="button"
                  className="ndb-secondary-btn"
                  onClick={() => updateDemoProfile({ subscription_status: 'active' })}
                >
                  Reactivate
                </button>
              ) : (
                <button
                  type="button"
                  className="ndb-secondary-btn"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Cancel your subscription? Access ends at the current billing period.'
                      )
                    ) {
                      updateDemoProfile({ subscription_status: 'canceled' })
                    }
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
          <div className="ndb-plan-card">
            <div className="ndb-plan-name">Payment method</div>
            <div className="ndb-plan-card-info">
              <span className="ndb-card-chip">{profile.card.brand}</span>
              •••• {profile.card.last4}
              <span className="ndb-plan-card-exp">Exp {profile.card.exp}</span>
            </div>
            <div className="ndb-plan-meta">Billed monthly · auto-renews</div>
            <div className="ndb-plan-actions">
              <button type="button" className="ndb-secondary-btn" onClick={onUpdateCard}>
                Update card
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>Notifications</h2>
          <span className="ndb-card-sub">Toggles are local to this demo session</span>
        </div>
        <ul className="ndb-notif-list">
          <NotifRow
            label="Invoice paid"
            sub="Email me when a customer pays"
            on={emailNotif}
            onChange={setEmailNotif}
          />
          <NotifRow
            label="Failed payment"
            sub="Slack alert when a card declines"
            on={paymentNotif}
            onChange={setPaymentNotif}
          />
          <NotifRow
            label="Weekly report"
            sub="Friday digest with cash flow + top customers"
            on={reportNotif}
            onChange={setReportNotif}
          />
        </ul>
      </section>

      <section className="ndb-card">
        <div className="ndb-card-head">
          <h2>API keys</h2>
          <span className="ndb-card-sub">Use these to integrate Nimbus with your stack</span>
        </div>
        <div className="ndb-api-row">
          <div className="ndb-api-info">
            <div className="ndb-api-label">Live key</div>
            <code className="ndb-api-key">
              {revealKey ? apiKey : '••••••••••••••••••••••••••••••••'}
            </code>
          </div>
          <button
            type="button"
            className="ndb-secondary-btn"
            onClick={() => setRevealKey((v) => !v)}
          >
            {revealKey ? 'Hide' : 'Reveal'}
          </button>
          <button
            type="button"
            className="ndb-secondary-btn"
            onClick={() => {
              if (revealKey) navigator.clipboard.writeText(apiKey).catch(() => {})
            }}
            disabled={!revealKey}
          >
            Copy
          </button>
          <button type="button" className="ndb-danger-btn">
            Rotate
          </button>
        </div>
      </section>

      <section className="ndb-card ndb-card-danger">
        <div className="ndb-card-head">
          <h2>Danger zone</h2>
        </div>
        <div className="ndb-danger-row">
          <div>
            <div className="ndb-danger-title">
              {canceled ? 'Reactivate subscription' : 'Cancel subscription'}
            </div>
            <div className="ndb-danger-sub">
              {canceled
                ? 'Resume billing and restore access immediately.'
                : 'Your account will stay active until end of current period.'}
            </div>
          </div>
          {canceled ? (
            <button
              type="button"
              className="ndb-secondary-btn"
              onClick={() => updateDemoProfile({ subscription_status: 'active' })}
            >
              Reactivate
            </button>
          ) : (
            <button
              type="button"
              className="ndb-danger-btn"
              onClick={() => {
                if (
                  window.confirm(
                    'Cancel your subscription? Access ends at the current billing period.'
                  )
                ) {
                  updateDemoProfile({ subscription_status: 'canceled' })
                }
              }}
            >
              Cancel subscription
            </button>
          )}
        </div>
        <div className="ndb-danger-row">
          <div>
            <div className="ndb-danger-title">Delete account</div>
            <div className="ndb-danger-sub">
              Permanently delete this Nimbus account and all data.
            </div>
          </div>
          <button
            type="button"
            className="ndb-danger-btn"
            onClick={() =>
              window.alert(
                'In a real Nimbus account this would delete all your data. In the demo it stays put.'
              )
            }
          >
            Delete account
          </button>
        </div>
      </section>
    </>
  )
}

// ── Small reusable bits ─────────────────────────────────────────────────────

function StatusPill({ status }: { status: Invoice['status'] }) {
  return <span className={`ndb-pill ndb-pill-${status.toLowerCase()}`}>{status}</span>
}

function CustomerStatusPill({ status }: { status: Customer['status'] }) {
  const klass =
    status === 'Active'
      ? 'ndb-pill-paid'
      : status === 'Trialing'
        ? 'ndb-pill-pending'
        : status === 'Past due'
          ? 'ndb-pill-overdue'
          : 'ndb-pill-muted'
  return <span className={`ndb-pill ${klass}`}>{status}</span>
}

function NotifRow({
  label,
  sub,
  on,
  onChange,
}: {
  label: string
  sub: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <li className="ndb-notif-row">
      <div>
        <div className="ndb-notif-label">{label}</div>
        <div className="ndb-notif-sub">{sub}</div>
      </div>
      <button
        type="button"
        className={`ndb-toggle ${on ? 'is-on' : ''}`}
        onClick={() => onChange(!on)}
        aria-pressed={on}
        aria-label={label}
      >
        <span className="ndb-toggle-knob" />
      </button>
    </li>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

// ── Upgrade plan modal ──────────────────────────────────────────────────────

function UpgradePlanModal({
  open,
  currentPlan,
  onClose,
}: {
  open: boolean
  currentPlan: PlanTier
  onClose: () => void
}) {
  const [selected, setSelected] = useState<PlanTier>(currentPlan)
  // Reset selection when the modal opens or the current plan changes. Uses
  // the React-recommended "store info in previous render" pattern instead
  // of a setState-in-effect (which violates react-hooks/set-state-in-effect).
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevSyncKey, setPrevSyncKey] = useState<string | null>(null)
  const syncKey = open ? `open:${currentPlan}` : 'closed'
  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey)
    if (open) setSelected(currentPlan)
  }

  if (!open) return null

  const handleConfirm = () => {
    const changed = selected !== currentPlan
    // Close FIRST so the modal animates out cleanly. THEN update the profile
    // on the next frame. Without this defer, the profile change synchronously
    // re-renders the dashboard (20 invoices + 14 customers + 14 expenses + 12
    // revenue months all regenerate via useMemo) BEFORE the modal can paint
    // its close transition — visitors see a brief white flash between the
    // confirm click and the modal disappearing.
    onClose()
    if (changed) {
      requestAnimationFrame(() => {
        updateDemoProfile({ plan: selected, subscription_status: 'active' })
      })
    }
  }

  return (
    <div
      className="ndb-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="ndb-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-title">
        <header className="ndb-modal-head">
          <div>
            <h2 id="upgrade-title">Change your plan</h2>
            <p>Pick the plan that fits your team. Changes apply immediately in the demo.</p>
          </div>
          <button type="button" className="ndb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ndb-plan-options">
          {PLAN_TIERS.map((tier) => {
            const d = PLAN_DETAILS[tier]
            const isSelected = selected === tier
            const isCurrent = currentPlan === tier
            return (
              <button
                key={tier}
                type="button"
                className={`ndb-plan-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelected(tier)}
                aria-pressed={isSelected}
              >
                <div className="ndb-plan-option-head">
                  <span className="ndb-plan-option-name">{d.label}</span>
                  {isCurrent && <span className="ndb-plan-current">Current</span>}
                </div>
                <div className="ndb-plan-option-price">
                  ${d.price}
                  <span>/mo</span>
                </div>
                <div className="ndb-plan-option-tagline">{d.tagline}</div>
                <ul className="ndb-plan-option-features">
                  {d.features.map((f) => (
                    <li key={f}>
                      <span aria-hidden="true">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        <footer className="ndb-modal-foot">
          <button type="button" className="ndb-secondary-btn" onClick={onClose}>
            Keep current plan
          </button>
          <button
            type="button"
            className="ndb-primary-btn"
            onClick={handleConfirm}
            disabled={selected === currentPlan}
          >
            {selected === currentPlan
              ? `You're on ${PLAN_DETAILS[selected].label}`
              : selected > currentPlan
                ? `Upgrade to ${PLAN_DETAILS[selected].label}`
                : `Switch to ${PLAN_DETAILS[selected].label}`}
          </button>
        </footer>
      </div>
    </div>
  )
}

// ── Update card modal ──────────────────────────────────────────────────────

function UpdateCardModal({
  open,
  currentCard,
  onClose,
}: {
  open: boolean
  currentCard: PaymentCard
  onClose: () => void
}) {
  const [brand, setBrand] = useState<CardBrand>(currentCard.brand)
  const [cardNumber, setCardNumber] = useState('')
  const [exp, setExp] = useState(currentCard.exp)
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSave = () => {
    setError(null)
    // Pull last 4 digits from however the visitor typed the card number
    const digits = cardNumber.replace(/\D/g, '')
    if (digits.length < 4) {
      setError('Enter at least the last 4 digits of the card.')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(exp)) {
      setError('Expiry must be MM/YY.')
      return
    }
    updateDemoProfile({
      card: { brand, last4: digits.slice(-4), exp },
    })
    setCardNumber('')
    setCvc('')
    onClose()
  }

  return (
    <div
      className="ndb-modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="ndb-modal ndb-modal-narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-title"
      >
        <header className="ndb-modal-head">
          <div>
            <h2 id="card-title">Update payment method</h2>
            <p>Saved locally for this demo session. No real card processed.</p>
          </div>
          <button type="button" className="ndb-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="ndb-modal-body">
          <div className="ndb-form-row" role="group" aria-labelledby="ndb-card-brand-label">
            <span id="ndb-card-brand-label" className="ndb-form-label">
              Card brand
            </span>
            <div className="ndb-brand-row">
              {(['VISA', 'Mastercard', 'Amex', 'Discover'] as CardBrand[]).map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`ndb-brand-chip ${brand === b ? 'is-selected' : ''}`}
                  onClick={() => setBrand(b)}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="ndb-form-row">
            <label htmlFor="ndb-card-number">Card number</label>
            <input
              id="ndb-card-number"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="•••• •••• •••• 4242"
              className="ndb-input"
            />
          </div>

          <div className="ndb-form-grid">
            <div className="ndb-form-row">
              <label htmlFor="ndb-card-exp">Expiry</label>
              <input
                id="ndb-card-exp"
                type="text"
                inputMode="numeric"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="ndb-input"
              />
            </div>
            <div className="ndb-form-row">
              <label htmlFor="ndb-card-cvc">CVC</label>
              <input
                id="ndb-card-cvc"
                type="text"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                maxLength={4}
                className="ndb-input"
              />
            </div>
          </div>

          {error && <div className="ndb-modal-error">{error}</div>}
        </div>

        <footer className="ndb-modal-foot">
          <button type="button" className="ndb-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ndb-primary-btn" onClick={handleSave}>
            Save card
          </button>
        </footer>
      </div>
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .ndb-root {
        min-height: 100vh;
        background: #fbfaf6;
        color: #020308;
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        display: flex;
        flex-direction: column;
      }

      /* Demo banner */
      .ndb-demo-banner {
        position: relative;
        overflow: hidden;
        background: linear-gradient(90deg, #e11d48 0%, #db2777 50%, #c026d3 100%);
        color: white;
        padding: 11px 16px;
        box-shadow: 0 2px 8px rgba(225, 29, 72, 0.18);
      }
      .ndb-banner-bg {
        position: absolute;
        inset: 0;
        opacity: 0.2;
        pointer-events: none;
      }
      .ndb-banner-blur {
        position: absolute;
        top: 50%;
        width: 120px;
        height: 120px;
        border-radius: 9999px;
        filter: blur(40px);
        transform: translateY(-50%);
      }
      .ndb-banner-blur-left { left: -30px; background: #fde68a; }
      .ndb-banner-blur-right { right: -30px; background: #ddd6fe; }
      .ndb-banner-inner {
        position: relative;
        z-index: 1;
        max-width: 1280px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 14px;
        flex-wrap: wrap;
        text-align: center;
      }
      .ndb-banner-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 10px;
        background: rgba(255, 255, 255, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.4);
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        backdrop-filter: blur(4px);
      }
      .ndb-banner-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #fde68a;
        animation: ndb-pulse 1.6s ease-in-out infinite;
      }
      @keyframes ndb-pulse {
        0%, 100% { opacity: 1; }
        50%      { opacity: 0.45; }
      }
      .ndb-banner-msg {
        font-size: 13.5px;
        font-weight: 600;
      }
      .ndb-banner-switch {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        background: white;
        color: #be123c;
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        text-decoration: none;
        white-space: nowrap;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
        transition: background 0.15s ease;
      }
      .ndb-banner-switch:hover {
        background: #fefce8;
      }

      /* Top bar */
      .ndb-topbar {
        display: flex;
        align-items: center;
        gap: 24px;
        padding: 12px 28px;
        background: #ffffff;
        border-bottom: 1px solid rgba(2, 3, 8, 0.08);
        position: sticky;
        top: 0;
        z-index: 20;
      }
      .ndb-brand {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 16px;
      }
      .ndb-brand-mark {
        width: 22px;
        height: 22px;
        color: #4b3edb;
      }
      .ndb-top-nav {
        display: flex;
        gap: 4px;
        margin-left: 8px;
      }
      .ndb-top-link {
        padding: 7px 14px;
        font: inherit;
        font-size: 14px;
        font-weight: 500;
        color: rgba(2, 3, 8, 0.6);
        background: transparent;
        border: 0;
        border-radius: 999px;
        cursor: pointer;
      }
      .ndb-top-link:hover {
        color: #020308;
        background: rgba(2, 3, 8, 0.04);
      }
      .ndb-top-link.is-active {
        color: #020308;
        background: rgba(2, 3, 8, 0.08);
      }
      .ndb-top-actions {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ndb-icon-btn {
        position: relative;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 0;
        background: transparent;
        color: rgba(2, 3, 8, 0.6);
        cursor: pointer;
        display: grid;
        place-items: center;
      }
      .ndb-icon-btn:hover {
        background: rgba(2, 3, 8, 0.06);
        color: #020308;
      }
      .ndb-icon-btn svg { width: 18px; height: 18px; }
      .ndb-bell-dot {
        position: absolute;
        top: 9px;
        right: 9px;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: #ef4444;
        border: 2px solid #ffffff;
      }
      .ndb-user-wrap { position: relative; }
      .ndb-user-btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px 5px 5px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 999px;
        cursor: pointer;
        font: inherit;
        color: #020308;
      }
      .ndb-user-btn:hover {
        background: rgba(2, 3, 8, 0.04);
        border-color: rgba(2, 3, 8, 0.12);
      }
      .ndb-avatar {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: linear-gradient(135deg, #4b3edb, #7c3aed);
        color: white;
        font-size: 11px;
        font-weight: 700;
      }
      .ndb-user-name {
        font-size: 14px;
        font-weight: 500;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ndb-chevron { width: 14px; height: 14px; color: rgba(2, 3, 8, 0.5); }
      .ndb-user-menu {
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        min-width: 240px;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.12);
        border-radius: 12px;
        box-shadow: 0 16px 40px rgba(2, 3, 8, 0.12);
        padding: 6px;
        z-index: 30;
      }
      .ndb-user-menu-header {
        padding: 10px 12px 12px;
        border-bottom: 1px solid rgba(2, 3, 8, 0.06);
        margin-bottom: 4px;
      }
      .ndb-user-menu-name { font-weight: 600; font-size: 14px; }
      .ndb-user-menu-plan {
        font-size: 11px;
        color: rgba(2, 3, 8, 0.55);
        margin-top: 2px;
      }
      .ndb-user-menu-item {
        width: 100%;
        padding: 8px 12px;
        font: inherit;
        font-size: 13px;
        text-align: left;
        background: transparent;
        border: 0;
        border-radius: 8px;
        color: rgba(2, 3, 8, 0.78);
        cursor: pointer;
      }
      .ndb-user-menu-item:hover { background: rgba(2, 3, 8, 0.06); color: #020308; }
      .ndb-user-menu-divider { height: 1px; background: rgba(2, 3, 8, 0.06); margin: 4px 0; }
      .ndb-user-menu-signout { color: #b91c1c; }
      .ndb-user-menu-signout:hover { background: rgba(185, 28, 28, 0.08); color: #991b1b; }

      /* Mobile nav — hidden on desktop, revealed under 760px (see media query) */
      .ndb-mobile-nav {
        display: none;
        gap: 6px;
        padding: 10px 14px;
        background: #ffffff;
        border-bottom: 1px solid rgba(2, 3, 8, 0.08);
        overflow-x: auto;
        scrollbar-width: none;
        position: sticky;
        top: 61px;
        z-index: 19;
      }
      .ndb-mobile-nav::-webkit-scrollbar { display: none; }
      .ndb-mobile-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
        padding: 7px 13px;
        font: inherit;
        font-size: 13px;
        font-weight: 500;
        color: rgba(2, 3, 8, 0.65);
        background: rgba(2, 3, 8, 0.04);
        border: 0;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
      }
      .ndb-mobile-link.is-active {
        background: #020308;
        color: #ffffff;
        font-weight: 600;
      }
      .ndb-mobile-icon { font-size: 14px; }

      /* Body */
      .ndb-body {
        display: grid;
        grid-template-columns: 240px 1fr;
        flex: 1;
        min-height: 0;
      }
      .ndb-sidebar {
        padding: 20px 12px;
        background: #ffffff;
        border-right: 1px solid rgba(2, 3, 8, 0.06);
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .ndb-side-link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: transparent;
        border: 0;
        border-radius: 8px;
        font: inherit;
        font-size: 13.5px;
        color: rgba(2, 3, 8, 0.7);
        cursor: pointer;
        text-align: left;
      }
      .ndb-side-link:hover {
        background: rgba(2, 3, 8, 0.04);
        color: #020308;
      }
      .ndb-side-link.is-active {
        background: rgba(75, 62, 219, 0.08);
        color: #4b3edb;
        font-weight: 600;
      }
      .ndb-side-icon { font-size: 14px; }
      .ndb-side-foot { margin-top: auto; padding-top: 16px; }
      .ndb-trial-card {
        padding: 14px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f3f0e8, #ede9fe);
        border: 1px solid rgba(2, 3, 8, 0.08);
      }
      .ndb-trial-title { font-weight: 600; font-size: 13px; }
      .ndb-trial-meta {
        font-size: 11px;
        color: rgba(2, 3, 8, 0.6);
        margin: 4px 0 10px;
      }
      .ndb-trial-upgrade {
        width: 100%;
        padding: 6px 10px;
        background: #020308;
        color: white;
        border: 0;
        border-radius: 999px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }

      .ndb-main {
        padding: 28px 32px 48px;
        overflow-y: auto;
        max-height: calc(100vh - 60px - 44px);
      }
      .ndb-greeting h1 {
        margin: 0;
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .ndb-greeting p {
        margin: 4px 0 0;
        color: rgba(2, 3, 8, 0.6);
        font-size: 14px;
      }

      /* KPI grid */
      .ndb-kpis {
        margin-top: 22px;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 12px;
      }
      .ndb-kpi {
        padding: 16px 18px;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.08);
        border-radius: 12px;
      }
      .ndb-kpi-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(2, 3, 8, 0.55);
        font-weight: 600;
      }
      .ndb-kpi-value {
        font-size: 22px;
        font-weight: 600;
        margin-top: 4px;
      }
      .ndb-kpi-trend {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-kpi-trend.is-up { color: #047857; }
      .ndb-kpi-trend.is-down { color: #b91c1c; }
      .ndb-stat-pair { display: flex; align-items: baseline; gap: 10px; margin-top: 4px; }
      .ndb-stat-pair strong { font-size: 22px; font-weight: 600; }

      /* Card */
      .ndb-card {
        margin-top: 18px;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.08);
        border-radius: 12px;
        padding: 18px 20px;
      }
      .ndb-card-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 16px;
      }
      .ndb-card-head h2 { margin: 0; font-size: 14px; font-weight: 600; }
      .ndb-card-sub { font-size: 12px; color: rgba(2, 3, 8, 0.55); }
      .ndb-link-btn {
        background: transparent;
        border: 0;
        color: #4b3edb;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
      }
      .ndb-link-btn:hover { text-decoration: underline; }

      /* Tables */
      .ndb-table { display: flex; flex-direction: column; }
      .ndb-table-head, .ndb-table-row {
        display: grid;
        grid-template-columns: 110px 1.4fr 0.8fr 0.8fr 0.6fr;
        gap: 16px;
        align-items: center;
      }
      .ndb-table-wide .ndb-table-head,
      .ndb-table-wide .ndb-table-row {
        grid-template-columns: 100px 1.3fr 0.8fr 0.8fr 0.8fr 0.7fr 32px;
      }
      .ndb-table-head {
        padding: 6px 0 10px;
        border-bottom: 1px solid rgba(2, 3, 8, 0.08);
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(2, 3, 8, 0.5);
        font-weight: 600;
      }
      .ndb-table-row {
        padding: 11px 0;
        border-bottom: 1px solid rgba(2, 3, 8, 0.05);
        font-size: 13.5px;
      }
      .ndb-table-row:last-child { border-bottom: 0; }
      .ndb-table-id {
        font-family: ui-monospace, monospace;
        color: #4b3edb;
        font-weight: 500;
      }
      .ndb-table-muted { color: rgba(2, 3, 8, 0.55); }
      .ndb-pill {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }
      .ndb-pill-paid { background: rgba(16, 185, 129, 0.12); color: #047857; }
      .ndb-pill-pending { background: rgba(245, 158, 11, 0.12); color: #b45309; }
      .ndb-pill-overdue { background: rgba(220, 38, 38, 0.1); color: #b91c1c; }
      .ndb-pill-muted { background: rgba(2, 3, 8, 0.06); color: rgba(2, 3, 8, 0.6); }

      .ndb-row-btn {
        background: transparent;
        border: 0;
        color: rgba(2, 3, 8, 0.5);
        cursor: pointer;
        font-size: 14px;
        padding: 0 4px;
      }
      .ndb-row-btn:hover { color: #020308; }
      .ndb-empty {
        text-align: center;
        padding: 24px 0;
        color: rgba(2, 3, 8, 0.5);
        font-size: 13px;
      }

      /* Toolbar */
      .ndb-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .ndb-toolbar-title { margin: 0; font-size: 14px; font-weight: 600; }
      .ndb-tabs {
        display: flex;
        gap: 4px;
        background: rgba(2, 3, 8, 0.04);
        padding: 4px;
        border-radius: 999px;
      }
      .ndb-tab {
        padding: 5px 12px;
        font: inherit;
        font-size: 12.5px;
        font-weight: 500;
        background: transparent;
        border: 0;
        border-radius: 999px;
        color: rgba(2, 3, 8, 0.6);
        cursor: pointer;
      }
      .ndb-tab.is-active {
        background: #ffffff;
        color: #020308;
        box-shadow: 0 1px 2px rgba(2, 3, 8, 0.08);
      }
      .ndb-toolbar-right {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ndb-search {
        padding: 7px 12px;
        font: inherit;
        font-size: 13px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.14);
        border-radius: 999px;
        min-width: 220px;
      }
      .ndb-search:focus {
        outline: none;
        border-color: #4b3edb;
        background: white;
      }
      .ndb-primary-btn,
      .ndb-secondary-btn,
      .ndb-danger-btn {
        padding: 7px 14px;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        border-radius: 999px;
        cursor: pointer;
        white-space: nowrap;
      }
      .ndb-primary-btn { background: #020308; color: white; border: 0; }
      .ndb-primary-btn:hover { background: #1a1d22; }
      .ndb-secondary-btn { background: white; color: #020308; border: 1px solid rgba(2, 3, 8, 0.18); }
      .ndb-secondary-btn:hover { background: rgba(2, 3, 8, 0.04); }
      .ndb-secondary-btn:disabled { opacity: 0.4; cursor: not-allowed; }
      .ndb-danger-btn { background: rgba(220, 38, 38, 0.08); color: #b91c1c; border: 1px solid rgba(220, 38, 38, 0.18); }
      .ndb-danger-btn:hover { background: rgba(220, 38, 38, 0.14); }

      /* Expenses list (shared) */
      .ndb-expense-list { list-style: none; margin: 0; padding: 0; }
      .ndb-expense-row {
        display: grid;
        grid-template-columns: 28px 100px 1fr 80px;
        gap: 10px;
        align-items: center;
        padding: 8px 0;
        font-size: 13px;
      }
      .ndb-expense-icon { font-size: 14px; }
      .ndb-expense-label { font-weight: 500; }
      .ndb-expense-bar {
        height: 6px;
        background: rgba(2, 3, 8, 0.06);
        border-radius: 999px;
        overflow: hidden;
      }
      .ndb-expense-fill {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #4b3edb, #7c3aed);
        border-radius: 999px;
      }
      .ndb-expense-amount {
        text-align: right;
        font-family: ui-monospace, monospace;
        font-size: 12.5px;
      }

      /* Two col */
      .ndb-two-col {
        margin-top: 18px;
        display: grid;
        grid-template-columns: 1.2fr 1fr;
        gap: 18px;
      }
      .ndb-two-col .ndb-card { margin-top: 0; }

      /* Activity */
      .ndb-activity {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ndb-activity li {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        font-size: 13px;
      }
      .ndb-activity strong { font-weight: 600; margin-right: 4px; }
      .ndb-activity-dot {
        flex-shrink: 0;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        margin-top: 6px;
      }
      .ndb-activity-dot-success { background: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.16); }
      .ndb-activity-dot-warn { background: #f59e0b; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.16); }
      .ndb-activity-time {
        display: block;
        font-size: 11px;
        color: rgba(2, 3, 8, 0.5);
        margin-top: 2px;
      }

      /* Integrations grid + list */
      .ndb-integ-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }
      .ndb-integ-card {
        display: grid;
        grid-template-columns: 8px 1fr auto;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.06);
        border-radius: 8px;
      }
      .ndb-integ-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
      }
      .ndb-integ-name { font-size: 13px; font-weight: 600; }
      .ndb-integ-detail { font-size: 11px; color: rgba(2, 3, 8, 0.55); margin-top: 2px; }

      .ndb-integ-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ndb-integ-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 14px 16px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.06);
        border-radius: 10px;
      }
      .ndb-integ-row-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
      }
      .ndb-integ-logo {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        color: white;
        font-weight: 700;
        font-size: 14px;
      }
      .ndb-integ-row-right {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .ndb-integ-sync {
        font-size: 11.5px;
        color: rgba(2, 3, 8, 0.55);
      }

      /* Toggle */
      .ndb-toggle {
        position: relative;
        width: 38px;
        height: 22px;
        border-radius: 999px;
        background: rgba(2, 3, 8, 0.18);
        border: 0;
        cursor: pointer;
        transition: background 0.18s ease;
      }
      .ndb-toggle.is-on { background: #10b981; }
      .ndb-toggle-knob {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: white;
        box-shadow: 0 1px 3px rgba(2, 3, 8, 0.2);
        transition: transform 0.18s ease;
      }
      .ndb-toggle.is-on .ndb-toggle-knob {
        transform: translateX(16px);
      }

      /* Chart */
      .ndb-chart {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        height: 200px;
        padding: 12px 4px 0;
      }
      .ndb-chart-col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .ndb-chart-bar {
        width: 100%;
        max-width: 36px;
        background: linear-gradient(180deg, #4b3edb, #7c3aed);
        border-radius: 4px 4px 0 0;
        transition: opacity 0.2s ease;
      }
      .ndb-chart-bar:hover { opacity: 0.85; }
      .ndb-chart-label {
        font-size: 11px;
        color: rgba(2, 3, 8, 0.5);
      }

      /* Rank list */
      .ndb-rank {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .ndb-rank li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        font-size: 13.5px;
        border-bottom: 1px solid rgba(2, 3, 8, 0.05);
      }
      .ndb-rank li:last-child { border-bottom: 0; }
      .ndb-rank-num {
        width: 22px;
        height: 22px;
        display: grid;
        place-items: center;
        border-radius: 999px;
        background: rgba(75, 62, 219, 0.08);
        color: #4b3edb;
        font-size: 11px;
        font-weight: 700;
      }
      .ndb-rank-name { flex: 1; font-weight: 500; }
      .ndb-rank-amount { font-family: ui-monospace, monospace; font-size: 12.5px; }
      .ndb-note {
        margin: 12px 0 0;
        padding: 10px 12px;
        background: rgba(220, 38, 38, 0.05);
        border-left: 3px solid rgba(220, 38, 38, 0.4);
        border-radius: 6px;
        font-size: 12.5px;
        color: rgba(2, 3, 8, 0.78);
      }
      .ndb-note strong { color: #b91c1c; }

      /* Health grid */
      .ndb-health-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
      }
      .ndb-health-cell {
        padding: 14px 16px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.06);
        border-radius: 8px;
        text-align: center;
      }
      .ndb-health-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(2, 3, 8, 0.55);
        font-weight: 600;
        margin-bottom: 4px;
      }
      .ndb-health-value {
        font-size: 22px;
        font-weight: 600;
      }

      /* Customer avatar */
      .ndb-cust-avatar {
        display: inline-grid;
        place-items: center;
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: linear-gradient(135deg, #4b3edb, #7c3aed);
        color: white;
        font-size: 11px;
        font-weight: 700;
      }

      /* Settings */
      .ndb-settings-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .ndb-settings-field { display: flex; flex-direction: column; gap: 6px; }
      .ndb-settings-field label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.78);
      }
      .ndb-input {
        padding: 9px 12px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.14);
        border-radius: 8px;
        font: inherit;
        font-size: 13.5px;
        color: #020308;
      }
      .ndb-input:focus {
        outline: none;
        border-color: #4b3edb;
        background: white;
      }

      .ndb-plan-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
      .ndb-plan-card {
        padding: 18px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.08);
        border-radius: 10px;
      }
      .ndb-plan-name {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .ndb-plan-current {
        background: rgba(16, 185, 129, 0.14);
        color: #047857;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 3px 8px;
        border-radius: 999px;
      }
      .ndb-plan-price {
        font-size: 30px;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .ndb-plan-price span {
        font-size: 14px;
        font-weight: 400;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-plan-meta {
        font-size: 12px;
        color: rgba(2, 3, 8, 0.55);
        margin-bottom: 14px;
      }
      .ndb-plan-card-info {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ndb-card-chip {
        font-family: ui-sans-serif, sans-serif;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.06em;
        padding: 2px 6px;
        background: #020308;
        color: white;
        border-radius: 3px;
      }
      .ndb-plan-card-exp {
        font-size: 11.5px;
        color: rgba(2, 3, 8, 0.55);
        margin-left: 4px;
      }
      .ndb-plan-actions {
        display: flex;
        gap: 8px;
      }

      .ndb-notif-list { list-style: none; margin: 0; padding: 0; }
      .ndb-notif-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(2, 3, 8, 0.05);
      }
      .ndb-notif-row:last-child { border-bottom: 0; }
      .ndb-notif-label { font-size: 14px; font-weight: 500; }
      .ndb-notif-sub { font-size: 12px; color: rgba(2, 3, 8, 0.55); margin-top: 2px; }

      .ndb-api-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .ndb-api-info { flex: 1; min-width: 220px; }
      .ndb-api-label {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: rgba(2, 3, 8, 0.55);
        font-weight: 600;
        margin-bottom: 4px;
      }
      .ndb-api-key {
        font-family: ui-monospace, monospace;
        font-size: 13px;
        padding: 7px 10px;
        background: #fbfaf6;
        border: 1px solid rgba(2, 3, 8, 0.1);
        border-radius: 6px;
        display: inline-block;
        word-break: break-all;
      }

      .ndb-card-danger { border-color: rgba(220, 38, 38, 0.18); }
      .ndb-danger-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(2, 3, 8, 0.05);
        gap: 12px;
      }
      .ndb-danger-row:last-child { border-bottom: 0; }
      .ndb-danger-title { font-weight: 500; font-size: 14px; }
      .ndb-danger-sub { font-size: 12px; color: rgba(2, 3, 8, 0.55); margin-top: 2px; }

      /* AI prompt nudge */
      .ndb-prompt {
        margin-top: 18px;
        padding: 16px 20px;
        background: linear-gradient(135deg, rgba(75, 62, 219, 0.06), rgba(124, 58, 237, 0.04));
        border: 1px dashed rgba(75, 62, 219, 0.3);
        border-radius: 12px;
      }
      .ndb-prompt-eyebrow {
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #4b3edb;
        font-weight: 700;
        margin-bottom: 4px;
      }
      .ndb-prompt p {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.55;
        color: rgba(2, 3, 8, 0.78);
      }
      .ndb-prompt em {
        background: #ffffff;
        padding: 1px 6px;
        border-radius: 4px;
        font-style: normal;
        font-family: ui-monospace, monospace;
        font-size: 12px;
        border: 1px solid rgba(2, 3, 8, 0.1);
      }

      /* Open issue toast */
      .ndb-open-issue {
        position: fixed;
        bottom: 24px;
        left: 24px;
        z-index: 8000;
        max-width: 340px;
        padding: 14px 16px;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.12);
        border-left: 3px solid #f59e0b;
        border-radius: 10px;
        box-shadow: 0 14px 40px rgba(2, 3, 8, 0.14);
      }
      .ndb-open-issue-eyebrow {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #b45309;
        margin-bottom: 4px;
      }
      .ndb-open-issue p {
        margin: 0 0 6px;
        font-size: 13px;
        line-height: 1.45;
      }
      .ndb-open-issue-cta {
        font-size: 11.5px !important;
        color: rgba(2, 3, 8, 0.55);
      }

      /* Sidebar plan-mini card (replaces the trial card) */
      .ndb-plan-mini {
        padding: 14px;
        border-radius: 12px;
        background: linear-gradient(135deg, #f3f0e8, #ede9fe);
        border: 1px solid rgba(2, 3, 8, 0.08);
      }
      .ndb-plan-mini-eyebrow {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-plan-mini-name {
        margin-top: 2px;
        font-size: 14px;
        font-weight: 700;
      }
      .ndb-plan-mini-price {
        margin-top: 2px;
        font-size: 17px;
        font-weight: 700;
      }
      .ndb-plan-mini-price span {
        font-size: 11px;
        color: rgba(2, 3, 8, 0.55);
        font-weight: 400;
      }
      .ndb-plan-mini-meta {
        margin-top: 6px;
        font-size: 11px;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-plan-mini-canceled {
        margin-top: 6px;
        font-size: 11px;
        color: #b91c1c;
        font-weight: 600;
      }
      .ndb-plan-mini-btn {
        margin-top: 10px;
        width: 100%;
        padding: 6px 10px;
        background: #020308;
        color: white;
        border: 0;
        border-radius: 999px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
      }
      .ndb-plan-mini-btn:hover { background: #1a1d22; }

      /* Greeting row with plan badge */
      .ndb-greeting-row {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }
      .ndb-plan-badge {
        padding: 12px 16px;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.08);
        border-radius: 12px;
        min-width: 200px;
      }
      .ndb-plan-badge-eyebrow {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-plan-badge-name {
        margin-top: 4px;
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 10px;
        font-size: 16px;
        font-weight: 700;
      }
      .ndb-plan-badge-price {
        font-size: 13px;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.65);
      }
      .ndb-plan-badge-price span {
        font-size: 11px;
        color: rgba(2, 3, 8, 0.5);
        font-weight: 400;
      }
      .ndb-plan-badge-btn {
        margin-top: 8px;
        width: 100%;
      }
      .ndb-plan-canceled {
        background: rgba(220, 38, 38, 0.12);
        color: #b91c1c;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 3px 8px;
        border-radius: 999px;
      }

      /* Modals */
      .ndb-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9100;
        display: grid;
        place-items: center;
        padding: 24px;
        background: rgba(2, 3, 8, 0.55);
        backdrop-filter: blur(6px);
        animation: ndb-fade 0.18s ease-out;
      }
      @keyframes ndb-fade { from { opacity: 0; } to { opacity: 1; } }
      .ndb-modal {
        background: #fbfaf6;
        border-radius: 16px;
        border: 1px solid rgba(2, 3, 8, 0.12);
        box-shadow: 0 24px 72px rgba(2, 3, 8, 0.22);
        max-width: 760px;
        width: 100%;
        max-height: calc(100vh - 48px);
        overflow-y: auto;
        animation: ndb-rise 0.22s ease-out;
      }
      .ndb-modal-narrow { max-width: 480px; }
      @keyframes ndb-rise {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .ndb-modal-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 22px 24px 12px;
      }
      .ndb-modal-head h2 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 600;
      }
      .ndb-modal-head p {
        margin: 0;
        font-size: 13px;
        color: rgba(2, 3, 8, 0.6);
      }
      .ndb-modal-close {
        width: 28px;
        height: 28px;
        border: 0;
        background: transparent;
        border-radius: 999px;
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-modal-close:hover {
        background: rgba(2, 3, 8, 0.06);
        color: #020308;
      }
      .ndb-modal-body {
        padding: 8px 24px 16px;
      }
      .ndb-modal-foot {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        padding: 14px 24px 22px;
      }
      .ndb-modal-error {
        margin-top: 10px;
        padding: 9px 12px;
        background: rgba(220, 38, 38, 0.08);
        border-left: 3px solid rgba(220, 38, 38, 0.6);
        border-radius: 6px;
        font-size: 13px;
        color: #991b1b;
      }

      /* Plan options grid */
      .ndb-plan-options {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        padding: 8px 24px 16px;
      }
      .ndb-plan-option {
        text-align: left;
        background: #ffffff;
        border: 1.5px solid rgba(2, 3, 8, 0.12);
        border-radius: 12px;
        padding: 16px 14px;
        cursor: pointer;
        transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font: inherit;
        color: inherit;
      }
      .ndb-plan-option:hover {
        border-color: rgba(2, 3, 8, 0.28);
      }
      .ndb-plan-option.is-selected {
        border-color: #4b3edb;
        background: linear-gradient(135deg, #fbfaf6, #ede9fe);
        box-shadow: 0 4px 12px rgba(75, 62, 219, 0.15);
      }
      .ndb-plan-option-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .ndb-plan-option-name {
        font-size: 15px;
        font-weight: 700;
      }
      .ndb-plan-option-price {
        font-size: 22px;
        font-weight: 700;
      }
      .ndb-plan-option-price span {
        font-size: 12px;
        font-weight: 400;
        color: rgba(2, 3, 8, 0.55);
      }
      .ndb-plan-option-tagline {
        font-size: 12px;
        color: rgba(2, 3, 8, 0.6);
      }
      .ndb-plan-option-features {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
      }
      .ndb-plan-option-features li {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        color: rgba(2, 3, 8, 0.78);
      }
      .ndb-plan-option-features li span {
        color: #047857;
        font-weight: 700;
      }

      /* Card update form */
      .ndb-form-row {
        display: flex;
        flex-direction: column;
        gap: 5px;
        margin-bottom: 12px;
      }
      .ndb-form-row label {
        font-size: 12px;
        font-weight: 600;
        color: rgba(2, 3, 8, 0.78);
      }
      .ndb-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .ndb-brand-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .ndb-brand-chip {
        padding: 6px 12px;
        font: inherit;
        font-size: 12px;
        font-weight: 600;
        color: #020308;
        background: #ffffff;
        border: 1px solid rgba(2, 3, 8, 0.14);
        border-radius: 999px;
        cursor: pointer;
      }
      .ndb-brand-chip:hover {
        border-color: rgba(2, 3, 8, 0.3);
      }
      .ndb-brand-chip.is-selected {
        background: #020308;
        color: white;
        border-color: #020308;
      }

      /* Responsive */
      @media (max-width: 1100px) {
        .ndb-kpis { grid-template-columns: repeat(2, 1fr); }
        .ndb-two-col { grid-template-columns: 1fr; }
        .ndb-plan-grid, .ndb-settings-grid { grid-template-columns: 1fr; }
        .ndb-plan-options { grid-template-columns: 1fr; }
      }
      @media (max-width: 760px) {
        .ndb-body { grid-template-columns: 1fr; }
        .ndb-sidebar { display: none; }
        .ndb-top-nav { display: none; }
        .ndb-mobile-nav { display: flex; }
        .ndb-topbar { gap: 12px; padding: 12px 16px; }
        .ndb-main { padding: 22px 18px 48px; }
        .ndb-user-name { display: none; }
        .ndb-table-head, .ndb-table-row {
          grid-template-columns: 80px 1fr 70px;
        }
        .ndb-table-head span:nth-child(n + 4),
        .ndb-table-row span:nth-child(n + 4) { display: none; }
        .ndb-table-wide .ndb-table-head,
        .ndb-table-wide .ndb-table-row {
          grid-template-columns: 80px 1fr 70px;
        }
        .ndb-open-issue { left: 12px; right: 12px; max-width: none; bottom: 96px; }
        .ndb-toolbar { flex-direction: column; align-items: stretch; }
        .ndb-toolbar-right { margin-left: 0; flex-wrap: wrap; }
        .ndb-banner-msg { font-size: 12px; }
        .ndb-banner-switch { font-size: 10px; padding: 3px 8px; }
        .ndb-health-grid { grid-template-columns: 1fr 1fr; }
        .ndb-greeting-row { flex-direction: column; }
        .ndb-plan-badge { width: 100%; }
        .ndb-modal-foot { flex-direction: column-reverse; }
        .ndb-modal-foot .ndb-primary-btn,
        .ndb-modal-foot .ndb-secondary-btn { width: 100%; }
        .ndb-form-grid { grid-template-columns: 1fr; }
      }
      /* Narrow phones (iPhone SE = 375px, iPhone 14 = 390px). The 760px
         tier above already collapses to a single column and hides the
         nav; this tier just tightens the small-screen details so the
         dashboard still reads cleanly when the widget bubble is taking
         up real estate too. Union of two parallel mobile passes — keep
         both sets of rules. */
      @media (max-width: 480px) {
        .ndb-main { padding: 16px 14px 56px; }  /* extra bottom pad clears the widget launcher */
        .ndb-kpis { grid-template-columns: 1fr; }
        .ndb-health-grid { grid-template-columns: 1fr; }
        .ndb-brand-name { font-size: 14px; }
        .ndb-greeting h1 { font-size: 22px; }
        .ndb-banner-inner { gap: 8px; }
        .ndb-banner-pill { font-size: 9px; padding: 2px 8px; }
        .ndb-user-btn { padding: 4px; }
        .ndb-top-actions { gap: 8px; }
        .ndb-toolbar-right .ndb-search { width: 100%; }
        .ndb-toolbar-right .ndb-primary-btn { width: 100%; }
        /* Keep the "open issue" toast clear of the launcher bubble at
           the bottom-right corner — they used to stack and overlap. */
        .ndb-open-issue { bottom: 88px; left: 8px; right: 8px; }
        /* Table fits 2 columns max on a 375px viewport before the
           ticket-number cell starts wrapping unreadably. */
        .ndb-table-head, .ndb-table-row,
        .ndb-table-wide .ndb-table-head,
        .ndb-table-wide .ndb-table-row {
          grid-template-columns: 72px 1fr;
        }
        .ndb-table-head span:nth-child(n + 3),
        .ndb-table-row span:nth-child(n + 3) { display: none; }
      }
    `}</style>
  )
}
