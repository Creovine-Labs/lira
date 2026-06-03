import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BookOpenIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UserGroupIcon,
  UserIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  createSupportCustomer,
  type CustomerProfile,
  type CustomerTier,
} from '@/services/api/support-api'
import { cn } from '@/lib'
import { Pill, type PillTone } from './Pill'

/**
 * Customers — the workspace's people directory, in the same rail-led layout as
 * Inbox / Tickets: a left rail of tier views + add + roll-up stats, and a main
 * column with a toolbar (active view + search) and the customer list. Selecting
 * a row opens the existing detail page.
 */

type TierFilter = 'all' | CustomerTier

const TIER_VIEWS: { value: TierFilter; label: string; Icon: typeof UserIcon }[] = [
  { value: 'all', label: 'All customers', Icon: UserGroupIcon },
  { value: 'standard', label: 'Standard', Icon: UserIcon },
  { value: 'vip', label: 'VIP', Icon: StarIcon },
  { value: 'enterprise', label: 'Enterprise', Icon: BuildingOffice2Icon },
]

function tierMeta(tier: CustomerTier): { tone: PillTone; label: string } {
  switch (tier) {
    case 'vip':
      return { tone: 'brand', label: 'VIP' }
    case 'enterprise':
      return { tone: 'success', label: 'Enterprise' }
    default:
      return { tone: 'neutral', label: 'Standard' }
  }
}

// ── Page wrapper (activation guard) ───────────────────────────────────────────

function SupportCustomersPage() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()
  const loadStarted = useRef(false)

  useEffect(() => {
    if (configLoading) loadStarted.current = true
  }, [configLoading])

  useEffect(() => {
    if (!loadStarted.current) return
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
      </div>
    )
  }

  return <SupportCustomersPanel />
}

// ── Workspace ─────────────────────────────────────────────────────────────────

function SupportCustomersPanel() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { customers, customersLoading, loadCustomers, deleteCustomer } = useSupportStore()
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState<TierFilter>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!currentOrgId) return
    loadCustomers(currentOrgId)
  }, [currentOrgId, loadCustomers])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (tier !== 'all' && c.tier !== tier) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company?.toLowerCase().includes(q) ?? false)
      )
    })
  }, [customers, search, tier])

  const tierCount = (value: TierFilter): number =>
    value === 'all' ? customers.length : customers.filter((c) => c.tier === value).length

  const totals = useMemo(
    () => ({
      conversations: customers.reduce((s, c) => s + (c.total_conversations ?? 0), 0),
      escalations: customers.reduce((s, c) => s + (c.total_escalations ?? 0), 0),
    }),
    [customers]
  )

  const handleDelete = useCallback(async () => {
    if (!currentOrgId || !customerToDelete) return
    setDeleting(true)
    try {
      await deleteCustomer(currentOrgId, customerToDelete.customer_id)
      toast.success('Customer deleted')
      setCustomerToDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete customer')
    } finally {
      setDeleting(false)
    }
  }, [currentOrgId, customerToDelete, deleteCustomer])

  const activeLabel = TIER_VIEWS.find((v) => v.value === tier)?.label ?? 'All customers'

  return (
    <div className="flex h-full overflow-hidden bg-[#ebebeb]">
      {/* ── Left rail ─────────────────────────────────────────────────── */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#020308] text-white">
              <UserGroupIcon className="h-4 w-4" />
            </span>
            <h1 className="text-sm font-bold tracking-tight text-gray-900">Customers</h1>
          </div>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            title="Docs"
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <BookOpenIcon className="h-4 w-4" />
          </a>
        </div>

        <div className="px-3 pb-1 pt-1">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#020308] px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
          >
            <PlusIcon className="h-4 w-4" />
            Add customer
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2">
          <p className="px-2 pb-1 pt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Tiers
          </p>
          {TIER_VIEWS.map((v) => {
            const active = tier === v.value
            const count = tierCount(v.value)
            return (
              <button
                key={v.value}
                onClick={() => setTier(v.value)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] font-medium transition',
                  active ? 'bg-[#020308] text-white' : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <v.Icon
                  className={cn('h-4 w-4 shrink-0', active ? 'text-white' : 'text-gray-400')}
                />
                <span className="flex-1 truncate text-left">{v.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
                      active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        <div className="border-t border-gray-100 px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            <MiniStat label="Conversations" value={totals.conversations} />
            <MiniStat label="Escalations" value={totals.escalations} />
          </div>
        </div>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-base font-bold text-gray-900">{activeLabel}</h2>
              <span className="text-xs font-medium text-gray-400">{filtered.length}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search customers…"
                  className="w-40 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs focus:border-[#020308] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#020308] sm:w-56"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-gray-800 lg:hidden"
              >
                <PlusIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>

          {/* Mobile tier selector */}
          <div className="mt-2 flex gap-1 overflow-x-auto pb-0.5 lg:hidden">
            {TIER_VIEWS.map((v) => (
              <button
                key={v.value}
                onClick={() => setTier(v.value)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition',
                  tier === v.value ? 'bg-[#020308] text-white' : 'bg-gray-100 text-gray-500'
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {customersLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#020308] border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <UserGroupIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No customers here</p>
              <p className="mt-1 text-xs text-gray-300">Add a customer or pick another tier.</p>
            </div>
          ) : (
            <ul className="mx-auto max-w-4xl space-y-2">
              {filtered.map((c) => {
                const meta = tierMeta(c.tier)
                return (
                  <li key={c.customer_id}>
                    <button
                      onClick={() => navigate(`/support/customers/${c.customer_id}`)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 text-left shadow-sm transition hover:shadow-md"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                          <Pill tone={meta.tone} className="shrink-0 text-[10px]" uppercase>
                            {meta.label}
                          </Pill>
                        </div>
                        <p className="truncate text-xs text-gray-400">
                          {c.email}
                          {c.company ? ` · ${c.company}` : ''}
                        </p>
                      </div>
                      <div className="hidden shrink-0 items-center gap-4 text-[11px] text-gray-500 sm:flex">
                        <span className="inline-flex items-center gap-1" title="Conversations">
                          <ChatBubbleLeftRightIcon className="h-3.5 w-3.5 text-gray-400" />
                          {c.total_conversations ?? 0}
                        </span>
                        <span className="inline-flex items-center gap-1" title="Escalations">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5 text-gray-400" />
                          {c.total_escalations ?? 0}
                        </span>
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCustomerToDelete(c)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            setCustomerToDelete(c)
                          }
                        }}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title={`Delete ${c.name}`}
                        aria-label={`Delete ${c.name}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {showCreate && currentOrgId && (
        <CreateCustomerModal
          orgId={currentOrgId}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadCustomers(currentOrgId)
          }}
        />
      )}

      {customerToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setCustomerToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-bold text-gray-900">Delete customer?</h3>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              This removes {customerToDelete.name} from the customer list and clears visitor links
              for this profile. Existing conversations stay in the inbox for record keeping.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCustomerToDelete(null)}
                disabled={deleting}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-50 px-2.5 py-2">
      <p className="text-base font-bold leading-none text-gray-900">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </p>
    </div>
  )
}

// ── Create customer modal ─────────────────────────────────────────────────────

function CreateCustomerModal({
  orgId,
  onClose,
  onCreated,
}: {
  orgId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [tier, setTier] = useState<CustomerTier>('standard')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error('Name and email are required')
      return
    }
    setSaving(true)
    try {
      await createSupportCustomer(orgId, {
        name: name.trim(),
        email: email.trim(),
        company: company.trim() || undefined,
        tier,
      })
      toast.success('Customer created')
      onCreated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-5">
          <h2 className="text-center text-lg font-bold text-gray-900">New customer</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@acme.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </Field>
          <Field label="Company (optional)">
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme Inc."
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </Field>
          <Field label="Tier">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as CustomerTier)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            >
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </Field>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={saving || !name.trim() || !email.trim()}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#020308] py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <UserPlusIcon className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create customer'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}

export { SupportCustomersPage, SupportCustomersPanel }
