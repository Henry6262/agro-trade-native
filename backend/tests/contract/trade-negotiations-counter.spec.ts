import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/counter - Counter Offer Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let negotiationId: string;
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
        email: 'test-admin-counter@agrotrade.com',
        name: 'Test Admin Counter',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-counter@test.com',
        name: 'Test Buyer Counter',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-counter@test.com',
        name: 'Test Seller Counter',
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
        operationNumber: 'TRADE-COUNTER-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        profitMargin: 7.5,
        sellingPrice: 380,
        totalRevenue: 38000,
        currency: 'EUR',
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

    // Create a PENDING negotiation to counter
    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: NegotiationStatus.PENDING,
        currentOffer: {
          price: 320,
          quantity: 50,
          terms: 'Payment on delivery',
        },
        offerHistory: [
          {
            price: 320,
            quantity: 50,
            terms: 'Payment on delivery',
            createdAt: new Date().toISOString(),
          },
        ],
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });
    negotiationId = negotiation.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: 'test-seller-counter@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-counter@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-counter@agrotrade.com',
            'test-buyer-counter@test.com',
            'test-seller-counter@test.com'
          ] 
        },
      },
    });
    await app.close();
  });

  describe('Counter Offer Creation', () => {
    it('should create counter offer and update status to COUNTERED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .send({
          price: 335,
          quantity: 50,
          terms: 'Need 50% advance payment for this price',
          reason: 'Current market prices have increased',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'COUNTERED',
          currentOffer: expect.objectContaining({
            price: 320,
            quantity: 50,
            terms: 'Payment on delivery',
          }),
          counterOffer: expect.objectContaining({
            price: 335,
            quantity: 50,
            terms: 'Need 50% advance payment for this price',
            reason: 'Current market prices have increased',
            receivedAt: expect.any(String),
          }),
          respondedAt: expect.any(String),
        }),
      });

      // Verify database update
      const updated = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('COUNTERED');
      expect(updated?.counterOffer).toBeTruthy();
      expect(updated?.respondedAt).toBeTruthy();
    });

    it('should add counter offer to offer history', async () => {
      // Create fresh negotiation
      const freshNegotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 325,
            quantity: 45,
            terms: 'Standard terms',
          },
          offerHistory: [
            {
              price: 325,
              quantity: 45,
              terms: 'Standard terms',
              createdAt: new Date().toISOString(),
            },
          ],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNegotiation.id}/counter`)
        .send({
          price: 340,
          quantity: 45,
          terms: 'Higher quality product justifies price',
        })
        .expect(201);

      expect(response.body.data.offerHistory).toHaveLength(2);
      expect(response.body.data.offerHistory[1]).toMatchObject({
        price: 340,
        quantity: 45,
        terms: 'Higher quality product justifies price',
        isCounterOffer: true,
        createdAt: expect.any(String),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNegotiation.id } });
    });

    it('should calculate profit impact of counter offer', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .send({
          price: 345, // Higher price
          quantity: 50,
          terms: 'Premium quality',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        profitImpact: expect.objectContaining({
          newPurchasePrice: 345,
          previousPurchasePrice: 320,
          priceChange: 25,
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          profitReduction: expect.any(Number), // Should be positive (profit reduced)
        }),
      });

      // Profit margin should be lower with higher purchase price
      expect(response.body.data.profitImpact.profitMargin).toBeLessThan(7.5);
    });

    it('should validate counter offer price is positive', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .send({
          price: -100,
          quantity: 50,
          terms: 'Invalid price',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('price must be positive'),
        }),
      });
    });

    it('should validate counter offer quantity is positive', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .send({
          price: 330,
          quantity: 0,
          terms: 'Invalid quantity',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('quantity must be positive'),
        }),
      });
    });

    it('should not allow counter offer on ACCEPTED negotiation', async () => {
      // Create an accepted negotiation
      const acceptedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.ACCEPTED,
          currentOffer: {
            price: 340,
            quantity: 40,
            terms: 'Agreed',
          },
          finalPrice: 340,
          finalQuantity: 40,
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${acceptedNego.id}/counter`)
        .send({
          price: 345,
          quantity: 40,
          terms: 'Try to change',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_COMPLETED',
          message: expect.stringContaining('already accepted'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: acceptedNego.id } });
    });

    it('should not allow counter offer on REJECTED negotiation', async () => {
      // Create a rejected negotiation
      const rejectedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.REJECTED,
          currentOffer: {
            price: 310,
            quantity: 30,
            terms: 'Low offer',
          },
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${rejectedNego.id}/counter`)
        .send({
          price: 320,
          quantity: 30,
          terms: 'Better offer',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_COMPLETED',
          message: expect.stringContaining('rejected'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: rejectedNego.id } });
    });

    it('should not allow counter offer on EXPIRED negotiation', async () => {
      // Create an expired negotiation
      const expiredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.EXPIRED,
          currentOffer: {
            price: 315,
            quantity: 35,
            terms: 'Old offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() - 1000), // Expired
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${expiredNego.id}/counter`)
        .send({
          price: 320,
          quantity: 35,
          terms: 'Late counter',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_EXPIRED',
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: expiredNego.id } });
    });

    it('should allow counter on already COUNTERED negotiation', async () => {
      // Create a countered negotiation (buyer can respond to seller counter)
      const counteredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 320,
            quantity: 50,
            terms: 'Initial offer',
          },
          counterOffer: {
            price: 340,
            quantity: 50,
            terms: 'Seller counter',
            receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          offerHistory: [
            {
              price: 320,
              quantity: 50,
              terms: 'Initial offer',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 340,
              quantity: 50,
              terms: 'Seller counter',
              isCounterOffer: true,
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            },
          ],
          respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 46 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${counteredNego.id}/counter`)
        .send({
          price: 330, // Buyer counters in between
          quantity: 50,
          terms: 'Meet in the middle',
          reason: 'Compromise offer',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: 'COUNTERED',
          counterOffer: expect.objectContaining({
            price: 330,
            quantity: 50,
            terms: 'Meet in the middle',
          }),
          offerHistory: expect.arrayContaining([
            expect.any(Object),
            expect.any(Object),
            expect.objectContaining({
              price: 330,
              quantity: 50,
              terms: 'Meet in the middle',
              isCounterOffer: true,
            }),
          ]),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: counteredNego.id } });
    });

    it('should warn if counter offer reduces profit below threshold', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .send({
          price: 375, // Very high price
          quantity: 50,
          terms: 'Premium price required',
        })
        .expect(201);

      expect(response.body.data.profitImpact).toMatchObject({
        warning: expect.stringContaining('below minimum margin'),
        profitMargin: expect.any(Number),
      });

      // Should have very low profit margin
      expect(response.body.data.profitImpact.profitMargin).toBeLessThan(5);
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/negotiations/non-existent-id/counter')
        .send({
          price: 330,
          quantity: 50,
          terms: 'Counter offer',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_NOT_FOUND',
        }),
      });
    });

    it('should track counter offers in metrics', async () => {
      // Create a fresh negotiation
      const metricsNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 330,
            quantity: 60,
            terms: 'Initial',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${metricsNego.id}/counter`)
        .send({
          price: 345,
          quantity: 60,
          terms: 'Counter',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        metrics: expect.objectContaining({
          totalOffers: 2, // Initial + counter
          averageResponseTime: expect.any(Number),
          priceMovement: expect.any(Number), // % change
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: metricsNego.id } });
    });
  });

  describe('Counter Offer Authorization', () => {
    it('should only allow seller to counter buyer offers', async () => {
      // Create negotiation with buyer offer
      const buyerOfferNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 325,
            quantity: 40,
            terms: 'Buyer offer',
            offeredBy: 'BUYER',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Seller should be able to counter
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${buyerOfferNego.id}/counter`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          price: 335,
          quantity: 40,
          terms: 'Seller counter',
        })
        .expect(201);

      expect(response.body.data.counterOffer.offeredBy).toBe('SELLER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: buyerOfferNego.id } });
    });

    it('should only allow buyer/admin to counter seller offers', async () => {
      // Create negotiation with seller counter
      const sellerCounterNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 320,
            quantity: 45,
            terms: 'Initial buyer offer',
            offeredBy: 'BUYER',
          },
          counterOffer: {
            price: 340,
            quantity: 45,
            terms: 'Seller counter',
            offeredBy: 'SELLER',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Buyer should be able to counter
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${sellerCounterNego.id}/counter`)
        .set('Authorization', 'Bearer buyer-token')
        .send({
          price: 330,
          quantity: 45,
          terms: 'Buyer counter to seller',
        })
        .expect(201);

      expect(response.body.data.counterOffer.offeredBy).toBe('BUYER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: sellerCounterNego.id } });
    });
  });
});