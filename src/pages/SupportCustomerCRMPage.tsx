/**
 * Screen 21 — Customer Profile: CRM Sync Status
 * Side-by-side view of Lira's customer profile vs. live CRM data, with sync controls.
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ArrowsRightLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MinusCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG           = '#E8EAF0'
const NEU_SHADOW   = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET    = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY      = '#6366F1'
const PRIMARY_DARK = '#4F46E5'
const DARK         = '#2E3040'
const MUTED        = '#585A68'
const WHITE        = '#FFFFFF'
const FONT         = 'Plus Jakarta Sans, sans-serif'
const GREEN        = '#059669'
const AMBER        = '#D97706'
const RED          = '#DC2626'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'
const AI_BG        = '#EEF2FF'
const AI_BORDER    = 'rgba(224,231,255,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
type SyncStatus = 'synced' | 'mismatch' | 'unmapped'

interface FieldRow {
  field: string
  liraValue: string
  crmValue: string
  status: SyncStatus
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const FIELD_ROWS: FieldRow[] = [
  { field: 'Full name',     liraValue: 'Jana Fischer',          crmValue: 'Jana Fischer',           status: 'synced' },
  { field: 'Email',         liraValue: 'jana.fischer@acme.de',  crmValue: 'jana.fischer@acme.de',   status: 'synced' },
  { field: 'Phone',         liraValue: '+49 30 1234 5678',      crmValue: '+4930 12345678',          status: 'mismatch' },
  { field: 'Tier',          liraValue: 'VIP',                   crmValue: 'VIP Customer',            status: 'mismatch' },
  { field: 'Churn risk',    liraValue: '12 (Low)',               crmValue: '—',                      status: 'unmapped' },
  { field: 'Sentiment',     liraValue: 'Improving ↑',            crmValue: '—',                      status: 'unmapped' },
  { field: 'Total interactions', liraValue: '14',               crmValue: '—',                      status: 'unmapped' },
  { field: 'Lifecycle stage',    liraValue: '—',                crmValue: 'Customer',               status: 'unmapped' },
  { field: 'Owner',         liraValue: '—',                     crmValue: 'Sarah Kowalski',          status: 'unmapped' },
  { field: 'Last activity date', liraValue: 'Apr 9, 2026',      crmValue: 'Apr 9, 2026',             status: 'synced' },
  { field: 'City',          liraValue: '—',                     crmValue: 'Berlin',                  status: 'unmapped' },
  { field: 'Country',       liraValue: 'Germany',               crmValue: 'Germany',                 status: 'synced' },
]

const MISMATCHES = FIELD_ROWS.filter(f => f.status === 'mismatch')

// ── Sync status badge ──────────────────────────────────────────────────────────
function StatusIcon({ status }: { status: SyncStatus }) {
  if (status === 'synced')   return <CheckCircleIcon style={{ width: 15, height: 15, color: GREEN }} />
  if (status === 'mismatch') return <ExclamationTriangleIcon style={{ width: 15, height: 15, color: AMBER }} />
  return <MinusCircleIcon style={{ width: 15, height: 15, color: MUTED }} />
}

function StatusLabel({ status }: { status: SyncStatus }) {
  const config = {
    synced:   { label: '✓ Synced',    color: GREEN },
    mismatch: { label: '⚠ Mismatch',  color: AMBER },
    unmapped: { label: '— Not mapped', color: MUTED },
  }[status]
  return (
    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: config.color }}>{config.label}</span>
  )
}

// ── Mismatch resolution row ────────────────────────────────────────────────────
function MismatchRow({ row, onResolve }: { row: FieldRow; onResolve: (field: string, choice: 'lira' | 'crm') => void }) {
  return (
    <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ExclamationTriangleIcon style={{ width: 13, height: 13, color: AMBER }} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: '#92400E' }}>{row.field}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, marginBottom: 3 }}>Lira value</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>{row.liraValue}</div>
        </div>
        <ArrowsRightLeftIcon style={{ width: 16, height: 16, color: MUTED, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, marginBottom: 3 }}>HubSpot value</div>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>{row.crmValue}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { label: 'Keep Lira\'s', choice: 'lira' as const },
          { label: 'Keep HubSpot\'s', choice: 'crm' as const },
        ].map(option => (
          <button
            key={option.choice}
            onClick={() => onResolve(row.field, option.choice)}
            style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK,
              background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 10,
              padding: '8px 14px', cursor: 'pointer',
            }}
          >
            {option.label}
          </button>
        ))}
        <button style={{
          fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px',
        }}>
          Keep both in notes
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportCustomerCRMPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [syncing, setSyncing] = useState(false)
  const [resolvedFields, setResolvedFields] = useState<Set<string>>(new Set())
  const [lastSynced] = useState('Apr 9, 2026 at 9:12 AM')

  const unresolvedMismatches = MISMATCHES.filter(m => !resolvedFields.has(m.field))

  function handleSync() {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  function handleResolve(field: string) {
    setResolvedFields(prev => new Set([...prev, field]))
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '20px 16px 0' : '28px 32px 0',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/support/customers')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ChevronLeftIcon style={{ width: 14, height: 14, color: MUTED }} />
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: MUTED }}>All Customers</span>
          </button>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED }}>/</span>
          <button
            onClick={() => navigate(`/support/customers/${id ?? 'default'}`)}
            style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Jana Fischer
          </button>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED }}>/</span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>CRM Sync</span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {['Overview', 'Timeline', 'CRM Sync'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Overview')  navigate(`/support/customers/${id ?? 'default'}`)
                if (tab === 'Timeline') navigate(`/support/customers/${id ?? 'default'}/timeline`)
              }}
              style={{
                fontFamily: FONT, fontWeight: tab === 'CRM Sync' ? 700 : 500, fontSize: 13,
                color: tab === 'CRM Sync' ? PRIMARY : MUTED,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '14px 20px',
                borderBottom: tab === 'CRM Sync' ? `2px solid ${PRIMARY}` : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Sync status bar */}
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <CheckCircleIcon style={{ width: 20, height: 20, color: GREEN }} />
            <div>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Connected to HubSpot</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <ClockIcon style={{ width: 11, height: 11, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Last synced: {lastSynced}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Summary counts */}
            {[
              { label: 'Synced', count: FIELD_ROWS.filter(f => f.status === 'synced').length, color: GREEN },
              { label: 'Mismatches', count: unresolvedMismatches.length, color: AMBER },
              { label: 'Not mapped', count: FIELD_ROWS.filter(f => f.status === 'unmapped').length, color: MUTED },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: s.color, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSync}
              style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE,
                background: syncing ? MUTED : PRIMARY, border: 'none', borderRadius: 14,
                padding: '11px 20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <ArrowPathIcon style={{ width: 15, height: 15, color: WHITE, animation: syncing ? 'spin 1s linear infinite' : undefined }} />
              {syncing ? 'Syncing…' : 'Sync now'}
            </button>
            <button style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK,
              background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14,
              padding: '11px 20px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Cog6ToothIcon style={{ width: 15, height: 15, color: MUTED }} />
              Field mapping
            </button>
          </div>
        </div>

        {/* Mismatch resolution panel */}
        {unresolvedMismatches.length > 0 && (
          <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ExclamationTriangleIcon style={{ width: 18, height: 18, color: AMBER }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}>
                {unresolvedMismatches.length} Field {unresolvedMismatches.length === 1 ? 'Mismatch' : 'Mismatches'} — Needs Resolution
              </span>
            </div>
            {unresolvedMismatches.map(row => (
              <MismatchRow key={row.field} row={row} onResolve={(field) => handleResolve(field)} />
            ))}
          </div>
        )}

        {unresolvedMismatches.length === 0 && (
          <div style={{ background: '#D1FAE5', border: '1px solid #6EE7B7', borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <CheckCircleIcon style={{ width: 18, height: 18, color: GREEN }} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#064E3B' }}>All mismatches resolved — profile is in sync</span>
          </div>
        )}

        {/* Side-by-side field table */}
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.8fr 2fr 2fr 1.2fr',
            padding: '12px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}>
            {['Field', 'Lira Profile', 'HubSpot Record', 'Status'].map(h => (
              <span key={h} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>{h}</span>
            ))}
          </div>

          {/* Rows */}
          {FIELD_ROWS.map((row, i) => (
            <div
              key={row.field}
              style={{
                display: 'grid', gridTemplateColumns: '1.8fr 2fr 2fr 1.2fr',
                padding: '13px 20px',
                borderBottom: i < FIELD_ROWS.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                background: row.status === 'mismatch' && !resolvedFields.has(row.field) ? 'rgba(254,243,199,0.3)' : 'transparent',
              }}
            >
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK }}>{row.field}</span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: row.liraValue === '—' ? MUTED : DARK }}>
                {row.liraValue}
              </span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: row.crmValue === '—' ? MUTED : DARK }}>
                {row.crmValue}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StatusIcon status={resolvedFields.has(row.field) ? 'synced' : row.status} />
                <StatusLabel status={resolvedFields.has(row.field) ? 'synced' : row.status} />
              </div>
            </div>
          ))}
        </div>

        {/* Spin keyframe for sync button */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
