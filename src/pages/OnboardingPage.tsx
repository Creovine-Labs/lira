import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Loader2,
  UserPlus,
  Plus,
  ArrowLeft,
  Sparkles,
  Pencil,
  Check,
  AlertCircle,
} from 'lucide-react'
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
  'Transportation & Logistics',
  'Food & Beverage',
  'Non-profit',
  'Government',
  'Energy',
  'Telecommunications',
  'Other',
]

function OnboardingPage() {
  const navigate = useNavigate()
  const { addOrganization, setCurrentOrg } = useOrgStore()

  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')

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
      toast.success(`${organization.name} created!`)
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  function looksLikeCompleteUrl(url: string): boolean {
    const u = url.trim()
    // Match full URLs or bare domains with a TLD
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
          "We couldn't read this website. Check the URL or write a description manually."
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
      navigate('/')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to join organization')
    } finally {
      setJoining(false)
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-violet-50/30 p-4 dark:to-violet-950/20">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card shadow-xl shadow-black/5">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 border-b px-8 py-8">
            <LiraLogo size="lg" />
            <h1 className="text-lg font-semibold text-foreground">Give Lira Context</h1>
            <p className="text-center text-sm text-muted-foreground">
              Organizations let Lira understand your team. The details you add here — your company
              profile, website, and description — help Lira give smarter, more relevant answers in
              every meeting.
            </p>
          </div>

          <div className="px-8 py-6">
            {mode === 'choose' && (
              <div className="space-y-3">
                <button
                  onClick={() => setMode('create')}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background px-4 py-4 text-left transition hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40">
                    <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Create Organization</p>
                    <p className="text-xs text-muted-foreground">
                      Set up your team's context so Lira knows your business
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setMode('join')}
                  className="flex w-full items-center gap-3 rounded-xl border bg-background px-4 py-4 text-left transition hover:border-violet-500/50 hover:bg-violet-50/50 dark:hover:bg-violet-950/30"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Join Organization</p>
                    <p className="text-xs text-muted-foreground">
                      Join a team that's already set up their context
                    </p>
                  </div>
                </button>
              </div>
            )}

            {mode === 'create' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="onboard-org-name"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="onboard-org-name"
                    type="text"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div>
                  <label
                    htmlFor="onboard-industry"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Industry
                  </label>
                  <select
                    id="onboard-industry"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  >
                    <option value="">Select…</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                  {industry === 'Other' && (
                    <input
                      type="text"
                      className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                      placeholder="Describe your industry"
                      value={industryCustom}
                      onChange={(e) => setIndustryCustom(e.target.value)}
                      maxLength={100}
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="onboard-website"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Website
                  </label>
                  <input
                    id="onboard-website"
                    type="url"
                    className={`w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 ${
                      looksLikePartialUrl(website)
                        ? 'border-amber-400 focus:border-amber-400 focus:ring-amber-400/30'
                        : 'focus:border-violet-500 focus:ring-violet-500/30'
                    }`}
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => handleWebsiteChange(e.target.value)}
                    maxLength={500}
                  />
                  {looksLikePartialUrl(website) ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      Please enter a valid website, e.g.{' '}
                      <span className="font-medium">creovine.com</span>
                    </p>
                  ) : describeError ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {describeError}
                    </p>
                  ) : null}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="onboard-description"
                      className="text-sm font-medium text-foreground"
                    >
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
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {describingUrl ? 'Generating…' : 'Let Lira write it'}
                    </button>
                  </div>
                  {!autoDescribe && !description && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      Have a website? Lira can read it to understand your business and write a
                      description for you.
                    </p>
                  )}
                  {describingUrl && (
                    <div className="mb-2 flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Lira is reading your website…
                    </div>
                  )}
                  {editingDescription ? (
                    <>
                      <textarea
                        id="onboard-description"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
                        rows={3}
                        placeholder="What does your organization do? This helps Lira understand your business."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={1000}
                      />
                      {description.trim() && (
                        <button
                          type="button"
                          onClick={() => setEditingDescription(false)}
                          className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                        >
                          <Check className="h-3 w-3" />
                          Done editing
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                        {description}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingDescription(true)}
                        className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit description
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating || !orgName.trim()}
                  className="w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                >
                  {creating ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Create Organization
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setMode('choose')}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            )}

            {mode === 'join' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="onboard-invite-code"
                    className="mb-1.5 block text-sm font-medium text-foreground"
                  >
                    Invite Code
                  </label>
                  <input
                    id="onboard-invite-code"
                    type="text"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono uppercase tracking-wider outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
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
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      Organization found: {validatedOrg.name}
                    </p>
                  </div>
                )}

                {!validatedOrg ? (
                  <button
                    onClick={handleValidate}
                    disabled={validating || !inviteCode.trim()}
                    className="w-full rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-600 transition hover:bg-violet-500/20 disabled:opacity-50 dark:text-violet-400"
                  >
                    {validating ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validating…
                      </span>
                    ) : (
                      'Validate Code'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {joining ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Joining…
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        Join {validatedOrg.name}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => {
                    setMode('choose')
                    setValidatedOrg(null)
                    setInviteCode('')
                  }}
                  className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export { OnboardingPage }
