import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

import { useOrgStore } from '@/app/store'
import {
  getWebhookConfig,
  updateWebhookConfig,
  testWebhook,
  type WebhookEvent,
} from '@/services/api'

const EVENT_OPTIONS: { value: WebhookEvent; label: string; description: string }[] = [
  {
    value: 'task_created',
    label: 'Task Created',
    description: 'When a new task is created or extracted',
  },
  {
    value: 'task_completed',
    label: 'Task Completed',
    description: 'When a task is marked as completed',
  },
  { value: 'meeting_ended', label: 'Meeting Ended', description: 'When a bot leaves a meeting' },
  {
    value: 'summary_ready',
    label: 'Summary Ready',
    description: 'When a meeting summary is generated',
  },
]

function WebhooksPage() {
  const { currentOrgId } = useOrgStore()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [slackUrl, setSlackUrl] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [notifyOn, setNotifyOn] = useState<WebhookEvent[]>([])

  const loadConfig = useCallback(async () => {
    if (!currentOrgId) return
    setLoading(true)
    try {
      const config = await getWebhookConfig(currentOrgId)
      setSlackUrl(config.slack_webhook_url ?? '')
      setEmailNotifications(config.email_notifications ?? false)
      setNotifyOn(config.notify_on ?? [])
    } catch {
      // No config yet — that's fine
    } finally {
      setLoading(false)
    }
  }, [currentOrgId])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  async function handleSave() {
    if (!currentOrgId) return
    setSaving(true)
    try {
      await updateWebhookConfig(currentOrgId, {
        slack_webhook_url: slackUrl.trim() || undefined,
        email_notifications: emailNotifications,
        notify_on: notifyOn,
      })
      toast.success('Webhook settings saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!currentOrgId) return
    setTesting(true)
    try {
      const res = await testWebhook(currentOrgId)
      if (res.delivered) {
        toast.success('Test event delivered successfully')
      } else {
        toast.error('Test event was not delivered — check your webhook URL')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  function toggleEvent(event: WebhookEvent) {
    setNotifyOn((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Webhooks & Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure notifications for events in your organization.
        </p>
      </div>

      {/* Slack Webhook */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Slack Integration</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Paste your Slack incoming webhook URL to receive notifications in a Slack channel.
        </p>
        <input
          type="url"
          className="input-field"
          value={slackUrl}
          onChange={(e) => setSlackUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/..."
          maxLength={500}
        />
      </section>

      {/* Email Notifications */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Email Notifications</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-foreground">
            Send email notifications for selected events
          </span>
        </label>
      </section>

      {/* Events */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold text-foreground">Notify On</h2>
        <div className="space-y-3">
          {EVENT_OPTIONS.map(({ value, label, description }) => (
            <label
              key={value}
              htmlFor={`event-${value}`}
              aria-label={label}
              className="flex items-start gap-3 rounded-lg border bg-background px-4 py-3 cursor-pointer transition hover:bg-muted/50"
            >
              <input
                id={`event-${value}`}
                type="checkbox"
                checked={notifyOn.includes(value)}
                onChange={() => toggleEvent(value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleTest}
          disabled={testing || !slackUrl.trim()}
          className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
          title="Send a test event to verify your webhook configuration"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
          Send Test
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>
    </div>
  )
}

export { WebhooksPage }
