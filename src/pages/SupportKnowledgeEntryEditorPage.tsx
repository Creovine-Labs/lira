/**
 * Screens 31 & 32 — Knowledge Base: Entry Editor
 *   - Review/Edit mode: Pre-filled with AI draft (route: /support/knowledge/drafts/:id/edit)
 *   - Manual mode:      Blank editor with "Who is this for?" section (route: /support/knowledge/new)
 */

import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ChevronLeftIcon,
  SparklesIcon as SparklesOutlineIcon,
  XMarkIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
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
const GREEN_BG     = 'rgba(209,250,229,0.8)'
const AMBER        = '#D97706'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Mock draft data (same dataset as DraftQueuePage — in real app, shared store) ──
const DRAFT_DATA: Record<string, { title: string; body: string; tags: string[]; confidence: number; sourceConversations: number; contextDocs: string[] }> = {
  'dr1': {
    title: 'What to do when API error code 4023 occurs',
    body: 'API error code 4023 indicates that the request exceeded the rate limit for your current subscription tier. To resolve this issue:\n\n1. Check your current API usage in the dashboard under Settings → Usage.\n2. If you are hitting limits during peak hours, consider implementing exponential backoff in your integration code.\n3. For sustained high volumes, you can request a higher rate limit from our support team.\n4. The limit resets every 60 seconds. Waiting 60 seconds and retrying is usually sufficient.',
    tags: ['Technical'],
    confidence: 91,
    sourceConversations: 3,
    contextDocs: ['API Error Code Reference', 'Rate Limiting Policy', 'Developer Quickstart'],
  },
  'dr2': {
    title: 'International wire transfer limits by country',
    body: 'International wire transfers are subject to country-specific limits based on regulatory requirements. Standard limits are:\n\n- EU/EEA: up to €50,000 per transaction\n- USA: up to $25,000 per transaction\n- UK: up to £40,000 per transaction\n- Other countries: contact support for your specific country\n\nTransactions above the reporting threshold require additional documentation.',
    tags: ['Billing', 'Compliance'],
    confidence: 87,
    sourceConversations: 7,
    contextDocs: ['Billing FAQ', 'Compliance Guidelines'],
  },
  'dr3': {
    title: 'KYC document requirements for non-EU residents',
    body: 'For non-EU residents, the following documents are required for KYC verification:\n\n**Government-issued photo ID (one of):**\n- Passport (all countries accepted)\n- National ID card (selected countries)\n- Driver\'s license\n\n**Proof of address (issued within 90 days):**\n- Bank statement\n- Utility bill\n- Government correspondence',
    tags: ['Compliance', 'Onboarding'],
    confidence: 94,
    sourceConversations: 5,
    contextDocs: ['KYC Verification Requirements', 'Onboarding Checklist'],
  },
}

const ALL_TAGS = ['Billing', 'Compliance', 'Technical', 'Onboarding', 'Product', 'Other']
const TIER_OPTIONS = ['All customers', 'Standard', 'VIP', 'Enterprise']
const PRODUCT_AREA_OPTIONS = ['Payments', 'KYC & Compliance', 'Subscriptions', 'API & Integrations', 'Account Management', 'Onboarding']

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'Billing':    { bg: AI_BG,      color: PRIMARY },
  'Compliance': { bg: RED_LIGHT,  color: RED },
  'Technical':  { bg: 'rgba(234,243,199,0.8)', color: '#65a30d' },
  'Onboarding': { bg: GREEN_BG,   color: GREEN },
  'Product':    { bg: 'rgba(237,233,254,0.8)', color: '#7c3aed' },
  'Other':      { bg: PROFILE_BG, color: MUTED },
}

function TagBadge({ tag, removable, onRemove }: { tag: string; removable?: boolean; onRemove?: () => void }) {
  const c = TAG_COLORS[tag] ?? { bg: PROFILE_BG, color: MUTED }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 600, fontSize: 11, color: c.color, background: c.bg, borderRadius: 8, padding: '4px 10px' }}>
      {tag}
      {removable && (
        <button onClick={onRemove} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: c.color, lineHeight: 0, marginLeft: 2 }}>
          <XMarkIcon style={{ width: 10, height: 10 }} />
        </button>
      )}
    </span>
  )
}

// ── How Lira will use this — simulated chat preview ────────────────────────────
function SimulatedPreview({ title, body }: { title: string; body: string }) {
  const question = title ? `Customer: "${title.replace(/^What |^How |^Why /, '').replace(/\?$/, '')}?"` : 'Customer: "Can you help me with this?"'
  const answerPreview = body.trim().slice(0, 180) + (body.length > 180 ? '…' : '')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Customer message */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: PRIMARY, borderRadius: '16px 4px 16px 16px', padding: '10px 14px', maxWidth: '80%' }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: WHITE, margin: 0, lineHeight: '1.5em' }}>
            {question}
          </p>
        </div>
      </div>
      {/* Lira reply */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9999, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <SparklesIcon style={{ width: 13, height: 13, color: PRIMARY }} />
        </div>
        <div style={{ background: WHITE, borderRadius: '4px 16px 16px 16px', padding: '10px 14px', maxWidth: '85%', border: '1px solid rgba(0,0,0,0.06)' }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK, margin: 0, lineHeight: '1.6em', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {answerPreview || 'Start typing your entry to see a preview…'}
          </p>
          {body.length > 180 && (
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10, color: PRIMARY, marginTop: 6 }}>[Entry continues…]</div>
          )}
        </div>
      </div>
      {/* Grounding note */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 36 }}>
          <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 10, color: MUTED }}>Grounded in:</span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY, background: AI_BG, borderRadius: 6, padding: '2px 7px' }}>{title}</span>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 13, color: DARK,
  background: BG, boxShadow: NEU_INSET, border: 'none', borderRadius: 12,
  padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box',
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportKnowledgeEntryEditorPage() {
  const navigate = useNavigate()
  const { id }   = useParams<{ id?: string }>()
  const isMobile = useIsMobile()

  // Determine mode: 'review' if we have a draft id, 'manual' if /new
  const isReview = Boolean(id && DRAFT_DATA[id])
  const draft = id ? DRAFT_DATA[id] : undefined

  // Editor state
  const [title,   setTitle]   = useState(draft?.title ?? '')
  const [body,    setBody]    = useState(draft?.body  ?? '')
  const [tags,    setTags]    = useState<string[]>(draft?.tags ?? [])
  const [tagMenuOpen, setTagMenuOpen] = useState(false)

  // Manual-only: "Who is this for?"
  const [forTier,        setForTier]        = useState('All customers')
  const [forProductArea, setForProductArea] = useState<string[]>([])

  useEffect(() => {
    if (draft) {
      setTitle(draft.title)
      setBody(draft.body)
      setTags(draft.tags)
    }
  }, [id])

  function addTag(tag: string) {
    if (!tags.includes(tag)) setTags(prev => [...prev, tag])
    setTagMenuOpen(false)
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  function toggleProductArea(area: string) {
    setForProductArea(prev => prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area])
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'visible' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '16px 14px 14px' : '22px 32px 16px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(isReview ? '/support/knowledge/drafts' : '/support/knowledge')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 500, fontSize: 13, padding: 0 }}
          >
            <ChevronLeftIcon style={{ width: 14, height: 14 }} />
            {isReview ? 'AI Drafts' : 'Knowledge Base'}
          </button>
          <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isReview && <SparklesIcon style={{ width: 16, height: 16, color: PRIMARY }} />}
            <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: DARK, margin: 0 }}>
              {isReview ? 'Review & Edit Draft' : 'Write Knowledge Entry'}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate(isReview ? '/support/knowledge/drafts' : '/support/knowledge')}
            style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px' }}
          >
            Discard
          </button>
          <button
            style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '11px 18px', cursor: 'pointer' }}
          >
            Save draft
          </button>
          <button
            onClick={() => navigate('/support/knowledge')}
            style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: GREEN, border: 'none', borderRadius: 14, padding: '11px 18px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
          >
            Publish →
          </button>
        </div>
      </div>

      {/* Body: editor + preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '28px 32px 32px' }}>
        <div style={{ display: 'flex', gap: 28, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>

          {/* Left: Editor */}
          <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* AI confidence banner */}
            {isReview && draft && (
              <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 16, padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <SparklesIcon style={{ width: 14, height: 14, color: PRIMARY }} />
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: PRIMARY }}>
                    Lira is {draft.confidence}% confident this answer is correct
                  </span>
                </div>
                <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: '0 0 10px' }}>
                  Based on your existing docs and {draft.sourceConversations} escalated conversations. Lira used these documents as context:
                </p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {draft.contextDocs.map(doc => (
                    <span key={doc} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, background: WHITE, border: `1px solid ${AI_BORDER}`, borderRadius: 8, padding: '3px 9px', cursor: 'pointer' }}>
                      📄 {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source conversations chips (review mode) */}
            {isReview && draft && (
              <div>
                <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: MUTED, display: 'block', marginBottom: 8 }}>Source conversations</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Array.from({ length: draft.sourceConversations }, (_, i) => (
                    <span key={i} style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED, background: PROFILE_BG, border: '1px solid rgba(0,0,0,0.08)', borderRadius: 9, padding: '5px 12px', cursor: 'pointer' }}>
                      Conversation #{1001 + i} →
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'block', marginBottom: 8 }}>Title</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What is this knowledge entry about?"
                style={inputStyle}
              />
            </div>

            {/* Body */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'block', marginBottom: 8 }}>Content</label>
              {/* Toolbar */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                {['B', 'I', 'Link', '• List', '1. List'].map(t => (
                  <button key={t} style={{ fontFamily: FONT, fontWeight: t === 'B' ? 800 : 400, fontStyle: t === 'I' ? 'italic' : 'normal', fontSize: 12, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>{t}</button>
                ))}
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write the knowledge entry content here. Use clear, concise language that Lira can understand and quote directly to customers."
                rows={16}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7em' }}
              />
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'block', marginBottom: 8 }}>Tags</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {tags.map(t => <TagBadge key={t} tag={t} removable onRemove={() => removeTag(t)} />)}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setTagMenuOpen(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 9, padding: '6px 12px', cursor: 'pointer' }}
                  >
                    <PlusIcon style={{ width: 11, height: 11 }} /> Add tag
                  </button>
                  {tagMenuOpen && (
                    <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: WHITE, borderRadius: 12, boxShadow: NEU_SHADOW, padding: 6, minWidth: 150 }}>
                      {ALL_TAGS.filter(t => !tags.includes(t)).map(t => (
                        <button key={t} onClick={() => addTag(t)} style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK, background: 'transparent', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer' }}>{t}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Manual-only: Who is this for? */}
            {!isReview && (
              <div style={{ background: PROFILE_BG, borderRadius: 16, padding: 20, border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Who is this for? <span style={{ fontWeight: 400, color: MUTED, fontSize: 12 }}>— optional</span></div>

                <div>
                  <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 8 }}>Customer tier</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {TIER_OPTIONS.map(t => (
                      <button
                        key={t}
                        onClick={() => setForTier(t)}
                        style={{
                          fontFamily: FONT, fontWeight: 600, fontSize: 12,
                          color: forTier === t ? WHITE : MUTED,
                          background: forTier === t ? PRIMARY : 'transparent',
                          border: `1.5px solid ${forTier === t ? PRIMARY : 'rgba(88,90,104,0.2)'}`,
                          borderRadius: 9999, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 8 }}>Product area</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PRODUCT_AREA_OPTIONS.map(a => (
                      <button
                        key={a}
                        onClick={() => toggleProductArea(a)}
                        style={{
                          fontFamily: FONT, fontWeight: 600, fontSize: 12,
                          color: forProductArea.includes(a) ? WHITE : MUTED,
                          background: forProductArea.includes(a) ? PRIMARY : 'transparent',
                          border: `1.5px solid ${forProductArea.includes(a) ? PRIMARY : 'rgba(88,90,104,0.2)'}`,
                          borderRadius: 9999, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview pane */}
          <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 0 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'flex', alignItems: 'center', gap: 6 }}>
              <SparklesIcon style={{ width: 14, height: 14, color: PRIMARY }} />
              How Lira will use this
            </div>
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SimulatedPreview title={title} body={body} />
            </div>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, margin: 0, lineHeight: '1.5em' }}>
              This preview shows how Lira will respond to a customer asking about this topic. The content will be vector-indexed and used in AI-grounded replies.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
