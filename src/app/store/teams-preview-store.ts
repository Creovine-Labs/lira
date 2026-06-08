import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  listTeams as apiListTeams,
  createTeam as apiCreateTeam,
  updateTeam as apiUpdateTeam,
  deleteTeam as apiDeleteTeam,
  setTicketTeam as apiSetTicketTeam,
  setConversationAssignment as apiSetConversationAssignment,
  type SupportTeamRecord,
} from '@/services/api/support-api'

/**
 * Teams store.
 *
 * Originally a localStorage-only PREVIEW store (no backend) — the file name
 * is kept as a stable import path for the consuming components. The store
 * now syncs with the real `/lira/v1/support/teams/*` endpoints + the
 * per-item assignment endpoints on tickets and conversations:
 *
 *   Team:        GET/POST/PATCH/DELETE /support/teams/orgs/{orgId}
 *   Ticket:      PATCH /support/tickets/orgs/{orgId}/{ticketId}/team
 *                body: { team_id: string | null }
 *   Conv/inbox:  PATCH /support/inbox/orgs/{orgId}/{convId}/assignment
 *                body: { team_id?, assignee_user_id? }
 *
 * Behavior:
 *   - Team list/CRUD is canonical on the backend. The local mirror is a
 *     cache for fast reads + survives an offline tab.
 *   - Per-item assignments (the `assignments` map) keep a local mirror for
 *     fast filter/render, but every write is fired at the backend best-
 *     effort. Callers tell the store the item KIND via `assign(itemId,
 *     patch, kind)` so we hit the right endpoint.
 *   - On orgId change, `syncTeams(orgId)` refreshes from the server.
 *
 * Failures are swallowed (logged to console) so a 500/network blip never
 * blocks the operator's filter pills — the UX remains responsive on local
 * state.
 */

export interface PreviewTeam {
  team_id: string
  name: string
  /** Brand-aligned accent (hex) used for the team's dot/badge. */
  color: string
  member_user_ids: string[]
}

export interface ItemAssignment {
  team_id: string | null
  assignee_user_id: string | null
}

export type AssignmentKind = 'ticket' | 'conversation'

const EMPTY_ASSIGNMENT: ItemAssignment = { team_id: null, assignee_user_id: null }

// Seed defaults used only until syncTeams resolves on first run (or when
// running offline before the server has any teams). Colors track the brand.
const DEFAULT_TEAMS: PreviewTeam[] = [
  { team_id: 'team_support', name: 'Support', color: '#4f46e5', member_user_ids: [] },
  { team_id: 'team_billing', name: 'Billing', color: '#0d9488', member_user_ids: [] },
  { team_id: 'team_engineering', name: 'Engineering', color: '#db2777', member_user_ids: [] },
]

function toPreviewTeam(r: SupportTeamRecord): PreviewTeam {
  return {
    team_id: r.team_id,
    name: r.name,
    color: r.color,
    member_user_ids: r.member_user_ids ?? [],
  }
}

interface TeamsPreviewState {
  /** Org currently mirrored. `syncTeams(orgId)` swaps this. */
  orgId: string | null
  /** Last successful API fetch — used for cache freshness UX, not required. */
  lastSyncedAt: number | null
  teams: PreviewTeam[]
  assignments: Record<string, ItemAssignment>

  // ── Server-backed CRUD ──────────────────────────────────────────────────
  /** Refresh the team list from the backend for a given org. Safe to call
   *  on every mount — it short-circuits if `orgId` already matches and was
   *  synced in the last 30 seconds. */
  syncTeams: (orgId: string) => Promise<void>
  createTeam: (name: string, color: string) => Promise<PreviewTeam | null>
  updateTeam: (
    teamId: string,
    patch: Partial<Pick<PreviewTeam, 'name' | 'color' | 'member_user_ids'>>
  ) => Promise<void>
  deleteTeam: (teamId: string) => Promise<void>
  toggleMember: (teamId: string, userId: string) => Promise<void>

  // ── Per-item assignment ─────────────────────────────────────────────────
  /** Apply an assignment patch. `kind` tells the store which API endpoint
   *  to call. If `kind` is omitted, only the local cache is updated (used
   *  by call sites that haven't been wired with the kind yet). */
  assign: (itemId: string, patch: Partial<ItemAssignment>, kind?: AssignmentKind) => void
  getAssignment: (itemId: string) => ItemAssignment
}

const SYNC_TTL_MS = 30_000

export const useTeamsPreview = create<TeamsPreviewState>()(
  persist(
    (set, get) => ({
      orgId: null,
      lastSyncedAt: null,
      teams: DEFAULT_TEAMS,
      assignments: {},

      syncTeams: async (orgId) => {
        const s = get()
        if (s.orgId === orgId && s.lastSyncedAt && Date.now() - s.lastSyncedAt < SYNC_TTL_MS) {
          return
        }
        try {
          const teams = await apiListTeams(orgId)
          set({
            orgId,
            lastSyncedAt: Date.now(),
            teams: teams.length > 0 ? teams.map(toPreviewTeam) : s.teams,
          })
        } catch (err) {
          console.warn('[teams] sync failed; keeping local cache:', err)
          // Still update orgId so subsequent writes target the right org.
          set({ orgId })
        }
      },

      createTeam: async (name, color) => {
        const orgId = get().orgId
        if (!orgId) {
          console.warn('[teams] createTeam called before syncTeams set orgId')
          return null
        }
        try {
          const created = await apiCreateTeam(orgId, { name, color })
          const team = toPreviewTeam(created)
          set((s) => ({ teams: [...s.teams, team] }))
          return team
        } catch (err) {
          console.warn('[teams] createTeam failed:', err)
          return null
        }
      },

      updateTeam: async (teamId, patch) => {
        const orgId = get().orgId
        // Optimistic local update so the UI feels instant.
        set((s) => ({
          teams: s.teams.map((t) => (t.team_id === teamId ? { ...t, ...patch } : t)),
        }))
        if (!orgId) return
        try {
          await apiUpdateTeam(orgId, teamId, patch)
        } catch (err) {
          console.warn('[teams] updateTeam failed:', err)
        }
      },

      deleteTeam: async (teamId) => {
        const orgId = get().orgId
        const previous = get().teams
        // Optimistic delete + clear team off any local assignments.
        set((s) => ({
          teams: s.teams.filter((t) => t.team_id !== teamId),
          assignments: Object.fromEntries(
            Object.entries(s.assignments).map(([id, a]) =>
              a.team_id === teamId ? [id, { ...a, team_id: null }] : [id, a]
            )
          ),
        }))
        if (!orgId) return
        try {
          await apiDeleteTeam(orgId, teamId)
        } catch (err) {
          console.warn('[teams] deleteTeam failed; restoring local:', err)
          set({ teams: previous })
        }
      },

      toggleMember: async (teamId, userId) => {
        const team = get().teams.find((t) => t.team_id === teamId)
        if (!team) return
        const has = team.member_user_ids.includes(userId)
        const next_member_user_ids = has
          ? team.member_user_ids.filter((id) => id !== userId)
          : [...team.member_user_ids, userId]
        // Reuse the optimistic-write path from updateTeam.
        await get().updateTeam(teamId, { member_user_ids: next_member_user_ids })
      },

      assign: (itemId, patch, kind) => {
        // Always update the local cache first — the inbox + ticket list
        // filters read from this map.
        set((s) => ({
          assignments: {
            ...s.assignments,
            [itemId]: { ...EMPTY_ASSIGNMENT, ...s.assignments[itemId], ...patch },
          },
        }))
        const orgId = get().orgId
        if (!orgId || !kind) return
        // Fire-and-forget the server write. Failures don't block the UX —
        // the local cache survives a tab refresh via persist().
        const safe = async () => {
          try {
            if (kind === 'ticket') {
              if (patch.team_id !== undefined) {
                await apiSetTicketTeam(orgId, itemId, patch.team_id)
              }
              // Note: per-item assignee on tickets has its own dedicated
              // endpoint (assignTicket). The teams UI only sets team_id
              // here; the existing assignee picker continues to drive that
              // through assignTicket(). Including assignee_user_id in this
              // path would create a second write surface; skip to avoid
              // ambiguity.
            } else {
              await apiSetConversationAssignment(orgId, itemId, patch)
            }
          } catch (err) {
            console.warn(`[teams] assign(${kind}) failed:`, err)
          }
        }
        void safe()
      },

      getAssignment: (itemId) => get().assignments[itemId] ?? EMPTY_ASSIGNMENT,
    }),
    {
      name: 'lira-teams-preview',
      version: 2,
      // Don't persist the in-flight sync metadata. Teams + assignments are
      // safe to persist; orgId is rehydrated on first syncTeams().
      partialize: (s) =>
        ({ teams: s.teams, assignments: s.assignments }) as Partial<TeamsPreviewState>,
    }
  )
)
