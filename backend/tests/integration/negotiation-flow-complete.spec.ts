import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus, TradePhase } from '@prisma/client';

describe('Negotiation Flow - End to End Integration Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tradeOperationId: string;
  let adminToken: string = 'Bearer admin-integration-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'INT-E2E' } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'INT-E2E' } } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: { contains: 'INT-E2E' } },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'e2e-test' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: { contains: 'e2e-test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'e2e-test' } },
    });
    await app.close();
  });

  describe('Complete Negotiation Lifecycle', () => {
    let negotiationId: string;
    let tradeSellerId: string;
    let sellerId: string;

    beforeEach(async () => {
      // Setup fresh test data for each test
      const admin = await prisma.user.create({
        data: {
          email: 'admin-e2e-test@agrotrade.com',
          name: 'E2E Test Admin',
          role: 'ADMIN',
        },
      });

      const buyer = await prisma.user.create({
        data: {
          email: 'buyer-e2e-test@test.com',
          name: 'E2E Test Buyer',
          role: 'BUYER',
        },
      });

      const seller = await prisma.user.create({
        data: {
          email: 'seller-e2e-test@test.com',
          name: 'E2E Test Seller',
          role: 'FARMER',
        },
      });
      sellerId = seller.id;

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
          operationNumber: `INT-E2E-${Date.now()}`,
          adminId: admin.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 8,
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
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'INVITED',
        },
      });
      tradeSellerId = tradeSeller.id;
    });

    it('should complete full negotiation flow: offer → counter → accept', async () => {
      // Step 1: Send initial offer
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 330,
          quantity: 100,
          terms: 'Initial offer with standard payment terms',
        })
        .expect(201);

      expect(offerResponse.body.success).toBe(true);
      expect(offerResponse.body.data.status).toBe('PENDING');
      negotiationId = offerResponse.body.data.id;

      // Step 2: Verify negotiation appears in list
      const listResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(listResponse.body.data.negotiations).toHaveLength(1);
      expect(listResponse.body.data.negotiations[0]).toMatchObject({
        id: negotiationId,
        status: 'PENDING',
        currentOffer: {
          price: 330,
          quantity: 100,
        },
      });

      // Step 3: Seller counters the offer
      const counterResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          price: 345,
          quantity: 100,
          terms: 'Need higher price for premium quality product',
          reason: 'Market prices have increased',
        })
        .expect(201);

      expect(counterResponse.body.data).toMatchObject({
        status: 'COUNTERED',
        counterOffer: {
          price: 345,
          quantity: 100,
          terms: 'Need higher price for premium quality product',
        },
      });

      // Step 4: Verify profit impact of counter offer
      expect(counterResponse.body.data.profitImpact).toMatchObject({
        newPurchasePrice: 345,
        previousPurchasePrice: 330,
        priceChange: 15,
        profitMargin: expect.any(Number),
      });
      expect(counterResponse.body.data.profitImpact.profitMargin).toBeLessThan(8);

      // Step 5: Admin accepts the counter offer
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Accepting seller counter offer for quality product',
        })
        .expect(200);

      expect(acceptResponse.body.data).toMatchObject({
        status: 'ACCEPTED',
        finalPrice: 345,
        finalQuantity: 100,
        acceptanceNote: 'Accepting seller counter offer for quality product',
      });

      // Step 6: Verify TradeSeller updated
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller).toMatchObject({
        status: 'ACCEPTED',
        agreedPrice: 345,
        agreedQuantity: 100,
      });

      // Step 7: Verify trade operation profit updated
      const trade = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
      });
      expect(trade?.totalPurchaseCost).toBe(34500); // 345 * 100
      expect(trade?.estimatedProfit).toBe(3500); // 38000 - 34500
      expect(trade?.actualProfitMargin).toBeCloseTo(9.21, 1); // (3500/38000) * 100

      // Step 8: Verify negotiation history
      const finalNegotiation = await prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(finalNegotiation?.offerHistory).toHaveLength(2);
      expect(finalNegotiation?.offerHistory[0]).toMatchObject({
        price: 330,
        quantity: 100,
        terms: 'Initial offer with standard payment terms',
      });
      expect(finalNegotiation?.offerHistory[1]).toMatchObject({
        price: 345,
        quantity: 100,
        terms: 'Need higher price for premium quality product',
        isCounterOffer: true,
      });
    });

    it('should handle rejection flow correctly', async () => {
      // Step 1: Send low offer
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 310, // Very low price
          quantity: 100,
          terms: 'Low budget offer',
        })
        .expect(201);

      negotiationId = offerResponse.body.data.id;

      // Step 2: Seller rejects the offer
      const rejectResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          reason: 'Price far below market value',
        })
        .expect(200);

      expect(rejectResponse.body.data).toMatchObject({
        status: 'REJECTED',
        rejectionReason: 'Price far below market value',
      });

      // Step 3: Verify seller is released
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller?.status).toBe('REJECTED');

      // Step 4: Verify can send new offer to different terms
      const newTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: sellerId,
          saleListingId: (await prisma.saleListing.findFirst({ where: { sellerId } }))!.id,
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      const newOfferResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: newTradeSeller.id,
          price: 340, // Better price
          quantity: 100,
          terms: 'Improved offer',
        })
        .expect(201);

      expect(newOfferResponse.body.success).toBe(true);
    });

    it('should handle withdrawal flow correctly', async () => {
      // Step 1: Send offer
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSellerId,
          price: 335,
          quantity: 100,
          terms: 'Standard offer',
        })
        .expect(201);

      negotiationId = offerResponse.body.data.id;

      // Step 2: Get counter offer
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          price: 355,
          quantity: 100,
          terms: 'Counter with high price',
        })
        .expect(201);

      // Step 3: Admin withdraws due to high counter
      const withdrawResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/withdraw`)
        .set('Authorization', adminToken)
        .send({
          reason: 'Counter offer exceeds acceptable range',
        })
        .expect(200);

      expect(withdrawResponse.body.data).toMatchObject({
        status: 'WITHDRAWN',
        withdrawalReason: 'Counter offer exceeds acceptable range',
      });

      // Step 4: Verify trade seller status
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller?.status).toBe('WITHDRAWN');
    });
  });

  describe('Multiple Negotiations in Parallel', () => {
    it('should handle multiple seller negotiations simultaneously', async () => {
      // Setup: Create trade with 3 sellers
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();

      const sellers = await Promise.all([
        prisma.user.create({
          data: {
            email: 'seller1-e2e-test@test.com',
            name: 'Seller 1',
            role: 'FARMER',
          },
        }),
        prisma.user.create({
          data: {
            email: 'seller2-e2e-test@test.com',
            name: 'Seller 2',
            role: 'FARMER',
          },
        }),
        prisma.user.create({
          data: {
            email: 'seller3-e2e-test@test.com',
            name: 'Seller 3',
            role: 'FARMER',
          },
        }),
      ]);

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 300, // Need 300 tons total
          unit: 'TON',
          maxPricePerUnit: 400,
          status: 'ACTIVE',
        },
      });

      const saleListings = await Promise.all(
        sellers.map((seller, index) =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 100 + index * 20, // 100, 120, 140
              unit: 'TON',
              askingPrice: 340 + index * 5, // 340, 345, 350
              status: 'ACTIVE',
            },
          })
        )
      );

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `INT-E2E-MULTI-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 7,
          sellingPrice: 380,
          totalRevenue: 114000, // 300 * 380
          currency: 'EUR',
        },
      });

      const tradeSellers = await Promise.all(
        sellers.map((seller, index) =>
          prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: seller.id,
              saleListingId: saleListings[index].id,
              requestedQuantity: 100,
              offeredQuantity: 100 + index * 20,
              unit: 'TON',
              status: 'INVITED',
            },
          })
        )
      );

      // Step 1: Send offers to all sellers in batch
      const batchResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers/batch`)
        .set('Authorization', adminToken)
        .send({
          offers: tradeSellers.map((ts, index) => ({
            tradeSellerId: ts.id,
            price: 335 + index * 5, // 335, 340, 345
            quantity: 100,
            terms: `Offer to seller ${index + 1}`,
          })),
        })
        .expect(201);

      expect(batchResponse.body.data).toMatchObject({
        created: 3,
        failed: 0,
        negotiations: expect.arrayContaining([
          expect.objectContaining({ status: 'PENDING' }),
          expect.objectContaining({ status: 'PENDING' }),
          expect.objectContaining({ status: 'PENDING' }),
        ]),
      });

      const negotiationIds = batchResponse.body.data.negotiations.map(n => n.id);

      // Step 2: Each seller responds differently
      // Seller 1 accepts
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[0]}/accept`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          acceptanceNote: 'Seller 1 accepts',
        })
        .expect(200);

      // Seller 2 counters
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[1]}/counter`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          price: 348,
          quantity: 100,
          terms: 'Seller 2 wants more',
        })
        .expect(201);

      // Seller 3 rejects
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[2]}/reject`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          reason: 'Seller 3 not interested',
        })
        .expect(200);

      // Step 3: Check overall negotiation status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/negotiations`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(statusResponse.body.data.summary).toMatchObject({
        accepted: 1,
        countered: 1,
        rejected: 1,
        pending: 0,
      });

      // Step 4: Accept counter from seller 2
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationIds[1]}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Accepting seller 2 counter',
        })
        .expect(200);

      // Step 5: Find replacement for seller 3
      const newSeller = await prisma.user.create({
        data: {
          email: 'seller4-e2e-test@test.com',
          name: 'Replacement Seller',
          role: 'FARMER',
        },
      });

      const newListing = await prisma.saleListing.create({
        data: {
          sellerId: newSeller.id,
          productId: product!.id,
          quantity: 100,
          unit: 'TON',
          askingPrice: 342,
          status: 'ACTIVE',
        },
      });

      const newTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: newSeller.id,
          saleListingId: newListing.id,
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      const replacementOffer = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: newTradeSeller.id,
          price: 342,
          quantity: 100,
          terms: 'Replacement seller offer',
        })
        .expect(201);

      const replacementId = replacementOffer.body.data.id;

      await request(app.getHttpServer())
        .post(`/api/negotiations/${replacementId}/accept`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          acceptanceNote: 'Replacement seller accepts',
        })
        .expect(200);

      // Step 6: Verify all sellers accepted
      const finalStatus = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/negotiations`)
        .set('Authorization', adminToken)
        .expect(200);

      const acceptedCount = finalStatus.body.data.negotiations.filter(
        n => n.status === 'ACCEPTED'
      ).length;
      expect(acceptedCount).toBe(3);

      // Step 7: Check phase transition readiness
      expect(finalStatus.body.data.phaseTransition).toMatchObject({
        allSellersAccepted: true,
        readyForNextPhase: true,
        nextPhase: 'INSPECTION_REQUIRED',
      });

      // Step 8: Verify total purchase cost
      const finalTrade = await prisma.tradeOperation.findUnique({
        where: { id: trade.id },
      });
      const expectedCost = 335 * 100 + 348 * 100 + 342 * 100; // 102500
      expect(finalTrade?.totalPurchaseCost).toBe(expectedCost);
      expect(finalTrade?.estimatedProfit).toBe(114000 - expectedCost); // 11500
    });
  });
});