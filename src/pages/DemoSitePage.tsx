import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import { DemoChatHint, DemoNimbusDashboard } from '@/components/marketing'
import { useLiraWidget } from '@/lib/demo-widget'
import { clearDemoProfile, useDemoProfile } from '@/lib/demo-profile'

/**
 * Nimbus — a fake SaaS landing page we use to demo the Lira support widget
 * on a neutral-looking site. Lives at /demo (and, once DNS is configured,
 * at demo.liraintelligence.com). This is the WIDGET-MODE view of the demo.
 * Full support-page view lives at /demo/help (see DemoHelpPage.tsx).
 *
 * The page intentionally contains a lot of plain-prose product documentation
 * (features, pricing, FAQ, security, refund policy, getting started, etc.)
 * so the Lira KB crawler has real substance to ingest when demoing against
 * a Nimbus organisation.
 *
 * Widget mounting logic lives in src/lib/demo-widget.ts so DemoHelpPage can
 * reuse the exact same loader.
 */

export function DemoSitePage() {
  // useLiraWidget mounts the chat widget on this page. Its return value
  // (test-visitor mode banner) is no longer rendered now that the marketing
  // fallback is gone, but we still call the hook for the side effect.
  useLiraWidget()
  const profile = useDemoProfile()
  const navigate = useNavigate()

  // No marketing fallback any more — visitors with no profile bounce back to
  // the Lira landing page (where the DemoEntryModal lives). This stops people
  // from seeing the Nimbus marketing site without context, which previously
  // defeated the "real product dashboard" framing.
  useEffect(() => {
    if (!profile) {
      navigate('/', { replace: true })
    }
  }, [profile, navigate])

  const handleSignOut = () => {
    clearDemoProfile()
    // Sign-out returns the visitor to the Lira landing page where they can
    // start a fresh demo (the entry modal is just one click away).
    navigate('/', { replace: true })
  }

  // Signed-in: dashboard. (No-profile case redirects above; this branch only
  // renders when the profile is present.)
  if (profile) {
    return (
      <>
        <SEO
          title="Nimbus Dashboard"
          description="Nimbus is a demo of Lira — the AI customer support agent."
          path="/demo"
          noIndex
        />
        <DemoNimbusDashboard profile={profile} onSignOut={handleSignOut} />
        <DemoChatHint />
      </>
    )
  }

  // No-profile flash render: shows for a tick until the redirect fires.
  // Kept minimal so SEO crawlers don't see the old marketing page either.
  return null

}
