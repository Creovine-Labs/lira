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
const os = require('node:os')

const TEMPLATES_DIR = path.join(__dirname, 'templates')
const DEFAULT_API_URL = 'https://api.creovine.com'
const CONFIG_DIR = path.join(os.homedir(), '.lira')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

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

function readConfig() {
  if (!fs.existsSync(CONFIG_FILE)) return {}
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function writeConfig(config) {
  ensureDir(CONFIG_DIR)
  fs.writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  fs.chmodSync(CONFIG_FILE, 0o600)
}

function apiBase(flags = {}) {
  return String(flags['api-url'] || process.env.LIRA_API_URL || readConfig().apiUrl || DEFAULT_API_URL).replace(/\/$/, '')
}

function authToken(flags = {}) {
  return String(
    flags['api-key'] ||
    process.env.LIRA_API_KEY ||
    process.env.LIRA_TOKEN ||
    readConfig().apiKey ||
    readConfig().accessToken ||
    ''
  )
}

function defaultOrgId(flags = {}) {
  return String(flags['org-id'] || process.env.LIRA_ORG_ID || readConfig().orgId || '')
}

function requireValue(value, label) {
  if (value) return value
  throw new Error(`${label} is required`)
}

function splitCsv(value) {
  if (!value) return undefined
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function asBool(value, fallback = false) {
  if (value === undefined) return fallback
  if (value === true) return true
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase())
}

async function apiRequest(method, requestPath, body, flags = {}, options = {}) {
  if (typeof fetch !== 'function') {
    throw new Error('This CLI requires Node.js 18+ because it uses the built-in fetch API.')
  }
  const token = options.auth === false ? '' : authToken(flags)
  if (options.auth !== false) requireValue(token, 'Authentication token (run `lira login` or set LIRA_API_KEY)')
  const response = await fetch(`${apiBase(flags)}${requestPath}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const text = await response.text()
  const payload = text ? safeJson(text) : {}
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed with HTTP ${response.status}`
    throw new Error(message)
  }
  return payload
}

function safeJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

function printJson(payload) {
  log(JSON.stringify(payload, null, 2))
}

function printTable(rows, columns) {
  if (!rows.length) {
    log('No records found.')
    return
  }
  const widths = columns.map((col) =>
    Math.max(col.label.length, ...rows.map((row) => String(col.value(row) ?? '').length))
  )
  log(columns.map((col, i) => col.label.padEnd(widths[i])).join('  '))
  log(columns.map((_, i) => '-'.repeat(widths[i])).join('  '))
  for (const row of rows) {
    log(columns.map((col, i) => String(col.value(row) ?? '').padEnd(widths[i])).join('  '))
  }
}

function normalizeEnvironment(value) {
  if (!value) return 'sandbox'
  const env = String(value).toLowerCase()
  if (env === 'live' || env === 'production') return 'production'
  if (env === 'sandbox') return 'sandbox'
  throw new Error('environment must be sandbox or production')
}

function normalizeRisk(value) {
  const risk = String(value || 'human_only')
  const allowed = new Set([
    'read_public',
    'read_private',
    'safe_write',
    'customer_confirm',
    'step_up',
    'admin_approve',
    'human_only',
  ])
  if (!allowed.has(risk)) throw new Error(`Invalid MCP risk: ${risk}`)
  return risk
}

function normalizeAuthScope(value) {
  const scope = String(value || 'verified_customer')
  const allowed = new Set(['public', 'verified_visitor', 'verified_customer'])
  if (!allowed.has(scope)) throw new Error(`Invalid MCP auth scope: ${scope}`)
  return scope
}

function parseJsonFlag(value, label) {
  if (!value) return undefined
  try {
    return JSON.parse(String(value))
  } catch {
    throw new Error(`${label} must be valid JSON`)
  }
}

function parsePositiveInteger(value, label) {
  if (value === undefined || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return parsed
}

async function runLogin(args) {
  const flags = parseFlags(args)
  const email = flags.email || (await prompt('Email: ', ''))
  const password = flags.password || (await prompt('Password: ', ''))
  requireValue(email, 'email')
  requireValue(password, 'password')
  const payload = await apiRequest('POST', '/v1/auth/login', { email, password }, flags, { auth: false })
  const config = { ...readConfig(), apiUrl: apiBase(flags), accessToken: payload.accessToken }
  if (payload.user?.tenantId) config.tenantId = payload.user.tenantId
  writeConfig(config)
  log(`Logged in. Saved credentials to ${CONFIG_FILE}`)
}

async function runConfig(args) {
  const action = args[0] || 'show'
  const flags = parseFlags(args.slice(1))
  if (action === 'show') {
    const config = readConfig()
    printJson({
      apiUrl: config.apiUrl || DEFAULT_API_URL,
      orgId: config.orgId,
      tenantId: config.tenantId,
      hasAccessToken: Boolean(config.accessToken),
      hasApiKey: Boolean(config.apiKey || process.env.LIRA_API_KEY),
    })
    return
  }
  if (action !== 'set') {
    throw new Error(`Unknown config command: ${action}`)
  }
  const config = { ...readConfig() }
  if (flags['api-url']) config.apiUrl = String(flags['api-url']).replace(/\/$/, '')
  if (flags['org-id']) config.orgId = String(flags['org-id'])
  if (flags['api-key']) config.apiKey = String(flags['api-key'])
  writeConfig(config)
  log(`Saved config to ${CONFIG_FILE}`)
}

async function runKeys(args) {
  const action = args[0] || 'list'
  const flags = parseFlags(args.slice(1))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')
  if (action === 'create') {
    const payload = await apiRequest(
      'POST',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys`,
      {
        name: flags.name || 'Lira CLI key',
        scopes: splitCsv(flags.scopes) || ['mcp:read', 'mcp:write'],
        expires_at: flags['expires-at'],
      },
      flags
    )
    log('Developer key created. Copy the token now; Lira will not show it again.')
    printJson(payload)
    return
  }
  if (action === 'list') {
    const payload = await apiRequest(
      'GET',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys`,
      undefined,
      flags
    )
    printTable(payload.keys || [], [
      { label: 'KEY ID', value: (row) => row.key_id },
      { label: 'NAME', value: (row) => row.name },
      { label: 'STATUS', value: (row) => row.status },
      { label: 'SCOPES', value: (row) => (row.scopes || []).join(',') },
      { label: 'LAST USED', value: (row) => row.last_used_at || '-' },
    ])
    return
  }
  if (action === 'revoke') {
    const keyId = requireValue(flags['key-id'] || args[1], 'key id (`--key-id`)')
    await apiRequest(
      'DELETE',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys/${encodeURIComponent(keyId)}`,
      undefined,
      flags
    )
    log(`Revoked developer key ${keyId}.`)
    return
  }
  throw new Error(`Unknown keys command: ${action}`)
}

async function runMcp(args) {
  const action = args[0] || 'status'
  const flags = parseFlags(args.slice(1))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')
  const serverPath = `/lira/v1/support/mcp/orgs/${encodeURIComponent(orgId)}/server`
  if (action === 'status') {
    const payload = await apiRequest('GET', serverPath, undefined, flags)
    printJson(payload)
    return
  }
  if (action === 'connect') {
    const endpoint = requireValue(flags.endpoint || flags['endpoint-url'], 'MCP endpoint (`--endpoint`)')
    const serverToken = flags['server-token'] || flags['access-token']
    const payload = await apiRequest(
      'PUT',
      serverPath,
      {
        endpoint_url: endpoint,
        server_label: flags.label || 'Customer MCP server',
        environment: normalizeEnvironment(flags.environment),
        protocol_version: flags['protocol-version'],
        auth_type: serverToken || flags['auth-type'] === 'bearer' ? 'bearer' : 'none',
        access_token: serverToken,
        enabled: asBool(flags.enabled, false),
      },
      flags
    )
    log('MCP server connected.')
    printJson(payload)
    return
  }
  if (action === 'discover') {
    const payload = await apiRequest(
      'POST',
      `/lira/v1/support/mcp/orgs/${encodeURIComponent(orgId)}/discover`,
      {},
      flags
    )
    printTable(payload.tools || [], [
      { label: 'SOURCE', value: (row) => row.source_name },
      { label: 'SUGGESTED', value: (row) => row.suggested_tool_name },
      { label: 'DESCRIPTION', value: (row) => String(row.description || '').slice(0, 80) },
    ])
    return
  }
  if (action === 'approve') {
    const sourceName = requireValue(flags['source-name'] || flags.source, 'source tool name (`--source-name`)')
    const current = await apiRequest('GET', serverPath, undefined, flags)
    const discovery = await apiRequest(
      'POST',
      `/lira/v1/support/mcp/orgs/${encodeURIComponent(orgId)}/discover`,
      {},
      flags
    )
    const discovered = (discovery.tools || []).find((tool) => tool.source_name === sourceName)
    if (!discovered) throw new Error(`MCP tool not found during discovery: ${sourceName}`)
    const existing = current.server?.approved_tools || []
    const nextTool = {
      source_name: sourceName,
      tool_name: flags['tool-name'] || discovered.suggested_tool_name,
      description: flags.description || discovered.description,
      input_schema: discovered.input_schema,
      kind: flags.kind || 'action',
      risk: normalizeRisk(flags.risk),
      auth_scope: normalizeAuthScope(flags.scope || flags['auth-scope']),
      enabled: asBool(flags.enable ?? flags.enabled, true),
      timeout_ms: parsePositiveInteger(flags['timeout-ms'], 'timeout-ms'),
      allowed_channels: splitCsv(flags.channels) || ['chat'],
    }
    const approvedTools = [
      ...existing.filter((tool) => tool.source_name !== sourceName),
      nextTool,
    ]
    const payload = await apiRequest('PUT', serverPath, { approved_tools: approvedTools }, flags)
    log(`Approved MCP tool ${sourceName}.`)
    printJson(payload)
    return
  }
  if (action === 'enable' || action === 'disable') {
    const payload = await apiRequest('PUT', serverPath, { enabled: action === 'enable' }, flags)
    log(`MCP server ${action === 'enable' ? 'enabled' : 'disabled'}.`)
    printJson(payload)
    return
  }
  if (action === 'remove') {
    await apiRequest('DELETE', serverPath, undefined, flags)
    log('MCP server config removed.')
    return
  }
  throw new Error(`Unknown mcp command: ${action}`)
}

async function runSessions(args) {
  const action = args[0] || 'mint'
  const flags = parseFlags(args.slice(1))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')
  if (action !== 'mint') throw new Error(`Unknown sessions command: ${action}`)
  const email = requireValue(flags.email, 'customer email (`--email`)')
  const payload = await apiRequest(
    'POST',
    `/lira/v1/support/sessions/orgs/${encodeURIComponent(orgId)}/mint`,
    {
      customer: {
        email,
        name: flags.name,
        externalCustomerId: flags['external-customer-id'] || flags.customerId,
      },
      visitorId: flags['visitor-id'],
      context: parseJsonFlag(flags.context || flags['context-json'], 'context'),
      ttlSeconds: parsePositiveInteger(flags.ttl || flags['ttl-seconds'], 'ttl'),
      stepUp: asBool(flags['step-up'], false) || asBool(flags.stepUp, false),
    },
    flags
  )
  printJson(payload)
}

function printHelp() {
  log(`Usage:
  lira init [--org-id=org-xxxx] [--org-name="My Co"]
  lira login [--email=me@example.com] [--password=...]
  lira config show
  lira config set [--org-id=org-xxxx] [--api-url=https://api.creovine.com]

Developer keys:
  lira keys create --org-id=org-xxxx --name="Riverly CI" --scopes=mcp:read,mcp:write,sessions:mint
  lira keys list --org-id=org-xxxx
  lira keys revoke --org-id=org-xxxx --key-id=<key_id>

Native sessions:
  LIRA_API_KEY=lira_sk_... lira sessions mint --org-id=org-xxxx --email=customer@example.com --external-customer-id=cus_123 --context='{"product":"personal","platform":"ios"}'

MCP:
  LIRA_API_KEY=lira_sk_... lira mcp connect --org-id=org-xxxx --endpoint=https://mcp.example.com --server-token=<remote_mcp_token>
  LIRA_API_KEY=lira_sk_... lira mcp discover --org-id=org-xxxx
  LIRA_API_KEY=lira_sk_... lira mcp approve --org-id=org-xxxx --source-name=get_account_status --risk=read_private --scope=verified_customer
  LIRA_API_KEY=lira_sk_... lira mcp enable --org-id=org-xxxx

Environment:
  LIRA_API_URL       Override API base URL.
  LIRA_ORG_ID        Default org id.
  LIRA_API_KEY       Scoped developer key for automation.
`)
}

async function main() {
  const args = process.argv.slice(2)
  const subcommand = args[0] && !args[0].startsWith('--') ? args[0] : 'init'
  if (subcommand === 'help' || subcommand === '--help' || subcommand === '-h') {
    printHelp()
    closeRl()
    return
  }
  if (subcommand === 'install-skill') {
    await installClaudeCodeSkill()
    closeRl()
    return
  }
  if (subcommand === 'login') {
    await runLogin(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'config') {
    await runConfig(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'keys') {
    await runKeys(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'mcp') {
    await runMcp(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'sessions') {
    await runSessions(args.slice(1))
    closeRl()
    return
  }
  if (subcommand !== 'init') {
    log(`Unknown subcommand: ${subcommand}`)
    printHelp()
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

/**
 * Copies the bundled Claude Code skill to ~/.claude/skills/lira-install
 * so users can run `/lira-install` in Claude Code and have it scaffold
 * the integration without re-typing instructions.
 */
async function installClaudeCodeSkill() {
  const skillSrcDir = path.join(__dirname, 'skills', 'lira-install')
  if (!fs.existsSync(path.join(skillSrcDir, 'SKILL.md'))) {
    log(`\n  Bundled skill not found at ${skillSrcDir}. Reinstall the package?`)
    process.exit(1)
  }
  const homeDir = os.homedir()
  const destDir = path.join(homeDir, '.claude', 'skills', 'lira-install')
  log('')
  log('  Installing Lira Claude Code skill')
  log('  ──────────────────────────────────')
  log(`  From: ${skillSrcDir}`)
  log(`  To:   ${destDir}`)

  if (fs.existsSync(destDir)) {
    log(`  • destination exists — overwriting SKILL.md only`)
  } else {
    ensureDir(destDir)
  }

  const srcSkillFile = path.join(skillSrcDir, 'SKILL.md')
  const destSkillFile = path.join(destDir, 'SKILL.md')
  fs.copyFileSync(srcSkillFile, destSkillFile)
  log(`  ✓ wrote ${destSkillFile}`)

  log('')
  log('  All set. In Claude Code, type:  /lira-install')
  log('  The skill detects your framework, asks for your org id, and scaffolds the integration.')
  log('')
}

main().catch((err) => {
  log(`\nError: ${err.message}`)
  process.exit(1)
})
