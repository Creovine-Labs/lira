# Lira AI — Nimbus Dogfood Test Script

End-to-end test scenarios for the Nimbus demo (`demo.liraintelligence.com`)
covering both the **chat widget** (full tool execution) and the **voice call**
(Nova Sonic, conversational only — see caveat below).

Use this before any customer demo. Tick each row as you go. If something fails,
note the symptom so we can reproduce.

---

## ✅ Capability boundaries (current)

| Modality | Account-aware Q&A | KB / company Q&A | Tool execution (upgrade, cancel, etc.) | HITL confirmation |
|---|---|---|---|---|
| **Chat (text)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Confirm cards |
| **Voice (Nova Sonic)** | ✅ Yes (profile facts + tool data) | ✅ Yes (`kb_search` tool) | ✅ Yes | ✅ Verbal confirmation |

Both modalities can now do the full set: account-aware Q&A, KB search,
tool execution, and HITL confirmation. The HITL UX differs by modality:
chat uses a clickable confirm card, voice uses a verbal "is that right?"
prompt that the model emits before write tools fire.

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
| 0.3 | Open `http://localhost:5173/demo` | Demo entry modal appears | ☐ |
| 0.4 | Choose "Widget on a real site" mode, name = `Test User` | Modal closes, redirected to Nimbus dashboard | ☐ |
| 0.5 | DevTools console open | No red errors at load | ☐ |
| 0.6 | Network tab: filter `ws` | WebSocket connects to `wss://api.creovine.com/lira/v1/support/chat/ws/org-bfad94de-...` | ☐ |
| 0.7 | First frame after connect: `demo_context` outbound | Profile JSON includes name, plan, card, invoices snapshot | ☐ |

---

## 1. Onboarding / profile creation

| # | Action | Expected | ✅ |
|---|---|---|---|
| 1.1 | Sign out (sidebar → sign out) | Redirected to `/`, no Nimbus widget on landing | ☐ |
| 1.2 | Go to `/demo` again, name = `Another Tester` | Fresh dashboard, plan defaults to Growth | ☐ |
| 1.3 | Open a new tab → `/demo` (same browser) | Entry modal re-appears (sessionStorage scoped per-tab? — actually per browser; this should keep `Another Tester`) | ☐ |
| 1.4 | Close all tabs, reopen `/demo` | Entry modal appears again (sessionStorage cleared) | ☐ |

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

These trigger HITL=confirm tools. Each should show a **confirm card** in the
widget BEFORE applying the change.

### 4.1 Upgrade plan

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.1.1 | Type: `Can you upgrade me to the Business plan?` | AI asks for confirmation OR emits a confirm card with title "Upgrade plan" | ☐ |
| 4.1.2 | Click **Approve** on the card | Card resolves to success badge | ☐ |
| 4.1.3 | Sidebar plan badge updates to **Business** | ☐ |
| 4.1.4 | Dashboard greeting updates ("Currently on Business plan") | ☐ |
| 4.1.5 | AI's next reply confirms the change in natural language | ☐ |

### 4.2 Decline a confirm card

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.2.1 | Type: `Actually, downgrade me to Starter` | Confirm card appears | ☐ |
| 4.2.2 | Click **Cancel** / decline | Card resolves to declined; plan does NOT change | ☐ |
| 4.2.3 | AI acknowledges the decline politely | ☐ |

### 4.3 Update card

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.3.1 | `Change my card to a Mastercard ending in 1234, expires 12/30` | Confirm card with brand/last4/exp | ☐ |
| 4.3.2 | Approve | Settings → Billing shows new card | ☐ |
| 4.3.3 | Sidebar / dashboard reflects updated card | ☐ |

### 4.4 Cancel subscription

| # | Action | Expected | ✅ |
|---|---|---|---|
| 4.4.1 | `I want to cancel my subscription, the product isn't working for us` | Confirm card with reason recorded | ☐ |
| 4.4.2 | Approve | Subscription status badge → Cancelled | ☐ |
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
| 4.6.1 | After 4.4, type `Actually, never mind, put me back on Growth` | Confirm card → approve → status returns to active, plan Growth | ☐ |

---

## 5. Tool execution — edge cases

| # | Action | Expected | ✅ |
|---|---|---|---|
| 5.1 | `Upgrade me to the Enterprise plan` (doesn't exist) | AI asks clarifying question or says only starter/growth/business available | ☐ |
| 5.2 | Already on Business: `upgrade me to Business` | AI says you're already on it; no tool fires | ☐ |
| 5.3 | `Update my card to brand: blah, last4: 99, exp: foo` | Tool validation rejects; AI asks for proper values | ☐ |
| 5.4 | `Update my plan and also change my card` (two actions in one message) | Either: handles sequentially with two confirms, OR: asks which first. Should NOT silently drop one. | ☐ |

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
| 7.2 | Open widget, scroll up | Prior conversation history loads | ☐ |
| 7.3 | Sign out → sign back in as `New Tester` | Fresh profile, no leaked history from prior tester | ☐ |
| 7.4 | Open `/demo` in incognito | Independent session, doesn't see your changes | ☐ |
| 7.5 | Open `/demo` in two side-by-side tabs simultaneously | Each gets its own conv_id; messages don't cross | ☐ |

---

## 8. KB fallback (simulate Qdrant down)

| # | Action | Expected | ✅ |
|---|---|---|---|
| 8.1 | Stop Qdrant locally (or set bad `QDRANT_URL`) and restart backend | Backend warns "Qdrant not available" in logs | ☐ |
| 8.2 | Ask a KB question: `What's your refund policy?` | AI still returns an answer grounded in DDB keyword fallback | ☐ |
| 8.3 | Logs show metric `lira.kb.keyword_fallback_used` | ☐ |
| 8.4 | Restart Qdrant | Health check recovers, vector path resumes | ☐ |

---

## 9. Voice (Nova Sonic) — full parity with chat

Voice now has the same tool set as chat. HITL is verbal: the model says
"just to confirm — you want X, is that right?" and only fires the tool
after you say yes. Watch the dashboard for real-time updates from voice
tool calls (same pipeline as chat → `demo_action_executed` → dashboard
re-render).

### 9.1 Conversational + account-aware

| # | Say aloud | Expected | ✅ |
|---|---|---|---|
| 9.1.1 | Open widget, click mic icon | Voice call connects, mic permission prompt | ☐ |
| 9.1.2 | `Hello, what can you help me with?` | Lira greets warmly, doesn't list capabilities like a robot | ☐ |
| 9.1.3 | `What plan am I on?` | Speaks the correct plan from CUSTOMER ACCOUNT snapshot | ☐ |
| 9.1.4 | `Tell me about my last invoice` | Speaks correct amount/date | ☐ |
| 9.1.5 | `What card do I have on file?` | "Visa ending 4242" etc. | ☐ |

### 9.2 KB Q&A via voice

| # | Say aloud | Expected | ✅ |
|---|---|---|---|
| 9.2.1 | `What's your refund policy?` | Lira calls `kb_search`, speaks the grounded answer | ☐ |
| 9.2.2 | `Do you support multi-currency invoicing?` | KB-grounded response | ☐ |
| 9.2.3 | `Do you support quantum-encrypted invoices?` | Says she doesn't have that info — must NOT hallucinate | ☐ |

### 9.3 Tool execution via voice (verbal HITL)

| # | Say aloud | Expected | ✅ |
|---|---|---|---|
| 9.3.1 | `Upgrade me to the Business plan` | Lira VERBALLY confirms: "Just to confirm — you want the Business plan for $129/mo, is that right?" | ☐ |
| 9.3.2 | Say `Yes` | Tool fires; sidebar plan badge updates to Business in real time | ☐ |
| 9.3.3 | Say `Change my card to a Visa ending 1111, expires 11/30` | Verbal confirm → say yes → card updated on dashboard | ☐ |
| 9.3.4 | Say `Cancel my subscription` | Verbal confirm → say yes → status badge → Cancelled | ☐ |
| 9.3.5 | Say `Actually, put me back on Growth` | Verbal confirm → say yes → plan reverts | ☐ |
| 9.3.6 | Say `Reset my password` | Auto-fires (no confirmation needed) | ☐ |

### 9.4 Verbal HITL decline

| # | Say aloud | Expected | ✅ |
|---|---|---|---|
| 9.4.1 | Say `Upgrade me to Starter` | Verbal confirm | ☐ |
| 9.4.2 | Say `No, never mind` | Lira acknowledges; plan does NOT change | ☐ |

### 9.5 UX

| # | Action | Expected | ✅ |
|---|---|---|---|
| 9.5.1 | Interrupt Lira mid-sentence by speaking | Barge-in works, she stops and listens | ☐ |
| 9.5.2 | Stay silent for 30s | Connection stays open or graceful timeout | ☐ |
| 9.5.3 | End call via button | UI returns to chat mode cleanly | ☐ |
| 9.5.4 | Check dashboard after call ends | All changes from voice tool calls persisted | ☐ |

**Voice findings to capture:**
- ☐ Voice quality clear, no choppiness
- ☐ Profile facts accurate
- ☐ Verbal HITL works (model actually asks, doesn't just fire)
- ☐ No hallucinations about the company
- ☐ Dashboard re-renders live during voice tool calls

---

## 10. Privacy / data-isolation spot checks

| # | Action | Expected | ✅ |
|---|---|---|---|
| 10.1 | Tester A creates profile `Alice`, asks `what's my plan` | Profile reflects Alice's data | ☐ |
| 10.2 | Sign out; tester B `Bob` creates profile, asks same | Sees Bob's data; no leak from Alice | ☐ |
| 10.3 | Inspect DynamoDB `lira-organizations` table | NO rows added per visitor (demo profile is client-side only) | ☐ |
| 10.4 | Disconnect WebSocket (kill backend) | Server-side in-memory demo-context cache evicts on `ws.close` | ☐ |

---

## 11. Pre-demo confidence checklist

Before showing this to a real prospect, all the following must be ✅:

- [ ] Section 2 (account-aware): all green
- [ ] Section 3 (KB): all green, no hallucinations on §3.5
- [ ] Section 4 (tool execution): every tool fires + dashboard updates
- [ ] Section 5 (edge cases): all green
- [ ] Section 6 (escalation): handoff + handback round trips
- [ ] Section 9 (voice): conversational + KB + tool execution + verbal HITL all working
- [ ] No red errors in browser DevTools console during a 10-message session
- [ ] Backend logs show no unhandled exceptions
- [ ] Refresh mid-conversation doesn't break anything

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
