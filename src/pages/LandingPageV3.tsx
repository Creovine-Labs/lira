import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { SEO } from '@/components/SEO'
import {
  ArrowRight,
  Bot,
  ChevronDown,
  CircleDollarSign,
  Globe2,
  Headphones,
  MailCheck,
  MessageSquareText,
  Mic,
  PlugZap,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const viewport = { once: true, amount: 0.16 }

const brandRows = [
  ['Auralink', 'Metricly', 'Velora', 'Fluxbit', 'Taskly'],
  ['Optima AI', 'Nexflow', 'Clarity', 'Orbitex', 'Synapse'],
]

const featureCards = [
  {
    title: 'Seamless Integrations',
    description: 'Integrate Slack, HubSpot, Zendesk & more - automate data flow instantly.',
    visual: 'integrations',
  },
  {
    title: 'AI-Powered Conversations',
    description:
      'Create records, assign tasks & queue emails with a simple prompt in seconds flat.',
    visual: 'chat',
  },
  {
    title: 'Multilingual Support',
    description: 'Support customers from anywhere in the world with automatic language detection.',
    visual: 'global',
  },
  {
    title: 'Voice Control',
    description: 'Control your chatbot effortlessly with simple voice commands for faster replies.',
    visual: 'voice',
  },
]

const services = [
  {
    icon: Bot,
    title: 'SaaS Companies',
    description: 'Automate onboarding and support with AI. Provide instant assistance as you grow.',
  },
  {
    icon: CircleDollarSign,
    title: 'E-commerce Stores',
    description: 'Answer product questions, order status, refunds, and returns instantly.',
  },
  {
    icon: UsersRound,
    title: 'For Agencies',
    description: 'Capture leads, qualify prospects, and deliver white-glove support at scale.',
  },
  {
    icon: Headphones,
    title: 'Customer Support Teams',
    description: 'Reduce ticket volume and response time by up to 70% without losing quality.',
  },
]

const plans = [
  {
    name: 'Starter',
    subtitle: 'For small teams getting started',
    price: '$39',
    label: '/ per month',
    button: 'Get started',
    features: [
      '1 AI chatbot',
      'Up to 2,000 conversations / month',
      'Website knowledge base training',
      'Basic customization',
      'Email support',
      'Chat history for 30 days',
    ],
  },
  {
    name: 'Most Popular',
    subtitle: 'For growing teams needing more control',
    price: '$99',
    label: '/ per month',
    button: 'Upgrade to Growth',
    featured: true,
    features: [
      'Unlimited conversations',
      'Advanced AI training',
      'CRM integrations',
      'Multilingual support',
      'Advanced analytics & reports',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    subtitle: 'For larger teams and organizations',
    price: 'Custom',
    label: '',
    button: 'Contact sales',
    features: [
      'Unlimited AI chatbots',
      'Dedicated onboarding',
      'Custom AI training & workflows',
      'API access',
      'Enterprise-grade security',
      'SLA & uptime guarantee',
    ],
  },
]

const faqs = [
  {
    q: 'What is an AI Customer Support Chatbot?',
    a: 'Lira is an AI support agent that answers questions, resolves routine requests, updates connected systems, and escalates complex issues to your team with full context.',
  },
  {
    q: 'How do I get started with Lira?',
    a: 'Connect your helpdesk, upload or sync your knowledge base, choose your tone and escalation rules, then launch the widget on your site.',
  },
  {
    q: 'Can I update or change the AI responses?',
    a: 'Yes. You can edit knowledge, set response rules, block topics, add approval steps, and train Lira from resolved conversations.',
  },
  {
    q: 'How do I contact the support team if I need help?',
    a: 'You can reach us from the app, email support@liraintelligence.com, or book onboarding time with our team.',
  },
  {
    q: 'Is my customer information secure?',
    a: 'Yes. Lira encrypts data in transit and at rest, supports role-based access controls, and keeps your customer data isolated from third-party model training.',
  },
]

const blogPosts = [
  'The Future of AI Customer Support in 2026',
  'The Future of AI-Powered Customer Support and Scalable Service Innovation',
  'Building Scalable Support Systems with AI and Live Agents',
  'The Rise of Intelligent Automation in Customer Service',
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
      <span>{children}</span>
      <span className="hx-button-bg" />
    </Link>
  )
}

function Nav() {
  return (
    <header className="hx-header">
      <div className="hx-container hx-nav-shell">
        <Link to="/" className="hx-logo" aria-label="Lira home">
          <span className="hx-logo-mark">L</span>
          <span>Lira</span>
        </Link>
        <nav className="hx-nav-links" aria-label="Primary navigation">
          <Link to="/">Home</Link>
          <a href="#features">Feature</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
          <a href="mailto:support@liraintelligence.com">Contact</a>
        </nav>
        <ButtonLink to="/signup">Book a Demo</ButtonLink>
      </div>
    </header>
  )
}

function HeroGraphic() {
  return (
    <div className="hx-hero-card">
      <div className="hx-hero-card-image">
        <div className="hx-orbit hx-orbit-one" />
        <div className="hx-orbit hx-orbit-two" />
        <div className="hx-orbit hx-orbit-three" />
        <div className="hx-core">
          <Sparkles size={18} />
        </div>
        <div className="hx-chat-preview hx-chat-left">
          <span>Ticket detected</span>
          <strong>Billing access issue</strong>
        </div>
        <div className="hx-chat-preview hx-chat-right">
          <span>Resolved by Lira</span>
          <strong>CRM updated</strong>
        </div>
      </div>
      <div className="hx-hero-card-title">AI Customer Support / Chatbot.</div>
    </div>
  )
}

function Visual({ type }: { type: string }) {
  if (type === 'integrations') {
    return (
      <div className="hx-feature-visual hx-visual-integrations">
        {[PlugZap, MessageSquareText, Workflow, MailCheck, ShieldCheck].map((Icon, index) => (
          <span key={index} className={`hx-hex hx-hex-${index + 1}`}>
            <Icon size={24} />
          </span>
        ))}
      </div>
    )
  }

  if (type === 'chat') {
    return (
      <div className="hx-feature-visual hx-visual-chat">
        <div className="hx-mini-message hx-mini-one">Can you check my order?</div>
        <div className="hx-mini-message hx-mini-two">Found it. Delivery arrives tomorrow.</div>
        <div className="hx-mini-action">Task created</div>
      </div>
    )
  }

  if (type === 'global') {
    return (
      <div className="hx-feature-visual hx-visual-global">
        <Globe2 size={96} />
        <span>EN</span>
        <span>FR</span>
        <span>JP</span>
        <span>ES</span>
      </div>
    )
  }

  return (
    <div className="hx-feature-visual hx-visual-voice">
      <Mic size={54} />
      <div className="hx-wave">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
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
        <ChevronDown className={open ? 'is-open' : ''} size={18} />
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
      @import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');

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
        font-family: Inter, sans-serif;
        font-size: 16px;
        letter-spacing: -0.04em;
        overflow-x: hidden;
      }

      .hx-page *, .hx-page *::before, .hx-page *::after { box-sizing: border-box; }
      .hx-page a { color: inherit; text-decoration: none; }
      .hx-page button { font: inherit; }
      .hx-container { width: 100%; max-width: 1120px; margin: 0 auto; padding: 0 40px; }

      .hx-header { position: fixed; z-index: 777; inset: 14px 0 auto; pointer-events: none; }
      .hx-nav-shell {
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 40px;
        padding-top: 10px;
        padding-bottom: 10px;
        border-radius: 16px;
        background: rgba(255,255,255,0.92);
        position: relative;
        overflow: hidden;
      }
      .hx-nav-shell::before {
        content: '';
        position: absolute;
        inset: -30px 30% auto;
        height: 70px;
        background: rgba(2,3,8,0.18);
        filter: blur(50px);
        opacity: 0.45;
        z-index: -1;
      }
      .hx-logo { display: flex; align-items: center; gap: 10px; min-width: 162px; color: var(--text); font-weight: 600; }
      .hx-logo-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; background: var(--cream); color: #020308; border: 1px solid rgba(2,3,8,0.22); font-family: 'Geist Mono', monospace; }
      .hx-nav-links { display: flex; align-items: center; justify-content: center; gap: 16px; }
      .hx-nav-links a { padding: 6px 8px; color: rgba(2,3,8,0.8); font-size: 16px; line-height: 160%; }
      .hx-nav-links a:hover { color: var(--text); }

      .hx-button {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 4px;
        border-radius: 12px;
        color: var(--text);
        font-size: 16px;
        line-height: 160%;
        white-space: nowrap;
        overflow: hidden;
      }
      .hx-button span:first-child { position: relative; z-index: 2; padding: 8px 24px; border-radius: 8px; background: var(--cream); color: #020308; }
      .hx-button-bg { position: absolute; inset: 50% 0 auto; height: 100%; transform: translateY(-50%); background: linear-gradient(180deg, transparent, rgba(2,3,8,0.12) 50%); }
      .hx-button--secondary { border: 1px solid rgba(2,3,8,0.2); background: rgba(255,255,255,0.72); }
      .hx-button--secondary span:first-child { background: transparent; padding: 6px 16px; }
      .hx-button--secondary .hx-button-bg { display: none; }

      .hx-hero { position: relative; z-index: 100; padding-top: 130px; }
      .hx-hero-bg { position: absolute; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
      .hx-hero-bg::before { content: ''; position: absolute; top: 70px; left: 50%; width: min(900px, 100vw); height: 560px; transform: translateX(-50%); background: radial-gradient(circle at 50% 35%, rgba(255,255,255,0.88), rgba(2,3,8,0.08) 32%, transparent 68%); opacity: 0.95; }
      .hx-hero-bg::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(2,3,8,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(2,3,8,0.055) 1px, transparent 1px); background-size: 54px 54px; mask-image: radial-gradient(circle at 50% 0%, black, transparent 62%); }
      .hx-hero-overview { max-width: 738px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 12px; }
      .hx-title { margin: 32px 0 16px; font-family: 'Geist Mono', monospace; color: var(--text); font-size: clamp(42px, 5vw, 56px); line-height: 120%; font-weight: 400; letter-spacing: -0.08em; }
      .hx-gradient-text { background: linear-gradient(270deg, rgba(2,3,8,0.42), #020308 63%, rgba(2,3,8,0.42)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      .hx-hero p { max-width: 540px; margin: 0; font-family: 'Geist Mono', monospace; line-height: 150%; color: var(--muted); }
      .hx-hero-button { margin-top: 20px; }

      .hx-hero-card { width: 100%; max-width: 720px; margin: 70px auto 0; padding: 12px; border-radius: 24px; background: rgba(255,255,255,0.72); border: 1px solid rgba(2,3,8,0.18); backdrop-filter: blur(50px); display: flex; flex-direction: column; gap: 12px; }
      .hx-hero-card-image { position: relative; height: 180px; border: 1px solid rgba(2,3,8,0.32); border-radius: 16px; background: radial-gradient(circle at 50% 100%, rgba(255,255,255,0.92), transparent 16%), radial-gradient(circle at 50% 50%, rgba(2,3,8,0.08), rgba(255,255,255,0.85) 60%, #f7f5ef), linear-gradient(135deg, #ffffff, #ebe7dc); overflow: hidden; }
      .hx-orbit { position: absolute; left: 50%; top: 78%; border: 1px solid rgba(2,3,8,0.2); border-radius: 50%; transform: translate(-50%, -50%); }
      .hx-orbit-one { width: 180px; height: 180px; }
      .hx-orbit-two { width: 340px; height: 340px; }
      .hx-orbit-three { width: 520px; height: 520px; }
      .hx-core { position: absolute; left: 50%; bottom: 22px; display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid rgba(2,3,8,0.34); border-radius: 50%; background: var(--cream); color: #020308; transform: translateX(-50%); box-shadow: 0 0 46px rgba(2,3,8,0.12); }
      .hx-chat-preview { position: absolute; display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border: 1px solid rgba(2,3,8,0.2); border-radius: 10px; background: rgba(255,255,255,0.82); backdrop-filter: blur(8px); }
      .hx-chat-preview span { color: rgba(2,3,8,0.55); font-size: 11px; letter-spacing: -0.02em; }
      .hx-chat-preview strong { color: var(--text); font-size: 13px; font-weight: 500; }
      .hx-chat-left { left: 32px; top: 34px; }
      .hx-chat-right { right: 30px; bottom: 34px; }
      .hx-hero-card-title { color: rgba(2,3,8,0.8); font-family: 'Geist Mono', monospace; font-size: 12px; line-height: 160%; text-align: left; }

      .hx-brand-marquee { max-width: 800px; margin: 60px auto 0; overflow: hidden; mask-image: linear-gradient(to right, transparent 0%, black 15% 85%, transparent 100%); }
      .hx-brand-track { display: flex; gap: 52px; align-items: center; width: max-content; animation: hx-marquee 22s linear infinite; }
      .hx-brand-row { display: flex; gap: 52px; flex: none; align-items: center; }
      .hx-brand-logo { color: rgba(2,3,8,0.45); font-family: 'Geist Mono', monospace; font-size: 15px; white-space: nowrap; }
      @keyframes hx-marquee { to { transform: translateX(-50%); } }

      .hx-section { position: relative; z-index: 150; padding-top: 120px; }
      .hx-section-pad-bottom { padding-bottom: 130px; }
      .hx-section-details { max-width: 636px; margin: 0 auto 52px; text-align: center; display: flex; flex-direction: column; gap: 16px; }
      .hx-section-title { margin: 0; font-family: 'Geist Mono', monospace; font-size: clamp(28px, 3.4vw, 32px); line-height: 140%; font-weight: 500; letter-spacing: -0.08em; color: var(--text); }
      .hx-section-para { max-width: 422px; margin: 0 auto; line-height: 160%; color: var(--muted); }

      .hx-feature-wrap { display: flex; flex-direction: column; gap: 16px; }
      .hx-feature-grid { display: grid; grid-template-columns: 1fr 1.35fr; gap: 16px; }
      .hx-feature-grid:nth-child(even) { grid-template-columns: 1.35fr 1fr; }
      .hx-feature-card { padding: 8px; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,0.72); display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
      .hx-feature-visual { min-height: 260px; border-radius: 12px; position: relative; overflow: hidden; background: radial-gradient(circle at 50% 40%, rgba(2,3,8,0.08), transparent 62%), #f3f0e8; }
      .hx-feature-body { max-width: 420px; padding: 0 20px 20px; display: flex; flex-direction: column; gap: 8px; }
      .hx-feature-body h3 { margin: 0; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 600; }
      .hx-feature-body p { margin: 0; color: rgba(2,3,8,0.7); font-size: 14px; line-height: 160%; }
      .hx-hex { position: absolute; display: grid; place-items: center; width: 98px; height: 86px; color: #020308; background: rgba(255,255,255,0.76); clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); box-shadow: inset 0 0 60px rgba(2,3,8,0.08); }
      .hx-hex-1 { left: 50%; top: 50%; transform: translate(-50%, -50%); }
      .hx-hex-2 { left: 28%; top: 28%; }
      .hx-hex-3 { right: 22%; top: 22%; }
      .hx-hex-4 { left: 24%; bottom: 16%; }
      .hx-hex-5 { right: 25%; bottom: 18%; }
      .hx-mini-message { position: absolute; width: 58%; padding: 12px 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,0.86); color: var(--text); font-size: 13px; line-height: 145%; }
      .hx-mini-one { left: 28px; top: 46px; }
      .hx-mini-two { right: 28px; top: 112px; background: rgba(2,3,8,0.06); }
      .hx-mini-action { position: absolute; left: 50%; bottom: 42px; transform: translateX(-50%); padding: 8px 14px; border-radius: 200px; background: rgba(255,255,255,0.82); color: var(--text); font-family: 'Geist Mono', monospace; font-size: 12px; }
      .hx-visual-global { display: grid; place-items: center; color: rgba(2,3,8,0.72); }
      .hx-visual-global span { position: absolute; padding: 6px 10px; border: 1px solid var(--line); border-radius: 999px; background: rgba(255,255,255,0.82); font-family: 'Geist Mono', monospace; font-size: 12px; }
      .hx-visual-global span:nth-of-type(1) { left: 22%; top: 28%; }
      .hx-visual-global span:nth-of-type(2) { right: 20%; top: 34%; }
      .hx-visual-global span:nth-of-type(3) { left: 28%; bottom: 22%; }
      .hx-visual-global span:nth-of-type(4) { right: 27%; bottom: 18%; }
      .hx-visual-voice { display: grid; place-items: center; color: #020308; }
      .hx-wave { position: absolute; bottom: 54px; display: flex; gap: 8px; align-items: center; }
      .hx-wave i { width: 8px; border-radius: 20px; background: #020308; box-shadow: 0 0 20px rgba(2,3,8,0.16); }
      .hx-wave i:nth-child(1) { height: 22px; } .hx-wave i:nth-child(2) { height: 46px; } .hx-wave i:nth-child(3) { height: 70px; } .hx-wave i:nth-child(4) { height: 42px; } .hx-wave i:nth-child(5) { height: 26px; }

      .hx-service-grid { padding: 40px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
      .hx-service-list { display: flex; flex-direction: column; gap: 8px; }
      .hx-service-item { display: grid; grid-template-columns: 36px 1px 1fr; gap: 24px; align-items: start; padding: 16px 20px; border: 1px solid var(--line); border-radius: 12px; background: var(--panel-2); }
      .hx-service-icon { display: grid; place-items: center; width: 36px; height: 36px; color: #020308; }
      .hx-service-vr { width: 1px; height: 100%; min-height: 56px; background: linear-gradient(180deg, transparent, rgba(2,3,8,0.35), transparent); }
      .hx-service-item h3 { margin: 0 0 2px; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 600; }
      .hx-service-item p { margin: 0; color: rgba(2,3,8,0.62); font-size: 14px; line-height: 160%; }

      .hx-testimonial { position: relative; padding-top: 130px; padding-bottom: 120px; }
      .hx-testimonial::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 50% 58%, rgba(2,3,8,0.08), transparent 55%); }
      .hx-testimonial-card { max-width: 760px; margin: 52px auto 0; padding: 52px; border: 1px solid var(--line); border-radius: 24px; background: var(--panel); text-align: center; overflow: hidden; }
      .hx-stars { display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; color: var(--blue); }
      .hx-testimonial-card blockquote { max-width: 585px; margin: 0 auto; color: var(--text); font-family: 'Geist Mono', monospace; font-size: 22px; line-height: 140%; letter-spacing: -0.05em; }
      .hx-author { margin-top: 64px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 5px; }
      .hx-avatar-row { display: flex; justify-content: center; margin-top: 24px; }
      .hx-avatar { width: 44px; height: 44px; margin-left: -10px; border: 2px solid var(--panel); border-radius: 50%; background: linear-gradient(135deg, #ffffff, #e7e1d5); display: grid; place-items: center; color: #020308; font-weight: 700; }
      .hx-author strong { color: var(--text); font-weight: 500; }
      .hx-author span { color: rgba(2,3,8,0.62); font-size: 14px; }

      .hx-pricing-content { display: flex; flex-direction: column; gap: 64px; }
      .hx-plan-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
      .hx-plan { padding: 8px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); overflow: hidden; }
      .hx-plan-head { position: relative; padding: 20px; border: 1px solid var(--line); border-radius: 12px; background: rgba(2,3,8,0.04); overflow: hidden; }
      .hx-plan-featured .hx-plan-head { background: radial-gradient(circle at 50% 0%, rgba(2,3,8,0.1), transparent 62%), var(--panel); }
      .hx-plan h3 { margin: 0 0 4px; color: var(--text); font-family: 'Geist Mono', monospace; font-size: 24px; line-height: 140%; font-weight: 500; letter-spacing: -0.05em; }
      .hx-plan p { margin: 0; color: rgba(2,3,8,0.62); font-size: 14px; line-height: 150%; }
      .hx-price { display: flex; align-items: flex-end; gap: 8px; margin-top: 18px; }
      .hx-price strong { color: var(--text); font-size: 44px; line-height: 140%; font-weight: 600; letter-spacing: -0.05em; }
      .hx-price span { margin-bottom: 10px; color: rgba(2,3,8,0.8); }
      .hx-plan-list { margin: 26px 26px 24px; padding-left: 16px; display: flex; flex-direction: column; gap: 8px; }
      .hx-plan-list li { color: rgba(2,3,8,0.72); line-height: 160%; }
      .hx-plan-button { margin: 20px 0 0; }
      .hx-plan-button .hx-button { width: 100%; }

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
      .hx-blog-card { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 12px; padding: 8px; border: 1px solid var(--line); border-radius: 16px; background: var(--panel); overflow: hidden; }
      .hx-blog-thumb { aspect-ratio: 320 / 156; border-radius: 12px; background: radial-gradient(circle at 50% 45%, rgba(2,3,8,0.08), transparent 90%), linear-gradient(135deg, #ffffff, #ebe7dc); display: grid; place-items: center; color: rgba(2,3,8,0.6); }
      .hx-blog-body { padding: 0 12px 12px; display: flex; flex-direction: column; gap: 8px; }
      .hx-blog-date { opacity: 0.7; color: var(--text); font-size: 12px; }
      .hx-blog-card h3 { max-width: 274px; margin: 0; color: var(--text); font-size: 16px; line-height: 160%; font-weight: 500; }

      .hx-cta { position: relative; padding-top: 130px; padding-bottom: 110px; text-align: center; }
      .hx-cta-icon { width: 64px; height: 64px; margin: 0 auto 8px; display: grid; place-items: center; color: var(--blue); }
      .hx-cta h2 { margin-bottom: 8px; }
      .hx-cta p { max-width: 400px; margin: 8px auto 24px; line-height: 150%; }
      .hx-footer { position: relative; z-index: 100; padding-bottom: 40px; }
      .hx-footer-top { display: grid; grid-template-columns: 1fr 1fr; gap: 110px; }
      .hx-footer-left { padding: 64px 64px 0; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,0.7); backdrop-filter: blur(6px); }
      .hx-footer-left p { max-width: 360px; margin: 24px 0 0; line-height: 150%; }
      .hx-footer-menu-inner { display: flex; justify-content: flex-end; gap: 80px; }
      .hx-footer-menu { display: flex; flex-direction: column; gap: 16px; }
      .hx-footer-menu h4 { margin: 0; color: var(--text); font-size: 18px; line-height: 160%; font-weight: 600; }
      .hx-footer-menu a { width: fit-content; opacity: 0.7; color: var(--text); font-size: 14px; line-height: 160%; }
      .hx-footer-menu a:hover { opacity: 1; }
      .hx-footer-bottom { margin-top: 40px; display: flex; justify-content: space-between; gap: 32px; color: rgba(2,3,8,0.6); font-size: 14px; }

      @media (max-width: 991px) {
        .hx-container { max-width: 767px; padding: 0 32px; }
        .hx-nav-links { display: none; }
        .hx-logo { min-width: auto; }
        .hx-feature-grid, .hx-feature-grid:nth-child(even), .hx-service-grid, .hx-faq-grid, .hx-blog-grid { grid-template-columns: 1fr; }
        .hx-plan-grid { grid-template-columns: 1fr; }
        .hx-faq-left, .hx-blog-left { position: static; }
        .hx-blog-list { grid-template-columns: 1fr 1fr; }
        .hx-footer-top { grid-template-columns: 1fr 1.3fr; gap: 28px; }
        .hx-footer-left { padding: 32px 28px 0; }
        .hx-footer-menu-inner { gap: 24px; }
      }

      @media (max-width: 767px) {
        .hx-container { max-width: 540px; padding: 0 24px; }
        .hx-nav-shell { gap: 16px; }
        .hx-nav-shell > .hx-button { display: none; }
        .hx-hero { padding-top: 100px; }
        .hx-title { font-size: 32px; }
        .hx-hero-card { margin-top: 50px; }
        .hx-chat-preview { display: none; }
        .hx-section { padding-top: 100px; }
        .hx-section-pad-bottom { padding-bottom: 100px; }
        .hx-service-grid { padding: 26px; gap: 38px; }
        .hx-service-item { grid-template-columns: 36px 1fr; gap: 18px; }
        .hx-service-vr { display: none; }
        .hx-testimonial-card { padding: 32px 18px; }
        .hx-testimonial-card blockquote { font-size: 18px; }
        .hx-faq-section { padding: 70px 0; }
        .hx-blog-list { grid-template-columns: 1fr; }
        .hx-footer-top { grid-template-columns: 1fr; }
        .hx-footer-menu-inner { justify-content: flex-start; flex-wrap: wrap; }
        .hx-footer-bottom { flex-direction: column; align-items: center; text-align: center; }
      }

      @media (max-width: 479px) {
        .hx-container { padding: 0 12px; }
        .hx-title { font-size: 28px; }
        .hx-section-title { font-size: 24px; }
        .hx-hero-card-image { height: 150px; }
        .hx-feature-visual { min-height: 220px; }
        .hx-hex { width: 80px; height: 70px; }
        .hx-footer-menu-inner { gap: 32px; }
      }
    `}</style>
  )
}

export function LandingPageV3() {
  return (
    <div className="hx-page">
      <SEO
        title="Lira - AI Customer Support That Never Sleeps"
        description="Automate customer support with Lira, an AI-powered support assistant that answers instantly and reduces support costs."
        path="/v3"
      />
      <Styles />
      <Nav />

      <section className="hx-hero">
        <div className="hx-hero-bg" aria-hidden="true" />
        <div className="hx-container">
          <motion.div
            className="hx-hero-overview"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.h1 className="hx-title" variants={fadeUp}>
              <span className="hx-gradient-text">AI customer support</span> that does the work, not
              just organizes tickets.
            </motion.h1>
            <motion.p variants={fadeUp}>
              Let Lira handle repetitive customer questions across chat, email, portal, and voice -
              while your team steps in only when human help is needed.
            </motion.p>
            <motion.div className="hx-hero-button" variants={fadeUp}>
              <ButtonLink to="/signup">Book a Demo</ButtonLink>
            </motion.div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <HeroGraphic />
          </motion.div>
          <div className="hx-brand-marquee" aria-label="Trusted brands">
            <div className="hx-brand-track">
              {[...brandRows, ...brandRows].map((row, rowIndex) => (
                <div className="hx-brand-row" key={rowIndex}>
                  {row.map((brand) => (
                    <span className="hx-brand-logo" key={`${rowIndex}-${brand}`}>
                      {brand}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
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
              Automate Customer Support
            </motion.h2>
            <motion.p className="hx-section-para" variants={fadeUp}>
              From AI-powered chat responses to workflow automation and analytics.
            </motion.p>
          </motion.div>

          <div className="hx-feature-wrap">
            {[0, 2].map((start) => (
              <div className="hx-feature-grid" key={start}>
                {featureCards.slice(start, start + 2).map((feature) => (
                  <motion.article
                    className="hx-feature-card"
                    key={feature.title}
                    variants={fadeUp}
                    initial="hidden"
                    whileInView="show"
                    viewport={viewport}
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
                <span className="hx-gradient-text">Built for Every</span>
                <br />
                Type of Business
              </motion.h2>
              <motion.p className="hx-section-para" style={{ marginLeft: 0 }} variants={fadeUp}>
                From startups to enterprises, our AI chatbot scales with your business and fits your
                support motion.
              </motion.p>
            </motion.div>
            <div className="hx-service-list">
              {services.map((service) => (
                <article className="hx-service-item" key={service.title}>
                  <div className="hx-service-icon">
                    <service.icon size={30} />
                  </div>
                  <div className="hx-service-vr" />
                  <div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="hx-testimonial">
        <div className="hx-container">
          <div className="hx-section-details" style={{ maxWidth: 474 }}>
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">What our customers</span>
              <br />
              love about Lira
            </h2>
          </div>
          <div className="hx-testimonial-card">
            <div className="hx-stars">
              {Array.from({ length: 5 }).map((_, index) => (
                <Sparkles key={index} size={20} fill="currentColor" />
              ))}
            </div>
            <blockquote>
              Implementing Lira completely transformed our support operations. We reduced first
              response time by over 70% within the first month.
            </blockquote>
            <div className="hx-author">
              <strong>Michael Thompson</strong>
              <span>VP of Customer Experience</span>
            </div>
            <div className="hx-avatar-row">
              <span className="hx-avatar">MT</span>
              <span className="hx-avatar">PK</span>
              <span className="hx-avatar">CR</span>
              <span className="hx-avatar">AW</span>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="hx-section hx-section-pad-bottom">
        <div className="hx-container hx-pricing-content">
          <div className="hx-section-details">
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">Select a plan that suits</span>
              <br />
              your business.
            </h2>
          </div>
          <div className="hx-plan-grid">
            {plans.map((plan) => (
              <article
                className={`hx-plan${plan.featured ? ' hx-plan-featured' : ''}`}
                key={plan.name}
              >
                <div className="hx-plan-head">
                  <h3>{plan.name}</h3>
                  <p>{plan.subtitle}</p>
                  <div className="hx-price">
                    <strong>{plan.price}</strong>
                    {plan.label && <span>{plan.label}</span>}
                  </div>
                  <div className="hx-plan-button">
                    <ButtonLink to="/signup" variant={plan.featured ? 'primary' : 'secondary'}>
                      {plan.button}
                    </ButtonLink>
                  </div>
                </div>
                <ul className="hx-plan-list">
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-faq-section">
        <div className="hx-container hx-faq-grid">
          <div className="hx-faq-left">
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">Frequently asked</span>
              <br />
              questions
            </h2>
            <ButtonLink to="/signup" variant="secondary">
              Contact us
            </ButtonLink>
          </div>
          <div className="hx-faq-list">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="hx-section">
        <div className="hx-container hx-blog-grid">
          <div className="hx-blog-left">
            <h2 className="hx-section-title">
              <span className="hx-gradient-text">Our Insights</span>
              <br />
              on Technology
            </h2>
            <ButtonLink to="/blog" variant="secondary">
              Browse all blogs
            </ButtonLink>
          </div>
          <div className="hx-blog-list">
            {blogPosts.map((title, index) => (
              <Link to="/blog" className="hx-blog-card" key={title}>
                <div className="hx-blog-thumb">
                  <ArrowRight size={30} />
                </div>
                <div className="hx-blog-body">
                  <span className="hx-blog-date">March {9 + index}, 2026</span>
                  <h3>{title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="hx-cta">
        <div className="hx-container">
          <div className="hx-cta-icon">
            <Sparkles size={48} />
          </div>
          <h2 className="hx-section-title">Let's talk</h2>
          <p>Your always-on AI support assistant - ready to help customers anytime, anywhere.</p>
          <ButtonLink to="/signup">Book a Demo</ButtonLink>
        </div>
      </section>

      <footer className="hx-footer">
        <div className="hx-container">
          <div className="hx-footer-top">
            <div className="hx-footer-left">
              <Link to="/" className="hx-logo">
                <span className="hx-logo-mark">L</span>
                <span>Lira</span>
              </Link>
              <p>
                Your always-on AI support assistant - ready to help your customers anytime,
                anywhere. Simple. Smart. Reliable.
              </p>
            </div>
            <div className="hx-footer-menu-inner">
              <div className="hx-footer-menu">
                <h4>Company</h4>
                <Link to="/">Home</Link>
                <Link to="/products/customer-support">Feature</Link>
                <Link to="/pricing">Pricing</Link>
                <Link to="/blog">Blog</Link>
              </div>
              <div className="hx-footer-menu">
                <h4>Support</h4>
                <Link to="/resources">Resources</Link>
                <Link to="/security">Security</Link>
                <Link to="/privacy">Privacy</Link>
                <Link to="/terms">Terms</Link>
              </div>
            </div>
          </div>
          <div className="hx-footer-bottom">
            <span>2026 @Lira All rights Reserved</span>
            <span>Powered by Lira Intelligence</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
