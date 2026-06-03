import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  BugAntIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InboxIcon,
  InboxStackIcon,
  LinkIcon,
  LightBulbIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  PaperClipIcon,
  PhotoIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Squares2X2Icon,
  StarIcon,
  TicketIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useAuthStore, useOrgStore } from '@/app/store'
import {
  listTicketsForOrg,
  getTicketForOrg,
  replyToTicket,
  resolveTicket,
  regenerateHandoffBrief,
  requestCsat,
  createManualTicket,
  uploadTicketAttachment,
  listExternalLinks,
  createExternalLink,
  forceSyncTicket,
  downloadTicketAudit,
  markTicketPending,
  markTicketOnHold,
  reopenTicket,
  closeTicket,
  classifyTicket,
  routeTicket,
  ackEscalation,
  setTicketStatus,
  setTicketPriority,
  setTicketCategory,
  setTicketQueue,
  assignTicket,
  listQueues,
  listTicketCategories,
  listAgentAvailability,
  listSupportCustomers,
  type SupportTicketRecord,
  type SupportTicketMessageRecord,
  type TicketAttachmentRecord,
  type ResolveTicketFeedback,
  type ExternalLink,
  type OutboxProvider,
  type SupportQueue,
  type TicketCategoryRecord,
  type AgentAvailabilityRecord,
  type CustomerProfile,
} from '@/services/api/support-api'
import { SlaPill } from './SlaPill'
import { Pill, priorityMeta, ticketStatusMeta } from './Pill'
import { AssignControl, ManageTeamsModal } from './teams-ui'
import { useTeamsPreview } from '@/app/store/teams-preview-store'
import { cn } from '@/lib'

// Assignment-based views (preview Teams) — orthogonal to the status views.
type TeamFilter = 'all' | 'mine' | 'unassigned' | string

/**
 * Operator-facing tickets surface. Sister to the visitor-facing
 * MyTicketsPage — this view lists tickets across the org so a teammate
 * can reply / resolve them. Conversations (raw AI chat threads) live in
 * `/support/inbox`; tickets are the things that actually need a human.
 */

type ViewMode = 'list' | 'board'

// Saved views shown in the left rail. Each is a client-side predicate over the
// full ticket set (the backend always returns every ticket for the org), so
// switching views is instant and doesn't touch the API.
type TicketView = {
  id: string
  label: string
  Icon: typeof InboxIcon
  match: (t: SupportTicketRecord) => boolean
}

const TERMINAL_STATUSES: SupportTicketRecord['status'][] = ['resolved', 'closed', 'merged']

const TICKET_VIEWS: TicketView[] = [
  { id: 'all', label: 'All tickets', Icon: InboxStackIcon, match: () => true },
  {
    id: 'active',
    label: 'Active',
    Icon: InboxIcon,
    match: (t) => !TERMINAL_STATUSES.includes(t.status),
  },
  {
    id: 'escalated',
    label: 'Escalated',
    Icon: ExclamationTriangleIcon,
    match: (t) => t.status === 'escalated',
  },
  {
    id: 'priority',
    label: 'Urgent & high',
    Icon: FireIcon,
    match: (t) => t.priority === 'urgent' || t.priority === 'high',
  },
  {
    id: 'resolved',
    label: 'Resolved',
    Icon: CheckCircleIcon,
    match: (t) => t.status === 'resolved' || t.status === 'closed',
  },
]

export function SupportTicketsPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { userId } = useAuthStore()
  const teams = useTeamsPreview((s) => s.teams)
  const assignments = useTeamsPreview((s) => s.assignments)
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewId, setViewId] = useState<string>('all')
  const [teamFilter, setTeamFilter] = useState<TeamFilter>('all')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<ViewMode>('board')
  // null = closed; object = open, optionally preset to a board column's status.
  const [newTicketPreset, setNewTicketPreset] = useState<{
    status?: SupportTicketRecord['status']
  } | null>(null)
  const [manageTeamsOpen, setManageTeamsOpen] = useState(false)
  // Capture once at mount so the SLA pill computation stays pure across
  // renders (react-hooks/purity disallows Date.now() during render).
  const [nowSnapshot] = useState(() => Date.now())

  const load = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const data = await listTicketsForOrg(currentOrgId)
      setTickets(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    void load()
  }, [load])

  // Poll while page is open
  useEffect(() => {
    if (!currentOrgId) return
    const id = setInterval(() => {
      listTicketsForOrg(currentOrgId)
        .then(setTickets)
        .catch(() => {})
    }, 10_000)
    return () => clearInterval(id)
  }, [currentOrgId])

  const activeView = useMemo(
    () => TICKET_VIEWS.find((v) => v.id === viewId) ?? TICKET_VIEWS[0],
    [viewId]
  )

  const matchesTeamFilter = useCallback(
    (ticketId: string): boolean => {
      if (teamFilter === 'all') return true
      const a = assignments[ticketId]
      if (teamFilter === 'mine') return !!a && a.assignee_user_id === userId
      if (teamFilter === 'unassigned') return !a || (!a.team_id && !a.assignee_user_id)
      return !!a && a.team_id === teamFilter
    },
    [teamFilter, assignments, userId]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const subset = tickets.filter((t) => {
      if (!activeView.match(t)) return false
      if (!matchesTeamFilter(t.ticket_id)) return false
      if (!q) return true
      return (
        t.subject?.toLowerCase().includes(q) ||
        t.visitor_name?.toLowerCase().includes(q) ||
        t.visitor_email?.toLowerCase().includes(q) ||
        t.ticket_number?.toLowerCase().includes(q) ||
        t.summary?.toLowerCase().includes(q) ||
        false
      )
    })
    return [...subset].sort((a, b) => {
      // Active first (open > in_progress > resolved > closed), then newest
      // Sort order: most-actionable first. Escalated/pending need attention
      // sooner than passively-open tickets; terminal states drift to the
      // bottom in the order resolved → closed → merged/snoozed.
      const rank = (s: SupportTicketRecord['status']): number => {
        switch (s) {
          case 'escalated':
            return 0
          case 'pending':
            return 1
          case 'open':
            return 2
          case 'in_progress':
            return 3
          case 'on_hold':
            return 4
          case 'resolved':
            return 5
          case 'closed':
            return 6
          case 'merged':
          case 'snoozed':
            return 7
          default:
            return 8
        }
      }
      const r = rank(a.status) - rank(b.status)
      if (r !== 0) return r
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }, [tickets, activeView, search, matchesTeamFilter])

  // Counts for the Teams rail views (preview assignment, over the active view).
  const teamCounts = useMemo(() => {
    const base = tickets.filter((t) => activeView.match(t))
    let mine = 0
    let unassigned = 0
    const perTeam: Record<string, number> = {}
    for (const t of base) {
      const a = assignments[t.ticket_id]
      if (a?.assignee_user_id === userId) mine++
      if (!a || (!a.team_id && !a.assignee_user_id)) unassigned++
      if (a?.team_id) perTeam[a.team_id] = (perTeam[a.team_id] ?? 0) + 1
    }
    return { mine, unassigned, perTeam }
  }, [tickets, activeView, assignments, userId])

  // Drag-and-drop in the board view changes a ticket's status. Apply the move
  // optimistically (so the card jumps columns instantly), then persist; roll
  // back to the previous snapshot if the request fails.
  const handleMoveTicket = useCallback(
    async (ticketId: string, status: SupportTicketRecord['status']) => {
      if (!currentOrgId) return
      const current = tickets.find((t) => t.ticket_id === ticketId)
      if (!current || current.status === status) return
      const snapshot = tickets
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === ticketId
            ? { ...t, status, updated_at: new Date(nowSnapshot).toISOString() }
            : t
        )
      )
      try {
        const updated = await setTicketStatus(currentOrgId, ticketId, status)
        setTickets((prev) => prev.map((t) => (t.ticket_id === ticketId ? updated : t)))
      } catch (err) {
        setTickets(snapshot)
        toast.error(err instanceof Error ? err.message : 'Failed to move ticket')
      }
    },
    [currentOrgId, tickets, nowSnapshot]
  )

  const ticketCount = (v: TicketView): number => tickets.filter(v.match).length

  return (
    <div className="flex h-full overflow-hidden bg-[#ebebeb]">
      {/* ── Left rail: saved views ───────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 px-4 pb-2 pt-4">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white">
            <TicketIcon className="h-4 w-4" />
          </span>
          <h1 className="text-sm font-bold tracking-tight text-gray-900">Tickets</h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Views
          </p>
          {TICKET_VIEWS.map((v) => {
            const active = viewId === v.id
            const count = ticketCount(v)
            return (
              <button
                key={v.id}
                onClick={() => setViewId(v.id)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
                  active ? 'bg-[#020308] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <v.Icon
                  className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-gray-400')}
                />
                <span className="flex-1 truncate text-left">{v.label}</span>
                {count > 0 && (
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
          })}

          {/* Assignment + Teams (preview) */}
          <p className="mt-4 px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Assignment
          </p>
          <RailFilter
            Icon={UserCircleIcon}
            label="My tickets"
            count={teamCounts.mine}
            active={teamFilter === 'mine'}
            onClick={() => setTeamFilter((f) => (f === 'mine' ? 'all' : 'mine'))}
          />
          <RailFilter
            Icon={InboxIcon}
            label="Unassigned"
            count={teamCounts.unassigned}
            active={teamFilter === 'unassigned'}
            onClick={() => setTeamFilter((f) => (f === 'unassigned' ? 'all' : 'unassigned'))}
          />

          <div className="mb-1 mt-4 flex items-center justify-between pr-1">
            <p className="px-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Teams
            </p>
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
        </nav>

        <div className="border-t border-gray-100 p-3">
          <button
            onClick={() => setNewTicketPreset({})}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#020308] px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            New ticket
          </button>
        </div>
      </aside>

      {/* ── Main: toolbar + board/list ───────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-gray-900">{activeView.label}</h2>
              <span className="text-xs font-medium text-gray-400">{filtered.length}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tickets…"
                  className="w-44 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs focus:border-[#020308] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#020308] lg:w-56"
                />
              </div>
              <ViewToggle view={mode} onChange={setMode} />
              <button
                onClick={() => setNewTicketPreset({})}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 lg:hidden"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>

          {/* Mobile-only horizontal view selector (rail hidden under lg) */}
          <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 lg:hidden">
            {TICKET_VIEWS.map((v) => (
              <button
                key={v.id}
                onClick={() => setViewId(v.id)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition',
                  viewId === v.id ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
            </div>
          ) : mode === 'board' ? (
            <TicketBoard
              tickets={filtered}
              now={nowSnapshot}
              onMove={handleMoveTicket}
              onOpen={(id) => navigate(`/support/tickets/${id}`)}
              onAdd={(status) => setNewTicketPreset({ status })}
            />
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <TicketIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No tickets here</p>
              <p className="mt-1 text-xs text-gray-300">
                Lira opens a ticket when a question needs a real teammate
              </p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto px-4 py-4">
              <ul className="mx-auto max-w-4xl space-y-2">
                {filtered.map((t) => (
                  <li key={t.ticket_id}>
                    <button
                      onClick={() => navigate(`/support/tickets/${t.ticket_id}`)}
                      className="block w-full rounded-2xl border border-gray-200/80 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
                          {t.ticket_number ?? t.ticket_id.slice(0, 8)}
                        </code>
                        <StatusBadge status={t.status} />
                        {t.priority !== 'medium' && <PriorityChip priority={t.priority} />}
                        <SlaPill ticket={t} now={nowSnapshot} compact />
                        <span
                          className="ml-auto text-[11px] text-gray-400"
                          title={new Date(t.updated_at).toLocaleString()}
                        >
                          {relativeTimeShort(t.updated_at, nowSnapshot)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-semibold text-gray-900">{t.subject}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {t.visitor_name ?? t.visitor_email ?? 'unknown visitor'}
                        {t.source ? ` · via ${t.source.replace(/_/g, ' ')}` : ''}
                      </p>
                      {t.summary && (
                        <p className="mt-1 line-clamp-1 text-xs text-gray-400">{t.summary}</p>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {newTicketPreset && currentOrgId && (
        <NewTicketModal
          orgId={currentOrgId}
          presetStatus={newTicketPreset.status}
          onClose={() => setNewTicketPreset(null)}
          onCreated={() => {
            // Stay on the board/list and silently refresh so the new card lands
            // in its column, rather than yanking the operator to the detail page
            // (or flashing the full-board spinner).
            setNewTicketPreset(null)
            if (currentOrgId) {
              listTicketsForOrg(currentOrgId)
                .then(setTickets)
                .catch(() => {})
            }
          }}
        />
      )}

      {manageTeamsOpen && currentOrgId && (
        <ManageTeamsModal orgId={currentOrgId} onClose={() => setManageTeamsOpen(false)} />
      )}
    </div>
  )
}

// ── Rail filter row (assignment views) ────────────────────────────────────────

function RailFilter({
  Icon,
  label,
  count,
  active,
  onClick,
}: {
  Icon: typeof InboxIcon
  label: string
  count: number
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
      {count > 0 && (
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

// ── List / Board view toggle ──────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const options: { value: ViewMode; label: string; Icon: typeof ListBulletIcon }[] = [
    { value: 'list', label: 'List', Icon: ListBulletIcon },
    { value: 'board', label: 'Board', Icon: Squares2X2Icon },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-white/60 bg-white p-0.5 shadow-sm">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={view === value}
          title={`${label} view`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition',
            view === value ? 'bg-[#020308] text-white' : 'text-gray-500 hover:bg-gray-50'
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Kanban board ──────────────────────────────────────────────────────────────
//
// A column per ticket status. Cards are dragged between columns to change the
// ticket's status (HTML5 drag-and-drop — no extra dependency). On phones the
// columns scroll horizontally. The board always shows every ticket, so the
// status filter tabs are hidden while it's active.

// Column dot colors run a deliberate gradient — brand purples for active work,
// amber for waiting, rose for needs-attention, green for done, slate to retire —
// so the board reads as one palette rather than a box of crayons.
const BOARD_COLUMNS: { status: SupportTicketRecord['status']; label: string; accent: string }[] = [
  { status: 'open', label: 'Open', accent: 'bg-indigo-400' },
  { status: 'in_progress', label: 'In progress', accent: 'bg-indigo-600' },
  { status: 'pending', label: 'Pending', accent: 'bg-amber-400' },
  { status: 'on_hold', label: 'On hold', accent: 'bg-slate-300' },
  { status: 'escalated', label: 'Escalated', accent: 'bg-rose-500' },
  { status: 'resolved', label: 'Resolved', accent: 'bg-emerald-500' },
  { status: 'closed', label: 'Closed', accent: 'bg-slate-500' },
]

function TicketBoard({
  tickets,
  now,
  onMove,
  onOpen,
  onAdd,
}: {
  tickets: SupportTicketRecord[]
  now: number
  onMove: (ticketId: string, status: SupportTicketRecord['status']) => void
  onOpen: (ticketId: string) => void
  onAdd: (status: SupportTicketRecord['status']) => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStatus, setOverStatus] = useState<SupportTicketRecord['status'] | null>(null)

  const byStatus = useMemo(() => {
    const groups = new Map<SupportTicketRecord['status'], SupportTicketRecord[]>()
    for (const col of BOARD_COLUMNS) groups.set(col.status, [])
    for (const t of tickets) {
      const bucket = groups.get(t.status)
      if (bucket) bucket.push(t)
    }
    for (const bucket of groups.values()) {
      bucket.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
    return groups
  }, [tickets])

  const handleDrop = (status: SupportTicketRecord['status']) => {
    if (dragId) onMove(dragId, status)
    setDragId(null)
    setOverStatus(null)
  }

  return (
    <div className="flex h-full gap-3 overflow-x-auto px-4 py-4">
      {BOARD_COLUMNS.map((col) => {
        const items = byStatus.get(col.status) ?? []
        const isOver = overStatus === col.status
        return (
          <div
            key={col.status}
            onDragOver={(e) => {
              if (!dragId) return
              e.preventDefault()
              setOverStatus(col.status)
            }}
            onDragLeave={(e) => {
              // Only clear when the pointer actually leaves the column, not when
              // it crosses onto a child element.
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setOverStatus((s) => (s === col.status ? null : s))
              }
            }}
            onDrop={() => handleDrop(col.status)}
            className={cn(
              'flex h-full w-[80vw] shrink-0 flex-col rounded-2xl border bg-gray-50/80 sm:w-72',
              isOver ? 'border-[#020308] bg-white ring-2 ring-[#020308]/10' : 'border-gray-200'
            )}
          >
            <div className="flex shrink-0 items-center gap-2 px-3 py-2.5">
              <span className={cn('h-2 w-2 rounded-full', col.accent)} />
              <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                {col.label}
              </span>
              <span className="rounded-full bg-gray-200/70 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-gray-500">
                {items.length}
              </span>
              <button
                type="button"
                onClick={() => onAdd(col.status)}
                title={`New ticket in ${col.label}`}
                className="ml-auto grid h-6 w-6 place-items-center rounded-md text-gray-400 transition hover:bg-gray-200/70 hover:text-gray-700"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
              {items.map((t) => (
                <BoardCard
                  key={t.ticket_id}
                  ticket={t}
                  now={now}
                  dragging={dragId === t.ticket_id}
                  onDragStart={() => setDragId(t.ticket_id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverStatus(null)
                  }}
                  onOpen={() => onOpen(t.ticket_id)}
                />
              ))}
              {items.length === 0 && (
                <button
                  type="button"
                  onClick={() => onAdd(col.status)}
                  className={cn(
                    'mt-1 flex items-center justify-center gap-1 rounded-xl border border-dashed py-8 text-center text-[11px] font-medium transition',
                    isOver
                      ? 'border-[#020308]/40 text-gray-500'
                      : 'border-gray-200 text-gray-300 hover:border-gray-300 hover:text-gray-500'
                  )}
                >
                  {isOver ? (
                    'Drop here'
                  ) : (
                    <>
                      <PlusIcon className="h-3.5 w-3.5" />
                      New ticket
                    </>
                  )}
                </button>
              )}
              {/* Footer add — always available, even when the column has cards. */}
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={() => onAdd(col.status)}
                  className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-gray-400 transition hover:bg-gray-200/50 hover:text-gray-600"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  New ticket
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BoardCard({
  ticket,
  now,
  dragging,
  onDragStart,
  onDragEnd,
  onOpen,
}: {
  ticket: SupportTicketRecord
  now: number
  dragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onOpen: () => void
}) {
  const assignment = useTeamsPreview((s) => s.assignments[ticket.ticket_id])
  const teams = useTeamsPreview((s) => s.teams)
  const assignedTeam = assignment?.team_id
    ? (teams.find((t) => t.team_id === assignment.team_id) ?? null)
    : null
  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        // Some browsers require data to be set for a drag to begin.
        e.dataTransfer.setData('text/plain', ticket.ticket_id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      className={cn(
        'block cursor-grab rounded-xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md active:cursor-grabbing',
        dragging && 'opacity-40'
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
          {ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)}
        </code>
        {ticket.priority !== 'medium' && <PriorityChip priority={ticket.priority} />}
        <SlaPill ticket={ticket} now={now} compact />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900">
        {ticket.subject}
      </p>
      <p className="mt-1 truncate text-[11px] text-gray-500">
        {ticket.visitor_name ?? ticket.visitor_email ?? 'unknown visitor'}
      </p>
      <div className="mt-1 flex items-center gap-1.5">
        <span
          className="text-[10px] text-gray-400"
          title={new Date(ticket.updated_at).toLocaleString()}
        >
          {relativeTimeShort(ticket.updated_at, now)}
        </span>
        {assignment?.assignee_user_id ? (
          <span
            title="Assigned to a teammate"
            className="ml-auto grid h-4 w-4 place-items-center rounded-full bg-indigo-500 text-white"
          >
            <UserCircleIcon className="h-3 w-3" />
          </span>
        ) : assignedTeam ? (
          <span
            title={`Team: ${assignedTeam.name}`}
            className="ml-auto h-2 w-2 rounded-full"
            style={{ background: assignedTeam.color }}
          />
        ) : null}
      </div>
    </button>
  )
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const { currentOrgId } = useOrgStore()
  const { userName } = useAuthStore()
  const navigate = useNavigate()

  const [ticket, setTicket] = useState<SupportTicketRecord | null>(null)
  const [messages, setMessages] = useState<SupportTicketMessageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [csatRequesting, setCsatRequesting] = useState(false)
  // Tracks whether the operator already fired Request CSAT this session.
  // The backend is idempotent so re-sending is safe, but a quiet "Sent"
  // state confirms the action without forcing them to dig through email.
  const [csatRequested, setCsatRequested] = useState(false)

  const load = useCallback(async () => {
    if (!currentOrgId || !ticketId) return
    setLoading(true)
    try {
      const data = await getTicketForOrg(currentOrgId, ticketId)
      setTicket(data.ticket)
      setMessages(data.messages)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ticket not found')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, ticketId])

  useEffect(() => {
    void load()
  }, [load])

  const handleResolve = async (feedback?: ResolveTicketFeedback) => {
    if (!currentOrgId || !ticket) return
    setResolving(true)
    try {
      const updated = await resolveTicket(currentOrgId, ticket.ticket_id, feedback)
      setTicket(updated)
      setShowResolveModal(false)
      toast.success(
        feedback?.knowledge_gap ||
          feedback?.ai_assessment === 'wrong' ||
          feedback?.ai_assessment === 'partial'
          ? 'Resolved — a KB draft was queued for review'
          : 'Ticket resolved'
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resolve')
    } finally {
      setResolving(false)
    }
  }

  const handleRegenerateBrief = async () => {
    if (!currentOrgId || !ticket) return
    setRegenerating(true)
    try {
      const brief = await regenerateHandoffBrief(currentOrgId, ticket.ticket_id)
      setTicket((prev) => (prev ? { ...prev, handoff_brief: brief } : prev))
      toast.success('Brief regenerated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate brief')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRequestCsat = async () => {
    if (!currentOrgId || !ticket) return
    setCsatRequesting(true)
    try {
      await requestCsat(currentOrgId, ticket.ticket_id)
      setCsatRequested(true)
      toast.success(`CSAT survey emailed to ${ticket.visitor_email ?? 'the customer'}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send CSAT survey')
    } finally {
      setCsatRequesting(false)
    }
  }

  // Lifecycle action runner — shared optimistic-update + rollback flow for
  // all the discrete POST endpoints (pending/on-hold/reopen/close/classify/
  // route/escalation-ack). The acting prop disables the bar while one is
  // in flight.
  const [actingLifecycle, setActingLifecycle] = useState<string | null>(null)
  const runLifecycle = useCallback(
    async (
      label: string,
      action: (orgId: string, ticketId: string) => Promise<SupportTicketRecord>,
      successMessage?: string
    ) => {
      if (!currentOrgId || !ticket) return
      setActingLifecycle(label)
      try {
        const updated = await action(currentOrgId, ticket.ticket_id)
        setTicket(updated)
        toast.success(successMessage ?? `${label} done`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `${label} failed`)
      } finally {
        setActingLifecycle(null)
      }
    },
    [currentOrgId, ticket]
  )

  // `now` captured at mount so the SLA pill stays pure across renders.
  const [now] = useState(() => Date.now())

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }
  if (!ticket) {
    return (
      <div className="min-h-full bg-[#ebebeb] p-6">
        <button
          onClick={() => navigate('/support/tickets')}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← All tickets
        </button>
        <p className="mt-4 text-sm text-gray-500">
          This ticket does not exist or has been removed.
        </p>
      </div>
    )
  }

  const ticketNumber = ticket.ticket_number ?? ticket.ticket_id.slice(0, 8)
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-3xl space-y-5">
        <button
          onClick={() => navigate('/support/tickets')}
          className="inline-flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" /> All tickets
        </button>

        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <code className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700">
              {ticketNumber}
            </code>
            <StatusBadge status={ticket.status} />
            {ticket.priority !== 'medium' && <PriorityChip priority={ticket.priority} />}
            <SlaPill ticket={ticket} now={now} />
            <div className="ml-auto flex items-center gap-2">
              {currentOrgId && <AssignControl orgId={currentOrgId} itemId={ticket.ticket_id} />}
              {!isClosed && (
                <button
                  onClick={() => setShowResolveModal(true)}
                  disabled={resolving}
                  className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {resolving ? 'Resolving…' : 'Mark resolved'}
                </button>
              )}
            </div>
          </div>
          <h1 className="mt-3 text-xl font-bold tracking-tight text-gray-950">{ticket.subject}</h1>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500 sm:grid-cols-3">
            <div>
              <span className="font-semibold text-gray-700">Visitor:</span>{' '}
              {ticket.visitor_name ?? ticket.visitor_email ?? '—'}
            </div>
            {ticket.visitor_email && (
              <div>
                <span className="font-semibold text-gray-700">Email:</span> {ticket.visitor_email}
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-700">Source:</span>{' '}
              {ticket.source ?? 'unknown'}
            </div>
            <div title={new Date(ticket.created_at).toLocaleString()}>
              <span className="font-semibold text-gray-700">Opened:</span>{' '}
              {relativeTimeShort(ticket.created_at, now)}
            </div>
            {ticket.resolved_at && (
              <div title={new Date(ticket.resolved_at).toLocaleString()}>
                <span className="font-semibold text-gray-700">Resolved:</span>{' '}
                {relativeTimeShort(ticket.resolved_at, now)}
              </div>
            )}
          </div>

          {currentOrgId && (
            <TicketPropertyControls
              orgId={currentOrgId}
              ticket={ticket}
              onTicketUpdate={(t) => setTicket(t)}
            />
          )}

          <LifecycleBar
            ticket={ticket}
            acting={actingLifecycle}
            disabled={!currentOrgId}
            onMarkPending={() =>
              currentOrgId && runLifecycle('pending', markTicketPending, 'Marked pending')
            }
            onMarkOnHold={() =>
              currentOrgId && runLifecycle('on-hold', markTicketOnHold, 'Put on hold')
            }
            onReopen={() => currentOrgId && runLifecycle('reopen', reopenTicket, 'Ticket reopened')}
            onClose={() => currentOrgId && runLifecycle('close', closeTicket, 'Ticket closed')}
            onClassify={() =>
              currentOrgId && runLifecycle('classify', classifyTicket, 'AI re-classified')
            }
            onRoute={() => currentOrgId && runLifecycle('route', routeTicket, 'Re-routed to queue')}
            onAckEscalation={() =>
              currentOrgId &&
              runLifecycle('ack-escalation', ackEscalation, 'Escalation acknowledged')
            }
          />

          {ticket.status === 'resolved' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                <StarIcon className="h-3.5 w-3.5 text-amber-500" />
                Customer satisfaction
              </div>
              <button
                type="button"
                onClick={handleRequestCsat}
                disabled={csatRequesting || csatRequested}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition',
                  csatRequested
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                  csatRequesting && 'cursor-wait opacity-70'
                )}
                title={
                  ticket.visitor_email
                    ? `Email a 5-star CSAT survey to ${ticket.visitor_email}`
                    : 'Email a CSAT survey to the customer'
                }
              >
                {csatRequested ? (
                  <>
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                    Survey sent
                  </>
                ) : (
                  <>
                    <EnvelopeIcon className="h-3.5 w-3.5" />
                    {csatRequesting ? 'Sending…' : 'Request CSAT'}
                  </>
                )}
              </button>
              <span className="text-[11px] text-gray-400">
                Customer rates 1–5 stars. Backend deduplicates on re-send.
              </span>
            </div>
          )}
        </div>

        <HandoffBriefCard
          ticket={ticket}
          regenerating={regenerating}
          onRegenerate={handleRegenerateBrief}
          onUseSuggestion={(text) => {
            setReplyDraft(text)
            toast.success('Suggested reply loaded — edit before sending')
          }}
        />

        {currentOrgId && <IntegrationsPanel orgId={currentOrgId} ticketId={ticket.ticket_id} />}

        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.message_id}
              className={
                m.sender === 'agent'
                  ? 'flex justify-end'
                  : m.sender === 'system'
                    ? 'flex justify-center'
                    : 'flex justify-start'
              }
            >
              <div
                className={
                  m.sender === 'agent'
                    ? 'max-w-[80%] rounded-2xl bg-slate-950 px-4 py-2.5 text-[14px] leading-6 text-white'
                    : m.sender === 'system'
                      ? 'rounded-lg bg-slate-50 px-3 py-1.5 text-xs text-slate-500'
                      : 'max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-[14px] leading-6 text-slate-800'
                }
              >
                {m.sender !== 'system' && (
                  <div className="mb-0.5 text-[11px] font-semibold text-slate-500">
                    {m.sender === 'agent' ? (m.sender_name ?? 'You') : (m.sender_name ?? 'Visitor')}
                    <span
                      className="ml-2 font-normal text-slate-400"
                      title={new Date(m.created_at).toLocaleString()}
                    >
                      {relativeTimeShort(m.created_at, now)}
                    </span>
                  </div>
                )}
                {m.body && <div className="whitespace-pre-wrap">{m.body}</div>}
                {m.attachments && m.attachments.length > 0 && (
                  <AttachmentList attachments={m.attachments} dark={m.sender === 'agent'} />
                )}
              </div>
            </div>
          ))}
        </div>

        {isClosed ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            This ticket is {ticket.status}.
          </div>
        ) : (
          <AgentReplyForm
            ticketId={ticket.ticket_id}
            orgId={ticket.org_id}
            senderName={userName ?? 'Teammate'}
            body={replyDraft}
            onBodyChange={setReplyDraft}
            onSent={(msg, status) => {
              setMessages((prev) => [...prev, msg])
              if (status) setTicket((prev) => (prev ? { ...prev, status } : prev))
            }}
          />
        )}
      </div>

      {showResolveModal && (
        <ResolveModal
          resolving={resolving}
          onClose={() => setShowResolveModal(false)}
          onResolve={handleResolve}
        />
      )}
    </div>
  )
}

function AgentReplyForm({
  ticketId,
  orgId,
  body,
  onBodyChange,
  onSent,
}: {
  ticketId: string
  orgId: string
  senderName: string
  body: string
  onBodyChange: (v: string) => void
  onSent: (msg: SupportTicketMessageRecord, newStatus?: SupportTicketRecord['status']) => void
}) {
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState<TicketAttachmentRecord[]>([])
  const [uploading, setUploading] = useState(false)

  const send = async () => {
    const text = body.trim()
    if (!text && attachments.length === 0) return
    setSending(true)
    try {
      const msg = await replyToTicket(
        orgId,
        ticketId,
        text,
        attachments.length ? attachments : undefined
      )
      // Server auto-transitions open → in_progress on first agent reply
      onSent(msg, 'in_progress')
      onBodyChange('')
      setAttachments([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <textarea
        value={body}
        onChange={(e) => onBodyChange(e.target.value)}
        rows={4}
        placeholder="Reply to the visitor — they'll get an email."
        className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
      />
      <AttachmentPicker
        attachments={attachments}
        uploading={uploading}
        onUpload={async (file) => {
          setUploading(true)
          try {
            const a = await uploadTicketAttachment(orgId, file)
            setAttachments((prev) => [...prev, a])
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Upload failed')
          } finally {
            setUploading(false)
          }
        }}
        onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
      />
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Visitor will be notified by email.</p>
        <button
          type="button"
          onClick={send}
          disabled={sending || uploading || (!body.trim() && attachments.length === 0)}
          className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {sending ? 'Sending…' : 'Send reply'}
        </button>
      </div>
    </div>
  )
}

// ── Attachment UI (shared) ────────────────────────────────────────────────────

const MAX_ATTACHMENT_MB = 10

function AttachmentList({
  attachments,
  dark,
}: {
  attachments: TicketAttachmentRecord[]
  dark?: boolean
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const isImage = a.content_type.startsWith('image/') && a.url
        if (isImage) {
          return (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={a.url}
                alt={a.name}
                className="max-h-40 max-w-[200px] rounded-lg border border-black/10 object-cover"
              />
            </a>
          )
        }
        return (
          <a
            key={a.id}
            href={a.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
              dark
                ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            )}
          >
            <PaperClipIcon className="h-3.5 w-3.5" />
            <span className="max-w-[160px] truncate">{a.name}</span>
          </a>
        )
      })}
    </div>
  )
}

function AttachmentPicker({
  attachments,
  uploading,
  onUpload,
  onRemove,
}: {
  attachments: TicketAttachmentRecord[]
  uploading: boolean
  onUpload: (file: File) => void | Promise<void>
  onRemove: (id: string) => void
}) {
  return (
    <div className="mt-2">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600"
            >
              <PaperClipIcon className="h-3 w-3" />
              <span className="max-w-[140px] truncate">{a.name}</span>
              <button
                type="button"
                onClick={() => onRemove(a.id)}
                className="ml-0.5 text-slate-400 hover:text-slate-700"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-slate-800">
        <PaperClipIcon className="h-3.5 w-3.5" />
        {uploading ? 'Uploading…' : 'Attach file'}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          accept="image/*,application/pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
              toast.error(`File too large (max ${MAX_ATTACHMENT_MB} MB)`)
              return
            }
            void onUpload(file)
          }}
        />
      </label>
    </div>
  )
}

// ── New ticket modal (operator) ───────────────────────────────────────────────

// The manual "Create inquiry" flow — distinct from the AI's auto-opened
// tickets. An operator picks a type, writes it up, attaches a screenshot,
// optionally assigns a teammate + recipients, and drops it straight into a
// board column (presetStatus) or the default queue.

const INQUIRY_TYPES: {
  value: string
  label: string
  Icon: typeof BugAntIcon
  priority?: SupportTicketRecord['priority']
}[] = [
  { value: 'question', label: 'Question', Icon: QuestionMarkCircleIcon },
  { value: 'bug', label: 'Bug', Icon: BugAntIcon },
  { value: 'crash', label: 'Crash report', Icon: ExclamationTriangleIcon, priority: 'high' },
  { value: 'incident', label: 'Incident', Icon: FireIcon, priority: 'urgent' },
  { value: 'feature', label: 'Feature request', Icon: LightBulbIcon },
  { value: 'task', label: 'Task', Icon: ClipboardDocumentListIcon },
]

function miniInitials(name?: string | null): string {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?'
}

function NewTicketModal({
  orgId,
  presetStatus,
  onClose,
  onCreated,
}: {
  orgId: string
  presetStatus?: SupportTicketRecord['status']
  onClose: () => void
  onCreated: (ticket: SupportTicketRecord) => void
}) {
  const assignPreview = useTeamsPreview((s) => s.assign)

  const [type, setType] = useState('question')
  const [typeOpen, setTypeOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<TicketAttachmentRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [assignee, setAssignee] = useState<AgentAvailabilityRecord | null>(null)
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [recipients, setRecipients] = useState<CustomerProfile[]>([])
  const [recipientsOpen, setRecipientsOpen] = useState(false)
  const [recipientQuery, setRecipientQuery] = useState('')
  const [agents, setAgents] = useState<AgentAvailabilityRecord[]>([])
  const [contacts, setContacts] = useState<CustomerProfile[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listAgentAvailability(orgId)
      .then(setAgents)
      .catch(() => {})
    listSupportCustomers(orgId)
      .then(setContacts)
      .catch(() => {})
  }, [orgId])

  const selectedType = INQUIRY_TYPES.find((t) => t.value === type) ?? INQUIRY_TYPES[0]
  const recipientMatches = (() => {
    const q = recipientQuery.trim().toLowerCase()
    const chosen = new Set(recipients.map((r) => r.customer_id))
    return contacts
      .filter((c) => !chosen.has(c.customer_id))
      .filter((c) =>
        q ? c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) : true
      )
      .slice(0, 6)
  })()

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0) return
    setUploading(true)
    try {
      for (const file of list) {
        if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
          toast.error(`${file.name} is too large (max ${MAX_ATTACHMENT_MB} MB)`)
          continue
        }
        const a = await uploadTicketAttachment(orgId, file)
        setAttachments((prev) => [...prev, a])
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required')
      return
    }
    setSaving(true)
    try {
      const primary = recipients[0]
      const ticket = await createManualTicket(orgId, {
        subject: title.trim(),
        details: description.trim(),
        priority: selectedType.priority ?? 'medium',
        visitor_email: primary?.email || undefined,
        visitor_name: primary?.name || undefined,
        attachments: attachments.length ? attachments : undefined,
      })
      // Best-effort follow-ups (each independent — a failure here doesn't undo
      // the ticket, so they're swallowed rather than surfaced as a create error).
      if (presetStatus && presetStatus !== ticket.status) {
        try {
          await setTicketStatus(orgId, ticket.ticket_id, presetStatus)
        } catch {
          /* leave in default status */
        }
      }
      try {
        await setTicketCategory(orgId, ticket.ticket_id, selectedType.label)
      } catch {
        /* category is non-critical */
      }
      if (assignee) {
        assignPreview(ticket.ticket_id, { assignee_user_id: assignee.user_id })
      }
      toast.success(`Ticket ${ticket.ticket_number ?? ''} created`)
      onCreated({ ...ticket, status: presetStatus ?? ticket.status })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create ticket')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-4">
          <h2 className="text-center text-base font-bold text-gray-900">Create new inquiry</h2>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Type selector */}
        <div className="relative mb-4">
          <button
            type="button"
            onClick={() => setTypeOpen((v) => !v)}
            className="flex w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 transition hover:border-gray-300"
          >
            <selectedType.Icon className="h-4 w-4 text-gray-500" />
            <span className="flex-1 text-left">{selectedType.label}</span>
            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
          </button>
          {typeOpen && (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setTypeOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                {INQUIRY_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setType(t.value)
                      setTypeOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-gray-50',
                      type === t.value ? 'font-semibold text-gray-900' : 'text-gray-700'
                    )}
                  >
                    <t.Icon className="h-4 w-4 text-gray-500" />
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Title */}
        <label htmlFor="new-ticket-title" className="mb-1.5 block text-sm font-bold text-gray-800">
          Title
        </label>
        <input
          id="new-ticket-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short summary"
          className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
        />

        {/* Description */}
        <label htmlFor="new-ticket-desc" className="mb-1.5 block text-sm font-bold text-gray-800">
          Description
        </label>
        <textarea
          id="new-ticket-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="What's going on?"
          className="mb-4 w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
        />

        {/* Screenshot / attachments drop zone */}
        <ScreenshotDropZone
          attachments={attachments}
          uploading={uploading}
          onFiles={uploadFiles}
          onRemove={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
        />

        {/* Assignee */}
        <div className="mb-3 mt-4">
          <div className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm font-semibold text-gray-700">Assignee:</span>
            {assignee ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {miniInitials(assignee.user_name ?? assignee.email)}
                </span>
                {assignee.user_name ?? assignee.email}
                <button
                  type="button"
                  onClick={() => setAssignee(null)}
                  className="ml-1 text-gray-400 hover:text-gray-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAssigneeOpen((v) => !v)}
                className="text-sm text-gray-400 hover:text-gray-700"
              >
                Select assignee (optional)
              </button>
            )}
          </div>
          {assigneeOpen && !assignee && (
            <div className="mt-2 overflow-hidden rounded-xl border border-gray-200">
              {agents.length === 0 ? (
                <p className="px-3 py-2 text-xs text-gray-400">Loading teammates…</p>
              ) : (
                agents.map((a) => (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => {
                      setAssignee(a)
                      setAssigneeOpen(false)
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                      {miniInitials(a.user_name ?? a.email)}
                    </span>
                    {a.user_name ?? a.email}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className="mb-5">
          <div className="flex items-start gap-3">
            <span className="w-24 shrink-0 pt-1 text-sm font-semibold text-gray-700">
              Recipients:
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {recipients.map((r) => (
                  <span
                    key={r.customer_id}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 py-0.5 pl-2 pr-1 text-xs font-medium text-gray-700"
                  >
                    {r.name || r.email}
                    <button
                      type="button"
                      onClick={() =>
                        setRecipients((prev) => prev.filter((x) => x.customer_id !== r.customer_id))
                      }
                      className="text-gray-400 hover:text-gray-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <input
                  value={recipientQuery}
                  onChange={(e) => {
                    setRecipientQuery(e.target.value)
                    setRecipientsOpen(true)
                  }}
                  onFocus={() => setRecipientsOpen(true)}
                  placeholder={recipients.length ? 'Add another…' : 'Select recipients (optional)'}
                  className="min-w-[140px] flex-1 bg-transparent py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
              </div>
              {recipientsOpen && recipientMatches.length > 0 && (
                <div className="mt-1 overflow-hidden rounded-xl border border-gray-200">
                  {recipientMatches.map((c) => (
                    <button
                      key={c.customer_id}
                      type="button"
                      onClick={() => {
                        setRecipients((prev) => [...prev, c])
                        setRecipientQuery('')
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    >
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                        {miniInitials(c.name ?? c.email)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate">{c.name || c.email}</span>
                        {c.name && c.email && (
                          <span className="block truncate text-xs text-gray-400">{c.email}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {recipients.length > 1 && (
                <p className="mt-1 text-[11px] text-gray-400">
                  The first recipient is set as the ticket customer.
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={saving || uploading || !title.trim() || !description.trim()}
          className="w-full rounded-lg bg-[#020308] py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {saving ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  )
}

function ScreenshotDropZone({
  attachments,
  uploading,
  onFiles,
  onRemove,
}: {
  attachments: TicketAttachmentRecord[]
  uploading: boolean
  onFiles: (files: FileList | File[]) => void
  onRemove: (id: string) => void
}) {
  const [dragOver, setDragOver] = useState(false)
  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files)
        }}
        className={cn(
          'flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-5 text-center transition',
          dragOver ? 'border-[#020308] bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input
          type="file"
          multiple
          accept="image/*,application/pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {attachments.length === 0 ? (
          <>
            <PhotoIcon className="mb-1.5 h-7 w-7 text-gray-400" />
            <p className="text-sm font-semibold text-gray-600">
              {uploading ? 'Uploading…' : 'Screenshot'}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">JPG, PNG, SVG · drag & drop or click</p>
          </>
        ) : (
          <div className="flex w-full flex-wrap gap-2">
            {attachments.map((a) =>
              a.content_type.startsWith('image/') && a.url ? (
                <span key={a.id} className="relative">
                  <img
                    src={a.url}
                    alt={a.name}
                    className="h-20 w-28 rounded-lg border border-gray-200 object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      onRemove(a.id)
                    }}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gray-900 text-white"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ) : (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-700"
                >
                  <PaperClipIcon className="h-3.5 w-3.5" />
                  <span className="max-w-[120px] truncate">{a.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      onRemove(a.id)
                    }}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )
            )}
            {uploading && (
              <span className="grid h-20 w-28 place-items-center rounded-lg border border-dashed border-gray-300 text-[11px] text-gray-400">
                Uploading…
              </span>
            )}
          </div>
        )}
      </label>
    </div>
  )
}

// Status + priority both render through the shared on-brand Pill so the whole
// product uses one consistent badge shape and palette.
function StatusBadge({ status }: { status: SupportTicketRecord['status'] }) {
  const { tone, label } = ticketStatusMeta(status)
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  )
}

function PriorityChip({ priority }: { priority: SupportTicketRecord['priority'] }) {
  const { tone, label } = priorityMeta(priority)
  return (
    <Pill tone={tone} uppercase className="text-[10px]">
      {label}
    </Pill>
  )
}

// ── Handoff brief (§6.3) ──────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  vip_auto: 'VIP customer',
  sentiment: 'Negative sentiment',
  repeated_failure: 'Repeated failure',
  multi_turn_confusion: 'Going in circles',
  sla_pressure: 'SLA pressure',
  force_escalate: 'Sensitive intent',
  agent: 'AI handed off',
  ai_unknown: 'AI unsure',
  usage_cap: 'Reply cap reached',
  manual: 'Manually escalated',
  error: 'AI error',
}

function HandoffBriefCard({
  ticket,
  regenerating,
  onRegenerate,
  onUseSuggestion,
}: {
  ticket: SupportTicketRecord
  regenerating: boolean
  onRegenerate: () => void
  onUseSuggestion: (text: string) => void
}) {
  const brief = ticket.handoff_brief

  // No brief yet (still generating async, or generation failed) — offer to make one.
  if (!brief) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-indigo-900">Handoff brief</p>
          </div>
          <button
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:opacity-60"
          >
            <ArrowPathIcon className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
            {regenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-indigo-700/70">
          Lira can summarize who this is, what they need, and a suggested reply so you can act fast.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50/50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-semibold text-indigo-900">Handoff brief</p>
          {ticket.handoff_trigger && TRIGGER_LABELS[ticket.handoff_trigger] && (
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
              {TRIGGER_LABELS[ticket.handoff_trigger]}
            </span>
          )}
        </div>
        <button
          onClick={onRegenerate}
          disabled={regenerating}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-indigo-600 transition hover:bg-white disabled:opacity-60"
        >
          <ArrowPathIcon className={cn('h-3.5 w-3.5', regenerating && 'animate-spin')} />
          {regenerating ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      <div className="space-y-4 p-4">
        <BriefRow label="Customer">{brief.customer_summary}</BriefRow>
        <BriefRow label="Issue">{brief.issue_summary}</BriefRow>

        {brief.what_agent_tried.length > 0 && (
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              What Lira tried
            </p>
            <ul className="space-y-1">
              {brief.what_agent_tried.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-gray-300">→</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
          <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            What you need to do
          </p>
          <p className="text-sm font-medium text-amber-900">{brief.what_human_needs_to_do}</p>
        </div>

        {brief.suggested_response && (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Suggested reply
              </p>
              <button
                onClick={() => onUseSuggestion(brief.suggested_response)}
                className="rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-slate-800"
              >
                Use this reply
              </button>
            </div>
            <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-700">
              {brief.suggested_response}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function BriefRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="text-sm text-gray-700">{children}</p>
    </div>
  )
}

// ── Resolve + round-trip learning (§6.4) ──────────────────────────────────────

function ResolveModal({
  resolving,
  onClose,
  onResolve,
}: {
  resolving: boolean
  onClose: () => void
  onResolve: (feedback?: ResolveTicketFeedback) => void
}) {
  const [assessment, setAssessment] = useState<ResolveTicketFeedback['ai_assessment']>()
  const [knowledgeGap, setKnowledgeGap] = useState(false)
  const [gapNote, setGapNote] = useState('')
  const [outcomeNote, setOutcomeNote] = useState('')

  const willDraft = knowledgeGap || assessment === 'wrong' || assessment === 'partial'

  const submit = () => {
    onResolve({
      ai_assessment: assessment,
      knowledge_gap: knowledgeGap || undefined,
      gap_note: gapNote.trim() || undefined,
      outcome_note: outcomeNote.trim() || undefined,
    })
  }

  const assessmentOptions: {
    value: NonNullable<ResolveTicketFeedback['ai_assessment']>
    label: string
    cls: string
  }[] = [
    { value: 'correct', label: 'AI was right', cls: 'data-[on=true]:bg-emerald-600' },
    { value: 'partial', label: 'Partly right', cls: 'data-[on=true]:bg-amber-500' },
    { value: 'wrong', label: 'AI was wrong', cls: 'data-[on=true]:bg-red-600' },
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Resolve ticket</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-400">
          Tell Lira how this went — it's optional, and it's how Lira gets better at handling this
          next time.
        </p>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              How did the AI do?
            </p>
            <div className="flex gap-1.5">
              {assessmentOptions.map((opt) => (
                <button
                  key={opt.value}
                  data-on={assessment === opt.value}
                  onClick={() => setAssessment(assessment === opt.value ? undefined : opt.value)}
                  className={cn(
                    'flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 transition data-[on=true]:border-transparent data-[on=true]:text-white',
                    opt.cls
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              What did you do to resolve it?
            </p>
            <textarea
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              rows={3}
              placeholder="e.g. Issued the refund and confirmed the new plan price."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={knowledgeGap}
              onChange={(e) => setKnowledgeGap(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Knowledge was missing that should be added to the KB</span>
          </label>

          {knowledgeGap && (
            <textarea
              value={gapNote}
              onChange={(e) => setGapNote(e.target.value)}
              rows={2}
              placeholder="What was missing? (optional)"
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-slate-900 focus:bg-white"
            />
          )}

          {willDraft && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-800">
              <LightBulbIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <span>Lira will draft a KB entry from your answer and queue it for review.</span>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => onResolve()}
            disabled={resolving}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-500 transition hover:bg-gray-100 disabled:opacity-60"
          >
            Skip &amp; resolve
          </button>
          <button
            onClick={submit}
            disabled={resolving}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {resolving ? 'Resolving…' : 'Resolve'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Integrations panel (Phase 6 §4.4 + §4.5 + Phase 7 §5.5) ──────────────
//
// Three operator surfaces glued into one card on the ticket detail:
//   • External links — list of Slack/Linear/webhook back-pointers + manual
//     add form (operator pasted a Linear URL after a side-conversation).
//   • Force sync — small button group, one per provider. Enqueues a fresh
//     delivery (useful after fixing a Slack channel id or Linear team).
//   • Audit export — JSON / CSV download of the immutable event timeline.

const PROVIDER_OPTIONS: { value: OutboxProvider; label: string }[] = [
  { value: 'slack', label: 'Slack' },
  { value: 'linear', label: 'Linear' },
  { value: 'webhook', label: 'Webhook' },
]

function IntegrationsPanel({ orgId, ticketId }: { orgId: string; ticketId: string }) {
  const [links, setLinks] = useState<ExternalLink[]>([])
  const [loadingLinks, setLoadingLinks] = useState(true)
  const [adding, setAdding] = useState(false)
  const [syncing, setSyncing] = useState<OutboxProvider | null>(null)
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null)

  const loadLinks = useCallback(async () => {
    setLoadingLinks(true)
    try {
      const next = await listExternalLinks(orgId, ticketId)
      setLinks(next)
    } catch {
      // External links are non-critical — fail quietly. The empty-state copy
      // covers both "none yet" and "couldn't load".
      setLinks([])
    } finally {
      setLoadingLinks(false)
    }
  }, [orgId, ticketId])

  useEffect(() => {
    void loadLinks()
  }, [loadLinks])

  const handleSync = useCallback(
    async (provider: OutboxProvider) => {
      setSyncing(provider)
      try {
        await forceSyncTicket(orgId, ticketId, provider)
        toast.success(`Sync to ${provider} queued`)
        // External links may show up after the worker drains — poll once.
        window.setTimeout(() => void loadLinks(), 1500)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to sync to ${provider}`)
      } finally {
        setSyncing(null)
      }
    },
    [orgId, ticketId, loadLinks]
  )

  const handleExport = useCallback(
    async (format: 'json' | 'csv') => {
      setExporting(format)
      try {
        const filename = await downloadTicketAudit(orgId, ticketId, format)
        toast.success(`Downloaded ${filename}`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Audit export failed')
      } finally {
        setExporting(null)
      }
    },
    [orgId, ticketId]
  )

  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <LinkIcon className="h-4 w-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">Integrations &amp; audit</h2>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            External links
          </p>
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            className="text-[11px] font-semibold text-[#020308] underline-offset-2 hover:underline"
          >
            {adding ? 'Cancel' : '+ Add link'}
          </button>
        </div>

        {loadingLinks ? (
          <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
        ) : links.length === 0 ? (
          <p className="text-[12px] text-gray-400">
            No external links yet. Force-sync below, or paste one manually.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {links.map((l, idx) => (
              <li
                key={`${l.provider}-${l.external_id}-${idx}`}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/60 px-2.5 py-1.5"
              >
                <ProviderBadgeInline provider={l.provider} />
                <code className="flex-1 truncate font-mono text-[11px] text-gray-600">
                  {l.external_id}
                </code>
                <a
                  href={l.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#020308] hover:underline"
                >
                  Open
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {adding && (
          <AddExternalLinkForm
            onSubmit={async (payload) => {
              try {
                const created = await createExternalLink(orgId, ticketId, payload)
                setLinks((prev) => [...prev, created])
                setAdding(false)
                toast.success('Link added')
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Failed to add link')
              }
            }}
            onCancel={() => setAdding(false)}
          />
        )}
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Force sync
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PROVIDER_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleSync(p.value)}
              disabled={syncing !== null}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
                syncing === p.value && 'cursor-wait opacity-70'
              )}
            >
              <ArrowPathIcon
                className={cn('h-3 w-3', syncing === p.value && 'animate-spin')}
                aria-hidden
              />
              Sync to {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
              Audit export
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Immutable event timeline. Use for compliance reviews and post-incident analysis.
            </p>
          </div>
          <div className="flex gap-1.5">
            {(['json', 'csv'] as const).map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => handleExport(format)}
                disabled={exporting !== null}
                className={cn(
                  'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
                  exporting === format && 'cursor-wait opacity-70'
                )}
              >
                <ArrowDownTrayIcon className="h-3 w-3" aria-hidden />
                {exporting === format ? '…' : format}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AddExternalLinkForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (payload: {
    provider: OutboxProvider
    external_id: string
    external_url: string
  }) => Promise<void>
  onCancel: () => void
}) {
  const [provider, setProvider] = useState<OutboxProvider>('linear')
  const [externalId, setExternalId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!externalId.trim() || !externalUrl.trim()) return
        setSubmitting(true)
        try {
          await onSubmit({
            provider,
            external_id: externalId.trim(),
            external_url: externalUrl.trim(),
          })
        } finally {
          setSubmitting(false)
        }
      }}
      className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
    >
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as OutboxProvider)}
          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
        >
          {PROVIDER_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <input
          value={externalId}
          onChange={(e) => setExternalId(e.target.value)}
          placeholder={
            provider === 'linear' ? 'LIR-1234' : provider === 'slack' ? '1716895200.000123' : 'id'
          }
          className="rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
        />
      </div>
      <input
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="https://…"
        type="url"
        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-gray-500 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !externalId.trim() || !externalUrl.trim()}
          className="rounded-md bg-[#020308] px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add link'}
        </button>
      </div>
    </form>
  )
}

const PROVIDER_INLINE_COLOR: Record<OutboxProvider, string> = {
  slack: 'bg-[#4A154B]/10 text-[#4A154B]',
  linear: 'bg-[#5E6AD2]/10 text-[#5E6AD2]',
  webhook: 'bg-gray-100 text-gray-700',
}

function ProviderBadgeInline({ provider }: { provider: OutboxProvider }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        PROVIDER_INLINE_COLOR[provider]
      )}
    >
      {provider}
    </span>
  )
}

// ── Lifecycle action bar (§1.1) ──────────────────────────────────────────
//
// Discrete POST-driven status transitions. Each button only renders when
// the destination transition is *useful* from the current state — e.g. no
// "Reopen" on a ticket that isn't already terminal, no "Mark pending" if
// it's already pending.
//
// We deliberately don't render an "Escalate" button here because escalation
// requires a target (tier/queue/user) and deserves its own modal — that
// belongs in a follow-up. The "Ack escalation" button does appear when the
// ticket is already escalated so the on-call can clear the flag.

function LifecycleBar({
  ticket,
  acting,
  disabled,
  onMarkPending,
  onMarkOnHold,
  onReopen,
  onClose,
  onClassify,
  onRoute,
  onAckEscalation,
}: {
  ticket: SupportTicketRecord
  acting: string | null
  disabled?: boolean
  onMarkPending: () => void
  onMarkOnHold: () => void
  onReopen: () => void
  onClose: () => void
  onClassify: () => void
  onRoute: () => void
  onAckEscalation: () => void
}) {
  const s = ticket.status as string
  const isActive = s === 'open' || s === 'in_progress'
  const isTerminal = s === 'resolved' || s === 'closed' || s === 'merged'

  const actions: { key: string; label: string; show: boolean; onClick: () => void }[] = [
    { key: 'pending', label: 'Mark pending', show: isActive, onClick: onMarkPending },
    { key: 'on-hold', label: 'Put on hold', show: isActive, onClick: onMarkOnHold },
    { key: 'reopen', label: 'Reopen', show: s === 'resolved' || s === 'closed', onClick: onReopen },
    {
      key: 'close',
      label: 'Close',
      show: s === 'resolved' || s === 'pending' || s === 'on_hold',
      onClick: onClose,
    },
    { key: 'classify', label: 'Re-classify', show: !isTerminal, onClick: onClassify },
    { key: 'route', label: 'Re-route', show: !isTerminal, onClick: onRoute },
    {
      key: 'ack-escalation',
      label: 'Ack escalation',
      show: s === 'escalated',
      onClick: onAckEscalation,
    },
  ].filter((a) => a.show)

  if (actions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-gray-100 pt-3">
      <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        Actions
      </span>
      {actions.map((a) => (
        <button
          key={a.key}
          type="button"
          onClick={a.onClick}
          disabled={disabled || acting !== null}
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900',
            acting === a.key && 'cursor-wait opacity-70'
          )}
        >
          {acting === a.key ? '…' : a.label}
        </button>
      ))}
    </div>
  )
}

// ── Inline PATCH controls (priority / category / queue / assignee) ───────
//
// Compact <select> row that PATCHes on change. Each control is optimistic
// — the new value renders immediately, then the server-acknowledged ticket
// replaces it on success or rolls back on failure.

function TicketPropertyControls({
  orgId,
  ticket,
  onTicketUpdate,
}: {
  orgId: string
  ticket: SupportTicketRecord
  onTicketUpdate: (t: SupportTicketRecord) => void
}) {
  const [queues, setQueues] = useState<SupportQueue[]>([])
  const [categories, setCategories] = useState<TicketCategoryRecord[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    listQueues(orgId)
      .then(setQueues)
      .catch(() => setQueues([]))
    listTicketCategories(orgId)
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [orgId])

  const wrap = useCallback(
    async <T,>(label: string, op: () => Promise<T>, after: (t: T) => void) => {
      setBusy(label)
      try {
        const res = await op()
        after(res)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed to update ${label}`)
      } finally {
        setBusy(null)
      }
    },
    []
  )

  const selectClass =
    'rounded-md border border-gray-200 bg-white px-2 py-1 text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none disabled:opacity-50'

  // The current ticket type narrows the assignee union — we can't pull org
  // members from a single endpoint yet, so the assign control is a free-text
  // user-id input for now (consistent with the way handoff-brief surfaces it).
  const currentCategory = (ticket as SupportTicketRecord & { category?: string }).category ?? ''

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
      <PropertyField label="Priority">
        <select
          value={ticket.priority}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'priority',
              () =>
                setTicketPriority(
                  orgId,
                  ticket.ticket_id,
                  e.target.value as SupportTicketRecord['priority']
                ),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Category">
        <select
          value={currentCategory}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'category',
              () => setTicketCategory(orgId, ticket.ticket_id, e.target.value),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          {currentCategory === '' && <option value="">(none)</option>}
          {categories.length === 0 && currentCategory !== '' && (
            <option value={currentCategory}>{currentCategory}</option>
          )}
          {categories.map((c) => (
            <option key={c.category} value={c.category}>
              {c.label}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Queue">
        <select
          value={(ticket as SupportTicketRecord & { queue_id?: string }).queue_id ?? ''}
          disabled={busy !== null}
          onChange={(e) =>
            void wrap(
              'queue',
              () => setTicketQueue(orgId, ticket.ticket_id, e.target.value || null),
              onTicketUpdate
            )
          }
          className={selectClass}
        >
          <option value="">(unrouted)</option>
          {queues.map((q) => (
            <option key={q.queue_id} value={q.queue_id}>
              {q.name}
            </option>
          ))}
        </select>
      </PropertyField>

      <PropertyField label="Assignee">
        <AssigneeInput
          value={ticket.assignee_user_id ?? ''}
          disabled={busy !== null}
          onCommit={(userId) =>
            void wrap(
              'assignee',
              () => assignTicket(orgId, ticket.ticket_id, userId || null),
              onTicketUpdate
            )
          }
        />
      </PropertyField>
    </div>
  )
}

function PropertyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      {children}
    </label>
  )
}

function AssigneeInput({
  value,
  disabled,
  onCommit,
}: {
  value: string
  disabled?: boolean
  onCommit: (userId: string) => void
}) {
  // Mirror prop into local state so the user can type without parent re-
  // sync. Use the "store previous render" pattern instead of a setState-in-
  // effect (React-recommended, satisfies react-hooks/set-state-in-effect).
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [local, setLocal] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLocal(value)
  }
  return (
    <input
      type="text"
      value={local}
      placeholder="user-id"
      disabled={disabled}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local.trim())
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
      className="rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-[12px] text-gray-700 focus:border-[#020308] focus:outline-none disabled:opacity-50"
    />
  )
}

// Tiny relative-time helper for the operator surface (§11 — "no raw ISO").
// Tooltips still carry the absolute timestamp; visible text is relative,
// e.g. "23m", "1h 12m", "yesterday", or a short date past 14 days.
function relativeTimeShort(iso: string, now: number): string {
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  const diff = now - t
  const abs = Math.abs(diff)
  if (abs < 45_000) return 'just now'
  if (abs < 3_600_000) return `${Math.round(abs / 60_000)}m ago`
  if (abs < 86_400_000) return `${Math.round(abs / 3_600_000)}h ago`
  if (abs < 7 * 86_400_000) return `${Math.round(abs / 86_400_000)}d ago`
  return new Date(iso).toLocaleDateString()
}
