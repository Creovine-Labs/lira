import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Teams — local PREVIEW store.
 *
 * "Teams" is a new, separate concept from Queues (per product decision). The
 * backend endpoints don't exist yet, so this store stands in for them: teams
 * and per-item assignments live in localStorage so the whole UX is clickable
 * today. The shape mirrors the agreed API contract 1:1, so swapping this for
 * real `teams-api` fetches later is a drop-in — the components don't change.
 *
 *   Team:        GET/POST/PATCH/DELETE /support/teams/orgs/{orgId}
 *   Assignment:  PATCH .../tickets/{id}/assign  &  .../inbox/{id}/assign
 *                body: { team_id?, assignee_user_id? }
 *
 * Assignments are keyed by the item's id (ticket_id or conv_id), which is
 * globally unique, so one map serves both surfaces.
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

const EMPTY_ASSIGNMENT: ItemAssignment = { team_id: null, assignee_user_id: null }

// Seed a few sensible defaults so the feature isn't an empty void on first run.
// Colors track the brand palette (indigo-forward).
const DEFAULT_TEAMS: PreviewTeam[] = [
  { team_id: 'team_support', name: 'Support', color: '#4f46e5', member_user_ids: [] },
  { team_id: 'team_billing', name: 'Billing', color: '#0d9488', member_user_ids: [] },
  { team_id: 'team_engineering', name: 'Engineering', color: '#db2777', member_user_ids: [] },
]

function newId(): string {
  // App-side (event handlers), so crypto is available and allowed.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `team_${crypto.randomUUID().slice(0, 8)}`
  }
  return `team_${Math.floor(Math.random() * 1e9).toString(36)}`
}

interface TeamsPreviewState {
  teams: PreviewTeam[]
  assignments: Record<string, ItemAssignment>
  createTeam: (name: string, color: string) => PreviewTeam
  updateTeam: (
    teamId: string,
    patch: Partial<Pick<PreviewTeam, 'name' | 'color' | 'member_user_ids'>>
  ) => void
  deleteTeam: (teamId: string) => void
  toggleMember: (teamId: string, userId: string) => void
  assign: (itemId: string, patch: Partial<ItemAssignment>) => void
  getAssignment: (itemId: string) => ItemAssignment
}

export const useTeamsPreview = create<TeamsPreviewState>()(
  persist(
    (set, get) => ({
      teams: DEFAULT_TEAMS,
      assignments: {},

      createTeam: (name, color) => {
        const team: PreviewTeam = { team_id: newId(), name, color, member_user_ids: [] }
        set((s) => ({ teams: [...s.teams, team] }))
        return team
      },

      updateTeam: (teamId, patch) =>
        set((s) => ({
          teams: s.teams.map((t) => (t.team_id === teamId ? { ...t, ...patch } : t)),
        })),

      deleteTeam: (teamId) =>
        set((s) => ({
          teams: s.teams.filter((t) => t.team_id !== teamId),
          // Clear the team off any item it was assigned to.
          assignments: Object.fromEntries(
            Object.entries(s.assignments).map(([id, a]) =>
              a.team_id === teamId ? [id, { ...a, team_id: null }] : [id, a]
            )
          ),
        })),

      toggleMember: (teamId, userId) =>
        set((s) => ({
          teams: s.teams.map((t) => {
            if (t.team_id !== teamId) return t
            const has = t.member_user_ids.includes(userId)
            return {
              ...t,
              member_user_ids: has
                ? t.member_user_ids.filter((id) => id !== userId)
                : [...t.member_user_ids, userId],
            }
          }),
        })),

      assign: (itemId, patch) =>
        set((s) => ({
          assignments: {
            ...s.assignments,
            [itemId]: { ...EMPTY_ASSIGNMENT, ...s.assignments[itemId], ...patch },
          },
        })),

      getAssignment: (itemId) => get().assignments[itemId] ?? EMPTY_ASSIGNMENT,
    }),
    { name: 'lira-teams-preview', version: 1 }
  )
)
