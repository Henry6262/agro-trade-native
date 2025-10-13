# Agro-Trade Integration Testing Guide

## Overview

This guide provides comprehensive instructions for running and maintaining integration tests for the Agro-Trade platform. These tests validate the entire system from API contracts to end-to-end workflows.

## Table of Contents

- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Test Suites](#test-suites)
- [Writing New Tests](#writing-new-tests)
- [Test Helpers](#test-helpers)
- [Debugging Failed Tests](#debugging-failed-tests)
- [CI/CD Integration](#cicd-integration)
- [Known Issues](#known-issues)

---

## Test Infrastructure

### Directory Structure

```
backend/
├── test/
│   ├── helpers/
│   │   ├── test-data-factory.ts      # Helper to create test data
│   │   ├── database-cleaner.ts       # Database cleanup utilities
│   │   └── api-client.ts             # HTTP request wrapper
│   ├── integration/
│   │   ├── happy-path-trade-operation.e2e-spec.ts
│   │   ├── partial-fulfillment.e2e-spec.ts (pending)
│   │   ├── offer-expiry.e2e-spec.ts (pending)
│   │   ├── transport-multi-bid.e2e-spec.ts (pending)
│   │   ├── distance-accuracy.e2e-spec.ts (pending)
│   │   ├── cascading-verification.e2e-spec.ts (pending)
│   │   ├── api-contract-validation.e2e-spec.ts (pending)
│   │   └── performance.e2e-spec.ts (pending)
│   └── setup/
│       ├── test-environment.ts       # Test environment setup
│       └── jest.setup.ts             # Jest configuration
├── jest.e2e.config.js                # E2E test configuration
└── TEST_REPORT.json                  # Latest test results
```

### Test Configuration

**jest.e2e.config.js:**
- Test timeout: 30 seconds per test
- Runs in band (sequential) to avoid database conflicts
- Collects coverage from all source files
- Uses TypeScript via ts-jest

---

## Running Tests

### Prerequisites

1. PostgreSQL database running
2. Environment variables set (`.env.test` file):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/agro_trade_test"
   JWT_SECRET="test-secret"
   ```
3. Dependencies installed: `npm install`
4. Prisma client generated: `npm run prisma:generate`

### Run All Integration Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts
```

### Run Tests in Watch Mode

```bash
npm run test:e2e:watch
```

### Run Tests with Coverage

```bash
npm run test:e2e:coverage
```

### Debug Tests

```bash
npm run test:debug -- test/integration/happy-path-trade-operation.e2e-spec.ts
```

Then open `chrome://inspect` in Chrome and attach to the process.

---

## Test Suites

### 1. Happy Path Trade Operation

**File:** `test/integration/happy-path-trade-operation.e2e-spec.ts`

**Status:** ✅ IMPLEMENTED

**Duration:** ~3.8s

**Purpose:** Tests complete workflow from trade operation creation to transport assignment

**Steps:**
1. Admin creates trade operation with sellers
2. System sends offers to sellers (48-hour expiry)
3. Sellers accept offers
4. System auto-creates inspection requests for unverified sellers
5. Inspector completes inspections
6. System updates verification status
7. System advances phase to TRANSPORT_MATCHING
8. System auto-creates transport request
9. Transporter submits bid
10. Admin accepts bid
11. System creates transport job
12. System advances phase to IN_TRANSIT

**Run:**
```bash
npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts
```

### 2. Partial Fulfillment

**File:** `test/integration/partial-fulfillment.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Tests scenario where only some sellers accept offers

**Priority:** P1

### 3. Offer Expiry

**File:** `test/integration/offer-expiry.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Tests 48-hour offer expiration mechanism

**Priority:** P0 (BLOCKER - expiry not auto-triggering)

### 4. Multi-Bid Transport

**File:** `test/integration/transport-multi-bid.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Tests transport request with multiple partial bids

**Priority:** P1

### 5. Distance Accuracy

**File:** `test/integration/distance-accuracy.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Validates Haversine formula calculations

**Priority:** P2

### 6. Cascading Verification

**File:** `test/integration/cascading-verification.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Tests inspection completion triggers phase advancement

**Priority:** P1

### 7. API Contract Validation

**File:** `test/integration/api-contract-validation.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Validates all API endpoints match contracts

**Priority:** P1

### 8. Performance Testing

**File:** `test/integration/performance.e2e-spec.ts`

**Status:** 🚧 PENDING IMPLEMENTATION

**Purpose:** Load testing and performance validation

**Priority:** P2

---

## Writing New Tests

### Test Template

```typescript
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';

describe('My Test Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    dataFactory = new TestDataFactory(prisma);
    dbCleaner = new DatabaseCleaner(prisma);
    apiClient = new ApiClient(app);
  });

  afterAll(async () => {
    await dbCleaner.cleanAll();
    await app.close();
  });

  beforeEach(async () => {
    await dbCleaner.cleanAll();
  });

  it('should test something', async () => {
    // Arrange
    const scenario = await dataFactory.createFullTradeScenario();

    // Act
    const response = await apiClient.post('/api/trade-operations', {
      buyListingId: scenario.buyListing.id,
      // ... other fields
    });

    // Assert
    expect(response.body).toHaveProperty('tradeOperationId');
  });
});
```

### Best Practices

1. **Clean Database Between Tests:** Use `dbCleaner.cleanAll()` in `beforeEach`
2. **Use Test Data Factory:** Never create data manually - use `dataFactory` methods
3. **Use ApiClient:** Don't use `supertest` directly - use `apiClient` wrapper
4. **Test Database Integrity:** Always verify data persisted correctly
5. **Test Cascading Effects:** Verify side effects (inspections auto-created, phase changes, etc.)
6. **Use Descriptive Names:** Test names should clearly describe what they test
7. **Add Console Logging:** Use `console.log` for step-by-step visibility
8. **Handle Null Checks:** TypeScript strict mode requires null checks

---

## Test Helpers

### TestDataFactory

**Purpose:** Create test data consistently

**Methods:**
- `createTestUser(options)` - Create user with role
- `createTestBuyer()` - Create buyer user
- `createTestSeller()` - Create seller user
- `createTestTransporter()` - Create transporter user
- `createTestInspector()` - Create inspector user
- `createTestAdmin()` - Create admin user
- `createTestAddress(userId, options)` - Create address with coordinates
- `createTestProduct(options)` - Create or fetch product
- `createTestBuyListing(buyerId, data)` - Create buy listing
- `createTestSaleListing(sellerId, data)` - Create sale listing
- `createTestTruck(ownerId, options)` - Create truck
- `createTestTransportCompany(options)` - Create transport company
- `createTransportCostSettings()` - Create transport settings
- `createFullTradeScenario(options)` - Create complete scenario with all actors

**Example:**
```typescript
const scenario = await dataFactory.createFullTradeScenario({
  sellerCount: 3,
  buyerQuantity: 100,
  sellerQuantity: 40,
  withAddresses: true,
  withVerifiedSellers: [false, false, true],
});

// Scenario contains: admin, buyer, sellers, product, listings, transporter, inspector, etc.
```

### DatabaseCleaner

**Purpose:** Clean database between tests respecting foreign key constraints

**Methods:**
- `cleanAll()` - Delete all test data in correct order
- `cleanTradeOperations()` - Delete only trade operation data
- `cleanMarketplace()` - Delete only marketplace listings
- `cleanTransport()` - Delete only transport data
- `cleanInspections()` - Delete only inspection data
- `cleanNegotiations()` - Delete only negotiation data
- `verifyClean()` - Verify database is clean
- `cleanTradeOperationById(id)` - Delete specific trade operation

**Example:**
```typescript
// Clean everything
await dbCleaner.cleanAll();

// Clean only negotiations
await dbCleaner.cleanNegotiations();

// Verify clean
const { isClean, remainingRecords } = await dbCleaner.verifyClean();
if (!isClean) {
  console.error('Database not clean:', remainingRecords);
}
```

### ApiClient

**Purpose:** Simplified HTTP requests with authentication

**Methods:**
- `setAuthToken(token)` - Set Bearer token for subsequent requests
- `clearAuthToken()` - Remove authentication
- `get(path, expectedStatus)` - GET request
- `post(path, body, expectedStatus)` - POST request
- `put(path, body, expectedStatus)` - PUT request
- `patch(path, body, expectedStatus)` - PATCH request
- `delete(path, expectedStatus)` - DELETE request
- `expectError(method, path, body, expectedStatus)` - Test error cases
- `batch(requests)` - Execute multiple requests in parallel
- `waitFor(condition, options)` - Poll until condition is true
- `measureResponseTime(method, path, body)` - Measure request duration

**Example:**
```typescript
// Simple request
const response = await apiClient.post('/api/trade-operations', {
  buyListingId: 'listing-123',
});

// With authentication
apiClient.setAuthToken('admin-token');
const response = await apiClient.post('/api/trade-operations', data);

// Batch requests
const [res1, res2] = await apiClient.batch([
  { method: 'get', path: '/api/trade-operations' },
  { method: 'get', path: '/api/inspections' },
]);

// Measure performance
const { response, duration } = await apiClient.measureResponseTime('post', '/api/trade-operations', data);
console.log(`Request took ${duration}ms`);
```

---

## Debugging Failed Tests

### Common Issues

#### 1. TypeScript Null Check Errors

**Error:**
```
TS18047: 'tradeOp' is possibly 'null'
```

**Fix:**
```typescript
// Add null check
const tradeOp = await prisma.tradeOperation.findUnique({ where: { id } });
expect(tradeOp).not.toBeNull();
if (!tradeOp) throw new Error('Trade operation not found');

// Now TypeScript knows it's not null
expect(tradeOp.phase).toBe('SELLER_NEGOTIATION');
```

#### 2. Database Foreign Key Violations

**Error:**
```
Foreign key constraint failed on the field: `tradeOperationId`
```

**Cause:** Trying to delete parent record before children

**Fix:** Use `dbCleaner.cleanAll()` which respects FK order

#### 3. Test Timeout

**Error:**
```
Timeout - Async callback was not invoked within the 30000ms timeout
```

**Fix:**
```typescript
// Increase timeout for this test
it('should complete slow operation', async () => {
  // test code
}, 60000); // 60 second timeout
```

#### 4. Port Already in Use

**Error:**
```
EADDRINUSE: address already in use :::3000
```

**Fix:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port in test environment
```

### Debug Logging

Enable detailed logging:

```typescript
// In test file
beforeEach(() => {
  console.log('\n========== TEST START ==========');
});

afterEach(() => {
  console.log('========== TEST END ==========\n');
});

// In test
console.log('Step 1: Creating trade operation...');
const response = await apiClient.post('/api/trade-operations', data);
console.log('✅ Trade operation created:', response.body.tradeOperationId);
```

### Database Inspection

During debugging, inspect database directly:

```bash
# Connect to test database
psql postgresql://user:password@localhost:5432/agro_trade_test

# Query trade operations
SELECT * FROM trade_operations WHERE id = 'trade-op-id';

# Check foreign keys
SELECT * FROM trade_sellers WHERE trade_operation_id = 'trade-op-id';
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: agro_trade_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Generate Prisma Client
        run: |
          cd backend
          npx prisma generate

      - name: Run migrations
        run: |
          cd backend
          npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/agro_trade_test

      - name: Run integration tests
        run: |
          cd backend
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/agro_trade_test
          JWT_SECRET: test-secret

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: backend/TEST_REPORT.json
```

### Pre-Commit Hook

Install Husky for pre-commit testing:

```bash
npm install -D husky

# Setup
npx husky init
```

`.husky/pre-commit`:
```bash
#!/bin/sh
cd backend
npm run test:e2e
```

---

## Known Issues

### P0 Blockers (Blocks Release)

#### BLOCKER-001: Offer Expiry Not Auto-Triggering

**Issue:** Offers don't automatically expire after 48 hours

**Impact:** Sellers can accept/counter expired offers

**Workaround:** Manually check expiry in accept/counter endpoints

**Fix Required:** Implement @Cron job in NegotiationService

**Estimated Fix Time:** 2 hours

#### BLOCKER-002: Race Condition in Bid Acceptance

**Issue:** Multiple bids can be accepted simultaneously for same transport request

**Impact:** Multiple transport jobs created for one request

**Workaround:** None - avoid concurrent bid acceptance

**Fix Required:** Wrap acceptBid() in Prisma transaction with SELECT FOR UPDATE

**Estimated Fix Time:** 3 hours

#### BLOCKER-003: Expired Offers Can Be Accepted

**Issue:** System doesn't validate expiry when accepting offers

**Impact:** Business logic violation, incorrect state

**Workaround:** Check expiresAt manually in frontend

**Fix Required:** Add expiry validation in acceptOffer()

**Estimated Fix Time:** 1 hour

### P1 Issues (Should Fix)

#### ISSUE-004: Counter-Offer Returns 500 for Expired Offers

**Issue:** Unhandled exception when countering expired offer

**Impact:** Poor user experience, unclear error

**Fix Required:** Add try-catch with proper BadRequestException

**Estimated Fix Time:** 1 hour

#### ISSUE-005: Missing Composite Index

**Issue:** TransportBid missing (transportRequestId, status) index

**Impact:** Slow queries with large datasets

**Fix Required:** Add @@index([transportRequestId, status])

**Estimated Fix Time:** 30 minutes

---

## Test Report

The latest test results are stored in `TEST_REPORT.json`. This JSON file contains:

- Overall test status (PASS/PARTIAL_PASS/FAIL)
- Detailed results for each test suite
- Performance metrics
- Identified blockers with reproduction steps
- Recommendations for fixes

**View Report:**
```bash
cat backend/TEST_REPORT.json | jq .
```

**Key Sections:**
- `overallStatus`: Current system health
- `blockers`: Critical issues blocking release
- `canCompleteDay`: Can current sprint be completed
- `canDeploy`: Can code be deployed to production
- `recommendations`: Suggested improvements
- `nextSteps`: Prioritized action items

---

## Support

### Questions?

1. Check this guide first
2. Review `TEST_REPORT.json` for current status
3. Check test helper documentation in source files
4. Contact QA team lead

### Contributing

When adding new tests:
1. Follow existing test structure
2. Use test helpers (don't create data manually)
3. Add comprehensive logging
4. Update this guide
5. Update `TEST_REPORT.json` template if adding new test suites

---

## Version History

- **v2.0** (2025-10-11): Comprehensive integration testing framework
- **v1.0** (2025-10-09): Initial testing infrastructure

---

**Last Updated:** 2025-10-11
**Author:** Integration Test Lead (Claude Code)
