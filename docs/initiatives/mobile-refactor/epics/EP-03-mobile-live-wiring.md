# EP-03 – Mobile App Live Endpoint Wiring

## Outcome / Definition of Done
- All mobile dashboards (buyer, seller, transporter, inspector) and onboarding flows consume live backend data via services/hooks.
- Mock JSON/services removed or gated behind feature flags for offline demos.
- Documentation lists every page/section/feature with its corresponding backend endpoint + React Query hook/service.
- Lint/tests (`npm run lint`, Jest/RNTL suites) pass without relying on mock data.

## Deliverables
- Updated `front-end/src/pages/**` features using `service.ts` + `hooks/` for each data source.
- Test plan + evidence recorded in `docs/handbook/projects/mobile.md` + `docs/features/implemented/mobile-live-wiring.md`.
- Blueprint: `docs/blueprints/mobile/EP-03-mobile-live-wiring.md`.

## Owner(s)
- Primary: @frontend (mobile squad)
- Support: @backend for contract clarifications

## Dependencies
- Requires EP-02 completion (real endpoints available).

## Milestones / Task List
- [ ] Inventory mock data/modules still referenced in `front-end/src/features` or legacy screens.
- [x] Prioritize buyer + seller dashboards (per user direction) → replace mocks with live hooks/services (2025-11-17: Buyer Requests now consumes `/buyer/listings` via `buyerService`).
- [ ] Extend to transporter + inspector dashboards, ensuring shared onboarding components handle multi-role use.
- [x] Wire transporter bidding summary to `/transport/me/analytics` so win-rate/completed job metrics come from the backend (2025-11-17).
- [x] Add seller timeline feature (service, hook, component) backed by `/seller/timeline` and render it inside the Offers tab (2025-11-17).
- [x] Replace seller trades summary/cards with `/seller/trades` + `/seller/stats` (new service + React Query hook) so the feature no longer relies on mocks (2025-11-17).
- [x] Move seller offers feed to `/seller/offers` via `sellerService` and keep mutations wired to negotiations endpoints (2025-11-17).
- [x] Buyer Orders hook now fetches trade operations/statistics/offers via React Query + `buyerService`, replacing mock incoming offers (2025-11-17).
- [x] Transporter Fleet feature + legacy tab now consume `/transport-company/me/fleet` (new backend endpoint) so trucks/drivers/statistics reflect live data (2025-11-17).
- [x] Add fleet CRUD/assignment endpoints (`POST /transport-company/me/trucks`, `POST /transport-company/me/drivers`, `POST /transport-company/me/trucks/:id/assign-driver`) and wire RN mutations to refresh fleet data (2025-11-21: All 8 endpoints implemented + React Query mutations wired).
- [ ] Update shared stores + design-system usage to align with rulebook.
- [ ] Add/refresh tests + docs; update `status.md` progress + `DAILY_LOG.md` entries.

## Notes / Links
- Follow the shared-feature guidance in `rules/frontend/shared-components.md` when wiring onboarding modules reused across roles.
- Keep `docs/coordination/mobile-migration-plan.md` updated as features move.
