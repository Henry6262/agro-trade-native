# UI Polish — Minimal Branding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace fragmented multi-colour UI (blue/gold/red/green badges, giant 3-card stats row) with a minimal green-and-white brand language across the Orders (CommandCenter) screen.

**Architecture:** Two design-system files changed globally (GlassBadge pill shape + muted palette), one screen file (CommandCenterScreen) rebuilt in three areas: compact stats strip, larger section headers, simplified event badge colours. No new components — surgery on existing ones only.

**Tech Stack:** React Native, StyleSheet, lucide-react-native icons, design-system tokens (COLORS, GLASS)

---

### Task 1: GlassBadge — pill shape + muted-first colour palette

**Files:**
- Modify: `src/design-system/GlassBadge.tsx`

Changes:
1. `borderRadius: 8` → `borderRadius: 20` (full pill on the `badge` style)
2. Tone down every variant so only green pops; everything else is quiet white glass:
   - `success` → keep green (brand accent)
   - `warning` → change to muted white glass (same as `muted`)
   - `danger` → keep red but lower opacity bg/border
   - `info` → change to muted white glass (remove blue entirely from badges)
   - `gold` → change to muted white glass (remove gold from badges)
   - `muted` → unchanged (already quiet)

New `VARIANT_STYLES` to use:

```ts
const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: 'rgba(74,222,128,0.15)', text: '#4ADE80', border: 'rgba(74,222,128,0.3)' },
  warning: { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.12)' },
  danger:  { bg: 'rgba(248,113,113,0.12)', text: '#F87171', border: 'rgba(248,113,113,0.25)' },
  info:    { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.12)' },
  muted:   { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.45)', border: 'rgba(255,255,255,0.1)' },
  gold:    { bg: 'rgba(255,255,255,0.07)', text: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.12)' },
};
```

And in `styles.badge`:
```ts
badge: {
  alignSelf: 'flex-start',
  borderRadius: 20,   // was 8
  borderWidth: 1,
},
```

**Verify:** Run `npm run lint` — 0 errors.

**Commit:**
```bash
git add src/design-system/GlassBadge.tsx
git commit -m "design: pill-shaped badges, muted-first colour palette (green only pops)"
```

---

### Task 2: CommandCenterScreen — compact stats strip

**Files:**
- Modify: `src/features/dashboard/screens/admin/CommandCenterScreen.tsx`

Replace the entire `statsRow` block (the 3 `<StatCard>` components) with a single slim `GlassCard` containing three inline stat cells.

Remove the `StatCard` import — it's no longer used here.

New JSX to replace `<View style={styles.statsRow}>…</View>`:

```tsx
{/* Compact stats strip */}
<GlassCard tier="subtle" style={styles.statsStrip} animate={false}>
  <View style={styles.statsInner}>
    <View style={styles.statCell}>
      <Text style={styles.statValue}>51</Text>
      <Text style={styles.statLabel}>SELL</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statCell}>
      <Text style={styles.statValue}>68</Text>
      <Text style={styles.statLabel}>BUY</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statCell}>
      <Text style={[styles.statValue, styles.statValueGreen]}>27</Text>
      <Text style={styles.statLabel}>MATCHED</Text>
    </View>
  </View>
</GlassCard>
```

New style entries (add to `StyleSheet.create`, keeping alphabetical order):

```ts
statCell: {
  alignItems: 'center',
  flex: 1,
  paddingVertical: 10,
},
statDivider: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  height: '60%',
  width: 1,
},
statLabel: {
  color: COLORS.textMuted,
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 1.2,
  marginTop: 2,
  textTransform: 'uppercase',
},
statsInner: {
  alignItems: 'center',
  flexDirection: 'row',
},
statsStrip: {
  paddingVertical: 0,
},
statValue: {
  color: COLORS.textPrimary,
  fontFamily: 'monospace',
  fontSize: 22,
  fontWeight: '800',
},
statValueGreen: {
  color: COLORS.accentGreen,
},
```

Also **remove** `statsRow` and `statCard` style entries (no longer used).

**Verify:** Run `npm run lint` — 0 errors.

**Commit:**
```bash
git add src/features/dashboard/screens/admin/CommandCenterScreen.tsx
git commit -m "design: replace 3-card stats row with compact inline strip"
```

---

### Task 3: CommandCenterScreen — larger section headers + simplified event colours

**Files:**
- Modify: `src/features/dashboard/screens/admin/CommandCenterScreen.tsx`

**3a. Section header icons and title:**

In `sectionHeader` JSX, every `<Package>`, `<Bell>`, `<TrendingUp>` icon:
- `size={14}` → `size={16}`

In `styles.sectionTitle`:
- `fontSize: 11` → `fontSize: 13`
- `color: COLORS.textSecondary` → `color: COLORS.textPrimary` (brighter label)

**3b. Simplify `getEventBadgeVariant`:**

```ts
const getEventBadgeVariant = (
  type: string
): 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'gold' => {
  switch (type) {
    case 'sale':
    case 'delivery':
      return 'success';     // green only for completed positive
    default:
      return 'muted';       // everything else: quiet white glass
  }
};
```

**3c. Trader name colour — remove green:**

In `styles.traderName`:
- `color: COLORS.accentGreen` → `color: COLORS.textPrimary`

**3d. Buyer name colour — remove blue:**

In `styles.buyerName`:
- `color: COLORS.info` → `color: COLORS.textMuted`

**3e. Bell icon in Live Trade Events header — remove orange hardcode:**

```tsx
<Bell color={COLORS.textSecondary} size={16} />
```
(was `color="#f97316"`)

**Verify:** Run `npm run lint` — 0 errors.

**Commit:**
```bash
git add src/features/dashboard/screens/admin/CommandCenterScreen.tsx
git commit -m "design: bigger section headers, muted event colours, remove blue/orange accents"
```

---

### Task 4: Push to GitHub

```bash
git push
```
