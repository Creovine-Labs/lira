import type { PortalConfig } from '../types'

interface PortalHomeProps {
  config: PortalConfig
}

export function PortalHome({ config }: PortalHomeProps) {
  const accent = config.portalColor || '#3730a3'

  return (
    <div className="lp-home">
      {/* Hero */}
      <section className="lp-hero" style={{ backgroundColor: accent }}>
        <h1 className="lp-hero-title">How can we help you?</h1>
        <p className="lp-hero-sub">{config.greeting || `Welcome to ${config.orgName} Support`}</p>
      </section>

      {/* Feature cards */}
      <section className="lp-cards">
        <a href={`/${config.orgSlug}/submit`} className="lp-card">
          <div className="lp-card-icon" style={{ color: accent }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="28"
              height="28"
            >
              <path d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <h3 className="lp-card-title">Submit a Request</h3>
          <p className="lp-card-desc">Create a new support ticket and get help from our team.</p>
        </a>

        <a href={`/${config.orgSlug}/tickets`} className="lp-card">
          <div className="lp-card-icon" style={{ color: accent }}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="28"
              height="28"
            >
              <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
            </svg>
          </div>
          <h3 className="lp-card-title">Track My Tickets</h3>
          <p className="lp-card-desc">
            Sign in to view the status of your open and resolved requests.
          </p>
        </a>

        {config.chatEnabled && (
          <a href={`/${config.orgSlug}/chat`} className="lp-card">
            <div className="lp-card-icon" style={{ color: accent }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="28"
                height="28"
              >
                <path d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <h3 className="lp-card-title">Live Chat</h3>
            <p className="lp-card-desc">
              Chat with our AI assistant in real time for instant answers.
            </p>
          </a>
        )}
      </section>
    </div>
  )
}
