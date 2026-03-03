# State Machines

All state/phase values are Prisma enums. Transitions are enforced server-side. Arrows show allowed transitions.

---

## 1. TradeOperation Phase (`TradePhase`)

The primary lifecycle of a trade operation. Phase transitions are validated by `getValidPhaseTransitions()` in `trade-operation.service.ts`.

```
INITIATION
  └─→ SELLER_MATCHING
        └─→ SELLER_NEGOTIATION
              ├─→ INSPECTION_PENDING
              │     └─→ TRANSPORT_MATCHING
              └─→ TRANSPORT_MATCHING
                    └─→ TRANSPORT_BIDDING
                          └─→ IN_TRANSIT ←─ (also from TRANSPORT_MATCHING)
                                └─→ DELIVERED
                                      └─→ COMPLETED
```

Any phase except `COMPLETED` can transition to `CANCELLED`.

| Phase | Description | Trigger |
|-------|-------------|---------|
| `INITIATION` | Operation created, buy listing linked | `POST /trade-operations` |
| `SELLER_MATCHING` | Admin identifying matching sellers | `PATCH /trade-operations/:id/phase` |
| `SELLER_NEGOTIATION` | Offers sent to sellers, awaiting agreement | Auto when sellers added via `POST /trade-operations/:id/sellers` |
| `INSPECTION_PENDING` | Inspections requested for seller lots | `POST /trade-operations/:id/request-inspections` |
| `TRANSPORT_MATCHING` | All sellers confirmed, finding transporter | After all seller negotiations accepted |
| `TRANSPORT_BIDDING` | Transport request open for bids | After transport request created |
| `IN_TRANSIT` | Transporter accepted, goods moving | `POST /transport/:id/jobs/:jobId/start` |
| `DELIVERED` | Goods arrived at buyer | `POST /transport/:id/jobs/:jobId/deliver` |
| `COMPLETED` | Operation finalized | `POST /trade-operations/:id/finalize` |
| `CANCELLED` | Operation cancelled | `PATCH /trade-operations/:id` with `status: CANCELLED` |

**API endpoint:** `PATCH /api/trade-operations/:id/phase` — body: `{ "phase": "SELLER_MATCHING" }`

---

## 2. TradeOperation Status (`TradeStatus`)

Orthogonal to phase — represents operational health of the trade.

```
ACTIVE ──→ ON_HOLD ──→ ACTIVE
  └─→ COMPLETED
  └─→ CANCELLED
  └─→ DISPUTED
```

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Normal operation in progress |
| `ON_HOLD` | Temporarily paused (dispute, admin action) |
| `COMPLETED` | Successfully finished |
| `CANCELLED` | Terminated early |
| `DISPUTED` | Active dispute between parties |

Note: A `COMPLETED` or `CANCELLED` operation cannot be updated (validated in service).

---

## 3. TradeSeller Status (`SellerStatus`)

Per-seller participation status within a trade operation.

```
INVITED
  ├─→ NEGOTIATING ──→ ACCEPTED ──→ CONFIRMED
  │                └─→ REJECTED
  │                └─→ WITHDRAWN
  └─→ REJECTED
  └─→ WITHDRAWN
  └─→ FAILED_INSPECTION   (from ACCEPTED or CONFIRMED after inspection fails)
```

| Status | Set By | Trigger |
|--------|--------|---------|
| `INVITED` | System | Seller added to trade via `POST /trade-operations/:id/sellers` |
| `NEGOTIATING` | System | Negotiation offer sent |
| `ACCEPTED` | System | Negotiation `acceptOffer()` called |
| `REJECTED` | System | Negotiation `rejectOffer()` called |
| `CONFIRMED` | System | Final confirmation after all checks |
| `WITHDRAWN` | System | Negotiation `withdrawOffer()` called |
| `FAILED_INSPECTION` | System | Inspection result marked failed |

---

## 4. Negotiation Status (`NegotiationStatus`)

Per offer-negotiation lifecycle. Stored on `OfferNegotiation` table.

```
PENDING
  ├─→ ACCEPTED
  ├─→ REJECTED
  ├─→ COUNTERED ──→ ACCEPTED
  │              └─→ REJECTED
  │              └─→ COUNTERED (repeated rounds)
  │              └─→ WITHDRAWN
  ├─→ EXPIRED   (48-hour TTL, via cron job in negotiation-expiry.service.ts)
  └─→ WITHDRAWN
```

| Status | Terminal | API Action |
|--------|----------|------------|
| `PENDING` | No | Initial state when offer sent |
| `ACCEPTED` | Yes | `POST /negotiations/:id/accept` |
| `REJECTED` | Yes | `POST /negotiations/:id/reject` |
| `COUNTERED` | No | `POST /negotiations/:id/counter` — opens next round |
| `EXPIRED` | Yes | Cron auto-expires after 48 hours |
| `WITHDRAWN` | Yes | `POST /negotiations/:id/withdraw` |

Guard rules:
- Cannot counter an `ACCEPTED`, `REJECTED`, or `EXPIRED` negotiation.
- Cannot accept/reject a `WITHDRAWN` negotiation.

---

## 5. Offer Status (`OfferStatus`)

Applies to direct sell/buy offers on listings (not negotiation rounds).

```
PENDING
  ├─→ ACCEPTED
  ├─→ REJECTED
  ├─→ NEGOTIATING
  ├─→ EXPIRED
  └─→ WITHDRAWN
```

| Status | Meaning |
|--------|---------|
| `PENDING` | Offer submitted, awaiting response |
| `ACCEPTED` | Counterparty accepted |
| `REJECTED` | Counterparty declined |
| `NEGOTIATING` | Counter-offer in progress |
| `EXPIRED` | TTL elapsed without response |
| `WITHDRAWN` | Offeror cancelled |

---

## 6. Sale/Buy Listing Status (`ListingStatus`)

```
PENDING ──→ ACTIVE
  └─→ CANCELLED

ACTIVE
  ├─→ SOLD
  ├─→PENDING
  ├─→ EXPIRED
  └─→ CANCELLED
```

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Visible, accepting offers |
| `SOLD` | Fully fulfilled |
| `PENDING` | Created but not yet published |
| `EXPIRED` | Past expiry date |
| `CANCELLED` | Manually cancelled |

**API:** `PATCH /api/seller/listings/:id` — field: `status`

---

## 7. Transport Request Status (`TransportRequestStatus`)

```
OPEN ──→ BIDDING ──→ EVALUATING ──→ ASSIGNED ──→ IN_PROGRESS ──→ COMPLETED
                                                               └─→ CANCELLED
└─→ CANCELLED (any stage)
```

| Status | Trigger |
|--------|---------|
| `OPEN` | Created via `POST /transport/requests` |
| `BIDDING` | First bid submitted |
| `EVALUATING` | Admin opens review phase |
| `ASSIGNED` | Admin accepts a bid via `POST /transport/:id/bids/:bidId/accept` |
| `IN_PROGRESS` | Transporter starts job |
| `COMPLETED` | All jobs complete (delivery confirmed) |
| `CANCELLED` | Admin cancels request |

---

## 8. Transport Bid Status (`BidStatus`)

```
PENDING
  ├─→ ACCEPTED  (sets all other bids on same request to REJECTED)
  ├─→ REJECTED
  ├─→ EXPIRED
  └─→ WITHDRAWN
```

| Status | Trigger |
|--------|---------|
| `PENDING` | Transporter submits bid via `POST /transport/:id/bids` |
| `ACCEPTED` | Admin accepts via `POST /transport/:id/bids/:bidId/accept` |
| `REJECTED` | Admin rejects OR auto-rejected when another bid accepted |
| `EXPIRED` | TTL elapsed |
| `WITHDRAWN` | Transporter withdraws via `DELETE /transport/:id/bids/:bidId` |

When a bid is accepted:
1. Bid status → `ACCEPTED`
2. All other bids on same request → `REJECTED`
3. `TransportRequest.status` → `ASSIGNED`
4. `TransportJob` created with status `ASSIGNED`
5. `TradeOperation.phase` → `IN_TRANSIT`

---

## 9. Transport Job Status (`TransportJobStatus`)

```
ASSIGNED
  └─→ STARTED
        └─→ PICKING_UP
              └─→ IN_TRANSIT
                    └─→ DELIVERING
                          └─→ COMPLETED
```

Lateral: Any active status can move to `DELAYED`.
`CANCELLED` is a terminal state reachable from any non-completed status.

| Status | Trigger |
|--------|---------|
| `ASSIGNED` | Created when bid accepted |
| `STARTED` | `POST /transport/jobs/:jobId/start` |
| `PICKING_UP` | System sets when pickup begins |
| `IN_TRANSIT` | After all pickups complete |
| `DELIVERING` | Arrival at delivery location |
| `COMPLETED` | `POST /transport/:id/jobs/:jobId/deliver` — also sets `TradeOperation.phase` → `COMPLETED` |
| `DELAYED` | `PATCH /transport/jobs/:jobId/status` with `status: DELAYED` |
| `CANCELLED` | Admin action |

---

## 10. Inspection Status (`InspectionStatus`)

```
PENDING
  └─→ SCHEDULED   (inspector assigned)
        └─→ IN_PROGRESS  (inspector accepts/starts job)
              ├─→ COMPLETED  (results submitted)
              └─→ CANCELLED
  └─→ CANCELLED
```

| Status | Trigger |
|--------|---------|
| `PENDING` | Created via `POST /inspections` |
| `SCHEDULED` | Inspector assigned via `POST /inspections/:id/assign` |
| `IN_PROGRESS` | Inspector accepts job via `POST /api/inspector/jobs/:id/accept` |
| `COMPLETED` | Results submitted via `POST /inspections/:id/results` |
| `CANCELLED` | Admin cancels |

When inspection completes:
- If `passed: false` → `TradeSeller.status` → `FAILED_INSPECTION`
- If `passed: true` → no status change to TradeSeller; trade may advance to `TRANSPORT_MATCHING`

---

## 11. Transporter Status (`TransporterStatus`)

Per-transporter participation within a trade operation.

```
INVITED
  └─→ BIDDING ──→ SELECTED ──→ CONFIRMED ──→ IN_TRANSIT ──→ DELIVERED
  └─→ CANCELLED (any stage)
```

| Status | Meaning |
|--------|---------|
| `INVITED` | Transporter added to trade |
| `BIDDING` | Transporter placed bid |
| `SELECTED` | Bid accepted by admin |
| `CONFIRMED` | Transporter confirmed assignment |
| `IN_TRANSIT` | Goods being transported |
| `DELIVERED` | Delivery complete |
| `CANCELLED` | Removed from trade |

---

## 12. Driver Status (`DriverStatus`)

Operational availability status for fleet drivers.

```
OFFLINE ──→ AVAILABLE
               ├─→ ON_BREAK ──→ AVAILABLE
               └─→ ASSIGNED ──→ EN_ROUTE ──→ AT_PICKUP ──→ IN_TRANSIT
                                                              └─→ AT_DELIVERY ──→ COMPLETED
                                                                                    └─→ AVAILABLE
```

| Status | Meaning |
|--------|---------|
| `OFFLINE` | Not working |
| `AVAILABLE` | Ready to be assigned |
| `ON_BREAK` | Temporarily unavailable |
| `ASSIGNED` | Assigned to a job, not yet departed |
| `EN_ROUTE` | Travelling to pickup |
| `AT_PICKUP` | At pickup location |
| `IN_TRANSIT` | Carrying goods |
| `AT_DELIVERY` | At delivery location |
| `COMPLETED` | Delivery finished |

---

## 13. Transport Request Status (Bidding Module) — `RequestStatus`

Applied to `BuyListing` request fulfillment tracking (separate from `TransportRequestStatus`).

```
ACTIVE ──→ FULFILLED
        └─→ PARTIALLY_FULFILLED
        └─→ EXPIRED
        └─→ CANCELLED
```

---

## Cross-State Cascade Rules

| Trigger Event | Cascading State Changes |
|---------------|------------------------|
| All `TradeSeller.status` → `ACCEPTED` | `TradeOperation.phase` may advance to `TRANSPORT_MATCHING` |
| Transport bid accepted | `BidStatus` → `ACCEPTED`, all others → `REJECTED`, `TransportRequest.status` → `ASSIGNED`, `TransportJob` created with `ASSIGNED`, `TradeOperation.phase` → `IN_TRANSIT` |
| Transport job `COMPLETED` | `TransportRequest.status` → `COMPLETED`, `TradeOperation.phase` → `COMPLETED` |
| Inspection result `passed: false` | `TradeSeller.status` → `FAILED_INSPECTION` |
| `TradeOperation` cancelled | Does NOT automatically cancel child inspections, negotiations, or transport requests |
| Negotiation `ACCEPTED` | `TradeSeller.status` → `ACCEPTED`, `SaleListing.status` may → `SOLD` if fully allocated |
| Negotiation `WITHDRAWN` | `TradeSeller.status` → `WITHDRAWN`, `SaleListing.status` → `ACTIVE` |
