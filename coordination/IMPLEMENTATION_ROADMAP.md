# Agro-Trade Implementation Roadmap
## v0.1 Production Admin Dashboard - Map-Based Matching

**Target**: Ship functional map-based matching system in 3 weeks
**Start Date**: October 11, 2025
**Target Date**: November 1, 2025

---

## 🎯 Mission

Transform admin dashboard from testing tool → **production map-based matching system** for real trade operations.

**Core Flow:**
1. Admin sees Bulgaria map with buyer/seller pins
2. Selects buyer order → sellers filter by product
3. Selects sellers → calculates transport cost
4. Sets prices → sends async offers
5. Sellers accept → creates inspection requests
6. Inspection complete → creates transport jobs
7. Transport companies bid → admin approves
8. Trucks assigned → operation executes

---

## 📅 3-Week Sprint Plan

### **Week 1: Map Foundation + Matching UI** (Oct 11-17)

**Goal**: Visual interface where admin can see buyers/sellers geographically and perform basic matching

#### Day 1-2: Map Implementation
- [ ] Install Leaflet dependencies (`npm install leaflet react-leaflet`)
- [ ] Create `BulgariaMap` component with OpenStreetMap base layer
- [ ] Fetch Eurostat NUTS-2 GeoJSON (6 Bulgaria regions)
- [ ] Display buyer pins (initial state)
- [ ] Display seller pins (on order selection)
- [ ] Region highlighting on hover

**Backend Support:**
- [ ] Create `/api/regions` endpoint (GET 6 Bulgaria regions)
- [ ] Create `/api/cities` endpoint (GET cities per region)
- [ ] Seed database with region/city data

**Deliverable**: Working map showing Bulgaria with buyer/seller markers

---

#### Day 3-4: Matching Dashboard Layout
- [ ] Create `MatchingDashboard` main component
- [ ] Layout: Map (top 50%), Split panels (bottom 50%)
- [ ] `OrderInfoBar` component (selected order details, quantity tracker)
- [ ] `BuyerOrdersPanel` component (left panel)
  - Group by corporation
  - Each order selectable
  - Product, quantity, delivery location displayed
- [ ] `SellerCardsPanel` component (right panel)
  - Card per seller
  - Product, quantity, location, verification badge
  - "View Details" button → modal

**Backend Support:**
- [ ] `GET /api/buy-listings` - Fetch all buyer orders with filters
- [ ] `GET /api/sale-listings` - Fetch all seller listings with filters
- [ ] Include address/location in responses

**Deliverable**: Complete layout with buyer/seller data displayed

---

#### Day 5-7: Interactive Matching
- [ ] Click buyer order → filter sellers by product
- [ ] Sellers sorted by: verified → closest region → available quantity
- [ ] Click seller card → highlight pin on map
- [ ] Multi-select sellers (checkboxes)
- [ ] Quantity tracking: `needed: 50t | selected: 50t (2 sellers)`
- [ ] "Create Offers" button (enabled when quantities match)

**Backend Support:**
- [ ] `GET /api/sale-listings/filter?product={}&region={}` - Smart filtering
- [ ] Add `matchScore` calculation logic

**Deliverable**: Functional matching interface with seller filtering and selection

---

### **Week 2: Pricing + Offers + Verification** (Oct 18-24)

**Goal**: Admin can create profitable offers and track seller responses + verification

#### Day 8-9: Distance & Pricing
- [ ] Distance calculation service (backend)
  - Region-to-region straight-line distance
  - Formula: `distance * 0.15€/km = transport_cost`
  - `POST /api/trade-operations/calculate-transport`
- [ ] `PricingModal` component (admin-dashboard)
  - Shows each selected seller
  - Displays distance and transport cost
  - Admin inputs offer price per seller
  - Real-time profit calculation: `Revenue - Purchase - Transport = Profit`
  - Warning if profit < €10
  - "Send Offers" button

**Backend Support:**
- [ ] `TransportCostCalculation` service
- [ ] Distance helper using lat/lng coordinates
- [ ] `POST /api/trade-operations/calculate-transport` endpoint

**Deliverable**: Pricing modal with profit calculator

---

#### Day 10-11: Offer Creation & Tracking
- [ ] Create `TradeOperation` on "Send Offers"
  - Links `BuyListing` + multiple `TradeSeller` records
  - Creates `OfferNegotiation` for each seller
  - Sets 48-hour expiry
- [ ] Offer status tracking in UI
  - Real-time updates (polling or WebSocket)
  - Status badges: Pending, Accepted, Rejected, Expired
- [ ] Async workflow: work with whoever accepts
- [ ] Partial fulfillment handling (if only 1 of 3 sellers accepts)

**Backend Support:**
- [ ] `POST /api/trade-operations` - Create trade operation
- [ ] `POST /api/offer-negotiations/bulk` - Create multiple offers
- [ ] `GET /api/offer-negotiations?tradeOperationId={}` - Track responses
- [ ] WebSocket events for real-time updates (optional for v0.1)

**Deliverable**: End-to-end offer creation and tracking

---

#### Day 12-14: Inspection Workflow
- [ ] When seller accepts → check verification status
- [ ] If unverified → create `InspectionRequest`
  - Auto-assign to available inspector
  - Priority: MEDIUM (or HIGH if urgent)
  - Location: Seller's address
- [ ] Inspector Portal view (simple)
  - List pending inspections
  - Complete inspection form
  - Upload photos, set quality score
  - Mark as COMPLETED
- [ ] Admin sees verification status update
  - Seller card shows "✅ Verified" badge
  - Ready for transport

**Backend Support:**
- [ ] `POST /api/inspection-requests` - Create inspection
- [ ] `GET /api/inspection-requests?inspectorId={}` - Inspector's queue
- [ ] `PATCH /api/inspection-requests/:id` - Update inspection results
- [ ] Update `SaleListing.qualityGrade` after inspection

**Deliverable**: Inspection workflow from request to completion

---

### **Week 3: Transport + Polish + Testing** (Oct 25-31)

**Goal**: Complete transport workflow and prepare for production deployment

#### Day 15-16: Transport Job Creation
- [ ] When seller verified → create `TransportRequest`
  - Pickup points: JSON array `[{lat, lng, sellerId, quantity, address}]`
  - Delivery point: JSON object `{lat, lng, addressId, address}`
  - Calculate total distance (sum of all seller→buyer distances)
  - Estimate cost: `totalDistance * 0.15€/km`
  - Set bidding deadline: 48 hours
- [ ] Send notification to ALL `TransportCompany` records
  - Email or in-app notification
  - Job details: weight, route, deadline, budget
- [ ] Transport Company Portal (basic view)
  - List available jobs
  - Job details page
  - "Submit Bid" button

**Backend Support:**
- [ ] `POST /api/transport-requests` - Create transport job
- [ ] `GET /api/transport-requests?status=OPEN` - List open jobs
- [ ] Notification service integration

**Deliverable**: Transport jobs created and visible to transport companies

---

#### Day 17-18: Transport Bidding
- [ ] Transport companies submit bids
  - Number of trucks available
  - Bid amount (total cost)
  - Estimated duration
  - Vehicle type
- [ ] Admin Bid Review UI
  - List all bids for a job
  - Show: company name, trucks offered, bid amount, rating
  - Track: `trucks_needed: 5 | trucks_reserved: 3 | remaining: 2`
  - Accept/Reject buttons per bid
- [ ] Bid acceptance logic
  - Reserve trucks when accepted
  - Update job status to ASSIGNED when fully staffed
  - Create `TransportJob` records

**Backend Support:**
- [ ] `POST /api/transport-bids` - Submit bid
- [ ] `GET /api/transport-bids?requestId={}` - List bids for job
- [ ] `PATCH /api/transport-bids/:id/accept` - Accept bid
- [ ] `PATCH /api/transport-bids/:id/reject` - Reject bid
- [ ] Create `TransportJob` on acceptance

**Deliverable**: Bidding system with admin approval workflow

---

#### Day 19-20: Testing & Bug Fixes
- [ ] Integration test suite
  - End-to-end: Create order → Match sellers → Send offers → Accept → Verify → Transport
  - API contract validation
  - Database integrity checks
- [ ] Manual testing
  - Test with real Bulgaria region data
  - Test with 30 buyer corporations
  - Test multi-seller scenarios
  - Test partial fulfillment
  - Test rejection/expiry flows
- [ ] Bug fixing sprint
  - Fix any issues found during testing
  - Performance optimization
  - Error handling improvements

**Backend Support:**
- [ ] Seed realistic test data (buyers, sellers, products)
- [ ] Integration test scripts

**Deliverable**: Stable, tested system ready for production

---

#### Day 21: Polish & Deployment Prep
- [ ] UI polish
  - Loading states for all async operations
  - Error messages user-friendly
  - Confirmation dialogs for destructive actions
  - Responsive layout adjustments
- [ ] Documentation
  - Admin user guide (how to use map-based matching)
  - API documentation update
  - Deployment instructions
- [ ] Performance audit
  - Optimize map rendering with many pins
  - Lazy load components
  - API response time check
- [ ] Production deployment checklist
  - Environment variables configured
  - Database migrations ready
  - Monitoring/logging in place

**Deliverable**: Production-ready v0.1

---

## 📊 Success Metrics

**Week 1 Complete:**
- ✅ Map displays Bulgaria with 6 regions
- ✅ Buyer and seller pins visible
- ✅ Can select buyer order and see filtered sellers
- ✅ Can multi-select sellers
- ✅ Admin dashboard at 87%

**Week 2 Complete:**
- ✅ Distance calculation working
- ✅ Pricing modal with profit calculator functional
- ✅ Offers created and tracked in database
- ✅ Inspection workflow operational
- ✅ Backend at 90%

**Week 3 Complete:**
- ✅ Transport jobs created and sent to companies
- ✅ Bidding system working
- ✅ Admin can approve/reject bids
- ✅ Integration tests passing (90%+)
- ✅ Production deployment successful

**Overall v0.1 Success:**
- ✅ Admin can perform map-based matching
- ✅ Offers sent and tracked asynchronously
- ✅ Verification workflow operational
- ✅ Transport bidding functional
- ✅ End-to-end flow from order → delivery assignment works

---

## 🔧 Technical Stack Confirmation

**Frontend (Admin Dashboard):**
- React 18 + TypeScript
- Vite for build
- Leaflet + react-leaflet (map)
- TailwindCSS (styling)
- Axios (API calls)
- React Query (data fetching)

**Backend (NestJS):**
- NestJS 10
- Prisma ORM
- PostgreSQL
- JWT authentication
- WebSocket (optional for v0.1)

**Database:**
- Existing schema (already production-ready)
- Migrations: Add region/city seed data

**Infrastructure:**
- Backend: localhost:4000 (dev) → production URL (deploy)
- Admin: localhost:5173 (dev) → production URL (deploy)
- Mobile: Expo Go (dev) → App stores (later)

---

## 🚀 Parallel Work Tracks

**Main Track: Admin Dashboard (Priority)**
- Days 1-21: Full focus on map-based matching

**Secondary Track: Backend Support (As Needed)**
- Days 1-2: Region/city endpoints + seed data
- Days 8-9: Distance calculation service
- Days 10-11: Offer negotiation endpoints
- Days 12-14: Inspection endpoints
- Days 15-18: Transport endpoints

**Testing Track: Continuous**
- Daily: Unit tests for new components
- Weekly: Integration test runs
- Day 19-20: Full regression testing

---

## 📝 Daily Autonomous Workflow

Each day follows this pattern:

**Morning (9:00 AM):**
1. Orchestrator runs `/daily`
2. Generates task list for the day (from roadmap)
3. Deploys appropriate agents (admin-dashboard-lead, backend-lead)
4. Agents work in parallel

**Midday (12:00 PM):**
5. Progress check
6. Resolve any blockers
7. Adjust plan if needed

**Afternoon (2:00 PM):**
8. Continue execution
9. Integration testing for completed tasks

**Evening (6:00 PM):**
10. End-of-day report
11. Update PROJECT_STATE.json
12. Generate tomorrow's plan

---

## 🎯 Milestone Tracking

```json
{
  "milestones": [
    {
      "name": "Week 1: Map Foundation",
      "targetDate": "2025-10-17",
      "progress": 0,
      "status": "PENDING"
    },
    {
      "name": "Week 2: Pricing & Offers",
      "targetDate": "2025-10-24",
      "progress": 0,
      "status": "PENDING"
    },
    {
      "name": "Week 3: Transport & Deploy",
      "targetDate": "2025-10-31",
      "progress": 0,
      "status": "PENDING"
    },
    {
      "name": "v0.1 Production Launch",
      "targetDate": "2025-11-01",
      "progress": 0,
      "status": "PENDING"
    }
  ]
}
```

---

## 🔥 Critical Success Factors

1. **Backend APIs must be ready on time** - No delays in endpoint creation
2. **Map performance** - Must render 100+ pins smoothly
3. **Async workflow** - Must handle partial seller acceptance gracefully
4. **Testing discipline** - Integration tests after every major feature
5. **No scope creep** - Stay focused on core v0.1 features

---

## 🎬 Next Steps

**Right Now:**
1. Confirm this roadmap aligns with vision
2. Start Week 1 Day 1 tasks
3. Deploy admin-dashboard-lead agent
4. Begin Bulgaria map implementation

**Then:**
- Execute daily autonomous workflow
- Track progress in PROJECT_STATE.json
- Adjust plan as needed based on reality

---

**Status**: Ready for execution
**Owner**: Product Architect (coordinating all agents)
**Review**: Daily at end-of-day report
**Success**: v0.1 ships November 1, 2025
