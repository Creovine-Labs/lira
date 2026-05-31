// /support/queues — Queues CRUD (Phase 4 §1.2).
//
// Operator-only surface. Single-pane list with inline editor — clicking a
// queue opens the edit form on the right; "+ New queue" slot opens an
// empty form. Members are managed as a comma-separated user-id list to
// avoid the dependency on an org-members picker (the same shortcut
// `TicketPropertyControls` uses for the assignee field). When the org-
// members endpoint is wired we can swap to a chip-picker without
// changing the API surface.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PlusIcon, TrashIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import {
  createQueue,
  deleteQueue,
  listQueues,
  updateQueue,
  type QueueAssignmentMode,
  type QueueCreatePayload,
  type SupportQueue,
} from '@/services/api/support-api'
import { cn } from '@/lib'

const ASSIGNMENT_MODES: { value: QueueAssignmentMode; label: string; hint: string }[] = [
  {
    value: 'round_robin',
    label: 'Round robin',
    hint: 'Assigns sequentially across the queue members.',
  },
  {
    value: 'least_loaded',
    label: 'Least loaded',
    hint: 'Assigns to whoever has the fewest open tickets.',
  },
  {
    value: 'manual',
    label: 'Manual',
    hint: 'No auto-assign — the team picks up tickets from the queue.',
  },
]

function SupportQueuesPage() {
  const { currentOrgId } = useOrgStore()
  const [queues, setQueues] = useState<SupportQueue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null)

  const load = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      setQueues(await listQueues(currentOrgId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load queues')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(() => {
    if (selectedId === null || selectedId === 'new') return null
    return queues.find((q) => q.queue_id === selectedId) ?? null
  }, [selectedId, queues])

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Queues</h1>
            <p className="mt-1 max-w-xl text-sm text-gray-500">
              Group tickets into team queues. Choose how new tickets get assigned, and add the
              teammates who pick them up.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId('new')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            New queue
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <QueueList
            queues={queues}
            loading={loading}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onNew={() => setSelectedId('new')}
          />
          <QueueEditor
            key={selected?.queue_id ?? selectedId ?? 'none'}
            orgId={currentOrgId}
            mode={selectedId === 'new' ? 'new' : selected ? 'edit' : 'empty'}
            queue={selected}
            onSaved={async (q) => {
              await load()
              setSelectedId(q.queue_id)
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

function QueueList({
  queues,
  loading,
  selectedId,
  onSelect,
  onNew,
}: {
  queues: SupportQueue[]
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
  if (queues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16">
        <UsersIcon className="mb-3 h-9 w-9 text-gray-300" />
        <p className="text-sm font-semibold text-gray-500">No queues yet</p>
        <p className="mt-1 max-w-md text-center text-xs text-gray-400">
          Create a queue to start grouping tickets by team — billing, technical, VIP, etc.
        </p>
        <button
          type="button"
          onClick={onNew}
          className="mt-3 inline-flex items-center gap-1 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create your first queue
        </button>
      </div>
    )
  }
  return (
    <ul className="space-y-2">
      {queues.map((q) => {
        const isSelected = selectedId === q.queue_id
        return (
          <li key={q.queue_id}>
            <button
              type="button"
              onClick={() => onSelect(q.queue_id)}
              className={cn(
                'block w-full rounded-2xl border bg-white px-4 py-3 text-left shadow-sm transition',
                isSelected
                  ? 'border-[#020308] shadow-md'
                  : 'border-white/60 hover:border-gray-200 hover:shadow-md'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">{q.name}</p>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600">
                  {q.assignment_mode.replace('_', ' ')}
                </span>
              </div>
              {q.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{q.description}</p>
              )}
              <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-gray-400">
                <UsersIcon className="h-3 w-3" />
                {q.member_user_ids.length} member{q.member_user_ids.length === 1 ? '' : 's'}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

interface QueueEditorProps {
  orgId: string | null
  mode: 'new' | 'edit' | 'empty'
  queue: SupportQueue | null
  onSaved: (q: SupportQueue) => Promise<void>
  onDeleted: () => Promise<void>
  onCancel: () => void
}

function QueueEditor({ orgId, mode, queue, onSaved, onDeleted, onCancel }: QueueEditorProps) {
  const [name, setName] = useState(queue?.name ?? '')
  const [description, setDescription] = useState(queue?.description ?? '')
  const [assignmentMode, setAssignmentMode] = useState<QueueAssignmentMode>(
    queue?.assignment_mode ?? 'round_robin'
  )
  const [members, setMembers] = useState<string[]>(queue?.member_user_ids ?? [])
  const [newMember, setNewMember] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (mode === 'empty') {
    return (
      <aside className="flex h-fit items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 px-4 py-10 text-center">
        <p className="text-[12px] text-gray-500">Select a queue to edit, or create a new one.</p>
      </aside>
    )
  }

  const isNew = mode === 'new'

  async function handleSave() {
    if (!orgId) return
    const payload: QueueCreatePayload = {
      name: name.trim(),
      description: description.trim() || undefined,
      assignment_mode: assignmentMode,
      member_user_ids: members,
    }
    if (!payload.name) {
      toast.error('Queue needs a name.')
      return
    }
    setSaving(true)
    try {
      const saved = isNew
        ? await createQueue(orgId, payload)
        : await updateQueue(orgId, queue!.queue_id, payload)
      toast.success(isNew ? 'Queue created' : 'Queue updated')
      await onSaved(saved)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!orgId || !queue) return
    if (!window.confirm(`Delete queue "${queue.name}"? Tickets in this queue become unrouted.`))
      return
    setDeleting(true)
    try {
      await deleteQueue(orgId, queue.queue_id)
      toast.success('Queue deleted')
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
          {isNew ? 'New queue' : `Edit “${queue?.name ?? ''}”`}
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
            placeholder="Billing"
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
          />
        </Field>
        <Field label="Description" hint="Optional. Shown to operators in pickers.">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Anything from invoice questions to refunds."
            className="w-full resize-none rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
          />
        </Field>
        <Field label="Assignment mode">
          <select
            value={assignmentMode}
            onChange={(e) => setAssignmentMode(e.target.value as QueueAssignmentMode)}
            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-[13px] text-gray-900 focus:border-[#020308] focus:outline-none"
          >
            {ASSIGNMENT_MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-gray-500">
            {ASSIGNMENT_MODES.find((m) => m.value === assignmentMode)?.hint}
          </p>
        </Field>
        <Field label="Members" hint="Paste user IDs, one per chip. Backend ignores duplicates.">
          <div className="flex flex-wrap gap-1.5 rounded-md border border-gray-200 bg-white p-1.5">
            {members.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[11px] text-gray-700"
              >
                {m}
                <button
                  type="button"
                  onClick={() => setMembers((prev) => prev.filter((x) => x !== m))}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label={`Remove ${m}`}
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  const v = newMember.trim().replace(/,$/, '')
                  if (v && !members.includes(v)) setMembers((prev) => [...prev, v])
                  setNewMember('')
                }
              }}
              onBlur={() => {
                const v = newMember.trim()
                if (v && !members.includes(v)) setMembers((prev) => [...prev, v])
                setNewMember('')
              }}
              placeholder={members.length === 0 ? 'user-id' : ''}
              className="min-w-[80px] flex-1 bg-transparent px-1 py-0.5 font-mono text-[11px] text-gray-700 placeholder:text-gray-300 focus:outline-none"
            />
          </div>
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {!isNew && queue ? (
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
            {saving ? 'Saving…' : isNew ? 'Create queue' : 'Save changes'}
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

export { SupportQueuesPage }
