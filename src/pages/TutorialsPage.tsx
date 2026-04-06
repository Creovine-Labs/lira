import { PlayCircleIcon } from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

const FEATURED_VIDEO = {
  title: 'Lira Product Launch — See It In Action',
  description:
    'Watch how Lira joins your Google Meet calls, captures everything that happens, extracts action items, and keeps your whole team in sync — automatically.',
  youtubeId: 'bjMreqbwD4Q',
}

export function TutorialsPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          Learn Lira
          <br />
          in minutes.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-gray-500 leading-relaxed">
          Video tutorials to help you get the most out of every meeting.
        </p>
      </section>

      {/* Featured video */}
      <section className="py-10 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6">
            <span className="inline-block rounded-full bg-[#3730a3]/10 px-3 py-1 text-xs font-semibold text-[#3730a3] mb-3">
              Featured
            </span>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">
              {FEATURED_VIDEO.title}
            </h2>
            <p className="mt-2 text-sm text-gray-500 max-w-xl">{FEATURED_VIDEO.description}</p>
          </div>

          {/* YouTube embed */}
          <div
            className="relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm"
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

      {/* More coming soon */}
      <section className="py-20 px-6 border-t border-gray-200 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <PlayCircleIcon className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 mb-3">
            More tutorials coming soon
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            We're working on step-by-step walkthroughs for every feature. Subscribe to our{' '}
            <a
              href="https://www.youtube.com/@LiraIntelligence"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#3730a3] hover:underline"
            >
              YouTube channel
            </a>{' '}
            to get notified when new videos drop.
          </p>
        </div>
      </section>
    </MarketingLayout>
  )
}
