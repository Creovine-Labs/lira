import { Link } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'March 25, 2026'

export function CookiePolicyPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Cookie Policy"
        description="Lira AI Cookie Policy. Learn about the cookies we use, why we use them, and how you can manage your cookie preferences."
        keywords="Lira AI cookies, cookie policy, website cookies"
        path="/cookies"
      />
      <div className="bg-white">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-32 pb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Legal</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Cookie Policy
          </h1>
          <p className="mt-4 text-base text-gray-500">Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="prose prose-gray prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-indigo-600 hover:prose-a:text-indigo-500 mx-auto max-w-4xl px-6 pb-24">
          {/* 1 */}
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are placed on your device (computer, phone, or tablet)
            when you visit a website. They are widely used to make websites work more efficiently,
            provide a better user experience, and give website operators useful information about
            how their site is being used.
          </p>
          <p>
            This Cookie Policy explains how Creovine Inc. ("<strong>Creovine</strong>", "
            <strong>we</strong>", "<strong>us</strong>") uses cookies and similar technologies on
            the Lira AI platform at <strong>liraintelligence.com</strong> (the "
            <strong>Service</strong>").
          </p>

          {/* 2 */}
          <h2>2. Types of Cookies We Use</h2>

          <h3>2.1 Strictly Necessary Cookies</h3>
          <p>
            These cookies are essential for the Service to function and cannot be switched off. They
            are usually set in response to actions you take, such as logging in, setting privacy
            preferences, or filling in forms. Without these cookies, the Service cannot operate
            properly.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>lira_session</code>
                  </td>
                  <td>Maintains your authenticated session after login</td>
                  <td>Session / 7 days</td>
                </tr>
                <tr>
                  <td>
                    <code>lira_csrf</code>
                  </td>
                  <td>Protects against cross-site request forgery attacks</td>
                  <td>Session</td>
                </tr>
                <tr>
                  <td>
                    <code>lira_org</code>
                  </td>
                  <td>Remembers your selected organization for workspace routing</td>
                  <td>30 days</td>
                </tr>
                <tr>
                  <td>
                    <code>lira_consent</code>
                  </td>
                  <td>Records your cookie consent preferences</td>
                  <td>12 months</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.2 Performance & Analytics Cookies</h3>
          <p>
            These cookies allow us to count visits and traffic sources to measure and improve the
            performance of the Service. They help us understand which pages are most and least
            popular and see how visitors navigate the site. All information these cookies collect is
            aggregated and anonymized.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>_ga</code>
                  </td>
                  <td>Google Analytics — Distinguishes unique users</td>
                  <td>2 years</td>
                </tr>
                <tr>
                  <td>
                    <code>_ga_*</code>
                  </td>
                  <td>Google Analytics — Maintains session state</td>
                  <td>2 years</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>2.3 Functional Cookies</h3>
          <p>
            These cookies enable enhanced functionality and personalization, such as remembering
            your theme preference (light or dark mode) or your preferred language.
          </p>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Cookie Name</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>lira_theme</code>
                  </td>
                  <td>Remembers your display theme preference</td>
                  <td>12 months</td>
                </tr>
                <tr>
                  <td>
                    <code>lira_locale</code>
                  </td>
                  <td>Remembers your language / locale preference</td>
                  <td>12 months</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3 */}
          <h2>3. Third-Party Cookies</h2>
          <p>
            Some cookies are placed by third-party services that appear on our pages. We do not
            control these cookies. The third parties that set cookies through the Service include:
          </p>
          <ul>
            <li>
              <strong>Google (OAuth & Analytics):</strong> When you use "Sign in with Google",
              Google may set cookies to manage the OAuth authentication flow. Google Analytics
              cookies are used for anonymized usage reporting.
            </li>
            <li>
              <strong>Integration OAuth Providers:</strong> When you connect third-party
              integrations (Linear, Slack, Microsoft Teams, GitHub, Greenhouse, HubSpot,
              Salesforce), those providers may set their own cookies during the OAuth authorization
              flow. These cookies are governed by the respective provider's cookie policy.
            </li>
          </ul>

          {/* 4 */}
          <h2>4. How to Manage Cookies</h2>

          <h3>4.1 Browser Settings</h3>
          <p>
            Most web browsers allow you to control cookies through their settings. You can typically
            find these settings in the "Options", "Preferences", or "Privacy" section of your
            browser. You can:
          </p>
          <ul>
            <li>
              View what cookies are stored on your device and delete them individually or all at
              once.
            </li>
            <li>Block third-party cookies.</li>
            <li>Block cookies from specific sites.</li>
            <li>Block all cookies.</li>
            <li>Delete all cookies when you close your browser.</li>
          </ul>
          <p>
            Please note that if you block or delete essential cookies, some features of the Service
            may not function properly, and you may not be able to log in.
          </p>

          <h3>4.2 Opt-Out Links</h3>
          <ul>
            <li>
              <strong>Google Analytics:</strong> You can opt out of Google Analytics by installing
              the{' '}
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics Opt-out Browser Add-on
              </a>
              .
            </li>
          </ul>

          {/* 5 */}
          <h2>5. Local Storage and Similar Technologies</h2>
          <p>In addition to cookies, we use browser local storage (localStorage) to store:</p>
          <ul>
            <li>
              Your authentication token (JWT) for maintaining your session across page reloads.
            </li>
            <li>Your selected organization ID for workspace routing.</li>
            <li>User preferences such as sidebar state and display settings.</li>
          </ul>
          <p>
            Local storage data is stored only on your device and is not transmitted to our servers
            with each request, unlike cookies. You can clear local storage through your browser's
            developer tools.
          </p>

          {/* 6 */}
          <h2>6. Do Not Track</h2>
          <p>
            Some browsers offer a "Do Not Track" (DNT) setting that sends a signal to websites
            requesting that your browsing activity not be tracked. There is currently no industry
            standard for how websites should respond to DNT signals. We currently do not respond to
            DNT signals, but we respect your browser cookie settings as described above.
          </p>

          {/* 7 */}
          <h2>7. Changes to This Cookie Policy</h2>
          <p>
            We may update this Cookie Policy periodically to reflect changes in our practices or
            applicable law. When we make changes, we will update the "Last updated" date at the top
            of this page. We encourage you to review this page periodically.
          </p>

          {/* 8 */}
          <h2>8. Contact Us</h2>
          <p>
            If you have questions about our use of cookies or this Cookie Policy, please contact us:
          </p>
          <ul>
            <li>
              <strong>Email:</strong> <a href="mailto:privacy@creovine.com">privacy@creovine.com</a>
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
