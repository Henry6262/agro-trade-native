# Alpha Vantage API Setup Guide

## Overview
We're using **Alpha Vantage** for real-time market data because it's:
- ✅ **Completely FREE** (no credit card required)
- ✅ Provides agricultural commodities (wheat, corn, etc.)
- ✅ Provides energy/fuel data (crude oil for diesel estimation)
- ✅ Includes currency exchange rates
- ✅ 25 requests per day on free tier (sufficient for our needs)

## Quick Setup

### 1. Get Your Free API Key
1. Go to: https://www.alphavantage.co/support/#api-key
2. Enter your email and click "GET FREE API KEY"
3. Copy your API key from the confirmation page

### 2. Add to Environment Variables
Add your API key to `/backend/.env`:
```bash
# Alpha Vantage API (FREE)
ALPHA_VANTAGE_API_KEY=your_api_key_here
```

### 3. Restart the Server
```bash
npm run start:dev
```

## What We're Getting

### Agricultural Commodities
- **WHEAT** - Price per bushel → converted to metric ton
- **CORN** - Price per bushel → converted to metric ton
- **COTTON** - Price per pound
- **SUGAR** - Price per pound
- **COFFEE** - Price per pound

### Energy (for Fuel Estimation)
- **WTI Crude Oil** - Used to estimate diesel prices
- **Brent Crude Oil** - Alternative crude oil benchmark
- **Natural Gas** - For potential future features

### Currency Exchange
- **EUR/USD** - For converting prices to Euros
- **USD/BGN** - For Bulgarian Lev conversion

## API Limits & Caching

### Free Tier Limits
- 25 API requests per day
- 5 API requests per minute

### Our Caching Strategy
- Prices are cached for **1 hour**
- Automatic refresh **3 times daily** (6am, 12pm, 6pm)
- Manual refresh available via `/api/market-data/refresh` endpoint

## How It Works

1. **With API Key**: Real market data from Alpha Vantage
2. **Without API Key**: Falls back to mock data with realistic variations

### Diesel Price Estimation
Since Alpha Vantage provides crude oil prices (not retail diesel):
```
Diesel Price = (Crude Oil Price / 42 gallons) × 1.3 + $0.50 refining margin
```

### Unit Conversions
- Wheat/Corn: Bushels → Metric Tons (×36.74 for wheat, ×39.37 for corn)
- Cotton/Sugar/Coffee: Pounds → Metric Tons (×2204.62)

## Testing the Integration

### Check if using real data:
```bash
curl http://localhost:4000/api/market-data/prices
```

Look for the log message in console:
- ✅ "Fetching real market data from Alpha Vantage..." = Using real data
- ⚠️ "Using mock data (no Alpha Vantage API key configured)" = Using mock data

### Available Endpoints

1. **Get Latest Prices**
   ```bash
   GET /api/market-data/prices
   ```

2. **Get Specific Commodity**
   ```bash
   GET /api/market-data/prices/WHEAT
   ```

3. **Get Historical Data**
   ```bash
   GET /api/market-data/prices/history/CORN?days=30
   ```

4. **Calculate Transport Cost**
   ```bash
   POST /api/market-data/transport-cost
   Body: { "distanceKm": 100, "weightTons": 25 }
   ```

5. **Get Market Summary**
   ```bash
   GET /api/market-data/summary
   ```

## Troubleshooting

### "Invalid API Key"
- Check your API key in `.env`
- Make sure there are no spaces or quotes around the key

### "Rate limit exceeded"
- You've hit the 25 requests/day limit
- Wait until the next day or use mock data for development

### Prices not updating
- Check cache duration (1 hour by default)
- Use `/api/market-data/refresh` to force update

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic commodity prices
- ✅ Diesel estimation from crude oil
- ✅ EUR/USD conversion

### Phase 2 (Planned)
- [ ] EU Weekly Oil Bulletin integration for local fuel prices
- [ ] Store historical data in database
- [ ] Price alerts when commodities hit thresholds

### Phase 3 (Future)
- [ ] Machine learning price predictions
- [ ] Seasonal trend analysis
- [ ] Multi-currency support (BGN, RON, etc.)

## Cost Analysis

### Alpha Vantage Free Tier
- **Cost**: $0/month forever
- **Requests**: 25/day (750/month)
- **Perfect for**: MVP and initial launch

### When to Upgrade
Consider paid tier ($49.99/month) when you have:
- 100+ daily active users
- Need for real-time updates
- Requirement for more commodities

## Support
- Alpha Vantage Docs: https://www.alphavantage.co/documentation/
- Community Forum: https://www.alphavantage.co/community/