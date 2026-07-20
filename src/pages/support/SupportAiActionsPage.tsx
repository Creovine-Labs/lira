import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ServerStackIcon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  BoltIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import {
  getMcpServer,
  upsertMcpServer,
  deleteMcpServer,
  discoverMcpTools,
  type McpServerAdminView,
  type McpApprovedTool,
  type McpApprovedToolInput,
  type McpDiscoveredTool,
  type McpRiskTier,
  type McpAuthScope,
} from '@/services/api/support-api'
import { SupportToolPacksPanel } from './SupportToolPacksPage'
import { cn } from '@/lib'

// ── Human-readable risk / scope labels (mirror the backend policy tiers) ───────

const RISK_OPTIONS: Array<{ value: McpRiskTier; label: string; hint: string }> = [
  { value: 'read_public', label: 'Public read', hint: 'Anyone can trigger. No account data.' },
  {
    value: 'read_private',
    label: 'Private read',
    hint: 'Reads account data. Needs a verified customer.',
  },
  {
    value: 'safe_write',
    label: 'Safe write',
    hint: 'Low-risk change. Runs without a confirm prompt.',
  },
  {
    value: 'customer_confirm',
    label: 'Write — confirm first',
    hint: 'Asks the customer to confirm before running.',
  },
  {
    value: 'step_up',
    label: 'Sensitive — re-auth',
    hint: 'Money/card-adjacent. Requires step-up re-auth.',
  },
  { value: 'admin_approve', label: 'Admin approval', hint: 'Queued for a human admin to approve.' },
  { value: 'human_only', label: 'Human only', hint: 'The AI can never run this — humans only.' },
]

const SCOPE_OPTIONS: Array<{ value: McpAuthScope; label: string }> = [
  { value: 'public', label: 'Anyone' },
  { value: 'verified_visitor', label: 'Verified visitor' },
  { value: 'verified_customer', label: 'Verified customer' },
]

function riskLabel(risk: McpRiskTier): string {
  return RISK_OPTIONS.find((r) => r.value === risk)?.label ?? risk
}
function scopeLabel(scope: McpAuthScope): string {
  return SCOPE_OPTIONS.find((s) => s.value === scope)?.label ?? scope
}

/** Approved tools → the input shape the PUT expects (so we never drop existing ones). */
function toApprovedInput(t: McpApprovedTool): McpApprovedToolInput {
  return {
    source_name: t.source_name,
    tool_name: t.tool_name,
    description: t.description,
    input_schema: t.input_schema,
    output_schema: t.output_schema,
    kind: t.kind,
    risk: t.risk,
    auth_scope: t.auth_scope,
    enabled: t.enabled,
    timeout_ms: t.timeout_ms,
    allowed_channels: t.allowed_channels,
  }
}

function SupportAiActionsPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl space-y-3">
        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <BoltIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#020308]" />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-900">AI actions</p>
              <p className="mt-1 leading-relaxed">
                Let Lira resolve issues in-chat by calling your own systems. The recommended path is
                to connect your <span className="font-semibold text-gray-900">MCP server</span> —
                your tools run under your own auth, and Lira governs every call with plan limits,
                identity checks, confirmation / step-up, audit and metering. Every tool you approve
                still passes Lira&apos;s policy engine; the AI can propose, but Lira enforces.
              </p>
            </div>
          </div>
        </div>

        <McpConnectorPanel />

        <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Alternative — REST adapter pack
          </p>
          <p className="mt-1 text-sm text-gray-600">
            No MCP server yet? Connect a REST API that follows Lira&apos;s convention (or a thin
            adapter in front of your real API). Best for simpler APIs; MCP is the better fit for a
            mature product.
          </p>
        </div>
        <SupportToolPacksPanel />
      </div>
    </div>
  )
}

function McpConnectorPanel() {
  const { currentOrgId } = useOrgStore()
  const [server, setServer] = useState<McpServerAdminView | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [discovered, setDiscovered] = useState<McpDiscoveredTool[]>([])
  const [discovering, setDiscovering] = useState(false)

  async function refresh(orgId: string) {
    setLoading(true)
    try {
      setServer(await getMcpServer(orgId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load MCP server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrgId) void refresh(currentOrgId)
  }, [currentOrgId])

  const approvedNames = useMemo(
    () => new Set((server?.approved_tools ?? []).map((t) => t.source_name)),
    [server]
  )

  if (!currentOrgId) return null

  async function handleDiscover() {
    if (!currentOrgId) return
    setDiscovering(true)
    try {
      const res = await discoverMcpTools(currentOrgId)
      setDiscovered(res.tools)
      toast.success(`Found ${res.tools.length} tool${res.tools.length === 1 ? '' : 's'}`)
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setDiscovering(false)
    }
  }

  async function handleToggleEnabled() {
    if (!currentOrgId || !server) return
    try {
      await upsertMcpServer(currentOrgId, { enabled: !server.enabled })
      toast.success(server.enabled ? 'MCP server disabled' : 'MCP server enabled')
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  async function handleDelete() {
    if (!currentOrgId || !server) return
    if (
      !confirm('Disconnect this MCP server? Approved tools and the stored credential are removed.')
    )
      return
    try {
      await deleteMcpServer(currentOrgId)
      toast.success('MCP server disconnected')
      setDiscovered([])
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disconnect')
    }
  }

  // Approve a discovered tool by writing the FULL approved list back (PUT replaces it).
  async function approveTool(
    disc: McpDiscoveredTool,
    mapping: {
      risk: McpRiskTier
      auth_scope: McpAuthScope
      enabled: boolean
    }
  ) {
    if (!currentOrgId || !server) return
    const others = (server.approved_tools ?? [])
      .filter((t) => t.source_name !== disc.source_name)
      .map(toApprovedInput)
    const next: McpApprovedToolInput = {
      source_name: disc.source_name,
      tool_name: disc.suggested_tool_name,
      description: disc.description,
      input_schema: disc.input_schema,
      kind: 'action',
      risk: mapping.risk,
      auth_scope: mapping.auth_scope,
      enabled: mapping.enabled,
      allowed_channels: ['chat'],
    }
    try {
      await upsertMcpServer(currentOrgId, { approved_tools: [...others, next] })
      toast.success(`Approved ${disc.source_name}`)
      setDiscovered((cur) => cur.filter((t) => t.source_name !== disc.source_name))
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve tool')
    }
  }

  async function setToolEnabled(tool: McpApprovedTool, enabled: boolean) {
    if (!currentOrgId || !server) return
    const all = (server.approved_tools ?? []).map((t) =>
      t.source_name === tool.source_name ? { ...toApprovedInput(t), enabled } : toApprovedInput(t)
    )
    try {
      await upsertMcpServer(currentOrgId, { approved_tools: all })
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update tool')
    }
  }

  async function removeTool(tool: McpApprovedTool) {
    if (!currentOrgId || !server) return
    const rest = (server.approved_tools ?? [])
      .filter((t) => t.source_name !== tool.source_name)
      .map(toApprovedInput)
    try {
      await upsertMcpServer(currentOrgId, { approved_tools: rest })
      toast.success(`Removed ${tool.source_name}`)
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove tool')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center rounded-2xl border border-white/60 bg-white py-10 shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-5">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            server?.enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
          )}
        >
          <ServerStackIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">MCP server</h3>
            {server ? (
              server.enabled ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                  <CheckCircleIcon className="h-3 w-3" />
                  Enabled
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                  Disabled
                </span>
              )
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Not connected
              </span>
            )}
            {server && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {server.environment}
              </span>
            )}
          </div>

          {server ? (
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-gray-500">Endpoint</dt>
                <dd className="truncate font-mono text-gray-700">{server.endpoint_url}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 text-gray-500">Auth</dt>
                <dd className="text-gray-700">
                  {server.auth_type === 'bearer'
                    ? server.has_access_token
                      ? 'Bearer (credential stored)'
                      : 'Bearer (credential missing)'
                    : 'None'}
                </dd>
              </div>
              {server.last_discovered_at && (
                <div className="flex gap-2">
                  <dt className="w-28 shrink-0 text-gray-500">Last discovered</dt>
                  <dd className="text-gray-700">
                    {new Date(server.last_discovered_at).toLocaleString()}
                  </dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              Point Lira at your MCP endpoint. Nothing is callable until you discover tools and
              approve them one by one.
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {server ? 'Edit' : 'Connect'}
            </button>
            {server && (
              <>
                <button
                  type="button"
                  onClick={handleToggleEnabled}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {server.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {editing && (
        <McpServerForm
          orgId={currentOrgId}
          existing={server}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            setEditing(false)
            await refresh(currentOrgId)
          }}
        />
      )}

      {server && !editing && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          {/* Discover */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tools</p>
            <button
              type="button"
              onClick={handleDiscover}
              disabled={discovering}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
              {discovering ? 'Discovering…' : 'Discover tools'}
            </button>
          </div>

          {/* Approved tools */}
          {(server.approved_tools ?? []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {server.approved_tools.map((tool) => (
                <div
                  key={tool.source_name}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] text-gray-700">{tool.tool_name}</span>
                      <RiskBadge risk={tool.risk} />
                      <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500">
                        {scopeLabel(tool.auth_scope)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-gray-500">{tool.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setToolEnabled(tool, !tool.enabled)}
                      className={cn(
                        'rounded-md px-2 py-1 text-[11px] font-semibold',
                        tool.enabled
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {tool.enabled ? 'On' : 'Off'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTool(tool)}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove tool"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">
              No tools approved yet. Discover tools, then map each one to a risk level below.
            </p>
          )}

          {/* Discovered (pending approval) */}
          {discovered.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Discovered — map &amp; approve
              </p>
              <div className="mt-2 space-y-2">
                {discovered
                  .filter((d) => !approvedNames.has(d.source_name))
                  .map((disc) => (
                    <DiscoveredToolRow key={disc.source_name} disc={disc} onApprove={approveTool} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RiskBadge({ risk }: { risk: McpRiskTier }) {
  const danger = risk === 'step_up' || risk === 'admin_approve' || risk === 'human_only'
  const warn = risk === 'customer_confirm' || risk === 'safe_write'
  return (
    <span
      className={cn(
        'rounded-md px-1.5 py-0.5 text-[10px] font-semibold',
        danger
          ? 'bg-red-50 text-red-700'
          : warn
            ? 'bg-amber-50 text-amber-700'
            : 'bg-blue-50 text-blue-700'
      )}
    >
      {riskLabel(risk)}
    </span>
  )
}

function DiscoveredToolRow(props: {
  disc: McpDiscoveredTool
  onApprove: (
    disc: McpDiscoveredTool,
    mapping: { risk: McpRiskTier; auth_scope: McpAuthScope; enabled: boolean }
  ) => void | Promise<void>
}) {
  const { disc, onApprove } = props
  const [risk, setRisk] = useState<McpRiskTier>('customer_confirm')
  const [scope, setScope] = useState<McpAuthScope>('verified_customer')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const riskHint = RISK_OPTIONS.find((r) => r.value === risk)?.hint

  async function approve() {
    setSaving(true)
    try {
      await onApprove(disc, { risk, auth_scope: scope, enabled })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[11px] text-gray-700">{disc.source_name}</span>
        <span className="text-[10px] text-gray-400">→ {disc.suggested_tool_name}</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-500">{disc.description}</p>

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Risk
          </span>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as McpRiskTier)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[#020308] focus:outline-none"
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Who
          </span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as McpAuthScope)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-[#020308] focus:outline-none"
          >
            {SCOPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs text-gray-600">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable now
        </label>
        <button
          type="button"
          onClick={approve}
          disabled={saving}
          className="ml-auto rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#020308] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Approve'}
        </button>
      </div>
      {riskHint && <p className="mt-1.5 text-[11px] text-gray-400">{riskHint}</p>}
    </div>
  )
}

function McpServerForm(props: {
  orgId: string
  existing: McpServerAdminView | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { orgId, existing, onClose, onSaved } = props
  const [label, setLabel] = useState(existing?.server_label ?? '')
  const [endpoint, setEndpoint] = useState(existing?.endpoint_url ?? '')
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(
    existing?.environment ?? 'sandbox'
  )
  const [authType, setAuthType] = useState<'none' | 'bearer'>(existing?.auth_type ?? 'bearer')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!endpoint.trim()) {
      toast.error('Endpoint URL is required')
      return
    }
    if (authType === 'bearer' && !existing?.has_access_token && !token.trim()) {
      toast.error('Enter the bearer token to connect')
      return
    }
    setSaving(true)
    try {
      await upsertMcpServer(orgId, {
        server_label: label.trim() || 'Customer MCP server',
        endpoint_url: endpoint.trim(),
        environment,
        auth_type: authType,
        // Only send the token when the user actually typed one (never overwrite with blank).
        ...(token.trim() ? { access_token: token.trim() } : {}),
      })
      toast.success(existing ? 'MCP server updated' : 'MCP server connected')
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {existing ? 'Edit MCP server' : 'Connect MCP server'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-600"
          aria-label="Close"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Label</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Riverly MCP"
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600">Endpoint URL</span>
          <input
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://mcp.yourcompany.com/mcp"
            className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
          />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-medium text-gray-600">Environment</span>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as 'sandbox' | 'production')}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#020308] focus:outline-none"
            >
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-medium text-gray-600">Auth</span>
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer')}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#020308] focus:outline-none"
            >
              <option value="bearer">Bearer token</option>
              <option value="none">None</option>
            </select>
          </label>
        </div>
        {authType === 'bearer' && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">
              Bearer token{' '}
              {existing?.has_access_token && (
                <span className="text-gray-400">(stored — leave blank to keep)</span>
              )}
            </span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="mcp_live_…"
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-[#020308] focus:outline-none focus:ring-1 focus:ring-[#020308]"
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <ShieldCheckIcon className="h-3.5 w-3.5 shrink-0" />
        <span>
          Credential stored encrypted at rest, sent only to this endpoint. In production the
          endpoint must be https and can&apos;t point at a private/internal address.
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-[#020308] px-4 py-2 text-xs font-semibold text-white hover:bg-[#020308] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Connect'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {authType === 'bearer' && !existing && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Connecting saves the server disabled. Discover and approve tools, then enable it from
            the card above.
          </span>
        </div>
      )}
    </div>
  )
}

export { SupportAiActionsPage }
