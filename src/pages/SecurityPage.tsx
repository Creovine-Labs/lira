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
      'We use JWT-based authentication with secure token management. Connected services use scoped OAuth or signed API credentials, and role-based access controls ensure team members only see data appropriate to their role.',
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
      'We follow privacy-by-design principles. We collect only the data necessary to provide the Service. Connected-service data is accessed on-demand and not retained beyond what is required.',
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
      <div className="legal-page">
        {/* Hero */}
        <section className="legal-hero">
          <h1>Security</h1>
          <p className="max-w-2xl">
            Protecting your data is foundational to everything we build. Here's how we keep your
            organization's information safe.
          </p>
          <p>Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Security pillars grid */}
        <section className="mx-auto max-w-5xl px-6 pb-16">
          <div className="grid gap-6 sm:grid-cols-2">
            {SECURITY_PILLARS.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200 bg-white/78 p-6 transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-[0_22px_60px_rgba(2,3,8,0.09)]"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Detailed sections */}
        <article className="legal-article">
          <h2>Connection Security</h2>
          <p>
            Lira connects to the services needed to operate customer support. Each connection uses
            scoped authentication and least-privilege access:
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Connection</th>
                  <th>Auth Method</th>
                  <th>Scopes</th>
                  <th>Data Access</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Google Drive</td>
                  <td>OAuth 2.0</td>
                  <td>Selected Drive files used as knowledge sources</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>WhatsApp Business</td>
                  <td>Meta Cloud API credentials</td>
                  <td>Messages and delivery events for enabled numbers</td>
                  <td>On-demand only</td>
                </tr>
                <tr>
                  <td>API, CLI, and MCP</td>
                  <td>Scoped keys and signed requests</td>
                  <td>Approved support actions only</td>
                  <td>On-demand only</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Stored credentials are encrypted before storage. You can revoke connected access from
            your workspace settings or by rotating the relevant provider credential.
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
          <div className="legal-link-row">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <Link to="/acceptable-use">Acceptable Use Policy</Link>
          </div>
        </article>
      </div>
    </MarketingLayout>
  )
}
