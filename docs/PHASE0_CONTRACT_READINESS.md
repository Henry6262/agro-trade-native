# Phase 0 – Contract Readiness Plan

## Objectives
1. Produce a single source OpenAPI contract that mirrors all public REST endpoints the mobile app, admin dashboard, and planned Orchestrator Admin will consume.
2. Prevent further front/back divergence by adding automated contract verification to CI and a lightweight manual test kit (Postman collection).
3. Align auth/token handling across clients so every request uses the same header and storage conventions.

## Deliverables
- `openapi/agro-trade.yaml` / `.json` generated from the current NestJS controllers with accurate DTO schemas and response envelopes.
- Postman collection auto-generated from the OpenAPI file (`docs/postman/agro-trade.postman_collection.json`).
- Schemathesis (or Dredd) smoke script wired into CI (`npm run contract:test`) that fails when responses drift from the spec.
- Documentation update describing the versioning policy and the "breaking changes" gate in contributing guidelines.
- Task list for legacy clients to migrate to unified token handling.

## Work Breakdown

### 1. Catalog Endpoints
- [x] Enumerate controllers + routes (trade-operations, negotiations, transport, inspection, buyer, seller, auth, pricing, onboarding).
- [ ] Note existing DTO→Prisma mismatches (e.g., transport cost response shape, trade operation PATCH gap).
- [x] Map transport controller outputs to DTOs (common endpoints now return mapped DTOs/wrappers).
- [ ] Record optional vs required fields per endpoint based on service expectations.

### 2. Generate OpenAPI Baseline
- [x] Add Nest `SwaggerModule` bootstrap in `backend/src/main.ts` with environment guard.
- [x] Create script `npm run openapi:export` that emits JSON/YAML into `openapi/` (currently JSON; YAML conversion pending).
- [ ] Generate Postman collection (`docs/postman/agro-trade.postman_collection.json`) from latest OpenAPI.
- [ ] Manually review key schemas: `TradeOperationResponseDto`, `ProfitCalculationResponseDto`, `TransportEstimationResponseDto`, negotiation payloads.
- [ ] Flag missing routes (e.g., bulk negotiation placeholder) for Phase 1 implementation.

### 3. Contract Test Harness
- [x] Install Dredd and add `dredd.yml` + hooks (`dredd-hooks.js`) for auth bootstrap.
- [x] Add npm script `npm run contract:test` (runs Dredd against exported OpenAPI).
- [ ] Provide seed + auth bootstrap so contract tests can obtain JWT and exercise secured routes (currently expects `admin@agrotrade.test` / `admin123`; add seed script or environment variable override).
- [ ] CI: new GitHub workflow `contract.yml` running `npm run contract:test` after unit tests.
- [ ] Define initial subset of endpoints for contract smoke (exclude `/test/*`, `/scenarios/*` until stabilised).

### 4. Token Handling Alignment
- [x] Define canonical header: `Authorization: Bearer <JWT>`.
- [x] Mobile (`front-end/src/services/transportService.ts`, `front-end/src/services/buyerService.ts`) – switch from `authToken` AsyncStorage to pulling `useAuthStore` token (with persisted fallback).
- [x] Admin dashboard – ensure Axios instance sends the same header; remove localStorage token fallback.
- [ ] Document token storage in `/docs/AUTH_GUIDE.md` (new section).

### 5. Communication & Governance
- [ ] Update `CONTRIBUTING.md` with "contracts must be regenerated when API changes" checklist.
- [ ] Publish a short guide for running Postman collection and contract tests locally.
- [ ] Schedule weekly contract review (15 min) with backend + front-end leads until Phase 2 stabilizes.

## Risks & Mitigations
- **Incomplete DTO metadata**: Some controllers lack Swagger decorators. *Mitigation*: add `@ApiProperty` annotations during cataloging; defer low-risk fields to Phase 1 backlog if needed.
- **Auth friction in contract tests**: Ensure seed script creates a test admin and returns credentials programmatically (avoid manual login).
- **Spec drift**: Enforce CI gate and add `npm run openapi:validate` (Spectral) to pre-commit.

## Next Actions (Day 0)
1. Inventory controller routes and populate the checklist above.
2. Draft PR scaffold adding Swagger bootstrap + export script.
3. Open Phase 1 issues referencing concrete bugs (seller scoring, profit transport relation, status flow, PATCH endpoint, transport DTO).


## Controller Inventory (initial scan)
- seller/seller.controller.ts
- negotiations/controllers/negotiation.controller.ts
- trade-operations/controllers/trade-operation.controller.ts
- trade-operations/controllers/profit.controller.ts
- trade-operations/controllers/scenario.controller.ts (for test utilities)
- trade-operations/controllers/test.controller.ts (dev/test helpers)
- transport/controllers/transport.controller.ts
- transport/controllers/transport-bidding.controller.ts
- transport/controllers/transport-main.controller.ts
- transport-company/transport-company.controller.ts
- buyer/buyer.controller.ts
- inspections/inspection.controller.ts
- modules/inspector/inspector.controller.ts
- pricing/pricing.controller.ts
- products/products.controller.ts
- notifications/notification.controller.ts
- onboarding/onboarding.controller.ts
- auth/auth.controller.ts

Next: annotate each with exposed routes + Auth requirements before exporting OpenAPI.
See `docs/OPENAPI_CONTROLLER_AUDIT.md` for per-controller notes and TODOs.

### Known blockers
- Resolved: `npm run openapi:export` now produces `backend/openapi/agro-trade.json`. Keep monitoring for future type errors as DTOs evolve.
- [ ] Document workflow: `npm run openapi:export` → `npm run contract:test` (fails fast if auth seed missing).
