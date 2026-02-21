# Sprint 2: BUYER COMPLETION

**Created**: 2026-02-20
**Status**: In Progress
**Goal**: A buyer can onboard, create buy requests, receive seller offers, negotiate, track orders, and view delivery status.

---

## Epic: BUYER-EPIC-001 - Complete Buyer Experience

**Goal**: A buyer can onboard, submit buy listings, receive and respond to offers from sellers (via admin-mediated trade operations), negotiate price/quantity, track active orders through stages (negotiation, inspection, transport), and view history/stats.

---

## Stories

### BUYER-001: Onboarding Flow
**Status**: DONE
**Priority**: P0

**Description**:
Buyer onboarding is a multi-step flow: product selection, quantity/location entry, specifications, and market request submission. The frontend has a complete `BuyerOnboarding` component with 4 steps (products, quantity-location, specifications, market). The backend has a `POST /api/onboarding/buyer` endpoint that accepts `BuyerOnboardingDto` with company info and product requirements, then creates the user with BUYER role.

**What Exists**:
- **Frontend**: `front-end/src/pages/Onboarding/sections/Buyer/` - Full onboarding flow with 4 feature modules:
  - `features/Specifications/` - BuyerSpecifications component
  - `features/Quantity/` - BuyerQuantityLocation component
  - `features/MarketRequest/` - BuyerMarketRequest + BuyerSubmitDrawer
  - `components/BuyerOnboarding/` - Orchestrator with step navigation, validation, and store persistence
- **Frontend (alternate)**: `front-end/src/features/onboarding/screens/buyer/BuyerOnboardingFlowScreen.tsx`
- **Backend**: `backend/src/onboarding/onboarding.controller.ts` - `POST /api/onboarding/buyer` endpoint
- **Backend DTO**: `backend/src/onboarding/dto/buyer-onboarding.dto.ts` - BuyerOnboardingDto with requirements array
- **Stores**: `useOnboardingStore` (Zustand) persists buyer data, specifications, and location

**Acceptance Criteria**:
- [x] Product selection screen works
- [x] Quantity and location entry works
- [x] Buyer specifications entry works
- [x] Market request / review screen works
- [x] `POST /api/onboarding/buyer` endpoint exists
- [x] Onboarding state persisted via Zustand store
- [ ] Privy/OAuth auth flow tested on device (needs mobile testing)
- [ ] User created with BUYER role verified end-to-end (needs mobile testing)
- [ ] Navigation to dashboard after completion (needs mobile testing)

**Dependencies**: None (standalone onboarding flow)

---

### BUYER-002: Dashboard - Buy Listings Management (CRUD)
**Status**: DONE (Backend verified, Frontend exists)
**Priority**: P0

**Description**:
Buyers can create, view, update, and delete buy listings from their dashboard. The backend BuyerController exposes full CRUD on `/api/buyer/listings`. The frontend has a `Requests` tab in the buyer dashboard with a `RequestsList` component and a `RequestCreation` flow for creating new buy listings.

**What Exists**:
- **Backend Controller**: `backend/src/buyer/buyer.controller.ts`
  - `POST /api/buyer/listings` - Create buy listing (with specs, delivery address)
  - `GET /api/buyer/listings` - Get all active buy listings
  - `GET /api/buyer/listings/:id` - Get listing by ID (ownership-checked)
  - `PATCH /api/buyer/listings/:id` - Update listing fields
  - `PATCH /api/buyer/listings/:id/status` - Update listing status
  - `DELETE /api/buyer/listings/:id` - Delete listing (cascades specs)
- **Backend Service**: `backend/src/buyer/buyer.service.ts` - Full implementation with Prisma queries, ownership validation, specification handling
- **Backend DTOs**: `buyer-response.dto.ts` (BuyListingResponseDto, BuyerStatsDto, BuyerOfferSummaryDto), `create-buy-listing.dto.ts` (CreateBuyListingDto, UpdateBuyListingDto)
- **Frontend Dashboard**: `front-end/src/pages/Dashboard/sections/Buyer/features/Requests/` - RequestsList component with `useBuyerRequests` hook
- **Frontend Creation**: `front-end/src/pages/Dashboard/sections/Buyer/features/RequestCreation/` - BuyerRequestCreationFlow with multi-step creation, submits to `POST /api/buyer/listings`
- **Frontend Service**: `front-end/src/services/buyerService.ts` - `getMyBuyListings()` method

**Acceptance Criteria**:
- [x] `POST /api/buyer/listings` creates listing with product, quantity, price, location, specifications
- [x] `GET /api/buyer/listings` returns active listings with product/buyer/address/spec includes
- [x] `GET /api/buyer/listings/:id` returns detail with ownership check
- [x] `PATCH /api/buyer/listings/:id` updates listing fields
- [x] `PATCH /api/buyer/listings/:id/status` updates status
- [x] `DELETE /api/buyer/listings/:id` deletes listing and related specs
- [x] Frontend RequestCreation flow submits to correct endpoint
- [x] Frontend RequestsList displays listings
- [x] JwtAuthGuard protects all endpoints

**Known Issue**: Frontend `buyerService.getMyBuyListings()` calls `/buyer/buy-listings` but backend route is `/buyer/listings`. This mismatch needs to be fixed.

**Dependencies**: None

---

### BUYER-003: Dashboard - Incoming Offers & Negotiation
**Status**: PARTIAL (Backend core exists, Frontend UI exists, Route mismatch)
**Priority**: P0

**Description**:
Buyers receive offers from sellers (mediated by admin via trade operations). The buyer can view incoming offers, accept, reject, or counter-offer. The backend has `GET /api/buyer/offers` and uses the shared `/api/negotiations/:id/accept|reject|counter` endpoints. The frontend has an `IncomingOffersList` component with accept/reject/counter UI, but the buyerService calls buyer-scoped negotiation routes that do not exist on the backend.

**What Exists**:
- **Backend**: `GET /api/buyer/offers` - Returns offers for buyer's listings (includes saleListing, seller info, product)
- **Backend (shared)**: `/api/negotiations/:id/accept`, `/api/negotiations/:id/reject`, `/api/negotiations/:id/counter` - Shared negotiation endpoints (not buyer-scoped)
- **Frontend UI**: `front-end/src/pages/Dashboard/sections/Buyer/features/Orders/components/IncomingOffersList.tsx` - Displays offers with product, seller, quantity, price, quality badges, accept/view buttons
- **Frontend Service**: `buyerService.ts` methods: `acceptOffer()`, `rejectOffer()`, `counterOffer()` - These call `/buyer/negotiations/:id/accept|reject|counter` which DO NOT EXIST on the backend
- **Shared Components**: `BuyerRequestCard.tsx`, `BuyerSpecificationsDrawer.tsx`, `NegotiationDrawer.tsx`, `AcceptOfferModal.tsx`, `SellerOfferCard.tsx`

**Acceptance Criteria**:
- [x] `GET /api/buyer/offers` returns offers for buyer's listings
- [x] Shared negotiation accept/reject/counter endpoints exist
- [x] Frontend IncomingOffersList component renders offers
- [x] Frontend has accept/reject/counter UI elements
- [ ] **FIX NEEDED**: Frontend `buyerService` calls `/buyer/negotiations/:id/*` but backend only has `/negotiations/:id/*` - routes must be aligned
- [ ] Accept offer flow works end-to-end (buyer sees offer -> accepts -> status updates)
- [ ] Reject offer flow works end-to-end
- [ ] Counter-offer flow works end-to-end (buyer counters -> seller sees counter)
- [ ] Offer expiry countdown displayed correctly

**Dependencies**: BUYER-002 (listings must exist to receive offers)

---

### BUYER-004: Dashboard - Active Orders & Trade Operation Tracking
**Status**: PARTIAL (Backend exists via shared endpoints, Frontend UI exists, Route mismatch)
**Priority**: P0

**Description**:
Once offers are accepted, buyers track their orders through stages: negotiation, inspection, transport, delivery. The frontend has an `ActiveOrdersList` with `OrderStageIndicator`, `OrdersStatsGrid`, and `BuyerTimeline`. However, the frontend service calls `/buyer/trade-operations` and `/buyer/trade-operations/:id` which are NOT buyer-scoped endpoints on the backend -- the backend has `/api/trade-operations` (admin) and `/api/buyer/trades` (accepted offers only).

**What Exists**:
- **Backend**: `GET /api/buyer/trades` - Returns accepted offers (completed trades) for buyer
- **Backend (shared)**: `GET /api/trade-operations/:id` - Admin trade operation detail (not buyer-scoped)
- **Frontend UI**:
  - `ActiveOrdersList.tsx` - Shows orders with operationNumber, product, status, quantity, budget, stage indicator, expand/collapse details
  - `OrderStageIndicator.tsx` - Visual stage progression (negotiation -> inspection -> transport -> delivery)
  - `OrdersStatsGrid.tsx` - Stats summary cards
  - `BuyerTimeline.tsx` - Activity timeline
- **Frontend Service**: `buyerService.getMyTradeOperations()` calls `/buyer/trade-operations` (DOES NOT EXIST)
- **Frontend Hook**: `useBuyerOrders.ts` - Fetches operations, stats, offers in parallel via react-query

**Acceptance Criteria**:
- [x] `GET /api/buyer/trades` returns accepted trades
- [x] Frontend ActiveOrdersList component exists with stage tracking
- [x] Frontend OrderStageIndicator shows visual progression
- [ ] **FIX NEEDED**: Backend needs buyer-scoped trade operation endpoints OR frontend routes must be updated to use existing endpoints
- [ ] Buyer can see all their trade operations with current phase/status
- [ ] Order detail view shows negotiation history, inspection status, transport status
- [ ] Real-time or pull-to-refresh updates work

**Dependencies**: BUYER-003 (offers must be accepted to create orders)

---

### BUYER-005: Dashboard - Stats & Timeline
**Status**: DONE (Backend verified, Frontend exists)
**Priority**: P1

**Description**:
Buyers see aggregate statistics (total listings, active listings, total offers, accepted offers, fulfilled listings) and a timeline of recent activity. Backend provides both endpoints; frontend consumes them.

**What Exists**:
- **Backend**: `GET /api/buyer/stats` - Returns `{ totalListings, activeListings, totalOffers, acceptedOffers, fulfilledListings }`
- **Backend**: `GET /api/buyer/timeline?limit=20&cursor=X` - Returns paginated timeline events with trade/negotiation/transport data
- **Backend DTO**: `BuyerStatsDto`, `BuyerTimelineResponseDto`, `BuyerTimelineEventDto`
- **Frontend**: `OrdersStatsGrid.tsx` - Displays stats in grid cards
- **Frontend**: `BuyerTimeline.tsx` - Renders timeline events
- **Frontend Hook**: `useBuyerTimeline.ts` - Fetches timeline data
- **Frontend Service**: `buyerService.getMyStatistics()` calls `/buyer/statistics` and `buyerService.getMyTimeline()` calls `/buyer/timeline`

**Acceptance Criteria**:
- [x] `GET /api/buyer/stats` returns correct aggregate counts
- [x] `GET /api/buyer/timeline` returns paginated events
- [x] Frontend stats grid renders stats
- [x] Frontend timeline component renders events
- [ ] **FIX NEEDED**: Frontend calls `/buyer/statistics` but backend route is `/buyer/stats` - must align

**Dependencies**: BUYER-002 (needs listings/trades data to calculate stats)

---

### BUYER-006: Frontend-Backend Route Alignment
**Status**: DONE (completed 2026-02-20)
**Priority**: P0 (Blocker for BUYER-003, BUYER-004, BUYER-005)

**Description**:
The frontend `buyerService.ts` called several routes that did not match the backend controller paths. All 8 mismatches have been fixed by updating the frontend routes.

**Route Fixes Applied**:

| Frontend (Before) | Frontend (After) | Backend Route |
|---|---|---|
| `GET /buyer/buy-listings` | `GET /buyer/listings` | `GET /buyer/listings` |
| `GET /buyer/trade-operations` | `GET /buyer/trades` | `GET /buyer/trades` |
| `GET /buyer/trade-operations/:id` | `GET /trade-operations/:id` | `GET /trade-operations/:id` (shared) |
| `GET /buyer/statistics` | `GET /buyer/stats` | `GET /buyer/stats` |
| `POST /buyer/negotiations/:id/accept` | `POST /negotiations/:id/accept` | `POST /negotiations/:id/accept` (shared) |
| `POST /buyer/negotiations/:id/reject` | `POST /negotiations/:id/reject` | `POST /negotiations/:id/reject` (shared) |
| `POST /buyer/negotiations/:id/counter` | `POST /negotiations/:id/counter` | `POST /negotiations/:id/counter` (shared) |
| `GET /buyer/delivery-status/:id` | `GET /transport/requests/:id` | `GET /transport/requests/:id` (shared) |

**Acceptance Criteria**:
- [x] All frontend `buyerService.ts` methods call existing backend routes
- [x] No 404s when buyer dashboard loads
- [x] All data flows correctly from backend to frontend
- [x] Delivery status tracking uses transport request endpoint

**Dependencies**: None (prerequisite for other stories)

---

### BUYER-007: Backend API Verification & E2E Tests
**Status**: PLANNED
**Priority**: P1

**Description**:
Write comprehensive integration/E2E tests for all buyer endpoints, similar to the seller sprint's `seller-api.e2e-spec.ts`. Currently there are no dedicated buyer E2E tests -- buyer endpoints are only incidentally tested in other test files (trade operations, negotiations).

**What Exists**:
- **No dedicated buyer test file** (unlike `backend/test/integration/seller-api.e2e-spec.ts`)
- Buyer is referenced in other tests: `trade-operations.e2e-spec.ts`, `negotiations.e2e-spec.ts`, `admin-dashboard-features.e2e-spec.ts`
- Test helpers exist: `test-data-factory.ts` has `createTestBuyer()` and `createTestBuyListing()`

**Acceptance Criteria**:
- [ ] `backend/test/integration/buyer-api.e2e-spec.ts` created
- [ ] Tests cover: Listings CRUD (create, get all, get by ID, update, update status, delete)
- [ ] Tests cover: Offers retrieval (`GET /buyer/offers`)
- [ ] Tests cover: Trades retrieval (`GET /buyer/trades`)
- [ ] Tests cover: Stats endpoint (`GET /buyer/stats`)
- [ ] Tests cover: Timeline endpoint with pagination (`GET /buyer/timeline`)
- [ ] Tests cover: Auth guards (reject unauthenticated requests)
- [ ] Tests cover: Ownership validation (user A cannot access user B's listings)
- [ ] All tests passing locally
- [ ] Integrated with CI

**Dependencies**: BUYER-006 (routes must be stable before writing tests)

---

## Summary of Current State

| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| BUYER-001 | Onboarding Flow | DONE | Full 4-step flow, needs device testing |
| BUYER-002 | Listings Management | DONE | Full CRUD backend + frontend, minor route mismatch |
| BUYER-003 | Offers & Negotiation | PARTIAL | Backend offers endpoint works, negotiation routes mismatched |
| BUYER-004 | Orders & Tracking | PARTIAL | Frontend UI exists, backend trade-ops not buyer-scoped |
| BUYER-005 | Stats & Timeline | DONE | Both endpoints work, minor route mismatch |
| BUYER-006 | Route Alignment | PLANNED | **BLOCKER** - 8 route mismatches identified |
| BUYER-007 | E2E Tests | PLANNED | No dedicated buyer test file yet |

---

## Definition of Done (Buyer Sprint)

- [ ] All BUYER-00X stories completed
- [ ] Buyer can onboard and access dashboard
- [ ] Buyer can manage buy listings (CRUD)
- [ ] Buyer can view incoming offers and negotiate (accept/reject/counter)
- [ ] Buyer can track active orders through stages
- [ ] Buyer sees accurate stats and timeline
- [ ] All frontend routes match backend endpoints (zero 404s)
- [ ] Admin dashboard shows buyer-initiated activity
- [ ] All backend APIs verified and documented
- [ ] E2E tests written and passing
- [ ] implementation-status.md updated with BUYER story entries

---

## Recommended Execution Order

1. **BUYER-006** (Route Alignment) - FIRST, unblocks everything
2. **BUYER-003** (Offers & Negotiation) - Core buyer interaction
3. **BUYER-004** (Orders & Tracking) - End-to-end order visibility
4. **BUYER-007** (E2E Tests) - Lock in correctness
5. BUYER-001, BUYER-002, BUYER-005 are already done -- verify on device when possible

---

*Update this document as stories are completed.*
