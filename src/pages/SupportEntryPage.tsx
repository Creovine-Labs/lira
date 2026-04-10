import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  BoltIcon,
  ChatBubbleLeftEllipsisIcon,
  CpuChipIcon,
  EnvelopeIcon,
  ServerStackIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useIsMobile } from '@/hooks'

const BG = '#E8EAF0'
const NEU_SHADOW = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'

const DIAGRAM_NODES = [
  { label: 'CUSTOMER\nEMAIL', icon: EnvelopeIcon, highlighted: false },
  null, // connector
  { label: 'LIRA AI', icon: CpuChipIcon, highlighted: true },
  null,
  { label: 'REPLY &\nACTION', icon: BoltIcon, highlighted: false },
  null,
  { label: 'CRM', icon: ServerStackIcon, highlighted: false },
]

/**
 * Support module entry point.
 * If the module has been activated, redirects to the live dashboard.
 * If not, shows a centered CTA that opens the activation modal.
 * The activation modal (Figma node 1-2) overlays the app with a blurred backdrop.
 */
export function SupportEntryPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [modalOpen, setModalOpen] = useState(false)
  const isActivated = localStorage.getItem('lira_support_activated') === 'true'

  if (isActivated) {
    return <Navigate to="/support/home" replace />
  }

  return (
    <div
      style={{
        background: BG,
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Plus Jakarta Sans, sans-serif',
      }}
    >
      {/* ── Pre-activation centered CTA ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: 32, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChatBubbleLeftEllipsisIcon style={{ width: 36, height: 36, color: '#6366F1' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 24, color: '#2E3040' }}>Customer Support</span>
          <span style={{ fontWeight: 400, fontSize: 14, color: '#585A68', maxWidth: 320, lineHeight: 1.6 }}>
            Activate Lira's autonomous support module to handle customer emails, chat, and voice.
          </span>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', border: 'none', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14, color: '#6366F1' }}
        >
          Activate Customer Support
          <ArrowRightIcon style={{ width: 14, height: 14 }} />
        </button>
      </div>

      {/* ── Activation Modal (Figma node 1-2) ── */}
      {modalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(26,27,38,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center', zIndex: 50, padding: isMobile ? 0 : 16, overflowY: isMobile ? 'auto' : 'visible' }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
        <div
            style={{ background: BG, borderRadius: isMobile ? 0 : 24, padding: isMobile ? 24 : 40, width: '100%', maxWidth: isMobile ? '100%' : 640, boxShadow: NEU_SHADOW, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflowY: 'auto', minHeight: isMobile ? '100%' : 'auto' }}
          >
            {/* Close */}
            <button
              onClick={() => setModalOpen(false)}
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
            <div style={{ background: 'rgba(255,255,255,0)', boxShadow: NEU_INSET, borderRadius: 24, padding: '32px', alignSelf: 'stretch', marginBottom: 40, display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'center' : 'space-between', gap: 8, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              {DIAGRAM_NODES.map((node, i) =>
                node === null ? (
                  <div key={i} style={{ flex: 1, height: 1, background: '#D0D2DC', display: isMobile ? 'none' : 'block' }} />
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
              onClick={() => navigate('/support/onboarding')}
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
    </div>
  )
}
