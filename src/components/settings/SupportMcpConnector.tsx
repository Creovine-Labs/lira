import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import { getDocsUrl } from '@/lib/docs'
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

// Plain-language risk / audience labels (mirror the backend policy tiers).
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
    hint: 'Asks the customer to confirm first.',
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

const riskLabel = (r: McpRiskTier) => RISK_OPTIONS.find((o) => o.value === r)?.label ?? r
const scopeLabel = (s: McpAuthScope) => SCOPE_OPTIONS.find((o) => o.value === s)?.label ?? s

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

const inputCls =
  'w-full rounded-xl border border-input bg-background px-3 py-1.5 text-sm outline-none focus:border-gray-900'
const selectCls =
  'rounded-xl border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-gray-900'
const primaryBtn =
  'rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50'
const ghostBtn =
  'rounded-lg border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-gray-50'

export function SupportMcpConnector({
  orgEnvironment,
}: {
  /** The org's current environment — new MCP servers default to match it. */
  orgEnvironment?: 'sandbox' | 'production'
} = {}) {
  const { currentOrgId } = useOrgStore()
  const [server, setServer] = useState<McpServerAdminView | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [discovered, setDiscovered] = useState<McpDiscoveredTool[]>([])
  const [discovering, setDiscovering] = useState(false)

  const refresh = useCallback(async (orgId: string) => {
    setLoading(true)
    try {
      setServer(await getMcpServer(orgId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load MCP server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentOrgId) void refresh(currentOrgId)
  }, [currentOrgId, refresh])

  const approvedNames = useMemo(
    () => new Set((server?.approved_tools ?? []).map((t) => t.source_name)),
    [server]
  )

  const handleDiscover = useCallback(async () => {
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
  }, [currentOrgId, refresh])

  const toggleEnabled = useCallback(async () => {
    if (!currentOrgId || !server) return
    try {
      await upsertMcpServer(currentOrgId, { enabled: !server.enabled })
      toast.success(server.enabled ? 'MCP server disabled' : 'MCP server enabled')
      await refresh(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }, [currentOrgId, server, refresh])

  const disconnect = useCallback(async () => {
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
  }, [currentOrgId, server, refresh])

  const approveTool = useCallback(
    async (
      disc: McpDiscoveredTool,
      mapping: { risk: McpRiskTier; auth_scope: McpAuthScope; enabled: boolean }
    ) => {
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
    },
    [currentOrgId, server, refresh]
  )

  const setToolEnabled = useCallback(
    async (tool: McpApprovedTool, enabled: boolean) => {
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
    },
    [currentOrgId, server, refresh]
  )

  const removeTool = useCallback(
    async (tool: McpApprovedTool) => {
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
    },
    [currentOrgId, server, refresh]
  )

  if (!currentOrgId) return null
  if (loading) {
    return (
      <div className="flex justify-center rounded-lg border py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Server summary / status */}
      <div className="rounded-lg border px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-foreground">MCP server</p>
              {server ? (
                <StatusBadge on={server.enabled} onLabel="Enabled" offLabel="Disabled" />
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
              <dl className="mt-1.5 space-y-0.5 text-xs">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">Endpoint</dt>
                  <dd className="truncate font-mono text-foreground">{server.endpoint_url}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 text-muted-foreground">Auth</dt>
                  <dd className="text-foreground">
                    {server.auth_type === 'bearer'
                      ? server.has_access_token
                        ? 'Bearer (stored)'
                        : 'Bearer (missing)'
                      : 'None'}
                  </dd>
                </div>
                {server.last_discovered_at && (
                  <div className="flex gap-2">
                    <dt className="w-24 shrink-0 text-muted-foreground">Discovered</dt>
                    <dd className="text-foreground">
                      {new Date(server.last_discovered_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Point Lira at your MCP endpoint. Nothing is callable until you discover tools and
                approve them.
              </p>
            )}
          </div>
          {!editing && (
            <div className="flex shrink-0 flex-col gap-1.5">
              <button type="button" onClick={() => setEditing(true)} className={ghostBtn}>
                {server ? 'Edit' : 'Connect'}
              </button>
              {server && (
                <>
                  <button type="button" onClick={toggleEnabled} className={ghostBtn}>
                    {server.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
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
            orgEnvironment={orgEnvironment}
            onClose={() => setEditing(false)}
            onSaved={async () => {
              setEditing(false)
              await refresh(currentOrgId)
            }}
          />
        )}
      </div>

      {/* Tools */}
      {server && !editing && (
        <div className="rounded-lg border px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Tools</p>
            <button
              type="button"
              onClick={handleDiscover}
              disabled={discovering}
              className={ghostBtn}
            >
              {discovering ? 'Discovering…' : 'Discover tools'}
            </button>
          </div>

          {(server.approved_tools ?? []).length > 0 ? (
            <div className="mt-3 space-y-2">
              {server.approved_tools.map((tool) => (
                <div
                  key={tool.source_name}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] text-foreground">
                        {tool.tool_name}
                      </span>
                      <RiskBadge risk={tool.risk} />
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {scopeLabel(tool.auth_scope)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setToolEnabled(tool, !tool.enabled)}
                      className={
                        tool.enabled
                          ? 'rounded-md bg-green-50 px-2 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100'
                          : 'rounded-md bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-200'
                      }
                    >
                      {tool.enabled ? 'On' : 'Off'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeTool(tool)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">
              No tools approved yet. Discover tools, then map each one to a risk level.
            </p>
          )}

          {discovered.filter((d) => !approvedNames.has(d.source_name)).length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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

function StatusBadge({
  on,
  onLabel,
  offLabel,
}: {
  on: boolean
  onLabel: string
  offLabel: string
}) {
  return on ? (
    <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
      {onLabel}
    </span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
      {offLabel}
    </span>
  )
}

function RiskBadge({ risk }: { risk: McpRiskTier }) {
  const danger = risk === 'step_up' || risk === 'admin_approve' || risk === 'human_only'
  const warn = risk === 'customer_confirm' || risk === 'safe_write'
  return (
    <span
      className={
        'rounded px-1.5 py-0.5 text-[10px] font-semibold ' +
        (danger
          ? 'bg-red-50 text-red-700'
          : warn
            ? 'bg-amber-50 text-amber-700'
            : 'bg-blue-50 text-blue-700')
      }
    >
      {riskLabel(risk)}
    </span>
  )
}

function DiscoveredToolRow(props: {
  disc: McpDiscoveredTool
  onApprove: (
    d: McpDiscoveredTool,
    m: { risk: McpRiskTier; auth_scope: McpAuthScope; enabled: boolean }
  ) => void | Promise<void>
}) {
  const { disc, onApprove } = props
  const [risk, setRisk] = useState<McpRiskTier>('customer_confirm')
  const [scope, setScope] = useState<McpAuthScope>('verified_customer')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const hint = RISK_OPTIONS.find((r) => r.value === risk)?.hint

  return (
    <div className="rounded-lg border px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-mono text-[11px] text-foreground">{disc.source_name}</span>
        <span className="text-[10px] text-muted-foreground">→ {disc.suggested_tool_name}</span>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{disc.description}</p>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Risk
          </span>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value as McpRiskTier)}
            className={selectCls}
          >
            {RISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Who
          </span>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as McpAuthScope)}
            className={selectCls}
          >
            {SCOPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 pb-1.5 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Enable now
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await onApprove(disc, { risk, auth_scope: scope, enabled })
            } finally {
              setSaving(false)
            }
          }}
          className={`ml-auto ${primaryBtn}`}
        >
          {saving ? 'Saving…' : 'Approve'}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

function McpServerForm(props: {
  orgId: string
  existing: McpServerAdminView | null
  orgEnvironment?: 'sandbox' | 'production'
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { orgId, existing, orgEnvironment, onClose, onSaved } = props
  const [label, setLabel] = useState(existing?.server_label ?? '')
  const [endpoint, setEndpoint] = useState(existing?.endpoint_url ?? '')
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>(
    existing?.environment ?? orgEnvironment ?? 'sandbox'
  )
  const [authType, setAuthType] = useState<'none' | 'bearer'>(existing?.auth_type ?? 'bearer')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    const raw = endpoint.trim()
    if (!raw) {
      toast.error('Endpoint URL is required')
      return
    }
    // Block anything that isn't a reachable MCP endpoint before we save it.
    let url: URL
    try {
      url = new URL(raw)
    } catch {
      toast.error('Enter a full URL, e.g. https://mcp.yourcompany.com/mcp')
      return
    }
    if (url.protocol !== 'https:') {
      toast.error('The endpoint must use https://')
      return
    }
    if (!url.hostname.includes('.')) {
      toast.error("That doesn't look like a reachable MCP endpoint URL.")
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
    <div className="mt-3 space-y-3 border-t pt-3">
      <a
        href={getDocsUrl('mcp-gateway')}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs font-semibold text-foreground underline"
      >
        Read the MCP setup guide
      </a>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground">Label</span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="My MCP server"
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-foreground">Endpoint URL</span>
        <input
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://mcp.yourcompany.com/mcp"
          className={`${inputCls} font-mono`}
        />
      </label>
      <div className="flex gap-3">
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground">Environment</span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as 'sandbox' | 'production')}
            className={`${selectCls} w-full`}
          >
            <option value="sandbox">Sandbox</option>
            <option value="production">Production</option>
          </select>
        </label>
        <label className="block flex-1">
          <span className="mb-1 block text-xs font-medium text-foreground">Auth</span>
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer')}
            className={`${selectCls} w-full`}
          >
            <option value="bearer">Bearer token</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      {authType === 'bearer' && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-foreground">
            Bearer token{' '}
            {existing?.has_access_token && (
              <span className="text-muted-foreground">(stored — leave blank to keep)</span>
            )}
          </span>
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="mcp_live_…"
            className={`${inputCls} font-mono`}
          />
        </label>
      )}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Connect'}
        </button>
        <button type="button" onClick={onClose} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </div>
  )
}
