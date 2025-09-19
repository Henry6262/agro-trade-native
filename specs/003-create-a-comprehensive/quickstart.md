# Quick Start: Trade Operation Management System

## Prerequisites

- Node.js 18+ and npm installed
- PostgreSQL 15+ with PostGIS extension
- React Native development environment set up
- Access to Google Maps API key

## Setup

### 1. Database Setup

```bash
# Create database with PostGIS
createdb agro_trade
psql -d agro_trade -c "CREATE EXTENSION postgis;"

# Run migrations
cd backend
npx prisma migrate dev --name add-trade-operations

# Seed sample data
npm run seed:trade-data
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Start development server
npm run start:dev

# Server runs on http://localhost:3000
```

### 3. Frontend Setup

```bash
cd front-end

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add GOOGLE_MAPS_API_KEY and BACKEND_URL

# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Quick Test Scenarios

### Scenario 1: Create Simple Trade Operation

```bash
# 1. Create a trade operation as admin
curl -X POST http://localhost:3000/api/trade-operations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerId": "buyer-uuid",
    "productId": "wheat-product-uuid",
    "quantity": 100,
    "unit": "TON",
    "targetDelivery": "2025-10-01T00:00:00Z"
  }'

# Response: Trade operation with ID and operation number
```

### Scenario 2: Complete Trade Flow (E2E)

#### Step 1: Initialize Trade
```javascript
// In admin dashboard
const trade = await createTradeOperation({
  buyerId: selectedBuyer.id,
  productId: 'wheat-001',
  quantity: 50,
  unit: 'TON'
});
console.log(`Created trade: ${trade.operationNumber}`);
```

#### Step 2: Find and Add Sellers
```javascript
// Open map drawer
const nearbySellers = await findNearbySellers({
  latitude: buyerLocation.lat,
  longitude: buyerLocation.lng,
  radius: 100,
  productId: 'wheat-001'
});

// Add selected sellers
await addSellersToTrade(trade.id, [
  { sellerId: 'seller-1', quantity: 30 },
  { sellerId: 'seller-2', quantity: 20 }
]);
```

#### Step 3: Negotiate Prices
```javascript
// Send initial offers
const negotiation1 = await sendOffer({
  negotiationId: 'neg-1',
  price: 280,
  quantity: 30
});

// Poll for responses
const pollInterval = setInterval(async () => {
  const updates = await getTradeUpdates(trade.id, lastChecked);
  updates.forEach(update => {
    if (update.type === 'offer_update') {
      if (update.data.response === 'COUNTERED') {
        // Handle counter-offer
      } else if (update.data.response === 'ACCEPTED') {
        // Move to next phase
        clearInterval(pollInterval);
      }
    }
  });
}, 5000); // Poll every 5 seconds
```

#### Step 4: Request Inspection (if needed)
```javascript
// For unverified seller
if (!seller.isVerified) {
  await requestInspection({
    saleListingId: seller.saleListingId,
    priority: 'HIGH',
    latitude: seller.location.lat,
    longitude: seller.location.lng
  });
}
```

#### Step 5: Transport Bidding
```javascript
// Transition to transport phase
await transitionPhase(trade.id, 'TRANSPORT_BIDDING');

// Poll for new bids
const bidPollInterval = setInterval(async () => {
  const updates = await getTradeUpdates(trade.id, lastChecked);
  updates.forEach(update => {
    if (update.type === 'bid_received') {
      console.log(`New bid: ${update.data.transporterName} - €${update.data.bidAmount}`);
    }
  });
}, 5000);

// Accept best bid
await acceptTransportBid(selectedBid.id);
clearInterval(bidPollInterval);
```

#### Step 6: Track Delivery
```javascript
// Poll for delivery updates
const deliveryPollInterval = setInterval(async () => {
  const trade = await getTradeOperation(trade.id);
  if (trade.transporters[0]?.status === 'IN_TRANSIT') {
    // Update map with latest position
    updateMapMarker(trade.transporters[0].currentLocation);
    updateETA(trade.transporters[0].estimatedArrival);
  } else if (trade.phase === 'DELIVERED') {
    console.log('Trade completed successfully!');
    clearInterval(deliveryPollInterval);
  }
}, 30000); // Poll every 30 seconds during delivery
```

## Testing Checklist

### Unit Tests
```bash
cd backend
npm test -- --testPathPattern=trade-operation.service.spec.ts
```

### Integration Tests
```bash
# Test complete trade flow
npm test -- --testPathPattern=trade-flow.integration.spec.ts

# Test polling mechanism
npm test -- --testPathPattern=polling.integration.spec.ts
```

### E2E Tests
```bash
cd front-end
npm run test:e2e -- --testNamePattern="Complete trade operation"
```

## Key Features to Verify

### 1. Map-Based Seller Selection
- [ ] Map loads with seller markers
- [ ] Markers colored by verification status (green/yellow/red)
- [ ] Click marker shows seller details
- [ ] Can select multiple sellers
- [ ] Distance calculation works

### 2. Multi-Party Negotiation
- [ ] Can send offers to multiple sellers
- [ ] Poll for counter-offers works
- [ ] Negotiation history tracked
- [ ] Offers expire after 48 hours
- [ ] Final prices saved correctly

### 3. Inspection Management
- [ ] Can request inspection for unverified sellers
- [ ] Priority levels work (Low/Medium/High/Urgent)
- [ ] Inspector receives notification
- [ ] Verification results update seller status
- [ ] Quality scores recorded

### 4. Transport Bidding
- [ ] Transporters see available jobs
- [ ] Can submit bids with details
- [ ] Admin sees all bids
- [ ] Bid acceptance works
- [ ] Selected transporter notified

### 5. Update Mechanism
- [ ] Polling for updates works correctly
- [ ] UI updates based on poll results
- [ ] Update frequency is appropriate
- [ ] Offline changes queue and sync
- [ ] Error handling for failed polls

## Performance Benchmarks

| Metric | Target | How to Test |
|--------|--------|-------------|
| Map load time | < 3s | Time from drawer open to markers visible |
| API response time | < 2s | Time for any API call to complete |
| Seller search | < 2s | Time for nearby sellers query |
| Phase transition | < 1s | Time to update trade phase |
| Update polling | < 1s | Time to fetch and process updates |

## Common Issues & Solutions

### Issue: Map not loading
**Solution**: Check Google Maps API key in .env file

### Issue: Updates not appearing
**Solution**: Check polling is enabled and API is returning updates correctly

### Issue: Sellers not appearing on map
**Solution**: Ensure PostGIS indexes are created:
```sql
CREATE INDEX idx_sale_listings_location 
ON sale_listings USING GIST(geography(location));
```

### Issue: Negotiations not updating
**Solution**: Verify polling interval and check API logs for errors

### Issue: Slow geospatial queries
**Solution**: Use ST_DWithin instead of ST_Distance:
```sql
-- Good
WHERE ST_DWithin(location, point, 50000)

-- Bad  
WHERE ST_Distance(location, point) < 50000
```

## Admin Operations

### Monitor Active Trades
```bash
# View all active trades
curl http://localhost:3000/api/trade-operations?status=ACTIVE \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Force Phase Transition
```bash
# Move trade to next phase
curl -X PATCH http://localhost:3000/api/trade-operations/$TRADE_ID/phase \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"toPhase": "TRANSPORT_MATCHING", "reason": "Sellers confirmed"}'
```

### View Audit Trail
```bash
# Get state history
curl http://localhost:3000/api/trade-operations/$TRADE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.stateHistory'
```

## Next Steps

1. **Customize commission rates**: Edit `backend/src/config/commission.ts`
2. **Add payment gateway**: Integrate Stripe in `backend/src/services/payment.service.ts`
3. **Enable push notifications**: Configure FCM in mobile app
4. **Set up monitoring**: Add Sentry for error tracking
5. **Configure CDN**: Use CloudFront for map tiles caching

## Support

- Documentation: `/docs/trade-operations`
- API Reference: `http://localhost:3000/api-docs`
- API Contract: See `contracts/trade-operations-api.yaml`
- Data Model: See `data-model.md`
- Prisma Schema: See `prisma-schema-additions.prisma`