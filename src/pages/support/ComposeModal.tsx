import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import {
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
  LanguageIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PlusIcon,
  UserPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'sonner'
import {
  createSupportCustomer,
  listSupportCustomers,
  resolveConversation,
  sendProactiveMessage,
  type CustomerProfile,
  type SupportConversation,
} from '@/services/api/support-api'
import { cn } from '@/lib'

/**
 * Compose / "Create" a new outbound conversation from the inbox.
 *
 * Channel switch (Email / Widget), a To: contact lookup with inline
 * "create contact", subject + body, and a Send split-button. Two actions are
 * wired to live endpoints today:
 *   • Send         → sendProactiveMessage (opens a new conversation)
 *   • Send & close → send, then resolveConversation
 * The remaining options (translate, archive) have no backend yet, so they're
 * shown but disabled with a "Soon" tag — the design is in place for when the
 * endpoints land.
 */

type Channel = 'email' | 'widget'

const CHANNELS: { value: Channel; label: string; Icon: typeof EnvelopeIcon }[] = [
  { value: 'widget', label: 'Widget', Icon: ArrowUturnLeftIcon },
  { value: 'email', label: 'Email', Icon: EnvelopeIcon },
]

export function ComposeModal({
  orgId,
  onClose,
  onSent,
}: {
  orgId: string
  onClose: () => void
  onSent: (conv: SupportConversation, opts: { stay: boolean }) => void
}) {
  const [channel, setChannel] = useState<Channel>('email')
  const [channelOpen, setChannelOpen] = useState(false)
  const [recipient, setRecipient] = useState<CustomerProfile | null>(null)
  const [toQuery, setToQuery] = useState('')
  const [toOpen, setToOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contacts, setContacts] = useState<CustomerProfile[]>([])
  const [sending, setSending] = useState<null | 'send' | 'close'>(null)
  const [sendMenuOpen, setSendMenuOpen] = useState(false)
  const [contactSeed, setContactSeed] = useState<string | null>(null)

  const toRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listSupportCustomers(orgId)
      .then(setContacts)
      .catch(() => setContacts([]))
  }, [orgId])

  // Close the recipient dropdown on an outside click. Using a document-level
  // listener (instead of the input's blur) means clicking an option — or
  // "Create contact" — reliably fires before the dropdown can close.
  useEffect(() => {
    if (!toOpen) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (toRef.current && !toRef.current.contains(e.target as Node)) setToOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [toOpen])

  const matches = useMemo(() => {
    const q = toQuery.trim().toLowerCase()
    const base = q
      ? contacts.filter(
          (c) => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        )
      : contacts
    return base.slice(0, 6)
  }, [contacts, toQuery])

  const isEmail = channel === 'email'
  const canSend = !!recipient && body.trim().length > 0 && sending === null

  const doSend = useCallback(
    async (mode: 'send' | 'close') => {
      if (!recipient || !body.trim()) {
        toast.error(!recipient ? 'Pick a recipient first' : 'Write a message first')
        return
      }
      setSending(mode)
      try {
        const conv = await sendProactiveMessage(
          orgId,
          recipient.customer_id,
          body.trim(),
          isEmail ? subject.trim() || undefined : undefined
        )
        if (mode === 'close') {
          // "Send & close" mirrors the inbox convention: deliver, then resolve.
          try {
            await resolveConversation(orgId, conv.conv_id)
          } catch {
            // Non-fatal — the message still sent; the operator can resolve later.
          }
        }
        toast.success(mode === 'close' ? 'Sent & closed' : 'Message sent')
        onSent(conv, { stay: mode === 'close' })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not send the message')
      } finally {
        setSending(null)
        setSendMenuOpen(false)
      }
    },
    [orgId, recipient, body, subject, isEmail, onSent]
  )

  // Cmd/Ctrl+Enter sends; Ctrl+Shift+Enter sends & closes.
  const onKeyDown = (e: ReactKeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (canSend) void doSend(e.shiftKey ? 'close' : 'send')
    }
  }

  const pickContact = (c: CustomerProfile) => {
    setRecipient(c)
    setToQuery('')
    setToOpen(false)
  }

  const openCreateContact = () => {
    setContactSeed(toQuery.trim())
    setToOpen(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: channel switch + close */}
        <div className="flex items-center justify-between px-4 pt-3.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setChannelOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              {(() => {
                const c = CHANNELS.find((x) => x.value === channel)!
                return (
                  <>
                    <c.Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </>
                )
              })()}
              <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>
            {channelOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setChannelOpen(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                  {CHANNELS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => {
                        setChannel(c.value)
                        setChannelOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-gray-50',
                        channel === c.value ? 'font-semibold text-gray-900' : 'text-gray-600'
                      )}
                    >
                      <c.Icon className="h-4 w-4 text-gray-400" />
                      {c.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* To */}
        <div className="relative border-b border-gray-100 px-4 py-3" ref={toRef}>
          <div className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-sm font-medium text-gray-500">To:</span>
            {recipient ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2 text-sm font-medium text-gray-800">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {(recipient.name || recipient.email || '?').charAt(0).toUpperCase()}
                </span>
                {recipient.name || recipient.email}
                <button
                  type="button"
                  onClick={() => setRecipient(null)}
                  className="text-gray-400 transition hover:text-gray-700"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <input
                type="text"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value)
                  setToOpen(true)
                }}
                onFocus={() => setToOpen(true)}
                placeholder="Receiver"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            )}
            <span className="ml-auto shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-300">
              CC
            </span>
          </div>

          {toOpen && !recipient && (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              {matches.map((c) => (
                <button
                  key={c.customer_id}
                  type="button"
                  // mousedown (not click) so the action lands even though the
                  // input is focused — and preventDefault keeps focus put.
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pickContact(c)
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-gray-50"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">
                    {(c.name || c.email || '?').charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-gray-900">
                      {c.name || c.email}
                    </span>
                    {c.name && c.email && (
                      <span className="block truncate text-xs text-gray-400">{c.email}</span>
                    )}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  openCreateContact()
                }}
                className="flex w-full items-center gap-2.5 border-t border-gray-100 px-3 py-2.5 text-left text-sm font-semibold text-[#020308] transition hover:bg-gray-50"
              >
                <PlusIcon className="h-4 w-4" />
                Create contact{toQuery.trim() ? ` "${toQuery.trim()}"` : ''}
              </button>
            </div>
          )}
        </div>

        {/* Subject (email only) */}
        {isEmail && (
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <span className="w-12 shrink-0 text-sm font-medium text-gray-500">Subject:</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        )}

        {/* Body */}
        <div className="min-h-[160px] flex-1 overflow-y-auto px-4 py-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Hey there,"
            rows={6}
            className="h-full min-h-[150px] w-full resize-none bg-transparent text-sm leading-6 text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {/* Footer toolbar */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-1">
            <ToolbarIcon Icon={PaperClipIcon} label="Attach file (soon)" />
            <ToolbarIcon Icon={ClipboardDocumentIcon} label="Templates (soon)" />
            <ToolbarIcon Icon={BookOpenIcon} label="Knowledge base (soon)" />
          </div>
          <div className="flex items-center gap-2">
            <ToolbarIcon Icon={MicrophoneIcon} label="Voice note (soon)" />
            <SendSplitButton
              sending={sending}
              disabled={!canSend}
              menuOpen={sendMenuOpen}
              onToggleMenu={() => setSendMenuOpen((v) => !v)}
              onSend={() => doSend('send')}
              onSendClose={() => doSend('close')}
            />
          </div>
        </div>
      </div>

      {contactSeed !== null && (
        <AddContactModal
          orgId={orgId}
          seed={contactSeed}
          onClose={() => setContactSeed(null)}
          onCreated={(c) => {
            setContacts((prev) => [c, ...prev])
            setRecipient(c)
            setToQuery('')
            setContactSeed(null)
          }}
        />
      )}
    </div>
  )
}

function ToolbarIcon({ Icon, label }: { Icon: typeof PaperClipIcon; label: string }) {
  return (
    <button
      type="button"
      disabled
      title={label}
      aria-label={label}
      className="grid h-8 w-8 cursor-not-allowed place-items-center rounded-lg text-gray-400 opacity-70"
    >
      <Icon className="h-5 w-5" />
    </button>
  )
}

function SendSplitButton({
  sending,
  disabled,
  menuOpen,
  onToggleMenu,
  onSend,
  onSendClose,
}: {
  sending: null | 'send' | 'close'
  disabled: boolean
  menuOpen: boolean
  onToggleMenu: () => void
  onSend: () => void
  onSendClose: () => void
}) {
  return (
    <div className="relative">
      <div className="flex items-stretch overflow-hidden rounded-lg bg-[#020308]">
        <button
          type="button"
          onClick={onSend}
          disabled={disabled}
          className="px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending === 'send' ? 'Sending…' : 'Send'}
        </button>
        <button
          type="button"
          onClick={onToggleMenu}
          disabled={sending !== null}
          aria-label="More send options"
          className="grid w-8 place-items-center border-l border-white/15 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={onToggleMenu}
          />
          <div className="absolute bottom-full right-0 z-20 mb-2 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl">
            <SendMenuItem Icon={PaperAirplaneIcon} label="Send" onClick={onSend} />
            <SendMenuItem Icon={LanguageIcon} label="Send & translate" soon />
            <SendMenuItem
              Icon={CheckCircleIcon}
              label="Send & close"
              shortcut="Ctrl Shift Enter"
              onClick={onSendClose}
            />
            <SendMenuItem
              Icon={ArchiveBoxIcon}
              label="Send & archive"
              shortcut="Ctrl Shift A"
              soon
            />
          </div>
        </>
      )}
    </div>
  )
}

function SendMenuItem({
  Icon,
  label,
  shortcut,
  soon,
  onClick,
}: {
  Icon: typeof PaperAirplaneIcon
  label: string
  shortcut?: string
  soon?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={soon}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition',
        soon ? 'cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-50'
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', soon ? 'text-gray-300' : 'text-gray-500')} />
      <span className="flex-1">{label}</span>
      {soon ? (
        <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-inset ring-amber-600/15">
          Soon
        </span>
      ) : (
        shortcut && <span className="text-[10px] font-medium text-gray-400">{shortcut}</span>
      )}
    </button>
  )
}

// ── Add new contact ───────────────────────────────────────────────────────────

function AddContactModal({
  orgId,
  seed,
  onClose,
  onCreated,
}: {
  orgId: string
  seed: string
  onClose: () => void
  onCreated: (c: CustomerProfile) => void
}) {
  const looksLikeEmail = seed.includes('@')
  const [name, setName] = useState(looksLikeEmail ? '' : seed)
  const [email, setEmail] = useState(looksLikeEmail ? seed : '')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!email.trim()) {
      toast.error('Email is required')
      return
    }
    setSaving(true)
    try {
      const c = await createSupportCustomer(orgId, {
        name: name.trim() || email.trim().split('@')[0],
        email: email.trim(),
        phone: phone.trim() || undefined,
      })
      toast.success('Contact added')
      onCreated(c)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not add contact')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        // Nested inside the compose backdrop — stop the bubble so dismissing
        // this modal doesn't also close compose.
        e.stopPropagation()
        onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mb-5">
          <h2 className="text-center text-lg font-bold text-gray-900">Add new contact</h2>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <ContactField label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </ContactField>
          <ContactField label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@acme.com"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </ContactField>
          <ContactField label="Phone (optional)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 555 0100"
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#020308] focus:ring-1 focus:ring-[#020308]"
            />
          </ContactField>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={saving || !email.trim()}
          className="mt-6 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#020308] py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <UserPlusIcon className="h-4 w-4" />
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

function ContactField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}
