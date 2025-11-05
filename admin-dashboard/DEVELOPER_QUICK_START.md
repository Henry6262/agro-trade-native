# Developer Quick Start Guide

## Getting Started in 5 Minutes

### 1. Clone and Install
```bash
cd admin-dashboard
npm install
```

### 2. Start Development Server
```bash
npm run dev
# Opens at http://localhost:5173
```

### 3. View Trade Operation Management
Navigate to: `http://localhost:5173/operations/:id`
Replace `:id` with a valid trade operation ID from your backend.

---

## File Structure Overview

```
src/
├── features/operations/components/
│   ├── TradeOperationDetail/          # Main orchestration page
│   ├── InspectionResultsPanel/        # Shows inspection results
│   ├── QuantityTrackingPanel/         # Tracks quantity fulfillment
│   ├── ReplacementSellerFinder/       # Modal to find sellers
│   ├── TransportManagementPanel/      # Manages transport workflow
│   └── TradeFinalizationPanel/        # Validates & finalizes
│
├── utils/
│   ├── workflowValidation.ts          # Core validation logic
│   ├── locationHelpers.ts             # Location formatting
│   └── specificationHelpers.ts        # Product specs
│
├── components/
│   ├── common/                        # Shared components
│   └── ui/                            # Shadcn UI components
│
├── config/
│   └── api.ts                         # API endpoints
│
└── types/
    └── listings.ts                     # TypeScript types
```

---

## Common Development Tasks

### Adding a New Validation Rule

**File:** `src/utils/workflowValidation.ts`

```typescript
// 1. Add to validation result interface
export interface WorkflowValidationResult {
  // ... existing fields
  myNewCheck: boolean;  // Add your check
}

// 2. Add logic to validateWorkflowComplete
export const validateWorkflowComplete = (...) => {
  // ... existing code

  const myNewCheck = // your validation logic

  if (!myNewCheck) {
    blockers.push('Your blocker message');
  }

  return {
    // ... existing fields
    myNewCheck,
  };
};

// 3. Use in TradeFinalizationPanel
const validation = validateWorkflowComplete(...);
if (validation.myNewCheck) {
  // Show success
} else {
  // Show blocker
}
```

---

### Adding a New Panel

```typescript
// 1. Create component file
// src/features/operations/components/MyNewPanel/MyNewPanel.tsx

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface MyNewPanelProps {
  tradeOperationId: string;
  // ... other props
}

export const MyNewPanel: React.FC<MyNewPanelProps> = ({
  tradeOperationId
}) => {
  // Component logic

  return (
    <Card>
      <CardHeader>
        <CardTitle>My New Panel</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content here */}
      </CardContent>
    </Card>
  );
};

// 2. Add to TradeOperationDetail.tsx
import { MyNewPanel } from '../MyNewPanel';

// In JSX:
<MyNewPanel tradeOperationId={id!} />
```

---

### Fetching Data from API

```typescript
import api from '../../../../services/api';
import { API_ENDPOINTS } from '../../../../config/api';

// Inside component
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async () => {
  try {
    setLoading(true);
    const response = await api.get(
      API_ENDPOINTS.yourEndpoint.byId(id)
    );
    setData(response.data);
    setError(null);
  } catch (err) {
    console.error('Error:', err);
    setError('Failed to load data');
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchData();
}, [id]);
```

---

### Triggering Parent Refresh

```typescript
// Parent component (TradeOperationDetail)
const refreshData = useCallback(() => {
  setRefetchTrigger(prev => prev + 1);
}, []);

// Pass to child
<MyPanel onDataChanged={refreshData} />

// Child component
interface MyPanelProps {
  onDataChanged: () => void;
}

const handleAction = async () => {
  await api.post(...);
  props.onDataChanged(); // Triggers parent refresh
};
```

---

### Using Workflow Validation

```typescript
import {
  validateWorkflowComplete,
  calculateInspectionSummary,
  calculateTransportSummary,
  calculateQuantitySummary,
} from '../../../../utils/workflowValidation';

// Calculate summaries
const inspectionSummary = calculateInspectionSummary(inspections);
const transportSummary = calculateTransportSummary(transportData);
const quantitySummary = calculateQuantitySummary(
  operation.buyListing.quantity,
  operation.offers
);

// Validate workflow
const validation = validateWorkflowComplete(
  operation,
  inspectionSummary,
  transportSummary,
  quantitySummary
);

// Use results
if (validation.canFinalize) {
  // Show finalize button
} else {
  // Show blockers
  validation.blockers.forEach(blocker => {
    console.log(blocker);
  });
}
```

---

### Displaying Financial Data

```typescript
import {
  calculateFinancialSummary,
  formatCurrency,
  formatPercentage
} from '../../../../utils/workflowValidation';

const financialSummary = calculateFinancialSummary(
  operation,
  transportCost
);

// Display
{financialSummary.hasData && (
  <div>
    <p>Total Cost: {formatCurrency(financialSummary.totalOperationalCost)}</p>
    <p>Revenue: {formatCurrency(financialSummary.sellerRevenue)}</p>
    <p>Profit: {formatCurrency(financialSummary.estimatedProfit)}</p>
    <p>Margin: {formatPercentage(financialSummary.profitMargin)}</p>
  </div>
)}
```

---

## Common UI Patterns

### Loading State

```typescript
import { LoadingState } from '../../../../components/common';

if (loading) {
  return <LoadingState message="Loading..." />;
}
```

### Error State

```typescript
import { ErrorState } from '../../../../components/common';

if (error) {
  return <ErrorState error={error} onRetry={fetchData} />;
}
```

### Empty State

```typescript
if (items.length === 0) {
  return (
    <div className="text-center py-12 text-text-secondary">
      <span className="text-5xl opacity-30 block mb-3">📋</span>
      <p className="font-semibold">No items yet</p>
      <p className="text-sm mt-1">Items will appear here</p>
    </div>
  );
}
```

### Toast Notification

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

// Success toast
toast({
  title: 'Success',
  description: 'Action completed successfully',
});

// Error toast
toast({
  variant: 'destructive',
  title: 'Error',
  description: 'Something went wrong',
});
```

### Confirmation Dialog

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const [showConfirm, setShowConfirm] = useState(false);

<Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Styling Guide

### Color Classes (Tailwind)

**Phase Colors:**
```typescript
MATCHING:    'bg-blue-100 text-blue-800 border-blue-300'
NEGOTIATION: 'bg-yellow-100 text-yellow-800 border-yellow-300'
INSPECTION:  'bg-purple-100 text-purple-800 border-purple-300'
TRANSPORT:   'bg-indigo-100 text-indigo-800 border-indigo-300'
DELIVERY:    'bg-green-100 text-green-800 border-green-300'
COMPLETED:   'bg-gray-100 text-gray-800 border-gray-300'
```

**Status Colors:**
```typescript
DRAFT:     'bg-gray-100 text-gray-800 border-gray-300'
ACTIVE:    'bg-green-100 text-green-800 border-green-300'
PAUSED:    'bg-yellow-100 text-yellow-800 border-yellow-300'
CANCELLED: 'bg-red-100 text-red-800 border-red-300'
COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300'
```

**Message Colors:**
```typescript
Error/Blocker: 'bg-red-50 border-red-300 text-red-900'
Warning:       'bg-yellow-50 border-yellow-300 text-yellow-900'
Success:       'bg-green-50 border-green-300 text-green-900'
Info:          'bg-blue-50 border-blue-300 text-blue-900'
```

### Card Pattern

```typescript
<Card>
  <CardHeader className="bg-gradient-to-br from-purple-50 to-purple-100 border-b-2 border-purple-300">
    <div className="flex items-center gap-2">
      <span className="text-2xl">🔍</span>
      <div>
        <CardTitle>Panel Title</CardTitle>
        <CardDescription>Panel description</CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="pt-6">
    {/* Content here */}
  </CardContent>
</Card>
```

---

## TypeScript Tips

### Type Imports

```typescript
// Always use type imports for types
import type { TradeOperation, Offer } from '../../../../types/listings';

// Regular imports for components/functions
import { Button } from '@/components/ui/button';
```

### Component Props Interface

```typescript
interface MyComponentProps {
  // Required props (no ?)
  tradeOperationId: string;
  operation: TradeOperation;

  // Optional props (with ?)
  title?: string;

  // Callbacks
  onUpdate: () => void;
  onError?: (error: string) => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  tradeOperationId,
  operation,
  title = 'Default Title',  // Default values
  onUpdate,
  onError,
}) => {
  // Component logic
};
```

### Type Guards

```typescript
// Check if data exists and has expected shape
if (!operation || !operation.buyListing) {
  return <ErrorState error="Missing operation data" />;
}

// Now TypeScript knows these are defined
const quantity = operation.buyListing.quantity;
```

---

## Debugging Tips

### Console Logging

```typescript
// Log with context
console.log('[MyComponent] Fetching data for ID:', id);
console.log('[MyComponent] Response:', response.data);
console.error('[MyComponent] Error:', err);
```

### React DevTools

1. Install React DevTools browser extension
2. Open DevTools > Components tab
3. Select component to inspect props/state

### Network Tab

1. Open DevTools > Network tab
2. Filter by XHR/Fetch
3. Click request to see:
   - Request URL
   - Headers
   - Request body
   - Response data

### Common Issues

**Issue:** Component not re-rendering after state change
```typescript
// Bad: Mutating state directly
state.items.push(newItem);

// Good: Create new array
setState({ ...state, items: [...state.items, newItem] });
```

**Issue:** Infinite loop in useEffect
```typescript
// Bad: Missing dependencies
useEffect(() => {
  fetchData();
}, []); // fetchData might use props/state

// Good: Include dependencies
useEffect(() => {
  fetchData();
}, [id, refetchTrigger]);
```

**Issue:** Stale closure in callback
```typescript
// Bad: Callback sees old state
const handleClick = () => {
  console.log(count); // Always shows initial value
};

// Good: Use callback with dependencies
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
```

---

## Testing Locally

### Quick Manual Test

1. Start backend: `cd backend && npm run start:dev`
2. Start frontend: `cd admin-dashboard && npm run dev`
3. Navigate to operations page
4. Pick a trade operation
5. Test each panel:
   - ✅ Inspections load
   - ✅ Quantity tracking shows correct data
   - ✅ Transport panel displays
   - ✅ Finalization shows validation

### Build Test

```bash
npm run build
npm run preview
# Opens production build at http://localhost:4173
```

### Type Check

```bash
npm run type-check
# Checks TypeScript without building
```

---

## Git Workflow

### Committing Changes

```bash
# Check status
git status

# Stage files
git add src/features/operations/components/MyComponent/

# Commit with descriptive message
git commit -m "feat: add new validation rule for XYZ

- Implemented ABC validation
- Updated workflow logic
- Added tests"

# Push to remote
git push origin your-branch-name
```

### Branch Naming

```
feature/component-name       # New features
fix/bug-description          # Bug fixes
refactor/component-name      # Code improvements
docs/documentation-update    # Documentation
```

---

## Performance Tips

### Memoization

```typescript
// Expensive calculation
const expensiveValue = useMemo(() => {
  return complexCalculation(data);
}, [data]);

// Callback that doesn't need to recreate
const handleClick = useCallback(() => {
  doSomething();
}, [dependencies]);
```

### Conditional Rendering

```typescript
// Good: Early returns
if (loading) return <LoadingState />;
if (error) return <ErrorState />;
return <MainContent />;

// Avoid: Nested ternaries
{loading ? <LoadingState /> : error ? <ErrorState /> : <MainContent />}
```

---

## Need Help?

### Resources
1. **Code Comments:** Most functions have JSDoc comments
2. **Session Docs:** Check SESSION_X_COMPLETION_SUMMARY.md files
3. **Testing Guide:** SESSION_4_TESTING_GUIDE.md
4. **Type Definitions:** `src/types/listings.ts`

### Common Questions

**Q: Where do I add a new API endpoint?**
A: `src/config/api.ts` in the `API_ENDPOINTS` object

**Q: How do I trigger a refresh?**
A: Use the `refreshData()` callback from TradeOperationDetail

**Q: Where are validation rules?**
A: `src/utils/workflowValidation.ts`

**Q: How do I style components?**
A: Use Tailwind classes. Check Shadcn UI docs for components.

**Q: Where are TypeScript types?**
A: `src/types/listings.ts` and `src/utils/workflowValidation.ts`

---

## Quick Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run type-check       # TypeScript validation

# Testing
npm run test             # Run tests (if configured)
npm run test:watch       # Watch mode

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix auto-fixable issues

# Other
npm run clean            # Clean build artifacts
npm install              # Install dependencies
npm update               # Update dependencies
```

---

**Happy Coding!** 🚀

For more detailed information, refer to:
- `WEEK_1_MVP_COMPLETE.md` - Full feature documentation
- `SESSION_4_COMPLETION_SUMMARY.md` - Latest changes
- `SESSION_4_TESTING_GUIDE.md` - Testing procedures
