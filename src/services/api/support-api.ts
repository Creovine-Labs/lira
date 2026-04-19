import { env } from '@/env'
import { credentials } from './index'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SupportConfig {
  PK: string
  SK: string
  org_id: string
  activated: boolean
  activated_at?: string
  email_enabled: boolean
  email_address?: string
  custom_support_email?: string
  email_verified: boolean
  chat_enabled: boolean
  voice_enabled: boolean
  portal_enabled?: boolean
  portal_slug?: string
  auto_reply_enabled: boolean
  confidence_threshold: number
  force_escalate_intents: string[]
  escalation_slack_channel?: string
  escalation_linear_team?: string
  escalation_email?: string
  greeting_message?: string
  sla_hours?: number
  widget_color?: string
  max_conversations_per_month: number
  max_ai_replies_per_month: number
  conversations_this_month: number
  ai_replies_this_month: number
  onboarding_completed: boolean
  onboarding_step: string
  created_at: string
  updated_at: string
}

export type CustomerTier = 'standard' | 'vip' | 'enterprise'

export interface CustomerProfile {
  PK: string
  SK: string
  customer_id: string
  org_id: string
  name: string
  email: string
  phone?: string
  company?: string
  visitor_id?: string
  hubspot_contact_id?: string
  salesforce_contact_id?: string
  tier: CustomerTier
  total_conversations: number
  total_escalations: number
  last_contacted_at?: string
  created_at: string
  updated_at: string
}

export type ConversationStatus = 'open' | 'pending' | 'resolved' | 'escalated'
export type ConversationChannel = 'email' | 'chat' | 'voice' | 'portal'
export type MessageRole = 'customer' | 'lira' | 'agent'
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'urgent'

export interface ConversationMessage {
  id: string
  role: MessageRole
  body: string
  channel: ConversationChannel
  timestamp: string
  sender_name?: string
  sender_avatar?: string
  metadata?: {
    email_message_id?: string
    confidence?: number
    grounded_in?: string[]
  }
}

export interface SupportConversation {
  PK: string
  SK: string
  conv_id: string
  org_id: string
  customer_id: string
  channel: ConversationChannel
  subject?: string
  status: ConversationStatus
  resolution_type?: 'autonomous' | 'human' | 'failed'
  display_id?: number
  tags?: string[]
  summary?: string
  intent?: string
  sentiment?: Sentiment
  confidence?: number
  messages: ConversationMessage[]
  csat_score?: number
  csat_collected_at?: string
  ticket_id?: string
  action_ids: string[]
  knowledge_sources: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
  customer?: CustomerProfile
}

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface SupportTicket {
  PK: string
  SK: string
  ticket_id: string
  org_id: string
  conv_id: string
  customer_id: string
  subject: string
  priority: TicketPriority
  status: TicketStatus
  assigned_to?: string
  escalation_reason: string
  linear_issue_id?: string
  linear_issue_url?: string
  slack_thread_ts?: string
  sla_target: string
  sla_breach_notified_at?: string
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface SupportStats {
  total_conversations: number
  open_conversations: number
  resolved_autonomous: number
  resolved_human: number
  escalated: number
  avg_response_time_ms: number
  avg_csat: number
  conversations_this_month: number
  ai_replies_this_month: number
}

export interface ActionLog {
  action_id: string
  org_id: string
  conv_id: string
  action_type: string
  status: 'pending' | 'approved' | 'executed' | 'failed' | 'rejected'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  created_at: string
  executed_at?: string
}

export interface KBDraft {
  draft_id: string
  org_id: string
  conv_id: string
  title: string
  body: string
  gap_description: string
  status: 'pending_review' | 'approved' | 'rejected'
  created_at: string
  reviewed_at?: string
  reviewed_by?: string
}

export interface ProactiveTrigger {
  trigger_id: string
  org_id: string
  name: string
  event_type: string
  conditions: TriggerCondition[]
  outreach_template: string
  channel: 'email' | 'voice'
  enabled: boolean
  cooldown_hours: number
  max_per_customer_per_day: number
  created_at: string
  updated_at: string
}

export interface TriggerCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains'
  value: string | number
}

export interface OutreachLog {
  outreach_id: string
  org_id: string
  trigger_id: string
  customer_id: string
  channel: 'email' | 'voice'
  status: 'sent' | 'delivered' | 'failed'
  sent_at: string
  customer_name?: string
  trigger_name?: string
}

export interface WeeklyReport {
  period_start: string
  period_end: string
  total_conversations: number
  autonomous_resolutions: number
  escalations: number
  avg_response_time_ms: number
  avg_csat: number
  top_intents: { intent: string; count: number }[]
  kb_drafts_created: number
  kb_drafts_approved: number
}

// ── Fetch wrapper ─────────────────────────────────────────────────────────────

async function supportFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = credentials.getToken()
  const hasBody = init?.body != null

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    ...init,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })

  if (res.status === 401) {
    credentials.clear()
    window.dispatchEvent(new CustomEvent('lira:auth-expired'))
    throw new Error('Session expired — please sign in again.')
  }

  if (!res.ok) {
    let errBody: Record<string, string> = {}
    try {
      errBody = (await res.json()) as Record<string, string>
    } catch {
      // ignore
    }
    const msg = errBody['message'] ?? errBody['error'] ?? res.statusText
    throw new Error(`${res.status}: ${msg}`)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Config API ────────────────────────────────────────────────────────────────

export async function getSupportConfig(orgId: string): Promise<SupportConfig> {
  return supportFetch<SupportConfig>(`/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`)
}

export async function activateSupport(orgId: string): Promise<SupportConfig> {
  return supportFetch<SupportConfig>(
    `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}/activate`,
    { method: 'POST' }
  )
}

export async function updateSupportConfig(
  orgId: string,
  updates: Partial<SupportConfig>
): Promise<SupportConfig> {
  return supportFetch<SupportConfig>(`/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

// ── Customer API ──────────────────────────────────────────────────────────────

export async function listSupportCustomers(orgId: string): Promise<CustomerProfile[]> {
  const data = await supportFetch<{ customers: CustomerProfile[] }>(
    `/lira/v1/support/customers/orgs/${encodeURIComponent(orgId)}`
  )
  return data.customers
}

export async function getSupportCustomer(
  orgId: string,
  customerId: string
): Promise<CustomerProfile> {
  const data = await supportFetch<{ customer: CustomerProfile }>(
    `/lira/v1/support/customers/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(customerId)}`
  )
  return data.customer
}

export async function createSupportCustomer(
  orgId: string,
  input: { name: string; email: string; phone?: string; company?: string; tier?: CustomerTier }
): Promise<CustomerProfile> {
  const data = await supportFetch<{ customer: CustomerProfile }>(
    `/lira/v1/support/customers/orgs/${encodeURIComponent(orgId)}`,
    { method: 'POST', body: JSON.stringify(input) }
  )
  return data.customer
}

export async function updateSupportCustomer(
  orgId: string,
  customerId: string,
  updates: Partial<CustomerProfile>
): Promise<CustomerProfile> {
  const data = await supportFetch<{ customer: CustomerProfile }>(
    `/lira/v1/support/customers/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(customerId)}`,
    { method: 'PUT', body: JSON.stringify(updates) }
  )
  return data.customer
}

// ── Conversation / Inbox API ──────────────────────────────────────────────────

export async function listConversations(
  orgId: string,
  status?: ConversationStatus
): Promise<SupportConversation[]> {
  const params = status ? `?status=${status}` : ''
  const data = await supportFetch<{ conversations: SupportConversation[] }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}${params}`
  )
  return data.conversations
}

export async function getConversation(orgId: string, convId: string): Promise<SupportConversation> {
  const data = await supportFetch<{
    conversation: SupportConversation
    customer?: CustomerProfile
  }>(`/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}`)
  // Merge customer into conversation so callers get a unified object
  return data.customer ? { ...data.conversation, customer: data.customer } : data.conversation
}

export async function sendConversationReply(
  orgId: string,
  convId: string,
  body: string
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/reply`,
    { method: 'POST', body: JSON.stringify({ orgId, body }) }
  )
}

export async function resolveConversation(orgId: string, convId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/resolve`,
    { method: 'POST', body: JSON.stringify({ orgId }) }
  )
}

export async function deleteConversation(orgId: string, convId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}`,
    { method: 'DELETE' }
  )
}

export async function handbackToLira(orgId: string, convId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/handback`,
    { method: 'POST' }
  )
}

export async function escalateConversation(
  orgId: string,
  convId: string,
  reason: string
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/escalate`,
    { method: 'POST', body: JSON.stringify({ orgId, reason }) }
  )
}

// ── Stats API ─────────────────────────────────────────────────────────────────

export async function getSupportStats(orgId: string): Promise<SupportStats> {
  const data = await supportFetch<{ stats: SupportStats }>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/stats`
  )
  return data.stats
}

export async function getWeeklyReport(orgId: string): Promise<WeeklyReport> {
  const data = await supportFetch<{ report: WeeklyReport }>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/weekly-report`
  )
  return data.report
}

// ── Actions API (Phase 3) ─────────────────────────────────────────────────────

export async function listActions(orgId: string, status?: string): Promise<ActionLog[]> {
  const params = status ? `?status=${status}` : ''
  const data = await supportFetch<{ actions: ActionLog[] }>(
    `/lira/v1/support/actions/orgs/${encodeURIComponent(orgId)}${params}`
  )
  return data.actions
}

export async function approveAction(orgId: string, actionId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/actions/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(actionId)}/approve`,
    { method: 'POST' }
  )
}

export async function rejectAction(orgId: string, actionId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/actions/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(actionId)}/reject`,
    { method: 'POST' }
  )
}

// ── KB Drafts API (Phase 6) ──────────────────────────────────────────────────

export async function listKBDrafts(orgId: string): Promise<KBDraft[]> {
  const data = await supportFetch<{ drafts: KBDraft[] }>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/kb-drafts`
  )
  return data.drafts
}

export async function approveKBDraft(
  orgId: string,
  draftId: string,
  edits?: { title?: string; body?: string }
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/kb-drafts/${encodeURIComponent(draftId)}/approve`,
    { method: 'POST', body: JSON.stringify(edits ?? {}) }
  )
}

export async function rejectKBDraft(orgId: string, draftId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/kb-drafts/${encodeURIComponent(draftId)}/reject`,
    { method: 'POST' }
  )
}

// ── Proactive Triggers API (Phase 5) ─────────────────────────────────────────

export async function listTriggers(orgId: string): Promise<ProactiveTrigger[]> {
  const data = await supportFetch<{ triggers: ProactiveTrigger[] }>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/triggers`
  )
  return data.triggers
}

export async function createTrigger(
  orgId: string,
  input: Omit<ProactiveTrigger, 'trigger_id' | 'org_id' | 'created_at' | 'updated_at'>
): Promise<ProactiveTrigger> {
  const data = await supportFetch<{ trigger: ProactiveTrigger }>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/triggers`,
    { method: 'POST', body: JSON.stringify(input) }
  )
  return data.trigger
}

export async function updateTrigger(
  orgId: string,
  triggerId: string,
  updates: Partial<ProactiveTrigger>
): Promise<ProactiveTrigger> {
  const data = await supportFetch<{ trigger: ProactiveTrigger }>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/triggers/${encodeURIComponent(triggerId)}`,
    { method: 'PUT', body: JSON.stringify(updates) }
  )
  return data.trigger
}

export async function deleteTrigger(orgId: string, triggerId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/triggers/${encodeURIComponent(triggerId)}`,
    { method: 'DELETE' }
  )
}

export async function listOutreachLogs(orgId: string): Promise<OutreachLog[]> {
  const data = await supportFetch<{ logs: OutreachLog[] }>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/outreach`
  )
  return data.logs
}

// ── Escalation Alerts ─────────────────────────────────────────────────────────

export interface EscalationAlert {
  alert_id: string
  org_id: string
  ticket_id: string
  conv_id: string
  subject: string
  reason: string
  read: boolean
  created_at: string
}

export async function listEscalationAlerts(
  orgId: string
): Promise<{ alerts: EscalationAlert[]; count: number }> {
  return supportFetch<{ alerts: EscalationAlert[]; count: number }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/alerts`
  )
}

export async function markEscalationAlertsRead(orgId: string): Promise<void> {
  await supportFetch<void>(`/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/alerts/read`, {
    method: 'POST',
  })
}

// ── Tags API ──────────────────────────────────────────────────────────────────

export async function updateConversationTags(
  orgId: string,
  convId: string,
  tags: string[]
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/tags`,
    { method: 'PUT', body: JSON.stringify({ tags }) }
  )
}

// ── Summary API ───────────────────────────────────────────────────────────────

export async function summarizeConversation(orgId: string, convId: string): Promise<string> {
  const data = await supportFetch<{ summary: string }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/summarize`,
    { method: 'POST' }
  )
  return data.summary
}

// ── Typing Indicator API ──────────────────────────────────────────────────────

export async function sendTypingIndicator(orgId: string, convId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/typing`,
    { method: 'POST' }
  )
}

// ── Customer Conversations API ────────────────────────────────────────────────

export async function listCustomerConversations(
  orgId: string,
  customerId: string
): Promise<{ conversations: SupportConversation[]; customer: CustomerProfile | null }> {
  return supportFetch<{ conversations: SupportConversation[]; customer: CustomerProfile | null }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/customers/${encodeURIComponent(customerId)}/conversations`
  )
}

// ── Customer Merge API ────────────────────────────────────────────────────────

export async function mergeCustomers(
  orgId: string,
  primaryId: string,
  secondaryId: string
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/customers/merge`,
    { method: 'POST', body: JSON.stringify({ primaryId, secondaryId }) }
  )
}

export async function sendProactiveMessage(
  orgId: string,
  customerId: string,
  message: string,
  subject?: string
): Promise<SupportConversation> {
  const data = await supportFetch<{ conversation: SupportConversation }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/proactive`,
    { method: 'POST', body: JSON.stringify({ customerId, message, subject }) }
  )
  return data.conversation
}
