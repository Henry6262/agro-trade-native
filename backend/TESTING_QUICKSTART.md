# Agro-Trade Backend - Testing Quick Start Guide

**Version**: 1.0
**Date**: 2025-11-25
**Audience**: Developers, QA Engineers, Test Leads

---

## 🚀 Quick Start

### Prerequisites

1. **Node.js**: v20+
2. **PostgreSQL**: v15+
3. **Environment**: `.env.test` file configured

### Installation

```bash
cd /Users/henry/agro-trade/backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Set up test database
npx prisma migrate deploy --preview-feature
```

---

## 🧪 Running Tests

### Run All Tests

```bash
# All integration tests
npm run test:e2e

# All tests with coverage
npm run test:e2e:coverage

# Watch mode (re-run on file changes)
npm run test:e2e:watch
```

### Run Specific Test Files

```bash
# Offer expiry validation
npm run test:e2e -- test/scenarios/offer-expiry-validation.e2e-spec.ts

# Commission calculations
npm run test:e2e -- test/scenarios/commission-calculation-validation.e2e-spec.ts

# Happy path workflow
npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts
```

### Run Specific Test Suites

```bash
# Only offer expiry tests
npm run test:e2e -- --testNamePattern="Offer Expiry"

# Only commission tests
npm run test:e2e -- --testNamePattern="Commission"

# Only happy path tests
npm run test:e2e -- --testNamePattern="Happy Path"
```

---

## 📊 Test Suites Overview

### Critical Business Logic Tests

#### 1. Offer Expiry Validation
**File**: `test/scenarios/offer-expiry-validation.e2e-spec.ts`

**What it tests**:
- ✅ 48-hour expiry time setting
- ✅ Countdown tracking over time
- ✅ Expired offer rejection
- ✅ Cron job auto-expiry
- ✅ Edge cases (T+47h59m vs T+48h01s)

**Run it**:
```bash
npm run test:e2e -- offer-expiry-validation.e2e-spec.ts
```

**Expected Output**:
```
========================================
TEST: Expiry Time Setting on Offer Creation
========================================
✅ Trade operation created: op_xxx
✅ All 3 offers sent with 48-hour expiry
✅ All expiry times set correctly (48 hours from now)

PASSED: 8/8 tests
Duration: 2341ms
```

#### 2. Commission Calculation Validation
**File**: `test/scenarios/commission-calculation-validation.e2e-spec.ts`

**What it tests**:
- ✅ 2.5% seller commission
- ✅ 1.5% buyer commission
- ✅ Multi-seller aggregation
- ✅ Weighted average calculations
- ✅ Net profit after commissions
- ✅ Fractional price rounding

**Run it**:
```bash
npm run test:e2e -- commission-calculation-validation.e2e-spec.ts
```

**Expected Output**:
```
========================================
TEST: Standard Trade (100 tons @ €320 → €350)
========================================
✅ Expected Seller Commission: €800.00
✅ Calculated Seller Commission: €800.00
✅ Expected Buyer Commission: €525.00
✅ Calculated Buyer Commission: €525.00

PASSED: 15/15 tests
Duration: 3124ms
```

### Integration Tests

#### 3. Happy Path Trade Operation
**File**: `test/integration/happy-path-trade-operation.e2e-spec.ts`

**What it tests**:
- Full trade workflow (creation → delivery)
- Multi-seller scenarios
- Auto-inspection creation
- Transport request generation

**Run it**:
```bash
npm run test:e2e -- happy-path-trade-operation.e2e-spec.ts
```

#### 4. Negotiations
**File**: `test/integration/negotiations.e2e-spec.ts`

**What it tests**:
- Buyer/seller offer flows
- Counter-offer negotiations
- Profit impact analysis

**Run it**:
```bash
npm run test:e2e -- negotiations.e2e-spec.ts
```

---

## 🔍 Debugging Tests

### Enable Verbose Logging

```bash
# Run with console logs
npm run test:e2e -- --verbose

# Run with debug output
DEBUG=* npm run test:e2e
```

### Inspect Test Failures

```bash
# Run single test in watch mode
npm run test:e2e -- offer-expiry-validation.e2e-spec.ts --watch

# Run with coverage to see uncovered lines
npm run test:e2e:coverage
open coverage/lcov-report/index.html
```

### Common Issues

#### Issue: Database connection failed
```bash
# Solution: Check .env.test has correct DATABASE_URL
cat .env.test

# Reset test database
npx prisma migrate reset --force
```

#### Issue: Tests timing out
```bash
# Solution: Increase Jest timeout
npm run test:e2e -- --testTimeout=30000
```

#### Issue: Port already in use
```bash
# Solution: Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

---

## 📈 Test Coverage Reports

### Generate Coverage Report

```bash
npm run test:e2e:coverage
```

### View Coverage Report

```bash
# Open in browser
open coverage/lcov-report/index.html

# View in terminal
npx nyc report --reporter=text
```

### Coverage Thresholds

Current targets:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

---

## 🛠️ Writing New Tests

### Test File Template

```typescript
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';

describe('My New Test Scenario', () => {
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

  it('should do something', async () => {
    // Arrange
    const scenario = await dataFactory.createFullTradeScenario({
      sellerCount: 1,
      buyerQuantity: 100,
      sellerQuantity: 100,
      sellerPrice: 320,
      buyerPrice: 350,
    });

    // Act
    const response = await apiClient.post('/api/trade-operations', {
      buyListingId: scenario.buyListing.id,
      adminId: scenario.admin.id,
      sellers: [/* ... */],
    }, 201);

    // Assert
    expect(response.body).toHaveProperty('tradeOperationId');
  });
});
```

### Helper Utilities

```typescript
// Time manipulation
jest.useFakeTimers();
jest.setSystemTime(new Date('2025-11-25'));
jest.advanceTimersByTime(48 * 60 * 60 * 1000); // +48 hours

// API client
const response = await apiClient.get('/api/endpoint', 200);
const postResponse = await apiClient.post('/api/endpoint', data, 201);

// Data factory
const scenario = await dataFactory.createFullTradeScenario({
  sellerCount: 3,
  buyerQuantity: 200,
  sellerPrice: 320,
  buyerPrice: 350,
});

// Database cleanup
await dbCleaner.cleanAll();
await dbCleaner.cleanTable('negotiations');
```

---

## 🎯 Test Scenarios Checklist

### Before Every PR

- [ ] All existing tests passing
- [ ] New feature has tests
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] No console errors
- [ ] Coverage ≥ 80%

### Before Production Release

- [ ] All integration tests passing
- [ ] All scenario tests passing
- [ ] Commission calculations verified
- [ ] Expiry mechanism validated
- [ ] Performance benchmarks met
- [ ] No known critical bugs
- [ ] Database migrations tested
- [ ] Rollback procedures validated

---

## 📚 Additional Resources

### Documentation
- [Testing Strategy](/Users/henry/agro-trade/backend/TESTING_STRATEGY.md)
- [Test Coverage Report](/Users/henry/agro-trade/backend/TEST_COVERAGE_REPORT.md)
- [Prisma Schema](/Users/henry/agro-trade/backend/prisma/schema.prisma)

### Test Helpers
- [TestDataFactory](/Users/henry/agro-trade/backend/test/helpers/test-data-factory.ts)
- [DatabaseCleaner](/Users/henry/agro-trade/backend/test/helpers/database-cleaner.ts)
- [ApiClient](/Users/henry/agro-trade/backend/test/helpers/api-client.ts)

### Key Files
- **Negotiation Service**: `/Users/henry/agro-trade/backend/src/negotiations/services/negotiation.service.ts`
- **Expiry Service**: `/Users/henry/agro-trade/backend/src/negotiations/services/negotiation-expiry.service.ts`
- **Trade Operation Service**: `/Users/henry/agro-trade/backend/src/trade-operations/services/trade-operation.service.ts`

---

## 🐛 Troubleshooting

### Test Database Issues

```bash
# Reset test database
npx prisma migrate reset --force --skip-generate

# Re-run migrations
npx prisma migrate deploy

# Check database status
npx prisma migrate status
```

### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate
```

### Performance Issues

```bash
# Run tests in parallel (faster)
npm run test:e2e -- --maxWorkers=4

# Run tests serially (more stable)
npm run test:e2e -- --runInBand
```

---

## 💡 Best Practices

### 1. Test Naming

```typescript
// Good
it('should calculate 2.5% seller commission on €32,000 purchase')

// Bad
it('test commission')
```

### 2. Test Structure

```typescript
// Arrange - set up test data
const scenario = await dataFactory.create...();

// Act - perform action
const response = await apiClient.post(...);

// Assert - verify results
expect(response.body.commission).toBe(800);
```

### 3. Clean Up

```typescript
// Always clean database before each test
beforeEach(async () => {
  await dbCleaner.cleanAll();
});
```

### 4. Assertions

```typescript
// Be specific
expect(commission).toBeCloseTo(800.00, 2); // Good

// Avoid vague assertions
expect(commission).toBeTruthy(); // Bad
```

---

## 🎓 Learning Path

### Beginner
1. Read [Testing Strategy](/Users/henry/agro-trade/backend/TESTING_STRATEGY.md)
2. Run existing tests: `npm run test:e2e`
3. Read test files to understand patterns
4. Write your first test using the template above

### Intermediate
1. Review [Test Coverage Report](/Users/henry/agro-trade/backend/TEST_COVERAGE_REPORT.md)
2. Implement missing edge cases
3. Add error recovery scenarios
4. Optimize test performance

### Advanced
1. Build test data generators
2. Implement load testing
3. Add chaos engineering tests
4. Create custom test utilities

---

## 📞 Support

**Questions?** Contact the Scenario Test Lead

**Found a bug?** Open an issue with:
- Test file name
- Test description
- Expected vs actual behavior
- Full error stack trace

**Need help?** Check:
- [NestJS Testing Docs](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)

---

**Last Updated**: 2025-11-25
**Maintainer**: Scenario Test Lead
**Version**: 1.0
