# Railway Environment Variables Configuration

## Required Environment Variables for Railway Production

### 🔴 Critical - Must Be Set

#### 1. Application Settings
```bash
NODE_ENV=production
PORT=4000  # Railway auto-sets this, but can be explicit
APP_NAME=agro-trade-backend
APP_URL=https://agro-trade-native-production.up.railway.app
```

#### 2. Database
```bash
# Railway automatically provides DATABASE_URL when you add PostgreSQL
# You should already have this - verify it exists
DATABASE_URL=postgresql://postgres:password@host:port/railway
```

#### 3. JWT Authentication (GENERATE NEW SECRETS!)
```bash
JWT_SECRET=<GENERATE-A-STRONG-SECRET-HERE>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<GENERATE-A-DIFFERENT-STRONG-SECRET-HERE>
JWT_REFRESH_EXPIRES_IN=30d
```

**Generate secrets with:**
```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 4. Google OAuth
```bash
GOOGLE_CLIENT_ID=1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**IMPORTANT**: Add this callback URL to Google Console:
```
https://agro-trade-native-production.up.railway.app/api/auth/google/callback
```

#### 5. Google Maps API
```bash
GOOGLE_MAPS_API_KEY=AIzaSyCyufA02eE2szI8_Q2DSxIa5AabNSik3MA
```

#### 6. CORS Configuration
```bash
# Allow your mobile app and admin dashboard
CORS_ORIGINS=https://agro-trade.vercel.app,exp://localhost:8081
CORS_ALLOW_ALL=true  # Set to true for mobile app development, false for production
```

### 🟡 Optional But Recommended

#### 7. Redis (if using caching/sessions)
```bash
# If you add Redis service in Railway, it will auto-provide these
REDIS_HOST=<auto-provided-by-railway>
REDIS_PORT=<auto-provided-by-railway>
REDIS_PASSWORD=<auto-provided-by-railway>
```

#### 8. Sentry (Backend Error Tracking)
```bash
# Create a new Sentry project for the backend
# Get DSN from: https://sentry.io/organizations/agrotrade/projects/
SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project-id>
SENTRY_ENVIRONMENT=production
```

#### 9. Alpha Vantage (Market Data API)
```bash
ALPHA_VANTAGE_API_KEY=EPEWAZOKKN2837KQ
```

#### 10. Platform Configuration
```bash
COMMISSION_PERCENTAGE=5
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en
```

#### 11. Rate Limiting
```bash
THROTTLE_TTL=60
THROTTLE_LIMIT=100  # Higher for production
```

#### 12. File Upload
```bash
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DESTINATION=/tmp/uploads  # Railway uses ephemeral storage
```

#### 13. Swagger Documentation
```bash
ENABLE_SWAGGER=true  # Set to false to disable in production
```

### 🟢 Optional Services (Add if needed)

#### Stripe (if using payments)
```bash
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Email/SMTP (if sending emails)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@agro-trade.com
```

#### Cloudinary (if using image uploads)
```bash
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## How to Set Variables in Railway

### Method 1: Railway Dashboard (Recommended)

1. Go to: https://railway.app/
2. Select your project: **agro-trade-native**
3. Select service: **backend** (or your backend service)
4. Click on **Variables** tab
5. Click **+ New Variable**
6. Add each variable from the list above
7. Click **Deploy** to apply changes

### Method 2: Railway CLI

```bash
# Link to your service
railway link

# Add variables one by one
railway variables set NODE_ENV=production
railway variables set APP_URL=https://agro-trade-native-production.up.railway.app
railway variables set JWT_SECRET=<your-generated-secret>
# ... etc

# Or add from .env file
railway variables set --env-file .env.production
```

### Method 3: Bulk Import

Create a `.env.railway` file:

```bash
NODE_ENV=production
APP_URL=https://agro-trade-native-production.up.railway.app
JWT_SECRET=<generated-secret>
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=<generated-secret>
JWT_REFRESH_EXPIRES_IN=30d
GOOGLE_CLIENT_ID=1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_MAPS_API_KEY=AIzaSyCyufA02eE2szI8_Q2DSxIa5AabNSik3MA
CORS_ORIGINS=https://agro-trade.vercel.app,exp://localhost:8081
CORS_ALLOW_ALL=true
ALPHA_VANTAGE_API_KEY=EPEWAZOKKN2837KQ
COMMISSION_PERCENTAGE=5
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en
THROTTLE_TTL=60
THROTTLE_LIMIT=100
ENABLE_SWAGGER=false
```

Then import:
```bash
railway variables set --env-file .env.railway
```

## Verification Checklist

After setting variables, verify:

- [ ] `NODE_ENV=production`
- [ ] `APP_URL` points to Railway URL
- [ ] `DATABASE_URL` exists (auto-provided by Railway)
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are set (DIFFERENT values!)
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- [ ] `GOOGLE_MAPS_API_KEY` is set
- [ ] `CORS_ORIGINS` includes your frontend URLs
- [ ] Google OAuth callback is added to Google Console

## Testing Environment Variables

### Check if variables are loaded:

Add this endpoint to test (temporary):

```typescript
// In any controller
@Get('env-check')
getEnvCheck() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasGoogleOAuth: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    hasMapsKey: !!process.env.GOOGLE_MAPS_API_KEY,
    appUrl: process.env.APP_URL,
  };
}
```

Then check: `https://agro-trade-native-production.up.railway.app/api/env-check`

## Common Issues

### 1. CORS Errors
**Problem**: Mobile app can't connect to backend
**Solution**: Add to `CORS_ORIGINS`: `exp://localhost:8081` or set `CORS_ALLOW_ALL=true`

### 2. Google OAuth Not Working
**Problem**: OAuth redirect fails
**Solution**:
- Verify `APP_URL` is correct
- Add callback URL to Google Console: `https://your-railway-url/api/auth/google/callback`

### 3. Database Connection Fails
**Problem**: Can't connect to database
**Solution**: Railway auto-provides `DATABASE_URL` - verify it exists in variables

### 4. JWT Errors
**Problem**: Token validation fails
**Solution**: Ensure `JWT_SECRET` is set and consistent across deployments

## Security Best Practices

1. **Never commit secrets** to Git
2. **Use different secrets** for JWT_SECRET and JWT_REFRESH_SECRET
3. **Generate strong secrets** (at least 64 characters)
4. **Set CORS_ALLOW_ALL=false** in production (only allow specific origins)
5. **Use HTTPS** (Railway provides this automatically)
6. **Rotate secrets** periodically
7. **Set ENABLE_SWAGGER=false** in production if API is private

## Priority Order

If setting variables for the first time, set in this order:

1. **NODE_ENV=production** (most critical)
2. **DATABASE_URL** (should exist - verify)
3. **JWT_SECRET** and **JWT_REFRESH_SECRET** (generate new!)
4. **GOOGLE_CLIENT_ID** and **GOOGLE_CLIENT_SECRET**
5. **GOOGLE_MAPS_API_KEY**
6. **APP_URL**
7. **CORS_ORIGINS** and **CORS_ALLOW_ALL**
8. Everything else is optional

## Need Help?

Check current variables in Railway Dashboard:
https://railway.app/project/<your-project-id>/service/<your-service-id>/variables

Railway Docs: https://docs.railway.app/develop/variables
