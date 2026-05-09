import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  createSupportCustomer,
  type CustomerProfile,
  type CustomerTier,
} from '@/services/api/support-api'
import { cn } from '@/lib'

function tierBadgeClass(tier: CustomerTier): string {
  switch (tier) {
    case 'vip':
      return 'bg-purple-100 text-purple-700'
    case 'enterprise':
      return 'bg-indigo-100 text-indigo-700'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function SupportCustomersPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportCustomersPanel />
      </div>
    </div>
  )
}

function SupportCustomersPanel() {
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { customers, customersLoading, loadCustomers, deleteCustomer } = useSupportStore()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<CustomerProfile | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    tier: 'standard' as CustomerTier,
  })

  useEffect(() => {
    if (!currentOrgId) return
    loadCustomers(currentOrgId)
  }, [currentOrgId, loadCustomers])

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q)
    )
  }, [customers, search])

  const handleCreate = useCallback(async () => {
    if (!currentOrgId || !form.name.trim() || !form.email.trim()) return
    setCreating(true)
    try {
      await createSupportCustomer(currentOrgId, {
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim() || undefined,
        tier: form.tier,
      })
      setForm({ name: '', email: '', company: '', tier: 'standard' })
      setShowCreate(false)
      toast.success('Customer created')
      loadCustomers(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create customer')
    } finally {
      setCreating(false)
    }
  }, [currentOrgId, form, loadCustomers])

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

  return (
    <>
      {/* Action bar */}
      <div className="mb-4 flex items-center justify-end">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#312e81] transition"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or company…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
        />
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="mb-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">New Customer</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Name"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
            />
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="Email"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
            />
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              placeholder="Company (optional)"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
            />
            <select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as CustomerTier }))}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
            >
              <option value="standard">Standard</option>
              <option value="vip">VIP</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim() || !form.email.trim()}
              className="rounded-xl bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Customer list */}
      {customersLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
          <UserGroupIcon className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-400">No customers yet</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3 text-right">Conversations</th>
                <th className="px-4 py-3 text-right">Escalations</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.customer_id}
                  onClick={() => navigate(`/support/customers/${c.customer_id}`)}
                  className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.company ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                        tierBadgeClass(c.tier)
                      )}
                    >
                      {c.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {c.total_conversations}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-700">
                    {c.total_escalations}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setCustomerToDelete(c)
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      title={`Delete ${c.name}`}
                      aria-label={`Delete ${c.name}`}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
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
    </>
  )
}

export { SupportCustomersPage, SupportCustomersPanel }
