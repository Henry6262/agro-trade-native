# AgroTrade — Zurich Demo Day Presentation Draft

> **Event:** StableHacks 2026 Demo Day  
> **Date:** May 28, 2026  
> **Location:** Zurich  
> **Audience:** Tenity, AMINA Bank, Solana Foundation, institutional investors, regulators  
> **Duration:** 8 minutes pitch + 4 minutes Q&A  
> **Tone:** Technical, concrete, institutional-grade. No crypto-bro language.

---

## SLIDE 1 — Title

**AgroTrade**  
Agricultural Commodity Escrow Infrastructure  
*Mobile-first · Stablecoin-settled · Compliance-aware · EU expansion path*

**Tagline (verbal only):**  
"We are not building a DeFi protocol. We are replacing the paper-based agrifood supply chain with programmable trust."

**Speaker Notes:**  
- StableHacks Top 10. Built over 6 months. 205 backend files. 574 mobile files. 37 passing Foundry tests.
- This is not a hackathon project. This is a pre-pilot company.

---

## SLIDE 2 — The Problem (with numbers)

**Agricultural trade runs on trust — and trust is expensive.**

| Pain Point | Current State | Cost |
|-----------|--------------|------|
| Payment terms | 30–90 days after delivery | 12–18% annualized working capital cost for small farmers |
| Quality verification | Paper certificates, phone-call based | 3–5 day delays per border crossing |
| Transport matching | Informal broker networks | 15–25% margin extracted by middlemen |
| Cross-border trust | No escrow, no enforcement | 8–12% default rate on informal agrifood deals |

**The EU knows this.** The Data Act, CEADS, and EBSI exist because the Commission needs real-time agrifood data and verifiable quality credentials. **But nobody has built the infrastructure to generate them.**

**Speaker Notes:**  
- Use the Bulgaria → Germany example if pressed. A farmer near Plovdiv sells wheat to a Munich flour mill. Today that takes 4 intermediaries, 60 days, and a paper inspection certificate that could be photocopied.
- We are not solving a crypto problem. We are solving a trade finance problem.

---

## SLIDE 3 — What We Built (System Overview)

**AgroTrade connects 5 actors on a single enforceable trade lifecycle.**

```
┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌───────────┐   ┌───────┐
│ Farmer  │   │  Buyer  │   │ Transporter │   │ Inspector │   │ Admin │
└────┬────┘   └────┬────┘   └──────┬──────┘   └─────┬─────┘   └───┬───┘
     │             │               │                │             │
     └─────────────┴───────────────┴────────────────┴─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Escrow Engine   │
                    │  cUSD (Celo)      │
                    │  USDC (Solana)    │
                    └───────────────────┘
```

**Currency:** Stablecoin only. cUSD on Celo for mobile-native emerging markets. USDC on Solana for institutional corridors.

**Speaker Notes:**  
- All 5 roles live in one React Native app. The user picks their role at onboarding.
- Admin is not a "centralized middleman." Admin is the operational control layer, and every escrow movement requires human authorization and auditable workflow coordination.

---

## SLIDE 4 — Live Demo Teaser

**Try it now.**

```
┌─────────────────┐
│  📱 EXPO GO     │
│                 │
│  [ QR CODE ]    │
│  SCAN TO PLAY   │
│                 │
└─────────────────┘
```

**What you can do in 60 seconds:**
1. Log in as a Farmer → create a grain listing
2. Log in as a Buyer → post a buy request
3. Log in as Admin → match them, send an offer
4. Log in as Inspector → upload a quality score
5. Log in as Transporter → bid on the job

**Speaker Notes:**  
- The app demo is designed to show the full operating flow across roles.
- The objective is to demonstrate real workflow orchestration and escrow logic, not a slideware concept.

---

## SLIDE 5 — Technical Architecture (Deep Dive)

**Stack — chosen for institutional robustness, not hype.**

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Backend** | NestJS + TypeScript + Prisma + PostgreSQL | 205 files. Strict mode. Typed API contracts. |
| **Mobile** | React Native + Expo 52 + NativeWind | 574 files. One codebase, iOS + Android. Offline queue. |
| **Admin** | React + Vite + shadcn/ui | Map-based seller matching. Real-time trade ops console. |
| **Contracts (Celo)** | Solidity + Foundry | 37 tests. Custodial escrow. cUSD ERC-20. |
| **Contracts (Solana)** | Anchor + Rust + SPL Token | USDC escrow program. Token-account based control flow. |
| **Auth** | Privy (ES256 JWKS) | OAuth + email. Role-based JWT. Wallet-managed. |
| **Real-Time** | Socket.IO + Expo Push | Phase-change notifications to all connected clients. |
| **Compliance** | PostgreSQL `TradeEvent` schema | Every tx: actor, amount, on-chain hash, timestamp. Immutable. |

**Key architectural decision:**  
**Custodial escrow with admin gating.** Funds cannot move unless the trade reaches the correct phase and an admin authorizes. This is not DeFi. This is controlled trade infrastructure.

**Speaker Notes:**  
- Why Celo? Mobile-native, low-fee settlement for emerging-market usage patterns.
- Why Solana? Fast USDC-denominated settlement rails and a strong account model for controlled asset flows.

---

## SLIDE 6 — The 9-Phase State Machine

**The trade lifecycle is enforced in two places: the backend AND the blockchain.**

```
INITIATION
    ↓
SELLER_MATCHING ──→ Admin matches sellers to buyer request (map-based proximity)
    ↓
SELLER_NEGOTIATION → Admin sends offers; sellers ACCEPT / REJECT / COUNTER (48h expiry)
    ↓
INSPECTION_PENDING → Inspector visits farm, scores quality 0-100, uploads photos
    ↓
TRANSPORT_MATCHING → Admin creates transport request with pickup points
    ↓
TRANSPORT_BIDDING ─→ Transporters bid (price, trucks, timeline). 48h deadline.
    ↓
IN_TRANSIT ────────→ Trucker confirms pickup → GPS tracking → delivery
    ↓
DELIVERED ─────────→ Buyer confirms receipt
    ↓
COMPLETED ─────────→ Admin finalizes. Escrow releases.

[ Any phase → CANCELLED, except COMPLETED ]
```

**State transitions are validated:**
- Backend: NestJS service layer with Prisma enum enforcement
- On-chain: Solidity `require()` guards in `AgroEscrow.sol`

**Speaker Notes:**  
- The 48-hour expiry is enforced by a cron job in the backend. If a seller doesn't respond, the offer auto-rejects and the admin is notified to find a replacement.
- Inspection photos are stored with signed URLs. The hash of the inspection report is logged in the `TradeEvent` table.

---

## SLIDE 7 — Smart Contracts (The Trust Layer)

**Celo: `AgroEscrow.sol`**

```solidity
// Simplified core logic
enum EscrowState { CREATED, FUNDED, IN_TRANSIT, DELIVERED, COMPLETED, DISPUTED, REFUNDED }

function createEscrow(address buyer, address seller, uint256 amount) external onlyAdmin {
    // Funds move from buyer wallet → escrow contract
    // State: CREATED → FUNDED
}

function releaseEscrow(bytes32 tradeId) external onlyAdmin {
    require(state[tradeId] == EscrowState.DELIVERED, "Not delivered");
    // State: DELIVERED → COMPLETED
    // cUSD transferred to seller
}

function refundEscrow(bytes32 tradeId) external onlyAdmin {
    require(state[tradeId] == EscrowState.DISPUTED, "Not disputed");
    // State: DISPUTED → REFUNDED
    // cUSD returned to buyer
}
```

**Security properties:**
- `onlyAdmin` modifier on all fund movements
- `nominateAdmin` + `acceptAdmin` two-step transfer (no sudden rug)
- Events emitted for every state change: `EscrowCreated`, `EscrowFunded`, `EscrowReleased`, `EscrowRefunded`
- **37 Foundry tests** covering: happy path, edge cases, access control, reentrancy, integer overflow

**Solana: `agro-escrow` Anchor program**
- Identical state machine (5 states)
- `USDC` SPL Token with Token Extensions
- `admin` PDA-gated execution
- Devnet deployment workflow prepared

**Speaker Notes:**  
- The Foundry test suite is in `contracts/`. Run `forge test` — 37 tests, all green.
- We do not have a formal audit yet. What we do have is tested escrow logic and a clear picture of what must be hardened before production use.
- On Solana, the focus is controlled asset movement and explicit authority boundaries rather than speculative token design.

---

## SLIDE 8 — Compliance Architecture

**Designed for regulated operating constraints and auditability.**

| Requirement | How AgroTrade Satisfies It |
|-------------|---------------------------|
| **Identity** | Privy-powered auth and role-aware access with a path to tiered verification |
| **KYT-ready audit trail** | `TradeEvent` records with actor role, amount, timestamp, metadata, and blockchain references |
| **AML-aware controls** | Custodial model with admin authorization on escrow movements |
| **Travel Rule-ready data** | Workflow records can capture originator, beneficiary, amount, purpose, and blockchain references |
| **Custody framing** | Funds are tied to an underlying trade workflow with admin-gated release and dispute handling |

**The compliance moat:**
Most agritech platforms ignore financial compliance. We treat it as infrastructure. This opens doors to:
- Institutional buyers (they need audit trails)
- Banks (they need KYC/KYT data)
- EU funding (they need Data Act compliance)

**Speaker Notes:**  
- We did not bolt on operational controls after building the protocol. We structured the product around custody, gating, and audit trails from the start.
- The core point is that funds are tied to a real trade workflow rather than free-floating token movement.

---

## SLIDE 9 — Project Grain Sovereign (The EU Expansion)

**AgroTrade is the operational core. Grain Sovereign is the regulatory expansion.**

Four EU regulations converge in 2026–2028. We are positioning as a **Digital Public Infrastructure (DPI)** provider.

| Pillar | Regulation | What We Deliver |
|--------|-----------|-----------------|
| **Data Act** | Art. 14–22 (B2G sharing) | Read-only "Commission API" — real-time grain stock data for DG AGRI |
| **CEADS** | Common European Agricultural Data Space | Federated data node across Bulgaria, France, Germany, Romania |
| **EBSI** | European Blockchain Services Infrastructure | Freelance inspectors become **Trusted Issuers** — grain quality credentials verifiable across EU borders in <500ms |
| **AI Act** | Annex III (high-risk AI) | Voice-AI sandbox for non-literate farmers. Human oversight. Bias audit. |

**No precedent exists** for private agrifood inspectors as EBSI Trusted Issuers.
We generate the regulatory evidence that both industry and authorities need.

**Speaker Notes:**  
- Grain Sovereign is the strategic EU-facing expansion path layered on top of AgroTrade's operational core.
- The goal is to turn trade workflow data, inspection events, and escrow state into institution-usable infrastructure.

---

## SLIDE 10 — Traction & Proof Points

| Metric | Value |
|--------|-------|
| Foundry tests | **37 passing** (Celo escrow) |
| Backend scenarios | **9/10 passing** (67/67 steps) |
| Backend codebase | **205 TypeScript files** |
| Mobile codebase | **574 TypeScript files** |
| Trade phases | **9 phases, 2 terminal states** |
| Compliance layers | **4 (KYC, KYT, AML, Travel Rule)** |
| Hackathon | **StableHacks 2026 Top 10** |
| Sandbox | **Spain AgriFoodTech, submitted May 2026** |
| Spinoff | **GreenBlock @ ETHPrague 2026** (ReFi DAO on same escrow engine) |

**Speaker Notes:**  
- GreenBlock matters. It proves the escrow engine is generic. Same Solidity contracts, different frontend (regenerative agriculture + carbon credits). Modularity = scalability.

---

## SLIDE 11 — Competitive Moat

| Competitor | What They Do | Why We Win |
|-----------|-------------|-----------|
| **Tradeflow / AgriDigital** | Agritech SaaS with fiat payments | No escrow. No blockchain audit trail. No EU regulatory positioning. |
| **Centrifuge / Goldfinch** | DeFi RWA lending | Not agrifood-specific. No inspection layer. No transport matching. No compliance stack. |
| **Large agribusiness portals** (Bayer, Cargill) | Closed networks for their own supply chains | Exclude small farmers. No open inspector network. No cross-border credential verification. |
| **Stablecoin payment apps** (Valora, Beam) | Wallet + P2P transfer | No trade lifecycle. No escrow. No dispute resolution. No compliance logging. |

**Our moat:** We are the only platform that combines:
1. **Mobile-native** (farmers in rural Bulgaria can use it)
2. **Stablecoin escrow** (instant settlement, no volatility)
3. **Compliance-native** (KYC/KYT/AML/Travel Rule from day one)
4. **EU regulatory ready** (Data Act, CEADS, EBSI, AI Act alignment)

**Speaker Notes:**  
- We are not competing with DeFi lenders. We are competing with phone calls and paper.
- The incumbents move slowly on EU regulation. Our agility is the moat.

---

## SLIDE 12 — Roadmap

```
NOW ──→ JUNE 2026 ──→ Q3 2026 ──→ Q4 2026 ──→ 2027
  │         │             │             │          │
  │   Celo Sepolia    Spain Sandbox   EBSI TAO   Pilot scale
  │   deploy +        trial (5        application (BG → DE
  │   1st pilot       inspectors,     + CEADS     corridor)
  │   (trucker +      50 VCs)         federation  
  │   buyer)                          node
  │
  └── Mobile ↔ Backend integration verification
      WebSocket real-time updates
      TypeScript strict mode compliance (DONE)
```

**Speaker Notes:**  
- The critical path is: deploy to Celo Sepolia → find one pilot trucker + buyer → validate the mobile flow.
- Everything else (Grain Sovereign, EBSI, AI Act sandbox) is capped at 40% of sprint capacity until the pilot confirms the core escrow flow.

---

## SLIDE 13 — The Ask

**We are pre-pilot, not pre-product.**

**What we need:**
- **€80,000–€120,000** pre-seed to run the first pilot (Bulgaria → Germany grain corridor, 3 months)
- **Introductions** to agrifood logistics companies with cross-border routes
- **Regulatory mentorship** on FINMA registration and MiCA authorization path

**What we offer:**
- Working mobile app + backend + admin dashboard + smart contracts
- Compliance architecture that satisfies Swiss and EU regulators
- A team that ships (solo founder, 6 months, Top 10 finish)

**Contact:** founder@grainsovereign.eu  
**Demo:** Scan the QR code. Play all 5 roles.

**Closing line:**  
"We are not asking you to believe in crypto. We are asking you to believe that a farmer in Plovdiv should get paid on delivery, not 60 days later. The technology to do that exists. We built it."

---

## APPENDIX — Q&A Prep

### Q1: "How do you handle volatility?"
**A:** We use stablecoins only — cUSD (Celo) and USDC (Solana). Farmers never touch volatile assets. The admin dashboard shows amounts in fiat equivalents.

### Q2: "What if the admin is malicious?"
**A:** Three safeguards: (1) Admin cannot move funds outside the state machine — the contract enforces phase-gated releases. (2) Two-step admin transfer (`nominateAdmin` + `acceptAdmin`). (3) All actions are logged in `TradeEvent` with on-chain hashes — immutable audit trail.

### Q3: "Have you deployed to mainnet?"
**A:** Not yet. Celo Sepolia testnet is ready. We need one pilot to validate the mobile ↔ backend ↔ contract integration end-to-end before mainnet. Budget for formal audit: €8,000–€15,000.

### Q4: "How does this relate to MiCA?"
**A:** MiCA classifies asset-referenced tokens and e-money tokens. cUSD is an e-money token under MiCA. We do not issue tokens — we integrate existing regulated stablecoins. Our compliance stack (KYC, custody, audit trails) positions us as a **CASPs-compliant** settlement layer when the time comes.

### Q5: "Why would a farmer use this instead of their existing broker?"
**A:** Brokers take 15–25% margin and pay in 60 days. We charge a flat 2–3% platform fee and settle on delivery confirmation. The farmer gets more money, faster, with an enforceable contract instead of a phone-call promise.

### Q6: "What about the Solana Foundation angle?"
**A:** Solana Token Extensions let us enforce KYC/AML at the token level via transfer hooks. This is exactly what FINMA's 2024 guidance asks for: programmable compliance. Our Anchor program is devnet-ready and mirrors the Celo escrow logic.

### Q7: "Is the AI Act voice-AI thing real?"
**A:** It is a sandbox proposal. We are not shipping AI to production before certification. The Spain AgriFoodTech Sandbox will test voice-AI for non-literate farmers under human oversight, with a full bias audit. No AI features ship to the mobile app without sandbox approval.

---

*Presentation draft v1.0 — 2026-05-05*  
*Ready for PDF conversion via Claude Code*
