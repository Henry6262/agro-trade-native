# Testing & Verification Rules

## Test Types
- **Unit tests (`npm run test`)**: cover every service, guard, pipe, and provider with non-trivial logic. Mirror file paths inside `test/` (e.g., `test/buyer/buyer.service.spec.ts`).
- **E2E tests (`npm run test:e2e`)**: use Nest testing module + Supertest to validate API contracts per domain. Files live under `tests/`.
- **Automation tests**: background jobs and schedulers require unit tests or integration tests verifying queue processing.

## General Expectations
- No “dummy” tests. Each suite asserts real behavior/state transitions.
- Reset the database between tests via `DatabaseCleaner` helpers; never rely on test ordering.
- Use `TestDataFactory` to seed scenarios instead of manual Prisma calls.
- Mock external adapters (HTTP clients, queues) with providers registered via Nest testing module configuration.
- Keep spec files ≤300 lines by extracting setup helpers.

## Tooling
- Run `npm run lint` + `npm run test` before committing backend changes.
- Epic/stories must include test evidence (command output) in PRs and `docs/coordination/implementation-status.md`.
- When adding new modules/endpoints, extend the OpenAPI audit (`docs/OPENAPI_CONTROLLER_AUDIT.md`) and rerun `node scripts/atctl.mjs docs --sync` so generated references stay current.
