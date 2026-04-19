import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  BookOpenIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  LinkIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline'
import { cn } from '@/lib'
import { useOrgStore } from '@/app/store'

import { DocumentsPanel } from './kb/DocumentsPanel'
import { ConnectedSourcesPanel } from './kb/ConnectedSourcesPanel'
import { CrawlPanel } from './kb/CrawlPanel'
import { QueryPanel } from './kb/QueryPanel'

const TABS = [
  {
    key: 'documents',
    label: 'Documents',
    icon: DocumentTextIcon,
    docsUrl: 'https://docs.liraintelligence.com/knowledge-base/documents',
  },
  {
    key: 'sources',
    label: 'Connected Sources',
    icon: LinkIcon,
    docsUrl: 'https://docs.liraintelligence.com/knowledge-base/connected-sources',
  },
  {
    key: 'web',
    label: 'Web Sources',
    icon: GlobeAltIcon,
    docsUrl: 'https://docs.liraintelligence.com/knowledge-base/web-sources',
  },
  {
    key: 'query',
    label: 'Query',
    icon: SparklesIcon,
    docsUrl: 'https://docs.liraintelligence.com/knowledge-base/query',
  },
] as const

type TabKey = (typeof TABS)[number]['key']

function KnowledgeBasePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentOrgId, organizations } = useOrgStore()
  const currentOrg = organizations.find((o) => o.org_id === currentOrgId)
  const description = currentOrg?.profile?.description

  const activeTab = (TABS.find((t) => t.key === searchParams.get('tab'))?.key ??
    'documents') as TabKey

  function setTab(key: TabKey) {
    setSearchParams({ tab: key }, { replace: true })
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Settings
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Knowledge Base</h1>
            <p className="mt-1 text-sm text-gray-400">
              Build Lira&rsquo;s knowledge from your documents, websites, and connected sources
            </p>
          </div>
          <a
            href={
              TABS.find((t) => t.key === activeTab)?.docsUrl ??
              'https://docs.liraintelligence.com/knowledge-base'
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
        </div>

        {/* Tab bar */}
        {/* Org description card */}
        <div className="mb-5 rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <BuildingOfficeIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#3730a3]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Organization description
                </p>
                {description ? (
                  <p className="mt-1 text-sm text-gray-700 leading-relaxed">{description}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400 italic">
                    No description added yet. Add one in Org Settings so Lira knows what your
                    organization does.
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => navigate('/org/settings')}
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
            >
              <PencilSquareIcon className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setTab(tab.key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive
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
        {activeTab === 'documents' && <DocumentsPanel />}
        {activeTab === 'sources' && <ConnectedSourcesPanel />}
        {activeTab === 'web' && <CrawlPanel />}
        {activeTab === 'query' && <QueryPanel />}
      </div>
    </div>
  )
}

export { KnowledgeBasePage }
