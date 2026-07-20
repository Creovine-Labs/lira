# AI Actions — support that resolves, not just replies

Most support bots can only _answer_. Lira can also **do the thing** — freeze a
lost card, dispute a charge, switch a plan, check a failed transfer — right
inside the chat, with the customer's approval. That's the difference between
deflecting a ticket and resolving the issue.

Every action is safe by design: the AI proposes, the customer approves (or
re-authenticates for sensitive actions), Lira executes, and everything is
audited. Nothing sensitive happens without a person saying yes.

## The two layers

Lira separates **answers** from **actions**, and gates actions by plan:

| Layer                           | What it does                                                                                                   | Plans                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **Answers**                     | The AI answers from your knowledge base — fees, limits, how-tos.                                               | All plans                    |
| **Read actions**                | The AI checks live status for the customer ("what plan am I on", "is my KYC verified", "where's my transfer"). | **Pro** and up               |
| **Full actions (read + write)** | The AI _does_ things with approval — freeze card, dispute, switch plan, change limits — beyond just checking.  | **Scale** and **Enterprise** |

Built-in support (answering, raising a ticket, escalating to a human) is included
on every plan. Only the **actions on your own product** are gated.

## How an action is kept safe (four levels)

The AI never just "does" a sensitive thing. Each action has a risk level that
decides what must happen first:

| Level         | Before it runs                                        | Examples                                          |
| ------------- | ----------------------------------------------------- | ------------------------------------------------- |
| **Safe read** | Nothing — runs immediately                            | check status, quote a fee                         |
| **Confirm**   | Customer taps **Approve** in chat                     | freeze a card, switch a plan                      |
| **Step-up**   | Customer **re-authenticates** (PIN / biometric / OTP) | dispute a charge, change a limit, unfreeze a card |
| **Human**     | Handed to a human agent — the AI never resolves it    | fraud with money moving, account closure, legal   |

For **step-up** actions, Lira asks your app to re-authenticate the customer; your
backend issues a short-lived proof, and Lira verifies it before executing. The
signing secret never lives in the mobile app.

## What you can wire up

Actions reach the AI in one of two ways — you choose:

1. **Action pack** — Lira calls your API. You give us a base URL + key and
   implement a simple REST convention (e.g. `POST /cards/:id/freeze`,
   `POST /disputes`). Lira handles the conversation, the approval gate, the
   step-up, and the audit trail. A ready-made **fintech pack** covers freeze /
   unfreeze / report-lost / dispute / change-limit / switch-plan / transaction
   status / KYC status out of the box.
2. **In-app SDK** — your app registers actions with our SDK
   (`registerAction(...)`); they run inside your app, still behind Lira's
   approval gate. No server code needed.

Either way, the customer's identity is verified first (a signed session token
your backend mints), so the AI only acts for the right person.

## Why it matters

The core failure of fintech support is _deflection and delay_ — "submit a ticket
and wait." Lira turns the highest-volume, highest-anxiety moments (a lost card, a
charge you didn't make, a transfer that seems stuck) into **"done, here's your
confirmation"** — 24/7, in one message, safely. That's support your customers
feel, and a cost centre that becomes a resolution engine.

> Everything an action does is recorded — who, what, when, and the result — so
> your team and your auditors have a complete trail.
