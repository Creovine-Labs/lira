/**
 * LaunchDemoPage — Cinematic UI scenes for the Lira AI product launch video.
 *
 * Navigate between scenes via the left sidebar.
 * Each scene plays an animated CSS sequence designed for screen recording.
 *
 * Route: /launch-demo  (temporary — delete after recording)
 */
import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Participant images from /public/participants/ ──────────────────────── */
const FACES = {
  adaeze: '/participants/adaeze.jpg',
  kwame: '/participants/kwame.jpg',
  alex: '/participants/Alex K.jpg',
} as const
const LIRA_LOGO = '/lira_black.png'
const LIRA_LOGO_WHITE_BG = '/lira_black_with_white_backgound.png'

/* ─── Keyframe Animations ────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @keyframes ldWave{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}
  .ld-wave{animation:ldWave .55s ease-in-out infinite}

  @keyframes ldPulse{0%,100%{box-shadow:0 0 0 0 rgba(56,189,248,.6)}50%{box-shadow:0 0 0 14px rgba(56,189,248,0)}}
  .ld-pulse{animation:ldPulse 1.6s ease-in-out infinite}

  @keyframes ldPulseViolet{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.55)}50%{box-shadow:0 0 0 10px rgba(139,92,246,0)}}
  .ld-pulse-violet{animation:ldPulseViolet 1.4s ease-in-out infinite}

  @keyframes ldRise{from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
  .ld-rise{animation:ldRise .7s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldSlideL{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
  .ld-slide-l{animation:ldSlideL .6s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldSlideR{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
  .ld-slide-r{animation:ldSlideR .6s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldSlideUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
  .ld-slide-up{animation:ldSlideUp .6s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldFade{from{opacity:0}to{opacity:1}}
  .ld-fade{animation:ldFade .5s ease-out both}

  @keyframes ldBlink{0%,100%{opacity:1}50%{opacity:0}}
  .ld-blink{animation:ldBlink .8s step-end infinite}

  @keyframes ldFill{from{width:0%}to{width:var(--fill)}}
  .ld-fill{animation:ldFill 1.2s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldDotPulse{0%,100%{opacity:1}50%{opacity:.4}}
  .ld-dot-pulse{animation:ldDotPulse 1.2s ease-in-out infinite}

  @keyframes ldTranscript{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .ld-transcript{animation:ldTranscript .3s ease-out both}

  @keyframes ldGlow{0%,100%{box-shadow:0 0 20px rgba(56,189,248,.3),inset 0 0 20px rgba(56,189,248,.05)}50%{box-shadow:0 0 40px rgba(56,189,248,.6),inset 0 0 30px rgba(56,189,248,.1)}}
  .ld-glow{animation:ldGlow 1.4s ease-in-out infinite}

  @keyframes ldBubble{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
  .ld-bubble{animation:ldBubble .4s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldZoomIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
  .ld-zoom-in{animation:ldZoomIn .6s cubic-bezier(.22,1,.36,1) both}

  @keyframes ldZoomPan{
    0%{transform:scale(1) translateX(0)}
    30%{transform:scale(1.15) translateX(-8%)}
    70%{transform:scale(1.15) translateX(-8%)}
    100%{transform:scale(1) translateX(0)}
  }
  .ld-zoom-pan{animation:ldZoomPan 8s ease-in-out infinite}

  @keyframes ldTypewriter{from{width:0}to{width:100%}}

  @keyframes ldPhoneFloat{
    0%,100%{transform:translateY(0) rotate(0deg)}
    50%{transform:translateY(-8px) rotate(1deg)}
  }
  .ld-phone-float{animation:ldPhoneFloat 3s ease-in-out infinite}

  @keyframes ldScaleBreath{
    0%,100%{transform:scale(1)}
    50%{transform:scale(1.02)}
  }
  .ld-breathe{animation:ldScaleBreath 4s ease-in-out infinite}

  @keyframes ldPerspTilt{
    0%{transform:perspective(800px) rotateY(0deg)}
    50%{transform:perspective(800px) rotateY(2deg)}
    100%{transform:perspective(800px) rotateY(0deg)}
  }
  .ld-tilt{animation:ldPerspTilt 6s ease-in-out infinite}
`

/* ─── Scene List ─────────────────────────────────────────────────────────── */
const SCENES = [
  { id: 'dashboard', label: 'Dashboard', desc: 'Stats + recent meetings' },
  { id: 'deploy-animated', label: 'Deploy (Animated)', desc: 'Typing link + zoom to button' },
  { id: 'deploy', label: 'Bot Deploy', desc: 'Status bar progression' },
  { id: 'meeting', label: 'Meeting (Desktop)', desc: 'Google Meet replica' },
  { id: 'meeting-mobile', label: 'Meeting (Mobile)', desc: 'Mobile Google Meet' },
  { id: 'integrations', label: 'Integration Cascade', desc: 'Chain reaction' },
  { id: 'integrations-connect', label: 'Connect Integrations', desc: 'App connection cards' },
  { id: 'interview', label: 'Interview Report', desc: 'Score bars filling' },
  { id: 'sales', label: 'Sales Coaching', desc: 'Floating overlay on call' },
  { id: 'lira-speaking', label: 'Lira Speaking', desc: 'Lira center in Meet' },
  { id: 'support', label: 'Support (Desktop)', desc: 'Chat with typing' },
  { id: 'support-mobile', label: 'Support (Mobile)', desc: 'Mobile chat view' },
] as const
type SceneId = (typeof SCENES)[number]['id']

/* ─── Reusable small components ──────────────────────────────────────────── */

function WaveBars({ color = 'bg-emerald-400' }: { color?: string }) {
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`ld-wave w-[3px] h-full rounded-full ${color} origin-bottom`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

function LiraAvatarImg({
  size = 40,
  speaking = false,
  whiteBg = false,
}: {
  size?: number
  speaking?: boolean
  whiteBg?: boolean
}) {
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${speaking ? 'ld-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <img
        src={whiteBg ? LIRA_LOGO_WHITE_BG : LIRA_LOGO_WHITE_BG}
        alt="Lira"
        className="w-full h-full object-cover"
      />
    </div>
  )
}

function FaceAvatar({ src, name, size = 40 }: { src: string; name: string; size?: number }) {
  return (
    <div className="rounded-full overflow-hidden shrink-0" style={{ width: size, height: size }}>
      <img src={src} alt={name} className="w-full h-full object-cover" />
    </div>
  )
}

function GlassCard({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <div
      className={`ld-rise relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1c1e] via-[#141414] to-[#0a0a0a] shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/[0.12] to-transparent" />
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/[0.08]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function AnimatedCounter({ target, delay = 0 }: { target: number; delay?: number }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1200
      const startTime = Date.now()
      const tick = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setValue(Math.round(eased * target))
        if (progress < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(timer)
  }, [target, delay])
  return <span>{value}</span>
}

/* Google Meet style SVG icons */
function MicIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a1 1 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
    </svg>
  )
}
function CamIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
    </svg>
  )
}
function HangupIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a1 1 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 00-2.67-1.85c-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
    </svg>
  )
}
function ScreenShareIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
    </svg>
  )
}
function ChatIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
  )
}
function HandIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 7c0-1.38-1.12-2.5-2.5-2.5-.17 0-.34.02-.5.05V4c0-1.38-1.12-2.5-2.5-2.5-.23 0-.46.03-.67.09C14.46.66 13.56 0 12.5 0c-1.23 0-2.25.89-2.46 2.06A2.5 2.5 0 007.5 4.5v5.89c-.34-.31-.76-.64-1.22-.95C5.56 8.96 4.57 9.03 4 9.32c-.52.27-.87.76-.87 1.33 0 .65.39 1.26.93 1.85l5.87 6.16c.38.4.91.63 1.46.63H17.5c1.38 0 2.5-1.12 2.5-2.5V9c0-1.02-.62-1.9-1.5-2.29V7z" />
    </svg>
  )
}
function PeopleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 1 — DASHBOARD                                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DashboardScene({ restart }: { restart: number }) {
  const stats = [
    { label: 'Total Meetings', value: 48, icon: <MicIcon className="w-[15px] h-[15px]" /> },
    { label: 'Interviews', value: 23, icon: <PeopleIcon className="w-[15px] h-[15px]" /> },
    { label: 'Tasks Created', value: 127, icon: <ChatIcon className="w-[15px] h-[15px]" /> },
    { label: 'People Coached', value: 16, icon: <HandIcon className="w-[15px] h-[15px]" /> },
  ]
  const recentMeetings = [
    { title: 'Sprint Planning — Q3 Roadmap', time: '2h ago', type: 'Stand-up' },
    { title: 'Design Review — New Dashboard', time: '5h ago', type: '1-on-1' },
    { title: 'Sales Sync — Acme Corp Deal', time: '1d ago', type: 'Sales' },
    { title: 'Engineering All-Hands', time: '2d ago', type: 'Technical' },
  ]
  return (
    <div key={restart} className="w-full min-h-full bg-[#ebebeb] p-8 rounded-2xl">
      {/* Header */}
      <div className="ld-fade flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Good afternoon, Alex</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Here&apos;s what&apos;s happening across your team
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="ld-fade h-9 px-4 flex items-center gap-2 bg-[#3730a3] text-white text-sm font-semibold rounded-xl cursor-pointer hover:bg-[#312e81] transition"
            style={{ animationDelay: '.3s' }}
          >
            <img src={LIRA_LOGO} alt="" className="w-4 h-4 invert" /> Deploy Lira
          </div>
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <GlassCard key={s.label} delay={0.2 + i * 0.15}>
            <div className="p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white/60">
                {s.icon}
              </div>
              <p className="mt-4 text-2xl font-bold tracking-tight text-white">
                <AnimatedCounter target={s.value} delay={600 + i * 200} />
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/40">
                {s.label}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
      {/* Recent meetings — full width */}
      <div
        className="ld-rise bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6"
        style={{ animationDelay: '.8s' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Recent Meetings</h3>
          <span className="text-xs text-[#3730a3] font-medium cursor-pointer hover:underline">
            View all
          </span>
        </div>
        <div className="divide-y divide-gray-100">
          {recentMeetings.map((m, i) => (
            <div
              key={m.title}
              className="ld-fade flex items-center gap-3 py-3"
              style={{ animationDelay: `${1.0 + i * 0.12}s` }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <MicIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{m.title}</p>
                <p className="text-xs text-gray-400">{m.time}</p>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {m.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 2 — DEPLOY ANIMATED (typing link, zoom to button, Lira joins)       */
/* ═══════════════════════════════════════════════════════════════════════════ */

function DeployAnimatedScene({ restart }: { restart: number }) {
  const LINK = 'https://meet.google.com/abc-defg-hij'
  const [typedChars, setTypedChars] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'clicked' | 'joined'>('typing')

  useEffect(() => {
    setTypedChars(0)
    setPhase('typing')
    let charIdx = 0
    const typeInterval = setInterval(() => {
      charIdx++
      setTypedChars(charIdx)
      if (charIdx >= LINK.length) clearInterval(typeInterval)
    }, 60)
    const timers = [
      setTimeout(() => setPhase('clicked'), LINK.length * 60 + 1200),
      setTimeout(() => setPhase('joined'), LINK.length * 60 + 3500),
    ]
    return () => {
      clearInterval(typeInterval)
      timers.forEach(clearTimeout)
    }
  }, [restart])

  return (
    <div
      key={restart}
      className="w-full h-full bg-[#ebebeb] rounded-2xl flex items-center justify-center p-8 overflow-hidden"
    >
      <div className="w-full max-w-2xl">
        <div className="ld-rise bg-white rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
            <div className="h-10 w-10 rounded-xl overflow-hidden shrink-0">
              <img src={LIRA_LOGO_WHITE_BG} alt="Lira" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Invite Lira to a meeting</h3>
              <p className="text-xs text-gray-400">Paste a Google Meet link and Lira will join</p>
            </div>
          </div>

          <div className="p-6">
            {/* Meeting type */}
            <div className="ld-fade mb-5" style={{ animationDelay: '.2s' }}>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Meeting Type
              </span>
              <div className="flex gap-2">
                {['Stand-up', '1-on-1', 'Technical', 'Sales'].map((t, i) => (
                  <div
                    key={t}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${i === 0 ? 'bg-gray-900 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Link input with typing animation */}
            <div className="ld-fade mb-5" style={{ animationDelay: '.35s' }}>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Meeting Link
              </span>
              <div
                className="flex items-center rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3 transition-colors focus-within:border-[#3730a3] focus-within:bg-white"
                style={{
                  borderColor: typedChars > 0 ? '#3730a3' : undefined,
                  backgroundColor: typedChars > 0 ? 'white' : undefined,
                }}
              >
                <svg
                  className="w-4 h-4 text-gray-400 mr-3 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                <span className="text-sm text-gray-800 font-mono">{LINK.slice(0, typedChars)}</span>
                {typedChars < LINK.length && (
                  <span className="ld-blink text-[#3730a3] font-mono text-sm ml-0.5">|</span>
                )}
              </div>
            </div>

            {/* Deploy button */}
            <div>
              {phase === 'joined' ? (
                <div className="ld-fade w-full h-12 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Lira has joined the meeting
                </div>
              ) : phase === 'clicked' ? (
                <div className="w-full h-12 bg-[#3730a3] rounded-xl flex items-center justify-center gap-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-white animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span className="text-white text-sm font-semibold">Joining meeting...</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-12 bg-[#3730a3] hover:bg-[#312e81] text-white rounded-xl flex items-center justify-center text-sm font-semibold cursor-pointer transition shadow-lg shadow-[#3730a3]/25">
                  <img src={LIRA_LOGO} alt="" className="w-4 h-4 invert mr-2" />
                  Send Lira to Meeting
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 3 — BOT DEPLOY STATUS                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function BotDeployScene({ restart }: { restart: number }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 2500),
      setTimeout(() => setStep(2), 4000),
      setTimeout(() => setStep(3), 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [restart])
  const statuses = [
    { label: 'Launching...', color: 'bg-amber-400', text: 'text-amber-400', pct: 33 },
    { label: 'Navigating...', color: 'bg-sky-400', text: 'text-sky-400', pct: 66 },
    { label: 'Active', color: 'bg-emerald-400', text: 'text-emerald-400', pct: 100 },
  ]
  return (
    <div
      key={restart}
      className="w-full min-h-full bg-[#ebebeb] flex items-center justify-center p-8"
    >
      <div className="w-full max-w-lg">
        {step === 0 ? (
          <div className="ld-rise bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8">
            <div className="ld-fade flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-[#3730a3] flex items-center justify-center">
                <img src={LIRA_LOGO} alt="" className="w-5 h-5 invert" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Deploy Lira to Meeting</h3>
                <p className="text-xs text-gray-400">Paste a Google Meet link and send Lira</p>
              </div>
            </div>
            <div className="ld-fade mb-4" style={{ animationDelay: '.2s' }}>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Meeting Link
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <svg
                  className="w-4 h-4 text-gray-400 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
                <span className="text-sm text-gray-700">https://meet.google.com/abc-defg-hij</span>
              </div>
            </div>
            <div className="ld-fade mb-6" style={{ animationDelay: '.35s' }}>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Meeting Type
              </span>
              <div className="flex gap-2">
                {['Stand-up', '1-on-1', 'Technical', 'Sales'].map((t, i) => (
                  <div
                    key={t}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${i === 0 ? 'bg-[#3730a3] text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="ld-fade" style={{ animationDelay: '.5s' }}>
              <div className="w-full h-11 bg-[#3730a3] text-white rounded-xl flex items-center justify-center text-sm font-semibold cursor-pointer transition shadow-lg shadow-[#3730a3]/25">
                <img src={LIRA_LOGO} alt="" className="w-4 h-4 invert mr-2" />
                Send Lira to Meeting
              </div>
            </div>
          </div>
        ) : (
          <div className="ld-rise bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8">
            <div className="flex items-center gap-3 mb-6">
              <LiraAvatarImg size={44} speaking={step === 3} />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Lira</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`h-2 w-2 rounded-full ${statuses[step - 1].color} ${step < 3 ? 'ld-dot-pulse' : ''}`}
                  />
                  <span className={`text-xs font-semibold ${statuses[step - 1].text}`}>
                    {statuses[step - 1].label}
                  </span>
                </div>
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${statuses[step - 1].color}`}
                style={{ width: `${statuses[step - 1].pct}%` }}
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Sprint Planning — Q3 Roadmap</p>
                  <p className="text-xs text-gray-400 mt-0.5">meet.google.com/abc-defg-hij</p>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                  Stand-up
                </span>
              </div>
            </div>
            {step === 3 && (
              <div
                className="ld-fade mt-4 flex items-center gap-2 text-emerald-600 text-sm font-medium"
                style={{ animationDelay: '.2s' }}
              >
                <span>✓</span> Lira has joined the meeting
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 4 — MEETING ROOM (Google Meet replica — DESKTOP)                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

const MEETING_TRANSCRIPT = [
  { speaker: 'Sarah Chen', text: "Okay, let's start with the API migration update.", delay: 0 },
  {
    speaker: 'Sarah Chen',
    text: "We're blocked until the auth service refactor is complete.",
    delay: 2000,
  },
  {
    speaker: 'Marcus Johnson',
    text: 'I should have the schema finalized by end of day.',
    delay: 4500,
  },
  {
    speaker: 'Marcus Johnson',
    text: "Hey Lira, what were the action items from last week's standup?",
    delay: 7000,
  },
  {
    speaker: 'Lira',
    text: 'Last week, the team agreed on three items: Marcus would finalize the API schema, Sarah would complete the auth service refactor, and the design review was moved to Friday. The auth refactor is still open.',
    delay: 9500,
  },
  {
    speaker: 'Sarah Chen',
    text: "That confirms it. I'll prioritize the refactor today.",
    delay: 15000,
  },
]

function MeetingScene({ restart }: { restart: number }) {
  const [liraSpeaking, setLiraSpeaking] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<string>('')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    MEETING_TRANSCRIPT.forEach((line) => {
      timers.push(
        setTimeout(() => {
          setLiraSpeaking(line.speaker === 'Lira')
          setActiveSpeaker(line.speaker)
        }, line.delay)
      )
    })
    timers.push(
      setTimeout(() => {
        setLiraSpeaking(false)
        setActiveSpeaker('')
      }, 14500)
    )
    return () => timers.forEach(clearTimeout)
  }, [restart])

  return (
    <div
      key={restart}
      className="w-full h-full bg-[#202124] rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Google Meet header bar */}
      <div className="ld-fade flex items-center justify-between px-4 py-2 bg-[#202124]">
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm font-medium">Team Standup</span>
          <span className="text-white/30 text-xs">|</span>
          <span className="text-white/40 text-xs">12:04 PM</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <PeopleIcon className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-xs">3</span>
          </div>
          <ChatIcon className="w-4 h-4 text-white/50" />
        </div>
      </div>

      {/* Participant grid (Google Meet style — dark tiles with face images) */}
      <div className="flex-1 p-3 grid grid-cols-3 grid-rows-1 gap-3 bg-[#202124]">
        {/* Sarah Chen */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'Sarah Chen' ? 'ring-2 ring-[#8ab4f8]' : ''}`}
          style={{ animationDelay: '.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.adaeze} name="Sarah Chen" size={80} />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {activeSpeaker === 'Sarah Chen' && <WaveBars color="bg-white" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Sarah Chen
            </span>
          </div>
          <div className="absolute bottom-2 right-2">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>

        {/* Marcus Johnson */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'Marcus Johnson' ? 'ring-2 ring-[#8ab4f8]' : ''}`}
          style={{ animationDelay: '.35s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.kwame} name="Marcus Johnson" size={80} />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {activeSpeaker === 'Marcus Johnson' && <WaveBars color="bg-white" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Marcus Johnson
            </span>
          </div>
          <div className="absolute bottom-2 right-2">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>

        {/* Lira — special tile */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden flex items-center justify-center transition-all duration-500 ${liraSpeaking ? 'ld-glow ring-2 ring-sky-400/60 bg-[#1a2332]' : 'bg-[#3c4043]'}`}
          style={{ animationDelay: '.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`rounded-full transition-all duration-700 ${liraSpeaking ? 'w-28 h-28 bg-sky-400/10' : 'w-16 h-16 bg-sky-400/5'}`}
              style={{ filter: 'blur(25px)' }}
            />
          </div>
          <LiraAvatarImg size={80} speaking={liraSpeaking} whiteBg />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {liraSpeaking && <WaveBars color="bg-sky-400" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Lira
            </span>
          </div>
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-sky-400/20 border border-sky-400/30">
            <span
              className={`text-[9px] font-semibold ${liraSpeaking ? 'text-sky-300' : 'text-sky-400/50'}`}
            >
              {liraSpeaking ? 'Speaking' : 'Listening'}
            </span>
          </div>
        </div>
      </div>

      {/* Google Meet bottom control bar */}
      <div
        className="ld-fade flex items-center justify-center gap-2 py-3 bg-[#202124]"
        style={{ animationDelay: '.4s' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <MicIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <CamIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <ScreenShareIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <HandIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#ea4335] hover:bg-[#d33828] flex items-center justify-center cursor-pointer transition">
            <HangupIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 5 — MEETING ROOM (Mobile Google Meet style)                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MeetingMobileScene({ restart }: { restart: number }) {
  const [liraSpeaking, setLiraSpeaking] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<string>('')

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    MEETING_TRANSCRIPT.forEach((line) => {
      timers.push(
        setTimeout(() => {
          setLiraSpeaking(line.speaker === 'Lira')
          setActiveSpeaker(line.speaker)
        }, line.delay)
      )
    })
    timers.push(
      setTimeout(() => {
        setLiraSpeaking(false)
        setActiveSpeaker('')
      }, 14500)
    )
    return () => timers.forEach(clearTimeout)
  }, [restart])

  return (
    <div
      key={restart}
      className="w-full h-full flex items-center justify-center bg-[#0a0a0a] rounded-2xl p-8"
    >
      {/* Phone frame */}
      <div className="relative w-[320px] h-[640px] rounded-[40px] bg-[#202124] border-[6px] border-[#1a1a1a] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className="text-white/60 text-[10px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 rounded-sm border border-white/30" />
            <div className="w-1 h-1 rounded-full bg-white/30" />
          </div>
        </div>
        {/* Meeting title */}
        <div className="text-center py-2">
          <span className="text-white/50 text-[10px] font-medium bg-white/10 rounded-full px-3 py-0.5">
            Team Standup · 12:04
          </span>
        </div>
        {/* Main speaker — large */}
        <div className="px-3 relative" style={{ height: 300 }}>
          <div
            className={`relative w-full h-full rounded-2xl overflow-hidden bg-[#3c4043] flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'Lira' ? 'ring-2 ring-sky-400/50' : activeSpeaker ? 'ring-2 ring-[#8ab4f8]' : ''}`}
          >
            {activeSpeaker === 'Lira' ? (
              <LiraAvatarImg size={80} speaking={liraSpeaking} whiteBg />
            ) : (
              <FaceAvatar
                src={activeSpeaker === 'Marcus Johnson' ? FACES.kwame : FACES.adaeze}
                name={activeSpeaker || 'Sarah Chen'}
                size={80}
              />
            )}
            <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-0.5">
              {activeSpeaker && (
                <WaveBars color={activeSpeaker === 'Lira' ? 'bg-sky-400' : 'bg-white'} />
              )}
              <span className="text-[10px] text-white/80 font-medium">
                {activeSpeaker || 'Sarah Chen'}
              </span>
            </div>
          </div>
          {/* Thumbnails */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
              <img src={FACES.adaeze} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10">
              <img src={FACES.kwame} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-14 h-14 rounded-lg overflow-hidden border border-sky-400/30">
              <img src={LIRA_LOGO_WHITE_BG} alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        {/* Bottom controls */}
        <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#3c4043] px-4 py-2.5">
            <MicIcon className="w-4 h-4 text-white/80" />
            <CamIcon className="w-4 h-4 text-white/80" />
            <ScreenShareIcon className="w-4 h-4 text-white/80" />
          </div>
          <div className="w-10 h-10 rounded-full bg-[#ea4335] flex items-center justify-center">
            <HangupIcon className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 6 — INTEGRATION CASCADE                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

function IntegrationScene({ restart }: { restart: number }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1500),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 4500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [restart])
  return (
    <div
      key={restart}
      className="w-full h-full bg-[#0a0a0a] rounded-2xl flex items-center justify-center p-12"
    >
      <div className="w-full max-w-2xl space-y-5">
        <div className="ld-fade flex items-center gap-3 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <div className="h-8 w-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400 text-sm">
            &#10003;
          </div>
          <div>
            <p className="text-white text-sm font-semibold">Meeting ended — Sprint Planning</p>
            <p className="text-white/30 text-xs">
              Duration: 24 min · 3 participants · 3 action items detected
            </p>
          </div>
        </div>
        <div className="flex justify-center">
          <div
            className={`w-px transition-all duration-700 bg-gradient-to-b from-emerald-400/40 to-transparent ${step >= 1 ? 'h-8' : 'h-0'}`}
          />
        </div>
        {step >= 1 && (
          <div className="ld-slide-l">
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <span className="text-violet-400 font-bold text-sm">Li</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">Linear</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-400/10 text-violet-400">
                    Task created
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">
                  LIR-142: Complete auth service refactor
                </p>
                <p className="text-white/25 text-[11px] mt-0.5">
                  Assigned to Sarah Chen · Priority: High
                </p>
              </div>
            </div>
          </div>
        )}
        {step >= 2 && (
          <div className="ld-slide-r">
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                <span className="text-green-400 font-bold text-sm">#</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">Slack</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-400/10 text-green-400">
                    #engineering
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">
                  Meeting summary posted — 3 action items, 1 blocker flagged
                </p>
              </div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="ld-slide-up">
            <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                <ScreenShareIcon className="w-5 h-5 text-sky-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-white text-sm font-semibold">Dashboard</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400">
                    Meeting archived
                  </span>
                </div>
                <p className="text-white/50 text-xs mt-0.5">
                  Duration: 24 min · Participants: 3 · Tasks: 3
                </p>
              </div>
            </div>
          </div>
        )}
        {step >= 3 && (
          <div className="ld-fade pt-4 text-center" style={{ animationDelay: '.5s' }}>
            <p className="text-white/20 text-xs tracking-wide font-medium">
              Lira doesn&apos;t just listen — she follows through.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 7 — CONNECT INTEGRATIONS (app cards + GitHub code writing)         */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* Brand logo SVG components for integrations */
function LinearLogo() {
  return <img src="/linear-app-icon-logo.png" alt="Linear" className="h-full w-full object-cover" />
}
function SlackLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"
        fill="#E01E5A"
      />
      <path
        d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"
        fill="#36C5F0"
      />
      <path
        d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"
        fill="#2EB67D"
      />
      <path
        d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z"
        fill="#ECB22E"
      />
    </svg>
  )
}
function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
function GitHubLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#24292e">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}
function GreenhouseLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <circle cx="12" cy="12" r="11" fill="#24a47f" />
      <path
        d="M12 6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm0 10c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"
        fill="white"
      />
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  )
}
function HubSpotLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M17.58 11.09V7.56a2.13 2.13 0 0 0 1.23-1.92 2.15 2.15 0 0 0-2.15-2.15 2.15 2.15 0 0 0-2.15 2.15c0 .84.48 1.57 1.19 1.92v3.53a5.15 5.15 0 0 0-2.3 1.18l-6.08-4.73a2.39 2.39 0 0 0 .07-.55 2.34 2.34 0 1 0-2.34 2.34c.5 0 .96-.16 1.35-.42l5.96 4.64a5.17 5.17 0 0 0-.44 2.07 5.22 5.22 0 0 0 5.22 5.22 5.22 5.22 0 0 0 5.22-5.22 5.22 5.22 0 0 0-4.78-5.19zm-.92 7.73a2.54 2.54 0 1 1 0-5.08 2.54 2.54 0 0 1 0 5.08z"
        fill="#FF7A59"
      />
    </svg>
  )
}
function SalesforceLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M10.006 5.17a4.162 4.162 0 0 1 3.02-1.3 4.18 4.18 0 0 1 3.86 2.59 5.01 5.01 0 0 1 1.95-.4c2.78 0 5.04 2.26 5.04 5.05 0 2.78-2.26 5.04-5.04 5.04-.44 0-.87-.06-1.28-.16a3.7 3.7 0 0 1-3.28 2h-.12a3.7 3.7 0 0 1-2.53-1 4.42 4.42 0 0 1-2.9 1.08c-2.22 0-4.06-1.62-4.42-3.74a4.22 4.22 0 0 1-.6.04 4.22 4.22 0 0 1-4.22-4.22c0-1.78 1.1-3.3 2.66-3.93a4.3 4.3 0 0 1-.14-1.07A4.22 4.22 0 0 1 6.38.87a4.22 4.22 0 0 1 3.63 4.3z"
        fill="#00A1E0"
      />
    </svg>
  )
}
function TeamsLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path
        d="M20.625 8.25h-3.375V6.375a1.125 1.125 0 0 0-1.125-1.125h-4.5A1.125 1.125 0 0 0 10.5 6.375V8.25H9.375"
        fill="none"
      />
      <rect x="1.5" y="7.5" width="12" height="9" rx="1" fill="#5059C9" />
      <path d="M8.25 10.5v3.75" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5.25 10.5v3.75" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="17.25" cy="5.25" r="2.25" fill="#5059C9" />
      <circle cx="13.5" cy="4.5" r="3" fill="#7B83EB" />
      <path
        d="M19.5 9h-4.125a.375.375 0 0 0-.375.375v5.25A2.625 2.625 0 0 0 17.625 17.25h.75A2.625 2.625 0 0 0 21 14.625V10.5A1.5 1.5 0 0 0 19.5 9z"
        fill="#5059C9"
      />
      <path
        d="M16.5 9H9.375a.375.375 0 0 0-.375.375v6A3.375 3.375 0 0 0 12.375 18.75h.75A3.375 3.375 0 0 0 16.5 15.375V9z"
        fill="#7B83EB"
      />
    </svg>
  )
}

const INTEGRATIONS = [
  { name: 'Linear', logo: LinearLogo, connected: true },
  { name: 'Slack', logo: SlackLogo, connected: true },
  { name: 'Google', logo: GoogleLogo, connected: true },
  { name: 'GitHub', logo: GitHubLogo, connected: false },
  { name: 'Greenhouse', logo: GreenhouseLogo, connected: false },
  { name: 'HubSpot', logo: HubSpotLogo, connected: false },
  { name: 'Salesforce', logo: SalesforceLogo, connected: false },
  { name: 'Teams', logo: TeamsLogo, connected: false },
]

// Syntax highlight helpers — use inline styles so Tailwind JIT isn't needed
const kw = { color: '#c678dd' } // keyword (import, export, const, await)
const fn = { color: '#61afef' } // function name
const vr = { color: '#e06c75' } // variable / parameter
const tp = { color: '#e5c07b' } // type / destructured
const st = { color: '#98c379' } // string literal
const op = { color: '#56b6c2' } // operator
const nr = { color: '#d19a66' } // number / boolean
const cm = { color: '#7f848e' } // comment
const tx = { color: '#abb2bf' } // plain text / punctuation

const CODE_LINES: React.ReactNode[] = [
  <>
    <span style={kw}>import</span> <span style={tp}>{'{ Octokit }'}</span>{' '}
    <span style={kw}>from</span> <span style={st}>"@octokit/rest"</span>
    <span style={tx}>;</span>
  </>,
  <>
    <span style={kw}>import</span>{' '}
    <span style={tp}>{'{ generatePRDescription, analyzeDiff }'}</span> <span style={kw}>from</span>{' '}
    <span style={st}>"./ai-utils"</span>
    <span style={tx}>;</span>
  </>,
  <></>,
  <>
    <span style={kw}>export</span> <span style={kw}>async function</span>{' '}
    <span style={fn}>createPullRequest</span>
    <span style={tx}>(</span>
  </>,
  <>
    <span style={vr}> repo</span>
    <span style={tx}>:</span> <span style={tp}>string</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> branch</span>
    <span style={tx}>:</span> <span style={tp}>string</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> context</span>
    <span style={tx}>:</span> <span style={tp}>TaskContext</span>
  </>,
  <>
    <span style={tx}>{')'}</span> <span style={tx}>{'{'}</span>
  </>,
  <>
    <span style={kw}> const</span> <span style={vr}>octokit</span> <span style={op}>=</span>{' '}
    <span style={fn}>getOctokitClient</span>
    <span style={tx}>();</span>
  </>,
  <>
    <span style={kw}> const</span> <span style={vr}>files</span> <span style={op}>=</span>{' '}
    <span style={kw}>await</span> <span style={vr}>context</span>
    <span style={tx}>.</span>
    <span style={fn}>getModifiedFiles</span>
    <span style={tx}>();</span>
  </>,
  <></>,
  <>
    <span style={cm}> {'// Analyze changes and generate smart commit messages'}</span>
  </>,
  <>
    <span style={kw}> const</span> <span style={vr}>analysis</span> <span style={op}>=</span>{' '}
    <span style={kw}>await</span> <span style={fn}>analyzeDiff</span>
    <span style={tx}>(</span>
    <span style={vr}>files</span>
    <span style={tx}>, {'{'}</span>
  </>,
  <>
    <span style={vr}> model</span>
    <span style={tx}>:</span> <span style={st}>"gpt-4-turbo"</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> includeTests</span>
    <span style={tx}>:</span> <span style={nr}>true</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> maxTokens</span>
    <span style={tx}>:</span> <span style={nr}>4096</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={tx}> {'}'});</span>
  </>,
  <></>,
  <>
    <span style={kw}> const</span> <span style={tx}>{'{'}</span> <span style={vr}>data</span>
    <span style={tx}>:</span> <span style={vr}>pr</span> <span style={tx}>{'}'}</span>{' '}
    <span style={op}>=</span> <span style={kw}>await</span> <span style={vr}>octokit</span>
    <span style={tx}>.</span>
    <span style={vr}>pulls</span>
    <span style={tx}>.</span>
    <span style={fn}>create</span>
    <span style={tx}>({'{'}</span>
  </>,
  <>
    <span style={vr}> owner</span>
    <span style={tx}>:</span> <span style={vr}>org</span>
    <span style={tx}>.</span>
    <span style={vr}>githubOrg</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> repo</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> title</span>
    <span style={tx}>:</span> <span style={st}>{'`feat: ${context.taskTitle}`'}</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> head</span>
    <span style={tx}>:</span> <span style={vr}>branch</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> base</span>
    <span style={tx}>:</span> <span style={st}>"main"</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> body</span>
    <span style={tx}>:</span> <span style={fn}>generatePRDescription</span>
    <span style={tx}>(</span>
    <span style={vr}>analysis</span>
    <span style={tx}>),</span>
  </>,
  <>
    <span style={tx}> {'}'});</span>
  </>,
  <></>,
  <>
    <span style={cm}> {'// Auto-assign reviewers based on code ownership'}</span>
  </>,
  <>
    <span style={kw}> const</span> <span style={vr}>reviewers</span> <span style={op}>=</span>{' '}
    <span style={kw}>await</span> <span style={fn}>getCodeOwners</span>
    <span style={tx}>(</span>
    <span style={vr}>files</span>
    <span style={tx}>);</span>
  </>,
  <>
    <span style={kw}> await</span> <span style={vr}>octokit</span>
    <span style={tx}>.</span>
    <span style={vr}>pulls</span>
    <span style={tx}>.</span>
    <span style={fn}>requestReviewers</span>
    <span style={tx}>({'{'}</span>
  </>,
  <>
    <span style={vr}> owner</span>
    <span style={tx}>:</span> <span style={vr}>org</span>
    <span style={tx}>.</span>
    <span style={vr}>githubOrg</span>
    <span style={tx}>,</span> <span style={vr}>repo</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> pull_number</span>
    <span style={tx}>:</span> <span style={vr}>pr</span>
    <span style={tx}>.</span>
    <span style={vr}>number</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={vr}> reviewers</span>
    <span style={tx}>,</span>
  </>,
  <>
    <span style={tx}> {'}'});</span>
  </>,
  <></>,
  <>
    <span style={kw}> return</span> <span style={tx}>{'{'}</span> <span style={vr}>pr</span>
    <span style={tx}>,</span> <span style={vr}>analysis</span>
    <span style={tx}>,</span> <span style={vr}>reviewers</span> <span style={tx}>{'}'}</span>
    <span style={tx}>;</span>
  </>,
  <>
    <span style={tx}>{'}'}</span>
  </>,
]

function IntegrationsConnectScene({ restart }: { restart: number }) {
  const [connectingIdx, setConnectingIdx] = useState<number | null>(null)
  const [connectedSet, setConnectedSet] = useState<Set<number>>(new Set([0, 1, 2]))
  const [showCode, setShowCode] = useState(false)
  const [codeLines, setCodeLines] = useState(0)
  const [cursorPhase, setCursorPhase] = useState<'idle' | 'moving' | 'clicking' | 'done'>('idle')
  const githubCardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setConnectingIdx(null)
    setConnectedSet(new Set([0, 1, 2]))
    setShowCode(false)
    setCodeLines(0)
    setCursorPhase('idle')
    setCursorPos({ x: 0, y: 0 })

    const timers = [
      // Cursor starts moving toward GitHub card
      setTimeout(() => {
        setCursorPhase('moving')
        if (githubCardRef.current && containerRef.current) {
          const cardRect = githubCardRef.current.getBoundingClientRect()
          const containerRect = containerRef.current.getBoundingClientRect()
          setCursorPos({
            x: cardRect.left - containerRect.left + cardRect.width / 2,
            y: cardRect.top - containerRect.top + cardRect.height - 16,
          })
        }
      }, 1200),
      // Cursor clicks
      setTimeout(() => setCursorPhase('clicking'), 2200),
      // Start connecting
      setTimeout(() => {
        setConnectingIdx(3)
        setCursorPhase('done')
      }, 2500),
      // Connected
      setTimeout(() => {
        setConnectedSet(new Set([0, 1, 2, 3]))
        setConnectingIdx(null)
      }, 4000),
      // Show code writing
      setTimeout(() => setShowCode(true), 5000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [restart])

  // Animate code lines appearing
  useEffect(() => {
    if (!showCode) return
    let line = 0
    const id = setInterval(() => {
      line++
      setCodeLines(line)
      if (line >= CODE_LINES.length) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [showCode])

  return (
    <div
      key={restart}
      ref={containerRef}
      className="w-full h-full bg-[#ebebeb] rounded-2xl p-8 flex flex-col gap-6 overflow-hidden relative"
    >
      {/* Animated cursor */}
      {cursorPhase !== 'idle' && cursorPhase !== 'done' && (
        <div
          className="absolute z-50 pointer-events-none"
          style={{
            left: cursorPhase === 'moving' || cursorPhase === 'clicking' ? cursorPos.x : 60,
            top: cursorPhase === 'moving' || cursorPhase === 'clicking' ? cursorPos.y : 60,
            transition:
              cursorPhase === 'moving'
                ? 'left 0.9s cubic-bezier(0.4,0,0.2,1), top 0.9s cubic-bezier(0.4,0,0.2,1)'
                : 'none',
            transform: cursorPhase === 'clicking' ? 'scale(0.85)' : 'scale(1)',
          }}
        >
          <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
            <path
              d="M2 1L2 17L6.5 13L11 20L14 18.5L9.5 11.5L15 10.5L2 1Z"
              fill="white"
              stroke="black"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {cursorPhase === 'clicking' && (
            <div className="absolute top-0 left-0 w-6 h-6 rounded-full bg-sky-400/30 animate-ping" />
          )}
        </div>
      )}
      {/* Integration cards grid */}
      <div>
        <h3 className="ld-fade text-lg font-bold text-gray-900 mb-1">Connected Integrations</h3>
        <p className="ld-fade text-xs text-gray-400 mb-4" style={{ animationDelay: '.1s' }}>
          Lira connects to your tools and takes action automatically
        </p>
        <div className="grid grid-cols-4 gap-3">
          {INTEGRATIONS.map((intg, i) => {
            const isConnected = connectedSet.has(i)
            const isConnecting = connectingIdx === i
            const LogoComp = intg.logo
            return (
              <div
                key={intg.name}
                ref={i === 3 ? githubCardRef : undefined}
                className="ld-rise bg-white rounded-xl border border-gray-200/60 p-4 transition-all hover:shadow-md"
                style={{ animationDelay: `${0.1 + i * 0.08}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-9 w-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                    <LogoComp />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{intg.name}</span>
                </div>
                {isConnecting ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
                    <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Connecting...
                  </div>
                ) : isConnected ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                    <div className="h-2 w-2 rounded-full bg-emerald-400" /> Connected
                  </div>
                ) : (
                  <div className="text-[11px] text-[#3730a3] font-medium cursor-pointer hover:underline">
                    Connect
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* GitHub code writing demo */}
      {showCode && (
        <div className="ld-rise flex-1 bg-white rounded-xl border border-gray-200/60 overflow-hidden shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50">
            <div className="h-6 w-6 rounded bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
              <GitHubLogo />
            </div>
            <span className="text-gray-700 text-xs font-medium">
              Lira writing code via GitHub integration
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200">
              Live
            </span>
          </div>
          <div
            className="p-4 font-mono text-[11px] leading-[1.7] rounded-b-xl overflow-y-auto"
            style={{ background: '#282c34', maxHeight: 320 }}
          >
            {CODE_LINES.slice(0, codeLines).map((line, i) => (
              <div key={i} className="ld-transcript flex">
                <span
                  className="w-7 text-right mr-4 select-none shrink-0"
                  style={{ color: '#636d83' }}
                >
                  {i + 1}
                </span>
                <span>{line}</span>
              </div>
            ))}
            {codeLines < CODE_LINES.length && (
              <div className="flex">
                <span className="w-7 text-right mr-4" style={{ color: '#636d83' }}>
                  {codeLines + 1}
                </span>
                <span className="ld-blink text-sky-400">|</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 8 — INTERVIEW REPORT                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function InterviewScene({ restart }: { restart: number }) {
  const [showScores, setShowScores] = useState(false)
  const [showVerdict, setShowVerdict] = useState(false)
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowScores(true), 800),
      setTimeout(() => setShowVerdict(true), 2800),
    ]
    return () => timers.forEach(clearTimeout)
  }, [restart])
  const scores = [
    { label: 'Technical Depth', score: 82, color: 'bg-[#3730a3]' },
    { label: 'Communication', score: 74, color: 'bg-sky-500' },
    { label: 'Problem Solving', score: 80, color: 'bg-violet-500' },
    { label: 'Culture Fit', score: 72, color: 'bg-amber-500' },
    { label: 'Leadership', score: 81, color: 'bg-fuchsia-500' },
  ]
  const candidates = [
    { name: 'Emma Wilson', score: 84, status: 'Recommended' },
    { name: 'James Park', score: 78, status: 'Recommended' },
    { name: 'Aisha Patel', score: 71, status: 'Review' },
    { name: 'Carlos Mendez', score: 68, status: 'Declined' },
    { name: 'Yuki Tanaka', score: 88, status: 'Recommended' },
    { name: 'David Kim', score: 65, status: 'Declined' },
  ]
  return (
    <div
      key={restart}
      className="w-full h-full bg-[#ebebeb] rounded-2xl p-8 flex gap-6 overflow-hidden"
    >
      <div
        className="ld-rise w-56 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200/60 p-4"
        style={{ animationDelay: '.1s' }}
      >
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Candidates ({candidates.length})
        </h4>
        <div className="space-y-1.5">
          {candidates.map((c, i) => (
            <div
              key={c.name}
              className={`ld-fade flex items-center gap-2.5 rounded-lg px-3 py-2 cursor-pointer transition ${i === 0 ? 'bg-[#3730a3]/5 border border-[#3730a3]/10' : 'hover:bg-gray-50'}`}
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <FaceAvatar src={i % 2 === 0 ? FACES.adaeze : FACES.kwame} name={c.name} size={28} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">{c.name}</p>
                <p
                  className={`text-[10px] font-medium ${c.status === 'Recommended' ? 'text-emerald-500' : c.status === 'Review' ? 'text-amber-500' : 'text-gray-400'}`}
                >
                  {c.score}/100 · {c.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div
        className="flex-1 ld-rise bg-white rounded-2xl shadow-sm border border-gray-200/60 p-8 overflow-hidden"
        style={{ animationDelay: '.2s' }}
      >
        <div className="flex items-start justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Interview Evaluation</h3>
            <p className="text-sm text-gray-400">Senior Frontend Engineer · Conducted by Lira</p>
          </div>
          <div className="flex items-center gap-3">
            <FaceAvatar src={FACES.alex} name="Emma Wilson" size={40} />
            <div>
              <p className="text-sm font-semibold text-gray-900">Emma Wilson</p>
              <p className="text-xs text-gray-400">42 min · March 28, 2026</p>
            </div>
          </div>
        </div>
        <div
          className="ld-fade flex items-center gap-4 mb-8 p-4 rounded-xl bg-gray-50 border border-gray-100"
          style={{ animationDelay: '.4s' }}
        >
          <div className="text-4xl font-black text-[#3730a3]">
            {showScores ? <AnimatedCounter target={84} /> : '—'}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Overall Score</p>
            <p className="text-xs text-gray-400">Based on 5 evaluation criteria</p>
          </div>
        </div>
        <div className="space-y-4 mb-8">
          {scores.map((s, i) => (
            <div key={s.label} className="ld-fade" style={{ animationDelay: `${0.6 + i * 0.15}s` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{s.label}</span>
                <span className="text-sm font-bold text-gray-900">
                  {showScores ? s.score : '—'}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                {showScores && (
                  <div
                    className={`h-full rounded-full ld-fill ${s.color}`}
                    style={
                      {
                        '--fill': `${s.score}%`,
                        animationDelay: `${0.8 + i * 0.15}s`,
                      } as React.CSSProperties
                    }
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        {showVerdict && (
          <div className="ld-rise flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <LiraAvatarImg size={24} />
              <div>
                <p className="text-sm font-bold text-emerald-800">Recommended for Next Round</p>
                <p className="text-xs text-emerald-600">
                  Strong technical depth with clear communication. Proceed to on-site.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 9 — SALES COACHING                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function SalesCoachingScene({ restart }: { restart: number }) {
  const [showCoach, setShowCoach] = useState(false)
  const [showSuggestion, setShowSuggestion] = useState(false)
  const [activeSpeaker, setActiveSpeaker] = useState<'prospect' | 'you' | ''>('')
  useEffect(() => {
    const timers = [
      setTimeout(() => setActiveSpeaker('prospect'), 600),
      setTimeout(() => setShowCoach(true), 1800),
      setTimeout(() => setShowSuggestion(true), 3500),
      setTimeout(() => setActiveSpeaker('you'), 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [restart])
  return (
    <div
      key={restart}
      className="w-full h-full bg-[#202124] rounded-2xl overflow-hidden flex flex-col relative"
    >
      {/* Header */}
      <div className="ld-fade flex items-center justify-between px-4 py-2 bg-[#202124]">
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm font-medium">Acme Corp — Discovery Call</span>
          <span className="text-white/30 text-xs">|</span>
          <span className="text-white/40 text-xs">15:42</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <PeopleIcon className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-xs">2</span>
          </div>
          <ChatIcon className="w-4 h-4 text-white/50" />
        </div>
      </div>

      {/* Video grid — 2 tiles */}
      <div className="flex-1 p-3 grid grid-cols-2 gap-3">
        {/* Prospect */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'prospect' ? 'ring-2 ring-[#8ab4f8]' : ''}`}
          style={{ animationDelay: '.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.adaeze} name="Jennifer Hayes" size={80} />
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            {activeSpeaker === 'prospect' && <WaveBars color="bg-white" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Jennifer Hayes
            </span>
          </div>
          <div className="absolute bottom-2.5 right-2.5">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>
        {/* You */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center transition-all duration-300 ${activeSpeaker === 'you' ? 'ring-2 ring-[#8ab4f8]' : ''}`}
          style={{ animationDelay: '.35s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.kwame} name="Alex Reid" size={80} />
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            {activeSpeaker === 'you' && <WaveBars color="bg-white" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              You
            </span>
          </div>
          <div className="absolute bottom-2.5 right-2.5">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>
      </div>

      {/* Glassmorphic Lira coaching bar — bottom overlay */}
      {showCoach && (
        <div className="absolute bottom-16 left-3 right-3 ld-fade z-10">
          <div
            className="rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{
              background: 'rgba(15, 20, 35, 0.65)',
              backdropFilter: 'blur(24px) saturate(1.6)',
            }}
          >
            <div className="flex items-center gap-2.5 px-4 py-2 border-b border-white/[0.06]">
              <LiraAvatarImg size={22} speaking={showSuggestion} />
              <span className="text-white text-[11px] font-bold">Lira Sales Coach</span>
              <div className="ml-auto flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-sky-400 ld-dot-pulse" />
                <span className="text-sky-400/70 text-[10px] font-medium">Live</span>
              </div>
            </div>
            <div className="px-4 py-3 flex gap-4">
              {/* Detected */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400 text-[10px] font-semibold uppercase tracking-wide">
                    Detected
                  </span>
                </div>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Prospect raised a{' '}
                  <span className="text-amber-300 font-medium">pricing objection</span> — comparing
                  to CompetitorX
                </p>
              </div>
              {/* Divider */}
              <div className="w-px bg-white/[0.06]" />
              {/* Suggested reply */}
              {showSuggestion && (
                <div className="flex-1 ld-fade">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span className="text-sky-400 text-[10px] font-semibold uppercase tracking-wide">
                      Say This
                    </span>
                  </div>
                  <p className="text-white text-[11px] leading-relaxed">
                    &quot;We help teams like yours eliminate 12+ hours per week of manual follow-up
                    — that&apos;s $180K/year in recovered productivity.&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-2 py-3 bg-[#202124]">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <MicIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <CamIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <ScreenShareIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#ea4335] hover:bg-[#d33828] flex items-center justify-center cursor-pointer transition">
            <HangupIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 10 — CUSTOMER SUPPORT (Desktop)                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

const SUPPORT_CONVO = [
  {
    sender: 'customer',
    name: 'Sarah Mitchell',
    text: "Hi, I can't reset my password and I'm locked out of my account.",
  },
  {
    sender: 'lira',
    name: 'Lira',
    text: 'I can help with that, Sarah. I can see your account is in a locked state after 3 failed attempts. Let me unlock it and send a password reset link.',
  },
  {
    sender: 'customer',
    name: 'Sarah Mitchell',
    text: 'That was fast! Can you also update my email to my work address?',
  },
  {
    sender: 'lira',
    name: 'Lira',
    text: "Done! I've sent a verification link to your new work email. Once you confirm it, your account email will be updated. Is there anything else?",
  },
  { sender: 'customer', name: 'Sarah Mitchell', text: "No, that's everything. Thanks!" },
  {
    sender: 'lira',
    name: 'Lira',
    text: "You're welcome, Sarah! Your account is fully restored. Have a great day.",
  },
]

function useSupportChat(restart: number) {
  const [messages, setMessages] = useState(0)
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    let delay = 800
    SUPPORT_CONVO.forEach((msg, i) => {
      if (msg.sender === 'lira') {
        timers.push(setTimeout(() => setTyping(true), delay))
        delay += 1500
        timers.push(
          setTimeout(() => {
            setTyping(false)
            setMessages(i + 1)
          }, delay)
        )
        delay += 1000
      } else {
        timers.push(setTimeout(() => setMessages(i + 1), delay))
        delay += 1800
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [restart])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])
  return { messages, typing, scrollRef }
}

/* ─── Lira Speaking (center in Meet) ─────────────────────────────────────── */

function LiraSpeakingScene({ restart }: { restart: number }) {
  const [liraSpeaking, setLiraSpeaking] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLiraSpeaking(true), 800)
    return () => clearTimeout(t)
  }, [restart])
  return (
    <div
      key={restart}
      className="w-full h-full bg-[#202124] rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Google Meet header bar */}
      <div className="ld-fade flex items-center justify-between px-4 py-2 bg-[#202124]">
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm font-medium">Lira Weekly Standup</span>
          <span className="text-white/30 text-xs">|</span>
          <span className="text-white/40 text-xs">08:32 AM</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <PeopleIcon className="w-4 h-4 text-white/50" />
            <span className="text-white/50 text-xs">3</span>
          </div>
          <ChatIcon className="w-4 h-4 text-white/50" />
        </div>
      </div>

      {/* Participant grid — 3 tiles, same style as MeetingScene */}
      <div className="flex-1 p-3 grid grid-cols-3 grid-rows-1 gap-3 bg-[#202124]">
        {/* Adaeze Obi — left */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center`}
          style={{ animationDelay: '.2s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.adaeze} name="Adaeze Obi" size={80} />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Adaeze Obi
            </span>
          </div>
          <div className="absolute bottom-2 right-2">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>

        {/* Lira — center, active speaker */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden flex items-center justify-center transition-all duration-500 ${liraSpeaking ? 'ld-glow ring-2 ring-sky-400/60 bg-[#1a2332]' : 'bg-[#3c4043]'}`}
          style={{ animationDelay: '.35s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className={`rounded-full transition-all duration-700 ${liraSpeaking ? 'w-28 h-28 bg-sky-400/10' : 'w-16 h-16 bg-sky-400/5'}`}
              style={{ filter: 'blur(25px)' }}
            />
          </div>
          <LiraAvatarImg size={80} speaking={liraSpeaking} whiteBg />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            {liraSpeaking && <WaveBars color="bg-sky-400" />}
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Lira
            </span>
          </div>
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-sky-400/20 border border-sky-400/30">
            <span
              className={`text-[9px] font-semibold ${liraSpeaking ? 'text-sky-300' : 'text-sky-400/50'}`}
            >
              {liraSpeaking ? 'Speaking' : 'Listening'}
            </span>
          </div>
        </div>

        {/* Kwame Asante — right */}
        <div
          className={`ld-rise relative rounded-xl overflow-hidden bg-[#3c4043] flex items-center justify-center`}
          style={{ animationDelay: '.5s' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          <FaceAvatar src={FACES.kwame} name="Kwame Asante" size={80} />
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <span className="text-white text-xs font-medium bg-black/40 px-1.5 py-0.5 rounded">
              Kwame Asante
            </span>
          </div>
          <div className="absolute bottom-2 right-2">
            <MicIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        </div>
      </div>

      {/* Google Meet bottom control bar */}
      <div
        className="ld-fade flex items-center justify-center gap-2 py-3 bg-[#202124]"
        style={{ animationDelay: '.4s' }}
      >
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <MicIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <CamIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <ScreenShareIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#3c4043] hover:bg-[#4a4d51] flex items-center justify-center cursor-pointer transition">
            <HandIcon className="w-5 h-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-[#ea4335] hover:bg-[#d33828] flex items-center justify-center cursor-pointer transition">
            <HangupIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CustomerSupportScene({ restart }: { restart: number }) {
  const { messages, typing, scrollRef } = useSupportChat(restart)
  return (
    <div
      key={restart}
      className="w-full h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-lg border border-gray-200/60"
    >
      <div className="ld-fade flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <LiraAvatarImg size={36} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900">Lira Support</h3>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] text-emerald-600 font-medium">Online</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">AI-powered support · Avg response: &lt;2s</p>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-semibold text-gray-500">
          Ticket #4,891
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 scrollbar-none"
      >
        <div className="ld-fade text-center">
          <span className="text-[10px] text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
            Conversation started · March 28, 2026
          </span>
        </div>
        {SUPPORT_CONVO.slice(0, messages).map((msg, i) => (
          <div
            key={i}
            className={`ld-bubble flex gap-3 ${msg.sender === 'customer' ? '' : 'flex-row-reverse'}`}
          >
            {msg.sender === 'customer' ? (
              <FaceAvatar src={FACES.alex} name={msg.name} size={32} />
            ) : (
              <LiraAvatarImg size={32} />
            )}
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender === 'customer' ? 'bg-white border border-gray-200 text-gray-800' : 'bg-[#3730a3] text-white'}`}
            >
              <p className="text-xs leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {typing && (
          <div className="ld-fade flex gap-3 flex-row-reverse">
            <LiraAvatarImg size={32} />
            <div className="bg-[#3730a3]/10 border border-[#3730a3]/20 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-[#3730a3]/40 ld-dot-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 rounded-xl border border-gray-200 bg-gray-50 px-4 flex items-center">
            <span className="text-sm text-gray-300">Type a message...</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#3730a3] flex items-center justify-center text-white cursor-pointer">
            <span className="text-sm">&#8593;</span>
          </div>
        </div>
      </div>
      <div
        className="ld-fade px-6 py-2.5 bg-gray-50 border-t border-gray-100 flex items-center gap-6"
        style={{ animationDelay: '1s' }}
      >
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <span className="text-emerald-400">&#9679;</span> Resolved in 48s
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          Grounded · 3 KB articles used
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          CSAT: Predicted 5/5
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* SCENE 11 — CUSTOMER SUPPORT (Mobile)                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

function CustomerSupportMobileScene({ restart }: { restart: number }) {
  const { messages, typing, scrollRef } = useSupportChat(restart)
  return (
    <div
      key={restart}
      className="w-full h-full flex items-center justify-center bg-[#0a0a0a] rounded-2xl p-8"
    >
      <div className="relative w-[320px] h-[640px] rounded-[40px] bg-white border-[6px] border-[#1a1a1a] shadow-[0_30px_80px_rgba(0,0,0,.6)] overflow-hidden flex flex-col">
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-white">
          <span className="text-gray-900 text-[10px] font-semibold">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 rounded-sm border border-gray-400" />
            <div className="w-1 h-1 rounded-full bg-gray-400" />
          </div>
        </div>
        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100 bg-white">
          <LiraAvatarImg size={28} />
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-900">Lira Support</p>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[9px] text-emerald-600">Online</span>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50/50 scrollbar-none"
        >
          {SUPPORT_CONVO.slice(0, messages).map((msg, i) => (
            <div
              key={i}
              className={`ld-bubble flex gap-2 ${msg.sender === 'customer' ? '' : 'flex-row-reverse'}`}
            >
              {msg.sender === 'customer' ? (
                <FaceAvatar src={FACES.alex} name={msg.name} size={24} />
              ) : (
                <LiraAvatarImg size={24} />
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 ${msg.sender === 'customer' ? 'bg-white border border-gray-200 text-gray-800' : 'bg-[#3730a3] text-white'}`}
              >
                <p className="text-[10px] leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {typing && (
            <div className="ld-fade flex gap-2 flex-row-reverse">
              <LiraAvatarImg size={24} />
              <div className="bg-[#3730a3]/10 border border-[#3730a3]/20 rounded-2xl px-3 py-2">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1 w-1 rounded-full bg-[#3730a3]/40 ld-dot-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Input */}
        <div className="px-3 py-3 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-8 rounded-full border border-gray-200 bg-gray-50 px-3 flex items-center">
              <span className="text-[10px] text-gray-300">Message...</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-[#3730a3] flex items-center justify-center text-white">
              <span className="text-xs">&#8593;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/* MAIN PAGE LAYOUT                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function LaunchDemoPage() {
  const [activeScene, setActiveScene] = useState<SceneId>('dashboard')
  const [restartKey, setRestartKey] = useState(0)

  const handleSceneChange = useCallback((id: SceneId) => {
    setActiveScene(id)
    setRestartKey((k) => k + 1)
  }, [])
  const handleReplay = useCallback(() => setRestartKey((k) => k + 1), [])

  const renderScene = () => {
    switch (activeScene) {
      case 'dashboard':
        return <DashboardScene restart={restartKey} />
      case 'deploy-animated':
        return <DeployAnimatedScene restart={restartKey} />
      case 'deploy':
        return <BotDeployScene restart={restartKey} />
      case 'meeting':
        return <MeetingScene restart={restartKey} />
      case 'meeting-mobile':
        return <MeetingMobileScene restart={restartKey} />
      case 'integrations':
        return <IntegrationScene restart={restartKey} />
      case 'integrations-connect':
        return <IntegrationsConnectScene restart={restartKey} />
      case 'interview':
        return <InterviewScene restart={restartKey} />
      case 'sales':
        return <SalesCoachingScene restart={restartKey} />
      case 'lira-speaking':
        return <LiraSpeakingScene restart={restartKey} />
      case 'support':
        return <CustomerSupportScene restart={restartKey} />
      case 'support-mobile':
        return <CustomerSupportMobileScene restart={restartKey} />
    }
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <style>{GLOBAL_STYLES}</style>
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#111] border-r border-white/[0.06] flex flex-col">
        <div className="px-5 py-5 border-b border-white/[0.06] flex items-center gap-2">
          <img src={LIRA_LOGO} alt="" className="w-5 h-5 invert" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Launch Demo</h1>
            <p className="text-[10px] text-white/30 mt-0.5">Screen-record each scene</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto scrollbar-none">
          {SCENES.map((scene, i) => (
            <button
              key={scene.id}
              onClick={() => handleSceneChange(scene.id)}
              className={`w-full text-left px-3.5 py-3 rounded-xl transition-all ${activeScene === scene.id ? 'bg-white/[0.08] border border-white/[0.06]' : 'hover:bg-white/[0.04]'}`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] text-white/20 font-mono w-5">{i + 1}</span>
                <div>
                  <p
                    className={`text-xs font-semibold ${activeScene === scene.id ? 'text-white' : 'text-white/60'}`}
                  >
                    {scene.label}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">{scene.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleReplay}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white/60 hover:text-white transition"
          >
            &#8634; Replay Animation
          </button>
        </div>
      </aside>
      {/* Main canvas */}
      <main className="flex-1 p-6 overflow-hidden relative">
        <div className="w-full h-full">{renderScene()}</div>
      </main>
    </div>
  )
}

export default LaunchDemoPage
