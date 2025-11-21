# WORKFLOW-003 Blueprint

**Epic**: Workflow Automation  
**Story**: Legacy Markdown migration into handbook/archive  
**Status**: Done  
**Last Updated**: 2025-11-15

## Goal
Consolidate scattered Markdown files into structured handbook/archive folders and keep stray report clean.

## Implementation Steps
1. Run `node scripts/atctl.mjs docs --sync` to generate catalog.
2. Move root-level docs → `docs/archive/root/2025-11/` with index README.
3. Move admin-dashboard docs → `docs/archive/admin-dashboard/2025-11/` (plus MatchingDashboard README).
4. Move backend docs → `docs/archive/backend/2025-11/`.
5. Move front-end + Abu Dhabi docs → respective archive folders.
6. Rerun `atctl docs --sync` and confirm stray report shows zero.

## Verification
- `docs/coordination/docs-strays.md` shows “No strays”.
- Git status shows deletions in source folders and new archive files.

## Follow-ups
- Review archives for content worth summarizing in handbook sections.
- Keep catalog updated as new docs are created.
