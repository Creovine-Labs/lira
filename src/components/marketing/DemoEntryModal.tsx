import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDemoProfile } from '@/lib/demo-profile'

/**
 * DemoEntryModal — single entry point for the interactive demo.
 *
 * Opened from the landing-page "Try the live demo" button. Combines two things:
 *   1. Mode pick — corner-widget mode or full-page support center
 *   2. Demo profile — just a first name (plan defaults to Growth)
 *
 * Profile creation is purely client-side. The synthetic Nimbus customer is
 * generated in the browser (deterministic hash → plausible facts) and
 * persisted to sessionStorage. Zero backend round-trip. See
 * src/lib/demo-profile.ts for the rationale.
 *
 * There is no "skip into Nimbus marketing" path anymore — the only way to
 * leave the modal without committing is the "Go back to Lira" link, which
 * just closes the modal (the user is already on the Lira landing page).
 */

type Mode = 'widget' | 'help'

export interface DemoEntryModalProps {
  open: boolean
  onClose: () => void
}

export function DemoEntryModal({ open, onClose }: DemoEntryModalProps) {
  const navigate = useNavigate()
  const dialogRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('widget')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose()
    }
    document.addEventListener('keydown', onKey)
    requestAnimationFrame(() => nameInputRef.current?.focus())
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, submitting])

  useEffect(() => {
    if (!open) {
      // Reset state when modal closes
      setMode('widget')
      setName('')
      setError(null)
      setSubmitting(false)
    }
  }, [open])

  const submit = () => {
    setError(null)
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter a name to use in the demo.')
      return
    }
    setSubmitting(true)
    try {
      // Client-side mint — generates a synthetic Nimbus customer profile,
      // persists to sessionStorage, and dispatches the change event. No
      // network call. The demo works regardless of backend availability.
      createDemoProfile(trimmed, 'growth')
      onClose()
      navigate(mode === 'help' ? '/demo/help' : '/demo')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not start demo'
      setError(message)
      setSubmitting(false)
    }
  }

  const onBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !submitting) onClose()
  }

  if (!open) return null

  return (
    <div className="dem-backdrop" role="presentation" onClick={onBackdropClick}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dem-title"
        className="dem-shell"
      >
        <header className="dem-header">
          <h2 id="dem-title" className="dem-title">
            Pick the experience you want to see
          </h2>
          <p className="dem-meta">
            We've built a fictional company called <strong>Nimbus</strong> so you can
            experience Lira in a realistic context.
          </p>
        </header>

        <form
          className="dem-form"
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
        >
          <fieldset className="dem-field" disabled={submitting}>
            <legend className="dem-label">Choose a mode</legend>
            <div className="dem-pill-row">
              <button
                type="button"
                className={`dem-pill ${mode === 'widget' ? 'is-active' : ''}`}
                onClick={() => setMode('widget')}
                aria-pressed={mode === 'widget'}
              >
                Chat widget
              </button>
              <button
                type="button"
                className={`dem-pill ${mode === 'help' ? 'is-active' : ''}`}
                onClick={() => setMode('help')}
                aria-pressed={mode === 'help'}
              >
                Full support page
              </button>
            </div>
          </fieldset>

          <label className="dem-field">
            <span className="dem-label">Choose a demo profile name</span>
            <input
              ref={nameInputRef}
              type="text"
              maxLength={40}
              autoComplete="given-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              disabled={submitting}
              className="dem-input"
            />
          </label>

          {error && <p className="dem-error">{error}</p>}

          <button type="submit" className="dem-submit" disabled={submitting || !name.trim()}>
            {submitting ? 'Opening demo…' : 'Open the demo →'}
          </button>

          <button
            type="button"
            className="dem-back"
            onClick={onClose}
            disabled={submitting}
          >
            ← Go back to Lira
          </button>
        </form>
      </div>

      <style>{`
        .dem-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(2, 3, 8, 0.55);
          backdrop-filter: blur(6px);
          animation: dem-fade 0.18s ease-out;
        }
        @keyframes dem-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dem-shell {
          position: relative;
          width: 100%;
          max-width: 480px;
          max-height: calc(100vh - 48px);
          overflow-y: auto;
          background: #fbfaf6;
          border: 1px solid rgba(2, 3, 8, 0.18);
          border-radius: 16px;
          box-shadow: 0 24px 72px rgba(2, 3, 8, 0.22);
          font-family: "Inter", system-ui, sans-serif;
          color: #020308;
          animation: dem-rise 0.22s ease-out;
        }
        @keyframes dem-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dem-header {
          padding: 36px 32px 12px;
          text-align: center;
        }
        .dem-title {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.3;
          letter-spacing: 0;
          color: #020308;
        }
        .dem-meta {
          margin: 10px auto 0;
          max-width: 380px;
          font-size: 14px;
          color: rgba(2, 3, 8, 0.62);
          line-height: 1.55;
        }
        .dem-meta strong {
          color: #020308;
          font-weight: 600;
        }
        .dem-form {
          padding: 18px 32px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .dem-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 0;
          padding: 0;
        }
        .dem-label {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0;
          color: rgba(2, 3, 8, 0.78);
        }
        .dem-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .dem-pill {
          padding: 9px 18px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          color: #020308;
          background: #f3f0e8;
          border: 1px solid rgba(2, 3, 8, 0.18);
          border-radius: 999px;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
          white-space: nowrap;
        }
        .dem-pill:hover {
          background: #ffffff;
          border-color: rgba(2, 3, 8, 0.32);
        }
        .dem-pill.is-active {
          background: #020308;
          color: #fbfaf6;
          border-color: #020308;
        }
        .dem-pill.is-active:hover {
          background: #020308;
        }
        .dem-pill:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(2, 3, 8, 0.18);
        }
        .dem-input {
          width: 100%;
          padding: 11px 14px;
          background: #ffffff;
          border: 1px solid rgba(2, 3, 8, 0.18);
          border-radius: 10px;
          font: inherit;
          font-size: 14px;
          color: #020308;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .dem-input:focus {
          outline: none;
          border-color: #020308;
          box-shadow: 0 0 0 3px rgba(2, 3, 8, 0.1);
        }
        .dem-error {
          margin: 0;
          padding: 9px 12px;
          background: rgba(220, 38, 38, 0.08);
          border-left: 3px solid rgba(220, 38, 38, 0.6);
          border-radius: 6px;
          font-size: 12.5px;
          color: #991b1b;
        }
        .dem-submit {
          margin-top: 2px;
          padding: 12px 18px;
          background: #020308;
          color: #fbfaf6;
          border: 0;
          border-radius: 999px;
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s ease, transform 0.18s ease;
        }
        .dem-submit:hover:not(:disabled) {
          background: #1a1d22;
          transform: translateY(-1px);
        }
        .dem-submit:disabled {
          background: rgba(2, 3, 8, 0.4);
          cursor: not-allowed;
        }
        .dem-back {
          padding: 4px;
          background: transparent;
          border: 0;
          color: rgba(2, 3, 8, 0.55);
          font: inherit;
          font-size: 13px;
          cursor: pointer;
          align-self: center;
        }
        .dem-back:hover:not(:disabled) {
          color: #020308;
          text-decoration: underline;
        }
        .dem-back:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .dem-backdrop { padding: 0; align-items: stretch; }
          .dem-shell {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
            border: 0;
          }
          .dem-pill { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  )
}
