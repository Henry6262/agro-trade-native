# Implementation Plan v2: Trade Operation Management System (Trading Intermediary Model)

**Branch**: `003-create-a-comprehensive` | **Date**: 2025-09-14 | **Version**: 2.0
**Critical Change**: Agro-Trade operates as a trading intermediary, not a marketplace

## Executive Summary

Agro-Trade buys agricultural products from farmers and resells to buyers at a profit. The platform needs to:
1. Calculate profit margins in real-time during negotiations
2. Estimate transport costs accurately (€0.15/km base rate)
3. Optimize multi-seller pickup routes
4. Track both estimated and actual profits
5. Support admin negotiating with both buyers and sellers simultaneously

## Core Business Model

```
PROFIT = Selling Price - (Purchase Price + Transport Costs)
```

- **NO commission system** - we buy and resell directly
- **Target margin**: 5-10% net profit
- **Transport cost**: €0.15/km base rate (adjustable by vehicle type)
- **Risk**: We own inventory between purchase and sale

## Updated Technical Context

**Stack**: TypeScript, React Native, NestJS, Prisma, PostgreSQL with PostGIS
**Key Services Needed**:
- Profit Calculation Service
- Transport Cost Estimation Service  
- Route Optimization Service
- Price Negotiation Tracking
- Risk Assessment Service

## Critical Schema Changes Required

### Remove from TradeOperation:
- `commissionAmount` field (no longer relevant)
- Commission calculation logic

### Add to TradeOperation:
```prisma
// Buying side (what we pay sellers)
totalPurchaseCost    Decimal?  // Sum of all seller payments
avgPurchasePrice     Decimal?  // Weighted average purchase price

// Selling side (what buyer pays us)
sellingPrice         Decimal?  // Per unit selling price to buyer
totalRevenue         Decimal?  // Total amount from buyer

// Transport costs
estimatedTransportCost  Decimal?
actualTransportCost     Decimal?
totalDistanceKm         Float?

// Profit metrics
estimatedProfit      Decimal?  // Before trade execution
actualProfit         Decimal?  // After completion
profitMargin         Float?    // Percentage
```

### New Models Needed:

1. **TransportCostCalculation**
```prisma
model TransportCostCalculation {
  id                String   @id
  tradeOperationId  String
  
  // Route details
  pickupPoints      Json     // Array of pickup locations
  deliveryPoint     Json     // Delivery location
  optimalRoute      Json     // Calculated optimal sequence
  totalDistance     Float    // Total km
  
  // Cost breakdown
  baseRate          Decimal  // €/km rate used
  distanceCost      Decimal  // distance * rate
  loadingCosts      Decimal  // Additional loading fees
  totalCost         Decimal  // Final transport cost
  
  calculatedAt      DateTime
}
```

2. **ProfitEstimation**
```prisma
model ProfitEstimation {
  id                String   @id
  tradeOperationId  String
  
  // Snapshot of negotiation state
  proposedBuyerPrice   Decimal
  proposedSellerPrices Json    // Array of seller prices
  
  // Calculated metrics
  estimatedRevenue     Decimal
  estimatedCosts       Decimal
  estimatedProfit      Decimal
  profitMargin         Float
  
  // Risk factors
  priceVolatilityRisk  Float
  qualityRisk          Float
  transportRisk        Float
  
  createdBy            String  // Admin who created estimate
  createdAt            DateTime
}
```

## Updated API Endpoints

### Core Trade Operations (Modified)

#### POST /api/trade-operations
Create trade with profit focus (not commission)
```json
{
  "buyListingId": "buy-123",
  "targetProfit": 2000,
  "maxPurchasePrice": 350,
  "proposedSellingPrice": 380
}
```

#### GET /api/trade-operations/:id/profit
Real-time profit calculation
```json
{
  "revenue": 38000,
  "costs": {
    "purchases": 35000,
    "transport": 150
  },
  "profit": 2850,
  "margin": 7.5
}
```

### New Endpoints for Trading Model

#### POST /api/trade-operations/:id/calculate-profit
Calculate profit with current negotiation prices
```json
{
  "buyerPrice": 380,
  "sellerPrices": [
    { "sellerId": "s1", "price": 350, "quantity": 60 },
    { "sellerId": "s2", "price": 355, "quantity": 40 }
  ]
}
```

#### POST /api/transport/estimate-cost
Estimate transport cost for route
```json
{
  "pickupPoints": [
    { "lat": 42.1, "lng": 23.2, "quantity": 60 },
    { "lat": 42.3, "lng": 23.4, "quantity": 40 }
  ],
  "deliveryPoint": { "lat": 42.5, "lng": 23.6 },
  "vehicleType": "FLATBED"
}
```

#### GET /api/transport/optimize-route
Get optimal pickup sequence
```json
{
  "warehouseLocation": { "lat": 42.0, "lng": 23.0 },
  "pickups": [...],
  "delivery": { "lat": 42.5, "lng": 23.6 }
}
```

#### POST /api/trade-operations/:id/price-scenarios
Test multiple price combinations
```json
{
  "buyerPriceRange": { "min": 370, "max": 390, "step": 5 },
  "sellerPriceRange": { "min": 345, "max": 360, "step": 5 }
}
```

## Updated Service Architecture

### 1. ProfitCalculationService
```typescript
class ProfitCalculationService {
  calculateProfit(trade: TradeOperation): ProfitCalculation
  estimateProfit(params: EstimationParams): ProfitEstimate
  compareScenarios(scenarios: PriceScenario[]): ScenarioComparison
  trackProfitHistory(tradeId: string): ProfitHistory[]
}
```

### 2. TransportCostService
```typescript
class TransportCostService {
  estimateCost(distance: number, vehicle: TruckType): number
  calculateRoute(points: Location[]): RouteCalculation
  optimizeMultiPickup(pickups: Pickup[]): OptimalRoute
  getDistanceMatrix(origins: Location[], destinations: Location[]): DistanceMatrix
}
```

### 3. NegotiationService (Modified)
```typescript
class NegotiationService {
  negotiateWithBuyer(tradeId: string, price: number): NegotiationRound
  negotiateWithSeller(sellerId: string, price: number): NegotiationRound
  trackProfitImpact(negotiation: Negotiation): ProfitImpact
  suggestOptimalPrices(trade: TradeOperation): PriceSuggestion
}
```

## Updated Business Rules

### Profit Requirements
- **Minimum margin**: 5% net profit
- **Target margin**: 7-10% for standard trades
- **High-volume margin**: 3-5% acceptable for large orders

### Price Negotiation Limits
- **Buyer negotiation**: Can offer 10-20% below their max price
- **Seller negotiation**: Can offer 5-10% below their asking price
- **Walk-away points**: Set maximum purchase prices per product

### Transport Cost Management
- **Base rate**: €0.15/km for standard transport
- **Express delivery**: +30% surcharge
- **Bulk discount**: -10% for >100 tons
- **Maximum transport cost**: Should not exceed 25% of gross profit

## Risk Management

### Price Risk
- Track market price trends
- Set maximum holding periods
- Implement stop-loss triggers if margins compress

### Quality Risk
- Require inspection for unverified sellers
- Adjust prices based on quality scores
- Reserve right to reject on quality grounds

### Transport Risk
- Multiple transporter options
- Insurance requirements
- Penalty clauses for delays

## Migration Strategy

### Phase 1: Schema Updates
1. Add profit calculation fields to TradeOperation
2. Create transport cost models
3. Remove commission-related fields
4. Add profit estimation tables

### Phase 2: Service Implementation
1. Implement TransportCostService
2. Build ProfitCalculationService
3. Update NegotiationService for dual-party negotiation
4. Create route optimization logic

### Phase 3: API Updates
1. Modify existing endpoints to remove commission logic
2. Add new profit calculation endpoints
3. Implement transport cost estimation APIs
4. Add price scenario testing endpoints

### Phase 4: Testing
1. Unit tests for profit calculations
2. Integration tests for complete trade flows with profit
3. Performance tests for route optimization
4. Scenario testing for various price combinations

## Success Metrics

- **Profit margins**: Achieve 7-10% average net margin
- **Negotiation success**: 70%+ acceptance rate on offers
- **Transport efficiency**: <€0.20/km average cost
- **Trade completion**: 90%+ successful completion rate
- **Response time**: <2s for profit calculations

## Next Steps

1. **Update Prisma schema** to reflect trading model (remove commission, add profit fields)
2. **Create transport cost calculation** with PostGIS integration
3. **Build profit calculation service** with real-time updates
4. **Implement route optimization** using graph algorithms
5. **Update contract tests** to reflect new business model
6. **Modify integration tests** for profit-focused flow

## Rollback Plan

If the trading model doesn't work:
1. Keep commission fields (deprecated but available)
2. Add feature flag to switch between models
3. Maintain audit trail of all transactions
4. Can revert to marketplace model with historical data intact

---
*This plan supersedes the original commission-based marketplace model*