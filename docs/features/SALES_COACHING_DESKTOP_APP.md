# Lira Sales Coaching — Invisible Desktop App

> **Goal:** A cross-platform desktop application (macOS + Windows) that captures live meeting audio from any platform (Zoom, Google Meet, Teams, phone calls via browser — desktop or web), streams it to the Lira backend, and displays real-time AI coaching suggestions in a floating overlay that is **completely invisible** to the prospect and to screen sharing.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Phase 1 — Foundation & Audio Capture](#phase-1--foundation--audio-capture)
3. [Phase 2 — Backend Sales Coaching Service](#phase-2--backend-sales-coaching-service)
4. [Phase 3 — Floating Overlay & Coaching UI](#phase-3--floating-overlay--coaching-ui)
5. [Phase 4 — Advanced Features & Intelligence](#phase-4--advanced-features--intelligence)
6. [Phase 5 — Distribution, Signing & Auto-Updates](#phase-5--distribution-signing--auto-updates)
7. [Phase 6 — Polish, Analytics & Production Hardening](#phase-6--polish-analytics--production-hardening)
8. [Technical Reference](#technical-reference)

---

## 1. Architecture Overview

### High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Salesperson's Desktop                                                      │
│                                                                             │
│  ┌──────────────────┐                                                       │
│  │  Zoom / Meet /   │──── System Audio Out ──────┐                          │
│  │  Teams / Any App │                            │                          │
│  └──────────────────┘                            ▼                          │
│                                         ┌──────────────────┐                │
│  ┌──────────────┐                       │  Lira Desktop    │                │
│  │  Microphone  │── Mic Audio ─────────▶│  App (Electron)  │                │
│  └──────────────┘                       │                  │                │
│                                         │  ┌────────────┐  │                │
│                                         │  │ Audio      │  │                │
│                                         │  │ Engine     │  │   WebSocket    │
│                                         │  │            │──│───────────────▶│
│                                         │  │ • Capture  │  │  16kHz PCM     │
│                                         │  │ • Resample │  │  (binary)      │
│                                         │  │ • Mix/Tag  │  │                │
│                                         │  └────────────┘  │                │
│                                         │                  │                │
│  ┌──────────────────────────────┐       │  ┌────────────┐  │                │
│  │  Floating Coaching Overlay   │◀──────│──│ WS Client  │◀─│──── Text ──── │
│  │  (invisible to screen share) │       │  └────────────┘  │  suggestions   │
│  │                              │       │                  │                │
│  │  📝 Live Transcript          │       └──────────────────┘                │
│  │  💡 "Try saying: ..."        │                                           │
│  │  ⚠️  Objection detected      │                                           │
│  │  📊 Engagement score: 78%    │                                           │
│  └──────────────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ wss://api.creovine.com/lira/v1/ws
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Lira Backend (Existing)                                                    │
│                                                                             │
│  ┌────────────────┐   ┌───────────────────┐   ┌─────────────────────┐      │
│  │ WebSocket      │──▶│ Nova Sonic        │──▶│ Sales Coaching      │      │
│  │ Handler        │   │ (STT + AI Gen)    │   │ Prompt Engine       │      │
│  │ (lira-ws)      │   │                   │   │                     │      │
│  │                │◀──│ Text responses     │   │ • Objection counter │      │
│  │                │   │ (no TTS — text     │   │ • Close suggestions │      │
│  │                │   │  only for sales)   │   │ • Question prompts  │      │
│  └────────────────┘   └───────────────────┘   │ • Engagement alerts │      │
│                                               │ • Org context       │      │
│  ┌────────────────┐   ┌───────────────────┐   └─────────────────────┘      │
│  │ Deepgram       │   │ DynamoDB          │                                 │
│  │ Diarization    │   │ Session Storage   │                                 │
│  │ (who's talking)│   │ + Transcript      │                                 │
│  └────────────────┘   └───────────────────┘                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Framework Decision: Electron

| Criterion            | Electron                                               | Tauri                                       |
| -------------------- | ------------------------------------------------------ | ------------------------------------------- |
| Cross-platform       | macOS + Windows + Linux                                | macOS + Windows + Linux                     |
| Native audio capture | Via native Node addons (napi-rs / node-addon-api)      | Via Rust native code                        |
| Ecosystem maturity   | 10+ years, huge ecosystem                              | Younger, smaller ecosystem                  |
| App size             | ~120 MB (includes Chromium)                            | ~5-10 MB                                    |
| Native API access    | Excellent via N-API                                    | Native via Rust                             |
| UI framework         | Any web framework (React)                              | Any web framework                           |
| **Verdict**          | **Use this** — proven, fast to build, team knows JS/TS | Lighter but more risk for native audio work |

**Why Electron:** The entire Lira stack is TypeScript. Electron lets us reuse React components, keep the same WebSocket client code, and access native audio APIs via Node.js native modules. The 120 MB app size is acceptable for a desktop tool (Slack, VS Code, Figma are all Electron).

### Project Structure

```
lira-desktop/
├── package.json
├── electron-builder.yml          # Build & distribution config
├── tsconfig.json
├── src/
│   ├── main/                     # Electron main process
│   │   ├── main.ts               # App entry, window management
│   │   ├── tray.ts               # System tray icon & menu
│   │   ├── overlay-window.ts     # Floating coaching overlay
│   │   ├── ipc-handlers.ts       # IPC bridge between main ↔ renderer
│   │   ├── audio/
│   │   │   ├── audio-engine.ts   # Orchestrates capture + streaming
│   │   │   ├── macos-capture.ts  # ScreenCaptureKit bindings
│   │   │   ├── windows-capture.ts# WASAPI loopback bindings
│   │   │   ├── mic-capture.ts    # Microphone capture (cross-platform)
│   │   │   └── resampler.ts      # Resample to 16kHz PCM mono
│   │   ├── ws/
│   │   │   └── ws-client.ts      # WebSocket to Lira backend
│   │   └── store/
│   │       └── session-store.ts  # Persistent settings (electron-store)
│   ├── renderer/                 # React UI (coaching overlay)
│   │   ├── index.html
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── CoachingPanel.tsx
│   │   │   ├── TranscriptFeed.tsx
│   │   │   ├── SuggestionCard.tsx
│   │   │   ├── EngagementMeter.tsx
│   │   │   ├── SessionControls.tsx
│   │   │   └── LoginView.tsx
│   │   ├── hooks/
│   │   │   └── use-coaching-session.ts
│   │   └── styles/
│   │       └── overlay.css
│   └── native/                   # Native addons (Rust via napi-rs)
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs            # Entry point, conditional compilation
│       │   ├── macos/
│       │   │   ├── mod.rs
│       │   │   └── screen_capture_kit.rs  # ScreenCaptureKit FFI
│       │   └── windows/
│       │       ├── mod.rs
│       │       └── wasapi.rs     # WASAPI loopback FFI
│       └── build.rs
├── resources/
│   ├── icon.icns                 # macOS app icon
│   ├── icon.ico                  # Windows app icon
│   └── tray-icon.png             # System tray icon
└── scripts/
    ├── notarize.js               # macOS notarization script
    └── sign-windows.js           # Windows code signing
```

---

## Phase 1 — Foundation & Audio Capture

> **Goal:** Electron app shell that can capture system audio (any app) + microphone, resample to 16kHz PCM, and stream it over WebSocket to the Lira backend.

### 1.1 Electron App Shell

Set up the Electron app with:

- `electron-forge` or `electron-builder` for build tooling
- React + Vite for the renderer process (same stack as the Lira web app)
- `electron-store` for persistent settings (auth tokens, preferences)
- IPC bridge between main process and renderer

```ts
// main.ts — simplified entry point
import { app, BrowserWindow } from 'electron'

app.whenReady().then(() => {
  // Main window (settings, login, session history)
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    titleBarStyle: 'hiddenInset', // Clean macOS look
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Security: isolate renderer
      nodeIntegration: false, // Security: no Node in renderer
    },
  })

  // System tray for quick access
  createTray(mainWindow)
})
```

### 1.2 macOS Audio Capture — ScreenCaptureKit

**API:** `SCStream` from Apple's ScreenCaptureKit framework (macOS 13+)

**Permission:** Screen Recording — handled via a **three-state permission model:**

| State                 | Detection                                                                       | UX                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Not yet requested** | `CGPreflightScreenCaptureAccess()` returns `false` and no prior denial recorded | Show explanation screen → call `CGRequestScreenCaptureAccess()` which triggers the OS prompt once. If the user dismisses it, it counts as denied.                                                                                                                                                                                                                   |
| **Granted**           | `CGPreflightScreenCaptureAccess()` returns `true`                               | Proceed normally.                                                                                                                                                                                                                                                                                                                                                   |
| **Denied**            | `CGPreflightScreenCaptureAccess()` returns `false` after a prior request        | There is **no API to re-trigger the prompt.** Show a manual step-by-step guide with a button that opens System Preferences directly via deep link: `x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture`. After the user toggles it on, they must restart the app (macOS requires a restart for Screen Recording changes to take effect). |

> **Dev note:** During development with unsigned builds, macOS may silently deny the permission without showing a prompt at all. Always test with a signed build (even ad-hoc) to get accurate permission behavior.

The onboarding wizard (Phase 6) must implement all three states with clear UI for each.

**How it works:**

```
┌─────────────────────────────────────────────────┐
│  macOS Audio Capture Flow                       │
│                                                 │
│  1. Request SCShareableContent                  │
│     → Lists all running apps + windows          │
│                                                 │
│  2. User selects target app (or "all audio")    │
│     → Create SCContentFilter for that app       │
│                                                 │
│  3. Configure SCStreamConfiguration             │
│     → capturesAudio = true                      │
│     → excludesCurrentProcessAudio = true        │
│     → sampleRate = 48000 (native, we resample)  │
│     → channelCount = 1 (mono)                   │
│                                                 │
│  4. Start SCStream                              │
│     → Callback receives CMSampleBuffer frames   │
│     → Extract raw PCM from AudioBufferList      │
│     → Resample 48kHz → 16kHz                    │
│     → Send to WebSocket as binary frames        │
└─────────────────────────────────────────────────┘
```

**Native module (Rust via napi-rs):**

The ScreenCaptureKit API is Objective-C/Swift. We bridge it to Node.js via a Rust native module using `napi-rs` (Node-API bindings for Rust) + `objc2` crate (Rust ↔ Objective-C FFI).

```rust
// native/src/macos/screen_capture_kit.rs — conceptual structure

use napi::*;
use napi_derive::napi;
use objc2_screen_capture_kit::*;

/// List all capturable applications
#[napi]
pub fn list_running_apps() -> Vec<AppInfo> {
    // SCShareableContent.getCurrentShareableContent()
    // → Enumerate .applications
    // → Return list of { name, bundle_id, pid }
}

/// Start capturing audio from a specific app (or all system audio)
#[napi]
pub fn start_audio_capture(
    target_bundle_id: Option<String>,  // None = capture all system audio
    callback: JsFunction,              // Called with PCM buffer chunks
) -> Result<CaptureHandle> {
    // 1. Get SCShareableContent
    // 2. Build SCContentFilter (app-specific or display-wide)
    // 3. Configure SCStreamConfiguration { capturesAudio: true }
    // 4. Create SCStream with delegate
    // 5. In delegate's didOutputSampleBuffer:
    //    - Extract AudioBufferList
    //    - Convert to interleaved PCM
    //    - Call the JS callback with Buffer
}

/// Stop capturing
#[napi]
pub fn stop_audio_capture(handle: CaptureHandle) -> Result<()> {
    // stream.stopCapture()
}
```

**Alternative approach if napi-rs + Objective-C is too complex:** Use a small Swift CLI helper that captures audio and writes PCM to stdout. The Electron main process spawns it as a child process and reads from its stdout pipe. This avoids FFI entirely:

```swift
// lira-audio-helper (Swift command-line tool)
// Compiled separately, bundled inside the Electron app's resources/

import ScreenCaptureKit
import Foundation

// 1. Request permission + list apps
// 2. Start SCStream with audio-only config
// 3. In callback: write raw PCM to FileHandle.standardOutput
// 4. Electron reads from child_process.stdout
```

This Swift helper approach is **simpler to build and debug** — recommended for V1.

#### Orphan Process Cleanup (Critical)

If Electron crashes or is force-quit, the Swift helper becomes an orphan — it keeps running, holds the ScreenCaptureKit session open, and consumes CPU. This **must** be handled:

1. **Heartbeat pipe:** The helper reads a heartbeat byte from stdin every 2 seconds. If stdin closes (Electron died) or no heartbeat arrives within 6 seconds, the helper self-terminates.

2. **Electron `before-quit` handler:** Send `SIGTERM` to the child process on graceful shutdown:

   ```ts
   app.on('before-quit', () => {
     if (audioHelper?.pid) {
       audioHelper.kill('SIGTERM')
     }
   })
   ```

3. **Startup dedup:** On launch, check for any orphan `lira-audio-helper` processes (by name) and kill them before spawning a new one:

   ```ts
   import { execSync } from 'child_process'
   try {
     execSync('pkill -f lira-audio-helper')
   } catch {}
   ```

4. The heartbeat-over-stdin approach ensures that when the parent dies, the pipe breaks, and the helper detects it — no platform-specific `PR_SET_PDEATHSIG` needed.

The Windows CLI helper (§1.3) must implement the same heartbeat-over-stdin pattern.

### 1.3 Windows Audio Capture — WASAPI Loopback

**API:** Windows Audio Session API (WASAPI) in loopback mode

**Permission:** None required. WASAPI loopback is available to any desktop app without special permissions.

**How it works:**

```
┌─────────────────────────────────────────────────┐
│  Windows Audio Capture Flow                     │
│                                                 │
│  1. Enumerate audio render endpoints            │
│     → Find default output device                │
│                                                 │
│  2. Initialize IAudioClient in loopback mode    │
│     → AUDCLNT_STREAMFLAGS_LOOPBACK              │
│     → This mirrors the output device's audio    │
│                                                 │
│  3. Start capture loop                          │
│     → IAudioCaptureClient.GetBuffer()           │
│     → Returns PCM frames at device sample rate  │
│     → Resample to 16kHz mono                    │
│     → Send to WebSocket                         │
│                                                 │
│  Note: Captures ALL system audio by default.    │
│  For app-specific capture on Windows 11:        │
│  → Use AudioGraph with AppAudioCapture          │
│    (Windows.Media.Capture namespace)             │
└─────────────────────────────────────────────────┘
```

#### Voice Activity Detection (VAD) — Required for Windows

WASAPI loopback captures **all system audio** — notification sounds, music, other apps — not just the meeting. Without filtering, a Slack notification chime or Spotify playback will be transcribed as gibberish and could trigger nonsense coaching suggestions.

**Solution:** Apply a VAD / energy gate before sending audio to the backend:

```ts
// audio-engine.ts — VAD pass before WebSocket send
const RMS_SILENCE_THRESHOLD = 0.001 // Same threshold as Lira web AudioBridge
const MIN_SPEECH_FRAMES = 3 // Require 3 consecutive frames above threshold

let speechFrameCount = 0

function shouldSendFrame(pcmInt16: Int16Array): boolean {
  // Calculate RMS energy
  let sumSq = 0
  for (let i = 0; i < pcmInt16.length; i++) {
    const normalized = pcmInt16[i] / 32768
    sumSq += normalized * normalized
  }
  const rms = Math.sqrt(sumSq / pcmInt16.length)

  if (rms >= RMS_SILENCE_THRESHOLD) {
    speechFrameCount++
    return speechFrameCount >= MIN_SPEECH_FRAMES
  } else {
    speechFrameCount = 0
    return false // Silence or noise — don't send
  }
}
```

This filters out short transient sounds (notifications, clicks) while passing through continuous speech. The same gate should be applied on macOS when capturing all system audio (no app filter selected), but is less critical there since ScreenCaptureKit supports per-app capture.

On Windows 11, prefer app-specific capture via `ActivateAudioInterfaceAsync` with process-ID targeting (see §1.3 `start_app_capture`) to avoid the noise problem entirely. The VAD gate is the fallback for Windows 10 and cases where app-specific capture isn't available.

**Native module (Rust via napi-rs):**

```rust
// native/src/windows/wasapi.rs — conceptual structure

use napi::*;
use napi_derive::napi;
use windows::Win32::Media::Audio::*;

/// Start loopback capture (all system audio)
#[napi]
pub fn start_loopback_capture(callback: JsFunction) -> Result<CaptureHandle> {
    // 1. CoInitializeEx (COM)
    // 2. IMMDeviceEnumerator → GetDefaultAudioEndpoint(eRender, eConsole)
    // 3. device.Activate::<IAudioClient>()
    // 4. audio_client.Initialize(
    //        AUDCLNT_SHAREMODE_SHARED,
    //        AUDCLNT_STREAMFLAGS_LOOPBACK,
    //        buffer_duration, ...)
    // 5. audio_client.GetService::<IAudioCaptureClient>()
    // 6. audio_client.Start()
    // 7. Loop: GetBuffer → copy frames → callback(Buffer) → ReleaseBuffer
}

/// For Windows 11: app-specific audio capture
#[napi]
pub fn start_app_capture(
    process_id: u32,
    callback: JsFunction,
) -> Result<CaptureHandle> {
    // Uses Windows.Media.Capture.AppCapture API
    // or ActivateAudioInterfaceAsync with AUDIOCLIENT_ACTIVATION_PARAMS
    // targeting a specific process ID
}
```

**Alternative approach:** Use a small C++/Rust CLI helper (similar to the macOS Swift helper) that handles WASAPI capture and pipes PCM to stdout. Electron reads from the pipe.

### 1.4 Microphone Capture (Cross-Platform)

The salesperson's own voice needs to be captured too (so the AI knows the full conversation context).

**Options:**

- **Option A: Native capture** — Capture the mic in the same native module alongside system audio. Gives us two separate streams (system = prospect, mic = salesperson) that we can label.
- **Option B: Web Audio API** — Capture the mic in the Electron renderer process using standard `getUserMedia()` + `AudioWorklet`. Same approach the Lira web app already uses.

**Recommendation:** Option A (native capture) is better because:

1. We can clearly label which audio stream is which (for diarization)
2. We can send them as separate WebSocket channels or tag the binary frames
3. Avoids the renderer process doing audio work

**Audio stream tagging protocol:**

> **Protocol compatibility note:** The existing backend WebSocket handler expects **raw PCM** binary frames with no prefix bytes. Adding a tag byte would break existing meeting/interview audio. To maintain backward compatibility, tagging is **negotiated at session level**, not detected per-frame.

**Negotiation:** When the client sends the `join` action with `settings.mode = 'sales_coaching'`, the backend sets a `tagged_audio = true` flag on that connection. All other session modes (`meeting`, `interview`) continue to expect raw untagged PCM. This is a connection-level flag checked once per binary message — zero overhead for existing modes.

```
Binary frame format (ONLY for sales_coaching sessions):
┌──────────┬───────────────────────────┐
│ Byte 0   │ Stream tag                │
│ 0x01     │ = system audio (prospect) │
│ 0x02     │ = mic audio (salesperson) │
├──────────┼───────────────────────────┤
│ Bytes 1+ │ Raw PCM 16kHz 16-bit mono │
└──────────┴───────────────────────────┘

Binary frame format (meeting/interview sessions — unchanged):
┌───────────────────────────────────────┐
│ Raw PCM 16kHz 16-bit mono (no prefix) │
└───────────────────────────────────────┘
```

**Backend implementation:** In the WebSocket binary message handler, check the connection's session mode:

```ts
ws.on('message', (data, isBinary) => {
  if (isBinary) {
    if (connectionState.mode === 'sales_coaching') {
      const tag = data[0] // 0x01 or 0x02
      const pcm = data.subarray(1)
      handleTaggedAudio(tag, pcm)
    } else {
      // Legacy: raw PCM, no tag — existing behavior unchanged
      handleRawAudio(data)
    }
  }
})
```

The backend uses stream tags for speaker attribution alongside Deepgram diarization (both, for accuracy).

### 1.5 Audio Resampler

Both system audio and mic audio arrive at the device's native sample rate (usually 44.1 kHz or 48 kHz). We need to resample to 16 kHz for Nova Sonic.

**Implementation:** Use the Rust `rubato` crate (sinc interpolation) in the native module. Do **not** use nearest-neighbor interpolation for downsampling — going from 48 kHz to 16 kHz (3:1 ratio) without an anti-aliasing filter aliases frequencies above 8 kHz into the output as distortion. `rubato` produces clean output with minimal CPU overhead and is already in the native module's Rust build chain.

```rust
// In the native Rust module — uses sinc interpolation, no aliasing
use rubato::{SincFixedIn, SincInterpolationType, Resampler};

fn create_resampler(input_rate: usize, output_rate: usize) -> SincFixedIn<f32> {
    SincFixedIn::new(
        output_rate as f64 / input_rate as f64,
        2.0,  // max relative ratio
        rubato::SincInterpolationParameters {
            sinc_len: 64,
            f_cutoff: 0.95,
            interpolation: SincInterpolationType::Linear,
            oversampling_factor: 128,
            window: rubato::WindowFunction::BlackmanHarris2,
        },
        1024,  // chunk size
        1,     // mono
    ).unwrap()
}
```

### 1.6 WebSocket Client

Reuse the exact same protocol the web app uses. The desktop app connects to `wss://api.creovine.com/lira/v1/ws` with the same auth tokens and sends the same messages.

```ts
// ws-client.ts — main process WebSocket

import WebSocket from 'ws'

export class CoachingWsClient {
  private ws: WebSocket | null = null
  private sessionId: string | null = null

  connect(token: string, apiKey: string) {
    this.ws = new WebSocket(`wss://api.creovine.com/lira/v1/ws?token=${token}&apiKey=${apiKey}`)

    this.ws.on('message', (data) => {
      if (typeof data === 'string') {
        const msg = JSON.parse(data)
        // Forward to renderer via IPC for coaching UI
        this.emit('suggestion', msg)
      }
      // Binary data = AI audio (ignored in sales coaching — text only)
    })
  }

  joinSalesSession(userId: string, userName: string, orgId: string) {
    this.ws?.send(
      JSON.stringify({
        action: 'join',
        payload: {
          user_id: userId,
          user_name: userName,
          org_id: orgId,
          settings: {
            mode: 'sales_coaching', // New mode
            personality: 'sales_coach', // New personality
            output: 'text_only', // No TTS
          },
        },
      })
    )
  }

  // Send tagged audio frame
  sendAudio(tag: number, pcmBuffer: Buffer) {
    const frame = Buffer.alloc(1 + pcmBuffer.length)
    frame[0] = tag // 0x01 = system, 0x02 = mic
    pcmBuffer.copy(frame, 1)
    this.ws?.send(frame)
  }
}
```

### Phase 1 Deliverables

- [ ] Electron app shell with main window + system tray
- [ ] macOS: ScreenCaptureKit audio capture (via Swift helper or napi-rs)
- [ ] Windows: WASAPI loopback audio capture (via Rust native or CLI helper)
- [ ] Cross-platform mic capture
- [ ] Audio resampling to 16kHz PCM mono
- [ ] WebSocket client streaming audio to Lira backend
- [ ] IPC bridge (main ↔ renderer) for session control
- [ ] Auth flow: login via browser OAuth → store token in electron-store
- [ ] Basic console logging of transcript coming back from backend

---

## Phase 2 — Backend Sales Coaching Service

> **Goal:** Add a `sales_coaching` mode to the Lira backend that processes dual audio streams and returns text-only coaching suggestions instead of voice.

### 2.1 New Meeting Mode: `sales_coaching`

**Location:** `creovine-api/src/lira-ws.routes.ts` (WebSocket handler)

When the `join` action includes `settings.mode = 'sales_coaching'`:

1. Configure the AI pipeline for **text-only coaching output** (see §2.1.1)
2. Load the **sales coaching system prompt** instead of the meeting/interview prompt
3. Enable **Deepgram diarization** with the stream tag hint (0x01 = prospect, 0x02 = salesperson)
4. Route AI text output as **coaching suggestions** (categorized JSON) instead of plain transcript

#### 2.1.1 AI Pipeline Architecture — Validate Before Building

> **⚠️ VALIDATION REQUIRED:** Nova Sonic (`amazon.nova-sonic-v1:0`) is a speech-to-speech model — its primary output is audio. The `textOutput` events are a side channel reflecting what it's saying, not a primary text-only mode. Suppressing `audioOutputConfig` may not actually suppress audio generation internally — it may just suppress delivery, still incurring TTS latency and cost.
>
> **Before implementing Phase 2, validate with AWS Bedrock documentation or a test call:**
>
> 1. Does omitting `audioOutputConfig` from the session actually skip TTS generation? Or does it still generate audio internally?
> 2. Is there a documented text-only inference mode for Nova Sonic?
> 3. What is the end-to-end latency from speech input → text output when audio output is suppressed?

**If Nova Sonic supports true text-only mode:** Use it directly — single model for STT + coaching generation.

**If Nova Sonic does NOT support text-only mode (likely):** Use a **split pipeline:**

```
Audio in (16kHz PCM)
  ├─→ Deepgram (real-time STT — fastest, ~300ms latency)
  │     → Produces transcript text
  │
  └─→ [Optional: Nova Sonic for parallel STT as accuracy cross-check]

Transcript text
  └─→ GPT-4o-mini or Nova Lite (text LLM — coaching generation)
        → System prompt: sales coaching
        → Input: last N transcript lines
        → Output: structured JSON suggestion
        → Latency: ~1-3 seconds for short response
```

**Why this split may be better for sales coaching:**

- Deepgram STT is **faster** than Nova Sonic's implicit STT (~300ms vs ~1-2s)
- GPT-4o-mini for text generation is **cheaper** than Nova Sonic (no TTS cost)
- Separating STT from coaching generation gives us **independent latency control**
- We can tune the coaching prompt without affecting transcription quality

The split pipeline adds ~1-3 seconds total latency (Deepgram STT + LLM generation) vs. Nova Sonic's all-in-one approach. For sales coaching, where suggestions appear as text cards (not voice), this is acceptable and likely faster overall.

### 2.2 Sales Coaching System Prompt

```
═══ SALES COACHING MODE

You are Lira, an invisible AI sales coach. You are listening to a live
sales conversation between a salesperson and a prospect. The salesperson
can see your suggestions in real-time — the prospect CANNOT.

YOUR ROLE:
- Listen to the conversation and provide real-time coaching
- Help the salesperson close the deal
- You NEVER speak aloud — you only provide written suggestions

OUTPUT FORMAT:
Respond in JSON (one object per suggestion):
{
  "type": "suggestion" | "objection" | "close" | "question" | "alert" | "info",
  "text": "What to say or do (1-2 sentences, actionable)",
  "urgency": "low" | "medium" | "high",
  "context": "Brief reasoning (optional)"
}

SUGGESTION TYPES:
- suggestion: General advice on what to say next
- objection: Prospect raised a concern — here's how to handle it
- close: Buying signal detected — suggest a closing technique
- question: Suggest a discovery question to ask
- alert: Prospect is disengaging, changing topic, or showing red flags
- info: Contextual information (competitor data, product specs, pricing)

RULES:
- Only send suggestions when they would genuinely help
- Don't flood — max 1 suggestion every 15-20 seconds
- Prioritize objection counters and closing opportunities
- Use the organization's product knowledge and competitor data
- Reference specific things the prospect just said
- Never suggest dishonest or manipulative tactics
- Keep suggestions short — they're read during a live call

[ORGANIZATION CONTEXT]
{org_profile}

[PRODUCT KNOWLEDGE]
{product_docs}

[COMPETITOR INTEL]
{competitor_data}

[SALESPERSON NAME]
{user_name}
```

### 2.3 Dual-Stream Audio Handling

**New backend behavior for sales_coaching mode:**

```
Incoming binary frame:
  Byte 0 = 0x01 (system audio / prospect voice)
    → Forward to Nova Sonic as "user" audio
    → Forward to Deepgram for diarization (label: "Prospect")

  Byte 0 = 0x02 (mic audio / salesperson voice)
    → Forward to Nova Sonic as "user" audio (same stream, tagged)
    → Forward to Deepgram for diarization (label: "Salesperson")

  No tag byte (legacy):
    → Treat as mixed audio, rely on Deepgram diarization
```

**Nova Sonic configuration for sales coaching:**

```ts
// Modified session configuration
const sonicConfig = {
  model: 'amazon.nova-sonic-v1:0',
  inferenceConfig: {
    maxTokens: 1024,
  },
  systemPrompt: salesCoachingPrompt,
  audioInputConfig: {
    sampleRateHertz: 16000,
    encoding: 'pcm',
  },
  // KEY DIFFERENCE: No audioOutputConfig
  // This tells Nova Sonic to produce text-only responses
  // (no speech synthesis, saving latency and cost)
}
```

### 2.4 Suggestion Throttling

To avoid overwhelming the salesperson with suggestions, implement server-side throttling:

```ts
// In the sales coaching session handler
class SalesCoachingSession {
  private lastSuggestionAt = 0
  private readonly MIN_INTERVAL_MS = 12_000 // Min 12s between suggestions
  private pendingSuggestion: Suggestion | null = null

  onAiTextOutput(text: string) {
    const suggestion = JSON.parse(text) as Suggestion

    const now = Date.now()
    const elapsed = now - this.lastSuggestionAt

    if (suggestion.urgency === 'high' || elapsed >= this.MIN_INTERVAL_MS) {
      // High urgency bypasses throttle; send immediately
      this.sendToClient(suggestion)
      this.lastSuggestionAt = now
      this.pendingSuggestion = null
    } else {
      // Queue it; will be sent when interval elapses
      this.pendingSuggestion = suggestion
    }
  }
}
```

#### End-to-End Latency SLA — Critical for Product Viability

The 12-second throttle prevents **suggestion flooding**, but the real UX concern is **end-to-end latency**: how long from when the prospect finishes speaking to when the salesperson sees a coaching suggestion.

**Latency budget (target: < 5 seconds):**

| Stage                             | Target       | Notes                                                 |
| --------------------------------- | ------------ | ----------------------------------------------------- |
| Audio capture → WebSocket arrival | < 200ms      | Local → server, minimal                               |
| STT (Deepgram / Nova Sonic)       | 300ms – 1.5s | Deepgram is faster; Nova Sonic bundles STT internally |
| LLM coaching generation           | 1 – 3s       | GPT-4o-mini streaming; depends on prompt size         |
| WebSocket → overlay render        | < 100ms      | Negligible                                            |
| **Total**                         | **< 5s**     | Anything > 8s consistently = product is frustrating   |

**Measurement requirement (Phase 2 testing):**

- Instrument `suggestion_latency_ms` on every suggestion: `Date.now()` at audio frame send → `Date.now()` at suggestion receipt
- Log P50, P90, P99 latencies per session
- If P90 > 8 seconds consistently, switch from Nova Sonic all-in-one to Deepgram STT + GPT-4o-mini split pipeline (see §2.1.1)
- Surface latency stats in the post-call summary for internal monitoring

### 2.5 Outbound Message Format (Backend → Desktop App)

```json
// Transcript update
{
  "type": "transcript",
  "payload": {
    "speaker": "Prospect",
    "text": "The pricing seems really high compared to what we're currently paying.",
    "timestamp": "2026-03-22T14:32:05Z",
    "is_salesperson": false
  }
}

// Coaching suggestion
{
  "type": "coaching",
  "payload": {
    "id": "sug_abc123",
    "suggestion_type": "objection",
    "text": "Acknowledge the concern, then reframe as ROI: 'I understand — let me show you what our clients typically save in the first 90 days. On average, it's 3.2x the subscription cost.'",
    "urgency": "high",
    "context": "Prospect raised a price objection. Counter with specific ROI data.",
    "timestamp": "2026-03-22T14:32:07Z"
  }
}

// Engagement alert
{
  "type": "coaching",
  "payload": {
    "id": "sug_def456",
    "suggestion_type": "alert",
    "text": "Prospect has been quiet for 45 seconds. Ask an open question to re-engage.",
    "urgency": "medium",
    "context": "Silence detected — possible disengagement.",
    "timestamp": "2026-03-22T14:33:15Z"
  }
}
```

### Phase 2 Deliverables

- [ ] New `sales_coaching` mode in WebSocket handler
- [ ] Sales coaching system prompt with org context injection
- [ ] Dual-stream audio handling (tagged binary frames)
- [ ] Text-only Nova Sonic session (no TTS output)
- [ ] Structured coaching suggestion output format
- [ ] Server-side suggestion throttling
- [ ] DynamoDB storage for sales coaching sessions
- [ ] Sales session REST endpoints (create, list, get, get-summary)

---

## Phase 3 — Floating Overlay & Coaching UI

> **Goal:** A beautiful, minimal floating panel that appears on top of any window, is drag-positionable, and is **excluded from screen sharing and screenshots.**

### 3.1 Screen Share Exclusion (The Critical Piece)

This is what makes it invisible to the prospect if the salesperson shares their screen.

**macOS (macOS 12.2+):**

```ts
// In Electron main process — after creating overlay BrowserWindow
import { systemPreferences } from 'electron'

const overlayWindow = new BrowserWindow({
  width: 360,
  height: 520,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  hasShadow: true,
  skipTaskbar: true,
  focusable: false, // Don't steal focus from meeting app
  resizable: true,
  // macOS-specific
  vibrancy: 'under-window', // Native macOS blur effect
  titleBarStyle: 'hidden',
})

// THE KEY LINE — exclude from screen capture/share
// Uses NSWindow.sharingType = .none
overlayWindow.setContentProtection(true)
```

`setContentProtection(true)` in Electron maps to `NSWindow.sharingType = .none` on macOS. This means:

- The window is **invisible** in screen share streams (Zoom, Meet, Teams)
- The window is **invisible** in screenshots (`Cmd+Shift+4`)
- The window is **invisible** in screen recordings (QuickTime, OBS)
- The window is **visible** only on the physical display

**Windows (Windows 10 2004+):**

```ts
// Electron's setContentProtection also works on Windows
// Under the hood, it calls SetWindowDisplayAffinity(hWnd, WDA_EXCLUDEFROMCAPTURE)
overlayWindow.setContentProtection(true)
```

`WDA_EXCLUDEFROMCAPTURE` makes the window:

- **Invisible** in screen share (Zoom, Meet, Teams)
- **Invisible** in screenshots (`Win+PrintScreen`)
- **Invisible** in screen recordings (OBS, Xbox Game Bar)
- **Visible** only on the physical display

**This single Electron API call (`setContentProtection(true)`) handles both platforms.** This is the core technical enabler for the entire product.

#### Screen Sharing Test Matrix

`setContentProtection(true)` behavior must be verified for all scenarios:

| Scenario                                      | Overlay Visible to Prospect? | Overlay Visible to Salesperson? | Notes                                                            |
| --------------------------------------------- | ---------------------------- | ------------------------------- | ---------------------------------------------------------------- |
| Share entire screen (overlay on same display) | ❌ Hidden                    | ✅ Yes                          | Primary use case — core protection                               |
| Share specific app window (e.g., Zoom)        | ❌ Hidden                    | ✅ Yes                          | Overlay is a different window, not captured                      |
| Overlay on secondary display, sharing primary | ❌ Hidden                    | ✅ Yes (on secondary)           | Works correctly — overlay stays on its display                   |
| Overlay on primary display, sharing secondary | ❌ Hidden                    | ✅ Yes                          | Content protection applies regardless of which display is shared |
| Gallery view / meeting recording              | ❌ Hidden                    | ✅ Yes                          | Cloud recording only captures meeting participants               |
| macOS screenshot (`Cmd+Shift+4`)              | ❌ Hidden                    | N/A                             | Content protection blocks screenshots                            |
| Windows Game Bar recording                    | ❌ Hidden                    | N/A                             | `WDA_EXCLUDEFROMCAPTURE` blocks game bar                         |

**Test requirement (Phase 3):** Verify all rows above on macOS 13+ (Intel + ARM) and Windows 10 2004+ / Windows 11. Document any exceptions.

### 3.2 Overlay Window Behavior

````ts
// overlay-window.ts

export function createOverlayWindow(): BrowserWindow {
  const overlay = new BrowserWindow({
    width: 360,
    height: 520,
    minWidth: 280,
    minHeight: 300,
    x: screen.getPrimaryDisplay().workAreaSize.width - 380,  // Right side
    y: 80,                                                    // Near top
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    skipTaskbar: true,           // Don't show in taskbar/dock
    focusable: false,            // CRITICAL: don't steal focus from meeting
    resizable: true,
    movable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  })

  // Invisible to screen sharing on BOTH macOS and Windows
  overlay.setContentProtection(true)

  // Always on top, even above full-screen apps
  overlay.setAlwaysOnTop(true, 'screen-saver')

  // Ignore mouse events on transparent areas (click-through)
  overlay.setIgnoreMouseEvents(false)

  // Load the React coaching UI
  overlay.loadURL('app://./overlay.html')

  return overlay
}

#### Text Selection & Copy — `focusable: false` Workaround

`focusable: false` means the overlay window can never receive keyboard focus, so text selection and copy (`Cmd/Ctrl+C`) won't work natively. This is intentional — we don't want accidental focus steal during a live call.

**Solution:** Provide an explicit **"Copy" button** on each suggestion card. On click:

```ts
// In overlay renderer (IPC to main process)
ipcRenderer.invoke('overlay:copy-text', suggestion.content)

// In main process
ipcMain.handle('overlay:copy-text', (_event, text: string) => {
  clipboard.writeText(text)
  // Don't change focus — just write to clipboard silently
})
````

This avoids the need to make the window temporarily focusable (which risks focus-stealing bugs and meeting app deactivation). The `clipboard.writeText()` API works without window focus.

```

### 3.3 Coaching Panel UI (React)

The overlay renders a clean, dark-themed coaching panel:

```

┌────────────────────────────────────────┐
│ Lira Sales Coach ● Live ─ × │ ← Drag handle + status
├────────────────────────────────────────┤
│ │
│ TRANSCRIPT │
│ ┌──────────────────────────────────┐ │
│ │ Prospect: "The pricing seems │ │
│ │ really high compared to what │ │
│ │ we're currently paying." │ │
│ │ │ │
│ │ You: "I understand that │ │
│ │ concern. Let me..." │ │
│ └──────────────────────────────────┘ │
│ │
│ 💡 SUGGESTION ⚡ urgent │
│ ┌──────────────────────────────────┐ │
│ │ Reframe as ROI: │ │
│ │ "Our clients typically save │ │
│ │ 3.2x the subscription cost │ │
│ │ in the first 90 days." │ │
│ │ │ │
│ │ Why: Price objection detected. │ │
│ │ Counter with specific data. │ │
│ └──────────────────────────────────┘ │
│ │
│ 📊 Engagement: ████████░░ 78% │
│ │
│ [Pause] [End Session] │
└────────────────────────────────────────┘

````

**Key UI behaviors:**
- Auto-scrolls transcript as new lines come in
- Suggestions appear with a subtle animation (slide in from right)
- High-urgency suggestions have a colored border (red for objections, green for close opportunities)
- Engagement meter updates based on prospect's speaking frequency and sentiment
- "Pause" temporarily stops coaching (if salesperson needs to focus)
- Semi-transparent background so meeting is partially visible behind it
- Resizable by dragging edges/corners
- Draggable by the title bar area

**Suggestion card types with visual treatment:**

| Type | Icon | Border Color | Behavior |
|------|------|-------------|----------|
| `suggestion` | 💡 | Blue | Standard coaching advice |
| `objection` | 🛡️ | Red/orange | Objection detected — counter script |
| `close` | 🎯 | Green | Buying signal — closing technique |
| `question` | ❓ | Purple | Discovery question to ask |
| `alert` | ⚠️ | Amber | Disengagement or red flag |
| `info` | 📋 | Gray | Contextual fact (pricing, specs) |

### 3.4 IPC Communication (Main ↔ Renderer)

```ts
// preload.ts — exposed API to renderer
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('lira', {
  // Session control
  startSession: (meetingApp: string, orgId: string) =>
    ipcRenderer.invoke('session:start', meetingApp, orgId),
  stopSession: () => ipcRenderer.invoke('session:stop'),
  pauseSession: () => ipcRenderer.invoke('session:pause'),

  // Receive coaching data
  onTranscript: (cb: (line: TranscriptLine) => void) =>
    ipcRenderer.on('coaching:transcript', (_, line) => cb(line)),
  onSuggestion: (cb: (suggestion: Suggestion) => void) =>
    ipcRenderer.on('coaching:suggestion', (_, s) => cb(s)),
  onEngagement: (cb: (score: number) => void) =>
    ipcRenderer.on('coaching:engagement', (_, s) => cb(s)),
  onStatus: (cb: (status: string) => void) =>
    ipcRenderer.on('coaching:status', (_, s) => cb(s)),

  // Settings
  getRunningApps: () => ipcRenderer.invoke('audio:list-apps'),
  getToken: () => ipcRenderer.invoke('auth:get-token'),
})
````

### Phase 3 Deliverables

- [ ] Floating overlay window with `setContentProtection(true)`
- [ ] Drag-to-position, resize, minimize behaviors
- [ ] CoachingPanel React component with transcript + suggestion cards
- [ ] Suggestion card components with visual treatment per type
- [ ] Engagement meter component
- [ ] Session controls (start, pause, end)
- [ ] IPC bridge for coaching data flow
- [ ] Dark theme matching Lira brand
- [ ] Auto-positioning (default: right side of screen)

---

## Phase 4 — Advanced Features & Intelligence

> **Goal:** Make the coaching smarter, more contextual, and more useful with advanced features.

### 4.1 Pre-Call Preparation

Before the call starts, the salesperson sets up context:

```
┌────────────────────────────────────────┐
│  New Sales Session                      │
├────────────────────────────────────────┤
│                                        │
│  Prospect: [John Smith, Acme Corp]     │
│  Deal Stage: [Negotiation ▼]           │
│  Meeting Goal: [Close the deal ▼]      │
│                                        │
│  Context Notes:                        │
│  ┌──────────────────────────────────┐  │
│  │ "Follow up on pricing concern    │  │
│  │  from last call. They compared   │  │
│  │  us to CompetitorX. Budget       │  │
│  │  approved for $50k/yr."          │  │
│  └──────────────────────────────────┘  │
│                                        │
│  Meeting App: [Zoom ▼]                 │
│                                        │
│  [Start Coaching Session]              │
└────────────────────────────────────────┘
```

This context is injected into the system prompt:

```
[PROSPECT CONTEXT]
Name: John Smith
Company: Acme Corp
Deal Stage: Negotiation
Meeting Goal: Close the deal
Previous Notes: "Follow up on pricing concern from last call.
They compared us to CompetitorX. Budget approved for $50k/yr."
```

### 4.2 Competitor Battlecards

**MVP (Phase 4): Pre-load at session start.** When the salesperson fills in pre-call context (prospect company, deal stage), query the org’s Qdrant knowledge base for competitor-related chunks. Inject matching data into the system prompt at session start:

If the salesperson's organization has uploaded competitor data to the Lira knowledge base (via the existing document upload + Qdrant pipeline), it gets injected:

```
[COMPETITOR INTEL]
CompetitorX:
- Price: $35k/yr (but no AI features, manual reporting)
- Weakness: No real-time analytics, 2-week onboarding
- Counter: "CompetitorX requires manual setup. With us, you're
  live in 48 hours with full automation."
```

**Future enhancement (post-MVP): Real-time competitor mention detection.** During the call, if the prospect mentions a competitor name not pre-loaded, trigger a live Qdrant query. This requires:

- Named entity recognition on the transcript stream
- Sub-second Qdrant lookup
- Dynamic prompt injection without restarting the LLM session

This is a post-Phase 4 enhancement. For MVP, pre-loaded battlecards cover the majority case since salespeople usually know which competitors are in play before the call.

This uses the **existing Phase 4-6 infrastructure** — org documents → chunked → embedded → Qdrant → semantic search → context injection.

### 4.3 Post-Call Summary & Analytics

When the session ends, generate:

1. **Call Summary** — GPT-4o-mini summary of the conversation
2. **Key Moments** — Auto-tagged: objections raised, buying signals, competitor mentions
3. **Outcome** — Salesperson tags: "Moved to proposal", "Lost", "Follow-up needed"
4. **Coaching Replay** — Scroll through the transcript with suggestions shown at each point
5. **Deal Score** — AI assessment of how likely the deal is to close

```json
// POST /lira/v1/sales-sessions/:sessionId/summary
{
  "summary": "45-minute call with John Smith from Acme Corp...",
  "key_moments": [
    { "at": "14:32", "type": "objection", "text": "Price concern raised" },
    { "at": "22:15", "type": "buying_signal", "text": "Asked about onboarding timeline" },
    { "at": "38:40", "type": "competitor_mention", "text": "Referenced CompetitorX pricing" }
  ],
  "deal_score": 72,
  "next_steps": [
    "Send ROI calculator",
    "Schedule follow-up for Thursday",
    "Prepare CompetitorX comparison sheet"
  ]
}
```

### 4.4 Smart App Detection

Instead of requiring the salesperson to manually select which app to capture, auto-detect running meeting apps:

```ts
// Auto-detect meeting apps
const MEETING_APPS = {
  'us.zoom.xos': 'Zoom',
  'com.google.Chrome': 'Google Meet (Chrome)',
  'com.microsoft.teams': 'Microsoft Teams',
  'com.apple.Safari': 'Google Meet (Safari)',
  'com.brave.Browser': 'Google Meet (Brave)',
}

function detectMeetingApp(runningApps: AppInfo[]): AppInfo | null {
  return runningApps.find((app) => MEETING_APPS[app.bundleId])
}
```

When a meeting app is detected, show a notification: "Lira detected a Zoom call. Start coaching?" — one click to begin.

### 4.5 Keyboard Shortcuts

```
Ctrl/Cmd + Shift + .    → Toggle overlay visibility
Ctrl/Cmd + Shift + ;    → Start/stop coaching session
Ctrl/Cmd + Shift + '    → Pause/resume coaching
Escape                   → Dismiss current suggestion / minimize overlay
```

> **Note:** Avoided `Ctrl/Cmd+Shift+L` (conflicts with Chrome DevTools "Focus Location Bar" on Windows), `Ctrl/Cmd+Shift+S` (conflicts with "Save As" in many apps), `Ctrl/Cmd+Shift+A` (conflicts with Zoom mute). Chosen shortcuts use punctuation keys which have minimal conflicts. These are configurable in settings.

### Phase 4 Deliverables

- [ ] Pre-call context setup UI (prospect name, deal stage, notes)
- [ ] Context injection into sales coaching prompt
- [ ] Competitor battlecard retrieval from org knowledge base
- [ ] Post-call summary generation (via GPT-4o-mini)
- [ ] Key moments extraction and tagging
- [ ] Deal scoring
- [ ] Smart meeting app auto-detection
- [ ] Global keyboard shortcuts
- [ ] Coaching session history (stored in DynamoDB, viewable in web app)

---

## Phase 5 — Distribution, Signing & Auto-Updates

> **Goal:** Package the app for professional distribution on macOS and Windows with code signing, notarization, and automatic updates.

### 5.1 macOS Distribution

> **Note on Mac App Store:** MAS distribution is **not viable** for this app. MAS sandboxing conflicts with the ScreenCaptureKit `com.apple.security.screen-capture` entitlement in practice — sandboxed apps face additional restrictions on screen/audio capture that make our use case unreliable. **Direct distribution (DMG + notarization) is the correct approach for B2B desktop tools.**
>
> For enterprise customers with strict IT policies, consider **MDM (Mobile Device Management) distribution** — apps can be pushed to managed Macs without MAS or manual download. This is a Phase 5 enhancement.

**Code Signing:**

- Requires an Apple Developer account ($99/year)
- App is signed with a "Developer ID Application" certificate
- Sign using `electron-builder`'s built-in signing:

```yaml
# electron-builder.yml
mac:
  target:
    - dmg
    - zip # Required for auto-updates
  sign: true
  identity: 'Developer ID Application: Creovine Labs (TEAM_ID)'
  hardenedRuntime: true
  entitlements: 'build/entitlements.mac.plist'
  entitlementsInherit: 'build/entitlements.mac.plist'
  gatekeeperAssess: false
```

**Entitlements (required permissions):**

```xml
<!-- build/entitlements.mac.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
  <!-- Allow screen recording (ScreenCaptureKit) -->
  <key>com.apple.security.screen-recording</key>
  <true/>

  <!-- Allow microphone access -->
  <key>com.apple.security.device.audio-input</key>
  <true/>

  <!-- Allow network (WebSocket to backend) -->
  <key>com.apple.security.network.client</key>
  <true/>

  <!-- Hardened runtime exceptions -->
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>

  <!-- For native modules -->
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
</dict>
</plist>
```

**Notarization:**

Apple requires all distributed apps (outside the App Store) to be notarized — Apple scans it for malware and issues a ticket.

```js
// scripts/notarize.js — runs automatically after electron-builder signs the app
const { notarize } = require('@electron/notarize')

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== 'darwin') return

  await notarize({
    appBundleId: 'com.creovine.lira-coach',
    appPath: context.appOutDir + '/Lira Sales Coach.app',
    appleId: process.env.APPLE_ID, // Apple Developer email
    appleIdPassword: process.env.APPLE_APP_PASSWORD, // App-specific password
    teamId: process.env.APPLE_TEAM_ID,
  })
}
```

**Steps to set up (manual, one-time):**

1. Enroll in Apple Developer Program at developer.apple.com
2. Create a "Developer ID Application" certificate in Xcode or the developer portal
3. Generate an app-specific password at appleid.apple.com for notarization
4. Store credentials in environment variables or CI secrets

### 5.2 Windows Distribution

**Code Signing:**

- Requires an EV Code Signing Certificate (from DigiCert, Sectigo, etc.)
- Prevents "Windows protected your PC" SmartScreen warning
- Sign using `electron-builder`:

```yaml
# electron-builder.yml
win:
  target:
    - nsis # Installer (.exe)
    - zip # Portable
  sign: true
  signingHashAlgorithms:
    - sha256
  certificateFile: ${env.WIN_CERT_FILE}
  certificatePassword: ${env.WIN_CERT_PASSWORD}

nsis:
  oneClick: true
  perMachine: false
  installerIcon: 'resources/icon.ico'
  uninstallerIcon: 'resources/icon.ico'
  createDesktopShortcut: true
  createStartMenuShortcut: true
```

**Steps to set up (manual, one-time):**

1. Purchase an EV Code Signing Certificate (~$300-500/year)
2. Certificate comes on a hardware USB token (YubiKey or similar)
3. Configure the token on the Windows build machine
4. Windows SmartScreen trust builds over time with signed installs

### 5.3 Auto-Updates

Use `electron-updater` (part of electron-builder) with a static file host or GitHub Releases:

```ts
// In main process
import { autoUpdater } from 'electron-updater'

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

// Check on launch + every 4 hours
autoUpdater.checkForUpdates()
setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000)

autoUpdater.on('update-downloaded', () => {
  // Notify user: "Update ready — will install on next restart"
  overlay.webContents.send('update:ready')
})
```

**Update hosting options:**

- **GitHub Releases** — Free, works out of the box with electron-updater
- **S3 bucket** — Upload build artifacts, electron-updater points to S3 URL
- **Your own server** — Serve update manifests from api.creovine.com

### Phase 5 Deliverables

- [ ] macOS: Code signing with Developer ID certificate
- [ ] macOS: Notarization script + Apple Developer account setup
- [ ] macOS: DMG installer with custom background
- [ ] Windows: Code signing with EV certificate
- [ ] Windows: NSIS installer with Lira branding
- [ ] Auto-update system (electron-updater + hosting)
- [ ] CI/CD pipeline (GitHub Actions: build → sign → notarize → upload)

---

## Phase 6 — Polish, Analytics & Production Hardening

> **Goal:** Production-ready quality, error handling, analytics, and edge cases.

### 6.1 Error Handling & Resilience

| Scenario                           | Handling                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebSocket disconnects mid-call     | Auto-reconnect with exponential backoff (same as web app). **Discard buffered audio on reconnect** — stale audio would produce irrelevant suggestions. Resume from current moment. Show "Reconnecting... (X seconds of audio missed)" in overlay. |
| Audio capture fails                | Retry 3x. If still failing, show error + fallback instructions.                                                                                                                                                                                   |
| Meeting app closes                 | Detect via app monitoring. Show "Meeting ended" and auto-stop session.                                                                                                                                                                            |
| Backend returns error              | Display gracefully in overlay. Don't crash.                                                                                                                                                                                                       |
| Screen Recording permission denied | Show step-by-step guide to enable it in System Preferences.                                                                                                                                                                                       |
| Very slow network                  | Buffer suggestions. Show "Low connection" indicator. Audio is tiny (16kHz mono = ~32KB/s).                                                                                                                                                        |

### 6.2 Legal & Consent Disclaimer

> **⚠️ CRITICAL FOR COMMERCIAL VIABILITY**
>
> Recording or intercepting audio from a meeting without consent may violate wiretapping and eavesdropping laws in many jurisdictions:
>
> - **Two-party / all-party consent states** (e.g., California, Illinois, Florida, Pennsylvania)
> - **EU GDPR** — processing voice data requires explicit consent or legitimate interest
> - **Canada PIPEDA** — requires knowledge and consent for collection of personal information
>
> **Lira’s position:** The salesperson is responsible for obtaining any required consent before using coaching. Lira does not record full audio by default — it streams audio for real-time processing and discards it immediately.

**Required in-app disclosures:**

1. **First-time setup:** Show a legal notice: "You are responsible for complying with all applicable recording and consent laws in your jurisdiction. By using Lira Sales Coach, you confirm that you have obtained any required consent from meeting participants."
2. **User must acknowledge** (checkbox + "I understand") before their first session. Store this in user profile.
3. **Optional consent notification feature:** Allow salesperson to trigger a Zoom/Meet chat message: "This meeting may be assisted by AI note-taking tools." — configurable per org via settings.
4. **Org admin control:** Organization admins can enforce consent notification as mandatory for all sales coaching sessions.

### 6.3 Privacy & Security

- **Audio never stored on disk** — streamed directly from capture to WebSocket, never written to a file on the salesperson's machine
- **Coaching text stored in DynamoDB** with the same TTL-based auto-deletion as meetings
- **WebSocket over TLS** — all audio encrypted in transit
- **Token storage** — `electron-store` with OS-level encryption (macOS Keychain / Windows DPAPI)
- **No recording of the call** unless explicitly enabled by the user
- **Content protection** — overlay window excluded from any screen capture

### 6.3 Performance

Audio streaming requirements:

- **Bandwidth:** 16kHz × 16-bit × 1 channel = 256 kbps = **32 KB/s per stream**
- With two streams (system + mic): **64 KB/s total** — works on any connection
- **CPU:** Audio resampling is lightweight (~1-2% CPU)
- **Memory:** Electron base ~80 MB + overlay ~30 MB = ~110 MB total (acceptable)

### 6.4 Analytics & Telemetry

Track (anonymized, no audio content):

- Sessions per user per week
- Average session duration
- Suggestions shown / dismissed / marked helpful
- Deal outcomes (if tagged)
- App crashes (via Sentry or similar)

### 6.5 Onboarding Flow

First-time user experience:

```
Step 1: "Welcome to Lira Sales Coach"
        → Sign in with your Lira account

Step 2: "Grant permissions"
        → macOS: Screen Recording + Microphone
        → Windows: Microphone only (WASAPI needs nothing)

Step 3: "Let's verify audio"
        → Play some audio, verify capture works
        → Speak, verify mic capture works

Step 4: "Choose your organization"
        → Select org (loads product knowledge, competitor data)

Step 5: "You're ready!"
        → Show coaching overlay preview
        → Explain keyboard shortcuts
```

### Phase 6 Deliverables

- [ ] Error handling for all failure modes
- [ ] Auto-reconnection with discard-on-reconnect policy (show missed duration)
- [ ] Permission request flows (macOS Screen Recording, Microphone)
- [ ] First-time onboarding wizard
- [ ] Analytics/telemetry integration
- [ ] Crash reporting (Sentry)
- [ ] Performance optimization pass
- [ ] Token security (OS keychain storage)
- [ ] End-to-end testing on macOS (Intel + ARM) and Windows (10 + 11)

---

## Technical Reference

### Existing Backend Services to Reuse

| Service               | Location                      | What to Reuse                                                                |
| --------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| WebSocket handler     | `lira-ws.routes.ts`           | Add `sales_coaching` mode alongside existing `meeting` and `interview` modes |
| Nova Sonic session    | `lira-sonic.service.ts`       | Same bidirectional streaming, new system prompt, text-only output            |
| Deepgram diarization  | `lira-bot/audio-bridge.ts`    | Same diarization pipeline, but now with stream tags for attribution          |
| Org context injection | `lira-org-context.service.ts` | Same Phase 6 context injection (org profile, docs, website knowledge)        |
| DynamoDB storage      | `lira-meeting.service.ts`     | New table or partition for sales coaching sessions                           |
| Summary generation    | `lira-meeting.service.ts`     | Reuse GPT-4o-mini summary, adapt for sales call format                       |
| Auth + tenancy        | `auth.middleware.ts`          | Same JWT + API key auth                                                      |

### Key Dependencies

```json
{
  "dependencies": {
    "electron": "~34.3.0",
    "electron-store": "^10.x",
    "electron-updater": "^6.x",
    "ws": "^8.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  },
  "devDependencies": {
    "electron-builder": "^25.x",
    "@electron/notarize": "^2.x",
    "napi-rs": "^3.x",
    "vite": "^5.x",
    "typescript": "^5.x"
  }
}
```

### Native Module Build Matrix

| Platform | Audio Capture    | Language                               | Crate/Lib                               |
| -------- | ---------------- | -------------------------------------- | --------------------------------------- |
| macOS    | ScreenCaptureKit | Swift CLI helper (or Rust + objc2)     | `objc2-screen-capture-kit`              |
| macOS    | Microphone       | Swift CLI helper (or Rust + CoreAudio) | `coreaudio-rs`                          |
| Windows  | WASAPI loopback  | Rust                                   | `windows` crate (`Win32::Media::Audio`) |
| Windows  | Microphone       | Rust                                   | `windows` crate (`Win32::Media::Audio`) |

### API Endpoints (New)

```
POST   /lira/v1/sales-sessions                    Create a new sales coaching session
GET    /lira/v1/sales-sessions?userId=...          List sessions
GET    /lira/v1/sales-sessions/:sessionId          Get session details + transcript
POST   /lira/v1/sales-sessions/:sessionId/summary  Generate post-call summary
PUT    /lira/v1/sales-sessions/:sessionId/outcome  Record deal outcome
DELETE /lira/v1/sales-sessions/:sessionId          Delete session
```

### Environment Variables (New)

```bash
# Sales coaching
LIRA_SALES_SUGGESTION_MIN_INTERVAL_MS=12000   # Min time between suggestions
LIRA_SALES_SESSION_TTL_DAYS=30                # DynamoDB TTL for sessions
LIRA_SALES_MAX_SESSION_DURATION_MIN=180       # Max session length (3 hours)
LIRA_SALES_SESSION_END_WARNING_MIN=10          # Warn user X minutes before max duration
```

> **Session duration warning:** When `MAX_SESSION_DURATION - elapsed < SESSION_END_WARNING_MIN`, show a persistent banner in the overlay: "Session ends in X minutes. Save your notes." At max duration, end gracefully (trigger post-call summary, don't just cut off).

---

## Implementation Order Summary

| Phase       | Focus                                           | Depends On        | Key Risk                               |
| ----------- | ----------------------------------------------- | ----------------- | -------------------------------------- |
| **Phase 1** | Electron shell + audio capture + WS streaming   | Nothing           | Native audio capture complexity        |
| **Phase 2** | Backend sales coaching mode + prompts           | Phase 1 (to test) | Prompt tuning for useful suggestions   |
| **Phase 3** | Floating overlay UI + content protection        | Phase 1 + 2       | Overlay focus/click-through edge cases |
| **Phase 4** | Pre-call setup, battlecards, post-call summary  | Phase 3           | UX design for compact overlay          |
| **Phase 5** | Signing, notarization, auto-updates, installers | Phase 1-4         | Apple/Windows cert procurement         |
| **Phase 6** | Error handling, onboarding, analytics, polish   | Phase 1-5         | Edge cases on different OS versions    |

**Phases 1 + 2 can be worked in parallel** — frontend (desktop app) and backend (sales coaching service) are independent until integration testing.

**Phases 3 + 4** build on each other but are primarily frontend work.

**Phase 5** can begin as soon as the app is functional (Phase 3 complete) — certificate procurement takes time, so start the process early.

**Phase 6** runs concurrent with Phase 4-5 and continues post-launch.
