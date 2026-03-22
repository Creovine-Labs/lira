import { Link } from 'react-router-dom'
import {
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  StarIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Define the role',
    description:
      "ArrowUpTrayIcon a job description or fill in a short form. Tell Lira who you're looking for, what skills matter, and how you want candidates evaluated.",
  },
  {
    number: '02',
    title: 'Lira handles the outreach',
    description:
      'Lira sends personalised interview invites, handles scheduling, and sends reminders — no calendar back-and-forth, no admin overhead.',
  },
  {
    number: '03',
    title: 'AI conducts the interview',
    description:
      "Lira joins the meeting as the interviewer. It asks structured questions, follows up intelligently, and adapts based on the candidate's answers — all without you in the room.",
  },
  {
    number: '04',
    title: 'You get a scored report',
    description:
      'After every interview, Lira generates a detailed evaluation: scores per competency, a hire/no-hire recommendation, key quote highlights, and a candidate ranking if multiple have been interviewed.',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: EnvelopeIcon,
    title: 'Automated scheduling',
    description:
      'Lira sends, tracks, and follows up on interview invites. Candidates book their own slot from a smart link.',
  },
  {
    Icon: ChatBubbleLeftIcon,
    title: 'Structured AI interviews',
    description:
      'Every candidate gets the same high-quality, role-specific interview — consistent, fair, and thorough.',
  },
  {
    Icon: StarIcon,
    title: 'Competency scoring',
    description:
      'Lira scores each candidate against the rubric you define — not just gut feel, but grounded evidence.',
  },
  {
    Icon: ClipboardDocumentListIcon,
    title: 'Hire / no-hire reports',
    description:
      'Get a clear recommendation with supporting quotes from the interview transcript — ready to share with the hiring manager.',
  },
  {
    Icon: UsersIcon,
    title: 'Candidate ranking',
    description:
      'When interviewing multiple candidates, Lira ranks them against each other so the best rise to the top.',
  },
  {
    Icon: CheckBadgeIcon,
    title: 'Async-friendly',
    description:
      'Candidates can interview on their own schedule. No need to coordinate timezones with your HR team.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductInterviewsPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          Let AI run your
          <br />
          entire hiring process.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-gray-500 leading-relaxed">
          Lira schedules, conducts, and evaluates every first-round interview — then hands you a
          ranked shortlist with evidence-backed recommendations. Your hiring team only gets involved
          when it actually matters.
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
            to="/products/customer-support"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            See Customer Support product
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            From job description to shortlist
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Four steps. Zero scheduling calls. No interview fatigue.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map(({ number, title, description }) => (
              <div key={number} className="rounded-2xl bg-white border border-gray-200 p-6">
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
            A full hiring workflow, automated
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Lira handles every step that would otherwise fall on your HR team.
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
          Interview more candidates. Spend less time doing it.
        </h2>
        <p className="mx-auto max-w-md text-gray-500 mb-8 leading-relaxed">
          Your HR team's time is too valuable for first-round screening. Let Lira do that — and
          bring you only the people worth meeting.
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
