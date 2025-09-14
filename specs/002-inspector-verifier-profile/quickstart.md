# Inspector/Verifier Profile - Quick Start Guide

## Overview
This guide demonstrates the Inspector/Verifier profile functionality for crop quality verification with real-time location tracking.

## Prerequisites
- React Native development environment set up
- Expo CLI installed
- iOS Simulator or Android Emulator running
- Location permissions enabled

## Quick Setup

### 1. Install Dependencies
```bash
cd front-end
npm install
```

### 2. Start Development Server
```bash
npm run start
# Press 'i' for iOS or 'a' for Android
```

### 3. Enable Inspector Profile
In the app, navigate to Settings > Profile Type and select "Inspector"

## Test Scenarios

### Scenario 1: Inspector Accepts and Completes Job

1. **Login as Inspector**
   - Use test credentials: inspector@agrotrade.com / test123
   - Grant location permissions when prompted

2. **View Available Jobs**
   - Navigate to Inspector Dashboard
   - Switch to "Available Jobs" tab
   - Observe jobs with priority colors:
     - White background = Low priority
     - Yellow background = Medium priority
     - Red background = High priority

3. **Switch to Map View**
   - Tap map icon in Available Jobs tab
   - See all jobs as markers on map
   - Each marker shows:
     - Distance from current location
     - Product name
     - Priority color

4. **Accept a Job**
   - Tap on a high-priority job (red)
   - View job details:
     - Product: Wheat Grade A
     - Location: Field Road 123, Plovdiv
     - Claimed Specs: Moisture 12%, Protein 14%
   - Tap "Accept Job"

5. **Navigate to Active Job**
   - Switch to "Active Job" tab
   - See job status: IN_PROGRESS
   - Map shows route to destination
   - Distance remaining updates in real-time

6. **Complete Verification**
   - Arrive at location (simulated)
   - Tap "Start Verification"
   - Fill verification form:
     - Actual Moisture: 13%
     - Actual Protein: 13.5%
     - Test Method: Laboratory Analysis
     - Add photo evidence
     - Add notes
   - Tap "Submit Verification"

### Scenario 2: Administrator Monitors Inspector

1. **Login as Administrator**
   - Use test credentials: admin@agrotrade.com / admin123

2. **Open Inspector Monitoring**
   - Navigate to Admin Dashboard
   - Select "Inspector Tracking"

3. **View Real-time Locations**
   - See all active inspectors on map
   - Each inspector shows:
     - Current location (blue marker)
     - Destination (red marker)
     - Route line between them
     - Distance remaining (on route line)
   - Location updates every 10 seconds

4. **Inspector Details**
   - Tap on inspector marker
   - View:
     - Name: John Doe
     - Current Job: Wheat verification
     - Status: En route
     - ETA: 25 minutes
     - Battery: 85%

### Scenario 3: Seller Listing Lock

1. **Login as Seller**
   - Use test credentials: seller@agrotrade.com / seller123

2. **View Product Listing**
   - Navigate to My Products
   - Select "Wheat Grade A"
   - Notice: "Pending Verification" badge

3. **After Verification**
   - Refresh listing
   - See "Verified" badge with lock icon
   - Specifications section shows:
     - Original values crossed out
     - Verified values in green
     - "Locked by Inspector" message

4. **Attempt to Edit**
   - Tap "Edit Product"
   - Observe locked fields:
     - Moisture (disabled)
     - Protein (disabled)
     - Gluten (disabled)
   - Other fields remain editable

## Mock Data Testing

### Available Mock Jobs
```javascript
// High Priority - Red
{
  id: "job-001",
  product: "Wheat Grade A",
  location: "Plovdiv",
  distance: "25.5 km",
  priority: "HIGH"
}

// Medium Priority - Yellow
{
  id: "job-002",
  product: "Corn Premium",
  location: "Sofia",
  distance: "45.2 km",
  priority: "MEDIUM"
}

// Low Priority - White
{
  id: "job-003",
  product: "Barley Standard",
  location: "Varna",
  distance: "120.8 km",
  priority: "LOW"
}
```

### Simulated Location Updates
```javascript
// Inspector location updates every 10 seconds
// Speed: 60 km/h on highways, 30 km/h in cities
// Accuracy: 10m in open areas, 30m in urban
```

## Validation Checklist

### Inspector Features
- [ ] Can view available jobs in list and map views
- [ ] Jobs show correct priority colors
- [ ] Can accept a job
- [ ] Active job shows in dedicated tab
- [ ] Location updates while traveling
- [ ] Can complete verification form
- [ ] Can add photo evidence
- [ ] Can submit results

### Administrator Features
- [ ] Can see all active inspectors on map
- [ ] Inspector locations update in real-time
- [ ] Routes show between inspectors and destinations
- [ ] Distance remaining displays on route
- [ ] Can view inspector details

### Seller Features
- [ ] Verified listings show lock icon
- [ ] Cannot edit verified specifications
- [ ] Can edit other product details
- [ ] Verification status displays correctly

## Performance Metrics

### Target Performance
- Location update frequency: 10 seconds
- Map render: < 500ms
- Job list scroll: 60 fps
- Battery drain: < 5% per hour
- Network usage: < 1 MB per hour

### Test Commands
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Check performance
npm run test:performance
```

## Troubleshooting

### Location Not Updating
1. Check location permissions in device settings
2. Ensure GPS is enabled
3. Try moving device (simulator: Debug > Location > City Run)

### Map Not Loading
1. Verify Google Maps API key in .env
2. Check internet connection
3. Clear app cache and restart

### Jobs Not Appearing
1. Pull to refresh job list
2. Check filter settings
3. Verify mock data is loaded

## Next Steps

1. **Test Offline Mode**
   - Disable network
   - Accept job while online
   - Go offline and complete verification
   - Reconnect to sync results

2. **Test Battery Optimization**
   - Run app for 1 hour with tracking
   - Monitor battery usage
   - Verify adaptive accuracy works

3. **Test Edge Cases**
   - Multiple inspectors same area
   - Job reassignment
   - Network interruptions
   - GPS signal loss