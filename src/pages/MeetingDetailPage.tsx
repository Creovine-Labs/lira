import { useCallback, useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  MessageSquare,
  Sparkles,
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Share2,
  RefreshCw,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { useAuthStore } from '@/app/store'
import { getMeeting, getMeetingSummary, type Meeting, type Message } from '@/services/api'
import { LiraLogo } from '@/components/LiraLogo'
import { cn } from '@/lib'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function duration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 0) return '—'
  const mins = Math.round(ms / 60_000)
  if (mins < 1) return '<1 min'
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function msgTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// ── Transcript message bubble ────────────────────────────────────────────────

function TranscriptBubble({ msg }: { msg: Message }) {
  const isAi = msg.is_ai

  return (
    <div className={cn('flex gap-2.5', isAi ? 'flex-row' : 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs',
          isAi ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-500/20 text-slate-400'
        )}
      >
        {isAi ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
          isAi
            ? 'rounded-tl-md bg-violet-500/10 text-foreground'
            : 'rounded-tr-md bg-accent text-foreground'
        )}
      >
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isAi ? 'Lira' : msg.speaker}
          <span className="ml-2 font-normal normal-case">{msgTime(msg.timestamp)}</span>
        </p>
        <p>{msg.text}</p>
      </div>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { token } = useAuthStore()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Summary
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryMode, setSummaryMode] = useState<'short' | 'long'>('short')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  // Transcript expand/collapse
  const [showTranscript, setShowTranscript] = useState(false)

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }
    if (!id) return
    fetchMeeting()
  }, [token, id, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchMeeting() {
    setLoading(true)
    setError(null)
    try {
      const data = await getMeeting(id!)
      setMeeting(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meeting')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = useCallback(
    async (mode?: 'short' | 'long') => {
      if (!id || summaryLoading) return
      const targetMode = mode ?? summaryMode
      setSummaryMode(targetMode)
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const data = await getMeetingSummary(id, targetMode)
        setSummary(data.summary)
        // Update the displayed title if the backend auto-generated one
        if (data.title && meeting) {
          setMeeting({ ...meeting, title: data.title })
        }
      } catch (err) {
        setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary')
      } finally {
        setSummaryLoading(false)
      }
    },
    [id, summaryLoading, summaryMode, meeting]
  )

  // Copy summary to clipboard
  const handleCopy = useCallback(() => {
    if (!summary) return
    // Strip markdown formatting for clean clipboard text
    const plainText = summary.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    navigator.clipboard.writeText(plainText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [summary])

  // Share helpers
  const shareText = summary
    ? summary.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1')
    : ''
  const meetingTitle = meeting?.title || 'Meeting Summary'

  const handleShare = useCallback(
    (platform: string) => {
      setShareOpen(false)
      const text = encodeURIComponent(`${meetingTitle}\n\n${shareText}`)
      const subject = encodeURIComponent(meetingTitle)
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${text}`, '_blank')
          break
        case 'email':
          window.open(`mailto:?subject=${subject}&body=${text}`, '_blank')
          break
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
          break
        case 'clipboard':
          navigator.clipboard.writeText(`${meetingTitle}\n\n${shareText}`)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
          break
      }
    },
    [meetingTitle, shareText]
  )

  // Close share dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false)
      }
    }
    if (shareOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [shareOpen])

  // ── Loading / error states ──────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          <p className="text-sm text-muted-foreground">Loading meeting…</p>
        </div>
      </main>
    )
  }

  if (error || !meeting) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20 p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-sm text-destructive">{error || 'Meeting not found'}</p>
          <button
            onClick={() => navigate('/meetings')}
            className="text-sm font-medium text-violet-500 underline-offset-2 hover:underline"
          >
            Back to meetings
          </button>
        </div>
      </main>
    )
  }

  const messages = meeting.messages ?? []
  const msgCount = messages.length
  const aiMsgCount = messages.filter((m) => m.is_ai).length
  const participantMsgCount = msgCount - aiMsgCount

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/meetings')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Meetings
          </button>
          <LiraLogo size="sm" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        {/* Meeting info card */}
        <div className="rounded-xl border bg-card px-5 py-5">
          <h2 className="text-xl font-semibold text-foreground">
            {meeting.title || 'Untitled Meeting'}
          </h2>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDate(meeting.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {formatTime(meeting.created_at)} – {formatTime(meeting.updated_at)} ·{' '}
              {duration(meeting.created_at, meeting.updated_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              {msgCount} messages ({participantMsgCount} from participants, {aiMsgCount} from Lira)
            </span>
          </div>
        </div>

        {/* AI Summary section */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h3 className="font-semibold text-foreground">Meeting Summary</h3>
            </div>
            {!summary && !summaryLoading && (
              <button
                onClick={() => handleGenerateSummary('short')}
                disabled={msgCount === 0}
                className="rounded-full border border-violet-500/30 bg-violet-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-500 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate Summary
                </span>
              </button>
            )}
          </div>

          <div className="px-5 py-4">
            {!summary && !summaryLoading && !summaryError && (
              <p className="text-sm text-muted-foreground">
                {msgCount === 0
                  ? 'No messages in this meeting — nothing to summarize.'
                  : 'Click "Generate Summary" to get an AI-powered breakdown of this conversation.'}
              </p>
            )}

            {summaryLoading && (
              <div className="flex items-center gap-3 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
                <p className="text-sm text-muted-foreground">
                  Generating {summaryMode} summary from {msgCount} messages…
                </p>
              </div>
            )}

            {summaryError && (
              <div className="space-y-2">
                <p className="text-sm text-destructive">{summaryError}</p>
                <button
                  onClick={() => handleGenerateSummary()}
                  className="text-sm font-medium text-violet-500 underline-offset-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {summary && (
              <div className="space-y-4">
                {/* Rendered markdown summary */}
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-strong:text-foreground prose-em:text-muted-foreground">
                  <ReactMarkdown
                    components={{
                      // Suppress h1-h6 — render as bold paragraphs instead
                      h1: ({ children }) => (
                        <p className="text-base font-bold mt-4 mb-1">{children}</p>
                      ),
                      h2: ({ children }) => (
                        <p className="text-base font-bold mt-4 mb-1">{children}</p>
                      ),
                      h3: ({ children }) => (
                        <p className="text-sm font-bold mt-3 mb-1">{children}</p>
                      ),
                      h4: ({ children }) => (
                        <p className="text-sm font-semibold mt-2 mb-0.5">{children}</p>
                      ),
                      h5: ({ children }) => (
                        <p className="text-sm font-semibold mt-2 mb-0.5">{children}</p>
                      ),
                      h6: ({ children }) => (
                        <p className="text-sm font-semibold mt-2 mb-0.5">{children}</p>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm leading-relaxed mb-2">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                    }}
                  >
                    {summary}
                  </ReactMarkdown>
                </div>

                {/* Action bar: buttons row */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                  {/* Regenerate */}
                  <button
                    onClick={() => handleGenerateSummary(summaryMode)}
                    disabled={summaryLoading}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:shadow-md disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </button>

                  {/* Toggle short/long */}
                  <button
                    onClick={() =>
                      handleGenerateSummary(summaryMode === 'short' ? 'long' : 'short')
                    }
                    disabled={summaryLoading}
                    className="flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-50 px-4 py-2 text-xs font-medium text-violet-700 shadow-sm transition hover:bg-violet-100 hover:shadow-md dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20 disabled:opacity-50"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {summaryMode === 'short' ? 'Detailed Summary' : 'Shorter Summary'}
                  </button>

                  {/* Copy */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:shadow-md"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>

                  {/* Share dropdown */}
                  <div className="relative" ref={shareRef}>
                    <button
                      onClick={() => setShareOpen((v) => !v)}
                      className="flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground shadow-sm transition hover:bg-accent hover:shadow-md"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </button>
                    {shareOpen && (
                      <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border bg-card shadow-lg animate-in fade-in slide-in-from-top-1">
                        <div className="p-1">
                          <button
                            onClick={() => handleShare('whatsapp')}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                          >
                            <span className="text-base">💬</span> WhatsApp
                          </button>
                          <button
                            onClick={() => handleShare('email')}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                          >
                            <span className="text-base">📧</span> Email
                          </button>
                          <button
                            onClick={() => handleShare('twitter')}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                          >
                            <span className="text-base">🐦</span> Twitter / X
                          </button>
                          <div className="my-1 border-t border-border/50" />
                          <button
                            onClick={() => handleShare('clipboard')}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition hover:bg-accent"
                          >
                            <Copy className="h-4 w-4" /> Copy to clipboard
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full transcript (collapsible) */}
        {msgCount > 0 && (
          <div className="rounded-xl border bg-card">
            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-accent/50"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Full Transcript</h3>
                <span className="text-xs text-muted-foreground">({msgCount} messages)</span>
              </div>
              {showTranscript ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {showTranscript && (
              <div className="border-t px-5 py-4 space-y-2.5 max-h-[600px] overflow-y-auto">
                {messages.map((msg) => (
                  <TranscriptBubble key={msg.id} msg={msg} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

export { MeetingDetailPage }
