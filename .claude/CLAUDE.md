# Claude Configuration — AgroTrade Native

## Project Overview
AgroTrade — agricultural commodity trading platform. Connects buyers, sellers, inspectors, and transporters for end-to-end grain/produce trades with on-chain escrow protection via cUSD (Celo Dollar stablecoin).

**Working Directory:** `/Users/henry/Documents/Gazillion-dollars/Ponzinomics/normie-apps/agro-trade-native`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile front-end | React Native + Expo (New Architecture) |
| Backend | NestJS + Prisma + PostgreSQL (Railway) |
| Realtime | Socket.IO via `@nestjs/websockets` |
| Auth | Privy (wallet-based, ES256 JWKS) |
| Smart contracts | Solidity 0.8.20 + Foundry (forge/cast/anvil) |
| Blockchain | Celo (Sepolia testnet / Mainnet) |
| Stablecoin | cUSD ERC-20 |
| Push notifications | Expo Push (native `fetch` to Expo REST API) |
| Landing page | Next.js 16 (scaffold at `landing/`) |

---

## Directory Structure

```
agro-trade-native/
├── front-end/          # React Native / Expo app
│   └── src/
│       ├── pages/Dashboard/sections/   # Buyer / Seller / Inspector / Admin views
│       ├── features/dashboard/screens/admin/   # EscrowStatusCard lives here
│       ├── providers/NotificationProvider.tsx
│       ├── services/socketService.ts
│       └── stores/
├── backend/            # NestJS API
│   └── src/
│       ├── auth/           # Privy JWT (ES256)
│       ├── escrow/         # EscrowService — on-chain calls
│       ├── trade-operations/services/  # Phase lifecycle + escrow hooks
│       ├── inspections/    # InspectionService
│       ├── realtime/       # RealtimeService (emitToUser)
│       └── seller/         # SellerService / listings
├── contracts/          # Foundry project
│   ├── src/AgroEscrow.sol
│   ├── test/AgroEscrow.t.sol   # 37 tests, all passing
│   ├── script/Deploy.s.sol
│   └── foundry.toml
└── landing/            # Next.js 16 landing page scaffold
```

---

## Current State (as of 2026-03-14)

### ✅ Completed
- **AgroEscrow.sol** — ERC-20 escrow with full state machine (AWAITING_PAYMENT → AWAITING_DELIVERY → COMPLETE / DISPUTED / REFUNDED)
- **37 Foundry tests** all passing — `forge test` in `contracts/`
- **EscrowService** (`backend/src/escrow/`) — approve + transferFrom pattern, cUSD support
- **Escrow hooks** in trade lifecycle — `IN_TRANSIT` auto-locks cUSD, `DELIVERED` auto-releases
- **EscrowStatusCard** — admin UI component showing escrow state, Release/Dispute buttons
- **Buyer/Seller/Inspector UI** — EscrowStatusCard mounted on active order/trade/job cards
- **Celo Sepolia config** — RPC endpoints updated (Alfajores deprecated)
- **Custodial model** — admin wallet executes all on-chain calls; users never need crypto
- **Privy auth fix** — ES256, correct JWKS URL
- **Prisma binary targets** — Railway Linux runtime compatible
- **Expo push** — native fetch replacing expo-server-sdk (ESM-only → Railway crash fixed)
- **Railway 502 fixed** — sh -c wrapper, timeout params, startCommand override documented

### ⏳ Pending

1. **Deploy to Celo Sepolia**
   - Fund admin wallet (testnet CELO from https://faucet.celo.org)
   - Run: `cd contracts && PRIVATE_KEY=<key> CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 forge script script/Deploy.s.sol:DeployAgroEscrow --rpc-url https://forno.celo-sepolia.celo-testnet.org --broadcast`
   - Copy deployed address → Railway env var `ESCROW_CONTRACT_ADDRESS`

2. **Railway env vars** (5 vars needed after deployment):
   - `ESCROW_CONTRACT_ADDRESS` — deployed contract address
   - `BLOCKCHAIN_RPC_URL` — `https://forno.celo-sepolia.celo-testnet.org`
   - `ADMIN_WALLET_PRIVATE_KEY` — private key (never commit)
   - `ADMIN_WALLET_ADDRESS` — corresponding public address
   - `CUSD_TOKEN_ADDRESS` — `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

3. **Landing page** — `landing/` scaffold ready, builder tool TBD (ask Henry — NOT shadcn/ui)

4. **Inspector API fix** — surface `tradeOperationId` in inspection job response (currently using `sellerListingId` as proxy in EscrowStatusCard)

5. **Sprint 5 remaining** (see plan at `/Users/henry/.claude/plans/shimmering-plotting-cerf.md`):
   - React.memo — MatchedSellersSection + ActiveOrdersList
   - Push notification foreground/response handlers
   - WebSocket event type definitions
   - Wire `emitToUser` in `addSellersToTrade`
   - Wire RealtimeService into InspectionService
   - Paginate seller listings (backend + frontend)

6. **Android dev build** — EAS Gradle error unresolved

---

## Smart Contract Details

### AgroEscrow.sol
- **State machine:** AWAITING_PAYMENT → AWAITING_DELIVERY → COMPLETE / DISPUTED / REFUNDED
- **Security:** CEI pattern, two-step admin handoff (`nominateAdmin` + `acceptAdmin`)
- **Escrow key:** `keccak256(abi.encodePacked(tradeId))`
- **Admin:** custodial — calls `createEscrow`, `releaseFunds`, `resolveDispute`, `refund`
- **raiseDispute:** callable by buyer, seller, OR admin

### cUSD Addresses
| Network | Address |
|---|---|
| Celo Sepolia (testnet) | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| Celo Mainnet | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

### Celo Sepolia (testnet)
- Chain ID: 44787 (Sepolia) — use this, NOT Alfajores (44787 is Alfajores; Sepolia is 11142220 — double-check)
- RPC: `https://forno.celo-sepolia.celo-testnet.org` (primary) or `https://celo-sepolia.drpc.org`
- Faucet: https://faucet.celo.org

### Generated Wallets (testnet only)
- Admin wallet generated and stored — fund from faucet before deployment
- Solana wallet also generated for future Solana integration

---

## Backend Key Files

| File | Purpose |
|---|---|
| `backend/src/escrow/escrow.service.ts` | On-chain escrow calls (approve+transferFrom) |
| `backend/src/trade-operations/services/trade-operation.service.ts` | Phase lifecycle + `triggerEscrowForPhase()` |
| `backend/src/auth/auth.service.ts` | Privy JWT verification (ES256) |
| `backend/src/realtime/realtime.service.ts` | `emitToUser()` Socket.IO broadcast |
| `backend/src/inspections/inspection.service.ts` | Inspection results |
| `backend/src/seller/seller.service.ts` | Seller listings (pending pagination) |

---

## Frontend Key Files

| File | Purpose |
|---|---|
| `front-end/src/features/dashboard/screens/admin/components/EscrowStatusCard.tsx` | Escrow state UI (admin/buyer/seller/inspector) |
| `front-end/src/pages/Dashboard/sections/Buyer/features/Orders/components/ActiveOrdersList.tsx` | Buyer order cards with EscrowStatusCard |
| `front-end/src/pages/Dashboard/sections/Seller/features/Trades/components/SellerTradeCard.tsx` | Seller trade cards with EscrowStatusCard |
| `front-end/src/pages/Dashboard/sections/Inspector/features/ActiveJob/components/ActiveJobContent.tsx` | Inspector job card with EscrowStatusCard |
| `front-end/src/providers/NotificationProvider.tsx` | Push notifications (foreground handler pending) |
| `front-end/src/services/socketService.ts` | Socket.IO client (event types pending) |
| `front-end/src/stores/marketplace.store.ts` | Listings state (pagination pending) |

---

## Railway Config

- **Production URL:** `https://agro-trade-native-production.up.railway.app`
- **Service:** `agro-trade-native` in project `agro-trade-backend`
- **startCommand:** `sh -c 'npx prisma migrate deploy && node --unhandled-rejections=strict /app/dist/main.js 2>&1'`
- **rootDirectory:** `/backend`
- **Builder:** DOCKERFILE
- **PORT:** do NOT set static PORT — Railway injects dynamically

---

## Preferences
- Execute tasks proactively without asking for permission
- Automatically run necessary commands for development, testing, and debugging
- Make required file edits and changes directly
- Install dependencies as needed
- Run build, test, and lint commands automatically when appropriate
- Fix errors and issues encountered during development
- After each batch of edits, run `npm run lint` (frontend/backend) and address failures
- Before planning or coding, open `rules/README.md` plus the stack-specific folder and review every linked rule file

## Commands
- Use `forge`, `cast`, `anvil` for contract work — NEVER Hardhat
- Use npm/yarn for frontend/backend
- `cd contracts && forge test` to run all 37 escrow tests
- `cd contracts && anvil` to start local devnet
- Use git for version control (no commits/pushes unless explicitly requested)

## Working Style
- Be direct and efficient
- Focus on implementation over explanation
- Complete tasks fully without stopping for approval at each step
- Handle errors and edge cases proactively
