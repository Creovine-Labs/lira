import { ChatText, EnvelopeSimple, MapPin } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

export function ContactPage() {
  return (
    <BlogShell>
      <SEO
        title="Contact Lira"
        description="Contact Lira for product questions, demo requests, partnerships, and support."
        path="/contact"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">Contact Lira.</h1>
            <p className="bx-subtitle">
              Questions about the product, support setup, integrations, or partnerships? Reach out
              and we will point you in the right direction.
            </p>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container bx-post-grid">
          {[
            [EnvelopeSimple, 'Email', 'lira@liraintelligence.com'],
            [ChatText, 'Product and demo requests', 'Book a demo or send your setup questions.'],
            [MapPin, 'Built by', 'Creovine'],
          ].map(([Icon, title, copy]) => (
            <article className="bx-post-card" key={String(title)}>
              <div className="bx-post-surface">
                <span className="bx-button-icon" style={{ width: 48, height: 48, marginBottom: 24 }}>
                  <Icon size={20} />
                </span>
                <h2 className="bx-post-title">{String(title)}</h2>
                <p className="bx-post-excerpt">{String(copy)}</p>
              </div>
            </article>
          ))}
        </div>
        <section className="bx-container" style={{ marginTop: 42, textAlign: 'center' }}>
          <BlogButton to="/book-demo">Book a Demo</BlogButton>
        </section>
      </main>
    </BlogShell>
  )
}
