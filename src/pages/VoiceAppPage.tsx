import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, Check, Loader2, LogOut, Mic, Plus } from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  createOrganization,
  credentials,
  exchangeVoiceSso,
  getAuthMe,
  getVoiceOnboarding,
  listOrganizations,
  login,
  signup,
  type Organization,
  type VoiceOnboardingState,
} from '@/services/api'
import { VoicePhoneDemo } from '@/components/voice/VoicePhoneDemo'
import { toast } from 'sonner'
import { VoiceOnboardingPage } from '@/pages/VoiceOnboardingPage'
import { cn } from '@/lib'

type AuthMode = 'login' | 'signup'

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
      <div className="hidden min-h-screen flex-col px-6 py-6 sm:px-10 lg:flex">
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

      <div className="flex min-h-screen flex-col justify-center bg-[#f4f0e8] px-5 py-10 text-[#171412] sm:px-6">
        {/* Mobile only: the story column is hidden, so the page still needs to
            say where you are and what happens next. */}
        <div className="mx-auto mb-6 w-full max-w-md lg:hidden">
          <div className="flex items-center gap-2.5">
            <img src="/lira_black.png" alt="Lira" className="h-8 w-8" />
            <span className="text-sm font-semibold">Lira Voice</span>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            Add a Nigerian voice to your customer line.
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Create your account, then set up your line in a few short steps.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mx-auto w-full max-w-md rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-6"
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
  /**
   * Set once the visitor finishes (or already finished) onboarding.
   *
   * The three setup forms used to live on this dashboard, so a brand-new
   * account was met with data entry instead of the product. They now run in
   * front of it — but only once: an account that already has a business
   * profile goes straight through.
   */
  const [onboarded, setOnboarded] = useState(false)
  const [state, setState] = useState<VoiceOnboardingState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newOrgName, setNewOrgName] = useState('')

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
    // Per-org, not per-session: switching to a workspace that has never been
    // set up must show onboarding again, even if the previous one was done.
    setOnboarded(false)
    getVoiceOnboarding(selectedOrgId)
      .then((next) => {
        if (cancelled) return
        setState(next)
        // A saved business name is the marker that setup has been done —
        // it is the one required field of the first step.
        if (next.businessProfile?.businessName) setOnboarded(true)
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

  function signOut() {
    credentials.clear()
    auth.clearCredentials()
    orgStore.clear()
    window.location.reload()
  }

  // Setup runs in front of the dashboard, not on it.
  if (selectedOrgId && !loading && !onboarded) {
    return (
      <VoiceOnboardingPage
        orgId={selectedOrgId}
        onDone={() => {
          setOnboarded(true)
          toast.success('You are all set — try the demo below.')
        }}
      />
    )
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
                      item.done ? 'bg-[#171412] text-white' : 'bg-black/10 text-black/35'
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
            // Setup forms used to sit here — describe your business, line option
            // and plan intent. They are an onboarding job, not a dashboard:
            // someone arriving here should meet the product, not a form.
            // See VoiceOnboardingPage.
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
