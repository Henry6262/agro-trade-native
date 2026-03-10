# Agro Trade — 5-Sprint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Take the app from ~60% integration to a fully functional, production-ready B2B agricultural marketplace.

**Architecture:** 5 sprints — shared components first, then seller/buyer data fixes, UI polish with character tour, transporter role, inspector role, and real-time layer. Each sprint is independently deployable.

**Tech Stack:** React Native + Expo, TypeScript, Zustand (immer), React Query, Reanimated, Socket.IO client, expo-location, expo-camera, expo-notifications

**Verification method:** Each task ends with `npx tsc --noEmit && npm run lint` from `front-end/` to confirm no regressions, plus a simulator smoke test note.

---

## Sprint 1 — Quick Wins & Data Fixes

**Goal:** Every existing screen shows real data. No more empty lists or hardcoded metrics.

---

### Task 1.1: Create `SkeletonCard` shared component

**Files:**
- Create: `src/shared/components/SkeletonCard.tsx`

**Step 1: Create the file**

```tsx
// src/shared/components/SkeletonCard.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonCardProps {
  lines?: number;
  height?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ lines = 3, height = 80 }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.7, { duration: 700 }), withTiming(0.3, { duration: 700 })),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.card, { height }, animStyle]}>
      {Array.from({ length: lines }).map((_, i) => (
        <View
          key={i}
          style={[styles.line, i === lines - 1 && styles.lineShort]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-evenly',
    marginBottom: 12,
    padding: 16,
  },
  line: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    height: 12,
    width: '100%',
  },
  lineShort: {
    width: '60%',
  },
});
```

**Step 2: Add export to shared index**

Open `src/shared/components/index.ts`. Add:
```ts
export { SkeletonCard } from './SkeletonCard';
```

**Step 3: Verify**

```bash
cd front-end && npx tsc --noEmit && npm run lint
```
Expected: 0 errors, 0 warnings for new file.

**Step 4: Commit**
```bash
git add src/shared/components/SkeletonCard.tsx src/shared/components/index.ts
git commit -m "feat: add SkeletonCard shared component with Reanimated shimmer"
```

---

### Task 1.2: Create `EmptyState` shared component

**Files:**
- Create: `src/shared/components/EmptyState.tsx`

**Step 1: Create the file**

```tsx
// src/shared/components/EmptyState.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassButton } from '../../design-system';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  cta?: string;
  onPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  cta,
  onPress,
}) => (
  <View style={styles.container}>
    {icon && <View style={styles.iconWrap}>{icon}</View>}
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {cta && onPress && (
      <GlassButton label={cta} onPress={onPress} variant="secondary" size="sm" style={styles.btn} />
    )}
  </View>
);

const styles = StyleSheet.create({
  btn: {
    marginTop: 16,
  },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconWrap: {
    marginBottom: 16,
    opacity: 0.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    textAlign: 'center',
  },
  title: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
```

**Step 2: Export from index**

In `src/shared/components/index.ts`:
```ts
export { EmptyState } from './EmptyState';
```

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/shared/components/EmptyState.tsx src/shared/components/index.ts
git commit -m "feat: add EmptyState shared component"
```

---

### Task 1.3: Create `PhaseBadge` shared component

**Files:**
- Create: `src/shared/components/PhaseBadge.tsx`

**Step 1: Create the file**

```tsx
// src/shared/components/PhaseBadge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type TradePhase =
  | 'INITIATION'
  | 'SELLER_NEGOTIATION'
  | 'INSPECTION_PENDING'
  | 'INSPECTION_IN_PROGRESS'
  | 'TRANSPORT_PENDING'
  | 'IN_TRANSIT'
  | 'DELIVERY_CONFIRMATION'
  | 'PAYMENT_PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED';

interface PhaseBadgeProps {
  phase: TradePhase | string;
}

const PHASE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  INITIATION: { label: 'Initiated', bg: 'rgba(148,163,184,0.15)', text: '#94A3B8' },
  SELLER_NEGOTIATION: { label: 'Negotiating', bg: 'rgba(96,165,250,0.15)', text: '#60A5FA' },
  INSPECTION_PENDING: { label: 'Inspection Pending', bg: 'rgba(251,191,36,0.15)', text: '#FBB F24' },
  INSPECTION_IN_PROGRESS: { label: 'Inspecting', bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  TRANSPORT_PENDING: { label: 'Transport Pending', bg: 'rgba(167,139,250,0.15)', text: '#A78BFA' },
  IN_TRANSIT: { label: 'In Transit', bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  DELIVERY_CONFIRMATION: { label: 'Confirming', bg: 'rgba(52,211,153,0.15)', text: '#34D399' },
  PAYMENT_PROCESSING: { label: 'Payment', bg: 'rgba(52,211,153,0.2)', text: '#6EE7B7' },
  COMPLETED: { label: 'Completed', bg: 'rgba(74,222,128,0.15)', text: '#4ADE80' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239,68,68,0.15)', text: '#F87171' },
};

const DEFAULT_CONFIG = { label: 'Unknown', bg: 'rgba(255,255,255,0.08)', text: 'rgba(255,255,255,0.5)' };

export const PhaseBadge: React.FC<PhaseBadgeProps> = ({ phase }) => {
  const config = PHASE_CONFIG[phase] ?? DEFAULT_CONFIG;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
```

**Step 2: Fix the typo in the bg string** (INSPECTION_PENDING has a space in `#FBB F24`) — correct to `#FBBF24`.

**Step 3: Export + verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/shared/components/PhaseBadge.tsx src/shared/components/index.ts
git commit -m "feat: add PhaseBadge component mapping trade phases to colors"
```

---

### Task 1.4: Add `fetchListings()` to marketplace store

Context: `src/stores/marketplace.store.ts` has full filter/pagination state but no API fetching. The store is consumed by `MarketplaceScreen` for browsing listings.

**Files:**
- Modify: `src/stores/marketplace.store.ts`

**Step 1: Add listings state + fetchListings action**

In `marketplace.store.ts`, after the `MarketplaceState` interface, add new fields and action:

Add to the interface (after `error: string | null;`):
```ts
listings: {
  buyer: unknown[];
  seller: unknown[];
};
fetchListings: (role: 'buyer' | 'seller' | 'both') => Promise<void>;
```

Add to the initial state (in the `immer` block, after `error: null,`):
```ts
listings: {
  buyer: [],
  seller: [],
},
```

Add the action implementation (before the closing `))` of the immer block):
```ts
fetchListings: async (role) => {
  set((state) => { state.isLoading = true; state.error = null; });
  try {
    const { apiClient } = await import('../services/api');
    if (role === 'buyer' || role === 'both') {
      const res = await apiClient.get('/buyer/listings');
      set((state) => { state.listings.buyer = res.data ?? []; });
    }
    if (role === 'seller' || role === 'both') {
      const res = await apiClient.get('/seller/listings');
      set((state) => { state.listings.seller = res.data ?? []; });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load listings';
    set((state) => { state.error = msg; });
  } finally {
    set((state) => { state.isLoading = false; });
  }
},
```

**Step 2: Also add listings to the `MarketplaceState` interface properly**

The interface needs `listings` and `fetchListings` typed. Update the interface block to include:
```ts
listings: {
  buyer: unknown[];
  seller: unknown[];
};
fetchListings: (role: 'buyer' | 'seller' | 'both') => Promise<void>;
```

**Step 3: Verify**
```bash
npx tsc --noEmit && npm run lint
```
Expected: 0 type errors on marketplace.store.ts.

**Step 4: Commit**
```bash
git add src/stores/marketplace.store.ts
git commit -m "feat: add fetchListings() to marketplaceStore with buyer/seller API calls"
```

---

### Task 1.5: Add `ErrorBoundary` component + global 401 handling

**Files:**
- Create: `src/shared/components/ErrorBoundary.tsx`
- Modify: `src/services/api.ts` (add 401 interceptor)

**Step 1: Create ErrorBoundary**

```tsx
// src/shared/components/ErrorBoundary.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassButton } from '../../design-system';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>{this.state.error?.message ?? 'Unexpected error'}</Text>
          <GlassButton label="Retry" onPress={this.handleRetry} variant="secondary" size="sm" style={styles.btn} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  btn: { marginTop: 16 },
  container: {
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.07)',
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    margin: 16,
    padding: 32,
  },
  icon: { fontSize: 32, marginBottom: 12 },
  subtitle: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 6, textAlign: 'center' },
  title: { color: '#F87171', fontSize: 16, fontWeight: '700' },
});
```

**Step 2: Add 401 interceptor to `src/services/api.ts`**

Find the axios response interceptor (or add one after the instance is created). Add:
```ts
// After: export const apiClient = axios.create(...)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Lazy import to avoid circular dependency
      import('@stores/auth.store').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
    }
    return Promise.reject(error);
  }
);
```

**Step 3: Export ErrorBoundary from shared index**
```ts
export { ErrorBoundary } from './ErrorBoundary';
```

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/shared/components/ErrorBoundary.tsx src/shared/components/index.ts src/services/api.ts
git commit -m "feat: add ErrorBoundary component + 401 auto-logout interceptor"
```

---

### Task 1.6: Wire trade phase into SellerTradeCard

Context: `src/pages/Dashboard/sections/Seller/features/Trades/` has `SellerTradeCard` components. We need to show the `PhaseBadge` on each trade card.

**Files:**
- Modify: `src/pages/Dashboard/sections/Seller/features/Trades/components/` (find the SellerTradeCard component)

**Step 1: Find the card**
```bash
ls src/pages/Dashboard/sections/Seller/features/Trades/components/
```

**Step 2: Open `SellerTradeCard.tsx`**

Look for where it renders trade status. Find a `status` or `phase` prop. If `phase` is in the trade type, import `PhaseBadge`:

```tsx
import { PhaseBadge } from '@shared/components/PhaseBadge';
```

Add `<PhaseBadge phase={trade.phase ?? trade.status ?? ''} />` after the trade title or in the card header row.

**Step 3: Check the `Trade` type** in `types.ts` to confirm `phase` field exists. If it's called `status`, use that.

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Seller/features/Trades/
git commit -m "feat: show PhaseBadge on SellerTradeCard"
```

---

### Task 1.7: Wire trade phase into BuyerOrdersTab

**Files:**
- Modify: `src/pages/Dashboard/sections/Buyer/features/Orders/components/` — find the ActiveOrdersList or order card component

**Step 1: Find the order card**
```bash
ls src/pages/Dashboard/sections/Buyer/features/Orders/components/
```

**Step 2: Import and add PhaseBadge**

In the order card component:
```tsx
import { PhaseBadge } from '@shared/components/PhaseBadge';
```

Add `<PhaseBadge phase={order.phase ?? order.status ?? ''} />` in the card layout.

The `TradeOperation` type in `src/services/buyerService.ts` has `phase: string` — use that field.

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Buyer/features/Orders/
git commit -m "feat: show PhaseBadge on buyer order cards"
```

---

### Sprint 1 smoke test

1. Build and run on iOS Simulator: `npx expo start --ios`
2. Sign in as a seller → Trades tab → confirm phase badges appear on trades
3. Sign in as a buyer → Orders tab → confirm phase badges appear
4. Kill network → confirm error states show (or check 401 triggers logout flow)

---

## Sprint 2 — UI Polish & Character Tour

**Goal:** First-time user sees character tour. News and alerts are extracted as reusable components. Trade ops screen is fully glassmorphism.

---

### Task 2.1: Extract `NewsCard` component from IntelligenceScreen

Context: `IntelligenceScreen.tsx` already renders news with images, gradient overlay, source badge, and relative timestamp — all inline. Extract it so it can be reused and tested independently.

**Files:**
- Create: `src/features/dashboard/screens/intelligence/components/NewsCard.tsx`
- Modify: `src/features/dashboard/screens/shared/IntelligenceScreen.tsx`

**Step 1: Create NewsCard.tsx**

```tsx
// src/features/dashboard/screens/intelligence/components/NewsCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageIcon } from 'lucide-react-native';
import { GlassCard, GlassBadge, COLORS } from '../../../../../design-system';

interface NewsArticle {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
}

interface NewsCardProps {
  article: NewsArticle;
  onPress: (url: string) => void;
  delay?: number;
}

function formatTimeAgo(isoString: string): string {
  if (!isoString) return 'unknown';
  const ms = Date.now() - new Date(isoString).getTime();
  if (isNaN(ms)) return 'unknown';
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const NewsCard: React.FC<NewsCardProps> = ({ article, onPress, delay = 0 }) => (
  <TouchableOpacity
    onPress={() => onPress(article.url)}
    activeOpacity={0.75}
    style={styles.wrapper}
  >
    <GlassCard tier="subtle" noPadding animate delay={delay}>
      <View style={styles.imageContainer}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <ImageIcon size={22} color={COLORS.textMuted} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <GlassBadge label={article.source} variant="muted" />
          <Text style={styles.time}>{formatTimeAgo(article.publishedAt)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        {!!article.description && (
          <Text style={styles.description} numberOfLines={2}>{article.description}</Text>
        )}
      </View>
    </GlassCard>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  content: { padding: 12 },
  description: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17, marginTop: 4 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  image: { height: 140, width: '100%' },
  imageContainer: { borderRadius: 0, overflow: 'hidden' },
  imagePlaceholder: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', height: 100, justifyContent: 'center' },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  title: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  wrapper: { marginBottom: 12 },
});
```

**Step 2: Create components index**
```ts
// src/features/dashboard/screens/intelligence/components/index.ts
export { NewsCard } from './NewsCard';
```

**Step 3: Replace inline news rendering in IntelligenceScreen**

In `IntelligenceScreen.tsx`, find the `NewsSection` component's `news.map(...)` block:
- Import `NewsCard` from `./intelligence/components` (adjust path as needed)
- Replace the `TouchableOpacity > GlassCard > ...` block with:
```tsx
{news.map((article, index) => (
  <NewsCard
    key={article.url}
    article={article}
    onPress={openArticle}
    delay={index * 50}
  />
))}
```
- Also remove the duplicate `formatTimeAgo` function from IntelligenceScreen since it's now in NewsCard.

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/intelligence/
git commit -m "refactor: extract NewsCard component from IntelligenceScreen"
```

---

### Task 2.2: Extract `AlertPill` component from IntelligenceScreen

**Files:**
- Create: `src/features/dashboard/screens/intelligence/components/AlertPill.tsx`

**Step 1: Create AlertPill.tsx**

```tsx
// src/features/dashboard/screens/intelligence/components/AlertPill.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GlassBadge, GlassCard } from '../../../../../design-system';
import type { PriceAlert } from '../../../../../stores/market.store';
import type { CommoditySymbol } from '../../../../../services';

const COMMODITY_EMOJI: Record<string, string> = {
  WHEAT: '🌾',
  CORN: '🌽',
  COTTON: '🪴',
  SUGAR: '🍬',
  COFFEE: '☕',
};

const COMMODITY_NAMES: Record<string, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  COTTON: 'Cotton',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
};

interface AlertPillProps {
  alert: PriceAlert;
  onRemove: (id: string) => void;
}

export const AlertPill: React.FC<AlertPillProps> = ({ alert, onRemove }) => (
  <GlassCard
    tier="subtle"
    style={[styles.card, alert.triggered && styles.cardTriggered]}
  >
    <View style={styles.row}>
      <Text style={styles.commodity}>
        {COMMODITY_EMOJI[alert.symbol] ?? '📊'}{' '}
        <Text style={styles.name}>
          {COMMODITY_NAMES[alert.symbol] ?? alert.symbol}
        </Text>
      </Text>

      <View style={[styles.condPill, alert.condition === 'above' ? styles.condUp : styles.condDown]}>
        <Text style={[styles.condText, alert.condition === 'above' ? styles.condTextUp : styles.condTextDown]}>
          {alert.condition === 'above' ? '▲ ABOVE' : '▼ BELOW'}
        </Text>
      </View>

      <Text style={styles.threshold}>${alert.threshold.toFixed(2)}</Text>

      <GlassBadge
        label={alert.triggered ? '✓ HIT' : '● LIVE'}
        variant={alert.triggered ? 'gold' : 'muted'}
      />

      <TouchableOpacity onPress={() => onRemove(alert.id)} style={styles.removeBtn}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  </GlassCard>
);

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  cardTriggered: { borderColor: 'rgba(74,222,128,0.3)', borderWidth: 1 },
  commodity: { color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '600' },
  condDown: { backgroundColor: 'rgba(239,68,68,0.12)' },
  condPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  condText: { fontSize: 10, fontWeight: '700' },
  condTextDown: { color: '#F87171' },
  condTextUp: { color: '#4ADE80' },
  condUp: { backgroundColor: 'rgba(74,222,128,0.12)' },
  name: { fontWeight: '700' },
  removeBtn: { marginLeft: 8, padding: 4 },
  removeText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'nowrap', gap: 8 },
  threshold: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
});
```

**Step 2: Export from components index**
```ts
// Add to src/features/dashboard/screens/intelligence/components/index.ts
export { AlertPill } from './AlertPill';
```

**Step 3: Replace inline alert rendering in IntelligenceScreen**

In the `AlertsSection` component, replace the `alerts.map(...)` block:
```tsx
import { AlertPill } from './intelligence/components'; // adjust path
// ...
{alerts.map((alert: PriceAlert) => (
  <AlertPill key={alert.id} alert={alert} onRemove={removeAlert} />
))}
```

Remove any now-duplicate inline styles from IntelligenceScreen that were only used by the old alert rendering.

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/intelligence/
git commit -m "refactor: extract AlertPill component from IntelligenceScreen"
```

---

### Task 2.3: Build `CharacterTourOverlay` component

Context: `src/stores/tour.store.ts` is fully implemented with `hasSeenTour`, `isTourActive`, `currentStep`, `tourRole`, `startTour(role)`, `nextStep()`, `skipTour()`, `completeTour()`. We just need the visual overlay.

**Files:**
- Create: `src/features/onboarding/components/CharacterTourOverlay.tsx`

**Step 1: Create the tour step content config**

```tsx
// src/features/onboarding/components/CharacterTourOverlay.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { useTourStore } from '@stores/tour.store';
import { GlassButton } from '../../../design-system';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const TOUR_STEPS: Record<string, { title: string; body: string }[]> = {
  seller: [
    {
      title: '📊 Market Intel',
      body: 'Check live commodity prices and agricultural news here. Set price alerts to never miss a surge.',
    },
    {
      title: '📦 Your Products',
      body: 'List your grain, cotton, or coffee here. Buyers across the platform will see your offers.',
    },
    {
      title: '🤝 Offers',
      body: 'When a buyer sends you an offer, it appears here. Accept, reject, or counter.',
    },
    {
      title: '📈 Trade Status',
      body: 'Track every deal through 9 phases — from negotiation to payment. Tap for details.',
    },
    {
      title: '🔔 Notifications',
      body: "You're all set! We'll notify you the moment a buyer responds.",
    },
  ],
  buyer: [
    {
      title: '📊 Market Intel',
      body: 'Monitor live prices and set alerts for the commodities you want to buy.',
    },
    {
      title: '📋 Requests',
      body: "Post a buy request — tell sellers what you need and at what price. They'll come to you.",
    },
    {
      title: '📦 Orders',
      body: 'Active orders and incoming seller offers live here. Track your deals in real time.',
    },
    {
      title: '📈 Trade Timeline',
      body: 'See every step of your order: negotiation, inspection, transit, and delivery.',
    },
    {
      title: '✅ Done!',
      body: "You're ready to buy. Place your first request and watch sellers compete for your business.",
    },
  ],
  transport: [
    {
      title: '🚛 Available Jobs',
      body: 'Browse transport requests from active trade operations. Filter by route or weight.',
    },
    {
      title: '💰 Submit Bids',
      body: 'Name your price for each job. The trade admin selects the best offer.',
    },
    {
      title: '📍 Active Jobs',
      body: 'Accepted jobs appear here. Update your GPS position to keep buyers informed.',
    },
    {
      title: '🚚 Fleet',
      body: 'Keep your vehicles up to date. Accurate capacity info wins more bids.',
    },
    {
      title: '✅ Ready!',
      body: 'Start bidding on available jobs. Your first delivery is one tap away.',
    },
  ],
};

const DEFAULT_STEPS = [
  { title: '👋 Welcome!', body: "You're in. Explore the tabs to get started." },
];

export const CharacterTourOverlay: React.FC = () => {
  const { isTourActive, currentStep, tourRole, nextStep, skipTour, completeTour } = useTourStore();

  if (!isTourActive) return null;

  const steps = (tourRole && TOUR_STEPS[tourRole]) ?? DEFAULT_STEPS;
  const step = steps[currentStep];
  const isLast = currentStep >= steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeTour();
    } else {
      nextStep();
    }
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Dimming layer */}
      <TouchableOpacity style={styles.dim} onPress={skipTour} activeOpacity={1} />

      {/* Speech bubble card — bottom of screen */}
      <View style={styles.bubble}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentStep && styles.dotActive]}
            />
          ))}
        </View>

        <Text style={styles.title}>{step?.title ?? ''}</Text>
        <Text style={styles.body}>{step?.body ?? ''}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={skipTour} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip tour</Text>
          </TouchableOpacity>
          <GlassButton
            label={isLast ? 'Get Started' : 'Next →'}
            onPress={handleNext}
            variant="primary"
            size="sm"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  body: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  bubble: {
    backgroundColor: 'rgba(15,20,30,0.97)',
    borderColor: 'rgba(74,222,128,0.3)',
    borderRadius: 24,
    borderWidth: 1,
    bottom: 100,
    left: 20,
    padding: 24,
    position: 'absolute',
    right: 20,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  dim: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dot: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    height: 6,
    marginHorizontal: 3,
    width: 6,
  },
  dotActive: {
    backgroundColor: '#4ADE80',
    width: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 999,
  },
  skipBtn: { padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
```

**Step 2: Mount the overlay in `DashboardMainScreen`**

In `src/features/dashboard/screens/DashboardMainScreen.tsx`:

```tsx
import { CharacterTourOverlay } from '@features/onboarding/components/CharacterTourOverlay';
import { useTourStore } from '@stores/tour.store';
```

Inside `DashboardMainScreen`, after the user role is resolved, add an effect to start the tour for first-time users:
```tsx
const { hasSeenTour, startTour } = useTourStore();

React.useEffect(() => {
  if (!hasSeenTour && userRole && userRole !== 'admin') {
    const timer = setTimeout(() => {
      startTour(userRole as 'buyer' | 'seller' | 'transport');
    }, 1500); // slight delay so dashboard finishes mounting
    return () => clearTimeout(timer);
  }
}, [hasSeenTour, userRole, startTour]);
```

Add `<CharacterTourOverlay />` as the **last child** inside the outermost `<View>` returned by `DashboardMainScreen`:
```tsx
return (
  <GradientBackground>
    {/* ... all existing content ... */}
    <CharacterTourOverlay />
  </GradientBackground>
);
```

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/onboarding/components/CharacterTourOverlay.tsx src/features/dashboard/screens/DashboardMainScreen.tsx
git commit -m "feat: add CharacterTourOverlay component with role-specific 5-step tour"
```

**Step 4: Smoke test**

On simulator: log in with a new account → after ~1.5s, dimmed overlay appears with tour bubble → tap Next 4 times → tour completes → subsequent logins don't show tour.

---

### Task 2.4: Glassmorphism polish on `OperationsScreenRefactored`

Context: `src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx` and `src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx` need their Tailwind/plain styles replaced with the dark glass design system.

**Files:**
- Modify: `src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx`
- Modify: `src/features/dashboard/screens/admin/components/ActiveOperationsTab.tsx`

**Step 1: Audit OperationsScreenRefactored.tsx**

Read the file to find: `className="..."` patterns, inline `style={{ backgroundColor: 'white' }}`, or any light-mode colors.

**Step 2: Replace all light-mode patterns**

Apply these substitutions:
- `backgroundColor: '#ffffff'` or `'white'` → `'rgba(255,255,255,0.06)'`
- `color: '#000'` or `'#333'` or `'#111'` → `'#FFFFFF'`
- `color: '#666'` or `'#999'` → `'rgba(255,255,255,0.5)'`
- `borderColor: '#ddd'` → `'rgba(255,255,255,0.1)'`
- `backgroundColor: '#f5f5f5'` → `'rgba(255,255,255,0.04)'`
- Any `className="..."` props → remove and add equivalent `StyleSheet` styles

**Step 3: Add PhaseBadge to operation rows**

Each trade operation row should display `<PhaseBadge phase={op.phase} />`.

**Step 4: Repeat for ActiveOperationsTab.tsx**

Apply same audit + substitution pattern.

**Step 5: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/admin/
git commit -m "style: glassmorphism polish on admin operations screen"
```

---

## Sprint 3 — Transporter Dashboard

**Goal:** Transporter can see available jobs, bid, track active deliveries, and update GPS.

---

### Task 3.1: Wire `TransporterIncomingOffersTab` — verify & clean up

Context: `TransporterIncomingOffersTab.tsx` already calls `transportService` for jobs and bids. Verify it works and add proper empty/loading states.

**Files:**
- Modify: `src/features/dashboard/screens/transporter/components/TransporterIncomingOffersTab.tsx`

**Step 1: Read the file and audit**

Check:
- Does it call `transportService.getTransportRequests()`? ✓ (already wired from our exploration)
- Does it show `ActivityIndicator` while loading? Add if missing.
- Does it show an empty state when `transportRequests.length === 0`? Add `<EmptyState>` if missing.

**Step 2: Add EmptyState import and use**
```tsx
import { EmptyState } from '@shared/components/EmptyState';
import { Truck } from 'lucide-react-native';

// Where transport requests list renders when empty:
{transportRequests.length === 0 && !loading && (
  <EmptyState
    icon={<Truck size={32} color="rgba(167,139,250,0.5)" />}
    title="No transport jobs available"
    subtitle="Check back soon — new jobs appear when trades enter transport phase"
  />
)}
```

**Step 3: Add SkeletonCard for loading state**
```tsx
import { SkeletonCard } from '@shared/components/SkeletonCard';

// Replace bare ActivityIndicator with:
{loading && transportRequests.length === 0 && (
  <>
    <SkeletonCard lines={3} height={90} />
    <SkeletonCard lines={3} height={90} />
    <SkeletonCard lines={3} height={90} />
  </>
)}
```

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/transporter/components/TransporterIncomingOffersTab.tsx
git commit -m "feat: improve transporter incoming offers tab with empty/loading states"
```

---

### Task 3.2: Wire `TransporterBiddingTab` — my bids status

**Files:**
- Modify: `src/features/dashboard/screens/transporter/components/TransporterBiddingTab.tsx`

**Step 1: Read the file**

Check current state — if it shows hardcoded/empty data, wire it to `transportService.getMyBids()`.

**Step 2: Add API call**

The `transportService` already has bid methods. Add a `useEffect` to fetch bids on mount:
```tsx
const [bids, setBids] = useState<TransportBid[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  transportService.getMyBids()
    .then((data) => setBids(data ?? []))
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

(Check the exact method name in `transportService.ts` — it may be `getBids`, `getTransporterBids`, or similar.)

**Step 3: Add bid status badge**

For each bid, show its status (`PENDING`, `ACCEPTED`, `REJECTED`) using a color-coded `View`:
```tsx
const BID_STATUS_COLORS: Record<string, string> = {
  PENDING: '#FBB F24',   // amber — fix space: '#FBBF24'
  ACCEPTED: '#4ADE80',   // green
  REJECTED: '#F87171',   // red
};
```

**Step 4: Add empty + loading states using SkeletonCard and EmptyState**

**Step 5: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/transporter/components/TransporterBiddingTab.tsx
git commit -m "feat: wire TransporterBiddingTab to real bid data with status badges"
```

---

### Task 3.3: Wire `TransporterActiveJobsTab` — GPS tracking

**Files:**
- Modify: `src/features/dashboard/screens/transporter/components/TransporterActiveJobsTab.tsx`

**Step 1: Read the file**

Check if it calls `transportService.getMyAssignments()` or similar. Wire it if not.

**Step 2: Add location update button for IN_TRANSIT jobs**

For jobs with `status === 'IN_TRANSIT'`:
```tsx
import * as Location from 'expo-location';
import transportService from '@services/transportService';

const handleUpdateLocation = async (jobId: string) => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return;
  const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  await transportService.updateJobLocation(jobId, {
    lat: loc.coords.latitude,
    lng: loc.coords.longitude,
  });
};
```

(Check the exact method name in `transportService.ts` — look for `updateLocation`, `patchLocation`, or `PATCH /transport/assignments/{id}/location`.)

**Step 3: Add empty + loading states**

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/transporter/components/TransporterActiveJobsTab.tsx
git commit -m "feat: wire active transporter jobs with GPS location update"
```

---

### Task 3.4: Complete fleet management tab

**Files:**
- Modify: `src/features/dashboard/screens/transporter/components/TransporterFleetTab.tsx`

**Step 1: Read the existing fleet tab**

Check for: hardcoded vehicle data, missing edit/delete handlers, missing capacity summary.

**Step 2: Wire to transport service**

Add `useEffect` to load fleet data:
```tsx
useEffect(() => {
  transportService.getMyFleet?.()
    .then((fleet) => setVehicles(fleet ?? []))
    .catch(console.error)
    .finally(() => setLoading(false));
}, []);
```

**Step 3: Add capacity summary card**

Above the vehicle list, show total capacity:
```tsx
<View style={styles.summaryCard}>
  <Text style={styles.summaryLabel}>Total Fleet Capacity</Text>
  <Text style={styles.summaryValue}>
    {vehicles.reduce((sum, v) => sum + (v.capacity ?? 0), 0)} tons
  </Text>
</View>
```

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/transporter/
git commit -m "feat: complete fleet management tab with real data + capacity summary"
```

---

## Sprint 4 — Inspector Dashboard

**Goal:** Inspector can see available jobs, accept, execute with photo capture, and submit quality reports.

---

### Task 4.1: Redesign Inspector dashboard shell — glassmorphism

Context: `src/pages/Dashboard/sections/Inspector/index.tsx` uses NativeWind `className` props (Tailwind) — the green header, white background, gray tabs are all wrong for the dark glass design system. Replace entirely.

**Files:**
- Modify: `src/pages/Dashboard/sections/Inspector/index.tsx`

**Step 1: Replace the entire file content**

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { InspectorDashboardSectionProps } from './types';
import ActiveJobFeature from './features/ActiveJob';
import AvailableJobsFeature from './features/AvailableJobs';

const TABS = [
  { id: 'available' as const, label: 'Available Jobs' },
  { id: 'active' as const, label: 'My Assignments' },
] as const;

type TabId = typeof TABS[number]['id'];

export function InspectorDashboardSection({
  activeTab = 'available',
}: InspectorDashboardSectionProps) {
  const [tab, setTab] = useState<TabId>(activeTab);

  return (
    <View style={styles.root}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tabBtn, tab === t.id && styles.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {tab === 'available' ? <AvailableJobsFeature /> : <ActiveJobFeature />}
      </View>
    </View>
  );
}

export default InspectorDashboardSection;

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  tabBar: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tabBtn: {
    marginRight: 24,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabBtnActive: {
    borderBottomColor: '#4ADE80',
    borderBottomWidth: 2,
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#4ADE80',
  },
});
```

**Step 2: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Inspector/index.tsx
git commit -m "style: replace NativeWind inspector shell with glassmorphism design system"
```

---

### Task 4.2: Wire `AvailableJobsFeature` to real API

**Files:**
- Find and modify: `src/pages/Dashboard/sections/Inspector/features/AvailableJobs/index.tsx` (or `hooks/`)

**Step 1: Identify the current data source**

Read the AvailableJobs feature index to see if it fetches from `inspectionService` or uses mock data.

**Step 2: Wire `inspectionService.getInspections({ status: 'PENDING' })`**

The `inspectionService` at `src/services/inspectionService.ts` has `getInspections(params)` that calls `GET /inspections`. Add:
```tsx
import { inspectionService } from '@services/inspectionService';

// In the feature/hook:
const fetchAvailableJobs = async () => {
  setLoading(true);
  try {
    const response = await inspectionService.getInspections({ status: 'PENDING' });
    setJobs(response.data ?? response ?? []);
  } catch (err) {
    setError('Failed to load available inspection jobs');
  } finally {
    setLoading(false);
  }
};
```

**Step 3: Add "Accept" action**

When inspector taps a job:
```tsx
const handleAccept = async (inspectionId: string) => {
  await inspectionService.acceptInspection(inspectionId);
  // Refresh the list
  fetchAvailableJobs();
};
```

(Check the exact method names in `inspectionService.ts` — look for `accept`, `acceptInspection`, or `POST /inspections/{id}/accept`.)

**Step 4: Add SkeletonCard + EmptyState**

**Step 5: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Inspector/features/AvailableJobs/
git commit -m "feat: wire AvailableJobsFeature to inspectionService with accept action"
```

---

### Task 4.3: Build inspection execution screen — photos + report

**Files:**
- Create: `src/pages/Dashboard/sections/Inspector/features/InspectionExecution/index.tsx`
- Modify: `src/pages/Dashboard/sections/Inspector/features/ActiveJob/index.tsx` (add nav to execution screen)

**Step 1: Create InspectionExecution screen**

```tsx
// src/pages/Dashboard/sections/Inspector/features/InspectionExecution/index.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GlassButton, GlassInput, GlassBadge, COLORS } from '../../../../../../design-system';
import { inspectionService } from '@services/inspectionService';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface InspectionExecutionProps {
  inspectionId: string;
  productName: string;
  onComplete: () => void;
  onBack: () => void;
}

type Grade = 'A' | 'B' | 'C';

const GRADE_OPTIONS: Grade[] = ['A', 'B', 'C'];

const GRADE_COLORS: Record<Grade, string> = {
  A: '#4ADE80',
  B: '#FBB F24',  // fix space: '#FBBF24'
  C: '#F87171',
};

export default function InspectionExecution({
  inspectionId,
  productName,
  onComplete,
  onBack,
}: InspectionExecutionProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [weightVerified, setWeightVerified] = useState('');
  const [conditionNotes, setConditionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const handleCapture = async () => {
    if (!cameraRef) return;
    const photo = await cameraRef.takePictureAsync({ quality: 0.7 });
    if (photo?.uri) {
      setPhotos((prev) => [...prev, photo.uri]);
      setShowCamera(false);
    }
  };

  const handleSubmit = async () => {
    if (!grade) {
      Alert.alert('Missing grade', 'Please select a quality grade before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      // Upload each photo
      for (const uri of photos) {
        const formData = new FormData();
        formData.append('photo', {
          uri,
          type: 'image/jpeg',
          name: `inspection-${Date.now()}.jpg`,
        } as unknown as Blob);
        await inspectionService.uploadPhoto?.(inspectionId, formData);
      }

      // Submit report
      await inspectionService.submitReport?.(inspectionId, {
        grade,
        weightVerified: parseFloat(weightVerified) || 0,
        conditionNotes,
      });

      Alert.alert('Report submitted!', 'Your inspection report has been submitted.');
      onComplete();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={setCameraRef} facing="back" />
        <View style={styles.cameraControls}>
          <TouchableOpacity onPress={() => setShowCamera(false)} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCapture} style={styles.captureBtn} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.heading}>Inspection Report</Text>
      <Text style={styles.product}>{productName}</Text>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <View style={styles.photosRow}>
          {photos.map((uri, i) => (
            <Image key={i} source={{ uri }} style={styles.photoThumb} />
          ))}
          <TouchableOpacity style={styles.addPhotoBtn} onPress={handleTakePhoto}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Grade */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quality Grade</Text>
        <View style={styles.gradeRow}>
          {GRADE_OPTIONS.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.gradeBtn,
                grade === g && { borderColor: GRADE_COLORS[g], backgroundColor: `${GRADE_COLORS[g]}22` },
              ]}
              onPress={() => setGrade(g)}
            >
              <Text style={[styles.gradeText, grade === g && { color: GRADE_COLORS[g] }]}>
                Grade {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Weight */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Verified Weight (tons)</Text>
        <GlassInput
          value={weightVerified}
          onChangeText={setWeightVerified}
          placeholder="e.g. 24.5"
          keyboardType="numeric"
        />
      </View>

      {/* Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Condition Notes</Text>
        <GlassInput
          value={conditionNotes}
          onChangeText={setConditionNotes}
          placeholder="Describe the condition of goods..."
          multiline
          numberOfLines={3}
        />
      </View>

      <GlassButton
        label={submitting ? 'Submitting...' : 'Submit Report'}
        onPress={handleSubmit}
        variant="primary"
        fullWidth
        loading={submitting}
        disabled={submitting || !grade}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  addPhotoBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  addPhotoIcon: { fontSize: 20 },
  addPhotoText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  backBtn: { marginBottom: 20 },
  backText: { color: 'rgba(74,222,128,0.8)', fontSize: 14, fontWeight: '600' },
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  cameraControls: {
    alignItems: 'center',
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cancelBtn: { left: 40, position: 'absolute' },
  cancelText: { color: '#FFFFFF', fontSize: 16 },
  captureBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    height: 72,
    width: 72,
  },
  content: { padding: 20 },
  gradeBtn: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
  },
  gradeRow: { flexDirection: 'row' },
  gradeText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  heading: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginBottom: 4 },
  photoThumb: { borderRadius: 12, height: 72, marginRight: 8, width: 72 },
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  product: { color: 'rgba(74,222,128,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 24 },
  root: { flex: 1 },
  section: { marginBottom: 24 },
  sectionLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, textTransform: 'uppercase' },
  submitBtn: { marginBottom: 40, marginTop: 8 },
});
```

**Step 2: Add `uploadPhoto` and `submitReport` methods to inspectionService if missing**

Open `src/services/inspectionService.ts`. If these methods are missing, add:
```ts
uploadPhoto: async (inspectionId: string, formData: FormData) => {
  return apiClient.post(`/inspections/${inspectionId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
},

submitReport: async (
  inspectionId: string,
  report: { grade: string; weightVerified: number; conditionNotes: string }
) => {
  return apiClient.post(`/inspections/${inspectionId}/report`, report);
},
```

**Step 3: Wire execution screen into ActiveJob feature**

In `src/pages/Dashboard/sections/Inspector/features/ActiveJob/index.tsx`, add a button on each active job that opens `InspectionExecution`:
```tsx
import InspectionExecution from '../InspectionExecution';

// Manage execution screen state:
const [executingJob, setExecutingJob] = useState<{ id: string; productName: string } | null>(null);

// If execution screen is active:
if (executingJob) {
  return (
    <InspectionExecution
      inspectionId={executingJob.id}
      productName={executingJob.productName}
      onComplete={() => { setExecutingJob(null); fetchActiveJobs(); }}
      onBack={() => setExecutingJob(null)}
    />
  );
}

// On each active job card, add:
<GlassButton
  label="Execute Inspection"
  onPress={() => setExecutingJob({ id: job.id, productName: job.productName ?? 'Product' })}
  variant="primary"
  size="sm"
/>
```

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Inspector/
git add src/services/inspectionService.ts
git commit -m "feat: inspection execution screen with photo capture and report submission"
```

---

## Sprint 5 — Real-time & Production Readiness

**Goal:** Live trade updates, push notifications, graceful offline handling, list performance.

---

### Task 5.1: Subscribe to WebSocket trade events

Context: `src/services/socketService.ts` has a full `SocketService` class with `connect()`, `on(event, cb)`, `off(event, cb)`, `disconnect()`. It just needs event subscriptions wired.

**Files:**
- Modify: `src/features/dashboard/screens/DashboardMainScreen.tsx`
- Modify: `src/pages/Dashboard/sections/Seller/features/Trades/hooks/useSellerTrades.ts`

**Step 1: Connect socket on dashboard mount**

In `DashboardMainScreen.tsx`:
```tsx
import { socketService } from '@services/socketService';
import { useNotificationStore } from '@stores/notification.store';

// In component, inside useEffect after auth check:
React.useEffect(() => {
  if (isAuthenticated) {
    socketService.connect();
  }
  return () => {
    socketService.disconnect();
  };
}, [isAuthenticated]);
```

**Step 2: Subscribe to trade updates in seller trades hook**

In `useSellerTrades.ts`, after fetching initial data:
```tsx
import { socketService } from '@services/socketService';

// In useEffect after initial fetch:
useEffect(() => {
  const handleTradeUpdate = (payload: { tradeId: string; phase: string }) => {
    // Trigger a refetch so the UI reflects new phase
    refetch(); // or refresh() depending on the hook pattern
  };

  socketService.on('trade-operation:updated', handleTradeUpdate);
  return () => {
    socketService.off('trade-operation:updated', handleTradeUpdate);
  };
}, []);
```

**Step 3: Subscribe to `offer:received` for in-app notification**

In `DashboardMainScreen.tsx`:
```tsx
import { useNotificationStore } from '@stores/notification.store';

// In useEffect alongside socket connect:
const addNotification = useNotificationStore.getState().addNotification;

socketService.on('offer:received', (payload: { productName: string; buyerName: string }) => {
  addNotification({
    type: 'offer',
    title: 'New Offer Received',
    body: `${payload.buyerName} made an offer on ${payload.productName}`,
    timestamp: new Date().toISOString(),
  });
});
```

(Check the exact shape of `useNotificationStore.addNotification` — adjust fields accordingly.)

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/DashboardMainScreen.tsx
git add src/pages/Dashboard/sections/Seller/features/Trades/hooks/
git commit -m "feat: wire WebSocket trade-operation and offer events to live UI updates"
```

---

### Task 5.2: Push notifications setup

**Files:**
- Modify: `src/services/notificationService.ts` (or create if missing)
- Modify: `src/features/dashboard/screens/DashboardMainScreen.tsx`
- Modify: `app.json`

**Step 1: Check if notificationService exists**
```bash
ls src/services/notificationService.ts
```

If it doesn't exist, create it:
```ts
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Register token with backend
  try {
    await apiClient.post('/notifications/register-device', { token, platform: Platform.OS });
  } catch {
    // Non-fatal — notifications still work locally
  }

  return token;
}
```

**Step 2: Call `registerForPushNotifications` on dashboard mount**

In `DashboardMainScreen.tsx`:
```tsx
import { registerForPushNotifications } from '@services/notificationService';

// In useEffect after auth check:
React.useEffect(() => {
  if (isAuthenticated) {
    registerForPushNotifications().catch(console.warn);
  }
}, [isAuthenticated]);
```

**Step 3: Add push notification config to `app.json`**

In `app.json`, under `expo.ios`:
```json
"infoPlist": {
  "UIBackgroundModes": ["remote-notification"]
}
```

Under `expo.android`:
```json
"googleServicesFile": "./google-services.json"
```

Under `expo.plugins` (if not already):
```json
["expo-notifications", {
  "icon": "./assets/notification-icon.png",
  "color": "#4ADE80"
}]
```

Note: `./assets/notification-icon.png` should be a 96×96 PNG. Use the existing `agra-logo.png` if a dedicated notification icon doesn't exist.

**Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/services/notificationService.ts src/features/dashboard/screens/DashboardMainScreen.tsx app.json
git commit -m "feat: push notification registration with expo-notifications + backend token sync"
```

---

### Task 5.3: Add cursor-based pagination to seller trades list

Context: Backend supports `?limit=20&cursor=` on all list endpoints. The seller trades list currently loads everything at once.

**Files:**
- Modify: `src/pages/Dashboard/sections/Seller/features/Trades/hooks/useSellerTrades.ts`
- Modify: `src/pages/Dashboard/sections/Seller/features/Trades/index.tsx`

**Step 1: Update `useSellerTrades` to support cursor**

In the hook, add pagination state:
```ts
const [cursor, setCursor] = useState<string | null>(null);
const [hasMore, setHasMore] = useState(true);
const [isFetchingMore, setIsFetchingMore] = useState(false);

const fetchMore = async () => {
  if (!hasMore || isFetchingMore) return;
  setIsFetchingMore(true);
  try {
    const res = await sellerTradesService.fetchTrades({ limit: 20, cursor });
    if (res.items?.length) {
      setTrades((prev) => [...prev, ...res.items]);
      setCursor(res.nextCursor ?? null);
      setHasMore(!!res.nextCursor);
    } else {
      setHasMore(false);
    }
  } finally {
    setIsFetchingMore(false);
  }
};
```

(Check the exact shape of `sellerTradesService.fetchTrades` — adjust to pass cursor param and parse `nextCursor` from response.)

**Step 2: Update the trades view to use FlatList with `onEndReached`**

In `src/pages/Dashboard/sections/Seller/features/Trades/index.tsx`, replace the `trades.map(...)` in a ScrollView with a FlatList:

```tsx
import { FlatList } from 'react-native';

<FlatList
  data={trades}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <SellerTradeCard trade={item} />}
  onEndReached={fetchMore}
  onEndReachedThreshold={0.3}
  ListFooterComponent={isFetchingMore ? <ActivityIndicator color={COLORS.accentGreen} /> : null}
  refreshControl={
    <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={COLORS.accentGreen} />
  }
/>
```

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Seller/features/Trades/
git commit -m "feat: cursor-based pagination for seller trades list"
```

---

### Task 5.4: Offline banner

**Files:**
- Create: `src/shared/components/OfflineBanner.tsx`
- Modify: `src/features/dashboard/screens/DashboardMainScreen.tsx`

**Step 1: Create OfflineBanner**

```tsx
// src/shared/components/OfflineBanner.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const translateY = useSharedValue(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      translateY.value = withTiming(offline ? 0 : -60, { duration: 300 });
    });
    return unsubscribe;
  }, [translateY]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, animStyle]}>
      <Text style={styles.text}>⚠️  You're offline — changes will sync when reconnected</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(239,68,68,0.9)',
    left: 0,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1000,
  },
  text: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
```

**Step 2: Check NetInfo is installed**
```bash
npm list @react-native-community/netinfo
```
If missing: `npm install @react-native-community/netinfo`

**Step 3: Add OfflineBanner to DashboardMainScreen**
```tsx
import { OfflineBanner } from '@shared/components/OfflineBanner';

// As first child in the outermost View:
<OfflineBanner />
```

**Step 4: Export from shared index + verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/shared/components/OfflineBanner.tsx src/shared/components/index.ts src/features/dashboard/screens/DashboardMainScreen.tsx
git commit -m "feat: offline banner with NetInfo listener and animated slide-in"
```

---

### Task 5.5: Performance — memoize FlatList item components

**Files:**
- Modify: Any list item component that renders inside a FlatList (SellerTradeCard, BuyerOrderCard, etc.)

**Step 1: Wrap each list item component in React.memo**

For each card component used inside FlatList:
```tsx
// Before: export function SellerTradeCard({ trade }: ...) { ... }
// After:
export const SellerTradeCard = React.memo(function SellerTradeCard({ trade }: ...) { ... });
```

Or export default:
```tsx
export default React.memo(SellerTradeCard);
```

**Step 2: Add `getItemLayout` to FlatLists with fixed-height items**

If items have a fixed height (e.g., 100px):
```tsx
getItemLayout={(_data, index) => ({
  length: 100,
  offset: 100 * index,
  index,
})}
```

Only add this where items have truly consistent height.

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/pages/Dashboard/sections/Seller/features/Trades/components/
git commit -m "perf: wrap FlatList item components in React.memo"
```

---

### Task 5.6: Wrap dashboard tabs in ErrorBoundary

**Files:**
- Modify: `src/features/dashboard/screens/DashboardMainScreen.tsx`

**Step 1: Import ErrorBoundary**
```tsx
import { ErrorBoundary } from '@shared/components/ErrorBoundary';
```

**Step 2: Wrap each tab render in the switch statement**

Wherever the active section/tab component is rendered:
```tsx
<ErrorBoundary key={activeSection}>
  {activeSection === 'products' && <SellerDashboardSection activeTab="products" />}
  {activeSection === 'offers' && <SellerDashboardSection activeTab="offers" />}
  {activeSection === 'trades' && <SellerDashboardSection activeTab="trades" />}
  {/* ... etc */}
</ErrorBoundary>
```

Using `key={activeSection}` resets the boundary when switching tabs so a crash in one tab doesn't persist.

**Step 3: Verify + commit**
```bash
npx tsc --noEmit && npm run lint
git add src/features/dashboard/screens/DashboardMainScreen.tsx
git commit -m "feat: wrap dashboard tab renders in ErrorBoundary for crash isolation"
```

---

## Success Checklist

| Sprint | Done When |
|--------|-----------|
| 1 | SkeletonCard, EmptyState, PhaseBadge visible in app. Trade cards show phase badges. 401 auto-logs out. |
| 2 | First-time user sees character tour after login. News renders image cards. Alert pills match design. Admin ops screen is dark glass. |
| 3 | Transporter sees real job list, submits bid, updates GPS location. Fleet shows real vehicles + capacity. |
| 4 | Inspector dashboard in glassmorphism. Inspector sees real available jobs, accepts, captures photos, submits report. |
| 5 | Trade status updates in real time via WebSocket. Push token registered. Offline banner appears instantly on network loss. Lists scroll 100+ items without jank. Crashes in one tab don't crash other tabs. |
