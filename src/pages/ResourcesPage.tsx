import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'
import { DOCS_BASE_URL, getDocsUrl } from '@/lib/docs'
import {
  ArrowRight,
  BookOpenText,
  Browser,
  ChatsCircle,
  EnvelopeSimple,
  Handshake,
  Megaphone,
  Plug,
  ShieldCheck,
} from '@phosphor-icons/react'

const RESOURCE_GROUPS = [
  {
    label: 'How-to guides',
    description: 'Practical setup guides for launching Lira as your customer support layer.',
    items: [
      {
        title: 'Install the Lira chat widget',
        summary: 'Add the script tag, choose placement, and launch website chat.',
        href: getDocsUrl('chat-widget'),
        Icon: ChatsCircle,
      },
      {
        title: 'Verify logged-in customers',
        summary: 'Use signed identity so Lira can personalize replies and take account actions.',
        href: getDocsUrl('verified-customers'),
        Icon: ShieldCheck,
      },
      {
        title: 'Forward your support email',
        summary: 'Route Gmail, Outlook, or your help address into the Lira support inbox.',
        href: getDocsUrl('email-forwarding'),
        Icon: EnvelopeSimple,
      },
      {
        title: 'Publish a support portal',
        summary: 'Create a customer-facing portal for chat, knowledge, and follow-up.',
        href: getDocsUrl('support-portal'),
        Icon: Browser,
      },
    ],
  },
  {
    label: 'Tutorials',
    description: 'Walkthroughs for the workflows teams use after the first install.',
    items: [
      {
        title: 'Build your support knowledge base',
        summary: 'Connect docs and website content so answers are grounded in your product.',
        href: getDocsUrl('knowledge-base'),
        Icon: BookOpenText,
      },
      {
        title: 'Handle human handoff',
        summary: 'Escalate conversations, reply as a teammate, then hand the thread back to Lira.',
        href: getDocsUrl('human-handoff'),
        Icon: Handshake,
      },
      {
        title: 'Create proactive outreach',
        summary: 'Trigger email or voice follow-ups for failed payments, risk, renewals, and more.',
        href: getDocsUrl('proactive-outreach'),
        Icon: Megaphone,
      },
      {
        title: 'Connect support tool packs',
        summary: 'Let Lira look up subscriptions, create tickets, and call approved actions.',
        href: getDocsUrl('tool-packs'),
        Icon: Plug,
      },
    ],
  },
]

const QUICK_LINKS = [
  { label: 'View docs', href: DOCS_BASE_URL },
  { label: 'Watch tutorials', href: DOCS_BASE_URL },
  { label: 'Customer support features', href: '/features' },
]

function ResourceLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className: string
}) {
  const isExternal = href.startsWith('http')

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={className}>
      {children}
    </Link>
  )
}

export function ResourcesPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Resources - Customer Support Guides, Tutorials & API Reference"
        description="Customer support guides and tutorials for launching Lira: chat widget, verified customers, email forwarding, support portal, knowledge base, handoff, proactive outreach, APIs, and webhooks."
        keywords="Lira customer support guides, Lira chat widget, support portal, customer support API, support automation tutorials"
        path="/resources"
      />

      <main>
        <section className="px-6 pb-16 pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-[1.04] tracking-tight text-gray-950 sm:text-6xl">
                Customer support resources for launching Lira
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
                Guides, tutorials, documentation, and API references focused on the customer support
                workflows available in Lira today.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {QUICK_LINKS.map((link) => (
                  <ResourceLink
                    key={link.label}
                    href={link.href}
                    className="inline-flex items-center gap-2 rounded-full bg-[#202527] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                  >
                    {link.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </ResourceLink>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-[30px] border border-gray-200 bg-white/80 p-7 lg:max-w-3xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#202527] text-white">
                <BookOpenText className="h-6 w-6" weight="duotone" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-gray-950">
                Need the docs directly?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                Open the official Lira docs for setup guides, platform walkthroughs, and product
                references that match the live platform.
              </p>
              <div className="mt-5">
                <a
                  href={DOCS_BASE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#202527] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
                >
                  View docs
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {RESOURCE_GROUPS.map((group) => (
          <section key={group.label} className="border-t border-gray-200 px-6 py-16">
            <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-gray-950">{group.label}</h2>
                <p className="mt-4 max-w-sm text-sm leading-7 text-gray-600">{group.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map(({ title, summary, href, Icon }) => (
                  <a
                    key={title}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-2xl border border-gray-200 bg-white/78 p-5 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_22px_60px_rgba(2,3,8,0.09)]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#202527] text-white">
                      <Icon className="h-5 w-5" weight="duotone" />
                    </div>
                    <h3 className="mt-5 text-base font-black leading-6 text-gray-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{summary}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-950">
                      Open guide
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="px-6 py-16">
          <div className="mx-auto rounded-3xl border border-gray-200 bg-white/78 p-8 text-center sm:p-12">
            <h2 className="text-3xl font-black tracking-tight text-gray-950">
              Want the fastest path?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600">
              Create a free account, activate customer support, and use the in-app setup checklist
              to launch widget, email, and portal channels.
            </p>
            <div className="mt-7 flex justify-center">
              <Link
                to="/signup"
                className="inline-flex rounded-full bg-[#202527] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
              >
                Signup for free
              </Link>
            </div>
          </div>
        </section>
      </main>
    </MarketingLayout>
  )
}
