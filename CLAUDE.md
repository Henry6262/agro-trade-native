# CLAUDE.md — agro-trade-native

> Read `~/Documents/Gazillion-dollars/AGENTS.md` first.

## What it is

agro-trade-native is an agricultural commodity escrow platform on Celo. Connects truckers and
commodity buyers via mobile-first escrow using Celo cUSD. Directed at real-world users, not crypto
natives. 37 passing Foundry tests. Independent from the AI/Web3 gaming lane.

## Status

- Stage: active, pre-pilot
- Stack: NestJS (backend), React Native Expo (mobile), Foundry (contracts), Privy, Celo cUSD
- Open critical path: deploy to Celo Sepolia + find one pilot trucker/buyer

## Tech stack

- Backend: NestJS — 205 TS files
- Mobile: React Native Expo — 574 TS files
- Contracts: Foundry + Solidity (Celo chain)
- Stablecoin: Celo cUSD (18 decimals)
- Auth: Privy

## Project layout

```
agro-trade-native/
├── backend/          → NestJS API (205 TS files)
├── contracts/        → Foundry (Solidity, Celo) — 37 passing tests
├── contracts-solana/ → Solana contracts (secondary)
├── admin-dashboard/  → Admin UI (verify connection to backend before touching)
└── [mobile]          → React Native Expo (check root for app dir)
```

## Docs in repo

`00-PROJECT-STATUS`, `02-BACKEND` and others at root — read before touching anything.

## Invariants

- Escrow release requires delivery confirmation from both parties.
- cUSD amounts use 18 decimals — never truncate or round.
- All contract changes require new Foundry tests before deploy.

## Next moves

1. `forge test` — confirm all 37 tests pass
2. Deploy contracts to Celo Sepolia
3. Find one pilot trucker/buyer
4. Do not add features before the pilot confirms the flow

## Strategic expansion: Project Grain Sovereign (EU Regulatory Track)

A parallel regulatory strategy is being developed to position AgroTrade as a **Digital Public Infrastructure (DPI)** provider under EU agrifood regulation (Data Act, CEADS, EBSI, AI Act). This is **not** a product feature track — it is an institutional partnerships and compliance layer that runs alongside the core escrow MVP.

### Relevant docs
- `docs/eu-strategy/2026_REGULATORY_MASTERPLAN.md` — Four-pillar strategy and funding calendar
- `docs/eu-strategy/EBSI_TRUSTED_ISSUER_FR_DE_ROADMAP.md` — France–Germany cross-border grain inspection credential roadmap

### Invariant
- Grain Sovereign work is capped at 40 % of sprint capacity until AgroTrade has a confirmed paying pilot.
- No AI product features (e.g., voice-AI in the mobile app) ship to production before sandbox certification.
- EBSI integration is backend-only; mobile UX remains unchanged unless explicitly greenlit.

## Gotchas

- This is NOT on the AI/Web3 gaming lane. Don't force AI or token framing onto it.
- This is a real-world payments product — correctness over speed.
- admin-dashboard may be disconnected from backend — verify with `ls` before editing.

## Definition of done

- [ ] `forge test` passes (37+ tests)
- [ ] Celo Sepolia deploy successful with verified contract
- [ ] CLAUDE.md updated if stale

## What NOT to do

- Don't deploy to Celo mainnet before the pilot confirms the flow.
- Don't add AI features — wrong product lane.
- Don't change escrow logic without Foundry tests.

## Last updated

2026-05-02
