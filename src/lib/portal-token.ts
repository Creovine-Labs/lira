// Customer-portal auth persistence.
//
// Two auth modes per SUPPORT_TICKETING_API.md §0 + §2.6:
//
//   • magic_link — public portal at /portal/:orgId/*. Token delivered by
//     email as `?access_token=…` and lifted into sessionStorage on first
//     load. TTL is 7 days (list scope) / 30 days (per-ticket scope).
//
//   • verified   — embedded widget at /verified/:orgId/*. The SDK passes
//     `?email=…&sig=…` where sig = HMAC-SHA256(widget_secret, email). The
//     FE doesn't compute sig — it's provided by the embedding host (the
//     customer's SDK code).
//
// sessionStorage (not local) — closes-tab logs out. Magic-link/verified are
// both soft auth meant for the duration of a focused session.

const TOKEN_PREFIX = 'lira:portal-token:'
const VERIFIED_PREFIX = 'lira:portal-verified:'

export type PortalAuth =
  | { kind: 'magic_link'; orgId: string; token: string }
  | { kind: 'verified'; orgId: string; email: string; sig: string }

interface VerifiedCreds {
  email: string
  sig: string
}

// ── Magic-link token ─────────────────────────────────────────────────────

export function getPortalToken(orgId: string): string | null {
  try {
    return sessionStorage.getItem(`${TOKEN_PREFIX}${orgId}`)
  } catch {
    return null
  }
}

export function setPortalToken(orgId: string, token: string): void {
  try {
    sessionStorage.setItem(`${TOKEN_PREFIX}${orgId}`, token)
  } catch {
    /* sessionStorage blocked — caller will hit 401 and re-request the link. */
  }
}

export function clearPortalToken(orgId: string): void {
  try {
    sessionStorage.removeItem(`${TOKEN_PREFIX}${orgId}`)
  } catch {
    /* ignore */
  }
}

/**
 * If the current URL carries `?access_token=…`, persist it for this org and
 * return a cleaned-up search string (the param removed). Caller is responsible
 * for replacing the URL via `history.replaceState`.
 */
export function consumeAccessTokenFromUrl(
  orgId: string,
  search: string
): { cleanedSearch: string; token: string } | null {
  const params = new URLSearchParams(search)
  const token = params.get('access_token')
  if (!token) return null
  setPortalToken(orgId, token)
  params.delete('access_token')
  const cleaned = params.toString()
  return { cleanedSearch: cleaned ? `?${cleaned}` : '', token }
}

// ── Verified-SDK credentials ─────────────────────────────────────────────

export function getVerifiedCreds(orgId: string): VerifiedCreds | null {
  try {
    const raw = sessionStorage.getItem(`${VERIFIED_PREFIX}${orgId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw) as VerifiedCreds
    if (!parsed.email || !parsed.sig) return null
    return parsed
  } catch {
    return null
  }
}

export function setVerifiedCreds(orgId: string, creds: VerifiedCreds): void {
  try {
    sessionStorage.setItem(`${VERIFIED_PREFIX}${orgId}`, JSON.stringify(creds))
  } catch {
    /* ignore */
  }
}

export function clearVerifiedCreds(orgId: string): void {
  try {
    sessionStorage.removeItem(`${VERIFIED_PREFIX}${orgId}`)
  } catch {
    /* ignore */
  }
}

/**
 * Pull `?email=&sig=` off the URL on first load of a /verified/* page,
 * persist for the org, and return the cleaned search string. Same pattern
 * as `consumeAccessTokenFromUrl` — keeps the secret out of the address bar.
 */
export function consumeVerifiedCredsFromUrl(
  orgId: string,
  search: string
): { cleanedSearch: string; creds: VerifiedCreds } | null {
  const params = new URLSearchParams(search)
  const email = params.get('email')
  const sig = params.get('sig')
  if (!email || !sig) return null
  const creds = { email, sig }
  setVerifiedCreds(orgId, creds)
  params.delete('email')
  params.delete('sig')
  const cleaned = params.toString()
  return { cleanedSearch: cleaned ? `?${cleaned}` : '', creds }
}

// ── Resolver ─────────────────────────────────────────────────────────────

/**
 * Resolve the effective portal auth for an org. Verified takes precedence
 * when both happen to be set in the same session — verified is the more
 * trusted, longer-lived identity (the embedding SDK).
 */
export function getPortalAuth(orgId: string): PortalAuth | null {
  const verified = getVerifiedCreds(orgId)
  if (verified) {
    return { kind: 'verified', orgId, email: verified.email, sig: verified.sig }
  }
  const token = getPortalToken(orgId)
  if (token) return { kind: 'magic_link', orgId, token }
  return null
}

export function clearPortalAuth(orgId: string): void {
  clearPortalToken(orgId)
  clearVerifiedCreds(orgId)
}

// ── CSAT local cache ─────────────────────────────────────────────────────
//
// The §2 sanitized ticket response doesn't include CSAT state, so after
// the customer submits we need to remember it locally to hide the widget
// for the rest of the session. Keyed by ticket number (not id) since the
// portal addresses tickets by number throughout.

const CSAT_PREFIX = 'lira:portal-csat:'

export function markCsatSubmitted(orgId: string, ticketNumber: string, score: number): void {
  try {
    sessionStorage.setItem(`${CSAT_PREFIX}${orgId}:${ticketNumber}`, String(score))
  } catch {
    /* ignore */
  }
}

export function getSubmittedCsatScore(orgId: string, ticketNumber: string): number | null {
  try {
    const raw = sessionStorage.getItem(`${CSAT_PREFIX}${orgId}:${ticketNumber}`)
    if (raw === null) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  } catch {
    return null
  }
}
