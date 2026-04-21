import type { ReactNode } from 'react'
import type { PortalConfig, CustomerSession } from '../types'

const LIRA_LOGO = 'https://liraintelligence.com/lira_black.png'

interface PortalShellProps {
  config: PortalConfig
  session: CustomerSession | null
  onLogout: () => void
  children: ReactNode
}

export function PortalShell({ config, session, onLogout, children }: PortalShellProps) {
  const accent = config.portalColor || '#3730a3'
  const logo = config.logoUrl

  return (
    <div className="lp-shell">
      {/* Header */}
      <header className="lp-header" style={{ borderBottomColor: accent }}>
        <div className="lp-header-inner">
          <a href={`/${config.orgSlug}`} className="lp-header-brand">
            {logo ? (
              <img src={logo} alt={config.orgName} className="lp-header-logo" />
            ) : (
              <span className="lp-header-org">{config.orgName}</span>
            )}
            <span className="lp-header-title">Support</span>
          </a>

          <nav className="lp-nav">
            <a href={`/${config.orgSlug}`} className="lp-nav-link">
              Home
            </a>
            {(config.ticketsEnabled ?? true) && (
              <a href={`/${config.orgSlug}/submit`} className="lp-nav-link">
                Submit Ticket
              </a>
            )}
            {(config.trackEnabled ?? true) && (
              <a href={`/${config.orgSlug}/tickets`} className="lp-nav-link">
                My Tickets
              </a>
            )}
          </nav>

          <div className="lp-header-right">
            {session ? (
              <div className="lp-user-badge">
                <span className="lp-user-name">{session.name || session.email}</span>
                <button onClick={onLogout} className="lp-btn-link lp-logout">
                  Sign out
                </button>
              </div>
            ) : (
              <a href={`/${config.orgSlug}/tickets`} className="lp-btn-outline">
                Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lp-main">{children}</main>

      {/* Footer */}
      <footer className="lp-footer">
        <p>
          Powered by{' '}
          <a
            href="https://liraintelligence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="lp-footer-link"
          >
            <img src={LIRA_LOGO} alt="Lira" className="lp-footer-lira" />
            Lira
          </a>
        </p>
      </footer>
    </div>
  )
}
