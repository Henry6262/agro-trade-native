# 05 — Smart Contracts

> AgroEscrow.sol — the single smart contract securing all trades.

**Location:** `contracts/`
**Toolchain:** Foundry (forge / cast / anvil) — NEVER Hardhat
**Language:** Solidity 0.8.20
**Network:** Celo (Sepolia testnet → Mainnet)
**Tests:** 37 Foundry tests, all passing

---

## Contract: AgroEscrow.sol

**Location:** `contracts/src/AgroEscrow.sol`

### Purpose
Custodial escrow for cUSD (Celo Dollar, ERC-20) payments in agricultural trades. The admin wallet executes all on-chain calls — traders never need to own or manage crypto.

### State Machine

```
                    createEscrow()
AWAITING_PAYMENT ────────────────► AWAITING_DELIVERY
                                         │
                              ┌──────────┴──────────┐
                    releaseFunds()              raiseDispute()
                              │                       │
                              ▼                       ▼
                          COMPLETE               DISPUTED
                                                    │
                                          resolveDispute() / refund()
                                                    │
                                          ┌─────────┴──────────┐
                                          ▼                     ▼
                                      COMPLETE              REFUNDED
```

### Escrow Key
Each escrow is identified by:
```solidity
bytes32 key = keccak256(abi.encodePacked(tradeId));
```
The `tradeId` is the UUID of the `TradeOperation` in the database.

### Functions

| Function | Caller | Description |
|----------|--------|-------------|
| `createEscrow(tradeId, buyer, seller, amount)` | Admin | Lock cUSD from buyer in escrow |
| `releaseFunds(key)` | Admin | Release cUSD to seller on delivery |
| `raiseDispute(key)` | Buyer, Seller, or Admin | Flag trade as disputed |
| `resolveDispute(key, releaseToBuyer)` | Admin only | Send funds to winner |
| `refund(key)` | Admin only | Return cUSD to buyer |
| `getEscrow(key)` | Anyone | Read escrow state |
| `nominateAdmin(newAdmin)` | Admin | Two-step admin handoff (step 1) |
| `acceptAdmin()` | Nominated | Two-step admin handoff (step 2) |

### Events

```solidity
event EscrowCreated(bytes32 indexed key, string tradeId, uint256 amount);
event PaymentReleased(bytes32 indexed key);
event DisputeRaised(bytes32 indexed key);
event DisputeResolved(bytes32 indexed key, address recipient, uint256 amount);
event Refunded(bytes32 indexed key);
```

### Security Patterns
- **CEI pattern** (Checks-Effects-Interactions) — state updated before external calls
- **Two-step admin handoff** — prevents accidental transfer to wrong address
- **Admin-only functions** — `resolveDispute`, `refund`, `createEscrow`, `releaseFunds`
- **Dispute by any party** — buyer, seller, OR admin can call `raiseDispute`

---

## cUSD ERC-20 Flow (approve + transferFrom)

Since the admin wallet is custodial, the flow is:

```
1. Backend calls: cusd.approve(escrowContract, amount)
   — Admin approves escrow contract to spend cUSD on behalf of buyer

2. Backend calls: escrow.createEscrow(tradeId, buyer, seller, amount)
   — Escrow contract calls cusd.transferFrom(buyer, escrowContract, amount)
   — Funds are now locked

3. On DELIVERED:
   Backend calls: escrow.releaseFunds(key)
   — Escrow contract calls cusd.transfer(seller, amount)
   — Funds released to seller
```

### cUSD Contract Addresses
| Network | Address |
|---------|---------|
| **Celo Sepolia (testnet)** | `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1` |
| **Celo Mainnet** | `0x765DE816845861e75A25fCA122bb6898B8B1282a` |

---

## Deploy Script

**Location:** `contracts/script/Deploy.s.sol`

### Deploy to Celo Sepolia

```bash
# 1. Fund admin wallet from faucet: https://faucet.celo.org

# 2. Deploy
cd contracts

PRIVATE_KEY=<admin_private_key> \
CUSD_ADDRESS=0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 \
forge script script/Deploy.s.sol:DeployAgroEscrow \
  --rpc-url https://forno.celo-sepolia.celo-testnet.org \
  --broadcast

# 3. Note the deployed address from output
# 4. Set ESCROW_CONTRACT_ADDRESS in Railway env vars
```

### Deploy to Celo Mainnet (future)
```bash
PRIVATE_KEY=<admin_private_key> \
CUSD_ADDRESS=0x765DE816845861e75A25fCA122bb6898B8B1282a \
forge script script/Deploy.s.sol:DeployAgroEscrow \
  --rpc-url https://forno.celo.org \
  --broadcast \
  --verify    # verify on Celoscan
```

---

## Network Configuration

| Network | Chain ID | RPC | Faucet |
|---------|----------|-----|--------|
| Celo Sepolia (testnet) | 44787 | `https://forno.celo-sepolia.celo-testnet.org` | https://faucet.celo.org |
| Celo Sepolia (alt) | 44787 | `https://celo-sepolia.drpc.org` | — |
| Celo Mainnet | 42220 | `https://forno.celo.org` | — |

**DEPRECATED (do not use):** Alfajores testnet — RPC endpoints no longer work.

---

## Foundry Commands

```bash
cd contracts

# Run all 37 tests
forge test

# Run with verbose output
forge test -vvv

# Run specific test
forge test --match-test testReleaseFunds

# Check gas usage
forge test --gas-report

# Local devnet
anvil --chain-id 44787    # simulates Celo

# Cast — interact with deployed contract
cast call $CONTRACT "getEscrow(bytes32)" $KEY --rpc-url $RPC_URL

# Build contracts
forge build
```

---

## foundry.toml

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"

[rpc_endpoints]
celo_sepolia = "https://forno.celo-sepolia.celo-testnet.org"
celo_mainnet = "https://forno.celo.org"
```

---

## Test Coverage

**37 tests** in `contracts/test/AgroEscrow.t.sol` covering:

- Happy path: create → release
- Dispute path: create → raise → resolve (to seller)
- Dispute path: create → raise → resolve (to buyer)
- Refund path: create → refund
- Access control: unauthorized callers rejected
- State machine: invalid transitions rejected
- Admin handoff: two-step transfer works
- Admin handoff: accepting from wrong address fails
- Edge cases: zero amounts, duplicate keys, etc.
