import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, useKBStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { getLiraWidgetCreds, type LiraWidgetCreds } from '@/services/api'
import { publishLiraRuntimeContext, type LiraRuntimeContext } from '@/lib/lira-runtime-context'

/**
 * Lira's own customer-support widget, embedded inside the Lira admin
 * dashboard. New customers who just finished onboarding land on /dashboard
 * and see this widget greet them by name and walk them through setup
 * conversationally. The same widget code that customers install on their
 * own sites — we just point it at Lira's internal org.
 *
 * Identity flow:
 *   1. Mount → fetch HMAC-signed creds from `/v1/auth/me/lira-widget`.
 *      Backend signs (user.email, LIRA_INTERNAL_WIDGET_SECRET) → returns
 *      { orgId, email, name, sig }. The secret never leaves the server.
 *   2. Inject `<script src=".../widget.js" data-org-id=… data-email=…
 *      data-name=… data-sig=…>` into <body>. The widget WS handshake
 *      verifies the HMAC against the same secret in DDB.
 *   3. On unmount, leave the script + custom-element behind so navigating
 *      between admin pages doesn't blink the widget. The widget itself
 *      persists its open/closed state via its own storage.
 *
 * Renders nothing — pure side-effect mount. Add wherever the widget
 * should be visible (typically just /dashboard, but works on any page).
 */

const WIDGET_SCRIPT_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const SCRIPT_ID = 'lira-onboarding-widget-script'

export function LiraOnboardingWidget() {
  const { token, userEmail } = useAuthStore()
  const { organizations, currentOrgId } = useOrgStore()
  const supportConfig = useSupportStore((s) => s.config)
  const kbEntries = useKBStore((s) => s.entries)
  const crawlStatus = useKBStore((s) => s.crawlStatus)
  const navigate = useNavigate()
  const location = useLocation()
  // "First-time" = user's currently-selected org hasn't activated support yet.
  // Drives the greeting copy: onboarding nudge vs. plain "how can I help".
  const isFirstTime = !supportConfig?.activated
  // Use the CURRENTLY-SELECTED org, not the first in the array. If the
  // user is viewing Lemonpay in the dashboard, context should be Lemonpay
  // even if Lemonpay isn't organizations[0].
  const currentOrg =
    organizations.find((o) => o.org_id === currentOrgId) ?? organizations[0] ?? null

  const runtimeContext = useMemo(
    () =>
      buildRuntimeContext({
        location,
        userEmail,
        currentOrg,
        supportConfig,
        kbPageCount: kbEntries.length,
        crawlStatus,
      }),
    [location, userEmail, currentOrg, supportConfig, kbEntries.length, crawlStatus]
  )

  // Intercept the widget's navigate events so the dashboard does SPA
  // navigation via React Router instead of `window.open(_, '_self')`,
  // which would full-reload the page and tear the widget down. With this
  // listener active, the widget stays mounted and open when Lira jumps
  // the visitor between admin pages mid-onboarding.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ url?: string; target?: string }>).detail
      if (!detail?.url) return
      // External URLs and `_blank` requests should fall through to the
      // widget's window.open default. We only intercept same-tab nav to
      // an internal path.
      if (detail.target && detail.target !== '_self') return
      if (!detail.url.startsWith('/')) return
      e.preventDefault()
      navigate(detail.url)
    }
    window.addEventListener('lira-host-navigate', handler)
    return () => window.removeEventListener('lira-host-navigate', handler)
  }, [navigate])

  // Action layer: Lira tells the dashboard to do something — prefill an
  // input, click a button. Resolved against data-lira-action attributes
  // on real DOM elements (kb-crawl-url, kb-crawl-start, etc.), never
  // against arbitrary selectors. Silent no-op if the target isn't on
  // the current page (Lira can always navigate the visitor first).
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          action_type?: string
          target?: string
          value?: string
        }>
      ).detail
      if (!detail?.action_type || !detail.target) return

      const el = document.querySelector(`[data-lira-action="${detail.target}"]`)
      if (!el) {
        console.warn(`[lira-action] target not found on current page:`, detail.target)
        return
      }

      if (detail.action_type === 'prefill_input' && el instanceof HTMLInputElement) {
        // Set value via the React-friendly path so onChange fires and
        // controlled inputs update their state.
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set
        if (setter) setter.call(el, detail.value ?? '')
        else el.value = detail.value ?? ''
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.focus()
        return
      }

      if (detail.action_type === 'click' && el instanceof HTMLElement) {
        el.click()
        return
      }

      console.warn(`[lira-action] unknown action_type:`, detail.action_type)
    }
    window.addEventListener('lira:action', handler)
    return () => window.removeEventListener('lira:action', handler)
  }, [])

  useEffect(() => {
    if (!token || !userEmail || !currentOrg) return
    publishLiraRuntimeContext(runtimeContext)
  }, [token, userEmail, currentOrg, runtimeContext])

  useEffect(() => {
    // Only mount for authenticated users with an email on file. The
    // widget needs an HMAC sig over their email; anonymous users would
    // get a different (worse) experience.
    if (!token || !userEmail) return

    let cancelled = false
    let injectedScript: HTMLScriptElement | null = null

    void (async () => {
      let creds: LiraWidgetCreds
      try {
        creds = await getLiraWidgetCreds()
      } catch (err) {
        // 503 here is expected when LIRA_INTERNAL_ORG_ID env vars aren't
        // set on the backend (e.g. local dev). Fail closed silently —
        // no widget rather than a broken one.
        console.warn('[lira-onboarding-widget] not configured:', err)
        return
      }
      if (cancelled) return

      // Skip if a widget tagged with the SAME orgId is already mounted
      // (route change re-renders the component but the widget should
      // survive). Different orgId would mean a config change — overwrite.
      const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
      if (existing && existing.dataset.orgId === creds.orgId) return
      existing?.remove()
      document.querySelector('lira-support-widget')?.remove()

      // Full visitor + org snapshot the agent reads on every reply. Lets
      // Lira say "Hi Sarah from Lemonpay, I see you're setting up a
      // fintech app on both web and mobile" instead of asking which org
      // they're on. Includes everything captured during onboarding so the
      // agent doesn't re-ask anything the customer already told us.
      const profile = currentOrg?.profile
      const context = {
        platform: 'lira-admin-dashboard',
        user_name: creds.name,
        user_email: creds.email,
        org_id: currentOrg?.org_id ?? null,
        org_name: currentOrg?.name ?? null,
        org_created_at: currentOrg?.created_at ?? null,
        company_name: profile?.company_name ?? null,
        industry: profile?.industry ?? null,
        website: profile?.website ?? null,
        description: profile?.description ?? null,
        size: profile?.size ?? null,
        surfaces: profile?.surfaces ?? null,
        support_activated: Boolean(supportConfig?.activated),
      }

      const script = document.createElement('script')
      script.id = SCRIPT_ID
      script.src = WIDGET_SCRIPT_SRC
      script.async = true
      script.dataset.orgId = creds.orgId
      script.dataset.email = creds.email
      if (creds.name) script.dataset.name = creds.name
      script.dataset.sig = creds.sig
      script.dataset.position = 'bottom-right'
      // Match the dashboard's near-black brand color so the launcher fits
      // visually. Customers customising via the data-color attribute on
      // their own embeds keep their value (this only overrides our default
      // here, not the per-org config they set on their support settings).
      script.dataset.color = '#1A1A1A'
      // Auto-pop the widget on first load. Stays open across reloads
      // until the user clicks close, then never auto-pops again for this
      // browser+org. The widget handles all the persistence under
      // `lira_widget_dismissed_<orgId>` in localStorage.
      script.dataset.autoOpenFirstVisit = 'true'
      // Greeting copy differs based on whether the user has set support up.
      // First-time: nudge them to begin onboarding. Returning: plain offer
      // to help. The widget reads data-greeting once on mount; we re-mount
      // on activated-state change via the useEffect dependency.
      const firstName = creds.name?.split(' ')[0]
      script.dataset.greeting = isFirstTime
        ? firstName
          ? `Hi ${firstName}, I'm Lira. Want me to walk you through setting up your support agent?`
          : "Hi, I'm Lira. Want me to walk you through setting up your support agent?"
        : firstName
          ? `Hi ${firstName}, how can I help today?`
          : 'Hi, how can I help today?'
      // Pass the snapshot via base64 JSON the same way the Nimbus demo
      // does (the widget decodes data-demo-context → demoContext config →
      // sends as `demo_context` over WS at connect).
      try {
        script.dataset.demoContext = btoa(JSON.stringify(context))
      } catch {
        /* ignore — context is best-effort */
      }
      document.body.appendChild(script)
      injectedScript = script
    })()

    return () => {
      cancelled = true
      // Intentionally leave the script + widget in the DOM between
      // navigations so the chat panel doesn't flicker. Full teardown
      // only happens on logout (auth store clears, this component
      // unmounts and the next render skips the early-return so no new
      // script is added; the old one keeps working until full reload).
      void injectedScript
    }
  }, [token, userEmail, currentOrg, isFirstTime, supportConfig?.activated])

  return null
}

function buildRuntimeContext(args: {
  location: ReturnType<typeof useLocation>
  userEmail: string | null
  currentOrg: ReturnType<typeof useOrgStore.getState>['organizations'][number] | null
  supportConfig: ReturnType<typeof useSupportStore.getState>['config']
  kbPageCount: number
  crawlStatus: ReturnType<typeof useKBStore.getState>['crawlStatus']
}): LiraRuntimeContext {
  const { location, userEmail, currentOrg, supportConfig, kbPageCount, crawlStatus } = args
  const profile = currentOrg?.profile
  const searchParams = new URLSearchParams(location.search)
  const knowledgeTab = location.pathname.startsWith('/org/knowledge')
    ? (searchParams.get('tab') ?? 'documents')
    : null
  const knowledgeSourceType = normaliseKnowledgeSourceType(knowledgeTab)

  return {
    app: 'lira-admin-dashboard',
    route: location.pathname,
    search: location.search || undefined,
    page_title: inferPageTitle(location.pathname),
    tab: knowledgeTab,
    workflow: {
      name: 'support_onboarding',
      step: inferOnboardingStep(location.pathname, knowledgeTab),
    },
    visitor: {
      email: userEmail,
    },
    organisation: {
      org_id: currentOrg?.org_id ?? null,
      name: currentOrg?.name ?? null,
      created_at: currentOrg?.created_at ?? null,
      company_name: profile?.company_name ?? null,
      industry: profile?.industry ?? null,
      website: profile?.website ?? null,
      description: profile?.description ?? null,
      size: profile?.size ?? null,
      surfaces: profile?.surfaces ?? null,
    },
    support: {
      activated: Boolean(supportConfig?.activated),
      chat_enabled: Boolean(supportConfig?.chat_enabled),
      portal_enabled: Boolean(supportConfig?.portal_enabled),
      portal_chat_enabled: Boolean(supportConfig?.portal_chat_enabled),
      portal_slug: supportConfig?.portal_slug ?? null,
      auto_reply_enabled: supportConfig?.auto_reply_enabled !== false,
      email_address: supportConfig?.email_address ?? null,
      onboarding_completed: Boolean(supportConfig?.onboarding_completed),
      onboarding_step: supportConfig?.onboarding_step ?? null,
    },
    knowledge: {
      source_type: knowledgeSourceType,
      crawl_url: profile?.website ?? null,
      crawl_status: crawlStatus?.status ?? null,
      pages_indexed: kbPageCount,
      pages_crawled: crawlStatus?.pages_crawled ?? null,
      total_pages: crawlStatus?.total_pages ?? null,
    },
  }
}

function inferPageTitle(pathname: string): string {
  if (pathname.startsWith('/org/knowledge')) return 'Knowledge Base'
  if (pathname.startsWith('/support/activate')) return 'Activate Support'
  if (pathname.startsWith('/settings')) return 'Settings'
  if (pathname.startsWith('/dashboard')) return 'Dashboard'
  if (pathname.startsWith('/support')) return 'Support'
  return 'Lira Dashboard'
}

function inferOnboardingStep(
  pathname: string,
  knowledgeTab: string | null
): NonNullable<LiraRuntimeContext['workflow']>['step'] {
  if (pathname.startsWith('/org/knowledge')) return 'seed_knowledge_base'
  if (pathname.startsWith('/support/activate')) return 'activate_support'
  if (knowledgeTab === 'query') return 'test_support'
  if (pathname.startsWith('/settings')) return 'configure_support'
  if (pathname.startsWith('/dashboard')) return 'overview'
  return 'overview'
}

function normaliseKnowledgeSourceType(
  value: string | null
): NonNullable<LiraRuntimeContext['knowledge']>['source_type'] {
  if (value === 'web' || value === 'documents' || value === 'sources' || value === 'query') {
    return value
  }
  return null
}
