import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

import { forgotPassword } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email address.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await forgotPassword(trimmed)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
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
            {'Reset your\npassword'}
          </h2>
        </div>
      </aside>

      {/* Right panel */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-white">
        {/* Mobile logo */}
        <div className="flex items-center px-5 pt-6 pb-2 md:hidden">
          <Link to="/">
            <LiraLogo size="md" />
          </Link>
        </div>

        <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-12 md:px-16">
          <div className="mx-auto w-full max-w-[420px] space-y-8">
            {sent ? (
              /* ── Success state ── */
              <>
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
                    <EnvelopeIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Check your email
                  </h1>
                  <p className="text-sm text-gray-500">
                    If an account exists for{' '}
                    <span className="font-medium text-gray-700">{email}</span>, we sent a link to
                    reset your password. The link expires in 30 minutes.
                  </p>
                </div>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </>
            ) : (
              /* ── Form state ── */
              <>
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                    <EnvelopeIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Forgot your password?
                  </h1>
                  <p className="text-sm text-gray-500">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label htmlFor="fp-email" className="text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <input
                      id="fp-email"
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setError(null)
                      }}
                    />
                  </div>

                  {error && <p className="text-center text-sm text-red-600">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Send reset link'
                    )}
                  </button>
                </form>
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export { ForgotPasswordPage }
