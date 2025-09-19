# Profit Calculation Model for Trade Operations

## Overview
Agro-Trade operates as a trading intermediary, buying from sellers and reselling to buyers with a profit margin. The platform needs to calculate and display estimated profits during negotiations.

## Data Model Additions

### TradeOperation Extensions
```prisma
model TradeOperation {
  // Existing fields...
  
  // Pricing & Profit fields
  estimatedBuyingPrice    Decimal?  @map("estimated_buying_price") @db.Decimal(10, 2)
  estimatedSellingPrice   Decimal?  @map("estimated_selling_price") @db.Decimal(10, 2)
  actualBuyingPrice       Decimal?  @map("actual_buying_price") @db.Decimal(10, 2)
  actualSellingPrice      Decimal?  @map("actual_selling_price") @db.Decimal(10, 2)
  
  // Transport costs
  estimatedTransportCost  Decimal?  @map("estimated_transport_cost") @db.Decimal(10, 2)
  actualTransportCost     Decimal?  @map("actual_transport_cost") @db.Decimal(10, 2)
  totalDistanceKm         Float?    @map("total_distance_km")
  
  // Profit calculations
  estimatedGrossProfit    Decimal?  @map("estimated_gross_profit") @db.Decimal(10, 2)
  estimatedNetProfit      Decimal?  @map("estimated_net_profit") @db.Decimal(10, 2)
  actualGrossProfit       Decimal?  @map("actual_gross_profit") @db.Decimal(10, 2)
  actualNetProfit         Decimal?  @map("actual_net_profit") @db.Decimal(10, 2)
  profitMarginPercent     Float?    @map("profit_margin_percent")
}
```

### TransportCostSettings (New Model)
```prisma
model TransportCostSettings {
  id                String   @id @default(cuid())
  
  // Base rates
  baseRatePerKm     Decimal  @map("base_rate_per_km") @db.Decimal(10, 4) // €0.15 default
  
  // Modifiers by vehicle type
  flatbedMultiplier      Float @default(1.0) @map("flatbed_multiplier")
  refrigeratedMultiplier Float @default(1.3) @map("refrigerated_multiplier")
  tankerMultiplier       Float @default(1.2) @map("tanker_multiplier")
  
  // Distance-based pricing tiers
  tier1MaxKm        Int     @default(50) @map("tier1_max_km")
  tier1Rate         Decimal @map("tier1_rate") @db.Decimal(10, 4)
  tier2MaxKm        Int     @default(200) @map("tier2_max_km")
  tier2Rate         Decimal @map("tier2_rate") @db.Decimal(10, 4)
  tier3Rate         Decimal @map("tier3_rate") @db.Decimal(10, 4) // 200km+
  
  // Additional costs
  loadingCostPerTon Decimal @map("loading_cost_per_ton") @db.Decimal(10, 2)
  fuelSurcharge     Float   @map("fuel_surcharge") // Percentage
  
  effectiveFrom     DateTime @default(now()) @map("effective_from")
  effectiveTo       DateTime? @map("effective_to")
  
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")
  
  @@map("transport_cost_settings")
}
```

### ProfitCalculation (New Model for Audit)
```prisma
model ProfitCalculation {
  id                String   @id @default(cuid())
  
  tradeOperationId  String   @map("trade_operation_id")
  tradeOperation    TradeOperation @relation(fields: [tradeOperationId], references: [id])
  
  calculationType   CalculationType // INITIAL_ESTIMATE, NEGOTIATION_UPDATE, FINAL
  
  // Revenue side
  buyerPrice        Decimal  @map("buyer_price") @db.Decimal(10, 2)
  quantity          Decimal  @db.Decimal(10, 2)
  totalRevenue      Decimal  @map("total_revenue") @db.Decimal(10, 2)
  
  // Cost breakdown
  sellerCosts       Json     // Array of {sellerId, price, quantity, subtotal}
  totalPurchaseCost Decimal  @map("total_purchase_cost") @db.Decimal(10, 2)
  
  // Transport breakdown
  transportRoutes   Json     // Array of {from, to, distance, cost}
  totalDistance     Float    @map("total_distance")
  transportCost     Decimal  @map("transport_cost") @db.Decimal(10, 2)
  
  // Profit metrics
  grossProfit       Decimal  @map("gross_profit") @db.Decimal(10, 2)
  netProfit         Decimal  @map("net_profit") @db.Decimal(10, 2)
  profitMargin      Float    @map("profit_margin") // Percentage
  roi               Float    // Return on investment percentage
  
  // Risk factors
  priceVolatilityRisk Float? @map("price_volatility_risk") // 0-100 score
  transportRisk       Float? @map("transport_risk") // 0-100 score
  qualityRisk         Float? @map("quality_risk") // 0-100 score
  overallRisk         Float? @map("overall_risk") // 0-100 score
  
  calculatedBy      String   @map("calculated_by")
  user              User     @relation(fields: [calculatedBy], references: [id])
  
  notes             String?  @db.Text
  createdAt         DateTime @default(now()) @map("created_at")
  
  @@index([tradeOperationId])
  @@index([calculationType])
  @@map("profit_calculations")
}

enum CalculationType {
  INITIAL_ESTIMATE
  NEGOTIATION_UPDATE
  TRANSPORT_ADDED
  FINAL
}
```

## Profit Calculation Service

```typescript
interface ProfitCalculationService {
  
  // Calculate estimated profit for a potential trade
  calculateEstimatedProfit(params: {
    buyListingId: string;
    sellerOffers: Array<{
      saleListingId: string;
      negotiatedPrice: number;
      quantity: number;
      location: { lat: number; lng: number };
    }>;
    proposedBuyerPrice: number;
    vehicleType?: TruckType;
  }): Promise<ProfitEstimate>;
  
  // Update profit calculation during negotiation
  updateProfitCalculation(
    tradeOperationId: string,
    updates: Partial<ProfitCalculation>
  ): Promise<ProfitCalculation>;
  
  // Get profit scenarios for different price points
  getProfitScenarios(params: {
    tradeOperationId: string;
    buyerPriceRange: { min: number; max: number; step: number };
    sellerPriceRange: { min: number; max: number; step: number };
  }): Promise<ProfitScenario[]>;
  
  // Calculate optimal route for multi-pickup
  calculateOptimalRoute(params: {
    warehouseLocation: Coordinates;
    pickupPoints: Array<{ id: string; location: Coordinates; quantity: number }>;
    deliveryLocation: Coordinates;
  }): Promise<OptimalRoute>;
  
  // Estimate transport cost
  estimateTransportCost(params: {
    distanceKm: number;
    vehicleType: TruckType;
    quantityTons: number;
    urgency?: 'NORMAL' | 'EXPRESS';
  }): Promise<TransportCostEstimate>;
}
```

## API Endpoints for Profit Calculation

### GET /api/trade-operations/:id/profit-estimate
Returns current profit estimate for a trade operation

**Response:**
```json
{
  "success": true,
  "data": {
    "tradeOperationId": "trade-123",
    "estimates": {
      "revenue": {
        "buyerPrice": 380,
        "quantity": 100,
        "total": 38000
      },
      "costs": {
        "purchases": [
          {
            "sellerId": "seller-1",
            "sellerName": "Farm A",
            "price": 350,
            "quantity": 60,
            "subtotal": 21000
          },
          {
            "sellerId": "seller-2",
            "sellerName": "Farm B",
            "price": 355,
            "quantity": 40,
            "subtotal": 14200
          }
        ],
        "totalPurchases": 35200,
        "transport": {
          "distance": 140,
          "ratePerKm": 0.15,
          "total": 21
        },
        "totalCosts": 35221
      },
      "profit": {
        "gross": 2800,
        "net": 2779,
        "margin": 7.3,
        "roi": 7.9
      },
      "risks": {
        "priceVolatility": 25,
        "transport": 10,
        "quality": 15,
        "overall": 20
      }
    }
  }
}
```

### POST /api/trade-operations/:id/profit-scenarios
Calculate multiple profit scenarios for negotiation

**Request:**
```json
{
  "buyerPriceRange": { "min": 370, "max": 390, "step": 5 },
  "sellerPriceRange": { "min": 345, "max": 360, "step": 5 },
  "transportCostPerKm": 0.15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scenarios": [
      {
        "buyerPrice": 370,
        "sellerPrice": 345,
        "netProfit": 2479,
        "margin": 6.7,
        "feasible": true
      },
      {
        "buyerPrice": 380,
        "sellerPrice": 350,
        "netProfit": 2779,
        "margin": 7.3,
        "feasible": true,
        "recommended": true
      },
      {
        "buyerPrice": 390,
        "sellerPrice": 360,
        "netProfit": 2779,
        "margin": 7.1,
        "feasible": true
      }
    ],
    "optimalScenario": {
      "buyerPrice": 380,
      "sellerPrice": 350,
      "reason": "Best balance of profit margin and negotiation feasibility"
    }
  }
}
```

### GET /api/transport/calculate-route
Calculate optimal pickup route and costs

**Request:**
```json
{
  "warehouse": { "lat": 42.6977, "lng": 23.3219 },
  "pickups": [
    { "id": "seller-1", "location": { "lat": 42.7500, "lng": 23.3000 }, "quantity": 60 },
    { "id": "seller-2", "location": { "lat": 42.6800, "lng": 23.4000 }, "quantity": 40 }
  ],
  "delivery": { "lat": 42.6500, "lng": 23.2500 },
  "vehicleType": "FLATBED"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "optimalRoute": {
      "sequence": ["warehouse", "seller-1", "seller-2", "delivery"],
      "segments": [
        { "from": "warehouse", "to": "seller-1", "distance": 8.2, "duration": 15 },
        { "from": "seller-1", "to": "seller-2", "distance": 12.5, "duration": 20 },
        { "from": "seller-2", "to": "delivery", "distance": 15.3, "duration": 25 }
      ],
      "totalDistance": 36.0,
      "totalDuration": 60,
      "cost": {
        "distanceCost": 5.40,
        "loadingCost": 10.00,
        "totalCost": 15.40
      }
    },
    "alternativeRoutes": [
      {
        "sequence": ["warehouse", "seller-2", "seller-1", "delivery"],
        "totalDistance": 38.5,
        "totalCost": 16.28
      }
    ]
  }
}
```

## Frontend Component: Profit Calculator

```typescript
interface ProfitCalculatorProps {
  tradeOperationId: string;
  onPriceUpdate: (prices: PriceUpdate) => void;
}

const ProfitCalculator: React.FC<ProfitCalculatorProps> = ({ tradeOperationId }) => {
  return (
    <View className="bg-white rounded-lg p-4">
      <Text className="text-lg font-bold mb-4">Profit Estimation</Text>
      
      {/* Revenue Section */}
      <View className="mb-4">
        <Text className="font-semibold">Revenue</Text>
        <View className="flex-row justify-between">
          <Text>Selling to buyer:</Text>
          <Text className="font-bold text-green-600">€38,000</Text>
        </View>
      </View>
      
      {/* Costs Section */}
      <View className="mb-4">
        <Text className="font-semibold">Costs</Text>
        <View className="ml-2">
          <View className="flex-row justify-between">
            <Text>Purchase from sellers:</Text>
            <Text className="text-red-600">€35,200</Text>
          </View>
          <View className="flex-row justify-between">
            <Text>Transport (140km):</Text>
            <Text className="text-red-600">€21</Text>
          </View>
        </View>
      </View>
      
      {/* Profit Section */}
      <View className="border-t pt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="font-semibold">Net Profit:</Text>
          <Text className="font-bold text-green-600 text-xl">€2,779</Text>
        </View>
        <View className="flex-row justify-between">
          <Text>Profit Margin:</Text>
          <Text className="font-semibold">7.3%</Text>
        </View>
      </View>
      
      {/* Scenario Testing */}
      <TouchableOpacity className="mt-4 bg-blue-500 p-3 rounded">
        <Text className="text-white text-center">Test Price Scenarios</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Key Features for Admin Dashboard

1. **Real-time Profit Calculation**: Updates as negotiations progress
2. **Scenario Testing**: What-if analysis for different price points
3. **Route Optimization**: Minimize transport costs with optimal pickup sequences
4. **Risk Assessment**: Evaluate price volatility, quality, and transport risks
5. **Margin Targets**: Set minimum acceptable profit margins
6. **Historical Performance**: Track actual vs estimated profits

## Business Rules

1. **Minimum Profit Margin**: Trades should target at least 5% net margin
2. **Transport Cost Limits**: Transport should not exceed 10% of gross profit
3. **Price Negotiation Range**: 
   - Can negotiate buyer price down by max 15% from their max
   - Can negotiate seller price up by max 10% from their ask
4. **Risk Thresholds**: 
   - Overall risk score > 70: Requires senior approval
   - Overall risk score > 85: Trade not recommended