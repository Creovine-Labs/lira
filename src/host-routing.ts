/**
 * Two-host split:
 *   liraintelligence.com      → marketing (landing, pricing, product, legal, docs…)
 *   app.liraintelligence.com  → auth + the product (login/signup, dashboard, support, settings…)
 *
 * Auth lives in localStorage, which is per-origin, so login MUST happen on the
 * app subdomain — the apex only *links into* it. This module hard-redirects a
 * request to the correct host so each URL has one canonical home.
 *
 * Only active on the real domains — localhost, *.vercel.app previews, and the
 * demo subdomain are left completely alone.
 */

const APEX = 'liraintelligence.com'
const WWW = 'www.liraintelligence.com'
const APP = 'app.liraintelligence.com'

/** True when we're on the product subdomain. */
export function isAppHost(): boolean {
  return typeof window !== 'undefined' && window.location.hostname === APP
}

/** Public marketing paths — these belong on the apex. Everything else is the app. */
function isMarketingPath(pathname: string): boolean {
  if (pathname === '/') return true
  return /^\/(v3|v4|pricing|products|demo|for|resources|docs|tutorials|blog|about|about-us|features?|careers|book-demo|contact|privacy|terms|cookies|acceptable-use|refund|security|ui-lab|launch-demo)(\/|$)/.test(
    pathname
  )
}

/** Customer-facing / embedded surfaces that must work on whatever host linked them. */
function isNeutralPath(pathname: string): boolean {
  return /^\/(portal|verified)(\/|$)/.test(pathname)
}

/**
 * If the current (host, path) pair is on the wrong host, redirect to the right
 * one. Returns true if a redirect was triggered (caller can stop rendering).
 */
export function enforceHostRouting(): boolean {
  if (typeof window === 'undefined') return false
  const { hostname, pathname, search, hash } = window.location

  // Only the two real hosts participate. Anything else (localhost, previews,
  // demo.liraintelligence.com) is untouched.
  if (hostname !== APEX && hostname !== WWW && hostname !== APP) return false
  if (isNeutralPath(pathname)) return false

  const onApp = hostname === APP
  const marketing = isMarketingPath(pathname)

  // Marketing page requested on the app subdomain → send to the apex.
  // ('/' on the app subdomain is left alone — RootRoute sends it to the app.)
  if (onApp && marketing && pathname !== '/') {
    window.location.replace(`https://${APEX}${pathname}${search}${hash}`)
    return true
  }

  // App / auth page requested on the apex (or www) → send to the app subdomain.
  if (!onApp && !marketing) {
    window.location.replace(`https://${APP}${pathname}${search}${hash}`)
    return true
  }

  return false
}
