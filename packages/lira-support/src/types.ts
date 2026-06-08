export type LiraRenderMode = 'bubble' | 'fullscreen'

export type LiraPosition = 'bottom-right' | 'bottom-left'

export type LiraConfig = {
  orgId: string
  mode?: LiraRenderMode
  target?: string | HTMLElement
  position?: LiraPosition
  primaryColor?: string
  greeting?: string
  orgName?: string
  logoUrl?: string
  voiceEnabled?: boolean
  preChatFormEnabled?: boolean
  preChatFormFields?: string[]
  visitorEmail?: string
  visitorName?: string
  visitorSig?: string
  autoOpenFirstVisit?: boolean
  context?: LiraContext
}

export type LiraVisitorIdentity = {
  /** Visitor email. Pass `null` to clear (treated as logout for this field); omit to preserve. */
  email?: string | null
  /** Visitor display name. Pass `null` to clear; omit to preserve. */
  name?: string | null
  /** HMAC-SHA256 of email computed server-side with the widget secret. Pass `null` to clear; omit to preserve. */
  sig?: string | null
  externalId?: string
  accountId?: string
}

export type LiraContext = Record<string, unknown>

export type LiraTrackPayload = Record<string, unknown>

export type LiraAuthScope = 'public' | 'verified_visitor' | 'verified_customer'

export type LiraRiskTier =
  | 'read_public'
  | 'read_private'
  | 'safe_write'
  | 'customer_confirm'
  | 'step_up'
  | 'admin_approve'
  | 'human_only'

export type LiraJsonSchema = {
  type: 'object'
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}

export type LiraSupportInstance = {
  destroy: () => void
}

export type LiraActionRequest<TPayload = Record<string, unknown>> = {
  actionType: string
  target?: string
  value?: unknown
  payload: TPayload
  rawEvent: CustomEvent
}

export type LiraActionResult = {
  ok: boolean
  message?: string
  data?: Record<string, unknown>
}

export type LiraActionHandler<TPayload = Record<string, unknown>> = (
  request: LiraActionRequest<TPayload>
) => Promise<LiraActionResult | void> | LiraActionResult | void

export type LiraActionRegistrationOptions = {
  description?: string
  authScope?: LiraAuthScope
  risk?: LiraRiskTier
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
}

export type LiraRegisteredAction = {
  name: string
  description?: string
  authScope?: LiraAuthScope
  risk?: LiraRiskTier
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
  handler: LiraActionHandler
}

export type LiraResourceRequest<TInput = Record<string, unknown>> = {
  resourceName: string
  input: TInput
  payload: TInput
  rawEvent: CustomEvent
}

export type LiraResourceResult = {
  ok: boolean
  data?: Record<string, unknown>
  message?: string
}

export type LiraResourceHandler<TInput = Record<string, unknown>> = (
  request: LiraResourceRequest<TInput>
) =>
  | Promise<LiraResourceResult | Record<string, unknown> | void>
  | LiraResourceResult
  | Record<string, unknown>
  | void

export type LiraResourceRegistrationOptions = {
  description?: string
  authScope?: LiraAuthScope
  risk?: Extract<LiraRiskTier, 'read_public' | 'read_private'>
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
}

export type LiraRegisteredResource = {
  name: string
  description?: string
  authScope?: LiraAuthScope
  risk?: Extract<LiraRiskTier, 'read_public' | 'read_private'>
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
  handler: LiraResourceHandler
}

export type LiraBrowserApi = {
  init: (config: Partial<LiraConfig>) => LiraBrowserApi
  identify: (visitor: LiraVisitorIdentity) => LiraBrowserApi
  /**
   * Clears any logged-in identity on this device. Wipes the user's chat
   * history off this browser, rotates the anonymous chat scope, and lets
   * Lira reconnect as anonymous for the next visitor. Wire this on your
   * logout handler.
   *
   * Optional on the browser API for back-compat with older runtimes; the
   * SDK `logout()` helper falls back to `identify({ email: null, … })`
   * when the underlying widget doesn't yet expose `logout` natively.
   */
  logout?: () => LiraBrowserApi
  setContext: (context: LiraContext) => LiraBrowserApi
  track: (eventName: string, payload?: LiraTrackPayload) => LiraBrowserApi
  registerAction?: (
    name: string,
    handler: LiraActionHandler,
    options?: LiraActionRegistrationOptions
  ) => LiraBrowserApi
  unregisterAction?: (name: string) => LiraBrowserApi
  registerResource?: (
    name: string,
    handler: LiraResourceHandler,
    options?: LiraResourceRegistrationOptions
  ) => LiraBrowserApi
  unregisterResource?: (name: string) => LiraBrowserApi
  /**
   * Programmatically open the chat panel from the host's UI. Optional on the
   * browser API for back-compat with older runtimes; the SDK helper no-ops
   * when unavailable.
   */
  open?: () => LiraBrowserApi
  close?: () => LiraBrowserApi
  toggle?: () => LiraBrowserApi
  showNewMessage?: (preloadText?: string) => LiraBrowserApi
  mountWidget: (config?: Partial<LiraConfig>) => LiraSupportInstance
  mountSupportPage: (
    target: string | HTMLElement,
    config?: Partial<LiraConfig>
  ) => LiraSupportInstance
  destroy: () => void
}

/**
 * Lifecycle events the widget dispatches as `window.addEventListener('lira:<event>', …)`
 * CustomEvents. The SDK's `on(event, handler)` helper wraps this so consumers don't
 * have to touch `window` directly.
 */
export type LiraEventName = 'open' | 'close' | 'unread_count' | 'message'

export type LiraEventDetail = {
  /** Org id the event came from. Useful for multi-widget hosts. */
  orgId?: string
  /** Unread count, present on the `unread_count` event. */
  count?: number
  /** Free-form payload — the widget may add fields per event without breaking consumers. */
  [key: string]: unknown
}

export type LiraEventHandler = (detail: LiraEventDetail) => void

export type LiraClientOptions = {
  scriptSrc?: string
  autoLoad?: boolean
}

declare global {
  interface Window {
    Lira?: LiraBrowserApi
  }
}
