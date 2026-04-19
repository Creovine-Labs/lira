import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BoltIcon, ClockIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  createTrigger,
  updateTrigger,
  deleteTrigger,
  type ProactiveTrigger,
  type TriggerCondition,
} from '@/services/api/support-api'
import { cn } from '@/lib'

const TABS = [
  { key: 'triggers', label: 'Triggers', icon: BoltIcon },
  { key: 'activity', label: 'Activity Log', icon: ClockIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportProactivePage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportProactivePanel />
      </div>
    </div>
  )
}

function SupportProactivePanel() {
  const [activeTab, setProactiveTab] = useState<TabKey>('triggers')
  const { currentOrgId } = useOrgStore()
  const { triggers, triggersLoading, loadTriggers, outreachLogs, loadOutreachLogs } =
    useSupportStore()
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    event_type: '',
    outreach_template: '',
    channel: 'email' as 'email' | 'voice',
    cooldown_hours: 24,
    max_per_customer_per_day: 1,
    conditions: [] as TriggerCondition[],
  })

  useEffect(() => {
    if (!currentOrgId) return
    loadTriggers(currentOrgId)
    loadOutreachLogs(currentOrgId)
  }, [currentOrgId, loadTriggers, loadOutreachLogs])

  const handleCreate = useCallback(async () => {
    if (!currentOrgId || !form.name.trim() || !form.event_type.trim()) return
    setCreating(true)
    try {
      await createTrigger(currentOrgId, {
        name: form.name.trim(),
        event_type: form.event_type.trim(),
        outreach_template: form.outreach_template.trim(),
        channel: form.channel,
        cooldown_hours: form.cooldown_hours,
        max_per_customer_per_day: form.max_per_customer_per_day,
        conditions: form.conditions,
        enabled: true,
      })
      setForm({
        name: '',
        event_type: '',
        outreach_template: '',
        channel: 'email',
        cooldown_hours: 24,
        max_per_customer_per_day: 1,
        conditions: [],
      })
      setShowCreate(false)
      toast.success('Trigger created')
      loadTriggers(currentOrgId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trigger')
    } finally {
      setCreating(false)
    }
  }, [currentOrgId, form, loadTriggers])

  const handleToggle = useCallback(
    async (trigger: ProactiveTrigger) => {
      if (!currentOrgId) return
      try {
        await updateTrigger(currentOrgId, trigger.trigger_id, {
          enabled: !trigger.enabled,
        })
        loadTriggers(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update')
      }
    },
    [currentOrgId, loadTriggers]
  )

  const handleDelete = useCallback(
    async (triggerId: string) => {
      if (!currentOrgId) return
      try {
        await deleteTrigger(currentOrgId, triggerId)
        toast.success('Trigger deleted')
        loadTriggers(currentOrgId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    },
    [currentOrgId, loadTriggers]
  )

  return (
    <>
      {/* Action bar */}
      {activeTab === 'triggers' && (
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#312e81] transition"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New Trigger
          </button>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setProactiveTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#3730a3] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Create trigger form */}
      {showCreate && (
        <div className="mb-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-gray-900">New Trigger</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="trigger-name"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Trigger Name
                </label>
                <input
                  id="trigger-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Payment Failed Alert"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="trigger-event-type"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Event Type
                </label>
                <input
                  id="trigger-event-type"
                  type="text"
                  value={form.event_type}
                  onChange={(e) => setForm((f) => ({ ...f, event_type: e.target.value }))}
                  placeholder="payment.failed"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="trigger-template"
                className="mb-1 block text-xs font-semibold text-gray-500"
              >
                Message Template
              </label>
              <textarea
                id="trigger-template"
                value={form.outreach_template}
                onChange={(e) => setForm((f) => ({ ...f, outreach_template: e.target.value }))}
                rows={3}
                placeholder={'Hi {{customer.name}}, we noticed your payment failed…'}
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="trigger-channel"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Channel
                </label>
                <select
                  id="trigger-channel"
                  value={form.channel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, channel: e.target.value as 'email' | 'voice' }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                >
                  <option value="email">Email</option>
                  <option value="voice">Voice</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="trigger-cooldown"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Cooldown (hrs)
                </label>
                <input
                  id="trigger-cooldown"
                  type="number"
                  min={1}
                  value={form.cooldown_hours}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, cooldown_hours: Number(e.target.value) }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="trigger-max-day"
                  className="mb-1 block text-xs font-semibold text-gray-500"
                >
                  Max/Day
                </label>
                <input
                  id="trigger-max-day"
                  type="number"
                  min={1}
                  value={form.max_per_customer_per_day}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      max_per_customer_per_day: Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.name.trim() || !form.event_type.trim()}
              className="rounded-xl bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#312e81] disabled:opacity-50 transition"
            >
              {creating ? 'Creating…' : 'Create Trigger'}
            </button>
          </div>
        </div>
      )}

      {/* Triggers list */}
      {activeTab === 'triggers' && (
        <>
          {triggersLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
            </div>
          ) : triggers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
              <BoltIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No triggers configured</p>
              <p className="mt-1 text-xs text-gray-300">
                Create a trigger to proactively reach out to customers
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {triggers.map((trigger) => (
                <div
                  key={trigger.trigger_id}
                  className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-xl',
                        trigger.enabled ? 'bg-green-100' : 'bg-gray-100'
                      )}
                    >
                      <BoltIcon
                        className={cn(
                          'h-4 w-4',
                          trigger.enabled ? 'text-green-600' : 'text-gray-400'
                        )}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">{trigger.name}</p>
                      <p className="text-xs text-gray-400">
                        Event: <code className="text-gray-500">{trigger.event_type}</code> ·
                        Channel: {trigger.channel} · Cooldown: {trigger.cooldown_hours}h
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={() => handleToggle(trigger)}
                        className={cn(
                          'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase transition',
                          trigger.enabled
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        )}
                      >
                        {trigger.enabled ? 'On' : 'Off'}
                      </button>
                      <button
                        onClick={() => handleDelete(trigger.trigger_id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Activity log */}
      {activeTab === 'activity' && (
        <>
          {outreachLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
              <ClockIcon className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">No outreach activity yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3">Trigger</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {outreachLogs.map((log) => (
                    <tr key={log.outreach_id} className="border-b border-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-700">
                        {log.trigger_name ?? log.trigger_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {log.customer_name ?? log.customer_id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{log.channel}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                            log.status === 'sent' || log.status === 'delivered'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          )}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  )
}

export { SupportProactivePage, SupportProactivePanel }
