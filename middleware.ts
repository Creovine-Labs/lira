import { next, rewrite } from '@vercel/edge'

export const config = {
  // Run on all paths so we can handle /support on the demo host.
  matcher: '/(.*)',
}

/**
 * Demo host routing:
 *  - /support or /support/*  → serve portal in a full-viewport iframe
 *                               so the URL stays on demo.liraintelligence.com
 *  - /                       → rewrite to prerendered Nimbus demo HTML
 */
export default function middleware(request: Request) {
  const host = request.headers.get('host') ?? ''
  if (host === 'demo.liraintelligence.com') {
    const url = new URL(request.url)

    // /support/** → embed portal inline (URL stays on Nimbus domain)
    if (url.pathname === '/support' || url.pathname.startsWith('/support/')) {
      const subpath = url.pathname.replace(/^\/support/, '') || '/'
      const portalSrc = `https://support.liraintelligence.com/nimbus${subpath}${url.search}`
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nimbus Support</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
  </style>
</head>
<body>
  <iframe
    src="${portalSrc}"
    allow="microphone; camera; clipboard-write"
    allowfullscreen
  ></iframe>
</body>
</html>`
      return new Response(html, {
        headers: { 'content-type': 'text/html;charset=utf-8' },
      })
    }

    // Sub-pages → dedicated static HTML (crawled independently by the KB)
    // This mirrors a real multi-page website: each topic has its own URL.
    if (url.pathname === '/integrations' || url.pathname === '/integrations/') {
      url.pathname = '/demo/integrations/index.html'
      return rewrite(url)
    }
    if (url.pathname === '/pricing' || url.pathname === '/pricing/') {
      url.pathname = '/demo/pricing/index.html'
      return rewrite(url)
    }
    if (url.pathname === '/faq' || url.pathname === '/faq/') {
      url.pathname = '/demo/faq/index.html'
      return rewrite(url)
    }

    // Root → serve prerendered Nimbus page
    if (url.pathname === '/') {
      url.pathname = '/demo/index.html'
      return rewrite(url)
    }
  }
  return next()
}
