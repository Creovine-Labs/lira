import { useState } from 'react'
import { toast } from 'sonner'

import { LiraLogo } from '@/components/LiraLogo'
import {
  saveVoiceBusinessProfile,
  createVoiceLineRequest,
  saveVoicePlanIntent,
} from '@/services/api'
import { cn } from '@/lib'

/*
 * Voice onboarding.
 *
 * These questions used to sit on the dashboard as three stacked forms, so a
 * new account landed on data entry instead of the product. They are the same
 * fields and the same endpoints — moved in front of the dashboard and asked
 * one screen at a time, using the shell from /onboarding so the two flows feel
 * like one product.
 *
 * Each step saves as it advances. Someone who drops out at step 4 keeps steps
 * 1–3, which matters because this is seven screens long and people leave.
 */

type Step = 'business' | 'about' | 'policies' | 'volume' | 'voice' | 'line' | 'plan'

const STEPS: Step[] = ['business', 'about', 'policies', 'volume', 'voice', 'line', 'plan']

/** Mirrors the LEFT_HEADINGS pattern in OnboardingPage. */
const LEFT_HEADINGS: Record<Step, string> = {
  business: 'Set up\nyour line',
  about: 'What you\ndo',
  policies: 'How you\nsound',
  volume: 'How busy\nyou are',
  voice: 'Pick a\nvoice',
  line: 'Almost\nthere',
  plan: 'Choose\na plan',
}

const INDUSTRIES = [
  'Restaurant & hospitality',
  'Retail & e-commerce',
  'Healthcare & clinics',
  'Financial services',
  'Logistics & delivery',
  'Real estate',
  'Education',
  'Professional services',
  'Beauty & wellness',
  'Automotive',
  'Travel & tourism',
  'Other',
]

const CATEGORIES = [
  'Sole proprietor',
  'Small business (1–10 staff)',
  'Growing business (11–50 staff)',
  'Mid-market (51–250 staff)',
  'Enterprise (250+ staff)',
  'Agency or reseller',
]

const HOURS = [
  '9am – 5pm, weekdays',
  '8am – 6pm, weekdays',
  '9am – 5pm, including Saturdays',
  '8am – 8pm, every day',
  '24 hours, every day',
  'Evenings and weekends only',
  'Varies — I will set this later',
]

const PERSONALITIES = [
  'Warm and friendly — chatty, puts callers at ease',
  'Professional and concise — straight to the point',
  'Calm and reassuring — good for complaints and sensitive calls',
  'Upbeat and energetic — good for retail and hospitality',
  'Formal and precise — good for finance, legal and healthcare',
]

const CALL_VOLUMES = [
  { label: 'Under 10 calls a day', value: 10 },
  { label: '10 – 30 calls a day', value: 30 },
  { label: '30 – 60 calls a day', value: 60 },
  { label: '60 – 150 calls a day', value: 150 },
  { label: 'More than 150 calls a day', value: 300 },
]

const VOICES = [
  {
    id: 'professional_ng_female',
    name: 'Professional Nigerian',
    detail: 'Best for finance, healthcare, logistics, and high-trust support.',
  },
  {
    id: 'conversational_ng_female',
    name: 'Conversational Nigerian',
    detail: 'Warm, natural and relaxed for hospitality, restaurants, retail, and services.',
  },
  {
    id: 'custom_clone_pending',
    name: 'Custom brand voice',
    detail: 'Clone a voice of your own. We will be in touch to record it.',
  },
]

const PLANS = [
  { tier: 'starter', label: 'Starter', price: '$49/mo', detail: 'A single line, up to 300 calls.' },
  { tier: 'growth', label: 'Growth', price: '$99/mo', detail: 'Busier lines and call routing.' },
  {
    tier: 'business',
    label: 'Business',
    price: '$199/mo',
    detail: 'High volume with priority support.',
  },
  { tier: 'enterprise', label: 'Enterprise', price: 'Custom', detail: 'Custom volume and terms.' },
] as const

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition'

export function VoiceOnboardingPage({ orgId, onDone }: { orgId: string; onDone: () => void }) {
  const [step, setStep] = useState<Step>('business')
  const [saving, setSaving] = useState(false)

  const [businessName, setBusinessName] = useState('')
  const [industry, setIndustry] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [offerings, setOfferings] = useState('')
  const [hours, setHours] = useState('')
  const [prices, setPrices] = useState('')
  const [policies, setPolicies] = useState('')
  const [personality, setPersonality] = useState('')
  const [callsPerDay, setCallsPerDay] = useState<number | null>(null)
  const [chosenVoice, setChosenVoice] = useState('')
  const [lineOption, setLineOption] = useState<'forward_existing' | 'request_number'>(
    'forward_existing'
  )
  const [existingNumber, setExistingNumber] = useState('')
  const [preferredCity, setPreferredCity] = useState('Lagos')
  const [planTier, setPlanTier] = useState<(typeof PLANS)[number]['tier']>('growth')

  const index = STEPS.indexOf(step)

  function back() {
    if (index > 0) setStep(STEPS[index - 1])
  }

  /**
   * Persist what this step collected, then advance.
   *
   * A save failure keeps the visitor where they are with the reason shown —
   * silently moving on would lose the answer and they would only find out at
   * the end, with nothing to re-enter it from.
   */
  async function advance(save: () => Promise<unknown>, next: Step | 'done') {
    setSaving(true)
    try {
      await save()
      if (next === 'done') onDone()
      else setStep(next)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save — please try again.')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = (patch: Record<string, unknown>) => () =>
    saveVoiceBusinessProfile(orgId, { businessName: businessName.trim(), ...patch })

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <aside className="hidden w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10 md:flex">
        <LiraLogo size="md" />
        <div className="flex flex-1 flex-col justify-center gap-6">
          <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
            {LEFT_HEADINGS[step]}
          </h2>
          <p className="text-sm text-gray-500">
            Step {index + 1} of {STEPS.length}
          </p>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex items-center px-5 pb-2 pt-6 md:hidden">
          <LiraLogo size="md" />
        </div>

        <div className="flex flex-1 flex-col justify-start px-5 pt-4 py-8 sm:px-10 sm:py-12 md:justify-center md:px-16">
          <div className="w-full max-w-[560px]">
            {/* Step 1 — the business */}
            {step === 'business' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Tell us about your business
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Lira greets your callers by your business name and answers in your context.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="vo-name" className="text-sm font-medium text-gray-700">
                      Business name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="vo-name"
                      className={inputClass}
                      placeholder="Lira Restaurant"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vo-industry" className="text-sm font-medium text-gray-700">
                      Industry <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vo-industry"
                      className={inputClass}
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    >
                      <option value="">Select an industry</option>
                      {INDUSTRIES.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vo-category" className="text-sm font-medium text-gray-700">
                      Business category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vo-category"
                      className={inputClass}
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value)}
                    >
                      <option value="">Select a category</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                  <button
                    disabled={!businessName.trim() || !industry || !businessCategory || saving}
                    onClick={() =>
                      void advance(saveProfile({ industry, businessCategory }), 'about')
                    }
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                  >
                    {saving ? 'Saving…' : 'Next'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — what they do */}
            {step === 'about' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Can you describe what your business does?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    A few sentences is plenty. This is what Lira draws on when a caller asks.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="vo-offerings" className="text-sm font-medium text-gray-700">
                      What your business does <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="vo-offerings"
                      rows={4}
                      className={inputClass}
                      placeholder="We are a family restaurant in Lekki. We do sit-down meals, takeaway and small-event catering."
                      value={offerings}
                      onChange={(e) => setOfferings(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vo-hours" className="text-sm font-medium text-gray-700">
                      Working hours <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vo-hours"
                      className={inputClass}
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                    >
                      <option value="">Select your hours</option>
                      {HOURS.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vo-prices" className="text-sm font-medium text-gray-700">
                      Prices <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="vo-prices"
                      rows={3}
                      className={inputClass}
                      placeholder="Jollof rice ₦4,500 · Grilled chicken ₦6,000 · Catering from ₦150,000"
                      value={prices}
                      onChange={(e) => setPrices(e.target.value)}
                    />
                    <p className="text-xs text-gray-400">
                      A few examples is enough — you can add a full price list later from the
                      dashboard.
                    </p>
                  </div>
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  disabled={!offerings.trim() || !hours || !prices.trim()}
                  onNext={() => void advance(saveProfile({ offerings, hours, prices }), 'policies')}
                />
              </div>
            )}

            {/* Step 3 — policies and personality */}
            {step === 'policies' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Your policies and how Lira should sound
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    This is what Lira falls back on when a caller asks something specific. You can
                    change both later.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="vo-policies" className="text-sm font-medium text-gray-700">
                      Business policies <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="vo-policies"
                      rows={4}
                      className={inputClass}
                      placeholder="Refunds within 7 days with a receipt. Deliveries within Lagos only. Reservations held for 20 minutes."
                      value={policies}
                      onChange={(e) => setPolicies(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="vo-personality" className="text-sm font-medium text-gray-700">
                      How should Lira sound? <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="vo-personality"
                      className={inputClass}
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                    >
                      <option value="">Select a personality</option>
                      {PERSONALITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  disabled={!policies.trim() || !personality}
                  onNext={() => void advance(saveProfile({ policies, personality }), 'volume')}
                />
              </div>
            )}

            {/* Step 4 — volume */}
            {step === 'volume' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    How many calls do you take a day?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    A rough number is fine. It tells us what to provision.
                  </p>
                </div>

                <div className="grid gap-2">
                  {CALL_VOLUMES.map((v) => (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setCallsPerDay(v.value)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left text-sm transition',
                        callsPerDay === v.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      )}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  disabled={callsPerDay === null}
                  onNext={() =>
                    void advance(
                      saveProfile({ inboundCallsPerDay: callsPerDay ?? undefined }),
                      'voice'
                    )
                  }
                />
              </div>
            )}

            {/* Step 5 — voice */}
            {step === 'voice' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Which voice should answer?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    You can change this at any time, and hear each one on the dashboard.
                  </p>
                </div>

                <div className="grid gap-2">
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setChosenVoice(v.id)}
                      className={cn(
                        'rounded-lg border px-4 py-3 text-left transition',
                        chosenVoice === v.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      <span className="block text-sm font-semibold">{v.name}</span>
                      <span
                        className={cn(
                          'mt-0.5 block text-xs',
                          chosenVoice === v.id ? 'text-white/70' : 'text-gray-500'
                        )}
                      >
                        {v.detail}
                      </span>
                    </button>
                  ))}
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  disabled={!chosenVoice}
                  onNext={() => void advance(saveProfile({ chosenVoice }), 'line')}
                />
              </div>
            )}

            {/* Step 6 — the line */}
            {step === 'line' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Which number should Lira answer?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Forward the line you already advertise, or let us provision a new one.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="grid gap-2">
                    {(
                      [
                        [
                          'forward_existing',
                          'Forward my existing line',
                          'Keep the number your customers already know.',
                        ],
                        [
                          'request_number',
                          'Provision a new number',
                          'We will send you one to advertise.',
                        ],
                      ] as const
                    ).map(([value, label, detail]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setLineOption(value)}
                        className={cn(
                          'rounded-lg border px-4 py-3 text-left transition',
                          lineOption === value
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-300 hover:border-gray-400'
                        )}
                      >
                        <span className="block text-sm font-semibold">{label}</span>
                        <span
                          className={cn(
                            'mt-0.5 block text-xs',
                            lineOption === value ? 'text-white/70' : 'text-gray-500'
                          )}
                        >
                          {detail}
                        </span>
                      </button>
                    ))}
                  </div>

                  {lineOption === 'forward_existing' ? (
                    <div className="space-y-1.5">
                      <label htmlFor="vo-number" className="text-sm font-medium text-gray-700">
                        Your current number
                      </label>
                      <input
                        id="vo-number"
                        className={inputClass}
                        placeholder="+234 801 234 5678"
                        value={existingNumber}
                        onChange={(e) => setExistingNumber(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label htmlFor="vo-city" className="text-sm font-medium text-gray-700">
                        Preferred city
                      </label>
                      <input
                        id="vo-city"
                        className={inputClass}
                        placeholder="Lagos"
                        value={preferredCity}
                        onChange={(e) => setPreferredCity(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  onNext={() =>
                    void advance(
                      () =>
                        createVoiceLineRequest(orgId, {
                          option: lineOption,
                          existingNumber: existingNumber.trim() || undefined,
                          preferredCity: preferredCity.trim() || undefined,
                        }),
                      'plan'
                    )
                  }
                />
              </div>
            )}

            {/* Step 7 — plan */}
            {step === 'plan' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">Choose a plan</h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Nothing is charged now — we confirm everything with you before your line goes
                    live.
                  </p>
                </div>

                <div className="grid gap-2">
                  {PLANS.map((p) => (
                    <button
                      key={p.tier}
                      type="button"
                      onClick={() => setPlanTier(p.tier)}
                      className={cn(
                        'flex items-center justify-between rounded-lg border px-4 py-3 text-left transition',
                        planTier === p.tier
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      <span>
                        <span className="block text-sm font-semibold">{p.label}</span>
                        <span
                          className={cn(
                            'mt-0.5 block text-xs',
                            planTier === p.tier ? 'text-white/70' : 'text-gray-500'
                          )}
                        >
                          {p.detail}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold">{p.price}</span>
                    </button>
                  ))}
                </div>

                <StepActions
                  onBack={back}
                  saving={saving}
                  nextLabel="Proceed"
                  onNext={() =>
                    void advance(
                      () =>
                        saveVoicePlanIntent(orgId, {
                          tier: planTier,
                          currency: 'NGN',
                          interval: 'monthly',
                        }),
                      'done'
                    )
                  }
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

/** The action row from /onboarding: Back on the left, Skip and the primary on the right. */
function StepActions({
  onBack,
  onNext,
  onSkip,
  saving,
  disabled,
  nextLabel = 'Continue',
  skipLabel,
}: {
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  saving?: boolean
  disabled?: boolean
  nextLabel?: string
  skipLabel?: string
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        ← Back
      </button>
      <div className="flex items-center gap-4">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            {skipLabel ?? 'Skip & continue'}
          </button>
        )}
        <button
          type="button"
          disabled={disabled || saving}
          onClick={onNext}
          className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : nextLabel}
        </button>
      </div>
    </div>
  )
}

export default VoiceOnboardingPage
