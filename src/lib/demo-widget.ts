import { useEffect, useState } from 'react'
import { env } from '@/env'
import { readDemoProfile, updateDemoProfile, type DemoProfile } from './demo-profile'

/**
 * Shared Lira widget mounter for the demo pages (DemoSitePage + DemoHelpPage).
 *
 * The widget is loaded from the public CDN and uses data-org-id to identify
 * the demo org in production. Order of precedence for the org id:
 *   1. ?org=<id> query param (lets you point it at any org for live demos)
 *   2. VITE_DEMO_ORG_ID env var (set in Vercel)
 *   3. Hard-coded fallback (update after you create a demo org)
 *
 * The test-visitor flow (?visitor=test) signs an HMAC client-side with a
 * shared secret. It is dev-only and guarded by import.meta.env.DEV — see the
 * SECURITY note inside `mount()`.
 */

const WIDGET_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const WIDGET_SCRIPT_ID = 'lira-support-widget'
// The Nimbus demo org id. Matches the same value baked into seo-prerender.cjs
// so the SPA and the prerendered static HTML mount the widget against the
// same org. Override via VITE_DEMO_ORG_ID env var when targeting a different
// org for a live customer demo.
const FALLBACK_ORG_ID = 'org-bfad94de-859d-4475-bcae-0107deaca433'

const TEST_VISITOR_EMAIL = 'jane@nimbus.test'
const TEST_VISITOR_NAME = 'Jane Smith'

function resolveOrgId(): string {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('org')
    if (fromQuery) return fromQuery
  }
  const fromEnv = (env as unknown as Record<string, string | undefined>).VITE_DEMO_ORG_ID
  if (fromEnv) return fromEnv
  return FALLBACK_ORG_ID
}

function isTestVisitorMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('visitor') === 'test'
}

/** Compute HMAC-SHA256 client-side (demo only — never do this in production with a real secret). */
async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface UseLiraWidgetResult {
  /** True when the dev-only test-visitor flow successfully signed an identity. */
  testVisitor: boolean
}

/**
 * Mount the Lira support widget on the page. Tears down on unmount so the
 * widget cleanly switches when the visitor navigates between /demo and
 * /demo/help (the shared session lets the conversation continue).
 */
export function useLiraWidget(): UseLiraWidgetResult {
  const [testVisitor, setTestVisitor] = useState(false)

  useEffect(() => {
    const orgId = resolveOrgId()
    const visitorMode = isTestVisitorMode()

    // The widget snapshots its config from data-* attrs at mount, so we
    // bake the demo profile (if any) into a base64 attribute. The widget
    // decodes it and forwards it to the server over WS at connect, where
    // the AI agent reads it to answer account-aware questions.
    const profile = readDemoProfile()
    const demoContext = profile ? encodeDemoContext(buildDemoContextPayload(profile)) : null

    // Mirror agent-driven mutations back into the local profile so the
    // dashboard re-renders. The widget dispatches `lira-demo-action` after
    // receiving `demo_action_executed` from the server.
    const onDemoAction = (event: Event) => {
      const detail = (event as CustomEvent<{ type: string; payload: Record<string, unknown> }>).detail
      if (!detail) return
      applyDemoAction(detail.type, detail.payload)
    }
    window.addEventListener('lira-demo-action', onDemoAction)

    async function mount() {
      const existing = document.getElementById(WIDGET_SCRIPT_ID)
      if (existing) existing.remove()

      const script = document.createElement('script')
      script.id = WIDGET_SCRIPT_ID
      script.src = WIDGET_SRC
      script.async = true
      script.setAttribute('data-org-id', orgId)
      script.setAttribute('data-position', 'bottom-right')
      // Ephemeral storage: opt-in flag ONLY our public demo (Nimbus) sets.
      // The widget reads this and stores visitor id + chat history in
      // sessionStorage instead of localStorage, scoped to visitor id. That
      // way two demo testers on a shared machine never see each other's
      // chats. Real customer embeds (set up by Stripe, Acme, etc. via their
      // own copy-paste script) do not include this attribute, so production
      // visitors retain history across sessions exactly as before.
      script.setAttribute('data-ephemeral', 'true')
      if (demoContext) {
        script.setAttribute('data-demo-context', demoContext)
      }

      // SECURITY: the HMAC-from-client flow signs payloads with a shared
      // secret. If that secret were ever bundled into a production build,
      // anyone inspecting the JS could forge identities against the real
      // backend. The DEV guard below ensures this branch only runs in local
      // development builds — production bundles will not include or execute
      // it, even if VITE_DEMO_WIDGET_SECRET is somehow defined.
      if (visitorMode && import.meta.env.DEV) {
        const demoSecret = env.VITE_DEMO_WIDGET_SECRET
        if (demoSecret) {
          const sig = await hmacSha256(demoSecret, TEST_VISITOR_EMAIL)
          script.setAttribute('data-email', TEST_VISITOR_EMAIL)
          script.setAttribute('data-name', TEST_VISITOR_NAME)
          script.setAttribute('data-sig', sig)
          setTestVisitor(true)
        }
      } else if (visitorMode && !import.meta.env.DEV) {
        // Loud warning if anyone tries to use ?visitor=test in production
        console.warn(
          '[DemoSite] ?visitor=test is ignored in production builds. ' +
            'The HMAC test-visitor flow only runs in development.',
        )
      }

      document.body.appendChild(script)
    }

    void mount()

    return () => {
      window.removeEventListener('lira-demo-action', onDemoAction)
      // Remove the loader script tag we injected.
      document.querySelectorAll<HTMLElement>(`script#${WIDGET_SCRIPT_ID}`).forEach((el) =>
        el.remove(),
      )
      // Remove the widget host element the bundle creates (id matches the
      // script tag id — `lira-support-widget` — but they're separate nodes
      // so we have to clean them up explicitly, not just via getElementById).
      document
        .querySelectorAll<HTMLElement>(
          [
            `[id^="${WIDGET_SCRIPT_ID}"]`,
            '[id^="lira-widget"]',
            '[id^="lira-support"]',
          ].join(','),
        )
        .forEach((el) => el.remove())
      // Also try the public destroy hook the bundle exposes, in case the
      // widget renders into a portal we didn't catch above.
      const w = (window as unknown as { LiraWidget?: { destroy?: () => void } }).LiraWidget
      try {
        w?.destroy?.()
      } catch {
        /* widget already gone */
      }
      delete (window as unknown as Record<string, unknown>).LiraWidget
    }
  }, [])

  return { testVisitor }
}

export const DEMO_WIDGET_CONFIG = Object.freeze({
  TEST_VISITOR_EMAIL,
  TEST_VISITOR_NAME,
})

// ── Demo profile ↔ widget bridge ─────────────────────────────────────────────
//
// The widget needs the profile in the shape the backend's
// SyntheticNimbusProfile expects (snake_case, is_synthetic flag, etc.). We
// also send a compact version of the local dashboard derived values so the
// agent can reference invoice totals, MRR, top customers, etc. without
// re-deriving them server-side.

function buildDemoContextPayload(profile: DemoProfile): Record<string, unknown> {
  return {
    visitor_id: profile.visitor_id,
    name: profile.name,
    plan: profile.plan,
    plan_label: profile.plan_label,
    open_issues: profile.open_issues,
    signed_up_at: profile.signed_up_at,
    last_invoice_amount_usd: profile.last_invoice_amount_usd,
    last_invoice_date: profile.last_invoice_date,
    next_invoice_date: profile.next_invoice_date,
    team_seats: profile.team_seats,
    is_synthetic: true,
    card: { brand: profile.card.brand, last4: profile.card.last4, exp: profile.card.exp },
    subscription_status: profile.subscription_status,
  }
}

function encodeDemoContext(payload: Record<string, unknown>): string {
  try {
    return btoa(JSON.stringify(payload))
  } catch {
    return ''
  }
}

/**
 * Reflect a server-confirmed demo action into the local profile. The agent
 * already wrote to the backend's in-memory cache, but the dashboard reads
 * from sessionStorage — so we need to mirror the change here so the UI
 * re-renders.
 */
function applyDemoAction(type: string, payload: Record<string, unknown>): void {
  switch (type) {
    case 'plan_upgraded': {
      const plan = String(payload.plan ?? '') as DemoProfile['plan']
      if (!plan) return
      updateDemoProfile({
        plan,
        plan_label: String(payload.plan_label ?? ''),
        subscription_status: 'active',
        last_invoice_amount_usd: Number(payload.last_invoice_amount_usd ?? 0) || undefined,
        last_invoice_date: String(payload.last_invoice_date ?? ''),
        next_invoice_date: String(payload.next_invoice_date ?? ''),
      } as Partial<DemoProfile>)
      return
    }
    case 'subscription_canceled': {
      updateDemoProfile({ subscription_status: 'canceled' })
      return
    }
    case 'card_updated': {
      const card = payload.card as { brand: string; last4: string; exp: string } | undefined
      if (!card) return
      updateDemoProfile({
        card: {
          brand: card.brand as DemoProfile['card']['brand'],
          last4: card.last4,
          exp: card.exp,
        },
      })
      return
    }
    case 'password_reset_sent': {
      // No dashboard mutation needed — the chat card is enough confirmation.
      return
    }
  }
}
