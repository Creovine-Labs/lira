import { FlowArrow, HeartStraight, Key } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

const principles = [
  {
    icon: HeartStraight,
    title: 'Customer relationships over tickets',
    copy: 'Support should remember people, not reset them. Lira keeps the full customer story close to every answer, handoff, and follow-up.',
  },
  {
    icon: FlowArrow,
    title: 'Action beats deflection',
    copy: 'Modern support needs to resolve, route, update, and follow through. Lira is built for work that continues after the first reply.',
  },
  {
    icon: Key,
    title: 'Clear control and access',
    copy: 'Customer context is sensitive. Lira is shaped around clear escalation, scoped knowledge, auditable actions, and controlled access.',
  },
]

const stats = [
  ['Chat, email, voice', 'Channels united'],
  ['One script tag', 'Website install'],
  ['Full context', 'For every handoff'],
]

export function AboutPage() {
  return (
    <BlogShell>
      <SEO
        title="About Lira - AI Customer Support for Modern Teams"
        description="Learn why Lira exists: to help modern teams build customer support that remembers context, acts across workflows, and strengthens relationships."
        path="/about-us"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">
              We are building support that customers do not have to repeat.
            </h1>
            <p className="bx-subtitle">
              Lira exists for teams who believe support is not just a queue. It is the place where
              customers ask for help, reveal friction, build trust, and decide whether to stay.
            </p>
            <div style={{ marginTop: 30 }}>
              <BlogButton to="/features">Explore features</BlogButton>
            </div>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container">
          <section className="bx-split">
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <span className="bx-chip">Our mission</span>
                <h2 className="bx-section-title" style={{ marginTop: 24 }}>
                  Turn every support moment into a better customer relationship.
                </h2>
              </div>
            </article>
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <p
                  className="bx-post-excerpt"
                  style={{ fontSize: 18, lineHeight: 1.8, marginTop: 0 }}
                >
                  Most support software was built around tickets. Lira is built around customers. It
                  brings your knowledge base, conversations, channels, and connected systems into
                  one AI support layer so teams can respond faster without losing the human story.
                </p>
                <p className="bx-post-excerpt" style={{ fontSize: 18, lineHeight: 1.8 }}>
                  The result is support that feels less like a queue and more like a relationship:
                  remembered, contextual, useful, and ready to move work forward.
                </p>
              </div>
            </article>
          </section>

          <section style={{ marginTop: 90 }}>
            <h2 className="bx-section-title">What guides the product</h2>
            <p className="bx-section-copy">
              The same structure appears across Lira: clean context, fast resolution, and careful
              handoff when people need to step in.
            </p>
            <div className="bx-post-grid">
              {principles.map(({ icon: Icon, title, copy }) => (
                <article className="bx-post-card" key={title}>
                  <div className="bx-post-surface">
                    <span
                      className="bx-button-icon"
                      style={{ width: 48, height: 48, marginBottom: 28 }}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="bx-post-title">{title}</h3>
                    <p className="bx-post-excerpt">{copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bx-split" style={{ marginTop: 90 }}>
            <article className="bx-post-card">
              <div className="bx-post-surface">
                <h2 className="bx-section-title">
                  Support, onboarding, and customer success are converging.
                </h2>
                <p className="bx-section-copy">
                  Customers expect one continuous experience across your website, product, inbox,
                  and voice channels. Lira gives teams one relationship layer for those moments.
                </p>
              </div>
            </article>
            <article className="bx-post-card">
              <div className="bx-post-surface" style={{ display: 'grid', gap: 14 }}>
                {stats.map(([value, label]) => (
                  <div
                    key={label}
                    style={{ padding: 18, borderRadius: 14, background: 'rgba(2,3,8,0.05)' }}
                  >
                    <strong
                      style={{
                        display: 'block',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 24,
                        letterSpacing: 0,
                        color: '#020308',
                      }}
                    >
                      {value}
                    </strong>
                    <span style={{ color: 'rgba(2,3,8,0.56)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section style={{ marginTop: 90, textAlign: 'center' }}>
            <span
              className="bx-button-icon"
              style={{ width: 56, height: 56, margin: '0 auto 18px' }}
            >
              <img
                src="/lira_mark_white.webp"
                alt=""
                aria-hidden="true"
                style={{ width: 34, height: 26, objectFit: 'contain' }}
              />
            </span>
            <h2 className="bx-section-title">Support customers remember.</h2>
            <p className="bx-section-copy" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              Bring Lira into your support stack and give your team a calmer way to answer,
              escalate, and follow through.
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
