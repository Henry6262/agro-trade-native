# /specify Enhance Transporter Fleet Management Tab

Build an improved fleet management interface for the transporter dashboard with the following specific features:

## Task 1: Fleet Management UI Improvements

### Tab Selector for Trucks
Create a tab selector at the top of the fleet management page that allows switching between:
- **Available Trucks**: Show only trucks with status "available"
- **In Transit Trucks**: Show only trucks with status "assigned" or "in_transit"

### Tab Selector for Drivers  
Similarly, add a tab selector for drivers to filter between:
- **Available Drivers**: Show only drivers with status "available"
- **Assigned Drivers**: Show only drivers with status "assigned"

### UI Requirements
- Use the same tab component style as seen in other parts of the app
- Smooth transitions between tabs
- Show count badges on each tab (e.g., "Available (8)", "In Transit (4)")
- Maintain scroll position when switching tabs
- Visual indicator for the active tab

## Task 2: Add Person/Truck Flow Using Drawer Pattern

### Implementation Requirements
Replace the current modal approach with a drawer-based flow that matches the seller's product creation pattern found in:
- `@front-end/src/features/dashboard/screens/seller/product-creation/`
- `@front-end/src/features/dashboard/screens/seller/SellerProductsTab.tsx`

### Drawer Flow for Adding Truck
1. User clicks "Add New Truck" button
2. Drawer slides up from bottom (not a modal)
3. Multi-step form within drawer:
   - Step 1: Basic Info (License Plate, Model)
   - Step 2: Specifications (Capacity, Year, Features)
   - Step 3: Verification Documents (Upload/Camera)
   - Step 4: Review & Submit
4. Progress indicator showing current step
5. Back/Next navigation between steps

### Drawer Flow for Adding Driver
1. User clicks "Add New Driver" button
2. Drawer slides up from bottom
3. Multi-step form:
   - Step 1: Personal Info (Name, Phone)
   - Step 2: Licensing (CDL Number, Expiry)
   - Step 3: Experience & Qualifications
   - Step 4: Review & Submit
4. Same navigation pattern as truck addition

## Task 3: Google Maps Integration for Incoming Offers

### Map Drawer for Route Visualization
When viewing incoming offers in the TransporterTransfersTab:

1. **Trigger Button**: Add a "View Route" button on each offer card
2. **Drawer Opens**: Shows Google Maps with:
   - Point A (pickup location) marker
   - Point B (delivery location) marker
   - Calculated route between points
   - Route information overlay

### Multiple Truck Route Display
For jobs requiring multiple trucks:
1. Display all participating trucks as markers on the map
2. Show 3 different routes:
   - Route from Truck 1 current location to destination
   - Route from Truck 2 current location to destination
   - Route from Truck 3 current location to destination
3. Each route in a different color for clarity

### Distance & Time Information
On each truck marker/pin, display:
- Distance in kilometers to reach the destination
- Estimated time of arrival (ETA)
- Truck identifier (license plate or ID)

### Map Features
- Use existing Google Maps SDK implementation as reference
- Interactive map with zoom/pan capabilities
- Route details panel showing:
  - Total distance for each truck
  - Fuel estimates
  - Time estimates
  - Traffic conditions

## Technical Notes

### Reference Existing Implementation
Use the existing map implementation in the codebase for:
- Google Maps SDK setup
- Map component initialization
- Marker placement
- Route calculation

### Mock Data Usage
Continue using mock data for:
- Truck locations
- Driver information
- Route calculations
- Distance/time estimates

### Visual Consistency
Ensure all new UI elements match:
- Current dark theme
- NativeWind/Tailwind styling
- Existing component patterns
- Animation/transition styles

## Questions to Clarify During Implementation
- Specific styling preferences for the tab selectors?
- Preferred colors for the multiple route lines on the map?
- Should the drawer have a backdrop overlay?
- Any specific validation rules for truck/driver data?
- Preferred map zoom level when showing multiple routes?