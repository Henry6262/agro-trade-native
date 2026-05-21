# Softstack Meeting Brief
**StableHacks 2026 | 30-minute sponsor meeting | AgroTrade**

---

## Objective

Use the meeting to get:

1. A direct technical read on AgroTrade's current architecture
2. Feedback on the highest-risk security and custody assumptions
3. Clarity on what would need to change before the project is realistically audit-ready
4. A concrete follow-up path after Demo Day

This is not a sales call. It is a sponsor-facing technical gut check.

---

## One-Line Positioning

> AgroTrade is a compliance-aware, dual-chain stablecoin escrow platform for agricultural commodity trading, combining mobile-first operations with controlled on-chain settlement on Celo and Solana.

---

## 90-Second Founder Pitch

> We built AgroTrade, a mobile-first escrow infrastructure for agricultural commodity trading.
>
> The problem is that agricultural trade still runs on trust, paper, delayed settlement, and fragmented operations between farmers, buyers, transporters, inspectors, and administrators.
>
> Our solution is a compliance-aware trade lifecycle with stablecoin escrow. We connect those participants in one platform and enforce the flow from trade initiation through delivery and settlement.
>
> On-chain, we use a custodial escrow model. On Celo we support cUSD for mobile-first markets, and on Solana we built a USDC escrow program in Anchor for institutional-grade settlement rails.
>
> The point is not speculative DeFi. The point is programmable settlement with auditability, operational control, and a path toward institutional adoption.
>
> What we want from Softstack is blunt feedback on where the architecture is strong, where the trust boundaries are weak, and what would need to change before this is something you would consider audit-worthy.

---

## What Is Actually Built

- Mobile app flows for the main operating roles
- Backend trade lifecycle and orchestration layer
- Celo escrow contract in Solidity with Foundry tests
- Solana escrow program in Anchor with a mirrored escrow state machine
- Admin-gated operating model for escrow creation, release, and dispute handling

Use `working MVP` or `implemented prototype`.

Do not use `production-ready` unless the conversation explicitly narrows to a specific component that is already hardened.

---

## Architecture, Explained Simply

### On-chain
- Escrow state
- Fund locking
- Release flow
- Dispute flow
- Refund / resolution flow

### Off-chain
- Identity and role management
- Trade matching and workflow orchestration
- Inspection metadata and logistics flow
- Notifications
- Admin operations
- Compliance records and trade event history

### Why this split
- Blockchain is the settlement and trust layer
- Backend is the operational and compliance layer

---

## Direct Answers To Likely Questions

### What exactly is on-chain?
> The escrow state machine and fund movement logic are on-chain. On Solana, the Anchor program handles escrow creation, fund locking, dispute state, refund, and release. Off-chain, the backend handles identity, workflow orchestration, matching, notifications, inspection data, transport coordination, and compliance records.

### What is off-chain?
> Matching logic, onboarding, inspection metadata, logistics coordination, notifications, and the broader trade workflow are off-chain in the backend. The product uses chain where auditability and settlement guarantees matter most.

### Who can move funds?
> The current model is a controlled custodial workflow. On Solana, the program controls the vault through PDA-owned accounts and permissioned instruction flow. On the product side, the admin or compliance layer is intentionally part of the operating model because the target users are not crypto-native and the institutional path requires oversight.

### Why custodial?
> Because the real users are farmers, buyers, inspectors, and transport operators, not crypto-native users. If every participant had to manage wallets, gas, recovery, and signatures, adoption would collapse. The custodial model lets us abstract that complexity while preserving blockchain settlement and auditability.

### Why Solana?
> Solana gives us fast settlement, mature USDC rails, and a clean token-account model for controlled asset flows. It fits the institutional settlement side of the product better than relying only on a lower-throughput manual settlement model.

### Why dual-chain?
> Celo fits mobile-first and lower-friction usage in emerging-market contexts. Solana fits USDC-denominated institutional settlement corridors. The backend is designed to be chain-agnostic so the settlement rail can follow the corridor and user type.

### What is the biggest current risk?
> The biggest risk is not whether the use case is real. It is whether the custody model, authority boundaries, and off-chain/on-chain reconciliation are simplified enough before audit. That is the kind of feedback we want from Softstack.

### What would we want audited first?
> First the escrow state machine and fund movement permissions. Second the dispute and refund paths. Third the admin transfer and authority boundaries. Fourth the assumptions between backend state and on-chain state.

### How do we talk about compliance?
> We designed the product around a compliance-aware operating model rather than pretending compliance does not exist. Identity, admin-gated flows, audit trails, and trade records are part of the system design. We should not claim full regulatory coverage yet, but the architecture is intentionally structured so those controls can plug in cleanly.

---

## Questions To Ask Softstack

Ask these exactly:

1. `If you were reviewing this for audit readiness, what would worry you first?`
2. `Do you think our custody and authority model is reasonable, or would you redesign it?`
3. `Where are we carrying too much complexity too early?`
4. `What would you simplify before a real audit?`
5. `What top three changes would make this much more institution-ready?`
6. `What would make you take a project like this seriously as more than a hackathon prototype?`

---

## What Not To Claim

Do not say:

- `fully compliant`
- `production-ready`
- `audit-ready`
- `live institutional pilot`
- `deployed and battle-tested` unless you can show exact links and proof

Prefer:

- `working MVP`
- `implemented prototype`
- `tested escrow logic`
- `compliance-aware architecture`
- `needs hardening before audit`

---

## Closing Ask

> This is exactly the kind of feedback we wanted. After Demo Day, I can send you the repo, a short architecture summary, and the fund-flow diagrams. If you are open to it, I would value your view on what it would take to make this audit-ready.

---

## Tone

- Technical
- Direct
- Honest about what is implemented
- Honest about what is not hardened yet
- No hype
- No crypto-bro language

That tone will land better with Softstack than ambition theatre.
