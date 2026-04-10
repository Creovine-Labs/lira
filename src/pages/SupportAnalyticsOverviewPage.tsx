// ── Support Analytics Overview Dashboard ──────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline'
import { useIsMobile } from '@/hooks'
import {
  BG,
  NEU_SHADOW,
  NEU_INSET,
  StatCard,
  LineChart,
  BarChart,
  DonutChart,
  SectionHeader,
  Card,
} from '@/features/support/components/AnalyticsComponents'
import { generateMockAnalyticsData } from '@/features/support/mock-analytics-data'
import type { SupportAnalyticsData } from '@/features/support/analytics-types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return '—'
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
}

// ── Time Range Selector ───────────────────────────────────────────────────────

function TimeRangeSelector() {
  const [selected, setSelected] = useState<'today' | 'week' | 'month' | 'quarter'>('week')

  const ranges = [
    { id: 'today' as const, label: 'Today' },
    { id: 'week' as const, label: '7 Days' },
    { id: 'month' as const, label: '30 Days' },
    { id: 'quarter' as const, label: '90 Days' },
  ]

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_INSET,
        borderRadius: 12,
        padding: 4,
        display: 'flex',
        gap: 4,
      }}
    >
      {ranges.map((range) => (
        <button
          key={range.id}
          onClick={() => setSelected(range.id)}
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 12,
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: selected === range.id ? BG : 'transparent',
            boxShadow: selected === range.id ? NEU_SHADOW : 'none',
            color: selected === range.id ? '#6366F1' : '#585A68',
            transition: 'all 0.2s ease',
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}

// ── Recent Interactions List ──────────────────────────────────────────────────

function RecentInteractionsList({ data }: { data: SupportAnalyticsData }) {
  const interactions = data.recentInteractions.slice(0, 10)

  const getResolutionBadge = (resolution: string) => {
    switch (resolution) {
      case 'autonomous':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', label: 'Autonomous' }
      case 'escalated':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#D97706', label: 'Escalated' }
      case 'pending':
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280', label: 'Pending' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280', label: resolution }
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '✉'
      case 'chat':
        return '💬'
      case 'voice':
        return '📞'
      default:
        return '◦'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {interactions.map((interaction) => {
        const badge = getResolutionBadge(interaction.resolution)
        const timeSince = Math.floor(
          (Date.now() - new Date(interaction.timestamp).getTime()) / (1000 * 60)
        )
        const timeLabel =
          timeSince < 60
            ? `${timeSince}m ago`
            : timeSince < 1440
              ? `${Math.floor(timeSince / 60)}h ago`
              : `${Math.floor(timeSince / 1440)}d ago`

        return (
          <div
            key={interaction.interactionId}
            style={{
              background: BG,
              boxShadow: NEU_SHADOW,
              borderRadius: 12,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'transform 0.2s ease',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <span style={{ fontSize: 18 }}>{getChannelIcon(interaction.channel)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#2E3040',
                  }}
                >
                  {interaction.customerName}
                </span>
                <span
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '2px 6px',
                    borderRadius: 8,
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 12,
                  color: '#585A68',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {interaction.summary}
              </p>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#6B7280',
                  marginBottom: 2,
                }}
              >
                {timeLabel}
              </div>
              {interaction.csat && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    fontSize: 10,
                  }}
                >
                  {Array.from({ length: interaction.csat }).map((_, i) => (
                    <span key={i} style={{ color: '#10B981' }}>
                      ★
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Knowledge Gaps Panel ──────────────────────────────────────────────────────

function KnowledgeGapsPanel({ data }: { data: SupportAnalyticsData }) {
  const gaps = data.knowledgeGaps

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return { bg: 'rgba(99, 102, 241, 0.15)', color: '#4F46E5', label: 'Draft' }
      case 'pending_review':
        return { bg: 'rgba(251, 191, 36, 0.15)', color: '#D97706', label: 'Pending' }
      case 'published':
        return { bg: 'rgba(16, 185, 129, 0.15)', color: '#059669', label: 'Published' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6B7280', label: status }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {gaps.length === 0 ? (
        <div
          style={{
            background: BG,
            boxShadow: NEU_INSET,
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 13,
              color: '#94A3B8',
            }}
          >
            No knowledge gaps identified
          </span>
        </div>
      ) : (
        gaps.map((gap) => {
          const badge = getStatusBadge(gap.status)
          return (
            <div
              key={gap.gapId}
              style={{
                background: BG,
                boxShadow: NEU_SHADOW,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'start',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#2E3040',
                    flex: 1,
                  }}
                >
                  {gap.question}
                </span>
                <span
                  style={{
                    background: badge.bg,
                    color: badge.color,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 8,
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {badge.label}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  fontSize: 11,
                  color: '#585A68',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                <span>Asked {gap.frequency}× this week</span>
                <span>•</span>
                <span>
                  Last: {new Date(gap.lastOccurred).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
              {gap.draftArticle && gap.status === 'draft' && (
                <button
                  style={{
                    marginTop: 12,
                    background: BG,
                    boxShadow: NEU_SHADOW,
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#6366F1',
                    cursor: 'pointer',
                  }}
                >
                  Review AI Draft →
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SupportAnalyticsOverviewPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [data, setData] = useState<SupportAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setData(generateMockAnalyticsData())
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <div
        style={{
          background: BG,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 9999,
            background: BG,
            boxShadow: NEU_SHADOW,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ArrowPathIcon
            style={{ width: 20, height: 20, color: '#6366F1', animation: 'spin 1s linear infinite' }}
          />
        </div>
      </div>
    )
  }

  if (!data) return null

  const { metrics, ticketTrend, resolutionTrend, channelMetrics, outcomes } = data

  return (
    <div
      style={{
        background: BG,
        minHeight: '100vh',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        padding: isMobile ? 16 : 32,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => navigate('/support')}
            style={{
              background: BG,
              boxShadow: NEU_SHADOW,
              border: 'none',
              borderRadius: 12,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowLeftIcon style={{ width: 16, height: 16, color: '#2E3040' }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontWeight: 800,
                fontSize: isMobile ? 24 : 32,
                letterSpacing: '-0.025em',
                color: '#2E3040',
                margin: 0,
              }}
            >
              Analytics Overview
            </h1>
            <p
              style={{
                fontWeight: 500,
                fontSize: 14,
                color: '#585A68',
                margin: '4px 0 0 0',
              }}
            >
              Comprehensive view of your support performance
            </p>
          </div>
          <TimeRangeSelector />
        </div>
      </div>

      {/* Key Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <StatCard
          label="Open Inbox"
          value={metrics.openInbox}
          badge="Realtime"
          badgeBg="rgba(99, 102, 241, 0.15)"
          badgeColor="#4F46E5"
        />
        <StatCard
          label="Resolved Today"
          value={metrics.resolvedToday}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          label="Autonomous Rate"
          value={`${metrics.autonomousResolutionRate}%`}
          trend="up"
          trendValue="3%"
        />
        <StatCard
          label="Avg Response"
          value={formatTime(metrics.avgFirstResponseTime)}
          sub="< 30s target"
          subColor="#10B981"
        />
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        {/* Ticket Volume Trend */}
        <Card title="TICKET VOLUME TREND">
          <LineChart data={ticketTrend} color="#6366F1" height={240} showGrid showPoints />
        </Card>

        {/* Outcome Distribution */}
        <Card title="OUTCOME DISTRIBUTION">
          <DonutChart
            segments={[
              { label: 'Autonomous', value: outcomes.autonomous, color: '#10B981' },
              { label: 'Escalated', value: outcomes.escalated, color: '#FBBF24' },
              { label: 'Pending', value: outcomes.pending, color: '#6B7280' },
            ]}
            size={160}
            centerLabel="Total"
            centerValue={outcomes.totalResolved.toString()}
            showLegend
          />
        </Card>
      </div>

      {/* Channel Performance */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Channel Performance" subtitle="Resolution rates by channel" />
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {channelMetrics.map((channel) => {
              const autonomousRate = Math.round((channel.autonomous / channel.total) * 100)
              return (
                <div key={channel.channel}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontWeight: 700,
                          fontSize: 14,
                          color: '#2E3040',
                          textTransform: 'capitalize',
                        }}
                      >
                        {channel.channel}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 12,
                          color: '#585A68',
                        }}
                      >
                        {channel.total} tickets
                      </span>
                    </div>
                    <div style={{  display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: 11,
                          color: '#6B7280',
                        }}
                      >
                        Avg response: {formatTime(channel.avgResponseTime)}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontWeight: 700,
                          fontSize: 14,
                          color: autonomousRate >= 70 ? '#10B981' : '#FBBF24',
                        }}
                      >
                        {autonomousRate}%
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 8,
                      borderRadius: 9999,
                      background: BG,
                      boxShadow: NEU_INSET,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${autonomousRate}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #10B981, #059669)',
                        borderRadius: 9999,
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Recent Activity + Knowledge Gaps */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 24,
        }}
      >
        {/* Recent Interactions */}
        <div>
          <SectionHeader
            title="Recent Interactions"
            subtitle="Last 10 customer touchpoints"
            action={
              <button
                onClick={() => navigate('/support/inbox')}
                style={{
                  background: BG,
                  boxShadow: NEU_SHADOW,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#6366F1',
                  cursor: 'pointer',
                }}
              >
                View All →
              </button>
            }
          />
          <RecentInteractionsList data={data} />
        </div>

        {/* Knowledge Gaps */}
        <div>
          <SectionHeader
            title="Knowledge Gaps"
            subtitle="Questions Lira couldn't answer"
            action={
              <button
                onClick={() => navigate('/support/knowledge')}
                style={{
                  background: BG,
                  boxShadow: NEU_SHADOW,
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontWeight: 700,
                  fontSize: 12,
                  color: '#6366F1',
                  cursor: 'pointer',
                }}
              >
                Manage →
              </button>
            }
          />
          <KnowledgeGapsPanel data={data} />
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ marginTop: 40, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/support/analytics/proactive')}
          style={{
            background: BG,
            boxShadow: NEU_SHADOW,
            border: 'none',
            borderRadius: 12,
            padding: '12px 20px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: '#6366F1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ChartBarIcon style={{ width: 16, height: 16 }} />
          Proactive Outreach
        </button>
        <button
          onClick={() => navigate('/support/analytics/weekly')}
          style={{
            background: BG,
            boxShadow: NEU_SHADOW,
            border: 'none',
            borderRadius: 12,
            padding: '12px 20px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: '#6366F1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CalendarIcon style={{ width: 16, height: 16 }} />
          Weekly Report
        </button>
        <button
          onClick={() => navigate('/support/analytics/billing')}
          style={{
            background: BG,
            boxShadow: NEU_SHADOW,
            border: 'none',
            borderRadius: 12,
            padding: '12px 20px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 13,
            color: '#6366F1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          💰 Billing & Outcomes
        </button>
      </div>
    </div>
  )
}
