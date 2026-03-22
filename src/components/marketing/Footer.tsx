import { Link } from 'react-router-dom'
import { LiraLogo } from '@/components/LiraLogo'

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 py-10 px-6">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-start justify-between gap-8">
        <div className="space-y-2 mb-2 sm:mb-0">
          <LiraLogo size="md" />
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            The AI that was actually in the room.
          </p>
          <p className="text-xs text-gray-300">© 2026 Creovine. All rights reserved.</p>
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
          </div>
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Legal</p>
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <a
                key={l}
                href={`/${l.toLowerCase()}`}
                className="block text-gray-500 hover:text-gray-900 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
