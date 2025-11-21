import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/trade-operations/:id/profit - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminId: string;
  let testTradeId: string;
  let buyListingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin-profit@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Profit',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    // Create test trade operation with profit data
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-profit@test.com',
        name: 'Test Buyer Profit',
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
        maxPricePerUnit: 400,
        status: 'ACTIVE',
      },
    });
    buyListingId = buyListing.id;

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-PROFIT-001',
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        currency: 'EUR',
        // Trading model fields
        sellingPrice: 380,
        totalRevenue: 38000,
        totalPurchaseCost: 35200,
        avgPurchasePrice: 352,
        estimatedTransportCost: 150,
        totalDistanceKm: 100,
        estimatedProfit: 2650,
        profitMargin: 6.97,
      },
    });
    testTradeId = trade.id;
  });

  afterAll(async () => {
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-PROFIT-001' },
    });
    await prisma.buyListing.deleteMany({
      where: { id: buyListingId },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-admin-profit@agrotrade.com', 'test-buyer-profit@test.com'] },
      },
    });
    await app.close();
  });

  describe('Response Contract', () => {
    it('should return profit calculation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          tradeOperationId: testTradeId,
          revenue: expect.objectContaining({
            sellingPrice: 380,
            quantity: 100,
            totalRevenue: 38000,
          }),
          costs: expect.objectContaining({
            purchases: expect.objectContaining({
              totalCost: 35200,
              avgPrice: 352,
              breakdown: expect.any(Array),
            }),
            transport: expect.objectContaining({
              estimatedCost: 150,
              actualCost: null,
              distance: 100,
              ratePerKm: 0.15,
            }),
            totalCosts: 35350,
          }),
          profit: expect.objectContaining({
            grossProfit: 2800,
            netProfit: 2650,
            profitMargin: 6.97,
            currency: 'EUR',
          }),
          status: expect.objectContaining({
            isEstimated: true,
            lastUpdated: expect.any(String),
          }),
        }),
      });
    });

    it('should calculate profit for trade without sellers', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-noseller@test.com',
          name: 'Test Buyer NoSeller',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();
      
      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 50,
          unit: 'TON',
          maxPricePerUnit: 400,
          status: 'ACTIVE',
        },
      });

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-NOSELLER-001',
          adminId: adminId,
          buyListingId: buyListing.id,
          phase: 'INITIATION',
          status: 'ACTIVE',
          currency: 'EUR',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toMatchObject({
        revenue: {
          sellingPrice: null,
          totalRevenue: 0,
        },
        costs: {
          purchases: {
            totalCost: 0,
            breakdown: [],
          },
          transport: {
            estimatedCost: 0,
          },
        },
        profit: {
          grossProfit: 0,
          netProfit: 0,
          profitMargin: 0,
        },
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: trade.id } });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should return actual profit when trade is completed', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-complete@test.com',
          name: 'Test Buyer Complete',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();
      
      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 75,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const completedTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-COMPLETE-001',
          adminId: adminId,
          buyListingId: buyListing.id,
          phase: 'COMPLETED',
          status: 'COMPLETED',
          currency: 'EUR',
          sellingPrice: 390,
          totalRevenue: 29250,
          totalPurchaseCost: 26250,
          actualTransportCost: 175,
          actualProfit: 2825,
          profitMargin: 9.66,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${completedTrade.id}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data).toMatchObject({
        profit: {
          netProfit: 2825,
          profitMargin: 9.66,
        },
        costs: {
          transport: {
            actualCost: 175,
          },
        },
        status: {
          isEstimated: false,
        },
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: completedTrade.id } });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should return 404 for non-existent trade', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/trade-operations/non-existent-id/profit')
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
        .get(`/api/trade-operations/${testTradeId}/profit`)
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}/profit`)
        .set('Authorization', authToken)
        .expect(200);
    });

    it('should deny non-admin users', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-auth-profit@test.com',
          name: 'Test Buyer Auth Profit',
          role: 'BUYER',
        },
      });

      await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}/profit`)
        .set('Authorization', 'Bearer buyer-token')
        .expect(403);

      await prisma.user.delete({ where: { id: buyer.id } });
    });
  });
});