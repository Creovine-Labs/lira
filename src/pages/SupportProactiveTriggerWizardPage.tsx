/**
 * Screens 23-27 — Proactive Trigger Wizard (5 Steps)
 * Step 1: Event Type  |  Step 2: Condition Builder
 * Step 3: Outreach Template  |  Step 4: Channel & Timing  |  Step 5: Test & Activate
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PlayIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
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
const AMBER_BG     = 'rgba(254,243,199,0.8)'
const AMBER_BORDER = '#FDE68A'
const RED          = '#DC2626'
const RED_LIGHT    = 'rgba(254,226,226,0.7)'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Condition {
  id: number
  field: string
  operator: string
  value: string
}

interface WizardState {
  // Step 1
  eventTab: 'predefined' | 'custom'
  selectedEvent: string
  triggerName: string
  customEvent: string
  customDesc: string
  customPayload: string
  // Step 2
  conditions: Condition[]
  // Step 3
  subject: string
  templateBody: string
  personalize: boolean
  fallback: string
  previewMode: 'desktop' | 'mobile'
  // Step 4
  channel: 'email' | 'voice' | 'both'
  timing: 'immediate' | 'wait' | 'business'
  waitMinutes: number
  deduplicationDays: number
  maxPerMonth: number
  monitorReply: boolean
  // Step 5
  testPayload: string
  testStatus: 'idle' | 'running' | 'passed'
}

const DEFAULT_TEMPLATE = `Hi {{customer.name}},

We noticed your recent payment of {{data.amount}} {{data.currency}} didn't go through. This can usually be resolved quickly — here's what to do:

[Retry payment link]

If you need help, just reply to this email and I'll sort it out immediately.

– Lira, your support assistant at {{org.name}}`

const DEFAULT_PAYLOAD = JSON.stringify({
  event: 'payment.failed',
  customerId: 'cust_abc123',
  timestamp: '2026-04-09T14:32:00Z',
  data: {
    amount: 2000,
    currency: 'EUR',
    failureCode: 'insufficient_funds',
  }
}, null, 2)

const INITIAL_STATE: WizardState = {
  eventTab: 'predefined',
  selectedEvent: 'payment.failed',
  triggerName: 'Payment Failed — Retry Prompt',
  customEvent: '', customDesc: '', customPayload: '',
  conditions: [
    { id: 1, field: 'event.type',     operator: 'equals',       value: 'payment.failed' },
    { id: 2, field: 'data.amount',    operator: 'greater than', value: '500'             },
    { id: 3, field: 'customer.tier',  operator: 'is not',       value: 'enterprise'      },
  ],
  subject: 'Action required: Your payment didn\'t go through',
  templateBody: DEFAULT_TEMPLATE,
  personalize: true,
  fallback: 'Valued customer',
  previewMode: 'desktop',
  channel: 'email',
  timing: 'immediate',
  waitMinutes: 15,
  deduplicationDays: 7,
  maxPerMonth: 3,
  monitorReply: true,
  testPayload: DEFAULT_PAYLOAD,
  testStatus: 'idle',
}

const STEPS = [
  'Event Type',
  'Conditions',
  'Template',
  'Channel & Timing',
  'Test & Activate',
]

const PREDEFINED_EVENTS = [
  { key: 'payment.failed',       label: 'A payment fails',                 icon: '💳', desc: 'Triggered when a charge fails' },
  { key: 'kyc.blocked',          label: 'KYC verification stalls',         icon: '🪪', desc: 'Identity check not completed' },
  { key: 'fraud.flagged',        label: 'A transaction is flagged',        icon: '🚨', desc: 'Potential fraud detected' },
  { key: 'subscription.expiring',label: 'Subscription expires in X days',  icon: '📅', desc: 'Renewal period approaching' },
  { key: 'api.error.spike',      label: 'API errors exceed threshold',     icon: '⚡', desc: 'Error rate above normal' },
  { key: 'account.inactive',     label: 'Account inactive for X days',     icon: '😴', desc: 'User not logging in' },
]

const FIELD_OPTIONS = [
  'event.type', 'data.amount', 'data.currency', 'data.failureCode',
  'customer.tier', 'customer.churnRiskScore', 'customer.email', 'data.customerId',
]

const OPERATOR_OPTIONS = [
  'equals', 'does not equal', 'contains', 'greater than', 'less than', 'is not', 'is null', 'is not null',
]

const VARIABLES = [
  '{{customer.name}}', '{{data.amount}}', '{{data.currency}}', '{{data.failureCode}}', '{{org.name}}',
]

function renderPreview(body: string): string {
  return body
    .replace(/{{customer\.name}}/g, 'Jana Fischer')
    .replace(/{{data\.amount}}/g, '€2,000')
    .replace(/{{data\.currency}}/g, 'EUR')
    .replace(/{{data\.failureCode}}/g, 'insufficient_funds')
    .replace(/{{org\.name}}/g, 'FinTech Co.')
}

function generateConditionSummary(conditions: Condition[]): string {
  if (conditions.length === 0) return 'No conditions — this trigger fires for every matching event.'
  const parts = conditions.map(c => {
    if (c.operator === 'is null' || c.operator === 'is not null') return `${c.field} ${c.operator}`
    return `${c.field} ${c.operator} "${c.value}"`
  })
  return 'This trigger fires when:\n' + parts.map((p, i) => `${i + 1}. ${p}`).join('\n')
}

// ── Input style ────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: 13, color: DARK,
  background: BG, boxShadow: NEU_INSET, border: 'none', borderRadius: 12,
  padding: '11px 14px', outline: 'none', width: '100%', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'none',
}

// ── Step 1: Event Type ─────────────────────────────────────────────────────────
function StepEventType({ state, setState }: { state: WizardState; setState: (p: Partial<WizardState>) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: BG, boxShadow: NEU_INSET, borderRadius: 14, padding: 5 }}>
        {(['predefined', 'custom'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setState({ eventTab: tab })}
            style={{
              flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', borderRadius: 10,
              fontFamily: FONT, fontWeight: 600, fontSize: 13,
              background: state.eventTab === tab ? PRIMARY : 'transparent',
              color: state.eventTab === tab ? WHITE : MUTED,
              boxShadow: state.eventTab === tab ? '0 2px 8px rgba(99,102,241,0.35)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'predefined' ? '⚡ Predefined Events' : '✏️ Custom Event'}
          </button>
        ))}
      </div>

      {state.eventTab === 'predefined' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {PREDEFINED_EVENTS.map(ev => {
              const selected = state.selectedEvent === ev.key
              return (
                <button
                  key={ev.key}
                  onClick={() => setState({ selectedEvent: ev.key, triggerName: `${ev.label} — Auto` })}
                  style={{
                    textAlign: 'left', border: `2px solid ${selected ? PRIMARY : 'transparent'}`,
                    borderRadius: 16, padding: '16px 16px',
                    background: selected ? AI_BG : PROFILE_BG,
                    boxShadow: selected ? `0 0 0 1px ${AI_BORDER}` : 'none',
                    cursor: 'pointer', transition: 'all 0.15s',
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{ev.icon}</span>
                  <code style={{ fontFamily: 'monospace', fontSize: 10.5, color: PRIMARY }}>{ev.key}</code>
                  <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, lineHeight: '1.3em' }}>{ev.label}</span>
                  <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{ev.desc}</span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Event name</label>
            <input
              value={state.customEvent}
              onChange={e => setState({ customEvent: e.target.value })}
              placeholder="e.g. payment.failed"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Description</label>
            <textarea
              value={state.customDesc}
              onChange={e => setState({ customDesc: e.target.value })}
              placeholder="Describe when this event fires..."
              rows={2}
              style={{ ...inputStyle, resize: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 4 }}>Sample webhook payload</label>
            <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, margin: '0 0 8px' }}>Paste your payload to auto-detect available fields for your condition builder</p>
            <textarea
              value={state.customPayload}
              onChange={e => setState({ customPayload: e.target.value })}
              placeholder={'{\n  "event": "...",\n  "data": { ... }\n}'}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>
        </div>
      )}

      {/* Trigger name */}
      <div>
        <label style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'block', marginBottom: 8 }}>
          Trigger name
        </label>
        <input
          value={state.triggerName}
          onChange={e => setState({ triggerName: e.target.value })}
          placeholder="Give this trigger a descriptive name..."
          style={inputStyle}
        />
      </div>
    </div>
  )
}

// ── Step 2: Condition Builder ──────────────────────────────────────────────────
function StepConditionBuilder({ state, setState }: { state: WizardState; setState: (p: Partial<WizardState>) => void }) {
  const nextId = useRef(100)

  function addCondition() {
    const id = nextId.current++
    setState({ conditions: [...state.conditions, { id, field: 'event.type', operator: 'equals', value: '' }] })
  }

  function removeCondition(id: number) {
    setState({ conditions: state.conditions.filter(c => c.id !== id) })
  }

  function updateCondition(id: number, patch: Partial<Condition>) {
    setState({ conditions: state.conditions.map(c => c.id === id ? { ...c, ...patch } : c) })
  }

  const isSingleOperator = (op: string) => op === 'is null' || op === 'is not null'
  const summary = generateConditionSummary(state.conditions)

  return (
    <div style={{ display: 'flex', gap: 24, flexDirection: 'row' }}>
      {/* Left: condition rows */}
      <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {state.conditions.map((c, i) => (
          <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {i > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY, background: AI_BG, borderRadius: 6, padding: '2px 8px' }}>AND</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.06)' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={c.field}
                onChange={e => updateCondition(c.id, { field: e.target.value })}
                style={{ ...selectStyle, flex: 2, minWidth: 0 }}
              >
                {FIELD_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <select
                value={c.operator}
                onChange={e => updateCondition(c.id, { operator: e.target.value })}
                style={{ ...selectStyle, flex: 2, minWidth: 0 }}
              >
                {OPERATOR_OPTIONS.map(op => <option key={op} value={op}>{op}</option>)}
              </select>
              {!isSingleOperator(c.operator) && (
                <input
                  value={c.value}
                  onChange={e => updateCondition(c.id, { value: e.target.value })}
                  placeholder="value"
                  style={{ ...inputStyle, flex: 2, minWidth: 0 }}
                />
              )}
              <button
                onClick={() => removeCondition(c.id)}
                style={{
                  flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: RED_LIGHT, color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <XMarkIcon style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={addCondition}
            style={{
              fontFamily: FONT, fontWeight: 600, fontSize: 12, color: PRIMARY,
              background: AI_BG, border: `1px dashed ${AI_BORDER}`, borderRadius: 10,
              padding: '8px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <PlusIcon style={{ width: 12, height: 12 }} /> Add condition (AND)
          </button>
          {state.conditions.length > 0 && (
            <button
              onClick={() => setState({ conditions: [] })}
              style={{ fontFamily: FONT, fontWeight: 500, fontSize: 12, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 4px', textDecoration: 'underline' }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Right: summary panel */}
      <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ background: AI_BG, border: `1px solid ${AI_BORDER}`, borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <SparklesIcon style={{ width: 14, height: 14, color: PRIMARY }} />
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: PRIMARY }}>Plain English</span>
          </div>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK, whiteSpace: 'pre-line', margin: 0, lineHeight: '1.7em' }}>
            {summary}
          </p>
        </div>
        <div style={{ background: PROFILE_BG, borderRadius: 16, padding: 16, border: '1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK, marginBottom: 6 }}>Estimated frequency</div>
          <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: PRIMARY }}>8–12×</div>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>per week, based on current event volume</div>
        </div>
      </div>
    </div>
  )
}

// ── Step 3: Outreach Template ──────────────────────────────────────────────────
function StepOutreachTemplate({ state, setState }: { state: WizardState; setState: (p: Partial<WizardState>) => void }) {
  const [varMenuOpen, setVarMenuOpen] = useState(false)
  const taRef = useRef<HTMLTextAreaElement>(null)

  function insertVariable(v: string) {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart ?? state.templateBody.length
    const end   = ta.selectionEnd   ?? state.templateBody.length
    const newBody = state.templateBody.slice(0, start) + v + state.templateBody.slice(end)
    setState({ templateBody: newBody })
    setVarMenuOpen(false)
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + v.length, start + v.length) }, 0)
  }

  const previewHtml = renderPreview(state.templateBody)
    .split('\n')
    .map((line, i) => <div key={i} style={{ lineHeight: '1.7em', minHeight: '1.7em' }}>{line || '\u00A0'}</div>)

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Left: editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Subject line</label>
          <input value={state.subject} onChange={e => setState({ subject: e.target.value })} style={inputStyle} />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {['B', 'I', 'Link'].map(t => (
            <button key={t} style={{ fontFamily: FONT, fontWeight: t === 'B' ? 700 : 400, fontSize: 12, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontStyle: t === 'I' ? 'italic' : 'normal' }}>{t}</button>
          ))}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setVarMenuOpen(p => !p)}
              style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 8, padding: '6px 11px', cursor: 'pointer' }}
            >
              Insert Variable ▾
            </button>
            {varMenuOpen && (
              <div style={{ position: 'absolute', top: '110%', left: 0, zIndex: 10, background: WHITE, borderRadius: 12, boxShadow: NEU_SHADOW, padding: 6, minWidth: 200 }}>
                {VARIABLES.map(v => (
                  <button
                    key={v}
                    onClick={() => insertVariable(v)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', fontFamily: 'monospace', fontSize: 12, color: PRIMARY, background: 'transparent', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <textarea
          ref={taRef}
          value={state.templateBody}
          onChange={e => setState({ templateBody: e.target.value })}
          rows={12}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.7em' }}
        />

        {/* Personalize */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setState({ personalize: !state.personalize })}
            style={{ width: 40, height: 22, borderRadius: 9999, background: state.personalize ? PRIMARY : 'rgba(88,90,104,0.3)', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 9999, background: WHITE, transform: state.personalize ? 'translateX(18px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
          </button>
          <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>Personalize</span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>— fallback if name unavailable:</span>
          <input
            value={state.fallback}
            onChange={e => setState({ fallback: e.target.value })}
            style={{ ...inputStyle, width: 140, flexShrink: 0 }}
          />
        </div>
      </div>

      {/* Right: preview */}
      <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Desktop/mobile toggle */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {(['desktop', 'mobile'] as const).map(m => (
            <button
              key={m}
              onClick={() => setState({ previewMode: m })}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: FONT, fontWeight: 600, fontSize: 11,
                color: state.previewMode === m ? PRIMARY : MUTED,
                background: state.previewMode === m ? AI_BG : 'transparent',
                border: state.previewMode === m ? `1px solid ${AI_BORDER}` : '1px solid transparent',
                borderRadius: 9, padding: '5px 10px', cursor: 'pointer',
              }}
            >
              {m === 'desktop' ? <ComputerDesktopIcon style={{ width: 13, height: 13 }} /> : <DevicePhoneMobileIcon style={{ width: 13, height: 13 }} />}
              {m}
            </button>
          ))}
        </div>

        {/* Preview frame */}
        <div style={{
          background: WHITE, borderRadius: 16, padding: state.previewMode === 'mobile' ? '16px 12px' : 20,
          boxShadow: NEU_SHADOW, border: '1px solid rgba(0,0,0,0.05)',
          maxWidth: state.previewMode === 'mobile' ? 200 : '100%',
          flex: 1, overflow: 'hidden',
        }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK, marginBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 8 }}>
            {renderPreview(state.subject)}
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: state.previewMode === 'mobile' ? 11 : 12, color: DARK }}>
            {previewHtml}
          </div>
        </div>

        <button style={{ fontFamily: FONT, fontWeight: 600, fontSize: 12, color: MUTED, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 10, padding: '9px 0', cursor: 'pointer' }}>
          Send preview to myself
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Channel & Timing ───────────────────────────────────────────────────
function StepChannelTiming({ state, setState }: { state: WizardState; setState: (p: Partial<WizardState>) => void }) {
  function RadioGroup<T extends string>({ label, options, value, onChange }: {
    label: string
    options: { key: T; label: string; desc?: string; icon?: React.ReactNode }[]
    value: T
    onChange: (v: T) => void
  }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>{label}</div>
        {options.map(opt => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              textAlign: 'left', border: `2px solid ${value === opt.key ? PRIMARY : 'transparent'}`,
              borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
              background: value === opt.key ? AI_BG : PROFILE_BG,
              display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.15s',
            }}
          >
            <div style={{
              width: 18, height: 18, borderRadius: 9999, flexShrink: 0,
              border: `2px solid ${value === opt.key ? PRIMARY : MUTED}`,
              background: value === opt.key ? PRIMARY : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {value === opt.key && <div style={{ width: 7, height: 7, borderRadius: 9999, background: WHITE }} />}
            </div>
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'flex', alignItems: 'center', gap: 8 }}>
                {opt.icon}{opt.label}
              </div>
              {opt.desc && <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, marginTop: 2 }}>{opt.desc}</div>}
            </div>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      {/* Left column */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <RadioGroup
          label="Channel"
          value={state.channel}
          onChange={v => setState({ channel: v })}
          options={[
            { key: 'email', label: 'Email', desc: 'Send a personalised email', icon: <EnvelopeIcon style={{ width: 14, height: 14, color: MUTED }} /> },
            { key: 'voice', label: 'Voice call', desc: 'Lira initiates a phone call', icon: <PhoneIcon style={{ width: 14, height: 14, color: GREEN }} /> },
            { key: 'both', label: 'Both — email first, then voice', desc: 'Send email; escalate to voice if no reply in 2 hours', icon: <span style={{ fontSize: 13 }}>📱</span> },
          ]}
        />

        <RadioGroup
          label="Timing"
          value={state.timing}
          onChange={v => setState({ timing: v })}
          options={[
            { key: 'immediate', label: 'Immediately', desc: 'Send as soon as the event is received' },
            { key: 'wait', label: `Wait ${state.waitMinutes} minutes`, desc: 'Give customers time to resolve it themselves' },
            { key: 'business', label: 'Business hours only', desc: 'Queue until 09:00–18:00 in customer\'s timezone' },
          ]}
        />

        {state.timing === 'wait' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: -16 }}>
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>Wait</span>
            <input
              type="number"
              value={state.waitMinutes}
              onChange={e => setState({ waitMinutes: Number(e.target.value) })}
              style={{ ...inputStyle, width: 80 }}
            />
            <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK }}>minutes</span>
          </div>
        )}
      </div>

      {/* Right column */}
      <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Frequency limits</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED, flex: 1 }}>
              Don't re-fire for the same customer within
            </span>
            <input
              type="number"
              value={state.deduplicationDays}
              onChange={e => setState({ deduplicationDays: Number(e.target.value) })}
              style={{ ...inputStyle, width: 60 }}
            />
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED }}>days</span>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED, flex: 1 }}>
              Maximum
            </span>
            <input
              type="number"
              value={state.maxPerMonth}
              onChange={e => setState({ maxPerMonth: Number(e.target.value) })}
              style={{ ...inputStyle, width: 60 }}
            />
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, color: MUTED }}>messages per customer / month</span>
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <button
            onClick={() => setState({ monitorReply: !state.monitorReply })}
            style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 9999, background: state.monitorReply ? PRIMARY : 'rgba(88,90,104,0.3)', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', marginTop: 2 }}
          >
            <div style={{ width: 20, height: 20, borderRadius: 9999, background: WHITE, transform: state.monitorReply ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s' }} />
          </button>
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>Monitor for reply</div>
            <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, marginTop: 2, lineHeight: '1.5em' }}>
              After sending, Lira monitors the inbox and continues the conversation autonomously if the customer replies
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Test & Activate ────────────────────────────────────────────────────
function StepTestActivate({ state, setState, onActivate }: { state: WizardState; setState: (p: Partial<WizardState>) => void; onActivate: () => void }) {
  function fireTest() {
    setState({ testStatus: 'running' })
    setTimeout(() => setState({ testStatus: 'passed' }), 1800)
  }

  const results = [
    { ok: true,  label: 'Event received', detail: '' },
    { ok: true,  label: 'Conditions evaluated', detail: '3/3 passed' },
    { ok: true,  label: 'Template rendered', detail: '"Hi Jana Fischer, We noticed your recent payment…"' },
    { ok: true,  label: 'Customer matched', detail: 'Jana Fischer <jana.fischer@acme.de>' },
    { ok: false, label: 'Outreach', detail: 'NOT sent — this is a test', warn: true },
  ]

  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      {/* Left: JSON */}
      <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>Test payload</div>
        <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: 0 }}>
          Edit the JSON below to simulate a real event. Click "Fire test trigger" to see how Lira responds.
        </p>
        <textarea
          value={state.testPayload}
          onChange={e => setState({ testPayload: e.target.value })}
          rows={14}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12, lineHeight: '1.7em' }}
        />

        <button
          onClick={state.testStatus !== 'running' ? fireTest : undefined}
          disabled={state.testStatus === 'running'}
          style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 14, color: WHITE,
            background: state.testStatus === 'running' ? MUTED : PRIMARY,
            border: 'none', borderRadius: 14, padding: '14px 24px', cursor: state.testStatus === 'running' ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {state.testStatus === 'running' ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', width: 16, height: 16, border: `2px solid ${WHITE}`, borderTopColor: 'transparent', borderRadius: 9999 }} />
              Running test…
            </>
          ) : (
            <>
              <PlayIcon style={{ width: 15, height: 15 }} />
              Fire test trigger →
            </>
          )}
        </button>
      </div>

      {/* Right: results */}
      <div style={{ flex: '0 0 300px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {state.testStatus === 'idle' && (
          <div style={{ textAlign: 'center', padding: '40px 24px', background: PROFILE_BG, borderRadius: 20, border: '1px dashed rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🧪</div>
            <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 14, color: MUTED }}>Run the test to see results</div>
          </div>
        )}

        {state.testStatus === 'running' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.slice(0, 2).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: PROFILE_BG, borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: `2px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: 9999, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK }}>{r.label}…</span>
              </div>
            ))}
          </div>
        )}

        {state.testStatus === 'passed' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: r.warn ? AMBER_BG : GREEN_BG,
                border: `1px solid ${r.warn ? AMBER_BORDER : 'rgba(166,255,196,0.6)'}`,
                borderRadius: 12, padding: '12px 16px',
              }}>
                {r.warn
                  ? <ExclamationTriangleIcon style={{ width: 16, height: 16, color: AMBER, flexShrink: 0, marginTop: 1 }} />
                  : <CheckCircleIcon style={{ width: 16, height: 16, color: GREEN, flexShrink: 0, marginTop: 1 }} />
                }
                <div>
                  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: r.warn ? AMBER : GREEN }}>
                    {r.ok ? '✓' : '⚠'} {r.label}
                  </div>
                  {r.detail && <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: DARK, marginTop: 2 }}>{r.detail}</div>}
                </div>
              </div>
            ))}

            <div style={{ background: AI_BG, border: `2px solid ${AI_BORDER}`, borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircleIcon style={{ width: 20, height: 20, color: GREEN, flexShrink: 0 }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: GREEN }}>Test passed. Ready to activate.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main wizard ────────────────────────────────────────────────────────────────
export function SupportProactiveTriggerWizardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)
  const [state, setStateRaw] = useState<WizardState>(INITIAL_STATE)

  function setState(partial: Partial<WizardState>) {
    setStateRaw(prev => ({ ...prev, ...partial }))
  }

  function next() { if (step < 4) setStep(s => s + 1) }
  function back() { if (step > 0) setStep(s => s - 1) }

  const stepTitles = [
    'Choose your trigger event',
    'Set conditions',
    'Write your outreach template',
    'Configure channel & timing',
    'Test & activate',
  ]

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '16px 16px 12px' : '24px 32px 16px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => navigate('/support/proactive')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', gap: 4, fontFamily: FONT, fontWeight: 500, fontSize: 13, padding: 0 }}
            >
              <ChevronLeftIcon style={{ width: 14, height: 14 }} /> Back
            </button>
            <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.12)' }} />
            <div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Step {step + 1} of {STEPS.length}</div>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 18, color: DARK }}>{stepTitles[step]}</div>
            </div>
          </div>
          <button
            onClick={() => navigate('/support/proactive')}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 4 }}
          >
            <XMarkIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? undefined : 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 9999, flexShrink: 0,
                background: i < step ? GREEN : i === step ? PRIMARY : PROFILE_BG,
                border: `2px solid ${i < step ? GREEN : i === step ? PRIMARY : 'rgba(0,0,0,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: i === step ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
              }}>
                {i < step
                  ? <CheckIcon style={{ width: 12, height: 12, color: WHITE }} />
                  : <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 11, color: i === step ? WHITE : MUTED }}>{i + 1}</span>
                }
              </div>
              {!isMobile && (
                <span style={{ fontFamily: FONT, fontWeight: i === step ? 700 : 400, fontSize: 12, color: i === step ? DARK : MUTED, whiteSpace: 'nowrap' }}>
                  {s}
                </span>
              )}
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? GREEN : 'rgba(0,0,0,0.08)', minWidth: isMobile ? 12 : 24, borderRadius: 9999 }} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 14px' : '28px 32px' }}>
        {step === 0 && <StepEventType state={state} setState={setState} />}
        {step === 1 && <StepConditionBuilder state={state} setState={setState} />}
        {step === 2 && <StepOutreachTemplate state={state} setState={setState} />}
        {step === 3 && <StepChannelTiming state={state} setState={setState} />}
        {step === 4 && <StepTestActivate state={state} setState={setState} onActivate={() => navigate('/support/proactive')} />}
      </div>

      {/* Footer */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '14px 16px' : '16px 32px',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button
          onClick={() => navigate('/support/proactive')}
          style={{ fontFamily: FONT, fontWeight: 600, fontSize: 13, color: MUTED, background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 0' }}
        >
          Cancel
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={back}
              style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '12px 22px', cursor: 'pointer' }}
            >
              ← Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={next}
              style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE, background: PRIMARY, border: 'none', borderRadius: 14, padding: '12px 22px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}
            >
              Next →
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14, padding: '12px 22px', cursor: 'pointer' }}
              >
                Save as Draft
              </button>
              <button
                onClick={() => navigate('/support/proactive')}
                disabled={state.testStatus !== 'passed'}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE,
                  background: state.testStatus === 'passed' ? GREEN : MUTED,
                  border: 'none', borderRadius: 14, padding: '12px 22px',
                  cursor: state.testStatus === 'passed' ? 'pointer' : 'default',
                  boxShadow: state.testStatus === 'passed' ? '0 4px 14px rgba(5,150,105,0.35)' : 'none',
                }}
              >
                Activate Trigger →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
