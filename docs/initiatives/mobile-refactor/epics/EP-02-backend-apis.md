# EP-02 – Backend APIs → Mobile Integration

## Outcome / Definition of Done
- Every mobile feature in scope (buyer, seller, transporter, inspector dashboards + onboarding) has a documented backend endpoint contract.
- Admin-verified endpoints are exposed via typed DTOs used by the mobile TypeScript client.
- Puppeteer/automation flows required for data freshness are callable via API (where applicable).
- Mobile swagger/openAPI references are synced and linked from the handbook.

## Deliverables
- Endpoint inventory + mapping doc (`docs/features/implemented/mobile-backend-contracts.md`).
- Updated NestJS modules/services/controllers implementing missing endpoints or aligning responses with DTOs.
- Automated tests (unit + e2e) covering the newly exposed endpoints.
- Blueprint: `docs/blueprints/mobile/EP-02-backend-apis.md`.

## Owner(s)
- Primary: @backend
- Support: @mobile, @qa

## Dependencies
- Requires EP-01 (rulebook + structure) to be complete.

## Milestones / Task List
- [ ] Catalog admin dashboard endpoints already in production + their DTOs.
- [ ] Identify gaps needed for mobile (transport jobs, onboarding flows, etc.).
- [ ] Implement/adjust NestJS controllers + services; reuse Puppeteer layer when needed.
- [ ] Write unit + e2e tests for each adjusted endpoint.
- [ ] Publish contracts + update handbook/mobile project doc.
- [ ] Confirm `status.md` progress + log updates in `DAILY_LOG.md`.

## Notes / Links
- Coordinate with EP-04 for endpoints triggered by automation jobs.
- Ensure responses are shaped for React Query hooks (status fields, pagination metadata, errors).
