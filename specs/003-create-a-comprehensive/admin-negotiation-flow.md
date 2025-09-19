# Admin Negotiation Flow with Profit Calculation

## Negotiation Dashboard Overview

The admin acts as the intermediary, negotiating with both buyers and sellers to maximize profit while ensuring fair deals for all parties.

## Step-by-Step Negotiation Process

### Step 1: Buyer Request Analysis
```
BUYER REQUEST:
- Product: Wheat (Grade A)
- Quantity: 100 tons
- Max Price: €400/ton
- Delivery: Sofia, Bulgaria
- Deadline: 30 days

INITIAL REVENUE POTENTIAL: €40,000
```

### Step 2: Find Available Sellers
```
MATCHING SELLERS:
┌─────────────────────────────────────────────────┐
│ Seller A (Farm Veliko)                         │
│ - Available: 60 tons                           │
│ - Asking Price: €360/ton                       │
│ - Distance: 50km from buyer                    │
│ - Quality: Verified ✓                          │
├─────────────────────────────────────────────────┤
│ Seller B (Farm Plovdiv)                        │
│ - Available: 50 tons                           │
│ - Asking Price: €365/ton                       │
│ - Distance: 70km from buyer                    │
│ - Quality: Verified ✓                          │
├─────────────────────────────────────────────────┤
│ Seller C (Farm Ruse)                           │
│ - Available: 40 tons                           │
│ - Asking Price: €355/ton                       │
│ - Distance: 120km from buyer                   │
│ - Quality: Unverified ⚠️                       │
└─────────────────────────────────────────────────┘
```

### Step 3: Initial Profit Calculation
```
SCENARIO 1: Sellers A + B (110 tons available)
────────────────────────────────────────────────
Revenue:
  Sell to buyer: 100 tons × €400 = €40,000

Costs:
  Buy from A: 60 tons × €360 = €21,600
  Buy from B: 40 tons × €365 = €14,600
  Total Purchase: €36,200
  
  Transport: 
    Route: Warehouse → A (50km) → B (20km) → Buyer (70km)
    Total: 140km × €0.15 = €21
  
ESTIMATED PROFIT: €3,779 (9.4% margin) ✓

SCENARIO 2: Sellers A + C (100 tons exactly)
────────────────────────────────────────────────
Revenue:
  Sell to buyer: 100 tons × €400 = €40,000

Costs:
  Buy from A: 60 tons × €360 = €21,600
  Buy from C: 40 tons × €355 = €14,200
  Total Purchase: €35,800
  
  Transport:
    Route: Warehouse → A (50km) → C (70km) → Buyer (120km)
    Total: 240km × €0.15 = €36
  
ESTIMATED PROFIT: €4,164 (10.4% margin) ✓
Note: Requires inspection for Seller C (adds 2-3 days)
```

### Step 4: Negotiation Strategy Dashboard

```
┌──────────────────────────────────────────────────────────┐
│                 NEGOTIATION CONTROL PANEL                 │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ BUYER NEGOTIATION                                        │
│ Current Ask: €400/ton                                    │
│ ┌─────────────────────────────────────┐                 │
│ │ Our Offer:  [€380]  €360 ────── €400 │                 │
│ └─────────────────────────────────────┘                 │
│ Suggested: €380 (Still below their max)                  │
│                                                           │
│ SELLER A NEGOTIATION                                     │
│ Current Ask: €360/ton                                    │
│ ┌─────────────────────────────────────┐                 │
│ │ Our Offer:  [€350]  €340 ────── €360 │                 │
│ └─────────────────────────────────────┘                 │
│ Suggested: €350 (Fair reduction)                         │
│                                                           │
│ SELLER B NEGOTIATION                                     │
│ Current Ask: €365/ton                                    │
│ ┌─────────────────────────────────────┐                 │
│ │ Our Offer:  [€355]  €345 ────── €365 │                 │
│ └─────────────────────────────────────┘                 │
│ Suggested: €355 (Moderate reduction)                     │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                  LIVE PROFIT CALCULATION                  │
├──────────────────────────────────────────────────────────┤
│ Revenue:    100 tons × €380 = €38,000                   │
│ Costs:      60t×€350 + 40t×€355 = €35,200               │
│ Transport:  140km × €0.15 = €21                          │
│ ─────────────────────────────────────────               │
│ NET PROFIT: €2,779 (7.3% margin) ✓                      │
│                                                           │
│ [Update Calculation] [Send All Offers] [View Scenarios]  │
└──────────────────────────────────────────────────────────┘
```

### Step 5: Negotiation Rounds Tracking

```
NEGOTIATION TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Round 1 (10:00 AM)
├─→ TO BUYER: Offered €385/ton
│   Response: Counter at €375/ton ⏱️
├─→ TO SELLER A: Offered €345/ton
│   Response: Counter at €355/ton ⏱️
└─→ TO SELLER B: Offered €350/ton
    Response: Accepted ✓

Round 2 (10:30 AM)
├─→ TO BUYER: Offered €380/ton
│   Response: Thinking... ⏱️
└─→ TO SELLER A: Offered €350/ton
    Response: Accepted ✓

Round 3 (11:00 AM)
└─→ TO BUYER: Final €380/ton
    Response: Accepted ✓

FINAL AGREEMENT:
• Buying: 60t@€350 + 40t@€350 = €35,000
• Selling: 100t@€380 = €38,000
• Transport: €21
• Net Profit: €2,979 (7.8% margin) ✓
```

### Step 6: Profit Scenario Testing

```
┌────────────────────────────────────────────────────────┐
│              PROFIT SCENARIO ANALYZER                   │
├────────────────────────────────────────────────────────┤
│                                                         │
│ Test Different Price Points:                           │
│                                                         │
│         Seller Price                                   │
│         €340  €345  €350  €355  €360                  │
│   €370 │ 6.8%  5.5%  4.2%  2.9%  1.6% │              │
│ B €375 │ 8.1%  6.8%  5.5%  4.2%  2.9% │              │
│ u €380 │ 9.5%  8.2%  6.8%  5.5%  4.2% │ ← Current    │
│ y €385 │10.8%  9.5%  8.2%  6.8%  5.5% │              │
│ e €390 │12.1% 10.8%  9.5%  8.2%  6.8% │              │
│ r €395 │13.4% 12.1% 10.8%  9.5%  8.2% │              │
│                                                         │
│ Legend: [<5%] [5-7%] [7-10%] [>10%]                   │
│         Poor   Fair   Good    Excellent                │
│                                                         │
│ Transport Cost Impact:                                 │
│ Base (140km): €21                                      │
│ Express (+30%): €27.30                                 │
│ Delayed (-20%): €16.80                                 │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Step 7: Risk Assessment

```
TRADE RISK ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Price Volatility Risk: ████░░░░░░ 40%
- Wheat prices stable over last 30 days
- Seasonal factors favorable

Quality Risk: ██░░░░░░░░ 20%
- Both sellers verified
- Recent positive inspections

Transport Risk: █░░░░░░░░░ 10%
- Short distance (140km)
- Multiple backup transporters available

Payment Risk: ██░░░░░░░░ 20%
- Buyer: Established, good payment history
- Sellers: Regular suppliers

Overall Risk Score: ██░░░░░░░░ 25% (LOW)
Recommendation: PROCEED WITH TRADE ✓
```

## Key Features for Admin

### 1. Real-Time Profit Updates
As you adjust prices in negotiations, the profit calculation updates instantly:

```javascript
// When admin changes offer price
onPriceChange = (party, newPrice) => {
  if (party === 'BUYER') {
    revenue = quantity * newPrice;
  } else {
    costs = recalculatePurchaseCosts();
  }
  
  netProfit = revenue - costs - transportCost;
  profitMargin = (netProfit / revenue) * 100;
  
  updateDisplay();
  checkMinimumMargin();
};
```

### 2. Negotiation Templates
Quick negotiation strategies based on market conditions:

- **Aggressive**: Target 10%+ margin
- **Balanced**: Target 7-8% margin  
- **Conservative**: Target 5-6% margin
- **Volume Play**: Lower margin, higher volume

### 3. Multi-Party Chat Interface
```
┌─────────────────────────────────────────┐
│ NEGOTIATION CHAT - Seller A            │
├─────────────────────────────────────────┤
│ You: We can offer €345/ton for your    │
│      60 tons of Grade A wheat          │
│                                         │
│ Seller A: That's below market. Our     │
│           minimum is €355/ton          │
│                                         │
│ You: Considering the volume and quick  │
│      payment, can we meet at €350?     │
│                                         │
│ [Typing...] Send Offer: €[350] [Send]  │
└─────────────────────────────────────────┘
```

### 4. Automated Suggestions
The system suggests optimal negotiation moves:

```
💡 SUGGESTION: 
Seller A seems flexible. Offering €350 (down from €360) 
maintains 7.3% margin while likely to be accepted.

💡 TRANSPORT TIP:
Combining pickups from Sellers A & B saves 25km 
vs. separate trips (€3.75 savings).

⚠️ WARNING:
Buyer's deadline is in 5 days. Finalize negotiations 
within 24 hours to ensure timely delivery.
```

## Commission Model Removal

Since Agro-Trade is buying and selling directly:

**OLD MODEL** (Marketplace with commission):
```
Seller gets: €350 - (€350 × 2.5%) = €341.25
Buyer pays: €380 + (€380 × 1.5%) = €385.70
Platform earns: €8.75 + €5.70 = €14.45
```

**NEW MODEL** (Direct trading):
```
Agro-Trade pays seller: €350
Agro-Trade charges buyer: €380
Agro-Trade profit: €30 - transport costs
```

This model gives Agro-Trade:
- Full control over pricing
- Better profit margins
- Direct relationships with both parties
- Ability to optimize for volume or margin
- Risk management through diversification