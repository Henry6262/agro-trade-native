#!/bin/bash

# Manual Test Script: Matching Dashboard - Offer Creation Workflow
#
# This script demonstrates the complete flow from PricingModal "Send Offers" button
# Week 1 Day 3-4 Milestone Verification

set -e

API_BASE="http://localhost:4001/api"

echo "========================================="
echo "Matching Dashboard - Offer Creation Test"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing the complete offer creation workflow...${NC}"
echo ""

# Step 1: Get test data IDs from database
echo "Step 1: Fetching test data from database..."
echo "----------------------------------------"

# Get a buy listing
BUY_LISTING=$(curl -s "${API_BASE}/trade-operations" | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data['data'][0]['buyListing']['id'] if data.get('data') and len(data['data']) > 0 else 'NONE')" 2>/dev/null || echo "NONE")

if [ "$BUY_LISTING" = "NONE" ]; then
  echo -e "${RED}✗ No buy listings found in database${NC}"
  echo "Please create test data first using the simulation module or Prisma Studio"
  exit 1
fi

echo -e "${GREEN}✓ Found buy listing: ${BUY_LISTING}${NC}"

# For demo purposes, we'll use mock seller IDs
# In production, these would come from the MatchingDashboard selection
SELLER_1_ID="test-seller-1"
SELLER_2_ID="test-seller-2"

echo ""
echo "Step 2: Calculate transport costs (PricingModal initial load)"
echo "-------------------------------------------------------------"

TRANSPORT_PAYLOAD='{
  "sellerIds": ["'${SELLER_1_ID}'", "'${SELLER_2_ID}'"],
  "buyerAddressId": "test-address-id"
}'

echo "Request:"
echo "$TRANSPORT_PAYLOAD" | python3 -m json.tool

# Note: This will fail without proper test data, but demonstrates the endpoint
TRANSPORT_RESPONSE=$(curl -s -X POST "${API_BASE}/trade-operations/calculate-transport" \
  -H "Content-Type: application/json" \
  -d "$TRANSPORT_PAYLOAD" || echo '{"error": "Expected - needs real seller addresses"}')

echo ""
echo "Response:"
echo "$TRANSPORT_RESPONSE" | python3 -m json.tool || echo "$TRANSPORT_RESPONSE"

echo ""
echo "Step 3: Create trade operation with offers (Send Offers button)"
echo "---------------------------------------------------------------"

CREATE_PAYLOAD='{
  "buyListingId": "'${BUY_LISTING}'",
  "sellers": [
    {
      "sellerId": "'${SELLER_1_ID}'",
      "saleListingId": "test-sale-1",
      "requestedQuantity": 60,
      "offerPrice": 305
    },
    {
      "sellerId": "'${SELLER_2_ID}'",
      "saleListingId": "test-sale-2",
      "requestedQuantity": 40,
      "offerPrice": 315
    }
  ]
}'

echo "Request:"
echo "$CREATE_PAYLOAD" | python3 -m json.tool

CREATE_RESPONSE=$(curl -s -X POST "${API_BASE}/trade-operations" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

echo ""
echo "Response:"
echo "$CREATE_RESPONSE" | python3 -m json.tool

# Check if trade operation was created
TRADE_OP_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('tradeOperationId', 'NONE'))" 2>/dev/null || echo "NONE")

if [ "$TRADE_OP_ID" != "NONE" ]; then
  echo ""
  echo -e "${GREEN}✓ Trade operation created successfully!${NC}"
  echo -e "${GREEN}  Operation ID: ${TRADE_OP_ID}${NC}"
  echo -e "${GREEN}  First 8 chars (for toast): ${TRADE_OP_ID:0:8}${NC}"

  echo ""
  echo "Step 4: Verify trade operation was persisted"
  echo "---------------------------------------------"

  VERIFY_RESPONSE=$(curl -s "${API_BASE}/trade-operations?limit=1")
  echo "$VERIFY_RESPONSE" | python3 -m json.tool | head -50

  echo ""
  echo -e "${GREEN}========================================="
  echo -e "✓ Offer Creation Workflow Test PASSED"
  echo -e "=========================================${NC}"
else
  echo ""
  echo -e "${RED}✗ Trade operation creation failed${NC}"
  echo "Error details:"
  echo "$CREATE_RESPONSE"
  echo ""
  echo -e "${RED}========================================="
  echo -e "✗ Offer Creation Workflow Test FAILED"
  echo -e "=========================================${NC}"
  exit 1
fi
