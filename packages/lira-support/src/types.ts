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
  email?: string
  name?: string
  sig?: string
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
  setContext: (context: LiraContext) => LiraBrowserApi
  track: (eventName: string, payload?: LiraTrackPayload) => LiraBrowserApi
  registerAction?: (name: string, handler: LiraActionHandler) => LiraBrowserApi
  unregisterAction?: (name: string) => LiraBrowserApi
  mountWidget: (config?: Partial<LiraConfig>) => LiraSupportInstance
  mountSupportPage: (
    target: string | HTMLElement,
    config?: Partial<LiraConfig>
  ) => LiraSupportInstance
  destroy: () => void
}

export type LiraClientOptions = {
  scriptSrc?: string
  autoLoad?: boolean
}

declare global {
  interface Window {
    Lira?: LiraBrowserApi
  }
}
