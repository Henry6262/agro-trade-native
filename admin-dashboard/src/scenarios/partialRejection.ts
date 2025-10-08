// Partial Rejection: Some farmers reject offers, admin finds alternatives
// 24 steps: 7 users → 4 sale listings → buy listing → trade op → offers → 1 accept, 1 REJECT, 1 accept → backup offer → complete

export const getPartialRejectionScenario = () => [
  // PHASE 1: USER CREATION (Steps 1-7)
  {
    step: 1,
    description: 'Create Farmer 1 (Reliable Farms)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Reliable Farmer 1', data: { companyName: 'Reliable Farms' } },
    status: 'pending' as const,
  },
  {
    step: 2,
    description: 'Create Farmer 2 (Picky Seller Co - will reject)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Picky Farmer', data: { companyName: 'Picky Seller Co' } },
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
    description: 'Create Farmer 4 (Backup Suppliers - replacement)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'FARMER', name: 'Backup Farmer', data: { companyName: 'Backup Suppliers' } },
    status: 'pending' as const,
  },
  {
    step: 5,
    description: 'Create Buyer (Flexible Foods Inc)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'BUYER', name: 'Flexible Buyer', data: { companyName: 'Flexible Foods Inc' } },
    status: 'pending' as const,
  },
  {
    step: 6,
    description: 'Create Transporter (Quick Transport)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'TRANSPORTER', name: 'Quick Transport' },
    status: 'pending' as const,
  },
  {
    step: 7,
    description: 'Create Inspector (Standard Inspector)',
    actor: 'ADMIN' as const,
    action: 'createTestUser',
    payload: { role: 'INSPECTOR', name: 'Standard Inspector' },
    status: 'pending' as const,
  },

  // PHASE 2: SALE LISTINGS (Steps 8-11)
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
    description: 'Farmer 2 creates sale listing (30 tons corn @ €175/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 1,
      productCategory: 'CORN',
      quantity: 30,
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
    description: 'Farmer 4 creates sale listing (35 tons corn @ €188/ton)',
    actor: 'ADMIN' as const,
    action: 'createFarmerSaleListing',
    payload: {
      farmerIndex: 3,
      productCategory: 'CORN',
      quantity: 35,
      pricePerUnit: 188,
      latitude: 40.7300,
      longitude: -73.9800,
    },
    status: 'pending' as const,
  },

  // PHASE 3: BUY LISTING & TRADE OPERATION (Steps 12-13)
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

  // PHASE 4: INITIAL NEGOTIATIONS WITH REJECTION (Steps 14-17)
  {
    step: 14,
    description: 'Admin sends offers to first 3 farmers',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 0, requestedQuantity: 40, offeredPrice: 180 },
        { farmerIndex: 1, requestedQuantity: 30, offeredPrice: 175 }, // Will reject - too low
        { farmerIndex: 2, requestedQuantity: 30, offeredPrice: 185 },
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 15,
    description: 'Farmer 1 accepts offer (40 tons @ €180)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 0, negotiationIndex: 0 },
    status: 'pending' as const,
  },
  {
    step: 16,
    description: 'Farmer 2 REJECTS offer (price too low)',
    actor: 'FARMER' as const,
    action: 'rejectOffer',
    payload: { farmerIndex: 1, negotiationIndex: 1, reason: 'Price below market rate' },
    status: 'pending' as const,
  },
  {
    step: 17,
    description: 'Farmer 3 accepts offer (30 tons @ €185)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 2, negotiationIndex: 2 },
    status: 'pending' as const,
  },

  // PHASE 5: BACKUP FARMER (Steps 18-19)
  {
    step: 18,
    description: 'Admin sends better offer to Farmer 4 (backup)',
    actor: 'ADMIN' as const,
    action: 'sendOffers',
    payload: {
      offers: [
        { farmerIndex: 3, requestedQuantity: 30, offeredPrice: 188 }, // Higher price to secure
      ],
    },
    status: 'pending' as const,
  },
  {
    step: 19,
    description: 'Farmer 4 accepts backup offer (30 tons @ €188)',
    actor: 'FARMER' as const,
    action: 'acceptOffer',
    payload: { farmerIndex: 3, negotiationIndex: 3 },
    status: 'pending' as const,
  },

  // PHASE 6: INSPECTION (Steps 20-22)
  {
    step: 20,
    description: 'Admin assigns inspector',
    actor: 'ADMIN' as const,
    action: 'assignInspector',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 21,
    description: 'Inspector verifies Farmer 1 - PASSED (quality: 94)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 0,
      result: 'PASSED',
      qualityScore: 94,
      notes: 'Excellent quality',
    },
    status: 'pending' as const,
  },
  {
    step: 22,
    description: 'Inspector verifies Farmer 3 - PASSED (quality: 90)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 1,
      result: 'PASSED',
      qualityScore: 90,
      notes: 'Good quality',
    },
    status: 'pending' as const,
  },
  {
    step: 23,
    description: 'Inspector verifies Farmer 4 - PASSED (quality: 92)',
    actor: 'INSPECTOR' as const,
    action: 'submitResults',
    payload: {
      inspectionIndex: 2,
      result: 'PASSED',
      qualityScore: 92,
      notes: 'Backup supplier approved',
    },
    status: 'pending' as const,
  },

  // PHASE 7: TRANSPORT & COMPLETION (Steps 23-24)
  {
    step: 24,
    description: 'Admin creates transport job (50km, €750)',
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
    step: 25,
    description: 'Transporter completes delivery',
    actor: 'TRANSPORTER' as const,
    action: 'completeDelivery',
    payload: {},
    status: 'pending' as const,
  },
  {
    step: 26,
    description: 'Admin completes trade operation',
    actor: 'ADMIN' as const,
    action: 'completeTrade',
    payload: {},
    status: 'pending' as const,
  },
];
