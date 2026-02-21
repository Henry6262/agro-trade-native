# AgroTrade Security & Runtime Fixes — 2026-02-20

## Overview

Critical P0 security fixes and P1 runtime crash fixes applied to the AgroTrade Native application.
No commits or pushes were made.

---

## P0 — Security Fixes

### P0-1: Re-enabled JwtAuthGuard on trade operations ✅

**File:** `backend/src/trade-operations/controllers/trade-operation.controller.ts`

- Added `@UseGuards(JwtAuthGuard)` at the controller class level (was commented out as "temporarily disabled for testing").
- Uncommented `@Roles(UserRole.ADMIN)` on all endpoints that had it commented out:
  - `POST /trade-operations`
  - `GET /trade-operations`
  - `GET /trade-operations/:id/profit`
  - `PATCH /trade-operations/:id/phase`
  - `POST /trade-operations/:id/sellers`
  - `GET /trade-operations/:id/matching-sellers`
  - `POST /trade-operations/:id/request-inspections`
  - `POST /trade-operations/calculate-transport`
- Added `UseGuards` to the import list.

### P0-2: Fixed Google OAuth token verification ✅

**File:** `backend/src/auth/auth.controller.ts`

- `POST /auth/google/mobile`: Was returning a fake hardcoded user (`mobile.user@example.com`) without verifying the token. Now calls `https://oauth2.googleapis.com/tokeninfo?id_token=<token>` and uses the verified payload to build the Google profile.
- `POST /auth/google/native`: Was trusting the `userInfo` body parameter directly without any verification ("WARNING: In production, ALWAYS verify the ID token!"). Now verifies the `idToken` field with Google's tokeninfo endpoint and ignores any client-supplied userInfo fields for identity data.

### P0-3: Removed hardcoded admin ID fallback ✅

**File:** `backend/src/trade-operations/controllers/trade-operation.controller.ts`

- Removed the hardcoded fallback `"cmhhfgc1u0000g1rqjcd4y1lx"` in `adminId` resolution.
- Now throws a `BadRequestException` if no `adminId` is available from the DTO or the authenticated user.

**File:** `backend/src/trade-operations/dto/create-trade-operation.dto.ts`

- The example value `"cmhhfgc1u0000g1rqjcd4y1lx"` in the Swagger `@ApiProperty` `example` field was left as-is (it's only documentation, not live code).

### P0-4: Removed dashboard role-switcher from production ✅

**File:** `front-end/src/features/dashboard/screens/DashboardMainScreen.tsx`

- Wrapped the "Switch Dashboard" button in `{__DEV__ && ...}`.
- Wrapped the Dashboard Switcher Dropdown in `{__DEV__ && showDashboardSwitcher && ...}`.
- The role-switcher is now invisible in production builds and only shown in development mode.

---

## P1 — Runtime Crash Fixes

### P1-1: Added @contexts alias to babel.config.js ✅

**File:** `front-end/babel.config.js`

- `babel-plugin-module-resolver` was confirmed installed.
- Added `'@contexts': './src/contexts'` to the `alias` map in the `module-resolver` plugin.
- This resolves the Metro bundler crash for any screen importing `UserDataContext` via `@contexts`.

### P1-2: Fixed operator precedence bug in seller matching ✅

**File:** `backend/src/trade-operations/services/trade-operation.service.ts` (line ~294)

- **Before:** `listing.askingPrice?.toNumber() || 0 / matchParams.maxPricePerUnit`
  - Due to JS operator precedence, this evaluated as `listing.askingPrice?.toNumber() || (0 / maxPrice)`, meaning the division only applied when `askingPrice` was falsy, completely breaking the price ratio calculation.
- **After:** `(listing.askingPrice?.toNumber() || 0) / matchParams.maxPricePerUnit`

### P1-3: Fixed notification storage/retrieval mismatch ✅

**File:** `backend/src/notifications/notification.service.ts`

- Notifications were stored with `[HIGH]`, `[URGENT]`, `[MEDIUM]`, or `[LOW]` prefixes in the content field.
- `getNotifications()` was querying for `content: { contains: "[notification]" }` which never matched anything.
- Fixed the query to use `OR` matching on all four priority prefixes used by `storeNotification()`.
- Also removed the `authorId: "system"` filter from the read query (see P1-4 below for why).

### P1-4: Fixed authorId: "system" FK violations ✅

**File:** `backend/src/notifications/notification.service.ts`

- `storeNotification()` was writing `authorId: "system"` to `TradeNote`, but `TradeNote.authorId` is a required foreign key referencing `User.id`. The literal string `"system"` is not a valid user ID, causing FK constraint violations.
- **Fix:** Added `getSystemUserId()` method that looks up the first `ADMIN` user from the database and caches the result. Uses that real user ID as the `authorId`.
- If no ADMIN user exists, logs a warning and skips persistence (graceful degradation).

**File:** `backend/prisma/seed.ts`

- Added a system admin user upsert to ensure there is always a valid `ADMIN` user with a stable email (`system@agrotrade.internal`) for use as the system-generated note author.
- Added `UserRole` and `bcrypt` imports to the seed file.

---

## TypeScript Check

```
cd backend && npx tsc --noEmit 2>/dev/null | head -20
```

Result: **No errors** (empty output).

---

## Files Modified

### Backend
- `backend/src/trade-operations/controllers/trade-operation.controller.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/notifications/notification.service.ts`
- `backend/src/trade-operations/services/trade-operation.service.ts`
- `backend/prisma/seed.ts`

### Frontend (React Native)
- `front-end/src/features/dashboard/screens/DashboardMainScreen.tsx`
- `front-end/babel.config.js`
