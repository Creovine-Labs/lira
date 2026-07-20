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
  Checkout: { open: (options: PaddleCheckoutOpenOptions) => void }
}

declare global {
  interface Window {
    Paddle?: PaddleGlobal
  }
}

let scriptPromise: Promise<void> | null = null
let initPromise: Promise<void> | null = null
let cachedConfig: BillingConfig | null = null

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
 * Ensure Paddle.js is loaded and initialized. Config (publishable token +
 * environment) is fetched once from the backend and cached. Throws a friendly
 * Error the caller can toast when Paddle is not configured (empty token).
 */
export async function ensurePaddle(): Promise<void> {
  if (initPromise) return initPromise

  initPromise = (async () => {
    if (!cachedConfig) {
      cachedConfig = await getBillingConfig()
    }
    if (!cachedConfig.clientToken) {
      throw new Error('Billing is not available yet. Please contact the Lira team to enable it.')
    }
    await injectScript()
    if (!window.Paddle) {
      throw new Error('Could not initialize Paddle. Please try again.')
    }
    window.Paddle.Environment.set(cachedConfig.environment)
    window.Paddle.Initialize({
      token: cachedConfig.clientToken,
      eventCallback: (event) => {
        if (event?.name === 'checkout.completed' && pendingCompletion) {
          const cb = pendingCompletion
          pendingCompletion = null
          cb()
        }
      },
    })
  })().catch((err) => {
    // Reset so a later retry (e.g. after configuring Paddle) can re-init.
    initPromise = null
    throw err
  })

  return initPromise
}

/**
 * Open the Paddle checkout overlay for a backend-created transaction. The
 * optional onComplete fires when Paddle emits `checkout.completed`.
 */
export async function openPaddleCheckout(
  transactionId: string,
  onComplete?: () => void
): Promise<void> {
  await ensurePaddle()
  if (!window.Paddle) {
    throw new Error('Could not initialize Paddle. Please try again.')
  }
  pendingCompletion = onComplete ?? null
  window.Paddle.Checkout.open({ transactionId })
}
