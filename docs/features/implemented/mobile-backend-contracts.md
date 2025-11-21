# Mobile Backend Contracts

**Last Updated**: 2025-11-17

This inventory maps the mobile app’s Page → Section → Feature hierarchy to the backend endpoints that exist today. Status labels:
- **Live** – Endpoint exists and returns typed DTOs; mobile can consume it.
- **Partial** – Endpoint exists but needs response/authorization alignment for mobile stories.
- **Missing** – No endpoint yet; implementation required.

## Onboarding
| Mobile Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Seller onboarding wizard | `POST /onboarding/seller` | Live | Saves seller profile/company data then calls `completeOnboarding` (`backend/src/onboarding/onboarding.controller.ts`). |
| Buyer onboarding wizard | `POST /onboarding/buyer` | Live | Mirrors seller onboarding for buyers. |
| Transporter onboarding wizard | `POST /onboarding/transporter` | Live | Captures fleet + insurance data for transporter onboarding. |
| Onboarding status sync | `GET /onboarding/status` | Live | Returns company, addresses, trucks so mobile can resume onboarding across roles. |

## Buyer Dashboard & Requests
| Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Requests/orders list | `GET /buyer/listings`, `GET /buyer/listings/:id` | Live | Supports optional `includeTradeOps` flag; used by Orders + Request detail screens. |
| Create/update/cancel request | `POST /buyer/listings`, `PATCH /buyer/listings/:id`, `PATCH /buyer/listings/:id/status` | Live | Drives RequestCreation wizard and cancellation UI. |
| Offers & trades tabs | `GET /buyer/offers`, `GET /buyer/trades` | Live | Returns `BuyerOfferSummaryDto` rows for Offers/Trades lists. |
| Buyer stats cards | `GET /buyer/stats` | Live | Provides totals for Active requests, pending offers, completed trades. |
| Timeline / history feed | `GET /buyer/timeline` | Live | Returns lightweight trade-operation events (status, phase, latest negotiation); supports `limit` + `cursor` pagination. |

## Seller Dashboard & Listings
| Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Listing management | `GET /seller/listings`, `GET /seller/listings/:id`, `POST /seller/listings`, `PATCH /seller/listings/:id/status` | Live | Returns listing/spec templates used for Products & Offers tabs. |
| Product catalog & metadata | `GET /seller/products` | Live | Source for shared product cards + filters. |
| Offers & trades feeds | `GET /seller/offers`, `GET /seller/trades` | Live | Used by Offers/Trades sections and shared order cards. |
| Seller stats | `GET /seller/stats` | Live | Supplies KPI cards for the dashboard hero. |
| Timeline feed | `GET /seller/timeline` | Live | Summarizes trade + negotiation events for the seller’s listings; supports pagination. |

## Transporter Experience
| Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Admin transport requests feed | `GET /transport/requests`, `GET /transport/requests/:id` | Live | Full request payload includes pickup/delivery coordinates for shared cards. |
| Admin bids view | `GET /transport/bids`, `GET /transport/requests/:requestId/bids` | Live | Hook into Offer & Requests sections. |
| Admin job list | `GET /transport/jobs` | Live | Drives Jobs/Transfers tabs + map drawer. |
| Transporter self-service APIs | `GET /transport/requests/available`, `GET /transport/requests/:id`, `GET /transport/requests/:id/bids`, `GET /transport/my-bids`, `GET /transport/my-jobs`, `GET /transport/me/analytics` | Live | Exposed under `transport-main.controller.ts` for transporter role dashboards (analytics endpoint returns scoped win-rate/active jobs metrics). |
| Job actions | `POST /transport/jobs/:id/accept`, `POST /transport/jobs/:id/complete` | Live | Bidding controller methods power Accept/Complete CTA in mobile flows. |
| Analytics (bid comparison, transporter performance) | `GET /transport/analytics/bid-comparison/:requestId`, `GET /transport/analytics/transporter-performance/:transporterId` | Partial | Admin-focused; transporters should rely on `GET /transport/me/analytics` for scoped stats. |
| Cost estimator | `POST /transport/estimate` | Partial | Returns estimation but UI still using mocks; align DTO + hook up store. |

## Inspector Dashboard
| Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Available jobs list | `GET /api/inspector/jobs` | Live | Supports filters; feed for AvailableJobs tab. |
| Job detail | `GET /api/inspector/jobs/:id` | Live | Returns shipment, pickup, and inspection requirements. |
| Accept job | `POST /api/inspector/jobs/:id/accept` | Live | Kicks off Active Job flow. |
| Complete inspection | `POST /api/inspector/jobs/:id/complete` | Live | Updates inspection results + verification docs. |
| Location updates | `POST /api/inspector/jobs/:id/location` | Live | Stores inspector GPS for map drawer. |
| Current/active job shortcut | `GET /inspections/inspector/:id/active` | Live | Returns the inspector’s in-progress (or next scheduled) mission so mobile Active Job tab can fetch in a single call. |

## Shared / Trade Operations & Analytics
| Feature | Endpoint(s) | Status | Notes |
| --- | --- | --- | --- |
| Trade operations directory | `GET /trade-operations`, `GET /trade-operations/:id` | Live | Heavy payload; mobile may require trimmed DTO for overview cards. |
| Profit calculator | `GET /profit/:id/profit` | Live | Admin feature; mobile analytics may read-only. |
| Scenario planner | `POST /scenarios/generate`, `POST /scenarios/compare` | Live | Internal tool; not yet exposed to mobile. |
| Notifications & timeline | `GET /notifications` (via trade notes) | Partial | Currently exposes note text; need filtering + pagination for buyer/seller timeline feature. |

## Gaps & Next Steps
1. **Timeline feeds** – Build lightweight endpoints for buyer/seller timelines using trade operations + notifications data.
2. **Inspector active job** – Provide a single “current job” endpoint to simplify Active Job rendering.
3. **Scoped analytics** – Decide whether transporter mobile should call admin analytics or if scoped endpoints are required.
4. **DTO tightening** – Several endpoints still return Prisma objects (`buyer/buyer.service.ts`, `seller/seller.service.ts`). As we wire React Query hooks, migrate them to DTOs per the frontend rulebook.
