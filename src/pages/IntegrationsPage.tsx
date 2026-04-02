import { useCallback, useEffect, useState } from 'react'
import {
  CheckCircleIcon,
  LinkIcon,
  ChevronDownIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowLeftIcon,
  EyeIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ArrowTopRightOnSquareIcon,
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
  getOrganization,
  getSlackAuthUrl,
  getSlackStatus,
  disconnectSlack,
  listSlackChannels,
  setSlackDefaultChannel,
  listSlackMembers,
  listSlackMemberMappings,
  saveSlackMemberMapping,
  getTeamsAuthUrl,
  getTeamsStatus,
  disconnectTeams,
  listTeamsTeams,
  listTeamsChannels,
  setTeamsDefaultTeam,
  setTeamsDefaultChannel,
  listTeamsMembers,
  listTeamsMemberMappings,
  saveTeamsMemberMapping,
  getGoogleAuthUrl,
  getGoogleStatus,
  disconnectGoogle,
  listGoogleCalendars,
  setGoogleDefaultCalendar,
  listGoogleEvents,
  createGoogleEvent,
  listGoogleDriveFolders,
  setGoogleDefaultFolder,
  createGoogleDriveFolder,
  listGoogleDriveFiles,
  searchGoogleDriveFiles,
  readGoogleDriveFileContent,
  readGoogleSheetData,
  readGoogleDocContent,
  getGitHubAuthUrl,
  getGitHubStatus,
  disconnectGitHub,
  listGitHubRepos,
  listGitHubBranches,
  listGitHubFiles,
  readGitHubFile,
  listGitHubIssues,
  listGitHubPullRequests,
  connectGreenhouse,
  getGreenhouseStatus,
  disconnectGreenhouse,
  listGreenhouseJobs,
  listGreenhouseCandidates,
  listGreenhouseApplications,
  getHubSpotAuthUrl,
  getHubSpotStatus,
  disconnectHubSpot,
  listHubSpotContacts,
  listHubSpotCompanies,
  listHubSpotDeals,
  listHubSpotPipelines,
  getSalesforceAuthUrl,
  getSalesforceStatus,
  disconnectSalesforce,
  listSalesforceContacts,
  listSalesforceAccounts,
  listSalesforceOpportunities,
  listSalesforceLeads,
} from '@/services/api'
import type {
  LinearStatus,
  LinearTeam,
  LinearMember,
  MemberMapping,
  OrgMembership,
  Organization,
  SlackStatus,
  SlackChannel,
  SlackMember,
  SlackMemberMapping,
  TeamsStatus,
  TeamsTeam,
  TeamsChannel,
  TeamsMember,
  TeamsMemberMapping,
  GoogleStatus,
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleDriveFolder,
  GoogleDriveFile,
  GitHubStatus,
  GitHubRepo,
  GitHubBranch,
  GitHubFile,
  GitHubFileContent,
  GitHubIssue,
  GitHubPullRequest,
  GreenhouseStatus,
  GreenhouseJob,
  GreenhouseCandidate,
  GreenhouseApplication,
  HubSpotStatus,
  HubSpotContact,
  HubSpotCompany,
  HubSpotDeal,
  HubSpotPipeline,
  SalesforceStatus,
  SalesforceContact,
  SalesforceAccount,
  SalesforceOpportunity,
  SalesforceLead,
} from '@/services/api'

// ── URL-based success/error detection ────────────────────────────────────────

function useConnectionCallback() {
  const [justConnected, setJustConnected] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('connected')
    return c === 'linear' ||
      c === 'slack' ||
      c === 'teams' ||
      c === 'google' ||
      c === 'github' ||
      c === 'hubspot' ||
      c === 'salesforce'
      ? c
      : null
  })

  const [connectionError, setConnectionError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    return params.get('error')
  })

  useEffect(() => {
    if (justConnected === 'linear') {
      toast.success('Linear connected successfully!', {
        description: 'Tasks will now sync to your Linear workspace.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'slack') {
      toast.success('Slack connected successfully!', {
        description: 'Meeting summaries can now be posted to Slack.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'teams') {
      toast.success('Microsoft Teams connected successfully!', {
        description: 'Meeting summaries can now be posted to Teams channels.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'google') {
      toast.success('Google connected successfully!', {
        description: 'Calendar and Drive integrations are now active.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'github') {
      toast.success('GitHub connected successfully!', {
        description: 'You can now browse repos, issues, and pull requests.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'hubspot') {
      toast.success('HubSpot connected successfully!', {
        description: 'Contacts, companies, and deals are now accessible.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (justConnected === 'salesforce') {
      toast.success('Salesforce connected successfully!', {
        description: 'Contacts, accounts, opportunities, and leads are now accessible.',
      })
      window.history.replaceState({}, '', window.location.pathname)
      setJustConnected(null)
    }
    if (connectionError) {
      toast.error('Failed to connect', { description: connectionError })
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
  const [configOpen, setConfigOpen] = useState(false)
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
      setConfigOpen(false)
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

  const needsConfig = status?.connected && !status.default_team_id

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Logo */}
        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
          <img
            src="/linear-app-icon-logo.png"
            alt="Linear"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Linear</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircleSolid className="h-2.5 w-2.5" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Project management — auto-sync tasks from meetings
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status?.connected ? (
            <>
              <button
                onClick={() => setConfigOpen((v) => !v)}
                className={`relative inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  configOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure
                {needsConfig && !configOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* ── Configure panel ── */}
      {configOpen && status?.connected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {/* Setup nudge if nothing configured yet */}
          {needsConfig && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Select a default team below so Lira knows where to create issues.
            </div>
          )}

          {/* Default team */}
          <div>
            <label
              htmlFor="linear-team-select"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Default team
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
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
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
                  className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingTeam ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Member mapping */}
          <div className="border-t border-gray-100 pt-5">
            <button
              onClick={() => setShowMemberMap((v) => !v)}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors group"
            >
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Member mapping
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Match Lira members to their Linear accounts for automatic assignment
                </p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform shrink-0 ml-4 ${showMemberMap ? 'rotate-180' : ''}`}
              />
            </button>

            {showMemberMap && (
              <div className="mt-4">
                <MemberMappingPanel orgId={orgId} />
              </div>
            )}
          </div>

          {/* Connected meta */}
          {status.connected_at && (
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {status.workspace_id && (
                <>
                  {' '}
                  · Workspace <code className="font-mono">{status.workspace_id.slice(0, 8)}…</code>
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

function InviteModal({ org, onClose }: { org: Organization; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(org.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="button"
      tabIndex={0}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
      <div
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6"
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900">Invite to {org.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Share this code with your team member. Once they join Lira, they'll appear here.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <code className="flex-1 font-mono text-sm font-semibold tracking-widest text-gray-900 select-all">
            {org.invite_code}
          </code>
          <button
            onClick={handleCopy}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-emerald-500" />
            ) : (
              <ClipboardDocumentIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {copied && (
          <p className="text-xs text-emerald-600 mt-2 text-center">Copied to clipboard!</p>
        )}

        <p className="text-[11px] text-gray-400 mt-4 text-center">
          The member enters this code on the Lira join page to join your org.
        </p>
      </div>
    </div>
  )
}

function MemberMappingPanel({ orgId }: { orgId: string }) {
  const [liraMembers, setLiraMembers] = useState<OrgMembership[]>([])
  const [linearMembers, setLinearMembers] = useState<LinearMember[]>([])
  const [mappings, setMappings] = useState<MemberMapping[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [lm, linM, maps, orgData] = await Promise.all([
          listOrgMembers(orgId),
          listLinearMembers(orgId),
          listMemberMappings(orgId),
          getOrganization(orgId),
        ])
        setLiraMembers(lm)
        setLinearMembers(linM)
        setMappings(maps)
        setOrg(orgData)
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
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-6 w-6 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <p className="text-xs text-gray-400">Loading members…</p>
      </div>
    )
  }

  if (liraMembers.length === 0) {
    return <p className="text-sm text-gray-400">No members found.</p>
  }

  const unmappedCount = liraMembers.filter((m) => {
    const mapping = getMapping(m.user_id)
    return !mapping || mapping.status !== 'resolved'
  }).length

  // Linear has people that Lira doesn't → invite them to Lira
  const mappedLinearIds = new Set(
    mappings.filter((m) => m.status === 'resolved').map((m) => m.external_id)
  )
  const unmappedLinearCount = linearMembers.filter((lm) => !mappedLinearIds.has(lm.id)).length

  // Lira has people that Linear doesn't → nudge to add them in Linear
  const liraMemberEmails = new Set(liraMembers.map((m) => m.email?.toLowerCase()).filter(Boolean))
  const linearEmails = new Set(linearMembers.map((m) => m.email?.toLowerCase()).filter(Boolean))
  const liraMembersNotInLinear = [...liraMemberEmails].filter(
    (e) => e && !linearEmails.has(e)
  ).length

  return (
    <>
      {showInviteModal && org && (
        <InviteModal org={org} onClose={() => setShowInviteModal(false)} />
      )}
      <div className="space-y-3">
        {unmappedCount > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <span className="font-bold shrink-0">{unmappedCount} unmapped</span>
            <span className="text-amber-600">
              {unmappedCount === 1
                ? 'This member will have tasks created unassigned in Linear until mapped.'
                : 'These members will have tasks created unassigned in Linear until mapped.'}
            </span>
          </div>
        )}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  Lira member
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  → Linear user
                </th>
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
                  <tr
                    key={member.user_id}
                    className={
                      mapping?.status === 'resolved'
                        ? 'hover:bg-gray-50/50'
                        : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }
                  >
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
                              setSelections((prev) => ({
                                ...prev,
                                [member.user_id]: e.target.value,
                              }))
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
                          onClick={() =>
                            setSelections((prev) => ({ ...prev, [member.user_id]: '' }))
                          }
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

        {/* Footer hints */}
        <div className="space-y-2">
          {unmappedLinearCount > 0 && org && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {unmappedLinearCount} Linear {unmappedLinearCount === 1 ? 'user' : 'users'}
                </span>{' '}
                not yet on Lira
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="shrink-0 text-xs font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors ml-4"
              >
                + Invite to Lira
              </button>
            </div>
          )}

          {liraMembersNotInLinear > 0 && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {liraMembersNotInLinear} Lira{' '}
                  {liraMembersNotInLinear === 1 ? 'member' : 'members'}
                </span>{' '}
                {liraMembersNotInLinear === 1 ? 'has' : 'have'} no matching email in your Linear
                workspace — map {liraMembersNotInLinear === 1 ? 'them' : 'them'} manually above
              </p>
              <a
                href="https://linear.app"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors ml-4"
              >
                Open Linear →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Slack Card ────────────────────────────────────────────────────────────────

const SLACK_LOGO = (
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
)

interface SlackCardProps {
  orgId: string
  onStatusChange?: () => void
}

function SlackCard({ orgId, onStatusChange }: SlackCardProps) {
  const [status, setStatus] = useState<SlackStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [savingChannel, setSavingChannel] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState('')
  const [showMemberMap, setShowMemberMap] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getSlackStatus(orgId)
      setStatus(s)
      if (s.connected && s.default_channel_id) {
        setSelectedChannel(s.default_channel_id)
      }
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchChannels = useCallback(async () => {
    if (!status?.connected) return
    setLoadingChannels(true)
    try {
      const c = await listSlackChannels(orgId)
      setChannels(c)
    } catch {
      // ignore
    } finally {
      setLoadingChannels(false)
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const handleConnect = () => {
    window.location.href = getSlackAuthUrl(orgId)
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Slack? Meeting summaries will no longer be posted.')) return
    setDisconnecting(true)
    try {
      await disconnectSlack(orgId)
      toast.success('Slack disconnected')
      setStatus({ connected: false })
      setChannels([])
      setSelectedChannel('')
      setConfigOpen(false)
      onStatusChange?.()
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSaveChannel = async () => {
    if (!selectedChannel) return
    setSavingChannel(true)
    try {
      await setSlackDefaultChannel(orgId, selectedChannel)
      toast.success('Default channel saved')
      await fetchStatus()
    } catch {
      toast.error('Failed to save channel')
    } finally {
      setSavingChannel(false)
    }
  }

  const needsConfig = status?.connected && !status.default_channel_id

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Logo */}
        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {SLACK_LOGO}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Slack</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircleSolid className="h-2.5 w-2.5" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Post meeting summaries and task updates to any channel
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status?.connected ? (
            <>
              <button
                onClick={() => setConfigOpen((v) => !v)}
                className={`relative inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  configOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure
                {needsConfig && !configOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* ── Configure panel ── */}
      {configOpen && status?.connected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {needsConfig && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Select a default channel below so Lira knows where to post meeting summaries.
            </div>
          )}

          {/* Default channel */}
          <div>
            <label
              htmlFor="slack-channel-select"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Default channel
            </label>
            {loadingChannels ? (
              <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="slack-channel-select"
                    value={selectedChannel}
                    onChange={(e) => setSelectedChannel(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  >
                    <option value="">— Select a channel —</option>
                    {channels.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.is_private ? '🔒 ' : '# '}
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={handleSaveChannel}
                  disabled={
                    savingChannel ||
                    !selectedChannel ||
                    selectedChannel === status.default_channel_id
                  }
                  className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingChannel ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Member mapping */}
          <div className="border-t border-gray-100 pt-5">
            <button
              onClick={() => setShowMemberMap((v) => !v)}
              className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors group"
            >
              <div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  Member mapping
                </span>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Match Lira members to their Slack accounts for DM notifications
                </p>
              </div>
              <ChevronDownIcon
                className={`h-4 w-4 text-gray-500 transition-transform shrink-0 ml-4 ${showMemberMap ? 'rotate-180' : ''}`}
              />
            </button>

            {showMemberMap && (
              <div className="mt-4">
                <SlackMemberMappingPanel orgId={orgId} />
              </div>
            )}
          </div>

          {/* Connected meta */}
          {status.connected_at && (
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {status.workspace_id && (
                <>
                  {' '}
                  · Workspace <code className="font-mono">{status.workspace_id.slice(0, 8)}…</code>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {/* Not connected note */}
      {!status?.connected && (
        <div className="px-5 py-4 bg-gray-50 text-sm text-gray-500 border-t border-gray-100">
          Connect your Slack workspace to post meeting summaries, action items, and task assignments
          directly to channels and DMs.
        </div>
      )}
    </div>
  )
}

// ── Slack Member Mapping Panel ────────────────────────────────────────────────

function SlackMemberMappingPanel({ orgId }: { orgId: string }) {
  const [liraMembers, setLiraMembers] = useState<OrgMembership[]>([])
  const [slackMembers, setSlackMembers] = useState<SlackMember[]>([])
  const [mappings, setMappings] = useState<SlackMemberMapping[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [lm, slM, maps, orgData] = await Promise.all([
          listOrgMembers(orgId),
          listSlackMembers(orgId),
          listSlackMemberMappings(orgId),
          getOrganization(orgId),
        ])
        setLiraMembers(lm)
        setSlackMembers(slM)
        setMappings(maps)
        setOrg(orgData)
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
      const slackMember = slackMembers.find((m) => m.id === externalId)
      await saveSlackMemberMapping(orgId, userId, externalId, slackMember?.email)
      setMappings((prev) => [
        ...prev.filter((m) => m.userId !== userId),
        {
          userId,
          orgId,
          provider: 'slack',
          external_id: externalId,
          external_email: slackMember?.email,
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
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-6 w-6 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <p className="text-xs text-gray-400">Loading members…</p>
      </div>
    )
  }

  if (liraMembers.length === 0) {
    return <p className="text-sm text-gray-400">No members found.</p>
  }

  const unmappedCount = liraMembers.filter((m) => {
    const mapping = getMapping(m.user_id)
    return !mapping || mapping.status !== 'resolved'
  }).length

  const mappedSlackIds = new Set(
    mappings.filter((m) => m.status === 'resolved').map((m) => m.external_id)
  )
  const unmappedSlackCount = slackMembers.filter((sm) => !mappedSlackIds.has(sm.id)).length

  const liraMemberEmails = new Set(liraMembers.map((m) => m.email?.toLowerCase()).filter(Boolean))
  const slackEmails = new Set(slackMembers.map((m) => m.email?.toLowerCase()).filter(Boolean))
  const liraMembersNotInSlack = [...liraMemberEmails].filter((e) => e && !slackEmails.has(e)).length

  return (
    <>
      {showInviteModal && org && (
        <InviteModal org={org} onClose={() => setShowInviteModal(false)} />
      )}
      <div className="space-y-3">
        {unmappedCount > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <span className="font-bold shrink-0">{unmappedCount} unmapped</span>
            <span className="text-amber-600">
              {unmappedCount === 1
                ? "This member won't receive Slack DM notifications until mapped."
                : "These members won't receive Slack DM notifications until mapped."}
            </span>
          </div>
        )}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  Lira member
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  → Slack user
                </th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {liraMembers.map((member) => {
                const mapping = getMapping(member.user_id)
                const current = mapping?.external_id ?? ''
                const selected = selections[member.user_id] ?? current
                const mappedSlack = slackMembers.find((sm) => sm.id === current)

                return (
                  <tr
                    key={member.user_id}
                    className={
                      mapping?.status === 'resolved'
                        ? 'hover:bg-gray-50/50'
                        : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800">{member.name || member.email}</div>
                      {member.email && <div className="text-xs text-gray-400">{member.email}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      {mapping?.status === 'resolved' && mappedSlack ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-gray-700">
                            {mappedSlack.real_name || mappedSlack.name}
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selected}
                            onChange={(e) =>
                              setSelections((prev) => ({
                                ...prev,
                                [member.user_id]: e.target.value,
                              }))
                            }
                            className="w-full appearance-none border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white pr-7 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20"
                          >
                            <option value="">— Not mapped —</option>
                            {slackMembers.map((sm) => (
                              <option key={sm.id} value={sm.id}>
                                {sm.real_name || sm.name} {sm.email ? `(${sm.email})` : ''}
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
                          onClick={() =>
                            setSelections((prev) => ({ ...prev, [member.user_id]: '' }))
                          }
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

        {/* Footer hints */}
        <div className="space-y-2">
          {unmappedSlackCount > 0 && org && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {unmappedSlackCount} Slack {unmappedSlackCount === 1 ? 'user' : 'users'}
                </span>{' '}
                not yet on Lira
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="shrink-0 text-xs font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors ml-4"
              >
                + Invite to Lira
              </button>
            </div>
          )}

          {liraMembersNotInSlack > 0 && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {liraMembersNotInSlack} Lira {liraMembersNotInSlack === 1 ? 'member' : 'members'}
                </span>{' '}
                {liraMembersNotInSlack === 1 ? 'has' : 'have'} no matching email in your Slack
                workspace — map {liraMembersNotInSlack === 1 ? 'them' : 'them'} manually above
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Microsoft Teams Card ──────────────────────────────────────────────────────

const TEAMS_LOGO = (
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
)

interface TeamsCardProps {
  orgId: string
  onStatusChange?: () => void
}

function TeamsCard({ orgId, onStatusChange }: TeamsCardProps) {
  const [status, setStatus] = useState<TeamsStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [teams, setTeams] = useState<TeamsTeam[]>([])
  const [channels, setChannels] = useState<TeamsChannel[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [savingChannel, setSavingChannel] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('')
  const [showMemberMap, setShowMemberMap] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getTeamsStatus(orgId)
      setStatus(s)
      if (s.connected && s.default_team_id) {
        setSelectedTeam(s.default_team_id)
      }
      if (s.connected && s.default_channel_id) {
        setSelectedChannel(s.default_channel_id)
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
      const t = await listTeamsTeams(orgId)
      setTeams(t)
    } catch {
      // ignore
    } finally {
      setLoadingTeams(false)
    }
  }, [orgId, status?.connected])

  const fetchChannels = useCallback(async () => {
    if (!status?.connected || !selectedTeam) return
    setLoadingChannels(true)
    try {
      const c = await listTeamsChannels(orgId, selectedTeam)
      setChannels(c)
    } catch {
      // ignore
    } finally {
      setLoadingChannels(false)
    }
  }, [orgId, status?.connected, selectedTeam])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])
  useEffect(() => {
    fetchChannels()
  }, [fetchChannels])

  const handleConnect = () => {
    window.location.href = getTeamsAuthUrl(orgId)
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Microsoft Teams? Meeting summaries will no longer be posted.'))
      return
    setDisconnecting(true)
    try {
      await disconnectTeams(orgId)
      toast.success('Teams disconnected')
      setStatus({ connected: false })
      setTeams([])
      setChannels([])
      setSelectedTeam('')
      setSelectedChannel('')
      setConfigOpen(false)
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
      await setTeamsDefaultTeam(orgId, selectedTeam)
      toast.success('Default team saved')
      await fetchStatus()
    } catch {
      toast.error('Failed to save team')
    } finally {
      setSavingTeam(false)
    }
  }

  const handleSaveChannel = async () => {
    if (!selectedChannel) return
    setSavingChannel(true)
    try {
      await setTeamsDefaultChannel(orgId, selectedChannel)
      toast.success('Default channel saved')
      await fetchStatus()
    } catch {
      toast.error('Failed to save channel')
    } finally {
      setSavingChannel(false)
    }
  }

  const needsConfig = status?.connected && (!status.default_team_id || !status.default_channel_id)

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* ── Main row ── */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Logo */}
        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {TEAMS_LOGO}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Microsoft Teams</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircleSolid className="h-2.5 w-2.5" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Share summaries and action items directly in Teams channels
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {status?.connected ? (
            <>
              <button
                onClick={() => setConfigOpen((v) => !v)}
                className={`relative inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  configOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure
                {needsConfig && !configOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* ── Configure panel ── */}
      {configOpen && status?.connected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {needsConfig && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Select a default team and channel below so Lira knows where to post meeting summaries.
            </div>
          )}

          {/* Default team */}
          <div>
            <label
              htmlFor="teams-team-select"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Default team
            </label>
            {loadingTeams ? (
              <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="teams-team-select"
                    value={selectedTeam}
                    onChange={(e) => {
                      setSelectedTeam(e.target.value)
                      setSelectedChannel('')
                      setChannels([])
                    }}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  >
                    <option value="">— Select a team —</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.displayName}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={handleSaveTeam}
                  disabled={savingTeam || !selectedTeam || selectedTeam === status.default_team_id}
                  className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingTeam ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {/* Default channel */}
          {selectedTeam && (
            <div>
              <label
                htmlFor="teams-channel-select"
                className="block text-xs font-semibold text-gray-700 mb-2"
              >
                Default channel
              </label>
              {loadingChannels ? (
                <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      id="teams-channel-select"
                      value={selectedChannel}
                      onChange={(e) => setSelectedChannel(e.target.value)}
                      className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                    >
                      <option value="">— Select a channel —</option>
                      {channels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.membershipType === 'private' ? '🔒 ' : '# '}
                          {c.displayName}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleSaveChannel}
                    disabled={
                      savingChannel ||
                      !selectedChannel ||
                      selectedChannel === status.default_channel_id
                    }
                    className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                  >
                    {savingChannel ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Member mapping */}
          {selectedTeam && (
            <div className="border-t border-gray-100 pt-5">
              <button
                onClick={() => setShowMemberMap((v) => !v)}
                className="w-full flex items-center justify-between text-left px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors group"
              >
                <div>
                  <span className="text-xs font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                    Member mapping
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Match Lira members to their Teams accounts for DM notifications
                  </p>
                </div>
                <ChevronDownIcon
                  className={`h-4 w-4 text-gray-500 transition-transform shrink-0 ml-4 ${showMemberMap ? 'rotate-180' : ''}`}
                />
              </button>

              {showMemberMap && (
                <div className="mt-4">
                  <TeamsMemberMappingPanel orgId={orgId} teamId={selectedTeam} />
                </div>
              )}
            </div>
          )}

          {/* Connected meta */}
          {status.connected_at && (
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {/* Not connected note */}
      {!status?.connected && (
        <div className="px-5 py-4 bg-gray-50 text-sm text-gray-500 border-t border-gray-100">
          Connect your Microsoft Teams workspace to post meeting summaries, action items, and task
          assignments directly to channels and chats.
        </div>
      )}
    </div>
  )
}

// ── Teams Member Mapping Panel ────────────────────────────────────────────────

function TeamsMemberMappingPanel({ orgId, teamId }: { orgId: string; teamId: string }) {
  const [liraMembers, setLiraMembers] = useState<OrgMembership[]>([])
  const [teamsMembers, setTeamsMembers] = useState<TeamsMember[]>([])
  const [mappings, setMappings] = useState<TeamsMemberMapping[]>([])
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [lm, tm, maps, orgData] = await Promise.all([
          listOrgMembers(orgId),
          listTeamsMembers(orgId, teamId),
          listTeamsMemberMappings(orgId),
          getOrganization(orgId),
        ])
        setLiraMembers(lm)
        setTeamsMembers(tm)
        setMappings(maps)
        setOrg(orgData)
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId, teamId])

  const getMapping = (userId: string) => mappings.find((m) => m.userId === userId)

  const handleSave = async (userId: string) => {
    const externalId = selections[userId]
    if (!externalId) return
    setSavingFor(userId)
    try {
      const teamsMember = teamsMembers.find((m) => m.id === externalId)
      await saveTeamsMemberMapping(orgId, userId, externalId, teamsMember?.mail)
      setMappings((prev) => [
        ...prev.filter((m) => m.userId !== userId),
        {
          userId,
          orgId,
          provider: 'teams',
          external_id: externalId,
          external_email: teamsMember?.mail,
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
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-6 w-6 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <p className="text-xs text-gray-400">Loading members…</p>
      </div>
    )
  }

  if (liraMembers.length === 0) {
    return <p className="text-sm text-gray-400">No members found.</p>
  }

  const unmappedCount = liraMembers.filter((m) => {
    const mapping = getMapping(m.user_id)
    return !mapping || mapping.status !== 'resolved'
  }).length

  const mappedTeamsIds = new Set(
    mappings.filter((m) => m.status === 'resolved').map((m) => m.external_id)
  )
  const unmappedTeamsCount = teamsMembers.filter((tm) => !mappedTeamsIds.has(tm.id)).length

  const liraMemberEmails = new Set(liraMembers.map((m) => m.email?.toLowerCase()).filter(Boolean))
  const teamsEmails = new Set(teamsMembers.map((m) => m.mail?.toLowerCase()).filter(Boolean))
  const liraMembersNotInTeams = [...liraMemberEmails].filter((e) => e && !teamsEmails.has(e)).length

  return (
    <>
      {showInviteModal && org && (
        <InviteModal org={org} onClose={() => setShowInviteModal(false)} />
      )}
      <div className="space-y-3">
        {unmappedCount > 0 && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
            <span className="font-bold shrink-0">{unmappedCount} unmapped</span>
            <span className="text-amber-600">
              {unmappedCount === 1
                ? "This member won't receive Teams chat notifications until mapped."
                : "These members won't receive Teams chat notifications until mapped."}
            </span>
          </div>
        )}
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  Lira member
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">
                  → Teams user
                </th>
                <th className="py-2 px-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {liraMembers.map((member) => {
                const mapping = getMapping(member.user_id)
                const current = mapping?.external_id ?? ''
                const selected = selections[member.user_id] ?? current
                const mappedTeams = teamsMembers.find((tm) => tm.id === current)

                return (
                  <tr
                    key={member.user_id}
                    className={
                      mapping?.status === 'resolved'
                        ? 'hover:bg-gray-50/50'
                        : 'bg-amber-50/40 hover:bg-amber-50/70'
                    }
                  >
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-800">{member.name || member.email}</div>
                      {member.email && <div className="text-xs text-gray-400">{member.email}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      {mapping?.status === 'resolved' && mappedTeams ? (
                        <div className="flex items-center gap-1.5">
                          <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-gray-700">{mappedTeams.displayName}</span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selected}
                            onChange={(e) =>
                              setSelections((prev) => ({
                                ...prev,
                                [member.user_id]: e.target.value,
                              }))
                            }
                            className="w-full appearance-none border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white pr-7 focus:outline-none focus:ring-2 focus:ring-[#3730a3]/20"
                          >
                            <option value="">— Not mapped —</option>
                            {teamsMembers.map((tm) => (
                              <option key={tm.id} value={tm.id}>
                                {tm.displayName} {tm.mail ? `(${tm.mail})` : ''}
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
                          onClick={() =>
                            setSelections((prev) => ({ ...prev, [member.user_id]: '' }))
                          }
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

        {/* Footer hints */}
        <div className="space-y-2">
          {unmappedTeamsCount > 0 && org && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {unmappedTeamsCount} Teams {unmappedTeamsCount === 1 ? 'user' : 'users'}
                </span>{' '}
                not yet on Lira
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="shrink-0 text-xs font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors ml-4"
              >
                + Invite to Lira
              </button>
            </div>
          )}

          {liraMembersNotInTeams > 0 && (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
              <p className="text-xs text-gray-600">
                <span className="font-medium">
                  {liraMembersNotInTeams} Lira {liraMembersNotInTeams === 1 ? 'member' : 'members'}
                </span>{' '}
                {liraMembersNotInTeams === 1 ? 'has' : 'have'} no matching email in your Teams
                workspace — map {liraMembersNotInTeams === 1 ? 'them' : 'them'} manually above
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ── Coming soon card ──────────────────────────────────────────────────────────

// ── Google Calendar Card ──────────────────────────────────────────────────────

const GOOGLE_CALENDAR_LOGO = (
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
    <path d="M7 2v4M17 2v4M2 10h20" stroke="#DADCE0" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="8" y="13" width="8" height="5" rx="1" fill="#4285F4" />
    <path d="M7 2v4M17 2v4" stroke="#1967D2" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

function GoogleCalendarCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [loadingCalendars, setLoadingCalendars] = useState(false)
  const [savingCalendar, setSavingCalendar] = useState(false)
  const [selectedCalendar, setSelectedCalendar] = useState('')
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [eventTitle, setEventTitle] = useState('Lira follow-up sync')
  const [eventStartLocal, setEventStartLocal] = useState(() => {
    const d = new Date(Date.now() + 60 * 60 * 1000)
    d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })
  const [eventDurationMin, setEventDurationMin] = useState('30')
  const [lastCreatedEventLink, setLastCreatedEventLink] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getGoogleStatus(orgId)
      setStatus(s)
      if (s.connected && s.default_calendar_id) {
        setSelectedCalendar(s.default_calendar_id)
      }
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchCalendars = useCallback(async () => {
    if (!status?.connected) return
    setLoadingCalendars(true)
    try {
      const c = await listGoogleCalendars(orgId)
      setCalendars(c)
    } catch {
      /* ignore */
    } finally {
      setLoadingCalendars(false)
    }
  }, [orgId, status?.connected])

  const fetchEvents = useCallback(async () => {
    if (!status?.connected) return
    setLoadingEvents(true)
    try {
      const e = await listGoogleEvents(orgId)
      setEvents(e)
    } catch {
      /* ignore */
    } finally {
      setLoadingEvents(false)
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchCalendars()
  }, [fetchCalendars])
  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleConnect = () => {
    window.location.href = getGoogleAuthUrl(orgId)
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google? This will also disable Google Drive integration.'))
      return
    setDisconnecting(true)
    try {
      await disconnectGoogle(orgId)
      toast.success('Google disconnected')
      setStatus({ connected: false })
      setCalendars([])
      setEvents([])
      setSelectedCalendar('')
      setConfigOpen(false)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSaveCalendar = async () => {
    if (!selectedCalendar) return
    setSavingCalendar(true)
    try {
      await setGoogleDefaultCalendar(orgId, selectedCalendar)
      toast.success('Default calendar saved')
      await fetchStatus()
      await fetchEvents()
    } catch {
      toast.error('Failed to save calendar')
    } finally {
      setSavingCalendar(false)
    }
  }

  const handleCreateDemoEvent = async () => {
    if (!status?.default_calendar_id) {
      toast.error('Set and save a default calendar first')
      return
    }
    if (selectedCalendar && selectedCalendar !== status.default_calendar_id) {
      toast.error('Save your selected calendar before creating an event')
      return
    }

    const start = new Date(eventStartLocal)
    if (Number.isNaN(start.getTime())) {
      toast.error('Choose a valid start date/time')
      return
    }

    const durationMin = Math.max(15, Number(eventDurationMin) || 30)
    const end = new Date(start.getTime() + durationMin * 60 * 1000)

    setCreatingEvent(true)
    try {
      const created = await createGoogleEvent(orgId, {
        summary: eventTitle.trim() || 'Lira follow-up',
        description: 'Created from Lira Integrations to schedule a follow-up after a meeting.',
        start: start.toISOString(),
        end: end.toISOString(),
      })
      setLastCreatedEventLink(created.htmlLink || null)
      toast.success('Follow-up event created')
      await fetchEvents()
    } catch {
      toast.error('Failed to create event')
    } finally {
      setCreatingEvent(false)
    }
  }

  const needsConfig = status?.connected && !status.default_calendar_id

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {GOOGLE_CALENDAR_LOGO}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Google Calendar</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircleSolid className="h-2.5 w-2.5" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Auto-schedule follow-ups and sync meeting events with your calendar
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status?.connected ? (
            <>
              <button
                onClick={() => setConfigOpen((v) => !v)}
                className={`relative inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  configOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure
                {needsConfig && !configOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {configOpen && status?.connected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {needsConfig && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Select a default calendar below so Lira knows where to create follow-up events.
            </div>
          )}

          <div>
            <label
              htmlFor="google-cal-select"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Default calendar
            </label>
            {loadingCalendars ? (
              <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="google-cal-select"
                    value={selectedCalendar}
                    onChange={(e) => setSelectedCalendar(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  >
                    <option value="">— Select a calendar —</option>
                    {calendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary}
                        {c.primary ? ' (primary)' : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={handleSaveCalendar}
                  disabled={
                    savingCalendar ||
                    !selectedCalendar ||
                    selectedCalendar === status.default_calendar_id
                  }
                  className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingCalendar ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Create follow-up event</h4>
            <div className="space-y-2 rounded-xl border border-gray-100 bg-white p-3">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                placeholder="Event title"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="datetime-local"
                  value={eventStartLocal}
                  onChange={(e) => setEventStartLocal(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                />
                <select
                  value={eventDurationMin}
                  onChange={(e) => setEventDurationMin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCreateDemoEvent}
                  disabled={creatingEvent || !status.default_calendar_id}
                  className="px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-40"
                >
                  {creatingEvent ? 'Creating…' : 'Create event'}
                </button>
                {lastCreatedEventLink && (
                  <a
                    href={lastCreatedEventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Open created event
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Upcoming events preview */}
          {events.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-700 mb-2">Upcoming events</h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {events.slice(0, 5).map((ev) => {
                  const start = ev.start.dateTime
                    ? new Date(ev.start.dateTime).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : ev.start.date || ''
                  return (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between text-xs px-3 py-2 bg-white border border-gray-100 rounded-xl"
                    >
                      <span className="text-gray-800 truncate mr-3">{ev.summary}</span>
                      <span className="text-gray-400 whitespace-nowrap">{start}</span>
                    </div>
                  )
                })}
              </div>
              {loadingEvents && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <img
                    src="/lira_black.png"
                    alt="Loading"
                    className="h-3 w-3 animate-spin opacity-50"
                    style={{ animationDuration: '1.2s' }}
                  />{' '}
                  Loading events…
                </div>
              )}
            </div>
          )}

          {status.connected_at && (
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {!status?.connected && (
        <div className="px-5 py-4 bg-gray-50 text-sm text-gray-500 border-t border-gray-100">
          Connect your Google account to sync meeting events and auto-schedule follow-ups on your
          calendar. This also enables Google Drive integration.
        </div>
      )}
    </div>
  )
}

// ── Google Drive Card ─────────────────────────────────────────────────────────

const GOOGLE_DRIVE_LOGO = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M8 3L2 13h6l6-10H8z" fill="#0F9D58" />
    <path d="M14 3l6 10h-6l-6-10h6z" fill="#4285F4" />
    <path d="M2 13l4 8h12l4-8H2z" fill="#FBBC05" />
  </svg>
)

const MIME_ICON_MAP: Record<
  string,
  { icon: typeof DocumentTextIcon; color: string; label: string }
> = {
  'application/vnd.google-apps.document': {
    icon: DocumentTextIcon,
    color: 'text-blue-500',
    label: 'Doc',
  },
  'application/vnd.google-apps.spreadsheet': {
    icon: TableCellsIcon,
    color: 'text-green-600',
    label: 'Sheet',
  },
  'application/vnd.google-apps.presentation': {
    icon: DocumentTextIcon,
    color: 'text-amber-500',
    label: 'Slides',
  },
  'application/pdf': { icon: DocumentTextIcon, color: 'text-red-500', label: 'PDF' },
  'application/vnd.google-apps.folder': {
    icon: FolderIcon,
    color: 'text-gray-500',
    label: 'Folder',
  },
}

function getFileIcon(mimeType: string) {
  return (
    MIME_ICON_MAP[mimeType] || { icon: DocumentTextIcon, color: 'text-gray-400', label: 'File' }
  )
}

function GoogleDriveCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<GoogleStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [configOpen, setConfigOpen] = useState(false)
  const [folders, setFolders] = useState<GoogleDriveFolder[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [savingFolder, setSavingFolder] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  // File browser state
  const [browseOpen, setBrowseOpen] = useState(false)
  const [files, setFiles] = useState<GoogleDriveFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [browseFolderId, setBrowseFolderId] = useState<string | undefined>(undefined)
  const [folderStack, setFolderStack] = useState<{ id?: string; name: string }[]>([
    { name: 'My Drive' },
  ])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GoogleDriveFile[] | null>(null)
  const [searching, setSearching] = useState(false)

  // Content preview state
  const [previewFile, setPreviewFile] = useState<GoogleDriveFile | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sheetData, setSheetData] = useState<{ values: string[][]; range: string } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getGoogleStatus(orgId)
      setStatus(s)
      if (s.connected && s.default_folder_id) {
        setSelectedFolder(s.default_folder_id)
      }
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchFolders = useCallback(async () => {
    if (!status?.connected) return
    setLoadingFolders(true)
    try {
      const f = await listGoogleDriveFolders(orgId)
      setFolders(f)
    } catch {
      /* ignore */
    } finally {
      setLoadingFolders(false)
    }
  }, [orgId, status?.connected])

  const fetchFiles = useCallback(
    async (folderId?: string) => {
      if (!status?.connected) return
      setLoadingFiles(true)
      try {
        const f = await listGoogleDriveFiles(orgId, folderId)
        setFiles(f)
      } catch {
        /* ignore */
      } finally {
        setLoadingFiles(false)
      }
    },
    [orgId, status?.connected]
  )

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])
  useEffect(() => {
    if (browseOpen) fetchFiles(browseFolderId)
  }, [browseOpen, browseFolderId, fetchFiles])

  const handleConnect = () => {
    window.location.href = getGoogleAuthUrl(orgId)
  }

  const handleSaveFolder = async () => {
    if (!selectedFolder) return
    setSavingFolder(true)
    try {
      await setGoogleDefaultFolder(orgId, selectedFolder)
      toast.success('Default folder saved')
      await fetchStatus()
    } catch {
      toast.error('Failed to save folder')
    } finally {
      setSavingFolder(false)
    }
  }

  const handleCreateFolder = async () => {
    setCreatingFolder(true)
    try {
      const folder = await createGoogleDriveFolder(orgId, 'Lira Meeting Notes')
      toast.success(`Folder "${folder.name}" created`)
      await fetchFolders()
      setSelectedFolder(folder.id)
    } catch {
      toast.error('Failed to create folder')
    } finally {
      setCreatingFolder(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return
    setSearching(true)
    try {
      const results = await searchGoogleDriveFiles(orgId, searchQuery.trim())
      setSearchResults(results)
    } catch {
      toast.error('Search failed')
    } finally {
      setSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  const navigateToFolder = (folderId: string, folderName: string) => {
    clearSearch()
    setBrowseFolderId(folderId)
    setFolderStack((prev) => [...prev, { id: folderId, name: folderName }])
  }

  const navigateBack = () => {
    clearSearch()
    setFolderStack((prev) => {
      if (prev.length <= 1) return prev
      const newStack = prev.slice(0, -1)
      setBrowseFolderId(newStack[newStack.length - 1].id)
      return newStack
    })
  }

  const navigateToBreadcrumb = (index: number) => {
    clearSearch()
    setFolderStack((prev) => {
      const newStack = prev.slice(0, index + 1)
      setBrowseFolderId(newStack[newStack.length - 1].id)
      return newStack
    })
  }

  const handlePreview = async (file: GoogleDriveFile) => {
    setPreviewFile(file)
    setPreviewContent(null)
    setSheetData(null)
    setLoadingPreview(true)
    try {
      if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
        const data = await readGoogleSheetData(orgId, file.id)
        setSheetData(data)
      } else if (file.mimeType === 'application/vnd.google-apps.document') {
        const doc = await readGoogleDocContent(orgId, file.id)
        setPreviewContent(doc.body)
      } else {
        const result = await readGoogleDriveFileContent(orgId, file.id, file.mimeType)
        setPreviewContent(result.content)
      }
    } catch {
      setPreviewContent('Unable to preview this file.')
    } finally {
      setLoadingPreview(false)
    }
  }

  const closePreview = () => {
    setPreviewFile(null)
    setPreviewContent(null)
    setSheetData(null)
  }

  const canPreview = (mimeType: string) => {
    return [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation',
      'application/pdf',
      'text/plain',
      'text/csv',
      'text/html',
      'application/json',
    ].includes(mimeType)
  }

  const needsConfig = status?.connected && !status.default_folder_id

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex items-center gap-3">
        <img
          src="/lira_black.png"
          alt="Loading"
          className="h-4 w-4 animate-spin opacity-50"
          style={{ animationDuration: '1.2s' }}
        />
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  const displayFiles = searchResults ?? files

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {GOOGLE_DRIVE_LOGO}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 text-sm">Google Drive</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                <CheckCircleSolid className="h-2.5 w-2.5" />
                Connected
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                Not connected
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            Browse, search, and read Google Docs, Sheets, PDFs, and more from your Drive
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status?.connected ? (
            <>
              <button
                onClick={() => {
                  setBrowseOpen((v) => !v)
                  setConfigOpen(false)
                }}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  browseOpen
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <FolderIcon className="h-3.5 w-3.5" />
                Browse
              </button>
              <button
                onClick={() => {
                  setConfigOpen((v) => !v)
                  setBrowseOpen(false)
                }}
                className={`relative inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
                  configOpen
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                Configure
                {needsConfig && !configOpen && (
                  <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                )}
                <ChevronDownIcon
                  className={`h-3.5 w-3.5 transition-transform ${configOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </div>

      {/* ── File browser panel ── */}
      {browseOpen && status?.connected && (
        <div className="border-t border-gray-100 bg-gray-50/50">
          {/* Search bar */}
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search files across your Drive…"
                  className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
              {searchResults ? (
                <button
                  onClick={clearSearch}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 px-3 py-2 rounded-xl border border-gray-200 hover:bg-white transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleSearch}
                  disabled={searching || searchQuery.trim().length < 2}
                  className="text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl transition-colors disabled:opacity-40"
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb navigation */}
          {!searchResults && (
            <div className="px-5 pb-2 flex items-center gap-1 text-xs text-gray-500 overflow-x-auto">
              {folderStack.map((folder, i) => (
                <span key={i} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <span className="text-gray-300">/</span>}
                  <button
                    onClick={() => navigateToBreadcrumb(i)}
                    className={`hover:text-gray-900 transition-colors ${
                      i === folderStack.length - 1 ? 'font-semibold text-gray-800' : ''
                    }`}
                  >
                    {folder.name}
                  </button>
                </span>
              ))}
            </div>
          )}

          {searchResults && (
            <div className="px-5 pb-2">
              <span className="text-xs text-gray-500">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;
                {searchQuery}&rdquo;
              </span>
            </div>
          )}

          {/* File list */}
          <div className="px-5 pb-4">
            {loadingFiles || searching ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-gray-100 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : displayFiles.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                {searchResults ? 'No files match your search' : 'This folder is empty'}
              </div>
            ) : (
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {/* Back button */}
                {!searchResults && folderStack.length > 1 && (
                  <button
                    onClick={navigateBack}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors text-left"
                  >
                    <ArrowLeftIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">Back</span>
                  </button>
                )}
                {displayFiles.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder'
                  const meta = getFileIcon(file.mimeType)
                  const IconComp = meta.icon
                  return (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors group"
                    >
                      <IconComp className={`h-4 w-4 ${meta.color} shrink-0`} />
                      {isFolder ? (
                        <button
                          onClick={() => navigateToFolder(file.id, file.name)}
                          className="flex-1 text-sm text-gray-800 font-medium text-left truncate hover:underline"
                        >
                          {file.name}
                        </button>
                      ) : (
                        <span className="flex-1 text-sm text-gray-800 truncate">{file.name}</span>
                      )}
                      <span className="text-[10px] text-gray-400 shrink-0">{meta.label}</span>
                      {file.modifiedTime && (
                        <span className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                          {new Date(file.modifiedTime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                      {!isFolder && canPreview(file.mimeType) && (
                        <button
                          onClick={() => handlePreview(file)}
                          className="opacity-0 group-hover:opacity-100 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-all shrink-0"
                        >
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-all shrink-0"
                        >
                          <LinkIcon className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Content preview overlay ── */}
          {previewFile && (
            <div className="border-t border-gray-200 bg-white">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <EyeIcon className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {previewFile.name}
                  </span>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {getFileIcon(previewFile.mimeType).label}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {previewFile.webViewLink && (
                    <a
                      href={previewFile.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      Open in Drive
                    </a>
                  )}
                  <button
                    onClick={closePreview}
                    className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="px-5 py-4 max-h-80 overflow-y-auto">
                {loadingPreview ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-400">
                    <img
                      src="/lira_black.png"
                      alt="Loading"
                      className="h-4 w-4 animate-spin opacity-50"
                      style={{ animationDuration: '1.2s' }}
                    />{' '}
                    Loading preview…
                  </div>
                ) : sheetData ? (
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse w-full">
                      <tbody>
                        {sheetData.values.slice(0, 50).map((row, ri) => (
                          <tr key={ri} className={ri === 0 ? 'bg-gray-100 font-semibold' : ''}>
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className="border border-gray-200 px-2 py-1.5 text-gray-700 whitespace-nowrap max-w-48 truncate"
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {sheetData.values.length > 50 && (
                      <p className="text-[11px] text-gray-400 mt-2">
                        Showing first 50 rows of {sheetData.values.length}
                      </p>
                    )}
                  </div>
                ) : previewContent ? (
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">
                    {previewContent.slice(0, 10000)}
                    {previewContent.length > 10000 && '\n\n… (content truncated)'}
                  </pre>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">No preview available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Configure panel ── */}
      {configOpen && status?.connected && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-5 bg-gray-50/50">
          {needsConfig && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              Select a default folder below so Lira knows where to save meeting transcripts and
              notes.
            </div>
          )}

          <div>
            <label
              htmlFor="google-folder-select"
              className="block text-xs font-semibold text-gray-700 mb-2"
            >
              Default folder
            </label>
            {loadingFolders ? (
              <div className="h-9 bg-gray-100 animate-pulse rounded-xl" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="google-folder-select"
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white text-gray-900 pr-8 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400"
                  >
                    <option value="">— Select a folder —</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  onClick={handleSaveFolder}
                  disabled={
                    savingFolder || !selectedFolder || selectedFolder === status.default_folder_id
                  }
                  className="px-3 py-2 text-sm font-semibold bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors disabled:opacity-40"
                >
                  {savingFolder ? 'Saving…' : 'Save'}
                </button>
              </div>
            )}
          </div>

          <div>
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder}
              className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-xl px-3 py-2 transition-colors disabled:opacity-50"
            >
              {creatingFolder ? 'Creating…' : '+ Create "Lira Meeting Notes" folder'}
            </button>
          </div>

          {status.connected_at && (
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-3">
              Connected{' '}
              {new Date(status.connected_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      )}

      {!status?.connected && (
        <div className="px-5 py-4 bg-gray-50 text-sm text-gray-500 border-t border-gray-100">
          Connect your Google account to browse and read Google Docs, Sheets, PDFs, and more from
          your Drive. Connects via the same Google OAuth as Calendar.
        </div>
      )}
    </div>
  )
}

// ── Coming Soon Card ──────────────────────────────────────────────────────────

// ── GitHub Card ───────────────────────────────────────────────────────────────

function GitHubCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<GitHubStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  // Repos
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)

  // Tabs inside repo: files | issues | pulls
  const [activeTab, setActiveTab] = useState<'files' | 'issues' | 'pulls'>('files')

  // Branches
  const [branches, setBranches] = useState<GitHubBranch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')

  // File browser
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)
  const [filePath, setFilePath] = useState<string[]>([])
  const [fileContent, setFileContent] = useState<GitHubFileContent | null>(null)
  const [loadingContent, setLoadingContent] = useState(false)

  // Issues & PRs
  const [issues, setIssues] = useState<GitHubIssue[]>([])
  const [loadingIssues, setLoadingIssues] = useState(false)
  const [pulls, setPulls] = useState<GitHubPullRequest[]>([])
  const [loadingPulls, setLoadingPulls] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getGitHubStatus(orgId)
      setStatus(s)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchRepos = useCallback(async () => {
    if (!status?.connected) return
    setLoadingRepos(true)
    try {
      const r = await listGitHubRepos(orgId)
      setRepos(r)
    } catch {
      /* ignore */
    } finally {
      setLoadingRepos(false)
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  const handleConnect = () => {
    window.location.href = getGitHubAuthUrl(orgId)
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect GitHub?')) return
    setDisconnecting(true)
    try {
      await disconnectGitHub(orgId)
      toast.success('GitHub disconnected')
      setStatus({ connected: false })
      setRepos([])
      setSelectedRepo(null)
      setConfigOpen(false)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const selectRepo = async (repo: GitHubRepo) => {
    setSelectedRepo(repo)
    setActiveTab('files')
    setFilePath([])
    setFileContent(null)

    // Fetch branches
    try {
      const [owner, repoName] = repo.full_name.split('/')
      const b = await listGitHubBranches(orgId, owner, repoName)
      setBranches(b)
      setSelectedBranch(repo.default_branch)

      // Fetch root files
      setLoadingFiles(true)
      const f = await listGitHubFiles(orgId, owner, repoName, '', repo.default_branch)
      setFiles(f)
    } catch {
      /* ignore */
    } finally {
      setLoadingFiles(false)
    }
  }

  const navigateToPath = async (path: string) => {
    if (!selectedRepo) return
    const [owner, repoName] = selectedRepo.full_name.split('/')
    setLoadingFiles(true)
    setFileContent(null)
    try {
      const f = await listGitHubFiles(orgId, owner, repoName, path, selectedBranch)
      setFiles(f)
      setFilePath(path ? path.split('/') : [])
    } catch {
      /* ignore */
    } finally {
      setLoadingFiles(false)
    }
  }

  const openFile = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      navigateToPath(file.path)
      return
    }
    if (!selectedRepo) return
    const [owner, repoName] = selectedRepo.full_name.split('/')
    setLoadingContent(true)
    try {
      const content = await readGitHubFile(orgId, owner, repoName, file.path, selectedBranch)
      setFileContent(content)
    } catch {
      toast.error('Could not load file content')
    } finally {
      setLoadingContent(false)
    }
  }

  const goUpDir = () => {
    const parentPath = filePath.slice(0, -1).join('/')
    navigateToPath(parentPath)
  }

  const fetchIssues = async () => {
    if (!selectedRepo) return
    const [owner, repoName] = selectedRepo.full_name.split('/')
    setLoadingIssues(true)
    try {
      const i = await listGitHubIssues(orgId, owner, repoName)
      setIssues(i)
    } catch {
      /* ignore */
    } finally {
      setLoadingIssues(false)
    }
  }

  const fetchPulls = async () => {
    if (!selectedRepo) return
    const [owner, repoName] = selectedRepo.full_name.split('/')
    setLoadingPulls(true)
    try {
      const p = await listGitHubPullRequests(orgId, owner, repoName)
      setPulls(p)
    } catch {
      /* ignore */
    } finally {
      setLoadingPulls(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'issues') fetchIssues()
    if (activeTab === 'pulls') fetchPulls()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedRepo])

  const changeBranch = async (branch: string) => {
    setSelectedBranch(branch)
    if (!selectedRepo) return
    const [owner, repoName] = selectedRepo.full_name.split('/')
    setLoadingFiles(true)
    setFileContent(null)
    setFilePath([])
    try {
      const f = await listGitHubFiles(orgId, owner, repoName, '', branch)
      setFiles(f)
    } catch {
      /* ignore */
    } finally {
      setLoadingFiles(false)
    }
  }

  const gitHubLogo = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
        fill="#24292F"
      />
    </svg>
  )

  // Loading / not connected states
  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {gitHubLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">GitHub</h3>
            <p className="text-sm text-gray-500 mt-0.5">Loading…</p>
          </div>
          <img
            src="/lira_black.png"
            alt="Loading"
            className="h-5 w-5 animate-spin opacity-50"
            style={{ animationDuration: '1.2s' }}
          />
        </div>
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {gitHubLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">GitHub</h3>
            <p className="text-sm text-gray-500 mt-0.5">Browse repos, issues, and pull requests</p>
          </div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Connect
          </button>
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          {gitHubLogo}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">GitHub</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircleSolid className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Signed in as <span className="font-medium text-gray-700">{status.username}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              configOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {configOpen ? 'Hide' : 'Browse'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {configOpen && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-gray-50/50">
          {/* Repo browser */}
          {!selectedRepo ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Repositories
                </h4>
                <button
                  onClick={fetchRepos}
                  disabled={loadingRepos}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  <img
                    src="/lira_black.png"
                    alt="Refresh"
                    className={`h-3.5 w-3.5 ${loadingRepos ? 'animate-spin' : ''}`}
                    style={loadingRepos ? { animationDuration: '1.2s' } : undefined}
                  />
                </button>
              </div>
              {loadingRepos ? (
                <div className="text-sm text-gray-400 py-4 text-center">Loading repositories…</div>
              ) : repos.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">No repositories found</div>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {repos.map((repo) => (
                    <button
                      key={repo.id}
                      onClick={() => selectRepo(repo)}
                      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <CodeBracketIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-800 truncate">
                            {repo.full_name}
                          </span>
                          {repo.private && (
                            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Private
                            </span>
                          )}
                        </div>
                        {repo.language && (
                          <span className="text-xs text-gray-400 flex-shrink-0">
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-gray-400 mt-1 truncate pl-6">
                          {repo.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* Repo header */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => {
                    setSelectedRepo(null)
                    setFileContent(null)
                    setFilePath([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <CodeBracketIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-800">
                  {selectedRepo.full_name}
                </span>

                {/* Branch selector */}
                <select
                  value={selectedBranch}
                  onChange={(e) => changeBranch(e.target.value)}
                  className="ml-auto text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                >
                  {branches.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-0.5">
                {(['files', 'issues', 'pulls'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab)
                      setFileContent(null)
                    }}
                    className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab === 'pulls' ? 'Pull Requests' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Files tab */}
              {activeTab === 'files' && (
                <div>
                  {fileContent ? (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          onClick={() => setFileContent(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ArrowLeftIcon className="h-3.5 w-3.5" />
                        </button>
                        <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">
                          {fileContent.path}
                        </span>
                        <a
                          href={fileContent.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto text-xs text-blue-500 hover:text-blue-700"
                        >
                          Open on GitHub ↗
                        </a>
                      </div>
                      <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96 font-mono whitespace-pre">
                        {fileContent.content}
                      </pre>
                    </div>
                  ) : loadingContent ? (
                    <div className="text-sm text-gray-400 py-6 text-center">Loading file…</div>
                  ) : (
                    <div>
                      {/* Breadcrumb */}
                      {filePath.length > 0 && (
                        <div className="flex items-center gap-1 mb-2 text-xs text-gray-400">
                          <button
                            onClick={() => navigateToPath('')}
                            className="hover:text-gray-700"
                          >
                            root
                          </button>
                          {filePath.map((part, i) => (
                            <span key={i} className="flex items-center gap-1">
                              <span>/</span>
                              <button
                                onClick={() => navigateToPath(filePath.slice(0, i + 1).join('/'))}
                                className="hover:text-gray-700"
                              >
                                {part}
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {filePath.length > 0 && (
                        <button
                          onClick={goUpDir}
                          className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700 mb-1 px-2 py-1.5"
                        >
                          <ArrowLeftIcon className="h-3 w-3" /> ..
                        </button>
                      )}

                      {loadingFiles ? (
                        <div className="text-sm text-gray-400 py-6 text-center">Loading…</div>
                      ) : (
                        <div className="space-y-0.5 max-h-80 overflow-y-auto">
                          {files
                            .sort((a, b) => {
                              if (a.type === 'dir' && b.type !== 'dir') return -1
                              if (a.type !== 'dir' && b.type === 'dir') return 1
                              return a.name.localeCompare(b.name)
                            })
                            .map((f) => (
                              <button
                                key={f.sha}
                                onClick={() => openFile(f)}
                                className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-white transition-colors text-xs"
                              >
                                {f.type === 'dir' ? (
                                  <FolderIcon className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                ) : (
                                  <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                )}
                                <span
                                  className={`truncate ${f.type === 'dir' ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                                >
                                  {f.name}
                                </span>
                                {f.type === 'file' && f.size > 0 && (
                                  <span className="text-[10px] text-gray-400 ml-auto flex-shrink-0">
                                    {f.size > 1024
                                      ? `${(f.size / 1024).toFixed(1)} KB`
                                      : `${f.size} B`}
                                  </span>
                                )}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Issues tab */}
              {activeTab === 'issues' && (
                <div>
                  {loadingIssues ? (
                    <div className="text-sm text-gray-400 py-6 text-center">Loading issues…</div>
                  ) : issues.length === 0 ? (
                    <div className="text-sm text-gray-400 py-6 text-center">No open issues</div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {issues.map((issue) => (
                        <a
                          key={issue.id}
                          href={issue.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${issue.state === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}
                          >
                            {issue.state === 'open' ? '●' : '✓'}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              <span className="text-gray-400 mr-1">#{issue.number}</span>
                              {issue.title}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {issue.labels.slice(0, 3).map((label) => (
                                <span
                                  key={label.name}
                                  className="text-[10px] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    backgroundColor: `#${label.color}20`,
                                    color: `#${label.color}`,
                                  }}
                                >
                                  {label.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Pull requests tab */}
              {activeTab === 'pulls' && (
                <div>
                  {loadingPulls ? (
                    <div className="text-sm text-gray-400 py-6 text-center">
                      Loading pull requests…
                    </div>
                  ) : pulls.length === 0 ? (
                    <div className="text-sm text-gray-400 py-6 text-center">
                      No open pull requests
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {pulls.map((pr) => (
                        <a
                          key={pr.id}
                          href={pr.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-white transition-colors"
                        >
                          <span
                            className={`mt-0.5 h-4 w-4 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${pr.merged ? 'bg-purple-100 text-purple-600' : pr.state === 'open' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}
                          >
                            {pr.merged ? '⇐' : pr.state === 'open' ? '●' : '✗'}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              <span className="text-gray-400 mr-1">#{pr.number}</span>
                              {pr.title}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              {pr.head.ref} → {pr.base.ref}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Greenhouse Card ───────────────────────────────────────────────────────────

function GreenhouseCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<GreenhouseStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  // API key input
  const [apiKey, setApiKey] = useState('')
  const [connecting, setConnecting] = useState(false)

  // Tabs: jobs | candidates
  const [activeTab, setActiveTab] = useState<'jobs' | 'candidates'>('jobs')

  // Data
  const [jobs, setJobs] = useState<GreenhouseJob[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [candidates, setCandidates] = useState<GreenhouseCandidate[]>([])
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [jobFilter, setJobFilter] = useState<'open' | 'closed' | 'draft' | ''>('open')

  // Selected job → applications
  const [selectedJob, setSelectedJob] = useState<GreenhouseJob | null>(null)
  const [applications, setApplications] = useState<GreenhouseApplication[]>([])
  const [loadingApps, setLoadingApps] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getGreenhouseStatus(orgId)
      setStatus(s)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchJobs = useCallback(async () => {
    if (!status?.connected) return
    setLoadingJobs(true)
    try {
      const j = await listGreenhouseJobs(orgId, jobFilter || undefined)
      setJobs(j)
    } catch {
      /* ignore */
    } finally {
      setLoadingJobs(false)
    }
  }, [orgId, status?.connected, jobFilter])

  const fetchCandidates = useCallback(async () => {
    if (!status?.connected) return
    setLoadingCandidates(true)
    try {
      const c = await listGreenhouseCandidates(orgId)
      setCandidates(c)
    } catch {
      /* ignore */
    } finally {
      setLoadingCandidates(false)
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  useEffect(() => {
    if (activeTab === 'candidates') fetchCandidates()
  }, [activeTab, fetchCandidates])

  const handleConnect = async () => {
    if (!apiKey.trim()) return
    setConnecting(true)
    try {
      await connectGreenhouse(orgId, apiKey.trim())
      toast.success('Greenhouse connected!')
      setApiKey('')
      await fetchStatus()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      toast.error(msg.includes('Invalid') ? 'Invalid API key' : 'Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Greenhouse?')) return
    setDisconnecting(true)
    try {
      await disconnectGreenhouse(orgId)
      toast.success('Greenhouse disconnected')
      setStatus({ connected: false })
      setJobs([])
      setCandidates([])
      setConfigOpen(false)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const selectJob = async (job: GreenhouseJob) => {
    setSelectedJob(job)
    setLoadingApps(true)
    try {
      const a = await listGreenhouseApplications(orgId, job.id)
      setApplications(a)
    } catch {
      /* ignore */
    } finally {
      setLoadingApps(false)
    }
  }

  const greenhouseLogo = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
        fill="#3B8C22"
      />
      <rect x="9" y="19" width="6" height="2" rx="1" fill="#3B8C22" />
      <rect x="10" y="22" width="4" height="1" rx=".5" fill="#3B8C22" />
    </svg>
  )

  // Loading state
  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {greenhouseLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Greenhouse</h3>
            <p className="text-sm text-gray-500 mt-0.5">Loading…</p>
          </div>
          <img
            src="/lira_black.png"
            alt="Loading"
            className="h-5 w-5 animate-spin opacity-50"
            style={{ animationDuration: '1.2s' }}
          />
        </div>
      </div>
    )
  }

  // Not connected — show API key form
  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {greenhouseLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Greenhouse</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Sync candidates, jobs, and interview scorecards
            </p>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-5 bg-gray-50/50">
          <p className="text-xs text-gray-500 mb-3">
            Enter your Greenhouse Harvest API key. You can create one in Greenhouse → Configure →
            Dev Center → API Credential Management.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Harvest API key"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConnect()
              }}
            />
            <button
              onClick={handleConnect}
              disabled={connecting || !apiKey.trim()}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {connecting ? (
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className="h-3.5 w-3.5 animate-spin opacity-50"
                  style={{ animationDuration: '1.2s' }}
                />
              ) : (
                <LinkIcon className="h-3.5 w-3.5" />
              )}
              Connect
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          {greenhouseLogo}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Greenhouse</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircleSolid className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Applicant Tracking System</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              configOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {configOpen ? 'Hide' : 'Browse'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Config panel */}
      {configOpen && (
        <div className="border-t border-gray-100 px-5 py-5 space-y-4 bg-gray-50/50">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {(['jobs', 'candidates'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setSelectedJob(null)
                }}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors capitalize ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Jobs tab */}
          {activeTab === 'jobs' && (
            <div>
              {!selectedJob ? (
                <div>
                  {/* Job filter */}
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Jobs
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={jobFilter}
                        onChange={(e) =>
                          setJobFilter(e.target.value as 'open' | 'closed' | 'draft' | '')
                        }
                        className="text-xs bg-white border border-gray-200 rounded-lg px-2 py-1 text-gray-600"
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="draft">Draft</option>
                        <option value="">All</option>
                      </select>
                      <button
                        onClick={fetchJobs}
                        disabled={loadingJobs}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        <img
                          src="/lira_black.png"
                          alt="Refresh"
                          className={`h-3.5 w-3.5 ${loadingJobs ? 'animate-spin' : ''}`}
                          style={loadingJobs ? { animationDuration: '1.2s' } : undefined}
                        />
                      </button>
                    </div>
                  </div>

                  {loadingJobs ? (
                    <div className="text-sm text-gray-400 py-4 text-center">Loading jobs…</div>
                  ) : jobs.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4 text-center">No jobs found</div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          onClick={() => selectJob(job)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {job.name}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                job.status === 'open'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : job.status === 'closed'
                                    ? 'bg-gray-100 text-gray-500'
                                    : 'bg-yellow-50 text-yellow-600'
                              }`}
                            >
                              {job.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {job.departments.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {job.departments[0].name}
                              </span>
                            )}
                            {job.offices.length > 0 && (
                              <span className="text-xs text-gray-400">· {job.offices[0].name}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Selected job → applications */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setSelectedJob(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ArrowLeftIcon className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-800">{selectedJob.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        selectedJob.status === 'open'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {selectedJob.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                    Applications
                  </h4>

                  {loadingApps ? (
                    <div className="text-sm text-gray-400 py-4 text-center">
                      Loading applications…
                    </div>
                  ) : applications.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4 text-center">No applications</div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto">
                      {applications.map((app) => (
                        <div key={app.id} className="px-3 py-2 rounded-lg bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-800">
                              Candidate #{app.candidate_id}
                            </span>
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {app.status}
                            </span>
                          </div>
                          {app.current_stage && (
                            <div className="text-xs text-gray-400 mt-0.5">
                              Stage: {app.current_stage.name}
                            </div>
                          )}
                          {app.source && (
                            <div className="text-xs text-gray-400">
                              Source: {app.source.public_name}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Candidates tab */}
          {activeTab === 'candidates' && (
            <div>
              {loadingCandidates ? (
                <div className="text-sm text-gray-400 py-4 text-center">Loading candidates…</div>
              ) : candidates.length === 0 ? (
                <div className="text-sm text-gray-400 py-4 text-center">No candidates found</div>
              ) : (
                <div className="space-y-1 max-h-80 overflow-y-auto">
                  {candidates.map((c) => (
                    <div
                      key={c.id}
                      className="px-3 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-800">
                          {c.first_name} {c.last_name}
                        </span>
                        {c.tags.length > 0 && (
                          <div className="flex gap-1">
                            {c.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        {c.title && <span>{c.title}</span>}
                        {c.company && <span>· {c.company}</span>}
                      </div>
                      {c.applications.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {c.applications.slice(0, 3).map((app) => (
                            <span
                              key={app.id}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                app.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : app.status === 'rejected'
                                    ? 'bg-red-50 text-red-500'
                                    : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {app.job?.name || 'Unknown'} · {app.status}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── HubSpot Card ──────────────────────────────────────────────────────────────

function HubSpotCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<HubSpotStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  // Tabs: contacts | companies | deals
  const [activeTab, setActiveTab] = useState<'contacts' | 'companies' | 'deals'>('contacts')

  // Data
  const [contacts, setContacts] = useState<HubSpotContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [companies, setCompanies] = useState<HubSpotCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [deals, setDeals] = useState<HubSpotDeal[]>([])
  const [loadingDeals, setLoadingDeals] = useState(false)
  const [pipelines, setPipelines] = useState<HubSpotPipeline[]>([])

  // Search
  const [searchQuery, setSearchQuery] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getHubSpotStatus(orgId)
      setStatus(s)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchContacts = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingContacts(true)
      try {
        const data = await listHubSpotContacts(orgId, q)
        setContacts(data.contacts)
      } catch {
        /* ignore */
      } finally {
        setLoadingContacts(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchCompanies = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingCompanies(true)
      try {
        const data = await listHubSpotCompanies(orgId, q)
        setCompanies(data.companies)
      } catch {
        /* ignore */
      } finally {
        setLoadingCompanies(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchDeals = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingDeals(true)
      try {
        const data = await listHubSpotDeals(orgId, q)
        setDeals(data.deals)
      } catch {
        /* ignore */
      } finally {
        setLoadingDeals(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchPipelines = useCallback(async () => {
    if (!status?.connected) return
    try {
      const p = await listHubSpotPipelines(orgId)
      setPipelines(p)
    } catch {
      /* ignore */
    }
  }, [orgId, status?.connected])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (status?.connected) {
      fetchContacts()
      fetchPipelines()
    }
  }, [status?.connected, fetchContacts, fetchPipelines])

  useEffect(() => {
    if (activeTab === 'companies' && companies.length === 0) fetchCompanies()
    if (activeTab === 'deals' && deals.length === 0) fetchDeals()
  }, [activeTab, companies.length, deals.length, fetchCompanies, fetchDeals])

  const handleConnect = () => {
    const url = getHubSpotAuthUrl(orgId)
    window.location.href = url
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect HubSpot?')) return
    setDisconnecting(true)
    try {
      await disconnectHubSpot(orgId)
      toast.success('HubSpot disconnected')
      setStatus({ connected: false })
      setContacts([])
      setCompanies([])
      setDeals([])
      setConfigOpen(false)
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      setDisconnecting(false)
    }
  }

  const handleSearch = () => {
    const q = searchQuery.trim() || undefined
    if (activeTab === 'contacts') fetchContacts(q)
    else if (activeTab === 'companies') fetchCompanies(q)
    else if (activeTab === 'deals') fetchDeals(q)
  }

  const getStageName = (stageId: string | undefined) => {
    if (!stageId) return 'Unknown'
    for (const p of pipelines) {
      const stage = p.stages.find((s) => s.id === stageId)
      if (stage) return stage.label
    }
    return stageId
  }

  const hubSpotLogo = (
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
  )

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center flex-shrink-0">
            {hubSpotLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">HubSpot</h3>
            <p className="text-sm text-gray-500 mt-0.5">Loading…</p>
          </div>
          <img
            src="/lira_black.png"
            alt="Loading"
            className="h-5 w-5 animate-spin opacity-50"
            style={{ animationDuration: '1.2s' }}
          />
        </div>
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center flex-shrink-0">
            {hubSpotLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">HubSpot</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Log meeting outcomes and tasks directly into your CRM
            </p>
          </div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Connect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl bg-[#FFF4F0] flex items-center justify-center flex-shrink-0">
          {hubSpotLogo}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">HubSpot</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircleSolid className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {status.connected_at
              ? `Connected ${new Date(status.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Log meeting outcomes and tasks directly into your CRM'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              configOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {configOpen ? 'Close' : 'Browse'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Connected Panel */}
      {configOpen && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['contacts', 'companies', 'deals'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setSearchQuery('')
                }}
                className={`flex-1 text-sm font-medium py-3 text-center border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#FF7A59] text-[#FF7A59]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF7A59]/20 focus:border-[#FF7A59]"
                />
              </div>
              <button
                onClick={handleSearch}
                className="text-sm font-medium text-[#FF7A59] hover:bg-[#FFF4F0] px-3 py-2 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto">
            {/* Contacts Tab */}
            {activeTab === 'contacts' &&
              (loadingContacts ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No contacts found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {contacts.map((c) => (
                    <div key={c.id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {[c.properties.firstname, c.properties.lastname]
                              .filter(Boolean)
                              .join(' ') || 'No name'}
                          </p>
                          {c.properties.email && (
                            <p className="text-xs text-gray-500 mt-0.5">{c.properties.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {c.properties.company && (
                            <p className="text-xs text-gray-500">{c.properties.company}</p>
                          )}
                          {c.properties.jobtitle && (
                            <p className="text-xs text-gray-400">{c.properties.jobtitle}</p>
                          )}
                        </div>
                      </div>
                      {c.properties.lifecyclestage && (
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {c.properties.lifecyclestage}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {/* Companies Tab */}
            {activeTab === 'companies' &&
              (loadingCompanies ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading companies...</div>
              ) : companies.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No companies found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {companies.map((co) => (
                    <div key={co.id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {co.properties.name || 'Unnamed company'}
                          </p>
                          {co.properties.domain && (
                            <p className="text-xs text-gray-500 mt-0.5">{co.properties.domain}</p>
                          )}
                        </div>
                        <div className="text-right">
                          {co.properties.industry && (
                            <p className="text-xs text-gray-500">{co.properties.industry}</p>
                          )}
                          {co.properties.city && co.properties.state && (
                            <p className="text-xs text-gray-400">
                              {co.properties.city}, {co.properties.state}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {co.properties.numberofemployees && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {co.properties.numberofemployees} employees
                          </span>
                        )}
                        {co.properties.annualrevenue && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">
                            ${Number(co.properties.annualrevenue).toLocaleString()} ARR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Deals Tab */}
            {activeTab === 'deals' &&
              (loadingDeals ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading deals...</div>
              ) : deals.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No deals found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {deals.map((d) => (
                    <div key={d.id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {d.properties.dealname || 'Untitled deal'}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Stage: {getStageName(d.properties.dealstage)}
                          </p>
                        </div>
                        <div className="text-right">
                          {d.properties.amount && (
                            <p className="text-sm font-semibold text-emerald-600">
                              ${Number(d.properties.amount).toLocaleString()}
                            </p>
                          )}
                          {d.properties.closedate && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Close:{' '}
                              {new Date(d.properties.closedate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Salesforce Card ───────────────────────────────────────────────────────────

function SalesforceCard({ orgId }: { orgId: string }) {
  const [status, setStatus] = useState<SalesforceStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [disconnecting, setDisconnecting] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  const [activeTab, setActiveTab] = useState<'contacts' | 'accounts' | 'opportunities' | 'leads'>(
    'contacts'
  )

  const [contacts, setContacts] = useState<SalesforceContact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [accounts, setAccounts] = useState<SalesforceAccount[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [opportunities, setOpportunities] = useState<SalesforceOpportunity[]>([])
  const [loadingOpportunities, setLoadingOpportunities] = useState(false)
  const [leads, setLeads] = useState<SalesforceLead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(false)

  const [searchQuery, setSearchQuery] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      setLoadingStatus(true)
      const s = await getSalesforceStatus(orgId)
      setStatus(s)
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoadingStatus(false)
    }
  }, [orgId])

  const fetchContacts = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingContacts(true)
      try {
        const data = await listSalesforceContacts(orgId, q)
        setContacts(data.contacts)
      } catch {
        /* ignore */
      } finally {
        setLoadingContacts(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchAccounts = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingAccounts(true)
      try {
        const data = await listSalesforceAccounts(orgId, q)
        setAccounts(data.accounts)
      } catch {
        /* ignore */
      } finally {
        setLoadingAccounts(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchOpportunities = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingOpportunities(true)
      try {
        const data = await listSalesforceOpportunities(orgId, q)
        setOpportunities(data.opportunities)
      } catch {
        /* ignore */
      } finally {
        setLoadingOpportunities(false)
      }
    },
    [orgId, status?.connected]
  )

  const fetchLeads = useCallback(
    async (q?: string) => {
      if (!status?.connected) return
      setLoadingLeads(true)
      try {
        const data = await listSalesforceLeads(orgId, q)
        setLeads(data.leads)
      } catch {
        /* ignore */
      } finally {
        setLoadingLeads(false)
      }
    },
    [orgId, status?.connected]
  )

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (status?.connected) fetchContacts()
  }, [status?.connected, fetchContacts])

  useEffect(() => {
    if (activeTab === 'accounts' && accounts.length === 0) fetchAccounts()
    if (activeTab === 'opportunities' && opportunities.length === 0) fetchOpportunities()
    if (activeTab === 'leads' && leads.length === 0) fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const handleSearch = () => {
    const q = searchQuery.trim() || undefined
    if (activeTab === 'contacts') fetchContacts(q)
    else if (activeTab === 'accounts') fetchAccounts(q)
    else if (activeTab === 'opportunities') fetchOpportunities(q)
    else if (activeTab === 'leads') fetchLeads(q)
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      await disconnectSalesforce(orgId)
      setStatus({ connected: false })
      setContacts([])
      setAccounts([])
      setOpportunities([])
      setLeads([])
    } catch {
      toast.error('Failed to disconnect Salesforce')
    } finally {
      setDisconnecting(false)
    }
  }

  const sfLogo = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.5 5.5C10.3 3.7 12.1 2.5 14 2.5c2.5 0 4.5 1.8 4.9 4.2.5-.2 1-.3 1.6-.3 2.2 0 4 1.8 4 4s-1.8 4-4 4H5.5c-1.9 0-3.5-1.6-3.5-3.5 0-1.8 1.4-3.3 3.1-3.5C5.5 6.2 7.3 5.5 9.5 5.5z"
        fill="#00A1E0"
      />
    </svg>
  )

  if (loadingStatus) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            {sfLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Salesforce</h3>
            <p className="text-sm text-gray-500 mt-0.5">Loading…</p>
          </div>
          <img
            src="/lira_black.png"
            alt="Loading"
            className="h-5 w-5 animate-spin opacity-50"
            style={{ animationDuration: '1.2s' }}
          />
        </div>
      </div>
    )
  }

  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            {sfLogo}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Salesforce</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Sync contacts, accounts, opportunities, and leads
            </p>
          </div>
          <button
            onClick={() => {
              window.location.href = getSalesforceAuthUrl(orgId)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
          >
            <LinkIcon className="h-3.5 w-3.5" />
            Connect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          {sfLogo}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">Salesforce</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircleSolid className="h-3 w-3" /> Connected
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {status.connected_at
              ? `Connected ${new Date(status.connected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              : 'Contacts, accounts, opportunities & leads'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigOpen(!configOpen)}
            className={`text-xs font-medium px-3 py-1.5 rounded-xl border transition-colors ${
              configOpen
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {configOpen ? 'Close' : 'Browse'}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-red-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors disabled:opacity-50"
          >
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {configOpen && (
        <div className="border-t border-gray-100">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {(['contacts', 'accounts', 'opportunities', 'leads'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab)
                  setSearchQuery('')
                }}
                className={`flex-1 text-sm font-medium py-3 text-center border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={`Search ${activeTab}...`}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="text-sm font-medium text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
              >
                Search
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[420px] overflow-y-auto">
            {/* Contacts tab */}
            {activeTab === 'contacts' &&
              (loadingContacts ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading contacts...</div>
              ) : contacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No contacts found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {contacts.map((c) => (
                    <div key={c.Id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {[c.FirstName, c.LastName].filter(Boolean).join(' ')}
                          </p>
                          {c.Email && <p className="text-xs text-gray-500 mt-0.5">{c.Email}</p>}
                        </div>
                        <div className="text-right">
                          {c.Title && <p className="text-xs text-gray-500">{c.Title}</p>}
                          {c.Phone && <p className="text-xs text-gray-400">{c.Phone}</p>}
                        </div>
                      </div>
                      {c.Department && (
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                          {c.Department}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {/* Accounts tab */}
            {activeTab === 'accounts' &&
              (loadingAccounts ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading accounts...</div>
              ) : accounts.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No accounts found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {accounts.map((a) => (
                    <div key={a.Id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{a.Name}</p>
                          {a.Website && <p className="text-xs text-gray-500 mt-0.5">{a.Website}</p>}
                        </div>
                        <div className="text-right">
                          {a.Industry && <p className="text-xs text-gray-500">{a.Industry}</p>}
                          {(a.BillingCity || a.BillingState) && (
                            <p className="text-xs text-gray-400">
                              {[a.BillingCity, a.BillingState].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      {a.Type && (
                        <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {a.Type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}

            {/* Opportunities tab */}
            {activeTab === 'opportunities' &&
              (loadingOpportunities ? (
                <div className="p-8 text-center text-sm text-gray-400">
                  Loading opportunities...
                </div>
              ) : opportunities.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No opportunities found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {opportunities.map((o) => (
                    <div key={o.Id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{o.Name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Stage: {o.StageName}</p>
                        </div>
                        <div className="text-right">
                          {o.Amount != null && (
                            <p className="text-sm font-semibold text-emerald-600">
                              ${o.Amount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Close:{' '}
                            {new Date(o.CloseDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            o.IsWon
                              ? 'bg-emerald-50 text-emerald-600'
                              : o.IsClosed
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {o.IsWon ? 'Won' : o.IsClosed ? 'Closed' : 'Open'}
                        </span>
                        {o.Probability != null && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {o.Probability}% probability
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {/* Leads tab */}
            {activeTab === 'leads' &&
              (loadingLeads ? (
                <div className="p-8 text-center text-sm text-gray-400">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-400">No leads found</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {leads.map((l) => (
                    <div key={l.Id} className="px-5 py-3 hover:bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {[l.FirstName, l.LastName].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{l.Company}</p>
                        </div>
                        <div className="text-right">
                          {l.Email && <p className="text-xs text-gray-500">{l.Email}</p>}
                          {l.Phone && <p className="text-xs text-gray-400">{l.Phone}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                          {l.Status}
                        </span>
                        {l.LeadSource && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            {l.LeadSource}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Workspace
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Integrations</h1>
            <p className="mt-1 text-sm text-gray-400">
              Connect your project management tools to automatically sync tasks extracted from
              meetings.
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/integrations/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
          >
            Docs
            <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          </a>
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
            <SlackCard orgId={orgId} />
            <TeamsCard orgId={orgId} />
          </div>
        </section>

        {/* Productivity */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Productivity
          </h2>
          <div className="space-y-3">
            <GoogleCalendarCard orgId={orgId} />
            <GoogleDriveCard orgId={orgId} />
          </div>
        </section>

        {/* Developer & CRM */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Developer &amp; CRM
          </h2>
          <div className="space-y-3">
            <GitHubCard orgId={orgId} />
            <HubSpotCard orgId={orgId} />
            <SalesforceCard orgId={orgId} />
          </div>
        </section>

        {/* Recruiting */}
        <section>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
            Recruiting
          </h2>
          <div className="space-y-3">
            <GreenhouseCard orgId={orgId} />
          </div>
        </section>
      </div>
    </div>
  )
}
