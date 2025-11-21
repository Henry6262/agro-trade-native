export const getRushOrderScenario = () => [
  {
    step: 1,
    actor: 'farmer' as const,
    action: 'createSellListing',
    data: {
      farmerIndex: 0,
      companyName: 'Premium Harvest Farms',
      productType: 'Wheat',
      quantity: 30,
      pricePerTon: 210,
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
      companyName: 'Golden Fields Agriculture',
      productType: 'Wheat',
      quantity: 25,
      pricePerTon: 215,
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
      companyName: 'Urgent Foods Inc',
      productType: 'Wheat',
      quantity: 50,
      maxPricePerTon: 230,
      location: { lat: 51.9225, lng: 4.4792, address: 'Rotterdam, Netherlands' },
      urgent: true
    },
    status: 'active' as const
  },
  {
    step: 4,
    actor: 'admin' as const,
    action: 'createTradeOperation',
    data: {
      buyListingIndex: 0,
      targetMargin: 15,
      estimatedTransportCost: 1000
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
      quantity: 30,
      pricePerTon: 210
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
      pricePerTon: 215
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
      inspectorName: 'Express Quality Control Ltd'
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
      qualityScore: 94,
      passed: true,
      notes: 'Premium quality wheat, expedited inspection'
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
      qualityScore: 91,
      passed: true,
      notes: 'Excellent quality, approved for urgent delivery'
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
    action: 'assignTransporter',
    data: {
      tradeOpIndex: 0,
      transporterIndex: 0,
      transporterName: 'Express Logistics BV',
      cost: 1000,
      distance: 50
    },
    status: 'assigned' as const
  },
  {
    step: 15,
    actor: 'transporter' as const,
    action: 'startTransport',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0
    },
    status: 'in_transit' as const
  },
  {
    step: 16,
    actor: 'transporter' as const,
    action: 'completeDelivery',
    data: {
      transporterIndex: 0,
      tradeOpIndex: 0,
      deliveryNotes: 'Rush delivery completed on time'
    },
    status: 'delivered' as const
  },
  {
    step: 17,
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
    step: 18,
    actor: 'admin' as const,
    action: 'completeTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'completed' as const
  },
  {
    step: 19,
    actor: 'system' as const,
    action: 'archiveTrade',
    data: {
      tradeOpIndex: 0
    },
    status: 'archived' as const
  }
] as const;
