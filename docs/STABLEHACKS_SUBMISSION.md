# StableHacks 2026 — Submission Draft

## Project Name
**AgroTrade** — Institutional-Grade Stablecoin Infrastructure for Agricultural Commodity Trading

## Track
**RWA-Backed Stablecoin & Commodity Vaults**

## Team
- Henry (Henry6262) — Lead Developer & Architect

## Tagline
> Real commodities. Real escrow. Real compliance. Dual-chain stablecoin infrastructure connecting farmers, buyers, inspectors, and transporters across emerging markets.

---

## Problem

Agricultural commodity trading in emerging markets (starting with Bulgaria) is fragmented, opaque, and cash-heavy. Farmers get squeezed on price, buyers can't verify quality, and there's no transparent payment trail. Cross-border agricultural trade adds FX friction, settlement delays (30-90 days), and compliance gaps.

**The result:** $3.4 trillion in annual agricultural trade runs on trust, fax machines, and wire transfers — with zero transparency for regulators or participants.

## Vision

AgroTrade digitizes the entire agricultural trade lifecycle — from listing to payment — with stablecoin-powered escrow that's compliant, transparent, and instant. We don't just move money; we create a verifiable chain of custody from field to fork.

## Solution

### Full-Stack Agricultural Trading Platform
- **9-phase trade lifecycle:** Initiation → Seller Matching → Negotiation → Inspection → Transport → Delivery → Payment → Completion
- **4 user roles:** Farmers, Buyers, Transporters, Quality Inspectors
- **Admin orchestration:** Trade matching, inspector assignment, route optimization, profit calculation

### Dual-Chain Stablecoin Escrow
- **Celo (Primary):** cUSD escrow via `AgroEscrow.sol` — 37 Foundry tests passing. Optimized for low fees and mobile-first markets.
- **Solana (Secondary):** USDC escrow via Anchor program — high throughput for institutional volumes. SPL token support with PDA-based vaults.
- **Custodial model:** Admin wallet executes all on-chain calls — traders never need to own or manage crypto wallets. This is critical for agricultural markets where users are non-crypto-native.

### Compliance-First Architecture
- **Identity layer:** Privy auth at onboarding with role-aware access and JWT-backed sessions.
- **KYT-ready audit trail:** Trade and payment actions are modeled as `TradeEvent` records with actor role, timestamps, metadata, and blockchain references.
- **AML-aware operating model:** Escrow movements are admin-gated, creating a controlled settlement flow rather than open peer-to-peer transfers.
- **Travel Rule-ready data model:** Trade records capture originator, beneficiary, amount, and trade purpose so compliance data can be attached at the workflow layer.

### Real-Time Infrastructure
- **WebSocket events:** Socket.IO pushes on every trade phase change
- **Push notifications:** Expo push for mobile (iOS/Android)
- **GPS tracking:** Transport monitoring with proof-of-delivery
- **Quality inspection:** On-site photo documentation with scoring (0-100)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS + TypeScript + Prisma + PostgreSQL (Railway) |
| Mobile | React Native + Expo 52 + NativeWind |
| Web Portal | Next.js + shadcn/ui (25 pages) |
| Smart Contracts (Celo) | Solidity 0.8.20 + Foundry (37 tests) |
| Smart Contracts (Solana) | Anchor + Rust + SPL Token (USDC) |
| Auth | Privy JWT + Google OAuth |
| Payments | cUSD (Celo) + USDC (Solana) — dual-chain escrow |
| Real-time | Socket.IO + Expo Push Notifications |

## Key Differentiators

1. **Working MVP, not a concept** — Backend, mobile, and escrow flows are implemented with tested contract logic and a modeled end-to-end trade lifecycle
2. **Dual-chain escrow** — Celo for low-cost emerging markets, Solana for institutional throughput. Same backend, same API, chain-agnostic escrow service.
3. **Non-crypto-native UX** — Farmers and buyers never touch wallets or gas fees. Custodial model abstracts all blockchain complexity.
4. **Full trade lifecycle** — Not just payments. Inspection, transport, GPS tracking, quality scoring, and dispute handling sit in one operational flow.
5. **Compliance-aware by design** — Identity, audit trail, admin-gated settlement, and Travel Rule-ready records are built into the system architecture.

## Scalability & Adoption

- **Bulgaria first** → Balkans → EU cross-border → Global emerging markets
- **Multi-commodity:** Currently wheat, corn, sunflower — extensible to any agricultural commodity
- **Institutional path:** Custodial model means banks and trading houses can integrate without exposing clients to crypto UX
- **SIX data integration ready:** FX rates and commodity prices can feed directly into the pricing and negotiation engine

## Links

- **GitHub:** https://github.com/Henry6262/agro-trade-native
- **Backend:** See repo and environment setup
- **Demo credentials:** See README.md

---

## Submission Checklist

- [x] Public GitHub repository ✅
- [ ] Testnet demo / 2-min technical walkthrough video
- [ ] 2-3 min pitch video (problem, vision, solution, differentiators, team)
- [x] Solana smart contracts (Anchor escrow program)
- [x] Compliance architecture (KYC/KYT/AML/Travel Rule)

---

*Henry needs to record:*
1. **Technical walkthrough (max 2 min):** Show the app — create a trade, match a seller, negotiate, escrow locks, delivery, payment releases. Show both Celo and Solana escrow.
2. **Pitch video (max 2-3 min):** Problem → Vision → Solution → Differentiators → Team
