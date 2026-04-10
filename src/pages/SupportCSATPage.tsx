/**
 * Screen 16 — Inbox: CSAT Outcome View
 * Conversation detail with resolved thread and CSAT feedback card at the bottom.
 * Shows billable vs. non-billable outcome state.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  SparklesIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG             = '#E8EAF0'
const NEU_SHADOW     = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const PRIMARY        = '#6366F1'
const PRIMARY_DARK   = '#4F46E5'
const DARK           = '#2E3040'
const MUTED          = '#585A68'
const WHITE          = '#FFFFFF'
const FONT           = 'Plus Jakarta Sans, sans-serif'
const AI_BG          = '#EEF2FF'
const AI_BORDER      = 'rgba(224,231,255,0.5)'
const PROFILE_BG     = 'rgba(232,234,240,0.5)'
const GREEN          = '#059669'
const GREEN_DARK     = '#047857'
const GREEN_HEADING  = '#064E3B'
const GREEN_MUTED    = 'rgba(6,95,70,0.7)'
const GREEN_BORDER   = '#D1FAE5'
const GREEN_BG       = 'rgba(236,253,245,0.6)'
const GREEN_DIV      = 'rgba(167,243,208,0.3)'
const STAR_GOLD      = '#EAB308'
const CSAT_BG        = 'rgba(240,253,244,0.8)'
const CSAT_BORDER    = '#BBF7D0'

// ── Customer message ───────────────────────────────────────────────────────────
function CustomerMessage({ text, time, channel }: { text: string; time: string; channel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9999, background: '#818CF8',
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>JF</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{ background: WHITE, borderRadius: '0px 16px 16px 16px', boxShadow: NEU_SHADOW, padding: '15px 16px' }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>{text}</p>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, paddingLeft: 4 }}>
          {time}{channel ? ` · ${channel}` : ''}
        </span>
      </div>
    </div>
  )
}

// ── AI message ─────────────────────────────────────────────────────────────────
function AIMessage({ text, time, chips }: { text: string; time: string; chips?: string[] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{
          background: AI_BG, border: `1px solid ${AI_BORDER}`,
          borderRadius: '16px 0px 16px 16px', boxShadow: NEU_SHADOW, padding: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: 9999, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY }}>Lira AI Agent</span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>{text}</p>
          {chips && chips.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ borderTop: '1px solid rgba(199,210,254,0.5)' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chips.map(c => (
                  <span key={c} style={{
                    fontFamily: FONT, fontWeight: 500, fontSize: 10, color: '#4338CA',
                    background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.8)',
                    borderRadius: 8, padding: '4px 8px',
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, textAlign: 'right', paddingRight: 4 }}>{time}</span>
      </div>
      <div style={{
        width: 32, height: 32, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4,
      }}>
        <SparklesIcon style={{ width: 16, height: 16, color: PRIMARY }} />
      </div>
    </div>
  )
}

// ── Resolution card ────────────────────────────────────────────────────────────
function ResolutionCard() {
  return (
    <div style={{
      alignSelf: 'center', width: '100%', maxWidth: 448,
      background: 'rgba(236,253,245,0.5)', border: `1px solid ${GREEN_BORDER}`,
      borderRadius: 24, boxShadow: NEU_SHADOW, padding: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 9999,
        background: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)',
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleIcon style={{ width: 32, height: 32, color: WHITE }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: GREEN_HEADING, textAlign: 'center' }}>
          Conversation Resolved
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: GREEN_MUTED, textAlign: 'center', lineHeight: '1.55em', maxWidth: 280 }}>
          Lira AI successfully handled this request without human intervention.
        </span>
      </div>
      <div style={{ width: '100%', borderTop: `1px solid ${GREEN_DIV}` }} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN_DARK }}>
          Customer Satisfaction
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[1, 2, 3, 4].map(i => <StarIcon key={i} style={{ width: 18, height: 18, color: STAR_GOLD }} />)}
          <StarIcon style={{ width: 18, height: 18, color: '#E5E7EB' }} />
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: GREEN, textAlign: 'center' }}>
          4/5 stars · "Very fast response"
        </span>
      </div>
    </div>
  )
}

// ── CSAT feedback card (the main new element of Screen 16) ─────────────────────
function CSATFeedbackCard({ billable }: { billable: boolean }) {
  const rating = 4
  const comment = "It was a bit slow on the first try, but eventually resolved everything — very helpful overall!"
  const timestamp = "April 6, 2026, 3:22 PM"

  return (
    <div style={{
      background: billable ? CSAT_BG : 'rgba(255,241,242,0.7)',
      border: `1px solid ${billable ? CSAT_BORDER : '#FECDD3'}`,
      borderRadius: 20, padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9999,
          background: billable ? GREEN_BG : 'rgba(255,226,230,0.8)',
          border: `1px solid ${billable ? CSAT_BORDER : '#FECDD3'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {billable
            ? <CheckCircleIcon style={{ width: 16, height: 16, color: GREEN }} />
            : <StarIcon style={{ width: 16, height: 16, color: '#E11D48' }} />
          }
        </div>
        <div>
          <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: billable ? GREEN_HEADING : '#881337', margin: 0 }}>
            Customer satisfaction collected
          </p>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, margin: 0 }}>
            CSAT submitted: {timestamp}
          </p>
        </div>
        {/* Billing badge */}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {billable ? (
            <span style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN_DARK,
              background: GREEN_BG, border: `1px solid ${CSAT_BORDER}`,
              borderRadius: 9999, padding: '3px 10px', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Billable resolution
            </span>
          ) : (
            <span style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 10, color: '#9F1239',
              background: 'rgba(255,241,242,0.9)', border: '1px solid #FECDD3',
              borderRadius: 9999, padding: '3px 10px', textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Not billed
            </span>
          )}
        </div>
      </div>

      {/* Stars + comment */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Star rating row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1, 2, 3, 4, 5].map(i => (
              <StarIcon key={i} style={{
                width: 20, height: 20,
                color: i <= rating ? STAR_GOLD : '#E5E7EB',
              }} />
            ))}
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>
            {rating}/5
          </span>
        </div>

        {/* Comment bubble */}
        <div style={{
          background: WHITE, borderRadius: '0px 14px 14px 14px',
          padding: '12px 14px', boxShadow: NEU_SHADOW,
          maxWidth: 400,
        }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, lineHeight: '1.55em', color: DARK, margin: 0, fontStyle: 'italic' }}>
            "{comment}"
          </p>
          <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 10, color: MUTED, display: 'block', marginTop: 6 }}>
            — Jana Fischer
          </span>
        </div>

        {!billable && (
          <div style={{
            background: 'rgba(255,241,242,0.9)', border: '1px solid #FECDD3',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: '#9F1239', margin: 0, lineHeight: '1.55em' }}>
              This interaction is flagged for self-improvement analysis. Lira will draft a knowledge gap entry for review.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Right sidebar ──────────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 9999, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Interaction Summary</span>
        </div>

        <div style={{ background: PROFILE_BG, borderRadius: 16, padding: '17px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ label: 'Customer', value: 'Jana Fischer' }, { label: 'Tier', value: 'Standard', pill: true }].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{row.label}</span>
              {row.pill
                ? <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: '#4338CA', background: '#E0E7FF', borderRadius: 9999, padding: '2px 10px' }}>{row.value}</span>
                : <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>{row.value}</span>
              }
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>Churn Risk</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheckIcon style={{ width: 13, height: 13, color: GREEN }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: GREEN }}>Low</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {[{ label: 'Time to Resolve', value: '22s', color: PRIMARY }, { label: 'Channel', value: 'Email', icon: EnvelopeIcon, color: DARK }].map(s => (
            <div key={s.label} style={{ flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.icon && <s.icon style={{ width: 14, height: 14, color: MUTED }} />}
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* CSAT score in sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>CSAT Score</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1,2,3,4].map(i => <StarIcon key={i} style={{ width: 14, height: 14, color: STAR_GOLD }} />)}
              <StarIcon style={{ width: 14, height: 14, color: '#E5E7EB' }} />
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>4/5</span>
            <span style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN_DARK,
              background: 'rgba(209,250,229,0.6)', borderRadius: 9999, padding: '2px 8px',
            }}>
              Billable
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Knowledge Used</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Billing_FAQ_v2', 'Stripe_Int_Manual'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '6px 12px' }}>
                <DocumentTextIcon style={{ width: 12, height: 12, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: WHITE,
          background: PRIMARY, border: 'none', borderRadius: 16, padding: '13px 0', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <ArchiveBoxIcon style={{ width: 16, height: 16, color: WHITE }} />
          Archive Ticket
        </button>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK,
          background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 16,
          padding: '13px 0', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <ClockIcon style={{ width: 16, height: 16, color: MUTED }} />
          View Customer History
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function SupportCSATPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [billable] = useState(true)

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px', flexShrink: 0,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)', background: BG,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
          <button onClick={() => navigate('/support/inbox')} style={{
            width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ChevronLeftIcon style={{ width: 18, height: 18, color: DARK }} />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 9999, background: '#818CF8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: NEU_SHADOW, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>JF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 14 : 16, color: DARK }}>Jana Fischer</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN_DARK, background: '#D1FAE5', borderRadius: 9999, padding: '2px 8px', textTransform: 'uppercase' }}>
                Resolved
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Ticket #LRA-8842 · CSAT collected</span>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
            <button style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EllipsisHorizontalIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 32, padding: isMobile ? '16px 12px 32px' : 32,
        minHeight: 0, overflow: isMobile ? 'visible' : 'hidden',
      }}>
        {/* Thread */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 24,
          overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4,
        }}>
          <CustomerMessage
            text="Hi, I'm trying to update my billing information for my Standard subscription but the dashboard keeps giving me a validation error on my zip code. Can you help?"
            time="10:42 AM"
            channel="Email"
          />
          <AIMessage
            text="Hello Jana! I've checked your account details and it seems the zip code format was defaulting to a 5-digit string while your billing address is in Germany. I've updated your region settings in the Stripe gateway. You should be able to save your card details now."
            time="10:42 AM"
            chips={['Source: Stripe Docs', 'Action: Stripe Update']}
          />
          <CustomerMessage
            text="That worked perfectly! All updated now. Thanks for the quick fix!"
            time="10:43 AM"
          />

          {/* Resolution card */}
          <ResolutionCard />

          {/* CSAT feedback card — the key new element */}
          <CSATFeedbackCard billable={billable} />
        </div>

        {/* Right sidebar */}
        <div style={{
          width: isMobile ? '100%' : 304, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: isMobile ? 'visible' : 'auto',
        }}>
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
