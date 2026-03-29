# AgroTrade Escrow — Solana (Anchor)

Solana-native escrow program for AgroTrade, built with Anchor. Mirrors the existing [Celo AgroEscrow.sol](../contracts/src/AgroEscrow.sol) contract 1:1.

## Dual-Chain Architecture

AgroTrade operates on **two chains simultaneously** for the StableHacks hackathon:

| Chain | Stablecoin | Contract | Status |
|-------|-----------|----------|--------|
| **Celo** | cUSD (ERC-20) | `AgroEscrow.sol` (Foundry) | Deployed on Celo Sepolia |
| **Solana** | USDC (SPL Token) | `agro_escrow` (Anchor) | This project |

Both programs implement identical escrow logic:
- Same state machine: `AwaitingPayment → AwaitingDelivery → Complete / Disputed / Refunded`
- Same authorization model: buyer, seller, admin roles
- Same two-step admin transfer: `nominate_admin` → `accept_admin`
- Same custodial model: admin wallet executes on behalf of users

The backend determines which chain to use based on the buyer's wallet type and the trade configuration.

## Program Structure

```
programs/agro-escrow/src/
├── lib.rs              # Program entry — 8 instructions
├── state.rs            # EscrowState enum, Config PDA, Escrow PDA
├── error.rs            # Custom error codes
└── instructions/
    ├── initialize.rs       # Set up global config (admin)
    ├── nominate_admin.rs   # Nominate new admin
    ├── accept_admin.rs     # Pending admin accepts
    ├── create_escrow.rs    # Lock USDC in PDA vault
    ├── release_funds.rs    # Buyer/admin releases to seller
    ├── raise_dispute.rs    # Buyer/seller/admin disputes
    ├── resolve_dispute.rs  # Admin resolves (winner gets funds)
    └── refund.rs           # Admin refunds buyer
```

## PDA Layout

| PDA | Seeds | Purpose |
|-----|-------|---------|
| Config | `["config"]` | Global admin + pending admin |
| Escrow | `["escrow", trade_id]` | Per-trade escrow state |
| Vault | `["vault", escrow_pubkey]` | Token account holding USDC |

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools) v1.18+
- [Anchor CLI](https://www.anchor-lang.com/docs/installation) v0.30.1
- Node.js 18+

## Quick Start

```bash
# Install dependencies
npm install

# Build the program
anchor build

# Get your program ID (after first build)
solana address -k target/deploy/agro_escrow-keypair.json

# Update the program ID in:
#   - Anchor.toml  (programs.localnet / programs.devnet)
#   - programs/agro-escrow/src/lib.rs  (declare_id!)

# Run tests (starts local validator automatically)
anchor test

# Deploy to devnet
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet

# Initialize config (run migration)
anchor migrate --provider.cluster devnet
```

## USDC Addresses

| Network | Mint Address |
|---------|-------------|
| Devnet | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |
| Mainnet | `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v` |

## State Machine

```
                    createEscrow()
                         │
                         ▼
              ┌─ AwaitingDelivery ─┐
              │         │          │
    releaseFunds()  raiseDispute()  │
              │         │          │
              ▼         ▼          │
          Complete   Disputed      │
                     │      │      │
          resolveDispute() refund()│
                     │      │      │
                     ▼      ▼      │
                 Complete Refunded │
```

## Integration with Backend

The NestJS backend calls this program via `@solana/web3.js` + `@coral-xyz/anchor`:

1. **Create escrow** — When trade enters `IN_TRANSIT`, backend calls `createEscrow` with the admin wallet
2. **Release** — On `DELIVERED` confirmation, backend calls `releaseFunds`
3. **Dispute** — Any party can trigger via the API, backend forwards to `raiseDispute`
4. **Resolve** — Admin dashboard triggers `resolveDispute` or `refund`

Environment variables needed on the backend:
```
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_ADMIN_PRIVATE_KEY=<base58 private key>
AGRO_ESCROW_PROGRAM_ID=<deployed program ID>
USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

## Security Notes

- All token transfers use Anchor's CPI with PDA signer seeds — no private keys needed for vault operations
- Admin transfer requires two-step confirmation (nominate + accept) to prevent accidental transfers
- State machine enforces valid transitions — cannot skip states or double-release
- Vault token account is PDA-owned — only the program can move funds out
