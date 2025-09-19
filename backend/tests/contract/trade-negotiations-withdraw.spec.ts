import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/withdraw - Withdraw Offer Contract Test', () => {
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
        email: 'test-admin-withdraw@agrotrade.com',
        name: 'Test Admin Withdraw',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-withdraw@test.com',
        name: 'Test Buyer Withdraw',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-withdraw@test.com',
        name: 'Test Seller Withdraw',
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
        operationNumber: 'TRADE-WITHDRAW-001',
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

    // Create a PENDING negotiation to withdraw
    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: NegotiationStatus.PENDING,
        currentOffer: {
          price: 335,
          quantity: 50,
          terms: 'Initial offer',
        },
        offerHistory: [
          {
            price: 335,
            quantity: 50,
            terms: 'Initial offer',
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
      where: { seller: { email: 'test-seller-withdraw@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-withdraw@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-withdraw@agrotrade.com',
            'test-buyer-withdraw@test.com',
            'test-seller-withdraw@test.com'
          ] 
        },
      },
    });
    await app.close();
  });

  describe('Withdraw Offer', () => {
    it('should withdraw offer and update status to WITHDRAWN', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/withdraw`)
        .send({
          reason: 'Changed negotiation strategy',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'WITHDRAWN',
          currentOffer: expect.objectContaining({
            price: 335,
            quantity: 50,
            terms: 'Initial offer',
          }),
          withdrawalReason: 'Changed negotiation strategy',
          withdrawnAt: expect.any(String),
          concludedAt: expect.any(String),
        }),
      });

      // Verify database updates
      const updated = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('WITHDRAWN');
      expect(updated?.concludedAt).toBeTruthy();
    });

    it('should update TradeSeller status to WITHDRAWN', async () => {
      const freshTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
          saleListingId: (await prisma.saleListing.findFirst())!.id,
          requestedQuantity: 45,
          offeredQuantity: 45,
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
            price: 340,
            quantity: 45,
            terms: 'Offer to withdraw',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/withdraw`)
        .send({
          reason: 'Selecting alternative supplier',
        })
        .expect(200);

      // Verify TradeSeller updated
      const updatedTradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: freshTradeSeller.id },
      });
      expect(updatedTradeSeller?.status).toBe('WITHDRAWN');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
      await prisma.tradeSeller.delete({ where: { id: freshTradeSeller.id } });
    });

    it('should allow withdrawal of COUNTERED negotiation', async () => {
      // Create negotiation with counter offer
      const counteredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 330,
            quantity: 50,
            terms: 'Initial offer',
          },
          counterOffer: {
            price: 345,
            quantity: 50,
            terms: 'Counter offer',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [
            {
              price: 330,
              quantity: 50,
              terms: 'Initial offer',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 345,
              quantity: 50,
              terms: 'Counter offer',
              isCounterOffer: true,
              createdAt: new Date().toISOString(),
            },
          ],
          respondedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${counteredNego.id}/withdraw`)
        .send({
          reason: 'Counter offer not acceptable, ending negotiation',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'WITHDRAWN',
        withdrawalReason: 'Counter offer not acceptable, ending negotiation',
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: counteredNego.id } });
    });

    it('should allow withdrawal without reason', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 338,
            quantity: 42,
            terms: 'Offer to withdraw',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/withdraw`)
        .send({})
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'WITHDRAWN',
        withdrawalReason: null,
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should not allow withdrawing ACCEPTED negotiation', async () => {
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
        .post(`/api/negotiations/${acceptedNego.id}/withdraw`)
        .send({
          reason: 'Trying to withdraw accepted',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'CANNOT_WITHDRAW',
          message: expect.stringContaining('Cannot withdraw accepted negotiation'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: acceptedNego.id } });
    });

    it('should not allow withdrawing REJECTED negotiation', async () => {
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
        .post(`/api/negotiations/${rejectedNego.id}/withdraw`)
        .send({
          reason: 'Trying to withdraw rejected',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_COMPLETED',
          message: expect.stringContaining('already concluded'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: rejectedNego.id } });
    });

    it('should not allow withdrawing already WITHDRAWN negotiation', async () => {
      const withdrawnNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.WITHDRAWN,
          currentOffer: {
            price: 315,
            quantity: 35,
            terms: 'Already withdrawn',
          },
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${withdrawnNego.id}/withdraw`)
        .send({
          reason: 'Double withdraw',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'ALREADY_WITHDRAWN',
          message: expect.stringContaining('already withdrawn'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: withdrawnNego.id } });
    });

    it('should allow withdrawing EXPIRED negotiation', async () => {
      const expiredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.EXPIRED,
          currentOffer: {
            price: 325,
            quantity: 38,
            terms: 'Expired offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() - 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${expiredNego.id}/withdraw`)
        .send({
          reason: 'Formally withdrawing expired offer',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'WITHDRAWN',
        withdrawalReason: 'Formally withdrawing expired offer',
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: expiredNego.id } });
    });

    it('should release seller for other opportunities', async () => {
      const freshTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
          saleListingId: (await prisma.saleListing.findFirst())!.id,
          requestedQuantity: 55,
          offeredQuantity: 55,
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
            price: 332,
            quantity: 55,
            terms: 'To withdraw',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/withdraw`)
        .send({
          reason: 'Changing supplier selection',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        sellerRelease: expect.objectContaining({
          released: true,
          sellerId: expect.any(String),
          message: expect.stringContaining('released from trade'),
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

    it('should trigger notification on withdrawal', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 328,
            quantity: 46,
            terms: 'Notification test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/withdraw`)
        .send({
          reason: 'Business decision',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        notification: expect.objectContaining({
          type: 'OFFER_WITHDRAWN',
          recipientId: expect.any(String),
          message: expect.stringContaining('withdrawn'),
          data: expect.objectContaining({
            negotiationId: freshNego.id,
            reason: 'Business decision',
          }),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should track withdrawal metrics', async () => {
      const metricsNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 335,
            quantity: 52,
            terms: 'Initial',
          },
          counterOffer: {
            price: 350,
            quantity: 52,
            terms: 'Counter',
            receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          },
          offerHistory: [
            {
              price: 335,
              quantity: 52,
              terms: 'Initial',
              createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 350,
              quantity: 52,
              terms: 'Counter',
              isCounterOffer: true,
              createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            },
          ],
          respondedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 45 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${metricsNego.id}/withdraw`)
        .send({
          reason: 'Testing metrics',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        metrics: expect.objectContaining({
          negotiationDuration: expect.any(Number), // ~12 hours
          totalOffersExchanged: 2,
          withdrawalRate: expect.any(Number), // % of negotiations withdrawn
          averageTimeToWithdrawal: expect.any(Number),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: metricsNego.id } });
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/negotiations/non-existent-id/withdraw')
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

  describe('Withdraw Authorization', () => {
    it('should only allow admin to withdraw negotiations', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 342,
            quantity: 48,
            terms: 'Admin only',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Admin should succeed
      const adminResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/withdraw`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          reason: 'Admin withdrawal',
        })
        .expect(200);

      expect(adminResponse.body.data.withdrawnBy).toBe('ADMIN');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should not allow seller to withdraw admin negotiations', async () => {
      const adminNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 336,
            quantity: 44,
            terms: 'Admin created',
            offeredBy: 'BUYER',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${adminNego.id}/withdraw`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          reason: 'Seller trying to withdraw',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: expect.stringContaining('Only admin can withdraw'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: adminNego.id } });
    });

    it('should not allow buyer to withdraw negotiations', async () => {
      const buyerNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 333,
            quantity: 41,
            terms: 'Test offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${buyerNego.id}/withdraw`)
        .set('Authorization', 'Bearer buyer-token')
        .send({
          reason: 'Buyer trying to withdraw',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: expect.stringContaining('Only admin can withdraw'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: buyerNego.id } });
    });
  });
});