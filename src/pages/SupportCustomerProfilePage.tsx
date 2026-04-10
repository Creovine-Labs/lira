/**
 * Screen 19 — Customer Profile: Overview
 * Full 360° view of a single customer — stats, AI summary, open tickets, proactive history.
 */

import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  StarIcon as StarOutline,
  PlusCircleIcon,
  FlagIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import {
  SparklesIcon,
  StarIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid'
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
const AI_BG        = '#EEF2FF'
const AI_BORDER    = 'rgba(224,231,255,0.5)'
const GREEN        = '#059669'
const GREEN_DARK   = '#047857'
const AMBER        = '#D97706'
const RED          = '#DC2626'
const STAR_GOLD    = '#EAB308'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Mock profile data keyed by id ─────────────────────────────────────────────
const PROFILES: Record<string, {
  name: string; email: string; phone: string; tier: string; churnScore: number;
  crmType: string; crmId: string; sentimentTrend: string;
  stats: { label: string; value: string; sub?: string }[];
  summary: string;
  openTickets: { id: string; subject: string; channel: string; status: string; time: string }[];
  proactiveHistory: { event: string; sentAt: string; outcome: string }[];
  avatarColor: string;
}> = {
  default: {
    name: 'Jana Fischer',
    email: 'jana.fischer@acme.de',
    phone: '+49 30 1234 5678',
    tier: 'VIP',
    churnScore: 12,
    crmType: 'HubSpot',
    crmId: 'hs-92841',
    sentimentTrend: 'Improving ↑',
    avatarColor: '#818CF8',
    stats: [
      { label: 'Total Interactions', value: '14' },
      { label: 'Autonomous Resolutions', value: '11', sub: '79%' },
      { label: 'Escalations', value: '3' },
      { label: 'Average CSAT', value: '4.1', sub: '/ 5.0' },
    ],
    summary: 'Jana has been a customer since January 2025. She has primarily contacted support about billing address updates and payment method changes. Her last 2 interactions were smoothly resolved by Lira within 30 seconds. Her churn risk score is low and sentiment trend is improving over the last 30 days.',
    openTickets: [
      { id: 'LRA-8845', subject: 'Payment method update — billing region error', channel: 'Voice', status: 'Resolved', time: '2 min ago' },
      { id: 'LRA-8842', subject: 'Refund request for duplicate charge', channel: 'Email', status: 'Resolved', time: '3 days ago' },
    ],
    proactiveHistory: [
      { event: 'payment.failed', sentAt: 'Mar 28, 2026', outcome: 'Ticket prevented' },
      { event: 'subscription.expiring', sentAt: 'Feb 14, 2026', outcome: 'Replied — renewed' },
      { event: 'kyc.reminder', sentAt: 'Jan 20, 2026', outcome: 'No reply' },
    ],
  },
  c2: {
    name: 'Daniel Roy',
    email: 'd.roy@fintechco.com',
    phone: '+1 415 555 2901',
    tier: 'Standard',
    churnScore: 68,
    crmType: 'HubSpot',
    crmId: 'hs-11098',
    sentimentTrend: 'Declining ↓',
    avatarColor: '#FCA5A5',
    stats: [
      { label: 'Total Interactions', value: '7' },
      { label: 'Autonomous Resolutions', value: '4', sub: '57%' },
      { label: 'Escalations', value: '3' },
      { label: 'Average CSAT', value: '2.8', sub: '/ 5.0' },
    ],
    summary: 'Daniel has been a customer since October 2024. He has primarily contacted support about pending wire transfers and compliance holds. His last 3 interactions required escalation due to complex compliance scenarios. His churn risk score is elevated and declining sentiment warrants proactive outreach.',
    openTickets: [
      { id: 'LRA-4832', subject: '$2,400 transfer pending — compliance hold', channel: 'Email', status: 'In Progress', time: '14 min ago' },
    ],
    proactiveHistory: [
      { event: 'transfer.delayed', sentAt: 'Apr 6, 2026', outcome: 'Replied — escalated' },
    ],
  },
}

function getProfile(id?: string) {
  if (id && PROFILES[id]) return PROFILES[id]
  return PROFILES.default
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: string }) {
  return (
    <div style={{ flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, minWidth: 120 }}>
      <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 28, color: highlight ?? DARK, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED }}>{sub}</span>}
      </div>
    </div>
  )
}

// ── Channel icon ──────────────────────────────────────────────────────────────
function ChannelIcon({ channel }: { channel: string }) {
  const props = { style: { width: 13, height: 13, color: MUTED } }
  if (channel === 'Voice') return <PhoneIcon {...props} />
  if (channel === 'Chat') return <ChatBubbleLeftEllipsisIcon {...props} />
  return <EnvelopeIcon {...props} />
}

const STATUS_COLOR: Record<string, string> = {
  'Resolved':    GREEN,
  'In Progress': AMBER,
  'Escalated':   RED,
  'Pending':     AMBER,
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportCustomerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const profile = getProfile(id)

  const churnColor = profile.churnScore < 30 ? GREEN : profile.churnScore < 70 ? AMBER : RED
  const churnLabel = profile.churnScore < 30 ? 'Low' : profile.churnScore < 70 ? 'Medium' : 'High'
  const churnBg    = profile.churnScore < 30 ? '#D1FAE5' : profile.churnScore < 70 ? '#FEF3C7' : '#FEE2E2'

  const TIER_CONFIG: Record<string, { color: string; bg: string }> = {
    Standard:   { color: '#4338CA', bg: '#E0E7FF' },
    VIP:        { color: '#92400E', bg: '#FEF3C7' },
    Enterprise: { color: '#065F46', bg: '#D1FAE5' },
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
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
      }}>
        {/* Breadcrumb */}
        <button
          onClick={() => navigate('/support/customers')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}
        >
          <ChevronLeftIcon style={{ width: 15, height: 15, color: MUTED }} />
          <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 13, color: MUTED }}>All Customers</span>
        </button>

        {/* Profile header card */}
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: isMobile ? 20 : 28, marginBottom: 0 }}>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 24, alignItems: isMobile ? 'flex-start' : 'center' }}>
            {/* Avatar */}
            <div style={{
              width: 64, height: 64, borderRadius: 20, background: profile.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: NEU_SHADOW, flexShrink: 0,
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: WHITE }}>
                {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ fontFamily: FONT, fontWeight: 800, fontSize: isMobile ? 20 : 26, color: DARK, margin: 0 }}>{profile.name}</h2>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: TIER_CONFIG[profile.tier]?.color ?? PRIMARY, background: TIER_CONFIG[profile.tier]?.bg ?? AI_BG, borderRadius: 9999, padding: '3px 10px' }}>
                  {profile.tier}
                </span>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: churnColor, background: churnBg, borderRadius: 9999, padding: '3px 10px' }}>
                  {churnLabel} Churn Risk — {profile.churnScore}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <EnvelopeIcon style={{ width: 13, height: 13 }} />{profile.email}
                </span>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <PhoneIcon style={{ width: 13, height: 13 }} />{profile.phone}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircleIcon style={{ width: 14, height: 14, color: GREEN }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 12, color: GREEN }}>
                  Synced with {profile.crmType} ✓ — Contact ID: {profile.crmId}
                </span>
                <button
                  onClick={() => navigate(`/support/customers/${id ?? 'default'}/crm`)}
                  style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  Open in {profile.crmType} <ArrowTopRightOnSquareIcon style={{ width: 11, height: 11 }} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ArrowUpIcon style={{ width: 12, height: 12, color: GREEN }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 12, color: GREEN }}>Sentiment: {profile.sentimentTrend} over last 30 days</span>
              </div>
            </div>

            {/* Quick actions */}
            {!isMobile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                {[
                  { label: 'View full history', icon: ClockIcon, onClick: () => navigate(`/support/customers/${id ?? 'default'}/timeline`) },
                  { label: 'Send proactive message', icon: EnvelopeIcon, onClick: () => {} },
                  { label: 'Create ticket', icon: PlusCircleIcon, onClick: () => {} },
                  { label: 'Flag as VIP', icon: FlagIcon, onClick: () => {} },
                ].map(a => (
                  <button key={a.label} onClick={a.onClick} style={{
                    fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK,
                    background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 12,
                    padding: '9px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}>
                    <a.icon style={{ width: 14, height: 14, color: MUTED }} />
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tab hint strip */}
        <div style={{ display: 'flex', gap: 0, marginTop: 0, padding: '0 4px' }}>
          {['Overview', 'Timeline', 'CRM Sync'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Timeline') navigate(`/support/customers/${id ?? 'default'}/timeline`)
                if (tab === 'CRM Sync')  navigate(`/support/customers/${id ?? 'default'}/crm`)
              }}
              style={{
                fontFamily: FONT, fontWeight: tab === 'Overview' ? 700 : 500, fontSize: 13,
                color: tab === 'Overview' ? PRIMARY : MUTED,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '14px 20px',
                borderBottom: tab === 'Overview' ? `2px solid ${PRIMARY}` : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Page body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {profile.stats.map(s => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              sub={s.sub}
              highlight={s.label === 'Escalations' && parseInt(s.value) > 0 ? RED : s.label === 'Average CSAT' ? STAR_GOLD : undefined}
            />
          ))}
        </div>

        {/* AI summary */}
        <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 9999, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>AI-Generated Customer Summary</span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.7em', color: DARK, margin: 0 }}>
            {profile.summary}
          </p>
        </div>

        {/* Open tickets */}
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}>Open & Recent Tickets</span>
          {profile.openTickets.map(ticket => (
            <div key={ticket.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: PROFILE_BG, borderRadius: 14, padding: '14px 16px',
            }}>
              <ChannelIcon channel={ticket.channel} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>{ticket.subject}</div>
                <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>#{ticket.id} · {ticket.time}</div>
              </div>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: STATUS_COLOR[ticket.status] ?? MUTED, background: `${STATUS_COLOR[ticket.status] ?? '#888'}18`, borderRadius: 9999, padding: '3px 10px' }}>
                {ticket.status}
              </span>
              <button style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer' }}>View →</button>
            </div>
          ))}
        </div>

        {/* Proactive outreach history */}
        <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}>Proactive Outreach History</span>
          {profile.proactiveHistory.map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: PROFILE_BG, borderRadius: 14, padding: '14px 16px',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SparklesIcon style={{ width: 14, height: 14, color: PRIMARY }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, fontFamily: 'monospace' }}>
                  <code style={{ fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                    {p.event}
                  </code>
                </div>
                <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, marginTop: 3 }}>{p.sentAt}</div>
              </div>
              <span style={{
                fontFamily: FONT, fontWeight: 600, fontSize: 11, borderRadius: 9999, padding: '3px 10px',
                color: p.outcome.includes('prevented') || p.outcome.includes('renewed') ? GREEN : p.outcome.includes('escalated') ? AMBER : MUTED,
                background: p.outcome.includes('prevented') || p.outcome.includes('renewed') ? '#D1FAE5' : p.outcome.includes('escalated') ? '#FEF3C7' : 'rgba(88,90,104,0.1)',
              }}>
                {p.outcome}
              </span>
            </div>
          ))}
        </div>

        {/* View full timeline CTA */}
        <button
          onClick={() => navigate(`/support/customers/${id ?? 'default'}/timeline`)}
          style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 14, color: PRIMARY,
            background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 16,
            padding: '16px 24px', cursor: 'pointer', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          View full interaction timeline →
        </button>
      </div>
    </div>
  )
}
