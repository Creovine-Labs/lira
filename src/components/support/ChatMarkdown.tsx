import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib'

/**
 * Renders a chat message body as markdown — bold, italics, lists, links, inline
 * code, and copyable code blocks — so agents and customers see formatted text,
 * not literal `**stars**` and backticks. (N2)
 *
 * `dark` tunes the palette for coloured/dark bubbles (Lira/agent) vs light ones.
 */
export function ChatMarkdown({ body, dark = false }: { body: string; dark?: boolean }) {
  return (
    <div className="chat-md">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-bold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'underline underline-offset-2',
                dark ? 'text-white' : 'text-indigo-600'
              )}
            >
              {children}
            </a>
          ),
          ul: ({ children }) => (
            <ul className="mb-1.5 ml-4 list-disc space-y-0.5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1.5 ml-4 list-decimal space-y-0.5 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-5">{children}</li>,
          h1: ({ children }) => <p className="mb-1 font-bold">{children}</p>,
          h2: ({ children }) => <p className="mb-1 font-bold">{children}</p>,
          h3: ({ children }) => <p className="mb-1 font-semibold">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote
              className={cn(
                'my-1.5 border-l-2 pl-2 italic',
                dark ? 'border-white/40' : 'border-gray-300'
              )}
            >
              {children}
            </blockquote>
          ),
          code: ({ className, children }) => {
            const isBlock =
              (className ?? '').includes('language-') || String(children).includes('\n')
            if (!isBlock) {
              return (
                <code
                  className={cn(
                    'rounded px-1 py-0.5 font-mono text-[0.85em]',
                    dark ? 'bg-white/20' : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {children}
                </code>
              )
            }
            return <CodeBlock dark={dark}>{String(children).replace(/\n$/, '')}</CodeBlock>
          },
          pre: ({ children }) => <>{children}</>,
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}

function CodeBlock({ children, dark }: { children: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="group relative my-1.5">
      <pre
        className={cn(
          'overflow-x-auto rounded-lg p-2.5 font-mono text-[12px] leading-5',
          dark ? 'bg-black/30' : 'bg-gray-900 text-gray-100'
        )}
      >
        <code>{children}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className={cn(
          'absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100',
          'bg-white/15 text-white hover:bg-white/25'
        )}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

/** Small helper for non-markdown wrappers that still want the chat-md spacing. */
export function ChatMarkdownWrap({ children }: { children: ReactNode }) {
  return <div className="chat-md">{children}</div>
}
