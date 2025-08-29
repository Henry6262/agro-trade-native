# Quick Setup Guide - Using Your Google Maps API Key

## You already have everything you need! ✅

Your API key has **31 APIs enabled**, which includes everything we need:
- ✅ Maps SDK for Android
- ✅ Maps SDK for iOS
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API

## Step 1: Add Your API Key

Edit the file: `src/config/maps.config.ts`

```typescript
// Replace this line:
export const GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';

// With your actual key:
export const GOOGLE_MAPS_API_KEY = 'AIza...'; // Your Maps Platform API Key
```

## Step 2: Platform-Specific Setup

### Android Setup
Edit: `android/app/src/main/AndroidManifest.xml`

```xml
<application>
  <!-- Add your API key here -->
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_API_KEY_HERE"/>
</application>
```

### iOS Setup
Edit: `ios/YourAppName/AppDelegate.mm`

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application 
    didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
  
  // Add this line with your API key
  [GMSServices provideAPIKey:@"YOUR_API_KEY_HERE"];
  
  // ... rest of your code
  return YES;
}
```

## Step 3: Install Dependencies

```bash
# Install the packages
npm install react-native-maps react-native-google-places-autocomplete react-native-geolocation-service

# For iOS
cd ios && pod install
```

## Step 4: Test It!

The component is ready to use:

```javascript
import { SmartBaseCreation } from './components/onboarding/base-management/SmartBaseCreation';

// In your component
<SmartBaseCreation
  onSave={(base) => {
    console.log('New base created:', base);
    // Save to your database
  }}
  onCancel={() => {
    // Handle cancel
  }}
  defaultCountry="Bulgaria"
/>
```

## That's it! 🎉

Your API key already has all the necessary APIs enabled. Just add it to the config file and platform-specific locations, and you're ready to go!

## API Key Security (Important!)

Since you have a general API key with 31 APIs enabled, you should:

### 1. Restrict it in Google Cloud Console

Go to your API key settings and add:
- **Application restrictions**: 
  - Android: Add your app's package name + SHA-1 fingerprint
  - iOS: Add your bundle identifier
  - Web: Add your domain

### 2. API restrictions
- Select "Restrict key" 
- Choose only these APIs:
  - Maps SDK for Android
  - Maps SDK for iOS
  - Maps JavaScript API
  - Places API
  - Geocoding API

This prevents someone from using your key for other Google services.

### 3. Set quotas
In Google Cloud Console, set daily quotas to prevent unexpected charges:
- Places API: 1000 requests/day (for testing)
- Geocoding API: 1000 requests/day (for testing)
- Increase as needed for production

## Billing Estimates

With your usage pattern for base creation:
- **Places Autocomplete**: $2.83 per 1000 requests
- **Geocoding**: $5.00 per 1000 requests
- **Maps loads**: $7.00 per 1000 loads

For a typical user creating 5 bases:
- 5 autocomplete searches = ~$0.02
- 5 geocoding requests = ~$0.03
- 5 map loads = ~$0.04
- **Total: ~$0.09 per user onboarding**

Google gives you $200 free credit monthly, so you can onboard ~2000 users/month for free!

## Troubleshooting

If the map shows but is blank:
- Check that your API key is correctly added in all 3 places (config, Android, iOS)
- Verify the key is not restricted yet (test without restrictions first)

If autocomplete doesn't work:
- Check Places API is enabled (it should be with your 31 APIs)
- Check browser console/React Native logs for errors

If location detection fails:
- Make sure location permissions are enabled on device
- For iOS: Check Info.plist has location usage descriptions
- For Android: Check manifest has location permissions