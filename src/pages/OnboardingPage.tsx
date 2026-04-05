import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ExclamationCircleIcon,
  PencilIcon,
  PlusIcon,
  SparklesIcon,
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
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

type FlowStep = 'choose' | 'org-name' | 'industry' | 'details' | 'success' | 'invite' | 'join-code'

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
  invite: 'Grow your\nteam',
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

function OnboardingPage() {
  const navigate = useNavigate()
  const { token, emailVerified } = useAuthStore()
  const { addOrganization, setCurrentOrg } = useOrgStore()

  const [step, setStep] = useState<FlowStep>('choose')
  const [createdOrgName, setCreatedOrgName] = useState('')
  const [createdInviteCode, setCreatedInviteCode] = useState('')
  const [inviteCopied, setInviteCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState(false)

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
      })
      addOrganization(organization)
      setCurrentOrg(organization.org_id)
      setCreatedOrgName(organization.name)
      setCreatedInviteCode(organization.invite_code)
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
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
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
          ) : step === 'invite' ? (
            <>
              <div className="flex h-[160px] w-[160px] items-center justify-center rounded-full bg-[#3730a3]/10">
                <UsersIcon className="h-20 w-20 text-[#3730a3]" />
              </div>
              <p className="max-w-[220px] text-sm leading-relaxed text-gray-500">
                Bring your team on board so nothing falls through the cracks.
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
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        {/* Mobile logo — only visible when aside is hidden */}
        <div className="flex items-center px-5 pt-6 pb-2 md:hidden">
          <LiraLogo size="md" />
        </div>
        {/* Scrollable content */}
        <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 md:px-16">
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
                    Your organization is ready. Invite your team, connect your meetings, and let
                    Lira get to work.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#3730a3]/20 bg-[#3730a3]/5 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#3730a3]/70">
                    Organization
                  </p>
                  <p className="mt-1 text-2xl font-bold text-[#3730a3]">{createdOrgName}</p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Schedule and join AI-powered meetings',
                    'Get real-time transcripts and summaries',
                    'Build a shared knowledge base for your team',
                  ].map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3730a3]/10">
                        <CheckIcon className="h-3 w-3 text-[#3730a3]" />
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setStep('invite')}
                    className="rounded-lg bg-[#3730a3] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step: invite */}
            {step === 'invite' && (
              <div className="space-y-8">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-widest text-[#3730a3]">
                    Invite your team
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Share your invite code
                  </h1>
                  <p className="text-sm text-gray-500">
                    Lira works best when your whole team is on board. Share the code below so
                    teammates can join{' '}
                    <span className="font-medium text-gray-700">{createdOrgName}</span> and start
                    collaborating right away — tasks, meeting notes, and notifications will flow to
                    the right people.
                  </p>
                </div>

                {/* Invite code */}
                <div className="rounded-2xl border border-[#3730a3]/20 bg-[#3730a3]/5 px-6 py-5">
                  <p className="text-xs font-medium uppercase tracking-widest text-[#3730a3]/70">
                    Invite Code
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-3xl font-bold tracking-widest text-[#3730a3]">
                      {createdInviteCode}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdInviteCode)
                        setInviteCopied(true)
                        setTimeout(() => setInviteCopied(false), 2000)
                      }}
                      className="flex items-center gap-1 rounded-lg border border-[#3730a3]/30 bg-white px-2.5 py-1.5 text-xs font-medium text-[#3730a3] transition hover:bg-[#3730a3]/5"
                    >
                      {inviteCopied ? (
                        <>
                          <ClipboardDocumentCheckIcon className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          Copy code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Copyable invite message */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-widest text-gray-400">
                    Or share this message
                  </p>
                  <div className="relative rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-relaxed text-gray-700">
                    <p>
                      Hey! I'm using Lira to run AI-powered meetings, interviews, and tasks for our
                      team. Join our workspace so you can get meeting notes, task assignments, and
                      notifications automatically.
                    </p>
                    <p className="mt-2">
                      1. Go to{' '}
                      <span className="font-medium text-[#3730a3]">
                        https://liraintelligence.com
                      </span>
                      <br />
                      2. Sign up and choose{' '}
                      <span className="font-semibold">"Join an organization"</span>
                      <br />
                      3. Enter invite code:{' '}
                      <span className="font-bold tracking-wider">{createdInviteCode}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const msg = `Hey! I'm using Lira to run AI-powered meetings, interviews, and tasks for our team. Join our workspace so you can get meeting notes, task assignments, and notifications automatically.\n\n1. Go to https://liraintelligence.com\n2. Sign up and choose "Join an organization"\n3. Enter invite code: ${createdInviteCode}`
                        navigator.clipboard.writeText(msg)
                        setMessageCopied(true)
                        setTimeout(() => setMessageCopied(false), 2000)
                      }}
                      className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
                    >
                      {messageCopied ? (
                        <>
                          <ClipboardDocumentCheckIcon className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="h-3 w-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm text-gray-400 transition hover:text-gray-600"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="rounded-lg bg-[#3730a3] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81]"
                  >
                    Enter workspace
                  </button>
                </div>
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
                    className="group flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 text-left transition hover:border-[#3730a3]/40 hover:bg-[#3730a3]/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3730a3]/10 transition group-hover:bg-[#3730a3]/20">
                      <PlusIcon className="h-5 w-5 text-[#3730a3]" />
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
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </button>
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
                    Lira uses this to understand your organization's context during meetings and
                    deliver smarter, more relevant responses.
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
                  <button
                    disabled={creating}
                    onClick={handleCreate}
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
                        Creating…
                      </span>
                    ) : (
                      'Create workspace'
                    )}
                  </button>
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
                      className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-sm uppercase tracking-widest text-gray-900 outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition"
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
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    disabled={
                      joining || validating || (!validatedOrg && inviteCode.trim().length < 8)
                    }
                    onClick={validatedOrg ? handleJoin : handleValidate}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                  >
                    {joining ? (
                      <span className="flex items-center gap-2">
                        <img
                          src="/lira_black.png"
                          alt="Loading"
                          className="h-4 w-4 animate-spin opacity-50"
                          style={{ animationDuration: '1.2s' }}
                        />
                        Joining…
                      </span>
                    ) : validating ? (
                      <span className="flex items-center gap-2">
                        <img
                          src="/lira_black.png"
                          alt="Loading"
                          className="h-4 w-4 animate-spin opacity-50"
                          style={{ animationDuration: '1.2s' }}
                        />
                        Validating…
                      </span>
                    ) : validatedOrg ? (
                      `Join ${validatedOrg.name}`
                    ) : (
                      'Validate code'
                    )}
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
