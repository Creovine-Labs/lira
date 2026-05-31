// Customer-facing ticket portal API client.
//
// Covers Phase 4 (public magic-link + verified SDK auth — §2.1–2.6) and
// Phase 5 in-app CSAT submission (§3.2). The same call surface dispatches
// to `/public/*` or `/verified/*` depending on the resolved auth mode for
// the org, so each page doesn't have to branch.
//
// Auth modes:
//   • magic_link — token appended as `?access_token=…`. Routes hit
//     `/lira/v1/support/tickets/public/:orgId/...`.
//   • verified   — email + sig appended as `?email=…&sig=…`. Routes hit
//     `/lira/v1/support/tickets/verified/:orgId/...`.
//
// On 401/403 we clear the auth for this org and dispatch
// `lira:portal-token-expired` (the event name is unchanged for backwards
// compat with the route shells that listen on it) so the route can bounce
// back to access (magic-link) or surface a "verification expired" state
// (verified — no recovery flow inside the FE, the embedding SDK must
// re-issue the URL).

import { env } from '@/env'
import { clearPortalAuth, getPortalAuth, type PortalAuth } from '@/lib/portal-token'

// ── Types ────────────────────────────────────────────────────────────────

export type PortalTicketStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'on_hold'
  | 'escalated'
  | 'resolved'
  | 'closed'
  | 'merged'
  | 'snoozed'

export type PortalTicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface PortalTicketSummary {
  ticket_id: string
  ticket_number: string
  subject: string
  status: PortalTicketStatus
  priority: PortalTicketPriority
  visitor_email: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  first_response_at: string | null
  next_response_due_at: string | null
  resolution_due_at: string | null
}

export interface PortalAttachment {
  id: string
  name: string
  content_type: string
  size: number
  s3_key: string
  url?: string
}

export interface PortalMessage {
  message_id: string
  ticket_id: string
  sender: 'visitor' | 'agent' | 'system'
  sender_name?: string
  body: string
  attachments?: PortalAttachment[]
  created_at: string
}

export interface PortalTicketDetail {
  ticket: PortalTicketSummary
  messages: PortalMessage[]
}

export class PortalTokenError extends Error {
  readonly kind: 'missing' | 'expired' | 'forbidden'
  readonly authKind: PortalAuth['kind'] | null
  constructor(
    message: string,
    kind: 'missing' | 'expired' | 'forbidden',
    authKind: PortalAuth['kind'] | null = null
  ) {
    super(message)
    this.name = 'PortalTokenError'
    this.kind = kind
    this.authKind = authKind
  }
}

/** Non-auth failure from the portal API — carries the HTTP status. */
export class PortalApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PortalApiError'
    this.status = status
  }
}

// ── Fetch helper ─────────────────────────────────────────────────────────

const TICKET_BASE = `${env.VITE_API_URL}/lira/v1/support/tickets`

interface PortalFetchOptions extends Omit<RequestInit, 'body'> {
  json?: unknown
  form?: FormData
  /**
   * If true, the call does not require an authed session (e.g. the
   * access-link request). Magic-link's `requestPortalAccessLink` is the
   * only caller — the verified flow has nothing equivalent because the
   * SDK provisions creds out-of-band.
   */
  unauthenticated?: boolean
  /**
   * Override the auth mode for this call. Defaults to whatever
   * `getPortalAuth(orgId)` resolves. Used by `requestPortalAccessLink`
   * to force the public path even when verified creds happen to exist.
   */
  forceAuthKind?: PortalAuth['kind']
}

async function portalFetch<T>(
  orgId: string,
  path: string,
  opts: PortalFetchOptions = {}
): Promise<T> {
  const { json, form, unauthenticated, forceAuthKind, headers, ...rest } = opts

  let url: string
  if (unauthenticated) {
    // Access-link is always issued under /public/; verified mode has no
    // equivalent because the SDK provides creds without a roundtrip.
    url = `${TICKET_BASE}/public/${encodeURIComponent(orgId)}${path}`
  } else {
    const auth = getPortalAuth(orgId)
    if (!auth || (forceAuthKind && auth.kind !== forceAuthKind)) {
      throw new PortalTokenError(
        'No active portal session for this organisation.',
        'missing',
        auth?.kind ?? null
      )
    }
    const base = auth.kind === 'verified' ? 'verified' : 'public'
    url = `${TICKET_BASE}/${base}/${encodeURIComponent(orgId)}${path}`
    const qs = buildAuthQuery(auth)
    url += (url.includes('?') ? '&' : '?') + qs
  }

  const init: RequestInit = { ...rest }
  if (json !== undefined) {
    init.body = JSON.stringify(json)
    init.headers = { 'Content-Type': 'application/json', ...(headers ?? {}) }
  } else if (form) {
    init.body = form
    init.headers = headers
  } else {
    init.headers = headers
  }

  const res = await fetch(url, init)

  if (res.status === 401 || res.status === 403) {
    const auth = getPortalAuth(orgId)
    clearPortalAuth(orgId)
    window.dispatchEvent(
      new CustomEvent('lira:portal-token-expired', {
        detail: { orgId, status: res.status, authKind: auth?.kind ?? null },
      })
    )
    const kind = res.status === 401 ? 'expired' : 'forbidden'
    let msg =
      res.status === 401
        ? auth?.kind === 'verified'
          ? 'This embedded session has expired — reload the page.'
          : 'Your link has expired.'
        : 'This link no longer has access.'
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) msg = body.error
    } catch {
      /* ignore */
    }
    throw new PortalTokenError(msg, kind, auth?.kind ?? null)
  }

  if (!res.ok) {
    let errBody: { error?: string; message?: string } = {}
    try {
      errBody = (await res.json()) as typeof errBody
    } catch {
      /* ignore */
    }
    throw new PortalApiError(
      errBody.error ?? errBody.message ?? `Request failed (${res.status})`,
      res.status
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

function buildAuthQuery(auth: PortalAuth): string {
  if (auth.kind === 'magic_link') {
    return `access_token=${encodeURIComponent(auth.token)}`
  }
  return `email=${encodeURIComponent(auth.email)}&sig=${encodeURIComponent(auth.sig)}`
}

// ── Endpoints (Phase 4 §2.1–2.5) ─────────────────────────────────────────

/**
 * §2.1 — Request a magic-link email. Always 200 even if the email has no
 * tickets (account-enumeration defence). Always uses the `/public/` path
 * regardless of any verified session that might be lurking.
 */
export async function requestPortalAccessLink(
  orgId: string,
  payload: { email: string; ticket_number?: string }
): Promise<void> {
  await portalFetch<{ ok: true }>(orgId, `/tickets/access-link`, {
    method: 'POST',
    json: payload,
    unauthenticated: true,
  })
}

/** §2.2 — List the authed customer's tickets. */
export async function listPortalTickets(orgId: string): Promise<PortalTicketSummary[]> {
  const data = await portalFetch<{ tickets: PortalTicketSummary[] }>(orgId, `/tickets`)
  return data.tickets
}

/** §2.3 — Get a single ticket + message thread. */
export async function getPortalTicket(
  orgId: string,
  ticketNumber: string
): Promise<PortalTicketDetail> {
  return portalFetch<PortalTicketDetail>(orgId, `/tickets/${encodeURIComponent(ticketNumber)}`)
}

/** §2.4 — Post a reply to a ticket. */
export async function replyToPortalTicket(
  orgId: string,
  ticketNumber: string,
  payload: { body?: string; attachments?: PortalAttachment[] }
): Promise<{ message: PortalMessage; ticket: PortalTicketSummary }> {
  return portalFetch<{ message: PortalMessage; ticket: PortalTicketSummary }>(
    orgId,
    `/tickets/${encodeURIComponent(ticketNumber)}/reply`,
    { method: 'POST', json: payload }
  )
}

/**
 * §2.5 — Upload a single attachment. Returns the descriptor to pass to
 * `replyToPortalTicket` in a follow-up `/reply` call.
 *
 * Limits: 10 MB per file, image/PDF/text MIME types only.
 */
export async function uploadPortalAttachment(
  orgId: string,
  ticketNumber: string,
  file: File
): Promise<PortalAttachment> {
  const form = new FormData()
  form.append('file', file)
  const data = await portalFetch<{ attachment: PortalAttachment }>(
    orgId,
    `/tickets/${encodeURIComponent(ticketNumber)}/attachments`,
    { method: 'POST', form }
  )
  return data.attachment
}

// ── Endpoints (Phase 5 §3.2) ─────────────────────────────────────────────

/**
 * §3.2 — In-app CSAT submission. Idempotent at the ticket level — backend
 * returns 409 on a second submission. Callers should treat 409 as "already
 * recorded, show thank-you" rather than an error.
 */
export async function submitCsat(
  orgId: string,
  ticketNumber: string,
  score: 1 | 2 | 3 | 4 | 5
): Promise<{ ok: true; score: number }> {
  return portalFetch<{ ok: true; score: number }>(
    orgId,
    `/tickets/${encodeURIComponent(ticketNumber)}/csat`,
    { method: 'POST', json: { score } }
  )
}

export class CsatAlreadySubmittedError extends Error {
  constructor() {
    super('CSAT already submitted for this ticket.')
    this.name = 'CsatAlreadySubmittedError'
  }
}

/**
 * Convenience wrapper that translates the 409 into a typed error the UI
 * can branch on without sniffing error messages.
 */
export async function submitCsatSafe(
  orgId: string,
  ticketNumber: string,
  score: 1 | 2 | 3 | 4 | 5
): Promise<{ alreadySubmitted: boolean; score: number }> {
  try {
    const res = await submitCsat(orgId, ticketNumber, score)
    return { alreadySubmitted: false, score: res.score }
  } catch (err) {
    if (err instanceof PortalApiError && err.status === 409) {
      throw new CsatAlreadySubmittedError()
    }
    throw err
  }
}
