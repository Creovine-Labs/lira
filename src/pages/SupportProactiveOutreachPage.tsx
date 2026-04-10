// ── Proactive Outreach Performance Dashboard ──────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  PlusIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { useIsMobile } from '@/hooks'
import {
  BG,
  NEU_SHADOW,
  NEU_INSET,
  StatCard,
  LineChart,
  BarChart,
  ProgressBar,
  SectionHeader,
  Card,
} from '@/features/support/components/AnalyticsComponents'
import { generateMockAnalyticsData } from '@/features/support/mock-analytics-data'
import type { SupportAnalyticsData, ProactiveTriggerMetrics } from '@/features/support/analytics-types'

// ── Trigger Performance Card ──────────────────────────────────────────────────

function TriggerPerformanceCard({ trigger }: { trigger: ProactiveTriggerMetrics }) {
  const successRate = trigger.preventionRate

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 16,
        padding: 20,
        transition: 'transform 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontWeight: 800,
              fontSize: 16,
              color: '#2E3040',
              margin: 0,
              marginBottom: 4,
            }}
          >
            {trigger.name}
          </h3>
          <span
            style={{
              fontFamily: 'Fira Code, monospace',
              fontSize: 11,
              color: '#6B7280',
              background: 'rgba(0,0,0,0.03)',
              padding: '2px 6px',
              borderRadius: 4,
            }}
          >
            {trigger.eventType}
          </span>
        </div>
        <div
          style={{
            background: successRate >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            color: successRate >= 75 ? '#059669' : '#D97706',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 800,
            fontSize: 20,
            padding: '8px 12px',
            borderRadius: 12,
          }}
        >
          {successRate}%
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#585A68',
              marginBottom: 4,
            }}
          >
            Triggered
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 24,
              fontWeight: 800,
              color: '#2E3040',
            }}
          >
            {trigger.triggered}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#585A68',
              marginBottom: 4,
            }}
          >
            Prevented
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 24,
              fontWeight: 800,
              color: '#10B981',
            }}
          >
            {trigger.ticketsPrevented}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#585A68',
              marginBottom: 4,
            }}
          >
            Responses
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 24,
              fontWeight: 800,
              color: '#6366F1',
            }}
          >
            {trigger.customerResponses}
          </div>
        </div>
      </div>

      {/* Prevention Rate Bar */}
      <div>
        <div
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 11,
            fontWeight: 600,
            color: '#585A68',
            marginBottom: 6,
          }}
        >
          Prevention Rate
        </div>
        <div
          style={{
            width: '100%',
            height: 10,
            borderRadius: 9999,
            background: BG,
            boxShadow: NEU_INSET,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${successRate}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${successRate >= 75 ? '#10B981' : '#FBBF24'}, ${successRate >= 75 ? '#059669' : '#F59E0B'})`,
              borderRadius: 9999,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button
          style={{
            flex: 1,
            background: BG,
            boxShadow: NEU_SHADOW,
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            color: '#6366F1',
            cursor: 'pointer',
          }}
        >
          Edit Trigger
        </button>
        <button
          style={{
            flex: 1,
            background: BG,
            boxShadow: NEU_SHADOW,
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontWeight: 700,
            fontSize: 11,
            color: '#585A68',
            cursor: 'pointer',
          }}
        >
          View Logs
        </button>
      </div>
    </div>
  )
}

// ── Impact Summary ────────────────────────────────────────────────────────────

function ImpactSummary({ triggers }: { triggers: ProactiveTriggerMetrics[] }) {
  const totalTriggered = triggers.reduce((sum, t) => sum + t.triggered, 0)
  const totalPrevented = triggers.reduce((sum, t) => sum + t.ticketsPrevented, 0)
  const avgPreventionRate = Math.round(
    triggers.reduce((sum, t) => sum + t.preventionRate, 0) / triggers.length
  )
  const timesSaved = totalPrevented * 5 // Assuming 5 min per prevented ticket

  return (
    <div
      style={{
        background: BG,
        boxShadow: NEU_SHADOW,
        borderRadius: 20,
        padding: 24,
      }}
    >
      <h3
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          color: '#585A68',
          margin: 0,
          marginBottom: 20,
        }}
      >
        Proactive Impact Summary
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <BoltIcon style={{ width: 20, height: 20, color: '#6366F1' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#585A68',
              }}
            >
              Total Triggered
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              color: '#2E3040',
            }}
          >
            {totalTriggered}
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <CheckCircleIcon style={{ width: 20, height: 20, color: '#10B981' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#585A68',
              }}
            >
              Tickets Prevented
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              color: '#10B981',
            }}
          >
            {totalPrevented}
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <SparklesIcon style={{ width: 20, height: 20, color: '#FBBF24' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#585A68',
              }}
            >
              Avg Prevention
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              color: '#2E3040',
            }}
          >
            {avgPreventionRate}%
          </div>
        </div>

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 20 }}>⏱</span>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#585A68',
              }}
            >
              Time Saved
            </span>
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 32,
              fontWeight: 800,
              color: '#2E3040',
            }}
          >
            {Math.floor(timesSaved / 60)}h
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SupportProactiveOutreachPage() {
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

  const totalPrevented = data.proactiveTriggers.reduce((sum, t) => sum + t.ticketsPrevented, 0)
  const totalResponseRate = Math.round(
    (data.proactiveTriggers.reduce((sum, t) => sum + t.customerResponses, 0) /
      data.proactiveTriggers.reduce((sum, t) => sum + t.triggered, 0)) *
      100
  )

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
              Proactive Outreach Performance
            </h1>
            <p
              style={{
                fontWeight: 500,
                fontSize: 14,
                color: '#585A68',
                margin: '4px 0 0 0',
              }}
            >
              Prevent tickets before they're filed
            </p>
          </div>
          <button
            onClick={() => navigate('/support/proactive/new')}
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
            <PlusIcon style={{ width: 16, height: 16 }} />
            New Trigger
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
        <StatCard
          label="Active Triggers"
          value={data.proactiveTriggers.length}
          badge="Enabled"
          badgeBg="rgba(16, 185, 129, 0.15)"
          badgeColor="#059669"
        />
        <StatCard
          label="Tickets Prevented"
          value={totalPrevented}
          trend="up"
          trendValue="18%"
        />
        <StatCard
          label="Response Rate"
          value={`${totalResponseRate}%`}
          trend="up"
          trendValue="5%"
        />
        <StatCard
          label="Time Saved"
          value={`${Math.floor((totalPrevented * 5) / 60)}h`}
          sub="This week"
          subColor="#10B981"
        />
      </div>

      {/* Impact Summary */}
      <div style={{ marginBottom: 32 }}>
        <ImpactSummary triggers={data.proactiveTriggers} />
      </div>

      {/* Trigger Performance by Prevention Rate */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          title="Trigger Performance Comparison"
          subtitle="Ranked by prevention rate"
        />
        <Card>
          <BarChart
            data={data.proactiveTriggers
              .sort((a, b) => b.preventionRate - a.preventionRate)
              .map((t) => ({
                label: t.name,
                value: t.preventionRate,
              }))}
            color="#10B981"
            height={280}
            horizontal
          />
        </Card>
      </div>

      {/* Trigger Cards Grid */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="All Triggers" subtitle="Configure and monitor each trigger" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 20,
          }}
        >
          {data.proactiveTriggers.map((trigger) => (
            <TriggerPerformanceCard key={trigger.triggerId} trigger={trigger} />
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <Card title="OPTIMIZATION TIPS">
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
              ✓ High-performing triggers (&gt;75% prevention)
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.5,
              }}
            >
              <strong>Subscription Expiring</strong> and <strong>KYC Verification Blocked</strong>{' '}
              have the highest prevention rates. Consider modeling new triggers on their structure.
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
              ⚠ Needs improvement
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.5,
              }}
            >
              <strong>API Error Spike</strong> has a 67% prevention rate. Review the outreach
              template and timing — customers may need more context or a faster response window.
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
              💡 Pro tip
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.5,
              }}
            >
              Triggers with response rates above 80% but lower prevention rates might benefit from
              adding a follow-up message 24 hours later if the issue persists.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
