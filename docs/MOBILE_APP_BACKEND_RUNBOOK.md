# Mobile ↔ Backend Integration Runbook

Comprehensive checklist for standing up the NestJS backend together with the Expo/React Native app so every onboarding → marketplace → transport flow can be exercised end-to-end.

---

## 1. Stack at a Glance

- **Backend**: NestJS monolith with Prisma/PostgreSQL + Redis, CORS-enabled API served on port 4000 with global `api` prefix (`backend/src/main.ts:6-63`). Core domains include auth/onboarding, products/listings, trade-operations, inspections, negotiations, and transport bidding (`backend/src/app.module.ts:6-37`).
- **Mobile**: Expo 53 app using React Native 0.79, Zustand stores, React Query, NativeWind, and native Google Sign-In. Feature-first tree anchored under `front-end/src/features/*` with dedicated stacks for onboarding, dashboard, orders, etc. (`front-end/README.md:17-88`).
- **Shared contract**: REST over HTTPS with Bearer auth. Mobile `apiClient` injects JWTs and retries on 401 by hitting `/auth/refresh` (`front-end/src/services/api.ts:1-64`), so backend refresh endpoints must remain online.

---

## 2. Backend: Setup, Contracts, Gaps

### 2.1 Bootstrapping
- Copy `.env.example` → `.env` and populate Postgres/Redis/Google/Stripe credentials (`backend/.env.example:1-54`). Defaults assume Postgres 14 + PostGIS on `localhost:5432` and a passwordless Redis.
- Use `docker-compose` to spin up Postgres + Redis + dev API. This also ships init scripts and Prisma Studio for inspection (`backend/docker-compose.yml:1-109`).
- Server listens on `0.0.0.0:${PORT}` (default 4000) with `api` prefix and permissive CORS during development (`backend/src/main.ts:6-63`). Mobile emulators reference the host via `http://10.0.2.2:4000/api`.

### 2.2 Modules & Endpoints Mobile Depends On
- **Auth**: `/auth/google`, `/auth/google/callback`, `/auth/google/native`, `/auth/login`, `/auth/refresh`. Google OAuth callback redirects to whichever frontend URL matches the request host (handles emulator IPs) (`backend/src/auth/auth.controller.ts:26-115`). Native endpoint currently trusts `userInfo` payloads and **does not verify** `idToken`—must be tightened before production (`backend/src/auth/auth.controller.ts:116-196`).
- **Onboarding**: `/onboarding/{seller|buyer|transporter}` and `/onboarding/status` require JWTs and call Prisma helpers that validate role-specific completion (`backend/src/onboarding/onboarding.controller.ts:1-93`, `backend/src/onboarding/onboarding.service.ts:1-150`). There is **no** `/onboarding/submit` or `/onboarding/draft`; mobile must call the role-specific routes and poll `/status`.
- **Products & Metadata**: Public endpoints for categories, regions, specs, etc. under `/products/*` to power the onboarding/product pickers (`backend/src/products/products.controller.ts:1-58`).
- **Trade Operations**: `/trade-operations` controller covers creation, seller assignment, profit calculations, analytics, etc. Role enforcement is currently commented out for testing (`backend/src/trade-operations/controllers/trade-operation.controller.ts:1-140`). Mobile dashboards that surface negotiations/offers must align with these routes.
- **Transport Bidding**: `/transport/requests|bids|jobs` plus action routes for starting pickup/delivery and updating status (`backend/src/transport/controllers/transport-bidding.controller.ts:1-170`). Admin-only restrictions are relaxed at the moment; restore guards before public release.
- **Inspections & Negotiations**: Dedicated modules exist (`backend/src/inspections`, `backend/src/negotiations`), and the latest endpoint contracts are summarized in `front-end/MOBILE_API_SYNC_COMPLETE.md`.

### 2.3 Test & Quality Gates
- Unit + e2e suites via Jest. Integration coverage centers on the “happy path trade operation” flow (`backend/TESTING_GUIDE.md:1-120`). Additional suites (expiry handling, cascading verification) are marked TODO.
- API contract testing via Dredd (`npm run contract:test`) is wired up but depends on `openapi/agro-trade.yaml`.

### 2.4 Backend Risks / TODOs
- Global `JwtAuthGuard` is commented out in `AppModule`, leaving most endpoints unauthenticated (`backend/src/app.module.ts:24-37`). Reinstate before exposing publicly.
- `auth.controller.ts`’s mobile/native endpoints fabricate profiles rather than verifying ID tokens; the mobile app now sends real tokens, so backend must call Google’s tokeninfo endpoint.
- Onboarding service only marks a user complete if the required Prisma relations exist. Ensure mobile sends addresses/company/truck records via the proper endpoints before calling `completeOnboarding`.
- Several controller methods still trust `req.user` even though guards are disabled. Re-enable guards to ensure permissions logic (`RolesGuard`, `PermissionsService`) actually runs.

---

## 3. Mobile App: Setup, Stores, API Usage

### 3.1 Environment & Bootstrapping
- Copy `front-end/.env.example` → `.env` and set `EXPO_PUBLIC_API_URL` (use `http://localhost:4000/api`), Google Maps key, and the OAuth client IDs that match the backend credentials (`front-end/.env.example:1-23`).
- Install deps and build a dev client; Expo Go cannot load native modules like Reanimated, Maps, or Google Sign-In (`front-end/README.md:45-88`).
- `App.tsx` initializes Google Sign-In once and hydrates the auth store from AsyncStorage (`front-end/App.tsx:1-60`). No more dev-only JWT injection.

### 3.2 Networking & Auth
- `src/config/googleSignIn.ts` reads client IDs from env vars, skips configuration on web, and warns if IDs are missing (`front-end/src/config/googleSignIn.ts:1-48`).
- `RoleSelectionScreen` and the shared onboarding components call `GoogleSignin.signOut()` → `signIn()` to force account selection, then hit `/auth/google/native` with the returned ID token (`front-end/src/features/onboarding/screens/RoleSelectionScreen.tsx:1-182`, `front-end/src/features/onboarding/components/shared/GoogleAuthNative.tsx:1-140`, `front-end/src/features/onboarding/components/shared/NativeGoogleAuth.tsx:1-86`).
- `apiClient` centralizes Axios config, injects Bearer tokens, and retries once after calling `useAuthStore.refreshTokens()` on 401s (`front-end/src/services/api.ts:1-78`).
- `src/shared/utils/environment.ts` automatically swaps API hosts for Android emulators (`front-end/src/shared/utils/environment.ts:9-64`).

### 3.3 Feature Stores & Outstanding Gaps
- **Onboarding**: `useOnboardingStore` orchestrates the multi-role wizard and calls `onboardingService` APIs for drafts/submission (`front-end/src/stores/onboarding.store.ts:1-120`). However, the service still points at non-existent `/onboarding/submit|draft|progress` endpoints (`front-end/src/services/onboardingService.ts:43-150`). Update it to call `/onboarding/{role}` and `/onboarding/status`, mirroring the backend contracts above.
- **User Data Provider**: Dashboard widgets fetch `/seller/products`, `/seller/offers`, `/seller/trades`, etc. (`front-end/src/contexts/UserDataContext.tsx:1-140`). Backend currently lacks `/seller/offers` (documented fallback in `front-end/MOBILE_API_SYNC_COMPLETE.md`), so expect empty states until the endpoint ships.
- **Types vs Reality**: Shared types still model a traditional marketplace order flow (`front-end/src/shared/types/index.ts:1-120`) which diverges from the trade-operation domain (trade sellers, negotiations, inspections). Map/alias backend DTOs when wiring new screens.
- **Testing tooling**: `npm run lint` fails because ESLint 9 requires a flat config; add `eslint.config.js` or pin ESLint to v8 before re-running. (See failed command output during this session.)
- **Scroll/Web hacks**: `ScrollFix` manipulates DOM nodes directly to patch web scrolling; ensure native-only screens don’t import it unnecessarily.

---

## 4. End-to-End Flow Checklist

1. **Auth & Bootstrap**
   - Configure backend `.env` and start Postgres/Redis/API (`backend/docker-compose.yml:1-109`).
   - Provide matching Google OAuth client IDs to both backend and mobile (`backend/.env.example:31-38`, `front-end/.env.example:9-12`).
   - Build & launch the Expo dev client (`npm run ios`/`npm run android`) with `EXPO_PUBLIC_API_URL` pointing to the backend’s `/api` base.

2. **Google Sign-In**
   - User taps “Sign In” on `RoleSelectionScreen`. Native SDK requests an ID token (`front-end/src/features/onboarding/screens/RoleSelectionScreen.tsx:94-154`).
   - Mobile POSTs the token + role to `/auth/google/native`; backend verifies user, issues JWT + refresh token (`backend/src/auth/auth.controller.ts:116-196`, `backend/src/auth/auth.service.ts:1-90`).
   - `useAuthStore` persists both tokens via Zustand/AsyncStorage (`front-end/src/stores/auth.store.ts:1-120`).

3. **Onboarding**
   - Mobile collects role-specific data via the feature components.
   - When ready, call backend role endpoints:
     - Seller → `POST /onboarding/seller`
     - Buyer → `POST /onboarding/buyer`
     - Transporter → `POST /onboarding/transporter`
   - Poll `/onboarding/status` to confirm `onboardingCompleted=true` before routing to dashboard (`backend/src/onboarding/onboarding.controller.ts:1-93`).
   - Update `onboardingService` and `AuthModal` to use those endpoints; remove `/onboarding/submit|draft` references.

4. **Marketplace / Operations**
   - Fetch product metadata/categories via `/products/*` to populate pickers (`backend/src/products/products.controller.ts:1-58`).
   - For seller workflows, rely on `/trade-operations`, `/negotiations`, `/seller/*` (once backend endpoints exist) to list offers and negotiation statuses.
   - Transporter screens call `/transport/requests|bids|jobs` to see assignments (`backend/src/transport/controllers/transport-bidding.controller.ts:1-170`).
   - Dashboard data provider should call the actual endpoints per role; align expected DTOs with backend responses (see `backend/src/negotiations/services/*`, `backend/src/trade-operations/dto/*`).

5. **Inspections & Transport**
   - Trigger inspections via `/inspections` endpoints; inspect results with `/inspections/:id` (see module docs).
   - Once sellers are verified, advance the trade operation phase and auto-create transport requests (`backend/src/transport/controllers/transport-bidding.controller.ts:1-120`).

6. **Testing & Validation**
   - Run `npm run test:e2e -- test/integration/happy-path-trade-operation.e2e-spec.ts` to validate backend workflows (`backend/TESTING_GUIDE.md:70-103`).
   - On mobile, exercise sign-in → onboarding → dashboard, checking Metro logs plus `debug-android.sh` for native crashes.

---

## 5. Immediate Action Items

1. **Backend hardening**
   - Reinstate `JwtAuthGuard`/`RolesGuard`, implement real Google ID token verification, and expose `/onboarding/status` to cross-check completion.
2. **Mobile service alignment**
   - Point onboarding services at the real endpoints, adjust DTOs to backend casing, and add UI states for loading/errors on each network call.
3. **Contract validation**
   - Export the latest Swagger spec (`npm run openapi:export`) and regenerate Postman collections so mobile devs can mock against the real payloads.
4. **Tooling fixes**
   - Add `eslint.config.js` (flat config) or pin ESLint to v8 so `npm run lint` works, and document the dev-client requirement prominently (already added to `front-end/README.md:45-88`).

This runbook should be the single source of truth when bringing the full flow online—update it whenever contracts or workflows change.
