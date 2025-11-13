# Repository Guidelines

## Project Structure & Module Organization
- `backend/` – NestJS API with Prisma (`src/`), tests (`test/`), docs, and Docker assets. Watch live logs in `backend.log` during dev.
- `admin-dashboard/` – Vite + React admin UI. Core features live under `src/features`, shared services under `src/services`, and UI primitives in `src/components`.
- `docs/`, `coordination/`, and various `*.md` status files capture product context; reference them before large refactors.
- Tests and tooling scripts are colocated with each module (`backend/test`, `admin-dashboard/src/__tests__` when present).

## Build, Test, and Development Commands
```bash
# Backend
cd backend
npm run start:dev      # Nest dev server with hot reload
npm run test           # Unit tests via Jest
npm run test:e2e       # End-to-end/API tests

# Admin dashboard
cd admin-dashboard
npm run dev            # Vite dev server (ports 5173/5175)
npm run build          # Production bundle
npm run test           # Vitest/unit suite when available
```
Ensure Postgres/Redis are running locally (Postgres.app + `brew services start redis` or docker-compose) before starting the backend.

## Coding Style & Naming Conventions
- TypeScript everywhere; keep `strict` types. Prefer async/await and early returns.
- Indent with two spaces in React, two spaces in Nest (match existing files).
- Component files use `PascalCase.tsx`, services `camelCase.ts`, DTOs/interfaces live near their modules.
- Run formatters where provided: `backend` uses `eslint` + `prettier`, `admin-dashboard` uses `eslint` + `tsc`. Avoid mixing tabs/spaces; follow file style.

## Testing Guidelines
- Backend: Jest for unit (`npm run test`) and Supertest-driven e2e (`npm run test:e2e`). Name specs `*.spec.ts` under `test/` or alongside modules.
- Frontend: Vitest/Testing Library (if suite present). Mirror component names with `.test.tsx`.
- Add regression tests for bug fixes touching business logic; mock external services (transport, negotiations) via provided helpers in `backend/test`.

## Commit & Pull Request Guidelines
- Follow conventional, descriptive commits (`fix: handle negotiation reload`, `feat: seller card persistence`). Keep scope focused.
- PRs should include: summary, testing evidence (`npm run test` output), linked issue/Linear ticket, and screenshots/GIFs for UI changes.
- Maintain clean diffs: avoid unrelated formatting churn, ensure lint/tests pass before pushing.

## Security & Configuration Tips
- Never commit `.env` or secrets; use `.env.example` as reference.
- Backend expects `DATABASE_URL`, Redis credentials, and API keys; document overrides in PRs touching infrastructure.
