import { useCallback, useEffect, useState } from 'react'
import { ArrowPathIcon, CheckIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore } from '@/app/store'
import { listKbGaps, updateKbGapStatus, type KbGapGroup } from '@/services/api'
import { cn } from '@/lib'

/**
 * What customers asked that Lira could not answer.
 *
 * Lira has recorded this all along — every time the agent can't answer from the
 * knowledge base it logs the question, verbatim. Nothing ever read it back, so
 * teams were left guessing what to write next while the answer sat in their own
 * table, in their customers' words, ranked by how many people asked.
 */
export function GapsPanel() {
  const { currentOrgId } = useOrgStore()
  const [gaps, setGaps] = useState<KbGapGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [showResolved, setShowResolved] = useState(false)
  const [resolving, setResolving] = useState<Record<string, boolean>>({})

  const load = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      setGaps(await listKbGaps(currentOrgId, showResolved ? 'all' : 'open'))
    } catch {
      toast.error('Could not load unanswered questions')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, showResolved])

  useEffect(() => {
    void load()
  }, [load])

  async function resolve(group: KbGapGroup) {
    if (!currentOrgId) return
    const key = group.gap_ids.join(',')
    setResolving((prev) => ({ ...prev, [key]: true }))
    try {
      await updateKbGapStatus(currentOrgId, group.gap_ids, 'resolved')
      // Resolving the whole question, not one occurrence — "I've written that
      // content now" is a statement about the question, not about one customer.
      setGaps((prev) => prev.filter((g) => g.gap_ids.join(',') !== key))
      toast.success('Marked as handled')
    } catch (err) {
      toast.error(`Could not update: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setResolving((prev) => ({ ...prev, [key]: false }))
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Loading…</div>
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-gray-500">
          Every time Lira can&apos;t answer from your knowledge base, it records the question. This
          is what to write next — in your customers&apos; own words, most-asked first.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#3730a3] focus:ring-[#3730a3]/30"
            />
            Show handled
          </label>
          <button
            onClick={() => void load()}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition hover:text-[#3730a3]"
            title="Refresh"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {gaps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <QuestionMarkCircleIcon className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-700">Nothing unanswered yet</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-gray-400">
            When a customer asks something your knowledge base doesn&apos;t cover, it shows up here
            automatically. Nothing to set up.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {gaps.map((group) => {
            const key = group.gap_ids.join(',')
            return (
              <div
                key={key}
                className="rounded-xl border border-gray-100 bg-white px-4 py-3 transition hover:border-gray-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold',
                          group.count > 1
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {group.count > 1 ? `${group.count} people asked` : 'asked once'}
                      </span>
                      {group.status === 'resolved' && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
                          handled
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-gray-900">{group.question}</p>
                    {group.why_missing && (
                      <p className="mt-1 text-xs text-gray-500">
                        Lira missed it because: {group.why_missing}
                      </p>
                    )}
                    {group.suggested_answer && (
                      <p className="mt-1.5 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs text-gray-600">
                        <span className="font-semibold text-gray-500">Lira guessed: </span>
                        {group.suggested_answer}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-gray-400">
                      Last asked {new Date(group.last_asked).toLocaleDateString()}
                    </p>
                  </div>
                  {group.status !== 'resolved' && (
                    <button
                      onClick={() => void resolve(group)}
                      disabled={resolving[key]}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40"
                    >
                      <CheckIcon className="h-3.5 w-3.5" />
                      I&apos;ve covered this
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GapsPanel
