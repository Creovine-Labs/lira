import { useCallback, useEffect, useRef, useState } from 'react'

import { startVoiceDemoSession, endVoiceDemoSession } from '@/services/api'

/*
 * VoicePhoneDemo — the public "test the AI" call panel, modelled on how the
 * leading voice-AI products (Vapi, Bland, Retell) present a live call: a clean
 * dark panel with a reactive voice orb, a live transcript, and simple call
 * controls — NOT a skeuomorphic phone.
 *
 * Robustness carried over from the earlier fix:
 *   • First click works — every engine event is handled, and the "connecting"
 *     state covers the one-time mic-permission prompt (no dead first click).
 *   • Mic is released on end by UNMOUNTING the engine iframe (engineSrc -> null).
 *
 * Nigeria is only ever referenced here (this is the "test a Nigerian voice"),
 * never in the product/ad copy. The sample business is branded "Lira Restaurant".
 */

const ENGINE_BASE = 'https://widget.liraintelligence.com/amber-engine-v1.html'

const LEAD_KEY = 'lira-voice-demo-lead'

interface Lead {
  name: string
  email: string
}

/**
 * Remembered so a returning visitor is not asked twice. Convenience only — the
 * server requires name and email on every start, so clearing this changes what
 * the visitor is asked, never whether the details are needed.
 */
function readStoredLead(): Lead | null {
  try {
    const raw = localStorage.getItem(LEAD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Lead>
    if (!parsed.name?.trim() || !parsed.email?.trim()) return null
    return { name: parsed.name.trim(), email: parsed.email.trim() }
  } catch {
    return null
  }
}

function storeLead(lead: Lead): void {
  try {
    localStorage.setItem(LEAD_KEY, JSON.stringify(lead))
  } catch {
    /* private mode — the visitor is simply asked again next time */
  }
}

/** Deliberately permissive: this is a lead form, not an auth boundary. */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
const CAP_SECONDS = 90
const BRAND = 'Lira Voice'

type Phase = 'idle' | 'connecting' | 'live' | 'ended' | 'error'
type Line = { role: 'user' | 'bot'; text: string; interim?: boolean }

export function VoicePhoneDemo() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [botSpeaking, setBotSpeaking] = useState(false)
  const [userSpeaking, setUserSpeaking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const [lines, setLines] = useState<Line[]>([])
  const [engineSrc, setEngineSrc] = useState<string | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)
  // Identity gate. Trying the voice is the strongest buying signal on the
  // site, so an anonymous visitor gives a name and email first. Remembered
  // locally so a returning visitor is not asked twice — the server still
  // requires it on every start, we just fill it from here.
  const [lead, setLead] = useState<Lead | null>(() => readStoredLead())
  const [askOpen, setAskOpen] = useState(false)
  const [askName, setAskName] = useState('')
  const [askEmail, setAskEmail] = useState('')
  const [askError, setAskError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  // Move focus into the dialog when it opens. Done with a ref rather than
  // autoFocus so it also fires when the dialog is reopened, and so focus
  // lands only on a deliberate open.
  useEffect(() => {
    if (askOpen) nameInputRef.current?.focus()
  }, [askOpen])

  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const sessionKeyRef = useRef<string | null>(null)
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)
  const phaseRef = useRef<Phase>('idle')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  // Mirrored into a ref so the postMessage listener below reads the CURRENT
  // phase rather than the one captured when the listener was attached. Written
  // in an effect, not during render — a render can be discarded, and a ref
  // written during one is a write React never agreed to.
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const post = (type: string, payload: Record<string, unknown> = {}) =>
    iframeRef.current?.contentWindow?.postMessage({ source: 'lira-call', type, payload }, '*')

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const end = useCallback((outcome = 'ended') => {
    clearTimer()
    const used = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 1000) : 0
    post('disconnect')
    if (sessionKeyRef.current) {
      endVoiceDemoSession({ sessionKey: sessionKeyRef.current, secondsUsed: used, outcome }).catch(
        () => {}
      )
      sessionKeyRef.current = null
    }
    startedAtRef.current = 0
    setBotSpeaking(false)
    setUserSpeaking(false)
    setEngineSrc(null) // unmount the iframe → releases the microphone
    setPhase('ended')
  }, [])

  const pushTranscript = useCallback((role: 'user' | 'bot', text: string, final: boolean) => {
    setLines((prev) => {
      const next = [...prev]
      if (role === 'user') {
        const last = next[next.length - 1]
        if (last && last.role === 'user' && last.interim)
          next[next.length - 1] = { role, text, interim: !final }
        else next.push({ role, text, interim: !final })
      } else {
        next.push({ role, text })
      }
      return next.slice(-20)
    })
  }, [])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as {
        source?: string
        type?: string
        payload?: Record<string, unknown>
      } | null
      if (!d || d.source !== 'amber-engine') return
      switch (d.type) {
        case 'ready':
          post('connect')
          break
        case 'connected':
          if (phaseRef.current === 'live') return
          startedAtRef.current = Date.now()
          setElapsed(0)
          setPhase('live')
          clearTimer()
          timerRef.current = window.setInterval(() => {
            const s = Math.round((Date.now() - startedAtRef.current) / 1000)
            setElapsed(s)
            if (s >= CAP_SECONDS) end('cap_reached')
          }, 500)
          break
        case 'bot-started-speaking':
          setBotSpeaking(true)
          break
        case 'bot-stopped-speaking':
          setBotSpeaking(false)
          break
        case 'user-started-speaking':
          setUserSpeaking(true)
          break
        case 'user-stopped-speaking':
          setUserSpeaking(false)
          break
        case 'transcript': {
          const p = d.payload || {}
          const role = p.role === 'bot' ? 'bot' : 'user'
          const text = typeof p.text === 'string' ? p.text : ''
          if (text) pushTranscript(role, text, Boolean(p.final))
          break
        }
        case 'error':
          if (phaseRef.current === 'connecting') {
            setErrMsg('Please allow microphone access, then tap Call again.')
            setPhase('error')
          } else if (phaseRef.current === 'live') end('error')
          break
        case 'closed':
        case 'idle-timeout':
          if (phaseRef.current === 'live' || phaseRef.current === 'connecting') end('closed')
          break
      }
    }
    window.addEventListener('message', onMsg)
    return () => {
      window.removeEventListener('message', onMsg)
      clearTimer()
    }
  }, [end, pushTranscript])

  // Auto-scroll the transcript.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [lines])

  const call = useCallback(async (who: Lead) => {
    setLines([])
    setMuted(false)
    setErrMsg(null)
    setPhase('connecting')
    setEngineSrc(null)
    try {
      const s = await startVoiceDemoSession({
        voiceId: 'professional_ng_female',
        leadName: who.name,
        leadEmail: who.email,
      })
      sessionKeyRef.current = s.sessionKey
      setEngineSrc(
        `${ENGINE_BASE}?idleMs=90000&orgId=${encodeURIComponent(s.demoOrgId)}` +
          `&demoToken=${encodeURIComponent(s.demoToken)}`
      )
    } catch {
      setErrMsg(
        'The demo line is busy right now, or today’s limit was reached. Please try again shortly.'
      )
      setPhase('error')
    }
  }, [])

  const toggleMute = () => {
    const nextVal = !muted
    setMuted(nextVal)
    post('set-muted', { muted: nextVal })
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const inCall = phase === 'connecting' || phase === 'live'

  const state =
    phase === 'idle'
      ? 'Tap to start a test call'
      : phase === 'connecting'
        ? 'Connecting…'
        : phase === 'live'
          ? botSpeaking
            ? 'Lira is speaking…'
            : userSpeaking
              ? 'Listening…'
              : 'Connected · say hello'
          : phase === 'ended'
            ? 'Call ended'
            : errMsg || 'Couldn’t connect. Please try again.'

  const orbClass = `vc-orb${botSpeaking ? ' is-speaking' : ''}${phase === 'connecting' ? ' is-ringing' : ''}${
    phase === 'live' && !botSpeaking ? ' is-listening' : ''
  }`

  return (
    <div className="vc-wrap">
      <VcStyles />
      <div className={`vc-panel vc-phase-${phase}`}>
        <div className="vc-head">
          <span className="vc-brand">
            <span className="vc-dot" /> {BRAND}
          </span>
          <span className="vc-tag">{phase === 'live' ? mmss(elapsed) : 'Demo'}</span>
        </div>

        <div className="vc-stage">
          <div className={orbClass} aria-hidden="true">
            <span className="vc-bars">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="vc-state">{state}</div>
        </div>

        {(phase === 'live' || (phase === 'ended' && lines.length > 0)) && (
          <div className="vc-transcript" ref={scrollRef}>
            {lines.length === 0 ? (
              <p className="vc-hint">Try: “What is Lira Voice?” or “How do I set it up?”</p>
            ) : (
              lines.map((l, i) => (
                <p key={i} className={`vc-line vc-${l.role}${l.interim ? ' is-interim' : ''}`}>
                  <span className="vc-who">{l.role === 'bot' ? 'Lira' : 'You'}</span>
                  {l.text}
                </p>
              ))
            )}
          </div>
        )}

        <div className="vc-controls">
          {!inCall ? (
            <button
              type="button"
              className="vc-btn vc-btn-call"
              onClick={() => {
                if (lead) {
                  void call(lead)
                  return
                }
                setAskName('')
                setAskEmail('')
                setAskError(null)
                setAskOpen(true)
              }}
            >
              <PhoneIcon />
              {phase === 'ended' || phase === 'error' ? 'Call again' : 'Call & test the voice'}
            </button>
          ) : (
            <>
              {phase === 'live' && (
                <button
                  type="button"
                  className={`vc-btn vc-btn-mute${muted ? ' is-on' : ''}`}
                  onClick={toggleMute}
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? 'Unmute' : 'Mute'}
                </button>
              )}
              <button
                type="button"
                className="vc-btn vc-btn-end"
                onClick={() => end()}
                aria-label="End call"
              >
                <PhoneIcon hang />
                End
              </button>
            </>
          )}
        </div>

        {askOpen && (
          <div className="vc-gate" role="dialog" aria-modal="true" aria-labelledby="vc-gate-title">
            <form
              className="vc-gate-card"
              onSubmit={(e) => {
                e.preventDefault()
                const name = askName.trim()
                const email = askEmail.trim()
                if (!name) return setAskError('Please enter your name.')
                if (!looksLikeEmail(email))
                  return setAskError('Please enter a valid email address.')
                const who = { name, email }
                setLead(who)
                storeLead(who)
                setAskOpen(false)
                void call(who)
              }}
            >
              <h3 id="vc-gate-title" className="vc-gate-title">
                Who are we speaking to?
              </h3>
              <p className="vc-gate-sub">
                Lira will greet you by name. We use your email to follow up — nothing else.
              </p>

              <label className="vc-gate-label" htmlFor="vc-gate-name">
                Name
              </label>
              <input
                id="vc-gate-name"
                className="vc-gate-input"
                value={askName}
                onChange={(e) => {
                  setAskName(e.target.value)
                  setAskError(null)
                }}
                placeholder="Ada Okafor"
                autoComplete="name"
                ref={nameInputRef}
              />

              <label className="vc-gate-label" htmlFor="vc-gate-email">
                Work email
              </label>
              <input
                id="vc-gate-email"
                className="vc-gate-input"
                type="email"
                value={askEmail}
                onChange={(e) => {
                  setAskEmail(e.target.value)
                  setAskError(null)
                }}
                placeholder="ada@company.com"
                autoComplete="email"
              />

              {askError && <p className="vc-gate-error">{askError}</p>}

              <div className="vc-gate-actions">
                <button type="button" className="vc-gate-cancel" onClick={() => setAskOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="vc-btn vc-btn-call vc-gate-submit">
                  <PhoneIcon />
                  Start the call
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="vc-fine">
          Automated demo · capped at {CAP_SECONDS}s · no real actions · answered in a Nigerian voice
        </p>
      </div>

      {engineSrc && (
        <iframe
          ref={iframeRef}
          src={engineSrc}
          title="Lira Voice demo engine"
          allow="microphone; autoplay"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0.01,
            border: 0,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

function PhoneIcon({ hang = false }: { hang?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path
        d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011-.24 11.4 11.4 0 003.6.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.3a1 1 0 011 1 11.4 11.4 0 00.57 3.6 1 1 0 01-.24 1l-2.2 2.2z"
        transform={hang ? 'rotate(135 12 12)' : undefined}
      />
    </svg>
  )
}

function VcStyles() {
  return (
    <style>{`
      .vc-wrap { width: 100%; max-width: 380px; margin: 0 auto; }
      .vc-panel {
        position: relative; border-radius: 22px; padding: 20px 20px 16px;
        background: linear-gradient(180deg, rgba(20,26,28,0.96), rgba(10,14,15,0.98));
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: 0 30px 80px rgba(2,3,8,0.45), inset 0 1px 0 rgba(255,255,255,0.06);
        color: #eef7f4; overflow: hidden;
      }
      .vc-panel::before {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(90% 60% at 50% -10%, rgba(16,178,140,0.28), transparent 60%);
      }
      .vc-head { position: relative; display: flex; align-items: center; justify-content: space-between; }
      .vc-brand { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; letter-spacing: -0.01em; }
      .vc-dot { width: 8px; height: 8px; border-radius: 50%; background: #34d399; box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: vcDot 1.8s infinite; }
      .vc-tag { font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(255,255,255,0.55); font-variant-numeric: tabular-nums; }

      .vc-stage { position: relative; display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 18px 0 12px; }
      .vc-orb {
        position: relative; width: 116px; height: 116px; border-radius: 50%; display: grid; place-items: center;
        background: radial-gradient(circle at 50% 35%, #21d0a8 0%, #10b28c 42%, #0b5f52 100%);
        box-shadow: 0 0 0 8px rgba(16,178,140,0.10), 0 18px 50px rgba(16,178,140,0.28);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .vc-orb.is-listening { box-shadow: 0 0 0 6px rgba(16,178,140,0.10), 0 12px 40px rgba(16,178,140,0.22); }
      .vc-orb.is-speaking { box-shadow: 0 0 0 12px rgba(16,178,140,0.14), 0 22px 60px rgba(16,178,140,0.40); }
      .vc-orb.is-ringing::before, .vc-orb.is-ringing::after {
        content: ''; position: absolute; inset: 0; border-radius: 50%; border: 2px solid rgba(52,211,153,0.5);
        animation: vcRing 1.6s ease-out infinite;
      }
      .vc-orb.is-ringing::after { animation-delay: 0.8s; }

      .vc-bars { display: flex; align-items: center; gap: 4px; height: 34px; }
      .vc-bars i { width: 4px; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.92); }
      .vc-orb.is-speaking .vc-bars i { animation: vcBar 0.7s ease-in-out infinite; }
      .vc-orb.is-speaking .vc-bars i:nth-child(1) { animation-delay: 0s; }
      .vc-orb.is-speaking .vc-bars i:nth-child(2) { animation-delay: 0.12s; }
      .vc-orb.is-speaking .vc-bars i:nth-child(3) { animation-delay: 0.06s; }
      .vc-orb.is-speaking .vc-bars i:nth-child(4) { animation-delay: 0.18s; }
      .vc-orb.is-speaking .vc-bars i:nth-child(5) { animation-delay: 0.09s; }
      .vc-state { position: relative; font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.9); min-height: 18px; text-align: center; }

      .vc-transcript {
        position: relative; margin: 4px 0 12px; max-height: 132px; overflow-y: auto;
        border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
        padding: 10px 12px; display: flex; flex-direction: column; gap: 7px; scroll-behavior: smooth;
      }
      .vc-hint { margin: 0; font-size: 12.5px; color: rgba(255,255,255,0.5); text-align: center; }
      .vc-line { margin: 0; font-size: 13px; line-height: 1.45; color: #eef7f4; }
      .vc-line .vc-who { display: inline-block; margin-right: 6px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
      .vc-bot .vc-who { color: #6ef2d5; }
      .vc-user { color: rgba(255,255,255,0.82); }
      .vc-user .vc-who { color: rgba(255,255,255,0.55); }
      .vc-line.is-interim { opacity: 0.6; }

      .vc-controls { position: relative; display: flex; justify-content: center; gap: 10px; padding-top: 4px; }
      .vc-btn { display: inline-flex; align-items: center; gap: 8px; height: 46px; padding: 0 22px; border: 0; border-radius: 999px; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform 0.15s ease, filter 0.15s ease; color: #fff; }
      .vc-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }
      .vc-btn:active { transform: scale(0.98); }
      .vc-btn-call { background: #16b26a; box-shadow: 0 12px 30px rgba(22,178,106,0.35); }
      .vc-btn-end { background: #ef4444; box-shadow: 0 12px 30px rgba(239,68,68,0.30); }
      .vc-btn-mute { background: rgba(255,255,255,0.12); color: #eef7f4; }
      .vc-btn-mute.is-on { background: rgba(255,255,255,0.24); }

      .vc-fine { position: relative; margin: 12px 0 0; text-align: center; font-size: 11.5px; line-height: 1.5; color: rgba(255,255,255,0.5); }

      /* Identity gate — sits inside the phone frame so it reads as part of the
         call flow rather than a site-wide interruption. */
      .vc-gate { position: absolute; inset: 0; z-index: 20; display: flex; align-items: center; justify-content: center; padding: 18px; background: rgba(4,12,10,0.82); backdrop-filter: blur(6px); border-radius: inherit; }
      .vc-gate-card { width: 100%; max-width: 320px; display: flex; flex-direction: column; text-align: left; }
      .vc-gate-title { margin: 0 0 4px; font-size: 17px; font-weight: 800; color: #f2fbf8; }
      .vc-gate-sub { margin: 0 0 14px; font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.6); }
      .vc-gate-label { margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: rgba(255,255,255,0.5); }
      .vc-gate-input { width: 100%; height: 42px; margin: 0 0 12px; padding: 0 12px; border: 1px solid rgba(255,255,255,0.16); border-radius: 10px; background: rgba(255,255,255,0.06); color: #f2fbf8; font-size: 14px; outline: none; }
      .vc-gate-input:focus { border-color: #16b26a; background: rgba(255,255,255,0.09); }
      .vc-gate-input::placeholder { color: rgba(255,255,255,0.32); }
      .vc-gate-error { margin: -4px 0 10px; font-size: 12px; color: #fca5a5; }
      .vc-gate-actions { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
      .vc-gate-cancel { flex: none; height: 42px; padding: 0 14px; border: 0; border-radius: 999px; background: rgba(255,255,255,0.10); color: #eef7f4; font-size: 13px; font-weight: 700; cursor: pointer; }
      .vc-gate-submit { flex: 1; height: 42px; justify-content: center; }

      @keyframes vcDot { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.6);} 70% { box-shadow: 0 0 0 7px rgba(52,211,153,0);} 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0);} }
      @keyframes vcRing { 0% { transform: scale(1); opacity: 0.7;} 100% { transform: scale(1.45); opacity: 0;} }
      @keyframes vcBar { 0%,100% { height: 8px;} 50% { height: 30px;} }
      @media (prefers-reduced-motion: reduce) {
        .vc-dot, .vc-orb::before, .vc-orb::after, .vc-orb.is-speaking .vc-bars i { animation: none !important; }
      }
    `}</style>
  )
}
