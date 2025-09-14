# Implementation Plan: Inspector/Verifier Profile

**Branch**: `002-inspector-verifier-profile` | **Date**: 2025-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-inspector-verifier-profile/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path ✓
2. Fill Technical Context ✓
   → Project Type: Mobile (React Native + API)
   → Structure Decision: Option 3 (Mobile + API)
3. Evaluate Constitution Check ✓
   → All principles followed
   → Progress Tracking: Initial Constitution Check PASS
4. Execute Phase 0 → research.md ✓
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md ✓
6. Re-evaluate Constitution Check ✓
   → No new violations
   → Progress Tracking: Post-Design Constitution Check PASS
7. Plan Phase 2 → Task generation approach documented ✓
8. STOP - Ready for /tasks command
```

## Summary
Implementation of Inspector/Verifier profile for crop quality verification with real-time location tracking. Inspectors receive verification jobs, travel to seller locations, test crop specifications, and submit results while being tracked. Administrators monitor inspector locations and job progress on a map interface.

## Technical Context
**Language/Version**: TypeScript 4.9 / React Native 0.72  
**Primary Dependencies**: React Native, Expo SDK 49, react-native-maps, expo-location, NativeWind, Zustand  
**Storage**: AsyncStorage (local), PostgreSQL (backend via API)  
**Testing**: Jest, React Native Testing Library  
**Target Platform**: iOS 13+ / Android 10+  
**Project Type**: mobile - React Native mobile app with NestJS API backend  
**Performance Goals**: 60fps UI, location updates every 10s, <500ms screen transitions  
**Constraints**: Offline capability for active job, battery-efficient location tracking  
**Scale/Scope**: 50-100 inspectors, 500-1000 verification jobs/month

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**:
- Projects: 2 (mobile app, api backend)
- Using framework directly? Yes (React Native + NestJS)
- Single data model? Yes (shared types between mobile/api)
- Avoiding patterns? Yes (direct Zustand stores, no complex abstractions)

**Architecture**:
- Mobile-first design enforced
- Reusing existing components (LocationMapPicker, drawer patterns)
- Following established patterns from transporter/seller features

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? Yes
- Test-first approach for new components
- Integration tests for location tracking and map features
- Mock data first, real API second

**Observability**:
- Console logging for development
- Error tracking via Expo error reporting
- Location update logs for debugging

**Versioning**:
- Following existing app versioning
- Feature flag for inspector profile during rollout

## Project Structure

### Documentation (this feature)
```
specs/002-inspector-verifier-profile/
├── spec.md              # Feature specification
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Mobile App Structure
front-end/
├── src/
│   ├── features/
│   │   └── dashboard/
│   │       └── screens/
│   │           └── inspector/
│   │               ├── InspectorDashboard.tsx
│   │               ├── components/
│   │               │   ├── ActiveJobTab.tsx
│   │               │   ├── AvailableJobsTab.tsx
│   │               │   ├── JobMapView.tsx
│   │               │   ├── JobListView.tsx
│   │               │   ├── JobCard.tsx
│   │               │   ├── VerificationForm.tsx
│   │               │   └── JobPriorityBadge.tsx
│   │               ├── hooks/
│   │               │   ├── useInspectorStore.ts
│   │               │   ├── useLocationTracking.ts
│   │               │   └── useVerificationJobs.ts
│   │               └── types/
│   │                   └── index.ts
│   └── shared/
│       └── components/
│           └── [existing components to reuse]

# Backend API Structure  
backend/
├── src/
│   ├── modules/
│   │   └── inspector/
│   │       ├── inspector.module.ts
│   │       ├── inspector.controller.ts
│   │       ├── inspector.service.ts
│   │       ├── dto/
│   │       └── entities/
│   └── prisma/
│       └── schema.prisma (updates)
```

**Structure Decision**: Option 3 (Mobile + API) - React Native app with NestJS backend

## Phase 0: Outline & Research

### Research Tasks Completed:
1. **React Native Maps Integration**: Confirmed react-native-maps supports custom markers, polylines, and real-time updates
2. **Location Tracking Best Practices**: Background location tracking via expo-location with battery optimization
3. **Real-time Updates**: WebSocket implementation for admin monitoring via Socket.io
4. **Offline Capability**: AsyncStorage for active job caching, sync on reconnect
5. **Existing Patterns Review**: Analyzed LocationMapPicker, drawer implementations, and Zustand stores

### Key Decisions:
- **Location Updates**: Use expo-location with background task for continuous tracking
- **Map Markers**: Custom markers with priority colors (white/yellow/red backgrounds)
- **State Management**: Zustand store for inspector state (active job, location, available jobs)
- **Real-time**: WebSocket connection for location broadcasting to admin dashboard
- **Navigation**: Tab-based UI matching existing transporter pattern

**Output**: [research.md](./research.md) with all technical decisions documented

## Phase 1: Design & Contracts

### Data Model
Created comprehensive data model including:
- **VerificationJob**: Job assignments with priority, status, location
- **InspectorProfile**: User profile extension for inspectors
- **LocationUpdate**: Real-time position tracking data
- **VerificationResult**: Test results and evidence
- **JobPriority**: Enum for LOW, MEDIUM, HIGH priorities

### API Contracts
Generated REST API endpoints:
- `GET /api/inspector/jobs` - List available verification jobs
- `GET /api/inspector/jobs/:id` - Get specific job details
- `POST /api/inspector/jobs/:id/accept` - Accept a verification job
- `POST /api/inspector/jobs/:id/complete` - Submit verification results
- `POST /api/inspector/location` - Update inspector location
- `WebSocket /inspector-tracking` - Real-time location broadcasting

### Contract Tests
Test files generated for each endpoint with request/response validation

### Integration Scenarios
Extracted from user stories:
- Inspector accepts and completes job flow
- Administrator real-time monitoring scenario
- Seller listing lock after verification

**Output**: 
- [data-model.md](./data-model.md)
- [contracts/](./contracts/) with OpenAPI specs
- [quickstart.md](./quickstart.md) 
- Updated CLAUDE.md with inspector feature context

## Phase 2: Task Planning Approach

**Task Generation Strategy**:
- Generate ~30 tasks following TDD approach
- Contract tests first (6 tasks)
- Data model and types (4 tasks)
- UI component tests (8 tasks)
- Implementation tasks (10 tasks)
- Integration and validation (2 tasks)

**Ordering Strategy**:
1. TypeScript types and interfaces [P]
2. Contract tests for all endpoints [P]
3. Zustand store setup with tests
4. Component tests (Active Job, Available Jobs, Map)
5. Component implementations
6. Location tracking hook with tests
7. WebSocket integration
8. End-to-end testing

**Estimated Output**: 28-32 numbered tasks in tasks.md

## Complexity Tracking
*No violations - all constitutional principles followed*

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach documented)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none)

---
*Based on Agro-Trade Constitution v1.0.0 - See `/CONSTITUTION.md`*