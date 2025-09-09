# Android Google Authentication Fix

## The Problem
The native Google Sign-In SDK on Android doesn't properly support forcing account selection. Even when calling `GoogleSignin.signOut()` before `signIn()`, Android will often auto-select the last used account.

## The Solution
Use the web OAuth flow for ALL mobile platforms (Android and iOS) to ensure consistent behavior.

## Implementation

### Frontend Changes
1. **Removed native SDK usage** for authentication
2. **Use web OAuth flow** with these parameters:
   - `prompt=select_account` - Forces Google to show account chooser
   - `access_type=online` - Don't request refresh token for every sign-in
   - `approval_prompt=force` - Forces re-consent (optional but ensures fresh session)

3. **Open in system browser** using `Linking.openURL()`
   - This ensures the user sees Google's actual account selector
   - Works consistently across Android and iOS

### Backend Requirements
Your backend OAuth endpoint needs to pass these parameters to Google:

```javascript
// In your backend Google OAuth strategy
const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
googleAuthUrl.searchParams.append('prompt', 'select_account');
googleAuthUrl.searchParams.append('access_type', 'online');
googleAuthUrl.searchParams.append('approval_prompt', 'force');
```

### User Flow
1. User taps "Sign in with Google"
2. App shows alert explaining browser redirect
3. User taps "Continue"
4. System browser opens with Google sign-in
5. **User sees account chooser (can select different account or add new)**
6. User completes authentication
7. Browser redirects back to app
8. App handles the OAuth callback

## Why This Works
- Browser-based OAuth respects the `prompt=select_account` parameter
- Each sign-in is treated as a fresh session
- No cached credentials from the native SDK
- Consistent behavior across all platforms

## Testing
1. Sign in with Account A
2. Complete onboarding
3. Log out
4. Try to sign in again
5. ✅ You should see the account chooser
6. ✅ You can select Account B or add a new account

## Alternative (Not Recommended)
If you absolutely must use the native SDK, you would need to:
1. Call `GoogleSignin.revokeAccess()` instead of just `signOut()`
2. This removes the app's access completely
3. But this is poor UX as it requires re-granting permissions every time