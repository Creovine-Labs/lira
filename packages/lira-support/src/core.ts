import type {
  LiraActionHandler,
  LiraActionRegistrationOptions,
  LiraActionRequest,
  LiraActionResult,
  LiraBrowserApi,
  LiraClientOptions,
  LiraConfig,
  LiraContext,
  LiraEventDetail,
  LiraEventHandler,
  LiraEventName,
  LiraRegisteredAction,
  LiraRegisteredResource,
  LiraResourceHandler,
  LiraResourceRegistrationOptions,
  LiraResourceRequest,
  LiraResourceResult,
  LiraSupportInstance,
  LiraTrackPayload,
  LiraVisitorIdentity,
} from './types'

const DEFAULT_WIDGET_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const ACTION_EVENT = 'lira:action'
const ACTION_RESULT_EVENT = 'lira:action_result'
const RESOURCE_EVENT = 'lira:resource'
const RESOURCE_RESULT_EVENT = 'lira:resource_result'

type LiraSdkWindow = Window &
  typeof globalThis & {
    Lira?: LiraBrowserApi
  }

let sharedScriptLoad: Promise<LiraBrowserApi> | null = null
let warnedLegacyActionRegistration = false

function getWindow(): LiraSdkWindow {
  if (typeof window === 'undefined') {
    throw new Error('[Lira SDK] This SDK must run in a browser.')
  }
  return window as LiraSdkWindow
}

function normalizeActionDetail(event: Event): LiraActionRequest | null {
  if (!(event instanceof CustomEvent)) return null
  const detail = (event.detail ?? {}) as {
    action_type?: string
    actionType?: string
    target?: string
    value?: unknown
    payload?: Record<string, unknown>
  }
  const actionType = detail.actionType ?? detail.action_type
  if (!actionType) return null

  return {
    actionType,
    target: detail.target,
    value: detail.value,
    payload: detail.payload ?? {},
    rawEvent: event,
  }
}

function normalizeResourceDetail(event: Event): LiraResourceRequest | null {
  if (!(event instanceof CustomEvent)) return null
  const detail = (event.detail ?? {}) as {
    resource_name?: string
    resourceName?: string
    input?: Record<string, unknown>
    payload?: Record<string, unknown>
  }
  const resourceName = detail.resourceName ?? detail.resource_name
  if (!resourceName) return null
  const input = detail.input ?? detail.payload ?? {}

  return {
    resourceName,
    input,
    payload: input,
    rawEvent: event,
  }
}

export class LiraClient {
  private scriptSrc: string
  private api: LiraBrowserApi | null = null
  private config: Partial<LiraConfig> = {}
  private actions = new Map<string, LiraRegisteredAction>()
  private resources = new Map<string, LiraRegisteredResource>()
  private actionListener: ((event: Event) => void) | null = null
  private resourceListener: ((event: Event) => void) | null = null

  constructor(options: LiraClientOptions = {}) {
    this.scriptSrc = options.scriptSrc ?? DEFAULT_WIDGET_SRC
    if (options.autoLoad) void this.load()
  }

  async load(): Promise<LiraBrowserApi> {
    if (this.api) return this.api

    const w = getWindow()
    if (w.Lira) {
      this.api = w.Lira
      this.replayActions()
      this.replayResources()
      return w.Lira
    }

    if (!sharedScriptLoad) {
      sharedScriptLoad = new Promise<LiraBrowserApi>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${this.scriptSrc}"]`
        )
        const script = existing ?? document.createElement('script')

        script.async = true
        script.src = this.scriptSrc
        script.onload = () => {
          if (w.Lira) resolve(w.Lira)
          else reject(new Error('[Lira SDK] Widget script loaded but window.Lira was not created.'))
        }
        script.onerror = () => reject(new Error(`[Lira SDK] Failed to load ${this.scriptSrc}.`))

        if (!existing) document.head.appendChild(script)
      })
    }

    this.api = await sharedScriptLoad
    this.replayActions()
    this.replayResources()
    return this.api
  }

  async init(config: LiraConfig): Promise<this> {
    this.config = { ...this.config, ...config }
    const api = await this.load()
    api.init(this.config)
    if (config.context) api.setContext(config.context)
    return this
  }

  async identify(visitor: LiraVisitorIdentity): Promise<this> {
    const api = await this.load()
    api.identify(visitor)
    return this
  }

  /**
   * Clears the current visitor identity. Prefers `api.logout()` when the
   * underlying widget runtime exposes it (newer bundles); falls back to
   * `identify({ email: null, name: null, sig: null })` so we still work
   * against older widget.js builds that haven't shipped logout yet.
   */
  async logout(): Promise<this> {
    const api = await this.load()
    if (typeof api.logout === 'function') {
      api.logout()
    } else {
      api.identify({ email: null, name: null, sig: null })
    }
    return this
  }

  async setContext(context: LiraContext): Promise<this> {
    const api = await this.load()
    api.setContext(context)
    return this
  }

  async track(eventName: string, payload?: LiraTrackPayload): Promise<this> {
    const api = await this.load()
    api.track(eventName, payload)
    return this
  }

  /**
   * Programmatically open the chat. Safe to call before the widget has
   * mounted — it queues the load + open.
   */
  async open(): Promise<this> {
    const api = await this.load()
    api.open?.()
    return this
  }

  /** Programmatically close the chat. */
  async close(): Promise<this> {
    const api = await this.load()
    api.close?.()
    return this
  }

  /** Flip between open and closed. */
  async toggle(): Promise<this> {
    const api = await this.load()
    api.toggle?.()
    return this
  }

  /**
   * Open the chat with the composer prefilled. Useful for "Contact us
   * about <feature>" links.
   */
  async showNewMessage(preloadText?: string): Promise<this> {
    const api = await this.load()
    api.showNewMessage?.(preloadText)
    return this
  }

  /**
   * Subscribe to widget lifecycle events. Returns an unsubscribe function.
   * Events available today: 'open', 'close', 'unread_count', 'message'.
   *
   * Underneath this is just `window.addEventListener('lira:<event>', …)`,
   * but the SDK helper handles event-name prefixing + detail unwrapping
   * so your handler is called with a typed `LiraEventDetail` directly.
   */
  on(event: LiraEventName, handler: LiraEventHandler): () => void {
    if (typeof window === 'undefined') return () => {}
    const wrapped = (e: Event) => {
      const detail = (e as CustomEvent<LiraEventDetail>).detail ?? {}
      handler(detail)
    }
    const key = `lira:${event}`
    window.addEventListener(key, wrapped)
    return () => window.removeEventListener(key, wrapped)
  }

  /**
   * Remove every listener registered through this client. Called automatically
   * by `destroy()`; expose for advanced cleanup.
   */
  off(): void {
    // Listeners are anonymous closures returned from `on(...)`; this method
    // is preserved for symmetry. Use the unsubscribe fn from `on(...)` for
    // per-listener teardown.
  }

  async mountWidget(config?: Partial<LiraConfig>): Promise<LiraSupportInstance> {
    this.config = { ...this.config, ...config, mode: 'bubble' }
    const api = await this.load()
    return api.mountWidget(this.config)
  }

  async mountSupportPage(
    target: string | HTMLElement,
    config?: Partial<LiraConfig>
  ): Promise<LiraSupportInstance> {
    this.config = { ...this.config, ...config, mode: 'fullscreen', target }
    const api = await this.load()
    return api.mountSupportPage(target, this.config)
  }

  registerAction(
    name: string,
    handler: LiraActionHandler,
    options: LiraActionRegistrationOptions = {}
  ): () => void {
    if (!hasActionMetadata(options)) warnLegacyActionRegistration()
    this.actions.set(name, {
      name,
      description: options.description,
      authScope: options.authScope,
      risk: options.risk,
      inputSchema: options.inputSchema,
      outputSchema: options.outputSchema,
      handler,
    })
    this.ensureActionListener()
    void this.load().then((api) =>
      api.registerAction?.(name, handler, normaliseActionOptions(options))
    )
    return () => this.unregisterAction(name)
  }

  unregisterAction(name: string): void {
    this.actions.delete(name)
    this.api?.unregisterAction?.(name)
  }

  listActions(): LiraRegisteredAction[] {
    return [...this.actions.values()]
  }

  registerResource(
    name: string,
    handler: LiraResourceHandler,
    options: LiraResourceRegistrationOptions = {}
  ): () => void {
    this.resources.set(name, {
      name,
      description: options.description,
      authScope: options.authScope ?? 'verified_visitor',
      risk: options.risk ?? 'read_private',
      inputSchema: options.inputSchema,
      outputSchema: options.outputSchema,
      handler,
    })
    this.ensureResourceListener()
    void this.load().then((api) => api.registerResource?.(name, handler, options))
    return () => this.unregisterResource(name)
  }

  unregisterResource(name: string): void {
    this.resources.delete(name)
    this.api?.unregisterResource?.(name)
  }

  listResources(): LiraRegisteredResource[] {
    return [...this.resources.values()]
  }

  destroy(): void {
    this.api?.destroy()
    if (this.actionListener) {
      window.removeEventListener(ACTION_EVENT, this.actionListener)
      this.actionListener = null
    }
    if (this.resourceListener) {
      window.removeEventListener(RESOURCE_EVENT, this.resourceListener)
      this.resourceListener = null
    }
  }

  private ensureActionListener(): void {
    if (this.actionListener || typeof window === 'undefined') return
    this.actionListener = (event) => {
      const request = normalizeActionDetail(event)
      if (!request) return
      const action = this.actions.get(request.actionType) ?? this.actions.get(request.target ?? '')
      if (!action) return
      void this.runAction(action, request)
    }
    window.addEventListener(ACTION_EVENT, this.actionListener)
  }

  private ensureResourceListener(): void {
    if (this.resourceListener || typeof window === 'undefined') return
    this.resourceListener = (event) => {
      const request = normalizeResourceDetail(event)
      if (!request) return
      const resource = this.resources.get(request.resourceName)
      if (!resource) return
      void this.runResource(resource, request)
    }
    window.addEventListener(RESOURCE_EVENT, this.resourceListener)
  }

  private async runAction(action: LiraRegisteredAction, request: LiraActionRequest): Promise<void> {
    try {
      const result = (await action.handler(request)) ?? { ok: true }
      this.emitActionResult(action.name, request, result)
    } catch (error) {
      this.emitActionResult(action.name, request, {
        ok: false,
        message: error instanceof Error ? error.message : 'Action failed',
      })
    }
  }

  private async runResource(
    resource: LiraRegisteredResource,
    request: LiraResourceRequest
  ): Promise<void> {
    try {
      const raw = await resource.handler(request)
      const result = normaliseResourceResult(raw)
      this.emitResourceResult(resource.name, request, result)
    } catch (error) {
      this.emitResourceResult(resource.name, request, {
        ok: false,
        message: error instanceof Error ? error.message : 'Resource lookup failed',
      })
    }
  }

  private emitActionResult(
    actionName: string,
    request: LiraActionRequest,
    result: LiraActionResult
  ): void {
    window.dispatchEvent(
      new CustomEvent(ACTION_RESULT_EVENT, {
        detail: {
          actionName,
          actionType: request.actionType,
          target: request.target,
          ok: result.ok,
          message: result.message,
          data: result.data ?? {},
        },
      })
    )
    this.api?.track('lira_action_result', {
      actionName,
      actionType: request.actionType,
      target: request.target,
      ok: result.ok,
      message: result.message,
      data: result.data ?? {},
    })
  }

  private emitResourceResult(
    resourceName: string,
    request: LiraResourceRequest,
    result: LiraResourceResult
  ): void {
    window.dispatchEvent(
      new CustomEvent(RESOURCE_RESULT_EVENT, {
        detail: {
          resourceName,
          ok: result.ok,
          message: result.message,
          data: result.data ?? {},
        },
      })
    )
    this.api?.track('lira_resource_result', {
      resourceName,
      ok: result.ok,
      message: result.message,
      data: result.data ?? {},
    })
  }

  private replayActions(): void {
    if (!this.api?.registerAction) return
    for (const action of this.actions.values()) {
      this.api.registerAction(action.name, action.handler, normaliseActionOptions(action))
    }
  }

  private replayResources(): void {
    if (!this.api?.registerResource) return
    for (const resource of this.resources.values()) {
      this.api.registerResource(resource.name, resource.handler, {
        description: resource.description,
        authScope: resource.authScope,
        risk: resource.risk,
        inputSchema: resource.inputSchema,
        outputSchema: resource.outputSchema,
      })
    }
  }
}

function normaliseActionOptions(
  options: LiraActionRegistrationOptions
): LiraActionRegistrationOptions {
  return {
    ...options,
    authScope: options.authScope ?? 'verified_visitor',
    risk: options.risk ?? 'safe_write',
  }
}

function hasActionMetadata(options: LiraActionRegistrationOptions): boolean {
  return Boolean(options.authScope || options.risk || options.inputSchema || options.outputSchema)
}

function warnLegacyActionRegistration(): void {
  if (warnedLegacyActionRegistration || typeof console === 'undefined') return
  warnedLegacyActionRegistration = true
  console.warn(
    '[Lira SDK] registerAction(name, handler) still works, but future agentic runtime features need metadata. Pass { authScope, risk, inputSchema } when you can.'
  )
}

function normaliseResourceResult(
  raw: LiraResourceResult | Record<string, unknown> | void
): LiraResourceResult {
  if (!raw) return { ok: true, data: {} }
  if ('ok' in raw && typeof raw.ok === 'boolean') return raw as LiraResourceResult
  return { ok: true, data: raw as Record<string, unknown> }
}

export function createClient(options?: LiraClientOptions): LiraClient {
  return new LiraClient(options)
}

export const defaultClient = createClient()
