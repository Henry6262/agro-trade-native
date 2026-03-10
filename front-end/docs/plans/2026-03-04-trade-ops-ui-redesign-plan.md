# Trade Operations UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three visual problems in the Trade Operations screen: white-ish cards, missing product visuals, and a "Send Offers" link that doesn't look like a button.

**Architecture:** Inline style overrides on `GlassCard` components (no shared token changes), a `getProductEmoji` helper mapped from product category/name, and a restyled pill button for Send Offers. Two files touched: `ActiveOperationsTab.tsx` and `OperationsScreenRefactored.tsx`.

**Tech Stack:** React Native StyleSheet, existing `GlassCard` / `COLORS` design-system exports, no new dependencies.

---

### Task 1: Fix `ActiveOperationsTab.tsx`

**Files:**
- Modify: `src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx`

No tests exist for this presentational component — visual verification via simulator.

---

**Step 1: Add the `getProductEmoji` helper above the component**

Open `src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx`.

After the `formatOpRef` function (line ~116) add:

```typescript
const CATEGORY_EMOJI: Record<string, string> = {
  wheat: '🌾',
  corn: '🌽',
  maize: '🌽',
  rice: '🍚',
  soy: '🫘',
  soybean: '🫘',
  barley: '🌿',
  oat: '🌿',
  sunflower: '🌻',
  cotton: '🪴',
  potato: '🥔',
  tomato: '🍅',
  vegetable: '🥬',
  fruit: '🍎',
};

const getProductEmoji = (product?: { name?: string; category?: string }): string => {
  if (!product) return '📦';
  const hay = `${product.category ?? ''} ${product.name ?? ''}`.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (hay.includes(key)) return emoji;
  }
  return '📦';
};
```

---

**Step 2: Add the product header row inside `renderOperation`**

In `renderOperation`, find the `<TouchableOpacity onPress={() => toggleExpanded(...)}>` block.

Replace the inner `<View style={styles.opHeader}>` with this updated version that adds the emoji circle row above the existing title:

```typescript
<View style={styles.opHeader}>
  {/* Product visual + title row */}
  <View style={styles.productRow}>
    <View style={styles.emojiCircle}>
      <Text style={styles.emojiText}>
        {getProductEmoji(operation.buyListing?.product)}
      </Text>
    </View>
    <View style={styles.opHeaderLeft}>
      <View style={styles.opTitleRow}>
        <Text style={styles.opProductName}>
          {formatProductName(operation.buyListing?.product?.name)}
        </Text>
        {hasUrgentItems && (
          <GlassBadge
            label="Action Required"
            variant="warning"
            size="sm"
            style={styles.urgentBadge}
          />
        )}
      </View>
      <Text style={styles.opMeta}>
        {operation.buyListing?.quantity || 0} units ·{' '}
        {formatOpRef(operation.operationNumber)}
      </Text>
    </View>
  </View>

  <TouchableOpacity
    onPress={(e) => {
      e.stopPropagation();
      onSelectOperation(operation);
    }}
    style={styles.eyeBtn}
  >
    <Eye size={20} color={COLORS.textSecondary} />
  </TouchableOpacity>
</View>
```

---

**Step 3: Apply dark glass override to `opCard` and `awaitingCard`**

In `renderOperation`, update the two `GlassCard` usages:

```typescript
// Main operation card
<GlassCard
  key={operation.id}
  tier="medium"
  animate={false}
  style={[styles.opCard, styles.darkCard]}
>
```

```typescript
// Awaiting card
<GlassCard tier="subtle" animate={false} style={[styles.awaitingCard, styles.awaitingDarkCard]}>
```

---

**Step 4: Replace the bare Send Offers button**

Find `<TouchableOpacity ... style={styles.sendOffersBtn}>` inside the awaiting card.

Replace the entire `TouchableOpacity` with:

```typescript
<TouchableOpacity
  onPress={() => {
    const sellersWithoutOffers =
      operation.sellers?.filter(
        (s) => !operation.negotiations?.find((n) => n.tradeSellerId === s.id)
      ) || [];
    if (sellersWithoutOffers.length > 0) {
      onSendOffer(operation.id, sellersWithoutOffers[0].id);
    }
  }}
  style={styles.sendOffersBtn}
  activeOpacity={0.75}
>
  <Send size={14} color={COLORS.accentGreen} />
  <Text style={styles.sendOffersText}> Send Offers</Text>
</TouchableOpacity>
```

---

**Step 5: Update the StyleSheet**

Add / replace these styles in the `StyleSheet.create({...})` block at the bottom of the file:

```typescript
// NEW: dark glass card override
darkCard: {
  backgroundColor: 'rgba(8,22,12,0.82)',
  borderColor: 'rgba(74,222,128,0.22)',
  shadowColor: '#00ff6a',
  shadowOpacity: 0.10,
  shadowRadius: 10,
},

// NEW: awaiting card dark override
awaitingDarkCard: {
  backgroundColor: 'rgba(8,22,12,0.60)',
  borderColor: 'rgba(74,222,128,0.18)',
},

// NEW: product row
productRow: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
},

// NEW: emoji circle
emojiCircle: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: 'rgba(74,222,128,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(74,222,128,0.22)',
  alignItems: 'center',
  justifyContent: 'center',
},

// NEW: emoji text
emojiText: {
  fontSize: 24,
},

// REPLACE: sendOffersBtn (was just padding, now a pill)
sendOffersBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: 'rgba(74,222,128,0.16)',
  borderWidth: 1,
  borderColor: 'rgba(74,222,128,0.45)',
  borderRadius: 20,
  paddingHorizontal: 14,
  paddingVertical: 7,
  gap: 5,
},

// REPLACE: sendOffersText
sendOffersText: {
  color: COLORS.accentGreen,
  fontSize: 13,
  fontWeight: '700',
},
```

Note: the existing `sendOffersBtn` and `sendOffersText` keys already exist — fully replace them.

---

**Step 6: Run lint**

```bash
cd front-end && npx eslint src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx --fix
```

Expected: 0 errors.

---

**Step 7: Commit**

```bash
git add src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx
git commit -m "feat: redesign active ops cards — dark glass, emoji circles, proper Send Offers button"
```

---

### Task 2: Fix `OperationsScreenRefactored.tsx` listing cards

**Files:**
- Modify: `src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx`

---

**Step 1: Add `getProductEmoji` import / reuse**

Since the helper is defined in `ActiveOperationsTab.tsx`, duplicate the minimal version inline here (it's 10 lines, not worth a shared util for two callsites):

Add above the component:

```typescript
const PRODUCT_EMOJI: Record<string, string> = {
  wheat: '🌾', corn: '🌽', maize: '🌽', rice: '🍚',
  soy: '🫘', soybean: '🫘', barley: '🌿', sunflower: '🌻',
  potato: '🥔', tomato: '🍅', vegetable: '🥬', fruit: '🍎',
};

const productEmoji = (product?: { name?: string; category?: string }): string => {
  if (!product) return '📦';
  const hay = `${product.category ?? ''} ${product.name ?? ''}`.toLowerCase();
  for (const [key, emoji] of Object.entries(PRODUCT_EMOJI)) {
    if (hay.includes(key)) return emoji;
  }
  return '📦';
};
```

---

**Step 2: Add emoji circle to sell listing cards**

In `renderSellers`, inside the `GlassCard` for each listing, add an emoji circle before the existing `listingHeader`:

```typescript
<GlassCard key={listing.id} tier="medium" animate={false} style={[styles.listingCard, styles.darkCard]}>
  {/* Product emoji header */}
  <View style={styles.productEmojiRow}>
    <View style={styles.emojiCircle}>
      <Text style={styles.emojiText}>{productEmoji(listing.product)}</Text>
    </View>
    <View style={styles.listingHeaderLeft}>
      <Text style={styles.listingTitle}>
        {listing.product?.name || 'Unknown Product'}
      </Text>
      <Text style={styles.listingSubtitle}>
        {listing.seller?.name || 'Unknown Seller'}
      </Text>
    </View>
    <View style={[styles.qualityBadge, /* existing quality style */]}>
      {/* existing quality badge */}
    </View>
  </View>
  {/* rest of existing content unchanged */}
```

Do the same for buy listing cards in `renderCreateTrade`.

---

**Step 3: Update `listingCard` style + add dark card styles**

Add to `StyleSheet.create`:

```typescript
darkCard: {
  backgroundColor: 'rgba(8,22,12,0.82)',
  borderColor: 'rgba(74,222,128,0.22)',
  shadowColor: '#00ff6a',
  shadowOpacity: 0.10,
  shadowRadius: 10,
},
productEmojiRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
},
emojiCircle: {
  width: 44,
  height: 44,
  borderRadius: 22,
  backgroundColor: 'rgba(74,222,128,0.10)',
  borderWidth: 1,
  borderColor: 'rgba(74,222,128,0.22)',
  alignItems: 'center',
  justifyContent: 'center',
},
emojiText: {
  fontSize: 22,
},
```

---

**Step 4: Run lint**

```bash
cd front-end && npx eslint src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx --fix
```

Expected: 0 errors.

---

**Step 5: Commit**

```bash
git add src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx
git commit -m "feat: dark glass + emoji circles on sell/buy listing cards in Trade Ops"
```

---

## Verification

After both tasks, confirm on simulator:

- [ ] Cards are dark/translucent, not white-ish
- [ ] Each card has an emoji circle top-left (🌾 for wheat etc., 📦 fallback)
- [ ] "Send Offers" renders as a green pill button, not a text link
- [ ] No lint errors (`npm run lint`)
- [ ] App doesn't crash on Trade Ops tab
