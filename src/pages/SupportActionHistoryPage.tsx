/**
 * Screen 37 — Action Engine: Action History Log
 * Pixel-faithful recreation of Figma node 1-9654
 */

import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BellIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/solid'
import { ActionTopBar } from './SupportActionApprovalQueuePage'

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
type ActionStatus = 'success' | 'failed' | 'pending'

interface IntegrationMeta {
  name: string
  abbr: string       // short label for avatar
  color: string      // avatar background
  textColor: string  // avatar text
}

interface HistoryRow {
  id: string
  timestamp: string
  timestampSub: string
  customer: string
  actionType: string
  integration: IntegrationMeta
  status: ActionStatus
  triggeredBy: string
  duration: string
  approvalRequired: boolean
  payload: string
  response: string
  traceTime: string
  traceNote: string
}

const INTEGRATIONS: Record<string, IntegrationMeta> = {
  Mailchimp:   { name: 'Mailchimp',   abbr: 'MC', color: '#FFE01B', textColor: '#111' },
  Stripe:      { name: 'Stripe',      abbr: 'ST', color: '#635BFF', textColor: '#fff' },
  Zendesk:     { name: 'Zendesk',     abbr: 'ZD', color: '#03363D', textColor: '#fff' },
  Quickbooks:  { name: 'Quickbooks',  abbr: 'QB', color: '#2CA01C', textColor: '#fff' },
  Twilio:      { name: 'Twilio',      abbr: 'TW', color: '#F22F46', textColor: '#fff' },
  Salesforce:  { name: 'Salesforce',  abbr: 'SF', color: '#00A1E0', textColor: '#fff' },
  AWS:         { name: 'AWS',         abbr: 'AW', color: '#FF9900', textColor: '#111' },
  Slack:       { name: 'Slack',       abbr: 'SL', color: '#4A154B', textColor: '#fff' },
  HubSpot:     { name: 'HubSpot',     abbr: 'HS', color: '#FF7A59', textColor: '#fff' },
}

const ROWS: HistoryRow[] = [
  {
    id: 'h1', timestamp: 'Oct 24', timestampSub: '14:22:10', customer: 'Ethan Vance',
    actionType: 'Email Dispatch', integration: INTEGRATIONS.Mailchimp, status: 'success',
    triggeredBy: 'System AI', duration: '0.8s', approvalRequired: false,
    payload: '{\n  "to": "ethan@company.com",\n  "template": "renewal_reminder",\n  "vars": { "name": "Ethan" }\n}',
    response: '{\n  "id": "msg_abc123",\n  "status": "queued"\n}',
    traceTime: '14:22:10.01', traceNote: 'Email dispatch triggered by renewal event',
  },
  {
    id: 'h2', timestamp: 'Oct 24', timestampSub: '14:21:45', customer: 'Liam Chen',
    actionType: 'Refund Process', integration: INTEGRATIONS.Stripe, status: 'failed',
    triggeredBy: 'System AI', duration: '2.1s', approvalRequired: true,
    payload: '{\n  "customer_id": "cus_9xP02",\n  "action": "update_subscription",\n  "params": {\n    "new_tier": "Enterprise",\n    "billing_cycle": "annual"\n  }\n}',
    response: '{\n  "error": "validation_failed",\n  "message": "Missing payment method for annual transition.",\n  "code": "pm_not_found",\n  "doc": "https://stripe.com/docs/err/422"\n}',
    traceTime: '14:15:22.01', traceNote: 'Action triggered by System AI',
  },
  {
    id: 'h3', timestamp: 'Oct 24', timestampSub: '14:20:01', customer: 'Sarah Connor',
    actionType: 'Ticket Close', integration: INTEGRATIONS.Zendesk, status: 'success',
    triggeredBy: 'Agent', duration: '0.4s', approvalRequired: false,
    payload: '{\n  "ticket_id": "ZD-8821",\n  "status": "closed",\n  "reason": "resolved"\n}',
    response: '{\n  "ticket_id": "ZD-8821",\n  "status": "closed"\n}',
    traceTime: '14:20:01.05', traceNote: 'Ticket closed by agent override',
  },
  {
    id: 'h4', timestamp: 'Oct 24', timestampSub: '14:19:30', customer: 'Marcus Wright',
    actionType: 'Invoice Gen', integration: INTEGRATIONS.Quickbooks, status: 'success',
    triggeredBy: 'System AI', duration: '1.2s', approvalRequired: false,
    payload: '{\n  "customer": "Marcus Wright",\n  "amount": 4200,\n  "currency": "USD"\n}',
    response: '{\n  "invoice_id": "INV-20041",\n  "status": "created"\n}',
    traceTime: '14:19:30.12', traceNote: 'Invoice generated automatically',
  },
  {
    id: 'h5', timestamp: 'Oct 24', timestampSub: '14:18:12', customer: 'Kyle Reese',
    actionType: 'SMS Alert', integration: INTEGRATIONS.Twilio, status: 'success',
    triggeredBy: 'System AI', duration: '0.6s', approvalRequired: false,
    payload: '{\n  "to": "+14155552671",\n  "body": "Your payment is due tomorrow."\n}',
    response: '{\n  "sid": "SM1234",\n  "status": "sent"\n}',
    traceTime: '14:18:12.03', traceNote: 'SMS sent via Twilio',
  },
  {
    id: 'h6', timestamp: 'Oct 24', timestampSub: '14:17:55', customer: 'John Connor',
    actionType: 'Update Tier', integration: INTEGRATIONS.Salesforce, status: 'success',
    triggeredBy: 'System AI', duration: '1.5s', approvalRequired: true,
    payload: '{\n  "contact_id": "SF-99213",\n  "tier": "Enterprise"\n}',
    response: '{\n  "contact_id": "SF-99213",\n  "updated": true\n}',
    traceTime: '14:17:55.08', traceNote: 'Tier updated after manual approval',
  },
  {
    id: 'h7', timestamp: 'Oct 24', timestampSub: '14:15:22', customer: 'Priya Nair',
    actionType: 'Subscription Mod', integration: INTEGRATIONS.Stripe, status: 'failed',
    triggeredBy: 'System AI', duration: '3.2s', approvalRequired: true,
    payload: '{\n  "sub_id": "sub_A99F2",\n  "plan": "business_annual"\n}',
    response: '{\n  "error": "card_declined",\n  "code": "insufficient_funds"\n}',
    traceTime: '14:15:22.19', traceNote: 'Subscription modification failed',
  },
  {
    id: 'h8', timestamp: 'Oct 24', timestampSub: '14:12:00', customer: 'Grace Hopper',
    actionType: 'Slack Notify', integration: INTEGRATIONS.Slack, status: 'success',
    triggeredBy: 'System AI', duration: '0.3s', approvalRequired: false,
    payload: '{\n  "channel": "#support-escalations",\n  "text": "New escalation from Grace Hopper"\n}',
    response: '{\n  "ok": true,\n  "ts": "1234567890.123456"\n}',
    traceTime: '14:12:00.02', traceNote: 'Slack notification sent',
  },
  {
    id: 'h9', timestamp: 'Oct 24', timestampSub: '14:10:44', customer: 'Alan Turing',
    actionType: 'Data Sync', integration: INTEGRATIONS.AWS, status: 'success',
    triggeredBy: 'System AI', duration: '4.1s', approvalRequired: false,
    payload: '{\n  "source": "CRM",\n  "destination": "S3",\n  "records": 1204\n}',
    response: '{\n  "synced": 1204,\n  "errors": 0\n}',
    traceTime: '14:10:44.30', traceNote: 'Data sync completed successfully',
  },
]

// ── Status components ─────────────────────────────────────────────────────────
const STATUS_META: Record<ActionStatus, { icon: React.ComponentType<{ style?: React.CSSProperties }>; color: string; label: string }> = {
  success: { icon: CheckCircleIcon, color: GREEN,  label: 'Success' },
  failed:  { icon: XCircleIcon,     color: RED,    label: 'Failed' },
  pending: { icon: ClockIcon,       color: AMBER,  label: 'Pending' },
}

function StatusDot({ status }: { status: ActionStatus }) {
  const { color } = STATUS_META[status]
  return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
}

function IntegrationAvatar({ meta }: { meta: IntegrationMeta }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 26, height: 26, borderRadius: 6, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 9, color: meta.textColor }}>{meta.abbr}</span>
      </div>
      <span style={{ fontFamily: FONT, fontSize: 13, color: DARK }}>{meta.name}</span>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, valueSub, subColor }: { label: string; value: string; valueSub?: string; subColor?: string }) {
  return (
    <div style={{ background: CARD, borderRadius: 12, boxShadow: SHADOW, padding: '18px 20px', flex: 1 }}>
      <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, color: DARK, letterSpacing: '-0.02em' }}>{value}</span>
        {valueSub && (
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: subColor ?? MUTED }}>{valueSub}</span>
        )}
      </div>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({ row, onClose }: { row: HistoryRow; onClose: () => void }) {
  const isFailed = row.status === 'failed'
  return (
    <div style={{ width: 380, flexShrink: 0, background: CARD, borderRadius: 16, boxShadow: SHADOW, padding: '20px', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Action Details</span>
        <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XMarkIcon style={{ width: 14, height: 14, color: MUTED }} />
        </button>
      </div>

      {/* Status banner */}
      <div style={{ background: isFailed ? '#FEF2F2' : '#F0FDF4', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {isFailed ? (
          <ExclamationCircleIcon style={{ width: 28, height: 28, color: RED, flexShrink: 0 }} />
        ) : (
          <CheckCircleIcon style={{ width: 28, height: 28, color: GREEN, flexShrink: 0 }} />
        )}
        <div>
          {isFailed && (
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: RED, marginBottom: 2 }}>
              Unprocessable Entity
            </div>
          )}
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: isFailed ? RED : GREEN }}>
            {isFailed ? 'Error 422' : 'Success'}
          </div>
        </div>
      </div>

      {/* Request Payload */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 11, color: PRIMARY }}>{'<>'}</span>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>Request Payload</span>
        </div>
        <div style={{ background: '#1E2030', borderRadius: 8, padding: '12px 14px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: '#A5B4FC', lineHeight: 1.7, whiteSpace: 'pre' }}>
          {row.payload}
        </div>
      </div>

      {/* API Response */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          {isFailed
            ? <ExclamationCircleIcon style={{ width: 13, height: 13, color: RED }} />
            : <CheckCircleIcon style={{ width: 13, height: 13, color: GREEN }} />
          }
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>API Response</span>
        </div>
        <div style={{ background: '#1E2030', borderRadius: 8, padding: '12px 14px', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: isFailed ? '#FCA5A5' : '#86EFAC', lineHeight: 1.7, whiteSpace: 'pre' }}>
          {row.response}
        </div>
      </div>

      {/* Internal Trace */}
      <div>
        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>Internal Trace</span>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIMARY, marginTop: 4, flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK }}>{row.traceTime}</div>
            <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginTop: 2 }}>{row.traceNote}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Filter select ─────────────────────────────────────────────────────────────
function FilterSelect({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', height: 38, cursor: 'pointer' }}>
      <span style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginRight: 4 }}>{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, color: DARK, outline: 'none', appearance: 'none', paddingRight: 16 }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportActionHistoryPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<HistoryRow | null>(ROWS[1]) // Liam Chen selected by default
  const [integration, setIntegration] = useState('All')
  const [actionType, setActionType] = useState('All')
  const [status, setStatus] = useState('All')

  const integrationOptions = ['All', ...Array.from(new Set(ROWS.map(r => r.integration.name)))]
  const actionTypeOptions  = ['All', ...Array.from(new Set(ROWS.map(r => r.actionType)))]
  const statusOptions      = ['All', 'success', 'failed', 'pending']

  const filtered = useMemo(() => ROWS.filter(r => {
    if (integration !== 'All' && r.integration.name !== integration) return false
    if (actionType  !== 'All' && r.actionType              !== actionType) return false
    if (status      !== 'All' && r.status                  !== status) return false
    return true
  }), [integration, actionType, status])

  const successCount = ROWS.filter(r => r.status === 'success').length
  const failedCount  = ROWS.filter(r => r.status === 'failed').length

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <ActionTopBar
        active="/support/actions/history"
        searchPlaceholder="Search history..."
        onNavigate={navigate}
      />

      {/* Content */}
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16 }}>
          <StatCard label="Total Actions"  value="142" valueSub="+12%"   subColor="#6B7280" />
          <StatCard label="Success Rate"   value="96%" valueSub="Optimal" subColor={GREEN} />
          <StatCard label="Avg. Duration"  value="1.2s" valueSub="Global avg" subColor={MUTED} />
          <StatCard label="Failures"       value="6"   valueSub="-4%"    subColor={GREEN} />
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <FilterSelect label="Integration" options={integrationOptions} value={integration} onChange={setIntegration} />
          <FilterSelect label="Action Type"  options={actionTypeOptions}  value={actionType}  onChange={setActionType} />
          <FilterSelect label="Status"       options={statusOptions}       value={status}       onChange={setStatus} />

          {/* Approval Required toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 14px', height: 38 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIMARY }} />
            <span style={{ fontFamily: FONT, fontSize: 13, color: DARK }}>Approval Required</span>
          </div>

          {/* Export */}
          <button
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: PRIMARY }}
          >
            Export CSV
          </button>
        </div>

        {/* Table + Detail Panel */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1 }}>

          {/* Table */}
          <div style={{ flex: 1, background: CARD, borderRadius: 16, boxShadow: SHADOW, overflow: 'hidden', minWidth: 0 }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 160px 180px 60px', padding: '12px 20px', borderBottom: `1px solid ${BORDER}` }}>
              {['TIMESTAMP', 'CUSTOMER', 'ACTION TYPE', 'INTEGRATION', 'ST.'].map(col => (
                <div key={col} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
                  {col}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.map(row => {
              const isSelected = selected?.id === row.id
              return (
                <div
                  key={row.id}
                  onClick={() => setSelected(isSelected ? null : row)}
                  style={{
                    display: 'grid', gridTemplateColumns: '120px 1fr 160px 180px 60px',
                    padding: '14px 20px', cursor: 'pointer',
                    borderBottom: `1px solid ${BORDER}`,
                    background: isSelected ? '#EEF2FF' : CARD,
                    transition: 'background 0.1s',
                  }}
                >
                  <div>
                    <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED }}>{row.timestamp}</div>
                    <div style={{ fontFamily: FONT, fontSize: 13, color: DARK, fontWeight: 500 }}>{row.timestampSub}</div>
                  </div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, alignSelf: 'center' }}>
                    {row.customer}
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 13, color: DARK, alignSelf: 'center' }}>
                    {row.actionType}
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    <IntegrationAvatar meta={row.integration} />
                  </div>
                  <div style={{ alignSelf: 'center' }}>
                    <StatusDot status={row.status} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel row={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      </div>
    </div>
  )
}
