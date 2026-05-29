import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * Signs a visitor email with your Lira widget secret. The signed value is
 * passed to <LiraProvider identity={...} /> so Lira knows the user is real
 * and not someone spoofing another customer's email.
 *
 * Production checklist:
 *   - authenticate the request (only sign for the logged-in user)
 *   - read the email from the server-side session, NOT the request body
 *   - never expose LIRA_WIDGET_SECRET to the browser
 */
export async function POST(req: Request) {
  const secret = process.env.LIRA_WIDGET_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'LIRA_WIDGET_SECRET not configured' }, { status: 500 })
  }

  const body = (await req.json().catch(() => null)) as { email?: string } | null
  const email = body?.email?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  const sig = crypto.createHmac('sha256', secret).update(email).digest('hex')
  return NextResponse.json({ sig })
}
