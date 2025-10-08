# Scenario Orchestration - Backend Simulation Module Handoff

## ✅ What Has Been Completed

### Backend Infrastructure
All backend simulation infrastructure is **COMPLETE and READY** for frontend integration.

#### Created Files
1. **`backend/src/simulation/simulation.module.ts`**
   - Module registration with all dependencies
   - Imports: PrismaModule, BuyerModule, SellerModule, NegotiationsModule, TransportModule, InspectionModule, TradeOperationsModule
   - Exports SimulationService for other modules to use

2. **`backend/src/simulation/simulation.service.ts`**
   - `getUsersByRole(role)` - Get all users by role for simulation
   - `getFullTradeState(tradeOperationId)` - Complete trade operation state with all actors
   - `createTestUser(role, data)` - Create mock/test users for scenarios
   - Calculates derived state (quantity gaps, pending negotiations, inspection stats)

3. **`backend/src/simulation/simulation.controller.ts`**
   - **Admin-only** endpoints (protected by JWT + RolesGuard)
   - State query endpoints
   - User action simulation endpoints for all 4 user types

4. **`backend/src/app.module.ts`** (MODIFIED)
   - Added SimulationModule to imports array

---

## 📡 Available API Endpoints

### Base URL: `http://localhost:4000/api/simulation`

All endpoints require:
- **Authorization**: `Bearer <admin_jwt_token>`
- **Admin Role**: Only ADMIN users can access

### State Query Endpoints

#### 1. Get Users by Role
```http
GET /api/simulation/users/:role
```
**Params**: `role` (BUYER | SELLER | TRANSPORTER | INSPECTOR | ADMIN)

**Response**:
```json
[
  {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "SELLER",
    "seller": {
      "id": "seller-id",
      "farmName": "Farm Name",
      "farmSize": 100
    }
  }
]
```

#### 2. Get Full Trade State
```http
GET /api/simulation/trade-operation/:id/full-state
```
**Params**: `id` (tradeOperationId)

**Response**:
```json
{
  "operation": { /* Full TradeOperation with all relations */ },
  "state": {
    "phase": "SELLER_NEGOTIATION",
    "status": "ACTIVE",
    "totalQuantityNeeded": 500,
    "securedQuantity": 300,
    "quantityGap": 200,
    "pendingNegotiations": 2,
    "activeTransport": null,
    "inspections": {
      "total": 3,
      "pending": 1,
      "passed": 2,
      "failed": 0
    }
  },
  "actors": {
    "buyer": { /* Buyer details */ },
    "sellers": [ /* Array of sellers with trade status */ ],
    "transporters": [ /* Array of transporters with bids */ ],
    "inspectors": [ /* Array of inspectors with results */ ]
  }
}
```

#### 3. Create Test User
```http
POST /api/simulation/users/create-test-user
```
**Body**:
```json
{
  "role": "SELLER",
  "name": "Test Seller",
  "data": {
    "farmName": "Test Farm",
    "farmSize": 150,
    "location": "Test Location"
  }
}
```

**Response**: Complete user object with role-specific profile

---

### Buyer Simulation Endpoints

#### 1. Create Buy Listing
```http
POST /api/simulation/buyer/:userId/create-listing
```
**Body**:
```json
{
  "productId": "product-id",
  "quantity": 500,
  "unit": "TON",
  "maxPricePerUnit": 300,
  "deliveryLocation": {
    "lat": 42.6977,
    "lng": 23.3219
  },
  "deliveryBy": "2025-11-05T00:00:00Z",
  "description": "Buy listing description"
}
```

---

### Seller Simulation Endpoints

#### 1. Accept Offer
```http
POST /api/simulation/seller/:userId/accept-offer
```
**Body**:
```json
{
  "negotiationId": "negotiation-id"
}
```

#### 2. Counter Offer
```http
POST /api/simulation/seller/:userId/counter-offer
```
**Body**:
```json
{
  "negotiationId": "negotiation-id",
  "counterPrice": 280,
  "counterQuantity": 150
}
```

#### 3. Reject Offer
```http
POST /api/simulation/seller/:userId/reject-offer
```
**Body**:
```json
{
  "negotiationId": "negotiation-id",
  "reason": "Price too low"
}
```

---

### Transporter Simulation Endpoints

#### 1. Submit Bid
```http
POST /api/simulation/transporter/:userId/submit-bid
```
**Body**:
```json
{
  "transportRequestId": "request-id",
  "bidAmount": 4500,
  "estimatedDuration": 36
}
```

#### 2. Start Transport Job
```http
POST /api/simulation/transporter/:userId/start-job
```
**Body**:
```json
{
  "jobId": "job-id"
}
```

#### 3. Complete Delivery
```http
POST /api/simulation/transporter/:userId/complete-delivery
```
**Body**:
```json
{
  "jobId": "job-id",
  "deliveryNotes": "Delivery completed successfully"
}
```

---

### Inspector Simulation Endpoints

#### 1. Accept Inspection Job
```http
POST /api/simulation/inspector/:userId/accept-job
```
**Body**:
```json
{
  "inspectionId": "inspection-id"
}
```

#### 2. Submit Inspection Results
```http
POST /api/simulation/inspector/:userId/submit-results
```
**Body**:
```json
{
  "inspectionId": "inspection-id",
  "qualityScore": 85,
  "result": "PASSED",
  "notes": "High quality wheat, meets all standards"
}
```

**Notes**:
- Result < 70 quality score = FAILED (auto-removes seller from trade)
- Result >= 70 = PASSED (marks seller as verified)
- Updates TradeSeller status and isVerified flag

---

## 🚀 How to Use the Simulation Module

### 1. Start Backend
```bash
cd backend
npm run start:dev
```

The SimulationModule will be loaded and all endpoints will be available.

### 2. Get Admin Token
```bash
# Login as admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "test123"
  }'
```

Save the JWT token from response.

### 3. Test Simulation Endpoints
```bash
# Get all sellers
curl http://localhost:4000/api/simulation/users/SELLER \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get trade operation state
curl http://localhost:4000/api/simulation/trade-operation/TRADE_OP_ID/full-state \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Simulate seller accepting offer
curl -X POST http://localhost:4000/api/simulation/seller/SELLER_USER_ID/accept-offer \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"negotiationId": "NEGOTIATION_ID"}'
```

---

## 📋 Next Steps: Frontend Implementation

### Phase 1: Admin Dashboard Integration

Create the following components in `admin-dashboard/src/`:

#### 1. **ScenarioOrchestrator Component** (`components/ScenarioOrchestrator.tsx`)
- Main orchestration interface
- Scenario selector dropdown
- Auto/step-by-step mode toggle
- Multi-panel state viewer

#### 2. **UserImpersonationPanel Component** (`components/UserImpersonationPanel.tsx`)
- User role selector (Buyer/Seller/Transporter/Inspector)
- User list for selected role
- "Act as User" button
- Current impersonation indicator

#### 3. **MultiUserStateView Component** (`components/MultiUserStateView.tsx`)
- 4 panels (Buyer, Seller, Transporter, Inspector)
- Real-time state for each actor
- Trade operation progress visualization
- Quantity secured vs needed progress bar

#### 4. **ActionPanel Component** (`components/ActionPanel.tsx`)
- Context-aware actions for selected user
- Form inputs for action parameters
- Execute action button
- Action result display

#### 5. **ScenarioTimeline Component** (`components/ScenarioTimeline.tsx`)
- Step-by-step scenario visualization
- Current step indicator
- Completed/pending/failed step badges
- Action history log

### Phase 2: Scenario Definitions

Create scenario files in `admin-dashboard/src/scenarios/`:

#### 1. **happy-path.ts**
Complete successful trade flow (15 steps):
- Buyer creates listing
- Admin creates trade operation
- Admin sends offers to sellers
- Sellers accept/counter offers
- Admin accepts counters
- Admin requests inspections
- Inspectors submit passing results
- Admin creates transport request
- Transporters submit bids
- Admin accepts bid
- Transporter completes delivery
- Admin finalizes trade

#### 2. **inspection-failure.ts**
Seller fails inspection, replacement flow:
- Steps 1-8 same as happy path
- Inspector submits FAILED result
- System removes failed seller
- Admin finds replacement seller
- Continue with inspection and transport

#### 3. **multi-counter.ts**
Complex negotiation with multiple counter-offers

#### 4. **transport-delay.ts**
Transport issues requiring new transporter

#### 5. **budget-constraint.ts**
Buyer budget constraints requiring price renegotiation

### Phase 3: Simulation API Service

Create `admin-dashboard/src/services/simulationApi.ts`:

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/simulation';

export const simulationApi = {
  // State queries
  getUsersByRole: async (role: UserRole) => {
    return axios.get(`${API_BASE}/users/${role}`);
  },

  getFullTradeState: async (tradeOpId: string) => {
    return axios.get(`${API_BASE}/trade-operation/${tradeOpId}/full-state`);
  },

  // Buyer actions
  buyer: {
    createListing: async (userId: string, data: any) => {
      return axios.post(`${API_BASE}/buyer/${userId}/create-listing`, data);
    },
  },

  // Seller actions
  seller: {
    acceptOffer: async (userId: string, negotiationId: string) => {
      return axios.post(`${API_BASE}/seller/${userId}/accept-offer`, { negotiationId });
    },
    counterOffer: async (userId: string, data: any) => {
      return axios.post(`${API_BASE}/seller/${userId}/counter-offer`, data);
    },
    rejectOffer: async (userId: string, negotiationId: string, reason?: string) => {
      return axios.post(`${API_BASE}/seller/${userId}/reject-offer`, { negotiationId, reason });
    },
  },

  // Transporter actions
  transporter: {
    submitBid: async (userId: string, data: any) => {
      return axios.post(`${API_BASE}/transporter/${userId}/submit-bid`, data);
    },
    startJob: async (userId: string, jobId: string) => {
      return axios.post(`${API_BASE}/transporter/${userId}/start-job`, { jobId });
    },
    completeDelivery: async (userId: string, jobId: string, notes?: string) => {
      return axios.post(`${API_BASE}/transporter/${userId}/complete-delivery`, { jobId, deliveryNotes: notes });
    },
  },

  // Inspector actions
  inspector: {
    acceptJob: async (userId: string, inspectionId: string) => {
      return axios.post(`${API_BASE}/inspector/${userId}/accept-job`, { inspectionId });
    },
    submitResults: async (userId: string, data: any) => {
      return axios.post(`${API_BASE}/inspector/${userId}/submit-results`, data);
    },
  },
};
```

### Phase 4: Scenario Executor

Create `admin-dashboard/src/services/scenarioExecutor.ts`:

```typescript
import { simulationApi } from './simulationApi';
import { Scenario, ScenarioStep } from '../types/scenario';

export class ScenarioExecutor {
  private currentState: any = {};

  async runScenario(scenario: Scenario, mode: 'auto' | 'step-by-step') {
    const results = [];

    for (const step of scenario.steps) {
      if (mode === 'step-by-step') {
        await this.waitForUserConfirmation();
      }

      const result = await this.executeStep(step);
      results.push(result);

      // Verify expected outcome
      if (step.expectedOutcome) {
        const verification = await this.verifyOutcome(step.expectedOutcome, result);
        if (!verification.passed) {
          throw new Error(`Step ${step.step} failed: ${verification.reason}`);
        }
      }

      // Emit state update
      this.emitStateUpdate(step, result);
    }

    return results;
  }

  private async executeStep(step: ScenarioStep) {
    switch (step.action) {
      case 'CREATE_BUY_LISTING':
        return await simulationApi.buyer.createListing(step.userId, step.payload);

      case 'ACCEPT_OFFER':
        return await simulationApi.seller.acceptOffer(step.userId, step.payload.negotiationId);

      case 'COUNTER_OFFER':
        return await simulationApi.seller.counterOffer(step.userId, step.payload);

      case 'SUBMIT_BID':
        return await simulationApi.transporter.submitBid(step.userId, step.payload);

      case 'SUBMIT_RESULTS':
        return await simulationApi.inspector.submitResults(step.userId, step.payload);

      // ... all other actions

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private async verifyOutcome(expected: any, actual: any) {
    // Compare expected vs actual
    // Return { passed: boolean, reason?: string }
  }

  private emitStateUpdate(step: ScenarioStep, result: any) {
    // Emit event for UI to update
  }

  private waitForUserConfirmation(): Promise<void> {
    return new Promise(resolve => {
      // Wait for user to click "Next Step" button
    });
  }
}
```

---

## 🎯 Success Criteria

### Backend (✅ COMPLETE)
- [x] SimulationModule created and registered
- [x] All simulation endpoints implemented
- [x] Admin-only guard applied
- [x] State query endpoints working
- [x] User action simulation for all 4 roles

### Frontend (🚧 TODO)
- [ ] ScenarioOrchestrator component built
- [ ] UserImpersonationPanel working
- [ ] MultiUserStateView displaying all actors
- [ ] ActionPanel with context-aware actions
- [ ] ScenarioTimeline showing progress
- [ ] At least 3 scenarios defined (happy path, inspection failure, multi-counter)
- [ ] Scenario executor service implemented
- [ ] Auto-run mode working
- [ ] Step-by-step mode working

### Testing (🚧 TODO)
- [ ] All scenarios executable from admin dashboard
- [ ] 100% reproducible trade flows
- [ ] All edge cases covered
- [ ] "1000% verified" as user requested

---

## 📚 Documentation References

- **Architecture Plan**: `/SCENARIO_ORCHESTRATION_PLAN.md`
- **Backend Status**: `/backend/REFACTOR_STATUS_REPORT.md`
- **Test Scenarios**: `/backend/TRADE_OPERATION_SCENARIOS.md`

---

## 💡 Key Implementation Notes

1. **Authentication**: All simulation endpoints require admin JWT token
2. **Impersonation**: Admin simulates actions WITHOUT logging in as the user
3. **Real Data**: Simulation endpoints use real backend services, creating real database records
4. **State Isolation**: Each scenario run should use fresh test data
5. **Cleanup**: Consider adding cleanup endpoints to reset database state between scenarios

---

## 🔥 Quick Test Command

Once backend is running, test the simulation module:

```bash
# Get admin token
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"test123"}' \
  | jq -r '.accessToken')

# Get all sellers
curl -s http://localhost:4000/api/simulation/users/SELLER \
  -H "Authorization: Bearer $TOKEN" | jq

# Get all buyers
curl -s http://localhost:4000/api/simulation/users/BUYER \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🚨 Next Immediate Action

**Build the frontend ScenarioOrchestrator component** in the admin dashboard to consume these simulation endpoints and achieve the user's goal:

> "the idea of the whole thing we are doing is to be able to reproduce all of the scenarios and all the users involved in the trades. using the admin dashboard and somehow mock the interactions of the users"

The backend infrastructure is **100% ready** for frontend integration.
