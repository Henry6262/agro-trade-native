# Workflow Rules

## 1. Before You Start
1. Read `README.md` for initiative context.
2. Open `status.md` → identify your epic.
3. Check `DEPENDENCIES.md` to ensure prerequisites are complete.
4. Read your epic file in `epics/` (Definition of Done, deliverables, milestones).
5. Confirm owners and expectations (status.md + epic file).

## 2. Updating Progress
1. Move epic status in `status.md` (Planned → In Progress → Complete) and fill `% Complete`, ETA, blockers.
2. Edit your epic file to check off tasks and append dated notes:
   ```
   - [x] Implement lint rule (2025-11-17)
   - [ ] Add integration tests
   ```
3. Add a short entry to `DAILY_LOG.md` if you worked that day (what you shipped, blockers).
4. If blocked, log it in `status.md` (Blockers column) and note it in `DAILY_LOG.md`.

## 3. Completing Work
1. Verify Definition of Done in epic file is satisfied.
2. All tasks checked, notes updated, supporting docs/PRs linked.
3. Update `status.md` → status “Complete”, `% Complete = 100%`, blockers cleared.
4. Notify downstream epic owners (per `DEPENDENCIES.md`).

## 4. Daily Log Guidelines
- One entry per day per person max (use short bullet).
- Note progress, tests run, blockers.
- If nothing happened (waiting on review), state that.

## 5. Review Cadence
- At least once per week, each epic owner updates `status.md` and epic file.
- Initiative owner reviews `status.md` weekly to make sure ETAs/blockers are accurate.

## 6. Docs Hygiene
- Whenever code changes behavior, update the relevant epic, status, and any linked handbooks/rulebooks.
- Keep rulebooks/rules in sync with backend + mobile migrations.

By following this workflow, every agent (internal or remote) can pick up epics, report progress, and unblock others without chasing context.
