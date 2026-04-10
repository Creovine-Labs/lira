// ── Weekly Support Report Dashboard ───────────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ClockIcon,
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
  ProgressBar,
  SectionHeader,
  Card,
} from '@/features/support/components/AnalyticsComponents'
import { generateMockAnalyticsData } from '@/features/support/mock-analytics-data'
import type { SupportAnalyticsData, WeeklySupportReport } from '@/features/support/analytics-types'

// ── Hourly Distribution Chart ─────────────────────────────────────────────────

function HourlyDistributionChart({ data }: { data: WeeklySupportReport }) {
  const max = Math.max(...data.hourlyDistribution.map((h) => h.tickets), 1)

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 16,
        padding: 20,
        height: 280,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 2,
          height: '100%',
          paddingBottom: 30,
        }}
      >
        {data.hourlyDistribution.map((hour) => {
          const heightPercent = (hour.tickets / max) * 100
          const isPeakHour = hour.hour >= 9 && hour.hour <= 17

          return (
            <div
              key={hour.hour}
              style={{
                position: 'relative',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  minHeight: hour.tickets > 0 ? 4 : 1,
                  background: isPeakHour
                    ? 'linear-gradient(180deg, #6366F1, #4F46E5)'
                    : 'linear-gradient(180deg, #94A3B8, #64748B)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                }}
              />
              {hour.hour % 3 === 0 && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: -24,
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#585A68',
                  }}
                >
                  {hour.hour.toString().padStart(2, '0')}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Top Issues Table ──────────────────────────────────────────────────────────

function TopIssuesTable({ categories }: { categories: WeeklySupportReport['topIssueCategories'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {categories.map((cat, i) => (
        <div
          key={cat.category}
          style={{
            background: BG,
            boxShadow: NEU_SHADOW,
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              background: BG,
              boxShadow: NEU_INSET,
              borderRadius: 9999,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              color: '#6366F1',
              flexShrink: 0,
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                fontSize: 14,
                color: '#2E3040',
                marginBottom: 6,
              }}
            >
              {cat.category}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  color: '#585A68',
                }}
              >
                {cat.count} tickets
              </span>
              <span
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: cat.autonomousRate >= 70 ? '#10B981' : '#FBBF24',
                }}
              >
                {cat.autonomousRate}% autonomous
              </span>
            </div>
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 24,
              color: '#2E3040',
            }}
          >
            {cat.count}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── CSAT Trend Indicator ──────────────────────────────────────────────────────

function CSATTrendIndicator({ csat }: { csat: WeeklySupportReport['csat'] }) {
  const trendColor = {
    improving: '#10B981',
    stable: '#6B7280',
    declining: '#EF4444',
  }[csat.trend]

  const trendIcon = {
    improving: '↑',
    stable: '→',
    declining: '↓',
  }[csat.trend]

  const trendLabel = {
    improving: 'Improving',
    stable: 'Stable',
    declining: 'Declining',
  }[csat.trend]

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 16,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#585A68',
          textAlign: 'center',
        }}
      >
        Customer Satisfaction
      </div>
      <div
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 800,
          fontSize: 72,
          lineHeight: 1,
          color: '#2E3040',
        }}
      >
        {csat.average.toFixed(1)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            style={{
              fontSize: 24,
              color: i < Math.floor(csat.average) ? '#FBBF24' : 'rgba(0,0,0,0.1)',
            }}
          >
            ★
          </span>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: `${trendColor}22`,
          color: trendColor,
          padding: '6px 12px',
          borderRadius: 9999,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 700,
          fontSize: 12,
        }}
      >
        <span style={{ fontSize: 16 }}>{trendIcon}</span>
        {trendLabel}
      </div>
      <div
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 11,
          color: '#585A68',
        }}
      >
        Based on {csat.responses} responses
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SupportWeeklyReportPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [data, setData] = useState<SupportAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const report = data.weeklyReport
  const autonomousRate = Math.round((report.autonomous / report.totalTickets) * 100)

  const weekStartDate = new Date(report.weekStart).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const weekEndDate = new Date(report.weekEnd).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

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
            onClick={() => navigate('/support/analytics')}
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
              Weekly Support Report
            </h1>
            <p
              style={{
                fontWeight: 500,
                fontSize: 14,
                color: '#585A68',
                margin: '4px 0 0 0',
              }}
            >
              {weekStartDate} – {weekEndDate}
            </p>
          </div>
          <button
            onClick={() => {
              // Export report logic
              alert('Export functionality would trigger here')
            }}
            style={{
              background: BG,
              boxShadow: NEU_SHADOW,
              border: 'none',
              borderRadius: 12,
              padding: '10px 20px',
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
            <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            Export
          </button>
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
        <StatCard label="Total Tickets" value={report.totalTickets} trend="up" trendValue="8%" />
        <StatCard
          label="Resolved"
          value={report.resolved}
          sub={`${Math.round((report.resolved / report.totalTickets) * 100)}%`}
          subColor="#10B981"
        />
        <StatCard
          label="Autonomous"
          value={`${autonomousRate}%`}
          trend="up"
          trendValue="2%"
        />
        <StatCard
          label="Avg Response"
          value={`${report.avgResponseTime}s`}
          sub="Target: <30s"
          subColor={report.avgResponseTime < 30 ? '#10B981' : '#FBBF24'}
        />
      </div>

      {/* Grid: CSAT + Channel Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <CSATTrendIndicator csat={report.csat} />

        <Card title="CHANNEL BREAKDOWN">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {report.channelBreakdown.map((channel) => {
              const autonomousPercent = Math.round((channel.autonomous / channel.total) * 100)
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
                    <span
                      style={{
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        fontWeight: 700,
                        fontSize: 16,
                        color: autonomousPercent >= 70 ? '#10B981' : '#FBBF24',
                      }}
                    >
                      {autonomousPercent}%
                    </span>
                  </div>
                  <ProgressBar
                    label=""
                    value={channel.autonomous}
                    max={channel.total}
                    color="#10B981"
                    showPercentage={false}
                  />
                  <div
                    style={{
                      marginTop: 4,
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                      fontSize: 10,
                      color: '#6B7280',
                    }}
                  >
                    {channel.autonomous} autonomous • {channel.escalated} escalated • Avg response:{' '}
                    {channel.avgResponseTime}s
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          title="Hourly Ticket Distribution"
          subtitle="Peak hours are 9 AM – 5 PM"
        />
        <Card>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: 'linear-gradient(180deg, #6366F1, #4F46E5)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#585A68',
                  }}
                >
                  Business Hours (9-17)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: 'linear-gradient(180deg, #94A3B8, #64748B)',
                  }}
                />
                <span
                  style={{
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#585A68',
                  }}
                >
                  Off Hours
                </span>
              </div>
            </div>
          </div>
          <HourlyDistributionChart data={report} />
        </Card>
      </div>

      {/* Top Issue Categories */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Top Issue Categories" subtitle="Most frequent customer questions" />
        <TopIssuesTable categories={report.topIssueCategories} />
      </div>

      {/* Key Insights */}
      <Card title="KEY INSIGHTS">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              borderLeft: '4px solid #10B981',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#059669',
                marginBottom: 6,
              }}
            >
              ✓ Strong Performance
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
              }}
            >
              Your autonomous resolution rate of <strong>{autonomousRate}%</strong> is above the
              target of 70%. Transaction Status and Account Access categories are performing
              particularly well.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              borderLeft: '4px solid #6366F1',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#4F46E5',
                marginBottom: 6,
              }}
            >
              💡 Opportunity
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
              }}
            >
              API Integration questions have a 58% autonomous rate. Consider adding more technical
              documentation or code examples to the knowledge base to improve this.
            </div>
          </div>

          <div
            style={{
              background: 'rgba(251, 191, 36, 0.1)',
              borderLeft: '4px solid #FBBF24',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                fontSize: 13,
                color: '#D97706',
                marginBottom: 6,
              }}
            >
              📊 Trend
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
              }}
            >
              Ticket volume peaks between 11 AM and 2 PM. CSAT is {report.csat.trend} — keep
              monitoring customer feedback to maintain quality.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
