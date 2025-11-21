# Agro-Trade Handbook

**Last Updated**: 2025-11-13  
**Maintainers**: Core Engineering Team  
**Related**: `AGENTS.md`, `docs/standards/code-quality.md`, `docs/runbooks/session-start.md`

---

## 1. Mission & Product Snapshot
- **Product**: Digitize the agri-trade supply chain (matching, trade ops, inspections, transport, settlement).
- **Users**: Trading desk operators, inspectors, logistics coordinators, marketplace admins.
- **Systems**:
  - `backend/` NestJS API with Prisma + Postgres/Redis.
  - `admin-dashboard/` React/Vite console for operations.
  - `front-end/` React Native customer app (Expo).
  - `docs/`, `contracts/`, `coordination/` for process + automation.

---

## 2. Session Checklist (run every time)
1. `AGENTS.md` ➜ confirms expectations & links.
2. `node scripts/atctl.mjs session` ➜ branch, status, service prerequisites, hot links (agent runs this automatically at session start).
3. Before committing/pushing, run `node scripts/atctl.mjs check --auto` to execute lint/test/doc commands matched to touched projects.
4. Review outstanding docs flagged by `atctl`.
5. Start core services (Postgres, Redis, backend dev server, Vite) as needed.
6. Update working notes (runbooks, feature specs) before coding.
7. When backend/admin/mobile structure or Prisma schema changes, run `node scripts/atctl.mjs docs --sync` to refresh generated references.
8. Ensure git pre-push hook is installed via `bash scripts/hooks/install.sh` so `core.hooksPath` points to `scripts/hooks/git` and automation stays enforced (agent responsibility; ask user to run if sandbox blocks it).
→ Detailed flow lives in `docs/runbooks/session-start.md`.

---

## 3. Project Map

| Project | Location | Purpose | Deep Dive |
|---------|----------|---------|-----------|
| Backend API | `backend/` | Trade, transport, inspections, negotiations | `docs/handbook/projects/backend.md` |
| Admin Dashboard | `admin-dashboard/` | Internal control tower UI | `docs/handbook/projects/admin-dashboard.md` |
| Mobile App | `front-end/` | External/customer-facing companion | `docs/handbook/projects/mobile.md` |
| Abu Dhabi Prototype | `abu-dhabi/` | Legacy FE/BE experiments | `docs/development/multi-agent-system/` (legacy) |

Each project doc includes folder breakdowns, commands, testing scope, and integration notes.

---

## 4. Architecture & Data References
- **Backend Modules**: See `docs/handbook/projects/backend.md#architecture` plus auto-generated inventory (`docs/handbook/generated/backend-modules.md`).
- **Backend Services Map**: `docs/handbook/generated/backend-services.md` lists every `*.service.ts` file so ownership stays clear.
- **Admin Features**: `docs/handbook/generated/admin-dashboard-features.md` reflects the feature folders detected under `src/features`.
- **Admin Pages**: `docs/handbook/generated/admin-dashboard-pages.md` enumerates route-level pages under `src/pages`.
- **Mobile Structure**: `docs/handbook/generated/mobile-structure.md`.
- **Prisma Schema / DB Map**: `backend/prisma/schema.prisma` is canonical; summarized models live in `docs/reference/db-schema.md` (regenerate via `node scripts/atctl.mjs docs --sync`).
- **API Contracts**: `backend/openapi/`, `docs/OPENAPI_CONTROLLER_AUDIT.md`, and feature specs under `docs/features/`.
- **Front-end Feature Tree**: `admin-dashboard/src/features/*` with shared services in `src/services/` (documented in project page).

---

## 5. Quality & Standards
- Always follow `docs/standards/code-quality.md` (style/tests) and `docs/standards/ai-collaboration.md` (design extraction, plan mode, blueprints).
- Enforce via `node scripts/atctl.mjs check --auto` (hook/CI) prior to PRs.
- PR template must link updated docs/runbooks when relevant.

---

## 6. Quick Start & Deployment

### New Developer Onboarding
When starting on the project for the first time:
1. **Environment Setup** (15 min):
   - Start backend: `cd backend && npm run start:dev` (port 4000)
   - Start admin dashboard: `cd admin-dashboard && npm run dev` (port 5173)
   - Verify APIs: `curl http://localhost:4000/api/inspections`
2. **Verify File Locations**: Key components live under `src/features/<domain>/components/`
3. **Review Testing Procedures**: See project-specific testing guides in `docs/handbook/projects/`
4. **Build Verification**: Run `npm run build` in each project to ensure no errors

### Deployment Workflow Reference
For production deployment checklist, key steps include:
- Pre-deployment: Code quality checks, testing sign-off, stakeholder approval
- Database: Backup production DB, run migrations (`npm run migration:run`), verify
- Backend: Build + deploy (`pm2 deploy`), verify health endpoint, check logs
- Admin Dashboard: Build + deploy to CDN (`aws s3 sync dist/`), invalidate CloudFront cache
- Post-deployment: Smoke tests (login, operations, critical paths), monitor metrics
- Rollback Plan: Documented procedures if issues arise

Full deployment checklist archived in `docs/archive/root/2025-11/DEPLOYMENT_CHECKLIST.md`.

---

## 7. Links & Runbooks
- `docs/runbooks/plan-mode.md` – plan-mode workflow (blueprints, approvals, feedback loop).
- `backend/logs` or `backend.log` – backend runtime log references (tail during dev).
- Feature implementations & planned work: `docs/features/implemented/`, `docs/features/planned/`.

---

## 8. Maintenance Workflow
| Cadence | Action | Owner |
|---------|--------|-------|
| Every new feature | Ensure matching doc updated, add regression tests | Feature author |
| Weekly | Run `atctl docs --stale` (once implemented) to flag outdated sections | TL on duty |
| Sprint-end | Archive superseded docs to `docs/archive/` | PM or Doc lead |

Check `docs/README.md` for legacy layout; treat this handbook as the living source.

---

## 9. Quick Links
- Repository Primer: `AGENTS.md`
- Standards: `docs/standards/code-quality.md`
- AI Collaboration Charter: `docs/standards/ai-collaboration.md`
- Session Runbook: `docs/runbooks/session-start.md`
- Plan Mode Runbook: `docs/runbooks/plan-mode.md`
- Workflow Initiative Tracker: `docs/coordination/automated-workflow-initiative.md`
- Implementation Status: `docs/coordination/implementation-status.md`
- Backend Deep Dive: `docs/handbook/projects/backend.md`
- Admin Dashboard Deep Dive: `docs/handbook/projects/admin-dashboard.md`
- Mobile App Deep Dive: `docs/handbook/projects/mobile.md`

Keep this handbook updated whenever architecture, tooling, or process changes.
