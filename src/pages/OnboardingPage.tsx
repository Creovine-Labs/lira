import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationCircleIcon,
  PencilIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  createOrganization,
  describeUrlPublic,
  saveAttribution,
  type AttributionSource,
} from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

const PENDING_INVITE_ORG_NAME_KEY = 'lira:pending-invite-org-name'

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance & Banking',
  'Education',
  'Retail & E-commerce',
  'Manufacturing',
  'Real Estate',
  'Legal',
  'Marketing & Advertising',
  'Consulting',
  'Media & Entertainment',
  'Transportation',
  'Food & Beverage',
  'Non-profit',
  'Government',
  'Energy',
  'Telecommunications',
]

// Onboarding is the post-signup wizard for a brand-new account that came in
// off a concierge signup invite. The account-creation flow ("create vs join an
// org") was removed — joining an existing org now happens via per-employee
// invite links issued by the org admin from the members page, not here.
type FlowStep = 'org-name' | 'industry' | 'details' | 'surface' | 'success' | 'attribution'

const STEP_BACK: Partial<Record<FlowStep, FlowStep>> = {
  surface: 'details',
  industry: 'org-name',
  details: 'industry',
}

const LEFT_HEADINGS: Partial<Record<FlowStep, string>> = {
  'org-name': 'Create your\nworkspace',
  industry: 'Tailor your\nexperience',
  details: 'Almost\nthere',
  surface: 'Where will\nLira live?',
  attribution: 'Quick\nquestion',
}

// 2026-05-24 — the module-picker step ("What brings you to Lira?") was
// removed because the product is customer-support only for now. Onboarding
// now flows: create org → success → /support/activate. The PreferredModule
// type, MODULE_OPTIONS list, and persistPreferredModule helper went with
// it (nothing else read them). Restore from git if sales+meetings ship.

function CelebrationGraphic() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle cx="80" cy="80" r="56" stroke="#c7d2fe" strokeWidth="3" />
      {/* Inner fill circle */}
      <circle cx="80" cy="80" r="44" fill="#e0e7ff" />
      {/* CheckIcon circle */}
      <circle cx="80" cy="80" r="32" fill="#3730a3" />
      {/* Checkmark */}
      <polyline
        points="64,80 75,91 97,68"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkle dots */}
      <circle cx="80" cy="16" r="4" fill="#4338ca" />
      <circle cx="80" cy="144" r="4" fill="#3730a3" />
      <circle cx="16" cy="80" r="4" fill="#a5b4fc" />
      <circle cx="144" cy="80" r="4" fill="#312e81" />
      <circle cx="37" cy="37" r="3" fill="#c7d2fe" />
      <circle cx="123" cy="37" r="3" fill="#4f46e5" />
      <circle cx="37" cy="123" r="3" fill="#3730a3" />
      <circle cx="123" cy="123" r="3" fill="#4338ca" />
    </svg>
  )
}

function SparkleGraphic() {
  return (
    <svg
      width="160"
      height="160"
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="80" cy="80" r="8" fill="#3730a3" />
      <line
        x1="80"
        y1="80"
        x2="80"
        y2="18"
        stroke="#3730a3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="80"
        y2="142"
        stroke="#4338ca"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="18"
        y2="80"
        stroke="#c7d2fe"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="142"
        y2="80"
        stroke="#3730a3"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="35"
        y2="35"
        stroke="#a5b4fc"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="125"
        y2="35"
        stroke="#312e81"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="35"
        y2="125"
        stroke="#1e1b4b"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="125"
        y2="125"
        stroke="#4f46e5"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="52"
        y2="22"
        stroke="#e0e7ff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="108"
        y2="22"
        stroke="#c7d2fe"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="22"
        y2="52"
        stroke="#3730a3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="138"
        y2="52"
        stroke="#4338ca"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="22"
        y2="108"
        stroke="#a5b4fc"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="138"
        y2="108"
        stroke="#3730a3"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="52"
        y2="138"
        stroke="#4f46e5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="108"
        y2="138"
        stroke="#1e1b4b"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Attribution step ────────────────────────────────────────────────────────
//
// Optional one-question step asking how the user found Lira. Used for
// marketing-channel attribution on the admin dashboard. Skippable —
// Continue saves; Skip moves on without an API call.

const ATTRIBUTION_OPTIONS: { id: AttributionSource; label: string; emoji: string }[] = [
  { id: 'google', label: 'Google search', emoji: '🔎' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
  { id: 'friend', label: 'Friend or colleague', emoji: '👋' },
  { id: 'youtube', label: 'YouTube', emoji: '📺' },
  { id: 'twitter', label: 'X / Twitter', emoji: '🐦' },
  { id: 'ai_tool', label: 'ChatGPT or another AI tool', emoji: '🤖' },
  { id: 'blog', label: 'Blog post or article', emoji: '📝' },
  { id: 'podcast', label: 'Podcast', emoji: '🎙️' },
  { id: 'event', label: 'Conference or event', emoji: '🎪' },
  { id: 'sales_outreach', label: 'Lira team reached out', emoji: '📨' },
  { id: 'other', label: 'Other', emoji: '✨' },
]

function AttributionStep({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<AttributionSource | null>(null)
  const [detail, setDetail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleContinue = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await saveAttribution(selected, detail.trim() || undefined)
    } catch (err) {
      // Non-blocking — attribution is best-effort. Log and move on.
      console.warn('[onboarding] failed to save attribution', err)
    } finally {
      setSubmitting(false)
      onDone()
    }
  }

  const showDetail = selected === 'other'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-[#3730a3]">
          Quick question
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
          How did you hear about us?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Helps us understand which channels are working. Totally optional — you can skip.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {ATTRIBUTION_OPTIONS.map((opt) => {
          const isSelected = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSelected(opt.id)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                isSelected
                  ? 'border-[#3730a3] bg-[#3730a3]/5'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg" aria-hidden>
                {opt.emoji}
              </span>
              <span
                className={`flex-1 ${isSelected ? 'font-semibold text-[#3730a3]' : 'text-gray-700'}`}
              >
                {opt.label}
              </span>
              {isSelected && <CheckIcon className="h-4 w-4 text-[#3730a3]" />}
            </button>
          )
        })}
      </div>

      {showDetail && (
        <div>
          <label
            htmlFor="attribution-detail"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Tell us more (optional)
          </label>
          <input
            id="attribution-detail"
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="A specific podcast, a community, a referrer..."
            maxLength={200}
            className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#3730a3]"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onDone}
          disabled={submitting}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-gray-500 transition hover:text-gray-900 disabled:opacity-50"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!selected || submitting}
          className="rounded-lg bg-[#3730a3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const { token, emailVerified } = useAuthStore()
  const { addOrganization, setCurrentOrg } = useOrgStore()

  const [step, setStep] = useState<FlowStep>('org-name')
  const [createdOrgName, setCreatedOrgName] = useState('')

  // Create org state
  const [orgName, setOrgName] = useState(() => {
    if (typeof window === 'undefined') return ''
    return sessionStorage.getItem(PENDING_INVITE_ORG_NAME_KEY) ?? ''
  })
  const [industry, setIndustry] = useState('')
  const [industryCustom, setIndustryCustom] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  // Deployment surface preference — captured on the 'surface' step before
  // org creation so handleCreate can persist it. Drives the in-chat
  // onboarding guide's install instructions later.
  const [surfaces, setSurfaces] = useState<'web' | 'mobile' | 'both'>('web')
  const [autoDescribe, setAutoDescribe] = useState(false)
  const [describingUrl, setDescribingUrl] = useState(false)
  const [describeError, setDescribeError] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState(true)
  const [creating, setCreating] = useState(false)
  const describeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Email not verified — must complete OTP before onboarding
  if (token && emailVerified === false) {
    return <Navigate to="/verify-email" replace />
  }

  function goBack() {
    const prev = STEP_BACK[step]
    if (prev) setStep(prev)
  }

  async function handleCreate() {
    const name = orgName.trim()
    if (!name) return
    setCreating(true)
    try {
      const resolvedIndustry = industry === 'Other' ? industryCustom.trim() : industry
      const { organization } = await createOrganization(name, {
        industry: resolvedIndustry || undefined,
        website: website.trim() ? normalizeUrl(website) : undefined,
        description: description.trim() || undefined,
        logo_url: logoDataUrl ?? undefined,
        surfaces,
      })
      addOrganization(organization)
      setCurrentOrg(organization.org_id)
      setCreatedOrgName(organization.name)
      sessionStorage.removeItem(PENDING_INVITE_ORG_NAME_KEY)
      setStep('success')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  function looksLikeCompleteUrl(url: string): boolean {
    const u = url.trim()
    return (
      /^https?:\/\/.+\.[a-z]{2,}([/?#].*)?$/i.test(u) ||
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i.test(u)
    )
  }
  function looksLikePartialUrl(url: string): boolean {
    const u = url.trim()
    if (!u) return false
    // Typed something but it's not a valid URL yet (no TLD, no dot after stripping protocol)
    return !looksLikeCompleteUrl(u)
  }
  function normalizeUrl(url: string): string {
    const u = url.trim()
    return /^https?:\/\//i.test(u) ? u : `https://${u}`
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => setLogoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  async function triggerAutoDescribe(url: string) {
    if (!looksLikeCompleteUrl(url)) return
    setDescribeError(null)
    setDescribingUrl(true)
    try {
      const result = await describeUrlPublic(normalizeUrl(url))
      if (result.description) {
        setDescription(result.description)
        setEditingDescription(false)
      } else {
        setDescribeError(
          "Lira couldn't find enough content on this site. You can write a description manually."
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('resolve') || msg.includes('not found') || msg.includes('enotfound')) {
        setDescribeError("This website doesn't seem to exist or isn't reachable.")
      } else if (msg.includes('400')) {
        setDescribeError(
          "We couldn't read this website. CheckIcon the URL or write a description manually."
        )
      } else {
        setDescribeError('Unable to reach this website. You can write a description manually.')
      }
    } finally {
      setDescribingUrl(false)
    }
  }

  function handleWebsiteChange(value: string) {
    setWebsite(value)
    setDescribeError(null)
    if (autoDescribe) {
      if (describeTimerRef.current) clearTimeout(describeTimerRef.current)
      describeTimerRef.current = setTimeout(() => {
        triggerAutoDescribe(value)
      }, 800)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
        <LiraLogo size="md" />
        <div className="flex flex-1 flex-col justify-center gap-6">
          {step === 'success' ? (
            <>
              <CelebrationGraphic />
              <p className="max-w-[220px] text-sm leading-relaxed text-gray-500">
                Your workspace is live and ready for your team.
              </p>
            </>
          ) : step === 'org-name' ? (
            <>
              <SparkleGraphic />
              <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
                {LEFT_HEADINGS[step] ?? ''}
              </h2>
            </>
          ) : (
            <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
              {LEFT_HEADINGS[step] ?? ''}
            </h2>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        {/* Mobile logo — only visible when aside is hidden */}
        <div className="flex items-center px-5 pt-6 pb-2 md:hidden">
          <LiraLogo size="md" />
        </div>
        {/* Scrollable content */}
        <div className="flex flex-1 flex-col justify-start pt-4 px-5 py-8 sm:px-10 sm:py-12 md:justify-center md:px-16">
          <div className="w-full max-w-[560px]">
            {/* Step: success */}
            {step === 'success' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#3730a3]">
                    Workspace created
                  </p>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                    Congratulations!
                    <br />
                    You're all set.
                  </h1>
                  <p className="text-base text-gray-500">
                    Your workspace is live. You can invite teammates any time from
                    <span className="font-medium text-gray-700"> Members</span> in the sidebar.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#3730a3]/20 bg-[#3730a3]/5 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#3730a3]/70">
                    Organization
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#3730a3]">{createdOrgName}</p>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setStep('attribution')}
                    className="rounded-lg bg-[#3730a3] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step: attribution ("how did you hear about us") — optional.
                The attribution step stays on the /onboarding URL until the
                user finishes it (Continue) or skips it — it is never rendered
                at /dashboard, so it can't make the real dashboard look broken
                or intercept deep links to /settings, /org/knowledge, etc.
                Only on done do we replace-navigate to /dashboard, where the
                embedded Lira onboarding widget greets them and walks them
                through setup conversationally. `replace` drops the completed
                onboarding flow from history so Back can't re-open this step or
                let the user re-run org creation. Continue POSTs the selection;
                Skip is a no-op API-wise. */}
            {step === 'attribution' && (
              <AttributionStep onDone={() => navigate('/dashboard', { replace: true })} />
            )}

            {/* Step: org-name */}
            {step === 'org-name' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    What's your organization called?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    This will be the name of your workspace in Lira.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="ob-org-name" className="text-sm font-medium text-gray-700">
                    Organization name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="ob-org-name"
                    type="text"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center justify-end border-t border-gray-100 pt-4">
                  <button
                    disabled={!orgName.trim()}
                    onClick={() => setStep('industry')}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step: industry */}
            {step === 'industry' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    What industry are you in?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Lira uses this to understand your business across every conversation and deliver
                    smarter, more relevant responses.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind === industry ? '' : ind)}
                      className={`rounded-xl border px-3 py-4 text-center text-sm font-medium transition ${
                        industry === ind
                          ? 'border-[#3730a3] bg-[#3730a3]/5 text-[#3730a3]'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Industry not listed?{' '}
                  <button
                    onClick={() => setIndustry('Other')}
                    className="text-[#3730a3] underline underline-offset-2 hover:text-[#312e81]"
                  >
                    Enter custom
                  </button>
                </p>
                {industry === 'Other' && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ob-industry-custom"
                      className="text-sm font-medium text-gray-700"
                    >
                      Your industry
                    </label>
                    <input
                      id="ob-industry-custom"
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition"
                      placeholder="Describe your industry"
                      value={industryCustom}
                      onChange={(e) => setIndustryCustom(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    onClick={() => setStep('details')}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step: details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Tell us about {orgName || 'your organization'}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    These fields are <span className="font-medium text-gray-700">optional</span> —
                    you can always add or update them later from your Knowledge Base. The more
                    context you give Lira, the smarter and more relevant its responses will be
                    across every conversation.
                  </p>
                </div>
                <div className="space-y-4">
                  {/* Logo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Organization logo{' '}
                      <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Preview */}
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50">
                        {logoDataUrl ? (
                          <img
                            src={logoDataUrl}
                            alt="Logo preview"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-gray-300">
                            {orgName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 hover:border-gray-300"
                        >
                          {logoDataUrl ? 'Change logo' : 'Upload logo'}
                        </button>
                        {logoDataUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoDataUrl(null)}
                            className="text-xs text-red-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        )}
                        <p className="text-[11px] text-gray-400">PNG, JPG or SVG. Max 2 MB.</p>
                      </div>
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoSelect}
                    />
                  </div>

                  {/* Website */}
                  <div className="space-y-1.5">
                    <label htmlFor="ob-website" className="text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <input
                      id="ob-website"
                      type="url"
                      className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 transition ${
                        looksLikePartialUrl(website)
                          ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/20'
                          : 'border-gray-300 focus:border-[#3730a3] focus:ring-[#3730a3]/20'
                      }`}
                      placeholder="https://example.com"
                      value={website}
                      onChange={(e) => handleWebsiteChange(e.target.value)}
                      maxLength={500}
                    />
                    {looksLikePartialUrl(website) ? (
                      <p className="flex items-center gap-1.5 text-xs text-amber-600">
                        <ExclamationCircleIcon className="h-3 w-3 shrink-0" />
                        Enter a valid URL, e.g. <span className="font-medium">acme.com</span>
                      </p>
                    ) : describeError ? (
                      <p className="flex items-center gap-1.5 text-xs text-red-500">
                        <ExclamationCircleIcon className="h-3 w-3 shrink-0" />
                        {describeError}
                      </p>
                    ) : null}
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="ob-description" className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <button
                        type="button"
                        disabled={website.trim() !== '' && looksLikePartialUrl(website)}
                        onClick={() => {
                          if (!website.trim()) {
                            setDescribeError(
                              'Add your website above and Lira will read it and write a description for you.'
                            )
                            return
                          }
                          const next = !autoDescribe
                          setAutoDescribe(next)
                          if (next && website.trim() && looksLikeCompleteUrl(website)) {
                            triggerAutoDescribe(website)
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          autoDescribe
                            ? 'bg-[#3730a3]/10 text-[#3730a3]'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <SparklesIcon className="h-3 w-3" />
                        {describingUrl ? 'Generating…' : 'Let Lira write it'}
                      </button>
                    </div>
                    {describingUrl && (
                      <div className="flex items-center gap-2 text-xs text-[#3730a3]">
                        <img
                          src="/lira_black.png"
                          alt="Loading"
                          className="h-3 w-3 animate-spin opacity-50"
                          style={{ animationDuration: '1.2s' }}
                        />
                        Lira is reading your website…
                      </div>
                    )}
                    {editingDescription ? (
                      <>
                        <textarea
                          id="ob-description"
                          className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition"
                          rows={4}
                          placeholder="What does your organization do? This helps Lira understand your business."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          maxLength={1000}
                        />
                        {description.trim() && (
                          <button
                            type="button"
                            onClick={() => setEditingDescription(false)}
                            className="flex items-center gap-1.5 text-xs font-medium text-[#3730a3] hover:text-[#312e81]"
                          >
                            <CheckIcon className="h-3 w-3" />
                            Done editing
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm leading-relaxed text-gray-900">
                          {description}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingDescription(true)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#3730a3] hover:text-[#312e81]"
                        >
                          <PencilIcon className="h-3 w-3" />
                          Edit description
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <div className="flex items-center gap-3">
                    {website.trim() || description.trim() ? null : (
                      <button
                        type="button"
                        disabled={creating}
                        onClick={() => setStep('surface')}
                        className="text-sm text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
                      >
                        Skip &amp; continue
                      </button>
                    )}
                    <button
                      disabled={creating}
                      onClick={() => setStep('surface')}
                      className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                    >
                      {creating ? (
                        <span className="flex items-center gap-2">
                          <img
                            src="/lira_black.png"
                            alt="Loading"
                            className="h-4 w-4 animate-spin opacity-50"
                            style={{ animationDuration: '1.2s' }}
                          />
                          Loading…
                        </span>
                      ) : (
                        'Continue'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step: surface — which deployment surface are they planning?
                Drives the in-chat install instructions later (web embed vs
                mobile WebView wrapper). Saved on createOrganization(). */}
            {step === 'surface' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#3730a3]">
                    Where will Lira live?
                  </p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                    Pick your surface
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Helps Lira tailor your install instructions. You can change this later.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {(
                    [
                      {
                        id: 'web',
                        title: 'Web only',
                        desc: 'You only need the chat widget on a website (marketing site, dashboard, web app).',
                        emoji: '🖥️',
                      },
                      {
                        id: 'mobile',
                        title: 'Mobile app only',
                        desc: 'You only need Lira inside an iOS or Android app. Today this is a WebView wrapper; native SDKs are roadmap.',
                        emoji: '📱',
                      },
                      {
                        id: 'both',
                        title: 'Both web and mobile',
                        desc: 'You plan to ship Lira on both your web product and your mobile app.',
                        emoji: '🌐',
                      },
                    ] as const
                  ).map((opt) => {
                    const isSelected = surfaces === opt.id
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSurfaces(opt.id)}
                        className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition ${
                          isSelected
                            ? 'border-[#3730a3] bg-[#3730a3]/5 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl" aria-hidden>
                          {opt.emoji}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                isSelected ? 'text-[#3730a3]' : 'text-gray-900'
                              }`}
                            >
                              {opt.title}
                            </p>
                          </div>
                          <p className="mt-0.5 text-xs leading-5 text-gray-500">{opt.desc}</p>
                        </div>
                        <CheckIcon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            isSelected ? 'text-[#3730a3]' : 'text-transparent'
                          }`}
                        />
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
                  <button
                    disabled={creating}
                    onClick={handleCreate}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                  >
                    {creating ? 'Creating…' : 'Create workspace'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export { OnboardingPage }
