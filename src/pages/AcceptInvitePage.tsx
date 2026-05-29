import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useAuthStore, useOrgStore } from '@/app/store'
import {
  acceptEmployeeInvite,
  credentials,
  listOrganizations,
  validateEmployeeInvite,
  type EmployeeInviteSummary,
} from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

type ValidationState =
  | { kind: 'loading' }
  | { kind: 'invalid'; reason: string }
  | { kind: 'ready'; invite: EmployeeInviteSummary }

function AcceptInvitePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const { setCredentials } = useAuthStore()
  const { setOrganizations, setCurrentOrg } = useOrgStore()

  const [state, setState] = useState<ValidationState>({ kind: 'loading' })
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', reason: 'This link is missing an invite token.' })
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const invite = await validateEmployeeInvite(token)
        if (cancelled) return
        if (invite.state !== 'active') {
          const reason =
            invite.state === 'used'
              ? 'This invite has already been accepted.'
              : invite.state === 'revoked'
                ? 'This invite has been revoked. Ask your team admin for a new one.'
                : 'This invite has expired. Ask your team admin to issue a new one.'
          setState({ kind: 'invalid', reason })
          return
        }
        setState({ kind: 'ready', invite })
      } catch (err) {
        if (cancelled) return
        const msg = err instanceof Error ? err.message : 'Could not load this invite.'
        setState({
          kind: 'invalid',
          reason: msg.includes('not found')
            ? "We couldn't find this invite link. It may have been removed."
            : msg,
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (state.kind !== 'ready') return
    const invite = state.invite
    setError(null)

    if (!invite.account_exists_in_tenant) {
      if (!name.trim()) {
        setError('Please enter your name.')
        return
      }
      if (password.trim().length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
    }

    setAccepting(true)
    try {
      const res = await acceptEmployeeInvite(token, {
        name: invite.account_exists_in_tenant ? undefined : name.trim(),
        password: invite.account_exists_in_tenant ? undefined : password,
      })

      setCredentials(
        res.accessToken,
        res.user.email,
        res.user.name,
        undefined,
        res.user.id,
        res.user.emailVerified,
        res.user.role
      )
      credentials.set(res.accessToken)

      // Load the user's full org list so the switcher is populated, then
      // focus the org they were invited to.
      try {
        const orgs = await listOrganizations()
        setOrganizations(orgs)
      } catch {
        // Non-blocking — the org will still show up on the dashboard later.
      }
      setCurrentOrg(res.org.org_id)

      toast.success(`Welcome to ${res.org.name}!`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite.')
    } finally {
      setAccepting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Link to="/">
            <LiraLogo size="md" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/60 bg-white p-7 shadow-xl">
          {state.kind === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <img
                src="/lira_black.png"
                alt="Loading"
                className="h-8 w-8 animate-spin opacity-60"
                style={{ animationDuration: '1.2s' }}
              />
              <p className="text-sm text-gray-500">Checking your invitation…</p>
            </div>
          )}

          {state.kind === 'invalid' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <ExclamationCircleIcon className="h-6 w-6 text-rose-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Invitation unavailable</h1>
              <p className="text-sm text-gray-500">{state.reason}</p>
              <Link
                to="/"
                className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Back to sign in
              </Link>
            </div>
          )}

          {state.kind === 'ready' && (
            <form onSubmit={handleAccept} className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[#3730a3]">
                  You're invited
                </p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
                  Join {state.invite.org_name}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                  {state.invite.invited_by_name
                    ? `${state.invite.invited_by_name} invited `
                    : 'You were invited '}
                  <span className="font-medium text-gray-700">{state.invite.email}</span> to join as
                  a <span className="font-medium text-gray-700">{state.invite.role}</span>.
                </p>
              </div>

              {state.invite.account_exists_in_tenant ? (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="font-semibold">You already have an account.</p>
                    <p className="mt-0.5 text-emerald-700">
                      Click below and we'll add you to {state.invite.org_name} and sign you in.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="accept-name"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Your name
                    </label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="accept-name"
                        type="text"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={accepting}
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                        placeholder="Ada Lovelace"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="accept-password"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Choose a password
                    </label>
                    <div className="relative">
                      <LockClosedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        id="accept-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={accepting}
                        className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
              )}

              <button
                type="submit"
                disabled={accepting}
                className="w-full rounded-lg bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:opacity-50"
              >
                {accepting
                  ? 'Joining…'
                  : state.invite.account_exists_in_tenant
                    ? `Join ${state.invite.org_name}`
                    : 'Create account & join'}
              </button>

              <p className="text-center text-xs text-gray-400">
                By continuing, you agree to our{' '}
                <Link to="/terms" target="_blank" className="text-[#3730a3] hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-[#3730a3] hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export { AcceptInvitePage }
