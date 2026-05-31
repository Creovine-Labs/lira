// /portal/:orgId/access — request a magic-link email.
//
// Behaviour per SUPPORT_TICKETING_API.md §2.1:
//   • Backend always returns 200, even if the email has no tickets. We
//     show a generic "if we have tickets for this address, we sent a
//     link" message — no account enumeration.
//   • Disable the submit + run a 30s rate-limit countdown so a customer
//     can't accidentally double-spam themselves with reminder emails.

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { EnvelopeIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import { requestPortalAccessLink } from '@/services/api/portal-api'
import {
  GhostButton,
  PortalCard,
  PortalInput,
  PortalLayout,
  PrimaryButton,
  SerifHeading,
  SubtleText,
} from './PortalChrome'

const RATE_LIMIT_SECONDS = 30

export function PortalAccessPage() {
  const { orgId = '' } = useParams<{ orgId: string }>()
  const [searchParams] = useSearchParams()

  const ticketHint = searchParams.get('ticket') ?? undefined

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedTo, setSubmittedTo] = useState<string | null>(null)
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const emailInputRef = useRef<HTMLInputElement>(null)

  // Programmatic focus on mount — accessible alternative to the autoFocus
  // prop (which screen readers can announce abruptly).
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // Per-tick cooldown countdown. We store an absolute end-time and recompute
  // remaining seconds each tick so the timer survives tab-throttling without
  // drifting.
  useEffect(() => {
    if (cooldownEnd === null) {
      setCooldownLeft(0)
      return
    }
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
      setCooldownLeft(left)
      if (left === 0) setCooldownEnd(null)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [cooldownEnd])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || cooldownLeft > 0) return

    const trimmed = email.trim()
    if (!isLikelyEmail(trimmed)) {
      toast.error('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      await requestPortalAccessLink(orgId, {
        email: trimmed,
        ticket_number: ticketHint,
      })
      setSubmittedTo(trimmed)
      setCooldownEnd(Date.now() + RATE_LIMIT_SECONDS * 1000)
    } catch (err) {
      // §2.1 says the endpoint always returns 200. If we hit an error it's a
      // real failure (network / 500), not an enumeration signal — surface it.
      toast.error(err instanceof Error ? err.message : 'Could not send the link. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const showConfirmation = submittedTo !== null

  return (
    <PortalLayout>
      {!showConfirmation ? (
        <div className="space-y-8">
          <header className="space-y-3">
            <SerifHeading>Check on a ticket</SerifHeading>
            <SubtleText>
              Enter the email address you used to start the conversation. If we have any tickets for
              you, we'll send a sign-in link.
            </SubtleText>
          </header>

          <PortalCard>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label
                  htmlFor="portal-email"
                  className="block text-[12px] font-semibold uppercase tracking-wider text-[#020308]/55"
                >
                  Your email
                </label>
                <PortalInput
                  ref={emailInputRef}
                  id="portal-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {ticketHint && (
                <div className="rounded-lg bg-[#020308]/[0.03] px-3 py-2.5 text-[12px] text-[#020308]/60">
                  This link will be scoped to ticket{' '}
                  <code className="font-mono text-[#020308]/85">{ticketHint}</code>.
                </div>
              )}

              <PrimaryButton
                type="submit"
                disabled={submitting || cooldownLeft > 0}
                className="w-full"
              >
                {submitting
                  ? 'Sending…'
                  : cooldownLeft > 0
                    ? `Try again in ${cooldownLeft}s`
                    : 'Email me a sign-in link'}
              </PrimaryButton>
            </form>
          </PortalCard>

          <SubtleText className="text-center text-[12px]">
            Links expire after 7 days. We don't store passwords here.
          </SubtleText>
        </div>
      ) : (
        <div className="space-y-8">
          <header className="space-y-3">
            <SerifHeading>Check your inbox</SerifHeading>
            <SubtleText>
              If we have tickets for <span className="text-[#020308]/90">{submittedTo}</span>,
              you'll receive an email with a sign-in link in the next minute or two.
            </SubtleText>
          </header>

          <PortalCard className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#020308]/[0.04]">
              <EnvelopeIcon className="h-5 w-5 text-[#020308]/60" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[14px] font-semibold text-[#020308]">Check your inbox</p>
              <SubtleText className="text-[13px]">
                The link is good for 7 days. Open it on any device to view your tickets.
              </SubtleText>
            </div>
          </PortalCard>

          <div className="flex items-center justify-center gap-3">
            <GhostButton
              type="button"
              onClick={() => {
                setSubmittedTo(null)
                setEmail('')
              }}
              disabled={cooldownLeft > 0}
            >
              {cooldownLeft > 0
                ? `Use a different email (${cooldownLeft}s)`
                : 'Use a different email'}
            </GhostButton>
          </div>

          <SubtleText className="text-center text-[12px]">
            Didn't get it? Check your spam folder, then try again.
          </SubtleText>
        </div>
      )}
    </PortalLayout>
  )
}

// Lightweight — backend does the real validation. We just guard against
// obvious typos so the submit button doesn't fire a useless request.
function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
