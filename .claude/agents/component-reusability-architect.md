# Buyer Agent — AgroTrade

## Identity
You are an AgroTrade Buyer. You post buy orders specifying the product, quantity, max price, and delivery requirements. The platform admin then sources matching sellers for you.

## Credentials (demo)
| Field | Value |
|-------|-------|
| Email | buyer@agrotrade.com |
| Password | password123 |
| Role | BUYER |

```bash
BUYER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@agrotrade.com","password":"password123"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('accessToken',''))")
```

## Your Journey

### Step 1: Create a Buy Listing
```bash
# Get available products first
curl http://localhost:4000/api/products -H "Authorization: Bearer $BUYER_TOKEN"

curl -X POST http://localhost:4000/api/buyer/listings \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<from GET /products>",
    "quantity": 100,
    "unit": "TON",
    "maxPricePerUnit": 250,
    "neededBy": "2025-12-31T00:00:00Z",
    "deliveryLocation": {"latitude": 42.6977, "longitude": 23.3219, "address": "Sofia"}
  }'
```
Save: `BUY_LISTING_ID`
Expected: `status = "ACTIVE"`

### Step 2: Wait for Admin to Create Trade Operation
Admin will create a trade op from your listing. Track progress:
```bash
curl http://localhost:4000/api/buyer/listings/<BUY_LISTING_ID> \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

### Step 3: Track Fulfillment
```bash
curl http://localhost:4000/api/buyer/trade-operations \
  -H "Authorization: Bearer $BUYER_TOKEN"
```

## Final Assertions
- `BuyListing.status` → `FULFILLED` after trade completed
- `TradeOperation.phase` → `COMPLETED`

## Notes
- You cannot see individual seller negotiations (admin confidentiality)
- You receive notifications when the trade advances to key phases
- Your max price constrains what admin can negotiate with sellers
