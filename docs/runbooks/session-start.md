# Session Start Runbook

**Last Updated**: 2025-11-13  
**Status**: Active  
**Related**: `AGENTS.md`, `docs/HANDBOOK.md`, `scripts/atctl.mjs`

---

## Purpose
Guarantee every working session begins with the same context: correct services running, docs reviewed, and status captured.

---

## Checklist
1. **Read `AGENTS.md`**  
   - Confirms repository expectations and links to handbook + standards.
2. **`node scripts/atctl.mjs session` (agent-run)**  
   - Triggered by the AI agent at the beginning of every chat to regain context.
   - Shows branch, dirty files, pending migrations, key docs.
   - Follow any reminders printed (missing env, services down, etc.).
3. **Review `docs/HANDBOOK.md` sections relevant to current work**  
   - Especially project-specific pages.
4. **Ensure prerequisites are live**  
   - Postgres + Redis running locally.  
   - `backend` dev server (`npm run start:dev`).  
   - `admin-dashboard` Vite server (`npm run dev`) if UI changes.  
   - Mobile Expo dev if working on app.
5. **Sync docs + tasks**  
   - Note active tickets/issues.  
   - If touching architecture/docs, plan updates now (no “later”).
6. **Record session intent**  
   - Update working note or issue with goals before coding.
7. **Verify git hook installed** (agent action)  
   - Run `bash scripts/hooks/install.sh` whenever `.git` is recreated or cloned to ensure `core.hooksPath` points to `scripts/hooks/git` and `pre-push` runs `node scripts/atctl.mjs check --auto`. If sandbox prevents editing `.git/config`, notify the user to run it locally.

### Before Commit / Push
1. **Run `node scripts/atctl.mjs check --auto`**  
   - Agent executes this to automatically run lint/tests/docs commands tied to touched folders (rerun without `--auto` for summary only).
2. **If structure or schema changed, run `node scripts/atctl.mjs docs --sync`**  
   - Refreshes generated inventories + Prisma model summary.
3. **Verify docs + runbooks updated** for any behavior/config changes.

---

## Exiting a Session
- Re-run `node scripts/atctl.mjs status` to capture final state.
- Commit or stash work; update docs/runbooks touched.
- Leave breadcrumbs in issue tracker or `coordination/` note.

---

## Automation Hooks
- `node scripts/atctl.mjs docs --sync` already refreshes module inventories, service/page lists, and Prisma summaries.
- `node scripts/atctl.mjs check --auto` bundles lint/tests/doc verification prior to push and is enforced via git hook.
- For story work, pair this runbook with `docs/runbooks/plan-mode.md` to manage blueprints, plan approvals, and status updates.
