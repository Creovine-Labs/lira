/**
 * Screen 30 — Knowledge Base: AI Draft Queue
 * Lira auto-drafts knowledge entries from escalated conversations. Admins review here.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SparklesIcon as SparklesOutlineIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
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
const GREEN_DARK   = '#047857'
const AMBER        = '#D97706'
const AMBER_BG     = 'rgba(254,243,199,0.8)'
const AMBER_BORDER = '#FDE68A'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
interface DraftEntry {
  id: string
  title: string
  body: string
  reason: string
  sourceConversations: number
  tags: string[]
  confidence: number
}

const INITIAL_DRAFTS: DraftEntry[] = [
  {
    id: 'dr1',
    title: 'What to do when API error code 4023 occurs',
    body: 'API error code 4023 indicates that the request exceeded the rate limit for your current subscription tier. To resolve this issue:\n\n1. Check your current API usage in the dashboard under Settings → Usage.\n2. If you are hitting limits during peak hours, consider implementing exponential backoff in your integration code.\n3. For sustained high volumes, you can request a higher rate limit from our support team.\n4. The limit resets every 60 seconds. Waiting 60 seconds and retrying is usually sufficient.',
    reason: 'Escalated 3 times in the last 7 days — customers ask about this but it\'s not in your docs',
    sourceConversations: 3,
    tags: ['Technical'],
    confidence: 91,
  },
  {
    id: 'dr2',
    title: 'International wire transfer limits by country',
    body: 'International wire transfers are subject to country-specific limits based on regulatory requirements. Standard limits are:\n\n- EU/EEA countries: up to €50,000 per transaction, up to €200,000 per month\n- USA: up to $25,000 per transaction, $100,000 per month (FinCEN reporting applies above $10,000)\n- UK: up to £40,000 per transaction\n- Other countries: limits vary — contact support for your specific country\n\nNote: Transactions above the reporting threshold require additional documentation.',
    reason: 'Escalated 7 times in the last 14 days — most common unanswered question this week',
    sourceConversations: 7,
    tags: ['Billing', 'Compliance'],
    confidence: 87,
  },
  {
    id: 'dr3',
    title: 'KYC document requirements for non-EU residents',
    body: 'For non-EU residents, the following documents are required for KYC verification:\n\n**Government-issued photo ID (one of):**\n- Passport (all countries accepted)\n- National ID card (selected countries)\n- Driver\'s license (must show full name and date of birth)\n\n**Proof of address (issued within 90 days):**\n- Bank statement\n- Utility bill\n- Government correspondence\n\nDocuments must be in English or accompanied by a certified translation.',
    reason: 'Escalated 5 times with no existing documentation covering non-EU KYC requirements',
    sourceConversations: 5,
    tags: ['Compliance', 'Onboarding'],
    confidence: 94,
  },
  {
    id: 'dr4',
    title: 'How to retry a failed payment through the dashboard',
    body: 'If a payment fails, you can retry it directly from your dashboard without contacting support:\n\n1. Navigate to Payments → Recent transactions\n2. Find the failed transaction (marked with a red ✗)\n3. Click "View details"\n4. Click "Retry payment"\n5. If your card details have changed, you will be prompted to update them first\n\nNote: Payments can be retried up to 3 times within 7 days of the original failure. After that, a new payment must be initiated.',
    reason: 'High volume of "how do I retry" questions — 4 escalations this week',
    sourceConversations: 4,
    tags: ['Billing'],
    confidence: 96,
  },
  {
    id: 'dr5',
    title: 'Account suspension: causes and reactivation steps',
    body: 'Accounts may be suspended for one of the following reasons:\n\n- Outstanding balance unpaid for more than 30 days\n- KYC verification expired and not renewed\n- Suspected fraudulent activity (pending review)\n- Violation of the Acceptable Use Policy\n\nTo reactivate a suspended account, contact support with your account ID and reason for reactivation.',
    reason: '2 escalations — customers confused about why their account is suspended and how to fix it',
    sourceConversations: 2,
    tags: ['Compliance', 'Billing'],
    confidence: 82,
  },
  {
    id: 'dr6',
    title: 'How Lira handles sensitive data in voice calls',
    body: 'Lira\'s voice AI is designed with security and privacy first:\n\n- Call recordings are encrypted at rest using AES-256\n- Transcripts are stored in your organization\'s isolated DynamoDB partition\n- PII (card numbers, account numbers, SSNs) is automatically masked in transcripts\n- Recordings are automatically deleted after the retention period set in your Settings\n- You can disable call recording entirely in Settings → Privacy\n\nFor SOC 2 and GDPR compliance documentation, contact your account manager.',
    reason: '3 customer inquiries about data privacy and GDPR, no existing doc covering voice data',
    sourceConversations: 3,
    tags: ['Compliance', 'Technical'],
    confidence: 88,
  },
  {
    id: 'dr7',
    title: 'Setting up two-factor authentication (2FA) on your account',
    body: 'Two-factor authentication adds an extra layer of security to your Lira account.\n\nTo enable 2FA:\n1. Go to Settings → Security\n2. Click "Enable 2FA"\n3. Scan the QR code with an authenticator app (Google Authenticator, Authy, or similar)\n4. Enter the 6-digit code to confirm setup\n5. Save your backup codes in a secure location\n\n2FA is mandatory for all admin-level accounts. Standard accounts can opt in.',
    reason: '2 escalated tickets asking how to enable 2FA — common onboarding question',
    sourceConversations: 2,
    tags: ['Technical', 'Onboarding'],
    confidence: 97,
  },
]

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  'Billing':    { bg: AI_BG,         color: PRIMARY },
  'Compliance': { bg: RED_LIGHT,    color: RED },
  'Technical':  { bg: 'rgba(234,243,199,0.8)', color: '#65a30d' },
  'Onboarding': { bg: GREEN_BG,     color: GREEN },
  'Product':    { bg: 'rgba(237,233,254,0.8)', color: '#7c3aed' },
}

function TagBadge({ tag }: { tag: string }) {
  const c = TAG_COLORS[tag] ?? { bg: PROFILE_BG, color: MUTED }
  return <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10, color: c.color, background: c.bg, borderRadius: 6, padding: '2px 7px' }}>{tag}</span>
}

function ConfidenceBadge({ value }: { value: number }) {
  const color = value >= 90 ? GREEN : value >= 80 ? AMBER : RED
  const bg    = value >= 90 ? GREEN_BG : value >= 80 ? AMBER_BG : RED_LIGHT
  return (
    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color, background: bg, borderRadius: 8, padding: '3px 9px' }}>
      {value}% confident
    </span>
  )
}

// ── Draft card ─────────────────────────────────────────────────────────────────
function DraftCard({
  draft,
  onApprove,
  onEdit,
  onReject,
}: {
  draft: DraftEntry
  onApprove: () => void
  onEdit: () => void
  onReject: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const previewLines = draft.body.split('\n').slice(0, 3).join('\n')
  const hasMore = draft.body.split('\n').length > 3

  return (
    <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 15, color: DARK, lineHeight: '1.3em', marginBottom: 8 }}>{draft.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <ConfidenceBadge value={draft.confidence} />
              {draft.tags.map(t => <TagBadge key={t} tag={t} />)}
            </div>
          </div>
        </div>

        {/* Draft body */}
        <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <SparklesIcon style={{ width: 12, height: 12, color: PRIMARY }} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: PRIMARY }}>AI draft</span>
          </div>
          <pre style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12.5, color: DARK, whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.7em', wordBreak: 'break-word' }}>
            {expanded ? draft.body : previewLines + (hasMore && !expanded ? '…' : '')}
          </pre>
          {hasMore && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {expanded ? <><ChevronUpIcon style={{ width: 12, height: 12 }} /> Show less</> : <><ChevronDownIcon style={{ width: 12, height: 12 }} /> Read more</>}
            </button>
          )}
        </div>

        {/* Reason + source */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: AMBER_BG, border: `1px solid ${AMBER_BORDER}`, borderRadius: 12, padding: '10px 14px' }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: AMBER }}>
              <strong style={{ fontWeight: 700 }}>Why Lira drafted this: </strong>
              {draft.reason}
            </span>
          </div>
          <button style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: PRIMARY, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowTopRightOnSquareIcon style={{ width: 12, height: 12 }} />
            [{draft.sourceConversations} conversation{draft.sourceConversations !== 1 ? 's' : ''}] → View source chats
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', padding: '14px 22px', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE,
            background: GREEN, border: 'none', borderRadius: 14, padding: '12px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            boxShadow: '0 4px 14px rgba(5,150,105,0.35)',
          }}
        >
          <CheckIcon style={{ width: 14, height: 14 }} /> Approve & Publish
        </button>
        <button
          onClick={onEdit}
          style={{
            flex: 1, fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK,
            background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '12px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <PencilIcon style={{ width: 14, height: 14 }} /> Edit then Publish
        </button>
        <button
          onClick={onReject}
          style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 13, color: MUTED,
            background: PROFILE_BG, border: '1.5px solid rgba(88,90,104,0.2)', borderRadius: 14, padding: '12px 18px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <XMarkIcon style={{ width: 14, height: 14 }} /> Reject
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportKnowledgeDraftQueuePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [drafts, setDrafts] = useState(INITIAL_DRAFTS)
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set())

  function approveDraft(id: string) {
    setApprovedIds(prev => new Set([...prev, id]))
    setTimeout(() => setDrafts(prev => prev.filter(d => d.id !== id)), 600)
  }

  function rejectDraft(id: string) {
    setDrafts(prev => prev.filter(d => d.id !== id))
  }

  function approveAllHighConf() {
    const highConf = drafts.filter(d => d.confidence >= 90)
    highConf.forEach(d => {
      setApprovedIds(prev => new Set([...prev, d.id]))
    })
    setTimeout(() => setDrafts(prev => prev.filter(d => d.confidence < 90)), 600)
  }

  const highConfCount = drafts.filter(d => d.confidence >= 90).length

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
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Nav tabs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon style={{ width: 20, height: 20, color: PRIMARY }} />
            </div>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: DARK, margin: 0 }}>
                AI-Drafted Knowledge Entries
                {drafts.length > 0 && (
                  <span style={{ marginLeft: 10, background: PRIMARY, color: WHITE, borderRadius: 9999, fontSize: 13, fontWeight: 800, padding: '2px 10px', verticalAlign: 'middle' }}>
                    {drafts.length} pending
                  </span>
                )}
              </h1>
              <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: '2px 0 0' }}>
                After Lira couldn't answer a question, she drafted these entries. Review takes about 30 seconds per entry.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {[
              { label: 'Library', path: '/support/knowledge' },
              { label: 'AI Drafts', path: '/support/knowledge/drafts', badge: drafts.length.toString() },
              { label: 'Gap Report', path: '/support/knowledge/gaps' },
            ].map(tab => (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 12,
                  color: tab.label === 'AI Drafts' ? PRIMARY : MUTED,
                  background: tab.label === 'AI Drafts' ? AI_BG : 'transparent',
                  border: `1.5px solid ${tab.label === 'AI Drafts' ? AI_BORDER : 'transparent'}`,
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

        {/* Batch action */}
        {highConfCount > 0 && (
          <div style={{ background: GREEN_BG, border: `1px solid rgba(166,255,196,0.6)`, borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircleIcon style={{ width: 18, height: 18, color: GREEN }} />
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: GREEN }}>
                {highConfCount} draft{highConfCount !== 1 ? 's' : ''} have 90%+ confidence and are ready to publish
              </span>
            </div>
            <button
              onClick={approveAllHighConf}
              style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: WHITE, background: GREEN, border: 'none', borderRadius: 12, padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Approve all with 90%+ confidence →
            </button>
          </div>
        )}
      </div>

      {/* Draft cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {drafts.map(draft => (
          <DraftCard
            key={draft.id}
            draft={draft}
            onApprove={() => approveDraft(draft.id)}
            onEdit={() => navigate(`/support/knowledge/drafts/${draft.id}/edit`)}
            onReject={() => rejectDraft(draft.id)}
          />
        ))}

        {drafts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 32px', background: BG, boxShadow: NEU_SHADOW, borderRadius: 24 }}>
            <CheckCircleIcon style={{ width: 48, height: 48, color: GREEN, margin: '0 auto 16px' }} />
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: DARK, marginBottom: 8 }}>All caught up!</div>
            <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED, maxWidth: 360, margin: '0 auto' }}>
              Lira hasn't identified any new knowledge gaps. Check back after more conversations are processed.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
