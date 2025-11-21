# TRADE-OPS-001 Blueprint

**Epic**: Trade Operation Management (004)
**Story**: Inspection Orchestration – Location-Aware Inspection Workflow
**Status**: Not Started
**Last Updated**: 2025-11-15
**Owner**: TBD

---

## Feature Overview

Establish a location-aware inspection workflow that binds seller acceptance → inspection verification → transport readiness. Admins get a single actionable queue, inspectors receive assignments based on proximity and workload, and transport is gated until required inspections pass.

**User Story:**
As an admin, I want inspections to be automatically created when sellers accept offers, assigned based on inspector proximity, and tracked through completion so that transport can only proceed when sellers are verified.

---

## Acceptance Criteria

### Must Have
1. ✅ **Auto-create inspections**: When a seller accepts an offer, an inspection request is automatically created with status `PENDING`
2. ✅ **Inspection queue**: Admin dashboard shows all accepted sellers awaiting inspection in a dedicated panel
3. ✅ **Inspector assignment**: Admin can assign inspectors via a modal showing inspector locations, distances, and current workload
4. ✅ **Status tracking**: Seller cards display inspection status (Pending, Assigned, In Progress, Passed, Failed)
5. ✅ **Inspector execution**: Inspector can receive assignment, visit site, upload results (pass/fail + photos)
6. ✅ **Transport gating**: Transport request button is disabled until required inspections are `PASSED`
7. ✅ **Failed inspection handling**: Failed inspections trigger seller status change and alert admins to find replacement sellers

### Should Have
8. ⭕ **Inspector roster endpoint**: `/inspectors` returns inspector data (id, name, location, availability, open assignments)
9. ⭕ **Auto-expiry**: Cron job marks overdue inspections as escalated
10. ⭕ **Notifications**: Emit events on assignment, pass/fail, overdue

### Nice to Have
11. ⬜ **Inspector portal**: Lightweight web/mobile screen for inspectors to view assignments and submit results
12. ⬜ **Live location tracking**: Real-time inspector location updates
13. ⬜ **Auto-assignment algorithm**: Automatic inspector assignment based on proximity + workload

---

## Components & Services Touched

### Backend (`backend/`)
- `src/negotiations/services/negotiation.service.ts` – add `autoCreateInspection` hook on offer acceptance
- `src/inspections/inspections.module.ts` – extend with assignment/result endpoints
- `src/inspections/inspections.service.ts` – implement assign, submit result, update verification status
- `src/inspections/inspections.controller.ts` – add endpoints:
  - `POST /inspections/:id/assign` { inspectorId }
  - `POST /inspections/:id/result` { status, notes, photos }
  - `GET /inspections` (with filters: tradeOperationId, status, priority)
- `src/inspectors/inspectors.module.ts` (new) – manage inspector roster
- `src/inspectors/inspectors.controller.ts` (new) – `GET /inspectors` endpoint
- `src/inspectors/inspectors.service.ts` (new) – inspector data + location queries
- `src/trade-operations/services/trade-operation.service.ts` – extend `getById` to include inspection data per tradeSeller
- `src/trade-sellers/entities/trade-seller.entity.ts` – verify `isVerified` field updates on inspection pass

### Admin Dashboard (`admin-dashboard/`)
- `src/features/matching/components/MatchingDashboard/OffersTrackingPanel.tsx` – add inspection status badges to seller cards
- `src/features/matching/components/MatchingDashboard/InspectionQueuePanel.tsx` (new) – dedicated inspection queue panel
- `src/features/matching/components/MatchingDashboard/InspectorAssignmentModal.tsx` (new) – modal for assigning inspectors with map
- `src/features/operations/components/TradeOperationDetail/InspectionTab.tsx` (new) – detailed inspection timeline per seller
- `src/features/operations/components/TransportManagementPanel/TransportManagementPanel.tsx` – add gating logic (disable transport button until inspections pass)
- `src/services/inspection.service.ts` (new) – API client for inspection endpoints
- `src/types/inspection.ts` (new) – TypeScript interfaces for inspection data

### Mobile App (`front-end/`) – Phase 2
- `src/screens/inspector/InspectorAssignmentsScreen.tsx` (new) – list of assigned inspections
- `src/screens/inspector/InspectionDetailScreen.tsx` (new) – checklist, photo upload, submit result
- `src/services/inspectionService.ts` (new) – API calls for assignments and results

---

## API & Data Contracts

### New Endpoints

**GET `/inspections`**
Query params: `tradeOperationId`, `status`, `priority`, `assignedInspectorId`
Response:
```typescript
{
  data: InspectionRequest[],
  pagination: { total, page, limit }
}
```

**POST `/inspections/:id/assign`**
Request body:
```typescript
{
  inspectorId: string
}
```
Response:
```typescript
{
  id: string,
  status: 'ASSIGNED',
  assignedInspector: { id, name },
  updatedAt: string
}
```

**POST `/inspections/:id/result`**
Request body:
```typescript
{
  status: 'PASSED' | 'FAILED',
  notes: string,
  photos: string[],  // URLs to uploaded photos
  qualityScore?: number,
  failureReasons?: string[]
}
```
Response:
```typescript
{
  id: string,
  status: 'PASSED' | 'FAILED',
  tradeSeller: {
    isVerified: boolean,
    status: string
  }
}
```

**GET `/inspectors`**
Response:
```typescript
{
  data: Inspector[]
}

interface Inspector {
  id: string,
  name: string,
  email: string,
  phone: string,
  lastKnownLocation?: { lat: number, lng: number },
  availability: 'AVAILABLE' | 'BUSY' | 'OFFLINE',
  openAssignmentsCount: number
}
```

### DTOs

**InspectionRequest**
```typescript
interface InspectionRequest {
  id: string,
  tradeOperationId: string,
  tradeSellerId: string,
  saleListingId: string,
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PASSED' | 'FAILED',
  priority: 'HIGH' | 'MEDIUM' | 'LOW',
  assignedInspectorId?: string,
  assignedInspector?: Inspector,
  dueDate: string,
  notes?: string,
  photos?: string[],
  qualityScore?: number,
  createdAt: string,
  updatedAt: string
}
```

### Database Schema Changes

**`InspectionRequest` table** (likely already exists, verify fields):
- `tradeOperationId` (FK to TradeOperation)
- `tradeSellerId` (FK to TradeSeller)
- `saleListingId` (FK to SaleListing)
- `status` (enum: PENDING, ASSIGNED, IN_PROGRESS, PASSED, FAILED)
- `priority` (enum: HIGH, MEDIUM, LOW)
- `assignedInspectorId` (FK to User where role = INSPECTOR, nullable)
- `dueDate` (timestamp)
- `notes` (text, nullable)
- `photos` (json array of URLs, nullable)
- `qualityScore` (int, nullable)

**`User` table additions** (for inspectors):
- Ensure `role` enum includes `INSPECTOR`
- Add `availability` field (enum: AVAILABLE, BUSY, OFFLINE)
- Add `lastKnownLocation` (json: {lat, lng}, nullable)

---

## Test Plan

### Unit Tests

**Backend:**
- `negotiation.service.spec.ts`:
  - `acceptOffer()` calls `autoCreateInspection()`
  - Inspection created with correct `tradeSellerId`, `saleListingId`, status `PENDING`
- `inspections.service.spec.ts`:
  - `assignInspector()` updates status to `ASSIGNED`, sets `assignedInspectorId`
  - `submitResult()` with status `PASSED` sets `tradeSeller.isVerified = true`
  - `submitResult()` with status `FAILED` sets `tradeSeller.status = FAILED_INSPECTION`
  - Overdue inspection detection (cron job logic)
- `inspectors.service.spec.ts`:
  - `getAll()` returns inspectors with location, availability, open assignments count

**Frontend:**
- `InspectionQueuePanel.test.tsx`: renders pending inspections, shows assign button
- `InspectorAssignmentModal.test.tsx`: displays inspectors on map, handles assignment
- `TransportManagementPanel.test.tsx`: transport button disabled when inspections pending

### Integration Tests

**Backend (`backend/test/integration/`):**
- `inspection-workflow.e2e-spec.ts`:
  1. Create trade operation with 3 sellers
  2. Sellers accept offers
  3. Verify 3 inspection requests auto-created with status `PENDING`
  4. Assign inspector to inspection
  5. Verify status updated to `ASSIGNED`
  6. Submit inspection result with status `PASSED`
  7. Verify `tradeSeller.isVerified = true`
  8. Verify transport button enabled
  9. Submit inspection result with status `FAILED` for another seller
  10. Verify `tradeSeller.status = FAILED_INSPECTION`
  11. Verify transport button still disabled (not all inspections passed)

**Admin Dashboard (manual/E2E):**
- Navigate to Matching Dashboard → verify Inspection Queue Panel shows pending inspections
- Click "Assign Inspector" → modal shows inspectors with locations and workload
- Assign inspector → verify seller card shows "Assigned to [Name]"
- Navigate to Trade Operation Detail → Inspection Tab shows timeline
- Submit inspection result → verify seller status updates
- Verify transport button disabled until all required inspections pass

---

## Data Setup & Test Scenarios

Use `TestDataFactory` to create:
1. **Trade operation with 3 sellers** (2 unverified, 1 pre-verified)
2. **3 inspectors** with varying locations and availability
3. **Accepted offers** triggering auto-inspection creation

**Scenario 1: Happy Path**
- All inspections assigned and passed → transport enabled

**Scenario 2: Failed Inspection**
- 1 inspection fails → admin notified, transport blocked, replacement seller workflow triggered

**Scenario 3: Overdue Inspection**
- Inspection not completed by `dueDate` → escalated/marked overdue

---

## Rollout Considerations

### Feature Flags
- `ENABLE_AUTO_INSPECTION_CREATION`: Toggle auto-creation on offer acceptance (default: true)
- `ENABLE_TRANSPORT_GATING`: Enforce transport gating (default: true)

### Migrations
- **Database migration** to add/verify `InspectionRequest` table fields
- **Data migration** (if needed) to backfill any existing accepted sellers with pending inspections

### Deployment Steps
1. Deploy backend with new endpoints + auto-creation logic
2. Run database migration
3. Deploy admin dashboard with inspection queue + modals
4. Test end-to-end flow in staging
5. Enable feature flags in production
6. Monitor for auto-created inspections + transport gating

### Monitoring
- Track inspection creation rate (should match offer acceptance rate)
- Monitor average time from `PENDING` → `ASSIGNED` → `PASSED`
- Alert on overdue inspections (>24 hours past `dueDate`)
- Track failed inspection rate

### Rollback Plan
- Disable `ENABLE_AUTO_INSPECTION_CREATION` to stop auto-creation
- Disable `ENABLE_TRANSPORT_GATING` to unblock transport (manual verification)
- Revert database migration if needed

---

## Open Questions

1. **Inspection requirement**: Do all accepted sellers require inspection, or can admins mark certain listings as "inspection waived"?
   _Recommendation_: Start with all sellers requiring inspection; add waiver feature in Phase 2.

2. **Inspection priority**: How to prioritize (due date based on buyer delivery vs. fixed SLA)?
   _Recommendation_: Use buyer `neededBy` date minus transport time to calculate `dueDate`.

3. **Auto-assignment**: Should assignment happen immediately or remain manual for now?
   _Recommendation_: Keep manual for Phase 1; implement auto-assignment algorithm in Phase 2 after gathering inspector performance data.

4. **Notification channels**: Email/Slack/push for inspector alerts?
   _Recommendation_: Phase 1 = in-app notifications only; Phase 2 = add email/SMS.

---

## Dependencies

- ✅ Negotiation service (offer acceptance triggers inspection)
- ✅ Trade operation detail view (display inspection status)
- ⬜ Inspector user accounts & roster (requires inspector onboarding)
- ⬜ Photo upload service (for inspection results with photos)

---

## Follow-Up Stories

**TRADE-OPS-002: Transport Flow** – depends on inspection completion
**TRADE-OPS-003: Inspector Portal (Phase 2)** – mobile/web UI for inspectors
**TRADE-OPS-004: Auto-Assignment Algorithm** – proximity + workload optimization
**TRADE-OPS-005: Inspection Analytics Dashboard** – performance metrics & SLA tracking

---

**Blueprint Status**: Ready for Plan Mode review and approval.
