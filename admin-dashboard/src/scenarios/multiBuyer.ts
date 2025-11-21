export const getMultiBuyerScenario = () => [
  {
    step: 1,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 0,
      companyName: 'Mega Harvest Farms',
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
      companyName: 'Twin Fields Agriculture',
      productType: 'Wheat',
      quantity: 35,
      pricePerTon: 180,
      location: { lat: 52.0907, lng: 5.1214, address: 'Utrecht, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 3,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 2,
      companyName: 'Golden Grain Cooperative',
      productType: 'Wheat',
      quantity: 35,
      pricePerTon: 178,
      location: { lat: 51.4416, lng: 5.4697, address: 'Eindhoven, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 4,
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
    step: 5,
    actor: 'buyer' as const,
    action: 'createBuyListing',
    data: {
      buyerIndex: 1,
      companyName: 'Amsterdam Bakery Group',
      productType: 'Wheat',
      quantity: 50,
      maxPricePerTon: 195,
      location: { lat: 52.3702, lng: 4.8952, address: 'Amsterdam West, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 6,
    actor: 'admin' as const,
    action: 'createTradeOperation',
    data: {
      buyListingIndex: 0,
      targetMargin: 10,
      estimatedTransportCost: 800
    },
    status: 'in_progress' as const
  },
  {
    step: 7,
    actor: 'admin' as const,
    action: 'createTradeOperation',
    data: {
      buyListingIndex: 1,
      targetMargin: 10,
      estimatedTransportCost: 700
    },
    status: 'in_progress' as const
  },
  {
    step: 8,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 0,
      quantity: 20,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 9,
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
    step: 10,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 2,
      quantity: 20,
      pricePerTon: 178
    },
    status: 'pending' as const
  },
  {
    step: 11,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 1,
      farmerIndex: 0,
      quantity: 20,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 12,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 1,
      farmerIndex: 1,
      quantity: 15,
      pricePerTon: 180
    },
    status: 'pending' as const
  },
  {
    step: 13,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 1,
      farmerIndex: 2,
      quantity: 15,
      pricePerTon: 178
    },
    status: 'pending' as const
  },
  {
    step: 14,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 0,
      negotiationIndex: 0
    },
    status: 'accepted' as const
  },
  {
    step: 15,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 0,
      negotiationIndex: 3
    },
    status: 'accepted' as const
  },
  {
    step: 16,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 1,
      negotiationIndex: 1
    },
    status: 'accepted' as const
  },
  {
    step: 17,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 1,
      negotiationIndex: 4
    },
    status: 'accepted' as const
  },
  {
    step: 18,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 2,
      negotiationIndex: 2
    },
    status: 'accepted' as const
  },
  {
    step: 19,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 2,
      negotiationIndex: 5
    },
    status: 'accepted' as const
  },
  {
    step: 20,
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
    step: 21,
    actor: 'inspector' as const,
    action: 'inspectAllFarmers',
    data: {
      inspectorIndex: 0,
      results: [
        { farmerIndex: 0, qualityScore: 90, passed: true },
        { farmerIndex: 1, qualityScore: 88, passed: true },
        { farmerIndex: 2, qualityScore: 91, passed: true }
      ]
    },
    status: 'completed' as const
  },
  {
    step: 22,
    actor: 'admin' as const,
    action: 'assignTransporter',
    data: {
      tradeOpIndex: 0,
      transporterIndex: 0,
      transporterName: 'Rotterdam Express Logistics',
      cost: 800,
      distance: 70,
      destination: 'Rotterdam'
    },
    status: 'assigned' as const
  },
  {
    step: 23,
    actor: 'admin' as const,
    action: 'assignTransporter',
    data: {
      tradeOpIndex: 1,
      transporterIndex: 0,
      transporterName: 'Rotterdam Express Logistics',
      cost: 700,
      distance: 55,
      destination: 'Amsterdam West'
    },
    status: 'assigned' as const
  },
  {
    step: 24,
    actor: 'transporter' as const,
    action: 'startTransport',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0
    },
    status: 'in_transit' as const
  },
  {
    step: 25,
    actor: 'transporter' as const,
    action: 'completeDelivery',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0,
      deliveryNotes: 'Delivered 60 tons to Dutch Mills Corporation, Rotterdam'
    },
    status: 'delivered' as const
  },
  {
    step: 26,
    actor: 'transporter' as const,
    action: 'startTransport',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 1
    },
    status: 'in_transit' as const
  },
  {
    step: 27,
    actor: 'transporter' as const,
    action: 'completeDelivery',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 1,
      deliveryNotes: 'Delivered 50 tons to Amsterdam Bakery Group, Amsterdam West'
    },
    status: 'delivered' as const
  },
  {
    step: 28,
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
    step: 29,
    actor: 'buyer' as const,
    action: 'confirmReceipt',
    data: {
      buyerIndex: 1,
      tradeOpIndex: 1,
      satisfaction: 5
    },
    status: 'confirmed' as const
  },
  {
    step: 30,
    actor: 'admin' as const,
    action: 'completeTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 31,
    actor: 'admin' as const,
    action: 'completeTrade',
    data: {
      tradeOpIndex: 1
    },
    status: 'completed' as const
  },
  {
    step: 32,
    actor: 'system' as const,
    action: 'generateMultiBuyerReport',
    data: {
      summary: {
        totalTrades: 2,
        totalFarmers: 3,
        totalBuyers: 2,
        totalQuantity: 110,
        tradeOp1Quantity: 60,
        tradeOp2Quantity: 50,
        combinedProfit: 2800
      }
    },
    status: 'completed' as const
  }
] as const;
