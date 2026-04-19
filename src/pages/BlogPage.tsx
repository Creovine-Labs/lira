import { Link } from 'react-router-dom'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { BLOG_POSTS } from './blogData'

export function BlogPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Blog — Meetings, Hiring & The Future of Work"
        description="Ideas and insights on AI meeting intelligence, sales coaching, hiring automation, and building knowledge-driven teams. Read the latest from Lira AI."
        keywords="AI meeting blog, sales coaching insights, hiring automation blog, AI for teams, meeting intelligence articles, Lira AI blog, future of work AI"
        path="/blog"
      />
      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06] mb-4">
            The Lira Blog
          </h1>
          <p className="text-base text-gray-500 max-w-lg leading-relaxed">
            Ideas on AI, meetings, hiring, and the future of how teams work.
          </p>
        </div>
      </section>

      {/* Featured post */}
      <section className="px-6 pb-8 border-t border-gray-200 pt-12">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/blog/${BLOG_POSTS[0].slug}`}
            className="group block rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden"
          >
            <div className="p-8 sm:p-10">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${BLOG_POSTS[0].categoryColor}`}
                >
                  {BLOG_POSTS[0].category}
                </span>
                <span className="text-xs text-gray-400">{BLOG_POSTS[0].date}</span>
                <span className="text-xs text-gray-400">· {BLOG_POSTS[0].readingTime}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 leading-snug mb-4 max-w-2xl group-hover:text-gray-700 transition-colors">
                {BLOG_POSTS[0].title}
              </h2>
              <p className="text-gray-500 leading-relaxed max-w-xl mb-6">{BLOG_POSTS[0].excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-600">
                    {BLOG_POSTS[0].author.initials}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{BLOG_POSTS[0].author.name}</p>
                    <p className="text-xs text-gray-400">{BLOG_POSTS[0].author.role}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-black text-gray-700 group-hover:text-gray-900 transition-colors">
                  Read post <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Post grid */}
      <section className="py-8 px-6 pb-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-5">
            {BLOG_POSTS.slice(1).map((post) => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden"
              >
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black ${post.categoryColor}`}
                    >
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readingTime}</span>
                  </div>
                  <h3 className="font-black tracking-tight text-gray-900 leading-snug mb-3 group-hover:text-gray-700 transition-colors flex-1">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-600 shrink-0">
                      {post.author.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-gray-900 truncate">
                        {post.author.name}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{post.date}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
