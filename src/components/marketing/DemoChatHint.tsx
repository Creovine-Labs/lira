import { useEffect, useState } from 'react'

/**
 * DemoChatHint — floating "try asking…" helper that appears near where the
 * widget bubble lives on the demo pages.
 *
 * Why this exists: visitors with no Nimbus context will open the empty chat
 * widget and ask hotel-booking questions, then conclude the AI is dumb. The
 * widget greeting (set on the backend) lists topics inside the chat, but
 * many visitors won't click the bubble until they have a reason to. This
 * helper plants the reason before the click.
 *
 * Behaviors:
 *   - Appears bottom-right after a small delay (so the page can settle)
 *   - Dismissable via × or via clicking anywhere on the widget bubble area
 *   - Auto-hides after 45s if untouched
 *   - Persists "dismissed" state in localStorage for the session
 *   - Hidden in screenshots / scraping (decorative — does not affect SEO)
 */

const STORAGE_KEY = 'lira_demo_chat_hint_dismissed'
const SHOW_AFTER_MS = 1800
const AUTO_HIDE_MS = 45_000

const SUGGESTIONS = [
  'How do refunds work?',
  'Can I import from QuickBooks?',
  'What does the Business plan cost?',
] as const


export interface DemoChatHintProps {
  /** Optional override copy for the panel title. Default: "Not sure what to ask?" */
  title?: string
}

export function DemoChatHint({ title }: DemoChatHintProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') {
        setDismissed(true)
        return
      }
    } catch {
      /* sessionStorage unavailable */
    }

    const showTimer = setTimeout(() => setVisible(true), SHOW_AFTER_MS)
    const autoHideTimer = setTimeout(() => setVisible(false), AUTO_HIDE_MS)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(autoHideTimer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  if (dismissed || !visible) return null

  return (
    <div className="dch-root" role="complementary" aria-label="Suggested questions">
      <button
        type="button"
        aria-label="Dismiss suggestions"
        onClick={dismiss}
        className="dch-close"
      >
        ×
      </button>
      <p className="dch-title">{title ?? 'Try Lira in two ways'}</p>

      {/* ── Voice lead — biggest call-to-action ────────────────────── */}
      <div className="dch-voice-hero">
        <span aria-hidden="true" className="dch-voice-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="2" width="6" height="12" rx="3" />
            <path d="M19 10v2a7 7 0 01-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="8" y1="22" x2="16" y2="22" />
          </svg>
        </span>
        <div className="dch-voice-body">
          <p className="dch-voice-headline">Talk to Lira with voice</p>
          <p className="dch-voice-sub">
            Tap the mic icon in the chat header to start a real-time
            conversation. No typing — just talk.
          </p>
        </div>
      </div>

      {/* ── Text suggestions — secondary ───────────────────────────── */}
      <p className="dch-or">Or type one of these:</p>
      <ul className="dch-list">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <span aria-hidden="true" className="dch-bullet">›</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
      <p className="dch-footer">
        <span className="dch-arrow" aria-hidden="true">↘</span>
        Click the chat bubble in the corner
      </p>

      <style>{`
        .dch-root {
          position: fixed;
          right: 16px;
          bottom: 96px;
          z-index: 8500;
          width: min(320px, calc(100vw - 32px));
          padding: 16px 18px 14px;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18), 0 4px 12px rgba(15, 23, 42, 0.1);
          border: 1px solid rgba(75, 62, 219, 0.18);
          font-family: "Inter", system-ui, sans-serif;
          animation: dch-rise 0.32s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes dch-rise {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .dch-root::after {
          content: "";
          position: absolute;
          right: 28px;
          bottom: -8px;
          width: 16px;
          height: 16px;
          background: #ffffff;
          border-right: 1px solid rgba(75, 62, 219, 0.18);
          border-bottom: 1px solid rgba(75, 62, 219, 0.18);
          transform: rotate(45deg);
        }
        .dch-close {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(2, 3, 8, 0.05);
          color: #475569;
          border: 0;
          font-size: 16px;
          line-height: 1;
          cursor: pointer;
        }
        .dch-close:hover { background: rgba(2, 3, 8, 0.1); }
        .dch-title {
          margin: 0 0 4px;
          padding-right: 22px;
          font-size: 13px;
          font-weight: 700;
          color: #1e1b4b;
        }
        .dch-voice-hero {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          margin-bottom: 12px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border: 1px solid rgba(180, 83, 9, 0.22);
          border-radius: 12px;
          position: relative;
          overflow: hidden;
        }
        .dch-voice-hero::after {
          content: "";
          position: absolute;
          top: -20px;
          right: -20px;
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent);
          pointer-events: none;
        }
        .dch-voice-icon {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #b45309;
          color: white;
          box-shadow: 0 4px 12px rgba(180, 83, 9, 0.35);
          animation: dch-mic-pulse 2.2s ease-in-out infinite;
        }
        .dch-voice-icon svg { width: 18px; height: 18px; }
        @keyframes dch-mic-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(180, 83, 9, 0.35); }
          50%      { transform: scale(1.08); box-shadow: 0 6px 18px rgba(180, 83, 9, 0.55); }
        }
        .dch-voice-body { min-width: 0; }
        .dch-voice-headline {
          margin: 0 0 2px;
          font-size: 13px;
          font-weight: 700;
          color: #78350f;
        }
        .dch-voice-sub {
          margin: 0;
          font-size: 11.5px;
          line-height: 1.45;
          color: #92400e;
        }
        .dch-or {
          margin: 0 0 8px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .dch-list {
          list-style: none;
          padding: 0;
          margin: 0 0 12px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .dch-list li {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 8px;
          background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
          font-size: 12px;
          color: #1e1b4b;
          font-weight: 500;
          line-height: 1.4;
        }
        .dch-bullet {
          color: #4b3edb;
          font-weight: 700;
        }
        .dch-footer {
          margin: 0;
          padding-top: 8px;
          border-top: 1px dashed rgba(2, 3, 8, 0.08);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #64748b;
          font-weight: 500;
        }
        .dch-arrow {
          display: inline-grid;
          place-items: center;
          width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #4b3edb;
          color: white;
          font-size: 11px;
          font-weight: 700;
        }
        @media (max-width: 480px) {
          .dch-root {
            right: 10px;
            left: 10px;
            bottom: 88px;
            width: auto;
          }
          .dch-root::after { display: none; }
        }
      `}</style>
    </div>
  )
}
