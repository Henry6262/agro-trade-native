# Phase 1 – Backend Stabilization Backlog

| ID | Task | Code Reference | Acceptance Criteria |
|----|------|----------------|---------------------|
| B1 | Normalize seller scoring (price ratio bug) | `backend/src/trade-operations/services/trade-operation.service.ts:216` | Seller scores use price normalized to buyer max price; matching list orders correctly by best margin; regression test seeds low/high price sellers to confirm weighting. |
| B2 | Use correct transport cost relation in profit calc | `backend/src/trade-operations/services/profit-calculation.service.ts:329` | Profit report reflects latest `TransportCostCalculation`; unit test covers scenario with custom base rate. |
| B3 | Fix trade finalization status progression | `backend/src/trade-operations/services/trade-operation.service.ts:574` | Finalization transitions phase to `DELIVERED` then `COMPLETED`; buy listing status updates; regression test ensures lifecycle completes. |
| B4 | Implement PATCH `/trade-operations/:id` | `backend/src/trade-operations/controllers/trade-operation.controller.ts:207` | Endpoint updates whitelisted fields (phase, metadata, selling price); validation guards invalid transitions; Swagger doc updated. |
| B5 | Align transport-cost response DTO | `backend/src/transport/services/transport-cost.service.ts` & client expectations in `front-end/src/services/tradeOperationService.ts` | API returns `{ totalCost, breakdown, route }` schema documented in OpenAPI; RN admin UI reads new structure without undefined errors. |
| B6 | Seed realistic demo data | `backend/prisma/seed.ts` (new) | Running `npm run prisma:seed` creates users (admin, buyer, sellers, inspectors, transport companies), listings, and at least one trade per key phase. |
| B7 | Add bulk negotiation endpoint (if prioritized) | Currently missing; see `front-end/src/services/negotiationService.ts:188` | Endpoint exists, documented, and exercised by scenario tests; returns aggregate result used by Orchestrator. |
| B8 | Fix onboarding truck seed (`year` property mismatch) | `backend/src/onboarding/onboarding.service.ts:352` | TypeScript compile passes; `year` handled via metadata or removed; `npm run openapi:export` succeeds. |

> **Notes**
> - B7 is optional for the first sprint but required by the Orchestrator scenario runner. Include it once core fixes stabilize.
> - Each task should update the OpenAPI spec and include regression coverage (unit or integration) where practical.
