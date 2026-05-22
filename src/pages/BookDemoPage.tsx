import { CalendarCheck, EnvelopeSimple, UsersThree } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

export function BookDemoPage() {
  return (
    <BlogShell>
      <SEO
        title="Book a Demo - Lira"
        description="Book a Lira demo and share your team size, support channels, and customer support goals."
        path="/book-demo"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">Book a Lira demo.</h1>
            <p className="bx-subtitle">
              Tell us how your team supports customers today. We will show you how Lira can fit into
              your website, portal, email, voice, and internal workflows.
            </p>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container bx-split">
          <article className="bx-post-card">
            <div className="bx-post-surface">
              <span className="bx-button-icon" style={{ width: 52, height: 52, marginBottom: 24 }}>
                <CalendarCheck size={22} />
              </span>
              <h2 className="bx-section-title">What happens next</h2>
              <p className="bx-section-copy">
                We review your support setup, send a calendar link, and tailor the demo around the
                channels and integrations your team actually needs.
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
                {[
                  ['01', 'Share your support goals'],
                  ['02', 'Choose a demo time'],
                  ['03', 'See Lira with a realistic support flow'],
                ].map(([number, text]) => (
                  <div
                    key={number}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr',
                      gap: 12,
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 14,
                      background: 'rgba(2,3,8,0.05)',
                    }}
                  >
                    <strong>{number}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="bx-post-card">
            <div className="bx-post-surface">
              <h2 className="bx-section-title">Demo request</h2>
              <form style={{ display: 'grid', gap: 14, marginTop: 24 }}>
                {['Work email', 'Name', 'Company', 'Team size'].map((label) => (
                  <label
                    key={label}
                    style={{
                      display: 'grid',
                      gap: 8,
                      color: 'rgba(2,3,8,0.62)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                    <input
                      style={{
                        minHeight: 48,
                        border: '1px solid rgba(2,3,8,0.16)',
                        borderRadius: 12,
                        padding: '0 14px',
                        background: '#fff',
                        color: '#020308',
                      }}
                    />
                  </label>
                ))}
                <label
                  style={{
                    display: 'grid',
                    gap: 8,
                    color: 'rgba(2,3,8,0.62)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  What should we focus on?
                  <textarea
                    rows={5}
                    style={{
                      border: '1px solid rgba(2,3,8,0.16)',
                      borderRadius: 12,
                      padding: 14,
                      background: '#fff',
                      color: '#020308',
                      resize: 'vertical',
                    }}
                  />
                </label>
                <BlogButton to="/contact">Submit request</BlogButton>
              </form>
            </div>
          </article>
        </div>

        <div className="bx-container bx-post-grid" style={{ marginTop: 16 }}>
          {[
            [EnvelopeSimple, 'Email and portal support'],
            [UsersThree, 'Customer context and handoff'],
            [CalendarCheck, 'Setup and launch plan'],
          ].map(([Icon, title]) => (
            <article className="bx-post-card" key={String(title)}>
              <div className="bx-post-surface">
                <span
                  className="bx-button-icon"
                  style={{ width: 44, height: 44, marginBottom: 18 }}
                >
                  <Icon size={18} />
                </span>
                <h3 className="bx-post-title" style={{ fontSize: 18 }}>
                  {String(title)}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </main>
    </BlogShell>
  )
}
