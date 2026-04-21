/**
 * SEO Prerender Script
 *
 * Generates static HTML files for each public route with proper meta tags
 * baked into the HTML. This ensures crawlers (Bing, social media, etc.)
 * that don't execute JavaScript still get correct page titles, descriptions,
 * Open Graph tags, and structured data.
 *
 * Run after `vite build`:  node seo-prerender.cjs
 */

const fs = require('fs')
const path = require('path')

const DIST = path.join(__dirname, 'dist')
const BASE_URL = 'https://liraintelligence.com'
const SITE_NAME = 'Lira AI'
const DEFAULT_IMAGE = `${BASE_URL}/lira_black_with_white_backgound.png`

// ── Route SEO definitions ────────────────────────────────────────────────────

const ROUTES = [
  {
    path: '/',
    title: 'Lira AI — AI Meeting Participant, Sales Coach & Customer Support',
    description:
      'Lira AI is an intelligent meeting participant that joins your calls in real time. Automate sales coaching, customer support, and meeting transcription with AI-powered voice agents.',
    keywords:
      'AI meeting assistant, AI meeting participant, AI sales coaching, AI customer support, real-time transcription, meeting intelligence, voice AI agent, meeting notetaker, AI meeting bot, Lira AI',
  },
  {
    path: '/products/sales',
    title: 'AI Sales Coaching — Real-Time Objection Handling & Deal Intelligence',
    description:
      'Lira AI listens to every sales call in real time and tells you exactly what to say. AI-powered objection handling, battle card suggestions, deal coaching, win-rate analytics, and automatic CRM updates for Salesforce and HubSpot.',
    keywords:
      'AI sales coaching, sales call AI, objection handling AI, battle cards AI, deal coaching, CRM auto-fill, Salesforce AI, HubSpot AI, sales intelligence, competitive selling AI, revenue intelligence',
  },
  {
    path: '/products/customer-support',
    title: 'AI Customer Support — Voice Agent Grounded in Your Knowledge Base',
    description:
      'Lira AI handles inbound customer support calls 24/7 with a voice agent grounded in your documentation. Smart escalation, post-call summaries, and knowledge base gap identification.',
    keywords:
      'AI customer support, customer support automation, AI voice agent, knowledge base AI, support chatbot, AI phone support, automated support, help desk AI, AI call center',
  },
  {
    path: '/resources',
    title: 'Resources — Guides, Tutorials, Documentation & API Reference',
    description:
      'Everything you need to get started with Lira AI. Step-by-step guides, video tutorials, full documentation, and API reference for meetings, knowledge base, and integrations.',
    keywords: 'Lira AI documentation, API reference, meeting AI guides, getting started',
  },
  {
    path: '/tutorials',
    title: 'Tutorials — Learn Lira AI in Minutes',
    description:
      'Video tutorials and walkthroughs to help you get the most out of Lira AI. Set up meetings, configure sales coaching, and more.',
    keywords: 'Lira AI tutorials, video walkthrough, meeting AI tutorial, Lira AI demo',
  },
  {
    path: '/blog',
    title: 'Blog — AI, Meetings, Hiring & The Future of Work',
    description:
      'Ideas and insights on AI meeting intelligence, sales coaching, hiring automation, and building knowledge-driven teams. Read the latest from Lira AI.',
    keywords: 'AI meeting blog, sales coaching insights, hiring automation blog, Lira AI blog',
  },
  {
    path: '/blog/ai-interview-process',
    title: 'How AI is Transforming First-Round Interviews',
    description:
      "First-round interviews are the most time-consuming part of hiring — and the part where most bias creeps in. Here's how AI changes both.",
    keywords: 'AI interviewing, hiring consistency, competency scoring, bias reduction',
    type: 'article',
  },
  {
    path: '/blog/ai-sales-coaching',
    title: '5 Ways Lira Helps Sales Teams Close More Deals',
    description:
      'Real-time objection handling, competitive intelligence, deal-stage coaching, and post-call analysis. Five ways AI transforms your sales team.',
    keywords: 'AI sales tools, deal acceleration, sales coaching AI, objection handling',
    type: 'article',
  },
  {
    path: '/blog/knowledge-base-best-practices',
    title: 'Building a Knowledge Base Your AI Can Actually Use',
    description:
      'KB quality matters more than quantity. Learn how to structure your knowledge base, create canonical documents, and optimise for semantic search.',
    keywords: 'knowledge management, AI accuracy, semantic search, knowledge base best practices',
    type: 'article',
  },
  {
    path: '/blog/meeting-intelligence-future',
    title: 'The Meeting Is Only the Beginning',
    description:
      'Meeting intelligence goes beyond recording. Task extraction, decision logging, and organizational memory — how AI makes meetings actually useful.',
    keywords: 'meeting AI, organizational memory, task automation, meeting intelligence',
    type: 'article',
  },
  {
    path: '/security',
    title: 'Security — How Lira AI Protects Your Data',
    description:
      'TLS 1.2+ encryption, AES-256 at rest, OAuth 2.0 PKCE, SOC 2-compliant infrastructure, and OWASP Top 10 compliance. Learn how Lira AI protects your data.',
    keywords: 'Lira AI security, data protection, encryption, SOC 2, enterprise security',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy',
    description: 'Learn how Lira AI collects, uses, and protects your personal information.',
    keywords: 'privacy policy, data privacy, GDPR',
  },
  {
    path: '/terms',
    title: 'Terms of Service',
    description: 'Read the Lira AI Terms of Service governing your use of our platform.',
    keywords: 'terms of service, user agreement',
  },
  {
    path: '/cookies',
    title: 'Cookie Policy',
    description: 'Learn about the cookies Lira AI uses and how you can manage preferences.',
    keywords: 'cookie policy, website cookies',
  },
  {
    path: '/acceptable-use',
    title: 'Acceptable Use Policy',
    description: 'Rules and guidelines for using the Lira AI platform.',
    keywords: 'acceptable use, platform rules',
  },
  {
    path: '/demo',
    canonicalUrl: 'https://demo.liraintelligence.com',
    standaloneTitle: true,
    noIndex: true,
    title: 'Nimbus — Finance & Accounting Software for Growing Businesses',
    description:
      'Nimbus is cloud-based finance and accounting software for SMBs. Send invoices, track expenses, run reports, and manage payroll — all in one place. Start your 14-day free trial.',
    keywords:
      'accounting software, invoicing software, expense tracking, payroll, SMB finance, cloud accounting, Nimbus Finance, financial reporting, multi-currency invoicing, recurring billing',
  },
]

// ── Generate HTML for each route ─────────────────────────────────────────────

function generateMeta(route) {
  const fullTitle =
    route.path === '/' || route.standaloneTitle ? route.title : `${route.title} | ${SITE_NAME}`
  const url = route.canonicalUrl ?? `${BASE_URL}${route.path}`
  const robots = route.noIndex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
  const ogType = route.type === 'article' ? 'article' : 'website'

  return `
    <title>${fullTitle}</title>
    <meta name="title" content="${fullTitle}" />
    <meta name="description" content="${route.description}" />
    <meta name="keywords" content="${route.keywords}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="${robots}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:image" content="${DEFAULT_IMAGE}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="en_US" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${route.description}" />
    <meta name="twitter:image" content="${DEFAULT_IMAGE}" />`
}

function run() {
  const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8')
  let created = 0

  for (const route of ROUTES) {
    // Skip root – the index.html already has these tags
    if (route.path === '/') continue

    // Build the per-route HTML by replacing the default meta tags
    let html = indexHtml

    // Replace the <title> tag
    html = html.replace(/<title>[^<]*<\/title>/, '')

    // Insert route-specific meta right after <head>
    const metaTags = generateMeta(route)
    html = html.replace('<head>', `<head>${metaTags}`)

    // Remove duplicate default meta description (keep route-specific one)
    const descMatch = html.match(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g)
    if (descMatch && descMatch.length > 1) {
      // Remove only the second occurrence (the original default)
      let found = 0
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g, (m) => {
        found++
        return found > 1 ? '' : m
      })
    }

    // Create directory structure
    const routeDir = path.join(DIST, route.path)
    fs.mkdirSync(routeDir, { recursive: true })
    fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8')
    created++
  }

  console.log(`✓ SEO prerender: generated ${created} static HTML files`)
}

run()
