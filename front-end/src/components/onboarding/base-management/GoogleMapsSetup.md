# Google Maps Integration Setup Guide

## Prerequisites

1. Google Cloud Platform account with billing enabled
2. React Native project configured for iOS and Android

## Step 1: Enable Required APIs

Go to [Google Cloud Console](https://console.cloud.google.com/) and enable:

- Maps SDK for Android
- Maps SDK for iOS  
- Maps JavaScript API
- Places API
- Geocoding API

## Step 2: Installation

```bash
# Core dependencies
npm install react-native-maps react-native-google-places-autocomplete react-native-geolocation-service

# iOS specific
cd ios && pod install

# Additional for web support
npm install @react-google-maps/api
```

## Step 3: Android Configuration

### `android/app/src/main/AndroidManifest.xml`

```xml
<manifest>
  <!-- Permissions -->
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
  
  <application>
    <!-- Google Maps API Key -->
    <meta-data
      android:name="com.google.android.geo.API_KEY"
      android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
      
    <!-- Google Play Services -->
    <uses-library android:name="org.apache.http.legacy" android:required="false"/>
  </application>
</manifest>
```

### `android/app/build.gradle`

```gradle
dependencies {
    implementation "com.google.android.gms:play-services-maps:18.1.0"
    implementation "com.google.android.gms:play-services-location:21.0.1"
}
```

## Step 4: iOS Configuration

### `ios/YourApp/AppDelegate.mm`

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  // ... rest of your code
}
```

### `ios/YourApp/Info.plist`

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>This app needs access to location when open to show your current position on the map.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>This app needs access to location to show nearby bases and warehouses.</string>
```

## Step 5: Environment Variables

Create `.env` file in project root:

```env
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### For React Native

```bash
npm install react-native-dotenv
```

Update `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: '.env',
    }]
  ]
};
```

## Step 6: Web Configuration (Optional)

For web support, create a proxy server to handle CORS:

### `server/proxy.js`

```javascript
const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/places/*', async (req, res) => {
  const url = `https://maps.googleapis.com/maps/api${req.url}`;
  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001);
```

## Step 7: Usage in Components

```javascript
import { GOOGLE_MAPS_API_KEY } from '@env';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Use in component
<GooglePlacesAutocomplete
  query={{
    key: GOOGLE_MAPS_API_KEY,
    language: 'en',
  }}
  // ... other props
/>
```

## API Key Security Best Practices

### 1. Restrict API Keys

In Google Cloud Console, restrict your API keys:

- **Android**: Restrict to your app's package name and SHA-1 fingerprint
- **iOS**: Restrict to your app's bundle identifier
- **Web**: Restrict to specific domains

### 2. Use Different Keys for Different Platforms

```javascript
const API_KEY = Platform.select({
  ios: process.env.GOOGLE_MAPS_IOS_KEY,
  android: process.env.GOOGLE_MAPS_ANDROID_KEY,
  web: process.env.GOOGLE_MAPS_WEB_KEY,
});
```

### 3. Implement Server-Side Proxy

For production, proxy sensitive API calls through your backend:

```javascript
// Instead of direct API call
const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?key=${API_KEY}`);

// Use your backend
const response = await fetch('https://your-api.com/geocode', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

## Troubleshooting

### Common Issues

1. **Blank map on Android**: Ensure API key is correctly set in AndroidManifest.xml
2. **iOS build fails**: Run `cd ios && pod install`
3. **Places autocomplete not working**: Check if Places API is enabled in Google Console
4. **Location permission issues**: Ensure permissions are properly configured in both platforms

### Debug Mode

Enable debug logs:

```javascript
if (__DEV__) {
  console.log('Maps API Key:', GOOGLE_MAPS_API_KEY?.substring(0, 10) + '...');
}
```

## Cost Optimization

1. **Use session tokens** for Places Autocomplete to reduce costs
2. **Implement caching** for frequently accessed locations
3. **Set appropriate bounds** and country restrictions
4. **Monitor usage** in Google Cloud Console

## Testing

### Mock Location for Testing

```javascript
const mockLocation = {
  coords: {
    latitude: 42.6977,
    longitude: 23.3219, // Sofia, Bulgaria
    accuracy: 5,
    altitude: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
};

// Use in development
if (__DEV__) {
  return mockLocation;
}
```

## Production Checklist

- [ ] API keys are restricted properly
- [ ] Different keys for different environments
- [ ] Error handling for API failures
- [ ] Fallback for location permission denial
- [ ] Offline mode handling
- [ ] API usage monitoring setup
- [ ] Budget alerts configured
- [ ] Terms of Service compliance