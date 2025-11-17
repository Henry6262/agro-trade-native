# Mobile App Migration Plan

**Last Updated**: 2025-11-15  
**Scope**: `front-end/` (React Native)  
**Reference App**: `examples/abu-dhabi/FE-abu`

---

## Objectives
- Adopt the Page → Section → Feature hierarchy defined in `docs/rules/mobile-architecture.md`.
- Mirror best practices from the Abu Dhabi production app (`examples/abu-dhabi/FE-abu`) while preserving existing navigation/tab integrations.
- Eliminate the ad-hoc `src/features/*` layout in favor of structured modules that keep presentation and logic separate.

---

## Current Snapshot (front-end/src)
```
assets, components, config, contexts, features, hooks, navigation,
providers, services, shared, stores, styles, types, utils
```
- Screens are nested under `features/<domain>/screens/...` with mixed responsibilities.
- Shared UI components live under `components/`, but many screens define custom styles.
- Navigation resides in `src/navigation` (React Navigation tabs/stacks).

---

## Reference Snapshot (examples/abu-dhabi/FE-abu)
```
app/                 # Expo Router pages
components/          # Design system + shared UI
hooks/, providers/, services/, screens/, utils/, types/
```
- Uses Expo Router + modular screen folders.
- UI primitives centralized under `components/`.
- Each screen keeps hooks/services separate from presentation.

---

## Migration Phases
### Phase 0 – Prep (Done)
- Define architecture rules (`docs/rules/mobile-architecture.md`).
- Update handbook guide and blueprint (MOB-001).
- Create backend rulebook + enforcement script (`rules/backend/*`, `scripts/check-backend-rules.mjs`) so backend work mirrors the mobile structure rules.

### Phase 1 – Scaffolding (To Do)
1. **Create Base Directories**
   - `src/app/components/ui/` (move design-system primitives from `src/components`).
   - `src/app/layout/`, `src/app/services/api/`, `src/app/store/`, `src/app/utils/`.
2. **Introduce `src/pages/`**
   - Seed folders: `pages/Onboarding`, `pages/Dashboard`, `pages/Orders`, etc.
   - Each page gets `sections/`, `components/`, `hooks/`, `types.ts`, `index.tsx`.

### Phase 2 – Feature Migration
1. **Onboarding (MOB-001)**
   - Move `src/features/onboarding/*` into `pages/Onboarding/sections/<RoleSection>/features/<Feature>/`.
   - Split components/hooks/services per rule. Use Zustand stores per feature.
   - Update navigation import paths.
   - Shared flows (e.g., product selection) live under `pages/Onboarding/features/shared/` and are composed by role sections.
2. **Seller Dashboard (MOB-00X)**
   - Target folders for migration:
     - `src/features/dashboard/screens/seller/SellerProductsTab.tsx` → `pages/Dashboard/sections/Seller/features/Products/`.
     - `SellerOffersTab.tsx` → `features/Offers/`.
     - `SellerTradesTab.tsx` → `features/Trades/`.
     - `product-creation/*` → `features/ProductCreation/`.
     - `components/**` → `pages/Dashboard/sections/Seller/components/`.
   - Each feature folder must include `components/`, `hooks/`, `service.ts`, `types.ts`, `store.ts` (when needed), per the frontend rulebook.
   - Market intelligence and shared KPI tiles move into `pages/Dashboard/features/shared/MarketInsights/` so both seller and buyer flows can pull the same UI.
   - `DashboardMainScreen` should import the Seller page entry: `import { SellerDashboardPage } from '@/pages/Dashboard/sections/Seller';` so navigation stays clean.

3. **Buyer Dashboard (MOB-00Y)**
   - Move `src/features/dashboard/screens/buyer/*` into `pages/Dashboard/sections/Buyer/...` with these feature buckets:
     - `BuyerOrdersTab.tsx` → `features/Orders/` (split cards, stats, operation timeline into subcomponents).
     - `BuyerRequestsTab.tsx` → `features/Requests/`.
     - `request-creation/*` → `features/RequestCreation/`.
   - Shared modules:
     - Order/Trade summary cards and progress timeline align with Seller trades; create `pages/Dashboard/features/shared/Timeline/` and `.../StatusChips/` to avoid duplication.
     - Reuse the stat widgets under `pages/Dashboard/features/shared/OverviewCards/`.
   - Buyer/Seller services should expose typed hooks (`useBuyerOrders`, `useSellerProducts`) living inside each feature’s `hooks/` folder while the axios client stays in `src/services`.

4. **Transporter, Inspector, Admin (Later Phases)**
   - Follow the same Page → Section → Feature pattern, ensuring multi-role shared pieces (maps, verification cards, fleet lists) live in `pages/Dashboard/features/shared/`.
   - ✅ `pages/Dashboard/sections/Transporter/features/Jobs/` now conforms to the structure with dedicated `service.ts`, `hooks/useTransporterJobs.ts`, derived metrics in `utils/`, and presentation components (`JobCard`, `JobList`, `JobsSummaryGrid`, `RefreshButton`). Use this as the reference when migrating the remaining transporter/inspector modules.
   - ✅ `pages/Dashboard/sections/Transporter/features/Bidding/` refactored with `service.ts`, `types.ts`, `utils/index.ts`, hook-driven logic (`useTransporterBidding`), and presentation-only components (`SummaryGrid`, `RequestsList`, `RequestCard`, `VerificationBanner`). Bidding now reuses the shared Map Drawer and keeps API interactions in the hook/service layers.
   - ✅ `pages/Dashboard/sections/Transporter/features/Fleet/` now mirrors the rulebook with `types.ts`, `service.ts`, `hooks/useTransporterFleet.ts`, and presentation components (`FleetStatsGrid`, `FleetCreationCard`, `FleetTrucksSection`, `FleetDriversSection`). `FleetCreationFlow` is triggered via hook state rather than inline logic.
   - ✅ `pages/Dashboard/sections/Transporter/features/Offers/` now uses `service.ts`, `hooks/useTransporterOffers.ts`, and updated components (`OffersSummaryGrid`, `OffersList`) so network calls and bid submissions are handled outside the UI; MapDrawer selection is controlled via hook state.
   - ✅ `pages/Dashboard/sections/Transporter/features/Transfers/` refactored with `types.ts`, `service.ts`, `hooks/useTransporterTransfers.ts`, helper `utils/`, and presentation components (`TransfersStatsGrid`, `TransfersList`, `TransferJobCard`, `TransfersRefreshButton`). Legacy logic now lives entirely in hook/service layers.
   - ✅ `pages/Dashboard/sections/Inspector/features/AvailableJobs/` now mirrors Active Job structure with `types.ts`, `service.ts`, `hooks/useInspectorAvailableJobs.ts`, and reuses shared `JobListView`/`JobMapView` components for presentation.
   - ✅ `pages/Dashboard/sections/Buyer/features/Orders/` now follows the same structure (`types.ts`, `service.ts`, `hooks/useBuyerOrders.ts`, component folder) so buyer dashboards no longer fetch data inside components.
   - ✅ `pages/Dashboard/sections/Buyer/features/Requests/` uses `service.ts`, `utils.ts`, `hooks/useBuyerRequests.ts`, and a `components/RequestsList.tsx` so listings + drawers are managed via hooks/services.
   - ✅ `pages/Dashboard/sections/Buyer/features/RequestCreation/` now relies on a reducer-backed hook (<200 lines) with supporting `service.ts`, `state.ts`, and `utils.ts`.
   - ✅ `pages/Dashboard/sections/Inspector/features/ActiveJob/` now uses its own `service.ts`, `hooks/useInspectorActiveJob.ts`, and `components/` (`ActiveJobContent`, `VerificationForm`) so verification flows no longer fetch inside components. Available Jobs remains to be migrated next.

### Phase 3 – Cleanup & Enforcement
- Remove legacy `src/features/` once all screens moved.
- Update imports, Jest/test paths, and navigation routes.
- Add lint/hook checks (extend `atctl check` or pre-commit) to ensure:
  - Feature folders contain required files.
  - Component/hook/service file sizes stay within limits.
  - UI components originate from `app/components/ui/`.

---

## Navigation Considerations
- Current React Navigation setup stays under `src/navigation`. During migration, export page entry components from `pages/<Page>/index.tsx` and import them in existing navigators.
- Do not alter tab/stack configuration until after each page is moved; treat navigation as an integration layer.
- Reference `examples/abu-dhabi/FE-abu/app/` for how screens register routes without breaking navigation.

---

## Deliverables Checklist
- [ ] `src/app/components/ui` populated and referenced by migrated features.
- [ ] `src/pages/Onboarding` uses new structure (MOB-001).
- [ ] Seller dashboard features migrated to `src/pages/Dashboard/sections/Seller`.
- [ ] Lint/hook enforcement added.
- [ ] `docs/handbook/projects/mobile.md` updated with new paths/examples.
- [ ] Legacy `src/features/*` removed after all migrations.

Update this plan after each phase to track progress and note blockers.
