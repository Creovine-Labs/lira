/**
 * Screen 13 — Inbox: Conversation Detail (Action Chain in Progress)
 * Same layout as Screen 12 but with a live multi-step action chain panel.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon as CheckCircleOutline,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  SparklesIcon,
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
const PROFILE_BG   = 'rgba(232,234,240,0.5)'
const GREEN        = '#059669'
const GREEN_LABEL  = '#047857'
const AMBER        = '#D97706'
const AMBER_BG     = 'rgba(254,243,199,0.6)'
const AMBER_BORDER = '#FDE68A'
const RED          = '#DC2626'

// ─ Step type ──────────────────────────────────────────────────────────────────
type StepStatus = 'done' | 'running' | 'pending' | 'approval' | 'failed'

interface ChainStep {
  id: number
  title: string
  result?: string
  status: StepStatus
}

// ── Spinner SVG ─────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      width="18" height="18" viewBox="0 0 24 24" fill="none"
      style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={PRIMARY} strokeWidth="2.5" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

// ── Step indicator icon ────────────────────────────────────────────────────────
function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done')
    return <CheckCircleIcon style={{ width: 18, height: 18, color: GREEN, flexShrink: 0 }} />
  if (status === 'running')
    return <Spinner />
  if (status === 'failed')
    return <XCircleIcon style={{ width: 18, height: 18, color: RED, flexShrink: 0 }} />
  if (status === 'approval')
    return (
      <div style={{
        width: 18, height: 18, borderRadius: 9999,
        background: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <ExclamationTriangleIcon style={{ width: 10, height: 10, color: WHITE }} />
      </div>
    )
  // pending
  return (
    <div style={{
      width: 18, height: 18, borderRadius: 9999,
      border: '2px solid rgba(88,90,104,0.4)',
      flexShrink: 0,
    }} />
  )
}

// ── Action chain panel ─────────────────────────────────────────────────────────
function ActionChainPanel({ steps, elapsed }: { steps: ChainStep[]; elapsed: number }) {
  return (
    <div style={{
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 20,
      padding: 20,
      display: 'flex', flexDirection: 'column', gap: 16,
      border: `1px solid rgba(99,102,241,0.12)`,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 9999, background: PRIMARY,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>
            Lira is working on this…
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <ClockIcon style={{ width: 13, height: 13, color: MUTED }} />
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
            Running for {elapsed}s · est. ~15s
          </span>
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, i) => (
          <div key={step.id}>
            {/* Connector line */}
            {i > 0 && (
              <div style={{
                width: 2, height: 10, marginLeft: 8,
                background: step.status === 'pending'
                  ? 'rgba(88,90,104,0.2)'
                  : step.status === 'done' ? GREEN : PRIMARY,
                borderRadius: 99,
              }} />
            )}

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 12px',
              borderRadius: 14,
              background: step.status === 'running'
                ? AI_BG
                : step.status === 'approval'
                ? AMBER_BG
                : 'transparent',
              border: step.status === 'running'
                ? `1px solid ${AI_BORDER}`
                : step.status === 'approval'
                ? `1px solid ${AMBER_BORDER}`
                : '1px solid transparent',
              opacity: step.status === 'pending' ? 0.55 : 1,
            }}>
              <div style={{ paddingTop: 1 }}>
                <StepIcon status={step.status} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{
                  fontFamily: FONT,
                  fontWeight: step.status === 'pending' ? 400 : 600,
                  fontSize: 13, color: step.status === 'approval' ? AMBER : DARK,
                }}>
                  {step.title}
                </span>
                {step.result && (
                  <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
                    {step.result}
                  </span>
                )}

                {/* Approval inline buttons */}
                {step.status === 'approval' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <button style={{
                      fontFamily: FONT, fontWeight: 600, fontSize: 12, color: WHITE,
                      background: GREEN, border: 'none', borderRadius: 10,
                      padding: '5px 14px', cursor: 'pointer',
                    }}>
                      Approve
                    </button>
                    <button style={{
                      fontFamily: FONT, fontWeight: 600, fontSize: 12, color: RED,
                      background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 10,
                      padding: '5px 14px', cursor: 'pointer',
                    }}>
                      Reject
                    </button>
                    <button style={{
                      fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED,
                      background: 'transparent', border: 'none', borderRadius: 10,
                      padding: '5px 14px', cursor: 'pointer', textDecoration: 'underline',
                    }}>
                      Modify
                    </button>
                    <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: AMBER, marginLeft: 4 }}>
                      Auto-cancels in 10 min
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Customer message bubble ────────────────────────────────────────────────────
function CustomerMessage({ text, time }: { text: string; time: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9999, background: '#818CF8',
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>DR</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 480 }}>
        <div style={{
          background: WHITE, borderRadius: '0px 16px 16px 16px',
          boxShadow: NEU_SHADOW, padding: '15px 16px',
        }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>
            {text}
          </p>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, paddingLeft: 4 }}>{time}</span>
      </div>
    </div>
  )
}

// ── AI message bubble ──────────────────────────────────────────────────────────
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
            <div style={{
              width: 24, height: 24, borderRadius: 9999, background: PRIMARY,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
            </div>
            <span style={{
              fontFamily: FONT, fontWeight: 700, fontSize: 10,
              letterSpacing: '0.05em', textTransform: 'uppercase', color: PRIMARY,
            }}>
              Lira AI Agent
            </span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, lineHeight: '1.625em', color: DARK, margin: 0 }}>
            {text}
          </p>
        </div>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED, textAlign: 'right', paddingRight: 4 }}>
          {time}
        </span>
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

// ── Right sidebar ──────────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary card */}
      <div style={{
        background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 9999, background: PRIMARY,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>
            Interaction Summary
          </span>
        </div>

        {/* Profile block */}
        <div style={{
          background: PROFILE_BG, borderRadius: 16, padding: '17px 16px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            { label: 'Customer', value: 'Daniel Roy' },
            { label: 'Tier', value: 'Enterprise', pill: true },
            { label: 'Churn Risk', value: 'Medium', risk: true },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{row.label}</span>
              {row.pill ? (
                <span style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY_DARK,
                  background: '#E0E7FF', borderRadius: 9999, padding: '2px 10px',
                }}>
                  {row.value}
                </span>
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

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Elapsed', value: '8s', icon: ClockIcon, color: PRIMARY },
            { label: 'Channel', value: 'Email', icon: EnvelopeIcon, color: DARK },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: BG, boxShadow: NEU_SHADOW,
              borderRadius: 16, padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <s.icon style={{ width: 14, height: 14, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Knowledge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>
            Knowledge Used
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['HubSpot CRM', 'Compliance_Policy'].map(l => (
              <div key={l} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '6px 12px',
              }}>
                <DocumentTextIcon style={{ width: 12, height: 12, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions card */}
      <div style={{
        background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: WHITE,
          background: '#DC2626', border: 'none', cursor: 'pointer',
          borderRadius: 16, padding: '13px 0', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Escalate to Human
        </button>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK,
          background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer',
          borderRadius: 16, padding: '13px 0', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Pause Lira
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
const INITIAL_STEPS: ChainStep[] = [
  { id: 1, title: 'Query HubSpot', result: 'Found contact: Daniel Roy, $2,400 pending transfer', status: 'done' },
  { id: 2, title: 'Check transaction status via API', result: 'Status: Compliance hold (code CH-4401)', status: 'done' },
  { id: 3, title: 'Create Linear ticket — "Compliance hold: Daniel Roy — TXN #48291"', status: 'running' },
  { id: 4, title: 'Notify Slack #compliance-team', status: 'pending' },
  { id: 5, title: 'Reply to customer', status: 'pending' },
  { id: 6, title: 'Schedule follow-up for 2 hours', status: 'pending' },
]

export function SupportConversationActionPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [steps, setSteps] = useState<ChainStep[]>(INITIAL_STEPS)
  const [elapsed, setElapsed] = useState(8)

  // Simulate chain progress
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (elapsed === 12) {
      setSteps(prev => prev.map(s =>
        s.id === 3 ? { ...s, status: 'done', result: 'Ticket #4832 created' }
          : s.id === 4 ? { ...s, status: 'running' }
          : s
      ))
    }
    if (elapsed === 16) {
      setSteps(prev => prev.map(s =>
        s.id === 4 ? { ...s, status: 'done', result: 'Notified #compliance-team' }
          : s.id === 5 ? { ...s, status: 'approval', result: 'Lira wants to initiate a $2,400 refund — awaiting approval' }
          : s
      ))
    }
  }, [elapsed])

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
          <button
            onClick={() => navigate('/support/inbox')}
            style={{
              width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <ChevronLeftIcon style={{ width: 18, height: 18, color: DARK }} />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 9999, background: '#F472B6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: NEU_SHADOW, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>DR</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 14 : 16, color: DARK }}>
                Daniel Roy
              </span>
              {/* Animated "In Progress" badge */}
              <span style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY,
                background: '#EEF2FF', borderRadius: 9999, padding: '2px 8px',
                border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <Spinner />
                In Progress
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
              Ticket #LRA-4832 · $2,400 pending transfer
            </span>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 14, color: '#DC2626',
              background: BG, boxShadow: NEU_SHADOW, padding: '8px 20px', borderRadius: 24,
              border: 'none', cursor: 'pointer',
            }}>
              Escalate
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
            <button style={{
              width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
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
        {/* Thread + action chain */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 24,
          overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4,
        }}>
          <CustomerMessage
            text="Hi, my transfer of $2,000 has been pending for 3 days now. I need this resolved urgently — this is affecting my business operations."
            time="11:14 AM · Email"
          />
          <AIMessage
            text="Hello Daniel! I've received your message and I'm looking into your transfer right now. Let me check your account details and the transaction status immediately."
            time="11:14 AM"
          />
          <CustomerMessage
            text="Please hurry, this is really urgent. I've been waiting for 3 days."
            time="11:15 AM"
          />

          {/* Action chain panel */}
          <ActionChainPanel steps={steps} elapsed={elapsed} />
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
