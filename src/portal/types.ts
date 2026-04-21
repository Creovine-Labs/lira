/**
 * Lira Support Portal — Shared types
 */

export interface PortalConfig {
  orgId: string
  orgSlug: string
  orgName: string
  logoUrl: string | null
  portalColor: string
  greeting: string
  chatEnabled: boolean
  voiceEnabled: boolean
  ticketsEnabled: boolean
  trackEnabled: boolean
  wsUrl: string
}

export interface PortalTicket {
  conv_id: string
  subject: string
  status: 'open' | 'pending' | 'resolved' | 'escalated'
  channel: 'email' | 'chat' | 'portal'
  created_at: string
  updated_at: string
  resolved_at?: string
  messages: PortalMessage[]
}

export interface PortalMessage {
  id: string
  role: 'customer' | 'lira' | 'agent'
  body: string
  timestamp: string
  sender_name?: string
}

export interface CustomerSession {
  customerId: string
  email: string
  name: string
  token: string
}
