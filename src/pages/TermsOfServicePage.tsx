import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'June 3, 2026'

export function TermsOfServicePage() {
  return (
    <MarketingLayout>
      <SEO
        title="Terms of Service"
        description="Read the Lira Terms of Service. Understand your rights and obligations when using Lira, the AI customer-support agent by Creovine Ltd — website widget, knowledge base, lead capture, and human handoff."
        keywords="Lira terms of service, Creovine Ltd terms, AI customer support terms and conditions, user agreement"
        path="/terms"
      />
      <div className="legal-page">
        {/* Hero */}
        <section className="legal-hero">
          <h1>Terms of Service</h1>
          <p>Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="legal-article">
          {/* 1 */}
          <h2>1. Acceptance of Terms</h2>
          <p>
            These Terms of Service ("<strong>Terms</strong>") constitute a legally binding agreement
            between you ("<strong>you</strong>" or "<strong>Customer</strong>") and Creovine Ltd ("
            <strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>", or "
            <strong>our</strong>"), governing your access to and use of <strong>Lira</strong>, our
            AI customer-support agent available at <strong>liraintelligence.com</strong>, together
            with its widget, dashboard, APIs, and related services (collectively, the "
            <strong>Service</strong>").
          </p>
          <p>
            By creating an account, accessing, or using the Service, you confirm that you have read,
            understood, and agree to be bound by these Terms, our{' '}
            <Link to="/privacy">Privacy Policy</Link>, our{' '}
            <Link to="/acceptable-use">Acceptable Use Policy</Link>, our{' '}
            <Link to="/refund">Refund Policy</Link>, and our{' '}
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
          <p>
            Lira is an AI customer-support agent that businesses deploy on their websites and
            channels to assist their customers. Depending on your plan, the Service includes:
          </p>
          <ul>
            <li>
              <strong>AI support agent:</strong> a website chat widget that answers customer
              questions 24/7 in multiple languages, grounded in the knowledge base you provide.
            </li>
            <li>
              <strong>Lead capture &amp; qualification:</strong> collecting and qualifying leads
              from conversations and delivering them to your email, CRM, or webhook.
            </li>
            <li>
              <strong>Human handoff &amp; operator tools:</strong> escalation to your team, a shared
              inbox, and a ticketing system for conversations that need a person.
            </li>
            <li>
              <strong>WhatsApp:</strong> handoff to WhatsApp and, on eligible plans, operating the
              agent inside WhatsApp via the WhatsApp Business API.
            </li>
            <li>
              <strong>Analytics:</strong> dashboards showing questions asked, leads captured, and
              resolution metrics.
            </li>
            <li>
              <strong>Integrations:</strong> optional connections to tools such as WhatsApp (Meta),
              HubSpot, Salesforce, Slack, Linear, and webhooks to deliver leads and sync support
              data.
            </li>
          </ul>
          <p>
            Features and usage limits vary by plan. Current plans and inclusions are described on
            our <Link to="/pricing">Pricing</Link> page. We may add, change, or remove features over
            time.
          </p>

          {/* 3 */}
          <h2>3. Account Registration and Security</h2>
          <h3>3.1 Eligibility</h3>
          <p>
            The Service is intended for businesses. You must be at least 16 years of age and able to
            form a binding contract to use it. By registering, you represent that the information
            you provide is truthful, accurate, and complete.
          </p>
          <h3>3.2 Account Credentials</h3>
          <p>
            You may create an account using your email address and a password, or by authenticating
            through a supported single sign-on provider. You are responsible for maintaining the
            confidentiality of your account credentials and for all activity under your account.
          </p>
          <h3>3.3 Account Security</h3>
          <p>
            Notify us immediately at{' '}
            <a href="mailto:security@liraintelligence.com">security@liraintelligence.com</a> if you
            become aware of any unauthorized use of your account or any other breach of security. We
            are not liable for loss arising from unauthorized use of your account caused by your
            failure to keep your credentials secure.
          </p>

          {/* 4 */}
          <h2>4. Workspaces and Team Members</h2>
          <p>
            You may create or join a workspace (organization) within the Service. The workspace
            administrator ("<strong>Admin</strong>") controls the workspace's settings, members,
            integrations, and data. By joining a workspace, you acknowledge that:
          </p>
          <ul>
            <li>
              The Admin and authorized members may access and manage data within the workspace —
              including customer conversations, tickets, customer profiles, knowledge-base content,
              and analytics.
            </li>
            <li>
              The Admin may connect or disconnect integrations that process data on behalf of the
              workspace.
            </li>
            <li>
              The Admin may add or remove members and assign roles, which may change or remove your
              access to workspace data.
            </li>
          </ul>

          {/* 5 */}
          <h2>5. Your Responsibilities as a Customer</h2>
          <p>
            Because Lira interacts with <strong>your</strong> customers and end users on your
            behalf, you are responsible for:
          </p>
          <ul>
            <li>
              Providing your end users with any notices and obtaining any consents required by law
              for the collection and processing of their data through the Service;
            </li>
            <li>
              Ensuring you have the rights to upload your knowledge-base content and to deploy the
              Service on the websites and channels where you use it;
            </li>
            <li>
              Configuring the Service (including data retention, escalation, and integrations)
              appropriately for your use case;
            </li>
            <li>
              Reviewing and supervising the agent's behaviour and any automated actions you enable.
            </li>
          </ul>
          <p>
            For personal data that the Service processes on your behalf, you are the data controller
            and we act as your processor under our <Link to="/privacy">Privacy Policy</Link> and
            Data Processing Agreement.
          </p>

          {/* 6 */}
          <h2>6. Third-Party Integrations</h2>
          <h3>6.1 Authorization</h3>
          <p>
            The Service lets you connect third-party platforms such as WhatsApp (Meta), HubSpot,
            Salesforce, Slack, Linear, and webhook endpoints. When you authorize an integration, you
            grant us permission to access and exchange data with that service as needed to provide
            the features you enable, as described in our <Link to="/privacy">Privacy Policy</Link>.
          </p>
          <h3>6.2 Third-Party Terms</h3>
          <p>
            Your use of each integration is also subject to that provider's own terms and privacy
            policy. We do not control and are not responsible for third-party platforms — including
            any fees they charge. The <strong>WhatsApp Business API</strong>, for example, carries
            per-conversation charges set by Meta that are billed in addition to your plan. It is
            your responsibility to review and comply with the terms of each platform you connect.
          </p>
          <h3>6.3 Credentials</h3>
          <p>
            Integrations use industry-standard authentication. We store encrypted access tokens that
            you can revoke at any time by disconnecting the integration from your workspace
            settings.
          </p>

          {/* 7 */}
          <h2>7. Customer Content and Data</h2>
          <h3>7.1 Your Content</h3>
          <p>
            You retain all ownership rights in the content you submit, upload, or generate through
            the Service ("<strong>Customer Content</strong>") — including knowledge-base materials,
            conversation transcripts, captured leads, and customer records.
          </p>
          <h3>7.2 License to Us</h3>
          <p>
            You grant Creovine a worldwide, non-exclusive, royalty-free license to host, process,
            store, transmit, and display your Customer Content solely to provide, secure, maintain,
            and support the Service. This license ends when you delete the relevant Customer Content
            or your account, subject to legal retention requirements.
          </p>
          <h3>7.3 AI Processing</h3>
          <p>
            The Service uses artificial intelligence, including third-party large language models,
            to generate responses grounded in your knowledge base, understand and route
            conversations, capture and qualify leads, and produce analytics. By using these features
            you consent to this processing. We do <strong>not</strong> use your Customer Content or
            your end users' conversation data to train general-purpose AI models, and our AI
            providers are contractually prohibited from doing so. See our{' '}
            <Link to="/privacy">Privacy Policy</Link> for details.
          </p>
          <h3>7.4 Responsibility for Content</h3>
          <p>
            You are solely responsible for your Customer Content and for ensuring you have the
            necessary rights and consents to submit it. You represent that your Customer Content
            does not violate any law, infringe any third-party rights, or violate our{' '}
            <Link to="/acceptable-use">Acceptable Use Policy</Link>.
          </p>

          {/* 8 */}
          <h2>8. Acceptable Use</h2>
          <p>
            Your use of the Service is subject to our{' '}
            <Link to="/acceptable-use">Acceptable Use Policy</Link>, which is incorporated into
            these Terms by reference. Violations may result in suspension or termination of your
            account.
          </p>

          {/* 9 */}
          <h2>9. Plans, Fees, and Payment</h2>
          <h3>9.1 Free Trial and Paid Plans</h3>
          <p>
            New accounts may start with a free trial. After the trial, continued use requires a paid
            subscription. Plan features, usage limits, and prices are presented on our{' '}
            <Link to="/pricing">Pricing</Link> page and at checkout before you subscribe.
          </p>
          <h3>9.2 Billing &amp; Merchant of Record</h3>
          <p>
            Subscriptions are billed in advance on a monthly or annual basis and renew automatically
            until cancelled. Payments are processed by <strong>Paddle.com</strong>, our authorized
            reseller and Merchant of Record; your purchase is also subject to Paddle's terms.
            Refunds and cancellations are governed by our <Link to="/refund">Refund Policy</Link>.
            Third-party usage fees (such as WhatsApp Business API charges) are billed in addition to
            your plan.
          </p>
          <h3>9.3 Changes to Pricing</h3>
          <p>
            We may change our pricing. If we change the price of your current plan, we will give you
            at least 30 days' notice before the change takes effect on your next billing cycle. Your
            continued use after the change constitutes acceptance.
          </p>

          {/* 10 */}
          <h2>10. Intellectual Property</h2>
          <h3>10.1 Our Property</h3>
          <p>
            The Service — including its design, code, features, branding, logos, documentation, and
            AI systems — is the exclusive property of Creovine Ltd and is protected by copyright,
            trademark, and other intellectual property laws. Except for the limited right to use the
            Service as described in these Terms, nothing grants you any right, title, or interest in
            the Service.
          </p>
          <h3>10.2 Feedback</h3>
          <p>
            If you provide suggestions or feedback about the Service ("<strong>Feedback</strong>"),
            you grant us a perpetual, irrevocable, worldwide, royalty-free license to use and
            incorporate that Feedback into the Service without obligation to you.
          </p>

          {/* 11 */}
          <h2>11. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
            WHETHER EXPRESS, IMPLIED, OR STATUTORY. TO THE FULLEST EXTENT PERMITTED BY LAW, WE
            DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
          </p>
          <p>Without limiting the foregoing:</p>
          <ul>
            <li>
              AI-generated responses may be inaccurate or incomplete. The Service is a support
              assistant, and you should not rely on its outputs as professional, legal, financial,
              or other specialized advice. You are responsible for supervising the agent and the
              automated actions you enable.
            </li>
            <li>
              We do not guarantee that the Service will be uninterrupted, error-free, or free of
              harmful components.
            </li>
            <li>
              We are not responsible for the accuracy, reliability, availability, or fees of
              third-party integrations.
            </li>
          </ul>

          {/* 12 */}
          <h2>12. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL CREOVINE, ITS
            OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS,
            DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
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

          {/* 13 */}
          <h2>13. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless Creovine and its officers, directors,
            employees, and agents from and against any claims, liabilities, damages, losses, and
            expenses (including reasonable legal fees) arising out of or connected with: (a) your
            access to or use of the Service; (b) your Customer Content; (c) your interactions with
            your own end users through the Service; (d) your violation of these Terms; or (e) your
            violation of any third-party rights.
          </p>

          {/* 14 */}
          <h2>14. Suspension and Termination</h2>
          <h3>14.1 By You</h3>
          <p>
            You may cancel your subscription or terminate your account at any time through your
            workspace settings or by contacting{' '}
            <a href="mailto:support@liraintelligence.com">support@liraintelligence.com</a>.
            Cancellation takes effect as described in our <Link to="/refund">Refund Policy</Link>.
          </p>
          <h3>14.2 By Us</h3>
          <p>
            We may suspend or terminate your account and access to the Service, with or without
            notice, for conduct that we reasonably determine violates these Terms or our Acceptable
            Use Policy, or that is harmful to other users, us, or third parties.
          </p>
          <h3>14.3 Effect of Termination</h3>
          <p>
            Upon termination, all licenses granted to you under these Terms cease. We will retain or
            delete your data in accordance with our <Link to="/privacy">Privacy Policy</Link>.
            Sections 7.2 (License to Us), 10 (Intellectual Property), 11 (Disclaimers), 12
            (Limitation of Liability), 13 (Indemnification), and 16 (Governing Law) survive
            termination.
          </p>

          {/* 15 */}
          <h2>15. Changes to These Terms</h2>
          <p>
            We may modify these Terms from time to time. When we make material changes, we will
            update the "Last updated" date and notify you by email or in-Service notice at least 30
            days before the changes take effect. Your continued use after the effective date
            constitutes acceptance of the revised Terms.
          </p>

          {/* 16 */}
          <h2>16. Governing Law and Dispute Resolution</h2>
          <p>
            These Terms are governed by and construed in accordance with the laws of the{' '}
            <strong>Republic of Rwanda</strong>, without regard to conflict-of-law rules. The
            competent courts of <strong>Kigali, Rwanda</strong> shall have exclusive jurisdiction
            over any dispute arising out of or relating to these Terms or the Service, except that
            either party may seek injunctive or other equitable relief in any court of competent
            jurisdiction.
          </p>
          <p>
            Before commencing proceedings, the parties will attempt in good faith to resolve any
            dispute through negotiation. Nothing in these Terms limits any mandatory rights you may
            have under the laws applicable in your own country of residence.
          </p>

          {/* 17 */}
          <h2>17. General Provisions</h2>
          <ul>
            <li>
              <strong>Entire Agreement:</strong> These Terms, together with the Privacy Policy,
              Refund Policy, Cookie Policy, and Acceptable Use Policy, constitute the entire
              agreement between you and Creovine regarding the Service.
            </li>
            <li>
              <strong>Severability:</strong> If any provision is found unenforceable, the remaining
              provisions continue in full force and effect.
            </li>
            <li>
              <strong>Waiver:</strong> Our failure to enforce any right or provision is not a waiver
              of that right or provision.
            </li>
            <li>
              <strong>Assignment:</strong> You may not assign your rights under these Terms without
              our prior written consent. We may assign our rights without restriction.
            </li>
            <li>
              <strong>Force Majeure:</strong> We are not liable for any delay or failure to perform
              caused by events beyond our reasonable control, including natural disasters, acts of
              government, or service-provider outages.
            </li>
          </ul>

          {/* 18 */}
          <h2>18. Contact Us</h2>
          <p>If you have questions about these Terms, please contact us:</p>
          <ul>
            <li>
              <strong>Legal:</strong>{' '}
              <a href="mailto:legal@liraintelligence.com">legal@liraintelligence.com</a>
            </li>
            <li>
              <strong>Support:</strong>{' '}
              <a href="mailto:support@liraintelligence.com">support@liraintelligence.com</a>
            </li>
            <li>
              <strong>Company:</strong> Creovine Ltd
            </li>
            <li>
              <strong>Registered address:</strong> Creovine Ltd, 1 KN 78 St, Kigali, Rwanda
            </li>
          </ul>

          {/* Related links */}
          <div className="legal-link-row">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Refund Policy</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <Link to="/acceptable-use">Acceptable Use Policy</Link>
            <Link to="/security">Security</Link>
          </div>
        </article>
      </div>
    </MarketingLayout>
  )
}
