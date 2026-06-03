import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'June 3, 2026'

/**
 * Privacy Policy for Creovine Ltd (the "Lira" platform).
 *
 * Structured to align with GDPR (EU + UK), CCPA/CPRA, and AI-specific
 * transparency expectations: controller-vs-processor scope, AI/sub-processor
 * disclosure, model-training stance, automated-decision + human-review rights,
 * retention, and data-subject rights. Company-specific details marked with
 * [brackets] should be confirmed by Creovine Ltd before publishing.
 */
export function PrivacyPolicyPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Privacy Policy"
        description="How Creovine Ltd (Lira) collects, uses, shares, and protects personal data. Covers our role as controller and processor, AI processing and sub-processors, international transfers, retention, and your rights under GDPR, UK GDPR, and CCPA."
        keywords="Lira privacy policy, Creovine Ltd privacy, AI chatbot data privacy, GDPR, CCPA, data processor, sub-processors, automated decision-making"
        path="/privacy"
      />
      <div className="legal-page">
        {/* Hero */}
        <section className="legal-hero">
          <h1>Privacy Policy</h1>
          <p>Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="legal-article">
          {/* 1 */}
          <h2>1. Introduction</h2>
          <p>
            Creovine Ltd ("<strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>",
            or "<strong>our</strong>") provides <strong>Lira</strong>, an AI customer-support agent
            that businesses embed on their websites and channels to answer customer questions,
            capture and qualify leads, and hand off to human teams. Lira is available at{' '}
            <strong>liraintelligence.com</strong> together with its widget, dashboard, APIs, and
            related services (collectively, the "<strong>Service</strong>").
          </p>
          <p>
            This Privacy Policy explains what personal data we process, why, who we share it with,
            and the rights you have. It applies to our websites, the Lira dashboard, the chat widget
            and integrations, and anyone whose data we process in connection with the Service. By
            using the Service you acknowledge the practices described here. If you do not agree,
            please do not use the Service.
          </p>

          {/* 2 */}
          <h2>2. Our Role: Controller and Processor</h2>
          <p>
            Because of how Lira works, our role under data-protection law depends on the data in
            question:
          </p>
          <ul>
            <li>
              <strong>We are the "controller"</strong> for personal data of our business customers
              and website visitors that we collect for our own purposes — for example, account
              registration, billing, marketing, and operating our website.
            </li>
            <li>
              <strong>We are a "processor"</strong> for the personal data contained in conversations
              and leads that the Service handles on behalf of a business customer (the controller).
              When a visitor chats with Lira on a customer's website, that customer decides why and
              how the data is used; we process it under their instructions and our Data Processing
              Agreement ("<strong>DPA</strong>"). For that data, the business customer's own privacy
              notice governs, and requests should be directed to them — though we will assist as
              required (see Section 11).
            </li>
          </ul>

          {/* 3 */}
          <h2>3. Information We Collect</h2>

          <h3>3.1 Account &amp; business information</h3>
          <p>When you create or manage a Lira account, we collect:</p>
          <ul>
            <li>Identity and contact details — name, work email, company name, and job role;</li>
            <li>Account credentials and authentication data (including via single sign-on);</li>
            <li>Plan, billing, and transaction records (see Section 3.5);</li>
            <li>Support requests, feedback, and communications you send us.</li>
          </ul>

          <h3>3.2 Content you provide</h3>
          <p>
            To configure Lira you may upload or connect a <strong>knowledge base</strong> — help
            articles, FAQs, documents, website content, product information, and similar materials
            ("<strong>Customer Content</strong>"). This may contain personal data if you choose to
            include it. We process Customer Content to power the Service on your behalf.
          </p>

          <h3>3.3 Conversation &amp; lead data</h3>
          <p>
            When the Service interacts with your end users (website visitors, WhatsApp users, etc.),
            it may process:
          </p>
          <ul>
            <li>Messages and chat transcripts, including anything the visitor chooses to type;</li>
            <li>
              Lead and contact details captured during a conversation — such as name, email,
              phone/WhatsApp number, company, and the visitor's stated needs;
            </li>
            <li>
              Conversation metadata — language, detected intent, sentiment, satisfaction (CSAT)
              ratings, timestamps, and the outcome of the conversation;
            </li>
            <li>
              Where applicable, identifiers a customer passes to us to recognise a known user.
            </li>
          </ul>
          <p>
            We process this data as a <strong>processor</strong> on behalf of the business customer
            who deployed Lira (Section 2).
          </p>

          <h3>3.4 Usage, device &amp; log data</h3>
          <p>
            We automatically collect technical information when you use our websites or dashboard,
            including IP address, browser and device type, operating system, pages viewed, referring
            URLs, approximate location derived from IP, and diagnostic logs. This helps us secure,
            maintain, and improve the Service.
          </p>

          <h3>3.5 Payment information</h3>
          <p>
            Payments are processed by <strong>Paddle.com</strong>, our authorised reseller and
            Merchant of Record. Paddle collects and processes your payment details under its own
            privacy policy; we receive limited billing information (such as plan, amount, country,
            and the last four digits / card type) and do not store full card numbers.
          </p>

          <h3>3.6 Cookies &amp; similar technologies</h3>
          <p>
            We and our providers use cookies and similar technologies for authentication,
            preferences, analytics, and (with consent where required) marketing. See our{' '}
            <a href="/cookies">Cookie Policy</a> for details and how to manage them.
          </p>

          {/* 4 */}
          <h2>4. How We Use Personal Data</h2>
          <p>As a controller, we use personal data to:</p>
          <ul>
            <li>Provide, operate, secure, and maintain the Service and your account;</li>
            <li>Generate AI responses and deliver the features you enable (Section 5);</li>
            <li>Process payments, manage subscriptions, and prevent fraud;</li>
            <li>Provide customer support and respond to your requests;</li>
            <li>Send service, security, and (where permitted) marketing communications;</li>
            <li>
              Produce aggregated, de-identified analytics to understand and improve the Service;
            </li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>

          {/* 5 */}
          <h2>5. Artificial Intelligence &amp; Automated Processing</h2>
          <p>
            Lira is an AI system. When you interact with it, you are communicating with an automated
            agent, not a human. To generate responses, the Service uses large-language-model ("
            <strong>LLM</strong>") technology, including models provided by third-party AI vendors
            (for example, <strong>Anthropic</strong> and/or <strong>OpenAI</strong>) and our own
            models. Relevant conversation content and Customer Content may be sent to these
            providers solely to produce a response for that interaction.
          </p>
          <p>
            <strong>Model training.</strong> We do <strong>not</strong> use your Customer Content or
            end-user conversation data to train our own foundation models, and we use AI providers
            under terms that prohibit them from using your data to train their models. We may use
            aggregated and de-identified information that cannot reasonably be linked to an
            individual to monitor and improve quality and safety.
          </p>
          <p>
            <strong>Automated decisions &amp; human review.</strong> Lira answers questions and can
            route, prioritise, or escalate conversations automatically. It is designed to assist —
            not to make decisions that produce legal or similarly significant effects about you
            without human involvement. Where automated processing meaningfully affects you, you have
            the right to request human review (Section 10). We assess our AI for safety and security
            risk before and during use.
          </p>

          {/* 6 */}
          <h2>6. Legal Bases for Processing (EU/UK)</h2>
          <p>
            Where the GDPR or UK GDPR applies and we act as a controller, we rely on the following
            legal bases:
          </p>
          <ul>
            <li>
              <strong>Performance of a contract</strong> — to provide the Service and your account;
            </li>
            <li>
              <strong>Legitimate interests</strong> — to secure, analyse, and improve the Service,
              prevent fraud, and conduct limited B2B marketing, balanced against your rights;
            </li>
            <li>
              <strong>Consent</strong> — for certain cookies and electronic marketing, which you may
              withdraw at any time;
            </li>
            <li>
              <strong>Legal obligation</strong> — to comply with applicable laws, tax, and
              accounting requirements.
            </li>
          </ul>

          {/* 7 */}
          <h2>7. How We Share Personal Data</h2>
          <p>We share personal data only as described here:</p>
          <ul>
            <li>
              <strong>Sub-processors and service providers</strong> who help us run the Service —
              including cloud hosting and infrastructure (e.g., Amazon Web Services), AI/LLM
              providers, communications and email delivery, analytics, and customer-support tooling.
              They act on our instructions under contract.
            </li>
            <li>
              <strong>Payment provider</strong> — Paddle, as Merchant of Record (Section 3.5).
            </li>
            <li>
              <strong>Integrations you enable</strong> — when you connect Lira to a third-party tool
              (e.g., WhatsApp / Meta, a CRM such as HubSpot or Salesforce, Slack, or a webhook), we
              transmit the relevant data to that tool at your direction. Their handling of the data
              is governed by their own terms and privacy policies.
            </li>
            <li>
              <strong>Legal &amp; safety</strong> — where required by law, legal process, or to
              protect the rights, safety, and security of Creovine, our users, or the public.
            </li>
            <li>
              <strong>Business transfers</strong> — in connection with a merger, acquisition,
              financing, or sale of assets, subject to this Policy.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell personal data, and we do not "share" it for
            cross-context behavioural advertising as those terms are defined under US state privacy
            laws. A current list of our sub-processors is available on request at{' '}
            <a href="mailto:privacy@liraintelligence.com">privacy@liraintelligence.com</a>.
          </p>

          {/* 8 */}
          <h2>8. International Data Transfers</h2>
          <p>
            We and our providers may process personal data in countries other than your own,
            including the United States. Where we transfer personal data out of the UK, EEA, or
            other regions with transfer restrictions, we use appropriate safeguards — such as the
            European Commission's Standard Contractual Clauses and the UK International Data
            Transfer Addendum, together with additional measures where needed.
          </p>

          {/* 9 */}
          <h2>9. Data Retention</h2>
          <p>
            We retain personal data only for as long as necessary for the purposes described in this
            Policy, then delete or anonymise it:
          </p>
          <ul>
            <li>
              <strong>Account &amp; billing data</strong> — for the life of your account and a
              limited period afterwards to meet legal, tax, and audit obligations;
            </li>
            <li>
              <strong>Conversation &amp; lead data</strong> — for the retention period configured by
              the business customer (the controller); we delete or return it on termination or valid
              request, subject to legal retention requirements;
            </li>
            <li>
              <strong>Logs &amp; diagnostics</strong> — for a limited period for security and
              troubleshooting.
            </li>
          </ul>

          {/* 10 */}
          <h2>10. Your Rights</h2>
          <p>
            Depending on where you live, you may have some or all of the following rights regarding
            personal data for which we are the controller:
          </p>
          <ul>
            <li>
              <strong>Access</strong> — obtain a copy of the personal data we hold about you;
            </li>
            <li>
              <strong>Rectification</strong> — correct inaccurate or incomplete data;
            </li>
            <li>
              <strong>Erasure</strong> — request deletion of your data ("right to be forgotten");
            </li>
            <li>
              <strong>Restriction &amp; objection</strong> — limit or object to certain processing,
              including direct marketing and processing based on legitimate interests;
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a portable format;
            </li>
            <li>
              <strong>Automated decisions</strong> — request human review of, and contest, decisions
              based solely on automated processing that significantly affect you;
            </li>
            <li>
              <strong>Withdraw consent</strong> — where processing is based on consent;
            </li>
            <li>
              <strong>US state rights (e.g., CCPA/CPRA)</strong> — the right to know, access,
              delete, correct, and opt out of any "sale" or "sharing" of personal information, and
              the right not to be discriminated against for exercising these rights. As noted in
              Section 7, we do not sell or share personal information.
            </li>
          </ul>
          <p>
            To exercise any right, contact{' '}
            <a href="mailto:privacy@liraintelligence.com">privacy@liraintelligence.com</a>. We will
            verify your request and respond within the timeframes required by law. You may use an
            authorised agent where permitted. If we process your data only as a processor on behalf
            of a business customer, we will refer your request to that customer or act on their
            instructions.
          </p>
          <p>
            If you are in the EU or UK and believe we have not handled your data lawfully, you may
            lodge a complaint with your local data-protection supervisory authority (in the UK, the
            Information Commissioner's Office). We would appreciate the chance to address your
            concern first.
          </p>

          {/* 11 */}
          <h2>11. For Website Visitors &amp; End Users</h2>
          <p>
            If you interacted with Lira on another company's website or channel, that company is the
            controller of your conversation data and its privacy notice applies. Please direct
            access or deletion requests to them; we will support them in fulfilling your request.
          </p>

          {/* 12 */}
          <h2>12. Security</h2>
          <p>
            We implement technical and organisational measures appropriate to the risk, including
            encryption in transit, access controls and least-privilege permissions, network
            protections, logging and monitoring, and regular review of our providers. No method of
            transmission or storage is completely secure, but we work continually to protect your
            data and will notify affected parties and regulators of a personal-data breach where
            required by law.
          </p>

          {/* 13 */}
          <h2>13. Children's Privacy</h2>
          <p>
            The Service is intended for businesses and is not directed to children. We do not
            knowingly collect personal data from children under the age of 16 (or the minimum age in
            your jurisdiction). If you believe a child has provided us personal data, contact us and
            we will delete it.
          </p>

          {/* 14 */}
          <h2>14. Third-Party Links</h2>
          <p>
            Our websites and the Service may link to third-party sites and tools we do not control.
            This Policy does not apply to them; please review their privacy policies.
          </p>

          {/* 15 */}
          <h2>15. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be posted on
            this page with a new "Last updated" date and, where appropriate, communicated to account
            holders. Your continued use of the Service after an update constitutes acceptance of the
            revised Policy.
          </p>

          {/* 16 */}
          <h2>16. Contact Us</h2>
          <p>For privacy questions or to exercise your rights, contact our privacy team:</p>
          <ul>
            <li>
              Email: <a href="mailto:privacy@liraintelligence.com">privacy@liraintelligence.com</a>
            </li>
            <li>Controller: Creovine Ltd</li>
            <li>Registered address: [Creovine Ltd registered address]</li>
          </ul>
          <p>
            If we have appointed a Data Protection Officer or an EU/UK representative, their contact
            details will be provided here and on request.
          </p>
        </article>
      </div>
    </MarketingLayout>
  )
}
