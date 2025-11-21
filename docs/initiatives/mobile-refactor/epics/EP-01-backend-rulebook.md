# EP-01 – Backend Rulebook & Structure

## Outcome / Definition of Done
- Backend repo mirrors the Page→Section→Feature rigor (domain modules, services, DTOs) documented for mobile.
- Rulebooks exist for NestJS modules, Prisma schema hygiene, testing expectations, and automation hooks.
- `node scripts/atctl.mjs check --auto` enforces the backend rules (lint, tests, doc sync) with zero false positives.
- Handbook + coordination docs reference the new structure.

## Deliverables
- `rules/backend/README.md` + sub-files (structure, modules/services, databases, testing, docs, automation).
- Updated `docs/handbook/projects/backend.md` and `docs/coordination/mobile-migration-plan.md` describing backend alignment.
- Lint scripts + optional `scripts/check-backend-rules.mjs` wired into `atctl`.
- Blueprint: `docs/blueprints/mobile/EP-01-backend-rulebook.md` (to author when work starts).

## Owner(s)
- Primary: @backend
- Support: @devops, @docs

## Dependencies
- None (starting point of the initiative).

## Milestones / Task List
- [x] Audit current backend folder layout vs desired Page→Section→Feature-inspired structure.
- [x] Draft backend rulebook outline (structure/components/services/testing/docs sections).
- [x] Implement lint/check script + integrate with `atctl check`.
- [x] Update handbook + migration plan to reflect backend standards.
- [x] Record findings + verification evidence in blueprint and `status.md`.
- [x] Apply the rulebook across backend modules (resolve violations flagged by the checker and document follow-up work).
- [x] Capture outstanding gaps + create follow-up tickets for modules needing deeper refactors.

## Notes / Links
- Reference frontend rulebook under `rules/frontend/` to stay consistent.
- Capture blockers/tests in `DAILY_LOG.md` and `status.md` as progress occurs.
- Backend lint + rule checks now part of the workflow (`cd backend && npm run lint`, `node scripts/check-backend-rules.mjs`). Remaining warnings are legacy `any` usages to be tackled in follow-on refactors.
