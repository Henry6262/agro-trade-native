# Implementation Tasks: Trade Operations Dashboard Enhancement

**Feature**: Trade Operations Dashboard Enhancement  
**Branch**: `003-create-a-comprehensive`  
**Dependencies**: React Native, NestJS, Prisma, PostgreSQL, Google Maps API  

## Task Overview
Total Tasks: 24  
Parallel Groups: 5  
Estimated Time: 16-20 hours  

## Phase 1: Location Data Fix [Priority: CRITICAL]

### T001: Create Location Update Script [P]
**File**: `backend/src/scripts/fix-seller-locations.ts`
**Description**: Script to populate missing latitude/longitude for all sale listings
```typescript
// Add lat/lng to existing sale listings
// Use Bulgarian city coordinates for realistic data
// Update city field for quick display
```
**Test**: Verify all sale listings have coordinates after running

### T002: Update Matching Sellers API Response
**File**: `backend/src/trade-operations/services/trade-operation.service.ts`
**Description**: Include full location data in matching sellers response
```typescript
// Modify findMatchingSellers() to include:
// - latitude, longitude from sale listing
// - city from address or sale listing
// - formatted display address
```
**Depends on**: T001

### T003: Update Frontend Location Display [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeCreationDrawer.tsx`
**Description**: Display city and distance in seller cards
```typescript
// Update seller card to show:
// - seller.location?.city || 'Location N/A'
// - Calculate and display distance from buyer
```
**Test**: Sellers show "Sofia • 120km" format

### T004: Add Location Type Definitions [P]
**File**: `front-end/src/types/trade-operations.ts`
**Description**: TypeScript interfaces for location data
```typescript
interface SellerLocation {
  latitude: number;
  longitude: number;
  city: string;
  address?: string;
  displayName?: string;
}
```

### T005: Test Location Data Flow
**File**: `backend/test/integration/location-data.e2e-spec.ts`
**Description**: Integration test for location data pipeline
```typescript
// Test: GET /api/trade-operations/:id/matching-sellers
// Assert: All sellers have location.city and location coordinates
```
**Depends on**: T001, T002

---

## Phase 2: Offer Modal Implementation [Priority: HIGH]

### T006: Create Offer Modal Component [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/OfferModal.tsx`
**Description**: Modal component for creating and viewing offers
```typescript
interface OfferModalProps {
  visible: boolean;
  onClose: () => void;
  seller: MatchingSeller;
  tradeOperationId: string;
  onOfferSent: () => void;
}
// Form: price, quantity, terms, message
// Validation: price <= maxPrice, quantity <= available
```

### T007: Add Negotiation Service to Frontend [P]
**File**: `front-end/src/services/negotiationService.ts`
**Description**: API service for offer negotiations
```typescript
// Methods:
// - createOffer(tradeOpId, sellerId, price, quantity, terms)
// - getOfferHistory(negotiationId)
// - respondToOffer(negotiationId, response, counterOffer?)
```

### T008: Connect Modal to Seller Selection
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeCreationDrawer.tsx`
**Description**: Open modal from "Send Offer" button
```typescript
// Replace Alert.alert with:
// - setOfferModalVisible(true)
// - setSelectedSellerForOffer(seller)
```
**Depends on**: T006

### T009: Implement Create Offer Endpoint Test [P]
**File**: `backend/test/contract/negotiations-create.spec.ts`
**Description**: Contract test for POST /api/negotiations/create
```typescript
// Test valid offer creation
// Test validation errors
// Test expiration handling
```

### T010: Connect Negotiation Controller to Service
**File**: `backend/src/negotiations/controllers/negotiation.controller.ts`
**Description**: Ensure create endpoint works with existing service
```typescript
// Verify createOffer method properly connected
// Add validation decorators
// Handle errors appropriately
```
**Depends on**: T009

### T011: Add Offer State to Trade Operations Hook
**File**: `front-end/src/features/dashboard/screens/admin/hooks/useTradeOperations.ts`
**Description**: Track active negotiations in state
```typescript
// Add to hook state:
// - activeNegotiations: Map<sellerId, NegotiationStatus>
// - sendOffer() method
// - refreshNegotiations() method
```
**Depends on**: T007

### T012: Style Offer Modal with NativeWind [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/OfferModal.tsx`
**Description**: Apply consistent styling to modal
```typescript
// Use NativeWind classes for:
// - Modal backdrop (bg-black/50)
// - Form container (bg-white rounded-lg p-4)
// - Input fields (border-gray-300)
// - Buttons (bg-blue-500 text-white)
```
**Depends on**: T006

### T013: Test Offer Creation Flow
**File**: `front-end/__tests__/offer-creation.test.tsx`
**Description**: Component test for offer creation
```typescript
// Test modal opens on button click
// Test form validation
// Test successful submission
// Test error handling
```
**Depends on**: T006, T008, T011

---

## Phase 3: Trade Operation Details [Priority: HIGH]

### T014: Create Operation Detail Drawer [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeOperationDetailDrawer.tsx`
**Description**: Full-screen drawer for operation management
```typescript
interface TradeOperationDetailProps {
  visible: boolean;
  operationId: string;
  onClose: () => void;
}
// Sections: buyer info, sellers, negotiations, timeline, actions
```

### T015: Add Detail Navigation to Operations List
**File**: `front-end/src/features/dashboard/screens/admin/OperationsScreenRefactored.tsx`
**Description**: Make operation cards clickable
```typescript
// In renderActiveOperations():
// Add onPress={() => openOperationDetail(operation.id)}
// Track selectedOperationId in state
```
**Depends on**: T014

### T016: Fetch Operation Details API Call [P]
**File**: `front-end/src/services/tradeOperationService.ts`
**Description**: Add method to fetch full operation details
```typescript
// getOperationDetail(id): Promise<TradeOperationDetail>
// Include: sellers, negotiations, timeline, available actions
```

### T017: Display Negotiations in Detail View
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeOperationDetailDrawer.tsx`
**Description**: Show offers and counter-offers section
```typescript
// For each seller:
// - Show negotiation status
// - Display offer history
// - Show accept/reject/counter buttons
```
**Depends on**: T014, T016

### T018: Implement Phase Transition Actions
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeOperationDetailDrawer.tsx`
**Description**: Add action buttons based on current phase
```typescript
// Actions by phase:
// SELLER_NEGOTIATION: "Proceed to Transport"
// TRANSPORT_MATCHING: "Invite Transporters"
// Add validation before phase change
```
**Depends on**: T014

### T019: Add Timeline Component [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/TradeTimeline.tsx`
**Description**: Visual timeline of trade operation events
```typescript
interface TimelineEvent {
  phase: TradePhase;
  timestamp: Date;
  description: string;
  actor: string;
}
// Vertical timeline with phase badges
```

### T020: Test Operation Detail View
**File**: `backend/test/integration/operation-detail.e2e-spec.ts`
**Description**: Test fetching complete operation details
```typescript
// Test GET /api/trade-operations/:id/detail
// Assert all required fields present
// Test with different phases
```
**Depends on**: T016

---

## Phase 4: Integration & Polish

### T021: Add Polling for Real-time Updates
**File**: `front-end/src/features/dashboard/screens/admin/hooks/useOperationPolling.ts`
**Description**: Poll for operation updates every 5 seconds
```typescript
// useEffect with interval
// Only poll when detail view is open
// Update negotiations, phase, status
```

### T022: Error Handling & Loading States [P]
**File**: Multiple components
**Description**: Add comprehensive error handling
```typescript
// Add loading spinners during API calls
// Show error toasts on failures
// Add retry mechanisms
```

### T023: Add Operation Metrics Display [P]
**File**: `front-end/src/features/dashboard/screens/admin/components/OperationMetrics.tsx`
**Description**: Show profit estimates and totals
```typescript
// Display: total value, commission, estimated profit
// Use data from profit calculation service
```

### T024: Performance Optimization
**File**: Multiple files
**Description**: Optimize renders and API calls
```typescript
// Add React.memo to heavy components
// Implement query caching with React Query
// Optimize re-renders in lists
```

---

## Parallel Execution Examples

### Group 1: Location Foundation (can run simultaneously)
```bash
# Terminal 1
Task agent --task T001 --file backend/src/scripts/fix-seller-locations.ts

# Terminal 2  
Task agent --task T003 --file front-end/src/.../TradeCreationDrawer.tsx

# Terminal 3
Task agent --task T004 --file front-end/src/types/trade-operations.ts
```

### Group 2: Modal Components (can run simultaneously)
```bash
# Terminal 1
Task agent --task T006 --file front-end/src/.../OfferModal.tsx

# Terminal 2
Task agent --task T007 --file front-end/src/services/negotiationService.ts

# Terminal 3
Task agent --task T009 --file backend/test/contract/negotiations-create.spec.ts
```

### Group 3: Detail View Components (can run simultaneously)
```bash
# Terminal 1
Task agent --task T014 --file front-end/src/.../TradeOperationDetailDrawer.tsx

# Terminal 2
Task agent --task T016 --file front-end/src/services/tradeOperationService.ts

# Terminal 3
Task agent --task T019 --file front-end/src/.../TradeTimeline.tsx
```

---

## Validation Checklist

After completing all tasks, verify:

- [ ] All sellers display location (city + distance)
- [ ] Offer modal opens and creates offers successfully
- [ ] Active operations are clickable and show details
- [ ] Negotiations display with full history
- [ ] Phase transitions work correctly
- [ ] Real-time updates via polling
- [ ] No console errors or warnings
- [ ] Performance targets met (<500ms API, 60fps UI)

## Notes

- Tasks marked [P] can be executed in parallel as they work on different files
- Each phase should be completed before moving to the next
- Run tests after each implementation task to ensure TDD compliance
- Commit after each task with descriptive message

---

**Generated**: 2025-09-15  
**Total Estimate**: 16-20 hours  
**Critical Path**: T001 → T002 → T005 (must fix location data first)