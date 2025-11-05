# Automatic Offer System Architecture

## 📍 Current System Overview

### **Key Components You Need to Know**

#### 1. **Main Components (Frontend)**
- **`MatchingDashboard.tsx`** (`/admin-dashboard/src/features/matching/components/MatchingDashboard/`)
  - Main orchestrator component
  - Manages selected buyer order and selected sellers
  - Currently has "Create Offers" button (line 89-90)

- **`BuyerOrdersPanel.tsx`**
  - Lists all buyer orders grouped by corporation
  - Handles buyer order selection
  - **NEEDS**: Visual state indicator (offers sent, awaiting responses)

- **`SellerCardsPanel.tsx`**
  - Lists all available sellers
  - Filters by selected product
  - **NEEDS**: Transport cost badge, asking price display, offer status indicators

- **Trade Preview Component** (next to map)
  - Shows selected buyer and sellers summary
  - **NEEDS**: Transport cost breakdown

#### 2. **Data Models (Backend - Prisma)**

**SaleListing** (lines 238-298 in schema.prisma)
```prisma
model SaleListing {
  id            String
  sellerId      String
  productId     String
  quantity      Decimal
  unit          ProductUnit
  askingPrice   Decimal?     // ✅ Already exists!
  qualityScore  Int?
  qualityGrade  String?
  status        ListingStatus
  address       Address?     // Has lat/lng
  offers        Offer[]      // Offers made to this seller
}
```

**BuyListing** (lines 300-345)
```prisma
model BuyListing {
  id                String
  buyerId           String
  productId         String
  quantity          Decimal
  unit              ProductUnit
  maxPricePerUnit   Decimal?
  neededBy          DateTime?
  deliveryAddress   Address?   // Has lat/lng
  status            RequestStatus
  offers            Offer[]    // Offers for this buyer
}
```

**Offer** (lines 393-438) - CRITICAL MODEL
```prisma
model Offer {
  id                String
  saleListingId     String?        // Which seller
  buyListingId      String?        // Which buyer
  offeredPrice      Decimal
  quantity          Decimal
  matchScore        Int            // 0-100 quality match
  transportCost     Decimal?       // ✅ Transport cost field exists!
  validUntil        DateTime       // Expiry (48 hours)
  status            OfferStatus    // PENDING, ACCEPTED, REJECTED, COUNTERED
  createdBy         OfferCreator   // PLATFORM, SELLER, BUYER
  createdAt         DateTime
}

enum OfferStatus {
  PENDING
  ACCEPTED
  REJECTED
  COUNTERED
  EXPIRED
}
```

#### 3. **Existing APIs**

**Transport Cost Calculation** ✅
- **Endpoint**: `POST /api/trade-operations/calculate-transport`
- **Request**:
  ```typescript
  {
    sellerIds: string[];        // Array of seller IDs
    buyerAddressId: string;     // Buyer delivery address ID
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    results: [
      {
        sellerId: string;
        distance: number;        // km
        transportCost: number;   // EUR
      }
    ];
    totalCost: number;
    currency: string;
  }
  ```

**Negotiation/Offer APIs** (Need to verify/create)
- `POST /api/negotiations/trade-operations/:tradeOperationId/offers` - Create offer
- `POST /api/negotiations/trade-operations/:tradeOperationId/offers/batch` - Batch create
- `GET /api/negotiations/trade-operations/:tradeOperationId/negotiations` - Get all negotiations

---

## 🎯 What You Want to Build

### **Feature 1: Transport Cost Badges**

**Goal**: Show transport cost estimate on seller cards and trade preview

**Implementation**:
1. When buyer is selected → Call `calculate-transport` API with all matching seller IDs
2. Store transport costs in component state
3. Display transport cost badge on each seller card:
   - `🚚 €21.80 transport` (green badge)
   - Include in sorting logic (closer = cheaper = higher priority)

**Components to Modify**:
- `SellerCardsPanel.tsx` - Add transport badge to card
- `MatchingDashboard.tsx` - Fetch and pass transport costs
- Trade Preview component - Show transport breakdown

---

### **Feature 2: Asking Price Display**

**Goal**: Show seller's asking price instead of "undefined / ton"

**Current Issue**:
- In `SaleListing` type (lines 35-51 in `listings.ts`):
  ```typescript
  pricePerUnit: number;    // This is undefined
  askingPrice?: number;    // This is the actual field in DB!
  ```

**Fix**:
- Update seller card to display `seller.askingPrice` instead of `seller.pricePerUnit`
- Format as: `€250 / ton`

**Components to Modify**:
- `SellerCardsPanel.tsx` - Change display logic

---

### **Feature 3: Automatic Offer System** 🚀

#### **3A. Smart Seller Ranking Algorithm**

**Ranking Factors**:
1. **Transport Cost** (40% weight) - Closer = better
2. **Price Competitiveness** (40% weight) - Closer to buyer's max price but with $10 margin
3. **Quality Match** (20% weight) - Spec compatibility

**Formula**:
```typescript
score = (
  (1 - transportCost / maxTransportCost) * 0.4 +
  priceScore * 0.4 +
  qualityScore * 0.2
) * 100

priceScore = calculateMarginScore(
  sellerAskingPrice,
  buyerMaxPrice,
  targetMargin: 10 // $10 admin profit
)
```

**Seller Prioritization**:
- Rank sellers by score
- Send offers in batches (e.g., top 5 first)
- Wait for responses before sending next batch

#### **3B. Offer Calculation Logic**

**For Each Seller**:
```typescript
// Calculate offer price ensuring $10 margin
const offerPrice = Math.min(
  sellerAskingPrice + 10,  // Seller's price + $10 profit
  buyerMaxPrice - 5        // Leave room for negotiation
);

// Calculate quantity needed
const remainingQuantity = buyerQuantity - acceptedQuantity;
const offerQuantity = Math.min(sellerQuantity, remainingQuantity);

// Create offer
{
  saleListingId: seller.id,
  buyListingId: buyer.id,
  offeredPrice: offerPrice,
  quantity: offerQuantity,
  transportCost: transportCosts[seller.id],
  validUntil: Date.now() + 48 hours,
  status: 'PENDING',
  createdBy: 'PLATFORM'
}
```

#### **3C. Visual State Management**

**Buyer Order States**:
- `ACTIVE` (default) - No offers sent
- `OFFERS_SENT` - Offers sent, awaiting responses
- `PARTIALLY_FILLED` - Some offers accepted, need more
- `FULFILLED` - All quantity secured

**Visual Indicators on Buyer Card**:
```typescript
<Badge className="bg-yellow-100 text-yellow-800">
  {offersSent} offers sent • Awaiting {pendingCount} responses
</Badge>
```

**Seller Card States (Color-Coded)**:
- **No Offer** - Default gray card
- **Offer Pending** 🟡 - Yellow badge: "Offer sent €250/ton"
- **Offer Accepted** 🟢 - Green badge with checkmark: "✅ Accepted"
- **Offer Declined** 🔴 - Red badge: "❌ Declined"
- **Counter Offer** 🟠 - Orange badge: "🔄 Counter €265/ton"

**Component Updates**:
```typescript
// SellerCardsPanel.tsx
interface SellerCardProps {
  seller: SaleListing;
  offerStatus?: {
    status: 'pending' | 'accepted' | 'rejected' | 'countered';
    offeredPrice: number;
    counterPrice?: number;
  };
}

// Conditional card styling
className={cn(
  "border-2 transition-all",
  offerStatus?.status === 'pending' && "border-yellow-400 bg-yellow-50",
  offerStatus?.status === 'accepted' && "border-green-500 bg-green-50",
  offerStatus?.status === 'rejected' && "border-red-400 bg-red-50 opacity-50",
  offerStatus?.status === 'countered' && "border-orange-400 bg-orange-50"
)}
```

#### **3D. Batch Offer Workflow**

**Step 1**: User selects buyer order
```typescript
handleOrderSelect(buyerOrder) {
  // 1. Fetch matching sellers (already done)
  // 2. Calculate transport costs for all sellers
  const transportCosts = await calculateTransport(sellerIds, buyerAddressId);

  // 3. Rank sellers by score
  const rankedSellers = rankSellers(sellers, transportCosts, buyerOrder);

  // 4. Update UI with ranked list
  setSellers(rankedSellers);
}
```

**Step 2**: User clicks "Send Automatic Offers" button
```typescript
handleSendAutomaticOffers() {
  // 1. Select top N sellers (e.g., top 5)
  const topSellers = rankedSellers.slice(0, 5);

  // 2. Create batch offer request
  const offers = topSellers.map(seller => ({
    saleListingId: seller.id,
    buyListingId: selectedOrder.id,
    offeredPrice: calculateOfferPrice(seller, selectedOrder),
    quantity: Math.min(seller.quantity, remainingQuantity),
    transportCost: transportCosts[seller.id],
  }));

  // 3. Send batch offers API call
  await api.post(`/api/negotiations/trade-operations/${tradeOpId}/offers/batch`, {
    offers
  });

  // 4. Update buyer order state to "OFFERS_SENT"
  setBuyerOrderState('OFFERS_SENT');

  // 5. Poll for responses every 30 seconds
  startPollingOfferResponses();
}
```

**Step 3**: Handle offer responses
```typescript
async pollOfferResponses() {
  const negotiations = await api.get(
    `/api/negotiations/trade-operations/${tradeOpId}/negotiations`
  );

  // Update seller card states
  negotiations.forEach(negotiation => {
    updateSellerOfferStatus(negotiation.saleListingId, {
      status: negotiation.status,
      offeredPrice: negotiation.offeredPrice,
      counterPrice: negotiation.counterPrice
    });
  });

  // Check if need to send next batch
  const acceptedQuantity = calculateAcceptedQuantity(negotiations);
  if (acceptedQuantity < buyerOrder.quantity) {
    // Show "Send Next Batch" button
    setShowNextBatchButton(true);
  }
}
```

#### **3E. Counter-Offer Handling**

**When Seller Counters**:
```typescript
<SellerCard seller={seller} offerStatus={{
  status: 'countered',
  offeredPrice: 250,
  counterPrice: 260
}}>
  <div className="flex gap-2">
    <Button onClick={() => acceptCounter(seller.id)}>
      Accept €260
    </Button>
    <Button variant="outline" onClick={() => rejectCounter(seller.id)}>
      Decline
    </Button>
    <Button variant="secondary" onClick={() => openNegotiationModal(seller.id)}>
      Send New Offer
    </Button>
  </div>
</SellerCard>
```

---

## 📦 Components You Need to Create/Modify

### **New Components**:
1. **`TransportCostBadge.tsx`** - Reusable transport cost display
2. **`OfferStatusBadge.tsx`** - Reusable offer status indicator
3. **`AutoOfferButton.tsx`** - Smart offer sending button
4. **`NegotiationModal.tsx`** - Handle counter-offers

### **Components to Modify**:
1. **`MatchingDashboard.tsx`**
   - Add transport cost fetching
   - Add seller ranking logic
   - Add batch offer sending
   - Add polling for responses

2. **`BuyerOrdersPanel.tsx`**
   - Add offer state badges
   - Add "offers sent" indicator

3. **`SellerCardsPanel.tsx`**
   - Add transport cost badge
   - Fix asking price display
   - Add offer status indicator
   - Add conditional styling based on offer status
   - Add counter-offer actions

4. **Trade Preview Component**
   - Add transport cost breakdown

---

## 🔌 Backend APIs You Need

### **Existing (Verify)**:
- ✅ `POST /api/trade-operations/calculate-transport` (EXISTS)
- ✅ `POST /api/negotiations/trade-operations/:id/offers/batch` (VERIFY)
- ✅ `GET /api/negotiations/trade-operations/:id/negotiations` (VERIFY)

### **May Need to Create**:
- `POST /api/negotiations/negotiations/:id/accept` - Accept counter-offer
- `POST /api/negotiations/negotiations/:id/reject` - Reject counter-offer
- `PATCH /api/buyer/listings/:id/status` - Update buyer listing state

---

## 🎨 Visual States Summary

| State | Buyer Card | Seller Card | Color |
|-------|-----------|-------------|-------|
| **Initial** | "Select Product" | Default | Gray |
| **Product Selected** | "Send Offers" button | Ranked list | Blue |
| **Offers Sent** | "🟡 5 offers sent" | "🟡 Pending" badge | Yellow |
| **Offer Accepted** | "🟢 2 accepted" | "✅ Accepted €250" | Green |
| **Offer Declined** | "🔴 1 declined" | "❌ Declined" | Red (faded) |
| **Counter Offer** | "🟠 1 counter" | "🔄 Counter €265" + Actions | Orange |
| **Fulfilled** | "✅ Completed" | Final state | Green |

---

## 💾 State Management Structure

```typescript
// MatchingDashboard state
const [selectedOrder, setSelectedOrder] = useState<BuyListing | null>(null);
const [sellers, setSellers] = useState<SaleListing[]>([]);
const [transportCosts, setTransportCosts] = useState<Record<string, number>>({});
const [offerStates, setOfferStates] = useState<Record<string, OfferStatus>>({});
const [buyerOrderState, setBuyerOrderState] = useState<'ACTIVE' | 'OFFERS_SENT' | 'PARTIALLY_FILLED' | 'FULFILLED'>('ACTIVE');

interface OfferStatus {
  status: 'pending' | 'accepted' | 'rejected' | 'countered';
  offeredPrice: number;
  counterPrice?: number;
  negotiationId: string;
}
```

---

## 🚀 Implementation Order

1. **Phase 1: Display Improvements** (Easiest)
   - Fix asking price display
   - Add transport cost badges
   - Update seller card styling

2. **Phase 2: Transport Integration** (Medium)
   - Integrate calculate-transport API
   - Add transport costs to seller ranking
   - Display in trade preview

3. **Phase 3: Offer System** (Complex)
   - Implement seller ranking algorithm
   - Create batch offer API integration
   - Add offer status tracking
   - Implement polling mechanism

4. **Phase 4: Negotiation Flow** (Advanced)
   - Add counter-offer UI
   - Implement accept/reject actions
   - Add next batch logic
   - Complete workflow validation

---

## 🔍 Key Questions Before Starting

1. **Profit Margin**: Confirmed $10 per trade?
2. **Batch Size**: How many sellers in first batch? (Suggest 5)
3. **Polling Interval**: How often check for responses? (Suggest 30s)
4. **Auto Next Batch**: Automatically send or require admin approval?
5. **Counter Offer Limit**: Max number of counter-offers allowed?

---

## 📊 Example Flow

```
1. Admin selects "Buyer A needs 100 tons Wheat at €260/ton"
   → System filters sellers with Wheat

2. System calculates transport for 15 matching sellers
   → Ranks by score (distance + price + quality)

3. Top 5 sellers:
   - Seller 1: €245/ton, €15 transport, 50km → Score 95
   - Seller 2: €248/ton, €18 transport, 65km → Score 92
   - Seller 3: €250/ton, €12 transport, 45km → Score 93
   - Seller 4: €252/ton, €20 transport, 75km → Score 88
   - Seller 5: €255/ton, €10 transport, 40km → Score 90

4. Admin clicks "Send Automatic Offers"
   → Offers sent:
   - Seller 1: €255/ton (€245 + €10 profit)
   - Seller 2: €258/ton (€248 + €10 profit)
   - Seller 3: €260/ton (€250 + €10 profit)
   - Seller 4: €262/ton (€252 + €10 profit) ❌ Exceeds buyer max!
   - Seller 5: €265/ton (€255 + €10 profit) ❌ Exceeds buyer max!

   → Only sends to Sellers 1, 2, 3

5. After 2 hours:
   - Seller 1: ✅ Accepted €255/ton (50 tons)
   - Seller 2: 🔄 Counter €260/ton (30 tons)
   - Seller 3: 🟡 Pending

6. Admin accepts Seller 2 counter
   → 80 tons secured, need 20 more

7. Admin clicks "Send Next Batch"
   → Sends to Sellers 4, 5, 6...
```

---

This is your complete architecture guide. Ready to start implementation?
