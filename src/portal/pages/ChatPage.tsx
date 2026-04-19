import { useEffect, useRef } from 'react'
import type { PortalConfig } from '../types'

interface ChatPageProps {
  config: PortalConfig
}

/**
 * Full-page live chat — embeds the existing Lira chat widget in an expanded
 * inline container rather than the floating bubble. We inject the widget
 * script dynamically and open it automatically.
 */
export function ChatPage({ config }: ChatPageProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const injectedRef = useRef(false)

  useEffect(() => {
    if (injectedRef.current) return
    injectedRef.current = true

    const script = document.createElement('script')
    script.src = 'https://widget.liraintelligence.com/v1/widget.js'
    script.setAttribute('data-org-id', config.orgId)
    script.setAttribute('data-greeting', config.greeting || 'Hi! How can we help?')
    script.setAttribute('data-color', config.portalColor || '#3730a3')
    script.setAttribute('data-position', 'bottom-right')
    document.body.appendChild(script)

    // Auto-open the widget once loaded
    const timer = setInterval(() => {
      const w = document.querySelector('lira-support-widget')
      if (w) {
        // The widget exposes an open() method via its shadow DOM
        const shadow = w.shadowRoot
        if (shadow) {
          const launcher = shadow.querySelector('[data-lira-launcher]') as HTMLElement | null
          launcher?.click()
          clearInterval(timer)
        }
      }
    }, 300)

    return () => clearInterval(timer)
  }, [config])

  return (
    <div className="lp-page lp-chat-page">
      <div className="lp-chat-header">
        <h2>Live Chat</h2>
        <p>Chat with our AI assistant for instant help.</p>
      </div>
      <div ref={containerRef} className="lp-chat-container">
        <p className="lp-chat-hint">
          The chat widget will appear in the bottom-right corner of this page.
        </p>
      </div>
    </div>
  )
}
