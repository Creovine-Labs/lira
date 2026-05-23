import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  House,
  InstagramLogo,
  LinkedinLogo,
  List,
  Sparkle,
  X,
  XLogo,
} from '@phosphor-icons/react'
import { AnimatePresence, motion } from 'framer-motion'
import { MarketingFooter, MarketingNavbar } from '@/components/marketing'
import { DOCS_BASE_URL } from '@/lib/docs'

export function BlogStyles() {
  return (
    <style>{`
      .bx-page { --text: #020308; --muted: rgba(2,3,8,0.62); --line: rgba(2,3,8,0.14); --panel: rgba(255,255,255,0.68); --panel-strong: rgba(255,255,255,0.86); --cream: #fbfaf6; min-height: 100vh; background: #ebebeb; color: var(--text); font-family: var(--font-sans); overflow-x: clip; overflow-y: visible; }
      .bx-page * { box-sizing: border-box; }
      .bx-container { width: min(1120px, calc(100% - 48px)); margin: 0 auto; }
      .bx-nav { position: absolute; inset: 18px 0 auto; z-index: 50; pointer-events: none; }
      .bx-nav-shell { display: flex; align-items: center; justify-content: space-between; gap: 18px; pointer-events: auto; }
      .bx-logo { display: flex; align-items: center; gap: 10px; color: #ffffff; font-weight: 800; text-shadow: 0 2px 18px rgba(0,0,0,0.72); }
      .bx-logo-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: rgba(0,0,0,0.38); color: #ffffff; border: 1px solid rgba(255,255,255,0.64); box-shadow: 0 8px 24px rgba(0,0,0,0.22); overflow: hidden; }
      .bx-logo-mark img { width: 25px; height: 22px; object-fit: contain; display: block; filter: drop-shadow(0 2px 6px rgba(0,0,0,0.18)); }
      .bx-nav-links { display: flex; align-items: center; gap: 8px; }
      .bx-nav-actions { display: flex; align-items: center; gap: 8px; }
      .bx-menu-link { display: inline-flex; align-items: center; gap: 8px; min-height: 38px; padding: 5px 7px 5px 15px; border-radius: 999px; background: rgba(2,3,8,0.72); color: #ffffff; font-size: 13px; line-height: 1; font-weight: 800; box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 10px 26px rgba(0,0,0,0.16); transition: transform 0.24s ease, background 0.24s ease; }
      .bx-menu-link svg { width: 28px; height: 28px; padding: 7px; border-radius: 50%; background: rgba(255,255,255,0.14); color: #ffffff; transition: transform 0.24s ease, background 0.24s ease; }
      .bx-menu-link:hover, .bx-menu-link:focus-visible { color: #ffffff; background: #020308; transform: translateY(-1px); }
      .bx-menu-link:hover svg, .bx-menu-link:focus-visible svg { background: rgba(255,255,255,0.2); transform: translate(1px, -1px); }
      .bx-mobile-toggle { display: none; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #202527; color: #ffffff; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); cursor: pointer; }
      .bx-mobile-toggle svg { color: #ffffff; }
      .bx-mobile-menu { position: absolute; left: 24px; right: 24px; top: calc(100% + 8px); display: grid; gap: 6px; padding: 10px; border: 1px solid rgba(255,255,255,0.22); border-radius: 18px; background: rgba(32,37,39,0.96); box-shadow: 0 22px 60px rgba(0,0,0,0.22); backdrop-filter: blur(18px); pointer-events: auto; }
      .bx-mobile-menu a { display: flex; align-items: center; min-height: 44px; padding: 0 14px; border-radius: 12px; color: #ffffff; font-size: 14px; font-weight: 800; }
      .bx-mobile-menu a:hover { background: rgba(255,255,255,0.1); color: #ffffff; }
      .bx-button { display: inline-flex; align-items: center; gap: 4px; min-height: 50px; color: #ffffff; font-size: 14px; line-height: 1; font-weight: 800; text-transform: uppercase; white-space: nowrap; transition: transform 0.28s ease, filter 0.28s ease; }
      .bx-button:hover, .bx-button:focus-visible { transform: translateY(-2px); filter: drop-shadow(0 12px 22px rgba(0,0,0,0.18)); color: #ffffff; }
      .bx-button-label { display: inline-flex; align-items: center; min-height: 50px; padding: 0 22px; border-radius: 999px; background: #202527; color: #ffffff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); }
      .bx-button-icon { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 50%; background: #202527; color: #ffffff; box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.16); }
      .bx-button-icon svg { transition: transform 0.24s ease; }
      .bx-button:hover .bx-button-icon svg, .bx-button:focus-visible .bx-button-icon svg { transform: translate(2px, -2px); }
      .bx-hero { position: relative; min-height: 560px; padding: 140px 0 92px; overflow: hidden; }
      .bx-hero-bg { position: absolute; inset: 0; z-index: 0; background-image: linear-gradient(180deg, rgba(0,0,0,0.68), rgba(0,0,0,0.55)), linear-gradient(90deg, rgba(251,250,246,0.04), rgba(251,250,246,0.02)), url('/landing-v1/hero-2.webp'); background-size: cover; background-position: center 34%; }
      .bx-hero-bg::after { content: ''; position: absolute; inset: 0; background-image: linear-gradient(rgba(2,3,8,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(2,3,8,0.055) 1px, transparent 1px); background-size: 54px 54px; mask-image: linear-gradient(180deg, black 0%, black 62%, transparent 100%); }
      .bx-hero-inner { position: relative; z-index: 1; display: grid; grid-template-columns: minmax(0, 1fr) 340px; align-items: end; gap: 56px; }
      .bx-kicker { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 22px; color: #ffffff; font-family: var(--font-sans); font-size: 12px; font-weight: 800; text-transform: uppercase; text-shadow: 0 2px 14px rgba(0,0,0,0.7); }
      .bx-title { max-width: 780px; margin: 0; color: #ffffff; font-family: var(--font-sans); font-size: clamp(42px, 6vw, 72px); line-height: 1.08; font-weight: 700; letter-spacing: 0; text-shadow: 0 2px 22px rgba(0,0,0,0.42); }
      .bx-subtitle { max-width: 560px; margin: 22px 0 0; color: #ffffff; font-family: var(--font-sans); line-height: 1.55; text-shadow: 0 2px 4px rgba(0,0,0,0.72), 0 10px 28px rgba(0,0,0,0.58); }
      .bx-main { position: relative; z-index: 2; padding: 96px 0 120px; }
      .bx-featured-grid { display: grid; grid-template-columns: 1.45fr 0.8fr; gap: 16px; align-items: stretch; }
      .bx-post-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
      .bx-split { display: grid; grid-template-columns: 0.9fr 1.3fr; gap: 18px; align-items: stretch; }
      .bx-split-reverse { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px; align-items: stretch; }
      .bx-section-title { margin: 0; font-family: var(--font-sans); font-size: clamp(28px, 3.4vw, 36px); line-height: 1.22; font-weight: 700; letter-spacing: 0; color: var(--text); }
      .bx-section-copy { margin: 14px 0 0; max-width: 460px; color: var(--muted); line-height: 1.65; }
      .bx-post-card { display: flex; flex-direction: column; min-height: 100%; padding: 8px; border: 1px solid var(--line); border-radius: 18px; background: var(--panel); color: var(--text); overflow: hidden; transition: transform 0.28s ease, border-color 0.28s ease, box-shadow 0.28s ease; }
      .bx-post-card:hover, .bx-post-card:focus-visible { color: var(--text); transform: translateY(-5px); border-color: rgba(2,3,8,0.3); box-shadow: 0 24px 70px rgba(2,3,8,0.1); }
      .bx-post-surface { flex: 1; padding: 24px; border: 1px solid rgba(2,3,8,0.08); border-radius: 12px; background: var(--panel-strong); }
      .bx-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 20px; color: rgba(2,3,8,0.48); font-size: 12px; font-weight: 700; }
      .bx-chip { display: inline-flex; align-items: center; min-height: 26px; padding: 0 10px; border-radius: 999px; background: #202527; color: #ffffff; font-size: 11px; font-weight: 800; }
      .bx-post-title { margin: 0; color: var(--text); font-family: var(--font-sans); font-size: 22px; line-height: 1.28; font-weight: 700; letter-spacing: 0; overflow-wrap: anywhere; }
      .bx-post-excerpt { margin: 14px 0 0; color: var(--muted); line-height: 1.65; }
      .bx-author { display: flex; align-items: center; gap: 10px; margin-top: 28px; padding-top: 20px; border-top: 1px solid rgba(2,3,8,0.08); }
      .bx-avatar { display: block; width: 42px; height: 42px; border-radius: 50%; background: #f3f0e8; overflow: hidden; border: 1px solid rgba(2,3,8,0.12); flex: none; }
      .bx-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .bx-author strong { display: block; color: var(--text); font-size: 13px; }
      .bx-author span { display: block; color: rgba(2,3,8,0.48); font-size: 12px; }
      .bx-footer { border-top: 1px solid var(--line); padding: 42px 0; }
      .bx-footer-inner { display: flex; justify-content: space-between; gap: 32px; align-items: center; color: var(--muted); font-size: 14px; }
      .bx-footer-links { display: flex; gap: 16px; flex-wrap: wrap; }
      .bx-footer-note { margin-top: 10px; color: rgba(2,3,8,0.5); font-size: 13px; }
      .bx-social-links { display: flex; gap: 10px; margin-top: 16px; }
      .bx-social-links a { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: #202527; color: #ffffff; opacity: 1; transition: transform 0.24s ease, background 0.24s ease; }
      .bx-social-links a:hover, .bx-social-links a:focus-visible { transform: translateY(-2px); background: #020308; color: #ffffff; }
      .bx-social-links svg { color: #ffffff; }
      .bx-footer a { color: var(--muted); }
      .bx-footer a:hover { color: var(--text); }
      .bx-page--article .bx-logo { color: #020308; text-shadow: none; }
      .bx-page--article .bx-logo-mark { background: #202527; border-color: rgba(2,3,8,0.18); }
      .bx-article { max-width: 760px; margin: 0 auto; }
      .bx-back { margin-bottom: 34px; }
      .bx-article-head { padding-bottom: 38px; border-bottom: 1px solid var(--line); }
      .bx-article-title { margin: 18px 0 22px; font-family: var(--font-sans); font-size: clamp(38px, 5.3vw, 64px); line-height: 1.08; font-weight: 700; letter-spacing: 0; color: var(--text); }
      .bx-article-excerpt { margin: 0; color: var(--muted); font-size: 18px; line-height: 1.7; }
      .bx-prose { margin-top: 52px; display: flex; flex-direction: column; gap: 22px; }
      .bx-prose p { margin: 0; color: rgba(2,3,8,0.7); font-size: 17px; line-height: 1.85; }
      .bx-post-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 72px; padding-top: 28px; border-top: 1px solid var(--line); }
      .bx-post-nav .bx-post-card { min-height: auto; }
      .bx-post-nav-label { margin: 0 0 8px; color: rgba(2,3,8,0.45); font-size: 11px; font-weight: 800; text-transform: uppercase; }
      @media (max-width: 820px) {
        .bx-container { width: min(100% - 32px, 720px); }
        .bx-nav { inset: 14px 0 auto; }
        .bx-nav-shell { gap: 12px; }
        .bx-nav-links { display: none; }
        .bx-mobile-toggle { display: inline-flex; }
        .bx-hero { min-height: auto; padding-top: 118px; padding-bottom: 72px; }
        .bx-hero-inner { grid-template-columns: 1fr; gap: 34px; }
        .bx-title { font-size: 38px; line-height: 1.12; letter-spacing: 0; }
        .bx-subtitle { max-width: 100%; font-size: 14px; line-height: 1.65; }
        .bx-main { padding: 72px 0 92px; }
        .bx-featured-grid, .bx-post-grid, .bx-split, .bx-split-reverse { grid-template-columns: 1fr; }
        .bx-section-title { font-size: 28px; letter-spacing: 0; }
        .bx-post-surface { padding: 20px; }
        .bx-footer-inner { flex-direction: column; align-items: flex-start; }
        .bx-post-nav { grid-template-columns: 1fr; }
      }
      @media (max-width: 520px) {
        .bx-container { width: min(100% - 24px, 420px); }
        .bx-logo { min-width: auto; }
        .bx-nav-actions { display: none; }
        .bx-hero { padding-top: 96px; padding-bottom: 58px; }
        .bx-title { font-size: 30px; }
        .bx-section-title { font-size: 24px; }
        .bx-post-title { font-size: 19px; }
        .bx-article-title { font-size: 32px; letter-spacing: 0; }
        .bx-article-excerpt, .bx-prose p { font-size: 15px; }
        .bx-post-surface { padding: 16px; }
        .bx-button { min-height: 46px; font-size: 12px; }
        .bx-button-label { min-height: 46px; padding: 0 18px; }
        .bx-button-icon { width: 46px; height: 46px; }
        .bx-post-surface pre { font-size: 10px !important; line-height: 1.7 !important; padding: 16px !important; }
      }
    `}</style>
  )
}

export function BlogButton({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="bx-button">
      <span className="bx-button-label">{children}</span>
      <span className="bx-button-icon">
        <ArrowUpRight size={22} />
      </span>
    </Link>
  )
}

function BlogLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link
      to="/"
      className="bx-logo"
      style={dark ? { color: '#020308', textShadow: 'none' } : undefined}
      aria-label="Lira home"
    >
      <span
        className="bx-logo-mark"
        style={dark ? { background: '#202527', borderColor: 'rgba(2,3,8,0.18)' } : undefined}
      >
        <img src="/lira_mark_white.webp" alt="" aria-hidden="true" />
      </span>
      <span>Lira</span>
    </Link>
  )
}

const blogSocialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/liraintelligence', icon: InstagramLogo },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/lira-intelligence',
    icon: LinkedinLogo,
  },
  { label: 'X', href: 'https://x.com/liraintelligence', icon: XLogo },
]

export function BlogNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="bx-nav">
      <div className="bx-container bx-nav-shell">
        <BlogLogo />
        <nav className="bx-nav-links" aria-label="Primary navigation">
          <Link to="/" className="bx-menu-link">
            <span>Home</span>
            <House size={15} weight="fill" />
          </Link>
          <Link to="/features" className="bx-menu-link">
            <span>Features</span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/about-us" className="bx-menu-link">
            <span>About</span>
            <ArrowUpRight size={15} />
          </Link>
          <Link to="/blog" className="bx-menu-link">
            <span>Blog</span>
            <ArrowUpRight size={15} />
          </Link>
        </nav>
        <div className="bx-nav-actions">
          <BlogButton to="/login">Log in</BlogButton>
          <BlogButton to="/book-demo">Speak to an expert</BlogButton>
        </div>
        <button
          type="button"
          className="bx-mobile-toggle"
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              className="bx-mobile-menu"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <Link to="/" onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link to="/features" onClick={() => setMobileOpen(false)}>
                Features
              </Link>
              <Link to="/about-us" onClick={() => setMobileOpen(false)}>
                About
              </Link>
              <Link to="/blog" onClick={() => setMobileOpen(false)}>
                Blog
              </Link>
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                Log in
              </Link>
              <Link to="/book-demo" onClick={() => setMobileOpen(false)}>
                Speak to an expert
              </Link>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export function BlogFooter() {
  return (
    <footer className="bx-footer">
      <div className="bx-container bx-footer-inner">
        <div>
          <BlogLogo dark />
          <p className="bx-footer-note">Built by Creovine</p>
          <div className="bx-social-links" aria-label="Social links">
            {blogSocialLinks.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} aria-label={label} target="_blank" rel="noreferrer">
                <Icon size={18} weight="fill" className="text-white" />
              </a>
            ))}
          </div>
        </div>
        <div className="bx-footer-links">
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/about-us">About</Link>
          <Link to="/blog">Blog</Link>
          <Link to="/resources">Resources</Link>
          <a href={DOCS_BASE_URL} target="_blank" rel="noreferrer">
            Tutorials
          </a>
          <a href={DOCS_BASE_URL} target="_blank" rel="noreferrer">
            Documentation
          </a>
          <Link to="/security">Security</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/cookies">Cookies</Link>
        </div>
      </div>
    </footer>
  )
}

export function BlogShell({
  children,
  article = false,
}: {
  children: ReactNode
  article?: boolean
}) {
  return (
    <div className={`bx-page${article ? ' bx-page--article' : ''}`}>
      <BlogStyles />
      <MarketingNavbar variant={article ? 'light' : 'overlay'} />
      {children}
      <MarketingFooter />
    </div>
  )
}

export function BlogKicker({ children }: { children: ReactNode }) {
  return (
    <span className="bx-kicker">
      <Sparkle size={14} weight="fill" />
      {children}
    </span>
  )
}
