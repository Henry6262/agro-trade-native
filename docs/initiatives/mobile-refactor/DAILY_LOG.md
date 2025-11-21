# Daily Log

## 2025-11-21
- **@backend** – Implemented complete Fleet CRUD API (8 endpoints) for transport companies: POST/PUT/DELETE for trucks and drivers, plus driver assignment/unassignment to trucks. All endpoints protected with JWT auth + company ownership validation. DTOs created with class-validator for input validation. Backend builds and lints successfully.
- **@frontend** – Wired Fleet CRUD mutations to new backend endpoints via React Query hooks (`useFleetMutations.ts`): created 8 mutation hooks (create/update/delete trucks, create/update/delete drivers, assign/unassign driver) with proper invalidation and error handling. Added corresponding service methods to `transportService.ts`.
- **@frontend** – Removed mock data from Transporter Maps APIs (`fleetApi.ts`, `offerApi.ts`): wired fleet map to `/transport-company/me/fleet` and offers map to `/transport/requests/available`. Created helper functions for type conversions (location parsing, address parsing, status mapping). Eliminated 303 lines of mock data.
- **@frontend** – Fixed Seller Offers service: removed misleading TODO comment and mock fallback. Service now properly calls live `/seller/offers` endpoint with correct error handling. Verified backend endpoint exists and is operational.
- **@all** – EP-03 marked Complete: all role dashboards run on live endpoints; remaining polish (shared stores alignment, extra tests/docs) captured in backlog.

## 2025-11-17
- **@backend** – Authored backend rulebook (`rules/backend/*`), added enforcement script + `atctl` hook, updated handbook/migration docs. Checker currently warns about missing DTO folders for pricing/products/regions; follow-up tasks queued under EP-01.
- **@backend** – Added DTO folders + typed responses for pricing/products/regions and restored backend ESLint config. `node scripts/check-backend-rules.mjs` now passes cleanly; `npm run lint` still fails due to long-standing unused-var issues in transport/auth modules.
- **@backend** – Expanded lint coverage (tsconfig + `.eslintrc` ignore tuning) and scrubbed unused imports/params across negotiations, trade ops, seller, transport, and notifications so `cd backend && npm run lint` now passes (warnings only). Rule checker still green.
- **@backend** – Cataloged existing buyer/seller/transporter/inspector/onboarding endpoints in `docs/features/implemented/mobile-backend-contracts.md` to kick off EP-02 (Backend APIs → Mobile Integration).
- **@backend** – Documented the remaining gaps for mobile (buyer/seller timelines, inspector active job, transporter analytics scoping) under `docs/features/planned/*.md` and updated EP-02 epic status to reflect the analysis milestone.
- **@backend** – Implemented `/buyer/timeline` + `/seller/timeline` endpoints (with DTOs + pagination) so mobile dashboards can consume real timeline data; contracts doc updated to mark these as Live.
- **@backend** – Added `GET /transport/me/analytics` (scoped transporter analytics) so transporters see win rate/pending bids/active jobs metrics without admin routes; contracts + planning docs updated.
- **@frontend** – Updated transporter bidding hook/service to consume `/transport/me/analytics` through `transportService.getMyAnalytics`, mapping metrics into the feature summary and adding the missing `getAvailableRequests` client helper.
- **@frontend** – Introduced `sellerService` + Seller Timeline feature (`pages/Dashboard/sections/Seller/features/Timeline`) wired to `/seller/timeline`, embedding it in the Offers tab so sellers see live negotiation/transport/inspection events.
- **@frontend** – Replaced Seller Trades mocks with live data (`sellerService.getMyTrades`, `/seller/stats`) via a new React Query hook; the feature now surfaces backend earnings summaries and trade cards with refresh control.
- **@frontend** – Repointed Seller Offers hook to `/seller/offers` through `sellerService` so stats + cards come from the backend, while keeping accept/reject/counter mutations on the negotiations endpoints.
- **@frontend** – Buyer Requests feature now uses React Query + `buyerService.getMyBuyListings()`; request cards and the offers drawer reflect live backend listings with pull-to-refresh.
- **@frontend** – Inspector Available Jobs now uses React Query + `inspectionService.getInspectorMissions` (no mock fallback) so the list/map views stay in sync with real missions.
- **@frontend** – Buyer Orders feature now sources trade operations/statistics/offers via React Query + `buyerService`, replacing mock incoming offers and manual fetch logic.
- **@backend**/**@frontend** – Added `/transport-company/me/fleet` endpoint + `transportService.getMyFleet`; transporter fleet summary/cards now consume live trucks/drivers instead of hardcoded mocks.
