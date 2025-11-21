#!/usr/bin/env node

/**
 * Integration Test: Transport Workflow
 * Tests the complete flow from creating transport requests to accepting bids
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

// Test data
let testData = {
  tradeOperationId: null,
  transportRequestId: null,
  transportBidId: null,
  transportJobId: null,
};

async function runTests() {
  console.log('\n=== Transport Workflow Integration Test ===\n');

  try {
    // Step 1: Create a transport request
    logInfo('Step 1: Creating transport request...');
    await testCreateTransportRequest();

    // Step 2: List transport requests
    logInfo('\nStep 2: Listing transport requests...');
    await testListTransportRequests();

    // Step 3: Get transport request details with truck tracking
    logInfo('\nStep 3: Getting transport request details...');
    await testGetTransportRequestDetails();

    // Step 4: Create transport bids
    logInfo('\nStep 4: Creating transport bids...');
    await testCreateTransportBids();

    // Step 5: List bids for request
    logInfo('\nStep 5: Listing bids for request...');
    await testListBidsForRequest();

    // Step 6: Accept a bid
    logInfo('\nStep 6: Accepting transport bid...');
    await testAcceptBid();

    // Step 7: Verify transport job created
    logInfo('\nStep 7: Verifying transport job...');
    await testVerifyTransportJob();

    log('\n=== All Tests Passed! ===\n', 'green');
    process.exit(0);
  } catch (error) {
    logError(`\n\nTest failed: ${error.message}`);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function testCreateTransportRequest() {
  // First, we need a trade operation ID
  // For testing, we'll use a mock ID or create one via simulation
  const tradeOperationId = process.env.TEST_TRADE_OPERATION_ID || 'test-trade-op-1';
  testData.tradeOperationId = tradeOperationId;

  const requestData = {
    tradeOperationId,
    totalWeight: 100,
    requiredVehicleType: 'FLATBED',
    specialRequirements: ['Temperature controlled'],
    urgencyLevel: 'STANDARD',
    biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    deliveryDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  try {
    const response = await axios.post(`${API_URL}/transport/requests`, requestData);

    if (response.data && response.data.id) {
      testData.transportRequestId = response.data.id;
      logSuccess(`Transport request created: ${response.data.requestNumber}`);
      logInfo(`  - Estimated distance: ${response.data.estimatedDistance || 'N/A'} km`);
      logInfo(`  - Total weight: ${response.data.totalWeight} tons`);
    } else {
      throw new Error('No transport request ID returned');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logInfo('Trade operation not found. Creating mock scenario...');
      // In a real test, we'd create the trade operation first
      throw new Error('Please set TEST_TRADE_OPERATION_ID environment variable');
    }
    throw error;
  }
}

async function testListTransportRequests() {
  const response = await axios.get(`${API_URL}/transport/requests`, {
    params: {
      status: 'OPEN',
      limit: 10,
    },
  });

  if (response.data && response.data.data) {
    logSuccess(`Found ${response.data.data.length} transport requests`);
    logInfo(`  - Total: ${response.data.total}`);
  } else {
    throw new Error('Invalid response format');
  }
}

async function testGetTransportRequestDetails() {
  const response = await axios.get(
    `${API_URL}/transport/requests/${testData.transportRequestId}`
  );

  if (response.data && response.data.truckTracking) {
    const tracking = response.data.truckTracking;
    logSuccess('Transport request details retrieved');
    logInfo(`  - Trucks needed: ${tracking.trucksNeeded}`);
    logInfo(`  - Trucks reserved: ${tracking.trucksReserved}`);
    logInfo(`  - Trucks remaining: ${tracking.trucksRemaining}`);
    logInfo(`  - Fulfillment: ${tracking.fulfillmentPercentage}%`);
  } else {
    throw new Error('No truck tracking data in response');
  }
}

async function testCreateTransportBids() {
  const bids = [
    {
      transportRequestId: testData.transportRequestId,
      bidAmount: 2800,
      truckCount: 5,
      estimatedDuration: 8,
      vehicleType: 'FLATBED',
      vehicleCapacity: 20,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      transportRequestId: testData.transportRequestId,
      bidAmount: 2500,
      truckCount: 5,
      estimatedDuration: 7,
      vehicleType: 'FLATBED',
      vehicleCapacity: 20,
      specialEquipment: ['GPS tracking', 'Temperature monitoring'],
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const [index, bidData] of bids.entries()) {
    try {
      const response = await axios.post(`${API_URL}/transport/bids`, bidData);

      if (response.data && response.data.id) {
        if (index === 1) {
          testData.transportBidId = response.data.id; // Save the second (lower) bid
        }
        logSuccess(
          `Bid ${index + 1} created: €${bidData.bidAmount} (${bidData.truckCount} trucks)`
        );
      }
    } catch (error) {
      if (error.response?.status === 400) {
        logInfo(`  - Bid ${index + 1} failed: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
  }
}

async function testListBidsForRequest() {
  const response = await axios.get(`${API_URL}/transport/bids`, {
    params: {
      transportRequestId: testData.transportRequestId,
    },
  });

  if (response.data && response.data.data) {
    logSuccess(`Found ${response.data.data.length} bids for request`);

    response.data.data.forEach((bid, index) => {
      const truckCount = bid.proposedRoute?.truckCount || 'N/A';
      logInfo(
        `  - Bid ${index + 1}: €${bid.bidAmount} | ${truckCount} trucks | ${bid.competitiveness || 'N/A'}`
      );
    });
  } else {
    throw new Error('Invalid response format');
  }
}

async function testAcceptBid() {
  if (!testData.transportBidId) {
    throw new Error('No transport bid ID available');
  }

  const response = await axios.post(
    `${API_URL}/transport/bids/${testData.transportBidId}/accept`
  );

  if (response.data && response.data.transportJob) {
    testData.transportJobId = response.data.transportJob.id;
    logSuccess(`Bid accepted and transport job created: ${response.data.transportJob.jobNumber}`);
    logInfo(`  - Job status: ${response.data.transportJob.status}`);
  } else {
    throw new Error('No transport job in response');
  }
}

async function testVerifyTransportJob() {
  const response = await axios.get(`${API_URL}/transport/jobs`, {
    params: {
      status: 'ASSIGNED',
    },
  });

  if (response.data && response.data.data) {
    const job = response.data.data.find((j) => j.id === testData.transportJobId);

    if (job) {
      logSuccess('Transport job verified');
      logInfo(`  - Job number: ${job.jobNumber}`);
      logInfo(`  - Status: ${job.status}`);
      logInfo(`  - Transporter: ${job.transporter?.name || 'N/A'}`);
    } else {
      throw new Error('Transport job not found in list');
    }
  } else {
    throw new Error('Invalid response format');
  }
}

// Run the tests
runTests();
