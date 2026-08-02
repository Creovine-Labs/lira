import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getSlackAuthUrl,
  getSlackStatus,
  listSlackChannels,
  disconnectSlack,
  getLinearAuthUrl,
  getLinearStatus,
  listLinearTeams,
  disconnectLinear,
  type SlackChannel,
  type LinearTeam,
} from '@/services/api'
import { updateSupportConfig, type SupportConfig } from '@/services/api/support-api'
import { SCard, Field, fieldInputCls, Toggle } from './support-ui'

/**
 * Where ticket events go besides email.
 *
 * The backend has had working Slack, Linear and signed-webhook outbox adapters
 * since Phase 6, but three things were missing so nothing was ever delivered:
 * `outbox_providers` (the fan-out list) and the webhook url/secret were absent
 * from the config write schema, and no UI ever set `escalation_slack_channel`
 * or `escalation_linear_team`. This component is that missing front door.
 *
 * Saving is immediate per section rather than deferred to the page's sticky
 * Save bar — connecting Slack round-trips through OAuth, so a pending unsaved
 * edit would be lost on the redirect.
 */

type OutboxProvider = 'slack' | 'linear' | 'webhook'

export function SupportEscalationRouting({
  orgId,
  config,
  onSaved,
}: {
  orgId: string
  config: SupportConfig
  onSaved?: (next: SupportConfig) => void
}) {
  const [providers, setProviders] = useState<OutboxProvider[]>(config.outbox_providers ?? [])

  const [slackConnected, setSlackConnected] = useState(false)
  const [slackChannels, setSlackChannels] = useState<SlackChannel[]>([])
  const [slackChannel, setSlackChannel] = useState(config.escalation_slack_channel ?? '')

  const [linearConnected, setLinearConnected] = useState(false)
  const [linearTeams, setLinearTeams] = useState<LinearTeam[]>([])
  const [linearTeam, setLinearTeam] = useState(config.escalation_linear_team ?? '')

  const [webhookUrl, setWebhookUrl] = useState(config.outbox_webhook_url ?? '')
  const [webhookSecret, setWebhookSecret] = useState(config.outbox_webhook_secret ?? '')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<OutboxProvider | null>(null)

  // Load connection state for both providers. Either call can fail on its own
  // (a revoked token 401s) without taking the other section down with it.
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [slack, linear] = await Promise.allSettled([
        getSlackStatus(orgId),
        getLinearStatus(orgId),
      ])
      if (cancelled) return

      if (slack.status === 'fulfilled' && slack.value.connected) {
        setSlackConnected(true)
        try {
          setSlackChannels(await listSlackChannels(orgId))
        } catch {
          // Connected but the channel list failed — the saved channel id still
          // works, so fall back to a free-text id rather than blocking.
        }
      }
      if (linear.status === 'fulfilled' && linear.value.connected) {
        setLinearConnected(true)
        try {
          setLinearTeams(await listLinearTeams(orgId))
        } catch {
          /* same reasoning as Slack above */
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [orgId])

  const persist = useCallback(
    async (patch: Partial<SupportConfig>, which: OutboxProvider) => {
      setSaving(which)
      try {
        const next = await updateSupportConfig(orgId, patch)
        onSaved?.(next)
        toast.success('Escalation routing saved')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not save escalation routing')
      } finally {
        setSaving(null)
      }
    },
    [orgId, onSaved]
  )

  // Toggling a destination on/off rewrites the fan-out list. An enabled
  // provider with nothing configured would just fail delivery, so the toggle
  // refuses to turn on until its destination is set.
  const toggleProvider = useCallback(
    (provider: OutboxProvider, on: boolean) => {
      if (on) {
        if (provider === 'slack' && !slackChannel) {
          toast.error('Pick a Slack channel first')
          return
        }
        if (provider === 'linear' && !linearTeam) {
          toast.error('Pick a Linear team first')
          return
        }
        if (provider === 'webhook' && !webhookUrl) {
          toast.error('Add a webhook URL first')
          return
        }
      }
      const next = on
        ? Array.from(new Set([...providers, provider]))
        : providers.filter((p) => p !== provider)
      setProviders(next)
      void persist({ outbox_providers: next }, provider)
    },
    [providers, slackChannel, linearTeam, webhookUrl, persist]
  )

  const enabled = (p: OutboxProvider) => providers.includes(p)

  return (
    <SCard
      title="Also send escalations to your tools"
      hint="Email always fires. These are extra destinations for the same ticket events — every delivery is retried and logged in Support → Outbox."
    >
      {loading ? (
        <p className="py-2 text-[12.5px] text-gray-400">Checking connections…</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {/* ── Slack ─────────────────────────────────────────────────── */}
          <div className="py-3 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">Slack</p>
                <p className="mt-0.5 text-[11.5px] text-gray-400">
                  Post a message to a channel when a ticket is escalated.
                </p>
              </div>
              {slackConnected ? (
                <Toggle
                  checked={enabled('slack')}
                  onChange={(v) => toggleProvider('slack', v)}
                  label=""
                />
              ) : (
                <a
                  href={getSlackAuthUrl(orgId)}
                  className="shrink-0 rounded-full bg-gray-900 px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-gray-800"
                >
                  Connect Slack
                </a>
              )}
            </div>

            {slackConnected && (
              <div className="mt-3 space-y-2">
                <Field label="Channel">
                  {slackChannels.length > 0 ? (
                    <select
                      value={slackChannel}
                      onChange={(e) => {
                        setSlackChannel(e.target.value)
                        void persist({ escalation_slack_channel: e.target.value }, 'slack')
                      }}
                      className={fieldInputCls}
                      disabled={saving === 'slack'}
                    >
                      <option value="">Select a channel…</option>
                      {slackChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.is_private ? '🔒 ' : '# '}
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={slackChannel}
                      onChange={(e) => setSlackChannel(e.target.value)}
                      onBlur={() =>
                        void persist({ escalation_slack_channel: slackChannel }, 'slack')
                      }
                      placeholder="C01234ABCDE"
                      className={fieldInputCls}
                    />
                  )}
                </Field>
                <button
                  type="button"
                  onClick={async () => {
                    await disconnectSlack(orgId)
                    setSlackConnected(false)
                    setSlackChannels([])
                    const next = providers.filter((p) => p !== 'slack')
                    setProviders(next)
                    await persist({ outbox_providers: next, escalation_slack_channel: '' }, 'slack')
                  }}
                  className="text-[11.5px] font-semibold text-gray-400 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Disconnect Slack
                </button>
              </div>
            )}
          </div>

          {/* ── Linear ────────────────────────────────────────────────── */}
          <div className="py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">Linear</p>
                <p className="mt-0.5 text-[11.5px] text-gray-400">
                  Open a Linear issue so engineering picks it up in their own backlog.
                </p>
              </div>
              {linearConnected ? (
                <Toggle
                  checked={enabled('linear')}
                  onChange={(v) => toggleProvider('linear', v)}
                  label=""
                />
              ) : (
                <a
                  href={getLinearAuthUrl(orgId)}
                  className="shrink-0 rounded-full bg-gray-900 px-3.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-gray-800"
                >
                  Connect Linear
                </a>
              )}
            </div>

            {linearConnected && (
              <div className="mt-3 space-y-2">
                <Field label="Team">
                  {linearTeams.length > 0 ? (
                    <select
                      value={linearTeam}
                      onChange={(e) => {
                        setLinearTeam(e.target.value)
                        void persist({ escalation_linear_team: e.target.value }, 'linear')
                      }}
                      className={fieldInputCls}
                      disabled={saving === 'linear'}
                    >
                      <option value="">Select a team…</option>
                      {linearTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.key ? `${t.key} — ${t.name}` : t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={linearTeam}
                      onChange={(e) => setLinearTeam(e.target.value)}
                      onBlur={() => void persist({ escalation_linear_team: linearTeam }, 'linear')}
                      placeholder="Linear team id"
                      className={fieldInputCls}
                    />
                  )}
                </Field>
                <button
                  type="button"
                  onClick={async () => {
                    await disconnectLinear(orgId)
                    setLinearConnected(false)
                    setLinearTeams([])
                    const next = providers.filter((p) => p !== 'linear')
                    setProviders(next)
                    await persist({ outbox_providers: next, escalation_linear_team: '' }, 'linear')
                  }}
                  className="text-[11.5px] font-semibold text-gray-400 underline-offset-2 hover:text-red-600 hover:underline"
                >
                  Disconnect Linear
                </button>
              </div>
            )}
          </div>

          {/* ── Signed webhook ────────────────────────────────────────── */}
          <div className="py-3 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">Webhook</p>
                <p className="mt-0.5 text-[11.5px] text-gray-400">
                  POST ticket events to your own endpoint, signed with HMAC-SHA256.
                </p>
              </div>
              <Toggle
                checked={enabled('webhook')}
                onChange={(v) => toggleProvider('webhook', v)}
                label=""
              />
            </div>

            <div className="mt-3 space-y-2.5">
              <Field label="Endpoint URL" hint="Must be https. We never post to plain http.">
                <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  onBlur={() => {
                    if (webhookUrl && !webhookUrl.startsWith('https://')) {
                      toast.error('Webhook URL must start with https://')
                      return
                    }
                    void persist({ outbox_webhook_url: webhookUrl }, 'webhook')
                  }}
                  placeholder="https://api.your-company.com/hooks/lira"
                  className={fieldInputCls}
                />
              </Field>
              <Field
                label="Signing secret"
                hint="We send it as an X-Lira-Signature header so you can verify the payload came from us."
              >
                <input
                  type="password"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  onBlur={() => void persist({ outbox_webhook_secret: webhookSecret }, 'webhook')}
                  placeholder="A long random string you generate"
                  className={fieldInputCls}
                />
              </Field>
            </div>
          </div>
        </div>
      )}
    </SCard>
  )
}
