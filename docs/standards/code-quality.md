# Code Quality Standards

**Last Updated**: 2025-11-13  
**Scope**: Backend, Admin Dashboard, Mobile  
**Enforced By**: Reviews + `atctl check --auto` (git hook/CI)  
**Companion Doc**: `docs/standards/ai-collaboration.md`

---

## 1. Principles
- **Single source of truth**: Types originate from backend DTOs/Prisma; reuse across clients.
- **Fail fast**: Prefer guard clauses, exhaustive `switch` handling, and logging around external boundaries.
- **Document as you go**: Any behavior change touching business logic requires doc or runbook update in the same PR.

---

## 2. Style & Formatting
- TypeScript strict mode everywhere. No `any` unless justified with TODO + follow-up issue.
- Tabs vs spaces: follow file (2 spaces in React/Nest). No trailing whitespace.
- Use async/await over raw promises; handle errors explicitly (no silent `.catch`).
- Keep files focused: components/services under ~200 lines or split logically.

---

## 3. Naming & Structure
- Components: `PascalCase.tsx`. Hooks: `useCamelCase.ts`. Services/utilities: `camelCase.ts`.
- DTOs/interfaces live near their module. Export from central `index.ts` only when shared widely.
- Tests mirror file names (`Component.test.tsx`, `service.spec.ts`).

---

## 4. Testing Requirements
- Backend:  
  - Unit tests for services, guards, and non-trivial helpers.  
  - E2E tests for new endpoints or regression fixes.  
  - Mock external services (Redis, queues) using provided helpers.
- Frontend/Admin:  
  - Component behavior tests via Vitest + Testing Library.  
  - Hook-level tests for data fetching/mutations.  
  - Snapshot tests only for static presentational pieces.
- Mobile:  
  - Jest with React Native Testing Library for screens/components.  
  - Integration tests for navigation flows where feasible.
- Always add regression tests when fixing bugs or adding rules.

---

## 5. Documentation & Runbooks
- Update `docs/HANDBOOK.md` or relevant project page when module ownership/structure changes.
- Record feature behavior in `docs/features/implemented/` and future plans in `docs/features/planned/`.
- Run `node scripts/atctl.mjs docs --sync` after structural or schema changes to refresh generated inventories and Prisma summaries.

---

## 6. Git & PR Hygiene
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, etc.).
- Keep PRs scoped; include: summary, tests output, linked issue, screenshots for UI.
- No unrelated formatting noise. If prettier/eslint rewrites large files, mention in description.
- Never commit `.env` or secrets; rely on `.env.example`.
- Agents must execute `node scripts/atctl.mjs check --auto` before pushing so recommended lint/tests/docs commands run automatically (rerun without `--auto` if manual execution is preferred).
- Install git hooks via `bash scripts/hooks/install.sh` so `core.hooksPath` points to `scripts/hooks/git` and the `pre-push` hook enforces the `atctl` check for every contributor (set `SKIP_ATCTL_CHECK=1` only for emergencies; coordinate with the user if sandbox restrictions block the config write).

---

## 7. Review Checklist
- [ ] Tests cover new/changed logic.
- [ ] Lint + type checks pass.
- [ ] Docs updated (handbook, runbook, feature spec).
- [ ] Runtime errors handled (try/catch, logging).
- [ ] No TODOs left unresolved without tracking issue.
- [ ] `atctl check --auto` run output is satisfied (lint/tests/docs executed). Re-run `docs --sync` if structure/schema changed.

Keep this document updated whenever standards evolve.
