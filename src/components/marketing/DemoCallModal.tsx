import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Play, Pause, X, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'

const AUDIO_SRC = '/landing/demo-call-ashley.mp3'
const CAPTIONS_SRC = '/landing/demo-call-ashley.vtt'

type Speaker = 'lira' | 'ashley'

interface TranscriptLine {
  start: number
  end: number
  speaker: Speaker
  text: string
}

const TRANSCRIPT: TranscriptLine[] = [
  {
    start: 0,
    end: 4.2,
    speaker: 'lira',
    text: "Hi Ashley, this is Lira from Northwind. How can I help you today?",
  },
  {
    start: 4.5,
    end: 12.8,
    speaker: 'ashley',
    text: "Hi. I'm trying to upgrade to the annual plan, but my card keeps getting declined. I've tried two different cards now and it's really frustrating.",
  },
  {
    start: 13.1,
    end: 22.0,
    speaker: 'lira',
    text: "I'm sorry that's been the experience, Ashley. Let me pull up your account right now and check what's going on. I can see your last attempt was a few minutes ago on the Visa ending in 4412.",
  },
  {
    start: 22.4,
    end: 26.5,
    speaker: 'ashley',
    text: "Yes, that's the one. The bank says nothing's wrong on their end.",
  },
  {
    start: 26.8,
    end: 38.0,
    speaker: 'lira',
    text: "I see the issue. Stripe is flagging the charge as a soft decline — it looks like the billing zip on file doesn't match what your card issuer has. That's an easy fix. Would you like me to update the billing zip now if you tell me the right one, or send you a secure link to update it yourself?",
  },
  {
    start: 38.3,
    end: 42.0,
    speaker: 'ashley',
    text: "Just update it for me. It should be 94110.",
  },
  {
    start: 42.4,
    end: 52.0,
    speaker: 'lira',
    text: "Updated. I'm retrying the charge now. Okay — payment went through. Your annual plan is active. I'll also email you the receipt and the new invoice for your records.",
  },
  {
    start: 52.3,
    end: 56.0,
    speaker: 'ashley',
    text: "Oh wow, that was actually painless. Thank you.",
  },
  {
    start: 56.3,
    end: 64.0,
    speaker: 'lira',
    text: "Anytime, Ashley. One more thing — I noticed your team has three other seats on the trial. If you'd like, I can extend their trial by a week so they can finish onboarding before billing kicks in. Want me to do that?",
  },
  {
    start: 64.3,
    end: 66.5,
    speaker: 'ashley',
    text: "Yes please, that would be great.",
  },
  {
    start: 66.8,
    end: 72.0,
    speaker: 'lira',
    text: "Done. Their trial now ends next Tuesday. Anything else I can help with?",
  },
  {
    start: 72.3,
    end: 74.0,
    speaker: 'ashley',
    text: "No, I'm good. Thanks!",
  },
  {
    start: 74.3,
    end: 77.5,
    speaker: 'lira',
    text: "Have a great day, Ashley.",
  },
]

const TOTAL_DURATION = TRANSCRIPT[TRANSCRIPT.length - 1].end

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export interface DemoCallModalProps {
  open: boolean
  onClose: () => void
}

export function DemoCallModal({ open, onClose }: DemoCallModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptScrollerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLLIElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(TOTAL_DURATION)
  const [audioError, setAudioError] = useState(false)
  const [muted, setMuted] = useState(false)

  const activeLineIndex = useMemo(() => {
    return TRANSCRIPT.findIndex((line) => currentTime >= line.start && currentTime < line.end)
  }, [currentTime])

  useEffect(() => {
    if (!open) return

    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === ' ' && document.activeElement?.tagName !== 'BUTTON') {
        event.preventDefault()
        togglePlay()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }

  }, [open])

  useEffect(() => {
    if (open) return
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTime(0)
  }, [open])

  useEffect(() => {
    if (activeLineRef.current && transcriptScrollerRef.current) {
      const container = transcriptScrollerRef.current
      const line = activeLineRef.current
      const containerRect = container.getBoundingClientRect()
      const lineRect = line.getBoundingClientRect()
      const offset = lineRect.top - containerRect.top - container.clientHeight / 2 + line.clientHeight / 2
      container.scrollBy({ top: offset, behavior: 'smooth' })
    }
  }, [activeLineIndex])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audioError) return
    if (audio.paused) {
      audio.play().catch(() => setAudioError(true))
    } else {
      audio.pause()
    }
  }, [audioError])

  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) setCurrentTime(audio.currentTime)
  }

  const onLoadedMetadata = () => {
    const audio = audioRef.current
    if (audio) {
      setDuration(audio.duration || TOTAL_DURATION)
    }
  }

  const onSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    const value = Number(event.target.value)
    if (audio) {
      audio.currentTime = value
      setCurrentTime(value)
    }
  }

  const seekToLine = (line: TranscriptLine) => {
    const audio = audioRef.current
    if (audio && !audioError) {
      audio.currentTime = line.start
      setCurrentTime(line.start)
      if (audio.paused) audio.play().catch(() => setAudioError(true))
    } else {
      setCurrentTime(line.start)
    }
  }

  const onBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose()
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (audio) {
      audio.muted = !audio.muted
      setMuted(audio.muted)
    }
  }

  if (!open) return null

  return (
    <div
      className="dcm-backdrop"
      role="presentation"
      onClick={onBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dcm-title"
        className="dcm-shell"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Close demo"
          className="dcm-close"
          onClick={onClose}
        >
          <X size={18} weight="bold" />
        </button>

        <header className="dcm-header">
          <span className="dcm-eyebrow">A real Lira conversation</span>
          <h2 id="dcm-title" className="dcm-title">
            Hear Lira handle a payment dispute
          </h2>
          <p className="dcm-meta">
            <span>Ashley · Customer</span>
            <span aria-hidden="true">·</span>
            <span>Voice support</span>
            <span aria-hidden="true">·</span>
            <span>{formatTime(duration)}</span>
          </p>
        </header>

        <div className="dcm-player" role="group" aria-label="Audio player">
          <button
            type="button"
            className="dcm-play"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            onClick={togglePlay}
            disabled={audioError}
          >
            {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
          </button>

          <div className="dcm-progress">
            <input
              type="range"
              min={0}
              max={duration || TOTAL_DURATION}
              step={0.1}
              value={currentTime}
              onChange={onSeek}
              disabled={audioError}
              aria-label="Seek"
            />
            <div className="dcm-times">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            className="dcm-mute"
            aria-label={muted ? 'Unmute' : 'Mute'}
            onClick={toggleMute}
            disabled={audioError}
          >
            {muted ? <SpeakerSlash size={18} weight="bold" /> : <SpeakerHigh size={18} weight="bold" />}
          </button>
        </div>

        {audioError && (
          <p className="dcm-error">
            Audio is being finalized — read the live transcript below to see how Lira handles the call.
          </p>
        )}

        <section aria-label="Transcript" className="dcm-transcript-wrap">
          <div className="dcm-transcript-label">Live transcript</div>
          <div ref={transcriptScrollerRef} className="dcm-transcript">
            <ul>
              {TRANSCRIPT.map((line, index) => {
                const isActive = index === activeLineIndex
                return (
                  <li
                    key={`${line.start}-${index}`}
                    ref={isActive ? activeLineRef : undefined}
                    className={`dcm-line dcm-line-${line.speaker} ${isActive ? 'is-active' : ''}`}
                  >
                    <button
                      type="button"
                      onClick={() => seekToLine(line)}
                      className="dcm-line-button"
                      aria-current={isActive}
                    >
                      <span className="dcm-speaker">
                        {line.speaker === 'lira' ? 'Lira' : 'Ashley'}
                      </span>
                      <span className="dcm-line-text">{line.text}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>

        <footer className="dcm-footer">
          <p className="dcm-disclosure">
            Recorded with Lira's production model. Customer side is a recreated scenario based on
            real call patterns — no real customer data is shared.
          </p>
          <Link to="/book-demo" className="dcm-cta" onClick={onClose}>
            See Lira on your stack
            <ArrowUpRight size={14} weight="bold" />
          </Link>
        </footer>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={AUDIO_SRC}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onError={() => setAudioError(true)}
          aria-hidden="true"
        >
          <track default kind="captions" src={CAPTIONS_SRC} srcLang="en" label="English" />
        </audio>
      </div>

      <style>{`
        .dcm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 9000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(8, 10, 14, 0.72);
          backdrop-filter: blur(8px);
          animation: dcm-fade 0.18s ease-out;
        }
        @keyframes dcm-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .dcm-shell {
          position: relative;
          width: 100%;
          max-width: 720px;
          max-height: calc(100vh - 48px);
          display: flex;
          flex-direction: column;
          background: #fbfaf6;
          border-radius: 24px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.18);
          overflow: hidden;
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
          animation: dcm-rise 0.22s ease-out;
        }
        @keyframes dcm-rise {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .dcm-close {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(2,3,8,0.06);
          color: #1a1d22;
          border: 0;
          cursor: pointer;
          z-index: 2;
          transition: background 0.15s ease;
        }
        .dcm-close:hover { background: rgba(2,3,8,0.12); }
        .dcm-header {
          padding: 32px 32px 18px;
        }
        .dcm-eyebrow {
          display: inline-block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7a7166;
          margin-bottom: 10px;
        }
        .dcm-title {
          margin: 0;
          font-size: 22px;
          font-weight: 600;
          line-height: 1.25;
          color: #1a1d22;
        }
        .dcm-meta {
          margin: 8px 0 0;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          color: #6b6358;
          font-size: 13px;
        }
        .dcm-player {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 32px 18px;
          background: rgba(2,3,8,0.04);
          border-top: 1px solid rgba(2,3,8,0.06);
          border-bottom: 1px solid rgba(2,3,8,0.06);
        }
        .dcm-play {
          width: 48px;
          height: 48px;
          border-radius: 999px;
          background: #202527;
          color: white;
          border: 0;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .dcm-play:hover:not(:disabled) { background: #000; transform: scale(1.04); }
        .dcm-play:disabled { background: #8a8278; cursor: not-allowed; }
        .dcm-progress {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dcm-progress input[type=range] {
          width: 100%;
          accent-color: #202527;
        }
        .dcm-times {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b6358;
          font-variant-numeric: tabular-nums;
        }
        .dcm-mute {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          background: transparent;
          border: 0;
          color: #1a1d22;
          cursor: pointer;
          display: grid;
          place-items: center;
        }
        .dcm-mute:hover:not(:disabled) { background: rgba(2,3,8,0.06); }
        .dcm-mute:disabled { color: #8a8278; cursor: not-allowed; }
        .dcm-error {
          margin: 0;
          padding: 12px 32px;
          background: rgba(255, 200, 80, 0.18);
          color: #6b4a08;
          font-size: 13px;
          border-bottom: 1px solid rgba(2,3,8,0.06);
        }
        .dcm-transcript-wrap {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }
        .dcm-transcript-label {
          padding: 14px 32px 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7a7166;
        }
        .dcm-transcript {
          flex: 1;
          min-height: 0;
          padding: 0 32px 14px;
          overflow-y: auto;
          scroll-behavior: smooth;
        }
        .dcm-transcript ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dcm-line-button {
          width: 100%;
          text-align: left;
          background: transparent;
          border: 0;
          padding: 10px 12px;
          border-radius: 12px;
          cursor: pointer;
          display: grid;
          grid-template-columns: 64px 1fr;
          gap: 10px;
          align-items: start;
          color: #4b4439;
          line-height: 1.5;
          font-size: 14px;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .dcm-line-button:hover {
          background: rgba(2,3,8,0.04);
        }
        .dcm-line.is-active .dcm-line-button {
          background: rgba(32, 37, 39, 0.06);
          color: #1a1d22;
        }
        .dcm-line-lira.is-active .dcm-line-button {
          background: rgba(32, 37, 39, 0.92);
          color: #fbfaf6;
        }
        .dcm-speaker {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: inherit;
          opacity: 0.7;
          padding-top: 3px;
        }
        .dcm-line-text { display: block; }
        .dcm-footer {
          padding: 18px 32px 24px;
          border-top: 1px solid rgba(2,3,8,0.06);
          background: #fbfaf6;
          display: grid;
          gap: 12px;
        }
        .dcm-disclosure {
          margin: 0;
          font-size: 11px;
          color: #8a8278;
          line-height: 1.5;
        }
        .dcm-cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 18px;
          border-radius: 999px;
          background: #202527;
          color: white;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
          justify-self: end;
        }
        .dcm-cta:hover { background: #000; transform: translateY(-1px); }

        @media (max-width: 640px) {
          .dcm-backdrop { padding: 0; align-items: stretch; }
          .dcm-shell {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }
          .dcm-header, .dcm-player, .dcm-transcript-label, .dcm-transcript, .dcm-footer {
            padding-left: 20px;
            padding-right: 20px;
          }
          .dcm-cta { justify-self: stretch; }
          .dcm-line-button { grid-template-columns: 56px 1fr; font-size: 13px; }
        }
      `}</style>
    </div>
  )
}
