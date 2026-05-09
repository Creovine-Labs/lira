import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, List, X } from '@phosphor-icons/react'
import { LiraLogo } from '@/components/LiraLogo'

interface MarketingNavbarProps {
  variant?: 'light' | 'overlay'
}

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/features' },
  { label: 'Resources', href: '/resources' },
  { label: 'Careers', href: '/careers' },
  { label: 'Blog', href: '/blog' },
]

function NavCta({
  to,
  children,
  subtle = false,
}: {
  to: string
  children: string
  subtle?: boolean
}) {
  const tone = subtle ? 'bg-white/16 text-white ring-1 ring-white/42' : 'bg-[#202527] text-white'

  return (
    <Link
      to={to}
      className="group inline-flex min-h-11 items-center justify-center gap-1 text-xs font-extrabold uppercase tracking-normal text-white transition hover:-translate-y-0.5"
    >
      <span
        className={`inline-flex min-h-11 items-center rounded-full px-4 shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition group-hover:bg-black ${tone}`}
      >
        {children}
      </span>
      <span
        className={`grid h-11 w-11 place-items-center rounded-full shadow-[0_14px_30px_rgba(0,0,0,0.16)] transition group-hover:bg-black ${tone}`}
      >
        <ArrowUpRight
          size={16}
          weight="bold"
          className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </Link>
  )
}

export function MarketingNavbar({ variant = 'light' }: MarketingNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const isOverlay = variant === 'overlay'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const shellClass =
    isOverlay && !scrolled
      ? 'absolute inset-x-0 top-0 z-[777] text-white'
      : 'fixed inset-x-0 top-0 z-[777] border-b border-gray-200/70 bg-[#fbfaf6]/90 text-gray-900 shadow-sm backdrop-blur-md'

  const linkClass =
    isOverlay && !scrolled ? 'text-white/88 hover:text-white' : 'text-gray-700 hover:text-gray-950'

  return (
    <header className={shellClass}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" aria-label="Lira home" className="flex items-center gap-2">
          <LiraLogo
            size="md"
            className={
              isOverlay && !scrolled
                ? '[&_span]:text-white [&_img]:brightness-0 [&_img]:invert'
                : ''
            }
          />
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link to={link.href} className={`text-sm font-semibold transition ${linkClass}`}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <NavCta to="/signup">Signup for free</NavCta>
          {isOverlay && !scrolled ? (
            <NavCta to="/book-demo" subtle>
              Book a demo
            </NavCta>
          ) : (
            <Link
              to="/book-demo"
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-white px-5 text-sm font-semibold text-gray-900 ring-1 ring-gray-200 transition hover:bg-gray-50"
            >
              Book a demo
              <ArrowUpRight size={14} weight="bold" />
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden ${
            isOverlay && !scrolled ? 'bg-white/14 text-white' : 'bg-gray-900 text-white'
          }`}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-[#fbfaf6] p-4 shadow-xl md:hidden">
          <div className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 grid gap-2 border-t border-gray-200 pt-4">
            <Link
              to="/signup"
              className="inline-flex justify-center rounded-full bg-[#202527] px-4 py-3 text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Signup for free
            </Link>
            <Link
              to="/book-demo"
              className="inline-flex justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-gray-900 ring-1 ring-gray-200"
              onClick={() => setMobileOpen(false)}
            >
              Book a demo
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
