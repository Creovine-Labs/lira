import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import Lenis from 'lenis'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  ImageIcon,
  MessageSquareText,
  Mic,
  MicOff,
  PhoneCall,
  Send,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react'

const trustedBy = ['Metricly', 'Velora', 'Auralink', 'Fluxbit', 'Taskly', 'Optima AI']

const services = [
  {
    icon: MessageSquareText,
    title: 'Actions, Not Just Answers',
    description:
      'Other AI tools send a reply and hope. Lira resolves the ticket, updates the CRM, creates the Linear issue, notifies Slack, and follows up with the customer — all in a single autonomous chain.',
  },
  {
    icon: Workflow,
    title: 'Reach Out Before They Do',
    description:
      'Your product already knows when a payment fails, a trial goes cold, or an API starts erroring. Lira hooks into those events and contacts the right customer with the right context — before a ticket ever exists.',
  },
  {
    icon: BrainCircuit,
    title: 'One Thread. Every Channel.',
    description:
      'Every other tool starts fresh each session. Lira carries the full relationship history across chat, email, WhatsApp, voice, and your CRM — so customers never repeat themselves.',
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
        <a href="#services" className="lira-nav-pill">
          Services
          <span className="pill-arrow"><ArrowUpRight size={12} /></span>
        </a>
        <a href="#results" className="lira-nav-pill">
          Results
          <span className="pill-arrow"><ArrowUpRight size={12} /></span>
        </a>
        <a href="#proof" className="lira-nav-pill">
          Proof
          <span className="pill-arrow"><ArrowUpRight size={12} /></span>
        </a>
      </nav>
      <Link to="/signup" className="lira-nav-cta">
        Start free
      </Link>
    </motion.header>
  )
}

// ─── Demo scenario definitions ───────────────────────────────────────────────

type MessageRole = 'user' | 'lira' | 'proactive' | 'system'
interface DemoMessage {
  id: number
  role: MessageRole
  text: string
  image?: string
  voiceNote?: boolean
  delay: number        // ms from scenario start before this message appears
  typeSpeed?: number   // ms per character for typing simulation
}

type ScenarioId = 'support' | 'proactive' | 'screenshot'

interface Scenario {
  id: ScenarioId
  label: string
  icon: React.ReactNode
  messages: DemoMessage[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'support',
    label: 'Live Support',
    icon: <MessageSquareText size={13} />,
    messages: [
      { id: 1, role: 'user',  text: 'Hey, I upgraded my plan yesterday but I still can\'t access the analytics dashboard.',  delay: 600,  typeSpeed: 38 },
      { id: 2, role: 'lira',  text: 'Hey Marcus, I can see your plan was upgraded at 3:14 PM yesterday — looks like the feature flag didn\'t propagate to your workspace. Give me two seconds.', delay: 3200, typeSpeed: 14 },
      { id: 3, role: 'system', text: 'Lira is resolving access issue…', delay: 6800, typeSpeed: 0 },
      { id: 4, role: 'lira',  text: 'Done. Your analytics dashboard is unlocked. I also noticed your billing email was different from your login — I\'ve aligned them so renewal notices reach you properly.', delay: 8200, typeSpeed: 14 },
      { id: 5, role: 'user',  text: 'That was fast. Thanks!', delay: 12000, typeSpeed: 48 },
      { id: 6, role: 'lira',  text: 'Anytime. You\'ll also see the new cohort retention view under Analytics > Retention. It\'s been really useful for teams your size.', delay: 14200, typeSpeed: 14 },
    ],
  },
  {
    id: 'proactive',
    label: 'Proactive Reach',
    icon: <Sparkles size={13} />,
    messages: [
      { id: 1, role: 'proactive', text: 'Hi Priya, I noticed you haven\'t logged in for 8 days and your trial ends in 3. I wanted to check in — is there something that felt confusing or blocked your setup?', delay: 400, typeSpeed: 14 },
      { id: 2, role: 'user',  text: 'Oh wow — yeah actually the Slack integration kept failing and I just gave up.', delay: 4200, typeSpeed: 38 },
      { id: 3, role: 'lira',  text: 'That\'s on us — there was a webhook auth bug affecting new workspaces last week. It\'s fixed now. Want me to walk you through connecting it? Takes about 90 seconds.', delay: 7000, typeSpeed: 14 },
      { id: 4, role: 'user',  text: 'Yes please', delay: 10800, typeSpeed: 55 },
      { id: 5, role: 'lira',  text: 'Perfect. I\'ve also extended your trial by 7 days so you have a clean window to test properly. Here\'s your personalised setup link:', delay: 12400, typeSpeed: 14 },
      { id: 6, role: 'system', text: 'Trial extended · Slack integration pre-configured', delay: 15200, typeSpeed: 0 },
    ],
  },
  {
    id: 'screenshot',
    label: 'Screenshot Scan',
    icon: <ImageIcon size={13} />,
    messages: [
      { id: 1, role: 'user',  text: 'I keep getting this error when trying to export. I have no idea what it means.', delay: 600, typeSpeed: 40 },
      { id: 2, role: 'user',  text: '[screenshot attached]', image: '/landing/screenshot-error-mock.png', delay: 2400, typeSpeed: 0 },
      { id: 3, role: 'lira',  text: 'I can see the error — it\'s a CORS policy block triggered when exporting to a custom domain. Your export origin isn\'t whitelisted yet.', delay: 5000, typeSpeed: 14 },
      { id: 4, role: 'lira',  text: 'Fix: go to Settings > Integrations > Export Origins and add your domain. I\'ve highlighted exactly where in the screenshot below.', delay: 8200, typeSpeed: 14 },
      { id: 5, role: 'system', text: 'Lira annotated your screenshot', delay: 10400, typeSpeed: 0 },
      { id: 6, role: 'user',  text: 'Fixed it! You literally circled the exact field I needed to change.', delay: 14000, typeSpeed: 40 },
      { id: 7, role: 'lira',  text: 'Glad that worked. I\'ve logged this so your team won\'t hit it again — I\'ll flag it in your next onboarding flow automatically.', delay: 16200, typeSpeed: 14 },
    ],
  },
]

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots({ color = 'lira' }: { color?: 'lira' | 'user' }) {
  return (
    <span className={`typing-dots typing-dots--${color}`} aria-label="typing">
      <span /><span /><span />
    </span>
  )
}

// ─── Voice mode overlay ───────────────────────────────────────────────────────
function VoiceOverlay({ onClose }: { onClose: () => void }) {
  const [wave, setWave] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setWave(w => (w + 1) % 100), 80)
    return () => clearInterval(id)
  }, [])
  const bars = Array.from({ length: 24 }, (_, i) => {
    const base = Math.sin((i / 24) * Math.PI * 2 + wave * 0.18) * 0.5 + 0.5
    return 8 + base * 32
  })
  return (
    <div className="voice-overlay">
      <button className="voice-close" onClick={onClose} aria-label="End voice call">
        <X size={16} />
      </button>
      <div className="voice-avatar">
        <div className="voice-ring voice-ring--1" />
        <div className="voice-ring voice-ring--2" />
        <div className="voice-ring voice-ring--3" />
        <span>L</span>
      </div>
      <p className="voice-name">Lira</p>
      <p className="voice-status">Listening…</p>
      <div className="voice-waveform" aria-hidden="true">
        {bars.map((h, i) => (
          <span key={i} style={{ height: `${h}px` }} />
        ))}
      </div>
      <button className="voice-end" onClick={onClose}>
        <PhoneCall size={18} />
      </button>
    </div>
  )
}

// ─── Main HeroChatDemo ────────────────────────────────────────────────────────
function HeroChatDemo() {
  const { scrollY } = useScroll()
  const cardY = useTransform(scrollY, [0, 900], [0, 38])

  const [activeScenario, setActiveScenario] = useState<ScenarioId>('support')
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([])
  const [typingRole, setTypingRole] = useState<MessageRole | null>(null)
  const [inputText, setInputText] = useState('')
  const [isTypingInput, setIsTypingInput] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }, [])

  const runScenario = useCallback((id: ScenarioId) => {
    clearTimers()
    setVisibleMessages([])
    setTypingRole(null)
    setInputText('')
    setIsTypingInput(false)

    const scenario = SCENARIOS.find(s => s.id === id)!
    const msgs = scenario.messages

    msgs.forEach((msg, idx) => {
      if (msg.role === 'system') {
        const t = setTimeout(() => {
          setTypingRole(null)
          setIsTypingInput(false)
          setInputText('')
          setVisibleMessages(prev => [...prev, msg])
        }, msg.delay)
        timersRef.current.push(t)
        return
      }

      // Show typing indicator before message appears
      const typingDelay = Math.max(0, msg.delay - 900)
      const t1 = setTimeout(() => {
        if (msg.role === 'user') {
          // Simulate user typing in input box
          setIsTypingInput(true)
          const chars = msg.text
          let ci = 0
          const typeChar = () => {
            ci++
            setInputText(chars.slice(0, ci))
            if (ci < chars.length) {
              const t = setTimeout(typeChar, msg.typeSpeed ?? 40)
              timersRef.current.push(t)
            }
          }
          typeChar()
        } else {
          setTypingRole(msg.role)
        }
      }, typingDelay)
      timersRef.current.push(t1)

      const t2 = setTimeout(() => {
        setTypingRole(null)
        setIsTypingInput(false)
        setInputText('')
        setVisibleMessages(prev => [...prev, msg])
        // If next message exists and it's from same role, keep typing indicator briefly
        const next = msgs[idx + 1]
        if (next && next.role === msg.role && next.role !== 'user') {
          setTypingRole(msg.role)
        }
      }, msg.delay)
      timersRef.current.push(t2)
    })

    return () => clearTimers()
  }, [clearTimers])

  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    runScenario(activeScenario)

    const scenario = SCENARIOS.find(s => s.id === activeScenario)!
    const lastDelay = Math.max(...scenario.messages.map(m => m.delay))
    const ids: ScenarioId[] = ['support', 'proactive', 'screenshot']
    const nextIdx = (ids.indexOf(activeScenario) + 1) % ids.length

    if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    autoAdvanceRef.current = setTimeout(() => {
      setActiveScenario(ids[nextIdx])
    }, lastDelay + 2500)

    return () => {
      clearTimers()
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current)
    }
  }, [activeScenario, runScenario, clearTimers])

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleMessages, typingRole, isTypingInput])

  const scenario = SCENARIOS.find(s => s.id === activeScenario)!

  return (
    <div className="hero-visual" aria-label="Lira live support demo">
      <motion.div className="demo-window" style={{ y: cardY }}>
        {/* Window chrome */}
        <div className="demo-chrome">
          <div className="demo-chrome-dots">
            <span /><span /><span />
          </div>
          <div className="demo-scenario-tabs" role="tablist">
            {SCENARIOS.map(s => (
              <button
                key={s.id}
                role="tab"
                aria-selected={s.id === activeScenario}
                className={`demo-tab ${s.id === activeScenario ? 'demo-tab--active' : ''}`}
                onClick={() => setActiveScenario(s.id)}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chat header */}
        <div className="demo-chat-header">
          <div className="demo-agent-info">
            <div className="demo-agent-avatar">
              <span>L</span>
              <span className="demo-online-ring" />
            </div>
            <div>
              <strong>Lira</strong>
              <span>AI Support Agent · Online</span>
            </div>
          </div>
          <div className="demo-header-actions">
            <button
              className={`demo-action-btn ${micOn ? 'demo-action-btn--active' : ''}`}
              onClick={() => setMicOn(v => !v)}
              aria-label="Toggle microphone"
              title="Voice mode"
            >
              {micOn ? <Mic size={14} /> : <MicOff size={14} />}
            </button>
            <button
              className="demo-action-btn"
              onClick={() => setVoiceOpen(true)}
              aria-label="Start voice call"
              title="Voice call"
            >
              <PhoneCall size={14} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div className="demo-messages" ref={scrollRef} data-lenis-prevent>
          <AnimatePresence initial={false}>
            {visibleMessages.map(msg => (
              <motion.div
                key={msg.id}
                className={`demo-msg demo-msg--${msg.role}`}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                {msg.role === 'system' ? (
                  <span className="demo-system-label">
                    <Sparkles size={10} /> {msg.text}
                  </span>
                ) : (
                  <>
                    {msg.role !== 'user' && (
                      <div className="demo-msg-avatar demo-msg-avatar--lira">L</div>
                    )}
                    <div className={`demo-bubble demo-bubble--${msg.role}`}>
                      {msg.image ? (
                        <div className="demo-screenshot-mock">
                          <div className="demo-screenshot-inner">
                            <div className="demo-screenshot-bar" />
                            <div className="demo-screenshot-content">
                              <span className="demo-screenshot-error">
                                CORS policy blocked request
                              </span>
                              <span className="demo-screenshot-detail">
                                Access to fetch at 'api.acme.io' from origin 'export.acme.io' blocked.
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                      {msg.voiceNote && (
                        <div className="demo-voice-note">
                          <Mic size={12} />
                          <span className="demo-voice-bars">
                            {Array.from({ length: 20 }, (_, i) => (
                              <span key={i} style={{ height: `${4 + Math.sin(i) * 8 + 8}px` }} />
                            ))}
                          </span>
                          <span>0:12</span>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="demo-msg-avatar demo-msg-avatar--user">M</div>
                    )}
                  </>
                )}
              </motion.div>
            ))}

            {/* Typing indicators */}
            {typingRole && typingRole !== 'system' && (
              <motion.div
                key="typing-lira"
                className="demo-msg demo-msg--lira"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.28 }}
              >
                <div className="demo-msg-avatar demo-msg-avatar--lira">L</div>
                <div className="demo-bubble demo-bubble--lira demo-bubble--typing">
                  <TypingDots color="lira" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="demo-input-bar">
          <div className="demo-attach-btn" title="Attach screenshot">
            <ImageIcon size={15} />
          </div>
          <div className="demo-input-field" aria-live="polite">
            {isTypingInput ? (
              <span className="demo-input-text">
                {inputText}<span className="demo-cursor" />
              </span>
            ) : (
              <span className="demo-input-placeholder">Message Lira…</span>
            )}
          </div>
          <button className="demo-send-btn" aria-label="Send message">
            <Send size={14} />
          </button>
        </div>

        {/* Voice overlay */}
        <AnimatePresence>
          {voiceOpen && (
            <motion.div
              className="demo-voice-overlay-wrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <VoiceOverlay onClose={() => setVoiceOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ambient context pill — scenario hint */}
      <motion.div
        className="demo-context-pill"
        key={activeScenario}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {scenario.id === 'support' && 'Ticket resolved autonomously in 8 s'}
        {scenario.id === 'proactive' && 'Lira reached out before the customer churned'}
        {scenario.id === 'screenshot' && 'Screenshot scanned & annotated in seconds'}
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
        overflow: visible;
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
        gap: 12px;
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

      .lira-nav a.lira-nav-pill {
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 4px 4px 4px 13px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.20);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.88);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-decoration: none;
        backdrop-filter: blur(8px);
        transition: transform 240ms ease, background 240ms ease, border-color 240ms ease;
      }

      .lira-nav a.lira-nav-pill:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.32);
        transform: translateY(-1px);
      }

      .pill-arrow {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        margin-left: 9px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.88);
        flex-shrink: 0;
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
        padding: 5px 5px 5px 18px;
        background: #0f1117;
        color: #ffffff !important;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        text-decoration: none;
        box-shadow: 0 4px 24px rgba(0,0,0,0.28);
      }

      .primary-cta .cta-icon-circle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        margin-left: 12px;
        border-radius: 999px;
        background: #ffffff;
        color: #0f1117;
        flex-shrink: 0;
      }

      .secondary-cta {
        display: inline-flex;
        align-items: center;
        gap: 0;
        padding: 5px 5px 5px 18px;
        border: 1px solid rgba(255, 255, 255, 0.42);
        background: rgba(255, 255, 255, 0.10);
        color: #ffffff;
        font-size: 12px;
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
        width: 30px;
        height: 30px;
        margin-left: 12px;
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
        line-height: 0.98;
      }

      .hero h1 {
        max-width: 560px;
        font-size: clamp(38px, 5vw, 72px);
        text-shadow: 0 18px 48px rgba(0, 0, 0, 0.34);
      }

      .italic {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-style: italic;
        font-weight: 600;
      }

      .hero-copy {
        max-width: 420px;
        margin-top: 16px;
        color: rgba(255, 255, 255, 0.88);
        font-size: 14px;
        line-height: 1.6;
        text-shadow: 0 12px 34px rgba(0, 0, 0, 0.32);
      }

      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 22px;
      }

      .hero-visual {
        position: relative;
        min-height: 560px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 14px;
      }

      /* ── Demo window ─────────────────────────────────────────── */
      .demo-window {
        position: relative;
        width: min(100%, 430px);
        border-radius: 22px;
        overflow: hidden;
        background: rgba(12, 15, 28, 0.72);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow:
          0 0 0 1px rgba(255,255,255,0.06),
          0 32px 80px rgba(0,0,0,0.55),
          0 0 100px rgba(80,120,255,0.08);
        backdrop-filter: blur(32px);
        -webkit-backdrop-filter: blur(32px);
      }

      .demo-chrome {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 16px;
        background: rgba(255,255,255,0.04);
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }

      .demo-chrome-dots {
        display: flex;
        gap: 5px;
        flex-shrink: 0;
      }

      .demo-chrome-dots span {
        display: block;
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
      }

      .demo-chrome-dots { display: none; }

      .demo-scenario-tabs {
        display: flex;
        gap: 4px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .demo-scenario-tabs::-webkit-scrollbar { display: none; }

      .demo-tab {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 11px;
        border-radius: 8px;
        border: 1px solid transparent;
        background: transparent;
        color: rgba(255,255,255,0.45);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        white-space: nowrap;
        transition: color 200ms ease, background 200ms ease, border-color 200ms ease;
      }

      .demo-tab:hover {
        color: rgba(255,255,255,0.78);
        background: rgba(255,255,255,0.06);
      }

      .demo-tab--active {
        color: #ffffff;
        background: rgba(255,255,255,0.10);
        border-color: rgba(255,255,255,0.14);
      }

      /* ── Chat header ───────────────────────────────────────────── */
      .demo-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
      }

      .demo-agent-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .demo-agent-avatar {
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: linear-gradient(135deg, #4f6ef7, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        font-weight: 800;
        color: #fff;
        flex-shrink: 0;
      }

      .demo-online-ring {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #22d06b;
        border: 2px solid rgba(12, 15, 28, 0.9);
      }

      .demo-agent-info strong {
        display: block;
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.2;
      }

      .demo-agent-info span {
        color: rgba(255,255,255,0.42);
        font-size: 10px;
        font-weight: 500;
      }

      .demo-header-actions {
        display: flex;
        gap: 6px;
      }

      .demo-action-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.55);
        cursor: pointer;
        transition: color 200ms, background 200ms;
      }

      .demo-action-btn:hover,
      .demo-action-btn--active {
        color: #ffffff;
        background: rgba(255,255,255,0.12);
      }

      /* ── Messages ──────────────────────────────────────────────── */
      .demo-messages {
        min-height: 280px;
        max-height: 320px;
        overflow-y: auto;
        padding: 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.10) transparent;
      }

      .demo-messages::-webkit-scrollbar { width: 4px; }
      .demo-messages::-webkit-scrollbar-track { background: transparent; }
      .demo-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }

      .demo-msg {
        display: flex;
        align-items: flex-end;
        gap: 8px;
      }

      .demo-msg--user {
        flex-direction: row-reverse;
      }

      .demo-msg--system {
        justify-content: center;
      }

      .demo-msg--proactive .demo-bubble--proactive {
        background: linear-gradient(135deg, rgba(79,110,247,0.22), rgba(139,92,246,0.18));
        border: 1px solid rgba(139,92,246,0.30);
      }

      .demo-msg-avatar {
        width: 24px;
        height: 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 800;
        flex-shrink: 0;
      }

      .demo-msg-avatar--lira {
        background: linear-gradient(135deg, #4f6ef7, #8b5cf6);
        color: #fff;
      }

      .demo-msg-avatar--user {
        background: rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.80);
      }

      .demo-bubble {
        max-width: 80%;
        border-radius: 16px;
        padding: 10px 13px;
        font-size: 12.5px;
        line-height: 1.55;
      }

      .demo-bubble p { margin: 0; }

      .demo-bubble--lira,
      .demo-bubble--proactive {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.90);
        border-bottom-left-radius: 5px;
      }

      .demo-bubble--user {
        background: rgba(255,255,255,0.96);
        color: #0f1117;
        border-bottom-right-radius: 5px;
        border: 1px solid rgba(255,255,255,0.20);
      }

      .demo-bubble--typing {
        padding: 12px 16px;
      }

      .demo-system-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 4px 11px;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.10);
        color: rgba(255,255,255,0.42);
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
      }

      /* ── Typing dots ───────────────────────────────────────────── */
      .typing-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .typing-dots span {
        display: block;
        width: 5px;
        height: 5px;
        border-radius: 999px;
        animation: typingBounce 1.1s ease-in-out infinite;
      }

      .typing-dots--lira span { background: rgba(255,255,255,0.55); }
      .typing-dots--user span { background: rgba(255,255,255,0.80); }

      .typing-dots span:nth-child(1) { animation-delay: 0ms; }
      .typing-dots span:nth-child(2) { animation-delay: 150ms; }
      .typing-dots span:nth-child(3) { animation-delay: 300ms; }

      @keyframes typingBounce {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
        30%            { transform: translateY(-4px); opacity: 1; }
      }

      /* ── Screenshot mock ───────────────────────────────────────── */
      .demo-screenshot-mock {
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255,80,80,0.35);
        background: rgba(20,10,10,0.6);
        max-width: 220px;
      }

      .demo-screenshot-bar {
        height: 8px;
        background: rgba(255,255,255,0.06);
        border-bottom: 1px solid rgba(255,255,255,0.06);
      }

      .demo-screenshot-content {
        padding: 10px 12px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }

      .demo-screenshot-error {
        color: #ff7070;
        font-size: 10.5px;
        font-weight: 700;
      }

      .demo-screenshot-detail {
        color: rgba(255,255,255,0.38);
        font-size: 9.5px;
        line-height: 1.4;
        font-family: 'SF Mono', 'Fira Code', monospace;
      }

      /* ── Input bar ─────────────────────────────────────────────── */
      .demo-input-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-top: 1px solid rgba(255,255,255,0.07);
        background: rgba(255,255,255,0.03);
      }

      .demo-attach-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.06);
        color: rgba(255,255,255,0.45);
        cursor: pointer;
        flex-shrink: 0;
        transition: color 200ms, background 200ms;
      }

      .demo-attach-btn:hover { color: #fff; background: rgba(255,255,255,0.10); }

      .demo-input-field {
        flex: 1;
        min-height: 30px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        border-radius: 8px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        font-size: 12px;
        color: rgba(255,255,255,0.88);
        overflow: hidden;
        white-space: nowrap;
      }

      .demo-input-text {
        display: inline-flex;
        align-items: center;
      }

      .demo-cursor {
        display: inline-block;
        width: 1.5px;
        height: 13px;
        background: rgba(255,255,255,0.75);
        margin-left: 1px;
        animation: cursorBlink 0.9s step-end infinite;
      }

      @keyframes cursorBlink {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0; }
      }

      .demo-input-placeholder {
        color: rgba(255,255,255,0.24);
      }

      .demo-send-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 9px;
        border: none;
        background: linear-gradient(135deg, #4f6ef7, #6366f1);
        color: #fff;
        cursor: pointer;
        flex-shrink: 0;
        transition: opacity 200ms, transform 200ms;
      }

      .demo-send-btn:hover { opacity: 0.85; transform: scale(1.05); }

      /* ── Voice overlay ─────────────────────────────────────────── */
      .demo-voice-overlay-wrap {
        position: absolute;
        inset: 0;
        border-radius: 22px;
        overflow: hidden;
        z-index: 50;
      }

      .voice-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: radial-gradient(ellipse at center, rgba(15,18,40,0.97) 0%, rgba(6,8,22,0.99) 100%);
        backdrop-filter: blur(24px);
      }

      .voice-close {
        position: absolute;
        top: 14px;
        right: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.14);
        background: rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.6);
        cursor: pointer;
        transition: color 180ms, background 180ms;
      }

      .voice-close:hover { color: #fff; background: rgba(255,255,255,0.12); }

      .voice-avatar {
        position: relative;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .voice-ring {
        position: absolute;
        border-radius: 999px;
        border: 1.5px solid rgba(99,102,241,0.5);
        animation: voicePulse 2.4s ease-out infinite;
      }

      .voice-ring--1 { inset: -8px;  animation-delay: 0ms; }
      .voice-ring--2 { inset: -16px; animation-delay: 600ms; }
      .voice-ring--3 { inset: -26px; animation-delay: 1200ms; }

      @keyframes voicePulse {
        0%   { opacity: 0.7; transform: scale(0.92); }
        100% { opacity: 0;   transform: scale(1.12); }
      }

      .voice-avatar > span {
        position: relative;
        z-index: 2;
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: linear-gradient(135deg, #4f6ef7, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22px;
        font-weight: 800;
        color: #fff;
        box-shadow: 0 8px 32px rgba(79,110,247,0.4);
      }

      .voice-name {
        margin: 0;
        color: #ffffff;
        font-size: 16px;
        font-weight: 700;
      }

      .voice-status {
        margin: 0;
        color: rgba(255,255,255,0.45);
        font-size: 11px;
        font-weight: 500;
      }

      .voice-waveform {
        display: flex;
        align-items: center;
        gap: 3px;
        height: 40px;
      }

      .voice-waveform span {
        display: block;
        width: 3px;
        border-radius: 3px;
        background: linear-gradient(180deg, #6366f1, #8b5cf6);
        transition: height 80ms ease;
        min-height: 4px;
      }

      .voice-end {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 14px;
        border: none;
        background: #ef4444;
        color: #fff;
        cursor: pointer;
        transition: opacity 200ms, transform 200ms;
        box-shadow: 0 6px 24px rgba(239,68,68,0.4);
        margin-top: 4px;
      }

      .voice-end:hover { opacity: 0.85; transform: scale(1.04); }

      /* ── Context pill ──────────────────────────────────────────── */
      .demo-context-pill {
        align-self: flex-end;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 7px 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(16px);
        color: rgba(255,255,255,0.70);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.02em;
        max-width: 430px;
      }

      /* ── Voice note bubble ─────────────────────────────────────── */
      .demo-voice-note {
        display: flex;
        align-items: center;
        gap: 7px;
        padding-top: 6px;
        color: rgba(255,255,255,0.55);
        font-size: 10px;
      }

      .demo-voice-bars {
        display: flex;
        align-items: center;
        gap: 2px;
        height: 16px;
      }

      .demo-voice-bars span {
        display: block;
        width: 2px;
        border-radius: 2px;
        background: rgba(255,255,255,0.45);
        min-height: 3px;
      }

      /* ── Old floating card styles (unused, kept for safety) ───── */
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

      .logo-strip {
        width: min(100% - 96px, 1240px);
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 24px 0 40px;
      }

      .logo-strip p {
        color: #77776f;
        font-size: 11px;
        line-height: 1.35;
        text-align: center;
      }

      .logos-marquee {
        width: 100vw;
        margin-left: calc(-50vw + 50%);
        overflow: hidden;
        position: relative;
      }

      .logos-marquee::before,
      .logos-marquee::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 120px;
        z-index: 1;
        pointer-events: none;
      }

      .logos-marquee::before {
        left: 0;
        background: linear-gradient(to right, #f7f7f4, transparent);
      }

      .logos-marquee::after {
        right: 0;
        background: linear-gradient(to left, #f7f7f4, transparent);
      }

      .logos-track {
        display: flex;
        gap: 64px;
        align-items: center;
        width: max-content;
        padding: 8px 0;
        animation: marqueeScroll 24s linear infinite;
      }

      .logos-track span {
        color: #74746d;
        font-size: 13px;
        font-weight: 800;
        white-space: nowrap;
        flex-shrink: 0;
      }

      @keyframes marqueeScroll {
        from { transform: translateX(0); }
        to { transform: translateX(-25%); }
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
        padding-top: 56px;
        padding-bottom: 56px;
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
        padding: 90px 64px;
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
        color: #ffffff;
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

        .cta-panel {
          width: 100%;
          padding: 64px 40px;
          border-radius: 20px;
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
          min-height: 520px;
          align-items: center;
        }

        .demo-window {
          width: 100%;
          max-width: 420px;
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
          align-items: flex-start;
        }

        .hero-visual {
          min-height: unset;
          align-items: center;
        }

        .demo-window {
          width: 100%;
          border-radius: 16px;
        }

        .demo-chrome {
          padding: 8px 12px;
        }

        .demo-tab {
          padding: 4px 8px;
          font-size: 10px;
        }

        .demo-chat-header {
          padding: 9px 12px;
        }

        .demo-agent-avatar {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          font-size: 11px;
        }

        .demo-agent-info strong {
          font-size: 11px;
        }

        .demo-agent-info span {
          font-size: 9px;
        }

        .demo-action-btn {
          width: 26px;
          height: 26px;
        }

        .demo-messages {
          min-height: 200px;
          max-height: 220px;
          padding: 12px 10px;
          gap: 9px;
        }

        .demo-bubble {
          font-size: 11.5px;
          padding: 8px 10px;
          max-width: 85%;
        }

        .demo-msg-avatar {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          font-size: 9px;
        }

        .demo-input-bar {
          padding: 8px 10px;
          gap: 6px;
        }

        .demo-input-field {
          font-size: 11px;
          min-height: 26px;
        }

        .demo-send-btn {
          width: 26px;
          height: 26px;
        }

        .demo-attach-btn {
          width: 26px;
          height: 26px;
        }

        .demo-context-pill {
          font-size: 10px;
          padding: 5px 11px;
        }

        .demo-system-label {
          font-size: 9px;
          padding: 3px 9px;
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

        .cta-panel {
          padding: 52px 24px;
          border-radius: 18px;
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
              <motion.h1 variants={revealUp}>
                Stop answering tickets. Start <span className="italic">preventing</span> them.
              </motion.h1>
              <motion.p className="hero-copy" variants={revealUp}>
                Every support tool you use waits for a complaint. Lira monitors your product's
                event stream, reaches out before problems escalate, and takes real action across
                your CRM, helpdesk, and Slack — without a human in the loop.
              </motion.p>
              <motion.div className="hero-actions" variants={revealUp}>
                <Link to="/signup" className="primary-cta">
                  Start free
                  <span className="cta-icon-circle">
                    <ArrowUpRight size={16} />
                  </span>
                </Link>
                <a href="mailto:hello@creovine.com" className="secondary-cta">
                  Book a demo
                  <span className="cta-icon-circle">
                    <ArrowUpRight size={16} />
                  </span>
                </a>
              </motion.div>
            </motion.div>
            <motion.div className="motion-layer" variants={revealUp}>
              <HeroChatDemo />
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
            SaaS teams replacing Intercom and Zendesk with Lira
          </motion.p>
          <div className="logos-marquee" aria-hidden="true">
            <div className="logos-track">
              {[...trustedBy, ...trustedBy, ...trustedBy, ...trustedBy].map((name, i) => (
                <span key={i}>{name}</span>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.section
          className="statement"
          variants={staggerGroup}
          initial="show"
          animate="show"
          viewport={viewportReveal}
        >
          <motion.span className="section-kicker motion-layer" variants={revealUp}>
            The problem
          </motion.span>
          <motion.h2 className="motion-layer" variants={revealUp}>
            Every tool you pay for makes you <span className="italic">wait for the complaint</span>.
          </motion.h2>
          <motion.p className="motion-layer" variants={revealUp}>
            Intercom, Zendesk, Freshdesk — they all do the same thing: sit idle until a customer
            says something broke. Lira connects to your product's event stream and acts before
            the frustration becomes a ticket — or a churn.
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
                Pricing model
              </motion.span>
              <motion.h2 className="motion-layer" variants={revealUp}>
                If Lira doesn't solve it, <strong>you don't pay</strong>.
              </motion.h2>
              <motion.p className="motion-layer" variants={revealUp}>
                Competitors charge per seat or per resolution — including failed ones. Lira charges
                only for verified outcomes. The incentive is permanently aligned.
              </motion.p>
            </motion.div>
            <motion.div className="metric-grid" variants={staggerGroup}>
              <motion.div
                className="metric-card dark motion-layer"
                variants={revealUp}
                whileHover={{ y: -5, scale: 1.01 }}
              >
                <p>
                  Deployed across onboarding flows, payment recovery, churn prevention, and
                  escalation chains — 7 in 10 tickets closed with zero human involvement.
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
                Built for lean SaaS teams that can't afford a 10-person support org — but can't
                afford to lose customers to slow, robotic service either.
              </motion.p>
            </motion.div>
            <motion.div variants={staggerGroup}>
              <motion.blockquote className="motion-layer" variants={revealUp}>
                &quot;We switched from Intercom and cut support spend by 60% in 30 days. Lira
                reached customers about failed payments before they even noticed — tickets dropped,
                retention went up.&quot;
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
              Live in 10 minutes
            </motion.span>
            <motion.h2 className="motion-layer" variants={revealUp}>
              One script tag. Your entire support stack, <span className="italic">automated</span>.
            </motion.h2>
            <motion.p className="motion-layer" variants={revealUp}>
              Connect your knowledge base, plug in your webhooks, and Lira is live in under 10
              minutes. No agent training. No playbook to write. No seat licenses.
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
