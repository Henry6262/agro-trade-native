# 06 — Database

> Prisma schema — all 35 models, relationships, and query patterns.

**ORM:** Prisma
**Database:** PostgreSQL (Railway managed)
**Schema:** `backend/prisma/schema.prisma`
**Migrations:** `backend/prisma/migrations/`

---

## Binary Targets (Critical for Railway)

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x", "linux-musl-openssl-3.0.x"]
}
```

All three targets are required:
- `native` — local macOS development
- `debian-openssl-3.0.x` — Railway Debian Docker
- `linux-musl-openssl-3.0.x` — Railway Alpine fallback

---

## Model Map (35 Models)

### Users & Identity

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `User` | `id`, `privyDid`, `role`, `phone`, `name`, `company` | Role: BUYER / SELLER / INSPECTOR / TRANSPORTER / ADMIN |
| `PhoneOtp` | `phone`, `code`, `expiresAt` | SMS verification codes |
| `Company` | `name`, `type`, `userId` | Optional company affiliation |
| `Address` | `userId`, `addressType`, `street`, `cityId`, `latitude`, `longitude` | Geocoded addresses |
| `Region` | `name`, `country` | Geographic region |
| `City` | `name`, `regionId` | City within a region |

### Products & Listings

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `Product` | `name`, `category`, `type`, `unit` | Catalogue (wheat, corn, barley, etc.) |
| `SpecificationType` | `name`, `unit`, `dataType` | Template for product specs |
| `ProductSpecTemplate` | `productId`, `specTypeId`, `isRequired` | Which specs a product needs |
| `SaleListing` | `sellerId`, `productId`, `quantity`, `unit`, `askingPrice`, `status`, `addressId` | Seller's offer to sell |
| `BuyListing` | `buyerId`, `productId`, `quantity`, `unit`, `maxBudget`, `status` | Buyer's request to buy |
| `ListingSpec` | `listingId`, `specTypeId`, `value` | Spec values on a listing |
| `Offer` | `buyListingId`, `sellerListingId`, `status`, `type` | Match between buy + sell listings |
| `RegionalPrice` | `productId`, `regionId`, `price`, `unit`, `date` | Market price data |

### Trade Operations (Core)

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `TradeOperation` | `buyListingId`, `status`, `phase`, `totalAmount`, `currency` | The central trade entity |
| `TradeSeller` | `tradeOperationId`, `sellerListingId`, `status` | Many sellers can be in one trade |
| `TradeTransporter` | `tradeOperationId`, `transportJobId` | Transporter assignment |
| `TradeStateHistory` | `tradeOperationId`, `fromStatus`, `toStatus`, `changedBy`, `reason` | Audit log of phase changes |
| `TradeNote` | `tradeOperationId`, `userId`, `content` | Notes attached to a trade |
| `TradeEvent` | `tradeOperationId`, `type`, `data`, `userId` | Immutable event log |

### Negotiations

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `OfferNegotiation` | `offerId`, `status`, `currentRound` | Tracks negotiation state |
| `OfferRound` | `negotiationId`, `roundNumber`, `proposedPrice`, `proposedBy`, `status` | Each counter-offer round |

### Inspections

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `InspectionRequest` | `tradeOperationId`, `saleListing`, `inspectorId`, `status`, `priority`, `latitude`, `longitude` | Inspection job |

`status` values: `PENDING` / `SCHEDULED` / `IN_PROGRESS` / `COMPLETED` / `FAILED` / `CANCELLED`

The result is stored as JSON in `verificationResult` on the `InspectionRequest`.

### Transport

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `TransportRequest` | `tradeOperationId`, `origin`, `destination`, `cargoType`, `weight`, `status` | Request for transport |
| `TransportBid` | `requestId`, `companyId`, `amount`, `estimatedDays`, `status` | Transporter's bid |
| `TransportJob` | `requestId`, `bidId`, `status`, `trackingNumber` | Accepted transport job |
| `Truck` | `companyId`, `driverId`, `plateNumber`, `capacity` | Fleet management |
| `TransportCostCalculation` | `tradeOperationId`, `distance`, `costPerKm`, `total` | Cost estimates |
| `TransportCostSettings` | Global transport pricing settings |

### Transport Companies

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `TransportCompany` | `name`, `country`, `adminUserId` | Company profile |
| `CompanyAdmin` | `companyId`, `userId` | Company admin relationship |
| `Driver` | `companyId`, `userId`, `licenseNumber` | Driver record |
| `CompanyDocument` | `companyId`, `type`, `url` | Company docs (insurance, etc.) |
| `DriverDocument` | `driverId`, `type`, `url` | Driver docs (license, etc.) |

### Financial

| Model | Key Fields | Notes |
|-------|-----------|-------|
| `ProfitEstimation` | `tradeOperationId`, `buyPrice`, `sellPrice`, `margin` | P&L estimates |

---

## Key Relationships

```
User (BUYER)
  └── BuyListing[]
        └── Offer[]
              └── TradeOperation
                    ├── TradeSeller[]
                    │     └── SaleListing (from SELLER User)
                    ├── InspectionRequest (assigned to INSPECTOR User)
                    ├── TransportRequest
                    │     ├── TransportBid[] (from TransportCompany)
                    │     └── TransportJob
                    ├── TradeStateHistory[]
                    ├── TradeEvent[]
                    └── TradeNote[]
```

---

## Common Query Patterns

### Get active trade with all relations
```typescript
const trade = await prisma.tradeOperation.findUnique({
  where: { id: tradeId },
  include: {
    buyListing: { include: { buyer: true, product: true } },
    tradeSellers: { include: { saleListing: { include: { seller: true } } } },
    inspectionRequests: true,
    transportJobs: true,
    stateHistory: { orderBy: { createdAt: 'asc' } },
  }
})
```

### Paginated seller listings
```typescript
const [data, total] = await prisma.$transaction([
  prisma.saleListing.findMany({
    where: { sellerId },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { product: true, address: true },
  }),
  prisma.saleListing.count({ where: { sellerId } }),
])
```

### Inspector's active mission
```typescript
const mission = await prisma.inspectionRequest.findFirst({
  where: {
    inspectorId,
    status: { in: ['IN_PROGRESS', 'SCHEDULED'] }
  },
  include: {
    tradeOperation: { include: { buyListing: true } },
    saleListing: { include: { product: true } },
  },
  orderBy: { createdAt: 'desc' }
})
```

---

## Migrations

```bash
# Create a new migration after schema changes
cd backend
npx prisma migrate dev --name "add_escrow_fields"

# Apply migrations in production (Railway runs this on start)
npx prisma migrate deploy

# Reset DB (dev only — destroys all data)
npx prisma migrate reset

# View current migration status
npx prisma migrate status
```

---

## Seeding

```bash
cd backend
npx prisma db seed    # runs prisma/seed.ts
```

The seed creates: sample products (wheat, corn, barley, soybean), regions (Balkans, ME, Asia), and test users for each role.
