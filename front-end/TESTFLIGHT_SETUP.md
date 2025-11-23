# TestFlight Distribution Guide

## Overview

TestFlight allows you to distribute your iOS app to testers before releasing it to the App Store. You can invite up to 10,000 external testers.

## Prerequisites

Before you can use TestFlight, you need:

1. ✅ **Apple Developer Account** ($99/year)
   - Sign up at: https://developer.apple.com/programs/

2. ✅ **EAS Account** (Expo Application Services)
   - Free tier available
   - Sign up at: https://expo.dev/

3. ✅ **App Store Connect Access**
   - Access at: https://appstoreconnect.apple.com/

## Step 1: Configure EAS Build

### Install EAS CLI (if not already installed):
```bash
npm install -g eas-cli
```

### Login to EAS:
```bash
eas login
```

### Initialize EAS in your project:
```bash
cd /Users/henry/agro-trade/front-end
eas build:configure
```

This will create an `eas.json` file if it doesn't exist.

## Step 2: Configure Build Profiles

Create or update `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "EXPO_PUBLIC_API_URL": "https://agro-trade-native-production.up.railway.app/api",
        "EXPO_PUBLIC_ENVIRONMENT": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-id",
        "appleTeamId": "your-team-id"
      }
    }
  }
}
```

## Step 3: Build for TestFlight

### Build the iOS app:
```bash
eas build --platform ios --profile production
```

This will:
1. Build your app in the cloud
2. Sign it with your Apple certificates
3. Generate an IPA file
4. Take 15-30 minutes

### Monitor the build:
You can watch the build progress at: https://expo.dev/accounts/[your-account]/projects/agro-trade/builds

## Step 4: Submit to TestFlight

### Automatic submission (recommended):
```bash
eas submit --platform ios --profile production
```

This will automatically upload your build to App Store Connect and TestFlight.

### Manual submission:
If automatic submission fails, download the IPA from the EAS dashboard and upload it manually using Transporter app.

## Step 5: Set Up TestFlight

### 1. Go to App Store Connect:
https://appstoreconnect.apple.com/

### 2. Navigate to your app:
- Click "My Apps"
- Select "AgroTrade" (or create it if it doesn't exist)

### 3. Go to TestFlight tab:
- Click on "TestFlight" in the top navigation

### 4. Wait for processing:
- After upload, Apple processes the build (5-30 minutes)
- You'll receive an email when it's ready

## Step 6: Add Testers

### Internal Testers (up to 100):
These are members of your Apple Developer team.

1. Go to **TestFlight** → **Internal Testing**
2. Click the **+** button
3. Create a group (e.g., "Core Team")
4. Add the build
5. Add testers by email
6. They'll receive an invite immediately

### External Testers (up to 10,000):
Anyone can be an external tester.

1. Go to **TestFlight** → **External Testing**
2. Click the **+** button
3. Create a group (e.g., "Beta Testers")
4. Add the build
5. **IMPORTANT**: You need to fill out beta app information:
   - Test information
   - What to test
   - Feedback email
6. Submit for beta app review (takes 24-48 hours)
7. After approval, add testers by email

## Step 7: Invite Testers

### Send invites:
1. In App Store Connect → TestFlight
2. Select your tester group
3. Click **Add Testers**
4. Enter email addresses (one per line or comma-separated)
5. Click **Add**

### Testers will receive:
- Email invitation with a link
- Instructions to download TestFlight app
- Public link to join (if you enable it)

## Step 8: Install TestFlight on Tester's Device

### Testers need to:
1. **Download TestFlight** from App Store: https://apps.apple.com/app/testflight/id899247664
2. **Open the invite email** on their iPhone/iPad
3. **Tap "View in TestFlight"** button
4. **Accept the invite** in TestFlight app
5. **Install AgroTrade** from TestFlight

## Alternative: Public Link

### Enable public link (easier for many testers):
1. Go to **TestFlight** → **External Testing**
2. Select your group
3. Enable **Public Link**
4. Copy the link (looks like: https://testflight.apple.com/join/XXXXXXXX)
5. Share this link with anyone

Anyone with the link can install the app (up to 10,000 testers).

## Quick Commands

### Build for TestFlight:
```bash
cd /Users/henry/agro-trade/front-end
eas build --platform ios --profile production
```

### Submit to TestFlight:
```bash
eas submit --platform ios --profile production
```

### Build + Submit in one command:
```bash
eas build --platform ios --profile production --auto-submit
```

## Managing Builds

### Upload a new version:
1. Increment version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1"
     }
   }
   ```

2. Build and submit:
   ```bash
   eas build --platform ios --profile production --auto-submit
   ```

3. Testers will be notified of the update automatically

## Troubleshooting

### Build fails:
- Check EAS build logs
- Verify Apple Developer credentials
- Ensure app.json configuration is correct

### Can't add testers:
- Verify email addresses
- Check if beta app review is approved (for external testers)
- Ensure you haven't exceeded tester limits

### Testers can't install:
- Verify they downloaded TestFlight app
- Check if their email matches the invite
- Ensure build is in "Ready to Test" status

## TestFlight Features

### Automatic updates:
- When you upload a new build, testers get notified
- They can auto-update in TestFlight

### Feedback:
- Testers can send feedback via TestFlight
- Includes screenshots and crash reports
- Received in App Store Connect

### Crash reports:
- Automatic crash reporting
- Combined with Sentry for comprehensive monitoring

## Android (Google Play Beta)

For Android testers, use Google Play Console:

### Build for Android:
```bash
eas build --platform android --profile production
```

### Submit to Google Play:
```bash
eas submit --platform android --profile production
```

### Add testers:
1. Go to Google Play Console
2. Navigate to Testing → Internal testing or Closed testing
3. Create a test group
4. Add testers by email or create a shareable link

## Summary

To invite a tester:

1. **Build**: `eas build --platform ios --profile production`
2. **Submit**: `eas submit --platform ios --profile production`
3. **Wait for processing** (5-30 min)
4. **Add tester email** in App Store Connect → TestFlight
5. **Tester installs** TestFlight app and accepts invite

**Quick invite**: Use public link for easier distribution to many testers.

## Links

- **EAS Dashboard**: https://expo.dev/accounts/henry6262/projects/agro-trade
- **App Store Connect**: https://appstoreconnect.apple.com/
- **TestFlight on App Store**: https://apps.apple.com/app/testflight/id899247664
- **Google Play Console**: https://play.google.com/console

## Need Help?

- EAS Build docs: https://docs.expo.dev/build/introduction/
- TestFlight docs: https://developer.apple.com/testflight/
- Submit to stores: https://docs.expo.dev/submit/introduction/
