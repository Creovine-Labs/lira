import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  BriefcaseIcon,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { useOrgStore, useInterviewStore } from '@/app/store'
import {
  createInterviewRecord,
  draftInterviewRecord,
  generateInterviewQuestions,
  getInterviewRecord,
  updateInterviewRecord,
  uploadInterviewResume,
  type CreateInterviewInput,
  type ExperienceLevel,
  type GenerateQuestionsInput,
  type Interview,
  type InterviewDraft,
  type InterviewMode,
  type InterviewPersonality,
  type InterviewQuestion,
  type QuestionCategory,
} from '@/services/api'
import { cn } from '@/lib'

// ── Constants ─────────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid-Level' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'principal', label: 'Principal' },
]

const PERSONALITIES: { value: InterviewPersonality; label: string }[] = [
  { value: 'supportive', label: 'Supportive' },
  { value: 'challenger', label: 'Challenger' },
  { value: 'facilitator', label: 'Facilitator' },
  { value: 'analyst', label: 'Analyst' },
]

const MODES: { value: InterviewMode; label: string }[] = [
  { value: 'solo', label: 'Solo AI' },
  { value: 'copilot', label: 'Copilot' },
  { value: 'shadow', label: 'Shadow' },
]

const CATEGORIES: { value: QuestionCategory; label: string }[] = [
  { value: 'warm_up', label: 'Warm-Up' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'technical', label: 'Technical' },
  { value: 'situational', label: 'Situational' },
  { value: 'cultural', label: 'Cultural Fit' },
  { value: 'custom', label: 'Custom' },
]

const EXAMPLE_PROMPTS = [
  'Senior Backend Engineer with 5+ years in Node.js and AWS',
  'Frontend React developer, mid-level, for our SaaS product team',
  'Product Manager to lead our mobile app roadmap',
  'DevOps engineer experienced with Kubernetes and CI/CD pipelines',
]

const CURRENCIES: { value: string; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD — US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR — Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP — British Pound', symbol: '£' },
  { value: 'NGN', label: 'NGN — Nigerian Naira', symbol: '₦' },
  { value: 'ZAR', label: 'ZAR — South African Rand', symbol: 'R' },
  { value: 'RWF', label: 'RWF — Rwandan Franc', symbol: 'RF' },
  { value: 'KES', label: 'KES — Kenyan Shilling', symbol: 'KSh' },
  { value: 'GHS', label: 'GHS — Ghanaian Cedi', symbol: '₵' },
  { value: 'CAD', label: 'CAD — Canadian Dollar', symbol: 'CA$' },
  { value: 'AUD', label: 'AUD — Australian Dollar', symbol: 'A$' },
  { value: 'INR', label: 'INR — Indian Rupee', symbol: '₹' },
  { value: 'JPY', label: 'JPY — Japanese Yen', symbol: '¥' },
  { value: 'BRL', label: 'BRL — Brazilian Real', symbol: 'R$' },
  { value: 'MXN', label: 'MXN — Mexican Peso', symbol: 'MX$' },
  { value: 'EGP', label: 'EGP — Egyptian Pound', symbol: 'E£' },
  { value: 'AED', label: 'AED — UAE Dirham', symbol: 'AED' },
  { value: 'SGD', label: 'SGD — Singapore Dollar', symbol: 'S$' },
]

// ── Shared form field components ─────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50',
        className
      )}
    />
  )
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none disabled:opacity-50',
        className
      )}
    />
  )
}

function Select({
  className,
  options,
  value,
  onChange,
}: {
  className?: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500',
        className
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function SectionCard({
  title,
  badge,
  children,
  collapsible,
  defaultOpen = true,
  variant = 'default',
}: {
  title: string
  badge?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultOpen?: boolean
  variant?: 'default' | 'primary'
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden',
        variant === 'primary'
          ? 'border-violet-300 dark:border-violet-700 bg-violet-50/40 dark:bg-violet-900/10'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between px-5 py-4 border-b',
          variant === 'primary'
            ? 'border-violet-200 dark:border-violet-800/50'
            : 'border-slate-100 dark:border-slate-800',
          collapsible &&
            'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors'
        )}
        onClick={() => collapsible && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
      >
        <div className="flex items-center gap-2.5">
          <h3
            className={cn(
              'text-sm font-semibold',
              variant === 'primary'
                ? 'text-violet-800 dark:text-violet-200'
                : 'text-slate-800 dark:text-slate-200'
            )}
          >
            {title}
          </h3>
          {badge && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              {badge}
            </span>
          )}
        </div>
        {collapsible &&
          (open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ))}
      </div>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  )
}

// ── InterviewCreatePage ───────────────────────────────────────────────────────

type Phase = 'prompt' | 'review'

interface ReviewState {
  // From AI draft / job template
  title: string
  department: string
  job_description: string
  required_skills: string[]
  experience_level: ExperienceLevel
  salary_currency: string
  salary_min: string
  salary_max: string
  time_limit_minutes: number
  personality: InterviewPersonality
  mode: InterviewMode
  questions: Omit<InterviewQuestion, 'id' | 'ai_generated' | 'asked'>[]
  // Candidate info
  candidate_name: string
  candidate_email: string
  // Scheduling
  meeting_link: string
  scheduled_at: string
}

function draftToReview(draft: InterviewDraft): ReviewState {
  return {
    title: draft.title,
    department: draft.department,
    job_description: draft.job_description,
    required_skills: draft.required_skills,
    experience_level: draft.experience_level,
    salary_currency: 'USD',
    salary_min: '',
    salary_max: '',
    time_limit_minutes: draft.time_limit_minutes,
    personality: draft.personality,
    mode: draft.mode,
    questions: draft.questions,
    candidate_name: '',
    candidate_email: '',
    meeting_link: '',
    scheduled_at: '',
  }
}

function interviewToReview(interview: Interview): ReviewState {
  let scheduledAt = ''
  if (interview.scheduled_at) {
    const d = new Date(interview.scheduled_at)
    const pad = (n: number) => String(n).padStart(2, '0')
    scheduledAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return {
    title: interview.title,
    department: interview.department ?? '',
    job_description: interview.job_description,
    required_skills: [...interview.required_skills],
    experience_level: interview.experience_level,
    salary_currency: interview.salary_currency ?? 'USD',
    salary_min: interview.salary_min != null ? String(interview.salary_min) : '',
    salary_max: interview.salary_max != null ? String(interview.salary_max) : '',
    time_limit_minutes: interview.time_limit_minutes,
    personality: interview.personality,
    mode: interview.mode,
    questions: interview.questions.map(
      ({ text, category, expected_depth, follow_up_enabled, order }) => ({
        text,
        category,
        expected_depth,
        follow_up_enabled,
        order,
      })
    ),
    candidate_name: interview.candidate_name ?? '',
    candidate_email: interview.candidate_email ?? '',
    meeting_link: interview.meeting_link ?? '',
    scheduled_at: scheduledAt,
  }
}

/** Pre-fill job fields from a template interview but clear candidate + scheduling info */
function interviewToTemplate(interview: Interview): ReviewState {
  return {
    title: interview.title,
    department: interview.department ?? '',
    job_description: interview.job_description,
    required_skills: [...interview.required_skills],
    experience_level: interview.experience_level,
    salary_currency: interview.salary_currency ?? 'USD',
    salary_min: interview.salary_min != null ? String(interview.salary_min) : '',
    salary_max: interview.salary_max != null ? String(interview.salary_max) : '',
    time_limit_minutes: interview.time_limit_minutes,
    personality: interview.personality,
    mode: interview.mode,
    questions: interview.questions.map(
      ({ text, category, expected_depth, follow_up_enabled, order }) => ({
        text,
        category,
        expected_depth,
        follow_up_enabled,
        order,
      })
    ),
    // Candidate fields cleared for new person
    candidate_name: '',
    candidate_email: '',
    meeting_link: '',
    scheduled_at: '',
  }
}

function InterviewCreatePage() {
  const navigate = useNavigate()
  const { interviewId: editId } = useParams<{ interviewId?: string }>()
  const [searchParams] = useSearchParams()
  const fromId = searchParams.get('from')
  const editMode = Boolean(editId)
  const templateMode = Boolean(fromId) && !editMode
  const { currentOrgId } = useOrgStore()
  const { addInterview, updateInterview } = useInterviewStore()

  const [phase, setPhase] = useState<Phase>(editMode || templateMode ? 'review' : 'prompt')
  const [loadingEdit, setLoadingEdit] = useState(editMode || templateMode)
  const [templateTitle, setTemplateTitle] = useState('')
  const [hasExistingResume, setHasExistingResume] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [review, setReview] = useState<ReviewState | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showQuestions, setShowQuestions] = useState(false)
  const [generatingQuestions, setGeneratingQuestions] = useState(false)
  // Resume
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const resumeRef = useRef<HTMLInputElement>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const setR = useCallback(<K extends keyof ReviewState>(key: K, value: ReviewState[K]) => {
    setReview((r) => (r ? { ...r, [key]: value } : r))
    setErrors((e) => ({ ...e, [key]: '' }))
  }, [])

  // ── Edit mode: load existing interview ────────────────────────────────────

  useEffect(() => {
    if (!editMode || !editId || !currentOrgId) return
    getInterviewRecord(currentOrgId, editId)
      .then((interview) => {
        if (interview.status !== 'draft') {
          navigate(`/org/interviews/${editId}`, { replace: true })
          return
        }
        setReview(interviewToReview(interview))
        setHasExistingResume(Boolean(interview.resume))
        if (interview.questions?.length > 0) setShowQuestions(true)
      })
      .catch(() => {
        toast.error('Interview not found')
        navigate('/org/roles', { replace: true })
      })
      .finally(() => setLoadingEdit(false))
  }, [editMode, editId, currentOrgId, navigate])
  // ── Template mode: pre-fill job details from an existing interview ───

  useEffect(() => {
    if (!templateMode || !fromId || !currentOrgId) return
    getInterviewRecord(currentOrgId, fromId)
      .then((interview) => {
        setReview(interviewToTemplate(interview))
        setTemplateTitle(interview.title)
        setPhase('review')
      })
      .catch(() => {
        toast.error('Could not load interview template')
        navigate('/org/roles', { replace: true })
      })
      .finally(() => setLoadingEdit(false))
  }, [templateMode, fromId, currentOrgId, navigate])
  // ── Phase 1: Generate draft ───────────────────────────────────────────────

  const handleGenerate = async () => {
    if (!currentOrgId || !prompt.trim()) return
    setDrafting(true)
    setDraftError(null)
    try {
      const draft = await draftInterviewRecord(currentOrgId, prompt.trim())
      setReview(draftToReview(draft))
      setPhase('review')
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : 'Failed to generate draft')
    } finally {
      setDrafting(false)
    }
  }

  // ── Generate Questions ──────────────────────────────────────────────────────

  const handleGenerateQuestions = async () => {
    if (!review || !currentOrgId) return
    if (!review.title.trim() || !review.job_description.trim()) {
      toast.error('Fill in the role title and description first')
      return
    }

    setGeneratingQuestions(true)
    try {
      // Read resume text if a file is selected
      let resumeText: string | undefined
      if (resumeFile) {
        // We can't parse PDF on the client, but we can send the role info
        // and let the backend generate based on role alone.
        // The resume will be used once uploaded during creation.
        resumeText = undefined
      }

      const input: GenerateQuestionsInput = {
        title: review.title,
        job_description: review.job_description,
        required_skills: review.required_skills,
        experience_level: review.experience_level,
        resume_text: resumeText,
        question_count: 8,
        categories: ['warm_up', 'behavioral', 'technical', 'situational'],
      }
      const questions = await generateInterviewQuestions(currentOrgId, input)
      if (questions.length > 0) {
        setR('questions', questions)
        setShowQuestions(true)
        toast.success(`${questions.length} questions generated`)
      } else {
        toast.error('No questions were generated')
      }
    } catch {
      toast.error('Failed to generate questions')
    } finally {
      setGeneratingQuestions(false)
    }
  }

  // ── Phase 2: Submit ──────────────────────────────────────────────────────

  const validateReview = (): boolean => {
    if (!review) return false
    const errs: Record<string, string> = {}
    if (!review.title.trim()) errs.title = 'Required'
    if (!review.job_description.trim()) errs.job_description = 'Required'
    if (review.required_skills.length === 0) errs.required_skills = 'Add at least one skill'
    if (!resumeFile && !hasExistingResume) errs.resume = 'Upload the candidate resume'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validateReview() || !review || !currentOrgId) return
    setCreating(true)
    try {
      const meetingLink = review.meeting_link.trim() || undefined
      if (meetingLink) {
        try {
          new URL(meetingLink)
        } catch {
          setErrors((e) => ({ ...e, meeting_link: 'Enter a valid URL' }))
          setCreating(false)
          return
        }
      }

      const payload: CreateInterviewInput = {
        title: review.title.trim(),
        department: review.department.trim() || undefined,
        job_description: review.job_description.trim(),
        required_skills: review.required_skills,
        experience_level: review.experience_level,
        salary_currency: review.salary_currency || undefined,
        salary_min: review.salary_min ? Number(review.salary_min) : undefined,
        salary_max: review.salary_max ? Number(review.salary_max) : undefined,
        candidate_name: review.candidate_name.trim() || undefined,
        candidate_email: review.candidate_email.trim() || undefined,
        mode: review.mode,
        meeting_link: meetingLink,
        scheduled_at: review.scheduled_at || undefined,
        time_limit_minutes: review.time_limit_minutes,
        personality: review.personality,
        no_show_timeout_seconds: 600,
        questions: showQuestions ? review.questions : undefined,
        question_generation: showQuestions ? 'ai_generated' : 'ai_generated',
      }

      if (editMode && editId) {
        const updated = await updateInterviewRecord(currentOrgId, editId, payload)
        updateInterview(editId, updated)
        if (resumeFile) {
          try {
            const result = await uploadInterviewResume(currentOrgId, editId, resumeFile)
            if (result.parse_failed) toast.warning('Resume uploaded but could not be fully parsed')
            // Update candidate name/email from parsed resume
            if (result.resume) {
              const parsed = result.resume as unknown as {
                name?: string
                email?: string
                raw_text?: string
              }
              const editUpdates: Record<string, string> = {}
              if (parsed.name) editUpdates.candidate_name = parsed.name
              if (parsed.email) editUpdates.candidate_email = parsed.email
              if (Object.keys(editUpdates).length > 0)
                updateInterview(editId, editUpdates as Partial<Interview>)
              const rawText = parsed.raw_text
              if (rawText) {
                try {
                  const genInput: GenerateQuestionsInput = {
                    title: review.title,
                    job_description: review.job_description,
                    required_skills: review.required_skills,
                    experience_level: review.experience_level,
                    resume_text: rawText,
                    question_count: Math.max(review.questions.length, 8),
                    categories: ['behavioral', 'technical', 'situational'],
                  }
                  const newQs = await generateInterviewQuestions(currentOrgId, genInput)
                  if (newQs.length > 0) {
                    await updateInterviewRecord(currentOrgId, editId, { questions: newQs })
                    updateInterview(editId, { questions: newQs } as Partial<Interview>)
                  }
                } catch {
                  // Keep existing questions if generation fails
                }
              }
            }
          } catch {
            toast.warning('Changes saved but resume upload failed')
          }
        }
        toast.success('Interview updated')
        navigate(`/org/interviews/${editId}`)
      } else {
        const created = await createInterviewRecord(currentOrgId, payload)
        addInterview(created)
        if (resumeFile) {
          try {
            const result = await uploadInterviewResume(
              currentOrgId,
              created.interview_id,
              resumeFile
            )
            if (result.parse_failed) toast.warning('Resume uploaded but could not be fully parsed')
            // Update candidate name/email from parsed resume
            if (result.resume) {
              const parsed = result.resume as unknown as {
                name?: string
                email?: string
                raw_text?: string
              }
              const storeUpdates: Record<string, string> = {}
              if (parsed.name && !created.candidate_name) storeUpdates.candidate_name = parsed.name
              if (parsed.email && !created.candidate_email)
                storeUpdates.candidate_email = parsed.email
              if (Object.keys(storeUpdates).length > 0)
                updateInterview(created.interview_id, storeUpdates as Partial<Interview>)
              const rawText = parsed.raw_text
              if (rawText) {
                try {
                  const genInput: GenerateQuestionsInput = {
                    title: review.title,
                    job_description: review.job_description,
                    required_skills: review.required_skills,
                    experience_level: review.experience_level,
                    resume_text: rawText,
                    question_count: Math.max(review.questions.length, 8),
                    categories: ['behavioral', 'technical', 'situational'],
                  }
                  const newQs = await generateInterviewQuestions(currentOrgId, genInput)
                  if (newQs.length > 0) {
                    await updateInterviewRecord(currentOrgId, created.interview_id, {
                      questions: newQs,
                    })
                  }
                } catch {
                  // Questions will still be the ones from the draft
                }
              }
            }
          } catch {
            toast.warning('Interview created but resume upload failed')
          }
        }
        toast.success('Interview created')
        navigate(`/org/interviews/${created.interview_id}`)
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : editMode
            ? 'Failed to update interview'
            : 'Failed to create interview'
      )
    } finally {
      setCreating(false)
    }
  }

  // ── Render: Phase 1 ────────────────────────────────────────────────────────

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    )
  }

  if (phase === 'prompt') {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => navigate('/org/roles')}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">New Role</h1>
        </div>

        {/* Prompt area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-2xl mx-auto w-full">
          <div className="w-full space-y-4">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
              What role are you hiring for?
            </h2>

            {/* Prompt input */}
            <div className="relative">
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim() && !drafting) {
                    e.preventDefault()
                    handleGenerate()
                  }
                }}
                placeholder="e.g. Senior Backend Engineer with Node.js and AWS experience for our platform team"
                className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-violet-500 resize-none"
              />
              <p className="absolute bottom-3 right-3 text-[11px] text-slate-400 pointer-events-none select-none">
                ⌘↵
              </p>
            </div>
            {prompt.length > 0 && (
              <p
                className={cn(
                  'text-xs',
                  prompt.length >= 30 ? 'text-emerald-500' : 'text-slate-400'
                )}
              >
                {prompt.length >= 30 ? 'Looks good' : 'Add more detail for a better result'}
              </p>
            )}

            {/* Create button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || drafting}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            >
              {drafting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up your role...
                </>
              ) : (
                'Create Role'
              )}
            </button>

            {/* Fallback on error */}
            {draftError && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 space-y-1.5">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                  Something went wrong
                </p>
                <p className="text-xs text-red-500 dark:text-red-400/80">{draftError}</p>
                <button
                  onClick={() => {
                    setReview({
                      title: prompt.trim().slice(0, 100),
                      department: '',
                      job_description: prompt.trim(),
                      required_skills: [],
                      experience_level: 'mid',
                      time_limit_minutes: 30,
                      personality: 'facilitator',
                      mode: 'solo',
                      questions: [],
                      salary_currency: 'USD',
                      salary_min: '',
                      salary_max: '',
                      candidate_name: '',
                      candidate_email: '',
                      meeting_link: '',
                      scheduled_at: '',
                    })
                    setDraftError(null)
                    setPhase('review')
                  }}
                  className="text-xs text-violet-600 dark:text-violet-400 hover:underline mt-0.5"
                >
                  Set up manually instead
                </button>
              </div>
            )}

            {/* Examples, hidden once the user starts typing */}
            {prompt.length === 0 && (
              <div className="pt-1">
                <p className="text-xs text-slate-400 mb-2">Examples:</p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_PROMPTS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setPrompt(ex)}
                      className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Phase 2 ────────────────────────────────────────────────────────

  if (!review) return null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-200 dark:border-slate-700/60">
        <button
          onClick={() =>
            editMode && editId
              ? navigate(`/org/interviews/${editId}`)
              : templateMode && templateTitle
                ? navigate(`/org/roles/${encodeURIComponent(templateTitle)}`)
                : navigate('/org/roles')
          }
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
            {templateMode
              ? templateTitle
              : review.title || (editMode ? 'Edit Interview' : 'New Role')}
          </h1>
          <p className="text-sm text-slate-500">
            {templateMode
              ? 'New candidate interview'
              : editMode
                ? 'Edit your interview setup'
                : 'Review and finalize your role details'}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        {/* ── Role Details ─────────────────────────────────────────────── */}
        <div style={{ order: templateMode ? 2 : 1 }}>
          <SectionCard
            title="Role Details"
            variant={templateMode ? undefined : 'primary'}
            collapsible
            defaultOpen={!templateMode}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Job Title</Label>
                <Input value={review.title} onChange={(e) => setR('title', e.target.value)} />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>
              <div>
                <Label>Department</Label>
                <Input
                  value={review.department}
                  onChange={(e) => setR('department', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label required>Job Description</Label>
              <Textarea
                rows={4}
                value={review.job_description}
                onChange={(e) => setR('job_description', e.target.value)}
              />
              {errors.job_description && (
                <p className="mt-1 text-xs text-red-500">{errors.job_description}</p>
              )}
            </div>
            <div>
              <Label required>Required Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && skillInput.trim()) {
                      e.preventDefault()
                      if (!review.required_skills.includes(skillInput.trim()))
                        setR('required_skills', [...review.required_skills, skillInput.trim()])
                      setSkillInput('')
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (skillInput.trim() && !review.required_skills.includes(skillInput.trim())) {
                      setR('required_skills', [...review.required_skills, skillInput.trim()])
                      setSkillInput('')
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
              {errors.required_skills && (
                <p className="mt-1 text-xs text-red-500">{errors.required_skills}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {review.required_skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium"
                  >
                    {s}
                    <button
                      onClick={() =>
                        setR(
                          'required_skills',
                          review.required_skills.filter((x) => x !== s)
                        )
                      }
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Salary Range (Monthly)</Label>
                <div className="flex gap-2">
                  <select
                    value={review.salary_currency}
                    onChange={(e) => setR('salary_currency', e.target.value)}
                    className="w-32 shrink-0 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.value} {c.symbol}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Min"
                    value={review.salary_min}
                    onChange={(e) => setR('salary_min', e.target.value)}
                    className="min-w-0"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Max"
                    value={review.salary_max}
                    onChange={(e) => setR('salary_max', e.target.value)}
                    className="min-w-0"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Leave blank to keep salary confidential. Lira will say the team will follow up.
                </p>
              </div>
              <div>
                <Label>Experience Level</Label>
                <Select
                  options={EXPERIENCE_LEVELS}
                  value={review.experience_level}
                  onChange={(v) => setR('experience_level', v as ExperienceLevel)}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  min={15}
                  max={120}
                  value={review.time_limit_minutes}
                  onChange={(e) => setR('time_limit_minutes', Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Interview Mode</Label>
                <Select
                  options={MODES}
                  value={review.mode}
                  onChange={(v) => setR('mode', v as InterviewMode)}
                />
              </div>
              <div>
                <Label>Lira Personality</Label>
                <Select
                  options={PERSONALITIES}
                  value={review.personality}
                  onChange={(v) => setR('personality', v as InterviewPersonality)}
                />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Candidate Resume ────────────────────────────────────────────── */}
        <div style={{ order: templateMode ? 1 : 3 }}>
          <SectionCard title="Candidate Resume">
            <p className="text-xs text-slate-500">
              {editMode && hasExistingResume
                ? 'A resume is already on file. Upload a new one to replace it.'
                : "Upload the candidate's resume. Lira will extract their details automatically."}
            </p>
            <div
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer',
                resumeFile
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : errors.resume
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-slate-200 dark:border-slate-700 hover:border-violet-400'
              )}
              onClick={() => resumeRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  resumeRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Upload
                className={cn(
                  'w-5 h-5 shrink-0',
                  resumeFile ? 'text-emerald-500' : 'text-slate-400'
                )}
              />
              {resumeFile ? (
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {resumeFile.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setResumeFile(null)
                    }}
                    className="text-xs text-red-500 hover:text-red-600 ml-2 shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <span className="text-sm text-slate-500">Click to upload PDF resume</span>
              )}
              <input
                ref={resumeRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  setResumeFile(e.target.files?.[0] ?? null)
                  setErrors((prev) => ({ ...prev, resume: '' }))
                }}
              />
            </div>
            {errors.resume && <p className="text-xs text-red-500">{errors.resume}</p>}
            {resumeFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Candidate details and interview questions will be automatically generated from the
                resume.
              </p>
            )}
          </SectionCard>
        </div>

        {/* ── Meeting ─────────────────────────────────────────────────────── */}
        <div style={{ order: templateMode ? 3 : 4 }}>
          <SectionCard title="Meeting" collapsible defaultOpen={templateMode}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Scheduled At</Label>
                <Input
                  type="datetime-local"
                  value={review.scheduled_at}
                  onChange={(e) => setR('scheduled_at', e.target.value)}
                />
              </div>
              <div>
                <Label>Meeting Link</Label>
                <Input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={review.meeting_link}
                  onChange={(e) => setR('meeting_link', e.target.value)}
                />
                {errors.meeting_link && (
                  <p className="mt-1 text-xs text-red-500">{errors.meeting_link}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">Leave empty to add later</p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Questions ────────────────────────────────────────────────────── */}
        <div style={{ order: 5 }}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Interview Questions
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                  {review.questions.length}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerateQuestions}
                  disabled={generatingQuestions}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors disabled:opacity-50"
                >
                  {generatingQuestions ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {generatingQuestions
                    ? 'Generating...'
                    : review.questions.length > 0
                      ? 'Regenerate'
                      : 'Generate Questions'}
                </button>
                {review.questions.length > 0 && (
                  <button
                    onClick={() => setShowQuestions((v) => !v)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {showQuestions ? 'Hide' : 'Review'}
                  </button>
                )}
              </div>
            </div>
            {review.questions.length === 0 && !generatingQuestions && (
              <div className="px-5 py-6 flex flex-col items-center text-center">
                <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No questions yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Click "Generate Questions" to create interview questions based on the role
                  details.
                </p>
              </div>
            )}
            {generatingQuestions && review.questions.length === 0 && (
              <div className="px-5 py-6 flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
                <p className="text-sm text-slate-500">Generating questions...</p>
              </div>
            )}
            {!showQuestions && review.questions.length > 0 && (
              <div className="px-5 py-3">
                <p className="text-xs text-slate-500">
                  {review.questions.length} questions ready. Click "Review" to view or edit them.
                </p>
              </div>
            )}
            {showQuestions && (
              <div className="p-5 space-y-3">
                {review.questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                  >
                    <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <Textarea
                        rows={2}
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...review.questions]
                          updated[idx] = { ...updated[idx], text: e.target.value }
                          setR('questions', updated)
                        }}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={q.category}
                          onChange={(e) => {
                            const updated = [...review.questions]
                            updated[idx] = {
                              ...updated[idx],
                              category: e.target.value as QuestionCategory,
                            }
                            setR('questions', updated)
                          }}
                          className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-slate-500">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={q.follow_up_enabled}
                            onChange={(e) => {
                              const updated = [...review.questions]
                              updated[idx] = {
                                ...updated[idx],
                                follow_up_enabled: e.target.checked,
                              }
                              setR('questions', updated)
                            }}
                          />
                          Follow-ups
                        </label>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setR(
                          'questions',
                          review.questions.filter((_, i) => i !== idx)
                        )
                      }
                      className="shrink-0 p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() =>
                    setR('questions', [
                      ...review.questions,
                      {
                        text: '',
                        category: 'behavioral',
                        expected_depth: 'moderate',
                        follow_up_enabled: true,
                        order: review.questions.length + 1,
                      },
                    ])
                  }
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-violet-400 text-slate-400 hover:text-violet-600 text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom submit button ────────────────────────────────────────── */}
        <div className="flex justify-end pt-2 pb-4">
          <button
            onClick={handleSubmit}
            disabled={creating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BriefcaseIcon className="w-4 h-4" />
            )}
            {editMode ? 'Save Changes' : templateMode ? 'Create Interview' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { InterviewCreatePage }
