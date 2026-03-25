import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  LinkIcon,
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

        {/* Task Management */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Task Management
          </h2>
          <div className="space-y-3">
            <LinearCard orgId={orgId} />
          </div>
        </section>

        {/* Communication & Collaboration */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Communication &amp; Collaboration
          </h2>
          <div className="space-y-3">
            <ComingSoonCard
              name="Slack"
              description="Post meeting summaries and task updates to any channel"
              logo={
                <svg width="20" height="20" viewBox="0 0 54 54" fill="none">
                  <path
                    d="M19.712 33.442c0 2.215-1.808 4.023-4.023 4.023s-4.023-1.808-4.023-4.023 1.808-4.023 4.023-4.023h4.023v4.023z"
                    fill="#E01E5A"
                  />
                  <path
                    d="M21.735 33.442c0-2.215 1.808-4.023 4.023-4.023s4.023 1.808 4.023 4.023v10.057c0 2.215-1.808 4.023-4.023 4.023s-4.023-1.808-4.023-4.023V33.442z"
                    fill="#E01E5A"
                  />
                  <path
                    d="M25.758 19.712c-2.215 0-4.023-1.808-4.023-4.023s1.808-4.023 4.023-4.023 4.023 1.808 4.023 4.023v4.023h-4.023z"
                    fill="#36C5F0"
                  />
                  <path
                    d="M25.758 21.735c2.215 0 4.023 1.808 4.023 4.023s-1.808 4.023-4.023 4.023H15.7c-2.215 0-4.023-1.808-4.023-4.023s1.808-4.023 4.023-4.023h10.058z"
                    fill="#36C5F0"
                  />
                  <path
                    d="M39.488 25.758c0-2.215 1.808-4.023 4.023-4.023s4.023 1.808 4.023 4.023-1.808 4.023-4.023 4.023h-4.023v-4.023z"
                    fill="#2EB67D"
                  />
                  <path
                    d="M37.465 25.758c0 2.215-1.808 4.023-4.023 4.023s-4.023-1.808-4.023-4.023V15.7c0-2.215 1.808-4.023 4.023-4.023s4.023 1.808 4.023 4.023v10.058z"
                    fill="#2EB67D"
                  />
                  <path
                    d="M33.442 39.488c2.215 0 4.023 1.808 4.023 4.023s-1.808 4.023-4.023 4.023-4.023-1.808-4.023-4.023v-4.023h4.023z"
                    fill="#ECB22E"
                  />
                  <path
                    d="M33.442 37.465c-2.215 0-4.023-1.808-4.023-4.023s1.808-4.023 4.023-4.023h10.057c2.215 0 4.023 1.808 4.023 4.023s-1.808 4.023-4.023 4.023H33.442z"
                    fill="#ECB22E"
                  />
                </svg>
              }
            />
            <ComingSoonCard
              name="Microsoft Teams"
              description="Share summaries and action items directly in Teams channels"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M14.5 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#5059C9" />
                  <path
                    d="M18.5 9h-7A1.5 1.5 0 0 0 10 10.5V17a5 5 0 0 0 10 0v-6.5A1.5 1.5 0 0 0 18.5 9z"
                    fill="#5059C9"
                  />
                  <path d="M9.5 8a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" fill="#7B83EB" />
                  <path
                    d="M4 10.5A1.5 1.5 0 0 1 5.5 9h8A1.5 1.5 0 0 1 15 10.5v6a4.5 4.5 0 0 1-9 0v-6z"
                    fill="#7B83EB"
                  />
                </svg>
              }
            />
          </div>
        </section>

        {/* Productivity */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Productivity
          </h2>
          <div className="space-y-3">
            <ComingSoonCard
              name="Notion"
              description="Save meeting notes and summaries to Notion pages automatically"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect width="24" height="24" rx="4" fill="#fff" />
                  <path
                    d="M4.5 4.5h6.75l8.25 11.25V4.5H21v15h-6.75L6 8.25V19.5H4.5V4.5z"
                    fill="#000"
                  />
                </svg>
              }
            />
            <ComingSoonCard
              name="Google Calendar"
              description="Auto-schedule follow-ups and sync meeting events with your calendar"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="2"
                    y="4"
                    width="20"
                    height="18"
                    rx="2"
                    fill="#fff"
                    stroke="#DADCE0"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M7 2v4M17 2v4M2 10h20"
                    stroke="#DADCE0"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <rect x="8" y="13" width="8" height="5" rx="1" fill="#4285F4" />
                  <path
                    d="M7 2v4M17 2v4"
                    stroke="#1967D2"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
            <ComingSoonCard
              name="Google Drive"
              description="Attach meeting recordings and transcripts to Drive folders"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M8 3L2 13h6l6-10H8z" fill="#0F9D58" />
                  <path d="M14 3l6 10h-6l-6-10h6z" fill="#4285F4" />
                  <path d="M2 13l4 8h12l4-8H2z" fill="#FBBC05" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Developer & CRM */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Developer &amp; CRM
          </h2>
          <div className="space-y-3">
            <ComingSoonCard
              name="GitHub"
              description="Link tasks to GitHub issues and pull requests automatically"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                    fill="#24292F"
                  />
                </svg>
              }
            />
            <ComingSoonCard
              name="HubSpot"
              description="Log meeting outcomes and tasks directly into your CRM"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#FF7A59" />
                  <circle cx="12" cy="9" r="2.5" fill="white" />
                  <path
                    d="M7 16.5c0-2.761 2.239-5 5-5s5 2.239 5 5"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              }
            />
            <ComingSoonCard
              name="Salesforce"
              description="Sync action items and contacts from sales call recordings"
              logo={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9.5 5.5C10.3 3.7 12.1 2.5 14 2.5c2.5 0 4.5 1.8 4.9 4.2.5-.2 1-.3 1.6-.3 2.2 0 4 1.8 4 4s-1.8 4-4 4H5.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.8 1.4-3.3 3.1-3.5C5.5 6.2 7.3 5.5 9.5 5.5z"
                    fill="#00A1E0"
                  />
                </svg>
              }
            />
          </div>
        </section>
      </div>
    </div>
  )
}
