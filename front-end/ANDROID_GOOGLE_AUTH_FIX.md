# Android Google Authentication Fix

## Current Approach
We now rely **exclusively** on the native `@react-native-google-signin/google-signin` SDK on Android and iOS. To force the account picker every time, we clear any cached session with `GoogleSignin.signOut()` immediately before `GoogleSignin.signIn()`. This keeps the flow inside the app (no browser redirect) while still letting users pick a different Google account on each attempt.

## Implementation Checklist
1. **Environment variables**
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=<OAuth web client id>
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<iOS client id - optional, falls back to web id>
   ```
   These values are read by `src/config/googleSignIn.ts` when we configure the SDK.

2. **Central configuration**
   - `configureGoogleSignIn()` is executed once at app start (`App.tsx`) and safely reused across screens.
   - The helper warns if the client IDs are missing so we can catch misconfigured builds early.

3. **Force account selection**
   - Before calling `GoogleSignin.signIn()` we always attempt `GoogleSignin.signOut()` (errors ignored) to wipe any cached session.
   - Android-specific: we still call `GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })` to ensure Google Play Services are up-to-date.

4. **Backend endpoint**
   - Mobile clients post the returned `idToken` to `/auth/google/native`, along with the selected AgroTrade role. The backend validates the token with Google, creates/updates the user, and returns our JWTs.

## Development & Testing
- **Expo Go will not work.** Gesture Handler, Reanimated, Maps, and the Google SDK all require native modules, so always use the dev client:
  ```bash
  npm run ios     # wraps `npx expo run:ios`
  npm run android # wraps `npx expo run:android`
  ```
- If you prefer EAS builds:
  ```bash
  npm install -g eas-cli
  eas build --profile development --platform android --local
  ```
- When testing, sign in with Account A, log out, and sign in again—you should see the account chooser every time. If not, confirm that `configureGoogleSignIn` ran and that we call `signOut()` before `signIn()`.

## Troubleshooting
- **`PLAY_SERVICES_NOT_AVAILABLE`**: update Google Play Services on the emulator/device.
- **`SIGN_IN_CANCELLED`**: user closed the picker—surface a friendly message and let them retry.
- **Missing account picker**: check that the env vars are set, rebuild the dev client, and confirm the `signOut()` call runs before each `signIn()`.
