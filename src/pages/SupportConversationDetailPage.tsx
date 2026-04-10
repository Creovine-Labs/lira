import { useNavigate } from 'react-router-dom'
import {
  ArchiveBoxIcon,
  ChevronLeftIcon,
  ClockIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
  EnvelopeIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon, SparklesIcon, StarIcon } from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG            = '#E8EAF0'
const NEU_SHADOW    = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const PRIMARY       = '#6366F1'
const PRIMARY_DARK  = '#4F46E5'
const PRIMARY_DEEP  = '#4338CA'
const DARK          = '#2E3040'
const MUTED         = '#585A68'
const WHITE         = '#FFFFFF'
const FONT          = 'Plus Jakarta Sans, sans-serif'
const AI_BG         = '#EEF2FF'
const AI_BORDER     = 'rgba(224,231,255,0.5)'
const CHIP_BG       = 'rgba(255,255,255,0.5)'
const CHIP_BORDER   = 'rgba(255,255,255,0.8)'
const RESOLVED_BG   = 'rgba(236,253,245,0.5)'
const RESOLVED_BORDER = '#D1FAE5'
const GREEN_LABEL   = '#047857'
const GREEN         = '#059669'
const GREEN_HEADING = '#064E3B'
const GREEN_MUTED   = 'rgba(6,95,70,0.7)'
const GREEN_DIV     = 'rgba(167,243,208,0.3)'
const PROFILE_BG    = 'rgba(232,234,240,0.5)'
const AI_ACTION_BG  = 'rgba(232,234,240,0.3)'
const TIER_BG       = '#E0E7FF'
const STAR_GOLD     = '#EAB308'

// ── Lira AI sparkle icon ───────────────────────────────────────────────────────
function LiraIcon({ size = 24, bg = PRIMARY }: { size?: number; bg?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <SparklesIcon style={{ width: size * 0.58, height: size * 0.58, color: WHITE }} />
    </div>
  )
}

// ── Customer avatar (JF initials) ──────────────────────────────────────────────
function CustomerAvatar({ size = 32 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: WHITE,
      boxShadow: NEU_SHADOW,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: Math.round(size * 0.31), color: MUTED }}>
        JF
      </span>
    </div>
  )
}

// ── Customer message bubble (left-aligned) ────────────────────────────────────
function CustomerMessage({ text, time, channel }: { text: string; time: string; channel?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <CustomerAvatar />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{
          background: WHITE,
          borderRadius: '0px 16px 16px 16px',
          boxShadow: NEU_SHADOW,
          padding: '15px 16px',
        }}>
          <p style={{
            fontFamily: FONT, fontWeight: 400, fontSize: 14,
            lineHeight: '1.625em', color: DARK, margin: 0,
          }}>
            {text}
          </p>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, paddingLeft: 4 }}>
          {time}{channel ? ` • ${channel}` : ''}
        </span>
      </div>
    </div>
  )
}

// ── Attribution chip ───────────────────────────────────────────────────────────
function AttributionChip({ label }: { label: string }) {
  return (
    <span style={{
      fontFamily: FONT, fontWeight: 500, fontSize: 10, color: PRIMARY_DEEP,
      background: CHIP_BG,
      border: `1px solid ${CHIP_BORDER}`,
      borderRadius: 8, padding: '4px 8px',
      display: 'inline-flex', alignItems: 'center', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

// ── AI message bubble (right-aligned) ─────────────────────────────────────────
function AIMessage({
  para1, para2, time, processedIn, chips,
}: {
  para1: string; para2: string; time: string; processedIn: string; chips: string[]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, justifyContent: 'flex-end' }}>
      {/* Bubble + meta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{
          background: AI_BG,
          border: `1px solid ${AI_BORDER}`,
          borderRadius: '16px 0px 16px 16px',
          boxShadow: NEU_SHADOW,
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* AI header label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LiraIcon size={24} />
            <span style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 10,
              letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY,
            }}>
              Lira AI Agent
            </span>
          </div>

          {/* Body paragraphs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>
              {para1}
            </p>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>
              {para2}
            </p>
          </div>

          {/* Separator + attribution chips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ borderTop: '1px solid rgba(199,210,254,0.5)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {chips.map(chip => <AttributionChip key={chip} label={chip} />)}
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <span style={{
          fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED,
          textAlign: 'right', paddingRight: 4,
        }}>
          {time} • Processed in {processedIn}
        </span>
      </div>

      {/* Lira badge on the right */}
      <div style={{
        width: 32, height: 32, borderRadius: 9999,
        background: BG, boxShadow: NEU_SHADOW,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 4,
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
      alignSelf: 'center',
      width: '100%', maxWidth: 448,
      background: RESOLVED_BG,
      border: `1px solid ${RESOLVED_BORDER}`,
      borderRadius: 24,
      boxShadow: NEU_SHADOW,
      padding: 32,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      {/* Green check icon */}
      <div style={{
        width: 64, height: 64, borderRadius: 9999,
        background: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)',
        boxShadow: NEU_SHADOW,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleIcon style={{ width: 32, height: 32, color: WHITE }} />
      </div>

      {/* Heading + subtext */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 18, color: GREEN_HEADING,
          textAlign: 'center',
        }}>
          Conversation Resolved
        </span>
        <span style={{
          fontFamily: FONT, fontWeight: 400, fontSize: 14, color: GREEN_MUTED,
          textAlign: 'center', lineHeight: '1.55em', maxWidth: 300,
        }}>
          Lira AI successfully handled this request without human intervention.
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', borderTop: `1px solid ${GREEN_DIV}` }} />

      {/* CSAT */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 11,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: GREEN_LABEL,
        }}>
          Customer Satisfaction
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[1, 2, 3, 4].map(i => (
            <StarIcon key={i} style={{ width: 18, height: 18, color: STAR_GOLD }} />
          ))}
          <StarIcon style={{ width: 18, height: 18, color: '#E5E7EB' }} />
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: GREEN, textAlign: 'center' }}>
          4/5 stars • "Very fast response"
        </span>
      </div>
    </div>
  )
}

// ── Stat card (performance stats row) ─────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, valueColor = DARK,
}: {
  label: string
  value: string
  icon?: React.ComponentType<{ style?: React.CSSProperties }>
  valueColor?: string
}) {
  return (
    <div style={{
      flex: 1,
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 16,
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {Icon && <Icon style={{ width: 14, height: 14, color: MUTED }} />}
        <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: valueColor, lineHeight: 1 }}>
          {value}
        </span>
      </div>
    </div>
  )
}

// ── AI action item ─────────────────────────────────────────────────────────────
function ActionItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div style={{
      background: AI_ACTION_BG,
      borderRadius: 16,
      padding: 12,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9999,
        background: BG, boxShadow: NEU_SHADOW,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <SparklesIcon style={{ width: 14, height: 14, color: PRIMARY }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>{title}</span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>{subtitle}</span>
      </div>
    </div>
  )
}

// ── Knowledge source pill ──────────────────────────────────────────────────────
function KnowledgePill({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: BG, boxShadow: NEU_SHADOW,
      borderRadius: 9999, padding: '6px 12px',
    }}>
      <DocumentTextIcon style={{ width: 12, height: 12, color: MUTED, flexShrink: 0 }} />
      <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{label}</span>
    </div>
  )
}

// ── Tag pill ───────────────────────────────────────────────────────────────────
function TagPill({ label, color = DARK }: { label: string; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: BG, boxShadow: NEU_SHADOW,
      borderRadius: 9999, padding: '5px 12px',
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color }}>{label}</span>
    </div>
  )
}

// ── Section label (uppercase) ──────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: FONT, fontWeight: 700, fontSize: 11,
      letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED,
    }}>
      {children}
    </span>
  )
}

// ── Interaction summary card (right sidebar, card 1) ──────────────────────────
function InteractionSummaryCard() {
  return (
    <div style={{
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24,
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LiraIcon size={24} />
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>
          Interaction Summary
        </span>
      </div>

      {/* Profile detail block */}
      <div style={{
        background: PROFILE_BG, borderRadius: 16,
        padding: '17px 16px 16px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Customer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, flexShrink: 0 }}>Customer</span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>Jana Fischer</span>
        </div>
        {/* Tier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, flexShrink: 0 }}>Tier</span>
          <span style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY_DEEP,
            background: TIER_BG, borderRadius: 9999, padding: '2px 10px',
          }}>
            Standard
          </span>
        </div>
        {/* Churn risk */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, flexShrink: 0 }}>Churn Risk</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheckIcon style={{ width: 13, height: 13, color: GREEN }} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: GREEN }}>Low</span>
          </div>
        </div>
      </div>

      {/* Performance stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard label="Time to Resolve" value="22s" valueColor={PRIMARY} />
        <StatCard label="Channel" value="Email" icon={EnvelopeIcon} valueColor={DARK} />
      </div>

      {/* AI reasoning & actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel>Lira's Reasoning & Actions</SectionLabel>
        <ActionItem title="Query: HubSpot" subtitle="Matched subscription: Standard" />
        <ActionItem title="Action: Grounded Reply" subtitle={'Instruction: "Fix zip code validation"'} />
      </div>

      {/* Knowledge sources */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel>Knowledge Used</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <KnowledgePill label="Billing_FAQ_v2" />
          <KnowledgePill label="Stripe_Int_Manual" />
        </div>
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <SectionLabel>Tags</SectionLabel>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagPill label="Billing" color={PRIMARY_DARK} />
          <TagPill label="Resolved autonomously" color={GREEN} />
          <TagPill label="Global-EU" color={MUTED} />
        </div>
      </div>
    </div>
  )
}

// ── Quick actions card (right sidebar, card 2) ────────────────────────────────
function QuickActionsCard() {
  return (
    <div style={{
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <button style={{
        fontFamily: FONT, fontWeight: 600, fontSize: 14, color: WHITE,
        background: PRIMARY, border: 'none', cursor: 'pointer',
        borderRadius: 16, padding: '13px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%',
      }}>
        <ArchiveBoxIcon style={{ width: 16, height: 16, color: WHITE }} />
        Archive Ticket
      </button>

      <button style={{
        fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK,
        background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer',
        borderRadius: 16, padding: '13px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: '100%',
      }}>
        <ClockIcon style={{ width: 16, height: 16, color: MUTED }} />
        View Customer History
      </button>
    </div>
  )
}

// ── Page component ─────────────────────────────────────────────────────────────
export function SupportConversationDetailPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  return (
    <div style={{
      fontFamily: FONT,
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
      height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>

      {/* ── Header bar ──────────────────────────────────────────────────────── */}
      <div style={{
        height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 16px' : '0 32px',
        flexShrink: 0,
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        background: BG,
      }}>
        {/* Left: back + avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => navigate('/support/inbox')}
            style={{
              width: 40, height: 40, borderRadius: 9999,
              background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeftIcon style={{ width: 18, height: 18, color: DARK }} />
          </button>

          {/* Customer avatar */}
          <div style={{
            width: 32, height: 32, borderRadius: 9999,
            background: '#818CF8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: NEU_SHADOW, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>JF</span>
          </div>

          {/* Name + badge + ticket */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 14 : 16, color: DARK }}>
                Jana Fischer
              </span>
              <span style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN_LABEL,
                background: '#D1FAE5', borderRadius: 9999, padding: '2px 8px',
                textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
              }}>
                Resolved
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
              Ticket #LRA-8842 · 2m ago
            </span>
          </div>
        </div>

        {/* Right: action buttons — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 14, color: PRIMARY,
              background: BG, boxShadow: NEU_SHADOW,
              padding: '8px 20px', borderRadius: 24, border: 'none', cursor: 'pointer',
            }}>
              Reopen
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 9999,
              background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 9999,
              background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <EllipsisHorizontalIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 16 : 32,
        padding: isMobile ? '16px 12px 32px' : 32,
        minHeight: 0,
        overflow: isMobile ? 'visible' : 'hidden',
      }}>

        {/* ── Conversation thread (scrollable) ─────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', gap: 24,
          overflowY: isMobile ? 'visible' : 'auto',
          paddingRight: isMobile ? 0 : 4,
          paddingBottom: 8,
        }}>
          <CustomerMessage
            text="Hi, I'm trying to update my billing information for my Standard subscription but the dashboard keeps giving me a validation error on my zip code. Can you help?"
            time="10:42 AM"
            channel="Email"
          />

          <AIMessage
            para1="Hello Jana! I've checked your account details and it seems the zip code format was defaulting to a 5-digit string while your billing address is in Germany. I've updated your region settings in the Stripe gateway."
            para2="You should be able to save your card details now. Would you like me to stay on the line while you try again?"
            time="10:42 AM"
            processedIn="22s"
            chips={['Source: Stripe Docs', 'Action: Stripe Update']}
          />

          <CustomerMessage
            text="That worked perfectly! All updated now. Thanks for the quick fix!"
            time="10:43 AM"
          />

          <ResolutionCard />
        </div>

        {/* ── Right sidebar ────────────────────────────────────────────────── */}
        <div style={{
          width: isMobile ? '100%' : 304,
          flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: isMobile ? 'visible' : 'auto',
          paddingBottom: 8,
        }}>
          <InteractionSummaryCard />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
