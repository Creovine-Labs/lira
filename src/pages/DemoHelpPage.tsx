import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { clearDemoProfile, PLAN_DETAILS, readDemoProfile, useDemoProfile } from '@/lib/demo-profile'
import { useLiraWidget } from '@/lib/demo-widget'

/**
 * Nimbus Help Center, the SDK full-page support surface.
 *
 * Three views, driven by `view` state (persisted to sessionStorage):
 *   • 'home'    → hero search, Browse help topics, Popular articles. No chat.
 *   • 'results' → keyword search over the knowledge base. Shows a "Chat with
 *                 Nimbus" prompt card, then the matching articles.
 *   • 'chat'    → the Lira-powered support chat (template + live CDN overlay).
 *
 * The chat panel is never deleted — it stays mounted (hidden) so its state and
 * the live widget survive view switches. Searching does NOT jump to chat: it
 * surfaces articles first, and the visitor opts into chat from the prompt card.
 *
 * KB search is currently a local keyword match (searchArticles). When the
 * backend KB endpoint is ready, swap the body of searchArticles for a fetch —
 * the call sites already treat it as the single source of results.
 *
 * Palette is Lira's own — cream paper, ink type, neutral grays. No blue.
 */

const SUPPORT_ROOT_SELECTOR = '#nimbus-support-root'
const FLOW_KEY = 'nimbus-help-flow'

const OPEN_TICKETS = [
  { id: 'NIM-1048', title: 'Invoice export questions', status: 'Waiting on customer' },
  { id: 'NIM-1042', title: 'QuickBooks sync review', status: 'Solved' },
  { id: 'NIM-1037', title: 'Billing owner changed', status: 'Solved' },
] as const

const POPULAR_LINKS = ['Subscription', 'Invoices', 'Change plan', 'Payment methods', 'Team seats']

const NUDGES = [
  'What plan am I on?',
  'Compare the Nimbus plans in a table.',
  'Change my card to a Mastercard ending 1234.',
]

const TOPICS = [
  {
    title: 'Billing & invoices',
    blurb: 'Read invoices, download receipts, and understand what you were charged.',
    query: 'invoices billing',
    icon: 'receipt',
  },
  {
    title: 'Plans & upgrades',
    blurb: 'Compare Free, Pro, Scale, and Enterprise — switch plans or change billing cycle.',
    query: 'plans upgrade subscription',
    icon: 'spark',
  },
  {
    title: 'Payment methods',
    blurb: 'Update the card on file, fix a declined payment, or change billing contact.',
    query: 'payment card',
    icon: 'card',
  },
  {
    title: 'Team & seats',
    blurb: 'Invite teammates, assign roles, and manage how many seats you pay for.',
    query: 'team seats',
    icon: 'people',
  },
  {
    title: 'Account & security',
    blurb: 'Sign-in settings, owner changes, and keeping your Nimbus account safe.',
    query: 'account security',
    icon: 'shield',
  },
] as const

// ── Knowledge base ──────────────────────────────────────────────────────────
// Stand-in for the customer's KB. Real customers' articles would be fetched.
interface KbArticle {
  id: string
  title: string
  category: string
  snippet: string
  body: string
  tags: string[]
}

const KB_ARTICLES: KbArticle[] = [
  {
    id: 'sub-overview',
    title: 'Understanding your subscription',
    category: 'Plans',
    snippet:
      'What a Nimbus subscription includes, how billing cycles work, and when you are charged.',
    body: 'Your Nimbus subscription gives your whole team access to the plan you selected, billed monthly per seat. The subscription renews automatically on your billing date — you can see the amount and date under Billing → Subscription. Changing plans is prorated against the current cycle.',
    tags: ['subscription', 'plan', 'billing', 'cycle', 'renew', 'amount'],
  },
  {
    id: 'sub-billing',
    title: 'How subscription billing and renewals work',
    category: 'Billing',
    snippet:
      'When invoices are generated, how renewals are charged, and how proration is calculated.',
    body: 'Each billing cycle Nimbus generates an invoice for your active seats and charges the card on file. Upgrades take effect immediately and are prorated; downgrades apply at the next renewal. If a charge fails, we retry for 7 days before pausing the subscription.',
    tags: ['subscription', 'billing', 'renewal', 'invoice', 'charge', 'proration', 'amount'],
  },
  {
    id: 'plan-compare',
    title: 'Comparing Free, Pro, Scale, and Enterprise plans',
    category: 'Plans',
    snippet: 'A side-by-side of what each plan includes and which subscription fits your team.',
    body: 'Free is for sandbox testing. Pro adds live customer-support automation for growing teams. Scale adds WhatsApp, advanced analytics exports, API/MCP access, and higher usage. Enterprise is for custom volume, security, and support requirements. You can switch subscription tiers from Settings → Subscription.',
    tags: [
      'plan',
      'upgrade',
      'pricing',
      'compare',
      'subscription',
      'free',
      'pro',
      'scale',
      'enterprise',
    ],
  },
  {
    id: 'card-update',
    title: 'Updating the payment card on your account',
    category: 'Payments',
    snippet: 'Replace the card on file, fix a declined payment, or change the billing contact.',
    body: 'Go to Billing → Payment method to add a new card, or just ask the Nimbus assistant to update it for you — share the brand, last four, and expiry and it updates instantly. The new card is used from your next renewal onward.',
    tags: ['card', 'payment', 'visa', 'mastercard', 'billing', 'declined'],
  },
  {
    id: 'invoices',
    title: 'Finding and downloading your invoices',
    category: 'Billing',
    snippet: 'Where to find every invoice and how to download a PDF receipt.',
    body: 'All invoices live under Billing → Invoices as downloadable PDFs. Each shows the amount, the seats billed, and the period covered. You can also ask the assistant for "my last invoice" to get the amount, date, and a download link.',
    tags: ['invoice', 'receipt', 'download', 'pdf', 'billing', 'amount'],
  },
  {
    id: 'seats',
    title: 'Managing team seats and teammates',
    category: 'Team',
    snippet: 'Invite or remove teammates and understand how seats affect your subscription.',
    body: 'You are billed per seat. Inviting a teammate adds a seat and adjusts your subscription automatically; removing one frees the seat at the end of the cycle. Manage everyone from Settings → Team.',
    tags: ['seat', 'team', 'teammate', 'member', 'billing', 'subscription'],
  },
  {
    id: 'cancel',
    title: 'Canceling or pausing your subscription',
    category: 'Plans',
    snippet: 'How to cancel, what happens to your data, and how refunds are handled.',
    body: 'You can cancel your subscription any time from Billing → Subscription. Access continues until the end of the paid period, and your data is retained for 30 days in case you return. Refunds for the current cycle are handled case by case — ask support.',
    tags: ['cancel', 'subscription', 'pause', 'refund', 'downgrade'],
  },
  {
    id: 'security',
    title: 'Account security and owner changes',
    category: 'Account',
    snippet: 'Reset sign-in, enable 2FA, and transfer account ownership safely.',
    body: 'Manage sign-in and two-factor authentication under Settings → Security. To transfer the billing owner, the current owner approves the change from Settings → Team. If you are locked out, the assistant can send a secure reset link.',
    tags: ['security', 'password', 'owner', 'account', 'login', '2fa'],
  },
  {
    id: 'refunds',
    title: 'Refunds and billing disputes',
    category: 'Billing',
    snippet: 'How to request a refund and what to do about an unexpected charge.',
    body: 'If a charge looks wrong, ask the assistant to pull up the invoice — most questions are answered instantly. For a refund or dispute, support reviews the charge and the subscription history and responds within one business day.',
    tags: ['refund', 'dispute', 'charge', 'billing', 'amount'],
  },
]

const STOPWORDS = new Set([
  'what',
  'is',
  'the',
  'a',
  'an',
  'to',
  'my',
  'how',
  'do',
  'i',
  'of',
  'for',
  'me',
  'on',
  'in',
  'can',
  'about',
  'and',
  'with',
  'are',
  'this',
  'that',
  'it',
])

/**
 * BACKEND SEAM — keyword search over the knowledge base.
 *
 * Today this is a local keyword scorer over KB_ARTICLES. To go live, replace
 * the body with a call to the KB search endpoint, e.g.
 *   const res = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}`)
 *   return (await res.json()).articles
 * and make the function async (call sites can await it).
 */
function searchArticles(query: string): KbArticle[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))

  if (tokens.length === 0) return KB_ARTICLES.slice(0, 5)

  const scored = KB_ARTICLES.map((article) => {
    const title = article.title.toLowerCase()
    const tags = article.tags.join(' ').toLowerCase()
    const body = article.body.toLowerCase()
    let score = 0
    for (const token of tokens) {
      if (title.includes(token)) score += 3
      if (tags.includes(token)) score += 2
      if (body.includes(token)) score += 1
    }
    return { article, score }
  })

  return scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.article)
}

interface ChatMsg {
  id: number
  role: 'ai' | 'user'
  text: string
}

type View = 'home' | 'results' | 'chat'

function readFlow(): { view: View; query: string; chatOpened: boolean } {
  try {
    const raw = JSON.parse(sessionStorage.getItem(FLOW_KEY) || '{}')
    const view: View = raw.view === 'results' || raw.view === 'chat' ? raw.view : 'home'
    return {
      view,
      query: typeof raw.query === 'string' ? raw.query : '',
      chatOpened: !!raw.chatOpened,
    }
  } catch {
    return { view: 'home', query: '', chatOpened: false }
  }
}

export function DemoHelpPage() {
  const profile = useDemoProfile()
  const navigate = useNavigate()

  // ── Flow state (lazily seeded from the persisted flow) ────────────────────
  const [view, setView] = useState<View>(() => readFlow().view)
  const [query, setQuery] = useState(() => readFlow().query)
  const [searchDraft, setSearchDraft] = useState(() => readFlow().query)
  // Once chat has been opened, keep the live widget enabled so its session and
  // our template conversation persist even when the visitor browses elsewhere.
  const [chatOpened, setChatOpened] = useState(() => readFlow().chatOpened)

  // The live CDN widget mounts only once chat has been opened (and stays).
  useLiraWidget({
    mode: 'fullscreen',
    target: SUPPORT_ROOT_SELECTOR,
    enabled: Boolean(profile) && chatOpened,
  })

  const firstName = profile ? profile.name.trim().split(/\s+/)[0] || profile.name : ''

  // ── In-panel chat template state ──────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    const seeded = readDemoProfile()
    const who = seeded ? seeded.name.trim().split(/\s+/)[0] || seeded.name : 'there'
    return [
      {
        id: 0,
        role: 'ai',
        text: `Hi ${who} 👋 I'm the Nimbus assistant, powered by Lira. I can see your account — ask me about your plan, invoices, or payment details.`,
      },
    ]
  })
  const [typing, setTyping] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const [showNudges, setShowNudges] = useState(true)
  const msgId = useRef(1)
  const bodyRef = useRef<HTMLDivElement>(null)
  const timers = useRef<number[]>([])

  // Persist the flow so a reload lands the visitor back where they were.
  useEffect(() => {
    try {
      sessionStorage.setItem(FLOW_KEY, JSON.stringify({ view, query, chatOpened }))
    } catch {
      /* storage unavailable — flow simply resets on reload */
    }
  }, [view, query, chatOpened])

  // Auto-scroll the conversation as it grows.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  // Clear any pending reply timers on unmount.
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  useEffect(() => {
    if (!profile) {
      if (window.location.hostname === 'demo.liraintelligence.com') {
        window.location.replace('https://liraintelligence.com/')
        return
      }
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  if (!profile) return null

  const plan = PLAN_DETAILS[profile.plan]
  const initials = profile.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  const cannedReply = (text: string): string => {
    const q = text.toLowerCase()
    if (q.includes('plan') && (q.includes('compare') || q.includes('table'))) {
      return `Here's a quick comparison:\n• Starter — $19/mo\n• Growth — $49/mo\n• Business — $129/mo\nYou're on ${plan.label} right now. Want me to switch you?`
    }
    if (q.includes('plan') || q.includes('subscription')) {
      return `You're on the ${plan.label} plan at $${plan.price}/mo. Your next invoice is ${profile.next_invoice_date}.`
    }
    if (
      q.includes('card') ||
      q.includes('payment') ||
      q.includes('mastercard') ||
      q.includes('visa')
    ) {
      return `Your card on file is ${profile.card.brand} ending ${profile.card.last4}. I can switch it — just confirm the new number, expiry, and CVC and I'll update it on the spot.`
    }
    if (q.includes('invoice') || q.includes('receipt')) {
      return `Your last invoice was $${profile.last_invoice_amount_usd} on ${profile.last_invoice_date}. I can email a PDF copy or pull up the next one due ${profile.next_invoice_date}.`
    }
    if (q.includes('seat') || q.includes('team')) {
      return `You're paying for ${profile.team_seats} seats. I can add or remove teammates and the billing adjusts automatically.`
    }
    return `Got it — let me help with that. I can see your ${plan.label} account, so ask me anything about billing, invoices, plans, or your team's seats.`
  }

  const askInChat = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setShowNudges(false)
    setChatDraft('')
    setMessages((prev) => [...prev, { id: msgId.current++, role: 'user', text: trimmed }])
    setTyping(true)
    const t = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: msgId.current++, role: 'ai', text: cannedReply(trimmed) },
      ])
      setTyping(false)
    }, 650)
    timers.current.push(t)
  }

  // ── Flow transitions ────────────────────────────────────────────────────
  const runSearch = (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuery(trimmed)
    setSearchDraft(trimmed)
    setView('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openChat = (seed?: string) => {
    setChatOpened(true)
    setView('chat')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (seed && seed.trim()) askInChat(seed)
  }

  const goHome = () => {
    setView('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSignOut = () => {
    clearDemoProfile()
    try {
      sessionStorage.removeItem(FLOW_KEY)
    } catch {
      /* ignore */
    }
    if (window.location.hostname === 'demo.liraintelligence.com') {
      window.location.replace('https://liraintelligence.com/')
      return
    }
    navigate('/', { replace: true })
  }

  const results = view === 'results' ? searchArticles(query) : []

  return (
    <div className="nhc-root">
      <SEO
        title="Nimbus Help Center"
        description="Nimbus help center powered by the Lira full-page support SDK."
        path="/demo/help"
        noIndex
      />

      {/* ---------- Top bar ---------- */}
      <header className="nhc-topbar">
        <div className="nhc-topbar-inner">
          <div className="nhc-brand">
            <button
              type="button"
              className="nhc-brand-mark"
              aria-label="Nimbus Help Center home"
              onClick={goHome}
            >
              N
            </button>
            <button type="button" className="nhc-brand-text" onClick={goHome}>
              <span className="nhc-brand-name">Nimbus</span>
              <span className="nhc-brand-sub">Help Center</span>
            </button>
            <nav className="nhc-nav">
              <button type="button" className="nhc-nav-link" onClick={goHome}>
                Help topics
              </button>
              <button type="button" className="nhc-nav-link" onClick={goHome}>
                Popular articles
              </button>
            </nav>
          </div>

          <div className="nhc-topbar-right">
            <a href="/demo" className="nhc-ghost-btn">
              Widget demo
            </a>
            <button type="button" className="nhc-ghost-btn" onClick={() => openChat()}>
              <TicketIcon />
              <span className="nhc-ghost-label">My tickets</span>
              <span className="nhc-count">{OPEN_TICKETS.length}</span>
            </button>
            <div className="nhc-account">
              <span className="nhc-avatar">{initials}</span>
              <span className="nhc-account-name">{firstName}</span>
            </div>
            <button type="button" className="nhc-solid-btn" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ---------- Status strip ---------- */}
      <div className="nhc-status">
        <div className="nhc-status-inner">
          <span className="nhc-status-left">
            <span className="nhc-dot" />
            <strong>Nimbus is fictional.</strong>
            <span className="nhc-status-muted">
              A customer-owned support page, running on Lira infrastructure.
            </span>
          </span>
          <span className="nhc-powered">
            <img src="/lira_logo.png" alt="" className="nhc-powered-mark" />
            Powered by Lira
          </span>
        </div>
      </div>

      {/* ---------- Hero (hidden in chat view) ---------- */}
      {view !== 'chat' && (
        <section className="nhc-hero">
          <div className="nhc-hero-glow" aria-hidden="true" />
          <div className="nhc-hero-inner">
            <h1 className="nhc-hero-title">Hello {firstName}, what can we help with?</h1>
            <form
              className="nhc-search"
              onSubmit={(e) => {
                e.preventDefault()
                runSearch(searchDraft)
              }}
            >
              <SearchIcon />
              <input
                type="text"
                className="nhc-search-input"
                placeholder="Search help articles — e.g. what is the subscription"
                aria-label="Search the help center"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
              />
              <button type="submit" className="nhc-search-btn">
                Search
              </button>
            </form>
            <div className="nhc-popular">
              <span className="nhc-popular-label">Popular:</span>
              {POPULAR_LINKS.map((link) => (
                <button
                  key={link}
                  type="button"
                  className="nhc-chip"
                  onClick={() => runSearch(link)}
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Main ---------- */}
      <main className="nhc-main">
        {/* Breadcrumb for non-home views */}
        {view !== 'home' && (
          <div className="nhc-crumb">
            <button type="button" className="nhc-back" onClick={goHome}>
              <BackIcon />
              Help center
            </button>
            {view === 'results' && (
              <span className="nhc-crumb-label">
                {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
              </span>
            )}
            {view === 'chat' && <span className="nhc-crumb-label">Chat with Nimbus</span>}
          </div>
        )}

        {/* HOME ───────────────────────────────────────────── */}
        {view === 'home' && (
          <>
            <section id="topics" className="nhc-section nhc-section-first">
              <div className="nhc-section-head">
                <h2 className="nhc-section-title">Browse help topics</h2>
                <p className="nhc-section-sub">
                  Pick a topic to see related articles, or ask the assistant directly.
                </p>
              </div>
              <div className="nhc-topics">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.title}
                    type="button"
                    className="nhc-topic"
                    onClick={() => runSearch(topic.query)}
                  >
                    <span className="nhc-topic-icon">
                      <TopicIcon name={topic.icon} />
                    </span>
                    <span className="nhc-topic-title">{topic.title}</span>
                    <span className="nhc-topic-blurb">{topic.blurb}</span>
                    <span className="nhc-topic-cta">
                      View articles
                      <ArrowIcon />
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section id="articles" className="nhc-section">
              <div className="nhc-section-head">
                <h2 className="nhc-section-title">Popular articles</h2>
                <p className="nhc-section-sub">The questions Nimbus customers ask most.</p>
              </div>
              <div className="nhc-articles">
                {KB_ARTICLES.slice(0, 5).map((article) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    onAsk={() => openChat(article.title)}
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {/* RESULTS ─────────────────────────────────────────── */}
        {view === 'results' && (
          <div className="nhc-results">
            {/* Chat-with-Nimbus prompt — the opt-in into the support chat */}
            <div className="nhc-chatprompt">
              <span className="nhc-chatprompt-mark">
                <img src="/lira_logo.png" alt="" />
              </span>
              <div className="nhc-chatprompt-text">
                <strong>Chat with Nimbus</strong>
                <span>
                  Prefer a direct answer? The assistant can see your account and resolve it in
                  seconds.
                </span>
              </div>
              <button type="button" className="nhc-chatprompt-btn" onClick={() => openChat(query)}>
                Chat with Nimbus
                <ArrowIcon />
              </button>
            </div>

            {results.length > 0 ? (
              <div className="nhc-articles">
                {results.map((article) => (
                  <ArticleItem
                    key={article.id}
                    article={article}
                    showCategory
                    onAsk={() => openChat(article.title)}
                  />
                ))}
              </div>
            ) : (
              <div className="nhc-empty">
                <h3>No articles matched “{query}”.</h3>
                <p>Try different keywords, or let the assistant help you directly.</p>
                <button
                  type="button"
                  className="nhc-chatprompt-btn"
                  onClick={() => openChat(query)}
                >
                  Ask the Nimbus assistant
                  <ArrowIcon />
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHAT (always mounted, hidden unless active) ───────── */}
        <div className="nhc-grid" hidden={view !== 'chat'}>
          <section className="nhc-chatcard">
            <div className="nhc-chat">
              <div className="nhc-c-header">
                <div className="nhc-c-ava">N</div>
                <div className="nhc-c-info">
                  <div className="nhc-c-title">Nimbus Support</div>
                  <div className="nhc-c-sub">
                    <span className="nhc-c-dot" /> Online · Powered by Lira
                  </div>
                </div>
                <span className="nhc-c-badge">Live</span>
              </div>

              <div className="nhc-c-body" ref={bodyRef}>
                {messages.map((m) =>
                  m.role === 'ai' ? (
                    <div key={m.id} className="nhc-c-row">
                      <span className="nhc-c-ava-sm">
                        <img src="/lira_logo.png" alt="Lira" />
                      </span>
                      <div className="nhc-c-bubble ai">{m.text}</div>
                    </div>
                  ) : (
                    <div key={m.id} className="nhc-c-bubble user">
                      {m.text}
                    </div>
                  )
                )}

                {typing && (
                  <div className="nhc-c-row">
                    <span className="nhc-c-ava-sm">
                      <img src="/lira_logo.png" alt="Lira" />
                    </span>
                    <div className="nhc-c-bubble ai nhc-c-typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                )}
              </div>

              {showNudges && (
                <div className="nhc-c-suggest">
                  {NUDGES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      className="nhc-c-chip"
                      onClick={() => askInChat(n)}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}

              <form
                className="nhc-c-composer"
                onSubmit={(e) => {
                  e.preventDefault()
                  askInChat(chatDraft)
                }}
              >
                <input
                  type="text"
                  className="nhc-c-input"
                  placeholder="Message Nimbus Support…"
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  aria-label="Message Nimbus Support"
                />
                <button
                  type="submit"
                  className="nhc-c-send"
                  aria-label="Send"
                  disabled={!chatDraft.trim()}
                >
                  <SendIcon />
                </button>
              </form>

              {/* Live CDN widget mounts here and overlays the template in prod */}
              <div
                id="nimbus-support-root"
                className="nhc-chat-live"
                aria-label="Nimbus support conversation"
              />
            </div>
          </section>

          <aside className="nhc-aside">
            <section className="nhc-card">
              <h2 className="nhc-card-title">Your account</h2>
              <div className="nhc-context">
                <ContextRow label="Plan" value={plan.label} hint={`$${plan.price}/mo`} />
                <ContextRow
                  label="Next invoice"
                  value={profile.next_invoice_date}
                  hint={`Last $${profile.last_invoice_amount_usd}`}
                />
                <ContextRow
                  label="Card"
                  value={`${profile.card.brand} ···· ${profile.card.last4}`}
                  hint={profile.subscription_status === 'active' ? 'Active' : 'Canceled'}
                />
                <ContextRow label="Team" value={`${profile.team_seats} seats`} hint="" />
              </div>
            </section>

            <section className="nhc-card">
              <div className="nhc-card-head">
                <h2 className="nhc-card-title">Your tickets</h2>
                <span className="nhc-tag">Demo</span>
              </div>
              <ul className="nhc-tickets">
                {OPEN_TICKETS.map((ticket) => (
                  <li key={ticket.id}>
                    <button type="button" className="nhc-ticket">
                      <span className="nhc-ticket-top">
                        <span className="nhc-ticket-id">{ticket.id}</span>
                        <span
                          className={`nhc-ticket-status ${
                            ticket.status === 'Solved' ? 'is-solved' : ''
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </span>
                      <span className="nhc-ticket-title">{ticket.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="nhc-footer">
        <div className="nhc-footer-inner">
          <span className="nhc-footer-brand">
            <img src="/lira_logo.png" alt="Lira" className="nhc-footer-mark" />
            Powered by <strong>Lira</strong>
          </span>
          <span className="nhc-footer-note">
            This help center is a demo of the Lira full-page support SDK. Nimbus is fictional.
          </span>
        </div>
      </footer>

      <style>{styles}</style>
    </div>
  )
}

/* ----------------------------- subcomponents ----------------------------- */

function ArticleItem({
  article,
  onAsk,
  showCategory = false,
}: {
  article: KbArticle
  onAsk: () => void
  showCategory?: boolean
}) {
  return (
    <details className="nhc-article">
      <summary className="nhc-article-summary">
        <span className="nhc-article-plus" aria-hidden="true">
          <PlusIcon />
        </span>
        <span className="nhc-article-main">
          <span className="nhc-article-q">{article.title}</span>
          <span className="nhc-article-snippet">{article.snippet}</span>
        </span>
        {showCategory && <span className="nhc-article-cat">{article.category}</span>}
      </summary>
      <div className="nhc-article-body">
        <p>{article.body}</p>
        <button type="button" className="nhc-article-ask" onClick={onAsk}>
          Ask the support agent
          <ArrowIcon />
        </button>
      </div>
    </details>
  )
}

function ContextRow({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="nhc-context-row">
      <span className="nhc-context-label">{label}</span>
      <span className="nhc-context-value">
        {value}
        {hint && <span className="nhc-context-hint">{hint}</span>}
      </span>
    </div>
  )
}

/* -------------------------------- icons ---------------------------------- */

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-search-icon" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-icon-sm" aria-hidden="true">
      <path
        d="M19 12H5m6 6-6-6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-icon-sm" aria-hidden="true">
      <path
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-icon-sm" aria-hidden="true">
      <path d="M4 12 20 4l-6 16-3.5-6.5L4 12Z" fill="currentColor" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-icon-sm" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="nhc-icon-sm" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

function TopicIcon({ name }: { name: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    className: 'nhc-icon',
    'aria-hidden': true as const,
  }
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  switch (name) {
    case 'receipt':
      return (
        <svg {...common}>
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" {...stroke} />
          <path d="M9 8h6M9 12h6" {...stroke} />
        </svg>
      )
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" {...stroke} />
        </svg>
      )
    case 'card':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="2" {...stroke} />
          <path d="M3 10h18M7 15h4" {...stroke} />
        </svg>
      )
    case 'people':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" {...stroke} />
          <path d="M3 19a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6m1.5 6a5 5 0 0 1 3.5 1.2" {...stroke} />
        </svg>
      )
    case 'plug':
      return (
        <svg {...common}>
          <path d="M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0V8ZM12 16v5" {...stroke} />
        </svg>
      )
    case 'shield':
    default:
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" {...stroke} />
          <path d="m9 12 2 2 4-4" {...stroke} />
        </svg>
      )
  }
}

/* -------------------------------- styles --------------------------------- */

const styles = `
  .nhc-root {
    --ink: #0b0d12;
    --ink-2: #202527;
    --ink-soft: #4b5160;
    --ink-faint: #8a90a0;
    --cream: #fbfaf6;
    --paper: #ffffff;
    --line: rgba(11, 13, 18, 0.10);
    --line-soft: rgba(11, 13, 18, 0.06);
    --fill: #f1efe9;
    --fill-2: #e7e4db;
    --gray-700: #41464f;
    min-height: 100vh;
    background: var(--cream);
    color: var(--ink);
    font-family: "Plus Jakarta Sans", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .nhc-root *, .nhc-root *::before, .nhc-root *::after { box-sizing: border-box; }
  .nhc-root button { font-family: inherit; cursor: pointer; }
  .nhc-root [hidden] { display: none !important; }

  /* Top bar */
  .nhc-topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    background: rgba(251, 250, 246, 0.85);
    border-bottom: 1px solid var(--line);
    backdrop-filter: blur(10px);
  }
  .nhc-topbar-inner {
    max-width: 1180px;
    margin: 0 auto;
    padding: 12px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .nhc-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .nhc-brand-mark {
    display: grid;
    place-items: center;
    width: 38px; height: 38px;
    flex: none;
    border: 0;
    border-radius: 11px;
    color: #fff;
    font-size: 18px; font-weight: 800; letter-spacing: -0.02em;
    background: linear-gradient(150deg, var(--ink-2) 0%, var(--ink) 100%);
    box-shadow: 0 6px 16px rgba(11, 13, 18, 0.24);
  }
  .nhc-brand-text {
    display: flex; flex-direction: column; line-height: 1.1;
    background: none; border: 0; padding: 0; text-align: left;
  }
  .nhc-brand-name { font-size: 16px; font-weight: 800; letter-spacing: -0.01em; }
  .nhc-brand-sub { font-size: 11.5px; font-weight: 600; color: var(--ink-faint); }
  .nhc-nav { display: flex; gap: 4px; margin-left: 10px; }
  .nhc-nav-link {
    padding: 7px 12px;
    font-size: 13.5px; font-weight: 600;
    color: var(--ink-soft);
    background: none; border: 0;
    border-radius: 8px;
    transition: background 0.15s ease, color 0.15s ease;
  }
  .nhc-nav-link:hover { background: var(--line-soft); color: var(--ink); }

  .nhc-topbar-right { display: flex; align-items: center; gap: 8px; }
  .nhc-ghost-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 13px;
    font-size: 13.5px; font-weight: 600;
    color: var(--ink-soft);
    text-decoration: none;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 9px;
    transition: border-color 0.15s ease, color 0.15s ease, transform 0.15s ease;
  }
  .nhc-ghost-btn:hover { color: var(--ink); border-color: rgba(11,13,18,0.22); transform: translateY(-1px); }
  .nhc-count {
    display: inline-grid; place-items: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    font-size: 11px; font-weight: 800;
    color: var(--ink);
    background: var(--fill);
    border-radius: 999px;
  }
  .nhc-account {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 4px 12px 4px 4px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 999px;
  }
  .nhc-avatar {
    display: grid; place-items: center;
    width: 28px; height: 28px;
    font-size: 11.5px; font-weight: 800; color: #fff;
    background: linear-gradient(150deg, var(--ink-2), var(--ink));
    border-radius: 999px;
  }
  .nhc-account-name { font-size: 13.5px; font-weight: 700; }
  .nhc-solid-btn {
    padding: 8px 15px;
    font-size: 13.5px; font-weight: 700;
    color: var(--cream);
    background: var(--ink);
    border: 0; border-radius: 9px;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .nhc-solid-btn:hover { background: var(--ink-2); transform: translateY(-1px); }

  /* Status strip */
  .nhc-status { border-bottom: 1px solid var(--line); background: var(--paper); }
  .nhc-status-inner {
    max-width: 1180px; margin: 0 auto;
    padding: 9px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    font-size: 12.5px;
    flex-wrap: wrap;
  }
  .nhc-status-left { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
  .nhc-dot {
    width: 8px; height: 8px; border-radius: 999px;
    background: #f59e0b; flex: none;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.18);
  }
  .nhc-status-muted { color: var(--ink-faint); }
  .nhc-powered {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 700; color: var(--ink-soft);
  }
  .nhc-powered-mark { width: 16px; height: 16px; object-fit: contain; }

  /* Hero — neutral gray gradient (no blue) */
  .nhc-hero {
    position: relative;
    overflow: hidden;
    background:
      radial-gradient(120% 120% at 80% -10%, rgba(255, 255, 255, 0.10), transparent 55%),
      linear-gradient(140deg, #23262b 0%, #3a3f47 52%, #565e6b 100%);
    color: #fff;
  }
  .nhc-hero-glow {
    position: absolute; inset: 0;
    background: radial-gradient(38% 60% at 15% 120%, rgba(255, 255, 255, 0.12), transparent 70%);
    pointer-events: none;
  }
  .nhc-hero-inner {
    position: relative;
    max-width: 820px;
    margin: 0 auto;
    padding: 64px 24px 60px;
    text-align: center;
  }
  .nhc-hero-title {
    margin: 0 0 26px;
    font-size: clamp(26px, 4vw, 40px);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .nhc-search {
    display: flex; align-items: center; gap: 8px;
    background: var(--paper);
    border-radius: 14px;
    padding: 7px 7px 7px 16px;
    box-shadow: 0 24px 60px rgba(11, 13, 18, 0.35);
  }
  .nhc-search-icon { width: 20px; height: 20px; color: var(--ink-faint); flex: none; }
  .nhc-search-input {
    flex: 1; min-width: 0;
    border: 0; outline: none; background: transparent;
    font-family: inherit; font-size: 15.5px; color: var(--ink);
    padding: 8px 4px;
  }
  .nhc-search-input::placeholder { color: var(--ink-faint); }
  .nhc-search-btn {
    flex: none;
    padding: 11px 20px;
    font-size: 14px; font-weight: 700; color: #fff;
    background: var(--ink);
    border: 0; border-radius: 10px;
    transition: background 0.15s ease;
  }
  .nhc-search-btn:hover { background: var(--ink-2); }
  .nhc-popular {
    display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
    gap: 8px; margin-top: 18px;
  }
  .nhc-popular-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.72); }
  .nhc-chip {
    padding: 6px 13px;
    font-size: 13px; font-weight: 600; color: #fff;
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 999px;
    transition: background 0.15s ease, transform 0.15s ease;
  }
  .nhc-chip:hover { background: rgba(255, 255, 255, 0.22); transform: translateY(-1px); }

  /* Main layout */
  .nhc-main { max-width: 1180px; margin: 0 auto; padding: 36px 24px 8px; }

  /* Breadcrumb */
  .nhc-crumb {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 22px;
    flex-wrap: wrap;
  }
  .nhc-back {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 13px;
    font-size: 13.5px; font-weight: 700; color: var(--ink);
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 9px;
    transition: border-color 0.15s ease, transform 0.15s ease;
  }
  .nhc-back:hover { border-color: rgba(11,13,18,0.22); transform: translateX(-2px); }
  .nhc-crumb-label { font-size: 14px; font-weight: 600; color: var(--ink-soft); }

  /* Chat layout */
  .nhc-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 332px;
    gap: 22px;
    align-items: start;
  }

  .nhc-chatcard {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 18px;
    box-shadow: 0 12px 32px rgba(11, 13, 18, 0.06);
    overflow: hidden;
  }
  .nhc-chat {
    position: relative;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 220px);
    min-height: 600px;
    background: var(--paper);
  }
  .nhc-chat-live { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
  .nhc-chat-live:not(:empty) { pointer-events: auto; background: var(--paper); }

  .nhc-c-header {
    flex: none;
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px;
    color: #fff;
    background: linear-gradient(135deg, var(--ink-2) 0%, var(--ink) 100%);
  }
  .nhc-c-ava {
    display: grid; place-items: center;
    width: 36px; height: 36px; flex: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    font-size: 15px; font-weight: 800;
  }
  .nhc-c-info { flex: 1; min-width: 0; }
  .nhc-c-title { font-size: 15px; font-weight: 700; line-height: 1.2; }
  .nhc-c-sub {
    display: flex; align-items: center; gap: 5px;
    margin-top: 2px; font-size: 11px; opacity: 0.85;
  }
  .nhc-c-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; flex: none; }
  .nhc-c-badge {
    flex: none;
    padding: 4px 9px;
    font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    color: #fff;
    background: rgba(255, 255, 255, 0.16);
    border-radius: 999px;
  }

  .nhc-c-body {
    flex: 1; min-height: 0;
    overflow-y: auto;
    padding: 18px 16px;
    display: flex; flex-direction: column; gap: 12px;
    background:
      radial-gradient(120% 60% at 50% 0%, rgba(11,13,18,0.015), transparent 60%),
      var(--paper);
  }
  .nhc-c-row { display: flex; align-items: flex-start; gap: 8px; }
  .nhc-c-ava-sm {
    width: 28px; height: 28px; flex: none;
    border-radius: 50%;
    background: var(--fill);
    display: grid; place-items: center;
    overflow: hidden; padding: 4px;
    margin-top: 2px;
  }
  .nhc-c-ava-sm img { width: 100%; height: 100%; object-fit: contain; }
  .nhc-c-bubble {
    max-width: 78%;
    padding: 10px 13px;
    font-size: 14px; line-height: 1.5;
    border-radius: 16px;
    white-space: pre-line;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(11, 13, 18, 0.04);
  }
  .nhc-c-bubble.ai {
    align-self: flex-start;
    background: #ffffff;
    color: #15171c;
    border: 1px solid #e7e5df;
    border-bottom-left-radius: 4px;
  }
  .nhc-c-bubble.user {
    align-self: flex-end;
    background: var(--ink);
    color: #fff;
    border-bottom-right-radius: 4px;
    box-shadow: 0 6px 14px rgba(11, 13, 18, 0.14);
  }
  .nhc-c-typing { display: inline-flex; gap: 4px; align-items: center; }
  .nhc-c-typing span {
    width: 6px; height: 6px; border-radius: 50%; background: #b9bdc6;
    animation: nhc-bounce 1.1s infinite ease-in-out;
  }
  .nhc-c-typing span:nth-child(2) { animation-delay: 0.15s; }
  .nhc-c-typing span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes nhc-bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
    40% { transform: translateY(-4px); opacity: 1; }
  }

  .nhc-c-suggest {
    flex: none;
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 8px 14px 4px;
    background: var(--paper);
    border-top: 1px solid var(--line-soft);
  }
  .nhc-c-chip {
    display: inline-flex; align-items: center;
    padding: 6px 12px;
    font-size: 12px; font-weight: 600;
    color: var(--ink-soft);
    background: var(--fill);
    border: 1px solid var(--line);
    border-radius: 999px;
    transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
  }
  .nhc-c-chip:hover { background: var(--ink); color: #fff; border-color: var(--ink); }
  .nhc-c-chip:active { transform: scale(0.97); }

  .nhc-c-composer {
    flex: none;
    display: flex; align-items: center; gap: 8px;
    padding: 12px 14px;
    border-top: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.96);
  }
  .nhc-c-input {
    flex: 1; min-width: 0;
    padding: 10px 13px;
    font-family: inherit; font-size: 14px; color: var(--ink);
    background: var(--fill);
    border: 1px solid var(--line);
    border-radius: 14px;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  }
  .nhc-c-input:focus {
    border-color: var(--ink);
    background: #fff;
    box-shadow: 0 0 0 3px rgba(11, 13, 18, 0.08);
  }
  .nhc-c-input::placeholder { color: var(--ink-faint); }
  .nhc-c-send {
    width: 38px; height: 38px; flex: none;
    display: grid; place-items: center;
    color: #fff;
    background: var(--ink);
    border: 0; border-radius: 50%;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .nhc-c-send:hover:not(:disabled) { transform: translateY(-1px); }
  .nhc-c-send:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Aside cards */
  .nhc-aside { display: flex; flex-direction: column; gap: 18px; }
  .nhc-card {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 8px 24px rgba(11, 13, 18, 0.05);
  }
  .nhc-card-head { display: flex; align-items: center; justify-content: space-between; }
  .nhc-card-title { margin: 0; font-size: 13.5px; font-weight: 800; letter-spacing: -0.01em; }
  .nhc-tag {
    padding: 3px 9px; font-size: 10.5px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.04em; color: var(--ink-faint);
    background: var(--line-soft); border-radius: 999px;
  }
  .nhc-context { margin-top: 12px; display: flex; flex-direction: column; gap: 11px; }
  .nhc-context-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
  .nhc-context-label { font-size: 13px; color: var(--ink-faint); }
  .nhc-context-value {
    display: flex; align-items: baseline; gap: 7px;
    font-size: 13.5px; font-weight: 700; text-align: right; min-width: 0;
  }
  .nhc-context-hint { font-size: 11.5px; font-weight: 600; color: var(--ink-faint); }

  .nhc-tickets { list-style: none; margin: 6px 0 0; padding: 0; }
  .nhc-tickets li + li { border-top: 1px solid var(--line-soft); }
  .nhc-ticket {
    width: 100%; text-align: left;
    background: transparent; border: 0;
    padding: 11px 8px; margin: 0 -8px;
    border-radius: 10px;
    display: flex; flex-direction: column; gap: 5px;
    transition: background 0.15s ease;
  }
  .nhc-ticket:hover { background: var(--line-soft); }
  .nhc-ticket-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .nhc-ticket-id {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; font-weight: 700; color: var(--ink-faint);
  }
  .nhc-ticket-status { font-size: 11.5px; font-weight: 600; color: #b45309; }
  .nhc-ticket-status.is-solved { color: #047857; }
  .nhc-ticket-title { font-size: 13.5px; font-weight: 600; color: var(--ink); }

  /* Sections (home) */
  .nhc-section { margin-top: 44px; }
  .nhc-section-first { margin-top: 4px; }
  .nhc-section-head { margin-bottom: 18px; }
  .nhc-section-title { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
  .nhc-section-sub { margin: 6px 0 0; font-size: 14px; color: var(--ink-soft); }

  /* Topic cards */
  .nhc-topics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
  }
  .nhc-topic {
    display: flex; flex-direction: column; align-items: flex-start; gap: 10px;
    text-align: left;
    padding: 20px;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
  }
  .nhc-topic:hover {
    border-color: rgba(11, 13, 18, 0.22);
    transform: translateY(-3px);
    box-shadow: 0 16px 36px rgba(11, 13, 18, 0.10);
  }
  .nhc-topic-icon {
    display: grid; place-items: center;
    width: 42px; height: 42px;
    color: var(--ink);
    background: var(--fill);
    border-radius: 12px;
  }
  .nhc-topic-title { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
  .nhc-topic-blurb { font-size: 13px; line-height: 1.5; color: var(--ink-soft); }
  .nhc-topic-cta {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 2px;
    font-size: 13px; font-weight: 700; color: var(--ink);
  }
  .nhc-topic:hover .nhc-topic-cta { gap: 8px; }

  /* Results view */
  .nhc-results { display: flex; flex-direction: column; gap: 18px; }
  .nhc-chatprompt {
    display: flex; align-items: center; gap: 16px;
    padding: 18px 20px;
    background: linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%);
    color: #fff;
    border-radius: 16px;
    box-shadow: 0 16px 36px rgba(11, 13, 18, 0.16);
  }
  .nhc-chatprompt-mark {
    display: grid; place-items: center;
    width: 44px; height: 44px; flex: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.12);
    padding: 8px;
  }
  .nhc-chatprompt-mark img { width: 100%; height: 100%; object-fit: contain; }
  .nhc-chatprompt-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .nhc-chatprompt-text strong { font-size: 15.5px; font-weight: 800; }
  .nhc-chatprompt-text span { font-size: 13px; color: rgba(255, 255, 255, 0.78); line-height: 1.45; }
  .nhc-chatprompt-btn {
    flex: none;
    display: inline-flex; align-items: center; gap: 6px;
    padding: 11px 18px;
    font-size: 14px; font-weight: 700; color: var(--ink);
    background: #fff;
    border: 0; border-radius: 10px;
    transition: gap 0.15s ease, transform 0.15s ease;
  }
  .nhc-chatprompt-btn:hover { gap: 9px; transform: translateY(-1px); }

  .nhc-empty {
    padding: 40px 24px;
    text-align: center;
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
  }
  .nhc-empty h3 { margin: 0 0 6px; font-size: 17px; font-weight: 800; }
  .nhc-empty p { margin: 0 0 16px; font-size: 14px; color: var(--ink-soft); }
  .nhc-empty .nhc-chatprompt-btn { color: #fff; background: var(--ink); }

  /* Articles accordion */
  .nhc-articles {
    background: var(--paper);
    border: 1px solid var(--line);
    border-radius: 16px;
    overflow: hidden;
  }
  .nhc-article { border-bottom: 1px solid var(--line-soft); }
  .nhc-article:last-child { border-bottom: 0; }
  .nhc-article-summary {
    display: flex; align-items: flex-start; gap: 13px;
    padding: 18px 20px;
    list-style: none; cursor: pointer;
    transition: background 0.15s ease;
  }
  .nhc-article-summary::-webkit-details-marker { display: none; }
  .nhc-article-summary:hover { background: var(--line-soft); }
  .nhc-article-plus {
    display: grid; place-items: center;
    width: 26px; height: 26px; flex: none;
    margin-top: 1px;
    color: var(--ink);
    background: var(--fill);
    border-radius: 8px;
    transition: transform 0.2s ease;
  }
  .nhc-article[open] .nhc-article-plus { transform: rotate(45deg); }
  .nhc-article-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .nhc-article-q { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
  .nhc-article-snippet { font-size: 13px; color: var(--ink-faint); line-height: 1.45; }
  .nhc-article-cat {
    flex: none;
    align-self: flex-start;
    padding: 3px 9px;
    font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;
    color: var(--ink-soft);
    background: var(--fill);
    border-radius: 999px;
  }
  .nhc-article-body {
    padding: 0 20px 20px 59px;
    font-size: 14px; line-height: 1.6; color: var(--ink-soft);
  }
  .nhc-article-body p { margin: 0; }
  .nhc-article-ask {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 12px;
    padding: 8px 14px;
    font-size: 13px; font-weight: 700; color: var(--ink);
    background: var(--fill);
    border: 1px solid var(--line);
    border-radius: 9px;
    transition: gap 0.15s ease, background 0.15s ease;
  }
  .nhc-article-ask:hover { gap: 9px; background: var(--fill-2); }

  /* Footer */
  .nhc-footer { margin-top: 52px; border-top: 1px solid var(--line); background: var(--paper); }
  .nhc-footer-inner {
    max-width: 1180px; margin: 0 auto;
    padding: 22px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    flex-wrap: wrap;
  }
  .nhc-footer-brand {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: var(--ink-soft);
  }
  .nhc-footer-brand strong { color: var(--ink); font-weight: 800; }
  .nhc-footer-mark { width: 20px; height: 20px; object-fit: contain; }
  .nhc-footer-note { font-size: 12.5px; color: var(--ink-faint); }

  /* Icons */
  .nhc-icon { width: 22px; height: 22px; }
  .nhc-icon-sm { width: 16px; height: 16px; }

  /* Responsive */
  @media (max-width: 960px) {
    .nhc-grid { grid-template-columns: minmax(0, 1fr); }
    .nhc-chat { height: 72vh; min-height: 520px; }
    .nhc-topics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .nhc-nav { display: none; }
  }
  @media (max-width: 640px) {
    .nhc-topbar-inner { padding: 10px 16px; flex-wrap: wrap; gap: 10px; }
    .nhc-account-name, .nhc-ghost-label { display: none; }
    .nhc-status-inner { padding: 9px 16px; }
    .nhc-status-muted { display: none; }
    .nhc-hero-inner { padding: 46px 18px 44px; }
    .nhc-search { flex-wrap: wrap; }
    .nhc-search-btn { width: 100%; }
    .nhc-main { padding: 26px 16px 8px; }
    .nhc-topics { grid-template-columns: minmax(0, 1fr); }
    .nhc-chatprompt { flex-direction: column; align-items: flex-start; }
    .nhc-chatprompt-btn { width: 100%; justify-content: center; }
    .nhc-article-body { padding-left: 20px; }
    .nhc-footer-inner { padding: 20px 16px; }
  }
`
