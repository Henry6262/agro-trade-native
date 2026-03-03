# Market Intelligence Screen Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded mock IntelligenceScreen with a live market dashboard showing real commodity prices (Alpha Vantage), live agri news (NewsAPI), and user-set price alerts wired into the existing notification system.

**Architecture:** Single scrollable screen (Option C) with three stacked sections — horizontal price ticker, live news feed, and price alerts. Data lives in a new Zustand store (`market.store.ts`) with TTL-based caching so API calls are minimal. All external calls go through two new service files; the screen only reads from the store.

**Tech Stack:** React Native, Zustand (already installed), Alpha Vantage REST API, NewsAPI REST API, existing `notification.store.ts` + `NotificationBanner.tsx` for alert firings, Jest + `@testing-library/react-native` for tests.

---

## Context You Need

- **Design doc:** `docs/plans/2026-03-03-market-intelligence-screen-design.md` — read this first
- **Existing store pattern:** Look at any file in `src/store/` for Zustand `create` + `persist` usage (there is no `store/` dir yet — you are creating the first one)
- **Existing notification store:** `src/store/notification.store.ts` — you will call `addNotification()` from it
- **Existing services pattern:** `src/services/negotiationService.ts` — follow this pattern (typed functions, named exports, axios via `api.ts`)
- **Design system:** Use `GlassCard`, `GlassBadge`, `GlassButton` from `src/design-system/`. Import `COLORS` from `src/design-system/tokens.ts`. NEVER hardcode colors.
- **Lint rules:** Run `npx eslint <file> --fix` after every file you write. StyleSheet keys must be alphabetical (`react-native/sort-styles`). No inline styles (`react-native/no-inline-styles`).
- **Test runner:** `npx jest --testPathPattern=<filename> --no-coverage`

---

## Task 1: Add API Keys to Environment

**Files:**
- Modify: `.env`
- Modify: `.env.example`

**Step 1: Add keys to `.env`**

Append to `/front-end/.env`:
```
# Market Intelligence
EXPO_PUBLIC_ALPHA_VANTAGE_KEY=demo
EXPO_PUBLIC_NEWS_API_KEY=your_newsapi_key_here
```

> Note: `demo` is a real Alpha Vantage demo key that works for `IBM` stock but NOT commodities. The user must register at https://www.alphavantage.co/support/#api-key (free, instant) and replace `demo` with their real key. Similarly for NewsAPI at https://newsapi.org/register.

**Step 2: Add keys to `.env.example`**

Append to `/front-end/.env.example`:
```
# Market Intelligence — Alpha Vantage (free): https://www.alphavantage.co/support/#api-key
EXPO_PUBLIC_ALPHA_VANTAGE_KEY=your_alpha_vantage_key_here
# Market Intelligence — NewsAPI (free): https://newsapi.org/register
EXPO_PUBLIC_NEWS_API_KEY=your_newsapi_key_here
```

**Step 3: Commit**
```bash
git add .env.example
git commit -m "chore: add market intelligence API key placeholders to env"
```
> Do NOT commit `.env` itself (it's gitignored).

---

## Task 2: Create `marketDataService.ts`

**Files:**
- Create: `src/services/marketDataService.ts`
- Create: `src/services/__tests__/marketDataService.test.ts`

**Step 1: Write the failing test**

Create `src/services/__tests__/marketDataService.test.ts`:
```typescript
import { marketDataService } from '../marketDataService';

// Mock fetch since we're in a test environment
global.fetch = jest.fn();

describe('marketDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseCommodityResponse', () => {
    it('extracts price and change from Alpha Vantage response', () => {
      const mockResponse = {
        name: 'Wheat',
        unit: 'dollar per bushel',
        data: [
          { date: '2026-03-03', value: '6.43' },
          { date: '2026-02-28', value: '6.31' },
        ],
      };

      const result = marketDataService.parseResponse('WHEAT', mockResponse);

      expect(result.symbol).toBe('WHEAT');
      expect(result.name).toBe('Wheat');
      expect(result.price).toBe(6.43);
      expect(result.change).toBeCloseTo(0.12, 1);
      expect(result.changePct).toBeCloseTo(1.9, 0);
      expect(result.unit).toBe('dollar per bushel');
    });

    it('handles single data point (no previous price)', () => {
      const mockResponse = {
        name: 'Corn',
        unit: 'dollar per bushel',
        data: [{ date: '2026-03-03', value: '4.87' }],
      };

      const result = marketDataService.parseResponse('CORN', mockResponse);

      expect(result.price).toBe(4.87);
      expect(result.change).toBe(0);
      expect(result.changePct).toBe(0);
    });

    it('handles missing or null value gracefully', () => {
      const mockResponse = {
        name: 'Cotton',
        unit: 'dollar per pound',
        data: [{ date: '2026-03-03', value: '.' }],
      };

      const result = marketDataService.parseResponse('COTTON', mockResponse);

      expect(result.price).toBe(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**
```bash
cd front-end && npx jest --testPathPattern=marketDataService --no-coverage
```
Expected: FAIL — `marketDataService` not found.

**Step 3: Create `src/services/marketDataService.ts`**

```typescript
const BASE_URL = 'https://www.alphavantage.co/query';

const COMMODITY_SYMBOLS = ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'NATURAL_GAS'] as const;

export type CommoditySymbol = (typeof COMMODITY_SYMBOLS)[number];

export interface CommodityPrice {
  symbol: CommoditySymbol;
  name: string;
  price: number;
  change: number;
  changePct: number;
  unit: string;
  updatedAt: string;
}

interface AlphaVantageDataPoint {
  date: string;
  value: string;
}

interface AlphaVantageResponse {
  name: string;
  unit: string;
  data: AlphaVantageDataPoint[];
}

function parseResponse(symbol: CommoditySymbol, raw: AlphaVantageResponse): CommodityPrice {
  const data = raw.data ?? [];
  const latestRaw = data[0]?.value ?? '.';
  const previousRaw = data[1]?.value ?? '.';

  const price = latestRaw === '.' ? 0 : parseFloat(latestRaw);
  const previous = previousRaw === '.' ? price : parseFloat(previousRaw);
  const change = parseFloat((price - previous).toFixed(4));
  const changePct = previous === 0 ? 0 : parseFloat(((change / previous) * 100).toFixed(2));

  return {
    symbol,
    name: raw.name ?? symbol,
    price,
    change,
    changePct,
    unit: raw.unit ?? '',
    updatedAt: data[0]?.date ?? new Date().toISOString(),
  };
}

async function fetchCommodity(
  symbol: CommoditySymbol,
  apiKey: string
): Promise<CommodityPrice | null> {
  try {
    const url = `${BASE_URL}?function=${symbol}&interval=monthly&apikey=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[marketDataService] ${symbol} fetch failed: ${response.status}`);
      return null;
    }

    const json = (await response.json()) as AlphaVantageResponse;
    return parseResponse(symbol, json);
  } catch (error) {
    console.warn(`[marketDataService] ${symbol} error:`, error);
    return null;
  }
}

async function getPrices(): Promise<CommodityPrice[]> {
  const apiKey = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_KEY ?? '';

  if (!apiKey) {
    console.warn('[marketDataService] No Alpha Vantage API key set');
    return [];
  }

  const results = await Promise.all(
    COMMODITY_SYMBOLS.map((symbol) => fetchCommodity(symbol, apiKey))
  );

  return results.filter((r): r is CommodityPrice => r !== null);
}

export const marketDataService = {
  getPrices,
  parseResponse, // exported for testing
};
```

**Step 4: Run tests to verify they pass**
```bash
npx jest --testPathPattern=marketDataService --no-coverage
```
Expected: PASS (3 tests).

**Step 5: Lint**
```bash
npx eslint src/services/marketDataService.ts --fix
```
Expected: 0 errors.

**Step 6: Commit**
```bash
git add src/services/marketDataService.ts src/services/__tests__/marketDataService.test.ts
git commit -m "feat: add marketDataService with Alpha Vantage integration"
```

---

## Task 3: Create `newsService.ts`

**Files:**
- Create: `src/services/newsService.ts`
- Create: `src/services/__tests__/newsService.test.ts`

**Step 1: Write the failing test**

Create `src/services/__tests__/newsService.test.ts`:
```typescript
import { newsService } from '../newsService';

global.fetch = jest.fn();

describe('newsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps NewsAPI articles to NewsArticle shape', () => {
    const raw = {
      title: 'Wheat prices surge amid dry weather',
      source: { name: 'Reuters' },
      description: 'Global wheat futures climbed...',
      url: 'https://reuters.com/article/123',
      publishedAt: '2026-03-03T10:00:00Z',
    };

    const result = newsService.parseArticle(raw);

    expect(result.title).toBe('Wheat prices surge amid dry weather');
    expect(result.source).toBe('Reuters');
    expect(result.description).toBe('Global wheat futures climbed...');
    expect(result.url).toBe('https://reuters.com/article/123');
    expect(result.publishedAt).toBe('2026-03-03T10:00:00Z');
  });

  it('filters out articles with [Removed] title', () => {
    const articles = [
      { title: '[Removed]', source: { name: 'Unknown' }, description: '', url: '', publishedAt: '' },
      { title: 'Corn market update', source: { name: 'Bloomberg' }, description: 'Corn steady', url: 'https://bloomberg.com/1', publishedAt: '2026-03-03T09:00:00Z' },
    ];

    const results = articles
      .filter((a) => a.title !== '[Removed]')
      .map(newsService.parseArticle);

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Corn market update');
  });
});
```

**Step 2: Run test to verify it fails**
```bash
npx jest --testPathPattern=newsService --no-coverage
```
Expected: FAIL.

**Step 3: Create `src/services/newsService.ts`**

```typescript
const BASE_URL = 'https://newsapi.org/v2/everything';

const QUERY =
  'agricultural commodities OR wheat prices OR corn market OR coffee futures OR cotton prices OR sugar prices';

export interface NewsArticle {
  title: string;
  source: string;
  description: string;
  url: string;
  publishedAt: string;
}

interface RawArticle {
  title: string;
  source: { name: string };
  description: string;
  url: string;
  publishedAt: string;
}

function parseArticle(raw: RawArticle): NewsArticle {
  return {
    title: raw.title ?? '',
    source: raw.source?.name ?? 'Unknown',
    description: raw.description ?? '',
    url: raw.url ?? '',
    publishedAt: raw.publishedAt ?? '',
  };
}

async function getAgriNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '';

  if (!apiKey) {
    console.warn('[newsService] No NewsAPI key set');
    return [];
  }

  try {
    const params = new URLSearchParams({
      q: QUERY,
      sortBy: 'publishedAt',
      language: 'en',
      pageSize: '20',
      apiKey,
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);

    if (!response.ok) {
      console.warn(`[newsService] Fetch failed: ${response.status}`);
      return [];
    }

    const json = await response.json() as { articles: RawArticle[] };
    const articles = json.articles ?? [];

    return articles
      .filter((a) => a.title !== '[Removed]' && a.url)
      .map(parseArticle);
  } catch (error) {
    console.warn('[newsService] Error:', error);
    return [];
  }
}

export const newsService = {
  getAgriNews,
  parseArticle, // exported for testing
};
```

**Step 4: Run tests**
```bash
npx jest --testPathPattern=newsService --no-coverage
```
Expected: PASS.

**Step 5: Lint**
```bash
npx eslint src/services/newsService.ts --fix
```

**Step 6: Commit**
```bash
git add src/services/newsService.ts src/services/__tests__/newsService.test.ts
git commit -m "feat: add newsService with NewsAPI integration"
```

---

## Task 4: Create `market.store.ts`

**Files:**
- Create: `src/store/market.store.ts`
- Create: `src/store/__tests__/market.store.test.ts`

**Context:** Look at how Zustand is used elsewhere in the codebase (`src/store/notification.store.ts`) for the `create` + `persist` pattern. The `store/` directory doesn't exist yet — create it.

**Step 1: Write the failing test**

Create `src/store/__tests__/market.store.test.ts`:
```typescript
import { useMarketStore } from '../market.store';
import { act, renderHook } from '@testing-library/react-native';

// Reset store between tests
beforeEach(() => {
  useMarketStore.setState({
    prices: [],
    news: [],
    alerts: [],
    isLoadingPrices: false,
    isLoadingNews: false,
    lastPriceFetch: 0,
    lastNewsFetch: 0,
  });
});

describe('market.store — alerts', () => {
  it('adds a new alert', () => {
    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.addAlert({ symbol: 'WHEAT', condition: 'above', threshold: 7.0 });
    });

    expect(result.current.alerts).toHaveLength(1);
    expect(result.current.alerts[0].symbol).toBe('WHEAT');
    expect(result.current.alerts[0].triggered).toBe(false);
  });

  it('removes an alert by id', () => {
    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.addAlert({ symbol: 'CORN', condition: 'below', threshold: 4.0 });
    });

    const id = result.current.alerts[0].id;

    act(() => {
      result.current.removeAlert(id);
    });

    expect(result.current.alerts).toHaveLength(0);
  });
});

describe('market.store — checkAlerts', () => {
  it('marks alert as triggered and does not double-trigger', () => {
    useMarketStore.setState({
      prices: [
        {
          symbol: 'WHEAT',
          name: 'Wheat',
          price: 7.5,
          change: 0.1,
          changePct: 1.4,
          unit: 'dollar per bushel',
          updatedAt: '2026-03-03',
        },
      ],
      alerts: [
        {
          id: 'alert-1',
          symbol: 'WHEAT',
          condition: 'above',
          threshold: 7.0,
          triggered: false,
          createdAt: new Date().toISOString(),
        },
      ],
    } as Parameters<typeof useMarketStore.setState>[0]);

    const { result } = renderHook(() => useMarketStore());

    act(() => {
      result.current.checkAlerts();
    });

    expect(result.current.alerts[0].triggered).toBe(true);

    // Second check should not re-trigger (already triggered)
    act(() => {
      result.current.checkAlerts();
    });

    // triggered stays true, no duplicate notifications
    expect(result.current.alerts[0].triggered).toBe(true);
  });
});
```

**Step 2: Run to verify it fails**
```bash
npx jest --testPathPattern=market.store --no-coverage
```
Expected: FAIL.

**Step 3: Create `src/store/market.store.ts`**

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommodityPrice, CommoditySymbol } from '../services/marketDataService';
import { NewsArticle } from '../services/newsService';

export interface PriceAlert {
  id: string;
  symbol: CommoditySymbol;
  condition: 'above' | 'below';
  threshold: number;
  triggered: boolean;
  createdAt: string;
}

const PRICE_TTL_MS = 15 * 60 * 1000; // 15 minutes
const NEWS_TTL_MS = 30 * 60 * 1000;  // 30 minutes

interface MarketState {
  alerts: PriceAlert[];
  isLoadingNews: boolean;
  isLoadingPrices: boolean;
  lastNewsFetch: number;
  lastPriceFetch: number;
  news: NewsArticle[];
  prices: CommodityPrice[];
}

interface MarketActions {
  addAlert: (alert: Pick<PriceAlert, 'symbol' | 'condition' | 'threshold'>) => void;
  checkAlerts: () => void;
  fetchNews: () => Promise<void>;
  fetchPrices: () => Promise<void>;
  removeAlert: (id: string) => void;
}

const initialState: MarketState = {
  alerts: [],
  isLoadingNews: false,
  isLoadingPrices: false,
  lastNewsFetch: 0,
  lastPriceFetch: 0,
  news: [],
  prices: [],
};

export const useMarketStore = create<MarketState & MarketActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      addAlert: (alert) => {
        const newAlert: PriceAlert = {
          ...alert,
          id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          triggered: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ alerts: [...state.alerts, newAlert] }));
      },

      removeAlert: (id) => {
        set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) }));
      },

      checkAlerts: () => {
        const { alerts, prices } = get();
        let changed = false;

        const updated = alerts.map((alert) => {
          if (alert.triggered) return alert;

          const price = prices.find((p) => p.symbol === alert.symbol);
          if (!price) return alert;

          const isTriggered =
            (alert.condition === 'above' && price.price > alert.threshold) ||
            (alert.condition === 'below' && price.price < alert.threshold);

          if (isTriggered) {
            changed = true;
            // Fire in-app notification via notification store
            // Import lazily to avoid circular deps
            try {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              const { useNotificationStore } = require('./notification.store') as {
                useNotificationStore: { getState: () => { addNotification: (n: unknown) => void } };
              };
              useNotificationStore.getState().addNotification({
                title: 'Price Alert',
                body: `${alert.symbol} is ${alert.condition} $${alert.threshold.toFixed(2)} (now $${price.price.toFixed(2)})`,
                type: 'system',
              });
            } catch {
              // notification store not available in test env
            }
            return { ...alert, triggered: true };
          }

          return alert;
        });

        if (changed) set({ alerts: updated });
      },

      fetchPrices: async () => {
        const { lastPriceFetch, isLoadingPrices } = get();
        if (isLoadingPrices) return;
        if (Date.now() - lastPriceFetch < PRICE_TTL_MS) return;

        set({ isLoadingPrices: true });
        try {
          const { marketDataService } = await import('../services/marketDataService');
          const prices = await marketDataService.getPrices();
          set({ prices, lastPriceFetch: Date.now() });
          get().checkAlerts();
        } finally {
          set({ isLoadingPrices: false });
        }
      },

      fetchNews: async () => {
        const { lastNewsFetch, isLoadingNews } = get();
        if (isLoadingNews) return;
        if (Date.now() - lastNewsFetch < NEWS_TTL_MS) return;

        set({ isLoadingNews: true });
        try {
          const { newsService } = await import('../services/newsService');
          const news = await newsService.getAgriNews();
          set({ news, lastNewsFetch: Date.now() });
        } finally {
          set({ isLoadingNews: false });
        }
      },
    }),
    {
      name: 'market-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        alerts: state.alerts,
        // Don't persist prices/news — always refetch on mount
      }),
    }
  )
);
```

**Step 4: Run tests**
```bash
npx jest --testPathPattern=market.store --no-coverage
```
Expected: PASS.

**Step 5: Lint**
```bash
npx eslint src/store/market.store.ts --fix
```

**Step 6: Commit**
```bash
git add src/store/ src/services/marketDataService.ts src/services/newsService.ts
git commit -m "feat: add market.store with prices, news, and price alert logic"
```

---

## Task 5: Rewrite `IntelligenceScreen.tsx` — Price Ticker Section

**Files:**
- Modify: `src/features/dashboard/screens/shared/IntelligenceScreen.tsx`

**Context:** This is a full rewrite. The old file (534 lines of mock data) is being replaced entirely. Keep the same default export name and function signature so nav doesn't break.

**Step 1: Replace the file entirely**

```typescript
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
} from 'lucide-react-native';
import { GlassCard, GlassBadge, GlassButton } from '../../../../design-system';
import { COLORS } from '../../../../design-system/tokens';
import { useMarketStore, PriceAlert } from '../../../../store/market.store';
import { CommoditySymbol } from '../../../../services/marketDataService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface IntelligenceScreenProps {
  id?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(isoString: string): string {
  const ms = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatLastUpdated(timestamp: number): string {
  if (!timestamp) return 'never';
  return formatTimeAgo(new Date(timestamp).toISOString());
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const PriceTicker: React.FC = () => {
  const prices = useMarketStore((s) => s.prices);
  const isLoading = useMarketStore((s) => s.isLoadingPrices);

  if (isLoading && prices.length === 0) {
    return (
      <GlassCard tier="subtle" style={styles.tickerCard}>
        <ActivityIndicator color={COLORS.accentGreen} />
      </GlassCard>
    );
  }

  if (!isLoading && prices.length === 0) {
    return (
      <GlassCard tier="subtle" style={styles.tickerCard}>
        <Text style={styles.emptyText}>Unable to load prices</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard tier="subtle" noPadding style={styles.tickerCard}>
      <FlatList
        data={prices}
        horizontal
        keyExtractor={(item) => item.symbol}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tickerList}
        renderItem={({ item }) => {
          const isUp = item.change >= 0;
          const changeColor = isUp ? COLORS.accentGreen : COLORS.danger;
          const ChangeIcon = isUp ? TrendingUp : TrendingDown;

          return (
            <View style={styles.tickerItem}>
              <Text style={styles.tickerSymbol}>{item.symbol}</Text>
              <Text style={styles.tickerPrice}>${item.price.toFixed(2)}</Text>
              <View style={styles.tickerChange}>
                <ChangeIcon size={10} color={changeColor} />
                <Text style={[styles.tickerChangePct, { color: changeColor }]}>
                  {item.changePct > 0 ? '+' : ''}
                  {item.changePct.toFixed(1)}%
                </Text>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.tickerSeparator} />}
      />
    </GlassCard>
  );
};

const StatsStrip: React.FC = () => {
  const prices = useMarketStore((s) => s.prices);
  const alerts = useMarketStore((s) => s.alerts);
  const lastPriceFetch = useMarketStore((s) => s.lastPriceFetch);

  return (
    <View style={styles.statsStrip}>
      <Text style={styles.statItem}>
        <Text style={styles.statValue}>{prices.length}</Text>
        <Text style={styles.statLabel}> tracked</Text>
      </Text>
      <View style={styles.statDot} />
      <Text style={styles.statItem}>
        <Text style={styles.statValue}>{alerts.length}</Text>
        <Text style={styles.statLabel}> alerts</Text>
      </Text>
      <View style={styles.statDot} />
      <Text style={styles.statLabel}>{formatLastUpdated(lastPriceFetch)}</Text>
    </View>
  );
};

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
        <GlassCard tier="subtle">
          <ActivityIndicator color={COLORS.accentGreen} />
        </GlassCard>
      )}

      {!isLoading && news.length === 0 && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>Check back soon</Text>
        </GlassCard>
      )}

      {news.map((article, index) => (
        <TouchableOpacity
          key={`${article.url}-${index}`}
          onPress={() => openArticle(article.url)}
          activeOpacity={0.75}
          style={styles.newsCardWrapper}
        >
          <GlassCard tier="subtle" animate delay={index * 40}>
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
          </GlassCard>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const COMMODITY_NAMES: Record<CommoditySymbol, string> = {
  WHEAT: 'Wheat',
  CORN: 'Corn',
  COTTON: 'Cotton',
  SUGAR: 'Sugar',
  COFFEE: 'Coffee',
  NATURAL_GAS: 'Gas',
};

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
    availableSymbols.length > 0
      ? availableSymbols
      : ['WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'NATURAL_GAS'];

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
      <Text style={styles.sectionTitle}>🔔 PRICE ALERTS ({alerts.length} active)</Text>

      {alerts.length === 0 && !isAdding && (
        <GlassCard tier="subtle">
          <Text style={styles.emptyText}>No alerts set. Tap below to add one.</Text>
        </GlassCard>
      )}

      {alerts.map((alert: PriceAlert) => (
        <GlassCard key={alert.id} tier="subtle" style={styles.alertCard}>
          <View style={styles.alertRow}>
            <View style={styles.alertLeft}>
              {alert.triggered ? (
                <Bell size={14} color={COLORS.accentGold} />
              ) : (
                <BellOff size={14} color={COLORS.textMuted} />
              )}
              <Text style={styles.alertText}>
                <Text style={styles.alertSymbol}>{COMMODITY_NAMES[alert.symbol] ?? alert.symbol}</Text>
                {' '}{alert.condition}{' '}
                <Text style={styles.alertThreshold}>${alert.threshold.toFixed(2)}</Text>
              </Text>
              {alert.triggered && (
                <GlassBadge label="TRIGGERED" variant="warning" />
              )}
            </View>
            <TouchableOpacity onPress={() => removeAlert(alert.id)} hitSlop={8}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      ))}

      {isAdding ? (
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
                  {COMMODITY_NAMES[sym] ?? sym}
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
                  <ChevronUp size={12} color={newCondition === cond ? COLORS.accentGreen : COLORS.textMuted} />
                ) : (
                  <ChevronDown size={12} color={newCondition === cond ? COLORS.danger : COLORS.textMuted} />
                )}
                <Text
                  style={[
                    styles.condChipText,
                    newCondition === cond && (cond === 'above' ? styles.condChipTextUp : styles.condChipTextDown),
                  ]}
                >
                  {cond.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.addAlertLabel}>Threshold (USD)</Text>
          <View style={styles.thresholdRow}>
            <GlassButton
              label="Cancel"
              onPress={() => setIsAdding(false)}
              variant="ghost"
              size="sm"
            />
            <GlassButton
              label="Set Alert"
              onPress={handleAdd}
              variant="primary"
              size="sm"
            />
          </View>
        </GlassCard>
      ) : (
        <GlassButton
          label="+ Set new alert"
          onPress={() => setIsAdding(true)}
          variant="ghost"
          size="sm"
        />
      )}
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function IntelligenceScreen({ id: _id }: IntelligenceScreenProps = {}) {
  const fetchPrices = useMarketStore((s) => s.fetchPrices);
  const fetchNews = useMarketStore((s) => s.fetchNews);
  const isLoadingPrices = useMarketStore((s) => s.isLoadingPrices);
  const isLoadingNews = useMarketStore((s) => s.isLoadingNews);

  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchPrices(), fetchNews()]);
  }, [fetchPrices, fetchNews]);

  const handleRefresh = useCallback(async () => {
    // Clear TTL so next fetch is forced
    useMarketStore.setState({ lastPriceFetch: 0, lastNewsFetch: 0 });
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.accentGreen}
        />
      }
    >
      <PriceTicker />
      <StatsStrip />
      <NewsSection />
      <AlertsSection />
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  addAlertLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  alertCard: {
    marginBottom: 6,
  },
  alertLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  alertRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertSymbol: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  alertText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  alertThreshold: {
    color: COLORS.accentGold,
    fontWeight: '700',
  },
  condChip: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  condChipActive: {
    borderColor: 'rgba(255,255,255,0.3)',
  },
  condChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  condChipTextDown: {
    color: COLORS.danger,
  },
  condChipTextUp: {
    color: COLORS.accentGreen,
  },
  conditionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  content: {
    gap: 12,
    padding: 16,
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  newsCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  newsCardWrapper: {
    marginBottom: 8,
  },
  newsDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
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
  removeText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  root: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statDot: {
    backgroundColor: COLORS.textMuted,
    borderRadius: 2,
    height: 3,
    width: 3,
  },
  statItem: {
    fontSize: 12,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  statsStrip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  symbolChip: {
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symbolChipActive: {
    backgroundColor: 'rgba(74,222,128,0.14)',
    borderColor: COLORS.accentGreen,
  },
  symbolChipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  symbolChipTextActive: {
    color: COLORS.accentGreen,
  },
  symbolRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  thresholdRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  tickerCard: {
    overflow: 'hidden',
  },
  tickerChange: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  tickerChangePct: {
    fontSize: 10,
    fontWeight: '600',
  },
  tickerItem: {
    alignItems: 'center',
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tickerList: {
    paddingHorizontal: 4,
  },
  tickerPrice: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  tickerSeparator: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    height: '60%',
    width: 1,
  },
  tickerSymbol: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
```

**Step 2: Lint and fix**
```bash
npx eslint src/features/dashboard/screens/shared/IntelligenceScreen.tsx --fix
```
Expected: 0 errors. Fix any `sort-styles` violations by reordering the StyleSheet alphabetically.

**Step 3: Verify the app builds**
```bash
npx expo export --platform ios --dev 2>&1 | tail -5
```
Or just check TypeScript:
```bash
npx tsc --noEmit 2>&1 | head -30
```
Expected: 0 type errors. Fix any before continuing.

**Step 4: Commit**
```bash
git add src/features/dashboard/screens/shared/IntelligenceScreen.tsx
git commit -m "feat: rewrite IntelligenceScreen with live prices, news, and alerts"
```

---

## Task 6: Export Services + Store from Barrels

**Files:**
- Modify: `src/services/index.ts`

**Step 1: Add exports to `src/services/index.ts`**

Append:
```typescript
export { marketDataService } from './marketDataService';
export type { CommodityPrice, CommoditySymbol } from './marketDataService';
export { newsService } from './newsService';
export type { NewsArticle } from './newsService';
```

**Step 2: Lint**
```bash
npx eslint src/services/index.ts --fix
```

**Step 3: Commit**
```bash
git add src/services/index.ts
git commit -m "chore: export market data and news services from barrel"
```

---

## Task 7: Manual Smoke Test

> No automated test for this — it requires real API keys and a running device/simulator.

**Step 1: Set real API keys in `.env`**
- Register at https://www.alphavantage.co/support/#api-key → get free key → set `EXPO_PUBLIC_ALPHA_VANTAGE_KEY`
- Register at https://newsapi.org/register → get free key → set `EXPO_PUBLIC_NEWS_API_KEY`

**Step 2: Start the app**
```bash
npx expo start
```

**Step 3: Navigate to Intelligence screen and verify:**
- [ ] Price ticker shows 6 commodity cards (WHEAT, CORN, COTTON, SUGAR, COFFEE, NATURAL_GAS)
- [ ] Each card shows symbol, price, and % change with correct up/down color
- [ ] Stats strip shows "6 tracked · 0 alerts · Xm ago"
- [ ] News section shows real articles with source + time
- [ ] Tapping a news article opens it in the browser
- [ ] Pull-to-refresh refetches both prices and news
- [ ] "Set new alert" form works — can select commodity, condition, threshold
- [ ] Created alert appears in the list
- [ ] Remove alert removes it
- [ ] If a price crosses the threshold, NotificationBanner fires at top of screen

**Step 4: Test error state**
- Temporarily break the API key (`EXPO_PUBLIC_ALPHA_VANTAGE_KEY=invalid`)
- Verify: "Unable to load prices" appears, no crash, news still loads

---

## Done ✅

All tasks complete when:
- [ ] `npx jest --no-coverage` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Smoke test checklist above is all green
- [ ] No hardcoded colors in IntelligenceScreen (all via COLORS.*)
