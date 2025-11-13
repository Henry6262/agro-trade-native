# Inspection Orchestration Plan

## Objective
Establish a location-aware inspection workflow that binds seller acceptance → inspection verification → transport readiness. The goal is to give admins a single, actionable queue while letting inspectors receive assignments based on proximity and workload.

---

## Desired Flow (High Level)
1. **Offer accepted**  
   - Automatically create an inspection request for that seller/listing.
   - Seller card immediately shows “Inspection Pending”.
2. **Admin triage (Matching dashboard)**  
   - Dedicated “Inspection Queue” lists every accepted seller awaiting inspection.  
   - Admin assigns an inspector via a modal that shows inspector locations + workloads.  
3. **Inspector execution**  
   - Inspector receives assignment (mobile/web), visits site, uploads results (pass/fail + photos).  
4. **Operations follow-through**  
   - TradeDetails view shows inspection status per seller and blocks transport until required inspections are passed.  
   - Failed inspections trigger replacement seller workflow.

---

## Backend Requirements
1. **Inspection Request Lifecycle**
   - Create request automatically on negotiation acceptance (`NegotiationService.acceptOffer` → `autoCreateInspection`).  
   - Fields: `saleListingId`, `tradeSellerId`, `status`, `priority`, `dueDate`, `assignedInspectorId`.  
   - Status progression: `PENDING → ASSIGNED → IN_PROGRESS → PASSED/FAILED`.  
   - Failed status should set `tradeSeller.status = FAILED_INSPECTION` and alert admins.

2. **Inspector Data**
   - `/inspectors` endpoint returning: id, name, lastKnownLocation (lat/lng), availability, open assignments count.  
   - Trackers feed location updates into this table.

3. **Assignment & Results APIs**
   - `POST /inspections/:id/assign` { inspectorId }.  
   - `POST /inspections/:id/result` { status, notes, photos }.  
   - Responses should update `tradeSeller.isVerified` when status is PASSED.

4. **Auto-expiry / reminders**
   - Cron job to mark overdue inspections as `FAILED` or escalate (initially just log + notify).  
   - Notifications emitted on assignment, pass/fail, overdue.

---

## Frontend Requirements
### Matching Dashboard
1. **Seller Card Badges**  
   - Extend current status pill to include inspection state (Pending, Assigned to X, Passed, Failed).
2. **Inspection Queue Panel**  
   - Lists accepted sellers awaiting inspection.  
   - Shows recommended inspector (nearest) with distance and workload.  
   - Buttons: “Assign Inspector”, “Record Result”.  
   - Modal uses map to show seller + inspectors.

### Trade Operations Detail
1. **Inspection Tab/Section**  
   - Timeline per seller: Offer → Inspection → Transport.  
   - Detailed inspector info, notes, photos.  
   - Actions to reassign inspector, override result (until inspector UI exists).
2. **Transport gating**  
   - Transport request button disabled until required inspections are PASSED (or explicitly waived).

### Inspector UI (Phase 2)
1. Lightweight web/mobile screen listing assigned inspections with map + checklist.  
2. Ability to start/stop jobs, upload photos, submit pass/fail.  
3. Live location updates (from tracker or manual check-in).

---

## Data Plumbing
1. Extend `tradeOperationService.getById` to include inspectionRequests per tradeSeller.  
2. Matching dashboard builds `inspectionStatusMap` similar to negotiations.  
3. Add `inspectionService` client for assignment/result APIs.

---

## Implementation Steps
1. **Backend audit & fixes**  
   - Ensure `autoCreateInspection` calls inspection module.  
   - Add inspector roster endpoint.  
   - Implement assign/result APIs with validation & notifications.
2. **Frontend plumbing**  
   - Fetch inspection data with trade operation details.  
   - Build queue panel + modals, badges on seller cards.
3. **Operations UI updates**  
   - Inspection tab in TradeDetails, transport gating.  
   - Manual result entry until inspector portal complete.
4. **Inspector-facing UI (phase 2)**  
   - Mobile-friendly page for assignments & result submission.

---

## Open Questions
1. Do all accepted sellers require inspection, or can admins mark certain listings as “inspection waived”?  
2. How do we prioritize inspections (due date based on buyer delivery vs. fixed SLA)?  
3. Should auto-assignment happen immediately or remain a manual confirmation step for now?  
4. Notification channels (email/Slack/push) for inspector alerts?

Answering these will help finalize the assignment algorithm and SLA rules before implementation.
