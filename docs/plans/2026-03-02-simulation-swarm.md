# AgroTrade Simulation Swarm Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy a role-based agent swarm that runs all 10 test scenarios end-to-end against the live backend, audits the mobile app and admin dashboard code for gaps, and fixes every P0/P1 issue found.

**Architecture:** Three parallel audit agents (backend runner, mobile auditor, dashboard auditor) produce a unified GAP_REPORT.md, then a sequential fix pass addresses all issues. Persistent `.claude/agents/` persona files are committed so any future session can step into a role interactively.

**Tech Stack:** NestJS/Prisma/PostgreSQL (backend, port 4000), React Native/Expo 52 (mobile), React 19/Vite 7/shadcn (admin dashboard, port 5173), axios for HTTP calls in scenario runner scripts.

---

## PHASE 1 — Parallel Audits (dispatch all 3 simultaneously)

---

### Task 1A: Backend Scenario Runner

Run all 10 scenarios from `docs/TEST_SCENARIOS.md` against `http://localhost:4000/api`. Log every step. Assert state after every step. Output findings to `docs/GAP_REPORT.md`.

**Files:**
- Create: `backend/src/scripts/run-all-scenarios.ts`
- Create: `docs/GAP_REPORT.md` (backend section)

**Step 1: Check backend is running**

```bash
curl -s http://localhost:4000/api/health || echo "BACKEND DOWN"
```

If down:
```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npm run build && node dist/main.js &
sleep 5
```

**Step 2: Write the scenario runner**

File: `backend/src/scripts/run-all-scenarios.ts`

The script must:
- Import axios and define `BASE_URL = 'http://localhost:4000/api'`
- Login as admin, seller1, buyer, and store tokens
- Call `GET /simulation/users/FARMER` and `GET /simulation/users/TRANSPORTER` to get real IDs
- Call `GET /products` to get a real productId
- Run each scenario in a `runScenario(name, steps)` wrapper that catches errors and records PASS/FAIL per step
- After all scenarios, write structured JSON results and human-readable summary
- Output failures in red with exact error message and HTTP status

Implement this structure:
```typescript
interface StepResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  assertion?: string;
  error?: string;
  responseStatus?: number;
  data?: any;
}

interface ScenarioResult {
  scenario: string;
  status: 'PASS' | 'FAIL';
  steps: StepResult[];
  duration: number;
}
```

For each scenario, run through the exact API call sequence from `docs/TEST_SCENARIOS.md`. Assert the following after key steps:
- After create-trade-operation: `phase === 'SELLER_MATCHING'`
- After send-offers: `negotiations[0].status === 'PENDING'`
- After accept-offer: check via `GET /simulation/trade-operation/:id/full-state` that `sellers[0].tradeSellerStatus === 'ACCEPTED'`
- After create-transport: `phase === 'IN_TRANSIT'`
- After complete-delivery: `phase === 'DELIVERED'`
- After finalize: `phase === 'COMPLETED'`

Run all 10 scenarios:
1. Happy Path (no inspection)
2. Counter-offer flow
3. Seller rejects offer
4. Inspection required (pass)
5. Inspection fail
6. Transport bidding competition
7. Cancel at INITIATION
8. Cancel mid-negotiation
9. Pricing update (quality dispute)
10. Cleanup test data

**Step 3: Run the scenario runner**

```bash
cd /Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native/backend
npx ts-node src/scripts/run-all-scenarios.ts 2>&1 | tee /tmp/scenario-run.log
```

**Step 4: Write backend section of GAP_REPORT**

File: `docs/GAP_REPORT.md`

Create with this structure:
```markdown
# AgroTrade Gap Report
*Generated: <timestamp>*

## BACKEND — Scenario Test Results

### Summary
- Scenarios run: 10
- PASSED: X
- FAILED: X

### Failures

#### [Scenario Name]
- **Step:** <step name>
- **Expected:** <expected state>
- **Got:** <actual response>
- **Priority:** P0 / P1 / P2
- **Fix needed:** <description of what needs to change>

### Missing Endpoints
...

### Logic Gaps
...
```

**Step 5: Commit**

```bash
git add backend/src/scripts/run-all-scenarios.ts docs/GAP_REPORT.md
git commit -m "feat: add scenario runner script and initial gap report"
```

---

### Task 1B: Mobile App Auditor

Read all mobile screens and compare against the 5 documented user journeys (Farmer, Buyer, Transporter, Inspector, Admin). Find every gap, missing screen, disconnected API call, and broken flow.

**Files to read:**
- `docs/ARCHITECTURE.md` — user journeys
- `docs/TEST_SCENARIOS.md` — exact flow steps
- `docs/API_REFERENCE.md` — all endpoints
- All files under `front-end/src/features/`
- `front-end/src/navigation/`

**Step 1: Map documented journeys vs. existing screens**

Read and cross-reference these screen directories against what should exist per the documented flows:

| Role | Expected Screens | Check Directory |
|------|-----------------|----------------|
| Seller/Farmer | Create listing, View offers, Accept/Counter/Reject, View active trades, Inspection status | `features/dashboard/screens/seller/` |
| Buyer | Create buy order, Track fulfillment status, View active trade | `features/dashboard/screens/buyer/` |
| Transporter | View available jobs, Submit bid, Start job, GPS tracking, Complete delivery | `features/dashboard/screens/transporter/` |
| Inspector | View assigned jobs, Accept job, Submit results (score + photos) | `features/dashboard/screens/inspector/` |
| Admin | Create trade op, Send offers, Manage negotiations, Assign inspector, Transport matching, Finalize trade | `features/dashboard/screens/admin/` |

**Step 2: Audit each role's API wiring**

For each screen that exists, read the actual API calls being made. Check:
- Is the correct endpoint being called? (compare to `docs/API_REFERENCE.md`)
- Are params/body correct?
- Is auth token being sent?
- Is response data being handled (including error states)?
- Are state transitions reflected in the UI after successful calls?

Key things to verify per role:

**Seller:**
- `SellerOffersTab.tsx` — does it call `GET /seller/negotiations` and render all 3 actions (accept/counter/reject)?
- `SellerTradesTab.tsx` — does it show trade phase correctly?
- `ProductCreationFlow.tsx` — does it call `POST /seller/listings`?

**Buyer:**
- `BuyerRequestsTab.tsx` — does it call `POST /buyer/listings` to create a buy order?
- `BuyerOrdersTab.tsx` — does it show fulfillment status/phase?

**Transporter:**
- `TransporterBiddingTab.tsx` — does it call `POST /transport/requests/:id/bids`?
- `TransporterActiveJobsTab.tsx` — does it support start-job and complete-delivery actions?

**Inspector:**
- `AvailableJobsTab.tsx` — does it call `GET /inspector/jobs`?
- `ActiveJobTab.tsx` — does it support submitting results with `qualityScore` and `result: PASSED/FAILED`?
- `VerificationForm.tsx` — does it send photos + score to `POST /inspections/:id/results`?

**Admin (mobile):**
- `OperationsScreenRefactored.tsx` — does admin have full trade management capability in mobile?

**Step 3: Check navigation completeness**

Read `front-end/src/navigation/` files. Verify:
- Every role is routed to the correct dashboard after login
- Role-detection logic after auth is correct
- Onboarding flows for all 3 roles (Seller, Buyer, Transporter) lead to correct dashboard
- Inspector onboarding exists? (check `features/onboarding/`)

**Step 4: Write mobile section of GAP_REPORT**

Append to `docs/GAP_REPORT.md`:
```markdown
## MOBILE APP — Code Audit

### Summary
- Screens audited: X
- Gaps found: X (P0: X, P1: X, P2: X)

### Missing Screens
- [Role]: [Screen that should exist but doesn't]

### Broken API Wiring
- [Screen]: calls [wrong endpoint] instead of [correct endpoint]

### Missing Actions
- [Role] cannot perform [action] from mobile

### Navigation Gaps
- [Description of broken/missing navigation path]

### State Handling Issues
- [Screen] does not react to [state change]
```

---

### Task 1C: Admin Dashboard Auditor

Read all admin dashboard components and verify every admin workflow from the 9-phase trade lifecycle is supported, wired to the correct API, and handles edge cases.

**Files to read:**
- `docs/API_REFERENCE.md`
- `docs/STATE_MACHINES.md`
- `docs/TEST_SCENARIOS.md`
- All files under `admin-dashboard/src/features/`
- `admin-dashboard/src/app/Router.tsx`

**Step 1: Map trade lifecycle phases to dashboard UI**

For each of the 9 phases, verify the dashboard has a way to perform the required admin action:

| Phase | Admin Action Required | Expected Component |
|-------|----------------------|-------------------|
| INITIATION | Create trade from buy listing | `TradeCreationWizard.tsx` |
| SELLER_MATCHING | Find and send offers to sellers | `MatchingDashboard/` + `SingleOfferModal.tsx` |
| SELLER_NEGOTIATION | View negotiations, accept counters, update pricing | `NegotiationsDetailPanel.tsx`, `CounterOfferModal.tsx`, `PricingModal.tsx` |
| INSPECTION_PENDING | Request inspections, assign inspector | `InspectionQueuePanel.tsx` + assign flow |
| TRANSPORT_MATCHING | Create transport request or assign directly | `TransportManagement/` |
| TRANSPORT_BIDDING | Review bids, select winner | `BidReviewModal.tsx` |
| IN_TRANSIT | Monitor, handle delays | `TransportOverviewMap.tsx` |
| DELIVERED | Trigger finalization | `TradeFinalizationPanel.tsx` |
| COMPLETED | View completed trade summary | `TradeOperationDetail.tsx` |

**Step 2: Audit scenario runner UI**

The dashboard already has `features/scenarios/` with `ScenarioOrchestrator` and `ProfessionalScenarioRunner`. Read these files and check:
- Is it wired to the actual `/simulation/` endpoints?
- Does it actually run the scenarios or just show a UI mock?
- Is it reachable from the router?
- Does `ScenarioOrchestrator/panels/ExecutionPanel.tsx` make real API calls?

**Step 3: Audit each critical component's API calls**

Read the actual `fetch`/`axios` calls inside these components and compare to `docs/API_REFERENCE.md`:

- `BuyerOrdersPanel.tsx` — endpoint for listing buy orders?
- `SingleOfferModal.tsx` — does it call `POST /simulation/admin/send-offers` or the real endpoint?
- `NegotiationsDetailPanel.tsx` — does it call the right negotiation endpoints?
- `InspectionQueuePanel.tsx` — does assigning an inspector call the correct endpoint?
- `BidReviewModal.tsx` — does bid acceptance call `POST /simulation/admin/select-transport-bid`?
- `TradeFinalizationPanel.tsx` — does it call `POST /trade-operations/:id/finalize`?
- `ReplacementSellerFinder.tsx` — does this exist and work for the inspection-fail scenario?

**Step 4: Check profit/margin visibility**

Scenario 2 requires checking `GET /profit/:tradeOpId` after a counter-offer. Find if any dashboard component shows profit estimates and if it's wired.

**Step 5: Write dashboard section of GAP_REPORT**

Append to `docs/GAP_REPORT.md`:
```markdown
## ADMIN DASHBOARD — Code Audit

### Summary
- Components audited: X
- Gaps found: X (P0: X, P1: X, P2: X)

### Missing Phase Coverage
- Phase [X]: no UI for [action]

### Scenario Runner Status
- [WIRED / NOT WIRED / PARTIAL]
- Issues: ...

### Broken API Wiring
- [Component]: calls [wrong endpoint]

### Missing Admin Flows
- Admin cannot [action] from dashboard

### Edge Cases Not Handled
- [Description]
```

---

## PHASE 2 — Create Agent Persona Files

After Phase 1 completes. These files are persistent identity definitions for role-based Claude agents in future sessions.

**Files to create:**
- `.claude/agents/scenario-test-lead.md`
- `.claude/agents/admin-agent.md`
- `.claude/agents/seller-agent.md`
- `.claude/agents/buyer-agent.md`
- `.claude/agents/transporter-agent.md`
- `.claude/agents/inspector-agent.md`

### Task 2: Write Agent Persona Files

**Step 1: Write `scenario-test-lead.md`**

```markdown
# Scenario Test Lead

## Identity
You are the AgroTrade Scenario Test Lead. You orchestrate full end-to-end pipeline simulation by dispatching role-based agents and verifying the system matches documented behavior.

## Responsibilities
- Run all 10 test scenarios from `docs/TEST_SCENARIOS.md`
- Deploy role agents (admin, seller, buyer, transporter, inspector) via Task tool
- Verify each step's state assertions
- Report gaps to `docs/GAP_REPORT.md`
- Re-run failed scenarios after fixes

## Prerequisites
- Backend running at http://localhost:4000/api
- Demo seed data present (run `npx ts-node prisma/seed-demo.ts` if not)
- Admin token: POST /auth/login with admin@agrotrade.com / admin123

## How to Run
1. Check backend health: `curl http://localhost:4000/api/health`
2. Run scenario runner: `cd backend && npx ts-node src/scripts/run-all-scenarios.ts`
3. Read output and update GAP_REPORT.md
4. For interactive scenario testing, dispatch role agents via Task tool

## Key Files
- `docs/TEST_SCENARIOS.md` — all 10 scenarios with exact API sequences
- `docs/STATE_MACHINES.md` — expected state after every transition
- `backend/src/scripts/run-all-scenarios.ts` — automated runner
- `docs/GAP_REPORT.md` — live findings

## Simulation Endpoints
All at `/simulation/*`, require ADMIN JWT.
See `docs/API_REFERENCE.md` simulation section for full list.
```

**Step 2: Write `admin-agent.md`**

```markdown
# Admin Agent

## Identity
You are the AgroTrade Admin. You orchestrate trade operations: create trades from buyer orders, match sellers, send offers, manage negotiations, assign inspectors, manage transport, and finalize trades.

## Credentials
- Email: admin@agrotrade.com
- Password: admin123
- Role: ADMIN
- Token: POST /auth/login → save accessToken

## Your Journey (9 Phases)
1. **INITIATION** → `POST /simulation/admin/create-trade-operation`
2. **SELLER_MATCHING** → `GET /simulation/users/FARMER` to find sellers
3. **SELLER_NEGOTIATION** → `POST /simulation/admin/send-offers` with farmerId, saleListingId, price
4. **Handle counter-offers** → `POST /simulation/admin/accept-counter-offer`
5. **INSPECTION_PENDING** (optional) → `POST /simulation/admin/assign-inspector`
6. **TRANSPORT_MATCHING** → `POST /simulation/admin/create-transport` or open for bidding
7. **TRANSPORT_BIDDING** → `POST /simulation/admin/select-transport-bid`
8. **Monitor IN_TRANSIT** → `GET /simulation/trade-operation/:id/full-state`
9. **COMPLETED** → `POST /trade-operations/:id/finalize`

## Key Rules
- Never skip state assertions — always read full state after each action
- If a seller rejects, send a new offer to a different farmer
- If inspection fails (FAILED_INSPECTION), find a replacement seller
- Transport bidding: wait for multiple bids, pick lowest price or best ETA
- Profit margin: check `GET /trade-operations/:id/profit` after negotiation completes

## Endpoints You Own
See `docs/API_REFERENCE.md` — all /simulation/admin/* and /trade-operations/* endpoints
```

**Step 3: Write `seller-agent.md`**

```markdown
# Seller Agent (Farmer)

## Identity
You are an AgroTrade Farmer/Seller. You create sale listings for your agricultural products and negotiate with the admin on price and quantity.

## Credentials (demo)
- seller1@agrotrade.com / password123
- seller2@agrotrade.com / password123
- Role: FARMER
- Token: POST /auth/login → save accessToken

## Your Journey
1. **Create listing** (if needed) → `POST /simulation/admin/farmer/:id/create-sale-listing`
2. **Receive offer** → admin sends you a negotiation (PENDING status)
3. **Decision** — you have 3 choices:
   - Accept: `POST /simulation/seller/:id/accept-offer` with negotiationId
   - Counter: `POST /simulation/seller/:id/counter-offer` with counterPrice, counterQuantity
   - Reject: `POST /simulation/seller/:id/reject-offer` with reason
4. **Inspection** (if admin requests) — wait for inspector to visit farm
5. **Confirmation** — if accepted + inspection passed → trade proceeds to transport

## State Assertions
- After accept: `TradeSeller.status === 'ACCEPTED'`, `Negotiation.status === 'ACCEPTED'`
- After counter: `Negotiation.status === 'COUNTERED'`
- After reject: `TradeSeller.status === 'REJECTED'`
- After inspection pass: `TradeSeller.isVerified === true`
- After inspection fail: `TradeSeller.status === 'FAILED_INSPECTION'`

## Behavior Guidelines
- Scenario 1 (happy path): accept the first offer
- Scenario 2 (counter): counter at 230 when offered 215
- Scenario 3 (reject): reject with "Price too low"
- Scenario 5 (inspection fail): submit qualityScore 42, result FAILED
```

**Step 4: Write `buyer-agent.md`**

```markdown
# Buyer Agent

## Identity
You are an AgroTrade Buyer. You post buy orders with product specs and budget, then track fulfillment as admin matches sellers and arranges delivery.

## Credentials (demo)
- buyer@agrotrade.com / password123
- Role: BUYER
- Token: POST /auth/login → save accessToken

## Your Journey
1. **Create buy listing** → `POST /buyer/listings`
   ```json
   {
     "productId": "<from GET /products>",
     "quantity": 100,
     "unit": "TON",
     "maxPricePerUnit": 250,
     "neededBy": "2025-12-31T00:00:00Z",
     "deliveryLocation": { "latitude": 42.6977, "longitude": 23.3219, "address": "Sofia" }
   }
   ```
2. **Wait for admin** to create trade operation from your listing
3. **Track progress** → `GET /buyer/trade-operations` or `GET /buyer/listings/:id`
4. **Receive delivery** → trade reaches DELIVERED phase
5. **Completed** → trade finalized, buy listing status → FULFILLED

## State Assertions
- After create: `BuyListing.status === 'ACTIVE'`
- After trade completion: `BuyListing.status === 'FULFILLED'`

## Key Endpoint
`POST /buyer/listings` — requires BUYER JWT
```

**Step 5: Write `transporter-agent.md`**

```markdown
# Transporter Agent

## Identity
You are an AgroTrade Transporter. You bid on transport jobs, pick up agricultural goods from farms, and deliver them to buyers.

## Credentials (demo)
- Role: TRANSPORTER
- Fetch IDs: `GET /simulation/users/TRANSPORTER` with ADMIN_TOKEN

## Your Journey
1. **Receive transport request** (admin creates it)
2. **Submit bid** → `POST /simulation/transporter/:id/submit-bid`
   ```json
   {
     "transportRequestId": "<id>",
     "bidAmount": 1200,
     "estimatedDuration": 4,
     "vehicleType": "FLATBED",
     "vehicleCapacity": 20
   }
   ```
3. **Wait for admin to select bid**
4. **Start job** → `POST /simulation/transporter/:id/start-job` with jobId
5. **Complete delivery** → `POST /simulation/transporter/:id/complete-delivery` with jobId

## State Assertions
- After bid: `TransportBid.status === 'PENDING'`
- After bid accepted: `TransportBid.status === 'ACCEPTED'`, `TransportJob` created with `status === 'ASSIGNED'`
- After start-job: `TransportJob.status === 'IN_TRANSIT'`
- After complete-delivery: `TransportJob.status === 'COMPLETED'`, `TradeOperation.phase === 'DELIVERED'`

## Scenario 6 (bidding competition)
- TRANSPORTER_A bids 1500 (loses)
- TRANSPORTER_B bids 1200 (wins — admin selects lower)
```

**Step 6: Write `inspector-agent.md`**

```markdown
# Inspector Agent

## Identity
You are an AgroTrade Quality Inspector. You visit farms, inspect agricultural goods, score them 0-100, and report pass/fail results.

## Credentials (demo)
- Role: INSPECTOR
- Fetch IDs: `GET /simulation/users/INSPECTOR` with ADMIN_TOKEN

## Your Journey
1. **Admin assigns you** to an inspection → `InspectionRequest` created with status `SCHEDULED`
2. **Accept job** → `POST /simulation/inspector/:id/accept-job` with inspectionId
3. **Perform inspection** (on-site — simulated)
4. **Submit results** → `POST /simulation/inspector/:id/submit-results`
   ```json
   {
     "inspectionId": "<id>",
     "qualityScore": 88,
     "result": "PASSED",
     "notes": "Grain moisture within acceptable range, no pests detected"
   }
   ```

## State Assertions
- After accept: `InspectionRequest.status === 'SCHEDULED'`
- After submit PASSED: `InspectionRequest.status === 'COMPLETED'`, `TradeSeller.isVerified === true`
- After submit FAILED: `InspectionRequest.status === 'COMPLETED'`, `TradeSeller.status === 'FAILED_INSPECTION'`

## Scenario Behaviors
- Scenario 4 (pass): qualityScore 88, result PASSED
- Scenario 5 (fail): qualityScore 42, result FAILED, notes "High moisture content 18%, fungal contamination present"
```

**Step 7: Commit all agent files**

```bash
git add .claude/agents/
git commit -m "feat: add role-based agent persona files for simulation swarm"
```

---

## PHASE 3 — Fix Pass (Sequential, Priority Order)

Read `docs/GAP_REPORT.md` in full. Work through every issue in priority order: P0 first, then P1, then P2.

### Task 3: Fix All P0 Issues

P0 = broken pipeline (endpoints returning 4xx/5xx, wrong phase transitions, missing screens for core journey, scenario runner can't complete a scenario).

**For each P0 issue:**

**Step 1: Read the exact error** from GAP_REPORT.md — note the scenario, step, expected vs. actual.

**Step 2: Trace the bug** — is it in the backend service, controller, Prisma query, or frontend API call?

**Step 3: Write a failing test** (if backend bug):
```bash
# Quick verification — run just the failing scenario step
cd backend && npx ts-node src/scripts/run-all-scenarios.ts 2>&1 | grep -A5 "FAIL"
```

**Step 4: Fix the issue** — edit the minimal number of files needed.

**Step 5: Re-run affected scenario step** to verify fix:
```bash
cd backend && npx ts-node src/scripts/run-all-scenarios.ts 2>&1 | grep -E "PASS|FAIL"
```

**Step 6: Commit the fix**:
```bash
git add <changed files>
git commit -m "fix: <description of what was broken>"
```

Repeat for every P0, then P1.

### Task 4: Fix All P1 Issues

P1 = logic gaps (missing state handling, wrong data returned, UI shows wrong state).

Same process as P0 — read, trace, fix, verify, commit.

### Task 5: Final Scenario Runner Pass

After all P0/P1 fixes:

**Step 1: Clean test data**:
```bash
curl -X DELETE http://localhost:4000/api/simulation/admin/cleanup-test-data \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Step 2: Run full scenario suite**:
```bash
cd backend && npx ts-node src/scripts/run-all-scenarios.ts
```

**Step 3: Assert all 10 scenarios PASS**. If any still fail, fix and re-run.

**Step 4: Update GAP_REPORT.md** with final status:
```markdown
## Final Status
- Date: 2026-03-02
- All 10 scenarios: PASS ✅
- P0 issues fixed: X
- P1 issues fixed: X
- P2 issues (deferred): X
```

**Step 5: Final commit**:
```bash
git add docs/GAP_REPORT.md
git commit -m "chore: update gap report with final simulation results"
```

---

## Execution Order

```
PHASE 1 (parallel):
  ├── Task 1A: Backend Scenario Runner
  ├── Task 1B: Mobile App Auditor
  └── Task 1C: Admin Dashboard Auditor
       ↓ (all complete → merge into GAP_REPORT.md)
PHASE 2:
  └── Task 2: Create .claude/agents/ persona files
       ↓
PHASE 3 (sequential):
  ├── Task 3: Fix all P0 issues
  ├── Task 4: Fix all P1 issues
  └── Task 5: Final full scenario pass + update GAP_REPORT
```

---

## Key Reference Files

| What you need | Where it is |
|--------------|------------|
| All 10 scenarios step-by-step | `docs/TEST_SCENARIOS.md` |
| All state machines + cascades | `docs/STATE_MACHINES.md` |
| Every endpoint (method, path, body, response) | `docs/API_REFERENCE.md` |
| Product overview + user journeys | `docs/ARCHITECTURE.md` |
| Demo credentials | README.md |
| Simulation endpoints | `backend/src/simulation/simulation.controller.ts` |
| Mobile screens | `front-end/src/features/` |
| Admin dashboard | `admin-dashboard/src/features/` |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agrotrade.com | admin123 |
| Seller 1 | seller1@agrotrade.com | password123 |
| Seller 2 | seller2@agrotrade.com | password123 |
| Buyer | buyer@agrotrade.com | password123 |
