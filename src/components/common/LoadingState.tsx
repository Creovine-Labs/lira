import type { ReactNode } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib'

type LoadingStateProps = {
  title?: string
  description?: string
  className?: string
  withSkeleton?: boolean
  rows?: number
  children?: ReactNode
}

function LoadingState({
  title = 'Loading...',
  description,
  className,
  withSkeleton = true,
  rows = 3,
  children,
}: LoadingStateProps) {
  return (
    <section
      className={cn(
        'flex w-full flex-col items-center justify-center gap-4 rounded-lg border p-6',
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <img
        src="/lira_black.png"
        alt="Loading"
        className="h-6 w-6 animate-spin opacity-50"
        style={{ animationDuration: '1.2s' }}
      />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {withSkeleton ? (
        <div className="w-full space-y-2">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-4 w-full" />
          ))}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export { LoadingState, type LoadingStateProps }
