/**
 * Screen 17 — Inbox: Voice Call Transcript View
 * Conversation detail showing a voice call handled by Lira's Nova Sonic AI.
 * Includes audio player, speaker-labeled transcript, sentiment markers, and search.
 */

import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  PauseIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon, StarIcon, CheckCircleIcon } from '@heroicons/react/24/solid'
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
const GREEN_DARK   = '#047857'
const GREEN_HEADING = '#064E3B'

type Sentiment = 'neutral' | 'frustrated' | 'relieved'

interface TranscriptLine {
  id: number
  speaker: 'customer' | 'lira'
  text: string
  timestamp: string
  sentiment?: Sentiment
}

const SENTIMENT_EMOJI: Record<Sentiment, string> = {
  neutral:    '😐',
  frustrated: '😤',
  relieved:   '😌',
}

const TRANSCRIPT: TranscriptLine[] = [
  { id: 1, speaker: 'customer', text: "Hi, I've been having trouble with my account. My billing keeps rejecting my card even though the details look correct.", timestamp: '0:04', sentiment: 'frustrated' },
  { id: 2, speaker: 'lira',     text: "Hello! I'm Lira, your AI support assistant. I'm sorry to hear about the billing issue. Could you confirm the last 4 digits of the card you're trying to add?", timestamp: '0:06' },
  { id: 3, speaker: 'customer', text: "It's 4821. I've tried three times already. It just says 'validation error'.", timestamp: '0:22', sentiment: 'frustrated' },
  { id: 4, speaker: 'lira',     text: "Thank you. I can see the issue — your billing address is registered with a German postal code format, but our system was expecting a 5-digit US format. Let me correct that for you right now.", timestamp: '0:28' },
  { id: 5, speaker: 'customer', text: "Oh really? I didn't realise that could be the issue.", timestamp: '0:41', sentiment: 'neutral' },
  { id: 6, speaker: 'lira',     text: "Yes, it's a common issue for our European customers. I've updated your region settings in the Stripe gateway. Your card validation should now accept German postal codes. Could you try adding it again now?", timestamp: '0:44' },
  { id: 7, speaker: 'customer', text: "Let me try... yes! It worked! Thank you so much, that was incredibly quick.", timestamp: '1:12', sentiment: 'relieved' },
  { id: 8, speaker: 'lira',     text: "Wonderful! I'm really glad that resolved it. Is there anything else I can help you with today?", timestamp: '1:18' },
  { id: 9, speaker: 'customer', text: "No, that's everything. You're very helpful, thank you.", timestamp: '1:28', sentiment: 'relieved' },
  { id: 10, speaker: 'lira',    text: "My pleasure! I'll send you a summary of this call by email. Have a great day!", timestamp: '1:32' },
]

// ── Audio player ───────────────────────────────────────────────────────────────
function AudioPlayer() {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0.35) // 35% through

  return (
    <div style={{
      background: BG, boxShadow: NEU_SHADOW, borderRadius: 16,
      padding: '14px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9999,
            background: AI_BG, border: `1px solid ${AI_BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <PhoneIcon style={{ width: 15, height: 15, color: PRIMARY }} />
          </div>
          <div>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK, display: 'block' }}>
              Call recording
            </span>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
              3m 42s · Nova Sonic voice call
            </span>
          </div>
        </div>
        <button style={{
          fontFamily: FONT, fontWeight: 500, fontSize: 11, color: PRIMARY,
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <ArrowDownTrayIcon style={{ width: 14, height: 14 }} />
          Download
        </button>
      </div>

      {/* Playback controls + scrub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setPlaying(v => !v)}
          style={{
            width: 36, height: 36, borderRadius: 9999,
            background: PRIMARY, border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
          }}
        >
          {playing
            ? <PauseIcon style={{ width: 16, height: 16, color: WHITE }} />
            : <PlayIcon style={{ width: 16, height: 16, color: WHITE }} />
          }
        </button>

        {/* Progress bar */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, flexShrink: 0 }}>1:18</span>
          <div
            style={{
              flex: 1, height: 4, borderRadius: 9999,
              background: 'rgba(88,90,104,0.2)',
              position: 'relative', cursor: 'pointer',
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              setProgress((e.clientX - rect.left) / rect.width)
            }}
          >
            <div style={{
              position: 'absolute', left: 0, top: 0,
              width: `${progress * 100}%`, height: '100%',
              background: PRIMARY, borderRadius: 9999,
            }} />
            <div style={{
              position: 'absolute',
              left: `${progress * 100}%`, top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 12, height: 12, borderRadius: 9999,
              background: PRIMARY, boxShadow: '0 2px 6px rgba(99,102,241,0.4)',
            }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, flexShrink: 0 }}>3:42</span>
        </div>
      </div>

      <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>
        Recording stored per your data retention settings
      </span>
    </div>
  )
}

// ── Transcript search ──────────────────────────────────────────────────────────
function TranscriptSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: BG, boxShadow: NEU_INSET, borderRadius: 12,
      padding: '8px 14px',
    }}>
      <MagnifyingGlassIcon style={{ width: 14, height: 14, color: MUTED, flexShrink: 0 }} />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Search transcript…"
        style={{
          fontFamily: FONT, fontWeight: 400, fontSize: 13, color: DARK,
          background: 'transparent', border: 'none', outline: 'none', flex: 1,
        }}
      />
    </div>
  )
}

// ── Transcript line ────────────────────────────────────────────────────────────
function TranscriptLine({
  line, highlight,
}: {
  line: TranscriptLine
  highlight: string
}) {
  const isLira = line.speaker === 'lira'

  function highlightText(text: string) {
    if (!highlight.trim()) return <>{text}</>
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return (
      <>
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} style={{ background: '#FEF08A', color: DARK, borderRadius: 3 }}>{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      justifyContent: isLira ? 'flex-end' : 'flex-start',
    }}>
      {/* Sentiment marker (left side for customer, right side for lira) */}
      {!isLira && line.sentiment && (
        <div style={{ paddingTop: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }} title={line.sentiment}>
            {SENTIMENT_EMOJI[line.sentiment]}
          </span>
        </div>
      )}

      {/* Avatar (customer left, Lira right) */}
      {!isLira && (
        <div style={{
          width: 28, height: 28, borderRadius: 9999, background: '#818CF8',
          boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 4,
        }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 9, color: WHITE }}>JF</span>
        </div>
      )}

      {/* Bubble */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: isLira ? 'flex-end' : 'flex-start' }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: isLira ? PRIMARY : MUTED }}>
            {isLira ? 'Lira' : 'Jana Fischer (Customer)'}
          </span>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 10, color: MUTED }}>{line.timestamp}</span>
        </div>
        <div style={{
          background: isLira ? AI_BG : WHITE,
          border: isLira ? `1px solid ${AI_BORDER}` : 'none',
          borderRadius: isLira ? '16px 0px 16px 16px' : '0px 16px 16px 16px',
          boxShadow: NEU_SHADOW,
          padding: '10px 14px',
        }}>
          <p style={{ fontFamily: FONT, fontWeight: 400, fontSize: 13, lineHeight: '1.6em', color: DARK, margin: 0 }}>
            {highlightText(line.text)}
          </p>
        </div>
      </div>

      {/* Lira avatar */}
      {isLira && (
        <div style={{
          width: 28, height: 28, borderRadius: 9999, background: PRIMARY,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginTop: 4,
        }}>
          <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
        </div>
      )}

      {isLira && line.sentiment && (
        <div style={{ paddingTop: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 14 }} title={line.sentiment}>
            {SENTIMENT_EMOJI[line.sentiment]}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Right sidebar ──────────────────────────────────────────────────────────────
function RightSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 9999, background: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SparklesIcon style={{ width: 13, height: 13, color: WHITE }} />
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 16, color: DARK }}>Interaction Summary</span>
        </div>

        <div style={{ background: PROFILE_BG, borderRadius: 16, padding: '17px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ label: 'Customer', value: 'Jana Fischer' }, { label: 'Tier', value: 'Standard', pill: true }].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>{row.label}</span>
              {row.pill ? (
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: '#4338CA', background: '#E0E7FF', borderRadius: 9999, padding: '2px 10px' }}>{row.value}</span>
              ) : (
                <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: DARK }}>{row.value}</span>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED }}>Churn Risk</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheckIcon style={{ width: 13, height: 13, color: GREEN }} />
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 12, color: GREEN }}>Low</span>
            </div>
          </div>
        </div>

        {/* Voice stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          {[
            { label: 'Call Duration', value: '3:42', icon: PhoneIcon, color: PRIMARY },
            { label: 'Resolved', value: 'Yes', color: GREEN },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 16, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>{s.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.icon && <s.icon style={{ width: 14, height: 14, color: MUTED }} />}
                <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: s.label === 'Resolved' ? 16 : 22, color: s.color, lineHeight: 1 }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: PROFILE_BG, borderRadius: 14, padding: '10px 14px' }}>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: MUTED, display: 'block' }}>Outcome</span>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: GREEN_HEADING, display: 'block', marginTop: 3 }}>
            Resolved — no transfer to human agent
          </span>
        </div>

        {/* Sentiment trend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Sentiment Arc</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>😤</span>
            <div style={{ flex: 1, height: 3, borderRadius: 9999, background: `linear-gradient(to right, #DC2626, #EAB308, ${GREEN})` }} />
            <span style={{ fontSize: 18 }}>😌</span>
          </div>
          <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>Frustrated → Relieved</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Knowledge Used</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['Billing_FAQ_v2', 'Stripe_Int_Manual'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '6px 12px' }}>
                <DocumentTextIcon style={{ width: 12, height: 12, color: MUTED }} />
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: DARK }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Tags</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Voice', color: PRIMARY_DARK },
              { label: 'Resolved autonomously', color: GREEN },
              { label: 'Billing', color: PRIMARY_DARK },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', alignItems: 'center', background: BG, boxShadow: NEU_SHADOW, borderRadius: 9999, padding: '5px 12px' }}>
                <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 11, color: t.color }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: BG, boxShadow: NEU_SHADOW, borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: WHITE,
          background: PRIMARY, border: 'none', borderRadius: 16, padding: '13px 0', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <ArchiveBoxIcon style={{ width: 16, height: 16, color: WHITE }} />
          Archive Ticket
        </button>
        <button style={{
          fontFamily: FONT, fontWeight: 600, fontSize: 14, color: DARK,
          background: BG, boxShadow: NEU_SHADOW, border: 'none', borderRadius: 16,
          padding: '13px 0', cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <ClockIcon style={{ width: 16, height: 16, color: MUTED }} />
          View Customer History
        </button>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function SupportVoiceTranscriptPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')

  const filtered = TRANSCRIPT.filter(l =>
    !search.trim() || l.text.toLowerCase().includes(search.toLowerCase())
  )

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
          <button onClick={() => navigate('/support/inbox')} style={{
            width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW,
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ChevronLeftIcon style={{ width: 18, height: 18, color: DARK }} />
          </button>
          <div style={{
            width: 32, height: 32, borderRadius: 9999, background: '#818CF8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: NEU_SHADOW, flexShrink: 0,
          }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: WHITE }}>JF</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: isMobile ? 14 : 16, color: DARK }}>Jana Fischer</span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, color: GREEN_DARK, background: '#D1FAE5', borderRadius: 9999, padding: '2px 8px', textTransform: 'uppercase' }}>
                Resolved
              </span>
              {/* Voice indicator */}
              <span style={{
                fontFamily: FONT, fontWeight: 700, fontSize: 10, color: PRIMARY,
                background: AI_BG, border: `1px solid ${AI_BORDER}`,
                borderRadius: 9999, padding: '2px 8px',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <PhoneIcon style={{ width: 10, height: 10 }} />
                Voice
              </span>
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED }}>
              Ticket #LRA-8845 · Voice call · 3m 42s
            </span>
          </div>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <button style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowTopRightOnSquareIcon style={{ width: 18, height: 18, color: MUTED }} />
            </button>
            <button style={{ width: 40, height: 40, borderRadius: 9999, background: BG, boxShadow: NEU_SHADOW, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        {/* Transcript panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
          overflowY: isMobile ? 'visible' : 'auto', paddingRight: isMobile ? 0 : 4,
        }}>
          {/* Audio player */}
          <AudioPlayer />

          {/* Search */}
          <TranscriptSearch value={search} onChange={setSearch} />

          {/* Sentiment legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 4px' }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase', color: MUTED }}>Sentiment markers</span>
            {(['neutral', 'frustrated', 'relieved'] as Sentiment[]).map(s => (
              <span key={s} style={{ fontFamily: FONT, fontWeight: 400, fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 13 }}>{SENTIMENT_EMOJI[s]}</span>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </span>
            ))}
          </div>

          {/* Transcript bubbles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 14, color: MUTED }}>
                  No matches for "{search}"
                </span>
              </div>
            ) : (
              filtered.map(line => (
                <TranscriptLine key={line.id} line={line} highlight={search} />
              ))
            )}
          </div>
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
