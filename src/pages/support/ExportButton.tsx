// Reusable CSV export button for support surfaces.
//
// Entitlement is resolved on the frontend (useExportEntitlement) so the plan
// boundary is explained BEFORE any request — we never rely on the backend 403
// as the UX:
//   entitled       → streams the export to a file download + toasts a summary
//   upsell         → lock icon; click shows "Upgrade to Scale" with a CTA
//   no-permission  → click shows "Ask an org admin to export data"
// The backend gate remains the hard enforcement.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDownTrayIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  downloadSupportExport,
  type SupportExportKind,
  type SupportExportQuery,
} from '@/services/api/support-api'
import { cn } from '@/lib'
import { useExportEntitlement } from './use-export-entitlement'

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
  const navigate = useNavigate()
  const gate = useExportEntitlement(orgId)
  const [busy, setBusy] = useState(false)

  const locked = gate.status === 'upsell' || gate.status === 'no-permission'

  async function handleClick() {
    if (gate.status === 'no-permission') {
      toast.info('Ask an org admin to export data.')
      return
    }
    if (gate.status === 'upsell') {
      toast('CSV exports are available on Scale.', {
        description:
          'Upgrade to Scale to export conversations, tickets, customers, and usage evidence.',
        action: { label: 'Upgrade to Scale', onClick: () => navigate('/settings') },
      })
      return
    }
    // entitled (or still loading — the backend gate is the safety net)
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
      title={
        gate.status === 'upsell'
          ? 'CSV exports require the Scale plan'
          : gate.status === 'no-permission'
            ? 'Only org admins can export data'
            : `Export ${kind} as CSV`
      }
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50',
        locked && 'text-gray-400',
        className
      )}
    >
      {locked ? <LockClosedIcon className="h-4 w-4" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
      {busy ? 'Exporting…' : label}
    </button>
  )
}
