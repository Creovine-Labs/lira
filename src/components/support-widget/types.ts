/**
 * Lira Support Widget — Shared types
 */

export interface WidgetConfig {
  orgId: string
  /**
   * SDK render surface. `bubble` keeps the existing floating launcher.
   * `fullscreen` mounts the support UI directly into a customer-owned
   * container, e.g. their `/support` route.
   */
  mode?: 'bubble' | 'fullscreen'
  /** CSS selector or HTMLElement target used by fullscreen SDK embeds. */
  target?: string | HTMLElement
  /**
   * Fullscreen layout. `messenger` (default) renders the Home/Chat
   * conversational surface — the widget without a bubble. `support_center`
   * renders an answer-first, button-driven help page: describe-issue input
   * at the top, inline AI answer + suggestion buttons + KB source cards
   * below, with free-text chat opt-in and ticket escalation as the fallback.
   * Only applies when `mode === 'fullscreen'`.
   */
  layout?: 'messenger' | 'support_center'
  /**
   * Org lifecycle environment (from the server config). When 'sandbox', the
   * widget shows a SANDBOX badge so testers know nothing is going live.
   */
  environment?: 'sandbox' | 'production'
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  greeting?: string
  orgName?: string
  logoUrl?: string
  /** Visual template for the widget home tab. */
  homeTemplate?: 'default' | 'minimal' | 'branded'
  /** Banner image rendered above the home content when homeTemplate === 'branded'. */
  homeBannerUrl?: string
  homeLogoUrl?: string
  homeTitle?: string
  homeSubtitle?: string
  homeCards?: WidgetHomeCard[]
  voiceEnabled?: boolean
  preChatFormEnabled?: boolean
  preChatFormFields?: string[]
  /**
   * Plan entitlement (from the server config). When true, the org is on a
   * paid tier with the branding-removal entitlement and the widget hides its
   * "Powered by" footer.
   */
  brandingRemoval?: boolean
  /** HMAC signature for identified visitors */
  visitorEmail?: string
  visitorName?: string
  visitorSig?: string
  /**
   * Opt-in ephemeral storage mode — used ONLY by our public Nimbus demo, set
   * via `data-ephemeral="true"` on the script tag. When true:
   *   - visitor id lives in sessionStorage (not localStorage) → new tab = new visitor
   *   - chat history lives in sessionStorage, scoped to visitor id
   *   - closing the tab clears everything; the next tester gets a fresh start
   *
   * Production customer embeds never set this. Their visitors retain history
   * across sessions via localStorage exactly as today.
   */
  ephemeral?: boolean
  /**
   * Demo-only: snapshot of the visitor's local dashboard state (plan, card,
   * invoices, etc.). Sent to the server over WS at connect time so the AI
   * agent can answer account-aware questions. Never persisted server-side.
   */
  demoContext?: Record<string, unknown>
  /**
   * Opt-in: when true, the widget auto-opens on the first page-load for a
   * given orgId, and STAYS open across page reloads until the visitor
   * clicks the close button. After the first close, it never auto-opens
   * again for that orgId on that browser. Persisted in localStorage under
   * `lira_widget_dismissed_<orgId>`.
   *
   * Used by the Lira admin dashboard so new customers see the onboarding
   * widget pop without having to discover the launcher. Production
   * customer embeds typically leave this off — too aggressive for general
   * web visitors who didn't ask for chat.
   */
  autoOpenFirstVisit?: boolean
}

export interface WidgetHomeCard {
  /** Stable card identity. Survives prompt/title renames so re-clicking a
   *  card after an admin edits its copy still reopens the same conversation. */
  id?: string
  title: string
  body?: string
  prompt: string
  icon?: string
}

export interface ChatMessage {
  id: string
  role: 'customer' | 'lira' | 'agent' | 'system'
  body: string
  timestamp: string
  sender_name?: string // agent's first name
  sender_avatar?: string // agent's profile picture URL
  /** Optional generative-UI card rendered alongside the body. */
  card?: AgentCard
  /** Optional inline confirm prompt (HITL). */
  confirm?: AgentConfirm
  /** Optional action result chip (success/fail of a tool call). */
  actionResult?: { tool_name: string; ok: boolean; label: string }
  /**
   * Optional inline action card. Renders as its own bubble showing
   * "Updating plan..." → "✓ Plan updated" with a live status indicator.
   * Server emits `action_started` (status=pending), then `action_completed`
   * or `action_failed`, all keyed by `action_id` so the same bubble
   * updates in place.
   */
  action?: ActionCard
}

export interface ActionCard {
  action_id: string
  tool_name: string
  label: string
  icon?: string
  status: 'pending' | 'success' | 'failed'
  /** Filled when status=success — short summary line under the title. */
  detail?: string
  /** Filled when status=failed — error message line. */
  error?: string
}

export interface AgentCard {
  title?: string
  body?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
  /** Card flavour — 'stepper' triggers the vertical stepper renderer. */
  kind?: 'standard' | 'stepper'
  /** Stepper steps. Renders status dots, descriptions, sub-progress, and docs links. */
  steps?: Array<{
    key: string
    title: string
    description?: string
    status: 'done' | 'active' | 'pending'
    sub_progress?: Array<{ label: string; done: boolean }>
    docs?: string
    optional?: boolean
    /** Host-dashboard route this step opens when clicked (via lira-host-navigate). */
    route?: string
    /** Rendered disabled until support is activated; clicking shows a brief notice. */
    locked?: boolean
  }>
  /** Overall stepper progress, e.g. { done: 2, total: 5 }. */
  progress?: { done: number; total: number }
}

export interface AgentConfirm {
  pending_id: string
  tool_name: string
  title: string
  body: string
  /** Set once the customer clicks Approve or Cancel. */
  resolved?: 'approved' | 'declined'
}

export interface IncomingWsMessage {
  type:
    | 'reply'
    | 'reply_start'
    | 'reply_chunk'
    | 'reply_end'
    | 'status'
    | 'error'
    | 'escalated'
    | 'welcome'
    | 'typing'
    | 'agent_reply'
    | 'handback'
    | 'proactive'
    | 'history'
    | 'card'
    | 'confirm'
    | 'action_result'
    | 'navigate'
    | 'demo_action_executed'
    | 'action_started'
    | 'action_completed'
    | 'action_failed'
    | 'pin_required'
    | 'suggestions'
    | 'lira_action'
    | 'lira_resource'
    | 'host_capability_request'
    | 'integration_warning'
  body?: string
  conv_id?: string
  status?: string
  sender_name?: string
  sender_avatar?: string
  /** Groups reply_start / reply_chunk / reply_end events into a single message */
  message_id?: string
  // ── card / confirm / action_result / navigate fields ──────────────────
  title?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  /** Card flavour — 'stepper' renders steps[] as a polished vertical stepper. */
  kind?: 'standard' | 'stepper'
  /** Stepper steps with status + sub-progress. */
  steps?: Array<{
    key: string
    title: string
    description?: string
    status: 'done' | 'active' | 'pending'
    sub_progress?: Array<{ label: string; done: boolean }>
    docs?: string
    optional?: boolean
    /** Host-dashboard route this step opens when clicked (via lira-host-navigate). */
    route?: string
    /** Rendered disabled until support is activated; clicking shows a brief notice. */
    locked?: boolean
  }>
  /** Overall stepper progress, e.g. { done: 2, total: 5 }. */
  progress?: { done: number; total: number }
  messages?: Array<{
    id: string
    role: ChatMessage['role']
    body: string
    timestamp: string
    sender_name?: string
    sender_avatar?: string
  }>
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
  pending_id?: string
  tool_name?: string
  ok?: boolean
  label?: string
  url?: string
  /** For 'navigate' messages: window target ('_self' | '_blank').
   *  For 'lira_action' messages: free-form data-lira-action key. */
  target?: string
  // ── demo_action_executed + lira_action fields ─────────────────────────
  /** action_type for demo_action_executed ('upgrade_plan', etc.) OR
   *  for lira_action ('prefill_input', 'click'). */
  action_type?: string
  payload?: Record<string, unknown>
  // ── action lifecycle + PIN gate fields ───────────────────────────────
  action_id?: string
  icon?: string
  summary?: string
  data?: Record<string, unknown>
  error?: string
  hint?: string
  /** For type: 'suggestions' — clickable chips below the latest reply. */
  suggestions?: string[]
  /** For type: 'lira_action' — string value (e.g. URL to prefill into an input). */
  value?: string
  // ── integration_warning fields ───────────────────────────────────────
  /** Stable code, e.g. 'IDENTITY_SIGNATURE_MISMATCH'. */
  code?: string
  /** 'error' | 'warning' | 'info'. */
  severity?: 'error' | 'warning' | 'info'
  /** Human-readable description of the integration problem. */
  message?: string
  /** URL pointing the integrator's dev at the relevant troubleshooting doc. */
  docs?: string
  /** Echo-back fields useful for debugging (e.g. { email }). Never the secret/sig. */
  context?: Record<string, unknown>
}

export interface OutgoingWsMessage {
  type:
    | 'message'
    | 'typing'
    | 'end'
    | 'confirm_response'
    | 'demo_context'
    | 'context_update'
    | 'pin_response'
    | 'pin_cancel'
    | 'customer_action_result'
    | 'customer_resource_result'
    | 'sdk_capabilities_register'
    | 'host_capability_result'
  body?: string
  name?: string
  email?: string
  pending_id?: string
  approved?: boolean
  /** demo_context payload — visitor's local dashboard snapshot (demo only). */
  profile?: Record<string, unknown>
  /** Live product context from an embedding host. */
  context?: Record<string, unknown>
  /** PIN modal response — keys the dispatcher's awaitPin by action_id. */
  action_id?: string
  pin?: string
  /** customer_action_result — outcome of an SDK-registered host action. */
  actionName?: string
  actionType?: string
  target?: string
  ok?: boolean
  message?: string
  data?: Record<string, unknown>
  /** customer_resource_result — outcome of an SDK-registered host resource read. */
  resourceName?: string
  /**
   * sdk_capabilities_register — host-registered resources / actions sent
   * to the backend so the agent can see them as Tools for this session.
   */
  resources?: Array<Record<string, unknown>>
  actions?: Array<Record<string, unknown>>
  /**
   * host_capability_result — reply to a backend-initiated
   * host_capability_request. Correlates via `request_id`.
   */
  request_id?: string
}

export type WidgetView =
  | 'launcher'
  | 'home'
  | 'pre-chat'
  | 'chat-list'
  | 'chat'
  | 'csat'
  | 'support-center'

/** One AI turn on the answer-first support page (mirrors the backend contract). */
export interface SupportCenterTurn {
  convId: string
  reply: string
  interpretations: string[]
  suggestions: string[]
  sources: Array<{ id: string; title: string; category?: string; url?: string }>
  status: 'answered' | 'need_more' | 'cannot_answer'
  offerTicket: boolean
  verified?: boolean
  /** Client-only: the visitor's question that produced this turn (for rendering). */
  _question?: string
  /** Client-only: true while the answer is still loading. */
  _pending?: boolean
}
