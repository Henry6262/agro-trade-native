# Tasks: Trade Operation Management & Negotiation Hub

**Input**: Design documents from `/specs/004-trade-operation-management/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✓ Found: TypeScript/NestJS backend, React Native frontend
   → ✓ Extract: Prisma ORM, Jest testing, NativeWind styling
2. Load optional design documents:
   → ✓ data-model.md: Negotiation entity, state transitions
   → ✓ contracts/: 6 API endpoints found
   → ✓ research.md: Request-based updates, 48h expiration
3. Generate tasks by category:
   → Setup: Prisma schema, migrations
   → Tests: 6 contract tests, 5 integration tests
   → Core: 2 services, 6 controllers, 4 components
   → Integration: Cron job, navigation
   → Polish: Performance, error handling
4. Apply task rules:
   → Different files marked [P]
   → Tests before implementation (TDD)
5. Number tasks: T001-T040
6. Dependencies validated
7. Parallel execution examples included
8. Return: SUCCESS (40 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `front-end/src/`, `front-end/__tests__/`
- **Database**: `backend/prisma/`

## Phase 3.1: Database Setup
- [ ] T001 Add Negotiation model to backend/prisma/schema.prisma with status enum
- [ ] T002 Create migration for Negotiation table with indexes
- [ ] T003 Add seed data for test negotiations in backend/prisma/seed.ts

## Phase 3.2: Backend Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests
- [ ] T004 [P] Contract test GET /api/trade-operations in backend/tests/contract/trade-operations-list.spec.ts
- [ ] T005 [P] Contract test GET /api/trade-operations/{id}/negotiations in backend/tests/contract/trade-negotiations.spec.ts
- [ ] T006 [P] Contract test POST /api/trade-operations/{id}/add-sellers in backend/tests/contract/add-sellers.spec.ts
- [ ] T007 [P] Contract test POST /api/negotiations/{id}/counter-offer in backend/tests/contract/counter-offer.spec.ts
- [ ] T008 [P] Contract test POST /api/negotiations/{id}/accept in backend/tests/contract/accept-offer.spec.ts
- [ ] T009 [P] Contract test POST /api/negotiations/{id}/reject in backend/tests/contract/reject-offer.spec.ts

### Integration Tests
- [ ] T010 [P] Integration test negotiation state transitions in backend/tests/integration/negotiation-flow.spec.ts
- [ ] T011 [P] Integration test 48h offer expiration in backend/tests/integration/offer-expiration.spec.ts
- [ ] T012 [P] Integration test quantity validation in backend/tests/integration/quantity-validation.spec.ts
- [ ] T013 [P] Integration test counter-offer flow in backend/tests/integration/counter-offer-flow.spec.ts
- [ ] T014 [P] Integration test progress calculation in backend/tests/integration/progress-calculation.spec.ts

## Phase 3.3: Backend Core Implementation (ONLY after tests are failing)

### DTOs and Types
- [ ] T015 [P] Create NegotiationDto types in backend/src/negotiations/dto/negotiation.dto.ts
- [ ] T016 [P] Update TradeOperationDto with negotiation fields in backend/src/trade-operations/dto/trade-operation-response.dto.ts

### Services
- [ ] T017 Create NegotiationService in backend/src/negotiations/services/negotiation.service.ts
- [ ] T018 Extend TradeOperationService with negotiation methods in backend/src/trade-operations/services/trade-operation.service.ts
- [ ] T019 Create offer expiration cron job in backend/src/negotiations/services/expiration.cron.ts

### Controllers
- [ ] T020 Update TradeOperationController list method in backend/src/trade-operations/controllers/trade-operation.controller.ts
- [ ] T021 Add getNegotiations method to TradeOperationController
- [ ] T022 Add addSellers method to TradeOperationController
- [ ] T023 Create NegotiationController in backend/src/negotiations/controllers/negotiation.controller.ts
- [ ] T024 Add counter-offer, accept, reject methods to NegotiationController

### Module Registration
- [ ] T025 Register NegotiationModule in backend/src/app.module.ts

## Phase 3.4: Frontend Tests First
**CRITICAL: Component tests before implementation**
- [ ] T026 [P] Component test ActiveOperationsScreen in front-end/__tests__/screens/ActiveOperationsScreen.test.tsx
- [ ] T027 [P] Component test NegotiationsScreen in front-end/__tests__/screens/NegotiationsScreen.test.tsx
- [ ] T028 [P] Component test NegotiationListItem in front-end/__tests__/components/NegotiationListItem.test.tsx
- [ ] T029 [P] Component test CounterOfferModal in front-end/__tests__/components/CounterOfferModal.test.tsx

## Phase 3.5: Frontend Implementation

### Screens
- [ ] T030 Create ActiveOperationsScreen in front-end/src/features/dashboard/screens/admin/ActiveOperationsScreen.tsx
- [ ] T031 Create NegotiationsScreen in front-end/src/features/dashboard/screens/admin/NegotiationsScreen.tsx

### Components
- [ ] T032 [P] Create NegotiationListItem component in front-end/src/features/dashboard/screens/admin/components/NegotiationListItem.tsx
- [ ] T033 [P] Create CounterOfferModal in front-end/src/features/dashboard/screens/admin/components/CounterOfferModal.tsx
- [ ] T034 [P] Create PotentialSellersList in front-end/src/features/dashboard/screens/admin/components/PotentialSellersList.tsx

### Navigation & Integration
- [ ] T035 Add Active Operations tab to admin navigation in front-end/src/features/dashboard/screens/admin/AdminDashboard.tsx
- [ ] T036 Add navigation routes for new screens in front-end/src/navigation/AdminNavigator.tsx

### Services
- [ ] T037 [P] Create negotiationService API client in front-end/src/services/negotiationService.ts
- [ ] T038 [P] Add React Query hooks for negotiations in front-end/src/hooks/useNegotiations.ts

## Phase 3.6: Polish & Performance
- [ ] T039 Add virtual scrolling to NegotiationsScreen for 50+ items
- [ ] T040 E2E test complete flow from quickstart.md

## Dependencies
- Database setup (T001-T003) must complete first
- Backend tests (T004-T014) before backend implementation (T015-T025)
- Frontend tests (T026-T029) before frontend implementation (T030-T038)
- T017 (NegotiationService) blocks T023-T024 (NegotiationController)
- T030-T031 (screens) before T035-T036 (navigation)
- All implementation before polish (T039-T040)

## Parallel Execution Examples

### Backend Contract Tests (can run together):
```bash
# Launch T004-T009 in parallel:
Task: "Contract test GET /api/trade-operations in backend/tests/contract/trade-operations-list.spec.ts"
Task: "Contract test GET /api/trade-operations/{id}/negotiations in backend/tests/contract/trade-negotiations.spec.ts"
Task: "Contract test POST /api/trade-operations/{id}/add-sellers in backend/tests/contract/add-sellers.spec.ts"
Task: "Contract test POST /api/negotiations/{id}/counter-offer in backend/tests/contract/counter-offer.spec.ts"
Task: "Contract test POST /api/negotiations/{id}/accept in backend/tests/contract/accept-offer.spec.ts"
Task: "Contract test POST /api/negotiations/{id}/reject in backend/tests/contract/reject-offer.spec.ts"
```

### Backend Integration Tests (can run together):
```bash
# Launch T010-T014 in parallel:
Task: "Integration test negotiation state transitions in backend/tests/integration/negotiation-flow.spec.ts"
Task: "Integration test 48h offer expiration in backend/tests/integration/offer-expiration.spec.ts"
Task: "Integration test quantity validation in backend/tests/integration/quantity-validation.spec.ts"
Task: "Integration test counter-offer flow in backend/tests/integration/counter-offer-flow.spec.ts"
Task: "Integration test progress calculation in backend/tests/integration/progress-calculation.spec.ts"
```

### Frontend Components (can run together):
```bash
# Launch T032-T034 in parallel:
Task: "Create NegotiationListItem component in front-end/src/features/dashboard/screens/admin/components/NegotiationListItem.tsx"
Task: "Create CounterOfferModal in front-end/src/features/dashboard/screens/admin/components/CounterOfferModal.tsx"
Task: "Create PotentialSellersList in front-end/src/features/dashboard/screens/admin/components/PotentialSellersList.tsx"
```

## Notes
- Tests MUST fail before implementation per TDD
- Commit after each task completion
- Use existing patterns: OfferModal, drawer UI
- Request-based updates only (no WebSocket/polling)
- 48-hour expiration handled by cron job
- Reuse existing Zustand stores and React Query

## Validation Checklist
*GATE: All must pass before execution*

- [x] All 6 API endpoints have contract tests
- [x] Negotiation entity has model and migration tasks
- [x] All tests come before implementation (TDD enforced)
- [x] Parallel tasks operate on different files
- [x] Each task specifies exact file path
- [x] No parallel tasks modify same file
- [x] Integration tests cover all user stories from quickstart
- [x] Performance optimization included (T039)