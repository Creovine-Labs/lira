// /support/portal — operator-side management surface for the customer
// portal (Phase 4 of SUPPORT_TICKETING_API.md).
//
// The portal itself lives at /portal/:orgId/* and is NOT inside the
// operator AppShell. This page is where the operator goes to:
//   • copy the public portal URL to share with a customer
//   • preview the portal as a customer (opens in a new tab)
//   • grab an embed snippet for their own marketing/support page
//
// All of this is read-only — there is no portal configuration to manage
// at this point; the portal works as soon as the org has tickets.

import { useMemo, useState } from 'react'
import {
  ArrowTopRightOnSquareIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  EnvelopeOpenIcon,
  LinkIcon,
  ShieldCheckIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useOrgStore } from '@/app/store'

export function SupportPortalPage() {
  const { currentOrgId } = useOrgStore()

  const portalUrl = useMemo(() => {
    if (!currentOrgId) return ''
    return `${window.location.origin}/portal/${currentOrgId}/access`
  }, [currentOrgId])

  const embedSnippet = useMemo(() => {
    if (!portalUrl) return ''
    return `<a href="${portalUrl}" rel="noopener">Check on a ticket →</a>`
  }, [portalUrl])

  return (
    <div className="min-h-full bg-[#ebebeb] px-5 py-7">
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Customer portal</h1>
          <p className="mt-1 text-sm text-gray-500">
            The public surface where your customers track their tickets, read your replies, and send
            follow-ups — distinct from this operator workspace.
          </p>
        </header>

        <section className="mb-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#020308]/[0.04]">
              <LinkIcon className="h-4 w-4 text-[#020308]/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-semibold text-[#020308]">Public portal URL</h2>
              <p className="mt-0.5 text-[12px] text-gray-500">
                Share this with a customer in an email, support reply, or your help center. They
                enter their email; we send a magic-link to sign them in.
              </p>
              {portalUrl ? (
                <CopyableUrl url={portalUrl} />
              ) : (
                <p className="mt-3 text-[12px] text-gray-400">
                  Select an organisation to see your portal URL.
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={portalUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className={
                    'inline-flex items-center gap-1.5 rounded-lg bg-[#020308] px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-gray-800 ' +
                    (portalUrl ? '' : 'pointer-events-none opacity-40')
                  }
                >
                  Preview as customer
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                </a>
                <p className="text-[11px] text-gray-400">
                  Opens in a new tab — your operator session stays signed in here.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#020308]/[0.04]">
              <ClipboardDocumentIcon className="h-4 w-4 text-[#020308]/70" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-semibold text-[#020308]">Embed snippet</h2>
              <p className="mt-0.5 text-[12px] text-gray-500">
                Drop this on your help center or product page. Replace the link text to match your
                tone of voice.
              </p>
              {embedSnippet ? (
                <CodeSnippet snippet={embedSnippet} />
              ) : (
                <p className="mt-3 text-[12px] text-gray-400">
                  Available once you've selected an organisation.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/60 bg-white p-5 shadow-sm">
          <h2 className="text-[13px] font-semibold text-[#020308]">How it works</h2>
          <ul className="mt-3 space-y-3">
            <Step
              icon={<EnvelopeOpenIcon className="h-4 w-4 text-[#020308]/70" />}
              title="Customer requests access"
              body="They enter their email on the portal. If we have any tickets for them, we send a magic-link. We don't reveal whether the email exists — no enumeration risk."
            />
            <Step
              icon={<ShieldCheckIcon className="h-4 w-4 text-[#020308]/70" />}
              title="Token-scoped, no passwords"
              body="Links are good for 7 days. Each ticket page can be opened with a longer 30-day token. Tokens are self-validating — no database hit on each request."
            />
            <Step
              icon={<UsersIcon className="h-4 w-4 text-[#020308]/70" />}
              title="Replies flow into your inbox"
              body="When the customer replies on the portal, it lands in this workspace as a normal message — and auto-reopens pending or recently-resolved tickets."
            />
          </ul>
        </section>
      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }
  return (
    <div className="mt-3 flex items-stretch gap-2 rounded-lg border border-black/10 bg-[#020308]/[0.02] p-1.5">
      <code className="min-w-0 flex-1 truncate px-2 py-1.5 font-mono text-[12px] text-[#020308]/80">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#020308] shadow-sm transition hover:bg-gray-50"
      >
        {copied ? (
          <>
            <CheckIcon className="h-3.5 w-3.5 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <ClipboardDocumentIcon className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
    </div>
  )
}

function CodeSnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-black/10 bg-[#020308]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          HTML
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10"
        >
          {copied ? (
            <>
              <CheckIcon className="h-3 w-3 text-emerald-300" />
              Copied
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto px-3 py-3 font-mono text-[12px] leading-relaxed text-emerald-200">
        {snippet}
      </pre>
    </div>
  )
}

function Step({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#020308]/[0.04]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-[#020308]">{title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-gray-500">{body}</p>
      </div>
    </li>
  )
}
