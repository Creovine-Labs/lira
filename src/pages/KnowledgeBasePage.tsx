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
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-6 w-40 animate-pulse rounded-xl bg-gray-300/60" />
          <div className="h-44 animate-pulse rounded-2xl bg-gray-400/30" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-300/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        <ConfirmDialog
          open={!!confirm}
          title={confirm?.title ?? ''}
          description={confirm?.description ?? ''}
          confirmLabel={confirm?.confirmLabel ?? 'Delete'}
          onConfirm={confirm?.onConfirm ?? (async () => {})}
          onClose={() => setConfirm(null)}
        />

        {/* ── Header ── */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Settings</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Knowledge Base</h1>
          <p className="mt-1 text-sm text-gray-400">
            Crawl your website to build Lira's organisational knowledge
          </p>
        </div>

        {/* ── Crawl hero (dark card) ── */}
        <div className="relative mb-5 overflow-hidden rounded-2xl bg-[#0f0f0f] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.04] to-transparent" />
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.06]" />

          <div className="relative">
            {/* Crawl status banners */}
            {isCrawling && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-400">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                <div>
                  <p className="font-semibold">Crawling in progress…</p>
                  {crawlStatus.pages_crawled != null && (
                    <p className="text-xs text-amber-400/60">
                      {crawlStatus.pages_crawled} pages crawled
                      {crawlStatus.total_pages ? ` of ~${crawlStatus.total_pages}` : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
            {crawlStatus?.status === 'completed' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-400">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-semibold">
                  Last crawl completed — {crawlStatus.pages_crawled} pages indexed
                </span>
              </div>
            )}
            {crawlStatus?.status === 'failed' && (
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                <ExclamationCircleIcon className="h-4 w-4" />
                <span>{crawlStatus.error ?? 'Crawl failed'}</span>
              </div>
            )}
            {crawlStatus?.social_links && crawlStatus.social_links.length > 0 && (
              <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                  Platforms discovered
                </p>
                <div className="flex flex-wrap gap-2">
                  {crawlStatus.social_links.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/70 transition hover:border-white/20 hover:text-white"
                    >
                      {new URL(link).hostname.replace('www.', '')}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Header row */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Website
                </p>
                <h2 className="text-base font-bold text-white">Crawl & Index</h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3730a3]">
                <GlobeAltIcon className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Inputs row */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                className="flex-1 rounded-xl border border-white/20 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/30 disabled:opacity-40"
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
                  className="whitespace-nowrap text-xs text-white/40"
                >
                  Max pages:
                </label>
                <input
                  id="crawl-max-pages"
                  type="number"
                  className="w-20 rounded-xl border border-white/20 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#3730a3] disabled:opacity-40"
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
                className="flex items-center gap-2 rounded-xl bg-[#3730a3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
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
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                <ExclamationCircleIcon className="h-3 w-3 shrink-0" />
                {crawlError}
              </p>
            )}
          </div>
        </div>

        {/* ── Indexed pages ── */}
        <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Indexed Pages{' '}
              <span className="ml-1 rounded-full bg-[#3730a3]/10 px-2 py-0.5 text-xs font-semibold text-[#3730a3]">
                {entries.length}
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                className="rounded-xl border border-gray-100 p-1.5 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
              </button>
              {entries.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={clearing}
                  className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
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
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                <GlobeAltIcon className="h-5 w-5 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-900">No pages indexed yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Enter your website URL above to start crawling.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 px-6 py-4 transition hover:bg-gray-50/50"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <GlobeAltIcon className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate text-sm font-medium text-gray-900">{entry.title}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.other
                        )}
                      >
                        {entry.category}
                      </span>
                    </div>
                    {entry.summary && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-400">{entry.summary}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                      <a
                        href={entry.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 transition hover:text-[#3730a3] hover:underline"
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
                    className="shrink-0 rounded-xl p-1.5 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    title="Delete entry"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { KnowledgeBasePage }
