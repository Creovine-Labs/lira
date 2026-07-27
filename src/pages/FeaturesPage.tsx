import {
  BellRinging,
  Browsers,
  ChatCircleText,
  Database,
  DeviceMobile,
  IdentificationCard,
  Lifebuoy,
  Microphone,
  PlugsConnected,
  ShieldCheck,
  Ticket,
  TreeStructure,
  UserFocus,
  WhatsappLogo,
} from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

const features = [
  {
    icon: ChatCircleText,
    title: 'Chat that understands context',
    copy: 'Answer product, billing, onboarding, and policy questions with your knowledge base and customer history in the same conversation.',
  },
  {
    icon: Microphone,
    title: 'Voice support when typing is not enough',
    copy: 'Let customers speak naturally, capture the issue, and keep the same relationship context available for follow-up.',
  },
  {
    icon: TreeStructure,
    title: 'Workflow actions and escalation',
    copy: 'Route urgent issues, create follow-up tasks, notify the right team, and hand off with the full story attached.',
  },
  {
    icon: Browsers,
    title: 'Email, portal, and website support',
    copy: 'Meet customers where they already ask for help without scattering context across disconnected channels.',
  },
  {
    icon: WhatsappLogo,
    title: 'WhatsApp Business support',
    copy: 'Run the same knowledge-grounded agent inside WhatsApp on your own number, so customers get help in the app they already use.',
  },
  {
    icon: Ticket,
    title: 'Autonomous tickets, SLA & CSAT',
    copy: 'When a human is needed, Lira opens a ticket with the full transcript and identity attached. Queues, routing, SLA timers, and satisfaction scoring are built in.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure in-product actions',
    copy: 'Register actions Lira can run for a customer with a per-action approval policy and full audit trail. Off by default, opt-in per tool, and re-auth gated for sensitive operations.',
  },
  {
    icon: PlugsConnected,
    title: 'Connect your own tools with MCP',
    copy: 'Bring your Model Context Protocol server so Lira can call your systems under your own auth — with OAuth 2.1, per-tool approval, rate limits, and drift detection. Plus scoped API keys and a CLI.',
  },
  {
    icon: Database,
    title: 'Controlled customer memory',
    copy: 'Use organization-scoped knowledge, identified visitor context, and smart handoff rules to keep support useful and trusted.',
  },
  {
    icon: BellRinging,
    title: 'Proactive support signals',
    copy: 'Spot friction, stalled onboarding, failed payments, and urgent customer moments before they become avoidable churn.',
  },
  {
    icon: DeviceMobile,
    title: 'Native mobile support SDK',
    copy: "Build a native in-app support screen over Lira's chat WebSocket, with confirm-before-action, step-up re-auth, human takeover, and push notifications.",
  },
]

const faqs = [
  {
    q: 'What channels does Lira support?',
    a: 'A website chat widget, an embedded in-app support surface (Web SDK), a hosted branded support portal, email, inbound voice (rolling out), and the WhatsApp Business API — all handled by the same AI agent with shared context.',
  },
  {
    q: 'Does Lira only answer questions, or can it take action?',
    a: 'Both. Beyond answering, Lira can run approved actions in your product — cancel a subscription, retry a payment, resend an invoice — each with an approval policy and a full audit trail. Actions are off by default and opt-in per tool.',
  },
  {
    q: 'How does Lira avoid making things up?',
    a: 'Every answer is grounded in your knowledge base using retrieval-augmented generation, so Lira only responds from your real content. When its confidence is low, or the intent is sensitive, it escalates to a human instead of guessing.',
  },
  {
    q: 'Can developers connect their own systems?',
    a: 'Yes. Connect your own tools with a Model Context Protocol (MCP) server (OAuth 2.1, per-tool approval), use scoped API keys and a CLI, and build native in-app support with the mobile SDK.',
  },
  {
    q: 'What happens when a human needs to take over?',
    a: 'Lira opens a ticket with the full conversation context, and the moment a teammate replies the AI pauses (human takeover) until handback — so customers never get a dead end and agents never start from scratch.',
  },
  {
    q: 'How much does Lira cost?',
    a: 'There is a Free plan, Pro from $29/month, and Scale from $99/month, plus custom Enterprise. Every plan includes unlimited team seats — you pay for the AI’s work, never per agent. A localized voice agent (a natural voice matched to your market) is available on Scale, and Enterprise can commission a custom brand voice in their own voice and tone.',
  },
]

const setupSteps = [
  [
    '01',
    'Activate support',
    'Choose chat, portal, email, voice, and escalation preferences from the Lira dashboard.',
  ],
  [
    '02',
    'Paste the snippet',
    'Add the widget script before the closing body tag on the pages where customers need support.',
  ],
  [
    '03',
    'Connect your product',
    'Add SDK context, API keys, or MCP tools so Lira can route and act with the right guardrails.',
  ],
  [
    '04',
    'Go live',
    'Test the customer entry point, confirm the greeting, and let Lira start handling support conversations.',
  ],
]

const outcomeProof = [
  {
    icon: Lifebuoy,
    title: 'One place to support customers properly',
    copy: 'Lira brings together website chat, email, portal, voice, knowledge, and escalation so your team is not jumping between disconnected tools to serve one customer well.',
  },
  {
    icon: TreeStructure,
    title: 'Support that can actually move work forward',
    copy: 'Lira is built to do more than answer. It can route issues, trigger follow-up, pass context into your workflows, and help your team close the loop faster.',
  },
  {
    icon: UserFocus,
    title: 'A more personal experience at scale',
    copy: 'Because Lira works with customer context and memory, support feels less repetitive and more thoughtful, even when your team is handling high volume.',
  },
]

function SetupCodeCard() {
  return (
    <div className="bx-post-card">
      <div className="bx-post-surface" style={{ padding: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '12px 14px',
            borderRadius: '12px 12px 6px 6px',
            background: 'rgba(2,3,8,0.06)',
          }}
        >
          <span
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(2,3,8,0.28)' }}
          />
          <span
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(2,3,8,0.28)' }}
          />
          <span
            style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(2,3,8,0.28)' }}
          />
          <strong
            style={{
              marginLeft: 'auto',
              color: 'rgba(2,3,8,0.58)',
              fontFamily: 'var(--font-sans)',
              fontSize: 12,
            }}
          >
            install
          </strong>
        </div>
        <pre
          style={{
            margin: 0,
            padding: 22,
            borderRadius: '6px 6px 16px 16px',
            background: '#202527',
            color: '#d9f99d',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            lineHeight: 1.75,
            whiteSpace: 'pre-wrap',
          }}
        >{`<script
  src="https://widget.liraintelligence.com/v1/widget.js"
  data-org-id="YOUR_ORG_ID"
  data-color="#202527"
  data-greeting="Hi! How can we help?">
</script>`}</pre>
      </div>
    </div>
  )
}

export function FeaturesPage() {
  return (
    <BlogShell>
      <SEO
        title="Lira Features - AI Customer Support for Modern Teams"
        description="Explore Lira's AI customer support features: chat, voice, email, portal, and WhatsApp; grounded answers; autonomous tickets with SLA and CSAT; secure in-product actions; MCP, API, CLI, and a native mobile SDK."
        keywords="AI customer support features, support automation software, omnichannel support, WhatsApp support, autonomous ticketing, CSAT, secure AI actions, MCP connector, developer API, native mobile support SDK, knowledge base AI"
        path="/features"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        }}
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">
              Everything modern teams need to support customers with context.
            </h1>
            <p className="bx-subtitle">
              Lira brings chat, voice, email, customer memory, knowledge, API actions, and smart
              handoff into one AI support layer your team can launch quickly.
            </p>
            <div style={{ marginTop: 30 }}>
              <BlogButton to="/book-demo">Speak to an expert</BlogButton>
            </div>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container">
          <section>
            <h2 className="bx-section-title">Feature stack</h2>
            <p className="bx-section-copy">
              Structured like a modern helpdesk, but designed around relationships instead of just
              tickets.
            </p>
            <div className="bx-post-grid">
              {features.map(({ icon: Icon, title, copy }) => (
                <article className="bx-post-card" key={title}>
                  <div className="bx-post-surface">
                    <span
                      className="bx-button-icon"
                      style={{ width: 48, height: 48, marginBottom: 28 }}
                    >
                      <Icon size={20} weight="duotone" />
                    </span>
                    <h3 className="bx-post-title">{title}</h3>
                    <p className="bx-post-excerpt">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bx-split" style={{ marginTop: 96 }}>
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <h2 className="bx-section-title">
                  Go from signup to live support without a backend project.
                </h2>
                <p className="bx-section-copy">
                  The core website install is a CDN-hosted JavaScript snippet. For logged-in users,
                  teams can optionally pass signed identity attributes so Lira can greet customers
                  by name and unlock account-level support.
                </p>
              </div>
            </article>
            <div style={{ display: 'grid', gap: 12 }}>
              {setupSteps.map(([number, title, copy]) => (
                <article className="bx-post-card" key={title}>
                  <div
                    className="bx-post-surface"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr',
                      gap: 18,
                      alignItems: 'start',
                    }}
                  >
                    <strong
                      style={{ fontFamily: 'var(--font-sans)', fontSize: 28, letterSpacing: 0 }}
                    >
                      {number}
                    </strong>
                    <div>
                      <h3 className="bx-post-title" style={{ fontSize: 20 }}>
                        {title}
                      </h3>
                      <p className="bx-post-excerpt">{copy}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bx-split-reverse" style={{ marginTop: 96 }}>
            <SetupCodeCard />
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <span
                  className="bx-button-icon"
                  style={{ width: 56, height: 56, marginBottom: 28 }}
                >
                  <IdentificationCard size={22} weight="duotone" />
                </span>
                <h2 className="bx-section-title">Optional identity, richer support.</h2>
                <p className="bx-section-copy">
                  Add `data-email`, `data-name`, and `data-sig` when visitors are logged in. Lira
                  can then personalize replies and support account-specific workflows with a signed
                  server-side identity.
                </p>
              </div>
            </article>
          </section>

          <section style={{ marginTop: 96 }}>
            <h2 className="bx-section-title">Why teams choose Lira</h2>
            <p className="bx-section-copy">
              Lira is not just another support widget. It is built to help teams deliver support
              that feels connected, useful, and ready to follow through.
            </p>
            <div className="bx-post-grid">
              {outcomeProof.map(({ icon: Icon, title, copy }) => (
                <article className="bx-post-card" key={title}>
                  <div className="bx-post-surface">
                    <span
                      className="bx-button-icon"
                      style={{ width: 48, height: 48, marginBottom: 28 }}
                    >
                      <Icon size={20} weight="duotone" />
                    </span>
                    <h3 className="bx-post-title">{title}</h3>
                    <p className="bx-post-excerpt">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 96 }}>
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <h2 className="bx-section-title">
                  Mobile App Integration — Flutter &amp; React Native
                </h2>
                <p className="bx-section-copy">
                  Build a native support screen in your iOS or Android app using Lira's REST and
                  realtime APIs, then register for push notifications. Customers get chat, tickets,
                  and knowledge-base help inside your product UI, and Lira can reach them through
                  proactive triggers.
                </p>
                <div className="bx-post-grid" style={{ marginTop: 28 }}>
                  {[
                    {
                      title: 'Create a support session',
                      copy: 'Start a signed Lira support session from your backend and render the conversation in your native mobile UI.',
                    },
                    {
                      title: 'Register push token',
                      copy: 'On app start, get the FCM device token and POST it to the Lira API. Lira stores it and can send push notifications through proactive triggers.',
                    },
                    {
                      title: 'Receive notifications',
                      copy: "When Lira's proactive engine fires a mobile_push trigger, it sends a push notification directly to the customer's device.",
                    },
                  ].map(({ title, copy }) => (
                    <article className="bx-post-card" key={title}>
                      <div className="bx-post-surface">
                        <h3 className="bx-post-title">{title}</h3>
                        <p className="bx-post-excerpt">{copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section style={{ marginTop: 96 }}>
            <h2 className="bx-section-title">Frequently asked questions</h2>
            <p className="bx-section-copy">
              The questions teams ask most when evaluating Lira for customer support.
            </p>
            <div style={{ display: 'grid', gap: 12, marginTop: 8 }}>
              {faqs.map(({ q, a }) => (
                <article className="bx-post-card" key={q}>
                  <div className="bx-post-surface">
                    <h3 className="bx-post-title" style={{ fontSize: 19 }}>
                      {q}
                    </h3>
                    <p className="bx-post-excerpt" style={{ marginTop: 8 }}>
                      {a}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section style={{ marginTop: 96, textAlign: 'center' }}>
            <h2 className="bx-section-title">Launch support that feels already briefed.</h2>
            <p className="bx-section-copy" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              Give customers one consistent place to get help, and give your team the context to
              step in without asking everyone to start over.
            </p>
            <div style={{ marginTop: 28 }}>
              <BlogButton to="/book-demo">Speak to an expert</BlogButton>
            </div>
          </section>
        </div>
      </main>
    </BlogShell>
  )
}
