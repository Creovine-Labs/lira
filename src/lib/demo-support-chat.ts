import { useCallback, useEffect, useRef, useState } from 'react'
import { type DemoProfile, type PlanTier, updateDemoProfile } from './demo-profile'

const DEMO_ORG_ID = 'org-bfad94de-859d-4475-bcae-0107deaca433'
const WS_BASE = 'wss://api.creovine.com/lira/v1/support/chat'
const VISITOR_STORAGE_KEY = 'lira_visitor_id_session'

export type DemoSupportRole = 'customer' | 'lira' | 'agent' | 'system'
export type DemoSupportStatus = 'connecting' | 'connected' | 'disconnected'

export interface DemoActionCard {
  action_id: string
  tool_name: string
  label: string
  icon?: string
  status: 'pending' | 'success' | 'failed'
  detail?: string
  error?: string
}

export interface DemoGenerativeCard {
  title?: string
  body?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
}

export interface DemoConfirmPrompt {
  pending_id: string
  tool_name: string
  title: string
  body: string
  resolved?: 'approved' | 'declined'
}

export interface DemoActionResult {
  tool_name: string
  ok: boolean
  label: string
}

export interface DemoSupportMessage {
  id: string
  role: DemoSupportRole
  body: string
  timestamp: string
  sender_name?: string
  /** Inline action lifecycle card (Working on it…/✓ Done/⚠ Failed). */
  action?: DemoActionCard
  /** Generative UI card (title, fields, buttons, badge). */
  card?: DemoGenerativeCard
  /** HITL approve/decline prompt rendered as buttons. */
  confirm?: DemoConfirmPrompt
  /** Small ✓/✗ chip summarising a tool call result. */
  actionResult?: DemoActionResult
}

interface IncomingWsMessage {
  type:
    | 'welcome'
    | 'history'
    | 'typing'
    | 'reply_start'
    | 'reply_chunk'
    | 'reply_end'
    | 'reply'
    | 'agent_reply'
    | 'status'
    | 'escalated'
    | 'error'
    | 'card'
    | 'confirm'
    | 'action_started'
    | 'action_completed'
    | 'action_failed'
    | 'action_result'
    | 'demo_action_executed'
  body?: string
  conv_id?: string
  status?: string
  message_id?: string
  sender_name?: string
  messages?: Array<{
    id: string
    role: DemoSupportRole
    body: string
    timestamp: string
    sender_name?: string
  }>
  // card
  title?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
  // confirm
  pending_id?: string
  tool_name?: string
  // action lifecycle
  action_id?: string
  label?: string
  icon?: string
  detail?: string
  error?: string
  // action_result
  ok?: boolean
  // demo_action_executed
  action_type?: string
  payload?: Record<string, unknown>
}

function getOrCreateVisitorId(profile?: DemoProfile | null): string {
  if (profile?.visitor_id) {
    try {
      sessionStorage.setItem(VISITOR_STORAGE_KEY, profile.visitor_id)
    } catch {
      /* ignore */
    }
    return profile.visitor_id
  }

  try {
    const existing = sessionStorage.getItem(VISITOR_STORAGE_KEY)
    if (existing) return existing
  } catch {
    /* ignore */
  }

  const id = 'v_' + crypto.randomUUID()
  try {
    sessionStorage.setItem(VISITOR_STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

/**
 * Translate a server-emitted `demo_action_executed` event into a patch
 * applied to the visitor's local profile (sessionStorage). Keeps the
 * Nimbus dashboard at /demo in sync with actions Lira took inside the
 * /demo/help chat — so an upgrade or seat-add is visible the next time
 * the visitor navigates to the dashboard, in the same tab. New action
 * types are added here as we add more write tools to the Nimbus pack.
 */
function applyDemoActionToLocalProfile(actionType: string, payload: Record<string, unknown>): void {
  if (actionType === 'upgrade_plan') {
    const plan = payload.plan
    if (
      typeof plan === 'string' &&
      (plan === 'starter' || plan === 'growth' || plan === 'business')
    ) {
      // updateDemoProfile recomputes plan_label + last_invoice_amount_usd
      // from the new plan, so we don't need to set them here.
      updateDemoProfile({ plan: plan as PlanTier })
    }
    return
  }
  if (actionType === 'add_seat') {
    const seats = payload.team_seats
    if (typeof seats === 'number' && Number.isFinite(seats)) {
      updateDemoProfile({ team_seats: seats })
    }
    return
  }
  // 'request_refund' currently has no field on DemoProfile — emit event
  // received but no local mirror needed. A future "recent activity" card
  // on the dashboard can subscribe to the same event.
}

function buildDemoContext(profile: DemoProfile): Record<string, unknown> {
  return {
    visitor_id: profile.visitor_id,
    name: profile.name,
    plan: profile.plan,
    plan_label: profile.plan_label,
    open_issues: profile.open_issues,
    signed_up_at: profile.signed_up_at,
    last_invoice_amount_usd: profile.last_invoice_amount_usd,
    last_invoice_date: profile.last_invoice_date,
    next_invoice_date: profile.next_invoice_date,
    team_seats: profile.team_seats,
    is_synthetic: true,
    card: profile.card,
    subscription_status: profile.subscription_status,
  }
}

export function useDemoSupportChat(profile: DemoProfile | null) {
  const [messages, setMessages] = useState<DemoSupportMessage[]>([])
  const [status, setStatus] = useState<DemoSupportStatus>('connecting')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationStatus, setConversationStatus] = useState<string | null>(null)
  const [convId, setConvId] = useState<string | null>(null)
  const [visitorId, setVisitorId] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const streamingIdRef = useRef<string | null>(null)
  const forceNewCaseRef = useRef(false)
  const pendingMessagesRef = useRef<string[]>([])

  const appendMessage = useCallback((message: DemoSupportMessage) => {
    setMessages((current) => [...current, message])
  }, [])

  const connect = useCallback(() => {
    if (!profile) return

    setStatus('connecting')
    const visitorId = getOrCreateVisitorId(profile)
    setVisitorId(visitorId)

    const params = new URLSearchParams({ visitorId })
    if (forceNewCaseRef.current) {
      params.set('newCase', '1')
      forceNewCaseRef.current = false
    }

    const ws = new WebSocket(`${WS_BASE}/ws/${DEMO_ORG_ID}?${params.toString()}`)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('connected')
      ws.send(JSON.stringify({ type: 'demo_context', profile: buildDemoContext(profile) }))
      for (const body of pendingMessagesRef.current.splice(0)) {
        ws.send(JSON.stringify({ type: 'message', body }))
      }
    }

    ws.onmessage = (event) => {
      let msg: IncomingWsMessage
      try {
        msg = JSON.parse(event.data as string) as IncomingWsMessage
      } catch {
        return
      }

      if (msg.conv_id) setConvId(msg.conv_id)
      if (msg.status) setConversationStatus(msg.status)

      switch (msg.type) {
        case 'welcome':
          return

        case 'history':
          if (Array.isArray(msg.messages)) {
            setMessages(
              msg.messages.map((m) => ({
                id: m.id,
                role: m.role,
                body: m.body,
                timestamp: m.timestamp,
                sender_name: m.sender_name,
              }))
            )
          }
          return

        case 'typing':
          setIsTyping(true)
          return

        case 'reply_start': {
          setIsTyping(true)
          streamingIdRef.current = msg.message_id ?? `lira_${Date.now()}`
          return
        }

        case 'reply_chunk': {
          if (!msg.body) return
          setIsTyping(false)
          const id = streamingIdRef.current ?? `lira_${Date.now()}`
          streamingIdRef.current = id
          setMessages((current) => {
            const existingIndex = current.findIndex((m) => m.id === id)
            if (existingIndex === -1) {
              return [
                ...current,
                { id, role: 'lira', body: msg.body ?? '', timestamp: new Date().toISOString() },
              ]
            }
            return current.map((m, index) =>
              index === existingIndex ? { ...m, body: m.body + (msg.body ?? '') } : m
            )
          })
          return
        }

        case 'reply_end': {
          // If the server sent a corrected body (e.g. boilerplate closer
          // stripped post-stream), overwrite the streaming message body so
          // the user doesn't see the trimmed text linger in the bubble.
          const id = streamingIdRef.current
          if (id && typeof msg.body === 'string') {
            const corrected = msg.body
            setMessages((current) =>
              current.map((m) => (m.id === id ? { ...m, body: corrected } : m))
            )
          }
          setIsTyping(false)
          streamingIdRef.current = null
          return
        }

        case 'reply':
          setIsTyping(false)
          if (msg.body) {
            appendMessage({
              id: `lira_${Date.now()}`,
              role: 'lira',
              body: msg.body,
              timestamp: new Date().toISOString(),
            })
          }
          return

        case 'agent_reply':
          setIsTyping(false)
          if (msg.body) {
            appendMessage({
              id: `agent_${Date.now()}`,
              role: 'agent',
              body: msg.body,
              timestamp: new Date().toISOString(),
              sender_name: msg.sender_name,
            })
          }
          return

        case 'escalated':
          setIsTyping(false)
          setConversationStatus('escalated')
          appendMessage({
            id: `handoff_${Date.now()}`,
            role: 'system',
            body: msg.body ?? 'A teammate has been notified and will reply shortly.',
            timestamp: new Date().toISOString(),
          })
          return

        case 'status':
          setIsTyping(false)
          if (msg.body) {
            appendMessage({
              id: `status_${Date.now()}`,
              role: 'system',
              body: msg.body,
              timestamp: new Date().toISOString(),
            })
          }
          return

        case 'error':
          setIsTyping(false)
          appendMessage({
            id: `error_${Date.now()}`,
            role: 'system',
            body: msg.body ?? 'Something went wrong. Please try again.',
            timestamp: new Date().toISOString(),
          })
          return

        // ── Stage-2 wow-factor messages ───────────────────────────────────
        // The server already emits these for the widget; the full-page chat
        // now consumes them too so the demo shows real action execution,
        // approval prompts, and generative cards inline.
        case 'card': {
          setIsTyping(false)
          appendMessage({
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
          return
        }

        case 'confirm': {
          setIsTyping(false)
          if (!msg.pending_id || !msg.tool_name) return
          appendMessage({
            id: `confirm_${msg.pending_id}`,
            role: 'lira',
            body: '',
            timestamp: new Date().toISOString(),
            confirm: {
              pending_id: msg.pending_id,
              tool_name: msg.tool_name,
              title: msg.title ?? 'Confirm action',
              body: msg.body ?? 'Approve this action?',
            },
          })
          return
        }

        case 'action_started': {
          setIsTyping(false)
          if (!msg.action_id || !msg.tool_name) return
          appendMessage({
            id: `action_${msg.action_id}`,
            role: 'lira',
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
          const targetId = msg.action_id
          const detail = msg.detail
          setMessages((current) =>
            current.map((m) =>
              m.action && m.action.action_id === targetId
                ? { ...m, action: { ...m.action, status: 'success' as const, detail } }
                : m
            )
          )
          return
        }

        case 'action_failed': {
          if (!msg.action_id) return
          const targetId = msg.action_id
          const error = msg.error
          setMessages((current) =>
            current.map((m) =>
              m.action && m.action.action_id === targetId
                ? { ...m, action: { ...m.action, status: 'failed' as const, error } }
                : m
            )
          )
          return
        }

        case 'action_result': {
          if (!msg.tool_name || msg.ok === undefined) return
          appendMessage({
            id: `result_${Date.now()}`,
            role: 'lira',
            body: '',
            timestamp: new Date().toISOString(),
            actionResult: {
              tool_name: msg.tool_name,
              ok: msg.ok,
              label: msg.label ?? msg.tool_name,
            },
          })
          return
        }

        case 'demo_action_executed': {
          // Mirror the server-side mutation into the visitor's local demo
          // profile so the Nimbus dashboard at /demo reflects the change.
          // Maps a small set of action_type → DemoProfile patch shapes;
          // unknown action types are ignored silently.
          if (!msg.action_type || !msg.payload) return
          applyDemoActionToLocalProfile(msg.action_type, msg.payload)
          return
        }
      }
    }

    ws.onclose = () => {
      if (wsRef.current !== ws) return
      setStatus('disconnected')
    }

    ws.onerror = () => {
      setStatus('disconnected')
    }
  }, [appendMessage, profile])

  useEffect(() => {
    const mountTimer = window.setTimeout(connect, 0)
    return () => {
      window.clearTimeout(mountTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [connect])

  const sendMessage = useCallback(
    (body: string) => {
      const trimmed = body.trim()
      if (!trimmed) return

      appendMessage({
        id: `local_${Date.now()}`,
        role: 'customer',
        body: trimmed,
        timestamp: new Date().toISOString(),
      })
      setIsTyping(true)

      const payload = JSON.stringify({ type: 'message', body: trimmed })
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(payload)
      } else {
        pendingMessagesRef.current.push(trimmed)
      }
    },
    [appendMessage]
  )

  const respondToConfirm = useCallback((pendingId: string, approved: boolean) => {
    // Update the confirm bubble in-place so the user sees their choice
    // reflected immediately, even before the server acks.
    setMessages((current) =>
      current.map((m) =>
        m.confirm?.pending_id === pendingId
          ? { ...m, confirm: { ...m.confirm, resolved: approved ? 'approved' : 'declined' } }
          : m
      )
    )
    wsRef.current?.send(
      JSON.stringify({ type: 'confirm_response', pending_id: pendingId, approved })
    )
  }, [])

  const startNewConversation = useCallback(() => {
    forceNewCaseRef.current = true
    setMessages([])
    setConversationStatus(null)
    setConvId(null)
    setIsTyping(false)
    wsRef.current?.close()
    wsRef.current = null
    connect()
  }, [connect])

  return {
    messages,
    status,
    isTyping,
    conversationStatus,
    convId,
    visitorId,
    sendMessage,
    startNewConversation,
    respondToConfirm,
  }
}
