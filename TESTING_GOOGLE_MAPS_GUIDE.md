# 🗺️ Testing Google Maps Transport Visualization

## Quick Test Guide

### ⚠️ Prerequisites
1. Backend running on port 4000: `cd backend && npm run start:dev`
2. Frontend running: `cd front-end && npm start`
3. Login as admin user

## 📋 Step-by-Step Testing Flow

### Step 1: Go to Admin Operations Screen
```
Dashboard → Admin Tab → Operations/Matcher Screen
```

### Step 2: Create a Trade Operation
1. In **"Buy Orders"** tab (first tab)
2. Select any buy listing (tap to highlight in green)
3. Click green **"Create Trade Operation"** button at bottom
4. Enter profit margin: `7.5`
5. Click **"Create Trade"**

### Step 3: Find & Add Sellers
1. Automatically switches to **"Sellers"** tab
2. Click **"Find Sellers"** button (top right)
3. Wait for sellers to load
4. Tap 2-3 seller cards (they turn green when selected)
5. Click blue **"Add X Seller(s)"** button at bottom

### Step 4: View Active Trade & Estimate Transport
1. Go to **"Active Trade"** tab (third tab)
2. You'll see:
   - Trade operation details
   - Profit Analysis (if sellers added)
   - Blue **"Estimate Transport"** button
3. Click **"Estimate Transport"** button
4. Wait for loading...

### Step 5: 🎉 View the Map!
1. After transport estimation completes, you'll see a "Transport Estimate" box
2. Look for the **"View Map"** button (small blue button, top-right of Transport Estimate box)
3. Click **"View Map"** to open the fullscreen map!

## 🗺️ What You'll See in the Map

### Map Features:
- **Gray Package Icon**: Warehouse (starting point)
- **Orange Numbered Markers (1, 2, 3)**: Pickup locations at farms
- **Green Pin**: Final delivery destination
- **Blue Route Line**: Transport path
- **Info Box**: Shows distance, duration, and cost
- **Bottom Cards**: Scrollable location details

### Map Modal Features:
- Full route visualization
- Route summary with total distance/time/cost
- Cost breakdown
- Pickup schedule with all stops
- "Confirm Transport Route" button

## 🔍 If You Don't See the "View Map" Button

### Checklist:
- [ ] Did you create a trade operation?
- [ ] Did you add sellers to the trade?
- [ ] Did you click "Estimate Transport"?
- [ ] Did the transport estimate load successfully?

### The "View Map" button only appears when:
1. You have an active trade operation
2. You have selected sellers
3. You have successfully estimated transport

## 💡 Quick Test Data

If the backend doesn't have data, the app uses mock data. The transport estimation will still work with mock coordinates showing:
- Warehouse in Iowa
- Multiple farm pickups
- Delivery to Chicago

## 🐛 Troubleshooting

### "View Map" button not showing:
```javascript
// The button appears here in the Transport Estimate box:
Transport Estimate        [View Map]  <-- Look here!
Distance: 350 km
Duration: 6 hours
Transport Cost: $425.50
```

### Map not loading:
- Make sure you have Google Maps API key in `.env.local`:
  ```
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here
  ```

### No sellers available:
- The backend might not have seller data
- The app will show mock sellers if no real data

## 📱 Testing on Simulator

1. iOS Simulator: Press `i` in terminal
2. Android Emulator: Press `a` in terminal
3. Physical device: Scan QR code with Expo Go app

## 🎯 Expected Flow Summary

```
Buy Orders Tab → Select Listing → Create Trade
    ↓
Sellers Tab → Find Sellers → Select 2-3 → Add Sellers
    ↓
Active Trade Tab → Estimate Transport → VIEW MAP! 🗺️
```

The entire flow takes about 1-2 minutes to complete.