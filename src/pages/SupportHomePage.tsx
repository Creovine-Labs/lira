import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/hooks'
import {
  ArrowRightIcon,
  BoltIcon,
  BookOpenIcon,
  ChartBarIcon,
  ChatBubbleLeftEllipsisIcon,
  CpuChipIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  ServerStackIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { ONBOARDING_STEPS } from '@/features/support/types'
import { SupportOnboardingPage } from './SupportOnboardingPage'

// ── Design tokens (Figma node 1-3227) ────────────────────────────────────────

const BG = '#E8EAF0'

// ── Activation modal diagram nodes (Figma node 1-2) ─────────────────────────
const ACTIVATE_NODES = [
  { label: 'CUSTOMER\nEMAIL',  icon: EnvelopeIcon,              highlighted: false },
  null,
  { label: 'LIRA AI',          icon: CpuChipIcon,               highlighted: true  },
  null,
  { label: 'REPLY &\nACTION', icon: BoltIcon,                  highlighted: false },
  null,
  { label: 'CRM',              icon: ServerStackIcon,           highlighted: false },
] as const

/** Neumorphic outer shadow (effect_EV9B07) */
const NEU_SHADOW =
  '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'

/** Neumorphic inner shadow (effect_0F2AYZ) */
const NEU_INSET =
  'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'

// ── SVG Donut Chart ───────────────────────────────────────────────────────────
function DonutChart({ autonomous, escalated }: { autonomous: number; escalated: number }) {
  const r = 50
  const cx = 64
  const cy = 64
  const circumference = 2 * Math.PI * r
  const autoDash = (autonomous / 100) * circumference
  const escaDash = (escalated / 100) * circumference

  return (
    <div style={{ position: 'relative', width: 128, height: 128, margin: '0 auto' }}>
      <svg width={128} height={128} viewBox="0 0 128 128">
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={14} />
        {/* Green — Autonomous */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#10B981"
          strokeWidth={14}
          strokeLinecap="butt"
          strokeDasharray={`${autoDash} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Amber — Escalated */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#FBBF24"
          strokeWidth={14}
          strokeLinecap="butt"
          strokeDasharray={`${escaDash} ${circumference}`}
          strokeDashoffset={-autoDash}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, width: 128, height: 128,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, lineHeight: 1.2, color: '#2E3040' }}>
          {autonomous}%
        </span>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#585A68' }}>
          Autonomous
        </span>
      </div>
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, badge, badgeBg, badgeColor, sub, subColor,
}: {
  label: string; value: string
  badge?: string; badgeBg?: string; badgeColor?: string
  sub?: string; subColor?: string
}) {
  return (
    <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#585A68' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 36, lineHeight: '40px', color: '#2E3040' }}>
          {value}
        </span>
        {badge && (
          <span style={{ background: badgeBg, color: badgeColor, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 16 }}>
            {badge}
          </span>
        )}
        {sub && !badge && (
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, color: subColor ?? '#2E3040' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Quick Action Button ───────────────────────────────────────────────────────
function QuickAction({
  icon: Icon, label, onClick,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  label: string; onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', flex: 1, cursor: 'pointer', border: 'none', minWidth: 0 }}
    >
      <Icon style={{ width: 20, height: 20, color: '#2E3040' }} />
      <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, lineHeight: '15px', textAlign: 'center', color: '#2E3040', marginTop: 8, whiteSpace: 'pre-line' }}>
        {label}
      </span>
    </button>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function SupportHomePage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [isActivated, setIsActivated] = useState(
    () => localStorage.getItem('lira_support_activated') === 'true'
  )
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (localStorage.getItem('lira_support_activated') === 'true') return false
    return localStorage.getItem('lira_support_onboarding_step') !== null
  })
  const [showActivateModal, setShowActivateModal] = useState(() => {
    if (localStorage.getItem('lira_support_activated') === 'true') return false
    return localStorage.getItem('lira_support_onboarding_step') === null
  })

  function handleActivated() {
    setIsActivated(true)
    setShowOnboarding(false)
    setShowActivateModal(false)
  }

  return (
    <div style={{ background: BG, minHeight: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* ── Top App Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 32px', height: 72, background: BG, flexShrink: 0 }}>
        {/* Search bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 9999, boxShadow: NEU_INSET, background: BG, flex: 1, maxWidth: 480 }}>
          <MagnifyingGlassIcon style={{ width: 18, height: 18, color: '#6B7280', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 400, fontSize: 14, color: '#6B7280' }}>
            Search support tickets or customers...
          </span>
        </div>
        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9999, boxShadow: NEU_SHADOW, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
              <path d="M8 0C8.552 0 9 0.448 9 1V1.07C11.838 1.554 14 4.027 14 7V13L16 15V16H0V15L2 13V7C2 4.027 4.162 1.554 7 1.07V1C7 0.448 7.448 0 8 0ZM8 20C9.105 20 10 19.105 10 18H6C6 19.105 6.895 20 8 20Z" fill="#585A68" />
            </svg>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 9999, boxShadow: NEU_SHADOW, background: BG, padding: 4, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, borderRadius: 9999, background: 'linear-gradient(135deg, #818CF8, #4F46E5)' }} />
          </div>
        </div>
      </div>

      {/* ── Dashboard Content ── */}
      <div style={{ flex: 1, padding: isMobile ? 16 : 32, display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 32 }}>

        {/* ── Resume Setup Banner (mid-onboarding, not yet activated) ── */}
        {!isActivated && !showOnboarding && (() => {
          const savedStep = localStorage.getItem('lira_support_onboarding_step')
          const stepIndex = ONBOARDING_STEPS.findIndex(s => s.id === savedStep)
          const stepLabel = stepIndex >= 0 ? ONBOARDING_STEPS[stepIndex].label : 'Setup'
          const pct = stepIndex >= 0 ? Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100) : 0
          return (
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 20, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <SparklesIcon style={{ width: 18, height: 18, color: '#6366F1' }} />
              </div>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#2E3040' }}>
                  Setup in progress &mdash; <span style={{ color: '#6366F1' }}>{stepLabel}</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 9999, boxShadow: NEU_INSET }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #818CF8, #6366F1)', borderRadius: 9999, transition: 'width 0.3s ease' }} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 11, color: '#585A68', flexShrink: 0 }}>{stepIndex + 1} / {ONBOARDING_STEPS.length}</span>
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(true)}
                style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '10px 22px', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 13, color: '#6366F1', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
              >
                Resume Setup
                <ArrowRightIcon style={{ width: 12, height: 12 }} />
              </button>
            </div>
          )
        })()}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 24 }}>
          <StatCard label="Open Inbox"     value="0" />
          <StatCard label="Resolved Today" value="0" />
          <StatCard label="Proactive Sent" value="0" />
          <StatCard label="Escalated"      value="0" />
        </div>

        {/* ── Main 3-Column Grid ── */}
        <div style={{ display: 'flex', gap: isMobile ? 16 : 24, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>

          {/* ── LEFT: Recent Activity ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: '0 4px' }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E3040' }}>
                Recent Activity
              </span>
            </div>
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>No recent activity yet.</span>
            </div>
          </div>

          {/* ── CENTER: Inbox Preview ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ padding: '0 4px' }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E3040' }}>
                Inbox Preview
              </span>
            </div>
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 180 }}>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: 12, color: '#94A3B8' }}>No open tickets.</span>
              </div>
              {/* Open Inbox button */}
              <div style={{ display: 'flex', justifyContent: 'center', padding: 16, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                <button
                  onClick={() => navigate('/support/inbox')}
                  style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, color: '#4F46E5' }}
                >
                  Open Inbox
                  <ArrowRightIcon style={{ width: 10, height: 10 }} />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Alerts + Quick Actions + Donut ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 32 }}>

            {/* Active Alerts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '0 4px' }}>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E3040' }}>
                  Active Alerts
                </span>
              </div>
              <div style={{ background: BG, boxShadow: NEU_INSET, borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 500, fontSize: 12, color: '#94A3B8' }}>No active alerts.</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: '0 4px' }}>
                <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E3040' }}>
                  Quick Actions
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <QuickAction icon={BoltIcon}     label="New Trigger" onClick={() => navigate('/support/proactive/new')} />
                  <QuickAction icon={BookOpenIcon} label={'Add\nKnowledge'} onClick={() => navigate('/support/knowledge')} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <QuickAction icon={ChartBarIcon}                label={'View\nAnalytics'} onClick={() => navigate('/support/analytics')} />
                  <QuickAction icon={ChatBubbleLeftEllipsisIcon}  label="Test Lira" />
                </div>
              </div>
            </div>

            {/* Donut Chart — Resolution Rate */}
            <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: '24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#585A68', textAlign: 'center' }}>
                Resolution Rate
              </span>
              <DonutChart autonomous={0} escalated={0} />
              {/* Legend */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 9999, background: '#10B981', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, color: '#2E3040' }}>Autonomous</span>
                  </div>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, color: '#2E3040' }}>0%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 9999, background: '#FBBF24', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, color: '#585A68' }}>Escalated</span>
                  </div>
                  <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 10, color: '#585A68' }}>0%</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Screen 2: Activation Modal (Figma node 1-2) ── */}
      {showActivateModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,27,38,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 50, padding: isMobile ? 0 : 16, overflowY: isMobile ? 'auto' : 'visible' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowActivateModal(false) }}
        >
          <div
            style={{ background: BG, borderRadius: isMobile ? 0 : 24, padding: isMobile ? 24 : 40, width: '100%', maxWidth: isMobile ? '100%' : 640, boxShadow: NEU_SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflowY: isMobile ? 'auto' : 'visible', maxHeight: isMobile ? '100%' : 'none' }}
          >
            {/* Close */}
            <button
              onClick={() => setShowActivateModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, width: 32, height: 32, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <XMarkIcon style={{ width: 14, height: 14, color: '#585A68' }} />
            </button>

            {/* Icon */}
            <div style={{ width: 80, height: 80, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
              <ChatBubbleLeftEllipsisIcon style={{ width: 36, height: 36, color: '#6366F1' }} />
            </div>

            {/* Heading + subtitle */}
            <div style={{ textAlign: 'center', marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: isMobile ? 22 : 28, letterSpacing: '-0.025em', color: '#2E3040', lineHeight: 1.25 }}>
                Activate Lira Customer Support
              </span>
              <span style={{ fontWeight: 400, fontSize: isMobile ? 15 : 18, color: '#585A68', lineHeight: 1.55 }}>
                Set up takes 10 minutes. By the end, Lira will be answering your customer emails.
              </span>
            </div>

            {/* Architecture Diagram */}
            <div style={{ boxShadow: NEU_INSET, borderRadius: 24, padding: isMobile ? 20 : 32, alignSelf: 'stretch', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              {ACTIVATE_NODES.map((node, i) =>
                node === null ? (
                  <div key={i} style={{ flex: isMobile ? 'none' : 1, width: isMobile ? 0 : undefined, height: isMobile ? 0 : 1, background: '#D0D2DC', display: isMobile ? 'none' : 'block' }} />
                ) : (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{ width: node.highlighted ? 64 : 48, height: node.highlighted ? 64 : 48, borderRadius: node.highlighted ? 16 : 12, background: BG, boxShadow: NEU_SHADOW, border: node.highlighted ? '2px solid rgba(99,102,241,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <node.icon style={{ width: node.highlighted ? 22 : 16, height: node.highlighted ? 22 : 16, color: node.highlighted ? '#6366F1' : '#585A68' }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#585A68', textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                      {node.label}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Start Setup */}
            <button
              onClick={() => { setShowActivateModal(false); setShowOnboarding(true) }}
              style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: '16px 32px', alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', border: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 18, color: '#6366F1', marginBottom: 16 }}
            >
              Start Setup
              <ArrowRightIcon style={{ width: 16, height: 16 }} />
            </button>

            {/* Learn more */}
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#585A68', marginBottom: 32 }}>
              Learn more
            </button>

            {/* Footer */}
            <div style={{ borderTop: '1px solid #D0D2DC', paddingTop: 24, alignSelf: 'stretch', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontWeight: 400, fontSize: 14, color: '#585A68', textAlign: 'center' }}>
                Already have integrations connected? Lira will reuse your existing connections.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Onboarding Modal (Steps 1-7) ── */}
      {showOnboarding && (
        <SupportOnboardingPage
          modalMode
          onClose={() => setShowOnboarding(false)}
          onActivated={handleActivated}
        />
      )}
    </div>
  )
}
