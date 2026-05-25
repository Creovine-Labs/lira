import type {
  LiraActionHandler,
  LiraActionRequest,
  LiraActionResult,
  LiraBrowserApi,
  LiraClientOptions,
  LiraConfig,
  LiraContext,
  LiraRegisteredAction,
  LiraSupportInstance,
  LiraTrackPayload,
  LiraVisitorIdentity,
} from './types'

const DEFAULT_WIDGET_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
const ACTION_EVENT = 'lira:action'
const ACTION_RESULT_EVENT = 'lira:action_result'

type LiraSdkWindow = Window &
  typeof globalThis & {
    Lira?: LiraBrowserApi
  }

let sharedScriptLoad: Promise<LiraBrowserApi> | null = null

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

export class LiraClient {
  private scriptSrc: string
  private api: LiraBrowserApi | null = null
  private config: Partial<LiraConfig> = {}
  private actions = new Map<string, LiraRegisteredAction>()
  private actionListener: ((event: Event) => void) | null = null

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
    options: { description?: string } = {}
  ): () => void {
    this.actions.set(name, { name, description: options.description, handler })
    this.ensureActionListener()
    void this.load().then((api) => api.registerAction?.(name, handler))
    return () => this.unregisterAction(name)
  }

  unregisterAction(name: string): void {
    this.actions.delete(name)
    this.api?.unregisterAction?.(name)
  }

  listActions(): LiraRegisteredAction[] {
    return [...this.actions.values()]
  }

  destroy(): void {
    this.api?.destroy()
    if (this.actionListener) {
      window.removeEventListener(ACTION_EVENT, this.actionListener)
      this.actionListener = null
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

  private replayActions(): void {
    if (!this.api?.registerAction) return
    for (const action of this.actions.values()) {
      this.api.registerAction(action.name, action.handler)
    }
  }
}

export function createClient(options?: LiraClientOptions): LiraClient {
  return new LiraClient(options)
}

export const defaultClient = createClient()
