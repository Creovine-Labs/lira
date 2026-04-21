import { useState, useEffect, useCallback } from 'react'
import type { PortalConfig, CustomerSession } from './types'
import { getPortalConfig } from './api'
import { PortalShell } from './components/PortalShell'
import { PortalHome } from './pages/PortalHome'
import { SubmitTicket } from './pages/SubmitTicket'
import { MyTickets } from './pages/MyTickets'
import { TicketDetail } from './pages/TicketDetail'
import { ChatPage } from './pages/ChatPage'
import { loadSession, clearSession } from './components/AuthGate'

/**
 * Simple path-based router for the portal SPA.
 *
 * URL structure:
 *   /:orgSlug            → Home
 *   /:orgSlug/submit     → Submit ticket
 *   /:orgSlug/tickets    → My tickets (auth required)
 *   /:orgSlug/tickets/:id → Ticket detail (auth required)
 *   /:orgSlug/chat       → Live chat
 */

type Route =
  | { page: 'home' }
  | { page: 'submit' }
  | { page: 'tickets' }
  | { page: 'ticket-detail'; ticketId: string }
  | { page: 'chat' }
  | { page: 'not-found' }

function parseRoute(pathname: string): { orgSlug: string; route: Route } {
  // Remove trailing slash
  const path = pathname.replace(/\/+$/, '') || '/'
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) {
    return { orgSlug: '', route: { page: 'not-found' } }
  }

  const orgSlug = parts[0]
  const sub = parts[1] ?? ''

  switch (sub) {
    case '':
      return { orgSlug, route: { page: 'home' } }
    case 'submit':
      return { orgSlug, route: { page: 'submit' } }
    case 'tickets':
      if (parts[2]) {
        return { orgSlug, route: { page: 'ticket-detail', ticketId: parts[2] } }
      }
      return { orgSlug, route: { page: 'tickets' } }
    case 'chat':
      return { orgSlug, route: { page: 'chat' } }
    default:
      return { orgSlug, route: { page: 'not-found' } }
  }
}

export function App() {
  const [config, setConfig] = useState<PortalConfig | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<CustomerSession | null>(loadSession)
  const [route, setRoute] = useState<Route>({ page: 'home' })
  const [orgSlug, setOrgSlug] = useState('')

  // Check if URL has a magic link token (?token=xxx)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlToken = params.get('token')
    if (urlToken) {
      // Will be handled by AuthGate via verify flow
      // Remove token from URL to prevent re-use
      const url = new URL(window.location.href)
      url.searchParams.delete('token')
      window.history.replaceState({}, '', url.toString())
    }
  }, [])

  // Parse route from URL
  useEffect(() => {
    const { orgSlug: slug, route: r } = parseRoute(window.location.pathname)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrgSlug(slug)

    setRoute(r)

    const handlePop = () => {
      const { orgSlug: s, route: r2 } = parseRoute(window.location.pathname)
      setOrgSlug(s)
      setRoute(r2)
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  // Load portal config
  useEffect(() => {
    if (!orgSlug) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getPortalConfig(orgSlug)
      .then((c) => {
        setConfig(c)
        // Apply theme color as CSS variable
        document.documentElement.style.setProperty('--lp-accent', c.portalColor || '#3730a3')
        document.title = `${c.orgName} Support`
      })
      .catch(() => setError('This support portal is not available.'))
      .finally(() => setLoading(false))
  }, [orgSlug])

  const handleLogout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  // Intercept link clicks for SPA navigation
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return
      e.preventDefault()
      window.history.pushState({}, '', href)
      const { route: r } = parseRoute(href)
      setRoute(r)
      window.scrollTo(0, 0)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="lp-shell lp-loading-screen">
        <div className="lp-spinner" />
        <p>Loading support portal…</p>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="lp-shell lp-error-screen">
        <h1>Support Portal</h1>
        <p>{error || 'Portal not found.'}</p>
      </div>
    )
  }

  function renderPage() {
    if (!config) return null
    switch (route.page) {
      case 'home':
        return <PortalHome config={config} />
      case 'submit':
        if (config.ticketsEnabled === false) return <PortalHome config={config} />
        return <SubmitTicket config={config} />
      case 'tickets':
        if (config.trackEnabled === false) return <PortalHome config={config} />
        return <MyTickets config={config} session={session} onSession={setSession} />
      case 'ticket-detail':
        if (config.trackEnabled === false) return <PortalHome config={config} />
        return (
          <TicketDetail
            config={config}
            ticketId={route.ticketId}
            session={session}
            onSession={setSession}
          />
        )
      case 'chat':
        if (!config.chatEnabled) return <PortalHome config={config} />
        return <ChatPage config={config} />
      default:
        return (
          <div className="lp-page">
            <h2>Page not found</h2>
            <a href={`/${config.orgSlug}`}>Go to home</a>
          </div>
        )
    }
  }

  return (
    <PortalShell config={config} session={session} onLogout={handleLogout}>
      {renderPage()}
    </PortalShell>
  )
}
