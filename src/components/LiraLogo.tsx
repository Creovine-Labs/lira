// Lira AI brand logo — SVG mark + wordmark
// Usage: <LiraLogo /> | <LiraLogo size="sm" mark /> | <LiraLogo size="lg" />

interface LiraLogoProps {
  /** Include only the icon mark without the wordmark */
  mark?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { icon: 20, text: 14 },
  md: { icon: 28, text: 18 },
  lg: { icon: 40, text: 26 },
}

export function LiraLogo({ mark = false, size = 'md', className }: LiraLogoProps) {
  const s = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* Icon mark */}
      <img
        src="/lira_black.png"
        alt="Lira AI"
        width={s.icon}
        height={s.icon}
        style={{ width: s.icon, height: s.icon, objectFit: 'contain' }}
      />

      {/* Wordmark */}
      {!mark && (
        <span style={{ fontSize: s.text }} className="font-semibold tracking-tight">
          Lira
        </span>
      )}
    </div>
  )
}
