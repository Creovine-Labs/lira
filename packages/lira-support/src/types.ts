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

export type LiraRegisteredAction = {
  name: string
  description?: string
  handler: LiraActionHandler
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
  registerAction?: (name: string, handler: LiraActionHandler) => LiraBrowserApi
  unregisterAction?: (name: string) => LiraBrowserApi
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
