# AgroTrade MVP Master Roadmap

> Generated: 2026-03-26 | Total Issues: 19 | Repo: `Henry6262/agro-trade-native`

---

## Architecture Overview

```
+------------------------------------------------------------------+
|                    AgroTrade Platform                              |
+------------------------------------------------------------------+
|                                                                    |
|  +------------+  +------------+  +--------------+  +------------+ |
|  |   SELLER   |  |   BUYER    |  | TRANSPORTER  |  | INSPECTOR  | |
|  |  (FARMER)  |  |            |  |              |  |            | |
|  +-----+------+  +-----+------+  +------+-------+  +-----+------+ |
|        |               |                |                |        |
|  +-----v------+  +-----v------+  +------v-------+  +-----v------+ |
|  | Products   |  | Requests   |  | Bidding      |  | Available  | |
|  | Offers     |  | Orders     |  | Active Jobs  |  | Jobs       | |
|  | Trades     |  | Delivery   |  | GPS Tracking |  | Verify     | |
|  | Negotiate  |  | Confirm    |  | Navigation   |  | Results    | |
|  +------------+  +------------+  +--------------+  +------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |              CROSS-CUTTING CONCERNS                           | |
|  |  Privy Auth | Socket.io | Offline Queue | Retry | Error UX   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |              ADMIN DASHBOARD (React)                          | |
|  |  Trade Ops | Matching | Transport | Inspections | Scenarios  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |              BACKEND (NestJS + Prisma + PostgreSQL)           | |
|  |  Auth | Trade Ops | Negotiations | Transport | Inspections   | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+
```

---

## Trade Lifecycle (State Machine)

```
INITIATION
    |
    v
SELLER_MATCHING ----> Admin matches sellers to buyer request
    |
    v
SELLER_NEGOTIATION -> Admin sends offers, sellers accept/reject/counter
    |
    v
INSPECTION_PENDING -> Inspector verifies product quality
    |
    v
TRANSPORT_MATCHING -> Admin creates transport request
    |
    v
TRANSPORT_BIDDING --> Transporters bid, admin selects winner
    |
    v
IN_TRANSIT ---------> Transporter: start -> pickup -> deliver
    |
    v
DELIVERED ----------> Buyer confirms receipt
    |
    v
COMPLETED ----------> Admin finalizes, profit calculated
```

---

## All Issues by Category

### Master & E2E Verification (Issues #6-#12)

| # | Issue | Type | Status |
|---|-------|------|--------|
| #6 | MVP Functional Readiness - All Roles E2E | Master | Open |
| #7 | Seller (Farmer) flow end-to-end | E2E | Open |
| #8 | Buyer flow end-to-end | E2E | Open |
| #9 | Transporter flow end-to-end | E2E | Open |
| #10 | Inspector flow end-to-end | E2E | Open |
| #11 | Admin Dashboard - Transport Request + Phase Controls | Admin | Open |
| #12 | Cross-cutting: Socket.io + Lint cleanup | Infra | Open |

### Seller Edge Cases (Issues #13-#18)

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| #13 | Offline & Retry Logic | P1 | Medium |
| #14 | Privy Auth Error Handling | P0 | Medium |
| #15 | Real-time Socket.io Notifications | P1 | Medium |
| #16 | Listing & Offer Acceptance Edge Cases | P1 | Medium |
| #17 | Inspection Confirmation Edge Cases | P1 | Medium |
| #18 | UI/Unit Test Coverage | P2 | High |

### Transporter Edge Cases (Issues #19-#24)

| # | Issue | Priority | Effort |
|---|-------|----------|--------|
| #19 | Offline & Retry Logic | P1 | Medium |
| #20 | Auth & Backend Error Handling | P0 | Medium |
| #21 | Real-time Socket.io Notifications | P1 | Medium |
| #22 | Bid Submission & Delivery Edge Cases | P1 | Medium |
| #23 | GPS Tracking & Location Permissions | P1 | High |
| #24 | Unit & UI Tests | P2 | High |

### Pending Roles (Not Yet Created)

| Role | Issues | Status |
|------|--------|--------|
| Buyer Edge Cases | TBD #25-#30 | Pending |
| Inspector Edge Cases | TBD #31-#36 | Pending |

---

## Cross-Cutting Concerns Matrix

```
                  | Seller | Buyer | Transporter | Inspector | Admin |
------------------+--------+-------+-------------+-----------+-------+
Offline/Retry     |  #13   |  TBD  |    #19      |    TBD    |  N/A  |
Auth Errors       |  #14   |  TBD  |    #20      |    TBD    |  N/A  |
Socket.io Events  |  #15   |  TBD  |    #21      |    TBD    |  #12  |
Core Edge Cases   |  #16   |  TBD  |    #22      |    TBD    |  #11  |
Domain-Specific   |  #17   |  TBD  |    #23      |    TBD    |   -   |
Unit/UI Tests     |  #18   |  TBD  |    #24      |    TBD    |   -   |
```

---

## Priority Distribution

```
P0 (CRITICAL - Blocks MVP)          P1 (HIGH - Core Functionality)
+----------------------------+      +----------------------------+
| #14 Seller Auth Errors     |      | #13 Seller Offline/Retry   |
| #20 Transporter Auth Errors|      | #15 Seller Socket.io       |
| #11 Admin Transport UI     |      | #16 Seller Offer Edge Cases|
|                            |      | #17 Seller Inspection      |
| Backend P0 (all fixed):    |      | #19 Transport Offline      |
| - sellingPrice propagation |      | #21 Transport Socket.io    |
| - finalizeTrade phase      |      | #22 Transport Bid/Delivery |
| - Seller role check FARMER |      | #23 Transport GPS          |
+----------------------------+      +----------------------------+

P2 (IMPORTANT - Quality)            INFRA (Cross-cutting)
+----------------------------+      +----------------------------+
| #18 Seller Tests           |      | #6  Master MVP Readiness   |
| #24 Transporter Tests      |      | #12 Socket.io + Lint       |
|                            |      |                            |
+----------------------------+      +----------------------------+
```

---

## Implementation Phases

### Phase 1: Unblock MVP (Week 1)
```
Day 1-2: P0 Auth & Error Handling
  #14 -> Seller Privy auth error handling
  #20 -> Transporter auth & backend errors
  
Day 3-4: P0 Admin Dashboard
  #11 -> Transport Request Creation UI + Phase Transition Controls
  
Day 5: P0 Verification
  #12 -> Socket.io verification + lint cleanup
```

### Phase 2: Core Edge Cases (Week 2)
```
Day 1-2: Seller
  #16 -> Listing & Offer Acceptance edge cases
  #17 -> Inspection Confirmation edge cases
  
Day 3-4: Transporter
  #22 -> Bid form fixes (remove hardcoded defaults)
  #23 -> GPS tracking, permissions, navigation
  
Day 5: Cross-role
  #13 -> Seller offline/retry
  #19 -> Transporter offline/retry
```

### Phase 3: Real-time & Notifications (Week 3)
```
Day 1-2:
  #15 -> Seller Socket.io notifications
  #21 -> Transporter Socket.io notifications
  
Day 3-5: E2E Verification
  #7  -> Seller E2E flow
  #9  -> Transporter E2E flow
  #8  -> Buyer E2E flow
  #10 -> Inspector E2E flow
```

### Phase 4: Quality & Tests (Week 4)
```
Day 1-3:
  #18 -> Seller unit/UI tests
  #24 -> Transporter unit/UI tests
  
Day 4-5:
  #6  -> Master MVP readiness validation
  Final regression testing
```

---

## Backend Fixes Status (from GAP_REPORT.md)

### P0 - All Fixed
- [x] `sellingPrice` propagation in `createTradeOperation`
- [x] `finalizeTrade` sets correct `phase=COMPLETED, status=COMPLETED`
- [x] Seller role check `FARMER` not `seller`
- [x] Inspector available jobs endpoint corrected
- [x] Inspector quality score reads from form (not hardcoded 90)
- [x] Inspector onboarding skips for admin-created accounts
- [x] Inspector Accept Job button wired
- [x] TradeFinalizationPanel calls `POST /finalize`

### P1 - All Fixed
- [x] Docs corrected (`POST /phase` -> `PATCH /trade-operations/:id`)
- [x] `accept-job` sets `IN_PROGRESS` not `SCHEDULED`
- [x] `getFullTradeState` inspectors uses correct field
- [x] `assignInspector` uses upsert
- [x] SingleOfferModal/BulkOfferModal field names corrected
- [x] NegotiationsDetailPanel has Accept Counter button
- [x] OffersTrackingPanel enum values corrected
- [x] TradeCreationWizard passes operation ID
- [x] Inspector photo picker uses real `expo-image-picker`
- [x] Buyer Confirm Delivery button on DELIVERED orders

### P2 - All Fixed
- [x] GPS tracking via `expo-location` polling
- [x] Buyer matched sellers visible
- [x] Inspector map deep link
- [x] Negotiation price history timeline
- [x] Phase-only cancel sets `status=CANCELLED`
- [x] 2nd transporter added to seed data
- [x] Buyer delivery confirmation endpoint added

---

## Scenario Test Results (Latest)

| # | Scenario | Status |
|---|----------|--------|
| 1 | Happy Path (no inspection) | PASS |
| 2 | Counter-offer (multi-round) | PASS |
| 3 | Seller Rejects Offer | PASS |
| 4 | Inspection Required (Pass) | PASS |
| 5 | Inspection Fail | PASS |
| 6 | Transport Bidding Competition | PASS |
| 7 | Cancel Trade Operation | PASS |
| 8 | Negotiation Expiry (Cron) | SKIP |
| 9 | Pricing Update (Quality Dispute) | PASS |
| 10 | Cleanup Test Data | PASS |

**Score: 9 PASS / 0 FAIL / 1 SKIP (67/67 steps)**

---

## Documentation Index

| File | Description |
|------|-------------|
| `docs/MASTER_ROADMAP.md` | This file - visual overview |
| `docs/Seller_EdgeCases_Issues.md` | Seller edge cases (#13-#18) |
| `docs/Transporter_EdgeCases_Issues.md` | Transporter edge cases (#19-#24) |
| `docs/GAP_REPORT.md` | Full gap analysis (backend + mobile + admin) |
| `docs/ARCHITECTURE.md` | System architecture |
| `docs/API_REFERENCE.md` | API endpoints reference |
| `docs/STATE_MACHINES.md` | Trade lifecycle state machines |
| `docs/TEST_SCENARIOS.md` | Backend test scenarios |

---

## Team Assignment Template

| Engineer | Role Focus | Issues | Est. Days |
|----------|-----------|--------|-----------|
| Dev A | Seller + Auth | #14, #13, #15, #16, #17, #18 | 8 |
| Dev B | Transporter + GPS | #20, #19, #21, #22, #23, #24 | 8 |
| Dev C | Admin Dashboard | #11, #12 | 4 |
| Dev D | Buyer Edge Cases | TBD #25-#30 | 8 |
| Dev E | Inspector Edge Cases | TBD #31-#36 | 8 |
| QA | E2E Verification | #6, #7, #8, #9, #10 | 5 |
