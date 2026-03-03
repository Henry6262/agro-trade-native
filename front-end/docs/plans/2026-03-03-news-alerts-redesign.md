# Market Intelligence: News + Alerts Redesign

**Date:** 2026-03-03
**Status:** Approved
**Scope:** Live News section + Price Alerts section of IntelligenceScreen

---

## Context

The top price ticker is working and looks good — keep it untouched.
Two sections need fixing:
- **Live News** — empty due to Guardian `test` key limitations, no images
- **Price Alerts** — functional but UI is sparse and button layout is poor

---

## Live News — Option B: Uniform Image Cards

### API
Switch from Guardian Open Platform → **GNews API**
- Endpoint: `https://gnews.io/v4/search`
- Key: stored in `EXPO_PUBLIC_GNEWS_KEY`
- Query: `wheat OR corn OR cotton OR sugar OR coffee OR agriculture`
- Params: `lang=en`, `max=10`, `apikey=KEY`
- Returns: `image` (URL), `title`, `description`, `publishedAt`, `source.name`, `url`

### NewsArticle interface change
Add `imageUrl: string` field (empty string if not present).

### Card layout
Each article gets the same treatment — no hero/compact split:

```
┌──────────────────────────────────┐
│ ████████████████████████████████ │
│ ████████  IMAGE  ████████████████│  ← RN Image, height 140, resizeMode=cover
│ ████████████████████████████████ │
│ ░░░░ gradient overlay (bottom)░░ │  ← LinearGradient transparent→black/40%
├──────────────────────────────────┤  ← inside GlassCard tier=subtle
│  [SOURCE]  •  2h ago             │  ← GlassBadge + Text right-aligned
│  Wheat futures surge on drought  │  ← title, 2 lines, bold, textPrimary
│  conditions in eastern Europe    │
│  Prices up 12% this week amid    │  ← description, 2 lines, textMuted
│  worsening supply constraints    │
└──────────────────────────────────┘
```

Image sits flush at top of GlassCard (noPadding on image container, padding only below).
If `imageUrl` is empty, show a solid `rgba(255,255,255,0.05)` placeholder with a crop icon.

### States
- **Loading:** 3 skeleton cards — GlassCard with animated opacity pulse (0.3→0.7)
- **Empty/Error:** Single GlassCard, centered text "No agricultural news — pull to refresh"

---

## Price Alerts — Option B: Compact Pill Rows

### Header
Section header row: `🔔 PRICE ALERTS` label left + `[+ ADD]` GlassButton ghost/sm right.
Remove the full-width "+ Set new alert" button at the bottom.

### Alert row
Each alert is a single GlassCard tier=subtle row:

```
┌──────────────────────────────────────────┐
│ 🌾 Wheat  [▲ ABOVE]  $200.00  [● LIVE]  ✕│
└──────────────────────────────────────────┘
```

- Commodity emoji + name: left, bold, textPrimary
- Condition chip: `[▲ ABOVE]` green tint | `[▼ BELOW]` red tint — small rounded badge
- Threshold: `$200.00` textSecondary
- Status chip: `[● LIVE]` white/muted | `[✓ HIT]` gold — GlassBadge variant
- `✕` remove: right edge, `COLORS.danger`, hitSlop 8

Triggered alerts: gold status chip + row gets subtle gold border `rgba(252,211,77,0.25)`.

### Empty state
```
┌──────────────────────────────────┐
│           🔔                     │
│     No price alerts set          │
│   Tap + to monitor a commodity   │
└──────────────────────────────────┘
```
Centered, icon 28px, textMuted copy.

### Add form
Keep existing add form logic unchanged (symbol picker, above/below chips, threshold input).
Opens inline below the header when `[+ ADD]` is tapped. Cancel collapses it.

---

## Files Changed

| File | Change |
|---|---|
| `src/services/newsService.ts` | Switch to GNews, add `imageUrl` to `NewsArticle` |
| `src/features/dashboard/screens/shared/IntelligenceScreen.tsx` | Redesign `NewsSection` + `AlertsSection` |
| `.env` | Add `EXPO_PUBLIC_GNEWS_KEY=240e4efe108e329b7c40a9620bd04192` |
| `.env.example` | Add `EXPO_PUBLIC_GNEWS_KEY=your_gnews_key_here` |

Price ticker, store, and marketDataService untouched.

---

## Out of Scope
- Price ticker (working, looks good)
- market.store.ts (no changes needed)
- marketDataService.ts (separate concern)
- Alpha Vantage slow loading (separate task)
