# Agro-Trade Backend - Comprehensive Testing Strategy

## Executive Summary

This document outlines a comprehensive testing strategy for the Agro-Trade platform backend, focusing on end-to-end validation of critical trade workflows, business logic verification, and scenario-based testing.

**Date**: 2025-11-25
**Version**: 1.0
**Owner**: Scenario Test Lead

---

## 1. Project Overview

### 1.1 Platform Architecture
- **Tech Stack**: NestJS + Prisma + PostgreSQL
- **Key Modules**:
  - Trade Operations (core trade orchestration)
  - Negotiations (offer/counter-offer flows)
  - Inspections (quality verification)
  - Transport (bidding and delivery)
  - Profit Calculations (margin validation)

### 1.2 Critical Business Rules

#### Commission Structure
- **Seller Commission**: 2.5% on agreed price
- **Buyer Commission**: 1.5% on final sale price
- **Minimum Profit Margin**: 5%
- **Target Profit Margin**: 7%

#### Time-Based Rules
- **Offer Expiry**: 48 hours automatic expiration
- **Visual Countdown**: Display hours remaining
- **Grace Period**: None (hard cutoff)

#### Trade Flow States
```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING
  → TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

#### Actor Roles
1. **ADMIN**: Platform administrator managing trade operations
2. **BUYER**: Entity purchasing agricultural products
3. **SELLER (FARMER)**: Entity selling agricultural products
4. **INSPECTOR**: Quality verification specialist
5. **TRANSPORTER**: Logistics provider

---

## 2. Test Coverage Analysis

### 2.1 Current Test Coverage

**Existing Integration Tests** (Found in `/test/integration/`):
- ✅ `happy-path-trade-operation.e2e-spec.ts` - Full workflow end-to-end
- ✅ `negotiations.e2e-spec.ts` - Negotiation flows
- ✅ `trade-operations.e2e-spec.ts` - Trade operation CRUD
- ✅ `profit-calculations.e2e-spec.ts` - Margin calculations
- ✅ `transport-optimization.e2e-spec.ts` - Route optimization
- ✅ `admin-dashboard-features.e2e-spec.ts` - Admin features
- ✅ `location-data.e2e-spec.ts` - Geographic data handling

**Inspector Tests**:
- ✅ `inspector/jobs.e2e-spec.ts`
- ✅ `inspector/complete.e2e-spec.ts`
- ✅ `inspector/accept.e2e-spec.ts`

### 2.2 Coverage Gaps Identified

❌ **Missing Critical Tests**:
1. **Expiry Testing**: No comprehensive 48-hour expiry validation with time manipulation
2. **Multi-Seller Aggregation**: Limited testing of quantity aggregation from multiple sellers
3. **Concurrent Modifications**: No race condition testing for simultaneous counter-offers
4. **Commission Validation**: No dedicated commission calculation verification
5. **Edge Cases**: Limited edge case coverage (zero quantity, negative prices, etc.)
6. **Error Recovery**: Insufficient error handling and recovery testing
7. **State Transition Validation**: No comprehensive phase transition guard testing
8. **Inspector Assignment**: Limited testing of auto-assignment logic
9. **Transport Bidding**: Minimal competitive bidding scenario coverage
10. **Payment Flow Integration**: No payment verification testing

---

## 3. Test Scenario Library

### 3.1 Standard Scenarios

#### Scenario 1: Simple Direct Trade
**Objective**: Validate basic 1-buyer, 1-seller trade flow

**Actors**:
- 1 Admin
- 1 Buyer (needs 100 tons wheat @ €350/ton)
- 1 Seller (has 100 tons wheat @ €320/ton)
- 1 Inspector (quality verification)
- 1 Transporter (delivery)

**Steps**:
1. Admin creates trade operation from buy listing
2. Admin selects seller and sends offer (€320/ton, 100 tons)
3. System creates negotiation with 48-hour expiry
4. Seller accepts offer
5. System auto-creates inspection request
6. Inspector completes verification (quality score: 85)
7. System updates trade seller verification status
8. System advances to TRANSPORT_MATCHING
9. System auto-creates transport request
10. Transporter submits bid
11. Admin accepts bid
12. System creates transport job
13. Transporter completes delivery
14. System marks trade COMPLETED

**Expected Results**:
- ✅ Commission calculations correct (2.5% seller, 1.5% buyer)
- ✅ Profit margin ≥ 5%
- ✅ All state transitions valid
- ✅ Timeline tracking accurate

**Success Criteria**:
- Total revenue: €35,000 (100 tons × €350)
- Total purchase cost: €32,000 (100 tons × €320)
- Seller commission: €800 (€32,000 × 2.5%)
- Buyer commission: €525 (€35,000 × 1.5%)
- Net profit: €1,675 (€35,000 - €32,000 - €800 - €525 - transport)
- Profit margin: ~4.8% (should pass minimum threshold)

---

#### Scenario 2: Multi-Seller Aggregation
**Objective**: Test quantity aggregation from multiple sellers

**Actors**:
- 1 Admin
- 1 Buyer (needs 500 tons corn @ €280/ton)
- 5 Sellers (each has 100-120 tons @ €250-€260/ton)
- 5 Inspectors (one per seller)
- 2 Transporters (for multi-pickup route)

**Steps**:
1. Admin creates trade operation for 500 tons
2. Admin finds and selects 5 matching sellers
3. System sends batch offers to all sellers
4. Sellers accept at different rates (€250, €252, €255, €258, €260)
5. System creates 5 inspection requests
6. Inspectors verify all sellers
7. System calculates aggregated purchase cost
8. System creates optimized multi-pickup transport request
9. Transporter submits bid with multi-stop route
10. Admin accepts bid
11. System creates transport job with pickup schedule
12. Transporter completes pickups and delivery

**Expected Results**:
- ✅ Quantity tracking: 500/500 tons secured
- ✅ Progress indicator: 100%
- ✅ Weighted average purchase price calculated correctly
- ✅ Transport route optimized for all pickup points
- ✅ Commission calculated per seller individually
- ✅ Final profit margin meets minimum threshold

**Success Criteria**:
- Total quantity secured: 500 tons
- Average purchase price: ~€255/ton
- Total revenue: €140,000 (500 × €280)
- Total purchase cost: €127,500 (weighted average)
- Total commission: €5,287.50 (seller + buyer)
- Net profit: ~€7,212.50 (after transport)
- Profit margin: ~5.15%

---

#### Scenario 3: Offer Expiry Validation
**Objective**: Verify 48-hour expiry mechanism and countdown

**Actors**:
- 1 Admin
- 1 Buyer (needs 200 tons barley)
- 3 Sellers (each has 70-100 tons)

**Steps**:
1. Admin creates trade operation and sends offers to 3 sellers
2. System records expiry time (now + 48 hours)
3. **Time Check 1 (T+0h)**: Verify expiresAt = now + 48h
4. Seller 1 accepts immediately
5. **Time Check 2 (T+24h)**: Fast-forward 24 hours, verify countdown shows ~24h remaining
6. Seller 2 accepts at T+30h
7. **Time Check 3 (T+48h)**: Fast-forward to T+48h, verify offer 3 shows expired
8. Attempt to accept expired offer → should fail
9. System cron job marks offer 3 as EXPIRED
10. System updates seller 3 status to REJECTED

**Expected Results**:
- ✅ Expiry time set correctly at offer creation
- ✅ Countdown timer accurate at all checkpoints
- ✅ UI shows visual indicators (blue → orange → gray)
- ✅ Expired offers cannot be accepted
- ✅ Cron job auto-expires overdue offers
- ✅ Sale listing re-activated for expired offer

**Success Criteria**:
- Offer 1: ACCEPTED (at T+0h)
- Offer 2: ACCEPTED (at T+30h)
- Offer 3: EXPIRED (at T+48h+)
- Attempt to accept offer 3 → HTTP 400 "Negotiation has expired"
- Database: offer 3 status = EXPIRED, concludedAt set

**Test Implementation**:
```typescript
// Use time manipulation for fast-forward
const mockNow = new Date();
jest.useFakeTimers();
jest.setSystemTime(mockNow);

// Create offer (expires in 48h)
const offer = await createOffer(...);

// Fast-forward 48 hours
jest.advanceTimersByTime(48 * 60 * 60 * 1000);

// Trigger expiry cron
await negotiationExpiryService.expireOverdueNegotiations();

// Verify expiry
const expired = await getOffer(offer.id);
expect(expired.status).toBe('EXPIRED');
```

---

#### Scenario 4: Counter-Offer Negotiation
**Objective**: Test multi-round negotiation with convergence

**Actors**:
- 1 Admin
- 1 Buyer (needs 300 tons wheat @ €360/ton)
- 1 Seller (has 300 tons @ €350/ton asking price)

**Steps**:
1. Admin sends initial offer: €330/ton
2. Seller counters: €345/ton (reason: "High quality, certified organic")
3. System updates negotiation status to COUNTERED
4. Admin re-counters: €338/ton (reason: "Bulk order discount request")
5. Seller accepts €338/ton
6. System calculates final agreed terms
7. System updates trade seller with agreedPrice and agreedQuantity
8. System advances to inspection phase

**Expected Results**:
- ✅ Offer history tracked correctly (3 rounds)
- ✅ Counter-offer expires original offer window
- ✅ Profit margin recalculated after each round
- ✅ Convergence detected (price gap narrowing)
- ✅ Final terms locked in after acceptance

**Success Criteria**:
- Round 1: Admin offers €330 → Status: PENDING
- Round 2: Seller counters €345 → Status: COUNTERED
- Round 3: Admin counters €338 → Status: COUNTERED
- Round 4: Seller accepts €338 → Status: ACCEPTED
- Final price: €338/ton
- Offer history length: 4
- Price convergence: €345 - €330 = €15 gap → €345 - €338 = €7 gap (narrowing)

---

#### Scenario 5: Inspector Auto-Assignment
**Objective**: Validate automatic inspector assignment based on location/availability

**Actors**:
- 1 Admin
- 1 Buyer
- 3 Sellers (in Sofia, Plovdiv, Varna)
- 5 Inspectors (2 in Sofia, 1 in Plovdiv, 2 in Varna)

**Steps**:
1. Admin creates trade with 3 sellers in different cities
2. All sellers accept offers
3. System auto-creates 3 inspection requests
4. System assigns inspectors based on proximity and availability
5. Sofia seller → Sofia inspector (closest)
6. Plovdiv seller → Plovdiv inspector (only one available)
7. Varna seller → Varna inspector (round-robin if multiple)

**Expected Results**:
- ✅ Inspectors assigned to nearest location
- ✅ Load balancing if multiple inspectors available
- ✅ Priority level set based on trade urgency
- ✅ Inspection status: PENDING → SCHEDULED → IN_PROGRESS → COMPLETED

**Success Criteria**:
- Inspection 1 (Sofia): Assigned to inspector within 50km radius
- Inspection 2 (Plovdiv): Assigned to inspector within 50km radius
- Inspection 3 (Varna): Assigned to inspector within 50km radius
- Priority: HIGH if buyer.neededBy ≤ 3 days, MEDIUM if ≤ 7 days, LOW otherwise
- All inspections created within 1 second of offer acceptance

---

#### Scenario 6: Transport Bidding Competition
**Objective**: Test competitive transport bidding process

**Actors**:
- 1 Admin
- 1 Buyer (Sofia)
- 2 Sellers (Plovdiv, Varna)
- 3 Transporters (different companies)

**Steps**:
1. All sellers verified, trade advances to TRANSPORT_MATCHING
2. System creates transport request with bidding deadline (24 hours)
3. System calculates route: Plovdiv → Varna → Sofia (480 km)
4. Transporter 1 bids €720 (€1.50/km)
5. Transporter 2 bids €650 (€1.35/km)
6. Transporter 3 bids €590 (€1.23/km, but lower capacity)
7. Admin reviews bids and selects Transporter 2 (best value)
8. System creates transport job for Transporter 2
9. System updates bid statuses (2 = ACCEPTED, 1 & 3 = REJECTED)

**Expected Results**:
- ✅ Transport request created with all pickup points
- ✅ Route optimized for minimal distance
- ✅ Bidding window enforced (24 hours)
- ✅ Bids ranked by price, capacity, and rating
- ✅ Selected bid creates transport job
- ✅ Other bids marked as rejected

**Success Criteria**:
- Transport request status: OPEN → BIDDING → EVALUATING → ASSIGNED
- Total bids received: 3
- Selected bid: Transporter 2 (€650)
- Bid evaluation criteria: price (40%), rating (30%), capacity (20%), timeline (10%)
- Transport job created with pickup schedule

---

### 3.2 Edge Case Scenarios

#### Edge Case 1: Zero Quantity Offer
**Test**: Attempt to create offer with quantity = 0
**Expected**: HTTP 400 "Quantity must be positive"

#### Edge Case 2: Negative Price
**Test**: Attempt to create offer with price = -100
**Expected**: HTTP 400 "Price must be positive"

#### Edge Case 3: Insufficient Total Quantity
**Test**: Buyer needs 1000 tons, sellers only offer 800 tons total
**Expected**: Trade operation shows 800/1000 (80% fulfilled), status: PARTIALLY_FULFILLED

#### Edge Case 4: All Sellers Reject
**Test**: 3 sellers invited, all reject offers
**Expected**: Trade operation status → ON_HOLD, suggest replacement sellers

#### Edge Case 5: Inspector Rejects Quality
**Test**: Inspector fails quality check (score < 50)
**Expected**: Trade seller status → FAILED_INSPECTION, offer withdrawn, seller released

#### Edge Case 6: Concurrent Counter-Offers
**Test**: Admin and seller submit counter-offers at same time
**Expected**: Last write wins, conflict detected, one offer supersedes other

#### Edge Case 7: Transport Bid After Deadline
**Test**: Transporter submits bid after 24-hour window
**Expected**: HTTP 400 "Bidding deadline has passed"

#### Edge Case 8: Expired Offer Acceptance Attempt
**Test**: Seller tries to accept offer at T+49 hours
**Expected**: HTTP 400 "Negotiation has expired", offer remains EXPIRED

---

### 3.3 Error Recovery Scenarios

#### Recovery 1: Failed Inspection Service
**Test**: Inspection service unavailable when offer accepted
**Expected**: Log error, continue trade flow, inspection queued for retry

#### Recovery 2: Database Transaction Rollback
**Test**: Database failure during multi-seller offer creation
**Expected**: All offers rolled back, no orphaned records

#### Recovery 3: Network Timeout During Bid Submission
**Test**: Network fails during transporter bid submission
**Expected**: Bid not recorded, transporter can retry

---

## 4. Business Logic Validation Checklists

### 4.1 Commission Calculations

**Test Matrix**:
| Scenario | Seller Price | Quantity | Seller Commission (2.5%) | Buyer Price | Buyer Commission (1.5%) |
|----------|--------------|----------|-------------------------|-------------|------------------------|
| Test 1   | €320         | 100 tons | €800                    | €350        | €525                   |
| Test 2   | €250         | 500 tons | €3,125                  | €280        | €2,100                 |
| Test 3   | €180.50      | 75 tons  | €338.44                 | €200        | €225                   |
| Test 4   | €450         | 25 tons  | €281.25                 | €480        | €180                   |

**Validation Rules**:
```typescript
const sellerCommission = (agreedPrice * quantity * 0.025).toFixed(2);
const buyerCommission = (sellingPrice * quantity * 0.015).toFixed(2);
expect(calculatedSellerCommission).toBe(sellerCommission);
expect(calculatedBuyerCommission).toBe(buyerCommission);
```

### 4.2 Profit Margin Validation

**Test Matrix**:
| Scenario | Revenue | Purchase Cost | Transport | Commissions | Profit | Margin % | Viable? |
|----------|---------|---------------|-----------|-------------|--------|----------|---------|
| Test 1   | €35,000 | €32,000       | €500      | €1,325      | €1,175 | 3.36%    | ❌ No   |
| Test 2   | €35,000 | €30,000       | €500      | €1,275      | €3,225 | 9.21%    | ✅ Yes  |
| Test 3   | €140,000| €127,500      | €2,000    | €5,288      | €5,212 | 3.72%    | ❌ No   |
| Test 4   | €140,000| €120,000      | €1,800    | €5,100      | €13,100| 9.36%    | ✅ Yes  |

**Validation Rules**:
```typescript
const MIN_PROFIT_MARGIN = 5;
const TARGET_PROFIT_MARGIN = 7;

const profit = revenue - purchaseCost - transportCost - sellerCommission - buyerCommission;
const margin = (profit / revenue) * 100;

expect(margin).toBeGreaterThanOrEqual(MIN_PROFIT_MARGIN);
if (margin < TARGET_PROFIT_MARGIN) {
  expect(warning).toContain('Below target margin');
}
```

### 4.3 State Transition Guards

**Valid Transitions**:
```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING
  → TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

**Invalid Transition Tests**:
| From Phase            | Attempted Phase       | Expected Result |
|-----------------------|-----------------------|-----------------|
| INITIATION            | IN_TRANSIT            | ❌ HTTP 400     |
| SELLER_NEGOTIATION    | DELIVERED             | ❌ HTTP 400     |
| INSPECTION_PENDING    | SELLER_NEGOTIATION    | ❌ HTTP 400     |
| COMPLETED             | TRANSPORT_MATCHING    | ❌ HTTP 400     |

---

## 5. Test Execution Framework

### 5.1 Test Environment Setup

**Database Configuration**:
```typescript
// test/setup/test-database.ts
export class TestDatabase {
  async setup() {
    // Use separate test database
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

    // Run migrations
    await execSync('npx prisma migrate deploy');

    // Seed test data
    await this.seedBaseData();
  }

  async cleanup() {
    await this.prisma.$executeRaw`TRUNCATE TABLE ...`;
  }
}
```

**Time Manipulation Utilities**:
```typescript
// test/helpers/time-helper.ts
export class TimeHelper {
  mockNow: Date;

  constructor() {
    this.mockNow = new Date();
  }

  fastForward(hours: number) {
    jest.advanceTimersByTime(hours * 60 * 60 * 1000);
    this.mockNow = new Date(this.mockNow.getTime() + hours * 60 * 60 * 1000);
  }

  reset() {
    jest.useRealTimers();
  }
}
```

### 5.2 Scenario Runner

**Scenario Execution Pattern**:
```typescript
// test/scenarios/scenario-runner.ts
export class ScenarioRunner {
  async executeScenario(scenario: TestScenario) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SCENARIO: ${scenario.name}`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();
    const results = {
      steps: [],
      passed: 0,
      failed: 0,
    };

    for (const step of scenario.steps) {
      try {
        console.log(`STEP ${step.number}: ${step.description}...`);
        await step.execute();
        results.steps.push({ ...step, status: 'PASSED' });
        results.passed++;
        console.log(`✅ PASSED\n`);
      } catch (error) {
        results.steps.push({ ...step, status: 'FAILED', error: error.message });
        results.failed++;
        console.log(`❌ FAILED: ${error.message}\n`);
      }
    }

    const duration = Date.now() - startTime;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed`);
    console.log(`Duration: ${duration}ms`);
    console.log(`${'='.repeat(60)}\n`);

    return results;
  }
}
```

---

## 6. Continuous Integration

### 6.1 CI Pipeline

**Test Stages**:
1. **Unit Tests**: Fast, isolated component tests
2. **Integration Tests**: Database + API tests
3. **Scenario Tests**: Full workflow E2E tests
4. **Performance Tests**: Load and stress tests

**GitHub Actions Workflow**:
```yaml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: agrotrade_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run test:scenarios
```

### 6.2 Test Reporting

**Generate Test Report**:
```bash
npm run test:scenarios -- --json --outputFile=scenario-test-report.json
```

**Report Format**:
```json
{
  "totalScenarios": 6,
  "passed": 5,
  "failed": 1,
  "scenarios": [
    {
      "name": "Simple Direct Trade",
      "status": "PASSED",
      "duration": 2341,
      "steps": 14,
      "stepsPassed": 14,
      "stepsFailed": 0
    },
    {
      "name": "Offer Expiry Validation",
      "status": "FAILED",
      "duration": 1823,
      "steps": 10,
      "stepsPassed": 7,
      "stepsFailed": 3,
      "failures": [
        {
          "step": 8,
          "description": "Attempt to accept expired offer",
          "expected": "HTTP 400",
          "actual": "HTTP 200",
          "error": "Expired offer was accepted"
        }
      ]
    }
  ]
}
```

---

## 7. Quality Gates

### 7.1 Test Coverage Requirements

**Minimum Coverage**:
- Unit Tests: 80% code coverage
- Integration Tests: 70% API endpoint coverage
- Scenario Tests: 100% critical workflow coverage

**Critical Workflow Coverage** (Must be 100%):
- ✅ Trade operation creation
- ✅ Offer negotiation (send, counter, accept, reject)
- ✅ Offer expiry mechanism
- ✅ Commission calculations
- ✅ Profit margin validation
- ✅ Inspection auto-creation
- ✅ Transport request creation
- ✅ Bidding process
- ✅ State transitions

### 7.2 Pre-Release Checklist

Before any production release:
- [ ] All scenario tests passing
- [ ] Commission calculations verified
- [ ] Expiry mechanism tested with time manipulation
- [ ] Multi-seller aggregation validated
- [ ] Edge cases covered
- [ ] Performance benchmarks met (< 200ms API response time)
- [ ] Database migrations tested
- [ ] Rollback procedures verified

---

## 8. Next Steps

### 8.1 Immediate Actions (Week 1)
1. ✅ Complete this testing strategy document
2. Implement Scenario 3 (Offer Expiry Validation) with time manipulation
3. Create commission calculation test suite
4. Build scenario runner framework

### 8.2 Short-Term Goals (Month 1)
1. Implement all 6 standard scenarios
2. Add all edge case tests
3. Achieve 90%+ critical workflow coverage
4. Set up CI/CD pipeline with automated testing

### 8.3 Long-Term Goals (Quarter 1)
1. Add performance testing (load tests)
2. Implement chaos engineering tests
3. Create automated regression test suite
4. Build test data generator for production-like scenarios

---

## 9. Conclusion

This comprehensive testing strategy ensures the Agro-Trade platform functions flawlessly across all critical workflows. By implementing scenario-based testing, business logic validation, and rigorous edge case coverage, we can confidently deploy features knowing they work correctly in production.

**Key Success Metrics**:
- 100% critical workflow coverage
- Zero commission calculation errors
- Zero state transition violations
- < 1% offer expiry bugs
- 99.9% test suite reliability

**Contact**: Scenario Test Lead
**Last Updated**: 2025-11-25
