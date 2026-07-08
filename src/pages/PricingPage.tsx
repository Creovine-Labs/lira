import { useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { CheckIcon } from '@heroicons/react/24/solid'
import {
  ArrowRightIcon,
  CubeIcon,
  Squares2X2Icon,
  RectangleStackIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

/* Pricing model, Resend-style. One AI support agent, metered by conversation
   volume, with unlimited human seats. The volume selector drives the price
   shown on each paid plan (base + overage) and moves the "Recommended" badge
   to the plan that costs least at the chosen volume. Access is invite-only, so
   every call to action routes to "speak to an expert", never a self-serve login. */

interface Plan {
  id: 'free' | 'pro' | 'scale' | 'enterprise'
  name: string
  Icon: ComponentType<{ className?: string }>
  /** Monthly base price in USD. null = custom (Enterprise). */
  base: number | null
  /** Conversations included in the base price. */
  included: number
  /** Overage price per extra 1,000 conversations (USD). null = not metered. */
  overagePer1000: number | null
  blurb: string
  cta: { label: string; href: string }
  featuresLead?: string
  features: string[]
  note?: string
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    Icon: CubeIcon,
    base: 0,
    included: 250,
    overagePer1000: null,
    blurb: 'Everything you need to launch an AI support agent and see it work.',
    cta: { label: 'Speak to an expert', href: '/contact' },
    features: [
      '250 conversations / mo',
      '1 website widget (1 domain)',
      'Knowledge base from your own content',
      'English + 1 language',
      'Lead capture to email',
      'WhatsApp handoff',
      'Unlimited team seats',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    Icon: Squares2X2Icon,
    base: 29,
    included: 2000,
    overagePer1000: 12,
    blurb: 'For businesses that want the agent resolving and organizing real volume.',
    cta: { label: 'Speak to an expert', href: '/contact' },
    featuresLead: 'Everything in Free, plus:',
    features: [
      'All conversation flows: lead qualification, intake, registration',
      '5 languages',
      'Analytics dashboard (questions + leads)',
      'CRM / webhook lead delivery',
      '“Powered by Lira” branding removed',
      'Email & chat support',
    ],
  },
  {
    id: 'scale',
    name: 'Scale',
    Icon: RectangleStackIcon,
    base: 99,
    included: 12000,
    overagePer1000: 8,
    blurb: 'For teams that want Lira on every channel, including inside WhatsApp.',
    cta: { label: 'Speak to an expert', href: '/contact' },
    featuresLead: 'Everything in Pro, plus:',
    features: [
      'AI agent inside WhatsApp (WhatsApp Business API)*',
      'Priority support',
      'Custom integrations',
      'Advanced analytics & exports',
      'Multiple domains',
    ],
    note: '* WhatsApp Business API has per-conversation fees charged by Meta, billed on top of the plan.',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    Icon: BuildingOffice2Icon,
    base: null,
    included: 0,
    overagePer1000: null,
    blurb: 'For high volume and strict security, governance, and support needs.',
    cta: { label: 'Talk to sales', href: '/contact' },
    featuresLead: 'Everything in Scale, plus:',
    features: [
      'Volume conversation pricing',
      'SSO & SAML',
      'SLAs & uptime guarantees',
      'Custom data retention',
      'Dedicated onboarding & CSM',
    ],
  },
]

/** Volume stops for the selector (conversations / month). */
const VOLUME_STOPS = [250, 1000, 2000, 5000, 12000, 25000, 50000, 100000] as const

/** Indicative Naira rate. Billing is charged in USD; Naira is shown for reference. */
const NGN_PER_USD = 1600

type CurrencyCode = 'USD' | 'NGN'

/** Monthly price for a plan at a given conversation volume (USD). */
function priceAt(plan: Plan, volume: number): number | null {
  if (plan.base === null) return null
  if (plan.overagePer1000 === null || volume <= plan.included) return plan.base
  const extraThousands = Math.ceil((volume - plan.included) / 1000)
  return plan.base + extraThousands * plan.overagePer1000
}

/** The plan we nudge toward for a given volume: cheapest metered plan, else Enterprise. */
function recommendedPlanId(volume: number): Plan['id'] {
  if (volume <= 250) return 'free'
  if (volume > 50000) return 'enterprise'
  const pro = priceAt(PLANS[1], volume)!
  const scale = priceAt(PLANS[2], volume)!
  return scale <= pro ? 'scale' : 'pro'
}

const fmt = (n: number) => n.toLocaleString('en-US')

/* Competitor comparison. Cheapest published paid tier, billed annually, for a
   small 5-agent support team. Seats are the story: everyone else meters people. */
const COMPARISON = [
  { name: 'Zendesk', plan: 'Suite Team', model: '$55 / agent / mo, billed yearly', team5: 275 },
  { name: 'Freshworks', plan: 'Pro', model: '$55 / agent / mo, billed yearly', team5: 275 },
  {
    name: 'Intercom',
    plan: 'Advanced + Fin',
    model: '~$85 / seat / mo + $0.99 per AI resolution',
    team5: 425,
  },
]

const FAQ: Array<{ q: string; a: string }> = [
  {
    q: 'What counts as a “conversation”?',
    a: 'A conversation is one complete chat session between a visitor and the agent, not one per message. A visitor asking several questions in one sitting counts as a single conversation. This is what the plan volume and overage refer to.',
  },
  {
    q: 'What’s a “resolution”, and how is that cheaper than Intercom?',
    a: 'A resolution is a conversation the AI closes end to end without a human. Intercom charges $0.99 for every Fin resolution on top of per-seat fees. With Lira you pay for conversation volume, not per resolution. Even at our metered overage, the cost per AI-resolved conversation lands far below $0.99, and seats are always free.',
  },
  {
    q: 'Do you charge per agent or per seat?',
    a: 'No. Every plan includes unlimited team seats. Zendesk, Freshworks, and Intercom all bill per agent, so a 5-person team pays them $275 to $425 a month before any AI. Lira meters the AI’s work instead, so growing your team never grows your bill.',
  },
  {
    q: 'What happens if I go over my included conversations?',
    a: 'Nothing breaks. Lira keeps answering and automatically bills overage at your plan’s rate: $12 per 1,000 on Pro, $8 per 1,000 on Scale. You can set a cap if you’d rather pause at your limit.',
  },
  {
    q: 'Can I see prices in Naira?',
    a: 'Yes. Use the USD / NGN toggle at the top of the plans to switch currency. Naira figures are indicative, based on a reference exchange rate; your subscription is charged in USD.',
  },
  {
    q: 'How do I get started?',
    a: 'Lira is invite-only while we onboard businesses one at a time. Speak to our team and we’ll set up your agent, confirm the right plan, and hand over your login. There’s no self-serve signup.',
  },
  {
    q: 'Monthly or annual?',
    a: 'Both. Choose annual and get 2 months free: you pay for 10 and get 12.',
  },
  {
    q: 'Who processes payments?',
    a: 'Payments are securely processed by Paddle, our authorized reseller and Merchant of Record.',
  },
]

export function PricingPage() {
  const [volumeIdx, setVolumeIdx] = useState(2) // default: 2,000 / mo (Pro's home)
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const volume = VOLUME_STOPS[volumeIdx]
  const recommended = useMemo(() => recommendedPlanId(volume), [volume])

  /** Format a USD amount in the currently selected currency. */
  const money = (usd: number): string => {
    if (currency === 'NGN') {
      const val = Math.round((usd * NGN_PER_USD) / 100) * 100
      return `₦${fmt(val)}`
    }
    return `$${fmt(usd)}`
  }

  return (
    <MarketingLayout>
      <SEO
        title="Pricing | Lira AI Support Agent"
        description="Start with a free plan and scale as you grow. Unlimited team seats on every plan, so you pay only for the AI, not per agent. Free 250 conversations/mo, Pro $29/mo, Scale $99/mo. Beats Zendesk, Freshworks, and Intercom per-seat pricing."
        keywords="Lira pricing, AI customer service pricing, AI support agent pricing, Zendesk alternative, Intercom alternative, Freshworks alternative, per resolution pricing, unlimited seats support"
        path="/pricing"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Lira AI Support Agent',
          description:
            'An AI customer service agent that answers questions 24/7 in multiple languages, resolves and captures leads, and hands off to your team, with unlimited seats and usage-based pricing.',
          brand: { '@type': 'Brand', name: 'Lira' },
          offers: PLANS.map((p) => ({
            '@type': 'Offer',
            name: p.name,
            price: p.base === null ? undefined : String(p.base),
            priceCurrency: 'USD',
            description: p.blurb,
          })),
        }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-10 pt-40">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-gray-500">
            Pricing
          </p>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 md:text-6xl">
            Start for free.
            <br />
            Scale as you grow.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
            One AI support agent that answers 24/7, resolves tickets, and captures leads. Every plan
            includes <strong className="text-gray-900">unlimited team seats</strong>. You pay for
            the AI, never per agent.
          </p>
          <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-gray-200 bg-white/70 px-5 py-2 text-xs font-semibold text-gray-700">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Free forever plan
            </span>
            <span className="hidden text-gray-300 sm:inline">·</span>
            <span>Unlimited seats</span>
            <span className="hidden text-gray-300 sm:inline">·</span>
            <span>No per-resolution fees</span>
          </div>
        </div>
      </section>

      {/* ── Controls: currency toggle + volume selector ──────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Currency toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center rounded-full border border-gray-300 bg-white p-1 text-sm font-black">
              {(['USD', 'NGN'] as CurrencyCode[]).map((code) => {
                const active = currency === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setCurrency(code)}
                    aria-pressed={active}
                    className={`rounded-full px-4 py-1.5 transition-colors ${
                      active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {code === 'USD' ? '$ USD' : '₦ NGN'}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Volume selector */}
          <p className="mt-8 text-xs font-black uppercase tracking-widest text-gray-500">
            How many conversations a month?
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {VOLUME_STOPS.map((stop, i) => {
              const active = i === volumeIdx
              return (
                <button
                  key={stop}
                  type="button"
                  onClick={() => setVolumeIdx(i)}
                  aria-pressed={active}
                  className={`rounded-full px-4 py-2 text-sm font-black tabular-nums transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-900'
                  }`}
                >
                  {stop >= 100000 ? '100,000+' : fmt(stop)}
                </button>
              )
            })}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            At <strong className="text-gray-900">{fmt(volume)}</strong> conversations / mo, we
            recommend the{' '}
            <strong className="text-gray-900">
              {PLANS.find((p) => p.id === recommended)!.name}
            </strong>{' '}
            plan.
          </p>
        </div>
      </section>

      {/* ── Plans ────────────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 pb-16">
        <div className="mx-auto grid max-w-7xl items-start gap-5 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isRecommended = plan.id === recommended
            const highlight = isRecommended
            const price = priceAt(plan, volume)
            const overCap =
              plan.base !== null &&
              plan.overagePer1000 !== null &&
              volume > plan.included &&
              price !== null
                ? Math.ceil((volume - plan.included) / 1000) * plan.overagePer1000
                : 0

            return (
              <div
                key={plan.id}
                className={`relative flex h-full flex-col rounded-3xl p-7 ${
                  highlight
                    ? 'bg-gray-900 text-white shadow-2xl ring-2 ring-emerald-400'
                    : 'border border-gray-200 bg-white'
                }`}
              >
                {isRecommended && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-emerald-400 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-900">
                    Recommended
                  </span>
                )}

                <div className="flex items-center gap-2.5">
                  <plan.Icon
                    className={`h-5 w-5 shrink-0 ${highlight ? 'text-white' : 'text-gray-900'}`}
                  />
                  <h3
                    className={`text-lg font-black ${highlight ? 'text-white' : 'text-gray-900'}`}
                  >
                    {plan.name}
                  </h3>
                </div>
                <p
                  className={`mt-2 min-h-[40px] text-sm leading-relaxed ${
                    highlight ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {plan.blurb}
                </p>

                {/* Price */}
                <div className="mt-5">
                  {price === null ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-black tracking-tight ${
                          highlight ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        Custom
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-black tabular-nums tracking-tight ${
                          highlight ? 'text-white' : 'text-gray-900'
                        }`}
                      >
                        {money(price)}
                      </span>
                      <span
                        className={`text-sm font-semibold ${
                          highlight ? 'text-gray-400' : 'text-gray-500'
                        }`}
                      >
                        / mo
                      </span>
                    </div>
                  )}

                  {/* Sub-line: what the price covers at this volume */}
                  <p
                    className={`mt-2 min-h-[32px] text-xs leading-relaxed ${
                      highlight ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {plan.base === null ? (
                      <>Volume pricing for {fmt(volume)}+ / mo</>
                    ) : overCap > 0 ? (
                      <>
                        {fmt(plan.included)} included, +{fmt(volume - plan.included)} @{' '}
                        {money(plan.overagePer1000!)}/1k = {money(overCap)}
                      </>
                    ) : plan.overagePer1000 === null ? (
                      <>{fmt(plan.included)} conversations / mo</>
                    ) : (
                      <>
                        {fmt(plan.included)} included, extra {money(plan.overagePer1000)} / 1,000
                      </>
                    )}
                  </p>
                </div>

                <Link
                  to={plan.cta.href}
                  className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black transition-colors ${
                    highlight
                      ? 'bg-white text-gray-900 hover:bg-gray-100'
                      : 'bg-gray-900 text-white hover:bg-gray-700'
                  }`}
                >
                  {plan.cta.label}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>

                {plan.featuresLead && (
                  <p
                    className={`mt-7 text-xs font-black uppercase tracking-widest ${
                      highlight ? 'text-gray-400' : 'text-gray-500'
                    }`}
                  >
                    {plan.featuresLead}
                  </p>
                )}
                <ul className={`space-y-2.5 ${plan.featuresLead ? 'mt-4' : 'mt-7'}`}>
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckIcon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          highlight ? 'text-emerald-400' : 'text-emerald-600'
                        }`}
                      />
                      <span className={highlight ? 'text-gray-200' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.note && (
                  <p
                    className={`mt-6 text-[11px] leading-relaxed ${
                      highlight ? 'text-gray-500' : 'text-gray-400'
                    }`}
                  >
                    {plan.note}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          Billed monthly unless stated. Choose annual and get 2 months free.{' '}
          {currency === 'NGN'
            ? 'Naira is indicative, based on a reference rate; subscriptions are charged in USD.'
            : 'Prices in USD.'}
        </p>
      </section>

      {/* ── The seats story: why we're cheaper ───────────────────────────── */}
      <section className="border-t border-gray-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">The math</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
              Everyone else bills per agent.
              <br />
              Lira bills for the AI. Seats are free.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-600">
              Here’s what a small <strong className="text-gray-900">5-agent</strong> support team
              pays each month, at the competitors’ cheapest published tier billed annually, before a
              single AI resolution.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#fbfaf6] text-gray-500">
                <tr>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-widest">
                    Provider
                  </th>
                  <th className="px-5 py-4 text-[11px] font-black uppercase tracking-widest">
                    How they charge
                  </th>
                  <th className="px-5 py-4 text-right text-[11px] font-black uppercase tracking-widest">
                    Team of 5 / mo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {COMPARISON.map((c) => (
                  <tr key={c.name}>
                    <td className="px-5 py-4">
                      <span className="font-black text-gray-900">{c.name}</span>{' '}
                      <span className="text-gray-400">· {c.plan}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{c.model}</td>
                    <td className="px-5 py-4 text-right font-black tabular-nums text-gray-900">
                      {money(c.team5)}+
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-900 text-white">
                  <td className="px-5 py-4">
                    <span className="font-black">Lira</span>{' '}
                    <span className="text-gray-400">· Pro</span>
                  </td>
                  <td className="px-5 py-4 text-gray-300">
                    {money(29)} / mo flat, unlimited seats, 2,000 AI conversations
                  </td>
                  <td className="px-5 py-4 text-right font-black tabular-nums text-emerald-400">
                    {money(29)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-gray-500">
            Add a 6th, 20th, or 100th teammate and their bill climbs every time. On Lira it doesn’t
            move; you only pay when conversation volume grows. And with no{' '}
            <strong className="text-gray-700">$0.99-per-resolution</strong> tax, the AI resolving
            more tickets makes you <em>cheaper</em> per outcome, not pricier.
          </p>
        </div>
      </section>

      {/* ── Pay-as-you-go ────────────────────────────────────────────────── */}
      <section className="bg-[#ebebeb] px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Pay only for what you use
          </h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-white p-7">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black text-gray-900">Extra conversations</p>
                <p className="text-sm font-black tabular-nums text-emerald-600">
                  from {money(8)} / 1,000
                </p>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                Go past your plan’s included volume and Lira keeps answering. Overage is billed
                automatically at <strong>{money(12)} / 1,000</strong> on Pro and{' '}
                <strong>{money(8)} / 1,000</strong> on Scale. Set a cap anytime if you’d rather
                pause at your limit.
              </p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-7">
              <div className="flex items-baseline justify-between">
                <p className="text-lg font-black text-gray-900">No per-seat, no per-resolution</p>
                <p className="text-sm font-black tabular-nums text-emerald-600">{money(0)}</p>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
                Unlimited teammates on every plan, and no charge each time the AI resolves a ticket.
                The only thing that scales your bill is conversation volume, nothing else.
              </p>
            </div>
          </div>
        </div>
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
                Choose annual and get <strong>2 months free</strong>: pay for 10, get 12.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 p-6">
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">Flexible</p>
              <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
                Upgrade, downgrade, or cancel anytime. Changes take effect from your next billing
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

          <div className="mt-6 rounded-2xl border border-gray-200 bg-[#fbfaf6] p-6">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
              What counts as a “conversation”?
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-gray-700">
              A conversation is one complete chat session between a visitor and the agent (not per
              message), so a visitor asking several questions in one sitting counts as a single
              conversation. This is what plan volume and overage refer to.
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
            See it answer your customers in the live demo, then speak to our team to get set up. We
            onboard businesses personally, so there’s no self-serve signup.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-gray-900 transition-colors hover:bg-gray-100"
            >
              Speak to an expert
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
