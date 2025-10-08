# Scenario Orchestration Engine - Implementation Plan

## 🎯 Goal
Build a comprehensive admin dashboard feature that allows **100% verified testing** of all trade scenarios and user interactions through a centralized interface.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         ADMIN ORCHESTRATION DASHBOARD           │
│                                                 │
│  ┌──────────────┐  ┌─────────────────────────┐ │
│  │   Scenario   │  │   User Impersonation    │ │
│  │   Playbook   │  │   (Act as any user)     │ │
│  └──────────────┘  └─────────────────────────┘ │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │        Real-Time Multi-User View         │  │
│  │  (See all actors' states simultaneously) │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │         Automated Test Runner            │  │
│  │  (Execute scenarios, verify outcomes)    │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                      ↓
        ┌─────────────────────────────┐
        │   Backend Simulation API    │
        │  (User action endpoints)    │
        └─────────────────────────────┘
                      ↓
        ┌─────────────────────────────┐
        │     Real Backend APIs       │
        │  (Existing controllers)     │
        └─────────────────────────────┘
```

---

## Phase 1: Backend Simulation API Layer

### New Controller: `SimulationController`
**Location**: `backend/src/simulation/simulation.controller.ts`

**Purpose**: Admin-only endpoints to simulate user actions without requiring actual user authentication.

```typescript
@Controller('simulation')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class SimulationController {

  // Buyer Actions
  @Post('buyer/:userId/create-listing')
  async simulateBuyerCreateListing(
    @Param('userId') userId: string,
    @Body() dto: CreateBuyListingDto
  ) { /* ... */ }

  // Seller Actions
  @Post('seller/:userId/accept-offer')
  async simulateSellerAcceptOffer(
    @Param('userId') userId: string,
    @Body() dto: { negotiationId: string }
  ) { /* ... */ }

  @Post('seller/:userId/counter-offer')
  async simulateSellerCounterOffer(
    @Param('userId') userId: string,
    @Body() dto: CounterOfferDto
  ) { /* ... */ }

  @Post('seller/:userId/reject-offer')
  async simulateSellerRejectOffer(
    @Param('userId') userId: string,
    @Body() dto: { negotiationId: string }
  ) { /* ... */ }

  // Transporter Actions
  @Post('transporter/:userId/submit-bid')
  async simulateTransporterBid(
    @Param('userId') userId: string,
    @Body() dto: CreateTransportBidDto
  ) { /* ... */ }

  @Post('transporter/:userId/start-job')
  async simulateStartTransportJob(
    @Param('userId') userId: string,
    @Body() dto: { jobId: string }
  ) { /* ... */ }

  @Post('transporter/:userId/complete-pickup')
  async simulateCompletePickup(
    @Param('userId') userId: string,
    @Body() dto: CompletePickupDto
  ) { /* ... */ }

  @Post('transporter/:userId/complete-delivery')
  async simulateCompleteDelivery(
    @Param('userId') userId: string,
    @Body() dto: CompleteDeliveryDto
  ) { /* ... */ }

  // Inspector Actions
  @Post('inspector/:userId/accept-job')
  async simulateInspectorAcceptJob(
    @Param('userId') userId: string,
    @Body() dto: { inspectionId: string }
  ) { /* ... */ }

  @Post('inspector/:userId/submit-results')
  async simulateInspectionResults(
    @Param('userId') userId: string,
    @Body() dto: InspectionResultsDto
  ) { /* ... */ }

  // State Queries
  @Get('trade-operation/:id/full-state')
  async getFullTradeState(
    @Param('id') id: string
  ) {
    // Returns complete state including all users, negotiations, transport, inspections
  }

  @Get('users/by-role/:role')
  async getUsersByRole(@Param('role') role: UserRole) {
    // Get all test users for a specific role
  }
}
```

---

## Phase 2: Frontend Scenario Player

### New Component: `ScenarioOrchestrator`
**Location**: `admin-dashboard/src/components/ScenarioOrchestrator.tsx`

**Features**:
1. **Scenario Library** - Pre-defined test scenarios
2. **User Selector** - Pick any user to impersonate
3. **Action Panel** - Context-aware actions for selected user
4. **State Viewer** - Real-time multi-panel view of all actors
5. **Automation Runner** - Execute full scenarios automatically

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Scenario: Happy Path - Full Trade                      │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │ Run Auto    │ │ Step Mode   │ │ Current: Step 3  │  │
│  └─────────────┘ └─────────────┘ └──────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Multi-User State View                                  │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐│
│  │ Buyer   │ │ Seller  │ │Transport │ │  Inspector   ││
│  │ [View]  │ │ [View]  │ │ [View]   │ │  [View]      ││
│  └─────────┘ └─────────┘ └──────────┘ └──────────────┘│
├─────────────────────────────────────────────────────────┤
│  Action Panel (Context: Seller - John Doe)              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Available Actions:                               │  │
│  │  ☑ Accept Offer #123 (€270/ton, 200 tons)      │  │
│  │  ☐ Counter Offer #123                           │  │
│  │  ☐ Reject Offer #123                            │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  Timeline & History                                     │
│  ✓ 1. Admin created trade operation                    │
│  ✓ 2. Admin sent offers to sellers                     │
│  → 3. Seller accepts offer [NEXT]                      │
│    4. Admin requests inspection                        │
│    5. Inspector submits results                        │
│    ...                                                 │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 3: Pre-Defined Scenarios

### Scenario Definitions
**Location**: `admin-dashboard/src/scenarios/`

#### 1. **Happy Path - Complete Trade**
```typescript
export const happyPathScenario: Scenario = {
  id: 'happy-path-full-trade',
  name: 'Happy Path - Full Trade Flow',
  description: 'Complete successful trade from buyer request to delivery',
  steps: [
    {
      step: 1,
      actor: 'BUYER',
      action: 'CREATE_BUY_LISTING',
      description: 'Buyer creates buy listing for 500 tons wheat',
      payload: {
        productId: 'wheat-001',
        quantity: 500,
        maxPricePerUnit: 300,
        deliveryLocation: { lat: 42.6977, lng: 23.3219 }
      }
    },
    {
      step: 2,
      actor: 'ADMIN',
      action: 'CREATE_TRADE_OPERATION',
      description: 'Admin creates trade operation with 10% margin',
      payload: { margin: 10 }
    },
    {
      step: 3,
      actor: 'ADMIN',
      action: 'SEND_BULK_OFFERS',
      description: 'Admin sends offers to 3 sellers',
      payload: {
        sellers: [
          { sellerId: 'seller-1', quantity: 200, price: 270 },
          { sellerId: 'seller-2', quantity: 200, price: 275 },
          { sellerId: 'seller-3', quantity: 100, price: 280 }
        ]
      }
    },
    {
      step: 4,
      actor: 'SELLER',
      userId: 'seller-1',
      action: 'ACCEPT_OFFER',
      description: 'Seller 1 accepts offer',
    },
    {
      step: 5,
      actor: 'SELLER',
      userId: 'seller-2',
      action: 'COUNTER_OFFER',
      description: 'Seller 2 counters with €280/ton',
      payload: { counterPrice: 280 }
    },
    {
      step: 6,
      actor: 'ADMIN',
      action: 'ACCEPT_COUNTER',
      description: 'Admin accepts counter-offer'
    },
    {
      step: 7,
      actor: 'SELLER',
      userId: 'seller-3',
      action: 'ACCEPT_OFFER',
      description: 'Seller 3 accepts offer'
    },
    {
      step: 8,
      actor: 'ADMIN',
      action: 'REQUEST_INSPECTIONS',
      description: 'Admin requests quality inspections'
    },
    {
      step: 9,
      actor: 'INSPECTOR',
      userId: 'inspector-1',
      action: 'SUBMIT_RESULTS',
      description: 'Inspector submits passing results',
      payload: { qualityScore: 85, status: 'PASSED' }
    },
    {
      step: 10,
      actor: 'ADMIN',
      action: 'CREATE_TRANSPORT_REQUEST',
      description: 'Admin creates transport request'
    },
    {
      step: 11,
      actor: 'TRANSPORTER',
      userId: 'transporter-1',
      action: 'SUBMIT_BID',
      description: 'Transporter submits bid',
      payload: { amount: 4500, duration: 36 }
    },
    {
      step: 12,
      actor: 'ADMIN',
      action: 'ACCEPT_BID',
      description: 'Admin accepts transport bid'
    },
    {
      step: 13,
      actor: 'TRANSPORTER',
      userId: 'transporter-1',
      action: 'START_JOB',
      description: 'Transporter starts delivery'
    },
    {
      step: 14,
      actor: 'TRANSPORTER',
      userId: 'transporter-1',
      action: 'COMPLETE_DELIVERY',
      description: 'Transporter completes delivery'
    },
    {
      step: 15,
      actor: 'ADMIN',
      action: 'FINALIZE_TRADE',
      description: 'Admin finalizes trade operation',
      expectedOutcome: {
        status: 'COMPLETED',
        phase: 'COMPLETED',
        profitMargin: '>=10%'
      }
    }
  ]
};
```

#### 2. **Inspection Failure Scenario**
```typescript
export const inspectionFailureScenario: Scenario = {
  id: 'inspection-failure',
  name: 'Inspection Failure - Replacement Flow',
  description: 'Seller fails inspection, admin finds replacement',
  steps: [
    // ... steps 1-8 same as happy path
    {
      step: 9,
      actor: 'INSPECTOR',
      userId: 'inspector-1',
      action: 'SUBMIT_RESULTS',
      description: 'Inspector submits failing results for Seller 1',
      payload: {
        sellerId: 'seller-1',
        qualityScore: 55, // Below 70 threshold
        status: 'FAILED',
        issues: ['Moisture content too high', 'Foreign matter detected']
      }
    },
    {
      step: 10,
      actor: 'ADMIN',
      action: 'REMOVE_FAILED_SELLER',
      description: 'System removes failed seller automatically'
    },
    {
      step: 11,
      actor: 'ADMIN',
      action: 'FIND_REPLACEMENT',
      description: 'Admin finds replacement seller',
      payload: { replacementSellerId: 'seller-4' }
    },
    {
      step: 12,
      actor: 'ADMIN',
      action: 'SEND_OFFER',
      description: 'Admin sends offer to replacement seller'
    },
    {
      step: 13,
      actor: 'SELLER',
      userId: 'seller-4',
      action: 'ACCEPT_OFFER',
      description: 'Replacement seller accepts'
    },
    // ... continue with inspection and transport
  ]
};
```

#### 3. **Multi-Counter Negotiation Scenario**
#### 4. **Transport Delay Scenario**
#### 5. **Buyer Budget Constraint Scenario**
#### 6. **Competitive Transport Bidding Scenario**

---

## Phase 4: Automation Engine

### Scenario Executor Service
**Location**: `admin-dashboard/src/services/scenarioExecutor.ts`

```typescript
class ScenarioExecutor {
  async runScenario(scenario: Scenario, mode: 'auto' | 'step-by-step') {
    const state = {
      currentStep: 0,
      tradeOperationId: null,
      actors: {},
      results: []
    };

    for (const step of scenario.steps) {
      if (mode === 'step-by-step') {
        await this.waitForUserConfirmation();
      }

      const result = await this.executeStep(step, state);
      state.results.push(result);
      state.currentStep++;

      // Verify expected outcomes
      if (step.expectedOutcome) {
        const verification = await this.verifyOutcome(
          step.expectedOutcome,
          state
        );
        if (!verification.passed) {
          throw new ScenarioFailureError(verification.reason);
        }
      }

      // Update UI state
      this.emitStateUpdate(state);
    }

    return state;
  }

  private async executeStep(step: ScenarioStep, state: any) {
    switch (step.action) {
      case 'CREATE_BUY_LISTING':
        return await simulationApi.buyer.createListing(
          step.userId,
          step.payload
        );

      case 'ACCEPT_OFFER':
        return await simulationApi.seller.acceptOffer(
          step.userId,
          step.payload
        );

      case 'SUBMIT_BID':
        return await simulationApi.transporter.submitBid(
          step.userId,
          step.payload
        );

      // ... all other actions
    }
  }

  private async verifyOutcome(expected: any, actual: any): Promise<VerificationResult> {
    // Compare expected vs actual state
    // Return pass/fail with details
  }
}
```

---

## Implementation Timeline

### Week 1: Backend Foundation
- [ ] Create `SimulationController` with all user action endpoints
- [ ] Add admin-only guard
- [ ] Create DTOs for simulation actions
- [ ] Add endpoints for state queries
- [ ] Unit test all simulation endpoints

### Week 2: Frontend Infrastructure
- [ ] Build `ScenarioOrchestrator` component
- [ ] Create user impersonation UI
- [ ] Build multi-panel state viewer
- [ ] Implement action panel with context-aware buttons
- [ ] Add timeline/history component

### Week 3: Scenario Library
- [ ] Define all 10+ test scenarios
- [ ] Build scenario selector UI
- [ ] Implement step-by-step execution
- [ ] Add automated execution mode
- [ ] Create scenario results viewer

### Week 4: Verification & Polish
- [ ] Add outcome verification engine
- [ ] Implement scenario recording/replay
- [ ] Add export to test report
- [ ] Performance testing with complex scenarios
- [ ] Documentation and handoff

---

## Success Criteria

✅ **100% Scenario Coverage**
- Every phase transition testable
- Every user action simulatable
- Every edge case reproducible

✅ **1-Click Testing**
- Run full "happy path" in <30 seconds
- Run "failure scenarios" automatically
- Generate test reports

✅ **Real-Time Visibility**
- See all actors' states simultaneously
- Track action history
- Monitor profit calculations live

✅ **Production-Ready Confidence**
- 1000% verified trade flows
- Repeatable regression testing
- Clear failure diagnostics

---

## File Structure

```
backend/
├── src/
│   └── simulation/
│       ├── simulation.controller.ts
│       ├── simulation.service.ts
│       └── dto/
│           ├── buyer-simulation.dto.ts
│           ├── seller-simulation.dto.ts
│           ├── transporter-simulation.dto.ts
│           └── inspector-simulation.dto.ts

admin-dashboard/
├── src/
│   ├── components/
│   │   ├── ScenarioOrchestrator.tsx
│   │   ├── UserImpersonationPanel.tsx
│   │   ├── MultiUserStateView.tsx
│   │   ├── ActionPanel.tsx
│   │   └── ScenarioTimeline.tsx
│   ├── scenarios/
│   │   ├── happy-path.ts
│   │   ├── inspection-failure.ts
│   │   ├── transport-delay.ts
│   │   └── index.ts
│   └── services/
│       ├── simulationApi.ts
│       └── scenarioExecutor.ts
```

---

## Next Immediate Steps

1. **Create SimulationController** in backend
2. **Add simulation endpoints** for each user type
3. **Build basic ScenarioOrchestrator UI** in admin dashboard
4. **Define first scenario** (happy path)
5. **Test end-to-end** manually
6. **Add automation** for regression

---

This approach gives you **complete control and visibility** over every possible trade scenario from one unified admin interface.

**Ready to start building?** 🚀
