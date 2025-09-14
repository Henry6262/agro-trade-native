# Tasks: Google Maps Integration for Transporter Incoming Offers

## Feature Overview
Implement Google Maps integration in TransporterTransfersTab to visualize routes from available trucks to delivery destinations, with dynamic truck allocation based on offer quantity and fleet availability.

## Reference Implementation
- Existing Map Component: `/front-end/src/shared/components/LocationMapPicker.tsx`
- Target Directory: `/front-end/src/features/dashboard/screens/transporter/`

---

## Setup Tasks

### T001: Install Required Dependencies [P]
**File:** `/front-end/package.json`
- Verify react-native-maps is installed
- Verify expo-location is installed
- Check Google Maps API key configuration
- Ensure @react-native-maps/polyline for route drawing

### T002: Create Map Integration Types [P]
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/types.ts`
```typescript
- RouteVisualization interface
- TruckRoute interface
- OfferMapData interface
- MapDrawerProps interface
```

---

## Core Implementation Tasks

### T003: Create Route Calculation Hook
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/hooks/useRouteCalculation.ts`
- Calculate required trucks based on offer quantity and truck capacity
- Get available trucks from fleet
- Calculate distance and time for each truck to destination
- Handle Google Directions API integration

### T004: Create Truck Marker Component
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/components/TruckMarker.tsx`
- Display truck icon with identifier
- Show distance in kilometers
- Show estimated time
- Color-code based on route assignment

### T005: Create Route Display Component
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/components/RouteDisplay.tsx`
- Draw polyline routes on map
- Different colors for each truck route (Blue, Green, Orange, Purple, etc.)
- Handle multiple routes display
- Animate route drawing

### T006: Create Map Drawer Component
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/components/OfferMapDrawer.tsx`
- Modal/Drawer that slides from bottom
- Contains MapView with Google provider
- Display pickup and delivery markers
- Show all truck routes
- Legend for truck assignments

### T007: Add View Route Button to Offer Cards
**File:** `/front-end/src/features/dashboard/screens/transporter/components/TransporterTransfersTab.tsx`
- Add "View Route" button to each IncomingOffer card
- Add state for selected offer and drawer visibility
- Pass offer data to map drawer
- Style button consistently with existing UI

### T008: Create Map Controller Component
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/components/MapController.tsx`
- Handle map initialization
- Manage map bounds to show all routes
- Control zoom levels
- Handle map interactions

### T009: Create Route Info Panel
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/components/RouteInfoPanel.tsx`
- Display summary of all routes
- Show total distance covered
- Display estimated fuel costs
- List assigned trucks with details

### T010: Implement Truck Allocation Logic
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/utils/truckAllocation.ts`
- Calculate trucks needed based on offer quantity
- Select optimal trucks based on proximity
- Handle partial loads
- Return truck assignments

---

## Integration Tasks

### T011: Integrate with Fleet Data
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/hooks/useFleetIntegration.ts`
- Connect to TransporterFleetTab truck data
- Get real-time truck locations (mock for now)
- Filter available trucks only
- Calculate truck capacity

### T012: Add Mock Location Data
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/mockData.ts`
- Mock truck current locations
- Mock pickup/delivery coordinates
- Mock route waypoints
- Mock traffic conditions

### T013: Create Map Utilities
**File:** `/front-end/src/features/dashboard/screens/transporter/maps/utils/mapUtils.ts`
- Calculate map bounds for all markers
- Format distance (km/miles)
- Format duration (hours/minutes)
- Generate route colors

---

## Polish Tasks [P]

### T014: Add Loading States [P]
**Files:** All map components
- Show skeleton while map loads
- Loading indicator during route calculation
- Smooth transitions

### T015: Add Error Handling [P]
**Files:** All map components
- Handle map load failures
- Handle route calculation errors
- Fallback UI states
- User-friendly error messages

### T016: Optimize Performance [P]
**Files:** Map components
- Implement marker clustering for many trucks
- Lazy load routes
- Memoize calculations
- Virtualize truck lists

### T017: Add Animations [P]
**Files:** Map components
- Animate drawer opening
- Animate route drawing
- Animate marker placement
- Smooth map transitions

### T018: Create Unit Tests [P]
**Files:** `__tests__/` directories
- Test truck allocation logic
- Test route calculation
- Test distance/time formatting
- Test error scenarios

---

## Execution Order

### Phase 1: Foundation (T001-T002)
```bash
# Can run in parallel
Task subagent_type=shell-command prompt="Install map dependencies in package.json"
Task subagent_type=code-writer prompt="Create TypeScript interfaces for map integration"
```

### Phase 2: Core Components (T003-T006)
```bash
# Sequential - build up the components
Task subagent_type=code-writer prompt="Create route calculation hook"
Task subagent_type=code-writer prompt="Create truck marker component"
Task subagent_type=code-writer prompt="Create route display component"
Task subagent_type=code-writer prompt="Create map drawer component"
```

### Phase 3: Integration (T007-T013)
```bash
# T007 must be done first, then others can be parallel
Task subagent_type=code-writer prompt="Add View Route button to TransporterTransfersTab"

# Then these can run in parallel [P]
Task subagent_type=code-writer prompt="Create map controller component"
Task subagent_type=code-writer prompt="Create route info panel"
Task subagent_type=code-writer prompt="Implement truck allocation logic"
Task subagent_type=code-writer prompt="Integrate with fleet data"
Task subagent_type=code-writer prompt="Add mock location data"
Task subagent_type=code-writer prompt="Create map utilities"
```

### Phase 4: Polish (T014-T018)
```bash
# All can run in parallel [P]
Task subagent_type=code-writer prompt="Add loading states to map components"
Task subagent_type=code-writer prompt="Add error handling to map components"
Task subagent_type=code-writer prompt="Optimize map performance"
Task subagent_type=code-writer prompt="Add animations to map interactions"
Task subagent_type=test-writer prompt="Create unit tests for map functionality"
```

---

## Key Implementation Details

### Dynamic Truck Allocation
- Number of trucks is NOT fixed at 3
- Calculate based on: `Math.ceil(offerQuantity / truckCapacity)`
- Select nearest available trucks
- Show only required number of routes

### Route Visualization
- Each truck gets a unique color
- Colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']
- Display truck ID on marker
- Show distance and ETA on each marker

### Map Interaction
- Center map to show all routes
- Allow zoom and pan
- Tap markers for details
- Recalculate routes on truck selection change

### Using LocationMapPicker as Reference
- Copy map initialization pattern
- Reuse marker styling approach
- Adapt drawer sliding mechanism
- Use similar permission handling

---

## Success Criteria

- [ ] "View Route" button appears on each offer card
- [ ] Drawer opens smoothly with map
- [ ] Map shows pickup and delivery locations
- [ ] Correct number of trucks allocated based on quantity
- [ ] Each truck has unique colored route
- [ ] Distance and time shown on truck markers
- [ ] Routes are clearly visible and distinguishable
- [ ] Map performance is smooth with multiple routes
- [ ] Error states handled gracefully
- [ ] Works on both iOS and Android platforms

---

## Notes

- Start with hardcoded/mock truck locations
- Use Google Directions API for actual route calculation (or mock initially)
- Ensure accessibility with proper labels
- Follow existing dark theme styling
- Test with various offer quantities (5 tons, 50 tons, 150 tons)
- Consider offline fallback for poor connectivity