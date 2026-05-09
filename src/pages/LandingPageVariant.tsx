import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import Lenis from 'lenis'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Typewriter } from 'react-simple-typewriter'
import { ArrowUpRight, Circle, Headphones, MessageCircle, Moon, Sparkles } from 'lucide-react'
import { SEO } from '@/components/SEO'

const heroTypeWords = ['morning back', 'focus back', 'customers back']

const reveal: Variants = {
  hidden: { opacity: 0, y: 38 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
}

const useLenis = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.88,
    })

    let rafId = 0
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])
}

function VariantNav() {
  return (
    <motion.header
      className="v2-nav"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="v2-brand" aria-label="Lira home">
        <span>L</span>
        Lira
      </Link>
      <nav aria-label="Variant navigation">
        <a href="#story">Story</a>
        <a href="#outcomes">Outcomes</a>
        <a href="#systems">Systems</a>
      </nav>
      <Link to="/signup" className="v2-pill">
        Start free
      </Link>
    </motion.header>
  )
}

function HeroImage() {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 900], [0, 90])
  const scale = useTransform(scrollY, [0, 900], [1.04, 1.12])

  return (
    <motion.div className="v2-hero-image" style={{ y, scale }}>
      <img src="/landing-v2/hero-calm-operators.png" alt="" />
    </motion.div>
  )
}

function VariantStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500;1,600&family=Inter:wght@400;500;600;700;800;900&display=swap');

      html.lenis,
      html.lenis body {
        height: auto;
      }

      .lenis.lenis-smooth {
        scroll-behavior: auto !important;
      }

      .v2-page {
        min-height: 100vh;
        background: #0f100d;
        color: #f5f0e5;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        overflow: hidden;
      }

      .v2-page a {
        color: inherit;
        text-decoration: none;
      }

      .v2-nav {
        position: fixed;
        inset: 24px 32px auto;
        z-index: 40;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 24px;
        color: #fffaf0;
        mix-blend-mode: difference;
      }

      .v2-brand,
      .v2-nav nav,
      .v2-pill {
        display: inline-flex;
        align-items: center;
      }

      .v2-brand {
        gap: 10px;
        font-size: 13px;
        font-weight: 800;
      }

      .v2-brand span {
        display: inline-flex;
        width: 24px;
        height: 24px;
        align-items: center;
        justify-content: center;
        border-radius: 7px;
        background: #f5f0e5;
        color: #11120f;
        font-size: 12px;
      }

      .v2-nav nav {
        gap: 32px;
        font-size: 12px;
        font-weight: 800;
      }

      .v2-pill {
        justify-self: end;
        border: 1px solid rgba(255,255,255,0.36);
        border-radius: 999px;
        padding: 12px 18px;
        font-size: 12px;
        font-weight: 900;
        backdrop-filter: blur(18px);
      }

      .v2-hero {
        position: relative;
        min-height: 100svh;
        display: grid;
        align-items: end;
        overflow: hidden;
        isolation: isolate;
        padding: 120px 32px 34px;
      }

      .v2-hero-image {
        position: absolute;
        inset: -5vh -4vw;
        z-index: -3;
        transform-origin: center;
      }

      .v2-hero-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(0.88) contrast(1.02);
      }

      .v2-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -2;
        background:
          linear-gradient(90deg, rgba(10,11,9,0.84) 0%, rgba(10,11,9,0.54) 38%, rgba(10,11,9,0.18) 70%),
          linear-gradient(0deg, rgba(10,11,9,0.88) 0%, rgba(10,11,9,0.10) 48%, rgba(10,11,9,0.28) 100%);
      }

      .v2-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background-image: radial-gradient(circle at 50% 50%, transparent 0, rgba(0,0,0,0.18) 72%);
        pointer-events: none;
      }

      .v2-hero-inner {
        width: min(100%, 1360px);
        margin: 0 auto;
      }

      .v2-kicker {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        margin-bottom: 22px;
        color: rgba(245,240,229,0.74);
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .v2-hero h1 {
        max-width: 1180px;
        margin: 0;
        font-size: clamp(62px, 9.4vw, 142px);
        font-weight: 900;
        line-height: 0.82;
        letter-spacing: 0;
      }

      .v2-serif {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-style: italic;
        font-weight: 600;
      }

      .v2-type {
        display: block;
        position: relative;
        width: max-content;
        min-width: 13ch;
        min-height: 0.9em;
        color: #f9e6b5;
        contain: layout paint;
      }

      .v2-type-measure {
        visibility: hidden;
        white-space: nowrap;
      }

      .v2-type-text {
        position: absolute;
        inset: 0 auto auto 0;
        white-space: nowrap;
      }

      .v2-hero-bottom {
        display: grid;
        grid-template-columns: minmax(0, 480px) 1fr minmax(210px, 280px);
        gap: 42px;
        align-items: end;
        margin-top: 36px;
      }

      .v2-copy {
        color: rgba(245,240,229,0.76);
        font-size: 17px;
        line-height: 1.65;
      }

      .v2-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
      }

      .v2-button,
      .v2-ghost {
        display: inline-flex;
        min-height: 52px;
        align-items: center;
        justify-content: center;
        gap: 10px;
        border-radius: 999px;
        padding: 0 22px;
        font-size: 13px;
        font-weight: 900;
        transition: transform 260ms ease, background 260ms ease;
      }

      .v2-button {
        background: #f5f0e5;
        color: #11120f !important;
      }

      .v2-ghost {
        border: 1px solid rgba(245,240,229,0.32);
        color: #f5f0e5;
        backdrop-filter: blur(18px);
      }

      .v2-button:hover,
      .v2-ghost:hover,
      .v2-story-card:hover,
      .v2-system-card:hover {
        transform: translateY(-4px);
      }

      .v2-live-card {
        justify-self: end;
        max-width: 280px;
        border: 1px solid rgba(245,240,229,0.24);
        border-radius: 26px;
        padding: 18px;
        background: rgba(13,14,12,0.42);
        box-shadow: 0 24px 70px rgba(0,0,0,0.32);
        backdrop-filter: blur(24px);
      }

      .v2-live-card p {
        margin: 18px 0 0;
        color: rgba(245,240,229,0.72);
        font-size: 13px;
        line-height: 1.5;
      }

      .v2-live-top {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .v2-section {
        width: min(100% - 64px, 1240px);
        margin: 0 auto;
        padding: 126px 0;
      }

      .v2-statement {
        background: #f3eee3;
        color: #11120f;
      }

      .v2-statement .v2-section {
        display: grid;
        grid-template-columns: 0.72fr 1.28fr;
        gap: 64px;
        align-items: start;
      }

      .v2-label {
        color: #676359;
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
      }

      .v2-statement h2,
      .v2-outcomes h2,
      .v2-systems h2 {
        margin: 0;
        font-size: clamp(44px, 6.2vw, 92px);
        font-weight: 900;
        line-height: 0.92;
        letter-spacing: 0;
      }

      .v2-statement p {
        max-width: 570px;
        margin: 26px 0 0;
        color: #5c584e;
        font-size: 17px;
        line-height: 1.72;
      }

      .v2-story-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 54px;
      }

      .v2-story-card {
        min-height: 240px;
        border: 1px solid rgba(17,18,15,0.09);
        border-radius: 28px;
        padding: 24px;
        background: rgba(255,255,255,0.58);
        box-shadow: 0 18px 60px rgba(17,18,15,0.08);
        transition: transform 260ms ease;
      }

      .v2-story-card span {
        display: inline-flex;
        width: 38px;
        height: 38px;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        background: #11120f;
        color: #f5f0e5;
      }

      .v2-story-card h3,
      .v2-system-card h3 {
        margin: 74px 0 0;
        font-size: 24px;
        font-weight: 900;
        line-height: 1;
      }

      .v2-story-card p,
      .v2-system-card p {
        margin: 14px 0 0;
        color: #656156;
        font-size: 14px;
        line-height: 1.6;
      }

      .v2-outcomes {
        background: #11120f;
      }

      .v2-outcomes-head {
        display: grid;
        grid-template-columns: 1fr minmax(280px, 420px);
        gap: 60px;
        align-items: end;
      }

      .v2-outcomes-head p {
        margin: 0;
        color: rgba(245,240,229,0.66);
        font-size: 17px;
        line-height: 1.68;
      }

      .v2-metrics {
        display: grid;
        grid-template-columns: 1.2fr 0.8fr 0.8fr;
        gap: 16px;
        margin-top: 58px;
      }

      .v2-metric {
        min-height: 260px;
        border: 1px solid rgba(245,240,229,0.12);
        border-radius: 30px;
        padding: 28px;
        background: rgba(255,255,255,0.045);
      }

      .v2-metric strong {
        display: block;
        font-size: clamp(54px, 8vw, 120px);
        font-weight: 900;
        line-height: 0.9;
      }

      .v2-metric p {
        max-width: 260px;
        margin: 22px 0 0;
        color: rgba(245,240,229,0.62);
        line-height: 1.55;
      }

      .v2-systems {
        background: #e4e0d6;
        color: #11120f;
      }

      .v2-system-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 18px;
        margin-top: 54px;
      }

      .v2-system-card {
        border: 1px solid rgba(17,18,15,0.1);
        border-radius: 32px;
        padding: 30px;
        background: #f7f1e6;
        transition: transform 260ms ease;
      }

      .v2-system-card h3 {
        margin-top: 110px;
      }

      .v2-footer {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        width: min(100% - 64px, 1240px);
        margin: 0 auto;
        padding: 42px 0;
        color: rgba(245,240,229,0.62);
        font-size: 12px;
        font-weight: 800;
      }

      @media (max-width: 900px) {
        .v2-nav {
          inset: 18px 24px auto;
          grid-template-columns: 1fr auto;
        }

        .v2-nav nav {
          display: none;
        }

        .v2-hero {
          padding: 104px 24px 32px;
        }

        .v2-hero-bottom,
        .v2-statement .v2-section,
        .v2-outcomes-head,
        .v2-metrics,
        .v2-system-grid {
          grid-template-columns: 1fr;
        }

        .v2-live-card {
          justify-self: start;
        }

        .v2-story-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 560px) {
        .v2-hero h1 {
          font-size: 56px;
        }

        .v2-hero-bottom {
          gap: 28px;
        }

        .v2-actions {
          flex-direction: column;
        }

        .v2-section {
          width: min(100% - 40px, 1240px);
          padding: 86px 0;
        }

        .v2-footer {
          width: min(100% - 40px, 1240px);
          flex-direction: column;
        }
      }
    `}</style>
  )
}

export function LandingPageVariant() {
  useLenis()

  return (
    <div className="v2-page">
      <SEO
        title="Lira - Visual Landing Concept"
        description="A visual-first editorial landing page concept for Lira, the AI customer support engine for SaaS teams."
        path="/landing-v2"
      />
      <VariantStyles />
      <VariantNav />

      <section className="v2-hero">
        <HeroImage />
        <motion.div className="v2-hero-inner" variants={stagger} initial="hidden" animate="show">
          <motion.span className="v2-kicker" variants={reveal}>
            <Circle size={9} fill="currentColor" />
            Visual concept 02
          </motion.span>
          <motion.h1 variants={reveal}>
            When support works, founders get their{' '}
            <span className="v2-serif v2-type" aria-live="polite">
              <span className="v2-type-measure" aria-hidden="true">
                customers back
              </span>
              <span className="v2-type-text">
                <Typewriter
                  words={heroTypeWords}
                  loop
                  typeSpeed={72}
                  deleteSpeed={28}
                  delaySpeed={2200}
                />
              </span>
            </span>
          </motion.h1>
          <motion.div className="v2-hero-bottom" variants={stagger}>
            <motion.p className="v2-copy" variants={reveal}>
              Lira handles customer issues before they become the day. Autonomous support, proactive
              recovery, and customer memory for SaaS teams that need calm at scale.
            </motion.p>
            <motion.div className="v2-actions" variants={reveal}>
              <Link to="/signup" className="v2-button">
                <Sparkles size={16} />
                Start free
              </Link>
              <a href="mailto:hello@creovine.com" className="v2-ghost">
                Talk to the team
                <ArrowUpRight size={16} />
              </a>
            </motion.div>
            <motion.div className="v2-live-card" variants={reveal}>
              <div className="v2-live-top">
                <span>Overnight</span>
                <span>Resolved</span>
              </div>
              <p>
                Payment risk found, customers contacted, account access restored, and the queue
                stayed quiet.
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <section id="story" className="v2-statement">
        <motion.div
          className="v2-section"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.28 }}
        >
          <motion.span className="v2-label" variants={reveal}>
            The emotional promise
          </motion.span>
          <div>
            <motion.h2 variants={reveal}>Not another dashboard. A quieter company.</motion.h2>
            <motion.p variants={reveal}>
              The best support software is felt before it is seen: fewer anxious pings, fewer
              repeated explanations, fewer customers waiting for someone to notice.
            </motion.p>
            <motion.div className="v2-story-grid" variants={stagger}>
              {[
                {
                  icon: MessageCircle,
                  title: 'Customers feel known',
                  text: 'Every reply carries the memory of the full relationship, not just the latest ticket.',
                },
                {
                  icon: Moon,
                  title: 'The queue sleeps',
                  text: 'Lira resolves routine pain overnight and escalates only what deserves attention.',
                },
                {
                  icon: Headphones,
                  title: 'Teams breathe again',
                  text: 'Support, success, and founders regain the time they were losing to reactive work.',
                },
              ].map(({ icon: Icon, title, text }) => (
                <motion.article className="v2-story-card" variants={reveal} key={title}>
                  <span>
                    <Icon size={17} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="outcomes" className="v2-outcomes">
        <motion.div
          className="v2-section"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.24 }}
        >
          <div className="v2-outcomes-head">
            <motion.h2 variants={reveal}>Support becomes invisible infrastructure.</motion.h2>
            <motion.p variants={reveal}>
              Lira sits across chat, email, WhatsApp, CRM, and helpdesk tools, taking the next best
              action before churn risk becomes a meeting.
            </motion.p>
          </div>
          <motion.div className="v2-metrics" variants={stagger}>
            {[
              ['10m', 'to launch the customer support agent'],
              ['60%', 'lower support spend for lean SaaS teams'],
              ['4.8', 'customer experience rating after automation'],
            ].map(([value, label]) => (
              <motion.div className="v2-metric" variants={reveal} key={value}>
                <strong>{value}</strong>
                <p>{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="systems" className="v2-systems">
        <motion.div
          className="v2-section"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.22 }}
        >
          <motion.span className="v2-label" variants={reveal}>
            What runs underneath
          </motion.span>
          <motion.h2 variants={reveal}>A calm surface. A serious operator below it.</motion.h2>
          <motion.div className="v2-system-grid" variants={stagger}>
            {[
              [
                'Proactive signals',
                'Failed payments, usage drops, onboarding gaps, and renewal risk trigger support before customers complain.',
              ],
              [
                'Autonomous action chains',
                'Lira can answer, route, refund, update CRM fields, create tasks, and summarize decisions with auditability.',
              ],
              [
                'Lifetime memory',
                'Every customer keeps context across channels so they never need to explain the same issue twice.',
              ],
              [
                'Human handoff',
                'When judgment is needed, Lira delivers the history, likely cause, and recommended next move.',
              ],
            ].map(([title, text]) => (
              <motion.article className="v2-system-card" variants={reveal} key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </motion.article>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <footer className="v2-footer">
        <span>Lira visual concept 02</span>
        <Link to="/">Compare with current landing page</Link>
      </footer>
    </div>
  )
}
