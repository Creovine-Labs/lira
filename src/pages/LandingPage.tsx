import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import Lenis from 'lenis'
import { motion, useScroll, useTransform } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowUpRight,
  Bot,
  BrainCircuit,
  Check,
  CircleDot,
  MessageSquareText,
  Workflow,
} from 'lucide-react'

const trustedBy = ['Metricly', 'Velora', 'Auralink', 'Fluxbit', 'Taskly', 'Optima AI']

const services = [
  {
    icon: MessageSquareText,
    title: 'Autonomous Support',
    description:
      'Lira answers product questions, resolves tickets, and hands off only when human judgment is needed.',
  },
  {
    icon: Workflow,
    title: 'Proactive Outreach',
    description:
      'Failed payments, trial drop-offs, renewal risks, and product friction become calm, timely conversations.',
  },
  {
    icon: BrainCircuit,
    title: 'Customer Memory',
    description:
      'Every customer keeps one relationship history across chat, email, WhatsApp, calls, CRM, and helpdesk tools.',
  },
]

const metrics = [
  { value: '10m', label: 'average launch time' },
  { value: '60%', label: 'lower support spend' },
  { value: '4.8/5', label: 'customer experience rating' },
]

const footerLinks = ['Product', 'Security', 'Pricing', 'Resources']

const viewportReveal = { once: true, amount: 0.2 }

const revealUp: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
}

const staggerGroup: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
}

function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined
    }

    const lenis = new Lenis({
      duration: 1.18,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
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

function Nav() {
  return (
    <motion.header
      className="lira-nav"
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to="/" className="lira-brand" aria-label="Lira home">
        <span className="lira-brand-mark">L</span>
        <span>Lira</span>
      </Link>
      <nav aria-label="Primary navigation">
        <a href="#services">Services</a>
        <a href="#results">Results</a>
        <a href="#proof">Proof</a>
      </nav>
      <Link to="/signup" className="lira-nav-cta">
        Start free
      </Link>
    </motion.header>
  )
}

function HeroVisual() {
  const { scrollY } = useScroll()
  const phoneY = useTransform(scrollY, [0, 900], [0, 42])
  const topCardY = useTransform(scrollY, [0, 800], [0, -32])
  const bottomCardY = useTransform(scrollY, [0, 900], [0, 62])

  return (
    <div className="hero-visual" aria-label="Lira customer support workspace preview">
      <motion.div className="hero-phone-card" style={{ y: phoneY }}>
        <div className="phone-toolbar">
          <span className="status-dot" />
          <span>Live customer memory</span>
        </div>
        <div className="phone-thread">
          <div>
            <span className="message-label">Customer</span>
            <p>I cannot access my workspace after upgrading.</p>
          </div>
          <div className="message-dark">
            <span className="message-label">Lira</span>
            <p>I found the migration issue, restored access, and updated your billing email.</p>
          </div>
        </div>
        <div className="phone-footer">
          <span>Resolved autonomously</span>
          <span>02:14</span>
        </div>
      </motion.div>

      <motion.div className="floating-card card-small top-card" style={{ y: topCardY }}>
        <span className="mini-icon">
          <Bot size={15} />
        </span>
        <div>
          <strong>Proactive save</strong>
          <p>Payment risk handled before a ticket was opened.</p>
        </div>
      </motion.div>

      <motion.div className="floating-card card-small bottom-card" style={{ y: bottomCardY }}>
        <div className="score">94%</div>
        <p>first-contact resolution across support and onboarding flows.</p>
      </motion.div>
    </div>
  )
}

function LandingStyles() {
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

      .lenis.lenis-smooth [data-lenis-prevent] {
        overscroll-behavior: contain;
      }

      .motion-layer {
        will-change: transform, opacity;
      }

      .lira-page {
        min-height: 100vh;
        background: #f7f7f4;
        color: #11110f;
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .lira-shell {
        width: 100%;
        min-height: 100vh;
        margin: 0;
        border: 0;
        border-radius: 0;
        background: #f7f7f4;
        box-shadow: none;
        overflow: hidden;
      }

      .hero-scene {
        position: relative;
        min-height: 100svh;
        overflow: hidden;
        background: #0b1220;
        color: #ffffff;
        isolation: isolate;
      }

      .hero-scene::before,
      .hero-scene::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .hero-scene::before {
        z-index: -3;
        background-image: url('/landing-v1/hero-2.jpg');
        background-position: center top;
        background-size: cover;
        transform: scale(1.02);
      }

      .hero-scene::after {
        z-index: -2;
        background:
          linear-gradient(90deg,
            rgba(5, 8, 20, 0.88) 0%,
            rgba(5, 8, 20, 0.60) 32%,
            rgba(5, 8, 20, 0.15) 58%,
            rgba(5, 8, 20, 0.08) 100%),
          linear-gradient(180deg,
            rgba(5, 8, 20, 0.28) 0%,
            rgba(5, 8, 20, 0.04) 40%,
            rgba(5, 8, 20, 0.52) 100%);
      }

      .lira-nav {
        position: relative;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        width: min(100% - 96px, 1240px);
        margin: 0 auto;
        padding: 24px 0;
      }

      .lira-brand,
      .lira-nav nav,
      .lira-nav-cta {
        display: inline-flex;
        align-items: center;
      }

      .lira-brand {
        gap: 9px;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        text-decoration: none;
      }

      .lira-brand-mark,
      .mini-icon,
      .service-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #fffaf0;
        color: #151513;
        box-shadow: 0 10px 24px rgba(20, 20, 18, 0.18);
      }

      .lira-brand-mark {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        font-size: 11px;
      }

      .lira-nav nav {
        gap: 32px;
      }

      .lira-nav a {
        color: rgba(255, 255, 255, 0.88);
        font-size: 12px;
        font-weight: 600;
        text-decoration: none;
        transition: opacity 220ms ease;
      }

      .lira-nav a:hover {
        opacity: 0.55;
      }

      .lira-nav-cta,
      .primary-cta,
      .secondary-cta {
        border-radius: 999px;
        font-weight: 700;
        transition:
          transform 240ms ease,
          box-shadow 240ms ease,
          background 240ms ease;
      }

      .lira-nav-cta {
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 5px 5px 5px 18px;
        background: #0f1117;
        color: #ffffff !important;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 4px 24px rgba(0,0,0,0.22);
      }

      .lira-nav-cta::after {
        content: '↗';
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        margin-left: 12px;
        border-radius: 999px;
        background: #ffffff;
        color: #0f1117;
        font-size: 14px;
        line-height: 1;
      }

      .primary-cta {
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 6px 6px 6px 22px;
        min-height: 52px;
        background: #0f1117;
        color: #ffffff !important;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 8px 32px rgba(0,0,0,0.32);
      }

      .primary-cta .cta-icon-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        margin-left: 16px;
        border-radius: 999px;
        background: #ffffff;
        color: #0f1117;
        flex-shrink: 0;
      }

      .secondary-cta {
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 6px 6px 6px 22px;
        min-height: 52px;
        border: 1px solid rgba(255, 255, 255, 0.42);
        background: rgba(255, 255, 255, 0.10);
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-decoration: none;
        backdrop-filter: blur(18px);
      }

      .secondary-cta .cta-icon-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        margin-left: 16px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
        color: #ffffff;
        flex-shrink: 0;
      }

      .lira-nav-cta:hover,
      .primary-cta:hover,
      .secondary-cta:hover,
      .floating-card:hover,
      .service-card:hover {
        transform: translateY(-3px);
      }

      .primary-cta:hover .cta-icon-circle,
      .secondary-cta:hover .cta-icon-circle {
        transform: rotate(45deg);
        transition: transform 240ms ease;
      }

      .hero {
        position: relative;
        z-index: 2;
        width: min(100% - 96px, 1240px);
        margin: 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.75fr);
        gap: 84px;
        align-items: center;
        min-height: calc(100svh - 88px);
        padding: 72px 0 78px;
      }

      .eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 28px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 11px;
        font-weight: 800;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      .hero h1,
      .statement h2,
      .cta h2 {
        font-weight: 900;
        letter-spacing: 0;
        line-height: 0.93;
      }

      .hero h1 {
        max-width: 650px;
        font-size: clamp(58px, 8vw, 108px);
        text-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
      }

      .italic {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-style: italic;
        font-weight: 600;
      }

      .hero-copy {
        max-width: 420px;
        margin-top: 24px;
        color: rgba(255, 255, 255, 0.88);
        font-size: 16px;
        line-height: 1.65;
        text-shadow: 0 12px 34px rgba(0, 0, 0, 0.32);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        margin-top: 30px;
      }

      .hero-visual {
        position: relative;
        min-height: 500px;
      }

      .hero-phone-card {
        position: absolute;
        top: 20px;
        right: 28px;
        width: min(82%, 340px);
        min-height: 430px;
        border-radius: 28px;
        padding: 24px;
        background:
          linear-gradient(180deg, rgba(255,250,240,0.14), rgba(0,0,0,0.22)),
          rgba(17,18,15,0.72);
        color: #f9f8f1;
        box-shadow: 0 34px 80px rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(24px);
        overflow: hidden;
      }

      .hero-phone-card::before {
        content: '';
        position: absolute;
        inset: 88px -90px auto auto;
        width: 250px;
        height: 250px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
      }

      .phone-toolbar,
      .phone-footer,
      .message-label {
        position: relative;
        display: flex;
        align-items: center;
        color: rgba(249, 248, 241, 0.64);
        font-size: 11px;
        font-weight: 700;
      }

      .phone-toolbar,
      .phone-footer {
        justify-content: space-between;
      }

      .phone-toolbar {
        gap: 8px;
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #b6d5a8;
      }

      .phone-thread {
        position: relative;
        display: grid;
        gap: 16px;
        margin-top: 112px;
      }

      .phone-thread > div {
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 18px;
        padding: 16px;
        background: rgba(255,255,255,0.07);
        backdrop-filter: blur(12px);
      }

      .phone-thread p {
        margin-top: 8px;
        font-size: 16px;
        line-height: 1.35;
      }

      .message-dark {
        background: #f7f7f4 !important;
        color: #141412;
      }

      .message-dark .message-label {
        color: #77776f;
      }

      .phone-footer {
        margin-top: 82px;
      }

      .floating-card,
      .service-card,
      .metric-card,
      .testimonial-card,
      .cta-panel {
        border: 1px solid rgba(20, 20, 18, 0.08);
        background: rgba(255,255,255,0.66);
        box-shadow: 0 18px 55px rgba(20, 20, 18, 0.08);
        backdrop-filter: blur(18px);
      }

      .floating-card {
        position: absolute;
        color: #11120f;
        border-radius: 18px;
        transition:
          transform 260ms ease,
          box-shadow 260ms ease;
      }

      .card-small {
        width: 230px;
        padding: 16px;
      }

      .top-card {
        top: 70px;
        left: 0;
        display: flex;
        gap: 12px;
      }

      .bottom-card {
        right: 0;
        bottom: 24px;
      }

      .mini-icon,
      .service-icon {
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        border-radius: 10px;
      }

      .floating-card strong {
        display: block;
        font-size: 13px;
      }

      .floating-card p {
        margin-top: 6px;
        color: #686861;
        font-size: 12px;
        line-height: 1.45;
      }

      .score {
        font-size: 54px;
        font-weight: 900;
        line-height: 1;
      }

      .logo-strip {
        width: min(100% - 96px, 1240px);
        margin: 0 auto;
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 28px;
        align-items: center;
        padding: 24px 0 76px;
      }

      .logo-strip p {
        color: #77776f;
        font-size: 11px;
        line-height: 1.35;
      }

      .logos {
        display: flex;
        flex-wrap: wrap;
        gap: 28px;
        align-items: center;
        justify-content: space-between;
      }

      .logos span {
        color: #74746d;
        font-size: 13px;
        font-weight: 800;
      }

      .statement,
      .services,
      .results,
      .proof,
      .cta,
      .footer {
        width: min(100% - 96px, 1240px);
        margin-right: auto;
        margin-left: auto;
      }

      .statement {
        padding-top: 86px;
        text-align: center;
      }

      .section-kicker {
        display: inline-flex;
        margin-bottom: 22px;
        border-radius: 999px;
        background: #fff;
        padding: 8px 13px;
        color: #5d5d56;
        font-size: 11px;
        font-weight: 800;
      }

      .statement h2,
      .cta h2 {
        max-width: 720px;
        margin: 0 auto;
        font-size: clamp(42px, 6vw, 76px);
      }

      .statement p {
        max-width: 520px;
        margin: 22px auto 0;
        color: #66665f;
        font-size: 16px;
        line-height: 1.7;
      }

      .services {
        padding-top: 64px;
      }

      .service-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .service-card {
        min-height: 220px;
        border-radius: 18px;
        padding: 26px;
        transition:
          transform 260ms ease,
          box-shadow 260ms ease;
      }

      .service-card h3 {
        margin-top: 46px;
        font-size: 20px;
        font-weight: 900;
        line-height: 1.1;
      }

      .service-card p {
        margin-top: 12px;
        color: #65655e;
        font-size: 14px;
        line-height: 1.6;
      }

      .service-tags {
        display: flex;
        gap: 12px;
        margin-top: 30px;
        padding-bottom: 80px;
        overflow: hidden;
        color: #6c6c65;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .service-tags span {
        border: 1px solid rgba(20,20,18,0.08);
        border-radius: 999px;
        background: rgba(255,255,255,0.45);
        padding: 10px 16px;
      }

      .results {
        padding-top: 26px;
        padding-bottom: 94px;
      }

      .results-panel {
        display: grid;
        grid-template-columns: 1fr 1.1fr;
        gap: 18px;
        align-items: stretch;
        border-radius: 22px;
        background: #fdfdfa;
        padding: 18px;
        box-shadow: 0 24px 70px rgba(20, 20, 18, 0.1);
      }

      .results-title {
        padding: 42px;
      }

      .results-title h2 {
        max-width: 420px;
        color: #9a9a92;
        font-size: clamp(34px, 4vw, 58px);
        font-weight: 900;
        line-height: 1;
      }

      .results-title strong {
        color: #151513;
      }

      .results-title p {
        max-width: 300px;
        margin-top: 28px;
        color: #686861;
        line-height: 1.6;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .metric-card {
        min-height: 190px;
        border-radius: 18px;
        padding: 28px;
      }

      .metric-card.dark {
        grid-row: span 2;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: #181816;
        color: #f8f7f0;
      }

      .metric-card strong {
        display: block;
        font-size: clamp(42px, 5vw, 74px);
        font-weight: 500;
        line-height: 0.95;
      }

      .metric-card p {
        margin-top: 12px;
        color: #6a6a63;
        font-size: 13px;
        line-height: 1.45;
      }

      .metric-card.dark p {
        color: rgba(248,247,240,0.66);
      }

      .rating {
        display: flex;
        gap: 4px;
        color: #d9bc69;
      }

      .proof {
        padding-bottom: 104px;
      }

      .testimonial-card {
        display: grid;
        grid-template-columns: 0.8fr 1.2fr;
        gap: 46px;
        align-items: center;
        border-radius: 24px;
        padding: 52px;
      }

      .avatar-stack {
        display: flex;
        margin-bottom: 26px;
      }

      .avatar-stack span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 46px;
        margin-right: -10px;
        border: 3px solid #f7f7f4;
        border-radius: 999px;
        background: #deded8;
        color: #171715;
        font-size: 12px;
        font-weight: 900;
      }

      .proof-meta {
        color: #6c6c65;
        font-size: 13px;
        line-height: 1.6;
      }

      blockquote {
        margin: 0;
        color: #171715;
        font-size: clamp(28px, 4vw, 48px);
        font-weight: 900;
        line-height: 1.05;
      }

      cite {
        display: block;
        margin-top: 24px;
        color: #6c6c65;
        font-size: 13px;
        font-style: normal;
        font-weight: 700;
      }

      .cta {
        padding: 64px 0 80px;
        text-align: center;
      }

      .cta-panel {
        position: relative;
        overflow: hidden;
        isolation: isolate;
        border-radius: 26px;
        padding: 90px 48px;
        background: #080d1a;
        width: min(100% - 96px, 1240px);
        margin: 0 auto;
      }

      .cta-panel::before,
      .cta-panel::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .cta-panel::before {
        z-index: -3;
        background-image: url('/landing-v1/cta-bg.jpg');
        background-position: center center;
        background-size: cover;
        transform: scale(1.04);
      }

      .cta-panel::after {
        z-index: -2;
        background:
          linear-gradient(180deg,
            rgba(5, 8, 20, 0.72) 0%,
            rgba(5, 8, 20, 0.52) 50%,
            rgba(5, 8, 20, 0.80) 100%),
          linear-gradient(90deg,
            rgba(5, 8, 20, 0.25) 0%,
            rgba(5, 8, 20, 0.05) 50%,
            rgba(5, 8, 20, 0.25) 100%);
      }

      .cta-panel h2 {
        color: #ffffff;
      }

      .cta-panel p {
        max-width: 520px;
        margin: 24px auto 36px;
        color: rgba(255, 255, 255, 0.70);
        line-height: 1.75;
      }

      .cta-panel .section-kicker {
        background: rgba(255, 255, 255, 0.10);
        color: rgba(255, 255, 255, 0.80);
        border: 1px solid rgba(255, 255, 255, 0.18);
      }

      .cta p {
        max-width: 500px;
        margin: 24px auto 32px;
        color: #66665f;
        line-height: 1.7;
      }

      .footer {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding-top: 28px;
        padding-bottom: 32px;
        color: #77776f;
        font-size: 12px;
        font-weight: 700;
      }

      .footer nav {
        display: flex;
        flex-wrap: wrap;
        gap: 22px;
      }

      .footer a {
        color: inherit;
        text-decoration: none;
      }

      .fade-in {
        animation: fadeUp 620ms ease both;
      }

      @keyframes fadeUp {
        from {
          opacity: 0.92;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media (max-width: 900px) {
        .lira-nav,
        .hero,
        .logo-strip,
        .statement,
        .services,
        .results,
        .proof,
        .cta,
        .footer {
          width: min(100% - 48px, 760px);
        }

        .lira-nav nav {
          display: none;
        }

        .hero {
          grid-template-columns: 1fr;
          gap: 42px;
          padding-top: 58px;
        }

        .hero-visual {
          min-height: 450px;
        }

        .hero-phone-card {
          right: 0;
          left: auto;
          width: min(90%, 330px);
        }

        .logo-strip,
        .results-panel,
        .testimonial-card {
          grid-template-columns: 1fr;
        }

        .logos {
          justify-content: flex-start;
        }

        .service-grid {
          grid-template-columns: 1fr;
        }

        .metric-grid {
          grid-template-columns: 1fr;
        }

        .metric-card.dark {
          grid-row: auto;
        }
      }

      @media (max-width: 560px) {
        .lira-nav {
          padding-top: 18px;
        }

        .hero {
          padding-top: 48px;
        }

        .hero h1 {
          font-size: 50px;
        }

        .hero-actions {
          flex-direction: column;
          align-items: stretch;
        }

        .hero-visual {
          min-height: 420px;
        }

        .hero-phone-card {
          width: 88%;
          min-height: 380px;
          border-radius: 24px;
        }

        .phone-thread {
          margin-top: 72px;
        }

        .phone-footer {
          margin-top: 46px;
        }

        .top-card {
          top: 18px;
        }

        .bottom-card {
          bottom: 0;
        }

        .card-small {
          width: 190px;
        }

        .score {
          font-size: 44px;
        }

        .statement {
          padding-top: 64px;
        }

        .service-tags {
          padding-bottom: 58px;
        }

        .results-title,
        .testimonial-card {
          padding: 28px;
        }

        .footer {
          flex-direction: column;
        }
      }
    `}</style>
  )
}

export function LandingPage() {
  useSmoothScroll()

  return (
    <div className="lira-page">
      <SEO
        title="Lira - AI Customer Support for SaaS"
        description="Lira is the AI customer support engine for SaaS. Proactive outreach, autonomous ticket resolution, lifetime customer memory, flat pricing, and native WhatsApp. Deploy in under 10 minutes."
        keywords="AI customer support SaaS, AI support automation, proactive customer support, flat pricing support software, WhatsApp customer support, AI support agent, Intercom alternative, Zendesk alternative, Gorgias alternative, Lira AI"
        path="/"
      />
      <LandingStyles />

      <main className="lira-shell">
        <div className="hero-scene">
          <Nav />

          <motion.section
            className="hero fade-in"
            variants={staggerGroup}
            initial="hidden"
            animate="show"
          >
            <motion.div className="motion-layer" variants={revealUp}>
              <motion.span className="eyebrow" variants={revealUp}>
                <CircleDot size={12} />
                AI customer support for modern SaaS teams
              </motion.span>
              <motion.h1 variants={revealUp}>
                Support that feels <span className="italic">human</span> before customers ask.
              </motion.h1>
              <motion.p className="hero-copy" variants={revealUp}>
                Lira resolves tickets, reaches out proactively, and remembers every customer across
                your entire support stack. One calm AI operator for the full customer lifecycle.
              </motion.p>
              <motion.div className="hero-actions" variants={revealUp}>
                <Link to="/signup" className="primary-cta">
                  Start free
                  <span className="cta-icon-circle">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
                <a href="mailto:hello@creovine.com" className="secondary-cta">
                  Talk to the team
                  <span className="cta-icon-circle">
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              </motion.div>
            </motion.div>
            <motion.div className="motion-layer" variants={revealUp}>
              <HeroVisual />
            </motion.div>
          </motion.section>
        </div>
        {/* end hero-scene */}

        <motion.section
          className="logo-strip"
          aria-label="Trusted customers"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.p className="motion-layer" variants={revealUp}>
            Trusted by ambitious SaaS operators worldwide
          </motion.p>
          <div className="logos">
            {trustedBy.map((name) => (
              <motion.span className="motion-layer" variants={revealUp} key={name}>
                {name}
              </motion.span>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="statement"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.span className="section-kicker motion-layer" variants={revealUp}>
            Mission
          </motion.span>
          <motion.h2 className="motion-layer" variants={revealUp}>
            Turn support from a cost center into a <span className="italic">retention engine</span>.
          </motion.h2>
          <motion.p className="motion-layer" variants={revealUp}>
            Lira watches the signals your team already has, understands what each customer needs,
            and takes the next best action without creating another dashboard to manage.
          </motion.p>
        </motion.section>

        <motion.section
          id="services"
          className="services"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.div className="service-grid" variants={staggerGroup}>
            {services.map(({ icon: Icon, title, description }) => (
              <motion.article
                className="service-card motion-layer"
                variants={revealUp}
                whileHover={{ y: -7, scale: 1.015 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                key={title}
              >
                <span className="service-icon">
                  <Icon size={17} />
                </span>
                <h3>{title}</h3>
                <p>{description}</p>
              </motion.article>
            ))}
          </motion.div>
          <motion.div className="service-tags" variants={staggerGroup} aria-hidden="true">
            {[
              'Customer Support',
              'WhatsApp',
              'Helpdesk',
              'Onboarding',
              'Renewals',
              'Escalations',
              'CRM',
            ].map((tag) => (
              <motion.span className="motion-layer" variants={revealUp} key={tag}>
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </motion.section>

        <motion.section
          id="results"
          className="results"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.div className="results-panel motion-layer" variants={revealUp}>
            <motion.div className="results-title" variants={staggerGroup}>
              <motion.span className="section-kicker motion-layer" variants={revealUp}>
                Results
              </motion.span>
              <motion.h2 className="motion-layer" variants={revealUp}>
                Our focus is simple <strong>support that converts</strong>
              </motion.h2>
              <motion.p className="motion-layer" variants={revealUp}>
                Replace reactive queues with intelligent action chains that improve cost, speed, and
                customer trust at the same time.
              </motion.p>
            </motion.div>
            <motion.div className="metric-grid" variants={staggerGroup}>
              <motion.div
                className="metric-card dark motion-layer"
                variants={revealUp}
                whileHover={{ y: -5, scale: 1.01 }}
              >
                <p>
                  Lira delivered automated support outcomes across onboarding, payment recovery,
                  usage risk, and escalations.
                </p>
                <div>
                  <div className="rating">
                    <Check size={14} />
                    <Check size={14} />
                    <Check size={14} />
                    <Check size={14} />
                    <Check size={14} />
                  </div>
                  <strong>{metrics[2].value}</strong>
                  <p>{metrics[2].label}</p>
                </div>
              </motion.div>
              {metrics.slice(0, 2).map((metric) => (
                <motion.div
                  className="metric-card motion-layer"
                  variants={revealUp}
                  whileHover={{ y: -5, scale: 1.01 }}
                  key={metric.label}
                >
                  <strong>{metric.value}</strong>
                  <p>{metric.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section
          id="proof"
          className="proof"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.div className="testimonial-card motion-layer" variants={revealUp}>
            <motion.div variants={staggerGroup}>
              <motion.div className="avatar-stack" variants={staggerGroup} aria-hidden="true">
                <span>FK</span>
                <span>MR</span>
                <span>AL</span>
                <span>+40</span>
              </motion.div>
              <motion.p className="proof-meta motion-layer" variants={revealUp}>
                Used by lean SaaS teams that need enterprise-level customer experience without
                enterprise-level support overhead.
              </motion.p>
            </motion.div>
            <motion.div variants={staggerGroup}>
              <motion.blockquote className="motion-layer" variants={revealUp}>
                &quot;Lira reached customers about a failed payment batch before they filed tickets.
                It paid for itself in the first week.&quot;
              </motion.blockquote>
              <motion.cite className="motion-layer" variants={revealUp}>
                Femi K., Head of Customer Success
              </motion.cite>
            </motion.div>
          </motion.div>
        </motion.section>

        <motion.section
          className="cta"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
        >
          <motion.div className="cta-panel motion-layer" variants={revealUp}>
            <motion.span className="section-kicker motion-layer" variants={revealUp}>
              Deploy in minutes
            </motion.span>
            <motion.h2 className="motion-layer" variants={revealUp}>
              Give every customer a support team that never <span className="italic">forgets</span>.
            </motion.h2>
            <motion.p className="motion-layer" variants={revealUp}>
              Add one script tag, connect your knowledge base, and let Lira start answering,
              routing, recovering, and retaining customers today.
            </motion.p>
            <Link to="/signup" className="primary-cta">
              Start free
              <span className="cta-icon-circle">
                <ArrowUpRight size={16} />
              </span>
            </Link>
          </motion.div>
        </motion.section>

        <motion.footer
          className="footer"
          initial="hidden"
          whileInView="show"
          viewport={viewportReveal}
          variants={staggerGroup}
        >
          <motion.span variants={revealUp}>&copy; {new Date().getFullYear()} Lira</motion.span>
          <nav aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <motion.a variants={revealUp} href={`#${link.toLowerCase()}`} key={link}>
                {link}
              </motion.a>
            ))}
          </nav>
        </motion.footer>
      </main>
    </div>
  )
}
