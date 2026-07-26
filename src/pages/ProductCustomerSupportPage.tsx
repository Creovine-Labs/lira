import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import {
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  CircleStackIcon,
  ComputerDesktopIcon,
  SparklesIcon,
  TicketIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: '01',
    title: 'Teach Lira your product',
    description:
      'Connect your docs, help center, web pages, and Google Drive. Lira indexes everything and grounds every answer in your real content — no hallucinations.',
  },
  {
    number: '02',
    title: 'Put Lira where customers already are',
    description:
      'Drop in the chat widget with one script tag, embed the in-app support surface, publish a branded portal, forward your support email, or connect WhatsApp. One agent, every channel.',
  },
  {
    number: '03',
    title: 'Lira resolves — and escalates cleanly',
    description:
      'Lira answers, runs approved actions, and opens a ticket with full context when a human is needed. Your team picks up mid-conversation with nothing lost.',
  },
]

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: CircleStackIcon,
    title: 'Grounded in your knowledge',
    description:
      "Every answer comes from your actual documentation using retrieval-augmented generation — Lira only says what you've taught it, and cites your real content.",
  },
  {
    Icon: ChatBubbleLeftRightIcon,
    title: 'Every channel, one agent',
    description:
      'A website chat widget, an embedded in-app support surface, a hosted portal, email, inbound voice (rolling out), and WhatsApp — all handled by the same AI, with shared context.',
  },
  {
    Icon: TicketIcon,
    title: 'Tickets, SLA & CSAT',
    description:
      'When Lira escalates, it opens a ticket with the full transcript, verified identity, and knowledge snippets attached. Queues, routing, SLA tracking, and satisfaction scoring included.',
  },
  {
    Icon: ShieldCheckIcon,
    title: 'Secure in-product actions',
    description:
      'Register actions Lira can run for a customer — cancel a subscription, retry a payment, resend an invoice — each with an approval policy and a full audit trail. Off by default, opt-in per action.',
  },
  {
    Icon: UserGroupIcon,
    title: 'Clean human handoff',
    description:
      'Any teammate reply pauses the AI until handback. Escalation triggers on low confidence or sensitive intents like fraud, disputes, and account security — never a dead end.',
  },
  {
    Icon: SparklesIcon,
    title: 'Proactive & self-improving',
    description:
      'Send event-triggered outreach (failed payment, onboarding nudge, renewal), and when Lira answers poorly it drafts knowledge-base entries for your approval so it keeps getting better.',
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ProductCustomerSupportPage() {
  return (
    <MarketingLayout>
      <SEO
        title="AI Customer Support — Grounded in Your Knowledge Base"
        description="Lira resolves customer support across chat, an in-app support surface, a portal, email, voice, and WhatsApp — grounded in your knowledge base. Autonomous ticket resolution, secure in-product actions, and clean human handoff."
        keywords="AI customer support, customer support automation, omnichannel support, knowledge base AI, support chatbot, AI support agent, help desk automation, ticket automation, in-app support, WhatsApp support, customer service AI, intelligent escalation, Lira AI support"
        path="/products/customer-support"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: 'Lira AI Customer Support',
          description:
            'AI customer support platform that resolves conversations across chat, an in-app support surface, a portal, email, voice, and WhatsApp — grounded in your knowledge base, with secure in-product actions and clean human handoff.',
          brand: { '@type': 'Brand', name: 'Lira AI' },
          category: 'Customer Service Software',
          url: 'https://liraintelligence.com/products/customer-support',
        }}
      />
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-2xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          AI customer support,
          <br />
          grounded in your docs.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-base text-gray-500 leading-relaxed">
          Lira resolves customer conversations across chat, your app, a portal, email, and WhatsApp
          — every answer grounded in your knowledge base. It opens tickets, takes approved actions
          in your product, and hands off to a human only when it should.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
          >
            <ComputerDesktopIcon className="h-3.5 w-3.5" />
            Book a demo
          </Link>
          <Link
            to="/features"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            Explore all features
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            From knowledge base to resolved conversation
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Set it up once. Lira handles every conversation that comes in, on every channel.
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
            Lira is on 24/7. It never has a bad day, never puts customers on hold, and never invents
            an answer that isn't in your docs.
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

      {/* Built for developers */}
      <section className="py-16 px-6 border-t border-gray-200">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
            Deep enough for your engineers
          </h2>
          <p className="text-gray-500 mb-12 max-w-md leading-relaxed">
            Lira isn't a black box. Connect your own tools and build support directly into your
            product and mobile apps.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                title: 'Connect your own tools with MCP',
                description:
                  'Bring Lira your Model Context Protocol server so it can call your systems under your own auth — with per-tool approval, OAuth 2.1, rate limits, and drift detection.',
              },
              {
                number: '02',
                title: 'Developer API keys & CLI',
                description:
                  'Scoped, revocable API keys and the @liraintelligence/support CLI to connect servers, approve tools, and mint short-lived customer session tokens.',
              },
              {
                number: '03',
                title: 'Native mobile support SDK',
                description:
                  "Build native in-app support over Lira's chat WebSocket — with confirm-before-action, step-up re-auth for sensitive actions, and human takeover.",
              },
            ].map(({ number, title, description }) => (
              <div key={number} className="rounded-2xl bg-white border border-gray-200 p-7">
                <p className="text-4xl font-black text-gray-100 mb-4 leading-none">{number}</p>
                <h3 className="font-black tracking-tight text-gray-900 mb-2">{title}</h3>
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
          it instantly — on every channel, every time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/book-demo"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
          >
            <ComputerDesktopIcon className="h-3.5 w-3.5" />
            Book a demo
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition py-3"
          >
            See pricing <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
