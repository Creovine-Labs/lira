import { useUsageStore } from '@/app/store'

const FEATURE_LABELS: Record<string, string> = {
  meetings: 'AI Meeting Sessions',
  meeting_minutes: 'Meeting Minutes',
  interviews: 'Interviews',
  interview_evaluations: 'Interview Evaluations',
  ai_tasks: 'AI Tasks',
  documents: 'Documents',
  knowledge_pages: 'Knowledge Pages',
}

export function BetaLimitModal() {
  const { limitFeature, limitMessage, dismissLimitModal } = useUsageStore()

  if (!limitFeature) return null

  const label = FEATURE_LABELS[limitFeature] ?? limitFeature

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Lira logo */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <img src="/lira_black.png" alt="Lira" className="h-8 w-8" />
        </div>

        <h2 className="text-lg font-bold text-gray-900 mb-1">Beta Limit Reached</h2>
        <p className="text-sm text-gray-500 mb-1 font-medium">{label}</p>
        <p className="text-sm text-gray-600 mb-6">
          {limitMessage ??
            `You've reached the maximum usage for ${label.toLowerCase()} in the beta. Thank you for trying Lira! Stay tuned for the full release.`}
        </p>

        <div className="flex items-center justify-center gap-3">
          <a
            href="mailto:support@creovine.com?subject=Lira Beta Feedback"
            className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Share feedback
          </a>
          <button
            onClick={dismissLimitModal}
            className="rounded-xl bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
