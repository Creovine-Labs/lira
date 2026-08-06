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
  return String(
    flags['api-url'] || process.env.LIRA_API_URL || readConfig().apiUrl || DEFAULT_API_URL
  ).replace(/\/$/, '')
}

/**
 * Which mode the CLI is acting in — 'test' or 'live'.
 *
 * Order: --mode flag → LIRA_MODE → saved config → 'test'. It defaults to test
 * so a fresh shell can never fire real customer traffic by accident; going live
 * is always something you typed.
 */
function activeMode(flags = {}) {
  const raw = String(flags.mode || process.env.LIRA_MODE || readConfig().mode || 'test')
    .trim()
    .toLowerCase()
  if (raw === 'live' || raw === 'production') return 'live'
  if (raw === 'test' || raw === 'sandbox') return 'test'
  throw new Error(`Unknown mode "${raw}". Use --mode=test or --mode=live.`)
}

/**
 * The developer key for the active mode.
 *
 * Keys are stored per mode (`lira keys use --mode=live --api-key=…`), so
 * switching modes is one command and you never hand-edit an env var — the most
 * common way people accidentally point staging at production. An explicit
 * --api-key or LIRA_API_KEY still wins, for CI.
 */
function authToken(flags = {}) {
  const config = readConfig()
  const mode = activeMode(flags)
  const perMode = (config.keys || {})[mode]
  const token = String(
    flags['api-key'] ||
      process.env.LIRA_API_KEY ||
      process.env.LIRA_TOKEN ||
      perMode ||
      config.apiKey ||
      config.accessToken ||
      ''
  )
  // Guard the classic footgun: a live key while the CLI says test (or vice
  // versa). The key is authoritative server-side, so silently proceeding would
  // do the opposite of what the operator just asked for.
  const prefix = token.startsWith('lira_sk_live_')
    ? 'live'
    : token.startsWith('lira_sk_test_')
      ? 'test'
      : null
  if (prefix && prefix !== mode) {
    throw new Error(
      `Mode mismatch: you are in ${mode.toUpperCase()} mode but the key is a ${prefix.toUpperCase()} key.\n` +
        `Run \`lira mode ${prefix}\` to switch, or pass --mode=${prefix} for this command.`
    )
  }
  return token
}

/** Developer key if present, else the stored dashboard login. */
function authTokenOrJwt(flags = {}) {
  try {
    const key = authToken(flags)
    if (key) return key
  } catch (err) {
    // A mode/key mismatch is worth surfacing even on dual-auth routes.
    if (/Mode mismatch/.test(err.message)) throw err
  }
  return String(readConfig().accessToken || '')
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

// Key-management endpoints are JWT-only — a lira_sk_ developer key is rejected
// there. LIRA_API_KEY used to win over the stored login token, so anyone with
// the key exported saw a confusing 401 from `lira keys ...`. Prefer the JWT for
// those commands and explain the fix if it is missing.
function jwtToken(flags = {}) {
  const t = String(flags['token'] || readConfig().accessToken || '')
  if (!t && String(process.env.LIRA_API_KEY || '').startsWith('lira_sk_')) {
    throw new Error(
      'This command needs a dashboard login, not a developer API key.\n' +
        'LIRA_API_KEY is set but key management is JWT-only. Run `lira login` first ' +
        '(or unset LIRA_API_KEY in this shell).'
    )
  }
  return t
}

async function apiRequest(method, requestPath, body, flags = {}, options = {}) {
  if (typeof fetch !== 'function') {
    throw new Error('This CLI requires Node.js 18+ because it uses the built-in fetch API.')
  }
  const token =
    options.auth === false
      ? ''
      : options.auth === 'jwt'
        ? jwtToken(flags)
        : options.auth === 'any'
          ? // Support-config routes take a dashboard JWT OR a support:*-scoped
            // developer key. Prefer the developer key (that's what a terminal
            // session usually has), fall back to a stored login.
            authTokenOrJwt(flags)
          : authToken(flags)
  if (options.auth !== false)
    requireValue(token, 'Authentication token (run `lira login` or set LIRA_API_KEY)')
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
    const message =
      payload?.message || payload?.error || `Request failed with HTTP ${response.status}`
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
  const payload = await apiRequest('POST', '/v1/auth/login', { email, password }, flags, {
    auth: false,
  })
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

/**
 * `lira mode` — show or switch the working mode.
 *
 * This is the terminal equivalent of the dashboard's TEST DATA / LIVE DATA
 * switch: it changes which key subsequent commands use. It does NOT change the
 * workspace environment — that's `lira env go-live`, which is the commercial
 * step.
 */
async function runMode(args) {
  const flags = parseFlags(args.filter((a) => a.startsWith('--')))
  const requested = args.find((a) => !a.startsWith('--'))
  const config = readConfig()

  if (!requested) {
    const mode = activeMode(flags)
    const keys = config.keys || {}
    log(`Mode: ${mode.toUpperCase()}`)
    log(`  test key: ${keys.test ? maskKey(keys.test) : '(not set)'}`)
    log(`  live key: ${keys.live ? maskKey(keys.live) : '(not set)'}`)
    if (!keys[mode] && !process.env.LIRA_API_KEY) {
      log('')
      log(`No ${mode} key saved. Add one with:`)
      log(`  lira keys use --mode=${mode} --api-key=lira_sk_${mode}_...`)
    }
    return
  }

  const mode = activeMode({ mode: requested })
  writeConfig({ ...config, mode })
  const key = (config.keys || {})[mode]
  log(`Switched to ${mode.toUpperCase()} mode.`)
  if (!key) {
    log(`No ${mode} key saved yet — add one with:`)
    log(`  lira keys use --mode=${mode} --api-key=lira_sk_${mode}_...`)
  } else {
    log(`Using ${maskKey(key)}`)
  }
  if (mode === 'live') {
    log('')
    log('⚠  LIVE mode: commands now affect real customer traffic.')
  }
}

function maskKey(key) {
  const str = String(key)
  if (str.length <= 16) return str
  return `${str.slice(0, 18)}…${str.slice(-4)}`
}

/**
 * `lira status` — one screen answering "what will my next command do?".
 *
 * The single most useful guard against the mistake this whole feature exists to
 * prevent: running a production integration against test, or worse, the
 * reverse. Shows the workspace environment, the CLI's mode, and whether live
 * keys are actually active yet.
 */
async function runStatus(args) {
  const flags = parseFlags(args)
  const config = readConfig()
  const mode = activeMode(flags)
  const orgId = defaultOrgId(flags)

  log(`API        ${apiBase(flags)}`)
  log(`Org        ${orgId || '(not set — `lira config set --org-id=...`)'}`)
  log(`CLI mode   ${mode.toUpperCase()}`)
  log(
    `Key        ${(config.keys || {})[mode] ? maskKey(config.keys[mode]) : process.env.LIRA_API_KEY ? '(from LIRA_API_KEY)' : '(none)'}`
  )

  if (!orgId) return

  // Workspace environment is the commercial state: it decides whether live
  // keys do anything at all.
  let workspace = null
  try {
    workspace = await apiRequest(
      'GET',
      `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`,
      undefined,
      flags,
      { auth: 'any' }
    )
  } catch (err) {
    log(`Workspace  (could not read: ${err.message})`)
    return
  }

  const env = workspace?.environment === 'production' ? 'LIVE' : 'SANDBOX'
  log(`Workspace  ${env}`)
  log('')

  if (env === 'SANDBOX' && mode === 'live') {
    log('⚠  This workspace has not gone live, so LIVE keys still behave as test keys:')
    log('   no real emails, Slack, Linear or webhooks, and nothing is billed.')
    log('   Run `lira env go-live` when you are ready.')
  } else if (env === 'LIVE' && mode === 'live') {
    log('▶  LIVE: traffic from this key reaches real customers and counts against your plan.')
  } else {
    log('▶  TEST: no real sends, separate quota, hidden from the live inbox.')
  }
}

/**
 * `lira channels` — turn support surfaces on and off without the dashboard.
 *
 * Voice in particular was dashboard-only in practice: the API has always
 * accepted these flags, but nothing surfaced them, so "enable voice" meant
 * "log into the dashboard and find the toggle" — awkward when the rest of the
 * integration is scripted.
 */
const CHANNELS = {
  chat: { field: 'chat_enabled', label: 'Web chat' },
  voice: { field: 'voice_enabled', label: 'Voice calls' },
  email: { field: 'email_enabled', label: 'Email' },
  portal: { field: 'portal_enabled', label: 'Hosted portal' },
}

async function runChannels(args) {
  const action = args[0] && !args[0].startsWith('--') ? args[0] : 'show'
  const nameArg = args[1] && !args[1].startsWith('--') ? args[1] : undefined
  const flags = parseFlags(args.filter((a) => a.startsWith('--')))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')

  if (action === 'show') {
    const config = await apiRequest(
      'GET',
      `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`,
      undefined,
      flags,
      { auth: 'any' }
    )
    printTable(
      Object.entries(CHANNELS).map(([key, meta]) => ({
        key,
        label: meta.label,
        state: config?.[meta.field] ? 'on' : 'off',
      })),
      [
        { label: 'CHANNEL', value: (r) => r.key },
        { label: 'WHAT IT IS', value: (r) => r.label },
        { label: 'STATE', value: (r) => r.state },
      ]
    )
    return
  }

  if (action !== 'enable' && action !== 'disable') {
    throw new Error(`Unknown channels command: ${action}. Use show, enable, or disable.`)
  }
  const channel = CHANNELS[String(nameArg || '').toLowerCase()]
  if (!channel) {
    throw new Error(`Unknown channel "${nameArg}". One of: ${Object.keys(CHANNELS).join(', ')}.`)
  }

  await apiRequest(
    'PUT',
    `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`,
    { [channel.field]: action === 'enable' },
    flags,
    { auth: 'any' }
  )
  log(`${channel.label}: ${action === 'enable' ? 'on' : 'off'}`)
  if (channel === CHANNELS.voice && action === 'enable') {
    log('Customers can now start a voice call from the widget or your mobile app.')
  }
}

/**
 * `lira env` — read or change the WORKSPACE environment from the terminal.
 *
 * Going live is a commercial event (plan limits, billing, real outbound), so it
 * takes an explicit confirmation here exactly as it does in the dashboard. The
 * backend is still the authority: it returns 402 when a paid plan has no
 * subscription, and checkout has to happen in the dashboard because it needs a
 * browser.
 */
async function runEnv(args) {
  const action = args[0] && !args[0].startsWith('--') ? args[0] : 'show'
  const flags = parseFlags(args.filter((a) => a.startsWith('--')))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')

  const current = await apiRequest(
    'GET',
    `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`,
    undefined,
    flags,
    { auth: 'any' }
  )
  const isLive = current?.environment === 'production'

  if (action === 'show') {
    log(`Workspace environment: ${isLive ? 'LIVE' : 'SANDBOX'}`)
    if (!isLive) log('Live keys stay inert until you go live. Run `lira env go-live`.')
    return
  }

  const target =
    action === 'go-live' || action === 'live' || action === 'production'
      ? 'production'
      : action === 'sandbox' || action === 'test'
        ? 'sandbox'
        : null
  if (!target) throw new Error(`Unknown env command: ${action}. Use show, go-live, or sandbox.`)

  if ((target === 'production') === isLive) {
    log(`Already ${isLive ? 'live' : 'in sandbox'} — nothing to do.`)
    return
  }

  if (target === 'production') {
    log('')
    log('Going live starts your billing period and turns on real outbound sends')
    log('for live-key traffic. Your test keys keep working exactly as they do now.')
    log('')
    const orgName = current?.org_name || ''
    const typed =
      flags.yes === true
        ? orgName
        : await prompt(
            `Type the organization name to confirm${orgName ? ` (${orgName})` : ''}: `,
            ''
          )
    if (orgName && typed.trim() !== orgName.trim()) {
      throw new Error('Name did not match — nothing changed.')
    }
  } else if (flags.yes !== true) {
    const ok = await prompt('Return this workspace to sandbox? Real sends will stop. [y/N]: ', 'N')
    if (!/^y(es)?$/i.test(ok.trim())) {
      log('Cancelled.')
      return
    }
  }

  try {
    await apiRequest(
      'PUT',
      `/lira/v1/support/config/orgs/${encodeURIComponent(orgId)}`,
      { environment: target },
      flags,
      { auth: 'any' }
    )
  } catch (err) {
    if (String(err.message).includes('402') || /subscription/i.test(err.message)) {
      log('')
      log('An active subscription is required to go live on this plan.')
      log('Checkout needs a browser, so finish it in the dashboard:')
      log('  https://app.liraintelligence.com/settings  →  Environment  →  Go live')
      process.exitCode = 1
      return
    }
    throw err
  }

  log(
    target === 'production'
      ? 'You are live. Live keys are now active.'
      : 'Back in sandbox. Real sends are suppressed.'
  )
}

async function runKeys(args) {
  const action = args[0] || 'list'
  const flags = parseFlags(args.slice(1))

  if (action === 'use') {
    // Purely local — saves a key against a mode. Deliberately before the org-id
    // check: pasting a key you were just given shouldn't need any other setup.
    const key = requireValue(flags['api-key'] || args[1], 'key (`--api-key`)')
    const mode = key.startsWith('lira_sk_live_')
      ? 'live'
      : key.startsWith('lira_sk_test_')
        ? 'test'
        : activeMode(flags)
    const config = readConfig()
    writeConfig({ ...config, mode, keys: { ...(config.keys || {}), [mode]: key } })
    log(
      `Saved ${mode.toUpperCase()} key ${maskKey(key)} and switched to ${mode.toUpperCase()} mode.`
    )
    if (mode === 'live') log('⚠  LIVE mode: commands now affect real customer traffic.')
    return
  }

  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')
  if (action === 'create') {
    const payload = await apiRequest(
      'POST',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys`,
      {
        name: flags.name || 'Lira CLI key',
        scopes: splitCsv(flags.scopes) || ['mcp:read', 'mcp:write'],
        expires_at: flags['expires-at'],
        // Defaults to the CLI's current mode, so `lira mode live` followed by
        // `lira keys create` does the obvious thing.
        mode: activeMode(flags),
      },
      flags,
      { auth: 'jwt' }
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
      flags,
      { auth: 'jwt' }
    )
    printTable(payload.keys || [], [
      { label: 'KEY ID', value: (row) => row.key_id },
      { label: 'NAME', value: (row) => row.name },
      { label: 'MODE', value: (row) => (row.mode || 'legacy').toUpperCase() },
      { label: 'STATUS', value: (row) => row.status },
      { label: 'SCOPES', value: (row) => (row.scopes || []).join(',') },
      { label: 'LAST USED', value: (row) => row.last_used_at || '-' },
    ])
    return
  }
  if (action === 'show') {
    // Answers "what is this key actually allowed to do?" without the dashboard.
    const keyId = requireValue(flags['key-id'] || args[1], 'key id (`--key-id`)')
    const payload = await apiRequest(
      'GET',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys`,
      undefined,
      flags,
      { auth: 'jwt' }
    )
    const key = (payload.keys || []).find((k) => k.key_id === keyId)
    if (!key) throw new Error(`No key ${keyId} on org ${orgId}`)
    printJson({
      key_id: key.key_id,
      name: key.name,
      environment: key.mode === 'live' ? 'production' : key.mode === 'test' ? 'sandbox' : 'legacy',
      scopes: key.scopes,
      status: key.status,
      last_used_at: key.last_used_at ?? null,
      expires_at: key.expires_at ?? null,
      token_prefix: key.token_prefix,
    })
    return
  }
  if (action === 'update') {
    // Tighten or widen an existing key in place — the token does not change, so
    // nothing needs redeploying.
    const keyId = requireValue(flags['key-id'] || args[1], 'key id (`--key-id`)')
    const body = {}
    if (flags.name) body.name = String(flags.name)
    if (flags.scopes) body.scopes = splitCsv(flags.scopes)
    if (Object.keys(body).length === 0) {
      throw new Error('Nothing to change. Pass --scopes=… and/or --name=…')
    }
    const payload = await apiRequest(
      'PATCH',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys/${encodeURIComponent(keyId)}`,
      body,
      flags,
      { auth: 'jwt' }
    )
    log(`Updated ${keyId}. Scopes: ${(payload.key?.scopes || []).join(', ')}`)
    return
  }
  if (action === 'revoke') {
    const keyId = requireValue(flags['key-id'] || args[1], 'key id (`--key-id`)')
    await apiRequest(
      'DELETE',
      `/lira/v1/support/developer-keys/orgs/${encodeURIComponent(orgId)}/keys/${encodeURIComponent(keyId)}`,
      undefined,
      flags,
      { auth: 'jwt' }
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
    const endpoint = requireValue(
      flags.endpoint || flags['endpoint-url'],
      'MCP endpoint (`--endpoint`)'
    )
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
    const sourceName = requireValue(
      flags['source-name'] || flags.source,
      'source tool name (`--source-name`)'
    )
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
    const approvedTools = [...existing.filter((tool) => tool.source_name !== sourceName), nextTool]
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

/**
 * Crawled website pages. Kept beside documents everywhere tags are concerned:
 * they are a separate record type but the SAME segment filter applies, and
 * treating them separately is how half a knowledge base ends up untagged.
 *
 * Best-effort — a workspace that has never crawled anything should see no table
 * rather than an error.
 */
async function listWebSources(orgId, flags) {
  try {
    const payload = await apiRequest(
      'GET',
      `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base`,
      undefined,
      flags,
      { auth: 'any' }
    )
    return payload?.entries ?? []
  } catch {
    return []
  }
}

/**
 * `--segments=personal,all` → ['personal','all'].
 *
 * Normalized the same way the server and dashboard do, so "SME & Business"
 * typed in three places lands on one tag instead of three near-misses that
 * silently never match.
 */
function parseSegmentsFlag(flags) {
  const raw = flags.segments ?? flags.segment ?? flags['product-type'] ?? flags.products
  if (raw === undefined || raw === true) return []
  return Array.from(
    new Set(
      String(raw)
        .split(',')
        .map((part) =>
          part
            .trim()
            .toLowerCase()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .replace(/_+/g, '_')
            .slice(0, 64)
        )
        .filter(Boolean)
    )
  ).slice(0, 20)
}

/** Extensions the backend can extract text from (PDF is deliberately absent). */
const DOC_MIME = {
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * `lira docs` — knowledge base from the terminal.
 *
 * The dashboard's "Write a note directly" is a compose affordance, not a
 * separate kind of object: it wraps the text in Markdown and uploads it as a
 * document. `docs add --text` does exactly the same thing, so a note written
 * here and a note written in the dashboard are the same record.
 */
async function runDocs(args) {
  const action = args[0] && !args[0].startsWith('--') ? args[0] : 'list'
  const positional = args[1] && !args[1].startsWith('--') ? args[1] : undefined
  const flags = parseFlags(args.filter((a) => a.startsWith('--')))
  const orgId = requireValue(defaultOrgId(flags), 'org id (`--org-id` or LIRA_ORG_ID)')
  const base = `/lira/v1/orgs/${encodeURIComponent(orgId)}/documents`

  if (action === 'list') {
    const payload = await apiRequest('GET', base, undefined, flags, { auth: 'any' })
    const docs = payload?.documents ?? []
    printTable(docs, [
      { label: 'DOC ID', value: (r) => r.doc_id ?? r.id },
      { label: 'NAME', value: (r) => r.file_name ?? r.filename ?? '—' },
      { label: 'STATUS', value: (r) => r.status ?? '—' },
      { label: 'CHUNKS', value: (r) => r.chunk_count ?? 0 },
      // "every product" is the honest rendering of an empty tag list: it is
      // what retrieval actually does, and reading a dash as "not in use yet"
      // is how a workspace ships an untagged file into every product.
      {
        label: 'PRODUCTS',
        value: (r) => (r.segments?.length ? r.segments.join(',') : 'every product'),
      },
      { label: 'PRIORITY', value: (r) => r.authority ?? 'normal' },
    ])
    // Crawled pages are filtered by the SAME tags as documents, so counting only
    // documents here is how a workspace reaches "0 untagged", turns on strict
    // mode, and silently loses every page it ever crawled.
    const pages = await listWebSources(orgId, flags)
    if (pages.length > 0) {
      log('')
      printTable(pages, [
        { label: 'PAGE ID', value: (r) => r.page_id ?? r.id },
        { label: 'TITLE', value: (r) => String(r.title ?? r.url ?? '—').slice(0, 44) },
        {
          label: 'PRODUCTS',
          value: (r) => (r.segments?.length ? r.segments.join(',') : 'every product'),
        },
        { label: 'PRIORITY', value: (r) => r.authority ?? 'background' },
      ])
    }

    const untaggedDocs = docs.filter((d) => !d.segments?.length).length
    const untaggedPages = pages.filter((p) => !p.segments?.length).length
    const untagged = untaggedDocs + untaggedPages
    const total = docs.length + pages.length
    if (untagged > 0 && total > untagged) {
      log('')
      log(
        `${untagged} of ${total} sources carry no tags (${untaggedDocs} document${untaggedDocs === 1 ? '' : 's'}, ` +
          `${untaggedPages} crawled page${untaggedPages === 1 ? '' : 's'}), so they answer every product.`
      )
      log(
        'Tag them with `lira docs tag --untagged --segments=…` (add --sources for crawled pages).'
      )
      log('Drive this to zero BEFORE turning on "Only answer from tagged documents".')
    }
    return
  }

  if (action === 'add') {
    const filePath = flags.file
    const text = flags.text
    if (!filePath && !text) {
      throw new Error('Pass --file=<path> to upload a file, or --text="..." to write a note.')
    }
    if (filePath && text) {
      throw new Error('Use either --file or --text, not both.')
    }

    let buffer
    let filename
    let mime
    if (filePath) {
      const resolved = path.resolve(process.cwd(), filePath)
      if (!fs.existsSync(resolved)) throw new Error(`No such file: ${resolved}`)
      buffer = fs.readFileSync(resolved)
      filename = path.basename(resolved)
      const ext = path.extname(filename).toLowerCase()
      if (ext === '.pdf') {
        throw new Error(
          'PDFs are not supported — they are often image-based and extract badly. ' +
            'Export to DOCX, TXT or Markdown first.'
        )
      }
      mime = DOC_MIME[ext] || 'application/octet-stream'
    } else {
      // Same shape the dashboard produces: an optional title becomes an H1 so
      // the heading is part of what gets embedded and cited.
      const title = (flags.title || '').trim()
      const body = String(text).trim()
      if (!body) throw new Error('--text is empty.')
      buffer = Buffer.from(title ? `# ${title}\n\n${body}\n` : `${body}\n`, 'utf8')
      filename = `${(title || 'note').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`
      mime = 'text/markdown'
    }

    const segments = parseSegmentsFlag(flags)
    const payload = await apiUpload(base, buffer, filename, mime, flags, segments)
    const doc = payload?.document ?? payload
    log(
      `Uploaded ${filename} — doc id ${doc?.doc_id ?? doc?.id}, status ${doc?.status ?? 'uploaded'}.`
    )
    log(
      segments.length > 0
        ? `Scoped to: ${segments.join(', ')}.`
        : 'No product tags, so this answers every product. Add --segments=… to scope it.'
    )
    log('Indexing runs in the background; `lira docs list` shows when it is done.')
    return
  }

  if (action === 'tag') {
    const segments = parseSegmentsFlag(flags)
    const all = asBool(flags.all, false)
    const untaggedOnly = asBool(flags.untagged, false)
    const match = typeof flags.match === 'string' ? flags.match.toLowerCase() : null

    // Bulk: `--all`, `--untagged`, or `--match=<text in the filename>`. A
    // knowledge base is tagged in one pass or not at all — doing it one id at a
    // time is how half of it stays untagged, which is the failure this feature
    // exists to prevent.
    // --sources switches the target set to crawled pages. Same tags, same
    // filter, different record type — and the one people forget.
    const onSources = asBool(flags.sources, false) || asBool(flags['web-sources'], false)
    const patchPath = (id) =>
      onSources
        ? `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base/${encodeURIComponent(id)}/segments`
        : `${base}/${encodeURIComponent(id)}/segments`

    let targets
    if (all || untaggedOnly || match) {
      const items = onSources
        ? (await listWebSources(orgId, flags)).map((p) => ({
            id: p.page_id ?? p.id,
            name: p.title ?? p.url ?? p.page_id,
            haystack: `${p.title ?? ''} ${p.url ?? ''}`,
            segments: p.segments,
          }))
        : ((await apiRequest('GET', base, undefined, flags, { auth: 'any' }))?.documents ?? []).map(
            (d) => ({
              id: d.doc_id ?? d.id,
              name: d.file_name ?? d.doc_id ?? d.id,
              haystack: String(d.file_name ?? ''),
              segments: d.segments,
            })
          )
      targets = items
        .filter((d) => (untaggedOnly ? !d.segments?.length : true))
        .filter((d) => (match ? d.haystack.toLowerCase().includes(match) : true))
        .map((d) => ({ id: d.id, name: d.name }))
      if (targets.length === 0) {
        log('No documents matched, so nothing was changed.')
        return
      }
      log(
        `Tagging ${targets.length} ${onSources ? 'crawled page' : 'document'}${targets.length === 1 ? '' : 's'}…`
      )
    } else {
      const docId = requireValue(
        positional || flags['doc-id'] || flags['page-id'],
        'a document id (`lira docs tag <doc_id> --segments=personal,all`), or --all / --untagged / --match= (add --sources for crawled pages)'
      )
      targets = [{ id: docId, name: docId }]
    }

    // No --segments clears the tags rather than doing nothing: putting a
    // document back in front of every product should be as explicit as scoping
    // it was, and it is the only way to undo a mistaken bulk run.
    let failed = 0
    for (const target of targets) {
      try {
        await apiRequest('PATCH', patchPath(target.id), { segments }, flags, { auth: 'any' })
        if (targets.length > 1) log(`  ${target.name} → ${segments.join(', ') || 'every product'}`)
      } catch (err) {
        failed++
        log(`  ${target.name} FAILED: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }

    const done = targets.length - failed
    const noun = onSources ? 'crawled page' : 'document'
    log(
      segments.length > 0
        ? `${done} ${noun}${done === 1 ? '' : 's'} now ${done === 1 ? 'answers' : 'answer'}: ${segments.join(', ')}.`
        : `${done} ${noun}${done === 1 ? '' : 's'} now ${done === 1 ? 'has' : 'have'} no tags, so ${done === 1 ? 'it answers' : 'they answer'} every product.`
    )
    // A partial bulk run is the dangerous outcome — some documents scoped and
    // some not — so it exits non-zero and CI stops instead of reporting success.
    if (failed > 0) {
      log(`${failed} failed and were left unchanged.`)
      process.exitCode = 1
    }
    return
  }

  if (action === 'rm' || action === 'remove' || action === 'delete') {
    const onSources = asBool(flags.sources, false) || asBool(flags['web-sources'], false)
    const noun = onSources ? 'crawled page' : 'document'
    const kbBase = `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base`
    const deletePath = (id) =>
      onSources ? `${kbBase}/${encodeURIComponent(id)}` : `${base}/${encodeURIComponent(id)}`

    const untaggedOnly = asBool(flags.untagged, false)
    const match = typeof flags.match === 'string' ? flags.match.toLowerCase() : null

    // Bulk delete is opt-in per selector and never implied by a bare `rm`.
    // Deleting knowledge is not undoable from here — a re-crawl can bring pages
    // back but not the tags applied to them since.
    let targets
    if (untaggedOnly || match) {
      const items = onSources
        ? (await listWebSources(orgId, flags)).map((p) => ({
            id: p.page_id ?? p.id,
            name: p.title ?? p.url ?? p.page_id,
            haystack: `${p.title ?? ''} ${p.url ?? ''}`,
            segments: p.segments,
          }))
        : ((await apiRequest('GET', base, undefined, flags, { auth: 'any' }))?.documents ?? []).map(
            (d) => ({
              id: d.doc_id ?? d.id,
              name: d.file_name ?? d.doc_id ?? d.id,
              haystack: String(d.file_name ?? ''),
              segments: d.segments,
            })
          )
      targets = items
        .filter((d) => (untaggedOnly ? !d.segments?.length : true))
        .filter((d) => (match ? d.haystack.toLowerCase().includes(match) : true))
      if (targets.length === 0) {
        log('No sources matched, so nothing was deleted.')
        return
      }
      if (!asBool(flags.yes, false)) {
        log(`This would delete ${targets.length} ${noun}${targets.length === 1 ? '' : 's'}:`)
        for (const t of targets) log(`  ${t.name}`)
        log('')
        log('Re-run with --yes to delete them.')
        return
      }
    } else {
      const id = requireValue(
        positional || flags['doc-id'] || flags['page-id'],
        `${noun} id (\`lira docs rm <id>\`${onSources ? '' : ', or --sources for crawled pages'}), or --untagged / --match= for bulk`
      )
      targets = [{ id, name: id }]
    }

    let failed = 0
    for (const target of targets) {
      try {
        await apiRequest('DELETE', deletePath(target.id), undefined, flags, { auth: 'any' })
        if (targets.length > 1) log(`  deleted ${target.name}`)
      } catch (err) {
        failed++
        log(`  ${target.name} FAILED: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }
    const done = targets.length - failed
    log(
      `Deleted ${done} ${noun}${done === 1 ? '' : 's'}. The slot${done === 1 ? '' : 's'} they used ${done === 1 ? 'is' : 'are'} free again.`
    )
    if (failed > 0) {
      log(`${failed} failed and still exist.`)
      process.exitCode = 1
    }
    return
  }

  if (action === 'authority' || action === 'priority') {
    const level = String(flags.level ?? flags.authority ?? flags.tier ?? '')
      .trim()
      .toLowerCase()
    if (!['primary', 'normal', 'background'].includes(level)) {
      throw new Error(
        'Pass --level=primary, --level=normal or --level=background.\n' +
          '  primary     answers whenever it is relevant, ahead of everything else\n' +
          '  normal      the default for uploaded documents\n' +
          '  background  answers only when nothing above it matched (default for crawled pages)'
      )
    }
    const onSources = asBool(flags.sources, false) || asBool(flags['web-sources'], false)
    const noun = onSources ? 'crawled page' : 'document'
    const kbBase = `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base`
    const authorityPath = (id) =>
      onSources
        ? `${kbBase}/${encodeURIComponent(id)}/authority`
        : `${base}/${encodeURIComponent(id)}/authority`

    const all = asBool(flags.all, false)
    const match = typeof flags.match === 'string' ? flags.match.toLowerCase() : null

    let targets
    if (all || match) {
      const items = onSources
        ? (await listWebSources(orgId, flags)).map((p) => ({
            id: p.page_id ?? p.id,
            name: p.title ?? p.url ?? p.page_id,
            haystack: `${p.title ?? ''} ${p.url ?? ''}`,
          }))
        : ((await apiRequest('GET', base, undefined, flags, { auth: 'any' }))?.documents ?? []).map(
            (d) => ({
              id: d.doc_id ?? d.id,
              name: d.file_name ?? d.doc_id ?? d.id,
              haystack: String(d.file_name ?? ''),
            })
          )
      targets = items.filter((d) => (match ? d.haystack.toLowerCase().includes(match) : true))
      if (targets.length === 0) {
        log('Nothing matched, so nothing was changed.')
        return
      }
      log(`Setting ${targets.length} ${noun}${targets.length === 1 ? '' : 's'} to ${level}…`)
    } else {
      const id = requireValue(
        positional || flags['doc-id'] || flags['page-id'],
        `${noun} id (\`lira docs authority <id> --level=primary\`), or --all / --match=`
      )
      targets = [{ id, name: id }]
    }

    let failed = 0
    for (const target of targets) {
      try {
        await apiRequest('PATCH', authorityPath(target.id), { authority: level }, flags, {
          auth: 'any',
        })
        if (targets.length > 1) log(`  ${target.name} → ${level}`)
      } catch (err) {
        failed++
        log(`  ${target.name} FAILED: ${err instanceof Error ? err.message : 'unknown error'}`)
      }
    }
    const done = targets.length - failed
    log(`${done} ${noun}${done === 1 ? '' : 's'} set to ${level}.`)
    if (level === 'primary') {
      log('Primary sources answer ahead of everything else whenever they are relevant.')
    }
    if (failed > 0) {
      log(`${failed} failed and were left unchanged.`)
      process.exitCode = 1
    }
    return
  }

  if (action === 'prune') {
    // Deleting a crawled page used to leave its chunks in the index, so every
    // page ever deleted kept answering customers while appearing in no list.
    // Dry-run first: this deletes content nothing else can show you.
    const apply = asBool(flags.yes, false) || asBool(flags.apply, false)
    const payload = await apiRequest(
      'POST',
      `/lira/v1/orgs/${encodeURIComponent(orgId)}/knowledge-base/prune`,
      { apply },
      flags,
      { auth: 'any' }
    )
    const orphaned = payload?.orphaned ?? []
    if (!apply) {
      log(`${orphaned.length} orphaned source${orphaned.length === 1 ? '' : 's'} in the index.`)
      log(`${payload?.live ?? 0} crawled page${payload?.live === 1 ? '' : 's'} are real and stay.`)
      if (orphaned.length > 0) {
        log('')
        log('These are chunks of pages that were deleted but never left the search index —')
        log('they still answer customers and appear in no list. Re-run with --yes to remove them.')
      }
      return
    }
    log(
      `Removed ${payload?.deleted ?? 0} orphaned source${payload?.deleted === 1 ? '' : 's'} from the index.`
    )
    return
  }

  if (action === 'ask') {
    const question = requireValue(positional || flags.query, 'a question (`lira docs ask "..."`)')
    // Asking AS a product is the whole point of a smoke test here: it answers
    // "what would a Personal customer actually be told?" without minting a
    // session or opening the widget.
    const askSegments = parseSegmentsFlag(flags)
    const payload = await apiRequest(
      'POST',
      `/lira/v1/orgs/${encodeURIComponent(orgId)}/kb/query`,
      askSegments.length > 0 ? { query: question, segments: askSegments } : { query: question },
      flags,
      { auth: 'any' }
    )
    log('')
    log(payload?.answer ?? '(no answer)')
    // One document usually contributes several chunks; showing it once is what
    // answers "which document did this come from?".
    const names = [...new Set((payload?.sources ?? []).map((s) => s.name).filter(Boolean))]
    if (names.length) {
      log('')
      log(`Sources: ${names.join(', ')}`)
    }
    return
  }

  throw new Error(
    `Unknown docs command: ${action}. Use list, add, tag, authority, rm, prune, or ask.`
  )
}

/**
 * Multipart upload. Kept separate from apiRequest because that one always sends
 * JSON, and the documents route reads a file part.
 */
async function apiUpload(requestPath, buffer, filename, mime, flags, segments = []) {
  if (typeof fetch !== 'function' || typeof FormData !== 'function') {
    throw new Error('This CLI requires Node.js 18+ because it uses the built-in fetch API.')
  }
  const token = authTokenOrJwt(flags)
  requireValue(token, 'Authentication token (run `lira login` or set LIRA_API_KEY)')
  const form = new FormData()
  // Fields first, file last: the server reads the file part and the fields
  // parsed alongside it, so a tag sent after the file can arrive too late.
  if (segments.length > 0) form.append('segments', segments.join(','))
  form.append('file', new Blob([buffer], { type: mime }), filename)
  const response = await fetch(`${apiBase(flags)}${requestPath}`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: form,
  })
  const text = await response.text()
  const payload = text ? safeJson(text) : {}
  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || `Upload failed with HTTP ${response.status}`
    )
  }
  return payload
}

function printHelp() {
  log(`Usage:
  lira init [--org-id=org-xxxx] [--org-name="My Co"]
  lira login [--email=me@example.com] [--password=...]
  lira status                                   What will my next command do?
  lira config show
  lira config set [--org-id=org-xxxx] [--api-url=https://api.creovine.com]

Test / live mode (which key your commands use):
  lira mode                                     Show the current mode and saved keys
  lira mode test | lira mode live               Switch mode
  lira keys use --api-key=lira_sk_live_...      Save a key (mode detected from the prefix)

Workspace environment (the commercial switch — real sends + billing):
  lira env show
  lira env go-live [--yes]                      Turn on real sends for LIVE-key traffic
  lira env sandbox [--yes]                      Return to sandbox

Channels (web chat, voice, email, hosted portal):
  lira channels                                 Show what is on
  lira channels enable voice                    Turn a channel on
  lira channels disable portal

Developer keys:
  lira keys create --org-id=org-xxxx --name="Riverly CI" --mode=test --scopes=mcp:read,mcp:write,sessions:mint
  lira keys list --org-id=org-xxxx
  lira keys show --key-id=<key_id>              What is this key allowed to do?
  lira keys update --key-id=<key_id> --scopes=support:read,support:write
  lira keys revoke --org-id=org-xxxx --key-id=<key_id>

Knowledge base (needs a key with support:read / support:write):
  lira docs list                                What Lira knows, its tags, and whether it indexed
  lira docs add --file=./handbook.docx          Upload a file (DOCX, TXT, MD, CSV, XLSX — not PDF)
  lira docs add --text="Refunds take 14 days." --title="Refunds"
  lira docs ask "How long do refunds take?"     Ask what a customer would ask
  lira docs rm <doc_id>                         Delete and free the slot
  lira docs rm <page_id> --sources              Delete a crawled page (removes its chunks)
  lira docs rm --sources --untagged --yes       Bulk delete; dry-runs without --yes
  lira docs authority <id> --level=primary      Answer from this ahead of everything else
  lira docs authority --sources --all --level=background
                                                Crawled pages answer only as a fallback
  lira docs prune                               Find chunks of deleted pages still answering
  lira docs prune --yes                         Remove them

One workspace, several products (Personal / Business / Corporate, brands, regions):
  lira docs add --file=./personal-faq.md --segments=personal
  lira docs add --file=./pin-reset.md --segments=all      Shared content, tagged once
  lira docs tag <doc_id> --segments=personal,all          Re-tag one document
  lira docs tag --untagged --segments=all                 Bulk: everything still untagged
  lira docs tag --match=corporate --segments=corporate    Bulk: by filename
  lira docs tag --all --segments=all                      Bulk: every document
  lira docs tag --sources --untagged --segments=all       Bulk: crawled website pages
  lira docs ask "What do I need to open an account?" --segments=personal
                                                Answer as a Personal customer would get it

  Crawled pages obey the SAME tags as documents. \`lira docs list\` counts both —
  drive that count to zero before turning on "Only answer from tagged documents".

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
  LIRA_API_KEY       Scoped developer key for automation (overrides the saved per-mode key).
  LIRA_MODE          test | live — the mode for this shell.

Modes vs the workspace:
  \`lira mode\` picks which KEY you use. \`lira env\` changes the WORKSPACE.
  A live key does nothing real until the workspace itself has gone live.
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
  if (subcommand === 'mode') {
    await runMode(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'status') {
    await runStatus(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'env') {
    await runEnv(args.slice(1))
    closeRl()
    return
  }
  if (subcommand === 'channels') {
    await runChannels(args.slice(1))
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
  if (subcommand === 'docs' || subcommand === 'kb') {
    await runDocs(args.slice(1))
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
