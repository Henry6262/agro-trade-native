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
- [ ] Prioritize buyer + seller dashboards (per user direction) → replace mocks with live hooks/services.
- [ ] Extend to transporter + inspector dashboards, ensuring shared onboarding components handle multi-role use.
- [ ] Update shared stores + design-system usage to align with rulebook.
- [ ] Add/refresh tests + docs; update `status.md` progress + `DAILY_LOG.md` entries.

## Notes / Links
- Follow the shared-feature guidance in `rules/frontend/shared-components.md` when wiring onboarding modules reused across roles.
- Keep `docs/coordination/mobile-migration-plan.md` updated as features move.
