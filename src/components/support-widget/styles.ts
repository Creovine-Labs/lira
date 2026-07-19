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
    /* The launcher logo is rendered as an img (raster), not an inline SVG, so
       the fill:white rule above does not reach it. Force any image-based logo
       to render white via a tone-mapping filter so it always contrasts with
       the dark launcher, regardless of what colour the source logo file is. */
    .lira-launcher img {
      width: 28px;
      height: 28px;
      object-fit: contain;
      filter: brightness(0) invert(1);
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

    /* ── Mobile / small viewport ──────────────────────────────────
       Two breakpoints:
         ≤640px  → tablet portrait + most phones in landscape. Widget
                   takes near-full width but keeps the floating shape.
         ≤480px  → phone portrait. Widget goes effectively fullscreen
                   so the on-screen keyboard doesn't crush the chat.
       100dvh is the dynamic viewport unit — handles iOS Safari's
       collapsing URL bar correctly where 100vh would overflow. Falls
       back to 100vh on browsers without dvh support.
       safe-area-inset keeps the launcher, header, and input clear of
       the notch + home indicator on notched devices. */

    @media (max-width: 640px) {
      .lira-launcher.bottom-right,
      .lira-launcher.bottom-left {
        bottom: calc(16px + env(safe-area-inset-bottom, 0px));
      }
      .lira-launcher.bottom-right { right: 16px; }
      .lira-launcher.bottom-left { left: 16px; }

      /* When the chat is open on mobile it fills the screen, so the floating
         launcher (rendered as a sibling AFTER the window) would sit on top of
         the composer and cover the Send button. Hide it while open. */
      .lira-chat-window ~ .lira-launcher { display: none !important; }

      .lira-chat-window {
        width: calc(100vw - 16px);
        height: calc(100vh - 96px);
        height: calc(100dvh - 96px);
        bottom: calc(80px + env(safe-area-inset-bottom, 0px));
        right: 8px;
        left: 8px;
        border-radius: 16px;
      }
      .lira-chat-window.lira-fullscreen {
        width: 100%;
        height: 100%;
        min-height: 0;
        inset: auto;
        border-radius: 0;
      }
    }

    @media (max-width: 480px) {
      /* Keep the launcher clear of notches / home indicators. */
      .lira-launcher.bottom-right {
        right: max(16px, env(safe-area-inset-right));
        bottom: max(16px, env(safe-area-inset-bottom));
      }
      .lira-launcher.bottom-left {
        left: max(16px, env(safe-area-inset-left));
        bottom: max(16px, env(safe-area-inset-bottom));
      }

      /* On phones the floating panel becomes a full-screen sheet so the
         on-screen keyboard doesn't squash the conversation. */
      .lira-chat-window {
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        max-height: 100vh;
        max-height: 100dvh;
        inset: 0;
        border-radius: 0;
      }
      .lira-chat-window.bottom-right,
      .lira-chat-window.bottom-left {
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
      }
      /* Respect safe areas for notch + home indicator. */
      .lira-header {
        padding-top: max(14px, env(safe-area-inset-top));
      }
      .lira-input-area {
        padding-bottom: max(12px, env(safe-area-inset-bottom));
      }
    }

    @media (max-width: 480px) {
      .lira-chat-window {
        /* True fullscreen on small phones — no rounded corners, no
           outer margin, no overhang above keyboard. The launcher
           hides while the chat is open (handled in widget.ts). */
        width: 100vw;
        height: 100vh;
        height: 100dvh;
        inset: 0;
        bottom: 0;
        right: 0;
        left: 0;
        top: 0;
        border-radius: 0;
        border-left: 0;
        border-right: 0;
        max-height: none;
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }
      .lira-header {
        /* Notch / status-bar offset so the close button isn't under
           the iOS clock. */
        padding-top: calc(14px + env(safe-area-inset-top, 0px));
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
    .lira-header-sandbox {
      flex: none;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 9.5px;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #92400e;
      background: #fef3c7;
      border: 1px solid #fde68a;
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
    /* Subtle amber variant — surfaces in the chat-list subtitle when the
       last server fetch failed and the visitor is looking at a cached list. */
    .lira-online-dot.lira-online-dot-offline {
      background: #f59e0b;
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
      /* min-height:0 lets this flex child actually scroll instead of growing
         past the window (the classic flexbox overflow trap that produced the
         "two scrollbars" feel). overscroll-behavior:contain stops the scroll
         from chaining to the host page behind the widget on mobile. */
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      -webkit-overflow-scrolling: touch;
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

    /* Editorial hero. No animated rings, no decorative glow, no fake
       "online" pill. Single column of restrained type with the avatar
       sitting on a plain surface — reads as deliberate rather than
       AI-template-y. The .lira-hero-inner wrapper caps the line length
       so the headline + subtitle don't sprawl on wider panels. */
    .lira-hero {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 28px 22px;
      background: #ffffff;
      overflow: hidden;
    }
    .lira-hero-inner {
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      text-align: left;
      gap: 0;
      animation: lira-hero-fade-up 360ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }

    .lira-hero-avatar {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 18px;
    }
    .lira-hero-avatar img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 12px;
      /* Lira logo ships as dark glyph; on the dark-slate tile it'd be
         invisible. Invert to white so it reads on this background — same
         trick we use for the launcher bubble. */
      filter: brightness(0) invert(1);
    }

    .lira-hero-eyebrow {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 8px;
    }

    .lira-hero-title {
      font-size: 26px;
      line-height: 1.15;
      font-weight: 700;
      letter-spacing: -0.024em;
      color: #0f172a;
      margin: 0 0 10px;
    }
    .lira-hero-subtitle {
      font-size: 14px;
      line-height: 1.55;
      color: #475569;
      margin: 0 0 22px;
    }

    .lira-hero-ctas {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lira-hero-cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      color: #ffffff;
      border: 1px solid #0f172a;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease, transform 0.1s ease;
    }
    .lira-hero-cta:hover {
      background: #1e293b;
      border-color: #1e293b;
    }
    .lira-hero-cta:active {
      transform: translateY(1px);
    }
    .lira-hero-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13.5px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: background 0.14s ease, border-color 0.14s ease;
    }
    .lira-hero-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    @keyframes lira-hero-fade-up {
      from { opacity: 0; transform: translateY(6px); }
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

    /* ── Widget home tab ──────────────────────────────────────────────────
       Three templates picked per-org via home_template in support config:
         .lira-home               → 'default' (refreshed clean hero + cards)
         .lira-home.lira-home-minimal → no hero; greeting + list of buttons
         .lira-home.lira-home-branded → large banner image above the content
       The teal/amber radial-glow backdrop + animated rings/orbits/glow
       around the logo were dropped because they read as generic "AI widget"
       chrome. The default now leans editorial — closer to the landing page. */
    .lira-home {
      flex: 1;
      overflow-y: auto;
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      padding: 22px 18px 12px;
      animation: lira-home-fade-in 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    /* Onboarding home variant — used by the Lira admin-dashboard embed
       (autoOpenFirstVisit=true). Replaces the marketing-style hero+cards
       with the setup-guidance hero (avatar + welcome + "Guide me through
       setup" + "Start a conversation"). Pulls back the padding so the hero
       can flex to fill the available height like it does in the chat view. */
    .lira-home.lira-home-onboarding {
      display: flex;
      flex-direction: column;
      padding: 0;
      background: #ffffff;
    }
    .lira-home.lira-home-onboarding .lira-hero {
      flex: 1;
    }
    .lira-home-hero {
      position: relative;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      background: #ffffff;
      padding: 24px 20px 20px;
      text-align: center;
      overflow: hidden;
      box-shadow: 0 1px 2px rgba(15,23,42,0.04);
    }
    /* Branded banner — large image area above the hero content. Optional;
       only renders when home_banner_url is set. */
    .lira-home-banner {
      position: relative;
      width: 100%;
      height: 132px;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 12px;
      background: linear-gradient(135deg, ${primaryColor}, ${primaryColor});
      box-shadow: 0 1px 2px rgba(15,23,42,0.06);
    }
    .lira-home-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    /* Minimal — drop the hero card entirely, tighten everything. */
    .lira-home.lira-home-minimal {
      padding: 18px 16px 10px;
      background: #ffffff;
    }
    .lira-home.lira-home-minimal .lira-home-hero {
      border: none;
      background: transparent;
      padding: 8px 4px 14px;
      text-align: left;
      box-shadow: none;
    }
    .lira-home.lira-home-minimal .lira-home-title {
      font-size: 17px;
      margin-bottom: 4px;
    }
    .lira-home.lira-home-minimal .lira-home-subtitle {
      font-size: 12.5px;
      margin-bottom: 10px;
    }
    /* The animated rings + orbits + glow that used to sit around the logo
       were removed because they read as generic "AI chat widget" chrome.
       The classes are kept as no-op stubs so any legacy rendered markup
       degrades cleanly without breaking layout. */
    .lira-home-glow,
    .lira-home-ring,
    .lira-home-orbit {
      display: none;
    }
    .lira-home-logo-wrap {
      position: relative;
      width: 48px;
      height: 48px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: lira-home-rise 480ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
    }
    .lira-home-logo {
      position: relative;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
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

    /* Conversation list */
    .lira-conversation-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 14px;
      background:
        radial-gradient(ellipse 70% 36% at 50% 0%, rgba(20,184,166,0.08), rgba(20,184,166,0) 72%),
        linear-gradient(180deg, #fbfcff 0%, #ffffff 100%);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .lira-conversation-item-wrap {
      position: relative;
      display: flex;
      align-items: stretch;
      width: 100%;
    }
    .lira-conversation-item {
      flex: 1;
      min-width: 0;
      border: 1px solid rgba(226,232,240,0.95);
      border-radius: 15px;
      background: rgba(255,255,255,0.96);
      padding: 10px;
      padding-right: 38px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.14s ease, box-shadow 0.14s ease, transform 0.14s ease;
    }
    .lira-conversation-item:hover,
    .lira-conversation-item.active {
      border-color: rgba(100,116,139,0.45);
      box-shadow: 0 10px 22px rgba(15,23,42,0.07);
      transform: translateY(-1px);
    }
    /* The hide affordance sits inside the row at the right. Always-on
       prominent: a soft slate icon at full opacity so it's obvious without
       requiring hover (which doesn't exist on touch). Brightens to red on
       hover/focus/active so the destructive intent is clear before tap.
       Clicking it should NOT open the conversation — stopPropagation in JS
       keeps the two tap targets independent. */
    .lira-conversation-hide {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: 1px solid rgba(148,163,184,0.35);
      background: rgba(255,255,255,0.7);
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
    }
    .lira-conversation-hide svg {
      width: 15px;
      height: 15px;
    }
    .lira-conversation-hide:hover,
    .lira-conversation-hide:focus-visible,
    .lira-conversation-hide:active {
      color: #ef4444;
      background: rgba(254,226,226,0.95);
      border-color: rgba(239,68,68,0.55);
      outline: none;
    }
    /* Inline confirm replaces the row's contents in place. Two-button layout
       (Cancel ghost / Remove destructive) sized to match the row height so
       the list doesn't jump. */
    .lira-conversation-item-wrap-confirm {
      border: 1px solid rgba(239,68,68,0.35);
      border-radius: 15px;
      background: rgba(254,242,242,0.65);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .lira-conversation-confirm-copy {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .lira-conversation-confirm-title {
      color: #0f172a;
      font-size: 12.5px;
      font-weight: 800;
    }
    .lira-conversation-confirm-body {
      color: #64748b;
      font-size: 11.5px;
      line-height: 1.3;
    }
    .lira-conversation-confirm-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 0 0 auto;
    }
    .lira-conversation-confirm-cancel,
    .lira-conversation-confirm-remove {
      border-radius: 9px;
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 11px;
      cursor: pointer;
      transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
    }
    .lira-conversation-confirm-cancel {
      border: 1px solid rgba(148,163,184,0.5);
      background: #fff;
      color: #475569;
    }
    .lira-conversation-confirm-cancel:hover {
      border-color: rgba(100,116,139,0.7);
      background: #f8fafc;
    }
    .lira-conversation-confirm-remove {
      border: 1px solid #ef4444;
      background: #ef4444;
      color: #fff;
    }
    .lira-conversation-confirm-remove:hover {
      background: #dc2626;
      border-color: #dc2626;
    }
    .lira-conversation-avatar {
      width: 36px;
      height: 36px;
      border-radius: 13px;
      background: #0f172a;
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      font-size: 13px;
      font-weight: 850;
    }
    .lira-conversation-copy {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .lira-conversation-topline {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }
    .lira-conversation-title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #0f172a;
      font-size: 13px;
      font-weight: 800;
    }
    .lira-conversation-time {
      color: #94a3b8;
      font-size: 10.5px;
      font-weight: 700;
      flex: 0 0 auto;
    }
    .lira-conversation-preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #64748b;
      font-size: 12px;
      line-height: 1.35;
    }
    .lira-conversation-empty {
      margin: auto 0;
      text-align: center;
      padding: 24px 12px;
      color: #64748b;
    }
    .lira-conversation-empty-icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 12px;
      border-radius: 18px;
      background: #0f172a;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 30px rgba(15,23,42,0.16);
    }
    .lira-conversation-empty-icon svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .lira-conversation-empty-title {
      color: #0f172a;
      font-size: 14px;
      font-weight: 850;
      margin-bottom: 4px;
    }
    .lira-conversation-empty-body {
      font-size: 12px;
      line-height: 1.5;
      margin: 0 auto 14px;
      max-width: 260px;
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
      /* 16px is the iOS Safari threshold below which it auto-zooms the
         viewport on focus — visually jarring and traps the visitor inside
         a zoomed-in widget. Keep it at 16 everywhere; we visually shrink
         it back via the lira-touch-input class on desktop where zoom
         doesn't trigger anyway. */
      font-size: 16px;
      font-family: inherit;
      resize: none;
      max-height: 100px;
      min-height: 36px;
      line-height: 1.4;
      outline: none;
      transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      background: #f8fafc;
    }
    @media (min-width: 641px) {
      .lira-input-area textarea {
        /* Desktop: tighten back to the original visual weight; zoom-on-focus
           doesn't apply outside iOS Safari mobile. */
        font-size: 14px;
      }
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

    /* ════ Answer-first support page (layout: support_center) ════
       Premium help-center aesthetic: cream paper, ink type, neutral grays,
       a dark hero banner, topic cards, and an article list. Brand color is
       used for primary actions only. */
    .lira-sc {
      --sc-ink: #0b0d12; --sc-ink-soft: #4b5160; --sc-faint: #8a90a0;
      --sc-cream: #fbfaf6; --sc-paper: #ffffff; --sc-fill: #f1efe9;
      --sc-line: rgba(11,13,18,0.10); --sc-line-soft: rgba(11,13,18,0.06);
      display: flex; flex-direction: column; height: 100%; min-height: 640px;
      background: var(--sc-cream); color: var(--sc-ink);
      font-family: "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .lira-sc *, .lira-sc *::before, .lira-sc *::after { box-sizing: border-box; }
    .lira-sc button { font-family: inherit; cursor: pointer; }

    /* Top bar */
    .lira-sc-topbar {
      flex: none; position: sticky; top: 0; z-index: 5;
      display: flex; align-items: center; justify-content: space-between; gap: 16px;
      padding: 12px 24px; background: rgba(251,250,246,0.85);
      border-bottom: 1px solid var(--sc-line); backdrop-filter: blur(10px);
    }
    .lira-sc-brand { display: flex; align-items: center; gap: 12px; background: none; border: 0; padding: 0; }
    .lira-sc-mark {
      display: grid; place-items: center; width: 38px; height: 38px; flex: none;
      border-radius: 11px; overflow: hidden; color: #fff; font-size: 17px; font-weight: 800;
      background: linear-gradient(150deg, #202527 0%, #0b0d12 100%);
      box-shadow: 0 6px 16px rgba(11,13,18,0.22);
    }
    .lira-sc-mark img { width: 100%; height: 100%; object-fit: cover; }
    .lira-sc-brand-text { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
    .lira-sc-brand-text strong { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
    .lira-sc-brand-text span { font-size: 11.5px; font-weight: 600; color: var(--sc-faint); }
    .lira-sc-acct-chip {
      display: inline-flex; align-items: center; gap: 8px; padding: 4px 13px 4px 4px;
      font-size: 13.5px; font-weight: 700; background: var(--sc-paper);
      border: 1px solid var(--sc-line); border-radius: 999px;
    }
    .lira-sc-acct-ava {
      display: grid; place-items: center; width: 26px; height: 26px;
      font-size: 11px; font-weight: 800; color: #fff; border-radius: 999px;
      background: linear-gradient(150deg, #202527, #0b0d12);
    }
    .lira-sc-sandbox {
      margin-left: 4px; padding: 3px 9px; border-radius: 999px;
      font-size: 10px; font-weight: 800; letter-spacing: 0.06em;
      color: #92400e; background: #fef3c7; border: 1px solid #fde68a;
      text-transform: uppercase;
    }

    .lira-sc-scroll { flex: 1; min-height: 0; overflow-y: auto; }

    /* Hero — dark neutral banner */
    .lira-sc-hero {
      position: relative; overflow: hidden; color: #fff;
      background:
        radial-gradient(120% 120% at 80% -10%, rgba(255,255,255,0.10), transparent 55%),
        linear-gradient(140deg, #23262b 0%, #3a3f47 52%, #565e6b 100%);
    }
    .lira-sc-hero-inner { max-width: 760px; margin: 0 auto; padding: 60px 24px 56px; text-align: center; }
    .lira-sc-hero-title {
      margin: 0 0 24px; font-size: clamp(24px, 3.4vw, 36px);
      font-weight: 800; letter-spacing: -0.02em; line-height: 1.18;
    }
    .lira-sc-search {
      display: flex; align-items: center; gap: 8px;
      background: var(--sc-paper); border-radius: 14px; padding: 7px 7px 7px 16px;
      box-shadow: 0 24px 60px rgba(11,13,18,0.35);
    }
    .lira-sc-search-icon { width: 20px; height: 20px; color: var(--sc-faint); flex: none; }
    .lira-sc-search-input {
      flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
      font-family: inherit; font-size: 15.5px; color: var(--sc-ink); padding: 9px 4px;
    }
    .lira-sc-search-input::placeholder { color: var(--sc-faint); }
    .lira-sc-search-btn {
      flex: none; border: 0; border-radius: 10px; cursor: pointer;
      padding: 11px 22px; font-size: 14px; font-weight: 700; color: #fff; background: ${primaryColor};
    }
    .lira-sc-search-btn:disabled { opacity: 0.55; cursor: default; }
    .lira-sc-popular {
      display: flex; flex-wrap: wrap; align-items: center; justify-content: center;
      gap: 8px; margin-top: 18px;
    }
    .lira-sc-popular-label { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.72); }
    .lira-sc-chip {
      padding: 6px 13px; font-size: 13px; font-weight: 600; color: #fff;
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.22);
      border-radius: 999px; transition: background 0.15s ease, transform 0.15s ease;
    }
    .lira-sc-chip:hover:not(:disabled) { background: rgba(255,255,255,0.22); transform: translateY(-1px); }

    /* Centered content */
    .lira-sc-content { max-width: 1080px; margin: 0 auto; padding: 36px 24px 12px; }
    .lira-sc-crumb { margin-bottom: 22px; }
    .lira-sc-back {
      display: inline-flex; align-items: center; gap: 6px; padding: 8px 13px;
      font-size: 13.5px; font-weight: 700; color: var(--sc-ink);
      background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 9px;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }
    .lira-sc-back svg { width: 16px; height: 16px; }
    .lira-sc-back:hover { border-color: rgba(11,13,18,0.22); transform: translateX(-2px); }

    .lira-sc-layout { display: grid; grid-template-columns: minmax(0,1fr); gap: 28px; align-items: start; }
    .lira-sc-layout.has-aside { grid-template-columns: minmax(0,1fr) 320px; }
    .lira-sc-main { min-width: 0; display: flex; flex-direction: column; gap: 22px; }

    /* Home sections */
    .lira-sc-home { display: flex; flex-direction: column; gap: 44px; }
    .lira-sc-section-head { margin-bottom: 18px; }
    .lira-sc-section-title { margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.02em; }
    .lira-sc-section-sub { margin: 6px 0 0; font-size: 14px; color: var(--sc-ink-soft); }

    .lira-sc-topics { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 16px; }
    .lira-sc-topic {
      display: flex; flex-direction: column; align-items: flex-start; gap: 10px; text-align: left;
      padding: 20px; background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 16px;
      transition: border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
    }
    .lira-sc-topic:hover:not(:disabled) { border-color: rgba(11,13,18,0.22); transform: translateY(-3px); box-shadow: 0 16px 36px rgba(11,13,18,0.10); }
    .lira-sc-topic:disabled { opacity: 0.6; cursor: default; }
    .lira-sc-topic-icon { display: grid; place-items: center; width: 42px; height: 42px; color: var(--sc-ink); background: var(--sc-fill); border-radius: 12px; font-size: 20px; }
    .lira-sc-topic-icon svg { width: 22px; height: 22px; }
    .lira-sc-topic-title { font-size: 15px; font-weight: 800; letter-spacing: -0.01em; }
    .lira-sc-topic-blurb { font-size: 13px; line-height: 1.5; color: var(--sc-ink-soft); }
    .lira-sc-topic-cta { display: inline-flex; align-items: center; gap: 5px; margin-top: 2px; font-size: 13px; font-weight: 700; color: var(--sc-ink); }
    .lira-sc-topic-cta svg { width: 16px; height: 16px; }
    .lira-sc-topic:hover .lira-sc-topic-cta { gap: 8px; }

    .lira-sc-articles { background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 16px; overflow: hidden; }
    .lira-sc-article {
      width: 100%; display: flex; align-items: flex-start; gap: 13px; text-align: left;
      padding: 18px 20px; background: transparent; border: 0;
      border-bottom: 1px solid var(--sc-line-soft); transition: background 0.15s ease;
    }
    .lira-sc-article:last-child { border-bottom: 0; }
    .lira-sc-article:hover:not(:disabled) { background: var(--sc-line-soft); }
    .lira-sc-article:disabled { opacity: 0.6; cursor: default; }
    .lira-sc-article-plus { display: grid; place-items: center; width: 26px; height: 26px; flex: none; margin-top: 1px; color: var(--sc-ink); background: var(--sc-fill); border-radius: 8px; }
    .lira-sc-article-plus svg { width: 15px; height: 15px; }
    .lira-sc-article-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .lira-sc-article-title { font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: var(--sc-ink); }
    .lira-sc-article-snippet { font-size: 13px; color: var(--sc-faint); line-height: 1.45; }
    .lira-sc-article-cat {
      flex: none; align-self: flex-start; padding: 3px 9px; font-size: 10.5px; font-weight: 800;
      text-transform: uppercase; letter-spacing: 0.04em; color: var(--sc-ink-soft);
      background: var(--sc-fill); border-radius: 999px;
    }

    /* Turn blocks */
    .lira-sc-turn { display: flex; flex-direction: column; gap: 12px; }
    .lira-sc-turn + .lira-sc-turn { padding-top: 18px; border-top: 1px solid var(--sc-line-soft); }
    .lira-sc-question {
      align-self: flex-end; max-width: 90%; background: ${primaryColor}; color: #fff;
      font-size: 14px; font-weight: 600; padding: 9px 14px; border-radius: 14px 14px 4px 14px;
    }
    .lira-sc-answer { display: flex; gap: 11px; align-items: flex-start; }
    .lira-sc-answer-ava { width: 30px; height: 30px; flex: none; margin-top: 2px; border-radius: 50%; background: var(--sc-fill); overflow: hidden; display: grid; place-items: center; padding: 5px; }
    .lira-sc-answer-ava img { width: 100%; height: 100%; object-fit: contain; }
    .lira-sc-answer-body { flex: 1; min-width: 0; background: var(--sc-paper); border: 1px solid #e7e5df; border-radius: 4px 16px 16px 16px; padding: 14px 16px; font-size: 14.5px; line-height: 1.6; color: #15171c; }
    .lira-sc-pending { gap: 5px; align-items: center; padding: 16px; }
    .lira-sc-dot { width: 7px; height: 7px; border-radius: 50%; background: #b9bdc6; display: inline-block; animation: lira-sc-bounce 1.1s infinite ease-in-out; }
    .lira-sc-dot:nth-child(2) { animation-delay: 0.15s; }
    .lira-sc-dot:nth-child(3) { animation-delay: 0.3s; }
    @keyframes lira-sc-bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-4px); opacity: 1; } }

    .lira-sc-sources { display: flex; flex-direction: column; gap: 8px; padding-left: 41px; }
    .lira-sc-sources-label { font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sc-faint); }
    .lira-sc-source { display: flex; align-items: center; justify-content: space-between; gap: 10px; text-decoration: none; cursor: pointer; background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 10px; padding: 11px 14px; transition: border-color 0.15s ease, transform 0.15s ease; }
    .lira-sc-source:hover { border-color: rgba(11,13,18,0.24); transform: translateY(-1px); }
    .lira-sc-source-title { font-size: 13.5px; font-weight: 700; color: var(--sc-ink); }
    .lira-sc-source-cat { flex: none; font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sc-faint); background: var(--sc-fill); border-radius: 999px; padding: 3px 9px; }

    .lira-sc-buttons { display: flex; flex-direction: column; gap: 7px; padding-left: 41px; }
    .lira-sc-buttons-label { font-size: 12.5px; font-weight: 700; color: var(--sc-ink-soft); }
    .lira-sc-button-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .lira-sc-controls { display: flex; flex-wrap: wrap; gap: 8px; padding-left: 41px; }
    .lira-sc-pill {
      display: inline-flex; align-items: center; cursor: pointer; padding: 8px 14px;
      font-family: inherit; font-size: 13px; font-weight: 600; border-radius: 999px;
      border: 1px solid var(--sc-line); background: var(--sc-paper); color: #202527;
      transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease, transform 0.1s ease;
    }
    .lira-sc-pill:hover:not(:disabled) { background: var(--sc-ink); color: #fff; border-color: var(--sc-ink); }
    .lira-sc-pill:disabled { opacity: 0.45; cursor: default; }
    .lira-sc-pill-interp { background: var(--sc-fill); border-color: transparent; }
    .lira-sc-pill-ticket { background: ${primaryColor}; color: #fff; border-color: ${primaryColor}; }
    .lira-sc-pill-ticket:hover:not(:disabled) { filter: brightness(1.08); background: ${primaryColor}; }
    .lira-sc-pill-ghost { background: transparent; color: var(--sc-ink-soft); border-style: dashed; }

    .lira-sc-ticket { display: flex; flex-direction: column; gap: 3px; background: var(--sc-paper); border: 1px solid var(--sc-line); border-left: 3px solid ${primaryColor}; border-radius: 12px; padding: 14px 16px; }
    .lira-sc-ticket strong { font-size: 14px; font-weight: 800; }
    .lira-sc-ticket span { font-size: 13px; color: var(--sc-ink-soft); }

    .lira-sc-composer { position: sticky; bottom: 0; display: flex; gap: 8px; padding: 14px 0; background: linear-gradient(to top, var(--sc-cream) 72%, transparent); }
    .lira-sc-composer-input { flex: 1; min-width: 0; font-family: inherit; font-size: 14px; color: var(--sc-ink); background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 12px; padding: 12px 14px; outline: none; }
    .lira-sc-composer-input:focus { border-color: ${primaryColor}; }
    .lira-sc-composer-send { flex: none; border: 0; border-radius: 12px; cursor: pointer; padding: 0 20px; font-size: 14px; font-weight: 700; color: #fff; background: ${primaryColor}; }
    .lira-sc-composer-send:disabled { opacity: 0.5; cursor: default; }

    /* Sidebar */
    .lira-sc-aside { display: flex; flex-direction: column; gap: 18px; }
    .lira-sc-card { background: var(--sc-paper); border: 1px solid var(--sc-line); border-radius: 16px; padding: 18px; box-shadow: 0 8px 24px rgba(11,13,18,0.05); }
    .lira-sc-card-title { margin: 0 0 12px; font-size: 13.5px; font-weight: 800; letter-spacing: -0.01em; }
    .lira-sc-acct-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 13px; }
    .lira-sc-acct-row span { color: var(--sc-faint); }
    .lira-sc-acct-row strong { font-weight: 700; color: var(--sc-ink); text-align: right; }
    .lira-sc-ticket-row { display: flex; flex-direction: column; gap: 3px; padding: 10px 0; border-top: 1px solid var(--sc-line-soft); }
    .lira-sc-ticket-row:first-of-type { border-top: 0; padding-top: 2px; }
    .lira-sc-ticket-no { font-family: ui-monospace, Menlo, monospace; font-size: 11px; font-weight: 700; color: var(--sc-faint); }
    .lira-sc-ticket-subj { font-size: 13.5px; font-weight: 600; color: var(--sc-ink); }
    .lira-sc-ticket-st { font-size: 11.5px; font-weight: 600; color: var(--sc-ink-soft); }

    /* Footer */
    .lira-sc-footer { flex: none; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 16px; font-size: 12px; font-weight: 600; color: var(--sc-faint); border-top: 1px solid var(--sc-line); }
    .lira-sc-footer img { width: 15px; height: 15px; object-fit: contain; }
    .lira-sc-footer strong { color: var(--sc-ink-soft); }

    @media (max-width: 960px) {
      .lira-sc-layout.has-aside { grid-template-columns: minmax(0,1fr); }
      .lira-sc-aside { order: -1; }
      .lira-sc-topics { grid-template-columns: repeat(2, minmax(0,1fr)); }
    }
    @media (max-width: 640px) {
      .lira-sc-content { padding: 26px 16px 8px; }
      .lira-sc-hero-inner { padding: 46px 18px 44px; }
      .lira-sc-sources, .lira-sc-buttons, .lira-sc-controls { padding-left: 0; }
      .lira-sc-topics { grid-template-columns: minmax(0,1fr); }
    }
  `
}
