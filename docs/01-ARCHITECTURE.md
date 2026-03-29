# 01 — System Architecture

> How all 5 sub-projects connect, data flows, and the full trade lifecycle.

---

## High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      USERS                                   │
│  Buyer │ Seller │ Inspector │ Transporter │ Admin            │
└────────┬────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────┐    ┌──────────────────────────────┐
│   React Native App     │    │   Next.js Web Portal         │
│   (front-end/)         │    │   (landing/)                 │
│                        │    │                              │
│  iOS + Android         │    │  Landing page + Web          │
│  All 4 role dashboards │    │  dashboard for all roles     │
│  Expo Push + Socket.IO │◄───►  Same API, same auth         │
└────────────┬───────────┘    └──────────────┬───────────────┘
             │                               │
             │  REST API + Socket.IO         │  REST API
             ▼                               ▼
┌────────────────────────────────────────────────────────────┐
│                  NestJS Backend API                         │
│                    (backend/)                               │
│                                                             │
│  Auth (Privy ES256)  │  Trade Operations  │  Escrow         │
│  Buyer / Seller      │  Inspections       │  Notifications  │
│  Transport           │  Negotiations      │  Analytics      │
│  Socket.IO Realtime  │  Traceability      │  Regions        │
└──────────┬───────────────────────┬────────────────────────┘
           │                       │
           ▼                       ▼
┌──────────────────┐    ┌──────────────────────────────────┐
│  PostgreSQL DB   │    │   Celo Blockchain                │
│  (Railway)       │    │   (Sepolia testnet)              │
│  Prisma ORM      │    │                                  │
│  35 models       │    │  AgroEscrow.sol (contracts/)     │
│                  │    │  cUSD ERC-20 stablecoin          │
└──────────────────┘    └──────────────────────────────────┘
```

---

## Sub-Project Roles

### `backend/` — The Brain
- Single NestJS monolith handling ALL business logic
- 23 modules covering every domain
- Owns all database writes via Prisma
- Owns all blockchain calls via `EscrowService` (ethers.js)
- Owns all realtime events via `RealtimeService` (Socket.IO)
- Owns all push notifications via Expo REST API (native fetch)

### `front-end/` — The Mobile Client
- React Native + Expo (SDK 53, New Architecture)
- 4 role-specific dashboard sections: Buyer, Seller, Inspector, Transporter
- Admin view for escrow management
- Connects to backend via REST (Axios) + Socket.IO
- Push notifications via Expo (`expo-notifications`)
- Auth via Privy wallet SDK

### `landing/` — The Web Client
- Next.js 16 with App Router
- Two purposes: public marketing page + web-based dashboard (same app)
- Web dashboard mirrors the mobile app — same API, same auth
- Admin-first for escrow operations (Release / Dispute buttons)
- Static-first (23/25 pages prerendered at build time)

### `contracts/` — The Trust Layer
- `AgroEscrow.sol` — the only smart contract
- Deployed on Celo (admin custodial model — users never touch crypto)
- The backend's `EscrowService` is the only caller of contract functions
- Funds flow: Buyer approves cUSD → Admin calls `createEscrow` → funds lock → Inspector confirms → Admin calls `releaseFunds`

### `admin-dashboard/` — Legacy
- Standalone React dashboard, pre-dates `landing/`
- Being superseded by `landing/dashboard/admin/`
- Keep for reference, do not develop further

---

## Trade Lifecycle (Data Flow)

```
1. DISCOVERY
   Buyer posts BuyListing ──────────► Seller sees it in Marketplace
   Seller posts SaleListing ─────────► Buyer sees it in Marketplace

2. MATCHING
   Buyer selects Sellers ────────────► TradeOperation created (status: NEGOTIATION)
   Offer created ────────────────────► Negotiation rounds begin
   Socket.IO event → all parties notified in real-time

3. AGREEMENT
   Offer accepted ───────────────────► Status: PENDING_INSPECTION
   InspectionRequest created ────────► Inspector assigned

4. INSPECTION
   Inspector travels to site
   Inspector submits results ────────► qualityScore, verificationResult
   If PASS: status → IN_TRANSIT
   If FAIL: status → DISPUTED

5. ESCROW LOCK (automatic on IN_TRANSIT)
   Backend calls AgroEscrow.createEscrow()
   cUSD locked in smart contract
   Buyer's funds protected until delivery confirmed

6. TRANSPORT
   TransportRequest created ─────────► Transporters bid
   TransportBid accepted ────────────► TransportJob created
   Status: IN_TRANSIT

7. DELIVERY
   Transporter marks delivered ──────► Status: DELIVERED
   Backend auto-calls AgroEscrow.releaseFunds()
   cUSD released to Seller automatically

8. DISPUTE (any time after INSPECTION)
   Any party raises dispute ─────────► Status: DISPUTED
   Admin reviews ────────────────────► resolveDispute(releaseToBuyer: bool)
   Funds go to winner
```

---

## Auth Flow

```
Mobile/Web App
     │
     │ Privy SDK login (wallet or social)
     ▼
Privy issues JWT (ES256, P-256 EC key)
     │
     │ Authorization: Bearer <jwt>
     ▼
NestJS AuthGuard
     │
     │ Fetches JWKS from:
     │ https://auth.privy.io/api/v1/apps/{appId}/jwks.json
     ▼
JWT verified → req.user.id set → route handler proceeds
```

**Critical:** Algorithm is `ES256` (not `RS256`). JWKS URL uses `/api/v1/apps/` path (not `.well-known/`).

---

## Realtime Events (Socket.IO)

```
Backend RealtimeService.emitToUser(userId, event, data)
     │
     ├── trade:updated       → buyer, seller when trade phase changes
     ├── trade:seller-added  → buyer when seller joins a trade
     ├── inspection:completed → buyer, seller when inspection done
     ├── offer:created       → seller when buyer creates offer
     ├── offer:updated       → both when negotiation round progresses
     └── notification:new    → any user for push-equivalent in-app alerts
```

Front-end listens via `socketService.ts` with typed `SocketEventPayloads` interface.

---

## Environment Summary

| Env | Backend | Blockchain | DB |
|-----|---------|------------|-----|
| Local dev | `http://localhost:4000` | Celo Sepolia (testnet) | Local Postgres |
| Staging/Prod | `https://agro-trade-native-production.up.railway.app` | Celo Sepolia (testnet) | Railway Postgres |
| Mainnet (future) | Same Railway | Celo Mainnet | Same Railway |

---

## Key Dependencies

| Package | Purpose | Where used |
|---------|---------|------------|
| `@nestjs/*` | Framework | `backend/` |
| `prisma` | ORM | `backend/` |
| `ethers` | Blockchain calls | `backend/src/escrow/` |
| `socket.io` | Realtime server | `backend/src/realtime/` |
| `expo` ~53 | Mobile runtime | `front-end/` |
| `@privy-io/expo` | Mobile auth | `front-end/` |
| `@privy-io/react-auth` | Web auth | `landing/` |
| `next` 16.1.6 | Web framework | `landing/` |
| `tailwindcss` v4 | Styling | `landing/` |
| `forge` (Foundry) | Contracts | `contracts/` |
