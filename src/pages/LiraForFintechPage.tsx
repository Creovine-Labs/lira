import { ShieldCheck, Prohibit, Clock, BookOpen, Flask, Coins } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

const capabilities = [
  {
    icon: ShieldCheck,
    title: 'PII redaction built in',
    copy: 'BVN, NIN, account, and card numbers are removed before anything reaches the AI, your storage, or your logs. Data stays minimal by design.',
  },
  {
    icon: Prohibit,
    title: 'Never gives financial advice',
    copy: 'A policy guardrail declines investment, tax, and legal advice and routes it to your team, so you stay clear of liability.',
  },
  {
    icon: Clock,
    title: 'Regulator ready complaint SLAs',
    copy: 'Complaints become tracked tickets with acknowledgement and resolution timers, aligned to CBN by default, and escalation before a breach.',
  },
  {
    icon: BookOpen,
    title: 'Grounded, cited answers',
    copy: 'Lira answers only from your own policies and documents, with sources, so customers never get invented fees, limits, or steps.',
  },
  {
    icon: Flask,
    title: 'Sandbox before you go live',
    copy: 'New workspaces start in sandbox with no real messages sent, so you can test safely. Going live is a deliberate choice.',
  },
  {
    icon: Coins,
    title: 'Built for your market',
    copy: 'Set your currency and support personal, SME, and corporate segments, whether you operate in Naira or anywhere else.',
  },
]

const steps = [
  [
    '01',
    'Connect your knowledge',
    'Add your help center, policies, and FAQs. Lira indexes them and answers from your exact content.',
  ],
  [
    '02',
    'Customers ask',
    'On your app, website, email, or by voice. Sensitive details are redacted the moment they arrive.',
  ],
  [
    '03',
    'Lira answers and routes',
    'Customers get grounded answers. When a human is needed, Lira opens a ticket with the full context.',
  ],
  [
    '04',
    'Your team takes over',
    'Agents pick up in the ticket with the SLA already running, so nothing slips through.',
  ],
]

export function LiraForFintechPage() {
  return (
    <BlogShell>
      <SEO
        title="Lira for Fintech - Compliant AI Customer Support"
        description="AI customer support built for fintech: PII redaction, no financial advice, regulator-ready complaint SLAs, grounded answers, sandbox testing, and dynamic currency."
        path="/for/fintech"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">AI customer support built for fintech.</h1>
            <p className="bx-subtitle">
              Lira answers, guides, and routes your customers, grounded in your own policies, safe
              with sensitive data, and aligned to the rules you operate under. It never gives
              financial advice and never moves money.
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
            <h2 className="bx-section-title">What Lira does for fintech teams</h2>
            <p className="bx-section-copy">
              The hard parts of fintech support, handled with care: sensitive data, regulator
              timelines, and high volume.
            </p>
            <div className="bx-post-grid">
              {capabilities.map(({ icon: Icon, title, copy }) => (
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
                  How a fintech support conversation runs on Lira
                </h2>
                <p className="bx-section-copy">
                  Grounded answers for the routine, a clean handoff for the rest, with sensitive
                  data protected at every step.
                </p>
              </div>
            </article>
            <div style={{ display: 'grid', gap: 12 }}>
              {steps.map(([number, title, copy]) => (
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

          <section style={{ marginTop: 96, textAlign: 'center' }}>
            <h2 className="bx-section-title">Bring trusted AI support to your fintech.</h2>
            <p className="bx-section-copy" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              See how Lira handles regulated complaints, sensitive data, and high volume, without
              touching money or giving advice.
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
