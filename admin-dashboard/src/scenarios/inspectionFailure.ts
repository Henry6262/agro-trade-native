// Inspection Failure: Farmer 2 fails inspection, replacement farmer needed
// 25 steps total including replacement farmer flow

export const getInspectionFailureScenario = () => [
  // PHASE 1: USER CREATION (Steps 1-6) - 4 farmers instead of 3
  {
    step: 1,
    description: 'Create Farmer 1 (Quality Farms)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Quality Farmer 1', data: { companyName: 'Quality Farms' } },
    status: 'pending' as const,
  },
  {
    step: 2,
    description: 'Create Farmer 2 (Poor Quality Farm - will fail)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Poor Quality Farmer', data: { companyName: 'Poor Quality Farm' } },
    status: 'pending' as const,
  },
  {
    step: 3,
    description: 'Create Farmer 3 (Good Harvest)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Good Harvest Farmer', data: { companyName: 'Good Harvest' } },
    status: 'pending' as const,
  },
  {
    step: 4,
    description: 'Create Farmer 4 (Replacement Farms - backup)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Replacement Farmer', data: { companyName: 'Replacement Farms' } },
    status: 'pending' as const,
  },
  {
    step: 5,
    description: 'Create Buyer (Quality Foods)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'BUYER', name: 'Quality Buyer', data: { companyName: 'Quality Foods' } },
    status: 'pending' as const,
  },
  {
    step: 6,
    description: 'Create Transporter (Reliable Transport)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'TRANSPORTER', name: 'Reliable Transport' },
    status: 'pending' as const,
  },
  {
    step: 7,
    description: 'Create Inspector (Strict Inspector)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'INSPECTOR', name: 'Strict Inspector' },
    status: 'pending' as const,
  },

  // PHASE 2: SALE LISTINGS (Steps 6-9) - All 4 farmers create listings
  {
    step: 8,
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
    step: 9,
    description: 'Farmer 2 creates sale listing (35 tons corn @ €175/ton) - WILL FAIL',
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
    step: 10,
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
  {
    step: 11,
    description: 'Farmer 4 creates sale listing (35 tons corn @ €178/ton) - REPLACEMENT',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 3,
      productCategory: 'CORN',
      quantity: 35,
      pricePerUnit: 178,
      latitude: 40.7300,
      longitude: -73.9950,
    },
    status: 'pending' as const,
  },

  // PHASE 3: BUY LISTING & TRADE OPERATION (Steps 10-11)
  {
    step: 12,
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
    step: 13,
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

  // PHASE 4: INITIAL NEGOTIATIONS (Steps 12-15) - Only first 3 farmers
  {
    step: 14,
    description: 'Admin sends offers to first 3 farmers',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 0, requestedQuantity: 40, offeredPrice: 180 },
        { farmerIndex: 1, requestedQuantity: 35, offeredPrice: 175 }, // Will fail inspection
        { farmerIndex: 2, requestedQuantity: 25, offeredPrice: 185 },
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 15,
    description: 'Farmer 1 accepts offer',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 0, negotiationIndex: 0 },
    status: 'pending' as const,
  },
  {
    step: 16,
    description: 'Farmer 2 accepts offer (will fail inspection)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 1, negotiationIndex: 1 },
    status: 'pending' as const,
  },
  {
    step: 17,
    description: 'Farmer 3 accepts offer',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 2, negotiationIndex: 2 },
    status: 'pending' as const,
  },

  // PHASE 5: INSPECTION WITH FAILURE (Steps 16-19)
  {
    step: 18,
    description: 'Admin assigns inspector',
    actor: 'ADMIN' as const,
    action: 'assignInspector',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 19,
    description: 'Inspector verifies Farmer 1 - PASSED (quality: 93)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 0,
      result: 'PASSED',
      qualityScore: 93,
      notes: 'Good quality corn, approved',
    },
    status: 'pending' as const,
  },
  {
    step: 20,
    description: 'Inspector verifies Farmer 2 - FAILED (quality: 45)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 1,
      result: 'FAILED',
      qualityScore: 45,
      notes: 'Quality below acceptable standards, rejected',
    },
    status: 'pending' as const,
  },
  {
    step: 21,
    description: 'Inspector verifies Farmer 3 - PASSED (quality: 88)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 2,
      result: 'PASSED',
      qualityScore: 88,
      notes: 'Acceptable quality, approved',
    },
    status: 'pending' as const,
  },

  // PHASE 6: REPLACEMENT FARMER (Steps 20-24)
  {
    step: 22,
    description: 'Admin sends offer to Farmer 4 (replacement)',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 3, requestedQuantity: 35, offeredPrice: 178 }, // Replacement for Farmer 2
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 23,
    description: 'Farmer 4 accepts offer (replacement)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 3, negotiationIndex: 3 },
    status: 'pending' as const,
  },
  {
    step: 24,
    description: 'Inspector verifies Farmer 4 - PASSED (quality: 91)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 3,
      result: 'PASSED',
      qualityScore: 91,
      notes: 'Excellent replacement, approved',
    },
    status: 'pending' as const,
  },

  // PHASE 7: TRANSPORT & COMPLETION (Steps 25-27)
  {
    step: 25,
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
    step: 26,
    description: 'Transporter completes delivery',
    actor: 'TRANSPORTER' as const,
    action: 'completeDelivery',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 27,
    description: 'Admin completes trade operation',
    actor: 'ADMIN' as const,
    action: 'completeTrade',
    payload: {},
    status: 'pending' as const,
  },
];
