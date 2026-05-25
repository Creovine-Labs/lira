#!/usr/bin/env node
/**
 * Lira Support — install scaffold.
 *
 * Usage:  npx @liraintelligence/support init
 *
 * Detects the framework (Next.js / Vite + React / vanilla HTML), prompts for
 * the org ID, drops a working starter file at the conventional path, and
 * prints next-step instructions. Designed to make integration a single
 * command for Lemonpay-style customers.
 */

const fs = require('node:fs')
const path = require('node:path')
const readline = require('node:readline')

const TEMPLATES_DIR = path.join(__dirname, 'templates')

function log(msg) {
  process.stdout.write(`${msg}\n`)
}

// Eagerly create readline so piped stdin isn't lost before we attach.
const sharedRl = readline.createInterface({ input: process.stdin, output: process.stdout })
function closeRl() {
  sharedRl.close()
}
function prompt(question, fallback) {
  return new Promise((resolve) => {
    sharedRl.question(question, (answer) => {
      const trimmed = (answer || '').trim()
      resolve(trimmed || fallback || '')
    })
  })
}

function detectFramework(cwd) {
  const pkgPath = path.join(cwd, 'package.json')
  if (!fs.existsSync(pkgPath)) return 'vanilla'
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }
    if (deps['next']) return 'nextjs'
    if (deps['vite'] && (deps['react'] || deps['react-dom'])) return 'vite-react'
    if (deps['react']) return 'react'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeOnce(filePath, contents) {
  if (fs.existsSync(filePath)) {
    log(`  • skipped (already exists): ${path.relative(process.cwd(), filePath)}`)
    return false
  }
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, contents)
  log(`  ✓ created ${path.relative(process.cwd(), filePath)}`)
  return true
}

function readTemplate(name) {
  return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf-8')
}

function fillTemplate(contents, vars) {
  let out = contents
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v)
  }
  return out
}

async function scaffoldNextjs(cwd, vars) {
  log('\n[+] Detected Next.js (App Router) — scaffolding /support route\n')
  writeOnce(
    path.join(cwd, 'app/support/page.tsx'),
    fillTemplate(readTemplate('nextjs-page.tsx'), vars)
  )
  writeOnce(
    path.join(cwd, 'app/support/LiraSupport.client.tsx'),
    fillTemplate(readTemplate('nextjs-client.tsx'), vars)
  )
  writeOnce(path.join(cwd, 'app/api/lira/sign/route.ts'), readTemplate('nextjs-sign-route.ts'))
}

async function scaffoldViteReact(cwd, vars) {
  log('\n[+] Detected Vite + React — scaffolding Support component\n')
  writeOnce(path.join(cwd, 'src/Support.tsx'), fillTemplate(readTemplate('vite-support.tsx'), vars))
}

async function scaffoldVanilla(cwd, vars) {
  log('\n[+] No framework detected — generating a static HTML snippet\n')
  writeOnce(
    path.join(cwd, 'support.html'),
    fillTemplate(readTemplate('vanilla-support.html'), vars)
  )
}

async function writeEnv(cwd, framework, orgId) {
  if (framework !== 'nextjs') return
  const envPath = path.join(cwd, '.env.local')
  const line = `NEXT_PUBLIC_LIRA_ORG_ID=${orgId}\n# Set this to the widget secret from Lira dashboard → Settings → Support → Secret\nLIRA_WIDGET_SECRET=\n`
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, line)
    log(`  ✓ created .env.local`)
    return
  }
  const existing = fs.readFileSync(envPath, 'utf-8')
  if (existing.includes('NEXT_PUBLIC_LIRA_ORG_ID')) {
    log(`  • skipped .env.local (NEXT_PUBLIC_LIRA_ORG_ID already set)`)
    return
  }
  fs.appendFileSync(envPath, `\n${line}`)
  log(`  ✓ appended Lira vars to .env.local`)
}

function printNextSteps(framework, orgName) {
  log('\n──────────────────────────────────────────────────────')
  log('  All set. Next steps:')
  log('──────────────────────────────────────────────────────')
  log(`  1. npm install @liraintelligence/support`)
  if (framework === 'nextjs') {
    log(`  2. Fill LIRA_WIDGET_SECRET in .env.local`)
    log(`     (find it in Lira dashboard → Settings → Support → Secret)`)
    log(`  3. npm run dev  →  visit  /support`)
  } else if (framework === 'vite-react') {
    log(`  2. Render <Support /> in your router at /support`)
    log(`  3. npm run dev  →  visit  /support`)
  } else {
    log(`  2. Open support.html in a browser, or copy the snippet into your site`)
  }
  log('')
  log(`  Docs:  https://docs.liraintelligence.com/platform/customer-support/web-sdk`)
  log(`  Org:   ${orgName}`)
  log('')
}

function parseFlags(argv) {
  const out = {}
  for (const arg of argv) {
    const m = arg.match(/^--([\w-]+)(?:=(.*))?$/)
    if (m) out[m[1]] = m[2] ?? true
  }
  return out
}

async function main() {
  const args = process.argv.slice(2)
  const subcommand = args[0] && !args[0].startsWith('--') ? args[0] : 'init'
  if (subcommand !== 'init') {
    log(`Unknown subcommand: ${subcommand}`)
    log(`Usage:  npx @liraintelligence/support init [--org-id=org-xxxx] [--org-name="My Co"]`)
    process.exit(1)
  }
  const flags = parseFlags(args)

  log('')
  log('  Lira Support — quick install')
  log('  ──────────────────────────────')

  const cwd = process.cwd()
  const detected = detectFramework(cwd)
  log(`  Detected framework: ${detected}`)

  const orgId = flags['org-id'] || (await prompt('  Enter your Lira org ID (org-xxxx): ', ''))
  if (!orgId) {
    log('\n  org ID required — find it in Lira dashboard → Settings → Org. Aborting.')
    process.exit(1)
  }
  const orgName =
    flags['org-name'] ||
    (await prompt('  Display name for your company (optional, e.g. LemonPay): ', 'Your company'))

  const vars = { ORG_ID: orgId, ORG_NAME: orgName.replace(/'/g, "\\'") }

  switch (detected) {
    case 'nextjs':
      await scaffoldNextjs(cwd, vars)
      break
    case 'vite-react':
    case 'react':
      await scaffoldViteReact(cwd, vars)
      break
    default:
      await scaffoldVanilla(cwd, vars)
  }

  await writeEnv(cwd, detected, orgId)
  printNextSteps(detected, orgName)
  closeRl()
}

main().catch((err) => {
  log(`\nError: ${err.message}`)
  process.exit(1)
})
