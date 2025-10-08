# Test Credentials for Agro-Trade Platform

## Complete Flow Testing Guide

### 1. Admin Dashboard
**URL**: http://localhost:5173
**Login**: 
- Email: admin@agrotrade.com
- Password: test123

### 2. React Native App (All Roles)
**URL**: Expo Go app
**Users**:

#### Buyers:
- buyer@test.com / test123
- sofia.foods@example.com / test123
- varna.wholesale@example.com / test123

#### Sellers (Farmers):
- farmer@test.com / test123
- farmer2@test.com / test123
- farmer3@test.com / test123

#### Transporters:
- transporter@test.com / test123
- transporter2@test.com / test123

#### Inspector:
- inspector@test.com / test123

---

## Testing the Complete Trade Operation Flow

### Phase 1: Create Trade Operation (Admin)
1. Login to Admin Dashboard: http://localhost:5173
2. Go to "Trade Operations" tab
3. Click "Create Trade Operation"
4. Select a buy listing and set margin (e.g., 10%)
5. Trade operation is created in INITIATION phase

### Phase 2: Send Offers to Sellers (Admin)
1. Open the created trade operation
2. Click "Move to Next Phase" to go to SELLER_NEGOTIATION
3. Click "Send Bulk Offers" button
4. Enter prices for each seller (e.g., €270/ton)
5. Send offers to multiple sellers

### Phase 3: Sellers Respond (Mobile App - Seller)
1. Login to mobile app as farmer@test.com
2. Go to "Offers" tab
3. View incoming offers from admin
4. Accept, reject, or counter the offer
5. Once accepted, phase auto-updates to TRANSPORT_MATCHING

### Phase 4: Create Transport Request (Admin)
1. In admin dashboard, open the trade operation
2. Go to "Transport" tab
3. Click "Create Transport Request"
4. Set bidding deadline and max budget
5. Transport request is now open for bidding

### Phase 5: Transporters Bid (Mobile App - Transporter)
1. Login as transporter@test.com
2. Go to "Offers" tab
3. View available transport requests
4. Submit bid with amount and duration
5. Wait for admin to accept bid

### Phase 6: Accept Transport Bid (Admin)
1. In admin dashboard, view transport bids
2. Click "Accept" on preferred bid
3. Transport job is created
4. Phase updates to IN_TRANSIT

### Phase 7: Manage Delivery (Mobile App - Transporter)
1. In transporter app, go to "Jobs" tab
2. Click "Start Job" to begin transport
3. Complete pickups from each seller
4. Complete delivery to buyer
5. Phase updates to DELIVERY then COMPLETED

### Phase 8: Track Progress (Mobile App - Buyer)
1. Login as buyer@test.com
2. Go to "Orders" tab
3. View real-time progress of trade operation
4. See sellers, transport, and delivery status
5. Track secured quantity vs target

---

## Quick Test Scenarios

### Scenario 1: Simple Trade
1. Admin creates operation for 200 tons wheat
2. Send offer to 1 seller at €270/ton
3. Seller accepts immediately
4. Create transport request
5. Transporter bids €3000
6. Accept bid and complete delivery

### Scenario 2: Multi-Seller Negotiation
1. Admin creates operation for 500 tons
2. Send offers to 3 sellers (200, 200, 100 tons)
3. Seller 1 accepts, Seller 2 counters, Seller 3 rejects
4. Admin accepts counter from Seller 2
5. Find new seller for remaining quantity
6. Complete transport and delivery

### Scenario 3: Competitive Transport Bidding
1. Complete seller negotiations
2. Create transport request
3. Multiple transporters submit bids
4. Compare bids (price, duration, rating)
5. Accept best bid
6. Monitor real-time delivery

---

## Backend APIs

### Base URL: http://localhost:4000/api

### Key Endpoints:
- POST /auth/login - Login
- GET /trade-operations - List all operations
- POST /trade-operations - Create new operation
- PUT /trade-operations/:id/phase - Update phase
- POST /negotiations/bulk - Send bulk offers
- POST /seller/negotiations/:id/respond - Seller response
- POST /transport/requests - Create transport request
- POST /transport/bids - Submit transport bid
- POST /transport/bids/:id/accept - Accept bid
- GET /buyer/trade-operations - Buyer's operations

---

## Troubleshooting

### If login fails:
1. Check backend is running: `npm run start:dev`
2. Check database: `npx prisma studio`
3. Reset password to 'test123' if needed

### If no data appears:
1. Run seed script: `npx ts-node src/scripts/cleanup-and-seed.ts`
2. Add buyers: `npx ts-node src/scripts/add-buyers.ts`
3. Check admin exists: `npx ts-node src/scripts/add-admin.ts`

### If transport features don't work:
1. Check if migrations are applied: `npx prisma migrate dev`
2. Ensure transport tables exist in database
3. Check transporters are created in database

---

## Notes
- All test users have password: test123
- Admin dashboard is web-based (not React Native)
- Mobile app supports all roles except admin
- Trade operations require active buy listings
- Sellers must have active sale listings
- Transport requires accepted seller offers