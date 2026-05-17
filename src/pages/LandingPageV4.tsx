import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  MailCheck,
  MessageSquareText,
  PlugZap,
  ShieldCheck as LucideShieldCheck,
  Workflow,
} from 'lucide-react'
import { SEO } from '@/components/SEO'
import { MarketingFooter, MarketingNavbar } from '@/components/marketing'
import {
  ArrowRight,
  ArrowUpRight,
  Bank,
  BellRinging,
  Brain,
  CaretDown,
  DeviceMobile,
  FlowArrow,
  GlobeHemisphereWest,
  Headset,
  Heartbeat,
  Microphone,
  Notification,
  Package,
  RocketLaunch,
  Storefront,
} from '@phosphor-icons/react'

import { BLOG_POSTS } from './blogData'

const fadeUp: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.82, ease: [0.22, 1, 0.36, 1] } },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
}

const cardReveal: Variants = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1] } },
}

const imageReveal: Variants = {
  hidden: { opacity: 1, scale: 1, y: 0 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
}

const viewport = { once: true, amount: 0.04 }

const brandRows = [
  ['Auralink', 'Metricly', 'Velora', 'Fluxbit', 'Taskly'],
  ['Optima AI', 'Nexflow', 'Clarity', 'Orbitex', 'Synapse'],
]

const featureCards = [
  {
    title: 'Connected Customer Context',
    description:
      'Bring your helpdesk, CRM, Slack, email, and knowledge base together so every reply starts with the full relationship history.',
    visual: 'integrations',
  },
  {
    title: 'Relationship-Led Conversations',
    description:
      'Lira answers questions, remembers context, creates follow-up tasks, and keeps the tone personal across every support moment.',
    visual: 'chat',
  },
  {
    title: 'Multilingual Relationship Care',
    description:
      'Detect language automatically, localize replies, and help customers feel understood wherever they are.',
    visual: 'global',
  },
  {
    title: 'Voice Mode for Support',
    description:
      'Let customers speak naturally, capture voice notes, and let Lira respond with the same context your team would use.',
    visual: 'voice',
  },
]

const services = [
  {
    icon: Bank,
    title: 'Financial Products & Fintech',
    description:
      'Resolve account, payment, KYC, transfer, and policy questions with the care and context high-trust products require.',
  },
  {
    icon: Storefront,
    title: 'E-commerce & Retail',
    description:
      'Answer order, return, delivery, product, and loyalty questions while keeping every customer interaction connected.',
  },
  {
    icon: Heartbeat,
    title: 'Health & Wellness Platforms',
    description:
      'Guide customers through appointments, plans, policies, and sensitive questions with careful routing and context.',
  },
  {
    icon: Package,
    title: 'Logistics & Service Operations',
    description:
      'Handle delivery updates, service requests, escalations, and follow-ups across teams that need fast coordination.',
  },
]

const faqs = [
  {
    q: 'What is Lira?',
    a: 'Lira is an AI customer relationship agent for support teams. It answers questions, understands customer context, updates connected systems, and escalates complex issues with the history your team needs.',
  },
  {
    q: 'How does Lira help build stronger customer relationships?',
    a: 'Lira uses support conversations as signals. It remembers context, detects patterns, creates follow-ups, routes urgent moments, and helps your team respond with care instead of treating every ticket as a reset.',
  },
  {
    q: 'What channels and systems can Lira connect to?',
    a: 'Lira is built to connect with your website, knowledge base, helpdesk, CRM, Slack, Teams, email, and internal workflows so support does not live in a silo.',
  },
  {
    q: 'Does Lira support voice and multilingual conversations?',
    a: 'Yes. Lira supports multilingual conversations and voice-mode experiences so customers can communicate in the way that feels most natural.',
  },
  {
    q: 'Is my customer information secure?',
    a: 'Yes. Lira is designed around controlled access, encrypted data, organization-scoped knowledge, and clear escalation rules so customer context stays protected.',
  },
]

const whyChooseLira = [
  {
    icon: Headset,
    title: 'One support experience across every channel',
    description:
      'Lira brings chat, email, voice, portal, and team workflows into one system so your customers get one consistent experience instead of disconnected support touchpoints.',
  },
  {
    icon: FlowArrow,
    title: 'It takes action, not just conversations',
    description:
      'Lira can do more than answer a question. It can route issues, update the right systems, trigger follow-up, and move work forward so support does not stop at the reply.',
  },
  {
    icon: Brain,
    title: 'Every response starts with real customer context',
    description:
      'Lira uses your knowledge, conversation history, and connected tools to respond with context. That means fewer repeated questions, cleaner handoffs, and support that feels more personal.',
  },
  {
    icon: RocketLaunch,
    title: 'Fast to launch and built to grow with you',
    description:
      'You can get started quickly with the widget, then keep expanding with integrations, multilingual support, voice, and smarter routing as your support operation matures.',
  },
]

const mobileSteps = [
  {
    step: '01',
    title: 'Embed the portal',
    description:
      'Open a WebView pointing to your Lira support portal URL. Customers get the full chat, ticket, and knowledge-base experience inside your iOS or Android app.',
    icon: DeviceMobile,
  },
  {
    step: '02',
    title: 'Register push token',
    description:
      'On app start, get the FCM device token and POST it to the Lira API. Lira stores it and can send push notifications through proactive triggers.',
    icon: Notification,
  },
  {
    step: '03',
    title: 'Receive notifications',
    description:
      "When Lira's proactive engine fires a mobile_push trigger, it sends a push notification directly to the customer's device.",
    icon: BellRinging,
  },
]

const setupSteps = [
  [
    '01',
    'Choose your channels',
    'Turn on website chat, portal, email, or voice from the Lira workspace.',
  ],
  [
    '02',
    'Install the snippet',
    'Paste the script tag into your product or website and add your organization ID.',
  ],
  [
    '03',
    'Connect context',
    'Link your helpdesk, CRM, Slack, Linear, GitHub, or Teams so Lira can route work with the full story.',
  ],
]

function ButtonLink({
  to,
  children,
  variant = 'primary',
}: {
  to: string
  children: string
  variant?: 'primary' | 'secondary'
}) {
  return (
    <Link to={to} className={`hx-button hx-button--${variant}`}>
      <span className="hx-button-label">{children}</span>
      <span className="hx-button-icon">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  )
}

function HeroGraphic() {
  return (
    <div className="hx-hero-card" aria-label="Interactive Lira product demo preview">
      <div className="hx-hero-card-image">
        <div className="hx-orbit hx-orbit-one" />
        <div className="hx-orbit hx-orbit-two" />
        <div className="hx-orbit hx-orbit-three" />
        <div className="hx-core">
          <img src="/lira_mark_white.png" alt="" aria-hidden="true" />
        </div>
        <div className="hx-demo-flow" aria-hidden="true">
          <span>Detect</span>
          <i />
          <span>Answer</span>
          <i />
          <span>Sync</span>
        </div>
        <div className="hx-chat-preview hx-chat-left">
          <span>Customer context</span>
          <strong>Renewal question detected</strong>
        </div>
        <div className="hx-chat-preview hx-chat-right">
          <span>Lira followed up</span>
          <strong>CRM and owner updated</strong>
        </div>
      </div>
    </div>
  )
}

function Visual({ type }: { type: string }) {
  if (type === 'integrations') {
    return (
      <motion.div
        className="hx-feature-visual hx-visual-integrations"
        variants={imageReveal}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
      >
        {[PlugZap, MessageSquareText, Workflow, MailCheck, LucideShieldCheck].map((Icon, index) => (
          <span key={index} className={`hx-hex hx-hex-${index + 1}`}>
            <Icon size={24} />
          </span>
        ))}
      </motion.div>
    )
  }

  if (type === 'chat') {
    return (
      <motion.div
        className="hx-feature-visual hx-visual-chat"
        variants={imageReveal}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
      >
        <div className="hx-mini-message hx-mini-one" aria-label="Can you help me upgrade my plan?">
          <span className="hx-type-line hx-type-user">Can you help me upgrade my plan?</span>
        </div>
        <div
          className="hx-mini-message hx-mini-two"
          aria-label="Yes. I found your account and looped in success."
        >
          <span className="hx-type-line hx-type-lira">
            Yes. I found your account and looped in success.
          </span>
        </div>
        <div className="hx-mini-action">
          <span>Success task created</span>
        </div>
      </motion.div>
    )
  }

  if (type === 'global') {
    return (
      <motion.div
        className="hx-feature-visual hx-visual-global"
        variants={imageReveal}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
      >
        <GlobeHemisphereWest size={96} weight="duotone" />
        <span>EN</span>
        <span>FR</span>
        <span>JP</span>
        <span>ES</span>
      </motion.div>
    )
  }

  if (type === 'setup') {
    return (
      <motion.div
        className="hx-feature-visual hx-visual-setup"
        variants={imageReveal}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
      >
        <div className="hx-setup-toolbar">
          <span />
          <span />
          <span />
          <strong>widget.js</strong>
        </div>
        <pre aria-label="Lira widget embed snippet">{`<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="org_abc123"
  data-color="#202527">
</script>`}</pre>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="hx-feature-visual hx-visual-voice"
      variants={imageReveal}
      initial="hidden"
      whileInView="show"
      viewport={viewport}
    >
      <div className="hx-voice-note hx-voice-user" aria-label="Customer voice note">
        <span>Customer voice note</span>
        <div className="hx-voice-row">
          <Microphone size={16} weight="fill" />
          <button type="button" aria-label="Play customer voice note" className="hx-voice-play" />
          <div className="hx-voice-wave">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <strong>0:12</strong>
        </div>
      </div>
      <div className="hx-voice-note hx-voice-lira" aria-label="Lira voice reply">
        <span>Lira voice reply</span>
        <div className="hx-voice-row">
          <img src="/lira_mark_white.png" alt="" aria-hidden="true" className="hx-voice-logo" />
          <button type="button" aria-label="Play Lira voice reply" className="hx-voice-play" />
          <div className="hx-voice-wave">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
          <strong>0:08</strong>
        </div>
      </div>
      <div className="hx-voice-status">Voice support active</div>
    </motion.div>
  )
}

function SetupJourney() {
  const [activeStep, setActiveStep] = useState(1)
  const active = setupSteps[activeStep]

  return (
    <section className="hx-setup-section">
      <div className="hx-container">
        <div className="hx-setup-card">
          <motion.div
            className="hx-section-details hx-setup-copy"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <motion.h2 className="hx-section-title" variants={fadeUp}>
              <span className="hx-gradient-text">Go from sign up</span>
              <br /> to live support in 3 steps
            </motion.h2>
          </motion.div>

          <div className="hx-setup-journey">
            <div className="hx-setup-steps" role="tablist" aria-label="Lira setup steps">
              {setupSteps.map(([number, title, copy], index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeStep === index}
                  className={`hx-setup-step${activeStep === index ? ' is-active' : ''}`}
                  key={number}
                  onClick={() => setActiveStep(index)}
                >
                  <strong>{number}</strong>
                  <span>{title}</span>
                  <small>{copy}</small>
                </button>
              ))}
            </div>

            <div className="hx-setup-demo" role="tabpanel">
              <div className="hx-setup-toolbar" aria-hidden="true">
                <span />
                <span />
                <span />
                <strong>{active[1]}</strong>
              </div>
              <pre aria-label="Lira install snippet">{`<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="YOUR_ORG_ID"
  data-channel="widget">
</script>`}</pre>
              <div className="hx-setup-note">
                <strong>{active[0]}</strong>
                <span>{active[2]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function WhyChooseSection() {
  return (
    <section className="hx-section hx-why-section">
      <div className="hx-container">
        <motion.div
          className="hx-section-details"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <motion.h2 className="hx-section-title" variants={fadeUp}>
            <span className="hx-gradient-text">Why choose Lira</span>
          </motion.h2>
          <motion.p className="hx-section-para" variants={fadeUp}>
            Lira is built for teams that want support to feel faster, smarter, and more connected
            from the first customer message to the final resolution.
          </motion.p>
        </motion.div>

        <motion.div
          className="hx-why-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {whyChooseLira.map(({ icon: Icon, title, description }) => (
            <motion.article className="hx-why-card" key={title} variants={cardReveal}>
              <div className="hx-why-top">
                <span className="hx-why-icon">
                  <Icon size={22} weight="fill" />
                </span>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function MobileAppSection() {
  return (
    <section className="hx-section">
      <div className="hx-container">
        <motion.div
          style={{ textAlign: 'left', margin: '0 0 52px', alignItems: 'flex-start' }}
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          <motion.h2 className="hx-section-title" variants={fadeUp}>
            <span className="hx-gradient-text">Mobile App Integration</span>
          </motion.h2>
          <motion.p className="hx-section-para" style={{ marginLeft: 0 }} variants={fadeUp}>
            Embed the Lira support portal in your iOS or Android app using a WebView, and register
            for push notifications.
          </motion.p>
        </motion.div>

        <motion.div
          className="hx-why-grid"
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={viewport}
        >
          {mobileSteps.map(({ step, title, description, icon: Icon }) => (
            <motion.article className="hx-why-card" key={step} variants={cardReveal}>
              <div className="hx-why-top">
                <span className="hx-why-icon">
                  <Icon size={22} weight="fill" />
                </span>
                <strong className="hx-why-step">{step}</strong>
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="hx-faq-item">
      <button
        className="hx-faq-head"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{q}</span>
        <CaretDown className={open ? 'is-open' : ''} size={18} weight="bold" />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="hx-faq-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Styles() {
  return (
    <style>{`
      .hx-page {
        --bg: #fbfaf6;
        --panel: #ffffff;
        --panel-2: #f3f0e8;
        --blue: #020308;
        --cream: #ffffff;
        --text: #020308;
        --muted: rgba(2,3,8,0.8);
        --muted-2: rgba(2,3,8,0.6);
        --line: rgba(2,3,8,0.18);
        min-height: 100vh;
        background: var(--bg);
        color: var(--muted);
        font-family: var(--font-sans);
        font-size: 16px;
        letter-spacing: 0;
        overflow-x: clip;
        overflow-y: visible;
      }

      html { scroll-behavior: smooth; }
      .hx-page *, .hx-page *::before, .hx-page *::after { box-sizing: border-box; }
      .hx-page a { color: inherit; text-decoration: none; }
      .hx-page button { font: inherit; }
      .hx-title, .hx-section-title, .hx-feature-body h3, .hx-blog-card h3 { overflow-wrap: anywhere; }
      .hx-container { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 40px; }

      .hx-header { position: absolute; z-index: 20; inset: 0 0 auto; pointer-events: none; }
      .hx-nav-shell {
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 0;
        background: transparent;
        position: relative;
        overflow: visible;
      }
      .hx-nav-shell::before { display: none; }
      .hx-logo { display: flex; align-items: center; gap: 10px; min-width: 162px; color: #ffffff; font-weight: 800; text-shadow: 0 2px 18px rgba(0,0,0,0.72); }
      .hx-logo-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: rgba(0,0,0,0.38); color: #ffffff; border: 1px solid rgba(255,255,255,0.64); box-shadow: 0 8px 24px rgba(0,0,0,0.22); overflow: hidden; }
      .hx-logo-mark img { width: 25px; height: 22px; object-fit: contain; display: block; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18)); }
      .hx-nav-links { display: flex; align-items: center; justify-content: center; gap: 8px; }
      .hx-nav-actions { display: flex; align-items: center; gap: 8px; }
      .hx-menu-link { display: inline-flex; align-items: center; gap: 8px; min-height: 38px; padding: 5px 7px 5px 15px; border-radius: 999px; background: rgba(2,3,8,0.72); color: #ffffff; font-size: 13px; line-height: 1; font-weight: 800; text-shadow: none; box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px rgba(0,0,0,0.16); transition: transform 0.24s ease, background 0.24s ease; }
      .hx-menu-link span { color: #ffffff; }
      .hx-menu-link svg { width: 28px; height: 28px; padding: 7px; border-radius: 50%; background: rgba(255,255,255,0.14); color: #ffffff; transition: transform 0.24s ease, background 0.24s ease; }
      .hx-menu-link:hover, .hx-menu-link:focus-visible { color: #ffffff; background: #020308; transform: translateY(-1px); }
      .hx-menu-link:hover svg, .hx-menu-link:focus-visible svg { background: rgba(255,255,255,0.2); transform: translate(1px, -1px); }
      .hx-mobile-toggle { display: none; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #202527; color: #ffffff; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); cursor: pointer; }
      .hx-mobile-toggle svg { color: #ffffff; }
      .hx-mobile-menu { position: absolute; left: 24px; right: 24px; top: calc(100% + 8px); display: grid; gap: 6px; padding: 10px; border: 1px solid rgba(255,255,255,0.22); border-radius: 18px; background: rgba(32,37,39,0.96); box-shadow: 0 22px 60px rgba(0,0,0,0.22); backdrop-filter: blur(18px); }
      .hx-mobile-menu a { display: flex; align-items: center; justify-content: space-between; min-height: 44px; padding: 0 14px; border-radius: 12px; color: #ffffff; font-size: 14px; font-weight: 800; }
      .hx-mobile-menu a:hover { background: rgba(255,255,255,0.1); color: #ffffff; }

      .hx-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 50px;
        color: #ffffff;
        font-size: 14px;
        line-height: 1;
        font-weight: 800;
        text-transform: uppercase;
        white-space: nowrap;
        transition: transform 0.28s ease, filter 0.28s ease;
      }
      .hx-button:hover, .hx-button:focus-visible { transform: translateY(-2px); filter: drop-shadow(0 12px 22px rgba(0,0,0,0.18)); }
      .hx-button-label { display: inline-flex; align-items: center; min-height: 50px; padding: 0 22px; border-radius: 999px; background: #202527; color: #ffffff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); }
      .hx-button-icon { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 50%; background: #202527; color: #ffffff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); }
      .hx-button-icon svg { transition: transform 0.24s ease; }
      .hx-button:hover .hx-button-icon svg, .hx-button:focus-visible .hx-button-icon svg { transform: translate(2px, -2px); }
      .hx-button--secondary .hx-button-label, .hx-button--secondary .hx-button-icon { background: rgba(2,3,8,0.78); }

      .hx-hero { position: relative; z-index: 100; padding-top: 148px; }
      .hx-hero::after { content: ''; position: absolute; left: 0; right: 0; bottom: -1px; height: 220px; z-index: -1; pointer-events: none; background: none; }
      .hx-hero-bg { position: absolute; inset: 0 0 -120px; z-index: -2; pointer-events: none; overflow: hidden; background-image: linear-gradient(180deg, rgba(0,0,0,0.68), rgba(0,0,0,0.58)), linear-gradient(180deg, rgba(251,250,246,0.05) 0%, rgba(251,250,246,0.05) 42%, rgba(251,250,246,0.05) 100%), linear-gradient(90deg, rgba(251,250,246,0.05) 0%, rgba(251,250,246,0.02) 36%, rgba(251,250,246,0.05) 100%), url('/landing-v1/hero-2.jpg'); background-size: cover; background-position: center 34%; background-repeat: no-repeat; background-attachment: fixed, fixed, fixed, fixed; }
      .hx-hero-bg::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 22%, rgba(255,255,255,0.05), transparent 44%); }
      .hx-hero-bg::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(2,3,8,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(2,3,8,0.055) 1px, transparent 1px); background-size: 54px 54px; mask-image: linear-gradient(180deg, black 0%, black 54%, transparent 92%); }
      .hx-hero-overview { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 18px; }
      .hx-title { margin: 28px 0 8px; font-family: var(--font-sans); color: #ffffff; font-size: clamp(58px, 7.2vw, 96px); line-height: 1.02; font-weight: 900; letter-spacing: 0; text-shadow: 0 4px 30px rgba(0,0,0,0.48); }
      .hx-gradient-text { background: linear-gradient(270deg, #020308, #020308 63%, #020308); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      .hx-hero .hx-gradient-text { background: none; -webkit-background-clip: initial; background-clip: initial; -webkit-text-fill-color: currentColor; color: inherit; }
      .hx-hero p { max-width: 740px; margin: 0; font-family: var(--font-sans); font-size: clamp(18px, 1.65vw, 24px); line-height: 1.48; color: #ffffff; text-shadow: 0 2px 4px rgba(0,0,0,0.72), 0 10px 28px rgba(0,0,0,0.58); }
      .hx-hero-button { margin-top: 28px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
      .hx-free-note { margin-top: -6px !important; font-size: 14px !important; font-weight: 700; line-height: 1.4 !important; color: rgba(255,255,255,0.86) !important; }

      .hx-hero-card { width: 100%; max-width: 760px; margin: 64px auto 0; padding: 12px; border-radius: 24px; background: rgba(255,255,255,0.72); border: 1px solid rgba(2,3,8,0.18); backdrop-filter: blur(50px); display: flex; flex-direction: column; outline: none; transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease; animation: hx-layer-float 7s ease-in-out infinite; }
      .hx-hero-card:hover, .hx-hero-card:focus-visible { animation: none; transform: translateY(-6px); border-color: rgba(2,3,8,0.32); box-shadow: 0 28px 80px rgba(0,0,0,0.22); }
      .hx-hero-card-image { position: relative; height: 180px; border: 1px solid rgba(2,3,8,0.32); border-radius: 16px; background: radial-gradient(circle at 50% 100%, rgba(255,255,255,0.92), transparent 16%), radial-gradient(circle at 50% 50%, rgba(2,3,8,0.08), rgba(255,255,255,0.85) 60%, #f7f5ef), linear-gradient(135deg, #ffffff, #ebe7dc); overflow: hidden; }
      .hx-hero-card-image::before { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.55) 46%, transparent 58%); transform: translateX(-120%); opacity: 0; transition: opacity 0.2s ease; }
      .hx-hero-card:hover .hx-hero-card-image::before, .hx-hero-card:focus-visible .hx-hero-card-image::before { opacity: 1; animation: hx-demo-sweep 1.35s ease; }
      .hx-orbit { position: absolute; left: 50%; top: 78%; border: 1px solid rgba(2,3,8,0.2); border-radius: 50%; transform: translate(-50%, -50%); animation: hx-demo-orbit 18s linear infinite; }
      .hx-orbit::after { content: ''; position: absolute; left: 50%; top: -4px; width: 8px; height: 8px; border-radius: 50%; background: #020308; box-shadow: 0 0 18px rgba(2,3,8,0.38); transform: translateX(-50%); }
      .hx-orbit-one { width: 180px; height: 180px; }
      .hx-orbit-two { width: 340px; height: 340px; animation-duration: 24s; animation-direction: reverse; }
      .hx-orbit-three { width: 520px; height: 520px; animation-duration: 32s; }
      .hx-core { position: absolute; left: 50%; bottom: 22px; display: grid; place-items: center; width: 46px; height: 46px; border: 1px solid rgba(2,3,8,0.34); border-radius: 50%; background: #202527; color: #ffffff; transform: translateX(-50%); box-shadow: 0 0 46px rgba(2,3,8,0.12); animation: hx-demo-core 2.4s ease-in-out infinite; }
      .hx-core img { width: 32px; height: 24px; object-fit: contain; display: block; }
      .hx-demo-flow { position: absolute; left: 50%; top: 20px; transform: translateX(-50%); display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid rgba(2,3,8,0.16); border-radius: 999px; background: rgba(255,255,255,0.74); backdrop-filter: blur(10px); color: #020308; font-family: var(--font-sans); font-size: 11px; white-space: nowrap; }
      .hx-demo-flow span { color: #020308; opacity: 0.58; animation: hx-demo-step 3.6s ease-in-out infinite; }
      .hx-demo-flow span:nth-of-type(2) { animation-delay: 1.2s; }
      .hx-demo-flow span:nth-of-type(3) { animation-delay: 2.4s; }
      .hx-demo-flow i { position: relative; width: 28px; height: 1px; background: rgba(2,3,8,0.18); overflow: hidden; }
      .hx-demo-flow i::after { content: ''; position: absolute; inset: 0; width: 60%; background: #020308; animation: hx-demo-line 1.8s ease-in-out infinite; }
      .hx-chat-preview { position: absolute; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid rgba(2,3,8,0.2); border-radius: 10px; background: rgba(255,255,255,0.82); backdrop-filter: blur(8px); transition: transform 0.35s ease, border-color 0.35s ease, background 0.35s ease; animation: hx-demo-float 4.8s ease-in-out infinite; }
      .hx-chat-preview::after { content: ''; position: absolute; right: 10px; top: 10px; width: 6px; height: 6px; border-radius: 50%; background: #020308; box-shadow: 10px 0 0 rgba(2,3,8,0.38), 20px 0 0 rgba(2,3,8,0.18); opacity: 0; transition: opacity 0.25s ease; }
      .hx-hero-card:hover .hx-chat-preview, .hx-hero-card:focus-visible .hx-chat-preview { border-color: rgba(2,3,8,0.34); background: rgba(255,255,255,0.94); }
      .hx-hero-card:hover .hx-chat-preview::after, .hx-hero-card:focus-visible .hx-chat-preview::after { opacity: 1; animation: hx-demo-typing 1.1s steps(3, end) infinite; }
      .hx-chat-preview span { color: rgba(2,3,8,0.55); font-size: 11px; letter-spacing: 0; }
      .hx-chat-preview strong { color: var(--text); font-size: 13px; font-weight: 500; }
      .hx-chat-left { left: 32px; top: 34px; }
      .hx-chat-right { right: 30px; bottom: 34px; animation-delay: 1.1s; }
      @keyframes hx-demo-orbit { to { transform: translate(-50%, -50%) rotate(360deg); } }
      @keyframes hx-demo-core { 0%, 100% { box-shadow: 0 0 34px rgba(2,3,8,0.12); } 50% { box-shadow: 0 0 58px rgba(2,3,8,0.26); } }
      @keyframes hx-demo-step { 0%, 66%, 100% { opacity: 0.48; } 16%, 42% { opacity: 1; } }
      @keyframes hx-demo-line { 0% { transform: translateX(-120%); } 100% { transform: translateX(180%); } }
      @keyframes hx-demo-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      @keyframes hx-demo-typing { 50% { opacity: 0.35; } }
      @keyframes hx-demo-sweep { to { transform: translateX(120%); } }
      @keyframes hx-layer-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

      .hx-brand-marquee { max-width: 800px; margin: 60px auto 0; overflow: hidden; mask-image: linear-gradient(to right, transparent 0%, black 15% 85%, transparent 100%); }
      .hx-brand-track { display: flex; gap: 52px; align-items: center; width: max-content; animation: hx-marquee 22s linear infinite; }
      .hx-brand-row { display: flex; gap: 52px; flex: none; align-items: center; }
      .hx-brand-logo { color: #ffffff; font-family: var(--font-sans); font-size: 15px; white-space: nowrap; text-shadow: 0 2px 16px rgba(0,0,0,0.52); }
      @keyframes hx-marquee { to { transform: translateX(-50%); } }

      .hx-section { position: relative; z-index: 150; padding-top: 60px; background: var(--bg); }
      .hx-section::before { content: ''; position: absolute; left: 50%; top: 42px; width: min(760px, 80vw); height: 260px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, rgba(2,3,8,0.045), transparent 68%); pointer-events: none; }
      .hx-section-pad-bottom { padding-bottom: 130px; }
      .hx-section-details { max-width: 636px; margin: 0 auto 52px; text-align: center; display: flex; flex-direction: column; gap: 16px; }
      .hx-section-title { margin: 0; font-family: var(--font-sans); font-size: clamp(28px, 3.4vw, 32px); line-height: 140%; font-weight: 700; letter-spacing: 0; color: var(--text); }
      .hx-section-para { max-width: 422px; margin: 0 auto; line-height: 160%; color: var(--muted); }

      .hx-feature-wrap { display: flex; flex-direction: column; gap: 16px; }
      .hx-feature-grid { display: grid; grid-template-columns: 1fr 1.35fr; gap: 16px; }
      .hx-feature-grid:nth-child(even) { grid-template-columns: 1.35fr 1fr; }
      .hx-feature-card { padding: 8px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,0.72); display: flex; flex-direction: column; gap: 12px; overflow: hidden; outline: none; transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease; }
      .hx-feature-card:hover, .hx-feature-card:focus-visible { animation: none; transform: translateY(-5px); border-color: rgba(2,3,8,0.32); box-shadow: 0 24px 70px rgba(2,3,8,0.12); }
      .hx-feature-visual { min-height: 260px; border-radius: 12px; position: relative; overflow: hidden; background: radial-gradient(circle at 50% 40%, rgba(2,3,8,0.08), transparent 62%), #f3f0e8; }
      .hx-visual-integrations { --orbit-radius: 134px; }
      .hx-feature-visual::before { content: ''; position: absolute; inset: 0; background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.5) 46%, transparent 58%); transform: translateX(-120%); opacity: 0; pointer-events: none; }
      .hx-feature-card:hover .hx-feature-visual::before, .hx-feature-card:focus-visible .hx-feature-visual::before { opacity: 1; animation: hx-feature-sweep 1.25s ease; }
      .hx-feature-body { max-width: 420px; padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }
      .hx-feature-body h3 { margin: 0; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 600; }
      .hx-feature-body p { margin: 0; color: rgba(2,3,8,0.7); font-size: 14px; line-height: 160%; }
      .hx-hex { position: absolute; display: grid; place-items: center; width: 98px; height: 86px; color: #020308; background: rgba(255,255,255,0.76); clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); box-shadow: inset 0 0 60px rgba(2,3,8,0.08); animation: hx-feature-pulse 3.8s ease-in-out infinite; transition: box-shadow 0.35s ease, background 0.35s ease, transform 0.35s ease; }
      .hx-visual-integrations .hx-hex { left: 50%; top: 50%; right: auto; bottom: auto; margin-left: -49px; margin-top: -43px; animation: hx-feature-orbit 10s linear infinite; transform-origin: 49px 43px; }
      .hx-visual-integrations .hx-hex svg { animation: hx-feature-icon-spin 10s linear infinite; }
      .hx-hex-1 { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      .hx-hex-2 { left: 28%; top: 28%; }
      .hx-hex-3 { right: 22%; top: 22%; }
      .hx-hex-4 { left: 24%; bottom: 16%; }
      .hx-hex-5 { right: 25%; bottom: 18%; }
      .hx-visual-integrations .hx-hex-1 { --orbit-angle: 0deg; transform: rotate(0deg) translateX(0); animation: hx-feature-center-pulse 3.8s ease-in-out infinite; }
      .hx-visual-integrations .hx-hex-1 svg { animation: none; }
      .hx-visual-integrations .hx-hex-2 { --orbit-angle: 0deg; transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)); }
      .hx-visual-integrations .hx-hex-3 { --orbit-angle: 90deg; transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)); }
      .hx-visual-integrations .hx-hex-4 { --orbit-angle: 180deg; transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)); }
      .hx-visual-integrations .hx-hex-5 { --orbit-angle: 270deg; transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)); }
      .hx-feature-card:hover .hx-hex, .hx-feature-card:focus-visible .hx-hex { background: rgba(255,255,255,0.94); box-shadow: inset 0 0 60px rgba(2,3,8,0.12), 0 16px 40px rgba(2,3,8,0.14); }
      .hx-feature-card:hover .hx-hex-1, .hx-feature-card:focus-visible .hx-hex-1 { transform: translate(-50%, -50%) scale(1.08); }
      .hx-feature-card:hover .hx-visual-integrations .hx-hex-1, .hx-feature-card:focus-visible .hx-visual-integrations .hx-hex-1 { transform: rotate(0deg) translateX(0) scale(1.08); }
      .hx-feature-card:hover .hx-visual-integrations .hx-hex, .hx-feature-card:focus-visible .hx-visual-integrations .hx-hex { animation-duration: 6s; }
      .hx-feature-card:hover .hx-visual-integrations .hx-hex svg, .hx-feature-card:focus-visible .hx-visual-integrations .hx-hex svg { animation-duration: 6s; }
      .hx-mini-message { position: absolute; width: 64%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,0.86); color: var(--text); font-size: 13px; line-height: 145%; overflow: hidden; animation: hx-feature-message 4.6s ease-in-out infinite; transition: transform 0.35s ease, border-color 0.35s ease, background 0.35s ease; }
      .hx-mini-one { left: 28px; top: 46px; }
      .hx-mini-two { right: 28px; top: 112px; background: rgba(2,3,8,0.06); animation-delay: 1.15s; }
      .hx-feature-card:hover .hx-mini-message, .hx-feature-card:focus-visible .hx-mini-message { border-color: rgba(2,3,8,0.32); background: rgba(255,255,255,0.96); transform: translateY(-5px); }
      .hx-mini-action { position: absolute; left: 50%; bottom: 42px; transform: translateX(-50%); padding: 8px 14px; border-radius: 200px; background: rgba(255,255,255,0.82); color: var(--text); font-family: var(--font-sans); font-size: 12px; animation: hx-feature-action 2.8s ease-in-out infinite; }
      .hx-mini-action span { color: #020308; animation: hx-chat-action 7.2s ease-in-out infinite; }
      .hx-type-line { display: block; width: max-content; max-width: 0; overflow: hidden; white-space: nowrap; border-right: 1px solid #020308; color: #020308; }
      .hx-type-user { animation: hx-type-user 7.2s steps(33, end) infinite; }
      .hx-type-lira { animation: hx-type-lira 7.2s steps(49, end) infinite; }
      .hx-visual-global { display: grid; place-items: center; color: rgba(2,3,8,0.72); }
      .hx-visual-global svg { animation: hx-feature-globe 9s linear infinite; transform-origin: center; }
      .hx-visual-global span { position: absolute; padding: 6px 10px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,0.82); font-family: var(--font-sans); font-size: 12px; animation: hx-feature-badge 3.4s ease-in-out infinite; transition: border-color 0.35s ease, background 0.35s ease, transform 0.35s ease; }
      .hx-visual-global span:nth-of-type(1) { left: 22%; top: 28%; }
      .hx-visual-global span:nth-of-type(2) { right: 20%; top: 34%; }
      .hx-visual-global span:nth-of-type(3) { left: 28%; bottom: 22%; }
      .hx-visual-global span:nth-of-type(4) { right: 27%; bottom: 18%; }
      .hx-feature-card:hover .hx-visual-global span, .hx-feature-card:focus-visible .hx-visual-global span { background: rgba(255,255,255,0.96); border-color: rgba(2,3,8,0.32); transform: translateY(-4px); }
      .hx-visual-voice { display: block; color: #020308; }
      .hx-voice-note { position: absolute; width: 62%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,0.88); backdrop-filter: blur(10px); animation: hx-feature-message 4.6s ease-in-out infinite; transition: transform 0.35s ease, border-color 0.35s ease, background 0.35s ease; }
      .hx-voice-note span { display: block; margin-bottom: 8px; color: rgba(2,3,8,0.56); font-size: 11px; line-height: 140%; }
      .hx-voice-row { display: grid; grid-template-columns: 18px 18px 1fr auto; gap: 8px; align-items: center; color: #020308; }
      .hx-voice-row strong { color: #020308; font-size: 12px; font-weight: 600; }
      .hx-voice-logo { width: 18px; height: 14px; object-fit: contain; padding: 3px; border-radius: 50%; background: #202527; }
      .hx-voice-play { position: relative; width: 18px; height: 18px; padding: 0; border: 0; border-radius: 50%; background: #202527; }
      .hx-voice-play::after { content: ''; position: absolute; left: 7px; top: 5px; border-left: 6px solid #ffffff; border-top: 4px solid transparent; border-bottom: 4px solid transparent; }
      .hx-voice-user { left: 28px; top: 46px; }
      .hx-voice-lira { right: 28px; top: 124px; background: rgba(2,3,8,0.06); animation-delay: 1.15s; }
      .hx-feature-card:hover .hx-voice-note, .hx-feature-card:focus-visible .hx-voice-note { border-color: rgba(2,3,8,0.32); background: rgba(255,255,255,0.96); transform: translateY(-5px); }
      .hx-voice-wave { display: flex; align-items: center; gap: 3px; height: 22px; overflow: hidden; }
      .hx-voice-wave i { flex: 1; min-width: 3px; height: 3px; border-radius: 999px; background: rgba(2,3,8,0.36); transform-origin: center; animation: hx-feature-voice-wave 1.6s ease-in-out infinite; }
      .hx-voice-wave i:nth-child(2n) { background: rgba(2,3,8,0.58); animation-delay: 0.1s; }
      .hx-voice-wave i:nth-child(3n) { transform: scaleY(2); animation-delay: 0.2s; }
      .hx-voice-wave i:nth-child(4n) { transform: scaleY(1.5); animation-delay: 0.3s; }
      .hx-voice-status { position: absolute; left: 50%; bottom: 42px; transform: translateX(-50%); padding: 8px 14px; border-radius: 200px; background: rgba(255,255,255,0.84); color: #020308; font-family: var(--font-sans); font-size: 12px; animation: hx-feature-action 2.8s ease-in-out infinite; }
      .hx-visual-setup { display: flex; flex-direction: column; justify-content: center; gap: 10px; padding: 22px; }
      .hx-setup-toolbar { display: flex; align-items: center; gap: 6px; padding: 11px 12px; border: 1px solid rgba(2,3,8,0.16); border-radius: 12px 12px 6px 6px; background: rgba(255,255,255,0.74); }
      .hx-setup-toolbar span { width: 8px; height: 8px; border-radius: 50%; background: rgba(2,3,8,0.28); }
      .hx-setup-toolbar strong { margin-left: auto; color: rgba(2,3,8,0.62); font-family: var(--font-sans); font-size: 11px; font-weight: 500; }
      .hx-visual-setup pre { margin: 0; padding: 18px; border: 1px solid rgba(2,3,8,0.18); border-radius: 6px 6px 14px 14px; background: #202527; color: #d9f99d; font-family: var(--font-mono); font-size: 11px; line-height: 1.75; white-space: pre-wrap; box-shadow: inset 0 1px 0 rgba(255,255,255,0.08); }
      .hx-setup-status { align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; padding: 8px 11px; border-radius: 999px; background: rgba(255,255,255,0.78); color: #020308; font-size: 12px; font-weight: 700; animation: hx-feature-action 2.8s ease-in-out infinite; }
      .hx-setup-section { position: relative; z-index: 150; padding: 96px 0 20px; background: var(--bg); }
      .hx-setup-card { position: relative; padding: 8px; border: 1px solid var(--line); border-radius: 18px; background: rgba(255,255,255,0.72); overflow: hidden; max-width: 100%; }
      .hx-setup-card::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 18% 8%, rgba(2,3,8,0.06), transparent 32%), radial-gradient(circle at 90% 78%, rgba(2,3,8,0.05), transparent 34%); pointer-events: none; }
      .hx-setup-copy { position: relative; z-index: 1; max-width: none; margin: 0; padding: 36px 36px 28px; border: 1px solid rgba(2,3,8,0.08); border-radius: 12px 12px 0 0; background: rgba(255,255,255,0.58); text-align: left; align-items: flex-start; }
      .hx-setup-copy .hx-section-title { max-width: 640px; }
      .hx-setup-journey { position: relative; z-index: 1; display: grid; grid-template-columns: 0.88fr 1.12fr; gap: 12px; align-items: stretch; padding: 0 36px 36px; }
      .hx-setup-steps { display: grid; gap: 10px; }
      .hx-setup-step { width: 100%; min-height: 112px; padding: 18px; border: 1px solid var(--line); border-radius: 12px; background: rgba(243,240,232,0.82); color: #020308; text-align: left; cursor: pointer; transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease; }
      .hx-setup-step:hover, .hx-setup-step.is-active { transform: translateX(4px); border-color: rgba(2,3,8,0.36); background: #ffffff; box-shadow: 0 18px 42px rgba(2,3,8,0.08); }
      .hx-setup-step strong { display: grid; place-items: center; width: 34px; height: 34px; margin-bottom: 12px; border-radius: 50%; background: #202527; color: #ffffff; font-size: 11px; font-weight: 800; }
      .hx-setup-step span { display: block; color: #020308; font-size: 16px; font-weight: 800; }
      .hx-setup-step small { display: block; max-width: 360px; margin-top: 7px; color: rgba(2,3,8,0.62); font-size: 13px; line-height: 155%; }
      .hx-setup-demo { display: flex; flex-direction: column; justify-content: center; min-height: 100%; padding: 14px; border: 1px solid rgba(2,3,8,0.14); border-radius: 14px; background: #f3f0e8; }
      .hx-setup-demo pre { margin: 0; padding: 26px; border: 1px solid rgba(2,3,8,0.18); border-radius: 6px 6px 14px 14px; background: #202527; color: #d9f99d; font-family: var(--font-mono); font-size: 12px; line-height: 1.8; white-space: pre-wrap; overflow-wrap: anywhere; max-width: 100%; overflow-x: hidden; }
      .hx-setup-note { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center; margin-top: 12px; padding: 14px; border-radius: 12px; background: rgba(255,255,255,0.78); }
      .hx-setup-note strong { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #202527; color: #ffffff; font-size: 11px; }
      .hx-setup-note span { color: rgba(2,3,8,0.68); font-size: 13px; line-height: 150%; }
      .hx-why-section { padding-top: 84px; }
      .hx-why-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
      .hx-why-card { display: flex; flex-direction: column; gap: 14px; min-height: 100%; padding: 22px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,0.76); transition: transform 0.32s ease, border-color 0.32s ease, box-shadow 0.32s ease; }
      .hx-why-card:hover { animation: none; transform: translateY(-5px); border-color: rgba(2,3,8,0.3); box-shadow: 0 24px 70px rgba(2,3,8,0.1); }
      .hx-why-top { display: flex; align-items: center; gap: 14px; }
      .hx-why-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: #202527; color: #ffffff; }
      .hx-why-icon svg { color: #ffffff; }
      .hx-why-card h3 { margin: 0; color: var(--text); font-size: 16px; line-height: 150%; font-weight: 700; }
      .hx-why-card p { margin: 0; color: rgba(2,3,8,0.68); font-size: 13px; line-height: 160%; }
      .hx-why-step { flex: 1; text-align: right; font-family: var(--font-mono, monospace); font-size: 13px; font-weight: 600; color: rgba(2,3,8,0.48); letter-spacing: -0.02em; }
      @keyframes hx-feature-sweep { to { transform: translateX(120%); } }
      @keyframes hx-feature-pulse { 0%, 100% { opacity: 0.72; } 50% { opacity: 1; } }
      @keyframes hx-feature-center-pulse { 0%, 100% { opacity: 0.72; transform: rotate(0deg) translateX(0); } 50% { opacity: 1; transform: rotate(0deg) translateX(0) scale(1.06); } }
      @keyframes hx-feature-orbit { from { transform: rotate(var(--orbit-angle)) translateX(var(--orbit-radius)); } to { transform: rotate(calc(var(--orbit-angle) + 360deg)) translateX(var(--orbit-radius)); } }
      @keyframes hx-feature-icon-spin { to { transform: rotate(-360deg); } }
      @keyframes hx-feature-message { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      @keyframes hx-feature-action { 0%, 100% { box-shadow: 0 0 0 rgba(2,3,8,0); } 50% { box-shadow: 0 14px 34px rgba(2,3,8,0.16); } }
      @keyframes hx-type-user { 0% { max-width: 0; } 24%, 88% { max-width: 33ch; } 96%, 100% { max-width: 0; } }
      @keyframes hx-type-lira { 0%, 30% { max-width: 0; opacity: 0; } 32% { opacity: 1; } 66%, 88% { max-width: 49ch; opacity: 1; } 96%, 100% { max-width: 0; opacity: 0; } }
      @keyframes hx-chat-action { 0%, 62% { opacity: 0.36; } 70%, 92% { opacity: 1; } 100% { opacity: 0.36; } }
      @keyframes hx-feature-globe { to { transform: rotate(360deg); } }
      @keyframes hx-feature-badge { 0%, 100% { opacity: 0.68; } 50% { opacity: 1; } }
      @keyframes hx-feature-voice-wave { 0%, 100% { transform: scaleY(1); opacity: 0.58; } 50% { transform: scaleY(2.4); opacity: 1; } }

      .hx-service-grid { padding: 40px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
      .hx-service-list { display: flex; flex-direction: column; gap: 8px; }
      .hx-service-item { display: grid; grid-template-columns: 36px 1px 1fr; gap: 24px; align-items: start; padding: 16px 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel-2); transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
      .hx-service-item:hover { animation: none; transform: translateX(6px); border-color: rgba(2,3,8,0.28); box-shadow: 0 18px 48px rgba(2,3,8,0.08); }
      .hx-service-icon { display: grid; place-items: center; width: 36px; height: 36px; color: #020308; }
      .hx-service-vr { width: 1px; height: 100%; min-height: 56px; background: linear-gradient(180deg, transparent, rgba(2,3,8,0.35), transparent); }
      .hx-service-item h3 { margin: 0 0 2px; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 600; }
      .hx-service-item p { margin: 0; color: rgba(2,3,8,0.62); font-size: 14px; line-height: 160%; }

      .hx-testimonial { position: relative; padding-top: 130px; padding-bottom: 120px; }
      .hx-testimonial::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 58%, rgba(2,3,8,0.08), transparent 55%); }
      .hx-testimonial-card { max-width: 760px; margin: 52px auto 0; padding: 52px; border: 1px solid var(--line); border-radius: 24px; background: var(--panel); text-align: center; overflow: hidden; transition: transform 0.35s ease, box-shadow 0.35s ease; }
      .hx-testimonial-card:hover { animation: none; transform: translateY(-4px); box-shadow: 0 24px 70px rgba(2,3,8,0.1); }
      .hx-stars { display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; color: var(--blue); }
      .hx-testimonial-card blockquote { max-width: 585px; margin: 0 auto; color: var(--text); font-family: var(--font-sans); font-size: 22px; line-height: 140%; letter-spacing: 0; }
      .hx-author { margin-top: 64px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; }
      .hx-avatar-row { display: flex; justify-content: center; margin-top: 24px; }
      .hx-avatar { width: 44px; height: 44px; margin-left: -10px; border: 2px solid var(--panel); border-radius: 50%; background: linear-gradient(135deg, #ffffff, #e7e1d5); display: grid; place-items: center; color: #020308; font-weight: 700; }
      .hx-author strong { color: var(--text); font-weight: 500; }
      .hx-author span { color: rgba(2,3,8,0.62); font-size: 14px; }

      .hx-faq-section { padding: 80px 0; background: radial-gradient(circle at 50% 50%, rgba(2,3,8,0.06), transparent 55%); }
      .hx-faq-grid { display: grid; grid-template-columns: 1fr 1.8fr; gap: 100px; align-items: start; }
      .hx-faq-left { position: sticky; top: 14vh; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
      .hx-faq-list { display: flex; flex-direction: column; gap: 8px; }
      .hx-faq-item { border-radius: 12px; background: var(--panel-2); overflow: hidden; }
      .hx-faq-head { width: 100%; padding: 24px; border: none; background: transparent; color: var(--text); display: flex; align-items: center; justify-content: space-between; gap: 24px; text-align: left; cursor: pointer; }
      .hx-faq-head span { font-size: 16px; line-height: 150%; font-weight: 500; }
      .hx-faq-head svg { transition: transform 0.2s ease; flex: none; }
      .hx-faq-head svg.is-open { transform: rotate(180deg); }
      .hx-faq-body { overflow: hidden; }
      .hx-faq-body p { margin: 0; padding: 0 24px 24px; color: rgba(2,3,8,0.64); line-height: 160%; }

      .hx-blog-grid { display: grid; grid-template-columns: 1fr 2.5fr; gap: 80px; }
      .hx-blog-left { position: sticky; top: 14vh; display: flex; flex-direction: column; gap: 24px; align-items: flex-start; }
      .hx-blog-list { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .hx-blog-card { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; padding: 8px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); overflow: hidden; transition: transform 0.32s ease, box-shadow 0.32s ease, border-color 0.32s ease; }
      .hx-blog-card:hover { animation: none; transform: translateY(-5px); border-color: rgba(2,3,8,0.28); box-shadow: 0 24px 70px rgba(2,3,8,0.1); }
      .hx-blog-thumb { aspect-ratio: 320 / 156; border-radius: 12px; background: radial-gradient(circle at 50% 45%, rgba(2,3,8,0.08), transparent 90%), linear-gradient(135deg, #ffffff, #ebe7dc); display: grid; place-items: center; color: rgba(2,3,8,0.6); }
      .hx-blog-body { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
      .hx-blog-date { opacity: 0.7; color: var(--text); font-size: 12px; }
      .hx-blog-card h3 { max-width: 274px; margin: 0; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 500; }

      .hx-cta { position: relative; padding-top: 130px; padding-bottom: 110px; text-align: center; }
      .hx-cta,
      .hx-footer { background: var(--bg); isolation: isolate; }
      .hx-cta::before,
      .hx-footer::before { display: none; }
      .hx-cta-icon { width: 64px; height: 64px; margin: 0 auto 8px; display: grid; place-items: center; border-radius: 50%; background: #202527; color: #ffffff; }
      .hx-cta-icon img { width: 42px; height: 32px; object-fit: contain; }
      .hx-cta h2 { margin-bottom: 8px; }
      .hx-cta p { max-width: 400px; margin: 8px auto 24px; line-height: 150%; }
      .hx-footer { position: relative; z-index: 100; padding: 42px 0; border-top: 1px solid var(--line); }
      .hx-footer-top { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; }
      .hx-footer-left { padding: 0; border: 0; border-radius: 0; background: transparent; backdrop-filter: none; }
      .hx-footer-left p { max-width: 360px; margin: 14px 0 0; line-height: 150%; color: rgba(2,3,8,0.62); }
      .hx-social-links { display: flex; align-items: center; gap: 10px; margin-top: 24px; }
      .hx-social-links a { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #202527; color: #ffffff; opacity: 1; transition: transform 0.24s ease, background 0.24s ease; }
      .hx-social-links a:hover, .hx-social-links a:focus-visible { transform: translateY(-2px); background: #020308; color: #ffffff; }
      .hx-social-links svg { color: #ffffff; }
      .hx-footer-menu-inner { display: flex; justify-content: flex-end; gap: 56px; }
      .hx-footer-menu { display: flex; flex-direction: column; gap: 16px; }
      .hx-footer-menu h4 { margin: 0; color: var(--text); font-size: 18px; line-height: 160%; font-weight: 600; }
      .hx-footer-menu a { width: fit-content; opacity: 0.7; color: var(--text); font-size: 14px; line-height: 160%; }
      .hx-footer-menu a:hover { opacity: 1; }
      .hx-footer-bottom { margin-top: 34px; display: flex; justify-content: space-between; gap: 32px; color: rgba(2,3,8,0.6); font-size: 14px; }

      .hx-section :where(h2,h3,h4,p,span,strong,li,a,button,blockquote,div),
      .hx-testimonial :where(h2,h3,h4,p,span,strong,li,a,button,blockquote,div),
      .hx-faq-section :where(h2,h3,h4,p,span,strong,li,a,button,blockquote,div),
      .hx-cta :where(h2,h3,h4,p,span,strong,li,a,button,blockquote,div),
      .hx-footer :where(h2,h3,h4,p,span,strong,li,a,button,blockquote,div) { color: #020308; }
      .hx-section .hx-button,
      .hx-section .hx-button-label,
      .hx-section .hx-button-icon,
      .hx-section .hx-button-icon svg,
      .hx-faq-section .hx-button,
      .hx-faq-section .hx-button-label,
      .hx-faq-section .hx-button-icon,
      .hx-faq-section .hx-button-icon svg,
      .hx-cta .hx-button,
      .hx-cta .hx-button-label,
      .hx-cta .hx-button-icon,
      .hx-cta .hx-button-icon svg,
      .hx-header .hx-button,
      .hx-header .hx-button-label,
      .hx-header .hx-button-icon,
      .hx-header .hx-button-icon svg,
      .hx-header .hx-menu-link,
      .hx-header .hx-menu-link span,
      .hx-header .hx-menu-link svg { color: #ffffff; }
      @keyframes hx-scroll-reveal { from { opacity: 0; transform: translateY(46px) scale(0.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes hx-image-reveal { from { opacity: 0; transform: translateY(18px) scale(1.04); } to { opacity: 1; transform: translateY(0) scale(1); } }

      @supports (animation-timeline: view()) {
        .hx-section-details,
        .hx-feature-card,
        .hx-service-item,
        .hx-testimonial-card,
        .hx-faq-item,
        .hx-blog-card,
        .hx-cta .hx-container,
        .hx-footer-left,
        .hx-footer-menu-inner,
        .hx-footer-bottom { animation: hx-scroll-reveal both; animation-timeline: view(); animation-range: entry 0% cover 30%; }

        .hx-feature-visual,
        .hx-blog-thumb { animation: hx-image-reveal both; animation-timeline: view(); animation-range: entry 0% cover 24%; }
      }

      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .hx-page *, .hx-page *::before, .hx-page *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: 0.001ms !important; }
      }

      @media (max-width: 991px) {
        .hx-container { max-width: 767px; padding: 0 32px; }
        .hx-hero-bg { background-attachment: scroll, scroll, scroll, scroll; }
        .hx-nav-links, .hx-nav-actions { display: none; }
        .hx-mobile-toggle { display: inline-flex; }
        .hx-logo { min-width: auto; }
        .hx-feature-grid, .hx-feature-grid:nth-child(even), .hx-service-grid, .hx-faq-grid, .hx-blog-grid { grid-template-columns: 1fr; }
        .hx-why-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .hx-setup-card, .hx-setup-journey { grid-template-columns: 1fr; }
        .hx-faq-left, .hx-blog-left { position: static; }
        .hx-blog-list { grid-template-columns: 1fr 1fr; }
        .hx-footer-top { gap: 28px; }
        .hx-footer-menu-inner { gap: 24px; }
      }

      @media (max-width: 767px) {
        .hx-container { max-width: 540px; padding: 0 24px; }
        .hx-nav-shell { gap: 16px; }
        .hx-nav-shell > .hx-button { display: none; }
        .hx-hero { padding-top: 112px; }
        .hx-title { font-size: clamp(42px, 13vw, 58px); line-height: 1.02; letter-spacing: 0; }
        .hx-hero p { max-width: 100%; font-size: 16px; line-height: 155%; }
        .hx-hero-card { margin-top: 54px; }
        .hx-chat-preview { display: flex; max-width: 44%; padding: 8px 9px; }
        .hx-chat-preview span { font-size: 9px; }
        .hx-chat-preview strong { font-size: 10px; line-height: 130%; }
        .hx-chat-left { left: 14px; top: 38px; }
        .hx-chat-right { right: 14px; bottom: 26px; }
        .hx-demo-flow { transform: translateX(-50%) scale(0.9); transform-origin: center; }
        .hx-brand-marquee { max-width: 100%; margin-top: 44px; }
        .hx-brand-track, .hx-brand-row { gap: 34px; }
        .hx-section { padding-top: 56px; }
        .hx-setup-section { padding-top: 76px; }
        .hx-setup-copy { padding: 28px 28px 22px; }
        .hx-setup-journey { padding: 0 28px 28px; }
        .hx-section-pad-bottom { padding-bottom: 100px; }
        .hx-section-details { margin-bottom: 36px; }
        .hx-section-title { letter-spacing: 0; }
        .hx-visual-integrations { --orbit-radius: 104px; }
        .hx-mini-message { width: calc(100% - 48px); left: 24px; right: auto; }
        .hx-mini-two { left: 24px; right: auto; top: 122px; }
        .hx-mini-action { bottom: 26px; }
        .hx-voice-note { width: calc(100% - 48px); left: 24px; right: auto; }
        .hx-voice-lira { left: 24px; right: auto; top: 124px; }
        .hx-voice-status { bottom: 24px; }
        .hx-service-grid { padding: 26px; gap: 38px; }
        .hx-why-grid { grid-template-columns: 1fr; }
        .hx-service-item { grid-template-columns: 36px 1fr; gap: 18px; }
        .hx-service-vr { display: none; }
        .hx-testimonial-card { padding: 32px 18px; }
        .hx-testimonial-card blockquote { font-size: 18px; }
        .hx-faq-section { padding: 70px 0; }
        .hx-blog-list { grid-template-columns: 1fr; }
        .hx-footer-top { flex-direction: column; }
        .hx-footer-menu-inner { justify-content: flex-start; flex-wrap: wrap; }
        .hx-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
      }

      @media (max-width: 479px) {
        .hx-container { padding: 0 12px; }
        .hx-title { font-size: clamp(38px, 13.4vw, 50px); }
        .hx-section { padding-top: 48px; }
        .hx-section-title { font-size: 23px; line-height: 135%; }
        .hx-hero-card { padding: 8px; border-radius: 18px; }
        .hx-hero-card-image { height: 150px; }
        .hx-demo-flow { top: 12px; gap: 5px; padding: 6px 8px; font-size: 9px; }
        .hx-demo-flow i { width: 18px; }
        .hx-core { width: 40px; height: 40px; bottom: 20px; }
        .hx-core img { width: 28px; height: 20px; }
        .hx-chat-preview::after { display: none; }
        .hx-feature-visual { min-height: 220px; }
        .hx-visual-integrations { --orbit-radius: 82px; }
        .hx-hex { width: 80px; height: 70px; }
        .hx-visual-integrations .hx-hex { margin-left: -40px; margin-top: -35px; transform-origin: 40px 35px; }
        .hx-mini-message, .hx-voice-note { width: calc(100% - 28px); left: 14px; padding: 10px 12px; font-size: 11px; }
        .hx-mini-two, .hx-voice-lira { left: 14px; top: 112px; }
        .hx-type-line { max-width: 100%; }
        .hx-voice-row { grid-template-columns: 18px 18px minmax(0, 1fr) auto; gap: 6px; }
        .hx-voice-wave { gap: 3px; }
        .hx-service-grid, .hx-testimonial-card { padding: 20px 14px; }
        .hx-setup-card { padding: 8px; }
        .hx-setup-copy { padding: 22px 16px 18px; }
        .hx-setup-journey { padding: 0 16px 16px; gap: 10px; }
        .hx-setup-step { min-height: auto; padding: 14px; }
        .hx-setup-step strong { width: 30px; height: 30px; margin-bottom: 10px; }
        .hx-setup-copy .hx-section-title { font-size: 22px; line-height: 125%; }
        .hx-setup-demo { padding: 10px; }
        .hx-setup-demo pre { font-size: 9px; line-height: 1.65; padding: 14px; }
        .hx-setup-note { grid-template-columns: 1fr; }
        .hx-footer-menu-inner { gap: 32px; }
      }

      /* ═══════════════════════════════════════════════
         EDITORIAL HERO
         ═══════════════════════════════════════════════ */
      .eh-hero {
        position: relative;
        width: 100%;
        min-height: 100vh;
        overflow: hidden;
        background: #111;
      }

      /* Background image */
      .eh-hero-bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        z-index: 0;
      }

      /* Gradient overlays */
      .eh-overlay {
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
      }
      .eh-overlay-right {
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0) 25%,
          rgba(0, 0, 0, 0.55) 52%,
          rgba(0, 0, 0, 0.88) 100%
        );
      }
      .eh-overlay-top {
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.35) 0%,
          rgba(0, 0, 0, 0) 20%
        );
      }
      .eh-overlay-bottom {
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 60%,
          rgba(0, 0, 0, 0.55) 100%
        );
      }

      /* Split content grid */
      .eh-content {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: grid;
        grid-template-columns: 55% 45%;
        align-items: center;
        padding: 100px 60px 160px 60px;
      }
      .eh-left {
        align-self: flex-start;
        padding-top: 60px;
      }
      .eh-headline {
        margin: 0;
        font-size: clamp(48px, 5.5vw, 82px);
        font-weight: 700;
        line-height: 1.05;
        color: #ffffff;
        letter-spacing: -0.02em;
        max-width: 680px;
        font-family: var(--font-sans);
      }
      .eh-headline em {
        font-style: italic;
        font-weight: 400;
        font-family: Georgia, serif;
      }

      .eh-right {
        display: flex;
        flex-direction: column;
        gap: 32px;
        max-width: 360px;
        margin-left: auto;
      }
      .eh-body {
        margin: 0;
        font-size: 15px;
        line-height: 1.65;
        color: rgba(255, 255, 255, 0.82);
        font-weight: 400;
      }
      .eh-cta-row {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
      .eh-btn {
        padding: 11px 22px;
        border-radius: 999px;
        font-size: 14px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        font-family: var(--font-sans);
        transition: transform 0.22s ease, box-shadow 0.22s ease;
      }
      .eh-btn:hover {
        transform: translateY(-1px);
      }
      .eh-btn-primary {
        background: rgba(255, 255, 255, 0.95);
        color: #000000;
      }
      .eh-btn-primary:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
      }
      .eh-btn-secondary {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        color: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.22);
      }
      .eh-btn-secondary:hover {
        background: rgba(255, 255, 255, 0.16);
      }

      /* Social proof */
      .eh-social {
        position: absolute;
        bottom: 90px;
        left: 60px;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .eh-avatar-row {
        display: flex;
      }
      .eh-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.5);
        margin-left: -8px;
        object-fit: cover;
        overflow: hidden;
        display: grid;
        place-items: center;
        background: linear-gradient(135deg, #ffffff, #e7e1d5);
        color: #020308;
        font-weight: 700;
        font-size: 12px;
      }
      .eh-avatar:first-child {
        margin-left: 0;
      }
      .eh-social-text {
        margin: 0;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.75);
        line-height: 1.5;
        max-width: 220px;
      }
      .eh-social-em {
        font-style: italic;
        font-weight: 600;
        color: #fff;
        text-decoration: underline;
      }

      /* Logo strip */
      .eh-logo-strip {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 10;
        padding: 16px 60px;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
      }
      .eh-logo-placeholder {
        color: rgba(255, 255, 255, 0.4);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        white-space: nowrap;
      }

      /* ─── Mobile ─── */
      @media (max-width: 768px) {
        .eh-content {
          grid-template-columns: 1fr;
          padding: 90px 24px 180px 24px;
        }
        .eh-left {
          padding-top: 0;
          align-self: center;
        }
        .eh-headline {
          font-size: clamp(36px, 9vw, 52px);
        }
        .eh-right {
          margin-left: 0;
          max-width: 100%;
        }
        .eh-social {
          bottom: 130px;
          left: 24px;
        }
        .eh-logo-strip {
          padding: 14px 24px;
          justify-content: center;
          gap: 24px;
        }
        .eh-logo-strip span:nth-child(n + 5) {
          display: none;
        }
      }
    `}</style>
  )
}

export function LandingPageV4() {
  return (
    <div className="hx-page">
      <SEO
        title="Lira - AI Customer Support That Remembers and Acts"
        description="Lira helps teams resolve customer issues across chat, email, voice, and portal with customer memory, knowledge, workflow actions, and smart escalation."
        path="/v4"
      />
      <Styles />
      <MarketingNavbar variant="overlay" />

      {/* ───── EDITORIAL HERO ───── */}
      <section className="eh-hero">
        {/* Background photo */}
        <img src="/landing-v1/hero-2.jpg" alt="" className="eh-hero-bg-img" />

        {/* Gradient overlays */}
        <div className="eh-overlay eh-overlay-right" />
        <div className="eh-overlay eh-overlay-top" />
        <div className="eh-overlay eh-overlay-bottom" />

        {/* Split content */}
        <div className="eh-content">
          <div className="eh-left">
            <h1 className="eh-headline">
              AI That <em>Resolves</em> Problems
              <br />
              Without You
            </h1>
          </div>

          <div className="eh-right">
            <p className="eh-body">
              Lira is an autonomous AI support agent that handles customer complaints end-to-end —
              diagnosing issues, taking action across your tools, and resolving problems without a
              human in the loop.
            </p>
            <div className="eh-cta-row">
              <button type="button" className="eh-btn eh-btn-primary">
                Explore Products
              </button>
              <button type="button" className="eh-btn eh-btn-secondary">
                Talk to Us
              </button>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="eh-social">
          <div className="eh-avatar-row">
            <img
              className="eh-avatar"
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
              alt=""
              style={{ zIndex: 4 }}
            />
            <img
              className="eh-avatar"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face"
              alt=""
              style={{ zIndex: 3 }}
            />
            <img
              className="eh-avatar"
              src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face"
              alt=""
              style={{ zIndex: 2 }}
            />
            <img
              className="eh-avatar"
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face"
              alt=""
              style={{ zIndex: 1 }}
            />
          </div>
          <p className="eh-social-text">
            Trusted by <span className="eh-social-em">companies</span> scaling with AI
          </p>
        </div>

        {/* Logo strip — commented out until we have real partner companies */}
        {/* <div className="eh-logo-strip">
          {['Novacore', 'Corpius', 'Xenobyte', 'Quantiva', 'Meridian'].map((name) => (
            <span className="eh-logo-placeholder" key={name}>
              {name}
            </span>
          ))}
        </div> */}
      </section>

      <section id="features" className="hx-section">
        <div className="hx-container">
          <motion.div
            className="hx-section-details"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={viewport}
          >
            <motion.h2 className="hx-section-title" variants={fadeUp}>
              <span className="hx-gradient-text">Everything You Need to</span>
              <br />
              Support Customers Well
            </motion.h2>
            <motion.p className="hx-section-para" variants={fadeUp}>
              Lira combines knowledge, voice, language, workflow actions, and customer memory so
              support feels personal at scale.
            </motion.p>
          </motion.div>

          <div className="hx-feature-wrap">
            {Array.from(
              { length: Math.ceil(featureCards.length / 2) },
              (_, index) => index * 2
            ).map((start) => (
              <div className="hx-feature-grid" key={start}>
                {featureCards.slice(start, start + 2).map((feature) => (
                  <motion.article
                    className="hx-feature-card"
                    key={feature.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
                    tabIndex={0}
                  >
                    <Visual type={feature.visual} />
                    <div className="hx-feature-body">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SetupJourney />

      <WhyChooseSection />

      <MobileAppSection />

      <section className="hx-section">
        <div className="hx-container">
          <div className="hx-service-grid">
            <motion.div
              className="hx-section-details"
              style={{ textAlign: 'left', margin: 0, alignItems: 'flex-start' }}
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
              <motion.h2 className="hx-section-title" variants={fadeUp}>
                <span className="hx-gradient-text">Built for Teams That</span>
                <br />
                Care About Retention
              </motion.h2>
              <motion.p className="hx-section-para" style={{ marginLeft: 0 }} variants={fadeUp}>
                Whether you support SaaS users, financial customers, clients, or high-volume
                customer experience teams, Lira keeps the relationship context intact.
              </motion.p>
            </motion.div>
            <motion.div
              className="hx-service-list"
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={viewport}
            >
              {services.map((service) => (
                <motion.article
                  className="hx-service-item"
                  key={service.title}
                  variants={cardReveal}
                >
                  <div className="hx-service-icon">
                    <service.icon size={30} />
                  </div>
                  <div className="hx-service-vr" />
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* TODO: Restore when we have real customer testimonials
      <motion.section
        className="hx-testimonial"
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
      >
        <div className="hx-container">
          <motion.div className="hx-section-details" style={{ maxWidth: 474 }} variants={fadeUp}>
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">What better support</span>
              <br />
              feels like with Lira
            </h2>
          </motion.div>
          <motion.div className="hx-testimonial-card" variants={cardReveal}>
            <div className="hx-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <Sparkle key={index} size={20} weight="fill" />
              ))}
            </div>
            <blockquote>
              Lira helps us respond with context instead of scripts. Customers get answers faster,
              and our team finally has the history needed to build trust after the first reply.
            </blockquote>
            <div className="hx-author">
              <strong>Maya Thompson</strong>
              <span>Head of Customer Experience</span>
            </div>
            <div className="hx-avatar-row">
              <span className="hx-avatar">MT</span>
              <span className="hx-avatar">PK</span>
              <span className="hx-avatar">CR</span>
              <span className="hx-avatar">AW</span>
            </div>
          </motion.div>
        </div>
      </motion.section>
      */}

      <motion.section
        className="hx-faq-section"
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
      >
        <div className="hx-container hx-faq-grid">
          <motion.div className="hx-faq-left" variants={fadeUp}>
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">Frequently asked</span>
              <br />
              questions
            </h2>
            <ButtonLink to="/contact" variant="secondary">
              Contact us
            </ButtonLink>
          </motion.div>
          <motion.div className="hx-faq-list" variants={stagger}>
            {faqs.map((faq) => (
              <motion.div key={faq.q} variants={cardReveal}>
                <FAQItem q={faq.q} a={faq.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <section id="blog" className="hx-section">
        <div className="hx-container hx-blog-grid">
          <motion.div
            className="hx-blog-left"
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger}
          >
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">Ideas for better</span>
              <br />
              customer relationships
            </h2>
            <ButtonLink to="/blog" variant="secondary">
              Browse all blogs
            </ButtonLink>
          </motion.div>
          <motion.div
            className="hx-blog-list"
            initial="hidden"
            whileInView="show"
            viewport={viewport}
            variants={stagger}
          >
            {BLOG_POSTS.map((post) => (
              <motion.div key={post.slug} variants={cardReveal}>
                <Link to={`/blog/${post.slug}`} className="hx-blog-card">
                  <div className="hx-blog-thumb">
                    <ArrowRight size={30} />
                  </div>
                  <div className="hx-blog-body">
                    <span className="hx-blog-date">{post.date}</span>
                    <h3>{post.title}</h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <motion.section
        className="hx-cta"
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        variants={stagger}
      >
        <div className="hx-container">
          <motion.div className="hx-cta-icon" variants={fadeUp}>
            <img src="/lira_mark_white.png" alt="" aria-hidden="true" />
          </motion.div>
          <motion.h2 className="hx-section-title" variants={fadeUp}>
            Build support customers remember
          </motion.h2>
          <motion.p variants={fadeUp}>
            Give your team an AI relationship layer that answers, remembers, routes, and follows
            through.
          </motion.p>
          <motion.div className="hx-hero-button" variants={fadeUp}>
            <ButtonLink to="/signup" variant="secondary">
              Signup for free
            </ButtonLink>
            <ButtonLink to="/book-demo">Book a Demo</ButtonLink>
          </motion.div>
        </div>
      </motion.section>

      <MarketingFooter />
    </div>
  )
}
