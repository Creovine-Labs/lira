/**
 * Screen 22 — Proactive Support Engine: Trigger List
 * Overview of all configured proactive triggers + pre-built templates.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  QueueListIcon,
  BoltIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
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
const AMBER        = '#D97706'
const RED          = '#DC2626'
const PROFILE_BG   = 'rgba(232,234,240,0.5)'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Trigger {
  id: string
  name: string
  event: string
  channel: 'email' | 'voice'
  firedCount: number
  ticketsPrevented: number
}

const INIT_TRIGGERS: Trigger[] = [
  { id: 't1', name: 'Payment Failed — Retry Prompt',     event: 'payment.failed',       channel: 'email', firedCount: 12, ticketsPrevented: 5 },
  { id: 't2', name: 'KYC Blocked — Document Request',    event: 'kyc.blocked',           channel: 'email', firedCount: 4,  ticketsPrevented: 4 },
  { id: 't3', name: 'Suspicious Transaction Alert',      event: 'fraud.flagged',         channel: 'voice', firedCount: 2,  ticketsPrevented: 1 },
  { id: 't4', name: 'Subscription Expiring — Renewal',   event: 'subscription.expiring', channel: 'email', firedCount: 7,  ticketsPrevented: 3 },
  { id: 't5', name: 'API Error Threshold Exceeded',      event: 'api.error.spike',       channel: 'email', firedCount: 3,  ticketsPrevented: 2 },
  { id: 't6', name: 'Onboarding Stalled — Nudge',        event: 'account.inactive',      channel: 'email', firedCount: 19, ticketsPrevented: 9 },
]

const TEMPLATES = [
  { name: 'Payment Failed – Retry Prompt',          event: 'payment.failed',       desc: 'Reach out when a payment fails with a retry link and helpful context.' },
  { name: 'KYC Blocked – Document Request',          event: 'kyc.blocked',          desc: 'Ask for the missing document before customer frustration builds up.' },
  { name: 'Suspicious Transaction – Auth Check',    event: 'fraud.flagged',        desc: 'Confirm the transaction was authorized before it becomes a fraud complaint.' },
  { name: 'Subscription Expiring – Renewal Reminder', event: 'subscription.expiring', desc: 'Remind customers before their subscription ends with a renewal link.' },
  { name: 'API Error Threshold – Eng Alert',        event: 'api.error.spike',      desc: 'Alert engineering and notify affected customers automatically.' },
  { name: 'Onboarding Stalled – Activation Nudge', event: 'account.inactive',     desc: 'Re-engage customers who got stuck during onboarding after X days.' },
]

// ── Toggle ─────────────────────────────────────────────────────────────────────
function TriggerToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onToggle() }}
      style={{
        display: 'flex', alignItems: 'center',
        width: 48, height: 26,
        background: active ? PRIMARY : 'rgba(88,90,104,0.3)',
        borderRadius: 9999, padding: 3, border: 'none', cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <div style={{
        width: 20, height: 20, borderRadius: 9999, background: WHITE,
        transform: active ? 'translateX(22px)' : 'translateX(0)',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── Trigger card ───────────────────────────────────────────────────────────────
function TriggerCard({ trigger, active, onToggle, onDelete }: {
  trigger: Trigger; active: boolean; onToggle: () => void; onDelete: () => void
}) {
  return (
    <div style={{
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: 22,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      {/* Top row: name + toggle */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: AI_BG, border: `1px solid ${AI_BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BoltIcon style={{ width: 17, height: 17, color: PRIMARY }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK, lineHeight: '1.3em' }}>
            {trigger.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, flexWrap: 'wrap' }}>
            <code style={{
              fontFamily: 'monospace', fontSize: 11, color: PRIMARY,
              background: AI_BG, border: `1px solid ${AI_BORDER}`,
              borderRadius: 6, padding: '2px 8px',
            }}>
              {trigger.event}
            </code>
            {trigger.channel === 'email'
              ? <EnvelopeIcon style={{ width: 13, height: 13, color: MUTED }} />
              : <PhoneIcon style={{ width: 13, height: 13, color: GREEN }} />
            }
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: MUTED }}>
              {trigger.channel === 'email' ? 'Email' : 'Voice'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
          <TriggerToggle active={active} onToggle={onToggle} />
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: active ? GREEN : MUTED }}>
            {active ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />

      {/* Stats */}
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: DARK, lineHeight: 1 }}>{trigger.firedCount}×</span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>this week</span>
        </div>
        <div style={{ width: 1, background: 'rgba(0,0,0,0.06)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 20, color: GREEN, lineHeight: 1 }}>{trigger.ticketsPrevented}</span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>tickets prevented</span>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { icon: PencilIcon, label: 'Edit', onClick: () => {} },
          { icon: DocumentDuplicateIcon, label: 'Duplicate', onClick: () => {} },
          { icon: QueueListIcon, label: 'Activity', onClick: () => {} },
        ].map(a => (
          <button
            key={a.label}
            onClick={a.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontFamily: FONT, fontWeight: 500, fontSize: 11, color: MUTED,
              background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 10,
              padding: '7px 10px', cursor: 'pointer',
            }}
          >
            <a.icon style={{ width: 12, height: 12 }} />
            {a.label}
          </button>
        ))}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontFamily: FONT, fontWeight: 500, fontSize: 11, color: RED,
            background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 10,
            padding: '7px 10px', cursor: 'pointer', marginLeft: 'auto',
          }}
        >
          <TrashIcon style={{ width: 12, height: 12 }} />
          Delete
        </button>
      </div>
    </div>
  )
}

// ── Template card ──────────────────────────────────────────────────────────────
function TemplateCard({ template, onUse }: { template: typeof TEMPLATES[0]; onUse: () => void }) {
  return (
    <div style={{
      background: PROFILE_BG, borderRadius: 16, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 10,
      border: '1px solid rgba(0,0,0,0.05)',
    }}>
      <div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, marginBottom: 4 }}>{template.name}</div>
        <code style={{ fontFamily: 'monospace', fontSize: 10, color: PRIMARY, background: AI_BG, borderRadius: 5, padding: '2px 7px' }}>
          {template.event}
        </code>
      </div>
      <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, margin: 0, lineHeight: '1.5em' }}>
        {template.desc}
      </p>
      <button
        onClick={onUse}
        style={{
          fontFamily: FONT, fontWeight: 700, fontSize: 12, color: PRIMARY,
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 0, textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        Use this template →
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function SupportProactiveTriggerListPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [triggers, setTriggers] = useState(INIT_TRIGGERS)
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>({
    t1: true, t2: true, t3: true, t4: false, t5: true, t6: true,
  })

  const activeCount = Object.values(activeMap).filter(Boolean).length

  function toggleTrigger(id: string) {
    setActiveMap(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function deleteTrigger(id: string) {
    setTriggers(prev => prev.filter(t => t.id !== id))
    setActiveMap(prev => { const next = { ...prev }; delete next[id]; return next })
  }

  return (
    <div style={{
      fontFamily: FONT, background: BG, display: 'flex', flexDirection: 'column',
      flex: 1, minHeight: 0, height: isMobile ? 'auto' : '100%',
      overflow: isMobile ? 'auto' : 'hidden',
    }}>
      {/* Header */}
      <div style={{
        flexShrink: 0, padding: isMobile ? '20px 16px' : '28px 32px 20px',
        boxShadow: '0px 4px 12px 0px rgba(0,0,0,0.03)',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: AI_BG, border: `1px solid ${AI_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BoltIcon style={{ width: 20, height: 20, color: PRIMARY }} />
            </div>
            <div>
              <h1 style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: DARK, margin: 0 }}>Proactive Triggers</h1>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>Lira reaches out before customers know they have a problem</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('/support/proactive/activity')}
              style={{
                fontFamily: FONT, fontWeight: 600, fontSize: 13, color: DARK,
                background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 14,
                padding: '11px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
              }}
            >
              <ChartBarIcon style={{ width: 15, height: 15, color: MUTED }} />
              Activity Log
            </button>
            <button
              onClick={() => navigate('/support/proactive/new')}
              style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 13, color: WHITE,
                background: PRIMARY, border: 'none', borderRadius: 14,
                padding: '11px 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              }}
            >
              <PlusIcon style={{ width: 15, height: 15, color: WHITE }} />
              New Trigger
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Active triggers', value: `${activeCount}`, color: PRIMARY },
            { label: 'Outreaches this week', value: '47', color: DARK },
            { label: 'Ticket prevention rate', value: '38%', color: GREEN },
          ].map(s => (
            <div key={s.label} style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: '14px 20px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 22, color: s.color, lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger grid + templates */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 12px 32px' : '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Active triggers */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
            {triggers.map(trigger => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                active={activeMap[trigger.id] ?? false}
                onToggle={() => toggleTrigger(trigger.id)}
                onDelete={() => deleteTrigger(trigger.id)}
              />
            ))}
          </div>

          {triggers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 32px', background: BG, boxShadow: NEU_SHADOW, borderRadius: 20 }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⚡</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: DARK, marginBottom: 8 }}>No triggers yet</div>
              <div style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED, marginBottom: 24 }}>
                Create your first trigger to start reaching out proactively
              </div>
              <button
                onClick={() => navigate('/support/proactive/new')}
                style={{
                  fontFamily: FONT, fontWeight: 700, fontSize: 14, color: WHITE,
                  background: PRIMARY, border: 'none', borderRadius: 14,
                  padding: '13px 24px', cursor: 'pointer',
                }}
              >
                Create your first trigger →
              </button>
            </div>
          )}
        </div>

        {/* Pre-built templates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SparklesIcon style={{ width: 16, height: 16, color: PRIMARY }} />
            <h2 style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK, margin: 0 }}>Start from a template</h2>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>— pre-built for common fintech scenarios</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
            {TEMPLATES.map(t => (
              <TemplateCard
                key={t.event}
                template={t}
                onUse={() => navigate('/support/proactive/new')}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
