import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { getDocsUrl } from '@/lib/docs'

export function DocArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const docsUrl = getDocsUrl(slug)

  useEffect(() => {
    window.location.replace(docsUrl)
  }, [docsUrl])

  return (
    <MarketingLayout>
      <SEO
        title="Documentation - Lira Docs"
        description="Redirecting to the official Lira documentation."
        keywords="Lira documentation, Lira docs, Lira guides"
        path={slug ? `/docs/${slug}` : '/docs'}
      />

      <main className="px-6 pb-24 pt-36">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-gray-200 bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(2,3,8,0.06)] sm:p-12">
          <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Opening the right guide
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            This documentation page now lives on the official Lira docs site so the guide stays
            accurate as the platform changes.
          </p>
          <div className="mt-8">
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#202527] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              Continue to docs
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
    </MarketingLayout>
  )
}
