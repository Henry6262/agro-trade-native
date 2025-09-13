#!/bin/bash

# Spec-Driven Development Commands for Agro-Trade

case "$1" in
    "buyer-request")
        echo "Creating buyer request specification..."
        echo '/specify Create a buyer request system where agricultural buyers can browse products, specify quality requirements (moisture, protein, grade), set quantity and delivery preferences, receive competitive offers from multiple sellers, and track order fulfillment through the platform.'
        ;;
    
    "seller-dashboard")
        echo "Creating seller dashboard specification..."
        echo '/specify Build a comprehensive seller dashboard that displays active listings, incoming buyer requests, offer management tools, inventory tracking across locations, pricing analytics, and performance metrics with real-time updates.'
        ;;
    
    "transport-bidding")
        echo "Creating transport bidding specification..."
        echo '/specify Implement a transport bidding system where logistics providers can view available shipments, submit competitive bids, manage fleet capacity, track active transfers, and receive automated route optimization suggestions.'
        ;;
    
    "pricing-engine")
        echo "Creating dynamic pricing engine specification..."
        echo '/specify Design a dynamic pricing engine that factors in regional market rates, transport costs, seasonal variations, bulk discounts, quality premiums, and competitor pricing to suggest optimal prices for sellers.'
        ;;
    
    "quality-matching")
        echo "Creating quality matching specification..."
        echo '/specify Create a quality specification matching system that compares buyer requirements with seller offerings, calculates match scores, suggests alternatives, and facilitates quality-based negotiations.'
        ;;
    
    *)
        echo "Available specifications:"
        echo "  ./sdd-commands.sh buyer-request    - Buyer request system"
        echo "  ./sdd-commands.sh seller-dashboard - Seller dashboard"
        echo "  ./sdd-commands.sh transport-bidding - Transport bidding"
        echo "  ./sdd-commands.sh pricing-engine   - Dynamic pricing"
        echo "  ./sdd-commands.sh quality-matching - Quality matching"
        ;;
esac
