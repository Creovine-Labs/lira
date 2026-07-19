import { useEffect, useRef, useState } from 'react'

/**
 * LiveAgentDemo — a self-playing "live session" panel for the home page.
 *
 * When it scrolls into view it autonomously plays a scripted Lira support
 * resolution: the customer message types in, Lira reasons, calls tools
 * (spinner -> check), replies, and resolves — then auto-advances to the other
 * scenario. No clicks required; clicking a tab switches immediately.
 *
 * Pure DOM + CSS animation (imperative inside the feed) so the typewriter and
 * sequential reveals don't thrash React. Styled with the site's own tokens
 * (.hx-page vars: ink, cream, --font-sans, --font-mono) so it matches the rest
 * of the site. Monochrome by design — no off-brand colors.
 *
 * Lira stance: the agent answers, grounds, captures, and routes. It never
 * moves money or acts on accounts — escalations open a ticket for the team.
 */

interface Tool {
  name: string
  args: string
  res: string
  ms: number
}
interface Scenario {
  tab: string
  customer: { name: string; avatar: string; text: string }
  thinking: string[]
  tools: Tool[]
  agent: string
  chips: string[]
  duration: number
}

const SCENARIOS: Scenario[] = [
  {
    tab: 'Billing dispute',
    customer: {
      name: 'Amara O.',
      avatar: 'AO',
      text: 'I was charged twice for my plan this month. Can you sort it out?',
    },
    thinking: [
      'intent: billing dispute (0.96)',
      'matching customer by email',
      'redacting sensitive details',
      'reviewing recent invoices',
      'duplicate charge confirmed',
      'refund policy: eligible',
    ],
    tools: [
      {
        name: 'knowledge.search',
        args: '{ topic: "duplicate charge" }',
        res: 'policy matched, 3 articles',
        ms: 360,
      },
      {
        name: 'billing.invoices',
        args: '{ window: "30d" }',
        res: '2 charges, 1 duplicate',
        ms: 540,
      },
      {
        name: 'ticket.create',
        args: '{ type: "refund", route: "billing" }',
        res: 'TCK-4821 opened and routed',
        ms: 280,
      },
    ],
    agent:
      'You are right, there are two charges on the 3rd and one is a duplicate. Our policy covers a reversal, so I have opened ticket TCK-4821 and routed it to the billing team. They will confirm the refund by email, usually within 3 to 5 days.',
    chips: ['Resolved', '38s', 'PII redacted', '0 human touches'],
    duration: 38,
  },
  {
    tab: 'Add a teammate',
    customer: {
      name: 'Daniel K.',
      avatar: 'DK',
      text: 'How do I add a teammate and set their permissions?',
    },
    thinking: [
      'intent: how-to (0.98)',
      'searching knowledge base',
      'top match: Team and roles',
      'grounding answer in 2 sources',
    ],
    tools: [
      {
        name: 'kb.search',
        args: '{ query: "add teammate roles" }',
        res: '3 articles matched',
        ms: 320,
      },
      { name: 'kb.fetch', args: '{ id: "team-roles" }', res: 'steps and role matrix', ms: 240 },
    ],
    agent:
      'Open Settings, then Team, then Invite. Enter their email, choose a role (Admin, Agent, or Viewer), and send. They will get an email to join. Want the full breakdown of what each role can do?',
    chips: ['Resolved', '19s', '2 sources cited', '0 human touches'],
    duration: 19,
  },
]

const CHECK =
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export function LiveAgentDemo() {
  const [active, setActive] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)
  const feedRef = useRef<HTMLDivElement | null>(null)
  const statusRef = useRef<HTMLSpanElement | null>(null)
  const timerRef = useRef<HTMLSpanElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const tokenRef = useRef<{ cancelled: boolean }>({ cancelled: false })
  const rafRef = useRef<number | null>(null)
  const activeRef = useRef(0)
  const startedRef = useRef(false)
  const switchRef = useRef<((idx: number) => void) | null>(null)

  useEffect(() => {
    const reduce = () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))
    const setStatus = (label: string) => {
      if (statusRef.current) statusRef.current.textContent = label
      if (stageRef.current) stageRef.current.dataset.stage = label
    }
    const scrollFeed = () => {
      const f = feedRef.current
      if (f) f.scrollTo({ top: f.scrollHeight, behavior: reduce() ? 'auto' : 'smooth' })
    }
    const make = (tag: string, cls: string, html?: string) => {
      const e = document.createElement(tag)
      e.className = cls
      if (html != null) e.innerHTML = html
      return e
    }
    const reveal = (node: HTMLElement) => {
      feedRef.current?.appendChild(node)
      void node.getBoundingClientRect()
      node.classList.add('lad-in')
      scrollFeed()
    }
    const typewriter = async (el: HTMLElement, text: string, token: { cancelled: boolean }) => {
      if (reduce()) {
        el.textContent = text
        return
      }
      el.classList.add('lad-caret')
      // ~2 chars/tick keeps the typewriter feel but stops long replies from
      // dragging (a single reply at 1 char/33ms sagged ~8s before the payoff).
      const step = text.length > 90 ? 2 : 1
      for (let i = 0; i <= text.length; i += step) {
        if (token.cancelled) return
        el.textContent = text.slice(0, i)
        scrollFeed()
        await sleep(24)
      }
      el.textContent = text
      el.classList.remove('lad-caret')
    }
    const runTimer = (token: { cancelled: boolean }) => {
      const start = performance.now()
      const tick = () => {
        if (token.cancelled) return
        const t = (performance.now() - start) / 1000
        if (timerRef.current) timerRef.current.textContent = `${t.toFixed(1)}s`
        rafRef.current = requestAnimationFrame(tick)
      }
      tick()
    }
    const freezeTimer = (dur: number) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timerRef.current) timerRef.current.textContent = `${dur.toFixed(1)}s`
    }

    const play = async (token: { cancelled: boolean }) => {
      const sc = SCENARIOS[activeRef.current]
      const feed = feedRef.current
      if (!feed) return
      feed.innerHTML = ''
      if (timerRef.current) timerRef.current.textContent = '0.0s'
      setStatus('incoming')
      runTimer(token)

      // 1. Customer message
      const cust = make(
        'div',
        'lad-msg lad-msg-customer',
        `<span class="lad-avatar">${sc.customer.avatar}</span><div class="lad-bubble"><span class="lad-who">${sc.customer.name}</span><p class="lad-text"></p></div>`
      )
      reveal(cust)
      await typewriter(cust.querySelector('.lad-text') as HTMLElement, sc.customer.text, token)
      if (token.cancelled) return
      await sleep(reduce() ? 120 : 520)
      if (token.cancelled) return

      // 2. Reasoning
      setStatus('reasoning')
      const think = make(
        'div',
        'lad-think',
        `<span class="lad-think-label">Lira · reasoning</span><div class="lad-think-lines"></div>`
      )
      reveal(think)
      const lines = think.querySelector('.lad-think-lines') as HTMLElement
      for (const line of sc.thinking) {
        if (token.cancelled) return
        const l = make('div', 'lad-think-line', line)
        lines.appendChild(l)
        void l.getBoundingClientRect()
        l.classList.add('lad-in')
        scrollFeed()
        await sleep(reduce() ? 60 : 340)
      }
      await sleep(reduce() ? 80 : 340)
      if (token.cancelled) return

      // 3. Tool calls
      setStatus('executing')
      for (const tool of sc.tools) {
        if (token.cancelled) return
        const card = make(
          'div',
          'lad-tool',
          `<span class="lad-tool-ic"><span class="lad-spin"></span></span>` +
            `<div class="lad-tool-body"><div class="lad-tool-head">` +
            `<span class="lad-tool-name">${tool.name}</span><span class="lad-tool-ms"></span></div>` +
            `<div class="lad-tool-args">${tool.args}</div><div class="lad-tool-res"></div></div>`
        )
        reveal(card)
        await sleep(reduce() ? 80 : tool.ms)
        if (token.cancelled) return
        const ic = card.querySelector('.lad-tool-ic') as HTMLElement
        ic.innerHTML = CHECK
        ic.classList.add('done')
        const ms = card.querySelector('.lad-tool-ms') as HTMLElement
        ms.textContent = `${tool.ms}ms`
        ms.classList.add('lad-in')
        const res = card.querySelector('.lad-tool-res') as HTMLElement
        res.textContent = `-> ${tool.res}`
        res.classList.add('lad-in')
        scrollFeed()
        await sleep(reduce() ? 60 : 320)
      }
      await sleep(reduce() ? 80 : 320)
      if (token.cancelled) return

      // 4. Agent reply
      setStatus('responding')
      const ag = make(
        'div',
        'lad-msg lad-msg-agent',
        `<span class="lad-avatar lad-avatar-agent">LI</span><div class="lad-bubble lad-bubble-agent"><span class="lad-who">Lira · agent</span><p class="lad-text"></p></div>`
      )
      reveal(ag)
      await typewriter(ag.querySelector('.lad-text') as HTMLElement, sc.agent, token)
      if (token.cancelled) return
      await sleep(reduce() ? 120 : 360)
      if (token.cancelled) return

      // 5. Resolution
      setStatus('resolved')
      freezeTimer(sc.duration)
      const chips = make('div', 'lad-chips')
      sc.chips.forEach((c, i) => {
        const chip = make(
          'span',
          `lad-chip${i === 0 ? ' lad-chip-main' : ''}`,
          `${i === 0 ? CHECK : ''}<span>${c}</span>`
        )
        chips.appendChild(chip)
      })
      reveal(chips)

      // 6. Auto-replay the other scenario
      await sleep(5500)
      if (token.cancelled) return
      switchTo((activeRef.current + 1) % SCENARIOS.length)
    }

    const switchTo = (idx: number) => {
      tokenRef.current.cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      activeRef.current = idx
      setActive(idx)
      const token = { cancelled: false }
      tokenRef.current = token
      setTimeout(() => play(token), 70)
    }

    // expose switchTo for the tab buttons
    switchRef.current = switchTo

    const sectionEl = sectionRef.current
    if (!sectionEl) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true
            switchTo(0)
            io.disconnect()
            break
          }
        }
      },
      { threshold: 0.3 }
    )
    io.observe(sectionEl)

    return () => {
      tokenRef.current.cancelled = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      io.disconnect()
    }
  }, [])

  const onTab = (idx: number) => {
    if (idx === activeRef.current && startedRef.current) return
    startedRef.current = true
    switchRef.current?.(idx)
  }

  return (
    <section className="hx-section lad-section" ref={sectionRef}>
      <div className="hx-container">
        <div className="lad-head">
          <span className="lad-eyebrow">Autonomous resolution</span>
          <h2 className="hx-section-title">Then Lira clocks in.</h2>
          <p className="lad-sub">
            Watch a real support request get read, reasoned through, grounded in your knowledge, and
            resolved, with the ticket already routed. No one pressed a button.
          </p>
        </div>

        <div className="lad-toggle" role="tablist" aria-label="Demo scenarios">
          <span className="lad-toggle-ind" style={{ transform: `translateX(${active * 100}%)` }} />
          {SCENARIOS.map((s, i) => (
            <button
              key={s.tab}
              role="tab"
              type="button"
              aria-selected={active === i}
              className={`lad-tab${active === i ? ' is-active' : ''}`}
              onClick={() => onTab(i)}
            >
              {s.tab}
            </button>
          ))}
        </div>

        <div className="lad-shell" ref={stageRef} data-stage="incoming">
          <div className="lad-bar">
            <span className="lad-dots" aria-hidden="true">
              <i /> <i /> <i />
            </span>
            <span className="lad-bar-label">Lira · live session</span>
            <span className="lad-bar-status">
              <span className="lad-pulse" aria-hidden="true" />
              <span className="lad-status" ref={statusRef}>
                incoming
              </span>
              <span className="lad-timer" ref={timerRef}>
                0.0s
              </span>
            </span>
          </div>
          <div className="lad-feed" ref={feedRef} aria-hidden="true" />
        </div>
      </div>

      <style>{`
        .lad-section { padding-top: 96px; }
        .lad-head { max-width: 680px; }
        .lad-eyebrow { display: inline-block; font-family: var(--font-mono, 'JetBrains Mono', ui-monospace, monospace); font-size: 12px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(2,3,8,0.55); margin-bottom: 14px; }
        .lad-sub { margin: 12px 0 0; max-width: 560px; color: rgba(2,3,8,0.64); line-height: 1.65; font-size: 16px; }

        /* Toggle */
        .lad-toggle { position: relative; display: inline-flex; margin: 30px 0 22px; padding: 5px; border: 1px solid var(--line); border-radius: 999px; background: var(--panel-2); }
        .lad-toggle-ind { position: absolute; top: 5px; bottom: 5px; left: 5px; width: calc(50% - 5px); border-radius: 999px; background: var(--text); transition: transform 0.42s cubic-bezier(0.22,1,0.36,1); }
        .lad-tab { position: relative; z-index: 1; flex: 1; min-width: 150px; padding: 9px 18px; border: 0; background: transparent; cursor: pointer; font-family: var(--font-sans); font-size: 13.5px; font-weight: 600; color: rgba(2,3,8,0.6); transition: color 0.3s ease; white-space: nowrap; }
        .lad-tab.is-active { color: #fbfaf6; }

        /* Shell */
        .lad-shell { border: 1px solid var(--line); border-radius: 20px; background: rgba(255,255,255,0.74); box-shadow: 0 30px 80px rgba(2,3,8,0.10); backdrop-filter: blur(14px); overflow: hidden; }
        .lad-bar { display: flex; align-items: center; gap: 12px; padding: 13px 18px; border-bottom: 1px solid var(--line); background: rgba(255,255,255,0.6); }
        .lad-dots { display: inline-flex; gap: 6px; }
        .lad-dots i { width: 11px; height: 11px; border-radius: 50%; background: rgba(2,3,8,0.16); }
        .lad-bar-label { font-family: var(--font-mono, ui-monospace, monospace); font-size: 12.5px; color: rgba(2,3,8,0.55); }
        .lad-bar-status { margin-left: auto; display: inline-flex; align-items: center; gap: 9px; font-family: var(--font-mono, ui-monospace, monospace); font-size: 12.5px; }
        .lad-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--text); box-shadow: 0 0 0 0 rgba(2,3,8,0.4); animation: lad-pulse 1.8s ease-out infinite; }
        @keyframes lad-pulse { 0% { box-shadow: 0 0 0 0 rgba(2,3,8,0.38); } 70% { box-shadow: 0 0 0 7px rgba(2,3,8,0); } 100% { box-shadow: 0 0 0 0 rgba(2,3,8,0); } }
        .lad-status { color: rgba(2,3,8,0.62); min-width: 76px; }
        .lad-timer { color: var(--text); font-variant-numeric: tabular-nums; font-weight: 600; }

        /* Feed */
        .lad-feed { display: flex; flex-direction: column; gap: 16px; padding: 22px; max-height: 460px; overflow-y: auto; scroll-behavior: smooth; }
        .lad-feed::-webkit-scrollbar { width: 5px; }
        .lad-feed::-webkit-scrollbar-thumb { background: rgba(2,3,8,0.18); border-radius: 3px; }

        .lad-msg, .lad-think, .lad-tool, .lad-chips, .lad-think-line, .lad-tool-ms, .lad-tool-res { opacity: 0; transform: translateY(10px); transition: opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1); }
        .lad-in { opacity: 1 !important; transform: none !important; }

        /* Chat messages */
        .lad-msg { display: flex; gap: 11px; align-items: flex-start; max-width: 86%; }
        .lad-msg-agent { margin-left: auto; flex-direction: row-reverse; }
        .lad-avatar { flex: none; width: 34px; height: 34px; border-radius: 50%; display: grid; place-items: center; font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; font-weight: 700; color: #fbfaf6; background: rgba(2,3,8,0.55); }
        .lad-avatar-agent { background: var(--text); }
        .lad-bubble { border: 1px solid var(--line); border-radius: 4px 14px 14px 14px; background: var(--panel); padding: 11px 14px; }
        .lad-bubble-agent { border-radius: 14px 4px 14px 14px; background: var(--text); border-color: var(--text); }
        .lad-bubble-agent .lad-who { color: rgba(251,250,246,0.62); }
        .lad-bubble-agent .lad-text { color: #fbfaf6; }
        .lad-who { display: block; font-size: 11.5px; font-weight: 700; color: rgba(2,3,8,0.5); margin-bottom: 3px; }
        .lad-text { margin: 0; font-family: var(--font-sans); font-size: 14.5px; line-height: 1.55; color: var(--text); }
        .lad-caret::after { content: '|'; margin-left: 1px; animation: lad-blink 1s step-end infinite; opacity: 0.7; }
        @keyframes lad-blink { 50% { opacity: 0; } }

        /* Reasoning */
        .lad-think { margin-left: 45px; border-left: 2px solid rgba(2,3,8,0.18); padding: 4px 0 4px 14px; }
        .lad-think-label { display: block; font-family: var(--font-mono, ui-monospace, monospace); font-size: 11.5px; font-weight: 600; color: rgba(2,3,8,0.5); margin-bottom: 8px; }
        .lad-think-lines { display: flex; flex-direction: column; gap: 6px; }
        .lad-think-line { font-family: var(--font-mono, ui-monospace, monospace); font-size: 12.5px; color: rgba(2,3,8,0.66); }

        /* Tool cards */
        .lad-tool { margin-left: 45px; display: flex; gap: 12px; align-items: flex-start; border: 1px solid var(--line); border-radius: 12px; background: var(--panel); padding: 12px 14px; }
        .lad-tool-ic { flex: none; width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center; background: var(--panel-2); color: var(--text); }
        .lad-tool-ic svg { width: 15px; height: 15px; }
        .lad-tool-ic.done { background: var(--text); color: #fbfaf6; }
        .lad-spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(2,3,8,0.18); border-top-color: var(--text); animation: lad-spin 0.7s linear infinite; }
        @keyframes lad-spin { to { transform: rotate(360deg); } }
        .lad-tool-body { flex: 1; min-width: 0; }
        .lad-tool-head { display: flex; align-items: center; gap: 10px; }
        .lad-tool-name { font-family: var(--font-mono, ui-monospace, monospace); font-size: 13px; font-weight: 600; color: var(--text); }
        .lad-tool-ms { margin-left: auto; font-family: var(--font-mono, ui-monospace, monospace); font-size: 11px; font-weight: 600; color: rgba(2,3,8,0.5); background: var(--panel-2); border-radius: 999px; padding: 2px 8px; }
        .lad-tool-args { font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; color: rgba(2,3,8,0.5); margin-top: 4px; word-break: break-word; }
        .lad-tool-res { font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; color: var(--text); margin-top: 6px; }

        /* Chips */
        .lad-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-left: 45px; padding-top: 2px; }
        .lad-chip { display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px; border-radius: 999px; font-family: var(--font-mono, ui-monospace, monospace); font-size: 12px; font-weight: 600; color: rgba(2,3,8,0.62); background: var(--panel-2); border: 1px solid var(--line); }
        .lad-chip-main { background: var(--text); color: #fbfaf6; border-color: var(--text); }
        .lad-chip svg { width: 13px; height: 13px; }

        @media (max-width: 720px) {
          .lad-section { padding-top: 64px; }
          .lad-tab { min-width: 0; flex: 1; padding: 9px 10px; font-size: 12.5px; }
          .lad-toggle { display: flex; width: 100%; }
          .lad-msg { max-width: 100%; }
          .lad-think, .lad-tool, .lad-chips { margin-left: 0; }
          .lad-feed { padding: 16px; max-height: 70vh; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lad-spin { animation: none; }
          .lad-pulse { animation: none; }
          .lad-toggle-ind { transition: none; }
        }
      `}</style>
    </section>
  )
}
