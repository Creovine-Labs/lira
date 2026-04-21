import { next, rewrite } from '@vercel/edge'

export const config = {
  // Only run on the root path — avoids touching assets, APIs, and sub-routes.
  matcher: '/',
}

/**
 * Serve the prerendered Nimbus demo page (`/demo/index.html`) when the
 * request arrives on the `demo.liraintelligence.com` host. This ensures
 * crawlers and server-side scrapers see Nimbus metadata (title, description,
 * OG tags) instead of Lira's default landing page HTML.
 */
export default function middleware(request: Request) {
  const host = request.headers.get('host') ?? ''
  if (host === 'demo.liraintelligence.com') {
    const url = new URL(request.url)
    url.pathname = '/demo/index.html'
    return rewrite(url)
  }
  return next()
}
