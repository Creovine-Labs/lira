import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  Play,
  ArrowUpRight,
  ClockCounterClockwise,
  Waveform,
  ShieldCheck,
  Storefront,
  Buildings,
  Truck,
  Bank,
  ForkKnife,
  GraduationCap,
} from '@phosphor-icons/react'

import { SEO } from '@/components/SEO'
import { MarketingNavbar, MarketingFooter } from '@/components/marketing'
import { VoicePhoneDemo } from '@/components/voice/VoicePhoneDemo'
import { Styles } from './voiceLandingStyles'

const VOICE_APP_URL = 'https://voice.liraintelligence.com/'

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

/* The live "test the AI" demo is now the shared <VoicePhoneDemo /> component
   (phone-call UI + hardened engine wiring). See components/voice/VoicePhoneDemo. */

/* The waitlist is gone: the Voice setup app on voice.liraintelligence.com is
   the single entry point (it captures the business profile, line and plan
   intent without charging), so the page funnels everyone to "Start setup". */

/* ------------------------------------------------------------------ */
/* Content data                                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    n: '01',
    t: 'Connect your number',
    d: 'Keep your existing line. Calls forward to your Lira number, or we set you up with a new local number.',
  },
  {
    n: '02',
    t: 'Pick a voice & describe your business',
    d: 'Choose a natural local voice and tell Lira your offerings, prices, hours and policies.',
  },
  {
    n: '03',
    t: 'Lira answers every call',
    d: 'Lira picks up 24/7, taking orders, answering questions, handling complaints, and logging every call.',
  },
]

const VALUE = [
  {
    icon: ClockCounterClockwise,
    t: 'Never miss a call again',
    d: 'Every ring answered instantly, after hours, during rush, when the line is busy. No missed orders, no lost customers.',
  },
  {
    icon: Waveform,
    t: 'Sounds genuinely local',
    d: 'Not a robotic foreign accent, but a warm, natural voice in the accent your customers actually connect with.',
  },
  {
    icon: ShieldCheck,
    t: 'Every call captured',
    d: 'Transcripts, orders and outcomes land on a simple dashboard, so nothing said on the phone is ever lost.',
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
        title="Lira Voice: answer every business call in a natural local voice"
        description="Lira Voice answers your business calls 24/7 in a natural, local voice. It takes orders, handles enquiries and complaints, and logs every call. Test it in a Nigerian voice, then start your setup."
        path="/"
        keywords="AI phone agent, AI receptionist, answer business calls, local voice AI, Nigerian voice AI, customized voice agent"
      />
      <Styles />
      <VoiceExtraStyles />
      <MarketingNavbar variant="overlay" />

      {/* ───── Voice hero — bespoke, dark, with the live call panel as the
              interactive centrepiece (the pattern the leading voice-AI products
              use). Keeps the brand type + editorial headline. ───── */}
      <section className="vh-hero">
        <div className="vh-glow" aria-hidden="true" />
        <div className="vh-grid" aria-hidden="true" />
        <div className="vh-inner">
          <motion.div
            className="vh-left"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="vx-hero-tag">
              <span className="vx-hero-dot" /> Lira Voice · early access
            </span>
            <h1 className="eh-headline vh-headline">
              Answer every call
              <br />
              in a natural
              <br />
              <em>local voice</em>
            </h1>
            <p className="vh-body">
              Lira Voice picks up your business line 24/7, taking orders, answering questions, and
              handling complaints in a warm voice your customers recognise. No missed calls, no
              missed money.
            </p>
            <div className="vh-cta-row">
              <button
                type="button"
                onClick={() => {
                  window.location.href = VOICE_APP_URL
                }}
                className="vh-btn vh-btn-primary"
              >
                Start setup
                <ArrowUpRight size={15} weight="bold" />
              </button>
              <button type="button" onClick={() => scrollTo('how')} className="vh-btn vh-btn-ghost">
                <Play size={13} weight="fill" />
                How it works
              </button>
            </div>
            <div className="vh-trust">
              <span>Live 24/7</span>
              <span>Answers in seconds</span>
              <span>Every call logged</span>
            </div>
          </motion.div>

          <motion.div
            className="vh-right"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="vh-panel-label">
              <span className="vx-hero-dot" /> Live demo · call it, no signup
            </span>
            <VoicePhoneDemo />
          </motion.div>
        </div>

        <div className="vh-wave" aria-hidden="true">
          {Array.from({ length: 44 }).map((_, i) => (
            <i key={i} style={{ animationDelay: `${(i % 11) * 0.09}s` }} />
          ))}
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how" className="hx-section">
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
              Lira Voice is for serious, call-heavy operations, the ones that live and die by the
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

      {/* ───── Get started ───── */}
      <section id="get-started" className="hx-section hx-section-pad-bottom">
        <div className="hx-container">
          <motion.div
            className="vh-cta"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="vh-cta-glow" aria-hidden="true" />
            <h2 className="vh-cta-title">Ready to give your line a voice?</h2>
            <p className="vh-cta-sub">
              Set up your business profile, pick a voice, and choose how calls route, all in one
              place. Nothing is charged until your line is live.
            </p>
            <div className="vh-cta-actions">
              <button
                type="button"
                className="vh-btn vh-btn-primary"
                onClick={() => {
                  window.location.href = VOICE_APP_URL
                }}
              >
                Start setup
                <ArrowUpRight size={15} weight="bold" />
              </button>
              <button type="button" className="vh-btn vh-btn-ghost" onClick={() => scrollTo('how')}>
                See how it works
              </button>
            </div>
            <p className="vh-cta-note">
              Part of <a href="https://liraintelligence.com">Lira Intelligence</a>, the intelligent
              customer-support platform.
            </p>
          </motion.div>
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
      /* ── Bespoke voice hero: dark, premium, voice-native. Keeps the brand
         editorial headline (eh-headline) but on a dark stage with a teal glow,
         a faint grid, an animated waveform floor, and the live call panel. ── */
      .vh-hero {
        position: relative; overflow: hidden; color: #eef7f4;
        padding: 148px 0 96px;
        background: radial-gradient(125% 95% at 12% -5%, #163029 0%, #0c1618 42%, #080c0d 100%);
      }
      .vh-glow { position: absolute; top: -18%; right: -8%; width: 62%; height: 85%; pointer-events: none;
        background: radial-gradient(circle, rgba(16,178,140,0.24), transparent 62%); filter: blur(14px); }
      .vh-grid { position: absolute; inset: 0; pointer-events: none; opacity: 0.5;
        background-image: linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 46px 46px;
        -webkit-mask-image: radial-gradient(circle at 28% 18%, #000, transparent 72%);
        mask-image: radial-gradient(circle at 28% 18%, #000, transparent 72%); }
      .vh-inner { position: relative; z-index: 2; max-width: 1160px; margin: 0 auto; padding: 0 28px;
        display: grid; grid-template-columns: 1.02fr 0.98fr; gap: 52px; align-items: center; }
      .vh-headline { color: #ffffff; margin: 18px 0 0; }
      .vh-headline em { color: #6ef2d5; }
      .vh-body { margin: 22px 0 0; max-width: 460px; font-size: 16px; line-height: 1.62; color: rgba(255,255,255,0.72); }
      .vh-cta-row { margin-top: 28px; display: flex; gap: 12px; flex-wrap: wrap; }
      .vh-btn { display: inline-flex; align-items: center; gap: 8px; height: 50px; padding: 0 24px; border: 0; border-radius: 999px; font-size: 15px; font-weight: 800; cursor: pointer; transition: transform 0.15s ease, filter 0.15s ease; }
      .vh-btn:hover { transform: translateY(-2px); }
      .vh-btn-primary { background: #ffffff; color: #0c1517; }
      .vh-btn-primary:hover { filter: brightness(0.94); }
      .vh-btn-ghost { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid rgba(255,255,255,0.20); }
      .vh-btn-ghost:hover { background: rgba(255,255,255,0.14); }
      .vh-trust { margin-top: 28px; display: flex; gap: 20px; flex-wrap: wrap; font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,0.55); }
      .vh-trust span { display: inline-flex; align-items: center; gap: 7px; }
      .vh-trust span::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #34d399; }
      .vh-right { position: relative; display: flex; flex-direction: column; align-items: center; gap: 14px; }
      .vh-panel-label { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #8ff6de; }
      .vh-wave { position: absolute; left: 0; right: 0; bottom: 0; height: 84px; z-index: 1; pointer-events: none;
        display: flex; align-items: flex-end; gap: 3px; padding: 0 10px; opacity: 0.15; }
      .vh-wave i { flex: 1; height: 10px; border-radius: 3px 3px 0 0; background: linear-gradient(180deg, #6ef2d5, transparent); animation: vhWave 1.5s ease-in-out infinite; }
      @keyframes vhWave { 0%, 100% { height: 9px; } 50% { height: 54px; } }
      @media (prefers-reduced-motion: reduce) { .vh-wave i { animation: none; } }
      @media (max-width: 920px) {
        .vh-hero { padding: 116px 0 72px; }
        .vh-inner { grid-template-columns: 1fr; gap: 34px; }
        .vh-body { max-width: none; }
      }

      /* Get-started CTA band — dark, matches the hero, single "Start setup" path. */
      .vh-cta { position: relative; overflow: hidden; max-width: 900px; margin: 0 auto; text-align: center;
        padding: 56px 32px; border-radius: 28px; color: #eef7f4;
        background: radial-gradient(120% 130% at 50% -12%, #163029 0%, #0c1618 46%, #080c0d 100%);
        border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 40px 100px rgba(2,3,8,0.26); }
      .vh-cta-glow { position: absolute; top: -42%; left: 50%; transform: translateX(-50%); width: 70%; height: 100%;
        background: radial-gradient(circle, rgba(16,178,140,0.28), transparent 60%); filter: blur(10px); pointer-events: none; }
      .vh-cta-title { position: relative; margin: 0; font-size: clamp(26px, 4vw, 40px); font-weight: 800; letter-spacing: -0.02em; color: #fff; }
      .vh-cta-sub { position: relative; margin: 14px auto 0; max-width: 520px; font-size: 15.5px; line-height: 1.6; color: rgba(255,255,255,0.72); }
      .vh-cta-actions { position: relative; margin-top: 26px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      .vh-cta-note { position: relative; margin: 22px 0 0; font-size: 12.5px; color: rgba(255,255,255,0.5); }
      .vh-cta-note a { color: #6ef2d5; text-decoration: none; }
      .vh-cta-note a:hover { text-decoration: underline; }

      /* Step cards — force a light card with a bold, high-contrast teal number
         badge so the "1 · 2 · 3" always read clearly (never dark-on-dark). */
      .vx-grid-3 .hx-why-card { background: #ffffff; border-color: rgba(2,3,8,0.10); }
      .vx-grid-3 .hx-why-icon { background: #10b28c; color: #ffffff; font-size: 18px; font-weight: 800; }
      .vx-grid-3 .hx-why-icon svg { color: #ffffff; }
      .vx-grid-3 .hx-why-step { color: rgba(2,3,8,0.32); }
      .vx-grid-3 .hx-why-card h3 { color: #10161a; }
      .vx-grid-3 .hx-why-card p { color: rgba(2,3,8,0.66); }

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
