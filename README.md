# AgroTrade

> Agricultural commodity escrow platform connecting farmers, buyers, transporters, and inspectors via mobile-first stablecoin settlements.

---

## Quick Start

```bash
# Backend (port 4000)
cd backend && npm install && npm run build && node dist/main.js

# Admin Dashboard (port 5173)
cd admin-dashboard && npm install && npm run dev

# Mobile App (Expo)
cd front-end && npm install && npx expo start

# Landing Page (port 3000)
cd landing && npm install && npm run dev
```

**Prerequisites:** Node.js 20+, PostgreSQL

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| Mobile | React Native + Expo 52 + NativeWind |
| Web Portal | Next.js + shadcn/ui |
| Smart Contracts (Celo) | Solidity + Foundry (37 tests) |
| Smart Contracts (Solana) | Anchor + Rust + SPL Token |
| Auth | Privy JWT + Google OAuth |
| Payments | cUSD (Celo) + USDC (Solana) — dual-chain escrow |
| Real-time | Socket.IO + Expo Push Notifications |

---

## Trade Lifecycle

```
INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING
→ TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED
```

Any phase can → CANCELLED (except COMPLETED).

---

## User Roles

| Role | What They Do |
|------|--------------|
| **Farmer** | Create listings, accept/reject/counter offers, pass inspections |
| **Buyer** | Post buy orders with specs + budget, track fulfillment |
| **Transporter** | Bid on transport jobs, GPS tracking, delivery proof |
| **Inspector** | On-site quality checks with photos, score 0-100 |
| **Admin** | Match sellers, assign inspectors, optimize routes, finalize trades |

---

## Documentation

| Doc | What It Covers |
|-----|----------------|
| [`docs/API_REFERENCE.md`](docs/API_REFERENCE.md) | Every endpoint — method, path, auth, body, response |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System overview, user journeys, data model |
| [`docs/STATE_MACHINES.md`](docs/STATE_MACHINES.md) | All state transitions — trade, negotiations, transport, inspections |
| [`docs/COMPLIANCE_ARCHITECTURE.md`](docs/COMPLIANCE_ARCHITECTURE.md) | KYC, KYT, AML, Travel Rule |
| [`docs/MASTER_ROADMAP.md`](docs/MASTER_ROADMAP.md) | MVP roadmap, issues, phases |
| [`docs/TEST_SCENARIOS.md`](docs/TEST_SCENARIOS.md) | 10 simulation scenarios with exact API call sequences |
| [`docs/eu-strategy/`](docs/eu-strategy/) | Project Grain Sovereign — EU regulatory track (Data Act, CEADS, EBSI, AI Act) |

---

## Project Structure

```
agro-trade-native/
├── backend/           # NestJS API (port 4000)
│   ├── prisma/        # Schema + migrations + seed
│   └── src/           # auth, trade, escrow, inspections, transport
├── contracts/         # Celo escrow (Foundry, 37 tests)
├── contracts-solana/  # Solana escrow (Anchor, USDC)
├── front-end/         # React Native / Expo mobile app
├── landing/           # Next.js marketing site
├── admin-dashboard/   # React admin UI
├── docs/              # Architecture, API, compliance, roadmaps
├── assets/            # Screenshots, marketing images, landing sections
├── rules/             # Coding standards
├── scripts/           # Automation scripts
└── tests-e2e/         # End-to-end tests
```

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agrotrade.com | admin123 |
| Farmer | seller1@agrotrade.com | password123 |
| Buyer | buyer@agrotrade.com | password123 |

---

## Compliance

- **KYC:** Privy-powered identity + Google OAuth
- **KYT:** Every transaction logged as `TradeEvent` with blockchain tx hash
- **AML:** Custodial model — admin authorization required for all escrow movements
- **Travel Rule:** Full originator/beneficiary/amount/purpose capture per transfer

See [`docs/COMPLIANCE_ARCHITECTURE.md`](docs/COMPLIANCE_ARCHITECTURE.md).

---

## Simulation & Testing

Backend includes a `/simulation` module (admin-only) for automated end-to-end testing:

```
POST /simulation/admin/create-trade-operation
POST /simulation/admin/send-offers
POST /simulation/seller/:id/accept-offer
POST /simulation/inspector/:id/submit-results
POST /simulation/transporter/:id/submit-bid
POST /simulation/admin/complete-trade
DELETE /simulation/admin/cleanup-test-data
```

Run `forge test` in `contracts/` to verify all 37 escrow tests.

---

## Related Projects

- **GreenBlock** — ETHPrague 2026 hackathon spinoff. Regenerative agriculture DAO built on AgroTrade escrow infrastructure. See [`docs/eu-strategy/GREENBLOCK.md`](docs/eu-strategy/GREENBLOCK.md).
- **Project Grain Sovereign** — EU regulatory strategy track for Data Act, CEADS, EBSI, and AI Act alignment. See [`docs/eu-strategy/2026_REGULATORY_MASTERPLAN.md`](docs/eu-strategy/2026_REGULATORY_MASTERPLAN.md).

---

## Swagger

`http://localhost:4000/api/docs/` when backend is running.

---

*Last updated: 2026-05-04*
