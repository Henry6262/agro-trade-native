# Implementation Tasks: Google Maps Integration for Transporter Route Visualization

**Branch**: `001-add-google-maps` | **Date**: 2024-01-13
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

## Task Generation Summary
- Total tasks: 35
- Test tasks: 18 (51%)
- Implementation tasks: 17 (49%)
- Constitution compliance: ✅ Tests before implementation

## Phase 0: Research & Setup (3 tasks)

### ✅ 001. Document React Native Maps best practices
- Research performance optimization for multiple routes
- Document custom marker implementation patterns
- Create research.md with findings
- **Estimate**: 30 min
- **Output**: research.md created

### ✅ 002. Set up feature branch and directory structure
- Create feature branch `001-add-google-maps`
- Set up maps directory structure under transporter
- **Estimate**: 15 min
- **Output**: Directory structure created

### ✅ 003. Create data model documentation
- Define MapOffer, TruckMarker, RouteData entities
- Document relationships and attributes
- **Estimate**: 30 min
- **Output**: data-model.md created

## Phase 1: Contract Testing (5 tasks)

### ⬜ 004. Write contract test for fleet data API
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/contract/fleet-api.test.ts
describe('Fleet API Contract', () => {
  it('should return available trucks with required fields', async () => {
    const response = await fetchAvailableFleet();
    expect(response).toHaveProperty('trucks');
    expect(response.trucks[0]).toHaveProperty('id');
    expect(response.trucks[0]).toHaveProperty('location');
    expect(response.trucks[0]).toHaveProperty('capacity');
  });
});
```
- **Estimate**: 45 min
- **Output**: Contract test file

### ⬜ 005. Write contract test for route calculation API
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/contract/route-api.test.ts
describe('Route Calculation Contract', () => {
  it('should calculate route with polyline points', async () => {
    const route = await calculateRoute(truckLocation, destination);
    expect(route).toHaveProperty('polyline');
    expect(route).toHaveProperty('distance');
    expect(route).toHaveProperty('duration');
  });
});
```
- **Estimate**: 45 min
- **Output**: Contract test file

### ⬜ 006. Write contract test for offer map data
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/contract/offer-api.test.ts
describe('Offer Map Data Contract', () => {
  it('should return offer with location data', async () => {
    const offer = await getOfferMapData('offer-123');
    expect(offer).toHaveProperty('pickup');
    expect(offer).toHaveProperty('delivery');
    expect(offer.pickup).toHaveProperty('coordinates');
  });
});
```
- **Estimate**: 30 min
- **Output**: Contract test file

### ⬜ 007. Implement mock API responses
**GREEN PHASE - Make contract tests pass**
- Create mock fleet data with Zustand
- Create mock route calculation
- Create mock offer location data
- **Estimate**: 1 hour
- **Output**: Mock implementations

### ⬜ 008. Refactor mock data structure
**REFACTOR PHASE**
- Optimize mock data structure
- Extract reusable mock utilities
- **Estimate**: 30 min
- **Output**: Refactored mocks

## Phase 2: Component Testing (8 tasks)

### ⬜ 009. Write test for View Route button
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/view-route-button.test.tsx
describe('View Route Button', () => {
  it('should display View Route button on offer card', () => {
    render(<OfferCard offer={mockOffer} />);
    expect(screen.getByText('View Route')).toBeTruthy();
  });
});
```
- **Estimate**: 30 min
- **Output**: Button test file

### ⬜ 010. Implement View Route button
**GREEN PHASE**
- Add button to TransporterTransfersTab
- Style with NativeWind
- **Estimate**: 30 min
- **Output**: Button implemented

### ⬜ 011. Write test for map drawer opening
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/map-drawer.test.tsx
describe('Map Drawer', () => {
  it('should open drawer when View Route is clicked', async () => {
    render(<TransporterTransfersTab />);
    fireEvent.press(screen.getByText('View Route'));
    await waitFor(() => {
      expect(screen.getByTestId('map-drawer')).toBeTruthy();
    });
  });
});
```
- **Estimate**: 45 min
- **Output**: Drawer test file

### ⬜ 012. Implement map drawer component
**GREEN PHASE**
- Create MapDrawer component
- Integrate with existing drawer pattern
- **Estimate**: 1 hour
- **Output**: MapDrawer.tsx

### ⬜ 013. Write test for map rendering
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/map-view.test.tsx
describe('Map View', () => {
  it('should render map with markers', () => {
    render(<RouteMapView offer={mockOffer} trucks={mockTrucks} />);
    expect(screen.getByTestId('route-map')).toBeTruthy();
    expect(screen.getAllByTestId('truck-marker')).toHaveLength(3);
  });
});
```
- **Estimate**: 45 min
- **Output**: Map view test

### ⬜ 014. Implement RouteMapView component
**GREEN PHASE**
- Create RouteMapView with react-native-maps
- Reference LocationMapPicker patterns
- **Estimate**: 2 hours
- **Output**: RouteMapView.tsx

### ⬜ 015. Write test for truck allocation logic
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/unit/truck-allocation.test.ts
describe('Truck Allocation', () => {
  it('should allocate correct number of trucks', () => {
    const trucks = allocateTrucks(120, 40); // 120 tons, 40 ton capacity
    expect(trucks).toBe(3);
  });
});
```
- **Estimate**: 30 min
- **Output**: Allocation test

### ⬜ 016. Implement truck allocation hook
**GREEN PHASE**
- Create useTruckAllocation hook
- Implement dynamic calculation logic
- **Estimate**: 45 min
- **Output**: useTruckAllocation.ts

## Phase 3: Map Features Testing (8 tasks)

### ⬜ 017. Write test for route polylines
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/route-polyline.test.tsx
describe('Route Polylines', () => {
  it('should display polyline for each truck route', () => {
    render(<RouteMapView offer={mockOffer} trucks={mockTrucks} />);
    expect(screen.getAllByTestId('route-polyline')).toHaveLength(3);
  });
});
```
- **Estimate**: 45 min
- **Output**: Polyline test

### ⬜ 018. Implement route polylines
**GREEN PHASE**
- Add Polyline components
- Use different colors per truck
- **Estimate**: 1 hour
- **Output**: Polylines rendered

### ⬜ 019. Write test for custom truck markers
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/truck-markers.test.tsx
describe('Truck Markers', () => {
  it('should display truck info on markers', () => {
    render(<TruckMarker truck={mockTruck} />);
    expect(screen.getByText('T1')).toBeTruthy();
    expect(screen.getByText('15 km')).toBeTruthy();
  });
});
```
- **Estimate**: 45 min
- **Output**: Marker test

### ⬜ 020. Implement custom truck markers
**GREEN PHASE**
- Create TruckMarker component
- Add info overlays
- **Estimate**: 1 hour
- **Output**: TruckMarker.tsx

### ⬜ 021. Write test for map bounds calculation
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/unit/map-bounds.test.ts
describe('Map Bounds', () => {
  it('should calculate bounds to fit all markers', () => {
    const bounds = calculateMapBounds(markers);
    expect(bounds).toHaveProperty('northeast');
    expect(bounds).toHaveProperty('southwest');
  });
});
```
- **Estimate**: 30 min
- **Output**: Bounds test

### ⬜ 022. Implement map bounds utility
**GREEN PHASE**
- Create calculateMapBounds utility
- Auto-adjust viewport
- **Estimate**: 45 min
- **Output**: mapUtils.ts

### ⬜ 023. Write test for route legend
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/route-legend.test.tsx
describe('Route Legend', () => {
  it('should display color legend for trucks', () => {
    render(<RouteLegend trucks={mockTrucks} />);
    expect(screen.getByText('T1 - Blue')).toBeTruthy();
  });
});
```
- **Estimate**: 30 min
- **Output**: Legend test

### ⬜ 024. Implement route legend component
**GREEN PHASE**
- Create RouteLegend component
- Match colors to routes
- **Estimate**: 45 min
- **Output**: RouteLegend.tsx

## Phase 4: Edge Cases & Error Handling (5 tasks)

### ⬜ 025. Write test for insufficient trucks
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/insufficient-trucks.test.tsx
describe('Insufficient Trucks', () => {
  it('should show warning when not enough trucks', () => {
    render(<RouteMapView offer={largeMockOffer} trucks={fewTrucks} />);
    expect(screen.getByText('Insufficient trucks')).toBeTruthy();
  });
});
```
- **Estimate**: 30 min
- **Output**: Edge case test

### ⬜ 026. Implement insufficient trucks handling
**GREEN PHASE**
- Add warning UI
- Suggest truck requirements
- **Estimate**: 45 min
- **Output**: Warning implemented

### ⬜ 027. Write test for offline mode
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/integration/offline-mode.test.tsx
describe('Offline Mode', () => {
  it('should show cached data with warning', () => {
    render(<RouteMapView offline={true} />);
    expect(screen.getByText('Offline - Cached data')).toBeTruthy();
  });
});
```
- **Estimate**: 30 min
- **Output**: Offline test

### ⬜ 028. Implement offline handling
**GREEN PHASE**
- Add offline detection
- Show cached data warning
- **Estimate**: 45 min
- **Output**: Offline support

### ⬜ 029. Write test for performance with 10 trucks
**TEST FIRST - RED PHASE**
```typescript
// __tests__/transporter/maps/performance/many-trucks.test.tsx
describe('Performance', () => {
  it('should render 10 trucks within 2 seconds', async () => {
    const start = Date.now();
    render(<RouteMapView trucks={tenTrucks} />);
    await waitFor(() => {
      expect(Date.now() - start).toBeLessThan(2000);
    });
  });
});
```
- **Estimate**: 45 min
- **Output**: Performance test

## Phase 5: Integration & Polish (6 tasks)

### ⬜ 030. Integrate MapDrawer with TransporterTransfersTab
- Wire up View Route button
- Connect to offer data
- **Estimate**: 1 hour
- **Output**: Integration complete

### ⬜ 031. Add loading states
- Implement skeleton loaders
- Add progress indicators
- **Estimate**: 45 min
- **Output**: Loading states

### ⬜ 032. Add animations
- Drawer slide animation
- Marker appearance animation
- **Estimate**: 1 hour
- **Output**: Animations added

### ⬜ 033. Apply dark theme styling
- Use NativeWind classes
- Match existing theme
- **Estimate**: 45 min
- **Output**: Dark theme applied

### ⬜ 034. Run all tests and fix failures
- Execute full test suite
- Fix any failing tests
- **Estimate**: 1 hour
- **Output**: All tests passing

### ⬜ 035. Update CLAUDE.md with Maps context
- Document Maps integration
- Add usage patterns
- **Estimate**: 30 min
- **Output**: CLAUDE.md updated

## Summary Statistics

### Test Coverage
- Contract tests: 3
- Integration tests: 10
- Unit tests: 3
- Performance tests: 1
- Edge case tests: 1
- **Total test tasks**: 18

### Implementation Distribution
- Setup/Research: 3
- Core components: 7
- Features: 5
- Polish: 2
- **Total implementation tasks**: 17

### Time Estimates
- Total estimated time: ~24 hours
- Test writing: ~10 hours (42%)
- Implementation: ~14 hours (58%)

### Constitution Compliance
- ✅ Tests written before implementation
- ✅ Red-Green-Refactor cycle enforced
- ✅ Mobile-first design
- ✅ Mock-first development
- ✅ Component reusability (referencing LocationMapPicker)
- ✅ State management (Zustand for mock data)
- ✅ Technology stack (React Native Maps, NativeWind)

---
*Based on Agro-Trade Constitution v1.0.0 - Tests MUST be written and approved before implementation*