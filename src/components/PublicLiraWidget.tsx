import { useEffect } from 'react'
import { env } from '@/env'

const WIDGET_SCRIPT_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const SCRIPT_ID = 'lira-public-site-widget-script'

function encodeContext(payload: Record<string, unknown>): string | null {
  try {
    return btoa(JSON.stringify(payload))
  } catch {
    return null
  }
}

/**
 * Anonymous Lira widget for public marketing pages.
 *
 * This intentionally does not identify the visitor or ask for credentials.
 * Account-specific help should route to /login or /forgot-password so the
 * dashboard widget can use verified identity and live product context.
 */
export function PublicLiraWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const existing = document.getElementById(SCRIPT_ID)
    if (existing) existing.remove()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = WIDGET_SCRIPT_SRC
    script.async = true
    script.dataset.orgId = env.VITE_LIRA_PUBLIC_ORG_ID
    script.dataset.title = 'Lira'
    script.dataset.color = '#1A1A1A'
    script.dataset.position = 'bottom-right'
    script.dataset.ephemeral = 'true'
    script.dataset.greeting =
      'Ask me about Lira, SDK setup, pricing, or getting help with your account.'

    const context = encodeContext({
      platform: 'lira-public-site',
      route: window.location.pathname,
      page_title: 'Lira marketing site',
      visitor_state: 'anonymous',
      security_policy:
        'Do not disclose account data from an email alone. For account-specific help, route the visitor to /login or /forgot-password.',
      auth_links: {
        login: '/login',
        forgot_password: '/forgot-password',
        book_demo: '/book-demo',
      },
    })
    if (context) script.dataset.demoContext = context

    document.body.appendChild(script)

    return () => {
      try {
        const api = window as unknown as { Lira?: { destroy?: () => void } }
        api.Lira?.destroy?.()
      } catch {
        /* widget already gone */
      }
      script.remove()
      document.querySelectorAll<HTMLElement>('#lira-support-widget').forEach((el) => el.remove())
      delete (window as unknown as Record<string, unknown>).LiraWidget
      delete (window as unknown as Record<string, unknown>).Lira
    }
  }, [])

  return null
}
