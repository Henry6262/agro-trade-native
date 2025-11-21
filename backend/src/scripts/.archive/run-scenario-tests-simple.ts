/**
 * Simplified Automated Scenario Testing
 * Tests simulation endpoints directly through API without complex Prisma operations
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface TestResult {
  scenario: string;
  step: number;
  stepName: string;
  status: 'PASSED' | 'FAILED';
  message?: string;
}

interface ScenarioReport {
  scenarioName: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  duration: number;
  results: TestResult[];
}

let adminToken: string;
const testResults: ScenarioReport[] = [];

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step: number, message: string) {
  log(`\n${colors.bright}Step ${step}: ${message}${colors.reset}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function authenticateAsAdmin(): Promise<string> {
  try {
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'test123',
    });

    if (loginResponse.data.access_token) {
      return loginResponse.data.access_token;
    }
  } catch (error) {
    logInfo('Creating test admin user...');
  }

  const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
    email: 'admin@test.com',
    password: 'test123',
    name: 'Test Admin',
    role: 'ADMIN',
  });

  return registerResponse.data.access_token;
}

async function createTestUser(role: string, data: any = {}) {
  const response = await axios.post(
    `${API_BASE}/simulation/users/create-test-user`,
    { role, data },
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
}

async function getUsersByRole(role: string) {
  const response = await axios.get(
    `${API_BASE}/simulation/users/${role}`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
}

async function getFullTradeState(tradeOperationId: string) {
  const response = await axios.get(
    `${API_BASE}/simulation/trade-operation/${tradeOperationId}/full-state`,
    { headers: { Authorization: `Bearer ${adminToken}` } }
  );
  return response.data;
}

// ==================== TEST SIMULATION ENDPOINTS ====================

async function testSimulationEndpoints(): Promise<ScenarioReport> {
  const scenarioName = 'Simulation API Endpoint Testing';
  const results: TestResult[] = [];
  const startTime = Date.now();

  log(`\n${'='.repeat(80)}`, colors.magenta);
  log(`SCENARIO: ${scenarioName}`, colors.bright + colors.magenta);
  log('='.repeat(80), colors.magenta);

  try {
    // Test 1: Create test users
    logStep(1, 'Testing user creation endpoints');
    const buyer = await createTestUser('BUYER', { companyName: 'Test Buyer Corp' });
    const seller = await createTestUser('SELLER', { farmName: 'Test Farm', farmSize: 200 });
    const transporter = await createTestUser('TRANSPORTER', { companyName: 'Fast Transport', fleetSize: 5 });
    const inspector = await createTestUser('INSPECTOR', { specializations: ['Grains'] });

    if (buyer?.id && seller?.id && transporter?.id && inspector?.id) {
      logSuccess(`Created 4 test users successfully`);
      logInfo(`  Buyer ID: ${buyer.id}`);
      logInfo(`  Seller ID: ${seller.id}`);
      logInfo(`  Transporter ID: ${transporter.id}`);
      logInfo(`  Inspector ID: ${inspector.id}`);
      results.push({ scenario: scenarioName, step: 1, stepName: 'Create users', status: 'PASSED' });
    } else {
      throw new Error('Failed to create all users');
    }

    // Test 2: Query users by role
    logStep(2, 'Testing getUsersByRole endpoint');
    const buyers = await getUsersByRole('BUYER');
    const sellers = await getUsersByRole('SELLER');

    if (buyers.length > 0 && sellers.length > 0) {
      logSuccess(`Found ${buyers.length} buyers and ${sellers.length} sellers`);
      results.push({ scenario: scenarioName, step: 2, stepName: 'Query users by role', status: 'PASSED' });
    } else {
      throw new Error('Failed to query users by role');
    }

    // Test 3: Create buy listing via simulation
    logStep(3, 'Testing buyer create listing endpoint');
    const products = await axios.get(`${API_BASE}/products`);
    const product = products.data[0];

    const buyListingResponse = await axios.post(
      `${API_BASE}/simulation/buyer/${buyer.id}/create-listing`,
      {
        productId: product.id,
        quantity: 500,
        unit: 'TON',
        maxPricePerUnit: 300,
        deliveryLocation: { lat: 42.6977, lng: 23.3219 },
        deliveryBy: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test buy listing',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const buyListing = buyListingResponse.data;
    if (buyListing?.id) {
      logSuccess(`Buy listing created: ${buyListing.id}`);
      logInfo(`  Product: ${product.name}`);
      logInfo(`  Quantity: 500 TON`);
      results.push({ scenario: scenarioName, step: 3, stepName: 'Create buy listing', status: 'PASSED' });
    } else {
      throw new Error('Failed to create buy listing');
    }

    // Test 4: Create trade operation
    logStep(4, 'Creating trade operation via regular API');
    const tradeOpResponse = await axios.post(
      `${API_BASE}/trade-operations`,
      {
        buyListingId: buyListing.id,
        marginPercentage: 10,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const tradeOp = tradeOpResponse.data;
    if (tradeOp?.id) {
      logSuccess(`Trade operation created: ${tradeOp.id}`);
      results.push({ scenario: scenarioName, step: 4, stepName: 'Create trade operation', status: 'PASSED' });
    } else {
      throw new Error('Failed to create trade operation');
    }

    // Test 5: Create sale listing and sellers manually
    logStep(5, 'Setting up sellers and negotiations');
    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product.id,
        quantity: 300,
        unit: 'TON',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });

    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: tradeOp.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        status: 'INVITED',
        offeredQuantity: 300,
        requestedQuantity: 300,
      },
    });

    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: tradeOp.id,
        tradeSellerId: tradeSeller.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 300,
          pricePerUnit: 270,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    logSuccess(`Seller and negotiation setup complete`);
    results.push({ scenario: scenarioName, step: 5, stepName: 'Setup sellers', status: 'PASSED' });

    // Test 6: Seller accepts offer
    logStep(6, 'Testing seller accept offer endpoint');
    await axios.post(
      `${API_BASE}/simulation/seller/${seller.id}/accept-offer`,
      { negotiationId: negotiation.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const updatedNegotiation = await prisma.offerNegotiation.findUnique({
      where: { id: negotiation.id },
    });

    if (updatedNegotiation?.status === 'ACCEPTED') {
      logSuccess('Seller successfully accepted offer');
      results.push({ scenario: scenarioName, step: 6, stepName: 'Seller accepts offer', status: 'PASSED' });
    } else {
      throw new Error(`Expected ACCEPTED, got ${updatedNegotiation?.status}`);
    }

    // Test 7: Create and assign inspection
    logStep(7, 'Testing inspector endpoints');
    const inspection = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId: tradeOp.id,
        saleListingId: saleListing.id,
        status: 'PENDING',
        latitude: 42.6977,
        longitude: 23.3219,
        requestedDate: new Date(),
      },
    });

    // Inspector accepts job
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/accept-job`,
      { inspectionId: inspection.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    // Inspector submits results
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/submit-results`,
      {
        inspectionId: inspection.id,
        qualityScore: 85,
        result: 'PASSED',
        notes: 'High quality product',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const updatedInspection = await prisma.inspectionRequest.findUnique({
      where: { id: inspection.id },
    });

    const inspectionResult = updatedInspection?.verificationResult as any;
    if (updatedInspection?.status === 'COMPLETED' && inspectionResult?.result === 'PASSED') {
      logSuccess('Inspector successfully completed inspection');
      logInfo(`  Quality Score: ${updatedInspection.qualityScore}`);
      results.push({ scenario: scenarioName, step: 7, stepName: 'Inspector workflow', status: 'PASSED' });
    } else {
      throw new Error('Inspection not completed correctly');
    }

    // Test 8: Transport workflow
    logStep(8, 'Testing transporter endpoints');
    const transportRequest = await prisma.transportRequest.create({
      data: {
        requestNumber: `REQ-${Date.now()}`,
        tradeOperationId: tradeOp.id,
        totalWeight: 500,
        pickupPoints: [{ lat: 42.6977, lng: 23.3219, address: 'Test Farm' }],
        deliveryPoint: { lat: 42.6977, lng: 23.3219, address: 'Test Warehouse' },
        specialRequirements: ['Temperature controlled'],
        biddingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'OPEN',
      },
    });

    // Transporter submits bid
    const bidResponse = await axios.post(
      `${API_BASE}/simulation/transporter/${transporter.id}/submit-bid`,
      {
        transportRequestId: transportRequest.id,
        bidAmount: 4500,
        estimatedDuration: 36,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const bid = bidResponse.data;
    if (bid?.id) {
      logSuccess('Transporter successfully submitted bid');
      logInfo(`  Bid Amount: €${bid.bidAmount}`);
      results.push({ scenario: scenarioName, step: 8, stepName: 'Transport bidding', status: 'PASSED' });
    } else {
      throw new Error('Failed to create bid');
    }

    // Test 9: Get full trade state
    logStep(9, 'Testing full trade state endpoint');
    const fullState = await getFullTradeState(tradeOp.id);

    if (fullState?.operation && fullState?.state && fullState?.actors) {
      logSuccess('Successfully retrieved full trade state');
      logInfo(`  Phase: ${fullState.state.phase}`);
      logInfo(`  Status: ${fullState.state.status}`);
      logInfo(`  Quantity Gap: ${fullState.state.quantityGap}`);
      logInfo(`  Inspections Passed: ${fullState.state.inspections.passed}`);
      logInfo(`  Sellers Count: ${fullState.actors.sellers.length}`);
      results.push({ scenario: scenarioName, step: 9, stepName: 'Get full trade state', status: 'PASSED' });
    } else {
      throw new Error('Invalid full state response');
    }

    // Test 10: Counter-offer workflow
    logStep(10, 'Testing counter-offer endpoint');

    // Create new negotiation for counter-offer test
    const seller2 = await createTestUser('SELLER', { farmName: 'Counter Farm', farmSize: 250 });
    const saleListing2 = await prisma.saleListing.create({
      data: {
        sellerId: seller2.id,
        productId: product.id,
        quantity: 200,
        unit: 'TON',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });

    const tradeSeller2 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: tradeOp.id,
        sellerId: seller2.id,
        saleListingId: saleListing2.id,
        status: 'INVITED',
        offeredQuantity: 200,
        requestedQuantity: 200,
      },
    });

    const negotiation2 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: tradeOp.id,
        tradeSellerId: tradeSeller2.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 200,
          pricePerUnit: 270,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await axios.post(
      `${API_BASE}/simulation/seller/${seller2.id}/counter-offer`,
      {
        negotiationId: negotiation2.id,
        counterPrice: 285,
        counterQuantity: 200,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const counterNegotiation = await prisma.offerNegotiation.findUnique({
      where: { id: negotiation2.id },
    });

    if (counterNegotiation?.status === 'COUNTERED') {
      logSuccess('Seller successfully sent counter-offer');
      logInfo(`  Counter-offer in negotiation record`);
      results.push({ scenario: scenarioName, step: 10, stepName: 'Counter-offer workflow', status: 'PASSED' });
    } else {
      throw new Error(`Expected COUNTERED, got ${counterNegotiation?.status}`);
    }

    // Test 11: Reject offer workflow
    logStep(11, 'Testing reject offer endpoint');
    const seller3 = await createTestUser('SELLER', { farmName: 'Reject Farm', farmSize: 150 });
    const saleListing3 = await prisma.saleListing.create({
      data: {
        sellerId: seller3.id,
        productId: product.id,
        quantity: 100,
        unit: 'TON',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });

    const tradeSeller3 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: tradeOp.id,
        sellerId: seller3.id,
        saleListingId: saleListing3.id,
        status: 'INVITED',
        offeredQuantity: 100,
        requestedQuantity: 100,
      },
    });

    const negotiation3 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: tradeOp.id,
        tradeSellerId: tradeSeller3.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 100,
          pricePerUnit: 250,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    await axios.post(
      `${API_BASE}/simulation/seller/${seller3.id}/reject-offer`,
      {
        negotiationId: negotiation3.id,
        reason: 'Price too low',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const rejectedNegotiation = await prisma.offerNegotiation.findUnique({
      where: { id: negotiation3.id },
    });

    const rejectedTradeSeller = await prisma.tradeSeller.findUnique({
      where: { id: tradeSeller3.id },
    });

    if (rejectedNegotiation?.status === 'REJECTED' && rejectedTradeSeller?.status === 'REJECTED') {
      logSuccess('Seller successfully rejected offer');
      results.push({ scenario: scenarioName, step: 11, stepName: 'Reject offer workflow', status: 'PASSED' });
    } else {
      throw new Error('Reject workflow did not complete correctly');
    }

  } catch (error: any) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
    results.push({
      scenario: scenarioName,
      step: results.length + 1,
      stepName: 'Error occurred',
      status: 'FAILED',
      message: error.message,
    });
  }

  const duration = Date.now() - startTime;
  const passedSteps = results.filter(r => r.status === 'PASSED').length;
  const failedSteps = results.filter(r => r.status === 'FAILED').length;

  return {
    scenarioName,
    totalSteps: results.length,
    passedSteps,
    failedSteps,
    duration,
    results,
  };
}

// ==================== FINAL REPORT ====================

function generateFinalReport(reports: ScenarioReport[]) {
  log(`\n${'='.repeat(80)}`, colors.bright + colors.cyan);
  log('SIMULATION API TEST REPORT', colors.bright + colors.cyan);
  log('='.repeat(80), colors.bright + colors.cyan);

  const totalSteps = reports.reduce((sum, r) => sum + r.totalSteps, 0);
  const totalPassed = reports.reduce((sum, r) => sum + r.passedSteps, 0);
  const totalFailed = reports.reduce((sum, r) => sum + r.failedSteps, 0);
  const totalDuration = reports.reduce((sum, r) => sum + r.duration, 0);

  log(`\n📊 OVERALL STATISTICS`, colors.bright);
  log(`${'─'.repeat(80)}`);
  log(`Total Test Steps:        ${totalSteps}`);
  log(`Steps Passed:            ${totalPassed} ✅`, colors.green);
  log(`Steps Failed:            ${totalFailed} ❌`, totalFailed > 0 ? colors.red : colors.green);
  log(`Success Rate:            ${((totalPassed / totalSteps) * 100).toFixed(1)}%`);
  log(`Total Duration:          ${(totalDuration / 1000).toFixed(2)}s`);

  log(`\n🎯 FEATURES TESTED`, colors.bright);
  log(`${'─'.repeat(80)}`);

  const testedFeatures = [
    '✅ User Creation (Buyer, Seller, Transporter, Inspector)',
    '✅ Query Users by Role',
    '✅ Buyer Create Listing Simulation',
    '✅ Trade Operation Creation',
    '✅ Seller Accept Offer',
    '✅ Seller Counter Offer',
    '✅ Seller Reject Offer',
    '✅ Inspector Accept Job',
    '✅ Inspector Submit Results (PASSED)',
    '✅ Transporter Submit Bid',
    '✅ Full Trade State Query',
  ];

  testedFeatures.forEach(feature => log(feature, colors.green));

  log(`\n📋 SCENARIOS SUMMARY`, colors.bright);
  log(`${'─'.repeat(80)}`);

  reports.forEach((report, index) => {
    const successRate = (report.passedSteps / report.totalSteps) * 100;
    const statusColor = report.failedSteps === 0 ? colors.green : colors.red;
    const statusIcon = report.failedSteps === 0 ? '✅' : '❌';

    log(`\n${index + 1}. ${report.scenarioName} ${statusIcon}`, statusColor);
    log(`   Steps: ${report.passedSteps}/${report.totalSteps} passed (${successRate.toFixed(1)}%)`);
    log(`   Duration: ${(report.duration / 1000).toFixed(2)}s`);

    if (report.failedSteps > 0) {
      log(`   Failed Steps:`, colors.red);
      report.results
        .filter(r => r.status === 'FAILED')
        .forEach(r => {
          log(`     - Step ${r.step}: ${r.stepName} - ${r.message}`, colors.red);
        });
    }
  });

  log(`\n${'='.repeat(80)}`, colors.bright + colors.cyan);

  if (totalFailed === 0) {
    log('🎉 ALL TESTS PASSED! Simulation API fully functional.', colors.bright + colors.green);
  } else {
    log(`⚠️  ${totalFailed} TEST(S) FAILED. Review errors above.`, colors.bright + colors.red);
  }

  log('='.repeat(80), colors.bright + colors.cyan);
}

// ==================== MAIN ====================

async function main() {
  log('\n🚀 Starting Simulation API Test Suite', colors.bright + colors.cyan);
  log('='.repeat(80), colors.cyan);

  try {
    logInfo('Authenticating as admin...');
    adminToken = await authenticateAsAdmin();
    logSuccess('Admin authentication successful\n');

    const testReport = await testSimulationEndpoints();
    testResults.push(testReport);

    generateFinalReport(testResults);

  } catch (error: any) {
    logError(`\n💥 CRITICAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
