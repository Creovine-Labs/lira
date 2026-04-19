import { useState, useCallback } from 'react'
import type { PortalConfig, CustomerSession } from '../types'
import { requestMagicLink, verifyMagicLink } from '../api'

const STORAGE_KEY = 'lira_portal_session'

function loadSession(): CustomerSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CustomerSession
  } catch {
    return null
  }
}

function saveSession(s: CustomerSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    /* ignore */
  }
}

function clearSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

interface AuthGateProps {
  config: PortalConfig
  session: CustomerSession | null
  onSession: (s: CustomerSession | null) => void
}

export function AuthGate({ config, session, onSession }: AuthGateProps) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      await requestMagicLink(config.orgSlug, email)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [config.orgSlug, email])

  const handleVerify = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const s = await verifyMagicLink(config.orgSlug, email, token)
      saveSession(s)
      onSession(s)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code')
    } finally {
      setLoading(false)
    }
  }, [config.orgSlug, email, token, onSession])

  if (session) return null

  const accent = config.portalColor || '#3730a3'

  return (
    <div className="lp-auth-gate">
      <div className="lp-auth-card">
        <h2>Sign in to view your tickets</h2>
        <p className="lp-auth-sub">Enter your email and we&apos;ll send you a sign-in link.</p>

        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRequest()
            }}
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="lp-input"
            />
            {error && <p className="lp-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="lp-btn-primary"
              style={{ backgroundColor: accent }}
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleVerify()
            }}
          >
            <p className="lp-auth-sent">
              We sent a code to <strong>{email}</strong>. Check your inbox.
            </p>
            <input
              type="text"
              required
              placeholder="Paste your code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="lp-input"
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
            {error && <p className="lp-error">{error}</p>}
            <button
              type="submit"
              disabled={loading || !token}
              className="lp-btn-primary"
              style={{ backgroundColor: accent }}
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button
              type="button"
              className="lp-btn-link"
              onClick={() => {
                setSent(false)
                setToken('')
                setError('')
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export { loadSession, saveSession, clearSession }
