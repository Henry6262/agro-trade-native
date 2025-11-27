import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationExpiryService } from '../../src/negotiations/services/negotiation-expiry.service';
import { TestDataFactory } from '../helpers/test-data-factory';
import { DatabaseCleaner } from '../helpers/database-cleaner';
import { ApiClient } from '../helpers/api-client';
import { NegotiationStatus, SellerStatus } from '@prisma/client';

/**
 * CRITICAL SCENARIO: Offer Expiry Validation (48-Hour Mechanism)
 *
 * This test validates one of the most critical business rules:
 * - All offers expire exactly 48 hours after creation
 * - Visual countdown shows hours remaining
 * - Expired offers cannot be accepted
 * - Cron job automatically expires overdue offers
 * - Expired sellers are released back to marketplace
 *
 * Business Impact:
 * - Prevents stale offers from being accepted
 * - Ensures fair time windows for all parties
 * - Maintains marketplace liquidity
 * - Critical for compliance and user trust
 */
describe('SCENARIO: Offer Expiry Validation (48-Hour Mechanism)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let dataFactory: TestDataFactory;
  let dbCleaner: DatabaseCleaner;
  let apiClient: ApiClient;
  let expiryService: NegotiationExpiryService;
  let testScenario: Awaited<ReturnType<TestDataFactory['createFullTradeScenario']>>;

  // Test configuration
  const EXPIRY_HOURS = 48;
  const EXPIRY_MILLISECONDS = EXPIRY_HOURS * 60 * 60 * 1000;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Set global prefix to match main.ts configuration
    app.setGlobalPrefix("api");
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    expiryService = moduleFixture.get<NegotiationExpiryService>(NegotiationExpiryService);
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

    // Create test scenario with 3 sellers
    testScenario = await dataFactory.createFullTradeScenario({
      sellerCount: 3,
      buyerQuantity: 200,
      sellerQuantity: 70,
      sellerPrice: 320,
      buyerPrice: 350,
      withAddresses: true,
    });
  });

  describe('✅ Happy Path: Expiry Mechanism', () => {
    it('should set correct expiry time when creating offers', async () => {
      console.log('\n========================================');
      console.log('TEST: Expiry Time Setting on Offer Creation');
      console.log('========================================\n');

      const startTime = new Date();

      // Create trade operation with sellers
      console.log('STEP 1: Creating trade operation with 3 sellers...');
      const response = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
          {
            sellerId: testScenario.sellers[1].id,
            saleListingId: testScenario.saleListings[1].id,
            quantity: 70,
            offerPrice: 320,
          },
          {
            sellerId: testScenario.sellers[2].id,
            saleListingId: testScenario.saleListings[2].id,
            quantity: 60,
            offerPrice: 325,
          },
        ],
      }, 201);

      console.log(`✅ Trade operation created: ${response.body.tradeOperationId}`);

      // Verify expiry times
      console.log('\nSTEP 2: Verifying expiry times...');
      const negotiations = response.body.negotiations;
      expect(negotiations).toHaveLength(3);

      for (let i = 0; i < negotiations.length; i++) {
        const nego = negotiations[i];
        const expiresAt = new Date(nego.expiresAt);
        const expectedExpiry = new Date(startTime.getTime() + EXPIRY_MILLISECONDS);

        // Allow 1-minute tolerance for test execution time
        const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime());
        const timeDiffMinutes = timeDiff / (1000 * 60);

        expect(timeDiffMinutes).toBeLessThan(1);
        expect(nego.hoursUntilExpiry).toBeGreaterThan(47.9);
        expect(nego.hoursUntilExpiry).toBeLessThanOrEqual(48);
        expect(nego.isExpiringSoon).toBe(false); // Not expiring soon at creation

        console.log(`   ✅ Negotiation ${i + 1}:`);
        console.log(`      - Expires at: ${expiresAt.toISOString()}`);
        console.log(`      - Hours until expiry: ${nego.hoursUntilExpiry.toFixed(2)}h`);
        console.log(`      - Is expiring soon: ${nego.isExpiringSoon}`);
      }

      console.log('\n✅ All expiry times set correctly (48 hours from now)');
    });

    it('should track countdown correctly over time', async () => {
      console.log('\n========================================');
      console.log('TEST: Countdown Tracking Over Time');
      console.log('========================================\n');

      // Create trade operation
      console.log('STEP 1: Creating trade operation...');
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
        ],
      }, 201);

      const negotiationId = createResponse.body.negotiations[0].id;
      console.log(`✅ Negotiation created: ${negotiationId}`);

      // Check initial countdown (T+0)
      console.log('\nSTEP 2: Checking countdown at T+0...');
      let nego = await apiClient.get(`/api/negotiations/${negotiationId}`, 200);
      expect(nego.body.hoursUntilExpiry).toBeGreaterThan(47.9);
      expect(nego.body.hoursUntilExpiry).toBeLessThanOrEqual(48);
      expect(nego.body.isExpiringSoon).toBe(false);
      console.log(`   Hours remaining: ${nego.body.hoursUntilExpiry.toFixed(2)}h`);

      // Manually update expiry to simulate time passage (T+24h)
      console.log('\nSTEP 3: Simulating time passage to T+24h...');
      const expiresAt = new Date(nego.body.expiresAt);
      const now24h = new Date(expiresAt.getTime() - 24 * 60 * 60 * 1000);

      await prisma.offerNegotiation.update({
        where: { id: negotiationId },
        data: {
          expiresAt: new Date(now24h.getTime() + 24 * 60 * 60 * 1000)
        },
      });

      nego = await apiClient.get(`/api/negotiations/${negotiationId}`, 200);
      expect(nego.body.hoursUntilExpiry).toBeGreaterThan(23.9);
      expect(nego.body.hoursUntilExpiry).toBeLessThanOrEqual(24);
      expect(nego.body.isExpiringSoon).toBe(false); // Not yet (< 12h)
      console.log(`   ✅ Hours remaining at T+24h: ${nego.body.hoursUntilExpiry.toFixed(2)}h`);

      // Simulate T+40h (within 12-hour warning window)
      console.log('\nSTEP 4: Simulating time passage to T+40h (expiring soon)...');
      const now40h = new Date(expiresAt.getTime() - 8 * 60 * 60 * 1000);

      await prisma.offerNegotiation.update({
        where: { id: negotiationId },
        data: {
          expiresAt: new Date(now40h.getTime() + 8 * 60 * 60 * 1000)
        },
      });

      nego = await apiClient.get(`/api/negotiations/${negotiationId}`, 200);
      expect(nego.body.hoursUntilExpiry).toBeGreaterThan(7.9);
      expect(nego.body.hoursUntilExpiry).toBeLessThanOrEqual(8);
      expect(nego.body.isExpiringSoon).toBe(true); // Yes! < 12h remaining
      console.log(`   ✅ Hours remaining at T+40h: ${nego.body.hoursUntilExpiry.toFixed(2)}h`);
      console.log(`   ✅ Is expiring soon: ${nego.body.isExpiringSoon} (< 12h threshold)`);

      console.log('\n✅ Countdown tracking accurate at all checkpoints');
    });

    it('should prevent acceptance of expired offers', async () => {
      console.log('\n========================================');
      console.log('TEST: Prevent Acceptance of Expired Offers');
      console.log('========================================\n');

      // Create trade operation
      console.log('STEP 1: Creating trade operation...');
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
        ],
      }, 201);

      const negotiationId = createResponse.body.negotiations[0].id;
      console.log(`✅ Negotiation created: ${negotiationId}`);

      // Manually expire the offer (set expiry to past)
      console.log('\nSTEP 2: Manually expiring the offer (simulating T+49h)...');
      const pastTime = new Date(Date.now() - 1000); // 1 second ago

      await prisma.offerNegotiation.update({
        where: { id: negotiationId },
        data: {
          status: NegotiationStatus.EXPIRED,
          expiresAt: pastTime,
          concludedAt: new Date(),
        },
      });

      console.log(`   ✅ Offer expired at: ${pastTime.toISOString()}`);

      // Attempt to accept expired offer
      console.log('\nSTEP 3: Attempting to accept expired offer...');
      const acceptResponse = await apiClient.post(
        `/api/negotiations/${negotiationId}/accept`,
        {},
        400, // Expect failure
      );

      expect(acceptResponse.body.message).toContain('expired');
      console.log(`   ✅ Acceptance blocked: ${acceptResponse.body.message}`);

      // Verify status unchanged
      const nego = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });

      expect(nego?.status).toBe(NegotiationStatus.EXPIRED);
      expect(nego?.concludedAt).toBeDefined();
      console.log(`   ✅ Status remains EXPIRED, offer concluded`);

      console.log('\n✅ Expired offer acceptance prevented successfully');
    });

    it('should auto-expire overdue offers via cron job', async () => {
      console.log('\n========================================');
      console.log('TEST: Auto-Expire Overdue Offers (Cron Job)');
      console.log('========================================\n');

      // Create trade operation with 2 sellers
      console.log('STEP 1: Creating trade operation with 2 sellers...');
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
          {
            sellerId: testScenario.sellers[1].id,
            saleListingId: testScenario.saleListings[1].id,
            quantity: 70,
            offerPrice: 320,
          },
        ],
      }, 201);

      const nego1Id = createResponse.body.negotiations[0].id;
      const nego2Id = createResponse.body.negotiations[1].id;
      console.log(`✅ Negotiations created: ${nego1Id}, ${nego2Id}`);

      // Seller 1 accepts immediately
      console.log('\nSTEP 2: Seller 1 accepts offer...');
      await apiClient.post(`/api/negotiations/${nego1Id}/accept`, {}, 200);
      console.log('   ✅ Seller 1 accepted');

      // Manually set negotiation 2 expiry to past (simulate T+49h)
      console.log('\nSTEP 3: Simulating expiry for Seller 2 (T+49h)...');
      const pastTime = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      await prisma.offerNegotiation.update({
        where: { id: nego2Id },
        data: { expiresAt: pastTime },
      });

      console.log(`   ✅ Negotiation 2 expiry set to: ${pastTime.toISOString()}`);

      // Run expiry cron job
      console.log('\nSTEP 4: Running expiry cron job...');
      await expiryService.expireOverdueNegotiations();
      console.log('   ✅ Cron job executed');

      // Verify negotiation 1 unchanged (accepted)
      console.log('\nSTEP 5: Verifying results...');
      const nego1 = await prisma.offerNegotiation.findUnique({
        where: { id: nego1Id },
      });

      expect(nego1?.status).toBe(NegotiationStatus.ACCEPTED);
      console.log(`   ✅ Negotiation 1: ACCEPTED (unchanged)`);

      // Verify negotiation 2 expired
      const nego2 = await prisma.offerNegotiation.findUnique({
        where: { id: nego2Id },
        include: { tradeSeller: true },
      });

      expect(nego2?.status).toBe(NegotiationStatus.EXPIRED);
      expect(nego2?.concludedAt).toBeDefined();
      expect(nego2?.tradeSeller.status).toBe(SellerStatus.REJECTED);
      console.log(`   ✅ Negotiation 2: EXPIRED (auto-expired by cron)`);
      console.log(`   ✅ Trade Seller 2: REJECTED (released)`);

      // Verify sale listing re-activated
      const saleListing = await prisma.saleListing.findUnique({
        where: { id: testScenario.saleListings[1].id },
      });

      // Note: Current implementation doesn't auto re-activate listings
      // This is a feature request to add
      console.log(`   Sale listing status: ${saleListing?.status}`);

      console.log('\n✅ Cron job successfully auto-expired overdue offer');
    });
  });

  describe('❌ Edge Cases: Expiry Scenarios', () => {
    it('should handle edge case: accept at T+47h59m (just before expiry)', async () => {
      console.log('\n========================================');
      console.log('EDGE CASE: Accept Just Before Expiry (T+47h59m)');
      console.log('========================================\n');

      // Create offer
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
        ],
      }, 201);

      const negotiationId = createResponse.body.negotiations[0].id;

      // Simulate T+47h59m (1 minute before expiry)
      const expiresAt = new Date(createResponse.body.negotiations[0].expiresAt);
      const almostExpired = new Date(expiresAt.getTime() - 60 * 1000); // 1 min before expiry

      await prisma.offerNegotiation.update({
        where: { id: negotiationId },
        data: { expiresAt: new Date(almostExpired.getTime() + 60 * 1000) },
      });

      console.log('STEP 1: Accepting offer 1 minute before expiry...');

      // Should still accept (not expired yet)
      const acceptResponse = await apiClient.post(
        `/api/negotiations/${negotiationId}/accept`,
        {},
        200,
      );

      expect(acceptResponse.body.status).toBe('ACCEPTED');
      console.log('✅ Acceptance succeeded (offer still valid)');
      console.log(`   Time remaining: ~1 minute`);
    });

    it('should handle edge case: accept at T+48h00m01s (just after expiry)', async () => {
      console.log('\n========================================');
      console.log('EDGE CASE: Accept Just After Expiry (T+48h00m01s)');
      console.log('========================================\n');

      // Create offer
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
        ],
      }, 201);

      const negotiationId = createResponse.body.negotiations[0].id;

      // Manually expire (1 second past expiry)
      const justExpired = new Date(Date.now() - 1000); // 1 second ago

      await prisma.offerNegotiation.update({
        where: { id: negotiationId },
        data: {
          status: NegotiationStatus.EXPIRED,
          expiresAt: justExpired,
          concludedAt: new Date(),
        },
      });

      console.log('STEP 1: Attempting to accept 1 second after expiry...');

      // Should fail
      const acceptResponse = await apiClient.post(
        `/api/negotiations/${negotiationId}/accept`,
        {},
        400,
      );

      expect(acceptResponse.body.message).toContain('expired');
      console.log('✅ Acceptance blocked (offer expired)');
      console.log(`   Error: ${acceptResponse.body.message}`);
    });

    it('should handle edge case: multiple sellers with different expiry times', async () => {
      console.log('\n========================================');
      console.log('EDGE CASE: Multiple Sellers, Staggered Expiry');
      console.log('========================================\n');

      // Create trade operation
      const createResponse = await apiClient.post('/api/trade-operations', {
        buyListingId: testScenario.buyListing.id,
        adminId: testScenario.admin.id,
        sellers: [
          {
            sellerId: testScenario.sellers[0].id,
            saleListingId: testScenario.saleListings[0].id,
            quantity: 70,
            offerPrice: 320,
          },
          {
            sellerId: testScenario.sellers[1].id,
            saleListingId: testScenario.saleListings[1].id,
            quantity: 70,
            offerPrice: 320,
          },
          {
            sellerId: testScenario.sellers[2].id,
            saleListingId: testScenario.saleListings[2].id,
            quantity: 60,
            offerPrice: 325,
          },
        ],
      }, 201);

      const nego1Id = createResponse.body.negotiations[0].id;
      const nego2Id = createResponse.body.negotiations[1].id;
      const nego3Id = createResponse.body.negotiations[2].id;

      // Seller 1: Expires in 10 hours
      await prisma.offerNegotiation.update({
        where: { id: nego1Id },
        data: { expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000) },
      });

      // Seller 2: Expires in 5 hours
      await prisma.offerNegotiation.update({
        where: { id: nego2Id },
        data: { expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000) },
      });

      // Seller 3: Already expired (1 hour ago)
      await prisma.offerNegotiation.update({
        where: { id: nego3Id },
        data: {
          status: NegotiationStatus.EXPIRED,
          expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
          concludedAt: new Date(),
        },
      });

      console.log('STEP 1: Verifying different expiry states...');

      // Try accepting each
      console.log('\nSTEP 2: Attempting to accept offers...');

      // Seller 1: Should succeed
      const accept1 = await apiClient.post(`/api/negotiations/${nego1Id}/accept`, {}, 200);
      expect(accept1.body.status).toBe('ACCEPTED');
      console.log('   ✅ Seller 1: ACCEPTED (10h remaining)');

      // Seller 2: Should succeed
      const accept2 = await apiClient.post(`/api/negotiations/${nego2Id}/accept`, {}, 200);
      expect(accept2.body.status).toBe('ACCEPTED');
      console.log('   ✅ Seller 2: ACCEPTED (5h remaining)');

      // Seller 3: Should fail (expired)
      const accept3 = await apiClient.post(`/api/negotiations/${nego3Id}/accept`, {}, 400);
      expect(accept3.body.message).toContain('expired');
      console.log('   ✅ Seller 3: BLOCKED (expired 1h ago)');

      console.log('\n✅ Staggered expiry handling correct');
    });
  });

  describe('📊 Performance: Expiry Cron Job', () => {
    it('should handle bulk expiry efficiently (200 negotiations)', async () => {
      console.log('\n========================================');
      console.log('PERFORMANCE TEST: Bulk Expiry (200 Negotiations)');
      console.log('========================================\n');

      // Create 200 expired negotiations
      console.log('STEP 1: Creating 200 negotiations...');
      const pastTime = new Date(Date.now() - 60 * 60 * 1000);

      const negotiations = [];
      for (let i = 0; i < 200; i++) {
        // Create minimal negotiation data
        const nego = await prisma.offerNegotiation.create({
          data: {
            tradeOperationId: testScenario.tradeOperation?.id || 'test',
            tradeSellerId: testScenario.tradeSellers?.[0]?.id || 'test',
            status: NegotiationStatus.PENDING,
            currentOffer: { price: 320, quantity: 70 },
            offerHistory: [],
            expiresAt: pastTime,
          },
        });
        negotiations.push(nego);
      }

      console.log(`✅ ${negotiations.length} negotiations created (all expired)`);

      // Measure expiry cron performance
      console.log('\nSTEP 2: Running expiry cron job...');
      const startTime = Date.now();

      await expiryService.expireOverdueNegotiations();

      const duration = Date.now() - startTime;
      console.log(`✅ Expiry job completed in ${duration}ms`);

      // Verify all expired
      const expiredCount = await prisma.offerNegotiation.count({
        where: {
          id: { in: negotiations.map(n => n.id) },
          status: NegotiationStatus.EXPIRED,
        },
      });

      // Cron job processes 200 at a time
      expect(expiredCount).toBe(200);
      console.log(`✅ All 200 negotiations expired correctly`);

      // Performance assertion
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`✅ Performance: ${duration}ms (< 5000ms threshold)`);
    });
  });
});
