# Integration Testing Guide

## Overview

This guide provides comprehensive instructions for running integration tests for the Agro-Trade platform, specifically focusing on admin dashboard features and end-to-end workflows.

## Test Coverage

The integration test suite covers the following features:

### 1. Scenario Orchestrator
- Complete trade workflow simulation from creation to completion
- Counter-offer negotiation flows
- 48-hour offer expiry enforcement
- Phase transitions and state management

### 2. Trade Operations Management
- CRUD operations for trade operations
- Listing all operations with pagination
- Fetching single operation with full details
- Phase and status updates

### 3. Map-based Matching Dashboard
- Transport cost calculation between buyer and sellers
- Region and city data retrieval
- Multi-seller trade operation creation
- Offer sending and tracking

### 4. Inspector Portal
- Listing pending inspections with filters
- Inspection status filtering
- Completing inspections with quality data
- Quality score and grade submission

### 5. Transport Management
- Listing transport requests
- Creating and submitting bids
- Accepting transport bids
- Rejecting transport bids
- Transport job creation

### 6. Trade Flow Visualization
- Full trade state retrieval for visualization
- Phase transition tracking
- Real-time state updates

### 7. Database State Panel
- User browsing by role
- Test data cleanup functionality

### 8. Progress Dashboard & Metrics
- Trade operation metrics tracking
- Performance monitoring

## Prerequisites

Before running tests, ensure:

1. **PostgreSQL Database** is running
2. **Backend server** is running on `http://localhost:4001`
3. **Test database** is properly configured
4. **Environment variables** are set (see `.env.test` example below)

### .env.test Example

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agrotrade_test"
JWT_SECRET="test-jwt-secret-key"
NODE_ENV=test
PORT=4001
```

## Running Tests

### Option 1: Run All Integration Tests (Recommended)

```bash
cd backend
./scripts/run-integration-tests.sh
```

This script will:
1. Check if the backend is running (start it if not)
2. Run all integration tests
3. Generate coverage report
4. Generate `TEST_REPORT.json` with detailed results
5. Display summary

### Option 2: Run Tests via npm

```bash
cd backend

# Run all e2e tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --testPathPattern="admin-dashboard-features"

# Run with coverage
npm run test:e2e -- --coverage
```

### Option 3: Run Individual Test Files

```bash
# Run admin dashboard tests
npm run test:e2e -- test/integration/admin-dashboard-features.e2e-spec.ts

# Run happy path tests
npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- test/integration/admin-dashboard-features.e2e-spec.ts --verbose
```

## Test Structure

```
backend/
├── test/
│   ├── integration/
│   │   ├── admin-dashboard-features.e2e-spec.ts  # Comprehensive admin dashboard tests
│   │   └── happy-path-trade-operation.e2e-spec.ts # Complete workflow test
│   ├── helpers/
│   │   ├── test-data-factory.ts      # Test data creation utilities
│   │   ├── database-cleaner.ts       # Database cleanup utilities
│   │   └── api-client.ts             # HTTP request wrapper
│   └── setup/
│       └── jest.setup.ts             # Jest configuration
├── scripts/
│   ├── run-integration-tests.sh      # Test runner script
│   └── generate-test-report.js       # Report generation script
└── TEST_REPORT.json                  # Generated test report
```

## Test Report Format

After running tests, a `TEST_REPORT.json` file is generated with the following structure:

```json
{
  "timestamp": "2025-10-12T...",
  "overallStatus": "PASS | PARTIAL_PASS | FAIL",
  "testSuites": {
    "contractValidation": {
      "status": "PASS | FAIL",
      "details": { ... }
    },
    "endToEndFlows": {
      "status": "PASS | FAIL",
      "tests": { ... }
    },
    "crossPlatform": { ... },
    "performance": { ... },
    "dataIntegrity": { ... }
  },
  "blockers": [
    {
      "id": "TEST-FAIL-001",
      "priority": "P0 | P1 | P2",
      "testSuite": "...",
      "test": "...",
      "issue": "...",
      "assignedTo": "..."
    }
  ],
  "canCompleteDay": true | false,
  "canDeploy": true | false,
  "recommendations": [ ... ],
  "summary": {
    "totalTests": 50,
    "passed": 48,
    "failed": 2,
    "skipped": 0,
    "duration": "45s"
  }
}
```

## Understanding Test Results

### Overall Status
- **PASS**: All tests passed, no blockers
- **PARTIAL_PASS**: Minor failures, no P0 blockers
- **FAIL**: P0 blockers exist, critical functionality broken

### Blocker Priorities
- **P0**: Blocks release, breaks core functionality, data corruption risk
- **P1**: Should fix before release, degrades user experience
- **P2**: Nice to have, minor issues, edge cases

### Sprint Gating
- `canCompleteDay: false` - P0 blockers exist, sprint blocked
- `canDeploy: false` - Cannot deploy to production

## Troubleshooting

### Tests Failing to Connect to Backend

```bash
# Check if backend is running
curl http://localhost:4001/api/health

# Start backend manually
npm run start:dev
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres -l

# Reset test database
npm run prisma:migrate:dev

# Re-generate Prisma client
npm run prisma:generate
```

### Timeout Errors

If tests timeout, increase Jest timeout in `jest.e2e.config.js`:

```javascript
module.exports = {
  // ...
  testTimeout: 60000, // Increase to 60 seconds
};
```

### Clean Test Data Between Runs

```bash
# Use the database cleaner API
curl -X DELETE http://localhost:4001/api/simulation/admin/cleanup-test-data
```

## Performance Benchmarks

Tests validate the following performance criteria:

- **API Response Time**: < 500ms for standard requests
- **Mobile App Load**: < 2 seconds
- **Database Queries**: Properly indexed, no N+1 queries
- **Memory Leaks**: None detected during extended runs

## Continuous Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
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

      - name: Run migrations
        run: |
          cd backend
          npm run prisma:migrate:dev

      - name: Start backend
        run: |
          cd backend
          npm run start:dev &
          sleep 10

      - name: Run integration tests
        run: |
          cd backend
          npm run test:e2e

      - name: Upload test report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: backend/TEST_REPORT.json
```

## Writing New Tests

### Example Test Structure

```typescript
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';

describe('My Feature Tests', () => {
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

  it('should test my feature', async () => {
    // Create test data
    const testUser = await dataFactory.createTestUser({
      role: 'BUYER',
      email: 'test@example.com',
    });

    // Make API call
    const response = await apiClient.post('/api/my-endpoint', {
      userId: testUser.id,
      data: { ... },
    }, 201);

    // Assert results
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('SUCCESS');
  });
});
```

## Best Practices

1. **Clean Database Between Tests**: Always clean test data in `beforeEach`
2. **Use Test Data Factory**: Don't create data manually, use `TestDataFactory`
3. **Test Real API Endpoints**: Don't mock - test actual HTTP calls
4. **Validate Business Logic**: Test commission calculations, expiry dates, etc.
5. **Check Database State**: Verify data persists correctly after API calls
6. **Test Error Cases**: Don't just test happy paths
7. **Use Descriptive Test Names**: Make it clear what's being tested
8. **Keep Tests Independent**: Tests should not depend on each other

## Test Maintenance

- Run tests before committing code
- Update tests when API contracts change
- Add new tests for new features
- Remove obsolete tests promptly
- Keep test data factories up to date

## Support

For issues or questions:
1. Check `TEST_REPORT.json` for detailed error information
2. Review Jest output for stack traces
3. Check backend logs for API errors
4. Verify database state using Prisma Studio: `npm run prisma:studio`

## Related Documentation

- [Backend Testing Guide](./TESTING_GUIDE.md)
- [API Documentation](./docs/api/)
- [Prisma Schema](./prisma/schema.prisma)
- [Integration Status](../INTEGRATION_STATUS.json)
