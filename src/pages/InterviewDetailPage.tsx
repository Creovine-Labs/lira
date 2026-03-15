import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BarChart3,
  BriefcaseIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Loader2,
  Pencil,
  Play,
  RefreshCw,
  ThumbsUp,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

import { useOrgStore, useInterviewStore } from '@/app/store'
import {
  getInterviewRecord,
  getRelatedInterviews,
  createInterviewRecord,
  updateInterviewRecord,
  generateInterviewQuestions,
  getMeeting,
  startInterviewSession,
  cancelInterviewSession,
  deleteInterviewRecord,
  runInterviewEvaluation,
  recordInterviewDecision,
  type Interview,
  type InterviewStatus,
  type DecisionOutcome,
  type QASummary,
  type Message,
} from '@/services/api'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/lib'

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<InterviewStatus, string> = {
  draft: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
  scheduled: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400',
  bot_deployed: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  in_progress: 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-400',
  evaluating: 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-400',
  completed: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400',
  cancelled: 'text-red-500 bg-red-100 dark:bg-red-900/40 dark:text-red-400',
  no_show: 'text-violet-600 bg-violet-100 dark:bg-violet-900/40 dark:text-violet-400',
}

const DECISION_CONFIG: Record<
  DecisionOutcome,
  { label: string; color: string; icon: React.ElementType }
> = {
  hire: { label: 'Hire', color: 'text-emerald-600', icon: UserCheck },
  no_hire: { label: 'No Hire', color: 'text-red-500', icon: UserX },
  next_round: { label: 'Next Round', color: 'text-blue-600', icon: CheckCircle2 },
  undecided: { label: 'Undecided', color: 'text-slate-500', icon: ClipboardList },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QACard({ qa, index }: { qa: QASummary; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor =
    qa.score >= 80 ? 'text-emerald-600' : qa.score >= 60 ? 'text-amber-500' : 'text-red-500'
  const scoreBg = qa.score >= 80 ? 'bg-emerald-500' : qa.score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const qualityLabel =
    qa.answer_quality === 'excellent'
      ? 'Excellent'
      : qa.answer_quality === 'good'
        ? 'Good'
        : qa.answer_quality === 'adequate'
          ? 'Adequate'
          : 'Poor'

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Always-visible: question + answer summary */}
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="shrink-0 w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center justify-center mt-0.5">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {qa.question}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {qa.answer_summary}
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible: score + analysis */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left flex items-center justify-between px-4 py-2 border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {expanded ? 'Hide score & analysis' : 'View score & analysis'}
        </span>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 bg-slate-50 dark:bg-slate-800/40 space-y-3">
          {/* Score bar */}
          <div className="flex items-center gap-3">
            <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>{qa.score}/100</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={cn('h-full rounded-full', scoreBg)}
                style={{ width: `${qa.score}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{qualityLabel}</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Score Analysis
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{qa.analysis}</p>
          </div>
          {(qa.key_points ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Key Points
              </p>
              <ul className="space-y-1">
                {(qa.key_points ?? []).map((kp, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-slate-400">
                    • {kp}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(qa.follow_ups ?? []).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Follow-ups
              </p>
              {(qa.follow_ups ?? []).map((fu, i) => (
                <div
                  key={i}
                  className="ml-2 mt-1 pl-3 border-l-2 border-violet-300 dark:border-violet-700"
                >
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
                    {fu.question}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {fu.answer_summary}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function InterviewDetailPage() {
  const navigate = useNavigate()
  const { interviewId } = useParams<{ interviewId: string }>()
  const { currentOrgId } = useOrgStore()
  const { updateInterview, removeInterview } = useInterviewStore()

  const [interview, setInterview] = useState<Interview | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [decision, setDecision] = useState<DecisionOutcome | ''>('')
  const [decisionNotes, setDecisionNotes] = useState('')
  const [showDecision, setShowDecision] = useState(false)
  const [pollTimeout, setPollTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [immediateLink, setImmediateLink] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string
    description: string
    confirmLabel: string
    onConfirm: () => Promise<void>
  } | null>(null)
  const [modalLink, setModalLink] = useState('')
  const [modalCandidateName, setModalCandidateName] = useState('')
  const [transcript, setTranscript] = useState<Message[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'evaluation'>('details')

  // Follow-up interview state
  const [followUpCreating, setFollowUpCreating] = useState(false)
  const [relatedInterviews, setRelatedInterviews] = useState<Interview[]>([])

  const load = useCallback(async () => {
    if (!currentOrgId || !interviewId) return
    try {
      const data = await getInterviewRecord(currentOrgId, interviewId)
      setInterview(data)
      // Auto-switch to Evaluation tab when eval data is available
      if (data.evaluation) setActiveTab('evaluation')
      // Load related interviews (other rounds)
      try {
        const related = await getRelatedInterviews(currentOrgId, interviewId)
        setRelatedInterviews(related.filter((r) => r.interview_id !== interviewId))
      } catch {
        /* non-fatal */
      }
      // Load transcript if session exists and interview is past in_progress
      if (data.session_id && ['evaluating', 'completed', 'cancelled'].includes(data.status)) {
        try {
          const meeting = await getMeeting(data.session_id)
          setTranscript(meeting?.messages ?? [])
        } catch {
          /* transcript may not be available */
        }
      }
    } catch {
      toast.error('Failed to load interview')
    } finally {
      setLoading(false)
    }
  }, [currentOrgId, interviewId])

  useEffect(() => {
    load()
  }, [load])

  // Poll for status changes when in_progress, evaluating, or bot_deployed (every 5s, max 5 min)
  useEffect(() => {
    if (!interview || !['in_progress', 'evaluating', 'bot_deployed'].includes(interview.status))
      return
    const start = Date.now()
    const tid = setInterval(async () => {
      if (Date.now() - start > 5 * 60 * 1000) {
        clearInterval(tid)
        return
      }
      try {
        if (!currentOrgId || !interviewId) return
        const data = await getInterviewRecord(currentOrgId, interviewId)
        setInterview(data)
        if (!['in_progress', 'evaluating', 'bot_deployed'].includes(data.status)) clearInterval(tid)
      } catch {
        /* ignore */
      }
    }, 5000)
    setPollTimeout(tid)
    return () => clearInterval(tid)
  }, [interview?.status, currentOrgId, interviewId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (pollTimeout) clearTimeout(pollTimeout)
    }
  }, [pollTimeout])

  const handleStart = async (linkOverride?: string, nameOverride?: string) => {
    if (!currentOrgId || !interviewId) return
    setActionLoading(true)
    try {
      const link = (linkOverride ?? immediateLink.trim()) || undefined
      const candidateName = nameOverride?.trim() || undefined
      const opts: { meeting_link?: string; candidate_name?: string } = {}
      if (link) opts.meeting_link = link
      if (candidateName) opts.candidate_name = candidateName
      const result = await startInterviewSession(
        currentOrgId,
        interviewId,
        Object.keys(opts).length ? opts : undefined
      )
      setInterview(result.interview)
      updateInterview(interviewId, result.interview)
      toast.success('Bot deployed — interview is starting')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start interview')
    } finally {
      setActionLoading(false)
    }
  }

  const needsCandidateName = !interview?.candidate_name?.trim()

  const handleStartClick = () => {
    // Always prompt for meeting link — it may differ each time
    setShowLinkModal(true)
  }

  const handleDelete = () => {
    const name = interview?.candidate_name?.trim() || 'this interview'
    setConfirmDialog({
      title: 'Delete Interview',
      description: `Are you sure you want to delete ${name}? This cannot be undone.`,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        if (!currentOrgId || !interviewId) return
        setActionLoading(true)
        try {
          await deleteInterviewRecord(currentOrgId, interviewId)
          removeInterview(interviewId)
          toast.success('Interview deleted')
          navigate(-1)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete')
          setActionLoading(false)
        }
      },
    })
  }

  const handleCancel = () => {
    setConfirmDialog({
      title: 'Cancel Interview',
      description: 'Are you sure you want to cancel this interview?',
      confirmLabel: 'Cancel Interview',
      onConfirm: async () => {
        if (!currentOrgId || !interviewId) return
        setActionLoading(true)
        try {
          await cancelInterviewSession(currentOrgId, interviewId)
          await load()
          toast.success('Interview cancelled')
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to cancel interview')
        } finally {
          setActionLoading(false)
        }
      },
    })
  }

  const handleReEvaluate = async () => {
    if (!currentOrgId || !interviewId) return
    setActionLoading(true)
    try {
      const { evaluation } = await runInterviewEvaluation(currentOrgId, interviewId)
      setInterview((prev) => (prev ? { ...prev, evaluation } : prev))
      updateInterview(interviewId, { evaluation })
      toast.success('Evaluation complete')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Re-evaluation failed'
      if (msg.includes('429') || msg.includes('RE_EVALUATION_LIMIT')) {
        toast.error('Re-evaluation limit reached (max 3 times per interview)')
      } else {
        toast.error(msg)
      }
    } finally {
      setActionLoading(false)
    }
  }

  const handleDecision = async () => {
    if (!currentOrgId || !interviewId || !decision) return
    setActionLoading(true)
    try {
      await recordInterviewDecision(
        currentOrgId,
        interviewId,
        decision as DecisionOutcome,
        decisionNotes || undefined
      )
      setInterview((prev) =>
        prev
          ? { ...prev, decision: decision as DecisionOutcome, decision_notes: decisionNotes }
          : prev
      )
      updateInterview(interviewId, { decision: decision as DecisionOutcome })
      setShowDecision(false)
      toast.success('Decision recorded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record decision')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateFollowUp = async () => {
    if (!currentOrgId || !interview) return
    setFollowUpCreating(true)
    try {
      const parentId = interview.parent_interview_id ?? interview.interview_id

      const created = await createInterviewRecord(currentOrgId, {
        title: interview.title,
        department: interview.department || undefined,
        job_description: interview.job_description,
        required_skills: interview.required_skills?.length
          ? interview.required_skills
          : ['General'],
        experience_level: interview.experience_level,
        salary_currency: interview.salary_currency || undefined,
        salary_min: interview.salary_min ?? undefined,
        salary_max: interview.salary_max ?? undefined,
        candidate_name: interview.candidate_name || undefined,
        candidate_email: interview.candidate_email || undefined,
        mode: interview.mode,
        time_limit_minutes: interview.time_limit_minutes,
        personality: interview.personality,
        ai_name_override: interview.ai_name_override || undefined,
        parent_interview_id: parentId,
        question_generation: 'ai_generated',
      })

      // Auto-generate questions
      try {
        const questions = await generateInterviewQuestions(currentOrgId, {
          title: interview.title,
          job_description: interview.job_description,
          required_skills: interview.required_skills,
          experience_level: interview.experience_level,
          question_count: 8,
          categories: ['warm_up', 'behavioral', 'technical', 'situational'],
        })
        if (questions.length > 0) {
          await updateInterviewRecord(currentOrgId, created.interview_id, { questions })
        }
      } catch {
        // Questions can be generated from the edit page
      }

      toast.success('New interview round created — review and add meeting link')
      navigate(`/org/interviews/${created.interview_id}/edit`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create interview round')
    } finally {
      setFollowUpCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <BriefcaseIcon className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500">Interview not found</p>
        <button
          onClick={() => navigate('/org/roles')}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm"
        >
          Back to Interviews
        </button>
      </div>
    )
  }

  const canStart = interview.status === 'draft' || interview.status === 'scheduled'
  const canCancel =
    interview.status === 'draft' ||
    interview.status === 'scheduled' ||
    interview.status === 'in_progress' ||
    interview.status === 'bot_deployed'
  const canReEvaluate =
    (interview.status === 'completed' || interview.status === 'evaluating') &&
    (interview.evaluation?.re_evaluation_count ?? 0) < 3
  const hasEval = Boolean(interview.evaluation)

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={!!confirmDialog}
        title={confirmDialog?.title ?? ''}
        description={confirmDialog?.description ?? ''}
        confirmLabel={confirmDialog?.confirmLabel ?? 'Confirm'}
        onConfirm={confirmDialog?.onConfirm ?? (async () => {})}
        onClose={() => setConfirmDialog(null)}
      />
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() => navigate(`/org/roles/${encodeURIComponent(interview.title)}`)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
              {interview.candidate_name?.trim() || 'Candidate'}
            </h1>
            <span
              className={cn(
                'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                STATUS_COLORS[interview.status]
              )}
            >
              {interview.status.replace('_', ' ')}
            </span>
            {(interview.round ?? 1) > 1 && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                Round {interview.round}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {interview.title}
            {interview.candidate_email ? ` · ${interview.candidate_email}` : ''}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {canReEvaluate && (
            <button
              onClick={handleReEvaluate}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Re-evaluate
            </button>
          )}
          {!interview.decision && interview.status === 'completed' && (
            <button
              onClick={() => setShowDecision(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-700 text-sm text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              <ThumbsUp className="w-4 h-4" />
              Decide
            </button>
          )}
          {['completed', 'cancelled'].includes(interview.status) && (
            <button
              onClick={handleCreateFollowUp}
              disabled={followUpCreating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 text-sm text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50"
            >
              {followUpCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
              New Interview Round
            </button>
          )}
          {interview.status === 'draft' && (
            <button
              onClick={() => navigate(`/org/interviews/${interviewId}/edit`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
            title="Delete candidate"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {canStart && (
            <button
              onClick={handleStartClick}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {interview.status === 'scheduled' ? 'Start Now' : 'Start Interview'}
            </button>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-300 dark:border-red-800 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Tab navigation */}
      {hasEval && (
        <div className="flex border-b border-slate-200 dark:border-slate-700/60 px-6">
          <button
            onClick={() => setActiveTab('details')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === 'details'
                ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <FileText className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === 'evaluation'
                ? 'border-violet-600 text-violet-700 dark:text-violet-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Evaluation
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* ═══ Details Tab ═══ */}
        {(activeTab === 'details' || !hasEval) && (
          <>
            {/* Meta row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetaCard label="Experience" value={interview.experience_level} />
              <MetaCard
                label="Mode"
                value={interview.mode.charAt(0).toUpperCase() + interview.mode.slice(1)}
              />
              <MetaCard
                label="Duration"
                value={`${interview.evaluation?.interview_duration_minutes || interview.time_limit_minutes} min`}
              />
              {interview.scheduled_at && (
                <MetaCard
                  label="Scheduled"
                  value={format(new Date(interview.scheduled_at), 'MMM d, h:mm a')}
                />
              )}
            </div>

            {/* Salary row */}
            {(interview.salary_min != null ||
              interview.salary_max != null ||
              interview.salary_range) && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Compensation
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 ml-2">
                  {interview.salary_min != null || interview.salary_max != null
                    ? (() => {
                        const sym = interview.salary_currency
                          ? ((
                              {
                                USD: '$',
                                EUR: '€',
                                GBP: '£',
                                NGN: '₦',
                                ZAR: 'R',
                                RWF: 'RF',
                                KES: 'KSh',
                                GHS: '₵',
                                CAD: 'CA$',
                                AUD: 'A$',
                                INR: '₹',
                                JPY: '¥',
                                BRL: 'R$',
                                MXN: 'MX$',
                                EGP: 'E£',
                                AED: 'AED',
                                SGD: 'S$',
                              } as Record<string, string>
                            )[interview.salary_currency] ?? interview.salary_currency + ' ')
                          : ''
                        const fmt = (n: number) => n.toLocaleString('en-US')
                        if (interview.salary_min != null && interview.salary_max != null)
                          return `${sym}${fmt(interview.salary_min)} – ${sym}${fmt(interview.salary_max)} / month`
                        if (interview.salary_min != null)
                          return `From ${sym}${fmt(interview.salary_min)} / month`
                        return `Up to ${sym}${fmt(interview.salary_max!)} / month`
                      })()
                    : interview.salary_range}
                </span>
              </div>
            )}

            {/* Immediate-start callout */}
            {canStart && interview.status === 'scheduled' && (
              <div className="flex flex-col gap-3 p-4 rounded-xl border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-violet-800 dark:text-violet-300">
                    Start this interview now
                  </p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                    Paste the meeting link below — Lira will join immediately and the scheduled time
                    will be cleared.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="url"
                    value={immediateLink || interview.meeting_link || ''}
                    onChange={(e) => setImmediateLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="flex-1 sm:w-64 px-3 py-1.5 rounded-lg border border-violet-300 dark:border-violet-600 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={handleStartClick}
                    disabled={actionLoading || !(immediateLink.trim() || interview.meeting_link)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    Start Now
                  </button>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Ensure the candidate has joined the meeting before starting — Lira will greet them
                  by their Google Meet display name.
                </p>
              </div>
            )}

            {/* Decision badge */}
            {interview.decision && (
              <div
                className={cn(
                  'flex items-center gap-3 p-4 rounded-xl border',
                  interview.decision === 'hire' || interview.decision === 'next_round'
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                )}
              >
                {(() => {
                  const cfg = DECISION_CONFIG[interview.decision]
                  const Icon = cfg.icon
                  return (
                    <>
                      <Icon className={cn('w-5 h-5', cfg.color)} />
                      <div>
                        <p className={cn('font-semibold', cfg.color)}>{cfg.label}</p>
                        {interview.decision_notes && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {interview.decision_notes}
                          </p>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>
            )}

            {/* In-progress / evaluating status cards (no tabs yet) */}
            {(interview.status === 'in_progress' || interview.status === 'bot_deployed') && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  Interview in progress
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  Evaluation will appear automatically when complete.
                </p>
              </div>
            )}
            {interview.status === 'evaluating' && !hasEval && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="font-medium text-purple-700 dark:text-purple-400">
                  Generating evaluation...
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-500">
                  Lira is analyzing the interview transcript. This usually takes 1–2 minutes.
                </p>
              </div>
            )}
            {interview.status === 'completed' && !hasEval && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center rounded-xl border border-slate-200 dark:border-slate-700">
                <ClipboardList className="w-10 h-10 text-slate-400" />
                <div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    No evaluation yet
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    The evaluation may still be processing.
                  </p>
                </div>
                <button
                  onClick={handleReEvaluate}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm transition-colors disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Run Evaluation
                </button>
              </div>
            )}

            {/* Transcript */}
            {transcript.length > 0 && (
              <details className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <summary className="px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Conversation Transcript ({transcript.length} messages)
                </summary>
                <div className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {transcript.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        'px-4 py-3 flex gap-3',
                        msg.is_ai ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''
                      )}
                    >
                      <div
                        className={cn(
                          'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
                          msg.is_ai
                            ? 'bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        )}
                      >
                        {msg.is_ai
                          ? 'L'
                          : (() => {
                              const displayName =
                                msg.speaker === 'participant' && interview.candidate_name
                                  ? interview.candidate_name
                                  : msg.speaker
                              return (displayName ?? '?').charAt(0).toUpperCase()
                            })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">
                            {msg.is_ai
                              ? 'Lira'
                              : msg.speaker === 'participant' && interview.candidate_name
                                ? interview.candidate_name
                                : msg.speaker}
                          </span>
                          <span className="text-xs text-slate-400">
                            {format(new Date(msg.timestamp), 'h:mm:ss a')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Questions */}
            {(interview.questions ?? []).length > 0 && (
              <details className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <summary className="px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  Questions ({interview.questions.length})
                </summary>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {(interview.questions ?? []).map((q, i) => (
                    <div key={q.id} className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm text-slate-800 dark:text-slate-200">{q.text}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-slate-400 capitalize">
                              {q.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-400">{q.expected_depth}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Interview Round History */}
            {relatedInterviews.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Interview Rounds ({relatedInterviews.length + 1})
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {relatedInterviews.map((ri) => (
                    <button
                      key={ri.interview_id}
                      onClick={() => navigate(`/org/interviews/${ri.interview_id}`)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                        {ri.round ?? 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          Round {ri.round ?? 1}
                          {ri.interview_purpose && (
                            <span className="ml-1.5 text-slate-500 dark:text-slate-400 font-normal">
                              —{' '}
                              {ri.interview_purpose === 'custom'
                                ? ri.custom_purpose
                                : ri.interview_purpose.replace('_', ' ')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {ri.title} · {ri.mode}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          STATUS_COLORS[ri.status]
                        )}
                      >
                        {ri.status.replace('_', ' ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ═══ Evaluation Tab ═══ */}
        {activeTab === 'evaluation' && hasEval && interview.evaluation && (
          <>
            {/* Candidate CV Summary */}
            {interview.resume?.parsed && (
              <div className="rounded-xl border border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-900/10 p-5 space-y-4">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                  Candidate CV
                </p>
                {interview.resume.parsed.summary && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {interview.resume.parsed.summary}
                  </p>
                )}
                {interview.resume.parsed.skills.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Skills
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {interview.resume.parsed.skills.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {interview.resume.parsed.experience.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Experience
                    </p>
                    <div className="space-y-2">
                      {interview.resume.parsed.experience.map((exp, i) => (
                        <div key={i} className="text-sm">
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {exp.role}
                            <span className="font-normal text-slate-500 dark:text-slate-400">
                              {' '}
                              · {exp.company}
                            </span>
                            {exp.duration_months != null && (
                              <span className="font-normal text-slate-400 dark:text-slate-500">
                                {' '}
                                ·{' '}
                                {exp.duration_months >= 12
                                  ? `${Math.floor(exp.duration_months / 12)} yr${Math.floor(exp.duration_months / 12) !== 1 ? 's' : ''}`
                                  : `${exp.duration_months} mo`}
                              </span>
                            )}
                          </p>
                          {exp.highlights.length > 0 && (
                            <ul className="mt-0.5 space-y-0.5">
                              {exp.highlights.map((h, j) => (
                                <li key={j} className="text-xs text-slate-500 dark:text-slate-400">
                                  · {h}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {interview.resume.parsed.education.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Education
                    </p>
                    <div className="space-y-1">
                      {interview.resume.parsed.education.map((edu, i) => (
                        <p key={i} className="text-sm text-slate-600 dark:text-slate-400">
                          {edu.degree} · {edu.institution}
                          {edu.year ? ` (${edu.year})` : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lira Summary */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Lira Summary
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {interview.evaluation.interview_summary ||
                  interview.evaluation.ai_summary ||
                  'No summary available.'}
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span>{interview.evaluation.questions_asked} questions asked</span>
                <span>·</span>
                <span>
                  {interview.evaluation.questions_answered ?? interview.evaluation.questions_asked}{' '}
                  answered
                </span>
                <span>·</span>
                <span>{interview.evaluation.interview_duration_minutes} min</span>
              </div>
            </div>

            {/* Q&A Analysis */}
            {(interview.evaluation.qa_summary ?? []).length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Question & Answer Analysis
                </p>
                {(interview.evaluation.qa_summary ?? []).map((qa, i) => (
                  <QACard key={i} qa={qa} index={i} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Meeting link modal — shown when starting without a link or candidate name */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Start Interview
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste the Google Meet link so Lira knows where to join.
            </p>

            {/* Candidate name — shown only when name is missing */}
            {needsCandidateName && (
              <div className="space-y-1.5">
                <label
                  htmlFor="candidate-name-input"
                  className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide"
                >
                  Candidate Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="candidate-name-input"
                  type="text"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  value={modalCandidateName}
                  onChange={(e) => setModalCandidateName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            )}

            {/* Meeting link */}
            <div className="space-y-1.5">
              <label
                htmlFor="meeting-link-input"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide"
              >
                Meeting Link
              </label>
              <input
                id="meeting-link-input"
                type="url"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus={!needsCandidateName}
                value={modalLink}
                onChange={(e) => setModalLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const link = modalLink.trim()
                    const nameOk = !needsCandidateName || modalCandidateName.trim()
                    if (link && nameOk) {
                      setShowLinkModal(false)
                      handleStart(link, modalCandidateName.trim() || undefined)
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Make sure the candidate is already in the Google Meet before starting. Lira will use
              their display name from the meeting.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLinkModal(false)
                  setModalLink('')
                  setModalCandidateName('')
                }}
                className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const link = modalLink.trim()
                  if (!link) return
                  if (needsCandidateName && !modalCandidateName.trim()) return
                  setShowLinkModal(false)
                  handleStart(link, modalCandidateName.trim() || undefined)
                }}
                disabled={
                  !modalLink.trim() ||
                  (needsCandidateName && !modalCandidateName.trim()) ||
                  actionLoading
                }
                className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Start Interview'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision modal */}
      {showDecision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Record Decision
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: 'hire', label: '✓ Hire', color: 'border-emerald-400 text-emerald-700' },
                  { value: 'no_hire', label: '✗ No Hire', color: 'border-red-400 text-red-600' },
                  {
                    value: 'next_round',
                    label: '→ Next Round',
                    color: 'border-blue-400 text-blue-600',
                  },
                  {
                    value: 'undecided',
                    label: '? Undecided',
                    color: 'border-slate-400 text-slate-600',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDecision(opt.value)}
                  className={cn(
                    'py-2 rounded-lg border-2 text-sm font-medium transition-colors',
                    decision === opt.value
                      ? `${opt.color} bg-slate-50 dark:bg-slate-800`
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional notes…"
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDecision(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecision}
                disabled={!decision || actionLoading}
                className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Save Decision'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1 capitalize">
        {value}
      </p>
    </div>
  )
}

export { InterviewDetailPage }
