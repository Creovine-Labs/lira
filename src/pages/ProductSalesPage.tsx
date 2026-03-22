import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  ComputerDesktopIcon,
  CursorArrowRaysIcon,
  LightBulbIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Lira listens silently',
    description:
      'Lira runs as an invisible AI assistant on your device — not a bot in the call. It transcribes the conversation in real time without the other party knowing.',
  },
  {
    number: '02',
    title: 'Surfaces instant guidance',
    description:
      'When a prospect raises an objection, Lira matches it to your playbook and surfaces the ideal response, battle card, or pricing counter — right on your screen.',
  },
  {
    number: '03',
    title: 'You close the deal',
    description:
      'Speak with confidence. Lira handles the coaching, you handle the relationship. After the call, get a full summary, next-step recommendations, and CRM-ready notes.',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: MicrophoneIcon,
    title: 'Real-time transcription',
    description:
      'Every word is transcribed and analysed as the conversation happens — zero lag, no post-call processing needed.',
  },
  {
    Icon: ChatBubbleLeftIcon,
    title: 'Objection handling',
    description:
      'Lira detects objections the moment they arise and serves up your best-performing responses instantly.',
  },
  {
    Icon: CursorArrowRaysIcon,
    title: 'Battle cards on demand',
    description:
      'Competitive mentions trigger the right battle card automatically — so you always know what to say next.',
  },
  {
    Icon: LightBulbIcon,
    title: 'Deal coaching',
    description:
      'After every call, Lira scores the conversation, flags missed opportunities, and tells you exactly how to follow up.',
  },
  {
    Icon: ArrowTrendingUpIcon,
    title: 'Win-rate analytics',
    description:
      "Track which talk tracks close deals and which don't — across the whole team, over time.",
  },
  {
    Icon: BoltIcon,
    title: 'CRM auto-fill',
    description:
      'Post-call summaries, action items, and stage updates push directly to your CRM — no manual entry.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductSalesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          Your invisible
          <br />
          sales coach.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-gray-500 leading-relaxed">
          Lira listens to every sales call in real time and tells you exactly what to say — handling
          objections, surfacing battle cards, and coaching you to the close while the conversation
          is still happening.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
          >
            <ComputerDesktopIcon className="h-3.5 w-3.5" />
            Get a demo
          </Link>
          <Link
            to="/products/interviews"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            See Interviews product
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            How it works
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Three steps from call start to closed deal.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="rounded-2xl bg-white border border-gray-200 p-7">
                <p className="text-4xl font-black text-gray-100 mb-4 leading-none">{number}</p>
                <h3 className="font-black tracking-tight text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            Everything in the call, handled
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Lira gives your reps access to your entire playbook — without clicking away from the
            call.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl bg-white border border-gray-200 p-6 hover:border-gray-300 transition-all"
              >
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 mb-4">
                  <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <h3 className="font-black tracking-tight text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 border-t border-gray-200 text-center">
        <h2 className="mx-auto max-w-lg text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">
          Give your reps a coach in every call
        </h2>
        <p className="mx-auto max-w-md text-gray-500 mb-8 leading-relaxed">
          No behaviour change required. Lira works silently in the background — your reps just sell
          better.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
          >
            <ComputerDesktopIcon className="h-3.5 w-3.5" />
            Get a demo — it's free
          </Link>
          <a
            href="mailto:hello@creovine.com"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition py-3"
          >
            Talk to the team <ArrowRightIcon className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </MarketingLayout>
  )
}
