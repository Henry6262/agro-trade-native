#!/bin/bash
set -e

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbW9yaHEyYnIwMDBjNndiNXo5eDQ1NTh1IiwiZW1haWwiOiJhZG1pbkBhZ3JvdHJhZGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzc3OTE2NzQyLCJleHAiOjE3Nzg1MjE1NDJ9.Gtjg0e95v12HCvzd2QJrhCMPhLCA9YEmSu_uAj6Cz9Q"
API="http://localhost:4000/api"
PRODUCT_ID="cmorh7o9j001t79ewkp04tddp"  # soft_wheat

echo "🌾 AgroTrade Golden Path E2E Test"
echo "=================================="
echo ""

# 1. Create buyer
echo "[1/7] Creating buyer..."
BUYER=$(curl -s -X POST "$API/simulation/users/create-test-user" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"role":"BUYER","name":"Golden Path Buyer"}')
BUYER_ID=$(echo $BUYER | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    ✅ Buyer: $BUYER_ID"

# 2. Create farmer
echo "[2/7] Creating farmer..."
FARMER=$(curl -s -X POST "$API/simulation/users/create-test-user" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"role":"FARMER","name":"Golden Path Farmer"}')
FARMER_ID=$(echo $FARMER | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    ✅ Farmer: $FARMER_ID"

# 3. Create buy listing
echo "[3/7] Creating buy listing..."
LISTING=$(curl -s -X POST "$API/simulation/buyer/$BUYER_ID/create-listing" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":100,\"maxPricePerUnit\":250,\"unit\":\"TON\"}")
LISTING_ID=$(echo $LISTING | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    ✅ Listing: $LISTING_ID"

# 4. Create trade operation
echo "[4/7] Creating trade operation..."
TRADE=$(curl -s -X POST "$API/simulation/admin/create-trade-operation" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"buyListingId\":\"$LISTING_ID\",\"adminMargin\":15,\"buyerCommission\":2,\"sellerCommission\":3}")
TRADE_ID=$(echo $TRADE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    ✅ Trade Op: $TRADE_ID"

# 5. Create farmer sale listing
echo "[5/7] Creating farmer sale listing..."
SALE=$(curl -s -X POST "$API/simulation/admin/farmer/$FARMER_ID/create-sale-listing" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"productCategory\":\"SOFT_WHEAT\",\"quantity\":100,\"pricePerUnit\":200}")
SALE_ID=$(echo $SALE | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "    ✅ Sale Listing: $SALE_ID"

# 6. Send offers
echo "[6/7] Sending offers to farmer..."
OFFERS=$(curl -s -X POST "$API/simulation/admin/send-offers" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"tradeOperationId\":\"$TRADE_ID\",\"offers\":[{\"farmerId\":\"$FARMER_ID\",\"saleListingId\":\"$SALE_ID\",\"requestedQuantity\":100,\"offeredPrice\":220}]}")
NEGO_ID=$(echo $OFFERS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('negotiations',[{}])[0].get('id',''))")
echo "    ✅ Negotiation: $NEGO_ID"

# 7. Farmer accepts offer
echo "[7/7] Farmer accepting offer..."
ACCEPT=$(curl -s -X POST "$API/simulation/seller/$FARMER_ID/accept-offer" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"negotiationId\":\"$NEGO_ID\"}")
echo "    ✅ Acceptance: $(echo $ACCEPT | python3 -c "import sys,json; print(json.load(sys.stdin).get('message','done'))")"

# Verify final state
echo ""
echo "📊 Final Trade State"
echo "===================="
STATE=$(curl -s "$API/simulation/trade-operation/$TRADE_ID/full-state" -H "Authorization: Bearer $TOKEN")
python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d.get('state', {})
a = d.get('actors', {})
print(f\"Phase:        {s.get('phase', 'N/A')}\")
print(f\"Status:       {s.get('status', 'N/A')}\")
print(f\"Quantity:     {s.get('totalQuantityNeeded', 0)} TON needed\")
print(f\"Secured:      {s.get('securedQuantity', 0)} TON secured\")
print(f\"Gap:          {s.get('quantityGap', 0)} TON\")
print(f\"Pending Nego: {s.get('pendingNegotiations', 0)}\")
print(f\"Buyer:        {a.get('buyer',{}).get('name','N/A')}\")
sellers = a.get('sellers', [])
if sellers:
    print(f\"Seller:       {sellers[0].get('name','N/A')} ({sellers[0].get('tradeSellerStatus','N/A')})\")
" <<< "$STATE"

echo ""
echo "🎉 Golden path completed successfully!"
