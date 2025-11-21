import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/reject - Reject Offer Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let negotiationId: string;
  let tradeOperationId: string;
  let tradeSellerId: string;

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
        email: 'test-admin-reject@agrotrade.com',
        name: 'Test Admin Reject',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-reject@test.com',
        name: 'Test Buyer Reject',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-reject@test.com',
        name: 'Test Seller Reject',
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
        operationNumber: 'TRADE-REJECT-001',
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
    tradeSellerId = tradeSeller.id;

    // Create a PENDING negotiation to reject
    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: NegotiationStatus.PENDING,
        currentOffer: {
          price: 310,
          quantity: 50,
          terms: 'Low offer',
        },
        offerHistory: [
          {
            price: 310,
            quantity: 50,
            terms: 'Low offer',
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
      where: { seller: { email: 'test-seller-reject@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-reject@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-reject@agrotrade.com',
            'test-buyer-reject@test.com',
            'test-seller-reject@test.com'
          ] 
        },
      },
    });
    await app.close();
  });

  describe('Reject Offer', () => {
    it('should reject offer and update status to REJECTED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .send({
          reason: 'Price too low for current market conditions',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'REJECTED',
          currentOffer: expect.objectContaining({
            price: 310,
            quantity: 50,
            terms: 'Low offer',
          }),
          rejectionReason: 'Price too low for current market conditions',
          respondedAt: expect.any(String),
          concludedAt: expect.any(String),
        }),
      });

      // Verify database updates
      const updated = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('REJECTED');
      expect(updated?.concludedAt).toBeTruthy();
    });

    it('should update TradeSeller status to REJECTED', async () => {
      const freshTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
          saleListingId: (await prisma.saleListing.findFirst())!.id,
          requestedQuantity: 40,
          offeredQuantity: 40,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: freshTradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 305,
            quantity: 40,
            terms: 'Another low offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/reject`)
        .send({
          reason: 'Price not acceptable',
        })
        .expect(200);

      // Verify TradeSeller updated
      const updatedTradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: freshTradeSeller.id },
      });
      expect(updatedTradeSeller?.status).toBe('REJECTED');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
      await prisma.tradeSeller.delete({ where: { id: freshTradeSeller.id } });
    });

    it('should reject counter offer', async () => {
      // Create negotiation with counter offer
      const counteredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 320,
            quantity: 45,
            terms: 'Initial offer',
          },
          counterOffer: {
            price: 360,
            quantity: 45,
            terms: 'Too high counter',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [
            {
              price: 320,
              quantity: 45,
              terms: 'Initial offer',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 360,
              quantity: 45,
              terms: 'Too high counter',
              isCounterOffer: true,
              createdAt: new Date().toISOString(),
            },
          ],
          respondedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${counteredNego.id}/reject`)
        .send({
          reason: 'Counter offer price exceeds budget',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'REJECTED',
        rejectionReason: 'Counter offer price exceeds budget',
        rejectedOffer: expect.objectContaining({
          price: 360,
          quantity: 45,
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: counteredNego.id } });
    });

    it('should allow rejection without reason', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 315,
            quantity: 35,
            terms: 'Offer to reject',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/reject`)
        .send({})
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'REJECTED',
        rejectionReason: null,
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should not allow rejecting already ACCEPTED negotiation', async () => {
      const acceptedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.ACCEPTED,
          currentOffer: {
            price: 340,
            quantity: 40,
            terms: 'Already accepted',
          },
          finalPrice: 340,
          finalQuantity: 40,
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${acceptedNego.id}/reject`)
        .send({
          reason: 'Trying to reject accepted',
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

    it('should not allow rejecting already REJECTED negotiation', async () => {
      const rejectedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.REJECTED,
          currentOffer: {
            price: 310,
            quantity: 30,
            terms: 'Already rejected',
          },
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${rejectedNego.id}/reject`)
        .send({
          reason: 'Double reject',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'ALREADY_REJECTED',
          message: expect.stringContaining('already rejected'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: rejectedNego.id } });
    });

    it('should allow rejecting EXPIRED negotiation', async () => {
      const expiredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.EXPIRED,
          currentOffer: {
            price: 315,
            quantity: 35,
            terms: 'Expired offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${expiredNego.id}/reject`)
        .send({
          reason: 'Formally rejecting expired offer',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'REJECTED',
        rejectionReason: 'Formally rejecting expired offer',
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: expiredNego.id } });
    });

    it('should trigger notification on rejection', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 318,
            quantity: 42,
            terms: 'Notification test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/reject`)
        .send({
          reason: 'Not suitable for requirements',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        notification: expect.objectContaining({
          type: 'OFFER_REJECTED',
          recipientId: expect.any(String),
          message: expect.stringContaining('rejected'),
          data: expect.objectContaining({
            negotiationId: freshNego.id,
            reason: 'Not suitable for requirements',
          }),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should free up seller for other opportunities', async () => {
      const freshTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
          saleListingId: (await prisma.saleListing.findFirst())!.id,
          requestedQuantity: 60,
          offeredQuantity: 60,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: freshTradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 312,
            quantity: 60,
            terms: 'To reject',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/reject`)
        .send({
          reason: 'Selecting different seller',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        sellerRelease: expect.objectContaining({
          released: true,
          sellerId: expect.any(String),
          message: expect.stringContaining('available for other trades'),
        }),
      });

      // Verify sale listing is re-activated
      const saleListing = await prisma.saleListing.findFirst({
        where: { 
          sellerId: freshTradeSeller.sellerId,
        },
      });
      expect(saleListing?.status).toBe('ACTIVE');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
      await prisma.tradeSeller.delete({ where: { id: freshTradeSeller.id } });
    });

    it('should track rejection metrics', async () => {
      const metricsNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 322,
            quantity: 48,
            terms: 'Metrics test',
          },
          offerHistory: [
            {
              price: 322,
              quantity: 48,
              terms: 'Metrics test',
              createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            },
          ],
          expiresAt: new Date(Date.now() + 42 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${metricsNego.id}/reject`)
        .send({
          reason: 'Testing metrics',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        metrics: expect.objectContaining({
          negotiationDuration: expect.any(Number), // ~6 hours
          totalOffersExchanged: 1,
          rejectionRate: expect.any(Number), // % of negotiations rejected
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: metricsNego.id } });
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/negotiations/non-existent-id/reject')
        .send({
          reason: 'Not found',
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

  describe('Reject Authorization', () => {
    it('should allow seller to reject buyer offer', async () => {
      const buyerOfferNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 308,
            quantity: 38,
            terms: 'Buyer offer to reject',
            offeredBy: 'BUYER',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${buyerOfferNego.id}/reject`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          reason: 'Seller rejects buyer offer',
        })
        .expect(200);

      expect(response.body.data.rejectedBy).toBe('SELLER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: buyerOfferNego.id } });
    });

    it('should allow buyer/admin to reject seller counter offer', async () => {
      const sellerCounterNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 320,
            quantity: 44,
            terms: 'Initial buyer offer',
            offeredBy: 'BUYER',
          },
          counterOffer: {
            price: 365,
            quantity: 44,
            terms: 'Seller counter to reject',
            offeredBy: 'SELLER',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${sellerCounterNego.id}/reject`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          reason: 'Admin rejects high counter offer',
        })
        .expect(200);

      expect(response.body.data.rejectedBy).toBe('BUYER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: sellerCounterNego.id } });
    });
  });
});