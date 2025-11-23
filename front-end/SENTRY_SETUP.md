# Sentry Error Tracking Setup Guide

This guide explains how to complete the Sentry setup for the AgroTrade mobile app.

## Overview

Sentry has been integrated into the React Native app to capture errors, crashes, and performance issues. This is especially useful for tracking issues like Google Sign-in crashes that occur in production.

## What's Already Configured

The following has been set up automatically:

- ✅ Sentry SDK installed (`@sentry/react-native@6.14.0`)
- ✅ Sentry initialization in `App.tsx`
- ✅ React Navigation instrumentation for screen tracking
- ✅ Error boundary wrapping
- ✅ Performance monitoring enabled
- ✅ Native crash reporting enabled
- ✅ Expo plugin configuration in `app.json`

## Next Steps - Get Your Sentry DSN

To start receiving error reports, you need to get your DSN (Data Source Name) from Sentry:

### 1. Log in to Sentry

Go to: https://sentry.io/organizations/agrotrade/projects/react-native/

### 2. Get Your DSN

- Navigate to **Settings** → **Projects** → **react-native**
- Click on **Client Keys (DSN)**
- Copy your DSN - it looks like:
  ```
  https://abc123def456@o123456.ingest.sentry.io/7890123
  ```

### 3. Add DSN to Environment Variables

#### For Production (Railway/EAS builds):
1. Open `.env.production`
2. Replace the empty `EXPO_PUBLIC_SENTRY_DSN=` line with:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://your-actual-dsn-here
   ```

#### For Development (optional):
1. Open `.env`
2. Replace the empty `EXPO_PUBLIC_SENTRY_DSN=` line with your DSN
3. Note: Leave it empty if you don't want Sentry in development

### 4. Rebuild Your App

After adding the DSN:

```bash
# For development
npm run start

# For production builds
eas build --platform ios
eas build --platform android
```

## Testing Sentry Integration

### Quick Test (Recommended)

1. Import the test button component in any screen:
   ```typescript
   import { SentryTestButton } from '@/components/SentryTestButton';
   ```

2. Add it to your JSX (it will appear as a floating button):
   ```tsx
   <SentryTestButton />
   ```

3. In the app, tap the "🧪 Test Sentry" button
4. Go to https://sentry.io/organizations/agrotrade/issues/ to see the captured error
5. **Remove the button after testing**

### Manual Test

To manually test, add this to any component:

```typescript
import * as Sentry from '@sentry/react-native';

// Trigger a test error
Sentry.captureException(new Error('Test error from AgroTrade'));
```

## What Gets Tracked

With this setup, Sentry will automatically capture:

- **JavaScript Errors**: Uncaught exceptions and promise rejections
- **React Errors**: Component errors caught by error boundaries
- **Native Crashes**: iOS and Android native crashes
- **Navigation**: Screen transitions and routing (via React Navigation integration)
- **Performance**: App start time, screen load times, API response times
- **User Context**: Automatically tracks user sessions

## Viewing Errors in Sentry

1. Go to https://sentry.io/organizations/agrotrade/issues/
2. Filter by project: `react-native`
3. You'll see all captured errors with:
   - Stack traces
   - Breadcrumbs (user actions leading to error)
   - Device information
   - App version
   - Environment (dev/staging/production)

## Source Maps

Source maps are automatically uploaded during builds via the Expo plugin. This allows you to see readable stack traces instead of minified code.

## Configuration Options

The Sentry configuration is in `App.tsx`. You can adjust:

- `tracesSampleRate`: Percentage of transactions to track (1.0 = 100%)
- `sampleRate`: Percentage of errors to capture (1.0 = 100%)
- `enabled`: Manually enable/disable Sentry
- `environment`: Set custom environment names

## Troubleshooting

### DSN Not Working
- Verify the DSN format is correct
- Check that you've rebuilt the app after adding the DSN
- Ensure `EXPO_PUBLIC_SENTRY_DSN` is exported by Expo (starts with `EXPO_PUBLIC_`)

### Not Seeing Errors in Sentry
- Check that the DSN is set correctly
- Verify your app is connected to the internet
- Look at the Sentry logs in your app console for any initialization errors

### Source Maps Not Working
- Ensure the Sentry CLI is authenticated
- Check that the organization and project names match in `app.json`

## Support

For more information, see:
- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry with Expo](https://docs.expo.dev/guides/using-sentry/)
