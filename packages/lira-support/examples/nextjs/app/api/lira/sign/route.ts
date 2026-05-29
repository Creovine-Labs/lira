import crypto from 'node:crypto'
import { NextResponse } from 'next/server'

/**
 * Signs a visitor email with your Lira widget secret so the chat widget
 * can verify the user is really who they claim to be.
 *
 * In production: authenticate the request first (only sign for the logged-in
 * user), and read the email from the session, not the request body.
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
