# AgroTrade Gap Report
*Generated: 2026-03-02*
*Backend URL: http://localhost:4000/api*
*Runner: `backend/src/scripts/run-all-scenarios.ts`*

---

## BACKEND — Scenario Test Results

### Summary

| Metric | Value |
|--------|-------|
| Scenarios run | 10 |
| PASSED | 6 |
| FAILED | 3 |
| SKIPPED | 1 |
| Total steps | 67 |
| Steps passed | 64 |

### Scenario Results

| # | Scenario | Status | Failed Steps |
|---|----------|--------|-------------|
| 1 | Happy Path (no inspection) | FAIL | S1.10 Admin finalizes trade |
| 2 | Counter-offer (multi-round negotiation) | FAIL | S2.11 Finalize and verify COMPLETED |
| 3 | Seller Rejects Offer | PASS | - |
| 4 | Inspection Required (Pass) | PASS | - |
| 5 | Inspection Fail | PASS | - |
| 6 | Transport Bidding Competition | PASS | - |
| 7 | Cancel Trade Operation | PASS | - |
| 8 | Negotiation Expiry (Automated - Cron) | SKIP | Cannot trigger via API |
| 9 | Pricing Update (Quality Dispute) | FAIL | S9.11 Finalize trade |
| 10 | Cleanup Test Data | PASS | - |

---

## Failures & Gaps

### Gap 1 — `POST /trade-operations/:id/finalize` Rejects All Simulation Flows

**Affects:** Scenarios 1, 2, and 9 (all scenarios that attempt to finalize)

**Steps:**
- S1.10: `POST /trade-operations/{id}/finalize` → HTTP 400
- S2.11: `POST /trade-operations/{id}/finalize` → HTTP 400
- S9.11: `POST /trade-operations/{id}/finalize` → HTTP 400

**Expected:** `TradeOperation.phase = COMPLETED`, `status = COMPLETED`

**Got (Scenario 1 path):** First error is `400 "Not all sellers have agreed to terms"`, then after fix would be `400 "Profit margin 0.00% is below minimum 5%"`

**HTTP Status:** 400

**Priority:** P0 — This blocks the entire end-to-end happy path. No trade can ever be finalized via the simulation flow.

**Root Cause (two-layer bug):**

**Layer 1 — `allAgreed` check bug in `finalizeTrade()`:**

File: `backend/src/trade-operations/services/trade-operation.service.ts`, line 665:
```typescript
const allAgreed = trade.sellers.every((s) => s.status === "ACCEPTED");
if (!allAgreed) {
  throw new BadRequestException("Not all sellers have agreed to terms");
}
```

The simulation's `accept-offer` endpoint sets `TradeSeller.status = "ACCEPTED"`, which is correct. However, when `createTransportAndDeliver` is called (Scenario 1 Step 7), the simulation's `create-transport` helper successfully creates the transport job and sets `TradeOperation.phase = "IN_TRANSIT"`. The `TradeSeller.status` remains `"ACCEPTED"` — so this check should pass.

The real issue is that the transport completes (`complete-delivery`) and sets `TradeOperation.phase = "DELIVERED"`, but the finalize service checks `sellers.every(s.status === "ACCEPTED")`. However inspecting the actual response body more carefully with a dedicated test confirms the **first** barrier: the `finalizeTrade` function also checks that `allAgreed` considers sellers with status `"ACCEPTED"` only. Since the simulation flow only sets status to `"ACCEPTED"` and never to `"CONFIRMED"`, and since `finalizeTrade` uses `=== "ACCEPTED"` (not `=== "CONFIRMED"`), this check actually passes after a seller accepts.

**Layer 2 — Zero profit margin enforcement (primary blocker):**

The finalize service calculates profit using `ProfitCalculationService.calculateProfit()`. This service reads:
- `tradeOperation.sellingPrice` — the price at which the platform sells to the buyer
- `tradeSeller.agreedPrice` and `agreedQuantity` — agreed per-unit cost

The simulation's `createTradeOperation` service method (`simulation.service.ts` line 297-307) creates the TradeOperation with:
```typescript
await this.prisma.tradeOperation.create({
  data: {
    operationNumber,
    adminId: admin.id,
    buyListingId,
    phase: "SELLER_MATCHING",
    status: "ACTIVE",
    // sellingPrice is NEVER SET
  },
});
```

Because `sellingPrice` is `null`, `ProfitCalculationService.calculateProfit()` computes:
- `revenue.sellingPrice = 0`
- `revenue.totalRevenue = 0`
- `profit.profitMargin = 0%`

The finalize service then hits:
```typescript
if (profitCalc.profit.profitMargin < this.MIN_PROFIT_MARGIN) {  // 5%
  return { success: false, message: "Profit margin 0.00% is below minimum 5%" };
}
```

And the controller throws `BadRequestException(result.message)`.

Additionally, `TradeSeller.agreedPrice` is never set by the `accept-offer` simulation endpoint — it only sets `agreedQuantity`. So even if `sellingPrice` were populated, the cost side of the equation would also be 0.

**Fix Needed:**

Two fixes required:

1. In `SimulationService.createTradeOperation()`, derive and set `sellingPrice` from `BuyListing.maxPricePerUnit`:
   ```typescript
   await this.prisma.tradeOperation.create({
     data: {
       ...
       sellingPrice: buyListing.maxPricePerUnit,  // ADD THIS
     },
   });
   ```

2. In `SimulationService.simulateSellerAcceptOffer()` (controller, line 150), also set `agreedPrice` from the negotiation's `currentOffer.price`:
   ```typescript
   await this.prisma.tradeSeller.update({
     where: { id: negotiation.tradeSellerId },
     data: {
       status: "ACCEPTED",
       agreedQuantity: quantity,
       agreedPrice: (offerData?.price || 0),  // ADD THIS
     },
   });
   ```

With `sellingPrice = 250` (buyer's max price) and `agreedPrice = 215` (offered price to seller), the profit margin would be `(250 - 215) / 250 = 14%`, which exceeds the 5% minimum.

---

### Gap 2 — `POST /trade-operations/:id/phase` Does Not Exist

**Affects:** Scenario documentation references `POST /trade-operations/:id/phase` for advancing phases manually

**Expected (from `TEST_SCENARIOS.md`):**
```
POST /trade-operations/{TRADE_OP_ID}/phase
{ "phase": "INSPECTION_PENDING" }
```

**Got:** `404 Not Found` — endpoint does not exist

**HTTP Status:** 404

**Priority:** P1 — The `PATCH /trade-operations/:id` endpoint accepts `{ "phase": "..." }` as an alternative and does work (confirmed in Scenario 7 where `{ "phase": "CANCELLED" }` succeeds). The TEST_SCENARIOS.md doc is wrong about the endpoint URL, but the functionality exists via PATCH.

**Root Cause:** The `TEST_SCENARIOS.md` documentation describes a dedicated `POST /:id/phase` endpoint that was never implemented. The actual implementation uses `PATCH /trade-operations/:id` with `{ phase: "..." }` in the body.

**Fix Needed:** Update `docs/TEST_SCENARIOS.md` Scenarios 4 (step 7) and 6 (step 7) to use:
```
PATCH /trade-operations/{TRADE_OP_ID}
{ "phase": "INSPECTION_PENDING" }
```
instead of `POST /trade-operations/{id}/phase`.

---

### Gap 3 — `finalizeTrade` Updates Wrong Phase

**Affects:** If finalize ever succeeds (with correct pricing), the result would be wrong

**Expected:** `TradeOperation.phase = "COMPLETED"`, `status = "COMPLETED"`

**Got (from service code, line 684-694):**
```typescript
await this.prisma.tradeOperation.update({
  where: { id: tradeOperationId },
  data: {
    phase: "IN_TRANSIT",   // WRONG — should be "COMPLETED"
    status: "ACTIVE",      // WRONG — should be "COMPLETED"
  },
});
```

**Priority:** P0 — The `finalizeTrade` service method sets `phase = "IN_TRANSIT"` and `status = "ACTIVE"` instead of `phase = "COMPLETED"` and `status = "COMPLETED"`. This is a regression — when finalize was last updated, the target phase/status enum values were changed but the DB write was not updated accordingly. The comment in the code `// Use IN_TRANSIT instead of EXECUTION` confirms this was a deliberate workaround for a schema mismatch, but the correct target should be `"COMPLETED"`.

**Fix Needed:**
```typescript
// In trade-operation.service.ts finalizeTrade():
await this.prisma.tradeOperation.update({
  where: { id: tradeOperationId },
  data: {
    phase: "COMPLETED",     // Was: "IN_TRANSIT"
    status: "COMPLETED",    // Was: "ACTIVE"
    completedAt: new Date(),
    actualProfit: profitCalc.profit.netProfit,
    profitMargin: profitCalc.profit.profitMargin,
  },
});
```

---

### Gap 4 — `simulateInspectorAcceptJob` Overwrites Inspector Assignment

**Affects:** Scenario 4 and 5 (inspection flows)

**Description:** The admin calls `POST /simulation/admin/assign-inspector` which creates a NEW `InspectionRequest` with status `SCHEDULED` and sets the `inspectorId`. Then when `POST /simulation/inspector/:userId/accept-job` is called, it runs:

```typescript
await this.prisma.inspectionRequest.update({
  where: { id: dto.inspectionId },
  data: {
    inspectorId: userId,      // Redundantly sets inspectorId again
    status: InspectionStatus.SCHEDULED,  // Sets SCHEDULED again — should be IN_PROGRESS
  },
});
```

The `accept-job` endpoint sets `status = SCHEDULED` instead of `IN_PROGRESS`, which means the state machine transition from `SCHEDULED → IN_PROGRESS` (inspector accepts job) is skipped.

**Priority:** P1 — Tests still pass because `submit-results` directly sets status to `COMPLETED` without validating the prior state. But the inspection status machine is incorrect: `SCHEDULED → SCHEDULED → COMPLETED` instead of `SCHEDULED → IN_PROGRESS → COMPLETED`.

**Fix Needed:**
```typescript
// In simulation.controller.ts simulateInspectorAcceptJob():
await this.prisma.inspectionRequest.update({
  where: { id: dto.inspectionId },
  data: {
    status: InspectionStatus.IN_PROGRESS,  // Was: SCHEDULED
    // Do not reassign inspectorId if already set
  },
});
```

---

### Gap 5 — `getFullTradeState` Returns Inspectors from Wrong Field

**Affects:** Scenario 4 and 5 full-state assertions about inspector data

**Description:** In `SimulationService.getFullTradeState()`, line 190:
```typescript
actors: {
  ...
  inspectors:
    (operation as any).inspectionRequests?.map(...) || [],
}
```

The Prisma include uses `inspections` (plural, the relation field name) but the actors mapping reads `inspectionRequests`. This means `actors.inspectors` is always `[]` regardless of how many inspections exist.

**Priority:** P2 — Does not break inspection flow (the `operation.inspections` array works correctly), but the convenience `actors.inspectors` field in the full-state response is always empty.

**Fix Needed:**
```typescript
// In simulation.service.ts getFullTradeState():
inspectors: operation.inspections?.map((i: any) => ({  // Was: operation.inspectionRequests
  inspector: i.inspector,
  inspectionStatus: i.status,
  verificationResult: i.verificationResult,
})) || [],
```

---

### Gap 6 — Scenario 7 Mid-Negotiation Cancel: `phase=CANCELLED` Sets Phase But Not Status

**Observed:** When `PATCH /trade-operations/:id` is called with `{ "phase": "CANCELLED" }`, the response shows `phase=CANCELLED` but `status=ACTIVE` (not `CANCELLED`). The state machine documentation says "any phase can transition to CANCELLED" but does not specify whether `phase=CANCELLED` should also set `status=CANCELLED`.

**Priority:** P2 — Ambiguous: the test passes with the current lenient assertion. The cancel endpoint `POST /trade-operations/:id/cancel` likely sets both, but PATCH only sets what you pass. The UI may need to send `{ "status": "CANCELLED" }` separately.

---

### Gap 7 — Only 1 Transporter in Database (Bidding Competition Limited)

**Affects:** Scenario 6 (Transport Bidding Competition)

**Description:** The database has only 1 transporter user (`georgi.petrov@transbg.com`). Scenario 6 is designed to have Transporter A and Transporter B compete. The scenario runner submits 2 bids from the same transporter to still exercise the bid-selection logic. This works for testing the bid selection mechanism but does not test the real scenario of competing transporters.

**Priority:** P2 — The simulation framework itself works correctly (bid selection, rejection of losing bid). The limitation is data availability, not a code bug.

**Fix Needed:** Add a second transporter in `prisma/seed-demo.ts` or `prisma/seed.ts`.

---

## Missing Endpoints

| Endpoint | Referenced In | Status |
|----------|---------------|--------|
| `POST /trade-operations/:id/phase` | TEST_SCENARIOS.md Scenarios 4, 6 | NOT IMPLEMENTED — use `PATCH /trade-operations/:id` instead |
| `GET /profit/:tradeOpId` | TEST_SCENARIOS.md (Scenarios 2, 9 notes) | Exists as `GET /trade-operations/:id/profit` (different URL) |

---

## Logic Gaps

### State Machine Violation: `finalizeTrade` Sets Wrong Terminal State

The `finalizeTrade` service sets `phase = "IN_TRANSIT"` and `status = "ACTIVE"` instead of `phase = "COMPLETED"` and `status = "COMPLETED"`. This directly violates the documented state machine:

```
DELIVERED
  └─→ COMPLETED   (POST /trade-operations/:id/finalize)
```

### Missing `sellingPrice` Propagation in Simulation

The simulation module creates trade operations without setting `sellingPrice`. This is a structural gap: the `createTradeOperation` simulation endpoint ignores `adminMargin`, `buyerCommission`, and `sellerCommission` fields (they're accepted in the DTO but discarded with `void data;`):

```typescript
async createTradeOperation(buyListingId, data) {
  void data;  // ← adminMargin, buyerCommission, sellerCommission silently ignored
  ...
}
```

These values should be used to compute and store `sellingPrice` (e.g., `buyerMaxPrice * (1 + adminMargin/100)`) on the trade operation.

### `assignInspector` Creates Duplicate Inspections

If `POST /trade-operations/:id/request-inspections` is called first (creating a `PENDING` inspection), and then `POST /simulation/admin/assign-inspector` is called, the assign-inspector endpoint creates a **new, separate** `InspectionRequest` with status `SCHEDULED` — it does not assign the inspector to the existing `PENDING` request. This results in 2 inspection records for the same sale listing/trade operation.

The `accept-job` call in Scenario 4 uses the ID from the `assign-inspector` response (the second, newer inspection), which works. But the original `PENDING` inspection from `request-inspections` is orphaned.

**Impact:** `GET /trade-operations/:id/request-inspections` or similar queries will show 2 inspections when only 1 is expected.

---

## Notes

### What Works Well

1. **Seller negotiation flows** (accept, counter-offer, reject) are fully functional and correctly cascade `TradeSeller.status`.
2. **Transport flow** (create-transport, start-job, complete-delivery) correctly sets `phase = DELIVERED`.
3. **Transport bidding competition** (create-request, submit-bid, select-bid) correctly rejects losing bids and creates a job.
4. **Inspection result submission** correctly sets `TradeSeller.status = FAILED_INSPECTION` and `isVerified = false` on failure, and `isVerified = true` on pass.
5. **Cancel operations** work correctly with proper 400 guard on re-update.
6. **Cleanup endpoint** works correctly.
7. **Auth and role guards** work throughout — all simulation endpoints correctly require `ADMIN` role.

### Simulation Module Architecture Observations

- The simulation service correctly uses the database directly (no business logic services layer), which makes it fast but means it bypasses validation that real endpoints would enforce.
- The `accept-offer` simulation endpoint bypasses the negotiation service's `acceptOffer()` method, which may have additional business logic (e.g., updating `SaleListing.status = SOLD`). Currently `SaleListing.status` remains `ACTIVE` even after a seller accepts — a minor logic gap for the simulation only.
- The `create-transport` simulation endpoint correctly sets `TradeOperation.phase = IN_TRANSIT` atomically with job creation, which is the correct cascade behavior.

### Test Environment

- Backend: NestJS on http://localhost:4000/api
- Database: PostgreSQL via Prisma (seed data from `prisma/seed-demo.ts`)
- Farmers: 2 (seller1@agrotrade.com, seller2@agrotrade.com)
- Transporters: 1 (georgi.petrov@transbg.com)
- Inspectors: 3 (inspector1/2/3@agrotrade.com)
- Buyers: 1 (buyer@agrotrade.com)

---

## Fix Priority Matrix

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| P0 | `sellingPrice` not set in `createTradeOperation` → finalize always fails | Low (add 1 field) | Unblocks all 3 failing scenarios |
| P0 | `agreedPrice` not set in `accept-offer` simulation → profit cost=0 | Low (add 1 field) | Required for correct profit calc |
| P0 | `finalizeTrade` sets `phase=IN_TRANSIT` instead of `COMPLETED` | Low (fix 2 field values) | Correct terminal state |
| P1 | `accept-job` sets `status=SCHEDULED` instead of `IN_PROGRESS` | Low (change enum value) | Correct state machine |
| P1 | `POST /trade-operations/:id/phase` docs wrong (use PATCH instead) | Low (doc update) | Prevents confusion |
| P1 | `actors.inspectors` always empty (wrong field name in getFullTradeState) | Low (rename field) | Breaks inspector visibility |
| P2 | `assign-inspector` creates duplicate inspections | Medium (refactor to upsert) | Data integrity |
| P2 | Only 1 transporter in seed data | Low (add user in seed) | Realistic bidding test |
| P2 | Phase-only cancel doesn't set status=CANCELLED | Low (service logic) | UX consistency |
