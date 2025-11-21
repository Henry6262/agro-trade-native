# Backend Rulebook (NestJS + Prisma)

**Scope**: `backend/` directory (NestJS services, Prisma schema, background jobs)

## Required Reading
Before planning or coding anything in the backend, review each file below so the work matches the enforced structure:

1. `structure.md` – Directory layout, module boundaries, naming conventions.
2. `modules-and-services.md` – Controller/service responsibilities, provider patterns, dependency rules.
3. `data-and-dto.md` – Prisma schema hygiene, DTO versioning, validation, and API contracts.
4. `testing.md` – Required unit/e2e coverage, fixtures, and Jest configuration expectations.
5. `automation.md` – Background job (Bull/cron/Puppeteer) structure, logging, and observability.
6. `docs.md` – Documentation, blueprint, and coordination updates required for backend changes.

## Checklist Before Implementation
- [ ] Session helper + handbook + runbooks reviewed (per `AGENTS.md`).
- [ ] This README and all linked files read during the current session.
- [ ] Planned changes mapped to an epic/story (blueprint created/updated).
- [ ] Impacted docs/runbooks noted upfront (handbook, implementation status, initiative files).
- [ ] Relevant lint/test commands identified (`npm run lint`, `npm run test`, `npm run test:e2e`).
- [ ] `scripts/check-backend-rules.mjs` run locally (or via `node scripts/atctl.mjs check --auto`).

If any rule is unclear, update this rulebook first so future contributors inherit the fix.
