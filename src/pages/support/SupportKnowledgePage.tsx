import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  BookOpenIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import { cn } from '@/lib'

const TABS = [
  { key: 'library', label: 'Library', icon: BookOpenIcon },
  { key: 'drafts', label: 'AI Drafts', icon: SparklesIcon },
  { key: 'gaps', label: 'Gaps', icon: DocumentTextIcon },
] as const

type TabKey = (typeof TABS)[number]['key']

function SupportKnowledgePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = (TABS.find((t) => t.key === searchParams.get('tab'))?.key ??
    'library') as TabKey
  const { currentOrgId } = useOrgStore()
  const { kbDrafts, kbDraftsLoading, loadKBDrafts, approveKBDraft, rejectKBDraft } =
    useSupportStore()
  const [editingDraft, setEditingDraft] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')

  useEffect(() => {
    if (!currentOrgId) return
    loadKBDrafts(currentOrgId)
  }, [currentOrgId, loadKBDrafts])

  function setTab(key: TabKey) {
    setSearchParams({ tab: key }, { replace: true })
  }

  const handleApprove = async (draftId: string) => {
    if (!currentOrgId) return
    try {
      const edits = editingDraft === draftId ? { title: editTitle, body: editBody } : undefined
      await approveKBDraft(currentOrgId, draftId, edits)
      setEditingDraft(null)
      toast.success('Draft approved and indexed')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handleReject = async (draftId: string) => {
    if (!currentOrgId) return
    try {
      await rejectKBDraft(currentOrgId, draftId)
      toast.success('Draft rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  const pendingDrafts = kbDrafts.filter((d) => d.status === 'pending_review')

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Knowledge</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage support-specific knowledge and review AI-generated draft entries
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-white/60 bg-white p-1 shadow-sm sm:flex sm:grid-cols-none">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const count = tab.key === 'drafts' ? pendingDrafts.length : 0
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
                {count > 0 && (
                  <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Library tab */}
        {activeTab === 'library' && (
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              Support uses the same knowledge base as the rest of Lira. Manage your documents and
              sources from the{' '}
              <a href="/org/knowledge" className="font-semibold text-[#3730a3] hover:underline">
                main Knowledge Base
              </a>
              .
            </p>
          </div>
        )}

        {/* AI Drafts tab */}
        {activeTab === 'drafts' && (
          <div className="space-y-3">
            {kbDraftsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3730a3] border-t-transparent" />
              </div>
            ) : pendingDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-white/60 bg-white py-16 shadow-sm">
                <SparklesIcon className="mb-3 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-400">No pending drafts</p>
                <p className="mt-1 text-xs text-gray-300">
                  When Lira can&rsquo;t answer a question, she&rsquo;ll draft a KB entry for your
                  review
                </p>
              </div>
            ) : (
              pendingDrafts.map((draft) => (
                <div
                  key={draft.draft_id}
                  className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm"
                >
                  {editingDraft === draft.draft_id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-[#3730a3] focus:outline-none"
                      />
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={6}
                        className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#3730a3] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-sm font-bold text-gray-900">{draft.title}</h3>
                      <p className="mt-1 text-xs text-gray-400">{draft.gap_description}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">{draft.body}</p>
                    </>
                  )}
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(draft.draft_id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100 transition"
                    >
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    {editingDraft !== draft.draft_id && (
                      <button
                        onClick={() => {
                          setEditingDraft(draft.draft_id)
                          setEditTitle(draft.title)
                          setEditBody(draft.body)
                        }}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => handleReject(draft.draft_id)}
                      className="inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <span className="ml-auto text-[10px] text-gray-300">
                      {new Date(draft.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Gaps tab */}
        {activeTab === 'gaps' && (
          <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">
              Knowledge gap analysis will be available after enough conversations have been
              processed. Gaps are identified when Lira escalates due to missing knowledge.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export { SupportKnowledgePage }
