# Automated Workflow & Documentation Initiative

**Last Updated**: 2025-11-13  
**Status**: In Progress  
**Related**: `AGENTS.md`, `docs/HANDBOOK.md`, `docs/runbooks/session-start.md`, `scripts/atctl.mjs`

---

## Objective
Create a fully automated, self-sustaining development workflow where:
- All context lives in structured handbook/runbook documents.
- `atctl` scripts maintain status, sync generated references, and enforce lint/tests/docs via git hooks + CI.
- Stray Markdown files are cataloged, migrated, or archived so future agents regain context instantly.

---

## Current Focus
1. **Doc Consolidation**
   - Inventory every Markdown file.
   - Classify into: handbook, feature spec, runbook, archive, or delete.
   - Build a catalog (`docs/coordination/docs-catalog.json` TBD) to track ownership + freshness.
2. **Automation Enhancements**
   - Extend `atctl docs --sync` with stray-doc warnings + richer outputs (ERD, dep graphs).
   - Enforce metadata and Implementation Status updates via `atctl check`.
3. **AI Collaboration Rules**
   - Author standards covering Figma extraction, Plan Mode enforcement, blueprint generation, and Implementation Status updates.
   - Wire those rules into AGENTS + relevant runbooks.

---

## Action Items
| # | Task | Owner | Status |
|---|------|-------|--------|
| 1 | Add doc catalog + stray-doc reporting | AI Agent | Completed |
| 2 | Draft AI Collaboration Charter (testing, git, MCP rules) | AI Agent | Completed |
| 3 | Create Plan Mode runbook & Implementation Status template | AI Agent | Completed |
| 4 | Update `atctl` to enforce metadata + Implementation Status touch | AI Agent | Completed |
| 5 | Archive legacy Markdown into `docs/archive/` | AI Agent / Dev | Pending |

---

## Guardrails
- Never delete docs without archiving; move to `docs/archive/<area>/YYYY-MM/`.
- Update this file whenever tasks complete or priorities shift.
- Keep AGENTS + Handbook references in sync with actual doc locations.

---

## Next Checkpoint
Once the catalog + standards documents exist, revisit this file to log progress and add the next wave (CI integration, blueprint automation, etc.).
