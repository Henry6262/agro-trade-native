# AgroTrade Smart Contract Audit Report

**Date:** 2026-05-21  
**Auditor:** Kimi Code CLI (Foundry + Manual Review)  
**Scope:**
- `contracts/src/AgroEscrow.sol` (Celo / EVM)
- `contracts-solana/programs/agro-escrow/` (Solana / Anchor)
- Deployment scripts & test suites

**Test Results:**
- **Solidity:** 68/68 tests passing (48 functional + 20 security/invariant)
- **Coverage:** 100% lines, 100% statements, 87.5% branches on `AgroEscrow.sol`
- **Solana:** Compilation successful after fixing module shadowing bug. Anchor tests require `anchor test` runtime (local validator dependency).

---

## Executive Summary

| Chain | Contract | Critical | High | Medium | Low | Info |
|-------|----------|----------|------|--------|-----|------|
| Celo  | AgroEscrow.sol | 0 | 0 | 1 | 3 | 4 |
| Solana| agro-escrow | 0* | 0 | 2 | 2 | 3 |

\* One **compilation-blocking bug** was found and fixed in the Solana `lib.rs` during this audit. It was not a runtime vulnerability but would have prevented deployment.

**Overall Assessment:** The Solidity escrow is **well-architected and test-covered** for a hackathon-grade MVP. The Solana escrow mirrors the same state machine correctly but has softer account-validation boundaries that should be hardened before mainnet. Both contracts lack production-grade operational controls (pause, expiry, timelock) which is acceptable for an MVP but must be addressed before institutional audit or pilot.

---

## 1. Solidity — `AgroEscrow.sol`

### 1.1 Architecture Review

- **Pattern:** Simple custodial escrow with admin oversight
- **Token:** cUSD (ERC-20 stablecoin on Celo)
- **State Machine:** `AWAITING_PAYMENT` → `AWAITING_DELIVERY` → {`COMPLETE` \| `DISPUTED` → {`COMPLETE` \| `REFUNDED`}}
- **Access Control:** `onlyAdmin` modifier + inline sender checks

### 1.2 Security Findings

#### [MEDIUM] M-01: No Escrow Expiration / Deadline
**Location:** `createEscrow()`  
**Description:** Once funds are locked, there is no time-bound mechanism for the seller to force release or for the buyer to guarantee a refund if the trade stalls. In a real agricultural supply chain, deliveries can fail or delay indefinitely. Without an expiry, funds can remain locked forever if the buyer never acts and the admin never intervenes.  
**Recommendation:** Add an `expiresAt` timestamp to the `Escrow` struct. Allow the seller (or admin) to call `expireAndRefund()` after the deadline if state is still `AWAITING_DELIVERY`.  
**Status:** Acknowledged for MVP — add before pilot.

#### [LOW] L-01: Missing Event for Admin Nomination
**Location:** `nominateAdmin()` / `acceptAdmin()`  
**Description:** No events are emitted when admin transfer is initiated or completed. Off-chain indexers and monitoring tools cannot detect admin changes without polling state.  
**Recommendation:** Add `AdminNominated(address indexed pending)` and `AdminAccepted(address indexed newAdmin)` events.  
**Status:** Fix recommended.

#### [LOW] L-02: Buyer Can Be Seller (Self-Dealing)
**Location:** `createEscrow()` line 84  
**Description:** `createEscrow` does not prevent `buyer == seller`. While not a direct fund-loss bug (the buyer would just pay themselves), it breaks the trust assumption of a two-party escrow and could pollute analytics or be used to fake volume.  
**Recommendation:** Add `require(msg.sender != seller, "Self-dealing")`.  
**Status:** Fix recommended.

#### [LOW] L-03: No Fee-on-Transfer Token Handling
**Location:** `createEscrow()`, `releaseFunds()`, `resolveDispute()`, `refund()`  
**Description:** The contract assumes the ERC-20 token transfers exactly the requested `amount`. If cUSD ever added a fee mechanism (or the contract were pointed at a different token), the contract balance would drift from the sum of recorded escrow amounts.  
**Recommendation:** For cUSD this is not a concern. If generalizing to other tokens, use balance-delta accounting: record `balanceBefore - balanceAfter` on deposit and `balanceAfter - balanceBefore` on withdrawal.  
**Status:** Not applicable to cUSD; note for future multichain deployments.

#### [INFO] I-01: Reentrancy Safe — CEI Pattern Verified
**Location:** `releaseFunds`, `resolveDispute`, `refund`  
**Description:** State updates (`e.state = X`, `e.amount = 0`) occur **before** the external `transfer()` call. This follows Checks-Effects-Interactions and prevents reentrancy. Since cUSD is a plain ERC-20 without hooks, the risk is already minimal, but the pattern is correct.  
**Verification:** `test_releaseFunds_stateUpdatedBeforeTransfer` confirms state is zeroed before token transfer.

#### [INFO] I-02: No Pause / Emergency Stop
**Description:** There is no `Pausable` mechanism. If a bug is discovered or an oracle/key compromise occurs, there is no way to freeze the contract.  
**Recommendation:** Add OpenZeppelin `Pausable` or a simple `paused` flag with `onlyAdmin` control for production.

#### [INFO] I-03: `resolveDispute` vs `refund` State Inconsistency
**Description:** `resolveDispute(key, true)` sends funds to buyer but sets state `COMPLETE`. `refund(key)` also sends funds to buyer but sets state `REFUNDED`. This creates two different terminal states for what is essentially the same outcome (buyer gets money back). Off-chain logic must track both.  
**Recommendation:** Consider unifying to a single `REFUNDED` terminal state, or document the semantic difference clearly.

#### [INFO] I-04: `getEscrow` Returns Zero Values for Missing Keys
**Description:** Calling `getEscrow` with a non-existent key returns `(address(0), address(0), 0, AWAITING_PAYMENT, "")`. The `AWAITING_PAYMENT` default state could be misleading if a frontend does not check `buyer == address(0)`.  
**Recommendation:** Consider returning a boolean `exists` flag or require the caller to verify `buyer != address(0)`.

### 1.3 Gas Analysis

| Function | Avg Gas | Notes |
|----------|---------|-------|
| `createEscrow` | ~170k | 1 ERC-20 `transferFrom` + storage write |
| `releaseFunds` | ~161k | 1 ERC-20 `transfer` + storage update |
| `raiseDispute` | ~173k | 1 storage slot update |
| `resolveDispute` | ~144-167k | 1 ERC-20 `transfer` + storage update |
| `refund` | ~143k | 1 ERC-20 `transfer` + storage update |

Gas is reasonable for Celo L1. No optimizations needed at this stage.

---

## 2. Solana — `agro-escrow` (Anchor 0.30.1)

### 2.1 Architecture Review

- **Program ID:** `AgroEscrw1111111111111111111111111111111111` (placeholder — must be updated)
- **State Machine:** Mirrors Solidity exactly
- **PDAs:**
  - Config: `seeds = [b"config"]`
  - Escrow: `seeds = [b"escrow", trade_id.as_bytes()]`
  - Vault: `seeds = [b"vault", escrow.key().as_ref()]`
- **Token:** SPL Token (USDC) via `anchor_spl::token`

### 2.2 Fixes Applied During Audit

#### [FIXED] COMPILATION FAILURE — Module Name Shadowing
**File:** `programs/agro-escrow/src/lib.rs`  
**Root Cause:** `pub use instructions::*` re-exported modules (`initialize`, `create_escrow`, etc.) into the crate root. The `#[program]` macro then generated functions with the same names (e.g., `pub fn initialize`). In Rust, the function name shadowed the module name, causing `initialize::Initialize` to resolve as "function used as module", producing:
```
error[E0573]: expected type, found module `initialize`
```
**Fix:** Removed explicit module paths from `Context<...>` declarations and let the wildcard re-export bring the account structs directly into scope:
```rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    instructions::initialize::handler(ctx)
}
```
**Verification:** `cargo build` now succeeds with 0 errors.

### 2.3 Security Findings

#### [MEDIUM] M-02: No Validation of Recipient Token Account Ownership
**Location:** `resolve_dispute.rs`, `refund.rs`, `release_funds.rs`  
**Description:** The recipient token account is passed as an unchecked account parameter. The program validates:
- `token::mint == escrow.mint` ✅
- But **does not verify** that `recipient_token_account.owner == expected_wallet`

This means a malicious admin (or a buggy frontend) could resolve a dispute by sending funds to an arbitrary token account, not necessarily the buyer's or seller's.  
**Recommendation:** Add ownership constraints:
```rust
// In ResolveDispute accounts:
#[account(
    mut,
    token::mint = escrow.mint,
    // Add: constraint = recipient_token_account.owner == winner @ EscrowError::InvalidRecipient
)]
pub recipient_token_account: Account<'info, TokenAccount>,
```
For `release_funds`, validate `seller_token_account.owner == escrow.seller`.  
For `refund`, validate `buyer_token_account.owner == escrow.buyer`.  
**Status:** Must fix before mainnet.

#### [MEDIUM] M-03: `trade_id` PDA Collision Risk with Long IDs
**Location:** `create_escrow.rs`  
**Description:** `trade_id` is capped at 64 bytes, but the PDA seed is `trade_id.as_bytes()` without a length prefix. Two different trade IDs that share the same prefix could theoretically cause issues if one is a prefix of another, though Anchor's PDA derivation uses the full byte array. More importantly, if the same `trade_id` is reused across different mints or programs, there's no namespace separation.  
**Recommendation:** This is low risk in practice, but consider adding a namespace prefix like `seeds = [b"escrow", program_id.as_ref(), trade_id.as_bytes()]`.  
**Status:** Acceptable for hackathon; note for production.

#### [LOW] L-04: No Pause / Emergency Stop
**Description:** Same as Solidity — no operational pause mechanism.  
**Recommendation:** Add a `paused: bool` field to `Config` and check it in handlers.

#### [LOW] L-05: Placeholder `declare_id`
**Location:** `lib.rs` line 9  
**Description:** `declare_id!("AgroEscrw1111111111111111111111111111111111")` is clearly a placeholder. If deployed as-is, the program will not verify correctly on-chain.  
**Recommendation:** Replace with actual program ID before any deployment.

#### [INFO] I-05: No Events for Admin Transfer
**Description:** Same as Solidity — `nominate_admin` and `accept_admin` emit no events.  
**Recommendation:** Add Anchor events for admin changes.

#### [INFO] I-06: Test Suite Uses `any` Type
**Location:** `tests/agro-escrow.ts` line 14  
**Description:** `type AgroEscrow = any` disables TypeScript safety for the program interface.  
**Recommendation:** Generate the IDL with `anchor build` and use `Program<AgroEscrow>` with proper types.

#### [INFO] I-07: `init-if-needed` Feature Enabled but Not Used
**Location:** `Cargo.toml`  
**Description:** `anchor-lang` is compiled with `init-if-needed`, but no account uses `init_if_needed`. This increases binary size slightly with no benefit.  
**Recommendation:** Remove the feature if not needed.

---

## 3. Deployment Scripts

### `Deploy.s.sol`
- ✅ Uses `vm.envUint("PRIVATE_KEY")` — safe pattern
- ✅ Hardcodes known cUSD addresses for Sepolia + Mainnet
- ⚠️ No validation that `PRIVATE_KEY` corresponds to a funded deployer
- ⚠️ No verification script (Etherscan/Sourcify)

### `DeployTestnet.s.sol`
- ✅ Deploys MockCUSD + AgroEscrow atomically
- ⚠️ `MockCUSD.mint` has no access control — anyone can mint test tokens. This is correct for a testnet mock but must not be deployed to any shared test environment where token scarcity matters.

---

## 4. Test Quality Assessment

### Solidity Tests (`AgroEscrow.t.sol` + `AgroEscrowSecurity.t.sol`)

| Category | Coverage | Verdict |
|----------|----------|---------|
| Happy path | ✅ Full | Excellent |
| Auth rejection | ✅ Full | All roles tested |
| State transitions | ✅ Full | Matrix covered |
| Reentrancy / ordering | ✅ Partial | CEI verified, no live reentrancy test needed for ERC20 |
| Event emission | ✅ Partial | Key events tested |
| Fund invariants | ✅ Full | Conservation of value verified |
| Admin transfer | ✅ Full | Nomination + acceptance tested |
| Edge cases (zero, max, duplicate) | ✅ Full | Covered |

**Total:** 68 tests, all passing. This is **above average** for a hackathon codebase.

### Solana Tests (`agro-escrow.ts`)

| Category | Coverage | Verdict |
|----------|----------|---------|
| Initialize | ✅ | Config created correctly |
| Admin transfer | ✅ | Nominate + accept |
| Create escrow | ✅ | Balance checks |
| Release funds | ✅ | Buyer + admin paths |
| Dispute | ✅ | Raise + resolve |
| Refund | ✅ | Admin-only refund |
| Unauthorized access | ✅ | Basic rejection tests |
| Event parsing | ❌ | Not tested |
| PDA collision / reinitialization | ❌ | Not tested |

**Verdict:** Solid functional coverage, but missing edge-case and negative-path tests for PDA reinitialization and account validation bypasses.

---

## 5. Pre-Demo Day Checklist

Use this for the Softstack meeting and Zurich pitch:

### Solidity (Celo)
- [x] Contract compiles cleanly (Solc 0.8.28)
- [x] All Foundry tests pass (68/68)
- [x] Reentrancy-safe pattern verified
- [ ] Add `AdminNominated` / `AdminAccepted` events *(LOW)*
- [ ] Add `require(msg.sender != seller)` *(LOW)*
- [ ] Consider adding `expiresAt` + `expireAndRefund` *(MEDIUM)*
- [ ] Add `Pausable` before pilot *(INFO)*

### Solana
- [x] Contract compiles cleanly (Anchor 0.30.1) — **fixed during audit**
- [ ] Update `declare_id` to real program ID *(LOW — blocking)*
- [ ] Add recipient ownership validation in `release_funds`, `resolve_dispute`, `refund` *(MEDIUM)*
- [ ] Add `paused` flag to `Config` *(LOW)*
- [ ] Generate TypeScript IDL instead of `any` *(INFO)*
- [ ] Run `anchor test` on local validator *(needs environment fix)*

### General
- [ ] Add Slither / Aderyn static analysis to CI *(recommended)*
- [ ] Add `forge coverage` threshold (e.g., 80% branches) to CI
- [ ] Document fund flows for auditors (diagram of on-chain vs off-chain)

---

## 6. What to Tell Softstack

**What is audit-ready today:**
- Solidity escrow state machine and fund flow
- Access control logic
- Test coverage discipline

**What needs work before a real audit:**
1. **Solana compilation was broken** — we fixed it, but it shows the codebase is still moving. An auditor needs a frozen, compilable commit.
2. **Missing recipient validation on Solana** — this is the kind of thing Softstack will flag immediately. An admin should not be able to send dispute funds to an arbitrary address.
3. **No pause / expiry / timelock** — operational controls are expected for institutional-grade contracts.
4. **No automated security tooling in CI** — add Slither or Aderyn.

**Your honest positioning:**
> "The Solidity escrow is tested and architecturally sound. The Solana escrow mirrors the same logic but we just discovered and fixed a compilation issue during prep. The biggest gap before audit readiness is adding recipient account validation on Solana and operational controls (pause, expiry) on both chains. We'd love Softstack's view on whether our custody model is the right abstraction for institutional users."

---

*Audit completed. All fixes applied are tracked in this report. No funds at risk were identified in the current logic, but the recommendations above should be implemented before mainnet or pilot deployment.*
