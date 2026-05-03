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
    title: 'Lira · Conversational Intelligence Platform',
    description:
      'Lira is a Conversational Intelligence platform. One AI agent that handles customer support, coaches sales calls, and runs meetings, grounded in your knowledge and responding in real time.',
    keywords:
      'conversational intelligence platform, AI customer support agent, AI support automation, real-time sales coaching AI, AI meeting assistant, voice AI agent, knowledge-grounded AI, conversational AI for SaaS, AI agent grounded in knowledge base, Lira AI',
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

// ── Full static Nimbus page (KB-crawlable) ───────────────────────────────────
// The KB crawler doesn't execute JavaScript, so the SPA shell gives it nothing.
// This generates a complete standalone HTML page with all Nimbus content baked
// in — pricing, FAQ, features, integrations, refund policy, security, etc.
// The middleware rewrites demo.liraintelligence.com/ → /demo/index.html, so
// this is what both crawlers and real visitors receive.

function generateNimbusHtml(orgId, widgetSecret) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nimbus — Finance &amp; Accounting Software for Growing Businesses</title>
  <meta name="description" content="Nimbus is cloud-based finance and accounting software for SMBs. Send invoices, track expenses, run reports, and manage payroll — all in one place. Start your 14-day free trial." />
  <meta name="keywords" content="accounting software, invoicing software, expense tracking, payroll, SMB finance, cloud accounting, Nimbus Finance, financial reporting, multi-currency invoicing, recurring billing" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: #fafaf7; color: #0f172a; line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    /* nav */
    header { background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 40; }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; max-width: 1100px; margin: 0 auto; }
    .nav-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.1rem; }
    .nav-links { display: flex; gap: 32px; font-size: 0.875rem; font-weight: 500; color: #475569; }
    .nav-links a:hover { color: #0f172a; }
    .btn-primary { background: #0f172a; color: #fff; padding: 8px 18px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
    .btn-primary:hover { background: #1e293b; }
    /* sections */
    section { padding: 80px 24px; }
    .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; text-align: center; }
    h1 { font-size: clamp(2rem, 5vw, 3.25rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
    h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -0.01em; }
    h3 { font-size: 1rem; font-weight: 600; }
    .subtitle { color: #475569; max-width: 600px; margin: 0 auto; }
    /* hero */
    .hero { text-align: center; padding: 96px 24px 80px; background: linear-gradient(180deg, #fff 0%, #fafaf7 100%); border-bottom: 1px solid #e2e8f0; }
    .hero h1 { margin-top: 16px; }
    .hero p { margin-top: 20px; font-size: 1.1rem; color: #475569; max-width: 560px; margin-left: auto; margin-right: auto; }
    .hero-btns { margin-top: 36px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .btn-outline { border: 1px solid #cbd5e1; padding: 10px 22px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; color: #334155; }
    .logos { display: flex; flex-wrap: wrap; gap: 24px 40px; justify-content: center; margin-top: 56px; color: #94a3b8; font-size: 0.8rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
    /* features grid */
    .grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 48px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; }
    .card h3 { margin-bottom: 10px; }
    .card p { font-size: 0.875rem; color: #475569; }
    /* pricing */
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 48px; }
    .pricing-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; }
    .pricing-card.highlight { background: #0f172a; color: #fff; border-color: #0f172a; }
    .pricing-card .plan-name { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; }
    .pricing-card .price { font-size: 2.5rem; font-weight: 800; margin-top: 12px; }
    .pricing-card .price span { font-size: 0.9rem; font-weight: 400; opacity: 0.6; }
    .pricing-card .seats { font-size: 0.8rem; opacity: 0.6; margin-top: 4px; }
    .pricing-card ul { margin-top: 24px; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .pricing-card ul li { font-size: 0.875rem; }
    .pricing-card ul li::before { content: "• "; }
    .pricing-card .btn-plan { display: block; text-align: center; margin-top: 28px; padding: 10px 20px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
    .pricing-card:not(.highlight) .btn-plan { background: #0f172a; color: #fff; }
    .pricing-card.highlight .btn-plan { background: #fff; color: #0f172a; }
    /* faq */
    .faq-list { max-width: 760px; margin: 48px auto 0; display: flex; flex-direction: column; gap: 0; }
    .faq-item { border-bottom: 1px solid #e2e8f0; padding: 24px 0; }
    .faq-item h3 { font-size: 0.95rem; color: #0f172a; }
    .faq-item p { margin-top: 8px; font-size: 0.875rem; color: #475569; }
    /* integrations */
    .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 40px; }
    .int-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
    .int-card h3 { font-size: 0.9rem; margin-bottom: 6px; }
    .int-card p { font-size: 0.8rem; color: #475569; }
    /* steps */
    .steps { display: flex; flex-direction: column; gap: 24px; max-width: 700px; margin: 40px auto 0; }
    .step { display: flex; gap: 20px; align-items: flex-start; }
    .step-num { width: 36px; height: 36px; border-radius: 50%; background: #0f172a; color: #fff; font-weight: 700; font-size: 0.875rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .step-body h3 { font-size: 0.95rem; }
    .step-body p { font-size: 0.875rem; color: #475569; margin-top: 4px; }
    /* security */
    .security-section { background: #f1f5f9; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .security-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 40px; }
    .sec-item { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; font-size: 0.875rem; }
    .sec-item strong { display: block; margin-bottom: 4px; font-size: 0.9rem; }
    /* support scenarios */
    .scenario-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 40px; }
    .scenario-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; text-align: left; }
    .scenario-card h3 { margin-bottom: 10px; }
    .scenario-card p { color: #475569; font-size: 0.875rem; }
    .scenario-prompt { margin-top: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; padding: 14px; }
    .scenario-prompt strong { display: block; color: #64748b; font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }
    .scenario-prompt span { color: #0f172a; font-size: 0.9rem; font-weight: 600; }
    /* footer */
    footer { background: #0f172a; color: #94a3b8; padding: 48px 24px; font-size: 0.8rem; text-align: center; }
    footer a { color: #cbd5e1; }
    footer a:hover { color: #fff; }
    .footer-links { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
    .bg-slate { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .mt-3 { margin-top: 12px; }
  </style>
</head>
<body>

  <!-- Verified test visitor banner (only appears with ?visitor=test) -->
  <div id="lira-test-visitor-banner" style="display:none;position:sticky;top:0;z-index:50;background:#fbbf24;color:#0f172a;padding:8px 16px;font-size:0.875rem;font-weight:600;text-align:center;border-bottom:1px solid #f59e0b;">
    Signed in as Jane Smith (jane@nimbus.test) — verified test customer mode
  </div>

  <!-- Navigation -->
  <header>
    <div class="nav-inner">
      <a href="#top" class="nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="24" height="24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A5.5 5.5 0 0 1 19 16H4z"/>
        </svg>
        Nimbus
      </a>
      <nav class="nav-links">
        <a href="#product">Product</a>
        <a href="/integrations">Integrations</a>
        <a href="/pricing">Pricing</a>
        <a href="/faq">FAQ</a>
      </nav>
      <div style="display:flex;gap:12px;align-items:center;">
        <a href="/pricing" style="font-size:0.875rem;font-weight:500;color:#475569;">Log in</a>
        <a href="/pricing" class="btn-primary">Start free</a>
      </div>
    </div>
  </header>

  <!-- Hero -->
  <section class="hero" id="top">
    <div class="section-label">Finance &amp; Accounting · Built for SMBs</div>
    <h1>Get paid faster.<br/>Stress about money less.</h1>
    <p>Nimbus handles your invoices, expenses, payroll, and reporting — so you can focus on running your business, not your spreadsheets.</p>
    <div class="hero-btns">
      <a href="#pricing" class="btn-primary" style="padding:12px 28px;font-size:1rem;">Start 14-day free trial</a>
      <a href="#product" class="btn-outline" style="padding:12px 28px;font-size:1rem;">See how it works</a>
    </div>
    <div class="logos">
      <span>Arcadia</span><span>Northwind</span><span>Kite &amp; Co</span><span>Halcyon</span><span>Foxglove</span><span>Lumen Studio</span>
    </div>
  </section>

  <!-- Product / Features -->
  <section id="product">
    <div class="container">
      <div class="section-label">Product</div>
      <h2 class="text-center mt-3">Everything your finance team needs</h2>
      <p class="subtitle text-center mt-4">From day-one invoicing to multi-entity consolidation — Nimbus grows with you.</p>
      <div class="grid-3">
        <div class="card">
          <h3>Invoices that get paid in days, not weeks</h3>
          <p>Create and send branded invoices in under a minute. Automatic payment reminders kick in at 3, 7, and 14 days overdue. Customers pay with one click via Stripe, ACH, or credit card. Nimbus customers reduce average days-to-payment from 42 to 11.</p>
        </div>
        <div class="card">
          <h3>Expenses without the spreadsheet tax</h3>
          <p>Snap a receipt, tag the project, assign to a client — done. Nimbus OCR extracts vendor, amount, date, and tax automatically. Mileage tracking runs in the background on iOS and Android. Everything reconciles nightly against your bank and credit card feeds.</p>
        </div>
        <div class="card">
          <h3>Reporting your CFO will actually read</h3>
          <p>Cash flow, runway, MRR, and project profitability surfaced in plain English. Every chart has a "why did this change?" button that writes a plain-language summary. Export to PDF, CSV, or a live-updating Google Sheets link.</p>
        </div>
        <div class="card">
          <h3>Recurring billing on autopilot</h3>
          <p>Subscriptions, retainers, milestone-based contracts — all in one place. Proration, dunning, and failed-payment recovery are automatic. Connect Stripe, Braintree, Paddle, or GoCardless.</p>
        </div>
        <div class="card">
          <h3>Multi-currency from day one</h3>
          <p>Invoice in 136 currencies, get paid in any of them. Daily FX rates from the European Central Bank. Automatic gain/loss journal entries on settlement.</p>
        </div>
        <div class="card">
          <h3>Built for teams, not accountants</h3>
          <p>Designers, project managers, and ops people can log expenses and mark invoices paid without double-entry bookkeeping training. Role-based permissions keep the general ledger locked down.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Integrations -->
  <section class="bg-slate" id="integrations">
    <div class="container">
      <div class="section-label">Integrations</div>
      <h2 class="text-center mt-3">Works with the tools you already use</h2>
      <div class="integrations-grid">
        <div class="int-card"><h3>Stripe</h3><p>Accept cards, ACH, and Apple Pay. Payouts reconciled automatically.</p></div>
        <div class="int-card"><h3>QuickBooks Online</h3><p>Yes, Nimbus integrates with QuickBooks Online. Two-way sync of invoices, payments, and chart of accounts. Real-time reconciliation — no manual exports needed.</p></div>
        <div class="int-card"><h3>Xero</h3><p>Push nightly or trigger sync on every invoice.</p></div>
        <div class="int-card"><h3>Slack</h3><p>Get pinged in #finance when invoices are paid, overdue, or disputed.</p></div>
        <div class="int-card"><h3>Google Workspace</h3><p>SSO, calendar-based billing, and Drive attachments on invoices.</p></div>
        <div class="int-card"><h3>Zapier</h3><p>800+ no-code triggers and actions. Build automations we haven't.</p></div>
        <div class="int-card"><h3>HubSpot</h3><p>Auto-create a Nimbus customer when a HubSpot deal moves to Closed Won.</p></div>
        <div class="int-card"><h3>Plaid</h3><p>Connect any US, UK, or EU bank account. Balances refreshed every 2 hours.</p></div>
      </div>
    </div>
  </section>

  <!-- Pricing -->
  <section class="bg-slate" id="pricing">
    <div class="container">
      <div class="section-label">Pricing</div>
      <h2 class="text-center mt-3">Simple pricing. No seat tax.</h2>
      <p class="subtitle text-center mt-4">All plans include unlimited invoices, unlimited expenses, and a free accountant seat. Save 20% with annual billing.</p>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="plan-name">Starter</div>
          <div class="price">$19<span>/mo</span></div>
          <div class="seats">Up to 3 users</div>
          <ul>
            <li>Unlimited invoices and expenses</li>
            <li>Receipt OCR + mileage tracking</li>
            <li>Stripe + ACH payments</li>
            <li>Basic cash-flow reporting</li>
            <li>Email support (24h SLA)</li>
          </ul>
          <a href="#help" class="btn-plan">Start free trial</a>
        </div>
        <div class="pricing-card highlight">
          <div class="plan-name">Growth — Most Popular</div>
          <div class="price">$49<span>/mo</span></div>
          <div class="seats">Up to 15 users</div>
          <ul>
            <li>Everything in Starter, plus:</li>
            <li>Recurring billing &amp; subscriptions</li>
            <li>Multi-currency (136 supported)</li>
            <li>QuickBooks / Xero two-way sync</li>
            <li>Slack notifications</li>
            <li>Priority chat support (4h SLA)</li>
          </ul>
          <a href="#help" class="btn-plan">Start free trial</a>
        </div>
        <div class="pricing-card">
          <div class="plan-name">Business</div>
          <div class="price">$129<span>/mo</span></div>
          <div class="seats">Unlimited users</div>
          <ul>
            <li>Everything in Growth, plus:</li>
            <li>SSO (SAML, OIDC)</li>
            <li>Audit log export</li>
            <li>Custom approval workflows</li>
            <li>Multi-entity consolidation (up to 10)</li>
            <li>Dedicated success manager</li>
            <li>99.95% uptime SLA</li>
          </ul>
          <a href="#help" class="btn-plan">Start free trial</a>
        </div>
      </div>
      <p style="text-align:center;margin-top:24px;font-size:0.875rem;color:#475569;">
        Questions about pricing? Ask our AI support agent — click the chat bubble below and ask "How much does Nimbus cost?"
      </p>
    </div>
  </section>

  <!-- Security -->
  <section class="security-section" id="security">
    <div class="container">
      <div class="section-label">Security &amp; Compliance</div>
      <h2 class="text-center mt-3">Enterprise-grade security, without the sales call</h2>
      <p class="subtitle text-center mt-4">Your financial data is encrypted, audited, and stored only where you want it.</p>
      <div class="security-grid">
        <div class="sec-item"><strong>Encryption</strong>AES-256 at rest. TLS 1.2+ in transit. Keys rotated quarterly.</div>
        <div class="sec-item"><strong>Authentication</strong>OAuth 2.0 PKCE flow. Optional MFA (TOTP / hardware key). SSO on Business plan.</div>
        <div class="sec-item"><strong>SOC 2 Type II</strong>Certified. Annual audits by Prescient Assurance. Report available on request.</div>
        <div class="sec-item"><strong>GDPR</strong>DPA available on request. EU data residency on Growth + Business plans (AWS eu-west-1 Ireland).</div>
        <div class="sec-item"><strong>Data storage</strong>AWS us-east-1 (N. Virginia) by default. EU customers can request eu-west-1 at no extra cost.</div>
        <div class="sec-item"><strong>Payment card data</strong>We never store raw card numbers. All payments tokenised by Stripe (PCI DSS Level 1).</div>
        <div class="sec-item"><strong>Penetration testing</strong>Annual third-party pen test. Summary available to enterprise prospects under NDA.</div>
        <div class="sec-item"><strong>Uptime</strong>99.95% SLA on Business plan. Status page at status.nimbus.finance. Incidents communicated within 15 min.</div>
      </div>
    </div>
  </section>

  <!-- Getting Started -->
  <section id="getting-started">
    <div class="container">
      <div class="section-label">Getting Started</div>
      <h2 class="text-center mt-3">Up and running in under 5 minutes</h2>
      <div class="steps">
        <div class="step"><div class="step-num">1</div><div class="step-body"><h3>Create your workspace</h3><p>Sign up at app.nimbus.finance with your work email. Setup takes under 60 seconds.</p></div></div>
        <div class="step"><div class="step-num">2</div><div class="step-body"><h3>Connect your bank</h3><p>Plaid-powered connection to any US, UK, or EU bank. Balances sync every 2 hours. Encrypted end-to-end.</p></div></div>
        <div class="step"><div class="step-num">3</div><div class="step-body"><h3>Import existing data</h3><p>One-click import from QuickBooks, Xero, FreshBooks, Wave, or CSV. Customer records, invoice numbers, and payment history all preserved.</p></div></div>
        <div class="step"><div class="step-num">4</div><div class="step-body"><h3>Send your first invoice</h3><p>Click New Invoice, pick a customer, add line items, hit Send. Your customer pays with one click. You get a Slack ping when it clears.</p></div></div>
        <div class="step"><div class="step-num">5</div><div class="step-body"><h3>Invite your team</h3><p>Roles: owner, admin, member, accountant (free seat), viewer. Every action is logged for audit.</p></div></div>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section class="bg-slate" id="faq">
    <div class="container">
      <div class="section-label">FAQ</div>
      <h2 class="text-center mt-3">Common questions</h2>
      <div class="faq-list">
        <div class="faq-item"><h3>How long is the free trial and do I need a credit card?</h3><p>Nimbus is free for 14 days on any plan. No credit card required to start. On day 14 you pick a plan or your account is paused — we never auto-charge without an explicit action.</p></div>
        <div class="faq-item"><h3>What does Nimbus cost and what's the difference between the plans?</h3><p>Starter is $19/month for up to 3 users — includes unlimited invoices, expenses, and reporting. Growth is $49/month for up to 15 users — adds recurring billing, multi-currency, and QuickBooks/Xero sync. Business is $129/month for unlimited users — adds SSO, advanced permissions, audit logs, custom approval workflows, multi-entity consolidation, and priority support.</p></div>
        <div class="faq-item"><h3>Do you offer an annual discount?</h3><p>Yes. Pay annually and save 20% on any plan. Switch between monthly and annual at any time from Settings → Billing.</p></div>
        <div class="faq-item"><h3>Do you offer refunds?</h3><p>Yes. Cancel within 30 days of your first paid charge and we refund the full amount, no questions asked. After 30 days we prorate refunds for annual plans. Monthly plans are not prorated past the 30-day window. This is our 30-day money-back guarantee.</p></div>
        <div class="faq-item"><h3>How do I cancel my subscription?</h3><p>Go to Settings → Billing → Cancel subscription. Your account stays active until the end of the billing period. You can export all your data at any time — we keep a read-only copy for 90 days after cancellation.</p></div>
        <div class="faq-item"><h3>Can I import data from QuickBooks, Xero, or FreshBooks?</h3><p>Yes. One-click imports from QuickBooks Online, Xero, FreshBooks, and Wave. CSV imports for any other tool. Historical data up to 24 months is preserved.</p></div>
        <div class="faq-item"><h3>Where is my data stored?</h3><p>All customer data is stored in AWS us-east-1 (N. Virginia) by default. EU customers can request data residency in eu-west-1 (Ireland) at no extra cost — available on Growth and Business plans.</p></div>
        <div class="faq-item"><h3>Is Nimbus SOC 2 compliant?</h3><p>Yes. We are SOC 2 Type II certified with annual audits by Prescient Assurance. Request our latest SOC 2 report from legal@nimbus.finance. We are also GDPR compliant with a signed DPA available on request.</p></div>
        <div class="faq-item"><h3>Do you integrate with QuickBooks?</h3><p>Yes, Nimbus integrates with QuickBooks Online. The integration supports two-way sync of invoices, payments, and chart of accounts in real time. You can connect QuickBooks under Settings → Integrations. We also integrate with Xero, FreshBooks, and Wave for accounting sync.</p></div>
        <div class="faq-item"><h3>What happens if I go over my user limit?</h3><p>Nothing breaks. We notify you by email and in-app. You have 14 days to remove users or upgrade. We never auto-upgrade your plan.</p></div>
        <div class="faq-item"><h3>Do you support multi-entity accounting?</h3><p>Yes, on the Business plan. Run up to 10 legal entities under one login, with inter-company invoices, consolidated reporting, and separate tax profiles per entity.</p></div>
        <div class="faq-item"><h3>Is there a mobile app?</h3><p>Yes. iOS and Android apps are free with any plan. Create invoices, approve expenses, upload receipts, and view cash flow from your phone. Offline mode syncs when you're back online.</p></div>
        <div class="faq-item"><h3>How do I contact support?</h3><p>The fastest way is the chat bubble in the bottom-right corner — our AI agent answers instantly 24/7 and escalates to a human when needed. You can also email support@nimbus.finance (Mon–Fri, 9am–6pm GMT, 4-hour response) or book a call at nimbus.finance/book.</p></div>
      </div>
    </div>
  </section>

  <!-- Support Scenarios -->
  <section class="bg-slate" id="support-scenarios">
    <div class="container">
      <div class="section-label">Support scenarios</div>
      <h2 class="text-center mt-3">Need help with billing or a technical issue?</h2>
      <p class="subtitle text-center mt-4">Use the chat bubble in the bottom-right corner and describe the issue in your own words. These examples are useful for testing Nimbus support handoff and email actions.</p>
      <div class="scenario-grid">
        <div class="scenario-card">
          <h3>Billing issue</h3>
          <p>If an invoice keeps failing, your account is charged incorrectly, or you need finance to follow up, send the details through chat. Nimbus support will review the account and follow up by email when needed.</p>
          <div class="scenario-prompt"><strong>Try asking</strong><span>“My invoice keeps failing and I haven't been charged correctly. I need someone from your finance team to investigate and follow up with me by email.”</span></div>
        </div>
        <div class="scenario-card">
          <h3>Technical issue</h3>
          <p>If receipt upload, bank sync, QuickBooks/Xero sync, or recurring billing stops working, describe what you were trying to do and the error you saw. Nimbus support can troubleshoot from the conversation and escalate when the fix needs an engineer.</p>
          <div class="scenario-prompt"><strong>Try asking</strong><span>“QuickBooks sync has failed three times today and my invoices are not updating. Can support investigate and follow up?”</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Contact / Help -->
  <section id="help">
    <div class="container text-center">
      <div class="section-label">Support</div>
      <h2 class="mt-3">We're here when you need us</h2>
      <p class="subtitle mt-4" style="margin:16px auto 0;">
        Chat with our AI support agent 24/7 using the bubble in the bottom-right corner.
        For account issues email <a href="mailto:support@nimbus.finance" style="color:#3730a3;">support@nimbus.finance</a>.
        Business plan customers get a dedicated success manager.
      </p>
      <div style="margin-top:40px;display:flex;gap:16px;justify-content:center;flex-wrap:wrap;">
        <a href="#pricing" class="btn-primary" style="padding:12px 28px;font-size:1rem;">Start free trial</a>
        <a href="#faq" class="btn-outline" style="padding:12px 28px;font-size:1rem;">Browse FAQ</a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer>
    <div class="container">
      <div style="font-weight:700;font-size:1rem;color:#fff;">Nimbus</div>
      <div style="margin-top:8px;">Finance &amp; accounting software for growing teams.</div>
      <div class="footer-links">
        <a href="/pricing">Pricing</a>
        <a href="/integrations">Integrations</a>
        <a href="/faq">FAQ</a>
        <a href="mailto:support@nimbus.finance">support@nimbus.finance</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
      <div style="margin-top:24px;opacity:0.5;">&copy; 2026 Nimbus Finance, Inc. All rights reserved.</div>
    </div>
  </footer>

  <!-- Lira support widget -->
  <script>
    (function() {
      var ORG_ID = ${JSON.stringify(orgId)};
      var WIDGET_SECRET = ${JSON.stringify(widgetSecret || '')};
      var TEST_EMAIL = 'jane@nimbus.test';
      var TEST_NAME = 'Jane Smith';

      function hexFromBuffer(buf) {
        var bytes = new Uint8Array(buf);
        var s = '';
        for (var i = 0; i < bytes.length; i++) {
          s += bytes[i].toString(16).padStart(2, '0');
        }
        return s;
      }

      async function hmacSha256Hex(secret, msg) {
        var enc = new TextEncoder();
        var key = await crypto.subtle.importKey(
          'raw', enc.encode(secret),
          { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        var sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
        return hexFromBuffer(sig);
      }

      async function mount() {
        var params = new URLSearchParams(window.location.search);
        var orgFromQuery = params.get('org');
        var orgId = orgFromQuery || ORG_ID;
        var testMode = params.get('visitor') === 'test';

        var script = document.createElement('script');
        script.src = 'https://widget.liraintelligence.com/v1/widget.js';
        script.async = true;
        script.setAttribute('data-org-id', orgId);
        script.setAttribute('data-position', 'bottom-right');

        if (testMode && WIDGET_SECRET) {
          try {
            var sig = await hmacSha256Hex(WIDGET_SECRET, TEST_EMAIL);
            script.setAttribute('data-email', TEST_EMAIL);
            script.setAttribute('data-name', TEST_NAME);
            script.setAttribute('data-sig', sig);
            var banner = document.getElementById('lira-test-visitor-banner');
            if (banner) banner.style.display = 'block';
          } catch (e) {
            console.error('[nimbus] failed to sign test visitor', e);
          }
        }

        document.body.appendChild(script);
      }

      mount();
    })();
  </script>

</body>
</html>`
}

// ── Nimbus sub-pages (KB-crawlable dedicated pages) ─────────────────────────
// A real customer website has separate pages for integrations, pricing, and FAQ.
// Each page is crawled independently by the KB — no single-page chunk limits.
// These pages mirror that structure so any fix here is a real-website fix.

const NIMBUS_CSS = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: #fafaf7; color: #0f172a; line-height: 1.6; }
    a { color: inherit; text-decoration: none; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
    header { background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 40; }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; max-width: 1100px; margin: 0 auto; }
    .nav-logo { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.1rem; }
    .nav-links { display: flex; gap: 32px; font-size: 0.875rem; font-weight: 500; color: #475569; }
    .nav-links a:hover { color: #0f172a; }
    .btn-primary { background: #0f172a; color: #fff; padding: 8px 18px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
    section { padding: 80px 24px; }
    .section-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #94a3b8; text-align: center; }
    h1 { font-size: clamp(1.75rem, 4vw, 2.75rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
    h2 { font-size: clamp(1.5rem, 4vw, 2.5rem); font-weight: 700; letter-spacing: -0.01em; }
    h3 { font-size: 1rem; font-weight: 600; }
    .subtitle { color: #475569; max-width: 600px; margin: 0 auto; }
    .page-hero { text-align: center; padding: 64px 24px 56px; background: linear-gradient(180deg, #fff 0%, #fafaf7 100%); border-bottom: 1px solid #e2e8f0; }
    .btn-outline { border: 1px solid #cbd5e1; padding: 10px 22px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; color: #334155; }
    .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 48px; }
    .pricing-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 32px; }
    .pricing-card.highlight { background: #0f172a; color: #fff; border-color: #0f172a; }
    .pricing-card .plan-name { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; }
    .pricing-card .price { font-size: 2.5rem; font-weight: 800; margin-top: 12px; }
    .pricing-card .price span { font-size: 0.9rem; font-weight: 400; opacity: 0.6; }
    .pricing-card .seats { font-size: 0.8rem; opacity: 0.6; margin-top: 4px; }
    .pricing-card ul { margin-top: 24px; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .pricing-card ul li { font-size: 0.875rem; }
    .pricing-card ul li::before { content: "• "; }
    .pricing-card .btn-plan { display: block; text-align: center; margin-top: 28px; padding: 10px 20px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
    .pricing-card:not(.highlight) .btn-plan { background: #0f172a; color: #fff; }
    .pricing-card.highlight .btn-plan { background: #fff; color: #0f172a; }
    .faq-list { max-width: 760px; margin: 48px auto 0; display: flex; flex-direction: column; gap: 0; }
    .faq-item { border-bottom: 1px solid #e2e8f0; padding: 24px 0; }
    .faq-item h3 { font-size: 0.95rem; color: #0f172a; }
    .faq-item p { margin-top: 8px; font-size: 0.875rem; color: #475569; }
    .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 48px; }
    .int-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; }
    .int-card h3 { font-size: 0.95rem; margin-bottom: 8px; }
    .int-card p { font-size: 0.875rem; color: #475569; }
    .bg-slate { background: #f8fafc; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .text-center { text-align: center; }
    .mt-4 { margin-top: 16px; }
    .mt-3 { margin-top: 12px; }
    footer { background: #0f172a; color: #94a3b8; padding: 48px 24px; font-size: 0.8rem; text-align: center; }
    footer a { color: #cbd5e1; }
    .footer-links { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
`

function nimbusNav() {
  return `
  <header>
    <div class="nav-inner">
      <a href="/" class="nav-logo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="24" height="24" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.4A5.5 5.5 0 0 1 19 16H4z"/>
        </svg>
        Nimbus
      </a>
      <nav class="nav-links">
        <a href="/">Product</a>
        <a href="/integrations">Integrations</a>
        <a href="/pricing">Pricing</a>
        <a href="/faq">FAQ</a>
      </nav>
      <a href="/pricing" class="btn-primary">Start free</a>
    </div>
  </header>`
}

function nimbusFooter(orgId) {
  return `
  <footer>
    <div class="container">
      <div style="font-weight:700;font-size:1rem;color:#fff;">Nimbus</div>
      <div style="margin-top:8px;">Finance &amp; accounting software for growing teams.</div>
      <div class="footer-links">
        <a href="/pricing">Pricing</a>
        <a href="/integrations">Integrations</a>
        <a href="/faq">FAQ</a>
        <a href="mailto:support@nimbus.finance">support@nimbus.finance</a>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </div>
      <div style="margin-top:24px;opacity:0.5;">&copy; 2026 Nimbus Finance, Inc. All rights reserved.</div>
    </div>
  </footer>
  <script src="https://widget.liraintelligence.com/v1/widget.js" data-org-id="${orgId}" data-position="bottom-right" async></script>`
}

function generateNimbusIntegrationsHtml(orgId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Integrations — Nimbus Finance</title>
  <meta name="description" content="Nimbus integrates with QuickBooks Online, Xero, Stripe, Plaid, Slack, HubSpot, Google Workspace, Zapier, and more. Two-way sync, real-time reconciliation." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="https://demo.liraintelligence.com/integrations" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${NIMBUS_CSS}</style>
</head>
<body>
${nimbusNav()}

  <section class="page-hero">
    <div class="section-label">Integrations</div>
    <h1 class="mt-3">Works with the tools you already use</h1>
    <p class="subtitle mt-4">Connect Nimbus to your accounting, payment, banking, and communication tools. All integrations are included on every plan — no extra fees.</p>
  </section>

  <section>
    <div class="container">
      <div class="integrations-grid">

        <div class="int-card">
          <h3>QuickBooks Online</h3>
          <p>Yes, Nimbus integrates with QuickBooks Online. Two-way sync of invoices, payments, and chart of accounts in real time. Connect under Settings → Integrations → QuickBooks. Reconciliation runs automatically — no manual exports needed. Available on Growth and Business plans.</p>
        </div>

        <div class="int-card">
          <h3>Xero</h3>
          <p>Two-way sync with Xero. Push invoices nightly or trigger sync on every transaction. Automatically match bank feeds and journal entries. Available on Growth and Business plans.</p>
        </div>

        <div class="int-card">
          <h3>FreshBooks</h3>
          <p>Import your existing FreshBooks data with one click — customers, invoices, and payment history up to 24 months. Switch to Nimbus without losing history.</p>
        </div>

        <div class="int-card">
          <h3>Wave</h3>
          <p>One-click import from Wave. Customer records, invoice numbers, and payment history all preserved. CSV import also available for any other accounting tool.</p>
        </div>

        <div class="int-card">
          <h3>Stripe</h3>
          <p>Accept cards, ACH, and Apple Pay. Payouts reconciled automatically in Nimbus. Payment links embedded in invoices so customers pay with one click.</p>
        </div>

        <div class="int-card">
          <h3>Plaid</h3>
          <p>Connect any US, UK, or EU bank account via Plaid. Balances refreshed every 2 hours. Encrypted end-to-end. Transactions reconcile nightly against your invoices and expenses.</p>
        </div>

        <div class="int-card">
          <h3>Slack</h3>
          <p>Get pinged in your #finance channel when invoices are paid, overdue, or disputed. Custom notification rules per workspace. Set up in under 2 minutes.</p>
        </div>

        <div class="int-card">
          <h3>HubSpot</h3>
          <p>Auto-create a Nimbus customer when a HubSpot deal moves to Closed Won. Sync contact details, company, and deal amount. Avoid double data entry across sales and finance.</p>
        </div>

        <div class="int-card">
          <h3>Google Workspace</h3>
          <p>Single sign-on via Google. Calendar-based billing for time-tracked projects. Attach Google Drive documents directly to invoices.</p>
        </div>

        <div class="int-card">
          <h3>Zapier</h3>
          <p>800+ no-code triggers and actions. Build automations between Nimbus and any tool we don't natively support. No developer needed.</p>
        </div>

        <div class="int-card">
          <h3>Braintree / GoCardless / Paddle</h3>
          <p>Alternative payment processors for recurring billing. Proration, dunning, and failed-payment recovery handled automatically by Nimbus regardless of payment provider.</p>
        </div>

      </div>

      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;max-width:640px;margin:48px auto 0;text-align:center;">
        <h3 style="font-size:1.1rem;">Questions about a specific integration?</h3>
        <p style="font-size:0.875rem;color:#475569;margin-top:8px;">Ask our AI support agent — click the chat bubble in the bottom-right corner 24/7, or email <a href="mailto:support@nimbus.finance" style="color:#3730a3;">support@nimbus.finance</a>.</p>
      </div>
    </div>
  </section>

${nimbusFooter(orgId)}
</body>
</html>`
}

function generateNimbusPricingHtml(orgId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Pricing — Nimbus Finance</title>
  <meta name="description" content="Nimbus pricing: Starter $19/month (3 users), Growth $49/month (15 users), Business $129/month (unlimited users). 14-day free trial. No credit card required." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="https://demo.liraintelligence.com/pricing" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${NIMBUS_CSS}</style>
</head>
<body>
${nimbusNav()}

  <section class="page-hero">
    <div class="section-label">Pricing</div>
    <h1 class="mt-3">Simple pricing. No seat tax.</h1>
    <p class="subtitle mt-4">All plans include unlimited invoices, unlimited expenses, and a free accountant seat. Save 20% with annual billing. 14-day free trial on every plan — no credit card required.</p>
  </section>

  <section>
    <div class="container">
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="plan-name">Starter</div>
          <div class="price">$19<span>/mo</span></div>
          <div class="seats">Up to 3 users · billed monthly</div>
          <ul>
            <li>Unlimited invoices and expenses</li>
            <li>Receipt OCR + mileage tracking</li>
            <li>Stripe + ACH payments</li>
            <li>Basic cash-flow reporting</li>
            <li>Email support (24h SLA)</li>
          </ul>
          <a href="/" class="btn-plan">Start free trial</a>
        </div>
        <div class="pricing-card highlight">
          <div class="plan-name">Growth — Most Popular</div>
          <div class="price">$49<span>/mo</span></div>
          <div class="seats">Up to 15 users · billed monthly</div>
          <ul>
            <li>Everything in Starter, plus:</li>
            <li>Recurring billing &amp; subscriptions</li>
            <li>Multi-currency (136 supported)</li>
            <li>QuickBooks Online / Xero two-way sync</li>
            <li>Slack notifications</li>
            <li>Priority chat support (4h SLA)</li>
          </ul>
          <a href="/" class="btn-plan">Start free trial</a>
        </div>
        <div class="pricing-card">
          <div class="plan-name">Business</div>
          <div class="price">$129<span>/mo</span></div>
          <div class="seats">Unlimited users · billed monthly</div>
          <ul>
            <li>Everything in Growth, plus:</li>
            <li>SSO (SAML, OIDC)</li>
            <li>Audit log export</li>
            <li>Custom approval workflows</li>
            <li>Multi-entity consolidation (up to 10)</li>
            <li>Dedicated success manager</li>
            <li>99.95% uptime SLA</li>
          </ul>
          <a href="/" class="btn-plan">Start free trial</a>
        </div>
      </div>

      <div style="max-width:640px;margin:48px auto 0;">
        <h3 style="font-size:1rem;text-align:center;">Frequently asked pricing questions</h3>
        <div class="faq-list" style="margin-top:24px;">
          <div class="faq-item"><h3>Is there a free trial?</h3><p>Yes. Every plan includes a 14-day free trial. No credit card required to start.</p></div>
          <div class="faq-item"><h3>Do you offer an annual discount?</h3><p>Yes. Pay annually and save 20% on any plan. Switch between monthly and annual at any time from Settings → Billing.</p></div>
          <div class="faq-item"><h3>What is your refund policy?</h3><p>Cancel within 30 days of your first paid charge and we refund the full amount, no questions asked. This is our 30-day money-back guarantee. After 30 days we prorate refunds for annual plans.</p></div>
          <div class="faq-item"><h3>What happens if I go over my user limit?</h3><p>Nothing breaks. We notify you by email and in-app. You have 14 days to remove users or upgrade. We never auto-upgrade your plan.</p></div>
          <div class="faq-item"><h3>Can I switch plans at any time?</h3><p>Yes. Upgrade or downgrade at any time from Settings → Billing. Upgrades take effect immediately, prorated for the current billing period.</p></div>
        </div>
      </div>
    </div>
  </section>

${nimbusFooter(orgId)}
</body>
</html>`
}

function generateNimbusFaqHtml(orgId) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FAQ — Nimbus Finance</title>
  <meta name="description" content="Frequently asked questions about Nimbus: pricing, QuickBooks integration, refund policy, data storage, free trial, cancellation, and more." />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="https://demo.liraintelligence.com/faq" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>${NIMBUS_CSS}</style>
</head>
<body>
${nimbusNav()}

  <section class="page-hero">
    <div class="section-label">FAQ</div>
    <h1 class="mt-3">Frequently asked questions</h1>
    <p class="subtitle mt-4">Can't find your answer? Ask our AI support agent — click the chat bubble in the bottom-right corner, available 24/7.</p>
  </section>

  <section>
    <div class="container">
      <div class="faq-list">

        <div class="faq-item">
          <h3>How long is the free trial and do I need a credit card?</h3>
          <p>Nimbus is free for 14 days on any plan. No credit card required to start. On day 14 you pick a plan or your account is paused — we never auto-charge without an explicit action.</p>
        </div>

        <div class="faq-item">
          <h3>What does Nimbus cost and what's the difference between the plans?</h3>
          <p>Starter is $19/month for up to 3 users — includes unlimited invoices, expenses, and reporting. Growth is $49/month for up to 15 users — adds recurring billing, multi-currency, and QuickBooks/Xero sync. Business is $129/month for unlimited users — adds SSO, advanced permissions, audit logs, custom approval workflows, multi-entity consolidation, and priority support. See the full <a href="/pricing" style="color:#3730a3;">pricing page</a>.</p>
        </div>

        <div class="faq-item">
          <h3>Do you offer an annual discount?</h3>
          <p>Yes. Pay annually and save 20% on any plan. Switch between monthly and annual at any time from Settings → Billing.</p>
        </div>

        <div class="faq-item">
          <h3>What is your refund policy?</h3>
          <p>Yes. Cancel within 30 days of your first paid charge and we refund the full amount, no questions asked. After 30 days we prorate refunds for annual plans. Monthly plans are not prorated past the 30-day window. This is our 30-day money-back guarantee.</p>
        </div>

        <div class="faq-item">
          <h3>How do I cancel my subscription?</h3>
          <p>Go to Settings → Billing → Cancel subscription. Your account stays active until the end of the billing period. You can export all your data at any time — we keep a read-only copy for 90 days after cancellation.</p>
        </div>

        <div class="faq-item">
          <h3>Do you integrate with QuickBooks?</h3>
          <p>Yes, Nimbus integrates with QuickBooks Online. The integration provides two-way sync of invoices, payments, and chart of accounts in real time. Connect QuickBooks under Settings → Integrations → QuickBooks. Available on Growth ($49/month) and Business ($129/month) plans. We also integrate with Xero, FreshBooks, and Wave. See the full <a href="/integrations" style="color:#3730a3;">integrations page</a>.</p>
        </div>

        <div class="faq-item">
          <h3>Can I import data from QuickBooks, Xero, or FreshBooks?</h3>
          <p>Yes. One-click imports from QuickBooks Online, Xero, FreshBooks, and Wave. CSV imports for any other tool. Historical data up to 24 months is preserved. No data is lost during migration.</p>
        </div>

        <div class="faq-item">
          <h3>Where is my data stored?</h3>
          <p>All customer data is stored in AWS us-east-1 (N. Virginia) by default. EU customers can request data residency in eu-west-1 (Ireland) at no extra cost — available on Growth and Business plans.</p>
        </div>

        <div class="faq-item">
          <h3>Is Nimbus SOC 2 compliant?</h3>
          <p>Yes. We are SOC 2 Type II certified with annual audits by Prescient Assurance. Request our latest SOC 2 report from legal@nimbus.finance. We are also GDPR compliant with a signed DPA available on request.</p>
        </div>

        <div class="faq-item">
          <h3>What happens if I go over my user limit?</h3>
          <p>Nothing breaks. We notify you by email and in-app. You have 14 days to remove users or upgrade. We never auto-upgrade your plan.</p>
        </div>

        <div class="faq-item">
          <h3>Do you support multi-entity accounting?</h3>
          <p>Yes, on the Business plan. Run up to 10 legal entities under one login, with inter-company invoices, consolidated reporting, and separate tax profiles per entity.</p>
        </div>

        <div class="faq-item">
          <h3>Is there a mobile app?</h3>
          <p>Yes. iOS and Android apps are free with any plan. Create invoices, approve expenses, upload receipts, and view cash flow from your phone. Offline mode syncs when you're back online.</p>
        </div>

        <div class="faq-item">
          <h3>How do I contact support?</h3>
          <p>The fastest way is the chat bubble in the bottom-right corner — our AI agent answers instantly 24/7 and escalates to a human when needed. You can also email support@nimbus.finance (Mon–Fri, 9am–6pm GMT, 4-hour response) or book a call at nimbus.finance/book.</p>
        </div>

      </div>
    </div>
  </section>

${nimbusFooter(orgId)}
</body>
</html>`
}

function run() {
  const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf-8')
  let created = 0

  // Nimbus org ID used in the static demo page widget script
  const demoOrgId = process.env.VITE_DEMO_ORG_ID || 'org-bfad94de-859d-4475-bcae-0107deaca433'
  const demoWidgetSecret = (process.env.VITE_DEMO_WIDGET_SECRET || '').replace(/\n$/, '')

  for (const route of ROUTES) {
    // Skip root – the index.html already has these tags
    if (route.path === '/') continue

    // Demo route → write the main Nimbus page + dedicated sub-pages so the KB
    // crawler has separate focused URLs for integrations, pricing, and FAQ.
    // This mirrors a real multi-page website — no single-page chunk limits.
    if (route.path === '/demo') {
      const routeDir = path.join(DIST, route.path)
      fs.mkdirSync(routeDir, { recursive: true })
      fs.writeFileSync(
        path.join(routeDir, 'index.html'),
        generateNimbusHtml(demoOrgId, demoWidgetSecret),
        'utf-8'
      )

      // Sub-pages: each crawled independently by the KB
      const subPages = [
        { dir: 'integrations', html: generateNimbusIntegrationsHtml(demoOrgId) },
        { dir: 'pricing', html: generateNimbusPricingHtml(demoOrgId) },
        { dir: 'faq', html: generateNimbusFaqHtml(demoOrgId) },
      ]
      for (const sub of subPages) {
        const subDir = path.join(routeDir, sub.dir)
        fs.mkdirSync(subDir, { recursive: true })
        fs.writeFileSync(path.join(subDir, 'index.html'), sub.html, 'utf-8')
      }
      created += 4
      continue
    }

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
