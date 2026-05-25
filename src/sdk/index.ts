import type { WidgetConfig } from '../components/support-widget/types'

export type LiraConfig = Partial<WidgetConfig> & {
  orgId: string
}

export type LiraVisitorIdentity = {
  email?: string
  name?: string
  sig?: string
}

export type LiraContext = Record<string, unknown>

export type LiraSupportInstance = {
  destroy: () => void
}

export type LiraBrowserApi = {
  init: (config: Partial<WidgetConfig>) => LiraBrowserApi
  identify: (visitor: LiraVisitorIdentity) => LiraBrowserApi
  setContext: (context: LiraContext) => LiraBrowserApi
  track: (eventName: string, payload?: Record<string, unknown>) => LiraBrowserApi
  mountWidget: (config?: Partial<WidgetConfig>) => LiraSupportInstance
  mountSupportPage: (
    target: string | HTMLElement,
    config?: Partial<WidgetConfig>
  ) => LiraSupportInstance
  destroy: () => void
}

type LiraSdkWindow = Window &
  typeof globalThis & {
    Lira?: LiraBrowserApi
  }

const DEFAULT_WIDGET_SRC = 'https://widget.liraintelligence.com/v1/widget.js'
let loadingScript: Promise<LiraBrowserApi> | null = null

function getWindow(): LiraSdkWindow {
  if (typeof window === 'undefined') {
    throw new Error('[Lira SDK] This SDK must run in a browser.')
  }
  return window as LiraSdkWindow
}

function getApi(): LiraBrowserApi {
  const api = getWindow().Lira
  if (!api) {
    throw new Error('[Lira SDK] Call loadLira() before using the SDK package.')
  }
  return api
}

export function loadLira(src = DEFAULT_WIDGET_SRC): Promise<LiraBrowserApi> {
  const w = getWindow()
  if (w.Lira) return Promise.resolve(w.Lira)
  if (loadingScript) return loadingScript

  loadingScript = new Promise<LiraBrowserApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    const script = existing ?? document.createElement('script')

    script.async = true
    script.src = src
    script.onload = () => {
      if (w.Lira) resolve(w.Lira)
      else reject(new Error('[Lira SDK] Widget script loaded but window.Lira was not created.'))
    }
    script.onerror = () => reject(new Error(`[Lira SDK] Failed to load ${src}.`))

    if (!existing) document.head.appendChild(script)
  })

  return loadingScript
}

export function init(config: LiraConfig): LiraBrowserApi {
  return getApi().init(config)
}

export function identify(visitor: LiraVisitorIdentity): LiraBrowserApi {
  return getApi().identify(visitor)
}

export function setContext(context: LiraContext): LiraBrowserApi {
  return getApi().setContext(context)
}

export function track(eventName: string, payload?: Record<string, unknown>): LiraBrowserApi {
  return getApi().track(eventName, payload)
}

export function mountWidget(config?: Partial<WidgetConfig>): LiraSupportInstance {
  return getApi().mountWidget(config)
}

export function mountSupportPage(
  target: string | HTMLElement,
  config?: Partial<WidgetConfig>
): LiraSupportInstance {
  return getApi().mountSupportPage(target, config)
}

export function destroy(): void {
  getApi().destroy()
}

export const LiraSupport = {
  load: loadLira,
  init,
  identify,
  setContext,
  track,
  mountWidget,
  mountSupportPage,
  destroy,
}
