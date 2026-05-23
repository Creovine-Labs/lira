import { useCallback, useEffect, useRef, useState } from 'react'
import { env } from '@/env'

/**
 * TestProfileModal — opens from the Nimbus demo's "Start free trial" CTA.
 *
 * Lets a demo visitor create a synthetic Nimbus customer profile (name, plan
 * tier, optional open-issues note). Backend stores it against the visitor's
 * anonymous session token (24h TTL) so the chat AI can answer account-aware
 * questions: "what plan am I on?", "when's my next invoice?", etc.
 *
 * Spec: docs/platform/customer-support/INTERACTIVE_DEMO_PLATFORM.md §9.6
 *
 * Visitor ID alignment: uses `lira_visitor_id` localStorage key — the same key
 * the Lira widget uses (see src/components/support-widget/widget.ts) — so the
 * profile we create here is the one the widget sees when the visitor chats.
 */

const VISITOR_KEY = 'lira_visitor_id'
const PROFILE_STORAGE_KEY = 'lira_demo_profile'

type PlanTier = 'starter' | 'growth' | 'business'

interface SyntheticProfile {
  visitor_id: string
  name: string
  plan: PlanTier
  plan_label: string
  signed_up_at: string
  last_invoice_amount_usd: number
  last_invoice_date: string
  next_invoice_date: string
  team_seats: number
  open_issues: string | null
}

export interface TestProfileModalProps {
  open: boolean
  onClose: () => void
  /** Called after a profile is successfully minted. Use to open the chat widget. */
  onProfileCreated?: (profile: SyntheticProfile) => void
}

function getOrCreateVisitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY)
    if (existing) return existing
  } catch {
    /* localStorage unavailable */
  }
  const id = 'v_' + crypto.randomUUID()
  try {
    localStorage.setItem(VISITOR_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

export function TestProfileModal({ open, onClose, onProfileCreated }: TestProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [plan, setPlan] = useState<PlanTier>('growth')
  const [openIssues, setOpenIssues] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<SyntheticProfile | null>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)

    // Focus first field after the modal mounts
    requestAnimationFrame(() => firstFieldRef.current?.focus())

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, submitting, onClose])

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setName('')
      setPlan('growth')
      setOpenIssues('')
      setError(null)
      setSuccess(null)
      setSubmitting(false)
    }
  }, [open])

  const handleSubmit = useCallback(async () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a first name.')
      return
    }
    setSubmitting(true)
    try {
      const visitorId = getOrCreateVisitorId()
      const res = await fetch(`${env.VITE_API_URL}/lira/v1/demo-ops/test-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          name: trimmed,
          plan,
          open_issues: openIssues.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(errBody.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as { profile: SyntheticProfile }
      setSuccess(data.profile)
      // Persist locally so the demo dashboard can render personalized state
      // without re-fetching. Same TTL story as the chat widget — uses
      // sessionStorage so closing the tab returns the next visitor to a
      // fresh "create profile" prompt.
      try {
        sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data.profile))
        window.dispatchEvent(new CustomEvent('lira-demo-profile-changed', { detail: data.profile }))
      } catch {
        /* sessionStorage unavailable */
      }
      onProfileCreated?.(data.profile)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create profile'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }, [name, plan, openIssues, onProfileCreated])

  const onBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !submitting) onClose()
  }

  if (!open) return null

  return (
    <div className="tpm-backdrop" role="presentation" onClick={onBackdropClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tpm-title"
        className="tpm-shell"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close"
          className="tpm-close"
          onClick={onClose}
          disabled={submitting}
        >
          ×
        </button>

        {!success ? (
          <>
            <header className="tpm-header">
              <span className="tpm-eyebrow">Welcome to Nimbus</span>
              <h2 id="tpm-title" className="tpm-title">
                Create a test profile to try Lira
              </h2>
              <p className="tpm-meta">
                This is a demo of Lira — the AI behind Nimbus support. Spin up a quick test
                profile so Lira knows who you are when you chat with her.
              </p>
            </header>

            <form
              className="tpm-form"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSubmit()
              }}
            >
              <label className="tpm-field">
                <span className="tpm-label">First name</span>
                <input
                  ref={firstFieldRef}
                  type="text"
                  required
                  maxLength={40}
                  autoComplete="given-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="tpm-input"
                  placeholder="Sarah"
                />
              </label>

              <fieldset className="tpm-field">
                <span className="tpm-label">Plan</span>
                <div className="tpm-radio-group">
                  {([
                    { value: 'starter', label: 'Starter', price: '$19/mo' },
                    { value: 'growth', label: 'Growth', price: '$49/mo' },
                    { value: 'business', label: 'Business', price: '$129/mo' },
                  ] as const).map((opt) => (
                    <label
                      key={opt.value}
                      className={`tpm-radio ${plan === opt.value ? 'is-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={opt.value}
                        checked={plan === opt.value}
                        onChange={() => setPlan(opt.value)}
                      />
                      <span className="tpm-radio-label">{opt.label}</span>
                      <span className="tpm-radio-price">{opt.price}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="tpm-field">
                <span className="tpm-label">
                  Any open issues you want Lira to know about? <span className="tpm-optional">(optional)</span>
                </span>
                <textarea
                  rows={2}
                  maxLength={280}
                  value={openIssues}
                  onChange={(e) => setOpenIssues(e.target.value)}
                  className="tpm-textarea"
                  placeholder="e.g. Stripe sync has been failing — would love help looking at that."
                />
              </label>

              {error && <p className="tpm-error">{error}</p>}

              <div className="tpm-actions">
                <button
                  type="submit"
                  className="tpm-submit"
                  disabled={submitting || !name.trim()}
                >
                  {submitting ? 'Creating…' : 'Create test profile'}
                </button>
                <button
                  type="button"
                  className="tpm-skip"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Skip — just open chat
                </button>
              </div>

              <p className="tpm-disclosure">
                This profile is fictional, stored only for this session, and deleted in 24 hours.
                No real signup. No password. No real account data.
              </p>
            </form>
          </>
        ) : (
          <div className="tpm-success">
            <div className="tpm-success-icon" aria-hidden="true">
              ✓
            </div>
            <h2 className="tpm-title">Welcome, {success.name}!</h2>
            <p className="tpm-success-meta">
              Your test Nimbus profile is set up on the <strong>{success.plan_label}</strong>{' '}
              plan. Lira knows your account — your last invoice was $
              {success.last_invoice_amount_usd} on {success.last_invoice_date}, and your next
              one is due {success.next_invoice_date}.
            </p>
            <p className="tpm-success-cta">
              Open the chat bubble in the bottom-right corner and ask anything — try{' '}
              <em>"what plan am I on?"</em> or <em>"when's my next invoice?"</em>.
            </p>
            <button type="button" className="tpm-submit" onClick={onClose}>
              Got it
            </button>
          </div>
        )}
      </div>

      <style>{`
        .tpm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(8, 10, 14, 0.7);
          backdrop-filter: blur(6px);
          animation: tpm-fade 0.18s ease-out;
        }
        @keyframes tpm-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .tpm-shell {
          position: relative;
          width: 100%;
          max-width: 480px;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #fbfaf6;
          border-radius: 20px;
          box-shadow: 0 40px 120px rgba(0, 0, 0, 0.35), 0 4px 12px rgba(0, 0, 0, 0.18);
          font-family: var(--font-sans, "Inter", system-ui, sans-serif);
          animation: tpm-rise 0.22s ease-out;
        }
        @keyframes tpm-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .tpm-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(2, 3, 8, 0.06);
          color: #1a1d22;
          border: 0;
          font-size: 22px;
          line-height: 1;
          cursor: pointer;
          z-index: 2;
        }
        .tpm-close:hover { background: rgba(2, 3, 8, 0.12); }
        .tpm-close:disabled { cursor: not-allowed; opacity: 0.4; }
        .tpm-header {
          padding: 28px 28px 12px;
        }
        .tpm-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7a7166;
          margin-bottom: 8px;
        }
        .tpm-title {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          color: #1a1d22;
        }
        .tpm-meta {
          margin: 8px 0 0;
          font-size: 13px;
          color: #6b6358;
          line-height: 1.55;
        }
        .tpm-form {
          padding: 14px 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tpm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border: 0;
          padding: 0;
        }
        .tpm-label {
          font-size: 12px;
          font-weight: 600;
          color: #4b4439;
          letter-spacing: 0.02em;
        }
        .tpm-optional {
          font-weight: 400;
          color: #8a8278;
        }
        .tpm-input, .tpm-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid rgba(2, 3, 8, 0.14);
          border-radius: 10px;
          background: #ffffff;
          font-size: 14px;
          color: #1a1d22;
          font-family: inherit;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .tpm-input:focus, .tpm-textarea:focus {
          outline: none;
          border-color: #4b3edb;
          box-shadow: 0 0 0 3px rgba(75, 62, 219, 0.15);
        }
        .tpm-textarea { resize: vertical; min-height: 60px; }
        .tpm-radio-group {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
        }
        .tpm-radio {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          padding: 10px 12px;
          border: 1px solid rgba(2, 3, 8, 0.14);
          border-radius: 10px;
          background: #ffffff;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .tpm-radio:hover { border-color: rgba(2, 3, 8, 0.28); }
        .tpm-radio.is-active {
          border-color: #4b3edb;
          background: rgba(75, 62, 219, 0.05);
        }
        .tpm-radio input[type="radio"] {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        .tpm-radio-label {
          font-size: 14px;
          font-weight: 600;
          color: #1a1d22;
        }
        .tpm-radio-price {
          font-size: 11px;
          color: #6b6358;
        }
        .tpm-error {
          margin: 0;
          padding: 10px 12px;
          background: rgba(220, 38, 38, 0.08);
          border-left: 3px solid rgba(220, 38, 38, 0.7);
          border-radius: 6px;
          font-size: 13px;
          color: #991b1b;
        }
        .tpm-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .tpm-submit {
          flex: 2;
          padding: 12px 16px;
          border-radius: 999px;
          background: #4b3edb;
          color: white;
          border: 0;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.15s ease;
        }
        .tpm-submit:hover:not(:disabled) { background: #3a2fc6; transform: translateY(-1px); }
        .tpm-submit:disabled { background: #8a8278; cursor: not-allowed; }
        .tpm-skip {
          flex: 1;
          padding: 12px 16px;
          border-radius: 999px;
          background: transparent;
          color: #6b6358;
          border: 1px solid rgba(2, 3, 8, 0.14);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .tpm-skip:hover:not(:disabled) { background: rgba(2, 3, 8, 0.04); }
        .tpm-skip:disabled { opacity: 0.5; cursor: not-allowed; }
        .tpm-disclosure {
          margin: 0;
          font-size: 11px;
          color: #8a8278;
          line-height: 1.5;
          text-align: center;
        }
        .tpm-success {
          padding: 36px 28px 28px;
          text-align: center;
        }
        .tpm-success-icon {
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: rgba(16, 185, 129, 0.12);
          color: #047857;
          font-size: 28px;
          font-weight: 700;
          display: grid;
          place-items: center;
          margin: 0 auto 14px;
        }
        .tpm-success-meta {
          margin: 10px auto 0;
          max-width: 380px;
          font-size: 14px;
          color: #4b4439;
          line-height: 1.6;
        }
        .tpm-success-cta {
          margin: 14px auto 18px;
          max-width: 380px;
          font-size: 13px;
          color: #6b6358;
          line-height: 1.6;
        }
        .tpm-success .tpm-submit {
          display: inline-block;
          flex: none;
          padding-left: 28px;
          padding-right: 28px;
        }

        @media (max-width: 480px) {
          .tpm-backdrop { padding: 0; align-items: stretch; }
          .tpm-shell {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }
          .tpm-radio-group { grid-template-columns: 1fr; }
          .tpm-actions { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
