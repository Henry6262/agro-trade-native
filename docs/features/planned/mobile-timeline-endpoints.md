# Planned Feature: Mobile Timeline Endpoints

**Last Updated**: 2025-11-17
**Owner**: @backend / @mobile

## Goal
Provide lightweight timeline feeds for buyer and seller dashboards so React Query hooks can replace current mock data. Timelines must summarize the latest trade/offer events without fetching the entire `trade-operations` payload.

## Proposed Endpoints
### 1. Buyer Timeline
- `GET /buyer/timeline`
- Query params: `limit` (default 20), `cursor` for pagination.
- Response: list of events `{ id, type (REQUEST|TRADE|INSPECTION), title, status, timestamp, tradeOperationId }`.
- Source data: joins `tradeOperation`, `offerNegotiation`, and `notifications` filtered by buyer user ID.

### 2. Seller Timeline
- `GET /seller/timeline`
- Same shape as buyer timeline but filtered by seller user ID.
- Includes events like “Offer accepted”, “Inspection scheduled”, “Transport assigned”.

### Implementation Notes
- Reuse `tradeOperationService.getTradeOperationSummary` logic but project only necessary fields.
- Store computed events in a dedicated view helper or SQL view to avoid heavy Prisma includes.
- Enforce auth via existing JWT guards; use `req.user.id` for filtering.
- Document DTOs in `buyer/dto` and `seller/dto` folders to keep rulebook compliance.

### Open Questions
- Should timelines include transport/inspection events for sellers, or limit to offer/trade milestones?
- Do we need `POST /buyer/timeline/read` for read receipts? (Out of scope for now.)

## Status
- 2025-11-17: Initial implementation shipped (`GET /buyer/timeline`, `GET /seller/timeline`) with pagination and basic metadata. Mobile can now consume real timeline data; future iterations may expand event types (transport/inspection) based on usage.
