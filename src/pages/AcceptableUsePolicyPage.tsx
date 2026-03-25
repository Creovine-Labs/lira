import { Link } from 'react-router-dom'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'March 25, 2026'

export function AcceptableUsePolicyPage() {
  return (
    <MarketingLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Acceptable Use Policy
          </h1>
          <p className="mt-4 text-base text-gray-500">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mx-auto max-w-4xl px-6 pb-24">
          {/* 1 */}
          <h2>1. Overview</h2>
          <p>
            This Acceptable Use Policy ("<strong>AUP</strong>") governs your use of the Lira AI
            platform and all associated services (the "<strong>Service</strong>") provided by
            Creovine Inc. ("<strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>
            "). This AUP is incorporated by reference into our{' '}
            <Link to="/terms">Terms of Service</Link>.
          </p>
          <p>
            All users, including organization administrators and team members, must comply with this
            AUP. Violations may result in suspension or termination of your account.
          </p>

          {/* 2 */}
          <h2>2. Permitted Uses</h2>
          <p>
            The Service is designed to be used for lawful business and productivity purposes,
            including:
          </p>
          <ul>
            <li>
              Recording and transcribing meetings where all participants have been informed and
              consent to recording, as required by applicable law.
            </li>
            <li>Managing organizational knowledge, documents, tasks, and team workflows.</li>
            <li>
              Using AI-powered features for meeting summaries, action item extraction, sales
              coaching, interview management, and customer support analysis.
            </li>
            <li>
              Connecting authorized third-party integrations (Linear, Slack, Microsoft Teams, Google
              Calendar/Drive, GitHub, Greenhouse, HubSpot, Salesforce) to extend workflow
              automation.
            </li>
            <li>Managing hiring pipelines, interview processes, and candidate evaluation.</li>
            <li>Sending and managing organizational email communications.</li>
          </ul>

          {/* 3 */}
          <h2>3. Prohibited Activities</h2>
          <p>
            You agree <strong>not</strong> to use the Service to:
          </p>

          <h3>3.1 Illegal or Harmful Activities</h3>
          <ul>
            <li>
              Violate any applicable local, state, national, or international law or regulation.
            </li>
            <li>
              Record meetings or conversations without the knowledge and consent of all participants
              where required by law (including two-party consent jurisdictions).
            </li>
            <li>
              Engage in, promote, or facilitate fraud, identity theft, phishing, or any other
              deceptive practice.
            </li>
            <li>Harass, threaten, intimidate, or harm any individual or group.</li>
            <li>Distribute malware, viruses, worms, or any other harmful software.</li>
            <li>
              Engage in any activity that could disable, overburden, impair, or compromise the
              Service or its infrastructure.
            </li>
          </ul>

          <h3>3.2 Unauthorized Access</h3>
          <ul>
            <li>
              Access or attempt to access accounts, systems, or data that you are not authorized to
              access.
            </li>
            <li>
              Circumvent, disable, or otherwise interfere with any security features of the Service.
            </li>
            <li>
              Use the Service to probe, scan, or test the vulnerability of any system or network.
            </li>
            <li>
              Share your account credentials with unauthorized individuals or use another user's
              account without permission.
            </li>
            <li>
              Access the Service through automated means (bots, crawlers, scrapers) without our
              prior written consent.
            </li>
          </ul>

          <h3>3.3 Content Restrictions</h3>
          <ul>
            <li>
              Upload, transmit, or store content that infringes upon any intellectual property
              rights of others.
            </li>
            <li>
              Upload content that is defamatory, obscene, pornographic, or that promotes violence,
              discrimination, or hatred based on race, ethnicity, gender, religion, sexual
              orientation, disability, or age.
            </li>
            <li>
              Upload content that contains personal information of individuals without their
              consent, in violation of privacy laws.
            </li>
            <li>Use the Service to distribute unsolicited commercial communications (spam).</li>
          </ul>

          <h3>3.4 Abuse of AI Features</h3>
          <ul>
            <li>
              Use AI-generated outputs (transcripts, summaries, coaching suggestions) as the sole
              basis for making legally consequential decisions about individuals (e.g., hiring,
              termination, legal proceedings) without human review.
            </li>
            <li>
              Deliberately attempt to manipulate, deceive, or extract training data from the AI
              systems.
            </li>
            <li>
              Use the Service's AI features to generate content that impersonates real individuals
              or creates deepfakes.
            </li>
            <li>Use AI features to generate harmful, misleading, or deceptive content.</li>
          </ul>

          <h3>3.5 Integration Misuse</h3>
          <ul>
            <li>Connect third-party integrations using stolen or unauthorized credentials.</li>
            <li>
              Use integrations to exfiltrate data from third-party services beyond what is necessary
              for the Service's intended functionality.
            </li>
            <li>
              Violate the terms of service of any third-party platform connected through our
              integrations.
            </li>
            <li>
              Use integration data for purposes not authorized by the data owner or the third-party
              platform.
            </li>
          </ul>

          <h3>3.6 Service Abuse</h3>
          <ul>
            <li>
              Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source
              code of the Service.
            </li>
            <li>
              Resell, sublicense, or commercially redistribute the Service or any part thereof
              without our written authorization.
            </li>
            <li>Create derivative works based on the Service.</li>
            <li>Remove or alter any proprietary notices, labels, or marks on the Service.</li>
            <li>
              Use the Service in a way that consumes unreasonable resources or degrades performance
              for other users.
            </li>
          </ul>

          {/* 4 */}
          <h2>4. Meeting Recording Compliance</h2>
          <p>
            The Service includes meeting recording and transcription features. You are solely
            responsible for compliance with all applicable recording consent laws. Many
            jurisdictions require the consent of all parties to a conversation before recording.
            Specifically:
          </p>
          <ul>
            <li>
              <strong>One-party consent jurisdictions:</strong> At minimum, one participant in the
              conversation must consent to the recording (you, the user, typically satisfy this).
            </li>
            <li>
              <strong>Two-party / all-party consent jurisdictions:</strong> All participants must be
              informed and consent to the recording before it begins. This includes jurisdictions
              such as California, Illinois, and several EU member states.
            </li>
            <li>
              <strong>International calls:</strong> If your meeting includes participants from
              multiple jurisdictions, you must comply with the most restrictive applicable law.
            </li>
          </ul>
          <p>
            We strongly recommend that you inform all meeting participants that the meeting is being
            recorded and obtain their consent before using any recording or transcription features.
          </p>

          {/* 5 */}
          <h2>5. Enforcement</h2>
          <p>
            Creovine reserves the right to investigate and take appropriate action against any
            violations of this AUP, including:
          </p>
          <ul>
            <li>Issuing a warning to the user or organization.</li>
            <li>Temporarily suspending access to the Service.</li>
            <li>Permanently terminating the user's account or the organization's subscription.</li>
            <li>Removing content that violates this AUP.</li>
            <li>Reporting illegal activities to the appropriate law enforcement authorities.</li>
            <li>Cooperating with law enforcement investigations as required by law.</li>
          </ul>

          {/* 6 */}
          <h2>6. Reporting Violations</h2>
          <p>If you become aware of any violation of this AUP, please report it immediately to:</p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:abuse@creovine.com">abuse@creovine.com</a>
            </li>
          </ul>
          <p>
            We take all reports seriously and will investigate promptly. Reports can be made
            anonymously.
          </p>

          {/* 7 */}
          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this AUP from time to time. When we make material changes, we will notify
            users as described in our <Link to="/terms">Terms of Service</Link>. Continued use of
            the Service after changes take effect constitutes acceptance of the updated AUP.
          </p>

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
