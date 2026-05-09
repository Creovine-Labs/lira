import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, PlayCircle } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { DOCS } from './docsContent'

const quickLinks = [
  {
    title: 'View all docs',
    copy: 'Open the full documentation hub for setup guides, walkthroughs, and support operations.',
    href: '/docs',
    cta: 'Browse docs',
    Icon: BookOpenText,
  },
  {
    title: 'Watch tutorials',
    copy: 'Jump into walkthroughs and guided product learning for the support workflows teams start with first.',
    href: '/tutorials',
    cta: 'Open tutorials',
    Icon: PlayCircle,
  },
]

export function DocsHubPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Docs - Lira Customer Support Documentation"
        description="Setup guides and tutorials for Lira customer support: widget install, verified users, email forwarding, support portal, knowledge, handoff, proactive support, and integrations."
        keywords="Lira docs, Lira customer support docs, Lira widget setup, Lira support portal, Lira knowledge base"
        path="/docs"
      />

      <main>
        <section className="px-6 pb-14 pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-gray-400">
                Documentation
              </p>
              <h1 className="mt-5 text-5xl font-black leading-[1.04] tracking-tight text-gray-950 sm:text-6xl">
                Lira support docs built around the product you actually have.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                Setup guides, launch checklists, and walkthroughs based on the support widget,
                portal, knowledge, escalation, and integrations already present in Lira.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {quickLinks.map(({ title, copy, href, cta, Icon }) => (
                <Link
                  key={title}
                  to={href}
                  className="group rounded-[28px] border border-gray-200 bg-white/80 p-6 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_24px_70px_rgba(2,3,8,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#202527] text-white">
                    <Icon className="h-6 w-6" weight="duotone" />
                  </div>
                  <h2 className="mt-5 text-xl font-black tracking-tight text-gray-950">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{copy}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
                    {cta}
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-gray-200 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-black tracking-tight text-gray-950">
                Guides and tutorials
              </h2>
              <p className="mt-4 text-sm leading-7 text-gray-600">
                Everything below links to real internal docs pages instead of dead placeholders.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {DOCS.map(({ slug, title, summary, category, Icon }) => (
                <Link
                  key={slug}
                  to={`/docs/${slug}`}
                  className="group rounded-[24px] border border-gray-200 bg-white/78 p-5 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_20px_60px_rgba(2,3,8,0.08)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#202527] text-white">
                      <Icon className="h-5 w-5" weight="duotone" />
                    </div>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                      {category}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-black leading-6 text-gray-950">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{summary}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
                    Open doc
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
