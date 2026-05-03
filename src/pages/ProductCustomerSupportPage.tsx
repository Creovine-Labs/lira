import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import {
  ArrowRightIcon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  HeartIcon,
  MapIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Upload your knowledge base',
    description:
      "Connect your docs, website, product guides, and FAQs. Lira indexes everything and builds a semantic memory of your company's knowledge.",
  },
  {
    number: '02',
    title: 'Customer calls in',
    description:
      'Customers call your support line or join a support meeting link. Lira answers as a natural, confident voice — not a robotic phone tree.',
  },
  {
    number: '03',
    title: 'Lira handles the conversation',
    description:
      'Lira answers questions, walks through troubleshooting steps, shares relevant resources, and resolves the issue — all grounded in your exact knowledge base.',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: PhoneIcon,
    title: 'Real-time voice support',
    description:
      'Lira joins calls as a natural-sounding voice agent — no robotic responses, no phone tree frustration.',
  },
  {
    Icon: CircleStackIcon,
    title: 'Knowledge base grounding',
    description:
      "Every answer comes from your actual company docs — not hallucinated content. Lira only says what you've authorised.",
  },
  {
    Icon: ChatBubbleLeftIcon,
    title: 'Handles complex Q&A',
    description:
      'Multi-step questions, policy clarifications, technical troubleshooting — Lira resolves the full conversation, not just the surface question.',
  },
  {
    Icon: MapIcon,
    title: 'Smart escalation',
    description:
      "When a case exceeds Lira's confidence threshold, it routes to a human agent — with a full summary of the conversation already prepared.",
  },
  {
    Icon: ShieldCheckIcon,
    title: 'Controlled responses',
    description:
      "You decide what Lira can and can't say. Set guardrails, define escalation rules, and keep full control of your brand voice.",
  },
  {
    Icon: HeartIcon,
    title: 'Post-call summaries',
    description:
      'Every support call ends with a structured summary, outcome classification, and suggested KB improvements if a gap was found.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductCustomerSupportPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Customer Support — Voice Agent Grounded in Your Knowledge Base"
        description="Lira AI handles inbound customer support calls 24/7 with a voice agent grounded in your documentation. No hallucinations, smart escalation to humans, post-call summaries, and knowledge base gap identification."
        keywords="AI customer support, customer support automation, AI voice agent, knowledge base AI, support chatbot, AI phone support, customer service AI, automated support calls, help desk AI, support ticket automation, voice AI customer service, intelligent escalation, customer support bot, AI call center, Lira AI support"
        path="/products/customer-support"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Lira AI Customer Support',
          description:
            'AI voice agent for customer support calls, grounded in your knowledge base with smart escalation and post-call analytics.',
          brand: { '@type': 'Brand', name: 'Lira AI' },
          category: 'Customer Service Software',
          url: 'https://liraintelligence.com/products/customer-support',
        }}
      />
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          AI support calls,
          <br />
          grounded in your docs.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-gray-500 leading-relaxed">
          Lira handles inbound customer support calls — answering questions, walking through
          troubleshooting, and resolving issues — all powered by your company's knowledge base.
          Customers get instant, accurate help. Your team gets their time back.
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
            to="/products/sales"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            See Sales product
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            From knowledge base to resolved call
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Set it up once. Lira handles every call that comes in.
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
            A support agent that never goes offline
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Lira is on 24/7. It never has a bad day, never puts customers on hold, and never gives
            the wrong answer from your docs.
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
          Support that scales without adding headcount
        </h2>
        <p className="mx-auto max-w-md text-gray-500 mb-8 leading-relaxed">
          Every question your customers ask already has an answer somewhere in your docs. Lira finds
          it instantly — every time.
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
