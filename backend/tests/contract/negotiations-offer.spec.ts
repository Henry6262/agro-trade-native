import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/negotiations/:id/offers - Contract Test (Trading Model)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let negotiationId: string;
  let tradeSellerId: string;
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
        email: 'test-admin-nego@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Nego',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-nego@test.com',
        name: 'Test Buyer Nego',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-nego@test.com',
        name: 'Test Seller Nego',
        role: 'FARMER',
      },
    });

    const product = await prisma.product.findFirst();
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 100,
        unit: 'TON',
        maxPricePerUnit: 400,
        status: 'ACTIVE',
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

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-NEGO-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        // Trading model fields for profit tracking
        sellingPrice: 380,
        totalRevenue: 38000, // 100 tons * 380
        estimatedTransportCost: 150,
        totalDistanceKm: 100,
      },
    });
    tradeOperationId = trade.id;

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
    tradeSellerId = tradeSeller.id;

    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: 'ACTIVE',
        initialOffer: 320,
        currentOffer: 320,
        quantity: 50,
        unit: 'TON',
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    negotiationId = negotiation.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerRound.deleteMany({
      where: { negotiationId: negotiationId },
    });
    await prisma.offerNegotiation.deleteMany({
      where: { id: negotiationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { id: tradeSellerId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-NEGO-001' },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: 'test-seller-nego@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-nego@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-admin-nego@agrotrade.com', 'test-buyer-nego@test.com', 'test-seller-nego@test.com'] },
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should create new offer round with profit impact', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 325,
          quantity: 50,
          terms: 'Payment on delivery, quality inspection required',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          negotiationId: negotiationId,
          roundNumber: expect.any(Number),
          offeredBy: 'BUYER',
          price: '325',
          quantity: '50',
          terms: 'Payment on delivery, quality inspection required',
          createdAt: expect.any(String),
          // Trading model: profit impact
          profitImpact: expect.objectContaining({
            estimatedProfit: expect.any(Number),
            profitMargin: expect.any(Number),
            profitChange: expect.any(Number),
          }),
        }),
      });

      // Verify negotiation current offer updated
      const negotiation = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(negotiation?.currentOffer).toEqual(325);
      
      // Verify trade operation profit fields updated
      const trade = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
      });
      expect(trade?.estimatedProfit).toBeTruthy();
    });

    it('should handle counter-offer response with profit recalculation', async () => {
      // Create initial offer
      const offer = await prisma.offerRound.create({
        data: {
          negotiationId: negotiationId,
          roundNumber: 1,
          offeredBy: 'BUYER',
          price: 330,
          quantity: 50,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 340,
          quantity: 50,
          terms: 'Minimum order 50 tons',
          respondingTo: offer.id,
          response: 'COUNTERED',
          responseNote: 'Price too low for current market',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        offeredBy: 'SELLER',
        price: '340',
        response: 'COUNTERED',
        responseNote: 'Price too low for current market',
        // Trading model: profit impact of counter-offer
        profitImpact: expect.objectContaining({
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          profitChange: expect.any(Number), // Negative if seller price increased
        }),
      });

      // Verify previous offer marked as responded
      const previousOffer = await prisma.offerRound.findUnique({
        where: { id: offer.id },
      });
      expect(previousOffer?.response).toBe('COUNTERED');
      expect(previousOffer?.respondedAt).toBeTruthy();
    });

    it('should handle offer acceptance with final profit calculation', async () => {
      const offer = await prisma.offerRound.create({
        data: {
          negotiationId: negotiationId,
          roundNumber: 2,
          offeredBy: 'SELLER',
          price: 335,
          quantity: 50,
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 335,
          quantity: 50,
          respondingTo: offer.id,
          response: 'ACCEPTED',
          responseNote: 'Deal accepted at 335 per ton',
        })
        .expect(201);

      expect(response.body.data.response).toBe('ACCEPTED');
      expect(response.body.data).toMatchObject({
        // Trading model: final profit calculation
        profitImpact: expect.objectContaining({
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          isFinal: true,
        }),
      });

      // Verify negotiation marked as agreed
      const negotiation = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(negotiation?.status).toBe('AGREED');
      expect(negotiation?.finalPrice).toEqual(335);
      expect(negotiation?.concludedAt).toBeTruthy();

      // Verify trade seller updated
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller?.agreedPrice).toEqual(335);
      expect(tradeSeller?.status).toBe('ACCEPTED');
      
      // Verify trade operation profit updated
      const trade = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
      });
      expect(trade?.totalPurchaseCost).toBeTruthy();
      expect(trade?.estimatedProfit).toBeTruthy();
    });

    it('should reject offers on expired negotiations', async () => {
      // Create expired negotiation
      const expiredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: (await prisma.tradeOperation.findFirst())!.id,
          tradeSellerId: tradeSellerId,
          status: 'EXPIRED',
          initialOffer: 300,
          currentOffer: 300,
          quantity: 30,
          unit: 'TON',
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${expiredNego.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 310,
          quantity: 30,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_EXPIRED',
        }),
      });

      await prisma.offerNegotiation.delete({ where: { id: expiredNego.id } });
    });

    it('should reject offers on completed negotiations', async () => {
      const completedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: (await prisma.tradeOperation.findFirst())!.id,
          tradeSellerId: tradeSellerId,
          status: 'AGREED',
          initialOffer: 350,
          currentOffer: 360,
          finalPrice: 360,
          quantity: 40,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          concludedAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${completedNego.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 365,
          quantity: 40,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_COMPLETED',
        }),
      });

      await prisma.offerNegotiation.delete({ where: { id: completedNego.id } });
    });

    it('should validate offer price ranges', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: -100,
          quantity: 50,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('positive'),
        }),
      });
    });

    it('should warn when offer impacts profit below threshold', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 375, // High seller price that would reduce profit margin
          quantity: 50,
          terms: 'Higher quality product',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        offeredBy: 'SELLER',
        price: '375',
        profitImpact: expect.objectContaining({
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          warning: expect.stringContaining('below minimum margin'),
        }),
      });
    });

    it('should track cumulative profit impact across multiple sellers', async () => {
      // Create another seller negotiation for the same trade
      const seller2 = await prisma.user.create({
        data: {
          email: 'test-seller2-nego@test.com',
          name: 'Test Seller2 Nego',
          role: 'FARMER',
        },
      });

      const saleListing2 = await prisma.saleListing.create({
        data: {
          sellerId: seller2.id,
          productId: (await prisma.product.findFirst())!.id,
          quantity: 50,
          unit: 'TON',
          askingPrice: 360,
          status: 'ACTIVE',
        },
      });

      const tradeSeller2 = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: seller2.id,
          saleListingId: saleListing2.id,
          requestedQuantity: 50,
          offeredQuantity: 50,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      const negotiation2 = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: tradeSeller2.id,
          status: 'ACTIVE',
          initialOffer: 340,
          currentOffer: 340,
          quantity: 50,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation2.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 345,
          quantity: 50,
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        profitImpact: expect.objectContaining({
          cumulativeProfit: expect.any(Number), // Total profit across all sellers
          averagePurchasePrice: expect.any(Number),
          profitMargin: expect.any(Number),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: negotiation2.id } });
      await prisma.tradeSeller.delete({ where: { id: tradeSeller2.id } });
      await prisma.saleListing.delete({ where: { id: saleListing2.id } });
      await prisma.user.delete({ where: { id: seller2.id } });
    });

    it('should increment round numbers correctly', async () => {
      // Get current max round
      const rounds = await prisma.offerRound.findMany({
        where: { negotiationId: negotiationId },
        orderBy: { roundNumber: 'desc' },
        take: 1,
      });
      const lastRound = rounds[0]?.roundNumber || 0;

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 345,
          quantity: 50,
        })
        .expect(201);

      expect(response.body.data.roundNumber).toBe(lastRound + 1);
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/negotiations/non-existent-id/offers')
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 300,
          quantity: 50,
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_NOT_FOUND',
        }),
      });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .send({
          offeredBy: 'BUYER',
          price: 320,
          quantity: 50,
        })
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 320,
          quantity: 50,
        })
        .expect(201);
    });

    it('should allow involved parties access', async () => {
      // Buyer or seller involved in negotiation
      const buyerToken = 'Bearer buyer-token';
      
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', buyerToken)
        .send({
          offeredBy: 'BUYER',
          price: 322,
          quantity: 50,
        })
        .expect(201);
    });
  });

  describe('Request Validation', () => {
    it('should require offeredBy field', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          price: 320,
          quantity: 50,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('offeredBy'),
        }),
      });
    });

    it('should validate offeredBy enum', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'INVALID',
          price: 320,
          quantity: 50,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should validate response enum when provided', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 320,
          quantity: 50,
          response: 'INVALID_RESPONSE',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });
  });
});