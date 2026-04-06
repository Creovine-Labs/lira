import { useCallback, useEffect, useState } from 'react'
import {
  ArrowPathIcon,
  CheckCircleIcon,
  DocumentIcon,
  LinkIcon,
  PlusCircleIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useDocumentStore } from '@/app/store'
import {
  listDocuments,
  listConnectedDocuments,
  importConnectedDocument,
  getGoogleAuthUrl,
  getGitHubAuthUrl,
  type DocumentRecord,
  type ConnectedFile,
  type ConnectedSourceStatus,
} from '@/services/api'
import { cn } from '@/lib'

function ConnectedSourcesPanel() {
  const { currentOrgId } = useOrgStore()
  const { documents, addDocument } = useDocumentStore()

  const [connectedSources, setConnectedSources] = useState<{
    google_drive: ConnectedSourceStatus
    github: ConnectedSourceStatus
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [importingFiles, setImportingFiles] = useState<Set<string>>(new Set())
  const [activeSource, setActiveSource] = useState<'google_drive' | 'github' | null>(null)

  const loadConnectedSources = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const data = await listConnectedDocuments(currentOrgId)
      setConnectedSources(data.sources)
    } catch {
      /* non-critical */
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadConnectedSources()
  }, [loadConnectedSources])

  // Also load documents so we can track which files are already imported
  const { setDocuments } = useDocumentStore()
  useEffect(() => {
    if (!currentOrgId) return
    listDocuments(currentOrgId)
      .then(setDocuments)
      .catch(() => {})
  }, [currentOrgId, setDocuments])

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
        /* continue */
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

  if (loading && !connectedSources) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-300/60" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Source cards */}
      <div className="rounded-2xl border border-white/60 bg-white shadow-sm">
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
            <ArrowPathIcon className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
        </div>

        <div className="p-4">
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
      </div>
    </>
  )
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

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

// ── Source Card ──────────────────────────────────────────────────────────────

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

// ── Source File Grid ─────────────────────────────────────────────────────────

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

                <p
                  className="w-full truncate text-[11px] font-medium text-gray-700"
                  title={file.name}
                >
                  {file.name}
                </p>

                <p
                  className="truncate text-[10px] text-gray-400 w-full"
                  title={file.repo ?? file.mimeType ?? ''}
                >
                  {file.repo
                    ? file.repo
                    : (file.mimeType?.split('/').pop()?.replace('vnd.google-apps.', 'Google ') ??
                      '')}
                </p>

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

export { ConnectedSourcesPanel }
