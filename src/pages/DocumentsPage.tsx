import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  LinkIcon,
  PlusCircleIcon,
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
  listConnectedDocuments,
  importConnectedDocument,
  getGoogleAuthUrl,
  getGitHubAuthUrl,
  type DocumentRecord,
  type ConnectedFile,
  type ConnectedSourceStatus,
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
const ACCEPTED_EXTENSIONS = new Set(['pdf', 'docx', 'doc', 'txt', 'md', 'csv', 'xlsx'])
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB (largest per-type limit)

function isFileAccepted(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return `Unsupported file type: .${ext}. Accepted: PDF, DOCX, TXT, MD, CSV, XLSX`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large (${formatBytes(file.size)}). Maximum: ${formatBytes(MAX_FILE_SIZE)}`
  }
  return null
}

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

  // Connected sources state
  const [connectedSources, setConnectedSources] = useState<{
    google_drive: ConnectedSourceStatus
    github: ConnectedSourceStatus
  } | null>(null)
  const [connectedLoading, setConnectedLoading] = useState(false)
  const [importingFiles, setImportingFiles] = useState<Set<string>>(new Set())
  const [activeSource, setActiveSource] = useState<'google_drive' | 'github' | null>(null)

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

  // Load connected sources
  const loadConnectedSources = useCallback(async () => {
    if (!currentOrgId) return
    setConnectedLoading(true)
    try {
      const data = await listConnectedDocuments(currentOrgId)
      setConnectedSources(data.sources)
    } catch {
      // Non-critical — silently fail
    } finally {
      setConnectedLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadConnectedSources()
  }, [loadConnectedSources])

  async function handleImport(file: ConnectedFile) {
    if (!currentOrgId) return
    setImportingFiles((prev) => new Set(prev).add(file.id))
    try {
      const doc = await importConnectedDocument(
        currentOrgId,
        file.source,
        file.id,
        file.name,
        file.mimeType,
        file.repo,
        file.path,
        file.ref
      )
      addDocument(doc)
      toast.success(`"${file.name}" imported and queued for indexing`)
    } catch (err) {
      toast.error(
        `Failed to import ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setImportingFiles((prev) => {
        const next = new Set(prev)
        next.delete(file.id)
        return next
      })
    }
  }

  async function handleImportAll(files: ConnectedFile[]) {
    if (!currentOrgId) return
    let successCount = 0
    for (const file of files) {
      setImportingFiles((prev) => new Set(prev).add(file.id))
      try {
        const doc = await importConnectedDocument(
          currentOrgId,
          file.source,
          file.id,
          file.name,
          file.mimeType,
          file.repo,
          file.path,
          file.ref
        )
        addDocument(doc)
        successCount++
      } catch {
        // Continue with remaining files
      } finally {
        setImportingFiles((prev) => {
          const next = new Set(prev)
          next.delete(file.id)
          return next
        })
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? 's' : ''} imported`)
    }
  }

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

    // Client-side validation before uploading
    const validFiles: File[] = []
    for (const file of fileArray) {
      const error = isFileAccepted(file)
      if (error) {
        toast.error(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)
      }
    }
    if (validFiles.length === 0) return

    setUploading(true)
    let successCount = 0
    for (const file of validFiles) {
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
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Settings
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Documents</h1>
            <p className="mt-1 text-sm text-gray-400">
              Upload files to enrich Lira's knowledge base.
            </p>
          </div>
          <a
            href="https://docs.liraintelligence.com/getting-started/navigation#documents"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600 px-2 py-1.5 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 transition-colors"
          >
            <BookOpenIcon className="h-3.5 w-3.5" />
            Docs
          </a>
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

        {/* Connected Sources */}
        <div className="mt-5 rounded-2xl border border-white/60 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-900">Connected Sources</h2>
            </div>
            <button
              onClick={loadConnectedSources}
              className="rounded-xl border border-gray-200 p-1.5 text-gray-400 transition hover:bg-gray-50"
              title="Refresh connected sources"
            >
              <ArrowPathIcon className={cn('h-3.5 w-3.5', connectedLoading && 'animate-spin')} />
            </button>
          </div>

          {connectedLoading && !connectedSources ? (
            <div className="grid grid-cols-2 gap-3 px-6 py-6">
              {[0, 1].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="p-4">
              {/* Side-by-side source cards */}
              <div className="grid grid-cols-2 gap-3">
                <SourceCard
                  label="Google Drive"
                  icon={GOOGLE_DRIVE_ICON}
                  source={connectedSources?.google_drive}
                  isActive={activeSource === 'google_drive'}
                  onToggle={() =>
                    setActiveSource((prev) => (prev === 'google_drive' ? null : 'google_drive'))
                  }
                  onConnect={() => {
                    if (currentOrgId) window.location.href = getGoogleAuthUrl(currentOrgId)
                  }}
                  alreadyImportedCount={
                    connectedSources?.google_drive?.files.filter((f) =>
                      documents.some((d) => d.filename === f.name)
                    ).length ?? 0
                  }
                />
                <SourceCard
                  label="GitHub"
                  icon={GITHUB_ICON}
                  source={connectedSources?.github}
                  isActive={activeSource === 'github'}
                  onToggle={() => setActiveSource((prev) => (prev === 'github' ? null : 'github'))}
                  onConnect={() => {
                    if (currentOrgId) window.location.href = getGitHubAuthUrl(currentOrgId)
                  }}
                  alreadyImportedCount={
                    connectedSources?.github?.files.filter((f) =>
                      documents.some((d) => d.filename === f.name)
                    ).length ?? 0
                  }
                />
              </div>

              {/* Expanded file grid for active source */}
              {activeSource && connectedSources?.[activeSource]?.connected && (
                <SourceFileGrid
                  label={activeSource === 'google_drive' ? 'Google Drive' : 'GitHub'}
                  files={connectedSources[activeSource]!.files}
                  onImport={handleImport}
                  onImportAll={handleImportAll}
                  importingFiles={importingFiles}
                  alreadyImported={documents}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Inline SVG icons for integration logos ───────────────────────────────────

const GOOGLE_DRIVE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M8 3L2 13h6l6-10H8z" fill="#0F9D58" />
    <path d="M14 3l6 10h-6l-6-10h6z" fill="#4285F4" />
    <path d="M2 13l4 8h12l4-8H2z" fill="#FBBC05" />
  </svg>
)

const GITHUB_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"
      fill="#24292F"
    />
  </svg>
)

// ── Source Card (clickable tile) ──────────────────────────────────────────────

function SourceCard({
  label,
  icon,
  source,
  isActive,
  onToggle,
  onConnect,
  alreadyImportedCount,
}: {
  label: string
  icon: React.ReactNode
  source?: ConnectedSourceStatus
  isActive: boolean
  onToggle: () => void
  onConnect: () => void
  alreadyImportedCount: number
}) {
  const connected = source?.connected
  const totalFiles = source?.files.length ?? 0

  if (!connected) {
    return (
      <button
        onClick={onConnect}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-5 transition hover:border-[#3730a3]/40 hover:bg-[#3730a3]/5"
      >
        {icon}
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="rounded-lg bg-[#3730a3] px-3 py-1 text-[11px] font-semibold text-white">
          Connect
        </span>
      </button>
    )
  }

  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition',
        isActive
          ? 'border-[#3730a3] bg-[#3730a3]/5 shadow-sm'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      )}
    >
      {icon}
      <p className="text-sm font-semibold text-gray-700">{label}</p>
      <p className="text-xs text-gray-400">
        {totalFiles} file{totalFiles !== 1 ? 's' : ''}
        {alreadyImportedCount > 0 && (
          <span className="text-emerald-500"> · {alreadyImportedCount} imported</span>
        )}
      </p>
    </button>
  )
}

// ── Source File Grid (expanded view) ─────────────────────────────────────────

function SourceFileGrid({
  label,
  files,
  onImport,
  onImportAll,
  importingFiles,
  alreadyImported,
}: {
  label: string
  files: ConnectedFile[]
  onImport: (file: ConnectedFile) => void
  onImportAll: (files: ConnectedFile[]) => void
  importingFiles: Set<string>
  alreadyImported: DocumentRecord[]
}) {
  const importedNames = new Set(alreadyImported.map((d) => d.filename))
  const availableFiles = files.filter((f) => !importedNames.has(f.name))

  return (
    <div className="mt-4">
      {/* Grid header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
          {label} — {files.length} file{files.length !== 1 ? 's' : ''}
        </p>
        {availableFiles.length > 0 && (
          <button
            onClick={() => onImportAll(availableFiles)}
            className="flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#312e81]"
          >
            <PlusCircleIcon className="h-3.5 w-3.5" />
            Import All ({availableFiles.length})
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-400">
          No document files found in this source.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {files.map((file) => {
            const isImported = importedNames.has(file.name)
            const isImporting = importingFiles.has(file.id)

            return (
              <div
                key={file.id}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition',
                  isImported
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-gray-200 hover:border-[#3730a3]/40 hover:bg-gray-50'
                )}
              >
                {/* File icon — clicking opens in source */}
                {file.webUrl ? (
                  <a
                    href={file.webUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition hover:bg-[#3730a3]/10 hover:text-[#3730a3]"
                    title={`Open in ${file.repo ? 'GitHub' : 'Google Drive'}`}
                  >
                    <DocumentIcon className="h-5 w-5" />
                  </a>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <DocumentIcon className="h-5 w-5" />
                  </div>
                )}

                {/* File name */}
                <p
                  className="w-full truncate text-[11px] font-medium text-gray-700"
                  title={file.name}
                >
                  {file.name}
                </p>

                {/* Meta */}
                <p
                  className="truncate text-[10px] text-gray-400 w-full"
                  title={file.repo ?? file.mimeType ?? ''}
                >
                  {file.repo
                    ? file.repo
                    : (file.mimeType?.split('/').pop()?.replace('vnd.google-apps.', 'Google ') ??
                      '')}
                </p>

                {/* Actions row — View + Import side by side */}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {file.webUrl && (
                    <a
                      href={file.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-500 transition hover:border-gray-400 hover:text-gray-700"
                    >
                      <LinkIcon className="h-3 w-3" />
                      View
                    </a>
                  )}

                  {isImported ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                      <CheckCircleIcon className="h-3 w-3" />
                      Imported
                    </span>
                  ) : isImporting ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-500">
                      <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      Importing…
                    </span>
                  ) : (
                    <button
                      onClick={() => onImport(file)}
                      className="flex items-center gap-1 rounded-lg border border-[#3730a3]/30 bg-[#3730a3]/5 px-2 py-0.5 text-[10px] font-semibold text-[#3730a3] transition hover:bg-[#3730a3]/10"
                    >
                      <PlusCircleIcon className="h-3 w-3" />
                      Import
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { DocumentsPage }
