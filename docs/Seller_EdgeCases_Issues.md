# Seller Edge Cases & Unit/UI Tests

> **Generated:** 2026-03-26
> **Linked Issues:** #13, #14, #15, #16, #17, #18
> **Parent Issue:** #7 (Seller E2E Verification)
> **Master Tracker:** #6

---

## Issue 1: Seller Offline & Retry Logic (#13)

**Priority:** P1 | **Files:** `front-end/src/services/`, `front-end/src/shared/hooks/`

### Subtasks
- [ ] Queue actions when device is offline (listing create, offer accept/reject/counter)
- [ ] Auto-retry queued actions when connection is restored
- [ ] Show offline status indicator in Seller dashboard
- [ ] Notification to user on failed / retried action
- [ ] Persist queue across app restarts (AsyncStorage)

### Tests
- [ ] Unit: `useOfflineQueue.test.ts` - enqueue/dequeue actions
- [ ] Unit: `useNetworkStatus.test.ts` - detect online/offline transitions
- [ ] Unit: `sellerService.test.ts` - retry logic with exponential backoff
- [ ] UI: Offline banner appears when network drops
- [ ] UI: Queued actions show pending indicator
- [ ] UI: Success toast after retry completes

### Acceptance Criteria
1. Seller taps "Accept Offer" while offline -> action queues
2. When back online, action auto-fires within 5 seconds
3. 4xx -> discard with error notification; 5xx -> retry 3x with backoff

---

## Issue 2: Seller Privy Auth Error Handling (#14)

**Priority:** P0 | **Files:** `front-end/src/features/auth/`, `front-end/src/providers/`

### Subtasks
- [ ] Error handling when Privy `getAccessToken()` returns null/undefined
- [ ] Timeout handling for OAuth callback (>30s)
- [ ] Network error during `POST /api/auth/privy/login`
- [ ] Refresh token flow when JWT expires mid-session
- [ ] Fallback to re-login when refresh fails
- [ ] Clear stale auth state on logout

### Tests
- [ ] Unit: `useAuth.test.ts` - failed login (network error, invalid token, timeout)
- [ ] Unit: `authService.test.ts` - API error response handling (401, 403, 500)
- [ ] Unit: `useAuthStore.test.ts` - state cleanup on logout
- [ ] UI: Error message displays on login failure
- [ ] UI: Retry button appears after auth error
- [ ] UI: No blank/white screens during auth error states

### Acceptance Criteria
1. Privy OAuth fails -> clear error message + retry button
2. Token expires -> auto-refresh attempted
3. Refresh fails -> redirect to login with preserved navigation state

---

## Issue 3: Seller Real-time Socket.io Notifications (#15)

**Priority:** P1 | **Files:** `front-end/src/services/socketService.ts`, `front-end/src/shared/hooks/useSellerOffers.ts`

### Subtasks
- [ ] Receive trade phase change events via Socket.io
- [ ] Update TanStack Query cache on socket event (invalidate `sellerOffers`, `sellerTrades`)
- [ ] Show in-app notification badge for new offers
- [ ] Push notification for offer received (app backgrounded)
- [ ] Handle socket disconnection and auto-reconnect
- [ ] Scope events to seller's userId

### Tests
- [ ] Unit: `socketService.test.ts` - event subscription/unsubscription
- [ ] Unit: `useSellerOffers.test.ts` - cache invalidation on socket event
- [ ] UI: Notification badge appears on new offer
- [ ] UI: Offers list auto-refreshes without pull-to-refresh
- [ ] UI: Toast notification on offer acceptance by admin

### Acceptance Criteria
1. Admin sends offer -> seller sees it within 2 seconds without refresh
2. Badge count increments correctly for multiple simultaneous offers
3. After reconnection, missed events caught up via API refetch

---

## Issue 4: Seller Listing & Offer Acceptance Edge Cases (#16)

**Priority:** P0 | **Files:** `front-end/src/pages/Dashboard/sections/Seller/`, `front-end/src/schemas/`

### Subtasks
- [ ] Empty/invalid fields validation (price=0, quantity<0, missing product)
- [ ] Server error handling for 4xx/5xx on `POST /api/seller/listings`
- [ ] Concurrent offer acceptance (seller accepts offer admin already cancelled)
- [ ] Offer expiry during acceptance (48h TTL race condition)
- [ ] Partial quantity acceptance with split listing logic
- [ ] Double-tap prevention on Accept/Reject/Counter buttons
- [ ] Counter-offer with price higher than buyer's max

### Tests
- [ ] Unit: `listingSchema.test.ts` - Zod/Yup validation rules
- [ ] Unit: `sellerService.test.ts` - API error response mapping
- [ ] Unit: `useSellerOffers.test.ts` - optimistic update + rollback on error
- [ ] UI: Form validation shows inline errors
- [ ] UI: Submit button disabled while request in-flight
- [ ] UI: Optimistic UI update on offer accept + rollback on failure

### Acceptance Criteria
1. Cannot submit listing with price <= 0 or quantity <= 0
2. Expired offer shows "Offer expired" error
3. Double-tap on Accept does not send duplicate requests

---

## Issue 5: Seller Inspection Confirmation Edge Cases (#17)

**Priority:** P1 | **Files:** `front-end/src/pages/Dashboard/sections/Seller/features/Trades/`

### Subtasks
- [ ] Seller sees inspection status in trades view (MG-8 verification)
- [ ] Notification when inspection is scheduled
- [ ] Notification when inspection result is submitted
- [ ] Handle PASS result: trade continues, green status
- [ ] Handle FAIL result: trade cancelled, clear error state
- [ ] Multiple inspections for same seller (duplicate prevention)
- [ ] Inspector no-show scenario: seller can report

### Tests
- [ ] Unit: `sellerTradesService.test.ts` - inspection status parsing
- [ ] Unit: `useSellerTrades.test.ts` - UI state mapping for PASS/FAIL/PENDING
- [ ] UI: Inspection status badge (PENDING=yellow, PASS=green, FAIL=red)
- [ ] UI: Quality score (0-100) displays in trade detail
- [ ] UI: FAIL result shows reason + next steps

### Acceptance Criteria
1. Inspection status visible without navigating away from trades
2. PASS/FAIL visible within 5 seconds of inspector submission (Socket.io)
3. Failed inspection does not leave seller in ambiguous state

---

## Issue 6: Seller UI/Unit Test Coverage (#18)

**Priority:** P1 | **Files:** `front-end/src/__tests__/`, `front-end/src/pages/Dashboard/sections/Seller/`

### Screen Tests
- [ ] `SellerOnboardingFlow.test.tsx` - renders all steps, navigation
- [ ] `RoleSelectionScreen.test.tsx` - seller option selectable
- [ ] `SellerOffersTab.test.tsx` - offer list, empty state, loading skeleton
- [ ] `SellerTradesTab.test.tsx` - trades with phase badges, empty state
- [ ] `ProductsTab.test.tsx` - CRUD operations render correctly
- [ ] `SellerAcceptOfferModal.test.tsx` - confirm button calls API
- [ ] `SellerRejectOfferModal.test.tsx` - reason input, confirm calls API
- [ ] `SellerCounterOfferModal.test.tsx` - price validation, submit calls API

### Hook & Service Tests
- [ ] `useSellerOffers.test.ts` - fetches with FARMER role, handles errors
- [ ] `useSellerTrades.test.ts` - maps phase correctly
- [ ] `sellerService.test.ts` - all API methods return correct types
- [ ] `negotiationService.test.ts` - accept/reject/counter payloads

### Regression Tests
- [ ] NativeWind component snapshots for Seller dashboard
- [ ] Dark mode renders correctly
- [ ] Responsive layout on small screens (320px width)

### Target Coverage
- Unit tests: 50%+ (per ARCHITECTURE.md Section 8)
- Critical path tests: 100% (onboarding, offer accept/reject/counter)
- Framework: Jest + React Native Testing Library + MSW

---

## Summary

| # | Issue | Priority | Effort | Key Risk |
|---|-------|----------|--------|----------|
| 1 | Offline & Retry Logic | P1 | Medium | Data loss on network drop |
| 2 | Privy Auth Error Handling | P0 | Medium | White screen / blocked login |
| 3 | Real-time Socket.io | P1 | Medium | Stale data / missed offers |
| 4 | Listing & Offer Edge Cases | P0 | High | Race conditions, double-submit |
| 5 | Inspection Confirmation | P1 | Low | Ambiguous state after FAIL |
| 6 | UI/Unit Test Coverage | P1 | High | Regression risk on refactors |
