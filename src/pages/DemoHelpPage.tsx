import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { DemoChatHint, TestProfileModal } from '@/components/marketing'
import { useLiraWidget } from '@/lib/demo-widget'
import { useDemoProfile } from '@/lib/demo-profile'

/**
 * Nimbus Help Center — the FULL-PAGE mode of the Lira demo. Lives at
 * /demo/help (and demo.liraintelligence.com/help when DNS is configured).
 *
 * Where DemoSitePage (the marketing site) shows Lira as a corner widget,
 * this page shows what a dedicated support portal deployment looks like —
 * chat is the page, not a bubble.
 *
 * Both views mount the same Lira widget via useLiraWidget(), so a visitor
 * who's been chatting on /demo can switch here and continue the same
 * conversation seamlessly. The cross-link banner at the top supports the
 * switch.
 *
 * See: docs/platform/customer-support/INTERACTIVE_DEMO_PLATFORM.md Section 3
 * Decision A for the design rationale.
 */

// ── Popular question cards — each opens the widget with a suggested prompt ─

const POPULAR_QUESTIONS = [
  {
    icon: '💳',
    question: 'How do refunds work?',
    description: '30-day no-questions-asked refund on first paid charge. Prorated after.',
  },
  {
    icon: '🔌',
    question: 'Can I import from QuickBooks?',
    description: 'Yes — one-click import for QuickBooks, Xero, FreshBooks, and Wave.',
  },
  {
    icon: '💰',
    question: 'What does the Business plan cost?',
    description: '$129/month for unlimited users, SSO, advanced permissions, audit logs.',
  },
  {
    icon: '📱',
    question: 'Is there a mobile app?',
    description: 'iOS and Android, free with any plan. Offline mode syncs when back online.',
  },
  {
    icon: '🔒',
    question: 'Is Nimbus SOC 2 compliant?',
    description: 'Yes — SOC 2 Type II certified, audited annually.',
  },
  {
    icon: '🌍',
    question: 'Multi-currency support?',
    description: '136 currencies, daily ECB rates, automatic FX gain/loss entries.',
  },
] as const

const HELP_CATEGORIES = [
  { name: 'Account & Billing', count: 18 },
  { name: 'Invoicing', count: 24 },
  { name: 'Expenses & Receipts', count: 15 },
  { name: 'Reporting', count: 11 },
  { name: 'Integrations', count: 22 },
  { name: 'Security & Privacy', count: 9 },
  { name: 'Mobile Apps', count: 7 },
] as const

export function DemoHelpPage() {
  const { testVisitor } = useLiraWidget()
  const profile = useDemoProfile()
  const navigate = useNavigate()
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  // Visitors without a profile bounce back to the Lira landing page where the
  // DemoEntryModal handles the sign-in flow. Same policy as /demo — no more
  // direct access to a Nimbus help center without first picking a profile.
  useEffect(() => {
    if (!profile) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  if (!profile) return null

  return (
    <div
      style={{ fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif' }}
      className="min-h-screen bg-[#fafaf7] text-slate-900"
    >
      <SEO
        title="Nimbus Help Center — Get answers from our AI agent"
        description="Nimbus help center — chat with our AI agent for instant answers to your invoicing, billing, and account questions. Demo site for the Lira support agent."
        path="/demo/help"
        noIndex
      />

      {/* ── Demo context banner ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 px-4 py-3 text-white shadow-md">
        <div className="absolute inset-0 -z-0 opacity-20" aria-hidden="true">
          <div className="absolute -left-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-yellow-200 blur-3xl" />
          <div className="absolute -right-10 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-violet-300 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white ring-1 ring-white/40 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-200" />
            Lira demo
          </span>
          <span className="text-sm font-semibold leading-snug">
            Nimbus is a fictional company. Open the chat to talk to Lira.
          </span>
          <a
            href="/demo"
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1 text-[11px] font-bold text-rose-700 shadow-sm transition hover:bg-yellow-50"
          >
            Switch to widget on a marketing site →
          </a>
        </div>
      </div>

      {/* ── Test visitor banner (dev-only HMAC-signed identity) ──────────── */}
      {testVisitor && (
        <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2 text-xs font-semibold text-amber-900">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path
              fillRule="evenodd"
              d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.5a.75.75 0 011.5 0v3.25a.75.75 0 01-1.5 0V5.5zm.75 6a.875.875 0 100-1.75.875.875 0 000 1.75z"
              clipRule="evenodd"
            />
          </svg>
          Signed in as <strong>Jane Smith</strong> (jane@nimbus.test) — verified test customer mode
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <a
            href="/demo"
            className="flex items-center gap-2 text-slate-900"
            aria-label="Back to Nimbus"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-6 w-6 text-violet-600"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <span className="text-lg font-bold tracking-tight">Nimbus</span>
            <span className="hidden text-xs font-semibold tracking-wide text-slate-400 sm:inline">
              · Help Center
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <a href="/demo" className="hover:text-slate-900">
              Product
            </a>
            <a href="/demo#pricing" className="hover:text-slate-900">
              Pricing
            </a>
            <a href="/demo#faq" className="hover:text-slate-900">
              FAQ
            </a>
          </nav>
          <a
            href="/demo"
            className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            ← Back to site
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-12 pt-16 text-center md:pt-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-violet-600">
          Nimbus Help Center
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          How can we help?
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
          Search our help center or chat with our AI agent for instant answers. She knows
          your account, your plan, and your history — so you don't have to repeat yourself.
        </p>
      </section>

      {/* ── Chat call-to-action (the main column) ───────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500 px-8 py-10 text-white">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/30 backdrop-blur">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
                  AI Support Agent
                </p>
                <h2 className="mt-1 text-2xl font-bold">Chat with Nimbus support</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/90">
                  Our AI handles refunds, billing questions, account changes, and most
                  technical issues instantly. Real customers reach us via the chat in the
                  bottom-right corner — try it now.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white px-8 py-6">
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Tip:</strong> the chat bubble in the
              bottom-right corner is live. Open it and ask anything — refunds, pricing,
              integrations, the mobile app, our security posture. The AI knows it all.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> AI is online
              </span>
              <span>·</span>
              <span>Average response time: 4 seconds</span>
              <span>·</span>
              <span>Escalates to humans when needed</span>
            </div>
            <div className="mt-5 rounded-lg border border-violet-200 bg-violet-50/60 px-4 py-3 text-sm">
              <strong className="text-violet-900">First time?</strong>{' '}
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="font-semibold text-violet-700 underline underline-offset-2 hover:text-violet-900"
              >
                Create a test profile
              </button>{' '}
              <span className="text-slate-600">
                so Lira knows your plan, last invoice, and open issues when you chat.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Popular questions ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Popular questions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR_QUESTIONS.map((q) => (
            <div
              key={q.question}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-violet-300 hover:shadow-md"
            >
              <div className="mb-2 text-2xl" aria-hidden="true">
                {q.icon}
              </div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">{q.question}</h3>
              <p className="text-xs leading-relaxed text-slate-600">{q.description}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Don't see your question? Open the chat in the bottom-right and ask anything.
        </p>
      </section>

      {/* ── Help categories ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-500">
          Browse by category
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-violet-300"
            >
              <span className="font-medium text-slate-900">{cat.name}</span>
              <span className="text-xs text-slate-500">{cat.count} articles</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Operator-view preview ────────────────────────────────────────── */}
      <OperatorViewPreview />

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-500 sm:flex-row">
          <span>© Nimbus Finance · This is a Lira demo</span>
          <span>
            Powered by{' '}
            <a
              href="https://liraintelligence.com"
              className="font-medium text-violet-600 hover:text-violet-700"
            >
              Lira
            </a>
          </span>
        </div>
      </footer>

      <TestProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
      <DemoChatHint />
    </div>
  )
}

// ── Operator-view preview ───────────────────────────────────────────────────
// A stylized mockup of the support-team inbox. While customers chat with Lira
// via the widget on this page, this is what the org's support team sees in
// the Lira dashboard. Static markup — no live data — addresses Pattern 2 from
// INTERACTIVE_DEMO_PLATFORM.md §3.1 ("the operator side") without committing
// to building the live operator view yet.

const OPERATOR_TICKETS = [
  {
    initials: 'SK',
    name: 'Sarah K.',
    plan: 'Growth',
    preview: 'I was charged twice this month and need a refund...',
    badges: ['billing', 'AI handled'],
    time: '2m',
    selected: true,
  },
  {
    initials: 'JT',
    name: 'James T.',
    plan: 'Business',
    preview: 'QuickBooks sync stopped working yesterday at 4pm',
    badges: ['technical', 'escalated'],
    time: '7m',
    selected: false,
  },
  {
    initials: 'AL',
    name: 'Alicia L.',
    plan: 'Starter',
    preview: 'Can I add a teammate without upgrading my plan?',
    badges: ['account'],
    time: '11m',
    selected: false,
  },
  {
    initials: 'MR',
    name: 'Marco R.',
    plan: 'Growth',
    preview: 'How does the multi-currency feature handle daily rates?',
    badges: ['question', 'AI handled'],
    time: '23m',
    selected: false,
  },
] as const

function OperatorViewPreview() {
  return (
    <section className="bg-slate-100/70 px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
            Behind the scenes
          </p>
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
            What your support team sees
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600">
            While customers chat with Lira here, your support agents see a full inbox view
            with AI-handled conversations, smart routing, and a reasoning trace for every
            action. Auditable, browsable, and built for compliance.
          </p>
        </div>

        {/* Inbox mockup */}
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-xl shadow-slate-900/10">
          {/* App chrome */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-xs font-medium text-slate-500">lira.support / inbox</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                AI Online
              </span>
              <span>3 agents</span>
            </div>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
            {/* Left: ticket list */}
            <div className="border-b border-slate-200 bg-slate-50/40 md:border-b-0 md:border-r">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center gap-2 text-xs">
                  <button className="rounded-md bg-slate-900 px-2.5 py-1 font-medium text-white">
                    All · 24
                  </button>
                  <button className="rounded-md px-2.5 py-1 font-medium text-slate-500">
                    Open · 7
                  </button>
                  <button className="rounded-md px-2.5 py-1 font-medium text-slate-500">
                    Mine · 2
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-slate-100">
                {OPERATOR_TICKETS.map((t) => (
                  <li
                    key={t.name}
                    className={
                      t.selected
                        ? 'border-l-2 border-violet-500 bg-violet-50/60 px-4 py-3'
                        : 'border-l-2 border-transparent px-4 py-3 hover:bg-slate-50'
                    }
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                        {t.initials}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-slate-900">
                        {t.name}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.time}</span>
                    </div>
                    <p className="ml-9 line-clamp-1 text-xs text-slate-500">{t.preview}</p>
                    <div className="ml-9 mt-1.5 flex flex-wrap gap-1">
                      {t.badges.map((b) => (
                        <span
                          key={b}
                          className={
                            b === 'AI handled'
                              ? 'rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700'
                              : b === 'escalated'
                                ? 'rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700'
                                : 'rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600'
                          }
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: conversation detail */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Sarah K. · Growth</p>
                  <p className="text-[11px] text-slate-500">
                    Customer since Feb 14, 2024 · 3 prior tickets · Churn risk 12/100
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  AI resolved
                </span>
              </div>

              {/* Message thread */}
              <div className="space-y-3 px-5 py-4">
                <div className="flex gap-3">
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                    SK
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Sarah · 2m ago
                    </p>
                    <p className="mt-0.5 text-sm text-slate-800">
                      I was charged twice this month and need a refund.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                    L
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-slate-500">
                      Lira · 2m ago · <span className="text-emerald-700">tool: refund_charge</span>
                    </p>
                    <p className="mt-0.5 text-sm text-slate-800">
                      I see two $49 charges on May 14. Processing the duplicate refund now —
                      it'll hit your card in 3–5 business days. Receipt is on its way to your
                      email.
                    </p>
                  </div>
                </div>
              </div>

              {/* AI reasoning trace */}
              <div className="border-t border-slate-200 bg-slate-50/60 px-5 py-3.5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  AI Reasoning Trace · click to expand
                </p>
                <div className="space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex gap-2">
                    <span className="font-mono text-slate-400">1.</span>
                    <span>
                      Classified intent: <strong className="text-slate-800">billing</strong> ·
                      confidence 0.94
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-slate-400">2.</span>
                    <span>
                      Retrieved 3 KB chunks (refund policy, double-charge SOP, Stripe API)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-slate-400">3.</span>
                    <span>
                      Looked up Stripe charges → found duplicate
                      <code className="ml-1 rounded bg-white px-1 py-0.5 font-mono text-[10px] text-slate-700">
                        ch_3ABC...
                      </code>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-slate-400">4.</span>
                    <span>
                      Executed{' '}
                      <code className="rounded bg-white px-1 py-0.5 font-mono text-[10px] text-slate-700">
                        refund_charge(ch_3ABC..., $49)
                      </code>{' '}
                      → success
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono text-slate-400">5.</span>
                    <span>Replied to customer · scheduled follow-up email · resolved</span>
                  </div>
                </div>
              </div>

              {/* Agent assist bar */}
              <div className="mt-auto flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Auto-resolved · no human action needed</span>
                </div>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100">
                  Override
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
              Audit trail
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Every AI decision — KB lookups, confidence scores, tool calls — logged for
              compliance review.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
              Smart routing
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Billing → finance, technical → engineering, compliance → P1. Routes by
              classified intent, not keywords.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-600">
              Human-in-the-loop
            </p>
            <p className="text-sm leading-relaxed text-slate-700">
              Refunds and account changes route through approval gates before execution.
              Configurable per action type.
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          This view is a preview — the live operator dashboard is part of the full Lira
          deployment.{' '}
          <a
            href="/book-demo"
            className="font-semibold text-violet-700 underline underline-offset-2"
          >
            Speak to an expert
          </a>{' '}
          to see it on your stack.
        </p>
      </div>
    </section>
  )
}
