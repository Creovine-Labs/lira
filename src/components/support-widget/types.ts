/**
 * Lira Support Widget — Shared types
 */

export interface WidgetConfig {
  orgId: string
  position?: 'bottom-right' | 'bottom-left'
  primaryColor?: string
  greeting?: string
  orgName?: string
  logoUrl?: string
  voiceEnabled?: boolean
  preChatFormEnabled?: boolean
  preChatFormFields?: string[]
  /** HMAC signature for identified visitors */
  visitorEmail?: string
  visitorName?: string
  visitorSig?: string
}

export interface ChatMessage {
  id: string
  role: 'customer' | 'lira' | 'agent' | 'system'
  body: string
  timestamp: string
  sender_name?: string // agent's first name
  sender_avatar?: string // agent's profile picture URL
  /** Optional generative-UI card rendered alongside the body. */
  card?: AgentCard
  /** Optional inline confirm prompt (HITL). */
  confirm?: AgentConfirm
  /** Optional action result chip (success/fail of a tool call). */
  actionResult?: { tool_name: string; ok: boolean; label: string }
}

export interface AgentCard {
  title?: string
  body?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
}

export interface AgentConfirm {
  pending_id: string
  tool_name: string
  title: string
  body: string
  /** Set once the customer clicks Approve or Cancel. */
  resolved?: 'approved' | 'declined'
}

export interface IncomingWsMessage {
  type:
    | 'reply'
    | 'reply_start'
    | 'reply_chunk'
    | 'reply_end'
    | 'status'
    | 'error'
    | 'escalated'
    | 'welcome'
    | 'typing'
    | 'agent_reply'
    | 'handback'
    | 'proactive'
    | 'history'
    | 'card'
    | 'confirm'
    | 'action_result'
    | 'navigate'
  body?: string
  conv_id?: string
  status?: string
  sender_name?: string
  sender_avatar?: string
  /** Groups reply_start / reply_chunk / reply_end events into a single message */
  message_id?: string
  // ── card / confirm / action_result / navigate fields ──────────────────
  title?: string
  fields?: Array<{ label: string; value: string }>
  badge?: { text: string; tone?: 'success' | 'warn' | 'error' | 'neutral' }
  messages?: Array<{
    id: string
    role: ChatMessage['role']
    body: string
    timestamp: string
    sender_name?: string
    sender_avatar?: string
  }>
  buttons?: Array<{ label: string; action: string; style?: 'primary' | 'secondary' | 'danger' }>
  pending_id?: string
  tool_name?: string
  ok?: boolean
  label?: string
  url?: string
  target?: '_self' | '_blank'
}

export interface OutgoingWsMessage {
  type: 'message' | 'typing' | 'end' | 'confirm_response'
  body?: string
  name?: string
  email?: string
  pending_id?: string
  approved?: boolean
}

export type WidgetView = 'launcher' | 'pre-chat' | 'chat' | 'csat'
