import { Link } from 'react-router-dom'
import { LiraLogo } from '@/components/LiraLogo'

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/liraintelligence',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: 'X',
    href: 'https://x.com/getlira',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/liraintelligence',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@LiraIntelligence',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    label: 'Docs',
    href: 'https://docs.liraintelligence.com',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
      >
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
]

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start justify-between gap-8">
        <div className="space-y-3 mb-2 sm:mb-0">
          <LiraLogo size="md" />
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            The AI that was actually in the room.
          </p>
          {/* Social icons */}
          <div className="flex items-center gap-3 pt-1">
            {SOCIALS.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>
          <p className="text-xs text-gray-300">
            © 2026{' '}
            <a
              href="https://creovine.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-500 transition-colors"
            >
              Creovine
            </a>
            . All rights reserved.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 text-sm">
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Product</p>
            {[
              { label: 'Sales', href: '/products/sales' },
              { label: 'Interviews', href: '/products/interviews' },
              { label: 'Customer Support', href: '/products/customer-support' },
              { label: 'Pricing', href: '/#pricing' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className="block text-gray-500 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Company</p>
            {[
              { label: 'Blog', href: '/blog' },
              { label: 'Resources', href: '/resources' },
              { label: 'Careers', href: '#' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className="block text-gray-500 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
            <a
              href="https://docs.liraintelligence.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-gray-500 hover:text-gray-900 transition-colors"
            >
              Documentation
            </a>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Legal</p>
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Cookies', href: '/cookies' },
              { label: 'Acceptable Use', href: '/acceptable-use' },
              { label: 'Security', href: '/security' },
            ].map(({ label, href }) => (
              <Link
                key={label}
                to={href}
                className="block text-gray-500 hover:text-gray-900 transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
