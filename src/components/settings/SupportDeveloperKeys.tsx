import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  KeyIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import {
  listDeveloperKeys,
  createDeveloperKey,
  revokeDeveloperKey,
  type DeveloperKey,
  type DeveloperKeyScope,
} from '@/services/api/support-api'
import { SCard, Field, fieldInputCls } from './support-ui'

const SCOPES: Array<{ value: DeveloperKeyScope; label: string; desc: string; danger?: boolean }> = [
  {
    value: 'mcp:read',
    label: 'MCP read',
    desc: 'Read the MCP server config and discovered tools.',
  },
  {
    value: 'mcp:write',
    label: 'MCP write',
    desc: 'Connect, approve, enable, and remove MCP tools.',
  },
  { value: 'support:read', label: 'Support read', desc: 'Read support configuration.' },
  { value: 'support:write', label: 'Support write', desc: 'Update support configuration.' },
  {
    value: 'sessions:mint',
    label: 'Mint sessions',
    desc: 'Start a native support session as any of your customers. High privilege — keep this key on your backend only.',
    danger: true,
  },
]

const primaryBtn =
  'rounded-lg bg-gray-900 px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50'
const ghostBtn =
  'rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'

export function SupportDeveloperKeys() {
  const { currentOrgId } = useOrgStore()
  const [keys, setKeys] = useState<DeveloperKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newToken, setNewToken] = useState<string | null>(null)

  const refresh = useCallback(async (orgId: string) => {
    setLoading(true)
    try {
      setKeys(await listDeveloperKeys(orgId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentOrgId) void refresh(currentOrgId)
  }, [currentOrgId, refresh])

  const revoke = useCallback(
    async (key: DeveloperKey) => {
      if (!currentOrgId) return
      if (
        !confirm(
          `Revoke "${key.name}"? Any script or backend using it will stop working immediately.`
        )
      )
        return
      try {
        await revokeDeveloperKey(currentOrgId, key.key_id)
        toast.success('Key revoked')
        await refresh(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to revoke')
      }
    },
    [currentOrgId, refresh]
  )

  if (!currentOrgId) return null

  const active = keys.filter((k) => k.status === 'active')

  return (
    <SCard
      title="Developer API keys"
      hint="For your engineers to automate Lira from the CLI or API — connect MCP tools, and mint native mobile support sessions from your backend. Create a key, then use it as LIRA_API_KEY."
      right={
        !showForm && !newToken ? (
          <button type="button" onClick={() => setShowForm(true)} className={ghostBtn}>
            Create key
          </button>
        ) : undefined
      }
    >
      {/* One-time token reveal */}
      {newToken && (
        <div className="mb-3 rounded-xl border border-gray-900/15 bg-gray-900/[0.03] p-4">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-gray-900">Copy your key now</p>
              <p className="mt-0.5 text-xs text-gray-500">
                This is the only time it&apos;s shown. Store it somewhere safe — you can&apos;t
                retrieve it again (only revoke and make a new one).
              </p>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-gray-800">
                  {newToken}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newToken)
                    toast.success('Copied')
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200"
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => setNewToken(null)}
                className="mt-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                I&apos;ve saved it — done
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && !newToken && (
        <CreateKeyForm
          orgId={currentOrgId}
          onClose={() => setShowForm(false)}
          onCreated={async (token) => {
            setShowForm(false)
            setNewToken(token)
            await refresh(currentOrgId)
          }}
        />
      )}

      {/* Key list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        </div>
      ) : active.length === 0 && !showForm && !newToken ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <KeyIcon className="h-6 w-6 text-gray-300" />
          <p className="text-sm text-gray-400">
            No keys yet. Create one to automate from the CLI or API.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((key) => (
            <div
              key={key.key_id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 px-3.5 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-900">{key.name}</span>
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
                    {key.token_prefix}…
                  </code>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {key.scopes.map((s) => (
                    <span
                      key={s}
                      className={
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold ' +
                        (s === 'sessions:mint'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-gray-100 text-gray-500')
                      }
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  {key.last_used_at
                    ? `Last used ${new Date(key.last_used_at).toLocaleString()}`
                    : 'Never used'}
                  {key.expires_at && ` · expires ${new Date(key.expires_at).toLocaleDateString()}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => revoke(key)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </SCard>
  )
}

function CreateKeyForm(props: {
  orgId: string
  onClose: () => void
  onCreated: (token: string) => void | Promise<void>
}) {
  const { orgId, onClose, onCreated } = props
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Set<DeveloperKeyScope>>(new Set(['mcp:read', 'mcp:write']))
  const [expires, setExpires] = useState('')
  const [saving, setSaving] = useState(false)

  function toggleScope(s: DeveloperKeyScope) {
    setScopes((cur) => {
      const next = new Set(cur)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  async function create() {
    if (!name.trim()) {
      toast.error('Give the key a name so you can recognize it later')
      return
    }
    if (scopes.size === 0) {
      toast.error('Pick at least one permission')
      return
    }
    setSaving(true)
    try {
      const { token } = await createDeveloperKey(orgId, {
        name: name.trim(),
        scopes: Array.from(scopes),
        expires_at: expires ? new Date(expires).toISOString() : undefined,
      })
      await onCreated(token)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-3 rounded-xl border border-gray-200 p-4">
      <p className="text-[13px] font-bold text-gray-900">New developer key</p>
      <Field label="Name" hint="Something you'll recognize, e.g. “Riverly CI” or “Mobile backend”.">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Riverly backend"
          className={fieldInputCls}
        />
      </Field>
      <div className="border-t border-gray-100 py-3">
        <p className="mb-2 text-[13px] font-semibold text-gray-900">Permissions</p>
        <div className="space-y-1.5">
          {SCOPES.map((s) => {
            const checked = scopes.has(s.value)
            return (
              <label
                key={s.value}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  aria-label={s.value}
                  checked={checked}
                  onChange={() => toggleScope(s.value)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300"
                />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-900">
                    <code className="font-mono text-xs">{s.value}</code>
                    {s.danger && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        High privilege
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-gray-500">{s.desc}</span>
                </span>
              </label>
            )
          })}
        </div>
        {scopes.has('sessions:mint') && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              A key with <code className="font-mono">sessions:mint</code> can start a support
              session as <strong>any of your customers</strong>. Only use it server-side, and revoke
              it if it ever leaks.
            </span>
          </div>
        )}
      </div>
      <Field label="Expiry (optional)" hint="Leave blank for a key that never expires.">
        <input
          type="date"
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
          className={fieldInputCls}
        />
      </Field>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={create} disabled={saving} className={primaryBtn}>
          {saving ? 'Creating…' : 'Create key'}
        </button>
        <button type="button" onClick={onClose} className={ghostBtn}>
          Cancel
        </button>
      </div>
    </div>
  )
}
