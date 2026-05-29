import { LiraSupport } from './LiraSupport.client'

export const metadata = {
  title: 'Support — {{ORG_NAME}}',
  description: 'Get help with your {{ORG_NAME}} account.',
}

export default function SupportPage() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Support</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>
        Ask anything. Our AI answers instantly and opens a ticket for our team if it can&apos;t.
      </p>
      <LiraSupport />
    </div>
  )
}
