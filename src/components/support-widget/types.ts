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
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  greeting?: string
  orgName?: string
  logoUrl?: string
  voiceEnabled?: boolean
  preChatFormEnabled?: boolean
  preChatFormFields?: string[]
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
}

export type WidgetView = 'launcher' | 'pre-chat' | 'chat' | 'csat'
