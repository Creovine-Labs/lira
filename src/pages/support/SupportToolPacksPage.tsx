import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PuzzlePieceIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import {
  disableToolPack,
  listToolPacks,
  upsertToolPack,
  type ToolPack,
} from '@/services/api/support-api'
import { cn } from '@/lib'

interface PackCatalogEntry {
  id: string
  name: string
  vendor: string
  description: string
  /** Tool names this pack contributes to the agent. */
  tools: string[]
  /** Required config fields. */
  fields: Array<{
    key: string
    label: string
    placeholder: string
    secret?: boolean
  }>
  icon: typeof CreditCardIcon
  helpUrl?: string
}

const CATALOG: PackCatalogEntry[] = [
  // Payment provider packs will be added here once a payment platform decision is made
]

function SupportToolPacksPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportToolPacksPanel />
      </div>
    </div>
  )
}

function SupportToolPacksPanel() {
  const { currentOrgId } = useOrgStore()
  const [packs, setPacks] = useState<ToolPack[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)

  async function refresh(orgId: string) {
    setLoading(true)
    try {
      const data = await listToolPacks(orgId)
      setPacks(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load tool packs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentOrgId) void refresh(currentOrgId)
  }, [currentOrgId])

  if (!currentOrgId) return null

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <PuzzlePieceIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#3730a3]" />
          <div className="text-sm text-gray-600">
            <p className="font-semibold text-gray-900">Agent tool packs</p>
            <p className="mt-1 leading-relaxed">
              Each enabled pack exposes tools the Lira agent can call during a chat. Tools that
              modify a customer's account (e.g. cancellations) automatically prompt the customer
              for confirmation before running.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
        </div>
      ) : (
        CATALOG.map((entry) => {
          const existing = packs.find((p) => p.pack_id === entry.id) ?? null
          const isEditing = editing === entry.id
          return (
            <PackCard
              key={entry.id}
              entry={entry}
              existing={existing}
              orgId={currentOrgId}
              isEditing={isEditing}
              onEdit={() => setEditing(entry.id)}
              onClose={() => setEditing(null)}
              onSaved={async () => {
                setEditing(null)
                await refresh(currentOrgId)
              }}
            />
          )
        })
      )}
    </div>
  )
}

function PackCard(props: {
  entry: PackCatalogEntry
  existing: ToolPack | null
  orgId: string
  isEditing: boolean
  onEdit: () => void
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { entry, existing, orgId, isEditing, onEdit, onClose, onSaved } = props
  const Icon = entry.icon
  const enabled = Boolean(existing?.enabled)

  async function handleDisable() {
    if (!confirm(`Disable the ${entry.name} pack? Lira will no longer be able to call its tools.`))
      return
    try {
      await disableToolPack(orgId, entry.id)
      toast.success(`${entry.name} disabled`)
      await onSaved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to disable')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className="flex items-start gap-3 p-5">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            enabled ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">{entry.name}</h3>
            <span className="text-xs text-gray-400">· {entry.vendor}</span>
            {enabled ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                <CheckCircleIcon className="h-3 w-3" />
                Enabled
              </span>
            ) : existing ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Disabled
              </span>
            ) : (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                Not configured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600">{entry.description}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {entry.tools.map((t) => (
              <span
                key={t}
                className="rounded-md bg-gray-50 px-2 py-0.5 font-mono text-[11px] text-gray-700"
              >
                {t}
              </span>
            ))}
          </div>

          {existing && Object.keys(existing.config).length > 0 && !isEditing && (
            <dl className="mt-3 space-y-1 text-xs">
              {Object.entries(existing.config).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <dt className="w-32 shrink-0 text-gray-500">{k}</dt>
                  <dd className="font-mono text-gray-700">{v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {!isEditing && (
          <div className="flex shrink-0 flex-col gap-1.5">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {existing ? 'Update' : 'Connect'}
            </button>
            {enabled && (
              <button
                type="button"
                onClick={handleDisable}
                className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Disable
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <PackEditForm
          entry={entry}
          existing={existing}
          orgId={orgId}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </div>
  )
}

function PackEditForm(props: {
  entry: PackCatalogEntry
  existing: ToolPack | null
  orgId: string
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const { entry, existing, orgId, onClose, onSaved } = props
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of entry.fields) {
      // Don't pre-fill secrets (server returns redacted form like sk_test_…abcd).
      if (f.secret) init[f.key] = ''
      else init[f.key] = existing?.config?.[f.key] ?? ''
    }
    return init
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(enabled: boolean) {
    // Build config: keep any existing secret values when the user left them blank,
    // by NOT sending the field — but the API requires the full config object. So if
    // the user left a secret blank and there's an existing pack, refuse rather
    // than overwriting with empty.
    const config: Record<string, string> = {}
    for (const f of entry.fields) {
      const v = values[f.key]?.trim() ?? ''
      if (f.secret && !v && existing?.config?.[f.key]) {
        toast.error(`Re-enter ${f.label} to save (we cannot reuse the redacted value).`)
        return
      }
      if (!v && enabled) {
        toast.error(`${f.label} is required`)
        return
      }
      config[f.key] = v
    }
    setSaving(true)
    try {
      await upsertToolPack(orgId, entry.id, { enabled, config })
      toast.success(enabled ? `${entry.name} enabled` : `${entry.name} saved`)
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
          {existing ? 'Update credentials' : 'Connect ' + entry.name}
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

      {entry.helpUrl && (
        <p className="mb-3 text-xs text-gray-500">
          You can find these in the{' '}
          <a
            href={entry.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#3730a3] hover:underline"
          >
            {entry.vendor} dashboard
          </a>
          .
        </p>
      )}

      <div className="space-y-3">
        {entry.fields.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-600">{f.label}</span>
            <input
              type={f.secret ? 'password' : 'text'}
              autoComplete="off"
              spellCheck={false}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
            />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-amber-700">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        <span>
          Stored encrypted at rest. Use a restricted-permission key when possible.
        </span>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={saving}
          className="rounded-lg bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2c2682] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : existing?.enabled ? 'Update & keep enabled' : 'Save & enable'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export { SupportToolPacksPage, SupportToolPacksPanel }
