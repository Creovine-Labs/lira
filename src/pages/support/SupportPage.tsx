import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  InboxIcon,
  UserGroupIcon,
  CpuChipIcon,
  BoltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { SupportInboxPanel } from './SupportInboxPage'
import { SupportCustomersPanel } from './SupportCustomersPage'
import { SupportActionsPanel } from './SupportActionsPage'
import { SupportProactivePanel } from './SupportProactivePage'
import { SupportAnalyticsPanel } from './SupportAnalyticsPage'
import { SupportSettingsPanel } from './SupportSettingsPage'

const TABS = [
  { key: 'inbox', label: 'Inbox', icon: InboxIcon },
  { key: 'customers', label: 'Customers', icon: UserGroupIcon },
  { key: 'actions', label: 'Actions', icon: CpuChipIcon },
  { key: 'proactive', label: 'Proactive', icon: BoltIcon },
  { key: 'analytics', label: 'Analytics', icon: ChartBarIcon },
  { key: 'settings', label: 'Settings', icon: Cog6ToothIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentOrgId } = useOrgStore()
  const { config, configLoading } = useSupportStore()

  const activeTab = (TABS.find((t) => t.key === searchParams.get('tab'))?.key ?? 'inbox') as TabKey

  function setTab(key: TabKey) {
    setSearchParams({ tab: key }, { replace: true })
  }

  // Redirect to activate if support not activated
  useEffect(() => {
    if (!configLoading && (!config || !config.activated)) {
      navigate('/support/activate', { replace: true })
    }
  }, [config, configLoading, navigate])

  if (!currentOrgId || configLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#ebebeb]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Customer
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Support</h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage conversations, customers, and automated actions
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/platform/customer-support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
        </div>

        {/* Tab bar */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
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

        {/* Tab content */}
        {activeTab === 'inbox' && <SupportInboxPanel />}
        {activeTab === 'customers' && <SupportCustomersPanel />}
        {activeTab === 'actions' && <SupportActionsPanel />}
        {activeTab === 'proactive' && <SupportProactivePanel />}
        {activeTab === 'analytics' && <SupportAnalyticsPanel />}
        {activeTab === 'settings' && <SupportSettingsPanel />}
      </div>
    </div>
  )
}

export { SupportPage }
