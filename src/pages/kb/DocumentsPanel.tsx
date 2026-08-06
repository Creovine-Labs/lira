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
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useDocumentStore } from '@/app/store'
import { useSupportStore } from '@/app/store/support-store'
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentDownloadUrl,
  reprocessDocument,
  updateDocumentSegments,
  type DocumentRecord,
} from '@/services/api'
import { cn } from '@/lib'
import { formatKbSegments, parseKbSegments } from '@/lib/kbSegments'

const STATUS_CONFIG: Record<
  DocumentRecord['status'],
  { icon: React.ElementType; color: string; label: string }
> = {
  uploaded: { icon: ClockIcon, color: 'text-amber-500', label: 'Uploaded' },
  processing: { icon: ArrowPathIcon, color: 'text-blue-500', label: 'Processing' },
  indexed: { icon: CheckCircleIcon, color: 'text-emerald-500', label: 'Indexed' },
  failed: { icon: ExclamationCircleIcon, color: 'text-red-500', label: 'Failed' },
}

const ACCEPTED_TYPES = '.docx,.doc,.txt,.md,.csv,.xlsx'
const ACCEPTED_EXTENSIONS = new Set(['docx', 'doc', 'txt', 'md', 'csv', 'xlsx'])
const MAX_FILE_SIZE = 25 * 1024 * 1024

function isFileAccepted(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') {
    return `PDFs aren’t supported — they’re often image-based and produce poor-quality text. Please export “${file.name}” to DOCX, TXT, or Markdown, or paste the content using “Write a note directly” above.`
  }
  if (!ACCEPTED_EXTENSIONS.has(ext)) {
    return `Unsupported file type: .${ext}. Accepted: DOCX, TXT, MD, CSV, XLSX`
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

function DocumentsPanel() {
  const { currentOrgId } = useOrgStore()
  const {
    documents,
    loading,
    setDocuments,
    addDocument,
    removeDocument: removeDocFromStore,
    updateDocument,
    setLoading,
  } = useDocumentStore()

  const config = useSupportStore((s) => s.config)
  const updateSupportConfig = useSupportStore((s) => s.updateConfig)

  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [newSourceSegments, setNewSourceSegments] = useState('all')
  const [segmentEdits, setSegmentEdits] = useState<Record<string, string>>({})
  const [savingStrict, setSavingStrict] = useState(false)
  const [savingSegments, setSavingSegments] = useState<Record<string, boolean>>({})
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
        const doc = await uploadDocument(currentOrgId, file, parseKbSegments(newSourceSegments))
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

  async function handleSaveNote() {
    if (!currentOrgId || !noteBody.trim()) return
    setNoteSaving(true)
    try {
      const title = noteTitle.trim() || 'Note'
      const md = noteTitle.trim() ? `# ${noteTitle.trim()}\n\n${noteBody.trim()}` : noteBody.trim()
      const blob = new Blob([md], { type: 'text/markdown' })
      const file = new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, {
        type: 'text/markdown',
      })
      const doc = await uploadDocument(currentOrgId, file, parseKbSegments(newSourceSegments))
      addDocument(doc)
      toast.success('Note saved and indexing')
      setNoteTitle('')
      setNoteBody('')
      setNoteOpen(false)
    } catch (err) {
      toast.error(`Failed to save note: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setNoteSaving(false)
    }
  }

  async function handleToggleStrict(next: boolean) {
    if (!currentOrgId) return
    setSavingStrict(true)
    try {
      await updateSupportConfig(currentOrgId, { kb_segment_strict: next })
      toast.success(
        next
          ? 'Only tagged documents will answer customers on a known product.'
          : 'Untagged documents answer every product again.'
      )
    } catch (err) {
      toast.error(
        `Could not change this setting: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setSavingStrict(false)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  async function handleSaveSegments(doc: DocumentRecord) {
    if (!currentOrgId) return
    const next = parseKbSegments(segmentEdits[doc.doc_id] ?? formatKbSegments(doc.segments))
    setSavingSegments((prev) => ({ ...prev, [doc.doc_id]: true }))
    try {
      const updated = await updateDocumentSegments(currentOrgId, doc.doc_id, next)
      updateDocument(doc.doc_id, {
        segments: updated.segments ?? next,
        updated_at: updated.updated_at,
      })
      setSegmentEdits((prev) => ({
        ...prev,
        [doc.doc_id]: formatKbSegments(updated.segments ?? next),
      }))
      toast.success('Document segments updated')
    } catch (err) {
      toast.error(
        `Failed to update segments: ${err instanceof Error ? err.message : 'Unknown error'}`
      )
    } finally {
      setSavingSegments((prev) => ({ ...prev, [doc.doc_id]: false }))
    }
  }

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-4">
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
    )
  }

  return (
    <>
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

      {connectionLost && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ExclamationCircleIcon className="h-4 w-4 shrink-0" />
          Connection lost — document status updates paused. Refresh to retry.
        </div>
      )}

      {/* Upload zone */}
      <div className="mb-5 rounded-2xl border border-white/60 bg-white p-4 shadow-sm">
        {/* Write note toggle */}
        {noteOpen ? (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">Write a note directly</p>
              <button
                onClick={() => {
                  setNoteOpen(false)
                  setNoteTitle('')
                  setNoteBody('')
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Title (optional)"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
            />
            <textarea
              placeholder="Write your note here… e.g. product details, pricing, policies, FAQs. Lira will use this to answer customer questions."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20 resize-y"
            />
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-gray-400">
                Saved as a Markdown file and indexed automatically.
              </p>
              <button
                onClick={handleSaveNote}
                disabled={noteSaving || !noteBody.trim()}
                className="flex items-center gap-1.5 rounded-xl bg-[#3730a3] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {noteSaving ? (
                  <img
                    src="/lira_black.png"
                    alt=""
                    className="h-3 w-3 animate-spin opacity-50"
                    style={{ animationDuration: '1.2s' }}
                  />
                ) : (
                  <PencilSquareIcon className="h-3.5 w-3.5" />
                )}
                Save note
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setNoteOpen(true)}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#3730a3]/30 bg-[#3730a3]/5 px-4 py-2.5 text-sm font-medium text-[#3730a3] transition hover:bg-[#3730a3]/10"
          >
            <PencilSquareIcon className="h-4 w-4" />
            Write a note directly
          </button>
        )}
        <div className="mb-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
          <label
            htmlFor="kb-document-segments"
            className="text-[11px] font-semibold uppercase tracking-wide text-gray-500"
          >
            Product / segment tags
          </label>
          <input
            id="kb-document-segments"
            value={newSourceSegments}
            onChange={(e) => setNewSourceSegments(e.target.value)}
            placeholder="all, personal, business, corporate"
            className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
          />
          <p className="mt-1 text-xs text-gray-400">
            Use all for shared content. Use comma-separated tags for product-specific documents.
          </p>
          {/*
            The strictness switch belongs here, next to the tags it governs —
            an operator only asks "what about the files I never tagged?" while
            looking at tagging. Off by default: turning it on hides every
            untagged source at once, so it is the last step after tagging, not
            the first.
          */}
          <label className="mt-2.5 flex cursor-pointer items-start gap-2 border-t border-gray-200 pt-2.5">
            <input
              type="checkbox"
              checked={Boolean(config?.kb_segment_strict)}
              disabled={savingStrict}
              onChange={(e) => void handleToggleStrict(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-[#3730a3] focus:ring-[#3730a3]/30 disabled:opacity-50"
            />
            <span className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">Only answer from tagged documents</span>
              <br />
              {config?.kb_segment_strict
                ? 'Untagged documents are ignored for customers on a known product. Anything you forget to tag will not be used at all.'
                : 'Untagged documents answer every product. Turn this on once everything is tagged.'}
            </span>
          </label>
        </div>
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
          <p className="mt-1 text-xs text-gray-400">DOCX, TXT, MD, CSV, XLSX — max 25 MB</p>
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
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                        {(doc.segments?.length ? doc.segments : ['untagged']).map((segment) => (
                          <span
                            key={segment}
                            className={cn(
                              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                              segment === 'untagged'
                                ? 'bg-red-50 text-red-500'
                                : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {segment}
                          </span>
                        ))}
                      </div>
                      <div className="flex w-full gap-2 sm:w-72">
                        <input
                          value={segmentEdits[doc.doc_id] ?? formatKbSegments(doc.segments)}
                          onChange={(e) =>
                            setSegmentEdits((prev) => ({ ...prev, [doc.doc_id]: e.target.value }))
                          }
                          placeholder="all, personal"
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-[#3730a3] focus:ring-2 focus:ring-[#3730a3]/20"
                        />
                        <button
                          onClick={() => handleSaveSegments(doc)}
                          disabled={savingSegments[doc.doc_id]}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-[#3730a3]/40 hover:text-[#3730a3] disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>

                  <span
                    className={cn('flex items-center gap-1 text-xs font-semibold', statusCfg.color)}
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
    </>
  )
}

export { DocumentsPanel }
