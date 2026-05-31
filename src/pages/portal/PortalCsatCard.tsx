// 5-star CSAT widget — rendered on resolved portal tickets (both magic-link
// and verified-SDK modes). Phase 5 §3.2.
//
// Behaviour:
//   • Optimistic UX — the click flips the card to its "thank you" state
//     immediately, then the request fires. On `409 Conflict` we keep the
//     thank-you state ("already recorded — same outcome"). On any other
//     error we roll back and show a small inline retry.
//   • Once submitted (or detected via 409), the score is persisted in
//     sessionStorage so reloads don't show the widget again. The ticket
//     payload doesn't include CSAT state in §2.2, so the local cache is
//     our source of truth for "should we render this card?".
//   • Hover/focus state shows the descriptive label for the score so the
//     customer isn't guessing what "3 stars" means.

import { useCallback, useState } from 'react'
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import {
  CsatAlreadySubmittedError,
  PortalTokenError,
  submitCsatSafe,
} from '@/services/api/portal-api'
import { getSubmittedCsatScore, markCsatSubmitted } from '@/lib/portal-token'
import { PortalCard, SubtleText } from './PortalChrome'

const SCORE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Not great',
  2: 'Could be better',
  3: 'Fine',
  4: 'Good',
  5: 'Excellent',
}

type CsatScore = 1 | 2 | 3 | 4 | 5

interface PortalCsatCardProps {
  orgId: string
  ticketNumber: string
}

export function PortalCsatCard({ orgId, ticketNumber }: PortalCsatCardProps) {
  const previouslySubmitted = getSubmittedCsatScore(orgId, ticketNumber)

  const [submittedScore, setSubmittedScore] = useState<number | null>(previouslySubmitted)
  const [hoverScore, setHoverScore] = useState<CsatScore | null>(null)
  const [submitting, setSubmitting] = useState<CsatScore | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelect = useCallback(
    async (score: CsatScore) => {
      if (submitting !== null || submittedScore !== null) return
      setError(null)
      setSubmitting(score)
      // Optimistically flip — feels instant. Roll back on hard failure.
      setSubmittedScore(score)
      try {
        const res = await submitCsatSafe(orgId, ticketNumber, score)
        markCsatSubmitted(orgId, ticketNumber, res.score)
        setSubmittedScore(res.score)
      } catch (err) {
        if (err instanceof CsatAlreadySubmittedError) {
          // 409 means the score is in the system — keep the thank-you
          // state. We don't know which score landed first; show the one
          // they just picked, which is the closest available truth.
          markCsatSubmitted(orgId, ticketNumber, score)
          setSubmittedScore(score)
          return
        }
        if (err instanceof PortalTokenError) {
          // The route shell listens for `lira:portal-token-expired` and
          // will redirect — nothing for us to do here, but undo the
          // optimistic flip in case the redirect doesn't fire.
          setSubmittedScore(null)
          return
        }
        setSubmittedScore(null)
        setError(err instanceof Error ? err.message : 'Could not record your rating.')
      } finally {
        setSubmitting(null)
      }
    },
    [orgId, ticketNumber, submitting, submittedScore]
  )

  if (submittedScore !== null) {
    return (
      <PortalCard className="border-emerald-100 bg-emerald-50/50" aria-live="polite">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <StarSolidIcon className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <p className="text-[14px] font-semibold text-[#020308]">Thanks for your feedback.</p>
            <SubtleText className="text-[13px]">
              You rated this {submittedScore} out of 5. The team uses this to make support better.
            </SubtleText>
          </div>
        </div>
      </PortalCard>
    )
  }

  const displayScore = hoverScore ?? submitting
  const showLabel = displayScore !== null
  return (
    <PortalCard>
      <div className="space-y-3">
        <div>
          <p className="text-[14px] font-semibold text-[#020308]">
            How was your support experience?
          </p>
          <SubtleText className="text-[13px]">
            Takes a second. Your rating goes straight to the team.
          </SubtleText>
        </div>

        <fieldset
          className="m-0 flex items-center gap-1 border-0 p-0"
          aria-label="Rate your support experience from 1 to 5 stars"
          onMouseLeave={() => setHoverScore(null)}
        >
          {([1, 2, 3, 4, 5] as const).map((value) => {
            const active = displayScore !== null && value <= displayScore
            return (
              <button
                key={value}
                type="button"
                aria-pressed={submittedScore === value}
                aria-label={`${value} out of 5 — ${SCORE_LABELS[value]}`}
                onMouseEnter={() => setHoverScore(value)}
                onFocus={() => setHoverScore(value)}
                onBlur={() => setHoverScore(null)}
                onClick={() => void handleSelect(value)}
                disabled={submitting !== null}
                className="group rounded-md p-1 transition disabled:cursor-wait"
              >
                {active ? (
                  <StarSolidIcon className="h-7 w-7 text-amber-400 transition group-hover:scale-110" />
                ) : (
                  <StarOutlineIcon className="h-7 w-7 text-[#020308]/25 transition group-hover:text-amber-300" />
                )}
              </button>
            )
          })}
          <span
            className={`ml-3 text-[12px] text-[#020308]/55 transition-opacity ${
              showLabel ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          >
            {displayScore !== null ? SCORE_LABELS[displayScore as CsatScore] : ''}
          </span>
        </fieldset>

        {error && (
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] text-rose-700 ring-1 ring-inset ring-rose-600/15">
            {error}
          </div>
        )}
      </div>
    </PortalCard>
  )
}
