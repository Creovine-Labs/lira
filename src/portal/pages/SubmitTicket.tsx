import { useState, useCallback } from 'react'
import type { PortalConfig } from '../types'
import { submitTicket } from '../api'

interface SubmitTicketProps {
  config: PortalConfig
}

export function SubmitTicket({ config }: SubmitTicketProps) {
  const accent = config.portalColor || '#3730a3'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      setSubmitting(true)
      try {
        await submitTicket(config.orgSlug, { name, email, subject, description })
        setSubmitted(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit ticket')
      } finally {
        setSubmitting(false)
      }
    },
    [config.orgSlug, name, email, subject, description]
  )

  if (submitted) {
    return (
      <div className="lp-page">
        <div className="lp-success-card">
          <div className="lp-success-icon" style={{ color: accent }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="48"
              height="48"
            >
              <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h2>Ticket submitted!</h2>
          <p>
            We&apos;ve received your request and will get back to you shortly at{' '}
            <strong>{email}</strong>.
          </p>
          <div className="lp-success-actions">
            <a
              href={`/${config.orgSlug}/submit`}
              className="lp-btn-outline"
              onClick={() => {
                setSubmitted(false)
                setSubject('')
                setDescription('')
              }}
            >
              Submit another
            </a>
            <a
              href={`/${config.orgSlug}`}
              className="lp-btn-primary"
              style={{ backgroundColor: accent }}
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-page">
      <div className="lp-form-card">
        <h2>Submit a Request</h2>
        <p className="lp-form-sub">Describe your issue and our team will get back to you.</p>

        <form onSubmit={handleSubmit} className="lp-form">
          <div className="lp-form-row">
            <div className="lp-field">
              <label htmlFor="name">Your Name</label>
              <input
                id="name"
                type="text"
                required
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="lp-input"
              />
            </div>
            <div className="lp-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                required
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="lp-input"
              />
            </div>
          </div>

          <div className="lp-field">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              type="text"
              required
              placeholder="Brief summary of your issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="lp-input"
            />
          </div>

          <div className="lp-field">
            <label htmlFor="desc">Description</label>
            <textarea
              id="desc"
              required
              rows={6}
              placeholder="Please provide as much detail as possible…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="lp-input lp-textarea"
            />
          </div>

          {error && <p className="lp-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="lp-btn-primary"
            style={{ backgroundColor: accent }}
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
