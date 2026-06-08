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

import type {
  ChatMessage,
  IncomingWsMessage,
  WidgetConfig,
  WidgetHomeCard,
  WidgetView,
} from './types'
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

interface WidgetConversationSummary {
  convId: string
  title: string
  preview: string
  updatedAt: string
  status?: string
  messages?: ChatMessage[]
  /** @deprecated kept for legacy localStorage entries — use homeCardId instead. */
  homePrompt?: string
  /** Stable id of the home card that spawned this conversation. Lets the
   *  widget reopen the same thread when the visitor re-clicks the same card,
   *  even if the admin has since edited the card's prompt text. */
  homeCardId?: string
}

function getConversationIndexKey(
  orgId: string,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): string {
  return `${getStorageKey(orgId, ephemeral, identity)}_conversations`
}

function saveConversationIndex(
  orgId: string,
  conversations: WidgetConversationSummary[],
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): void {
  const store = chatStore(ephemeral)
  if (!store) return
  try {
    store.setItem(
      getConversationIndexKey(orgId, ephemeral, identity),
      JSON.stringify({ conversations, ts: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

function loadConversationIndex(
  orgId: string,
  ephemeral: boolean,
  identity: { email?: string | null; anonChatId?: string; visitorId?: string }
): WidgetConversationSummary[] {
  const store = chatStore(ephemeral)
  if (!store) return []
  try {
    const raw = store.getItem(getConversationIndexKey(orgId, ephemeral, identity))
    if (!raw) return []
    const data = JSON.parse(raw)
    if (Date.now() - (data.ts ?? 0) > 24 * 60 * 60 * 1000) {
      store.removeItem(getConversationIndexKey(orgId, ephemeral, identity))
      return []
    }
    return Array.isArray(data.conversations) ? data.conversations : []
  } catch {
    return []
  }
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
  identity: { email?: string | null; anonChatId?: string; visitorId?: string },
  includeConversationIndex = false
): void {
  const store = chatStore(ephemeral)
  if (!store) return
  try {
    store.removeItem(getStorageKey(orgId, ephemeral, identity))
    if (includeConversationIndex) {
      store.removeItem(getConversationIndexKey(orgId, ephemeral, identity))
    }
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
    this.upsertCurrentConversationSummary(
      this.isResolved ? 'resolved' : this.isEscalated ? 'escalated' : undefined
    )
  }

  private wipeStoredMessages(): void {
    clearStoredMessages(
      this.config.orgId,
      this.config.ephemeral === true,
      this.currentStorageIdentity(),
      true
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

  // ── Off-tab alert plumbing ───────────────────────────────────────────────
  // When a new message arrives and the visitor is on a different tab (or the
  // widget is closed), oscillate document.title and swap the favicon so they
  // notice without us needing the OS-level Notifications permission.
  /** Original document.title before any flashing — restored when cleared. */
  private offTabOriginalTitle: string | null = null
  /** Original favicon href — restored when cleared. */
  private offTabOriginalFaviconHref: string | null = null
  /** Interval id for the title flash. */
  private offTabTitleTimer: ReturnType<typeof setInterval> | null = null
  /** Bound focus/visibility handlers so we can attach + detach cleanly. */
  private offTabFocusHandler: (() => void) | null = null
  private offTabVisibilityHandler: (() => void) | null = null
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

  // Pre-chat form skip flag. Once the visitor clicks "Skip", we don't show the
  // form again — neither this session nor on reload. Persisted to localStorage
  // (per orgId) so a returning visitor on the same browser isn't re-gated.
  private preChatSkipped = false

  // Local conversation index. The backend is the source of truth for verified
  // visitors; this local index keeps anonymous/ephemeral sessions usable and
  // makes home-card prompt → conversation mapping instant.
  private conversations: WidgetConversationSummary[] = []
  private activeHomePrompt: string | null = null
  /** Stable id of the home card driving the current/next new conversation —
   *  passed to the WS on first connect so the backend stamps it on the
   *  conversation. Cleared after the WS picks it up. */
  private activeHomeCardId: string | null = null
  private suppressHeroWelcome = false
  /** When true, open() skips pushing the synthetic config.greeting bubble.
   *  Set by sendHomePrompt — the visitor's card-question is the entry, so a
   *  generic intro above it would just push the question down and (worse,
   *  pre-fix) act as a magnet for streamed AI tokens. */
  private suppressGreetingBubble = false
  /** Tracks whether the last server conversation-list fetch succeeded.
   *  When false, the chat-list header shows an unobtrusive "Offline" hint
   *  so visitors aren't misled by a stale local list. */
  private conversationsOffline = false

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
    // Capture the dashboard-org id BEFORE the update so we can detect a
    // workspace switch and refresh the visitor's chat list to match the
    // new context. Mid-chat current conversation stays open by design.
    const prevContextOrgId = this.currentDashboardContextOrgId()
    this.latestRuntimeContext = detail.context
    this.sendRuntimeContext(detail.context)
    const nextContextOrgId = this.currentDashboardContextOrgId()
    if (prevContextOrgId !== nextContextOrgId) {
      this.handleDashboardContextOrgChange()
    }
  }

  /** Returns the dashboard-side workspace org id the visitor is currently
   *  viewing (e.g. "Lira" or "Creovine" in the admin org-switcher), or null
   *  for plain landing embeds that don't publish a runtime context. */
  private currentDashboardContextOrgId(): string | null {
    const id = this.latestRuntimeContext?.organisation?.org_id
    return typeof id === 'string' && id.length > 0 ? id : null
  }

  /** Org-switcher fired in the host dashboard. The visitor's identity is
   *  unchanged, but the chat list should now be scoped to the new workspace.
   *  Strategy:
   *    - Wipe the local conversation cache (it's per-identity, NOT per-org,
   *      so it carries stale rows from the previous workspace).
   *    - Re-fetch the server list with the new context_org_id filter.
   *    - If the chat-list view is open, re-render once the fetch returns.
   *    - Mid-chat sessions stay open by design (per your spec) — only the
   *      list re-fetches, not the active conversation. */
  private handleDashboardContextOrgChange(): void {
    this.conversations = []
    this.conversationsOffline = false
    this.persistConversationIndex()
    if (this.view === 'chat-list') this.render()
    void this.loadServerConversationsIfPossible().finally(() => {
      if (this.view === 'chat-list') this.render()
    })
  }

  constructor(config: WidgetConfig) {
    this.config = {
      mode: 'bubble',
      position: 'bottom-right',
      primaryColor: '#1A1A1A',
      greeting: 'Hi! How can we help you today?',
      ...config,
    }
    this.view = this.isFullscreen() ? 'home' : 'launcher'
    // Demo embeds opt in to ephemeral mode via `data-ephemeral="true"`. Real
    // customer embeds never set this flag, so their behavior is unchanged.
    this.visitorId = getOrCreateVisitorId(this.config.ephemeral === true)

    // Restore a previous "Skip" choice on the pre-chat form so returning
    // visitors aren't re-gated on every load.
    try {
      this.preChatSkipped =
        localStorage.getItem(`lira-prechat-skipped:${this.config.orgId}`) === '1'
    } catch {
      /* localStorage unavailable (e.g. SSR / privacy mode) — fall through */
    }
    this.lastIdentityEmail = this.config.visitorEmail?.trim().toLowerCase() ?? null
    this.conversations = loadConversationIndex(
      this.config.orgId,
      this.config.ephemeral === true,
      this.currentStorageIdentity()
    )

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
      this.upsertCurrentConversationSummary()
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
      this.openHome()
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
      // Route to Home view, not Chat. Home renders the dashboard onboarding
      // hero AND the Home/Chat bottom nav (`buildWidgetTabs`); going to
      // Chat would show the hero but without the nav, leaving the visitor
      // stuck on what looks like an isolated screen with no way back.
      setTimeout(() => this.openHome(), 0)
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
    clearStoredMessages(this.config.orgId, this.config.ephemeral === true, prevIdentity, true)

    // 2) Switch to the new identity in memory.
    this.lastIdentityEmail = newEmail
    this.messages = []
    this.convId = null
    this.unreadCount = 0
    this.clearOffTabAlert()
    this.conversations = []
    this.activeHomePrompt = null
    this.activeHomeCardId = null
    this.conversationsOffline = false

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
            this.clearOffTabAlert()
            this.upsertCurrentConversationSummary()
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
          this.conversations = loadConversationIndex(
            this.config.orgId,
            this.config.ephemeral === true,
            this.currentStorageIdentity()
          )
          this.upsertCurrentConversationSummary()
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
      this.conversations = loadConversationIndex(
        this.config.orgId,
        this.config.ephemeral === true,
        this.currentStorageIdentity()
      )
      this.upsertCurrentConversationSummary()
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
        if (
          data.home_template === 'default' ||
          data.home_template === 'minimal' ||
          data.home_template === 'branded'
        ) {
          this.config.homeTemplate = data.home_template
          needsRerender = true
        }
        if (data.home_banner_url !== undefined) {
          this.config.homeBannerUrl = data.home_banner_url || undefined
          needsRerender = true
        }
        if (data.home_logo_url !== undefined) {
          this.config.homeLogoUrl = data.home_logo_url || undefined
          needsRerender = true
        }
        if (data.home_title !== undefined) {
          this.config.homeTitle = data.home_title || undefined
          needsRerender = true
        }
        if (data.home_subtitle !== undefined) {
          this.config.homeSubtitle = data.home_subtitle || undefined
          needsRerender = true
        }
        if (Array.isArray(data.home_cards)) {
          this.config.homeCards = data.home_cards
          needsRerender = true
        }
        if (needsRerender) this.render()
      })
      .catch(() => {
        /* ignore */
      })
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private render(): void {
    // Synchronous remove + append. The browser paints AFTER the whole
    // render() function completes, not between DOM mutations within the
    // same task, so there's no intermediate "empty shadow" frame visible
    // to the user. The earlier stash-into-hidden-div approach was extra
    // DOM work for no actual paint benefit. The real flicker users noticed
    // came from openChatList double-rendering — that's fixed separately
    // via the conversation-list change-detector.
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
    } else if (this.view === 'chat-list') {
      this.renderChatList()
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
    btn.onclick = () => this.openHome()
    if (this.unreadCount > 0) {
      const badge = document.createElement('span')
      badge.className = 'lira-unread-badge'
      badge.textContent = this.unreadCount > 9 ? '9+' : String(this.unreadCount)
      btn.appendChild(badge)
    }
    this.shadow.appendChild(btn)
  }

  private openHome(): void {
    const fromLauncher = this.view === 'launcher'
    this.view = 'home'
    this.unreadCount = 0
    this.clearOffTabAlert()
    if (fromLauncher) this.chatAnimPlayed = false
    this.render()
  }

  private openChatList(): void {
    this.view = 'chat-list'
    this.unreadCount = 0
    this.clearOffTabAlert()
    // Snapshot the local list signature so we can skip the post-fetch
    // re-render when the server returned the same data we already showed.
    // Two renders in quick succession looked like a glitch on the bottom
    // nav even though only the content area changed.
    const sigBefore = this.conversationListSignature()
    this.loadServerConversationsIfPossible().finally(() => {
      if (this.view !== 'chat-list') return
      if (this.conversationListSignature() !== sigBefore) this.render()
    })
    this.render()
  }

  /**
   * Stable-ish signature for the current conversation list so we can
   * detect "actually changed" vs "same data, no need to re-render."
   */
  private conversationListSignature(): string {
    return (
      this.conversations.map((c) => `${c.convId}:${c.updatedAt}:${c.status ?? ''}`).join('|') +
      `|offline=${this.conversationsOffline}`
    )
  }

  private async openConversation(convId: string): Promise<void> {
    const summary = this.conversations.find((c) => c.convId === convId)
    this.socket?.disconnect()
    this.socket = null
    this.pipecatChat = null
    this.convId = convId
    this.messages = summary?.messages ?? []
    this.isResolved = summary?.status === 'resolved'
    this.isEscalated = summary?.status === 'escalated'
    this.activeHomePrompt = summary?.homePrompt ?? null
    this.suppressHeroWelcome = true
    this.forceNewCase = false
    this.seenMessageIds.clear()
    for (const msg of this.messages) this.seenMessageIds.add(msg.id)
    const remote = await this.fetchServerConversation(convId)
    if (remote) {
      this.messages = remote.messages
      this.isResolved = remote.status === 'resolved'
      this.isEscalated = remote.status === 'escalated'
      this.upsertCurrentConversationSummary(remote.status)
    }
    this.open()
  }

  private sortedConversations(): WidgetConversationSummary[] {
    return [...this.conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  private formatConversationTime(value: string): string {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'now'
    if (diff < 60 * 60_000) return `${Math.max(1, Math.floor(diff / 60_000))}m`
    if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  // Build a single chat-list row. The row is a flex wrap with two siblings:
  // the main click target (opens the conversation) and a small hide button
  // that swaps the wrap into an inline confirm — keeps the tap targets
  // separate so a sloppy thumb doesn't trigger the wrong one.
  private buildConversationRow(conversation: WidgetConversationSummary): HTMLDivElement {
    const wrap = document.createElement('div')
    wrap.className = 'lira-conversation-item-wrap'

    const item = document.createElement('button')
    item.className = `lira-conversation-item ${conversation.convId === this.convId ? 'active' : ''}`
    item.type = 'button'
    item.onclick = () => this.openConversation(conversation.convId)

    const avatar = document.createElement('span')
    avatar.className = 'lira-conversation-avatar'
    avatar.textContent = conversation.title.trim().charAt(0).toUpperCase() || 'C'
    item.appendChild(avatar)

    const copy = document.createElement('span')
    copy.className = 'lira-conversation-copy'

    const top = document.createElement('span')
    top.className = 'lira-conversation-topline'

    const title = document.createElement('span')
    title.className = 'lira-conversation-title'
    title.textContent = conversation.title || 'Conversation'
    top.appendChild(title)

    const time = document.createElement('span')
    time.className = 'lira-conversation-time'
    time.textContent = this.formatConversationTime(conversation.updatedAt)
    top.appendChild(time)
    copy.appendChild(top)

    const preview = document.createElement('span')
    preview.className = 'lira-conversation-preview'
    preview.textContent = conversation.preview || 'Open conversation'
    copy.appendChild(preview)

    item.appendChild(copy)
    wrap.appendChild(item)

    const hideBtn = document.createElement('button')
    hideBtn.className = 'lira-conversation-hide'
    hideBtn.type = 'button'
    hideBtn.setAttribute('aria-label', 'Remove this conversation from your list')
    hideBtn.setAttribute('title', 'Remove from your list')
    hideBtn.innerHTML = ICON_CLOSE
    hideBtn.onclick = (e) => {
      e.stopPropagation()
      this.swapRowToConfirm(wrap, conversation)
    }
    wrap.appendChild(hideBtn)

    return wrap
  }

  // Replace a row's contents with an inline confirm. Compact: a line of copy
  // explaining the action plus Cancel / Remove buttons. Cancel restores the
  // original row; Remove fires the hide flow.
  private swapRowToConfirm(wrap: HTMLDivElement, conversation: WidgetConversationSummary): void {
    wrap.innerHTML = ''
    wrap.classList.add('lira-conversation-item-wrap-confirm')

    const copy = document.createElement('div')
    copy.className = 'lira-conversation-confirm-copy'
    copy.innerHTML =
      '<div class="lira-conversation-confirm-title">Remove from your list?</div>' +
      '<div class="lira-conversation-confirm-body">The team still has the record.</div>'
    wrap.appendChild(copy)

    const actions = document.createElement('div')
    actions.className = 'lira-conversation-confirm-actions'

    const cancel = document.createElement('button')
    cancel.className = 'lira-conversation-confirm-cancel'
    cancel.type = 'button'
    cancel.textContent = 'Cancel'
    cancel.onclick = (e) => {
      e.stopPropagation()
      const fresh = this.buildConversationRow(conversation)
      wrap.replaceWith(fresh)
    }
    actions.appendChild(cancel)

    const remove = document.createElement('button')
    remove.className = 'lira-conversation-confirm-remove'
    remove.type = 'button'
    remove.textContent = 'Remove'
    remove.onclick = (e) => {
      e.stopPropagation()
      this.hideConversationFromList(conversation.convId)
    }
    actions.appendChild(remove)

    wrap.appendChild(actions)
  }

  private persistConversationIndex(): void {
    saveConversationIndex(
      this.config.orgId,
      this.sortedConversations().slice(0, 30),
      this.config.ephemeral === true,
      this.currentStorageIdentity()
    )
  }

  // ── Visitor-side conversation hide ─────────────────────────────────────
  //
  // The X icon on each chat-list row removes a conversation from THIS
  // visitor's widget view. It does NOT delete the conversation server-side;
  // the org's support inbox still sees it.
  //
  // Two persistence layers, belt-and-suspenders:
  //   1. POST to the hide endpoint so future server fetches filter it.
  //   2. Stash the id in localStorage as a fallback so a network failure
  //      (or a brief race between the optimistic UI update and the next
  //      list refresh) doesn't make the row pop back into view.
  private hiddenConvsStorageKey(): string | null {
    if (typeof localStorage === 'undefined') return null
    const orgId = this.config.orgId
    const id = this.config.visitorEmail
      ? `email:${this.config.visitorEmail.toLowerCase()}`
      : `visitor:${this.visitorId}`
    return `lira_hidden_convs:${orgId}:${id}`
  }

  private loadHiddenConvIds(): Set<string> {
    const key = this.hiddenConvsStorageKey()
    if (!key) return new Set()
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return new Set()
      const arr = JSON.parse(raw) as string[]
      return new Set(Array.isArray(arr) ? arr : [])
    } catch {
      return new Set()
    }
  }

  private markConvHiddenLocally(convId: string): void {
    const key = this.hiddenConvsStorageKey()
    if (!key) return
    try {
      const ids = this.loadHiddenConvIds()
      ids.add(convId)
      // Cap to last 200 ids so this never grows unbounded for heavy users.
      const arr = Array.from(ids).slice(-200)
      localStorage.setItem(key, JSON.stringify(arr))
    } catch {
      /* storage full / disabled — fail silent */
    }
  }

  // Inner half: state + persistence + server POST. No render — callers that
  // are about to render something else (e.g. Clear → startNewConversation)
  // use this directly so the in-between render doesn't flash a stale frame.
  private async markConversationHidden(convId: string): Promise<void> {
    this.conversations = this.conversations.filter((c) => c.convId !== convId)
    this.markConvHiddenLocally(convId)
    this.persistConversationIndex()

    // Fire-and-mostly-forget POST. If it fails, the localStorage flag still
    // hides the row on this device; the server-side row simply stays visible
    // to this visitor on other devices until next attempt.
    try {
      const orgId = encodeURIComponent(this.config.orgId)
      const convPart = encodeURIComponent(convId)
      const isIdentified = Boolean(this.config.visitorEmail && this.config.visitorSig)
      const url = isIdentified
        ? `https://api.creovine.com/lira/v1/support/chat/conversation/${orgId}/${convPart}/hide` +
          `?email=${encodeURIComponent(this.config.visitorEmail!)}&sig=${encodeURIComponent(this.config.visitorSig!)}`
        : `https://api.creovine.com/lira/v1/support/chat/conversation/visitor/${orgId}/${encodeURIComponent(this.visitorId)}/${convPart}/hide`
      await fetch(url, { method: 'POST' })
    } catch {
      /* network blip — local flag is the safety net */
    }
  }

  // X-icon path: hide the row + re-render the list right away.
  private async hideConversationFromList(convId: string): Promise<void> {
    void this.markConversationHidden(convId)
    this.render()
  }

  private upsertCurrentConversationSummary(status?: string): void {
    if (!this.convId) return
    const visible = this.messages.filter((m) => m.role !== 'system')
    const firstCustomer = visible.find((m) => m.role === 'customer')
    const last = visible[visible.length - 1]
    const title =
      this.activeHomePrompt ||
      firstCustomer?.body?.slice(0, 70) ||
      this.config.greeting ||
      'Conversation'
    // Preserve any homeCardId already stamped on this conversation by an
    // earlier render or by a server-side hydrate — once a conversation is
    // born from a card, that linkage is stable.
    const previous = this.conversations.find((c) => c.convId === this.convId)
    const summary: WidgetConversationSummary = {
      convId: this.convId,
      title: title.length > 72 ? `${title.slice(0, 69)}...` : title,
      preview: last?.body?.slice(0, 120) || 'New conversation',
      updatedAt: last?.timestamp || new Date().toISOString(),
      status,
      messages: this.messages,
      homePrompt: this.activeHomePrompt ?? previous?.homePrompt,
      homeCardId: previous?.homeCardId ?? this.activeHomeCardId ?? undefined,
    }
    this.conversations = [summary, ...this.conversations.filter((c) => c.convId !== this.convId)]
    this.persistConversationIndex()
  }

  private async loadServerConversationsIfPossible(): Promise<void> {
    // Identified path is preferred (covers cross-device for the same email).
    // For purely anonymous visitors we fall back to the visitorId-gated
    // endpoint so they still see their conversation list after the local
    // index is wiped (e.g. cleared cache, fresh tab in non-ephemeral mode).
    const isIdentified = Boolean(this.config.visitorEmail && this.config.visitorSig)
    // Optional dashboard-context scope. When the widget is embedded inside
    // a multi-tenant admin app (e.g. Lira's own dashboard), the host's
    // selected workspace id rides on this param so the server-side filter
    // can scope the list to that workspace. Untagged conversations are
    // returned under every workspace as legacy — see matchesDashboardContext
    // in the backend route.
    const contextOrgId = this.currentDashboardContextOrgId()
    const contextParam = contextOrgId ? `&context_org_id=${encodeURIComponent(contextOrgId)}` : ''
    const url = isIdentified
      ? `https://api.creovine.com/lira/v1/support/chat/conversations/${this.config.orgId}` +
        `?email=${encodeURIComponent(this.config.visitorEmail!)}&sig=${encodeURIComponent(this.config.visitorSig!)}` +
        contextParam
      : `https://api.creovine.com/lira/v1/support/chat/conversations/visitor/${this.config.orgId}/${encodeURIComponent(this.visitorId)}` +
        (contextOrgId ? `?context_org_id=${encodeURIComponent(contextOrgId)}` : '')

    try {
      const res = await fetch(url)
      if (!res.ok) {
        this.conversationsOffline = true
        return
      }
      const data = (await res.json()) as {
        conversations?: Array<{
          conv_id: string
          subject?: string
          preview?: string
          updated_at: string
          status?: string
          home_card_id?: string
        }>
      }
      this.conversationsOffline = false
      // Belt-and-suspenders: if the visitor X'd a conversation but the
      // server-side flag hasn't propagated yet (or the hide POST failed),
      // the localStorage allowlist keeps the row hidden on this device.
      const locallyHidden = this.loadHiddenConvIds()
      const remote = (data.conversations ?? [])
        .filter((c) => !locallyHidden.has(c.conv_id))
        .map((c): WidgetConversationSummary => {
          const local = this.conversations.find((l) => l.convId === c.conv_id)
          return {
            convId: c.conv_id,
            title: c.subject || c.preview || 'Conversation',
            preview: c.preview || c.subject || 'Open conversation',
            updatedAt: c.updated_at,
            status: c.status,
            messages: local?.messages,
            homePrompt: local?.homePrompt,
            // Server is the source of truth for card linkage; only fall back to
            // local if the server didn't (yet) stamp one.
            homeCardId: c.home_card_id ?? local?.homeCardId,
          }
        })
      // localOnly merge handles the brief race where a brand-new conversation
      // exists in memory but the server's list view hasn't observed it yet.
      // BUT — keeping ALL local entries that the server didn't return makes
      // hidden conversations resurrect: server filters out a hidden row, the
      // local cache still has it, the merge re-adds it, and the user sees a
      // "phantom" row that won't go away (the persistent-conv-after-clear bug).
      //
      // Fix: only keep a localOnly entry if it's the CURRENT active conversation
      // (this.convId) — that's the only one that might be in-flight. Everything
      // else: trust the server's view. Hidden rows are now properly omitted on
      // the next fetch; the local cache catches up by saving the trimmed list.
      const localOnly = this.conversations.filter(
        (local) =>
          local.convId === this.convId && !remote.some((item) => item.convId === local.convId)
      )
      this.conversations = [...remote, ...localOnly]
      this.persistConversationIndex()
    } catch {
      this.conversationsOffline = true
      /* local list remains usable */
    }
  }

  private async fetchServerConversation(
    convId: string
  ): Promise<{ messages: ChatMessage[]; status?: string } | null> {
    if (!this.config.visitorEmail || !this.config.visitorSig) return null
    try {
      const url =
        `https://api.creovine.com/lira/v1/support/chat/conversation/${this.config.orgId}/${convId}` +
        `?email=${encodeURIComponent(this.config.visitorEmail)}&sig=${encodeURIComponent(this.config.visitorSig)}`
      const res = await fetch(url)
      if (!res.ok) return null
      const data = (await res.json()) as {
        status?: string
        messages?: Array<{
          id?: string
          role: ChatMessage['role']
          body: string
          timestamp: string
          sender_name?: string
          sender_avatar?: string
        }>
      }
      return {
        status: data.status,
        messages: (data.messages ?? []).map((m) => ({
          id: m.id ?? `srv-${m.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          role: m.role,
          body: m.body,
          timestamp: m.timestamp,
          sender_name: m.sender_name,
          sender_avatar: m.sender_avatar,
        })),
      }
    } catch {
      return null
    }
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
    chat.onclick = () => this.openChatList()
    tabs.appendChild(chat)

    return tabs
  }

  /**
   * Open or start the conversation owned by a home card.
   *  - Matches by stable `cardId` first (survives prompt rename + cross-device).
   *  - Falls back to matching by raw prompt text so legacy conversations from
   *    before card IDs existed are still discoverable.
   * Re-clicking a card that already has a conversation just reopens it instead
   * of re-firing the prompt as a fresh message.
   */
  private sendHomePrompt(body: string, cardId?: string): void {
    const existing = this.conversations.find(
      (c) => (cardId && c.homeCardId === cardId) || (!cardId && c.homePrompt === body)
    )
    if (existing) {
      this.openConversation(existing.convId)
      return
    }
    if (cardId) this.activeHomeCardId = cardId
    this.startNewConversation({ preserveIndex: true, suppressHero: true, suppressGreeting: true })
    this.activeHomePrompt = body
    requestAnimationFrame(() => this.sendSuggestedReply(body))
  }

  private renderHome(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    const header = document.createElement('div')
    header.className = 'lira-header'

    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    const orgName = this.config.orgName || 'Lira'
    const headerLogo = this.config.logoUrl || this.config.homeLogoUrl
    if (headerLogo) {
      headerAvatar.innerHTML = `<img src="${headerLogo}" alt="${orgName}" />`
    } else {
      headerAvatar.innerHTML = ICON_LIRA
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
    closeBtn.setAttribute('aria-label', 'Close widget')
    closeBtn.onclick = () => this.close()
    actions.appendChild(closeBtn)
    header.appendChild(actions)
    win.appendChild(header)

    const home = document.createElement('div')

    // Dashboard / onboarding mode: the widget is embedded inside the Lira
    // admin app (autoOpenFirstVisit is the dashboard's signal). These users
    // are already paying customers — they don't need the marketing-style
    // "What is Lira / Compare to Intercom" cards. The Home tab should show
    // the same setup-guidance hero the Chat tab opens with so the experience
    // is coherent across tabs. Skip the template branch entirely below.
    if (this.config.autoOpenFirstVisit === true) {
      home.className = 'lira-home lira-home-onboarding'
      home.appendChild(this.buildHeroWelcomeEl())
      win.appendChild(home)
      win.appendChild(this.buildWidgetTabs('home'))
      const powered = document.createElement('div')
      powered.className = 'lira-powered'
      powered.innerHTML =
        'Powered by <a href="https://creovine.com" target="_blank" rel="noopener">Creovine</a>'
      win.appendChild(powered)
      this.shadow.appendChild(win)
      this.renderLauncher()
      return
    }

    // Templates: 'default' (refreshed clean hero + cards), 'minimal' (no big
    // hero — just a small greeting and a button list), 'branded' (large org
    // banner image above the content via home_banner_url). The default
    // dropped the ring/orbit/glow decoration that read as generic AI-widget
    // chrome — see the comment above .lira-home in styles.ts.
    const template = this.config.homeTemplate ?? 'default'
    home.className = `lira-home${template !== 'default' ? ` lira-home-${template}` : ''}`

    // Branded: render a banner image (falls back to a primary-colour block).
    if (template === 'branded') {
      const banner = document.createElement('section')
      banner.className = 'lira-home-banner'
      if (this.config.homeBannerUrl) {
        banner.innerHTML = `<img src="${this.config.homeBannerUrl}" alt="${orgName}" />`
      }
      home.appendChild(banner)
    }

    const hero = document.createElement('section')
    hero.className = 'lira-home-hero'

    // Minimal template skips the logo block — keeps the surface compact.
    if (template !== 'minimal') {
      const logo = document.createElement('div')
      logo.className = 'lira-home-logo-wrap'
      const homeLogo = this.config.homeLogoUrl || this.config.logoUrl
      logo.innerHTML = `<span class="lira-home-logo">${
        homeLogo ? `<img src="${homeLogo}" alt="${orgName}" />` : ICON_LIRA
      }</span>`
      hero.appendChild(logo)
    }

    const title = document.createElement('h3')
    title.className = 'lira-home-title'
    title.textContent = this.config.homeTitle?.trim() || `Welcome to ${orgName}`
    hero.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.className = 'lira-home-subtitle'
    subtitle.textContent =
      this.config.homeSubtitle?.trim() ||
      'Search the knowledge base, get account help, or start a conversation with support.'
    hero.appendChild(subtitle)

    const primary = document.createElement('button')
    primary.className = 'lira-home-primary'
    primary.type = 'button'
    primary.innerHTML = `Start a conversation <span class="lira-home-primary-arrow">&rarr;</span>`
    primary.onclick = () => this.startNewConversation({ preserveIndex: true, suppressHero: true })
    hero.appendChild(primary)

    home.appendChild(hero)

    const cards = document.createElement('div')
    cards.className = 'lira-home-cards'
    const prompts: WidgetHomeCard[] = this.config.homeCards?.length
      ? this.config.homeCards
      : [
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
      card.onclick = () => this.sendHomePrompt(item.prompt, item.id)

      const cardIcon = document.createElement('span')
      cardIcon.className = 'lira-home-card-icon'
      cardIcon.textContent = item.icon || '•'
      card.appendChild(cardIcon)

      const cardCopy = document.createElement('span')
      cardCopy.className = 'lira-home-card-copy'

      const cardTitle = document.createElement('span')
      cardTitle.className = 'lira-home-card-title'
      cardTitle.textContent = item.title
      cardCopy.appendChild(cardTitle)

      const cardBody = document.createElement('span')
      cardBody.className = 'lira-home-card-body'
      cardBody.textContent = item.body || ''
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
      // id/name + autocomplete: silences "form field has neither an id nor a
      // name attribute" DevTools warning and lets the browser autofill these.
      input.id = `lira-prechat-${field}`
      input.name = `lira_prechat_${field}`
      input.autocomplete = field === 'email' ? 'email' : field === 'name' ? 'name' : 'off'
      input.placeholder =
        field === 'email' ? 'you@company.com' : field === 'name' ? 'Your name' : ''
      input.style.cssText =
        'width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #e0e0e0;border-radius:10px;font-size:13px;outline:none;transition:border-color .15s;'
      // Bind the label to this input for accessibility (clicking the label
      // focuses the input, screen readers announce them together).
      label.htmlFor = input.id
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
      this.dispatchPendingHomePromptIfAny()
    }
    formWrap.appendChild(startBtn)

    // "Skip" link
    const skip = document.createElement('button')
    skip.textContent = 'Skip'
    skip.style.cssText =
      'display:block;margin:10px auto 0;background:none;border:none;color:#999;font-size:11px;cursor:pointer;text-decoration:underline;'
    skip.onclick = () => {
      // Persist the skip decision so subsequent opens / reloads don't re-gate
      // the visitor on the pre-chat form. Without this, open() re-evaluates
      // `needsPreChat` and forces view back to 'pre-chat' — Skip was a no-op.
      this.preChatSkipped = true
      try {
        localStorage.setItem(`lira-prechat-skipped:${this.config.orgId}`, '1')
      } catch {
        /* localStorage unavailable — flag still holds for this session */
      }
      this.view = 'chat'
      this.open()
      this.dispatchPendingHomePromptIfAny()
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

  private renderChatList(): void {
    const win = document.createElement('div')
    win.className = this.chatWindowClass()

    const header = document.createElement('div')
    header.className = 'lira-header'

    const orgName = this.config.orgName || 'Support'
    const logoUrl = this.config.logoUrl
    const initial = orgName.charAt(0).toUpperCase()

    const headerAvatar = document.createElement('div')
    headerAvatar.className = 'lira-header-avatar'
    headerAvatar.innerHTML = logoUrl
      ? `<img src="${logoUrl}" alt="${orgName}" />`
      : `<span class="lira-initial">${initial}</span>`
    header.appendChild(headerAvatar)

    const headerInfo = document.createElement('div')
    headerInfo.className = 'lira-header-info'
    // Subtitle shows the org normally; if the last server fetch failed, swap
    // in a small "Offline · showing cached" line so the visitor isn't misled
    // into thinking they're looking at the freshest list.
    const subtitle = this.conversationsOffline
      ? `<span class="lira-online-dot lira-online-dot-offline"></span> Offline · showing cached`
      : `<span class="lira-online-dot"></span> ${orgName}`
    headerInfo.innerHTML = `
      <div class="lira-header-title">Conversations</div>
      <div class="lira-header-subtitle">${subtitle}</div>
    `
    header.appendChild(headerInfo)

    const actions = document.createElement('div')
    actions.className = 'lira-header-actions'
    const newBtn = document.createElement('button')
    newBtn.className = 'lira-header-text-btn'
    newBtn.textContent = '+ New'
    newBtn.setAttribute('aria-label', 'Start a new conversation')
    newBtn.onclick = () => this.startNewConversation({ preserveIndex: true, suppressHero: true })
    actions.appendChild(newBtn)

    if (!this.isFullscreen()) {
      const closeBtn = document.createElement('button')
      closeBtn.className = 'lira-header-btn'
      closeBtn.innerHTML = ICON_CLOSE
      closeBtn.setAttribute('aria-label', 'Close widget')
      closeBtn.onclick = () => this.close()
      actions.appendChild(closeBtn)
    }
    header.appendChild(actions)
    win.appendChild(header)

    const list = document.createElement('div')
    list.className = 'lira-conversation-list'

    if (this.conversations.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'lira-conversation-empty'
      empty.innerHTML = `
        <div class="lira-conversation-empty-icon">${ICON_CHAT}</div>
        <div class="lira-conversation-empty-title">No conversations yet</div>
        <div class="lira-conversation-empty-body">Start a new thread or choose a quick-start card from Home.</div>
      `
      const start = document.createElement('button')
      start.className = 'lira-home-primary'
      start.type = 'button'
      start.textContent = 'Start a conversation'
      start.onclick = () => this.startNewConversation({ preserveIndex: true, suppressHero: true })
      empty.appendChild(start)
      list.appendChild(empty)
    } else {
      for (const conversation of this.sortedConversations()) {
        list.appendChild(this.buildConversationRow(conversation))
      }
    }

    win.appendChild(list)
    win.appendChild(this.buildWidgetTabs('chat'))

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

    const backBtn = document.createElement('button')
    backBtn.className = 'lira-header-btn lira-back-btn'
    backBtn.innerHTML = ICON_ARROW_LEFT
    backBtn.setAttribute('aria-label', 'Back to conversations')
    backBtn.setAttribute('title', 'Back to conversations')
    backBtn.onclick = () => this.openChatList()
    header.appendChild(backBtn)

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
      newChatActionBtn.onclick = () =>
        this.startNewConversation({ preserveIndex: true, suppressHero: true })

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

    // Bottom nav (Home / Chat) is intentionally NOT rendered inside an
    // active chat. The chat already has a back arrow in the header that
    // returns to the conversation list, and the tabs sitting under the
    // input were a visual duplication that confused visitors. Keep tabs
    // on Home + Chat-list only.

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
      newChatBtn2.onclick = () =>
        this.startNewConversation({ preserveIndex: true, suppressHero: true })
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
   * Increment unread + update the launcher badge + trigger the off-tab
   * alert if the visitor isn't looking at this tab. Use this instead of
   * `this.bumpUnread()` so every increment site picks up the alerts.
   */
  private bumpUnread(): void {
    this.bumpUnread()
    this.updateLauncherBadge()
    this.maybeStartOffTabAlert()
  }

  /**
   * Start the title flash + favicon badge when the visitor is on a different
   * tab. No-op if the tab is currently visible (no point pestering them when
   * they can already see the message).
   */
  private maybeStartOffTabAlert(): void {
    if (typeof document === 'undefined') return
    if (!document.hidden && document.hasFocus()) return
    if (this.offTabTitleTimer) return // already flashing

    // Save the originals so we can restore exactly what was there.
    if (this.offTabOriginalTitle === null) this.offTabOriginalTitle = document.title
    const link = this.getFaviconLink()
    if (link && this.offTabOriginalFaviconHref === null) {
      this.offTabOriginalFaviconHref = link.getAttribute('href')
    }

    const flashTitle = () => {
      const original = this.offTabOriginalTitle ?? ''
      const orgName = this.config.orgName || 'Lira'
      const count = this.unreadCount
      const notice =
        count > 1 ? `(${count}) New messages · ${orgName}` : `(1) New message · ${orgName}`
      document.title = document.title === notice ? original : notice
    }
    flashTitle()
    this.offTabTitleTimer = setInterval(flashTitle, 1200)

    // Swap the favicon to a small red-dot SVG so the tab pip carries the
    // signal too. Drawing on top of the original favicon would need CORS
    // headers many hosts don't set; swapping to a self-contained data URI
    // sidesteps that entirely. Original is restored on focus.
    if (link) {
      link.setAttribute(
        'href',
        'data:image/svg+xml;utf8,' +
          encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
              '<circle cx="16" cy="16" r="14" fill="#0f172a"/>' +
              '<circle cx="22" cy="10" r="6" fill="#ef4444"/>' +
              '</svg>'
          )
      )
    }

    // Attach focus + visibility listeners (once) to auto-clear when the
    // visitor returns to the tab. We re-attach them per session because
    // detachOffTabAlert removes them.
    if (!this.offTabFocusHandler) {
      this.offTabFocusHandler = () => this.clearOffTabAlert()
      this.offTabVisibilityHandler = () => {
        if (!document.hidden) this.clearOffTabAlert()
      }
      window.addEventListener('focus', this.offTabFocusHandler)
      document.addEventListener('visibilitychange', this.offTabVisibilityHandler)
    }
  }

  /**
   * Restore document.title + favicon and stop the flash. Idempotent.
   */
  private clearOffTabAlert(): void {
    if (this.offTabTitleTimer) {
      clearInterval(this.offTabTitleTimer)
      this.offTabTitleTimer = null
    }
    if (this.offTabOriginalTitle !== null) {
      document.title = this.offTabOriginalTitle
    }
    const link = this.getFaviconLink()
    if (link && this.offTabOriginalFaviconHref !== null) {
      link.setAttribute('href', this.offTabOriginalFaviconHref)
    }
    if (this.offTabFocusHandler) {
      window.removeEventListener('focus', this.offTabFocusHandler)
      this.offTabFocusHandler = null
    }
    if (this.offTabVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.offTabVisibilityHandler)
      this.offTabVisibilityHandler = null
    }
    this.offTabOriginalTitle = null
    this.offTabOriginalFaviconHref = null
  }

  /**
   * Resolve (or create) the host page's <link rel="icon"> element so we can
   * swap its href when the off-tab alert fires. If the page has no favicon
   * link we create one — better to add a red dot than to render nothing.
   */
  private getFaviconLink(): HTMLLinkElement | null {
    if (typeof document === 'undefined') return null
    let link =
      (document.querySelector('link[rel="icon"]') as HTMLLinkElement | null) ||
      (document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null)
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'icon')
      document.head.appendChild(link)
    }
    return link
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
      !this.suppressHeroWelcome &&
      this.messages.length === 0 &&
      !this.isTyping &&
      !this.isResolved &&
      !this.isEscalated &&
      !this.streamingMessageId
    )
  }

  /**
   * Build the first-visit hero welcome block. Editorial — no animated
   * rings, no decorative glow, no fake "online" pill. Just a clean avatar,
   * a personalised eyebrow, a confident headline, a short subtitle, and
   * the two CTAs. Reads like the top of a well-designed product page
   * rather than a generic AI-widget landing.
   *
   * The input area below it (rendered by renderChat) remains active, so
   * the user can type a free-form question instead of clicking a CTA.
   */
  private buildHeroWelcomeEl(): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'lira-hero'

    const inner = document.createElement('div')
    inner.className = 'lira-hero-inner'
    wrap.appendChild(inner)

    // Avatar — clean circle, no rings/halo/animation.
    const avatar = document.createElement('div')
    avatar.className = 'lira-hero-avatar'
    avatar.innerHTML = ICON_LIRA
    inner.appendChild(avatar)

    // Small "Lira" wordmark line under the avatar — gives the hero an
    // identity without resorting to a fake online-status pill.
    const eyebrow = document.createElement('div')
    eyebrow.className = 'lira-hero-eyebrow'
    eyebrow.textContent = 'Lira'
    inner.appendChild(eyebrow)

    const title = document.createElement('h2')
    title.className = 'lira-hero-title'
    const firstName = this.config.visitorName?.split(' ')[0] ?? ''
    title.textContent = firstName ? `Hi, ${firstName}.` : 'Hi.'
    inner.appendChild(title)

    const subtitle = document.createElement('p')
    subtitle.className = 'lira-hero-subtitle'
    subtitle.textContent =
      'I can walk you through setting up your support agent — or just answer questions while you build.'
    inner.appendChild(subtitle)

    const ctas = document.createElement('div')
    ctas.className = 'lira-hero-ctas'

    const ctaBtn = document.createElement('button')
    ctaBtn.className = 'lira-hero-cta'
    ctaBtn.type = 'button'
    ctaBtn.textContent = 'Guide me through setup'
    ctaBtn.onclick = () => this.startGuidedFlow()
    ctas.appendChild(ctaBtn)

    const blankBtn = document.createElement('button')
    blankBtn.className = 'lira-hero-secondary'
    blankBtn.type = 'button'
    blankBtn.textContent = 'Start a conversation'
    blankBtn.onclick = () => this.startNewConversation({ preserveIndex: true, suppressHero: true })
    ctas.appendChild(blankBtn)

    inner.appendChild(ctas)

    return wrap
  }

  /**
   * Triggered by the hero's primary CTA. Pre-fills the input with a
   * starter prompt and submits it as the user's first message; the
   * agent picks it up and starts the walkthrough. Hero auto-dismisses
   * via appendChatMessage() inside sendMessage().
   */
  private startGuidedFlow(): void {
    const prompt = 'Guide me through setting up my support agent.'
    // If the visitor already has a guided-flow conversation alive in their
    // list, reopen it (continue where they left off). Match by the prompt
    // body stamped on the conversation summary — the home-prompt path uses
    // the same approach. Note: any conversation the visitor cleared via the
    // X icon or the Clear button has been removed from this.conversations
    // AND filtered out of the server-side list, so it can't match here —
    // which is exactly why the OLD startGuidedFlow leaked into a cleared
    // conversation (it bypassed this check, set view='chat', and the still-
    // populated this.convId caused the socket to resume the dead thread).
    const existing = this.conversations.find((c) => c.homePrompt === prompt)
    if (existing) {
      this.openConversation(existing.convId)
      return
    }

    // No match → fully reset (this.convId, this.messages, socket, seen-ids,
    // forceNewCase, etc) before dispatching the prompt. startNewConversation
    // calls open() internally, which mounts renderChat and the textarea.
    this.suppressHeroWelcome = true
    this.startNewConversation({ preserveIndex: true, suppressHero: true, suppressGreeting: true })
    this.activeHomePrompt = prompt

    // Force-refresh runtime context from window storage RIGHT NOW so the
    // server's session has the latest before processing the first message.
    // Queued into the WS pendingMessages buffer; sendSuggestedReply queues
    // the message after it, server processes context_update → message in
    // order so the onboarding pack's customerOrgId resolves cleanly.
    const fresh = readLiraRuntimeContext()
    if (fresh) {
      this.latestRuntimeContext = fresh
      this.sendRuntimeContext(fresh)
    }

    // Defer one frame so renderChat has flushed the new textarea into the
    // DOM before sendSuggestedReply tries to read this.inputEl.
    requestAnimationFrame(() => this.sendSuggestedReply(prompt))
  }

  /** Append a single message to the chat (no DOM rebuild). */
  private appendChatMessage(msg: ChatMessage): void {
    // Belt-and-suspenders dedup: a few server paths can fan out the same
    // message id (a reply_start picked up by the chunk stream + a history
    // event arriving from a reconnect, etc.). seenMessageIds is the
    // authoritative dedup set — if we already rendered this id, drop it.
    if (msg.id && this.seenMessageIds.has(msg.id)) return
    if (msg.id) this.seenMessageIds.add(msg.id)
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
    if (msg.id) bubble.dataset.msgId = msg.id
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
      this.startNewConversation({ preserveIndex: true, suppressHero: true })
      return
    }

    if (!this.inputEl) return
    this.inputEl.value = body
    this.inputEl.dispatchEvent(new Event('input', { bubbles: true }))
    this.sendMessage()
  }

  /**
   * Called from the pre-chat form's Start and Skip handlers. When the
   * visitor clicked a home-card BEFORE the pre-chat form intervened,
   * `sendHomePrompt` already stamped the card's prompt onto
   * `this.activeHomePrompt` — but the rAF that would have dispatched it
   * fired against a 'pre-chat' view (no chat input mounted), so the
   * message was silently dropped and the visitor saw an empty chat after
   * Skip/Start. Replay it here, deferred one frame so renderChat has
   * flushed the input textarea into the DOM before sendSuggestedReply
   * tries to read this.inputEl.
   */
  private dispatchPendingHomePromptIfAny(): void {
    const prompt = this.activeHomePrompt
    if (!prompt) return
    requestAnimationFrame(() => {
      if (this.activeHomePrompt === prompt) this.sendSuggestedReply(prompt)
    })
  }

  private buildCardEl(msg: ChatMessage): HTMLElement {
    const card = msg.card!
    if (card.kind === 'stepper' && card.steps && card.steps.length > 0) {
      return this.buildStepperCardEl(card)
    }
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

  /**
   * Polished vertical stepper card. Used by lira_get_setup_progress to render
   * the 5-step onboarding journey with status dots, sub-progress, and docs
   * links per step. Visually distinct from a standard card.
   */
  private buildStepperCardEl(card: NonNullable<ChatMessage['card']>): HTMLElement {
    const wrap = document.createElement('div')
    wrap.className = 'lira-stepper-card'

    // ── Header: title + percent ring + badge ─────────────────────────
    const header = document.createElement('div')
    header.className = 'lira-stepper-header'

    if (card.progress && card.progress.total > 0) {
      const pct = Math.round((card.progress.done / card.progress.total) * 100)
      const ring = document.createElement('div')
      ring.className = 'lira-stepper-ring'
      ring.style.background = `conic-gradient(#10b981 ${pct}%, #e5e7eb ${pct}% 100%)`
      const inner = document.createElement('span')
      inner.className = 'lira-stepper-ring-inner'
      inner.textContent = `${pct}%`
      ring.appendChild(inner)
      header.appendChild(ring)
    }

    const headerText = document.createElement('div')
    headerText.className = 'lira-stepper-header-text'
    if (card.title) {
      const t = document.createElement('div')
      t.className = 'lira-stepper-title'
      t.textContent = card.title
      headerText.appendChild(t)
    }
    if (card.body) {
      const sub = document.createElement('div')
      sub.className = 'lira-stepper-subtitle'
      sub.textContent = card.body
      headerText.appendChild(sub)
    }
    header.appendChild(headerText)

    if (card.badge) {
      const b = document.createElement('span')
      b.className = `lira-stepper-badge tone-${card.badge.tone ?? 'neutral'}`
      b.textContent = card.badge.text
      header.appendChild(b)
    }
    wrap.appendChild(header)

    // ── Steps list ───────────────────────────────────────────────────
    const list = document.createElement('ol')
    list.className = 'lira-stepper-list'
    for (const step of card.steps!) {
      const li = document.createElement('li')
      li.className = `lira-stepper-step status-${step.status}${step.optional ? ' optional' : ''}`

      // Status dot with check / index
      const dot = document.createElement('span')
      dot.className = 'lira-stepper-dot'
      if (step.status === 'done') {
        dot.textContent = '✓'
      } else if (step.status === 'active') {
        dot.textContent = '●'
      } else {
        dot.textContent = ''
      }
      li.appendChild(dot)

      // Content
      const content = document.createElement('div')
      content.className = 'lira-stepper-content'
      const title = document.createElement('div')
      title.className = 'lira-stepper-step-title'
      title.textContent = step.title
      if (step.optional) {
        const tag = document.createElement('span')
        tag.className = 'lira-stepper-optional'
        tag.textContent = 'optional'
        title.appendChild(tag)
      }
      content.appendChild(title)

      if (step.description) {
        const desc = document.createElement('div')
        desc.className = 'lira-stepper-step-desc'
        desc.textContent = step.description
        content.appendChild(desc)
      }

      if (step.sub_progress && step.sub_progress.length > 0) {
        const subUl = document.createElement('ul')
        subUl.className = 'lira-stepper-sub'
        for (const sp of step.sub_progress) {
          const subLi = document.createElement('li')
          subLi.className = `lira-stepper-sub-item${sp.done ? ' done' : ''}`
          subLi.textContent = `${sp.done ? '✓' : '○'} ${sp.label}`
          subUl.appendChild(subLi)
        }
        content.appendChild(subUl)
      }

      if (step.docs && step.status !== 'done') {
        const link = document.createElement('a')
        link.className = 'lira-stepper-docs'
        link.href = step.docs
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        link.textContent = 'View guide →'
        content.appendChild(link)
      }

      li.appendChild(content)
      list.appendChild(li)
    }
    wrap.appendChild(list)

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
      // Hide the cleared conversation from the visitor's list (server-side
      // flag + localStorage fallback) so it doesn't reappear when they tap
      // the row from the list afterward — that was the surprise: "I cleared
      // it but reopening showed the full history again." The team's inbox
      // still has the record. Then start a fresh conversation in its place.
      const oldConvId = this.convId
      if (oldConvId) void this.markConversationHidden(oldConvId)
      this.startNewConversation({ preserveIndex: true, suppressHero: true })
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
      this.startNewConversation({ preserveIndex: true, suppressHero: true })
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

  /**
   * Forward a host-side resource read result back to the backend so the
   * agent can use the structured data on its next turn. Mirrors
   * `sendCustomerActionResult` for the resource layer of the agentic
   * runtime. Best-effort and silent if the socket isn't connected.
   */
  public sendCustomerResourceResult(detail: {
    resourceName: string
    ok: boolean
    message?: string
    data?: Record<string, unknown>
  }): void {
    this.socket?.send({ type: 'customer_resource_result', ...detail })
  }

  /**
   * Slice 5 — push the current SDK-registered resources and actions to
   * the backend so the agent sees them as Tools for this WS session.
   * Safe to call repeatedly; the backend treats incoming registrations as
   * upserts keyed on name. `socket.send` queues if the socket isn't open
   * yet, so this is also safe to call right after `socket.connect()`.
   */
  public sendSdkCapabilitiesRegistration(): void {
    const resources = [...sdkResourceRegistry.entries()].map(([name, entry]) => ({
      name,
      description: entry.options.description,
      auth_scope: entry.options.authScope ?? 'verified_visitor',
      risk: entry.options.risk ?? 'read_private',
      input_schema: entry.options.inputSchema,
      output_schema: entry.options.outputSchema,
    }))
    const actions = [...sdkActionRegistry.entries()].map(([name, entry]) => ({
      name,
      description: entry.options.description,
      auth_scope: entry.options.authScope ?? 'verified_visitor',
      risk: entry.options.risk ?? 'safe_write',
      input_schema: entry.options.inputSchema,
      output_schema: entry.options.outputSchema,
    }))
    if (resources.length === 0 && actions.length === 0) return
    this.socket?.send({ type: 'sdk_capabilities_register', resources, actions })
  }

  /**
   * Slice 5 — reply to a backend-initiated host_capability_request.
   * Mirrors `sendCustomerActionResult` shape but carries `request_id`
   * so the backend can resolve the pending tool-call promise.
   */
  public sendHostCapabilityResult(detail: {
    request_id: string
    ok: boolean
    message?: string
    data?: Record<string, unknown>
  }): void {
    this.socket?.send({ type: 'host_capability_result', ...detail })
  }

  private startNewConversation(
    options: { preserveIndex?: boolean; suppressHero?: boolean; suppressGreeting?: boolean } = {}
  ): void {
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
    this.activeHomePrompt = null
    this.suppressHeroWelcome = options.suppressHero === true
    this.suppressGreetingBubble = options.suppressGreeting === true
    if (!options.preserveIndex) this.wipeStoredMessages()
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
    // AND they haven't explicitly skipped (Skip persists across reloads).
    const needsPreChat =
      this.config.preChatFormEnabled &&
      !this.preChatSkipped &&
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
    this.clearOffTabAlert()
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
        this.convId,
        (msg) => this.handleIncoming(msg),
        (_status) => {
          // Could show connection status indicator
        },
        this.activeHomeCardId
      )
      this.forceNewCase = false
      // One-shot: cleared so a reconnect against this same conversation
      // doesn't keep re-sending the card id.
      this.activeHomeCardId = null
      this.socket.connect()
      // Slice 5 — replay any SDK-registered capabilities to the backend so
      // the agent's first turn sees them as tools. WidgetSocket queues
      // outbound messages until the WS is open, so this is safe to call
      // immediately after connect().
      this.sendSdkCapabilitiesRegistration()
      // Belt-and-suspenders: fall back to the global window storage in case
      // an event was missed between the dashboard publishing and the widget
      // mounting. Common on cold-start when the script bundle is cached and
      // the widget constructs before the host's publish useEffect has had a
      // microtask to run.
      const runtime = this.latestRuntimeContext ?? readLiraRuntimeContext() ?? null
      if (runtime) {
        this.latestRuntimeContext = runtime
        this.sendRuntimeContext(runtime)
      }

      // Add greeting message — unless:
      //   - this embed shows the first-visit hero welcome view (which IS the
      //     greeting, designed to look like a landing rather than a chat
      //     bubble); pushing the greeting here would make messages.length > 0
      //     and suppress the hero, OR
      //   - the visitor is entering via a home-card click (suppressGreeting),
      //     where their card-question replaces the need for a generic intro.
      if (
        this.messages.length === 0 &&
        this.config.greeting &&
        !this.config.autoOpenFirstVisit &&
        !this.suppressGreetingBubble
      ) {
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
      this.view = 'home'
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

    // Mark the auto-open as dismissed once the visitor sends ANY message —
    // they've engaged, so future page loads / re-logins shouldn't re-pop the
    // welcome panel. Previously markDismissed only fired on explicit Close,
    // so logging out (without clicking Close) caused the widget to auto-open
    // on every subsequent login, which the user found surprising.
    if (this.config.autoOpenFirstVisit) this.markDismissed()

    // Only refocus the textarea if it ALREADY held focus when send fired —
    // i.e. the visitor typed and hit Enter / clicked Send. Refocusing on a
    // chip/CTA-triggered send (where the activeElement was the button, not
    // the input) pops up the soft keyboard on tablet/phone with the user's
    // first message getting half-obscured by the keyboard. Heuristic: shadow
    // DOM's activeElement is the focused element inside the shadow; if it's
    // the inputEl, the user was typing — refocus to keep the typing flow
    // smooth. Otherwise, leave focus alone.
    const wasFocused =
      this.inputEl !== null && (this.shadow as ShadowRoot).activeElement === this.inputEl
    if (this.inputEl) {
      this.inputEl.value = ''
      this.inputEl.style.height = 'auto'
      if (wasFocused) this.inputEl.focus()
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
      this.upsertCurrentConversationSummary(msg.status)
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
        //
        // Important: do NOT pre-add the id to seenMessageIds here. If we do,
        // the first reply_chunk's appendChatMessage call short-circuits as a
        // dedup hit, no new bubble is appended, and the fallback
        // querySelectorAll('.lira-msg.lira') grabs the previous lira bubble
        // (e.g. the synthetic greeting) — subsequent chunks then stream INTO
        // that wrong bubble. appendChatMessage adds the id on first append.
        const id = msg.message_id ?? `lira_${Date.now()}`
        this.streamingMessageId = id
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
          // Look the bubble up by id rather than "last lira bubble in DOM".
          // The latter is fragile: if any other lira-role bubble exists in
          // the conversation surface (greeting, card, system message), it
          // would be picked instead and subsequent chunks would stream into
          // the wrong bubble.
          const sel = `.lira-msg.lira[data-msg-id="${CSS.escape(this.streamingMessageId)}"]`
          this.streamingBubbleEl = this.messagesEl?.querySelector<HTMLElement>(sel) ?? null
          if (this.view === 'launcher') {
            this.bumpUnread()
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
          this.bumpUnread()
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
            this.bumpUnread()
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
            this.bumpUnread()
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
          this.bumpUnread()
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

      case 'integration_warning': {
        // Dev-facing diagnostic. NOT shown in the chat UI — logged to the
        // browser console so the integrator's developer immediately sees the
        // cause + fix without contacting Lira support. This is the "attribute
        // misconfigurations to the integrator" principle in action.
        const code = msg.code ?? 'INTEGRATION_WARNING'
        const severity = msg.severity ?? 'warning'
        const head = `[Lira] ⚠ ${code} — running degraded`
        const body =
          (msg.message ?? '') +
          (msg.hint ? `\n\nFix: ${msg.hint}` : '') +
          (msg.docs ? `\n\nDocs: ${msg.docs}` : '') +
          (msg.context ? `\n\nContext: ${JSON.stringify(msg.context)}` : '') +
          '\n\nThis is a configuration issue on YOUR side, not a Lira platform outage. The widget keeps working — just without verified identity / full context — until this is fixed.'
        try {
          if (severity === 'error') {
            console.error(
              `%c${head}%c\n${body}`,
              'background:#fee2e2;color:#991b1b;padding:2px 6px;font-weight:600',
              'color:#991b1b'
            )
          } else {
            console.warn(
              `%c${head}%c\n${body}`,
              'background:#fef3c7;color:#92400e;padding:2px 6px;font-weight:600',
              'color:#92400e'
            )
          }
        } catch {
          /* console may be stubbed in some envs */
        }
        break
      }

      case 'welcome': {
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
        // Decide whether to render the welcome bubble. We surface it only
        // when the conversation surface is genuinely empty — if the visitor
        // already typed a question (e.g. they clicked a home card, which
        // sends their message before the welcome arrives), the welcome is
        // stale and inserting it would push the visitor's question BELOW a
        // generic greeting, which is the wrong order. The first-visit hero
        // is its own greeting too, so we skip then.
        const welcomeAllowed =
          msg.body &&
          !this.config.autoOpenFirstVisit &&
          this.messages.length === 0 &&
          this.messages[0]?.id !== 'greeting' &&
          // Home-card entry path: the visitor's question is already on its
          // way (queued in a requestAnimationFrame). If the server's welcome
          // wins the race, dropping a generic intro above the question would
          // recreate exactly the bad ordering we just fixed.
          !this.activeHomePrompt
        if (welcomeAllowed) {
          // appendChatMessage handles dedup + scroll + persistence and is
          // surgical — no full re-render, so it doesn't blow away an
          // in-flight input focus or scroll position.
          this.appendChatMessage({
            id: 'server_welcome',
            role: 'lira',
            body: msg.body!,
            timestamp: new Date().toISOString(),
          })
        }
        break
      }

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
            kind: msg.kind,
            steps: msg.steps,
            progress: msg.progress,
          },
        })
        if (this.view === 'launcher') {
          this.bumpUnread()
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
          this.bumpUnread()
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
      case 'lira_resource': {
        // Server-emitted resource fetch — agent wants a structured read
        // from the host page. The SDK's `registerResource` handler runs
        // and the result is dispatched as `lira:resource_result` and
        // forwarded back to the agent over the WS for the next turn.
        const resourceName =
          (msg as { resource_name?: string }).resource_name ??
          (msg as { resourceName?: string }).resourceName
        if (!resourceName) break
        try {
          const detail = {
            resource_name: resourceName,
            input: (msg as { input?: Record<string, unknown> }).input,
            payload: (msg as { payload?: Record<string, unknown> }).payload,
          }
          const event = new CustomEvent('lira:resource', { detail })
          window.dispatchEvent(event)
          void runRegisteredLiraResource(detail, event)
        } catch {
          /* CustomEvent unavailable, ignore */
        }
        break
      }
      case 'host_capability_request': {
        // Slice 5 — synthesized backend Tool call routed to a host-side
        // resource/action handler. Includes a request_id we MUST echo so
        // the backend can resolve its awaiting promise; on any error we
        // still send ok=false with the same request_id so the agent loop
        // does not hang waiting on a missed reply.
        const m = msg as {
          capability_kind?: 'resource' | 'action'
          name?: string
          input?: Record<string, unknown>
          request_id?: string
        }
        const requestId = m.request_id
        const capabilityKind = m.capability_kind
        const name = m.name
        if (!requestId || !name || (capabilityKind !== 'resource' && capabilityKind !== 'action')) {
          break
        }
        void runHostCapabilityRequest({
          kind: capabilityKind,
          name,
          input: m.input ?? {},
          requestId,
        })
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
              this.bumpUnread()
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

// Agentic runtime metadata. Kept in lockstep with the public SDK
// package types in packages/lira-support/src/types.ts — the SDK forwards
// `registerAction`/`registerResource` calls into `window.Lira` with this
// shape, so any drift here silently truncates host-supplied policy.
type LiraAuthScope = 'public' | 'verified_visitor' | 'verified_customer'
type LiraRiskTier =
  | 'read_public'
  | 'read_private'
  | 'safe_write'
  | 'customer_confirm'
  | 'step_up'
  | 'admin_approve'
  | 'human_only'
type LiraJsonSchema = {
  type: 'object'
  properties?: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
}
type LiraActionRegistrationOptions = {
  description?: string
  authScope?: LiraAuthScope
  risk?: LiraRiskTier
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
}

type LiraResourceRequest = {
  resourceName: string
  input: Record<string, unknown>
  payload: Record<string, unknown>
  rawEvent: CustomEvent
}
type LiraResourceResult = {
  ok: boolean
  data?: Record<string, unknown>
  message?: string
}
type LiraResourceHandler = (
  request: LiraResourceRequest
) =>
  | Promise<LiraResourceResult | Record<string, unknown> | void>
  | LiraResourceResult
  | Record<string, unknown>
  | void
type LiraResourceRegistrationOptions = {
  description?: string
  authScope?: LiraAuthScope
  risk?: Extract<LiraRiskTier, 'read_public' | 'read_private'>
  inputSchema?: LiraJsonSchema
  outputSchema?: LiraJsonSchema
}

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
  /**
   * Register a host-provided action. The optional 3rd argument carries the
   * agentic runtime metadata the policy engine reads when the agent asks
   * to call this action. Calls without options keep working unchanged.
   */
  registerAction: (
    name: string,
    handler: LiraActionHandler,
    options?: LiraActionRegistrationOptions
  ) => LiraPublicApi
  unregisterAction: (name: string) => LiraPublicApi
  /**
   * Register a host-provided resource — a read the agent can request from
   * the host page (e.g. current invoice, visible transaction, selected row).
   * Defaults to `authScope: 'verified_visitor'`, `risk: 'read_private'`.
   */
  registerResource: (
    name: string,
    handler: LiraResourceHandler,
    options?: LiraResourceRegistrationOptions
  ) => LiraPublicApi
  unregisterResource: (name: string) => LiraPublicApi
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

type RegisteredAction = {
  handler: LiraActionHandler
  options: LiraActionRegistrationOptions
}
type RegisteredResource = {
  handler: LiraResourceHandler
  options: LiraResourceRegistrationOptions
}
const sdkActionRegistry = new Map<string, RegisteredAction>()
const sdkResourceRegistry = new Map<string, RegisteredResource>()

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
  const entry =
    sdkActionRegistry.get(detail.action_type) ?? sdkActionRegistry.get(detail.target ?? '')
  if (!entry) return
  const handler = entry.handler

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

// Backend-initiated resource fetch. The agent asked the widget to read
// something from the host page (e.g. the current invoice the customer is
// viewing). We invoke the host's registered handler and forward the
// redacted result back through the WS so the next agent turn can see it.
async function runRegisteredLiraResource(
  detail: {
    resource_name: string
    input?: Record<string, unknown>
    payload?: Record<string, unknown>
  },
  rawEvent: CustomEvent
): Promise<void> {
  const entry = sdkResourceRegistry.get(detail.resource_name)
  if (!entry) return
  const handler = entry.handler

  const input = detail.input ?? detail.payload ?? {}
  const request: LiraResourceRequest = {
    resourceName: detail.resource_name,
    input,
    payload: input,
    rawEvent,
  }

  const emitResult = (resultDetail: {
    resourceName: string
    ok: boolean
    message?: string
    data: Record<string, unknown>
  }) => {
    window.dispatchEvent(new CustomEvent('lira:resource_result', { detail: resultDetail }))
    sdkWidget?.sendCustomerResourceResult?.(resultDetail)
  }

  try {
    const raw = await handler(request)
    const result: LiraResourceResult = normaliseResourceResult(raw)
    emitResult({
      resourceName: detail.resource_name,
      ok: result.ok,
      message: result.message,
      data: result.data ?? {},
    })
  } catch (error) {
    emitResult({
      resourceName: detail.resource_name,
      ok: false,
      message: error instanceof Error ? error.message : 'Resource lookup failed',
      data: {},
    })
  }
}

function normaliseResourceResult(
  raw: LiraResourceResult | Record<string, unknown> | void
): LiraResourceResult {
  if (!raw) return { ok: true, data: {} }
  if (
    typeof raw === 'object' &&
    'ok' in raw &&
    typeof (raw as LiraResourceResult).ok === 'boolean'
  ) {
    return raw as LiraResourceResult
  }
  return { ok: true, data: raw as Record<string, unknown> }
}

// Slice 5 — invoked when the backend agent calls a synthesized
// SDK-registered Tool. Looks up the host's registered handler, runs it,
// and replies with a host_capability_result carrying the same request_id.
// Always sends a reply (success or error) so the backend never blocks
// the agent loop waiting for a missed response.
async function runHostCapabilityRequest(detail: {
  kind: 'resource' | 'action'
  name: string
  input: Record<string, unknown>
  requestId: string
}): Promise<void> {
  const emitResult = (ok: boolean, message?: string, data: Record<string, unknown> = {}) => {
    sdkWidget?.sendHostCapabilityResult?.({
      request_id: detail.requestId,
      ok,
      message,
      data,
    })
  }

  try {
    if (detail.kind === 'resource') {
      const entry = sdkResourceRegistry.get(detail.name)
      if (!entry) {
        emitResult(false, `Resource '${detail.name}' is not registered on this host.`)
        return
      }
      const request: LiraResourceRequest = {
        resourceName: detail.name,
        input: detail.input,
        payload: detail.input,
        rawEvent: new CustomEvent('lira:resource', {
          detail: { resource_name: detail.name, input: detail.input },
        }),
      }
      const raw = await entry.handler(request)
      const result = normaliseResourceResult(raw)
      emitResult(result.ok, result.message, result.data ?? {})
      return
    }

    const entry = sdkActionRegistry.get(detail.name)
    if (!entry) {
      emitResult(false, `Action '${detail.name}' is not registered on this host.`)
      return
    }
    const request: LiraActionRequest = {
      actionType: detail.name,
      target: detail.name,
      value: undefined,
      payload: detail.input,
      rawEvent: new CustomEvent('lira:action', {
        detail: {
          action_type: detail.name,
          payload: detail.input,
        },
      }),
    }
    const result = (await entry.handler(request)) ?? { ok: true }
    emitResult(result.ok, result.message, result.data ?? {})
  } catch (err) {
    emitResult(false, err instanceof Error ? err.message : 'Host handler threw.')
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

  registerAction(
    name: string,
    handler: LiraActionHandler,
    options: LiraActionRegistrationOptions = {}
  ): LiraPublicApi {
    sdkActionRegistry.set(name, { handler, options })
    sdkWidget?.sendSdkCapabilitiesRegistration?.()
    return Lira
  },

  unregisterAction(name: string): LiraPublicApi {
    sdkActionRegistry.delete(name)
    return Lira
  },

  registerResource(
    name: string,
    handler: LiraResourceHandler,
    options: LiraResourceRegistrationOptions = {}
  ): LiraPublicApi {
    sdkResourceRegistry.set(name, {
      handler,
      options: {
        ...options,
        authScope: options.authScope ?? 'verified_visitor',
        risk: options.risk ?? 'read_private',
      },
    })
    sdkWidget?.sendSdkCapabilitiesRegistration?.()
    return Lira
  },

  unregisterResource(name: string): LiraPublicApi {
    sdkResourceRegistry.delete(name)
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
