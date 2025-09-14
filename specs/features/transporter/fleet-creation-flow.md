# /specify Unified Fleet Creation Drawer Flow

Create a single drawer-based creation flow for adding both trucks and drivers to the transporter fleet, following the pattern established in the seller's product creation flow.

## Core Requirements

### Single Entry Point
- One "Add to Fleet" button that triggers the creation process
- Button should be prominently placed in the Fleet Management tab
- Replaces the current two separate buttons (Add Truck / Add Driver)

### Initial Selection Step
When the drawer opens, the first screen should present:
- **Choice Interface**: Two options clearly displayed
  - 🚛 Add New Truck
  - 👤 Add New Driver
- Visual cards or buttons for selection
- Each option should have an icon and description
- Selection determines the subsequent flow

## Truck Creation Flow

### Step 1: Basic Information
- License Plate (required)
- Truck Model/Make
- Year of Manufacture
- Vehicle Type (Flatbed, Refrigerated, etc.)

### Step 2: Specifications
- Capacity (in tons)
- Fuel Type
- Fuel Efficiency (km/liter)
- Special Features (GPS, Temperature Control, etc.)

### Step 3: Documentation
- Registration Document (upload/camera)
- Insurance Certificate
- Inspection Certificate
- Photos of the truck

### Step 4: Review & Submit
- Summary of all entered information
- Edit capability for any section
- Submit for verification button

## Driver Creation Flow

### Step 1: Personal Information
- Full Name
- Phone Number
- Email Address
- Date of Birth

### Step 2: Licensing
- CDL/License Number
- License Type/Class
- Expiry Date
- Years of Experience

### Step 3: Documentation
- License Photo (upload/camera)
- ID Verification
- Medical Certificate
- Background Check Status

### Step 4: Review & Submit
- Summary of all information
- Edit capability
- Add to fleet button

## Technical Implementation

### Folder Structure
```
front-end/src/features/dashboard/screens/transporter/fleet-creation/
├── FleetCreationFlow.tsx           # Main drawer component
├── hooks/
│   ├── useFleetCreation.ts         # Shared logic for fleet creation
│   ├── useTruckCreation.ts         # Truck-specific logic
│   └── useDriverCreation.ts        # Driver-specific logic
├── components/
│   ├── shared/
│   │   ├── CreationTypeSelector.tsx    # Initial choice screen
│   │   ├── ProgressIndicator.tsx       # Step progress display
│   │   └── NavigationButtons.tsx       # Back/Next buttons
│   ├── truck/
│   │   ├── TruckBasicInfoStep.tsx
│   │   ├── TruckSpecificationsStep.tsx
│   │   ├── TruckDocumentsStep.tsx
│   │   └── TruckReviewStep.tsx
│   └── driver/
│       ├── DriverPersonalInfoStep.tsx
│       ├── DriverLicensingStep.tsx
│       ├── DriverDocumentsStep.tsx
│       └── DriverReviewStep.tsx
├── types.ts                        # TypeScript interfaces
└── index.ts                        # Exports
```

### Component Architecture
- **Single Drawer Component**: `FleetCreationFlow` manages the entire flow
- **Dynamic Content Rendering**: Based on creation type and current step
- **State Management**: Use local state with useState for form data
- **Navigation**: Track current step and type in component state
- **Validation**: Per-step validation before allowing progression

### UI/UX Patterns
- Drawer slides up from bottom (matching seller product creation)
- Backdrop overlay with opacity
- Swipe down to close (with confirmation if data entered)
- Keyboard-aware scrolling
- Loading states during submission
- Success feedback before closing

## Integration Points

### Replace Current Implementation
1. Remove both Modal components from TransporterFleetTab
2. Remove separate "Add Truck" and "Add Driver" buttons
3. Add single "Add to Fleet" button
4. Import and use FleetCreationFlow component

### Data Flow
1. User clicks "Add to Fleet"
2. Drawer opens with type selection
3. User selects truck or driver
4. Progresses through relevant steps
5. Submits data (currently to mock/console)
6. Success state shows
7. Drawer closes and list refreshes

## Styling Guidelines
- Use NativeWind/Tailwind classes consistently
- Dark theme with neutral backgrounds
- Green accent for truck-related elements
- Blue accent for driver-related elements
- Consistent spacing and padding
- Smooth transitions between steps