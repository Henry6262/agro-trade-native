# Agro Trade — Full Product Roadmap Design
**Date:** 2026-03-06
**Status:** Approved
**Approach:** Approach C — Role Sprints, Interleaved UI Polish

---

## Context

The app is a B2B agricultural commodity marketplace connecting sellers, buyers, transporters, and inspectors through a 9-phase trade orchestration engine. The backend is ~90% complete. The mobile frontend is structurally complete but partially wired to real data.

**What's already working (do not touch):**
- Auth (Privy + JWT, token refresh)
- Onboarding flow (all 3 roles)
- Seller offers + trades (API wired)
- Buyer listings + orders + timeline (API wired)
- GNews news + Yahoo Finance commodity prices (wired to IntelligenceScreen)
- In-app notifications store (persisted, price alerts fire)
- Product catalog (30min cache)

---

## Sprint Structure

### Sprint 1 — Quick Wins & Data Fixes
**Goal:** Every existing screen shows real data. No more hardcoded stats or empty lists.

**Tasks:**
1. Fix `marketplaceStore` — add `fetchListings()` calling `GET /buyer/listings` + `GET /seller/listings`, call on mount in MarketplaceScreen
2. Replace hardcoded seller stats with `GET /seller/stats` → real metrics cards (active listings, total offers, pending trades, revenue)
3. Replace hardcoded buyer stats with `GET /buyer/stats` → real metrics cards
4. Wire trade operation status into SellerOffersTab + BuyerOrdersTab — show phase badge (SELLER_NEGOTIATION, INSPECTION_PENDING, IN_TRANSIT, etc.) from `tradeOperationService`
5. Add pull-to-refresh to: SellerProductsTab, SellerOffersTab, SellerTradesTab, BuyerRequestsTab, BuyerOrdersTab
6. Add skeleton loading states to all dashboard tabs that lack them (match glassmorphism design — `rgba(255,255,255,0.05)` shimmer)
7. Add empty states to all tabs (glass card + icon + "No [items] yet" + CTA button)
8. Global API error boundary: catch 401 (auto-logout), 500 (toast "Server error, try again"), network failures (offline banner)

**Definition of done:** Open any tab logged in as seller or buyer and see real data from the Railway backend.

---

### Sprint 2 — UI Polish & Character Tour
**Goal:** App looks and feels polished end-to-end. Onboarding is memorable.

**Tasks:**
1. **News image cards** — redesign news items in IntelligenceScreen: full-width image with gradient overlay, source badge, relative timestamp ("2h ago"), skeleton while loading. GNews already returns `imageUrl`.
2. **Alert pills redesign** — compact horizontal pill rows: emoji commodity (🌾🌽) + condition ("above €245") + live green/red dot + timestamp. Replace current list style.
3. **Character onboarding tour** — build `CharacterTourOverlay` component:
   - Semi-transparent dimming layer with spotlight cutout (via SVG path or react-native-svg)
   - Speech bubble with role-specific tip text (5 steps per role)
   - "Next" / "Skip" controls
   - Reads from existing `tour.store.ts` (hasSeenTour, currentStep, tourRole — all already implemented)
   - Steps target: Market Intel tab, Offers tab, Trade status, Price chart, Notifications
4. **Trade ops dark glass polish** — complete `ActiveOperationsTab` + `OperationsScreenRefactored` per existing plan doc (`2026-03-04-trade-ops-ui-redesign-plan.md`)

**Definition of done:** First-time user sees the character tour. News shows image cards. Trade ops admin screen is fully glassmorphism.

---

### Sprint 3 — Transporter Dashboard
**Goal:** Transporter role is fully functional end-to-end.

**Tasks:**
1. Wire `GET /transport/requests` → TransporterJobsTab (available jobs list with product, route, weight, offered rate)
2. Bid submission flow: `POST /transport/requests/{id}/bid` with amount + estimated days → confirmation sheet
3. Wire `GET /transport/bids` → TransporterBiddingTab (my bids, status: pending/accepted/rejected)
4. Active job tracking: `GET /transport/assignments` → jobs with status ASSIGNED / IN_TRANSIT / DELIVERED
5. GPS location update: `PATCH /transport/assignments/{id}/location` — fire every 30s when job is IN_TRANSIT (expo-location background task)
6. Fleet management completion: edit/delete existing fleet vehicles, capacity summary card
7. Loading states + empty states for all transporter tabs

**Definition of done:** Transporter can see jobs, submit bids, track active deliveries, and update GPS location.

---

### Sprint 4 — Inspector Dashboard
**Goal:** Inspector role is functional end-to-end.

**Tasks:**
1. Wire `GET /inspections/available` → AvailableJobsTab (inspection requests with product, location, deadline, fee)
2. Accept inspection: `POST /inspections/{id}/accept`
3. Active inspections list: `GET /inspections/my-assignments`
4. Inspection execution screen:
   - Photo capture (expo-camera → upload to backend `POST /inspections/{id}/photos`)
   - Quality grading form (grade A/B/C, weight verified, condition notes)
   - Submit report: `POST /inspections/{id}/report`
5. Inspection history tab with status badges
6. Loading + empty states throughout

**Definition of done:** Inspector can see available jobs, accept, execute with photos, and submit quality reports.

---

### Sprint 5 — Real-time & Production Readiness
**Goal:** Live trade updates, push notifications, production-grade error handling.

**Tasks:**
1. **WebSocket integration** — connect `socketService` on app launch (auth token in handshake):
   - Subscribe to `trade-operation:{id}` events → update trade status badge in real time
   - Subscribe to `offer:received` → trigger in-app notification
   - Subscribe to `inspection:assigned`, `transport:bid-accepted` → push notifications
2. **Push notifications** — wire expo-notifications with backend `POST /notifications/register-device` (save Expo push token), handle foreground + background tap navigation
3. **Pagination** — add cursor-based `FlatList` pagination to: seller trades, buyer orders, transporter jobs, inspector history (backend already supports `?limit=20&cursor=` on all list endpoints)
4. **Offline banner** — NetInfo listener → show "You're offline" top banner, queue mutations, retry on reconnect
5. **Error boundaries** — React error boundary wrapping each tab, catches JS errors, shows "Something went wrong" glass card + retry button
6. **Performance** — memoize list item components with `React.memo`, add `getItemLayout` to flat lists, image lazy loading with `FastImage`

**Definition of done:** Trade status updates in real time. Push notifications arrive for key events. App handles offline gracefully. No list jank.

---

## Data Flow Pattern (used across all sprints)

Every screen follows this pattern — no exceptions:

```
Screen mounts
  → dispatch store action (e.g., fetchSellerStats())
  → store sets isLoading = true
  → apiClient.get('/seller/stats') [auto-injects Bearer token]
  → on success: store sets data, isLoading = false
  → on 401: auth.store.logout() → navigate to RoleSelection
  → on network error: store sets error, screen shows error state
  → on pull-to-refresh: same flow with isRefreshing = true

Screen renders:
  isLoading=true  → SkeletonCard (glassmorphism shimmer)
  error           → ErrorState (glass card + retry button)
  data.length=0   → EmptyState (glass card + icon + CTA)
  data.length>0   → real list/cards
```

---

## Component Patterns

**Skeleton card** (reusable across all tabs):
```tsx
// rgba(255,255,255,0.04) base + rgba(255,255,255,0.08) shimmer
// Animated via Reanimated withRepeat(withTiming)
<SkeletonCard lines={3} height={80} />
```

**Empty state** (reusable):
```tsx
<EmptyState icon={<Package />} title="No offers yet" subtitle="When buyers match your listings, offers appear here" cta="View Listings" onPress={...} />
```

**Phase badge** (trade status):
```tsx
<PhaseBadge phase="SELLER_NEGOTIATION" />
// Maps phase → label + color: NEGOTIATION=blue, INSPECTION=yellow, IN_TRANSIT=purple, COMPLETED=green
```

---

## Files Affected Per Sprint

**Sprint 1:**
- `src/stores/marketplace.store.ts` — add fetchListings()
- `src/pages/Dashboard/sections/Seller/features/Products/` — real stats
- `src/pages/Dashboard/sections/Buyer/features/Requests/` — real stats
- `src/shared/components/SkeletonCard.tsx` — new
- `src/shared/components/EmptyState.tsx` — new
- `src/shared/components/PhaseBadge.tsx` — new
- `src/shared/components/ErrorBoundary.tsx` — new

**Sprint 2:**
- `src/features/dashboard/screens/intelligence/IntelligenceScreen.tsx` — news image cards
- `src/features/dashboard/screens/intelligence/components/NewsCard.tsx` — new
- `src/features/dashboard/screens/intelligence/components/AlertPill.tsx` — new
- `src/features/onboarding/components/CharacterTourOverlay.tsx` — new
- `src/pages/Dashboard/sections/Admin/components/ActiveOperationsTab.tsx` — polish
- `src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx` — polish

**Sprint 3:**
- `src/features/dashboard/screens/transporter/` — all tabs
- `src/services/transportService.ts` — verify/extend
- `expo-location` background task setup

**Sprint 4:**
- `src/features/dashboard/screens/inspector/` — all tabs + execution screen
- `src/services/inspectionService.ts` — new or extend
- expo-camera integration

**Sprint 5:**
- `src/services/socketService.ts` — extend with event subscriptions
- `src/services/notificationService.ts` — push token registration
- All list screens — add pagination
- `app.json` — expo-notifications config

---

## Success Criteria

| Sprint | Done When |
|--------|-----------|
| 1 | Login as seller → see real stats, real offers, real trades. Login as buyer → see real requests + orders. |
| 2 | First-time user completes character tour. News shows image cards. Alerts show pill rows. Trade ops fully dark glass. |
| 3 | Transporter sees real jobs, submits bid, tracks active delivery with GPS. |
| 4 | Inspector sees available jobs, accepts, captures photos, submits report. |
| 5 | Offer received while app open → banner appears within 2s. App loses internet → offline banner. Lists scroll 100+ items without jank. |
