import { useEffect, useRef } from 'react'
import { SEO } from '@/components/SEO'
import { env } from '@/env'
import { readDemoProfile } from '@/lib/demo-profile'

/**
 * Standalone harness for the answer-first full-page support SDK
 * (`layout: 'support_center'`). Unlike DemoHelpPage — which hand-builds its own
 * chat scaffolding around a small embedded widget — this page mounts ONLY the
 * SDK fullscreen support center into a full-viewport container. It's the
 * acceptance test for "does the SDK render a real support page on its own?"
 *
 * Points at the Nimbus demo org so there's real KB content to answer from.
 * Override the org with `?org=<id>`.
 *
 * In `npm run dev` it loads the locally-built bundle from /public/dev/widget.js
 * (rebuild with `npm run build:widget && cp dist/widget/widget.js public/dev/`);
 * production builds hit the CDN.
 */

const WIDGET_SRC = import.meta.env.DEV
  ? `/dev/widget.js?v=${Date.now()}`
  : 'https://widget.liraintelligence.com/v1/widget.js'
const SCRIPT_ID = 'lira-support-center-demo-script'
const TARGET_SELECTOR = '#lira-support-center-root'
const FALLBACK_ORG_ID = 'org-bfad94de-859d-4475-bcae-0107deaca433'

function resolveOrgId(): string {
  if (typeof window !== 'undefined') {
    const fromQuery = new URLSearchParams(window.location.search).get('org')
    if (fromQuery) return fromQuery
  }
  const fromEnv = (env as unknown as Record<string, string | undefined>).VITE_DEMO_ORG_ID
  return fromEnv || FALLBACK_ORG_ID
}

export function SupportCenterDemoPage() {
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true

    const orgId = resolveOrgId()
    document.getElementById(SCRIPT_ID)?.remove()

    // Personalize from the demo profile minted by the entry modal (the name
    // the visitor typed). No HMAC sig — this is an anonymous demo — so the
    // greeting personalizes but account-specific tools stay locked, exactly
    // like an unverified visitor on a real org install.
    const profile = readDemoProfile()

    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = WIDGET_SRC
    script.async = true
    script.dataset.orgId = orgId
    script.dataset.mode = 'fullscreen'
    script.dataset.layout = 'support_center'
    script.dataset.target = TARGET_SELECTOR
    script.dataset.title = 'Nimbus'
    script.dataset.color = '#1A1A1A'
    if (profile?.name) script.dataset.name = profile.name
    script.dataset.ephemeral = 'true'
    // Feed the demo account snapshot so the support page's account sidebar
    // populates (Plan, Next invoice, Card, Team) — mirrors what a real org
    // would pass via setContext for a signed-in visitor.
    if (profile) {
      const ctx = {
        plan: profile.plan,
        plan_label: profile.plan_label,
        next_invoice_date: profile.next_invoice_date,
        last_invoice_amount_usd: profile.last_invoice_amount_usd,
        team_seats: profile.team_seats,
        subscription_status: profile.subscription_status,
        card: { brand: profile.card.brand, last4: profile.card.last4 },
      }
      try {
        script.dataset.demoContext = btoa(JSON.stringify(ctx))
      } catch {
        /* context is best-effort */
      }
    }
    document.body.appendChild(script)

    return () => {
      try {
        ;(window as unknown as { Lira?: { destroy?: () => void } }).Lira?.destroy?.()
      } catch {
        /* widget already gone */
      }
      document.getElementById(SCRIPT_ID)?.remove()
      document
        .querySelectorAll<HTMLElement>('#lira-support-widget, [id^="lira-support"]')
        .forEach((el) => el.remove())
      delete (window as unknown as Record<string, unknown>).Lira
      mounted.current = false
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#fbfaf6' }}>
      <SEO
        title="Support Center SDK Demo"
        description="Answer-first full-page support SDK demo (layout: support_center)."
        path="/demo/support-center"
        noIndex
      />
      <div id="lira-support-center-root" style={{ minHeight: '100vh', width: '100%' }} />
    </div>
  )
}
