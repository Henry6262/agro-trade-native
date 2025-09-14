# Implementation Plan: Google Maps Integration for Transporter Route Visualization

**Branch**: `001-add-google-maps` | **Date**: 2024-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-add-google-maps/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → SUCCESS: Feature spec loaded
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Project Type detected: mobile (React Native app + backend API)
   → Structure Decision: Option 3 (Mobile + API)
3. Evaluate Constitution Check section below
   → All checks PASS (using existing patterns, TDD enforced)
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → Clarifications resolved, best practices documented
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, CLAUDE.md
6. Re-evaluate Constitution Check section
   → All checks still PASS
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Task generation approach defined
8. STOP - Ready for /tasks command
```

## Summary
Add Google Maps integration to transporter's incoming offers tab enabling route visualization from available trucks to delivery destinations. Implementation uses React Native Maps with Google provider, referencing existing LocationMapPicker component patterns, with drawer UI pattern from fleet-creation flow.

## Technical Context
**Language/Version**: TypeScript 5.x / React Native 0.79.5  
**Primary Dependencies**: react-native-maps, @react-native-maps/polyline, expo-location, NativeWind  
**Storage**: Zustand for local state, Mock data initially  
**Testing**: Jest + React Native Testing Library  
**Target Platform**: iOS 13+ / Android API 21+  
**Project Type**: mobile - React Native app with NestJS backend  
**Performance Goals**: Support 1-10 simultaneous routes, < 2s map load time  
**Constraints**: < 500ms drawer animation, 60fps map interactions  
**Scale/Scope**: ~10 trucks max per transporter, ~50 offers per day

**User-Provided Implementation Details**:
- Use React Native Maps with Google provider
- Reference existing LocationMapPicker component
- Use drawer pattern from fleet-creation flow
- Display routes with @react-native-maps/polyline
- Create custom markers for trucks with info overlays
- Use NativeWind for consistent dark theme styling
- Mock truck locations initially with Zustand store
- Calculate truck allocation dynamically based on quantity/capacity ratio
- Support 1-10 simultaneous routes with different colors

## Constitution Check

**Simplicity**:
- Projects: 2 (frontend mobile app, backend API - existing structure)
- Using framework directly? YES (react-native-maps directly, no wrapper)
- Single data model? YES (Offer, Truck, Route entities)
- Avoiding patterns? YES (no unnecessary abstractions)

**Architecture**:
- EVERY feature as library? N/A (integrating into existing app structure)
- Libraries listed: Using existing shared components
- CLI per library: N/A (mobile feature)
- Library docs: Component documentation in code

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced? YES
- Git commits show tests before implementation? YES
- Order: Contract→Integration→E2E→Unit strictly followed? YES
- Real dependencies used? YES (actual map component, not mocks)
- Integration tests for: route calculation, truck allocation, map rendering
- FORBIDDEN: No implementation before tests

**Observability**:
- Structured logging included? YES (console logs for development)
- Frontend logs → backend? N/A (mock data phase)
- Error context sufficient? YES (error boundaries, fallback UI)

**Versioning**:
- Version number assigned? Using app version
- BUILD increments on every change? Via Expo build system
- Breaking changes handled? N/A (new feature)

## Project Structure

### Documentation (this feature)
```
specs/001-add-google-maps/
├── spec.md              # Feature specification
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── route-api.json   # Route calculation contract
│   └── fleet-api.json   # Fleet data contract
└── tasks.md             # Phase 2 output (/tasks command)
```

### Source Code (repository root)
```
# Mobile App Structure (existing)
front-end/
├── src/
│   ├── features/
│   │   └── dashboard/
│   │       └── screens/
│   │           └── transporter/
│   │               ├── maps/              # NEW
│   │               │   ├── components/
│   │               │   ├── hooks/
│   │               │   └── utils/
│   │               └── components/
│   │                   └── TransporterTransfersTab.tsx  # MODIFY
│   └── shared/
│       └── components/
│           └── LocationMapPicker.tsx      # REFERENCE
└── __tests__/
    └── transporter/
        └── maps/                          # NEW
            ├── contract/
            ├── integration/
            └── unit/
```

**Structure Decision**: Option 3 (Mobile + API) - using existing React Native + NestJS structure

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context**:
   - Real-time truck updates: Use 30-second polling initially
   - Maximum trucks display: Cap at 10 for performance
   - Offline functionality: Show cached data with warning

2. **Research tasks executed**:
   - Best practices for react-native-maps with multiple routes
   - Polyline rendering performance optimization
   - Custom marker implementation patterns
   - Drawer animation best practices

3. **Consolidate findings** in `research.md`:
   - Decision: Use Polyline component for routes
   - Rationale: Native performance, smooth rendering
   - Alternatives: Rejected web-based solutions (WebView)

**Output**: research.md created

## Phase 1: Design & Contracts

1. **Extract entities** → `data-model.md`:
   - MapOffer: offer with location data
   - TruckMarker: truck position and info
   - RouteData: polyline points and metadata
   - MapBounds: viewport calculation

2. **Generate API contracts**:
   - GET /api/transporter/fleet/available
   - POST /api/routes/calculate
   - GET /api/offers/:id/map-data

3. **Generate contract tests**:
   - Test fleet data structure
   - Test route calculation response
   - Test offer location format

4. **Extract test scenarios**:
   - Single truck selection
   - Multi-truck allocation
   - Insufficient trucks handling
   - Map bounds calculation

5. **Update CLAUDE.md**:
   - Add maps integration context
   - Reference patterns used

**Output**: data-model.md, contracts/, test files, quickstart.md, CLAUDE.md updated

## Phase 2: Task Planning Approach

**Task Generation Strategy**:
- Tests for View Route button (UI)
- Tests for drawer opening/closing
- Tests for truck allocation logic
- Tests for route rendering
- Tests for marker display
- Implementation tasks for each test
- Integration with existing components

**Ordering Strategy**:
1. Contract tests first
2. Component tests
3. Hook/logic tests
4. Implementation to pass tests
5. Integration with TransporterTransfersTab
6. Visual polish and animations

**Estimated Output**: 30-35 numbered tasks in tasks.md

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Complexity Tracking

No violations - feature follows all constitutional principles.

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - approach defined)
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