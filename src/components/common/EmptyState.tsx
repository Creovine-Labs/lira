import type { ReactNode } from 'react'

import { InboxIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib'

type EmptyStateProps = {
  title?: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

function EmptyState({
  title = 'Nothing here yet',
  description = 'No items are available right now.',
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 rounded-lg border p-8 text-center',
        className
      )}
      aria-live="polite"
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        {icon ?? <InboxIcon className="h-5 w-5" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  )
}

export { EmptyState, type EmptyStateProps }
