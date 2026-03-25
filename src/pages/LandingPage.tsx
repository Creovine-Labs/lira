import React from 'react'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CodeBracketIcon,
  ComputerDesktopIcon,
  HeartIcon,
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

type DemoMode = 'meetings' | 'interviews' | 'sales' | 'support'
const DEMO_MODES: DemoMode[] = ['meetings', 'interviews', 'sales', 'support']
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
  const [mode, setMode] = useState<DemoMode>('meetings')
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
  const ivActive = (['lira', 'candidate', 'lira', 'candidate'] as const)[phase]
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
      className="mx-auto mt-16 sm:mt-24 max-w-6xl px-2 sm:px-4 md:px-6"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{MEETING_DEMO_STYLES}</style>

      {/* ── Tab bar ── */}
      <div className="flex items-center justify-center mb-4 sm:mb-6">
        <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1.5">
          {[
            { id: 'meetings' as DemoMode, label: 'Meetings', Icon: VideoCameraIcon },
            { id: 'interviews' as DemoMode, label: 'Interviews', Icon: CheckBadgeIcon },
            { id: 'sales' as DemoMode, label: 'Sales', Icon: ArrowTrendingUpIcon },
            { id: 'support' as DemoMode, label: 'Support', Icon: HeartIcon },
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

          {/* Interviews — mobile: Alex K. (candidate) talking */}
          {mode === 'interviews' && (
            <div className="demo-fade-in">
              {/* Main speaker — candidate talking */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-[#1a1a2e]"
                style={{ height: 240 }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#4285f4]/60 meet-pulse-blue">
                    <img
                      src="/participants/Alex K.jpg"
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 bg-black/50 rounded-full px-2 py-0.5">
                  <WaveBars />
                  <span className="text-[10px] text-white/80 font-medium">Alex K. · Candidate</span>
                </div>
                <div className="absolute top-2.5 left-0 right-0 text-center">
                  <span className="text-[10px] text-white/50 font-medium bg-black/30 rounded-full px-3 py-0.5">
                    Interview · 09:31
                  </span>
                </div>
                {/* Lira thumbnail — bottom right */}
                <div className="absolute bottom-2.5 right-2.5">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src="/lira_black_with_white_backgound.png"
                      alt=""
                      className="w-full h-full object-cover"
                    />
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

          {(mode === 'meetings' || mode === 'interviews') && (
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
                    {mode === 'meetings' ? 'Team Standup' : 'Product Manager Interview'}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[10px] sm:text-[11px] text-white/40 font-medium tabular-nums">
                      {mode === 'meetings' ? '12:04' : '09:31'}
                    </span>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/40"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                      </svg>
                      <span className="text-[10px] sm:text-[11px] text-white/40">
                        {mode === 'meetings' ? '3' : '2'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Video grid */}
                <div className="bg-[#202124] p-2 sm:p-3 md:p-4">
                  {mode === 'meetings' ? (
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
                  ) : (
                    /* ── 2-tile interview grid ── */
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 max-w-[68%] mx-auto">
                      {/* Lira — interviewer */}
                      <div
                        className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-500 ${ivActive === 'lira' ? 'border-violet-500/70 shadow-[0_0_16px_rgba(139,92,246,.35)]' : 'border-white/[.06]'}`}
                      >
                        <div className="absolute inset-0 bg-[#131320] flex items-center justify-center">
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-violet-400/25 transition-all duration-500 ${ivActive === 'lira' ? 'meet-pulse' : ''}`}
                          >
                            <img
                              src="/lira_black_with_white_backgound.png"
                              alt="Lira"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 bg-black/40 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                          {ivActive === 'lira' ? (
                            <WaveBars />
                          ) : (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
                          )}
                          <span className="text-[8px] sm:text-[10px] text-white/90 font-medium">
                            Lira · Interviewer
                          </span>
                        </div>
                      </div>

                      {/* Candidate */}
                      <div
                        className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all duration-500 ${ivActive === 'candidate' ? 'border-[#4285f4] shadow-[0_0_16px_rgba(66,133,244,.35)]' : 'border-white/[.06]'}`}
                      >
                        <div className="absolute inset-0 bg-[#1a1a2e] flex items-center justify-center">
                          <div
                            className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 transition-all duration-500 ${ivActive === 'candidate' ? 'border-[#4285f4]/60 meet-pulse-blue' : 'border-white/10'}`}
                          >
                            <img
                              src="/participants/Alex K.jpg"
                              alt="Alex K."
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2.5 sm:left-2.5 flex items-center gap-1 sm:gap-1.5 bg-black/40 rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1">
                          {ivActive === 'candidate' ? (
                            <WaveBars />
                          ) : (
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400/70" />
                          )}
                          <span className="text-[8px] sm:text-[10px] text-white/90 font-medium">
                            Alex K. · Candidate
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
  const [meetingUrl, setMeetingUrl] = React.useState('')
  const [showModal, setShowModal] = React.useState(false)

  const handleJoin = () => {
    const trimmed = meetingUrl.trim()
    if (trimmed) {
      setShowModal(true)
    } else {
      window.location.href = '/signup'
    }
  }

  return (
    <>
      {showModal && <MeetingModal url={meetingUrl} onClose={() => setShowModal(false)} />}
      <section className="relative overflow-hidden pt-36 sm:pt-44 pb-0 px-6 text-center">
        {/* Headline */}
        <h1 className="mx-auto max-w-2xl text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.06]">
          The{' '}
          <span
            className="inline-block -rotate-[1.8deg] translate-y-1 text-white px-3 sm:px-4 py-0.5 sm:py-1 rounded-lg ai-badge"
            style={{
              background: '#3730a3',
              boxShadow: '3px 5px 0px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            AI
          </span>{' '}
          that listens,
          <br />
          remembers, and acts.
        </h1>

        {/* Join meeting widget */}
        <div className="mx-auto mt-12 sm:mt-16 max-w-lg">
          <div className="flex items-center gap-3 rounded-2xl bg-white border border-gray-200 shadow-md px-5 py-3.5">
            <VideoCameraIcon className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="url"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              placeholder="Paste a Google Meet link…"
              className="flex-1 min-w-0 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
            />
            <button
              onClick={handleJoin}
              className="shrink-0 rounded-xl bg-[#3730a3] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#312e81] transition"
            >
              Add Lira
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-400 tracking-wide">
            ✦ Lira joins as a voice participant — no plugins required ✦
          </p>
        </div>

        {/* Meeting demo */}
        <MeetingDemo />
      </section>
    </>
  )
}
function MidCTA() {
  return (
    <section className="py-20 px-6 text-center">
      <p className="mx-auto max-w-lg text-base text-gray-500 leading-relaxed">
        One AI. Every conversation that matters. Meetings, interviews, sales calls, customer
        support. Lira is already in the room, taking notes, answering questions, and keeping your
        team moving. No setup. No plugins. Just paste a link.
      </p>
    </section>
  )
}

// ─── Feature Flows (animated demos) ──────────────────────────────────────────

const FLOW_DEMO_STYLES = `
  @keyframes flowFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes flowSlideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes flowPulseGreen{0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.5)}50%{box-shadow:0 0 0 6px rgba(74,222,128,0)}}
  @keyframes flowProgressBar{from{width:0%}to{width:100%}}
  @keyframes flowGlow{0%,100%{box-shadow:0 0 0 0 rgba(55,48,163,.3)}50%{box-shadow:0 0 0 8px rgba(55,48,163,0)}}
  @keyframes flowPulseAmber{0%,100%{opacity:.6}50%{opacity:1}}
  @keyframes flowTypeCursor{0%,100%{border-color:transparent}50%{border-color:#3730a3}}
  .flow-fade{animation:flowFadeIn .35s ease-out both}
  .flow-slide{animation:flowSlideUp .4s ease-out both}
  .flow-pulse-green{animation:flowPulseGreen 1.3s ease-in-out infinite}
  .flow-glow{animation:flowGlow 1.3s ease-in-out infinite}
  .flow-pulse-amber{animation:flowPulseAmber 1s ease-in-out infinite}
  .flow-type-cursor{border-right:2px solid;animation:flowTypeCursor .8s step-end infinite}
`

type FlowTab = 'meetings' | 'interviews' | 'tasks' | 'integrations'

const FLOW_NAV: { id: FlowTab; label: string; desc: string }[] = [
  { id: 'meetings', label: 'Meetings', desc: 'Send Lira to any meeting' },
  { id: 'interviews', label: 'Interviews', desc: 'AI-powered first rounds' },
  { id: 'tasks', label: 'Tasks', desc: 'Automated follow-through' },
  { id: 'integrations', label: 'Integrations', desc: 'Connect your tools' },
]

const FLOW_DURATIONS: Record<FlowTab, number[]> = {
  meetings: [3500, 3500, 3500],
  interviews: [3500, 3500, 3500],
  tasks: [3500, 3500, 3500],
  integrations: [3500, 3500, 3500],
}

/* ── Meetings Flow ── */
function MeetingsFlow({ step }: { step: number }) {
  return (
    <div className="space-y-4 flow-fade" key={step}>
      {/* Step 0: Paste link + deploy */}
      {step === 0 && (
        <div className="space-y-5">
          {/* Dark deploy card — matches actual dashboard */}
          <div className="rounded-2xl bg-[#0f0f0f] p-6">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Meeting
            </p>
            <h3 className="mb-5 text-lg font-bold text-white">Invite Lira to a meeting</h3>

            {/* Meeting type chips */}
            <div className="mb-4 flex flex-wrap gap-2">
              {['General', 'Stand-up', '1:1', 'Technical'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? 'bg-[#3730a3] text-white shadow-sm shadow-[#3730a3]/40' : 'bg-white/10 text-white/50'}`}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* Link input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2">
                  <VideoCameraIcon className="h-4 w-4 text-white/25" />
                </div>
                <div className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-16 text-sm text-white">
                  <span className="flow-type-cursor text-white/90">
                    https://meet.google.com/abc-defg-hij
                  </span>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Meet
                  </span>
                </div>
              </div>
              <button className="flex shrink-0 items-center gap-2 rounded-xl bg-[#3730a3] px-5 py-3 text-sm font-semibold text-white flow-glow">
                Add Lira
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Lira is in the meeting */}
      {step === 1 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0f0f0f] p-6">
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
              <button className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10 flow-glow">
                Remove from call
              </button>
            </div>
          </div>

          {/* Live insight preview */}
          <div
            className="rounded-xl border border-gray-200 bg-white p-4 flow-slide"
            style={{ animationDelay: '.2s' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="h-5 w-5 rounded-full"
              />
              <span className="text-xs font-semibold text-gray-700">Lira is listening…</span>
              <span className="ml-auto text-[10px] text-gray-400">Live</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              3 action items captured · 1 decision logged · Summary will be ready when the meeting
              ends.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Meeting ended */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl bg-[#0f0f0f] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Lira has left the meeting</p>
                <p className="mt-0.5 text-xs text-white/40">Meeting summary is ready</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ animation: 'flowProgressBar 3s ease-out forwards' }}
              />
            </div>
          </div>

          <div
            className="rounded-xl border border-gray-200 bg-white p-4 flow-slide"
            style={{ animationDelay: '.15s' }}
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Meeting Summary
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                API rate limit issue — assigned to Kwame, due Thursday
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                Design approval pending — product lead sign-off needed
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />2 tasks pushed
                to Slack #engineering
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Interviews Flow ── */
function InterviewsFlow({ step }: { step: number }) {
  return (
    <div className="space-y-4 flow-fade" key={step}>
      {/* Step 0: Create a role */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Interview Roles</h3>
            <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold shadow-sm flow-glow">
              + Create Role
            </button>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'Senior Software Engineer',
                dept: 'Engineering',
                candidates: 8,
                active: true,
              },
              { title: 'Product Manager', dept: 'Product', candidates: 3, active: false },
            ].map((role) => (
              <div
                key={role.title}
                className={`flex items-center gap-4 rounded-xl border px-4 py-3.5 ${role.active ? 'border-[#3730a3]/20 bg-violet-50/60' : 'border-gray-100 bg-white'}`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 shrink-0">
                  <CheckBadgeIcon className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-gray-800 block">{role.title}</span>
                  <span className="text-xs text-gray-400">
                    {role.dept} · {role.candidates} candidates
                  </span>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Inside a role — questions + scoring */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Roles</span>
            <ChevronRightIcon className="w-3 h-3" />
            <span className="font-semibold text-gray-800">Senior Software Engineer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Questions card */}
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Questions · 12
              </p>
              {['System design approach', 'Code review process', 'Distributed systems'].map(
                (q, i) => (
                  <div
                    key={q}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs text-gray-600 truncate">{q}</span>
                  </div>
                )
              )}
              <p className="text-[10px] text-gray-400 mt-2">+9 more questions</p>
            </div>

            {/* Scoring card */}
            <div className="rounded-xl border border-gray-100 bg-white p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                Top Candidates
              </p>
              {[
                { name: 'Adaeze O.', score: 4.7, status: 'Excellent' },
                { name: 'Jordan B.', score: 4.2, status: 'Good' },
                { name: 'Alex K.', score: 3.8, status: 'Good' },
              ].map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
                >
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-600 shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-700 flex-1">{c.name}</span>
                  <span className="text-[10px] font-bold text-violet-500">{c.score}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Start interview */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden mx-auto mb-3 border-2 border-violet-200 flow-pulse-green">
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-1">Lira is interviewing Alex K.</p>
            <p className="text-xs text-gray-400 mb-4">
              Senior Software Engineer · Question 3 of 12
            </p>

            <div className="max-w-xs mx-auto mb-4">
              <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#3730a3]"
                  style={{ width: '25%', transition: 'width 1s ease' }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                <span>In progress</span>
                <span>~25 min remaining</span>
              </div>
            </div>

            <div
              className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-left flow-slide"
              style={{ animationDelay: '.2s' }}
            >
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Current question
              </p>
              <p className="text-xs text-gray-600">
                &ldquo;Walk me through how you&apos;d design a rate limiter for a distributed
                API.&rdquo;
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Tasks Flow ── */
function TasksFlow({ step }: { step: number }) {
  return (
    <div className="space-y-4 flow-fade" key={step}>
      {/* Step 0: Task list with a new task */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">Tasks</h3>
            <button className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold shadow-sm flow-glow">
              + Create Task
            </button>
          </div>

          <div className="space-y-2">
            {[
              {
                title: 'Follow up with client on proposal',
                assignee: 'Lira',
                status: 'pending',
                isAI: true,
              },
              {
                title: 'Update pricing page copy',
                assignee: 'Miriam L.',
                status: 'done',
                isAI: false,
              },
              { title: 'Send Q1 report', assignee: 'Fatai O.', status: 'in_progress', isAI: false },
            ].map((t) => (
              <div
                key={t.title}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${t.isAI ? 'border-[#3730a3]/20 bg-violet-50/40' : 'border-gray-100 bg-white'}`}
              >
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    t.status === 'done'
                      ? 'border-green-400 bg-green-400'
                      : t.status === 'in_progress'
                        ? 'border-orange-400'
                        : 'border-violet-400'
                  }`}
                >
                  {t.status === 'done' && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-700 block truncate">
                    {t.title}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    {t.isAI && (
                      <img
                        src="/lira_black_with_white_backgound.png"
                        alt=""
                        className="w-3.5 h-3.5 rounded-full"
                      />
                    )}
                    {t.assignee}
                    {t.isAI && (
                      <span className="text-[9px] font-bold text-violet-500 bg-violet-100 px-1 py-px rounded">
                        AI
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    t.status === 'done'
                      ? 'bg-green-50 text-green-600'
                      : t.status === 'in_progress'
                        ? 'bg-orange-50 text-orange-500'
                        : 'bg-violet-50 text-violet-500'
                  }`}
                >
                  {t.status === 'done'
                    ? 'Done'
                    : t.status === 'in_progress'
                      ? 'In Progress'
                      : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Lira working on the task */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#3730a3]/20 bg-violet-50/40 px-4 py-3.5 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-violet-400 shrink-0 flow-pulse-amber" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 block">
                Follow up with client on proposal
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <img
                  src="/lira_black_with_white_backgound.png"
                  alt=""
                  className="w-3.5 h-3.5 rounded-full"
                />
                Lira · AI Follow-up
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
              Pending
            </span>
          </div>

          <div
            className="rounded-xl border border-gray-200 bg-white p-4 flow-slide"
            style={{ animationDelay: '.15s' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs font-semibold text-gray-700">Lira is working…</span>
              <span className="ml-auto text-[10px] text-gray-400">Just now</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Drafting follow-up email to sarah@acme.co with proposal summary and next steps…
            </p>
            <div className="mt-3 w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-400"
                style={{ animation: 'flowProgressBar 3s ease-out forwards' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Task completed */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50/40 px-4 py-3.5 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-green-400 flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold text-gray-800 block">
                Follow up with client on proposal
              </span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <img
                  src="/lira_black_with_white_backgound.png"
                  alt=""
                  className="w-3.5 h-3.5 rounded-full"
                />
                Completed by Lira
              </span>
            </div>
            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-600">
              Complete
            </span>
          </div>

          <div
            className="rounded-xl border border-gray-200 bg-white p-4 flow-slide"
            style={{ animationDelay: '.1s' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/lira_black_with_white_backgound.png"
                alt=""
                className="w-5 h-5 rounded-full"
              />
              <span className="text-xs font-semibold text-green-600">Task completed</span>
              <span className="ml-auto text-[10px] text-gray-400">2 min ago</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Sent follow-up email to sarah@acme.co with proposal recap, pricing comparison, and
              suggested meeting for Thursday at 2pm.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Integrations Flow ── */
function IntegrationsFlow({ step }: { step: number }) {
  const integrations = [
    {
      name: 'Linear',
      desc: 'Project tracking',
      logo: (
        <img
          src="/linear-app-icon-logo.png"
          alt="Linear"
          className="w-5 h-5 rounded object-cover"
        />
      ),
      connectedAt: 1,
    },
    {
      name: 'Slack',
      desc: 'Team messaging',
      logo: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
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
      connectedAt: 2,
    },
    {
      name: 'Google Drive',
      desc: 'Documents & files',
      logo: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path d="M4.433 22l3.477-6h12.656l-3.477 6H4.433z" fill="#3777E3" />
          <path d="M15.895 16L8.566 3.58h6.957L22.852 16h-6.957z" fill="#FFCF63" />
          <path d="M1.148 16L8.477 3.58l3.478 6.01L7.91 16H1.148z" fill="#11A861" />
        </svg>
      ),
      connectedAt: -1,
    },
    {
      name: 'GitHub',
      desc: 'Code & PRs',
      logo: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#24292f">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
      ),
      connectedAt: -1,
    },
  ]

  return (
    <div className="space-y-4 flow-fade" key={step}>
      {/* Steps 0-1: Integration cards */}
      {step <= 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Connect your tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {integrations.map((ig) => {
              const connected = step >= ig.connectedAt && ig.connectedAt > 0
              return (
                <div
                  key={ig.name}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-500 ${connected ? 'border-green-200 bg-green-50/50' : 'border-gray-100 bg-white'}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                    {ig.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-gray-800">{ig.name}</span>
                    <span className="text-[11px] text-gray-400 block">{ig.desc}</span>
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-[11px] font-semibold text-green-600">Connected</span>
                    </div>
                  ) : (
                    <span className="text-xs font-semibold text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1">
                      Connect
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 2: Lira syncing */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-gray-800">Lira is syncing</h3>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex items-center justify-center gap-4 py-3">
            {integrations.slice(0, 2).map((ig) => (
              <div key={ig.name} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                  {ig.logo}
                </div>
                <span className="text-xs font-medium text-gray-600">{ig.name}</span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="h-px w-4 bg-gray-200" />
              <div className="w-8 h-8 rounded-full overflow-hidden border border-violet-200 flow-pulse-green">
                <img
                  src="/lira_black_with_white_backgound.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="h-px w-4 bg-gray-200" />
            </div>
          </div>

          <div className="space-y-2 flow-slide" style={{ animationDelay: '.1s' }}>
            {[
              {
                platform: 'Linear',
                action: 'Created issue LIR-142: Update onboarding flow',
                time: 'Just now',
              },
              {
                platform: 'Slack',
                action: 'Posted summary to #product-updates',
                time: '1 min ago',
              },
            ].map((a) => (
              <div
                key={a.action}
                className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-100 px-3 py-2"
              >
                <span className="text-[10px] font-bold text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded shrink-0">
                  {a.platform}
                </span>
                <span className="text-xs text-gray-600 flex-1 min-w-0 truncate">{a.action}</span>
                <span className="text-[10px] text-gray-400 shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main Features section ── */
function Features() {
  const [tab, setTab] = useState<FlowTab>('meetings')
  const [step, setStep] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const pauseRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const maxSteps = FLOW_DURATIONS[tab].length

  // Auto-advance steps
  useEffect(() => {
    if (userPaused) return
    const duration = FLOW_DURATIONS[tab][step] ?? 3500
    const timer = setTimeout(() => {
      setStep((s) => {
        const next = s + 1
        if (next >= maxSteps) {
          // Move to next tab
          const tabs: FlowTab[] = ['meetings', 'interviews', 'tasks', 'integrations']
          const idx = tabs.indexOf(tab)
          const nextTab = tabs[(idx + 1) % tabs.length]
          setTimeout(() => {
            setTab(nextTab)
            setStep(0)
          }, 0)
          return s
        }
        return next
      })
    }, duration)
    return () => clearTimeout(timer)
  }, [step, tab, maxSteps, userPaused])

  // Resume auto-play after manual interaction
  useEffect(() => {
    if (!userPaused) return
    clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(() => setUserPaused(false), 20000)
    return () => clearTimeout(pauseRef.current)
  }, [userPaused])

  const handleNav = (id: FlowTab) => {
    setTab(id)
    setStep(0)
    setUserPaused(true)
  }

  return (
    <section id="features" className="py-16 px-6 pb-24">
      <style>{FLOW_DEMO_STYLES}</style>
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          See how Lira works
        </h2>
        <p className="text-gray-500 max-w-lg mb-10 leading-relaxed">
          From meetings to integrations — watch how Lira handles every step, automatically.
        </p>

        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          {/* Left: sidebar nav */}
          <nav className="md:w-56 shrink-0 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-x-4 gap-y-1 md:gap-1 -mx-6 px-6 md:mx-0 md:px-0 pb-1 md:pb-0 scrollbar-none">
            {FLOW_NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`shrink-0 text-left px-0 py-2.5 md:py-3.5 transition-all border-b-2 md:border-b-0 md:border-l-[3px] md:pl-4 ${
                  tab === item.id
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-400 hover:text-gray-700 border-transparent'
                }`}
              >
                <span
                  className={`text-sm font-semibold block ${tab === item.id ? 'text-gray-900' : ''}`}
                >
                  {item.label}
                </span>
                <span className="text-xs text-gray-400 hidden md:block mt-0.5">{item.desc}</span>
                {/* Progress indicator for auto-play */}
                {tab === item.id && !userPaused && (
                  <div className="hidden md:block mt-2 h-0.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      key={`${tab}-${step}`}
                      className="h-full rounded-full bg-gray-900"
                      style={{
                        animation: `flowProgressBar ${FLOW_DURATIONS[tab][step] ?? 3500}ms linear forwards`,
                      }}
                    />
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Right: demo panel */}
          <div className="flex-1 min-w-0">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-5 sm:px-7 sm:py-6" style={{ minHeight: 340 }}>
                {tab === 'meetings' && <MeetingsFlow step={step} />}
                {tab === 'interviews' && <InterviewsFlow step={step} />}
                {tab === 'tasks' && <TasksFlow step={step} />}
                {tab === 'integrations' && <IntegrationsFlow step={step} />}
              </div>

              {/* Step dots */}
              <div className="border-t border-gray-100 px-5 sm:px-7 py-3 flex items-center justify-between bg-gray-50/60">
                <span className="text-xs text-gray-400">
                  Step {step + 1} of {maxSteps}
                </span>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: maxSteps }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setStep(i)
                        setUserPaused(true)
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? 'bg-gray-900 scale-125' : i < step ? 'bg-gray-400' : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Use cases ────────────────────────────────────────────────────────────────

interface UseCase {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  description: string
}

const USE_CASES: UseCase[] = [
  {
    Icon: CheckBadgeIcon,
    title: 'Recruiting Teams',
    description: 'Run first-round AI interviews 24/7. Get scored candidate reports before lunch.',
  },
  {
    Icon: BuildingOffice2Icon,
    title: 'Executive Teams',
    description:
      'Every decision becomes a tracked task. Nothing falls through after the meeting ends.',
  },
  {
    Icon: ArrowTrendingUpIcon,
    title: 'Sales Teams',
    description: 'Lira joins discovery calls, takes notes, and pushes deal insights to your CRM.',
  },
  {
    Icon: CodeBracketIcon,
    title: 'Engineering Teams',
    description: 'Incident reviews, sprint planning — Lira surfaces decisions and creates tickets.',
  },
  {
    Icon: BookOpenIcon,
    title: 'Training & Onboarding',
    description: 'Lira answers policy questions and tracks new hire progress automatically.',
  },
  {
    Icon: HeartIcon,
    title: 'Client Success',
    description: 'Every QBR followed up. Next steps extracted, assigned, and sent automatically.',
  },
]

function UseCases() {
  return (
    <section id="use-cases" className="py-20 px-6 border-t border-gray-200">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-2">
          Built for every team that meets
        </h2>
        <p className="text-gray-500 max-w-md mb-12 leading-relaxed">
          Lira adapts to your workflow. The same AI that interviews candidates runs your product
          standups.
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
    role: 'Head of Talent · NovaTech',
    quote:
      'Lira took over initial screening, scored candidates against our rubric, and cut our time-to-hire by 40%. Genuinely transformative.',
  },
]

function Testimonials() {
  const [active, setActive] = useState(0)
  const n = TESTIMONIALS.length

  return (
    <section className="py-20 px-6 border-t border-gray-200 overflow-hidden">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mb-16">
          Teams that stopped drowning in meetings
        </h2>

        {/* Arc carousel */}
        <div className="relative h-[300px] flex items-end justify-center">
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
    q: 'How does Lira join my meetings?',
    a: 'Lira deploys a browser-based bot that joins Google Meet using your meeting link. It appears as a voice participant and uses Amazon Nova Sonic for real-time interaction. No plugins required.',
  },
  {
    q: 'Does Lira work with platforms other than Google Meet?',
    a: 'Google Meet is fully supported today. Zoom and Microsoft Teams are on the roadmap. Reach out if you have a specific requirement.',
  },
  {
    q: 'How does the AI Interview feature work?',
    a: 'Create a role, define an evaluation rubric, and invite candidates with a meeting link. Lira joins, conducts the interview, and generates a scored evaluation report automatically.',
  },
  {
    q: 'Is my meeting data secure?',
    a: 'Yes. All transcripts are encrypted at rest and in transit. We never use your data to train models. Delete everything from your account settings at any time.',
  },
  {
    q: "Can I customise Lira's voice and persona?",
    a: 'Enterprise: custom AI name, voice, and system persona. Team: configure wake word, communication style, and suggestion behaviour.',
  },
  {
    q: 'What integrations does Lira support?',
    a: 'Slack, outbound webhooks, and a REST API out of the box. Jira, Linear, Notion, and HubSpot integrations are in progress.',
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
        Stop letting your meetings go to waste
      </h2>
      <p className="mx-auto max-w-md text-gray-500 mb-8 leading-relaxed">
        Every decision your team makes deserves a follow-through. Lira makes sure it happens.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 shadow-sm"
        >
          <ComputerDesktopIcon className="h-3.5 w-3.5" />
          Get a demo · it's free
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
      <MarketingNavbar />
      <Hero />
      <MidCTA />
      <Features />
      <UseCases />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <MarketingFooter />
    </div>
  )
}
