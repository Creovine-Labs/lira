import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationCircleIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore } from '@/app/store'
import {
  createOrganization,
  describeUrlPublic,
  joinOrganization,
  validateInviteCode,
} from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

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

type FlowStep = 'choose' | 'org-name' | 'industry' | 'details' | 'join-code' | 'success'

const STEP_BACK: Partial<Record<FlowStep, FlowStep>> = {
  'org-name': 'choose',
  industry: 'org-name',
  details: 'industry',
  'join-code': 'choose',
}

const LEFT_HEADINGS: Partial<Record<FlowStep, string>> = {
  'org-name': 'Create your\nworkspace',
  industry: 'Tailor your\nexperience',
  details: 'Almost\nthere',
  'join-code': 'Join your\nteam',
}

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
      <circle cx="80" cy="80" r="56" stroke="#DDD6FE" strokeWidth="3" />
      {/* Inner fill circle */}
      <circle cx="80" cy="80" r="44" fill="#EDE9FE" />
      {/* CheckIcon circle */}
      <circle cx="80" cy="80" r="32" fill="#7C3AED" />
      {/* Checkmark */}
      <polyline
        points="64,80 75,91 97,68"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkle dots */}
      <circle cx="80" cy="16" r="4" fill="#A78BFA" />
      <circle cx="80" cy="144" r="4" fill="#7C3AED" />
      <circle cx="16" cy="80" r="4" fill="#C4B5FD" />
      <circle cx="144" cy="80" r="4" fill="#5B21B6" />
      <circle cx="37" cy="37" r="3" fill="#DDD6FE" />
      <circle cx="123" cy="37" r="3" fill="#8B5CF6" />
      <circle cx="37" cy="123" r="3" fill="#6D28D9" />
      <circle cx="123" cy="123" r="3" fill="#A78BFA" />
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
      <circle cx="80" cy="80" r="8" fill="#7C3AED" />
      <line
        x1="80"
        y1="80"
        x2="80"
        y2="18"
        stroke="#7C3AED"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="80"
        y2="142"
        stroke="#A78BFA"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="18"
        y2="80"
        stroke="#DDD6FE"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="142"
        y2="80"
        stroke="#7C3AED"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="35"
        y2="35"
        stroke="#C4B5FD"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="125"
        y2="35"
        stroke="#5B21B6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="35"
        y2="125"
        stroke="#4C1D95"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="125"
        y2="125"
        stroke="#8B5CF6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="52"
        y2="22"
        stroke="#EDE9FE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="108"
        y2="22"
        stroke="#DDD6FE"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="22"
        y2="52"
        stroke="#7C3AED"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="138"
        y2="52"
        stroke="#A78BFA"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="22"
        y2="108"
        stroke="#C4B5FD"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="138"
        y2="108"
        stroke="#6D28D9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="52"
        y2="138"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="80"
        y1="80"
        x2="108"
        y2="138"
        stroke="#4C1D95"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const { addOrganization, setCurrentOrg } = useOrgStore()

  const [step, setStep] = useState<FlowStep>('choose')
  const [createdOrgName, setCreatedOrgName] = useState('')

  // Create org state
  const [orgName, setOrgName] = useState('')
  const [industry, setIndustry] = useState('')
  const [industryCustom, setIndustryCustom] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [autoDescribe, setAutoDescribe] = useState(false)
  const [describingUrl, setDescribingUrl] = useState(false)
  const [describeError, setDescribeError] = useState<string | null>(null)
  const [editingDescription, setEditingDescription] = useState(true)
  const [creating, setCreating] = useState(false)
  const describeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Join org state
  const [inviteCode, setInviteCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [validating, setValidating] = useState(false)
  const [validatedOrg, setValidatedOrg] = useState<{ name: string; org_id: string } | null>(null)

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
      })
      addOrganization(organization)
      setCurrentOrg(organization.org_id)
      setCreatedOrgName(organization.name)
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

  async function handleValidate() {
    const code = inviteCode.trim().toUpperCase()
    // Full invite code format is LRA-XXXX (8 chars); don't fire until complete
    if (code.length < 8) return
    setValidating(true)
    setValidatedOrg(null)
    try {
      const res = await validateInviteCode(code)
      if (res.valid && res.organization) {
        setValidatedOrg(res.organization)
      } else {
        toast.error('Invalid invite code')
      }
    } catch {
      toast.error('Could not validate invite code')
    } finally {
      setValidating(false)
    }
  }

  async function handleJoin() {
    const code = inviteCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    try {
      const { organization } = await joinOrganization(code)
      addOrganization(organization)
      setCurrentOrg(organization.org_id)
      toast.success(`Joined ${organization.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join organization')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ── */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 px-10 py-10">
        <LiraLogo size="md" />
        <div className="flex flex-1 flex-col justify-center gap-6">
          {step === 'choose' ? (
            <>
              <SparkleGraphic />
              <p className="max-w-[220px] text-sm leading-relaxed text-gray-500">
                One platform for every meeting, every decision, every team.
              </p>
            </>
          ) : step === 'success' ? (
            <>
              <CelebrationGraphic />
              <p className="max-w-[220px] text-sm leading-relaxed text-gray-500">
                Your workspace is live and ready for your team.
              </p>
            </>
          ) : (
            <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
              {LEFT_HEADINGS[step] ?? ''}
            </h2>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex flex-1 flex-col bg-white">
        {/* Scrollable content */}
        <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 md:px-16">
          <div className="w-full max-w-[560px]">
            {/* Step: success */}
            {step === 'success' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-violet-500">
                    Workspace created
                  </p>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                    Congratulations!
                    <br />
                    You're all set.
                  </h1>
                  <p className="text-base text-gray-500">
                    Your organization is ready. Invite your team, connect your meetings, and let
                    Lira get to work.
                  </p>
                </div>
                <div className="rounded-2xl border border-violet-200 bg-violet-50 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-violet-400">
                    Organization
                  </p>
                  <p className="mt-1 text-2xl font-bold text-violet-700">{createdOrgName}</p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Schedule and join AI-powered meetings',
                    'Get real-time transcripts and summaries',
                    'Build a shared knowledge base for your team',
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
                        <CheckIcon className="h-3 w-3 text-violet-600" />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step: choose */}
            {step === 'choose' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    How do you want to get started?
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Organizations let Lira understand your team's context.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setStep('org-name')}
                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:border-violet-400 hover:bg-violet-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 transition group-hover:bg-violet-200">
                      <PlusIcon className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Create an organization</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Set up your team's workspace from scratch
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => setStep('join-code')}
                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 transition group-hover:bg-emerald-200">
                      <UserPlusIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Join an organization</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Join a team using an invite code
                      </p>
                    </div>
                  </button>
                </div>
              </div>
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
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    maxLength={100}
                  />
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
                    We'll focus Lira's experience based on your choice.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      onClick={() => setIndustry(ind === industry ? '' : ind)}
                      className={`rounded-xl border px-3 py-4 text-center text-sm font-medium transition ${
                        industry === ind
                          ? 'border-violet-500 bg-violet-50 text-violet-700'
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
                    className="text-violet-600 underline underline-offset-2 hover:text-violet-500"
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
                      className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      placeholder="Describe your industry"
                      value={industryCustom}
                      onChange={(e) => setIndustryCustom(e.target.value)}
                      maxLength={100}
                    />
                  </div>
                )}
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
                    This helps Lira give smarter, more relevant answers in every meeting.
                  </p>
                </div>
                <div className="space-y-4">
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
                          : 'border-gray-300 focus:border-violet-500 focus:ring-violet-500/20'
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
                          const next = !autoDescribe
                          setAutoDescribe(next)
                          if (next && website.trim() && looksLikeCompleteUrl(website)) {
                            triggerAutoDescribe(website)
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                          autoDescribe
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        } disabled:cursor-not-allowed disabled:opacity-40`}
                      >
                        <SparklesIcon className="h-3 w-3" />
                        {describingUrl ? 'Generating…' : 'Let Lira write it'}
                      </button>
                    </div>
                    {describingUrl && (
                      <div className="flex items-center gap-2 text-xs text-violet-600">
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                        Lira is reading your website…
                      </div>
                    )}
                    {editingDescription ? (
                      <>
                        <textarea
                          id="ob-description"
                          className="w-full resize-none rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
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
                            className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500"
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
                          className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500"
                        >
                          <PencilIcon className="h-3 w-3" />
                          Edit description
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step: join-code */}
            {step === 'join-code' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Enter your invite code
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Ask your team admin for the invite code to join their workspace.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="ob-invite" className="text-sm font-medium text-gray-700">
                      Invite code
                    </label>
                    <input
                      id="ob-invite"
                      type="text"
                      className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-sm uppercase tracking-widest text-gray-900 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                      placeholder="LRA-XXXX"
                      value={inviteCode}
                      onChange={(e) => {
                        setInviteCode(e.target.value)
                        setValidatedOrg(null)
                      }}
                      maxLength={10}
                    />
                  </div>
                  {validatedOrg && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-700">
                        Organization found: {validatedOrg.name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer: Back + primary action ── */}
        <footer className="shrink-0 border-t border-gray-200 px-5 py-4 sm:px-10 md:px-16">
          <div className="flex w-full max-w-[560px] items-center justify-between">
            {/* Back */}
            {STEP_BACK[step] && step !== 'success' ? (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {/* Primary action */}
            {step === 'choose' && <div />}
            {step === 'org-name' && (
              <button
                disabled={!orgName.trim()}
                onClick={() => setStep('industry')}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            )}
            {step === 'industry' && (
              <button
                onClick={() => setStep('details')}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Next
              </button>
            )}
            {step === 'details' && (
              <button
                disabled={creating}
                onClick={handleCreate}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Creating…
                  </span>
                ) : (
                  'Create workspace'
                )}
              </button>
            )}
            {step === 'success' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Enter workspace
              </button>
            )}
            {step === 'join-code' && (
              <button
                disabled={joining || validating || (!validatedOrg && inviteCode.trim().length < 8)}
                onClick={validatedOrg ? handleJoin : handleValidate}
                className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
              >
                {joining ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Joining…
                  </span>
                ) : validating ? (
                  <span className="flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Validating…
                  </span>
                ) : validatedOrg ? (
                  `Join ${validatedOrg.name}`
                ) : (
                  'Validate code'
                )}
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}

export { OnboardingPage }
