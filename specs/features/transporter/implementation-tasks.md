# /tasks Transporter Fleet Management Implementation

## Task 1: Fleet Management Tab Selectors

### 1.1 Create Tab Component for Trucks
- [ ] Add state for active truck tab ('available' | 'in_transit')
- [ ] Create TabSelector component with two options
- [ ] Filter mockTrucks array based on selected tab
- [ ] Add count badges to show number in each category
- [ ] Style tabs to match existing app design

### 1.2 Create Tab Component for Drivers  
- [ ] Add state for active driver tab ('available' | 'assigned')
- [ ] Create TabSelector for drivers section
- [ ] Filter mockDrivers array based on selected tab
- [ ] Add count badges for each driver category
- [ ] Ensure consistent styling with truck tabs

### 1.3 UI Polish
- [ ] Add smooth transitions when switching tabs
- [ ] Implement active tab indicator (underline or background)
- [ ] Preserve scroll position between tab switches
- [ ] Add loading states if needed

## Task 2: Drawer-Based Add Flow

### 2.1 Study Seller Product Creation Pattern
- [ ] Analyze ProductCreationFlow component structure
- [ ] Understand useProductCreation hook pattern
- [ ] Note the drawer animation and backdrop behavior
- [ ] Document the step navigation approach

### 2.2 Create TruckCreationFlow Component
- [ ] Create new component: TruckCreationFlow.tsx
- [ ] Implement multi-step form structure
- [ ] Add progress indicator component
- [ ] Create individual step components:
  - [ ] BasicInfoStep
  - [ ] SpecificationsStep
  - [ ] DocumentsStep
  - [ ] ReviewStep
- [ ] Add navigation between steps
- [ ] Implement form validation

### 2.3 Create DriverCreationFlow Component
- [ ] Create new component: DriverCreationFlow.tsx
- [ ] Implement multi-step form for drivers
- [ ] Reuse progress indicator from truck flow
- [ ] Create driver-specific step components:
  - [ ] PersonalInfoStep
  - [ ] LicensingStep
  - [ ] ExperienceStep
  - [ ] ReviewStep
- [ ] Add step navigation logic
- [ ] Implement validation rules

### 2.4 Replace Modals with Drawers
- [ ] Remove Modal imports and usage
- [ ] Replace "Add New Truck" button handler
- [ ] Replace "Add New Driver" button handler
- [ ] Ensure drawer slides from bottom
- [ ] Add backdrop with proper opacity

## Task 3: Google Maps Integration

### 3.1 Research Existing Map Implementation
- [ ] Find existing Google Maps components in codebase
- [ ] Understand current SDK setup and API keys
- [ ] Note how markers are currently placed
- [ ] Study route calculation implementation

### 3.2 Add View Route Button
- [ ] Add button to each offer card in TransporterTransfersTab
- [ ] Create state for selected offer and map visibility
- [ ] Style button to match existing UI

### 3.3 Create RouteMapDrawer Component
- [ ] Create new component: RouteMapDrawer.tsx
- [ ] Implement drawer that slides up with map
- [ ] Add Google Maps component inside drawer
- [ ] Set initial map center and zoom

### 3.4 Implement Single Route Display
- [ ] Add pickup location marker (Point A)
- [ ] Add delivery location marker (Point B)
- [ ] Calculate and display route between points
- [ ] Show route information (distance, time)

### 3.5 Implement Multi-Truck Routes
- [ ] Add logic to detect multi-truck requirements
- [ ] Place truck markers on map (up to 3 trucks)
- [ ] Calculate route from each truck to destination
- [ ] Display routes in different colors:
  - [ ] Truck 1: Blue route
  - [ ] Truck 2: Green route
  - [ ] Truck 3: Orange route

### 3.6 Add Information Overlays
- [ ] Create custom marker with info display
- [ ] Show kilometers to destination on each truck
- [ ] Display ETA for each truck
- [ ] Add truck identifier (license plate)
- [ ] Create route details panel with:
  - [ ] Total distances
  - [ ] Fuel estimates
  - [ ] Time estimates

### 3.7 Map Interactions
- [ ] Enable zoom and pan gestures
- [ ] Add recenter button
- [ ] Implement marker tap to show details
- [ ] Add route selection to highlight specific path

## Implementation Order

1. **Start with Task 1** (Tab Selectors) - Simplest, immediate visual improvement
2. **Then Task 2** (Drawer Flow) - Study existing pattern, then implement
3. **Finally Task 3** (Maps) - Most complex, requires SDK integration

## Files to Modify/Create

### Task 1 Files:
- `/front-end/src/features/dashboard/screens/transporter/components/TransporterFleetTab.tsx` (modify)

### Task 2 Files:
- `/front-end/src/features/dashboard/screens/transporter/fleet-creation/TruckCreationFlow.tsx` (create)
- `/front-end/src/features/dashboard/screens/transporter/fleet-creation/DriverCreationFlow.tsx` (create)
- `/front-end/src/features/dashboard/screens/transporter/fleet-creation/components/` (create folder with step components)
- `/front-end/src/features/dashboard/screens/transporter/fleet-creation/hooks/useTruckCreation.ts` (create)
- `/front-end/src/features/dashboard/screens/transporter/fleet-creation/hooks/useDriverCreation.ts` (create)

### Task 3 Files:
- `/front-end/src/features/dashboard/screens/transporter/components/TransporterTransfersTab.tsx` (modify)
- `/front-end/src/features/dashboard/screens/transporter/components/RouteMapDrawer.tsx` (create)
- `/front-end/src/shared/components/MapRoute.tsx` (possibly create or reuse)