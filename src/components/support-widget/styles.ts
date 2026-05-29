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
    :host([data-lira-mode="fullscreen"]) {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 640px;
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
      box-shadow: 0 12px 30px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.12);
      transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    }
    .lira-launcher:hover {
      transform: translateY(-1px) scale(1.04);
      box-shadow: 0 18px 36px rgba(15,23,42,0.22), 0 4px 10px rgba(15,23,42,0.14);
      filter: saturate(1.08);
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
      top: -3px;
      right: -3px;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #fff;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      pointer-events: none;
      animation: lira-badge-pop 0.3s ease-out;
    }
    .lira-unread-badge::before {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      background: #ef4444;
      opacity: 0;
      animation: lira-badge-ping 2s ease-out 0.4s infinite;
    }
    @keyframes lira-badge-pop {
      0% { transform: scale(0); }
      70% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
    @keyframes lira-badge-ping {
      0% { transform: scale(1); opacity: 0.65; }
      100% { transform: scale(2.6); opacity: 0; }
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
      border: 1px solid rgba(226,232,240,0.92);
      box-shadow: 0 24px 70px rgba(15,23,42,0.18), 0 8px 20px rgba(15,23,42,0.08);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .lira-chat-window.lira-anim-in {
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
    .lira-chat-window.lira-fullscreen {
      position: relative;
      z-index: 1;
      inset: auto;
      width: 100%;
      height: 100%;
      min-height: 640px;
      max-height: none;
      border-radius: 14px;
      box-shadow: none;
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
      .lira-chat-window.lira-fullscreen {
        width: 100%;
        height: 100%;
        min-height: 600px;
        inset: auto;
        border-radius: 0;
      }
    }

    @keyframes lira-slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Header ──────────────────────────────────────────────── */

    .lira-header {
      background: linear-gradient(135deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 82%, #111827 18%) 100%);
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
    .lira-back-btn {
      margin-right: -4px;
    }
    .lira-widget-tabs {
      display: flex;
      gap: 5px;
      padding: 5px;
      margin: 0 18px 8px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.92));
      border: 1px solid rgba(203,213,225,0.86);
      border-radius: 999px;
      box-shadow:
        0 16px 34px rgba(15,23,42,0.12),
        0 2px 7px rgba(15,23,42,0.07),
        inset 0 1px 0 rgba(255,255,255,0.9);
      backdrop-filter: blur(14px);
      flex-shrink: 0;
      animation: lira-bottom-nav-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-widget-tab {
      position: relative;
      flex: 1;
      height: 38px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: transparent;
      color: #64748b;
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition:
        background 0.18s ease,
        color 0.18s ease,
        border-color 0.18s ease,
        transform 0.14s ease,
        box-shadow 0.18s ease;
    }
    .lira-widget-tab:hover {
      background: rgba(248,250,252,0.92);
      color: #0f172a;
    }
    .lira-widget-tab:active {
      transform: scale(0.98);
    }
    .lira-widget-tab.active {
      background: #0f172a;
      border-color: #0f172a;
      color: #ffffff;
      box-shadow: 0 7px 16px rgba(15,23,42,0.16);
    }
    .lira-widget-tab.active:hover {
      background: #0f172a;
      color: #ffffff;
    }
    .lira-widget-tab.active::after {
      content: '';
      position: absolute;
      left: 50%;
      bottom: 5px;
      width: 4px;
      height: 4px;
      border-radius: 999px;
      background: #2dd4bf;
      transform: translateX(-50%);
    }
    .lira-widget-tab:not(.active) {
      color: #64748b;
    }
    .lira-widget-tab:not(.active):hover {
      background: rgba(255,255,255,0.92);
      color: #0f172a;
    }
    @keyframes lira-bottom-nav-in {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
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
      padding: 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: linear-gradient(180deg, #f8fafc 0%, #ffffff 58%);
    }
    .lira-messages::-webkit-scrollbar {
      width: 4px;
    }
    .lira-messages::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    /* ── First-visit hero welcome ───────────────────────────── */
    /* Replaces the empty message list when autoOpenFirstVisit is on and
       no conversation has started yet. Auto-dismissed by appendChatMessage
       the moment a first bubble lands. Designed to feel premium: subtle
       gradient backdrop, breathing rings around the avatar, staggered
       fade-ins for each piece of copy, CTA arrow that slides on hover. */

    .lira-hero {
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 28px 28px 18px;
      text-align: center;
      gap: 6px;
      background:
        radial-gradient(ellipse 80% 60% at 50% 28%, rgba(99, 102, 241, 0.10) 0%, rgba(99, 102, 241, 0) 70%),
        linear-gradient(180deg, #fafbff 0%, #ffffff 70%);
      overflow: hidden;
    }

    /* Decorative animated glow behind the avatar. */
    .lira-hero-glow {
      position: absolute;
      top: 18%;
      left: 50%;
      transform: translateX(-50%);
      width: 220px;
      height: 220px;
      pointer-events: none;
      background: radial-gradient(circle at center, rgba(99, 102, 241, 0.22) 0%, rgba(99, 102, 241, 0) 65%);
      filter: blur(10px);
      animation: lira-hero-glow 6s ease-in-out infinite;
    }
    @keyframes lira-hero-glow {
      0%, 100% { opacity: 0.7; transform: translateX(-50%) scale(1); }
      50%      { opacity: 1;   transform: translateX(-50%) scale(1.08); }
    }

    /* Avatar with two breathing rings around it. */
    .lira-hero-avatar-wrap {
      position: relative;
      width: 80px;
      height: 80px;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      animation: lira-hero-fade-up 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-hero-ring {
      position: absolute;
      top: 50%; left: 50%;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 1.5px solid ${primaryColor};
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: lira-hero-ring 2.6s ease-out infinite;
    }
    .lira-hero-ring-1 { animation-delay: 0s; }
    .lira-hero-ring-2 { animation-delay: 1.3s; }
    @keyframes lira-hero-ring {
      0%   { transform: translate(-50%, -50%) scale(0.85); opacity: 0.6; }
      60%  { opacity: 0.18; }
      100% { transform: translate(-50%, -50%) scale(1.55); opacity: 0; }
    }
    .lira-hero-avatar {
      position: relative;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.9) inset,
        0 10px 28px -10px rgba(15, 23, 42, 0.35),
        0 2px 6px -2px rgba(15, 23, 42, 0.2);
    }
    .lira-hero-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 50%;
    }

    .lira-hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 4px 10px 4px 8px;
      margin-bottom: 10px;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      animation: lira-hero-fade-up 520ms 80ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-hero-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
      animation: lira-hero-dot-pulse 2s ease-out infinite;
    }
    @keyframes lira-hero-dot-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55); }
      80%  { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
      100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
    }

    .lira-hero-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0f172a;
      margin: 0;
      animation: lira-hero-fade-up 520ms 140ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-hero-subtitle {
      font-size: 13.5px;
      line-height: 1.55;
      color: #64748b;
      margin: 6px 0 18px;
      max-width: 296px;
      animation: lira-hero-fade-up 520ms 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .lira-hero-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: linear-gradient(180deg, color-mix(in srgb, ${primaryColor} 92%, #ffffff 8%) 0%, ${primaryColor} 100%);
      color: #ffffff;
      border: none;
      border-radius: 14px;
      padding: 13px 22px;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      width: 100%;
      max-width: 280px;
      transition: transform 0.14s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.18s ease, opacity 0.15s ease;
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.12) inset,
        0 8px 20px -8px rgba(15, 23, 42, 0.35),
        0 1px 3px rgba(15, 23, 42, 0.16);
      animation: lira-hero-fade-up 520ms 300ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-hero-cta:hover {
      transform: translateY(-1px);
      box-shadow:
        0 1px 0 rgba(255, 255, 255, 0.15) inset,
        0 14px 28px -10px rgba(15, 23, 42, 0.45),
        0 2px 6px rgba(15, 23, 42, 0.22);
    }
    .lira-hero-cta:hover .lira-hero-cta-arrow {
      transform: translateX(3px);
    }
    .lira-hero-cta:active {
      transform: translateY(0) scale(0.985);
    }
    .lira-hero-cta-arrow {
      width: 16px;
      height: 16px;
      transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .lira-hero-hint {
      font-size: 11.5px;
      color: #94a3b8;
      margin: 12px 0 0;
      animation: lira-hero-fade-up 520ms 380ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    @keyframes lira-hero-fade-up {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Suggestion pills row (above the input) ─────────────── */
    /* Sits between the messages list and the input area. Hidden when
       activeSuggestions is empty. Each chip is the literal text the
       user will send if clicked. */
    .lira-suggestions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 8px 14px 4px;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
    }
    .lira-suggestion-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      color: #334155;
      cursor: pointer;
      transition: background 0.12s ease, border-color 0.12s ease, transform 0.1s ease, color 0.12s ease;
      animation: lira-chip-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-suggestion-chip:hover {
      background: ${primaryColor};
      border-color: ${primaryColor};
      color: #ffffff;
    }
    .lira-suggestion-chip:active {
      transform: scale(0.97);
    }
    @keyframes lira-chip-in {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Public site home surface */
    .lira-home {
      flex: 1;
      overflow-y: auto;
      background:
        radial-gradient(ellipse 72% 44% at 50% 6%, rgba(45,212,191,0.16) 0%, rgba(45,212,191,0) 70%),
        radial-gradient(ellipse 54% 40% at 8% 92%, rgba(245,158,11,0.09) 0%, rgba(245,158,11,0) 72%),
        linear-gradient(180deg, #fbfcff 0%, #f8fafc 58%, #ffffff 100%);
      padding: 22px 18px 12px;
      animation: lira-home-fade-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-hero {
      position: relative;
      border: 1px solid rgba(226,232,240,0.95);
      border-radius: 20px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.9) 100%);
      padding: 82px 20px 19px;
      text-align: center;
      overflow: hidden;
      box-shadow:
        0 22px 50px rgba(15,23,42,0.1),
        0 1px 0 rgba(255,255,255,0.95) inset;
    }
    .lira-home-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(135deg, rgba(20,184,166,0.12), rgba(255,255,255,0) 34%),
        linear-gradient(225deg, rgba(15,23,42,0.07), rgba(255,255,255,0) 36%);
    }
    .lira-home-glow {
      position: absolute;
      top: -72px;
      left: 50%;
      width: 270px;
      height: 270px;
      pointer-events: none;
      background:
        radial-gradient(circle at center, rgba(20,184,166,0.18) 0%, rgba(15,23,42,0.08) 34%, rgba(15,23,42,0) 66%);
      filter: blur(9px);
      transform: translateX(-50%);
      animation: lira-home-glow 6s ease-in-out infinite;
    }
    .lira-home-logo-wrap {
      position: relative;
      z-index: 2;
      width: 86px;
      height: 86px;
      margin: 0 auto -58px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: lira-home-rise 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-ring {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 78px;
      height: 78px;
      border-radius: 999px;
      border: 1.5px solid rgba(15,23,42,0.22);
      transform: translate(-50%, -50%);
      opacity: 0;
      animation: lira-home-ring 2.8s ease-out infinite;
    }
    .lira-home-ring-2 {
      animation-delay: 1.4s;
    }
    .lira-home-orbit {
      position: absolute;
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #14b8a6;
      box-shadow: 0 0 0 5px rgba(20,184,166,0.12);
    }
    .lira-home-orbit-1 {
      top: 10px;
      right: 14px;
      animation: lira-home-float-a 4.8s ease-in-out infinite;
    }
    .lira-home-orbit-2 {
      left: 12px;
      bottom: 15px;
      width: 5px;
      height: 5px;
      background: #64748b;
      box-shadow: 0 0 0 5px rgba(100,116,139,0.1);
      animation: lira-home-float-b 5.4s ease-in-out infinite;
    }
    .lira-home-logo {
      position: relative;
      width: 58px;
      height: 58px;
      border-radius: 19px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow:
        0 18px 36px rgba(15,23,42,0.16),
        0 1px 0 rgba(255,255,255,0.95) inset;
    }
    .lira-home-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .lira-home-title {
      font-size: 19px;
      line-height: 1.2;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 7px;
      letter-spacing: 0;
      animation: lira-home-rise 520ms 80ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-kicker {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 24px;
      padding: 4px 9px;
      margin: 0 0 10px;
      border: 1px solid rgba(203,213,225,0.9);
      border-radius: 999px;
      background: rgba(248,250,252,0.82);
      color: #475569;
      font-size: 10.5px;
      font-weight: 750;
      letter-spacing: 0;
      animation: lira-home-rise 520ms 110ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-subtitle {
      font-size: 13px;
      line-height: 1.55;
      color: #64748b;
      margin: 0 0 16px;
      animation: lira-home-rise 520ms 140ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-primary {
      width: 100%;
      height: 44px;
      border: none;
      border-radius: 14px;
      background: linear-gradient(180deg, color-mix(in srgb, ${primaryColor} 92%, #ffffff 8%) 0%, ${primaryColor} 100%);
      color: #ffffff;
      font-family: inherit;
      font-size: 13px;
      font-weight: 750;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.16) inset,
        0 11px 22px rgba(15,23,42,0.18);
      transition: transform 0.14s ease, box-shadow 0.14s ease, opacity 0.14s ease;
      animation: lira-home-rise 520ms 200ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 24px rgba(15,23,42,0.18);
    }
    .lira-home-primary:active {
      transform: translateY(0);
      opacity: 0.92;
    }
    .lira-home-primary-arrow {
      transition: transform 0.18s ease;
    }
    .lira-home-primary:hover .lira-home-primary-arrow {
      transform: translateX(3px);
    }
    .lira-home-cards {
      display: grid;
      gap: 8px;
      margin-top: 13px;
    }
    .lira-home-card {
      width: 100%;
      text-align: left;
      border: 1px solid rgba(226,232,240,0.95);
      border-radius: 14px;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.9));
      padding: 10px 11px;
      font-family: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: border-color 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease, background 0.14s ease;
      animation: lira-home-rise 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-card:nth-child(1) {
      animation-delay: 250ms;
    }
    .lira-home-card:nth-child(2) {
      animation-delay: 310ms;
    }
    .lira-home-card:nth-child(3) {
      animation-delay: 370ms;
    }
    .lira-home-card:hover {
      border-color: rgba(148,163,184,0.72);
      background: #ffffff;
      transform: translateY(-1px);
      box-shadow: 0 10px 22px rgba(15,23,42,0.08);
    }
    .lira-home-card-icon {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      background: #0f172a;
      color: #ffffff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      font-size: 10.5px;
      font-weight: 850;
      box-shadow: 0 8px 18px rgba(15,23,42,0.14);
    }
    .lira-home-card:nth-child(2) .lira-home-card-icon {
      background: #0f766e;
    }
    .lira-home-card:nth-child(3) .lira-home-card-icon {
      background: #475569;
    }
    .lira-home-card-copy {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .lira-home-card-title {
      color: #0f172a;
      font-size: 13px;
      font-weight: 800;
    }
    .lira-home-card-body {
      color: #64748b;
      font-size: 12px;
      line-height: 1.45;
    }
    @keyframes lira-home-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes lira-home-rise {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes lira-home-glow {
      0%, 100% { opacity: 0.62; transform: translateX(-50%) scale(1); }
      50%      { opacity: 0.9; transform: translateX(-50%) scale(1.08); }
    }
    @keyframes lira-home-ring {
      0%   { opacity: 0.55; transform: translate(-50%, -50%) scale(0.72); }
      70%  { opacity: 0.12; }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.58); }
    }
    @keyframes lira-home-float-a {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50%      { transform: translate3d(-5px, 6px, 0); }
    }
    @keyframes lira-home-float-b {
      0%, 100% { transform: translate3d(0, 0, 0); }
      50%      { transform: translate3d(6px, -5px, 0); }
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
      padding: 10px 13px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
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
      box-shadow: 0 6px 14px rgba(15,23,42,0.12);
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
      box-shadow: none;
    }
    .lira-handoff {
      align-self: stretch;
      display: flex;
      gap: 10px;
      padding: 11px 12px;
      border: 1px solid #dbeafe;
      border-left: 3px solid #2563eb;
      border-radius: 10px;
      background: #eff6ff;
      color: #1e3a8a;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    .lira-handoff-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #dbeafe;
      color: #2563eb;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
    }
    .lira-handoff-icon svg {
      width: 15px;
      height: 15px;
    }
    .lira-handoff-content {
      min-width: 0;
    }
    .lira-handoff-title {
      font-size: 12px;
      font-weight: 750;
      color: #1d4ed8;
      margin-bottom: 2px;
    }
    .lira-handoff-body {
      font-size: 12px;
      line-height: 1.45;
      color: #1e40af;
    }

    /* Rich assistant output */
    .lira-rich-text {
      white-space: normal;
    }
    .lira-rich-text p {
      margin: 0;
    }
    .lira-rich-text p + p,
    .lira-rich-text p + ul,
    .lira-rich-text p + ol,
    .lira-rich-text ul + p,
    .lira-rich-text ol + p,
    .lira-rich-text p + .lira-table-wrap,
    .lira-rich-text .lira-table-wrap + p,
    .lira-rich-text .lira-code-block + p,
    .lira-rich-text p + .lira-code-block {
      margin-top: 9px;
    }
    .lira-rich-text strong {
      font-weight: 700;
      color: #0f172a;
    }
    .lira-rich-text em {
      font-style: italic;
      color: #334155;
    }
    .lira-rich-text a {
      color: ${primaryColor};
      font-weight: 650;
      text-decoration: none;
      border-bottom: 1px solid color-mix(in srgb, ${primaryColor} 36%, transparent);
    }
    .lira-rich-text a:hover {
      border-bottom-color: currentColor;
    }
    .lira-rich-text code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 1px 5px;
      word-break: break-word;
    }
    .lira-rich-text ul,
    .lira-rich-text ol {
      margin: 6px 0 0 18px;
      padding: 0;
    }
    .lira-rich-text li {
      padding-left: 2px;
      margin: 3px 0;
    }
    .lira-md-heading {
      font-size: 13px;
      font-weight: 750;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .lira-table-wrap {
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      background: #ffffff;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
    }
    .lira-md-table {
      width: 100%;
      min-width: 420px;
      border-collapse: collapse;
      font-size: 12px;
      line-height: 1.45;
      color: #334155;
    }
    .lira-md-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 750;
      text-align: left;
      white-space: nowrap;
    }
    .lira-md-table th,
    .lira-md-table td {
      padding: 8px 9px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .lira-md-table td + td,
    .lira-md-table th + th {
      border-left: 1px solid #e2e8f0;
    }
    .lira-md-table tbody tr:last-child td {
      border-bottom: 0;
    }
    .lira-md-table tbody tr:nth-child(even) td {
      background: #f8fafc;
    }
    .lira-code-block {
      margin-top: 9px;
      overflow: hidden;
      border: 1px solid #dbe3ee;
      border-radius: 10px;
      background: #0f172a;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
    }
    .lira-code-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 8px 7px 10px;
      background: #111827;
      border-bottom: 1px solid rgba(148,163,184,0.2);
    }
    .lira-code-lang {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #cbd5e1;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .lira-copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 24px;
      padding: 0 8px;
      border: 1px solid rgba(148,163,184,0.24);
      border-radius: 7px;
      background: rgba(255,255,255,0.06);
      color: #e2e8f0;
      font-family: inherit;
      font-size: 11px;
      font-weight: 650;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
    }
    .lira-copy-btn:hover {
      background: rgba(255,255,255,0.12);
      border-color: rgba(226,232,240,0.36);
    }
    .lira-copy-btn.copied {
      color: #86efac;
      border-color: rgba(134,239,172,0.32);
      background: rgba(22,163,74,0.16);
    }
    .lira-copy-btn svg {
      width: 13px;
      height: 13px;
      flex-shrink: 0;
    }
    .lira-code-block pre {
      margin: 0;
      padding: 12px;
      overflow-x: auto;
      max-width: 100%;
      color: #e5edf6;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
      line-height: 1.55;
      white-space: pre;
    }
    .lira-code-block pre code {
      display: block;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: inherit;
      font-size: inherit;
      word-break: normal;
    }

    /* Typing indicator */
    .lira-typing-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .lira-typing-card {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 11px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    .lira-typing {
      display: flex;
      gap: 4px;
      padding: 0;
      background: transparent;
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
    .lira-working-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      white-space: nowrap;
    }

    @keyframes lira-bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }

    /* ── Guided assist panel ─────────────────────────────────── */

    .lira-assist-panel {
      flex-shrink: 0;
      padding: 9px 14px 8px;
      border-top: 1px solid #edf0f5;
      background: rgba(255,255,255,0.96);
    }
    .lira-insight-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: #f8fafc;
      padding: 10px;
      margin-bottom: 8px;
    }
    .lira-insight-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-size: 12px;
      font-weight: 750;
      color: #0f172a;
      margin-bottom: 7px;
    }
    .lira-insight-badge {
      flex: 0 0 auto;
      padding: 2px 6px;
      border-radius: 999px;
      background: #dcfce7;
      color: #166534;
      font-size: 10px;
      font-weight: 750;
    }
    .lira-insight-list {
      margin: 0 0 9px 18px;
      padding: 0;
      color: #475569;
      font-size: 12px;
      line-height: 1.45;
    }
    .lira-insight-list li {
      margin: 2px 0;
      padding-left: 2px;
    }
    .lira-mini-copy {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 28px;
      padding: 0 9px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      background: #ffffff;
      color: #334155;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .lira-mini-copy:hover {
      border-color: ${primaryColor};
      color: ${primaryColor};
    }
    .lira-mini-copy.copied {
      border-color: #16a34a;
      color: #15803d;
      background: #f0fdf4;
    }
    .lira-mini-copy svg {
      width: 13px;
      height: 13px;
    }
    .lira-plan-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 6px;
    }
    .lira-plan-pill {
      min-width: 0;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: #ffffff;
      padding: 7px 6px;
      text-align: center;
    }
    .lira-plan-pill strong,
    .lira-plan-pill span {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lira-plan-pill strong {
      color: #0f172a;
      font-size: 11px;
    }
    .lira-plan-pill span {
      color: #64748b;
      font-size: 11px;
      margin-top: 2px;
    }
    .lira-quick-replies {
      display: flex;
      gap: 7px;
      overflow-x: auto;
      padding-bottom: 1px;
      scrollbar-width: none;
    }
    .lira-quick-replies::-webkit-scrollbar {
      display: none;
    }
    .lira-quick-reply {
      flex: 0 0 auto;
      max-width: 210px;
      height: 30px;
      padding: 0 10px;
      border: 1px solid #d8dee8;
      border-radius: 999px;
      background: #ffffff;
      color: #334155;
      font-family: inherit;
      font-size: 12px;
      font-weight: 650;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .lira-quick-reply:hover {
      border-color: ${primaryColor};
      color: ${primaryColor};
      background: color-mix(in srgb, ${primaryColor} 7%, #ffffff);
    }

    /* ── Input area ──────────────────────────────────────────── */

    .lira-input-area {
      border-top: 1px solid #e5e7eb;
      padding: 12px 14px;
      display: flex;
      gap: 8px;
      align-items: flex-end;
      flex-shrink: 0;
      background: rgba(255,255,255,0.96);
      box-shadow: 0 -8px 18px rgba(15,23,42,0.03);
    }
    .lira-input-area textarea {
      flex: 1;
      border: 1px solid #d8dee8;
      border-radius: 14px;
      padding: 9px 12px;
      font-size: 14px;
      font-family: inherit;
      resize: none;
      max-height: 100px;
      min-height: 36px;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      background: #f8fafc;
    }
    .lira-input-area textarea:focus {
      border-color: ${primaryColor};
      background: #fff;
      box-shadow: 0 0 0 3px color-mix(in srgb, ${primaryColor} 12%, transparent);
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
      transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 8px 16px color-mix(in srgb, ${primaryColor} 24%, transparent);
    }
    .lira-send-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px color-mix(in srgb, ${primaryColor} 30%, transparent);
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
      padding: 4px 6px 7px;
      font-size: 10px;
      color: #a3a3a3;
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
    /* Spinning conic ring around the avatar while an async action is
       executing — clear visual signal that Lira is actively doing
       something during silent windows. Persists until action_completed
       or action_failed clears the active set. */
    .lira-voice-spinring {
      position: relative;
    }
    .lira-voice-spinring::before {
      content: '';
      position: absolute;
      inset: -6px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, ${primaryColor}, ${primaryColor}00 70%, ${primaryColor});
      -webkit-mask: radial-gradient(circle, transparent 60%, black 62%);
              mask: radial-gradient(circle, transparent 60%, black 62%);
      animation: lira-spin-ring 1.1s linear infinite;
      pointer-events: none;
    }
    @keyframes lira-spin-ring {
      to { transform: rotate(360deg); }
    }
    .lira-voice-working .lira-voice-label {
      color: ${primaryColor};
      font-weight: 700;
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

    /* ── Generative UI: stepper card (onboarding progress) ──────────── */
    .lira-stepper-card {
      align-self: flex-start;
      margin: 8px 0 8px 36px;
      max-width: 88%;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 16px;
      font-family: inherit;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
    }
    .lira-stepper-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 1px solid #f3f4f6;
    }
    .lira-stepper-ring {
      width: 44px; height: 44px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    .lira-stepper-ring-inner {
      width: 36px; height: 36px; border-radius: 50%;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: #111827;
    }
    .lira-stepper-header-text { flex: 1; min-width: 0; }
    .lira-stepper-title {
      font-size: 15px; font-weight: 700; color: #111827; line-height: 1.2;
    }
    .lira-stepper-subtitle {
      margin-top: 3px;
      font-size: 12.5px; color: #6b7280; line-height: 1.4;
    }
    .lira-stepper-badge {
      flex-shrink: 0;
      font-size: 10px; font-weight: 700;
      padding: 3px 8px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .lira-stepper-badge.tone-success { background: #ecfdf5; color: #047857; }
    .lira-stepper-badge.tone-warn { background: #fef3c7; color: #92400e; }
    .lira-stepper-badge.tone-error { background: #fef2f2; color: #b91c1c; }
    .lira-stepper-badge.tone-neutral { background: #f3f4f6; color: #4b5563; }

    .lira-stepper-list {
      list-style: none; padding: 0; margin: 0;
      position: relative;
    }
    /* Vertical connector line between dots */
    .lira-stepper-list::before {
      content: '';
      position: absolute;
      left: 11px; top: 12px; bottom: 12px;
      width: 2px;
      background: #e5e7eb;
      z-index: 0;
    }
    .lira-stepper-step {
      position: relative;
      display: flex; align-items: flex-start; gap: 12px;
      padding: 10px 0;
    }
    .lira-stepper-dot {
      position: relative;
      z-index: 1;
      flex-shrink: 0;
      width: 24px; height: 24px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      background: #f3f4f6;
      color: #9ca3af;
      border: 2px solid #ffffff;
      box-shadow: 0 0 0 1px #e5e7eb;
    }
    .lira-stepper-step.status-done .lira-stepper-dot {
      background: #10b981; color: #ffffff; box-shadow: 0 0 0 1px #10b981;
    }
    .lira-stepper-step.status-active .lira-stepper-dot {
      background: #3730a3; color: #ffffff; box-shadow: 0 0 0 1px #3730a3, 0 0 0 4px rgba(55,48,163,0.18);
    }
    .lira-stepper-content { flex: 1; min-width: 0; padding-top: 1px; }
    .lira-stepper-step-title {
      font-size: 13.5px; font-weight: 600; color: #111827;
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    }
    .lira-stepper-step.status-done .lira-stepper-step-title { color: #4b5563; }
    .lira-stepper-step.status-pending .lira-stepper-step-title { color: #6b7280; }
    .lira-stepper-optional {
      font-size: 9.5px; font-weight: 700;
      padding: 2px 6px; border-radius: 999px;
      background: #f3f4f6; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .lira-stepper-step-desc {
      margin-top: 4px;
      font-size: 12px; line-height: 1.5; color: #6b7280;
    }
    .lira-stepper-step.status-active .lira-stepper-step-desc { color: #4b5563; }
    .lira-stepper-sub {
      list-style: none; margin: 8px 0 0; padding: 0;
      display: flex; flex-direction: column; gap: 3px;
    }
    .lira-stepper-sub-item {
      font-size: 11.5px; color: #9ca3af;
    }
    .lira-stepper-sub-item.done { color: #047857; }
    .lira-stepper-docs {
      display: inline-block;
      margin-top: 8px;
      font-size: 11.5px; font-weight: 600;
      color: var(--lira-primary, #3730a3);
      text-decoration: none;
    }
    .lira-stepper-docs:hover { text-decoration: underline; }

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

    /* ── Action card (async tool progress) ───────────────────── */
    .lira-action {
      align-self: flex-start;
      margin: 6px 0 6px 36px;
      max-width: 78%;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 10px 12px;
      transition: background 200ms ease, border-color 200ms ease;
    }
    .lira-action-pending { border-color: #c7d2fe; background: #eef2ff; }
    .lira-action-success { border-color: #a7f3d0; background: #ecfdf5; }
    .lira-action-failed  { border-color: #fecaca; background: #fef2f2; }
    .lira-action-head { display: flex; align-items: flex-start; gap: 10px; }
    .lira-action-icon {
      flex: 0 0 22px; height: 22px; width: 22px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 50%; font-size: 13px; font-weight: 700;
    }
    .lira-action-pending .lira-action-icon { background: #c7d2fe; color: #3730a3; }
    .lira-action-success .lira-action-icon { background: #10b981; color: white; }
    .lira-action-failed  .lira-action-icon { background: #ef4444; color: white; }
    .lira-action-main { flex: 1 1 auto; min-width: 0; }
    .lira-action-title {
      font-size: 13px; font-weight: 600; color: #111827;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .lira-action-detail {
      font-size: 12px; color: #4b5563; margin-top: 3px;
      line-height: 1.4;
    }
    .lira-action-spinner {
      display: inline-block; width: 12px; height: 12px;
      border: 2px solid #6366f1; border-top-color: transparent;
      border-radius: 50%; animation: lira-spin 0.6s linear infinite;
    }
    @keyframes lira-spin { to { transform: rotate(360deg); } }

    /* ── PIN authorization modal ─────────────────────────────── */
    .lira-pin-backdrop {
      position: absolute; inset: 0;
      background: rgba(15, 23, 42, 0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      animation: lira-fade-in 120ms ease;
    }
    @keyframes lira-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .lira-pin-modal {
      background: white; border-radius: 16px;
      width: 84%; max-width: 320px; padding: 20px;
      box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.3);
      animation: lira-pop-in 160ms ease-out;
    }
    @keyframes lira-pop-in {
      from { transform: scale(0.92); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .lira-pin-title { font-weight: 700; font-size: 15px; color: #111827; margin-bottom: 6px; }
    .lira-pin-body  { font-size: 13px; color: #4b5563; margin-bottom: 8px; }
    .lira-pin-hint  {
      font-size: 12px; color: #4338ca; background: #eef2ff;
      border-radius: 8px; padding: 8px 10px; margin-bottom: 12px;
    }
    .lira-pin-input {
      width: 100%; box-sizing: border-box;
      font-size: 22px; letter-spacing: 0.4em; text-align: center;
      padding: 12px; border: 1.5px solid #d1d5db; border-radius: 10px;
      outline: none; font-family: 'SF Mono', Menlo, monospace;
    }
    .lira-pin-input:focus { border-color: #6366f1; }
    .lira-pin-error {
      font-size: 12px; color: #b91c1c;
      margin-top: 6px; text-align: center;
    }
    .lira-pin-buttons {
      display: flex; gap: 8px; margin-top: 14px;
    }
    .lira-pin-buttons .lira-card-btn { flex: 1 1 0; }
  `
}
