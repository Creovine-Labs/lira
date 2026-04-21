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
  body?: string
  conv_id?: string
  status?: string
  sender_name?: string
  sender_avatar?: string
  /** Groups reply_start / reply_chunk / reply_end events into a single message */
  message_id?: string
}

export interface OutgoingWsMessage {
  type: 'message' | 'typing' | 'end'
  body?: string
  name?: string
  email?: string
}

export type WidgetView = 'launcher' | 'pre-chat' | 'chat' | 'csat'
