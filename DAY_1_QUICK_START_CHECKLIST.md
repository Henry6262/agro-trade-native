# Day 1 Quick Start Checklist - October 18, 2025

**Goal**: Admin can see seller responses and request inspections (8 hours)

---

## Pre-Flight Check (15 min)

### 1. Environment Setup
```bash
# Terminal 1 - Backend
cd /Users/henry/agro-trade/backend
npm run start:dev

# Terminal 2 - Admin Dashboard
cd /Users/henry/agro-trade/admin-dashboard
npm run dev

# Terminal 3 - Verify APIs
curl http://localhost:4000/api/inspections
curl http://localhost:4000/api/negotiations/trade-operation/test-id
```

**Expected**: Backend on :4000, Admin on :5173 (or similar), both running without errors

### 2. File Location Verification

✅ **CONFIRMED - Files exist**:
- `/admin-dashboard/src/features/matching/components/MatchingDashboard/OffersTrackingPanel.tsx`
- `/admin-dashboard/src/features/matching/components/MatchingDashboard/OfferDetailsModal.tsx`

**Note**: Location is `/features/matching/components/` NOT `/components/` as initially thought.

---

## Morning Session (4 hours) - Seller Response Tracking

### Task 1: Review Current OffersTrackingPanel (30 min)
- [ ] Read `/admin-dashboard/src/features/matching/components/MatchingDashboard/OffersTrackingPanel.tsx`
- [ ] Identify what's already implemented
- [ ] Check if polling exists
- [ ] Verify negotiation data structure

### Task 2: Implement Real-Time Polling (90 min)

**File**: `OffersTrackingPanel.tsx`

```typescript
// Add polling hook
useEffect(() => {
  const intervalId = setInterval(() => {
    fetchNegotiations(tradeOperationId);
  }, 10000); // 10 seconds

  return () => clearInterval(intervalId);
}, [tradeOperationId]);

// API call
const fetchNegotiations = async (tradeOpId: string) => {
  try {
    const response = await apiClient.get(
      `/negotiations/trade-operation/${tradeOpId}`
    );
    setNegotiations(response.data.data || response.data);
  } catch (error) {
    console.error('Error fetching negotiations:', error);
  }
};
```

**Test**:
- [ ] Open admin dashboard
- [ ] Create trade operation with offers
- [ ] Verify data loads
- [ ] Change status in backend (via Postman)
- [ ] Confirm UI updates within 10 seconds

### Task 3: Add Status Badges (60 min)

Create `/admin-dashboard/src/features/matching/components/MatchingDashboard/StatusBadge.tsx`:

```typescript
interface StatusBadgeProps {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'EXPIRED';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    PENDING: { color: 'bg-yellow-500', icon: '⏳', text: 'Pending' },
    ACCEPTED: { color: 'bg-green-500', icon: '✅', text: 'Accepted' },
    REJECTED: { color: 'bg-red-500', icon: '❌', text: 'Rejected' },
    COUNTERED: { color: 'bg-blue-500', icon: '💬', text: 'Countered' },
    EXPIRED: { color: 'bg-gray-500', icon: '⏰', text: 'Expired' },
  };

  const { color, icon, text } = config[status];

  return (
    <span className={`${color} text-white px-3 py-1 rounded-full text-sm font-medium`}>
      {icon} {text}
    </span>
  );
};
```

**Usage in OffersTrackingPanel**:
```typescript
{negotiations.map(neg => (
  <div key={neg.id}>
    <span>{neg.tradeSeller.seller.name}</span>
    <StatusBadge status={neg.status} />
  </div>
))}
```

**Test**:
- [ ] Verify all status colors match design
- [ ] Check responsive layout
- [ ] Test with multiple statuses

### Task 4: Wire Up Negotiation Data (30 min)

**Verify data structure matches backend**:

```typescript
interface Negotiation {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  tradeSeller: {
    seller: {
      id: string;
      name: string;
    };
  };
  currentOffer: {
    price: number;
    quantity: number;
  };
  expiresAt: string;
  hoursUntilExpiry: number;
}
```

**Test**:
- [ ] All fields display correctly
- [ ] No TypeScript errors
- [ ] Data updates on poll

---

## Afternoon Session (4 hours) - Inspection Request Flow

### Task 5: Resolve Backend Endpoint Decision (15 min)

**Decision Required**: Use which endpoint?

**Option A**: Create new `POST /trade-operations/:id/request-inspections`
- Pros: Clean API, follows spec
- Cons: Requires backend work (~30 min)

**Option B**: Use existing `POST /inspections/batch`
- Pros: No backend work, faster
- Cons: Less semantic

**Recommendation**: **Option B** for MVP speed

**If Option B**:
```typescript
// API call
const requestInspections = async (
  tradeOperationId: string,
  acceptedSellerIds: string[]
) => {
  await apiClient.post('/inspections/batch', {
    tradeOperationId,
    saleListingIds: acceptedSellerIds,
    priority: 'HIGH'
  });
};
```

### Task 6: Add "Request Inspection" Button (90 min)

**File**: `OfferDetailsModal.tsx` or `OffersTrackingPanel.tsx`

```typescript
const handleRequestInspection = async (negotiation: Negotiation) => {
  try {
    setLoading(true);

    // Get sale listing ID from negotiation
    const saleListingId = negotiation.tradeSeller.saleListing.id;

    await apiClient.post('/inspections/batch', {
      tradeOperationId: negotiation.tradeOperationId,
      saleListingIds: [saleListingId],
      priority: 'HIGH'
    });

    toast.success('Inspection requested successfully!');

    // Refresh data
    fetchNegotiations(negotiation.tradeOperationId);
  } catch (error) {
    toast.error('Failed to request inspection');
  } finally {
    setLoading(false);
  }
};

// Button logic
const showRequestButton = (negotiation: Negotiation) => {
  return (
    negotiation.status === 'ACCEPTED' &&
    !negotiation.tradeSeller.hasInspection // Need to add this field
  );
};
```

**UI**:
```tsx
{showRequestButton(negotiation) && (
  <button
    onClick={() => handleRequestInspection(negotiation)}
    disabled={loading}
    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
  >
    {loading ? '⏳ Requesting...' : '🔍 Request Inspection'}
  </button>
)}
```

**Test**:
- [ ] Button appears only for ACCEPTED sellers
- [ ] Button disabled if inspection exists
- [ ] Click creates inspection in backend
- [ ] Success toast shows
- [ ] UI updates after creation

### Task 7: Add Verification Status Indicators (60 min)

**File**: `OffersTrackingPanel.tsx`

```typescript
interface VerificationStatusProps {
  negotiation: Negotiation;
}

const VerificationStatus = ({ negotiation }: VerificationStatusProps) => {
  if (negotiation.status !== 'ACCEPTED') {
    return null;
  }

  const hasInspection = negotiation.tradeSeller.hasInspection;
  const inspectionStatus = negotiation.tradeSeller.inspectionStatus;

  if (!hasInspection) {
    return (
      <span className="text-yellow-600 flex items-center gap-1">
        ⚠️ Needs Inspection
      </span>
    );
  }

  if (inspectionStatus === 'COMPLETED') {
    return (
      <span className="text-green-600 flex items-center gap-1">
        ✅ Verified
      </span>
    );
  }

  return (
    <span className="text-blue-600 flex items-center gap-1">
      🔄 Pending Inspection
    </span>
  );
};
```

**Test**:
- [ ] Shows "Needs Inspection" for new acceptances
- [ ] Shows "Pending Inspection" after request
- [ ] Shows "Verified" after completion
- [ ] Icons render correctly

### Task 8: Integration Testing (60 min)

**Full Flow Test**:

1. **Setup**:
   - [ ] Create trade operation with 3 sellers
   - [ ] Send offers to all 3

2. **Test Seller Acceptance**:
   - [ ] Use Postman: `POST /negotiations/:id/accept`
   - [ ] Verify admin sees status change to ACCEPTED
   - [ ] Confirm badge color changes to green

3. **Test Inspection Request**:
   - [ ] Click "Request Inspection" button
   - [ ] Verify inspection created: `GET /inspections?tradeOperationId=:id`
   - [ ] Confirm status changes to "Pending Inspection"

4. **Test Rejection**:
   - [ ] Use Postman: `POST /negotiations/:id/reject`
   - [ ] Verify admin sees status change to REJECTED
   - [ ] Confirm badge color changes to red

5. **Test Polling**:
   - [ ] Change status in backend
   - [ ] Wait up to 10 seconds
   - [ ] Verify UI updates automatically

**Expected Results**:
- [ ] All 3 sellers show correct statuses
- [ ] Inspection button appears/disappears correctly
- [ ] Verification indicators accurate
- [ ] No console errors
- [ ] Polling works smoothly

---

## End-of-Day Tasks (30 min)

### 1. Demo Recording
- [ ] Record 2-minute video showing:
  - Sending offers
  - Polling updates
  - Requesting inspection
  - Verification status

### 2. Documentation Update
- [ ] Update `INTEGRATION_STATUS.json`:
  ```json
  {
    "adminDashboard": {
      "features": {
        "mapBasedMatching": {
          "offerTracking": {
            "status": "completed",
            "completionDate": "2025-10-18",
            "features": [
              "Real-time polling (10s interval)",
              "Status badges (PENDING/ACCEPTED/REJECTED)",
              "Inspection request button",
              "Verification status indicators"
            ]
          }
        }
      }
    }
  }
  ```

### 3. Day 1 Completion Report
- [ ] Create brief summary:
  - What was completed
  - Any blockers encountered
  - Lessons learned
  - Handoff notes for Day 2

### 4. Prepare for Day 2
- [ ] Review mobile seller screen requirements
- [ ] Share API documentation with Mobile Lead
- [ ] Ensure backend is stable for mobile testing

---

## Troubleshooting Guide

### Issue: Polling Not Working
**Solution**:
- Check console for errors
- Verify API endpoint returns data
- Add debug logging to see if interval fires
- Check if `tradeOperationId` is valid

### Issue: Inspection Button Doesn't Create Inspection
**Solution**:
- Verify `saleListingId` is included in API call
- Check backend logs for errors
- Confirm authentication token is valid
- Test endpoint directly with Postman

### Issue: Status Doesn't Update After Polling
**Solution**:
- Check if `setNegotiations()` is called
- Verify React state is updating
- Add `console.log()` to see if new data arrives
- Check if component re-renders

### Issue: TypeScript Errors
**Solution**:
- Verify interface definitions match backend response
- Use `any` as temporary workaround for MVP
- Check for null/undefined values
- Add proper type guards

---

## API Reference for Day 1

### Get Negotiations
```bash
GET /negotiations/trade-operation/:tradeOperationId
Query: ?status=PENDING&limit=100&offset=0

Response:
{
  "success": true,
  "data": {
    "negotiations": [...],
    "summary": {
      "pending": 2,
      "accepted": 1,
      "rejected": 0
    }
  }
}
```

### Create Batch Inspections
```bash
POST /inspections/batch

Body:
{
  "tradeOperationId": "trade-op-id",
  "saleListingIds": ["listing-1", "listing-2"],
  "priority": "HIGH"
}

Response:
[
  { "id": "insp-1", "status": "PENDING", ... },
  { "id": "insp-2", "status": "PENDING", ... }
]
```

### Get Inspections
```bash
GET /inspections?tradeOperationId=:id&status=PENDING

Response:
{
  "data": [
    {
      "id": "insp-1",
      "status": "PENDING",
      "priority": "HIGH",
      "saleListing": { ... }
    }
  ],
  "pagination": { ... }
}
```

---

## Success Metrics

By end of day, you should be able to:

- [ ] See all sent offers in OffersTrackingPanel
- [ ] Watch status change automatically every 10 seconds
- [ ] Click "Request Inspection" for accepted sellers
- [ ] See verification status indicators
- [ ] Complete full flow: Send → Accept → Request → Verify

**Time Estimate**: 7-8 hours of focused work + 1 hour buffer

**Confidence**: 🟢 High (all prerequisites met, clear requirements, existing components to build on)

---

## Next Steps (Day 2 Preview)

Tomorrow, Mobile Lead will:
- Build `SellerOffersScreen.tsx`
- Implement accept/decline buttons
- Test with your Day 1 backend work
- Integrate with `negotiationService.ts`

**Your support**: Be available for API questions, verify backend stability, help with testing.

---

**Good luck! Let's ship Day 1! 🚀**
