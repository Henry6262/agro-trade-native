# AgroTrade — Invest Tab Design Spec

**Date:** 2026-06-17
**Scope:** New "Invest" bottom tab — map-based plantation round discovery, 3-tap invest flow, My Farms portfolio, Create Round form. Mobile only (Expo React Native). Backend Plantation Rounds API already live.

---

## Vision

Every user can browse real plantation investment rounds on a live map, buy tokenized shares (NFTs) in 3 taps, and watch their portfolio grow toward harvest payout. Any user can also list their own farm and raise capital. No crypto jargon. Feels like Robinhood meets Google Maps for real crops.

**Language rules (enforced throughout):**
- "Shares" not NFTs
- "Earn" / "payout" not yield / distribution
- "Farm" not round
- "Your farms" not portfolio
- "List your farm" not create round
- Numbers always in cUSD (e.g. "$150 cUSD")

---

## Navigation Changes

### New bottom tab: Invest
- Position: 5th tab in `GlassBottomNav`
- Icon: `Sprout` (Lucide)
- Label: "Invest"
- Visible to all authenticated users regardless of role

### Tab-internal navigation (Stack)
```
InvestStack
├── InvestHomeScreen        ← default tab screen
│   (pill toggle: Discover | My Farms)
├── RoundDetailScreen       ← bottom sheet (not full screen nav)
├── InvestConfirmScreen     ← modal
├── CreateRoundScreen       ← full screen
└── ClaimPayoutScreen       ← modal
```

### Navigation type additions (`/navigation/types.ts`)
```typescript
export type InvestStackParamList = {
  InvestHome: undefined;
  InvestConfirm: { roundId: string; shareCount: number };
  CreateRound: undefined;
  ClaimPayout: { tokenId: number; pendingCUSD: string };
};
```

---

## Screens

### 1. InvestHomeScreen

**Entry point for the tab.** Renders either Discover or My Farms based on pill toggle state (local useState, defaults to Discover).

**Layout:**
```
[Header: "Invest"        ] [+ List your farm (FAB top-right)]
[Pill: Discover | My Farms]
[--- content area ---]
```

No additional logic here — delegates to `DiscoverView` and `MyFarmsView` components.

---

### 2. DiscoverView (Discover sub-screen)

**Full-screen MapView** (react-native-maps, dark/satellite style via `mapType="hybrid"`).

**Map markers:** One per open `PlantationRound`. Custom marker: small pill with crop emoji + APY.
```
[ 🥑 22% ]   [ ☕ 18% ]   [ 🍫 31% ]
```
- Green pill = OPEN, plenty of shares
- Orange pill = fewer than 20% shares remaining ("Almost gone")
- Gray pill = FUNDED (still shown, grayed, not tappable)

**Search bar** pinned to top of map (floats over map):
- Placeholder: "Search by crop or country..."
- Filter chips below: All · Avocado · Coffee · Cocoa · Olive

**On marker tap:** `RoundDetailBottomSheet` slides up (using `@gorhom/bottom-sheet`). Map dims slightly behind it.

**First-time empty state (no rounds visible in viewport):**
> "No farms in this area yet — zoom out or search."

---

### 3. RoundDetailBottomSheet

Not a screen — a bottom sheet rendered inside DiscoverView. Snaps to 60% and 90% of screen height.

**Layout (top to bottom):**

1. **Farm photo** — full-bleed image from `metadataUri` or a crop-type fallback image (`/assets/crops/avocado.jpg` etc.). Height: 180px, rounded top corners.
2. **Crop + location row** — `🥑 Avocado · Kenya 🇰🇪`
3. **Big return number** — `"22% return at harvest"` (bold, 28px, accentGreen)
4. **Social proof row** — `"47 investors · 8 shares left"`. If < 10 shares: danger color.
5. **Funding progress bar** — full width, color: green → orange as it fills. Label: `"73% funded"`
6. **Price row** — `"$50 cUSD per share · Harvests Dec 2026"`
7. **Share selector** — pre-filled to 3 shares (recommended default). `−` / number / `+` buttons. Shows live total: `"3 shares · $150 cUSD"`
8. **Invest button** — `GlassButton` variant primary, full width: **"Invest $150 cUSD"** (updates live with share count). Loading state while API call in flight.

**On Invest tap:** navigates to `InvestConfirmScreen` with `{ roundId, shareCount }`.

---

### 4. InvestConfirmScreen (modal)

Single screen, minimal. Purpose: one final confirmation before money moves.

**Layout:**
```
[← back]

You're investing in

🥑 Avocado Grove — Kenya
Share 48–50 of 100

$150 cUSD
↓
You'll receive ~$183 cUSD at harvest
(est. 22% · Dec 2026)

[Confirm Investment]
[Cancel]
```

- "You'll receive" is `shareCount × pricePerShare × (1 + projectedApyPct/100)`, rounded to nearest $1.
- On confirm: calls `POST /plantation-rounds/:id/invest` `{ shareCount }`.
- On success: replaces screen with **SuccessView** (no navigation stack entry).

**SuccessView (inline, no navigation):**
```
✓

You own 3 shares in
Avocado Grove — Kenya

Your payout at harvest:
~$183 cUSD

[View My Farms →]
[Done]
```

---

### 5. MyFarmsView (Portfolio sub-screen)

Scrollable vertical list. No charts in v1 — keep it simple.

**Header strip (above list):**
```
Total invested    Estimated payout
$450 cUSD         ~$549 cUSD
```
Both computed client-side from owned NFT data.

**Farm position cards** — one per owned NFT group (grouped by round, not by individual token):

```
┌─────────────────────────────────┐
│ [farm photo 80px]  🥑 Avocado Grove · Kenya       │
│                    3 shares · $150 invested        │
│                    Est. payout: ~$183 cUSD         │
│                    [=====>       ] Harvests Dec '26│
│                                                    │
│  [Stake ●]        [Claim $0.40]                    │
└─────────────────────────────────┘
```

- **Stake toggle:** calls `POST /plantation-rounds/stake/:tokenId` (or unstake). Shows "Earning" badge when staked.
- **Claim button:** visible only when `pendingYield > 0`. Calls `POST /plantation-rounds/claim/:tokenId`. Disabled + spinner while in flight.
- **Status badge:** OPEN (gray) · GROWING (green) · HARVEST READY (gold, pulsing) · PAYOUT SENT (muted).
- If round status is DISTRIBUTING and user hasn't claimed: card shows a **bright green banner** "Your payout is ready — tap to claim $183 cUSD".

**Rounds the user CREATED** (any user can create): same card but with an extra row:
```
You listed this farm · 62/100 shares sold
[Distribute Harvest]  ← only visible when status = ACTIVE
```

**Empty state (no investments yet):**
```
[Sprout illustration]
Your farm portfolio is empty.
Browse the map to find your first investment.

[Browse Farms →]
```

---

### 6. CreateRoundScreen

Full screen, 3 required fields + 2 optional. No crypto terminology.

**Header:** "List your farm"

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Crop type | Picker | Yes | Avocado / Coffee / Cocoa / Olive / Other |
| Farm location | Text input | Yes | "City, Country" — also used for geocoding the map pin |
| Price per share (cUSD) | Number input | Yes | Min $1. Auto-shows "Total shares = target ÷ price" |
| Total target (cUSD) | Number input | Yes | Min $100 |
| Harvest deadline | Date picker | Yes | Min 30 days from today |
| Projected return % | Number input | Optional | Shown to investors as "est. X% return" |

**Live preview** below the form — shows how the map marker will look (`🥑 22%`) and a preview of the bottom sheet card.

**Submit button:** "Go Live" → `POST /plantation-rounds` → success toast "Your farm is live on the map!" → navigates back to Discover with map centered on new pin.

---

### 7. ClaimPayoutScreen (modal)

Triggered from the farm card "Claim" banner.

```
Harvest payout

🥑 Avocado Grove — Kenya
3 shares

$183.42 cUSD
incoming to your wallet

[Claim Now]
```

On confirm: calls `POST /plantation-rounds/claim/:tokenId`. On success shows checkmark + "Payment sent to your wallet."

---

## Service Layer

New file: `front-end/src/services/investService.ts`

```typescript
export const investService = {
  listRounds: (params?: { cropType?: string }) =>
    apiClient.get<PlantationRound[]>(`/plantation-rounds${params?.cropType ? `?cropType=${params.cropType}` : ''}`),

  getRound: (id: string) =>
    apiClient.get<PlantationRound>(`/plantation-rounds/${id}`),

  invest: (id: string, shareCount: number) =>
    apiClient.post<{ nfts: PlantationNft[] }>(`/plantation-rounds/${id}/invest`, { shareCount }),

  createRound: (dto: CreateRoundDto) =>
    apiClient.post<PlantationRound>(`/plantation-rounds`, dto),

  getPortfolio: () =>
    apiClient.get<PlantationNft[]>(`/plantation-rounds/portfolio`),

  stakeNft: (tokenId: number) =>
    apiClient.post(`/plantation-rounds/stake/${tokenId}`),

  unstakeNft: (tokenId: number) =>
    apiClient.post(`/plantation-rounds/unstake/${tokenId}`),

  getPendingYield: (tokenId: number) =>
    apiClient.get<{ pendingCUSD: string }>(`/plantation-rounds/yield/${tokenId}`),

  claimYield: (tokenId: number) =>
    apiClient.post(`/plantation-rounds/claim/${tokenId}`),

  distributeHarvest: (roundId: string, totalSaleCUSD: number) =>
    apiClient.post(`/plantation-rounds/${roundId}/distribute`, { totalSaleCUSD }),
};
```

---

## Types

New file: `front-end/src/types/invest.ts`

```typescript
export type PlantationRoundStatus = 'OPEN' | 'FUNDED' | 'ACTIVE' | 'DISTRIBUTING' | 'CLOSED';

export interface PlantationRound {
  id: string;
  onChainRoundId: number;
  cropType: string;
  farmLocation: string;
  targetCUSD: string;
  pricePerShareCUSD: string;
  totalShares: number;
  sharesSold: number;
  harvestDeadline: string;
  projectedApyPct?: string;
  status: PlantationRoundStatus;
  metadataUri?: string;
  latitude?: number;
  longitude?: number;
  sellerId: string;
}

export interface PlantationNft {
  id: string;
  tokenId: number;
  roundId: string;
  round: PlantationRound;
  shareIndex: number;
  staking?: {
    id: string;
    stakedAt: string;
    unstakedAt?: string;
    claimedCUSD: string;
  };
}

export interface CreateRoundDto {
  cropType: string;
  farmLocation: string;
  targetCUSD: number;
  pricePerShareCUSD: number;
  harvestDeadline: string;
  projectedApyPct?: number;
  metadataUri?: string;
  latitude?: number;
  longitude?: number;
}
```

---

## Contract Changes Required

Two small changes to existing contracts (coordinated with the contracts task):

### PlantationRound.sol — auto-approve staking contract
In `invest()`, after minting NFTs, call `_setApprovalForAll(msg.sender, stakingContractAddress, true)`. This pre-authorises the staking contract to move the investor's NFTs without the user needing to sign from mobile.

```solidity
// at the end of invest(), after minting loop
if (stakingContractAddress != address(0)) {
    _setApprovalForAll(msg.sender, stakingContractAddress, true);
}
```

### GroveStaking.sol — operator pattern
Add an `operator` address (set by admin) that can call `stake(tokenId)` on behalf of any NFT holder.

```solidity
address public operator;

function setOperator(address _operator) external onlyOwner {
    operator = _operator;
}

function stake(uint256 tokenId) external {
    require(msg.sender == operator || msg.sender == IERC721(nftContract).ownerOf(tokenId), "Not authorized");
    address nftOwner = IERC721(nftContract).ownerOf(tokenId);
    require(nftOwner != address(this), "Already staked");
    IERC721(nftContract).transferFrom(nftOwner, address(this), tokenId);
    stakedOwner[tokenId] = nftOwner;
    stakedAt[tokenId] = block.number;
    emit Staked(tokenId, nftOwner);
}
```

### Backend — add latitude/longitude to PlantationRound
Add `latitude` and `longitude` as optional Float fields to the Prisma `PlantationRound` model. Backend geocodes `farmLocation` string on round creation (or accepts lat/lng from the mobile form).

---

## Data Flow — Invest

```
User taps "Invest $150" on bottom sheet
  → InvestConfirmScreen
  → Confirm tap
  → investService.invest(roundId, shareCount)
  → POST /plantation-rounds/:id/invest
  → Backend: creates PlantationNft records (placeholder tokenIds)
             fires off contract.invest() async
             event listener overwrites tokenIds on RoundCreated event
  → App: success screen, pill shows new share count on map
```

## Data Flow — Stake

```
User toggles Stake on MyFarmsView
  → investService.stakeNft(tokenId)
  → POST /plantation-rounds/stake/:tokenId
  → Backend: updates StakingPosition in DB
             operator wallet calls GroveStaking.stake(tokenId)
             (works because PlantationRound auto-approved staking contract)
  → App: card shows "Earning" badge
```

---

## Crop Emoji + Fallback Image Map

| cropType | Emoji | Fallback image |
|----------|-------|----------------|
| avocado | 🥑 | `/assets/crops/avocado.jpg` |
| coffee | ☕ | `/assets/crops/coffee.jpg` |
| cocoa | 🍫 | `/assets/crops/cocoa.jpg` |
| olive | 🫒 | `/assets/crops/olive.jpg` |
| other | 🌿 | `/assets/crops/generic.jpg` |

---

## Psychological UX Rules

These are binding requirements, not suggestions:

1. **Default share count is 3** — pre-filled in bottom sheet. Users anchor to it.
2. **Live cost on invest button** — button label updates with every share count change: "Invest $150 cUSD"
3. **Social proof always visible** — "47 investors · 8 shares left" on every round card
4. **Scarcity signal** — when shares remaining < 10%: text turns danger color, adds "Almost gone"
5. **Estimated payout shown at every step** — discovery card, bottom sheet, confirm screen, portfolio card
6. **No jargon** — any occurrence of "NFT", "yield", "distribution", "round" in UI copy is a bug
7. **3-tap max to invest** — tap pin → tap Invest → tap Confirm. No extra screens.
8. **Harvest countdown** — portfolio cards show "Harvests in X months", not an ISO date
9. **Payout banner is unmissable** — DISTRIBUTING status = bright gold pulsing banner on the card

---

## Dependencies

- `react-native-maps` — MapView (already used in existing screens per exploration)
- `@gorhom/bottom-sheet` — RoundDetailBottomSheet
- `react-query` — data fetching, cache invalidation
- Existing: `GlassCard`, `GlassButton`, `GlassInput`, `COLORS`, `GRADIENT` from design-system

---

## Out of Scope (this spec)

- Secondary market / share-to-share trading between investors
- Notifications ("your farm is 80% funded")
- In-app price charts / historical APY data
- Multi-chain support
- Landing page Invest sections
- Governance / voting on harvest decisions
