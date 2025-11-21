/**
 * Comprehensive Simulation Endpoints Test Script
 * Tests all 11 P0 simulation endpoints in the correct dependency order
 */

const BASE_URL = 'http://localhost:4000';
const ADMIN_EMAIL = 'admin@agrotrade.com';
const ADMIN_PASSWORD = 'admin123';

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  fixes: [],
  errors: []
};

// Store created entities for dependent tests
const createdEntities = {
  buyer: null,
  farmer1: null,
  farmer2: null,
  inspector: null,
  transporter: null,
  product: null,
  saleListing1: null,
  saleListing2: null,
  buyListing: null,
  tradeOperation: null,
  negotiations: [],
  inspections: [],
  transportJob: null
};

let adminToken = null;

// Helper: Make HTTP request
async function makeRequest(method, path, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);
  const text = await response.text();

  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    data = text;
  }

  return { status: response.status, data, ok: response.ok };
}

// Helper: Log test result
function logTest(name, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    console.log(`   ${details}`);
    testResults.errors.push({ test: name, details });
  }
}

// Step 0: Get admin token
async function getAdminToken() {
  console.log('\n📋 STEP 0: Getting Admin Token');
  const result = await makeRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (result.ok && result.data?.access_token) {
    adminToken = result.data.access_token;
    logTest('Get admin token', true);
    return true;
  } else {
    logTest('Get admin token', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 1: Create test users
async function test1_createTestUsers() {
  console.log('\n📋 STEP 1: POST /api/simulation/users/create-test-user');

  const roles = [
    { role: 'BUYER', name: 'Test Buyer', key: 'buyer' },
    { role: 'FARMER', name: 'Test Farmer 1', key: 'farmer1' },
    { role: 'FARMER', name: 'Test Farmer 2', key: 'farmer2' },
    { role: 'INSPECTOR', name: 'Test Inspector', key: 'inspector' },
    { role: 'TRANSPORTER', name: 'Test Transporter', key: 'transporter' }
  ];

  for (const { role, name, key } of roles) {
    const result = await makeRequest('POST', '/api/simulation/users/create-test-user', {
      role,
      name
    }, adminToken);

    if (result.ok && result.data?.id) {
      createdEntities[key] = result.data;
      logTest(`Create ${role} user`, true);
    } else {
      logTest(`Create ${role} user`, false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
      return false;
    }
  }

  return true;
}

// Test 2: Create farmer sale listings
async function test2_createFarmerSaleListings() {
  console.log('\n📋 STEP 2: POST /api/simulation/admin/farmer/:farmerId/create-sale-listing');

  const listings = [
    { farmerId: createdEntities.farmer1.id, quantity: 100, pricePerUnit: 250, key: 'saleListing1' },
    { farmerId: createdEntities.farmer2.id, quantity: 150, pricePerUnit: 240, key: 'saleListing2' }
  ];

  for (const { farmerId, quantity, pricePerUnit, key } of listings) {
    const result = await makeRequest(
      'POST',
      `/api/simulation/admin/farmer/${farmerId}/create-sale-listing`,
      {
        productCategory: 'SOFT_WHEAT',
        quantity,
        pricePerUnit,
        latitude: 24.4539,
        longitude: 54.3773
      },
      adminToken
    );

    if (result.ok && result.data?.id) {
      createdEntities[key] = result.data;
      if (!createdEntities.product) {
        createdEntities.product = { id: result.data.productId };
      }
      logTest(`Create sale listing for farmer (${quantity} TON @ €${pricePerUnit})`, true);
    } else {
      logTest(`Create sale listing for farmer`, false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
      return false;
    }
  }

  return true;
}

// Test 3: Create buy listing
async function test3_createBuyListing() {
  console.log('\n📋 STEP 3: POST /api/simulation/buyer/:buyerId/create-listing');

  const result = await makeRequest(
    'POST',
    `/api/simulation/buyer/${createdEntities.buyer.id}/create-listing`,
    {
      productId: createdEntities.product.id,
      quantity: 200,
      unit: 'TON',
      maxPricePerUnit: 300,
      neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    adminToken
  );

  if (result.ok && result.data?.id) {
    createdEntities.buyListing = result.data;
    logTest('Create buy listing', true);
    return true;
  } else {
    logTest('Create buy listing', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 4: Create trade operation
async function test4_createTradeOperation() {
  console.log('\n📋 STEP 4: POST /api/simulation/admin/create-trade-operation');

  const result = await makeRequest(
    'POST',
    '/api/simulation/admin/create-trade-operation',
    {
      buyListingId: createdEntities.buyListing.id,
      adminMargin: 10,
      buyerCommission: 1.5,
      sellerCommission: 2.5
    },
    adminToken
  );

  if (result.ok && result.data?.id) {
    createdEntities.tradeOperation = result.data;
    logTest('Create trade operation', true);
    return true;
  } else {
    logTest('Create trade operation', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 5: Send offers to farmers
async function test5_sendOffers() {
  console.log('\n📋 STEP 5: POST /api/simulation/admin/send-offers');

  const result = await makeRequest(
    'POST',
    '/api/simulation/admin/send-offers',
    {
      tradeOperationId: createdEntities.tradeOperation.id,
      offers: [
        {
          farmerId: createdEntities.farmer1.id,
          saleListingId: createdEntities.saleListing1.id,
          requestedQuantity: 100,
          offeredPrice: 260
        },
        {
          farmerId: createdEntities.farmer2.id,
          saleListingId: createdEntities.saleListing2.id,
          requestedQuantity: 100,
          offeredPrice: 255
        }
      ]
    },
    adminToken
  );

  if (result.ok && Array.isArray(result.data)) {
    createdEntities.negotiations = result.data.map(item => item.negotiation);
    logTest('Send offers to farmers', true);
    return true;
  } else {
    logTest('Send offers to farmers', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 6: Seller accepts offers
async function test6_sellerAcceptOffers() {
  console.log('\n📋 STEP 6: POST /api/simulation/seller/:sellerId/accept-offer');

  const acceptances = [
    { sellerId: createdEntities.farmer1.id, negotiationId: createdEntities.negotiations[0].id },
    { sellerId: createdEntities.farmer2.id, negotiationId: createdEntities.negotiations[1].id }
  ];

  for (const { sellerId, negotiationId } of acceptances) {
    const result = await makeRequest(
      'POST',
      `/api/simulation/seller/${sellerId}/accept-offer`,
      { negotiationId },
      adminToken
    );

    if (result.ok && result.data?.success) {
      logTest(`Seller accepts offer (${sellerId})`, true);
    } else {
      logTest(`Seller accepts offer (${sellerId})`, false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
      return false;
    }
  }

  return true;
}

// Test 7: Assign inspector
async function test7_assignInspector() {
  console.log('\n📋 STEP 7: POST /api/simulation/admin/assign-inspector');

  const result = await makeRequest(
    'POST',
    '/api/simulation/admin/assign-inspector',
    {
      tradeOperationId: createdEntities.tradeOperation.id,
      inspectorId: createdEntities.inspector.id
    },
    adminToken
  );

  if (result.ok && Array.isArray(result.data)) {
    createdEntities.inspections = result.data;
    logTest('Assign inspector', true);
    return true;
  } else {
    logTest('Assign inspector', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 8: Inspector submits results
async function test8_inspectorSubmitResults() {
  console.log('\n📋 STEP 8: POST /api/simulation/inspector/:inspectorId/submit-results');

  for (const inspection of createdEntities.inspections) {
    const result = await makeRequest(
      'POST',
      `/api/simulation/inspector/${createdEntities.inspector.id}/submit-results`,
      {
        inspectionId: inspection.id,
        qualityScore: 95,
        result: 'PASSED',
        notes: 'Quality verified, meets standards'
      },
      adminToken
    );

    if (result.ok && result.data?.success) {
      logTest(`Inspector submits results (inspection ${inspection.id})`, true);
    } else {
      logTest(`Inspector submits results (inspection ${inspection.id})`, false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
      return false;
    }
  }

  return true;
}

// Test 9: Create transport
async function test9_createTransport() {
  console.log('\n📋 STEP 9: POST /api/simulation/admin/create-transport');

  const result = await makeRequest(
    'POST',
    '/api/simulation/admin/create-transport',
    {
      tradeOperationId: createdEntities.tradeOperation.id,
      transporterId: createdEntities.transporter.id,
      pickupLat: 24.4539,
      pickupLng: 54.3773,
      deliveryLat: 25.2048,
      deliveryLng: 55.2708,
      bidAmount: 500,
      estimatedDuration: 4
    },
    adminToken
  );

  if (result.ok && result.data?.transportJob) {
    createdEntities.transportJob = result.data.transportJob;
    logTest('Create transport', true);
    return true;
  } else {
    logTest('Create transport', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 10: Transporter completes delivery
async function test10_completeDelivery() {
  console.log('\n📋 STEP 10: POST /api/simulation/transporter/:transporterId/complete-delivery');

  const result = await makeRequest(
    'POST',
    `/api/simulation/transporter/${createdEntities.transporter.id}/complete-delivery`,
    {
      jobId: createdEntities.transportJob.id,
      deliveryNotes: 'Delivered successfully, all goods in perfect condition'
    },
    adminToken
  );

  if (result.ok && result.data?.success) {
    logTest('Transporter completes delivery', true);
    return true;
  } else {
    logTest('Transporter completes delivery', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Test 11: Complete trade
async function test11_completeTrade() {
  console.log('\n📋 STEP 11: POST /api/simulation/admin/complete-trade');

  const result = await makeRequest(
    'POST',
    '/api/simulation/admin/complete-trade',
    {
      tradeOperationId: createdEntities.tradeOperation.id
    },
    adminToken
  );

  if (result.ok && result.data?.success) {
    logTest('Complete trade operation', true);
    return true;
  } else {
    logTest('Complete trade operation', false, `Status: ${result.status}, Error: ${JSON.stringify(result.data)}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 SIMULATION ENDPOINTS TEST SUITE');
  console.log('========================================');

  try {
    // Get admin token
    if (!await getAdminToken()) {
      console.error('\n❌ FATAL: Could not get admin token. Aborting tests.');
      return;
    }

    // Run all tests in order
    await test1_createTestUsers();
    await test2_createFarmerSaleListings();
    await test3_createBuyListing();
    await test4_createTradeOperation();
    await test5_sendOffers();
    await test6_sellerAcceptOffers();
    await test7_assignInspector();
    await test8_inspectorSubmitResults();
    await test9_createTransport();
    await test10_completeDelivery();
    await test11_completeTrade();

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    testResults.errors.push({ test: 'FATAL', details: error.message });
  }

  // Print final report
  console.log('\n========================================');
  console.log('📊 FINAL TEST REPORT');
  console.log('========================================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

  if (testResults.errors.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.errors.forEach((error, i) => {
      console.log(`\n${i + 1}. ${error.test}`);
      console.log(`   ${error.details}`);
    });
  }

  if (testResults.fixes.length > 0) {
    console.log('\n🔧 FIXES APPLIED:');
    testResults.fixes.forEach((fix, i) => {
      console.log(`${i + 1}. ${fix}`);
    });
  }

  console.log('\n========================================');
  if (testResults.failed === 0) {
    console.log('✅ ALL TESTS PASSED - READY FOR HAPPY PATH');
  } else {
    console.log('❌ TESTS FAILED - NEEDS FIXES');
  }
  console.log('========================================\n');

  return testResults.failed === 0;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
});
