/**
 * Demo synthetic profile — pure client-side, no backend round-trip.
 *
 * The profile is generated locally from the visitor's input (a first name
 * and a plan tier), keyed deterministically so the same name always yields
 * the same dashboard data within the demo. It lives in sessionStorage and
 * NEVER touches our backend — there's no need for it to, because:
 *   - It's synthetic Nimbus data, not a real Lira customer record
 *   - Only the visitor's own browser ever reads it (dashboard + widget)
 *   - It expires when the tab closes
 *
 * This makes the demo:
 *   - Resilient — works even when api.creovine.com is down or hasn't
 *     deployed the test-profile route
 *   - Instant — no network latency on the "Open the demo →" click
 *   - Genuinely private — no PII leaves the visitor's browser
 *
 * Future enhancement: if we want the AI to know the profile (so the chat
 * can reference "your last invoice was $49"), we can pass profile facts to
 * the widget via data-attributes on the script tag, OR sync the profile to
 * the backend on widget connect. That's a separate decision.
 *
 * The custom `lira-demo-profile-changed` event lets components in the
 * same tab re-render when the profile is created or cleared.
 */

import { useEffect, useState } from 'react'

const PROFILE_STORAGE_KEY = 'lira_demo_profile'
const VISITOR_STORAGE_KEY = 'lira_visitor_id_session'
const CHANGE_EVENT = 'lira-demo-profile-changed'

export type PlanTier = 'starter' | 'growth' | 'business'

export type CardBrand = 'VISA' | 'Mastercard' | 'Amex' | 'Discover'
export type SubscriptionStatus = 'active' | 'canceled'

export interface PaymentCard {
  brand: CardBrand
  last4: string
  exp: string // MM/YY
}

export interface DemoProfile {
  visitor_id: string
  name: string
  plan: PlanTier
  plan_label: string
  signed_up_at: string
  last_invoice_amount_usd: number
  last_invoice_date: string
  next_invoice_date: string
  team_seats: number
  open_issues: string | null
  /** Locally-mutable settings. Defaulted on profile creation. */
  card: PaymentCard
  subscription_status: SubscriptionStatus
}

export const PLAN_TIERS: PlanTier[] = ['starter', 'growth', 'business']

export const PLAN_DETAILS: Record<
  PlanTier,
  { label: string; price: number; tagline: string; features: string[] }
> = {
  starter: {
    label: 'Starter',
    price: 19,
    tagline: 'Solo and very small teams',
    features: [
      'Up to 3 users',
      'Unlimited invoices',
      'Unlimited expenses',
      'Basic reporting',
    ],
  },
  growth: {
    label: 'Growth',
    price: 49,
    tagline: 'Most popular for 10–50 person teams',
    features: [
      'Up to 15 users',
      'Recurring billing',
      'Multi-currency invoicing',
      'QuickBooks/Xero sync',
      'Slack notifications',
    ],
  },
  business: {
    label: 'Business',
    price: 129,
    tagline: 'For growing 50+ person teams',
    features: [
      'Unlimited users',
      'SSO + advanced permissions',
      'Audit log + SOC 2 reports',
      'Custom approval workflows',
      'Priority support',
    ],
  },
}

// ── Client-side profile factory ─────────────────────────────────────────────
// Mirrors the algorithm in creovine-backend's lira-demo-profile.service.ts
// (deterministic hash → plausible facts) but runs entirely in the browser.

const PLAN_AMOUNTS: Record<PlanTier, number> = {
  starter: 19,
  growth: 49,
  business: 129,
}

const PLAN_LABELS: Record<PlanTier, string> = {
  starter: 'Starter',
  growth: 'Growth',
  business: 'Business',
}

/** Fast deterministic hash (FNV-1a). Same input → same number. */
function hashFromString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

function hashInRange(input: string, max: number): number {
  return hashFromString(input) % max
}

function getOrCreateVisitorId(): string {
  const KEY = 'lira_visitor_id_session'
  try {
    const existing = sessionStorage.getItem(KEY)
    if (existing) return existing
  } catch {
    /* sessionStorage unavailable */
  }
  const id = 'v_' + crypto.randomUUID()
  try {
    sessionStorage.setItem(KEY, id)
  } catch {
    /* ignore */
  }
  return id
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Create a synthetic demo profile in the browser and persist it to
 * sessionStorage. Broadcasts `lira-demo-profile-changed` so subscribed
 * components re-render immediately.
 *
 * Returns the minted profile so callers can use it directly (e.g. to
 * navigate to the dashboard).
 */
export function createDemoProfile(rawName: string, plan: PlanTier = 'growth'): DemoProfile {
  const name = rawName.trim().slice(0, 40)
  if (!name) throw new Error('Name is required')

  const visitorId = getOrCreateVisitorId()
  const seed = `${name}|${plan}`
  const now = new Date()

  // Signed up 4-24 months ago
  const signed = new Date(now)
  signed.setMonth(signed.getMonth() - (4 + hashInRange(seed, 20)))

  // Last invoice 1-29 days ago
  const lastInv = new Date(now)
  lastInv.setDate(lastInv.getDate() - (1 + hashInRange(seed + 'inv', 28)))

  // Next invoice = last + 1 month
  const nextInv = new Date(lastInv)
  nextInv.setMonth(nextInv.getMonth() + 1)

  const team_seats =
    plan === 'starter'
      ? 2 + hashInRange(seed, 2)
      : plan === 'growth'
        ? 5 + hashInRange(seed, 10)
        : 12 + hashInRange(seed, 30)

  const profile: DemoProfile = {
    visitor_id: visitorId,
    name,
    plan,
    plan_label: PLAN_LABELS[plan],
    signed_up_at: isoDate(signed),
    last_invoice_date: isoDate(lastInv),
    next_invoice_date: isoDate(nextInv),
    last_invoice_amount_usd: PLAN_AMOUNTS[plan],
    team_seats,
    open_issues: null,
    // Default settings — mutable via updateDemoProfile()
    card: { brand: 'VISA', last4: '4242', exp: '09/28' },
    subscription_status: 'active',
  }

  try {
    sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: profile }))
  } catch {
    /* sessionStorage unavailable — return the profile anyway, caller can
       hold it in component state */
  }

  return profile
}

/**
 * Mutate the active demo profile. Reads → merges → writes back to
 * sessionStorage, then dispatches `lira-demo-profile-changed` so every
 * useDemoProfile() subscriber re-renders with the new state.
 *
 * Backfills any missing default fields (helpful for profiles created before
 * card/subscription_status were added). Returns the resulting profile, or
 * null if there's no active profile to update.
 *
 * Use this for every settings/dashboard mutation:
 *   - upgrade/downgrade plan
 *   - change payment card
 *   - cancel/reactivate subscription
 *   - toggle integrations (future)
 */
export function updateDemoProfile(updates: Partial<DemoProfile>): DemoProfile | null {
  const current = readDemoProfile()
  if (!current) return null
  const next: DemoProfile = {
    ...current,
    card: current.card ?? { brand: 'VISA', last4: '4242', exp: '09/28' },
    subscription_status: current.subscription_status ?? 'active',
    ...updates,
  }
  // If the plan changed, recompute the derived plan_label + invoice amount
  // so they stay consistent. Caller can override these via `updates` if they
  // want to set a custom value.
  if (updates.plan && !updates.plan_label) {
    next.plan_label = PLAN_LABELS[updates.plan]
  }
  if (updates.plan && !updates.last_invoice_amount_usd) {
    next.last_invoice_amount_usd = PLAN_AMOUNTS[updates.plan]
  }
  try {
    sessionStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next))
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }))
  } catch {
    /* ignore */
  }
  return next
}

export function readDemoProfile(): DemoProfile | null {
  try {
    const raw = sessionStorage.getItem(PROFILE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.name || !parsed?.plan) return null
    return parsed as DemoProfile
  } catch {
    return null
  }
}

export function clearDemoProfile(): void {
  try {
    sessionStorage.removeItem(PROFILE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
  // Also clear the widget's session visitor id and any in-tab chat cache so
  // sign-out genuinely resets the experience for the next tester.
  try {
    sessionStorage.removeItem(VISITOR_STORAGE_KEY)
    // Best-effort: kill any session-scoped chat storage rows the widget left.
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith('lira_chat_session_')) sessionStorage.removeItem(key)
    }
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: null }))
  } catch {
    /* ignore */
  }
}

/**
 * React hook that returns the current demo profile and re-renders when it
 * changes (via the custom event the modal dispatches on save, or a manual
 * sign-out). Returns null when no profile is active.
 */
export function useDemoProfile(): DemoProfile | null {
  const [profile, setProfile] = useState<DemoProfile | null>(() => readDemoProfile())

  useEffect(() => {
    const onChange = () => setProfile(readDemoProfile())
    window.addEventListener(CHANGE_EVENT, onChange)
    // Storage events fire for changes from OTHER tabs/windows; same-tab
    // changes come through the custom event above.
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return profile
}
