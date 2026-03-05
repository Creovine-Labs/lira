import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bot, CreditCard, FileText, Lock, Mic, Save, Shield, Users } from 'lucide-react'

import { useUserPrefsStore, type VoiceId, type Personality } from '@/app/store'
import { LiraLogo } from '@/components/LiraLogo'
import { Button } from '@/components/common'

// ── Types ────────────────────────────────────────────────────────────────────

interface VoiceOption {
  id: VoiceId
  label: string
  gender: 'female' | 'male'
  description: string
}

interface PersonalityOption {
  id: Personality
  label: string
  description: string
}

// ── Constants ────────────────────────────────────────────────────────────────

const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'tiffany',
    label: 'Tiffany',
    gender: 'female',
    description: 'Clear & professional female voice (default)',
  },
  {
    id: 'ruth',
    label: 'Ruth',
    gender: 'female',
    description: 'Warm & conversational female voice',
  },
  {
    id: 'matthew',
    label: 'Matthew',
    gender: 'male',
    description: 'Confident & articulate male voice',
  },
  {
    id: 'stephen',
    label: 'Stephen',
    gender: 'male',
    description: 'Deep & authoritative male voice',
  },
]

const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'supportive',
    label: 'Supportive',
    description: 'Encouraging, helps the team move forward and resolve conflicts',
  },
  {
    id: 'challenger',
    label: 'Challenger',
    description: 'Asks tough questions and pushes the team to think critically',
  },
  {
    id: 'facilitator',
    label: 'Facilitator',
    description: 'Keeps the meeting on track and surfaces action items',
  },
  {
    id: 'analyst',
    label: 'Analyst',
    description: 'Data-driven, focuses on facts, metrics, and structured reasoning',
  },
]

const FEMALE_NAMES = ['Lira', 'Sarah', 'Emma', 'Nova', 'Aria', 'Luna']
const MALE_NAMES = ['Max', 'James', 'Leo', 'Alex', 'Kai', 'Orion']

// ── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
  disabled,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <div className={`rounded-xl border bg-card p-6 shadow-sm ${disabled ? 'opacity-50' : ''}`}>
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-violet-500" />
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {disabled && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Not available yet
          </span>
        )}
      </div>
      <div className={disabled ? 'pointer-events-none select-none' : ''}>{children}</div>
    </div>
  )
}

function LockedRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-dashed px-4 py-3 text-muted-foreground/70">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs">{description}</p>
      </div>
      <Lock className="h-4 w-4 shrink-0" />
    </div>
  )
}

// ── AI Configuration section ──────────────────────────────────────────────────

function AiConfigSection() {
  const { aiName, voiceId, personality, setAiName, setVoiceId, setPersonality } =
    useUserPrefsStore()

  const [localName, setLocalName] = useState(aiName)
  const [saved, setSaved] = useState(false)

  // Determine gender from current voice selection
  const currentVoice = VOICE_OPTIONS.find((v) => v.id === voiceId)
  const isFemaleName = FEMALE_NAMES.includes(localName)

  function handleVoiceChange(id: VoiceId) {
    setVoiceId(id)
    // Suggest an appropriate name when switching gender
    const selected = VOICE_OPTIONS.find((v) => v.id === id)
    if (selected?.gender === 'male' && isFemaleName) {
      setLocalName('Max')
    } else if (selected?.gender === 'female' && !isFemaleName) {
      setLocalName('Lira')
    }
  }

  function handleSave() {
    const trimmed = localName.trim()
    if (!trimmed) return
    setAiName(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const nameSuggestions = currentVoice?.gender === 'male' ? MALE_NAMES : FEMALE_NAMES

  return (
    <Section icon={Bot} title="AI Configuration">
      {/* AI Name */}
      <div className="space-y-4">
        <div>
          <label htmlFor="ai-name" className="mb-1.5 block text-sm font-medium text-foreground">
            AI Name
          </label>
          <p className="mb-2 text-xs text-muted-foreground">
            This is the name your AI assistant will use in meetings.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              maxLength={30}
              id="ai-name"
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="e.g. Lira, Sarah, Max…"
            />
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!localName.trim() || localName.trim() === aiName}
              className="gap-1.5 rounded-xl"
            >
              <Save className="h-3.5 w-3.5" />
              {saved ? 'Saved!' : 'Save'}
            </Button>
          </div>
          {/* Name quick-picks */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {nameSuggestions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLocalName(n)}
                className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                  localName === n
                    ? 'border-violet-500 bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400'
                    : 'border-border text-muted-foreground hover:border-violet-300 hover:text-foreground'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Voice selection */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Voice</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Powered by Amazon Nova Sonic. The selected voice will be used in all future meetings.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVoiceChange(v.id)}
                className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                  voiceId === v.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-border hover:border-violet-300'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                    v.gender === 'female'
                      ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                      : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                  }`}
                >
                  <Mic className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{v.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold capitalize ${
                        v.gender === 'female'
                          ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                          : 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400'
                      }`}
                    >
                      {v.gender}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Personality */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Personality</p>
          <p className="mb-2 text-xs text-muted-foreground">
            Controls how your AI participates and responds during meetings.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {PERSONALITY_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonality(p.id)}
                className={`flex flex-col gap-0.5 rounded-xl border p-3 text-left transition ${
                  personality === p.id
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-border hover:border-violet-300'
                }`}
              >
                <span className="text-sm font-medium text-foreground">{p.label}</span>
                <span className="text-xs text-muted-foreground">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Multiple AI Personalities — coming soon */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Multiple AI Participants</p>
            <span className="flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
              Coming soon
            </span>
          </div>
          <p className="mb-2 mt-1 text-xs text-muted-foreground">
            Add multiple AI participants to a single meeting — each with a distinct name, voice, and
            personality. For example: one supportive facilitator and one analytical challenger.
          </p>
          <div className="pointer-events-none select-none">
            <div className="grid gap-2 sm:grid-cols-3">
              {['Lira', 'Max', 'Nova'].map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl border border-dashed p-3 opacity-50"
                >
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground/60">Custom AI</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

function SettingsPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-violet-50/30 dark:to-violet-950/20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <LiraLogo size="sm" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        {/* AI Configuration */}
        <AiConfigSection />

        {/* Subscription */}
        <Section icon={Shield} title="Subscription" disabled>
          <LockedRow
            label="Manage Plan"
            description="View and upgrade your current subscription plan."
          />
          <div className="mt-2">
            <LockedRow label="Usage" description="Track minutes used and remaining in your plan." />
          </div>
        </Section>

        {/* Billing */}
        <Section icon={CreditCard} title="Billing" disabled>
          <LockedRow label="Invoices" description="View and download past invoices." />
          <div className="mt-2">
            <LockedRow
              label="Payment Methods"
              description="Add or update your payment information."
            />
          </div>
        </Section>

        {/* License */}
        <Section icon={FileText} title="License" disabled>
          <LockedRow
            label="Enterprise License"
            description="Manage seat allocations and enterprise licensing terms."
          />
          <div className="mt-2">
            <LockedRow label="License Key" description="View or transfer your license key." />
          </div>
        </Section>
      </div>
    </main>
  )
}

export { SettingsPage }
