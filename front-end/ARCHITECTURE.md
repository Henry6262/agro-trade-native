# AgroTrade Mobile App — Frontend Architecture

> Last updated: 2026-05-04

## Overview

React Native (Expo) frontend for AgroTrade. Targets iOS, Android, and web.

## Directory Structure

```
src/
├── features/          # Navigation-facing screens & feature modules
│   ├── onboarding/    # Onboarding flow (screens + components)
│   ├── auth/          # Auth screens (some active, some legacy)
│   ├── dashboard/     # Dashboard screens (mostly re-exports from pages/)
│   ├── marketplace/   # Marketplace screens
│   ├── orders/        # Order screens
│   └── admin/         # Admin screens
├── pages/             # ACTUAL implementation directory for most UI
│   ├── Onboarding/    # Onboarding step components (the real UI)
│   ├── Auth/          # Auth screens (actively used by navigation)
│   ├── Dashboard/     # Dashboard sections (actively used by features/)
│   ├── Orders/        # Order screens (actively used by navigation)
│   └── Marketplace/   # Marketplace screens
├── stores/            # Zustand stores
│   ├── onboarding-store/   # Onboarding state, validation, payload builder
│   ├── auth.store.ts
│   ├── product.store.ts
│   └── ...
├── services/          # API clients and service logic
├── shared/            # Shared types, constants, utils, components
│   ├── types/         # TypeScript types (CRITICAL: read notes below)
│   ├── constants/     # App constants
│   ├── components/    # Shared UI components
│   └── utils/         # Helper functions
├── navigation/        # React Navigation stack definitions
├── design-system/     # Reusable UI primitives
├── contexts/          # React contexts
├── hooks/             # Shared hooks
└── config/            # Environment config
```

## Critical Architecture Notes

### The `features/` vs `pages/` Split

**This app has a hybrid architecture from an incomplete migration.**

- `src/navigation/` imports screens from **both** `features/` and `pages/` depending on the module.
- `features/onboarding/screens/` are thin wrapper screens imported by the navigation stack. They delegate to `pages/Onboarding/sections/*/components/` for the actual UI.
- `features/dashboard/screens/` are mostly re-exports of `pages/Dashboard/sections/`.
- `pages/Auth/screens/` and `pages/Orders/screens/` are imported directly by navigation.

**Rule of thumb:** Check `src/navigation/*Stack.tsx` to find the canonical import path for any screen. Do NOT assume `features/` or `pages/` is the single source of truth across the entire app.

### Onboarding Architecture

```
Navigation Stack
  └── features/onboarding/screens/      (wrapper screens)
        ├── RoleSelectionScreen.tsx
        ├── SellerOnboardingFlowScreen.tsx   → imports pages/Onboarding/sections/Seller/...
        ├── BuyerOnboardingFlowScreen.tsx    → imports pages/Onboarding/sections/Buyer/...
        ├── TransporterOnboardingFlowScreen.tsx → imports pages/Onboarding/sections/Transporter/...
        └── OnboardingCompleteScreen.tsx

Actual UI Implementation
  └── pages/Onboarding/
        ├── components/shared/            (Navigation, OnboardingLayout, ProductSelection)
        ├── sections/Seller/components/SellerOnboarding/
        ├── sections/Buyer/components/BuyerOnboarding/
        └── sections/Transporter/components/TransporterOnboarding/
```

**Onboarding Store:** `src/stores/onboarding.store.ts`
- Uses Zustand + Immer + Persist (AsyncStorage)
- Internal role type: `OnboardingRole = 'seller' | 'buyer' | 'transport'`
- Maps to backend enum `UserRole` at API boundary via `buildOnboardingPayload()`

## Type System — Important

### `UserRole` Collision (RESOLVED)

There were **two incompatible `UserRole` definitions**:

1. `src/shared/types/index.ts` — `enum UserRole { ADMIN='ADMIN', FARMER='FARMER', BUYER='BUYER', TRANSPORTER='TRANSPORTER', ... }`
   - Used by: auth, dashboard, API services
2. `src/shared/types/onboarding.ts` — `type OnboardingRole = 'seller' | 'buyer' | 'transport'`
   - Used by: onboarding store, onboarding components

**Fix applied:** Renamed the onboarding-specific type to `OnboardingRole` and updated all onboarding imports. The onboarding store now uses `OnboardingRole` internally and maps to backend `UserRole` at the API boundary.

### `exactOptionalPropertyTypes`

The base tsconfig enables `exactOptionalPropertyTypes: true`. This means:

```ts
// ❌ BAD — will cause TS2375
interface Props {
  onComplete?: () => void;
}
<Component onComplete={undefined} />  // Type error!

// ✅ GOOD
interface Props {
  onComplete?: (() => void) | undefined;
}
<Component onComplete={undefined} />  // OK
```

When a prop can receive `undefined` from the caller, you MUST explicitly add `| undefined` to the type definition.

## Store Architecture

| Store | File | Purpose |
|-------|------|---------|
| Onboarding | `src/stores/onboarding.store.ts` | Multi-step onboarding state, form data, submission |
| Auth | `src/stores/auth.store.ts` | JWT tokens, user session |
| Product | `src/stores/product.store.ts` | Product catalog, categories |

## What Was Deleted (Dead Code Cleanup)

| Deleted | Reason |
|---------|--------|
| `pages/Onboarding/screens/` | Exact duplicates of `features/onboarding/screens/` |
| `pages/Onboarding/components/AnimatedRoleCard.tsx` | Duplicate of `features/onboarding/components/AnimatedRoleCard.tsx` |
| `pages/Onboarding/index.tsx` | Placeholder with no implementation |
| `*.bak` files (6) | Backup artifacts |
| `.gitkeep` files (6) | Empty directory placeholders |
| Empty `service.ts` files (11) | Scaffold stubs with `export const service = {}` |
| Empty `hooks/index.ts` files (13) | Scaffold stubs with `export {}` |
| Empty `types.ts` files (11) | Scaffold stubs with `export type FeatureProps = Record<string, never>` |

## Known Issues & Migration Notes

1. **Auth screens:** `navigation/AuthStack.tsx` imports from `pages/Auth/screens/`, but `features/auth/screens/` contains parallel implementations. Verify which is active before editing auth.
2. **Dashboard:** `features/dashboard/screens/` are mostly re-exports of `pages/Dashboard/sections/`. Edit the source in `pages/Dashboard/`.
3. **TypeScript errors:** 322 errors remain across the wider codebase (down from 408). The onboarding path is now clean. Priority areas: `admin/screens/`, `shared/components/EnhancedLocationConfirmation.tsx`.
4. **Navigation reset types:** React Navigation's `CommonActions.reset()` has typing issues. Use `as any` cast when dispatching resets (pattern established in `OnboardingCompleteScreen.tsx`).

## Adding New Onboarding Steps

1. Add step config to `src/shared/constants/simplifiedOnboarding.ts`
2. Add validation logic to `src/stores/onboarding-store/validation.ts`
3. Build the step component in `pages/Onboarding/sections/{ROLE}/features/`
4. Wire it into `{Role}Onboarding/index.tsx` render switch
5. Update payload builder in `src/stores/onboarding-store/payload.ts` if new data needs to go to the backend
