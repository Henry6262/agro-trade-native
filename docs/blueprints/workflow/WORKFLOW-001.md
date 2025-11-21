# WORKFLOW-001 Blueprint

**Epic**: Workflow Automation  
**Story**: Automated documentation catalog & stray detection  
**Status**: Done  
**Last Updated**: 2025-11-15

## Objective
Automatically inventory Markdown files, detect strays, and surface the report in `atctl` so documentation stays organized.

## Implementation Summary
- Added catalog + stray report generation to `scripts/atctl.mjs docs --sync`.
- Created `docs/coordination/docs-catalog.json` and `docs/coordination/docs-strays.md`.
- Linked reports from AGENTS/handbook.

## Tests / Verification
- `node scripts/atctl.mjs docs --sync`
- Manual inspection of stray report.

## Follow-ups
- Expand catalog to store owners/metadata if needed.
