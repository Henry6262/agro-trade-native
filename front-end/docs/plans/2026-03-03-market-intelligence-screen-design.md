# Market Intelligence Screen — Design Doc
**Date:** 2026-03-03
**Status:** Approved
**Author:** Brainstorming session

---

## Overview

Full rewrite of `IntelligenceScreen.tsx` from hardcoded mock data to a live market dashboard. Shows real commodity prices (Alpha Vantage), live agri news (NewsAPI), and user-set price alerts wired into the existing notification system.

---

## Layout — Option C: Dashboard with Stacked Sections

Single scrollable screen. No tabs. Everything visible on one scroll.

```
┌─────────────────────────────────────┐
│  MARKET INTELLIGENCE          🔔    │
├─────────────────────────────────────┤
│  ◁ WHEAT $6.43▲  CORN $4.87▼  ▷   │  ← horizontal price ticker
│    COTTON $0.82▲  SUGAR $0.19▲     │
├─────────────────────────────────────┤
│  6 tracked · 2 alerts · 3m ago     │  ← stats strip
├─────────────────────────────────────┤
│  📰 LIVE NEWS                       │
│  ┌─────────────────────────────┐   │
│  │ Reuters · 12m ago           │   │
│  │ Wheat futures climb on...   │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  🔔 PRICE ALERTS (2 active)         │
│  WHEAT > $7.00          [remove]   │
│  CORN  < $4.50          [remove]   │
│  [+ Set new alert]                  │
└─────────────────────────────────────┘
```

---

## Commodities Tracked (Fixed List — MVP)

| Symbol | Name | Alpha Vantage Function |
|--------|------|----------------------|
| WHEAT | Wheat | `WHEAT` |
| CORN | Corn | `CORN` |
| COTTON | Cotton | `COTTON` |
| SUGAR | Sugar | `SUGAR` |
| COFFEE | Coffee | `COFFEE` |
| NATURAL_GAS | Natural Gas | `NATURAL_GAS` |

---

## New Files

```
src/services/marketDataService.ts     ← Alpha Vantage API calls
src/services/newsService.ts           ← NewsAPI calls
src/store/market.store.ts             ← Zustand store (prices, news, alerts, TTL)
```

### Modified Files

```
src/features/dashboard/screens/shared/IntelligenceScreen.tsx   ← full rewrite
src/.env                                                         ← add API keys
```

---

## Data Sources

### Commodity Prices — Alpha Vantage
- **Endpoint:** `https://www.alphavantage.co/query?function={SYMBOL}&interval=monthly&apikey={KEY}`
- **Free tier:** 25 req/day, 5 req/min
- **Strategy:** `Promise.all` for all 6 commodities in parallel → 6 requests per refresh
- **Cache TTL:** 15 minutes (stored in `market.store.ts` via `lastPriceFetch` timestamp)
- **Env key:** `EXPO_PUBLIC_ALPHA_VANTAGE_KEY`

### Live News — NewsAPI
- **Endpoint:** `https://newsapi.org/v2/everything?q=agricultural+commodities+wheat+corn+coffee&sortBy=publishedAt&apiKey={KEY}`
- **Free tier:** 100 req/day
- **Cache TTL:** 30 minutes (stored via `lastNewsFetch` timestamp)
- **Env key:** `EXPO_PUBLIC_NEWS_API_KEY`

---

## State Shape — `market.store.ts`

```ts
interface CommodityPrice {
  symbol: string;          // 'WHEAT'
  name: string;            // 'Wheat'
  price: number;           // 6.43
  change: number;          // +0.12
  changePct: number;       // +1.9
  unit: string;            // 'USD/bushel'
  updatedAt: string;       // ISO date string
}

interface NewsArticle {
  title: string;
  source: string;          // 'Reuters'
  description: string;
  url: string;
  publishedAt: string;     // ISO date string
}

interface PriceAlert {
  id: string;
  symbol: string;          // 'WHEAT'
  condition: 'above' | 'below';
  threshold: number;       // 7.00
  triggered: boolean;
  createdAt: string;
}

interface MarketStore {
  prices: CommodityPrice[];
  news: NewsArticle[];
  alerts: PriceAlert[];
  isLoadingPrices: boolean;
  isLoadingNews: boolean;
  lastPriceFetch: number;   // Date.now() timestamp
  lastNewsFetch: number;
  fetchPrices: () => Promise<void>;
  fetchNews: () => Promise<void>;
  addAlert: (alert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => void;
  removeAlert: (id: string) => void;
  checkAlerts: () => void;
}
```

---

## Data Flow

```
IntelligenceScreen mounts
  │
  ├─→ store.fetchPrices()
  │     ├─ TTL check: lastPriceFetch < 15min? → skip
  │     └─ else → marketDataService.getPrices()
  │                  → Promise.all(6 Alpha Vantage calls)
  │                  → store prices + Date.now()
  │                  → store.checkAlerts()
  │                       → compare each alert vs new prices
  │                       → if triggered → notification.store.addNotification()
  │                                      → NotificationBanner fires ✅ (already wired)
  │
  └─→ store.fetchNews()
        ├─ TTL check: lastNewsFetch < 30min? → skip
        └─ else → newsService.getAgriNews()
                    → 1x NewsAPI call
                    → store articles + Date.now()

Pull-to-refresh → clears both TTL timestamps → forces fresh fetch
```

---

## Error Handling

- Alpha Vantage fails → show "Unable to load prices" muted text in ticker area, rest of screen renders normally
- NewsAPI fails → show "Check back soon" in news section
- No network → cached data shown if available, else empty states
- Never crashes — all errors caught per-service, screen always renders

---

## Alert Flow

1. User taps "Set new alert" → bottom sheet modal with:
   - Commodity picker (wheel or dropdown)
   - Condition: Above / Below
   - Threshold input (numeric)
2. Alert saved to `market.store.ts` (persisted via Zustand `persist` middleware)
3. On every `fetchPrices()` → `checkAlerts()` runs
4. Triggered alert → `notification.store.addNotification({ type: 'system', title: 'Price Alert', body: 'WHEAT crossed $7.00' })`
5. `NotificationBanner` shows at top of screen automatically (already built)

---

## Design System Usage

- All cards: `GlassCard tier="subtle"` or `tier="medium"`
- Price up: `COLORS.accentGreen` + `TrendingUp` icon
- Price down: `COLORS.danger` + `TrendingDown` icon
- News cards: `GlassCard tier="subtle"`, tap → `Linking.openURL(article.url)`
- Alert badges: `GlassBadge`
- Stats strip: same pattern as AgentNetworkScreen compact strip
- No hardcoded colors — all via design tokens

---

## API Keys Setup

Add to `/front-end/.env`:
```
EXPO_PUBLIC_ALPHA_VANTAGE_KEY=your_key_here
EXPO_PUBLIC_NEWS_API_KEY=your_key_here
```

Free accounts:
- Alpha Vantage: https://www.alphavantage.co/support/#api-key
- NewsAPI: https://newsapi.org/register

---

## Out of Scope (MVP)

- Historical price charts (future iteration)
- Personalized commodity list based on user trade products (future)
- Backend proxy/caching layer (future — swap service layer when ready)
- Push notifications for alerts when app is backgrounded (future — needs backend)
