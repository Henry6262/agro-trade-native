# End-to-End Trade Operation Demo Guide

## System Status ✅

- **Backend**: http://localhost:4001 (Running)
- **Frontend**: http://localhost:4173 (Running)
- **Database**: PostgreSQL at localhost:5432/agro_trade_dev (Populated)

## Database Contents

### Regions & Cities
- 6 Bulgarian NUTS-2 Regions (North-Western, North-Central, North-Eastern, South-Eastern, South-Central, South-Western)
- 12 Cities across Bulgaria (Sofia, Vidin, Pleven, Ruse, Varna, Dobrich, Burgas, Sliven, Plovdiv, Stara Zagora, Blagoevgrad, Pernik)

### Products
1. **Soft Wheat** (SOFT_WHEAT) - For pastry and cake flour
2. **Corn** (CORN_MAIZE) - For feed and consumption
3. **Sunflower Seeds** (SUNFLOWER) - For oil production
4. **Barley** (BARLEY) - For brewing and feed
5. **Rapeseed** (RAPESEED) - For oil production

### Test Users
| Role | Email | Password | Name |
|------|-------|----------|------|
| Buyer | buyer@test.com | test123 | Test Buyer |
| Seller 1 | seller1@test.com | test123 | Sofia Farms Co. |
| Seller 2 | seller2@test.com | test123 | Varna Agricultural Ltd. |
| Seller 3 | seller3@test.com | test123 | Plovdiv Harvest Group |

### Buy Listings (Buyer Demand)
1. **Soft Wheat**: 100 TON @ €260/TON max (Sofia warehouse, needed in 30 days)
2. **Corn**: 50 TON @ €230/TON max (Sofia warehouse, needed in 45 days)
3. **Sunflower Seeds**: 30 TON @ €370/TON max (Sofia warehouse, needed in 20 days)

### Sale Listings (Seller Supply)
1. **Soft Wheat**: 50 TON @ €250/TON (Sofia Farms Co., Sofia)
2. **Soft Wheat**: 30 TON @ €245/TON (Varna Agricultural Ltd., Varna)
3. **Corn**: 40 TON @ €220/TON (Plovdiv Harvest Group, Plovdiv)
4. **Sunflower Seeds**: 25 TON @ €350/TON (Sofia Farms Co., Sofia)

## End-to-End Workflow Demo

### Step 1: Access the Admin Dashboard

1. Open your browser to http://localhost:4173
2. You should see the Admin Dashboard interface

### Step 2: View Buyer Orders (Matching Dashboard)

**Navigate to:** Matching Dashboard → Buyer Orders Panel

**What you'll see:**
- 3 buy listings displayed
- Buyer: Test Buyer
- Products: Soft Wheat (100 TON), Corn (50 TON), Sunflower Seeds (30 TON)
- All with ACTIVE status
- Delivery location: Sofia, Bulgaria

**Example API Response:**
```json
{
  "id": "...",
  "buyerId": "...",
  "productId": "...",
  "quantity": 100,
  "unit": "TON",
  "maxPricePerUnit": 260,
  "neededBy": "2025-11-11T...",
  "status": "ACTIVE",
  "product": {
    "name": "Soft Wheat",
    "category": "SOFT_WHEAT"
  },
  "deliveryAddress": {
    "street": "Industrial Zone 89",
    "city": "Sofia",
    "latitude": 42.6977,
    "longitude": 23.3219
  }
}
```

### Step 3: View Seller Listings (Matching Dashboard)

**Navigate to:** Matching Dashboard → Seller Cards Panel

**What you'll see:**
- 4 sale listings displayed
- Sellers from Sofia, Varna, and Plovdiv
- Products available with quantities and prices
- Geographic distribution across Bulgaria

**Example API Response:**
```json
{
  "id": "...",
  "sellerId": "...",
  "productId": "...",
  "quantity": 50,
  "unit": "TON",
  "askingPrice": 250,
  "status": "active",
  "product": {
    "name": "Soft Wheat",
    "category": "SOFT_WHEAT"
  },
  "address": {
    "street": "Farm Road 123",
    "city": "Sofia",
    "latitude": 42.6977,
    "longitude": 23.3219
  }
}
```

### Step 4: Identify Matching Opportunities

**Matching Analysis:**

#### Match 1: Soft Wheat Purchase
- **Buyer Needs**: 100 TON @ €260/TON max
- **Available Sellers**:
  - Seller 1 (Sofia): 50 TON @ €250/TON ✅ (Price good, quantity partial)
  - Seller 2 (Varna): 30 TON @ €245/TON ✅ (Price good, quantity partial)
- **Strategy**: Aggregate both sellers to fulfill 80 TON (80% of demand)

#### Match 2: Corn Purchase
- **Buyer Needs**: 50 TON @ €230/TON max
- **Available Seller**:
  - Seller 3 (Plovdiv): 40 TON @ €220/TON ✅ (Price good, quantity 80%)
- **Strategy**: Single seller fulfills most of demand

#### Match 3: Sunflower Seeds Purchase
- **Buyer Needs**: 30 TON @ €370/TON max
- **Available Seller**:
  - Seller 1 (Sofia): 25 TON @ €350/TON ✅ (Price good, quantity 83%)
- **Strategy**: Single seller fulfills most of demand

### Step 5: Create a Trade Operation

**Using the Admin Dashboard:**

1. Navigate to **Scenario Orchestrator** or **Trade Operations** section
2. Select a buy listing (e.g., "Soft Wheat - 100 TON")
3. Select matching seller listings
4. Click "Create Trade Operation"

**Expected Outcome:**
- New trade operation created with status `NEGOTIATING`
- Offers generated for selected sellers
- Operation visible in Active Operations tab

**API Endpoint:**
```
POST /api/trade-operations
{
  "buyListingId": "<buy_listing_id>",
  "tradeAdminId": "<admin_user_id>",
  "targetQuantity": 100,
  "targetPrice": 260
}
```

### Step 6: Send Offers to Sellers

**For each matched seller:**

1. Create offer with quantity and price
2. Set offer status to `PENDING`
3. Link offer to trade operation

**API Endpoint:**
```
POST /api/offers
{
  "tradeOperationId": "<operation_id>",
  "saleListingId": "<sale_listing_id>",
  "quantity": 50,
  "price": 250,
  "offerCreator": "PLATFORM"
}
```

### Step 7: Track Operation Progress

**Navigate to:** Active Operations Tab

**Monitor:**
- Offer statuses (PENDING → ACCEPTED/REJECTED)
- Quantity fulfilled vs. target
- Total cost vs. budget
- Timeline progress

**Dashboard Features:**
- Real-time status updates
- Progress bars for quantity fulfillment
- Seller acceptance/rejection tracking
- Transport coordination status

### Step 8: Calculate Transport Costs

**For accepted offers:**

1. Calculate distance between seller and buyer locations
2. Estimate transport cost based on distance and quantity
3. Add transport provider bids

**API Endpoint:**
```
POST /api/transport/calculate
{
  "originLatitude": 42.6977,
  "originLongitude": 23.3219,
  "destinationLatitude": 43.2141,
  "destinationLongitude": 27.9147,
  "quantity": 50,
  "unit": "TON"
}
```

### Step 9: Schedule Inspections

**Quality Assurance:**

1. Create inspection requests for accepted shipments
2. Assign inspector to each shipment
3. Set inspection standards and criteria

**API Endpoint:**
```
POST /api/inspections
{
  "tradeOperationId": "<operation_id>",
  "inspectionType": "PRE_SHIPMENT",
  "standardsRequired": ["MOISTURE_CONTENT", "QUALITY_GRADE"]
}
```

### Step 10: Complete the Trade

**Final Steps:**

1. Inspector approves quality ✅
2. Transport confirmed ✅
3. Payment processed ✅
4. Trade operation status → `COMPLETED`

**Database State Change:**
```sql
-- Update trade operation
UPDATE trade_operations
SET status = 'COMPLETED',
    completed_at = NOW()
WHERE id = '<operation_id>';

-- Update sale listings
UPDATE sale_listings
SET status = 'SOLD',
    quantity = quantity - <sold_quantity>
WHERE id IN (<selected_listing_ids>);

-- Update buy listing
UPDATE buy_listings
SET status = 'FULFILLED'
WHERE id = '<buy_listing_id>';
```

## Current System State

### Authentication Status
- ✅ **Authentication removed** from buyer/seller endpoints for testing
- No JWT token required for GET requests
- Direct API access available

### API Endpoints Available

#### Buyer Endpoints
- `GET /api/buyer/listings` - All buy listings
- `GET /api/buyer/listings/:id` - Specific buy listing
- `POST /api/buyer/listings` - Create buy listing

#### Seller Endpoints
- `GET /api/seller/listings` - All sale listings
- `GET /api/seller/listings/:id` - Specific sale listing
- `POST /api/seller/listings` - Create sale listing

#### Trade Operations
- `GET /api/trade-operations` - All operations
- `GET /api/trade-operations/active` - Active operations
- `POST /api/trade-operations` - Create operation

#### Simulation & Testing
- `POST /api/simulation/scenario` - Run test scenarios
- `GET /api/simulation/database-state` - View current state

## Testing Commands

### Check Database State
```bash
# Count all entities
psql -U henry -d agro_trade_dev -c "
SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM regions) as regions,
  (SELECT COUNT(*) FROM cities) as cities,
  (SELECT COUNT(*) FROM products) as products,
  (SELECT COUNT(*) FROM buy_listings) as buy_listings,
  (SELECT COUNT(*) FROM sale_listings) as sale_listings,
  (SELECT COUNT(*) FROM trade_operations) as trade_operations;
"
```

### Test API Endpoints
```bash
# Get buyer listings
curl http://localhost:4001/api/buyer/listings | jq

# Get seller listings
curl http://localhost:4001/api/seller/listings | jq

# Get specific listing
curl http://localhost:4001/api/buyer/listings/<listing_id> | jq
```

### Re-seed Database
```bash
# If you need fresh data
cd /Users/henry/agro-trade/backend
npx ts-node src/scripts/seed-demo-data.ts
```

## Success Criteria

### ✅ Phase 1: Data Setup (Complete)
- [x] Database populated with regions, cities, products
- [x] Test users created (1 buyer, 3 sellers)
- [x] Buy listings created (3 listings)
- [x] Sale listings created (4 listings)
- [x] API endpoints returning data correctly

### 🔄 Phase 2: Workflow Demo (Ready to Test)
- [ ] View buyer demand in dashboard
- [ ] View seller supply in dashboard
- [ ] Identify matching opportunities
- [ ] Create trade operation
- [ ] Send offers to sellers
- [ ] Track operation progress
- [ ] Complete trade flow

### 🎯 Phase 3: Advanced Features (Future)
- [ ] Real-time WebSocket updates
- [ ] Transport bidding workflow
- [ ] Inspector assignment and tracking
- [ ] Multi-seller aggregation
- [ ] Profit calculation and reporting

## Next Steps

1. **Open the dashboard**: http://localhost:4173
2. **Navigate to Matching Dashboard** to see buyer and seller listings
3. **Use Scenario Orchestrator** to create test scenarios
4. **Monitor Active Operations** for real-time tracking
5. **View Database State Panel** for system health

---

## Troubleshooting

### No Data in Dashboard
```bash
# Verify backend is running
curl http://localhost:4001/api/buyer/listings

# Re-seed database if needed
npx ts-node src/scripts/seed-demo-data.ts
```

### Authentication Errors
- JWT authentication has been removed for testing
- No token required for GET endpoints
- If issues persist, check seller/buyer controller files

### Frontend Not Loading
```bash
# Restart frontend
cd /Users/henry/agro-trade/admin-dashboard
npm run build
npm run preview
```

---

**Ready for End-to-End Testing! 🚀**

The system is now fully populated and ready to demonstrate complete trade operation workflows from buyer demand to seller fulfillment.
