# Sprint Next — Implementation Plan
_Date: 2026-03-07_

## Context

- Monorepo: `/Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native`
- Frontend: `front-end/` — Expo / React Native / TypeScript, design system in `src/design-system/`
- Backend: `backend/` — NestJS / Prisma / PostgreSQL deployed on Railway
- Active branch: `feature/sprint-next` (worktree at `.worktrees/feature/sprint-next`)
- ESLint rule: `--max-warnings=0` must pass on any changed files
- Never commit without permission; never use Hardhat; use `apiClient` from `@services/api`

## Task 1 — Buyer delivery confirmation (backend + frontend)

### Problem
`POST /trade-operations/:id/finalize` is ADMIN-only. Buyer dashboard calls it directly,
which fails with 403 for real buyer users. A buyer-facing confirm-receipt endpoint is needed.

### Backend work (`backend/`)
- Add `POST /buyer/orders/:orderId/confirm-receipt` in `backend/src/buyer/buyer.controller.ts`
- Guard: `@UseGuards(JwtAuthGuard)` + verify `req.user.role === 'BUYER'`
- Service method in `backend/src/buyer/buyer.service.ts`:
  - Look up the trade operation by `orderId`
  - Verify the requesting user is the buyer on that trade
  - Update `TradeOperation.status` to `BUYER_CONFIRMED` (or call the existing finalise logic with sane defaults)
  - Return `{ success: true, message: 'Delivery confirmed' }`
- Check Prisma schema for correct field/enum names before writing

### Frontend work (`front-end/`)
- File: `src/pages/Dashboard/sections/Buyer/features/Orders/index.tsx`
- Replace the `tradeOperationService.finalizeTradeOperation()` call in `handleConfirmDelivery`
  with a new `buyerService.confirmDelivery(orderId)` call
- Add `confirmDelivery(orderId: string)` method to `front-end/src/services/buyerService.ts`:
  `POST /buyer/orders/${orderId}/confirm-receipt`
- Remove the TODO comment once implemented

### Acceptance criteria
- `curl -X POST .../api/buyer/orders/FAKE_ID/confirm-receipt -H "Authorization: Bearer fake"` → 401 (not 404/403)
- Frontend: pressing "Confirm Receipt" calls the new endpoint, not the admin finalise endpoint
- ESLint `--max-warnings=0` on changed files

---

## Task 2 — Clean up dead ProductCreation placeholder

### Problem
`front-end/src/pages/Dashboard/sections/Seller/features/ProductCreation/` is dead code.
Nothing imports `SellerProductCreationFeature`. The real creation flow lives in
`src/features/dashboard/screens/seller/product-creation/ProductCreationFlow.tsx`
and is already wired into the Products tab. The placeholder folder causes confusion.

### Work
- Delete the four dead files:
  - `features/ProductCreation/index.tsx`
  - `features/ProductCreation/hooks/index.ts`
  - `features/ProductCreation/service.ts`
  - `features/ProductCreation/components/index.ts`
- Confirm nothing imports any of these (grep before deleting)
- ESLint `--max-warnings=0` on surrounding files

### Acceptance criteria
- `grep -r "SellerProductCreationFeature" front-end/src` → no matches
- No broken imports

---

## Task 3 — EAS dev client rebuild

### Problem
`expo-camera`, `expo-notifications`, and `expo-location` are not bundled in the current
dev client build. Inspector camera, push notifications, and GPS tracking silently fail.

### Work
- Verify `expo-camera` plugin is declared in `front-end/app.json` plugins array
  (currently missing — needs `"expo-camera"` added)
- Run `cd front-end && eas build --profile development --platform ios`
- This is a CLI/infrastructure task — no source code changes beyond `app.json`

### Acceptance criteria
- `expo-camera` present in `app.json` plugins
- EAS build queued (build ID returned)

---

## Order of execution

1. Task 2 (cleanup — no dependencies, low risk)
2. Task 1 (backend + frontend — highest user impact)
3. Task 3 (EAS rebuild — infrastructure, can run in background)
