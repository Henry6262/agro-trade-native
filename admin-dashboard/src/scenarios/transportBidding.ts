export const getTransportBiddingScenario = () => [
  {
    step: 1,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 0,
      companyName: 'Green Valley Farms',
      productType: 'Wheat',
      quantity: 40,
      pricePerTon: 175,
      location: { lat: 52.3676, lng: 4.9041, address: 'Amsterdam, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 2,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 1,
      companyName: 'Sunrise Agriculture',
      productType: 'Wheat',
      quantity: 30,
      pricePerTon: 180,
      location: { lat: 52.0907, lng: 5.1214, address: 'Utrecht, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 3,
    actor: 'buyer' as const,
    action: 'createBuyListing',
    data: {
      buyerIndex: 0,
      companyName: 'Dutch Mills Corporation',
      productType: 'Wheat',
      quantity: 60,
      maxPricePerTon: 200,
      location: { lat: 51.9225, lng: 4.4792, address: 'Rotterdam, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 4,
    actor: 'admin' as const,
    action: 'createTradeOperation',
    data: {
      buyListingIndex: 0,
      targetMargin: 10,
      estimatedTransportCost: 750
    },
    status: 'in_progress' as const
  },
  {
    step: 5,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 0,
      quantity: 40,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 6,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 1,
      quantity: 20,
      pricePerTon: 180
    },
    status: 'pending' as const
  },
  {
    step: 7,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 0,
      negotiationIndex: 0
    },
    status: 'accepted' as const
  },
  {
    step: 8,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 1,
      negotiationIndex: 1
    },
    status: 'accepted' as const
  },
  {
    step: 9,
    actor: 'admin' as const,
    action: 'assignInspector',
    data: {
      tradeOpIndex: 0,
      inspectorIndex: 0,
      inspectorName: 'Quality Assurance Services BV'
    },
    status: 'in_progress' as const
  },
  {
    step: 10,
    actor: 'inspector' as const,
    action: 'startInspection',
    data: {
      inspectorIndex: 0,
      tradeOpIndex: 0
    },
    status: 'in_progress' as const
  },
  {
    step: 11,
    actor: 'inspector' as const,
    action: 'submitInspection',
    data: {
      inspectorIndex: 0,
      negotiationIndex: 0,
      qualityScore: 92,
      passed: true,
      notes: 'High quality wheat, meets all standards'
    },
    status: 'passed' as const
  },
  {
    step: 12,
    actor: 'inspector' as const,
    action: 'submitInspection',
    data: {
      inspectorIndex: 0,
      negotiationIndex: 1,
      qualityScore: 88,
      passed: true,
      notes: 'Good quality wheat, approved for delivery'
    },
    status: 'passed' as const
  },
  {
    step: 13,
    actor: 'inspector' as const,
    action: 'completeInspection',
    data: {
      inspectorIndex: 0,
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 14,
    actor: 'admin' as const,
    action: 'createTransportRequest',
    data: {
      tradeOpIndex: 0,
      pickupLocations: [
        { lat: 52.3676, lng: 4.9041, address: 'Amsterdam, Netherlands' },
        { lat: 52.0907, lng: 5.1214, address: 'Utrecht, Netherlands' }
      ],
      deliveryLocation: { lat: 51.9225, lng: 4.4792, address: 'Rotterdam, Netherlands' },
      totalWeight: 60,
      distance: 75
    },
    status: 'pending_bids' as const
  },
  {
    step: 15,
    actor: 'transporter' as const,
    action: 'transporterSubmitBid',
    data: {
      transporterIndex: 0,
      transportRequestIndex: 0,
      companyName: 'Fast Freight Services',
      bidAmount: 800,
      estimatedHours: 2,
      vehicleType: 'Large Truck'
    },
    status: 'bid_submitted' as const
  },
  {
    step: 16,
    actor: 'transporter' as const,
    action: 'transporterSubmitBid',
    data: {
      transporterIndex: 1,
      transportRequestIndex: 0,
      companyName: 'Reliable Transport NL',
      bidAmount: 750,
      estimatedHours: 3,
      vehicleType: 'Standard Truck'
    },
    status: 'bid_submitted' as const
  },
  {
    step: 17,
    actor: 'transporter' as const,
    action: 'transporterSubmitBid',
    data: {
      transporterIndex: 2,
      transportRequestIndex: 0,
      companyName: 'Budget Logistics',
      bidAmount: 700,
      estimatedHours: 5,
      vehicleType: 'Economy Truck'
    },
    status: 'bid_submitted' as const
  },
  {
    step: 18,
    actor: 'admin' as const,
    action: 'adminSelectBid',
    data: {
      transportRequestIndex: 0,
      selectedBidIndex: 1,
      reason: 'Best balance of cost and delivery time'
    },
    status: 'bid_accepted' as const
  },
  {
    step: 19,
    actor: 'transporter' as const,
    action: 'startTransport',
    data: {
      transporterIndex: 1,
      tradeOpIndex: 0
    },
    status: 'in_transit' as const
  },
  {
    step: 20,
    actor: 'transporter' as const,
    action: 'updateLocation',
    data: {
      transporterIndex: 1,
      currentLocation: { lat: 52.1561, lng: 4.4935, address: 'En route to Rotterdam' }
    },
    status: 'in_transit' as const
  },
  {
    step: 21,
    actor: 'transporter' as const,
    action: 'completeDelivery',
    data: {
      transporterIndex: 1,
      tradeOpIndex: 0,
      deliveryNotes: 'All goods delivered in excellent condition'
    },
    status: 'delivered' as const
  },
  {
    step: 22,
    actor: 'buyer' as const,
    action: 'confirmReceipt',
    data: {
      buyerIndex: 0,
      tradeOpIndex: 0,
      satisfaction: 5
    },
    status: 'confirmed' as const
  },
  {
    step: 23,
    actor: 'admin' as const,
    action: 'processPayments',
    data: {
      tradeOpIndex: 0,
      totalRevenue: 12000,
      totalCost: 10550,
      transportCost: 750,
      profit: 1450
    },
    status: 'processing' as const
  },
  {
    step: 24,
    actor: 'admin' as const,
    action: 'completeTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 25,
    actor: 'system' as const,
    action: 'generateReport',
    data: {
      tradeOpIndex: 0,
      summary: {
        farmers: 2,
        totalQuantity: 60,
        avgPrice: 175.83,
        margin: 10,
        transportBids: 3,
        selectedTransporter: 'Reliable Transport NL',
        transportCost: 750,
        profit: 1450
      }
    },
    status: 'completed' as const
  },
  {
    step: 26,
    actor: 'system' as const,
    action: 'archiveTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'archived' as const
  }
] as const;
