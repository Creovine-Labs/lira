interface PageLoaderProps {
  /** Optional label shown below the logo */
  label?: string
  className?: string
}

/**
 * Full-page / full-section loading indicator.
 * Uses the Lira logo spinning instead of a generic arrow icon.
 */
export function PageLoader({ label, className }: PageLoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-20 ${className ?? ''}`}>
      <img
        src="/lira_black.png"
        alt="Loading"
        className="h-8 w-8 animate-spin opacity-70"
        style={{ animationDuration: '1.2s' }}
      />
      {label && <p className="text-sm text-gray-400">{label}</p>}
    </div>
  )
}
