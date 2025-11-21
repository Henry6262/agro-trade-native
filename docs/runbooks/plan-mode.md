# Plan Mode Implementation Runbook

**Last Updated**: 2025-11-14  
**Status**: Active  
**Related**: `docs/standards/ai-collaboration.md`, `docs/coordination/implementation-status.md`, `docs/blueprints/`

---

## Purpose
Enforce a strict plan-first, implement-second workflow for every story so AI and human contributors stay synchronized and no feature ships without a vetted blueprint, feedback loop, and documentation trail.

---

## Definitions
- **Blueprint**: Story-specific specification generated via the Software Implementer gem and stored under `docs/blueprints/<epic>/<story>.md`.
- **Plan Mode**: Execution modality where the agent proposes a detailed plan, the developer approves, then coding begins. Any deviation restarts the planning step.
- **Implementation Status Doc**: `docs/coordination/implementation-status.md`, the single source of truth for completed/in-progress stories.

---

## Story Workflow
1. **Prepare Context**
   - Review the relevant blueprint folder, handbook sections, and the Implementation Status doc.
   - If no blueprint exists, generate one via the Software Implementer gem and file it under `docs/blueprints/...`.
2. **Enter Plan Mode**
   - Outline the smallest actionable steps (no more than 3–5 per iteration).
   - Get explicit approval; adjust until the plan is airtight.
3. **Implement**
   - Execute the plan exactly as approved.  
   - If unexpected complexity appears, pause, update the plan, and seek re-approval before proceeding.
4. **Validate**
   - Run targeted tests + `node scripts/atctl.mjs check --auto`.  
   - Update docs/runbooks touched by the change (handbook, specs, etc.).
5. **Feedback & Status**
   - Update the blueprint with what shipped vs deferred.  
   - Log the story result in `docs/coordination/implementation-status.md`.
   - Provide a short feedback note for the next AI iteration (what worked, blockers).

---

## Blueprint Requirements
- Title, linked epic/story ID.
- Feature overview + acceptance criteria.
- Components/services touched (with file paths).
- API/data contracts (DTOs, endpoints).
- Test plan + data setup.
- Rollout considerations (feature flags, migrations).

---

## Implementation Status Update
For each story:
1. Mark status (`Not Started`, `In Progress`, `Blocked`, `Done`).
2. Add last updated date and owner.
3. Summarize verification (tests run, screenshots if UI).
4. Note follow-ups or dependencies.

Use the template inside `docs/coordination/implementation-status.md`.
`node scripts/atctl.mjs check` now enforces that this file is updated whenever feature code changes.

---

## Manual Intervention Triggers
- Blueprint gap discovered mid-implementation.
- Design assets unavailable or MCP extraction fails twice.
- Tooling errors (build, platform-specific scripts) requiring human fixes.

When triggered: pause coding, update blueprint + plan, decide whether to handcraft the piece, then resume Plan Mode.

---

## Checklist
- [ ] Blueprint present & up to date.
- [ ] Plan documented and approved.
- [ ] Implementation followed plan or plan updated before deviations.
- [ ] Tests + `atctl check --auto` completed.
- [ ] Blueprint + Implementation Status updated.
- [ ] Feedback recorded for next iteration.

Always exit a session with Plan Mode notes and status docs refreshed so the next agent resumes instantly.
