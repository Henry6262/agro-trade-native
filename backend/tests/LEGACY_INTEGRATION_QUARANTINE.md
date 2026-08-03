# Legacy integration quarantine

`jest.integration.config.js` deliberately excludes the suites below by exact path. They predate the
dedicated integration harness: until 2026-08-01, `npm run test:integration` was only an alias for
Jest's `*.e2e-spec.ts` suite, so none of these `tests/integration` or `tests/contract` files ran in
CI.

The maintained contract suite remains fail-closed. The ignore list names each legacy file
explicitly, so every new integration or contract spec is discovered automatically and a quarantined
suite can re-enter by removing just its path.

| Suite                                            | Why it cannot run against the current application                                                       | Re-entry criteria                                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `integration/counter-offer-scenarios.spec.ts`    | Sends literal placeholder JWTs, so the real auth guard rejects every HTTP scenario.                     | Use `TestEnvironment` tokens and assert the canonical `/negotiations/:id/counter` response/schema.   |
| `integration/expiration-handling.spec.ts`        | Calls the removed `/jobs/process-expirations` API and writes deleted `extensionCount` state.            | Exercise the current scheduler/service boundary with valid JWTs and current expiry fields.           |
| `integration/multi-seller-coordination.spec.ts`  | Relies on removed scenario orchestration endpoints and obsolete trade-operation fields.                 | Rebuild around current seller matching/offer endpoints and Prisma relations.                         |
| `integration/multi-seller-negotiation.spec.ts`   | Creates fixtures with deleted Prisma fields and uses literal placeholder JWTs.                          | Build current relational fixtures and authenticate through `TestEnvironment`.                        |
| `integration/negotiation-flow-complete.spec.ts`  | Uses literal placeholder JWTs; the real auth guard correctly returns 401.                               | Issue tokens for each seeded actor and use current canonical negotiation routes.                     |
| `integration/price-scenarios.spec.ts`            | Targets the removed scenario-generation controller and deleted estimation schema.                       | Restore a supported scenario API or rewrite against the current profit calculation service.          |
| `integration/profit-calculation-flow.spec.ts`    | Targets removed profit/scenario endpoints and creates `deliveryAddress`/other deleted scalar fields.    | Use `/profit/:tradeOperationId/calculate`, current address relations, and valid tokens.              |
| `integration/trade-flow-complete.spec.ts`        | Uses literal placeholder JWTs and removed transport/trade phase APIs.                                   | Re-author the flow with `TestEnvironment`, current DTOs, and supported phase transitions.            |
| `integration/transport-optimization.spec.ts`     | Calls old `/transport/estimate-cost` and GET `/transport/optimize-route` contracts.                     | Use POST `/transport/estimate` and POST `/transport/optimize-route` with current DTOs.               |
| `integration/withdrawal-rejection-flows.spec.ts` | Uses placeholder JWTs, writes deleted `rejectionReason`, and calls removed analysis/bulk-withdraw APIs. | Use real actor tokens/current fields and replace removed flows with supported negotiation responses. |
| `contract/trade-scenarios.spec.ts`               | Contracts a `/scenarios/generate` controller that was removed from `TradeOperationsModule`.             | Restore an owned scenario endpoint or replace this contract with the supported profit API.           |

Quarantine is not evidence that these capabilities work. It records test debt without allowing
obsolete, previously dormant specifications to misreport a product regression in the maintained CI
gate.
