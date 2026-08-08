import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Building2,
  Check,
  Loader2,
  LogOut,
  Mic,
  PhoneCall,
  Plus,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  createOrganization,
  createVoiceLineRequest,
  credentials,
  exchangeVoiceSso,
  getAuthMe,
  getVoiceOnboarding,
  listOrganizations,
  login,
  saveVoiceBusinessProfile,
  saveVoicePlanIntent,
  signup,
  type Organization,
  type VoiceOnboardingState,
} from '@/services/api'
import { VoicePhoneDemo } from '@/components/voice/VoicePhoneDemo'
import { cn } from '@/lib'

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
    detail: 'For teams with a consented actor recording and approved clone profile.',
  },
]

const PLANS = [
  { tier: 'starter', label: 'Starter', usd: 4900, ngn: 7900000 },
  { tier: 'growth', label: 'Growth', usd: 9900, ngn: 15500000 },
  { tier: 'business', label: 'Business', usd: 19900, ngn: 31500000 },
  { tier: 'enterprise', label: 'Enterprise', usd: undefined, ngn: undefined },
] as const

type AuthMode = 'login' | 'signup'
type BusinessTextField =
  | 'businessName'
  | 'industry'
  | 'businessCategory'
  | 'offerings'
  | 'hours'
  | 'prices'
  | 'policies'
  | 'personality'

function setSession(
  auth: ReturnType<typeof useAuthStore.getState>,
  data: Awaited<ReturnType<typeof login>>
) {
  credentials.set(data.token)
  auth.setCredentials(
    data.token,
    data.user.email,
    data.user.name,
    data.user.picture,
    data.user.id,
    data.user.emailVerified,
    data.user.role
  )
  if (data.user.planTier) auth.setPlanTier(data.user.planTier)
}

function appBridgeUrl() {
  const current = `${window.location.origin}${window.location.pathname}${window.location.search}`
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `/voice-sso?returnTo=${encodeURIComponent(current)}`
  }
  return `https://app.liraintelligence.com/voice-sso?returnTo=${encodeURIComponent(current)}`
}

function AuthPanel() {
  const auth = useAuthStore()
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data =
        mode === 'login'
          ? await login(email, password)
          : await signup(name, email, password, company || name)
      setSession(auth, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid min-h-screen bg-[#171412] text-[#f4f0e8] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center gap-3">
          <img src="/lira_mark_white.png" alt="Lira" className="h-9 w-9" />
          <span className="text-sm font-semibold">Lira Voice</span>
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-lg">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Add a Nigerian voice to your customer line.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/60">
              Save your business profile, pick the support voice, choose how calls should route, and
              track setup from one app.
            </p>
            <a
              href={appBridgeUrl()}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#171412]"
            >
              Continue from dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center bg-[#f4f0e8] px-6 py-10 text-[#171412]">
        <form
          onSubmit={submit}
          className="w-full max-w-md rounded-lg border border-black/10 bg-white p-5 shadow-sm"
        >
          <div className="flex rounded-full bg-black/[0.06] p-1">
            {(['login', 'signup'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cn(
                  'flex-1 rounded-full px-4 py-2 text-sm font-semibold transition',
                  mode === item ? 'bg-[#171412] text-white' : 'text-black/55 hover:text-black'
                )}
              >
                {item === 'login' ? 'Log in' : 'Create account'}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-black/55">
                Your name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-2.5 text-sm text-[#171412] outline-none focus:border-black/40"
                />
              </label>
              <label className="text-xs font-semibold text-black/55">
                Company
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-2.5 text-sm text-[#171412] outline-none focus:border-black/40"
                />
              </label>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-semibold text-black/55">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-2.5 text-sm text-[#171412] outline-none focus:border-black/40"
              />
            </label>
            <label className="block text-xs font-semibold text-black/55">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="mt-1 w-full rounded-md border border-black/12 bg-white px-3 py-2.5 text-sm text-[#171412] outline-none focus:border-black/40"
              />
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#171412] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'login' ? 'Log in to Voice' : 'Create Voice account'}
          </button>
        </form>
      </div>
    </section>
  )
}

function PublicDemo() {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5">
      <div className="mb-5 text-center sm:text-left">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">Live demo</p>
        <h2 className="mt-1 text-xl font-semibold">Test the AI on a sample restaurant</h2>
        <p className="mt-1 max-w-xl text-sm leading-6 text-black/55">
          Place a test call and hear the AI answer in a Nigerian voice — the same engine that will
          answer your customers.
        </p>
      </div>
      <VoicePhoneDemo />
    </section>
  )
}

function VoiceAppShell() {
  const auth = useAuthStore()
  const orgStore = useOrgStore()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [state, setState] = useState<VoiceOnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newOrgName, setNewOrgName] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('NGN')
  const [business, setBusiness] = useState({
    businessName: '',
    industry: '',
    businessCategory: '',
    inboundCallsPerDay: '',
    decisionMaker: false,
    canStartWithinDays: '30',
    willingnessToPay: false,
    offerings: '',
    hours: '',
    prices: '',
    policies: '',
    personality: '',
    chosenVoice: 'professional_ng_female',
  })
  const [line, setLine] = useState({
    option: 'forward_existing' as 'forward_existing' | 'request_number',
    existingNumber: '',
    preferredCountry: 'Nigeria',
    preferredCity: 'Lagos',
    forwardingReadiness: '',
    notes: '',
  })

  const selectedOrg = useMemo(
    () => organizations.find((org) => org.org_id === selectedOrgId) ?? null,
    [organizations, selectedOrgId]
  )

  const refreshOrgs = useCallback(async () => {
    const orgs = await listOrganizations()
    setOrganizations(orgs)
    orgStore.setOrganizations(orgs)
    const id =
      orgStore.currentOrgId && orgs.some((org) => org.org_id === orgStore.currentOrgId)
        ? orgStore.currentOrgId
        : orgs[0]?.org_id
    setSelectedOrgId(id ?? null)
    return id ?? null
  }, [orgStore])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setLoading(true)
      setError(null)
      try {
        await getAuthMe().then(({ user }) => {
          auth.setCredentials(
            credentials.getToken() || auth.token || '',
            user.email ?? undefined,
            user.name ?? undefined,
            undefined,
            user.id,
            user.emailVerified ?? undefined,
            user.role ?? undefined
          )
          auth.setPlanTier(user.planTier)
        })
        const id = await refreshOrgs()
        if (!cancelled && !id) setLoading(false)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load Voice app')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedOrgId) {
      setState(null)
      return
    }
    let cancelled = false
    setLoading(true)
    getVoiceOnboarding(selectedOrgId)
      .then((next) => {
        if (cancelled) return
        setState(next)
        if (next.businessProfile) {
          setBusiness({
            businessName: next.businessProfile.businessName,
            industry: next.businessProfile.industry ?? '',
            businessCategory: next.businessProfile.businessCategory ?? '',
            inboundCallsPerDay: String(next.businessProfile.inboundCallsPerDay ?? ''),
            decisionMaker: Boolean(next.businessProfile.decisionMaker),
            canStartWithinDays: String(next.businessProfile.canStartWithinDays ?? '30'),
            willingnessToPay: Boolean(next.businessProfile.willingnessToPay),
            offerings: next.businessProfile.offerings ?? '',
            hours: next.businessProfile.hours ?? '',
            prices: next.businessProfile.prices ?? '',
            policies: next.businessProfile.policies ?? '',
            personality: next.businessProfile.personality ?? '',
            chosenVoice: next.businessProfile.chosenVoice,
          })
        } else if (selectedOrg) {
          setBusiness((prev) => ({ ...prev, businessName: selectedOrg.name }))
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load Voice setup'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedOrgId, selectedOrg])

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!newOrgName.trim()) return
    setSaving('org')
    try {
      const created = await createOrganization(newOrgName.trim(), {
        company_name: newOrgName.trim(),
        surfaces: 'both',
      })
      const orgs = [...organizations, created.organization]
      setOrganizations(orgs)
      orgStore.setOrganizations(orgs)
      orgStore.setCurrentOrg(created.organization.org_id)
      setSelectedOrgId(created.organization.org_id)
      setNewOrgName('')
    } finally {
      setSaving(null)
    }
  }

  async function saveBusiness(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSaving('business')
    try {
      await saveVoiceBusinessProfile(selectedOrgId, {
        ...business,
        inboundCallsPerDay: business.inboundCallsPerDay
          ? Number(business.inboundCallsPerDay)
          : undefined,
        canStartWithinDays: business.canStartWithinDays
          ? Number(business.canStartWithinDays)
          : undefined,
      })
      setState(await getVoiceOnboarding(selectedOrgId))
    } finally {
      setSaving(null)
    }
  }

  async function saveLine(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrgId) return
    setSaving('line')
    try {
      await createVoiceLineRequest(selectedOrgId, line)
      setState(await getVoiceOnboarding(selectedOrgId))
    } finally {
      setSaving(null)
    }
  }

  async function choosePlan(tier: (typeof PLANS)[number]['tier'], amount?: number) {
    if (!selectedOrgId) return
    setSaving(`plan:${tier}`)
    try {
      await saveVoicePlanIntent(selectedOrgId, {
        tier,
        currency,
        interval: 'monthly',
        quotedAmountCents: amount,
      })
      setState(await getVoiceOnboarding(selectedOrgId))
    } finally {
      setSaving(null)
    }
  }

  function signOut() {
    credentials.clear()
    auth.clearCredentials()
    orgStore.clear()
    window.location.reload()
  }

  return (
    <main className="min-h-screen bg-[#f4f0e8] text-[#171412]">
      <header className="sticky top-0 z-20 border-b border-black/10 bg-[#f4f0e8]/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/lira_black.png" alt="Lira" className="h-9 w-9" />
            <div>
              <p className="text-sm font-semibold">Lira Voice</p>
              <p className="text-xs text-black/45">Phone agent setup</p>
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 px-3 py-2 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">Workspace</p>
            <select
              value={selectedOrgId ?? ''}
              onChange={(e) => {
                setSelectedOrgId(e.target.value || null)
                orgStore.setCurrentOrg(e.target.value || null)
              }}
              className="mt-3 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm"
            >
              {organizations.map((org) => (
                <option key={org.org_id} value={org.org_id}>
                  {org.name}
                </option>
              ))}
            </select>
            <form onSubmit={createOrg} className="mt-3 flex gap-2">
              <input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="New workspace"
                className="min-w-0 flex-1 rounded-md border border-black/10 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={saving === 'org'}
                className="grid h-10 w-10 place-items-center rounded-md bg-black text-white"
                aria-label="Create workspace"
              >
                {saving === 'org' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </button>
            </form>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/40">
              Setup status
            </p>
            <div className="mt-3 space-y-2">
              {(state?.setupStatus.checklist ?? []).map((item) => (
                <div key={item.key} className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      'grid h-5 w-5 place-items-center rounded-full',
                      item.done ? 'bg-emerald-600 text-white' : 'bg-black/10 text-black/35'
                    )}
                  >
                    {item.done && <Check className="h-3 w-3" />}
                  </span>
                  <span className={item.done ? 'text-black/50' : 'text-black/80'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-5">
          <PublicDemo />

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          {loading && (
            <div className="rounded-lg border border-black/10 bg-white p-6 text-sm text-black/55">
              Loading Voice setup...
            </div>
          )}

          {!selectedOrgId && !loading ? (
            <section className="rounded-lg border border-black/10 bg-white p-8 text-center">
              <Building2 className="mx-auto h-8 w-8 text-black/45" />
              <h2 className="mt-4 text-2xl font-semibold">Create a workspace to continue</h2>
              <p className="mt-2 text-sm text-black/55">
                Voice setup is saved against an organization so calls, transcripts, billing intent,
                and support context stay separated.
              </p>
            </section>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <form
                onSubmit={saveBusiness}
                className="rounded-lg border border-black/10 bg-white p-4"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-lg font-semibold">Describe your business</h2>
                </div>
                <div className="mt-4 grid gap-3">
                  {(
                    [
                      ['businessName', 'Business name'],
                      ['industry', 'Industry'],
                      ['businessCategory', 'Business category'],
                      ['offerings', 'Offerings'],
                      ['hours', 'Hours'],
                      ['prices', 'Prices'],
                      ['policies', 'Policies'],
                      ['personality', 'Personality instructions'],
                    ] as Array<[BusinessTextField, string]>
                  ).map(([key, label]) => (
                    <label key={key} className="text-xs font-semibold text-black/50">
                      {label}
                      {key === 'offerings' ||
                      key === 'prices' ||
                      key === 'policies' ||
                      key === 'personality' ? (
                        <textarea
                          value={String(business[key] ?? '')}
                          onChange={(e) =>
                            setBusiness((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          rows={3}
                          className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-black/35"
                        />
                      ) : (
                        <input
                          value={String(business[key] ?? '')}
                          onChange={(e) =>
                            setBusiness((prev) => ({ ...prev, [key]: e.target.value }))
                          }
                          required={key === 'businessName'}
                          className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-black/35"
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-semibold text-black/50">
                    Calls per day
                    <input
                      type="number"
                      min={0}
                      value={business.inboundCallsPerDay}
                      onChange={(e) =>
                        setBusiness((prev) => ({ ...prev, inboundCallsPerDay: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm text-black outline-none focus:border-black/35"
                    />
                  </label>
                  <label className="text-xs font-semibold text-black/50">
                    Start timeline
                    <select
                      value={business.canStartWithinDays}
                      onChange={(e) =>
                        setBusiness((prev) => ({ ...prev, canStartWithinDays: e.target.value }))
                      }
                      className="mt-1 w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm text-black outline-none focus:border-black/35"
                    >
                      <option value="7">Within 7 days</option>
                      <option value="30">Within 30 days</option>
                      <option value="90">Within 90 days</option>
                      <option value="365">Later</option>
                    </select>
                  </label>
                  <div className="grid gap-2 pt-5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-black/65">
                      <input
                        type="checkbox"
                        checked={business.decisionMaker}
                        onChange={(e) =>
                          setBusiness((prev) => ({ ...prev, decisionMaker: e.target.checked }))
                        }
                      />
                      I can approve spend
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-black/65">
                      <input
                        type="checkbox"
                        checked={business.willingnessToPay}
                        onChange={(e) =>
                          setBusiness((prev) => ({ ...prev, willingnessToPay: e.target.checked }))
                        }
                      />
                      Shown pricing works
                    </label>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  {VOICES.map((voice) => (
                    <label
                      key={voice.id}
                      htmlFor={`voice-${voice.id}`}
                      className={cn(
                        'flex cursor-pointer gap-3 rounded-md border p-3',
                        business.chosenVoice === voice.id
                          ? 'border-black bg-black text-white'
                          : 'border-black/10'
                      )}
                    >
                      <input
                        id={`voice-${voice.id}`}
                        type="radio"
                        name="voice"
                        value={voice.id}
                        checked={business.chosenVoice === voice.id}
                        onChange={(e) =>
                          setBusiness((prev) => ({ ...prev, chosenVoice: e.target.value }))
                        }
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-semibold">{voice.name}</span>
                        <span className="mt-0.5 block text-xs opacity-65">{voice.detail}</span>
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={saving === 'business'}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                >
                  {saving === 'business' && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save profile
                </button>
              </form>

              <div className="space-y-5">
                <form
                  onSubmit={saveLine}
                  className="rounded-lg border border-black/10 bg-white p-4"
                >
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Line option</h2>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {[
                      ['forward_existing', 'Forward existing line'],
                      ['request_number', 'Request a number'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          setLine((prev) => ({ ...prev, option: value as typeof line.option }))
                        }
                        className={cn(
                          'rounded-md border px-3 py-3 text-left text-sm font-semibold',
                          line.option === value
                            ? 'border-black bg-black text-white'
                            : 'border-black/10'
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-black/50">
                      Existing number
                      <input
                        value={line.existingNumber}
                        onChange={(e) =>
                          setLine((prev) => ({ ...prev, existingNumber: e.target.value }))
                        }
                        placeholder="+234..."
                        className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-black/50">
                      Preferred country
                      <input
                        value={line.preferredCountry}
                        onChange={(e) =>
                          setLine((prev) => ({ ...prev, preferredCountry: e.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-black/50">
                      City / region
                      <input
                        value={line.preferredCity}
                        onChange={(e) =>
                          setLine((prev) => ({ ...prev, preferredCity: e.target.value }))
                        }
                        className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="text-xs font-semibold text-black/50">
                      Forwarding readiness
                      <input
                        value={line.forwardingReadiness}
                        onChange={(e) =>
                          setLine((prev) => ({ ...prev, forwardingReadiness: e.target.value }))
                        }
                        placeholder="Can forward calls now / needs help"
                        className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                  <label className="mt-3 block text-xs font-semibold text-black/50">
                    Notes
                    <textarea
                      value={line.notes}
                      onChange={(e) => setLine((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={saving === 'line'}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-semibold text-white"
                  >
                    {saving === 'line' && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save line request
                  </button>
                </form>

                <section className="rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">Plan intent</h2>
                    </div>
                    <div className="flex rounded-full bg-black/5 p-1">
                      {(['NGN', 'USD'] as const).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCurrency(item)}
                          className={cn(
                            'rounded-full px-3 py-1 text-xs font-bold',
                            currency === item ? 'bg-black text-white' : 'text-black/55'
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {PLANS.map((plan) => {
                      const amount = currency === 'USD' ? plan.usd : plan.ngn
                      const selected =
                        state?.planIntent?.tier === plan.tier &&
                        state.planIntent.currency === currency
                      return (
                        <button
                          key={plan.tier}
                          type="button"
                          onClick={() => choosePlan(plan.tier, amount)}
                          className={cn(
                            'rounded-md border p-3 text-left',
                            selected ? 'border-black bg-black text-white' : 'border-black/10'
                          )}
                        >
                          <span className="block text-sm font-semibold">{plan.label}</span>
                          <span className="mt-1 block text-xs opacity-60">
                            {amount
                              ? `${currency === 'USD' ? '$' : '₦'}${(amount / 100).toLocaleString()}/mo`
                              : 'Custom'}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-black/50">
                    Plan intent is saved for setup planning only. No customer is charged until a
                    line is deliverable and billing is explicitly activated.
                  </p>
                </section>

                <section className="rounded-lg border border-black/10 bg-white p-4">
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Calls and transcripts</h2>
                  </div>
                  <div className="mt-4 rounded-md border border-dashed border-black/15 p-5 text-sm text-black/55">
                    Calls will appear here after a phone line is live. Transcripts, summaries, and
                    handoff events will stay tied to {selectedOrg?.name ?? 'this workspace'}.
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export function VoiceAppPage() {
  const auth = useAuthStore()
  const token = useAuthStore((s) => s.token)
  const [handoffChecked, setHandoffChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function consumeHandoff() {
      const params = new URLSearchParams(window.location.search)
      const handoff = params.get('handoff')
      if (!handoff) {
        setHandoffChecked(true)
        return
      }
      try {
        const data = await exchangeVoiceSso(handoff)
        if (cancelled) return
        setSession(auth, data)
        params.delete('handoff')
        const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
        window.history.replaceState(null, '', clean)
      } finally {
        if (!cancelled) setHandoffChecked(true)
      }
    }
    consumeHandoff()
    return () => {
      cancelled = true
    }
  }, [auth])

  if (!handoffChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f0e8] text-[#171412]">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <p className="mt-3 text-sm text-black/55">Securing your Voice session...</p>
        </div>
      </main>
    )
  }

  return token || credentials.getToken() ? <VoiceAppShell /> : <AuthPanel />
}
