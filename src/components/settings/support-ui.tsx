/**
 * Shared presentational primitives for the Support settings redesign.
 *
 * One design language across every tab: soft white cards on the grey page,
 * `#1A1A1A` accent (matching the rest of Settings), one card radius, one
 * callout style, one save bar. Everyday controls lead; rarely-touched fields
 * collapse into <Disclosure> drawers. Kept purely presentational so tab logic
 * stays where it is.
 */
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { BookOpenIcon, ChevronRightIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib'

const ACCENT = '#1A1A1A'

/** Page frame: grey background, centered column, header with eyebrow/title/docs. */
export function SettingsShell({
  eyebrow = 'Settings',
  title,
  description,
  docsUrl,
  right,
  children,
}: {
  eyebrow?: string
  title: string
  description?: string
  docsUrl?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="-mx-4 -my-6 min-h-full bg-[#ebebeb] px-4 py-7 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{title}</h1>
            {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {right}
            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-xl border border-transparent px-2 py-1.5 text-xs font-medium text-gray-400 transition hover:border-gray-200 hover:bg-white hover:text-gray-600"
              >
                <BookOpenIcon className="h-3.5 w-3.5" />
                Docs
              </a>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export interface PillTab<K extends string> {
  key: K
  label: string
  icon: React.ComponentType<{ className?: string }>
}

/** KB-style pill tab bar. */
export function PillTabs<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<PillTab<K>>
  active: K
  onChange: (key: K) => void
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white p-1.5 shadow-sm">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-[13px] font-semibold transition',
              isActive
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Second-level side nav (vertical on desktop, horizontal scroll on mobile). */
export function SideNav<K extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: ReadonlyArray<PillTab<K>>
  active: K
  onChange: (key: K) => void
}) {
  return (
    <aside className="md:w-52 md:shrink-0">
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/60 bg-white p-1.5 shadow-sm md:sticky md:top-4 md:flex-col md:gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2.5 text-[13px] font-semibold transition md:w-full',
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}

/** Soft white card with an optional title/hint header. */
export function SCard({
  title,
  hint,
  right,
  children,
  className,
}: {
  title?: string
  hint?: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-3.5 rounded-2xl border border-white/60 bg-white p-4 shadow-sm sm:p-5',
        className
      )}
    >
      {(title || right) && (
        <div className="flex items-start justify-between gap-3">
          <div>
            {title && <p className="text-[15px] font-bold text-gray-900">{title}</p>}
            {hint && <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{hint}</p>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </div>
      )}
      <div className={cn(title || right ? 'mt-3' : '')}>{children}</div>
    </div>
  )
}

/** A label/description row with a control on the right. Rows self-divide. */
export function SRow({
  label,
  desc,
  control,
  children,
}: {
  label: string
  desc?: string
  control?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-gray-100 py-3.5 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {desc && <p className="mt-0.5 text-xs leading-relaxed text-gray-400">{desc}</p>}
        {children}
      </div>
      {control && <div className="shrink-0">{control}</div>}
    </div>
  )
}

/** iOS-style toggle in the accent color. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-10 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[#1A1A1A]' : 'bg-gray-300'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
          checked ? 'left-[19px]' : 'left-0.5'
        )}
      />
    </button>
  )
}

/** Collapsible drawer for advanced / rarely-touched fields. */
export function Disclosure({
  title,
  desc,
  tag,
  defaultOpen = false,
  children,
}: {
  title: string
  desc?: string
  tag?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-gray-200 first:mt-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 bg-gray-50 px-4 py-3 text-left transition hover:bg-gray-100"
      >
        <span className="min-w-0">
          <span className="text-[13.5px] font-bold text-gray-900">
            {title}
            {tag && (
              <span className="ml-2 rounded-full bg-gray-900/5 px-2 py-0.5 align-middle text-[10px] font-bold uppercase tracking-wide text-gray-500">
                {tag}
              </span>
            )}
          </span>
          {desc && <span className="mt-0.5 block text-xs text-gray-400">{desc}</span>}
        </span>
        <ChevronRightIcon
          className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-90')}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  )
}

/** Single-style callout (replaces the five ad-hoc tinted boxes). */
export function Callout({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3 text-xs leading-relaxed text-gray-600">
      {icon && <span className="mt-0.5 shrink-0 text-gray-500">{icon}</span>}
      <div>{children}</div>
    </div>
  )
}

/** Read-only usage tile with a progress bar. */
export function StatTile({ label, value, max }: { label: string; value: number; max?: number }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="rounded-xl border border-gray-200 px-3.5 py-3">
      <p className="text-xs font-semibold text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-gray-900">
        {value.toLocaleString()}
        {max != null && (
          <span className="text-xs font-semibold text-gray-400"> / {max.toLocaleString()}</span>
        )}
      </p>
      {max != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#1A1A1A]" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  )
}

/** Labeled field wrapper for text/select inputs inside cards & disclosures. */
export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label
      className={cn('block border-t border-gray-100 py-3 first:border-t-0 first:pt-0', className)}
    >
      <span className="mb-1.5 block text-[13px] font-semibold text-gray-900">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11.5px] text-gray-400">{hint}</span>}
    </label>
  )
}

/** Shared input class so every text/select field matches. */
export const fieldInputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900'

/** One code card with a method switcher — replaces stacked code blocks. */
export function CodeTabs({
  methods,
}: {
  methods: Array<{ key: string; label: string; desc?: string; code: string }>
}) {
  const [k, setK] = useState(methods[0]?.key)
  const cur = methods.find((m) => m.key === k) ?? methods[0]
  return (
    <div>
      <div className="inline-flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {methods.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setK(m.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              k === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {cur?.desc && <p className="mt-3 text-xs text-gray-400">{cur.desc}</p>}
      <div className="relative mt-2">
        <pre className="overflow-x-auto whitespace-pre rounded-xl bg-[#0d1117] px-4 py-3.5 font-mono text-xs leading-relaxed text-gray-200">
          {cur?.code}
        </pre>
        <button
          type="button"
          onClick={() => {
            if (cur) {
              navigator.clipboard.writeText(cur.code)
              toast.success('Copied')
            }
          }}
          className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-gray-200 transition hover:bg-white/20"
        >
          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
    </div>
  )
}

/** Sticky bottom save bar (the single save mechanism for top-level fields). */
export function SaveBar({
  onSave,
  saving,
  note = 'Changes save when you click — no auto-save.',
}: {
  onSave: () => void
  saving?: boolean
  note?: string
}) {
  return (
    <div className="sticky bottom-4 z-10 mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/60 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
      <span className="text-xs text-gray-400">{note}</span>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-xl px-5 py-2 text-[13px] font-bold text-white transition hover:bg-[#333] disabled:opacity-50"
        style={{ backgroundColor: ACCENT }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  )
}
