// ── Support Analytics — Mock Data ─────────────────────────────────────────────

import type { SupportAnalyticsData } from './analytics-types'

export function generateMockAnalyticsData(): SupportAnalyticsData {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  return {
    metrics: {
      openInbox: 12,
      resolvedToday: 47,
      proactiveSent: 23,
      escalated: 8,
      autonomousResolutionRate: 74,
      avgFirstResponseTime: 18, // 18 seconds
      avgResolutionTime: 142, // 2 min 22 sec
      customerSatisfaction: 4.3,
    },

    ticketTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: Math.floor(40 + Math.random() * 30),
    })),

    resolutionTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(today.getTime() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      value: 65 + Math.floor(Math.random() * 15),
    })),

    channelMetrics: [
      {
        channel: 'email',
        total: 287,
        autonomous: 218,
        escalated: 69,
        avgResponseTime: 22,
      },
      {
        channel: 'chat',
        total: 142,
        autonomous: 114,
        escalated: 28,
        avgResponseTime: 8,
      },
      {
        channel: 'voice',
        total: 56,
        autonomous: 38,
        escalated: 18,
        avgResponseTime: 5,
      },
    ],

    proactiveTriggers: [
      {
        triggerId: 'trigger_1',
        name: 'Payment Failed',
        eventType: 'payment.failed',
        triggered: 47,
        ticketsPrevented: 32,
        customerResponses: 38,
        preventionRate: 68,
      },
      {
        triggerId: 'trigger_2',
        name: 'KYC Verification Blocked',
        eventType: 'kyc.blocked',
        triggered: 23,
        ticketsPrevented: 18,
        customerResponses: 20,
        preventionRate: 78,
      },
      {
        triggerId: 'trigger_3',
        name: 'API Error Spike',
        eventType: 'api.error_spike',
        triggered: 12,
        ticketsPrevented: 8,
        customerResponses: 10,
        preventionRate: 67,
      },
      {
        triggerId: 'trigger_4',
        name: 'Subscription Expiring',
        eventType: 'subscription.expiring_soon',
        triggered: 31,
        ticketsPrevented: 25,
        customerResponses: 29,
        preventionRate: 81,
      },
    ],

    outcomes: {
      autonomous: 370,
      escalated: 115,
      pending: 12,
      totalResolved: 485,
      csat: {
        score: 4.3,
        responses: 412,
      },
    },

    weeklyReport: {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalTickets: 485,
      resolved: 473,
      escalated: 115,
      autonomous: 370,
      avgResponseTime: 18,
      avgResolutionTime: 142,
      topIssueCategories: [
        { category: 'Payment Issues', count: 87, autonomousRate: 72 },
        { category: 'Account Access', count: 64, autonomousRate: 81 },
        { category: 'KYC Verification', count: 52, autonomousRate: 69 },
        { category: 'API Integration', count: 43, autonomousRate: 58 },
        { category: 'Transaction Status', count: 91, autonomousRate: 88 },
        { category: 'Feature Questions', count: 76, autonomousRate: 79 },
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        tickets: hour >= 9 && hour <= 17 
          ? Math.floor(15 + Math.random() * 20)
          : Math.floor(2 + Math.random() * 8),
      })),
      channelBreakdown: [
        {
          channel: 'email',
          total: 287,
          autonomous: 218,
          escalated: 69,
          avgResponseTime: 22,
        },
        {
          channel: 'chat',
          total: 142,
          autonomous: 114,
          escalated: 28,
          avgResponseTime: 8,
        },
        {
          channel: 'voice',
          total: 56,
          autonomous: 38,
          escalated: 18,
          avgResponseTime: 5,
        },
      ],
      csat: {
        average: 4.3,
        responses: 412,
        trend: 'improving',
      },
    },

    billing: Array.from({ length: 6 }, (_, i) => {
      const month = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1)
      const totalInteractions = Math.floor(400 + Math.random() * 200)
      const billableResolutions = Math.floor(totalInteractions * 0.75)
      const nonBillableEscalations = totalInteractions - billableResolutions
      const proactiveOutreach = Math.floor(80 + Math.random() * 50)
      const costPerResolution = 2.5
      const revenue = billableResolutions * costPerResolution

      return {
        month: month.toISOString().split('T')[0].slice(0, 7),
        totalInteractions,
        billableResolutions,
        nonBillableEscalations,
        proactiveOutreach,
        revenue,
        costPerResolution,
        savingsVsTraditional: revenue * 8, // 8x savings vs traditional support
      }
    }),

    recentInteractions: Array.from({ length: 20 }, (_, i) => {
      const channels: Array<'email' | 'chat' | 'voice'> = ['email', 'chat', 'voice']
      const channel = channels[Math.floor(Math.random() * channels.length)]
      const isEscalated = Math.random() < 0.25
      const timestamp = new Date(today.getTime() - i * 30 * 60 * 1000)

      return {
        interactionId: `int_${Math.random().toString(36).slice(2, 11)}`,
        customerId: `cust_${Math.random().toString(36).slice(2, 11)}`,
        customerName: ['Sarah Mitchell', 'James Chen', 'Emily Rodriguez', 'Michael Foster', 'Lisa Thompson'][Math.floor(Math.random() * 5)],
        channel,
        direction: Math.random() < 0.15 ? 'proactive' : 'inbound',
        timestamp: timestamp.toISOString(),
        summary: [
          'Payment failed - updated card on file',
          'KYC verification assistance provided',
          'Account access restored after password reset',
          'API integration troubleshooting completed',
          'Transaction status inquiry resolved',
          'Feature explanation - billing dashboard',
        ][Math.floor(Math.random() * 6)],
        resolution: isEscalated ? 'escalated' : (Math.random() < 0.95 ? 'autonomous' : 'pending'),
        responseTime: Math.floor(5 + Math.random() * 60),
        resolutionTime: isEscalated ? undefined : Math.floor(60 + Math.random() * 300),
        csat: !isEscalated && Math.random() < 0.8 ? Math.floor(3 + Math.random() * 3) : undefined,
        billable: !isEscalated,
        knowledgeArticlesUsed: Math.floor(1 + Math.random() * 4),
      }
    }),

    knowledgeGaps: [
      {
        gapId: 'gap_1',
        question: 'How to handle multi-currency refunds?',
        frequency: 8,
        lastOccurred: new Date(today.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
        draftArticle: 'Multi-currency refunds are processed...',
      },
      {
        gapId: 'gap_2',
        question: 'What is the SLA for wire transfers?',
        frequency: 12,
        lastOccurred: new Date(today.getTime() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'pending_review',
        draftArticle: 'Wire transfer SLA depends on...',
      },
      {
        gapId: 'gap_3',
        question: 'How to update webhook endpoints?',
        frequency: 6,
        lastOccurred: new Date(today.getTime() - 18 * 60 * 60 * 1000).toISOString(),
        status: 'draft',
      },
    ],
  }
}
