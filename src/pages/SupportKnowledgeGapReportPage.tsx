/**
 * Screen 33 — Knowledge Base: Gap Report
 * Shows the most common topics Lira couldn't answer this week,
 * coverage metrics, and lets admins trigger AI drafts on demand.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid'
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
const AMBER_BORDER = '#FDE68A'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const RED_BORDER   = '#FECACA'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
type GapStatus = 'draft-pending' | 'no-draft' | 'approved'

interface GapItem {
  id: string
  topic: string
  timesAsked: number
  status: GapStatus
  draftId?: string
  sampleConversations: { id: string; customer: string; summary: string; date: string }[]
}

const GAPS: GapItem[] = [
  {
    id: 'g1', topic: 'API error code 4023', timesAsked: 11, status: 'draft-pending', draftId: 'dr1',
    sampleConversations: [
      { id: 'c1', customer: 'Jana Fischer',  summary: '"Getting error 4023 when calling /transactions endpoint — what does it mean?"', date: 'Apr 8' },
      { id: 'c2', customer: 'Luca Ferreira', summary: '"API keeps returning 4023, is this a rate limit?"', date: 'Apr 7' },
      { id: 'c3', customer: 'Sven Larsson',  summary: '"Intermittent 4023 errors on high-volume days"', date: 'Apr 6' },
    ],
  },
  {
    id: 'g2', topic: 'International wire transfer limits', timesAsked: 7, status: 'no-draft',
    sampleConversations: [
      { id: 'c4', customer: 'Amara Diallo',  summary: '"What is the maximum I can send to a US bank account?"', date: 'Apr 8' },
      { id: 'c5', customer: 'Yuki Tanaka',   summary: '"Are there different limits for different countries?"', date: 'Apr 7' },
      { id: 'c6', customer: 'Omar Hassan',   summary: '"Transfer was rejected — is there a daily limit?"', date: 'Apr 5' },
    ],
  },
  {
    id: 'g3', topic: 'KYC requirements for non-EU residents', timesAsked: 5, status: 'draft-pending', draftId: 'dr3',
    sampleConversations: [
      { id: 'c7', customer: 'Chen Wei',      summary: '"I\'m from Singapore — what documents do I need for KYC?"', date: 'Apr 7' },
      { id: 'c8', customer: 'Nia Osei',      summary: '"Driver\'s license not accepted — what ID can I use?"', date: 'Apr 6' },
    ],
  },
  {
    id: 'g4', topic: 'Subscription downgrade process', timesAsked: 4, status: 'no-draft',
    sampleConversations: [
      { id: 'c9', customer: 'Jana Fischer',  summary: '"How do I downgrade from Enterprise to Standard?"', date: 'Apr 8' },
      { id: 'c10', customer: 'Sven Larsson', summary: '"Will I lose my data if I downgrade plans?"', date: 'Apr 6' },
    ],
  },
  {
    id: 'g5', topic: 'Two-factor authentication recovery codes', timesAsked: 3, status: 'draft-pending', draftId: 'dr7',
    sampleConversations: [
      { id: 'c11', customer: 'Amara Diallo',  summary: '"Lost my 2FA device — how do I log in?"', date: 'Apr 7' },
      { id: 'c12', customer: 'Luca Ferreira', summary: '"Where are my recovery codes stored?"', date: 'Apr 5' },
    ],
  },
  {
    id: 'g6', topic: 'GDPR data export / right to erasure', timesAsked: 3, status: 'no-draft',
    sampleConversations: [
      { id: 'c13', customer: 'Jana Fischer',  summary: '"How do I download all my data under GDPR?"', date: 'Apr 6' },
      { id: 'c14', customer: 'Yuki Tanaka',   summary: '"I want to delete my account and all associated data"', date: 'Apr 5' },
    ],
  },
  {
    id: 'g7', topic: 'Webhook signature verification', timesAsked: 2, status: 'no-draft',
    sampleConversations: [
      { id: 'c15', customer: 'Omar Hassan',   summary: '"How do I verify the webhook payload is from Lira?"', date: 'Apr 7' },
      { id: 'c16', customer: 'Chen Wei',      summary: '"Webhook HMAC signature validation failing"', date: 'Apr 6' },
    ],
  },
]

// ── Status badge for gap table ─────────────────────────────────────────────────
function GapStatusBadge({ status }: { status: GapStatus }) {
  if (status === 'draft-pending') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 700, fontSize: 11, color: AMBER, background: AMBER_BG, borderRadius: 8, padding: '3px 9px' }}>
      <SparklesIcon style={{ width: 11, height: 11 }} /> Draft pending review
    </span>
  )
  if (status === 'approved') return (
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: GREEN, background: GREEN_BG, borderRadius: 8, padding: '3px 9px' }}>✓ Published</span>
  )
  return (
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: RED, background: RED_LIGHT, borderRadius: 8, padding: '3px 9px' }}>No draft yet</span>
  )
}

// ── Conversation panel ──────────────────────────────────────────────────────────
function ConversationPanel({ gap, onClose, onDraft }: { gap: GapItem; onClose: () => void; onDraft: () => void }) {
  return (
    <div style={{ width: 340, flexShrink: 0, background: BG, borderLeft: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Panel header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: DARK, lineHeight: '1.3em', marginBottom: 4 }}>{gap.topic}</div>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>Asked {gap.timesAsked}× this week</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 4, flexShrink: 0 }}>
          <XMarkIcon style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Conversations */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>Conversations that triggered this gap</div>
        {gap.sampleConversations.map(c => (
          <div key={c.id} style={{ background: WHITE, borderRadius: 14, padding: '12px 16px', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>{c.customer}</span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{c.date}</span>
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: 0, lineHeight: '1.5em' }}>{c.summary}</p>
            <button style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowTopRightOnSquareIcon style={{ width: 11, height: 11 }} /> Open conversation
            </button>
          </div>
        ))}
      </div>

      {/* Action */}
      <div style={{ padding: '4px 20px 24px' }}>
        {gap.status === 'draft-pending' ? (
          <button
            style={{ width: '100%', fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: AMBER, border: 'none', borderRadius: 14, padding: '12px 0', cursor: 'pointer' }}
          >
            Review draft →
          </button>
        ) : gap.status === 'no-draft' ? (
          <button
            onClick={onDraft}
            style={{ width: '100%', fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 14, padding: '12px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
          >
            <SparklesIcon style={{ width: 14, height: 14 }} /> Ask Lira to draft this →
          </button>
        ) : null}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportKnowledgeGapReportPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [gaps, setGaps]           = useState(GAPS)
  const [selectedGap, setSelected] = useState<GapItem | null>(null)
  const [drafting, setDrafting]   = useState<Set<string>>(new Set())

  const coverageRate    = 84
  const uncoveredRate   = 100 - coverageRate
  const topTopic        = gaps[0]
  const noDraftCount    = gaps.filter(g => g.status === 'no-draft').length
  const pendingCount    = gaps.filter(g => g.status === 'draft-pending').length

  function requestDraft(gapId: string) {
    setDrafting(prev => new Set([...prev, gapId]))
    setTimeout(() => {
      setGaps(prev => prev.map(g => g.id === gapId ? { ...g, status: 'draft-pending' } : g))
      setDrafting(prev => { const n = new Set(prev); n.delete(gapId); return n })
    }, 1800)
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '18px 14px 14px' : '24px 32px 18px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Title row + nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChartBarIcon style={{ width: 20, height: 20, color: PRIMARY }} />
            </div>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: DARK, margin: 0 }}>Knowledge Gap Report</h1>
              <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: '2px 0 0' }}>Topics Lira couldn't answer this week</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Library', path: '/support/knowledge' },
              { label: 'AI Drafts', path: '/support/knowledge/drafts', badge: pendingCount.toString() },
              { label: 'Gap Report', path: '/support/knowledge/gaps' },
            ].map(tab => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 12,
                  color: tab.label === 'Gap Report' ? PRIMARY : MUTED,
                  background: tab.label === 'Gap Report' ? AI_BG : 'transparent',
                  border: `1.5px solid ${tab.label === 'Gap Report' ? AI_BORDER : 'transparent'}`,
                  borderRadius: 12, padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.label}
                {tab.badge && Number(tab.badge) > 0 && (
                  <span style={{ background: PRIMARY, color: WHITE, borderRadius: 9999, fontSize: 10, fontWeight: 800, padding: '1px 6px' }}>{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {/* Coverage donut card */}
          <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 18, flex: '0 0 auto' }}>
            {/* Simple ring visual */}
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="24" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="8" />
                <circle
                  cx="32" cy="32" r="24" fill="none"
                  stroke={GREEN} strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 24 * coverageRate / 100} ${2 * Math.PI * 24}`}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 13, color: DARK }}>{coverageRate}%</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 15, color: DARK }}>Knowledge coverage</div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: GREEN, marginTop: 2 }}>{coverageRate}% of questions answered</div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: RED, marginTop: 1 }}>{uncoveredRate}% had no matching knowledge</div>
            </div>
          </div>

          {/* Stat cards */}
          {[
            { label: 'Top gap this week', value: topTopic.topic, sub: `Asked ${topTopic.timesAsked}×`, color: AMBER, bg: AMBER_BG  },
            { label: 'New gaps identified', value: noDraftCount.toString(), sub: 'no draft yet', color: RED, bg: RED_LIGHT },
            { label: 'Drafts pending review', value: pendingCount.toString(), sub: 'ready in AI Draft Queue', color: PRIMARY, bg: AI_BG },
          ].map(s => (
            <div key={s.label} style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px' }}>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: s.value.length > 4 ? 14 : 26, color: s.color, lineHeight: '1.2em' }}>{s.value}</div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Body: table + side panel */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Gap table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Top Knowledge Gaps This Week</div>

          <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', background: PROFILE_BG }}>
                  {['Rank', 'Topic', 'Times Asked', 'Knowledge Status', 'Action'].map(h => (
                    <th key={h} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, textAlign: 'left', padding: '10px 16px', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gaps.map((gap, i) => {
                  const isSelected = selectedGap?.id === gap.id
                  const isDrafting = drafting.has(gap.id)
                  return (
                    <tr
                      key={gap.id}
                      onClick={() => setSelected(isSelected ? null : gap)}
                      style={{
                        borderBottom: '1px solid rgba(0,0,0,0.04)',
                        background: isSelected ? AI_BG : i % 2 === 0 ? 'transparent' : PROFILE_BG,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = AI_BG }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : PROFILE_BG }}
                    >
                      {/* Rank */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: i === 0 ? AMBER_BG : i === 1 ? PROFILE_BG : PROFILE_BG,
                          fontFamily: FONT, fontWeight: 800, fontSize: 13,
                          color: i === 0 ? AMBER : i === 1 ? MUTED : MUTED,
                        }}>
                          {i + 1}
                        </div>
                      </td>

                      {/* Topic */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>{gap.topic}</span>
                      </td>

                      {/* Times asked */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: i === 0 ? AMBER : DARK }}>{gap.timesAsked}×</span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <GapStatusBadge status={gap.status} />
                      </td>

                      {/* Action */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {gap.status === 'draft-pending' && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate('/support/knowledge/drafts') }}
                              style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: AMBER, background: AMBER_BG, border: `1px solid ${AMBER_BORDER}`, borderRadius: 9, padding: '5px 10px', cursor: 'pointer' }}
                            >
                              Review draft →
                            </button>
                          )}
                          {gap.status === 'no-draft' && !isDrafting && (
                            <button
                              onClick={e => { e.stopPropagation(); requestDraft(gap.id) }}
                              style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                            >
                              <SparklesIcon style={{ width: 11, height: 11 }} /> Ask Lira to draft
                            </button>
                          )}
                          {isDrafting && (
                            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ display: 'inline-block', width: 11, height: 11, border: `2px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: 9999, animation: 'spin 0.8s linear infinite' }} />
                              Drafting…
                            </span>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setSelected(isSelected ? null : gap) }}
                            style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 9, padding: '5px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                          >
                            <ChevronRightIcon style={{ width: 11, height: 11, transform: isSelected ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                            View chats
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Improvement tip */}
          <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 20, padding: '18px 22px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <SparklesIcon style={{ width: 20, height: 20, color: PRIMARY, flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, marginBottom: 6 }}>Weekly improvement target</div>
              <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED, margin: '0 0 12px', lineHeight: '1.5em' }}>
                Publishing {noDraftCount} knowledge entries for the top gaps above would increase Lira's coverage rate from <strong style={{ color: DARK }}>{coverageRate}%</strong> to an estimated <strong style={{ color: GREEN }}>~{Math.min(100, coverageRate + noDraftCount * 2)}%</strong>.
              </p>
              <button
                onClick={() => navigate('/support/knowledge/drafts')}
                style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 12, padding: '10px 18px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
              >
                Review AI drafts → ({pendingCount} pending)
              </button>
            </div>
          </div>
        </div>

        {/* Conversation detail panel */}
        {selectedGap && !isMobile && (
          <ConversationPanel
            gap={selectedGap}
            onClose={() => setSelected(null)}
            onDraft={() => requestDraft(selectedGap.id)}
          />
        )}
      </div>

      {/* Mobile drawer */}
      {selectedGap && isMobile && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background: BG, borderRadius: '20px 20px 0 0', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <ConversationPanel
              gap={selectedGap}
              onClose={() => setSelected(null)}
              onDraft={() => requestDraft(selectedGap.id)}
            />
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
