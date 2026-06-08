import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CheckIcon,
  PlusIcon,
  TrashIcon,
  UserCircleIcon,
  UserGroupIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuthStore } from '@/app/store'
import { useTeamsPreview, type PreviewTeam } from '@/app/store/teams-preview-store'
import { listAgentAvailability, type AgentAvailabilityRecord } from '@/services/api/support-api'
import { cn } from '@/lib'

/**
 * Shared Teams UI — an Assign control (team + member, with presence) and a
 * Manage-teams modal. Both read/write the local Teams preview store, so they
 * drop into the inbox and tickets surfaces identically. See
 * teams-preview-store.ts for the backend contract these mirror.
 */

const TEAM_COLORS = [
  '#4f46e5', // indigo (brand)
  '#0d9488', // teal
  '#db2777', // pink
  '#d97706', // amber
  '#2563eb', // blue
  '#7c3aed', // violet
  '#dc2626', // red
  '#475569', // slate
]

function initials(name?: string | null, fallback = '?'): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || fallback
}

const PRESENCE: Record<AgentAvailabilityRecord['availability'], string> = {
  available: 'bg-emerald-500',
  away: 'bg-amber-400',
  offline: 'bg-gray-300',
}

/** Lazily load the org's agent roster once a control is opened. */
function useAgents(orgId: string, enabled: boolean): AgentAvailabilityRecord[] {
  const [agents, setAgents] = useState<AgentAvailabilityRecord[]>([])
  useEffect(() => {
    if (!enabled || agents.length > 0) return
    let alive = true
    listAgentAvailability(orgId)
      .then((a) => alive && setAgents(a))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [orgId, enabled, agents.length])
  return agents
}

function Avatar({ name, size = 20 }: { name?: string | null; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-indigo-500 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials(name)}
    </span>
  )
}

// ── Assign control ────────────────────────────────────────────────────────────

export function AssignControl({
  orgId,
  itemId,
  kind,
  compact = false,
}: {
  orgId: string
  itemId: string
  /** Which entity itemId belongs to — determines which backend endpoint
   *  receives the assignment write. Defaults to 'ticket' for backward
   *  compatibility with call sites that haven't been migrated; new call
   *  sites in the inbox should pass 'conversation'. */
  kind?: 'ticket' | 'conversation'
  /** compact = avatar-only trigger (board cards); full = avatar + label. */
  compact?: boolean
}) {
  const { userId, userName } = useAuthStore()
  const teams = useTeamsPreview((s) => s.teams)
  const assignment = useTeamsPreview((s) => s.assignments[itemId])
  const assign = useTeamsPreview((s) => s.assign)
  // Ensure the teams cache is fresh for this org so the dropdown reflects
  // the server canonical set instead of stale localStorage from a prior org.
  const syncTeams = useTeamsPreview((s) => s.syncTeams)
  useEffect(() => {
    if (orgId) void syncTeams(orgId)
  }, [orgId, syncTeams])

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const agents = useAgents(orgId, open)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const team = teams.find((t) => t.team_id === assignment?.team_id) ?? null
  const assignee = agents.find((a) => a.user_id === assignment?.assignee_user_id) ?? null
  const assigneeName =
    assignee?.user_name ??
    (assignment?.assignee_user_id === userId ? (userName ?? 'Me') : assignment?.assignee_user_id)

  // Default kind to 'ticket' for legacy call sites that don't pass it.
  const assignKind = kind ?? 'ticket'
  const setTeam = (teamId: string | null) => assign(itemId, { team_id: teamId }, assignKind)
  const setAssignee = (uid: string | null) => assign(itemId, { assignee_user_id: uid }, assignKind)

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Assign"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-gray-300 hover:text-gray-900',
          compact ? 'p-0.5' : 'py-1 pl-1 pr-2.5 text-xs font-semibold'
        )}
      >
        {assignment?.assignee_user_id ? (
          <Avatar name={assigneeName} />
        ) : (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-gray-100 text-gray-400">
            <UserCircleIcon className="h-4 w-4" />
          </span>
        )}
        {!compact && (
          <span className="max-w-[120px] truncate">
            {assignment?.assignee_user_id ? assigneeName : team ? team.name : 'Assign'}
          </span>
        )}
        {!compact && team && (
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: team.color }}
            title={`Team: ${team.name}`}
          />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="max-h-[60vh] overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => {
                setAssignee(userId ?? null)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
              <Avatar name={userName ?? 'Me'} size={22} />
              Assign to me
            </button>

            <Section label="Teams" />
            {teams.length === 0 && <Empty>No teams yet</Empty>}
            {teams.map((t) => (
              <Row
                key={t.team_id}
                active={assignment?.team_id === t.team_id}
                onClick={() => setTeam(assignment?.team_id === t.team_id ? null : t.team_id)}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: t.color }}
                />
                <span className="flex-1 truncate">{t.name}</span>
              </Row>
            ))}

            <Section label="People" />
            {agents.length === 0 && <Empty>Loading teammates…</Empty>}
            {agents.map((a) => (
              <Row
                key={a.user_id}
                active={assignment?.assignee_user_id === a.user_id}
                onClick={() => {
                  setAssignee(assignment?.assignee_user_id === a.user_id ? null : a.user_id)
                  setOpen(false)
                }}
              >
                <span className="relative shrink-0">
                  <Avatar name={a.user_name ?? a.email} size={22} />
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white',
                      PRESENCE[a.availability]
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 truncate">{a.user_name ?? a.email}</span>
              </Row>
            ))}

            {(assignment?.team_id || assignment?.assignee_user_id) && (
              <>
                <div className="my-1 h-px bg-gray-100" />
                <button
                  type="button"
                  onClick={() => {
                    assign(itemId, { team_id: null, assignee_user_id: null }, assignKind)
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-500 transition hover:bg-gray-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Unassign
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ label }: { label: string }) {
  return (
    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
      {label}
    </p>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-3 py-1.5 text-xs text-gray-400">{children}</p>
}

function Row({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm transition hover:bg-gray-50',
        active ? 'font-semibold text-gray-900' : 'text-gray-700'
      )}
    >
      {children}
      {active && <CheckIcon className="ml-auto h-4 w-4 text-[#020308]" />}
    </button>
  )
}

// ── Manage teams modal ────────────────────────────────────────────────────────

export function ManageTeamsModal({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const teams = useTeamsPreview((s) => s.teams)
  const createTeam = useTeamsPreview((s) => s.createTeam)
  const [newName, setNewName] = useState('')

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-base font-bold text-gray-900">Manage teams</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-3">
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const name = newName.trim()
              if (!name) return
              createTeam(name, TEAM_COLORS[teams.length % TEAM_COLORS.length])
              setNewName('')
            }}
          >
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New team name…"
              className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-[#020308] focus:bg-white focus:ring-1 focus:ring-[#020308]"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
            >
              <PlusIcon className="h-4 w-4" />
              Add
            </button>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {teams.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No teams yet — add one above to start assigning work.
            </p>
          ) : (
            <div className="space-y-3">
              {teams.map((t) => (
                <TeamCard key={t.team_id} orgId={orgId} team={t} />
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-2.5">
          <p className="text-[11px] text-gray-400">
            Preview — teams are stored on this device and not yet synced to the backend.
          </p>
        </div>
      </div>
    </div>
  )
}

function TeamCard({ orgId, team }: { orgId: string; team: PreviewTeam }) {
  const updateTeam = useTeamsPreview((s) => s.updateTeam)
  const deleteTeam = useTeamsPreview((s) => s.deleteTeam)
  const toggleMember = useTeamsPreview((s) => s.toggleMember)
  const [editingMembers, setEditingMembers] = useState(false)
  const agents = useAgents(orgId, editingMembers)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          title="Change color"
          onClick={() => {
            const next = TEAM_COLORS[(TEAM_COLORS.indexOf(team.color) + 1) % TEAM_COLORS.length]
            updateTeam(team.team_id, { color: next })
          }}
          className="h-4 w-4 shrink-0 rounded-full ring-2 ring-white"
          style={{ background: team.color, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
        />
        <input
          value={team.name}
          onChange={(e) => updateTeam(team.team_id, { name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-gray-900 outline-none"
        />
        <span className="shrink-0 text-[11px] text-gray-400">
          {team.member_user_ids.length} member{team.member_user_ids.length === 1 ? '' : 's'}
        </span>
        <button
          type="button"
          onClick={() => setEditingMembers((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          title="Edit members"
        >
          <UserPlusIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => deleteTeam(team.team_id)}
          className="grid h-7 w-7 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
          title="Delete team"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {editingMembers && (
        <div className="mt-2 border-t border-gray-100 pt-2">
          {agents.length === 0 ? (
            <p className="px-1 py-1 text-xs text-gray-400">Loading teammates…</p>
          ) : (
            <div className="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
              {agents.map((a) => {
                const on = team.member_user_ids.includes(a.user_id)
                return (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => toggleMember(team.team_id, a.user_id)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition',
                      on ? 'bg-indigo-50 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <span className="relative shrink-0">
                      <Avatar name={a.user_name ?? a.email} size={22} />
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white',
                          PRESENCE[a.availability]
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{a.user_name ?? a.email}</span>
                    {on && <CheckIcon className="h-4 w-4 shrink-0 text-indigo-600" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
