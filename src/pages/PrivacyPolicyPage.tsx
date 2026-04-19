import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'March 25, 2026'

export function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Privacy Policy"
        description="Learn how Lira AI collects, uses, and protects your personal information. Read our full privacy policy covering data collection, storage, third-party sharing, and your privacy rights."
        keywords="Lira AI privacy policy, data privacy, personal data protection, GDPR, privacy rights"
        path="/privacy"
      />
      <div className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base text-gray-500">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mx-auto max-w-4xl px-6 pb-24">
          {/* 1 */}
          <h2>1. Introduction</h2>
          <p>
            Creovine Inc. ("<strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>
            ", or "<strong>our</strong>") operates the Lira AI platform located at{' '}
            <strong>liraintelligence.com</strong> and its associated services (collectively, the "
            <strong>Service</strong>"). This Privacy Policy describes how we collect, use, disclose,
            and protect your personal information when you access or use our Service.
          </p>
          <p>
            By creating an account or using the Service, you acknowledge that you have read,
            understood, and agree to the practices described in this Privacy Policy. If you do not
            agree, please do not use the Service.
          </p>

          {/* 2 */}
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li>
              <strong>Account Registration:</strong> When you create an account, we collect your
              full name, email address, and password (stored as a salted cryptographic hash). If you
              register via Google OAuth, we receive your name, email, and profile picture from
              Google.
            </li>
            <li>
              <strong>Organization Data:</strong> When you create or join an organization, we
              collect the organization name, team member details, roles, and organizational
              preferences you provide.
            </li>
            <li>
              <strong>Meeting & Conversation Data:</strong> Audio recordings, transcripts,
              AI-generated summaries, action items, notes, and any content you create within the
              Service.
            </li>
            <li>
              <strong>Knowledge Base & Documents:</strong> Files, documents, and other materials you
              upload or create within your organization workspace.
            </li>
            <li>
              <strong>Communications:</strong> If you contact us for support or feedback, we collect
              the contents of those communications.
            </li>
          </ul>

          <h3>2.2 Information Collected Through Integrations</h3>
          <p>
            When you connect third-party services to Lira AI, we access and process data from those
            services on your behalf. Specifically:
          </p>
          <ul>
            <li>
              <strong>Linear:</strong> Project issues, tasks, labels, team members, and workflow
              states for your connected Linear workspace.
            </li>
            <li>
              <strong>Slack:</strong> Channel lists, message content in connected channels, and user
              directory information necessary to route AI-generated summaries and action items.
            </li>
            <li>
              <strong>Microsoft Teams:</strong> Channel lists, conversation threads, and user
              profiles within your connected Teams tenant, used for delivering meeting insights and
              action items.
            </li>
            <li>
              <strong>Google Calendar & Google Drive:</strong> Calendar event details (title,
              attendees, time, description), and document metadata and content from Google Drive
              files you explicitly share with the Service.
            </li>
            <li>
              <strong>GitHub:</strong> Repository metadata, issues, pull requests, and contributor
              information for repositories you authorize Lira AI to access.
            </li>
            <li>
              <strong>Greenhouse:</strong> Job postings, candidate profiles, interview schedules,
              scorecards, and hiring pipeline data for your connected Greenhouse account.
            </li>
            <li>
              <strong>HubSpot:</strong> CRM contacts, companies, deals, tickets, and engagement data
              from your connected HubSpot portal.
            </li>
            <li>
              <strong>Salesforce:</strong> Contacts, accounts, opportunities, leads, and user
              profiles from your connected Salesforce organization.
            </li>
          </ul>
          <p>
            We only access data that is necessary to provide the features you have enabled. You can
            disconnect any integration at any time from your organization's integrations settings,
            which will immediately revoke our access to that service.
          </p>

          <h3>2.3 Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Usage Data:</strong> Pages visited, features used, timestamps, session
              duration, and interaction patterns within the Service.
            </li>
            <li>
              <strong>Device & Browser Data:</strong> IP address, browser type and version,
              operating system, device type, screen resolution, and language preferences.
            </li>
            <li>
              <strong>Cookies & Similar Technologies:</strong> We use essential cookies for
              authentication and session management, and optional analytics cookies to understand
              how the Service is used. See our{' '}
              <Link to="/cookies" className="text-indigo-600 hover:text-indigo-500">
                Cookie Policy
              </Link>{' '}
              for details.
            </li>
          </ul>

          {/* 3 */}
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>
              <strong>Provide and operate the Service:</strong> Process meeting recordings, generate
              transcripts and AI-powered summaries, manage your organization workspace, and deliver
              integration features.
            </li>
            <li>
              <strong>Authenticate and secure your account:</strong> Verify your identity, manage
              sessions, prevent fraud, and protect against unauthorized access.
            </li>
            <li>
              <strong>Improve and develop the Service:</strong> Analyze usage patterns to identify
              bugs, improve performance, and develop new features.
            </li>
            <li>
              <strong>Communicate with you:</strong> Send transactional emails (account
              verification, password resets), service updates, and respond to support requests.
            </li>
            <li>
              <strong>Ensure legal compliance:</strong> Comply with applicable laws, regulations,
              and legal processes.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal information to third parties. We do{' '}
            <strong>not</strong> use your meeting recordings, transcripts, or organizational data to
            train general-purpose AI models.
          </p>

          {/* 4 */}
          <h2>4. How We Share Your Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>
              <strong>With your organization members:</strong> Data within an organization workspace
              is accessible to other members of that organization based on their role and
              permissions.
            </li>
            <li>
              <strong>With third-party service providers:</strong> We use trusted service providers
              for hosting (cloud infrastructure), email delivery, error monitoring, and analytics.
              These providers process data on our behalf under strict contractual obligations.
            </li>
            <li>
              <strong>With connected integrations:</strong> When you authorize an integration, data
              flows between the Service and the connected third-party platform as necessary to
              provide the integrated functionality.
            </li>
            <li>
              <strong>For legal reasons:</strong> We may disclose information if required by law,
              subpoena, or court order, or if we believe disclosure is necessary to protect our
              rights, your safety, or the safety of others.
            </li>
            <li>
              <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of
              assets, your information may be transferred as part of that transaction. We will
              notify you via email or prominent notice on the Service before your information
              becomes subject to a different privacy policy.
            </li>
          </ul>

          {/* 5 */}
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed
            to provide the Service. Specifically:
          </p>
          <ul>
            <li>
              <strong>Account data:</strong> Retained until you delete your account. Upon account
              deletion, we will delete or anonymize your personal data within 30 days, except where
              we are required by law to retain it.
            </li>
            <li>
              <strong>Meeting recordings and transcripts:</strong> Retained according to your
              organization's configured retention policy. You can delete individual recordings at
              any time.
            </li>
            <li>
              <strong>Integration data:</strong> Cached integration data is refreshed on each
              request and removed when you disconnect the integration.
            </li>
            <li>
              <strong>Usage and analytics data:</strong> Retained in aggregated, anonymized form for
              up to 24 months for product improvement purposes.
            </li>
          </ul>

          {/* 6 */}
          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard technical and organizational measures to protect your
            data, including:
          </p>
          <ul>
            <li>Encryption of data in transit using TLS 1.2 or higher.</li>
            <li>Encryption of sensitive data at rest using AES-256.</li>
            <li>Salted cryptographic hashing for all stored passwords (bcrypt).</li>
            <li>
              OAuth 2.0 with PKCE for all third-party integration authentication flows — we never
              store your third-party passwords.
            </li>
            <li>
              Role-based access controls within organizations, ensuring team members only see data
              appropriate to their role.
            </li>
            <li>Regular security assessments and dependency vulnerability scanning.</li>
            <li>
              Infrastructure hosted on secure, SOC 2-compliant cloud providers with automated
              backups and disaster recovery.
            </li>
          </ul>
          <p>
            While we strive to protect your data, no method of electronic transmission or storage is
            100% secure. If you become aware of any security incident, please contact us immediately
            at <a href="mailto:security@creovine.com">security@creovine.com</a>.
          </p>

          {/* 7 */}
          <h2>7. Your Rights and Choices</h2>
          <p>
            Depending on your jurisdiction, you may have the following rights regarding your
            personal data:
          </p>

          <h3>7.1 For All Users</h3>
          <ul>
            <li>
              <strong>Access:</strong> Request a copy of the personal data we hold about you.
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate or incomplete data.
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your account and associated data.
            </li>
            <li>
              <strong>Data Portability:</strong> Request your data in a structured, machine-readable
              format.
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Where processing is based on consent, withdraw
              consent at any time without affecting the lawfulness of prior processing.
            </li>
            <li>
              <strong>Integration Management:</strong> Connect or disconnect any third-party
              integration at any time from your organization settings.
            </li>
          </ul>

          <h3>7.2 European Economic Area (EEA) & UK Residents — GDPR</h3>
          <p>
            If you are in the EEA or UK, the General Data Protection Regulation (GDPR) provides
            additional rights including the right to restrict processing and the right to object to
            processing. Our legal bases for processing include: performance of a contract (providing
            the Service), legitimate interests (improving the Service, security), and consent (where
            explicitly obtained, such as for optional analytics cookies).
          </p>
          <p>
            You may also lodge a complaint with your local data protection authority if you believe
            your rights have been violated.
          </p>

          <h3>7.3 California Residents — CCPA / CPRA</h3>
          <p>
            California residents have the right to know what personal information is collected, to
            request deletion of personal information, and to opt out of the "sale" or "sharing" of
            personal information. We do <strong>not</strong> sell or share your personal information
            as defined under the California Consumer Privacy Act (CCPA) or the California Privacy
            Rights Act (CPRA).
          </p>

          <p>
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@creovine.com">privacy@creovine.com</a>. We will respond within
            30 days (or as required by applicable law).
          </p>

          {/* 8 */}
          <h2>8. International Data Transfers</h2>
          <p>
            Your data may be processed and stored in the United States or other countries where our
            service providers operate. When we transfer data outside your jurisdiction, we ensure
            appropriate safeguards are in place, including Standard Contractual Clauses (SCCs)
            approved by the European Commission where applicable.
          </p>

          {/* 9 */}
          <h2>9. Children's Privacy</h2>
          <p>
            The Service is not directed to individuals under the age of 16. We do not knowingly
            collect personal information from children. If you become aware that a child has
            provided us with personal information, please contact us at{' '}
            <a href="mailto:privacy@creovine.com">privacy@creovine.com</a> and we will promptly
            delete such information.
          </p>

          {/* 10 */}
          <h2>10. Third-Party Links and Services</h2>
          <p>
            The Service may contain links to third-party websites or services (including the
            integration platforms listed above). We are not responsible for the privacy practices of
            those third parties. We encourage you to read the privacy policies of any third-party
            service you connect to Lira AI.
          </p>

          {/* 11 */}
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices
            or applicable law. When we make material changes, we will notify you by email or by
            posting a prominent notice on the Service at least 30 days before the changes take
            effect. Your continued use of the Service after the effective date constitutes
            acceptance of the updated Privacy Policy.
          </p>

          {/* 12 */}
          <h2>12. Contact Us</h2>
          <p>
            If you have questions, concerns, or requests regarding this Privacy Policy or our data
            practices, please contact us:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:privacy@creovine.com">privacy@creovine.com</a>
            </li>
            <li>
              <strong>Security Issues:</strong>{' '}
              <a href="mailto:security@creovine.com">security@creovine.com</a>
            </li>
            <li>
              <strong>Mailing Address:</strong> Creovine Inc., Attn: Privacy Team
            </li>
          </ul>

          {/* Related links */}
          <div className="not-prose mt-12 flex flex-wrap gap-4 border-t border-gray-200 pt-8">
            <Link
              to="/terms"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cookie Policy
            </Link>
            <Link
              to="/acceptable-use"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Acceptable Use Policy
            </Link>
            <Link
              to="/security"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Security
            </Link>
          </div>
        </article>
      </div>
    </MarketingLayout>
  )
}
