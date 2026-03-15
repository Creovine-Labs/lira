import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import {
  Building2,
  Clock,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  Mic,
  Settings,
  User,
} from 'lucide-react'

import { useAuthStore, useOrgStore } from '@/app/store'
import { env } from '@/env'
import {
  login as apiLogin,
  signup as apiSignup,
  googleLogin as apiGoogleLogin,
  credentials,
  listOrganizations,
} from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { Button } from '@/components/common'
import { BotDeployPanel } from '@/components/bot-deploy'

// ── Login form ────────────────────────────────────────────────────────────────

function LoginForm({ onLogin }: { onLogin: (isNew: boolean) => void }) {
  const { setCredentials } = useAuthStore()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: 'login' | 'signup') {
    setMode(next)
    setError(null)
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return
    setError(null)
    setLoading(true)
    try {
      // Decode Google JWT to extract name + picture
      let gName: string | undefined
      let gPicture: string | undefined
      try {
        const payload = JSON.parse(atob(response.credential.split('.')[1])) as {
          name?: string
          picture?: string
        }
        gName = payload.name
        gPicture = payload.picture
      } catch {
        // ignore decode errors
      }

      const res = await apiGoogleLogin(response.credential)
      setCredentials(res.token, res.user.email, gName, gPicture)
      credentials.set(res.token)
      const orgs = await listOrganizations().catch(() => [])
      onLogin(orgs.length === 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiLogin(email.trim(), password.trim())
      setCredentials(res.token, res.user.email)
      credentials.set(res.token)
      const orgs = await listOrganizations().catch(() => [])
      onLogin(orgs.length === 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in your name, email, and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiSignup(name.trim(), email.trim(), password.trim())
      setCredentials(res.token, res.user.email)
      credentials.set(res.token)
      onLogin(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pillInput =
    'w-full rounded-full bg-[#f0f0f0] dark:bg-[#2a2a2a] py-4 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-violet-400/40 placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50 transition'

  return (
    <div className="space-y-5">
      {/* Mode-aware title */}
      <div className="mb-1 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
          {mode === 'login' ? 'Sign in to your Lira account' : 'Get started with Lira AI'}
        </p>
      </div>

      {/* Google Sign-In */}
      {env.VITE_GOOGLE_CLIENT_ID && (
        <>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
              width="304"
            />
          </div>
          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">or continue with email</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
          </div>
        </>
      )}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-3" noValidate>
          {/* Email */}
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`${pillInput} pl-11 pr-5`}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className={`${pillInput} pl-11 pr-12`}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500 dark:bg-red-950/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="mt-2 w-full cursor-pointer rounded-full bg-[#1c1c1e] py-4 text-sm font-semibold text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#1c1c1e] dark:hover:bg-white/80"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-400"
            >
              Sign up
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleSignup} className="space-y-3" noValidate>
          {/* Full name */}
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              className={`${pillInput} pl-11 pr-5`}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              className={`${pillInput} pl-11 pr-5`}
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`${pillInput} pl-11 pr-12`}
              placeholder="Password (min 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-500 dark:bg-red-950/30">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim() || !password.trim()}
            className="mt-2 w-full cursor-pointer rounded-full bg-[#1c1c1e] py-4 text-sm font-semibold text-white transition hover:bg-black/75 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#1c1c1e] dark:hover:bg-white/80"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating account…
              </span>
            ) : (
              'Create account'
            )}
          </button>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-semibold text-violet-600 transition hover:text-violet-700 dark:text-violet-400"
            >
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  )
}

// ── Dashboard card ────────────────────────────────────────────────────────────

function DashCard({
  icon: Icon,
  title,
  description,
  onClick,
  badge,
  disabled,
}: {
  icon: React.ElementType
  title: string
  description: string
  onClick?: () => void
  badge?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex w-full items-start gap-4 rounded-xl border bg-card p-5 text-left shadow-sm transition ${
        disabled
          ? 'cursor-default opacity-60'
          : 'hover:border-violet-300 hover:shadow-md dark:hover:border-violet-700'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {badge && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
              {badge}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  )
}

// ── Authenticated dashboard ──────────────────────────────────────────────────

function AuthenticatedHome({ onSignOut }: { onSignOut: () => void }) {
  const navigate = useNavigate()
  const { userEmail, userName, userPicture, clearCredentials } = useAuthStore()
  const { organizations, setOrganizations } = useOrgStore()
  const [orgsFetched, setOrgsFetched] = useState(false)

  useEffect(() => {
    listOrganizations()
      .then((orgs) => {
        setOrganizations(orgs)
        setOrgsFetched(true)
      })
      .catch(() => setOrgsFetched(true))
  }, [setOrganizations])

  useEffect(() => {
    if (orgsFetched && organizations.length === 0) {
      navigate('/onboarding')
    }
  }, [orgsFetched, organizations.length, navigate])

  function handleSignOut() {
    clearCredentials()
    credentials.clear()
    onSignOut()
  }

  const displayName = userName || userEmail || 'User'

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* ── Top navigation bar ──────────────────────────────────────────── */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <LiraLogo size="md" />
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              {userPicture ? (
                <img
                  src={userPicture}
                  alt=""
                  className="h-8 w-8 rounded-full border object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
              <span className="max-w-[180px] truncate text-sm font-medium text-foreground">
                {displayName}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-1.5 text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {/* Welcome + Deploy section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back{userName ? `, ${userName.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Deploy Lira to your meetings or review past sessions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left column — Deploy Lira */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Mic className="h-5 w-5 text-violet-500" />
                <h2 className="text-lg font-semibold">Deploy Lira</h2>
              </div>
              <BotDeployPanel />
            </div>

            {/* Demo meeting — secondary */}
            <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Browser Meeting</p>
                  <p className="text-xs text-muted-foreground">
                    Try Lira in a local audio session — no meeting link needed.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/meeting')}
                  className="shrink-0"
                >
                  Open
                </Button>
              </div>
            </div>
          </div>

          {/* Right column — Quick links */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <DashCard
              icon={Building2}
              title="Organizations"
              description="Manage your organizations' context, settings, and knowledge — this is how Lira understands your team."
              onClick={() => navigate('/organizations')}
              badge={organizations.length === 0 ? 'New' : undefined}
            />
            <DashCard
              icon={Clock}
              title="Meeting History"
              description="Review past meetings and transcripts."
              onClick={() => navigate('/meetings')}
            />
            <DashCard
              icon={Settings}
              title="Settings"
              description="Configure your AI assistant, voice, and preferences."
              onClick={() => navigate('/settings')}
            />
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t py-4">
        <p className="text-center text-xs text-muted-foreground">
          Powered by{' '}
          <a
            href="https://creovine.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline-offset-2 hover:underline"
          >
            Creovine
          </a>
        </p>
      </footer>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function HomePage() {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  const [stage, setStage] = useState<'login' | 'home'>(() => (token ? 'home' : 'login'))

  // Keep stage in sync with token (handles sign-out from any location)
  const derivedStage = token ? 'home' : 'login'
  if (stage !== derivedStage) setStage(derivedStage)

  function handleLogin(isNew: boolean) {
    if (isNew) {
      navigate('/onboarding')
    } else {
      setStage('home')
    }
  }

  // Authenticated — full-screen dashboard
  if (stage === 'home') {
    return <AuthenticatedHome onSignOut={() => setStage('login')} />
  }

  // Unauthenticated — full-screen auth page
  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
      style={{ background: 'linear-gradient(135deg, #ede8ff 0%, #f5f2ff 50%, #e4dcff 100%)' }}
    >
      {/* Decorative blurred orbs */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-violet-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-purple-400/20 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-indigo-300/10 blur-2xl" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-violet-900/10 dark:bg-[#1c1c1e]">
          {/* Logo */}
          <div className="mb-7 flex justify-center">
            <LiraLogo size="lg" />
          </div>

          <LoginForm onLogin={handleLogin} />
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Powered by{' '}
          <a
            href="https://creovine.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-violet-600 hover:underline"
          >
            Creovine
          </a>
        </p>
      </div>
    </main>
  )
}

export { HomePage }
