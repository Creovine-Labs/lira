import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'

const TABS = [
  { key: 'pending', label: 'Approval Queue', icon: ClockIcon },
  { key: 'history', label: 'History', icon: CpuChipIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'approved':
      return 'bg-blue-100 text-blue-700'
    case 'executed':
      return 'bg-green-100 text-green-700'
    case 'failed':
      return 'bg-red-100 text-red-700'
    case 'rejected':
      return 'bg-gray-100 text-gray-600'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function SupportActionsPage() {
  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <SupportActionsPanel />
      </div>
    </div>
  )
}

function SupportActionsPanel() {
  const [activeTab, setActionsTab] = useState<TabKey>('pending')
  const { currentOrgId } = useOrgStore()
  const { actions, actionsLoading, loadActions, approveAction, rejectAction } = useSupportStore()

  useEffect(() => {
    if (!currentOrgId) return
    const status = activeTab === 'pending' ? 'pending' : undefined
    loadActions(currentOrgId, status)
  }, [currentOrgId, activeTab, loadActions])

  const handleApprove = async (actionId: string) => {
    if (!currentOrgId) return
    try {
      await approveAction(currentOrgId, actionId)
      toast.success('Action approved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handleReject = async (actionId: string) => {
    if (!currentOrgId) return
    try {
      await rejectAction(currentOrgId, actionId)
      toast.success('Action rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  const pendingCount = actions.filter((a) => a.status === 'pending').length

  return (
    <>
      {/* Sub-tabs */}
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const count = tab.key === 'pending' ? pendingCount : 0
          return (
            <button
              key={tab.key}
              onClick={() => setActionsTab(tab.key)}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                activeTab === tab.key
                  ? 'bg-[#3730a3] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
              {count > 0 && (
                <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {actionsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
        </div>
      ) : actions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-20 shadow-sm">
          <CpuChipIcon className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-400">
            {activeTab === 'pending' ? 'No pending actions' : 'No action history'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.action_id}
              className="rounded-2xl border border-white/60 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100">
                  <CpuChipIcon className="h-4 w-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {action.action_type.replace(/_/g, ' ')}
                    </p>
                    <span
                      className={cn(
                        'rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase',
                        statusBadge(action.status)
                      )}
                    >
                      {action.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Conversation: {action.conv_id.slice(0, 8)}… ·{' '}
                    {new Date(action.created_at).toLocaleString()}
                  </p>
                  {action.error && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-red-600">
                      <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      {action.error}
                    </div>
                  )}
                </div>

                {action.status === 'pending' && (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={() => handleApprove(action.action_id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(action.action_id)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export { SupportActionsPage, SupportActionsPanel }
