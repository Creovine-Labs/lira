import { Link } from 'react-router-dom'
import { ArrowRight, PlayCircle } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { DOCS } from './docsContent'

const FEATURED_VIDEO = {
  title: 'Launch Lira Customer Support',
  description:
    'A walkthrough for activating customer support, installing the widget, connecting knowledge, and handling escalations.',
  youtubeId: 'bjMreqbwD4Q',
}

export function TutorialsPage() {
  const tutorials = DOCS.filter((doc) => doc.category === 'Tutorial')

  return (
    <MarketingLayout>
      <SEO
        title="Tutorials - Learn Lira Customer Support"
        description="Customer support tutorials for Lira AI: widget setup, support portal, knowledge base, email forwarding, human handoff, and proactive outreach."
        keywords="Lira customer support tutorials, Lira widget tutorial, support automation tutorial, AI support walkthrough"
        path="/tutorials"
      />

      <section className="px-6 pb-16 pt-36 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl font-black leading-[1.06] tracking-tight text-gray-950 sm:text-6xl">
          Learn Lira customer support in minutes.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-gray-600">
          Video walkthroughs for the support workflows teams use first: chat, portal, knowledge,
          email, handoff, and proactive outreach.
        </p>
      </section>

      <section className="border-t border-gray-200 px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <span className="mb-3 inline-block rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
              Featured
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-950">
              {FEATURED_VIDEO.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
              {FEATURED_VIDEO.description}
            </p>
          </div>

          <div
            className="relative w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            style={{ paddingBottom: '56.25%' }}
          >
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${FEATURED_VIDEO.youtubeId}`}
              title={FEATURED_VIDEO.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-gray-950">
              Step-by-step guides you can actually open
            </h2>
            <p className="mt-4 text-sm leading-7 text-gray-600">
              These tutorials now point to working internal docs pages built around Lira&apos;s
              current support flows.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {tutorials.map(({ slug, title, summary, Icon }) => (
              <Link
                key={slug}
                to={`/docs/${slug}`}
                className="group rounded-[24px] border border-gray-200 bg-white/78 p-5 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_22px_60px_rgba(2,3,8,0.08)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#202527] text-white">
                  <Icon className="h-5 w-5" weight="duotone" />
                </div>
                <h3 className="mt-5 text-base font-black leading-6 text-gray-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{summary}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
                  Open tutorial
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 px-6 py-20 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <PlayCircle className="h-7 w-7 text-gray-400" weight="duotone" />
          </div>
          <h2 className="mb-3 text-2xl font-black tracking-tight text-gray-950">
            More videos soon
          </h2>
          <p className="text-sm leading-relaxed text-gray-600">
            The written guides are live now, and the video library can keep expanding from the same
            real product workflows.
          </p>
        </div>
      </section>
    </MarketingLayout>
  )
}
