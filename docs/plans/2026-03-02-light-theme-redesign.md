# Light Theme Redesign — AgroTrade Mobile App

**Date:** 2026-03-02
**Status:** Approved
**Scope:** Full UI re-theme from dark (black/neutral) to light (white + green highlights)

---

## Goal

Replace the current dark UI (black backgrounds, neutral-800/900 surfaces) with a clean white base and green accent system. Remove the dashboard switcher from the top navbar. Keep all functionality identical — this is purely visual.

---

## Color System

| Role | Old | New |
|---|---|---|
| App background | `#000000` | `#FFFFFF` |
| Card surface | `bg-neutral-800` (#1F2937) | `bg-white` |
| Secondary surface | `bg-neutral-900` (#111827) | `bg-gray-50` (#F9FAFB) |
| Borders | `border-neutral-700` (#374151) | `border-gray-200` (#E5E7EB) |
| Body text | `text-neutral-300` (#D1D5DB) | `text-gray-800` (#1F2937) |
| Muted text | `text-neutral-400/500` | `text-gray-500` (#6B7280) |
| Brand green (active) | `#10B981` | `#16A34A` (green-600) |
| Green wash bg | — | `#F0FDF4` (green-50) |
| Status bar | `dark` (light icons) | `light` (dark icons) |

---

## Tailwind Config Changes (Option A — bulk)

In `tailwind.config.js`, remap `neutral` shades so existing `bg-neutral-800`, `bg-neutral-900` classes resolve to white/light values automatically. This eliminates ~80% of dark classes without touching individual files.

```js
// tailwind.config.js — neutral remap
neutral: {
  50:  '#F9FAFB',
  100: '#F3F4F6',
  200: '#E5E7EB',
  300: '#D1D5DB',
  400: '#9CA3AF',
  500: '#6B7280',
  600: '#4B5563',
  700: '#374151',
  800: '#FFFFFF',  // was #1F2937 — now white
  900: '#F9FAFB',  // was #111827 — now gray-50
}
```

---

## Component Changes (Option B — targeted)

### DashboardMainScreen.tsx
- `Container backgroundColor="#000000"` → `"#FFFFFF"`
- `StatusBar barStyle="light-content"` → `"dark-content"`, `backgroundColor="#FFFFFF"`
- Top toolbar: `bg-neutral-800 border-neutral-700` → `bg-white border-b border-gray-200`
- **Remove entire dashboard switcher block** (`__DEV__ && showDashboardSwitcher` and the button that triggers it)
- Remove bell icon (`<Bell>`) and refresh icon (`<RefreshCw>`) from toolbar right side
- Keep only: wordmark left, avatar right
- Wordmark: `"AGRI TRADE"` → `"AGRO TRADE"` in `text-green-600 font-bold text-xl`

### BottomNavigation.tsx
- `bg-neutral-900 border-neutral-700` → `bg-white border-t border-gray-200`
- Inactive icon color: `#6B7280` → `#9CA3AF` (gray-400)
- Active icon color: `#10B981` → `#16A34A` (green-600)
- Active tab: add `bg-green-50 rounded-xl` pill behind icon+label
- Active label: `text-green-500` → `text-green-600`
- Inactive label: `text-gray-500`

### global.css
- `.progress-sidebar` background: `#1f2937` → `#16A34A` (green onboarding sidebar)
- `.progress-sidebar` border: `#4b5563` → `#15803D` (green-700)

### Container component
- Default `backgroundColor` prop → `#FFFFFF`

### ProfileDrawer
- Background surfaces: `bg-neutral-800/900` → `bg-white / bg-gray-50`
- Text: `text-white/neutral-*` → `text-gray-800/500`
- Borders: `border-neutral-700` → `border-gray-200`

---

## Dashboard Section Files (~49 files)

After the Tailwind remap, most section files will automatically inherit light colors. Manually fix any remaining hardcoded hex values:
- `backgroundColor: '#1F2937'` → `'#FFFFFF'`
- `backgroundColor: '#111827'` → `'#F9FAFB'`
- `color: '#D1D5DB'` → `'#1F2937'`
- `color: '#9CA3AF'` → `'#6B7280'`

---

## What We Are NOT Changing

- Google Maps components (own dark map style)
- Chart/graph color definitions
- All navigation logic, role routing, API calls
- Green button colors (already on-brand)
- The `theme.ts` green palette (already correct)

---

## Files to Touch (in order)

1. `front-end/tailwind.config.js` — neutral remap
2. `front-end/src/styles/global.css` — sidebar green, status bar
3. `front-end/src/features/dashboard/screens/DashboardMainScreen.tsx` — navbar cleanup
4. `front-end/src/features/dashboard/components/BottomNavigation.tsx` — light nav
5. `front-end/src/shared/components/Container.tsx` — default bg
6. `front-end/src/features/dashboard/components/ProfileDrawer.tsx` — light drawer
7. Dashboard section files — mop up remaining hardcoded dark hex values
