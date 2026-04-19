import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { BLOG_POSTS } from './blogData'

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = BLOG_POSTS.find((p) => p.slug === slug)

  if (!post) return <Navigate to="/blog" replace />

  const currentIdx = BLOG_POSTS.indexOf(post)
  const prev = BLOG_POSTS[currentIdx - 1]
  const next = BLOG_POSTS[currentIdx + 1]

  return (
    <MarketingLayout>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={`${post.category}, AI, Lira AI, ${post.title.split(' ').slice(0, 5).join(', ')}`}
        path={`/blog/${post.slug}`}
        type="article"
        article={{
          publishedTime: post.date,
          author: post.author.name,
          section: post.category,
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: { '@type': 'Person', name: post.author.name, jobTitle: post.author.role },
          publisher: {
            '@type': 'Organization',
            name: 'Lira AI',
            url: 'https://liraintelligence.com',
          },
          mainEntityOfPage: `https://liraintelligence.com/blog/${post.slug}`,
          articleSection: post.category,
        }}
      />
      <section className="pt-32 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          {/* Back */}
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-10"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            All posts
          </Link>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${post.categoryColor}`}>
              {post.category}
            </span>
            <span className="text-xs text-gray-400">{post.date}</span>
            <span className="text-xs text-gray-400">· {post.readingTime}</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-[1.06] mb-6">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-12 pb-8 border-b border-gray-200">
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-black text-gray-600 shrink-0">
              {post.author.initials}
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{post.author.name}</p>
              <p className="text-xs text-gray-400">{post.author.role}</p>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-5">
            {post.paragraphs.map((p, i) => (
              <p key={i} className="text-base text-gray-600 leading-[1.8]">
                {p}
              </p>
            ))}
          </div>

          {/* Post navigation */}
          <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between gap-4">
            {prev ? (
              <Link
                to={`/blog/${prev.slug}`}
                className="group flex-1 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 p-5 transition-all"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                  <ArrowLeftIcon className="h-3 w-3" />
                  Previous
                </p>
                <p className="text-sm font-black text-gray-900 leading-snug group-hover:text-gray-700 transition-colors line-clamp-2">
                  {prev.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link
                to={`/blog/${next.slug}`}
                className="group flex-1 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 p-5 transition-all text-right"
              >
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5 flex items-center justify-end gap-1">
                  Next
                  <ArrowRightIcon className="h-3 w-3" />
                </p>
                <p className="text-sm font-black text-gray-900 leading-snug group-hover:text-gray-700 transition-colors line-clamp-2">
                  {next.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
