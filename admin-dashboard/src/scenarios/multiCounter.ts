// Multi Counter-Offer: Complex negotiation with multiple rounds of counter-offers
// 22 steps with negotiation back-and-forth

export const getMultiCounterScenario = () => [
  // PHASE 1: USER CREATION (Steps 1-6)
  {
    step: 1,
    description: 'Create Farmer 1 (Negotiating Farms)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Negotiating Farmer 1', data: { companyName: 'Negotiating Farms' } },
    status: 'pending' as const,
  },
  {
    step: 2,
    description: 'Create Farmer 2 (Smart Harvest)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Negotiating Farmer 2', data: { companyName: 'Smart Harvest' } },
    status: 'pending' as const,
  },
  {
    step: 3,
    description: 'Create Buyer (Strategic Foods)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'BUYER', name: 'Strategic Buyer', data: { companyName: 'Strategic Foods' } },
    status: 'pending' as const,
  },
  {
    step: 4,
    description: 'Create Transporter (Standard Transport)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'TRANSPORTER', name: 'Standard Transport' },
    status: 'pending' as const,
  },
  {
    step: 5,
    description: 'Create Inspector (Standard Inspector)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'INSPECTOR', name: 'Standard Inspector' },
    status: 'pending' as const,
  },

  // PHASE 2: SALE LISTINGS (Steps 5-6)
  {
    step: 6,
    description: 'Farmer 1 creates sale listing (60 tons corn @ €190/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 0,
      productCategory: 'CORN',
      quantity: 60,
      pricePerUnit: 190,
      latitude: 40.7128,
      longitude: -74.0060,
    },
    status: 'pending' as const,
  },
  {
    step: 7,
    description: 'Farmer 2 creates sale listing (50 tons corn @ €185/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 1,
      productCategory: 'CORN',
      quantity: 50,
      pricePerUnit: 185,
      latitude: 40.7580,
      longitude: -73.9855,
    },
    status: 'pending' as const,
  },

  // PHASE 3: BUY LISTING & TRADE OPERATION (Steps 7-8)
  {
    step: 8,
    description: 'Buyer creates buy listing (100 tons corn, max €200/ton)',
    actor: 'BUYER' as const,
    action: 'createBuyListing',
    payload: {
      productCategory: 'CORN',
      quantity: 100,
      unit: 'TON',
      maxPricePerUnit: 200,
    },
    status: 'pending' as const,
  },
  {
    step: 9,
    description: 'Admin creates trade operation (10% margin)',
    actor: 'ADMIN' as const,
    action: 'createTradeOperation',
    payload: {
      adminMargin: 10,
      buyerCommission: 1.5,
      sellerCommission: 2.5,
    },
    status: 'pending' as const,
  },

  // PHASE 4: COMPLEX NEGOTIATIONS (Steps 9-14)
  {
    step: 10,
    description: 'Admin sends initial offers to both farmers',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 0, requestedQuantity: 50, offeredPrice: 185 }, // Lower price
        { farmerIndex: 1, requestedQuantity: 50, offeredPrice: 180 }, // Lower price
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 11,
    description: 'Farmer 1 counters with higher price (€190/ton)',
    actor: 'FARMER' as const,
    action: 'counterOffer',
    payload: {
      farmerIndex: 0,
      negotiationIndex: 0,
      counterPrice: 190,
      counterQuantity: 50,
    },
    status: 'pending' as const,
  },
  {
    step: 12,
    description: 'Admin accepts Farmer 1 counter-offer',
    actor: 'ADMIN' as const,
    action: 'acceptCounterOffer',
    payload: {
      negotiationIndex: 0,
    },
    status: 'pending' as const,
  },
  {
    step: 13,
    description: 'Farmer 2 counters with different quantity (40 tons @ €185/ton)',
    actor: 'FARMER' as const,
    action: 'counterOffer',
    payload: {
      farmerIndex: 1,
      negotiationIndex: 1,
      counterPrice: 185,
      counterQuantity: 40, // Less quantity
    },
    status: 'pending' as const,
  },
  {
    step: 14,
    description: 'Admin sends new offer to Farmer 2 (50 tons @ €183/ton)',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 1, requestedQuantity: 50, offeredPrice: 183 }, // Compromise
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 15,
    description: 'Farmer 2 accepts the compromise offer',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 1, negotiationIndex: 2 },
    status: 'pending' as const,
  },

  // PHASE 5: INSPECTION (Steps 15-17)
  {
    step: 16,
    description: 'Admin assigns inspector',
    actor: 'ADMIN' as const,
    action: 'assignInspector',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 17,
    description: 'Inspector verifies Farmer 1 - PASSED (quality: 94)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 0,
      result: 'PASSED',
      qualityScore: 94,
      notes: 'Premium quality corn',
    },
    status: 'pending' as const,
  },
  {
    step: 18,
    description: 'Inspector verifies Farmer 2 - PASSED (quality: 91)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 1,
      result: 'PASSED',
      qualityScore: 91,
      notes: 'Good quality, approved',
    },
    status: 'pending' as const,
  },

  // PHASE 6: TRANSPORT & COMPLETION (Steps 18-20)
  {
    step: 19,
    description: 'Admin creates transport job',
    actor: 'ADMIN' as const,
    action: 'createTransport',
    payload: {
      pickupLat: 40.7128,
      pickupLng: -74.0060,
      deliveryLat: 40.7580,
      deliveryLng: -73.5855,
      distanceKm: 50,
      bidAmount: 750,
      estimatedDuration: 2,
    },
    status: 'pending' as const,
  },
  {
    step: 20,
    description: 'Transporter completes delivery',
    actor: 'TRANSPORTER' as const,
    action: 'completeDelivery',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 21,
    description: 'Admin completes trade operation',
    actor: 'ADMIN' as const,
    action: 'completeTrade',
    payload: {},
    status: 'pending' as const,
  },
];
