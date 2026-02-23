# Agro-Trade

B2B agricultural commodity trading platform. Digitizes the supply chain from farmer to buyer — matching, negotiations, inspections, transport, and settlement.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL |
| Cache | Redis |
| Auth | JWT + OAuth (Google, Privy) |
| Admin Dashboard | React + Vite (port 5173) |
| Mobile App | React Native + Expo |
| Deployment | Railway (backend), TestFlight (mobile) |

## Structure

```
agro-trade-native/
├── backend/               # NestJS API (port 4000)
│   ├── prisma/            # Schema (33 models) + migrations
│   └── src/
│       └── modules/       # buyer, seller, trade-operations, negotiations,
│                          # inspections, transport, auth, users
├── admin-dashboard/       # React/Vite operations console
│   └── src/
│       ├── features/      # Domain features (trade-ops, transport, matching)
│       ├── pages/         # Route-level components
│       └── services/      # API integration
├── front-end/             # React Native (Expo) customer app
│   └── app/               # File-based routing
├── rules/                 # Enforced coding standards
│   ├── backend/           # NestJS patterns, DTOs, testing
│   └── frontend/          # Components, state, design system
└── docs/
    ├── ARCHITECTURE.md    # User roles, trade flow, data model, API endpoints
    └── reference/
        └── db-schema.md   # 33 Prisma models summary
```

## User Roles

| Role | Description |
|------|-------------|
| **Seller (Farmer)** | Lists products, receives/negotiates offers, schedules inspections |
| **Buyer** | Creates buy requests, reviews matched sellers, tracks operations |
| **Transporter** | Views available jobs, submits bids, executes deliveries |
| **Inspector** | Accepts assignments, performs quality checks, submits pass/fail |
| **Admin** | Creates trade operations, matches sellers, manages full lifecycle |

## Trade Flow

```
Buyer creates request → Admin creates TradeOperation → Admin matches sellers
→ Sellers negotiate (accept/reject/counter) → Inspection → Transport bidding
→ Transport execution → Delivery confirmation → Complete
```

9 phases: INITIATION → SELLER_MATCHING → SELLER_NEGOTIATION → INSPECTION_PENDING → TRANSPORT_MATCHING → TRANSPORT_BIDDING → IN_TRANSIT → DELIVERED → COMPLETED

See `docs/ARCHITECTURE.md` for complete flow diagrams, API endpoints, and data model.

## Quick Start

```bash
# Backend
cd backend
npm install
npm run start:dev          # → http://localhost:4000

# Admin Dashboard
cd admin-dashboard
npm install
npm run dev                # → http://localhost:5173

# Mobile
cd front-end
npm install
npx expo start
```

**Prerequisites:** Node.js 20+, PostgreSQL, Redis

## Key API Endpoints

| Role | Endpoint | Purpose |
|------|----------|---------|
| Seller | `POST /api/seller/listings` | Create sale listing |
| Seller | `POST /api/negotiations/:id/accept` | Accept offer |
| Buyer | `POST /api/buyer/listings` | Create buy request |
| Transport | `POST /api/transport/bids` | Submit bid |
| Inspector | `POST /api/inspections/:id/results` | Submit results |
| Auth | `POST /api/auth/privy/login` | Login (all roles) |

## Database

33 Prisma models. Core entities: User, Product, SaleListing, BuyListing, TradeOperation, TradeSeller, OfferNegotiation, InspectionRequest, TransportRequest, TransportBid, TransportJob.

See `docs/reference/db-schema.md` for full model list.

## Rules

Enforced coding standards in `rules/`:
- `rules/backend/` — NestJS modules, DTOs, services, testing patterns
- `rules/frontend/` — Components, state management, design system

Read these before any code changes.
