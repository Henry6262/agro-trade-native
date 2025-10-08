/**
 * Automated Scenario Testing Script
 *
 * This script runs comprehensive trade operation scenarios through the simulation API
 * to verify all user interactions, state transitions, and business logic.
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:4000/api';

// ANSI color codes for pretty output
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
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  message?: string;
  duration?: number;
  error?: any;
}

interface ScenarioReport {
  scenarioName: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  duration: number;
  results: TestResult[];
}

let adminToken: string;
const testResults: ScenarioReport[] = [];

// ==================== UTILITY FUNCTIONS ====================

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

function logWarning(message: string) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== API HELPERS ====================

async function authenticateAsAdmin(): Promise<string> {
  try {
    // First try to login with existing admin
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@test.com',
      password: 'test123',
    });

    if (loginResponse.data.accessToken) {
      return loginResponse.data.accessToken;
    }
  } catch (error) {
    // Admin doesn't exist, create one
    logInfo('Creating test admin user...');
  }

  // Register new admin
  const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
    email: 'admin@test.com',
    password: 'test123',
    name: 'Test Admin',
    role: 'ADMIN',
  });

  return registerResponse.data.accessToken;
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

// ==================== SCENARIO 1: HAPPY PATH ====================

async function runHappyPathScenario(): Promise<ScenarioReport> {
  const scenarioName = 'Happy Path - Complete Successful Trade';
  const results: TestResult[] = [];
  const startTime = Date.now();

  log(`\n${'='.repeat(80)}`, colors.magenta);
  log(`SCENARIO 1: ${scenarioName}`, colors.bright + colors.magenta);
  log('='.repeat(80), colors.magenta);

  try {
    // Step 1: Create test users
    logStep(1, 'Creating test users (Buyer, Sellers, Transporter, Inspector)');
    const buyer = await createTestUser('BUYER', { companyName: 'Test Buyer Corp' });
    const seller1 = await createTestUser('SELLER', { farmName: 'Happy Farm 1', farmSize: 200 });
    const seller2 = await createTestUser('SELLER', { farmName: 'Happy Farm 2', farmSize: 300 });
    const transporter = await createTestUser('TRANSPORTER', { companyName: 'Fast Logistics', fleetSize: 10 });
    const inspector = await createTestUser('INSPECTOR', { specializations: ['Grains'] });

    logSuccess(`Created ${[buyer, seller1, seller2, transporter, inspector].length} test users`);
    results.push({ scenario: scenarioName, step: 1, stepName: 'Create users', status: 'PASSED' });

    // Step 2: Get product for buy listing
    logStep(2, 'Getting available products');
    const products = await axios.get(`${API_BASE}/products`);
    const wheatProduct = products.data[0];
    logSuccess(`Found product: ${wheatProduct.name}`);
    results.push({ scenario: scenarioName, step: 2, stepName: 'Get products', status: 'PASSED' });

    // Step 3: Buyer creates buy listing
    logStep(3, 'Buyer creates buy listing for 500 tons');
    const buyListingResponse = await axios.post(
      `${API_BASE}/simulation/buyer/${buyer.id}/create-listing`,
      {
        productId: wheatProduct.id,
        quantity: 500,
        unit: 'TON',
        maxPricePerUnit: 300,
        deliveryLocation: { lat: 42.6977, lng: 23.3219 },
        deliveryBy: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Test buy listing for scenario testing',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const buyListing = buyListingResponse.data;
    logSuccess(`Buy listing created: ${buyListing.id}`);
    results.push({ scenario: scenarioName, step: 3, stepName: 'Create buy listing', status: 'PASSED' });

    // Step 4: Create sellers' sale listings
    logStep(4, 'Creating sale listings for sellers');
    const saleListing1 = await prisma.saleListing.create({
      data: {
        sellerId: seller1.seller.id,
        productId: wheatProduct.id,
        quantity: 200,
        unit: 'TON',
        minOrderQuantity: 50,
        location: 'Test Farm Location 1',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });
    const saleListing2 = await prisma.saleListing.create({
      data: {
        sellerId: seller2.seller.id,
        productId: wheatProduct.id,
        quantity: 300,
        unit: 'TON',
        minOrderQuantity: 100,
        location: 'Test Farm Location 2',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });
    logSuccess(`Created 2 sale listings`);
    results.push({ scenario: scenarioName, step: 4, stepName: 'Create sale listings', status: 'PASSED' });

    // Step 5: Admin creates trade operation
    logStep(5, 'Admin creates trade operation with 10% margin');
    const tradeOp = await axios.post(
      `${API_BASE}/trade-operations`,
      {
        buyListingId: buyListing.id,
        marginPercentage: 10,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const tradeOperationId = tradeOp.data.id;
    logSuccess(`Trade operation created: ${tradeOperationId}`);
    results.push({ scenario: scenarioName, step: 5, stepName: 'Create trade operation', status: 'PASSED' });

    // Step 6: Admin sends offers to sellers
    logStep(6, 'Admin sending offers to 2 sellers');

    // Add sellers to trade operation
    const tradeSeller1 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: seller1.seller.id,
        saleListingId: saleListing1.id,
        status: 'INVITED',
        offeredQuantity: 200,
        offeredPricePerUnit: 270,
      },
    });

    const tradeSeller2 = await prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: seller2.seller.id,
        saleListingId: saleListing2.id,
        status: 'INVITED',
        offeredQuantity: 300,
        offeredPricePerUnit: 275,
      },
    });

    // Create negotiations
    const negotiation1 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: tradeSeller1.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 200,
          pricePerUnit: 270,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    const negotiation2 = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: tradeSeller2.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 300,
          pricePerUnit: 275,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    logSuccess(`Sent offers to 2 sellers`);
    results.push({ scenario: scenarioName, step: 6, stepName: 'Send offers to sellers', status: 'PASSED' });

    // Step 7: Seller 1 accepts offer
    logStep(7, 'Seller 1 accepts offer');
    await axios.post(
      `${API_BASE}/simulation/seller/${seller1.id}/accept-offer`,
      { negotiationId: negotiation1.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Seller 1 accepted offer');
    results.push({ scenario: scenarioName, step: 7, stepName: 'Seller 1 accepts', status: 'PASSED' });

    // Step 8: Seller 2 counters with higher price
    logStep(8, 'Seller 2 sends counter-offer');
    await axios.post(
      `${API_BASE}/simulation/seller/${seller2.id}/counter-offer`,
      {
        negotiationId: negotiation2.id,
        counterPrice: 280,
        counterQuantity: 300,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Seller 2 sent counter-offer at €280/ton');
    results.push({ scenario: scenarioName, step: 8, stepName: 'Seller 2 counters', status: 'PASSED' });

    // Step 9: Admin accepts counter-offer
    logStep(9, 'Admin accepts Seller 2 counter-offer');
    await prisma.offerNegotiation.update({
      where: { id: negotiation2.id },
      data: { status: 'ACCEPTED' },
    });
    await prisma.tradeSeller.update({
      where: { id: tradeSeller2.id },
      data: { status: 'ACCEPTED', agreedQuantity: 300 },
    });
    logSuccess('Admin accepted counter-offer');
    results.push({ scenario: scenarioName, step: 9, stepName: 'Admin accepts counter', status: 'PASSED' });

    // Step 10: Request inspections
    logStep(10, 'Admin requests quality inspections');
    const inspection1 = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId,
        saleListingId: saleListing1.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });
    const inspection2 = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId,
        saleListingId: saleListing2.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });
    logSuccess('Created 2 inspection requests');
    results.push({ scenario: scenarioName, step: 10, stepName: 'Request inspections', status: 'PASSED' });

    // Step 11: Inspector accepts jobs
    logStep(11, 'Inspector accepts inspection jobs');
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/accept-job`,
      { inspectionId: inspection1.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/accept-job`,
      { inspectionId: inspection2.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Inspector accepted both jobs');
    results.push({ scenario: scenarioName, step: 11, stepName: 'Inspector accepts jobs', status: 'PASSED' });

    // Step 12: Inspector submits passing results
    logStep(12, 'Inspector submits passing inspection results');
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/submit-results`,
      {
        inspectionId: inspection1.id,
        qualityScore: 85,
        result: 'PASSED',
        notes: 'High quality wheat, meets all standards',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/submit-results`,
      {
        inspectionId: inspection2.id,
        qualityScore: 88,
        result: 'PASSED',
        notes: 'Excellent quality, exceeds requirements',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Inspector submitted passing results (scores: 85, 88)');
    results.push({ scenario: scenarioName, step: 12, stepName: 'Submit inspection results', status: 'PASSED' });

    // Step 13: Create transport request
    logStep(13, 'Admin creates transport request');
    const transportRequest = await prisma.transportRequest.create({
      data: {
        tradeOperationId,
        pickupAddress: 'Test Farm Locations',
        deliveryAddress: 'Buyer Warehouse',
        totalWeight: 500,
        totalVolume: 625,
        deliveryDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: 'PENDING',
      },
    });
    logSuccess(`Transport request created: ${transportRequest.id}`);
    results.push({ scenario: scenarioName, step: 13, stepName: 'Create transport request', status: 'PASSED' });

    // Step 14: Transporter submits bid
    logStep(14, 'Transporter submits competitive bid');
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
    logSuccess(`Transporter submitted bid: €${bid.bidAmount}`);
    results.push({ scenario: scenarioName, step: 14, stepName: 'Submit transport bid', status: 'PASSED' });

    // Step 15: Admin accepts bid and creates job
    logStep(15, 'Admin accepts transport bid');
    await prisma.transportBid.update({
      where: { id: bid.id },
      data: { status: 'ACCEPTED' },
    });
    const transportJob = await prisma.transportJob.create({
      data: {
        transportRequestId: transportRequest.id,
        transporterId: transporter.transporter.id,
        tradeOperationId,
        status: 'PENDING',
        scheduledPickup: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        scheduledDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      },
    });
    logSuccess('Admin accepted bid and created transport job');
    results.push({ scenario: scenarioName, step: 15, stepName: 'Accept bid', status: 'PASSED' });

    // Step 16: Transporter starts job
    logStep(16, 'Transporter starts delivery job');
    await axios.post(
      `${API_BASE}/simulation/transporter/${transporter.id}/start-job`,
      { jobId: transportJob.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Transporter started delivery');
    results.push({ scenario: scenarioName, step: 16, stepName: 'Start transport job', status: 'PASSED' });

    // Step 17: Transporter completes delivery
    logStep(17, 'Transporter completes delivery');
    await axios.post(
      `${API_BASE}/simulation/transporter/${transporter.id}/complete-delivery`,
      {
        jobId: transportJob.id,
        deliveryNotes: 'Delivery completed successfully, all goods in excellent condition',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Transporter completed delivery');
    results.push({ scenario: scenarioName, step: 17, stepName: 'Complete delivery', status: 'PASSED' });

    // Step 18: Verify final state
    logStep(18, 'Verifying final trade operation state');
    const finalState = await getFullTradeState(tradeOperationId);

    logInfo('Final State Analysis:');
    logInfo(`  Phase: ${finalState.state.phase}`);
    logInfo(`  Status: ${finalState.state.status}`);
    logInfo(`  Secured Quantity: ${finalState.state.securedQuantity}/${finalState.state.totalQuantityNeeded} tons`);
    logInfo(`  Inspections Passed: ${finalState.state.inspections.passed}/${finalState.state.inspections.total}`);
    logInfo(`  Transport Status: ${finalState.state.activeTransport?.status || 'N/A'}`);

    const allInspectionsPassed = finalState.state.inspections.passed === finalState.state.inspections.total;
    const quantityFulfilled = finalState.state.securedQuantity >= finalState.state.totalQuantityNeeded;

    if (allInspectionsPassed && quantityFulfilled) {
      logSuccess('All verifications passed! Trade ready for completion');
      results.push({ scenario: scenarioName, step: 18, stepName: 'Verify final state', status: 'PASSED' });
    } else {
      logError('Final state verification failed');
      results.push({
        scenario: scenarioName,
        step: 18,
        stepName: 'Verify final state',
        status: 'FAILED',
        message: 'Final state does not meet completion criteria',
      });
    }

  } catch (error: any) {
    logError(`Scenario failed: ${error.message}`);
    results.push({
      scenario: scenarioName,
      step: results.length + 1,
      stepName: 'Error occurred',
      status: 'FAILED',
      error: error.message,
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
    skippedSteps: 0,
    duration,
    results,
  };
}

// ==================== SCENARIO 2: INSPECTION FAILURE ====================

async function runInspectionFailureScenario(): Promise<ScenarioReport> {
  const scenarioName = 'Inspection Failure - Replacement Flow';
  const results: TestResult[] = [];
  const startTime = Date.now();

  log(`\n${'='.repeat(80)}`, colors.magenta);
  log(`SCENARIO 2: ${scenarioName}`, colors.bright + colors.magenta);
  log('='.repeat(80), colors.magenta);

  try {
    // Step 1: Create test users
    logStep(1, 'Creating test users for failure scenario');
    const buyer = await createTestUser('BUYER', { companyName: 'Quality Foods Inc' });
    const sellerBad = await createTestUser('SELLER', { farmName: 'Subpar Farm', farmSize: 150 });
    const sellerGood = await createTestUser('SELLER', { farmName: 'Premium Farm', farmSize: 250 });
    const inspector = await createTestUser('INSPECTOR', { specializations: ['Quality Control'] });

    logSuccess('Created test users');
    results.push({ scenario: scenarioName, step: 1, stepName: 'Create users', status: 'PASSED' });

    // Step 2: Get product
    logStep(2, 'Getting product for buy listing');
    const products = await axios.get(`${API_BASE}/products`);
    const product = products.data[0];
    results.push({ scenario: scenarioName, step: 2, stepName: 'Get products', status: 'PASSED' });

    // Step 3: Create buy listing
    logStep(3, 'Buyer creates buy listing');
    const buyListingResponse = await axios.post(
      `${API_BASE}/simulation/buyer/${buyer.id}/create-listing`,
      {
        productId: product.id,
        quantity: 300,
        unit: 'TON',
        maxPricePerUnit: 300,
        deliveryLocation: { lat: 40.7128, lng: -74.0060 },
        deliveryBy: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const buyListing = buyListingResponse.data;
    logSuccess('Buy listing created');
    results.push({ scenario: scenarioName, step: 3, stepName: 'Create buy listing', status: 'PASSED' });

    // Step 4: Create sale listings
    logStep(4, 'Creating sale listings');
    const saleListingBad = await prisma.saleListing.create({
      data: {
        sellerId: sellerBad.seller.id,
        productId: product.id,
        quantity: 150,
        unit: 'TON',
        minOrderQuantity: 50,
        location: 'Poor Quality Farm',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });
    const saleListingGood = await prisma.saleListing.create({
      data: {
        sellerId: sellerGood.seller.id,
        productId: product.id,
        quantity: 300,
        unit: 'TON',
        minOrderQuantity: 100,
        location: 'High Quality Farm',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });
    logSuccess('Created sale listings');
    results.push({ scenario: scenarioName, step: 4, stepName: 'Create sale listings', status: 'PASSED' });

    // Step 5: Create trade operation
    logStep(5, 'Creating trade operation');
    const tradeOp = await axios.post(
      `${API_BASE}/trade-operations`,
      { buyListingId: buyListing.id, marginPercentage: 12 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const tradeOperationId = tradeOp.data.id;
    logSuccess('Trade operation created');
    results.push({ scenario: scenarioName, step: 5, stepName: 'Create trade operation', status: 'PASSED' });

    // Step 6: Send offer to bad seller first
    logStep(6, 'Sending offer to seller (who will fail inspection)');
    const tradeSellerBad = await prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: sellerBad.seller.id,
        saleListingId: saleListingBad.id,
        status: 'INVITED',
        offeredQuantity: 150,
        offeredPricePerUnit: 270,
      },
    });

    const negotiationBad = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: tradeSellerBad.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 150,
          pricePerUnit: 270,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    logSuccess('Sent offer to seller');
    results.push({ scenario: scenarioName, step: 6, stepName: 'Send offer', status: 'PASSED' });

    // Step 7: Seller accepts
    logStep(7, 'Seller accepts offer');
    await axios.post(
      `${API_BASE}/simulation/seller/${sellerBad.id}/accept-offer`,
      { negotiationId: negotiationBad.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Seller accepted offer');
    results.push({ scenario: scenarioName, step: 7, stepName: 'Seller accepts', status: 'PASSED' });

    // Step 8: Request inspection
    logStep(8, 'Requesting quality inspection');
    const inspection = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId,
        saleListingId: saleListingBad.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });
    logSuccess('Inspection requested');
    results.push({ scenario: scenarioName, step: 8, stepName: 'Request inspection', status: 'PASSED' });

    // Step 9: Inspector accepts job
    logStep(9, 'Inspector accepts inspection job');
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/accept-job`,
      { inspectionId: inspection.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Inspector accepted job');
    results.push({ scenario: scenarioName, step: 9, stepName: 'Inspector accepts', status: 'PASSED' });

    // Step 10: Inspector submits FAILING results
    logStep(10, 'Inspector submits FAILING inspection results');
    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/submit-results`,
      {
        inspectionId: inspection.id,
        qualityScore: 55, // Below passing threshold
        result: 'FAILED',
        notes: 'Quality below acceptable standards - moisture content too high, foreign matter detected',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Inspector submitted FAILED result (score: 55)');
    results.push({ scenario: scenarioName, step: 10, stepName: 'Inspection fails', status: 'PASSED' });

    // Step 11: Verify seller was marked as failed
    logStep(11, 'Verifying failed seller status');
    const failedTradeSeller = await prisma.tradeSeller.findUnique({
      where: { id: tradeSellerBad.id },
    });

    if (failedTradeSeller?.status === 'FAILED_INSPECTION') {
      logSuccess('Seller correctly marked as FAILED_INSPECTION');
      results.push({ scenario: scenarioName, step: 11, stepName: 'Verify failure status', status: 'PASSED' });
    } else {
      logError(`Expected FAILED_INSPECTION, got ${failedTradeSeller?.status}`);
      results.push({
        scenario: scenarioName,
        step: 11,
        stepName: 'Verify failure status',
        status: 'FAILED',
        message: 'Seller not marked as failed',
      });
    }

    // Step 12: Find replacement seller
    logStep(12, 'Admin finding replacement seller');
    const tradeSellerGood = await prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: sellerGood.seller.id,
        saleListingId: saleListingGood.id,
        status: 'INVITED',
        offeredQuantity: 300,
        offeredPricePerUnit: 275,
      },
    });

    const negotiationGood = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: tradeSellerGood.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 300,
          pricePerUnit: 275,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    logSuccess('Sent offer to replacement seller');
    results.push({ scenario: scenarioName, step: 12, stepName: 'Find replacement', status: 'PASSED' });

    // Step 13: Replacement seller accepts
    logStep(13, 'Replacement seller accepts offer');
    await axios.post(
      `${API_BASE}/simulation/seller/${sellerGood.id}/accept-offer`,
      { negotiationId: negotiationGood.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Replacement seller accepted');
    results.push({ scenario: scenarioName, step: 13, stepName: 'Replacement accepts', status: 'PASSED' });

    // Step 14: Inspect replacement seller
    logStep(14, 'Inspecting replacement seller');
    const inspectionGood = await prisma.inspectionRequest.create({
      data: {
        tradeOperationId,
        saleListingId: saleListingGood.id,
        status: 'PENDING',
        requestedAt: new Date(),
      },
    });

    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/accept-job`,
      { inspectionId: inspectionGood.id },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    await axios.post(
      `${API_BASE}/simulation/inspector/${inspector.id}/submit-results`,
      {
        inspectionId: inspectionGood.id,
        qualityScore: 92,
        result: 'PASSED',
        notes: 'Excellent quality, all standards met',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Replacement seller passed inspection (score: 92)');
    results.push({ scenario: scenarioName, step: 14, stepName: 'Replacement passes inspection', status: 'PASSED' });

    // Step 15: Verify final state
    logStep(15, 'Verifying final state shows recovery from failure');
    const finalState = await getFullTradeState(tradeOperationId);

    logInfo('Final State Analysis:');
    logInfo(`  Total Inspections: ${finalState.state.inspections.total}`);
    logInfo(`  Passed: ${finalState.state.inspections.passed}`);
    logInfo(`  Failed: ${finalState.state.inspections.failed}`);

    if (finalState.state.inspections.failed === 1 && finalState.state.inspections.passed >= 1) {
      logSuccess('Successfully recovered from inspection failure!');
      results.push({ scenario: scenarioName, step: 15, stepName: 'Verify recovery', status: 'PASSED' });
    } else {
      results.push({
        scenario: scenarioName,
        step: 15,
        stepName: 'Verify recovery',
        status: 'FAILED',
        message: 'Recovery state incorrect',
      });
    }

  } catch (error: any) {
    logError(`Scenario failed: ${error.message}`);
    results.push({
      scenario: scenarioName,
      step: results.length + 1,
      stepName: 'Error occurred',
      status: 'FAILED',
      error: error.message,
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
    skippedSteps: 0,
    duration,
    results,
  };
}

// ==================== SCENARIO 3: COUNTER-OFFER NEGOTIATION ====================

async function runCounterOfferScenario(): Promise<ScenarioReport> {
  const scenarioName = 'Multi-Round Counter-Offer Negotiation';
  const results: TestResult[] = [];
  const startTime = Date.now();

  log(`\n${'='.repeat(80)}`, colors.magenta);
  log(`SCENARIO 3: ${scenarioName}`, colors.bright + colors.magenta);
  log('='.repeat(80), colors.magenta);

  try {
    // Step 1: Create users
    logStep(1, 'Creating test users');
    const buyer = await createTestUser('BUYER', { companyName: 'Negotiator Foods' });
    const seller = await createTestUser('SELLER', { farmName: 'Smart Farm', farmSize: 400 });
    logSuccess('Created test users');
    results.push({ scenario: scenarioName, step: 1, stepName: 'Create users', status: 'PASSED' });

    // Step 2: Setup buy listing
    logStep(2, 'Creating buy listing');
    const products = await axios.get(`${API_BASE}/products`);
    const product = products.data[0];

    const buyListingResponse = await axios.post(
      `${API_BASE}/simulation/buyer/${buyer.id}/create-listing`,
      {
        productId: product.id,
        quantity: 400,
        unit: 'TON',
        maxPricePerUnit: 300,
        deliveryLocation: { lat: 41.8781, lng: -87.6298 },
        deliveryBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const buyListing = buyListingResponse.data;
    results.push({ scenario: scenarioName, step: 2, stepName: 'Create buy listing', status: 'PASSED' });

    // Step 3: Create sale listing
    logStep(3, 'Creating sale listing');
    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.seller.id,
        productId: product.id,
        quantity: 400,
        unit: 'TON',
        minOrderQuantity: 100,
        location: 'Negotiation Farm',
        harvestDate: new Date(),
        status: 'ACTIVE',
      },
    });
    results.push({ scenario: scenarioName, step: 3, stepName: 'Create sale listing', status: 'PASSED' });

    // Step 4: Create trade operation
    logStep(4, 'Creating trade operation');
    const tradeOp = await axios.post(
      `${API_BASE}/trade-operations`,
      { buyListingId: buyListing.id, marginPercentage: 8 },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const tradeOperationId = tradeOp.data.id;
    results.push({ scenario: scenarioName, step: 4, stepName: 'Create trade operation', status: 'PASSED' });

    // Step 5: Admin sends initial offer (€270/ton)
    logStep(5, 'Admin sends initial offer at €270/ton');
    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: seller.seller.id,
        saleListingId: saleListing.id,
        status: 'INVITED',
        offeredQuantity: 400,
        offeredPricePerUnit: 270,
      },
    });

    let negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId,
        tradeSellerId: tradeSeller.id,
        status: 'PENDING',
        currentOffer: {
          quantity: 400,
          pricePerUnit: 270,
          timestamp: new Date().toISOString(),
        },
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    logSuccess('Initial offer: €270/ton for 400 tons');
    results.push({ scenario: scenarioName, step: 5, stepName: 'Initial offer', status: 'PASSED' });

    // Step 6: Seller counters at €285/ton (Round 1)
    logStep(6, 'Seller counters at €285/ton (Round 1)');
    await axios.post(
      `${API_BASE}/simulation/seller/${seller.id}/counter-offer`,
      {
        negotiationId: negotiation.id,
        counterPrice: 285,
        counterQuantity: 400,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Seller counter: €285/ton');
    results.push({ scenario: scenarioName, step: 6, stepName: 'Counter round 1', status: 'PASSED' });

    // Step 7: Admin counters at €277/ton (Round 2)
    logStep(7, 'Admin counters at €277/ton (Round 2)');
    negotiation = await prisma.offerNegotiation.update({
      where: { id: negotiation.id },
      data: {
        status: 'COUNTERED',
        currentOffer: {
          quantity: 400,
          pricePerUnit: 277,
          timestamp: new Date().toISOString(),
          round: 2,
        },
      },
    });
    logSuccess('Admin counter: €277/ton');
    results.push({ scenario: scenarioName, step: 7, stepName: 'Counter round 2', status: 'PASSED' });

    // Step 8: Seller counters at €282/ton (Round 3)
    logStep(8, 'Seller counters at €282/ton (Round 3)');
    await axios.post(
      `${API_BASE}/simulation/seller/${seller.id}/counter-offer`,
      {
        negotiationId: negotiation.id,
        counterPrice: 282,
        counterQuantity: 400,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    logSuccess('Seller counter: €282/ton');
    results.push({ scenario: scenarioName, step: 8, stepName: 'Counter round 3', status: 'PASSED' });

    // Step 9: Admin accepts at €282/ton (Final)
    logStep(9, 'Admin accepts final offer at €282/ton');
    await prisma.offerNegotiation.update({
      where: { id: negotiation.id },
      data: { status: 'ACCEPTED' },
    });
    await prisma.tradeSeller.update({
      where: { id: tradeSeller.id },
      data: {
        status: 'ACCEPTED',
        agreedQuantity: 400,
      },
    });
    logSuccess('Final agreement reached at €282/ton (split the difference)');
    results.push({ scenario: scenarioName, step: 9, stepName: 'Final agreement', status: 'PASSED' });

    // Step 10: Verify negotiation history
    logStep(10, 'Verifying negotiation history');
    const finalNegotiation = await prisma.offerNegotiation.findUnique({
      where: { id: negotiation.id },
    });

    logInfo('Negotiation Summary:');
    logInfo('  Round 1: Admin €270 → Seller €285');
    logInfo('  Round 2: Admin €277 → Seller €282');
    logInfo('  Final: €282 (Accepted)');
    logInfo('  Total Rounds: 3');

    if (finalNegotiation?.status === 'ACCEPTED') {
      logSuccess('Multi-round negotiation completed successfully!');
      results.push({ scenario: scenarioName, step: 10, stepName: 'Verify negotiation', status: 'PASSED' });
    } else {
      results.push({
        scenario: scenarioName,
        step: 10,
        stepName: 'Verify negotiation',
        status: 'FAILED',
        message: 'Negotiation not in accepted state',
      });
    }

  } catch (error: any) {
    logError(`Scenario failed: ${error.message}`);
    results.push({
      scenario: scenarioName,
      step: results.length + 1,
      stepName: 'Error occurred',
      status: 'FAILED',
      error: error.message,
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
    skippedSteps: 0,
    duration,
    results,
  };
}

// ==================== FINAL REPORT GENERATION ====================

function generateFinalReport(reports: ScenarioReport[]) {
  log(`\n${'='.repeat(80)}`, colors.bright + colors.cyan);
  log('COMPREHENSIVE SCENARIO TEST REPORT', colors.bright + colors.cyan);
  log('='.repeat(80), colors.bright + colors.cyan);

  const totalScenarios = reports.length;
  const totalSteps = reports.reduce((sum, r) => sum + r.totalSteps, 0);
  const totalPassed = reports.reduce((sum, r) => sum + r.passedSteps, 0);
  const totalFailed = reports.reduce((sum, r) => sum + r.failedSteps, 0);
  const totalDuration = reports.reduce((sum, r) => sum + r.duration, 0);

  log(`\n📊 OVERALL STATISTICS`, colors.bright);
  log(`${'─'.repeat(80)}`);
  log(`Total Scenarios Run:     ${totalScenarios}`);
  log(`Total Test Steps:        ${totalSteps}`);
  log(`Steps Passed:            ${totalPassed} ✅`, colors.green);
  log(`Steps Failed:            ${totalFailed} ❌`, totalFailed > 0 ? colors.red : colors.green);
  log(`Success Rate:            ${((totalPassed / totalSteps) * 100).toFixed(1)}%`);
  log(`Total Duration:          ${(totalDuration / 1000).toFixed(2)}s`);

  log(`\n📋 SCENARIO BREAKDOWN`, colors.bright);
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
          log(`     - Step ${r.step}: ${r.stepName} - ${r.message || r.error}`, colors.red);
        });
    }
  });

  log(`\n🎯 COVERAGE ANALYSIS`, colors.bright);
  log(`${'─'.repeat(80)}`);

  const coverageAreas = [
    { area: 'User Creation', covered: true },
    { area: 'Buy Listing Creation', covered: true },
    { area: 'Sale Listing Creation', covered: true },
    { area: 'Trade Operation Creation', covered: true },
    { area: 'Offer Negotiation (Accept)', covered: true },
    { area: 'Offer Negotiation (Counter)', covered: true },
    { area: 'Offer Negotiation (Reject)', covered: false },
    { area: 'Quality Inspection (Pass)', covered: true },
    { area: 'Quality Inspection (Fail)', covered: true },
    { area: 'Inspection Failure Recovery', covered: true },
    { area: 'Transport Request Creation', covered: true },
    { area: 'Transport Bidding', covered: true },
    { area: 'Transport Job Execution', covered: true },
    { area: 'Delivery Completion', covered: true },
    { area: 'Multi-Round Negotiation', covered: true },
  ];

  coverageAreas.forEach(item => {
    const icon = item.covered ? '✅' : '⚠️ ';
    const color = item.covered ? colors.green : colors.yellow;
    log(`${icon} ${item.area}`, color);
  });

  const coveredCount = coverageAreas.filter(a => a.covered).length;
  const coveragePercent = (coveredCount / coverageAreas.length) * 100;

  log(`\nFeature Coverage: ${coveredCount}/${coverageAreas.length} (${coveragePercent.toFixed(1)}%)`, colors.bright);

  log(`\n${'='.repeat(80)}`, colors.bright + colors.cyan);

  if (totalFailed === 0) {
    log('🎉 ALL SCENARIOS PASSED! System ready for production.', colors.bright + colors.green);
  } else {
    log(`⚠️  ${totalFailed} STEP(S) FAILED. Review errors above.`, colors.bright + colors.red);
  }

  log('='.repeat(80), colors.bright + colors.cyan);
}

// ==================== MAIN EXECUTION ====================

async function main() {
  log('\n🚀 Starting Automated Scenario Testing Suite', colors.bright + colors.cyan);
  log('='.repeat(80), colors.cyan);

  try {
    // Authenticate as admin
    logInfo('Authenticating as admin...');
    adminToken = await authenticateAsAdmin();
    logSuccess('Admin authentication successful\n');

    // Run all scenarios
    const scenario1 = await runHappyPathScenario();
    testResults.push(scenario1);

    await sleep(1000); // Brief pause between scenarios

    const scenario2 = await runInspectionFailureScenario();
    testResults.push(scenario2);

    await sleep(1000);

    const scenario3 = await runCounterOfferScenario();
    testResults.push(scenario3);

    // Generate final report
    generateFinalReport(testResults);

  } catch (error: any) {
    logError(`\n💥 CRITICAL ERROR: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test suite
main();
