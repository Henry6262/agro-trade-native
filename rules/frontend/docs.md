# Documentation Expectations (Frontend)

## When to Update Docs
- **Every feature**: update `docs/handbook/projects/mobile.md` with the new page/section/feature summary (purpose, data flow, state usage).
- **Blueprints**: create or update the relevant blueprint under `docs/blueprints/mobile/` before entering Plan Mode (e.g., `MOB-001`).
- **Implementation Status**: log progress in `docs/coordination/implementation-status.md` after each story (status, owner, last update, blueprint link).
- **Migration Plan**: if work affects the overarching migration, note it in `docs/coordination/mobile-migration-plan.md`.

## Structure for Handbook Entries
For each feature:
- Location path (`pages/.../features/...`).
- Purpose (1–2 sentences).
- Data flow (bullets or simple diagram).
- Components/hooks/services involved.
- State management (local vs store vs global).

## Pull Requests
- Reference the rule files consulted.
- Attach screenshots or recordings for UI changes.
- Include test evidence (`npm run test`, React Native Testing Library results).

## Syncing Docs
- After edits, run `node scripts/atctl.mjs docs --sync` so the docs catalog stays current and stray report remains zero.
- Ensure `atctl check --auto` runs clean (git hook/CI enforce).
