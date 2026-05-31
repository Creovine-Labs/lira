// /support/sla-policies — SLA policy CRUD (Phase 4 §1.2).
//
// Same left-list / right-editor pattern as Queues. Each policy carries two
// deadlines (first response + resolution), an optional "business hours
// only" flag, and optional applicability filters by priority and category.
// Applicability is rendered as compact checkbox grids — most policies in
// practice apply to a small set of priorities or "all" via an empty list.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import {
  createSlaPolicy,
  deleteSlaPolicy,
  listSlaPolicies,
  listTicketCategories,
  updateSlaPolicy,
  type SlaPolicyCreatePayload,
  type SupportSlaPolicy,
  type SupportTicketRecord,
  type TicketCategoryRecord,
} from '@/services/api/support-api'
import { cn } from '@/lib'

const PRIORITIES: SupportTicketRecord['priority'][] = ['low', 'medium', 'high', 'urgent']

function SupportSlaPoliciesPage() {
  const { currentOrgId } = useOrgStore()
  const [policies, setPolicies] = useState<SupportSlaPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)

  const load = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      setPolicies(await listSlaPolicies(currentOrgId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load policies')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(() => {
    if (selectedId === null || selectedId === 'new') return null
    return policies.find((p) => p.sla_policy_id === selectedId) ?? null
  }, [selectedId, policies])

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">SLA policies</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              Define how fast each ticket must get a first response and a resolution. Policies can
              apply to all tickets or only certain priorities / categories.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            New policy
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
          <PolicyList
            policies={policies}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={() => setSelectedId('new')}
          />
          <PolicyEditor
            key={selected?.sla_policy_id ?? selectedId ?? 'none'}
            orgId={currentOrgId}
            mode={selectedId === 'new' ? 'new' : selected ? 'edit' : 'empty'}
            policy={selected}
            onSaved={async (p) => {
              await load()
              setSelectedId(p.sla_policy_id)
            }}
            onDeleted={async () => {
              await load()
              setSelectedId(null)
            }}
            onCancel={() => setSelectedId(null)}
          />
        </div>
      </div>
    </div>
  )
}

function PolicyList({
  policies,
  loading,
  selectedId,
  onSelect,
  onNew,
}: {
  policies: SupportSlaPolicy[]
  loading: boolean
  selectedId: string | 'new' | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-2xl border border-white/60 bg-white">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }
  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16">
        <p className="text-sm font-semibold text-gray-500">No SLA policies yet</p>
        <p className="mt-1 max-w-md text-center text-xs text-gray-400">
          Start with a single "Default SLA" — first-response and resolution targets for any ticket.
          Add tighter policies for high-priority categories later.
        </p>
        <button
          type="button"
          onClick={onNew}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create your first policy
        </button>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {policies.map((p) => {
        const isSelected = selectedId === p.sla_policy_id
        return (
          <li key={p.sla_policy_id}>
            <button
              type="button"
              onClick={() => onSelect(p.sla_policy_id)}
              className={cn(
                'block w-full rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition',
                isSelected
                  ? 'border-[#020308] shadow-md'
                  : 'border-white/60 hover:border-gray-200 hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                {p.business_hours_only && (
                  <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    Biz hours
                  </span>
                )}
              </div>
              {p.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{p.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
                <span>
                  <span className="font-semibold text-gray-700">FR:</span>{' '}
                  {formatMinutes(p.first_response_minutes)}
                </span>
                <span>
                  <span className="font-semibold text-gray-700">Res:</span>{' '}
                  {formatMinutes(p.resolution_minutes)}
                </span>
                {p.applies_to_priorities && p.applies_to_priorities.length > 0 && (
                  <span>· {p.applies_to_priorities.join(', ')}</span>
                )}
                {p.applies_to_categories && p.applies_to_categories.length > 0 && (
                  <span>· {p.applies_to_categories.length} categories</span>
                )}
              </div>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface PolicyEditorProps {
  orgId: string | null
  mode: 'new' | 'edit' | 'empty'
  policy: SupportSlaPolicy | null
  onSaved: (p: SupportSlaPolicy) => Promise<void>
  onDeleted: () => Promise<void>
  onCancel: () => void
}

function PolicyEditor({ orgId, mode, policy, onSaved, onDeleted, onCancel }: PolicyEditorProps) {
  const [name, setName] = useState(policy?.name ?? '')
  const [description, setDescription] = useState(policy?.description ?? '')
  const [firstResponse, setFirstResponse] = useState<number>(policy?.first_response_minutes ?? 60)
  const [resolution, setResolution] = useState<number>(policy?.resolution_minutes ?? 1440)
  const [businessHoursOnly, setBusinessHoursOnly] = useState<boolean>(
    policy?.business_hours_only ?? false
  )
  const [priorities, setPriorities] = useState<SupportTicketRecord['priority'][]>(
    policy?.applies_to_priorities ?? []
  )
  const [categories, setCategories] = useState<string[]>(policy?.applies_to_categories ?? [])
  const [availableCategories, setAvailableCategories] = useState<TicketCategoryRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!orgId) return
    listTicketCategories(orgId)
      .then(setAvailableCategories)
      .catch(() => setAvailableCategories([]))
  }, [orgId])

  if (mode === 'empty') {
    return (
      <aside className="flex h-fit items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-10 text-center">
        <p className="text-[12px] text-gray-500">Select a policy to edit, or create a new one.</p>
      </aside>
    )
  }

  const isNew = mode === 'new'

  function togglePriority(p: SupportTicketRecord['priority']) {
    setPriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }
  function toggleCategory(c: string) {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function handleSave() {
    if (!orgId) return
    if (!name.trim()) {
      toast.error('Policy needs a name.')
      return
    }
    if (firstResponse <= 0 || resolution <= 0) {
      toast.error('Targets must be positive numbers (in minutes).')
      return
    }
    const payload: SlaPolicyCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      first_response_minutes: firstResponse,
      resolution_minutes: resolution,
      business_hours_only: businessHoursOnly,
      applies_to_priorities: priorities.length > 0 ? priorities : undefined,
      applies_to_categories: categories.length > 0 ? categories : undefined,
    }
    setSaving(true)
    try {
      const saved = isNew
        ? await createSlaPolicy(orgId, payload)
        : await updateSlaPolicy(orgId, policy!.sla_policy_id, payload)
      toast.success(isNew ? 'Policy created' : 'Policy updated')
      await onSaved(saved)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!orgId || !policy) return
    if (!window.confirm(`Delete policy "${policy.name}"? Tickets stop being measured against it.`))
      return
    setDeleting(true)
    try {
      await deleteSlaPolicy(orgId, policy.sla_policy_id)
      toast.success('Policy deleted')
      await onDeleted()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <aside className="h-fit rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900">
          {isNew ? 'New SLA policy' : `Edit “${policy?.name ?? ''}”`}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Close editor"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Default SLA"
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
          />
        </Field>
        <Field label="Description" hint="Optional. For other operators.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Used when no tighter policy applies."
            className="w-full resize-none rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label="First response" hint="minutes">
            <input
              type="number"
              min={1}
              value={firstResponse}
              onChange={(e) => setFirstResponse(Number(e.target.value))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-mono text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
            />
          </Field>
          <Field label="Resolution" hint="minutes">
            <input
              type="number"
              min={1}
              value={resolution}
              onChange={(e) => setResolution(Number(e.target.value))}
              className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 font-mono text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
            />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-[12px] text-gray-700">
          <input
            type="checkbox"
            checked={businessHoursOnly}
            onChange={(e) => setBusinessHoursOnly(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-[#020308] focus:ring-[#020308]"
          />
          <span>
            Count only business hours
            <span className="block text-[11px] text-gray-400">
              Pause the clock outside the org's configured hours.
            </span>
          </span>
        </label>

        <Field label="Applies to priorities" hint="Leave empty to apply to all priorities.">
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => {
              const active = priorities.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePriority(p)}
                  className={cn(
                    'rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize transition',
                    active
                      ? 'border-[#020308] bg-[#020308] text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </Field>

        <Field label="Applies to categories" hint="Leave empty to apply to all categories.">
          {availableCategories.length === 0 ? (
            <p className="text-[11px] text-gray-400">
              No categories defined yet — the policy will apply to all.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {availableCategories.map((c) => {
                const active = categories.includes(c.category)
                return (
                  <button
                    key={c.category}
                    type="button"
                    onClick={() => toggleCategory(c.category)}
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-[11px] font-semibold transition',
                      active
                        ? 'border-[#020308] bg-[#020308] text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    )}
                    title={c.description}
                  >
                    {c.label}
                  </button>
                )
              })}
            </div>
          )}
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {!isNew && policy ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting || saving}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-2.5 py-1 text-[12px] text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || deleting}
            className="rounded-md bg-[#020308] px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : isNew ? 'Create policy' : 'Save changes'}
          </button>
        </div>
      </div>
    </aside>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </span>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-0.5 text-[11px] text-gray-400">{hint}</p>}
    </label>
  )
}

function formatMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return '—'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min - h * 60
  if (h < 24) return m > 0 ? `${h}h ${m}m` : `${h}h`
  const d = Math.floor(h / 24)
  const rh = h - d * 24
  return rh > 0 ? `${d}d ${rh}h` : `${d}d`
}

export { SupportSlaPoliciesPage }
