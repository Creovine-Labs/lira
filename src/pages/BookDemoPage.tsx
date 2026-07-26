import { useState } from 'react'
import { CalendarCheck, CheckCircle, EnvelopeSimple, UsersThree } from '@phosphor-icons/react'
import { SEO } from '@/components/SEO'
import { submitDemoRequest } from '@/services/api'
import { BlogShell } from './BlogChrome'

const FIELDS = [
  { key: 'email', label: 'Work email', type: 'email', required: true },
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'company', label: 'Company', type: 'text', required: false },
  { key: 'teamSize', label: 'Team size', type: 'text', required: false },
] as const

type FieldKey = (typeof FIELDS)[number]['key'] | 'focus' | 'website'
type FormState = Record<FieldKey, string>

const EMPTY_FORM: FormState = {
  email: '',
  name: '',
  company: '',
  teamSize: '',
  focus: '',
  website: '',
}

const inputStyle = {
  minHeight: 48,
  border: '1px solid rgba(2,3,8,0.16)',
  borderRadius: 12,
  padding: '0 14px',
  background: '#fff',
  color: '#020308',
} as const

const labelStyle = {
  display: 'grid',
  gap: 8,
  color: 'rgba(2,3,8,0.62)',
  fontSize: 13,
  fontWeight: 700,
} as const

export function BookDemoPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const update = (key: FieldKey) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setError(null)

    if (!form.email.trim() || !form.name.trim()) {
      setError('Please add your name and work email so we can reach you.')
      return
    }

    setStatus('submitting')
    try {
      await submitDemoRequest({
        email: form.email.trim(),
        name: form.name.trim(),
        company: form.company.trim(),
        teamSize: form.teamSize.trim(),
        focus: form.focus.trim(),
        website: form.website,
      })
      setStatus('success')
      setForm(EMPTY_FORM)
    } catch (err) {
      setStatus('error')
      setError(
        err instanceof Error && err.message
          ? err.message.replace(/^\d+:\s*/, '')
          : 'Something went wrong. Please try again.'
      )
    }
  }

  return (
    <BlogShell>
      <SEO
        title="Book a Demo - Lira"
        description="Book a Lira demo and share your team size, support channels, and customer support goals."
        path="/book-demo"
      />

      <section className="bx-hero">
        <div className="bx-hero-bg" aria-hidden="true" />
        <div className="bx-container bx-hero-inner" style={{ gridTemplateColumns: '1fr' }}>
          <div>
            <h1 className="bx-title">Book a Lira demo.</h1>
            <p className="bx-subtitle">
              Tell us how your team supports customers today. We will show you how Lira can fit into
              your website, portal, email, voice, and internal workflows.
            </p>
          </div>
        </div>
      </section>

      <main className="bx-main">
        <div className="bx-container bx-split">
          <article className="bx-post-card">
            <div className="bx-post-surface">
              <span className="bx-button-icon" style={{ width: 52, height: 52, marginBottom: 24 }}>
                <CalendarCheck size={22} />
              </span>
              <h2 className="bx-section-title">What happens next</h2>
              <p className="bx-section-copy">
                We review your support setup, send a calendar link, and tailor the demo around the
                channels, developer access, and support workflows your team actually needs.
              </p>
              <div style={{ display: 'grid', gap: 12, marginTop: 28 }}>
                {[
                  ['01', 'Share your support goals'],
                  ['02', 'Choose a demo time'],
                  ['03', 'See Lira with a realistic support flow'],
                ].map(([number, text]) => (
                  <div
                    key={number}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr',
                      gap: 12,
                      alignItems: 'center',
                      padding: 14,
                      borderRadius: 14,
                      background: 'rgba(2,3,8,0.05)',
                    }}
                  >
                    <strong>{number}</strong>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="bx-post-card">
            <div className="bx-post-surface">
              <h2 className="bx-section-title">Demo request</h2>

              {status === 'success' ? (
                <div
                  style={{
                    display: 'grid',
                    gap: 14,
                    justifyItems: 'center',
                    textAlign: 'center',
                    marginTop: 28,
                    padding: '24px 8px',
                  }}
                >
                  <span
                    className="bx-button-icon"
                    style={{ width: 52, height: 52, color: '#16a34a' }}
                  >
                    <CheckCircle size={26} weight="fill" />
                  </span>
                  <h3 className="bx-post-title" style={{ fontSize: 20 }}>
                    Request received
                  </h3>
                  <p className="bx-section-copy" style={{ maxWidth: 360 }}>
                    Thanks — we sent a confirmation to your email and our team will reach out
                    shortly to schedule your demo.
                  </p>
                  <button
                    type="button"
                    className="bx-button"
                    onClick={() => setStatus('idle')}
                    style={{
                      marginTop: 4,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                    }}
                  >
                    <span className="bx-button-label">Send another request</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14, marginTop: 24 }}>
                  {FIELDS.map((field) => (
                    <label key={field.key} style={labelStyle}>
                      {field.label}
                      {field.required ? (
                        <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
                      ) : null}
                      <input
                        type={field.type}
                        required={field.required}
                        value={form[field.key]}
                        onChange={(e) => update(field.key)(e.target.value)}
                        style={inputStyle}
                      />
                    </label>
                  ))}
                  <label style={labelStyle}>
                    What should we focus on?
                    <textarea
                      rows={5}
                      value={form.focus}
                      onChange={(e) => update('focus')(e.target.value)}
                      style={{
                        border: '1px solid rgba(2,3,8,0.16)',
                        borderRadius: 12,
                        padding: 14,
                        background: '#fff',
                        color: '#020308',
                        resize: 'vertical',
                      }}
                    />
                  </label>

                  {/* Honeypot: hidden from real users; only bots fill it. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => update('website')(e.target.value)}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      left: '-9999px',
                      width: 1,
                      height: 1,
                      opacity: 0,
                    }}
                  />

                  {error ? (
                    <p style={{ margin: 0, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
                      {error}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    className="bx-button"
                    disabled={status === 'submitting'}
                    style={{
                      cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
                      opacity: status === 'submitting' ? 0.7 : 1,
                      border: 'none',
                      background: 'transparent',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <span className="bx-button-label">
                      {status === 'submitting' ? 'Sending…' : 'Submit request'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </article>
        </div>

        <div className="bx-container bx-post-grid" style={{ marginTop: 16 }}>
          {[
            [EnvelopeSimple, 'Email and portal support'],
            [UsersThree, 'Customer context and handoff'],
            [CalendarCheck, 'Setup and launch plan'],
          ].map(([Icon, title]) => (
            <article className="bx-post-card" key={String(title)}>
              <div className="bx-post-surface">
                <span
                  className="bx-button-icon"
                  style={{ width: 44, height: 44, marginBottom: 18 }}
                >
                  <Icon size={18} />
                </span>
                <h3 className="bx-post-title" style={{ fontSize: 18 }}>
                  {String(title)}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </main>
    </BlogShell>
  )
}
