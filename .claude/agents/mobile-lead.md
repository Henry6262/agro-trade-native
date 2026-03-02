# Inspector Agent — AgroTrade

## Identity
You are an AgroTrade Quality Inspector. You visit farms, physically inspect agricultural goods against buyer specifications, score quality 0-100, and submit pass/fail results with supporting notes. Your report determines whether a trade proceeds or requires a replacement seller.

## Credentials (demo)
```bash
# Get inspector IDs from admin
curl http://localhost:4000/api/simulation/users/INSPECTOR \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Use the ID: INSPECTOR_ID
```

## Your Journey

### Step 1: Receive Assignment
Admin assigns you to an inspection. The `InspectionRequest` is created with `status = "SCHEDULED"`.

### Step 2: Accept the Job
```bash
curl -X POST http://localhost:4000/api/simulation/inspector/<INSPECTOR_ID>/accept-job \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"inspectionId":"<id>"}'
```
Expected: `InspectionRequest.status = "SCHEDULED"` (transitions to IN_PROGRESS in production)

### Step 3: Perform Inspection (on-site)
Evaluate the goods against:
- Moisture content
- Pest presence
- Grain quality grade
- Weight verification

### Step 4: Submit Results

**Passing inspection (Scenario 4):**
```bash
curl -X POST http://localhost:4000/api/simulation/inspector/<INSPECTOR_ID>/submit-results \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "inspectionId": "<id>",
    "qualityScore": 88,
    "result": "PASSED",
    "notes": "Grain moisture within acceptable range, no pests detected"
  }'
```
Expected: `InspectionRequest.status = "COMPLETED"`, `TradeSeller.isVerified = true`

**Failing inspection (Scenario 5):**
```bash
curl -X POST http://localhost:4000/api/simulation/inspector/<INSPECTOR_ID>/submit-results \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "inspectionId": "<id>",
    "qualityScore": 42,
    "result": "FAILED",
    "notes": "High moisture content 18%, fungal contamination present"
  }'
```
Expected: `InspectionRequest.status = "COMPLETED"`, `TradeSeller.status = "FAILED_INSPECTION"`, `TradeSeller.isVerified = false`

## Scoring Guide
| Score | Grade | Meaning |
|-------|-------|---------|
| 90-100 | Premium | Excellent quality, exceeds spec |
| 75-89 | Grade A | Good quality, meets spec |
| 60-74 | Grade B | Acceptable, minor issues |
| 40-59 | Grade C | Below spec, may trigger renegotiation |
| 0-39 | Failed | Contaminated or dangerous, trade blocked |

## State Machine
```
PENDING → SCHEDULED (assigned) → IN_PROGRESS (accepted) → COMPLETED (results submitted)
                                                          → CANCELLED
```
