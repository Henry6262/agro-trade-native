# 02 — Backend

> NestJS API — all modules, REST endpoints, patterns, and configuration.

**Location:** `backend/`
**Runtime:** Node.js 20 (Railway Docker)
**Framework:** NestJS + Prisma + PostgreSQL
**Live URL:** `https://agro-trade-native-production.up.railway.app/api`

---

## Module Map

All 23 modules registered in `backend/src/app.module.ts`:

| Module | Path | Responsibility |
|--------|------|----------------|
| `AuthModule` | `src/auth/` | Privy JWT verification, user extraction |
| `PrismaModule` | `src/prisma/` | DB connection, global Prisma client |
| `RealtimeModule` | `src/realtime/` | Socket.IO server, `emitToUser()` |
| `SellerModule` | `src/seller/` | Listings CRUD, offers, timeline, pagination |
| `BuyerModule` | `src/buyer/` | Buy listings, orders, matched sellers |
| `TradeOperationsModule` | `src/trade-operations/` | Full trade lifecycle, escrow triggers |
| `InspectionModule` | `src/inspections/` | Inspection requests, results, active mission |
| `InspectorModule` | `src/modules/inspector/` | Inspector profile, job assignment |
| `TransportModule` | `src/transport/` | Transport requests, bids, jobs |
| `TransportCompanyModule` | `src/transport-company/` | Company profiles, drivers |
| `NegotiationsModule` | `src/negotiations/` | Offer rounds, counter-offers |
| `EscrowModule` | `src/escrow/` | On-chain cUSD escrow (approve + transferFrom) |
| `NotificationModule` | `src/notifications/` | Push token storage, send via Expo REST |
| `OnboardingModule` | `src/onboarding/` | User registration, role selection |
| `ProductsModule` | `src/products/` | Product catalogue (wheat, corn, etc.) |
| `RegionsModule` | `src/regions/` | Region/city lookup |
| `OrdersModule` | `src/orders/` | Order aggregation views |
| `LocationModule` | `src/location/` | Geocoding, address management |
| `CacheModule` | `src/cache/` | In-memory cache for hot data |
| `AnalyticsModule` | `src/analytics/` | Trade stats, volume tracking |
| `TraceabilityModule` | `src/traceability/` | Supply chain audit trail |
| `TradeEventsModule` | `src/trade-events/` | Immutable event log per trade |
| `SimulationModule` | `src/simulation/` | Dev/test trade scenario runner |
| `SeedModule` | `src/seed/` | DB seed data for dev |

---

## Key Services

### `AuthService` (`src/auth/auth.service.ts`)
Verifies Privy JWTs on every authenticated request.

```typescript
// Critical config — must NOT change these:
JWKS URL: https://auth.privy.io/api/v1/apps/${privyAppId}/jwks.json
Algorithm: ES256  (Privy uses P-256 EC keys, NOT RS256)
```

### `EscrowService` (`src/escrow/escrow.service.ts`)
The ONLY code that calls the blockchain. Uses ethers.js with the admin wallet.

```typescript
// Pattern: admin pre-approves → createEscrow locks cUSD from buyer
await cusd.approve(escrowContract, amount)     // admin approves on behalf of buyer
await escrow.createEscrow(tradeId, buyer, seller, amount)  // locks funds

// Release on DELIVERED
await escrow.releaseFunds(escrowKey)

// Dispute resolution
await escrow.resolveDispute(escrowKey, releaseToBuyer: bool)
```

### `TradeOperationService` (`src/trade-operations/services/trade-operation.service.ts`)
Central state machine for trades. Contains `triggerEscrowForPhase()`:

```typescript
// Auto-triggered on phase transitions:
IN_TRANSIT  → calls EscrowService.createEscrow()   // lock funds
DELIVERED   → calls EscrowService.releaseFunds()   // release funds
DISPUTED    → flags for admin review
```

### `RealtimeService` (`src/realtime/realtime.service.ts`)
```typescript
emitToUser(userId: string, event: string, data: unknown): void
// Finds all sockets for a user and emits to each
// Called from: TradeOperationService, InspectionService, NegotiationsService
```

---

## REST API Endpoints (Key Routes)

### Auth
```
POST /api/auth/verify          — verify Privy JWT, create/get user
GET  /api/auth/me              — current user profile
```

### Seller
```
GET  /api/seller/listings                    — paginated listings {data, meta}
POST /api/seller/listings                    — create listing
GET  /api/seller/listings/:id               — single listing
PUT  /api/seller/listings/:id               — update listing
GET  /api/seller/offers                     — received offers
GET  /api/seller/trades                     — active trades
GET  /api/seller/timeline?limit=20&cursor=  — cursor-paginated timeline
```

### Buyer
```
GET  /api/buyer/listings                    — buyer's buy listings
POST /api/buyer/listings                    — post buy listing
GET  /api/buyer/orders                      — active orders
GET  /api/buyer/orders/:id                  — order detail
POST /api/buyer/orders/:id/sellers          — add sellers to trade
```

### Trade Operations
```
GET  /api/trade-operations                  — all trades (admin)
GET  /api/trade-operations/:id              — trade detail
POST /api/trade-operations/:id/phase        — advance phase
GET  /api/trade-operations/:id/escrow       — escrow status
POST /api/trade-operations/:id/dispute      — raise dispute
```

### Inspections
```
GET  /api/inspections/active                — inspector's active mission
GET  /api/inspections/missions?status=      — inspector's missions by status
POST /api/inspections/:id/results           — submit inspection results
```

### Escrow
```
GET  /api/escrow/:tradeId                   — escrow state for trade
POST /api/escrow/:tradeId/release           — admin: release funds
POST /api/escrow/:tradeId/dispute           — admin: raise dispute
POST /api/escrow/:tradeId/resolve           — admin: resolve dispute
```

### Notifications
```
POST /api/notifications/token               — register Expo push token
GET  /api/notifications                     — notification history
```

---

## Database Connection

```
DATABASE_URL=postgresql://...?connect_timeout=5&pool_timeout=5
```

**Critical:** The `connect_timeout` and `pool_timeout` params prevent silent hangs if DB is unreachable on startup. Without them, the app boots but never responds → Railway 502.

---

## Railway Configuration

```yaml
Service name:   agro-trade-native
Project:        agro-trade-backend
rootDirectory:  /backend
Builder:        DOCKERFILE (uses backend/Dockerfile)
startCommand:   sh -c 'npx prisma migrate deploy && node --unhandled-rejections=strict /app/dist/main.js 2>&1'
```

**NEVER use `exec node`** in startCommand — it replaces the shell process and Railway silently loses track of the container → 502. Always use `sh -c '... node 2>&1'` pattern.

---

## Environment Variables (Full List)

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db?connect_timeout=5&pool_timeout=5

# Auth
PRIVY_APP_ID=cmieakfr201g9jo0cwewfvsgi
PRIVY_APP_SECRET=<secret>

# Blockchain (set after contract deployment)
ESCROW_CONTRACT_ADDRESS=<deployed AgroEscrow address>
BLOCKCHAIN_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
ADMIN_WALLET_PRIVATE_KEY=<admin wallet private key>
ADMIN_WALLET_ADDRESS=<admin wallet public address>
CUSD_TOKEN_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1

# App
NODE_ENV=production
PORT=  ← DO NOT SET — Railway injects dynamically
```

---

## Building Locally

```bash
cd backend
npm install
npm run build          # compiles TypeScript → dist/
npm run start:dev      # watch mode with hot reload
npm run start:prod     # runs compiled dist/main.js
```

## Prisma

```bash
npx prisma migrate dev       # apply migrations locally
npx prisma migrate deploy    # apply in production (CI/Railway)
npx prisma studio            # visual DB browser
npx prisma generate          # regenerate client after schema change
```

---

## Coding Patterns

### Guards
Every authenticated route uses `@UseGuards(AuthGuard)`. The guard populates `req.user.id`.

### DTOs
All request bodies validated with class-validator decorators. Response DTOs use `@ApiProperty()` for Swagger docs.

### Error Handling
```typescript
throw new NotFoundException('Trade not found')
throw new BadRequestException('Cannot dispute at this phase')
throw new UnauthorizedException('Not your trade')
```

### Swagger
Auto-generated at `GET /api/docs` in development. OpenAPI spec exported to `backend/openapi/`.
