# Blueprint: EP-01 Backend Rulebook & Structure

**Owner**: @backend
**Last Updated**: 2025-11-17
**Dependencies**: None

## Goal
Bring the backend codebase under the same disciplined, rule-driven workflow as the mobile refactor so future API work (EP-02/EP-03) starts from a predictable foundation.

## Scope
- Author and enforce a backend rulebook covering structure, modules/services, data/DTOs, testing, automation, and documentation hygiene.
- Wire the new enforcement script (`scripts/check-backend-rules.mjs`) into `node scripts/atctl.mjs check --auto`.
- Update handbook + migration docs so every contributor knows where rules live.
- Inventory remaining module gaps to feed subsequent refactors.

## Non-Goals
- Rewriting individual modules yet (tracked in follow-up tasks once violations are listed).
- Changing deployment/runtime infrastructure.

## Implementation Plan
1. **Audit & Inventory**
   - Walk `backend/src` and compare with desired module layout.
   - Note helper/shared directories to exclude from enforcement.
2. **Rulebook Authoring**
   - Create `rules/backend/*` mirroring the frontend rulebook sections.
   - Document process expectations (lint/tests/docs updates).
3. **Automation**
   - Build `scripts/check-backend-rules.mjs` to verify modules expose controllers/services/DTOs + Prisma schema presence.
   - Update `scripts/atctl.mjs` to run backend + frontend rule checks automatically.
4. **Docs & Communication**
   - Update `docs/handbook/projects/backend.md` and `docs/coordination/mobile-migration-plan.md`.
   - Log progress in initiative status + daily log; share next actions with EP-02 owner.
5. **Enforcement Rollout (Next)**
   - Run the checker, document violations, and schedule fixes per module.
   - Keep progress visible in `status.md` and Implementation Status tracker.

## Acceptance Criteria
- Rulebook + automation exist, live in repo, and are referenced by AGENTS + handbook.
- `node scripts/check-backend-rules.mjs` passes locally and via `atctl check` once modules comply.
- Initiative status reflects progress with % complete + blockers.
- Follow-up tickets exist for remaining module refactors (if the checker reports issues).

## Risks / Mitigations
- **False positives** from the checker → keep skip list minimal and adjust as modules evolve.
- **Rule drift** if backend structure changes → require updates to `rules/backend/*` in the same PR as structural edits.

## Verification Plan
- Run `node scripts/check-backend-rules.mjs` + `cd backend && npm run lint && npm run test`.
- Attach command output to Implementation Status + PR description.
- Review doc diffs to ensure handbook/migration references new rules.
