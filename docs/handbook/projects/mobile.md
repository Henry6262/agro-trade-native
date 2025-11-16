# Mobile App Project Guide

**Last Updated**: 2025-11-13  
**Service**: `front-end/` (React Native + Expo)  
**Contacts**: Mobile chapter / customer-facing squad

---

## Overview
- Companion mobile experience for buyers/sellers to view offers, transport statuses, and notifications.
- Built with Expo SDK, TypeScript, and React Navigation.

---

## Directory Structure
```
front-end/
├── src/
│   ├── screens/            # Route screens (stack/tab)
│   ├── components/         # Shared UI components
│   ├── hooks/              # Data + state hooks
│   ├── services/           # API + storage wrappers
│   ├── navigation/         # Stack/tab navigators
│   └── theme/              # Styling system
├── assets/                 # Fonts, images
├── __tests__/              # Jest or Expo tests
├── android/ / ios/         # Native projects (if ejected)
└── app.json / package.json # Expo configuration
```

_Auto inventory_: `docs/handbook/generated/mobile-structure.md` lists top-level `src/` folders (refresh with `node scripts/atctl.mjs docs --sync` after reorganizing).

### Required Hierarchy (Page → Section → Feature)
Every page, section, and feature must live in its own folder containing:
```
FeatureName/
├── components/   # Presentation components (design system only)
├── hooks/        # Logic + data fetching (React hooks)
├── service.ts    # API + business logic
├── types.ts      # Interfaces/types
├── utils.ts      # Pure helpers (optional)
├── store.ts      # Shared state (optional, Zustand)
└── index.tsx     # Main component
```
Components render using design-system primitives, while hooks/services/store handle all data and business logic. See `docs/rules/mobile-architecture.md` for enforcement details.

---

## Commands
```bash
cd front-end
npm install
npm run start        # Expo start (Metro bundler + QR)
npm run android      # Run on Android emulator/device
npm run ios          # Run on iOS simulator
npm run test         # Jest tests (if configured)
```

Env config handled via `app.config.ts` or `.env` + `expo-constants`. Mirror API settings with admin dashboard.

---

## Onboarding Flow

### Role-Based Onboarding
Mobile app provides personalized onboarding for three roles:

**Seller Flow (🌾):**
1. Product Selection – choose products they grow/sell
2. Product Details – varieties, quantities, pricing
3. Market Insights – demand and earning potential
4. Account Creation – OAuth or email registration

**Buyer Flow (🏭):**
1. Product Selection – choose products they want to buy
2. Requirements – quantities, quality, delivery needs
3. Market Overview – available suppliers and costs
4. Account Creation – OAuth or email registration

**Transport Flow (🚛):**
1. Fleet Information – vehicle types, capacity, base location
2. Job Preferences – cargo types, distances, availability
3. Opportunities – available jobs and earnings
4. Account Creation – OAuth or email registration

**State Management:** Uses Zustand (`src/store/onboardingStore.ts`) for onboarding progress persistence.

### Authentication Setup

**Google Sign-In (Native):**
Requires native module setup (not available in Expo Go):

1. **Environment Variables** (`.env`):
   ```env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
   ```

2. **Android Setup:**
   - Add SHA-1 fingerprint to Firebase/Google Console
   - Place `google-services.json` in `android/app/`

3. **iOS Setup:**
   - Add `GoogleService-Info.plist` from Firebase to Xcode project
   - URL scheme handled automatically by Expo

4. **Backend Endpoint:**
   - POST `/api/auth/google/native` expects `{ idToken, role, email, name }`
   - Verifies token, creates/updates user, returns JWT

**Flow:**
- App calls `GoogleSignin.signOut()` to clear cached session
- App calls `GoogleSignin.signIn()` → shows account picker
- User selects account
- App receives ID token, sends to backend
- Backend returns JWT, app navigates to dashboard

**Testing:** Run on real device or simulator with native build (`npm run android` / `npm run ios`). Expo Go does not support native Google Sign-In.

Detailed guides archived in:
- `docs/archive/front-end/2025-11/ONBOARDING_GUIDE.md`
- `docs/archive/front-end/2025-11/GOOGLE_SIGNIN_NATIVE_SETUP.md`

---

## Transporter Dashboard

### Jobs Feature
- **Location**: `front-end/src/pages/Dashboard/sections/Transporter/features/Jobs/`
- **Purpose**: Provide transporters with a dedicated surface to monitor active jobs, pickup progress, and completion actions without mixing UI and logic.
- **Data Flow**:
  1. `transporterJobsService` (`service.ts`) wraps `transportService` for `fetchJobs`, `startJob`, `completePickup`, and `completeDelivery`.
  2. `useTransporterJobs` (`hooks/useTransporterJobs.ts`) loads the raw jobs, computes metrics (active/in-transit/completed today), and shapes UI-friendly job objects via `utils/index.ts`.
  3. Presentation components (`components/RefreshButton`, `JobsSummaryGrid`, `JobList`, `JobCard`) render metrics and cards using shared primitives like `MetricCard`, `@shared/components/Button`, and `Badge`.
  4. Actions invoked from cards call the hook, which triggers the service, tracks `actionJobId`, and refreshes data after completion. Components only show success/error alerts.
- **State**:
  - Hook state manages the raw list, derived `displayJobs`, summary metrics, refresh state, and current action job ID.
  - No feature-level store yet; add a Zustand store only if filters/preferences need to persist across transporter features.

### Bidding Feature
- **Location**: `front-end/src/pages/Dashboard/sections/Transporter/features/Bidding/`
- **Purpose**: Centralize live transport auctions so transporters can review requests, inspect routes, and submit bids without embedding API logic inside components.
- **Data Flow**:
  1. `transporterBiddingService` wraps `transportService` to fetch available requests/bids/performance and submit new bids.
  2. `useTransporterBidding` loads raw data, computes KPI summaries (active bids, win rate, average bid, completed jobs), and maps each request into display-friendly objects via `utils/index.ts`.
  3. Presentation components (`SummaryGrid`, `VerificationBanner`, `RequestsList` + `RequestCard`) render stats and cards using shared primitives; bidding forms stay entirely inside the card component but rely on hook state for data/handlers.
  4. Route previews open the shared `MapDrawer` with a `MapOffer` built by the utility helper so every feature consumes the same transport map module.
- **State**:
  - Hook state tracks requests, bids, transporter performance metrics, bid form selections, and map drawer visibility.
  - No Zustand store is needed yet; once filters/preferences must persist, add a feature-level store consistent with the rulebook.

### Fleet Feature
- **Location**: `front-end/src/pages/Dashboard/sections/Transporter/features/Fleet/`
- **Purpose**: Show truck/driver availability with the same separation-of-concerns model. API calls stay in `service.ts`, filtering logic in the hook, and presentation in `components/`.
- **Data Flow**:
  1. `transporterFleetService` (`service.ts`) returns the fleet snapshot (currently mock data; replace with backend calls once endpoints exist).
  2. `useTransporterFleet` handles loading, derived summaries, tab filters (available vs in-transit/assigned), and the fleet-creation modal toggle.
  3. `components/` render stats (`FleetStatsGrid`), CTA (`FleetCreationCard`), and the truck/driver panels using shared primitives (`MetricCard`, `Badge`, `Button`).
- **State**:
  - Hook state tracks the fleet summary plus the filtered truck/driver lists. Components receive props only and never call services directly.
  - `FleetCreationFlow` remains as the modal entry point and is triggered via the hook’s `showFleetCreation` flag.

## Inspector Dashboard

### Active Job Feature
- **Location**: `front-end/src/pages/Dashboard/sections/Inspector/features/ActiveJob/`
- **Purpose**: Surface the inspector’s current assignment with live maps, claimed specs, and the verification form while keeping network calls out of presentation components.
- **Data Flow**:
  1. `inspectorActiveJobService` (`service.ts`) wraps `inspectionService` to fetch in-progress/scheduled missions and post verification results.
  2. `useInspectorActiveJob` (`hooks/useInspectorActiveJob.ts`) manages loading/error state, derives the presentation job (location + product details), and toggles the verification form.
  3. `ActiveJobContent` + `VerificationForm` (`components/`) render the map, job details, and multi-step verification UI; the form returns structured values consumed by the hook/service.
- **State**:
  - Hook state keeps the job snapshot, the inspector’s current location, and whether the verification form is visible.
  - Verification form keeps its own local field state; submission pushes structured data through the hook which forwards it to the service.

---

## Development Workflow
- Follow the Page → Section → Feature structure for every screen; shared modules go under `pages/<Page>/features/shared/` and are wrapped by role-specific sections.
- Keep logic in hooks/services; components are presentation only (≤150 lines).
- Use React Query for server data, Zustand for shared feature state, and the global store for app-wide state.
- Document new features in `docs/handbook/projects/mobile.md` and blueprints under `docs/blueprints/mobile/`.
- Update `docs/coordination/implementation-status.md` after each story per Plan Mode runbook.

Reference `docs/rules/mobile-architecture.md` for the detailed ruleset and file-size limits.

---

## Integration Notes
- Consumes same backend REST endpoints; share DTOs where possible (`admin-dashboard/src/types` vs dedicated mobile types).
- Notification + transport flows must align with backend negotiation expiry + status transitions.
- Offline caching handled via AsyncStorage; document any schema changes in `docs/features/implemented/mobile-offline.md` (to be created when applicable).

---

## Maintenance
- Keep Expo SDK version in sync with CLI; follow upgrade notes.
- Document UX changes and flows in `docs/features/implemented/` or planned specs.
- Ensure mobile-specific env vars captured in `.env.example`.
