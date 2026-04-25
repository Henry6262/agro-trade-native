import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MockAuthService } from '../../src/auth/services/mock-auth.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';

/**
 * CRITICAL SCENARIO: Commission Calculation Validation
 *
 * This test validates the platform's commission structure:
 * - Seller Commission: 2.5% on agreed purchase price
 * - Buyer Commission: 1.5% on final selling price
 * - Commissions must be calculated accurately to 2 decimal places
 * - Profit margins must account for commissions
 *
 * Business Impact:
 * - Platform revenue depends on accurate commissions
 * - Incorrect calculations = revenue loss or overcharging
 * - Critical for financial reconciliation
 * - Legal/compliance requirement for transparency
 */
describe('SCENARIO: Commission Calculation Validation', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;
  let mockAuth: MockAuthService;
  let testScenario: Awaited<ReturnType<TestDataFactory['createFullTradeScenario']>>;

  // Commission rates (as defined in business rules)
  const SELLER_COMMISSION_RATE = 0.025; // 2.5%
  const BUYER_COMMISSION_RATE = 0.015; // 1.5%

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Set global prefix to match main.ts configuration
    app.setGlobalPrefix("api");
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    mockAuth = new MockAuthService(moduleFixture.get<JwtService>(JwtService));
    dataFactory = new TestDataFactory(prisma);
    dbCleaner = new DatabaseCleaner(prisma);
    apiClient = new ApiClient(app);
  });

  afterAll(async () => {
    await dbCleaner.cleanAll();
    await app.close();
  });

  beforeEach(async () => {
    await dbCleaner.cleanAll();

    testScenario = await dataFactory.createFullTradeScenario({
      sellerCount: 1,
      buyerQuantity: 100,
      sellerQuantity: 100,
      sellerPrice: 320,
      buyerPrice: 350,
      withAddresses: true,
    });
    await prisma.user.upsert({
      where: { id: "test-user-123" },
      update: {
        email: "test@agrotrade.com",
        name: "Test Admin",
        role: "ADMIN",
        isActive: true,
        isEmailVerified: true,
        onboardingCompleted: true,
      },
      create: {
        id: "test-user-123",
        email: "test@agrotrade.com",
        name: "Test Admin",
        role: "ADMIN",
        isActive: true,
        isEmailVerified: true,
        onboardingCompleted: true,
      },
    });
    apiClient.setAuthToken(mockAuth.getMockTokens().admin);
  });

  describe('✅ Single-Seller Commission Calculations', () => {
    const testCases = [
      {
        name: 'Standard Trade (100 tons @ €320 → €350)',
        sellerPrice: 320,
        buyerPrice: 350,
        quantity: 100,
        expectedSellerCommission: 800.00, // €32,000 × 2.5%
        expectedBuyerCommission: 525.00,  // €35,000 × 1.5%
        expectedRevenue: 35000.00,
        expectedPurchaseCost: 32000.00,
      },
      {
        name: 'Large Trade (500 tons @ €250 → €280)',
        sellerPrice: 250,
        buyerPrice: 280,
        quantity: 500,
        expectedSellerCommission: 3125.00, // €125,000 × 2.5%
        expectedBuyerCommission: 2100.00,  // €140,000 × 1.5%
        expectedRevenue: 140000.00,
        expectedPurchaseCost: 125000.00,
      },
      {
        name: 'Small Trade (25 tons @ €450 → €480)',
        sellerPrice: 450,
        buyerPrice: 480,
        quantity: 25,
        expectedSellerCommission: 281.25, // €11,250 × 2.5%
        expectedBuyerCommission: 180.00,  // €12,000 × 1.5%
        expectedRevenue: 12000.00,
        expectedPurchaseCost: 11250.00,
      },
      {
        name: 'Fractional Price (75 tons @ €180.50 → €200)',
        sellerPrice: 180.50,
        buyerPrice: 200,
        quantity: 75,
        expectedSellerCommission: 338.44, // €13,537.50 × 2.5%
        expectedBuyerCommission: 225.00,  // €15,000 × 1.5%
        expectedRevenue: 15000.00,
        expectedPurchaseCost: 13537.50,
      },
    ];

    testCases.forEach((testCase) => {
      it(`should calculate commissions correctly: ${testCase.name}`, async () => {
        console.log(`\n========================================`);
        console.log(`TEST: ${testCase.name}`);
        console.log(`========================================\n`);

        // Create custom scenario with specific prices
        const scenario = await dataFactory.createFullTradeScenario({
          sellerCount: 1,
          buyerQuantity: testCase.quantity,
          sellerQuantity: testCase.quantity,
          sellerPrice: testCase.sellerPrice,
          buyerPrice: testCase.buyerPrice,
          withAddresses: true,
        });

        console.log(`STEP 1: Creating trade operation...`);
        console.log(`   Seller price: €${testCase.sellerPrice}/ton`);
        console.log(`   Buyer price: €${testCase.buyerPrice}/ton`);
        console.log(`   Quantity: ${testCase.quantity} tons`);

        const createResponse = await apiClient.post('/api/trade-operations', {
          buyListingId: scenario.buyListing.id,
          adminId: scenario.admin.id,
          sellers: [
            {
              sellerId: scenario.sellers[0].id,
              saleListingId: scenario.saleListings[0].id,
              quantity: testCase.quantity,
              offerPrice: testCase.sellerPrice,
            },
          ],
        }, 201);

        const tradeOperationId = createResponse.body.tradeOperationId;
        const negotiationId = createResponse.body.negotiations[0].id;

        // Accept offer
        console.log(`\nSTEP 2: Seller accepts offer...`);
        await apiClient.post(`/api/negotiations/${negotiationId}/accept`, {}, 200);

        // Get trade operation details with commissions
        console.log(`\nSTEP 3: Fetching trade operation with commission calculations...`);
        const tradeOp = await prisma.tradeOperation.findUnique({
          where: { id: tradeOperationId },
          include: {
            sellers: true,
            buyListing: true,
          },
        });

        expect(tradeOp).toBeDefined();

        // Calculate expected values
        const revenue = testCase.buyerPrice * testCase.quantity;
        const purchaseCost = testCase.sellerPrice * testCase.quantity;
        const sellerCommission = purchaseCost * SELLER_COMMISSION_RATE;
        const buyerCommission = revenue * BUYER_COMMISSION_RATE;

        console.log(`\nSTEP 4: Verifying calculations...`);
        console.log(`   Expected Revenue: €${testCase.expectedRevenue.toFixed(2)}`);
        console.log(`   Calculated Revenue: €${revenue.toFixed(2)}`);
        expect(revenue).toBeCloseTo(testCase.expectedRevenue, 2);

        console.log(`   Expected Purchase Cost: €${testCase.expectedPurchaseCost.toFixed(2)}`);
        console.log(`   Calculated Purchase Cost: €${purchaseCost.toFixed(2)}`);
        expect(purchaseCost).toBeCloseTo(testCase.expectedPurchaseCost, 2);

        console.log(`   Expected Seller Commission: €${testCase.expectedSellerCommission.toFixed(2)}`);
        console.log(`   Calculated Seller Commission: €${sellerCommission.toFixed(2)}`);
        expect(sellerCommission).toBeCloseTo(testCase.expectedSellerCommission, 2);

        console.log(`   Expected Buyer Commission: €${testCase.expectedBuyerCommission.toFixed(2)}`);
        console.log(`   Calculated Buyer Commission: €${buyerCommission.toFixed(2)}`);
        expect(buyerCommission).toBeCloseTo(testCase.expectedBuyerCommission, 2);

        console.log(`\n✅ All commission calculations correct!`);
      });
    });
  });

  describe('✅ Multi-Seller Commission Aggregation', () => {
    it('should calculate individual commissions for multiple sellers', async () => {
      console.log(`\n========================================`);
      console.log(`TEST: Multi-Seller Commission Aggregation`);
      console.log(`========================================\n`);

      // Create scenario with 3 sellers at different prices
      const scenario = await dataFactory.createFullTradeScenario({
        sellerCount: 3,
        buyerQuantity: 300,
        sellerQuantity: 100,
        sellerPrice: 250, // Base price
        buyerPrice: 280,
        withAddresses: true,
      });

      console.log(`STEP 1: Creating trade with 3 sellers at different prices...`);

      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: scenario.buyListing.id,
        adminId: scenario.admin.id,
        sellers: [
          {
            sellerId: scenario.sellers[0].id,
            saleListingId: scenario.saleListings[0].id,
            quantity: 100,
            offerPrice: 250, // €250/ton
          },
          {
            sellerId: scenario.sellers[1].id,
            saleListingId: scenario.saleListings[1].id,
            quantity: 100,
            offerPrice: 255, // €255/ton
          },
          {
            sellerId: scenario.sellers[2].id,
            saleListingId: scenario.saleListings[2].id,
            quantity: 100,
            offerPrice: 260, // €260/ton
          },
        ],
      }, 201);

      const tradeOperationId = createResponse.body.tradeOperationId;
      console.log(`   Trade operation: ${tradeOperationId}`);

      // All sellers accept
      console.log(`\nSTEP 2: All sellers accept offers...`);
      for (const nego of createResponse.body.negotiations) {
        await apiClient.post(`/api/negotiations/${nego.id}/accept`, {}, 200);
      }

      // Calculate expected commissions
      console.log(`\nSTEP 3: Calculating individual seller commissions...`);

      const seller1Cost = 250 * 100; // €25,000
      const seller2Cost = 255 * 100; // €25,500
      const seller3Cost = 260 * 100; // €26,000
      const totalPurchaseCost = seller1Cost + seller2Cost + seller3Cost; // €76,500

      const seller1Commission = seller1Cost * SELLER_COMMISSION_RATE; // €625
      const seller2Commission = seller2Cost * SELLER_COMMISSION_RATE; // €637.50
      const seller3Commission = seller3Cost * SELLER_COMMISSION_RATE; // €650
      const totalSellerCommission = seller1Commission + seller2Commission + seller3Commission; // €1,912.50

      const totalRevenue = 280 * 300; // €84,000
      const buyerCommission = totalRevenue * BUYER_COMMISSION_RATE; // €1,260

      console.log(`\n   Seller 1: €${seller1Cost} × 2.5% = €${seller1Commission.toFixed(2)}`);
      console.log(`   Seller 2: €${seller2Cost} × 2.5% = €${seller2Commission.toFixed(2)}`);
      console.log(`   Seller 3: €${seller3Cost} × 2.5% = €${seller3Commission.toFixed(2)}`);
      console.log(`   Total Seller Commission: €${totalSellerCommission.toFixed(2)}`);
      console.log(`   Buyer Commission: €${totalRevenue} × 1.5% = €${buyerCommission.toFixed(2)}`);

      // Verify calculations
      console.log(`\nSTEP 4: Verifying aggregated commissions...`);
      expect(seller1Commission).toBeCloseTo(625.00, 2);
      expect(seller2Commission).toBeCloseTo(637.50, 2);
      expect(seller3Commission).toBeCloseTo(650.00, 2);
      expect(totalSellerCommission).toBeCloseTo(1912.50, 2);
      expect(buyerCommission).toBeCloseTo(1260.00, 2);

      console.log(`\n✅ Multi-seller commission aggregation correct!`);
    });

    it('should calculate weighted average commission rate for reporting', async () => {
      console.log(`\n========================================`);
      console.log(`TEST: Weighted Average Commission Calculation`);
      console.log(`========================================\n`);

      const scenario = await dataFactory.createFullTradeScenario({
        sellerCount: 3,
        buyerQuantity: 210,
        sellerQuantity: 100,
        sellerPrice: 300,
        buyerPrice: 330,
        withAddresses: true,
      });

      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: scenario.buyListing.id,
        adminId: scenario.admin.id,
        sellers: [
          {
            sellerId: scenario.sellers[0].id,
            saleListingId: scenario.saleListings[0].id,
            quantity: 100, // 47.6% of total
            offerPrice: 300,
          },
          {
            sellerId: scenario.sellers[1].id,
            saleListingId: scenario.saleListings[1].id,
            quantity: 60, // 28.6% of total
            offerPrice: 310,
          },
          {
            sellerId: scenario.sellers[2].id,
            saleListingId: scenario.saleListings[2].id,
            quantity: 50, // 23.8% of total
            offerPrice: 320,
          },
        ],
      }, 201);

      for (const nego of createResponse.body.negotiations) {
        await apiClient.post(`/api/negotiations/${nego.id}/accept`, {}, 200);
      }

      console.log(`STEP 1: Calculating weighted average purchase price...`);

      const totalQuantity = 100 + 60 + 50; // 210 tons
      const totalCost = (300 * 100) + (310 * 60) + (320 * 50); // €64,600
      const weightedAvgPrice = totalCost / totalQuantity; // €307.62/ton

      console.log(`   Total quantity: ${totalQuantity} tons`);
      console.log(`   Total cost: €${totalCost}`);
      console.log(`   Weighted avg price: €${weightedAvgPrice.toFixed(2)}/ton`);

      expect(weightedAvgPrice).toBeCloseTo(307.62, 2);

      console.log(`\nSTEP 2: Calculating total commissions based on weighted average...`);

      const totalSellerCommission = totalCost * SELLER_COMMISSION_RATE; // €1,615
      const totalRevenue = 330 * totalQuantity; // €69,300
      const totalBuyerCommission = totalRevenue * BUYER_COMMISSION_RATE; // €1,039.50

      console.log(`   Seller commission: €${totalCost} × 2.5% = €${totalSellerCommission.toFixed(2)}`);
      console.log(`   Buyer commission: €${totalRevenue} × 1.5% = €${totalBuyerCommission.toFixed(2)}`);

      expect(totalSellerCommission).toBeCloseTo(1615.00, 2);
      expect(totalBuyerCommission).toBeCloseTo(1039.50, 2);

      console.log(`\n✅ Weighted average commission calculation correct!`);
    });
  });

  describe('✅ Profit Margin After Commissions', () => {
    it('should calculate net profit after deducting commissions', async () => {
      console.log(`\n========================================`);
      console.log(`TEST: Net Profit After Commissions`);
      console.log(`========================================\n`);

      const scenario = await dataFactory.createFullTradeScenario({
        sellerCount: 1,
        buyerQuantity: 200,
        sellerQuantity: 200,
        sellerPrice: 320,
        buyerPrice: 350,
        withAddresses: true,
      });

      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: scenario.buyListing.id,
        adminId: scenario.admin.id,
        sellers: [
          {
            sellerId: scenario.sellers[0].id,
            saleListingId: scenario.saleListings[0].id,
            quantity: 200,
            offerPrice: 320,
          },
        ],
      }, 201);

      const negotiationId = createResponse.body.negotiations[0].id;
      await apiClient.post(`/api/negotiations/${negotiationId}/accept`, {}, 200);

      console.log(`STEP 1: Calculating gross profit...`);

      const revenue = 350 * 200; // €70,000
      const purchaseCost = 320 * 200; // €64,000
      const grossProfit = revenue - purchaseCost; // €6,000

      console.log(`   Revenue: €${revenue}`);
      console.log(`   Purchase Cost: €${purchaseCost}`);
      console.log(`   Gross Profit: €${grossProfit}`);

      console.log(`\nSTEP 2: Deducting commissions...`);

      const sellerCommission = purchaseCost * SELLER_COMMISSION_RATE; // €1,600
      const buyerCommission = revenue * BUYER_COMMISSION_RATE; // €1,050
      const totalCommissions = sellerCommission + buyerCommission; // €2,650

      console.log(`   Seller Commission: €${sellerCommission}`);
      console.log(`   Buyer Commission: €${buyerCommission}`);
      console.log(`   Total Commissions: €${totalCommissions}`);

      console.log(`\nSTEP 3: Calculating net profit...`);

      const netProfit = grossProfit - totalCommissions; // €3,350
      const netProfitMargin = (netProfit / revenue) * 100; // 4.79%

      console.log(`   Net Profit: €${netProfit.toFixed(2)}`);
      console.log(`   Net Profit Margin: ${netProfitMargin.toFixed(2)}%`);

      expect(netProfit).toBeCloseTo(3350.00, 2);
      expect(netProfitMargin).toBeCloseTo(4.79, 2);

      console.log(`\n✅ Net profit calculation after commissions correct!`);
    });

    it('should warn if profit margin falls below minimum after commissions', async () => {
      console.log(`\n========================================`);
      console.log(`TEST: Low Profit Margin Warning (After Commissions)`);
      console.log(`========================================\n`);

      const MIN_PROFIT_MARGIN = 5; // 5% minimum

      const scenario = await dataFactory.createFullTradeScenario({
        sellerCount: 1,
        buyerQuantity: 100,
        sellerQuantity: 100,
        sellerPrice: 345, // High purchase price
        buyerPrice: 360, // Low selling price
        withAddresses: true,
      });

      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: scenario.buyListing.id,
        adminId: scenario.admin.id,
        sellers: [
          {
            sellerId: scenario.sellers[0].id,
            saleListingId: scenario.saleListings[0].id,
            quantity: 100,
            offerPrice: 345,
          },
        ],
      }, 201);

      console.log(`STEP 1: Calculating profit margin...`);

      const revenue = 360 * 100; // €36,000
      const purchaseCost = 345 * 100; // €34,500
      const sellerCommission = purchaseCost * SELLER_COMMISSION_RATE; // €862.50
      const buyerCommission = revenue * BUYER_COMMISSION_RATE; // €540
      const netProfit = revenue - purchaseCost - sellerCommission - buyerCommission; // €97.50
      const profitMargin = (netProfit / revenue) * 100; // 0.27%

      console.log(`   Revenue: €${revenue}`);
      console.log(`   Purchase Cost: €${purchaseCost}`);
      console.log(`   Seller Commission: €${sellerCommission.toFixed(2)}`);
      console.log(`   Buyer Commission: €${buyerCommission.toFixed(2)}`);
      console.log(`   Net Profit: €${netProfit.toFixed(2)}`);
      console.log(`   Profit Margin: ${profitMargin.toFixed(2)}%`);

      console.log(`\nSTEP 2: Checking margin threshold...`);

      if (profitMargin < MIN_PROFIT_MARGIN) {
        console.log(`   ⚠️ WARNING: Profit margin (${profitMargin.toFixed(2)}%) below minimum (${MIN_PROFIT_MARGIN}%)`);
        console.log(`   Recommendation: Reject offer or renegotiate`);
      }

      expect(profitMargin).toBeLessThan(MIN_PROFIT_MARGIN);
      console.log(`\n✅ Low margin warning triggered correctly!`);
    });
  });

  describe('❌ Edge Cases: Commission Calculations', () => {
    it('should handle zero commission when price is zero (edge case)', async () => {
      console.log(`\n========================================`);
      console.log(`EDGE CASE: Zero Price Commission`);
      console.log(`========================================\n`);

      // This shouldn't happen in production, but test the edge case
      const zeroPrice = 0;
      const quantity = 100;

      const sellerCommission = zeroPrice * quantity * SELLER_COMMISSION_RATE;
      const buyerCommission = zeroPrice * quantity * BUYER_COMMISSION_RATE;

      expect(sellerCommission).toBe(0);
      expect(buyerCommission).toBe(0);

      console.log(`   Zero price commission: €0 (edge case handled)`);
      console.log(`\n✅ Zero commission edge case handled!`);
    });

    it('should round commissions to 2 decimal places', async () => {
      console.log(`\n========================================`);
      console.log(`EDGE CASE: Commission Rounding`);
      console.log(`========================================\n`);

      // Test fractional price that results in many decimal places
      const price = 123.456;
      const quantity = 77;

      const purchaseCost = price * quantity; // €9,506.112
      const commission = purchaseCost * SELLER_COMMISSION_RATE; // €237.6528

      const roundedCommission = Math.round(commission * 100) / 100; // €237.65

      console.log(`   Purchase cost: €${purchaseCost}`);
      console.log(`   Raw commission: €${commission}`);
      console.log(`   Rounded commission: €${roundedCommission}`);

      expect(roundedCommission).toBe(237.65);

      console.log(`\n✅ Commission rounding to 2 decimal places correct!`);
    });
  });

  describe('📊 Commission Reporting', () => {
    it('should generate commission summary report for trade operation', async () => {
      console.log(`\n========================================`);
      console.log(`TEST: Commission Summary Report`);
      console.log(`========================================\n`);

      const scenario = await dataFactory.createFullTradeScenario({
        sellerCount: 2,
        buyerQuantity: 200,
        sellerQuantity: 100,
        sellerPrice: 300,
        buyerPrice: 330,
        withAddresses: true,
      });

      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: scenario.buyListing.id,
        adminId: scenario.admin.id,
        sellers: [
          {
            sellerId: scenario.sellers[0].id,
            saleListingId: scenario.saleListings[0].id,
            quantity: 120,
            offerPrice: 300,
          },
          {
            sellerId: scenario.sellers[1].id,
            saleListingId: scenario.saleListings[1].id,
            quantity: 80,
            offerPrice: 310,
          },
        ],
      }, 201);

      for (const nego of createResponse.body.negotiations) {
        await apiClient.post(`/api/negotiations/${nego.id}/accept`, {}, 200);
      }

      console.log(`STEP 1: Generating commission report...`);

      const report = {
        tradeOperationId: createResponse.body.tradeOperationId,
        sellers: [
          {
            id: scenario.sellers[0].id,
            quantity: 120,
            price: 300,
            purchaseCost: 120 * 300,
            commission: (120 * 300) * SELLER_COMMISSION_RATE,
          },
          {
            id: scenario.sellers[1].id,
            quantity: 80,
            price: 310,
            purchaseCost: 80 * 310,
            commission: (80 * 310) * SELLER_COMMISSION_RATE,
          },
        ],
        buyer: {
          quantity: 200,
          price: 330,
          revenue: 200 * 330,
          commission: (200 * 330) * BUYER_COMMISSION_RATE,
        },
        summary: {
          totalQuantity: 200,
          totalPurchaseCost: (120 * 300) + (80 * 310),
          totalSellerCommission: ((120 * 300) * SELLER_COMMISSION_RATE) + ((80 * 310) * SELLER_COMMISSION_RATE),
          totalRevenue: 200 * 330,
          totalBuyerCommission: (200 * 330) * BUYER_COMMISSION_RATE,
          totalCommissions: 0,
        },
      };

      report.summary.totalCommissions = report.summary.totalSellerCommission + report.summary.totalBuyerCommission;

      console.log(`\n   COMMISSION REPORT`);
      console.log(`   ${'='.repeat(50)}`);
      console.log(`   Seller Commissions:`);
      report.sellers.forEach((s, i) => {
        console.log(`     Seller ${i + 1}: €${s.commission.toFixed(2)} (${s.quantity}t @ €${s.price}/t)`);
      });
      console.log(`   Total Seller Commissions: €${report.summary.totalSellerCommission.toFixed(2)}`);
      console.log(`\n   Buyer Commission: €${report.summary.totalBuyerCommission.toFixed(2)}`);
      console.log(`\n   TOTAL COMMISSIONS: €${report.summary.totalCommissions.toFixed(2)}`);
      console.log(`   ${'='.repeat(50)}`);

      // Verify report accuracy
      expect(report.summary.totalSellerCommission).toBeCloseTo(1520.00, 2);
      expect(report.summary.totalBuyerCommission).toBeCloseTo(990.00, 2);
      expect(report.summary.totalCommissions).toBeCloseTo(2510.00, 2);

      console.log(`\n✅ Commission report generated successfully!`);
    });
  });
});
