# AgroTrade

> **StableHacks 2026** — Track: RWA-Backed Stablecoin & Commodity Vaults

Institutional-grade stablecoin infrastructure for agricultural commodity trading. Dual-chain escrow (Celo + Solana) with full compliance architecture (KYC/KYT/AML/Travel Rule). Connects farmers, buyers, transporters, and quality inspectors in one system — starting with the Bulgarian market, scaling cross-border.

## Quick Start

```bash
# Backend (port 4000)
cd backend && npm install && npm run build && node dist/main.js

# Admin Dashboard (port 5173)
cd admin-dashboard && npm install && npm run dev

# Mobile App
cd front-end && npm install && npx expo start
```

**Prerequisites:** Node.js 20+, PostgreSQL (Railway DB configured in backend/.env)

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agrotrade.com | admin123 |
| Farmer | seller1@agrotrade.com | password123 |
| Farmer | seller2@agrotrade.com | password123 |
| Buyer | buyer@agrotrade.com | password123 |

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL (Railway) |
| Mobile | React Native + Expo 52 + NativeWind |
| Web Portal | Next.js + shadcn/ui (25 pages) |
| Smart Contracts (Celo) | Solidity 0.8.20 + Foundry (37 tests) |
| Smart Contracts (Solana) | Anchor + Rust + SPL Token (USDC) |
| Auth | Privy JWT + Google OAuth |
| Payments | cUSD (Celo) + USDC (Solana) — dual-chain escrow only. **Stripe is NOT used.** |
| Real-time | Socket.IO + Expo Push Notifications |

## Trade Lifecycle (9 Phases)

```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING
→ TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

Any phase can → CANCELLED (except COMPLETED).

## User Roles

| Role | What They Do |
|------|-------------|
| **Farmer** | Create sale listings, accept/reject/counter offers, pass inspections |
| **Buyer** | Post buy orders with specs + budget, track fulfillment |
| **Transporter** | Bid on transport jobs, manage fleet, GPS tracking, delivery proof |
| **Inspector** | Accept jobs, on-site quality checks with photos, score 0-100 |
| **Admin** | Create trades, match sellers, send offers, assign inspectors, optimize routes, calculate profit |

## Documentation

| Doc | What It Covers |
|-----|---------------|
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Every endpoint — method, path, auth, body, response, errors |
| [`docs/STATE_MACHINES.md`](docs/STATE_MACHINES.md) | All state transitions — trade phases, negotiations, transport, inspections |
| [`docs/TEST_SCENARIOS.md`](docs/TEST_SCENARIOS.md) | 10 simulation scenarios with exact API call sequences |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Product overview — user journeys, features, data model |

## Compliance Architecture

AgroTrade is built compliance-first for institutional adoption:

- **KYC:** Privy-powered identity verification, Google OAuth, admin account freeze
- **KYT:** Every transaction logged as `TradeEvent` with blockchain tx hash, actor role, and full metadata
- **AML:** Custodial model — all stablecoin movements require admin authorization. No direct user-to-user transfers.
- **Travel Rule:** Every escrow operation captures originator, beneficiary, amount, purpose, and blockchain proof

See [`docs/COMPLIANCE_ARCHITECTURE.md`](docs/COMPLIANCE_ARCHITECTURE.md) for full details.

## Project Structure

```
agro-trade-native/
├── backend/                # NestJS API (port 4000) — 23 modules, Railway deployed
│   ├── prisma/             # Schema (33 models) + migrations + seed scripts
│   └── src/                # auth, buyer, seller, trade-operations, escrow,
│                           # inspections, transport, simulation, realtime
├── contracts/              # Celo smart contracts (Foundry, 37 tests)
│   └── src/AgroEscrow.sol  # cUSD escrow — custodial model
├── contracts-solana/       # Solana smart contracts (Anchor)
│   └── programs/agro-escrow/  # USDC escrow — SPL token with PDAs
├── front-end/              # React Native/Expo mobile app
├── landing/                # Next.js web portal (25 pages)
├── docs/                   # API reference, compliance, architecture
└── rules/                  # Enforced coding standards
```

## Simulation Endpoints

The backend has a `/simulation` module (ADMIN only) for automated testing:

```
POST /simulation/admin/create-trade-operation
POST /simulation/admin/send-offers
POST /simulation/admin/farmer/:id/create-sale-listing
POST /simulation/seller/:id/accept-offer
POST /simulation/seller/:id/counter-offer
POST /simulation/seller/:id/reject-offer
POST /simulation/admin/assign-inspector
POST /simulation/inspector/:id/accept-job
POST /simulation/inspector/:id/submit-results
POST /simulation/admin/create-transport
POST /simulation/transporter/:id/submit-bid
POST /simulation/transporter/:id/start-job
POST /simulation/transporter/:id/complete-delivery
POST /simulation/admin/complete-trade
DELETE /simulation/admin/cleanup-test-data
```

See `docs/TEST_SCENARIOS.md` for complete step-by-step scenarios.

## Swagger

API docs available at `http://localhost:4000/api/docs/` when backend is running.


---

## Latest Progress Report

> **16 of 22 NI tasks completed** | Updated: 2026-03-26

See [PROGRESS_REPORT.md](./PROGRESS_REPORT.md) for detailed status of all tasks.

Tracking: [Issue #57](https://github.com/Henry6262/agro-trade-native/issues/57)
