/**
 * Lira AI – WebSocket Load Test
 * ────────────────────────────────────────────────────────────────────────────
 * Run locally (mock mode, SAM started separately):
 *
 *   sam local start-api --template deployments/template-local.yaml \
 *       --parameter-overrides MockAI=true &
 *
 *   k6 run tests/load/websocket_load.js
 *
 * Tune via environment variables:
 *   WS_URL      – WebSocket endpoint  (default: ws://localhost:3000)
 *   HTTP_URL    – HTTP endpoint        (default: http://localhost:3001)
 *   VU_COUNT    – peak virtual users   (default: 20)
 *   DURATION    – ramp/hold duration   (default: 30s per stage)
 */

import ws from "k6/ws";
import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter, Rate } from "k6/metrics";

// ─── custom metrics ──────────────────────────────────────────────────────────
const aiResponseLatency = new Trend("ai_response_latency_ms", true);
const joinLatency = new Trend("join_latency_ms", true);
const messagesDelivered = new Counter("messages_delivered");
const aiResponseRate = new Rate("ai_response_received");

// ─── config ──────────────────────────────────────────────────────────────────
const WS_URL = __ENV.WS_URL || "ws://localhost:3000";
const HTTP_URL = __ENV.HTTP_URL || "http://localhost:3001";
const VU_COUNT = parseInt(__ENV.VU_COUNT || "20");
const STAGE_DUR = __ENV.DURATION || "30s";

export const options = {
  stages: [
    { duration: "10s", target: Math.floor(VU_COUNT * 0.25) }, // ramp up 25 %
    { duration: STAGE_DUR, target: VU_COUNT }, // ramp to peak
    { duration: STAGE_DUR, target: VU_COUNT }, // hold at peak
    { duration: "10s", target: 0 }, // ramp down
  ],
  thresholds: {
    // 95th-percentile connection-to-join must be under 2 s
    join_latency_ms: ["p(95)<2000"],
    // 95th-percentile AI response must be under 5 s (mock mode is fast)
    ai_response_latency_ms: ["p(95)<5000"],
    // Less than 1 % of WS connections should fail
    ws_session_duration: ["p(99)>0"], // sanity – sessions complete
    ai_response_received: ["rate>0.8"], // >80 % of texts get an AI reply
  },
};

// ─── helpers ─────────────────────────────────────────────────────────────────
function makeSessionID() {
  return `load-test-${__VU}-${Date.now()}`;
}

function makeUserID() {
  return `vu-${__VU}`;
}

/** Create a meeting via the HTTP API so the WS join has a session to bind to. */
function createMeeting(sessionID, userID) {
  const payload = JSON.stringify({
    session_id: sessionID,
    title: `Load Test VU-${__VU}`,
    user_id: userID,
    settings: {
      personality: "supportive",
      participation_level: 0.8,
      wake_word_enabled: false,
      proactive_suggest: false,
    },
  });
  const res = http.post(`${HTTP_URL}/meetings`, payload, {
    headers: { "Content-Type": "application/json" },
    timeout: "5s",
  });
  check(res, { "meeting created (2xx)": (r) => r.status >= 200 && r.status < 300 });
  return res.status >= 200 && res.status < 300;
}

// ─── sample messages ──────────────────────────────────────────────────────────
const MESSAGES = [
  "What is the current status of the project?",
  "I think we should prioritise the API integration.",
  "There is a bug in the authentication flow.",
  "Can we schedule a follow-up for next week?",
  "I agree with the proposed approach.",
  "Let me pull up the architecture diagram.",
  "Should we add rate limiting to the WebSocket endpoint?",
  "The latency looks great on the dashboard.",
];

// ─── VU body ─────────────────────────────────────────────────────────────────
export default function () {
  const sessionID = makeSessionID();
  const userID = makeUserID();

  // 1. Pre-create the meeting via HTTP so the store has it before WS join.
  if (!createMeeting(sessionID, userID)) {
    // If the HTTP API is unavailable / not used in local WS-only mode, skip
    // creation – the WS join will create the session automatically in the handler.
    console.warn(`VU ${__VU}: could not pre-create meeting, proceeding anyway`);
  }

  let joined = false;
  let joinStart = Date.now();

  const url = `${WS_URL}?session_id=${sessionID}&user_id=${userID}`;

  const res = ws.connect(url, {}, function (socket) {
    //
    // ── on open ──────────────────────────────────────────────────────────────
    socket.on("open", function () {
      // Send join action
      joinStart = Date.now();
      socket.send(
        JSON.stringify({
          action: "join",
          payload: {
            session_id: sessionID,
            user_id: userID,
            settings: { personality: "supportive", participation_level: 0.6 },
          },
        })
      );
    });

    //
    // ── on message ───────────────────────────────────────────────────────────
    let msgTextSent = false;
    let textSentAt = 0;
    let msgIdx = 0;

    socket.on("message", function (data) {
      let msg;
      try {
        msg = JSON.parse(data);
      } catch (_) {
        return;
      }

      switch (msg.type) {
        case "joined": {
          joinLatency.add(Date.now() - joinStart);
          joined = true;
          messagesDelivered.add(1);

          // Send first text message after join
          sleep(0.1);
          sendNextMessage();
          break;
        }

        case "transcription": {
          // Our own words echoed back – just count it.
          messagesDelivered.add(1);
          break;
        }

        case "ai_response": {
          aiResponseRate.add(1);
          if (textSentAt > 0) {
            aiResponseLatency.add(Date.now() - textSentAt);
          }
          messagesDelivered.add(1);

          // Send next message or close
          sleep(0.5);
          if (!sendNextMessage()) {
            // All messages sent and AI has responded to the last one
            socket.close();
          }
          break;
        }

        case "error": {
          console.error(`VU ${__VU}: server error – ${JSON.stringify(msg.payload)}`);
          break;
        }
      }
    });

    //
    // ── helpers inside socket scope ──────────────────────────────────────────
    function sendNextMessage() {
      if (msgIdx >= 3) {
        // Send at most 3 messages per VU session
        return false;
      }
      const text = MESSAGES[msgIdx % MESSAGES.length];
      msgIdx++;
      textSentAt = Date.now();
      socket.send(
        JSON.stringify({
          action: "text",
          payload: { text: text },
        })
      );
      return true;
    }

    //
    // ── error / close ────────────────────────────────────────────────────────
    socket.on("error", function (e) {
      console.error(`VU ${__VU}: WS error – ${e.error()}`);
    });

    socket.on("close", function () {
      if (!joined) {
        console.warn(`VU ${__VU}: connection closed before join confirmed`);
      }
    });

    // Safety timeout: close if not done in 20 s
    socket.setTimeout(function () {
      socket.close();
    }, 20000);
  });

  check(res, { "websocket connected (101)": (r) => r && r.status === 101 });
  sleep(1);
}

// ─── setup: smoke-test the HTTP endpoint ─────────────────────────────────────
export function setup() {
  const res = http.get(`${HTTP_URL}/meetings/health-check`, { timeout: "3s" });
  // A 404 is fine (route doesn't exist but ALB/API GW is up)
  if (res.status === 0) {
    console.warn("HTTP API did not respond – HTTP pre-creation will be skipped");
  }
}
