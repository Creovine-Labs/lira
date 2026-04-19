import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { sendProactiveMessage } from '@/services/api/support-api'
import { cn } from '@/lib'

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'conversations', label: 'Conversations' },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportCustomerDetailPage() {
  const navigate = useNavigate()
  const { id: customerId } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (TABS.find((t) => t.key === searchParams.get('tab'))?.key ??
    'profile') as TabKey
  const { currentOrgId } = useOrgStore()
  const {
    selectedCustomer: customer,
    customerLoading,
    loadCustomer,
    updateCustomer,
    customerConversations,
    customerConversationsLoading,
    loadCustomerConversations,
  } = useSupportStore()

  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [saving, setSaving] = useState(false)

  // Proactive message dialog
  const [showSendMsg, setShowSendMsg] = useState(false)
  const [proactiveMsg, setProactiveMsg] = useState('')
  const [proactiveSubject, setProactiveSubject] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)

  useEffect(() => {
    if (!currentOrgId || !customerId) return
    loadCustomer(currentOrgId, customerId)
  }, [currentOrgId, customerId, loadCustomer])

  useEffect(() => {
    if (customer) {
      setEditForm({
        name: customer.name ?? '',
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        company: customer.company ?? '',
      })
    }
  }, [customer])

  useEffect(() => {
    if (!currentOrgId || !customerId || activeTab !== 'conversations') return
    loadCustomerConversations(currentOrgId, customerId)
  }, [currentOrgId, customerId, activeTab, loadCustomerConversations])

  const handleSaveEdit = useCallback(async () => {
    if (!currentOrgId || !customerId) return
    setSaving(true)
    try {
      const updates: Record<string, string> = {}
      if (editForm.name.trim()) updates.name = editForm.name.trim()
      if (editForm.email.trim()) updates.email = editForm.email.trim()
      if (editForm.phone.trim()) updates.phone = editForm.phone.trim()
      if (editForm.company.trim()) updates.company = editForm.company.trim()
      await updateCustomer(currentOrgId, customerId, updates)
      setEditing(false)
      toast.success('Customer updated')
    } catch {
      toast.error('Failed to update customer')
    } finally {
      setSaving(false)
    }
  }, [currentOrgId, customerId, editForm, updateCustomer])

  const handleSendProactive = useCallback(async () => {
    if (!currentOrgId || !customerId || !proactiveMsg.trim()) return
    setSendingMsg(true)
    try {
      const conv = await sendProactiveMessage(
        currentOrgId,
        customerId,
        proactiveMsg.trim(),
        proactiveSubject.trim() || undefined
      )
      toast.success('Message sent')
      setShowSendMsg(false)
      setProactiveMsg('')
      setProactiveSubject('')
      // Refresh conversations list and navigate to the conversation
      await loadCustomerConversations(currentOrgId, customerId)
      navigate(`/support/inbox/${conv.conv_id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send message'
      toast.error(msg)
    } finally {
      setSendingMsg(false)
    }
  }, [
    currentOrgId,
    customerId,
    proactiveMsg,
    proactiveSubject,
    loadCustomerConversations,
    navigate,
  ])

  if (customerLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="text-center">
          <p className="text-sm text-gray-500">Customer not found.</p>
          <button
            onClick={() => navigate('/support/customers')}
            className="mt-3 text-xs text-[#3730a3] underline"
          >
            Back to customers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Back + Header */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate('/support/customers')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white hover:text-gray-600 transition"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">{customer.name}</h1>
              <p className="text-xs text-gray-400">{customer.email}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSearchParams({ tab: tab.key }, { replace: true })}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#3730a3] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-700">Profile</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm({
                        name: customer.name ?? '',
                        email: customer.email ?? '',
                        phone: customer.phone ?? '',
                        company: customer.company ?? '',
                      })
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
                  >
                    <XMarkIcon className="h-3 w-3" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#3730a3] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
                  >
                    <CheckIcon className="h-3 w-3" />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <EditField
                  label="Name"
                  value={editForm.name}
                  onChange={(v) => setEditForm((f) => ({ ...f, name: v }))}
                />
                <EditField
                  label="Email"
                  value={editForm.email}
                  onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
                  type="email"
                />
                <EditField
                  label="Phone"
                  value={editForm.phone}
                  onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
                />
                <EditField
                  label="Company"
                  value={editForm.company}
                  onChange={(v) => setEditForm((f) => ({ ...f, company: v }))}
                />
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" value={customer.name} />
                <Field label="Email" value={customer.email} />
                <Field label="Phone" value={customer.phone ?? '—'} />
                <Field label="Company" value={customer.company ?? '—'} />
                <Field label="Tier" value={customer.tier} />
                <Field label="Total Conversations" value={String(customer.total_conversations)} />
                <Field label="Total Escalations" value={String(customer.total_escalations)} />
                <Field
                  label="Last Contacted"
                  value={
                    customer.last_contacted_at
                      ? new Date(customer.last_contacted_at).toLocaleDateString()
                      : '—'
                  }
                />
                {customer.hubspot_contact_id && (
                  <Field label="HubSpot ID" value={customer.hubspot_contact_id} />
                )}
                {customer.salesforce_contact_id && (
                  <Field label="Salesforce ID" value={customer.salesforce_contact_id} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Conversations tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-2">
            {/* Send message button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowSendMsg(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#312e81] transition"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                Start Conversation
              </button>
            </div>

            {customerConversationsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-white/60 bg-white py-16 shadow-sm">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
              </div>
            ) : customerConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16 shadow-sm">
                <ChatBubbleLeftEllipsisIcon className="mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No conversations yet</p>
                <p className="mt-1 text-xs text-gray-300">Send a message to start one</p>
              </div>
            ) : (
              customerConversations.map((conv) => (
                <button
                  key={conv.conv_id}
                  onClick={() => navigate(`/support/inbox/${conv.conv_id}`)}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/60 bg-white p-4 text-left shadow-sm hover:shadow-md transition"
                >
                  <ChatBubbleLeftEllipsisIcon className="h-5 w-5 shrink-0 text-gray-300" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {conv.display_id && (
                        <span className="text-[10px] font-bold text-gray-300">
                          #{conv.display_id}
                        </span>
                      )}
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {conv.subject ?? conv.intent ?? 'Conversation'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(conv.created_at).toLocaleDateString()} · {conv.messages.length}{' '}
                      messages
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                      conv.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : conv.status === 'escalated'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {conv.status}
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Send Proactive Message Modal */}
        {showSendMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Start Conversation</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Send a message to {customer.name}
                    {customer.email
                      ? ` · will also email ${customer.email}`
                      : ' · no email on file, will deliver via widget if online'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSendMsg(false)
                    setProactiveMsg('')
                    setProactiveSubject('')
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 transition"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Subject{' '}
                    {!customer.email && <span className="normal-case font-normal">(optional)</span>}
                  </label>
                  <input
                    type="text"
                    value={proactiveSubject}
                    onChange={(e) => setProactiveSubject(e.target.value)}
                    placeholder="e.g. Update on your request"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="proactive-message"
                    className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
                  >
                    Message
                  </label>
                  <textarea
                    id="proactive-message"
                    value={proactiveMsg}
                    onChange={(e) => setProactiveMsg(e.target.value)}
                    rows={5}
                    placeholder="Write your message here…"
                    className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3] resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => {
                    setShowSendMsg(false)
                    setProactiveMsg('')
                    setProactiveSubject('')
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendProactive}
                  disabled={sendingMsg || !proactiveMsg.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#3730a3] px-4 py-2 text-sm font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {sendingMsg ? 'Sending…' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-gray-800">{value}</p>
    </div>
  )
}

function EditField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#3730a3] focus:outline-none focus:ring-1 focus:ring-[#3730a3]"
        placeholder={label}
      />
    </div>
  )
}

export { SupportCustomerDetailPage }
