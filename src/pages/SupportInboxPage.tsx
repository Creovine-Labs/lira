import { useState } from 'react'
import {
  AdjustmentsHorizontalIcon,
  ChatBubbleLeftEllipsisIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import { useIsMobile } from '@/hooks'

// ── Design tokens ──────────────────────────────────────────────────────────────
const BG = '#E8EAF0'
const NEU_SHADOW = '-6px -6px 12px 0px rgba(255,255,255,0.6), 6px 6px 12px 0px rgba(0,0,0,0.08)'
const NEU_INSET = 'inset -4px -4px 8px 0px rgba(255,255,255,0.5), inset 4px 4px 8px 0px rgba(0,0,0,0.06)'
const DARK = '#2E3040'
const MUTED = '#585A68'
const SOFT = '#8A8C9A'
const PRIMARY = '#6366F1'
const FONT = 'Plus Jakarta Sans, sans-serif'

// ── Filter state types ─────────────────────────────────────────────────────────
type StatusFilter = 'all' | 'open' | 'pending' | 'closed'
type ChannelFilter = 'all' | 'email' | 'chat' | 'voice'
type SortOrder = 'newest' | 'oldest' | 'urgent'

// ── Status pill ────────────────────────────────────────────────────────────────
function StatusPill({
  label,
  dot,
  active,
  onClick,
}: {
  label: string
  dot: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT,
        display: 'flex', alignItems: 'center', gap: 8,
        alignSelf: 'stretch',
        padding: '6px 12px',
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        background: active ? BG : 'transparent',
        boxShadow: active ? NEU_INSET : 'none',
        fontWeight: active ? 600 : 400,
        fontSize: 12,
        lineHeight: '16px',
        color: active ? DARK : MUTED,
        textAlign: 'left',
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 9999, background: dot, flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ── Channel button ─────────────────────────────────────────────────────────────
function ChannelBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FONT,
        display: 'flex', alignItems: 'center', gap: 8,
        alignSelf: 'stretch',
        padding: '6px 12px',
        borderRadius: 16,
        border: 'none',
        cursor: 'pointer',
        background: active ? BG : 'transparent',
        boxShadow: active ? NEU_INSET : 'none',
        fontWeight: active ? 600 : 400,
        fontSize: 12,
        color: active ? DARK : MUTED,
        textAlign: 'left',
      }}
    >
      <Icon style={{ width: 14, height: 14, color: active ? PRIMARY : SOFT, flexShrink: 0 }} />
      {label}
    </button>
  )
}

// ── Avatar initials ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#818CF8', '#F472B6', '#34D399', '#60A5FA', '#FBBF24', '#A78BFA',
]
function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const bg = avatarColor(name)
  return (
    <div style={{
      width: size, height: size, borderRadius: 9999,
      background: bg, boxShadow: NEU_SHADOW,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: size * 0.33, color: '#fff' }}>
        {initials(name)}
      </span>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyConversations({ filter }: { filter: string }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 9999, background: BG,
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <EnvelopeIcon style={{ width: 24, height: 24, color: SOFT }} />
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>
          No conversations
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: SOFT, maxWidth: 200, lineHeight: 1.55 }}>
          {filter === 'all'
            ? 'No conversations yet. They will appear here once customers reach out.'
            : `No ${filter} conversations right now.`}
        </span>
      </div>
    </div>
  )
}

// ── Preview empty state ────────────────────────────────────────────────────────
function PreviewEmpty() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 9999, background: BG,
        boxShadow: NEU_SHADOW, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ChatBubbleLeftEllipsisIcon style={{ width: 24, height: 24, color: SOFT }} />
      </div>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 14, color: DARK }}>
          Select a conversation
        </span>
        <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: SOFT, maxWidth: 200, lineHeight: 1.55 }}>
          Click any conversation from the list to preview it here.
        </span>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function SupportInboxPage() {
  const isMobile = useIsMobile()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [search, setSearch] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Shared filter panel content (rendered in sidebar on desktop, in drawer on mobile)
  const filterPanel = (
    <>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderRadius: 16,
        boxShadow: NEU_INSET, background: BG,
      }}>
        <MagnifyingGlassIcon style={{ width: 14, height: 14, color: SOFT, flexShrink: 0 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{
            fontFamily: FONT, fontWeight: 600, fontSize: 12, color: DARK,
            background: 'transparent', border: 'none', outline: 'none',
            flex: 1, minWidth: 0,
          }}
        />
      </div>

      {/* Filters heading */}
      <span style={{
        fontFamily: FONT, fontWeight: 700, fontSize: 12,
        letterSpacing: '0.05em', textTransform: 'uppercase', color: DARK,
        paddingLeft: 8,
      }}>
        Filters
      </span>

      {/* Status filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, marginBottom: 4 }}>
          Status
        </span>
        <StatusPill label="All"     dot={DARK}      active={statusFilter === 'all'}     onClick={() => setStatusFilter('all')} />
        <StatusPill label="Open"    dot={PRIMARY}   active={statusFilter === 'open'}    onClick={() => setStatusFilter('open')} />
        <StatusPill label="Pending" dot="#FBBF24"   active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} />
        <StatusPill label="Closed"  dot="#10B981"   active={statusFilter === 'closed'}  onClick={() => setStatusFilter('closed')} />
      </div>

      {/* Channel filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, marginBottom: 4 }}>
          Channel
        </span>
        <ChannelBtn icon={ChatBubbleLeftEllipsisIcon} label="All"   active={channelFilter === 'all'}   onClick={() => setChannelFilter('all')} />
        <ChannelBtn icon={EnvelopeIcon}               label="Email" active={channelFilter === 'email'} onClick={() => setChannelFilter('email')} />
        <ChannelBtn icon={ChatBubbleLeftEllipsisIcon} label="Chat"  active={channelFilter === 'chat'}  onClick={() => setChannelFilter('chat')} />
        <ChannelBtn icon={PhoneIcon}                  label="Voice" active={channelFilter === 'voice'} onClick={() => setChannelFilter('voice')} />
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 8 }}>
        <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 11, color: MUTED, marginBottom: 4 }}>
          Sort By
        </span>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 8, borderRadius: 16, boxShadow: NEU_SHADOW, background: BG,
        }}>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as SortOrder)}
            style={{
              fontFamily: FONT, fontWeight: 400, fontSize: 12, color: DARK,
              background: 'transparent', border: 'none', outline: 'none',
              flex: 1, cursor: 'pointer', appearance: 'none',
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="urgent">Urgent first</option>
          </select>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0 }}>
            <path d="M1 1L5 5L9 1" stroke={SOFT} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </>
  )

  return (
    <div style={{
      background: BG,
      flex: 1,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 0 : 24,
      padding: isMobile ? 12 : 24,
      minHeight: 0,
      fontFamily: FONT,
      height: isMobile ? 'auto' : '100%',
    }}>

      {/* ── Column 1: Filter Panel — desktop sidebar ─────────────────────────── */}
      {!isMobile && (
        <div style={{
          width: 220, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 20,
          paddingRight: 8,
        }}>
          {filterPanel}
        </div>
      )}

      {/* ── Column 2: Conversation List ────────────────────────────────── */}
      <div style={{
        flex: 1, minWidth: 0,
        background: BG, boxShadow: NEU_SHADOW, borderRadius: 16,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        marginTop: isMobile ? 12 : 0,
      }}>
        {/* List header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, color: DARK }}>
              Inbox
            </span>
            <span style={{ fontFamily: FONT, fontWeight: 500, fontSize: 14, color: SOFT }}>
              (0 conversations)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Filter toggle — mobile only */}
            {isMobile && (
              <button
                onClick={() => setShowMobileFilters(v => !v)}
                style={{
                  background: showMobileFilters ? PRIMARY : BG,
                  boxShadow: NEU_SHADOW,
                  border: 'none', borderRadius: 16,
                  width: 36, height: 36, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                title="Toggle filters"
              >
                {showMobileFilters
                  ? <XMarkIcon style={{ width: 16, height: 16, color: '#fff' }} />
                  : <AdjustmentsHorizontalIcon style={{ width: 16, height: 16, color: MUTED }} />}
              </button>
            )}
            <button
              style={{
                background: BG, boxShadow: NEU_SHADOW,
                border: 'none', borderRadius: 16,
                width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title="New conversation"
            >
              <PencilSquareIcon style={{ width: 16, height: 16, color: MUTED }} />
            </button>
          </div>
        </div>

        {/* Mobile filter drawer */}
        {isMobile && showMobileFilters && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
            padding: '16px 16px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.4)',
            background: BG,
          }}>
            {filterPanel}
          </div>
        )}

        {/* List body — empty state */}
        <EmptyConversations filter={statusFilter} />
      </div>

      {/* ── Column 3: Preview Pane — hidden on mobile ─────────────────── */}
      {!isMobile && <div style={{
        flex: 1.4, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* Preview card */}
        <div style={{
          flex: 1, background: BG, boxShadow: NEU_SHADOW, borderRadius: 16,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <PreviewEmpty />
        </div>

        {/* Intelligence Insights card */}
        <div style={{
          background: BG, boxShadow: NEU_SHADOW, borderRadius: 16,
          padding: 20, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Heading */}
          <span style={{
            fontFamily: FONT, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.05em', textTransform: 'uppercase', color: SOFT,
          }}>
            Intelligence Insights
          </span>

          {/* Insight tiles */}
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Customer Intent */}
            <div style={{
              flex: 1, background: 'rgba(232,234,240,0.5)', boxShadow: NEU_INSET,
              borderRadius: 24, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED }}>
                Customer Intent
              </span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>
                —
              </span>
            </div>

            {/* Sentiment */}
            <div style={{
              flex: 1, background: 'rgba(232,234,240,0.5)', boxShadow: NEU_INSET,
              borderRadius: 24, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}>
              <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: 11, color: MUTED }}>
                Sentiment
              </span>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 13, color: DARK }}>
                —
              </span>
            </div>
          </div>

          {/* Assignee row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 9999,
              background: 'rgba(232,234,240,0.5)', boxShadow: NEU_INSET,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SparklesIcon style={{ width: 12, height: 12, color: SOFT }} />
            </div>
            <span style={{ fontFamily: FONT, fontWeight: 400, fontSize: 12, color: SOFT }}>
              No conversation selected
            </span>
          </div>
        </div>
      </div>}
    </div>
  )
}
