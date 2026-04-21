import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SEO } from '@/components/SEO'
import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  HeartIcon,
  LightBulbIcon,
  LockClosedIcon,
  MicrophoneIcon,
  ServerStackIcon,
  ShieldCheckIcon,
  SparklesIcon,
  VideoCameraIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { MarketingNavbar, MarketingFooter } from '@/components/marketing'

// ─── Meeting Demo ─────────────────────────────────────────────────────────────

const MEETING_DEMO_STYLES = `
  @keyframes meetWave{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
  @keyframes meetPulse{0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.55)}50%{box-shadow:0 0 0 10px rgba(139,92,246,0)}}
  @keyframes meetPulseBlue{0%,100%{box-shadow:0 0 0 0 rgba(66,133,244,.6)}50%{box-shadow:0 0 0 10px rgba(66,133,244,0)}}
  .meet-wave{animation:meetWave .6s ease-in-out infinite}
  .meet-pulse{animation:meetPulse 1.4s ease-in-out infinite}
  .meet-pulse-blue{animation:meetPulseBlue 1.4s ease-in-out infinite}
  @keyframes tabProgress{from{width:0}to{width:100%}}
  @keyframes demoFadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
  .demo-fade-in{animation:demoFadeIn .3s ease-out}
  @keyframes aiBounce{
    0%{transform:rotate(-1.8deg) translateY(-340px) scale(1,1);opacity:0}
    5%{opacity:1}
    40%{transform:rotate(-1.8deg) translateY(4px) scale(1.22,0.78);}
    52%{transform:rotate(-1.8deg) translateY(-68px) scale(0.93,1.12);}
    65%{transform:rotate(-1.8deg) translateY(4px) scale(1.12,0.89);}
    74%{transform:rotate(-1.8deg) translateY(-22px) scale(0.97,1.05);}
    83%{transform:rotate(-1.8deg) translateY(4px) scale(1.05,0.96);}
    90%{transform:rotate(-1.8deg) translateY(-6px) scale(1,1);}
    100%{transform:rotate(-1.8deg) translateY(4px) scale(1,1);}
  }
  .ai-badge{animation:aiBounce 1.15s linear 0.1s both}
`

function WaveBars() {
  return (
    <div className="flex items-end gap-[2px] h-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="meet-wave w-[2.5px] h-full rounded-full bg-green-400 origin-bottom"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  )
}

type DemoMode = 'support' | 'meetings' | 'sales'
const DEMO_MODES: DemoMode[] = ['support', 'meetings', 'sales']
const ROTATE_MS = 10000
const PAUSE_MS = 20000

const SUPPORT_MSGS = [
  {
    sender: 'Sarah M.',
    text: "Hi, I can't access my account after the recent update.",
    isCustomer: true,
  },
  {
    sender: 'Lira',
    text: 'I can see your account, Sarah. The recent migration affected your login. Let me fix that right now.',
    isCustomer: false,
  },
  { sender: 'Sarah M.', text: 'That was fast! Can you also update my email?', isCustomer: true },
  {
    sender: 'Lira',
    text: "Done! I've updated your email and reactivated your access. You're all set.",
    isCustomer: false,
  },
]

function MeetingDemo() {
  const [mode, setMode] = useState<DemoMode>('support')
  const [phase, setPhase] = useState(0)
  const [userClicked, setUserClicked] = useState(false)
  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Auto-rotate tabs
  useEffect(() => {
    if (userClicked) return
    const id = setTimeout(() => {
      setMode((prev) => DEMO_MODES[(DEMO_MODES.indexOf(prev) + 1) % DEMO_MODES.length])
    }, ROTATE_MS)
    return () => clearTimeout(id)
  }, [mode, userClicked])

  // Resume auto-rotation after manual click
  useEffect(() => {
    if (!userClicked) return
    clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(() => setUserClicked(false), PAUSE_MS)
    return () => clearTimeout(pauseRef.current)
  }, [userClicked])

  // Phase animation (speaking cycles)
  const phaseRef = useRef(mode)
  useEffect(() => {
    if (phaseRef.current !== mode) {
      phaseRef.current = mode
    }
    const id = setInterval(() => setPhase((p) => (p + 1) % 4), 3000)
    return () => clearInterval(id)
  }, [mode])

  const handleTab = (m: DemoMode) => {
    setPhase(0)
    setMode(m)
    setUserClicked(true)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return
    const currentIndex = DEMO_MODES.indexOf(mode)
    if (deltaX < 0 && currentIndex < DEMO_MODES.length - 1) {
      handleTab(DEMO_MODES[currentIndex + 1])
    } else if (deltaX > 0 && currentIndex > 0) {
      handleTab(DEMO_MODES[currentIndex - 1])
    }
  }

  const meetActive = (['adaeze', 'lira', 'kwame', 'lira'] as const)[phase]
  const salesSpeaker = (['prospect', 'none', 'seller', 'none'] as const)[phase]

  const [supportSeconds, setSupportSeconds] = useState(272)
  const prevModeRef = useRef(mode)
  useEffect(() => {
    if (mode !== 'support') return
    if (prevModeRef.current !== mode) {
      prevModeRef.current = mode
    }
    const id = setInterval(() => setSupportSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [mode])
  const formatCallTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div
      id="support-demo"
      className="mx-auto mt-16 sm:mt-24 max-w-6xl px-2 sm:px-4 md:px-6 scroll-mt-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{MEETING_DEMO_STYLES}</style>

      {/* ── Tab bar ── */}
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1.5">
          {[
            { id: 'support' as DemoMode, label: 'Support', Icon: HeartIcon },
            { id: 'meetings' as DemoMode, label: 'Meetings', Icon: VideoCameraIcon },
            { id: 'sales' as DemoMode, label: 'Sales', Icon: ArrowTrendingUpIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab.id)}
              className={`relative inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-200 overflow-hidden ${
                mode === tab.id
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
              }`}
            >
              <tab.Icon className="w-3.5 h-3.5" />
              {tab.id === 'support' ? (
                <>
                  <span className="hidden md:inline">Customer Support</span>
                  <span className="md:hidden">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
              {mode === tab.id && !userClicked && (
                <div
                  key={mode}
                  className="absolute bottom-0 left-0 h-[2px] bg-white/20 rounded-full"
                  style={{ animation: `tabProgress ${ROTATE_MS}ms linear forwards` }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── MOBILE: Clean standalone cards (< sm) ── */}
      <div className="sm:hidden">
        <div className="mx-auto max-w-[300px]">
          {/* Meetings — mobile: Lira talking, 2 thumbnails below */}
          {mode === 'meetings' && (
            <div className="demo-fade-in">
              {/* Main speaker — Lira talking */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-[#131320]"
                style={{ height: 240 }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-violet-400/50 meet-pulse">
                    <img
                      src="/lira_black_with_white_backgound.png"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-0.5">
                  <WaveBars />
                  <span className="text-[10px] text-white/80 font-medium">Lira</span>
                </div>
                <div className="absolute top-2.5 left-0 right-0 text-center">
                  <span className="text-[10px] text-white/50 font-medium bg-black/30 rounded-full px-3 py-0.5">
                    Team Standup · 12:04
                  </span>
                </div>
                {/* Two small thumbnails — bottom right */}
                <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
                  {[
                    { name: 'Adaeze O.', img: '/participants/adaeze.jpg' },
                    { name: 'Kwame M.', img: '/participants/kwame.jpg' },
                  ].map((p) => (
                    <div
                      key={p.name}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-[#1a1a2e]"
                    >
                      <img src={p.img} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Compact toolbar */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <div className="flex items-center gap-1.5 rounded-full bg-[#2a2a2e] px-3 py-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a1 1 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                  </svg>
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#ea4335] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a1 1 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 00-2.67-1.85c-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Sales — mobile: video + glass panel, no phone frame */}
          {mode === 'sales' && (
            <div className="demo-fade-in">
              {/* Main speaker video */}
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 240 }}>
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: 'center top' }}
                >
                  <source
                    src={
                      salesSpeaker === 'seller'
                        ? '/participants/jordan.mp4'
                        : '/participants/emily.mp4'
                    }
                    type="video/mp4"
                  />
                </video>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-0.5">
                  {(salesSpeaker === 'seller' || salesSpeaker === 'prospect') && <WaveBars />}
                  <span className="text-[10px] text-white/80 font-medium">
                    {salesSpeaker === 'seller' ? 'Jordan B.' : 'Emily R.'}
                  </span>
                </div>
                {/* PiP thumbnail */}
                <div className="absolute top-2.5 right-2.5 w-14 h-[72px] rounded-lg overflow-hidden border border-white/20 shadow-lg">
                  <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center top' }}
                  >
                    <source
                      src={
                        salesSpeaker === 'seller'
                          ? '/participants/emily.mp4'
                          : '/participants/jordan.mp4'
                      }
                      type="video/mp4"
                    />
                  </video>
                </div>
              </div>
              {/* Glass coaching panel */}
              <div className="relative -mt-8 mx-2 z-10">
                <div
                  className="rounded-xl border border-white/[.14] overflow-hidden shadow-[0_6px_28px_rgba(0,0,0,.6)]"
                  style={{
                    background: 'rgba(10,10,13,0.55)',
                    backdropFilter: 'blur(20px) saturate(1.4)',
                  }}
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/[.08]">
                    <div className="w-3.5 h-3.5 rounded-full overflow-hidden border border-violet-400/40">
                      <img
                        src="/lira_black_with_white_backgound.png"
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[8px] text-white/85 font-semibold tracking-wider uppercase">
                      Lira · Sales Coach
                    </span>
                    <span className="ml-auto flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[7px] text-emerald-300 font-medium">Live</span>
                    </span>
                  </div>
                  <div className="px-2.5 pt-2 pb-1">
                    <span className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/30 text-blue-200 inline-flex items-center gap-0.5">
                      → Pitch window open
                    </span>
                  </div>
                  <div className="px-2.5 pb-2">
                    <p className="text-[9px] text-white/80 leading-relaxed">
                      Lead with the pain, not the product —{' '}
                      <span className="text-white font-semibold">
                        &quot;We help sales teams stop losing deals to poor follow-through.&quot;
                      </span>
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 border-t border-white/[.06]"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <span className="text-[6px] text-white/50">
                      Prospect: <span className="text-white/80 font-medium">Emily R.</span>
                    </span>
                    <span className="w-px h-2 bg-white/10" />
                    <span className="text-[6px] text-white/50">
                      Stage: <span className="text-white/80">Intro call</span>
                    </span>
                  </div>
                </div>
              </div>
              {/* Compact toolbar */}
              <div className="flex items-center justify-center gap-2 mt-2.5">
                <div className="flex items-center gap-1.5 rounded-full bg-[#2a2a2e] px-3 py-1.5">
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a1 1 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                  </svg>
                  <svg
                    className="w-3.5 h-3.5 text-white/80"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#ea4335] flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a1 1 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 00-2.67-1.85c-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Customer Support — mobile: 2 messages only */}
          {mode === 'support' && (
            <div className="demo-fade-in">
              <div className="rounded-2xl overflow-hidden bg-[#13111a]">
                <div className="px-3 py-3 text-center border-b border-white/[.05]">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-violet-400/25 mx-auto mb-1">
                    <img
                      src="/lira_black_with_white_backgound.png"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[10px] text-white/90 font-medium">Lira · Support Agent</div>
                  <div className="flex items-center justify-center gap-[2px] h-3.5 my-1">
                    {[
                      0.4, 0.7, 1, 0.55, 0.85, 0.45, 0.9, 0.6, 1, 0.35, 0.75, 0.5, 0.8, 0.65, 0.4,
                      0.9, 0.55, 0.7,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className="rounded-full meet-wave bg-violet-400"
                        style={{
                          width: 1.5,
                          height: `${h * 12}px`,
                          animationDelay: `${i * 0.06}s`,
                          animationDuration: `${0.35 + (i % 5) * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[8px] text-white/40">
                      Sarah M. · {formatCallTime(supportSeconds)}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-3 space-y-2">
                  {SUPPORT_MSGS.slice(0, 2).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.isCustomer ? 'justify-start' : 'justify-end'} demo-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${msg.isCustomer ? 'bg-white/[.06] rounded-tl-sm' : 'bg-violet-600/20 border border-violet-500/15 rounded-tr-sm'}`}
                      >
                        <div
                          className={`text-[7px] font-semibold mb-0.5 ${msg.isCustomer ? 'text-white/40' : 'text-violet-400/70'}`}
                        >
                          {msg.sender}
                        </div>
                        <p className="text-[9px] text-white/70 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 px-3 py-2 border-t border-white/[.05]">
                  <div className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20">
                    <span className="text-[9px] text-red-400 font-medium">End Call</span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/[.06] border border-white/[.08]">
                    <span className="text-[9px] text-white/40 font-medium">Transfer</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DESKTOP: macOS desktop (sm+) ── */}
      <div className="hidden sm:block relative rounded-2xl sm:rounded-[20px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.25)] border border-black/[.08]">
        <div
          className="relative px-2.5 pt-2 pb-2 sm:px-5 sm:pt-3 sm:pb-3 md:px-8 md:pt-4 md:pb-4"
          style={{
            background:
              'linear-gradient(135deg, #fbc2eb 0%, #e1a8f0 15%, #c4a6f5 30%, #a8c0f7 50%, #9fd8e8 70%, #a1e7cb 85%, #f6d365 100%)',
          }}
        >
          {/* Menu bar */}
          <div className="flex items-center justify-between px-1 sm:px-2 py-1 mb-2 sm:mb-3">
            <div />
            <div className="flex items-center gap-2 sm:gap-3">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-sm"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
              </svg>
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white drop-shadow-sm"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <svg
                className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white drop-shadow-sm"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7.66 14.17l-2.83 2.83 2.83 2.83L9.49 18l-1.41-1.41L9.49 15.17l-1.83-1zm8.68-8.34L13.51 8.66l1.83 1.83 2.83-2.83-2.83-2.83L13.51 6l1.41 1.42-1.41 1.41 1.83-1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
            </div>
          </div>

          {mode === 'meetings' && (
            <div
              key={mode}
              className="mx-auto max-w-[85%] sm:max-w-[80%] md:max-w-[75%] demo-fade-in"
            >
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,.18)]">
                {/* Traffic lights */}
                <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-[#292a2d]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                </div>

                {/* Meet header */}
                <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 bg-[#202124]">
                  <span className="text-[11px] sm:text-[13px] text-white/70 font-medium tracking-wide">
                    {'Team Standup'}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-[11px] text-white/40 font-medium tabular-nums">
                      {'12:04'}
                    </span>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                      <span className="text-[10px] sm:text-[11px] text-white/40">{'3'}</span>
                    </div>
                  </div>
                </div>

                {/* Video grid */}
                <div className="bg-[#202124] p-2 sm:p-3 md:p-4">
                  /* ── 3-tile meeting grid ── */
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 md:gap-3">
                    {/* Adaeze */}
                    <div
                      className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-500 ${meetActive === 'adaeze' ? 'border-[#4285f4] shadow-[0_0_16px_rgba(66,133,244,.35)]' : 'border-white/[.06]'}`}
                    >
                      <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
                        <div
                          className={`w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all duration-500 ${meetActive === 'adaeze' ? 'border-[#4285f4]/60 meet-pulse-blue' : 'border-white/10'}`}
                        >
                          <img
                            src="/participants/adaeze.jpg"
                            alt="Adaeze O."
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 bg-black/40 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                        {meetActive === 'adaeze' ? (
                          <WaveBars />
                        ) : (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
                        )}
                        <span className="text-[8px] sm:text-[11px] text-white/90 font-medium">
                          Adaeze O.
                        </span>
                      </div>
                    </div>

                    {/* Lira */}
                    <div
                      className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-500 ${meetActive === 'lira' ? 'border-violet-500/70 shadow-[0_0_16px_rgba(139,92,246,.35)]' : 'border-white/[.06]'}`}
                    >
                      <div className="absolute inset-0 bg-[#131320] flex items-center justify-center">
                        <div
                          className={`w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-violet-400/25 transition-all duration-500 ${meetActive === 'lira' ? 'meet-pulse' : ''}`}
                        >
                          <img
                            src="/lira_black_with_white_backgound.png"
                            alt="Lira"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 bg-black/40 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                        {meetActive === 'lira' ? (
                          <WaveBars />
                        ) : (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
                        )}
                        <span className="text-[8px] sm:text-[11px] text-white/90 font-medium">
                          Lira
                        </span>
                      </div>
                    </div>

                    {/* Kwame */}
                    <div
                      className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-500 ${meetActive === 'kwame' ? 'border-[#4285f4] shadow-[0_0_16px_rgba(66,133,244,.35)]' : 'border-white/[.06]'}`}
                    >
                      <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
                        <div
                          className={`w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full overflow-hidden border-2 transition-all duration-500 ${meetActive === 'kwame' ? 'border-[#4285f4]/60 meet-pulse-blue' : 'border-white/10'}`}
                        >
                          <img
                            src="/participants/kwame.jpg"
                            alt="Kwame M."
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                      <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 bg-black/40 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                        {meetActive === 'kwame' ? (
                          <WaveBars />
                        ) : (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
                        )}
                        <span className="text-[8px] sm:text-[11px] text-white/90 font-medium">
                          Kwame M.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meet toolbar */}
                <div className="bg-[#202124] flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 border-t border-white/[.06]">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#3c4043] flex items-center justify-center text-white/90">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a1 1 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                    </svg>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#3c4043] flex items-center justify-center text-white/90">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                    </svg>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#3c4043] flex items-center justify-center text-white/90">
                    <span className="text-[8px] sm:text-[9px] font-bold leading-none">CC</span>
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full bg-[#3c4043] flex items-center justify-center text-white/90">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                  </div>
                  <div className="w-px h-3.5 sm:h-4 bg-white/10 mx-0.5" />
                  <div className="w-10 sm:w-12 md:w-14 h-7 sm:h-8 md:h-9 rounded-full bg-[#ea4335] flex items-center justify-center">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a1 1 0 01-.29-.7c0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28a11.3 11.3 0 00-2.67-1.85c-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Sales: glass panel overlays the video, top edge protrudes above ── */}
          {mode === 'sales' && (
            <div
              key="sales"
              className="mx-auto max-w-[88%] sm:max-w-[82%] md:max-w-[76%] demo-fade-in"
            >
              <div className="relative" style={{ paddingTop: 52 }}>
                {/* ── Lira Sales Coach glass panel — semi-transparent, overlays video, top edge protrudes ── */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 z-20 w-[68%] sm:w-[62%] max-w-[340px]">
                  <div
                    className="rounded-2xl border border-white/[.16] overflow-hidden shadow-[0_10px_48px_rgba(0,0,0,.55)]"
                    style={{
                      background: 'rgba(10,10,13,0.52)',
                      backdropFilter: 'blur(22px) saturate(1.4)',
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[.09]">
                      <div className="w-4 h-4 rounded-full bg-violet-500/30 border border-violet-400/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                        <img
                          src="/lira_black_with_white_backgound.png"
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-white/85 font-semibold tracking-wider uppercase">
                        Lira · Sales Coach
                      </span>
                      <span className="ml-auto flex items-center gap-1 flex-shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                        <span className="text-[7px] sm:text-[8px] text-emerald-300 font-medium">
                          Live
                        </span>
                      </span>
                    </div>

                    {/* Signal badge */}
                    <div className="px-3 pt-2.5 pb-1.5">
                      <span className="text-[7px] sm:text-[8px] font-semibold px-2 py-0.5 rounded-full bg-blue-400/20 border border-blue-400/30 text-blue-200 inline-flex items-center gap-1">
                        → Pitch window open
                      </span>
                    </div>

                    {/* Coaching suggestion */}
                    <div className="px-3 pb-3">
                      <p className="text-[9px] sm:text-[11px] text-white/80 leading-relaxed">
                        Lead with the pain, not the product —{' '}
                        <span className="text-white font-semibold">
                          "We help sales teams stop losing deals to poor follow-through — Lira
                          captures every commitment, automatically."
                        </span>
                      </p>
                    </div>

                    {/* Deal context strip */}
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 border-t border-white/[.07]"
                      style={{ background: 'rgba(255,255,255,0.035)' }}
                    >
                      <span className="text-[7px] text-white/55">
                        Stage: <span className="text-white/85 font-medium">Intro call</span>
                      </span>
                      <span className="w-px h-2.5 bg-white/12 flex-shrink-0" />
                      <span className="text-[7px] text-white/55">
                        Prospect:{' '}
                        <span className="text-white/85 font-medium">Emily R. · VP Sales</span>
                      </span>
                      <span className="ml-auto text-[7px] font-semibold text-violet-300">
                        vs Gong
                      </span>
                    </div>

                    {/* Input */}
                    <div className="px-3 pb-3 pt-2">
                      <div
                        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 border border-white/[.10]"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <svg
                          className="w-3 h-3 text-white/45 flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.35-4.35" />
                        </svg>
                        <span className="text-[8px] sm:text-[9px] text-white/50 select-none">
                          Ask about objections, pricing, next steps...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Meeting window ── */}
                <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,.18)]">
                  {/* Traffic lights */}
                  <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-[#292a2d]">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                  </div>
                  {/* Side-by-side video tiles */}
                  <div className="flex bg-[#202124]" style={{ height: 310 }}>
                    {/* Jordan B. — left tile (seller) */}
                    <div className="flex-1 relative overflow-hidden">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: 'center top' }}
                      >
                        <source src="/participants/jordan.mp4" type="video/mp4" />
                      </video>
                      <div
                        className={`absolute inset-0 transition-all duration-500 pointer-events-none ${salesSpeaker === 'seller' ? 'ring-[3px] ring-inset ring-blue-400/70 meet-pulse-blue' : ''}`}
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
                        {salesSpeaker === 'seller' ? (
                          <WaveBars />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
                        )}
                        <span className="text-[8px] sm:text-[10px] text-white/70 font-medium">
                          Jordan B.
                        </span>
                      </div>
                    </div>
                    <div className="w-px bg-black/50" />
                    {/* Emily R. — right tile (prospect) */}
                    <div className="flex-1 relative overflow-hidden">
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: 'center top' }}
                      >
                        <source src="/participants/emily.mp4" type="video/mp4" />
                      </video>
                      <div
                        className={`absolute inset-0 transition-all duration-500 pointer-events-none ${salesSpeaker === 'prospect' ? 'ring-[3px] ring-inset ring-emerald-400/70 meet-pulse-blue' : ''}`}
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5">
                        {salesSpeaker === 'prospect' ? (
                          <WaveBars />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/25" />
                        )}
                        <span className="text-[8px] sm:text-[10px] text-white/70 font-medium">
                          Emily R.
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Toolbar */}
                  <div className="bg-[#202124] flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 border-t border-white/[.06]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex flex-col items-center gap-0.5">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white/60"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15a1 1 0 00-.98-.85c-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                        </svg>
                        <span className="text-[7px] sm:text-[9px] text-white/40">Unmute</span>
                      </div>
                      <div className="flex flex-col items-center gap-0.5">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-white/60"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                        </svg>
                        <span className="text-[7px] sm:text-[9px] text-white/40">Start Video</span>
                      </div>
                    </div>
                    <div className="px-4 sm:px-6 py-1 sm:py-1.5 rounded-lg bg-[#ea4335]">
                      <span className="text-[10px] sm:text-[12px] text-white font-semibold">
                        End
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Customer Support: AI Call Interface ── */}
          {mode === 'support' && (
            <div
              key="support"
              className="mx-auto max-w-[85%] sm:max-w-[70%] md:max-w-[55%] demo-fade-in"
            >
              <div className="rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,.18)]">
                <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 bg-[#1a1025]">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                </div>
                <div className="bg-[#13111a] px-4 py-3 sm:py-4 text-center border-b border-white/[.05]">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-violet-400/25 mx-auto mb-2">
                    <img
                      src="/lira_black_with_white_backgound.png"
                      alt="Lira"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-[11px] sm:text-[13px] text-white/90 font-medium">
                    Lira · Support Agent
                  </div>
                  {/* Live call waveform */}
                  <div className="flex items-center justify-center gap-[2.5px] h-5 my-2">
                    {[
                      0.4, 0.7, 1, 0.55, 0.85, 0.45, 0.9, 0.6, 1, 0.35, 0.75, 0.5, 0.8, 0.65, 0.4,
                      0.9, 0.55, 0.7,
                    ].map((h, i) => (
                      <div
                        key={i}
                        className={`rounded-full meet-wave ${phase % 2 === 1 ? 'bg-violet-400' : 'bg-blue-400/70'}`}
                        style={{
                          width: 2,
                          height: `${h * 18}px`,
                          animationDelay: `${i * 0.06}s`,
                          animationDuration: `${0.35 + (i % 5) * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[9px] sm:text-[11px] text-white/40">
                      Active call with Sarah M. · {formatCallTime(supportSeconds)}
                    </span>
                  </div>
                </div>
                <div
                  className="bg-[#0f0e14] px-3 sm:px-4 py-3 space-y-2.5 sm:space-y-3"
                  style={{ minHeight: 160 }}
                >
                  {SUPPORT_MSGS.slice(0, phase + 1).map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.isCustomer ? 'justify-start' : 'justify-end'} demo-fade-in`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 ${msg.isCustomer ? 'bg-white/[.06] rounded-tl-sm' : 'bg-violet-600/20 border border-violet-500/15 rounded-tr-sm'}`}
                      >
                        <div
                          className={`text-[8px] sm:text-[9px] font-semibold mb-0.5 ${msg.isCustomer ? 'text-white/40' : 'text-violet-400/70'}`}
                        >
                          {msg.sender}
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-white/70 leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#13111a] flex items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 sm:py-3 border-t border-white/[.05]">
                  <div className="px-3 py-1 rounded-full bg-red-500/15 border border-red-500/20">
                    <span className="text-[9px] sm:text-[10px] text-red-400 font-medium">
                      End Call
                    </span>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/[.06] border border-white/[.08]">
                    <span className="text-[9px] sm:text-[10px] text-white/40 font-medium">
                      Transfer
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* macOS Dock */}
          <div className="flex items-end justify-center mt-3 sm:mt-5">
            <div className="flex items-center gap-3 sm:gap-4 bg-white/30 backdrop-blur-2xl rounded-2xl px-4 py-2 sm:px-5 sm:py-2.5 border border-white/30 shadow-[0_2px_12px_rgba(0,0,0,.05)]">
              <img
                src="/docker_icons/finder_icon.png"
                alt="Finder"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain drop-shadow-sm"
              />
              <img
                src="/docker_icons/Safari_browser_logo.svg.png"
                alt="Safari"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain drop-shadow-sm"
              />
              <img
                src="/docker_icons/zoom_icon.png"
                alt="Zoom"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain drop-shadow-sm"
              />
              <img
                src="/docker_icons/Settings_(iOS).png"
                alt="Settings"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain drop-shadow-sm"
              />
              <div className="w-px h-6 sm:h-7 bg-white/30 mx-0.5" />
              <img
                src="/docker_icons/trash.png"
                alt="Trash"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Meeting Intent Modal ────────────────────────────────────────────────────

function MeetingModal({ url, onClose }: { url: string; onClose: () => void }) {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate(`/signup?meetingUrl=${encodeURIComponent(url)}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(8px)' }}
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl px-8 py-10 text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-modal-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition"
          aria-label="Close"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Lira avatar */}
        <div className="mx-auto mb-5 w-14 h-14 rounded-2xl overflow-hidden shadow-md">
          <img
            src="/lira_black_with_white_backgound.png"
            alt="Lira"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Headline */}
        <h2
          id="meeting-modal-title"
          className="text-xl font-black tracking-tight text-gray-900 mb-2"
        >
          Lira is ready to join your call.
        </h2>

        {/* Meeting URL preview */}
        <div className="mx-auto mb-5 flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-2">
          <VideoCameraIcon className="w-3.5 h-3.5 shrink-0 text-gray-400" />
          <span className="text-xs text-gray-500 truncate">{url}</span>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-500 leading-relaxed mb-7">
          Create your account and Lira will join this meeting immediately after sign-up.
        </p>

        {/* Primary CTA */}
        <button
          onClick={handleStart}
          className="w-full rounded-xl bg-[#3730a3] text-white text-sm font-semibold py-3 hover:bg-[#312e81] transition flex items-center justify-center gap-2"
        >
          Start free
          <ArrowRightIcon className="w-4 h-4" />
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}

// ─── Hero ──────────────────────────────────────────────────────────────────────────────

function Hero() {
  const scrollToSupport = () => {
    const el = document.getElementById('support-demo')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="relative overflow-hidden pt-28 sm:pt-36 pb-0 px-6 text-center">
      {/* Category pill */}
      <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 backdrop-blur px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-wide text-gray-600 shadow-sm">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-[#3730a3] opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3730a3]" />
        </span>
        Conversational Intelligence Platform
      </div>

      {/* Headline */}
      <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
        Every conversation.
        <br />
        <span
          className="inline-block -rotate-[1.2deg] translate-y-1 text-white px-3 sm:px-5 py-0.5 sm:py-1 rounded-lg ai-badge"
          style={{
            background: '#3730a3',
            boxShadow: '3px 5px 0px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          Intelligently
        </span>{' '}
        handled.
      </h1>

      {/* Sub */}
      <p className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
        Lira is a Conversational Intelligence platform. One AI agent across your customer support,
        sales calls, and meetings, grounded in your knowledge, responding in real time.
      </p>

      {/* Dual CTA */}
      <div className="mx-auto mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={scrollToSupport}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#3730a3] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#312e81] active:scale-95 transition-all"
        >
          See it handle a ticket
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all"
        >
          Start free
        </Link>
      </div>
    </section>
  )
}

// ─── In Action ────────────────────────────────────────────────────────────

function InAction() {
  return (
    <section className="relative py-20 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl text-center mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#3730a3] mb-3">
          Live demo
        </p>
        <h2 className="mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.02em] text-gray-900 leading-[1.08]">
          Watch Lira handle it, in real time.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
          Switch between Customer Support, Meetings, and Sales. Same engine, same knowledge, three surfaces.
        </p>
      </div>
      <MeetingDemo />
    </section>
  )
}

// ─── Hub & Spoke (compact, static) ───────────────────────────────────────────

const HUB_STYLES = `
  @keyframes hubGlowSoft{0%,100%{box-shadow:0 0 0 0 rgba(55,48,163,.28),0 18px 44px -14px rgba(55,48,163,.45)}50%{box-shadow:0 0 0 10px rgba(55,48,163,0),0 18px 44px -14px rgba(55,48,163,.55)}}
  @keyframes hubPulse{0%,100%{opacity:.5}50%{opacity:1}}
  @keyframes hubDash{to{stroke-dashoffset:-32}}
  .hub-core{animation:hubGlowSoft 3.6s ease-in-out infinite}
  .hub-pulse{animation:hubPulse 2.4s ease-in-out infinite}
  .hub-line{stroke-dasharray:4 6;animation:hubDash 3s linear infinite}
  @media (prefers-reduced-motion:reduce){.hub-core,.hub-pulse,.hub-line{animation:none}}
`

type Spoke = {
  id: string
  label: string
  description: string
  accent: string
}

const SPOKES_LIST: Spoke[] = [
  { id: 'support', label: 'Customer Support', description: 'Chat, portal, and email resolved in seconds.', accent: '#3730a3' },
  { id: 'sales', label: 'Sales Coaching', description: 'Real-time objection handling, CRM auto-fill.', accent: '#f59e0b' },
  { id: 'meetings', label: 'Meetings', description: 'Joins, contributes, closes the loop.', accent: '#8b5cf6' },
  { id: 'knowledge', label: 'Knowledge', description: 'Grounded in your docs, tickets, and history.', accent: '#10b981' },
]

function HubAndSpoke() {
  return (
    <section className="relative py-20 sm:py-24 px-6 overflow-hidden">
      <style>{HUB_STYLES}</style>

      {/* Background ambient */}
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(55,48,163,0.06), transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#3730a3] mb-4">
            One platform
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.02em] text-gray-900 leading-[1.08]">
            Built on a single{' '}
            <span className="text-[#3730a3]">Conversational Intelligence</span> engine.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
            Lira hears, understands, and{' '}
            <em className="not-italic text-gray-700 font-semibold">acts on</em> every business
            conversation, grounded in your shared knowledge.
          </p>
        </div>

        {/* ─── Desktop: hub center + 4 spokes with SVG connectors ────────── */}
        <div className="hidden md:block relative mx-auto" style={{ maxWidth: 900 }}>
          {/* Center hub */}
          <div className="flex justify-center">
            <div
              className="hub-core relative flex h-32 w-32 flex-col items-center justify-center rounded-3xl text-center px-3"
              style={{
                background:
                  'linear-gradient(140deg, #3730a3 0%, #1e1b4b 100%)',
              }}
            >
              <div className="absolute inset-[3px] rounded-[22px] ring-1 ring-white/10" />
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="h-8 w-8 rounded-lg mb-1.5"
              />
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/60">
                Lira engine
              </p>
              <p className="text-[11px] font-bold text-white leading-tight tracking-[-0.01em] mt-0.5">
                Conversational
                <br />
                Intelligence
              </p>
            </div>
          </div>

          {/* SVG connectors */}
          <svg
            className="absolute left-0 right-0 mx-auto pointer-events-none"
            style={{ top: '50%', width: '100%', height: 80 }}
            viewBox="0 0 900 80"
            preserveAspectRatio="none"
            aria-hidden
          >
            {/* 4 curved connectors from center (top) to each card below */}
            {[130, 370, 530, 770].map((x, i) => (
              <path
                key={i}
                d={`M 450 0 Q 450 40, ${x} 72`}
                stroke="#3730a3"
                strokeOpacity="0.35"
                strokeWidth="1.25"
                fill="none"
                className="hub-line"
                style={{ animationDelay: `${i * 0.25}s` }}
              />
            ))}
          </svg>

          {/* 4 spoke cards in a row */}
          <div className="mt-20 grid grid-cols-4 gap-4">
            {SPOKES_LIST.map((s) => (
              <div
                key={s.id}
                className="relative rounded-xl bg-white ring-1 ring-gray-200/80 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_10px_24px_-14px_rgba(16,24,40,0.12)]"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="hub-pulse inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: s.accent }}
                  />
                  <p className="text-[12px] font-black tracking-[-0.01em] text-gray-900">
                    {s.label}
                  </p>
                </div>
                <p className="text-[11.5px] text-gray-500 leading-snug">{s.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Mobile: hub on top, 2×2 grid below ─────────────────────────── */}
        <div className="md:hidden">
          <div className="flex justify-center mb-6">
            <div
              className="hub-core relative flex h-24 w-24 flex-col items-center justify-center rounded-2xl text-center"
              style={{
                background:
                  'linear-gradient(140deg, #3730a3 0%, #1e1b4b 100%)',
              }}
            >
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="h-7 w-7 rounded-md mb-1"
              />
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/60">
                Lira
              </p>
              <p className="text-[10px] font-bold text-white leading-tight">CI Engine</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {SPOKES_LIST.map((s) => (
              <div
                key={s.id}
                className="relative rounded-xl bg-white ring-1 ring-gray-200/80 p-3.5"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="hub-pulse inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: s.accent }}
                  />
                  <p className="text-[11.5px] font-black text-gray-900 leading-tight">
                    {s.label}
                  </p>
                </div>
                <p className="text-[10.5px] text-gray-500 leading-snug">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


// ─── How Lira thinks — Listen · Understand · Act ───────────────────────────

const THINK_STYLES = `
  @keyframes thinkFlow{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}
  @keyframes thinkRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes waveBar{0%,100%{transform:scaleY(.35)}50%{transform:scaleY(1)}}
  @keyframes nodePulse{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:1;transform:scale(1)}}
  @keyframes nodeLink{from{stroke-dashoffset:20}to{stroke-dashoffset:0}}
  @keyframes checkPop{0%{opacity:0;transform:translateY(4px) scale(.85)}60%{opacity:1;transform:translateY(0) scale(1.04)}100%{opacity:1;transform:translateY(0) scale(1)}}
  .think-flow-1{stroke-dasharray:4 6;stroke-dashoffset:200;animation:thinkFlow 3s linear infinite}
  .think-chip{animation:thinkRise .5s cubic-bezier(.2,.7,.3,1) both}
  .wave-bar{transform-origin:center bottom;animation:waveBar 1.1s ease-in-out infinite}
  .node-dot{animation:nodePulse 1.8s ease-in-out infinite}
  .node-link{stroke-dasharray:2 4;animation:nodeLink 2s linear infinite}
  .check-pop{animation:checkPop .55s cubic-bezier(.2,.7,.3,1) both}
  @media (prefers-reduced-motion:reduce){.think-flow-1,.think-chip,.wave-bar,.node-dot,.node-link,.check-pop{animation:none}}
`

type ThinkVisual = 'wave' | 'graph' | 'checks'

type ThinkStep = {
  stepNum: string
  eyebrow: string
  title: string
  description: string
  accent: string
  visual: ThinkVisual
  chips: string[]
}

const THINK_STEPS: ThinkStep[] = [
  {
    stepNum: '01',
    eyebrow: 'Listen',
    title: 'Streaming audio and text in real time',
    description:
      'Amazon Nova Sonic captures live voice. Chat, portal, email, and meeting transcripts stream into the same pipeline, with speaker attribution.',
    accent: '#3730a3',
    visual: 'wave',
    chips: ['Nova Sonic', 'Diarization', 'Chat · Email · Portal'],
  },
  {
    stepNum: '02',
    eyebrow: 'Understand',
    title: 'Grounded reasoning against your knowledge',
    description:
      'Intent, sentiment, and entities extracted. Responses are retrieved from your docs, past tickets, and CRM, never hallucinated.',
    accent: '#8b5cf6',
    visual: 'graph',
    chips: ['Intent + NLU', 'RAG on your docs', 'Past conversation memory'],
  },
  {
    stepNum: '03',
    eyebrow: 'Act',
    title: 'Tool use. Real actions. Closed loops.',
    description:
      'Lira doesn\'t stop at a summary. It resolves the ticket, updates the CRM, creates the Linear issue, and posts to Slack, on its own.',
    accent: '#f59e0b',
    visual: 'checks',
    chips: ['Create ticket', 'Update CRM', 'Send follow-up', 'Post to Slack'],
  },
]

function ThinkVisualEl({ visual, accent }: { visual: ThinkVisual; accent: string }) {
  if (visual === 'wave') {
    return (
      <div className="flex items-end gap-1 h-10">
        {[0.2, 0.0, 0.35, 0.1, 0.25].map((d, i) => (
          <span
            key={i}
            className="wave-bar inline-block w-1.5 rounded-sm"
            style={{ height: '100%', background: accent, animationDelay: `${d}s` }}
          />
        ))}
      </div>
    )
  }
  if (visual === 'graph') {
    return (
      <svg viewBox="0 0 90 40" className="h-10 w-[90px]" aria-hidden>
        <line x1="10" y1="30" x2="45" y2="12" stroke={accent} strokeOpacity="0.5" strokeWidth="1.25" className="node-link" />
        <line x1="45" y1="12" x2="80" y2="28" stroke={accent} strokeOpacity="0.5" strokeWidth="1.25" className="node-link" style={{ animationDelay: '.4s' }} />
        <line x1="10" y1="30" x2="80" y2="28" stroke={accent} strokeOpacity="0.35" strokeWidth="1.25" className="node-link" style={{ animationDelay: '.8s' }} />
        <circle cx="10" cy="30" r="3.2" fill={accent} className="node-dot" />
        <circle cx="45" cy="12" r="3.6" fill={accent} className="node-dot" style={{ animationDelay: '.3s' }} />
        <circle cx="80" cy="28" r="3.2" fill={accent} className="node-dot" style={{ animationDelay: '.6s' }} />
      </svg>
    )
  }
  // checks
  return (
    <div className="flex flex-col gap-1 h-10 justify-center">
      {[0, 0.18, 0.36].map((delay, i) => (
        <div
          key={i}
          className="check-pop flex items-center gap-1.5"
          style={{ animationDelay: `${delay}s` }}
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <circle cx="6" cy="6" r="6" fill={accent} fillOpacity="0.18" />
            <path d="M3.5 6.2 L5.2 7.8 L8.5 4.5" stroke={accent} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="inline-block h-[3px] rounded-full" style={{ width: 34 - i * 6, background: `${accent}55` }} />
        </div>
      ))}
    </div>
  )
}

function HowLiraThinks() {
  return (
    <section className="relative py-24 sm:py-28 px-6 border-t border-gray-200/60 bg-gradient-to-b from-white via-indigo-50/20 to-white">
      <style>{THINK_STYLES}</style>

      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#3730a3] mb-4">
            How Lira thinks
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.02em] text-gray-900 leading-[1.08]">
            From sound waves to shipped actions, in seconds.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
            Three stages. One real-time pipeline. This is what separates a Conversational Intelligence
            platform from a note-taker.
          </p>
        </div>

        {/* Horizontal pipeline: 3 steps with connecting line on md+ */}
        <div className="relative">
          {/* Connecting line behind cards (desktop only) */}
          <svg
            className="hidden md:block absolute left-0 right-0 top-10 h-4 w-full pointer-events-none"
            viewBox="0 0 1000 16"
            preserveAspectRatio="none"
            aria-hidden
          >
            <line
              x1="80"
              y1="8"
              x2="920"
              y2="8"
              stroke="#6366f1"
              strokeOpacity="0.3"
              strokeWidth="1.5"
              className="think-flow-1"
            />
          </svg>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
            {THINK_STEPS.map((step, i) => {
              return (
                <div
                  key={step.eyebrow}
                  className="relative overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/80 p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(16,24,40,0.12)]"
                >
                  {/* Big typographic step number, watermark style */}
                  <div
                    aria-hidden
                    className="absolute -top-3 right-4 select-none font-black tracking-[-0.04em] leading-none"
                    style={{
                      fontSize: 112,
                      color: step.accent,
                      opacity: 0.08,
                    }}
                  >
                    {step.stepNum}
                  </div>

                  {/* Per-step animated visual */}
                  <div className="mb-5 relative z-[1]">
                    <ThinkVisualEl visual={step.visual} accent={step.accent} />
                  </div>

                  <p
                    className="relative z-[1] text-[10.5px] font-bold uppercase tracking-[0.22em] mb-2"
                    style={{ color: step.accent }}
                  >
                    {step.stepNum} · {step.eyebrow}
                  </p>
                  <h3 className="relative z-[1] text-lg font-black tracking-[-0.01em] text-gray-900 mb-3 leading-snug">
                    {step.title}
                  </h3>
                  <p className="relative z-[1] text-sm text-gray-500 leading-relaxed mb-5">{step.description}</p>

                  {/* Example chips */}
                  <div className="relative z-[1] flex flex-wrap gap-1.5">
                    {step.chips.map((chip, ci) => (
                      <span
                        key={chip}
                        className="think-chip inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1"
                        style={{
                          background: `${step.accent}0d`,
                          color: step.accent,
                          // @ts-expect-error ring color inline
                          '--tw-ring-color': `${step.accent}26`,
                          animationDelay: `${0.3 + i * 0.15 + ci * 0.08}s`,
                        }}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Support Showcase — the wedge ───────────────────────────────────────────

const SUPPORT_SHOW_STYLES = `
  @keyframes chatBubbleIn{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
  @keyframes chatTypeDot{0%,20%{opacity:.3}40%{opacity:1}60%,100%{opacity:.3}}
  @keyframes counterTick{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sparkle{0%,100%{opacity:0;transform:scale(.5)}50%{opacity:1;transform:scale(1)}}
  .chat-bubble{animation:chatBubbleIn .45s cubic-bezier(.2,.7,.3,1) both}
  .chat-typing-dot{animation:chatTypeDot 1.4s ease-in-out infinite}
  .chat-typing-dot:nth-child(2){animation-delay:.15s}
  .chat-typing-dot:nth-child(3){animation-delay:.3s}
  .counter-tick{animation:counterTick .5s ease-out both}
  .sparkle{animation:sparkle 2s ease-in-out infinite}
`

type ChatTurn =
  | { role: 'user'; text: string; name?: string }
  | { role: 'lira'; text: string; sources?: string[] }
  | { role: 'action'; text: string; icon: 'check' | 'bolt' }

const CHAT_SCRIPT: ChatTurn[] = [
  { role: 'user', name: 'Priya · customer', text: 'Hi, I was charged twice for order #2841. Can I get a refund?' },
  {
    role: 'lira',
    text:
      "Hi Priya, I see the duplicate charge on #2841 from Apr 19. Per our policy, duplicate charges are refunded instantly. I've processed a refund of $48.00 to your card ending 4421. You should see it within 1-3 business days.",
    sources: ['refund-policy.md', 'Order #2841'],
  },
  { role: 'action', icon: 'bolt', text: 'Refund issued via Stripe · confirmation email sent' },
  { role: 'action', icon: 'check', text: 'Ticket #2841 resolved · synced to HubSpot' },
]

function useScriptedChat(script: ChatTurn[], perStepMs = 2200) {
  const [visible, setVisible] = useState(1)
  const [typing, setTyping] = useState<'lira' | null>(null)

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const advance = (idx: number) => {
      if (cancelled) return
      if (idx >= script.length) {
        // Loop: pause, then restart
        timers.push(
          setTimeout(() => {
            setVisible(1)
            setTyping(null)
            advance(1)
          }, 5500),
        )
        return
      }
      const next = script[idx]
      if (next.role === 'lira') {
        setTyping('lira')
        timers.push(
          setTimeout(() => {
            if (cancelled) return
            setTyping(null)
            setVisible(idx + 1)
            advance(idx + 1)
          }, 1500),
        )
      } else {
        timers.push(
          setTimeout(() => {
            if (cancelled) return
            setVisible(idx + 1)
            advance(idx + 1)
          }, perStepMs),
        )
      }
    }
    advance(1)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [script, perStepMs])

  return { visible, typing }
}

function SupportChatDemo() {
  const { visible, typing } = useScriptedChat(CHAT_SCRIPT)
  const shown = CHAT_SCRIPT.slice(0, visible)

  return (
    <div className="relative rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_60px_-20px_rgba(16,24,40,0.2)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-3.5 bg-gradient-to-r from-indigo-50/60 to-white">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex items-center gap-2 mx-auto text-[11px] font-semibold text-gray-600">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          support.acme.com
        </div>
        <div className="w-12" />
      </div>

      {/* Chat stream */}
      <div className="px-5 py-5 space-y-3.5 min-h-[380px]">
        {shown.map((turn, i) => {
          if (turn.role === 'user') {
            return (
              <div key={i} className="chat-bubble flex justify-end">
                <div className="max-w-[82%]">
                  <p className="text-[10px] font-semibold text-gray-400 mb-1 text-right">
                    {turn.name}
                  </p>
                  <div className="rounded-2xl rounded-tr-sm bg-gray-900 px-4 py-2.5 text-sm text-white leading-relaxed">
                    {turn.text}
                  </div>
                </div>
              </div>
            )
          }
          if (turn.role === 'lira') {
            return (
              <div key={i} className="chat-bubble flex justify-start">
                <div className="max-w-[86%]">
                  <p className="text-[10px] font-semibold text-[#3730a3] mb-1 flex items-center gap-1.5">
                    <img src="/lira_logo.png" alt="" className="h-3.5 w-3.5 rounded-sm" />
                    Lira · 0.8s
                  </p>
                  <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-100 px-4 py-2.5 text-sm text-gray-800 leading-relaxed">
                    {turn.text}
                  </div>
                  {turn.sources && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {turn.sources.map((src) => (
                        <span
                          key={src}
                          className="inline-flex items-center gap-1 rounded-md bg-white ring-1 ring-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                        >
                          <BookOpenIcon className="h-2.5 w-2.5" />
                          {src}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          }
          // action
          const Icon = turn.icon === 'bolt' ? BoltIcon : CheckCircleIcon
          const color = turn.icon === 'bolt' ? '#f59e0b' : '#10b981'
          return (
            <div key={i} className="chat-bubble flex justify-center">
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ring-1"
                style={{
                  background: `${color}12`,
                  color,
                  // @ts-expect-error ring color inline
                  '--tw-ring-color': `${color}33`,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {turn.text}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {typing === 'lira' && (
          <div className="chat-bubble flex justify-start">
            <div className="rounded-2xl rounded-tl-sm bg-gradient-to-br from-indigo-50 to-white ring-1 ring-indigo-100 px-4 py-3 inline-flex items-center gap-1.5">
              <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-indigo-400" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SUPPORT_LOGOS: { name: string; label: string }[] = [
  { name: 'slack', label: 'Slack' },
  { name: 'hubspot', label: 'HubSpot' },
  { name: 'zendesk', label: 'Zendesk' },
  { name: 'linear', label: 'Linear' },
  { name: 'salesforce', label: 'Salesforce' },
  { name: 'microsoft-teams', label: 'Teams' },
]

function SupportShowcase() {
  return (
    <section
      id="support"
      className="relative py-24 sm:py-28 px-6 border-t border-gray-200/60 overflow-hidden"
    >
      <style>{SUPPORT_SHOW_STYLES}</style>

      {/* Ambient accent */}
      <div
        className="absolute inset-0 -z-10 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 85% 30%, rgba(55,48,163,0.08), transparent 70%)',
        }}
      />

      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#3730a3]/8 ring-1 ring-[#3730a3]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#3730a3] mb-4">
            <HeartIcon className="h-3 w-3" />
            Customer Support · the wedge
          </p>
          <h2 className="mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.02em] text-gray-900 leading-[1.08]">
            Resolve tickets in seconds.{' '}
            <span className="text-[#3730a3]">Ground every answer.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed">
            Most CI platforms listen to your support calls. Lira answers them across chat, portal, and email,
            grounded in your documentation and past conversations.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-8 lg:gap-12 items-start">
          {/* LEFT: chat demo */}
          <SupportChatDemo />

          {/* RIGHT: metrics + capabilities */}
          <div className="flex flex-col gap-5">
            {/* Headline metric card */}
            <div className="relative rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-[#3730a3] to-[#4338ca] p-7 text-white overflow-hidden shadow-[0_24px_60px_-20px_rgba(55,48,163,0.6)]">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/60 mb-3">
                  Live on demo.liraintelligence.com
                </p>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-5xl sm:text-6xl font-black tracking-tight">&lt;30s</p>
                  <p className="text-sm text-white/70 font-semibold">median</p>
                </div>
                <p className="text-sm text-white/75 leading-relaxed">
                  Time from ticket opened to first resolution response, grounded in your knowledge
                  base.
                </p>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { stat: '60%', label: 'auto-resolved' },
                { stat: '24/7', label: 'always on' },
                { stat: '4ch', label: 'chat · portal · email · widget' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl bg-white ring-1 ring-gray-200/80 px-4 py-3.5 shadow-sm"
                >
                  <p className="text-2xl font-black tracking-tight text-gray-900">{s.stat}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Integrations row */}
            <div className="rounded-2xl bg-white ring-1 ring-gray-200/80 p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-3">
                Plugs into your stack
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORT_LOGOS.map((l) => (
                  <span
                    key={l.name}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 ring-1 ring-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://demo.liraintelligence.com/support"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-all active:scale-95 shadow-sm"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                See it handle a ticket
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </a>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all active:scale-95"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Security & Trust strip ─────────────────────────────────────────────────

const SECURITY_ITEMS: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  body: string
}[] = [
  {
    Icon: LockClosedIcon,
    title: 'Encryption everywhere',
    body: 'TLS 1.2+ in transit, AES-256 at rest. Zero-trust between services.',
  },
  {
    Icon: ShieldCheckIcon,
    title: 'OAuth 2.0 PKCE',
    body: 'Integrations use scoped, revocable tokens. No passwords stored, ever.',
  },
  {
    Icon: ServerStackIcon,
    title: 'Your data, your control',
    body: 'Strict org isolation. Delete everything from settings at any time. GDPR-aligned.',
  },
  {
    Icon: CpuChipIcon,
    title: 'We never train on your data',
    body: 'Zero retention for model training. OWASP Top 10 hardened. Built on AWS.',
  },
]

function SecurityStrip() {
  return (
    <section id="security" className="relative py-20 px-6 border-t border-gray-200/60 bg-gray-50/60">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-3">
            Security & trust
          </p>
          <h2 className="mx-auto max-w-2xl text-2xl sm:text-3xl md:text-4xl font-black tracking-[-0.02em] text-gray-900 leading-[1.1]">
            Enterprise-grade from day one.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SECURITY_ITEMS.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl bg-white ring-1 ring-gray-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_16px_-8px_rgba(16,24,40,0.06)]"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white mb-4">
                <Icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-[13px] font-black tracking-tight text-gray-900 mb-1.5">
                {title}
              </h3>
              <p className="text-[12px] text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Feature Flows (animated GIF-style demos) ───────────────────────────────

const FLOW_DEMO_STYLES = `
  @keyframes flowTypeReveal{from{max-width:0}to{max-width:25em}}
  @keyframes flowFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes flowPulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)}50%{box-shadow:0 0 0 6px rgba(74,222,128,0)}}
  @keyframes flowProgressFill{from{width:0}to{width:100%}}
  @keyframes flowBlink{0%,100%{opacity:1}50%{opacity:0}}
  @keyframes flowClickRipple{0%{transform:scale(0);opacity:.5}100%{transform:scale(2.5);opacity:0}}
  .flow-typing{display:inline-block;overflow:hidden;white-space:nowrap;max-width:0;vertical-align:bottom}
  .flow-typing.on{animation:flowTypeReveal 2s steps(35,end) forwards}
  .flow-caret{display:inline-block;width:2px;height:1em;background:rgba(255,255,255,.6);vertical-align:text-bottom;margin-left:2px;animation:flowBlink .8s step-end infinite}
`

type FlowTab = 'meetings' | 'tasks' | 'integrations'

const FLOW_NAV: { id: FlowTab; label: string; desc: string }[] = [
  { id: 'meetings', label: 'Meetings', desc: 'Send Lira to any meeting' },
  { id: 'tasks', label: 'Tasks', desc: 'Automated follow-through' },
  { id: 'integrations', label: 'Integrations', desc: 'Connect your tools' },
]

const TAB_CYCLE_MS = 10_000

/* phase durations (ms) – module-level so useEffect deps stay clean */
const M_DUR = [1200, 2500, 1500, 3500, 1200]
const T_DUR = [2000, 3000, 2500, 2000]
const IG_DUR = [1500, 1500, 1500, 3000, 1500]

/* cursor positions per phase [x%, y%] */
const M_CUR: { x: string; y: string; show: boolean; click: boolean }[] = [
  { x: '15%', y: '85%', show: false, click: false },
  { x: '30%', y: '73%', show: true, click: false },
  { x: '85%', y: '73%', show: true, click: true },
  { x: '50%', y: '35%', show: false, click: false },
  { x: '50%', y: '35%', show: false, click: false },
]

const IG_CUR: { x: string; y: string; show: boolean; click: boolean }[] = [
  { x: '40%', y: '30%', show: false, click: false },
  { x: '88%', y: '18%', show: true, click: true },
  { x: '88%', y: '42%', show: true, click: true },
  { x: '50%', y: '70%', show: false, click: false },
  { x: '50%', y: '70%', show: false, click: false },
]

/* ── Animated cursor ── */
function GifCursor({
  x,
  y,
  visible,
  clicking,
}: {
  x: string
  y: string
  visible: boolean
  clicking: boolean
}) {
  return (
    <div
      className="absolute z-20 pointer-events-none hidden md:block"
      style={{
        left: x,
        top: y,
        opacity: visible ? 1 : 0,
        transition:
          'left 0.55s cubic-bezier(0.4,0,0.2,1), top 0.55s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease',
      }}
    >
      <svg width="18" height="22" viewBox="0 0 20 24" fill="none" className="drop-shadow-md">
        <path
          d="M2 1L2 18.5L6.8 13.7L11 21.5L14 20L9.8 12.2L16 12.2L2 1Z"
          fill="#111"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      {clicking && (
        <span
          className="absolute top-0 left-0 block h-4 w-4 rounded-full bg-violet-400/40 -translate-x-1/2 -translate-y-1/2"
          style={{ animation: 'flowClickRipple .4s ease-out forwards' }}
        />
      )}
    </div>
  )
}

/* ─────────────────── Meetings GIF ─────────────────── */
function MeetingsGif({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setPhase((p) => (p + 1) % M_DUR.length), M_DUR[phase])
    return () => clearTimeout(t)
  }, [phase, active])

  const cur = M_CUR[phase]
  const showForm = phase <= 2
  const showStatus = phase === 3

  return (
    <div className="relative">
      <GifCursor x={cur.x} y={cur.y} visible={cur.show} clicking={cur.click} />

      {/* Dark card (always mounted) */}
      <div className="rounded-2xl bg-[#0f0f0f] relative overflow-hidden" style={{ minHeight: 170 }}>
        {/* ── Deploy form layer ── */}
        <div
          className="p-5 sm:p-6"
          style={{
            opacity: showForm ? 1 : 0,
            transform: showForm ? 'none' : 'translateY(-10px)',
            transition: 'opacity .45s ease, transform .45s ease',
            ...(showForm
              ? {}
              : {
                  position: 'absolute' as const,
                  inset: 0,
                  pointerEvents: 'none' as const,
                }),
          }}
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Meeting
          </p>
          <h3 className="mb-4 text-base font-bold text-white">Invite Lira to a meeting</h3>

          {/* Type chips */}
          <div className="mb-3 flex flex-wrap gap-2">
            {['General', 'Stand-up', '1:1', 'Technical'].map((t, i) => (
              <span
                key={t}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  i === 0
                    ? 'bg-[#3730a3] text-white shadow-sm shadow-[#3730a3]/40'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Link input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
                <VideoCameraIcon className="h-4 w-4 text-white/25" />
              </div>
              <div className="flex w-full items-center rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-14 text-sm text-white">
                <span
                  key={phase >= 1 ? 'on' : 'off'}
                  className={`flow-typing ${phase >= 1 ? 'on' : ''}`}
                >
                  https://meet.google.com/abc-defg-hij
                </span>
                {phase >= 1 && phase <= 2 && <span className="flow-caret" />}
              </div>
              {/* Platform badge */}
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{
                  opacity: phase >= 1 ? 1 : 0,
                  transition: phase >= 1 ? 'opacity .35s ease 1.8s' : 'opacity .15s ease',
                }}
              >
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Meet
                </span>
              </div>
            </div>
            <button
              className={`flex shrink-0 items-center gap-2 rounded-xl bg-[#3730a3] px-4 py-2.5 text-sm font-semibold text-white transition-shadow duration-300 ${
                phase === 2 ? 'shadow-[0_0_0_5px_rgba(55,48,163,0.25)]' : ''
              }`}
            >
              Add Lira
            </button>
          </div>
        </div>

        {/* ── Active status layer ── */}
        <div
          className="p-5 sm:p-6"
          style={{
            opacity: showStatus ? 1 : 0,
            transform: showStatus ? 'none' : 'translateY(10px)',
            transition: 'opacity .45s ease, transform .45s ease',
            ...(showStatus
              ? {}
              : {
                  position: 'absolute' as const,
                  inset: 0,
                  pointerEvents: 'none' as const,
                }),
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Lira is in the meeting</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/40">
                  <VideoCameraIcon className="h-3 w-3" />
                  Google Meet
                </p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-red-400">
              Remove from call
            </span>
          </div>
        </div>
      </div>

      {/* Insight bar (fades in during status phase) */}
      <div
        className="mt-3 rounded-xl border border-gray-200 bg-white p-3.5"
        style={{
          opacity: showStatus ? 1 : 0,
          transform: showStatus ? 'none' : 'translateY(8px)',
          transition: 'opacity .35s ease .25s, transform .35s ease .25s',
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/lira_black_with_white_backgound.png" alt="" className="h-4 w-4 rounded-full" />
          <span className="text-xs font-semibold text-gray-700">Lira is listening…</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        <p className="mt-1 text-[11px] text-gray-500">
          3 action items captured · 1 decision logged
        </p>
      </div>
    </div>
  )
}

/* ─────────────────── Tasks GIF ─────────────────── */
function TasksGif({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setPhase((p) => (p + 1) % T_DUR.length), T_DUR[phase])
    return () => clearTimeout(t)
  }, [phase, active])

  const statusLabel = phase <= 0 ? 'Pending' : phase <= 1 ? 'In Progress' : 'Complete'
  const statusColor =
    phase <= 0
      ? 'bg-orange-50 text-orange-500 border-orange-200'
      : phase <= 1
        ? 'bg-violet-50 text-violet-500 border-violet-200'
        : 'bg-green-50 text-green-600 border-green-200'

  return (
    <div className="relative">
      {/* Task card */}
      <div
        className={`rounded-xl border px-4 py-3.5 transition-colors duration-700 ${
          phase >= 2
            ? 'border-green-200 bg-green-50/30'
            : phase >= 1
              ? 'border-violet-200 bg-violet-50/20'
              : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Status circle */}
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
              phase >= 2
                ? 'border-green-400 bg-green-400'
                : phase >= 1
                  ? 'border-violet-400'
                  : 'border-orange-400'
            }`}
          >
            {phase >= 2 && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800">Follow up with client on proposal</p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="h-3.5 w-3.5 rounded-full"
              />
              Lira
              <span className="ml-0.5 rounded bg-violet-100 px-1 py-px text-[9px] font-bold text-violet-500">
                AI
              </span>
            </p>
          </div>
          <span
            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all duration-500 ${statusColor}`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Progress bar (In Progress only) */}
        <div
          className="mt-3 overflow-hidden"
          style={{
            maxHeight: phase === 1 ? 6 : 0,
            opacity: phase === 1 ? 1 : 0,
            transition: 'max-height .4s ease, opacity .4s ease',
          }}
        >
          <div className="h-1 w-full rounded-full bg-gray-100">
            <div
              key={phase === 1 ? 'fill' : 'idle'}
              className="h-full rounded-full bg-violet-400"
              style={
                phase === 1
                  ? { animation: 'flowProgressFill 2.8s ease-out forwards' }
                  : { width: 0 }
              }
            />
          </div>
        </div>
      </div>

      {/* Result card */}
      <div
        className="mt-3 rounded-xl border border-gray-200 bg-white p-3.5"
        style={{
          opacity: phase === 2 ? 1 : 0,
          transform: phase === 2 ? 'none' : 'translateY(8px)',
          transition: 'opacity .4s ease .2s, transform .4s ease .2s',
        }}
      >
        <div className="mb-1 flex items-center gap-2">
          <img src="/lira_black_with_white_backgound.png" alt="" className="h-4 w-4 rounded-full" />
          <span className="text-xs font-semibold text-green-600">Task completed</span>
          <span className="ml-auto text-[10px] text-gray-400">Just now</span>
        </div>
        <p className="text-[11px] leading-relaxed text-gray-500">
          Sent follow-up email to sarah@acme.co with proposal recap and next steps.
        </p>
      </div>
    </div>
  )
}

/* ─────────────────── Integrations GIF ─────────────────── */
function IntegrationsGif({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => setPhase((p) => (p + 1) % IG_DUR.length), IG_DUR[phase])
    return () => clearTimeout(t)
  }, [phase, active])

  const cur = IG_CUR[phase]

  const integrations = [
    {
      name: 'Linear',
      connectsAt: 1,
      logo: (
        <img
          src="/linear-app-icon-logo.png"
          alt="Linear"
          className="h-5 w-5 rounded object-cover"
        />
      ),
    },
    {
      name: 'Slack',
      connectsAt: 2,
      logo: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52z"
            fill="#E01E5A"
          />
          <path
            d="M6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z"
            fill="#DE1C59"
          />
          <path
            d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834z"
            fill="#36C5F0"
          />
          <path
            d="M8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z"
            fill="#36C5F0"
          />
          <path
            d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834z"
            fill="#2EB67D"
          />
          <path
            d="M17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312z"
            fill="#2EB67D"
          />
          <path
            d="M15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52z"
            fill="#ECB22E"
          />
          <path
            d="M15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"
            fill="#ECB22E"
          />
        </svg>
      ),
    },
    {
      name: 'GitHub',
      connectsAt: -1,
      logo: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#24292f">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      ),
    },
    {
      name: 'Google Drive',
      connectsAt: -1,
      logo: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M4.433 22l3.477-6h12.656l-3.477 6H4.433z" fill="#3777E3" />
          <path d="M15.895 16L8.566 3.58h6.957L22.852 16h-6.957z" fill="#FFCF63" />
          <path d="M1.148 16L8.477 3.58l3.478 6.01L7.91 16H1.148z" fill="#11A861" />
        </svg>
      ),
    },
  ]

  return (
    <div className="relative">
      <GifCursor x={cur.x} y={cur.y} visible={cur.show} clicking={cur.click} />

      <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {integrations.map((ig) => {
          const connected = phase >= ig.connectsAt && ig.connectsAt > 0
          return (
            <div
              key={ig.name}
              className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-500 ${
                connected ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-white shadow-sm">
                {ig.logo}
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800">{ig.name}</span>
              {connected ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  Connected
                </span>
              ) : (
                <span className="rounded-lg border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-400">
                  Connect
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Activity feed */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-3.5"
        style={{
          opacity: phase === 3 ? 1 : 0,
          transform: phase === 3 ? 'none' : 'translateY(8px)',
          transition: 'opacity .4s ease .15s, transform .4s ease .15s',
        }}
      >
        <div className="mb-2 flex items-center gap-2">
          <img src="/lira_black_with_white_backgound.png" alt="" className="h-4 w-4 rounded-full" />
          <span className="text-xs font-semibold text-gray-700">Lira is syncing</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
        {[
          {
            tag: 'Linear',
            text: 'Created issue LIR-142: Update onboarding flow',
          },
          { tag: 'Slack', text: 'Posted summary to #product-updates' },
        ].map((a, i) => (
          <div
            key={a.tag}
            className="flex items-center gap-2 border-t border-gray-50 py-1.5"
            style={{
              opacity: phase >= 3 ? 1 : 0,
              transition: `opacity .3s ease ${0.3 + i * 0.25}s`,
            }}
          >
            <span className="shrink-0 rounded bg-violet-50 px-1.5 py-0.5 text-[9px] font-bold text-violet-500">
              {a.tag}
            </span>
            <span className="min-w-0 truncate text-[11px] text-gray-600">{a.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Features section ── */
function Features() {
  const [tab, setTab] = useState<FlowTab>('meetings')
  const [userPaused, setUserPaused] = useState(false)
  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Auto-cycle tabs
  useEffect(() => {
    if (userPaused) return
    const timer = setInterval(() => {
      setTab((t) => {
        const tabs: FlowTab[] = ['meetings', 'tasks', 'integrations']
        return tabs[(tabs.indexOf(t) + 1) % tabs.length]
      })
    }, TAB_CYCLE_MS)
    return () => clearInterval(timer)
  }, [userPaused])

  // Resume auto-play after user interaction
  useEffect(() => {
    if (!userPaused) return
    clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(() => setUserPaused(false), 20000)
    return () => clearTimeout(pauseRef.current)
  }, [userPaused])

  const handleNav = (id: FlowTab) => {
    setTab(id)
    setUserPaused(true)
  }

  return (
    <section id="features" className="px-6 py-16 pb-24">
      <style>{FLOW_DEMO_STYLES}</style>
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          See how Lira works
        </h2>
        <p className="mb-10 max-w-lg leading-relaxed text-gray-500">
          From live conversations to actions in your stack. Watch every step happen automatically.
        </p>

        <div className="flex flex-col gap-6 md:flex-row md:gap-10">
          {/* Left sidebar nav */}
          <nav className="scrollbar-none -mx-6 flex shrink-0 gap-x-4 gap-y-1 overflow-x-auto px-6 pb-1 md:mx-0 md:w-52 md:flex-col md:gap-1 md:overflow-x-visible md:px-0 md:pb-0">
            {FLOW_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`shrink-0 border-b-2 px-0 py-2.5 text-left transition-all md:border-b-0 md:border-l-[3px] md:py-3 md:pl-4 ${
                  tab === item.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <span
                  className={`block text-sm font-semibold ${tab === item.id ? 'text-gray-900' : ''}`}
                >
                  {item.label}
                </span>
                <span className="mt-0.5 hidden text-xs text-gray-400 md:block">{item.desc}</span>
              </button>
            ))}
          </nav>

          {/* Right: stacked panels (crossfade — no unmounting) */}
          <div className="min-w-0 flex-1">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="relative px-5 py-5 sm:px-6 sm:py-6" style={{ minHeight: 360 }}>
                {(['meetings', 'tasks', 'integrations'] as FlowTab[]).map((key) => {
                  const isActive = tab === key
                  return (
                    <div
                      key={key}
                      style={{
                        opacity: isActive ? 1 : 0,
                        pointerEvents: isActive ? 'auto' : 'none',
                        transition: 'opacity 0.35s ease',
                        ...(isActive
                          ? {}
                          : {
                              position: 'absolute' as const,
                              top: 0,
                              left: 0,
                              right: 0,
                              padding: '20px 24px',
                            }),
                      }}
                    >
                      {key === 'meetings' && (
                        <MeetingsGif
                          key={tab === 'meetings' ? 'on' : 'off'}
                          active={tab === 'meetings'}
                        />
                      )}
                      {key === 'tasks' && (
                        <TasksGif key={tab === 'tasks' ? 'on' : 'off'} active={tab === 'tasks'} />
                      )}
                      {key === 'integrations' && (
                        <IntegrationsGif
                          key={tab === 'integrations' ? 'on' : 'off'}
                          active={tab === 'integrations'}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface UseCase {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
}

const USE_CASES: UseCase[] = [
  {
    Icon: HeartIcon,
    title: 'Customer Support',
    description: 'Resolve tickets in seconds across chat, portal, and email, grounded in your docs.',
  },
  {
    Icon: ArrowTrendingUpIcon,
    title: 'Sales Teams',
    description: 'Real-time objection coaching. CRM auto-fill. Deal insights pushed to HubSpot and Salesforce.',
  },
  {
    Icon: BuildingOffice2Icon,
    title: 'Executive Teams',
    description: 'Every decision becomes a tracked action. Follow-ups posted to Slack before the call ends.',
  },
  {
    Icon: CodeBracketIcon,
    title: 'Engineering Teams',
    description: 'Incident reviews, sprint planning. Lira surfaces decisions and creates Linear tickets.',
  },
  {
    Icon: BookOpenIcon,
    title: 'Knowledge & Onboarding',
    description: 'Lira answers policy questions from your docs and tracks new-hire progress automatically.',
  },
  {
    Icon: BoltIcon,
    title: 'Client Success',
    description: 'Every QBR followed up. Action items extracted, assigned, and sent automatically.',
  },
]

// ─── Integrations grid ──────────────────────────────────────────────────────

const INTEGRATION_GROUPS: { label: string; items: { name: string; slug: string }[] }[] = [
  {
    label: 'Communication',
    items: [
      { name: 'Slack', slug: 'slack' },
      { name: 'Microsoft Teams', slug: 'microsoftteams' },
      { name: 'Google Meet', slug: 'googlemeet' },
      { name: 'Zoom', slug: 'zoom' },
    ],
  },
  {
    label: 'CRM & Helpdesk',
    items: [
      { name: 'HubSpot', slug: 'hubspot' },
      { name: 'Salesforce', slug: 'salesforce' },
      { name: 'Zendesk', slug: 'zendesk' },
      { name: 'Intercom', slug: 'intercom' },
    ],
  },
  {
    label: 'Productivity',
    items: [
      { name: 'Linear', slug: 'linear' },
      { name: 'Jira', slug: 'jira' },
      { name: 'Notion', slug: 'notion' },
      { name: 'Google Workspace', slug: 'google' },
    ],
  },
  {
    label: 'Identity & Cloud',
    items: [
      { name: 'AWS', slug: 'amazonaws' },
      { name: 'Microsoft 365', slug: 'microsoft' },
      { name: 'Okta', slug: 'okta' },
      { name: 'GitHub', slug: 'github' },
    ],
  },
]

function IntegrationsGrid() {
  return (
    <section
      id="integrations"
      className="relative py-24 px-6 border-t border-gray-200/60 overflow-hidden"
    >
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.05) 1px, transparent 0)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, #000 40%, transparent 80%)',
        }}
      />

      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-500 mb-3">
            Works with your stack
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl md:text-5xl font-black tracking-[-0.02em] text-gray-900 leading-[1.08]">
            Lira lives where your conversations already happen.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-500 leading-relaxed">
            Drop Lira into the tools your team uses today. OAuth in one click, no agents to install,
            no schemas to migrate.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {INTEGRATION_GROUPS.map((group) => (
            <div
              key={group.label}
              className="rounded-2xl bg-white ring-1 ring-gray-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_8px_24px_-12px_rgba(16,24,40,0.08)]"
            >
              <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-gray-400 mb-4">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map((it) => (
                  <div
                    key={it.name}
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-gray-50 ring-1 ring-gray-200/80">
                      <img
                        src={`https://cdn.simpleicons.org/${it.slug}`}
                        alt={it.name}
                        loading="lazy"
                        className="h-4 w-4"
                      />
                    </span>
                    <span className="text-[13px] font-semibold text-gray-700">{it.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-gray-400">
          + REST API & webhooks for everything else.
        </p>
      </div>
    </section>
  )
}

function UseCases() {
  return (
    <section id="use-cases" className="py-20 px-6 border-t border-gray-200">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          One platform. Every team that talks to customers.
        </h2>
        <p className="text-gray-500 max-w-md mb-12 leading-relaxed">
          The same engine that resolves support tickets coaches your sales team and runs your meetings, grounded in the same shared knowledge.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {USE_CASES.map(({ Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl p-6 bg-white border border-gray-200 shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.24)] hover:-translate-y-1 transition-all duration-200"
            >
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100 mb-4">
                <Icon className="h-5 w-5 text-gray-700" />
              </div>
              <h3 className="font-black tracking-tight text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    initials: 'AL',
    name: 'Amara L.',
    role: 'VP of People · Brightwave',
    quote:
      'We used to lose 2 hours after every all-hands capturing follow-ups. With Lira, the action list is in Slack before the call even ends.',
  },
  {
    initials: 'DK',
    name: 'David K.',
    role: 'CTO · Axiom Labs',
    quote:
      "I uploaded our architecture docs and Lira can now answer 'what does service X do?' mid-meeting better than most of my engineers.",
  },
  {
    initials: 'SR',
    name: 'Sofia R.',
    role: 'Head of Support · NovaTech',
    quote:
      'Lira resolves 60% of our inbound tickets before a human even sees them, and when it escalates, the context is already perfect. Our CSAT went up, not down.',
  },
]

function Testimonials() {
  const [active, setActive] = useState(0)
  const n = TESTIMONIALS.length
  const touchX = useRef<number | null>(null)

  return (
    <section className="py-20 px-6 border-t border-gray-200 overflow-hidden">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-16">
          Teams building on Lira
        </h2>

        {/* Arc carousel */}
        <div
          className="relative h-[300px] flex items-end justify-center"
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            touchX.current = null
            if (Math.abs(dx) < 40) return
            setActive((a) => (dx < 0 ? (a + 1) % n : (a - 1 + n) % n))
          }}
        >
          {TESTIMONIALS.map((t, i) => {
            const offset = (i - active + n) % n
            const isCenter = offset === 0
            const isRight = offset === 1

            const style: React.CSSProperties = isCenter
              ? {
                  transform: 'translateX(0) rotate(0deg) scale(1) translateY(0px)',
                  zIndex: 10,
                  opacity: 1,
                }
              : isRight
                ? {
                    transform: 'translateX(52%) rotate(6deg) scale(0.87) translateY(28px)',
                    zIndex: 5,
                    opacity: 0.55,
                  }
                : {
                    transform: 'translateX(-52%) rotate(-6deg) scale(0.87) translateY(28px)',
                    zIndex: 5,
                    opacity: 0.55,
                  }

            return (
              <div
                key={t.name}
                role="button"
                tabIndex={0}
                className="absolute w-full max-w-sm cursor-pointer rounded-2xl bg-white border border-gray-200 shadow-xl p-7 flex flex-col gap-5 transition-all duration-500 ease-out"
                style={style}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setActive(i)
                }}
              >
                <blockquote className="text-sm text-gray-600 leading-relaxed text-left">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {t.initials}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => setActive((a) => (a - 1 + n) % n)}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === active ? 'w-5 h-2 bg-gray-900' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setActive((a) => (a + 1) % n)}
            className="h-9 w-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-300 transition-all"
            aria-label="Next"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What is Conversational Intelligence?',
    a: "It's the category of software that captures, understands, and acts on your business conversations: calls, meetings, chats, tickets, emails. Lira is a CI platform, meaning a single engine powers customer support, sales coaching, and meetings. One brain, one memory of your business.",
  },
  {
    q: 'What makes Lira different from a note-taker like Otter or Fireflies?',
    a: "Note-takers listen and transcribe. Lira listens, understands, and acts. It resolves tickets, updates your CRM, creates Linear tickets, and sends follow-ups automatically. The conversation is the input; the executed action is the output.",
  },
  {
    q: 'How does the customer support agent work?',
    a: "Plug in a chat widget, share a portal link, or forward emails. Lira answers in seconds using your documentation and past tickets, escalates to a human the moment it's the right call, and syncs everything to Slack, HubSpot, or Zendesk.",
  },
  {
    q: 'Where does Lira get its knowledge from?',
    a: "From whatever you give it: help-center articles, PDFs, Notion, Google Docs, past conversations. It indexes them into a semantic knowledge base grounded in your organization, so responses stay accurate and on-brand.",
  },
  {
    q: 'Is my data secure?',
    a: "TLS 1.2+ in transit, AES-256 at rest, OAuth 2.0 PKCE for integrations, and strict org isolation. We never use your data to train models. You can delete everything from settings at any time. GDPR-aligned and OWASP Top 10 hardened.",
  },
  {
    q: 'What integrations are supported?',
    a: "Slack, Google Workspace, Microsoft 365, HubSpot, Salesforce, Linear, Jira, Zendesk, and outbound webhooks. Amazon Nova Sonic powers real-time voice; Nova Lite powers reasoning and tool use.",
  },
]

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 px-6 border-t border-gray-200">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-10">Common questions</h2>
        <div className="divide-y divide-gray-200">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                className="flex w-full items-center justify-between py-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                <ChevronRightIcon
                  className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open === i ? 'rotate-90' : ''}`}
                />
              </button>
              {open === i && <p className="text-sm text-gray-500 leading-relaxed pb-5">{faq.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="py-24 px-6 border-t border-gray-200 text-center">
      <h2 className="mx-auto max-w-xl text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-4">
        Your conversations deserve better than a transcript
      </h2>
      <p className="mx-auto max-w-md text-gray-500 mb-8 leading-relaxed">
        Start with Customer Support, free. Lira resolves tickets, updates your CRM, and books follow-ups while your team sleeps.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
        >
          <ComputerDesktopIcon className="h-3.5 w-3.5" />
          Start free
        </Link>
        <a
          href="mailto:hello@creovine.com"
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition py-3"
        >
          Talk to the team <ArrowRightIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div className="min-h-screen font-sans antialiased" style={{ backgroundColor: '#ebebeb' }}>
      <SEO
        title="Lira · Conversational Intelligence Platform"
        description="Lira is a Conversational Intelligence platform. One AI agent that handles customer support, coaches sales calls, and runs meetings, grounded in your knowledge and responding in real time."
        keywords="conversational intelligence platform, AI customer support agent, AI support automation, real-time sales coaching AI, AI meeting assistant, voice AI agent, knowledge-grounded AI, conversational AI for SaaS, Lira AI"
        path="/"
      />
      <MarketingNavbar />
      <Hero />
      <HubAndSpoke />
      <HowLiraThinks />
      <InAction />
      <SupportShowcase />
      <Features />
      <IntegrationsGrid />
      <UseCases />
      <Testimonials />
      <FAQ />
      <SecurityStrip />
      <FinalCTA />
      <MarketingFooter />
    </div>
  )
}
