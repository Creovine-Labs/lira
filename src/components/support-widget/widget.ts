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

// ── SVG icons ─────────────────────────────────────────────────────────────────

const ICON_CHAT = `<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.62 1.23 4.98 3.16 6.6L4 22l4.64-2.32C9.69 19.89 10.82 20 12 20c5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>`
const ICON_CLOSE = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>`
const ICON_SEND = `<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>`
// Lira logo for the bot avatar — hosted on the main frontend
const LIRA_LOGO_URL = 'https://liraintelligence.com/lira_black.png'
const ICON_LIRA = `<img src="${LIRA_LOGO_URL}" alt="Lira" style="width:100%;height:100%;object-fit:contain;border-radius:50%;" />`
const ICON_PHONE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>`
const ICON_PHONE_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-1.88-1.54M2.71 2.71L1 1M6.19 6.19A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`

// ── Visitor ID persistence ────────────────────────────────────────────────────

function getOrCreateVisitorId(): string {
  const KEY = 'lira_visitor_id'
  try {
    const existing = localStorage.getItem(KEY)
    if (existing) return existing
  } catch {
    // localStorage not available
  }
  const id = 'v_' + crypto.randomUUID()
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // Ignore
  }
  return id
}

// ── Message persistence (localStorage) ────────────────────────────────────────

function getStorageKey(orgId: string): string {
  return `lira_chat_${orgId}`
}

function saveMessages(orgId: string, messages: ChatMessage[], convId: string | null): void {
  try {
    const payload = JSON.stringify({ messages, convId, ts: Date.now() })
    localStorage.setItem(getStorageKey(orgId), payload)
  } catch {
    /* quota exceeded or unavailable */
  }
}

function loadMessages(orgId: string): { messages: ChatMessage[]; convId: string | null } | null {
  try {
    const raw = localStorage.getItem(getStorageKey(orgId))
    if (!raw) return null
    const data = JSON.parse(raw)
    // Expire after 24 hours
    if (Date.now() - (data.ts ?? 0) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(getStorageKey(orgId))
      return null
    }
    return { messages: data.messages ?? [], convId: data.convId ?? null }
  } catch {
    return null
  }
}

function clearStoredMessages(orgId: string): void {
  try {
    localStorage.removeItem(getStorageKey(orgId))
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
  private socket: WidgetSocket | null = null
  private visitorId: string
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

  // Streaming reply state — set when a reply_start arrives, cleared on reply_end
  private streamingMessageId: string | null = null
  private streamingBubbleEl: HTMLElement | null = null

  // DOM references
  private host: HTMLElement
  private shadow: ShadowRoot
  private messagesEl: HTMLElement | null = null
  private inputEl: HTMLTextAreaElement | null = null

  constructor(config: WidgetConfig) {
    this.config = {
      position: 'bottom-right',
      primaryColor: '#3730a3',
      greeting: 'Hi! How can we help you today?',
      ...config,
    }
    this.visitorId = getOrCreateVisitorId()

    // Restore persisted messages
    const stored = loadMessages(this.config.orgId)
    if (stored) {
      this.messages = stored.messages
      this.convId = stored.convId
      for (const m of this.messages) this.seenMessageIds.add(m.id)
    }

    // Create host element with Shadow DOM
    this.host = document.createElement('div')
    this.host.id = 'lira-support-widget'
    this.shadow = this.host.attachShadow({ mode: 'closed' })

    // Inject styles
    const style = document.createElement('style')
    style.textContent = getWidgetStyles(this.config.primaryColor!)
    this.shadow.appendChild(style)

    document.body.appendChild(this.host)
    this.render()

    // Fetch org config (name, logo, color) eagerly so the launcher button reflects the brand color
    this.fetchWidgetConfig()
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
    } else if (this.view === 'pre-chat') {
      this.renderPreChatForm()
    } else if (this.view === 'chat') {
      this.renderChat()
    } else if (this.view === 'csat') {
      this.renderCsat()
    }

    // Persist messages to localStorage after every render that has messages
    if (this.messages.length > 0) {
      saveMessages(this.config.orgId, this.messages, this.convId)
    }
  }

  private renderLauncher(): void {
    const btn = document.createElement('button')
    btn.className = `lira-launcher ${this.config.position}`
    btn.innerHTML = ICON_CHAT
    btn.setAttribute('aria-label', 'Open chat')
    btn.onclick = () => this.open()
    if (this.unreadCount > 0) {
      const badge = document.createElement('span')
      badge.className = 'lira-unread-badge'
      btn.appendChild(badge)
    }
    this.shadow.appendChild(btn)
  }

  private renderPreChatForm(): void {
    const win = document.createElement('div')
    win.className = `lira-chat-window ${this.config.position}`

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
      'Powered by <a href="https://liraintelligence.com" target="_blank" rel="noopener">Lira</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)
    this.renderLauncher()
  }

  private renderChat(): void {
    const win = document.createElement('div')
    win.className = `lira-chat-window ${this.config.position}`

    // Header
    const header = document.createElement('div')
    header.className = 'lira-header'

    const orgName = this.config.orgName || 'Support'
    const logoUrl = this.config.logoUrl
    const initial = orgName.charAt(0).toUpperCase()

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
    newChatBtn.textContent = 'Clear'
    newChatBtn.setAttribute('aria-label', 'Clear conversation')
    newChatBtn.setAttribute('title', 'Clear conversation')
    newChatBtn.onclick = () => this.startNewConversation()
    actions.appendChild(newChatBtn)

    // Voice call button (only if org has voice enabled)
    if (this.config.voiceEnabled) {
      const callBtn = document.createElement('button')
      callBtn.className =
        'lira-header-btn' + (this.voiceState === 'active' ? ' lira-call-active' : '')
      callBtn.innerHTML = this.voiceState === 'active' ? ICON_PHONE_OFF : ICON_PHONE
      callBtn.setAttribute(
        'aria-label',
        this.voiceState === 'active' ? 'End call' : 'Start voice call'
      )
      callBtn.setAttribute('title', this.voiceState === 'active' ? 'End call' : 'Call Lira')
      callBtn.onclick = () => {
        if (this.voiceState === 'active' || this.voiceState === 'connecting') {
          this.endVoiceCall()
        } else {
          this.startVoiceCall()
        }
      }
      actions.appendChild(callBtn)
    }

    const closeBtn = document.createElement('button')
    closeBtn.className = 'lira-header-btn'
    closeBtn.innerHTML = ICON_CLOSE
    closeBtn.setAttribute('aria-label', 'Close chat')
    closeBtn.onclick = () => this.close()
    actions.appendChild(closeBtn)

    header.appendChild(actions)
    win.appendChild(header)

    // Messages
    const messagesDiv = document.createElement('div')
    messagesDiv.className = 'lira-messages'

    for (const msg of this.messages) {
      if (msg.role === 'customer') {
        const msgEl = document.createElement('div')
        msgEl.className = 'lira-msg customer'
        msgEl.textContent = msg.body
        messagesDiv.appendChild(msgEl)
        continue
      }
      if (msg.role === 'system') {
        const msgEl = document.createElement('div')
        msgEl.className = 'lira-msg system'
        msgEl.textContent = msg.body
        messagesDiv.appendChild(msgEl)
        continue
      }
      // lira or agent — group-chat style row with avatar
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

      if (msg.role === 'lira') {
        const nameEl = document.createElement('div')
        nameEl.className = 'lira-msg-name'
        nameEl.textContent = 'Lira'
        bodyDiv.appendChild(nameEl)
      } else if (msg.role === 'agent' && msg.sender_name) {
        const nameEl = document.createElement('div')
        nameEl.className = 'lira-msg-name'
        nameEl.textContent = msg.sender_name
        bodyDiv.appendChild(nameEl)
      }

      const bubble = document.createElement('div')
      bubble.className = `lira-msg ${msg.role}`
      bubble.textContent = msg.body
      bodyDiv.appendChild(bubble)

      row.appendChild(avatarDiv)
      row.appendChild(bodyDiv)
      messagesDiv.appendChild(row)
    }

    if (this.isTyping) {
      const typingRow = document.createElement('div')
      typingRow.className = 'lira-typing-row'
      const typingAvatar = document.createElement('div')
      typingAvatar.className = 'lira-msg-avatar lira-avatar'
      typingAvatar.innerHTML = ICON_LIRA
      typingRow.appendChild(typingAvatar)
      const typing = document.createElement('div')
      typing.className = 'lira-typing'
      typing.innerHTML = '<span></span><span></span><span></span>'
      typingRow.appendChild(typing)
      messagesDiv.appendChild(typingRow)
    }

    win.appendChild(messagesDiv)
    this.messagesEl = messagesDiv

    // Voice call overlay (shown when a call is active)
    if (this.voiceState === 'connecting' || this.voiceState === 'active') {
      const overlay = document.createElement('div')
      overlay.className = 'lira-voice-overlay'

      const avatarEl = document.createElement('div')
      avatarEl.className =
        'lira-voice-avatar' + (this.voiceState === 'active' ? ' lira-voice-pulse' : '')
      avatarEl.innerHTML = ICON_LIRA
      overlay.appendChild(avatarEl)

      const label = document.createElement('div')
      label.className = 'lira-voice-label'
      label.textContent = this.voiceState === 'connecting' ? 'Connecting...' : 'Speaking with Lira'
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
    win.appendChild(inputArea)

    // Powered by
    const powered = document.createElement('div')
    powered.className = 'lira-powered'
    powered.innerHTML =
      'Powered by <a href="https://liraintelligence.com" target="_blank" rel="noopener">Lira</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)

    // Also render launcher (minimized state)
    this.renderLauncher()

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
    win.className = `lira-chat-window ${this.config.position}`

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
      if (msg.role === 'customer') {
        const msgEl = document.createElement('div')
        msgEl.className = 'lira-msg customer'
        msgEl.textContent = msg.body
        messagesDiv.appendChild(msgEl)
        continue
      }
      if (msg.role === 'system') {
        const msgEl = document.createElement('div')
        msgEl.className = 'lira-msg system'
        msgEl.textContent = msg.body
        messagesDiv.appendChild(msgEl)
        continue
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
      if (msg.role === 'lira') {
        const nameEl = document.createElement('div')
        nameEl.className = 'lira-msg-name'
        nameEl.textContent = 'Lira'
        bodyDiv.appendChild(nameEl)
      } else if (msg.role === 'agent' && msg.sender_name) {
        const nameEl = document.createElement('div')
        nameEl.className = 'lira-msg-name'
        nameEl.textContent = msg.sender_name
        bodyDiv.appendChild(nameEl)
      }
      const bubble = document.createElement('div')
      bubble.className = `lira-msg ${msg.role}`
      bubble.textContent = msg.body
      bodyDiv.appendChild(bubble)
      row.appendChild(avatarDiv)
      row.appendChild(bodyDiv)
      messagesDiv.appendChild(row)
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
      'Powered by <a href="https://liraintelligence.com" target="_blank" rel="noopener">Lira</a>'
    win.appendChild(powered)

    this.shadow.appendChild(win)
    this.renderLauncher()
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  private startVoiceCall(): void {
    if (this.voiceCall) return

    this.voiceCall = new WidgetVoiceCall(this.config.orgId, this.visitorId, {
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
    })

    this.voiceCall.start()
  }

  private endVoiceCall(): void {
    if (this.voiceCall) {
      this.voiceCall.end()
    }
    if (this.callTimer) {
      clearInterval(this.callTimer)
      this.callTimer = null
    }
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

  /** Append a single message to the chat — no DOM rebuild */
  private appendChatMessage(msg: ChatMessage): void {
    this.messages.push(msg)
    if (this.messagesEl) {
      const el = this.buildMessageEl(msg)
      this.messagesEl.appendChild(el)
      requestAnimationFrame(() => {
        if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight
      })
    }
    saveMessages(this.config.orgId, this.messages, this.convId)
  }

  private buildMessageEl(msg: ChatMessage): HTMLElement {
    if (msg.role === 'customer') {
      const el = document.createElement('div')
      el.className = 'lira-msg customer'
      el.textContent = msg.body
      return el
    }
    if (msg.role === 'system') {
      const el = document.createElement('div')
      el.className = 'lira-msg system'
      el.textContent = msg.body
      return el
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
    bubble.textContent = msg.body
    bodyDiv.appendChild(bubble)
    row.appendChild(avatarDiv)
    row.appendChild(bodyDiv)
    return row
  }

  private startNewConversation(): void {
    this.socket?.disconnect()
    this.socket = null
    this.messages = []
    this.convId = null
    this.isTyping = false
    this.isResolved = false
    this.csatSubmitted = false
    this.seenMessageIds.clear()
    this.stopPolling()
    clearStoredMessages(this.config.orgId)
    // Re-open fresh (will reconnect socket and add greeting)
    this.open()
  }

  private open(): void {
    // Show pre-chat form if enabled AND visitor hasn't provided identity yet
    const needsPreChat =
      this.config.preChatFormEnabled &&
      !this.config.visitorEmail &&
      !this.config.visitorName &&
      this.messages.length === 0

    if (needsPreChat) {
      this.view = 'pre-chat'
      this.render()
      return
    }

    this.view = 'chat'
    this.unreadCount = 0

    // Connect WebSocket on first open
    if (!this.socket) {
      this.socket = new WidgetSocket(
        this.config,
        this.visitorId,
        (msg) => this.handleIncoming(msg),
        (_status) => {
          // Could show connection status indicator
        }
      )
      this.socket.connect()

      // Add greeting message
      if (this.messages.length === 0 && this.config.greeting) {
        this.messages.push({
          id: 'greeting',
          role: 'lira',
          body: this.config.greeting,
          timestamp: new Date().toISOString(),
        })
      }
    }

    this.render()
  }

  private close(): void {
    this.view = 'launcher'
    this.stopPolling()
    this.render()
  }

  private sendMessage(): void {
    const body = this.inputEl?.value.trim()
    if (!body) return

    // Add to local messages
    this.messages.push({
      id: `local_${Date.now()}`,
      role: 'customer',
      body,
      timestamp: new Date().toISOString(),
    })

    // Send via WebSocket
    this.socket?.send({
      type: 'message',
      body,
      name: this.config.visitorName,
      email: this.config.visitorEmail,
    })

    // Clear input
    if (this.inputEl) {
      this.inputEl.value = ''
      this.inputEl.style.height = 'auto'
    }

    this.render()
  }

  private handleIncoming(msg: IncomingWsMessage): void {
    // Always capture conv_id when the server provides it
    if (msg.conv_id) this.convId = msg.conv_id

    switch (msg.type) {
      case 'typing':
        this.isTyping = true
        this.render()
        break

      case 'reply_start': {
        // Streaming reply about to begin — create empty lira message, stop typing dots
        this.isTyping = false
        const id = msg.message_id ?? `lira_${Date.now()}`
        this.streamingMessageId = id
        this.messages.push({
          id,
          role: 'lira',
          body: '',
          timestamp: new Date().toISOString(),
        })
        this.seenMessageIds.add(id)
        this.render()
        // Locate the last lira bubble in the rendered DOM so chunks can append into it
        const bubbles = this.messagesEl?.querySelectorAll<HTMLElement>('.lira-msg.lira') ?? []
        this.streamingBubbleEl = bubbles.length > 0 ? bubbles[bubbles.length - 1] : null
        break
      }

      case 'reply_chunk': {
        // Append delta to the active streaming message. Direct DOM update
        // to avoid re-rendering the whole widget on every token.
        if (!msg.body) break
        const activeMsg = this.messages.find((m) => m.id === this.streamingMessageId)
        if (activeMsg) activeMsg.body += msg.body
        if (this.streamingBubbleEl) {
          this.streamingBubbleEl.textContent =
            activeMsg?.body ?? this.streamingBubbleEl.textContent + msg.body
          // Keep pinned to bottom while streaming
          if (this.messagesEl) this.messagesEl.scrollTop = this.messagesEl.scrollHeight
        }
        if (this.view === 'launcher') this.unreadCount++
        break
      }

      case 'reply_end':
        // Persist the finalized message and clear streaming refs
        this.streamingMessageId = null
        this.streamingBubbleEl = null
        saveMessages(this.config.orgId, this.messages, this.convId)
        break

      case 'reply':
        this.isTyping = false
        if (msg.body) {
          this.messages.push({
            id: `lira_${Date.now()}`,
            role: 'lira',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
          if (this.view === 'launcher') this.unreadCount++
        }
        this.render()
        break

      case 'agent_reply':
        // Direct WS push from agent replying in the Lira inbox
        this.isTyping = false
        if (msg.body) {
          const id = `agent_ws_${Date.now()}`
          this.seenMessageIds.add(id)
          this.messages.push({
            id,
            role: 'agent',
            body: msg.body,
            timestamp: new Date().toISOString(),
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
          })
          if (this.view === 'launcher') this.unreadCount++
        }
        this.render()
        break

      case 'proactive':
        // Agent initiated a new conversation proactively
        this.isTyping = false
        if (msg.conv_id) {
          this.convId = msg.conv_id
        }
        if (msg.body) {
          const pid = `proactive_${Date.now()}`
          this.seenMessageIds.add(pid)
          this.messages.push({
            id: pid,
            role: 'agent',
            body: msg.body,
            timestamp: new Date().toISOString(),
            sender_name: msg.sender_name,
            sender_avatar: msg.sender_avatar,
          })
        }
        this.isResolved = false
        if (this.view === 'launcher') this.unreadCount++
        this.render()
        break

      case 'escalated':
        this.isTyping = false
        if (msg.body) {
          this.messages.push({
            id: `sys_${Date.now()}`,
            role: 'agent',
            body: msg.body,
            timestamp: new Date().toISOString(),
          })
        }
        // Start HTTP polling so agent replies reach the customer even if WS drops
        this.startPolling()
        this.render()
        break

      case 'status':
        this.isTyping = false
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
        }
        break

      case 'handback':
        // Agent handed conversation back to Lira AI
        this.isTyping = false
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
        // Server may send a welcome message
        if (msg.body && this.messages[0]?.id !== 'greeting') {
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
        this.isTyping = false
        this.messages.push({
          id: `err_${Date.now()}`,
          role: 'lira',
          body: msg.body ?? 'Something went wrong. Please try again.',
          timestamp: new Date().toISOString(),
        })
        this.render()
        break
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
    this.lastPollTime = new Date().toISOString()

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

        let updated = false
        for (const m of data.messages) {
          if (!this.seenMessageIds.has(m.id)) {
            this.seenMessageIds.add(m.id)
            this.messages.push({
              id: m.id,
              role: 'agent',
              body: m.body,
              timestamp: m.timestamp,
              sender_name: m.sender_name,
              sender_avatar: m.sender_avatar,
            })
            if (this.view === 'launcher') this.unreadCount++
            updated = true
          }
        }
        this.lastPollTime = new Date().toISOString()
        if (updated) this.render()
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
    this.host.remove()
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
    position: (el.dataset.position as WidgetConfig['position']) ?? 'bottom-right',
    primaryColor: el.dataset.color ?? '#3730a3',
    greeting: el.dataset.greeting ?? 'Hi! How can we help you today?',
    orgName: el.dataset.title ?? undefined,
    logoUrl: el.dataset.logo ?? undefined,
    visitorEmail: el.dataset.email,
    visitorName: el.dataset.name,
    visitorSig: el.dataset.sig,
  }
}

function init(): void {
  // Priority 1: window.LiraWidgetConfig (Intercom/Chatwoot-style pre-configuration)
  // Allows: <script>window.LiraWidgetConfig = { orgId: '...' };</script>
  //         <script async src=".../widget.js"></script>
  const windowConfig = (window as unknown as Record<string, unknown>).LiraWidgetConfig as
    | WidgetConfig
    | undefined
  if (windowConfig?.orgId) {
    const widget = new LiraSupportWidget(windowConfig)
    ;(window as unknown as Record<string, unknown>).LiraWidget = widget
    return
  }

  // Priority 2: data-* attributes on the script tag (captured at top level)
  if (_currentScript) {
    const config = readConfigFromScript(_currentScript)
    if (config) {
      const widget = new LiraSupportWidget(config)
      ;(window as unknown as Record<string, unknown>).LiraWidget = widget
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
      const widget = new LiraSupportWidget(config)
      ;(window as unknown as Record<string, unknown>).LiraWidget = widget
      return
    }
  }

  console.warn(
    '[Lira Widget] No configuration found. Either set window.LiraWidgetConfig = { orgId: "..." } ' +
      'or add data-org-id to the script tag.'
  )
}

// Run on DOMContentLoaded if DOM isn't ready, otherwise immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
