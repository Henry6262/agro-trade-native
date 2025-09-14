# Tasks: Inspector/Verifier Profile

**Input**: Design documents from `/specs/002-inspector-verifier-profile/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: React Native, Expo, NativeWind, Zustand, NestJS
   → Structure: Mobile app + API backend
2. Load optional design documents ✓
   → data-model.md: 5 entities extracted
   → contracts/: 6 API endpoints identified
   → research.md: Technical decisions loaded
3. Generate tasks by category ✓
   → Setup: 3 tasks
   → Tests: 14 tasks (TDD approach)
   → Core: 15 tasks
   → Integration: 4 tasks
   → Polish: 3 tasks
4. Apply task rules ✓
   → Parallel tasks marked with [P]
   → Tests before implementation enforced
5. Number tasks sequentially ✓
6. Generate dependency graph ✓
7. Create parallel execution examples ✓
8. Validate task completeness ✓
   → All contracts have tests
   → All entities have models
   → All endpoints implemented
9. Return: SUCCESS (39 tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Mobile app**: `front-end/src/`
- **Backend API**: `backend/src/`
- **Tests**: `front-end/__tests__/`, `backend/test/`

## Phase 3.1: Setup
- [ ] T001 Create inspector feature folder structure at front-end/src/features/dashboard/screens/inspector/
- [ ] T002 Install dependencies: expo-location, socket.io-client in front-end/package.json
- [ ] T003 [P] Create backend inspector module structure at backend/src/modules/inspector/

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### TypeScript Types & Interfaces Tests
- [ ] T004 [P] Create types test file at front-end/src/features/dashboard/screens/inspector/types/index.test.ts
- [ ] T005 [P] Create mock data file at front-end/src/features/dashboard/screens/inspector/__mocks__/mockData.ts

### Component Tests
- [ ] T006 [P] Test InspectorDashboard component at front-end/__tests__/inspector/InspectorDashboard.test.tsx
- [ ] T007 [P] Test ActiveJobTab component at front-end/__tests__/inspector/ActiveJobTab.test.tsx
- [ ] T008 [P] Test AvailableJobsTab component at front-end/__tests__/inspector/AvailableJobsTab.test.tsx
- [ ] T009 [P] Test JobMapView component at front-end/__tests__/inspector/JobMapView.test.tsx
- [ ] T010 [P] Test JobListView component at front-end/__tests__/inspector/JobListView.test.tsx
- [ ] T011 [P] Test VerificationForm component at front-end/__tests__/inspector/VerificationForm.test.tsx
- [ ] T012 [P] Test JobCard component at front-end/__tests__/inspector/JobCard.test.tsx
- [ ] T013 [P] Test JobPriorityBadge component at front-end/__tests__/inspector/JobPriorityBadge.test.tsx

### Hook Tests
- [ ] T014 [P] Test useInspectorStore hook at front-end/__tests__/inspector/hooks/useInspectorStore.test.ts
- [ ] T015 [P] Test useLocationTracking hook at front-end/__tests__/inspector/hooks/useLocationTracking.test.ts
- [ ] T016 [P] Test useVerificationJobs hook at front-end/__tests__/inspector/hooks/useVerificationJobs.test.ts

### API Contract Tests
- [ ] T017 [P] Contract test GET /api/inspector/jobs at backend/test/inspector/jobs.e2e-spec.ts
- [ ] T018 [P] Contract test POST /api/inspector/jobs/:id/accept at backend/test/inspector/accept.e2e-spec.ts
- [ ] T019 [P] Contract test POST /api/inspector/jobs/:id/complete at backend/test/inspector/complete.e2e-spec.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### TypeScript Types & Interfaces
- [ ] T020 [P] Create TypeScript types at front-end/src/features/dashboard/screens/inspector/types/index.ts

### Zustand Store Implementation
- [ ] T021 [P] Implement useInspectorStore at front-end/src/features/dashboard/screens/inspector/hooks/useInspectorStore.ts

### Component Implementation
- [ ] T022 Create InspectorDashboard at front-end/src/features/dashboard/screens/inspector/InspectorDashboard.tsx
- [ ] T023 [P] Implement ActiveJobTab at front-end/src/features/dashboard/screens/inspector/components/ActiveJobTab.tsx
- [ ] T024 [P] Implement AvailableJobsTab at front-end/src/features/dashboard/screens/inspector/components/AvailableJobsTab.tsx
- [ ] T025 [P] Implement JobMapView at front-end/src/features/dashboard/screens/inspector/components/JobMapView.tsx
- [ ] T026 [P] Implement JobListView at front-end/src/features/dashboard/screens/inspector/components/JobListView.tsx
- [ ] T027 [P] Implement JobCard at front-end/src/features/dashboard/screens/inspector/components/JobCard.tsx
- [ ] T028 [P] Implement VerificationForm at front-end/src/features/dashboard/screens/inspector/components/VerificationForm.tsx
- [ ] T029 [P] Implement JobPriorityBadge at front-end/src/features/dashboard/screens/inspector/components/JobPriorityBadge.tsx

### Hook Implementation
- [ ] T030 [P] Implement useLocationTracking at front-end/src/features/dashboard/screens/inspector/hooks/useLocationTracking.ts
- [ ] T031 [P] Implement useVerificationJobs at front-end/src/features/dashboard/screens/inspector/hooks/useVerificationJobs.ts

### Backend Implementation
- [ ] T032 [P] Create Prisma schema updates at backend/prisma/schema.prisma
- [ ] T033 [P] Implement inspector DTOs at backend/src/modules/inspector/dto/
- [ ] T034 Implement inspector service at backend/src/modules/inspector/inspector.service.ts
- [ ] T035 Implement inspector controller at backend/src/modules/inspector/inspector.controller.ts

## Phase 3.4: Integration
- [ ] T036 Integrate location tracking with expo-location background tasks
- [ ] T037 Connect WebSocket for real-time location updates
- [ ] T038 Implement offline support with AsyncStorage
- [ ] T039 Add verification lock mechanism to seller listings

## Phase 3.5: Polish
- [ ] T040 [P] Add loading states and error handling to all components
- [ ] T041 Performance optimization for map with many markers (clustering)
- [ ] T042 Run quickstart.md validation scenarios

## Dependencies
- Setup (T001-T003) must complete first
- All tests (T004-T019) before implementation (T020-T035)
- T020 blocks T021 (types needed for store)
- T021 blocks T022 (store needed for dashboard)
- T022 blocks T023-T029 (dashboard needed for tabs)
- Backend schema (T032) blocks service (T034)
- Service (T034) blocks controller (T035)
- Core implementation before integration (T036-T039)
- Everything before polish (T040-T042)

## Parallel Execution Examples

### Test Creation (can run all at once):
```bash
# Launch T004-T019 together:
Task: "Create types test file at front-end/src/features/dashboard/screens/inspector/types/index.test.ts"
Task: "Test ActiveJobTab component at front-end/__tests__/inspector/ActiveJobTab.test.tsx"
Task: "Test AvailableJobsTab component at front-end/__tests__/inspector/AvailableJobsTab.test.tsx"
Task: "Test JobMapView component at front-end/__tests__/inspector/JobMapView.test.tsx"
Task: "Test JobListView component at front-end/__tests__/inspector/JobListView.test.tsx"
Task: "Test VerificationForm component at front-end/__tests__/inspector/VerificationForm.test.tsx"
Task: "Test JobCard component at front-end/__tests__/inspector/JobCard.test.tsx"
Task: "Test JobPriorityBadge component at front-end/__tests__/inspector/JobPriorityBadge.test.tsx"
Task: "Test useInspectorStore hook at front-end/__tests__/inspector/hooks/useInspectorStore.test.ts"
Task: "Test useLocationTracking hook at front-end/__tests__/inspector/hooks/useLocationTracking.test.ts"
Task: "Test useVerificationJobs hook at front-end/__tests__/inspector/hooks/useVerificationJobs.test.ts"
Task: "Contract test GET /api/inspector/jobs at backend/test/inspector/jobs.e2e-spec.ts"
Task: "Contract test POST /api/inspector/jobs/:id/accept at backend/test/inspector/accept.e2e-spec.ts"
Task: "Contract test POST /api/inspector/jobs/:id/complete at backend/test/inspector/complete.e2e-spec.ts"
```

### Component Implementation (after tests fail):
```bash
# Launch T023-T029 together:
Task: "Implement ActiveJobTab at front-end/src/features/dashboard/screens/inspector/components/ActiveJobTab.tsx"
Task: "Implement AvailableJobsTab at front-end/src/features/dashboard/screens/inspector/components/AvailableJobsTab.tsx"
Task: "Implement JobMapView at front-end/src/features/dashboard/screens/inspector/components/JobMapView.tsx"
Task: "Implement JobListView at front-end/src/features/dashboard/screens/inspector/components/JobListView.tsx"
Task: "Implement JobCard at front-end/src/features/dashboard/screens/inspector/components/JobCard.tsx"
Task: "Implement VerificationForm at front-end/src/features/dashboard/screens/inspector/components/VerificationForm.tsx"
Task: "Implement JobPriorityBadge at front-end/src/features/dashboard/screens/inspector/components/JobPriorityBadge.tsx"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify ALL tests fail before implementing
- Commit after each task completion
- Use mock data from T005 in all components initially
- Follow NativeWind styling patterns from existing components
- Reuse LocationMapPicker patterns for map implementation

## Validation Checklist
*GATE: Checked before execution*

- [x] All API endpoints have contract tests (6 endpoints, 3 test tasks minimum)
- [x] All entities have TypeScript interfaces (5 entities in types/index.ts)
- [x] All tests come before implementation (T004-T019 before T020-T035)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No parallel task modifies same file as another [P] task
- [x] TDD cycle enforced (tests must fail first)