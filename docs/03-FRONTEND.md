# 03 — Mobile App (front-end/)

> React Native + Expo app for iOS and Android. All 4 user roles.

**Location:** `front-end/`
**Framework:** React Native + Expo SDK 53 (New Architecture enabled)
**Auth:** `@privy-io/expo`
**State:** Zustand stores
**API:** Axios (`src/services/`)
**Realtime:** Socket.IO client (`src/services/socketService.ts`)
**Push:** `expo-notifications`

---

## Directory Structure

```
front-end/src/
├── components/         — shared atomic components
├── config/             — API base URL, env config
├── contexts/           — React contexts (auth, etc.)
├── design-system/      — custom design tokens + theme
├── features/           — feature-level screens and logic
│   ├── auth/           — login, onboarding flow
│   ├── dashboard/      — shared dashboard components
│   ├── marketplace/    — product browsing
│   ├── orders/         — order management
│   └── admin/          — admin-specific screens
├── hooks/              — shared custom hooks
├── i18n/               — translations (locales/)
├── navigation/         — React Navigation stack + tab definitions
├── pages/              — top-level page assembly
│   ├── Auth/           — auth pages
│   ├── Dashboard/
│   │   └── sections/
│   │       ├── Buyer/       — buyer dashboard tab
│   │       ├── Seller/      — seller dashboard tab
│   │       ├── Inspector/   — inspector dashboard tab
│   │       └── Admin/       — admin dashboard tab
│   ├── Marketplace/    — marketplace browsing
│   ├── Onboarding/     — onboarding flow
│   └── Orders/         — order detail pages
├── providers/          — NotificationProvider, PrivyProvider, etc.
├── schemas/            — Zod validation schemas
├── services/           — API service modules (one per domain)
├── shared/             — cross-cutting: components, hooks, types, utils
├── stores/             — Zustand stores
├── styles/             — global style constants
├── types/              — TypeScript type definitions
└── utils/              — shared utility functions
```

---

## Role-Based Dashboard Sections

### Buyer (`pages/Dashboard/sections/Buyer/`)
| Feature | Key Files |
|---------|-----------|
| Active Orders | `features/Orders/components/ActiveOrdersList.tsx` (React.memo'd) |
| Matched Sellers | `features/Orders/components/MatchedSellersSection.tsx` (React.memo'd) |
| Order Detail | navigates to `OrderDetail` screen with `tradeOperationId` |
| Escrow Status | `EscrowStatusCard` embedded on each order card |
| Marketplace | browse available SaleListings |

### Seller (`pages/Dashboard/sections/Seller/`)
| Feature | Key Files |
|---------|-----------|
| My Listings | `features/Listings/` — paginated, create/edit |
| Active Trades | `features/Trades/components/SellerTradeCard.tsx` |
| Offers Received | `features/Offers/` — accept/reject/counter |
| Escrow Status | `EscrowStatusCard` on each trade card |

### Inspector (`pages/Dashboard/sections/Inspector/`)
| Feature | Key Files |
|---------|-----------|
| Active Job | `features/ActiveJob/` — full job detail + verification form |
| Job Map | location + distance calculation |
| Submit Results | quality score, photos, notes, pass/fail |
| Escrow Status | `EscrowStatusCard` showing locked cUSD amount |

The inspector's `tradeOperationId` is mapped via `inspectorActiveJobService.fetchActiveJob()` which calls `toInspectorJob()` — extracts `request.tradeOperationId ?? request.tradeOperation?.id`.

### Admin (`pages/Dashboard/sections/Admin/`)
| Feature | Key Files |
|---------|-----------|
| All Trades | `features/TradeList/` — full trade visibility |
| Escrow Management | `EscrowStatusCard` with Release + Dispute buttons |
| User Management | view/search all users by role |

---

## Key Stores (Zustand)

```typescript
// src/stores/
auth.store.ts          — isAuthenticated, user, token, login/logout
marketplace.store.ts   — listings, fetchListings(page), fetchNextPage()
notification.store.ts  — in-app bell notifications, addNotification()
```

**Marketplace pagination pattern:**
```typescript
store.fetchListings({ page: 1 })                     // initial load
store.fetchNextPage()                                // infinite scroll
// Backed by GET /api/seller/listings?page=N&limit=20
// Returns: { data: Listing[], meta: { page, limit, total, hasMore } }
```

---

## Services (API Layer)

```typescript
// src/services/
authService.ts            — verify JWT, get me
sellerService.ts          — listings, offers, trades
buyerService.ts           — buy listings, orders, add sellers
inspectionService.ts      — active mission, submit results
tradeOperationService.ts  — trade phases, escrow actions
notificationService.ts    — register push token, send token to backend
socketService.ts          — Socket.IO client + typed events
productService.ts         — product catalogue
```

---

## Socket Service

```typescript
// src/services/socketService.ts

// Typed event payloads
interface SocketEventPayloads {
  'trade:updated': { tradeOperationId: string; phase: string; ... }
  'trade:seller-added': { tradeOperationId: string; sellerId: string }
  'inspection:completed': { inspectionId: string; tradeOperationId: string; result: string }
  'offer:created': { offerId: string; tradeOperationId: string }
  'offer:updated': { offerId: string; status: string }
  'notification:new': { title: string; body: string; type: string; data: unknown }
}

// Usage in components:
socketService.on('trade:updated', (payload) => {
  // payload is fully typed
})
```

---

## Push Notifications

```typescript
// src/providers/NotificationProvider.tsx

// FOREGROUND handler — surfaces in in-app bell
Notifications.addNotificationReceivedListener((notification) => {
  addNotification({ title, body, type, data })
})

// RESPONSE/TAP handler — navigates to relevant screen
Notifications.addNotificationResponseReceivedListener((response) => {
  if (type === 'order' || type === 'trade:updated') {
    queueNavigate('OrderDetail', { orderId: data.tradeOperationId })
  } else {
    queueNavigate('Main')
  }
})
```

Push tokens are registered on login via `notificationService.registerForPushNotifications()` and sent to backend via `sendPushTokenToBackend()`.

---

## Navigation

React Navigation v6 with:
- **Stack Navigator** — Auth flow (Login → Onboarding → Main)
- **Bottom Tab Navigator** — Dashboard tabs (Buyer/Seller/Inspector/Admin per role)
- **`navigationRef.ts`** — allows navigation from outside React tree (used by `NotificationProvider`)
- **`queueNavigate()`** — queues navigation if the navigator isn't ready yet (prevents crash on app launch from notification tap)

---

## App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "AgroTrade",
    "slug": "agro-trade",
    "version": "1.0.0",
    "newArchEnabled": true,
    "plugins": [
      ["expo-build-properties", {
        "android": {
          "compileSdkVersion": 35,
          "targetSdkVersion": 35,
          "buildToolsVersion": "35.0.0",
          "kotlinVersion": "1.9.25"
        },
        "ios": { "deploymentTarget": "15.1" }
      }]
    ]
  }
}
```

---

## Building & Running

```bash
cd front-end

# Development
npx expo start                  # start Expo Go
npx expo start --ios            # iOS simulator
npx expo start --android        # Android emulator

# Production builds (EAS)
eas build --platform ios --profile production
eas build --platform android --profile production --clear-cache

# Android dev build (add --clear-cache if Gradle errors)
eas build --platform android --profile development --clear-cache
```

---

## Environment Config

```typescript
// src/config/index.ts (or similar)
API_BASE_URL:
  Production:  https://agro-trade-native-production.up.railway.app/api
  Local:       http://192.168.100.47:4000/api   (local network IP)

PRIVY_APP_ID: cmieakfr201g9jo0cwewfvsgi
```

Note: Use your machine's **LAN IP** (not `localhost`) for local dev on a physical device.
