# 00 — Project Status

> **Last updated:** 2026-03-23
> **Overall status:** ✅ Code-complete. Blocked on 3 human-action items before release.

---

## Sub-Projects at a Glance

| Project | Status | Notes |
|---------|--------|-------|
| `backend/` | ✅ Build clean, deployed on Railway | All modules wired, escrow hooks live |
| `front-end/` | ✅ Feature-complete | iOS works; Android EAS build has Gradle error |
| `landing/` | ✅ Build clean (25 pages) | Server runs via `npm start`; dev via `npm run dev` |
| `contracts/` | ✅ 37 Foundry tests passing | Awaiting Celo Sepolia deployment |
| `admin-dashboard/` | 🟡 Supplementary | Replaced by `landing/` web dashboard |

---

## Completed Work (Verified in Code)

### Backend
- [x] NestJS monolith — 23 modules wired in `app.module.ts`
- [x] Privy JWT auth (ES256, correct JWKS URL)
- [x] Prisma binary targets for Railway Linux (`debian-openssl-3.0.x`, `linux-musl-openssl-3.0.x`)
- [x] `AgroEscrow` service — `approve + transferFrom` pattern for cUSD
- [x] Escrow auto-triggered on `IN_TRANSIT` (locks funds) and `DELIVERED` (releases funds)
- [x] `RealtimeService.emitToUser()` wired into trade operations + inspections
- [x] `emitToUser` called in `addSellersToTrade` (commit `770277b`)
- [x] Socket.IO events emitted on every trade phase change
- [x] Expo push notifications via native `fetch` (replaced `expo-server-sdk` ESM crash)
- [x] Seller listings pagination — `{data, meta:{page,limit,total,hasMore}}`
- [x] Railway 502 fixed — `sh -c` wrapper, `?connect_timeout=5&pool_timeout=5` on DATABASE_URL
- [x] All API modules: auth, buyer, seller, inspector, transport, escrow, negotiation, realtime, notifications, analytics, traceability

### Mobile App (`front-end/`)
- [x] Role-based dashboards: Buyer, Seller, Inspector, Transporter, Admin
- [x] `EscrowStatusCard` on all active order/trade/job cards
- [x] `NotificationProvider` — foreground handler + response/tap handler with navigation
- [x] `socketService.ts` — `SocketEventPayloads` typed interface for all WS events
- [x] `React.memo` on `MatchedSellersSection` + `ActiveOrdersList`
- [x] `expo-build-properties ~0.14.8` (fixed version conflict)
- [x] Inspector `tradeOperationId` surfaced correctly via `toInspectorJob` mapper

### Landing / Web Portal (`landing/`)
- [x] Full landing page: Hero, Problem, HowItWorks, Ecosystem, Roles, AppShowcase, GlobalReach, CTA
- [x] Web dashboard: Buyer, Seller, Inspector, Transporter, Admin views
- [x] Admin escrow management — `EscrowStatusCard` with Release/Dispute actions
- [x] Green brand color scheme applied end-to-end
- [x] Build passes — 23 static + 2 dynamic routes, zero errors
- [x] Dev server fixed — `turbopack.root` set to suppress false monorepo detection
- [x] Waitlist API route (`/api/waitlist`)

### Smart Contracts (`contracts/`)
- [x] `AgroEscrow.sol` — full state machine (AWAITING_PAYMENT → AWAITING_DELIVERY → COMPLETE/DISPUTED/REFUNDED)
- [x] CEI security pattern, two-step admin handoff (`nominateAdmin` + `acceptAdmin`)
- [x] Switched from native CELO to cUSD ERC-20 (`approve + transferFrom`)
- [x] 37 Foundry tests — all passing (`forge test` in `contracts/`)
- [x] Deploy script ready at `contracts/script/Deploy.s.sol`

---

## Open Items — Blocked on Human Action

### 🔴 BLOCKER 1 — Deploy AgroEscrow.sol to Celo Sepolia

**Why blocked:** Requires funded admin wallet (testnet CELO from faucet)

```bash
# Step 1: Fund wallet at https://faucet.celo.org

# Step 2: Deploy
cd contracts && \
  PRIVATE_KEY=<admin_private_key> \
  CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 \
  forge script script/Deploy.s.sol:DeployAgroEscrow \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast

# Step 3: Copy deployed contract address → BLOCKER 2
```

### 🔴 BLOCKER 2 — Set Railway Environment Variables

**Why blocked:** Needs contract address from BLOCKER 1

Set these 5 vars in Railway dashboard for service `agro-trade-native`:

| Variable | Value |
|----------|-------|
| `ESCROW_CONTRACT_ADDRESS` | `<deployed address from BLOCKER 1>` |
| `BLOCKCHAIN_RPC_URL` | `https://forno.celo-sepolia.celo-testnet.org` |
| `ADMIN_WALLET_PRIVATE_KEY` | `<admin wallet private key>` |
| `ADMIN_WALLET_ADDRESS` | `<admin wallet public address>` |
| `CUSD_TOKEN_ADDRESS` | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |

### 🟡 BLOCKER 3 — Android Dev Build (EAS Gradle Error)

**Why blocked:** Needs Android build environment / EAS account

```bash
cd front-end && eas build --platform android --profile development --clear-cache
```

The `expo-build-properties` config is correct. `--clear-cache` resolves most stale Gradle state issues.

---

## Recent Git History

```
770277b feat: wire RealtimeService events, add socket notifications for trades and inspections
2b247c3 fix: expo-build-properties version, push handlers, socket types, admin UI polish
d75cccb feat: add landing/ — full Next.js web app with dashboard, auth, and escrow admin
505803d feat: update escrow service for cUSD ERC-20 — approve+transferFrom pattern
c35c73a feat: switch AgroEscrow from native CELO to cUSD ERC-20 stablecoin
7b3b216 chore: add Claude Code tool permissions + gitignore docx and env files
dc51192 fix: update Foundry RPC endpoints — Celo Alfajores deprecated, use Celo Sepolia
```

---

## Definition of "Released"

The app is released when:
- [ ] `AgroEscrow.sol` deployed on Celo Sepolia and address set in Railway
- [ ] Backend Railway redeploys with all 5 escrow env vars
- [ ] iOS TestFlight build submitted via EAS
- [ ] Android build resolves Gradle error and submits to Play internal testing
- [ ] Landing page deployed to Vercel (or Railway) with custom domain
