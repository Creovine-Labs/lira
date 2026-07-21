import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  KeyIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
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
import { cn } from '@/lib'

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
const ALL_SCOPES = SCOPES.map((s) => s.value)

const primaryBtn =
  'rounded-lg bg-gray-900 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50'
const ghostBtn =
  'rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50'

export function SupportDeveloperKeys() {
  const { currentOrgId } = useOrgStore()
  const [keys, setKeys] = useState<DeveloperKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

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
    <>
      <SCard
        title="Developer API keys"
        hint="For your engineers to automate Lira from the CLI or API — connect MCP tools, and mint native mobile support sessions from your backend. Create a key, then use it as LIRA_API_KEY."
        right={
          <button type="button" onClick={() => setShowModal(true)} className={ghostBtn}>
            New key
          </button>
        }
      >
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : active.length === 0 ? (
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
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[10px] font-semibold',
                          s === 'sessions:mint'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {key.last_used_at
                      ? `Last used ${new Date(key.last_used_at).toLocaleString()}`
                      : 'Never used'}
                    {key.expires_at &&
                      ` · expires ${new Date(key.expires_at).toLocaleDateString()}`}
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

      {showModal && (
        <CreateKeyModal
          orgId={currentOrgId}
          onClose={() => setShowModal(false)}
          onCreated={() => refresh(currentOrgId)}
        />
      )}
    </>
  )
}

function CreateKeyModal(props: {
  orgId: string
  onClose: () => void
  onCreated: () => void | Promise<void>
}) {
  const { orgId, onClose, onCreated } = props
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<Set<DeveloperKeyScope>>(new Set(['mcp:read', 'mcp:write']))
  const [scopesOpen, setScopesOpen] = useState(false)
  const [expiryMode, setExpiryMode] = useState<'never' | 'date'>('never')
  const [expiryDate, setExpiryDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  const allSelected = scopes.size === ALL_SCOPES.length

  function toggleScope(s: DeveloperKeyScope) {
    setScopes((cur) => {
      const next = new Set(cur)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }
  function toggleAll() {
    setScopes(allSelected ? new Set() : new Set(ALL_SCOPES))
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
    if (expiryMode === 'date' && !expiryDate) {
      toast.error('Pick an expiry date, or choose “Never”')
      return
    }
    setSaving(true)
    try {
      const { token } = await createDeveloperKey(orgId, {
        name: name.trim(),
        scopes: Array.from(scopes),
        expires_at:
          expiryMode === 'date' && expiryDate ? new Date(expiryDate).toISOString() : undefined,
      })
      setCreatedToken(token)
      await onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create key')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !saving && onClose()} />
      <div className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <p className="text-[15px] font-bold text-gray-900">
            {createdToken ? 'Key created' : 'New developer key'}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {createdToken ? (
            <div>
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-xs leading-relaxed text-amber-800">
                  This is the only time your key is shown. Copy it now and store it safely — you
                  can&apos;t retrieve it again (only revoke and make a new one).
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-gray-800">
                  {createdToken}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken)
                    toast.success('Copied')
                  }}
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-gray-800"
                >
                  <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Name" hint="Something you'll recognize, e.g. a system or environment.">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production backend"
                  className={fieldInputCls}
                />
              </Field>

              {/* Permissions */}
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-gray-900">Permissions</p>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    aria-label="All permissions"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-[13px] font-semibold text-gray-900">All permissions</span>
                  <span className="ml-auto text-[11px] text-gray-400">{scopes.size} selected</span>
                </label>

                <button
                  type="button"
                  onClick={() => setScopesOpen((o) => !o)}
                  className="mt-2 flex w-full items-center gap-1.5 text-[13px] font-semibold text-gray-600 hover:text-gray-900"
                >
                  <ChevronRightIcon
                    className={cn(
                      'h-4 w-4 text-gray-400 transition-transform',
                      scopesOpen && 'rotate-90'
                    )}
                  />
                  Choose specific permissions
                </button>

                {scopesOpen && (
                  <div className="mt-2 space-y-1.5">
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
                )}

                {scopes.has('sessions:mint') && (
                  <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    <ExclamationTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      <code className="font-mono">sessions:mint</code> can start a support session
                      as <strong>any of your customers</strong>. Only use it server-side.
                    </span>
                  </div>
                )}
              </div>

              {/* Expiry */}
              <div>
                <p className="mb-1.5 text-[13px] font-semibold text-gray-900">Expiry</p>
                <div className="flex flex-col gap-1.5">
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="expiry"
                      checked={expiryMode === 'never'}
                      onChange={() => setExpiryMode('never')}
                      className="h-4 w-4 border-gray-300"
                    />
                    <span className="text-[13px] font-semibold text-gray-900">Never expires</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 px-3 py-2.5 hover:bg-gray-50">
                    <input
                      type="radio"
                      name="expiry"
                      checked={expiryMode === 'date'}
                      onChange={() => setExpiryMode('date')}
                      className="h-4 w-4 border-gray-300"
                    />
                    <span className="text-[13px] font-semibold text-gray-900">On a date</span>
                    {expiryMode === 'date' && (
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-900"
                      />
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3.5">
          {createdToken ? (
            <button
              type="button"
              onClick={onClose}
              className={cn(primaryBtn, 'inline-flex items-center gap-1.5')}
            >
              <CheckCircleIcon className="h-4 w-4" />
              Done
            </button>
          ) : (
            <>
              <button type="button" onClick={onClose} className={ghostBtn}>
                Cancel
              </button>
              <button type="button" onClick={create} disabled={saving} className={primaryBtn}>
                {saving ? 'Creating…' : 'Create key'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
