// Shared chrome + primitives for the customer-facing ticket portal.
//
// Deliberately distinct from the operator AppShell — no sidebar, no
// app-level navigation, max-width 640px, generous padding, serif headline
// accent. The customer should feel like they're on a focused, calm Lira
// surface, not the operator workspace.

import { forwardRef, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LiraLogo } from '@/components/LiraLogo'
import type { PortalTicketStatus } from '@/services/api/portal-api'
import {
  consumeAccessTokenFromUrl,
  consumeVerifiedCredsFromUrl,
  getPortalAuth,
  type PortalAuth,
} from '@/lib/portal-token'

// ── Layout shell ─────────────────────────────────────────────────────────

interface PortalLayoutProps {
  /** Show a "Back to your tickets" link in the top bar. */
  backTo?: string
  backLabel?: string
  children: ReactNode
}

export function PortalLayout({ backTo, backLabel = 'Your tickets', children }: PortalLayoutProps) {
  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#020308]">
      <header className="border-b border-black/[0.06] bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-[640px] items-center justify-between px-6 py-5">
          <Link to="/" aria-label="Lira" className="opacity-80 transition hover:opacity-100">
            <LiraLogo size="sm" />
          </Link>
          {backTo && (
            <Link
              to={backTo}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#020308]/60 transition hover:text-[#020308]"
            >
              <span aria-hidden>←</span>
              {backLabel}
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[640px] px-6 py-12 sm:py-16">{children}</main>

      <footer className="mx-auto max-w-[640px] px-6 pb-12">
        <p className="text-center text-[11px] text-[#020308]/40">
          Powered by{' '}
          <a
            href="https://liraintelligence.com"
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 transition hover:text-[#020308]/70 hover:underline"
          >
            Lira
          </a>
        </p>
      </footer>
    </div>
  )
}

// ── Display primitives ────────────────────────────────────────────────────

interface SerifHeadingProps {
  children: ReactNode
  className?: string
  as?: 'h1' | 'h2'
}

/** Editorial serif headline — used at the top of each portal page. */
export function SerifHeading({ children, className = '', as: Tag = 'h1' }: SerifHeadingProps) {
  return (
    <Tag
      className={`text-[32px] leading-[1.15] tracking-tight text-[#020308] sm:text-[40px] ${className}`}
      style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      {children}
    </Tag>
  )
}

interface SubtleTextProps {
  children: ReactNode
  className?: string
}

export function SubtleText({ children, className = '' }: SubtleTextProps) {
  return <p className={`text-[14px] leading-relaxed text-[#020308]/60 ${className}`}>{children}</p>
}

// ── Ticket number ─────────────────────────────────────────────────────────

export function TicketNumber({ value, className = '' }: { value: string; className?: string }) {
  return (
    <code
      className={`rounded-md bg-black/[0.04] px-1.5 py-0.5 font-mono text-[11px] tracking-tight text-[#020308]/70 ${className}`}
    >
      {value}
    </code>
  )
}

// ── Status badge — shared color system per SUPPORT_TICKETING_API.md §7 ───

const STATUS_STYLE: Record<PortalTicketStatus, { cls: string; label: string }> = {
  open: { cls: 'bg-sky-50 text-sky-700 ring-sky-600/10', label: 'Open' },
  in_progress: { cls: 'bg-sky-50 text-sky-700 ring-sky-600/10', label: 'In progress' },
  pending: { cls: 'bg-amber-50 text-amber-700 ring-amber-600/15', label: 'Awaiting your reply' },
  on_hold: { cls: 'bg-slate-100 text-slate-700 ring-slate-600/10', label: 'On hold' },
  escalated: { cls: 'bg-orange-50 text-orange-700 ring-orange-600/15', label: 'Escalated' },
  resolved: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10', label: 'Resolved' },
  closed: { cls: 'bg-slate-50 text-slate-600 ring-slate-500/10', label: 'Closed' },
  merged: { cls: 'bg-slate-50 text-slate-500 ring-slate-500/10', label: 'Merged' },
  snoozed: { cls: 'bg-slate-50 text-slate-500 ring-slate-500/10', label: 'Snoozed' },
}

export function StatusBadge({
  status,
  className = '',
}: {
  status: PortalTicketStatus
  className?: string
}) {
  const { cls, label } = STATUS_STYLE[status] ?? STATUS_STYLE.open
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${cls} ${className}`}
    >
      {label}
    </span>
  )
}

// ── Buttons / form primitives ────────────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }

export function PrimaryButton({ className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg bg-[#020308] px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#020308]/85 disabled:cursor-not-allowed disabled:bg-[#020308]/30 ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg border border-[#020308]/15 bg-white px-4 py-2.5 text-[14px] font-medium text-[#020308] transition hover:border-[#020308]/30 hover:bg-[#020308]/[0.02] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export const PortalInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function PortalInput({ className = '', ...rest }, ref) {
  return (
    <input
      ref={ref}
      {...rest}
      className={`w-full rounded-lg border border-[#020308]/15 bg-white px-3.5 py-2.5 text-[14px] text-[#020308] outline-none transition placeholder:text-[#020308]/30 focus:border-[#020308]/40 focus:ring-2 focus:ring-[#020308]/10 disabled:cursor-not-allowed disabled:bg-[#020308]/[0.03] ${className}`}
    />
  )
})

// ── Card ──────────────────────────────────────────────────────────────────

export function PortalCard({
  className = '',
  children,
  ...rest
}: {
  className?: string
  children: ReactNode
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'className' | 'children'>) {
  return (
    <div
      {...rest}
      className={`rounded-2xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${className}`}
    >
      {children}
    </div>
  )
}

// ── Session bootstrap hook ───────────────────────────────────────────────
//
// One place that handles:
//   • detecting whether we're on /portal/* (magic-link) or /verified/*
//     (SDK) routes
//   • lifting `?access_token=` (magic-link) or `?email=&sig=` (verified)
//     out of the URL on first render into sessionStorage
//   • stripping those params from the address bar so the secret never
//     survives in browser history
//
// Returns a synchronous snapshot — `ready: false` until bootstrap finishes,
// then `auth` reflects whatever session is now live (if any).

export type PortalMode = 'magic_link' | 'verified'

export interface PortalSession {
  ready: boolean
  mode: PortalMode
  auth: PortalAuth | null
}

/**
 * Detect the portal mode by URL prefix. Verified routes live under
 * /verified/, magic-link under /portal/. Defaults to magic-link if neither
 * matches (defensive — shouldn't happen given the route map).
 */
export function detectPortalMode(pathname: string): PortalMode {
  return pathname.startsWith('/verified/') ? 'verified' : 'magic_link'
}

export function usePortalSession(orgId: string): PortalSession {
  const { pathname } = useLocation()
  const mode = detectPortalMode(pathname)

  // Lazy useState init runs once at mount and lets us consume URL params
  // synchronously — avoiding the `react-hooks/set-state-in-effect` rule and
  // ensuring the secret is gone from the address bar before the first
  // render commit (no flash of `?access_token=…` in DevTools).
  const [auth] = useState<PortalAuth | null>(() => {
    if (!orgId || typeof window === 'undefined') return null
    // Try both bootstraps — only one will fire based on which params are
    // present. We don't gate by `mode` because magic-link URLs could
    // theoretically land on a /verified/ route during testing; the safer
    // posture is to accept whatever the URL provides.
    const consumedToken = consumeAccessTokenFromUrl(orgId, window.location.search)
    const consumedVerified = consumeVerifiedCredsFromUrl(
      orgId,
      consumedToken ? consumedToken.cleanedSearch : window.location.search
    )
    const finalSearch = consumedVerified
      ? consumedVerified.cleanedSearch
      : consumedToken?.cleanedSearch
    if (finalSearch !== undefined && finalSearch !== window.location.search) {
      const newUrl = `${window.location.pathname}${finalSearch}`
      window.history.replaceState(null, '', newUrl)
    }
    return getPortalAuth(orgId)
  })

  // `ready` is always true after the synchronous bootstrap above — kept on
  // the return shape so callers can treat the hook like an async session
  // resolver if it ever grows one.
  return { ready: true, mode, auth }
}
