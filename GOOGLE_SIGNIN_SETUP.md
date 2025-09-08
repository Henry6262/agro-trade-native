# Google Sign-In Setup for React Native

## ⚠️ ACTION REQUIRED: Fix DEVELOPER_ERROR

The `DEVELOPER_ERROR` (code 10) occurs because Google Sign-In is not properly configured. Follow these steps:

## Step 1: Add SHA-1 to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Find your **OAuth 2.0 Client ID** (Android type)
   - If you don't have an Android OAuth client, create one:
     - Click **+ CREATE CREDENTIALS** → **OAuth client ID**
     - Choose **Android** as application type
     - Name: `AgroTrade Android`

5. Add this SHA-1 certificate fingerprint:
   ```
   5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25
   ```

6. Set Package name:
   ```
   com.agrotrade.app
   ```

7. Click **Save**

## Step 2: Configure Firebase (If using Firebase)

If you're using Firebase:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create one)
3. Click **Add app** → **Android**
4. Register app with:
   - Package name: `com.agrotrade.app`
   - App nickname: `AgroTrade`
   - SHA-1: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
5. Download `google-services.json`
6. Place it in `/Users/henry/agro-trade/front-end/android/app/`

## Step 3: Update Web Client ID

Your current Web Client ID in the code:
```
1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com
```

Make sure this is the **Web** OAuth 2.0 Client ID, not the Android one!

## Step 4: Verify Configuration

After completing the above steps:

1. Clean and rebuild:
   ```bash
   cd android
   ./gradlew clean
   cd ..
   npx expo run:android
   ```

2. Test Google Sign-In

## Common Issues

### Still getting DEVELOPER_ERROR?

1. **Wrong Client ID**: Make sure you're using the **Web** OAuth client ID in your code, not the Android one
2. **SHA-1 Mismatch**: The SHA-1 must match exactly
3. **Package Name Mismatch**: Must be `com.agrotrade.app`
4. **Not Added to Google Console**: Both Web and Android OAuth clients must exist

### For Production

For release builds, you'll need to:
1. Generate a release keystore
2. Get the SHA-1 from the release keystore
3. Add that SHA-1 to Google Console as well

## Current Status

✅ SHA-1 fingerprint obtained: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
✅ Package name confirmed: `com.agrotrade.app`
❌ SHA-1 needs to be added to Google Console
❌ google-services.json needs to be downloaded and added (if using Firebase)