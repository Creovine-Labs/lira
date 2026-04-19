import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import {
  ShieldCheckIcon,
  LockClosedIcon,
  KeyIcon,
  ServerStackIcon,
  EyeIcon,
  BellAlertIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'March 25, 2026'

const SECURITY_PILLARS = [
  {
    icon: LockClosedIcon,
    title: 'Encryption',
    description:
      'All data in transit is encrypted using TLS 1.2 or higher. Sensitive data at rest is encrypted using AES-256 encryption. All stored passwords are protected with bcrypt salted hashing.',
  },
  {
    icon: KeyIcon,
    title: 'Authentication & Access Control',
    description:
      'We use JWT-based authentication with secure token management. All third-party integrations use OAuth 2.0 with PKCE — we never store your passwords for external services. Role-based access controls ensure team members only see data appropriate to their role.',
  },
  {
    icon: ServerStackIcon,
    title: 'Infrastructure Security',
    description:
      'Our infrastructure is hosted on SOC 2-compliant cloud providers with automated backups, network segmentation, and disaster recovery. We employ firewalls, intrusion detection systems, and DDoS mitigation to protect our services.',
  },
  {
    icon: EyeIcon,
    title: 'Data Privacy by Design',
    description:
      'We follow privacy-by-design principles. We collect only the data necessary to provide the Service. Integration data is accessed on-demand and not retained beyond what is required. You can disconnect any integration at any time, immediately revoking our access.',
  },
  {
    icon: ClipboardDocumentCheckIcon,
    title: 'Regular Security Assessments',
    description:
      'We conduct regular security assessments including automated vulnerability scanning of dependencies, code review processes, penetration testing, and security-focused code analysis as part of our CI/CD pipeline.',
  },
  {
    icon: BellAlertIcon,
    title: 'Incident Response',
    description:
      'We maintain a documented incident response plan that includes detection, containment, eradication, recovery, and post-incident review. In the event of a data breach affecting your information, we will notify you and relevant authorities as required by applicable law.',
  },
  {
    icon: UserGroupIcon,
    title: 'Employee Security',
    description:
      'All team members undergo security training. Access to production systems is restricted to authorized personnel using multi-factor authentication and the principle of least privilege. Access is logged and regularly audited.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure Development Practices',
    description:
      'Our development process includes mandatory code reviews, automated testing, static analysis for security vulnerabilities (OWASP Top 10), dependency vulnerability scanning, and staged deployments with rollback capabilities.',
  },
]

export function SecurityPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Security — How Lira Protects Your Data"
        description="Lira AI is built with security at its core. TLS 1.2+ encryption, AES-256 at rest, OAuth 2.0 PKCE, SOC 2-compliant infrastructure, and OWASP Top 10 compliance. Learn how we protect your meetings, interviews, and customer data."
        keywords="Lira AI security, data protection, encryption, SOC 2, OWASP, OAuth 2.0, secure AI platform, data privacy, enterprise security, meeting data security"
        path="/security"
      />
      <div className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Security
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Protecting your data is foundational to everything we build. Here's how we keep your
            organization's information safe.
          </p>
          <p className="mt-2 text-base text-gray-500">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Security pillars grid */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {SECURITY_PILLARS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 transition hover:border-indigo-200 hover:bg-indigo-50/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed sections */}
        <article className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mx-auto max-w-4xl px-6 pb-24">
          <h2>Integration Security</h2>
          <p>
            Lira AI integrates with multiple third-party platforms. Each integration is secured
            using industry-standard OAuth 2.0 authentication flows:
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Integration</th>
                  <th>Auth Method</th>
                  <th>Scopes</th>
                  <th>Data Access</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Linear</td>
                  <td>OAuth 2.0</td>
                  <td>Read issues, teams, projects</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>Slack</td>
                  <td>OAuth 2.0</td>
                  <td>Channels, messages, users</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>Microsoft Teams</td>
                  <td>OAuth 2.0 (MSAL)</td>
                  <td>Channels, messages, user profiles</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>Google Calendar & Drive</td>
                  <td>OAuth 2.0</td>
                  <td>Calendar events, Drive files</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>GitHub</td>
                  <td>OAuth 2.0</td>
                  <td>Repos, issues, PRs</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>Greenhouse</td>
                  <td>OAuth 2.0</td>
                  <td>Jobs, candidates, interviews</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>HubSpot</td>
                  <td>OAuth 2.0</td>
                  <td>CRM contacts, deals, companies</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>Salesforce</td>
                  <td>OAuth 2.0 + PKCE</td>
                  <td>Contacts, accounts, opportunities, leads</td>
                  <td>On-demand only</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            All OAuth tokens are encrypted before storage. Refresh tokens are used to obtain new
            access tokens as needed. You can revoke access to any integration at any time from your
            organization settings, which immediately invalidates stored tokens.
          </p>

          <h2>Data Handling Principles</h2>
          <ul>
            <li>
              <strong>Minimal Data Collection:</strong> We only collect data that is necessary to
              provide the Service. We do not collect data for the purpose of selling it.
            </li>
            <li>
              <strong>Purpose Limitation:</strong> Data is used only for the purposes described in
              our <Link to="/privacy">Privacy Policy</Link>.
            </li>
            <li>
              <strong>Data Isolation:</strong> Each organization's data is logically isolated.
              Members of one organization cannot access another organization's data.
            </li>
            <li>
              <strong>No AI Training on Your Data:</strong> Your meeting recordings, transcripts,
              documents, and organizational data are never used to train general-purpose AI models
              shared with other customers.
            </li>
            <li>
              <strong>Data Portability:</strong> You can request an export of your data at any time
              by contacting us.
            </li>
            <li>
              <strong>Data Deletion:</strong> When you delete data or your account, it is
              permanently removed within 30 days. Backups are purged on their normal rotation
              schedule.
            </li>
          </ul>

          <h2>Compliance</h2>
          <p>
            We are committed to meeting the security and privacy requirements of the jurisdictions
            we serve:
          </p>
          <ul>
            <li>
              <strong>GDPR (EU/EEA):</strong> We provide data processing agreements, support data
              subject rights (access, deletion, portability), and use Standard Contractual Clauses
              for international data transfers.
            </li>
            <li>
              <strong>CCPA / CPRA (California):</strong> We support consumer rights including the
              right to know, delete, and opt-out. We do not sell personal information.
            </li>
            <li>
              <strong>SOC 2:</strong> Our infrastructure providers maintain SOC 2 Type II
              compliance. We are working toward our own SOC 2 certification.
            </li>
          </ul>

          <h2>Vulnerability Disclosure</h2>
          <p>
            We welcome responsible disclosure of security vulnerabilities. If you discover a
            potential security issue, please report it to:
          </p>
          <ul>
            <li>
              <strong>Email:</strong>{' '}
              <a href="mailto:security@creovine.com">security@creovine.com</a>
            </li>
          </ul>
          <p>When reporting, please include:</p>
          <ul>
            <li>A description of the vulnerability and its potential impact.</li>
            <li>Step-by-step instructions to reproduce the issue.</li>
            <li>Any relevant screenshots or logs (with sensitive data redacted).</li>
          </ul>
          <p>
            We commit to acknowledging receipt within 48 hours and providing an initial assessment
            within 5 business days. We ask that you give us reasonable time to address the
            vulnerability before making it public.
          </p>

          <h2>Contact Us</h2>
          <p>For security-related questions or concerns, please contact:</p>
          <ul>
            <li>
              <strong>Security Team:</strong>{' '}
              <a href="mailto:security@creovine.com">security@creovine.com</a>
            </li>
            <li>
              <strong>Privacy Team:</strong>{' '}
              <a href="mailto:privacy@creovine.com">privacy@creovine.com</a>
            </li>
          </ul>

          {/* Related links */}
          <div className="not-prose mt-12 flex flex-wrap gap-4 border-t border-gray-200 pt-8">
            <Link
              to="/privacy"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Privacy Policy
            </Link>
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
          </div>
        </article>
      </div>
    </MarketingLayout>
  )
}
