import { Briefcase, HeartStraight, Sparkle, UsersThree } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { BlogButton, BlogShell } from './BlogChrome'

const culture = [
  {
    icon: Sparkle,
    title: 'Build for real customer moments',
    copy: 'We care about support that feels human, fast, and useful. The work is practical: reduce repetition, improve trust, and help teams follow through.',
  },
  {
    icon: UsersThree,
    title: 'Small team, high ownership',
    copy: 'You will work close to product, design, engineering, and customers. We value people who can think clearly, ship carefully, and communicate early.',
  },
  {
    icon: HeartStraight,
    title: 'Respectful AI by default',
    copy: 'Lira handles sensitive customer context, so we build with clear permissions, responsible automation, and thoughtful human handoff.',
  },
]

const roles = [
  [
    'Product Engineer',
    'Frontend, integrations, support workflows, and customer-facing product quality.',
  ],
  [
    'AI Support Systems Engineer',
    'Evaluation, retrieval, workflow orchestration, and safe agent behavior.',
  ],
  [
    'Customer Experience Lead',
    'Help early teams launch Lira, shape onboarding, and turn support feedback into product insight.',
  ],
]

export function CareersPage() {
  return (
    <BlogShell>
      <SEO
        title="Careers - Build Lira With Us"
        description="Explore career opportunities at Lira, the AI customer support platform for modern teams."
        path="/careers"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">
              Build the support layer modern teams wish they already had.
            </h1>
            <p className="bx-subtitle">
              We are designing Lira for teams that want customer support to remember context, take
              action, and protect trust. If that kind of product pulls at you, we should talk.
            </p>
            <div style={{ marginTop: 30 }}>
              <BlogButton to="/contact">Contact us</BlogButton>
            </div>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container">
          <section>
            <h2 className="bx-section-title">How we work</h2>
            <p className="bx-section-copy">
              We are early, focused, and product-led. The best people here enjoy turning ambiguity
              into clean systems customers can trust.
            </p>
            <div className="bx-post-grid">
              {culture.map(({ icon: Icon, title, copy }) => (
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

          <section style={{ marginTop: 96 }}>
            <h2 className="bx-section-title">Roles we are interested in</h2>
            <p className="bx-section-copy">
              We are not running a huge hiring machine right now, but we do want to meet thoughtful
              builders who care about AI, customer experience, and reliable product craft.
            </p>
            <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
              {roles.map(([title, copy]) => (
                <article className="bx-post-card" key={title}>
                  <div
                    className="bx-post-surface"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '52px 1fr',
                      gap: 18,
                      alignItems: 'start',
                    }}
                  >
                    <span className="bx-button-icon" style={{ width: 52, height: 52 }}>
                      <Briefcase size={20} weight="duotone" />
                    </span>
                    <div>
                      <h3 className="bx-post-title" style={{ fontSize: 22 }}>
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
            <h2 className="bx-section-title">Tell us what you want to build.</h2>
            <p className="bx-section-copy" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
              Send a short note with the kind of work you do best and why Lira feels interesting.
            </p>
            <div style={{ marginTop: 28 }}>
              <BlogButton to="/contact">Start the conversation</BlogButton>
            </div>
          </section>
        </div>
      </main>
    </BlogShell>
  )
}
