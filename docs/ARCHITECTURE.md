# Agro-Trade Platform Architecture

**Last Updated**: 2025-11-27
**Status**: Living Document
**Purpose**: Complete system overview, user roles, trade flows, and feature requirements

---

## 1. Platform Overview

Agro-Trade is a B2B agricultural commodity trading platform that digitizes the supply chain from farmer to buyer. The platform connects:
- **Sellers (Farmers)** who have agricultural products to sell
- **Buyers** who need to purchase commodities
- **Transporters** who move goods from sellers to buyers
- **Inspectors** who verify product quality before transport
- **Admins** who orchestrate trade operations

---

## 2. User Roles & Journeys

### 2.1 SELLER (FARMER)

**Who**: Agricultural producers with commodities to sell

**Complete Journey**:
```
ONBOARDING                    DASHBOARD                      TRADE PARTICIPATION
───────────────────────────────────────────────────────────────────────────────
1. Select products they grow  5. View/manage sale listings   9. Receive offers from platform
2. Add product details        6. See market prices           10. Accept/Reject/Counter offers
3. Set quantities & prices    7. Track offer status          11. Schedule inspection
4. Create account (OAuth)     8. View earnings history       12. Prepare goods for pickup
                                                             13. Confirm pickup completion
```

**Key Features Required**:
| Feature | Onboarding | Dashboard | Trade Flow | Status |
|---------|------------|-----------|------------|--------|
| Product selection | ✅ | - | - | ⬜ Verify |
| Create sale listing | - | ✅ | - | ⬜ Verify |
| View market prices | - | ✅ | - | ⬜ Verify |
| Receive offers | - | ✅ | ✅ | ⬜ Verify |
| Accept/Reject offer | - | - | ✅ | ⬜ Verify |
| Counter-offer | - | - | ✅ | ⬜ Verify |
| View offer history | - | ✅ | - | ⬜ Verify |
| Inspection scheduling | - | - | ✅ | ⬜ Verify |
| Pickup confirmation | - | - | ✅ | ⬜ Verify |
| Earnings dashboard | - | ✅ | - | ⬜ Verify |
| Notifications | - | ✅ | ✅ | ⬜ Verify |

**Edge Cases**:
- Seller rejects all offers → listing remains active
- Seller counters → platform/buyer can accept or re-counter
- Offer expires (48h) → auto-reject, notify seller
- Inspection fails → seller notified, trade cancelled for that seller
- Partial quantity acceptance → split listing logic

---

### 2.2 BUYER

**Who**: Businesses/traders purchasing agricultural commodities

**Complete Journey**:
```
ONBOARDING                    DASHBOARD                      TRADE PARTICIPATION
───────────────────────────────────────────────────────────────────────────────
1. Select products needed     5. View/manage buy requests    9. Platform creates trade op
2. Specify requirements       6. Track active operations     10. View matched sellers
3. Set quantities & budget    7. See offer responses         11. Review aggregated offers
4. Create account (OAuth)     8. View purchase history       12. Approve/modify trade
                                                             13. Track inspection status
                                                             14. Track transport status
                                                             15. Confirm delivery
```

**Key Features Required**:
| Feature | Onboarding | Dashboard | Trade Flow | Status |
|---------|------------|-----------|------------|--------|
| Product selection | ✅ | - | - | ⬜ Verify |
| Create buy request | - | ✅ | - | ⬜ Verify |
| Set quantity/quality reqs | ✅ | ✅ | - | ⬜ Verify |
| View matched sellers | - | - | ✅ | ⬜ Verify |
| Track trade operations | - | ✅ | ✅ | ⬜ Verify |
| View inspection results | - | - | ✅ | ⬜ Verify |
| Track transport | - | - | ✅ | ⬜ Verify |
| Confirm delivery | - | - | ✅ | ⬜ Verify |
| Purchase history | - | ✅ | - | ⬜ Verify |
| Notifications | - | ✅ | ✅ | ⬜ Verify |

**Edge Cases**:
- No sellers match requirements → notify buyer, suggest alternatives
- Partial fulfillment → multiple sellers aggregated
- All sellers reject → trade operation cancelled
- Inspection fails for some sellers → find replacement or reduce quantity
- Transport delayed → notifications and ETA updates

---

### 2.3 TRANSPORTER

**Who**: Logistics companies/drivers moving commodities

**Complete Journey**:
```
ONBOARDING                    DASHBOARD                      JOB EXECUTION
───────────────────────────────────────────────────────────────────────────────
1. Enter fleet info           5. View available jobs         9. Accept/bid on jobs
2. Add trucks/capacity        6. Track active jobs           10. Navigate to pickup
3. Set service areas          7. View bid status             11. Confirm pickup
4. Create account (OAuth)     8. Performance metrics         12. Transport goods
                                                             13. Confirm delivery
                                                             14. Get paid
```

**Key Features Required**:
| Feature | Onboarding | Dashboard | Job Flow | Status |
|---------|------------|-----------|----------|--------|
| Fleet registration | ✅ | - | - | ⬜ Verify |
| Add trucks | ✅ | ✅ | - | ⬜ Verify |
| View available jobs | - | ✅ | - | ⬜ Verify |
| Submit bids | - | ✅ | ✅ | ⬜ Verify |
| View bid status | - | ✅ | - | ⬜ Verify |
| Accept job | - | - | ✅ | ⬜ Verify |
| Navigation/route | - | - | ✅ | ⬜ Verify |
| Confirm pickup | - | - | ✅ | ⬜ Verify |
| Confirm delivery | - | - | ✅ | ⬜ Verify |
| Performance stats | - | ✅ | - | ⬜ Verify |
| Earnings history | - | ✅ | - | ⬜ Verify |
| Notifications | - | ✅ | ✅ | ⬜ Verify |

**Edge Cases**:
- Bid rejected → notified, can bid on other jobs
- Multiple transporters needed → job split by truck capacity
- Pickup location changed → re-route notification
- Delivery issues → report mechanism, admin intervention
- Weather/road delays → status update mechanism

---

### 2.4 INSPECTOR

**Who**: Quality verification agents visiting seller locations

**Complete Journey**:
```
ONBOARDING                    DASHBOARD                      INSPECTION EXECUTION
───────────────────────────────────────────────────────────────────────────────
1. Enter credentials          5. View assigned jobs          9. Navigate to location
2. Set service areas          6. View available jobs         10. Perform inspection
3. Certifications             7. Track completed jobs        11. Record quality scores
4. Create account (OAuth)     8. Performance metrics         12. Take photos
                                                             13. Submit results
                                                             14. Pass/Fail determination
```

**Key Features Required**:
| Feature | Onboarding | Dashboard | Inspection Flow | Status |
|---------|------------|-----------|-----------------|--------|
| Profile setup | ✅ | - | - | ⬜ Verify |
| View assigned jobs | - | ✅ | - | ⬜ Verify |
| View available jobs | - | ✅ | - | ⬜ Verify |
| Accept job | - | ✅ | ✅ | ⬜ Verify |
| Navigate to location | - | - | ✅ | ⬜ Verify |
| Quality checklist | - | - | ✅ | ⬜ Verify |
| Photo capture | - | - | ✅ | ⬜ Verify |
| Submit results | - | - | ✅ | ⬜ Verify |
| Pass/Fail decision | - | - | ✅ | ⬜ Verify |
| Performance stats | - | ✅ | - | ⬜ Verify |
| Notifications | - | ✅ | ✅ | ⬜ Verify |

**Edge Cases**:
- Seller not available → reschedule mechanism
- Quality borderline → escalation to admin
- Photos fail to upload → offline storage + retry
- Inspector declines job → reassign to another
- Multiple inspections same location → batch handling

---

### 2.5 ADMIN

**Who**: Platform operators managing trade operations

**Complete Journey**:
```
DASHBOARD                                    TRADE MANAGEMENT
───────────────────────────────────────────────────────────────────────────────
1. View all trade operations                 6. Create trade operations
2. Monitor active negotiations               7. Match sellers to buyers
3. Track inspection status                   8. Assign inspectors
4. Monitor transport status                  9. Approve transport bids
5. Handle exceptions/escalations             10. Complete/cancel trades
```

**Key Features Required**:
| Feature | Dashboard | Trade Mgmt | Status |
|---------|-----------|------------|--------|
| Trade operations list | ✅ | - | ✅ Done |
| Create trade operation | - | ✅ | ✅ Done |
| Match sellers to buyers | - | ✅ | ✅ Done |
| Send offers to sellers | - | ✅ | ✅ Done |
| View negotiation status | ✅ | ✅ | ✅ Done |
| Assign inspectors | - | ✅ | ⬜ Verify |
| View inspection results | ✅ | ✅ | ⬜ Verify |
| Create transport requests | - | ✅ | ✅ Done |
| Review transport bids | ✅ | ✅ | ✅ Done |
| Accept/reject bids | - | ✅ | ✅ Done |
| Track transport jobs | ✅ | ✅ | ✅ Done |
| Complete trade | - | ✅ | ⬜ Verify |
| Scenario testing | ✅ | - | ✅ Done |

---

## 3. Complete Trade Flow

```
                              AGRO-TRADE FLOW
══════════════════════════════════════════════════════════════════════════════

PHASE 1: INITIATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  BUYER creates buy request    →    SELLERS have active listings            │
│  (product, qty, quality, delivery)     (product, qty, price, location)     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 2: SELLER MATCHING
┌─────────────────────────────────────────────────────────────────────────────┐
│  ADMIN creates TradeOperation                                               │
│  ADMIN uses map-based matching to select sellers                            │
│  Platform calculates transport costs per seller                             │
│  ADMIN sends offers to selected sellers                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 3: SELLER NEGOTIATION
┌─────────────────────────────────────────────────────────────────────────────┐
│  SELLERS receive offer notifications                                        │
│  SELLERS can: ACCEPT / REJECT / COUNTER                                     │
│  Offers expire after 48 hours                                               │
│  ADMIN reviews counter-offers, accepts/rejects                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 4: INSPECTION PENDING
┌─────────────────────────────────────────────────────────────────────────────┐
│  Inspection requests auto-created for accepted sellers                      │
│  ADMIN assigns inspectors based on proximity                                │
│  INSPECTORS visit locations, verify quality                                 │
│  Submit results: PASS (verified) or FAIL (rejected)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 5: TRANSPORT MATCHING
┌─────────────────────────────────────────────────────────────────────────────┐
│  Transport request created (pickup points from verified sellers)            │
│  Platform calculates: trucks needed, estimated costs                        │
│  Request visible to TRANSPORTERS                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 6: TRANSPORT BIDDING
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRANSPORTERS submit bids (price, trucks, timeline)                         │
│  Bidding deadline: 48 hours                                                 │
│  ADMIN reviews bids, accepts best option(s)                                 │
│  Transport jobs created for accepted bids                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 7: IN TRANSIT
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRANSPORTERS start jobs, navigate to pickup locations                      │
│  Confirm pickup at each seller location                                     │
│  Transport goods to buyer delivery point                                    │
│  Update status: PICKED_UP → IN_TRANSIT → APPROACHING                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 8: DELIVERED
┌─────────────────────────────────────────────────────────────────────────────┐
│  TRANSPORTERS confirm delivery                                              │
│  BUYER confirms receipt                                                     │
│  Quality check at delivery (optional)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
PHASE 9: COMPLETED
┌─────────────────────────────────────────────────────────────────────────────┐
│  Trade operation marked complete                                            │
│  Payments processed (future)                                                │
│  All parties notified                                                       │
│  Stats/metrics updated                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. System Components

### 4.1 Backend (NestJS)
- **Location**: `backend/`
- **Modules**: buyer, seller, trade-operations, negotiations, inspections, transport
- **Database**: PostgreSQL via Prisma ORM
- **Caching**: Redis
- **Auth**: JWT + OAuth (Google, Privy)

### 4.2 Admin Dashboard (React/Vite)
- **Location**: `admin-dashboard/`
- **Purpose**: Internal operations console
- **Features**: Trade management, matching, scenario testing

### 4.3 Mobile App (React Native/Expo)
- **Location**: `front-end/`
- **Purpose**: User-facing app for all roles
- **Auth**: Privy (OAuth + email)

---

## 5. Data Model Summary

### Core Entities
| Entity | Description |
|--------|-------------|
| `User` | All platform users (role-based: ADMIN, FARMER, BUYER, TRANSPORTER, INSPECTOR) |
| `Product` | Agricultural commodities (wheat, corn, sunflower, etc.) |
| `SaleListing` | Seller's product offering |
| `BuyListing` | Buyer's purchase request |
| `TradeOperation` | Orchestrated trade connecting buyers and sellers |
| `TradeSeller` | Seller participating in a trade operation |
| `OfferNegotiation` | Offer sent to seller with negotiation rounds |
| `InspectionRequest` | Quality verification job |
| `TransportRequest` | Logistics job request |
| `TransportBid` | Transporter's bid on a job |
| `TransportJob` | Accepted transport assignment |

### Trade Phases
```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING →
TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

---

## 6. API Endpoints by Role

### Seller Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/privy/login` | Login with Privy |
| GET | `/api/seller/listings` | Get my listings |
| POST | `/api/seller/listings` | Create listing |
| GET | `/api/seller/offers` | Get offers for my listings |
| POST | `/api/negotiations/:id/accept` | Accept offer |
| POST | `/api/negotiations/:id/reject` | Reject offer |
| POST | `/api/negotiations/:id/counter` | Counter offer |

### Buyer Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/privy/login` | Login with Privy |
| GET | `/api/buyer/listings` | Get my buy requests |
| POST | `/api/buyer/listings` | Create buy request |
| GET | `/api/buyer/trade-operations` | Get my trade operations |

### Transporter Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/privy/login` | Login with Privy |
| GET | `/api/transport/requests` | Get available jobs |
| POST | `/api/transport/bids` | Submit bid |
| GET | `/api/transport/jobs` | Get my jobs |
| POST | `/api/transport/jobs/:id/start` | Start job |
| POST | `/api/transport/jobs/:id/pickup` | Confirm pickup |
| POST | `/api/transport/jobs/:id/delivery` | Confirm delivery |

### Inspector Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/privy/login` | Login with Privy |
| GET | `/api/inspections` | Get available inspections |
| GET | `/api/inspections/inspector/:id` | Get my assignments |
| PUT | `/api/inspections/:id/assign` | Accept assignment |
| POST | `/api/inspections/:id/results` | Submit results |

---

## 7. Current Status & Gaps

### What's Working (Verified)
- ✅ Admin Dashboard: Scenario orchestrator, map matching, transport management
- ✅ Backend: Core trade operations, negotiations, transport bidding
- ✅ Mobile: Onboarding flows (structure), dashboard layouts

### What Needs Verification
- ⬜ Mobile: Seller complete flow (onboarding → dashboard → offers)
- ⬜ Mobile: Buyer complete flow
- ⬜ Mobile: Transporter complete flow
- ⬜ Mobile: Inspector complete flow
- ⬜ Mobile ↔ Backend: All API integrations
- ⬜ Mobile ↔ Admin: Real-time updates
- ⬜ E2E Tests: Per-role coverage

### Known Issues
- Mobile auth: Privy integration needs testing (NativeWind styles, token retrieval)
- Mobile deployment: Local dev builds required for testing

---

## 8. Testing Strategy

### Per-Role Testing Approach
For each user role, verify:
1. **Onboarding**: Complete flow from start to account creation
2. **Dashboard**: All features load and display correctly
3. **Actions**: All user actions work (CRUD, accept/reject, etc.)
4. **API**: Backend handles all requests correctly
5. **Admin Integration**: Updates appear in admin dashboard
6. **E2E Tests**: Automated coverage for the complete flow

### Test Coverage Targets
| Component | Unit | Integration | E2E |
|-----------|------|-------------|-----|
| Backend | 80% | 85% | Happy paths |
| Admin Dashboard | - | 85% | All features |
| Mobile | 50% | - | Per-role flows |

---

## 9. Next Steps: User Role Completion Initiative

**Approach**: Complete one user role end-to-end before moving to the next

**Order of Priority**:
1. **SELLER** - Foundation of the platform (supply side)
2. **BUYER** - Demand side, triggers trade operations
3. **TRANSPORTER** - Logistics layer
4. **INSPECTOR** - Quality verification layer

**Per-Role Deliverables**:
- [ ] Onboarding flow verified and working
- [ ] Dashboard all features working
- [ ] All API endpoints verified
- [ ] Admin dashboard integration verified
- [ ] E2E tests written and passing
- [ ] Documentation updated

---

*This document should be updated as features are verified and completed.*
