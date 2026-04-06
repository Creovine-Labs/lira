import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'

import { useOrgStore, useDocumentStore, useKBStore } from '@/app/store'
import { queryKnowledgeBase, type KBQueryMessage, type KBQuerySource } from '@/services/api'
import { cn } from '@/lib'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: KBQuerySource[]
}

function QueryPanel() {
  const { currentOrgId } = useOrgStore()
  const { documents } = useDocumentStore()
  const { entries } = useKBStore()

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasContext = documents.length > 0 || entries.length > 0

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !currentOrgId || loading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const history: KBQueryMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await queryKnowledgeBase(currentOrgId, trimmed, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources },
      ])
    } catch {
      toast.error('Failed to get answer')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── Empty state: no sources indexed yet ─────────────────────────────────
  if (!hasContext) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3730a3]/10 to-[#3730a3]/5">
          <SparklesIcon className="h-8 w-8 text-[#3730a3]/50" />
        </div>
        <h3 className="mt-5 text-base font-bold text-gray-900">No knowledge sources yet</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-400">
          Upload documents or crawl a website first. Once Lira has indexed your content, you can ask
          questions here and get answers grounded in your data.
        </p>
      </div>
    )
  }

  // ── Chat interface ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '400px' }}>
      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-2xl border border-white/60 bg-white shadow-sm"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <SparklesIcon className="h-10 w-10 text-[#3730a3]/30" />
            <h3 className="mt-4 text-sm font-bold text-gray-900">
              Ask anything about your knowledge base
            </h3>
            <p className="mt-1.5 max-w-md text-xs text-gray-400">
              Lira will search across your{' '}
              {documents.length > 0
                ? `${documents.length} document${documents.length !== 1 ? 's' : ''}`
                : ''}
              {documents.length > 0 && entries.length > 0 ? ' and ' : ''}
              {entries.length > 0
                ? `${entries.length} indexed page${entries.length !== 1 ? 's' : ''}`
                : ''}{' '}
              to find answers.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'Summarize the key topics across my documents',
                'What are the main product features?',
                'Find information about pricing',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    setTimeout(() => inputRef.current?.focus(), 50)
                  }}
                  className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition hover:border-[#3730a3]/40 hover:bg-[#3730a3]/5 hover:text-[#3730a3]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('px-6 py-5', msg.role === 'assistant' ? 'bg-gray-50/50' : '')}
              >
                <div className="flex items-start gap-3">
                  {msg.role === 'assistant' ? (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3730a3] to-[#312e81]">
                      <img src="/lira_white.png" alt="Lira" className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-bold text-gray-500">
                      You
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                      {msg.content}
                    </p>

                    {/* Source citations */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {msg.sources.map((src, j) => (
                          <span
                            key={j}
                            className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500"
                          >
                            {src.type === 'document' ? (
                              <DocumentTextIcon className="h-3 w-3" />
                            ) : (
                              <GlobeAltIcon className="h-3 w-3" />
                            )}
                            {src.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="px-6 py-5 bg-gray-50/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3730a3] to-[#312e81]">
                    <img
                      src="/lira_white.png"
                      alt="Lira"
                      className="h-3.5 w-3.5 animate-spin"
                      style={{ animationDuration: '1.2s' }}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex gap-1">
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-300"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400">Searching knowledge base…</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-3">
        <div className="relative rounded-2xl border border-white/60 bg-white shadow-sm transition focus-within:border-[#3730a3]/30 focus-within:ring-2 focus-within:ring-[#3730a3]/10">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your documents…"
            rows={1}
            className="w-full resize-none rounded-2xl bg-transparent px-4 py-3.5 pr-12 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            disabled={loading}
            style={{ minHeight: '48px', maxHeight: '120px' }}
            onInput={(e) => {
              const textarea = e.currentTarget
              textarea.style.height = 'auto'
              textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
            }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={cn(
              'absolute bottom-2.5 right-2.5 flex h-8 w-8 items-center justify-center rounded-xl transition',
              input.trim() && !loading
                ? 'bg-[#3730a3] text-white hover:bg-[#312e81]'
                : 'bg-gray-100 text-gray-300'
            )}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

export { QueryPanel }
