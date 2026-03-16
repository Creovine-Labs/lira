# Lira Design Guide

> **Reference aesthetic**: AETHER-style SaaS dashboard (web) + Oria-style AI mobile app (iOS).
> Both share a soft violet accent identity, neutral bases, rounded-everything philosophy, and a premium minimal aesthetic — the current 2024–2026 design direction. This guide is the single source of truth for all visual decisions made in the Lira codebase.

---

## 1. Design Philosophy

| Principle          | Direction                                                  |
| ------------------ | ---------------------------------------------------------- |
| **Border radius**  | Generous — `rounded-xl` to `rounded-full` everywhere       |
| **Color**          | Mostly neutral + one soft accent (violet/purple)           |
| **Shadow**         | Near-flat — very soft or none; depth by bg contrast        |
| **Typography**     | Modern geometric sans, tight but readable                  |
| **Spacing**        | Generous whitespace, breathable layouts                    |
| **State feedback** | Subtle — muted for inactive, solid dark for active         |
| **Brand accent**   | Violet/purple is the shared accent across all surfaces     |
| **Interaction**    | Arrow-circles, pill buttons, toggles — tactile but minimal |

The overarching feel is **neo-minimal SaaS**: clean, professional, data-dense yet approachable. Think Notion × Linear × Vercel — soft and modern, never sterile.

---

## 2. Color System

### 2.1 Core Palette (Tailwind tokens → CSS variables)

| Token                    | Tailwind          | Hex                 | Usage                                        |
| ------------------------ | ----------------- | ------------------- | -------------------------------------------- |
| `--color-bg-outer`       | `bg-[#EDE9FE]`    | `#C8C6F7 → #E8E4FA` | Page/app background (soft lavender gradient) |
| `--color-surface`        | `bg-white`        | `#FFFFFF`           | Cards, panels, sidebar                       |
| `--color-brand`          | `bg-violet-600`   | `#7C3AED`           | Primary brand, active states, CTAs           |
| `--color-brand-light`    | `bg-violet-400`   | `#A78BFA`           | Hover tints, secondary accents               |
| `--color-nav-active`     | `bg-[#1A1A1A]`    | `#1A1A1A`           | Active nav pill (dark charcoal)              |
| `--color-text-primary`   | `text-gray-900`   | `#111827`           | Headings, primary labels                     |
| `--color-text-secondary` | `text-gray-500`   | `#6B7280`           | Muted labels, table headers                  |
| `--color-border`         | `border-gray-100` | `#F3F4F6`           | Almost invisible dividers                    |
| `--color-success`        | `text-green-500`  | `#22C55E`           | Status: active / success                     |
| `--color-warning`        | `text-amber-500`  | `#F59E0B`           | Status: pending / warning                    |
| `--color-danger`         | `text-red-500`    | `#EF4444`           | Status: failed / error                       |

### 2.2 Stat Card Backgrounds

These are the soft pastel backgrounds used on dashboard stat/metric cards. Never use white here — the colored bg carries the visual weight.

| Card            | Tailwind        | Hex       |
| --------------- | --------------- | --------- |
| Card 1 (peach)  | `bg-orange-100` | `#FDEAC8` |
| Card 2 (yellow) | `bg-yellow-100` | `#FEF3C7` |
| Card 3 (violet) | `bg-violet-100` | `#EDE9FE` |
| Card 4 (teal)   | `bg-teal-100`   | `#CCFBF1` |

Rotate through these for dashboard metric cards. Do not use gray — every stat card should carry warmth.

### 2.3 Dark CTA Card

Used for upgrade prompts, Pro callouts, or any high-priority CTA block.

```css
background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);
```

Tailwind equivalent: `bg-gradient-to-br from-indigo-950 to-indigo-800`

### 2.4 Input / Form Field Background

| Context              | Fill                      | Border                  |
| -------------------- | ------------------------- | ----------------------- |
| Web inputs           | `bg-gray-100` (`#F3F4F6`) | None — bg contrast only |
| Mobile / pill inputs | `bg-[#EBEBEB]`            | None                    |

No visible border on inputs. Color contrast carries the UI.

---

## 3. Typography

### 3.1 Font Stack

**Primary**: `Inter`, `Plus Jakarta Sans`, or `SF Pro Display` (iOS fallback)

```css
font-family:
  'Inter',
  'Plus Jakarta Sans',
  system-ui,
  -apple-system,
  sans-serif;
```

Use `Inter` as the primary web font. It is already installed via Tailwind/system.

### 3.2 Type Scale

| Role                            | Size                          | Weight                | Tracking                  | Color                             |
| ------------------------------- | ----------------------------- | --------------------- | ------------------------- | --------------------------------- |
| Page title (e.g. `Hello, Moni`) | `text-3xl` / 28–32px          | `font-bold` (700)     | `tracking-tight`          | `text-gray-900`                   |
| Section header                  | `text-sm` / 14px              | `font-semibold` (600) | normal                    | `text-gray-900`                   |
| Nav label                       | `text-[13px]`                 | `font-medium` (500)   | normal                    | `text-gray-500` / white on active |
| Stat number                     | `text-2xl` / 24–28px          | `font-bold` (700)     | `tracking-tight`          | `text-gray-900`                   |
| Table header                    | `text-xs` / 12px              | `font-medium` (500)   | `tracking-wide uppercase` | `text-gray-400`                   |
| Body / label                    | `text-xs`–`text-sm` / 12–13px | `font-normal` (400)   | normal                    | `text-gray-500`                   |
| Button text                     | `text-sm` / 15–16px           | `font-semibold` (600) | normal                    | `text-white`                      |
| Input placeholder               | `text-sm` / 14px              | `font-normal` (400)   | normal                    | `text-gray-400`                   |
| Badge / pill label              | `text-xs` / 11–12px           | `font-semibold` (600) | `tracking-wide`           | varies                            |

---

## 4. Spacing & Layout

### 4.1 Page Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (180px fixed)  │  Main content area        │
│                         │  px-6 py-6                │
│  Logo top-left          │  ┌─ Topbar ─────────────┐ │
│  Nav groups             │  │  Search + Bell + Ava  │ │
│  uppercase section      │  └───────────────────────┘ │
│  labels (muted xs)      │  ┌─ Content grid ───────┐ │
│                         │  │  gap-4                │ │
│                         │  └───────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Sidebar: `w-[180px]` fixed, `bg-white`, `border-r border-gray-100`
- Content area: `flex-1 min-w-0`, `px-6 py-6`
- Dashboard grid: `grid grid-cols-12 gap-4`

### 4.2 Card Padding & Radius

| Component                  | Padding         | Border Radius  |
| -------------------------- | --------------- | -------------- |
| Stat card                  | `p-4` / `p-5`   | `rounded-2xl`  |
| Content card / panel       | `p-5` / `p-6`   | `rounded-xl`   |
| Dark CTA card              | `p-6`           | `rounded-2xl`  |
| Modal / sheet              | `p-6`           | `rounded-2xl`  |
| Input (pill)               | `px-5 py-3.5`   | `rounded-full` |
| Button (primary)           | `px-6 py-3`     | `rounded-full` |
| Button (secondary/outline) | `px-5 py-2.5`   | `rounded-xl`   |
| Nav item (active)          | `px-3 py-2`     | `rounded-xl`   |
| Badge / tag                | `px-2.5 py-0.5` | `rounded-full` |

### 4.3 Gap Scale

| Context                | Gap                 |
| ---------------------- | ------------------- |
| Between stat cards     | `gap-3` / `gap-4`   |
| Between form inputs    | `gap-2.5` / `gap-3` |
| Between section blocks | `gap-6` / `gap-8`   |
| Table row padding      | `py-3`              |

---

## 5. Component Patterns

### 5.1 Stat / Metric Card

```tsx
// Structure
<div className="rounded-2xl p-5 bg-orange-100 flex flex-col gap-3">
  <div className="flex items-center justify-between">
    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
      Total Meetings
    </span>
    <button className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center">
      <ArrowUpRight className="w-3.5 h-3.5" />
    </button>
  </div>
  <p className="text-2xl font-bold text-gray-900 tracking-tight">142</p>
  <p className="text-xs text-gray-500">+12% from last month</p>
</div>
```

Rules:

- Always use a pastel bg from §2.2 — never white or gray
- Arrow-circle button: `w-7 h-7 bg-gray-900 text-white rounded-full` — top-right corner
- Stat number: always `text-2xl font-bold`
- Label: always `text-xs uppercase tracking-wide text-gray-500`

### 5.2 Sidebar Navigation

```tsx
// Section label
<p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 px-3 mb-1">
  Workspace
</p>

// Nav item (inactive)
<a className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
  <LayoutDashboard className="w-4 h-4" />
  Dashboard
</a>

// Nav item (active)
<a className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium bg-gray-900 text-white">
  <LayoutDashboard className="w-4 h-4" />
  Dashboard
</a>
```

Rules:

- Active state: `bg-[#1A1A1A] text-white` — do not use brand violet for active nav; use near-black
- Icons: Lucide, `w-4 h-4`, same color as text
- Section labels: uppercase, `text-[10px]`, `tracking-widest`, muted

### 5.3 Top Bar

```tsx
<header className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
  {/* Search */}
  <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 w-64">
    <Search className="w-4 h-4 text-gray-400" />
    <input
      placeholder="Search..."
      className="bg-transparent text-sm outline-none flex-1 text-gray-600"
    />
    <kbd className="text-[10px] text-gray-400 font-mono">⌘F</kbd>
  </div>
  {/* Actions */}
  <div className="flex items-center gap-3">
    <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
      <Bell className="w-4 h-4 text-gray-500" />
    </button>
    <Avatar className="w-8 h-8 rounded-full" />
  </div>
</header>
```

### 5.4 Data Table

```tsx
<table className="w-full text-sm">
  <thead>
    <tr>
      <th className="text-left text-xs font-medium uppercase tracking-wide text-gray-400 py-2">
        Name
      </th>
      {/* ... */}
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="py-3">
        <span className="flex items-center gap-2">
          {/* Status dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Meeting Name
        </span>
      </td>
    </tr>
  </tbody>
</table>
```

Rules:

- `thead` labels: `text-xs uppercase tracking-wide text-gray-400`
- Row dividers: `divide-y divide-gray-100` (not full borders)
- Status dots: `w-1.5 h-1.5 rounded-full` + color from §2.1 status tokens
- No zebra striping — rows use `hover:bg-gray-50` only

### 5.5 Input Field (Pill Style)

```tsx
<div className="flex items-center gap-3 bg-[#EBEBEB] rounded-full px-5 py-3.5">
  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
  <input
    type="email"
    placeholder="Email address"
    className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
  />
</div>
```

Rules:

- No border — bg contrast is sufficient
- Left icon: always `w-4 h-4 text-gray-400`
- Shape: `rounded-full` (full pill — not `rounded-xl`)
- Height: `py-3.5` = ~48–52px total

### 5.6 Primary Button (Full-width CTA)

```tsx
<button className="w-full rounded-full bg-gray-900 text-white text-[15px] font-semibold py-3.5 hover:bg-gray-800 active:scale-[0.98] transition-all">
  Continue
</button>
```

### 5.7 Gradient CTA Badge / Card

```tsx
// Marketing badge (e.g., "25+ Screens")
<span className="rounded-full px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-pink-400 to-violet-500">
  Pro — 25+ Screens
</span>

// Dark CTA card (Upgrade prompt)
<div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-950 to-indigo-800 text-white">
  <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">PRO</span>
  <h3 className="text-lg font-bold mt-2">Unlock everything</h3>
  <p className="text-sm text-indigo-200 mt-1">Unlimited meetings, AI transcripts, and more.</p>
  <button className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-white">
    Upgrade now <ArrowRight className="w-4 h-4" />
  </button>
</div>
```

### 5.8 Toggle / Switch

Use iOS-style pill toggles for settings:

```tsx
// use shadcn/ui Switch — override styles:
<Switch className="data-[state=checked]:bg-violet-600" />
```

Active color: `bg-violet-600` (`#7C3AED`). Inactive: `bg-gray-200`.

### 5.9 Badge / Status Tag

```tsx
// Status badge
<span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  Active
</span>
```

| Status            | bg              | text              |
| ----------------- | --------------- | ----------------- |
| Active / Success  | `bg-green-100`  | `text-green-700`  |
| Pending / Warning | `bg-amber-100`  | `text-amber-700`  |
| Failed / Error    | `bg-red-100`    | `text-red-700`    |
| Neutral / Draft   | `bg-gray-100`   | `text-gray-600`   |
| Brand / Info      | `bg-violet-100` | `text-violet-700` |

---

## 6. Iconography

- **Library**: [Lucide React](https://lucide.dev) (already installed)
- **Default size**: `w-4 h-4` (16px) — do not deviate without reason
- **Stroke width**: default (`1.5`) — never use `strokeWidth={1}` (too thin) or `2` (too heavy)
- **Color**: always inherit from parent text color — avoid hardcoding icon colors
- **Placement**: icon + text gap is always `gap-2` or `gap-2.5`
- **Arrow-circle action button**: `w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center` with `<ArrowUpRight className="w-3.5 h-3.5" />`

---

## 7. Elevation & Shadow

The design is **near-flat**. Depth is created exclusively by background color contrast, not drop shadows.

```css
/* The only allowed shadow — applied to cards on white bg */
box-shadow:
  0 1px 3px rgba(0, 0, 0, 0.06),
  0 1px 2px rgba(0, 0, 0, 0.04);
```

Tailwind: `shadow-sm`

Rules:

- **Do not use** `shadow-md`, `shadow-lg`, or `shadow-xl` on cards
- Modals / drawers may use `shadow-lg` on the overlay container only
- Inputs: no shadow at all — never
- Hover states on interactive cards: transition bg, do not add shadow on hover

---

## 8. Motion & Transitions

Keep transitions minimal and purposeful.

| Property               | Duration | Easing        |
| ---------------------- | -------- | ------------- |
| Color / bg transitions | `150ms`  | `ease-out`    |
| Scale (button press)   | `100ms`  | `ease-in-out` |
| Modal open             | `200ms`  | `ease-out`    |
| Sidebar expand         | `250ms`  | `ease-in-out` |

Tailwind utilities:

- `transition-colors duration-150`
- `active:scale-[0.98] transition-transform duration-100`
- Never use `transition-all` where a specific property suffices

---

## 9. Page Background

The outer app background should be a soft lavender gradient — not flat white or gray.

```css
/* globals.css or App.css */
body {
  background: linear-gradient(135deg, #e8e4fa 0%, #ede9fe 50%, #f3f0ff 100%);
  min-height: 100vh;
}
```

Tailwind (in a wrapper): `bg-gradient-to-br from-violet-100 via-purple-50 to-indigo-50`

This gradient sits **behind** the sidebar and main content surface, which are both `bg-white`.

---

## 10. Responsive / Mobile Patterns

When building mobile views, switch from the SaaS dashboard pattern to the **pill/sheet pattern**:

| Desktop                   | Mobile                              |
| ------------------------- | ----------------------------------- |
| Fixed sidebar `w-[180px]` | Bottom nav or hamburger drawer      |
| Wide card grid            | Single-column stack                 |
| Table                     | Card list (each row becomes a card) |
| `rounded-xl` cards        | `rounded-3xl` cards                 |
| `px-6` padding            | `px-5` padding                      |
| Input `rounded-xl`        | Input `rounded-full`                |
| Multi-column form         | Full-width stacked form             |

On mobile, increase all touch targets to `min-h-[48px]` and use `rounded-full` for all interactive elements.

---

## 11. Do / Don't

### Do

- Use the pastel card backgrounds (§2.2) for stat/metric cards
- Use `rounded-full` for inputs, pill buttons, and avatar-adjacent elements
- Use `rounded-2xl` / `rounded-xl` for content cards and panels
- Keep table rows clean: `divide-y divide-gray-100`, no background stripes
- Use `bg-gray-900 text-white rounded-full` for the primary action button
- Use `text-xs uppercase tracking-widest text-gray-400` for all section group labels
- Use Lucide icons at `w-4 h-4` with the same color as surrounding text

### Don't

- Don't use `shadow-lg` on content cards — only `shadow-sm` or none
- Don't use brand violet (`#7C3AED`) for active nav — use near-black `#1A1A1A`
- Don't use borders on inputs — bg contrast is enough
- Don't use white stat cards — every metric tile must have a colored bg
- Don't use zebra striping on tables
- Don't add more than 2 font weights in a single card
- Don't use `rounded-none` anywhere in the UI

---

## 12. Tailwind Config Additions

Add these to `tailwind.config.js` to codify the design tokens:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        surface: '#FFFFFF',
        'bg-app': '#EDE9FE',
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      },
    },
  },
}
```

---

## 13. Component Checklist (before shipping any new UI)

- [ ] Card uses correct border radius (`rounded-xl` or `rounded-2xl`)
- [ ] Stat/metric card has a pastel bg (not white)
- [ ] Inputs have no visible border — bg fill only
- [ ] Icons are Lucide, `w-4 h-4`, matching text color
- [ ] Active nav item is dark charcoal pill, not violet
- [ ] Shadows are `shadow-sm` or none
- [ ] Body background is the lavender gradient, not flat white
- [ ] Status badges use the correct color pair from §5.9
- [ ] Primary CTAs are `rounded-full bg-gray-900 text-white`
- [ ] Section group labels are `uppercase tracking-widest text-xs text-gray-400`
