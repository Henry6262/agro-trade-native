# Documentation & Coordination

## Required Updates For Backend Work
- `docs/handbook/projects/backend.md` – describe module changes, new endpoints, automation flows.
- `docs/coordination/implementation-status.md` – log story progress after each coding session (ID, owner, tests run).
- `docs/initiatives/mobile-refactor/status.md` + relevant epic file – update progress/milestones for EP-01..EP-05.
- Blueprint under `docs/blueprints/<epic>/<story>.md` – capture plan + acceptance criteria before coding.
- `docs/coordination/mobile-migration-plan.md` – update when backend/mobile alignment milestones shift.

## Process
1. Generate/refresh blueprints before entering Plan Mode.
2. Execute work according to blueprint + rulebook.
3. Run `node scripts/atctl.mjs check --auto` (which now triggers `scripts/check-backend-rules.mjs`).
4. Update docs noted above with actual behavior, endpoints, and verification evidence.
5. Archive superseded material under `docs/archive/backend/<YYYY-MM>/` instead of deleting.

## PR Expectations
- Reference the rule files consulted (link to sections if relevant).
- Include lint/test outputs plus any manual job commands.
- Explain schema changes, migrations, and data backfills.
