# AgroTrade — Documentation Hub

> **Single source of truth** for everything in the AgroTrade native initiative.
> Start here. Every other doc links from here.

---

## What Is AgroTrade?

AgroTrade is an agricultural commodity trading platform connecting **buyers, sellers, inspectors, and transporters** for end-to-end grain/produce trades with **on-chain escrow protection via cUSD** (Celo Dollar stablecoin). Every payment locks in a smart contract and only releases when an inspector confirms delivery — automatically, no human middleman.

**Target Markets:** Balkans · Middle East · South Asia · East Asia

---

## Repository Structure

```
agro-trade-native/
├── backend/          → NestJS API — all business logic, escrow, auth, realtime
├── front-end/        → React Native / Expo app — iOS/Android for all 4 roles
├── landing/          → Next.js 16 web portal — landing page + web dashboard
├── contracts/        → Solidity smart contracts — AgroEscrow.sol (Foundry)
├── admin-dashboard/  → Standalone admin React dashboard (legacy/supplementary)
├── docs/             → THIS FOLDER — all documentation
├── rules/            → Coding standards & patterns for Claude agents
├── scripts/          → Build & utility scripts
└── .claude/          → Claude agent config, launch.json, agent identities
```

---

## Documentation Index

| # | Document | What It Covers |
|---|----------|----------------|
| [00](./00-PROJECT-STATUS.md) | **Project Status** | Current state, what's done, what's pending, release checklist |
| [01](./01-ARCHITECTURE.md) | **Architecture** | How all 5 sub-projects connect, data flows, trade lifecycle |
| [02](./02-BACKEND.md) | **Backend** | NestJS modules, REST API endpoints, auth, realtime, patterns |
| [03](./03-FRONTEND.md) | **Mobile App** | React Native structure, features per role, stores, navigation |
| [04](./04-LANDING.md) | **Web Portal** | Next.js landing page + web dashboard, routes, components |
| [05](./05-CONTRACTS.md) | **Smart Contracts** | AgroEscrow.sol — state machine, functions, deploy instructions |
| [06](./06-DATABASE.md) | **Database** | Prisma schema — all 35 models documented, relationships |
| [07](./07-DEPLOYMENT.md) | **Deployment** | Railway config, Celo deployment, env vars, release steps |

---

## Quick Reference

### Production URLs
| Service | URL |
|---------|-----|
| **Backend API** | `https://agro-trade-native-production.up.railway.app/api` |
| **Web Portal** (landing) | `http://localhost:3000` (dev) / TBD (prod) |
| **Celo Sepolia RPC** | `https://forno.celo-sepolia.celo-testnet.org` |

### Key Tech Stack
| Layer | Technology |
|-------|------------|
| Mobile | React Native + Expo 53 (New Architecture) |
| Backend | NestJS + Prisma + PostgreSQL (Railway) |
| Web | Next.js 16 + Tailwind CSS v4 + shadcn/ui |
| Realtime | Socket.IO (`@nestjs/websockets`) |
| Auth | Privy (ES256 JWKS) |
| Contracts | Solidity 0.8.20 + Foundry |
| Blockchain | Celo (Sepolia testnet → Mainnet) |
| Stablecoin | cUSD ERC-20 |
| Push | Expo Push (native fetch to Expo REST API) |
| DB | PostgreSQL via Prisma (Railway managed) |

### Critical Files to Know
```
backend/src/escrow/escrow.service.ts           — on-chain escrow calls
backend/src/trade-operations/services/         — trade lifecycle + escrow hooks
backend/src/auth/auth.service.ts               — Privy JWT (ES256)
backend/src/realtime/realtime.service.ts       — Socket.IO emitToUser
contracts/src/AgroEscrow.sol                   — the escrow contract
front-end/src/providers/NotificationProvider.tsx — push + socket integration
front-end/src/services/socketService.ts        — typed WS events
landing/app/components/dashboard/             — shared web dashboard components
```

---

## Release Blockers (as of 2026-03-23)

Three things stand between us and launch:

1. **Deploy AgroEscrow.sol** to Celo Sepolia — needs funded admin wallet
2. **Set 5 Railway env vars** — `ESCROW_CONTRACT_ADDRESS`, `BLOCKCHAIN_RPC_URL`, `ADMIN_WALLET_PRIVATE_KEY`, `ADMIN_WALLET_ADDRESS`, `CUSD_TOKEN_ADDRESS`
3. **Android EAS build** — Gradle error needs `eas build --clear-cache`

See **[07-DEPLOYMENT.md](./07-DEPLOYMENT.md)** for exact commands.

---

*Last updated: 2026-03-23*
