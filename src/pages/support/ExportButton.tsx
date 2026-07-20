// Reusable CSV export button for support surfaces. Streams the export to a file
// download and toasts a row-count summary. Org-admin gating is enforced
// server-side (403 → surfaced as a toast).

import { useState } from 'react'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  downloadSupportExport,
  type SupportExportKind,
  type SupportExportQuery,
} from '@/services/api/support-api'
import { cn } from '@/lib'

interface ExportButtonProps {
  orgId: string | null | undefined
  kind: SupportExportKind
  query?: SupportExportQuery
  label?: string
  className?: string
}

export function ExportButton({
  orgId,
  kind,
  query,
  label = 'Export CSV',
  className,
}: ExportButtonProps) {
  const [busy, setBusy] = useState(false)

  async function handleClick() {
    if (busy || !orgId) return
    setBusy(true)
    try {
      const { rowCount, truncated } = await downloadSupportExport(orgId, kind, query)
      toast.success(
        rowCount === 0
          ? 'Export ready — no rows matched.'
          : `Exported ${rowCount.toLocaleString()} row${rowCount === 1 ? '' : 's'}` +
              (truncated ? ' (capped at 50,000).' : '.')
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy || !orgId}
      title={`Export ${kind} as CSV`}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      <ArrowDownTrayIcon className="h-4 w-4" />
      {busy ? 'Exporting…' : label}
    </button>
  )
}
