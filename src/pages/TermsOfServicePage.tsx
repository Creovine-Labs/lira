import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'March 25, 2026'

export function TermsOfServicePage() {
  return (
    <MarketingLayout>
      <SEO
        title="Terms of Service"
        description="Read the Lira AI Terms of Service. Understand your rights and obligations when using our AI meeting participant, sales coaching, interview, and customer support platform."
        keywords="Lira AI terms of service, terms and conditions, user agreement"
        path="/terms"
      />
      <div className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-base text-gray-500">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mx-auto max-w-4xl px-6 pb-24">
          {/* 1 */}
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement
            between you ("<strong>you</strong>" or "<strong>User</strong>") and Creovine Inc. ("
            <strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>", or "
            <strong>our</strong>"), governing your access to and use of the Lira AI platform,
            available at <strong>liraintelligence.com</strong>, and all related services, features,
            content, and applications (collectively, the "<strong>Service</strong>").
          </p>
          <p>
            By creating an account, accessing, or using the Service, you confirm that you have read,
            understood, and agree to be bound by these Terms, our{' '}
            <Link to="/privacy">Privacy Policy</Link>, our{' '}
            <Link to="/acceptable-use">Acceptable Use Policy</Link>, and our{' '}
            <Link to="/cookies">Cookie Policy</Link> (collectively, the "<strong>Agreement</strong>
            "). If you do not agree to any part of this Agreement, you must not use the Service.
          </p>
          <p>
            If you are using the Service on behalf of a company, organization, or other entity, you
            represent and warrant that you are authorized to bind that entity to these Terms, and "
            <strong>you</strong>" refers to both you individually and the entity.
          </p>

          {/* 2 */}
          <h2>2. Description of the Service</h2>
          <p>Lira AI is an AI-powered productivity and collaboration platform that provides:</p>
          <ul>
            <li>
              <strong>AI Meeting Assistant:</strong> Real-time meeting transcription, AI-generated
              summaries, action item extraction, and conversation intelligence.
            </li>
            <li>
              <strong>Organization Workspace:</strong> Shared workspace for teams including
              knowledge base management, document storage, task management, member management, email
              integration, and webhook configuration.
            </li>
            <li>
              <strong>AI-Powered Sales Tools:</strong> Real-time sales coaching, objection handling,
              competitive intelligence, and deal analysis during sales calls.
            </li>
            <li>
              <strong>AI Interview Platform:</strong> Structured interview management with role
              configuration, AI-assisted interview scoring, candidate evaluation, and hiring
              pipeline management.
            </li>
            <li>
              <strong>AI Customer Support:</strong> Intelligent customer support conversation
              analysis, sentiment tracking, and resolution assistance.
            </li>
            <li>
              <strong>Third-Party Integrations:</strong> Native connections with Linear, Slack,
              Microsoft Teams, Google Calendar, Google Drive, GitHub, Greenhouse, HubSpot, and
              Salesforce to synchronize data and extend functionality across your existing tools.
            </li>
          </ul>

          {/* 3 */}
          <h2>3. Account Registration and Security</h2>
          <h3>3.1 Eligibility</h3>
          <p>
            You must be at least 16 years of age to use the Service. By registering, you represent
            and warrant that you meet this age requirement and that all registration information you
            provide is truthful, accurate, and complete.
          </p>
          <h3>3.2 Account Credentials</h3>
          <p>
            You may create an account using your email address and a password, or by authenticating
            through Google OAuth. You are solely responsible for maintaining the confidentiality of
            your account credentials and for all activities that occur under your account.
          </p>
          <h3>3.3 Account Security</h3>
          <p>
            You agree to notify us immediately at{' '}
            <a href="mailto:security@creovine.com">security@creovine.com</a> if you become aware of
            any unauthorized use of your account or any other breach of security. We are not liable
            for any loss or damage arising from unauthorized use of your account.
          </p>

          {/* 4 */}
          <h2>4. Organizations and Teams</h2>
          <p>
            Users can create or join organizations within the Service. The organization
            administrator ("<strong>Admin</strong>") has control over the organization's settings,
            members, integrations, and data. By joining an organization, you acknowledge that:
          </p>
          <ul>
            <li>
              The organization Admin may access and manage data within the organization workspace,
              including meeting recordings, transcripts, tasks, and documents.
            </li>
            <li>
              The Admin may connect or disconnect third-party integrations that process data on
              behalf of all organization members.
            </li>
            <li>
              The Admin may remove you from the organization, which may result in loss of access to
              organization data.
            </li>
          </ul>

          {/* 5 */}
          <h2>5. Third-Party Integrations</h2>
          <h3>5.1 Authorization</h3>
          <p>
            The Service allows you to connect third-party platforms including Linear, Slack,
            Microsoft Teams, Google (Calendar & Drive), GitHub, Greenhouse, HubSpot, and Salesforce.
            When you authorize an integration, you grant us permission to access data from that
            third-party service as described in our <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <h3>5.2 Third-Party Terms</h3>
          <p>
            Your use of each third-party integration is also subject to that service's own terms of
            service and privacy policy. We do not control and are not responsible for the practices
            of third-party platforms. It is your responsibility to review and comply with the terms
            of each platform you connect.
          </p>
          <h3>5.3 OAuth and Credentials</h3>
          <p>
            All integrations use OAuth 2.0 authentication. We never store your passwords for
            third-party services. We store encrypted OAuth tokens that can be revoked at any time by
            disconnecting the integration from your organization settings.
          </p>
          <h3>5.4 Data Handling</h3>
          <p>
            Data retrieved from third-party integrations is processed in accordance with our{' '}
            <Link to="/privacy">Privacy Policy</Link>. Integration data is cached temporarily to
            provide the Service and is not retained beyond what is necessary for the features you
            have enabled.
          </p>

          {/* 6 */}
          <h2>6. User Content and Data</h2>
          <h3>6.1 Your Content</h3>
          <p>
            You retain all ownership rights in content you submit, upload, or create through the
            Service ("<strong>User Content</strong>"), including meeting recordings, transcripts,
            documents, knowledge base entries, and task data.
          </p>
          <h3>6.2 License to Us</h3>
          <p>
            By submitting User Content, you grant Creovine a worldwide, non-exclusive, royalty-free
            license to use, process, store, and display your User Content solely to the extent
            necessary to provide, maintain, and improve the Service. This license terminates when
            you delete your User Content or your account.
          </p>
          <h3>6.3 AI Processing</h3>
          <p>
            The Service uses artificial intelligence and machine learning technologies to process
            your meeting recordings, generate transcripts, produce summaries, extract action items,
            and provide real-time coaching. By using these features, you consent to this AI
            processing. We do <strong>not</strong> use your User Content to train general-purpose AI
            models available to other customers.
          </p>
          <h3>6.4 Responsibility for Content</h3>
          <p>
            You are solely responsible for your User Content and for ensuring that you have the
            necessary rights and consents to submit such content to the Service. You represent that
            your User Content does not violate any applicable law, infringe any third-party rights,
            or violate our <Link to="/acceptable-use">Acceptable Use Policy</Link>.
          </p>

          {/* 7 */}
          <h2>7. Acceptable Use</h2>
          <p>
            Your use of the Service is subject to our{' '}
            <Link to="/acceptable-use">Acceptable Use Policy</Link>, which is incorporated into
            these Terms by reference. Violations of the Acceptable Use Policy may result in
            suspension or termination of your account.
          </p>

          {/* 8 */}
          <h2>8. Fees and Payment</h2>
          <h3>8.1 Free and Paid Plans</h3>
          <p>
            Certain features of the Service are available at no charge. Premium features may require
            a paid subscription. Pricing, plan details, and billing terms will be presented to you
            before you subscribe to any paid plan.
          </p>
          <h3>8.2 Billing</h3>
          <p>
            Paid subscriptions are billed in advance on a monthly or annual basis. You authorize us
            to charge the payment method you provide for all applicable fees. All fees are
            non-refundable except as required by applicable law or as expressly stated in a specific
            plan offering.
          </p>
          <h3>8.3 Changes to Pricing</h3>
          <p>
            We reserve the right to change our pricing at any time. If we change the pricing for
            your current plan, we will provide you with at least 30 days' notice before the change
            takes effect. Your continued use after the price change constitutes acceptance.
          </p>

          {/* 9 */}
          <h2>9. Intellectual Property</h2>
          <h3>9.1 Our Property</h3>
          <p>
            The Service, including its design, code, features, branding, logos, documentation, and
            all AI models, is the exclusive property of Creovine Inc. and is protected by copyright,
            trademark, and other intellectual property laws. Nothing in these Terms grants you any
            right, title, or interest in the Service except for the limited right to use it as
            described herein.
          </p>
          <h3>9.2 Feedback</h3>
          <p>
            If you provide us with suggestions, ideas, or feedback about the Service ("
            <strong>Feedback</strong>"), you grant us a perpetual, irrevocable, worldwide,
            royalty-free license to use, modify, and incorporate such Feedback into the Service
            without any obligation to you.
          </p>

          {/* 10 */}
          <h2>10. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, WE
            DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
          </p>
          <p>Without limiting the foregoing:</p>
          <ul>
            <li>
              AI-generated content (transcripts, summaries, action items, coaching suggestions) is
              provided for informational purposes only and may contain errors. You should not rely
              solely on AI outputs for critical business decisions.
            </li>
            <li>
              We do not guarantee that the Service will be uninterrupted, error-free, or free of
              harmful components.
            </li>
            <li>
              We are not responsible for the accuracy, reliability, or availability of third-party
              integrations.
            </li>
          </ul>

          {/* 11 */}
          <h2>11. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CREOVINE, ITS
            OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
            LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
          </p>
          <ul>
            <li>Your use of or inability to use the Service;</li>
            <li>Any unauthorized access to or alteration of your data;</li>
            <li>Any conduct or content of any third party on the Service;</li>
            <li>Any content obtained from the Service, including AI-generated outputs; or</li>
            <li>Any interruption, suspension, or termination of the Service.</li>
          </ul>
          <p>
            OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS
            OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO US IN THE
            TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED U.S. DOLLARS (US$100).
          </p>

          {/* 12 */}
          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Creovine and its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and
            expenses (including reasonable attorneys' fees) arising out of or in any way connected
            with: (a) your access to or use of the Service; (b) your User Content; (c) your
            violation of these Terms; or (d) your violation of any third-party rights.
          </p>

          {/* 13 */}
          <h2>13. Suspension and Termination</h2>
          <h3>13.1 By You</h3>
          <p>
            You may terminate your account at any time by contacting us at{' '}
            <a href="mailto:support@creovine.com">support@creovine.com</a> or through the account
            settings. Upon termination, your right to use the Service will cease immediately.
          </p>
          <h3>13.2 By Us</h3>
          <p>
            We may suspend or terminate your account and access to the Service at our sole
            discretion, with or without notice, for conduct that we determine violates these Terms,
            our Acceptable Use Policy, or is harmful to other users, us, or third parties.
          </p>
          <h3>13.3 Effect of Termination</h3>
          <p>
            Upon termination, all licenses granted to you under these Terms will immediately cease.
            We will retain or delete your data in accordance with our{' '}
            <Link to="/privacy">Privacy Policy</Link>. Sections 6.2 (License to Us), 9 (Intellectual
            Property), 10 (Disclaimers), 11 (Limitation of Liability), 12 (Indemnification), and 15
            (Governing Law) shall survive termination.
          </p>

          {/* 14 */}
          <h2>14. Changes to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. When we make material changes,
            we will update the "Last updated" date at the top of this page and notify you by email
            or prominent notice within the Service at least 30 days before the changes take effect.
            Your continued use of the Service after the effective date of any modification
            constitutes acceptance of the revised Terms.
          </p>

          {/* 15 */}
          <h2>15. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State
            of Delaware, United States, without regard to its conflict of law provisions.
          </p>
          <p>
            Any dispute arising out of or relating to these Terms or the Service shall first be
            resolved through good-faith negotiation. If the dispute cannot be resolved within 30
            days of written notice, either party may submit the dispute to binding arbitration under
            the rules of the American Arbitration Association (AAA). The arbitration shall be
            conducted in English.
          </p>
          <p>
            You agree that any arbitration shall be conducted on an individual basis and not as a
            class action. You waive any right to participate in a class action lawsuit or class-wide
            arbitration against Creovine.
          </p>

          {/* 16 */}
          <h2>16. General Provisions</h2>
          <ul>
            <li>
              <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy,
              Cookie Policy, and Acceptable Use Policy, constitute the entire agreement between you
              and Creovine regarding the Service.
            </li>
            <li>
              <strong>Severability:</strong> If any provision of these Terms is found to be
              unenforceable, the remaining provisions shall continue in full force and effect.
            </li>
            <li>
              <strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms
              shall not constitute a waiver of that right or provision.
            </li>
            <li>
              <strong>Assignment:</strong> You may not assign your rights under these Terms without
              our prior written consent. We may assign our rights without restriction.
            </li>
            <li>
              <strong>Force Majeure:</strong> We shall not be liable for any delay or failure to
              perform resulting from causes beyond our reasonable control, including natural
              disasters, acts of government, or service provider outages.
            </li>
          </ul>

          {/* 17 */}
          <h2>17. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:legal@creovine.com">legal@creovine.com</a>
            </li>
            <li>
              <strong>Support:</strong>{' '}
              <a href="mailto:support@creovine.com">support@creovine.com</a>
            </li>
            <li>
              <strong>Mailing Address:</strong> Creovine Inc., Attn: Legal Team
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
