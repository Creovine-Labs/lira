/**
 * Lira Support Widget — WebSocket connection manager
 *
 * Handles:
 * - Connection to WSS /lira/v1/support/chat/ws/:orgId
 * - Auto-reconnect with exponential backoff
 * - Message serialization/deserialization
 */

import type { IncomingWsMessage, OutgoingWsMessage, WidgetConfig } from './types'

type MessageHandler = (msg: IncomingWsMessage) => void
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected') => void

const WS_BASE = 'wss://api.creovine.com/lira/v1/support/chat'
const MAX_RECONNECT_DELAY = 30_000
const MAX_PENDING_MESSAGES = 20

export class WidgetSocket {
  private ws: WebSocket | null = null
  private config: WidgetConfig
  private onMessage: MessageHandler
  private onStatus: StatusHandler
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false
  private visitorId: string
  private forceNewCase: boolean
  private convId?: string | null
  private homeCardId?: string | null
  private pendingMessages: OutgoingWsMessage[] = []

  constructor(
    config: WidgetConfig,
    visitorId: string,
    forceNewCase: boolean,
    convId: string | null | undefined,
    onMessage: MessageHandler,
    onStatus: StatusHandler,
    homeCardId?: string | null
  ) {
    this.config = config
    this.visitorId = visitorId
    this.forceNewCase = forceNewCase
    this.convId = convId
    this.homeCardId = homeCardId
    this.onMessage = onMessage
    this.onStatus = onStatus
  }

  connect(): void {
    if (this.closed) return
    this.onStatus('connecting')

    const params = new URLSearchParams({ visitorId: this.visitorId })
    if (this.config.visitorEmail) params.set('email', this.config.visitorEmail)
    if (this.config.visitorName) params.set('name', this.config.visitorName)
    if (this.config.visitorSig) params.set('sig', this.config.visitorSig)
    if (this.convId && !this.forceNewCase) params.set('convId', this.convId)
    if (this.forceNewCase) {
      params.set('newCase', '1')
      this.forceNewCase = false
    }
    // One-shot: a home-card id is only meaningful when creating a new
    // conversation. We clear after sending so reconnects to the same
    // conversation don't re-stamp the card id on every reattach.
    if (this.homeCardId) {
      params.set('homeCardId', this.homeCardId)
      this.homeCardId = null
    }

    const url = `${WS_BASE}/ws/${this.config.orgId}?${params.toString()}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.onStatus('connected')
      // Demo embeds push a snapshot of the visitor's local dashboard state so
      // the AI agent can answer account-aware questions without persisting
      // per-visitor data server-side. No-op for production embeds.
      if (this.config.demoContext) {
        this.send({ type: 'demo_context', profile: this.config.demoContext })
      }
      this.flushPendingMessages()
    }

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as IncomingWsMessage
        this.onMessage(msg)
      } catch {
        // Ignore malformed messages
      }
    }

    this.ws.onclose = () => {
      this.onStatus('disconnected')
      if (!this.closed) this.scheduleReconnect()
    }

    this.ws.onerror = () => {
      // onclose will fire after onerror
    }
  }

  send(msg: OutgoingWsMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
      return
    }

    // User-visible actions should not disappear if the visitor sends while
    // the socket is still connecting or briefly reconnecting. Typing pings are
    // intentionally dropped because they are transient and can be noisy.
    if (!this.closed && msg.type !== 'typing') {
      this.pendingMessages.push(msg)
      if (this.pendingMessages.length > MAX_PENDING_MESSAGES) this.pendingMessages.shift()
    }
  }

  disconnect(): void {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), MAX_RECONNECT_DELAY)
    this.reconnectAttempts++
    this.reconnectTimer = setTimeout(() => this.connect(), delay)
  }

  private flushPendingMessages(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    const pending = this.pendingMessages.splice(0)
    for (const msg of pending) {
      this.ws.send(JSON.stringify(msg))
    }
  }
}
