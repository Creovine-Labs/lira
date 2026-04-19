/**
 * Lira Support Portal — API client
 *
 * All portal endpoints are public (keyed by orgSlug), except customer-specific
 * ones which require the magic-link JWT token.
 */

import type { PortalConfig, PortalTicket, CustomerSession } from './types'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.creovine.com'

function portalUrl(path: string): string {
  return `${API_BASE}${path}`
}

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function getPortalConfig(orgSlug: string): Promise<PortalConfig> {
  const res = await fetch(portalUrl(`/lira/v1/support/portal/${encodeURIComponent(orgSlug)}`))
  if (!res.ok) throw new Error(`Portal not found (${res.status})`)
  return res.json() as Promise<PortalConfig>
}

export async function submitTicket(
  orgSlug: string,
  data: { name: string; email: string; subject: string; description: string }
): Promise<{ conv_id: string }> {
  const res = await fetch(
    portalUrl(`/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/tickets`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as Record<string, string>).error ?? 'Failed to submit ticket')
  }
  return res.json() as Promise<{ conv_id: string }>
}

// ── Magic-link authentication ─────────────────────────────────────────────────

export async function requestMagicLink(orgSlug: string, email: string): Promise<void> {
  const res = await fetch(
    portalUrl(`/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/auth/request`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }
  )
  if (!res.ok) throw new Error('Failed to send login link')
}

export async function verifyMagicLink(
  orgSlug: string,
  email: string,
  token: string
): Promise<CustomerSession> {
  const res = await fetch(
    portalUrl(`/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/auth/verify`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    }
  )
  if (!res.ok) throw new Error('Invalid or expired link')
  return res.json() as Promise<CustomerSession>
}

// ── Authenticated customer endpoints ──────────────────────────────────────────

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

export async function listMyTickets(orgSlug: string, token: string): Promise<PortalTicket[]> {
  const res = await fetch(
    portalUrl(`/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/tickets`),
    { headers: authHeaders(token) }
  )
  if (res.status === 401) throw new Error('Session expired')
  if (!res.ok) throw new Error('Failed to load tickets')
  const data = (await res.json()) as { tickets: PortalTicket[] }
  return data.tickets
}

export async function getMyTicket(
  orgSlug: string,
  ticketId: string,
  token: string
): Promise<PortalTicket> {
  const res = await fetch(
    portalUrl(
      `/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/tickets/${encodeURIComponent(ticketId)}`
    ),
    { headers: authHeaders(token) }
  )
  if (res.status === 401) throw new Error('Session expired')
  if (!res.ok) throw new Error('Ticket not found')
  const data = (await res.json()) as { ticket: PortalTicket }
  return data.ticket
}

export async function replyToTicket(
  orgSlug: string,
  ticketId: string,
  body: string,
  token: string
): Promise<void> {
  const res = await fetch(
    portalUrl(
      `/lira/v1/support/portal/${encodeURIComponent(orgSlug)}/tickets/${encodeURIComponent(ticketId)}/reply`
    ),
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ body }),
    }
  )
  if (!res.ok) throw new Error('Failed to send reply')
}
