import { defaultClient } from './core'
import type {
  LiraActionHandler,
  LiraConfig,
  LiraContext,
  LiraSupportInstance,
  LiraTrackPayload,
  LiraVisitorIdentity,
} from './types'

export { LiraClient, createClient, defaultClient } from './core'
export type {
  LiraActionHandler,
  LiraActionRequest,
  LiraActionResult,
  LiraBrowserApi,
  LiraClientOptions,
  LiraConfig,
  LiraContext,
  LiraRegisteredAction,
  LiraRenderMode,
  LiraSupportInstance,
  LiraTrackPayload,
  LiraVisitorIdentity,
} from './types'

export function loadLira() {
  return defaultClient.load()
}

export function init(config: LiraConfig) {
  return defaultClient.init(config)
}

export function identify(visitor: LiraVisitorIdentity) {
  return defaultClient.identify(visitor)
}

export function setContext(context: LiraContext) {
  return defaultClient.setContext(context)
}

export function track(eventName: string, payload?: LiraTrackPayload) {
  return defaultClient.track(eventName, payload)
}

export function mountWidget(config?: Partial<LiraConfig>): Promise<LiraSupportInstance> {
  return defaultClient.mountWidget(config)
}

export function mountSupportPage(
  target: string | HTMLElement,
  config?: Partial<LiraConfig>
): Promise<LiraSupportInstance> {
  return defaultClient.mountSupportPage(target, config)
}

export function registerAction(
  name: string,
  handler: LiraActionHandler,
  options?: { description?: string }
) {
  return defaultClient.registerAction(name, handler, options)
}

export function unregisterAction(name: string) {
  return defaultClient.unregisterAction(name)
}

export function destroy() {
  return defaultClient.destroy()
}

export const LiraSupport = {
  load: loadLira,
  init,
  identify,
  setContext,
  track,
  mountWidget,
  mountSupportPage,
  registerAction,
  unregisterAction,
  destroy,
}
