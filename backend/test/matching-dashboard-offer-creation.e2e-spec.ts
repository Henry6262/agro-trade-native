/**
 * E2E Test: Matching Dashboard - Offer Creation Workflow
 *
 * Tests the complete flow from PricingModal "Send Offers" button to backend database
 *
 * Week 1 Day 3-4 Milestone: Verify offer creation workflow
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';

describe('Matching Dashboard - Offer Creation Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data IDs
  let testBuyerId: string;
  let testSeller1Id: string;
  let testSeller2Id: string;
  let testProductId: string;
  let testBuyListingId: string;
  let testSaleListing1Id: string;
  let testSaleListing2Id: string;
  let testBuyerAddressId: string;
  let testSeller1AddressId: string;
  let testSeller2AddressId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Use existing product (products are seeded data, don't create new ones)
    const product = await prisma.product.findFirst({
      where: { category: 'SOFT_WHEAT' },
    });

    if (!product) {
      throw new Error('SOFT_WHEAT product not found in database. Run seed first.');
    }

    testProductId = product.id;

    // Create buyer
    const buyer = await prisma.user.create({
      data: {
        name: 'Test Buyer Corp',
        email: `buyer_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'BUYER',
      },
    });
    testBuyerId = buyer.id;

    // Create buyer address (Sofia)
    const buyerAddress = await prisma.address.create({
      data: {
        userId: testBuyerId,
        addressLine1: 'Test Buyer Street 1',
        city: 'Sofia',
        province: 'Sofia',
        country: 'Bulgaria',
        postalCode: '1000',
        latitude: 42.6977,
        longitude: 23.3219,
        addressType: 'DELIVERY',
      },
    });
    testBuyerAddressId = buyerAddress.id;

    // Create buy listing
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: testBuyerId,
        productId: testProductId,
        quantity: 100,
        unit: 'TON',
        maxPricePerUnit: 350,
        deliveryAddressId: testBuyerAddressId,
        status: 'ACTIVE',
      },
    });
    testBuyListingId = buyListing.id;

    // Create seller 1 (Plovdiv - 148km from Sofia)
    const seller1 = await prisma.user.create({
      data: {
        name: 'Test Seller 1',
        email: `seller1_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'SELLER',
      },
    });
    testSeller1Id = seller1.id;

    const seller1Address = await prisma.address.create({
      data: {
        userId: testSeller1Id,
        addressLine1: 'Seller 1 Farm Road',
        city: 'Plovdiv',
        province: 'Plovdiv',
        country: 'Bulgaria',
        postalCode: '4000',
        latitude: 42.1354,
        longitude: 24.7453,
        addressType: 'FARM',
      },
    });
    testSeller1AddressId = seller1Address.id;

    const saleListing1 = await prisma.saleListing.create({
      data: {
        sellerId: testSeller1Id,
        productId: testProductId,
        quantity: 60,
        unit: 'TON',
        askingPrice: 300,
        addressId: testSeller1AddressId,
        status: 'ACTIVE',
      },
    });
    testSaleListing1Id = saleListing1.id;

    // Create seller 2 (Varna - 445km from Sofia)
    const seller2 = await prisma.user.create({
      data: {
        name: 'Test Seller 2',
        email: `seller2_${Date.now()}@test.com`,
        password: 'hashed_password',
        role: 'SELLER',
      },
    });
    testSeller2Id = seller2.id;

    const seller2Address = await prisma.address.create({
      data: {
        userId: testSeller2Id,
        addressLine1: 'Seller 2 Farm Road',
        city: 'Varna',
        province: 'Varna',
        country: 'Bulgaria',
        postalCode: '9000',
        latitude: 43.2141,
        longitude: 27.9147,
        addressType: 'FARM',
      },
    });
    testSeller2AddressId = seller2Address.id;

    const saleListing2 = await prisma.saleListing.create({
      data: {
        sellerId: testSeller2Id,
        productId: testProductId,
        quantity: 40,
        unit: 'TON',
        askingPrice: 310,
        addressId: testSeller2AddressId,
        status: 'ACTIVE',
      },
    });
    testSaleListing2Id = saleListing2.id;
  }

  async function cleanupTestData() {
    // Delete in reverse order of dependencies
    await prisma.offerNegotiation.deleteMany({
      where: { tradeSeller: { tradeOperation: { buyListingId: testBuyListingId } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { buyListingId: testBuyListingId } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { buyListingId: testBuyListingId },
    });
    await prisma.saleListing.deleteMany({
      where: { id: { in: [testSaleListing1Id, testSaleListing2Id] } },
    });
    await prisma.buyListing.deleteMany({
      where: { id: testBuyListingId },
    });
    await prisma.address.deleteMany({
      where: {
        id: { in: [testBuyerAddressId, testSeller1AddressId, testSeller2AddressId] },
      },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testBuyerId, testSeller1Id, testSeller2Id] } },
    });
    // Don't delete products - they are seeded data
  }

  describe('Complete Offer Creation Flow', () => {
    it('should successfully create trade operation with sellers (matching PricingModal flow)', async () => {
      // Step 1: Calculate transport costs (simulating PricingModal initial load)
      const transportResponse = await request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: [testSeller1Id, testSeller2Id],
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200);

      expect(transportResponse.body.success).toBe(true);
      expect(transportResponse.body.results).toHaveLength(2);

      // Verify transport calculations
      const seller1Transport = transportResponse.body.results.find(
        (r: any) => r.sellerId === testSeller1Id,
      );
      const seller2Transport = transportResponse.body.results.find(
        (r: any) => r.sellerId === testSeller2Id,
      );

      expect(seller1Transport).toBeDefined();
      expect(seller2Transport).toBeDefined();
      expect(seller1Transport.distance).toBeGreaterThan(100); // ~148km
      expect(seller2Transport.distance).toBeGreaterThan(400); // ~445km
      expect(seller1Transport.transportCost).toBeGreaterThan(0);
      expect(seller2Transport.transportCost).toBeGreaterThan(0);

      // Step 2: Create trade operation (simulating "Send Offers" button click)
      const createResponse = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          buyListingId: testBuyListingId,
          sellers: [
            {
              sellerId: testSeller1Id,
              saleListingId: testSaleListing1Id,
              requestedQuantity: 60,
              offerPrice: 305, // Admin adjusted price
            },
            {
              sellerId: testSeller2Id,
              saleListingId: testSaleListing2Id,
              requestedQuantity: 40,
              offerPrice: 315, // Admin adjusted price
            },
          ],
        })
        .expect(201);

      const tradeOperationId = createResponse.body.tradeOperationId;
      expect(tradeOperationId).toBeDefined();
      expect(createResponse.body.operationNumber).toMatch(/^OP-\d+$/);
      expect(createResponse.body.phase).toBe('SELLER_NEGOTIATION');
      expect(createResponse.body.status).toBe('ACTIVE');
      expect(createResponse.body.negotiations).toHaveLength(2);

      // Verify negotiations were created
      const nego1 = createResponse.body.negotiations.find(
        (n: any) => n.sellerId === testSeller1Id,
      );
      const nego2 = createResponse.body.negotiations.find(
        (n: any) => n.sellerId === testSeller2Id,
      );

      expect(nego1.status).toBe('PENDING');
      expect(nego1.offerPrice).toBe(305);
      expect(nego1.quantity).toBe(60);
      expect(nego1.hoursUntilExpiry).toBeGreaterThan(0);

      expect(nego2.status).toBe('PENDING');
      expect(nego2.offerPrice).toBe(315);
      expect(nego2.quantity).toBe(40);

      // Step 3: Verify data was persisted in database
      const tradeOperation = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
        include: {
          sellers: {
            include: {
              seller: true,
              saleListing: true,
            },
          },
          negotiations: {
            include: {
              currentOffer: true,
            },
          },
        },
      });

      expect(tradeOperation).toBeDefined();
      expect(tradeOperation!.sellers).toHaveLength(2);
      expect(tradeOperation!.negotiations).toHaveLength(2);
      expect(tradeOperation!.phase).toBe('SELLER_NEGOTIATION');
      expect(tradeOperation!.status).toBe('ACTIVE');

      // Verify seller 1
      const dbSeller1 = tradeOperation!.sellers.find((s) => s.sellerId === testSeller1Id);
      expect(dbSeller1).toBeDefined();
      expect(dbSeller1!.status).toBe('NEGOTIATING');
      expect(Number(dbSeller1!.requestedQuantity)).toBe(60);

      // Verify seller 2
      const dbSeller2 = tradeOperation!.sellers.find((s) => s.sellerId === testSeller2Id);
      expect(dbSeller2).toBeDefined();
      expect(dbSeller2!.status).toBe('NEGOTIATING');
      expect(Number(dbSeller2!.requestedQuantity)).toBe(40);

      // Step 4: Fetch the trade operation via GET endpoint
      const fetchResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations`)
        .expect(200);

      const operations = fetchResponse.body.data;
      const createdOperation = operations.find((op: any) => op.id === tradeOperationId);

      expect(createdOperation).toBeDefined();
      expect(createdOperation.sellers).toHaveLength(2);
      expect(createdOperation.negotiations).toHaveLength(2);
    });

    it('should handle negative profit scenario (low offer prices)', async () => {
      // Create new buy listing with low target price
      const lowPriceBuyListing = await prisma.buyListing.create({
        data: {
          buyerId: testBuyerId,
          productId: testProductId,
          quantity: 50,
          unit: 'TON',
          maxPricePerUnit: 280, // Lower than seller asking prices
          deliveryAddressId: testBuyerAddressId,
          status: 'ACTIVE',
        },
      });

      // Calculate transport
      const transportResponse = await request(app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .send({
          sellerIds: [testSeller1Id],
          buyerAddressId: testBuyerAddressId,
        })
        .expect(200);

      const transportCost = transportResponse.body.results[0].transportCost;

      // Calculate profit: buyer pays 280/t, seller asks 300/t + transport
      // Revenue: 280 * 50 = 14,000
      // Cost: 300 * 50 = 15,000 + transport
      // Profit: 14,000 - 15,000 - transport = NEGATIVE

      // Even though profit is negative, offer creation should still work
      const createResponse = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          buyListingId: lowPriceBuyListing.id,
          sellers: [
            {
              sellerId: testSeller1Id,
              saleListingId: testSaleListing1Id,
              requestedQuantity: 50,
              offerPrice: 300, // Admin keeps seller's price
            },
          ],
        })
        .expect(201);

      expect(createResponse.body.tradeOperationId).toBeDefined();

      // Cleanup
      await prisma.offerNegotiation.deleteMany({
        where: { tradeSeller: { tradeOperation: { buyListingId: lowPriceBuyListing.id } } },
      });
      await prisma.tradeSeller.deleteMany({
        where: { tradeOperation: { buyListingId: lowPriceBuyListing.id } },
      });
      await prisma.tradeOperation.deleteMany({
        where: { buyListingId: lowPriceBuyListing.id },
      });
      await prisma.buyListing.delete({
        where: { id: lowPriceBuyListing.id },
      });
    });

    it('should return validation error when buyListingId is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          sellers: [
            {
              sellerId: testSeller1Id,
              saleListingId: testSaleListing1Id,
              requestedQuantity: 60,
              offerPrice: 305,
            },
          ],
        })
        .expect(400);
    });

    it('should return validation error when sellers array is empty', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          buyListingId: testBuyListingId,
          sellers: [],
        })
        .expect(400);
    });

    it('should return 404 when buyListingId does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          buyListingId: 'non_existent_id',
          sellers: [
            {
              sellerId: testSeller1Id,
              saleListingId: testSaleListing1Id,
              requestedQuantity: 60,
              offerPrice: 305,
            },
          ],
        })
        .expect(404);
    });
  });

  describe('Toast Notification Data Verification', () => {
    it('should return operation ID in format suitable for toast display', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({
          buyListingId: testBuyListingId,
          sellers: [
            {
              sellerId: testSeller1Id,
              saleListingId: testSaleListing1Id,
              requestedQuantity: 60,
              offerPrice: 305,
            },
          ],
        })
        .expect(201);

      const tradeOperationId = response.body.tradeOperationId;

      // Verify ID can be truncated for toast (as in PricingModal line 161)
      expect(tradeOperationId).toBeDefined();
      expect(tradeOperationId.length).toBeGreaterThanOrEqual(8);
      expect(tradeOperationId.substring(0, 8)).toBeTruthy();
    });
  });
});
