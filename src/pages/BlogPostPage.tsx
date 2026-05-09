import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { SEO } from '@/components/SEO'
import { BLOG_POSTS, findBlogPostBySlug } from './blogData'
import { BlogButton, BlogShell } from './BlogChrome'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = findBlogPostBySlug(slug)

  if (!post) return <Navigate to="/blog" replace />
  if (slug !== post.slug) return <Navigate to={`/blog/${post.slug}`} replace />

  const currentIdx = BLOG_POSTS.indexOf(post)
  const prev = BLOG_POSTS[currentIdx - 1]
  const next = BLOG_POSTS[currentIdx + 1]
  const articleUrl = `https://liraintelligence.com/blog/${post.slug}`

  return (
    <BlogShell article>
      <SEO
        title={post.seoTitle}
        description={post.seoDescription}
        keywords={post.seoKeywords}
        path={`/blog/${post.slug}`}
        type="article"
        article={{
          publishedTime: post.publishedTime,
          author: post.author.name,
          section: post.category,
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.seoDescription,
          datePublished: post.publishedTime,
          dateModified: post.publishedTime,
          keywords: post.seoKeywords.split(',').map((keyword) => keyword.trim()),
          author: { '@type': 'Person', name: post.author.name, jobTitle: post.author.role },
          publisher: {
            '@type': 'Organization',
            name: 'Lira',
            url: 'https://liraintelligence.com',
            logo: {
              '@type': 'ImageObject',
              url: 'https://liraintelligence.com/lira_black_with_white_backgound.png',
            },
          },
          mainEntityOfPage: articleUrl,
          articleSection: post.category,
          url: articleUrl,
          isPartOf: {
            '@type': 'Blog',
            name: 'Lira Blog',
            url: 'https://liraintelligence.com/blog',
          },
        }}
      />

      <main className="bx-main">
        <article className="bx-container bx-article">
          <div className="bx-back">
            <BlogButton to="/blog">All posts</BlogButton>
          </div>

          <header className="bx-article-head">
            <div className="bx-meta">
              <span className="bx-chip">{post.category}</span>
              <span>{post.date}</span>
              <span>{post.readingTime}</span>
            </div>
            <h2 className="bx-article-title">{post.title}</h2>
            <p className="bx-article-excerpt">{post.excerpt}</p>
            <div className="bx-author">
              <span className="bx-avatar"><img src={post.author.image} alt={post.author.name} /></span>
              <div>
                <strong>{post.author.name}</strong>
                <span>{post.author.role}</span>
              </div>
            </div>
          </header>

          <div className="bx-prose">
            {post.paragraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <nav className="bx-post-nav" aria-label="Post navigation">
            {prev ? (
              <Link to={`/blog/${prev.slug}`} className="bx-post-card">
                <div className="bx-post-surface">
                  <p className="bx-post-nav-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={13} />
                    Previous
                  </p>
                  <h3 className="bx-post-title" style={{ fontSize: 18 }}>{prev.title}</h3>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link to={`/blog/${next.slug}`} className="bx-post-card">
                <div className="bx-post-surface">
                  <p className="bx-post-nav-label" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                    Next
                    <ArrowUpRight size={13} />
                  </p>
                  <h3 className="bx-post-title" style={{ fontSize: 18, textAlign: 'right' }}>
                    {next.title}
                  </h3>
                </div>
              </Link>
            ) : (
              <div />
            )}
          </nav>
        </article>
      </main>
    </BlogShell>
  )
}
