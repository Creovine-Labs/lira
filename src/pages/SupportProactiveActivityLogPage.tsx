/**
 * Screen 28 — Proactive Support Engine: Outreach Activity Log
 * Full history of all proactive outreaches with filtering and detail panel.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FunnelIcon,
  XMarkIcon,
  ChevronRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChevronLeftIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG           = '#E8EAF0'
const NEU_SHADOW   = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET    = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY      = '#6366F1'
const DARK         = '#2E3040'
const MUTED        = '#585A68'
const WHITE        = '#FFFFFF'
const FONT         = 'Plus Jakarta Sans, sans-serif'
const AI_BG        = '#EEF2FF'
const AI_BORDER    = 'rgba(224,231,255,0.5)'
const GREEN        = '#059669'
const GREEN_BG     = 'rgba(209,250,229,0.8)'
const AMBER        = '#D97706'
const AMBER_BG     = 'rgba(254,243,199,0.8)'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
type DeliveryStatus = 'sent' | 'failed' | 'pending'
type OutcomeType    = 'Ticket prevented' | 'Conversation opened' | 'No engagement'

interface LogEntry {
  id: string
  timestamp: string
  customer: string
  customerInitials: string
  customerColor: string
  event: string
  channel: 'email' | 'voice'
  template: string
  status: DeliveryStatus
  replied: boolean
  outcome: OutcomeType
  messageSent: string
  customerReply?: string
  followUp?: string
}

const ACTIVITY_LOG: LogEntry[] = [
  {
    id: 'a1', timestamp: 'Apr 9, 2026 09:00 AM',
    customer: 'Jana Fischer', customerInitials: 'JF', customerColor: '#6366F1',
    event: 'payment.failed', channel: 'email',
    template: 'Payment Failed – Retry Prompt', status: 'sent', replied: true, outcome: 'Ticket prevented',
    messageSent: 'Hi Jana Fischer,\n\nWe noticed your recent payment of €2,000 EUR didn\'t go through. Here\'s a retry link to resolve this quickly.\n\n– Lira',
    customerReply: 'Thanks! I\'ve updated my card and retried successfully.',
    followUp: 'Lira confirmed payment success and closed the case.',
  },
  {
    id: 'a2', timestamp: 'Apr 9, 2026 08:44 AM',
    customer: 'Sven Larsson', customerInitials: 'SL', customerColor: '#059669',
    event: 'payment.failed', channel: 'email',
    template: 'Payment Failed – Retry Prompt', status: 'sent', replied: false, outcome: 'No engagement',
    messageSent: 'Hi Sven Larsson,\n\nWe noticed your recent payment of €850 EUR didn\'t go through. Here\'s a retry link.\n\n– Lira',
  },
  {
    id: 'a3', timestamp: 'Apr 8, 2026 03:21 PM',
    customer: 'Luca Ferreira', customerInitials: 'LF', customerColor: '#D97706',
    event: 'account.inactive', channel: 'email',
    template: 'Onboarding Stalled – Nudge', status: 'sent', replied: true, outcome: 'Conversation opened',
    messageSent: 'Hi Luca Ferreira,\n\nI noticed you haven\'t completed onboarding yet. Can I help you get set up?\n\n– Lira',
    customerReply: 'Yes please, I got a bit confused with the KYC step.',
    followUp: 'Lira escalated to a support agent for guided KYC assistance.',
  },
  {
    id: 'a4', timestamp: 'Apr 8, 2026 11:05 AM',
    customer: 'Amara Diallo', customerInitials: 'AD', customerColor: '#DC2626',
    event: 'kyc.blocked', channel: 'email',
    template: 'KYC Blocked – Document Request', status: 'sent', replied: false, outcome: 'Ticket prevented',
    messageSent: 'Hi Amara Diallo,\n\nYour identity verification is waiting on a document upload. Please upload your passport or national ID to continue.\n\n– Lira',
  },
  {
    id: 'a5', timestamp: 'Apr 8, 2026 09:30 AM',
    customer: 'Yuki Tanaka', customerInitials: 'YT', customerColor: '#6366F1',
    event: 'fraud.flagged', channel: 'voice',
    template: 'Suspicious Transaction – Auth Check', status: 'sent', replied: true, outcome: 'Ticket prevented',
    messageSent: 'Call initiated. Lira confirmed transaction with Yuki Tanaka was authorized.',
    customerReply: 'Yes, that was me. I was travelling.',
    followUp: 'Flag removed; transaction approved.',
  },
  {
    id: 'a6', timestamp: 'Apr 7, 2026 02:15 PM',
    customer: 'Omar Hassan', customerInitials: 'OH', customerColor: '#059669',
    event: 'payment.failed', channel: 'email',
    template: 'Payment Failed – Retry Prompt', status: 'failed', replied: false, outcome: 'No engagement',
    messageSent: 'Email bounced — invalid address on file.',
  },
  {
    id: 'a7', timestamp: 'Apr 7, 2026 10:40 AM',
    customer: 'Nia Osei', customerInitials: 'NO', customerColor: '#D97706',
    event: 'subscription.expiring', channel: 'email',
    template: 'Subscription Expiring – Renewal Reminder', status: 'sent', replied: true, outcome: 'Ticket prevented',
    messageSent: 'Hi Nia Osei,\n\nYour subscription expires in 3 days. Click here to renew with one tap.\n\n– Lira',
    customerReply: 'Just renewed, thank you for the reminder!',
    followUp: 'Renewal confirmed. Subscription extended 12 months.',
  },
  {
    id: 'a8', timestamp: 'Apr 7, 2026 08:05 AM',
    customer: 'Chen Wei', customerInitials: 'CW', customerColor: '#6366F1',
    event: 'api.error.spike', channel: 'email',
    template: 'API Error Threshold – Eng Alert', status: 'pending', replied: false, outcome: 'No engagement',
    messageSent: 'Queued — will send during business hours.',
  },
]

// ── Delivery status badge ──────────────────────────────────────────────────────
function StatusBadge({ status }: { status: DeliveryStatus }) {
  const cfg = {
    sent:    { bg: GREEN_BG, color: GREEN,   icon: <CheckCircleIcon style={{ width: 12, height: 12 }} />, label: 'Sent' },
    failed:  { bg: RED_LIGHT, color: RED,    icon: <XCircleIcon style={{ width: 12, height: 12 }} />,     label: 'Failed' },
    pending: { bg: AMBER_BG, color: AMBER,   icon: <span style={{ fontSize: 10 }}>🕐</span>,              label: 'Pending' },
  }[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: FONT, fontWeight: 700, fontSize: 11, color: cfg.color,
      background: cfg.bg, borderRadius: 8, padding: '3px 9px',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

// ── Outcome badge ──────────────────────────────────────────────────────────────
function OutcomeBadge({ outcome }: { outcome: OutcomeType }) {
  const cfg: Record<OutcomeType, { color: string; bg: string }> = {
    'Ticket prevented':    { color: GREEN, bg: GREEN_BG },
    'Conversation opened': { color: PRIMARY, bg: AI_BG },
    'No engagement':       { color: MUTED, bg: PROFILE_BG },
  }
  const c = cfg[outcome]
  return (
    <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: c.color, background: c.bg, borderRadius: 8, padding: '3px 9px' }}>
      {outcome}
    </span>
  )
}

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div style={{ width: 30, height: 30, borderRadius: 9999, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 10.5, color: WHITE }}>{initials}</span>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({ entry, onClose }: { entry: LogEntry; onClose: () => void }) {
  return (
    <div style={{ width: 360, flexShrink: 0, background: BG, borderLeft: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Panel header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials={entry.customerInitials} color={entry.customerColor} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{entry.customer}</div>
            <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{entry.timestamp}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Meta */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <code style={{ fontFamily: 'monospace', fontSize: 10.5, color: PRIMARY, background: AI_BG, borderRadius: 6, padding: '3px 8px' }}>{entry.event}</code>
          {entry.channel === 'email'
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 500, fontSize: 11, color: MUTED }}><EnvelopeIcon style={{ width: 12, height: 12 }} /> Email</span>
            : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 500, fontSize: 11, color: GREEN }}><PhoneIcon style={{ width: 12, height: 12 }} /> Voice</span>
          }
          <StatusBadge status={entry.status} />
          <OutcomeBadge outcome={entry.outcome} />
        </div>

        <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
          Template: <span style={{ fontWeight: 600, color: DARK }}>{entry.template}</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 20px' }} />

      {/* Message sent */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>Message sent</div>
        <div style={{ background: WHITE, borderRadius: 14, padding: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK, margin: 0, whiteSpace: 'pre-line', lineHeight: '1.7em' }}>
            {entry.messageSent}
          </p>
        </div>
      </div>

      {/* Customer reply */}
      {entry.customerReply && (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>Customer reply</div>
          <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 14, padding: 16 }}>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK, margin: 0, lineHeight: '1.7em' }}>
              {entry.customerReply}
            </p>
          </div>
        </div>
      )}

      {/* Lira follow-up */}
      {entry.followUp && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK, marginBottom: 10 }}>Lira's follow-up</div>
          <div style={{ background: GREEN_BG, border: '1px solid rgba(166,255,196,0.6)', borderRadius: 14, padding: 16 }}>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: GREEN, margin: 0, lineHeight: '1.7em' }}>
              {entry.followUp}
            </p>
          </div>
        </div>
      )}

      {/* Link to conversation */}
      <div style={{ padding: '4px 20px 24px' }}>
        <button style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 12, color: PRIMARY,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <ArrowTopRightOnSquareIcon style={{ width: 13, height: 13 }} /> Open full conversation
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportProactiveActivityLogPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState<LogEntry | null>(null)

  // Filter state
  const [filterTrigger, setFilterTrigger] = useState('all')
  const [filterOutcome, setFilterOutcome] = useState('all')
  const [filterChannel, setFilterChannel] = useState('all')
  const [filterStatus, setFilterStatus]   = useState('all')

  const allEvents = Array.from(new Set(ACTIVITY_LOG.map(e => e.event)))

  const filtered = ACTIVITY_LOG.filter(e =>
    (filterTrigger === 'all' || e.event === filterTrigger) &&
    (filterOutcome === 'all' || e.outcome === filterOutcome) &&
    (filterChannel === 'all' || e.channel === filterChannel) &&
    (filterStatus  === 'all' || e.status  === filterStatus)
  )

  const selectStyle: React.CSSProperties = {
    fontFamily: FONT, fontSize: 12, color: DARK,
    background: BG, boxShadow: NEU_INSET, border: 'none', borderRadius: 10,
    padding: '9px 12px', outline: 'none', cursor: 'pointer',
  }

  const TH = ({ children }: { children: React.ReactNode }) => (
    <th style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, textAlign: 'left', padding: '10px 14px', whiteSpace: 'nowrap', background: BG, position: 'sticky', top: 0, zIndex: 2 }}>
      {children}
    </th>
  )

  const TD = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <td style={{ padding: '12px 14px', ...style }}>
      {children}
    </td>
  )

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '16px 14px 14px' : '24px 32px 18px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/support/proactive')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 500, fontSize: 13, padding: 0 }}
            >
              <ChevronLeftIcon style={{ width: 14, height: 14 }} /> Proactive Triggers
            </button>
            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)' }} />
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: DARK, margin: 0 }}>Outreach Activity Log</h1>
          </div>
          {/* Stats strip */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { label: 'Total outreaches', value: ACTIVITY_LOG.length.toString() },
              { label: 'Tickets prevented', value: ACTIVITY_LOG.filter(e => e.outcome === 'Ticket prevented').length.toString(), green: true },
              { label: 'Reply rate', value: `${Math.round(ACTIVITY_LOG.filter(e => e.replied).length / ACTIVITY_LOG.length * 100)}%` },
            ].map(s => (
              <div key={s.label} style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 12, padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: s.green ? GREEN : DARK, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FunnelIcon style={{ width: 14, height: 14, color: MUTED }} />
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED }}>Filter:</span>
          </div>
          <select value={filterTrigger} onChange={e => setFilterTrigger(e.target.value)} style={selectStyle}>
            <option value="all">All triggers</option>
            {allEvents.map(ev => <option key={ev} value={ev}>{ev}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="all">All statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} style={selectStyle}>
            <option value="all">All channels</option>
            <option value="email">Email</option>
            <option value="voice">Voice</option>
          </select>
          <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} style={selectStyle}>
            <option value="all">All outcomes</option>
            <option value="Ticket prevented">Ticket prevented</option>
            <option value="Conversation opened">Conversation opened</option>
            <option value="No engagement">No engagement</option>
          </select>
          {(filterTrigger !== 'all' || filterStatus !== 'all' || filterChannel !== 'all' || filterOutcome !== 'all') && (
            <button
              onClick={() => { setFilterTrigger('all'); setFilterStatus('all'); setFilterChannel('all'); setFilterOutcome('all') }}
              style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Body: table + optional detail panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <TH>Timestamp</TH>
                <TH>Customer</TH>
                <TH>Event type</TH>
                <TH>Channel</TH>
                <TH>Template</TH>
                <TH>Status</TH>
                <TH>Reply</TH>
                <TH>Outcome</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => (
                <tr
                  key={entry.id}
                  onClick={() => setSelected(selected?.id === entry.id ? null : entry)}
                  style={{
                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                    background: selected?.id === entry.id ? AI_BG : i % 2 === 0 ? 'transparent' : PROFILE_BG,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.background = AI_BG }}
                  onMouseLeave={e => { if (selected?.id !== entry.id) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : PROFILE_BG }}
                >
                  <TD>
                    <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>{entry.timestamp}</span>
                  </TD>
                  <TD>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={entry.customerInitials} color={entry.customerColor} />
                      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK, whiteSpace: 'nowrap' }}>{entry.customer}</span>
                    </div>
                  </TD>
                  <TD>
                    <code style={{ fontFamily: 'monospace', fontSize: 10.5, color: PRIMARY, background: AI_BG, borderRadius: 6, padding: '3px 8px', whiteSpace: 'nowrap' }}>
                      {entry.event}
                    </code>
                  </TD>
                  <TD>
                    {entry.channel === 'email'
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: MUTED }}><EnvelopeIcon style={{ width: 13, height: 13 }} /><span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: MUTED }}>Email</span></div>
                      : <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><PhoneIcon style={{ width: 13, height: 13, color: GREEN }} /><span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: GREEN }}>Voice</span></div>
                    }
                  </TD>
                  <TD>
                    <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11.5, color: DARK, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 180 }}>
                      {entry.template}
                    </span>
                  </TD>
                  <TD><StatusBadge status={entry.status} /></TD>
                  <TD>
                    {entry.replied
                      ? <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          Replied <ChevronRightIcon style={{ width: 10, height: 10 }} />
                        </span>
                      : <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>No reply yet</span>
                    }
                  </TD>
                  <TD><OutcomeBadge outcome={entry.outcome} /></TD>
                  <TD>
                    <ChevronRightIcon style={{ width: 14, height: 14, color: MUTED }} />
                  </TD>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED }}>
                    No outreaches match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && !isMobile && (
          <DetailPanel entry={selected} onClose={() => setSelected(null)} />
        )}
      </div>

      {/* Mobile detail drawer */}
      {selected && isMobile && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: BG, borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <DetailPanel entry={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  )
}
