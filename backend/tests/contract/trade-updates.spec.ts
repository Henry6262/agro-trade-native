import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/trade-operations/:id/updates - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tradeOperationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin-updates@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Updates',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-updates@test.com',
        name: 'Test Buyer Updates',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 100,
        unit: 'TON',
        status: 'ACTIVE',
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-UPDATES-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
      },
    });
    tradeOperationId = trade.id;

    // Create some initial data with timestamps
    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-updates@test.com',
        name: 'Test Seller Updates',
        role: 'FARMER',
      },
    });

    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product!.id,
        quantity: 80,
        unit: 'TON',
        askingPrice: 350,
        status: 'ACTIVE',
      },
    });

    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        requestedQuantity: 50,
        offeredQuantity: 50,
        unit: 'TON',
        status: 'NEGOTIATING',
      },
    });

    // Create negotiation with offer rounds
    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: 'ACTIVE',
        initialOffer: 320,
        currentOffer: 330,
        quantity: 50,
        unit: 'TON',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    // Create some offer rounds
    await prisma.offerRound.create({
      data: {
        negotiationId: negotiation.id,
        roundNumber: 1,
        offeredBy: 'BUYER',
        price: 320,
        quantity: 50,
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
    });

    await prisma.offerRound.create({
      data: {
        negotiationId: negotiation.id,
        roundNumber: 2,
        offeredBy: 'SELLER',
        price: 330,
        quantity: 50,
        response: 'COUNTERED',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerRound.deleteMany({
      where: { 
        negotiation: { tradeOperationId: tradeOperationId } 
      },
    });
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeStateHistory.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-UPDATES-001' },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: 'test-seller-updates@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-updates@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: ['test-admin-updates@agrotrade.com', 'test-buyer-updates@test.com', 'test-seller-updates@test.com'] 
        },
      },
    });
    await app.close();
  });

  describe('Polling Contract', () => {
    it('should return all updates when no since parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          tradeOperationId: tradeOperationId,
          updates: expect.arrayContaining([
            expect.objectContaining({
              type: expect.stringMatching(/^(PHASE_CHANGE|STATUS_CHANGE|SELLER_ADDED|OFFER_UPDATE|BID_RECEIVED|INSPECTION_UPDATE|NOTE_ADDED)$/),
              timestamp: expect.any(String),
              data: expect.any(Object),
            }),
          ]),
          lastChecked: expect.any(String),
          hasMore: false,
        }),
      });
    });

    it('should return updates since specified timestamp', async () => {
      const since = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 minutes ago
      
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${since}`)
        .set('Authorization', authToken)
        .expect(200);

      // Should only include updates after the 'since' timestamp
      const updates = response.body.data.updates;
      updates.forEach((update: any) => {
        expect(new Date(update.timestamp).getTime()).toBeGreaterThan(new Date(since).getTime());
      });
    });

    it('should return empty updates when no changes', async () => {
      const futureTime = new Date(Date.now() + 60 * 1000).toISOString(); // 1 minute in future
      
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${futureTime}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toMatchObject({
        tradeOperationId: tradeOperationId,
        updates: [],
        lastChecked: expect.any(String),
        hasMore: false,
      });
    });

    it('should include phase changes in updates', async () => {
      // Create phase change
      await prisma.tradeStateHistory.create({
        data: {
          tradeOperationId: tradeOperationId,
          fromPhase: 'SELLER_NEGOTIATION',
          toPhase: 'TRANSPORT_MATCHING',
          changedBy: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          reason: 'Sellers confirmed',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', authToken)
        .expect(200);

      const phaseUpdate = response.body.data.updates.find((u: any) => u.type === 'PHASE_CHANGE');
      expect(phaseUpdate).toBeTruthy();
      expect(phaseUpdate.data).toMatchObject({
        fromPhase: 'SELLER_NEGOTIATION',
        toPhase: 'TRANSPORT_MATCHING',
        reason: 'Sellers confirmed',
      });
    });

    it('should include new sellers in updates', async () => {
      const since = new Date().toISOString();
      
      // Add new seller
      const newSeller = await prisma.user.create({
        data: {
          email: 'test-new-seller@test.com',
          name: 'New Seller',
          role: 'FARMER',
        },
      });

      const newSaleListing = await prisma.saleListing.create({
        data: {
          sellerId: newSeller.id,
          productId: (await prisma.product.findFirst())!.id,
          quantity: 30,
          unit: 'TON',
          askingPrice: 340,
          status: 'ACTIVE',
        },
      });

      await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: newSeller.id,
          saleListingId: newSaleListing.id,
          requestedQuantity: 30,
          offeredQuantity: 30,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${since}`)
        .set('Authorization', authToken)
        .expect(200);

      const sellerUpdate = response.body.data.updates.find((u: any) => u.type === 'SELLER_ADDED');
      expect(sellerUpdate).toBeTruthy();
      expect(sellerUpdate.data).toMatchObject({
        sellerId: newSeller.id,
        sellerName: 'New Seller',
        quantity: '30',
        status: 'INVITED',
      });

      // Clean up
      await prisma.tradeSeller.deleteMany({ where: { sellerId: newSeller.id } });
      await prisma.saleListing.delete({ where: { id: newSaleListing.id } });
      await prisma.user.delete({ where: { id: newSeller.id } });
    });

    it('should include offer updates', async () => {
      const since = new Date().toISOString();
      
      // Create new offer round
      const negotiation = await prisma.offerNegotiation.findFirst({
        where: { tradeOperationId: tradeOperationId },
      });

      await prisma.offerRound.create({
        data: {
          negotiationId: negotiation!.id,
          roundNumber: 3,
          offeredBy: 'BUYER',
          price: 325,
          quantity: 50,
          terms: 'Final offer',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${since}`)
        .set('Authorization', authToken)
        .expect(200);

      const offerUpdate = response.body.data.updates.find((u: any) => u.type === 'OFFER_UPDATE');
      expect(offerUpdate).toBeTruthy();
      expect(offerUpdate.data).toMatchObject({
        negotiationId: negotiation!.id,
        offeredBy: 'BUYER',
        price: '325',
        quantity: '50',
      });
    });

    it('should include transport bids in updates', async () => {
      const since = new Date().toISOString();
      
      // Create transporter and bid
      const transporter = await prisma.user.create({
        data: {
          email: 'test-trans-poll@test.com',
          name: 'Poll Transporter',
          role: 'TRANSPORTER',
        },
      });

      await prisma.transportBid.create({
        data: {
          tradeOperationId: tradeOperationId,
          transporterId: transporter.id,
          bidAmount: 2200,
          estimatedDuration: 20,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${since}`)
        .set('Authorization', authToken)
        .expect(200);

      const bidUpdate = response.body.data.updates.find((u: any) => u.type === 'BID_RECEIVED');
      expect(bidUpdate).toBeTruthy();
      expect(bidUpdate.data).toMatchObject({
        transporterId: transporter.id,
        transporterName: 'Poll Transporter',
        bidAmount: '2200',
        estimatedDuration: 20,
      });

      // Clean up
      await prisma.transportBid.deleteMany({ where: { transporterId: transporter.id } });
      await prisma.user.delete({ where: { id: transporter.id } });
    });

    it('should include inspection updates', async () => {
      const since = new Date().toISOString();
      
      // Create inspection
      const saleListing = await prisma.saleListing.findFirst({
        where: { seller: { email: 'test-seller-updates@test.com' } },
      });

      await prisma.inspectionRequest.create({
        data: {
          tradeOperationId: tradeOperationId,
          saleListingId: saleListing!.id,
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
          status: 'SCHEDULED',
          scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${since}`)
        .set('Authorization', authToken)
        .expect(200);

      const inspectionUpdate = response.body.data.updates.find((u: any) => u.type === 'INSPECTION_UPDATE');
      expect(inspectionUpdate).toBeTruthy();
      expect(inspectionUpdate.data).toMatchObject({
        saleListingId: saleListing!.id,
        priority: 'HIGH',
        status: 'SCHEDULED',
      });

      // Clean up
      await prisma.inspectionRequest.deleteMany({
        where: { tradeOperationId: tradeOperationId },
      });
    });

    it('should paginate large update sets', async () => {
      // Create many updates
      for (let i = 0; i < 30; i++) {
        await prisma.tradeNote.create({
          data: {
            tradeOperationId: tradeOperationId,
            authorId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
            content: `Test note ${i}`,
            isInternal: true,
          },
        });
      }

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?limit=10`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.updates.length).toBeLessThanOrEqual(10);
      expect(response.body.data.hasMore).toBe(true);

      // Clean up
      await prisma.tradeNote.deleteMany({
        where: { tradeOperationId: tradeOperationId },
      });
    });

    it('should support long polling with timeout', async () => {
      const start = Date.now();
      
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=${new Date().toISOString()}&wait=true&timeout=1000`)
        .set('Authorization', authToken)
        .expect(200);

      const duration = Date.now() - start;
      
      // Should wait approximately 1 second if no updates
      expect(duration).toBeGreaterThanOrEqual(900);
      expect(duration).toBeLessThan(2000);
      
      expect(response.body.data.updates).toEqual([]);
    });

    it('should return 404 for non-existent trade', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/trade-operations/non-existent-id/updates')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'TRADE_OPERATION_NOT_FOUND',
        }),
      });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', authToken)
        .expect(200);
    });

    it('should allow involved parties access', async () => {
      const buyerToken = 'Bearer buyer-involved-token';
      
      await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', buyerToken)
        .expect(200);
    });

    it('should deny non-involved parties', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'test-other-poll@test.com',
          name: 'Other User',
          role: 'BUYER',
        },
      });

      await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', 'Bearer other-user-token')
        .expect(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Query Parameter Validation', () => {
    it('should validate since parameter format', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?since=invalid-date`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Invalid date format'),
        }),
      });
    });

    it('should validate limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?limit=invalid`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should enforce maximum limit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?limit=1000`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Maximum limit is 100'),
        }),
      });
    });

    it('should validate timeout parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates?wait=true&timeout=70000`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Maximum timeout is 60 seconds'),
        }),
      });
    });
  });
});