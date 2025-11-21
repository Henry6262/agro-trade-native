# Glossary

| Term | Definition |
|------|------------|
| **Page → Section → Feature** | The enforced frontend/mobile folder hierarchy: each page is split into sections, each section into features with `components/`, `hooks/`, `service.ts`, `types.ts`, and optional `store.ts`/`utils.ts`. |
| **Rulebook** | Stack-specific standards that agents must read before planning (e.g., `rules/frontend/*`; backend rulebook to be authored in EP-01). |
| **Blueprint** | Story/epic-level implementation spec stored under `docs/blueprints/` describing scope, contracts, and acceptance criteria; every epic references one. |
| **Live Wiring** | Replacing mock data with real backend endpoints while preserving typed DTOs and error handling (EP-03 focus). |
| **Automation Jobs** | Background services (queues, schedulers, Puppeteer workflows) that support the mobile experience (EP-04). |
| **QA Harness** | Repeatable Jest/e2e suites plus data seeding that validate the full buyer/seller/transporter/inspector flows (EP-05). |
| **Daily Log** | Running log of per-day updates recorded in `DAILY_LOG.md` so async contributors can follow progress/blockers. |
| **Critical Path** | Ordered dependency chain (EP-01 → EP-02 → EP-03) that must stay unblocked to deliver the initiative. |
