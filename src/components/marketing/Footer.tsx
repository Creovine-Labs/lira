import { Link } from 'react-router-dom'
import { InstagramLogo, LinkedinLogo, XLogo } from '@phosphor-icons/react'
import { LiraLogo } from '@/components/LiraLogo'

const FOOTER_GROUPS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Careers', href: '/careers' },
      { label: 'Book a Demo', href: '/book-demo' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Resources', href: '/resources' },
      { label: 'Blog', href: '/blog' },
      { label: 'Documentation', href: 'https://docs.liraintelligence.com' },
      { label: 'Security', href: '/security' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Acceptable Use', href: '/acceptable-use' },
    ],
  },
]

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/liraintelligence', icon: InstagramLogo },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/lira-intelligence', icon: LinkedinLogo },
  { label: 'X', href: 'https://x.com/liraintelligence', icon: XLogo },
]

function FooterLink({ href, label }: { href: string; label: string }) {
  const isExternal = href.startsWith('http')
  const className = 'block text-sm text-gray-500 transition hover:text-gray-950'

  return isExternal ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  ) : (
    <Link to={href} className={className}>
      {label}
    </Link>
  )
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-[#fbfaf6] px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <LiraLogo size="md" />
            <p className="mt-5 max-w-md text-sm leading-7 text-gray-600">
              Lira turns support into a relationship system: context-rich conversations, workflow
              action, voice mode, multilingual care, and smarter handoffs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {SOCIALS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#202527] text-white transition hover:-translate-y-0.5 hover:bg-black [&>svg]:text-white"
                >
                  <Icon size={18} weight="fill" className="text-white" />
                </a>
              ))}
            </div>
            <p className="mt-5 text-xs text-gray-500">
              Built by{' '}
              <a
                href="https://creovine.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-700 transition hover:text-gray-950"
              >
                CreoVine
              </a>
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-black uppercase tracking-wider text-gray-950">
                  {group.title}
                </h2>
                <div className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <FooterLink key={link.label} {...link} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Lira. All rights reserved.</span>
          <span>AI customer support that remembers, routes, and follows through.</span>
        </div>
      </div>
    </footer>
  )
}
