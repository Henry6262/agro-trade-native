# Privy Bundle ID Configuration Reference

**App:** AgroTrade Native  
**Last Updated:** February 20, 2026

---

## Bundle Identifiers

### iOS
```
com.agrotrade.app
```

### Android
```
com.agrotrade.app
```

### URL Scheme (Deep Linking)
```
agrotrade://
```

---

## Privy Dashboard Credentials

**Privy Dashboard:** https://dashboard.privy.io/

**App ID:**
```
cmieakfr201g9jo0cwewfvsgi
```

**Client ID:**
```
client-WY6TLwqxXyDiAPyNeScsFaAszjDAVQb5SUaExWLvEQv1n
```

---

## Configuration Locations

### App Bundle IDs
- **File:** `front-end/app.json`
- **iOS Path:** `expo.ios.bundleIdentifier`
- **Android Path:** `expo.android.package`
- **Scheme Path:** `expo.scheme`

### Privy Credentials
- **Development:** `front-end/.env`
- **Production:** `front-end/.env.production`
- **Variables:**
  - `EXPO_PUBLIC_PRIVY_APP_ID`
  - `EXPO_PUBLIC_PRIVY_CLIENT_ID`

### Provider Initialization
- **File:** `front-end/App.tsx`
- **Component:** `<PrivyProvider appId={...} clientId={...}>`

---

## Privy Dashboard Setup Checklist

Login to https://dashboard.privy.io/ and verify:

- [ ] App exists with ID `cmieakfr201g9jo0cwewfvsgi`
- [ ] Client exists with ID starting with `client-WY6TLwq...`
- [ ] iOS bundle ID `com.agrotrade.app` is registered
- [ ] Android package `com.agrotrade.app` is registered
- [ ] Redirect URI `agrotrade://` is allowed
- [ ] Google OAuth provider is enabled
- [ ] App is in production mode (not test mode)

---

## Testing Bundle ID Configuration

### On iOS Simulator/Device
```bash
cd front-end
npx expo run:ios
```

Then:
1. Navigate to sign-in screen
2. Click "Continue with Google"
3. Complete OAuth
4. App should redirect back to `agrotrade://` successfully

### On Android Emulator/Device
```bash
cd front-end
npx expo run:android
```

Follow same testing steps as iOS.

---

## Troubleshooting Bundle ID Issues

### Problem: "Invalid redirect URI"
**Cause:** Bundle ID mismatch  
**Fix:** Ensure `app.json` bundle IDs match Privy Dashboard exactly

### Problem: OAuth completes but app doesn't resume
**Cause:** Deep link scheme not registered  
**Fix:** Rebuild app after confirming `scheme: "agrotrade"` in app.json

### Problem: "App ID not found"
**Cause:** Environment variables not loaded  
**Fix:** Check `.env` file exists and restart Metro bundler

---

## Important Notes

1. **Bundle ID = App Identity**
   - Cannot be changed after production release
   - Must match across all configurations
   - Used by iOS/Android for app identification

2. **Case Sensitive**
   - Bundle IDs are case-sensitive
   - Always use lowercase: `com.agrotrade.app`

3. **Deep Linking**
   - Scheme `agrotrade://` must be unique to your app
   - Other apps using same scheme will conflict
   - Register scheme in app stores to prevent conflicts

4. **Production Deployment**
   - Bundle IDs must be registered with Apple/Google before app store submission
   - Privy Dashboard must have production mode enabled
   - Test thoroughly before production deployment

---

## Quick Reference Commands

### View current bundle configuration
```bash
cd front-end
cat app.json | grep -A 3 "bundleIdentifier\|package\|scheme"
```

### View Privy environment config
```bash
cd front-end
cat .env | grep PRIVY
```

### Verify TypeScript compilation
```bash
cd front-end
npx tsc --noEmit --skipLibCheck
```

### Test deep linking (iOS)
```bash
xcrun simctl openurl booted agrotrade://
```

### Test deep linking (Android)
```bash
adb shell am start -a android.intent.action.VIEW -d agrotrade://
```

---

**For support:** https://docs.privy.io/  
**For issues:** Check Privy Dashboard logs and app console output
