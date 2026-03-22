import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BookOpenIcon,
  CodeBracketIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'guides',
    Icon: BookOpenIcon,
    color: 'bg-gray-100 text-gray-700',
    heading: 'How-to Guides',
    subtitle: 'Step-by-step instructions for common tasks and workflows.',
    items: [
      'Adding Lira to a Google Meet',
      'Setting up your organisation knowledge base',
      'Creating your first interview role',
      'Connecting Slack for post-meeting task delivery',
      "Configuring Lira's voice and persona",
      'Managing team members and permissions',
    ],
  },
  {
    id: 'tutorials',
    Icon: AcademicCapIcon,
    color: 'bg-gray-100 text-gray-700',
    heading: 'Tutorials',
    subtitle: 'Deeper walkthroughs to help you get the most from each product.',
    items: [
      'Running your first AI interview end-to-end',
      'Building a sales playbook Lira can reference in calls',
      'Uploading and structuring your knowledge base for best results',
      'Using the task engine with Jira and Linear',
      'Reading and acting on your meeting intelligence reports',
      'Setting up escalation rules for customer support',
    ],
  },
  {
    id: 'docs',
    Icon: DocumentTextIcon,
    color: 'bg-gray-100 text-gray-700',
    heading: 'Documentation',
    subtitle: 'Full reference docs for all Lira features and settings.',
    items: [
      'Lira platform overview',
      'Meeting Intelligence — full reference',
      'Interview module configuration',
      'Customer Support — knowledge base indexing',
      'Webhook event schema',
      'Roles and permissions model',
    ],
  },
  {
    id: 'api',
    Icon: CodeBracketIcon,
    color: 'bg-gray-100 text-gray-700',
    heading: 'API Reference',
    subtitle: 'Integrate Lira into your own products and workflows.',
    items: [
      'Authentication and API keys',
      'Meetings API',
      'Interviews API',
      'Knowledge base API',
      'Webhooks',
      'Rate limits and error codes',
    ],
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ResourcesPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 text-center">
        <h1 className="mx-auto max-w-xl text-5xl sm:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          Everything you need
          <br />
          to get started.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-gray-500 leading-relaxed">
          Guides, tutorials, full documentation, and API reference — all in one place.
        </p>
      </section>

      {/* Resource sections */}
      {SECTIONS.map(({ id, Icon, color, heading, subtitle, items }) => (
        <section key={id} id={id} className="py-16 px-6 border-t border-gray-200">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-start gap-4 mb-10">
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black tracking-tight text-gray-900">{heading}</h2>
                <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((item) => (
                <a
                  key={item}
                  href={`/resources/${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="group flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200 px-5 py-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <span className="text-sm font-black text-gray-800 group-hover:text-gray-900">
                    {item}
                  </span>
                  <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-20 px-6 border-t border-gray-200 text-center">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-3">
          Can't find what you need?
        </h2>
        <p className="text-gray-500 mb-7 text-sm">Our team is happy to help.</p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition shadow-sm"
        >
          Talk to us
        </Link>
      </section>
    </MarketingLayout>
  )
}
