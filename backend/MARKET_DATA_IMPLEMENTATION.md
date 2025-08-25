# Market Data Integration Plan for Agro Trade

## Overview
Integration of real-time market data for agricultural commodities and fuel prices to provide value to farmers, buyers, and transporters.

## Data Requirements

### 1. Agricultural Commodities (What we're trading)
- **Wheat** (Soft & Durum)
- **Corn/Maize**
- **Sunflower**
- **Barley**
- **Oats**
- **Rapeseed/Canola**
- **Peas**
- **Soybean/Soybean Meal**

### 2. Fuel Prices (For transporters)
- **Diesel** (retail prices)
- **Gasoline**
- **Crude Oil** (market trends)

### 3. Currency Exchange
- **EUR/USD**
- **EUR/BGN** (if targeting Bulgaria)
- **Local currencies**

## Recommended API Providers

### Tier 1: Comprehensive Solution (Best Overall)
**Commodities-API.com**
- ✅ All agricultural commodities
- ✅ Crude oil & energy futures
- ✅ Currency exchange rates
- ✅ Historical data
- 💰 Free tier: 100 requests/month
- 💰 Starter: $14.99/month (10,000 requests)
- 💰 Pro: $59.99/month (100,000 requests)

```json
// Example Response
{
  "data": {
    "success": true,
    "timestamp": 1703001600,
    "base": "USD",
    "rates": {
      "WHEAT": 245.50,    // USD per metric ton
      "CORN": 189.25,
      "SOYBEAN": 425.00,
      "DIESEL": 3.45,     // USD per gallon
      "EUR": 0.92
    }
  }
}
```

### Tier 2: Specialized Providers

#### Agricultural Data
**1. Alpha Vantage**
- Free tier: 5 API calls/minute
- Commodities via COMMODITY endpoint
- Good for wheat, corn, soybeans

**2. Barchart OnDemand**
- Professional grain market data
- Real-time futures prices
- More expensive but very reliable

#### Fuel Prices
**1. GlobalPetrolPrices.com**
- Retail fuel prices by country
- Weekly updates
- €29/month for API access

**2. EU Energy Price API**
- Official EU fuel price data
- Free but less frequent updates

### Tier 3: Free Alternatives (MVP)
**1. FAOSTAT (UN Food & Agriculture)**
- Free historical data
- Monthly updates only
- Good for baseline pricing

**2. Trading Economics**
- Limited free API
- 2000 requests/month free

## Implementation Phases

### Phase 1: MVP (Week 1-2)
**Goal:** Basic price display without real-time updates

```typescript
// 1. Create price model in schema.prisma
model MarketPrice {
  id          String   @id @default(cuid())
  commodity   String   // WHEAT, CORN, DIESEL, etc.
  price       Float
  currency    String   @default("USD")
  unit        String   // per ton, per liter, etc.
  source      String   // API provider name
  timestamp   DateTime
  createdAt   DateTime @default(now())
  
  @@index([commodity, timestamp])
  @@map("market_prices")
}

// 2. Create scheduled job to fetch daily
// src/market-data/market-data.service.ts
@Injectable()
export class MarketDataService {
  async fetchDailyPrices() {
    // Fetch from Commodities-API
    const response = await fetch(
      `https://commodities-api.com/api/latest?access_key=${API_KEY}&symbols=WHEAT,CORN,DIESEL`
    );
    // Store in database
  }
}

// 3. Expose via REST endpoint
@Get('market-prices')
async getLatestPrices() {
  return this.prisma.marketPrice.findMany({
    where: { 
      timestamp: { 
        gte: new Date(Date.now() - 24*60*60*1000) 
      }
    }
  });
}
```

### Phase 2: Enhanced Features (Week 3-4)
**Goal:** Historical charts and price alerts

```typescript
// 1. Historical data endpoint
@Get('market-prices/history')
async getPriceHistory(
  @Query('commodity') commodity: string,
  @Query('days') days: number = 30
) {
  return this.prisma.marketPrice.findMany({
    where: { 
      commodity,
      timestamp: { 
        gte: new Date(Date.now() - days*24*60*60*1000) 
      }
    },
    orderBy: { timestamp: 'asc' }
  });
}

// 2. Price alerts
model PriceAlert {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  commodity   String
  condition   String   // ABOVE, BELOW, CHANGE_PERCENT
  threshold   Float
  isActive    Boolean  @default(true)
  lastTriggered DateTime?
  
  @@map("price_alerts")
}
```

### Phase 3: Advanced Integration (Month 2)
**Goal:** Transport cost calculator with fuel prices

```typescript
// Calculate transport costs based on distance and fuel prices
async calculateTransportCost(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  weight: number // in tons
) {
  // Get distance (using Google Maps or similar)
  const distance = await this.getDistance(fromLat, fromLng, toLat, toLng);
  
  // Get current diesel price
  const dieselPrice = await this.prisma.marketPrice.findFirst({
    where: { commodity: 'DIESEL' },
    orderBy: { timestamp: 'desc' }
  });
  
  // Calculate fuel consumption (avg 30L/100km for loaded truck)
  const fuelNeeded = (distance / 100) * 30;
  const fuelCost = fuelNeeded * dieselPrice.price;
  
  // Add other costs (driver, maintenance, margin)
  const totalCost = fuelCost * 1.5; // Simple multiplier
  
  return {
    distance,
    fuelNeeded,
    fuelCost,
    totalCost,
    costPerTon: totalCost / weight
  };
}
```

## Environment Variables

```env
# Market Data APIs
COMMODITIES_API_KEY=your_api_key_here
COMMODITIES_API_URL=https://commodities-api.com/api/

# Optional providers
ALPHA_VANTAGE_KEY=your_key_here
GLOBALPETROLPRICES_KEY=your_key_here

# Cache settings
MARKET_DATA_CACHE_TTL=3600 # 1 hour in seconds
MARKET_DATA_UPDATE_CRON=0 6,12,18 * * * # 3 times daily
```

## Frontend Integration

```typescript
// React Native component example
const MarketPriceWidget = () => {
  const [prices, setPrices] = useState([]);
  
  useEffect(() => {
    fetch('/api/market-prices')
      .then(res => res.json())
      .then(setPrices);
  }, []);
  
  return (
    <View>
      <Text style={styles.title}>Today's Market Prices</Text>
      {prices.map(price => (
        <PriceCard 
          key={price.commodity}
          commodity={price.commodity}
          price={price.price}
          unit={price.unit}
          change={price.changePercent}
        />
      ))}
    </View>
  );
};
```

## Cost-Benefit Analysis

### Option 1: Commodities-API (Recommended)
- **Cost:** $15-60/month
- **Benefit:** All data in one place, reliable, easy integration
- **ROI:** High - single integration covers all needs

### Option 2: Multiple Free APIs
- **Cost:** $0
- **Benefit:** No direct cost
- **Downside:** Complex integration, rate limits, less reliable

### Option 3: Premium Providers (Barchart, Bloomberg)
- **Cost:** $500+/month
- **Benefit:** Professional-grade data
- **Use case:** Only when you have 1000+ paying users

## Implementation Checklist

### Week 1
- [ ] Sign up for Commodities-API free trial
- [ ] Add MarketPrice model to schema
- [ ] Create market-data module in NestJS
- [ ] Implement basic fetch service
- [ ] Add cron job for daily updates
- [ ] Create REST endpoints

### Week 2
- [ ] Add caching layer (Redis)
- [ ] Implement historical data storage
- [ ] Create price comparison logic
- [ ] Add percentage change calculations

### Week 3
- [ ] Build price alert system
- [ ] Add WebSocket for real-time updates
- [ ] Create transport cost calculator
- [ ] Implement currency conversion

### Week 4
- [ ] Add data visualization (charts)
- [ ] Create market insights dashboard
- [ ] Implement predictive analytics (basic)
- [ ] Add export functionality

## Sample API Integration

```typescript
// src/market-data/commodities-api.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CommoditiesApiService {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get('COMMODITIES_API_KEY');
    this.baseUrl = 'https://commodities-api.com/api';
  }

  async getLatestPrices(symbols: string[]) {
    const response = await this.httpService.get(
      `${this.baseUrl}/latest`,
      {
        params: {
          access_key: this.apiKey,
          symbols: symbols.join(','),
        },
      }
    ).toPromise();

    return this.transformResponse(response.data);
  }

  async getHistoricalPrices(date: string, symbols: string[]) {
    const response = await this.httpService.get(
      `${this.baseUrl}/${date}`,
      {
        params: {
          access_key: this.apiKey,
          symbols: symbols.join(','),
        },
      }
    ).toPromise();

    return this.transformResponse(response.data);
  }

  private transformResponse(data: any) {
    const { timestamp, rates } = data;
    
    return Object.entries(rates).map(([commodity, price]) => ({
      commodity,
      price: price as number,
      timestamp: new Date(timestamp * 1000),
      unit: this.getUnit(commodity),
    }));
  }

  private getUnit(commodity: string): string {
    const units = {
      WHEAT: 'USD/ton',
      CORN: 'USD/ton',
      DIESEL: 'USD/gallon',
      EUR: 'USD/EUR',
    };
    return units[commodity] || 'USD/unit';
  }
}
```

## Key Decisions Needed

1. **Primary API Provider?**
   - Commodities-API (recommended for balance of features/cost)
   - Multiple free APIs (more complex but $0)
   - Premium provider (when scaling)

2. **Update Frequency?**
   - Real-time (expensive, WebSocket)
   - Hourly (good balance)
   - Daily (sufficient for MVP)

3. **Historical Data Depth?**
   - 30 days (free tier usually)
   - 1 year (paid tier)
   - All-time (premium tier)

4. **Caching Strategy?**
   - In-memory (simple)
   - Redis (recommended)
   - Database (for historical)

## ROI Calculation

**Investment:** $15-60/month for API
**Value Added:**
- Transport cost accuracy → 5% margin improvement
- Price alerts → Better timing on trades
- Market insights → Competitive advantage

**Break-even:** 2-3 paying users at $20/month subscription

## Next Steps

1. **Immediate:** Sign up for Commodities-API free trial
2. **Today:** Implement basic price fetching
3. **This Week:** Deploy MVP with daily updates
4. **Next Sprint:** Add advanced features based on user feedback