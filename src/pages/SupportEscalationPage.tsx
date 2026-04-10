/**
 * Screen 14 — Inbox: Escalation Modal + Post-Escalation State
 * Conversation detail with escalation modal overlay, and post-escalation thread view.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  UserCircleIcon,
  XMarkIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, StarIcon } from '@heroicons/react/24/solid'
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
const PROFILE_BG   = 'rgba(232,234,240,0.5)'
const GREEN        = '#059669'
const AMBER        = '#D97706'
const AMBER_BG     = 'rgba(254,243,199,0.8)'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const RED_BORDER   = '#FECACA'

type Priority = 'low' | 'medium' | 'high' | 'urgent'

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low',    color: GREEN,   bg: 'rgba(209,250,229,0.7)' },
  medium: { label: 'Medium', color: AMBER,   bg: AMBER_BG },
  high:   { label: 'High',   color: '#EA580C', bg: 'rgba(255,237,213,0.7)' },
  urgent: { label: 'Urgent', color: RED,     bg: RED_LIGHT },
}

// ── Customer message ───────────────────────────────────────────────────────────
function CustomerMessage({ text, time, initials = 'DR', avatarColor = '#818CF8' }: {
  text: string; time: string; initials?: string; avatarColor?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9999, background: avatarColor,
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>{initials}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{ background: WHITE, borderRadius: '0px 16px 16px 16px', boxShadow: NEU_SHADOW, padding: '15px 16px' }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>{text}</p>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, paddingLeft: 4 }}>{time}</span>
      </div>
    </div>
  )
}

// ── AI message ─────────────────────────────────────────────────────────────────
function AIMessage({ text, time }: { text: string; time: string }) {
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
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY }}>
              Lira AI Agent
            </span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>{text}</p>
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

// ── Escalation banner (post-escalation state) ──────────────────────────────────
function EscalationBanner() {
  return (
    <div style={{
      background: RED_LIGHT, border: `1px solid ${RED_BORDER}`, borderRadius: 16,
      padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <ExclamationCircleIcon style={{ width: 20, height: 20, color: RED, flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: RED }}>
          Escalated to Sarah K. · Priority: High · Ticket #4832
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: '#7F1D1D' }}>
          Customer notified — "A specialist will follow up within 2 hours."
        </span>
      </div>
    </div>
  )
}

// ── Escalation Modal ───────────────────────────────────────────────────────────
function EscalationModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => void
}) {
  const [priority, setPriority] = useState<Priority>('high')
  const [notifyCustomer, setNotifyCustomer] = useState(true)
  const [notifySlack, setNotifySlack] = useState(true)

  return (
    /* Backdrop */
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      background: 'rgba(46,48,64,0.45)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      {/* Modal card */}
      <div style={{
        width: '100%', maxWidth: 540,
        background: BG, boxShadow: `${NEU_SHADOW}, 0 32px 64px rgba(0,0,0,0.18)`,
        borderRadius: 28,
        display: 'flex', flexDirection: 'column', gap: 0,
        overflow: 'hidden',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '22px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9999, background: RED_LIGHT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <UserCircleIcon style={{ width: 18, height: 18, color: RED }} />
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: DARK }}>
              Escalate Conversation
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 9999,
              background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <XMarkIcon style={{ width: 16, height: 16, color: MUTED }} />
          </button>
        </div>

        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* AI summary card */}
          <div style={{
            background: AI_BG, border: `1px solid ${AI_BORDER}`,
            borderRadius: 16, padding: '14px 16px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <SparklesIcon style={{ width: 12, height: 12, color: PRIMARY }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY }}>
                AI Summary
              </span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, lineHeight: '1.55em', color: DARK, margin: 0 }}>
              Customer Daniel Roy has a $2,400 transfer pending for 3 days. Transaction is on a compliance hold (CH-4401). Lira created Linear ticket #4832 and notified #compliance-team.
            </p>
          </div>

          {/* Assign to */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>Assign to</span>
            <div style={{ position: 'relative' }}>
              <select style={{
                fontFamily: FONT, fontWeight: 400, fontSize: 14, color: DARK,
                background: BG, boxShadow: NEU_INSET, borderRadius: 14,
                border: 'none', outline: 'none',
                padding: '12px 40px 12px 16px', width: '100%',
                appearance: 'none', cursor: 'pointer',
              }}>
                <option>Sarah K. — Senior Support Lead</option>
                <option>Marcus W. — Compliance Specialist</option>
                <option>Ana P. — Account Manager</option>
              </select>
              <ChevronDownIcon style={{
                width: 16, height: 16, color: MUTED,
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          {/* Notify via Slack */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>
                Notify via Slack
              </span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
                #support-escalations
              </span>
            </div>
            <button
              onClick={() => setNotifySlack(v => !v)}
              style={{
                width: 44, height: 24, borderRadius: 9999,
                background: notifySlack ? PRIMARY : 'rgba(88,90,104,0.25)',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                padding: '0 3px',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 9999, background: WHITE,
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                transform: notifySlack ? 'translateX(20px)' : 'translateX(0)',
                transition: 'transform 0.2s',
              }} />
            </button>
          </div>

          {/* Priority */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>Priority</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map(p => {
                const cfg = PRIORITY_CONFIG[p]
                const active = priority === p
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      fontFamily: FONT, fontWeight: 600, fontSize: 12,
                      color: active ? cfg.color : MUTED,
                      background: active ? cfg.bg : 'transparent',
                      boxShadow: active ? NEU_INSET : 'none',
                      border: active ? `1px solid ${cfg.color}22` : '1px solid transparent',
                      borderRadius: 10, padding: '7px 12px', cursor: 'pointer',
                      flex: 1,
                    }}
                  >
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Agent note */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>Note for agent</span>
            <textarea
              defaultValue="Customer has been waiting 3 days for a $2,400 transfer. Transaction is on compliance hold (CH-4401). Linear ticket created: #4832. CRM record updated in HubSpot."
              rows={4}
              style={{
                fontFamily: FONT, fontWeight: 400, fontSize: 13, color: DARK,
                background: BG, boxShadow: NEU_INSET, borderRadius: 14,
                border: 'none', outline: 'none', padding: '12px 16px',
                resize: 'vertical', lineHeight: '1.6em',
              }}
            />
          </div>

          {/* Notify customer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <button
              onClick={() => setNotifyCustomer(v => !v)}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 2,
                background: notifyCustomer ? PRIMARY : BG,
                boxShadow: notifyCustomer ? 'none' : NEU_INSET,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {notifyCustomer && (
                <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                  <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>
                Notify customer
              </span>
              <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: '4px 0 0', lineHeight: '1.5em' }}>
                "A specialist has been assigned to your case and will follow up within 2 hours."
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: 14, color: WHITE,
                background: RED, border: 'none', borderRadius: 16, padding: '14px 0',
                cursor: 'pointer',
              }}
            >
              Escalate →
            </button>
            <button
              onClick={onClose}
              style={{
                fontFamily: FONT, fontWeight: 600, fontSize: 14, color: MUTED,
                background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 16,
                padding: '14px 24px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Right sidebar ──────────────────────────────────────────────────────────────
function RightSidebar({ escalated }: { escalated: boolean }) {
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

        <div style={{ background: PROFILE_BG, borderRadius: 16, padding: '17px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Customer', value: 'Daniel Roy' },
            { label: 'Tier', value: 'Enterprise', pill: true },
            { label: 'Churn Risk', value: 'Medium', risk: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{row.label}</span>
              {row.pill ? (
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY_DARK, background: '#E0E7FF', borderRadius: 9999, padding: '2px 10px' }}>{row.value}</span>
              ) : row.risk ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheckIcon style={{ width: 13, height: 13, color: AMBER }} />
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: AMBER }}>{row.value}</span>
                </div>
              ) : (
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>{row.value}</span>
              )}
            </div>
          ))}
        </div>

        {escalated && (
          <div style={{
            background: RED_LIGHT, border: `1px solid ${RED_BORDER}`,
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: RED }}>Assigned Agent</span>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>Sarah K.</span>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Senior Support Lead · High priority</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Elapsed', value: '3d', color: RED },
            { label: 'Channel', value: 'Email', icon: EnvelopeIcon, color: DARK },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.icon && <s.icon style={{ width: 14, height: 14, color: MUTED }} />}
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Knowledge Used</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['HubSpot CRM', 'Compliance_Policy'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '6px 12px' }}>
                <DocumentTextIcon style={{ width: 12, height: 12, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function SupportEscalationPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [modalOpen, setModalOpen] = useState(true)
  const [escalated, setEscalated] = useState(false)

  function handleConfirm() {
    setModalOpen(false)
    setEscalated(true)
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden', position: 'relative',
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
            width: 32, height: 32, borderRadius: 9999, background: '#F472B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: NEU_SHADOW, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>DR</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 14 : 16, color: DARK }}>Daniel Roy</span>
              <span style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 10, color: escalated ? RED : AMBER,
                background: escalated ? RED_LIGHT : AMBER_BG,
                borderRadius: 9999, padding: '2px 8px', textTransform: 'uppercase',
              }}>
                {escalated ? 'Escalated' : 'Open'}
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Ticket #LRA-4832 · 3 days ago</span>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            {!escalated && (
              <button
                onClick={() => setModalOpen(true)}
                style={{
                  fontFamily: FONT, fontWeight: 600, fontSize: 14, color: RED,
                  background: BG, boxShadow: NEU_SHADOW, padding: '8px 20px', borderRadius: 24,
                  border: 'none', cursor: 'pointer',
                }}
              >
                Escalate
              </button>
            )}
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
            text="Hi, my transfer of $2,400 has been pending for 3 days. I need this resolved urgently."
            time="11:14 AM · Email"
          />
          <AIMessage
            text="Hello Daniel! I've checked your account and found your transfer (TXN #48291) is on a compliance hold (code CH-4401). I've created a priority ticket and notified the compliance team. I'm now escalating this to a human specialist."
            time="11:14 AM"
          />
          {escalated && <EscalationBanner />}
        </div>

        {/* Right sidebar */}
        <div style={{
          width: isMobile ? '100%' : 304, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: isMobile ? 'visible' : 'auto',
        }}>
          <RightSidebar escalated={escalated} />
        </div>
      </div>

      {/* Modal overlay */}
      {modalOpen && (
        <EscalationModal onClose={() => setModalOpen(false)} onConfirm={handleConfirm} />
      )}
    </div>
  )
}
