import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useDocumentStore } from '@/app/store'
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  reprocessDocument,
  type DocumentRecord,
} from '@/services/api'
import { cn } from '@/lib'

const STATUS_CONFIG: Record<
  DocumentRecord['status'],
  { icon: React.ElementType; color: string; label: string }
> = {
  uploaded: { icon: ClockIcon, color: 'text-amber-500', label: 'Uploaded' },
  processing: { icon: ArrowPathIcon, color: 'text-blue-500', label: 'Processing' },
  indexed: { icon: CheckCircleIcon, color: 'text-emerald-500', label: 'Indexed' },
  failed: { icon: ExclamationCircleIcon, color: 'text-red-500', label: 'Failed' },
}

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.txt,.md,.csv,.xlsx'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function DocumentsPage() {
  const { currentOrgId } = useOrgStore()
  const {
    documents,
    loading,
    setDocuments,
    addDocument,
    removeDocument: removeDocFromStore,
    setLoading,
  } = useDocumentStore()

  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const pollErrorCount = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const docs = await listDocuments(currentOrgId)
      setDocuments(docs)
      pollErrorCount.current = 0
      setConnectionLost(false)
    } catch {
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, setDocuments, setLoading])

  useEffect(() => {
    loadDocs()
  }, [loadDocs])

  // Poll processing documents — stop after 3 consecutive fetch errors
  useEffect(() => {
    const processing = documents.filter((d) => d.status === 'processing' || d.status === 'uploaded')
    if (processing.length === 0) return
    const interval = setInterval(async () => {
      if (!currentOrgId) return
      try {
        const docs = await listDocuments(currentOrgId)
        setDocuments(docs)
        pollErrorCount.current = 0
        setConnectionLost(false)
      } catch {
        pollErrorCount.current += 1
        if (pollErrorCount.current >= 3) {
          clearInterval(interval)
          setConnectionLost(true)
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [documents, currentOrgId, setDocuments])

  async function handleUpload(files: FileList | File[]) {
    if (!currentOrgId) return
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    setUploading(true)
    let successCount = 0
    for (const file of fileArray) {
      try {
        const doc = await uploadDocument(currentOrgId, file)
        addDocument(doc)
        successCount++
      } catch (err) {
        toast.error(
          `Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} uploaded`)
    }
    setUploading(false)
  }

  async function handleDelete(docId: string) {
    if (!currentOrgId) return
    try {
      await deleteDocument(currentOrgId, docId)
      removeDocFromStore(docId)
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    }
  }

  async function handleDownload(doc: DocumentRecord) {
    if (!currentOrgId) return
    try {
      const url = await getDocumentDownloadUrl(currentOrgId, doc.doc_id)
      window.open(url, '_blank')
    } catch {
      toast.error('Failed to get download link')
    }
  }

  async function handleReprocess(docId: string) {
    if (!currentOrgId) return
    try {
      await reprocessDocument(currentOrgId, docId)
      toast.success('Reprocessing started')
      loadDocs()
    } catch {
      toast.error('Failed to reprocess document')
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="min-h-full bg-[#ebebeb] px-5 py-7">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-5 w-24 animate-pulse rounded-lg bg-gray-300/40" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-gray-300/60" />
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-gray-300/40" />
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-300/60" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Settings</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Documents</h1>
          <p className="mt-1 text-sm text-gray-400">
            Upload files to enrich Lira’s knowledge base.
          </p>
        </div>

        {/* Stat strip */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {[
            { label: 'Total Files', count: documents.length },
            { label: 'Indexed', count: documents.filter((d) => d.status === 'indexed').length },
          ].map(({ label, count }) => (
            <div
              key={label}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#141414] to-[#0a0a0a] p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/[0.06]" />
              <div className="relative">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Connection lost banner */}
        {connectionLost && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
            Connection lost — document status updates paused. Refresh to retry.
          </div>
        )}

        {/* Upload zone */}
        <div className="mb-5 rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'rounded-xl border-2 border-dashed p-8 text-center transition',
              dragging
                ? 'border-[#3730a3] bg-[#3730a3]/5'
                : 'border-gray-200 bg-gray-50/50 hover:border-[#3730a3]/40'
            )}
          >
            <ArrowUpTrayIcon className="mx-auto h-9 w-9 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Drag & drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="font-semibold text-[#3730a3] underline-offset-2 hover:underline"
              >
                browse
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-400">PDF, DOCX, TXT, MD, CSV, XLSX — max 25 MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            {uploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#3730a3]">
                <img
                  src="/lira_black.png"
                  alt="Loading"
                  className="h-4 w-4 animate-spin opacity-50"
                  style={{ animationDuration: '1.2s' }}
                />
                Uploading…
              </div>
            )}
          </div>
        </div>

        {/* Documents list */}
        <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900">
              Uploaded Documents ({documents.length})
            </h2>
            <button
              onClick={loadDocs}
              className="rounded-xl border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50"
              title="Refresh"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <DocumentTextIcon className="mx-auto h-10 w-10 text-gray-200" />
              <p className="mt-3 text-sm text-gray-400">
                No documents uploaded yet. Drop files above to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {documents.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status]
                const StatusIcon = statusCfg.icon
                return (
                  <div key={doc.doc_id} className="flex items-center gap-3 px-4 sm:px-6 py-4">
                    <DocumentIcon className="h-5 w-5 shrink-0 text-gray-300" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">{doc.filename}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                        <span>{formatBytes(doc.file_size)}</span>
                        {doc.chunk_count != null && <span>· {doc.chunk_count} chunks</span>}
                        {doc.embedding_count != null && (
                          <span>· {doc.embedding_count} embeddings</span>
                        )}
                        <span>· {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.summary && (
                        <p className="mt-1 text-xs text-gray-400 line-clamp-1">{doc.summary}</p>
                      )}
                    </div>

                    <span
                      className={cn(
                        'flex items-center gap-1 text-xs font-semibold',
                        statusCfg.color
                      )}
                    >
                      <StatusIcon
                        className={cn('h-3.5 w-3.5', doc.status === 'processing' && 'animate-spin')}
                      />
                      {statusCfg.label}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => handleReprocess(doc.doc_id)}
                          className="rounded-xl p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                          title="Reprocess"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.doc_id)}
                        className="rounded-xl p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { DocumentsPage }
