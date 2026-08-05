import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  Play,
  ArrowUpRight,
  PhoneCall,
  ClockCounterClockwise,
  Waveform,
  ShieldCheck,
  Storefront,
  Buildings,
  Truck,
  Bank,
  ForkKnife,
  GraduationCap,
  CheckCircle,
} from '@phosphor-icons/react'

import { SEO } from '@/components/SEO'
import { MarketingNavbar, MarketingFooter } from '@/components/marketing'
import { submitDemoRequest } from '@/services/api'
import { Styles } from './voiceLandingStyles'

const ENGINE_URL = 'https://widget.liraintelligence.com/amber-engine-v1.html?idleMs=90000'
const DEMO_CAP_SECONDS = 90

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
}
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
}

// Mount-based reveal (not whileInView) — guarantees content is always visible
// even if the intersection observer doesn't fire; entrance still animates.
const reveal = {
  initial: 'hidden' as const,
  animate: 'show' as const,
}

/* ------------------------------------------------------------------ */
/* Live "talk to Amber" demo — light card, matches the cream page      */
/* ------------------------------------------------------------------ */

type DemoPhase = 'idle' | 'connecting' | 'live' | 'ended'

function AmberLiveDemo() {
  const [phase, setPhase] = useState<DemoPhase>('idle')
  const [speaking, setSpeaking] = useState(false)
  const [left, setLeft] = useState(DEMO_CAP_SECONDS)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const timerRef = useRef<number | null>(null)
  const startRef = useRef(0)

  const post = (type: string) =>
    iframeRef.current?.contentWindow?.postMessage({ source: 'lira-call', type, payload: {} }, '*')

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const stop = useCallback(() => {
    clearTimer()
    post('disconnect')
    startRef.current = 0
    setSpeaking(false)
    setPhase('ended')
  }, [])

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const d = e.data as { source?: string; type?: string } | null
      if (!d || d.source !== 'amber-engine') return
      if (d.type === 'ready') {
        post('connect')
      } else if (d.type === 'connected') {
        if (startRef.current) return
        startRef.current = Date.now()
        setPhase('live')
        setLeft(DEMO_CAP_SECONDS)
        timerRef.current = window.setInterval(() => {
          const elapsed = Math.round((Date.now() - startRef.current) / 1000)
          const rem = Math.max(0, DEMO_CAP_SECONDS - elapsed)
          setLeft(rem)
          if (rem <= 0) stop()
        }, 1000)
      } else if (d.type === 'bot-started-speaking') {
        setSpeaking(true)
      } else if (d.type === 'bot-stopped-speaking') {
        setSpeaking(false)
      } else if (d.type === 'closed') {
        stop()
      }
    }
    window.addEventListener('message', onMsg)
    return () => {
      window.removeEventListener('message', onMsg)
      clearTimer()
    }
  }, [stop])

  const inCall = phase === 'connecting' || phase === 'live'

  return (
    <div className="vx-demo-card">
      <div className="vx-demo-badges">
        <span className="vx-badge vx-badge-live">Live demo</span>
        <span className="vx-badge-note">no signup</span>
      </div>
      <h3 className="vx-demo-title">Hear Amber answer — in a real Nigerian voice</h3>
      <p className="vx-demo-sub">
        Amber runs a Lagos restaurant. Call her, ask about the menu, place an order — she talks back
        naturally. The same engine that answers your customers.
      </p>

      <div className="vx-demo-row">
        <div className={`vx-avatar${speaking ? ' is-speaking' : ''}`}>A</div>
        <div className="vx-demo-meta">
          <strong>Amber · Nigerian voice</strong>
          <span>
            {phase === 'idle' && 'Tap to start a live call'}
            {phase === 'connecting' && 'Connecting…'}
            {phase === 'live' && `Live · ${left}s left`}
            {phase === 'ended' && 'Call ended — start again anytime'}
          </span>
        </div>
        {!inCall ? (
          <button className="vx-demo-btn" onClick={() => setPhase('connecting')}>
            <PhoneCall size={18} weight="fill" />
            {phase === 'ended' ? 'Call again' : 'Talk to Amber'}
          </button>
        ) : (
          <button className="vx-demo-btn vx-demo-btn-end" onClick={stop}>
            End call
          </button>
        )}
      </div>
      <p className="vx-demo-fine">
        Uses your microphone · demo calls capped at {DEMO_CAP_SECONDS}s
      </p>

      {inCall && (
        <iframe
          ref={iframeRef}
          src={ENGINE_URL}
          title="Amber Nigerian voice engine"
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

/* ------------------------------------------------------------------ */
/* Waitlist                                                            */
/* ------------------------------------------------------------------ */

function Waitlist() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [business, setBusiness] = useState('')
  const [vertical, setVertical] = useState('')
  const [website, setWebsite] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setState('sending')
    try {
      await submitDemoRequest({
        name: name.trim(),
        email: email.trim(),
        company: business.trim() || undefined,
        focus: `Lira Voice waitlist${vertical ? ` — ${vertical}` : ''}`,
        website,
      })
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="vx-form vx-form-done">
        <CheckCircle size={44} weight="fill" />
        <h3>You&apos;re on the list</h3>
        <p>
          Thanks — we&apos;ll reach out at <b>{email}</b> as we open early access.
        </p>
      </div>
    )
  }

  return (
    <form className="vx-form" onSubmit={submit}>
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
      <div className="vx-form-grid">
        <label>
          Your name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Ada Obi"
          />
        </label>
        <label>
          Work email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@business.com"
          />
        </label>
        <label>
          Business name
          <input
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            placeholder="Amber Kitchen"
          />
        </label>
        <label>
          Business type
          <select value={vertical} onChange={(e) => setVertical(e.target.value)}>
            <option value="">Select…</option>
            <option>Restaurant / food</option>
            <option>Clinic / health</option>
            <option>Hotel / hospitality</option>
            <option>Logistics / delivery</option>
            <option>Ecommerce / retail</option>
            <option>Fintech / lender</option>
            <option>School / education</option>
            <option>Other</option>
          </select>
        </label>
      </div>
      <button
        type="submit"
        className="hx-button"
        disabled={state === 'sending'}
        style={{ marginTop: 20 }}
      >
        <span className="hx-button-label">
          {state === 'sending' ? 'Sending…' : 'Join the waitlist'}
        </span>
        <span className="hx-button-icon">
          <ArrowUpRight size={16} weight="bold" />
        </span>
      </button>
      {state === 'error' && (
        <p className="vx-form-error">Something went wrong — please try again.</p>
      )}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Content data                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    n: '01',
    t: 'Connect your number',
    d: 'Keep your existing line — calls forward to your Lira number, or we give you a new Nigerian number.',
  },
  {
    n: '02',
    t: 'Pick a voice & describe your business',
    d: 'Choose a natural Nigerian voice and tell Lira your menu, prices, hours and policies.',
  },
  {
    n: '03',
    t: 'Lira answers every call',
    d: 'Your AI picks up 24/7 — takes orders, answers questions, handles complaints, logs every call.',
  },
]

const VALUE = [
  {
    icon: ClockCounterClockwise,
    t: 'Never miss a call again',
    d: 'Every ring answered instantly — after hours, during rush, when the line is busy. No missed orders, no lost customers.',
  },
  {
    icon: Waveform,
    t: 'Genuinely Nigerian',
    d: 'Not a robotic foreign accent. A warm, natural Nigerian voice your customers actually connect with.',
  },
  {
    icon: ShieldCheck,
    t: 'Every call captured',
    d: 'Transcripts, orders and outcomes land on a simple dashboard — nothing said on the phone is ever lost.',
  },
]

const ICP = [
  { icon: ForkKnife, label: 'Busy restaurants' },
  { icon: Bank, label: 'Fintechs & lenders' },
  { icon: Buildings, label: 'Clinics & hospitals' },
  { icon: Truck, label: 'Logistics & delivery' },
  { icon: Storefront, label: 'Ecommerce & retail' },
  { icon: GraduationCap, label: 'Schools' },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function VoiceLandingPage() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <div className="hx-page">
      <SEO
        title="Lira Voice — an AI that answers your business phone in a Nigerian voice"
        description="Lira Voice answers your business calls 24/7 in a natural Nigerian voice — takes orders, handles enquiries and complaints, and logs every call. Join the early-access waitlist."
        path="/"
        keywords="AI phone agent Nigeria, Nigerian voice AI, AI receptionist Lagos, answer business calls, voice AI Nigeria"
      />
      <Styles />
      <VoiceExtraStyles />
      <MarketingNavbar variant="overlay" />

      {/* ───── Editorial hero ───── */}
      <section className="eh-hero">
        <img
          src="/landing/hero-4.jpg"
          alt=""
          className="eh-hero-bg-img"
          fetchPriority="high"
          decoding="async"
        />
        <div className="eh-overlay eh-overlay-right" />
        <div className="eh-overlay eh-overlay-top" />
        <div className="eh-overlay eh-overlay-bottom" />

        <div className="eh-content">
          <motion.div
            className="eh-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="vx-hero-tag">
              <span className="vx-hero-dot" /> Lira Voice · coming soon
            </span>
            <h1 className="eh-headline">
              Answer every call
              <br />
              in a real
              <br />
              <em>Nigerian voice</em>
            </h1>
          </motion.div>

          <motion.div
            className="eh-right"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eh-body">
              Lira Voice picks up your business line 24/7 — takes orders, answers questions, and
              handles complaints in a warm Nigerian voice. No missed calls, no missed money.
            </p>
            <div className="eh-cta-row">
              <button
                type="button"
                onClick={() => scrollTo('demo')}
                className="eh-btn eh-btn-secondary"
              >
                <Play size={14} weight="fill" />
                Hear it live
              </button>
              <button
                type="button"
                onClick={() => scrollTo('waitlist')}
                className="eh-btn eh-btn-primary"
              >
                Join the waitlist
                <ArrowUpRight size={14} weight="bold" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ───── Demo ───── */}
      <section id="demo" className="hx-section">
        <div className="hx-container">
          <motion.div className="hx-section-details" variants={stagger} {...reveal}>
            <motion.h2 className="hx-section-title" variants={fadeUp}>
              <span className="hx-gradient-text">Don&apos;t take our word for it.</span>
              <br />
              Talk to the AI yourself.
            </motion.h2>
            <motion.p className="hx-section-para" variants={fadeUp}>
              A live call to Amber, a sample Lagos restaurant — right here, no signup.
            </motion.p>
          </motion.div>
          <motion.div variants={fadeUp} {...reveal} style={{ maxWidth: 720, margin: '0 auto' }}>
            <AmberLiveDemo />
          </motion.div>
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section className="hx-section">
        <div className="hx-container">
          <motion.div className="hx-section-details" variants={stagger} {...reveal}>
            <motion.h2 className="hx-section-title" variants={fadeUp}>
              Live in three steps
            </motion.h2>
            <motion.p className="hx-section-para" variants={fadeUp}>
              No website, no widget, no code. Your phone line just gets smarter.
            </motion.p>
          </motion.div>
          <motion.div className="hx-why-grid vx-grid-3" variants={stagger} {...reveal}>
            {STEPS.map((s) => (
              <motion.div className="hx-why-card" variants={fadeUp} key={s.n}>
                <div className="hx-why-top">
                  <div className="hx-why-icon">{s.n === '01' ? '1' : s.n === '02' ? '2' : '3'}</div>
                  <span className="hx-why-step">{s.n}</span>
                </div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───── Value ───── */}
      <section className="hx-section">
        <div className="hx-container">
          <motion.div className="hx-why-grid vx-grid-3" variants={stagger} {...reveal}>
            {VALUE.map((v) => (
              <motion.div className="hx-why-card" variants={fadeUp} key={v.t}>
                <div className="hx-why-top">
                  <div className="hx-why-icon">
                    <v.icon size={22} weight="bold" />
                  </div>
                </div>
                <h3>{v.t}</h3>
                <p>{v.d}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───── ICP ───── */}
      <section className="hx-section hx-section-pad-bottom">
        <div className="hx-container">
          <motion.div className="hx-section-details" variants={stagger} {...reveal}>
            <motion.h2 className="hx-section-title" variants={fadeUp}>
              Built for businesses where a missed call is lost money
            </motion.h2>
            <motion.p className="hx-section-para" variants={fadeUp}>
              Lira Voice is for serious, call-heavy operations — the ones that live and die by the
              phone.
            </motion.p>
          </motion.div>
          <motion.div className="vx-icp-grid" variants={stagger} {...reveal}>
            {ICP.map((c) => (
              <motion.div className="vx-icp-card" variants={fadeUp} key={c.label}>
                <c.icon size={26} weight="bold" />
                <span>{c.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ───── Waitlist ───── */}
      <section id="waitlist" className="hx-section hx-section-pad-bottom">
        <div className="hx-container">
          <div className="vx-waitlist">
            <motion.div
              className="vx-waitlist-copy"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="hx-section-title" style={{ textAlign: 'left' }}>
                Early access is opening soon
              </h2>
              <p>
                We&apos;re onboarding a small group of call-heavy Nigerian businesses first,
                hands-on. Join the waitlist and we&apos;ll reach out when it&apos;s your turn.
              </p>
              <p className="vx-waitlist-note">
                Part of <a href="https://liraintelligence.com">Lira Intelligence</a> — the AI
                customer-support platform.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <Waitlist />
            </motion.div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page-specific styling (uses the same tokens as the design system)   */
/* ------------------------------------------------------------------ */

function VoiceExtraStyles() {
  return (
    <style>{`
      .vx-hero-tag { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22); color: #ffffff; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; backdrop-filter: blur(8px); }
      .vx-hero-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 12px #34d399; }
      .eh-left .vx-hero-tag { margin-bottom: 18px; }

      .vx-grid-3 { grid-template-columns: repeat(3, minmax(0,1fr)); }
      @media (max-width: 991px) { .vx-grid-3 { grid-template-columns: 1fr; } }

      .vx-icp-grid { display: grid; grid-template-columns: repeat(6, minmax(0,1fr)); gap: 14px; }
      .vx-icp-card { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 12px; text-align: center; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,0.76); color: #020308; font-weight: 700; font-size: 13px; transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
      .vx-icp-card:hover { transform: translateY(-5px); border-color: rgba(2,3,8,0.3); box-shadow: 0 20px 50px rgba(2,3,8,0.1); }
      .vx-icp-card svg { color: #020308; }
      @media (max-width: 991px) { .vx-icp-grid { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 540px) { .vx-icp-grid { grid-template-columns: repeat(2, 1fr); } }

      /* Amber demo — light card on the cream page */
      .vx-demo-card { position: relative; padding: 28px; border: 1px solid var(--line); border-radius: 20px; background: var(--panel); box-shadow: 0 24px 70px rgba(2,3,8,0.10); }
      .vx-demo-badges { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
      .vx-badge { padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
      .vx-badge-live { background: rgba(16,185,129,0.12); color: #059669; }
      .vx-badge-note { color: rgba(2,3,8,0.5); font-size: 13px; }
      .vx-demo-title { margin: 0; color: var(--text); font-size: 20px; font-weight: 700; line-height: 1.3; }
      .vx-demo-sub { margin: 8px 0 0; color: rgba(2,3,8,0.66); font-size: 14px; line-height: 1.6; max-width: 460px; }
      .vx-demo-row { display: flex; align-items: center; gap: 16px; margin-top: 22px; flex-wrap: wrap; }
      .vx-avatar { display: grid; place-items: center; width: 58px; height: 58px; border-radius: 50%; background: linear-gradient(135deg, #fbbf24, #059669); color: #04140d; font-size: 22px; font-weight: 900; flex: none; transition: box-shadow 0.2s ease; }
      .vx-avatar.is-speaking { box-shadow: 0 0 0 4px rgba(16,185,129,0.35); }
      .vx-demo-meta { flex: 1; min-width: 140px; display: flex; flex-direction: column; gap: 2px; }
      .vx-demo-meta strong { color: var(--text); font-size: 15px; font-weight: 700; }
      .vx-demo-meta span { color: rgba(2,3,8,0.6); font-size: 13px; }
      .vx-demo-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border: 0; border-radius: 999px; background: #059669; color: #ffffff; font-size: 14px; font-weight: 800; cursor: pointer; transition: transform 0.2s ease, filter 0.2s ease; }
      .vx-demo-btn:hover { transform: translateY(-2px); filter: brightness(1.05); }
      .vx-demo-btn-end { background: #dc2626; }
      .vx-demo-fine { margin: 16px 0 0; color: rgba(2,3,8,0.42); font-size: 12px; }

      /* Waitlist */
      .vx-waitlist { display: grid; grid-template-columns: 1fr 1.1fr; gap: 48px; align-items: center; }
      @media (max-width: 991px) { .vx-waitlist { grid-template-columns: 1fr; gap: 28px; } }
      .vx-waitlist-copy p { margin: 16px 0 0; color: rgba(2,3,8,0.7); font-size: 17px; line-height: 1.6; max-width: 440px; }
      .vx-waitlist-note { font-size: 14px !important; color: rgba(2,3,8,0.55) !important; }
      .vx-waitlist-note a { text-decoration: underline; }
      .vx-form { padding: 28px; border: 1px solid var(--line); border-radius: 20px; background: var(--panel); box-shadow: 0 24px 70px rgba(2,3,8,0.08); }
      .vx-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 540px) { .vx-form-grid { grid-template-columns: 1fr; } }
      .vx-form label { display: flex; flex-direction: column; gap: 6px; color: rgba(2,3,8,0.7); font-size: 13px; font-weight: 700; }
      .vx-form input, .vx-form select { width: 100%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: #ffffff; color: var(--text); font: inherit; font-weight: 500; outline: none; transition: border-color 0.2s ease; }
      .vx-form input:focus, .vx-form select:focus { border-color: rgba(2,3,8,0.5); }
      .vx-form-error { margin: 12px 0 0; color: #dc2626; font-size: 14px; }
      .vx-form-done { text-align: center; }
      .vx-form-done svg { color: #059669; margin: 0 auto; }
      .vx-form-done h3 { margin: 14px 0 6px; color: var(--text); font-size: 20px; font-weight: 700; }
      .vx-form-done p { margin: 0; color: rgba(2,3,8,0.66); font-size: 14px; }
    `}</style>
  )
}

export default VoiceLandingPage
