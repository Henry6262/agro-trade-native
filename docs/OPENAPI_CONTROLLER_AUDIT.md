# OpenAPI Controller Audit

_Tracking exposed routes, auth requirements, and documentation gaps discovered during Phase 0._

## Trade Operations (`backend/src/trade-operations/controllers/trade-operation.controller.ts`)
- **Routes**
  - `POST /trade-operations` – creates trade operation (admin assumed, guard temporarily disabled).
  - `GET /trade-operations` – paginated list with filters (`phase`, `status`, `minProfitMargin`, `page`, `limit`).
  - `GET /trade-operations/analytics` – requires `ADMIN` role; returns aggregated metrics.
  - `GET /trade-operations/:id` – requires `ADMIN` role.
  - `GET /trade-operations/:id/profit` – open during testing; returns raw profit payload (type annotation missing).
  - `PATCH /trade-operations/:id/phase` – updates phase; currently lacks guard (auth disabled) and returns DTO.
  - `POST /trade-operations/:id/sellers` – bulk add sellers; returns `{ message, sellersAdded }` (type not documented).
  - `POST /trade-operations/:id/optimize-transport` – requires `ADMIN`; uses transport services; response shape not documented.
  - `POST /trade-operations/:id/finalize` – requires `ADMIN`; returns `{ success, finalProfit, profitMargin, message }`.
- **Notes**
  - Many endpoints have guards commented out; document expected auth even if disabled in dev.
  - Several responses previously returned ad-hoc objects (`getProfit`, `addSellers`, `optimizeTransport`, `finalize`); DTOs and `@ApiResponse` annotations now added. Re-run export after any further payload changes.
  - Business-specific query defaults should be captured in `@ApiQuery` (already present for most filters).
  - Consider excluding `/test/*` and `/scenarios/*` debug endpoints from production contract tests or move them behind a dev-only module.

## Profit Controller (`backend/src/trade-operations/controllers/profit.controller.ts`)
- **Routes**
  - `GET /profit/:id/profit` – calculates realtime profit; already typed with `ProfitCalculationResponseDto` but relies on `profitCalc` internal structure.
  - `POST /profit/:id/profit/estimate` – returns `ProfitEstimationResponseDto`.
  - `GET /profit/:id/profit/history` – now mapped to `ProfitHistoryEntryDto[]` via helper.
  - `POST /profit/:id/profit/compare` – returns `ProfitComparisonDto`.
  - `POST /profit/profit/compare-scenarios` – now documented with `ProfitScenarioComparisonDto`.
  - `GET /profit/:id/profit/impact/:offerId` – returns `ProfitImpactResponseDto`.
  - `GET /profit/:id/profit/validation` – returns `ProfitValidationDto`.
- **Notes**
  - Guards still commented out for testing; document expected roles in API docs.
  - DTO coverage added; ensure `sellerPrices` mapping stays consistent with Prisma JSON payload.

## Negotiations (`backend/src/negotiations/controllers/negotiation.controller.ts`)
- **Routes**
  - Frontend aliases (`/negotiations/trade-operation/:id`) and canonical endpoints documented; wrappers now emit consistent `{ success, data, error }` objects typed via DTOs.
  - Expiring/metrics endpoints publish structured summaries (`ExpiringNegotiationsResponseDto`, `NegotiationMetricsResponseDto`).
- **Notes**
  - Controllers still return raw service payloads cast to DTO types; consider explicit mapping for stricter guarantees.
  - Guards currently absent; plan to re-enable once auth flow stabilizes.

## Transport
### Transport Main Controller (`backend/src/transport/controllers/transport-main.controller.ts`)
- Added DTO mappers and wrappers for common responses (available requests, transporter bids/jobs, admin list endpoints).
- Remaining nested structures are exposed as generic objects (`tradeOperation`, `transporter`); refine in Phase 1 if stricter contracts required.

### Transport Bidding Controller (`backend/src/transport/controllers/transport-bidding.controller.ts`)
- Uses dedicated DTOs already; revisit once we align main controller mapping.

## Transport Company (`backend/src/transport-company/transport-company.controller.ts`)
- Registration, verification, linking transporters. Mixed guards (some require `ADMIN`, others open). Document expected roles and ensure request DTOs have Swagger metadata.

## Inspection (`backend/src/inspections/inspection.controller.ts`)
- Request creation, assignment, updates. Confirm response DTOs exist; currently service returns Prisma objects.

## Buyer (`backend/src/buyer/buyer.controller.ts`)
- Listings CRUD, offers/trades/stats. Auth guard commented out; route responses often raw arrays.

## Seller (`backend/src/seller/seller.controller.ts`)
- Listing creation, products, offers, trades, stats. Guard active. Need DTO annotation.

## Onboarding (`backend/src/onboarding/onboarding.controller.ts`)
- Submits onboarding data, status retrieval. Responses likely in `dto`; confirm Swagger decorators.

## Auth (`backend/src/auth/auth.controller.ts`)
- Login/register, refresh, Google, profile. Many endpoints returning raw objects; ensure `@ApiResponse` types and consistent property names (`token` vs `accessToken`).

## Notifications, Pricing, Products, Inspector Modules
- Additional controllers with basic CRUD/list endpoints; confirm they appear in OpenAPI and add missing metadata.

---

### TODOs from Audit
- [ ] Add response DTOs for ad-hoc objects in trade operations (`getProfit`, `addSellers`, `optimizeTransport`, `finalize`).
- [ ] Document expected auth/roles even if guards disabled.
- [ ] Create DTOs for profit history/comparison responses.
- [ ] Ensure negotiation endpoints expose DTOs for summary/detail responses.
- [ ] Review transport main endpoints for DTO coverage (price per km/distance fields).
- [ ] Confirm inspection/buyer/seller/onboarding/auth controllers have full Swagger metadata.

This file will be updated as each controller is annotated and OpenAPI output is validated.
