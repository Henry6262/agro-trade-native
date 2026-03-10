# News + Alerts Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Guardian API with GNews (images + working news), redesign NewsSection with image cards, redesign AlertsSection with compact pill rows.

**Architecture:** Two independent tasks — (1) data layer: swap newsService.ts to GNews API, add imageUrl field; (2) UI layer: rewrite NewsSection and AlertsSection sub-components in IntelligenceScreen.tsx. Price ticker and store untouched.

**Tech Stack:** React Native, TypeScript, react-native-reanimated (skeleton animation), expo-linear-gradient (image overlay), GNews API v4

---

## Task 1: Switch newsService.ts to GNews API

**Files:**
- Modify: `front-end/src/services/newsService.ts`
- Modify: `front-end/src/services/__tests__/newsService.test.ts`
- Modify: `front-end/.env`
- Modify: `front-end/.env.example`

---

### Step 1: Update the .env files

In `front-end/.env`, add:
```
EXPO_PUBLIC_GNEWS_KEY=240e4efe108e329b7c40a9620bd04192
```
Remove the old `EXPO_PUBLIC_NEWS_API_KEY` line.

In `front-end/.env.example`, add:
```
EXPO_PUBLIC_GNEWS_KEY=your_gnews_key_here
```
Remove the old `EXPO_PUBLIC_NEWS_API_KEY` line.

---

### Step 2: Update the test file to expect GNews shape

Replace the full contents of `front-end/src/services/__tests__/newsService.test.ts` with:

```typescript
import { newsService } from '../newsService';

global.fetch = jest.fn();

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps GNews article to NewsArticle shape with imageUrl', () => {
    const raw = {
      title: 'Wheat prices surge amid dry weather',
      description: 'Global wheat futures climbed on concerns...',
      url: 'https://reuters.com/article/123',
      image: 'https://example.com/wheat.jpg',
      publishedAt: '2026-03-03T10:00:00Z',
      source: { name: 'Reuters', url: 'https://reuters.com' },
    };

    const result = newsService.parseArticle(raw);

    expect(result.title).toBe('Wheat prices surge amid dry weather');
    expect(result.source).toBe('Reuters');
    expect(result.description).toBe('Global wheat futures climbed on concerns...');
    expect(result.url).toBe('https://reuters.com/article/123');
    expect(result.publishedAt).toBe('2026-03-03T10:00:00Z');
    expect(result.imageUrl).toBe('https://example.com/wheat.jpg');
  });

  it('returns empty imageUrl when image is null', () => {
    const raw = {
      title: 'Corn market update',
      description: 'Corn steady',
      url: 'https://bloomberg.com/1',
      image: null,
      publishedAt: '2026-03-03T09:00:00Z',
      source: { name: 'Bloomberg', url: 'https://bloomberg.com' },
    };

    const result = newsService.parseArticle(raw);

    expect(result.imageUrl).toBe('');
  });

  it('filters articles with missing title or url', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [
          {
            title: '',
            description: 'No title',
            url: 'https://example.com',
            image: null,
            publishedAt: '2026-03-03T08:00:00Z',
            source: { name: 'Test', url: '' },
          },
          {
            title: 'Wheat update',
            description: 'Wheat news',
            url: 'https://reuters.com/wheat',
            image: 'https://img.example.com/wheat.jpg',
            publishedAt: '2026-03-03T08:00:00Z',
            source: { name: 'Reuters', url: 'https://reuters.com' },
          },
        ],
      }),
    });

    process.env.EXPO_PUBLIC_GNEWS_KEY = 'test-key';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Wheat update');
    });
  });

  it('returns empty array when API key is missing', () => {
    const original = process.env.EXPO_PUBLIC_GNEWS_KEY;
    process.env.EXPO_PUBLIC_GNEWS_KEY = '';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(0);
      process.env.EXPO_PUBLIC_GNEWS_KEY = original;
    });
  });

  it('returns empty array when fetch fails', () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    process.env.EXPO_PUBLIC_GNEWS_KEY = 'test-key';
    return newsService.getAgriNews().then((results) => {
      expect(results).toHaveLength(0);
    });
  });
});
```

---

### Step 3: Run the tests — expect FAIL

```bash
cd front-end && npx jest src/services/__tests__/newsService.test.ts --no-coverage
```

Expected: FAIL — `parseArticle` doesn't accept GNews shape, no `imageUrl` field.

---

### Step 4: Rewrite newsService.ts

Replace the full contents of `front-end/src/services/newsService.ts`:

```typescript
// GNews Open Platform API — https://gnews.io/docs/v4
// Free tier: 100 req/day, works from any device/origin
const BASE_URL = 'https://gnews.io/api/v4/search';

const SEARCH_QUERY = 'wheat OR corn OR cotton OR sugar OR coffee OR agriculture';

export interface NewsArticle {
  title: string;
  source: string;
  description: string;
  url: string;
  publishedAt: string;
  imageUrl: string;
}

interface GNewsSource {
  name: string;
  url: string;
}

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: GNewsSource;
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

function parseArticle(raw: GNewsArticle): NewsArticle {
  return {
    title: raw.title ?? '',
    source: raw.source?.name ?? 'GNews',
    description: raw.description ?? '',
    url: raw.url ?? '',
    publishedAt: raw.publishedAt ?? '',
    imageUrl: raw.image ?? '',
  };
}

async function getAgriNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.EXPO_PUBLIC_GNEWS_KEY ?? '';

  if (!apiKey) {
    console.warn('[newsService] No GNews API key set');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: SEARCH_QUERY,
      lang: 'en',
      max: '10',
      apikey: apiKey,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      console.warn(`[newsService] GNews fetch failed: ${response.status}`);
      return [];
    }

    const json = (await response.json()) as GNewsResponse;
    const articles = json?.articles ?? [];

    return articles
      .filter((a) => a.title && a.url)
      .map(parseArticle);
  } catch (error) {
    console.warn('[newsService] Error:', error);
    return [];
  }
}

export const newsService = {
  getAgriNews,
  parseArticle,
};
```

---

### Step 5: Run tests — expect PASS

```bash
cd front-end && npx jest src/services/__tests__/newsService.test.ts --no-coverage
```

Expected: PASS (5 tests)

---

### Step 6: Run lint

```bash
cd front-end && npx eslint src/services/newsService.ts src/services/__tests__/newsService.test.ts --fix
```

Expected: no errors

---

### Step 7: Commit

```bash
cd front-end && git add src/services/newsService.ts src/services/__tests__/newsService.test.ts .env .env.example
git commit -m "feat: switch news service from Guardian to GNews API with image support"
```

---

## Task 2: Redesign NewsSection — Uniform Image Cards

**Files:**
- Modify: `front-end/src/features/dashboard/screens/shared/IntelligenceScreen.tsx`

**Context:** `expo-linear-gradient` is already installed (used by `GradientBackground.tsx`). `react-native-reanimated` `withRepeat`/`withSequence` available.

---

### Step 1: Replace the NewsSection component

In `IntelligenceScreen.tsx`, make the following changes:

**Add to imports at top of file:**
```typescript
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ImageIcon, withRepeat, withSequence } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat as reanimatedWithRepeat,
  withSequence as reanimatedWithSequence,
} from 'react-native-reanimated';
```

> Note: `withRepeat` and `withSequence` come from `react-native-reanimated`, NOT from lucide. Remove them from the lucide import line. The full corrected imports block:

```typescript
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton, GlassInput } from '../../../../design-system';
import { COLORS, GLASS } from '../../../../design-system/tokens';
import { useMarketStore, PriceAlert } from '../../../../stores/market.store';
import { CommoditySymbol } from '../../../../services';
```

---

### Step 2: Add SkeletonNewsCard component (above NewsSection)

Add this component between the helpers section and the PriceTicker component:

```typescript
const SkeletonNewsCard: React.FC = () => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 700 }),
        withTiming(0.3, { duration: 700 })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.skeletonCard, animStyle]}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLineFull} />
        <View style={styles.skeletonLineHalf} />
      </View>
    </Animated.View>
  );
};
```

---

### Step 3: Replace the NewsSection component entirely

Replace the existing `NewsSection` component with:

```typescript
const NewsSection: React.FC = () => {
  const news = useMarketStore((s) => s.news);
  const isLoading = useMarketStore((s) => s.isLoadingNews);

  const openArticle = useCallback((url: string) => {
    Linking.openURL(url).catch(() => {
      console.warn('[IntelligenceScreen] Could not open URL:', url);
    });
  }, []);

  return (
    <View>
      <Text style={styles.sectionTitle}>📰 LIVE NEWS</Text>

      {isLoading && news.length === 0 && (
        <>
          <SkeletonNewsCard />
          <SkeletonNewsCard />
          <SkeletonNewsCard />
        </>
      )}

      {!isLoading && news.length === 0 && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>No agricultural news — pull to refresh</Text>
        </GlassCard>
      )}

      {news.map((article, index) => (
        <TouchableOpacity
          key={`${article.url}-${index}`}
          onPress={() => openArticle(article.url)}
          activeOpacity={0.75}
          style={styles.newsCardWrapper}
        >
          <GlassCard tier="subtle" noPadding animate delay={index * 50}>
            {/* Image */}
            <View style={styles.newsImageContainer}>
              {article.imageUrl ? (
                <Image
                  source={{ uri: article.imageUrl }}
                  style={styles.newsImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.newsImagePlaceholder}>
                  <ImageIcon size={22} color={COLORS.textMuted} />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.45)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            </View>

            {/* Content */}
            <View style={styles.newsContent}>
              <View style={styles.newsCardHeader}>
                <GlassBadge label={article.source} variant="muted" />
                <Text style={styles.newsTime}>{formatTimeAgo(article.publishedAt)}</Text>
              </View>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {article.title}
              </Text>
              {!!article.description && (
                <Text style={styles.newsDescription} numberOfLines={2}>
                  {article.description}
                </Text>
              )}
            </View>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
};
```

---

### Step 4: Add new styles for NewsSection + skeleton

In the `StyleSheet.create({...})` block, replace all existing `news*` and `ticker*` styles AND add these new ones. Keep all non-news styles intact. The new/replaced styles:

```typescript
// ── News ──
newsCardWrapper: {
  marginBottom: 10,
},
newsContent: {
  padding: 12,
},
newsCardHeader: {
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 6,
},
newsDescription: {
  color: COLORS.textMuted,
  fontSize: 12,
  lineHeight: 17,
  marginTop: 4,
},
newsImage: {
  height: 140,
  width: '100%',
},
newsImageContainer: {
  height: 140,
  overflow: 'hidden',
  width: '100%',
},
newsImagePlaceholder: {
  alignItems: 'center',
  backgroundColor: 'rgba(255,255,255,0.05)',
  height: 140,
  justifyContent: 'center',
  width: '100%',
},
newsTime: {
  color: COLORS.textMuted,
  fontSize: 11,
},
newsTitle: {
  color: COLORS.textPrimary,
  fontSize: 14,
  fontWeight: '600',
  lineHeight: 19,
},
// ── Skeleton ──
skeletonBody: {
  gap: 8,
  padding: 12,
},
skeletonCard: {
  backgroundColor: GLASS.subtle.fill,
  borderColor: GLASS.subtle.border,
  borderRadius: 16,
  borderWidth: 1,
  marginBottom: 10,
  overflow: 'hidden',
},
skeletonImage: {
  backgroundColor: 'rgba(255,255,255,0.07)',
  height: 140,
  width: '100%',
},
skeletonLineFull: {
  backgroundColor: 'rgba(255,255,255,0.08)',
  borderRadius: 4,
  height: 12,
  width: '90%',
},
skeletonLineHalf: {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderRadius: 4,
  height: 10,
  width: '60%',
},
```

> All StyleSheet keys must remain in alphabetical order — `react-native/sort-styles` ESLint rule. Merge new keys into the correct alphabetical positions in the existing object.

---

### Step 5: Run lint and fix

```bash
cd front-end && npx eslint src/features/dashboard/screens/shared/IntelligenceScreen.tsx --fix
```

Expected: no errors (sort-styles will auto-fix alphabetical order)

---

### Step 6: Commit

```bash
cd front-end && git add src/features/dashboard/screens/shared/IntelligenceScreen.tsx
git commit -m "feat: news section with image cards and skeleton loading"
```

---

## Task 3: Redesign AlertsSection — Compact Pill Rows

**Files:**
- Modify: `front-end/src/features/dashboard/screens/shared/IntelligenceScreen.tsx`

---

### Step 1: Add commodity emojis map and update COMMODITY_NAMES

In IntelligenceScreen.tsx, update the `COMMODITY_NAMES` constant and add `COMMODITY_EMOJI` right after it:

```typescript
const COMMODITY_NAMES: Record<CommoditySymbol, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  COTTON: 'Cotton',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
};

const COMMODITY_EMOJI: Record<CommoditySymbol, string> = {
  WHEAT: '🌾',
  CORN: '🌽',
  COTTON: '🪴',
  SUGAR: '🍬',
  COFFEE: '☕',
};
```

---

### Step 2: Replace AlertsSection component entirely

Replace the full `AlertsSection` component with:

```typescript
const AlertsSection: React.FC = () => {
  const alerts = useMarketStore((s) => s.alerts);
  const prices = useMarketStore((s) => s.prices);
  const addAlert = useMarketStore((s) => s.addAlert);
  const removeAlert = useMarketStore((s) => s.removeAlert);

  const [isAdding, setIsAdding] = useState(false);
  const [newSymbol, setNewSymbol] = useState<CommoditySymbol>('WHEAT');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');
  const [newThreshold, setNewThreshold] = useState('');

  const availableSymbols = prices.map((p) => p.symbol);
  const displaySymbols: CommoditySymbol[] =
    availableSymbols.length > 0 ? availableSymbols : ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE'];

  const handleAdd = useCallback(() => {
    const threshold = parseFloat(newThreshold);
    if (!isNaN(threshold) && threshold > 0) {
      addAlert({ symbol: newSymbol, condition: newCondition, threshold });
      setNewThreshold('');
      setIsAdding(false);
    }
  }, [addAlert, newSymbol, newCondition, newThreshold]);

  return (
    <View>
      {/* Header row with inline + ADD button */}
      <View style={styles.alertsHeader}>
        <Text style={styles.sectionTitle}>🔔 PRICE ALERTS ({alerts.length} active)</Text>
        {!isAdding && (
          <GlassButton label="+ ADD" onPress={() => setIsAdding(true)} variant="ghost" size="sm" />
        )}
      </View>

      {/* Empty state */}
      {alerts.length === 0 && !isAdding && (
        <GlassCard tier="subtle">
          <View style={styles.alertsEmpty}>
            <Text style={styles.alertsEmptyIcon}>🔔</Text>
            <Text style={styles.alertsEmptyTitle}>No price alerts set</Text>
            <Text style={styles.alertsEmptySubtitle}>Tap + to monitor a commodity</Text>
          </View>
        </GlassCard>
      )}

      {/* Alert pill rows */}
      {alerts.map((alert: PriceAlert) => (
        <GlassCard
          key={alert.id}
          tier="subtle"
          style={[styles.alertPillCard, alert.triggered && styles.alertPillCardTriggered]}
        >
          <View style={styles.alertPillRow}>
            {/* Commodity */}
            <Text style={styles.alertPillCommodity}>
              {COMMODITY_EMOJI[alert.symbol] ?? '📊'}{' '}
              <Text style={styles.alertPillName}>
                {COMMODITY_NAMES[alert.symbol] ?? alert.symbol}
              </Text>
            </Text>

            {/* Condition chip */}
            <View
              style={[
                styles.condPill,
                alert.condition === 'above' ? styles.condPillUp : styles.condPillDown,
              ]}
            >
              <Text
                style={[
                  styles.condPillText,
                  alert.condition === 'above' ? styles.condPillTextUp : styles.condPillTextDown,
                ]}
              >
                {alert.condition === 'above' ? '▲ ABOVE' : '▼ BELOW'}
              </Text>
            </View>

            {/* Threshold */}
            <Text style={styles.alertPillThreshold}>${alert.threshold.toFixed(2)}</Text>

            {/* Status chip */}
            <GlassBadge
              label={alert.triggered ? '✓ HIT' : '● LIVE'}
              variant={alert.triggered ? 'gold' : 'muted'}
            />

            {/* Remove */}
            <TouchableOpacity onPress={() => removeAlert(alert.id)} hitSlop={8}>
              <Text style={styles.alertPillRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      {/* Add form — appears inline below header when isAdding */}
      {isAdding && (
        <GlassCard tier="medium">
          <Text style={styles.addAlertLabel}>Commodity</Text>
          <View style={styles.symbolRow}>
            {displaySymbols.map((sym) => (
              <TouchableOpacity
                key={sym}
                style={[styles.symbolChip, newSymbol === sym && styles.symbolChipActive]}
                onPress={() => setNewSymbol(sym)}
              >
                <Text
                  style={[
                    styles.symbolChipText,
                    newSymbol === sym && styles.symbolChipTextActive,
                  ]}
                >
                  {COMMODITY_EMOJI[sym]} {COMMODITY_NAMES[sym] ?? sym}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addAlertLabel}>Condition</Text>
          <View style={styles.conditionRow}>
            {(['above', 'below'] as const).map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[styles.condChip, newCondition === cond && styles.condChipActive]}
                onPress={() => setNewCondition(cond)}
              >
                {cond === 'above' ? (
                  <ChevronUp
                    size={12}
                    color={newCondition === cond ? COLORS.accentGreen : COLORS.textMuted}
                  />
                ) : (
                  <ChevronDown
                    size={12}
                    color={newCondition === cond ? COLORS.danger : COLORS.textMuted}
                  />
                )}
                <Text
                  style={[
                    styles.condChipText,
                    newCondition === cond &&
                      (cond === 'above' ? styles.condChipTextUp : styles.condChipTextDown),
                  ]}
                >
                  {cond.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addAlertLabel}>Threshold (USD)</Text>
          <GlassInput
            placeholder="e.g. 7.50"
            value={newThreshold}
            onChangeText={setNewThreshold}
            keyboardType="decimal-pad"
            containerStyle={styles.thresholdInput}
          />
          <View style={styles.thresholdRow}>
            <GlassButton
              label="Cancel"
              onPress={() => setIsAdding(false)}
              variant="ghost"
              size="sm"
            />
            <GlassButton label="Set Alert" onPress={handleAdd} variant="primary" size="sm" />
          </View>
        </GlassCard>
      )}
    </View>
  );
};
```

---

### Step 3: Add new alert styles to StyleSheet

Add these to the StyleSheet (in alphabetical order):

```typescript
alertPillCard: {
  marginBottom: 6,
},
alertPillCardTriggered: {
  borderColor: 'rgba(252,211,77,0.28)',
},
alertPillCommodity: {
  color: COLORS.textSecondary,
  fontSize: 13,
  minWidth: 76,
},
alertPillName: {
  color: COLORS.textPrimary,
  fontWeight: '700',
},
alertPillRemove: {
  color: COLORS.danger,
  fontSize: 13,
  fontWeight: '700',
},
alertPillRow: {
  alignItems: 'center',
  flexDirection: 'row',
  gap: 8,
},
alertPillThreshold: {
  color: COLORS.accentGold,
  flex: 1,
  fontSize: 13,
  fontWeight: '700',
},
alertsEmpty: {
  alignItems: 'center',
  gap: 6,
  paddingVertical: 8,
},
alertsEmptyIcon: {
  fontSize: 28,
},
alertsEmptySubtitle: {
  color: COLORS.textMuted,
  fontSize: 12,
},
alertsEmptyTitle: {
  color: COLORS.textSecondary,
  fontSize: 13,
  fontWeight: '600',
},
alertsHeader: {
  alignItems: 'center',
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 8,
},
condPill: {
  borderRadius: 6,
  borderWidth: 1,
  paddingHorizontal: 7,
  paddingVertical: 3,
},
condPillDown: {
  backgroundColor: 'rgba(248,113,113,0.12)',
  borderColor: 'rgba(248,113,113,0.28)',
},
condPillText: {
  fontSize: 10,
  fontWeight: '700',
  letterSpacing: 0.4,
},
condPillTextDown: {
  color: COLORS.danger,
},
condPillTextUp: {
  color: COLORS.accentGreen,
},
condPillUp: {
  backgroundColor: 'rgba(74,222,128,0.12)',
  borderColor: 'rgba(74,222,128,0.28)',
},
```

Also remove the old `alertCard`, `alertLeft`, `alertRow`, `alertSymbol`, `alertText`, `alertThreshold`, `removeText` styles — they are replaced.

---

### Step 4: Remove the `sectionTitle` margin conflict

The `alertsHeader` now contains `sectionTitle`. Since `sectionTitle` has `marginBottom: 8` and `alertsHeader` also has `marginBottom: 8`, set `sectionTitle` style inside the alerts header to have no margin:

Add a new `sectionTitleNoMargin` style:
```typescript
sectionTitleNoMargin: {
  color: COLORS.textSecondary,
  fontSize: 11,
  fontWeight: '700',
  letterSpacing: 1,
  marginBottom: 0,
  textTransform: 'uppercase',
},
```

In AlertsSection, use `sectionTitleNoMargin` instead of `sectionTitle` for the alerts header text.

---

### Step 5: Run lint and fix

```bash
cd front-end && npx eslint src/features/dashboard/screens/shared/IntelligenceScreen.tsx --fix
```

Expected: no errors

---

### Step 6: Commit

```bash
cd front-end && git add src/features/dashboard/screens/shared/IntelligenceScreen.tsx
git commit -m "feat: alerts section redesign with compact pill rows and empty state"
```

---

## Task 4: Final verification

### Step 1: Run full test suite

```bash
cd front-end && npx jest --no-coverage 2>&1 | tail -20
```

Expected: all tests PASS, no failures.

### Step 2: Run full lint

```bash
cd front-end && npx eslint src/ --max-warnings=0 2>&1 | tail -20
```

Expected: 0 errors, 0 warnings.

### Step 3: Commit if anything was auto-fixed

```bash
cd front-end && git diff --quiet || git commit -am "chore: lint fixes"
```

### Step 4: Push

```bash
git push
```
