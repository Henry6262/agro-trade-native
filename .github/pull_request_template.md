## PR Checklist

### Scope
- [ ] Backend (`backend/`)
- [ ] Mobile (`front-end/`)
- [ ] Admin Dashboard (`admin-dashboard/`)
- [ ] Smart Contracts (`contracts/` or `contracts-solana/`)
- [ ] Docs / Infra

### Type Safety & Quality
- [ ] `npx tsc --noEmit` passes in affected workspaces
- [ ] No new `any` types (exception must be justified below)
- [ ] No circular imports
- [ ] ESLint passes (`npm run lint` in affected workspace)

### Testing
- [ ] Unit tests pass (`npm test` in affected workspace)
- [ ] Contract tests pass (`forge test` in `contracts/`)
- [ ] E2E scenarios pass if trade logic changed

### Compliance & Critical Paths
- [ ] No changes to escrow logic without new Foundry tests
- [ ] cUSD amounts use 18 decimals — never truncate or round
- [ ] KYC/KYT/AML data models unchanged unless reviewed

### Description
<!-- What changed and why -->

---

**Important:** PRs modifying escrow contracts or financial calculations without accompanying tests will be blocked.
