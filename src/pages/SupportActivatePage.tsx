import { useNavigate } from 'react-router-dom'
import {
  BoltIcon,
  ChatBubbleLeftEllipsisIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

const PILLARS = [
  {
    icon: BoltIcon,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Proactive outreach',
    desc: "Reaches customers before they contact you — catching problems as they happen.",
  },
  {
    icon: CpuChipIcon,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'Autonomous action engine',
    desc: 'Takes real actions across HubSpot, Slack, Linear and more — not just words.',
  },
  {
    icon: ChatBubbleLeftEllipsisIcon,
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50',
    title: 'Lifetime customer memory',
    desc: 'Remembers every interaction so every conversation starts from full context.',
  },
  {
    icon: SparklesIcon,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    title: 'Self-improving knowledge',
    desc: 'Learns from every escalation — measurably smarter each week without your input.',
  },
]

const ALREADY_CONNECTED = [
  'HubSpot & Salesforce integrations',
  'Linear ticket creation',
  'Slack & Teams notifications',
  'Knowledge base (RAG via Qdrant)',
  'Voice AI (Nova Sonic)',
  'Email inbound & outbound',
]

export function SupportActivatePage() {
  const navigate = useNavigate()

  // Redirect to the support entry page which now owns the activation modal.
  // Keep this component so existing /support/activate links still work.
  return (
    <div className="flex min-h-full flex-col overflow-y-auto bg-white">
      {/* ── Top gradient bar ── */}
      <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500" />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 py-16">
        {/* ── Hero ── */}
        <div className="mb-12 text-center">
          {/* Icon cluster */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 shadow-lg shadow-violet-200">
              <ChatBubbleLeftEllipsisIcon className="h-7 w-7 text-white" />
            </div>
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
            New module
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900">
            Activate Lira Customer Support
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
            The world&apos;s first proactive autonomous support AI. Setup takes 10 minutes —
            by the end, Lira is answering your customer emails.
          </p>
        </div>

        {/* ── Architecture diagram ── */}
        <div className="mb-12 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-8">
          <p className="mb-6 text-center text-xs font-semibold uppercase tracking-widest text-gray-400">
            How it works
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-gray-700">
            {[
              { label: 'Customer email / chat / call', color: 'bg-gray-100 text-gray-600' },
              { label: '→', color: 'text-gray-300 font-light' },
              { label: 'Lira AI identifies intent', color: 'bg-violet-100 text-violet-700' },
              { label: '→', color: 'text-gray-300 font-light' },
              { label: 'Takes action across your tools', color: 'bg-purple-100 text-purple-700' },
              { label: '→', color: 'text-gray-300 font-light' },
              { label: 'Customer resolved', color: 'bg-green-100 text-green-700' },
            ].map((item, i) => (
              <span
                key={i}
                className={`rounded-lg px-3 py-1.5 ${item.color}`}
              >
                {item.label}
              </span>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['HubSpot', 'Salesforce', 'Linear', 'Slack', 'Teams', 'GitHub', 'Voice (Nova Sonic)'].map(
              (tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500"
                >
                  {tool}
                </span>
              )
            )}
          </div>
        </div>

        {/* ── 4 pillars ── */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}
              >
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Already connected note ── */}
        <div className="mb-10 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
          <p className="mb-3 text-sm font-semibold text-violet-800">
            Already connected from your workspace:
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALREADY_CONNECTED.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-violet-700">
                <CheckCircleIcon className="h-4 w-4 shrink-0 text-violet-500" />
                {item}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-violet-600/70">
            Lira will reuse your existing connections — no need to reconnect.
          </p>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate('/support/onboarding')}
            className="flex items-center gap-2 rounded-xl bg-violet-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 active:scale-95"
          >
            Start 10-minute setup
            <ArrowRightIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => navigate('/support')}
            className="rounded-xl border border-gray-200 px-7 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Back to overview
          </button>
        </div>
      </main>
    </div>
  )
}
