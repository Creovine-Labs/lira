import { useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google'
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/app/store'
import { env } from '@/env'
import {
  login as apiLogin,
  signup as apiSignup,
  googleLogin as apiGoogleLogin,
  credentials,
  listOrganizations,
} from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

// ── Brand graphic ─────────────────────────────────────────────────────────────

function AuthSparkle() {
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

// ── Auth view types ───────────────────────────────────────────────────────────

type AuthView = 'landing' | 'login' | 'signup'

const AUTH_BACK: Partial<Record<AuthView, AuthView>> = {
  login: 'landing',
  signup: 'landing',
}

const AUTH_LEFT_HEADINGS: Partial<Record<AuthView, string>> = {
  login: 'Welcome\nback!',
  signup: "Let's get\nstarted",
}
// ── Google icon ─────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  )
}

// ── Auth panel ────────────────────────────────────────────────────────────────

function LoginForm({
  onLogin,
  initialView,
}: {
  onLogin: (isNew: boolean) => void
  initialView?: AuthView
}) {
  const { setCredentials } = useAuthStore()
  const [authView, setAuthView] = useState<AuthView>(initialView ?? 'landing')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  function goTo(view: AuthView) {
    setError(null)
    setAuthView(view)
  }

  function goBack() {
    const prev = AUTH_BACK[authView]
    if (prev) goTo(prev)
  }

  async function handleGoogleSuccess(response: CredentialResponse) {
    if (!response.credential) return
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy before continuing.')
      return
    }
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
      setCredentials(res.token, res.user.email, gName, gPicture, res.user.id)
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
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy before signing in.')
      return
    }
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiLogin(email.trim(), password.trim())
      setCredentials(res.token, res.user.email, undefined, undefined, res.user.id)
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
    if (!agreedToTerms) {
      setError(
        'Please agree to the Terms of Service and Privacy Policy before creating your account.'
      )
      return
    }
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in your name, email, and password.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await apiSignup(name.trim(), email.trim(), password.trim())
      setCredentials(res.token, res.user.email, undefined, undefined, res.user.id)
      credentials.set(res.token)
      onLogin(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Left panel ── */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
        <Link to="/" className="inline-block">
          <LiraLogo size="md" />
        </Link>
        <div className="flex flex-1 flex-col justify-center gap-6">
          {authView === 'landing' ? (
            <>
              <AuthSparkle />
              <p className="max-w-[220px] text-sm leading-relaxed text-gray-500">
                One platform for every meeting, every decision, every team.
              </p>
            </>
          ) : (
            <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
              {AUTH_LEFT_HEADINGS[authView] ?? ''}
            </h2>
          )}
        </div>
      </aside>

      {/* ── Right panel ── */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        {/* Mobile logo — only visible when aside is hidden */}
        <div className="flex items-center px-5 pt-6 pb-2 md:hidden">
          <Link to="/">
            <LiraLogo size="md" />
          </Link>
        </div>
        {/* Scrollable content */}
        <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 md:px-16">
          <div className="mx-auto w-full max-w-[420px]">
            {/* ── Landing ── */}
            {authView === 'landing' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Create your account
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">Get started with Lira — for free.</p>
                </div>
                <div className="space-y-3">
                  {env.VITE_GOOGLE_CLIENT_ID && (
                    <div className="relative">
                      <button
                        type="button"
                        disabled={loading || !agreedToTerms}
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
                      >
                        <GoogleIcon />
                        Continue with Google
                      </button>
                      <div
                        className="absolute inset-0 z-10 overflow-hidden opacity-0"
                        style={loading || !agreedToTerms ? { pointerEvents: 'none' } : undefined}
                        aria-hidden="true"
                      >
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setError('Google sign-in failed. Please try again.')}
                          width="1000"
                          size="large"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                  <button
                    onClick={() => goTo('signup')}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100"
                  >
                    Continue with email
                  </button>
                </div>
                {/* Terms consent checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#3730a3] focus:ring-[#3730a3]/30"
                  />
                  <span className="text-xs leading-relaxed text-gray-500">
                    I agree to the{' '}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                    >
                      Terms of Service
                    </Link>
                    ,{' '}
                    <Link
                      to="/privacy"
                      target="_blank"
                      className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                    >
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link
                      to="/acceptable-use"
                      target="_blank"
                      className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                    >
                      Acceptable Use Policy
                    </Link>
                    .
                  </span>
                </label>
                {error && (
                  <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
                )}
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => goTo('login')}
                    className="font-semibold text-[#3730a3] hover:text-[#312e81]"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            )}

            {/* ── Login ── */}
            {authView === 'login' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Sign in to Lira
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">
                    Welcome back. Pick up where you left off.
                  </p>
                </div>
                <div className="space-y-4">
                  {env.VITE_GOOGLE_CLIENT_ID && (
                    <>
                      <div className="relative">
                        <button
                          type="button"
                          disabled={loading || !agreedToTerms}
                          className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
                        >
                          <GoogleIcon />
                          Continue with Google
                        </button>
                        <div
                          className="absolute inset-0 z-10 overflow-hidden opacity-0"
                          style={loading || !agreedToTerms ? { pointerEvents: 'none' } : undefined}
                          aria-hidden="true"
                        >
                          <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google sign-in failed. Please try again.')}
                            width="1000"
                            size="large"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-xs text-gray-400">or continue with email</span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    </>
                  )}
                  <form
                    id="auth-login-form"
                    onSubmit={handleLogin}
                    className="space-y-3"
                    noValidate
                  >
                    <div className="space-y-1.5">
                      <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition disabled:opacity-50"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition disabled:opacity-50"
                          placeholder="Your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          tabIndex={-1}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-4 w-4" />
                          ) : (
                            <EyeIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
                    )}
                  </form>
                  {/* Terms consent checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#3730a3] focus:ring-[#3730a3]/30"
                    />
                    <span className="text-xs leading-relaxed text-gray-500">
                      I agree to the{' '}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>
                  <p className="text-sm text-gray-500">
                    Don&apos;t have an account?{' '}
                    <button
                      onClick={() => goTo('landing')}
                      className="font-semibold text-[#3730a3] hover:text-[#312e81]"
                    >
                      Sign up
                    </button>
                  </p>
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
                    type="submit"
                    form="auth-login-form"
                    disabled={loading || !email.trim() || !password.trim() || !agreedToTerms}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
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
                </div>
              </div>
            )}

            {/* ── Signup ── */}
            {authView === 'signup' && (
              <div className="space-y-8">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Create your account
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">Get started with Lira — for free.</p>
                </div>
                <form
                  id="auth-signup-form"
                  onSubmit={handleSignup}
                  className="space-y-4"
                  noValidate
                >
                  <div className="space-y-1.5">
                    <label htmlFor="signup-fullname" className="text-sm font-medium text-gray-700">
                      Full name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="signup-fullname"
                        type="text"
                        autoComplete="name"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition disabled:opacity-50"
                        placeholder="Ada Lovelace"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-email-field"
                      className="text-sm font-medium text-gray-700"
                    >
                      Email address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="signup-email-field"
                        type="email"
                        autoComplete="email"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition disabled:opacity-50"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="signup-password-field"
                      className="text-sm font-medium text-gray-700"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="signup-password-field"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 transition disabled:opacity-50"
                        placeholder="Min 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-500">{error}</p>
                  )}
                  {/* Terms consent checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#3730a3] focus:ring-[#3730a3]/30"
                    />
                    <span className="text-xs leading-relaxed text-gray-500">
                      I agree to the{' '}
                      <Link
                        to="/terms"
                        target="_blank"
                        className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                      >
                        Terms of Service
                      </Link>
                      ,{' '}
                      <Link
                        to="/privacy"
                        target="_blank"
                        className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                      >
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link
                        to="/acceptable-use"
                        target="_blank"
                        className="font-medium text-[#3730a3] hover:text-[#312e81] underline"
                      >
                        Acceptable Use Policy
                      </Link>
                      .
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !name.trim() ||
                      !email.trim() ||
                      !password.trim() ||
                      password.trim().length < 8 ||
                      !agreedToTerms
                    }
                    className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-40"
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
                </form>
                <p className="text-sm text-gray-500">
                  Already have an account?{' '}
                  <button
                    onClick={() => goTo('login')}
                    className="font-semibold text-[#3730a3] hover:text-[#312e81]"
                  >
                    Sign in
                  </button>
                </p>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-900"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
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

// ── Page ──────────────────────────────────────────────────────────────────────

interface HomePageProps {
  /** Force the initial auth view. Defaults to 'landing' (shows signup options). */
  defaultView?: AuthView
}

function HomePage({ defaultView }: HomePageProps) {
  const { token } = useAuthStore()
  const navigate = useNavigate()

  // Authenticated — redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  function handleLogin(isNew: boolean) {
    if (isNew) {
      navigate('/onboarding')
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  return <LoginForm onLogin={handleLogin} initialView={defaultView} />
}

export { HomePage }
