# Lira AI — Nimbus Dogfood Test Script

End-to-end test scenarios for the Nimbus demo (`demo.liraintelligence.com`)
covering the **chat widget** with full tool execution.

> **Voice (Nova Sonic) is intentionally deferred** as of 2026-05-23 — see
> [`VOICE_CHOPPINESS_INVESTIGATION.md`](./VOICE_CHOPPINESS_INVESTIGATION.md)
> for the open issue and proposed re-architecture. This script is **chat-only**
> until voice quality is solved on the production hardware.

Use this before any customer demo. Tick each row as you go. If something fails,
note the symptom so we can reproduce.

---

## ✅ Capability boundaries (current)

| Modality | Account-aware Q&A | KB / company Q&A | Tool execution (upgrade, cancel, etc.) | HITL confirmation | Status |
|---|---|---|---|---|---|
| **Chat (text)** | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ PIN gate: widget UI ready, backend dispatch in progress | Active |
| **Voice (Nova Sonic)** | — | — | — | — | **Deferred** — see investigation doc |

The chat path now runs through the Pipecat agent (`?pipecat=1` or
`window.__LIRA_USE_PIPECAT = true`). Cross-channel context is wired: if a
customer chatted earlier in the same `conversationId`, the next session
loads the prior messages so they don't have to repeat themselves.

---

## ⚠️ Before you start: Phase 0 limits

The demo org has quotas, rate limits, and a spend kill-switch enforced by
`lira-demo-quota.service.ts`. During heavy dogfood you may hit them.

**Set `LIRA_DEMO_LIMITS_BYPASS=true` in the backend env before starting:**

```bash
export LIRA_DEMO_LIMITS_BYPASS=true
cd creovine-backend && npm run dev
```

This short-circuits every quota/rate/spend assert. Moderation, profile
counters, and Slack alerts still fire. Unset (or just remove the line)
before deploying — never set this in production.

---

## 0. Setup

| # | Step | Expected | ✅ |
|---|---|---|---|
| 0.1 | Run `cd creovine-backend && npm run dev` | Backend up on port 8080 | ☐ |
| 0.2 | Run `cd lira-ai && npm run dev` | Frontend up on 5173 | ☐ |
| 0.3 | Open `http://localhost:5173/demo?pipecat=1` | Demo entry modal appears; Pipecat flag is on | ☐ |
| 0.4 | Choose "Widget on a real site" mode, name = `Test User` | Modal closes, redirected to Nimbus dashboard | ☐ |
| 0.5 | DevTools console open | No red errors at load | ☐ |
| 0.6 | Network tab: filter `WS` / `Sockets` | WebSocket connects to `wss://api.creovine.com/pipecat?orgId=org-bfad94de-...&channel=chat` | ☐ |
| 0.7 | Chat session: server should respond with bot-ready within ~1s of clicking the widget bubble | ☐ |

> **Note**: `?pipecat=1` is required during dev to opt into the Pipecat
> chat path. Without it the widget falls back to the legacy chat WS.

---

## 1. Onboarding / profile creation

| # | Action | Expected | ✅ |
|---|---|---|---|
| 1.1 | Sign out (sidebar → sign out) | Redirected to `/`, no Nimbus widget on landing | ☐ |
| 1.2 | Go to `/demo?pipecat=1` again, name = `Another Tester` | Fresh dashboard, plan defaults to Growth | ☐ |
| 1.3 | Open a new tab → `/demo?pipecat=1` (same browser) | Entry modal re-appears (sessionStorage scoped per-tab? — actually per browser; this should keep `Another Tester`) | ☐ |
| 1.4 | Close all tabs, reopen `/demo?pipecat=1` | Entry modal appears again (sessionStorage cleared) | ☐ |

---

## 2. Account-aware Q&A — chat widget (NO tool calls expected)

Open the chat widget. Type each prompt verbatim. The AI should answer from
the profile facts in its system prompt (no `kb_search` or action tool call).

| # | Type | Expected | ✅ |
|---|---|---|---|
| 2.1 | `What plan am I on?` | Names current plan correctly (e.g. "Growth — $49/mo") | ☐ |
| 2.2 | `When's my next invoice due?` | States next invoice date from profile | ☐ |
| 2.3 | `How much was my last invoice?` | States `$X` matching dashboard | ☐ |
| 2.4 | `What card do I have on file?` | "Visa ending 4242" (or whatever the dashboard shows) | ☐ |
| 2.5 | `How many users are on my account?` | States `team_seats` value | ☐ |
| 2.6 | `When did I sign up?` | Roughly correct date | ☐ |
| 2.7 | `What's my MRR?` / `revenue this month?` | If sent in demo_context, AI cites it | ☐ |
| 2.8 | `Show me my top customers` | Lists 3-5 from dashboard | ☐ |
| 2.9 | `What integrations do I have connected?` | Lists Connected ones from dashboard | ☐ |

---

## 3. KB / company Q&A — chat widget

These should trigger the `kb_search` tool. Look for the action result chip
("Searched knowledge base" or similar) in the widget UI.

| # | Type | Expected | ✅ |
|---|---|---|---|
| 3.1 | `What's your refund policy?` | Cites refund terms from KB; if KB empty, AI says "I'll check with the team" rather than hallucinating | ☐ |
| 3.2 | `Do you support multi-currency invoicing?` | KB-grounded answer | ☐ |
| 3.3 | `What's the difference between Starter and Business?` | Compares using profile + KB | ☐ |
| 3.4 | `Tell me about your security practices` | KB answer or graceful fallback | ☐ |
| 3.5 | Make up something obscure: `Do you support quantum-encrypted invoices?` | AI says it doesn't have that info / escalates — **must NOT hallucinate** | ☐ |

---

## 4. Tool execution — happy path (chat only)

These trigger HITL=confirm tools. Each should:
1. Show an **action card** in chat as the tool starts (`action_started`)
2. For `hitl: 'confirm'` tools — show a **PIN gate modal** before executing
3. Resolve to ✅ success or ❌ failure (`action_completed` / `action_failed`)
4. Update the relevant Nimbus dashboard UI

> **HITL / confirmation status (2026-05-23):**
> Two paths handle confirmation for `hitl: 'confirm'` tools differently:
>
> - **Legacy chat (`?pipecat=0`, default):** clickable **confirm card**. Backend
>   pauses the agent loop, persists pending state via `pendingTool`, sends the
>   card; resumes on Approve/Decline.
> - **Pipecat chat (`?pipecat=1`, what we're shipping):** **conversational
>   confirmation**. The system prompt instructs the model to repeat back the
>   action ("So I'm cancelling your subscription, that right?") and wait for
>   a clear "yes" before calling the tool.
>
> Both satisfy "no destructive action without customer approval." The widget
> still has a `pinPrompt` modal in code — that's dead UI from voice-PIN
> planning. It's not used by either chat path. Leaving it for the future
> ("enter 4-digit PIN from your email" for high-risk actions).

### 4.1 Upgrade plan

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.1.1 | Type: `Can you upgrade me to the Business plan?` | Pipecat: AI verbally asks to confirm ("So I'm upgrading you to Business — that right?"). Legacy: AI emits a confirm card. | ☐ |
| 4.1.2 | Pipecat: reply `Yes`. Legacy: click Approve. | Action proceeds; `action_started` card appears in chat | ☐ |
| 4.1.3 | Card resolves to ✅ success | ☐ |
| 4.1.4 | Sidebar plan badge updates to **Business** | ☐ |
| 4.1.5 | Dashboard greeting updates ("Currently on Business plan") | ☐ |
| 4.1.6 | AI's next reply confirms the change in natural language | ☐ |

### 4.2 Decline a confirm

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.2.1 | Type: `Actually, downgrade me to Starter` | AI asks to confirm (Pipecat) or shows confirm card (legacy) | ☐ |
| 4.2.2 | Pipecat: reply `No, never mind`. Legacy: click Decline. | Action declined, plan does NOT change | ☐ |
| 4.2.3 | AI acknowledges the decline politely | ☐ |

### 4.3 Update card

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.3.1 | `Change my card to a Mastercard ending in 1234, expires 12/30` | Action card with brand/last4/exp | ☐ |
| 4.3.2 | Resolve | Settings → Billing shows new card | ☐ |
| 4.3.3 | Sidebar / dashboard reflects updated card | ☐ |

### 4.4 Cancel subscription

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.4.1 | `I want to cancel my subscription, the product isn't working for us` | Action card with reason recorded | ☐ |
| 4.4.2 | Resolve | Subscription status badge → Cancelled | ☐ |
| 4.4.3 | AI mentions access continues until period end | ☐ |
| 4.4.4 | Try to cancel again | AI says it's already cancelled (idempotent) | ☐ |

### 4.5 Password reset (auto, no confirm)

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.5.1 | `I forgot my password, can you reset it?` | Tool fires immediately (hitl=auto), success card shown | ☐ |
| 4.5.2 | Card body mentions email sent / 30 min expiry | ☐ |

### 4.6 Re-upgrade after cancel

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.6.1 | After 4.4, type `Actually, never mind, put me back on Growth` | Action card → resolve → status returns to active, plan Growth | ☐ |

---

## 5. Tool execution — edge cases

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5.1 | `Upgrade me to the Enterprise plan` (doesn't exist) | AI asks clarifying question or says only starter/growth/business available | ☐ |
| 5.2 | Already on Business: `upgrade me to Business` | AI says you're already on it; no tool fires | ☐ |
| 5.3 | `Update my card to brand: blah, last4: 99, exp: foo` | Tool validation rejects; AI asks for proper values | ☐ |
| 5.4 | `Update my plan and also change my card` (two actions in one message) | Either: handles sequentially with two cards, OR: asks which first. Should NOT silently drop one. | ☐ |

---

## 5b. Voice → post-call action flow (new architecture)

The voice path doesn't execute actions on the call — Lira captures intent
verbally, then the post-call processor (`lira-postcall.service.ts`) runs
the same `runAgent` loop with the voice transcript as history. Action
cards stream into the chat panel after hang-up.

**Important:** the chat widget must stay OPEN during and after the call.
If the customer closes the widget after hanging up, the post-call
processor logs a warning and skips (Phase 2: queue-for-next-open).

### 5b.1 Single-action call

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5b.1.1 | Open chat widget, then click the call icon | Voice call connects | ☐ |
| 5b.1.2 | Say: `Cancel my subscription, please` | Lira verbally acknowledges and says she'll "line that up for after we hang up" | ☐ |
| 5b.1.3 | Say: `That's all, thanks` | Lira summarises ("So: cancel your subscription. That right?") | ☐ |
| 5b.1.4 | Say: `Yes` | Lira says "I'll process that — you'll see updates in the chat below in a few seconds" then hangs up | ☐ |
| 5b.1.5 | Chat panel: a system message appears "Processing your request from the call…" | ☐ |
| 5b.1.6 | Within ~5s, an action card appears showing `stripe_cancel_subscription` running, then ✅ Cancelled | ☐ |
| 5b.1.7 | Nimbus dashboard reflects the cancellation | ☐ |
| 5b.1.8 | Server log (`journalctl -u creovine-api`): `[postcall] starting … voice_turns=N` and `[postcall] done … tools=1 ms=…` | ☐ |

### 5b.2 Multi-action call

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5b.2.1 | Call again, say `I want to upgrade to Business and reset my password` | Lira captures both intents verbally | ☐ |
| 5b.2.2 | At end of call, Lira summarises both ("So: upgrade to Business, and reset your password. That right?") | ☐ |
| 5b.2.3 | After hang-up, chat shows TWO action cards in sequence (each `action_started` → `action_completed`) | ☐ |
| 5b.2.4 | Dashboard reflects both changes | ☐ |

### 5b.3 Call with read-only Q&A (no actions)

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5b.3.1 | Call, ask only KB questions (`what's your refund policy?`) | Lira answers in voice | ☐ |
| 5b.3.2 | Hang up | Chat shows a brief "All set from our call!" or equivalent — no action cards | ☐ |

### 5b.4 Edge: widget closed after hangup

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5b.4.1 | Make a call requesting an action; immediately close the entire widget | Server log: `[postcall] no open chat WS for conv … — skipping` | ☐ |
| 5b.4.2 | Reopen the widget | No post-call cards (we don't queue today). Customer would need to repeat the request in chat. | ☐ |

---

## 6. Escalation

| # | Action | Expected | ✅ |
|---|---|---|---|
| 6.1 | `I want to talk to a human agent please` | AI escalates immediately; widget shows "transferred to support" system message | ☐ |
| 6.2 | After escalation, type another message | Goes to the human inbox, NOT answered by AI | ☐ |
| 6.3 | (In another tab as admin) Reply from inbox | Reply appears in widget with agent name + avatar | ☐ |
| 6.4 | (As admin) Handback to AI | AI resumes; system msg "Lira is back" | ☐ |
| 6.5 | After handback, type: `What's my plan?` | AI answers from updated profile (post-4.1 upgrade) | ☐ |

---

## 7. Resilience / state persistence

| # | Action | Expected | ✅ |
|---|---|---|---|
| 7.1 | After 4.1 upgrade, refresh the page | Plan still Business (sessionStorage holds) | ☐ |
| 7.2 | Open widget, scroll up | Prior conversation history loads (Pipecat now seeds LLM context with up to 40 prior messages from the same `conversationId`) | ☐ |
| 7.3 | Sign out → sign back in as `New Tester` | Fresh profile, no leaked history from prior tester | ☐ |
| 7.4 | Open `/demo?pipecat=1` in incognito | Independent session, doesn't see your changes | ☐ |
| 7.5 | Open `/demo?pipecat=1` in two side-by-side tabs simultaneously | Each gets its own conv_id; messages don't cross | ☐ |

---

## 8. KB fallback (simulate Qdrant down)

| # | Action | Expected | ✅ |
|---|---|---|---|
| 8.1 | Stop Qdrant locally (or set bad `QDRANT_URL`) and restart backend | Backend warns "Qdrant not available" in logs | ☐ |
| 8.2 | Ask a KB question: `What's your refund policy?` | AI still returns an answer grounded in DDB keyword fallback | ☐ |
| 8.3 | Logs show metric `lira.kb.keyword_fallback_used` | ☐ |
| 8.4 | Restart Qdrant | Health check recovers, vector path resumes | ☐ |

---

## 9. Privacy / data-isolation spot checks

| # | Action | Expected | ✅ |
|---|---|---|---|
| 9.1 | Tester A creates profile `Alice`, asks `what's my plan` | Profile reflects Alice's data | ☐ |
| 9.2 | Sign out; tester B `Bob` creates profile, asks same | Sees Bob's data; no leak from Alice | ☐ |
| 9.3 | Inspect DynamoDB `lira-organizations` table | NO rows added per visitor (demo profile is client-side only) | ☐ |
| 9.4 | Disconnect WebSocket (kill backend) | Server-side in-memory demo-context cache evicts on `ws.close` | ☐ |

---

## 10. Pre-demo confidence checklist

Before showing this to a real prospect, all the following must be ✅:

- [ ] Section 2 (account-aware): all green
- [ ] Section 3 (KB): all green, no hallucinations on §3.5
- [ ] Section 4 (tool execution): every tool fires + dashboard updates (PIN gate WIP — note this to prospect or skip for now)
- [ ] Section 5 (edge cases): all green
- [ ] Section 6 (escalation): handoff + handback round trips
- [ ] No red errors in browser DevTools console during a 10-message session
- [ ] Backend logs show no unhandled exceptions
- [ ] Refresh mid-conversation doesn't break anything

---

## 11. Known limitations to disclose to a prospect (2026-05-23)

Be transparent. Don't sell what isn't built.

- **Voice**: deferred. Working on smoothness — not in current demo.
- **HITL confirmation**: works on both paths today — Pipecat asks conversationally, legacy chat uses a clickable confirm card. The widget also has a leftover **PIN entry modal** (numeric code) that's not yet wired to anything; that would be a future "high-risk action" tier (e.g. confirm with a code sent to email).
- **Cross-channel voice→chat**: voice transcripts don't yet persist to the same conversation table on hang-up, so if voice ever comes back, chat session won't see prior voice context. Reverse direction (chat→voice) works.
- **Real tool packs**: only Stripe is wired in this repo. Other integrations (Intercom, HubSpot, Slack actions) are future work.

---

## 12. Failure log

When something fails, note:
- Section #
- Exact input
- Expected vs actual
- Browser console error (if any)
- Backend log excerpt (if any)

| Date | Section | Input | Expected | Actual | Status |
|---|---|---|---|---|---|
|  |  |  |  |  |  |
