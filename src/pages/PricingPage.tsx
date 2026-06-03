import { Link } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon, GiftIcon } from '@heroicons/react/24/outline'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

interface Tier {
  name: string
  emoji: string
  dot: string
  price: string
  cadence: string
  blurb: string
  cta: { label: string; href: string }
  highlight?: boolean
  featuresLead?: string
  features: string[]
  note?: string
}

const TIERS: Tier[] = [
  {
    name: 'Startup',
    emoji: '🟢',
    dot: 'bg-emerald-500',
    price: '$49',
    cadence: '/ month',
    blurb: 'For getting started — a smart assistant that answers and captures leads.',
    cta: { label: 'Start free trial', href: '/signup' },
    features: [
      'Website chat widget',
      'Custom knowledge base (answers from your own content)',
      'English + 2 languages',
      'FAQ answering + lead capture to email',
      'WhatsApp handoff',
      'Up to 300 conversations / month',
    ],
  },
  {
    name: 'Growth',
    emoji: '⭐',
    dot: 'bg-amber-400',
    price: '$99',
    cadence: '/ month',
    blurb: 'For businesses that want the agent to actually drive and organize leads.',
    cta: { label: 'Start free trial', href: '/signup' },
    highlight: true,
    featuresLead: 'Everything in Startup, plus:',
    features: [
      'All conversation flows — lead qualification, event / registration assistance, application intake',
      '4–5 languages',
      'Analytics dashboard (questions asked + leads captured)',
      'CRM / webhook lead delivery',
      'Up to 1,000 conversations / month',
      '“Powered by Lira” branding removed',
    ],
  },
  {
    name: 'Pro',
    emoji: '🔵',
    dot: 'bg-blue-500',
    price: '$199',
    cadence: '/ month',
    blurb: 'For teams that want Lira everywhere, including inside WhatsApp.',
    cta: { label: 'Start free trial', href: '/signup' },
    featuresLead: 'Everything in Growth, plus:',
    features: [
      'Agent inside WhatsApp (WhatsApp Business API)*',
      'Priority support',
      'Custom integrations',
      'High / unlimited conversations',
    ],
    note: '* WhatsApp Business API has per-conversation fees charged by Meta, billed on top of the plan.',
  },
]

const TRIAL_INCLUDES = [
  'Website widget',
  'Your knowledge base',
  'English + 1 language',
  'Lead capture',
  'WhatsApp handoff',
]

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What counts as a “conversation”?',
    a: 'A conversation is one complete chat session between a visitor and the agent — not one per message. So a visitor asking several questions in one sitting counts as a single conversation. This is what the monthly caps refer to.',
  },
  {
    q: 'How does the free trial work?',
    a: 'Try Lira free for 14 days or 10 conversations, whichever comes first. Full setup, no commitment. When the trial ends, just pick a plan to keep your assistant live.',
  },
  {
    q: 'Monthly or annual?',
    a: 'Both. Choose annual and get 2 months free — you pay for 10 and get 12.',
  },
  {
    q: 'Can I change or cancel my plan?',
    a: 'Yes. Upgrade, downgrade, or cancel anytime — changes take effect from your next billing cycle.',
  },
  {
    q: 'Who processes payments?',
    a: 'Payments are securely processed by Paddle, our authorized reseller and Merchant of Record.',
  },
  {
    q: 'Are there extra fees for WhatsApp on the Pro plan?',
    a: 'The WhatsApp Business API has per-conversation fees charged by Meta. Those are billed on top of your plan.',
  },
]

export function PricingPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Pricing — Lira AI Support Agent"
        description="One AI support agent, three plans. Startup $49/mo, Growth $99/mo, Pro $199/mo. Start with a 14-day free trial — website widget, knowledge base, multilingual answers, lead capture, and WhatsApp handoff."
        keywords="Lira pricing, AI support agent pricing, AI chat widget pricing, lead capture chatbot pricing, WhatsApp AI agent"
        path="/pricing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Lira AI Support Agent',
          description:
            'An AI support agent that answers customer questions 24/7 in multiple languages, captures and qualifies leads, and hands off to your team.',
          brand: { '@type': 'Brand', name: 'Lira' },
          offers: TIERS.map((t) => ({
            '@type': 'Offer',
            name: t.name,
            price: t.price.replace('$', ''),
            priceCurrency: 'USD',
            description: t.blurb,
          })),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-16 pt-40">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            Pricing
          </p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
            One AI support agent.
            <br />
            Three plans. Start free.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
            Lira sits on your website, answers customer questions 24/7 in multiple languages,
            qualifies and captures leads, and hands off to your team when needed. Pick the plan that
            matches how much you need it to do.
          </p>
          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-xs font-semibold text-gray-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            14-day free trial · no credit card · cancel anytime
          </div>
        </div>
      </section>

      {/* ── Free trial band ──────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-12">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-50 p-7 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                  <GiftIcon className="h-3.5 w-3.5" />
                  Free trial — 14 days
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-emerald-900">
                  Try Lira free for <strong>14 days or 10 conversations</strong>, whichever comes
                  first. Full setup, no commitment. When the trial ends, just pick a plan to keep
                  your assistant live.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {TRIAL_INCLUDES.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800"
                    >
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <Link
                to="/signup"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-black text-white transition-colors hover:bg-gray-700"
              >
                Start free trial
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tiers ────────────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-20">
        <div className="mx-auto grid max-w-6xl items-start gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl p-8 ${
                tier.highlight
                  ? 'bg-gray-900 text-white shadow-2xl md:scale-[1.03]'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-900">
                  Most popular
                </span>
              )}

              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${tier.dot}`} aria-hidden />
                <h3
                  className={`text-lg font-black ${tier.highlight ? 'text-white' : 'text-gray-900'}`}
                >
                  {tier.name}
                </h3>
              </div>
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
                <span
                  className={`text-sm font-semibold ${
                    tier.highlight ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {tier.cadence}
                </span>
              </div>

              <Link
                to={tier.cta.href}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-colors ${
                  tier.highlight
                    ? 'bg-white text-gray-900 hover:bg-gray-100'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {tier.cta.label}
                <ArrowRightIcon className="h-4 w-4" />
              </Link>

              {tier.featuresLead && (
                <p
                  className={`mt-8 text-xs font-black uppercase tracking-widest ${
                    tier.highlight ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {tier.featuresLead}
                </p>
              )}
              <ul className={`space-y-3 ${tier.featuresLead ? 'mt-4' : 'mt-8'}`}>
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.highlight ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                    <span className={tier.highlight ? 'text-gray-200' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>

              {tier.note && (
                <p
                  className={`mt-6 text-[11px] leading-relaxed ${
                    tier.highlight ? 'text-gray-400' : 'text-gray-400'
                  }`}
                >
                  {tier.note}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-500">
          Prices in USD. Billed monthly unless stated. Choose annual and get 2 months free.
        </p>
      </section>

      {/* ── How billing works ────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            How billing works
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Monthly or annual
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                Choose annual and get <strong>2 months free</strong> — pay for 10, get 12.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Flexible</p>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                Upgrade, downgrade, or cancel anytime — changes take effect from your next billing
                cycle.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Secure checkout
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                Payments are securely processed by <strong>Paddle</strong>, our authorized reseller
                and Merchant of Record.
              </p>
            </div>
          </div>

          {/* Conversation definition callout */}
          <div className="mt-6 rounded-2xl border border-gray-200 bg-[#fbfaf6] p-6">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
              What counts as a “conversation”?
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
              A conversation is one complete chat session between a visitor and the agent (not per
              message) — so a visitor asking several questions in one sitting counts as a single
              conversation. This is what the monthly caps refer to.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By subscribing you agree to our{' '}
            <Link to="/terms" className="font-semibold text-gray-700 underline underline-offset-2">
              Terms of Service
            </Link>
            ,{' '}
            <Link
              to="/privacy"
              className="font-semibold text-gray-700 underline underline-offset-2"
            >
              Privacy Policy
            </Link>
            , and{' '}
            <Link to="/refund" className="font-semibold text-gray-700 underline underline-offset-2">
              Refund Policy
            </Link>
            .
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Common questions
          </h2>
          <div className="mt-10 space-y-4">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-shadow open:shadow-md"
              >
                <summary className="flex cursor-pointer items-center justify-between text-sm font-black text-gray-900">
                  {item.q}
                  <span className="ml-4 text-gray-400 transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="bg-gray-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-black leading-tight tracking-tight md:text-5xl">
            Put Lira on your site today.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-300 md:text-lg">
            Try it free for 14 days — full setup, no commitment. See it answer your customers, then
            pick the plan that fits.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-gray-900 transition-colors hover:bg-gray-100"
            >
              Start free trial
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <a
              href="https://demo.liraintelligence.com"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-transparent px-6 py-3 text-sm font-black text-white transition-colors hover:bg-white/10"
            >
              See live demo
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
