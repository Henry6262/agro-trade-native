import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/accept - Accept Offer Contract Test', () => {
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
        email: 'test-admin-accept@agrotrade.com',
        name: 'Test Admin Accept',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-accept@test.com',
        name: 'Test Buyer Accept',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-accept@test.com',
        name: 'Test Seller Accept',
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
        operationNumber: 'TRADE-ACCEPT-001',
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

    // Create a PENDING negotiation to accept
    const negotiation = await prisma.offerNegotiation.create({
      data: {
        tradeOperationId: trade.id,
        tradeSellerId: tradeSeller.id,
        status: NegotiationStatus.PENDING,
        currentOffer: {
          price: 335,
          quantity: 50,
          terms: 'Payment on delivery, quality inspection',
        },
        offerHistory: [
          {
            price: 335,
            quantity: 50,
            terms: 'Payment on delivery, quality inspection',
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
      where: { seller: { email: 'test-seller-accept@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-accept@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-accept@agrotrade.com',
            'test-buyer-accept@test.com',
            'test-seller-accept@test.com'
          ] 
        },
      },
    });
    await app.close();
  });

  describe('Accept Offer', () => {
    it('should accept offer and update status to ACCEPTED', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .send({
          acceptanceNote: 'Terms agreed, proceeding with purchase',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'ACCEPTED',
          currentOffer: expect.objectContaining({
            price: 335,
            quantity: 50,
            terms: 'Payment on delivery, quality inspection',
          }),
          finalPrice: 335,
          finalQuantity: 50,
          respondedAt: expect.any(String),
          concludedAt: expect.any(String),
          acceptanceNote: 'Terms agreed, proceeding with purchase',
        }),
      });

      // Verify database updates
      const updated = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('ACCEPTED');
      expect(updated?.finalPrice).toBe(335);
      expect(updated?.finalQuantity).toBe(50);
      expect(updated?.concludedAt).toBeTruthy();
    });

    it('should update TradeSeller with agreed price and status', async () => {
      // Create fresh negotiation
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
            price: 340,
            quantity: 40,
            terms: 'Fresh offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/accept`)
        .send({})
        .expect(200);

      // Verify TradeSeller updated
      const updatedTradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: freshTradeSeller.id },
      });
      expect(updatedTradeSeller).toMatchObject({
        status: 'ACCEPTED',
        agreedPrice: 340,
        agreedQuantity: 40,
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
      await prisma.tradeSeller.delete({ where: { id: freshTradeSeller.id } });
    });

    it('should accept counter offer', async () => {
      // Create negotiation with counter offer
      const counteredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 330,
            quantity: 45,
            terms: 'Initial offer',
          },
          counterOffer: {
            price: 345,
            quantity: 45,
            terms: 'Counter offer terms',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [
            {
              price: 330,
              quantity: 45,
              terms: 'Initial offer',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 345,
              quantity: 45,
              terms: 'Counter offer terms',
              isCounterOffer: true,
              createdAt: new Date().toISOString(),
            },
          ],
          respondedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${counteredNego.id}/accept`)
        .send({
          acceptanceNote: 'Accepting counter offer',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        status: 'ACCEPTED',
        finalPrice: 345, // Counter offer price
        finalQuantity: 45,
        acceptanceNote: 'Accepting counter offer',
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: counteredNego.id } });
    });

    it('should calculate final profit impact', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 350,
            quantity: 60,
            terms: 'High price offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/accept`)
        .send({})
        .expect(200);

      expect(response.body.data).toMatchObject({
        profitImpact: expect.objectContaining({
          finalPurchasePrice: 350,
          finalQuantity: 60,
          totalCost: 21000, // 350 * 60
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          isFinal: true,
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should update trade operation totals when accepting', async () => {
      const freshTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-ACCEPT-TOTALS-001',
          adminId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: 'SELLER_NEGOTIATION',
          status: 'ACTIVE',
          profitMargin: 8,
          sellingPrice: 400,
          totalRevenue: 40000,
          currency: 'EUR',
        },
      });

      const freshTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: freshTrade.id,
          sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
          saleListingId: (await prisma.saleListing.findFirst())!.id,
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: freshTrade.id,
          tradeSellerId: freshTradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 360,
            quantity: 100,
            terms: 'Bulk order',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/accept`)
        .send({})
        .expect(200);

      // Verify trade operation updated
      const updatedTrade = await prisma.tradeOperation.findUnique({
        where: { id: freshTrade.id },
      });
      expect(updatedTrade?.totalPurchaseCost).toBe(36000); // 360 * 100
      expect(updatedTrade?.estimatedProfit).toBe(4000); // 40000 - 36000
      expect(updatedTrade?.actualProfitMargin).toBeCloseTo(10); // (4000/40000) * 100

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
      await prisma.tradeSeller.delete({ where: { id: freshTradeSeller.id } });
      await prisma.tradeOperation.delete({ where: { id: freshTrade.id } });
    });

    it('should not allow accepting already ACCEPTED negotiation', async () => {
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
        .post(`/api/negotiations/${acceptedNego.id}/accept`)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'ALREADY_ACCEPTED',
          message: expect.stringContaining('already accepted'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: acceptedNego.id } });
    });

    it('should not allow accepting REJECTED negotiation', async () => {
      const rejectedNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.REJECTED,
          currentOffer: {
            price: 310,
            quantity: 30,
            terms: 'Rejected offer',
          },
          offerHistory: [],
          concludedAt: new Date(),
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${rejectedNego.id}/accept`)
        .send({})
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

    it('should not allow accepting EXPIRED negotiation', async () => {
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
        .post(`/api/negotiations/${expiredNego.id}/accept`)
        .send({})
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

    it('should trigger notification to seller on acceptance', async () => {
      const freshNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 338,
            quantity: 55,
            terms: 'Notification test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${freshNego.id}/accept`)
        .send({
          acceptanceNote: 'Deal confirmed',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        notification: expect.objectContaining({
          type: 'OFFER_ACCEPTED',
          recipientId: expect.any(String),
          message: expect.stringContaining('accepted'),
          data: expect.objectContaining({
            negotiationId: freshNego.id,
            price: 338,
            quantity: 55,
          }),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: freshNego.id } });
    });

    it('should check if all sellers accepted for phase transition', async () => {
      // Create a trade with multiple sellers
      const multiTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-MULTI-ACCEPT-001',
          adminId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: 'SELLER_NEGOTIATION',
          status: 'ACTIVE',
          profitMargin: 7,
          sellingPrice: 390,
          totalRevenue: 39000,
          currency: 'EUR',
        },
      });

      // Create two trade sellers
      const sellers = await Promise.all([
        prisma.tradeSeller.create({
          data: {
            tradeOperationId: multiTrade.id,
            sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
            saleListingId: (await prisma.saleListing.findFirst())!.id,
            requestedQuantity: 50,
            offeredQuantity: 50,
            unit: 'TON',
            status: 'ACCEPTED', // Already accepted
            agreedPrice: 340,
            agreedQuantity: 50,
          },
        }),
        prisma.tradeSeller.create({
          data: {
            tradeOperationId: multiTrade.id,
            sellerId: (await prisma.user.findFirst({ where: { role: 'FARMER' } }))!.id,
            saleListingId: (await prisma.saleListing.findFirst())!.id,
            requestedQuantity: 50,
            offeredQuantity: 50,
            unit: 'TON',
            status: 'NEGOTIATING',
          },
        }),
      ]);

      // Create negotiation for second seller
      const lastNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: multiTrade.id,
          tradeSellerId: sellers[1].id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 342,
            quantity: 50,
            terms: 'Last seller',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${lastNego.id}/accept`)
        .send({})
        .expect(200);

      expect(response.body.data).toMatchObject({
        phaseTransition: expect.objectContaining({
          allSellersAccepted: true,
          readyForNextPhase: true,
          nextPhase: 'INSPECTION_REQUIRED',
          message: expect.stringContaining('All sellers have accepted'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: lastNego.id } });
      await prisma.tradeSeller.deleteMany({ where: { tradeOperationId: multiTrade.id } });
      await prisma.tradeOperation.delete({ where: { id: multiTrade.id } });
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/negotiations/non-existent-id/accept')
        .send({})
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_NOT_FOUND',
        }),
      });
    });
  });

  describe('Accept Authorization', () => {
    it('should allow seller to accept buyer offer', async () => {
      const buyerOfferNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 345,
            quantity: 40,
            terms: 'Buyer offer to accept',
            offeredBy: 'BUYER',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${buyerOfferNego.id}/accept`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          acceptanceNote: 'Seller accepts buyer offer',
        })
        .expect(200);

      expect(response.body.data.acceptedBy).toBe('SELLER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: buyerOfferNego.id } });
    });

    it('should allow buyer/admin to accept seller counter offer', async () => {
      const sellerCounterNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: (await prisma.tradeSeller.findFirst())!.id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 330,
            quantity: 45,
            terms: 'Initial buyer offer',
            offeredBy: 'BUYER',
          },
          counterOffer: {
            price: 345,
            quantity: 45,
            terms: 'Seller counter to accept',
            offeredBy: 'SELLER',
            receivedAt: new Date().toISOString(),
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/negotiations/${sellerCounterNego.id}/accept`)
        .set('Authorization', 'Bearer admin-token')
        .send({
          acceptanceNote: 'Admin accepts seller counter',
        })
        .expect(200);

      expect(response.body.data.acceptedBy).toBe('BUYER');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: sellerCounterNego.id } });
    });
  });
});