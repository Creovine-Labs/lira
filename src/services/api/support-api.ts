import { env } from '@/env'
import { credentials } from './index'

// ── Types ─────────────────────────────────────────────────────────────────────

/** Handoff Layer (§6.2) — automatic escalation triggers, tunable per org. */
export interface HandoffTriggersConfig {
  sentiment_enabled?: boolean
  repeated_failure_enabled?: boolean
  repeated_failure_threshold?: number
  vip_auto_enabled?: boolean
  multi_turn_confusion_enabled?: boolean
  multi_turn_confusion_threshold?: number
  sla_pressure_enabled?: boolean
  sla_pressure_minutes?: number
}

/** Built-in defaults — mirror HANDOFF_TRIGGER_DEFAULTS on the backend. */
export const HANDOFF_TRIGGER_DEFAULTS: Required<HandoffTriggersConfig> = {
  sentiment_enabled: true,
  repeated_failure_enabled: true,
  repeated_failure_threshold: 3,
  vip_auto_enabled: true,
  multi_turn_confusion_enabled: true,
  multi_turn_confusion_threshold: 3,
  sla_pressure_enabled: true,
  sla_pressure_minutes: 30,
}

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
  custom_domain?: string
  portal_color?: string
  portal_logo_url?: string
  portal_greeting?: string
  portal_chat_enabled?: boolean
  portal_voice_enabled?: boolean
  portal_tickets_enabled?: boolean
  portal_track_enabled?: boolean
  auto_reply_enabled: boolean
  confidence_threshold: number
  force_escalate_intents: string[]
  escalation_slack_channel?: string
  escalation_linear_team?: string
  escalation_email?: string
  escalation_cc_emails?: string[]
  greeting_message?: string
  sla_hours?: number
  widget_color?: string
  // Pilot / regulated-industry controls
  environment?: 'sandbox' | 'production'
  currency?: string
  locale?: string
  financial_advice_refusal?: boolean
  sla_acknowledge_hours?: number
  sla_resolution_hours?: number
  kb_stale_after_days?: number
  /** ISO timestamp the widget last fetched config (embed is live). Powers "Verify connection". */
  last_widget_seen_at?: string
  /** ISO timestamp the widget was first seen on a NON-Lira-app host (a real
   * external install). The dashboard's own onboarding widget never sets this.
   * Powers the "Install the chat widget" launch-checklist step. */
  widget_seen_external_at?: string
  /** Per-org HMAC secret for verified visitor identity. Owner/admin only. */
  widget_secret?: string
  max_conversations_per_month: number
  max_ai_replies_per_month: number
  pending_max_conversations_per_month?: number
  pending_max_ai_replies_per_month?: number
  pending_plan_tier?: string
  /** Plan entitlement: paid tiers drop the "Powered by Lira" branding. */
  branding_removal?: boolean
  llm_calls_this_month?: number
  sandbox_max_conversations_per_month?: number
  sandbox_max_ai_replies_per_month?: number
  sandbox_max_llm_calls_per_month?: number
  conversations_this_month: number
  ai_replies_this_month: number
  onboarding_completed: boolean
  onboarding_step: string
  handoff_triggers?: HandoffTriggersConfig
  /** Widget/portal home surface customization (Settings → Support → Home). */
  home_template?: string
  home_banner_url?: string
  home_logo_url?: string
  home_title?: string
  home_subtitle?: string
  home_cards?: SupportHomeCard[]
  created_at: string
  updated_at: string
}

export interface SupportHomeCard {
  /** Minted client-side on save; older records and template seeds may omit it. */
  id?: string
  icon: string
  title: string
  body: string
  prompt: string
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
export type ConversationChannel = 'email' | 'chat' | 'voice' | 'portal' | 'whatsapp'
export type MessageRole = 'customer' | 'lira' | 'agent' | 'system'
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
    event?: 'conversation_resolved' | 'conversation_reopened'
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
  // Real-time state injected by the API at fetch time
  customer_is_typing?: boolean
  customer_last_seen_at?: string
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
  resolved_conversations?: number
  pending_conversations?: number
  resolved_autonomous: number
  resolved_human: number
  escalated: number
  avg_response_time_ms: number
  avg_csat: number
  conversations_this_month: number
  ai_replies_this_month: number
  total_messages?: number
  customer_messages?: number
  lira_messages?: number
  agent_messages?: number
  chat_conversations?: number
  email_conversations?: number
  voice_conversations?: number
  portal_conversations?: number
  top_intents?: { intent: string; count: number }[]
}

export interface ActionLog {
  action_id: string
  org_id: string
  conv_id: string
  action_type: string
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'executed' | 'failed' | 'rejected'
  input: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  created_at: string
  executed_at?: string
}

export type AgentActionRunStatus =
  | 'requested'
  | 'blocked'
  | 'pending_approval'
  | 'approved'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'cancelled'

export interface AgentActionRun {
  run_id: string
  org_id: string
  conv_id?: string
  visitor_id?: string
  customer_id?: string
  visitor_email?: string
  ticket_id?: string
  capability_name: string
  capability_kind: 'resource' | 'action'
  risk:
    | 'read_public'
    | 'read_private'
    | 'safe_write'
    | 'customer_confirm'
    | 'step_up'
    | 'admin_approve'
    | 'human_only'
  status: AgentActionRunStatus
  auth_scope?: string
  policy_decision?: Record<string, unknown>
  input_summary?: Record<string, unknown>
  output_summary?: Record<string, unknown>
  error?: string
  estimated_tokens_in?: number
  estimated_tokens_out?: number
  estimated_model_cost_usd?: number
  requested_at: string
  approved_at?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface AgentCapabilityConfig {
  capability_id: string
  org_id: string
  name: string
  display_name?: string
  description: string
  kind: 'resource' | 'action'
  source: 'server_side' | 'sdk' | 'built_in' | 'connector'
  enabled: boolean
  auth_scope: 'public' | 'verified_visitor' | 'verified_customer'
  risk:
    | 'read_public'
    | 'read_private'
    | 'safe_write'
    | 'customer_confirm'
    | 'step_up'
    | 'admin_approve'
    | 'human_only'
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
  executable?: boolean
  created_by_user_id?: string
  created_at: string
  updated_at: string
}

export type UpsertAgentCapabilityInput = Pick<
  AgentCapabilityConfig,
  'name' | 'description' | 'kind' | 'auth_scope' | 'risk'
> &
  Partial<
    Pick<
      AgentCapabilityConfig,
      'capability_id' | 'display_name' | 'source' | 'enabled' | 'input_schema' | 'output_schema'
    >
  >

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

export type ProactiveChannel =
  | 'email'
  | 'widget'
  | 'web_push'
  | 'sms'
  | 'mobile_push'
  | 'slack'
  | 'voice'

export interface ProactiveTrigger {
  trigger_id: string
  org_id: string
  name: string
  event_type: string
  conditions: TriggerCondition[]
  outreach_template: string
  /** @deprecated use channels[] */
  channel?: ProactiveChannel
  channels?: ProactiveChannel[]
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
  channel: ProactiveChannel
  status: 'sent' | 'delivered' | 'failed' | 'skipped'
  sent_at?: string
  created_at?: string
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

export interface WhatsAppChannelConfig {
  org_id: string
  enabled: boolean
  ingest_enabled: boolean
  auto_reply_enabled: boolean
  real_send_enabled: boolean
  environment: 'sandbox' | 'production'
  waba_id?: string
  phone_number_id?: string
  display_phone_number?: string
  display_name?: string
  graph_api_version: string
  default_queue_id?: string
  handoff_team_id?: string
  allowed_template_names?: string[]
  opt_out_keywords?: string[]
  webhook_verified_at?: string
  connected_by?: string
  created_at: string
  updated_at: string
  has_access_token: boolean
  has_app_secret: boolean
  has_verify_token: boolean
}

export interface WhatsAppChannelConfigInput {
  enabled?: boolean
  ingest_enabled?: boolean
  auto_reply_enabled?: boolean
  real_send_enabled?: boolean
  environment?: 'sandbox' | 'production'
  waba_id?: string
  phone_number_id?: string
  display_phone_number?: string
  display_name?: string
  graph_api_version?: string
  default_queue_id?: string
  handoff_team_id?: string
  allowed_template_names?: string[]
  opt_out_keywords?: string[]
  webhook_verified_at?: string
  access_token?: string
  app_secret?: string
  verify_token?: string
}

export type WhatsAppAnalyticsEventType =
  | 'webhook_duplicate'
  | 'inbound_message'
  | 'status_update'
  | 'conversation_ingested'
  | 'auto_reply'
  | 'outbound_send'

export interface WhatsAppAnalyticsSummary {
  org_id: string
  period_start: string
  period_end: string
  totals: Record<string, number>
  daily: Array<{ day: string; counters: Record<string, number> }>
}

export interface WhatsAppAnalyticsEvent {
  event_id: string
  org_id: string
  type: WhatsAppAnalyticsEventType
  day: string
  conv_id?: string
  message_id?: string
  recipient_hash?: string
  recipient_last4?: string
  status?: string
  dry_run?: boolean
  ok?: boolean
  data: Record<string, unknown>
  created_at: string
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

// ── CSV export download ───────────────────────────────────────────────────────

export type SupportExportKind = 'conversations' | 'tickets' | 'customers' | 'usage'

export interface SupportExportQuery {
  from?: string
  to?: string
  channel?: string
  status?: string
  queue?: string
  priority?: string
}

/**
 * Download a CSV export for an org and trigger a browser file save. Unlike
 * supportFetch (which JSON-parses), this streams the response to a Blob. Returns
 * the row count + truncation flag from the response headers so the caller can
 * toast a summary. Throws a friendly Error on failure.
 */
export async function downloadSupportExport(
  orgId: string,
  kind: SupportExportKind,
  query: SupportExportQuery = {}
): Promise<{ rowCount: number; truncated: boolean }> {
  const token = credentials.getToken()
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null && v !== '') as [string, string][]
  ).toString()
  const path = `/lira/v1/support/exports/orgs/${encodeURIComponent(orgId)}/${kind}.csv${qs ? `?${qs}` : ''}`

  const res = await fetch(`${env.VITE_API_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })

  if (res.status === 401) {
    credentials.clear()
    window.dispatchEvent(new CustomEvent('lira:auth-expired'))
    throw new Error('Session expired — please sign in again.')
  }
  if (!res.ok) {
    let msg = res.statusText
    try {
      const b = (await res.json()) as Record<string, string>
      msg = b['error'] ?? b['message'] ?? msg
    } catch {
      // ignore
    }
    throw new Error(`Export failed (${res.status}): ${msg}`)
  }

  const rowCount = Number(res.headers.get('X-Export-Row-Count') ?? '0')
  const truncated = res.headers.get('X-Export-Truncated') === 'true'
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const nameMatch = /filename="?([^"]+)"?/.exec(disposition)
  const filename = nameMatch?.[1] ?? `lira-${kind}-${orgId}.csv`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  return { rowCount, truncated }
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

export async function rotateWidgetSecret(orgId: string): Promise<string> {
  const data = await supportFetch<{ widget_secret: string }>(
    `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}/rotate-widget-secret`,
    { method: 'POST' }
  )
  return data.widget_secret
}

// ── WhatsApp Channel API ─────────────────────────────────────────────────────

export async function getWhatsAppChannelConfig(
  orgId: string
): Promise<WhatsAppChannelConfig | null> {
  try {
    return await supportFetch<WhatsAppChannelConfig>(
      `/lira/v1/support/whatsapp/orgs/${encodeURIComponent(orgId)}/config`
    )
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('404:')) return null
    throw err
  }
}

export async function updateWhatsAppChannelConfig(
  orgId: string,
  updates: WhatsAppChannelConfigInput
): Promise<WhatsAppChannelConfig> {
  return supportFetch<WhatsAppChannelConfig>(
    `/lira/v1/support/whatsapp/orgs/${encodeURIComponent(orgId)}/config`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    }
  )
}

export async function deleteWhatsAppChannelConfig(orgId: string): Promise<void> {
  await supportFetch<{ ok: boolean }>(
    `/lira/v1/support/whatsapp/orgs/${encodeURIComponent(orgId)}/config`,
    { method: 'DELETE' }
  )
}

export async function getWhatsAppAnalyticsSummary(
  orgId: string,
  days = 30
): Promise<WhatsAppAnalyticsSummary> {
  return supportFetch<WhatsAppAnalyticsSummary>(
    `/lira/v1/support/whatsapp/orgs/${encodeURIComponent(orgId)}/analytics?days=${encodeURIComponent(
      String(days)
    )}`
  )
}

export async function listWhatsAppAnalyticsEvents(
  orgId: string,
  opts: { limit?: number; type?: WhatsAppAnalyticsEventType } = {}
): Promise<WhatsAppAnalyticsEvent[]> {
  const params = new URLSearchParams()
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.type) params.set('type', opts.type)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const data = await supportFetch<{ events: WhatsAppAnalyticsEvent[] }>(
    `/lira/v1/support/whatsapp/orgs/${encodeURIComponent(orgId)}/events${qs}`
  )
  return data.events
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

export async function deleteSupportCustomer(orgId: string, customerId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/customers/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(customerId)}`,
    { method: 'DELETE' }
  )
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
  type LegacyStats = Partial<SupportStats> & {
    avg_first_response_ms?: number
    csat_average?: number | null
  }
  const data = await supportFetch<{ stats?: SupportStats } & Partial<SupportStats>>(
    `/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/stats`
  )
  const stats = (data.stats ?? data) as LegacyStats
  return {
    ...stats,
    total_conversations: stats.total_conversations ?? 0,
    open_conversations: stats.open_conversations ?? 0,
    resolved_autonomous: stats.resolved_autonomous ?? 0,
    resolved_human: stats.resolved_human ?? 0,
    escalated: stats.escalated ?? 0,
    avg_response_time_ms: stats.avg_response_time_ms ?? stats.avg_first_response_ms ?? 0,
    avg_csat: stats.avg_csat ?? stats.csat_average ?? 0,
    conversations_this_month: stats.conversations_this_month ?? stats.total_conversations ?? 0,
    ai_replies_this_month: stats.ai_replies_this_month ?? stats.lira_messages ?? 0,
  }
}

export async function getWeeklyReport(orgId: string): Promise<WeeklyReport> {
  type LegacyWeeklyReport = Partial<WeeklyReport> & {
    resolved_autonomous?: number
    escalated?: number
    avg_first_response_ms?: number
    csat_average?: number | null
  }
  const data = await supportFetch<
    { report?: WeeklyReport } & Partial<WeeklyReport> & {
        resolved_autonomous?: number
        escalated?: number
        avg_first_response_ms?: number
        csat_average?: number | null
      }
  >(`/lira/v1/support/analytics/orgs/${encodeURIComponent(orgId)}/weekly-report`)
  const report = (data.report ?? data) as LegacyWeeklyReport
  return {
    ...report,
    period_start: report.period_start ?? new Date().toISOString(),
    period_end: report.period_end ?? new Date().toISOString(),
    total_conversations: report.total_conversations ?? 0,
    autonomous_resolutions: report.autonomous_resolutions ?? report.resolved_autonomous ?? 0,
    escalations: report.escalations ?? report.escalated ?? 0,
    avg_response_time_ms: report.avg_response_time_ms ?? report.avg_first_response_ms ?? 0,
    avg_csat: report.avg_csat ?? report.csat_average ?? 0,
    top_intents: report.top_intents ?? [],
    kb_drafts_created: report.kb_drafts_created ?? 0,
    kb_drafts_approved: report.kb_drafts_approved ?? 0,
  } as WeeklyReport
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

export async function listAgentActionRuns(
  orgId: string,
  filters: {
    status?: AgentActionRunStatus | ''
    capability?: string
    from?: string
    to?: string
    limit?: number
  } = {}
): Promise<AgentActionRun[]> {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.capability) params.set('capability', filters.capability)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.limit) params.set('limit', String(filters.limit))
  const qs = params.toString() ? `?${params.toString()}` : ''
  const data = await supportFetch<{ action_runs: AgentActionRun[] }>(
    `/lira/v1/support/actions/orgs/${encodeURIComponent(orgId)}/agent-runs${qs}`
  )
  return data.action_runs
}

export async function listAgentCapabilities(orgId: string): Promise<AgentCapabilityConfig[]> {
  const data = await supportFetch<{ capabilities: AgentCapabilityConfig[] }>(
    `/lira/v1/support/agent-runtime/orgs/${encodeURIComponent(orgId)}/capabilities`
  )
  return data.capabilities
}

export async function upsertAgentCapability(
  orgId: string,
  input: UpsertAgentCapabilityInput
): Promise<AgentCapabilityConfig> {
  const data = await supportFetch<{ capability: AgentCapabilityConfig }>(
    `/lira/v1/support/agent-runtime/orgs/${encodeURIComponent(orgId)}/capabilities`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  )
  return data.capability
}

export async function deleteAgentCapability(orgId: string, capabilityId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/agent-runtime/orgs/${encodeURIComponent(orgId)}/capabilities/${encodeURIComponent(
      capabilityId
    )}`,
    { method: 'DELETE' }
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
  input: Omit<
    ProactiveTrigger,
    'trigger_id' | 'org_id' | 'created_at' | 'updated_at' | 'channel'
  > & { channels: ProactiveChannel[] }
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

/** Fire one trigger's outreach to a chosen email (test/demo). Sandbox previews only. */
export async function testFireTrigger(
  orgId: string,
  triggerId: string,
  email: string
): Promise<{ ok: boolean; sandbox: boolean; channel: 'email' | 'voice' }> {
  return supportFetch<{ ok: boolean; sandbox: boolean; channel: 'email' | 'voice' }>(
    `/lira/v1/support/webhooks/orgs/${encodeURIComponent(orgId)}/triggers/${encodeURIComponent(triggerId)}/test`,
    { method: 'POST', body: JSON.stringify({ email }) }
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

// ── Tool-pack admin API ───────────────────────────────────────────────────────

export interface ToolPack {
  pack_id: string
  enabled: boolean
  /** Secrets are redacted server-side as `sk_test_…abcd`. */
  config: Record<string, string>
  updated_at: string
}

export async function listToolPacks(orgId: string): Promise<ToolPack[]> {
  const data = await supportFetch<{ packs: ToolPack[] }>(
    `/lira/v1/support/tool-packs/orgs/${encodeURIComponent(orgId)}`
  )
  return data.packs
}

export async function getToolPack(orgId: string, packId: string): Promise<ToolPack | null> {
  const data = await supportFetch<{ pack: ToolPack | null }>(
    `/lira/v1/support/tool-packs/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(packId)}`
  )
  return data.pack
}

export async function upsertToolPack(
  orgId: string,
  packId: string,
  body: { enabled: boolean; config: Record<string, string> }
): Promise<ToolPack> {
  return supportFetch<ToolPack>(
    `/lira/v1/support/tool-packs/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(packId)}`,
    { method: 'PUT', body: JSON.stringify(body) }
  )
}

export async function disableToolPack(orgId: string, packId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/tool-packs/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(packId)}`,
    { method: 'DELETE' }
  )
}

// ── Support tickets (separate from conversations) ───────────────────────────

/** Structured handoff brief (§6.3) — generated when a ticket is opened. */
export interface HandoffBrief {
  customer_summary: string
  issue_summary: string
  urgency: 'low' | 'medium' | 'high' | 'urgent'
  what_agent_tried: string[]
  what_human_needs_to_do: string
  suggested_response: string
  generated_at: string
  model_used: string
}

/** Round-trip learning (§6.4) — captured when a human resolves a ticket. */
export interface HandoffResolution {
  ai_assessment?: 'correct' | 'partial' | 'wrong'
  knowledge_gap?: boolean
  gap_note?: string
  outcome_note?: string
  kb_draft_id?: string
  resolved_by?: string
  captured_at: string
}

export interface SupportTicketRecord {
  ticket_id: string
  ticket_number?: string
  org_id: string
  conv_id: string
  visitor_email?: string
  visitor_name?: string
  source?: 'lira_onboarding' | 'customer_widget' | 'email' | 'voice' | 'manual'
  subject: string
  summary?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  /**
   * Full sanitized status union per SUPPORT_TICKETING_API.md §7. Originally
   * narrowed to four — widened 2026-05-31 once the backend started returning
   * `pending`, `on_hold`, `escalated`, `merged`, and `snoozed` from the
   * lifecycle endpoints.
   */
  status:
    | 'open'
    | 'in_progress'
    | 'pending'
    | 'on_hold'
    | 'escalated'
    | 'resolved'
    | 'closed'
    | 'merged'
    | 'snoozed'
  assignee_user_id?: string
  escalation_reason: string
  handoff_trigger?: string
  handoff_brief?: HandoffBrief
  handoff_resolution?: HandoffResolution
  subtasks?: SupportTicketSubtask[]
  created_at: string
  updated_at: string
  resolved_at?: string
}

export interface SupportTicketSubtask {
  id: string
  label: string
  status: 'todo' | 'done'
  done_at?: string
  done_by?: string
  done_by_name?: string
  created_at: string
  created_by?: string
}

export interface TicketAttachmentRecord {
  id: string
  name: string
  content_type: string
  size: number
  s3_key: string
  url?: string
}

export interface SupportTicketMessageRecord {
  message_id: string
  ticket_id: string
  org_id: string
  sender: 'visitor' | 'agent' | 'system'
  sender_user_id?: string
  sender_name?: string
  body: string
  attachments?: TicketAttachmentRecord[]
  created_at: string
}

// ── Integration Health ────────────────────────────────────────────────────

export type IntegrationCheckSeverity = 'error' | 'warning' | 'info'

export interface IntegrationCheck {
  key: string
  ok: boolean
  label: string
  detail: string
  severity?: IntegrationCheckSeverity
  fix?: string
  docs?: string
}

export interface IntegrationHealthReport {
  org_id: string
  generated_at: string
  ok: boolean
  checks: IntegrationCheck[]
  summary: string
}

export async function runIntegrationHealth(orgId: string): Promise<IntegrationHealthReport> {
  return supportFetch<IntegrationHealthReport>(
    `/lira/v1/support/integration-health/orgs/${encodeURIComponent(orgId)}`
  )
}

export async function listTicketsForOrg(orgId: string): Promise<SupportTicketRecord[]> {
  const data = await supportFetch<{ tickets: SupportTicketRecord[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}`
  )
  return data.tickets
}

export async function getTicketForOrg(
  orgId: string,
  ticketId: string
): Promise<{ ticket: SupportTicketRecord; messages: SupportTicketMessageRecord[] }> {
  return supportFetch(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}`
  )
}

export async function replyToTicket(
  orgId: string,
  ticketId: string,
  body: string,
  attachments?: TicketAttachmentRecord[]
): Promise<SupportTicketMessageRecord> {
  const data = await supportFetch<{ message: SupportTicketMessageRecord }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/reply`,
    { method: 'POST', body: JSON.stringify({ body, attachments }) }
  )
  return data.message
}

/** Operator: create a ticket manually from the dashboard. */
export interface CreateManualTicketInput {
  subject: string
  details: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  visitor_email?: string
  visitor_name?: string
  attachments?: TicketAttachmentRecord[]
}

export async function createManualTicket(
  orgId: string,
  input: CreateManualTicketInput
): Promise<SupportTicketRecord> {
  const data = await supportFetch<{ ticket: SupportTicketRecord }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}`,
    { method: 'POST', body: JSON.stringify(input) }
  )
  return data.ticket
}

/**
 * Operator: upload a ticket attachment (multipart). Returns a descriptor to
 * include in a create/reply call. Uses raw fetch — supportFetch forces a JSON
 * content-type, which would break the multipart boundary.
 */
export async function uploadTicketAttachment(
  orgId: string,
  file: File
): Promise<TicketAttachmentRecord> {
  const token = credentials.getToken()
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(
    `${env.VITE_API_URL}/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/attachments`,
    {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  )
  if (!res.ok) {
    let msg = res.statusText
    try {
      const j = (await res.json()) as Record<string, string>
      msg = j['error'] ?? j['message'] ?? msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const data = (await res.json()) as { attachment: TicketAttachmentRecord }
  return data.attachment
}

/** Visitor: upload an attachment for their own ticket (public, email-gated). */
export async function uploadVisitorTicketAttachment(
  orgId: string,
  ticketNumber: string,
  email: string,
  file: File
): Promise<TicketAttachmentRecord> {
  const form = new FormData()
  form.append('file', file)
  const url = `${env.VITE_API_URL}/lira/v1/support/tickets/by-number/${encodeURIComponent(
    ticketNumber
  )}/attachments?org_id=${encodeURIComponent(orgId)}&email=${encodeURIComponent(email)}`
  const res = await fetch(url, { method: 'POST', body: form })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const j = (await res.json()) as Record<string, string>
      msg = j['error'] ?? j['message'] ?? msg
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  const data = (await res.json()) as { attachment: TicketAttachmentRecord }
  return data.attachment
}

/** Round-trip learning feedback captured at resolve time (§6.4). All optional. */
export interface ResolveTicketFeedback {
  ai_assessment?: 'correct' | 'partial' | 'wrong'
  knowledge_gap?: boolean
  gap_note?: string
  outcome_note?: string
}

export async function resolveTicket(
  orgId: string,
  ticketId: string,
  feedback?: ResolveTicketFeedback
): Promise<SupportTicketRecord> {
  const data = await supportFetch<{ ticket: SupportTicketRecord }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/resolve`,
    { method: 'POST', body: JSON.stringify(feedback ?? {}) }
  )
  return data.ticket
}

/** Regenerate the structured handoff brief for a ticket (§6.3). */
export async function regenerateHandoffBrief(
  orgId: string,
  ticketId: string
): Promise<HandoffBrief> {
  const data = await supportFetch<{ brief: HandoffBrief }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/handoff-brief/regenerate`,
    { method: 'POST' }
  )
  return data.brief
}

/**
 * Phase 5 §1.1 — email the customer a CSAT survey. Available on resolved
 * tickets that don't already have a CSAT response. The backend handles
 * idempotency: re-firing is safe (no-op).
 */
export async function requestCsat(orgId: string, ticketId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/request-csat`,
    { method: 'POST' }
  )
}

// ── Phase 6: Integration outbox + external links ─────────────────────────

export type OutboxProvider = 'slack' | 'linear' | 'webhook'
export type OutboxStatus = 'pending' | 'in_flight' | 'completed' | 'failed' | 'dead'

export interface OutboxItem {
  item_id: string
  ticket_id: string
  provider: OutboxProvider
  event_type: string
  status: OutboxStatus
  attempt_count: number
  max_attempts: number
  next_attempt_at?: string
  last_attempted_at?: string
  last_error?: string
  external_id?: string
  external_url?: string
  created_at: string
  updated_at: string
}

export interface ExternalLink {
  id?: string
  ticket_id?: string
  provider: OutboxProvider
  external_id: string
  external_url: string
  created_at?: string
}

export interface DrainStats {
  drained: number
  succeeded: number
  failed: number
}

/** §4.1 — list outbox items, optionally filtered by status. */
export async function listIntegrationOutbox(
  orgId: string,
  status?: OutboxStatus
): Promise<OutboxItem[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  const data = await supportFetch<{ items: OutboxItem[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/integration-outbox${qs}`
  )
  return data.items
}

/** §4.2 — bump a failed/dead item back to pending; worker picks it up next pass. */
export async function retryOutboxItem(orgId: string, itemId: string): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/integration-outbox/${encodeURIComponent(itemId)}/retry`,
    { method: 'POST' }
  )
}

/** §4.3 — synchronously drain all due items. Admin escape hatch. */
export async function drainOutbox(orgId: string): Promise<DrainStats> {
  return supportFetch<DrainStats>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/integration-outbox/drain`,
    { method: 'POST' }
  )
}

/** §4.4 — list external system back-pointers for a ticket. */
export async function listExternalLinks(orgId: string, ticketId: string): Promise<ExternalLink[]> {
  const data = await supportFetch<{ links: ExternalLink[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/external-links`
  )
  return data.links
}

/** §4.4 — manually record an external link (operator paste). */
export async function createExternalLink(
  orgId: string,
  ticketId: string,
  payload: { provider: OutboxProvider; external_id: string; external_url: string }
): Promise<ExternalLink> {
  const data = await supportFetch<{ link: ExternalLink }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/external-links`,
    { method: 'POST', body: JSON.stringify(payload) }
  )
  return data.link
}

/** §4.5 — force a sync of one ticket to one provider. Enqueues, doesn't block. */
export async function forceSyncTicket(
  orgId: string,
  ticketId: string,
  provider: OutboxProvider
): Promise<void> {
  await supportFetch<void>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/sync/${encodeURIComponent(provider)}`,
    { method: 'POST' }
  )
}

// ── Phase 7: Analytics + audit export ────────────────────────────────────

export interface TicketAnalyticsOverview {
  overview: {
    total: number
    open: number
    in_progress: number
    pending: number
    on_hold: number
    escalated: number
    resolved: number
    closed: number
    unassigned: number
    by_priority: { low: number; medium: number; high: number; urgent: number }
    by_queue: Record<string, number>
  }
  learning: {
    ai_to_ticket_conversion: number
    reopen_rate: number
    csat_average: number
    csat_negative_count: number
  }
}

export interface TicketSlaMetrics {
  total_with_first_response: number
  total_resolved: number
  hit_rate: number
  breach_count: number
  at_risk_count: number
  avg_first_response_minutes: number
  avg_resolution_minutes: number
}

export interface CategoryMetric {
  category: string
  count: number
  resolved: number
  escalated: number
  reopen_count: number
}

export interface RootCauseRow {
  category: string
  dedupe_key: string
  count: number
  sample_subjects: string[]
  last_seen_at: string
}

export interface CategoryAnalytics {
  categories: CategoryMetric[]
  root_causes: RootCauseRow[]
}

export interface AgentMetric {
  user_id: string
  user_name: string
  open_count: number
  resolved_count: number
  avg_resolution_minutes: number
}

/** §5.1 — backlog overview + learning metrics. */
export async function getTicketAnalyticsOverview(orgId: string): Promise<TicketAnalyticsOverview> {
  return supportFetch<TicketAnalyticsOverview>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/analytics/tickets`
  )
}

/** §5.2 — SLA hit-rate + averages. */
export async function getTicketAnalyticsSla(orgId: string): Promise<TicketSlaMetrics> {
  return supportFetch<TicketSlaMetrics>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/analytics/tickets/sla`
  )
}

/** §5.3 — category counts + dedupe-key root causes. */
export async function getTicketAnalyticsCategories(orgId: string): Promise<CategoryAnalytics> {
  return supportFetch<CategoryAnalytics>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/analytics/tickets/categories`
  )
}

/** §5.4 — per-agent open/resolved counts + avg resolution time. */
export async function getTicketAnalyticsAgents(orgId: string): Promise<{ agents: AgentMetric[] }> {
  return supportFetch<{ agents: AgentMetric[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/analytics/tickets/agents`
  )
}

/**
 * §5.5 — download the immutable event timeline for a ticket as JSON or CSV.
 * Backend sets `Content-Disposition: attachment`; we just trigger the
 * download via a synthetic anchor click. Returns the resolved filename
 * for toast feedback.
 */
export async function downloadTicketAudit(
  orgId: string,
  ticketId: string,
  format: 'json' | 'csv'
): Promise<string> {
  const token = credentials.getToken()
  const url = `${env.VITE_API_URL}/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/audit-export?ticket_id=${encodeURIComponent(ticketId)}&format=${format}`
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`Audit export failed (${res.status})`)

  // Backend sets Content-Disposition with the canonical filename; pull it
  // out so the toast confirms exactly what landed on the user's disk.
  const disp = res.headers.get('content-disposition') ?? ''
  const match = /filename="?([^";]+)"?/i.exec(disp)
  const filename = match?.[1] ?? `ticket-audit-${ticketId}.${format}`

  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
  return filename
}

// ── Phase 4–5 lifecycle transitions (§1.1) ───────────────────────────────
//
// Each helper hits a discrete POST endpoint and returns the updated ticket.
// The `setStatus` PATCH exists as a catch-all but most flows want the
// semantic endpoint (the POSTs trigger side effects like emails, the bare
// status PATCH does not).

function ticketActionUrl(orgId: string, ticketId: string, action: string): string {
  return `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/${action}`
}

async function postTicketAction(
  orgId: string,
  ticketId: string,
  action: string,
  body?: unknown
): Promise<SupportTicketRecord> {
  const init: RequestInit = { method: 'POST' }
  if (body !== undefined) init.body = JSON.stringify(body)
  const data = await supportFetch<{ ticket: SupportTicketRecord }>(
    ticketActionUrl(orgId, ticketId, action),
    init
  )
  return data.ticket
}

export async function markTicketPending(
  orgId: string,
  ticketId: string
): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'pending')
}

export async function markTicketOnHold(
  orgId: string,
  ticketId: string,
  reason?: string
): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'on-hold', reason ? { reason } : undefined)
}

export async function reopenTicket(orgId: string, ticketId: string): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'reopen')
}

export async function closeTicket(orgId: string, ticketId: string): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'close')
}

// ── Subtasks (per-ticket operator checklist) ───────────────────────────────

const SUBTASKS_BASE = (orgId: string, ticketId: string) =>
  `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/subtasks`

export async function addTicketSubtask(
  orgId: string,
  ticketId: string,
  label: string
): Promise<SupportTicketSubtask> {
  const data = await supportFetch<{ subtask: SupportTicketSubtask }>(
    SUBTASKS_BASE(orgId, ticketId),
    { method: 'POST', body: JSON.stringify({ label }) }
  )
  return data.subtask
}

export async function updateTicketSubtask(
  orgId: string,
  ticketId: string,
  subtaskId: string,
  patch: { label?: string; status?: 'todo' | 'done' }
): Promise<SupportTicketSubtask> {
  const data = await supportFetch<{ subtask: SupportTicketSubtask }>(
    `${SUBTASKS_BASE(orgId, ticketId)}/${encodeURIComponent(subtaskId)}`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  )
  return data.subtask
}

export async function deleteTicketSubtask(
  orgId: string,
  ticketId: string,
  subtaskId: string
): Promise<void> {
  await supportFetch<{ ok: true }>(
    `${SUBTASKS_BASE(orgId, ticketId)}/${encodeURIComponent(subtaskId)}`,
    { method: 'DELETE' }
  )
}

export async function reorderTicketSubtasks(
  orgId: string,
  ticketId: string,
  orderedIds: string[]
): Promise<SupportTicketSubtask[]> {
  const data = await supportFetch<{ subtasks: SupportTicketSubtask[] }>(
    `${SUBTASKS_BASE(orgId, ticketId)}/reorder`,
    { method: 'PATCH', body: JSON.stringify({ ordered_ids: orderedIds }) }
  )
  return data.subtasks
}

export async function classifyTicket(
  orgId: string,
  ticketId: string
): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'classify')
}

export async function routeTicket(orgId: string, ticketId: string): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'route')
}

export type EscalationTier = 'tier_2' | 'tier_3' | 'tier_4' | 'queue' | 'user'

export interface EscalateTicketPayload {
  tier: EscalationTier
  reason?: string
  to_user_id?: string
  to_queue_id?: string
}

export async function escalateTicket(
  orgId: string,
  ticketId: string,
  payload: EscalateTicketPayload
): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'escalate', payload)
}

export async function ackEscalation(orgId: string, ticketId: string): Promise<SupportTicketRecord> {
  return postTicketAction(orgId, ticketId, 'escalation/ack')
}

// PATCH helpers — semantic property updates.

async function patchTicketProperty<T extends Record<string, unknown>>(
  orgId: string,
  ticketId: string,
  property: 'status' | 'priority' | 'category' | 'queue' | 'assign',
  body: T
): Promise<SupportTicketRecord> {
  const data = await supportFetch<{ ticket: SupportTicketRecord }>(
    ticketActionUrl(orgId, ticketId, property),
    { method: 'PATCH', body: JSON.stringify(body) }
  )
  return data.ticket
}

export async function setTicketStatus(
  orgId: string,
  ticketId: string,
  status: SupportTicketRecord['status']
): Promise<SupportTicketRecord> {
  return patchTicketProperty(orgId, ticketId, 'status', { status })
}

export async function setTicketPriority(
  orgId: string,
  ticketId: string,
  priority: SupportTicketRecord['priority']
): Promise<SupportTicketRecord> {
  return patchTicketProperty(orgId, ticketId, 'priority', { priority })
}

export async function setTicketCategory(
  orgId: string,
  ticketId: string,
  category: string
): Promise<SupportTicketRecord> {
  return patchTicketProperty(orgId, ticketId, 'category', { category })
}

export async function setTicketQueue(
  orgId: string,
  ticketId: string,
  queueId: string | null
): Promise<SupportTicketRecord> {
  return patchTicketProperty(orgId, ticketId, 'queue', { queue_id: queueId })
}

export async function assignTicket(
  orgId: string,
  ticketId: string,
  userId: string | null
): Promise<SupportTicketRecord> {
  return patchTicketProperty(orgId, ticketId, 'assign', { assignee_user_id: userId })
}

// ── Teams CRUD ────────────────────────────────────────────────────────────
// Teams are an operator-side organizing concept (distinct from Queues which
// are routing targets). The shape mirrors lira-ai/src/app/store/teams-
// preview-store.ts so the components consuming the preview store can switch
// to these wrappers without changing call sites.

export interface SupportTeamRecord {
  team_id: string
  org_id: string
  name: string
  /** Brand-aligned accent (hex like #4f46e5). */
  color: string
  member_user_ids: string[]
  created_at: string
  updated_at: string
}

const TEAMS_BASE = (orgId: string) => `/lira/v1/support/teams/orgs/${encodeURIComponent(orgId)}`

export async function listTeams(orgId: string): Promise<SupportTeamRecord[]> {
  const data = await supportFetch<{ teams: SupportTeamRecord[] }>(TEAMS_BASE(orgId))
  return data.teams
}

export async function createTeam(
  orgId: string,
  input: { name: string; color: string; member_user_ids?: string[] }
): Promise<SupportTeamRecord> {
  const data = await supportFetch<{ team: SupportTeamRecord }>(TEAMS_BASE(orgId), {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return data.team
}

export async function updateTeam(
  orgId: string,
  teamId: string,
  patch: { name?: string; color?: string; member_user_ids?: string[] }
): Promise<SupportTeamRecord> {
  const data = await supportFetch<{ team: SupportTeamRecord }>(
    `${TEAMS_BASE(orgId)}/${encodeURIComponent(teamId)}`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  )
  return data.team
}

export async function deleteTeam(orgId: string, teamId: string): Promise<void> {
  await supportFetch<{ ok: true }>(`${TEAMS_BASE(orgId)}/${encodeURIComponent(teamId)}`, {
    method: 'DELETE',
  })
}

/**
 * Set or clear the team grouping on a ticket. Pass `null` for team_id to
 * clear. The backend writes a ticket.assigned event with kind='team'.
 */
export async function setTicketTeam(
  orgId: string,
  ticketId: string,
  teamId: string | null
): Promise<SupportTicketRecord> {
  const data = await supportFetch<{ ticket: SupportTicketRecord }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(ticketId)}/team`,
    { method: 'PATCH', body: JSON.stringify({ team_id: teamId }) }
  )
  return data.ticket
}

/**
 * Set or clear team_id and/or assignee_user_id on a conversation. Either or
 * both fields may be present in the patch; `null` clears, omit leaves
 * unchanged.
 */
export async function setConversationAssignment(
  orgId: string,
  convId: string,
  patch: { team_id?: string | null; assignee_user_id?: string | null }
): Promise<void> {
  await supportFetch<{ conversation: SupportConversation }>(
    `/lira/v1/support/inbox/orgs/${encodeURIComponent(orgId)}/${encodeURIComponent(convId)}/assignment`,
    { method: 'PATCH', body: JSON.stringify(patch) }
  )
}

// ── Queues CRUD (§1.2) ───────────────────────────────────────────────────

/**
 * Mirrors the backend `QueueAssignmentMode` union (lira-support.models.ts).
 * `least_busy` was previously misnamed `least_loaded` here; `manual` was
 * `manual_pick`. The richer set (supervisor_assign / skills_based /
 * preferred_agent) covers Phase 3B advanced modes — fine if the UI just
 * displays them by name even before round-robin/least-busy are wired up
 * on the routing side.
 */
export type QueueAssignmentMode =
  | 'manual_pick'
  | 'supervisor_assign'
  | 'round_robin'
  | 'least_busy'
  | 'skills_based'
  | 'preferred_agent'

export type TicketCategoryKey =
  | 'billing_payments'
  | 'account_access'
  | 'technical_issue'
  | 'compliance_fraud'
  | 'product_enquiry'
  | 'complaint'
  | 'sdk_integration'
  | 'other'

export interface SupportQueue {
  queue_id: string
  org_id: string
  name: string
  description?: string
  categories: TicketCategoryKey[]
  members: string[]
  assignment_mode: QueueAssignmentMode
  max_depth?: number
  overflow_queue_id?: string
  is_default?: boolean
  created_at: string
  updated_at: string
}

export type QueueCreatePayload = {
  queue_id?: string
  name: string
  description?: string
  categories?: TicketCategoryKey[]
  members?: string[]
  assignment_mode?: QueueAssignmentMode
  max_depth?: number
  overflow_queue_id?: string
}

export type QueueUpdatePayload = Partial<QueueCreatePayload>

const QUEUES_BASE = (orgId: string) =>
  `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/queues`

export async function listQueues(orgId: string): Promise<SupportQueue[]> {
  const data = await supportFetch<{ queues: SupportQueue[] }>(QUEUES_BASE(orgId))
  return data.queues
}

export async function createQueue(
  orgId: string,
  payload: QueueCreatePayload
): Promise<SupportQueue> {
  const data = await supportFetch<{ queue: SupportQueue }>(QUEUES_BASE(orgId), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.queue
}

export async function updateQueue(
  orgId: string,
  queueId: string,
  payload: QueueUpdatePayload
): Promise<SupportQueue> {
  const data = await supportFetch<{ queue: SupportQueue }>(
    `${QUEUES_BASE(orgId)}/${encodeURIComponent(queueId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  )
  return data.queue
}

export async function deleteQueue(orgId: string, queueId: string): Promise<void> {
  await supportFetch<void>(`${QUEUES_BASE(orgId)}/${encodeURIComponent(queueId)}`, {
    method: 'DELETE',
  })
}

// ── SLA policies CRUD (§1.2) ─────────────────────────────────────────────

export interface SupportSlaPolicy {
  sla_policy_id: string
  org_id: string
  name: string
  description?: string
  first_response_minutes: number
  resolution_minutes: number
  business_hours_only: boolean
  applies_to_priorities?: SupportTicketRecord['priority'][]
  applies_to_categories?: string[]
  created_at: string
  updated_at: string
}

export type SlaPolicyCreatePayload = {
  name: string
  description?: string
  first_response_minutes: number
  resolution_minutes: number
  business_hours_only: boolean
  applies_to_priorities?: SupportTicketRecord['priority'][]
  applies_to_categories?: string[]
}

export type SlaPolicyUpdatePayload = Partial<SlaPolicyCreatePayload>

const SLA_BASE = (orgId: string) =>
  `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/sla-policies`

export async function listSlaPolicies(orgId: string): Promise<SupportSlaPolicy[]> {
  const data = await supportFetch<{ policies: SupportSlaPolicy[] }>(SLA_BASE(orgId))
  return data.policies
}

export async function createSlaPolicy(
  orgId: string,
  payload: SlaPolicyCreatePayload
): Promise<SupportSlaPolicy> {
  const data = await supportFetch<{ policy: SupportSlaPolicy }>(SLA_BASE(orgId), {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.policy
}

export async function updateSlaPolicy(
  orgId: string,
  policyId: string,
  payload: SlaPolicyUpdatePayload
): Promise<SupportSlaPolicy> {
  const data = await supportFetch<{ policy: SupportSlaPolicy }>(
    `${SLA_BASE(orgId)}/${encodeURIComponent(policyId)}`,
    { method: 'PATCH', body: JSON.stringify(payload) }
  )
  return data.policy
}

export async function deleteSlaPolicy(orgId: string, policyId: string): Promise<void> {
  await supportFetch<void>(`${SLA_BASE(orgId)}/${encodeURIComponent(policyId)}`, {
    method: 'DELETE',
  })
}

// ── Agent availability (§1.2) ────────────────────────────────────────────

export type AgentAvailability = 'available' | 'away' | 'offline'

export interface AgentAvailabilityRecord {
  user_id: string
  user_name?: string
  email?: string
  availability: AgentAvailability
  updated_at?: string
}

export async function listAgentAvailability(orgId: string): Promise<AgentAvailabilityRecord[]> {
  const data = await supportFetch<{ agents: AgentAvailabilityRecord[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/agents/availability`
  )
  return data.agents
}

export async function updateMyAvailability(
  orgId: string,
  availability: AgentAvailability
): Promise<AgentAvailabilityRecord> {
  const data = await supportFetch<{ agent: AgentAvailabilityRecord }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/agents/me/availability`,
    { method: 'PATCH', body: JSON.stringify({ availability }) }
  )
  return data.agent
}

// ── Ticket categories (§1.2) ─────────────────────────────────────────────

export interface TicketCategoryRecord {
  category: string
  label: string
  description?: string
}

export async function listTicketCategories(orgId: string): Promise<TicketCategoryRecord[]> {
  const data = await supportFetch<{ categories: TicketCategoryRecord[] }>(
    `/lira/v1/support/tickets/orgs/${encodeURIComponent(orgId)}/categories`
  )
  return data.categories
}

/** Visitor-facing: list tickets I opened (identity = email). No JWT auth. */
export async function listTicketsForVisitor(
  orgId: string,
  visitorEmail: string
): Promise<SupportTicketRecord[]> {
  const url = `${env.VITE_API_URL}/lira/v1/support/tickets/visitor/${encodeURIComponent(orgId)}/${encodeURIComponent(visitorEmail)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to list tickets')
  const data = (await res.json()) as { tickets: SupportTicketRecord[] }
  return data.tickets
}

/** Visitor-facing: fetch a ticket by its human-readable number + thread. */
export async function getTicketByNumber(
  orgId: string,
  ticketNumber: string
): Promise<{ ticket: SupportTicketRecord; messages: SupportTicketMessageRecord[] }> {
  const url = `${env.VITE_API_URL}/lira/v1/support/tickets/by-number/${encodeURIComponent(ticketNumber)}?org_id=${encodeURIComponent(orgId)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Ticket not found')
  return (await res.json()) as {
    ticket: SupportTicketRecord
    messages: SupportTicketMessageRecord[]
  }
}
