export const getQualityDisputeScenario = () => [
  {
    step: 1,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 0,
      companyName: 'Excellence Farms Co',
      productType: 'Wheat',
      quantity: 25,
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
      companyName: 'Standard Grain Suppliers',
      productType: 'Wheat',
      quantity: 20,
      pricePerTon: 175,
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
      companyName: 'Quality Harvest Ltd',
      productType: 'Wheat',
      quantity: 30,
      pricePerTon: 175,
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
      companyName: 'Quality Mills Corporation',
      productType: 'Wheat',
      quantity: 60,
      maxPricePerTon: 200,
      location: { lat: 51.9225, lng: 4.4792, address: 'Rotterdam, Netherlands' }
    },
    status: 'active' as const
  },
  {
    step: 5,
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
    step: 6,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 0,
      quantity: 25,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 7,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 1,
      quantity: 20,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 8,
    actor: 'admin' as const,
    action: 'sendOffer',
    data: {
      tradeOpIndex: 0,
      farmerIndex: 2,
      quantity: 15,
      pricePerTon: 175
    },
    status: 'pending' as const
  },
  {
    step: 9,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 0,
      negotiationIndex: 0
    },
    status: 'accepted' as const
  },
  {
    step: 10,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 1,
      negotiationIndex: 1
    },
    status: 'accepted' as const
  },
  {
    step: 11,
    actor: 'farmer' as const,
    action: 'acceptOffer',
    data: {
      farmerIndex: 2,
      negotiationIndex: 2
    },
    status: 'accepted' as const
  },
  {
    step: 12,
    actor: 'admin' as const,
    action: 'assignInspector',
    data: {
      tradeOpIndex: 0,
      inspectorIndex: 0,
      inspectorName: 'Rigorous Quality Assurance BV'
    },
    status: 'in_progress' as const
  },
  {
    step: 13,
    actor: 'inspector' as const,
    action: 'startInspection',
    data: {
      inspectorIndex: 0,
      tradeOpIndex: 0
    },
    status: 'in_progress' as const
  },
  {
    step: 14,
    actor: 'inspector' as const,
    action: 'submitInspection',
    data: {
      inspectorIndex: 0,
      negotiationIndex: 0,
      qualityScore: 95,
      passed: true,
      notes: 'Excellent quality wheat, exceeds standards'
    },
    status: 'passed' as const
  },
  {
    step: 15,
    actor: 'inspector' as const,
    action: 'submitInspection',
    data: {
      inspectorIndex: 0,
      negotiationIndex: 1,
      qualityScore: 68,
      passed: true,
      notes: 'Borderline quality - meets minimum standards but shows some moisture concerns. Conditional pass.'
    },
    status: 'passed' as const
  },
  {
    step: 16,
    actor: 'inspector' as const,
    action: 'submitInspection',
    data: {
      inspectorIndex: 0,
      negotiationIndex: 2,
      qualityScore: 92,
      passed: true,
      notes: 'High quality wheat, very good condition'
    },
    status: 'passed' as const
  },
  {
    step: 17,
    actor: 'inspector' as const,
    action: 'completeInspection',
    data: {
      inspectorIndex: 0,
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 18,
    actor: 'admin' as const,
    action: 'updatePricing',
    data: {
      tradeOpIndex: 0,
      negotiationIndex: 1,
      newPrice: 165,
      reason: 'Borderline quality adjustment - moisture concerns identified during inspection'
    },
    status: 'price_adjusted' as const
  },
  {
    step: 19,
    actor: 'farmer' as const,
    action: 'acceptPriceAdjustment',
    data: {
      farmerIndex: 1,
      negotiationIndex: 1
    },
    status: 'accepted' as const
  },
  {
    step: 20,
    actor: 'admin' as const,
    action: 'assignTransporter',
    data: {
      tradeOpIndex: 0,
      transporterIndex: 0,
      transporterName: 'Reliable Transport NL',
      cost: 750,
      distance: 65
    },
    status: 'assigned' as const
  },
  {
    step: 21,
    actor: 'transporter' as const,
    action: 'startTransport',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0
    },
    status: 'in_transit' as const
  },
  {
    step: 22,
    actor: 'transporter' as const,
    action: 'completeDelivery',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0,
      deliveryNotes: 'All shipments delivered. Quality-adjusted batch segregated as requested.'
    },
    status: 'delivered' as const
  },
  {
    step: 23,
    actor: 'buyer' as const,
    action: 'confirmReceipt',
    data: {
      buyerIndex: 0,
      tradeOpIndex: 0,
      satisfaction: 4,
      notes: 'Satisfied with quality control process and price adjustment'
    },
    status: 'confirmed' as const
  },
  {
    step: 24,
    actor: 'admin' as const,
    action: 'processPayments',
    data: {
      tradeOpIndex: 0,
      totalRevenue: 12000,
      totalCost: 10950,
      transportCost: 750,
      adjustments: -200,
      profit: 1050
    },
    status: 'processing' as const
  },
  {
    step: 25,
    actor: 'admin' as const,
    action: 'completeTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 26,
    actor: 'system' as const,
    action: 'generateReport',
    data: {
      tradeOpIndex: 0,
      summary: {
        farmers: 3,
        totalQuantity: 60,
        qualityIssues: 1,
        priceAdjustments: 1,
        avgQualityScore: 85,
        profit: 1050
      }
    },
    status: 'completed' as const
  },
  {
    step: 27,
    actor: 'system' as const,
    action: 'notifyStakeholders',
    data: {
      message: 'Quality dispute resolved through price adjustment. All parties satisfied.'
    },
    status: 'completed' as const
  },
  {
    step: 28,
    actor: 'system' as const,
    action: 'archiveTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'archived' as const
  }
] as const;
