import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useKBStore } from '@/app/store'
import {
  listKBEntries,
  triggerCrawl,
  getCrawlStatus,
  deleteKBEntry,
  clearKnowledgeBase,
  getOrganization,
} from '@/services/api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/lib'

const CATEGORY_COLORS: Record<string, string> = {
  about: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  product: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  docs: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  blog: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function KnowledgeBasePage() {
  const { currentOrgId } = useOrgStore()
  const { entries, crawlStatus, loading, setEntries, setCrawlStatus, setLoading, removeEntry } =
    useKBStore()

  const [crawlUrl, setCrawlUrl] = useState('')
  const [maxPages, setMaxPages] = useState(20)
  const [crawling, setCrawling] = useState(false)
  const [crawlError, setCrawlError] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => Promise<void>
  } | null>(null)

  const loadData = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const [kbEntries, org] = await Promise.all([
        listKBEntries(currentOrgId),
        getOrganization(currentOrgId),
      ])
      setEntries(kbEntries)
      // Pre-fill crawl URL from org website if available
      if (!crawlUrl && org.profile?.website) {
        setCrawlUrl(org.profile.website)
      }
    } catch {
      toast.error('Failed to load knowledge base')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, setEntries, setLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData()
  }, [loadData])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [pollInterval])

  function startStatusPolling() {
    if (!currentOrgId) return
    const interval = setInterval(async () => {
      try {
        const status = await getCrawlStatus(currentOrgId)
        setCrawlStatus(status)
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
          setPollInterval(null)
          if (status.status === 'completed') {
            toast.success('Crawl completed!')
            loadData()
          } else {
            toast.error(`Crawl failed: ${status.error ?? 'Unknown error'}`)
          }
        }
      } catch {
        clearInterval(interval)
        setPollInterval(null)
      }
    }, 3000)
    setPollInterval(interval)
  }

  async function handleCrawl() {
    if (!currentOrgId || !crawlUrl.trim()) return
    setCrawling(true)
    setCrawlError(null)
    try {
      await triggerCrawl(currentOrgId, crawlUrl.trim(), { max_pages: maxPages })
      setCrawlStatus({ status: 'crawling', pages_crawled: 0 })
      toast.success('Crawl started!')
      startStatusPolling()
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Failed to start crawl'
      // Strip leading "400: " / "500: " prefix that apiFetch adds
      const msg = raw.replace(/^\d{3}:\s*/, '')
      setCrawlError(msg)
    } finally {
      setCrawling(false)
    }
  }

  async function handleDelete(entryId: string, entryTitle: string) {
    setConfirm({
      title: 'Delete Page',
      description: `Are you sure you want to delete "${entryTitle}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        if (!currentOrgId) return
        try {
          await deleteKBEntry(currentOrgId, entryId)
          removeEntry(entryId)
          toast.success('Entry deleted')
        } catch {
          toast.error('Failed to delete entry')
        }
      },
    })
  }

  async function handleClearAll() {
    if (!currentOrgId) return
    setConfirm({
      title: 'Clear Knowledge Base',
      description: `Are you sure you want to delete all ${entries.length} indexed page${entries.length !== 1 ? 's' : ''}? This cannot be undone.`,
      confirmLabel: 'Clear All',
      onConfirm: async () => {
        setClearing(true)
        try {
          await clearKnowledgeBase(currentOrgId)
          setEntries([])
          toast.success('Knowledge base cleared')
        } catch {
          toast.error('Failed to clear knowledge base')
        } finally {
          setClearing(false)
        }
      },
    })
  }

  const isCrawling = crawlStatus?.status === 'crawling'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ''}
        description={confirm?.description ?? ''}
        confirmLabel={confirm?.confirmLabel ?? 'Delete'}
        onConfirm={confirm?.onConfirm ?? (async () => {})}
        onClose={() => setConfirm(null)}
      />

      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <GlobeAltIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Knowledge Base</h1>
            <p className="text-sm text-gray-500">
              Crawl your website to build Lira's organizational knowledge
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Crawl form */}
        <section className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">Website Crawl</h2>

          {/* Crawl status banner */}
          {isCrawling && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <ArrowPathIcon className="h-5 w-5 animate-spin text-amber-500" />
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                  Crawling in progress…
                </p>
                {crawlStatus.pages_crawled != null && (
                  <p className="text-xs text-muted-foreground">
                    {crawlStatus.pages_crawled} pages crawled
                    {crawlStatus.total_pages ? ` of ~${crawlStatus.total_pages}` : ''}
                  </p>
                )}
              </div>
            </div>
          )}

          {crawlStatus?.status === 'completed' && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Last crawl completed — {crawlStatus.pages_crawled} pages indexed
              </p>
            </div>
          )}

          {/* Show discovered social links */}
          {crawlStatus?.social_links && crawlStatus.social_links.length > 0 && (
            <div className="mb-4 rounded-lg border border-violet-500/30 bg-violet-500/5 px-4 py-3">
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400 mb-2">
                Connected platforms discovered:
              </p>
              <div className="flex flex-wrap gap-2">
                {crawlStatus.social_links.map((link) => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 px-3 py-1 text-xs text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition"
                  >
                    {new URL(link).hostname.replace('www.', '')}
                  </a>
                ))}
              </div>
            </div>
          )}

          {crawlStatus?.status === 'failed' && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-500">{crawlStatus.error ?? 'Crawl failed'}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              className={`input-field flex-1 ${
                crawlError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/30' : ''
              }`}
              placeholder="https://example.com"
              value={crawlUrl}
              onChange={(e) => {
                setCrawlUrl(e.target.value)
                setCrawlError(null)
              }}
              disabled={isCrawling}
            />
            <div className="flex items-center gap-2">
              <label
                htmlFor="crawl-max-pages"
                className="text-xs text-muted-foreground whitespace-nowrap"
              >
                Max pages:
              </label>
              <input
                id="crawl-max-pages"
                type="number"
                className="input-field w-20"
                min={1}
                max={50}
                value={maxPages}
                onChange={(e) => setMaxPages(Math.min(50, Math.max(1, Number(e.target.value))))}
                disabled={isCrawling}
              />
            </div>
            <button
              onClick={handleCrawl}
              disabled={crawling || isCrawling || !crawlUrl.trim()}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
            >
              {crawling ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlassIcon className="h-4 w-4" />
              )}
              Crawl
            </button>
          </div>
          {crawlError && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400">
              <ExclamationCircleIcon className="h-3 w-3 shrink-0" />
              {crawlError}
            </p>
          )}
        </section>

        {/* Entries list */}
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Indexed Pages ({entries.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
              </button>
              {entries.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30"
                >
                  {clearing ? (
                    <ArrowPathIcon className="h-3 w-3 animate-spin" />
                  ) : (
                    <TrashIcon className="h-3 w-3" />
                  )}
                  Clear All
                </button>
              )}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <GlobeAltIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No pages indexed yet. Enter your website URL above to start.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-4 px-6 py-4">
                  <GlobeAltIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{entry.title}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-medium',
                          CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.other
                        )}
                      >
                        {entry.category}
                      </span>
                    </div>
                    {entry.summary && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {entry.summary}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      <a
                        href={entry.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        {entry.source_url}
                      </a>
                      <span>·</span>
                      <span>{entry.embedding_count} embeddings</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id, entry.title || entry.source_url)}
                    className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    title="Delete entry"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export { KnowledgeBasePage }
