# Automation, Jobs & Observability

## Structure
- Background jobs, schedulers, and Puppeteer workflows live inside their owning domain module (`services/jobs/`, `services/workers/`, or dedicated queue service files).
- Register queues with `BullModule.registerQueue` and expose queue names/metrics constants from the domain folder (never inline strings).
- Cron jobs use `@Cron` decorators inside providers registered in the module; keep expressions in config.

## Responsibilities
- Jobs encapsulate orchestration only (fetch data → call services). Heavy business logic still belongs in domain services that can be reused synchronously.
- Every job logs start/end + critical events via the shared logger (`Logger` or structured logging helper). Include correlation IDs when available.
- Handle retries + back-off centrally using Bull options; avoid manual setTimeout loops.

## Monitoring & Alerts
- Emit metrics (duration, success/failure counts) via the existing telemetry helper or add one if missing.
- Surface failures via alerting hooks (PagerDuty, Slack) defined in config so they work across environments.
- Document required env vars/cron schedules in `docs/features/implemented/mobile-automation.md` (EP-04 deliverable).

## Deployment & Configuration
- Jobs must be idempotent. If idempotence is impossible, guard with locks stored in Redis/Postgres.
- All automation-specific env vars belong in `.env.example` and story docs.
- Add CLI scripts for manual replays in `backend/scripts/` and document usage.
