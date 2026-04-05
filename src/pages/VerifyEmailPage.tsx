import { useEffect, useRef, useState } from 'react'
import { Navigate, Link, useNavigate } from 'react-router-dom'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

import { useAuthStore } from '@/app/store'
import { sendOtp, verifyOtp, listOrganizations } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'

const CODE_LENGTH = 6
const RESEND_COOLDOWN = 60 // seconds

function VerifyEmailPage() {
  const { token, userEmail, emailVerified, setEmailVerified } = useAuthStore()
  const navigate = useNavigate()

  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN)
  const [resending, setResending] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend button — must be called before early returns
  useEffect(() => {
    if (resendTimer <= 0) return
    const id = setInterval(() => setResendTimer((t) => Math.max(t - 1, 0)), 1000)
    return () => clearInterval(id)
  }, [resendTimer])

  // Not logged in → go home
  if (!token) return <Navigate to="/" replace />

  // Already verified or no verification state (legacy session) → dashboard
  if (emailVerified !== false) return <Navigate to="/dashboard" replace />

  // ── Digit input handlers ──────────────────────────────────────────────────

  function handleChange(index: number, value: string) {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = digit
    setDigits(next)
    setError(null)

    // Auto-advance
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!text) return
    const next = [...digits]
    for (let i = 0; i < CODE_LENGTH; i++) next[i] = text[i] ?? ''
    setDigits(next)
    const focusIdx = Math.min(text.length, CODE_LENGTH - 1)
    inputRefs.current[focusIdx]?.focus()
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== CODE_LENGTH) {
      setError('Please enter the full 6-digit code.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await verifyOtp(code)
      if (res.verified) {
        // New users (no orgs) → onboarding; returning users → dashboard
        const orgs = await listOrganizations().catch(() => [])
        const dest = orgs.length === 0 ? '/onboarding' : '/dashboard'
        // Set verified AFTER computing destination so the guard doesn't redirect
        // to /dashboard before we navigate.
        setEmailVerified(true)
        navigate(dest, { replace: true })
      } else {
        setError('Invalid code. Please try again.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendTimer > 0 || resending) return
    setResending(true)
    setError(null)
    try {
      await sendOtp()
      setResendTimer(RESEND_COOLDOWN)
      setDigits(Array(CODE_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const maskedEmail = userEmail
    ? userEmail.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(b.length) + c)
    : 'your email'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <aside className="hidden md:flex w-[360px] shrink-0 flex-col bg-gradient-to-br from-white via-gray-50 to-[#3730a3]/10 px-10 py-10">
        <Link to="/" className="inline-block">
          <LiraLogo size="md" />
        </Link>
        <div className="flex flex-1 flex-col justify-center gap-6">
          <h2 className="whitespace-pre-line text-5xl font-bold leading-tight tracking-tight text-gray-900">
            {'Verify your\nemail'}
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
            {/* Icon */}
            <div className="flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                <EnvelopeIcon className="h-8 w-8 text-indigo-600" />
              </div>
            </div>

            {/* Heading */}
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">Check your email</h1>
              <p className="text-sm text-gray-500">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-700">{maskedEmail}</span>. Enter it below to
                verify your account.
              </p>
            </div>

            {/* Code inputs */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputRefs.current[i] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="h-14 w-12 rounded-xl border border-gray-300 bg-gray-50 text-center text-xl font-semibold text-gray-900 outline-none transition-colors focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              {/* Error */}
              {error && <p className="text-center text-sm text-red-600">{error}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || digits.join('').length !== CODE_LENGTH}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Verify email'
                )}
              </button>
            </form>

            {/* Resend */}
            <div className="text-center">
              <p className="text-sm text-gray-500">
                {"Didn't receive the code? "}
                {resendTimer > 0 ? (
                  <span className="text-gray-400">Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend code'}
                  </button>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export { VerifyEmailPage }
