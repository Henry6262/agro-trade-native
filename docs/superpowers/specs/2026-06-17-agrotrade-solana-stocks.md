# AgroTrade — Solana Tokenized Agricultural Stocks

**Date:** 2026-06-17
**Scope:** A liquid trading layer inside the Invest tab. Users trade tokenized agricultural company stocks (xStocks SPL tokens via Jupiter) and AgroTrade-issued commodity tokens ($AVDO, $CAFF, $COCOAT) on Solana. Harvest payouts on Celo flow into this layer via Wormhole bridge.

---

## Vision

AgroTrade becomes a two-layer agricultural investment platform:

| Layer | What | Chain | Liquidity |
|-------|------|-------|-----------|
| **Farms** | Plantation round NFT shares | Celo | Illiquid — harvest-based |
| **Stocks** | Tokenized agri company stocks + commodity tokens | Solana | Liquid — 24/7 trading |

The flywheel: own a real farm → harvest pays out cUSD → one tap bridges to Solana USDC → reinvest into agri stocks. Capital never leaves the agricultural ecosystem.

---

## Token Universe

### xStocks — Agricultural Companies
Fully collateralized SPL tokens by Backed Finance. Already live on Solana, tradeable on Jupiter. No issuance work required.

| Ticker | Company | Why relevant |
|--------|---------|-------------|
| `DOLEx` | Dole PLC | Global fresh fruit & vegetables |
| `BGx` | Bunge Global | Agri supply chain, grain trading |
| `ADMx` | Archer-Daniels-Midland | Crop processing, nutrition |
| `DEx` | Deere & Co | Agricultural machinery |
| `FDPx` | Fresh Del Monte Produce | Tropical fruit, avocados |
| `MOSx` | The Mosaic Company | Crop nutrients, fertilizers |
| `CTVAx` | Corteva Agriscience | Seeds, crop protection |

### AgroTrade Commodity Tokens — Custom SPL
Issued by AgroTrade via Anchor program (extends existing `contracts-solana/`). Price is a weighted index of the underlying active plantation rounds on Celo.

| Symbol | Underlying | Pricing |
|--------|-----------|---------|
| `$AVDO` | Avocado plantation rounds | Weighted avg pricePerShareCUSD × funding% of all ACTIVE avocado rounds |
| `$CAFF` | Coffee plantation rounds | Same, coffee rounds |
| `$COCOAT` | Cocoa plantation rounds | Same, cocoa rounds |

**Token supply:** Fixed per epoch (30 days). Backend mints new supply when new plantation rounds open; burns on round closure. Total supply = sum of all active round targets for that crop type, denominated in USDC.

---

## Architecture

### Wallet
**Privy embedded Solana wallet.** Users already auth with Privy. We enable the Solana embedded wallet key — zero extra friction, no Phantom required. Backend signs transactions on behalf of users for bridge + swap (custodial model, same pattern as Celo admin wallet).

For power users: optional Phantom connect via WalletConnect as fallback.

### Cross-chain Flow (cUSD → USDC → Trade)
```
Harvest payout received (cUSD on Celo)
  → "Put your harvest to work" banner appears
  → User taps → confirms bridge amount
  → Backend: Wormhole SDK bridges cUSD → USDC (Solana)
    (Wormhole automatic relayer, ~15s finality)
  → USDC lands in user's embedded Solana wallet
  → Stocks tab opens, pre-filtered to relevant crop
  → User buys xStock or commodity token via Jupiter swap
```

### Jupiter Integration
All swaps execute through Jupiter Aggregator V6 API.

```typescript
// Quote
GET https://quote-api.jup.ag/v6/quote?
  inputMint=USDC&
  outputMint={tokenMint}&
  amount={lamports}&
  slippageBps=50

// Swap
POST https://quote-api.jup.ag/v6/swap
  { quoteResponse, userPublicKey, wrapAndUnwrapSol: false }
```

Backend submits the signed transaction (custodial). User never touches keys.

### AgroTrade Token Issuance (Anchor)
Extends `contracts-solana/programs/agro-escrow/` with a new program: `agro-commodity-token`.

```rust
// New instructions added to contracts-solana/
pub fn mint_commodity_tokens(ctx, crop_type: String, amount: u64) -> Result<()>
pub fn burn_commodity_tokens(ctx, crop_type: String, amount: u64) -> Result<()>
pub fn update_commodity_price(ctx, crop_type: String, price_usdc: u64) -> Result<()>
```

Price oracle: backend cron (every 1h) reads active plantation round data from Prisma, computes weighted index price, calls `update_commodity_price` on-chain.

---

## Backend — New Module: `solana-trading`

Location: `backend/src/solana-trading/`

```
solana-trading/
├── solana-trading.module.ts
├── solana-trading.controller.ts
├── solana-trading.service.ts        ← Jupiter swaps + balance queries
├── wormhole.service.ts              ← cUSD → USDC bridge
├── commodity-token.service.ts       ← $AVDO/$CAFF/$COCOAT mint/burn/price
├── portfolio.service.ts             ← Solana position tracking
└── dto/
    ├── bridge.dto.ts                ← { amountCUSD: number }
    └── swap.dto.ts                  ← { inputMint, outputMint, amountUSDC }
```

### REST API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/solana-trading/tokens` | List all tradeable tokens (xStocks + commodity) with price + 24h change |
| `GET` | `/solana-trading/tokens/:symbol` | Token detail + 7d price history |
| `GET` | `/solana-trading/quote` | Jupiter quote for a swap |
| `POST` | `/solana-trading/swap` | Execute swap via Jupiter |
| `POST` | `/solana-trading/bridge` | Bridge cUSD → USDC via Wormhole |
| `GET` | `/solana-trading/portfolio` | User's Solana token positions + P&L |
| `GET` | `/solana-trading/balance` | User's USDC balance on Solana |

### Prisma — New Models

```prisma
model SolanaPosition {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  tokenSymbol   String   // "DOLEx", "AVDO", etc.
  tokenMint     String   // SPL token mint address
  balance       Decimal  @db.Decimal(36, 9)  // token amount (9 decimals, Solana)
  avgCostUSDC   Decimal  @db.Decimal(36, 6)  // average cost basis per token
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model SolanaTransaction {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  type          SolanaTxType
  inputSymbol   String
  outputSymbol  String
  inputAmount   Decimal  @db.Decimal(36, 6)
  outputAmount  Decimal  @db.Decimal(36, 9)
  txSignature   String   @unique
  status        String   @default("confirmed")
  createdAt     DateTime @default(now())
}

model BridgeTransaction {
  id              String   @id @default(cuid())
  userId          String
  amountCUSD      Decimal  @db.Decimal(36, 18)
  amountUSDC      Decimal  @db.Decimal(36, 6)
  wormholeSeq     String?
  status          BridgeStatus @default(PENDING)
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}

enum SolanaTxType { BUY SELL }
enum BridgeStatus { PENDING CONFIRMED FAILED }
```

---

## Frontend — Stocks Sub-section

### Navigation
Inside `InvestHomeScreen`, the pill toggle expands to three options:
```
[ Discover | My Farms | Stocks ]
```

### StocksHomeScreen

```
[Search stocks...]

── Agri Companies ──────────────────
[DOLEx  $12.40  +2.1%] [BGx  $84.20  -0.8%] [ADMx ...]  → horizontal scroll

── AgroTrade Tokens ─────────────────
[AVDO  $0.52  +5.3%] [CAFF  $1.24  +1.1%] [COCOAT  $0.88  -0.4%]

── Your Positions ───────────────────
[If any positions exist: DOLEx · 12 tokens · $148.80 · +$8.40 (6%)]

── USDC Balance ─────────────────────
$183.00 USDC available  [Bridge from Farm Payout]
```

**Color coding:** price change green (#4ADE80) / red (#F87171). Matches existing design tokens.

### StockDetailScreen

```
[← back]

DOLEx — Dole PLC
"Global fresh fruit & vegetables. Traded 24/7 on Solana."

$12.40          +2.1% today
[7-day line chart — dark background, green line]

Your position: 12 tokens · $148.80 · avg cost $11.60

[    Buy    ] [    Sell    ]
```

**Buy bottom sheet:**
```
Buy DOLEx

Amount (USDC): [$____]
You receive:   ~8 DOLEx
Execution:     Jupiter · est. 0.3% slippage

[Confirm Buy]
```

**Success:** same 3D coins moment as investment success (reuses `coins.glb` orbit animation).

### "Put Your Harvest to Work" Banner

Shown on the My Farms tab immediately after a successful harvest claim:

```
┌─────────────────────────────────────┐
│  Your avocado harvest earned $183   │
│  Put it to work in agri stocks →    │
│  [Explore $AVDO & Dole stocks]      │
└─────────────────────────────────────┘
```

Tapping navigates to Stocks tab pre-filtered to avocado-related tokens.

### Service Layer

New file: `front-end/src/services/solanaTradingService.ts`

```typescript
export const solanaTradingService = {
  getTokens: () =>
    apiClient.get<AgroToken[]>('/solana-trading/tokens'),

  getToken: (symbol: string) =>
    apiClient.get<AgroTokenDetail>('/solana-trading/tokens/' + symbol),

  getQuote: (input: string, output: string, amountUSDC: number) =>
    apiClient.get<SwapQuote>(`/solana-trading/quote?inputMint=${input}&outputMint=${output}&amount=${amountUSDC}`),

  swap: (dto: SwapDto) =>
    apiClient.post<{ txSignature: string }>('/solana-trading/swap', dto),

  bridge: (amountCUSD: number) =>
    apiClient.post<{ bridgeId: string }>('/solana-trading/bridge', { amountCUSD }),

  getPortfolio: () =>
    apiClient.get<SolanaPosition[]>('/solana-trading/portfolio'),

  getBalance: () =>
    apiClient.get<{ usdc: string }>('/solana-trading/balance'),
};
```

### Types

New file: `front-end/src/types/stocks.ts`

```typescript
export interface AgroToken {
  symbol: string;         // "DOLEx", "AVDO"
  name: string;           // "Dole PLC", "Avocado Index"
  mint: string;           // SPL mint address
  priceUSDC: string;
  change24hPct: string;   // "+2.10" or "-0.80"
  category: 'xstock' | 'commodity';
  logoUri?: string;
}

export interface SolanaPosition {
  tokenSymbol: string;
  balance: string;
  currentValueUSDC: string;
  avgCostUSDC: string;
  pnlUSDC: string;
  pnlPct: string;
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  slippageBps: number;
  priceImpactPct: string;
}

export interface SwapDto {
  inputMint: string;
  outputMint: string;
  amountUSDC: number;
  slippageBps?: number;
}
```

---

## Data Flow — Full Flywheel

```
1. User claims harvest payout
   → claimYield API → cUSD sent to user Celo wallet
   → "Put your harvest to work" banner appears

2. User taps banner → Stocks tab, avocado filter
   → Sees $AVDO + FDPx (Fresh Del Monte)

3. User taps "Bridge $183 to trade"
   → POST /solana-trading/bridge { amountCUSD: 183 }
   → Backend: Wormhole SDK locks cUSD on Celo, releases USDC on Solana (~15s)
   → USDC balance updates in app

4. User buys $100 of $AVDO
   → GET /solana-trading/quote
   → POST /solana-trading/swap
   → Jupiter V6: USDC → $AVDO
   → Position appears in My Farms > Stocks section

5. Portfolio shows:
   - Plantation NFTs (Celo): Kenya Avocado Grove, 3 shares, ACTIVE
   - Stocks (Solana): $AVDO 192 tokens · $100 · +3.2%
```

---

## Commodity Token Pricing Logic

Backend cron (every 60min):

```typescript
// In commodity-token.service.ts
async computeAvdoPrice(): Promise<number> {
  const rounds = await prisma.plantationRound.findMany({
    where: { cropType: 'avocado', status: { in: ['OPEN', 'FUNDED', 'ACTIVE'] } },
  });
  const totalShares = rounds.reduce((a, r) => a + r.totalShares, 0);
  const totalSold = rounds.reduce((a, r) => a + r.sharesSold, 0);
  const weightedPrice = rounds.reduce((a, r) => {
    const weight = r.sharesSold / (totalSold || 1);
    return a + Number(r.pricePerShareCUSD) * weight;
  }, 0);
  return weightedPrice; // price per $AVDO token in USDC
}
```

This anchors $AVDO's price to real plantation round data — it's not speculative, it tracks the underlying asset.

---

## Security Invariants

- All swaps are custodial — backend holds Solana embedded wallet key (same as Celo admin wallet pattern)
- Slippage cap: 1% max (reject quotes above)
- Bridge amounts capped at user's actual cUSD balance (checked before Wormhole call)
- No leverage, no margin — spot only
- xStock tokens are Backed Finance regulated instruments — no additional KYC layer needed from AgroTrade side for trading (Backed handles compliance at issuance)
- AgroTrade commodity tokens ($AVDO etc.) are utility tokens — not securities claims, they represent index exposure to the plantation round data

---

## Out of Scope (this spec)

- Limit orders / stop-loss (spot market only in v1)
- Solana staking / DeFi yield (e.g. Kamino lending)
- Perpetuals or options
- Token launchpad (separate pump.fun-style feature)
- Governance over commodity token supply
- Secondary market for plantation NFTs on Solana
- Tax reporting / transaction history export
