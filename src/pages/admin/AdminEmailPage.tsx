import { useState } from 'react'
import { adminSendEmail, adminBroadcastEmail } from '@/services/api'
import { useAuthStore } from '@/app/store'

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
    <div className="mx-auto max-w-3xl p-6 lg:p-8">
      <h1 className="text-xl font-semibold text-slate-900">Email</h1>
      <p className="mt-1 text-sm text-slate-500">
        Send emails or broadcast to all users via Resend
      </p>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-100 p-1">
        <button
          onClick={() => setTab('send')}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === 'send'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Send to Users
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setTab('broadcast')}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'broadcast'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Broadcast
          </button>
        )}
      </div>

      <form onSubmit={handleSend} className="mt-6 space-y-4">
        {/* Recipients (send mode) */}
        {tab === 'send' && (
          <div>
            <label htmlFor="admin-email-to" className="block text-sm font-medium text-slate-700">
              To <span className="font-normal text-slate-400">(comma-separated)</span>
            </label>
            <input
              id="admin-email-to"
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="user@example.com, another@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        {/* Filter (broadcast mode) */}
        {tab === 'broadcast' && (
          <div>
            <label
              htmlFor="admin-email-audience"
              className="block text-sm font-medium text-slate-700"
            >
              Audience
            </label>
            <select
              id="admin-email-audience"
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="all">All users</option>
              <option value="verified">Verified users only</option>
              <option value="unverified">Unverified users only</option>
            </select>
          </div>
        )}

        {/* Subject */}
        <div>
          <label htmlFor="admin-email-subject" className="block text-sm font-medium text-slate-700">
            Subject
          </label>
          <input
            id="admin-email-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Body */}
        <div>
          <label htmlFor="admin-email-body" className="block text-sm font-medium text-slate-700">
            Body{' '}
            <span className="font-normal text-slate-400">(plain text, newlines → line breaks)</span>
          </label>
          <textarea
            id="admin-email-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder="Write your email content here..."
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {result && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              result.startsWith('Sent') || result.startsWith('Broadcast')
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {result}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !subject.trim() || !body.trim()}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? 'Sending...' : tab === 'send' ? 'Send Email' : 'Send Broadcast'}
        </button>
      </form>
    </div>
  )
}
