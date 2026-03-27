import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  Bars3Icon,
  BookOpenIcon,
  CheckBadgeIcon,
  ChevronDownIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  DocumentTextIcon,
  HeartIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { LiraLogo } from '@/components/LiraLogo'

// ─── Dropdown data ────────────────────────────────────────────────────────────

interface ProductItem {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  description: string
  href: string
  color: string
}

const PRODUCTS: ProductItem[] = [
  {
    Icon: ArrowTrendingUpIcon,
    label: 'Sales',
    description: 'Invisible real-time coaching inside every sales call — close more deals.',
    href: '/products/sales',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    Icon: CheckBadgeIcon,
    label: 'Interviews',
    description: 'Lira conducts, scores, and reports on every candidate — no HR time needed.',
    href: '/products/interviews',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    Icon: VideoCameraIcon,
    label: 'Meetings',
    description:
      'Lira joins your calls, takes notes, surfaces action items, and keeps everyone aligned.',
    href: '/products/meetings',
    color: 'bg-gray-100 text-gray-700',
  },
  {
    Icon: HeartIcon,
    label: 'Customer Support',
    description: 'Lira handles support calls word-for-word, guided by your knowledge base.',
    href: '/products/customer-support',
    color: 'bg-gray-100 text-gray-700',
  },
]

interface ResourceItem {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  href: string
}

const RESOURCES: ResourceItem[] = [
  { Icon: BookOpenIcon, label: 'How-to Guides', href: '/resources#guides' },
  { Icon: AcademicCapIcon, label: 'Tutorials', href: '/resources#tutorials' },
  { Icon: DocumentTextIcon, label: 'Documentation', href: '/resources#docs' },
  { Icon: CodeBracketIcon, label: 'API Reference', href: '/resources#api' },
]

// ─── Component ────────────────────────────────────────────────────────────────

type DropdownId = 'products' | 'resources' | null

export function MarketingNavbar() {
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<'solutions' | 'resources' | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openDropdown])

  const toggle = (id: DropdownId) => setOpenDropdown((prev) => (prev === id ? null : id))

  const close = () => setOpenDropdown(null)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
        scrolled ? 'bg-[#ebebeb]/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
      }`}
    >
      <div ref={navRef}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" aria-label="Lira AI home">
            <LiraLogo size="md" />
          </Link>

          {/* Desktop center nav */}
          <ul className="hidden md:flex items-center gap-2">
            {/* Products */}
            <li className="relative">
              <button
                onClick={() => toggle('products')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-black transition-colors ${
                  openDropdown === 'products'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                Solutions
                <ChevronDownIcon
                  className={`h-3 w-3 transition-transform duration-200 ${openDropdown === 'products' ? 'rotate-180' : ''}`}
                />
              </button>

              {openDropdown === 'products' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] rounded-2xl bg-white border border-gray-200 shadow-xl p-2 z-50">
                  {PRODUCTS.map(({ Icon, label, description, href, color }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={close}
                      className="flex items-start gap-3.5 p-3.5 rounded-xl hover:bg-gray-50 group transition-colors"
                    >
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-snug">{label}</p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                          {description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </li>

            {/* Resources */}
            <li className="relative">
              <button
                onClick={() => toggle('resources')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-black transition-colors ${
                  openDropdown === 'resources'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                Resources
                <ChevronDownIcon
                  className={`h-3 w-3 transition-transform duration-200 ${openDropdown === 'resources' ? 'rotate-180' : ''}`}
                />
              </button>

              {openDropdown === 'resources' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[240px] rounded-2xl bg-white border border-gray-200 shadow-xl p-2 z-50">
                  {RESOURCES.map(({ Icon, label, href }) => (
                    <Link
                      key={label}
                      to={href}
                      onClick={close}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="h-4 w-4 text-gray-700 shrink-0" />
                      <span className="text-sm font-black text-gray-900">{label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </li>

            {/* Blog */}
            <li>
              <Link
                to="/blog"
                className="inline-flex items-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-black text-white hover:bg-gray-700 transition-colors"
              >
                Blog
              </Link>
            </li>
          </ul>

          {/* Desktop right CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              <ComputerDesktopIcon className="h-3.5 w-3.5" />
              Try Beta
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Login
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-200/60"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-[#ebebeb] border-t border-gray-200 px-6 py-4 space-y-1">
            {/* Solutions accordion */}
            <button
              onClick={() => setMobileExpanded((v) => (v === 'solutions' ? null : 'solutions'))}
              className="flex w-full items-center justify-between py-2.5 text-sm font-black text-gray-900"
            >
              Solutions
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  mobileExpanded === 'solutions' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {mobileExpanded === 'solutions' && (
              <div className="pl-3 pb-1 space-y-0.5">
                {PRODUCTS.map(({ Icon, label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    className="flex items-center gap-2.5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border-b border-gray-100 last:border-0"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    {label}
                  </Link>
                ))}
              </div>
            )}

            {/* Resources accordion */}
            <button
              onClick={() => setMobileExpanded((v) => (v === 'resources' ? null : 'resources'))}
              className="flex w-full items-center justify-between py-2.5 text-sm font-black text-gray-900 border-t border-gray-100"
            >
              Resources
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                  mobileExpanded === 'resources' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {mobileExpanded === 'resources' && (
              <div className="pl-3 pb-1 space-y-0.5">
                {RESOURCES.map(({ Icon, label, href }) => (
                  <Link
                    key={label}
                    to={href}
                    className="flex items-center gap-2.5 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border-b border-gray-100 last:border-0"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                    {label}
                  </Link>
                ))}
              </div>
            )}

            <Link
              to="/blog"
              className="block border-t border-gray-100 py-2.5 text-sm font-black text-gray-900 hover:text-gray-700"
              onClick={() => setMobileOpen(false)}
            >
              Blog
            </Link>
            <div className="flex flex-col gap-2 pt-4">
              <Link
                to="/signup"
                className="inline-flex justify-center items-center gap-2 rounded-full bg-gray-900 px-4 py-2.5 text-sm font-medium text-white"
              >
                <ComputerDesktopIcon className="h-3.5 w-3.5" />
                Try Beta
              </Link>
              <Link
                to="/login"
                className="inline-flex justify-center items-center gap-1 text-sm font-medium text-gray-700 py-2"
              >
                Login <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
