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

export class WidgetSocket {
  private ws: WebSocket | null = null
  private config: WidgetConfig
  private onMessage: MessageHandler
  private onStatus: StatusHandler
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false
  private visitorId: string

  constructor(
    config: WidgetConfig,
    visitorId: string,
    onMessage: MessageHandler,
    onStatus: StatusHandler
  ) {
    this.config = config
    this.visitorId = visitorId
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

    const url = `${WS_BASE}/ws/${this.config.orgId}?${params.toString()}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.onStatus('connected')
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
}
