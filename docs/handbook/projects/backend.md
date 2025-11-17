# Backend Project Guide

**Last Updated**: 2025-11-13  
**Service**: `backend/` (NestJS + Prisma)  
**Contacts**: Backend chapter / API owners

---

## Overview
- Handles trade operations, negotiations, inspections, and transport bidding.
- Tech stack: NestJS, Prisma ORM, PostgreSQL, Redis, Bull queues (where applicable).
- External boundaries: Admin dashboard (REST), Mobile app (REST), Background jobs (Bull/cron).
- **Rulebook**: Read `rules/backend/README.md` (and linked files) before planning backend work. `node scripts/atctl.mjs check --auto` now runs `scripts/check-backend-rules.mjs` to enforce module structure + Prisma presence.

---

## Directory Structure
```
backend/
├── src/
│   ├── app.module.ts           # Root Nest module
│   ├── buyer/                  # Buyer endpoints + services
│   ├── seller/                 # Seller endpoints + services
│   ├── trade-operations/       # Trade lifecycle
│   ├── negotiations/           # Offers, expiry jobs
│   ├── inspections/            # Inspection scheduling + completion
│   ├── transport/              # Logistics & bidding
│   └── common/                 # Shared utils, guards, interceptors
├── prisma/
│   ├── schema.prisma           # Database schema (single source of truth)
│   └── migrations/             # Generated migrations
├── test/                       # Jest unit tests (Nest testing module)
├── tests/                      # Legacy / e2e suites (Supertest)
├── scripts/                    # Seeders & maintenance scripts
├── openapi/                    # Generated specs + controller audits
└── static/                     # JSON fixtures / docs assets
```

_Auto inventory_: `docs/handbook/generated/backend-modules.md` lists the current `src/` folders, and `docs/handbook/generated/backend-services.md` enumerates every `*.service.ts` file (refresh via `node scripts/atctl.mjs docs --sync` after structural changes).

---

## Commands
```bash
cd backend
npm run start:dev      # Hot reload Nest dev server
npm run test           # Unit suite
npm run test:e2e       # E2E/API tests (Supertest)
npm run lint           # ESLint + formatting
```

Prerequisites: `DATABASE_URL` (Postgres), Redis service, Prisma migrations applied (`npx prisma migrate deploy`).

---

## Architecture Notes
- **Modules**: Each domain has its own module exposing controller + service + DTOs. Cross-domain dependencies should go through dedicated service methods or shared providers in `src/common/`.
- **Negotiation expiry**: `negotiations/services/negotiation-expiry.service.ts` (new) coordinates TTL logic; ensure cron jobs registered in module.
- **Transport**: `transport/services/transport-bidding.service.ts` handles bids + statuses; controller endpoints used by admin UI modals.
- **Inspections**: DTOs live in `inspections/dto/`; controllers coordinate with trade operations to lock states.

---

## Data & Contracts
- Prisma schema is canonical; update ERD snapshots in `docs/reference/db-schema.md` whenever schema changes.
- REST surface documented through `openapi/` artifacts; when adding endpoints, update `docs/OPENAPI_CONTROLLER_AUDIT.md`.
- Seed data / fixtures should reside in `scripts/` or `tests/fixtures/` to keep scenarios reproducible.

---

## Testing Expectations

### Unit Tests
- Every service method altering business state must have unit coverage (`*.spec.ts`).
- Run: `npm run test`
- Coverage target: >80% for services and controllers

### Integration/E2E Tests
API contracts and end-to-end workflows validated via integration tests:

**Run All Integration Tests:**
```bash
npm run test:e2e
```

**Run Specific Suite:**
```bash
npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts
```

**Test Helpers Available:**
- `TestDataFactory` – create test users, listings, scenarios
- `DatabaseCleaner` – clean DB between tests respecting FK constraints
- `ApiClient` – simplified HTTP requests with auth

**Example Test Structure:**
```typescript
describe('My Feature', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;

  beforeAll(async () => {
    // Setup test module
  });

  beforeEach(async () => {
    await dbCleaner.cleanAll(); // Clean DB before each test
  });

  it('should complete workflow', async () => {
    const scenario = await dataFactory.createFullTradeScenario();
    const response = await apiClient.post('/api/trade-operations', data);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Best Practices
- Clean database between tests using `dbCleaner.cleanAll()` in `beforeEach`
- Use `TestDataFactory` methods—never create data manually
- Test actual API endpoints (don't mock)
- Validate business logic (commissions, expiry, etc.)
- Check database state after mutations
- Add null checks for TypeScript strict mode
- Increase timeout for slow tests: `it('test', async () => { ... }, 60000);`

### Prerequisites
- PostgreSQL running
- Test database configured in `.env.test`:
  ```env
  DATABASE_URL="postgresql://user:password@localhost:5432/agro_trade_test"
  JWT_SECRET="test-secret"
  ```
- Prisma client generated: `npm run prisma:generate`

Comprehensive testing guides archived in:
- `docs/archive/backend/2025-11/TESTING_GUIDE.md`
- `docs/archive/backend/2025-11/INTEGRATION_TESTING_README.md`

---

## Integration Touchpoints
- **Admin Dashboard**: uses `/transport/*`, `/trade-operations/*`, `/inspections/*`.
- **Mobile App**: limited subset (offers, notifications).
- **Background Jobs**: Bull + cron definitions (ensure global queue config documented in future `atctl docs --sync` outputs).

---

## Maintenance
- Run `npm run format` / `npm run lint` before commits.
- Document module-level changes in this file plus relevant feature specs.
- Keep environment overrides in `.env.example`; never commit secrets.
