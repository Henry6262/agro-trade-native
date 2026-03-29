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
- **KYC:** Privy-powered identity verification at onboarding. Google OAuth + JWT for seamless auth. Admin can freeze accounts.
- **KYT:** Every transaction logged as a `TradeEvent` with blockchain tx hash, actor role, timestamp, and metadata. Full audit trail from escrow creation to settlement.
- **AML:** Trade amount thresholds configurable per jurisdiction. Suspicious activity flagged via admin dashboard. All escrow movements require admin authorization (custodial model = built-in AML gating).
- **Travel Rule:** Every `TradeEvent` record captures originator (buyer), beneficiary (seller), amounts, and purpose (trade operation ID). Compliant data available for VASP-to-VASP information sharing.

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

1. **Production-ready, not a concept** — Backend deployed on Railway, mobile app feature-complete, 53+ tests passing, real trade lifecycle working end-to-end
2. **Dual-chain escrow** — Celo for low-cost emerging markets, Solana for institutional throughput. Same backend, same API, chain-agnostic escrow service.
3. **Non-crypto-native UX** — Farmers and buyers never touch wallets or gas fees. Custodial model abstracts all blockchain complexity.
4. **Full trade lifecycle** — Not just payments. Inspection, transport, GPS tracking, quality scoring, dispute resolution — all on-chain auditable.
5. **Compliance by design** — KYC/KYT/AML/Travel Rule baked into every transaction, not bolted on.

## Scalability & Adoption

- **Bulgaria first** → Balkans → EU cross-border → Global emerging markets
- **Multi-commodity:** Currently wheat, corn, sunflower — extensible to any agricultural commodity
- **Institutional path:** Custodial model means banks and trading houses can integrate without exposing clients to crypto UX
- **SIX data integration ready:** FX rates and commodity prices can feed directly into the pricing and negotiation engine

## Links

- **GitHub:** https://github.com/Henry6262/agro-trade-native
- **Backend (Live):** Railway deployment
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
