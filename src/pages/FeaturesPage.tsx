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
  TreeStructure,
  UserFocus,
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
    icon: PlugsConnected,
    title: 'Developer-ready support automation',
    copy: 'Use API keys, CLI commands, MCP tools, and SDK context so Lira can move support work forward under your own product rules.',
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
    title: 'Mobile App Integration',
    copy: 'Build a native in-app support screen on Lira APIs, register push tokens, and send notifications through proactive triggers.',
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
        description="Explore Lira's AI customer support features: chat, voice, email, portal, customer memory, workflow actions, API access, MCP tools, and one-script website setup."
        path="/features"
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
