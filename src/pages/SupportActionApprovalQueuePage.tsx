/**
 * Screen 35 — Action Engine: Approval Queue
 * Screen 36 — Authorize / Reject Modal
 * Pixel-faithful recreation of Figma nodes 1-9457 & 1-10332
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDownIcon,
  EyeIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid'

// ── Design tokens — flat design matching Figma ────────────────────────────────
const BG      = '#ECEEF3'
const CARD    = '#FFFFFF'
const SHADOW  = '0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)'
const PRIMARY = '#6366F1'
const DARK    = '#111827'
const MUTED   = '#6B7280'
const BORDER  = '#E5E7EB'
const LIGHT   = '#F9FAFB'
const GREEN   = '#16A34A'
const RED     = '#EF4444'
const AMBER   = '#D97706'
const FONT    = 'Plus Jakarta Sans, sans-serif'

// ── Tab navigation shared across all Action Engine pages ─────────────────────
export const ACTION_TABS = [
  { label: 'Action Chains',      path: '/support/actions/chain' },
  { label: 'Approval Queue',     path: '/support/actions' },
  { label: 'History',            path: '/support/actions/history' },
  { label: 'Integration Health', path: '/support/actions/integrations' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
type Priority  = 'Critical' | 'High' | 'Medium' | 'Low'
type Sentiment = 'Escalated' | 'Positive'

interface Change { field: string; from: string; to: string }

interface ApprovalItem {
  id: string
  name: string
  initials: string
  avatarColor: string
  priority: Priority
  requestType: string
  reqBg: string
  reqColor: string
  sentiment: Sentiment
  proposedPrefix: string
  proposedHighlight: string
  proposedHighlightStyle: React.CSSProperties
  proposedSuffix: string
  contextText: string
  showFullConversation: boolean
  destination: string
  dealTitle: string
  changes: Change[]
  impactStatement: string
  consequences: string[]
}

const PRIORITY_STYLE: Record<Priority, { dot: string; textColor: string }> = {
  Critical: { dot: RED,       textColor: RED },
  High:     { dot: '#F97316', textColor: '#F97316' },
  Medium:   { dot: '#9CA3AF', textColor: MUTED },
  Low:      { dot: '#22C55E', textColor: GREEN },
}

const ITEMS: ApprovalItem[] = [
  {
    id: 'a1',
    name: 'Jane Smith',
    initials: 'JS',
    avatarColor: '#F472B6',
    priority: 'Critical',
    requestType: 'Refund Request',
    reqBg: '#DBEAFE', reqColor: '#1E40AF',
    sentiment: 'Escalated',
    proposedPrefix: 'Initiate ',
    proposedHighlight: '$2,400 refund',
    proposedHighlightStyle: { background: '#FEF9C3', color: '#78350F', borderRadius: 6, padding: '2px 8px', fontWeight: 700 },
    proposedSuffix: ' via HubSpot for Subscription ID #9921-X.',
    contextText: '"Customer complained about service downtime during Q3 peak hours. Technical logs confirm 14h of total outage. AI recommended standard 100% monthly credit + 15% retention bonus."',
    showFullConversation: true,
    destination: 'HUBSPOT',
    dealTitle: 'Update Deal #48291',
    changes: [
      { field: 'Deal Stage',   from: 'Discovery', to: 'Contract Sent' },
      { field: 'Amount (USD)', from: '$42,000',   to: '$48,500' },
    ],
    impactStatement: 'This update will trigger 3 downstream automation workflows, including an automated invoice generation for the billing department.',
    consequences: [
      "Status changed to 'Processing' in internal ERP",
      'Notification sent to Account Executive (Sarah Miller)',
    ],
  },
  {
    id: 'a2',
    name: 'Tom Bakker',
    initials: 'TB',
    avatarColor: '#818CF8',
    priority: 'Medium',
    requestType: 'Account Upgrade',
    reqBg: '#EDE9FE', reqColor: '#5B21B6',
    sentiment: 'Positive',
    proposedPrefix: "Upgrade workspace 'Engineering-Ops' to ",
    proposedHighlight: 'Enterprise Tier',
    proposedHighlightStyle: { color: PRIMARY, fontWeight: 700 },
    proposedSuffix: '. Apply 20% annual discount voucher as requested.',
    contextText: '"User reached seat limit on Pro plan. Expressed interest in SSO and advanced auditing features.\nSales rep had previous chat regarding annual billing."',
    showFullConversation: false,
    destination: 'HUBSPOT',
    dealTitle: 'Update Workspace Plan',
    changes: [
      { field: 'Plan',     from: 'Pro', to: 'Enterprise' },
      { field: 'Discount', from: '0%',  to: '20%' },
    ],
    impactStatement: 'This will upgrade the workspace and apply the discount. Billing cycle will be reset to the new plan.',
    consequences: [
      'Plan upgraded to Enterprise immediately',
      '20% discount applied to next invoice',
    ],
  },
]

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ initials, color, size = 48 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: Math.round(size * 0.33), color: '#fff' }}>
        {initials}
      </span>
    </div>
  )
}

// ── Shared top nav ────────────────────────────────────────────────────────────
export function ActionTopBar({
  active,
  badge,
  searchPlaceholder,
  onNavigate,
}: {
  active: string
  badge?: number
  searchPlaceholder?: string
  onNavigate: (path: string) => void
}) {
  return (
    <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 24px', height: 56, position: 'sticky', top: 0, zIndex: 10 }}>
      <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 14, color: DARK, marginRight: 32, letterSpacing: active === '/support/actions/chain' ? '0.06em' : '0.01em', textTransform: active === '/support/actions/chain' ? 'uppercase' : 'none' }}>
        Actions
      </span>
      <div style={{ display: 'flex', alignItems: 'stretch', height: '100%', flex: 1 }}>
        {ACTION_TABS.map(tab => {
          const isActive = tab.path === active
          return (
            <button
              key={tab.path}
              onClick={() => onNavigate(tab.path)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '0 14px', height: '100%',
                fontFamily: FONT, fontWeight: isActive ? 600 : 400, fontSize: 14,
                color: isActive ? PRIMARY : MUTED,
                borderBottom: isActive ? `2px solid ${PRIMARY}` : '2px solid transparent',
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
              {tab.label === 'Approval Queue' && badge != null && badge > 0 && (
                <span style={{ background: RED, color: '#fff', borderRadius: '50%', minWidth: 18, height: 18, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 700, fontSize: 10 }}>
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 24, padding: '7px 14px' }}>
          <MagnifyingGlassIcon style={{ width: 14, height: 14, color: MUTED }} />
          <span style={{ fontFamily: FONT, fontSize: 13, color: '#9CA3AF' }}>{searchPlaceholder ?? 'Search...'}</span>
        </div>
      </div>
    </div>
  )
}

// ── Screen 36 — Authorization modal ──────────────────────────────────────────
function AuthModal({
  item, onClose, onDone,
}: {
  item: ApprovalItem
  onClose: () => void
  onDone: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: CARD, borderRadius: 20, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflow: 'auto', padding: 32, position: 'relative', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <XMarkIcon style={{ width: 16, height: 16, color: MUTED }} />
        </button>

        {/* Title */}
        <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: DARK, margin: '0 0 4px' }}>
          Authorize Lira to take this action
        </h2>
        <p style={{ fontFamily: FONT, fontSize: 13, color: MUTED, margin: '0 0 20px', lineHeight: 1.5 }}>
          Request originated from:{' '}
          <span style={{ color: PRIMARY, fontWeight: 600 }}>Sales Automation Chain #A-102</span>
        </p>

        {/* Destination card */}
        <div style={{ borderLeft: `4px solid ${PRIMARY}`, background: LIGHT, borderRadius: '0 12px 12px 0', padding: '16px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: '#1C2526', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 9, color: '#F97316' }}>Hs.</span>
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Destination: {item.destination}
              </div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>{item.dealTitle}</div>
            </div>
          </div>
          {item.changes.map((ch, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: CARD, borderRadius: 8, padding: '10px 14px', marginBottom: i < item.changes.length - 1 ? 8 : 0 }}>
              <span style={{ fontFamily: FONT, fontSize: 13, color: MUTED }}>{ch.field}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontSize: 13 }}>
                <span style={{ color: '#9CA3AF' }}>{ch.from}</span>
                <span style={{ color: '#9CA3AF' }}>→</span>
                <span style={{ color: PRIMARY, fontWeight: 700 }}>{ch.to}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Impact Statement */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ExclamationTriangleIcon style={{ width: 14, height: 14, color: AMBER }} />
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: AMBER, marginBottom: 4 }}>Impact Statement</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: '#92400E', lineHeight: 1.5 }}>{item.impactStatement}</div>
          </div>
        </div>

        {/* Consequence Preview */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED, marginBottom: 10 }}>
            Consequence Preview
          </div>
          {item.consequences.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontFamily: FONT, fontSize: 13, color: DARK }}>
              <CheckCircleIcon style={{ width: 15, height: 15, color: GREEN, flexShrink: 0 }} />
              {c}
            </div>
          ))}
        </div>

        {/* Modify raw payload */}
        <button
          onClick={() => setExpanded(p => !p)}
          style={{ width: '100%', background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '11px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontWeight: 500, fontSize: 13, color: MUTED, marginBottom: expanded ? 0 : 20 }}
        >
          <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{'<>'}</span>
          Modify raw payload
          <ChevronDownIcon style={{ width: 14, height: 14, marginLeft: 'auto', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {expanded && (
          <div style={{ background: '#1E2030', borderRadius: '0 0 8px 8px', padding: 16, marginBottom: 20, fontFamily: 'ui-monospace, monospace', fontSize: 12, color: '#A5B4FC', lineHeight: 1.7 }}>
            {'{\n  "customer_id": "cus_9xP02",\n  "action": "update_subscription",\n  "params": {\n    "new_tier": "Enterprise",\n    "billing_cycle": "annual"\n  }\n}'}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: expanded ? 0 : undefined }}>
          <button
            onClick={onClose}
            style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK }}
          >
            Reject Action
          </button>
          <button
            onClick={onDone}
            style={{ background: GREEN, border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer', fontFamily: FONT, fontWeight: 700, fontSize: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ShieldCheckIcon style={{ width: 16, height: 16 }} />
            Authorize Action
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Approval card ─────────────────────────────────────────────────────────────
function ApprovalCard({
  item, onApprove, onModify, onReject,
}: {
  item: ApprovalItem
  onApprove: () => void
  onModify: () => void
  onReject: () => void
}) {
  const ps = PRIORITY_STYLE[item.priority]
  return (
    <div style={{ background: CARD, borderRadius: 16, boxShadow: SHADOW, padding: '24px 28px' }}>
      <div style={{ display: 'flex', gap: 24 }}>

        {/* Left info panel */}
        <div style={{ width: 172, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Avatar initials={item.initials} color={item.avatarColor} />
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: ps.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: ps.textColor }}>
                  {item.priority} Priority
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: FONT, fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Request Type</div>
            <span style={{ display: 'inline-block', background: item.reqBg, color: item.reqColor, borderRadius: 20, padding: '3px 10px', fontFamily: FONT, fontWeight: 600, fontSize: 12 }}>
              {item.requestType}
            </span>
          </div>

          <div>
            <div style={{ fontFamily: FONT, fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>Customer Sentiment</div>
            {item.sentiment === 'Escalated' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: RED, fontFamily: FONT, fontWeight: 600, fontSize: 12 }}>
                <XCircleIcon style={{ width: 14, height: 14 }} />
                Escalated
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: GREEN, fontFamily: FONT, fontWeight: 600, fontSize: 12 }}>
                <CheckCircleIcon style={{ width: 14, height: 14 }} />
                Positive
              </div>
            )}
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{ width: 1, background: BORDER, flexShrink: 0, alignSelf: 'stretch' }} />

        {/* Right content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: AMBER, marginBottom: 8 }}>
              Proposed Action
            </div>
            <div style={{ background: '#F5F3FF', borderRadius: 10, padding: '12px 16px', fontFamily: FONT, fontSize: 14, color: DARK, lineHeight: 1.6 }}>
              {item.proposedPrefix}
              <span style={item.proposedHighlightStyle}>{item.proposedHighlight}</span>
              {item.proposedSuffix}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>
              Context & Reasoning
            </div>
            <p style={{ fontFamily: FONT, fontSize: 13, fontStyle: 'italic', color: MUTED, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {item.contextText}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={onApprove} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#16A34A', border: 'none', borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: '#fff' }}>
              <CheckCircleIcon style={{ width: 15, height: 15 }} />
              Approve
            </button>
            <button onClick={onModify} style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>
              <PencilSquareIcon style={{ width: 15, height: 15 }} />
              Modify
            </button>
            <button onClick={onReject} style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: RED }}>
              <XCircleIcon style={{ width: 15, height: 15 }} />
              Reject
            </button>
            {item.showFullConversation && (
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '10px 20px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: MUTED }}>
                <EyeIcon style={{ width: 15, height: 15 }} />
                Full Conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page export ───────────────────────────────────────────────────────────────
export function SupportActionApprovalQueuePage() {
  const navigate = useNavigate()
  const [resolved, setResolved] = useState<Set<string>>(new Set())
  const [modal, setModal] = useState<ApprovalItem | null>(null)

  const pending = ITEMS.filter(a => !resolved.has(a.id))

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: FONT }}>

      {/* Top navigation bar */}
      <ActionTopBar
        active="/support/actions"
        badge={pending.length}
        searchPlaceholder="Search approvals..."
        onNavigate={navigate}
      />

      {/* Main content */}
      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Warning banner */}
        <div style={{ background: CARD, borderRadius: 12, borderLeft: '4px solid #F97316', padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12, boxShadow: SHADOW }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <InformationCircleIcon style={{ width: 14, height: 14, color: '#F97316' }} />
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Queue Congestion Warning</div>
            <div style={{ fontFamily: FONT, fontSize: 13, color: MUTED, marginTop: 2, lineHeight: 1.5 }}>
              There are 2 high-priority refunds pending for over 4 hours. Automated escalation will trigger in 60 minutes if unresolved.
            </div>
          </div>
        </div>

        {/* Approval cards */}
        {pending.map(item => (
          <ApprovalCard
            key={item.id}
            item={item}
            onApprove={() => setModal(item)}
            onModify={() => setModal(item)}
            onReject={() => setResolved(prev => new Set([...prev, item.id]))}
          />
        ))}

        {/* Empty state */}
        {pending.length === 0 && (
          <div style={{ background: CARD, borderRadius: 16, boxShadow: SHADOW, padding: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <CheckCircleIcon style={{ width: 48, height: 48, color: GREEN }} />
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: DARK }}>All caught up!</div>
            <div style={{ fontFamily: FONT, fontSize: 14, color: MUTED }}>No actions waiting for approval.</div>
          </div>
        )}
      </div>

      {/* Authorization modal (Screen 36) */}
      {modal && (
        <AuthModal
          item={modal}
          onClose={() => setModal(null)}
          onDone={() => {
            setResolved(prev => new Set([...prev, modal.id]))
            setModal(null)
          }}
        />
      )}
    </div>
  )
}
