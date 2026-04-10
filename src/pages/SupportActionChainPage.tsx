/**
 * Screen 34 — Action Engine: Action Chain Visualizer
 * Pixel-faithful recreation of Figma node 1-9985
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PauseIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  QueueListIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  XCircleIcon,
  BoltIcon,
} from '@heroicons/react/24/solid'
import { ActionTopBar } from './SupportActionApprovalQueuePage'

// ── Design tokens ─────────────────────────────────────────────────────────────
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

// ── Types ─────────────────────────────────────────────────────────────────────
type ChainStatus = 'RUNNING' | 'COMPLETED' | 'PENDING APPROVAL' | 'FAILED'
type StepStatus  = 'done' | 'running' | 'pending' | 'failed'

interface ChainStep {
  id: string
  label: string
  sublabel: string
  icon: string        // emoji / short label identifying the integration
  iconBg: string
  status: StepStatus
  topColor: string    // colored top line on the step card
  topLabel: string    // small label above step name
  expanded?: boolean  // pre-expanded with code block
  payload?: string
  response?: string
}

interface ParallelGroup {
  type: 'parallel'
  steps: [ChainStep, ChainStep]
}

type FlowNode = ChainStep | ParallelGroup

interface Chain {
  id: string
  customer: string
  trigger: string
  time: string
  stepCount: number
  status: ChainStatus
  transactionId: string
  nodes: FlowNode[]
}

const CHAIN_STATUS_STYLE: Record<ChainStatus, { bg: string; color: string }> = {
  'RUNNING':          { bg: '#EEF2FF', color: PRIMARY },
  'COMPLETED':        { bg: '#DCFCE7', color: '#166534' },
  'PENDING APPROVAL': { bg: '#FEF3C7', color: '#92400E' },
  'FAILED':           { bg: '#FEE2E2', color: '#991B1B' },
}

const CHAINS: Chain[] = [
  {
    id: 'c1',
    customer: 'Daniel Roy',
    trigger: 'Inbound Inquiry: Integration Issue',
    time: '2 mins ago',
    stepCount: 8,
    status: 'RUNNING',
    transactionId: 'LRA-992-DKX-112',
    nodes: [
      {
        id: 'n1', label: 'Inbound email', sublabel: '', icon: '✉', iconBg: '#EEF2FF',
        status: 'done', topColor: PRIMARY, topLabel: 'TRIGGER',
      },
      {
        id: 'n2', label: 'Integration Support', sublabel: '', icon: '⊕', iconBg: '#DCFCE7',
        status: 'done', topColor: GREEN, topLabel: 'INTENT CLASSIFIED',
      },
      {
        type: 'parallel',
        steps: [
          {
            id: 'n3a', label: 'HubSpot', sublabel: '', icon: 'HS', iconBg: '#FFF7ED',
            status: 'done', topColor: '#F97316', topLabel: 'QUERY CRM',
          },
          {
            id: 'n3b', label: 'Internal API', sublabel: '', icon: '⚙', iconBg: '#EEF2FF',
            status: 'done', topColor: '#60A5FA', topLabel: 'CHECK TX STATUS',
          },
        ],
      } as ParallelGroup,
      {
        id: 'n4', label: 'Linear #4832', sublabel: '', icon: '▭', iconBg: '#EDE9FE',
        status: 'done', topColor: '#8B5CF6', topLabel: 'CREATE TICKET',
        expanded: true,
        payload: '"title": "Sync issue - Daniel Roy",\n"priority": 1,\n"teamId": "ENG-SUPPORT",\n"labels": ["bug", "auto"]',
        response: '"id": "ISS-4832",\n"url": "https://linear.app/...",\n"status": "todo",\n"createdAt": "2023-10-24T10:02:11Z"',
      },
      {
        id: 'n5', label: '#compliance-team', sublabel: '', icon: '#', iconBg: '#F5F3FF',
        status: 'running', topColor: '#EC4899', topLabel: 'NOTIFY SLACK',
      },
      {
        id: 'n6', label: 'Sent via SendGrid', sublabel: '', icon: '↩', iconBg: '#F0FDF4',
        status: 'pending', topColor: '#10B981', topLabel: 'REPLY TO CUSTOMER',
      },
    ],
  },
  {
    id: 'c2',
    customer: 'Sarah Jenkins',
    trigger: 'Billing Dispute: Overcharge',
    time: '14 mins ago',
    stepCount: 5,
    status: 'COMPLETED',
    transactionId: 'LRA-881-SJK-071',
    nodes: [
      { id: 's1', label: 'Inbound email', sublabel: '', icon: '✉', iconBg: '#EEF2FF', status: 'done', topColor: PRIMARY, topLabel: 'TRIGGER' },
      { id: 's2', label: 'Billing Dispute', sublabel: '', icon: '💰', iconBg: '#DCFCE7', status: 'done', topColor: GREEN, topLabel: 'INTENT CLASSIFIED' },
      { id: 's3', label: 'Stripe',          sublabel: '', icon: 'ST', iconBg: '#EDE9FE', status: 'done', topColor: '#635BFF', topLabel: 'PROCESS REFUND',
        payload: '"charge_id": "ch_1234",\n"amount": 4200,\n"reason": "duplicate"',
        response: '"id": "re_1234",\n"status": "succeeded"',
      },
      { id: 's4', label: 'Reply sent',      sublabel: '', icon: '↩', iconBg: '#F0FDF4', status: 'done', topColor: '#10B981', topLabel: 'REPLY TO CUSTOMER' },
      { id: 's5', label: 'CSAT collected',  sublabel: '', icon: '★', iconBg: '#FEF9C3', status: 'done', topColor: AMBER, topLabel: 'CSAT PROMPT' },
    ],
  },
  {
    id: 'c3',
    customer: 'Michael Chen',
    trigger: 'Refund Request: > $500',
    time: '28 mins ago',
    stepCount: 12,
    status: 'PENDING APPROVAL',
    transactionId: 'LRA-774-MCH-099',
    nodes: [
      { id: 'm1', label: 'Inbound email', sublabel: '', icon: '✉', iconBg: '#EEF2FF', status: 'done', topColor: PRIMARY, topLabel: 'TRIGGER' },
      { id: 'm2', label: 'Refund Request', sublabel: '', icon: '💳', iconBg: '#DCFCE7', status: 'done', topColor: GREEN, topLabel: 'INTENT CLASSIFIED' },
      { id: 'm3', label: 'Awaiting approval', sublabel: '', icon: '⏸', iconBg: '#FEF9C3', status: 'pending', topColor: AMBER, topLabel: 'HUMAN APPROVAL' },
    ],
  },
  {
    id: 'c4',
    customer: 'Elena Rodriguez',
    trigger: 'Feature Inquiry: API Limits',
    time: '45 mins ago',
    stepCount: 6,
    status: 'COMPLETED',
    transactionId: 'LRA-663-ERD-088',
    nodes: [
      { id: 'e1', label: 'Inbound email', sublabel: '', icon: '✉', iconBg: '#EEF2FF', status: 'done', topColor: PRIMARY, topLabel: 'TRIGGER' },
      { id: 'e2', label: 'Feature Inquiry', sublabel: '', icon: '🔍', iconBg: '#DCFCE7', status: 'done', topColor: GREEN, topLabel: 'INTENT CLASSIFIED' },
      { id: 'e3', label: 'KB Search', sublabel: '', icon: '📚', iconBg: '#EEF2FF', status: 'done', topColor: PRIMARY, topLabel: 'KNOWLEDGE LOOKUP' },
      { id: 'e4', label: 'Reply sent', sublabel: '', icon: '↩', iconBg: '#F0FDF4', status: 'done', topColor: '#10B981', topLabel: 'REPLY TO CUSTOMER' },
    ],
  },
  {
    id: 'c5',
    customer: 'Thomas Wright',
    trigger: 'OAuth Connection Error',
    time: '1 hour ago',
    stepCount: 3,
    status: 'FAILED',
    transactionId: 'LRA-512-TWR-044',
    nodes: [
      { id: 't1', label: 'Webhook event', sublabel: '', icon: '⚡', iconBg: '#EEF2FF', status: 'done', topColor: PRIMARY, topLabel: 'TRIGGER' },
      { id: 't2', label: 'OAuth check',   sublabel: '', icon: '🔑', iconBg: '#FEE2E2', status: 'failed', topColor: RED, topLabel: 'AUTH VERIFY',
        payload: '"client_id": "oauth_tw44",\n"grant_type": "authorization_code"',
        response: '"error": "invalid_grant",\n"message": "Authorization code expired"',
      },
    ],
  },
]

function isParallel(node: FlowNode): node is ParallelGroup {
  return 'type' in node && node.type === 'parallel'
}

// ── Step card ─────────────────────────────────────────────────────────────────
function StepCard({
  step, selected, onSelect,
}: {
  step: ChainStep
  selected: boolean
  onSelect: () => void
}) {
  const statusIcon = step.status === 'done'
    ? <CheckCircleIcon style={{ width: 16, height: 16, color: GREEN }} />
    : step.status === 'failed'
      ? <XCircleIcon style={{ width: 16, height: 16, color: RED }} />
      : <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${BORDER}` }} />

  return (
    <div>
      <div
        onClick={onSelect}
        style={{
          background: CARD,
          borderRadius: 12,
          border: selected ? `2px solid ${PRIMARY}` : `1px solid ${BORDER}`,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          boxShadow: selected ? `0 0 0 3px rgba(99,102,241,0.1)` : SHADOW,
        }}
      >
        {/* Colored top bar */}
        <div style={{ height: 4, background: step.topColor }} />
        <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Icon */}
          <div style={{ width: 32, height: 32, borderRadius: 8, background: step.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 14 }}>{step.icon}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: step.topColor, marginBottom: 2 }}>
              {step.topLabel}
            </div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {step.label}
            </div>
          </div>
          {statusIcon}
        </div>
      </div>

      {/* Expanded payload (for CREATE TICKET etc.) */}
      {step.expanded && step.payload && step.response && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: '#60A5FA', marginBottom: 4 }}>// API Payload</div>
            <div style={{ background: '#1E2030', borderRadius: 8, padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#A5B4FC', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {step.payload}
            </div>
          </div>
          <div>
            <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 600, color: '#86EFAC', marginBottom: 4 }}>// Response (201)</div>
            <div style={{ background: '#1E2030', borderRadius: 8, padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 10, color: '#86EFAC', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {step.response}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Connector line ────────────────────────────────────────────────────────────
function Connector() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
      <div style={{ width: 2, height: 28, background: '#D1D5DB' }} />
    </div>
  )
}

// ── Parallel group ────────────────────────────────────────────────────────────
function ParallelGroupNode({
  group, selectedId, onSelect,
}: {
  group: ParallelGroup
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div>
      {/* Fork line */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
        <div style={{ width: 2, height: 20, background: '#D1D5DB' }} />
      </div>

      {/* Horizontal spreader */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        {group.steps.map((step, i) => (
          <div key={step.id} style={{ flex: 1 }}>
            <StepCard
              step={step}
              selected={selectedId === step.id}
              onSelect={() => onSelect(step.id)}
            />
          </div>
        ))}
      </div>

      {/* Rejoin line */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <div style={{ width: 2, height: 20, background: '#D1D5DB' }} />
      </div>
    </div>
  )
}

// ── Chain Visualizer panel ────────────────────────────────────────────────────
function ChainVisualizer({ chain, selectedStepId, onSelectStep }: {
  chain: Chain
  selectedStepId: string | null
  onSelectStep: (id: string) => void
}) {
  return (
    <div style={{ flex: 1, background: CARD, borderRadius: 16, boxShadow: SHADOW, padding: '24px', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: DARK }}>Chain Visualizer</div>
          <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginTop: 2 }}>Transaction ID: {chain.transactionId}</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>
            <PauseIcon style={{ width: 14, height: 14 }} />
            Pause Chain
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: LIGHT, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontFamily: FONT, fontWeight: 600, fontSize: 13, color: PRIMARY }}>
            <WrenchScrewdriverIcon style={{ width: 14, height: 14 }} />
            Configure
          </button>
        </div>
      </div>

      {/* Flow nodes */}
      <div style={{ maxWidth: 520, alignSelf: 'center', width: '100%' }}>
        {chain.nodes.map((node, i) => {
          if (isParallel(node)) {
            return (
              <div key={`para-${i}`}>
                {i > 0 && <Connector />}
                <ParallelGroupNode
                  group={node}
                  selectedId={selectedStepId}
                  onSelect={onSelectStep}
                />
              </div>
            )
          }
          const step = node as ChainStep
          return (
            <div key={step.id}>
              {i > 0 && !isParallel(chain.nodes[i - 1]) && <Connector />}
              <StepCard
                step={step}
                selected={selectedStepId === step.id}
                onSelect={() => onSelectStep(step.id)}
              />
              {step.expanded && step.payload && !step.response && null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportActionChainPage() {
  const navigate = useNavigate()
  const [selectedChainId, setSelectedChainId] = useState('c1')
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null)

  const chain = CHAINS.find(c => c.id === selectedChainId) ?? CHAINS[0]

  return (
    <div style={{ background: BG, minHeight: '100%', fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>

      {/* Top nav */}
      <ActionTopBar
        active="/support/actions/chain"
        searchPlaceholder="Search chains or logs..."
        onNavigate={navigate}
      />

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: chain list ── */}
        <div style={{ width: 280, flexShrink: 0, background: CARD, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* List header */}
          <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Recent Action Chains</span>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#EEF2FF', border: 'none', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}>
              <BoltIcon style={{ width: 10, height: 10, color: PRIMARY }} />
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: PRIMARY }}>Live Logs</span>
            </button>
          </div>

          {/* Chain items */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {CHAINS.map(c => {
              const isActive = c.id === selectedChainId
              const ss = CHAIN_STATUS_STYLE[c.status]
              return (
                <div
                  key={c.id}
                  onClick={() => { setSelectedChainId(c.id); setSelectedStepId(null) }}
                  style={{
                    padding: '14px 20px',
                    cursor: 'pointer',
                    borderLeft: isActive ? `3px solid ${PRIMARY}` : '3px solid transparent',
                    borderBottom: `1px solid ${BORDER}`,
                    background: isActive ? '#F8F8FF' : CARD,
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>{c.customer}</span>
                    <span style={{ background: ss.bg, color: ss.color, borderRadius: 20, padding: '2px 8px', fontFamily: FONT, fontWeight: 700, fontSize: 10, whiteSpace: 'nowrap' }}>
                      {c.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginBottom: 8 }}>{c.trigger}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 11, color: MUTED }}>
                      <ClockIcon style={{ width: 12, height: 12 }} />
                      {c.time}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontSize: 11, color: MUTED }}>
                      <QueueListIcon style={{ width: 12, height: 12 }} />
                      {c.stepCount} steps
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Right: visualizer ── */}
        <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
          <ChainVisualizer
            chain={chain}
            selectedStepId={selectedStepId}
            onSelectStep={id => setSelectedStepId(prev => prev === id ? null : id)}
          />
        </div>
      </div>
    </div>
  )
}
