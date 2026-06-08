import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowTopRightOnSquareIcon,
  BarsArrowDownIcon,
  BookOpenIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClockIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  GlobeAltIcon,
  Cog6ToothIcon,
  InboxIcon,
  InboxStackIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhoneIcon,
  SparklesIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore, useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { useTeamsPreview } from '@/app/store/teams-preview-store'
import type {
  ConversationChannel,
  ConversationMessage,
  ConversationStatus,
  SupportConversation,
} from '@/services/api/support-api'
import { cn } from '@/lib'
import { Pill, conversationStatusMeta } from './Pill'
import { ComposeModal } from './ComposeModal'
import { AssignControl, ManageTeamsModal } from './teams-ui'

// Assignment-based views (preview Teams). Orthogonal to the status views —
// "show me what's assigned to me / nobody / a given team".
type TeamFilter = 'all' | 'mine' | 'unassigned' | string

/**
 * Operator inbox — a three-pane workspace (à la Front / Missive / Linear):
 *
 *   ┌───────────┬──────────────────┬──────────────────────────┐
 *   │  Views    │  Conversation    │  Reading pane            │
 *   │ (vertical │  list            │  (selected thread,       │
 *   │  nav)     │                  │   read-only preview)     │
 *   └───────────┴──────────────────┴──────────────────────────┘
 *
 * The left rail replaces the old horizontal status tabs — statuses and
 * channels are now a vertical, click-down navigation, which reads far better
 * on a wide desktop. Selecting a row opens it in the reading pane on desktop;
 * on mobile (where the rail + pane collapse away) it deep-links to the full
 * conversation page, preserving the existing behaviour.
 */

// ── View definitions ──────────────────────────────────────────────────────────

type StatusView = ConversationStatus | 'all'

const STATUS_VIEWS: { value: StatusView; label: string; Icon: typeof InboxIcon }[] = [
  { value: 'all', label: 'All', Icon: InboxStackIcon },
  { value: 'open', label: 'Open', Icon: InboxIcon },
  { value: 'pending', label: 'Pending', Icon: ClockIcon },
  { value: 'escalated', label: 'Escalated', Icon: ExclamationTriangleIcon },
  { value: 'resolved', label: 'Resolved', Icon: CheckCircleIcon },
]

type ChannelView = ConversationChannel | 'all'

const CHANNEL_VIEWS: { value: ChannelView; label: string; Icon: typeof InboxIcon }[] = [
  { value: 'all', label: 'All channels', Icon: ChatBubbleLeftRightIcon },
  { value: 'chat', label: 'Chat', Icon: ChatBubbleLeftEllipsisIcon },
  { value: 'email', label: 'Email', Icon: EnvelopeIcon },
  { value: 'voice', label: 'Voice', Icon: PhoneIcon },
  { value: 'portal', label: 'Portal', Icon: GlobeAltIcon },
]

// ── Small helpers ─────────────────────────────────────────────────────────────

function sentimentIcon(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😠'
    case 'urgent':
      return '🔴'
    default:
      return ''
  }
}

function channelLabel(channel: ConversationChannel): string {
  return channel.charAt(0).toUpperCase() + channel.slice(1)
}

function timeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function resolveCustomerName(conv: SupportConversation): string | null {
  if (conv.customer?.name && conv.customer.name !== 'Visitor') return conv.customer.name
  if (conv.customer?.email) return conv.customer.email.split('@')[0].replace(/[._-]/g, ' ')
  return null
}

function conversationTitle(conv: SupportConversation): string {
  return (
    conv.subject ??
    conv.intent ??
    conv.messages.find((m) => m.role === 'customer')?.body.slice(0, 60) ??
    'New conversation'
  )
}

function activeStatusRank(status: ConversationStatus): number {
  return status === 'resolved' ? 1 : 0
}

function compareConversationForInbox(a: SupportConversation, b: SupportConversation): number {
  const activeDelta = activeStatusRank(a.status) - activeStatusRank(b.status)
  if (activeDelta !== 0) return activeDelta
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
}

function latestConversationPerCustomer(
  conversations: SupportConversation[]
): SupportConversation[] {
  const byCustomer = new Map<string, SupportConversation>()
  for (const conversation of conversations) {
    const key = conversation.customer_id || conversation.conv_id
    const existing = byCustomer.get(key)
    if (!existing || compareConversationForInbox(conversation, existing) < 0) {
      byCustomer.set(key, conversation)
    }
  }
  return [...byCustomer.values()].sort(compareConversationForInbox)
}

// ── Page wrapper (activation guard + loading) ─────────────────────────────────

function SupportInboxPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()
  const loadStarted = useRef(false)

  useEffect(() => {
    if (configLoading) loadStarted.current = true
  }, [configLoading])

  useEffect(() => {
    if (!loadStarted.current) return
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  return <SupportInboxPanel />
}

// ── Workspace (3-pane) ────────────────────────────────────────────────────────

function SupportInboxPanel() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const {
    config,
    configLoading,
    conversations,
    conversationsLoading,
    loadConversations,
    stats,
    loadStats,
    statusFilter,
    setStatusFilter,
  } = useSupportStore()

  const { userId } = useAuthStore()
  const teams = useTeamsPreview((s) => s.teams)
  const assignments = useTeamsPreview((s) => s.assignments)

  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'subject'>('newest')
  const [channel, setChannel] = useState<ChannelView>('all')
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false)

  useEffect(() => {
    if (!currentOrgId) return
    loadConversations(currentOrgId)
    loadStats(currentOrgId)
  }, [currentOrgId, loadConversations, loadStats])

  // Visibility-aware polling: 5s focused, 30s backgrounded. Paused while the
  // compose modal is open so the list (and any re-render) doesn't churn under
  // the operator mid-message.
  useEffect(() => {
    if (!currentOrgId || composeOpen) return
    let intervalId: number | null = null
    const tick = () => {
      loadConversations(currentOrgId, statusFilter ?? undefined, { background: true })
      loadStats(currentOrgId)
    }
    const start = () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      const ms = document.visibilityState === 'visible' ? 5000 : 30000
      intervalId = window.setInterval(tick, ms)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
      start()
    }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [currentOrgId, statusFilter, loadConversations, loadStats, composeOpen])

  useEffect(() => {
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  const handleSelectStatus = useCallback(
    (value: StatusView) => {
      const status = value === 'all' ? null : value
      setStatusFilter(status)
      if (currentOrgId) loadConversations(currentOrgId, status ?? undefined)
    },
    [currentOrgId, setStatusFilter, loadConversations]
  )

  const matchesTeamFilter = useCallback(
    (convId: string): boolean => {
      if (teamFilter === 'all') return true
      const a = assignments[convId]
      if (teamFilter === 'mine') return !!a && a.assignee_user_id === userId
      if (teamFilter === 'unassigned') return !a || (!a.team_id && !a.assignee_user_id)
      return !!a && a.team_id === teamFilter
    },
    [teamFilter, assignments, userId]
  )

  const filtered = useMemo(() => {
    let source = statusFilter ? conversations : latestConversationPerCustomer(conversations)
    if (channel !== 'all') source = source.filter((c) => c.channel === channel)
    source = source.filter((c) => matchesTeamFilter(c.conv_id))
    const q = search.trim().toLowerCase()
    const searched = q
      ? source.filter(
          (c) =>
            c.subject?.toLowerCase().includes(q) ||
            c.customer?.name?.toLowerCase().includes(q) ||
            c.customer?.email?.toLowerCase().includes(q) ||
            c.intent?.toLowerCase().includes(q)
        )
      : source
    return [...searched].sort((a, b) => {
      if (sortBy === 'oldest')
        return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      if (sortBy === 'subject') return (a.subject ?? '').localeCompare(b.subject ?? '')
      const activeDelta = activeStatusRank(a.status) - activeStatusRank(b.status)
      if (activeDelta !== 0) return activeDelta
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [conversations, search, statusFilter, sortBy, channel, matchesTeamFilter])

  // Counts for the assignment + team rail views (over the loaded set).
  const teamCounts = useMemo(() => {
    const base = statusFilter ? conversations : latestConversationPerCustomer(conversations)
    let mine = 0
    let unassigned = 0
    const perTeam: Record<string, number> = {}
    for (const c of base) {
      const a = assignments[c.conv_id]
      if (a?.assignee_user_id === userId) mine++
      if (!a || (!a.team_id && !a.assignee_user_id)) unassigned++
      if (a?.team_id) perTeam[a.team_id] = (perTeam[a.team_id] ?? 0) + 1
    }
    return { mine, unassigned, perTeam }
  }, [conversations, statusFilter, assignments, userId])

  const selected = useMemo(
    () => conversations.find((c) => c.conv_id === selectedId) ?? null,
    [conversations, selectedId]
  )

  const activeStatus: StatusView = statusFilter ?? 'all'
  const activeLabel = STATUS_VIEWS.find((v) => v.value === activeStatus)?.label ?? 'All'

  // Desktop opens in the reading pane; mobile deep-links to the full page
  // (the pane + rail are hidden under lg).
  const handleOpen = useCallback(
    (conv: SupportConversation) => {
      const desktop =
        typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
      if (desktop) setSelectedId(conv.conv_id)
      else navigate(`/support/inbox/${conv.conv_id}`)
    },
    [navigate]
  )

  const statusCount = (value: StatusView): number | undefined => {
    if (!stats) return undefined
    switch (value) {
      case 'all':
        return stats.total_conversations
      case 'open':
        return stats.open_conversations
      case 'pending':
        return stats.pending_conversations
      case 'escalated':
        return stats.escalated
      case 'resolved':
        return stats.resolved_conversations
      default:
        return undefined
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-[#ebebeb]">
      {/* ── Left rail: views ─────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white">
              <InboxIcon className="h-4 w-4" />
            </span>
            <h1 className="text-sm font-bold tracking-tight text-gray-900">Inbox</h1>
          </div>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            title="Docs"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <BookOpenIcon className="h-4 w-4" />
          </a>
        </div>

        <div className="px-3 pb-1 pt-1">
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#020308] px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Compose
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <SidebarSection label="Assignment" />
          <SidebarLink
            Icon={UserCircleIcon}
            label="My inbox"
            count={teamCounts.mine}
            active={teamFilter === 'mine'}
            onClick={() => setTeamFilter((f) => (f === 'mine' ? 'all' : 'mine'))}
          />
          <SidebarLink
            Icon={InboxIcon}
            label="Unassigned"
            count={teamCounts.unassigned}
            active={teamFilter === 'unassigned'}
            onClick={() => setTeamFilter((f) => (f === 'unassigned' ? 'all' : 'unassigned'))}
          />

          <SidebarSection label="Status" className="mt-4" />
          {STATUS_VIEWS.map((v) => (
            <SidebarLink
              key={v.value}
              Icon={v.Icon}
              label={v.label}
              count={statusCount(v.value)}
              active={activeStatus === v.value}
              onClick={() => handleSelectStatus(v.value)}
            />
          ))}

          <div className="mb-1 mt-4 flex items-center justify-between pr-1">
            <SidebarSection label="Teams" />
            <button
              type="button"
              onClick={() => setManageTeamsOpen(true)}
              title="Manage teams"
              className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <Cog6ToothIcon className="h-3.5 w-3.5" />
            </button>
          </div>
          {teams.map((t) => (
            <button
              key={t.team_id}
              onClick={() => setTeamFilter((f) => (f === t.team_id ? 'all' : t.team_id))}
              aria-current={teamFilter === t.team_id ? 'page' : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
                teamFilter === t.team_id
                  ? 'bg-[#020308] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} />
              <span className="flex-1 truncate text-left">{t.name}</span>
              {(teamCounts.perTeam[t.team_id] ?? 0) > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                    teamFilter === t.team_id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {teamCounts.perTeam[t.team_id]}
                </span>
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setManageTeamsOpen(true)}
            className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <UserGroupIcon className="h-4 w-4 shrink-0" />
            Manage teams
          </button>

          <SidebarSection label="Channels" className="mt-4" />
          {CHANNEL_VIEWS.map((v) => (
            <SidebarLink
              key={v.value}
              Icon={v.Icon}
              label={v.label}
              active={channel === v.value}
              onClick={() => setChannel(v.value)}
            />
          ))}
        </nav>

        {stats && (
          <div className="border-t border-gray-100 px-3 py-3">
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Autonomous" value={stats.resolved_autonomous} />
              <MiniStat
                label="Avg CSAT"
                value={stats.avg_csat ? `${stats.avg_csat.toFixed(1)}` : '—'}
              />
            </div>
          </div>
        )}
      </aside>

      {/* ── Middle: conversation list ────────────────────────────────── */}
      <div className="flex w-full min-w-0 flex-col border-r border-gray-200 bg-white lg:w-[360px] lg:shrink-0">
        {/* List header */}
        <div className="shrink-0 border-b border-gray-100 px-4 pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-gray-900">{activeLabel}</h2>
              <span className="text-xs font-medium text-gray-400">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1">
                <BarsArrowDownIcon className="h-3.5 w-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'subject')}
                  className="cursor-pointer appearance-none bg-transparent pr-4 text-[11px] font-medium text-gray-600 focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="subject">Subject</option>
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 h-3 w-3 text-gray-400" />
              </div>
              {/* Compose — visible on mobile where the left rail is hidden */}
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                title="Compose"
                className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white transition hover:bg-gray-800 lg:hidden"
              >
                <PencilSquareIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile-only horizontal status selector (rail is hidden under lg) */}
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1 lg:hidden">
            {STATUS_VIEWS.map((v) => (
              <button
                key={v.value}
                onClick={() => handleSelectStatus(v.value)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition',
                  activeStatus === v.value ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mt-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-xs focus:border-[#020308] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#020308]"
            />
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversationsLoading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <InboxIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No conversations</p>
              <p className="mt-1 text-xs text-gray-300">
                Conversations will appear here when customers reach out
              </p>
            </div>
          ) : (
            <ul>
              {filtered.map((conv) => (
                <ConversationRow
                  key={conv.conv_id}
                  conv={conv}
                  selected={conv.conv_id === selectedId}
                  onClick={() => handleOpen(conv)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right: reading pane (desktop only) ───────────────────────── */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <ReadingPane
          conv={selected}
          orgId={currentOrgId ?? null}
          onOpenFull={(id) => navigate(`/support/inbox/${id}`)}
        />
      </div>

      {manageTeamsOpen && currentOrgId && (
        <ManageTeamsModal orgId={currentOrgId} onClose={() => setManageTeamsOpen(false)} />
      )}

      {composeOpen && currentOrgId && (
        <ComposeModal
          orgId={currentOrgId}
          onClose={() => setComposeOpen(false)}
          onSent={(conv, { stay }) => {
            setComposeOpen(false)
            if (currentOrgId) loadConversations(currentOrgId, statusFilter ?? undefined)
            if (!stay) {
              const desktop =
                typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
              if (desktop) setSelectedId(conv.conv_id)
              else navigate(`/support/inbox/${conv.conv_id}`)
            }
          }}
        />
      )}
    </div>
  )
}

// ── Sidebar primitives ────────────────────────────────────────────────────────

function SidebarSection({ label, className }: { label: string; className?: string }) {
  return (
    <p
      className={cn(
        'px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400',
        className
      )}
    >
      {label}
    </p>
  )
}

function SidebarLink({
  Icon,
  label,
  count,
  active,
  onClick,
}: {
  Icon: typeof InboxIcon
  label: string
  count?: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
        active ? 'bg-[#020308] text-white' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-gray-400')} />
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
            active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
      <p className="text-base font-bold leading-none text-gray-900">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
  )
}

// ── Conversation list row ─────────────────────────────────────────────────────

function ConversationRow({
  conv,
  selected,
  onClick,
}: {
  conv: SupportConversation
  selected: boolean
  onClick: () => void
}) {
  const lastMsg = conv.messages[conv.messages.length - 1]
  const customerName = resolveCustomerName(conv)
  const avatarLetter = customerName?.charAt(0)?.toUpperCase()
  const title = conversationTitle(conv)
  const displayName =
    customerName ?? (conv.channel === 'voice' ? 'Voice caller' : 'Website visitor')
  const assignment = useTeamsPreview((s) => s.assignments[conv.conv_id])
  const teams = useTeamsPreview((s) => s.teams)
  const assignedTeam = assignment?.team_id
    ? (teams.find((t) => t.team_id === assignment.team_id) ?? null)
    : null

  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'flex w-full items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition',
          selected ? 'bg-indigo-50/60' : 'hover:bg-gray-50'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
          {avatarLetter ?? <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-900">{displayName}</span>
            {conv.sentiment && <span className="text-xs">{sentimentIcon(conv.sentiment)}</span>}
            <span className="ml-auto shrink-0 text-[10px] text-gray-300">
              {timeAgo(conv.updated_at)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{title}</p>
          {conv.summary ? (
            <p className="mt-0.5 truncate text-xs italic text-gray-400">
              {conv.summary.slice(0, 120)}
            </p>
          ) : lastMsg ? (
            <p className="mt-0.5 truncate text-xs text-gray-400">
              {lastMsg.role === 'lira'
                ? 'Lira: '
                : lastMsg.role === 'agent'
                  ? `${lastMsg.sender_name ?? 'Agent'}: `
                  : ''}
              {lastMsg.body.slice(0, 120)}
            </p>
          ) : null}
          <div className="mt-1.5 flex items-center gap-1.5">
            <Pill tone={conversationStatusMeta(conv.status).tone} dot>
              {conversationStatusMeta(conv.status).label}
            </Pill>
            {conv.display_id && (
              <span className="text-[10px] font-bold text-gray-300">#{conv.display_id}</span>
            )}
            {assignment?.assignee_user_id ? (
              <span
                title="Assigned to a teammate"
                className="grid h-4 w-4 place-items-center rounded-full bg-indigo-500 text-white"
              >
                <UserCircleIcon className="h-3 w-3" />
              </span>
            ) : assignedTeam ? (
              <span
                title={`Team: ${assignedTeam.name}`}
                className="h-2 w-2 rounded-full"
                style={{ background: assignedTeam.color }}
              />
            ) : null}
            {conv.csat_score && (
              <span className="ml-auto text-[10px] text-amber-500">
                {'★'.repeat(conv.csat_score)}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}

// ── Reading pane ──────────────────────────────────────────────────────────────

function ReadingPane({
  conv,
  orgId,
  onOpenFull,
}: {
  conv: SupportConversation | null
  orgId: string | null
  onOpenFull: (id: string) => void
}) {
  const navigate = useNavigate()

  if (!conv) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#f6f6f6] text-center">
        <ChatBubbleLeftRightIcon className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">No conversation selected</p>
        <p className="mt-1 max-w-xs text-xs text-gray-400">
          Pick a conversation from the list to preview the full thread here.
        </p>
      </div>
    )
  }

  const customerName = resolveCustomerName(conv)
  const displayName =
    customerName ?? (conv.channel === 'voice' ? 'Voice caller' : 'Website visitor')
  const avatarLetter = customerName?.charAt(0)?.toUpperCase()

  return (
    <div className="flex h-full flex-col bg-[#f6f6f6]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
          {avatarLetter ?? <ChatBubbleLeftEllipsisIcon className="h-4 w-4 text-gray-400" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                conv.customer?.customer_id &&
                navigate(`/support/customers/${conv.customer.customer_id}`)
              }
              className={cn(
                'truncate text-sm font-bold text-gray-900',
                conv.customer?.customer_id && 'hover:text-[#020308] hover:underline'
              )}
            >
              {displayName}
            </button>
            <Pill tone={conversationStatusMeta(conv.status).tone} dot className="shrink-0">
              {conversationStatusMeta(conv.status).label}
            </Pill>
          </div>
          <p className="truncate text-xs text-gray-400">
            {channelLabel(conv.channel)}
            {conv.customer?.email ? ` · ${conv.customer.email}` : ''}
          </p>
        </div>
        {orgId && <AssignControl orgId={orgId} itemId={conv.conv_id} kind="conversation" />}
        <button
          type="button"
          onClick={() => onOpenFull(conv.conv_id)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          Open full
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Context strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 bg-white px-5 py-2">
        {conv.intent && <ContextChip>{conv.intent}</ContextChip>}
        {conv.sentiment && (
          <ContextChip>
            {sentimentIcon(conv.sentiment)} {conv.sentiment}
          </ContextChip>
        )}
        {conv.csat_score && <ContextChip>CSAT {'★'.repeat(conv.csat_score)}</ContextChip>}
        {conv.tags?.slice(0, 5).map((tag) => (
          <ContextChip key={tag}>{tag}</ContextChip>
        ))}
      </div>

      {/* Thread */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {conv.summary && (
          <div className="mb-4 flex gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
            <SparklesIcon className="h-4 w-4 shrink-0 text-indigo-500" />
            <p className="text-xs leading-5 text-indigo-900">{conv.summary}</p>
          </div>
        )}
        <div className="space-y-3">
          {conv.messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {conv.messages.length === 0 && (
            <p className="py-10 text-center text-xs text-gray-400">
              No messages in this thread yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ContextChip({ children }: { children: ReactNode }) {
  return (
    <Pill tone="neutral" className="capitalize">
      {children}
    </Pill>
  )
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  if (message.role === 'system') {
    return <p className="text-center text-[11px] text-gray-400">{message.body}</p>
  }
  const isInbound = message.role === 'customer'
  const senderLabel =
    message.role === 'customer'
      ? (message.sender_name ?? 'Customer')
      : message.role === 'lira'
        ? 'Lira'
        : (message.sender_name ?? 'Agent')

  return (
    <div className={cn('flex flex-col', isInbound ? 'items-start' : 'items-end')}>
      <div className="mb-0.5 flex items-center gap-1.5 px-1">
        <span className="text-[11px] font-semibold text-gray-500">{senderLabel}</span>
        <span className="text-[10px] text-gray-300">{timeAgo(message.timestamp)}</span>
      </div>
      <div
        className={cn(
          'max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-5 shadow-sm',
          isInbound
            ? 'rounded-bl-sm border border-gray-200 bg-white text-gray-800'
            : message.role === 'lira'
              ? 'rounded-br-sm bg-indigo-600 text-white'
              : 'rounded-br-sm bg-[#020308] text-white'
        )}
      >
        {message.body}
      </div>
    </div>
  )
}

export { SupportInboxPage, SupportInboxPanel }
