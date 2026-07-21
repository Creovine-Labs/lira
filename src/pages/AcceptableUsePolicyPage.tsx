import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'June 3, 2026'

export function AcceptableUsePolicyPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Acceptable Use Policy"
        description="Lira Acceptable Use Policy. The rules and guidelines for using Lira, the AI customer-support agent by Creovine Ltd."
        keywords="Lira AI acceptable use, usage policy, platform rules"
        path="/acceptable-use"
      />
      <div className="legal-page">
        {/* Hero */}
        <section className="legal-hero">
          <h1>Acceptable Use Policy</h1>
          <p>Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="legal-article">
          {/* 1 */}
          <h2>1. Overview</h2>
          <p>
            This Acceptable Use Policy ("<strong>AUP</strong>") governs your use of the Lira AI
            platform and all associated services (the "<strong>Service</strong>") provided by
            Creovine Ltd ("<strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>
            "). This AUP is incorporated by reference into our{' '}
            <Link to="/terms">Terms of Service</Link>.
          </p>
          <p>
            All users, including organization administrators and team members, must comply with this
            AUP. Violations may result in suspension or termination of your account.
          </p>

          {/* 2 */}
          <h2>2. Permitted Uses</h2>
          <p>The Service is intended for lawful business customer-support purposes, including:</p>
          <ul>
            <li>
              Deploying the Lira agent on your own websites and channels to answer your customers'
              questions, grounded in a knowledge base you are authorized to use.
            </li>
            <li>
              Capturing and qualifying leads from conversations and delivering them to your own
              email or approved webhook.
            </li>
            <li>
              Triaging, escalating, and resolving customer conversations using the inbox and
              ticketing tools, including handoff to your human team.
            </li>
            <li>
              Connecting authorized services such as WhatsApp / Meta, Google Drive knowledge
              sources, webhooks, API keys, CLI automation, or MCP tools to deliver support safely.
            </li>
            <li>Reviewing analytics about questions asked, leads captured, and resolutions.</li>
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
              Collect or process personal data of your end users through the Service without the
              notices and consents required by applicable law (see Section 4).
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
              Rely on AI-generated responses as the sole basis for legally or similarly significant
              decisions about individuals without appropriate human review.
            </li>
            <li>
              Configure or prompt the agent to mislead your end users about who they are dealing
              with, or to provide false, deceptive, or harmful information.
            </li>
            <li>
              Deliberately attempt to manipulate, jailbreak, or extract training data or system
              prompts from the AI systems.
            </li>
            <li>
              Use the Service to impersonate real individuals, create deepfakes, or generate
              harmful, misleading, or deceptive content.
            </li>
          </ul>

          <h3>3.5 Connected-Service Misuse</h3>
          <ul>
            <li>Connect third-party services using stolen or unauthorized credentials.</li>
            <li>
              Use connected services to exfiltrate data beyond what is necessary for the Service's
              intended functionality.
            </li>
            <li>
              Violate the terms of service of any third-party platform connected through the
              Service.
            </li>
            <li>
              Use connected-service data for purposes not authorized by the data owner or the
              third-party platform.
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
          <h2>4. End-User Notice &amp; Consent</h2>
          <p>
            Because Lira interacts with <strong>your</strong> customers and end users on your
            behalf, you are responsible for handling their data lawfully. In particular, you must:
          </p>
          <ul>
            <li>
              Make it clear to end users that they may be interacting with an automated AI agent;
            </li>
            <li>
              Provide any privacy notices and obtain any consents required by applicable law (such
              as the GDPR, UK GDPR, and US state privacy laws) before collecting or processing their
              personal data through the Service;
            </li>
            <li>
              Only collect data through the agent that you have a lawful basis to collect, and
              honour your end users' privacy rights;
            </li>
            <li>
              Where your conversations include people from multiple jurisdictions, comply with the
              most protective applicable law.
            </li>
          </ul>
          <p>
            For personal data the Service processes on your behalf, you are the controller and we
            act as your processor. See our <Link to="/privacy">Privacy Policy</Link> for details.
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
              <strong>Email:</strong>{' '}
              <a href="mailto:abuse@liraintelligence.com">abuse@liraintelligence.com</a>
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
          <div className="legal-link-row">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
            <Link to="/security">Security</Link>
          </div>
        </article>
      </div>
    </MarketingLayout>
  )
}
