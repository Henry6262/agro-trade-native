# Agro-Trade Agent Briefing

This file is the mandatory entry point for any fresh session. Follow it sequentially before touching code.

---

## 1. Session Bootstrap (do this first)
1. **Run the session helper** *(agent does this automatically at the start of every chat)*  
   ```bash
   node scripts/atctl.mjs session
   ```  
   This prints branch/status info, pending migrations, and quick doc links so the AI always regains full context without user intervention.
2. **Scan the handbook** – `docs/HANDBOOK.md` (product overview, project map, runbooks).  
   - Project deep dives:  
     - Backend → `docs/handbook/projects/backend.md`  
     - Admin dashboard → `docs/handbook/projects/admin-dashboard.md`  
     - Mobile app → `docs/handbook/projects/mobile.md`
3. **Review the runbooks/standards** – `docs/runbooks/session-start.md`, `docs/runbooks/plan-mode.md`, `docs/standards/ai-collaboration.md`.
4. **Load coding rules** – open `rules/README.md`, then the stack-specific folder you’ll touch (e.g., `rules/frontend/` for the mobile app) and read every linked rule file (`structure.md`, `components.md`, `logic-and-data.md`, `design-system.md`, `state-and-store.md`, `docs.md`) before planning or coding.
5. **Check coordination docs** – `docs/coordination/automated-workflow-initiative.md` for initiative status and `docs/coordination/implementation-status.md` for story progress (update them as you work).
6. **Lint early and often** – after each batch of changes in any app, run the relevant lint command (`npm run lint` in the touched package) and capture/fix failures so issues don’t pile up.

---

## Current Initiative: Automated Workflow & Docs Cleanup
- Overview lives in `docs/coordination/automated-workflow-initiative.md` (must stay updated).
- Goals: consolidate Markdown sprawl, automate handbook generation (`atctl docs --sync`), enforce plan-mode + Implementation Status updates.
- Every session touching docs/automation must update that coordination file plus any referenced handbook/runbook sections.

---

## 2. Repository Layout
- `backend/` – NestJS API (Prisma, PostgreSQL, Redis). Tests under `test/` & `tests/`.
- `admin-dashboard/` – React/Vite control tower UI. Feature-first structure in `src/features/`.
- `front-end/` – Expo/React Native mobile app.
- `docs/` – All documentation. Handbook + standards now live here; legacy material remains in `docs/archive/`.
- `contracts/`, `coordination/`, `*.md` – process & automation context (read before large refactors).

Refer to `docs/HANDBOOK.md#project-map` for folder-by-folder explanations.

---

## 3. Core Commands
```bash
# Backend
cd backend
npm run start:dev      # Nest dev server
npm run test           # Unit tests (Jest)
npm run test:e2e       # Supertest API suite

# Admin dashboard
cd admin-dashboard
npm run dev            # Vite dev server (5173/5175)
npm run build          # Production build
npm run test           # Vitest (if suites defined)

# Mobile
cd front-end
npm run start          # Expo / Metro bundler
npm run test           # Jest / RNTL
```
Prerequisites: local Postgres + Redis running (Postgres.app or docker-compose) before `npm run start:dev`.

---

## 4. Standards & Testing
- Follow `docs/standards/code-quality.md` for style, testing, and PR expectations.
- Follow `docs/standards/ai-collaboration.md` for design extraction, plan mode, testing discipline, and manual intervention rules.
- TypeScript strict everywhere; prefer async/await and guard clauses.
- Tests live alongside modules (`*.spec.ts`, `.test.tsx`). Every business-logic change needs regression coverage.
- Document behavior changes in `docs/HANDBOOK.md`, runbooks, or feature specs immediately—no deferred doc work.

---

4. **Install/verify git hooks (agent-owned):**  
   ```bash
   bash scripts/hooks/install.sh
   ```  
   This sets `core.hooksPath` to `scripts/hooks/git`, ensuring every push automatically runs `node scripts/atctl.mjs check --auto`. The agent must rerun this whenever the repo is recloned or `.git` is replaced (set `SKIP_ATCTL_CHECK=1` temporarily if needed). If the command fails due to sandbox restrictions, coordinate with the user to run it locally.

---

## 5. Commit / PR Rules
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`...). Keep scope focused.
- PRs must include summary, test evidence (`npm run test`, etc.), linked issue/Linear ticket, and UI screenshots/GIFs if relevant.
- The agent must run `node scripts/atctl.mjs check --auto` before pushing to automatically execute recommended lint/tests/doc commands. Re-run without `--auto` if you only need the summary. This check now fails if stray docs exist or if feature code changes without updating `docs/coordination/implementation-status.md`.
- Whenever backend/admin/mobile structure or Prisma schema changes, run `node scripts/atctl.mjs docs --sync` so generated references stay accurate.
- Every story requires: blueprint under `docs/blueprints/`, Plan Mode plan/approval, post-story updates to `docs/coordination/implementation-status.md`, and feedback captured per the AI collaboration charter.

---

## 6. Security & Configuration
- No secrets checked in. Use `.env.example` as the authoritative list of required values.
- Backend requires `DATABASE_URL`, Redis credentials, and any third-party tokens. Document overrides in PRs when touching infra.
- Keep API endpoints consistent across backend/admin/mobile; update `docs/handbook/projects/*` when they change.

Stay disciplined: every session begins with this file, the session helper, and the handbook. That consistency keeps multi-agent and human contributors aligned.
