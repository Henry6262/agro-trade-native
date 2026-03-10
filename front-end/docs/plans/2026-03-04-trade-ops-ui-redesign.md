# Trade Operations UI Redesign

**Date:** 2026-03-04
**Scope:** `ActiveOperationsTab.tsx` + `OperationsScreenRefactored.tsx`
**Files touched:** 2 component files, no new files

---

## Problem Statement

Three distinct issues visible in the current Trade Ops screen:

1. **White-ish cards** — `GlassCard tier="medium"` uses `rgba(255,255,255,0.14)` fill stacked on white alpha borders + heavy white drop shadow. On the dark green gradient background these compound into a washed-out, milky appearance.

2. **No product visuals** — Cards show product name as plain text only. No `imageUrl` exists on the `Product` type and no product assets exist locally. The screen is visually flat.

3. **"Send Offers" is not a button** — The `sendOffersBtn` style has 4px/8px padding only, no background, no border. It renders as a plain text link inside a nested card.

---

## Approved Design: Option A — Dark Glass + Category Emoji Circles

### 1. Card Colours (applied via inline styles on GlassCard, not changing the shared token)

| Property | Old | New |
|---|---|---|
| `backgroundColor` | `rgba(255,255,255,0.14)` | `rgba(8,22,12,0.82)` |
| `borderColor` | `rgba(255,255,255,0.18)` | `rgba(74,222,128,0.22)` |
| `shadowColor` | `#001a00` | `#00ff6a` |
| `shadowOpacity` | `0.65` | `0.12` |
| `shadowRadius` | `20` | `12` |

Cards pass these overrides via the `style` prop — existing GlassCard API supports this.

### 2. Product Emoji Circle

Add a horizontal product header row to each operation card above the product name:

```
[ 🌾 ]  Soft Wheat           · #681414
  48×48                        op ref
  circle
```

- Circle: 48×48, `borderRadius: 24`, `backgroundColor: rgba(74,222,128,0.12)`, `borderWidth:1`, `borderColor: rgba(74,222,128,0.25)`
- Emoji: 26pt, centred
- Category → emoji mapping (pure JS, no assets needed):

```ts
const CATEGORY_EMOJI: Record<string, string> = {
  wheat: '🌾', corn: '🌽', maize: '🌽', rice: '🍚',
  soy: '🫘', soybean: '🫘', barley: '🌿', oat: '🌿',
  sunflower: '🌻', cotton: '🪴', potato: '🥔',
  tomato: '🍅', vegetable: '🥬', fruit: '🍎',
  default: '📦',
};
// resolved via: product.category?.toLowerCase() or product.name word-match
```

### 3. "Send Offers" Button

Replace the bare `TouchableOpacity` with a proper pill:

```
[ ✈ Send Offers ]
backgroundColor: rgba(74,222,128,0.18)
borderColor:     rgba(74,222,128,0.50)
borderWidth: 1, borderRadius: 20
paddingHorizontal: 14, paddingVertical: 8
```

Text: `color: COLORS.accentGreen, fontWeight: '700', fontSize: 13`

The `awaitingCard` (nested GlassCard tier="subtle") that wraps this row also needs the dark glass treatment: `rgba(255,255,255,0.04)` fill, same green border.

---

## Implementation Plan

### Task 1 — `ActiveOperationsTab.tsx`

1. Add `getProductEmoji(product)` helper (category + name word-match → emoji string)
2. Update `renderOperation`: add `productHeaderRow` above existing `opTitleRow` — emoji circle left, product name + meta right
3. Update `sendOffersBtn` style: add background, border, borderRadius 20
4. Update `opCard` style override: dark fill + green border + softer shadow
5. Update `awaitingCard` style override: dark fill + green border

### Task 2 — `OperationsScreenRefactored.tsx`

1. Update `listingCard` style: same dark glass overrides (fill, border, shadow)
2. Update the `ctaBtn` (Create Trade Operation) — already decent but align with same pill style

---

## Non-goals

- Do NOT change `GlassCard` token defaults (would affect every screen)
- Do NOT add network image fetching for products
- Do NOT change tab bar, header, or scroll layout
