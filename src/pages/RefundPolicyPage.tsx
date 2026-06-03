import { SEO } from '@/components/SEO'
import { MarketingLayout } from '@/components/marketing'

const LAST_UPDATED = 'June 3, 2026'

export function RefundPolicyPage() {
  return (
    <MarketingLayout>
      <SEO
        title="Refund Policy"
        description="Lira's refund policy: how our 14-day free trial works, our money-back guarantee on first subscriptions, cancellations, and how to request a refund through Paddle, our Merchant of Record."
        keywords="Lira refund policy, subscription refund, money-back guarantee, Paddle refund, cancel subscription"
        path="/refund"
      />
      <div className="legal-page">
        {/* Hero */}
        <section className="legal-hero">
          <h1>Refund Policy</h1>
          <p>Last updated: {LAST_UPDATED}</p>
        </section>

        {/* Body */}
        <article className="legal-article">
          {/* 1 */}
          <h2>1. Overview</h2>
          <p>
            This Refund Policy explains how refunds and cancellations work for paid subscriptions to
            the Lira platform ("<strong>Service</strong>"), operated by Creovine Inc. ("
            <strong>Creovine</strong>", "<strong>we</strong>", "<strong>us</strong>", or "
            <strong>our</strong>"). It applies in addition to our{' '}
            <a href="/terms">Terms of Service</a>.
          </p>
          <p>
            Because every plan starts with a free trial, you can evaluate Lira in full before any
            charge is made. We want you to be confident in your purchase, so we also offer a
            money-back guarantee on your first subscription, described below.
          </p>

          {/* 2 */}
          <h2>2. Free Trial</h2>
          <p>
            New accounts begin with a <strong>14-day free trial</strong> (or 10 conversations,
            whichever comes first). No payment is taken during the trial, and you are under no
            obligation to subscribe. If you do not select a paid plan, your assistant simply pauses
            when the trial ends — you are never charged automatically for the trial itself.
          </p>

          {/* 3 */}
          <h2>3. Money-Back Guarantee on Your First Subscription</h2>
          <p>
            If you subscribe to a paid plan and are not satisfied, you may request a full refund of
            your <strong>first</strong> subscription payment within <strong>14 days</strong> of that
            payment. This guarantee applies once per customer and covers the base plan fee (Startup,
            Growth, or Pro).
          </p>
          <p>The money-back guarantee does not cover:</p>
          <ul>
            <li>
              Third-party usage fees billed on top of your plan — including, but not limited to,
              WhatsApp Business API (Meta) per-conversation charges, which are non-refundable once
              incurred.
            </li>
            <li>Renewal charges (see Section 4) and any subscription beyond the first.</li>
            <li>
              Accounts terminated for violations of our Terms of Service or Acceptable Use Policy.
            </li>
          </ul>

          {/* 4 */}
          <h2>4. Renewals &amp; Cancellations</h2>
          <p>
            Subscriptions renew automatically — monthly or annually, depending on the term you
            choose — until cancelled. You can upgrade, downgrade, or cancel at any time from your
            dashboard; changes take effect from your next billing cycle.
          </p>
          <p>
            Cancelling stops future charges and keeps your assistant active until the end of the
            period you have already paid for. Except where required by law or expressly stated in
            this policy, payments for the current billing period are <strong>non-refundable</strong>
            , and we do not provide prorated refunds for partial months or unused conversations.
          </p>

          {/* 5 */}
          <h2>5. Annual Plans</h2>
          <p>
            Annual plans (which include 2 months free) are billed up front for the year. The 14-day
            money-back guarantee in Section 3 applies to a first annual subscription. After that
            window, annual fees are non-refundable for the remainder of the term, though you may
            cancel to prevent the next year's renewal.
          </p>

          {/* 6 */}
          <h2>6. How to Request a Refund</h2>
          <p>
            To request a refund covered by this policy, email{' '}
            <a href="mailto:billing@liraintelligence.com">billing@liraintelligence.com</a> from the
            address associated with your account, including your order or receipt reference.
            Eligible refunds are issued to the original payment method, normally within 5–10
            business days once approved (timing depends on your bank or card issuer).
          </p>

          {/* 7 */}
          <h2>7. Payments &amp; Merchant of Record</h2>
          <p>
            Payments for the Service are processed by <strong>Paddle.com</strong>, our authorized
            reseller and Merchant of Record. Paddle handles checkout, invoicing, and the processing
            of approved refunds. You may also see Paddle referenced on your bank or card statement.
            Refunds approved by us are returned through Paddle to your original payment method.
          </p>

          {/* 8 */}
          <h2>8. Chargebacks</h2>
          <p>
            If you believe you have been charged in error, please contact us first — we will work to
            resolve it quickly. Initiating a chargeback or payment dispute without contacting us may
            result in suspension of your account while the matter is reviewed.
          </p>

          {/* 9 */}
          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Refund Policy from time to time. Material changes will be posted on
            this page with an updated "Last updated" date and, where appropriate, communicated to
            active subscribers. The policy in effect at the time of your purchase governs that
            purchase.
          </p>

          {/* 10 */}
          <h2>10. Contact Us</h2>
          <p>
            Questions about this Refund Policy? Reach us at{' '}
            <a href="mailto:billing@liraintelligence.com">billing@liraintelligence.com</a>.
          </p>
        </article>
      </div>
    </MarketingLayout>
  )
}
