import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { toast } from 'sonner'

import { useOrgStore } from '@/app/store'
import { PageLoader } from '@/components/ui/page-loader'
import {
  getLinearAuthUrl,
  getLinearStatus,
  disconnectLinear,
  listLinearTeams,
  setLinearDefaultTeam,
  listLinearMembers,
  listMemberMappings,
  saveMemberMapping,
  listOrgMembers,
} from '@/services/api'
import type {
  LinearStatus,
  LinearTeam,
  LinearMember,
  MemberMapping,
  OrgMembership,
} from '@/services/api'

// ── URL-based success/error detection ────────────────────────────────────────

function useConnectionCallback() {
  const [justConnected, setJustConnected] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('connected') === 'linear'
  })

  const [connectionError, setConnectionError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('error')
  })

  useEffect(() => {
    if (justConnected) {
      toast.success('Linear connected successfully!', {
        description: 'Tasks will now sync to your Linear workspace.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(false)
    }
    if (connectionError) {
      toast.error('Failed to connect Linear', { description: connectionError })
      window.history.replaceState({}, '', window.location.pathname)
      setConnectionError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only run on mount
  }, [])

  return { justConnected, connectionError }
}

// ── Linear Card ───────────────────────────────────────────────────────────────

interface LinearCardProps {
  orgId: string
  onStatusChange?: () => void
}

function LinearCard({ orgId, onStatusChange }: LinearCardProps) {
  const [status, setStatus] = useState<LinearStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [teams, setTeams] = useState<LinearTeam[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [showMemberMap, setShowMemberMap] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getLinearStatus(orgId)
      setStatus(s)
      if (s.connected && s.default_team_id) {
        setSelectedTeam(s.default_team_id)
      }
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchTeams = useCallback(async () => {
    if (!status?.connected) return
    setLoadingTeams(true)
    try {
      const t = await listLinearTeams(orgId)
      setTeams(t)
    } catch {
      // ignore
    } finally {
      setLoadingTeams(false)
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  const handleConnect = () => {
    window.location.href = getLinearAuthUrl(orgId)
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Linear? All task-to-issue mappings will be cleared.')) return
    setDisconnecting(true)
    try {
      await disconnectLinear(orgId)
      toast.success('Linear disconnected')
      setStatus({ connected: false })
      setTeams([])
      setSelectedTeam('')
      onStatusChange?.()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSaveTeam = async () => {
    if (!selectedTeam) return
    setSavingTeam(true)
    try {
      await setLinearDefaultTeam(orgId, selectedTeam)
      toast.success('Default team saved')
      await fetchStatus()
    } catch {
      toast.error('Failed to save team')
    } finally {
      setSavingTeam(false)
    }
  }

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm flex items-center gap-3">
        <ArrowPathIcon className="h-5 w-5 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Checking Linear connection…</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-white/60 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Linear logo */}
          <div className="h-10 w-10 rounded-xl overflow-hidden flex-shrink-0">
            <img
              src="/linear-app-icon-logo.png"
              alt="Linear"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Linear</h3>
              {status?.connected ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircleSolid className="h-3 w-3" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  Not connected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              Sync extracted tasks to Linear issues automatically
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status?.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-sm text-red-600 hover:text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-4 w-4" />
              Connect Linear
            </button>
          )}
        </div>
      </div>

      {/* Config panel (only when connected) */}
      {status?.connected && (
        <div className="p-5 space-y-5">
          {/* Default team */}
          <div>
            <label
              htmlFor="linear-team-select"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Default team for new issues
            </label>
            {loadingTeams ? (
              <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="linear-team-select"
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20 focus:border-[#3730a3]"
                  >
                    <option value="">— Select a team —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.key})
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={handleSaveTeam}
                  disabled={savingTeam || !selectedTeam || selectedTeam === status.default_team_id}
                  className="px-3 py-2 text-sm font-semibold bg-[#0f0f0f] hover:bg-[#1a1a1a] text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingTeam ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Tasks extracted from meetings will be created in this team.
            </p>
          </div>

          {/* Member mapping */}
          <div>
            <button
              onClick={() => setShowMemberMap((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-[#3730a3] hover:text-[#312e81]"
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${showMemberMap ? 'rotate-180' : ''}`}
              />
              Member mapping
            </button>
            {showMemberMap && (
              <div className="mt-3">
                <MemberMappingPanel orgId={orgId} />
              </div>
            )}
          </div>

          {/* Connected info */}
          {status.connected_at && (
            <p className="text-xs text-gray-400">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {status.workspace_id && (
                <>
                  {' '}
                  · Workspace ID:{' '}
                  <code className="font-mono">{status.workspace_id.slice(0, 8)}…</code>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Not connected note */}
      {!status?.connected && (
        <div className="px-5 py-4 bg-gray-50 text-sm text-gray-500 border-t border-gray-100">
          Connect your Linear workspace to automatically sync meeting tasks as Linear issues. Member
          assignment is matched by email automatically.
        </div>
      )}
    </div>
  )
}

// ── Member Mapping Panel ──────────────────────────────────────────────────────

function MemberMappingPanel({ orgId }: { orgId: string }) {
  const [liraMembers, setLiraMembers] = useState<OrgMembership[]>([])
  const [linearMembers, setLinearMembers] = useState<LinearMember[]>([])
  const [mappings, setMappings] = useState<MemberMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [lm, linM, maps] = await Promise.all([
          listOrgMembers(orgId),
          listLinearMembers(orgId),
          listMemberMappings(orgId),
        ])
        setLiraMembers(lm)
        setLinearMembers(linM)
        setMappings(maps)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  const getMapping = (userId: string) => mappings.find((m) => m.userId === userId)

  const handleSave = async (userId: string) => {
    const externalId = selections[userId]
    if (!externalId) return
    setSavingFor(userId)
    try {
      const linearMember = linearMembers.find((m) => m.id === externalId)
      await saveMemberMapping(orgId, userId, externalId, linearMember?.email)
      setMappings((prev) => [
        ...prev.filter((m) => m.userId !== userId),
        {
          userId,
          orgId,
          provider: 'linear',
          external_id: externalId,
          external_email: linearMember?.email,
          status: 'resolved',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      toast.success('Member mapped')
    } catch {
      toast.error('Failed to save mapping')
    } finally {
      setSavingFor(null)
    }
  }

  if (loading) {
    return <div className="h-20 bg-gray-100 animate-pulse rounded-xl" />
  }

  if (liraMembers.length === 0) {
    return <p className="text-sm text-gray-400">No members found.</p>
  }

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Lira member</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Linear user</th>
            <th className="py-2 px-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {liraMembers.map((member) => {
            const mapping = getMapping(member.user_id)
            const current = mapping?.external_id ?? ''
            const selected = selections[member.user_id] ?? current
            const mappedLinear = linearMembers.find((lm) => lm.id === current)

            return (
              <tr key={member.user_id} className="hover:bg-gray-50/50">
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-800">{member.name || member.email}</div>
                  {member.email && <div className="text-xs text-gray-400">{member.email}</div>}
                </td>
                <td className="py-2.5 px-3">
                  {mapping?.status === 'resolved' && mappedLinear ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-gray-700">{mappedLinear.name}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={selected}
                        onChange={(e) =>
                          setSelections((prev) => ({ ...prev, [member.user_id]: e.target.value }))
                        }
                        className="w-full appearance-none border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white pr-7 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20"
                      >
                        <option value="">— Not mapped —</option>
                        {linearMembers.map((lm) => (
                          <option key={lm.id} value={lm.id}>
                            {lm.name} {lm.email ? `(${lm.email})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}
                </td>
                <td className="py-2.5 px-3 text-right">
                  {selections[member.user_id] && selections[member.user_id] !== current ? (
                    <button
                      onClick={() => handleSave(member.user_id)}
                      disabled={savingFor === member.user_id}
                      className="text-xs font-medium text-[#3730a3] hover:text-[#312e81] disabled:opacity-50"
                    >
                      {savingFor === member.user_id ? 'Saving…' : 'Save'}
                    </button>
                  ) : mapping?.status === 'resolved' ? (
                    <button
                      onClick={() => setSelections((prev) => ({ ...prev, [member.user_id]: '' }))}
                      className="text-xs text-gray-400 hover:text-red-500"
                    >
                      Change
                    </button>
                  ) : null}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Coming soon card ──────────────────────────────────────────────────────────

function ComingSoonCard({
  name,
  description,
  logo,
}: {
  name: string
  description: string
  logo: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white overflow-hidden shadow-sm opacity-60">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {logo}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{name}</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Coming soon
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          </div>
        </div>
        <button
          disabled
          className="text-sm font-medium bg-gray-100 text-gray-400 px-4 py-2 rounded-xl cursor-not-allowed"
        >
          Connect
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const orgId = useOrgStore((s) => s.currentOrgId)
  useConnectionCallback()

  if (!orgId) return <PageLoader />

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Workspace</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Integrations</h1>
          <p className="mt-1 text-sm text-gray-400">
            Connect your project management tools to automatically sync tasks extracted from
            meetings.
          </p>
        </div>

        {/* Task management section */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Task Management
          </h2>
          <div className="space-y-3">
            <LinearCard orgId={orgId} />

            <ComingSoonCard
              name="Jira"
              description="Sync tasks to Jira issues in your project"
              logo={
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M15.999 0C7.163 0 0 7.163 0 16s7.163 16 15.999 16C24.836 32 32 24.837 32 16S24.836 0 15.999 0z"
                    fill="#2684FF"
                  />
                  <path d="M16 4.5L8 16l8 7.5V4.5z" fill="white" opacity=".6" />
                  <path d="M16 4.5l8 11.5-8 7.5 8-11.5-8-7.5z" fill="white" />
                </svg>
              }
            />

            <ComingSoonCard
              name="ClickUp"
              description="Create ClickUp tasks from meeting action items"
              logo={
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M4 22.667l3.333-2.667C9.333 22.667 12.333 24 16 24s6.667-1.333 8.667-4L28 22.667C25.333 26.667 21 29.333 16 29.333S6.667 26.667 4 22.667z"
                    fill="#8930FD"
                  />
                  <path
                    d="M4 9.333L16 2.667l12 6.666-2.667 2.667L16 8l-9.333 3.333L4 9.333z"
                    fill="#49CCF9"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* How it works */}
        <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
          <h3 className="text-sm font-semibold text-violet-900 mb-2">How task sync works</h3>
          <ol className="text-sm text-violet-800 space-y-1.5 list-decimal list-inside">
            <li>Lira extracts action items from meeting transcripts using GPT-4o</li>
            <li>Each task is automatically created as an issue in your connected workspace</li>
            <li>Members are matched by email — or you can map them manually above</li>
            <li>Issue status syncs back to Lira when updated in Linear</li>
          </ol>
          <a
            href="https://liraintelligence.com/docs/integrations"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 mt-3"
          >
            Learn more
            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
          </a>
        </section>
      </div>
    </div>
  )
}
