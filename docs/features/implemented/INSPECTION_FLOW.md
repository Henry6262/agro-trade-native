# Inspection Flow – Current State

## Overview
The inspection workflow now covers the full admin-facing lifecycle: pending sellers automatically receive inspection requests, operators can assign inspectors, track progress on a live map, and record pass/fail outcomes that feed directly into trade operations and transport gating.

## What’s Implemented
1. **Auto-request creation**
   - `NegotiationService.acceptOffer` triggers `autoCreateInspection`, setting priority by buyer urgency.
   - New `NegotiationExpiryService` cron ensures expired negotiations fall out so inspection scope stays accurate.
2. **Inspector roster API**
   - `/inspections/inspectors` now returns workload, default location (lat/lng), and last activity, sourced from user addresses.
3. **Matching dashboard integration**
   - Seller cards display inspection status badges.
   - Queue panel lists every inspection per trade, with actions to assign inspectors, pass, or fail.
   - `AssignInspectorModal` suggests nearest inspectors on a Leaflet map and posts to `/inspections/:id/assign`.
   - `CompleteInspectionModal` submits results to `/inspections/:id/results`, flips `tradeSeller.isVerified`, and refreshes state.
4. **Inspector overview page (`/inspections`)**
   - Map renders every inspector simultaneously.
   - Roster cards show current workload; selecting one highlights missions and next destination.
   - Mission queue includes quick pass/fail buttons that reuse the shared completion modal.

## Data & Endpoints
- Backend changes live in `backend/src/inspections`: service/controller/DTO now expose lat/lng, workload, and accept result submissions.
- Frontend API additions are in `admin-dashboard/src/services/api.ts` (`inspectionService.getInspectors`, `.assignInspector`, `.submitResult`, `.list`).
- Shared types: `admin-dashboard/src/types/index.ts` (`SellerInspectionStatus`, `SubmitInspectionResultPayload`) and `features/inspections/types.ts`.

## Remaining Work / Open Questions
1. **Inspector mobile portal**
   - React Native hub (existing multi-role app) still needs the assignment list, navigation, and result submission UI.
   - Should consume the same endpoints (`/api/inspector/...`) and eventually push live location updates.
2. **Notifications & SLAs**
   - No automated reminders for overdue inspections yet (backend cron could emit notifications/Slack).
   - Need to define how long inspectors have before reassignment triggers.
3. **Transport gating UX**
   - Trade details currently rely on `isVerified`, but we may want explicit alerts/CTA when all inspections pass to move into transport matching.

## Suggested Next Steps
1. **Decide focus:**
   - a) Begin inspector-facing React Native work so inspectors can self-manage missions.
   - b) Move forward in the trade-operation pipeline (transport matching & logistics orchestration) now that verification is enforced.
2. **If choosing transport next:**
   - Audit `TransportManagementPanel` and `/transport` APIs.
   - Ensure we gate new transport requests when unverified sellers remain.

This document captures the latest inspection logic so other agents can pick up at the appropriate layer (mobile inspector UI or transport phase) without re-discovery.***
