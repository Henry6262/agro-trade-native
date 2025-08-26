# Agro-Trade Deployment Guide

This guide covers deploying both the backend and frontend to Vercel with Prisma Postgres.

## Prerequisites

1. Vercel account
2. Prisma Postgres integration installed in Vercel
3. Vercel CLI installed (`npm i -g vercel`)

## Backend Deployment

### 1. Initial Setup

```bash
cd backend
vercel link
```

### 2. Environment Variables

Add these environment variables in Vercel Dashboard for your backend project:

```env
# Database (from Prisma Postgres integration)
DATABASE_URL="postgres://[connection-string-from-vercel]"
POSTGRES_URL="postgres://[connection-string-from-vercel]"
PRISMA_DATABASE_URL="prisma+postgres://[accelerate-url-from-vercel]"

# JWT Secrets (generate secure random strings)
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="your-secure-refresh-secret-min-32-chars"

# Application
NODE_ENV="production"
PORT="3000"
APP_URL="https://your-backend.vercel.app"

# Optional: Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="https://your-backend.vercel.app/auth/google/callback"

# Frontend URL (for CORS)
CLIENT_URL="https://your-frontend.vercel.app"
```

### 3. Database Migration

First deployment with fresh database:

```bash
# Pull environment variables
vercel env pull .env.production.local

# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# Optional: Seed the database
npx prisma db seed
```

For subsequent deployments, migrations will run automatically via `vercel-build` script.

### 4. Deploy Backend

```bash
vercel deploy --prod
```

Note the deployment URL (e.g., `https://agro-trade-backend.vercel.app`)

## Frontend Deployment

### 1. Initial Setup

```bash
cd front-end
vercel link
```

### 2. Environment Variables

Add these in Vercel Dashboard for your frontend project:

```env
# Backend API
EXPO_PUBLIC_API_URL="https://your-backend.vercel.app/api"

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Environment
EXPO_PUBLIC_ENVIRONMENT="production"
EXPO_PUBLIC_APP_NAME="AgroTrade"
```

### 3. Vercel Settings

In the Vercel Dashboard, configure:

- **Root Directory**: `front-end`
- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `dist`
- **Node.js Version**: 22.x

### 4. Deploy Frontend

```bash
vercel deploy --prod
```

## Post-Deployment Checklist

### Backend Verification

1. Check API health: `https://your-backend.vercel.app/health`
2. Test authentication endpoints
3. Verify database connection in logs
4. Check CORS settings for frontend URL

### Frontend Verification

1. Check if the app loads correctly
2. Test authentication flow
3. Verify API calls to backend
4. Test Google Maps functionality

## Troubleshooting

### Database Connection Issues

If you see database connection errors:

1. Verify DATABASE_URL is correctly set in Vercel
2. Check if migrations have run: `npx prisma migrate status`
3. Ensure Prisma Client is generated: `npx prisma generate`

### CORS Issues

If frontend can't connect to backend:

1. Verify CLIENT_URL is set in backend environment variables
2. Check backend CORS configuration allows frontend domain
3. Ensure API_URL in frontend points to correct backend URL

### Build Failures

1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json` (not devDependencies)
3. Verify Node.js version compatibility

## Updating the Application

### Backend Updates

```bash
cd backend
# Make your changes
git add .
git commit -m "Your update message"
git push
# Vercel will auto-deploy if connected to GitHub
# Or manually: vercel deploy --prod
```

### Frontend Updates

```bash
cd front-end
# Make your changes
git add .
git commit -m "Your update message"
git push
# Vercel will auto-deploy if connected to GitHub
# Or manually: vercel deploy --prod
```

### Database Schema Updates

When updating the database schema:

```bash
cd backend
# Update schema.prisma
npx prisma migrate dev --name describe_your_change
# Commit migration files
git add .
git commit -m "Add migration: describe_your_change"
git push
# Deploy will automatically run migrations
```

## Monitoring

1. Use Vercel Dashboard for deployment logs
2. Monitor function invocations and errors
3. Set up alerts for failures
4. Check Prisma Postgres dashboard for database metrics

## Security Notes

1. Never commit `.env` files
2. Rotate JWT secrets regularly
3. Use strong, unique passwords
4. Enable 2FA on Vercel account
5. Review and limit API permissions
6. Monitor for unusual activity

## Support

- Vercel Documentation: https://vercel.com/docs
- Prisma Documentation: https://www.prisma.io/docs
- NestJS Documentation: https://docs.nestjs.com
- Expo Documentation: https://docs.expo.dev