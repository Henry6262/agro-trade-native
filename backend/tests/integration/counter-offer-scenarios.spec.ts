import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus, TradePhase } from '@prisma/client';

describe('Counter Offer Scenarios - Integration Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tradeOperationId: string;
  let tradeSellerId: string;
  let adminToken: string = 'Bearer admin-token';
  let sellerToken: string = 'Bearer seller-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup base test data
    const admin = await prisma.user.create({
      data: {
        email: 'admin-counter-int@agrotrade.com',
        name: 'Counter Test Admin',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'buyer-counter-int@test.com',
        name: 'Counter Test Buyer',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'seller-counter-int@test.com',
        name: 'Counter Test Seller',
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
        quantity: 100,
        unit: 'TON',
        askingPrice: 350,
        status: 'ACTIVE',
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: `INT-COUNTER-${Date.now()}`,
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: TradePhase.SELLER_NEGOTIATION,
        status: 'ACTIVE',
        profitMargin: 10,
        sellingPrice: 390,
        totalRevenue: 39000,
        currency: 'EUR',
      },
    });
    tradeOperationId = trade.id;

    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        requestedQuantity: 100,
        offeredQuantity: 100,
        unit: 'TON',
        status: 'INVITED',
      },
    });
    tradeSellerId = tradeSeller.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'INT-COUNTER' } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'INT-COUNTER' } } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: { contains: 'INT-COUNTER' } },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'counter-int' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: { contains: 'counter-int' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'counter-int' } },
    });
    await app.close();
  });

  describe('Multiple Counter Offer Rounds', () => {
    it('should handle multiple rounds of counter offers', async () => {
      // Round 1: Initial offer
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 320,
          quantity: 100,
          terms: 'Initial low offer',
        })
        .expect(201);

      const negotiationId = offerResponse.body.data.id;

      // Round 2: Seller counters high
      const counter1Response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 360,
          quantity: 100,
          terms: 'Premium quality justifies higher price',
          reason: 'Current market conditions',
        })
        .expect(201);

      expect(counter1Response.body.data.status).toBe('COUNTERED');
      expect(counter1Response.body.data.offerHistory).toHaveLength(2);

      // Round 3: Admin counters in the middle
      const counter2Response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', adminToken)
        .send({
          price: 340,
          quantity: 100,
          terms: 'Meeting halfway',
          reason: 'Budget constraints',
        })
        .expect(201);

      expect(counter2Response.body.data.offerHistory).toHaveLength(3);

      // Round 4: Seller counters slightly lower
      const counter3Response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 345,
          quantity: 100,
          terms: 'Final offer',
          reason: 'Best price we can offer',
        })
        .expect(201);

      expect(counter3Response.body.data.offerHistory).toHaveLength(4);

      // Round 5: Admin accepts
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Deal agreed after negotiation',
        })
        .expect(200);

      expect(acceptResponse.body.data).toMatchObject({
        status: 'ACCEPTED',
        finalPrice: 345,
        finalQuantity: 100,
      });

      // Verify complete offer history
      const finalNegotiation = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });

      expect(finalNegotiation?.offerHistory).toHaveLength(4);
      expect(finalNegotiation?.offerHistory.map(h => h.price)).toEqual([
        320, // Initial
        360, // Seller counter
        340, // Admin counter
        345, // Seller final
      ]);
    });

    it('should track profit impact through counter offers', async () => {
      // Create fresh negotiation
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 330,
          quantity: 100,
          terms: 'Profit tracking test',
        })
        .expect(201);

      const negotiationId = offerResponse.body.data.id;
      const initialProfit = offerResponse.body.data.profitImpact;

      expect(initialProfit).toMatchObject({
        estimatedProfit: 6000, // 39000 - 33000
        profitMargin: expect.closeTo(15.38, 1), // (6000/39000) * 100
      });

      // Counter with higher price
      const counterResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 350,
          quantity: 100,
          terms: 'Higher price counter',
        })
        .expect(201);

      const counterProfit = counterResponse.body.data.profitImpact;
      
      expect(counterProfit).toMatchObject({
        newPurchasePrice: 350,
        previousPurchasePrice: 330,
        priceChange: 20,
        estimatedProfit: 4000, // 39000 - 35000
        profitMargin: expect.closeTo(10.26, 1),
        profitReduction: 2000, // 6000 - 4000
      });

      // Warning if profit too low
      const highCounterResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', adminToken)
        .send({
          price: 375, // Very high, low profit
          quantity: 100,
          terms: 'Testing profit warning',
        })
        .expect(201);

      expect(highCounterResponse.body.data.profitImpact).toMatchObject({
        estimatedProfit: 1500, // 39000 - 37500
        profitMargin: expect.closeTo(3.85, 1),
        warning: expect.stringContaining('below minimum margin'),
      });
    });
  });

  describe('Partial Quantity Counter Offers', () => {
    it('should handle counter offers with reduced quantity', async () => {
      // Initial offer for full quantity
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 340,
          quantity: 100,
          terms: 'Full quantity request',
        })
        .expect(201);

      const negotiationId = offerResponse.body.data.id;

      // Seller counters with reduced quantity
      const counterResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 340,
          quantity: 75, // Only 75 tons available
          terms: 'Can only supply 75 tons at this price',
          reason: 'Limited availability',
        })
        .expect(201);

      expect(counterResponse.body.data.counterOffer.quantity).toBe(75);

      // Accept partial quantity
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Accepting partial quantity',
        })
        .expect(200);

      expect(acceptResponse.body.data).toMatchObject({
        finalPrice: 340,
        finalQuantity: 75,
      });

      // Verify trade seller updated with partial quantity
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller?.agreedQuantity).toBe(75);

      // Check if system suggests finding additional suppliers
      expect(acceptResponse.body.data.quantityGap).toMatchObject({
        requested: 100,
        secured: 75,
        shortfall: 25,
        message: expect.stringContaining('25 tons still needed'),
      });
    });
  });

  describe('Competitive Counter Offers', () => {
    it('should compare counter offers from multiple sellers', async () => {
      // Create additional sellers
      const sellers = await Promise.all([
        prisma.user.create({
          data: {
            email: 'competitive-seller1@test.com',
            name: 'Competitive Seller 1',
            role: 'FARMER',
          },
        }),
        prisma.user.create({
          data: {
            email: 'competitive-seller2@test.com',
            name: 'Competitive Seller 2',
            role: 'FARMER',
          },
        }),
      ]);

      const product = await prisma.product.findFirst();

      const saleListings = await Promise.all(
        sellers.map((seller, index) =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 50,
              unit: 'TON',
              askingPrice: 345 + index * 5,
              status: 'ACTIVE',
            },
          })
        )
      );

      const tradeSellers = await Promise.all(
        saleListings.map((listing, index) =>
          prisma.tradeSeller.create({
            data: {
              tradeOperationId: tradeOperationId,
              sellerId: sellers[index].id,
              saleListingId: listing.id,
              requestedQuantity: 50,
              offeredQuantity: 50,
              unit: 'TON',
              status: 'INVITED',
            },
          })
        )
      );

      // Send initial offers to both
      const offers = await Promise.all(
        tradeSellers.map(ts =>
          request(app.getHttpServer())
            .post(`/api/trade-operations/${tradeOperationId}/offers`)
            .set('Authorization', adminToken)
            .send({
              tradeSellerId: ts.id,
              price: 335,
              quantity: 50,
              terms: 'Standard offer',
            })
            .expect(201)
        )
      );

      const negotiationIds = offers.map(o => o.body.data.id);

      // Each seller counters differently
      const counter1 = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[0]}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 342,
          quantity: 50,
          terms: 'Competitive price 1',
        })
        .expect(201);

      const counter2 = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[1]}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 338,
          quantity: 50,
          terms: 'Better competitive price',
        })
        .expect(201);

      // Get all negotiations to compare
      const comparison = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?status=COUNTERED`)
        .set('Authorization', adminToken)
        .expect(200);

      // Should show price comparison
      expect(comparison.body.data.priceComparison).toMatchObject({
        lowestCounter: 338,
        highestCounter: 342,
        averageCounter: 340,
        priceSpread: 4,
        bestDeal: expect.objectContaining({
          negotiationId: negotiationIds[1],
          price: 338,
          seller: 'Competitive Seller 2',
        }),
      });

      // Accept the better offer
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[1]}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Accepting best price',
        })
        .expect(200);

      // Reject the higher offer
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[0]}/reject`)
        .set('Authorization', adminToken)
        .send({
          reason: 'Better price available from another seller',
        })
        .expect(200);
    });
  });

  describe('Counter Offer Expiration', () => {
    it('should handle expiration during counter negotiation', async () => {
      // Create negotiation with short expiry
      const shortExpiryNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: tradeSellerId,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 335,
            quantity: 100,
            terms: 'Short expiry test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 100), // Expires in 100ms
        },
      });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Try to counter after expiration
      const counterResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${shortExpiryNego.id}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 345,
          quantity: 100,
          terms: 'Too late',
        })
        .expect(400);

      expect(counterResponse.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_EXPIRED',
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: shortExpiryNego.id } });
    });
  });

  describe('Counter Offer Metrics', () => {
    it('should track counter offer patterns and success rates', async () => {
      // Create multiple negotiations with different outcomes
      const outcomes = ['ACCEPTED', 'REJECTED', 'COUNTERED'];
      const negotiations = [];

      for (let i = 0; i < 3; i++) {
        const offer = await request(app.getHttpServer())
          .post(`/api/trade-operations/${tradeOperationId}/offers`)
          .set('Authorization', adminToken)
          .send({
            tradeSellerId: tradeSellerId,
            price: 330 + i * 5,
            quantity: 30,
            terms: `Metrics test ${i}`,
          })
          .expect(201);

        negotiations.push(offer.body.data.id);

        // Each gets countered
        await request(app.getHttpServer())
          .post(`/api/negotiations/${offer.body.data.id}/counter`)
          .set('Authorization', sellerToken)
          .send({
            price: 340 + i * 5,
            quantity: 30,
            terms: `Counter ${i}`,
          })
          .expect(201);
      }

      // Different responses to counters
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[0]}/accept`)
        .set('Authorization', adminToken)
        .send({})
        .expect(200);

      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[1]}/reject`)
        .set('Authorization', adminToken)
        .send({ reason: 'Too high' })
        .expect(200);

      // Leave third as countered

      // Get metrics
      const metricsResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations/metrics`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(metricsResponse.body.data).toMatchObject({
        totalNegotiations: expect.any(Number),
        counterOfferRate: expect.any(Number), // % that received counters
        acceptanceAfterCounter: expect.any(Number), // % accepted after counter
        rejectionAfterCounter: expect.any(Number), // % rejected after counter
        averageRounds: expect.any(Number), // Average negotiation rounds
        averagePriceMovement: expect.any(Number), // Average % price change
      });
    });
  });
});