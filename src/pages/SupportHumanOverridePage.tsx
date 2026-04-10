/**
 * Screen 15 — Inbox: Human Override (Manual Reply)
 * Conversation detail with reply composer at the bottom.
 * Toggle between "Lira is drafting" mode and "You are drafting" mode.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  PaperClipIcon,
  DocumentTextIcon,
  BoldIcon,
  ListBulletIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, ChevronRightIcon } from '@heroicons/react/24/solid'
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

type Mode = 'lira' | 'manual'

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

// ── Mode Toggle ────────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: BG, boxShadow: NEU_INSET, borderRadius: 9999,
      padding: 3, gap: 0,
    }}>
      {(['lira', 'manual'] as Mode[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            fontFamily: FONT, fontWeight: 600, fontSize: 12,
            color: mode === m ? DARK : MUTED,
            background: mode === m ? BG : 'transparent',
            boxShadow: mode === m ? NEU_SHADOW : 'none',
            border: 'none', cursor: 'pointer', borderRadius: 9999,
            padding: '6px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {m === 'lira' ? (
            <>
              <SparklesIcon style={{ width: 12, height: 12, color: mode === m ? PRIMARY : MUTED }} />
              Lira is drafting
            </>
          ) : (
            'You are drafting'
          )}
        </button>
      ))}
    </div>
  )
}

// ── Lira Draft Composer ────────────────────────────────────────────────────────
function LiraDraftComposer({ onSwitchManual }: { onSwitchManual: () => void }) {
  const draftText = "I completely understand your frustration, Jana. Your billing issue has been fully resolved — the region settings have been updated in our system. Your card should now accept a German zip code format. Please try saving your card details again. If you encounter any further issues, don't hesitate to reach out!"

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Draft bubble (grey — "pending") */}
      <div style={{
        background: 'rgba(232,234,240,0.7)',
        border: '1px dashed rgba(99,102,241,0.3)',
        borderRadius: '16px 0px 16px 16px',
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SparklesIcon style={{ width: 12, height: 12, color: PRIMARY }} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY }}>
            Lira's Draft
          </span>
        </div>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: MUTED, margin: 0, fontStyle: 'italic' }}>
          {draftText}
        </p>
        {/* Attribution */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: FONT, fontWeight: 600, fontSize: 10, color: PRIMARY,
            background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 8, padding: '3px 8px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <DocumentTextIcon style={{ width: 10, height: 10 }} />
            Grounded in: Billing_FAQ_v2
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE,
          background: PRIMARY, border: 'none', borderRadius: 14, padding: '10px 20px', cursor: 'pointer',
        }}>
          Send Lira's reply
        </button>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 13, color: PRIMARY,
          background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '10px 20px', cursor: 'pointer',
        }}>
          Edit before sending
        </button>
        <button
          onClick={onSwitchManual}
          style={{
            fontFamily: FONT, fontWeight: 600, fontSize: 13, color: MUTED,
            background: 'transparent', border: 'none', cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Discard and write manually
        </button>
      </div>
    </div>
  )
}

// ── Manual Composer ────────────────────────────────────────────────────────────
function ManualComposer({ onHandBack }: { onHandBack: () => void }) {
  const [value, setValue] = useState('')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {[BoldIcon, ListBulletIcon, LinkIcon, PaperClipIcon].map((Icon, i) => (
          <button key={i} style={{
            width: 32, height: 32, borderRadius: 9999,
            background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 15, height: 15, color: MUTED }} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <DocumentTextIcon style={{ width: 13, height: 13 }} />
          Insert template
        </button>
      </div>

      {/* Text area */}
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Write your reply here…"
        rows={5}
        style={{
          fontFamily: FONT, fontWeight: 400, fontSize: 14, color: DARK,
          background: BG, boxShadow: NEU_INSET, borderRadius: 16,
          border: 'none', outline: 'none', padding: '14px 16px',
          resize: 'vertical', lineHeight: '1.6em',
        }}
      />

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, maxWidth: 320, lineHeight: '1.5em' }}>
            This reply will be sent as <strong>you</strong>. Lira will continue monitoring but won't auto-reply.
          </span>
          <button
            onClick={onHandBack}
            style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY,
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            }}
          >
            Hand back to Lira →
          </button>
        </div>
        <button style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 14, color: WHITE,
          background: PRIMARY, border: 'none', borderRadius: 14, padding: '11px 24px', cursor: 'pointer',
          opacity: value.trim() ? 1 : 0.55,
        }}>
          Send as You
        </button>
      </div>
    </div>
  )
}

// ── Reply Composer container ───────────────────────────────────────────────────
function ReplyComposer() {
  const [mode, setMode] = useState<Mode>('lira')

  return (
    <div style={{
      background: BG, boxShadow: `0px -4px 20px rgba(0,0,0,0.04), ${NEU_SHADOW}`,
      borderRadius: '20px 20px 0 0',
      padding: '16px 20px 20px',
      display: 'flex', flexDirection: 'column', gap: 14,
      flexShrink: 0,
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <ModeToggle mode={mode} onChange={setMode} />
        {mode === 'manual' && (
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
            Replying as You
          </span>
        )}
      </div>

      {/* Composer body */}
      {mode === 'lira'
        ? <LiraDraftComposer onSwitchManual={() => setMode('manual')} />
        : <ManualComposer onHandBack={() => setMode('lira')} />
      }
    </div>
  )
}

// ── Right sidebar ──────────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{
        background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 9999, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Interaction Summary</span>
        </div>

        <div style={{ background: 'rgba(232,234,240,0.5)', borderRadius: 16, padding: '17px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ label: 'Customer', value: 'Jana Fischer' }, { label: 'Tier', value: 'Standard' }, { label: 'Status', value: 'Open' }].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{row.label}</span>
              <span style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 12,
                color: row.label === 'Tier' ? '#4338CA' : DARK,
                background: row.label === 'Tier' ? '#E0E7FF' : 'transparent',
                borderRadius: row.label === 'Tier' ? 9999 : 0,
                padding: row.label === 'Tier' ? '2px 10px' : 0,
                fontSize: row.label === 'Tier' ? 10 : 12,
              }}>{row.value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Tags</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[{ label: 'Billing', color: '#4F46E5' }, { label: 'Open', color: MUTED }].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '5px 12px' }}>
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: t.color }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: WHITE,
          background: PRIMARY, border: 'none', borderRadius: 16, padding: '13px 0', cursor: 'pointer', width: '100%',
        }}>
          Resolve Conversation
        </button>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK,
          background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 16,
          padding: '13px 0', cursor: 'pointer', width: '100%',
        }}>
          Escalate
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function SupportHumanOverridePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN, background: 'rgba(209,250,229,0.8)', borderRadius: 9999, padding: '2px 8px', textTransform: 'uppercase' }}>
                Open
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Ticket #LRA-8843 · Human override active</span>
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
        gap: isMobile ? 0 : 32, padding: isMobile ? '16px 12px 0' : '32px 32px 0',
        minHeight: 0, overflow: isMobile ? 'visible' : 'hidden',
      }}>
        {/* Thread + composer */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          minHeight: 0, overflow: isMobile ? 'visible' : 'hidden',
        }}>
          {/* Scrollable thread */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', gap: 24,
            overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4,
            paddingBottom: 20,
          }}>
            <CustomerMessage
              text="Hi, I'm still having issues with the billing validation on my zip code. The fix you mentioned earlier didn't seem to work."
              time="10:42 AM"
              channel="Email"
            />
            <AIMessage
              text="Hello Jana! I've checked your account again and it looks like the region settings may need a second update. Let me look into this immediately."
              time="10:43 AM"
              chips={['Source: Billing_FAQ_v2']}
            />
            <CustomerMessage
              text="I've tried several times already. Can I speak to a human please?"
              time="10:45 AM"
            />
          </div>

          {/* Reply composer pinned at bottom */}
          <ReplyComposer />
        </div>

        {/* Right sidebar */}
        <div style={{
          width: isMobile ? '100%' : 304, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: isMobile ? 'visible' : 'auto',
          paddingBottom: isMobile ? 32 : 32,
          marginTop: isMobile ? 16 : 0,
        }}>
          <RightSidebar />
        </div>
      </div>
    </div>
  )
}
