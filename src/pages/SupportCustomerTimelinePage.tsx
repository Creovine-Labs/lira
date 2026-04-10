/**
 * Screen 20 — Customer Profile: Interaction Timeline
 * Chronological view of every interaction Lira has had with a customer.
 */

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG         = '#E8EAF0'
const NEU_SHADOW = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET  = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const PRIMARY    = '#6366F1'
const DARK       = '#2E3040'
const MUTED      = '#585A68'
const WHITE      = '#FFFFFF'
const FONT       = 'Plus Jakarta Sans, sans-serif'
const AI_BG      = '#EEF2FF'
const AI_BORDER  = 'rgba(224,231,255,0.5)'
const GREEN      = '#059669'
const AMBER      = '#D97706'
const RED        = '#DC2626'
const STAR_GOLD  = '#EAB308'
const PROFILE_BG = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
type Channel   = 'email' | 'chat' | 'voice'
type Direction = 'Inbound' | 'Outbound' | 'Proactive'
type Resolution = 'Autonomous' | 'Escalated' | 'Pending'

interface ActionChip {
  label: string
}

interface TranscriptEntry {
  speaker: string
  text: string
}

interface Interaction {
  id: string
  date: string
  time: string
  channel: Channel
  direction: Direction
  summary: string
  resolution: Resolution
  csat: number | null
  actions: ActionChip[]
  transcript: TranscriptEntry[]
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const TIMELINE: Interaction[] = [
  {
    id: 'LRA-8845',
    date: 'Apr 9, 2026',
    time: '9:04 AM',
    channel: 'voice',
    direction: 'Inbound',
    summary: "Customer called about billing region mismatch preventing payment method update. Lira identified incorrect postal code format for German customer, corrected region settings in payment gateway, and resolved the issue in 3m 42s.",
    resolution: 'Autonomous',
    csat: 5,
    actions: [{ label: 'Stripe region updated' }, { label: 'Call summary emailed' }],
    transcript: [
      { speaker: 'Customer', text: "Hi, I've been having trouble with my account. My billing keeps rejecting my card even though the details look correct." },
      { speaker: 'Lira', text: "Hello! I'm Lira. I can see the issue — your billing address is registered with a German postal code format, but our payment gateway was expecting a US format. Let me correct that now." },
      { speaker: 'Customer', text: "Oh really? I didn't realise that could be the issue." },
      { speaker: 'Lira', text: "I've updated your region settings. Could you try adding the card again?" },
      { speaker: 'Customer', text: "It worked! Thank you so much." },
    ],
  },
  {
    id: 'LRA-8842',
    date: 'Apr 6, 2026',
    time: '3:14 PM',
    channel: 'email',
    direction: 'Inbound',
    summary: "Customer emailed about a duplicate charge of €94.00 on their account. Lira queried the billing record in HubSpot, confirmed the duplicate, and initiated a refund via Stripe. Resolved in 22 seconds autonomously.",
    resolution: 'Autonomous',
    csat: 4,
    actions: [{ label: 'HubSpot queried' }, { label: 'Stripe refund initiated' }, { label: 'Confirmation email sent' }],
    transcript: [
      { speaker: 'Customer', text: "Hi, I noticed a duplicate charge of €94 on my account from March 31st. Can you help?" },
      { speaker: 'Lira', text: "Hello Jana! I can see the duplicate charge on your account from March 31st. I've confirmed this in your billing record and initiated a refund of €94.00 to your original payment method. You'll see it within 3–5 business days. Reference: REF-20482." },
    ],
  },
  {
    id: 'PRO-0391',
    date: 'Mar 28, 2026',
    time: '10:00 AM',
    channel: 'email',
    direction: 'Proactive',
    summary: "Lira detected a failed payment on Jana's subscription and sent a proactive retry email before the customer contacted support. Customer clicked the retry link and payment succeeded. Ticket prevented.",
    resolution: 'Autonomous',
    csat: null,
    actions: [{ label: 'Proactive email sent' }, { label: 'Payment retry link included' }],
    transcript: [],
  },
  {
    id: 'LRA-8219',
    date: 'Mar 15, 2026',
    time: '11:45 AM',
    channel: 'chat',
    direction: 'Inbound',
    summary: "Customer asked about API rate limits for the integration. Lira answered using the API documentation knowledge base entry. No actions required. Resolved in 18 seconds.",
    resolution: 'Autonomous',
    csat: 4,
    actions: [{ label: 'KB: API_Rate_Limits_v3 used' }],
    transcript: [
      { speaker: 'Customer', text: "Hi, what are the rate limits for your REST API? We're building an integration." },
      { speaker: 'Lira', text: "Hi Jana! Our REST API has a rate limit of 500 requests per minute per API key. For enterprise plans, this can be increased to 2,000/min by contacting your account manager. Full documentation at docs.lira.ai/rate-limits." },
    ],
  },
  {
    id: 'LRA-7903',
    date: 'Feb 22, 2026',
    time: '4:30 PM',
    channel: 'email',
    direction: 'Inbound',
    summary: "Customer reported that their account had been locked after too many failed login attempts. Lira was unable to resolve autonomously due to security policy requiring identity verification — escalated to Agent Sarah K. Resolved by agent in 12 minutes.",
    resolution: 'Escalated',
    csat: 3,
    actions: [{ label: 'Escalated to Sarah K.' }, { label: 'Slack #security-support notified' }],
    transcript: [
      { speaker: 'Customer', text: "My account is locked. I can't log in at all." },
      { speaker: 'Lira', text: "I'm sorry to hear that. For account unlocks I need to verify your identity, which requires a human agent due to our security policy. I've notified our team and Sarah K. will follow up within 15 minutes." },
    ],
  },
]

// ── Channel icon + label ───────────────────────────────────────────────────────
function ChannelBadge({ channel }: { channel: Channel }) {
  const config = {
    email: { icon: EnvelopeIcon, label: 'Email',  color: PRIMARY },
    chat:  { icon: ChatBubbleLeftEllipsisIcon, label: 'Chat', color: AMBER },
    voice: { icon: PhoneIcon,    label: 'Voice',  color: GREEN },
  }[channel]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <config.icon style={{ width: 13, height: 13, color: config.color }} />
      <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: config.color }}>{config.label}</span>
    </div>
  )
}

// ── Star display ───────────────────────────────────────────────────────────────
function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{ fontSize: 12, color: i < rating ? STAR_GOLD : 'rgba(88,90,104,0.3)' }}>★</span>
      ))}
    </div>
  )
}

// ── Resolution badge ───────────────────────────────────────────────────────────
function ResolutionBadge({ resolution }: { resolution: Resolution }) {
  const config = {
    Autonomous: { color: GREEN, bg: '#D1FAE5', label: 'Autonomous ✓' },
    Escalated:  { color: AMBER, bg: '#FEF3C7', label: 'Escalated'     },
    Pending:    { color: RED,   bg: '#FEE2E2',  label: 'Pending'       },
  }[resolution]
  return (
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: config.color, background: config.bg, borderRadius: 9999, padding: '3px 10px' }}>
      {config.label}
    </span>
  )
}

// ── Filter pill ────────────────────────────────────────────────────────────────
function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT, fontWeight: active ? 700 : 500, fontSize: 12,
        color: active ? WHITE : DARK,
        background: active ? PRIMARY : BG,
        boxShadow: active ? '0 4px 12px rgba(99,102,241,0.35)' : NEU_SHADOW,
        border: 'none', borderRadius: 9999, padding: '7px 16px', cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

// ── Timeline entry ─────────────────────────────────────────────────────────────
function TimelineEntry({ interaction }: { interaction: Interaction }) {
  const [expanded, setExpanded] = useState(false)

  const directionColor = interaction.direction === 'Proactive' ? PRIMARY : MUTED

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9999,
          background: interaction.direction === 'Proactive' ? AI_BG : BG,
          border: interaction.direction === 'Proactive' ? `1px solid ${AI_BORDER}` : 'none',
          boxShadow: NEU_SHADOW,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {interaction.channel === 'voice'
            ? <PhoneIcon style={{ width: 15, height: 15, color: GREEN }} />
            : interaction.channel === 'chat'
              ? <ChatBubbleLeftEllipsisIcon style={{ width: 15, height: 15, color: AMBER }} />
              : <EnvelopeIcon style={{ width: 15, height: 15, color: PRIMARY }} />
          }
        </div>
        <div style={{ width: 2, flex: 1, background: 'rgba(88,90,104,0.1)', minHeight: 24 }} />
      </div>

      {/* Entry card */}
      <div style={{ flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 20, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>
                {interaction.date}
              </span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{interaction.time}</span>
              <ChannelBadge channel={interaction.channel} />
              <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: directionColor, background: `${directionColor}14`, borderRadius: 9999, padding: '2px 8px' }}>
                {interaction.direction}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <ResolutionBadge resolution={interaction.resolution} />
              {interaction.csat !== null ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Stars rating={interaction.csat} />
                  <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{interaction.csat}/5</span>
                </div>
              ) : (
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>CSAT not collected</span>
              )}
            </div>
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, flexShrink: 0 }}>#{interaction.id}</span>
        </div>

        {/* Summary */}
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, lineHeight: '1.6em', color: DARK, margin: 0 }}>
          {interaction.summary}
        </p>

        {/* Action chips */}
        {interaction.actions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {interaction.actions.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: PROFILE_BG, borderRadius: 9999, padding: '5px 12px',
              }}>
                <SparklesIcon style={{ width: 10, height: 10, color: PRIMARY }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{a.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expand transcript */}
        {interaction.transcript.length > 0 && (
          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 12, color: PRIMARY,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, padding: 0,
            }}
          >
            {expanded ? <ChevronUpIcon style={{ width: 13, height: 13 }} /> : <ChevronDownIcon style={{ width: 13, height: 13 }} />}
            {expanded ? 'Hide' : 'Expand for full transcript'}
          </button>
        )}

        {expanded && interaction.transcript.length > 0 && (
          <div style={{ background: PROFILE_BG, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {interaction.transcript.map((entry, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: entry.speaker === 'Lira' ? PRIMARY : DARK, flexShrink: 0, minWidth: 64 }}>
                  {entry.speaker}:
                </span>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, lineHeight: '1.6em', color: DARK }}>
                  {entry.text}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportCustomerTimelinePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [channelFilter, setChannelFilter] = useState('All')
  const [directionFilter, setDirectionFilter] = useState('All')

  const filtered = TIMELINE.filter(i => {
    if (channelFilter !== 'All' && i.channel !== channelFilter.toLowerCase()) return false
    if (directionFilter !== 'All' && i.direction !== directionFilter) return false
    return true
  })

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
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
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>Timeline</span>
        </div>

        {/* Tab strip */}
        <div style={{ display: 'flex', gap: 0 }}>
          {['Overview', 'Timeline', 'CRM Sync'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'Overview') navigate(`/support/customers/${id ?? 'default'}`)
                if (tab === 'CRM Sync')  navigate(`/support/customers/${id ?? 'default'}/crm`)
              }}
              style={{
                fontFamily: FONT, fontWeight: tab === 'Timeline' ? 700 : 500, fontSize: 13,
                color: tab === 'Timeline' ? PRIMARY : MUTED,
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '14px 20px',
                borderBottom: tab === 'Timeline' ? `2px solid ${PRIMARY}` : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ flexShrink: 0, padding: isMobile ? '16px 12px 8px' : '20px 32px 8px', display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Channel filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Channel</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Email', 'Chat', 'Voice'].map(f => (
              <FilterPill key={f} label={f} active={channelFilter === f} onClick={() => setChannelFilter(f)} />
            ))}
          </div>
        </div>

        {/* Direction filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: MUTED }}>Direction</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['All', 'Inbound', 'Proactive'].map(f => (
              <FilterPill key={f} label={f} active={directionFilter === f} onClick={() => setDirectionFilter(f)} />
            ))}
          </div>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button style={{
            fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK,
            background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 12,
            padding: '8px 14px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <CalendarDaysIcon style={{ width: 14, height: 14, color: MUTED }} />
            Date range
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '16px 32px 32px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 64 }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED }}>No interactions match your filters</span>
          </div>
        ) : (
          filtered.map(interaction => (
            <TimelineEntry key={interaction.id} interaction={interaction} />
          ))
        )}
      </div>
    </div>
  )
}
