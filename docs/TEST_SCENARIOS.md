# Test Scenarios

All scenarios use demo credentials. All simulation endpoints require `ADMIN` JWT. Base URL: `http://localhost:4000/api`.

Demo credentials:
- Admin: `admin@agrotrade.com` / `admin123`
- Seller/Farmer: `seller1@agrotrade.com` / `password123`
- Buyer: `buyer@agrotrade.com` / `password123`

---

## Scenario 1 — Happy Path: Complete Trade (No Inspection)

Covers the full lifecycle from buy listing to completed delivery where the seller accepts the first offer.

### Step 1: Admin logs in

```
POST /auth/login
{ "email": "admin@agrotrade.com", "password": "admin123" }
→ save accessToken as ADMIN_TOKEN
```

### Step 2: Buyer logs in and creates buy listing

```
POST /auth/login
{ "email": "buyer@agrotrade.com", "password": "password123" }
→ save accessToken as BUYER_TOKEN

POST /buyer/listings
Authorization: Bearer BUYER_TOKEN
{
  "productId": "<product-id>",       // GET /products first
  "quantity": 100,
  "unit": "TON",
  "maxPricePerUnit": 250,
  "neededBy": "2025-12-31T00:00:00Z",
  "deliveryLocation": { "latitude": 42.6977, "longitude": 23.3219, "address": "Sofia" }
}
→ save id as BUY_LISTING_ID
→ expected: status = "ACTIVE"
```

### Step 3: Farmer creates sale listing (via admin simulation)

```
GET /simulation/users/FARMER
Authorization: Bearer ADMIN_TOKEN
→ pick any farmer id as FARMER_ID

POST /simulation/admin/farmer/{FARMER_ID}/create-sale-listing
Authorization: Bearer ADMIN_TOKEN
{
  "productCategory": "SOFT_WHEAT",
  "quantity": 120,
  "pricePerUnit": 220,
  "latitude": 42.5,
  "longitude": 24.0
}
→ save id as SALE_LISTING_ID
```

### Step 4: Admin creates trade operation

```
POST /simulation/admin/create-trade-operation
Authorization: Bearer ADMIN_TOKEN
{
  "buyListingId": "BUY_LISTING_ID",
  "adminMargin": 15,
  "buyerCommission": 2.5,
  "sellerCommission": 1.5
}
→ save id as TRADE_OP_ID
→ expected: phase = "INITIATION", status = "ACTIVE"
```

### Step 5: Admin sends offer to farmer

```
POST /simulation/admin/send-offers
Authorization: Bearer ADMIN_TOKEN
{
  "tradeOperationId": "TRADE_OP_ID",
  "offers": [
    {
      "farmerId": "FARMER_ID",
      "saleListingId": "SALE_LISTING_ID",
      "requestedQuantity": 100,
      "offeredPrice": 215
    }
  ]
}
→ save negotiations[0].id as NEGOTIATION_ID
→ expected: TradeSeller.status = "NEGOTIATING", Negotiation.status = "PENDING"
```

### Step 6: Seller logs in and accepts offer

```
POST /auth/login
{ "email": "seller1@agrotrade.com", "password": "password123" }
→ save accessToken as SELLER_TOKEN

POST /simulation/seller/{FARMER_ID}/accept-offer
Authorization: Bearer ADMIN_TOKEN
{ "negotiationId": "NEGOTIATION_ID" }
→ expected: Negotiation.status = "ACCEPTED", TradeSeller.status = "ACCEPTED"
```

### Step 7: Admin gets transporter and creates transport

```
GET /simulation/users/TRANSPORTER
Authorization: Bearer ADMIN_TOKEN
→ pick transporter id as TRANSPORTER_ID

POST /simulation/admin/create-transport
Authorization: Bearer ADMIN_TOKEN
{
  "tradeOperationId": "TRADE_OP_ID",
  "transporterId": "TRANSPORTER_ID",
  "pickupLat": 42.5,
  "pickupLng": 24.0,
  "deliveryLat": 42.6977,
  "deliveryLng": 23.3219,
  "bidAmount": 1200,
  "estimatedDuration": 4
}
→ save transportJob.id as JOB_ID
→ expected: TradeOperation.phase = "IN_TRANSIT"
```

### Step 8: Transporter starts job

```
POST /simulation/transporter/{TRANSPORTER_ID}/start-job
Authorization: Bearer ADMIN_TOKEN
{ "jobId": "JOB_ID" }
→ expected: TransportJob.status = "IN_TRANSIT"
```

### Step 9: Transporter completes delivery

```
POST /simulation/transporter/{TRANSPORTER_ID}/complete-delivery
Authorization: Bearer ADMIN_TOKEN
{ "jobId": "JOB_ID" }
→ expected: TransportJob.status = "COMPLETED", TradeOperation.phase = "DELIVERED"
```

### Step 10: Admin finalizes trade

```
POST /trade-operations/{TRADE_OP_ID}/finalize
Authorization: Bearer ADMIN_TOKEN
{
  "actualTransportCost": 1200,
  "finalNotes": "Delivery confirmed, all goods in good condition"
}
→ expected: TradeOperation.phase = "COMPLETED", TradeOperation.status = "COMPLETED"
```

**Final state assertions:**
- `TradeOperation.phase` = `COMPLETED`
- `TradeOperation.status` = `COMPLETED`
- `TradeSeller.status` = `ACCEPTED`
- `TransportJob.status` = `COMPLETED`
- `BuyListing.status` = `FULFILLED` or `SOLD`

---

## Scenario 2 — Seller Counter-Offer (Multi-Round Negotiation)

Tests the counter-offer flow where seller rejects initial price and negotiates.

### Steps 1–5: Same as Scenario 1 (through send-offers)

### Step 6: Seller counter-offers

```
POST /simulation/seller/{FARMER_ID}/counter-offer
Authorization: Bearer ADMIN_TOKEN
{
  "negotiationId": "NEGOTIATION_ID",
  "counterPrice": 230,
  "counterQuantity": 100
}
→ expected: Negotiation.status = "COUNTERED"
```

### Step 7: Admin accepts counter-offer

```
POST /simulation/admin/accept-counter-offer
Authorization: Bearer ADMIN_TOKEN
{ "negotiationId": "NEGOTIATION_ID" }
→ expected: Negotiation.status = "ACCEPTED", TradeSeller.status = "ACCEPTED"
```

Continue from Scenario 1 Step 7 onwards.

**Key assertions:**
- Counter price `230` should be reflected in `TradeSeller.agreedPrice`
- Profit margin may drop; check `GET /profit/{TRADE_OP_ID}` for updated estimates

---

## Scenario 3 — Seller Rejects Offer

Tests rejection handling and whether the trade operation remains manageable.

### Steps 1–5: Same as Scenario 1

### Step 6: Seller rejects offer

```
POST /simulation/seller/{FARMER_ID}/reject-offer
Authorization: Bearer ADMIN_TOKEN
{
  "negotiationId": "NEGOTIATION_ID",
  "reason": "Price too low"
}
→ expected: Negotiation.status = "REJECTED", TradeSeller.status = "REJECTED"
```

### Step 7: Admin sends new offer to a different farmer

Repeat Step 5 with a different `farmerId` and `saleListingId`.

**Key assertions:**
- Original `TradeSeller` entry remains with `status = "REJECTED"`
- Trade operation `phase` remains `SELLER_NEGOTIATION`
- New negotiation starts fresh with `status = "PENDING"`

---

## Scenario 4 — Inspection Required (Pass)

Tests the inspection flow before transport matching.

### Steps 1–5: Same as Scenario 1

### Step 6: Seller accepts offer (same as Scenario 1 Step 6)

### Step 7: Admin advances to inspection phase

```
PATCH /trade-operations/{TRADE_OP_ID}
Authorization: Bearer ADMIN_TOKEN
{ "phase": "INSPECTION_PENDING" }
```

### Step 8: Admin requests inspection

```
POST /trade-operations/{TRADE_OP_ID}/request-inspections
Authorization: Bearer ADMIN_TOKEN
{
  "inspections": [{ "saleListingId": "SALE_LISTING_ID", "priority": "HIGH" }]
}
→ save inspections[0].id as INSPECTION_ID
→ expected: InspectionRequest.status = "PENDING"
```

### Step 9: Admin assigns inspector

```
GET /simulation/users/INSPECTOR
→ pick inspector id as INSPECTOR_ID

POST /simulation/admin/assign-inspector
Authorization: Bearer ADMIN_TOKEN
{
  "tradeOperationId": "TRADE_OP_ID",
  "inspectorId": "INSPECTOR_ID"
}
→ expected: InspectionRequest.status = "SCHEDULED"
```

### Step 10: Inspector accepts job

```
POST /simulation/inspector/{INSPECTOR_ID}/accept-job
Authorization: Bearer ADMIN_TOKEN
{ "inspectionId": "INSPECTION_ID" }
→ expected: InspectionRequest.status = "SCHEDULED"
```

### Step 11: Inspector submits passing results

```
POST /simulation/inspector/{INSPECTOR_ID}/submit-results
Authorization: Bearer ADMIN_TOKEN
{
  "inspectionId": "INSPECTION_ID",
  "qualityScore": 88,
  "result": "PASSED",
  "notes": "Grain moisture within acceptable range, no pests detected"
}
→ expected: InspectionRequest.status = "COMPLETED", TradeSeller.isVerified = true
```

Continue from Scenario 1 Step 7 (transport).

---

## Scenario 5 — Inspection Fail

Tests the failed inspection path.

### Steps 1–10: Same as Scenario 4 through inspector accepts job

### Step 11: Inspector submits failing results

```
POST /simulation/inspector/{INSPECTOR_ID}/submit-results
Authorization: Bearer ADMIN_TOKEN
{
  "inspectionId": "INSPECTION_ID",
  "qualityScore": 42,
  "result": "FAILED",
  "notes": "High moisture content 18%, fungal contamination present"
}
→ expected: InspectionRequest.status = "COMPLETED", TradeSeller.status = "FAILED_INSPECTION"
```

**Key assertions:**
- `TradeSeller.status` = `FAILED_INSPECTION`
- `TradeSeller.isVerified` = `false`
- Trade operation phase remains `INSPECTION_PENDING`
- Admin must add a replacement seller before proceeding

---

## Scenario 6 — Transport Bidding Competition

Tests the competitive bidding flow with multiple transporters.

### Steps 1–6: Same as Scenario 1 through seller accepts offer

### Step 7: Admin advances to transport matching

```
PATCH /trade-operations/{TRADE_OP_ID}
Authorization: Bearer ADMIN_TOKEN
{ "phase": "TRANSPORT_MATCHING" }
```

### Step 8: Admin creates transport request (open for bids)

```
POST /simulation/admin/create-transport-request
Authorization: Bearer ADMIN_TOKEN
{
  "tradeOperationId": "TRADE_OP_ID",
  "pickupLat": 42.5,
  "pickupLng": 24.0,
  "deliveryLat": 42.6977,
  "deliveryLng": 23.3219,
  "distanceKm": 150
}
→ save id as TRANSPORT_REQUEST_ID
→ expected: TransportRequest.status = "OPEN"
```

### Step 9: Multiple transporters submit bids

```
GET /simulation/users/TRANSPORTER
→ pick two transporter ids: TRANSPORTER_A, TRANSPORTER_B

POST /simulation/transporter/{TRANSPORTER_A}/submit-bid
Authorization: Bearer ADMIN_TOKEN
{
  "transportRequestId": "TRANSPORT_REQUEST_ID",
  "bidAmount": 1500,
  "estimatedDuration": 5,
  "vehicleType": "FLATBED",
  "vehicleCapacity": 25
}

POST /simulation/transporter/{TRANSPORTER_B}/submit-bid
Authorization: Bearer ADMIN_TOKEN
{
  "transportRequestId": "TRANSPORT_REQUEST_ID",
  "bidAmount": 1200,
  "estimatedDuration": 4,
  "vehicleType": "FLATBED",
  "vehicleCapacity": 20
}
→ save TRANSPORTER_B bid id as WINNING_BID_ID
```

### Step 10: Admin selects winning bid

```
POST /simulation/admin/select-transport-bid
Authorization: Bearer ADMIN_TOKEN
{
  "transportRequestId": "TRANSPORT_REQUEST_ID",
  "bidId": "WINNING_BID_ID"
}
→ expected: WINNING_BID bid status = "ACCEPTED"
→ expected: TRANSPORTER_A bid status = "REJECTED"
→ expected: TransportRequest.status = "ASSIGNED"
→ expected: TransportJob created with status = "ASSIGNED"
→ expected: TradeOperation.phase = "IN_TRANSIT"
```

Continue from Scenario 1 Step 8 (transporter starts job).

---

## Scenario 7 — Cancel Trade Operation

Tests cancellation at different phases.

### Cancel at INITIATION

```
POST /simulation/admin/create-trade-operation
...
→ save TRADE_OP_ID

PATCH /trade-operations/{TRADE_OP_ID}
Authorization: Bearer ADMIN_TOKEN
{ "status": "CANCELLED" }
→ expected: TradeOperation.status = "CANCELLED"
```

Verify: subsequent update attempts return 400 "Cannot update a cancelled trade operation".

### Cancel mid-negotiation

Run Steps 1–5 of Scenario 1, then:

```
PATCH /trade-operations/{TRADE_OP_ID}
Authorization: Bearer ADMIN_TOKEN
{ "phase": "CANCELLED" }
→ expected: TradeOperation.phase = "CANCELLED"
```

**Key assertions:**
- Existing negotiations are NOT automatically cancelled
- `GET /trade-operations/{TRADE_OP_ID}` returns the full cancelled state
- Cannot re-activate a cancelled operation

---

## Scenario 8 — Negotiation Expiry (Automated)

Tests the 48-hour auto-expiry via the `NegotiationExpiryService` cron.

This cannot be triggered manually through the API. To test:

1. Create a negotiation (Steps 1–5 of Scenario 1).
2. In the database, set `offerNegotiation.expiresAt` to a past timestamp.
3. Wait for or manually trigger the cron job.

**Expected result:**
- `Negotiation.status` → `EXPIRED`
- `TradeSeller.status` remains `NEGOTIATING` (expiry does not auto-reject)

---

## Scenario 9 — Pricing Update (Quality Dispute)

Tests admin repricing after quality concerns.

### Steps 1–5: Same as Scenario 1

### Update price before acceptance

```
POST /simulation/admin/update-pricing
Authorization: Bearer ADMIN_TOKEN
{
  "negotiationId": "NEGOTIATION_ID",
  "newPrice": 200,
  "reason": "Grade B instead of Grade A per field inspection"
}
→ expected: Negotiation.currentOffer.price updated to 200
```

Continue with seller accepting the revised offer.

**Key assertions:**
- `TradeSeller.agreedPrice` reflects the updated price `200`
- Profit calculation updates when calling `GET /profit/{TRADE_OP_ID}`

---

## Scenario 10 — Cleanup Test Data

Remove all data created by test users to reset state.

```
DELETE /simulation/admin/cleanup-test-data
Authorization: Bearer ADMIN_TOKEN
→ expected: { "deleted": { "users": N, "listings": N, ... } }
```

Run this after each test session to avoid data pollution.

---

## Simulation API Quick Reference

All simulation endpoints require `Authorization: Bearer ADMIN_TOKEN`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/simulation/users/:role` | List users by role |
| `GET` | `/simulation/trade-operation/:id/full-state` | Full trade state snapshot |
| `POST` | `/simulation/users/create-test-user` | Create test user |
| `POST` | `/simulation/buyer/:userId/create-listing` | Buyer creates buy listing |
| `POST` | `/simulation/seller/:userId/accept-offer` | Seller accepts negotiation |
| `POST` | `/simulation/seller/:userId/counter-offer` | Seller counter-offers |
| `POST` | `/simulation/seller/:userId/reject-offer` | Seller rejects negotiation |
| `POST` | `/simulation/transporter/:userId/submit-bid` | Transporter submits bid |
| `POST` | `/simulation/transporter/:userId/start-job` | Transporter starts job |
| `POST` | `/simulation/transporter/:userId/complete-delivery` | Transporter delivers |
| `POST` | `/simulation/inspector/:userId/accept-job` | Inspector accepts job |
| `POST` | `/simulation/inspector/:userId/submit-results` | Inspector submits results |
| `POST` | `/simulation/admin/farmer/:farmerId/create-sale-listing` | Create farmer listing |
| `POST` | `/simulation/admin/create-trade-operation` | Create trade operation |
| `POST` | `/simulation/admin/send-offers` | Send offers to farmers |
| `POST` | `/simulation/admin/accept-counter-offer` | Admin accepts counter |
| `POST` | `/simulation/admin/assign-inspector` | Assign inspector |
| `POST` | `/simulation/admin/create-transport` | Create and accept transport (single transporter) |
| `POST` | `/simulation/admin/create-transport-request` | Create open transport request (bidding) |
| `POST` | `/simulation/admin/select-transport-bid` | Select winning bid |
| `POST` | `/simulation/admin/update-pricing` | Update negotiation price |
| `POST` | `/simulation/admin/complete-trade` | Mark trade complete |
| `DELETE` | `/simulation/admin/cleanup-test-data` | Remove all test data |
