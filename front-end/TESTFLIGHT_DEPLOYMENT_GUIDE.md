# TestFlight Deployment Guide for AgroTrade

## Current Status
- ✅ Backend running on http://localhost:4001
- ✅ Frontend Expo server running on http://localhost:8081
- ✅ App configuration updated (app.json, eas.json)
- ✅ Build profile "testflight" configured
- ✅ Build number auto-increment enabled
- ⚠️  Apple credentials need to be set up interactively

## Steps to Deploy to TestFlight

### Step 1: Log in to your Apple Account with EAS
```bash
cd /Users/henry/agro-trade/front-end
npx eas login
```
Use your Expo account: **web3h3nry**

### Step 2: Configure iOS Credentials
```bash
npx eas credentials
```
When prompted:
1. Select platform: **ios**
2. Select bundle identifier: **com.agrotrade.app**
3. Choose: **Log in to your Apple account**
4. Enter your Apple ID email
5. Enter your Apple ID password
6. Complete 2FA if prompted

EAS will automatically:
- Generate Distribution Certificate
- Generate Provisioning Profile
- Register the App ID with Apple
- Store credentials securely on Expo servers

### Step 3: Build for TestFlight
```bash
npx eas build --platform ios --profile testflight
```

This will:
- Upload your project to EAS servers
- Build the iOS app in the cloud
- Take approximately 10-15 minutes
- Provide a build URL to monitor progress

### Step 4: Submit to App Store Connect
After the build completes successfully:

```bash
npx eas submit --platform ios --latest
```

When prompted:
1. Enter your Apple ID email
2. Enter an app-specific password (generate at appleid.apple.com)
3. Confirm submission

### Step 5: Configure TestFlight
1. Go to App Store Connect: https://appstoreconnect.apple.com
2. Navigate to your app "AgroTrade"
3. Go to TestFlight tab
4. Wait for build to process (10-30 minutes)
5. Add internal testers
6. Distribute the build

## Build Configuration

Current settings:
- **App Name**: AgroTrade
- **Bundle ID**: com.agrotrade.app
- **Version**: 1.0.0
- **Current Build Number**: 6 (auto-increments)
- **Distribution**: App Store (for TestFlight)
- **Profile**: testflight

## Troubleshooting

### If credentials fail:
```bash
npx eas credentials --platform ios
# Choose "Remove all credentials" and start fresh
```

### If build fails:
```bash
npx eas build:list
# Check the build logs for specific errors
```

### To check build status:
```bash
npx eas build:list
```

## Next Steps After TestFlight Upload

1. **Add Beta Testers**:
   - Internal testers (up to 100) - no review required
   - External testers (up to 10,000) - requires App Store review

2. **Testing Checklist**:
   - [ ] Login functionality
   - [ ] Product catalog
   - [ ] Trade operations
   - [ ] Notifications
   - [ ] Offline behavior

3. **Gather Feedback**:
   - Use TestFlight's feedback collection
   - Monitor crash reports in App Store Connect
   - Track analytics

## Important Notes

- Each build auto-increments the build number
- TestFlight builds expire after 90 days
- You can have up to 10,000 external testers
- Internal testing doesn't require app review
- External testing requires Beta App Review (1-2 days)

## Commands Reference

```bash
# List all builds
npx eas build:list

# Cancel a running build
npx eas build:cancel

# View build details
npx eas build:view [build-id]

# Check credentials
npx eas credentials

# Update app version
# Edit version in app.json, build number auto-increments

# Submit to TestFlight
npx eas submit -p ios --latest
```

## Resources

- EAS Build Docs: https://docs.expo.dev/build/introduction/
- TestFlight Guide: https://developer.apple.com/testflight/
- App Store Connect: https://appstoreconnect.apple.com
- Expo Dashboard: https://expo.dev/accounts/web3h3nry
