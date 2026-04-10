// ── Billing & Outcome Tracking Dashboard ──────────────────────────────────────

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
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
import type { SupportAnalyticsData, BillingOutcome } from '@/features/support/analytics-types'

// ── Cost Comparison Card ──────────────────────────────────────────────────────

function CostComparisonCard({ thisMonth, traditional }: { thisMonth: number; traditional: number }) {
  const savings = traditional - thisMonth
  const savingsPercent = Math.round((savings / traditional) * 100)

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #10B981, #059669)',
        borderRadius: 20,
        padding: 32,
        color: 'white',
        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
      }}
    >
      <div
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 16,
          opacity: 0.9,
        }}
      >
        💰 Cost Savings vs. Traditional Support
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 12,
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            Lira (Outcome-Based)
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            ${thisMonth.toLocaleString()}
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 12,
              marginBottom: 8,
              opacity: 0.8,
            }}
          >
            Traditional (Seat-Based)
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1,
              textDecoration: 'line-through',
              opacity: 0.6,
            }}
          >
            ${traditional.toLocaleString()}
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 12,
              marginBottom: 4,
              opacity: 0.9,
            }}
          >
            You're saving
          </div>
          <div
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            ${savings.toLocaleString()}
          </div>
        </div>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.3)',
            borderRadius: 12,
            padding: '8px 16px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 24,
            fontWeight: 800,
          }}
        >
          {savingsPercent}%
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 11,
          opacity: 0.8,
          lineHeight: 1.5,
        }}
      >
        This month alone. With Lira, you only pay for verified successful resolutions — never for
        escalations or failed attempts.
      </div>
    </div>
  )
}

// ── Billing Breakdown Table ───────────────────────────────────────────────────

function BillingBreakdownTable({ data }: { data: BillingOutcome[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          gap: 16,
          padding: '12px 20px',
          background: 'rgba(0,0,0,0.02)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
        }}
      >
        {['Month', 'Total', 'Billable', 'Non-Billable', 'Revenue'].map((header) => (
          <div
            key={header}
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#585A68',
            }}
          >
            {header}
          </div>
        ))}
      </div>

      {/* Rows */}
      {data.map((row, i) => {
        const monthLabel = new Date(row.month + '-01').toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
        const billableRate = Math.round((row.billableResolutions / row.totalInteractions) * 100)

        return (
          <div
            key={row.month}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: 16,
              padding: '16px 20px',
              borderBottom: i < data.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.02)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#2E3040',
              }}
            >
              {monthLabel}
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#585A68',
              }}
            >
              {row.totalInteractions}
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#10B981',
              }}
            >
              {row.billableResolutions} <span style={{ fontSize: 10, opacity: 0.7 }}>({billableRate}%)</span>
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#FBBF24',
              }}
            >
              {row.nonBillableEscalations}
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 14,
                fontWeight: 800,
                color: '#2E3040',
              }}
            >
              ${row.revenue.toLocaleString()}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Outcome Distribution Card ─────────────────────────────────────────────────

function OutcomeDistributionCard({ data }: { data: SupportAnalyticsData }) {
  const { outcomes } = data
  const total = outcomes.autonomous + outcomes.escalated + outcomes.pending

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
          marginBottom: 24,
        }}
      >
        Outcome Distribution
      </h3>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <DonutChart
          segments={[
            { label: 'Billable (Autonomous)', value: outcomes.autonomous, color: '#10B981' },
            { label: 'Non-Billable (Escalated)', value: outcomes.escalated, color: '#FBBF24' },
            { label: 'Pending', value: outcomes.pending, color: '#6B7280' },
          ]}
          size={200}
          centerLabel="Total"
          centerValue={total.toString()}
          showLegend={false}
        />
      </div>

      {/* Custom Legend with Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircleIcon style={{ width: 20, height: 20, color: '#10B981' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#059669',
              }}
            >
              Billable (Autonomous)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#10B981',
              }}
            >
              {outcomes.autonomous}
            </span>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#059669',
              }}
            >
              {Math.round((outcomes.autonomous / total) * 100)}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(251, 191, 36, 0.1)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <XCircleIcon style={{ width: 20, height: 20, color: '#FBBF24' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#D97706',
              }}
            >
              Non-Billable (Escalated)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#FBBF24',
              }}
            >
              {outcomes.escalated}
            </span>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#D97706',
              }}
            >
              {Math.round((outcomes.escalated / total) * 100)}%
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(107, 114, 128, 0.1)',
            borderRadius: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClockIcon style={{ width: 20, height: 20, color: '#6B7280' }} />
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 13,
                fontWeight: 700,
                color: '#6B7280',
              }}
            >
              Pending
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 20,
                fontWeight: 800,
                color: '#6B7280',
              }}
            >
              {outcomes.pending}
            </span>
            <span
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                fontWeight: 600,
                color: '#6B7280',
              }}
            >
              {Math.round((outcomes.pending / total) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SupportBillingOutcomePage() {
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

  const currentMonth = data.billing[data.billing.length - 1]
  const totalRevenue = data.billing.reduce((sum, m) => sum + m.revenue, 0)
  const avgCostPerResolution = data.billing.reduce((sum, m) => sum + m.costPerResolution, 0) / data.billing.length
  const totalSavings = data.billing.reduce((sum, m) => sum + m.savingsVsTraditional, 0)

  // Revenue trend data
  const revenueTrend = data.billing.map((m) => ({
    date: m.month,
    value: m.revenue,
  }))

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
              Billing & Outcome Tracking
            </h1>
            <p
              style={{
                fontWeight: 500,
                fontSize: 14,
                color: '#585A68',
                margin: '4px 0 0 0',
              }}
            >
              Pay only for successful resolutions
            </p>
          </div>
          <button
            onClick={() => {
              alert('Export billing report')
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
        <StatCard
          label="This Month"
          value={`$${currentMonth.revenue.toLocaleString()}`}
          trend="up"
          trendValue="12%"
        />
        <StatCard
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          sub="Last 6 months"
          subColor="#10B981"
        />
        <StatCard
          label="Cost/Resolution"
          value={`$${avgCostPerResolution.toFixed(2)}`}
          badge="Avg"
          badgeBg="rgba(99, 102, 241, 0.15)"
          badgeColor="#4F46E5"
        />
        <StatCard
          label="Total Savings"
          value={`$${(totalSavings / 1000).toFixed(0)}k`}
          trend="up"
          trendValue="vs. Traditional"
        />
      </div>

      {/* Cost Comparison */}
      <div style={{ marginBottom: 32 }}>
        <CostComparisonCard
          thisMonth={currentMonth.revenue}
          traditional={currentMonth.savingsVsTraditional}
        />
      </div>

      {/* Revenue Trend & Outcome Distribution */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: 24,
          marginBottom: 32,
        }}
      >
        <Card title="REVENUE TREND (6 MONTHS)">
          <LineChart data={revenueTrend} color="#10B981" height={240} showGrid showPoints />
        </Card>

        <OutcomeDistributionCard data={data} />
      </div>

      {/* Billing Breakdown Table */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader title="Billing Breakdown" subtitle="Monthly breakdown by outcome type" />
        <Card noPadding>
          <BillingBreakdownTable data={data.billing} />
        </Card>
      </div>

      {/* Pricing Model Explanation */}
      <Card title="HOW OUTCOME-BASED PRICING WORKS">
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 20 }}>
          <div
            style={{
              padding: 20,
              background: 'rgba(16, 185, 129, 0.1)',
              borderRadius: 12,
              borderLeft: '4px solid #10B981',
            }}
          >
            <CheckCircleIcon style={{ width: 32, height: 32, color: '#10B981', marginBottom: 12 }} />
            <h4
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: 14,
                color: '#059669',
                margin: 0,
                marginBottom: 8,
              }}
            >
              You Pay For
            </h4>
            <ul
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
                margin: 0,
                paddingLeft: 16,
              }}
            >
              <li>Verified autonomous resolutions</li>
              <li>Positive customer satisfaction</li>
              <li>Proactive tickets prevented</li>
            </ul>
          </div>

          <div
            style={{
              padding: 20,
              background: 'rgba(251, 191, 36, 0.1)',
              borderRadius: 12,
              borderLeft: '4px solid #FBBF24',
            }}
          >
            <XCircleIcon style={{ width: 32, height: 32, color: '#FBBF24', marginBottom: 12 }} />
            <h4
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: 14,
                color: '#D97706',
                margin: 0,
                marginBottom: 8,
              }}
            >
              You Don't Pay For
            </h4>
            <ul
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
                margin: 0,
                paddingLeft: 16,
              }}
            >
              <li>Escalated tickets</li>
              <li>Failed resolution attempts</li>
              <li>Messages with no response</li>
            </ul>
          </div>

          <div
            style={{
              padding: 20,
              background: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 12,
              borderLeft: '4px solid #6366F1',
            }}
          >
            <CurrencyDollarIcon style={{ width: 32, height: 32, color: '#6366F1', marginBottom: 12 }} />
            <h4
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 800,
                fontSize: 14,
                color: '#4F46E5',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Pricing
            </h4>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#585A68',
                lineHeight: 1.6,
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <strong>${avgCostPerResolution.toFixed(2)}</strong> per successful resolution
              </div>
              <div style={{ fontSize: 10, color: '#6B7280' }}>
                vs. $50-150/mo per seat with traditional tools
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
