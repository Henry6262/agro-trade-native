import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus } from '@prisma/client';

describe('GET /api/trade-operations/:id/negotiations - List Negotiations Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tradeOperationId: string;
  let negotiationIds: string[] = [];

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
        email: 'test-admin-list@agrotrade.com',
        name: 'Test Admin List',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-list@test.com',
        name: 'Test Buyer List',
        role: 'BUYER',
      },
    });

    // Create multiple sellers
    const sellers = await Promise.all([
      prisma.user.create({
        data: {
          email: 'test-seller1-list@test.com',
          name: 'Test Seller1 List',
          role: 'FARMER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'test-seller2-list@test.com',
          name: 'Test Seller2 List',
          role: 'FARMER',
        },
      }),
      prisma.user.create({
        data: {
          email: 'test-seller3-list@test.com',
          name: 'Test Seller3 List',
          role: 'FARMER',
        },
      }),
    ]);

    const product = await prisma.product.findFirst();
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 200,
        unit: 'TON',
        maxPricePerUnit: 400,
        status: 'ACTIVE',
      },
    });

    // Create sale listings for each seller
    const saleListings = await Promise.all(
      sellers.map((seller, index) =>
        prisma.saleListing.create({
          data: {
            sellerId: seller.id,
            productId: product!.id,
            quantity: 80 + index * 10,
            unit: 'TON',
            askingPrice: 350 + index * 5,
            status: 'ACTIVE',
          },
        })
      )
    );

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-LIST-TEST-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        profitMargin: 7.5,
        sellingPrice: 380,
        totalRevenue: 76000,
        currency: 'EUR',
      },
    });
    tradeOperationId = trade.id;

    // Create trade sellers
    const tradeSellers = await Promise.all(
      sellers.map((seller, index) =>
        prisma.tradeSeller.create({
          data: {
            tradeOperationId: trade.id,
            sellerId: seller.id,
            saleListingId: saleListings[index].id,
            requestedQuantity: 60 + index * 10,
            offeredQuantity: 80 + index * 10,
            unit: 'TON',
            status: index === 0 ? 'ACCEPTED' : index === 1 ? 'NEGOTIATING' : 'INVITED',
          },
        })
      )
    );

    // Create negotiations with different statuses
    const negotiations = await Promise.all([
      // ACCEPTED negotiation
      prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSellers[0].id,
          status: NegotiationStatus.ACCEPTED,
          currentOffer: {
            price: 355,
            quantity: 60,
            terms: 'Agreed terms',
          },
          finalPrice: 355,
          finalQuantity: 60,
          offerHistory: [
            {
              price: 350,
              quantity: 60,
              terms: 'Initial offer',
              createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
            },
            {
              price: 355,
              quantity: 60,
              terms: 'Agreed terms',
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            },
          ],
          respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          concludedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }),
      // COUNTERED negotiation
      prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSellers[1].id,
          status: NegotiationStatus.COUNTERED,
          currentOffer: {
            price: 355,
            quantity: 70,
            terms: 'Standard terms',
          },
          counterOffer: {
            price: 360,
            quantity: 70,
            terms: 'Need higher price for quality',
            receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          },
          offerHistory: [
            {
              price: 355,
              quantity: 70,
              terms: 'Standard terms',
              createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            },
          ],
          respondedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
        },
      }),
      // PENDING negotiation
      prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSellers[2].id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 360,
            quantity: 90,
            terms: 'Awaiting response',
          },
          offerHistory: [
            {
              price: 360,
              quantity: 90,
              terms: 'Awaiting response',
              createdAt: new Date().toISOString(),
            },
          ],
          expiresAt: new Date(Date.now() + 47 * 60 * 60 * 1000),
        },
      }),
    ]);

    negotiationIds = negotiations.map(n => n.id);
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
      where: { 
        seller: { 
          email: { 
            contains: '-list@test.com' 
          } 
        } 
      },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-list@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          contains: '-list@' 
        },
      },
    });
    await app.close();
  });

  describe('List All Negotiations', () => {
    it('should return all negotiations for a trade operation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tradeOperationId: tradeOperationId,
          totalNegotiations: 3,
          negotiations: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              status: 'ACCEPTED',
              tradeSeller: expect.objectContaining({
                seller: expect.objectContaining({
                  name: 'Test Seller1 List',
                }),
              }),
              currentOffer: expect.objectContaining({
                price: 355,
                quantity: 60,
              }),
              finalPrice: 355,
              finalQuantity: 60,
            }),
            expect.objectContaining({
              status: 'COUNTERED',
              counterOffer: expect.objectContaining({
                price: 360,
                quantity: 70,
              }),
            }),
            expect.objectContaining({
              status: 'PENDING',
              currentOffer: expect.objectContaining({
                price: 360,
                quantity: 90,
              }),
            }),
          ]),
          summary: expect.objectContaining({
            pending: 1,
            countered: 1,
            accepted: 1,
            rejected: 0,
            expired: 0,
            withdrawn: 0,
          }),
        },
      });
    });

    it('should filter negotiations by status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?status=PENDING`)
        .expect(200);

      expect(response.body.data.negotiations).toHaveLength(1);
      expect(response.body.data.negotiations[0]).toMatchObject({
        status: 'PENDING',
        currentOffer: expect.objectContaining({
          price: 360,
          quantity: 90,
        }),
      });
    });

    it('should filter multiple statuses', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?status=PENDING,COUNTERED`)
        .expect(200);

      expect(response.body.data.negotiations).toHaveLength(2);
      expect(response.body.data.negotiations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'PENDING' }),
          expect.objectContaining({ status: 'COUNTERED' }),
        ])
      );
    });

    it('should include seller details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations`)
        .expect(200);

      response.body.data.negotiations.forEach(negotiation => {
        expect(negotiation.tradeSeller).toMatchObject({
          id: expect.any(String),
          requestedQuantity: expect.any(Number),
          offeredQuantity: expect.any(Number),
          status: expect.any(String),
          seller: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
          }),
          saleListing: expect.objectContaining({
            id: expect.any(String),
            quantity: expect.any(Number),
            askingPrice: expect.any(Number),
          }),
        });
      });
    });

    it('should calculate time until expiration', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?status=PENDING`)
        .expect(200);

      const pendingNegotiation = response.body.data.negotiations[0];
      expect(pendingNegotiation).toMatchObject({
        expiresAt: expect.any(String),
        hoursUntilExpiry: expect.any(Number),
        isExpiringSoon: expect.any(Boolean), // true if < 12 hours
      });

      // Should have ~47 hours left
      expect(pendingNegotiation.hoursUntilExpiry).toBeGreaterThan(46);
      expect(pendingNegotiation.hoursUntilExpiry).toBeLessThan(48);
      expect(pendingNegotiation.isExpiringSoon).toBe(false);
    });

    it('should include profit impact summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        profitAnalysis: expect.objectContaining({
          totalRequestedQuantity: 220, // 60 + 70 + 90
          totalAgreedQuantity: 60,
          averageOfferPrice: expect.any(Number),
          averageAgreedPrice: 355,
          estimatedTotalCost: expect.any(Number),
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
        }),
      });
    });

    it('should sort negotiations by status priority', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations`)
        .expect(200);

      const statuses = response.body.data.negotiations.map(n => n.status);
      
      // Priority order: COUNTERED > PENDING > ACCEPTED > REJECTED > EXPIRED > WITHDRAWN
      const countered = statuses.indexOf('COUNTERED');
      const pending = statuses.indexOf('PENDING');
      const accepted = statuses.indexOf('ACCEPTED');
      
      expect(countered).toBeLessThan(pending);
      expect(pending).toBeLessThan(accepted);
    });

    it('should paginate results', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?limit=2&offset=0`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        negotiations: expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
        ]),
        pagination: {
          limit: 2,
          offset: 0,
          total: 3,
          hasMore: true,
        },
      });

      // Get next page
      const page2 = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/negotiations?limit=2&offset=2`)
        .expect(200);

      expect(page2.body.data.negotiations).toHaveLength(1);
      expect(page2.body.data.pagination.hasMore).toBe(false);
    });

    it('should return 404 for non-existent trade operation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/trade-operations/non-existent-id/negotiations')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'TRADE_NOT_FOUND',
        }),
      });
    });

    it('should return empty array for trade with no negotiations', async () => {
      // Create a trade with no negotiations
      const emptyTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-EMPTY-001',
          adminId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: 'INITIATION',
          status: 'ACTIVE',
          profitMargin: 5,
          sellingPrice: 350,
          totalRevenue: 35000,
          currency: 'EUR',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${emptyTrade.id}/negotiations`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tradeOperationId: emptyTrade.id,
          totalNegotiations: 0,
          negotiations: [],
          summary: {
            pending: 0,
            countered: 0,
            accepted: 0,
            rejected: 0,
            expired: 0,
            withdrawn: 0,
          },
        },
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: emptyTrade.id } });
    });
  });

  describe('Single Negotiation Details', () => {
    it('should get single negotiation details', async () => {
      const negotiationId = negotiationIds[0]; // ACCEPTED negotiation
      
      const response = await request(app.getHttpServer())
        .get(`/api/negotiations/${negotiationId}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'ACCEPTED',
          currentOffer: expect.objectContaining({
            price: 355,
            quantity: 60,
          }),
          finalPrice: 355,
          finalQuantity: 60,
          offerHistory: expect.arrayContaining([
            expect.objectContaining({
              price: 350,
              quantity: 60,
            }),
            expect.objectContaining({
              price: 355,
              quantity: 60,
            }),
          ]),
          tradeSeller: expect.objectContaining({
            seller: expect.objectContaining({
              name: 'Test Seller1 List',
            }),
          }),
        }),
      });
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/negotiations/non-existent-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_NOT_FOUND',
        }),
      });
    });
  });
});