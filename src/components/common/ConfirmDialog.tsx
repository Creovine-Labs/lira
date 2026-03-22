import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void | Promise<void>
  onClose: () => void
  /** Red confirm button — use true for destructive actions like delete */
  destructive?: boolean
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  destructive = true,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  const handleConfirm = async () => {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && !busy && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {destructive && (
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-2 gap-2 sm:gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              destructive ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'
            }`}
          >
            {busy && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ConfirmDialog }
export type { ConfirmDialogProps }
