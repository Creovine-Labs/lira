/**
 * Lira Support Widget — Main entry point
 *
 * Self-contained embeddable chat widget that compiles to a single IIFE JS file.
 * Uses Shadow DOM for style isolation from the host page.
 *
 * Usage:
 *   <script src="https://widget.liraintelligence.com/v1/widget.js"
 *     data-org-id="org_abc123"
 *     data-color="#3730a3"
 *     data-greeting="Hi! How can we help?"
 *     data-position="bottom-right">
 *   </script>
 *
 * For identified visitors (server-side HMAC):
 *   data-email="user@example.com"
 *   data-name="Jane Doe"
 *   data-sig="hmac_hex_signature"
 */

import type { ChatMessage, IncomingWsMessage, WidgetConfig, WidgetView } from './types'
import { WidgetSocket } from './socket'
import { getWidgetStyles } from './styles'
import { WidgetVoiceCall } from './voice'
import type { VoiceState } from './voice'
import type { PipecatTransport } from './pipecat-transport'
import {
  LIRA_RUNTIME_CONTEXT_EVENT,
  readLiraRuntimeContext,
  type LiraRuntimeContext,
} from '../../lib/lira-runtime-context'

// ── SVG icons ─────────────────────────────────────────────────────────────────

const ICON_CHAT = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.62 1.23 4.98 3.16 6.6L4 22l4.64-2.32C9.69 19.89 10.82 20 12 20c5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>`
const ICON_CLOSE = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`
const ICON_ARROW_LEFT = `<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const ICON_SEND = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
const ICON_COPY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`
const ICON_CHECK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`
const ICON_HANDOFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`
// Lira logo for the bot avatar — hosted on the main frontend
const LIRA_LOGO_URL = 'https://liraintelligence.com/lira_black.png'
const ICON_LIRA = `<img src="${LIRA_LOGO_URL}" alt="Lira" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
// Mic icons — voice mode is a real-time conversation with Lira, not a "phone
// call". Phone iconography suggested a one-way call to a human; mic iconography
// signals "press to talk" / "voice conversation" which matches the UX.
const ICON_MIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`
const ICON_MIC_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/><path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>`

// ── Feature flags ─────────────────────────────────────────────────────────────
//
// Voice (Nova Sonic) was disabled across the widget on 2026-05-23 — multiple
// sessions of debugging couldn't get stable, smooth audio playback on the
// current EC2 (Nova Sonic V2's bursty output exceeds our jitter buffer on
// longer answers; the underlying issue is most likely upstream chunk timing
// from Bedrock, not anything we can fix client-side). Voice is parked until
// we can either (a) revisit with proper dedicated compute per call
// (AgentCore Runtime, see VOICE_ARCHITECTURE.md §8) or (b) switch to a
// different speech stack that emits steadier audio (Deepgram STT + Cartesia
// TTS, see VOICE_CHOPPINESS_INVESTIGATION.md §10 option J).
//
// To re-enable: flip this constant to `true`, rebuild widget, redeploy. The
// backend voice WS, transcript persistence, post-call wiring, and audio
// playback code are all left intact so reactivation is a one-line change.
const VOICE_FEATURE_ENABLED = false

// ── Visitor ID persistence ────────────────────────────────────────────────────
//
// Two storage modes:
//   1. PERSISTENT (default for all real customer embeds)
//      - Visitor id lives in localStorage and survives across sessions
//      - Returning visitors are recognized and pick up their chat history
//      - This is the only mode production customers ever see
//
//   2. EPHEMERAL (opt-in via data-ephemeral="true" on the script tag, used
//      ONLY by our public Nimbus demo)
//      - Visitor id lives in sessionStorage — closes tab, fresh visitor
//      - Chat history scoped to the visitor id so concurrent demo testers
//        on a shared machine don't see each other's chats
//      - This is what stops John's chat from leaking to Peter on the same
//        demo laptop
//
// The two paths never share storage keys, so swapping a widget from one
// mode to the other (e.g., if you toggled the attribute mid-deploy) won't
// pollute the other side.

function visitorStore(ephemeral: boolean): Storage | null {
  try {
    return ephemeral ? sessionStorage : localStorage
  } catch {
    return null
  }
}

function getOrCreateVisitorId(ephemeral = false): string {
  // Different keys per mode so production and demo never collide on a
  // dev machine that's been used for both.
  const KEY = ephemeral ? 'lira_visitor_id_session' : 'lira_visitor_id'
  const store = visitorStore(ephemeral)
  if (store) {
    try {
      const existing = store.getItem(KEY)
      if (existing) return existing
    } catch {
      /* storage not available */
    }
  }
  const id = 'v_' + crypto.randomUUID()
  if (store) {
    try {
      store.setItem(KEY, id)
    } catch {
      /* ignore */
    }
  }
  return id
}

// ── Message persistence ──────────────────────────────────────────────────────
//
// Identity-aware storage. We never share a chat history across identities on
// the same browser — that was the LemonPay leak that surfaced this rewrite.
//
//   • Identified visitor:    lira_chat_<orgId>_u_<lowercase-email>
//   • Anonymous visitor:     lira_chat_<orgId>_anon_<anonChatId>
//   • Ephemeral (demo only): lira_chat_session_<orgId>_<visitorId>
//
// The anon scope is keyed by a separate `lira_anon_chat_id` we rotate on
// logout, so the next anonymous user on a shared device starts clean.

function getAnonChatId(): string {
  const KEY = 'lira_anon_chat_id'
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
  } catch {
    /* no localStorage available */
  }
  const id = 'a_' + crypto.randomUUID()
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

function rotateAnonChatId(): string {
  const id = 'a_' + crypto.randomUUID()
  try {
    localStorage.setItem('lira_anon_chat_id', id)
  } catch {
    /* ignore */
  }
  return id
}

function getStorageKey(
  orgId: string,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): string {
  if (ephemeral) {
    return `lira_chat_session_${orgId}_${identity.visitorId ?? 'anon'}`
  }
  const email = identity.email?.trim().toLowerCase()
  if (email) return `lira_chat_${orgId}_u_${email}`
  return `lira_chat_${orgId}_anon_${identity.anonChatId ?? getAnonChatId()}`
}

function chatStore(ephemeral: boolean): Storage | null {
  try {
    return ephemeral ? sessionStorage : localStorage
  } catch {
    return null
  }
}

function saveMessages(
  orgId: string,
  messages: ChatMessage[],
  convId: string | null,
  unreadCount: number,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): void {
  const store = chatStore(ephemeral)
  if (!store) return
  try {
    const payload = JSON.stringify({ messages, convId, unreadCount, ts: Date.now() })
    store.setItem(getStorageKey(orgId, ephemeral, identity), payload)
  } catch {
    /* quota exceeded or unavailable */
  }
}

function loadMessages(
  orgId: string,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): { messages: ChatMessage[]; convId: string | null; unreadCount: number } | null {
  const store = chatStore(ephemeral)
  if (!store) return null
  try {
    const key = getStorageKey(orgId, ephemeral, identity)
    const raw = store.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Expire after 24 hours
    if (Date.now() - (data.ts ?? 0) > 24 * 60 * 60 * 1000) {
      store.removeItem(key)
      return null
    }
    return {
      messages: data.messages ?? [],
      convId: data.convId ?? null,
      unreadCount: Number(data.unreadCount ?? 0),
    }
  } catch {
    return null
  }
}

function latestMessageTimestamp(messages: ChatMessage[]): string | null {
  let latest: string | null = null
  for (const msg of messages) {
    if (!latest || msg.timestamp > latest) latest = msg.timestamp
  }
  return latest
}

function isSafeLink(href: string): boolean {
  try {
    const url = new URL(href, window.location.href)
    return ['http:', 'https:', 'mailto:'].includes(url.protocol)
  } catch {
    return false
  }
}

function clearStoredMessages(
  orgId: string,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): void {
  const store = chatStore(ephemeral)
  if (!store) return
  try {
    store.removeItem(getStorageKey(orgId, ephemeral, identity))
  } catch {
    /* ignore */
  }
}

// ── Widget class ──────────────────────────────────────────────────────────────

class LiraSupportWidget {
  private config: WidgetConfig
  private view: WidgetView = 'launcher'
  private messages: ChatMessage[] = []
  private isTyping = false
  private isResolved = false
  private isEscalated = false
  private demoFreshCaseStarted = false
  private reNotifyCount = 0
  private socket: WidgetSocket | null = null
  // Pipecat transport — used in place of `socket` (chat) and `voiceCall`
  // (voice) when the LIRA_USE_PIPECAT feature flag is on. One instance per
  // channel: chat sessions are long-lived (opened on widget open); voice
  // sessions are spun up on mic-click and torn down on end-call.
  private pipecatChat: PipecatTransport | null = null
  private pipecatVoice: PipecatTransport | null = null
  private visitorId: string
  // Per-anonymous-session id used to scope localStorage. Rotated on logout
  // so the next anonymous user on a shared device gets a clean slate.
  private anonChatId: string = getAnonChatId()
  // Last identity we saw in `configure(...)`. Used to detect login/logout/
  // switch transitions and react (clear local cache, fetch server history).
  private lastIdentityEmail: string | null = null

  // ── PIN gate (sensitive-action authorization) ──
  // When the server emits pin_required, we render a modal over the chat.
  // Clearing this hides the modal. Lives in memory only — never persisted
  // because a stale PIN prompt across reloads makes no sense.
  // Active action IDs while in a voice call — drives the "Lira is working"
  // overlay state. Populated when action_started arrives, cleared when
  // action_completed/failed arrives. When non-empty during a voice call,
  // the avatar pulse swaps to a spinning ring so the user sees Lira is
  // doing something during silent execution periods.
  private activeVoiceActions = new Set<string>()

  private pinPrompt: {
    action_id: string
    tool_name: string
    label: string
    hint?: string
    /** Which WS issued the prompt — determines where pin_response goes. */
    via: 'chat' | 'voice'
  } | null = null
  private pinError: string | null = null

  // ── Storage helpers (identity-aware) ──
  // Production embeds: ephemeral=false → localStorage, scoped by identity
  // (logged-in email when known, otherwise a rotating anon chat id).
  // Demo embeds: ephemeral=true → sessionStorage, scoped by visitorId.

  private currentStorageIdentity(): {
    email?: string | null
    anonChatId?: string
    visitorId?: string
  } {
    return {
      email: this.config.visitorEmail ?? null,
      anonChatId: this.anonChatId,
      visitorId: this.visitorId,
    }
  }

  private persistMessages(): void {
    saveMessages(
      this.config.orgId,
      this.messages,
      this.convId,
      this.unreadCount,
      this.config.ephemeral === true,
      this.currentStorageIdentity()
    )
  }

  private wipeStoredMessages(): void {
    clearStoredMessages(
      this.config.orgId,
      this.config.ephemeral === true,
      this.currentStorageIdentity()
    )
  }

  private csatSubmitted = false
  private convId: string | null = null
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private lastPollTime: string | null = null
  private seenMessageIds = new Set<string>()

  // Voice call
  private voiceCall: WidgetVoiceCall | null = null
  private voiceState: VoiceState = 'idle'
  private callDuration = 0
  private callTimer: ReturnType<typeof setInterval> | null = null
  private customerTypingTimeout: ReturnType<typeof setTimeout> | null = null
  private unreadCount = 0
  private forceNewCase = false

  // Streaming reply state — set when a reply_start arrives, cleared on reply_end
  private streamingMessageId: string | null = null
  private streamingBubbleEl: HTMLElement | null = null

  // Clickable suggestion chips rendered below the latest reply. Server
  // sends them via a `suggestions` WS event; customer sending a new
  // message clears them. Used by the guided onboarding flow.
  private activeSuggestions: string[] = []
  private suggestionsRowEl: HTMLElement | null = null

  // In-widget "clear conversation" confirm modal. Set true to render an
  // overlay with Cancel / Clear buttons; cleared back to false on either
  // choice. Lives in widget DOM (Shadow root) so it can't leak outside.
  private showClearConfirm = false

  // Slide-up animation gate. True between an open() and its matching close()
  // — used to suppress the `.lira-anim-in` class on every render() AFTER the
  // initial mount so subsequent re-renders don't replay the 0.25s slide-up
  // (which read as a "flicker" on every state-changing click).
  private chatAnimPlayed = false

  // DOM references
  private host: HTMLElement
  private shadow: ShadowRoot
  private messagesEl: HTMLElement | null = null
  private inputEl: HTMLTextAreaElement | null = null
  private lastCustomerPrompt = ''
  private latestRuntimeContext: LiraRuntimeContext | null = null
  private readonly runtimeContextHandler = (e: Event) => {
    const detail = (e as CustomEvent<{ context?: LiraRuntimeContext }>).detail
    if (!detail?.context) return
    this.latestRuntimeContext = detail.context
    this.sendRuntimeContext(detail.context)
  }

  constructor(config: WidgetConfig) {
    this.config = {
      mode: 'bubble',
      position: 'bottom-right',
      primaryColor: '#1A1A1A',
      greeting: 'Hi! How can we help you today?',
      ...config,
    }
    this.view = this.isFullscreen() ? 'chat' : 'launcher'
    // Demo embeds opt in to ephemeral mode via `data-ephemeral="true"`. Real
    // customer embeds never set this flag, so their behavior is unchanged.
    this.visitorId = getOrCreateVisitorId(this.config.ephemeral === true)
    this.lastIdentityEmail = this.config.visitorEmail?.trim().toLowerCase() ?? null

    // Restore persisted messages from the identity-scoped key — so a logged-in
    // visitor only sees their own history, never another user's chat that
    // happened to be on the same browser.
    const stored = loadMessages(
      this.config.orgId,
      this.config.ephemeral === true,
      this.currentStorageIdentity()
    )
    if (stored) {
      // When the hero welcome is in play, filter out the synthetic
      // greeting / server_welcome messages from prior versions of the
      // widget that pushed them as chat bubbles. Without this, an old
      // persisted greeting in localStorage would make messages.length > 0
      // and suppress the hero forever. Real customer messages survive.
      const synthetic = new Set(['greeting', 'server_welcome'])
      const isHeroEmbed = this.config.autoOpenFirstVisit === true
      this.messages = isHeroEmbed
        ? stored.messages.filter((m) => !synthetic.has(m.id))
        : stored.messages
      this.convId = stored.convId
      this.unreadCount = stored.unreadCount
      for (const m of this.messages) this.seenMessageIds.add(m.id)
    } else if (this.config.autoOpenFirstVisit) {
      // No stored chat AND we're in onboarding mode — almost certainly a
      // post-Clear reload. The customer wants a fresh conversation; tell
      // the server to start a new case on the next connect so it doesn't
      // resume the previously-persisted one and re-send history.
      this.forceNewCase = true
    }

    // Create host element with Shadow DOM
    this.host = document.createElement('div')
    this.host.id = 'lira-support-widget'
    this.host.dataset.liraMode = this.isFullscreen() ? 'fullscreen' : 'bubble'
    this.shadow = this.host.attachShadow({ mode: 'closed' })

    // Inject styles
    const style = document.createElement('style')
    style.textContent = getWidgetStyles(this.config.primaryColor!)
    this.shadow.appendChild(style)

    this.resolveMountTarget().appendChild(this.host)

    window.addEventListener(LIRA_RUNTIME_CONTEXT_EVENT, this.runtimeContextHandler)
    this.latestRuntimeContext = readLiraRuntimeContext() ?? null

    if (this.isFullscreen()) {
      this.open()
    } else {
      this.render()
    }
    if (this.convId) this.startPolling()

    // Auto-open on first page-load when the embed opts in. Sticky open
    // across reloads until the visitor clicks close; after that, never
    // auto-opens again. The dismiss flag is per-orgId so multiple widgets
    // on the same host don't share state. Wrapped in setTimeout(0) so
    // the launcher renders first; otherwise the chat panel mounts on top
    // of nothing and there's a visible jump.
    if (!this.isFullscreen() && this.config.autoOpenFirstVisit && !this.hasBeenDismissed()) {
      setTimeout(() => this.open(), 0)
    }

    // Listen for action lifecycle + PIN events that arrive over the VOICE
    // WebSocket (forwarded by voice.ts via a CustomEvent). Voice and chat
    // are two separate sockets, but the widget UI is shared — this listener
    // lets the same action-card / PIN-modal code paths fire regardless of
    // which channel issued the event.
    window.addEventListener('lira-voice-widget-event', (e: Event) => {
      const detail = (e as CustomEvent<{ msg: IncomingWsMessage; voice: WidgetVoiceCall }>).detail
      if (!detail?.msg) return
      this.handleVoiceWidgetMessage(detail.msg, detail.voice)
    })

    // Fetch org config (name, logo, color) eagerly so the launcher button reflects the brand color
    this.fetchWidgetConfig()
  }

  configure(config: Partial<WidgetConfig>): void {
    const prevEmail = this.lastIdentityEmail
    this.config = { ...this.config, ...config }
    this.host.dataset.liraMode = this.isFullscreen() ? 'fullscreen' : 'bubble'
    const styleEl = this.shadow.querySelector('style')
    if (styleEl) styleEl.textContent = getWidgetStyles(this.config.primaryColor!)

    // Detect identity transitions and react. The widget's chat state must
    // never leak across identities on a shared device:
    //   • prev=null → new=X  (login):    drop anon cache, hydrate X's history
    //   • prev=X    → new=Y  (switch):   drop X's cache, hydrate Y's history
    //   • prev=X    → new=null (logout): drop X's cache, rotate anon id
    const newEmail = this.config.visitorEmail?.trim().toLowerCase() ?? null
    if (newEmail !== prevEmail) {
      this.handleIdentityTransition(prevEmail, newEmail)
    } else {
      this.render()
    }
  }

  private handleIdentityTransition(prevEmail: string | null, newEmail: string | null): void {
    // 1) Persist whatever's currently in state under the OLD identity, then
    //    wipe the old key so it can't be read back by future widget loads
    //    on this browser.
    const prevIdentity = {
      email: prevEmail,
      anonChatId: this.anonChatId,
      visitorId: this.visitorId,
    }
    saveMessages(
      this.config.orgId,
      this.messages,
      this.convId,
      this.unreadCount,
      this.config.ephemeral === true,
      prevIdentity
    )
    clearStoredMessages(this.config.orgId, this.config.ephemeral === true, prevIdentity)

    // 2) Switch to the new identity in memory.
    this.lastIdentityEmail = newEmail
    this.messages = []
    this.convId = null
    this.unreadCount = 0

    // 3) On logout, rotate the anon chat id so the next anonymous user on
    //    this device cannot see anything the previous identified user did.
    if (!newEmail) {
      this.anonChatId = rotateAnonChatId()
    }

    // 4) Hydrate the new identity's state. For identified visitors we ask
    //    the server first (cross-device truth); fall back to whatever's
    //    cached locally under the new key. For anonymous we just read the
    //    new local key.
    if (newEmail && this.config.visitorSig) {
      this.fetchServerHistory(newEmail, this.config.visitorSig)
        .then((server) => {
          if (server) {
            this.messages = server.messages
            this.convId = server.convId
            this.unreadCount = 0
          } else {
            const local = loadMessages(
              this.config.orgId,
              this.config.ephemeral === true,
              this.currentStorageIdentity()
            )
            if (local) {
              this.messages = local.messages
              this.convId = local.convId
              this.unreadCount = local.unreadCount
            }
          }
          this.persistMessages()
          this.render()
        })
        .catch(() => {
          this.render()
        })
    } else {
      const local = loadMessages(
        this.config.orgId,
        this.config.ephemeral === true,
        this.currentStorageIdentity()
      )
      if (local) {
        this.messages = local.messages
        this.convId = local.convId
        this.unreadCount = local.unreadCount
      }
      this.render()
    }
  }

  private async fetchServerHistory(
    email: string,
    sig: string
  ): Promise<{ messages: ChatMessage[]; convId: string | null } | null> {
    try {
      const url =
        `https://api.creovine.com/lira/v1/support/chat/history/${this.config.orgId}` +
        `?email=${encodeURIComponent(email)}&sig=${encodeURIComponent(sig)}`
      const res = await fetch(url, { method: 'GET' })
      if (!res.ok) return null
      const data = (await res.json()) as {
        conv_id: string | null
        messages: Array<{
          id?: string
          role: ChatMessage['role']
          body: string
          timestamp: string
          sender_name?: string
          sender_avatar?: string
        }>
      }
      const messages: ChatMessage[] = (data.messages ?? []).map((m) => ({
        id: m.id ?? `srv-${m.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
        role: m.role,
        body: m.body,
        timestamp: m.timestamp,
      }))
      return { messages, convId: data.conv_id ?? null }
    } catch {
      return null
    }
  }

  private isFullscreen(): boolean {
    return this.config.mode === 'fullscreen'
  }

  private resolveMountTarget(): HTMLElement {
    if (!this.isFullscreen()) return document.body

    const target = this.config.target
    if (target instanceof HTMLElement) return target
    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target)
      if (el) return el
      console.warn(
        `[Lira SDK] Full-page target "${target}" was not found; mounting into document.body.`
      )
    }
    return document.body
  }

  private currentVoiceCall: WidgetVoiceCall | null = null

  private handleVoiceWidgetMessage(msg: IncomingWsMessage, voice: WidgetVoiceCall): void {
    // Cache the voice instance so submitPin / cancelPinModal can route back
    // through the same WS that issued the prompt.
    this.currentVoiceCall = voice

    switch (msg.type) {
      case 'pin_required': {
        if (!msg.action_id || !msg.tool_name) return
        this.pinPrompt = {
          action_id: msg.action_id,
          tool_name: msg.tool_name,
          label: msg.label ?? msg.tool_name,
          hint: msg.hint,
          via: 'voice',
        }
        this.render()
        return
      }
      case 'action_started': {
        if (!msg.action_id || !msg.tool_name) return
        this.activeVoiceActions.add(msg.action_id)
        this.appendChatMessage({
          id: `action_${msg.action_id}`,
          role: 'system',
          body: '',
          timestamp: new Date().toISOString(),
          action: {
            action_id: msg.action_id,
            tool_name: msg.tool_name,
            label: msg.label ?? msg.tool_name,
            icon: msg.icon,
            status: 'pending',
          },
        })
        return
      }
      case 'action_completed': {
        if (!msg.action_id) return
        this.activeVoiceActions.delete(msg.action_id)
        this.updateActionCard(msg.action_id, {
          status: 'success',
          detail: msg.summary ?? undefined,
        })
        return
      }
      case 'action_failed': {
        if (!msg.action_id) return
        this.activeVoiceActions.delete(msg.action_id)
        this.updateActionCard(msg.action_id, {
          status: 'failed',
          error: msg.error ?? 'Action failed.',
        })
        return
      }
    }
  }

  private fetchWidgetConfig(): void {
    fetch(`https://api.creovine.com/lira/v1/support/chat/widget/${this.config.orgId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return
        let needsRerender = false
        if (data.org_name) {
          this.config.orgName = data.org_name
          needsRerender = true
        }
        if (data.logo_url) {
          this.config.logoUrl = data.logo_url
          needsRerender = true
        }
        if (data.widget_color && data.widget_color !== this.config.primaryColor) {
          this.config.primaryColor = data.widget_color
          const styleEl = this.shadow.querySelector('style')
          if (styleEl) styleEl.textContent = getWidgetStyles(data.widget_color)
          needsRerender = true
        }
        if (data.voice_enabled !== undefined) {
          this.config.voiceEnabled = data.voice_enabled
          needsRerender = true
        }
        if (data.pre_chat_form_enabled !== undefined) {
          this.config.preChatFormEnabled = data.pre_chat_form_enabled
        }
        if (data.pre_chat_form_fields) {
          this.config.preChatFormFields = data.pre_chat_form_fields
        }
        if (needsRerender) this.render()
      })
      .catch(() => {
        /* ignore */
      })
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private render(): void {
    // Remove previous content (keep style)
    const style = this.shadow.querySelector('style')!
    while (this.shadow.lastChild && this.shadow.lastChild !== style) {
      this.shadow.removeChild(this.shadow.lastChild)
    }

    if (this.view === 'launcher') {
      this.renderLauncher()
    } else if (this.view === 'home') {
      this.renderHome()
    } else if (this.view === 'pre-chat') {
      this.renderPreChatForm()
    } else if (this.view === 'chat') {
      this.renderChat()
    } else if (this.view === 'csat') {
      this.renderCsat()
    }

    // Persist messages to localStorage after every render that has messages
    if (this.messages.length > 0) {
      this.persistMessages()
    }
  }

  private renderLauncher(): void {
    const btn = document.createElement('button')
    btn.className = `lira-launcher ${this.config.position}`
    btn.innerHTML = ICON_CHAT
    btn.setAttribute('aria-label', 'Open chat')
    btn.onclick = () => {
      if (this.shouldUseHomeSurface()) this.openHome()
      else this.open()
    }
    if (this.unreadCount > 0) {
      const badge = document.createElement('span')
      badge.className = 'lira-unread-badge'
      badge.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount)
      btn.appendChild(badge)
    }
    this.shadow.appendChild(btn)
  }

  private shouldUseHomeSurface(): boolean {
    return !this.isFullscreen() && this.config.demoContext?.platform === 'lira-public-site'
  }

  private openHome(): void {
    const fromLauncher = this.view === 'launcher'
    this.view = 'home'
    this.unreadCount = 0
    if (fromLauncher) this.chatAnimPlayed = false
    this.render()
  }

  private buildWidgetTabs(active: 'home' | 'chat'): HTMLElement {
    const tabs = document.createElement('div')
    tabs.className = 'lira-widget-tabs lira-widget-tabs-bottom'

    const home = document.createElement('button')
    home.className = `lira-widget-tab ${active === 'home' ? 'active' : ''}`
    home.type = 'button'
    home.textContent = 'Home'
    home.onclick = () => this.openHome()
    tabs.appendChild(home)

    const chat = document.createElement('button')
    chat.className = `lira-widget-tab ${active === 'chat' ? 'active' : ''}`
    chat.type = 'button'
    chat.textContent = 'Chat'
    chat.onclick = () => this.open()
    tabs.appendChild(chat)

    return tabs
  }

  private sendHomePrompt(body: string): void {
    this.open()
    requestAnimationFrame(() => this.sendSuggestedReply(body))
  }

  private renderHome(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    const header = document.createElement('div')
    header.className = 'lira-header'

    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    headerAvatar.innerHTML = ICON_LIRA
    header.appendChild(headerAvatar)

    const headerInfo = document.createElement('div')
    headerInfo.className = 'lira-header-info'
    headerInfo.innerHTML = `
      <div class="lira-header-title">Lira</div>
      <div class="lira-header-subtitle"><span class="lira-online-dot"></span> Online</div>
    `
    header.appendChild(headerInfo)

    const actions = document.createElement('div')
    actions.className = 'lira-header-actions'
    const closeBtn = document.createElement('button')
    closeBtn.className = 'lira-header-btn'
    closeBtn.innerHTML = ICON_CLOSE
    closeBtn.setAttribute('aria-label', 'Close widget')
    closeBtn.onclick = () => this.close()
    actions.appendChild(closeBtn)
    header.appendChild(actions)
    win.appendChild(header)

    const home = document.createElement('div')
    home.className = 'lira-home'

    const hero = document.createElement('section')
    hero.className = 'lira-home-hero'

    const glow = document.createElement('div')
    glow.className = 'lira-home-glow'
    hero.appendChild(glow)

    const logo = document.createElement('div')
    logo.className = 'lira-home-logo-wrap'
    logo.innerHTML = `
      <span class="lira-home-ring lira-home-ring-1"></span>
      <span class="lira-home-ring lira-home-ring-2"></span>
      <span class="lira-home-orbit lira-home-orbit-1"></span>
      <span class="lira-home-orbit lira-home-orbit-2"></span>
      <span class="lira-home-logo">${ICON_LIRA}</span>
    `
    home.appendChild(logo)

    const title = document.createElement('h3')
    title.className = 'lira-home-title'
    title.textContent = 'Welcome to Lira'
    hero.appendChild(title)

    const primary = document.createElement('button')
    primary.className = 'lira-home-primary'
    primary.type = 'button'
    primary.innerHTML = `Start a conversation <span class="lira-home-primary-arrow">&rarr;</span>`
    primary.onclick = () => this.open()
    hero.appendChild(primary)

    home.appendChild(hero)

    const cards = document.createElement('div')
    cards.className = 'lira-home-cards'
    const prompts = [
      {
        icon: '01',
        title: 'Install Lira',
        body: 'Get the SDK and embed snippets for your app.',
        prompt: 'How do I integrate the Lira support SDK on my app?',
      },
      {
        icon: '02',
        title: 'See what it can do',
        body: 'Conversations, tickets, actions, and handoff.',
        prompt: 'What can Lira do for a B2B support team?',
      },
      {
        icon: '03',
        title: 'Account help',
        body: 'Login, password reset, invites, and billing.',
        prompt: 'I need help with my Lira account.',
      },
    ]

    for (const item of prompts) {
      const card = document.createElement('button')
      card.className = 'lira-home-card'
      card.type = 'button'
      card.onclick = () => this.sendHomePrompt(item.prompt)

      const cardIcon = document.createElement('span')
      cardIcon.className = 'lira-home-card-icon'
      cardIcon.textContent = item.icon
      card.appendChild(cardIcon)

      const cardCopy = document.createElement('span')
      cardCopy.className = 'lira-home-card-copy'

      const cardTitle = document.createElement('span')
      cardTitle.className = 'lira-home-card-title'
      cardTitle.textContent = item.title
      cardCopy.appendChild(cardTitle)

      const cardBody = document.createElement('span')
      cardBody.className = 'lira-home-card-body'
      cardBody.textContent = item.body
      cardCopy.appendChild(cardBody)

      card.appendChild(cardCopy)

      cards.appendChild(card)
    }
    home.appendChild(cards)

    win.appendChild(home)

    win.appendChild(this.buildWidgetTabs('home'))

    const powered = document.createElement('div')
    powered.className = 'lira-powered'
    powered.innerHTML =
      'Powered by <a href="https://creovine.com" target="_blank" rel="noopener">Creovine</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)
    this.renderLauncher()
  }

  private renderPreChatForm(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    // Header
    const header = document.createElement('div')
    header.className = 'lira-header'

    const orgName = this.config.orgName || 'Support'
    const logoUrl = this.config.logoUrl
    const initial = orgName.charAt(0).toUpperCase()

    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    if (logoUrl) {
      headerAvatar.innerHTML = `<img src="${logoUrl}" alt="${orgName}" />`
    } else {
      headerAvatar.innerHTML = `<span class="lira-initial">${initial}</span>`
    }
    header.appendChild(headerAvatar)

    const headerInfo = document.createElement('div')
    headerInfo.className = 'lira-header-info'
    headerInfo.innerHTML = `
      <div class="lira-header-title">${orgName}</div>
      <div class="lira-header-subtitle"><span class="lira-online-dot"></span> Online</div>
    `
    header.appendChild(headerInfo)

    const actions = document.createElement('div')
    actions.className = 'lira-header-actions'
    const closeBtn = document.createElement('button')
    closeBtn.className = 'lira-header-btn'
    closeBtn.innerHTML = ICON_CLOSE
    closeBtn.setAttribute('aria-label', 'Close chat')
    closeBtn.onclick = () => this.close()
    actions.appendChild(closeBtn)
    header.appendChild(actions)
    win.appendChild(header)

    // Form body
    const formWrap = document.createElement('div')
    formWrap.className = 'lira-prechat-form'

    const title = document.createElement('h3')
    title.textContent = 'Before we start'
    title.style.cssText = 'margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a2e;'
    formWrap.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.textContent = 'Let us know who you are so we can help you better.'
    subtitle.style.cssText = 'margin:0 0 16px;font-size:12px;color:#888;'
    formWrap.appendChild(subtitle)

    const fields = this.config.preChatFormFields ?? ['name', 'email']
    const inputs: Record<string, HTMLInputElement> = {}

    for (const field of fields) {
      const label = document.createElement('label')
      label.style.cssText = 'display:block;margin-bottom:12px;'

      const labelText = document.createElement('span')
      labelText.textContent = field.charAt(0).toUpperCase() + field.slice(1)
      labelText.style.cssText =
        'display:block;font-size:11px;font-weight:600;color:#555;margin-bottom:4px;'
      label.appendChild(labelText)

      const input = document.createElement('input')
      input.type = field === 'email' ? 'email' : 'text'
      input.placeholder =
        field === 'email' ? 'you@company.com' : field === 'name' ? 'Your name' : ''
      input.style.cssText =
        'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e0e0e0;border-radius:10px;font-size:13px;outline:none;transition:border-color .15s;'
      input.onfocus = () => {
        input.style.borderColor = this.config.primaryColor!
      }
      input.onblur = () => {
        input.style.borderColor = '#e0e0e0'
      }
      label.appendChild(input)
      inputs[field] = input

      formWrap.appendChild(label)
    }

    const startBtn = document.createElement('button')
    startBtn.textContent = 'Start conversation'
    startBtn.style.cssText = `width:100%;padding:11px;border:none;border-radius:12px;background:${this.config.primaryColor};color:#fff;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;`
    startBtn.onmouseenter = () => {
      startBtn.style.opacity = '0.9'
    }
    startBtn.onmouseleave = () => {
      startBtn.style.opacity = '1'
    }
    startBtn.onclick = () => {
      const name = inputs['name']?.value.trim()
      const email = inputs['email']?.value.trim()
      // Basic email validation if email field is present
      if (inputs['email'] && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        inputs['email'].style.borderColor = '#ef4444'
        return
      }
      if (name) this.config.visitorName = name
      if (email) this.config.visitorEmail = email
      // Skip to chat
      this.view = 'chat'
      this.open()
    }
    formWrap.appendChild(startBtn)

    // "Skip" link
    const skip = document.createElement('button')
    skip.textContent = 'Skip'
    skip.style.cssText =
      'display:block;margin:10px auto 0;background:none;border:none;color:#999;font-size:11px;cursor:pointer;text-decoration:underline;'
    skip.onclick = () => {
      this.view = 'chat'
      this.open()
    }
    formWrap.appendChild(skip)

    win.appendChild(formWrap)

    // Powered by
    const powered = document.createElement('div')
    powered.className = 'lira-powered'
    powered.innerHTML =
      'Powered by <a href="https://creovine.com" target="_blank" rel="noopener">Creovine</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)
    if (!this.isFullscreen()) this.renderLauncher()
  }

  private renderChat(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    // Header
    const header = document.createElement('div')
    header.className = 'lira-header'

    const orgName = this.config.orgName || 'Support'
    const logoUrl = this.config.logoUrl
    const initial = orgName.charAt(0).toUpperCase()

    if (this.shouldUseHomeSurface()) {
      const backBtn = document.createElement('button')
      backBtn.className = 'lira-header-btn lira-back-btn'
      backBtn.innerHTML = ICON_ARROW_LEFT
      backBtn.setAttribute('aria-label', 'Back to home')
      backBtn.setAttribute('title', 'Back to home')
      backBtn.onclick = () => this.openHome()
      header.appendChild(backBtn)
    }

    // Header avatar
    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    if (logoUrl) {
      headerAvatar.innerHTML = `<img src="${logoUrl}" alt="${orgName}" />`
    } else {
      headerAvatar.innerHTML = `<span class="lira-initial">${initial}</span>`
    }
    header.appendChild(headerAvatar)

    // Header info (name + status)
    const headerInfo = document.createElement('div')
    headerInfo.className = 'lira-header-info'
    headerInfo.innerHTML = `
      <div class="lira-header-title">${orgName}</div>
      <div class="lira-header-subtitle"><span class="lira-online-dot"></span> Online</div>
    `
    header.appendChild(headerInfo)

    // Header action buttons
    const actions = document.createElement('div')
    actions.className = 'lira-header-actions'

    const newChatBtn = document.createElement('button')
    newChatBtn.className = 'lira-header-text-btn'
    newChatBtn.textContent = this.config.ephemeral === true ? 'Reset' : 'Clear'
    newChatBtn.setAttribute(
      'aria-label',
      this.config.ephemeral === true ? 'Reset demo conversation' : 'Clear conversation'
    )
    newChatBtn.setAttribute(
      'title',
      this.config.ephemeral === true ? 'Reset demo conversation' : 'Clear conversation'
    )
    newChatBtn.onclick = () => this.confirmStartNewConversation()
    actions.appendChild(newChatBtn)

    // Voice mode button (only if voice is enabled platform-wide AND org has it on).
    // Voice is currently disabled by the VOICE_FEATURE_ENABLED feature flag —
    // see comment near the constant for why and how to bring it back.
    if (VOICE_FEATURE_ENABLED && this.config.voiceEnabled) {
      const callBtn = document.createElement('button')
      callBtn.className =
        'lira-header-btn' + (this.voiceState === 'active' ? ' lira-call-active' : '')
      callBtn.innerHTML = this.voiceState === 'active' ? ICON_MIC_OFF : ICON_MIC
      callBtn.setAttribute(
        'aria-label',
        this.voiceState === 'active' ? 'End voice mode' : 'Talk to Lira with voice'
      )
      callBtn.setAttribute(
        'title',
        this.voiceState === 'active' ? 'End voice mode' : 'Talk with Lira'
      )
      callBtn.onclick = () => {
        if (this.voiceState === 'active' || this.voiceState === 'connecting') {
          this.endVoiceCall()
        } else {
          this.startVoiceCall()
        }
      }
      actions.appendChild(callBtn)
    }

    if (!this.isFullscreen()) {
      const closeBtn = document.createElement('button')
      closeBtn.className = 'lira-header-btn'
      closeBtn.innerHTML = ICON_CLOSE
      closeBtn.setAttribute('aria-label', 'Close chat')
      closeBtn.onclick = () => this.close()
      actions.appendChild(closeBtn)
    }

    header.appendChild(actions)
    win.appendChild(header)

    // Messages
    const messagesDiv = document.createElement('div')
    messagesDiv.className = 'lira-messages'

    if (this.shouldShowHeroWelcome()) {
      // First-time, designed welcome view. Replaces the empty message
      // list with a centered hero (avatar + greeting + CTA). Auto-dismisses
      // on first message via appendChatMessage(), so once the user sends
      // anything the normal chat takes over.
      messagesDiv.appendChild(this.buildHeroWelcomeEl())
    } else {
      for (const msg of this.messages) {
        messagesDiv.appendChild(this.buildMessageEl(msg))
      }
      if (this.isTyping) {
        messagesDiv.appendChild(this.buildTypingIndicatorEl())
      }
    }

    win.appendChild(messagesDiv)
    this.messagesEl = messagesDiv

    // Voice call overlay (shown when a call is active)
    if (this.voiceState === 'connecting' || this.voiceState === 'active') {
      const isWorking = this.voiceState === 'active' && this.activeVoiceActions.size > 0
      const overlay = document.createElement('div')
      overlay.className = 'lira-voice-overlay' + (isWorking ? ' lira-voice-working' : '')

      const avatarEl = document.createElement('div')
      // When an action is in progress, swap the pulse animation for a
      // spinning ring around the avatar — gives the user a clear visual
      // signal that Lira is doing something during the (often silent)
      // execution window. Mic pulse returns once the action completes.
      avatarEl.className =
        'lira-voice-avatar' +
        (this.voiceState === 'active' && !isWorking ? ' lira-voice-pulse' : '') +
        (isWorking ? ' lira-voice-spinring' : '')
      avatarEl.innerHTML = ICON_LIRA
      overlay.appendChild(avatarEl)

      const label = document.createElement('div')
      label.className = 'lira-voice-label'
      label.textContent =
        this.voiceState === 'connecting'
          ? 'Connecting...'
          : isWorking
            ? 'Lira is working…'
            : 'Speaking with Lira'
      overlay.appendChild(label)

      if (this.voiceState === 'active') {
        const timer = document.createElement('div')
        timer.className = 'lira-voice-timer'
        const mins = Math.floor(this.callDuration / 60)
        const secs = this.callDuration % 60
        timer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`
        overlay.appendChild(timer)
      }

      const endBtn = document.createElement('button')
      endBtn.className = 'lira-voice-end-btn'
      endBtn.textContent = 'End Call'
      endBtn.onclick = () => this.endVoiceCall()
      overlay.appendChild(endBtn)

      win.appendChild(overlay)
    }

    // In-widget Clear-conversation confirm — replaces the native browser
    // confirm() which felt out-of-place. Same z-index family as the PIN
    // modal; both Cancel and Clear dismiss it.
    if (this.showClearConfirm) {
      win.appendChild(this.buildClearConfirmEl())
    }

    // PIN entry modal — server-emitted on tools that require pin authorization.
    // Renders over the chat (z-index in styles). Submit/Cancel both clear it.
    if (this.pinPrompt) {
      win.appendChild(this.buildPinModalEl())
    }

    // Input area
    const inputArea = document.createElement('div')
    inputArea.className = 'lira-input-area'

    if (this.isResolved) {
      // Resolved — show "Start new conversation" button instead of input
      const resolvedBanner = document.createElement('div')
      resolvedBanner.className = 'lira-resolved-banner'
      resolvedBanner.innerHTML = `<span>This conversation is resolved</span>`

      const newChatActionBtn = document.createElement('button')
      newChatActionBtn.className = 'lira-new-chat-btn'
      newChatActionBtn.textContent = 'Start a new conversation'
      newChatActionBtn.onclick = () => this.startNewConversation()

      inputArea.appendChild(resolvedBanner)
      inputArea.appendChild(newChatActionBtn)
    } else {
      const textarea = document.createElement('textarea')
      textarea.placeholder = 'Type a message...'
      textarea.rows = 1
      textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          this.sendMessage()
        }
      })
      textarea.addEventListener('input', () => {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px'
        // Send typing indicator (debounced)
        if (this.customerTypingTimeout) clearTimeout(this.customerTypingTimeout)
        this.customerTypingTimeout = setTimeout(() => {
          this.socket?.send({ type: 'typing' })
        }, 300)
      })
      inputArea.appendChild(textarea)
      this.inputEl = textarea

      const sendBtn = document.createElement('button')
      sendBtn.className = 'lira-send-btn'
      sendBtn.innerHTML = ICON_SEND
      sendBtn.setAttribute('aria-label', 'Send message')
      sendBtn.onclick = () => this.sendMessage()
      inputArea.appendChild(sendBtn)
    }

    // Suggestion pills row — sits BETWEEN the messages and the input
    // area. Populated by `updateSuggestionsRow()` whenever the server
    // emits a `suggestions` event. Cleared on send.
    const suggestionsRow = document.createElement('div')
    suggestionsRow.className = 'lira-suggestions'
    win.appendChild(suggestionsRow)
    this.suggestionsRowEl = suggestionsRow
    this.updateSuggestionsRow()

    win.appendChild(inputArea)

    // Bottom Home/Chat tabs are intentionally NOT rendered on the chat view —
    // they steal vertical space and the chat panel already has a left-arrow
    // header button (lira-back-btn) that returns to the home surface.
    const powered = document.createElement('div')
    powered.className = 'lira-powered'
    powered.innerHTML =
      'Powered by <a href="https://creovine.com" target="_blank" rel="noopener">Creovine</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)

    // Also render launcher (minimized state) for floating embeds.
    if (!this.isFullscreen()) this.renderLauncher()

    // Scroll to bottom
    requestAnimationFrame(() => {
      if (this.messagesEl) {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight
      }
      this.inputEl?.focus()
    })
  }

  private renderCsat(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    // Header
    const header = document.createElement('div')
    header.className = 'lira-header'

    const orgName = this.config.orgName || 'Support'
    const logoUrl = this.config.logoUrl
    const initial = orgName.charAt(0).toUpperCase()

    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    if (logoUrl) {
      headerAvatar.innerHTML = `<img src="${logoUrl}" alt="${orgName}" />`
    } else {
      headerAvatar.innerHTML = `<span class="lira-initial">${initial}</span>`
    }
    header.appendChild(headerAvatar)

    const headerInfo = document.createElement('div')
    headerInfo.className = 'lira-header-info'
    headerInfo.innerHTML = `
      <div class="lira-header-title">${orgName}</div>
      <div class="lira-header-subtitle"><span class="lira-online-dot"></span> Online</div>
    `
    header.appendChild(headerInfo)

    const actions = document.createElement('div')
    actions.className = 'lira-header-actions'
    const closeBtn = document.createElement('button')
    closeBtn.className = 'lira-header-btn'
    closeBtn.innerHTML = ICON_CLOSE
    closeBtn.setAttribute('aria-label', 'Close chat')
    closeBtn.onclick = () => this.close()
    actions.appendChild(closeBtn)
    header.appendChild(actions)
    win.appendChild(header)

    // Messages (show conversation)
    const messagesDiv = document.createElement('div')
    messagesDiv.className = 'lira-messages'
    for (const msg of this.messages) {
      messagesDiv.appendChild(this.buildMessageEl(msg))
    }
    win.appendChild(messagesDiv)

    // CSAT section
    const csat = document.createElement('div')
    csat.className = 'lira-csat'

    if (this.csatSubmitted) {
      csat.innerHTML = `
        <h3>Thank you!</h3>
        <p class="lira-csat-thanks">Your feedback helps us improve.</p>
      `
      // Add "Start new conversation" button after thank-you
      const newChatBtn2 = document.createElement('button')
      newChatBtn2.className = 'lira-new-chat-btn'
      newChatBtn2.textContent = 'Start a new conversation'
      newChatBtn2.style.marginTop = '12px'
      newChatBtn2.onclick = () => this.startNewConversation()
      csat.appendChild(newChatBtn2)
    } else {
      csat.innerHTML = `
        <h3>How was your experience?</h3>
        <p>Rate your conversation with Lira</p>
        <div class="lira-csat-stars"></div>
      `
      const starsContainer = csat.querySelector('.lira-csat-stars')!
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('button')
        star.className = 'lira-csat-star'
        star.textContent = '★'
        star.setAttribute('aria-label', `Rate ${i} out of 5`)
        star.onclick = () => this.submitCsat(i)
        starsContainer.appendChild(star)
      }
    }

    win.appendChild(csat)

    const powered = document.createElement('div')
    powered.className = 'lira-powered'
    powered.innerHTML =
      'Powered by <a href="https://creovine.com" target="_blank" rel="noopener">Creovine</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)
    if (!this.isFullscreen()) this.renderLauncher()
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private startVoiceCall(): void {
    if (this.voiceCall || this.pipecatVoice) return

    // ARCHITECTURE DECISION (2026-05-23): voice ALWAYS uses the legacy
    // direct-to-Nova-Sonic path, even when ?pipecat=1 is set. The Pipecat
    // pipeline adds enough per-chunk CPU on a small EC2 to make voice
    // audibly choppy, and the wrapper we built didn't give us anything
    // we couldn't get back: tool execution is now intentionally deferred
    // to a post-call text-LLM stage (cleaner separation of concerns,
    // see lira-postcall-processor.service.ts). Pipecat stays in use for
    // CHAT — that's where its abstraction pays for itself.
    //
    // Leaving the call to `startPipecatVoiceCall()` here was the cause
    // of the choppy voice the user reported on 2026-05-23.

    this.voiceCall = new WidgetVoiceCall(
      this.config.orgId,
      this.visitorId,
      this.config.demoContext,
      {
        onStateChange: (state) => {
          this.voiceState = state
          if (state === 'active') {
            // Start call duration timer
            this.callDuration = 0
            this.callTimer = setInterval(() => {
              this.callDuration++
              this.updateCallTimer()
            }, 1000)
          }
          if (state === 'idle' || state === 'ended') {
            // Clear any in-flight action tracking — once the call ends we
            // can't receive further action_completed/failed events.
            this.activeVoiceActions.clear()
            this.currentVoiceCall = null
            if (this.callTimer) {
              clearInterval(this.callTimer)
              this.callTimer = null
            }
            this.voiceCall = null
          }
          this.render()
        },
        onTranscript: (text, role) => {
          this.appendChatMessage({
            id: `voice_${Date.now()}`,
            role: role,
            body: text,
            timestamp: new Date().toISOString(),
          })
        },
        onError: (message) => {
          this.appendChatMessage({
            id: `voice_err_${Date.now()}`,
            role: 'system',
            body: message,
            timestamp: new Date().toISOString(),
          })
        },
        onMicLevel: (_level) => {
          // Could visualize mic level — currently unused
        },
      }
    )

    this.voiceCall.start()
  }

  private endVoiceCall(): void {
    if (this.voiceCall) {
      this.voiceCall.end()
    }
    if (this.pipecatVoice) {
      void this.pipecatVoice.stop()
      this.pipecatVoice = null
      this.voiceState = 'ended'
      this.activeVoiceActions.clear()
    }
    if (this.callTimer) {
      clearInterval(this.callTimer)
      this.callTimer = null
    }
    this.render()
  }

  /** Update only the call timer text — no DOM rebuild */
  private updateCallTimer(): void {
    const timerEl = this.shadow.querySelector('.lira-voice-timer')
    if (timerEl) {
      const mins = Math.floor(this.callDuration / 60)
      const secs = this.callDuration % 60
      timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`
    }
  }

  /**
   * Show the "Lira is typing…" indicator without rebuilding the chat.
   * Idempotent — calling twice doesn't duplicate the indicator.
   */
  private showTypingIndicator(): void {
    if (!this.messagesEl) return
    if (this.messagesEl.querySelector('.lira-typing-row')) return
    const typingRow = this.buildTypingIndicatorEl()
    this.messagesEl.appendChild(typingRow)
    requestAnimationFrame(() => {
      if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight
    })
  }

  /** Hide the typing indicator if present. Safe to call when not visible. */
  private hideTypingIndicator(): void {
    if (!this.messagesEl) return
    const existing = this.messagesEl.querySelector('.lira-typing-row')
    if (existing) existing.remove()
  }

  /**
   * Set the typing state and update DOM atomically. Use this instead of
   * `this.isTyping = X` directly — that pattern relied on a subsequent
   * full render() to materialise the change, which caused widget flicker.
   * Calling this is safe at any point in the lifecycle (no-op if
   * messagesEl isn't mounted yet — state still updates).
   */
  private setTyping(value: boolean): void {
    this.isTyping = value
    if (value) this.showTypingIndicator()
    else {
      this.hideTypingIndicator()
    }
  }

  /**
   * Rebuild the suggestion-pill row from `this.activeSuggestions`. Empty
   * array → hide the row entirely. Click a chip → send its text as the
   * customer's next message and clear the row. Surgical DOM update so
   * the chat above doesn't reflow.
   */
  private updateSuggestionsRow(): void {
    const row = this.suggestionsRowEl
    if (!row) return
    row.innerHTML = ''
    if (this.activeSuggestions.length === 0) {
      row.style.display = 'none'
      return
    }
    row.style.display = ''
    for (const s of this.activeSuggestions) {
      const chip = document.createElement('button')
      chip.type = 'button'
      chip.className = 'lira-suggestion-chip'
      chip.textContent = s
      chip.onclick = () => {
        // Treat the chip as the customer's next typed message.
        if (this.inputEl) this.inputEl.value = s
        this.sendMessage()
      }
      row.appendChild(chip)
    }
  }

  private buildTypingIndicatorEl(): HTMLElement {
    const typingRow = document.createElement('div')
    typingRow.className = 'lira-typing-row'
    const typingAvatar = document.createElement('div')
    typingAvatar.className = 'lira-msg-avatar lira-avatar'
    typingAvatar.innerHTML = ICON_LIRA
    typingRow.appendChild(typingAvatar)

    const typingCard = document.createElement('div')
    typingCard.className = 'lira-typing-card'

    const typing = document.createElement('div')
    typing.className = 'lira-typing'
    typing.innerHTML = '<span></span><span></span><span></span>'
    typingCard.appendChild(typing)

    const label = document.createElement('div')
    label.className = 'lira-working-label'
    label.textContent = this.getWorkingLabel()
    typingCard.appendChild(label)

    typingRow.appendChild(typingCard)
    return typingRow
  }

  private getWorkingLabel(): string {
    // Friendly, human-sounding status text shown while Lira is composing a
    // reply. Each category has 2–3 variants picked at random so consecutive
    // turns don't feel like a robot reading the same script. Avoid leaking
    // implementation details (e.g. "Searching docs", "Querying vectors") —
    // the visitor doesn't care; they care that someone is working on it.
    const pick = (variants: string[]) => variants[Math.floor(Math.random() * variants.length)]

    const prompt = this.lastCustomerPrompt.trim().toLowerCase()

    // Short / casual greetings — a one-line "Hello" deserves a calm, brief
    // status, not "Putting that together…". Match by EXACT short message or
    // a tiny set of conversational openers.
    if (
      prompt.length <= 15 ||
      /^(hi|hello|hey|sup|yo|hola|howdy|good (morning|afternoon|evening)|hey there|hi there)\b/.test(
        prompt
      )
    ) {
      return pick(['One moment...', 'Just a sec...', 'On it...'])
    }

    if (/(install|embed|script|website|widget|logged-in|logged in)/.test(prompt)) {
      return pick(['Pulling the install steps...', 'Setting that up for you...'])
    }
    if (/(price|pricing|plan|starter|growth|business|billing)/.test(prompt)) {
      return pick(['Looking up the plan details...', 'Pulling pricing...'])
    }
    if (/(payment|invoice|receipt|subscription|account|card|failed|failure)/.test(prompt)) {
      return pick(['Pulling that up...', 'Looking into your account...'])
    }
    if (/(error|issue|problem|not showing|not working|broken|stuck)/.test(prompt)) {
      return pick(['Thinking this through...', 'Working on it...'])
    }
    return pick(['Thinking...', 'One moment...'])
  }

  /**
   * Class string for the chat window root element. Adds `.lira-anim-in` only
   * on the first render after open(); subsequent renders return the same
   * class without the animation token so no slide-up replays.
   */
  private chatWindowClass(): string {
    const base = `lira-chat-window ${this.config.position}${
      this.isFullscreen() ? ' lira-fullscreen' : ''
    }`
    if (this.isFullscreen()) return base
    if (this.chatAnimPlayed) return base
    this.chatAnimPlayed = true
    return `${base} lira-anim-in`
  }

  /**
   * Update the unread badge on the launcher in-place. No-op outside launcher
   * view. Used by message-receive paths so we don't trigger a full render()
   * just to bump the badge number.
   */
  private updateLauncherBadge(): void {
    if (this.view !== 'launcher') return
    const launcher = this.shadow.querySelector('.lira-launcher') as HTMLElement | null
    if (!launcher) return
    let badge = launcher.querySelector('.lira-unread-badge') as HTMLElement | null
    if (this.unreadCount <= 0) {
      badge?.remove()
      return
    }
    if (!badge) {
      badge = document.createElement('span')
      badge.className = 'lira-unread-badge'
      launcher.appendChild(badge)
    }
    badge.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount)
  }

  /**
   * Decide whether the chat panel should render the first-visit hero
   * welcome instead of the normal (empty) message list. Conditions:
   *   - The embed opted into the onboarding flow (`autoOpenFirstVisit`)
   *   - No chat history yet (messages.length === 0)
   *   - Conversation isn't already resolved/escalated/typing
   * Once the user sends a first message, appendChatMessage() strips the
   * hero so we slide straight into the normal chat view.
   */
  private shouldShowHeroWelcome(): boolean {
    return (
      this.config.autoOpenFirstVisit === true &&
      this.messages.length === 0 &&
      !this.isTyping &&
      !this.isResolved &&
      !this.isEscalated &&
      !this.streamingMessageId
    )
  }

  /**
   * Build the first-visit hero welcome block. Designed to feel like a
   * polished onboarding screen rather than an empty chat: centered avatar,
   * big personalised greeting, one-line subtitle, primary CTA that kicks
   * off the guided flow, and a hint that typing below also works.
   *
   * The input area below it (rendered by renderChat) remains active, so
   * the user can type a free-form question instead of clicking the CTA.
   * Either action dismisses the hero on the next DOM mutation.
   */
  private buildHeroWelcomeEl(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'lira-hero'

    // Decorative glow background — soft animated radial gradient, sits
    // behind the content. Pure CSS, no SVG, lightweight.
    const glow = document.createElement('div')
    glow.className = 'lira-hero-glow'
    glow.setAttribute('aria-hidden', 'true')
    wrap.appendChild(glow)

    // Avatar with breathing pulse ring around it. Two rings, staggered,
    // give a continuous "thinking / alive" feel without being distracting.
    const avatarWrap = document.createElement('div')
    avatarWrap.className = 'lira-hero-avatar-wrap'
    const ring1 = document.createElement('span')
    ring1.className = 'lira-hero-ring lira-hero-ring-1'
    ring1.setAttribute('aria-hidden', 'true')
    const ring2 = document.createElement('span')
    ring2.className = 'lira-hero-ring lira-hero-ring-2'
    ring2.setAttribute('aria-hidden', 'true')
    avatarWrap.appendChild(ring1)
    avatarWrap.appendChild(ring2)
    const avatar = document.createElement('div')
    avatar.className = 'lira-hero-avatar'
    avatar.innerHTML = ICON_LIRA
    avatarWrap.appendChild(avatar)
    wrap.appendChild(avatarWrap)

    // Small "online" pill above the headline.
    const badge = document.createElement('div')
    badge.className = 'lira-hero-badge'
    badge.innerHTML = '<span class="lira-hero-dot"></span> Lira is online'
    wrap.appendChild(badge)

    const title = document.createElement('h2')
    title.className = 'lira-hero-title'
    const firstName = this.config.visitorName?.split(' ')[0] ?? ''
    title.textContent = firstName ? `Welcome, ${firstName}` : 'Welcome'
    wrap.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.className = 'lira-hero-subtitle'
    subtitle.textContent =
      "I'm your guide. I can walk you through setting up your support agent in just a few minutes."
    wrap.appendChild(subtitle)

    const ctaBtn = document.createElement('button')
    ctaBtn.className = 'lira-hero-cta'
    ctaBtn.innerHTML =
      '<span>Guide me through setup</span>' +
      '<svg viewBox="0 0 24 24" class="lira-hero-cta-arrow" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>'
    ctaBtn.onclick = () => this.startGuidedFlow()
    wrap.appendChild(ctaBtn)

    const hint = document.createElement('p')
    hint.className = 'lira-hero-hint'
    hint.textContent = 'or type your question below'
    wrap.appendChild(hint)

    return wrap
  }

  /**
   * Triggered by the hero's primary CTA. Pre-fills the input with a
   * starter prompt and submits it as the user's first message; the
   * agent picks it up and starts the walkthrough. Hero auto-dismisses
   * via appendChatMessage() inside sendMessage().
   */
  private startGuidedFlow(): void {
    if (this.inputEl) {
      this.inputEl.value = 'Guide me through setting up my support agent.'
    }
    this.sendMessage()
  }

  /** Append a single message to the chat (no DOM rebuild). */
  private appendChatMessage(msg: ChatMessage): void {
    this.messages.push(msg)
    if (this.messagesEl) {
      // Auto-dismiss the first-visit hero block once the conversation
      // actually starts. Done here (not via re-render) so the user's
      // first bubble appears in place of the hero, no flicker.
      const hero = this.messagesEl.querySelector('.lira-hero')
      if (hero) hero.remove()

      const el = this.buildMessageEl(msg)
      this.messagesEl.appendChild(el)
      requestAnimationFrame(() => {
        if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight
      })
    }
    this.persistMessages()
  }

  private buildMessageEl(msg: ChatMessage): HTMLElement {
    if (msg.action) {
      return this.buildActionEl(msg.action)
    }
    if (msg.actionResult) {
      const chip = document.createElement('div')
      chip.className = `lira-action-chip ${msg.actionResult.ok ? 'ok' : 'fail'}`
      const dot = document.createElement('span')
      dot.className = 'lira-action-dot'
      dot.textContent = msg.actionResult.ok ? '✓' : '✗'
      const label = document.createElement('span')
      label.textContent = msg.actionResult.label
      chip.appendChild(dot)
      chip.appendChild(label)
      return chip
    }
    if (msg.card) {
      return this.buildCardEl(msg)
    }
    if (msg.confirm) {
      return this.buildConfirmEl(msg)
    }
    if (msg.role === 'customer') {
      const el = document.createElement('div')
      el.className = 'lira-msg customer'
      el.textContent = msg.body
      return el
    }
    if (msg.role === 'system') {
      return this.buildSystemMessageEl(msg.body)
    }
    const row = document.createElement('div')
    row.className = 'lira-msg-row'
    const avatarDiv = document.createElement('div')
    avatarDiv.className = 'lira-msg-avatar'
    if (msg.role === 'lira') {
      avatarDiv.classList.add('lira-avatar')
      avatarDiv.innerHTML = ICON_LIRA
    } else if (msg.sender_avatar) {
      const img = document.createElement('img')
      img.src = msg.sender_avatar
      img.alt = msg.sender_name || 'Agent'
      img.onerror = () => {
        img.remove()
        avatarDiv.textContent = (msg.sender_name || 'A').charAt(0).toUpperCase()
      }
      avatarDiv.appendChild(img)
    } else {
      avatarDiv.textContent = (msg.sender_name || 'A').charAt(0).toUpperCase()
    }
    const bodyDiv = document.createElement('div')
    bodyDiv.className = 'lira-msg-body'
    const nameEl = document.createElement('div')
    nameEl.className = 'lira-msg-name'
    nameEl.textContent = msg.role === 'lira' ? 'Lira' : msg.sender_name || 'Agent'
    bodyDiv.appendChild(nameEl)
    const bubble = document.createElement('div')
    bubble.className = `lira-msg ${msg.role}`
    this.renderMessageBody(bubble, msg)
    bodyDiv.appendChild(bubble)
    row.appendChild(avatarDiv)
    row.appendChild(bodyDiv)
    return row
  }

  private buildSystemMessageEl(body: string): HTMLElement {
    if (/team member|teammate|support team|notified|reply shortly|reply soon/i.test(body)) {
      const panel = document.createElement('div')
      panel.className = 'lira-handoff'

      const icon = document.createElement('div')
      icon.className = 'lira-handoff-icon'
      icon.innerHTML = ICON_HANDOFF
      panel.appendChild(icon)

      const content = document.createElement('div')
      content.className = 'lira-handoff-content'

      const title = document.createElement('div')
      title.className = 'lira-handoff-title'
      title.textContent = 'Sent to support'
      content.appendChild(title)

      const text = document.createElement('div')
      text.className = 'lira-handoff-body'
      text.textContent = body
      content.appendChild(text)

      panel.appendChild(content)
      return panel
    }

    const el = document.createElement('div')
    el.className = 'lira-msg system'
    el.textContent = body
    return el
  }

  private renderMessageBody(bubble: HTMLElement, msg: ChatMessage): void {
    bubble.textContent = ''
    if (msg.role === 'lira' || msg.role === 'agent') {
      bubble.classList.add('lira-rich-text')
      this.renderRichTextInto(bubble, msg.body)
      return
    }
    bubble.classList.remove('lira-rich-text')
    bubble.textContent = msg.body
  }

  private renderRichTextInto(container: HTMLElement, raw: string): void {
    const text = raw.replace(/\r\n/g, '\n')
    const fenceRegex = /```([a-zA-Z0-9_-]+)?[ \t]*\n([\s\S]*?)```/g
    let cursor = 0
    let found = false
    let match: RegExpExecArray | null

    while ((match = fenceRegex.exec(text))) {
      found = true
      const before = text.slice(cursor, match.index)
      this.appendRichTextBlocks(container, before)
      this.appendCodeBlock(container, match[2].replace(/\n$/, ''), match[1])
      cursor = fenceRegex.lastIndex
    }

    this.appendRichTextBlocks(container, text.slice(cursor))

    if (!found && container.childNodes.length === 0 && raw) {
      const p = document.createElement('p')
      p.textContent = raw
      container.appendChild(p)
    }
  }

  private appendRichTextBlocks(container: HTMLElement, raw: string): void {
    const normalised = raw.trim()
    if (!normalised) return

    const blocks = normalised.split(/\n{2,}/)
    for (const block of blocks) {
      const lines = block.split('\n').filter((line) => line.trim().length > 0)
      if (lines.length === 0) continue

      if (this.isMarkdownTable(lines)) {
        this.appendMarkdownTable(container, lines)
        continue
      }

      const headingMatch = lines.length === 1 ? /^(#{1,3})\s+(.+)$/.exec(lines[0]) : null
      if (headingMatch) {
        const h = document.createElement('div')
        h.className = 'lira-md-heading'
        this.appendInlineMarkdown(h, headingMatch[2])
        container.appendChild(h)
        continue
      }

      if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
        const ul = document.createElement('ul')
        for (const line of lines) {
          const li = document.createElement('li')
          this.appendInlineMarkdown(li, line.replace(/^\s*[-*]\s+/, ''))
          ul.appendChild(li)
        }
        container.appendChild(ul)
        continue
      }

      if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
        const ol = document.createElement('ol')
        for (const line of lines) {
          const li = document.createElement('li')
          this.appendInlineMarkdown(li, line.replace(/^\s*\d+[.)]\s+/, ''))
          ol.appendChild(li)
        }
        container.appendChild(ol)
        continue
      }

      const p = document.createElement('p')
      lines.forEach((line, index) => {
        if (index > 0) p.appendChild(document.createElement('br'))
        this.appendInlineMarkdown(p, line)
      })
      container.appendChild(p)
    }
  }

  private isMarkdownTable(lines: string[]): boolean {
    if (lines.length < 2) return false
    const header = this.parseTableRow(lines[0])
    const separator = this.parseTableRow(lines[1])
    if (header.length < 2 || separator.length !== header.length) return false
    return separator.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  }

  private appendMarkdownTable(container: HTMLElement, lines: string[]): void {
    const headers = this.parseTableRow(lines[0])
    const rows = lines.slice(2).map((line) => this.parseTableRow(line))

    const wrap = document.createElement('div')
    wrap.className = 'lira-table-wrap'

    const table = document.createElement('table')
    table.className = 'lira-md-table'

    const thead = document.createElement('thead')
    const headRow = document.createElement('tr')
    for (const header of headers) {
      const th = document.createElement('th')
      this.appendInlineMarkdown(th, header)
      headRow.appendChild(th)
    }
    thead.appendChild(headRow)
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    for (const row of rows) {
      if (row.length === 0) continue
      const tr = document.createElement('tr')
      for (let i = 0; i < headers.length; i++) {
        const td = document.createElement('td')
        this.appendInlineMarkdown(td, row[i] ?? '')
        tr.appendChild(td)
      }
      tbody.appendChild(tr)
    }
    table.appendChild(tbody)

    wrap.appendChild(table)
    container.appendChild(wrap)
  }

  private parseTableRow(line: string): string[] {
    const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
    return trimmed.split('|').map((cell) => cell.trim())
  }

  private appendInlineMarkdown(parent: HTMLElement, text: string): void {
    const tokenRegex = /(`[^`\n]+`|\*\*[^*\n]+?\*\*|\*[^*\n]+?\*|\[[^\]\n]+\]\(([^)\s]+)\))/g
    let cursor = 0
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(text))) {
      if (match.index > cursor) {
        parent.appendChild(document.createTextNode(text.slice(cursor, match.index)))
      }

      const token = match[0]
      if (token.startsWith('`') && token.endsWith('`')) {
        const code = document.createElement('code')
        code.textContent = token.slice(1, -1)
        parent.appendChild(code)
      } else if (token.startsWith('**') && token.endsWith('**')) {
        const strong = document.createElement('strong')
        strong.textContent = token.slice(2, -2)
        parent.appendChild(strong)
      } else if (token.startsWith('*') && token.endsWith('*')) {
        const em = document.createElement('em')
        em.textContent = token.slice(1, -1)
        parent.appendChild(em)
      } else {
        const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
        if (linkMatch && isSafeLink(linkMatch[2])) {
          const a = document.createElement('a')
          a.href = linkMatch[2]
          a.textContent = linkMatch[1]
          a.target = '_blank'
          a.rel = 'noopener noreferrer'
          parent.appendChild(a)
        } else {
          parent.appendChild(document.createTextNode(token))
        }
      }
      cursor = tokenRegex.lastIndex
    }

    if (cursor < text.length) {
      parent.appendChild(document.createTextNode(text.slice(cursor)))
    }
  }

  private appendCodeBlock(container: HTMLElement, codeText: string, language?: string): void {
    const wrap = document.createElement('div')
    wrap.className = 'lira-code-block'

    const toolbar = document.createElement('div')
    toolbar.className = 'lira-code-toolbar'

    const lang = document.createElement('span')
    lang.className = 'lira-code-lang'
    lang.textContent = language ? language.toLowerCase() : 'code'
    toolbar.appendChild(lang)

    const copy = document.createElement('button')
    copy.className = 'lira-copy-btn'
    copy.type = 'button'
    copy.innerHTML = `${ICON_COPY}<span>Copy</span>`
    copy.setAttribute('aria-label', 'Copy code')
    copy.onclick = () => this.copyText(codeText, copy)
    toolbar.appendChild(copy)

    const pre = document.createElement('pre')
    const code = document.createElement('code')
    code.textContent = codeText
    pre.appendChild(code)

    wrap.appendChild(toolbar)
    wrap.appendChild(pre)
    container.appendChild(wrap)
  }

  private async copyText(text: string, button: HTMLButtonElement): Promise<void> {
    const original = button.innerHTML
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        this.shadow.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        textarea.remove()
      }
      button.classList.add('copied')
      button.innerHTML = `${ICON_CHECK}<span>Copied</span>`
      window.setTimeout(() => {
        button.classList.remove('copied')
        button.innerHTML = original
      }, 1400)
    } catch {
      button.innerHTML = `${ICON_COPY}<span>Failed</span>`
      window.setTimeout(() => {
        button.innerHTML = original
      }, 1400)
    }
  }

  private normalizeServerSuggestions(raw: unknown[]): string[] {
    // Trust the server. The LLM is required to call lira_suggest_next_actions
    // after every reply with chip text tailored to the actual conversation —
    // overriding it client-side based on keyword regexes (as the old code
    // did) caused stale "Chat widget / Full support page / Both" pills to
    // appear on unrelated questions whenever the reply text happened to
    // mention those phrases in passing. Just clean and dedupe.
    const seen = new Set<string>()
    const out: string[] = []
    for (const s of raw) {
      const str = String(s ?? '').trim()
      if (!str) continue
      const key = str.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(str)
    }
    return out
  }

  private sendSuggestedReply(body: string): void {
    if (/^start a new conversation\.?$/i.test(body.trim())) {
      this.startNewConversation()
      return
    }

    if (!this.inputEl) return
    this.inputEl.value = body
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    this.sendMessage()
  }

  private buildCardEl(msg: ChatMessage): HTMLElement {
    const card = msg.card!
    const wrap = document.createElement('div')
    wrap.className = 'lira-card'
    if (card.title) {
      const h = document.createElement('div')
      h.className = 'lira-card-title'
      h.textContent = card.title
      if (card.badge) {
        const b = document.createElement('span')
        b.className = `lira-card-badge tone-${card.badge.tone ?? 'neutral'}`
        b.textContent = card.badge.text
        h.appendChild(b)
      }
      wrap.appendChild(h)
    }
    if (card.body) {
      const b = document.createElement('div')
      b.className = 'lira-card-body'
      b.textContent = card.body
      wrap.appendChild(b)
    }
    if (card.fields && card.fields.length > 0) {
      const dl = document.createElement('dl')
      dl.className = 'lira-card-fields'
      for (const f of card.fields) {
        const dt = document.createElement('dt')
        dt.textContent = f.label
        const dd = document.createElement('dd')
        dd.textContent = f.value
        dl.appendChild(dt)
        dl.appendChild(dd)
      }
      wrap.appendChild(dl)
    }
    if (card.buttons && card.buttons.length > 0) {
      const row = document.createElement('div')
      row.className = 'lira-card-buttons'
      for (const btn of card.buttons) {
        const b = document.createElement('button')
        b.className = `lira-card-btn ${btn.style ?? 'secondary'}`
        b.textContent = btn.label
        b.onclick = () => this.handleCardButtonClick(btn.action)
        row.appendChild(b)
      }
      wrap.appendChild(row)
    }
    return wrap
  }

  private buildConfirmEl(msg: ChatMessage): HTMLElement {
    const c = msg.confirm!
    const wrap = document.createElement('div')
    wrap.className = 'lira-confirm'
    const t = document.createElement('div')
    t.className = 'lira-confirm-title'
    t.textContent = c.title
    const b = document.createElement('div')
    b.className = 'lira-confirm-body'
    b.textContent = c.body
    wrap.appendChild(t)
    wrap.appendChild(b)
    if (c.resolved) {
      const status = document.createElement('div')
      status.className = `lira-confirm-status ${c.resolved}`
      status.textContent = c.resolved === 'approved' ? 'Approved' : 'Cancelled'
      wrap.appendChild(status)
      return wrap
    }
    const row = document.createElement('div')
    row.className = 'lira-confirm-buttons'
    const approve = document.createElement('button')
    approve.className = 'lira-card-btn primary'
    approve.textContent = 'Approve'
    approve.onclick = () => this.respondToConfirm(msg, true)
    const cancel = document.createElement('button')
    cancel.className = 'lira-card-btn secondary'
    cancel.textContent = 'Cancel'
    cancel.onclick = () => this.respondToConfirm(msg, false)
    row.appendChild(approve)
    row.appendChild(cancel)
    wrap.appendChild(row)
    return wrap
  }

  private buildActionEl(action: NonNullable<ChatMessage['action']>): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = `lira-action lira-action-${action.status}`
    wrap.setAttribute('data-action-id', action.action_id)

    const head = document.createElement('div')
    head.className = 'lira-action-head'

    const icon = document.createElement('span')
    icon.className = 'lira-action-icon'
    if (action.status === 'pending') {
      icon.innerHTML = '<span class="lira-action-spinner"></span>'
    } else if (action.status === 'success') {
      icon.textContent = '✓'
    } else {
      icon.textContent = '⚠'
    }
    head.appendChild(icon)

    const main = document.createElement('div')
    main.className = 'lira-action-main'

    const title = document.createElement('div')
    title.className = 'lira-action-title'
    const prefix = action.icon ? `${action.icon} ` : ''
    title.textContent =
      action.status === 'pending' ? `${prefix}${action.label}…` : `${prefix}${action.label}`
    main.appendChild(title)

    const detailText =
      action.status === 'failed'
        ? action.error
        : action.status === 'success'
          ? action.detail
          : 'Working on it…'
    if (detailText) {
      const detail = document.createElement('div')
      detail.className = 'lira-action-detail'
      detail.textContent = detailText
      main.appendChild(detail)
    }

    head.appendChild(main)
    wrap.appendChild(head)
    return wrap
  }

  /**
   * In-widget confirm overlay for clearing the conversation. Replaces
   * the browser's native confirm() which looks out of place inside the
   * branded widget surface. Cancel returns to chat; Clear runs
   * startNewConversation(). Reuses the PIN modal's backdrop styles.
   */
  private buildClearConfirmEl(): HTMLElement {
    const backdrop = document.createElement('div')
    backdrop.className = 'lira-pin-backdrop'
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.dismissClearConfirm()
    })

    const modal = document.createElement('div')
    modal.className = 'lira-pin-modal'
    modal.addEventListener('click', (e) => e.stopPropagation())

    const title = document.createElement('div')
    title.className = 'lira-pin-title'
    title.textContent = 'Clear this conversation?'
    modal.appendChild(title)

    const body = document.createElement('div')
    body.className = 'lira-pin-body'
    body.textContent = "You'll lose this chat history and start fresh. This can't be undone."
    modal.appendChild(body)

    const buttons = document.createElement('div')
    buttons.className = 'lira-pin-buttons'

    const cancel = document.createElement('button')
    cancel.className = 'lira-card-btn secondary'
    cancel.textContent = 'Cancel'
    cancel.onclick = () => this.dismissClearConfirm()
    buttons.appendChild(cancel)

    const confirmBtn = document.createElement('button')
    confirmBtn.className = 'lira-card-btn danger'
    confirmBtn.textContent = 'Clear conversation'
    confirmBtn.onclick = () => {
      this.showClearConfirm = false
      this.startNewConversation()
    }
    buttons.appendChild(confirmBtn)

    modal.appendChild(buttons)
    backdrop.appendChild(modal)
    return backdrop
  }

  private dismissClearConfirm(): void {
    this.showClearConfirm = false
    this.render()
  }

  private buildPinModalEl(): HTMLElement {
    const prompt = this.pinPrompt!
    const backdrop = document.createElement('div')
    backdrop.className = 'lira-pin-backdrop'
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) this.cancelPinModal()
    })

    const modal = document.createElement('div')
    modal.className = 'lira-pin-modal'
    modal.addEventListener('click', (e) => e.stopPropagation())

    const title = document.createElement('div')
    title.className = 'lira-pin-title'
    title.textContent = `Confirm: ${prompt.label}`
    modal.appendChild(title)

    const body = document.createElement('div')
    body.className = 'lira-pin-body'
    body.textContent = 'Enter your 4-digit PIN to authorize this action.'
    modal.appendChild(body)

    if (prompt.hint) {
      const hint = document.createElement('div')
      hint.className = 'lira-pin-hint'
      hint.textContent = prompt.hint
      modal.appendChild(hint)
    }

    const input = document.createElement('input')
    input.type = 'password'
    input.inputMode = 'numeric'
    input.autocomplete = 'one-time-code'
    input.maxLength = 4
    input.className = 'lira-pin-input'
    input.placeholder = '••••'
    setTimeout(() => input.focus(), 0)
    modal.appendChild(input)

    if (this.pinError) {
      const err = document.createElement('div')
      err.className = 'lira-pin-error'
      err.textContent = this.pinError
      modal.appendChild(err)
    }

    const buttons = document.createElement('div')
    buttons.className = 'lira-pin-buttons'

    const cancel = document.createElement('button')
    cancel.className = 'lira-card-btn secondary'
    cancel.textContent = 'Cancel'
    cancel.onclick = () => this.cancelPinModal()
    buttons.appendChild(cancel)

    const submit = document.createElement('button')
    submit.className = 'lira-card-btn primary'
    submit.textContent = 'Authorize'
    const doSubmit = () => {
      const pin = input.value.trim()
      if (pin.length < 4) {
        this.pinError = 'Enter all 4 digits.'
        this.render()
        return
      }
      this.submitPin(pin)
    }
    submit.onclick = doSubmit
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSubmit()
    })
    buttons.appendChild(submit)
    modal.appendChild(buttons)

    backdrop.appendChild(modal)
    return backdrop
  }

  private submitPin(pin: string): void {
    const prompt = this.pinPrompt
    if (!prompt) return
    const payload = {
      type: 'pin_response' as const,
      action_id: prompt.action_id,
      pin,
    }
    if (prompt.via === 'voice') {
      this.currentVoiceCall?.sendJson(payload)
    } else {
      this.socket?.send(payload)
    }
    this.pinPrompt = null
    this.pinError = null
    this.render()
  }

  private cancelPinModal(): void {
    const prompt = this.pinPrompt
    if (!prompt) return
    const payload = {
      type: 'pin_cancel' as const,
      action_id: prompt.action_id,
    }
    if (prompt.via === 'voice') {
      this.currentVoiceCall?.sendJson(payload)
    } else {
      this.socket?.send(payload)
    }
    this.pinPrompt = null
    this.pinError = null
    this.render()
  }

  private respondToConfirm(msg: ChatMessage, approved: boolean): void {
    if (!msg.confirm || msg.confirm.resolved) return
    msg.confirm.resolved = approved ? 'approved' : 'declined'
    this.socket?.send({
      type: 'confirm_response',
      pending_id: msg.confirm.pending_id,
      approved,
    })
    this.render()
  }

  private handleCardButtonClick(action: string): void {
    // Convention: actions starting with `open:` open the URL in a new tab.
    if (action.startsWith('open:')) {
      try {
        window.open(action.slice(5), '_blank', 'noopener')
      } catch {
        /* blocked */
      }
      return
    }
    // Otherwise: send the action back as a customer message so the agent can react.
    this.socket?.send({ type: 'message', body: action })
  }

  /**
   * Show a small in-widget confirm modal before clearing the chat. If
   * there's nothing to clear (no messages, or only the synthetic greeting),
   * skip the prompt and clear immediately so we don't annoy fresh users.
   * The modal itself is rendered by renderChat() via showClearConfirm flag.
   */
  private confirmStartNewConversation(): void {
    const synthetic = new Set(['greeting', 'server_welcome'])
    const real = this.messages.filter((m) => !synthetic.has(m.id))
    if (real.length === 0) {
      this.startNewConversation()
      return
    }
    this.showClearConfirm = true
    this.render()
  }

  /**
   * Bridge for the SDK action layer: when an `@liraintelligence/support`-registered
   * action runs on the host page, we forward the outcome to the backend so
   * the next agent turn knows whether `billing.open_checkout` succeeded,
   * what data the customer's handler returned, etc. Best-effort: silent
   * if the socket isn't connected (e.g. action fired before chat opened).
   */
  public sendCustomerActionResult(detail: {
    actionName: string
    actionType: string
    target?: string
    ok: boolean
    message?: string
    data?: Record<string, unknown>
  }): void {
    this.socket?.send({ type: 'customer_action_result', ...detail })
  }

  private startNewConversation(): void {
    this.socket?.disconnect()
    this.socket = null
    this.messages = []
    this.convId = null
    this.setTyping(false)
    this.isResolved = false
    this.isEscalated = false
    this.lastCustomerPrompt = ''
    this.csatSubmitted = false
    this.seenMessageIds.clear()
    this.stopPolling()
    this.wipeStoredMessages()
    this.forceNewCase = true
    // Re-open fresh (will reconnect socket and add greeting)
    this.open()
  }

  private startFreshDemoConversationIfNeeded(status?: string): boolean {
    if (this.config.ephemeral !== true || this.demoFreshCaseStarted || status !== 'escalated') {
      return false
    }
    this.demoFreshCaseStarted = true
    setTimeout(() => this.startNewConversation(), 0)
    return true
  }

  /**
   * Programmatically open the chat panel. Public — can be called from
   * `window.LiraWidget.open()` or via the SDK `Lira.open()` shortcut.
   * If a pre-chat form is required, that's shown instead of jumping
   * straight to the conversation.
   */
  open(): void {
    // Show pre-chat form if enabled AND visitor hasn't provided identity yet
    const needsPreChat =
      this.config.preChatFormEnabled &&
      !this.config.visitorEmail &&
      !this.config.visitorName &&
      this.messages.length === 0

    if (needsPreChat) {
      this.view = 'pre-chat'
      this.render()
      this.dispatchLifecycle('open')
      return
    }

    this.view = 'chat'
    this.unreadCount = 0
    if (this.convId) this.startPolling()

    // Chat path: legacy WidgetSocket directly to Fastify's
    // `/lira/v1/support/chat/ws/:orgId`. The Pipecat chat experiment was
    // deprecated on 2026-05-23 — `lira-support-agent.service.ts` already
    // does streaming, tools, HITL, history, demo mode, and escalation
    // in-process with the chat WS, so there was no benefit to routing
    // through a separate Python service. The `pipecatChat` field is kept
    // only to safely tear down any historical in-memory session shape; new
    // chat sessions always use the legacy support WS.
    if (!this.socket && !this.pipecatChat) {
      this.socket = new WidgetSocket(
        this.config,
        this.visitorId,
        this.forceNewCase,
        (msg) => this.handleIncoming(msg),
        (_status) => {
          // Could show connection status indicator
        }
      )
      this.forceNewCase = false
      this.socket.connect()
      if (this.latestRuntimeContext) this.sendRuntimeContext(this.latestRuntimeContext)

      // Add greeting message — unless this embed shows the first-visit
      // hero welcome view (which IS the greeting, designed to look like a
      // landing rather than a chat bubble). Pushing the greeting here
      // would make messages.length > 0 and suppress the hero.
      if (this.messages.length === 0 && this.config.greeting && !this.config.autoOpenFirstVisit) {
        this.messages.push({
          id: 'greeting',
          role: 'lira',
          body: this.config.greeting,
          timestamp: new Date().toISOString(),
        })
      }
    }

    this.render()
    this.dispatchLifecycle('open')
  }

  /**
   * Programmatically close the chat panel. Public — can be called from
   * `window.LiraWidget.close()` or via the SDK `Lira.close()` shortcut.
   * Fullscreen embeds (mountSupportPage) treat this as "go back to the
   * main chat view" rather than closing the surface entirely, since the
   * surface is the customer's own container.
   */
  close(): void {
    if (this.isFullscreen()) {
      this.view = 'chat'
      this.render()
      return
    }
    this.view = 'launcher'
    this.chatAnimPlayed = false
    // Mark dismissed for auto-open embeds so we never auto-pop again on
    // this browser+org. No-op for embeds that didn't opt into autoOpen.
    if (this.config.autoOpenFirstVisit) this.markDismissed()
    this.render()
    this.dispatchLifecycle('close')
  }

  /**
   * Flip between open and closed. Convenience for "Need help?" buttons
   * a customer hangs off their own UI.
   */
  toggle(): void {
    if (this.view === 'launcher') {
      this.open()
    } else {
      this.close()
    }
  }

  /**
   * Open the chat and prefill the composer with `preloadText`. Mirrors
   * Intercom's `showNewMessage(text)`. Useful for "Contact us about X"
   * links that should land the visitor in chat with a head start.
   */
  showNewMessage(preloadText?: string): void {
    this.open()
    if (preloadText && this.inputEl) {
      this.inputEl.value = preloadText
      this.inputEl.dispatchEvent(new Event('input', { bubbles: true }))
      this.inputEl.focus()
    }
  }

  /**
   * Best-effort lifecycle event dispatcher. Host pages can listen with
   * window.addEventListener('lira:open', ...) etc. for analytics, badges,
   * or to coordinate with their own UI. Detail carries the org id so
   * multi-widget hosts can disambiguate.
   */
  private dispatchLifecycle(
    event: 'open' | 'close' | 'unread_count' | 'message',
    detail?: Record<string, unknown>
  ): void {
    try {
      window.dispatchEvent(
        new CustomEvent(`lira:${event}`, {
          detail: { orgId: this.config.orgId, ...(detail ?? {}) },
        })
      )
    } catch {
      /* CustomEvent unavailable on very old runtimes — silently no-op */
    }
  }

  /** localStorage key for the "user dismissed the auto-open widget" flag.
   *  Scoped per orgId so multi-widget hosts don't conflict. */
  private dismissedStorageKey(): string {
    return `lira_widget_dismissed_${this.config.orgId}`
  }

  private hasBeenDismissed(): boolean {
    try {
      return localStorage.getItem(this.dismissedStorageKey()) === '1'
    } catch {
      // Private mode / storage blocked. Treat as "not dismissed" so the
      // user still sees the auto-open behavior; we just lose persistence
      // (it'll re-pop on every load, which is the safer failure mode).
      return false
    }
  }

  private markDismissed(): void {
    try {
      localStorage.setItem(this.dismissedStorageKey(), '1')
    } catch {
      /* storage blocked - silently ignore */
    }
  }

  private sendMessage(): void {
    const body = this.inputEl?.value.trim()
    if (!body) return
    this.lastCustomerPrompt = body

    // Clear input early so the UI feels instant. Re-focus the textarea so
    // we stay in the :focus state — otherwise the click moves focus to the
    // send button, which fires the 150ms border/background transition and
    // reads as a flicker right under the user's eye.
    if (this.inputEl) {
      this.inputEl.value = ''
      this.inputEl.style.height = 'auto'
      this.inputEl.focus()
    }

    // Clear any suggestion chips from the previous reply now that the user
    // has spoken. The server will emit a fresh set with the next reply.
    if (this.activeSuggestions.length > 0) {
      this.activeSuggestions = []
      this.updateSuggestionsRow()
    }

    // GLITCH FIX (2026-05-23): use appendChatMessage instead of pushing to
    // this.messages + this.render(). The full render() nukes the entire
    // shadow DOM (header, messages, input, everything) and rebuilds it,
    // causing a visible flicker + input focus loss every time the user
    // sends a message. appendChatMessage just appends one bubble node to
    // messagesEl — no rebuild, no flicker, focus stays where it was.

    // Re-notify intercept — only active after escalation
    if (this.isEscalated && body.toLowerCase() === 'still waiting?') {
      this.appendChatMessage({
        id: `local_${Date.now()}`,
        role: 'customer',
        body,
        timestamp: new Date().toISOString(),
      })

      if (this.reNotifyCount < 3) {
        this.reNotifyCount++
        // Send to backend so the assigned agent sees a new message and gets re-alerted
        this.socket?.send({
          type: 'message',
          body,
          name: this.config.visitorName,
          email: this.config.visitorEmail,
        })
        this.appendChatMessage({
          id: `renotify_${Date.now()}`,
          role: 'system',
          body: 'Got it. The team has been notified again.',
          timestamp: new Date().toISOString(),
        })
      } else {
        // 4th+ attempt — soft block, no additional WS spam
        this.appendChatMessage({
          id: `renotify_max_${Date.now()}`,
          role: 'system',
          body: 'The team has already been notified. They will get back to you as soon as possible.',
          timestamp: new Date().toISOString(),
        })
      }

      return
    }

    // Normal message flow
    this.appendChatMessage({
      id: `local_${Date.now()}`,
      role: 'customer',
      body,
      timestamp: new Date().toISOString(),
    })

    // Send via the chat transport.
    if (this.pipecatChat) {
      void this.pipecatChat.appendUserMessage(body)
    } else {
      this.socket?.send({
        type: 'message',
        body,
        name: this.config.visitorName,
        email: this.config.visitorEmail,
      })
    }
  }

  private handleIncoming(msg: IncomingWsMessage): void {
    // Always capture conv_id when the server provides it
    if (msg.conv_id) {
      this.convId = msg.conv_id
      if (!this.isResolved) this.startPolling()
    }
    // 'escalated' no longer locks the widget — the AI never hands the live chat
    // to a human. Escalation opens an async ticket; the chat stays AI-driven.
    if (msg.status === 'resolved') this.isResolved = true

    switch (msg.type) {
      case 'typing':
        // Surgical DOM update — show the typing indicator inline instead of
        // re-rendering the entire chat panel (which caused visible flicker
        // every time Lira started typing). State flag is kept in sync for
        // the case where a real render() does fire later (e.g. on view
        // change).
        this.setTyping(true)
        break

      case 'reply_start': {
        // Reserve the streaming id, but DO NOT create an empty bubble yet —
        // doing so swaps the typing dots out for a near-zero-height empty
        // bubble, which reads as a flicker. Keep the dots showing until the
        // first reply_chunk arrives; that's when we hide the dots AND insert
        // the bubble with real content in the same DOM frame.
        const id = msg.message_id ?? `lira_${Date.now()}`
        this.streamingMessageId = id
        this.seenMessageIds.add(id)
        break
      }

      case 'reply_chunk': {
        // Append delta to the active streaming message. Direct DOM update
        // to avoid re-rendering the whole widget on every token.
        if (!msg.body) break
        // First chunk: hide the typing dots and create the bubble with the
        // first chunk already inside it. Single-frame swap, no flicker.
        if (this.streamingMessageId && !this.streamingBubbleEl) {
          this.setTyping(false)
          this.appendChatMessage({
            id: this.streamingMessageId,
            role: 'lira',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
          const bubbles = this.messagesEl?.querySelectorAll<HTMLElement>('.lira-msg.lira') ?? []
          this.streamingBubbleEl = bubbles.length > 0 ? bubbles[bubbles.length - 1] : null
          if (this.view === 'launcher') {
            this.unreadCount++
            this.dispatchLifecycle('unread_count', { count: this.unreadCount })
          }
          break
        }
        const activeMsg = this.messages.find((m) => m.id === this.streamingMessageId)
        if (activeMsg) activeMsg.body += msg.body
        if (this.streamingBubbleEl) {
          this.renderMessageBody(this.streamingBubbleEl, {
            id: this.streamingMessageId ?? `lira_${Date.now()}`,
            role: 'lira',
            body: activeMsg?.body ?? this.streamingBubbleEl.textContent + msg.body,
            timestamp: new Date().toISOString(),
          })
          // Keep pinned to bottom while streaming
          if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight
        }
        if (this.view === 'launcher') {
          this.unreadCount++
          this.dispatchLifecycle('unread_count', { count: this.unreadCount })
        }
        break
      }

      case 'reply_end': {
        // Persist the finalized message and clear streaming refs. Also clear
        // typing dots — they'd already be hidden on first chunk, but if the
        // server emitted reply_start+reply_end without any chunks (edge case)
        // we don't want orphaned dots stuck on screen.
        // If the server sent a corrected body (boilerplate closer stripped
        // post-stream), overwrite the streamed text in-place so the user
        // doesn't see the dropped sentence stuck in the bubble.
        if (typeof msg.body === 'string' && this.streamingMessageId) {
          const activeMsg = this.messages.find((m) => m.id === this.streamingMessageId)
          if (activeMsg) activeMsg.body = msg.body
          if (this.streamingBubbleEl) this.streamingBubbleEl.textContent = msg.body
        }
        this.setTyping(false)
        this.streamingMessageId = null
        this.streamingBubbleEl = null
        this.persistMessages()
        break
      }

      case 'history': {
        if (!Array.isArray(msg.messages)) break
        // Onboarding widget: if we deliberately started fresh (no local
        // messages on construct + autoOpen on), the server should NOT
        // resurrect a prior conversation. Drop server history when the
        // local view is intentionally empty and the visitor hasn't
        // typed anything yet — keeps the hero visible after a Clear or
        // a manual localStorage wipe.
        if (
          this.config.autoOpenFirstVisit &&
          this.messages.length === 0 &&
          msg.messages.length > 0
        ) {
          break
        }
        this.seenMessageIds.clear()
        this.messages = msg.messages.map((m) => ({
          id: m.id,
          role: m.role,
          body: m.body,
          timestamp: m.timestamp,
          sender_name: m.sender_name,
          sender_avatar: m.sender_avatar,
        }))
        for (const m of this.messages) this.seenMessageIds.add(m.id)
        // Never lock on escalated — the live chat is always AI-driven now.
        this.isEscalated = false
        this.isResolved = msg.status === 'resolved'
        this.lastPollTime = latestMessageTimestamp(this.messages)
        if (!this.isResolved && this.convId) this.startPolling()
        this.render()
        this.startFreshDemoConversationIfNeeded(msg.status)
        break
      }

      case 'reply':
        this.setTyping(false)
        if (msg.body) {
          this.appendChatMessage({
            id: `lira_${Date.now()}`,
            role: 'lira',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
          if (this.view === 'launcher') {
            this.unreadCount++
            this.dispatchLifecycle('unread_count', { count: this.unreadCount })
            this.updateLauncherBadge()
          }
        }
        break

      case 'agent_reply':
        // Direct WS push from agent replying in the Lira inbox
        this.setTyping(false)
        if (msg.body) {
          const id = `agent_ws_${Date.now()}`
          this.seenMessageIds.add(id)
          this.appendChatMessage({
            id,
            role: 'agent',
            body: msg.body,
            timestamp: new Date().toISOString(),
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
          })
          if (this.view === 'launcher') {
            this.unreadCount++
            this.dispatchLifecycle('unread_count', { count: this.unreadCount })
            this.updateLauncherBadge()
          }
        }
        break

      case 'proactive':
        // Agent initiated a new conversation proactively
        this.setTyping(false)
        if (msg.conv_id) {
          this.convId = msg.conv_id
        }
        if (msg.body) {
          const pid = `proactive_${Date.now()}`
          this.seenMessageIds.add(pid)
          this.appendChatMessage({
            id: pid,
            role: 'agent',
            body: msg.body,
            timestamp: new Date().toISOString(),
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
          })
        }
        this.isResolved = false
        if (this.view === 'launcher') {
          this.unreadCount++
          this.dispatchLifecycle('unread_count', { count: this.unreadCount })
          this.updateLauncherBadge()
        }
        break

      case 'escalated':
        // Legacy event — backend no longer sends this for widget chats (escalation
        // now opens an async ticket instead of handing off). Kept as a soft no-op
        // for old clients: show the message, but DO NOT lock the widget.
        this.setTyping(false)
        if (this.streamingMessageId) {
          this.messages = this.messages.filter(
            (m) => m.id !== this.streamingMessageId || m.body.trim().length > 0
          )
          this.streamingMessageId = null
          this.streamingBubbleEl = null
        }
        if (msg.body) {
          this.messages.push({
            id: `esc_${Date.now()}`,
            role: 'lira',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
        }
        this.startPolling()
        this.render()
        break

      case 'status':
        this.setTyping(false)
        if (msg.status === 'resolved') {
          this.stopPolling()
          this.isResolved = true
          this.messages.push({
            id: `resolved_${Date.now()}`,
            role: 'system',
            body: msg.body ?? 'This conversation has been resolved. Thank you for reaching out!',
            timestamp: new Date().toISOString(),
          })
          this.render()
          // Transition to CSAT after a brief pause
          setTimeout(() => {
            this.view = 'csat'
            this.render()
          }, 2500)
        } else if (msg.body) {
          // Non-resolved status with a body — e.g. a ticket-opened acknowledgement
          // ("I've opened ticket LIRA-XXXX..."). Show it as a system note. The
          // chat stays fully active; the AI keeps responding.
          this.messages.push({
            id: `status_${Date.now()}`,
            role: 'system',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
          this.render()
        }
        break

      case 'handback':
        // Agent handed conversation back to Lira AI
        this.setTyping(false)
        this.stopPolling()
        this.isResolved = false
        this.messages.push({
          id: `handback_${Date.now()}`,
          role: 'system',
          body:
            msg.body ?? "You're back with Lira. Feel free to continue — I'll pick up from here.",
          timestamp: new Date().toISOString(),
        })
        this.render()
        break

      case 'welcome':
        if (this.startFreshDemoConversationIfNeeded(msg.status)) break
        // If localStorage had an old conversation but the server did not resume
        // it, start a visually clean case. The old record remains in the inbox.
        if (!msg.conv_id && this.convId && this.messages.length > 0) {
          this.stopPolling()
          this.convId = null
          this.messages = []
          this.seenMessageIds.clear()
          this.isResolved = false
          this.isEscalated = false
          this.wipeStoredMessages()
        }
        // Skip the server-emitted welcome bubble when we're showing the
        // first-visit hero. The hero IS the greeting; an extra "Hi! How
        // can we help" bubble would make messages.length > 0 and dismiss
        // the hero on first render.
        if (msg.body && this.messages[0]?.id !== 'greeting' && !this.config.autoOpenFirstVisit) {
          this.messages.unshift({
            id: 'server_welcome',
            role: 'lira',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
          this.render()
        }
        break

      case 'error':
        this.setTyping(false)
        this.appendChatMessage({
          id: `err_${Date.now()}`,
          role: 'lira',
          body: msg.body ?? 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        })
        break

      case 'card': {
        // Generative UI card from a tool result.
        this.setTyping(false)
        this.appendChatMessage({
          id: `card_${Date.now()}`,
          role: 'lira',
          body: '',
          timestamp: new Date().toISOString(),
          card: {
            title: msg.title,
            body: msg.body,
            fields: msg.fields,
            badge: msg.badge,
            buttons: msg.buttons,
          },
        })
        if (this.view === 'launcher') {
          this.unreadCount++
          this.dispatchLifecycle('unread_count', { count: this.unreadCount })
        }
        break
      }

      case 'confirm': {
        // HITL prompt — render Approve/Cancel buttons.
        this.setTyping(false)
        if (!msg.pending_id || !msg.tool_name) break
        this.appendChatMessage({
          id: `confirm_${msg.pending_id}`,
          role: 'lira',
          body: '',
          timestamp: new Date().toISOString(),
          confirm: {
            pending_id: msg.pending_id,
            tool_name: msg.tool_name,
            title: msg.title ?? 'Confirm action',
            body: msg.body ?? 'Proceed?',
          },
        })
        if (this.view === 'launcher') {
          this.unreadCount++
          this.dispatchLifecycle('unread_count', { count: this.unreadCount })
        }
        break
      }

      case 'action_result': {
        // Tool call results are internal plumbing — not shown to the customer.
        break
      }

      case 'navigate': {
        if (!msg.url) break
        // First, give the host page a chance to handle the navigation via
        // a cancelable CustomEvent. The Lira admin dashboard listens for
        // this and routes through React Router (SPA nav, widget persists).
        // If no listener calls preventDefault, fall back to window.open —
        // which is what production customer embeds want.
        try {
          const evt = new CustomEvent('lira-host-navigate', {
            detail: { url: msg.url, target: msg.target ?? '_self' },
            cancelable: true,
          })
          window.dispatchEvent(evt)
          if (evt.defaultPrevented) break
        } catch {
          /* CustomEvent unavailable — fall through to window.open */
        }
        try {
          window.open(msg.url, msg.target ?? '_blank', 'noopener')
        } catch {
          /* popup blocked */
        }
        break
      }

      case 'demo_action_executed': {
        // Demo-only: the AI agent simulated an account change (plan upgrade,
        // card update, etc.). Forward to the host page via a CustomEvent so
        // the React dashboard can call updateDemoProfile() and re-render.
        // Real customer embeds will never receive this — the server only
        // sends it from demo-org tool calls.
        if (msg.action_type) {
          try {
            window.dispatchEvent(
              new CustomEvent('lira-demo-action', {
                detail: { type: msg.action_type, payload: msg.payload ?? {} },
              })
            )
          } catch {
            /* ignore */
          }
        }
        break
      }

      // ── Action lifecycle ──────────────────────────────────────────
      // The dispatcher fires these for async tools so the user can see
      // progress in the chat (independent of what voice is saying).
      // Each event carries an action_id; the same in-transcript message
      // bubble updates in place as the action moves pending → final.
      case 'action_started': {
        if (!msg.action_id || !msg.tool_name) break
        this.appendChatMessage({
          id: `action_${msg.action_id}`,
          role: 'system',
          body: '',
          timestamp: new Date().toISOString(),
          action: {
            action_id: msg.action_id,
            tool_name: msg.tool_name,
            label: msg.label ?? msg.tool_name,
            icon: msg.icon,
            status: 'pending',
          },
        })
        break
      }
      case 'action_completed': {
        if (!msg.action_id) break
        this.updateActionCard(msg.action_id, {
          status: 'success',
          detail: msg.summary ?? undefined,
        })
        break
      }
      case 'action_failed': {
        if (!msg.action_id) break
        this.updateActionCard(msg.action_id, {
          status: 'failed',
          error: msg.error ?? 'Action failed.',
        })
        break
      }
      case 'pin_required': {
        // Server is asking for PIN entry before a sensitive tool runs.
        // Store + render modal. The modal sends pin_response back over WS.
        // This case fires only for CHAT-originated tools (the chat WS
        // delivers this branch). Voice-originated PIN prompts arrive via
        // the lira-voice-widget-event CustomEvent set up in the
        // constructor, which sets via='voice'.
        if (!msg.action_id || !msg.tool_name) break
        this.pinPrompt = {
          action_id: msg.action_id,
          tool_name: msg.tool_name,
          label: msg.label ?? msg.tool_name,
          hint: msg.hint,
          via: 'chat',
        }
        this.render()
        break
      }
      case 'suggestions': {
        // Update the active suggestion-chip set and re-render the chip
        // row below the messages. New customer message clears them in
        // sendMessage(). Surgical DOM update via updateSuggestionsRow()
        // avoids a full re-render that would blink the chat.
        const next = Array.isArray(msg.suggestions) ? msg.suggestions : []
        this.activeSuggestions = this.normalizeServerSuggestions(next)
          .map((s) => String(s ?? '').trim())
          .filter((s) => s.length > 0)
          .slice(0, 4)
        this.updateSuggestionsRow()
        break
      }
      case 'lira_action': {
        // Server-emitted UI action for the host page to perform —
        // prefill an input, click a button, etc. The widget itself
        // doesn't know how to resolve `target` (it's React state),
        // so we forward as a CustomEvent the host listens for.
        // Production embeds without a listener silently no-op, which
        // is the correct fail-safe.
        if (!msg.action_type) break
        try {
          const detail = {
            action_type: msg.action_type,
            target: msg.target,
            value: msg.value,
            payload: msg.payload ?? {},
          }
          const event = new CustomEvent('lira:action', { detail })
          window.dispatchEvent(event)
          void runRegisteredLiraAction(detail, event)
        } catch {
          /* CustomEvent unavailable, ignore */
        }
        break
      }
    }
  }

  private updateActionCard(
    actionId: string,
    patch: { status: 'success' | 'failed'; detail?: string; error?: string }
  ): void {
    const idx = this.messages.findIndex((m) => m.action?.action_id === actionId)
    if (idx === -1) return
    const existing = this.messages[idx]
    if (!existing.action) return
    const updatedAction = { ...existing.action, ...patch }
    this.messages[idx] = { ...existing, action: updatedAction }
    this.persistMessages()
    // Surgical DOM swap — replace just the action card element instead of
    // re-rendering the entire chat panel (caused flicker on every action
    // success/fail event during tool execution).
    if (this.messagesEl) {
      const oldEl = this.messagesEl.querySelector(
        `[data-action-id="${actionId}"]`
      ) as HTMLElement | null
      if (oldEl) {
        const newEl = this.buildActionEl(updatedAction)
        oldEl.replaceWith(newEl)
      }
    }
  }

  private submitCsat(score: number): void {
    this.csatSubmitted = true
    // Send CSAT via WebSocket (the server maps it)
    this.socket?.send({ type: 'end', body: String(score) })
    this.render()
  }

  // ── Polling (fallback when WS push misses) ────────────────────────────────

  private startPolling(): void {
    if (this.pollInterval || !this.convId) return

    this.pollInterval = setInterval(async () => {
      if (!this.convId) return
      try {
        const params = this.lastPollTime ? `?since=${encodeURIComponent(this.lastPollTime)}` : ''
        const res = await fetch(
          `https://api.creovine.com/lira/v1/support/chat/messages/${this.config.orgId}/${this.convId}${params}`
        )
        if (!res.ok) return
        const data = (await res.json()) as {
          messages?: Array<{
            id: string
            role: string
            body: string
            timestamp: string
            sender_name?: string
            sender_avatar?: string
          }>
        }
        if (!Array.isArray(data.messages) || data.messages.length === 0) return

        let unreadBumped = false
        for (const m of data.messages) {
          if (!this.seenMessageIds.has(m.id)) {
            this.seenMessageIds.add(m.id)
            const role = ['customer', 'lira', 'agent', 'system'].includes(m.role)
              ? (m.role as ChatMessage['role'])
              : 'agent'
            this.appendChatMessage({
              id: m.id,
              role,
              body: m.body,
              timestamp: m.timestamp,
              sender_name: m.sender_name,
              sender_avatar: m.sender_avatar,
            })
            if (this.view === 'launcher') {
              this.unreadCount++
              this.dispatchLifecycle('unread_count', { count: this.unreadCount })
              unreadBumped = true
            }
          }
        }
        this.lastPollTime =
          latestMessageTimestamp([
            ...this.messages,
            ...data.messages.map((m) => ({
              id: m.id,
              role: ['customer', 'lira', 'agent', 'system'].includes(m.role)
                ? (m.role as ChatMessage['role'])
                : ('agent' as const),
              body: m.body,
              timestamp: m.timestamp,
              sender_name: m.sender_name,
              sender_avatar: m.sender_avatar,
            })),
          ]) ?? new Date().toISOString()
        if (unreadBumped) this.updateLauncherBadge()
      } catch {
        // ignore fetch errors — will retry next interval
      }
    }, 5_000)
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  destroy(): void {
    this.stopPolling()
    this.endVoiceCall()
    this.socket?.disconnect()
    window.removeEventListener(LIRA_RUNTIME_CONTEXT_EVENT, this.runtimeContextHandler)
    this.host.remove()
  }

  private sendRuntimeContext(context: LiraRuntimeContext): void {
    this.socket?.send({
      type: 'context_update',
      context: context as unknown as Record<string, unknown>,
    })
  }
}

// ── Auto-init from script tag ─────────────────────────────────────────────────

// Capture at the TOP LEVEL during synchronous script execution.
// document.currentScript is null inside callbacks, DOMContentLoaded listeners,
// and after the script's top-level code finishes — so we must grab it here.
const _currentScript = document.currentScript as HTMLScriptElement | null

function readConfigFromScript(el: HTMLScriptElement): WidgetConfig | null {
  const orgId = el.dataset.orgId
  if (!orgId) return null
  return {
    orgId,
    mode: el.dataset.mode === 'fullscreen' ? 'fullscreen' : 'bubble',
    target: el.dataset.target,
    position: (el.dataset.position as WidgetConfig['position']) ?? 'bottom-right',
    primaryColor: el.dataset.color ?? '#1A1A1A',
    greeting: el.dataset.greeting ?? 'Hi! How can we help you today?',
    orgName: el.dataset.title ?? undefined,
    logoUrl: el.dataset.logo ?? undefined,
    visitorEmail: el.dataset.email,
    visitorName: el.dataset.name,
    visitorSig: el.dataset.sig,
    // Opt-in ephemeral storage — our Nimbus demo embed sets this; real
    // customer embeds never do, so their behavior is unchanged.
    ephemeral: el.dataset.ephemeral === 'true',
    // Demo only: base64-encoded JSON snapshot of the visitor's local
    // dashboard state. Decoded here, sent to the server over WS at connect.
    demoContext: parseDemoContext(el.dataset.demoContext),
    // Opt-in auto-open behavior. When `data-auto-open-first-visit="true"`,
    // the widget pops on first page load and stays open across reloads
    // until the visitor explicitly closes it. The dashboard embed turns
    // this on so new customers see the onboarding widget; production
    // customer embeds leave it off.
    autoOpenFirstVisit: el.dataset.autoOpenFirstVisit === 'true',
  }
}

function parseDemoContext(raw: string | undefined): Record<string, unknown> | undefined {
  if (!raw) return undefined
  try {
    const json = atob(raw)
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
  } catch {
    /* ignore malformed demo context */
  }
  return undefined
}

type LiraVisitorIdentity = {
  /** Visitor email. Pass `null` to clear (logout this field); omit to preserve. */
  email?: string | null
  /** Visitor display name. Pass `null` to clear; omit to preserve. */
  name?: string | null
  /** HMAC-SHA256 signature of email, computed server-side. Pass `null` to clear; omit to preserve. */
  sig?: string | null
}

type LiraActionRequest = {
  actionType: string
  target?: string
  value?: unknown
  payload: Record<string, unknown>
  rawEvent: CustomEvent
}

type LiraActionResult = {
  ok: boolean
  message?: string
  data?: Record<string, unknown>
}

type LiraActionHandler = (
  request: LiraActionRequest
) => Promise<LiraActionResult | void> | LiraActionResult | void

type LiraPublicApi = {
  init: (config: Partial<WidgetConfig>) => LiraPublicApi
  identify: (visitor: LiraVisitorIdentity) => LiraPublicApi
  /**
   * Clears any logged-in identity on this device and rotates the anonymous
   * chat scope so the next visitor starts with a clean history. Call this
   * from your app's logout handler.
   */
  logout: () => LiraPublicApi
  setContext: (context: Record<string, unknown>) => LiraPublicApi
  track: (eventName: string, payload?: Record<string, unknown>) => LiraPublicApi
  registerAction: (name: string, handler: LiraActionHandler) => LiraPublicApi
  unregisterAction: (name: string) => LiraPublicApi
  /** Programmatically open the chat from the host's own UI (e.g. a "Need help?" button). */
  open: () => LiraPublicApi
  /** Programmatically close the chat. */
  close: () => LiraPublicApi
  /** Flip between open and closed. */
  toggle: () => LiraPublicApi
  /**
   * Open the chat with the composer prefilled. Useful for "Contact us
   * about <feature>" links that should land the visitor mid-thought.
   */
  showNewMessage: (preloadText?: string) => LiraPublicApi
  mountWidget: (config?: Partial<WidgetConfig>) => LiraSupportWidget
  mountSupportPage: (
    target: string | HTMLElement,
    config?: Partial<WidgetConfig>
  ) => LiraSupportWidget
  destroy: () => void
}

type LiraWindow = Window &
  typeof globalThis & {
    Lira?: LiraPublicApi
    LiraWidget?: LiraSupportWidget
    LiraWidgetConfig?: Partial<WidgetConfig>
    __LIRA_RUNTIME_CONTEXT__?: Record<string, unknown>
  }

const liraWindow = window as LiraWindow
let sdkConfig: Partial<WidgetConfig> = {}
let sdkWidget: LiraSupportWidget | null = null
const sdkActionRegistry = new Map<string, LiraActionHandler>()

function assertWidgetConfig(config: Partial<WidgetConfig>): WidgetConfig {
  if (!config.orgId) {
    throw new Error('[Lira SDK] orgId is required before mounting support.')
  }
  return config as WidgetConfig
}

function setMountedWidget(widget: LiraSupportWidget): LiraSupportWidget {
  sdkWidget = widget
  liraWindow.LiraWidget = widget
  return widget
}

function destroyMountedWidget(): void {
  sdkWidget?.destroy()
  sdkWidget = null
  delete liraWindow.LiraWidget
}

async function runRegisteredLiraAction(
  detail: {
    action_type: string
    target?: string
    value?: unknown
    payload?: Record<string, unknown>
  },
  rawEvent: CustomEvent
): Promise<void> {
  const handler =
    sdkActionRegistry.get(detail.action_type) ?? sdkActionRegistry.get(detail.target ?? '')
  if (!handler) return

  const request: LiraActionRequest = {
    actionType: detail.action_type,
    target: detail.target,
    value: detail.value,
    payload: detail.payload ?? {},
    rawEvent,
  }

  const emitResult = (resultDetail: {
    actionName: string
    actionType: string
    target?: string
    ok: boolean
    message?: string
    data: Record<string, unknown>
  }) => {
    window.dispatchEvent(new CustomEvent('lira:action_result', { detail: resultDetail }))
    // Forward to backend so the agent can reason about action outcomes on
    // the next turn (e.g. "I see checkout opened successfully; let me know
    // if you hit any issues there").
    sdkWidget?.sendCustomerActionResult(resultDetail)
  }

  try {
    const result = (await handler(request)) ?? { ok: true }
    emitResult({
      actionName: detail.target ?? detail.action_type,
      actionType: detail.action_type,
      target: detail.target,
      ok: result.ok,
      message: result.message,
      data: result.data ?? {},
    })
  } catch (error) {
    emitResult({
      actionName: detail.target ?? detail.action_type,
      actionType: detail.action_type,
      target: detail.target,
      ok: false,
      message: error instanceof Error ? error.message : 'Action failed',
      data: {},
    })
  }
}

const Lira: LiraPublicApi = {
  init(config: Partial<WidgetConfig>): LiraPublicApi {
    sdkConfig = { ...sdkConfig, ...config }
    sdkWidget?.configure(sdkConfig)
    return Lira
  },

  identify(visitor: LiraVisitorIdentity): LiraPublicApi {
    // Explicit `null` means "clear this field" (treated as logout for that
    // dimension). Missing keys preserve whatever was there before. Empty
    // string is treated the same as null — clears.
    const next = (
      cur: string | null | undefined,
      incoming: string | null | undefined
    ): string | undefined => {
      if (incoming === undefined) return cur ?? undefined
      if (incoming === null || incoming === '') return undefined
      return incoming
    }
    sdkConfig = {
      ...sdkConfig,
      visitorEmail: next(sdkConfig.visitorEmail, visitor.email),
      visitorName: next(sdkConfig.visitorName, visitor.name),
      visitorSig: next(sdkConfig.visitorSig, visitor.sig),
    }
    sdkWidget?.configure(sdkConfig)
    return Lira
  },

  logout(): LiraPublicApi {
    sdkConfig = {
      ...sdkConfig,
      visitorEmail: undefined,
      visitorName: undefined,
      visitorSig: undefined,
    }
    sdkWidget?.configure(sdkConfig)
    return Lira
  },

  open(): LiraPublicApi {
    sdkWidget?.open()
    return Lira
  },

  close(): LiraPublicApi {
    sdkWidget?.close()
    return Lira
  },

  toggle(): LiraPublicApi {
    sdkWidget?.toggle()
    return Lira
  },

  showNewMessage(preloadText?: string): LiraPublicApi {
    sdkWidget?.showNewMessage(preloadText)
    return Lira
  },

  setContext(context: Record<string, unknown>): LiraPublicApi {
    liraWindow.__LIRA_RUNTIME_CONTEXT__ = context
    window.dispatchEvent(
      new CustomEvent(LIRA_RUNTIME_CONTEXT_EVENT, {
        detail: { context },
      })
    )
    return Lira
  },

  track(eventName: string, payload?: Record<string, unknown>): LiraPublicApi {
    window.dispatchEvent(
      new CustomEvent('lira:track', {
        detail: { eventName, payload: payload ?? {} },
      })
    )
    return Lira
  },

  registerAction(name: string, handler: LiraActionHandler): LiraPublicApi {
    sdkActionRegistry.set(name, handler)
    return Lira
  },

  unregisterAction(name: string): LiraPublicApi {
    sdkActionRegistry.delete(name)
    return Lira
  },

  mountWidget(config: Partial<WidgetConfig> = {}): LiraSupportWidget {
    destroyMountedWidget()
    sdkConfig = { ...sdkConfig, ...config, mode: 'bubble' }
    return setMountedWidget(new LiraSupportWidget(assertWidgetConfig(sdkConfig)))
  },

  mountSupportPage(
    target: string | HTMLElement,
    config: Partial<WidgetConfig> = {}
  ): LiraSupportWidget {
    destroyMountedWidget()
    sdkConfig = { ...sdkConfig, ...config, target, mode: 'fullscreen' }
    return setMountedWidget(new LiraSupportWidget(assertWidgetConfig(sdkConfig)))
  },

  destroy(): void {
    destroyMountedWidget()
  },
}

liraWindow.Lira = Lira

function mountFromConfig(config: Partial<WidgetConfig>): void {
  sdkConfig = { ...sdkConfig, ...config }
  if (sdkConfig.mode === 'fullscreen') {
    Lira.mountSupportPage(sdkConfig.target ?? 'body', sdkConfig)
  } else {
    Lira.mountWidget(sdkConfig)
  }
}

function autoInit(): void {
  // Priority 1: window.LiraWidgetConfig (Intercom/Chatwoot-style pre-configuration)
  // Allows: <script>window.LiraWidgetConfig = { orgId: '...' };</script>
  //         <script async src=".../widget.js"></script>
  const windowConfig = liraWindow.LiraWidgetConfig
  if (windowConfig?.orgId) {
    mountFromConfig(windowConfig)
    return
  }

  // Priority 2: data-* attributes on the script tag (captured at top level)
  if (_currentScript) {
    const config = readConfigFromScript(_currentScript)
    if (config) {
      mountFromConfig(config)
      return
    }
  }

  // Priority 3: Find any script tag with our src and data-org-id as a fallback.
  // Covers async/defer/cached scenarios where document.currentScript was null.
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src*="widget.liraintelligence.com"][data-org-id], script[src*="widget.js"][data-org-id]'
  )
  for (const el of scripts) {
    const config = readConfigFromScript(el)
    if (config) {
      mountFromConfig(config)
      return
    }
  }
}

// Run on DOMContentLoaded if DOM isn't ready, otherwise immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit)
} else {
  autoInit()
}
