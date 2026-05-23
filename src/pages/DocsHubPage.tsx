import { useEffect } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { DOCS_BASE_URL } from '@/lib/docs'

export function DocsHubPage() {
  useEffect(() => {
    window.location.replace(DOCS_BASE_URL)
  }, [])

  return (
    <MarketingLayout>
      <SEO
        title="Documentation - Lira Docs"
        description="Redirecting to the official Lira documentation."
        keywords="Lira documentation, Lira docs, Lira guides"
        path="/docs"
      />

      <main className="px-6 pb-24 pt-36">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-gray-200 bg-white/85 p-8 text-center shadow-[0_24px_70px_rgba(2,3,8,0.06)] sm:p-12">
          <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Redirecting to official documentation
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
            Lira&apos;s setup guides, product references, and walkthroughs now live on the official
            docs domain.
          </p>
          <div className="mt-8">
            <a
              href={DOCS_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#202527] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
            >
              Open docs
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
    </MarketingLayout>
  )
}
