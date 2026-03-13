# On-Chain Vault & Escrow System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the existing `AgroEscrow.sol` contract to Celo Alfajores testnet, wire it into the trade lifecycle so funds auto-lock on `IN_TRANSIT` and auto-release on `DELIVERED`, and surface escrow status in buyer, seller, and inspector dashboards.

**Architecture:** Fully custodial model — the backend admin wallet calls all contract functions on behalf of users. No crypto wallet required from users. Escrow state machine is driven by trade phase transitions in `updateTradePhase()`. Celo is used for EVM compatibility, near-zero fees, and Africa-first alignment.

**Tech Stack:**
- Smart contract: Solidity ^0.8.20, Foundry (forge + cast)
- Chain: Celo Alfajores testnet (chainId 44787) → Celo mainnet (chainId 42220)
- Backend: NestJS + ethers.js v6 (already installed) + Prisma
- Frontend: React Native + existing `EscrowStatusCard` component

---

## File Map

### New Files
| File | Purpose |
|---|---|
| `contracts/foundry.toml` | Foundry project config |
| `contracts/src/AgroEscrow.sol` | Updated contract (allow admin to raiseDispute + resolveDispute in ABI) |
| `contracts/test/AgroEscrow.t.sol` | Foundry tests |
| `contracts/script/Deploy.s.sol` | Foundry deployment script |

### Modified Files
| File | Change |
|---|---|
| `backend/src/escrow/escrow.service.ts` | Fix ABI (resolveDispute), add `resolveDispute()` method, add `getOrCreate()` helper |
| `backend/src/trade-operations/services/trade-operation.service.ts` | Hook `updateTradePhase()` to auto-create/release/dispute escrow |
| `backend/src/escrow/escrow.controller.ts` | Add `POST /:id/resolve` endpoint |
| `backend/src/escrow/dto/escrow.dto.ts` | Add `ResolveDisputeDto` |
| `backend/.env` (local) + Railway | Add `ESCROW_CONTRACT_ADDRESS`, `BLOCKCHAIN_RPC_URL`, `ADMIN_WALLET_PRIVATE_KEY` |
| `front-end/src/features/dashboard/screens/buyer/BuyerOrdersTab.tsx` | Embed `EscrowStatusCard` when trade in IN_TRANSIT+ |
| `front-end/src/features/dashboard/screens/seller/SellerTradesTab.tsx` | Embed `EscrowStatusCard` |
| `front-end/src/features/dashboard/screens/inspector/` | Add release/dispute actions |

---

## Chunk 1: Smart Contract

### Task 1: Foundry project setup

**Files:**
- Create: `contracts/foundry.toml`
- Create: `contracts/src/AgroEscrow.sol`
- Move: `contracts/AgroEscrow.sol` → `contracts/src/AgroEscrow.sol`

- [ ] **Step 1: Initialize Foundry project inside `contracts/`**

```bash
cd contracts
forge init --no-git --no-commit .
```

This creates `src/`, `test/`, `script/`, `lib/`, `foundry.toml`. The `--no-git` flag avoids creating a nested git repo (we're already in one).

- [ ] **Step 2: Move the existing contract into `src/`**

```bash
cp contracts/AgroEscrow.sol contracts/src/AgroEscrow.sol
rm contracts/AgroEscrow.sol
```

- [ ] **Step 3: Update `contracts/foundry.toml`**

Replace the default content with:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.20"
optimizer = true
optimizer_runs = 200

[rpc_endpoints]
celo_alfajores = "https://alfajores-forno.celo-testnet.org"
celo_mainnet = "https://forno.celo.org"
```

- [ ] **Step 4: Update `contracts/src/AgroEscrow.sol` — allow admin to raiseDispute**

The current contract only lets `buyer` or `seller` call `raiseDispute`. Since we use a custodial admin wallet, admin must be able to call it too.

Change line:
```solidity
// BEFORE
require(msg.sender == e.buyer || msg.sender == e.seller, "Not a party");

// AFTER
require(msg.sender == e.buyer || msg.sender == e.seller || msg.sender == admin, "Not authorized");
```

- [ ] **Step 5: Compile and confirm no errors**

```bash
cd contracts && forge build
```

Expected output: `Compiler run successful!` — no warnings on the main contract.

- [ ] **Step 6: Commit**

```bash
git add contracts/
git commit -m "feat: initialize Foundry project and move AgroEscrow.sol to src/"
```

---

### Task 2: Write Foundry tests

**Files:**
- Create: `contracts/test/AgroEscrow.t.sol`

`★ Insight` — Foundry tests are written in Solidity itself. `vm.prank(addr)` makes the next call come from `addr`. `vm.deal(addr, amount)` sets an address's ETH balance. This lets you test the full permission matrix without a JS harness.

- [ ] **Step 1: Create `contracts/test/AgroEscrow.t.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AgroEscrow.sol";

contract AgroEscrowTest is Test {
    AgroEscrow public escrow;
    address public admin;
    address payable public buyer;
    address payable public seller;
    bytes32 public key;

    function setUp() public {
        admin = address(this); // test contract is admin
        buyer = payable(makeAddr("buyer"));
        seller = payable(makeAddr("seller"));
        escrow = new AgroEscrow();
        key = keccak256(abi.encodePacked("trade-001"));
        vm.deal(buyer, 10 ether);
    }

    function test_createEscrow_locksValue() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");

        (, , uint256 amount, AgroEscrow.State state, ) = escrow.getEscrow(key);
        assertEq(amount, 1 ether);
        assertEq(uint(state), uint(AgroEscrow.State.AWAITING_DELIVERY));
        assertEq(address(escrow).balance, 1 ether);
    }

    function test_createEscrow_revertsIfDuplicate() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");

        vm.prank(buyer);
        vm.expectRevert("Escrow already exists");
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");
    }

    function test_releaseFunds_toSeller() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");

        uint256 sellerBefore = seller.balance;
        escrow.releaseFunds(key); // admin calls (test contract = admin)

        assertEq(seller.balance, sellerBefore + 1 ether);
        (, , , AgroEscrow.State state, ) = escrow.getEscrow(key);
        assertEq(uint(state), uint(AgroEscrow.State.COMPLETE));
    }

    function test_releaseFunds_revertsIfNotAdmin() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");

        address random = makeAddr("random");
        vm.prank(random);
        vm.expectRevert();
        escrow.releaseFunds(key);
    }

    function test_raiseDispute_byAdmin() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");

        // admin raises dispute
        escrow.raiseDispute(key);

        (, , , AgroEscrow.State state, ) = escrow.getEscrow(key);
        assertEq(uint(state), uint(AgroEscrow.State.DISPUTED));
    }

    function test_resolveDispute_releasesToSeller() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");
        escrow.raiseDispute(key);

        uint256 sellerBefore = seller.balance;
        escrow.resolveDispute(key, false); // false = release to seller

        assertEq(seller.balance, sellerBefore + 1 ether);
    }

    function test_resolveDispute_refundsToBuyer() public {
        vm.prank(buyer);
        escrow.createEscrow{value: 1 ether}(key, seller, "trade-001");
        escrow.raiseDispute(key);

        uint256 buyerBefore = buyer.balance;
        escrow.resolveDispute(key, true); // true = refund to buyer

        assertEq(buyer.balance, buyerBefore + 1 ether);
    }
}
```

- [ ] **Step 2: Run tests**

```bash
cd contracts && forge test -v
```

Expected: `5 tests passed`, 0 failed.

- [ ] **Step 3: Commit**

```bash
git add contracts/test/
git commit -m "test: add Foundry tests for AgroEscrow state machine"
```

---

### Task 3: Deploy to Celo Alfajores

**Files:**
- Create: `contracts/script/Deploy.s.sol`

`★ Insight` — `forge script` with `--broadcast` actually sends transactions. With `--verify`, Foundry also submits the source to the block explorer automatically. Celo Alfajores faucet gives 1 CELO per request which is enough for many deployments at ~$0.001/tx.

- [ ] **Step 1: Get Alfajores testnet CELO**

Go to: https://faucet.celo.org/alfajores
Enter your admin wallet address → receive 1 CELO.

If you don't have an admin wallet yet, generate one:
```bash
cast wallet new
```
Save the private key and address. This will be `ADMIN_WALLET_PRIVATE_KEY` in Railway.

- [ ] **Step 2: Create `contracts/script/Deploy.s.sol`**

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AgroEscrow.sol";

contract DeployAgroEscrow is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        AgroEscrow escrow = new AgroEscrow();
        console.log("AgroEscrow deployed to:", address(escrow));
        console.log("Admin:", escrow.admin());

        vm.stopBroadcast();
    }
}
```

- [ ] **Step 3: Deploy**

```bash
cd contracts
PRIVATE_KEY=<your_admin_wallet_private_key> forge script script/Deploy.s.sol \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --broadcast \
  -vvv
```

Expected output:
```
AgroEscrow deployed to: 0x...
Admin: 0x...  (your wallet)
```

Save the contract address — you'll need it for `ESCROW_CONTRACT_ADDRESS`.

- [ ] **Step 4: Smoke test with cast**

```bash
# Verify admin is set correctly
cast call <CONTRACT_ADDRESS> "admin()" \
  --rpc-url https://alfajores-forno.celo-testnet.org
```

Expected: your wallet address.

- [ ] **Step 5: Commit**

```bash
git add contracts/script/
git commit -m "feat: add Foundry deployment script for AgroEscrow"
```

---

## Chunk 2: Backend Integration

### Task 4: Fix escrow.service.ts ABI and add resolveDispute

**Files:**
- Modify: `backend/src/escrow/escrow.service.ts`
- Modify: `backend/src/escrow/dto/escrow.dto.ts`

`★ Insight` — The current ABI in `escrow.service.ts` is missing `resolveDispute`. Also the `escrows()` getter returns a struct — in ethers.js v6, you access struct fields by name (e.g., `result.state`) rather than by index. The existing `getStatus()` code uses index-based access which is fragile.

- [ ] **Step 1: Update the ABI in `escrow.service.ts`**

Replace the `ESCROW_ABI` constant:

```typescript
const ESCROW_ABI = [
  "function createEscrow(bytes32 key, address payable seller, string calldata tradeId) external payable",
  "function releaseFunds(bytes32 key) external",
  "function raiseDispute(bytes32 key) external",
  "function resolveDispute(bytes32 key, bool releaseToBuyer) external",
  "function getEscrow(bytes32 key) external view returns (address buyer, address seller, uint256 amount, uint8 state, string tradeId)",
  "event EscrowCreated(bytes32 indexed key, string tradeId, uint256 amount)",
  "event PaymentReleased(bytes32 indexed key)",
  "event DisputeRaised(bytes32 indexed key)",
  "event DisputeResolved(bytes32 indexed key, address recipient, uint256 amount)",
  "event Refunded(bytes32 indexed key)",
];
```

Note: changed from `escrows(bytes32)` mapping to `getEscrow(bytes32)` — the contract has an explicit getter that's cleaner than the auto-generated mapping getter.

- [ ] **Step 2: Fix `getStatus()` to use named return values and `getEscrow`**

Replace the `getStatus` method:

```typescript
async getStatus(tradeOperationId: string) {
  const ethers = await import("ethers");
  const contract = await this.getContract();
  const key = ethers.id(tradeOperationId);
  const result = await contract.getEscrow(key);

  const states = ["AWAITING_PAYMENT", "AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "REFUNDED"];

  return {
    tradeOperationId,
    buyer: result[0],
    seller: result[1],
    amountWei: result[2].toString(),
    state: states[Number(result[3])] ?? "UNKNOWN",
    tradeId: result[4],
  };
}
```

- [ ] **Step 3: Add `resolveDispute()` method to `EscrowService`**

Add after `raiseDispute()`:

```typescript
async resolveDispute(tradeOperationId: string, releaseToBuyer: boolean) {
  const ethers = await import("ethers");
  const contract = await this.getContract();
  const key = ethers.id(tradeOperationId);
  const tx = await contract.resolveDispute(key, releaseToBuyer);
  await tx.wait();
  this.logger.log(`Dispute resolved for trade ${tradeOperationId}: ${tx.hash} (buyer refund: ${releaseToBuyer})`);

  await this.prisma.tradeEvent.create({
    data: {
      tradeOperationId,
      eventType: "PAYMENT_RELEASED",
      actorRole: "ADMIN",
      blockchainTxHash: tx.hash,
      metadata: { resolvedToBuyer: releaseToBuyer },
    },
  });

  return { txHash: tx.hash };
}
```

- [ ] **Step 4: Add `ResolveDisputeDto` to `escrow.dto.ts`**

```typescript
export class ResolveDisputeDto {
  releaseToBuyer: boolean;
}
```

- [ ] **Step 5: Add `POST /:id/resolve` to `escrow.controller.ts`**

```typescript
@Post(":tradeOperationId/resolve")
@Roles("ADMIN")
@ApiOperation({ summary: "Resolve a disputed escrow — release to seller or refund buyer" })
async resolveDispute(
  @Param("tradeOperationId") tradeOperationId: string,
  @Body() dto: ResolveDisputeDto,
) {
  return this.escrowService.resolveDispute(tradeOperationId, dto.releaseToBuyer);
}
```

- [ ] **Step 6: Build to verify no TS errors**

```bash
cd backend && npm run build
```

Expected: builds without errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/escrow/
git commit -m "feat: fix escrow ABI, add resolveDispute endpoint"
```

---

### Task 5: Wire escrow into trade phase transitions

**Files:**
- Modify: `backend/src/trade-operations/services/trade-operation.service.ts`

`★ Insight` — The key design decision here is **non-blocking fire-and-forget for blockchain calls**. Blockchain transactions take 2-5 seconds. If we `await` them inline in `updateTradePhase`, the HTTP response hangs. Instead, trigger the escrow call asynchronously and log failures — the trade phase updates immediately, escrow catches up in the background.

- [ ] **Step 1: Inject `EscrowService` into `TradeOperationService`**

In `trade-operation.service.ts`, add to constructor imports and injection:

```typescript
// Add to imports at top
import { EscrowService } from "../../escrow/escrow.service";

// Add to constructor signature
constructor(
  private readonly prisma: PrismaService,
  // ... existing injections ...
  private readonly escrowService: EscrowService,
) {}
```

Also add `EscrowModule` to `TradeOperationsModule` imports in `trade-operations.module.ts`:

```typescript
import { EscrowModule } from "../escrow/escrow.module";

@Module({
  imports: [EscrowModule, /* ... existing ... */],
  // ...
})
```

Make sure `EscrowModule` exports `EscrowService`:

```typescript
// In escrow.module.ts
@Module({
  providers: [EscrowService],
  exports: [EscrowService],  // ← add this
})
export class EscrowModule {}
```

- [ ] **Step 2: Add escrow trigger logic after phase update**

In `updateTradePhase()`, after the Prisma update succeeds, add the escrow trigger:

```typescript
// After: await this.prisma.tradeOperation.update(...)
// Add this block at the end of updateTradePhase(), before the return:

this.triggerEscrowForPhase(tradeOperationId, newPhase, existingTrade).catch((err) => {
  this.logger.error(
    `Escrow action failed for trade ${tradeOperationId} → ${newPhase}: ${err.message}`,
  );
});
```

- [ ] **Step 3: Implement `triggerEscrowForPhase()` private method**

Add this private method to `TradeOperationService`:

```typescript
private async triggerEscrowForPhase(
  tradeOperationId: string,
  newPhase: TradePhase,
  trade: { sellingPrice: Decimal | null; buyListingId: string },
): Promise<void> {
  if (!this.escrowService.isConfigured()) {
    this.logger.warn("Escrow not configured — skipping blockchain action");
    return;
  }

  if (newPhase === TradePhase.IN_TRANSIT) {
    // Lock funds when goods leave the seller
    if (!trade.sellingPrice) {
      this.logger.warn(`Trade ${tradeOperationId} has no selling price — cannot create escrow`);
      return;
    }
    const amountCelo = trade.sellingPrice.toFixed(4); // price in CELO
    // Use a placeholder seller address (platform wallet) — real seller payouts handled off-chain for MVP
    const platformWallet = this.configService.get<string>("ADMIN_WALLET_ADDRESS") ?? "";
    await this.escrowService.createEscrow(tradeOperationId, platformWallet, amountCelo);
    this.logger.log(`Escrow created for trade ${tradeOperationId}: ${amountCelo} CELO locked`);
  }

  if (newPhase === TradePhase.DELIVERED) {
    // Release funds when delivery confirmed
    await this.escrowService.releaseFunds(tradeOperationId);
    this.logger.log(`Escrow released for trade ${tradeOperationId}`);
  }
}
```

- [ ] **Step 4: Add `isConfigured()` guard to `EscrowService`**

Add this public method to `escrow.service.ts`:

```typescript
isConfigured(): boolean {
  return !!(this.contractAddress && this.rpcUrl && this.privateKey);
}
```

This prevents crashes in development when env vars aren't set yet.

- [ ] **Step 5: Add `ADMIN_WALLET_ADDRESS` to config**

In `escrow.service.ts` constructor, expose the derived wallet address:

```typescript
// Add field
private adminWalletAddress: string = "";

// In constructor, add:
if (this.privateKey) {
  try {
    import("ethers").then(({ Wallet }) => {
      this.adminWalletAddress = new Wallet(this.privateKey).address;
    });
  } catch {
    // ignore
  }
}
```

For now, `ADMIN_WALLET_ADDRESS` is passed as an env var directly (simpler for MVP).

- [ ] **Step 6: Build**

```bash
cd backend && npm run build
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add backend/src/trade-operations/ backend/src/escrow/
git commit -m "feat: auto-trigger escrow on IN_TRANSIT and DELIVERED phase transitions"
```

---

### Task 6: Configure env vars locally and on Railway

**Files:**
- Modify: `backend/.env` (local, gitignored)

- [ ] **Step 1: Add to `backend/.env`**

```env
# Blockchain / Escrow
ESCROW_CONTRACT_ADDRESS=0x<your_deployed_address>
BLOCKCHAIN_RPC_URL=https://alfajores-forno.celo-testnet.org
ADMIN_WALLET_PRIVATE_KEY=<your_private_key>
ADMIN_WALLET_ADDRESS=<your_public_address>
```

- [ ] **Step 2: Add the same 4 vars to Railway**

Go to Railway → `agro-trade-native` service → Variables tab.
Add:
- `ESCROW_CONTRACT_ADDRESS`
- `BLOCKCHAIN_RPC_URL`
- `ADMIN_WALLET_PRIVATE_KEY`
- `ADMIN_WALLET_ADDRESS`

- [ ] **Step 3: Verify locally**

```bash
cd backend && npm run start:dev
# In another terminal:
curl -X GET http://localhost:4000/api/escrow/<any_trade_id>/status \
  -H "Authorization: Bearer <admin_jwt>"
```

Expected: `{"state": "UNKNOWN"}` (no escrow for that ID yet — that's correct).

- [ ] **Step 4: Commit `backend/.env.example` update**

Add to `backend/.env.example`:
```env
ESCROW_CONTRACT_ADDRESS=
BLOCKCHAIN_RPC_URL=https://alfajores-forno.celo-testnet.org
ADMIN_WALLET_PRIVATE_KEY=
ADMIN_WALLET_ADDRESS=
```

```bash
git add backend/.env.example
git commit -m "chore: add escrow env vars to .env.example"
```

---

## Chunk 3: Frontend Integration

### Task 7: Embed EscrowStatusCard in Buyer and Seller dashboards

**Files:**
- Modify: `front-end/src/features/dashboard/screens/buyer/BuyerOrdersTab.tsx`
- Modify: `front-end/src/features/dashboard/screens/seller/SellerTradesTab.tsx`

`★ Insight` — The `EscrowStatusCard` already exists and is fully functional — it fetches status, renders state badges, and shows admin release/dispute buttons. All we need to do is render it inside the existing order/trade cards, conditionally on the trade phase being `IN_TRANSIT` or later.

- [ ] **Step 1: Add EscrowStatusCard to `BuyerOrdersTab.tsx`**

Find where individual order/trade operation cards are rendered. Import and add:

```tsx
import { EscrowStatusCard } from '../../../../design-system';
// or wherever it's imported from:
import EscrowStatusCard from '../admin/components/EscrowStatusCard';
```

Inside the order card render, add conditionally when the phase is past `TRANSPORT_BIDDING`:

```tsx
{['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(order.phase) && order.tradeOperationId && (
  <EscrowStatusCard
    tradeOperationId={order.tradeOperationId}
    isAdmin={false}
  />
)}
```

- [ ] **Step 2: Add EscrowStatusCard to `SellerTradesTab.tsx`**

Same pattern — find where trade items are rendered, add:

```tsx
{['IN_TRANSIT', 'DELIVERED', 'COMPLETED'].includes(trade.phase) && trade.tradeOperationId && (
  <EscrowStatusCard
    tradeOperationId={trade.tradeOperationId}
    isAdmin={false}
  />
)}
```

- [ ] **Step 3: Check the Metro bundler for errors**

```bash
# In the Metro terminal, watch for red errors after saving
# Or check:
curl http://localhost:8081/status
```

- [ ] **Step 4: Take a simulator screenshot to verify UI**

```bash
xcrun simctl io booted screenshot /tmp/escrow-buyer-tab.png
```

Verify the escrow card appears on orders in late phases.

- [ ] **Step 5: Commit**

```bash
git add front-end/src/features/dashboard/screens/buyer/ \
        front-end/src/features/dashboard/screens/seller/
git commit -m "feat: embed EscrowStatusCard in buyer orders and seller trades tabs"
```

---

### Task 8: Add escrow controls to Inspector view

**Files:**
- Modify: `front-end/src/features/dashboard/screens/inspector/` (whichever screen shows active inspections)

- [ ] **Step 1: Find the inspector screen file**

```bash
ls front-end/src/features/dashboard/screens/inspector/
```

- [ ] **Step 2: Add EscrowStatusCard with `isAdmin={true}` for inspectors**

Inspector is the trusted 3rd party who confirms delivery. Show the full card with release/dispute buttons:

```tsx
{inspection.tradeOperationId && (
  <EscrowStatusCard
    tradeOperationId={inspection.tradeOperationId}
    isAdmin={true}  // shows Release/Dispute buttons
  />
)}
```

Note: `isAdmin={true}` shows the action buttons. The buttons call the backend which uses the admin wallet to call the contract — the inspector doesn't need a wallet.

- [ ] **Step 3: Commit**

```bash
git add front-end/src/features/dashboard/screens/inspector/
git commit -m "feat: add escrow release/dispute controls to inspector view"
```

---

## Chunk 4: End-to-End Smoke Test

### Task 9: Full pipeline test on Alfajores

- [ ] **Step 1: Create a test trade operation via API**

Use the admin API to create a trade operation, then advance it to `IN_TRANSIT`:

```bash
# Advance trade to IN_TRANSIT (triggers auto-escrow creation)
curl -X PATCH http://localhost:4000/api/trade-operations/<id>/phase \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"phase": "IN_TRANSIT"}'
```

- [ ] **Step 2: Check escrow was created on-chain**

```bash
curl -X GET http://localhost:4000/api/escrow/<id>/status \
  -H "Authorization: Bearer <admin_jwt>"
```

Expected: `{"state": "AWAITING_DELIVERY", "amountWei": "..."}`.

Also verify on Celo Alfajores explorer:
https://alfajores.celoscan.io/address/<CONTRACT_ADDRESS>

- [ ] **Step 3: Advance trade to DELIVERED (triggers auto-release)**

```bash
curl -X PATCH http://localhost:4000/api/trade-operations/<id>/phase \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"phase": "DELIVERED"}'
```

- [ ] **Step 4: Verify funds were released**

```bash
curl -X GET http://localhost:4000/api/escrow/<id>/status \
  -H "Authorization: Bearer <admin_jwt>"
```

Expected: `{"state": "COMPLETE"}`.

Check backend logs for:
```
Escrow released for trade <id>
```

- [ ] **Step 5: Test dispute flow manually**

```bash
# Create a fresh trade, advance to IN_TRANSIT, then raise dispute manually:
curl -X POST http://localhost:4000/api/escrow/<id>/dispute \
  -H "Authorization: Bearer <admin_jwt>"

# Verify state
curl http://localhost:4000/api/escrow/<id>/status ...
# Expected: {"state": "DISPUTED"}

# Resolve in favor of buyer
curl -X POST http://localhost:4000/api/escrow/<id>/resolve \
  -H "Authorization: Bearer <admin_jwt>" \
  -H "Content-Type: application/json" \
  -d '{"releaseToBuyer": true}'
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat: on-chain vault system — AgroEscrow on Celo Alfajores, auto-create/release on phase transitions, buyer/seller/inspector UI"
```

---

## Summary

After completing all tasks:

| Capability | Status |
|---|---|
| Smart contract deployed on Celo Alfajores | ✅ |
| Funds auto-lock when trade goes IN_TRANSIT | ✅ |
| Funds auto-release when trade goes DELIVERED | ✅ |
| Admin can raise dispute + resolve | ✅ |
| Buyer sees escrow status in orders tab | ✅ |
| Seller sees escrow status in trades tab | ✅ |
| Inspector can release/dispute from their dashboard | ✅ |
| No crypto wallet required from users | ✅ |

**Next milestone:** Switch from native CELO to cUSD stablecoin (avoids volatility risk for farmers), and add non-custodial user wallets via Privy embedded wallets.
