/**
 * Screen 38 — Action Engine: Integration Health Panel
 * Pixel-faithful recreation of Figma node 1-10450
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MagnifyingGlassIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon as CheckOutline,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
} from '@heroicons/react/24/solid'
import { ACTION_TABS } from './SupportActionApprovalQueuePage'

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG      = '#ECEEF3'
const CARD    = '#FFFFFF'
const SHADOW  = '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
const PRIMARY = '#6366F1'
const DARK    = '#111827'
const MUTED   = '#6B7280'
const BORDER  = '#E5E7EB'
const LIGHT   = '#F9FAFB'
const GREEN   = '#16A34A'
const RED     = '#EF4444'
const AMBER   = '#D97706'
const FONT    = 'Plus Jakarta Sans, sans-serif'

// ── Types ─────────────────────────────────────────────────────────────────────
type IntegrationStatus = 'connected' | 'error' | 'rate-limited'

interface StatInfo {
  label: string
  value: string
}

interface Integration {
  id: string
  name: string
  abbr: string
  iconBg: string
  iconText: string
  status: IntegrationStatus
  stats: [StatInfo, StatInfo, StatInfo, StatInfo]
  errorMessage?: string
  warningMessage?: string
}

// ── Historical uptime row ─────────────────────────────────────────────────────
type DotStatus = 'ok' | 'degraded' | 'outage' | 'empty'
interface UptimeRow { name: string; dots: DotStatus[]; pct: string }

const UPTIME_ROWS: UptimeRow[] = [
  { name: 'HubSpot',    dots: ['ok','ok','ok','ok','ok','ok','ok'], pct: '100%' },
  { name: 'Salesforce', dots: ['ok','degraded','ok','ok','ok','ok','ok'], pct: '98.4%' },
  { name: 'Resend',     dots: ['ok','ok','outage','outage','ok','ok','outage'], pct: '92%' },
  { name: 'Teams',      dots: ['ok','ok','ok','degraded','ok','ok','ok'], pct: '99.0%' },
  { name: 'Linear',     dots: ['ok','ok','ok','ok','ok','ok','ok'], pct: '100%' },
  { name: 'Slack',      dots: ['ok','ok','ok','ok','ok','ok','ok'], pct: '100%' },
]

const DOT_COLOR: Record<DotStatus, string> = {
  ok:       '#22C55E',
  degraded: '#F59E0B',
  outage:   '#EF4444',
  empty:    '#E5E7EB',
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'hubspot', name: 'HubSpot', abbr: 'HS', iconBg: '#FFF7ED', iconText: '#F97316',
    status: 'connected',
    stats: [
      { label: 'LAST ACTION', value: '2m ago' },
      { label: 'TODAY',       value: '47' },
      { label: 'AVG SPEED',   value: '341ms' },
      { label: 'ERRORS',      value: '0' },
    ],
  },
  {
    id: 'salesforce', name: 'Salesforce', abbr: 'SF', iconBg: '#EFF6FF', iconText: '#00A1E0',
    status: 'connected',
    stats: [
      { label: 'LAST ACTION', value: '12m ago' },
      { label: 'TODAY',       value: '12' },
      { label: 'AVG SPEED',   value: '521ms' },
      { label: 'ERRORS',      value: '0' },
    ],
  },
  {
    id: 'resend', name: 'Resend', abbr: 'RS', iconBg: '#FEF2F2', iconText: '#DC2626',
    status: 'error',
    stats: [
      { label: 'LAST ACTION', value: '14h ago' },
      { label: 'TODAY',       value: '3' },
      { label: 'AVG SPEED',   value: '--' },
      { label: 'ERRORS',      value: '1' },
    ],
    errorMessage: '1 error — recipient_suppressed (422)',
  },
  {
    id: 'teams', name: 'Teams', abbr: 'TM', iconBg: '#EEF2FF', iconText: '#5B5EA6',
    status: 'rate-limited',
    stats: [
      { label: 'LAST ACTION', value: '1h ago' },
      { label: 'TODAY',       value: '2' },
      { label: 'AVG SPEED',   value: '892ms' },
      { label: 'LIMIT HITS',  value: '1×' },
    ],
    warningMessage: 'Rate limit hit at 11:30 AM',
  },
  {
    id: 'linear', name: 'Linear', abbr: 'LN', iconBg: '#F5F3FF', iconText: '#5E6AD2',
    status: 'connected',
    stats: [
      { label: 'LAST ACTION', value: '35m ago' },
      { label: 'TODAY',       value: '8' },
      { label: 'AVG SPEED',   value: '198ms' },
      { label: 'ERRORS',      value: '0' },
    ],
  },
  {
    id: 'slack', name: 'Slack', abbr: 'SL', iconBg: '#FDF4FF', iconText: '#4A154B',
    status: 'connected',
    stats: [
      { label: 'LAST ACTION', value: '5m ago' },
      { label: 'TODAY',       value: '31' },
      { label: 'AVG SPEED',   value: '112ms' },
      { label: 'ERRORS',      value: '0' },
    ],
  },
]

// ── Integration icon ──────────────────────────────────────────────────────────
function IntIcon({ abbr, bg, textColor, size = 40 }: { abbr: string; bg: string; textColor: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: Math.round(size * 0.28), color: textColor }}>{abbr}</span>
    </div>
  )
}

// ── Status chip ───────────────────────────────────────────────────────────────
function StatusChip({ status }: { status: IntegrationStatus }) {
  if (status === 'connected') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN }} />
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: GREEN }}>Connected ✓</span>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: RED }} />
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: RED }}>Error</span>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER }} />
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: AMBER }}>Rate limited</span>
    </div>
  )
}

// ── Mini stat cell ────────────────────────────────────────────────────────────
function MiniStat({ info, valueColor }: { info: StatInfo; valueColor?: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: FONT, fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, marginBottom: 4 }}>
        {info.label}
      </div>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: valueColor ?? DARK }}>
        {info.value}
      </div>
    </div>
  )
}

// ── Integration card ──────────────────────────────────────────────────────────
function IntCard({ intg, onClick, selected }: { intg: Integration; onClick: () => void; selected: boolean }) {
  const errColor = intg.status === 'error' ? RED : AMBER
  return (
    <div
      onClick={onClick}
      style={{
        background: CARD, borderRadius: 16, boxShadow: SHADOW,
        border: selected ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
        padding: '20px 22px', cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IntIcon abbr={intg.abbr} bg={intg.iconBg} textColor={intg.iconText} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}>{intg.name}</div>
            <StatusChip status={intg.status} />
          </div>
        </div>
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontWeight: 600, fontSize: 12,
            color: intg.status === 'connected' ? PRIMARY : errColor,
          }}
        >
          {intg.status === 'error' ? 'View error log' : 'View history'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
        {intg.stats.map((st, i) => (
          <MiniStat
            key={i}
            info={st}
            valueColor={st.label === 'ERRORS' && st.value !== '0' ? RED : undefined}
          />
        ))}
      </div>

      {/* Error/warning banner */}
      {intg.errorMessage && (
        <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExclamationCircleIcon style={{ width: 14, height: 14, color: RED, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: RED }}>{intg.errorMessage}</span>
        </div>
      )}
      {intg.warningMessage && (
        <div style={{ marginTop: 12, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <InformationCircleIcon style={{ width: 14, height: 14, color: AMBER, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT, fontSize: 12, color: AMBER }}>{intg.warningMessage}</span>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportActionIntegrationHealthPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState('4 minutes ago')
  const [dateRange, setDateRange] = useState<'Today' | '7 days' | '30 days'>('Today')

  function runHealthCheck() {
    setChecking(true)
    setTimeout(() => {
      setChecking(false)
      setLastCheck('just now')
    }, 2000)
  }

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top search bar (global app header style) ── */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 56, gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 24, padding: '8px 16px', maxWidth: 400 }}>
          <MagnifyingGlassIcon style={{ width: 14, height: 14, color: MUTED }} />
          <span style={{ fontFamily: FONT, fontSize: 13, color: '#9CA3AF' }}>Search integrations...</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <BellIcon style={{ width: 16, height: 16, color: MUTED }} />
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Cog6ToothIcon style={{ width: 16, height: 16, color: MUTED }} />
          </div>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #818CF8, #4F46E5)', cursor: 'pointer' }} />
        </div>
      </div>

      {/* ── Page content ── */}
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: DARK, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Integration Health
            </h1>
            {/* Last check status */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '4px 12px' }}>
              <CheckCircleIcon style={{ width: 13, height: 13, color: GREEN }} />
              <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 600, color: GREEN }}>
                Last health check: {lastCheck} — all integrations responding
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Date range toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
              {(['Today', '7 days', '30 days'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => setDateRange(opt)}
                  style={{
                    background: dateRange === opt ? '#F3F4F6' : CARD,
                    border: 'none', padding: '8px 16px', cursor: 'pointer',
                    fontFamily: FONT, fontWeight: dateRange === opt ? 600 : 400,
                    fontSize: 13, color: dateRange === opt ? DARK : MUTED,
                    borderRight: opt !== '30 days' ? `1px solid ${BORDER}` : 'none',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {/* Run health check */}
            <button
              onClick={runHealthCheck}
              disabled={checking}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: PRIMARY, border: 'none', borderRadius: 12,
                padding: '10px 20px', cursor: checking ? 'not-allowed' : 'pointer',
                fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#fff',
                opacity: checking ? 0.8 : 1,
              }}
            >
              <ArrowPathIcon style={{ width: 16, height: 16, animation: checking ? 'spin 1s linear infinite' : 'none' }} />
              {checking ? 'Checking...' : 'Run health check'}
            </button>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, gap: 0 }}>
          {ACTION_TABS.map(tab => {
            const isActive = tab.path === '/support/actions/integrations'
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px',
                  fontFamily: FONT, fontWeight: isActive ? 600 : 400, fontSize: 14,
                  color: isActive ? PRIMARY : MUTED,
                  borderBottom: isActive ? `2px solid ${PRIMARY}` : '2px solid transparent',
                  marginBottom: -1,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ── Integration grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {INTEGRATIONS.map(intg => (
            <IntCard
              key={intg.id}
              intg={intg}
              selected={selectedId === intg.id}
              onClick={() => setSelectedId(prev => prev === intg.id ? null : intg.id)}
            />
          ))}
        </div>

        {/* ── Historical Uptime ── */}
        <div style={{ background: CARD, borderRadius: 16, boxShadow: SHADOW, padding: '24px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Historical Uptime</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {([['ok','Operational','#22C55E'],['degraded','Degraded','#F59E0B'],['outage','Outage','#EF4444']] as const).map(([k, label, color]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {UPTIME_ROWS.map(row => (
              <div key={row.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 100, fontFamily: FONT, fontSize: 13, fontWeight: 600, color: DARK, flexShrink: 0 }}>
                  {row.name}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 3 }}>
                  {row.dots.map((d, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1, height: 20, borderRadius: 3,
                        background: DOT_COLOR[d],
                      }}
                    />
                  ))}
                </div>
                <div style={{ width: 48, fontFamily: FONT, fontWeight: 700, fontSize: 13, color: row.pct === '100%' ? GREEN : DARK, textAlign: 'right', flexShrink: 0 }}>
                  {row.pct}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
