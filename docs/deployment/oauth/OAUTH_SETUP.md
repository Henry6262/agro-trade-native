# OAuth Setup for Mobile and Web

## Current Implementation

We've implemented Google OAuth authentication that works differently for web and mobile platforms:

### Web Platform
- Direct redirect to Google OAuth
- Returns to the app via `/auth/callback` route
- Works seamlessly with browser redirects

### Mobile Platform (Android/iOS)
- Opens system browser using `expo-web-browser`
- User authenticates in the browser
- Google redirects back to `localhost:8081/auth/callback`
- Browser remains open showing the callback page

## The Mobile Challenge

The issue you're experiencing is common with OAuth on mobile:
1. OAuth happens in the system browser (required by Google for security)
2. After authentication, the browser doesn't automatically close or return to the app
3. The user sees the successful redirect but remains in the browser

## Solutions

### Option 1: Deep Linking (Recommended for Production)
- Configure deep links with `agrotrade://auth/callback`
- Register this URL scheme in Google Console
- The app will automatically open when OAuth completes

### Option 2: In-App Browser (Current Implementation)
- Uses `expo-web-browser` to open OAuth in an in-app browser
- The browser can be closed programmatically
- Less seamless but works for development

### Option 3: Manual Return (Current Workaround)
- User authenticates in browser
- User manually returns to the app
- App checks authentication status on resume

## Setup Requirements

### For Web
✅ No additional setup needed - works out of the box

### For Mobile Development
✅ Use `adb reverse` to forward localhost ports:
```bash
adb reverse tcp:4000 tcp:4000
adb reverse tcp:8081 tcp:8081
```

### For Mobile Production
1. Configure deep linking in app.json:
```json
{
  "expo": {
    "scheme": "agrotrade"
  }
}
```

2. Add to Google Console authorized redirect URIs:
```
agrotrade://auth/callback
```

3. Update backend to handle deep link redirects

## Current Status

- ✅ Web OAuth works perfectly
- ⚠️ Mobile OAuth authenticates but doesn't auto-return to app
- ⏳ Deep linking setup needed for seamless mobile experience

## Next Steps for Production

1. **Implement Deep Linking**
   - Configure universal links for iOS
   - Configure app links for Android
   - Update Google Console with deep link URLs

2. **Alternative: Use Google Sign-In SDK**
   - `expo-google-sign-in` for native Google Sign-In
   - More seamless but requires native configuration

3. **For Expo Go Development**
   - Continue using browser-based OAuth
   - Accept manual return to app as limitation
   - This is only for development, not production