# Deployment Guide - OAuth Redirect Configuration

## Problem Fixed
Previously, the application was hardcoding `localhost:4000` for OAuth redirects, which broke authentication in production. This has been fixed to use dynamic environment-based URLs.

## Backend Configuration (Vercel)

### Environment Variables to Set in Vercel Dashboard:

```env
# Required for OAuth redirects
CLIENT_PRODUCTION_URL=https://your-frontend-domain.vercel.app
API_PRODUCTION_URL=https://your-backend-domain.vercel.app/api

# Database
DATABASE_URL=your-production-database-url

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# JWT Secrets (generate strong, unique values)
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret

# Other APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key
```

### Google OAuth Console Setup:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client ID
4. Add these Authorized redirect URIs:
   - `https://your-backend-domain.vercel.app/api/auth/google/callback` (production)
   - `http://localhost:4000/api/auth/google/callback` (development)

## Frontend Configuration (Vercel)

### Environment Variables to Set in Vercel Dashboard:

```env
# Backend API URL
EXPO_PUBLIC_API_URL=https://your-backend-domain.vercel.app/api

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key

# App Configuration
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_APP_URL=https://your-frontend-domain.vercel.app
```

## How the Fix Works

### Backend (`auth.controller.ts`)
- Determines frontend URL based on environment variables
- In production, uses `CLIENT_PRODUCTION_URL` or `VERCEL_URL`
- Falls back to `localhost:8081` for development

### Frontend (`utils/environment.ts`)
- Dynamically determines API URLs based on current host
- Uses `window.location.origin` for web platform
- Automatically constructs OAuth redirect URLs

### Google Strategy (`google.strategy.ts`)
- Dynamically sets callback URL based on environment
- Uses `VERCEL_URL` if available, otherwise `API_PRODUCTION_URL`

## Testing the Fix

1. **Local Development:**
   - OAuth should redirect to `http://localhost:8081/auth/callback`
   - API calls should go to `http://localhost:4000/api`

2. **Production:**
   - OAuth should redirect to your production frontend URL
   - API calls should go to your production backend URL

## Deployment Steps

1. **Deploy Backend First:**
   ```bash
   cd backend
   vercel --prod
   ```
   Note the production URL (e.g., `agro-trade-api.vercel.app`)

2. **Update Frontend Environment:**
   - Set `EXPO_PUBLIC_API_URL` to your backend URL
   
3. **Deploy Frontend:**
   ```bash
   cd front-end
   vercel --prod
   ```
   Note the production URL (e.g., `agro-trade.vercel.app`)

4. **Update Backend Environment:**
   - Set `CLIENT_PRODUCTION_URL` to your frontend URL
   - Redeploy backend if needed

5. **Verify OAuth Flow:**
   - Test sign-in from role selection screen
   - Test sign-in from onboarding flows
   - Verify redirect goes to correct production URL

## Troubleshooting

### OAuth Redirect Still Goes to Localhost
- Check `CLIENT_PRODUCTION_URL` is set in backend Vercel environment
- Verify backend is using production environment (`NODE_ENV=production`)
- Check browser console for the redirect URL being used

### API Calls Failing
- Verify `EXPO_PUBLIC_API_URL` is set in frontend Vercel environment
- Check CORS settings in backend (`CORS_ORIGINS` should include frontend URL)
- Ensure backend is accessible at the configured URL

### Google OAuth Error
- Verify redirect URI is added in Google Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Ensure callback URL matches exactly (including `/api` prefix)