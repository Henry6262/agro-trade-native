# Build Errors Fix Plan

## Current Status
- **Total Errors**: 53 TypeScript errors
- **Files Affected**: 18 files across multiple features

## Error Categories

### 1. Missing Feature-Level Files (Most Critical)

The matching and inspection features are importing files that don't exist in their feature directories:

**Matching Feature Missing:**
- `features/matching/services/api.ts`
- `features/matching/types/listings.ts`
- `features/matching/utils/locationHelpers.ts`
- `features/matching/utils/specificationHelpers.ts`
- `features/matching/components/common/` (should reference root)
- `features/matching/styles/designSystem.ts`
- `features/matching/config/api.ts`
- `features/matching/utils/errorHandler.ts`

**Inspection Feature Missing:**
- `features/inspections/types/`
- `features/inspections/utils/errorHandler.ts`

**These files likely exist at the ROOT level** (`src/types/`, `src/utils/`, etc.) but the relative imports `../../` are wrong.

### 2. Import Path Fixes Needed

#### Scenarios Feature (1 error)
```typescript
// StepContextPanel.tsx
- from '../services/businessDataExtractor'
+ from '../../../../services/businessDataExtractor' (if it exists)
  OR remove if not needed
```

#### Config (1 error)
```typescript
// src/config/api.ts:8
- process.env.VITE_API_URL
+ import.meta.env.VITE_API_URL (Vite syntax)
```

### 3. Type Safety Issues (NO 'any' allowed)

Files with `any` types that need proper typing:
- `ScenarioOrchestrator.tsx` (many `any` for payloads)
- `DatabaseStatePanel.tsx` (user arrays typed as `any[]`)
- Various handlers in ScenarioOrchestrator

## Solution Strategy

### Option A: Fix Import Paths (Fastest)
Update all relative imports to point to root-level files:

```typescript
// Change
import { Badge } from '../../components/common';
// To
import { Badge } from '../../../../components/common';

// Change
import { BuyListing } from '../../types/listings';
// To
import { BuyListing } from '../../../../types/listings';
```

### Option B: Create Feature-Level Files (Better Long-term)
Move/copy shared files into each feature that needs them.

## Immediate Action Plan

1. **Fix config/api.ts** - Change `process.env` to `import.meta.env`
2. **Fix matching feature imports** - Update all `../../` paths to `../../../../`
3. **Fix inspection feature imports** - Update all `../../` paths to `../../../../`
4. **Fix StepContextPanel** - Fix or remove businessDataExtractor import
5. **Fix trade operations** - Check and fix any import errors
6. **Fix transport** - Check and fix any import errors
7. **Remove all 'any' types** - Add proper TypeScript interfaces

## Files to Fix (Priority Order)

### High Priority (Blocking Build)
1. `src/config/api.ts` - process.env issue
2. `features/matching/components/MatchingDashboard/*.tsx` (10 files)
3. `features/inspections/components/InspectorPortal/*.tsx` (2 files)
4. `features/scenarios/components/shared/StepContextPanel.tsx`

### Medium Priority (Type Safety)
5. `features/scenarios/components/ScenarioOrchestrator/ScenarioOrchestrator.tsx` - Remove `any`
6. `features/scenarios/components/shared/DatabaseStatePanel.tsx` - Remove `any`
7. `features/trade-operations/components/*.tsx` - Fix imports

### Low Priority (Clean-up)
8. Remove unused imports
9. Add missing types
10. Verify all barrel exports

## Next Steps

Run this bash command to see exact import patterns:
```bash
grep -r "from '\.\./\.\./'" src/features/matching --include="*.tsx" | head -20
```

Then systematically fix each import path.
