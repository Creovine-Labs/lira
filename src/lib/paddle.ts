import { getBillingConfig, type BillingConfig } from '@/services/api'

// ── Paddle.js loader + checkout helper ────────────────────────────────────────
//
// Paddle.js is injected lazily (only when an admin actually reaches for
// billing) from Paddle's CDN, then initialized with the publishable client
// token served by the backend (/v1/billing/config). The plan itself is applied
// server-side by the Paddle webhook — the frontend only opens the overlay and
// listens for `checkout.completed` to give the user immediate feedback.

const PADDLE_JS_SRC = 'https://cdn.paddle.com/paddle/v2/paddle.js'

interface PaddleCheckoutOpenOptions {
  transactionId?: string
  settings?: Record<string, unknown>
}

interface PaddleEnvironment {
  set: (environment: 'sandbox' | 'production') => void
}

interface PaddleEventData {
  name?: string
  [key: string]: unknown
}

interface PaddleInitializeOptions {
  token: string
  eventCallback?: (event: PaddleEventData) => void
}

interface PaddleGlobal {
  Environment: PaddleEnvironment
  Initialize: (options: PaddleInitializeOptions) => void
  Checkout: { open: (options: PaddleCheckoutOpenOptions) => void; close?: () => void }
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal
  }
}

let scriptPromise: Promise<void> | null = null

// The token/env Paddle.js is currently initialized with. An org billing on a
// different env (sandbox vs live) needs a re-Initialize with that env's token,
// so we track what we last initialized and only re-init when it changes.
let initializedToken: string | null = null
let initializedEnv: BillingConfig['environment'] | null = null

// One completion listener at a time — set right before we open a checkout.
let pendingCompletion: (() => void) | null = null

function injectScript(): Promise<void> {
  if (window.Paddle) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PADDLE_JS_SRC}"]`)
    if (existing && window.Paddle) {
      resolve()
      return
    }
    const script = existing ?? document.createElement('script')
    script.src = PADDLE_JS_SRC
    script.async = true
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => {
      scriptPromise = null
      reject(new Error('Could not load Paddle. Check your connection and try again.'))
    })
    if (!existing) document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Ensure Paddle.js is loaded and initialized for a SPECIFIC org. Config
 * (publishable token + environment) is fetched per-org from the backend, so a
 * sandbox org initializes the sandbox account and a live org the live one. If
 * the previously initialized env/token differs from this org's, Paddle.js is
 * re-Initialized with the correct one. Throws a friendly Error the caller can
 * toast when Paddle is not configured (empty token).
 */
export async function ensurePaddle(orgId: string): Promise<void> {
  const config = await getBillingConfig(orgId)
  if (!config.clientToken) {
    throw new Error('Billing is not available yet. Please contact the Lira team to enable it.')
  }
  await injectScript()
  if (!window.Paddle) {
    throw new Error('Could not initialize Paddle. Please try again.')
  }
  // Already initialized for this exact env + token — nothing to do.
  if (initializedToken === config.clientToken && initializedEnv === config.environment) {
    return
  }
  window.Paddle.Environment.set(config.environment)
  window.Paddle.Initialize({
    token: config.clientToken,
    eventCallback: (event) => {
      if (event?.name === 'checkout.completed') {
        if (pendingCompletion) {
          const cb = pendingCompletion
          pendingCompletion = null
          cb()
        }
        // Auto-dismiss the overlay shortly after success so the customer
        // doesn't have to hit Close manually — they briefly see Paddle's
        // confirmation, then the page toast takes over.
        setTimeout(() => window.Paddle?.Checkout?.close?.(), 1500)
      }
    },
  })
  initializedToken = config.clientToken
  initializedEnv = config.environment
}

/**
 * Open the Paddle checkout overlay for a backend-created transaction. Paddle.js
 * is initialized against the org's own env first, so a sandbox org opens the
 * sandbox overlay (test cards) and a live org the live one. The optional
 * onComplete fires when Paddle emits `checkout.completed`.
 */
export async function openPaddleCheckout(
  transactionId: string,
  orgId: string,
  onComplete?: () => void
): Promise<void> {
  await ensurePaddle(orgId)
  if (!window.Paddle) {
    throw new Error('Could not initialize Paddle. Please try again.')
  }
  pendingCompletion = onComplete ?? null
  window.Paddle.Checkout.open({ transactionId })
}
