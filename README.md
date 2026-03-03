# AgroTrade

B2B agricultural commodity trading platform for the Bulgarian market. Connects farmers, buyers, transporters, and quality inspectors in one system.

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
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| Admin | React 19 + Vite 7 + shadcn/ui |
| Mobile | React Native + Expo 52 + NativeWind |
| Auth | JWT + Google OAuth + Privy |

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

## Project Structure

```
agro-trade-native/
├── backend/                # NestJS API (port 4000)
│   ├── prisma/             # Schema (33 models) + migrations + seed scripts
│   └── src/                # auth, buyer, seller, trade-operations, negotiations,
│                           # inspections, transport, simulation, scenarios
├── admin-dashboard/        # React/Vite operations console (port 5173)
├── front-end/              # React Native/Expo mobile app
├── docs/                   # API reference, state machines, test scenarios
└── rules/                  # Enforced coding standards (backend + frontend)
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
