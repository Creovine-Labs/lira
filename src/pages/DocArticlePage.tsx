import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { DOCS_BY_SLUG } from './docsContent'

export function DocArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const doc = slug ? DOCS_BY_SLUG[slug] : undefined

  if (!doc) {
    return <Navigate to="/docs" replace />
  }

  const relatedDocs = doc.related.map((entrySlug) => DOCS_BY_SLUG[entrySlug]).filter(Boolean)

  return (
    <MarketingLayout>
      <SEO
        title={`${doc.title} - Lira Docs`}
        description={doc.summary}
        keywords={`Lira docs, ${doc.title}, Lira support guide`}
        path={`/docs/${doc.slug}`}
      />

      <main className="px-6 pb-20 pt-36">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to docs
          </Link>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <article className="rounded-[32px] border border-gray-200 bg-white/85 p-8 sm:p-10">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-600">
                  {doc.category}
                </span>
              </div>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight text-gray-950 sm:text-5xl">
                {doc.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-gray-600">{doc.summary}</p>

              <div className="mt-10 space-y-10">
                {doc.sections.map((section) => (
                  <section key={section.title}>
                    <h2 className="text-2xl font-black tracking-tight text-gray-950">
                      {section.title}
                    </h2>
                    {section.body ? (
                      <p className="mt-4 text-sm leading-7 text-gray-600">{section.body}</p>
                    ) : null}
                    {section.bullets ? (
                      <ul className="mt-4 space-y-3 text-sm leading-7 text-gray-600">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-950" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {section.code ? (
                      <pre className="mt-5 overflow-x-auto rounded-[24px] bg-[#111315] p-5 text-sm leading-7 text-white">
                        <code>{section.code}</code>
                      </pre>
                    ) : null}
                  </section>
                ))}
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-[28px] border border-gray-200 bg-white/85 p-6">
                <h2 className="text-lg font-black tracking-tight text-gray-950">Keep moving</h2>
                <p className="mt-3 text-sm leading-7 text-gray-600">
                  Start with support activation, then use these docs to shape widget, portal,
                  knowledge, and escalation around your real support workflow.
                </p>
                <div className="mt-5 space-y-3">
                  <Link
                    to="/resources"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-950"
                  >
                    Browse resources
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/tutorials"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-950"
                  >
                    Open tutorials
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white/85 p-6">
                <h2 className="text-lg font-black tracking-tight text-gray-950">Related docs</h2>
                <div className="mt-5 space-y-3">
                  {relatedDocs.map((related) => (
                    <Link
                      key={related.slug}
                      to={`/docs/${related.slug}`}
                      className="block rounded-2xl border border-gray-200 px-4 py-4 transition hover:border-gray-300 hover:bg-gray-50"
                    >
                      <p className="text-sm font-semibold text-gray-950">{related.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{related.summary}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </MarketingLayout>
  )
}
