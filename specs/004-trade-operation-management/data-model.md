# Data Model: Trade Operation Management

## Entity Relationship Diagram

```
TradeOperation (existing, extended)
├── id: string (CUID)
├── operationNumber: string
├── buyListingId: string
├── phase: enum (INITIATION, SELLER_NEGOTIATION, TRANSPORT_BIDDING, etc.)
├── status: enum (ACTIVE, COMPLETED, CANCELLED)
├── profitMargin: decimal
├── totalQuantityNeeded: decimal
├── totalQuantitySecured: decimal (computed)
├── negotiationProgress: decimal (computed: secured/needed)
├── createdAt: datetime
├── updatedAt: datetime
└── Relations:
    ├── negotiations: Negotiation[]
    ├── buyListing: BuyListing
    └── admin: User

Negotiation (enhanced)
├── id: string (CUID)
├── tradeOperationId: string
├── tradeSellerId: string
├── status: enum (PENDING, ACCEPTED, REJECTED, COUNTERED, EXPIRED)
├── currentOffer: JSON
│   ├── price: decimal
│   ├── quantity: decimal
│   └── terms: string
├── counterOffer: JSON (nullable)
│   ├── price: decimal
│   ├── quantity: decimal
│   ├── terms: string
│   └── receivedAt: datetime
├── offerHistory: JSON[]
├── expiresAt: datetime
├── respondedAt: datetime (nullable)
├── createdAt: datetime
├── updatedAt: datetime
└── Relations:
    ├── tradeOperation: TradeOperation
    └── tradeSeller: TradeSeller

TradeSeller (existing, used for negotiation)
├── id: string (CUID)
├── tradeOperationId: string
├── sellerId: string
├── saleListingId: string
├── requestedQuantity: decimal
├── agreedQuantity: decimal (nullable)
├── agreedPrice: decimal (nullable)
├── status: enum (INVITED, NEGOTIATING, AGREED, DECLINED)
└── Relations:
    ├── negotiations: Negotiation[]
    ├── seller: User
    └── saleListing: SaleListing

SellerCandidate (view/computed)
├── sellerId: string
├── sellerName: string
├── saleListingId: string
├── availableQuantity: decimal
├── askingPrice: decimal
├── location: JSON
├── distance: decimal
├── matchScore: decimal
└── Note: Computed from SaleListing where not in current trade's TradeSeller
```

## State Transitions

### TradeOperation Status
```
ACTIVE → COMPLETED (all sellers agreed, transport arranged)
ACTIVE → CANCELLED (admin cancellation)
```

### TradeOperation Phase
```
INITIATION → SELLER_NEGOTIATION → TRANSPORT_BIDDING → 
INSPECTION → IN_TRANSIT → DELIVERED → COMPLETED
```

### Negotiation Status
```
PENDING → ACCEPTED (seller accepts offer)
PENDING → REJECTED (seller rejects)
PENDING → COUNTERED (seller counters)
PENDING → EXPIRED (48 hours passed)
COUNTERED → ACCEPTED (admin accepts counter)
COUNTERED → REJECTED (admin rejects counter)
COUNTERED → COUNTERED (admin re-counters)
```

## Validation Rules

### TradeOperation
- Cannot transition phase unless negotiationProgress >= 100%
- profitMargin must be between 5% and 15%
- totalQuantityNeeded must match buyListing.quantity

### Negotiation
- expiresAt = createdAt + 48 hours
- Cannot create duplicate negotiation for same tradeSeller
- counterOffer.price must differ from currentOffer.price
- Status transitions must follow state machine

### Business Rules
1. **Quantity Validation**: Sum of all agreed quantities cannot exceed totalQuantityNeeded
2. **Expiration Handling**: Expired negotiations automatically marked by cron job
3. **Progress Calculation**: negotiationProgress = (sum of agreed quantities / totalQuantityNeeded) * 100
4. **Seller Addition**: Can only add sellers if negotiationProgress < 100%
5. **Counter-Offer**: Only one active counter-offer per negotiation

## Computed Fields

### TradeOperation
```typescript
totalQuantitySecured = negotiations
  .filter(n => n.status === 'ACCEPTED')
  .sum(n => n.currentOffer.quantity)

negotiationProgress = (totalQuantitySecured / totalQuantityNeeded) * 100

canProceed = negotiationProgress >= 100

activeNegotiations = negotiations
  .filter(n => ['PENDING', 'COUNTERED'].includes(n.status))
  .count()
```

### Negotiation
```typescript
timeRemaining = expiresAt - now()
isExpiring = timeRemaining < 6 hours
hasCounterOffer = counterOffer !== null
isActionable = status in ['COUNTERED', 'PENDING']
```

## Indexes

### Performance Optimization
```sql
CREATE INDEX idx_trade_operation_status ON trade_operation(status);
CREATE INDEX idx_trade_operation_phase ON trade_operation(phase);
CREATE INDEX idx_negotiation_trade_operation ON negotiation(trade_operation_id);
CREATE INDEX idx_negotiation_status ON negotiation(status);
CREATE INDEX idx_negotiation_expires ON negotiation(expires_at);
CREATE UNIQUE INDEX idx_negotiation_trade_seller ON negotiation(trade_seller_id);
```

## Migration Requirements

### Schema Changes
```prisma
model TradeOperation {
  // Existing fields...
  
  negotiations Negotiation[]
  
  @@map("trade_operation")
}

model Negotiation {
  id                String      @id @default(cuid())
  tradeOperationId  String      @map("trade_operation_id")
  tradeSellerId     String      @unique @map("trade_seller_id")
  status            NegotiationStatus
  currentOffer      Json        @map("current_offer")
  counterOffer      Json?       @map("counter_offer")
  offerHistory      Json[]      @map("offer_history")
  expiresAt         DateTime    @map("expires_at")
  respondedAt       DateTime?   @map("responded_at")
  createdAt         DateTime    @default(now()) @map("created_at")
  updatedAt         DateTime    @updatedAt @map("updated_at")
  
  tradeOperation    TradeOperation @relation(fields: [tradeOperationId], references: [id])
  tradeSeller       TradeSeller    @relation(fields: [tradeSellerId], references: [id])
  
  @@index([tradeOperationId])
  @@index([status])
  @@index([expiresAt])
  @@map("negotiation")
}

enum NegotiationStatus {
  PENDING
  ACCEPTED
  REJECTED
  COUNTERED
  EXPIRED
}
```

### Data Migration
- Create Negotiation records for existing TradeSeller records
- Set initial status based on TradeSeller.status
- Calculate expiresAt from createdAt + 48h
- Populate currentOffer from TradeSeller agreed values