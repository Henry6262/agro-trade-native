# Daily Log

## 2025-11-17
- **@backend** – Authored backend rulebook (`rules/backend/*`), added enforcement script + `atctl` hook, updated handbook/migration docs. Checker currently warns about missing DTO folders for pricing/products/regions; follow-up tasks queued under EP-01.
- **@backend** – Added DTO folders + typed responses for pricing/products/regions and restored backend ESLint config. `node scripts/check-backend-rules.mjs` now passes cleanly; `npm run lint` still fails due to long-standing unused-var issues in transport/auth modules.
