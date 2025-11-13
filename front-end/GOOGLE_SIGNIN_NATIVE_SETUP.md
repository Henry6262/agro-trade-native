# Native Google Sign-In Setup

## Important: Account Selection Implementation

The native Google Sign-In SDK for React Native now forces account selection by:

1. **Calling `GoogleSignin.signOut()` before `signIn()`** - This ensures any cached session is cleared.
2. **Fresh authentication each time** - Users will see the Google account picker.
3. **Central configuration** - `src/config/googleSignIn.ts` runs during app bootstrap so every screen shares the same setup and env-driven client IDs.

## Setup Requirements

### 1. Environment Variables

Add these to your `.env` file (see `.env.example` for reference):

```env
# Google OAuth Web Client ID (from Google Console)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com

# iOS Client ID (optional; falls back to the web client ID if omitted)
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
```

### 2. Android Setup

1. Add your SHA-1 fingerprint to Firebase/Google Console
2. Download `google-services.json` and place in `android/app/`
3. The package is already configured in the build files

### 3. iOS Setup

1. Download `GoogleService-Info.plist` from Firebase/Google Console
2. Add to your iOS project in Xcode
3. Add URL scheme to Info.plist (already handled by Expo)

### 4. Backend Endpoint

The backend needs to handle native Google Sign-In at `/auth/google/native`:

```typescript
// Backend endpoint should:
// 1. Verify the idToken with Google
// 2. Create/update user account
// 3. Return JWT tokens
POST /api/auth/google/native
{
  idToken: string,
  role: string,
  email?: string,
  name?: string,
  googleId?: string,
  photo?: string
}
```

## How It Works

1. User clicks "Sign in with Google"
2. App calls `GoogleSignin.signOut()` to clear any cached session
3. App calls `GoogleSignin.signIn()` which shows account picker
4. User selects account or adds new one
5. App receives ID token
6. App sends token to backend for verification
7. Backend creates/updates user and returns JWT
8. App stores JWT and navigates to dashboard

## Testing

1. For Android/iOS: run a dev client (`npm run android` / `npm run ios`). Expo Go is not sufficient because it lacks the native Google module.
2. Sign in with Account A, log out, then sign in again. The account picker should appear each time.
3. For Web: the OAuth redirect flow (`/auth/google`) is used instead; make sure `prompt=select_account` is appended as documented in the onboarding components.

## Troubleshooting

- **"Sign in was cancelled"**: User closed the account picker
- **"Play Services not available"**: Update Google Play Services on device
- **"Developer error"**: Check SHA-1 fingerprint and package name in Google Console
