import { Link } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

interface Tier {
  name: string
  price: string
  cadence: string
  blurb: string
  cta: { label: string; href: string }
  highlight?: boolean
  features: string[]
  volume: string
}

const TIERS: Tier[] = [
  {
    name: 'Starter',
    price: '$299',
    cadence: '/ month',
    volume: 'Up to 1,000 conversations / mo',
    blurb: 'Perfect for seed-stage teams replacing a help desk or first support hire.',
    cta: { label: 'Start 14-day trial', href: '/signup' },
    features: [
      'Website chat widget',
      'Email support (inbound + outbound)',
      'Knowledge-base grounded AI replies',
      'Auto-escalation to Slack or email',
      'CSAT scoring after every resolution',
      'Basic analytics dashboard',
      '1 seat + unlimited visitors',
    ],
  },
  {
    name: 'Growth',
    price: '$799',
    cadence: '/ month',
    volume: 'Up to 5,000 conversations / mo',
    blurb: 'For Series A / B SaaS teams scaling support without scaling headcount.',
    cta: { label: 'Start 14-day trial', href: '/signup' },
    highlight: true,
    features: [
      'Everything in Starter',
      'Voice support (inbound phone)',
      'Proactive triggers (abandoned cart, pricing page, trial expiring)',
      'HubSpot, Salesforce, Linear, Slack integrations',
      'Handback + human takeover',
      'Multi-channel inbox',
      'Unlimited seats',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: '',
    volume: 'Unlimited conversations',
    blurb: 'For teams with compliance, custom integrations, or high-volume voice.',
    cta: {
      label: 'Talk to sales',
      href: 'mailto:sales@liraintelligence.com?subject=Lira%20Enterprise%20pricing',
    },
    features: [
      'Everything in Growth',
      'SSO (SAML, Okta, Google Workspace)',
      'Custom integrations (Zendesk, Intercom migration)',
      'Dedicated voice numbers + custom routing',
      'SOC 2 reports + DPA',
      'Private VPC / on-prem embeddings (on request)',
      'Dedicated account manager + SLA',
    ],
  },
]

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What counts as a conversation?',
    a: 'Any thread where a customer reaches out and Lira (or a human) replies at least once — regardless of channel (chat, email, or voice). Proactive messages only count if the customer replies.',
  },
  {
    q: 'Do I pay more if Lira escalates to my team?',
    a: 'No. Escalated conversations still count as one — you only pay once per conversation, not per message.',
  },
  {
    q: 'What happens if I go over my plan?',
    a: "We'll email you at 80% and 100% of your monthly cap. Conversations above the cap are charged at $0.30 each (Starter) or $0.20 each (Growth). We never cut off support for your customers.",
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — 14 days, full feature access, no card required. You only pay when you choose a plan.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Monthly plans can be cancelled from your dashboard with no clawback. Annual plans are pro-rated.',
  },
  {
    q: 'Do you offer annual discounts?',
    a: "Yes — 20% off any plan if paid annually. Get in touch and we'll send an invoice.",
  },
]

export function PricingPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Pricing — Lira AI Customer Support"
        description="Simple, transparent pricing for Lira AI customer support. Starter from $299/mo, Growth $799/mo, Enterprise custom. 14-day free trial, no credit card required."
        keywords="Lira AI pricing, AI customer support pricing, customer support automation pricing, AI chat widget pricing, AI phone support pricing"
        path="/pricing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Lira AI Customer Support',
          description:
            'AI-powered customer support for B2B SaaS: chat, email, voice, and proactive engagement grounded in your knowledge base.',
          brand: { '@type': 'Brand', name: 'Lira AI' },
          offers: TIERS.map((t) => ({
            '@type': 'Offer',
            name: t.name,
            price: t.price === 'Custom' ? '0' : t.price.replace('$', ''),
            priceCurrency: 'USD',
            description: t.volume,
          })),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-6 bg-[#ebebeb]">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
            Pricing
          </p>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight leading-[1.05]">
            Replace a support hire,
            <br />
            not add another tool.
          </h1>
          <p className="mt-6 text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Fixed monthly price. No per-seat fees. No per-message gotchas. You can predict your
            support cost down to the dollar.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/70 border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            14-day free trial · no credit card · cancel anytime
          </div>
        </div>
      </section>

      {/* ── Tiers ────────────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 bg-[#ebebeb]">
        <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl p-8 flex flex-col ${
                tier.highlight
                  ? 'bg-gray-900 text-white shadow-2xl scale-[1.02] relative'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 text-gray-900 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  Most popular
                </span>
              )}
              <h3
                className={`text-lg font-black ${tier.highlight ? 'text-white' : 'text-gray-900'}`}
              >
                {tier.name}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  tier.highlight ? 'text-gray-300' : 'text-gray-600'
                }`}
              >
                {tier.blurb}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span
                  className={`text-5xl font-black tracking-tight ${
                    tier.highlight ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {tier.price}
                </span>
                {tier.cadence && (
                  <span
                    className={`text-sm font-semibold ${
                      tier.highlight ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {tier.cadence}
                  </span>
                )}
              </div>
              <p
                className={`mt-1 text-xs font-semibold ${
                  tier.highlight ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                {tier.volume}
              </p>

              {tier.cta.href.startsWith('http') || tier.cta.href.startsWith('mailto:') ? (
                <a
                  href={tier.cta.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-colors ${
                    tier.highlight
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  {tier.cta.label}
                  <ArrowRightIcon className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  to={tier.cta.href}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-colors ${
                    tier.highlight
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  {tier.cta.label}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}

              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        tier.highlight ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                    <span className={tier.highlight ? 'text-gray-200' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-500">
          Prices in USD. Billed monthly unless stated. 20% off when paid annually.
        </p>
      </section>

      {/* ── Comparison to incumbent pricing ──────────────────────────────── */}
      <section className="px-6 py-20 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Why a flat fee (not per seat)?
          </h2>
          <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Legacy help desks charge per agent. That punishes you for growing — and rewards them
            when a customer escalates. Lira charges per resolved conversation, so our incentives are
            aligned with yours: answer faster, escalate less, move on.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3 text-left">
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Zendesk / Intercom
              </p>
              <p className="mt-3 text-2xl font-black text-gray-900">$85–$235 / agent / mo</p>
              <p className="mt-2 text-xs text-gray-500">
                10 agents = $850–$2,350 / mo, before AI add-ons.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Hiring a support rep
              </p>
              <p className="mt-3 text-2xl font-black text-gray-900">$4k–$7k / mo loaded</p>
              <p className="mt-2 text-xs text-gray-500">
                Plus benefits, ramp time, and night/weekend gaps.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/50 bg-emerald-50 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Lira</p>
              <p className="mt-3 text-2xl font-black text-gray-900">$299–$799 / mo</p>
              <p className="mt-2 text-xs text-emerald-800">
                Covers chat, email, and voice. 24/7. Unlimited seats.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-[#ebebeb]">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight text-center">
            Common questions
          </h2>
          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl bg-white border border-gray-200 p-5 open:shadow-md transition-shadow"
              >
                <summary className="cursor-pointer flex items-center justify-between text-sm font-black text-gray-900">
                  {item.q}
                  <span className="ml-4 text-gray-400 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gray-900 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            See it answer your customers first.
          </h2>
          <p className="mt-5 text-base md:text-lg text-gray-300 leading-relaxed max-w-xl mx-auto">
            Try Lira on a live demo site — no account needed. When you like what you see, start your
            14-day free trial.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://demo.liraintelligence.com"
              className="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-6 py-3 text-sm font-black hover:bg-gray-100 transition-colors"
            >
              See live demo
              <ArrowRightIcon className="h-4 w-4" />
            </a>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-transparent border border-white/40 text-white px-6 py-3 text-sm font-black hover:bg-white/10 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
