# EP-04 – Automation & Background Services

## Outcome / Definition of Done
- Background jobs (queues, schedulers, Puppeteer scrapers) provide the data freshness the mobile app expects (offers, inspections, logistics, pricing).
- Automation scripts follow the backend rulebook and are observable (logs, metrics, alerts).
- Mobile hooks/services can trigger or subscribe to automation results (webhooks, polling endpoints).

## Deliverables
- Documented automation architecture (`docs/features/implemented/mobile-automation.md`).
- Scripts/services inside `backend/apps` or `backend/src/modules/*` with tests + monitoring hooks.
- Infra checklist for deployment (cron, worker processes, environment variables).
- Blueprint: `docs/blueprints/mobile/EP-04-automation.md`.
- Task breakdown: `docs/initiatives/mobile-refactor/epics/EP-04-automation-task-list.md`.

## Owner(s)
- Primary: @backend / @devops
- Support: @mobile, @qa

## Dependencies
- Depends on EP-01 (structure) but can run in parallel with EP-02 once the rulebook exists.

## Milestones / Task List
- [ ] Audit existing automation (Puppeteer services, data sync scripts) and gap-analyze requirements for mobile live data. *(2025-11-22: initial repo scan found no cron/queue/puppeteer modules under `backend/src`; blueprint needed.)*
- [ ] Decide job runner (cron vs queue) and scaffold `backend/src/automation` (scheduler + workers + utils).
- [ ] Implement timeline refresher job (buyer/seller timelines) with metrics/alerts.
- [ ] Implement inspection freshness job (missions sync/expiry) with metrics/alerts.
- [ ] Implement fleet health job (status/summaries refresh) with metrics/alerts.
- [ ] (Optional) Pricing/notifications jobs if needed by mobile in this phase.
- [ ] Tests + monitoring/alerting checklist per job.
- [ ] Document mobile touchpoints + triggers in `docs/features/implemented/mobile-automation.md`.
- [ ] Update `status.md` + `DAILY_LOG.md` as jobs come online.

## Notes / Links
- Coordinate with EP-02 for APIs that expose automation data and with EP-05 for test harness coverage.
