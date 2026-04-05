import { useState } from 'react'
import { adminSendEmail, adminBroadcastEmail } from '@/services/api'
import { useAuthStore } from '@/app/store'
import { cn } from '@/lib'

type Tab = 'send' | 'broadcast'

export function AdminEmailPage() {
  const role = useAuthStore((s) => s.userRole)
  const isSuperAdmin = role === 'SUPER_ADMIN'

  const [tab, setTab] = useState<Tab>('send')
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setResult(null)

    try {
      if (tab === 'send') {
        const recipients = to
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        if (!recipients.length) {
          setResult('Enter at least one recipient email.')
          setSending(false)
          return
        }
        const html = body.replace(/\n/g, '<br />')
        const res = await adminSendEmail(recipients, subject.trim(), html)
        setResult(
          `Sent to ${res.sent} recipient(s).${res.failed.length ? ` Failed: ${res.failed.join(', ')}` : ''}`
        )
      } else {
        const html = body.replace(/\n/g, '<br />')
        const filterObj =
          filter === 'verified'
            ? { emailVerified: true }
            : filter === 'unverified'
              ? { emailVerified: false }
              : undefined
        const res = await adminBroadcastEmail(subject.trim(), html, filterObj)
        setResult(
          `Broadcast sent to ${res.sent}/${res.total} users.${res.failed.length ? ` Failed: ${res.failed.length}` : ''}`
        )
      }
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="px-6 py-6">
      <h1 className="text-lg font-semibold text-gray-900">Email</h1>
      <p className="mt-0.5 text-sm text-gray-400">
        Send emails or broadcast to all users via Resend
      </p>

      {/* Tabs */}
      <div className="mt-5 flex items-center gap-0 border-b border-gray-100">
        <button
          onClick={() => setTab('send')}
          className={cn(
            'border-b-2 px-4 pb-3 text-sm font-medium transition',
            tab === 'send'
              ? 'border-[#3730a3] text-[#3730a3]'
              : 'border-transparent text-gray-400 hover:text-gray-700'
          )}
        >
          Send to Users
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setTab('broadcast')}
            className={cn(
              'border-b-2 px-4 pb-3 text-sm font-medium transition',
              tab === 'broadcast'
                ? 'border-[#3730a3] text-[#3730a3]'
                : 'border-transparent text-gray-400 hover:text-gray-700'
            )}
          >
            Broadcast
          </button>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-5 max-w-2xl space-y-4">
        {/* Recipients (send mode) */}
        {tab === 'send' && (
          <div>
            <label htmlFor="admin-email-to" className="block text-sm font-medium text-gray-700">
              To <span className="font-normal text-gray-400">(comma-separated)</span>
            </label>
            <input
              id="admin-email-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="user@example.com, another@example.com"
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#3730a3]/30 focus:ring-2 focus:ring-[#3730a3]/10"
            />
          </div>
        )}

        {/* Filter (broadcast mode) */}
        {tab === 'broadcast' && (
          <div>
            <label
              htmlFor="admin-email-audience"
              className="block text-sm font-medium text-gray-700"
            >
              Audience
            </label>
            <select
              id="admin-email-audience"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#3730a3]/30 focus:ring-2 focus:ring-[#3730a3]/10"
            >
              <option value="all">All users</option>
              <option value="verified">Verified users only</option>
              <option value="unverified">Unverified users only</option>
            </select>
          </div>
        )}

        {/* Subject */}
        <div>
          <label htmlFor="admin-email-subject" className="block text-sm font-medium text-gray-700">
            Subject
          </label>
          <input
            id="admin-email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#3730a3]/30 focus:ring-2 focus:ring-[#3730a3]/10"
          />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="admin-email-body" className="block text-sm font-medium text-gray-700">
            Body{' '}
            <span className="font-normal text-gray-400">(plain text, newlines → line breaks)</span>
          </label>
          <textarea
            id="admin-email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Write your email content here..."
            className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#3730a3]/30 focus:ring-2 focus:ring-[#3730a3]/10"
          />
        </div>

        {result && (
          <div
            className={cn(
              'rounded-xl border p-3 text-sm',
              result.startsWith('Sent') || result.startsWith('Broadcast')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            )}
          >
            {result}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !subject.trim() || !body.trim()}
          className="rounded-xl bg-[#3730a3] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#312e81] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? 'Sending...' : tab === 'send' ? 'Send Email' : 'Send Broadcast'}
        </button>
      </form>
    </div>
  )
}
