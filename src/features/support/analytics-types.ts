// ── Support Analytics — Type Definitions ──────────────────────────────────────

export interface SupportMetrics {
  openInbox: number
  resolvedToday: number
  proactiveSent: number
  escalated: number
  autonomousResolutionRate: number
  avgFirstResponseTime: number // seconds
  avgResolutionTime: number // seconds
  customerSatisfaction: number // 1-5
}

export interface TimeSeriesDataPoint {
  date: string // ISO date
  value: number
}

export interface ChannelMetrics {
  channel: 'email' | 'chat' | 'voice'
  total: number
  autonomous: number
  escalated: number
  avgResponseTime: number
}

export interface ProactiveTriggerMetrics {
  triggerId: string
  name: string
  eventType: string
  triggered: number
  ticketsPrevented: number
  customerResponses: number
  preventionRate: number
}

export interface OutcomeMetrics {
  autonomous: number
  escalated: number
  pending: number
  totalResolved: number
  csat: {
    score: number
    responses: number
  }
}

export interface WeeklySupportReport {
  weekStart: string // ISO date
  weekEnd: string // ISO date
  totalTickets: number
  resolved: number
  escalated: number
  autonomous: number
  avgResponseTime: number
  avgResolutionTime: number
  topIssueCategories: Array<{
    category: string
    count: number
    autonomousRate: number
  }>
  hourlyDistribution: Array<{
    hour: number
    tickets: number
  }>
  channelBreakdown: ChannelMetrics[]
  csat: {
    average: number
    responses: number
    trend: 'improving' | 'stable' | 'declining'
  }
}

export interface BillingOutcome {
  month: string
  totalInteractions: number
  billableResolutions: number
  nonBillableEscalations: number
  proactiveOutreach: number
  revenue: number
  costPerResolution: number
  savingsVsTraditional: number
}

export interface CustomerInteraction {
  interactionId: string
  customerId: string
  customerName: string
  channel: 'email' | 'chat' | 'voice'
  direction: 'inbound' | 'outbound' | 'proactive'
  timestamp: string
  summary: string
  resolution: 'autonomous' | 'escalated' | 'pending'
  responseTime: number // seconds
  resolutionTime?: number // seconds
  csat?: number // 1-5
  billable: boolean
  knowledgeArticlesUsed: number
}

export interface KnowledgeGap {
  gapId: string
  question: string
  frequency: number
  lastOccurred: string
  status: 'draft' | 'pending_review' | 'published'
  draftArticle?: string
}

export interface AnalyticsTimeRange {
  preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom'
  startDate?: string
  endDate?: string
}

export interface SupportAnalyticsData {
  metrics: SupportMetrics
  ticketTrend: TimeSeriesDataPoint[]
  resolutionTrend: TimeSeriesDataPoint[]
  channelMetrics: ChannelMetrics[]
  proactiveTriggers: ProactiveTriggerMetrics[]
  outcomes: OutcomeMetrics
  weeklyReport: WeeklySupportReport
  billing: BillingOutcome[]
  recentInteractions: CustomerInteraction[]
  knowledgeGaps: KnowledgeGap[]
}
