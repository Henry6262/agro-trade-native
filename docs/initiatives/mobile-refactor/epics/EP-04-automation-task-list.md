# EP-04 – Automation Task List (Blueprint)

## Goals
- Keep mobile data fresh (timelines, offers, inspections, fleet) via scheduled or event-driven jobs.
- Ensure jobs follow the backend rulebook (structure, DTOs, validation) and are observable (logs/metrics/alerts).
- Expose results safely to mobile (pollable endpoints, webhooks, or cached summaries).

## Proposed Job Categories
1. **Timeline refreshers**  
   - Periodically consolidate negotiation/inspection/transport events into timeline tables consumed by `/buyer/timeline` and `/seller/timeline`.
2. **Inspection freshness**  
   - Reconcile inspector missions (new, in-progress, completed) from source systems; expire stale assignments.
3. **Transport/fleet health**  
   - Sync truck/driver status (maintenance, assigned, available) and recompute summaries used by mobile fleet/cards.
4. **Pricing/market data**  
   - Refresh market pricing indexes if mobile surfaces pricing trends.
5. **Notifications**  
   - Queue and dispatch push/email/SMS for critical state changes (offers, bids, inspections).

## Folder Layout (Proposed)
```
backend/src/automation/
  jobs/
    timeline.refresh.job.ts
    inspections.sync.job.ts
    fleet.health.job.ts
    pricing.refresh.job.ts
    notifications.dispatch.job.ts
  scheduler/
    index.ts              # cron expressions, job registration
    cron.config.ts
  workers/
    queue.ts              # bullmq or chosen queue client setup
    processor.ts
  utils/
    logger.ts             # shared logger/metric helpers
    tracing.ts
  dto/                    # shared DTOs for job payloads/results
```

## Task Breakdown (initial pass)
- [ ] Choose job runner (cron-based scheduler vs. queue with delayed jobs) and document it.
- [ ] Scaffold `backend/src/automation/*` with scheduler + job registry + logger/metrics helpers.
- [ ] Implement **Timeline refresher** job: recompute buyer/seller timelines; add metrics.
- [ ] Implement **Inspection freshness** job: sync inspector missions; expire stale; add metrics.
- [ ] Implement **Fleet health** job: recompute fleet summaries/status; add metrics.
- [ ] (Optional) Pricing/notifications jobs if needed by mobile in this phase.
- [ ] Tests for each job (unit/integration as appropriate).
- [ ] Monitoring/alerting checklist (log level, error alerts, latency, success counts).
- [ ] Document triggers and mobile touchpoints in `docs/features/implemented/mobile-automation.md`.
- [ ] Update status + daily log as jobs come online.

## Assumptions / To Validate
- No existing cron/queue/puppeteer automation present (repo scan 2025-11-22).
- Mobile consumes timelines via existing endpoints; jobs should not break contracts.
- Queue choice should align with current infra (Redis already in use for cache?).

## Open Questions
- Do we need push/webhook delivery, or is polling sufficient for mobile?
- SLA for freshness (e.g., timelines within 5m, fleet within 1m?).
- Do we reuse existing logging/metrics stack or add lightweight instrumentation?
