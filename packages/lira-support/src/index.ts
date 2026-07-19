import { defaultClient } from './core'
import type {
  LiraActionHandler,
  LiraActionRegistrationOptions,
  LiraConfig,
  LiraContext,
  LiraEventHandler,
  LiraEventName,
  LiraResourceHandler,
  LiraResourceRegistrationOptions,
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
  LiraEventDetail,
  LiraEventHandler,
  LiraEventName,
  LiraRegisteredAction,
  LiraRegisteredResource,
  LiraResourceHandler,
  LiraResourceRegistrationOptions,
  LiraRenderMode,
  LiraRenderLayout,
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

/**
 * Clear the current visitor identity. Wipes their chat off this device and
 * rotates the anonymous scope so the next visitor on this browser starts
 * with a clean history. Wire this on your logout handler.
 *
 * Equivalent to `identify({ email: null, name: null, sig: null })`.
 */
export function logout() {
  return defaultClient.logout()
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
  options?: LiraActionRegistrationOptions
) {
  return defaultClient.registerAction(name, handler, options)
}

export function unregisterAction(name: string) {
  return defaultClient.unregisterAction(name)
}

export function registerResource(
  name: string,
  handler: LiraResourceHandler,
  options?: LiraResourceRegistrationOptions
) {
  return defaultClient.registerResource(name, handler, options)
}

export function unregisterResource(name: string) {
  return defaultClient.unregisterResource(name)
}

/** Programmatically open the chat (e.g. from a "Need help?" button). */
export function open() {
  return defaultClient.open()
}

/** Programmatically close the chat. */
export function close() {
  return defaultClient.close()
}

/** Flip between open and closed. */
export function toggle() {
  return defaultClient.toggle()
}

/**
 * Open the chat with the composer prefilled. Useful for "Contact us
 * about <feature>" links that should land the visitor mid-thought.
 */
export function showNewMessage(preloadText?: string) {
  return defaultClient.showNewMessage(preloadText)
}

/**
 * Subscribe to widget lifecycle events. Returns an unsubscribe function.
 * Available events: 'open', 'close', 'unread_count', 'message'.
 */
export function on(event: LiraEventName, handler: LiraEventHandler) {
  return defaultClient.on(event, handler)
}

export function destroy() {
  return defaultClient.destroy()
}

export const LiraSupport = {
  load: loadLira,
  init,
  identify,
  logout,
  setContext,
  track,
  open,
  close,
  toggle,
  showNewMessage,
  on,
  mountWidget,
  mountSupportPage,
  registerAction,
  unregisterAction,
  registerResource,
  unregisterResource,
  destroy,
}
