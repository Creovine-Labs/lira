import { next, rewrite } from '@vercel/edge'

export const config = {
  // Run on all paths so we can handle /support on the demo host too.
  matcher: '/(.*)',
}

/**
 * Demo host routing:
 *  - /support  → redirect to the Nimbus support portal
 *  - /          → rewrite to prerendered Nimbus demo HTML
 */
export default function middleware(request: Request) {
  const host = request.headers.get('host') ?? ''
  if (host === 'demo.liraintelligence.com') {
    const url = new URL(request.url)

    // /support or /support/* → redirect to portal
    if (url.pathname === '/support' || url.pathname.startsWith('/support/')) {
      const portalUrl = new URL(url.pathname.replace(/^\/support/, ''), 'https://support.liraintelligence.com/nimbus')
      return Response.redirect(portalUrl.toString(), 302)
    }

    // Root → serve prerendered Nimbus page
    if (url.pathname === '/') {
      url.pathname = '/demo/index.html'
      return rewrite(url)
    }
  }
  return next()
}
