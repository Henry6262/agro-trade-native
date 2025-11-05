# Matching Dashboard - Offer Tracking System

This directory contains the complete Map-Based Matching System with integrated offer tracking capabilities.

## Components Overview

### 1. PricingModal.tsx
**Purpose**: Create trade operations by sending offers to selected sellers.

**Key Features**:
- Calculate transport costs for selected sellers
- Adjust offer prices with real-time profit calculation
- Create trade operation via POST `/api/trade-operations`
- Add sellers via POST `/api/trade-operations/:id/sellers`
- Loading states and error handling
- Success feedback with operation ID

**API Endpoints Used**:
- `POST /trade-operations/calculate-transport` - Calculate transport costs
- `POST /trade-operations` - Create new trade operation
- `POST /trade-operations/:id/sellers` - Add sellers to operation

### 2. OffersTrackingPanel.tsx
**Purpose**: Monitor all active trade operations in real-time.

**Key Features**:
- Fetch active trade operations via GET `/api/trade-operations?status=ACTIVE`
- Auto-refresh every 30 seconds (toggleable)
- Display operation summary (ID, buyer, seller count, phase, status, profit)
- Time remaining calculations
- View details button for each operation

**API Endpoints Used**:
- `GET /trade-operations?status=ACTIVE&limit=50` - Fetch active operations

### 3. OfferDetailsModal.tsx
**Purpose**: Display detailed information about a specific trade operation.

**Key Features**:
- Fetch single operation details via GET `/api/trade-operations/:id`
- Per-seller breakdown with status badges
- Quantity fulfillment visualization
- Profit and transport summary cards
- Action buttons (stubs for future implementation):
  - Approve All
  - Reject All
  - Optimize Transport
  - Finalize Trade

**API Endpoints Used**:
- `GET /trade-operations/:id` - Fetch operation details

## Integration Example

Here's how to integrate these components into your application:

```tsx
import React, { useState } from 'react';
import { MatchingDashboard } from './MatchingDashboard';
import { OffersTrackingPanel } from './OffersTrackingPanel';
import { OfferDetailsModal } from './OfferDetailsModal';

export const TradeManagementApp: React.FC = () => {
  const [selectedOperationId, setSelectedOperationId] = useState<string | null>(null);
  const [showTracking, setShowTracking] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md p-4 mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setShowTracking(false)}
            className={`px-4 py-2 rounded ${!showTracking ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Matching Dashboard
          </button>
          <button
            onClick={() => setShowTracking(true)}
            className={`px-4 py-2 rounded ${showTracking ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Offers Tracking
          </button>
        </div>
      </nav>

      {/* Main Content */}
      {showTracking ? (
        <div className="p-6">
          <OffersTrackingPanel
            onViewDetails={(id) => setSelectedOperationId(id)}
          />
        </div>
      ) : (
        <MatchingDashboard />
      )}

      {/* Details Modal */}
      {selectedOperationId && (
        <OfferDetailsModal
          operationId={selectedOperationId}
          onClose={() => setSelectedOperationId(null)}
        />
      )}
    </div>
  );
};
```

## Workflow

1. **Create Offers** (MatchingDashboard → PricingModal):
   - Admin selects buyer order
   - Selects matching sellers
   - Clicks "Create Offers"
   - PricingModal calculates transport costs
   - Admin adjusts prices if needed
   - Clicks "Send Offers"
   - Trade operation is created
   - Success message displays operation ID

2. **Track Offers** (OffersTrackingPanel):
   - Navigate to Offers Tracking panel
   - View all active trade operations
   - Auto-refreshes every 30 seconds
   - Click "View Details" on any operation

3. **View Details** (OfferDetailsModal):
   - Modal opens with full operation details
   - See buyer info, profit summary, transport costs
   - View per-seller breakdown with status badges
   - Quantity fulfillment progress bar
   - Action buttons for next steps (stubs)

## API Contract Alignment

All components use the backend API contracts directly:

```typescript
// Trade Operation Response Structure
interface TradeOperationResponseDto {
  id: string;
  phase: TradePhase;
  status: TradeStatus;
  buyer: BuyerSummaryDto;
  sellers: SellerSummaryDto[];
  profit: ProfitSummaryDto;
  transport: TransportSummaryDto;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
}
```

## Backend Requirements

Ensure the following backend endpoints are available:

1. `POST /trade-operations/calculate-transport` - Calculate transport costs
2. `POST /trade-operations` - Create trade operation
3. `POST /trade-operations/:id/sellers` - Add sellers to operation
4. `GET /trade-operations` - List operations with filters
5. `GET /trade-operations/:id` - Get single operation details

## Testing

To test the complete workflow:

1. Start backend server: `cd backend && npm run start:dev`
2. Start admin dashboard: `cd admin-dashboard && npm run dev`
3. Navigate to Matching Dashboard
4. Select a buyer order (must have active buy listings in DB)
5. Select matching sellers (must have sale listings in DB)
6. Click "Create Offers" → Adjust prices → "Send Offers"
7. Note the operation ID in the success message
8. Navigate to "Offers Tracking" tab
9. Find your operation in the table
10. Click "View Details" to see full information

## Future Enhancements

The action buttons in OfferDetailsModal are stubs. Future implementations:

- **Approve All**: Approve all pending seller offers
- **Reject All**: Reject all pending seller offers
- **Optimize Transport**: Run transport optimization algorithm
- **Finalize Trade**: Lock in the trade and proceed to next phase

These will be implemented in coordination with the Backend Lead and Scenario Test Lead.
