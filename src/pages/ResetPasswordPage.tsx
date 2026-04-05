import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EyeIcon, EyeSlashIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

import { resetPassword } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Invalid link — no token or email
  if (!token || !email) {
    return (
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
          <Link to="/" className="inline-block">
            <LiraLogo size="md" />
          </Link>
        </aside>
        <main className="flex flex-1 flex-col items-center justify-center bg-white px-5">
          <div className="mx-auto max-w-[420px] text-center space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">Invalid reset link</h1>
            <p className="text-sm text-gray-500">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-block rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Request new link
            </Link>
          </div>
        </main>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword(email, token, password)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
        <Link to="/" className="inline-block">
          <LiraLogo size="md" />
        </Link>
        <div className="flex flex-1 flex-col justify-center gap-6">
          <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
            {'Choose a\nnew password'}
          </h2>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        <div className="flex items-center px-5 pt-6 pb-2 md:hidden">
          <Link to="/">
            <LiraLogo size="md" />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 md:px-16">
          <div className="mx-auto w-full max-w-[420px] space-y-8">
            {success ? (
              /* ── Success ── */
              <>
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                    <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Password reset!
                  </h1>
                  <p className="text-sm text-gray-500">
                    Your password has been updated. You can now sign in with your new password.
                  </p>
                </div>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-block rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                  >
                    Sign in
                  </Link>
                </div>
              </>
            ) : (
              /* ── Form ── */
              <>
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                    <LockClosedIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Set a new password
                  </h1>
                  <p className="text-sm text-gray-500">
                    Enter a new password for{' '}
                    <span className="font-medium text-gray-700">{email}</span>.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New password */}
                  <div className="space-y-1.5">
                    <label htmlFor="rp-pw" className="text-sm font-medium text-gray-700">
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="rp-pw"
                        type={showPw ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError(null)
                        }}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPw ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="space-y-1.5">
                    <label htmlFor="rp-confirm" className="text-sm font-medium text-gray-700">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="rp-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Re-enter password"
                        value={confirm}
                        onChange={(e) => {
                          setConfirm(e.target.value)
                          setError(null)
                        }}
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? (
                          <EyeSlashIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-center text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !password || !confirm}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Reset password'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export { ResetPasswordPage }
