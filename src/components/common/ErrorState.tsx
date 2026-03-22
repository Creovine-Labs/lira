import type { ReactNode } from 'react'

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib'

type ErrorStateProps = {
  title?: string
  description?: string
  error?: unknown
  action?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  error,
  action,
  onRetry,
  retryLabel = 'Try again',
  className,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : null

  return (
    <section
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className
      )}
      role="alert"
    >
      <div className="rounded-full bg-destructive/15 p-3 text-destructive">
        <ExclamationTriangleIcon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-destructive">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        {errorMessage ? <p className="text-xs text-muted-foreground">{errorMessage}</p> : null}
      </div>
      <div className="flex items-center gap-2 pt-1">
        {onRetry ? (
          <Button type="button" variant="destructive" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </div>
    </section>
  )
}

export { ErrorState, type ErrorStateProps }
