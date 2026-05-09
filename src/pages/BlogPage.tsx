import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { BLOG_POSTS } from './blogData'
import { BlogButton, BlogShell } from './BlogChrome'

export function BlogPage() {
  const [featured, ...posts] = BLOG_POSTS

  return (
    <BlogShell>
      <SEO
        title="Blog - AI Customer Support, Knowledge, and Support Operations"
        description="Read Lira's thinking on AI customer support, support automation, knowledge bases, human handoff, customer context, and modern support operations."
        keywords="AI customer support blog, customer support automation blog, support operations, AI help desk blog, knowledge base for AI support, human handoff, support workflow automation"
        path="/blog"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Lira Blog',
          description:
            'Articles on AI customer support, support automation, knowledge systems, and customer operations.',
          url: 'https://liraintelligence.com/blog',
          publisher: {
            '@type': 'Organization',
            name: 'Lira',
            url: 'https://liraintelligence.com',
          },
        }}
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">Ideas for teams building next-gen customer support</h1>
            <p className="bx-subtitle">
              Practical thinking on AI customer support, support automation, knowledge systems,
              human handoff, and the workflows modern teams need to resolve customers well.
            </p>
            <div style={{ marginTop: 30 }}>
              <BlogButton to={`/blog/${featured.slug}`}>Read latest</BlogButton>
            </div>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container">
          <div className="bx-featured-grid" style={{ gridTemplateColumns: '1fr' }}>
            <Link to={`/blog/${featured.slug}`} className="bx-post-card">
              <article className="bx-post-surface">
                <div className="bx-meta">
                  <span className="bx-chip">{featured.category}</span>
                  <span>{featured.date}</span>
                  <span>{featured.readingTime}</span>
                </div>
                <h2 className="bx-post-title" style={{ fontSize: 'clamp(30px, 4vw, 46px)' }}>
                  {featured.title}
                </h2>
                <p className="bx-post-excerpt" style={{ maxWidth: 620 }}>
                  {featured.excerpt}
                </p>
                <div className="bx-author">
                  <span className="bx-avatar">
                    <img src={featured.author.image} alt={featured.author.name} />
                  </span>
                  <div>
                    <strong>{featured.author.name}</strong>
                    <span>{featured.author.role}</span>
                  </div>
                </div>
              </article>
            </Link>
          </div>

          <section style={{ marginTop: 90 }}>
            <h2 className="bx-section-title">Latest thinking</h2>
            <p className="bx-section-copy">
              Field notes for teams moving from reactive support to connected customer care.
            </p>
            <div className="bx-post-grid">
              {posts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`} className="bx-post-card">
                  <article className="bx-post-surface">
                    <div className="bx-meta">
                      <span className="bx-chip">{post.category}</span>
                      <span>{post.readingTime}</span>
                    </div>
                    <h3 className="bx-post-title">{post.title}</h3>
                    <p className="bx-post-excerpt">{post.excerpt}</p>
                    <div className="bx-author">
                      <span className="bx-avatar">
                        <img src={post.author.image} alt={post.author.name} />
                      </span>
                      <div>
                        <strong>{post.author.name}</strong>
                        <span>{post.date}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </BlogShell>
  )
}
