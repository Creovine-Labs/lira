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

  async function handleUpload(files: FileList | DocumentIcon[]) {
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
      <div className="flex items-center justify-center py-20">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-100">
            <DocumentTextIcon className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Documents</h1>
            <p className="text-sm text-gray-500">
              ArrowUpTrayIcon documents to enrich Lira’s knowledge
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-8">
        {connectionLost && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
            Connection lost — document status updates paused. Refresh to retry.
          </div>
        )}

        {/* ArrowUpTrayIcon area */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'rounded-xl border-2 border-dashed bg-card p-8 text-center transition',
            dragging
              ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
              : 'border-border hover:border-violet-500/50'
          )}
        >
          <ArrowUpTrayIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-foreground">
            Drag & drop files here, or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="font-medium text-violet-600 underline-offset-2 hover:underline dark:text-violet-400"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, DOCX, TXT, MD, CSV, XLSX — max 25 MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          {uploading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-violet-600">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Uploading…
            </div>
          )}
        </div>

        {/* Documents list */}
        <section className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">
              Uploaded Documents ({documents.length})
            </h2>
            <button
              onClick={loadDocs}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <ArrowPathIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <DocumentTextIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No documents uploaded yet. Drop files above to get started.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc) => {
                const statusCfg = STATUS_CONFIG[doc.status]
                const StatusIcon = statusCfg.icon
                return (
                  <div key={doc.doc_id} className="flex items-center gap-3 px-4 sm:px-6 py-4">
                    <DocumentIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{doc.filename}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatBytes(doc.file_size)}</span>
                        {doc.chunk_count != null && <span>· {doc.chunk_count} chunks</span>}
                        {doc.embedding_count != null && (
                          <span>· {doc.embedding_count} embeddings</span>
                        )}
                        <span>· {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.summary && (
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          {doc.summary}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={cn('flex items-center gap-1 text-xs font-medium', statusCfg.color)}
                    >
                      <StatusIcon
                        className={cn('h-3.5 w-3.5', doc.status === 'processing' && 'animate-spin')}
                      />
                      {statusCfg.label}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownload(doc)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                        title="ArrowDownTrayIcon"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => handleReprocess(doc.doc_id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                          title="Reprocess"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(doc.doc_id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
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
        </section>
      </div>
    </div>
  )
}

export { DocumentsPage }
