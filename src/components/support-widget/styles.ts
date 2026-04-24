/**
 * Lira Support Widget — Styles
 *
 * All styles are scoped to the #lira-support-widget shadow root.
 * Uses CSS custom properties for theming.
 */

export function getWidgetStyles(primaryColor: string): string {
  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a2e;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ── Launcher button ─────────────────────────────────────── */

    .lira-launcher {
      position: fixed;
      z-index: 2147483647;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .lira-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0,0,0,0.22);
    }
    .lira-launcher.bottom-right {
      bottom: 20px;
      right: 20px;
    }
    .lira-launcher.bottom-left {
      bottom: 20px;
      left: 20px;
    }
    .lira-launcher svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    .lira-unread-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #fff;
      pointer-events: none;
      animation: lira-badge-pop 0.3s ease-out;
    }
    @keyframes lira-badge-pop {
      0% { transform: scale(0); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* ── Chat window ─────────────────────────────────────────── */

    .lira-chat-window {
      position: fixed;
      z-index: 2147483647;
      width: 380px;
      height: 560px;
      max-height: calc(100vh - 100px);
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: lira-slide-up 0.25s ease-out;
    }
    .lira-chat-window.bottom-right {
      bottom: 84px;
      right: 20px;
    }
    .lira-chat-window.bottom-left {
      bottom: 84px;
      left: 20px;
    }

    @media (max-width: 440px) {
      .lira-chat-window {
        width: calc(100vw - 16px);
        height: calc(100vh - 100px);
        bottom: 84px;
        right: 8px;
        left: 8px;
        border-radius: 14px;
      }
    }

    @keyframes lira-slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Header ──────────────────────────────────────────────── */

    .lira-header {
      background: ${primaryColor};
      color: white;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }
    .lira-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
    }
    .lira-header-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }
    .lira-header-avatar .lira-initial {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
    }
    .lira-header-info {
      flex: 1;
      min-width: 0;
    }
    .lira-header-title {
      font-size: 15px;
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lira-header-subtitle {
      font-size: 11px;
      opacity: 0.8;
      margin-top: 2px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .lira-online-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      display: inline-block;
      flex-shrink: 0;
    }
    .lira-header-actions {
      display: flex;
      align-items: center;
      gap: 2px;
      flex-shrink: 0;
    }
    .lira-header-btn {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 6px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    .lira-header-btn:hover {
      background: rgba(255,255,255,0.15);
    }
    .lira-header-btn svg {
      width: 18px;
      height: 18px;
      fill: currentColor;
    }
    .lira-header-text-btn {
      background: rgba(255,255,255,0.15);
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    .lira-header-text-btn:hover {
      background: rgba(255,255,255,0.25);
    }

    /* ── Messages ─────────────────────────────────────────────── */

    .lira-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #ffffff;
    }
    .lira-messages::-webkit-scrollbar {
      width: 4px;
    }
    .lira-messages::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    /* Message row — avatar + body */
    .lira-msg-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .lira-msg-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${primaryColor}15;
      color: ${primaryColor};
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
      margin-top: 2px;
    }
    .lira-msg-avatar.lira-avatar {
      background: #f3f4f6;
      padding: 3px;
    }
    .lira-msg-avatar.lira-avatar svg {
      fill: ${primaryColor};
    }
    .lira-msg-avatar.lira-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lira-msg-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .lira-msg-avatar svg {
      width: 16px;
      height: 16px;
    }
    .lira-msg-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-width: calc(100% - 40px);
      min-width: 120px;
    }
    .lira-msg-name {
      font-size: 12px;
      color: #374151;
      font-weight: 600;
      padding-left: 2px;
    }

    /* Individual message bubbles */
    .lira-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }
    /* Bubbles inside a row (lira/agent) — parent already constrains width */
    .lira-msg-body .lira-msg {
      max-width: 100%;
    }
    .lira-msg.lira {
      align-self: flex-start;
      background: #ffffff;
      color: #1a1a2e;
      border: 1px solid #e5e7eb;
      border-bottom-left-radius: 4px;
    }
    .lira-msg.customer {
      align-self: flex-end;
      background: ${primaryColor};
      color: white;
      border-bottom-right-radius: 4px;
    }
    .lira-msg.agent {
      align-self: flex-start;
      background: #ffffff;
      color: #1a1a2e;
      border: 1px solid #c7d2fe;
      border-bottom-left-radius: 4px;
    }
    .lira-msg.system {
      align-self: center;
      background: transparent;
      color: #9ca3af;
      font-size: 12px;
      text-align: center;
      padding: 4px 8px;
    }

    /* Typing indicator */
    .lira-typing-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .lira-typing {
      display: flex;
      gap: 4px;
      padding: 10px 16px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
    }
    .lira-typing span {
      width: 6px;
      height: 6px;
      background: #9ca3af;
      border-radius: 50%;
      animation: lira-bounce 1.4s infinite;
    }
    .lira-typing span:nth-child(2) { animation-delay: 0.2s; }
    .lira-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes lira-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    /* ── Input area ──────────────────────────────────────────── */

    .lira-input-area {
      border-top: 1px solid #e5e7eb;
      padding: 12px 16px;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: #ffffff;
    }
    .lira-input-area textarea {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      padding: 8px 12px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 100px;
      min-height: 36px;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.15s;
      background: #fafafa;
    }
    .lira-input-area textarea:focus {
      border-color: ${primaryColor};
      background: #fff;
    }
    .lira-input-area textarea::placeholder {
      color: #9ca3af;
    }
    .lira-input-area textarea:disabled {
      background: #f3f4f6;
      color: #9ca3af;
      cursor: not-allowed;
    }
    .lira-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${primaryColor};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .lira-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .lira-send-btn svg {
      width: 18px;
      height: 18px;
      fill: white;
    }

    /* Resolved state */
    .lira-resolved-banner {
      padding: 8px 12px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .lira-new-chat-btn {
      display: block;
      width: 100%;
      padding: 10px 16px;
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .lira-new-chat-btn:hover {
      opacity: 0.9;
    }

    /* ── CSAT ─────────────────────────────────────────────────── */

    .lira-csat {
      padding: 24px 16px;
      text-align: center;
      background: #fff;
    }
    .lira-csat h3 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
      color: #1a1a2e;
    }
    .lira-csat p {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 16px;
    }
    .lira-csat-stars {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    .lira-csat-star {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid #e5e7eb;
      background: white;
      cursor: pointer;
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, background 0.15s;
    }
    .lira-csat-star:hover, .lira-csat-star.selected {
      border-color: ${primaryColor};
      background: ${primaryColor}10;
    }
    .lira-csat-thanks {
      color: #059669;
      font-size: 14px;
      margin-top: 12px;
    }

    /* ── Footer ───────────────────────────────────────────────── */

    .lira-powered {
      text-align: center;
      padding: 6px;
      font-size: 10px;
      color: #b0b0b0;
      flex-shrink: 0;
      background: #fff;
    }
    .lira-powered a {
      color: #8b8b8b;
      text-decoration: none;
    }
    .lira-powered a:hover {
      text-decoration: underline;
    }

    /* ── Voice call ──────────────────────────────────────────── */

    .lira-header-btn.lira-call-active {
      background: rgba(239,68,68,0.2);
      color: #ef4444;
    }
    .lira-header-btn.lira-call-active:hover {
      background: rgba(239,68,68,0.3);
    }

    .lira-voice-overlay {
      position: absolute;
      inset: 0;
      top: 52px; /* below header */
      background: rgba(255,255,255,0.97);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      z-index: 10;
      backdrop-filter: blur(8px);
    }

    .lira-voice-avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: #f3f4f6;
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .lira-voice-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lira-voice-pulse {
      animation: lira-pulse-ring 2s ease-out infinite;
      box-shadow: 0 0 0 0 ${primaryColor}40;
    }
    @keyframes lira-pulse-ring {
      0% { box-shadow: 0 0 0 0 ${primaryColor}40; }
      70% { box-shadow: 0 0 0 16px ${primaryColor}00; }
      100% { box-shadow: 0 0 0 0 ${primaryColor}00; }
    }

    .lira-voice-label {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .lira-voice-timer {
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      font-variant-numeric: tabular-nums;
    }

    .lira-voice-end-btn {
      margin-top: 8px;
      padding: 10px 32px;
      border-radius: 99px;
      background: #ef4444;
      color: white;
      border: none;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      transition: background 0.15s;
    }
    .lira-voice-end-btn:hover {
      background: #dc2626;
    }

    /* ── Pre-chat form ───────────────────────────────────────── */

    .lira-prechat-form {
      flex: 1;
      padding: 24px 20px;
      overflow-y: auto;
    }

    /* ── Generative UI: action chip ─────────────────────────── */
    .lira-action-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      align-self: flex-start;
      margin: 4px 0 4px 36px;
      padding: 4px 10px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #4b5563;
      font-size: 11px;
      font-weight: 500;
    }
    .lira-action-chip.ok { background: #ecfdf5; color: #047857; }
    .lira-action-chip.fail { background: #fef2f2; color: #b91c1c; }
    .lira-action-dot {
      display: inline-flex;
      width: 14px; height: 14px;
      align-items: center; justify-content: center;
      border-radius: 999px;
      background: currentColor; color: #fff;
      font-size: 9px; font-weight: 700;
    }

    /* ── Generative UI: card ─────────────────────────────────── */
    .lira-card {
      align-self: flex-start;
      margin: 6px 0 6px 36px;
      max-width: 78%;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 14px 14px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .lira-card-title {
      display: flex; align-items: center; justify-content: space-between;
      font-weight: 600; font-size: 13px; color: #111827;
      margin-bottom: 6px;
    }
    .lira-card-badge {
      font-size: 10px; font-weight: 600; text-transform: uppercase;
      padding: 2px 8px; border-radius: 999px; letter-spacing: 0.04em;
    }
    .lira-card-badge.tone-success { background: #ecfdf5; color: #047857; }
    .lira-card-badge.tone-warn { background: #fef3c7; color: #92400e; }
    .lira-card-badge.tone-error { background: #fef2f2; color: #b91c1c; }
    .lira-card-badge.tone-neutral { background: #f3f4f6; color: #4b5563; }
    .lira-card-body { font-size: 13px; color: #374151; margin-bottom: 8px; }
    .lira-card-fields {
      display: grid; grid-template-columns: max-content 1fr;
      gap: 4px 12px; margin: 6px 0; font-size: 12px;
    }
    .lira-card-fields dt { color: #6b7280; }
    .lira-card-fields dd { color: #111827; margin: 0; font-weight: 500; }
    .lira-card-buttons { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .lira-card-btn {
      border: none; padding: 7px 14px; border-radius: 8px;
      font-size: 12px; font-weight: 600; cursor: pointer;
      font-family: inherit;
    }
    .lira-card-btn.primary { background: var(--lira-primary, #3730a3); color: #fff; }
    .lira-card-btn.primary:hover { filter: brightness(1.08); }
    .lira-card-btn.secondary { background: #f3f4f6; color: #374151; }
    .lira-card-btn.secondary:hover { background: #e5e7eb; }
    .lira-card-btn.danger { background: #ef4444; color: #fff; }
    .lira-card-btn.danger:hover { background: #dc2626; }

    /* ── Generative UI: confirm ─────────────────────────────── */
    .lira-confirm {
      align-self: flex-start;
      margin: 6px 0 6px 36px;
      max-width: 78%;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 12px 14px;
    }
    .lira-confirm-title { font-weight: 600; font-size: 13px; color: #92400e; margin-bottom: 4px; }
    .lira-confirm-body { font-size: 13px; color: #78350f; margin-bottom: 10px; }
    .lira-confirm-buttons { display: flex; gap: 8px; }
    .lira-confirm-status {
      font-size: 12px; font-weight: 600; padding: 6px 10px;
      border-radius: 6px; display: inline-block;
    }
    .lira-confirm-status.approved { background: #ecfdf5; color: #047857; }
    .lira-confirm-status.declined { background: #f3f4f6; color: #6b7280; }
  `
}
