# Implementation Plan: Trade Operation Management & Negotiation Hub


**Branch**: `004-trade-operation-management` | **Date**: 2025-01-01 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Create a centralized Trade Operation Management interface where admins can view all active trade operations, manage seller negotiations in one place, handle counter-offers, and add new sellers as needed - all without context switching. The system uses request-based updates (no real-time/polling), 48-hour offer expiration, and reuses existing UI patterns like the offer drawer.

## Technical Context
**Language/Version**: TypeScript 4.x (React Native), TypeScript (NestJS backend)  
**Primary Dependencies**: React Native/Expo, NativeWind, NestJS, Prisma ORM, PostgreSQL  
**Storage**: PostgreSQL with Prisma ORM, AsyncStorage for mobile cache  
**Testing**: Jest for backend, React Native Testing Library for frontend  
**Target Platform**: iOS/Android mobile app, NestJS backend API
**Project Type**: mobile - React Native app with NestJS backend API  
**Performance Goals**: <2s page load, smooth 60fps UI animations, <500ms API responses  
**Constraints**: Request-based updates (no WebSocket/polling), 48h offer expiration, mobile-first UI  
**Scale/Scope**: ~100 concurrent trade operations, ~500 active negotiations, 10-50 sellers per operation

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Simplicity**: ✅
- Projects: 2 (backend API, frontend mobile app)
- Using framework directly? Yes - NestJS controllers, React Native components
- Single data model? Yes - Prisma schema shared
- Avoiding patterns? Yes - Direct service calls, no unnecessary abstractions

**Architecture**: ⚠️ (Project doesn't follow library-first principle)
- EVERY feature as library? No - integrating into existing app structure
- Libraries listed: N/A - Feature integrated into existing modules
- CLI per library: N/A - Using existing REST API
- Library docs: Will document in CLAUDE.md for runtime guidance

**Testing (NON-NEGOTIABLE)**: ✅
- RED-GREEN-Refactor cycle enforced? Yes - Tests will be written first
- Git commits show tests before implementation? Yes - Will commit tests first
- Order: Contract→Integration→E2E→Unit strictly followed? Yes
- Real dependencies used? Yes - PostgreSQL test database
- Integration tests for: new endpoints, negotiation flow, offer expiry
- FORBIDDEN: Will not implement before tests

**Observability**: ✅
- Structured logging included? Yes - NestJS Logger, console.log for debugging
- Frontend logs → backend? Error reporting via API calls
- Error context sufficient? Yes - User context, trade ID, negotiation state

**Versioning**: ✅
- Version number assigned? Feature version 1.0.0
- BUILD increments on every change? Following existing app versioning
- Breaking changes handled? No breaking changes - additive feature

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: [DEFAULT to Option 1 unless Technical Context indicates web/mobile app]

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/bash/update-agent-context.sh claude` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
1. Backend Foundation (Tasks 1-10)
   - Prisma schema updates for Negotiation entity
   - Database migration
   - DTOs for negotiations
   - Contract tests for each API endpoint

2. Backend Services (Tasks 11-20)
   - Extend TradeOperationService with negotiation methods
   - Create NegotiationService for offer/counter-offer logic
   - Add expiration handling cron job
   - Integration tests for negotiation flows

3. Frontend Screens (Tasks 21-30)
   - ActiveOperationsScreen with FlatList
   - NegotiationsScreen with detail view
   - CounterOfferModal component
   - NegotiationListItem component
   - Navigation integration

4. Integration & Polish (Tasks 31-35)
   - Connect frontend to backend APIs
   - Add loading states and error handling
   - Performance optimization (virtual lists)
   - E2E test for complete flow
   - Update seed data with test scenarios

**Ordering Strategy**:
- TDD: Contract tests → Integration tests → Implementation → Unit tests
- Dependencies: Schema → Services → Controllers → Frontend
- Parallel markers [P] for independent components

**Estimated Output**: 35 numbered, ordered tasks in tasks.md

**Test Coverage Requirements**:
- Contract tests: 100% of new endpoints
- Integration tests: All negotiation state transitions
- Component tests: New UI components
- E2E test: Complete negotiation flow from quickstart

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Not library-first | Integrating into existing monolithic app | Creating separate library would require major refactoring of existing codebase |
| No CLI per feature | Using existing REST API patterns | CLI would duplicate API functionality without added value |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with architecture deviation documented)
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (library-first not applicable)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*