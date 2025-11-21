#!/bin/bash

# Test script for offer creation endpoints

API_BASE="http://localhost:3000/api"

echo "===================="
echo "Testing Offer Creation API"
echo "====================\n"

# Step 1: Create a trade operation with sellers and offers
echo "1. Creating trade operation with sellers and initial offers..."

RESPONSE=$(curl -s -X POST "$API_BASE/trade-operations" \
  -H "Content-Type: application/json" \
  -d '{
    "buyListingId": "replace_with_actual_buy_listing_id",
    "sellers": [
      {
        "saleListingId": "replace_with_actual_sale_listing_id_1",
        "sellerId": "replace_with_actual_seller_id_1",
        "quantity": 100,
        "offerPrice": 340
      },
      {
        "saleListingId": "replace_with_actual_sale_listing_id_2",
        "sellerId": "replace_with_actual_seller_id_2",
        "quantity": 150,
        "offerPrice": 345
      }
    ]
  }')

echo "$RESPONSE" | json_pp
echo "\n"

# Extract trade operation ID
TRADE_OP_ID=$(echo "$RESPONSE" | grep -o '"tradeOperationId":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TRADE_OP_ID" ]; then
  echo "Created trade operation: $TRADE_OP_ID\n"

  # Step 2: Get all active trade operations
  echo "2. Getting all active trade operations..."
  curl -s -X GET "$API_BASE/trade-operations?status=ACTIVE" | json_pp
  echo "\n"

  # Step 3: Get specific trade operation with negotiations
  echo "3. Getting trade operation details..."
  curl -s -X GET "$API_BASE/trade-operations?status=ACTIVE&phase=SELLER_NEGOTIATION" | json_pp
  echo "\n"
else
  echo "Error: Failed to create trade operation"
  echo "Response: $RESPONSE"
fi

echo "\n===================="
echo "Testing Complete"
echo "====================\n"
