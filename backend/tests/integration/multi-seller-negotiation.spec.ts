import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Multi-Seller Negotiation Flow - Integration Test (Trading Model)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tradeOperationId: string;
  let negotiationIds: string[] = [];
  let tradeSellerIds: string[] = [];

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
        email: 'multi-nego-admin@test.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Multi Nego Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'multi-nego-buyer@test.com',
        name: 'Multi Nego Buyer',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    // Create buy listing needing 150 tons (requiring multiple sellers)
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 150,
        unit: 'TON',
        maxPricePerUnit: 380,
        status: 'ACTIVE',
      },
    });

    // Create trade operation with profit targets
    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-MULTI-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        // Trading model fields
        sellingPrice: 375, // Sell to buyer at €375/ton
        totalRevenue: 56250, // 150 tons * €375
        estimatedTransportCost: 225, // Estimate €1.5/ton transport
      },
    });
    tradeOperationId = trade.id;

    // Create 3 sellers with different quantities and prices
    const sellerData = [
      { name: 'Seller A', quantity: 60, price: 350 },
      { name: 'Seller B', quantity: 50, price: 360 },
      { name: 'Seller C', quantity: 40, price: 355 },
    ];

    for (const data of sellerData) {
      const seller = await prisma.user.create({
        data: {
          email: `${data.name.toLowerCase().replace(' ', '-')}@test.com`,
          name: data.name,
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: data.quantity,
          unit: 'TON',
          askingPrice: data.price,
          status: 'ACTIVE',
        },
      });

      const tradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: data.quantity,
          offeredQuantity: data.quantity,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });
      tradeSellerIds.push(tradeSeller.id);

      // Create negotiation for each seller
      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSeller.id,
          status: 'ACTIVE',
          initialOffer: data.price - 10,
          currentOffer: data.price - 10,
          quantity: data.quantity,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });
      negotiationIds.push(negotiation.id);
    }
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerRound.deleteMany({
      where: { negotiationId: { in: negotiationIds } },
    });
    await prisma.offerNegotiation.deleteMany({
      where: { id: { in: negotiationIds } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'seller-' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'multi-nego-buyer@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'multi-nego-' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'seller-' },
      },
    });
    await app.close();
  });

  describe('Parallel Negotiations with Multiple Sellers (Profit Tracking)', () => {
    it('should handle concurrent negotiations with profit impact', async () => {
      // Send initial offers to all sellers in parallel
      const offerPromises = negotiationIds.map((negId, index) =>
        request(app.getHttpServer())
          .post(`/api/negotiations/${negId}/offers`)
          .set('Authorization', authToken)
          .send({
            offeredBy: 'BUYER',
            price: 340 + index * 5, // Different prices for each
            quantity: [60, 50, 40][index],
          })
      );

      const responses = await Promise.all(offerPromises);
      
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        // Trading model: verify profit impact
        expect(response.body.data.profitImpact).toMatchObject({
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
        });
      });
    });

    it('should track negotiation rounds independently', async () => {
      // Each negotiation should have its own round numbers
      for (let i = 0; i < negotiationIds.length; i++) {
        const rounds = await prisma.offerRound.findMany({
          where: { negotiationId: negotiationIds[i] },
          orderBy: { roundNumber: 'asc' },
        });

        // Verify round numbers are sequential per negotiation
        rounds.forEach((round, index) => {
          expect(round.roundNumber).toBe(index + 1);
        });
      }
    });

    it('should handle counter-offers from different sellers', async () => {
      // Sellers counter with different prices
      const counterOffers = [
        { price: 355, response: 'COUNTERED' },
        { price: 365, response: 'COUNTERED' },
        { price: 350, response: 'COUNTERED' },
      ];

      for (let i = 0; i < negotiationIds.length; i++) {
        const response = await request(app.getHttpServer())
          .post(`/api/negotiations/${negotiationIds[i]}/offers`)
          .set('Authorization', authToken)
          .send({
            offeredBy: 'SELLER',
            price: counterOffers[i].price,
            quantity: [60, 50, 40][i],
            response: counterOffers[i].response,
            responseNote: `Seller ${i + 1} counter-offer`,
          })
          .expect(201);

        expect(response.body.data.price).toBe(String(counterOffers[i].price));
      }
    });

    it('should allow accepting offers while tracking cumulative profit', async () => {
      // Accept first seller's offer
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[0]}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 352,
          quantity: 60,
          response: 'ACCEPTED',
        })
        .expect(201);

      // Verify first negotiation is agreed
      const firstNego = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationIds[0] },
      });
      expect(firstNego?.status).toBe('AGREED');
      expect(firstNego?.finalPrice).toEqual(352);

      // Trading model: verify profit impact
      expect(acceptResponse.body.data.profitImpact).toMatchObject({
        cumulativeProfit: expect.any(Number),
        averagePurchasePrice: expect.any(Number),
      });

      // Other negotiations should still be active
      for (let i = 1; i < negotiationIds.length; i++) {
        const nego = await prisma.offerNegotiation.findUnique({
          where: { id: negotiationIds[i] },
        });
        expect(nego?.status).toBe('ACTIVE');
      }
    });

    it('should calculate total agreed quantities', async () => {
      // Accept remaining negotiations
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[1]}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 362,
          quantity: 50,
          response: 'ACCEPTED',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[2]}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 348,
          quantity: 40,
          response: 'ACCEPTED',
        })
        .expect(201);

      // Calculate total quantities
      const tradeSellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      const totalQuantity = tradeSellers.reduce(
        (sum, seller) => sum + (seller.agreedQuantity?.toNumber() || 0),
        0
      );

      expect(totalQuantity).toBe(150); // Should match buy listing requirement
      
      // Trading model: Calculate final profit
      const avgPrice = (352 * 60 + 362 * 50 + 348 * 40) / 150;
      const totalPurchaseCost = 352 * 60 + 362 * 50 + 348 * 40;
      const estimatedProfit = 56250 - totalPurchaseCost - 225;
      const profitMargin = (estimatedProfit / 56250) * 100;

      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          totalPurchaseCost: totalPurchaseCost,
          avgPurchasePrice: avgPrice,
          estimatedProfit: estimatedProfit,
          profitMargin: profitMargin,
        },
      });

      // Verify profit margin meets minimum (5%)
      expect(profitMargin).toBeGreaterThanOrEqual(5);
    });

    it('should optimize profit by selecting best sellers', async () => {
      // Test profit-based seller selection
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 375,
          sellerPriceRange: { min: 340, max: 365, step: 5 },
          maxScenarios: 10,
        })
        .expect(200);

      const bestScenario = response.body.data.bestScenario;
      expect(bestScenario).toMatchObject({
        estimatedProfit: expect.any(Number),
        profitMargin: expect.any(Number),
      });

      // Best scenario should maximize profit
      expect(bestScenario.profitMargin).toBeGreaterThanOrEqual(7); // Target margin
    });

    it('should track profit impact of negotiation changes', async () => {
      // Get current profit
      const profitBefore = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      // Create a new offer that impacts profit
      const testNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: tradeSellerIds[0],
          status: 'ACTIVE',
          initialOffer: 340,
          currentOffer: 340,
          quantity: 30,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${testNego.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 370, // Higher price reduces profit
          quantity: 30,
        })
        .expect(201);

      // Verify profit impact warning if margin drops below threshold
      if (response.body.data.profitImpact.profitMargin < 5) {
        expect(response.body.data.profitImpact.warning).toContain('below minimum margin');
      }

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: testNego.id } });
    });

    it('should handle rejection of offers', async () => {
      // Create new negotiation for rejection test
      const seller = await prisma.user.create({
        data: {
          email: 'reject-seller@test.com',
          name: 'Reject Seller',
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: (await prisma.product.findFirst())!.id,
          quantity: 20,
          unit: 'TON',
          askingPrice: 400,
          status: 'ACTIVE',
        },
      });

      const tradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: 20,
          offeredQuantity: 20,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: tradeSeller.id,
          status: 'ACTIVE',
          initialOffer: 380,
          currentOffer: 380,
          quantity: 20,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Make offer
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 380,
          quantity: 20,
        })
        .expect(201);

      // Seller rejects
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 380,
          quantity: 20,
          response: 'REJECTED',
          responseNote: 'Price too low',
        })
        .expect(201);

      // Verify negotiation failed
      const failedNego = await prisma.offerNegotiation.findUnique({
        where: { id: negotiation.id },
      });
      expect(failedNego?.status).toBe('FAILED');

      // Clean up
      await prisma.offerRound.deleteMany({
        where: { negotiationId: negotiation.id },
      });
      await prisma.offerNegotiation.delete({ where: { id: negotiation.id } });
      await prisma.tradeSeller.delete({ where: { id: tradeSeller.id } });
      await prisma.saleListing.delete({ where: { id: saleListing.id } });
      await prisma.user.delete({ where: { id: seller.id } });
    });

    it('should track negotiation history for audit', async () => {
      // Get all offer rounds for first negotiation
      const rounds = await prisma.offerRound.findMany({
        where: { negotiationId: negotiationIds[0] },
        orderBy: { createdAt: 'asc' },
      });

      expect(rounds.length).toBeGreaterThan(2);
      
      // Verify alternating pattern (buyer -> seller -> buyer)
      const pattern = rounds.map(r => r.offeredBy);
      expect(pattern).toContain('BUYER');
      expect(pattern).toContain('SELLER');
      
      // Last round should be acceptance
      const lastRound = rounds[rounds.length - 1];
      expect(lastRound.response).toBe('ACCEPTED');
    });

    it('should update trade operation total value', async () => {
      // Calculate total value from all agreed negotiations
      const negotiations = await prisma.offerNegotiation.findMany({
        where: {
          tradeOperationId: tradeOperationId,
          status: 'AGREED',
        },
      });

      const totalValue = negotiations.reduce(
        (sum, nego) => sum + (nego.finalPrice?.toNumber() || 0) * (nego.quantity.toNumber() || 0),
        0
      );

      // Update trade operation
      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          totalValue: totalValue,
          commissionAmount: totalValue * 0.04, // 4% total commission
        },
      });

      const trade = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
      });

      expect(trade?.totalValue).toEqual(totalValue);
      expect(trade?.commissionAmount).toEqual(totalValue * 0.04);
    });
  });
});