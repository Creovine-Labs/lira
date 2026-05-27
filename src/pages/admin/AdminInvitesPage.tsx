import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  PlusIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  NoSymbolIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import {
  adminCreateInvite,
  adminDeleteInvite,
  adminListInvites,
  adminRevokeInvite,
  type InviteStatus,
  type InvitePlanTier,
  type InviteSurfaceHint,
} from '@/services/api'

/**
 * Concierge-onboarding invite manager. A Lira admin generates an invite
 * after a sales call with a prospect, then sends the URL via WhatsApp /
 * email. The prospect uses it to sign up (Google or email/password).
 *
 * Public signup is gated server-side, so this page is the only path to
 * create a new customer org.
 */
export function AdminInvitesPage() {
  const [invites, setInvites] = useState<InviteStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setInvites(await adminListInvites(200))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load invites')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleRevoke = async (id: string, company: string | null) => {
    if (
      !confirm(
        `Revoke the invite for ${company ?? 'this prospect'}? They will no longer be able to sign up with this link.`
      )
    )
      return
    try {
      await adminRevokeInvite(id)
      toast.success('Invite revoked')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to revoke')
    }
  }

  const handleDelete = async (invite: InviteStatus) => {
    if (invite.state === 'active') {
      toast.error('Revoke active invites before deleting them')
      return
    }
    if (
      !confirm(
        `Delete the ${invite.state} invite for ${invite.prospectCompany ?? 'this prospect'}? This removes it from the admin list permanently.`
      )
    )
      return
    try {
      await adminDeleteInvite(invite.id)
      toast.success('Invite deleted')
      void load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete invite')
    }
  }

  const stats = {
    active: invites.filter((i) => i.state === 'active').length,
    used: invites.filter((i) => i.state === 'used').length,
    expired: invites.filter((i) => i.state === 'expired').length,
    revoked: invites.filter((i) => i.state === 'revoked').length,
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Invites</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Generate a concierge-onboarding link for a prospect after a sales call. They use it to
            sign up for the first time. Expired and used invites stay here for audit until you
            delete them.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" /> New invite
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Active" value={stats.active} tone="emerald" />
        <StatCard label="Used" value={stats.used} tone="slate" />
        <StatCard label="Expired" value={stats.expired} tone="amber" />
        <StatCard label="Revoked" value={stats.revoked} tone="rose" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : invites.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  No invites yet. Click <strong>New invite</strong> to create the first one.
                </td>
              </tr>
            ) : (
              invites.map((inv) => (
                <InviteRow
                  key={inv.id}
                  invite={inv}
                  onRevoke={handleRevoke}
                  onDelete={handleDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <CreateInviteModal
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            void load()
          }}
        />
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'emerald' | 'slate' | 'amber' | 'rose'
}) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
  }[tone]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-2xl font-bold text-slate-950">{value}</div>
      <div
        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}
      >
        {label}
      </div>
    </div>
  )
}

function StateBadge({ state }: { state: InviteStatus['state'] }) {
  const map = {
    active: { icon: CheckCircleIcon, cls: 'bg-emerald-50 text-emerald-700', label: 'active' },
    used: { icon: CheckCircleIcon, cls: 'bg-slate-100 text-slate-600', label: 'used' },
    expired: { icon: ClockIcon, cls: 'bg-amber-50 text-amber-700', label: 'expired' },
    revoked: { icon: NoSymbolIcon, cls: 'bg-rose-50 text-rose-700', label: 'revoked' },
  }
  const { icon: Icon, cls, label } = map[state]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function InviteRow({
  invite,
  onRevoke,
  onDelete,
}: {
  invite: InviteStatus
  onRevoke: (id: string, company: string | null) => void
  onDelete: (invite: InviteStatus) => void
}) {
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(invite.url)
      toast.success('Invite URL copied')
    } catch {
      toast.error('Copy failed — select the URL manually')
    }
  }

  return (
    <tr className={invite.state === 'active' ? '' : 'opacity-60'}>
      <td className="px-4 py-3 align-top">
        <div className="font-medium text-slate-950">{invite.prospectCompany ?? '—'}</div>
        {invite.prospectEmail && (
          <div className="text-xs text-slate-500">{invite.prospectEmail}</div>
        )}
        {invite.notes && <div className="mt-1 text-xs text-slate-400">{invite.notes}</div>}
      </td>
      <td className="px-4 py-3 align-top">
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
          {invite.planTier}
        </span>
        {invite.surfaceHint && (
          <span className="ml-1 text-[11px] text-slate-400">· {invite.surfaceHint}</span>
        )}
      </td>
      <td className="px-4 py-3 align-top">
        <code className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-700">
          {invite.code}
        </code>
      </td>
      <td className="px-4 py-3 align-top">
        <StateBadge state={invite.state} />
      </td>
      <td className="px-4 py-3 align-top text-xs text-slate-500">
        {new Date(invite.expiresAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right align-top">
        <div className="inline-flex gap-1">
          {invite.state === 'active' && (
            <>
              <button
                type="button"
                onClick={copyUrl}
                title="Copy invite URL"
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:text-slate-950"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRevoke(invite.id, invite.prospectCompany)}
                title="Revoke"
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-rose-600 transition hover:border-rose-300"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            </>
          )}
          {invite.state === 'used' && (
            <span className="text-[11px] text-slate-400">
              {invite.usedAt && new Date(invite.usedAt).toLocaleDateString()}
            </span>
          )}
          {invite.state !== 'active' && (
            <button
              type="button"
              onClick={() => onDelete(invite)}
              title="Delete invite"
              className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-500 transition hover:border-rose-300 hover:text-rose-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function CreateInviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [planTier, setPlanTier] = useState<InvitePlanTier>('STARTER')
  const [surfaceHint, setSurfaceHint] = useState<InviteSurfaceHint | ''>('')
  const [notes, setNotes] = useState('')
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [submitting, setSubmitting] = useState(false)
  const [createdInvite, setCreatedInvite] = useState<InviteStatus | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.trim()) return
    setSubmitting(true)
    try {
      const result = await adminCreateInvite({
        prospectCompany: company.trim(),
        prospectEmail: email.trim() || undefined,
        planTier,
        surfaceHint: surfaceHint || undefined,
        notes: notes.trim() || undefined,
        expiresInDays,
      })
      setCreatedInvite(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invite')
    } finally {
      setSubmitting(false)
    }
  }

  const copyUrl = async () => {
    if (!createdInvite) return
    try {
      await navigator.clipboard.writeText(createdInvite.url)
      toast.success('Invite URL copied — paste into WhatsApp / email')
    } catch {
      toast.error('Copy failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {createdInvite ? (
          <div className="p-6">
            <div className="mb-1 flex items-center gap-2 text-emerald-700">
              <CheckCircleIcon className="h-5 w-5" />
              <h2 className="text-lg font-bold">Invite created</h2>
            </div>
            <p className="mb-4 text-sm text-slate-500">
              Send this URL to <strong>{createdInvite.prospectCompany}</strong>. They&apos;ll use it
              to sign up. Valid for {expiresInDays} days.
            </p>
            <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="break-all font-mono text-xs text-slate-700">{createdInvite.url}</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyUrl}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                <ClipboardDocumentIcon className="h-4 w-4" /> Copy URL
              </button>
              <button
                type="button"
                onClick={onCreated}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-950"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">New invite</h2>
                <p className="text-xs text-slate-500">
                  Sent to a single prospect after a sales call.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700"
                aria-label="Close"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Company *">
                <input
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Bank"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Field>
              <Field label="Prospect email (optional, for tracking)">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@acmebank.com"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan tier">
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as InvitePlanTier)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </Field>
                <Field label="Surface (hint)">
                  <select
                    value={surfaceHint}
                    onChange={(e) => setSurfaceHint(e.target.value as InviteSurfaceHint | '')}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  >
                    <option value="">— Any —</option>
                    <option value="WEB">Web</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="BOTH">Both</option>
                  </select>
                </Field>
              </div>
              <Field label="Expires in (days)">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Field>
              <Field label="Notes (internal)">
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Discussed via WhatsApp, integration call Friday"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-950"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !company.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PlusIcon className="h-4 w-4" />
                )}
                Create invite
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
