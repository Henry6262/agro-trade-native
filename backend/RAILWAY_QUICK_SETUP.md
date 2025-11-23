# ⚡ Railway Environment Variables - Quick Setup

## 🔴 MUST ADD (Minimum Required)

Copy these to Railway Dashboard → Variables:

```bash
# 1. Application
NODE_ENV=production
APP_URL=https://agro-trade-native-production.up.railway.app

# 2. JWT Secrets (GENERATE NEW ONES!)
JWT_SECRET=<PASTE_GENERATED_SECRET_HERE>
JWT_REFRESH_SECRET=<PASTE_DIFFERENT_SECRET_HERE>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# 3. Google OAuth
GOOGLE_CLIENT_ID=1008767127587-47m9aht5dh71pe8kre41hhmlogmgp9in.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# 4. Google Maps
GOOGLE_MAPS_API_KEY=AIzaSyCyufA02eE2szI8_Q2DSxIa5AabNSik3MA

# 5. CORS (Allow mobile app)
CORS_ALLOW_ALL=true
```

## 🔑 Generate JWT Secrets

Run these commands locally:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET (different!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the outputs and paste them into Railway.

## 📋 Step-by-Step

1. **Go to Railway Dashboard**
   - URL: https://railway.app/
   - Select project: **agro-trade-native**
   - Select service: **backend**
   - Click **Variables** tab

2. **Generate Secrets**
   ```bash
   # Run these locally
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **Add Each Variable**
   - Click **+ New Variable**
   - Name: `NODE_ENV`
   - Value: `production`
   - Repeat for all variables above

4. **Deploy**
   - After adding all variables, Railway will auto-redeploy
   - Or click **Deploy** button

## ✅ Verify

After deployment, check:
```
https://agro-trade-native-production.up.railway.app/api
```

Should see your API documentation (Swagger).

## 🚨 What About DATABASE_URL?

Railway automatically provides `DATABASE_URL` when you add a PostgreSQL database. You should already have this - just verify it exists in the Variables tab.

## 📝 Optional But Recommended

Add these for better functionality:

```bash
# Market data
ALPHA_VANTAGE_API_KEY=EPEWAZOKKN2837KQ

# Platform config
COMMISSION_PERCENTAGE=5
DEFAULT_CURRENCY=USD
DEFAULT_LANGUAGE=en

# Rate limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Swagger (set to false in production)
ENABLE_SWAGGER=false
```

## 🔗 Links

- **Railway Dashboard**: https://railway.app/
- **Backend URL**: https://agro-trade-native-production.up.railway.app
- **Full Guide**: See `RAILWAY_ENV_VARS.md`
