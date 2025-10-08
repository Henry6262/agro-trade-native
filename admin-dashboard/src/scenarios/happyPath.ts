// Happy Path: Complete successful trade from start to finish
// 20 steps: 4 users → 3 sale listings → buy listing → trade op → 3 offers → 3 accepts → inspection → 3 verifications → transport → delivery → complete

export const getHappyPathScenario = () => [
  // PHASE 1: USER CREATION (Steps 1-4)
  {
    step: 1,
    description: 'Create Farmer 1 (Green Valley Farm)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Green Valley Farmer', data: { companyName: 'Green Valley Farm' } },
    status: 'pending' as const,
  },
  {
    step: 2,
    description: 'Create Farmer 2 (Sunny Fields Co)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Sunny Fields Farmer', data: { companyName: 'Sunny Fields Co' } },
    status: 'pending' as const,
  },
  {
    step: 3,
    description: 'Create Farmer 3 (Fresh Harvest Ltd)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Fresh Harvest Farmer', data: { companyName: 'Fresh Harvest Ltd' } },
    status: 'pending' as const,
  },
  {
    step: 4,
    description: 'Create Buyer (Fresh Foods Inc)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'BUYER', name: 'Happy Path Buyer', data: { companyName: 'Fresh Foods Inc' } },
    status: 'pending' as const,
  },
  {
    step: 5,
    description: 'Create Transporter (Fast Logistics)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'TRANSPORTER', name: 'Fast Logistics' },
    status: 'pending' as const,
  },
  {
    step: 6,
    description: 'Create Inspector (Quality Control Pro)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'INSPECTOR', name: 'Quality Control Pro' },
    status: 'pending' as const,
  },

  // PHASE 2: SALE LISTINGS (Steps 5-7)
  {
    step: 7,
    description: 'Farmer 1 creates sale listing (40 tons corn @ €180/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 0,
      productCategory: 'CORN',
      quantity: 40,
      pricePerUnit: 180,
      latitude: 40.7128,
      longitude: -74.0060,
    },
    status: 'pending' as const,
  },
  {
    step: 8,
    description: 'Farmer 2 creates sale listing (35 tons corn @ €175/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 1,
      productCategory: 'CORN',
      quantity: 35,
      pricePerUnit: 175,
      latitude: 40.7580,
      longitude: -73.9855,
    },
    status: 'pending' as const,
  },
  {
    step: 9,
    description: 'Farmer 3 creates sale listing (30 tons corn @ €185/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 2,
      productCategory: 'CORN',
      quantity: 30,
      pricePerUnit: 185,
      latitude: 40.6782,
      longitude: -73.9442,
    },
    status: 'pending' as const,
  },

  // PHASE 3: BUY LISTING & TRADE OPERATION (Steps 8-9)
  {
    step: 10,
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
    step: 11,
    description: 'Admin creates trade operation (10% margin, 1.5% buyer/2.5% seller commission)',
    actor: 'ADMIN' as const,
    action: 'createTradeOperation',
    payload: {
      adminMargin: 10,
      buyerCommission: 1.5,
      sellerCommission: 2.5,
    },
    status: 'pending' as const,
  },

  // PHASE 4: NEGOTIATIONS (Steps 10-13)
  {
    step: 12,
    description: 'Admin sends offers to all 3 farmers',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 0, requestedQuantity: 40, offeredPrice: 180 },
        { farmerIndex: 1, requestedQuantity: 35, offeredPrice: 175 },
        { farmerIndex: 2, requestedQuantity: 25, offeredPrice: 185 }, // Only 25 tons needed from farmer 3
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 13,
    description: 'Farmer 1 accepts offer (40 tons @ €180)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 0, negotiationIndex: 0 },
    status: 'pending' as const,
  },
  {
    step: 14,
    description: 'Farmer 2 accepts offer (35 tons @ €175)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 1, negotiationIndex: 1 },
    status: 'pending' as const,
  },
  {
    step: 15,
    description: 'Farmer 3 accepts offer (25 tons @ €185)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 2, negotiationIndex: 2 },
    status: 'pending' as const,
  },

  // PHASE 5: INSPECTION (Steps 14-17)
  {
    step: 16,
    description: 'Admin assigns inspector to verify all farmers',
    actor: 'ADMIN' as const,
    action: 'assignInspector',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 17,
    description: 'Inspector verifies Farmer 1 - PASSED (quality: 95)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 0,
      result: 'PASSED',
      qualityScore: 95,
      notes: 'Excellent quality corn, meets all standards',
    },
    status: 'pending' as const,
  },
  {
    step: 18,
    description: 'Inspector verifies Farmer 2 - PASSED (quality: 92)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 1,
      result: 'PASSED',
      qualityScore: 92,
      notes: 'Good quality, no issues found',
    },
    status: 'pending' as const,
  },
  {
    step: 19,
    description: 'Inspector verifies Farmer 3 - PASSED (quality: 90)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 2,
      result: 'PASSED',
      qualityScore: 90,
      notes: 'Satisfactory quality, approved',
    },
    status: 'pending' as const,
  },

  // PHASE 6: TRANSPORT & COMPLETION (Steps 18-20)
  {
    step: 20,
    description: 'Admin creates transport job (50km, ~€750 total)',
    actor: 'ADMIN' as const,
    action: 'createTransport',
    payload: {
      pickupLat: 40.7128,
      pickupLng: -74.0060,
      deliveryLat: 40.7580,
      deliveryLng: -73.5855, // ~50km away
      distanceKm: 50,
      bidAmount: 750,
      estimatedDuration: 2,
    },
    status: 'pending' as const,
  },
  {
    step: 21,
    description: 'Transporter completes delivery',
    actor: 'TRANSPORTER' as const,
    action: 'completeDelivery',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 22,
    description: 'Admin completes trade operation',
    actor: 'ADMIN' as const,
    action: 'completeTrade',
    payload: {},
    status: 'pending' as const,
  },
];
