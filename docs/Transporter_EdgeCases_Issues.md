# Transporter Edge Cases & Issues Roadmap

> Generated: 2026-03-26 | Role: TRANSPORTER | Status: PARTIAL (per GAP_REPORT.md)
> Related Issues: #19, #20, #21, #22, #23, #24

---

## Current State Analysis

Per GAP_REPORT.md Mobile App Audit:
- **Onboarding**: Present (TransporterOnboardingFlow)
- **Core Dashboard**: BiddingTab + ActiveJobsTab
- **API Wiring**: Mostly complete - missing GPS updates, incomplete bid form
- **Status**: PARTIAL

### What Works (per GAP_REPORT.md)
1. Transporter active job actions - `startJob`, `completePickup`, `completeDelivery` correctly wired
2. Transporter bidding - `GET /transport/requests/available` and `POST /transport/bids` called correctly
3. DashboardMainScreen role routing correctly mounts transporter dashboard
4. Backend transport flow (create-transport, start-job, complete-delivery) sets `phase = DELIVERED`
5. Transport bidding competition (create-request, submit-bid, select-bid) correctly rejects losing bids

### Known Gaps (from GAP_REPORT.md)
- **MG-9 (P1)**: Bid form hardcodes `estimatedDuration: 24`, `vehicleType: 'FLATBED'`, `vehicleCapacity: 40`
- **MG-10 (P2)**: GPS location tracking was not implemented (now fixed with `expo-location` polling)
- **Backend Gap-7**: Only 1 transporter in seed data (now fixed - 2nd transporter added)

---

## Issue #19 — Offline & Retry Logic
**Priority: P1 | Effort: Medium**

### Bid Submission Offline
- [ ] Queue bid locally when `POST /transport/bids` fails due to network
- [ ] Auto-retry with exponential backoff (1s, 2s, 4s, max 30s)
- [ ] Show pending indicator on queued bids
- [ ] Warn if bid is queued past `biddingDeadline` expiry
- [ ] Handle 409 conflict if bid was already submitted
- [ ] Handle 400 if transport request was already awarded while offline

### Job Actions Offline
- [ ] Queue `POST /transport/jobs/:id/start` if offline at pickup location
- [ ] Queue `POST /transport/jobs/:id/pickup` if offline after loading
- [ ] Queue `POST /transport/jobs/:id/delivery` if offline at delivery point
- [ ] Timestamp each queued action locally for audit trail
- [ ] Process queue in FIFO order on reconnection
- [ ] Block out-of-order actions (can't complete delivery before pickup)

### GPS Location Updates Offline
- [ ] Buffer GPS coordinates locally when `PUT /transport/jobs/:id/location` fails
- [ ] Batch-send buffered locations on reconnection (max 50 per request)
- [ ] Continue `expo-location` polling even when offline
- [ ] Show "Last synced: X min ago" indicator in active job UI

---

## Issue #20 — Auth & Backend Error Handling
**Priority: P0 | Effort: Medium**

### Privy Auth Token Expiry
- [ ] Detect 401 during active job actions and trigger silent token refresh
- [ ] If refresh fails, redirect to login without losing job state
- [ ] Preserve in-progress delivery data (GPS buffer, timestamps) across re-auth
- [ ] Handle Privy OAuth callback failures gracefully

### Backend HTTP Error Responses
- [ ] `400` on bid submission - show field-level validation errors
- [ ] `404` on job action - transport request was cancelled/deleted
- [ ] `409` on bid - duplicate bid for this transporter+request
- [ ] `403` - transporter not assigned to this job
- [ ] `500` - generic retry with user-friendly error toast
- [ ] Handle bid after `biddingDeadline` passed (backend 400)

### Job State Conflicts
- [ ] Handle job start when already started (idempotent)
- [ ] Handle delivery when job not in correct phase
- [ ] Handle job cancellation by admin while mid-delivery
- [ ] Show "Job cancelled" alert on cancelled status
- [ ] Handle race condition: two transporters accept same bid

---

## Issue #21 — Real-time Socket.io Notifications
**Priority: P1 | Effort: Medium**

### Transport Request Events
- [ ] Listen for `transport:new-request` on admin creates request
- [ ] Push notification with cargo description, locations
- [ ] Auto-refresh available requests list
- [ ] Handle background events (expo-notifications)
- [ ] Deduplicate repeated events

### Bid Status Events
- [ ] Listen for `transport:bid-accepted` / `transport:bid-rejected`
- [ ] Navigate to Active Jobs on acceptance
- [ ] Show rejection toast
- [ ] Handle status update for removed local state

### Job Status Events
- [ ] Listen for `transport:job-cancelled`
- [ ] Listen for `transport:delivery-confirmed`
- [ ] Listen for `transport:phase-changed`
- [ ] Optimistic local state update
- [ ] Reconcile with server on next API call

### Socket Connection
- [ ] Reconnect with exponential backoff
- [ ] Re-authenticate after token refresh
- [ ] Handle out-of-order events
- [ ] Queue missed events during disconnection
- [ ] Show connection status indicator

---

## Issue #22 — Bid Submission, Job Acceptance & Delivery Edge Cases
**Priority: P1 | Effort: Medium**

### Bid Form Validation (fixes MG-9)
- [ ] Validate bid price is positive and reasonable
- [ ] Replace hardcoded `vehicleType: 'FLATBED'` with dropdown
- [ ] Replace hardcoded `estimatedDuration: 24` with input
- [ ] Replace hardcoded `vehicleCapacity: 40` with input
- [ ] Add `expiresAt` field (default 24h)
- [ ] Validate capacity >= cargo weight
- [ ] Warn if bid below estimated fuel cost
- [ ] Prevent double-submit
- [ ] Handle empty/null required fields

### Bid Deadline
- [ ] Disable bid button when deadline passed
- [ ] Show countdown timer on request cards
- [ ] Handle race condition at deadline boundary
- [ ] Auto-remove expired requests
- [ ] Handle timezone mismatch

### Delivery Completion
- [ ] Require GPS proximity to delivery point
- [ ] Handle delivery API failure (retry)
- [ ] Prevent delivery without pickup
- [ ] GPS mismatch warning
- [ ] Show delivery receipt/summary
- [ ] Handle partial delivery

---

## Issue #23 — GPS Tracking, Navigation & Location Permissions
**Priority: P1 | Effort: High**

### Location Permissions
- [ ] Request foreground permission on first job start
- [ ] Request background permission for backgrounded app
- [ ] Handle permission denied (show explanation, manual check-in)
- [ ] Handle iOS permission levels (Once/While Using/Always)
- [ ] Re-request after revocation mid-delivery
- [ ] Settings deep-link if permanently denied

### Background Tracking
- [ ] Continue polling when app backgrounded
- [ ] Handle Android battery optimization
- [ ] Persistent notification (Android foreground service)
- [ ] Stop tracking on job complete/cancel
- [ ] Resume tracking after device restart

### GPS Accuracy
- [ ] Handle low accuracy readings
- [ ] Filter GPS jumps (>1km in <30s)
- [ ] Use `Location.Accuracy.High`
- [ ] Fallback to cell tower location
- [ ] Show accuracy indicator

### Navigation
- [ ] Google Maps/Waze deep link to pickup
- [ ] Google Maps/Waze deep link to delivery
- [ ] Handle no maps app installed
- [ ] Platform-aware `Linking.openURL`
- [ ] Show ETA based on distance

### Battery
- [ ] Reduce polling when stationary
- [ ] Increase polling near destinations
- [ ] Battery usage warning >4h
- [ ] Manual pause/resume tracking

---

## Issue #24 — Unit & UI Tests
**Priority: P2 | Effort: High**

### Screen Tests
- [ ] `BiddingTab.test.tsx` - requests list, empty state, loading
- [ ] `ActiveJobsTab.test.tsx` - jobs list, status badges, actions
- [ ] `TransporterOnboardingFlow.test.tsx` - vehicle registration
- [ ] `RoleSelectionScreen.test.tsx` - transport option

### Hook & Service Tests
- [ ] `useTransporterBidding.test.ts` - fetches, submits, errors
- [ ] `useTransporterJobs.test.ts` - fetches, phase mapping
- [ ] `transportService.test.ts` - API methods, types
- [ ] `useLocationTracking.test.ts` - polling, buffer, start/stop

### Critical Path Tests
- [ ] Bid submission flow end-to-end
- [ ] Job lifecycle: start -> pickup -> delivery -> complete
- [ ] GPS tracking: start -> send -> stop

### Regression Tests
- [ ] NativeWind component snapshots for Transporter dashboard
- [ ] Dark mode renders correctly
- [ ] Responsive layout on small screens (320px width)

### Target Coverage
- Unit tests: 50%+ (per ARCHITECTURE.md Section 8)
- Critical path tests: 100% (bid, job lifecycle, GPS)
- Framework: Jest + React Native Testing Library + MSW

---

## Summary

| # | Issue | Priority | Effort | Key Risk |
|---|-------|----------|--------|----------|
| 1 | Offline & Retry Logic | P1 | Medium | Data loss on network drop |
| 2 | Auth & Error Handling | P0 | Medium | White screen / blocked login |
| 3 | Real-time Socket.io | P1 | Medium | Stale data / missed jobs |
| 4 | Bid & Delivery Edge Cases | P1 | Medium | Invalid bid data / wrong delivery |
| 5 | GPS & Navigation | P1 | High | No tracking / battery drain |
| 6 | Unit & UI Tests | P2 | High | Regression bugs |

## Affected Files Matrix

| File | #19 | #20 | #21 | #22 | #23 | #24 |
|------|-----|-----|-----|-----|-----|-----|
| `useTransporterBidding.ts` | X | X | X | X | | X |
| `useTransporterJobs.ts` | X | X | X | | X | X |
| `transportService.ts` | X | X | | | X | X |
| `socketService.ts` | | | X | | | |
| `useAuthStore.ts` | | X | | | | |
| `offlineQueue.ts` (new) | X | | | | | |
| `useLocationTracking.ts` (new) | | | | | X | X |
| `gpsFilter.ts` (new) | | | | | X | |
| `BidForm.tsx` (new) | | | | X | | X |

## Implementation Order

1. **#20** (P0) — Auth error handling (unblocks all other work)
2. **#22** (P1) — Bid form fixes (removes hardcoded defaults)
3. **#19** (P1) — Offline queue (prevents data loss)
4. **#21** (P1) — Socket.io events (real-time updates)
5. **#23** (P1) — GPS tracking hardening (permissions, accuracy)
6. **#24** (P2) — Tests (validates all above work)
