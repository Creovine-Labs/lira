import {
  Clock,
  ChatsCircle,
  Translate,
  Megaphone,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

const capabilities = [
  {
    icon: Clock,
    title: 'Always on for guests',
    copy: 'Guests get accurate answers at any hour, so your front desk is not buried in repetitive questions late at night.',
  },
  {
    icon: ChatsCircle,
    title: 'Every channel',
    copy: 'A full support page, a chat widget, email, and real-time voice, all powered by one assistant and one knowledge base.',
  },
  {
    icon: Translate,
    title: 'Meets guests where they are',
    copy: 'Natural conversation today, with broader multilingual support on the way for international guests.',
  },
  {
    icon: Megaphone,
    title: 'Proactive updates',
    copy: 'Broadcast maintenance notices, event news, and offers to guests without per-message busywork.',
  },
  {
    icon: Sparkle,
    title: 'On brand and grounded',
    copy: 'Answers in your property voice, sourced from your own information, with no made up policies or amenities.',
  },
  {
    icon: UsersThree,
    title: 'Smart handoff to staff',
    copy: 'When a guest needs a person, Lira escalates with a clear brief so your team picks up instantly and in context.',
  },
]

const steps = [
  [
    '01',
    'Add your property info',
    'Connect your help content, policies, and FAQs. Lira answers from your exact information.',
  ],
  [
    '02',
    'Guests ask',
    'On your website, in the widget, by email, or by voice, at any time of day.',
  ],
  [
    '03',
    'Lira answers instantly',
    'A friendly, on brand answer grounded in your property info, with helpful links and next steps.',
  ],
  [
    '04',
    'Hands off when needed',
    'For a special request, Lira routes it to the right team with context, so staff focus on real hospitality.',
  ],
]

export function LiraForHospitalityPage() {
  return (
    <BlogShell>
      <SEO
        title="Lira for Hospitality - Always-on AI Guest Support"
        description="AI guest support for hospitality: 24/7 answers across chat, email, and voice, proactive updates, on-brand grounded replies, and smart handoff to staff."
        path="/for/hospitality"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">Guest support that never sleeps.</h1>
            <p className="bx-subtitle">
              From booking questions to check-in details to local tips, Lira answers your guests
              instantly across chat, email, and voice, and hands off to your team only when it truly
              matters.
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
            <h2 className="bx-section-title">What Lira does for hospitality teams</h2>
            <p className="bx-section-copy">
              Instant, on brand answers for guests, and more time for your team to deliver real
              hospitality.
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
                <h2 className="bx-section-title">How a guest gets helped on Lira</h2>
                <p className="bx-section-copy">
                  Instant answers for the routine, a warm handoff for the special requests, day or
                  night.
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
            <h2 className="bx-section-title">Give every guest a concierge in their pocket.</h2>
            <p className="bx-section-copy" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              See how Lira answers guests instantly across channels and frees your team for the
              moments that matter.
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
