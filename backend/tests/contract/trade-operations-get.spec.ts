import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/trade-operations/:id - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminId: string;
  let testTradeId: string;

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
        email: 'test-admin-get@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Get',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    // Create test trade operation
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-get@test.com',
        name: 'Test Buyer Get',
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
        status: 'ACTIVE',
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-GET-001',
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'SELLER_MATCHING',
        status: 'ACTIVE',
        totalValue: 35000,
        currency: 'EUR',
        metadata: { testData: true },
      },
    });
    testTradeId = trade.id;
  });

  afterAll(async () => {
    // Clean up in reverse order
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-GET-001' },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-get@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-admin-get@agrotrade.com', 'test-buyer-get@test.com'] },
      },
    });
    await app.close();
  });

  describe('Response Contract', () => {
    it('should return complete trade operation details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testTradeId,
          operationNumber: 'TRADE-GET-001',
          adminId: adminId,
          phase: 'SELLER_MATCHING',
          status: 'ACTIVE',
          totalValue: '35000',
          currency: 'EUR',
          metadata: { testData: true },
          buyListing: expect.objectContaining({
            id: expect.any(String),
            quantity: expect.any(String),
            product: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
            }),
            buyer: expect.objectContaining({
              id: expect.any(String),
              name: 'Test Buyer Get',
            }),
          }),
          sellers: expect.any(Array),
          transporters: expect.any(Array),
          negotiations: expect.any(Array),
          inspections: expect.any(Array),
          transportBids: expect.any(Array),
          stateHistory: expect.any(Array),
          notes: expect.any(Array),
        }),
      });
    });

    it('should include related sellers with details', async () => {
      // Add a seller to the trade
      const seller = await prisma.user.create({
        data: {
          email: 'test-seller-rel@test.com',
          name: 'Test Seller Rel',
          role: 'FARMER',
        },
      });

      const product = await prisma.product.findFirst();
      
      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: 80,
          unit: 'TON',
          askingPrice: 320,
          status: 'ACTIVE',
        },
      });

      const tradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: testTradeId,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: 50,
          offeredQuantity: 50,
          unit: 'TON',
          status: 'NEGOTIATING',
          matchScore: 85,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.sellers).toContainEqual(
        expect.objectContaining({
          id: tradeSeller.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: '50',
          offeredQuantity: '50',
          status: 'NEGOTIATING',
          matchScore: 85,
          seller: expect.objectContaining({
            name: 'Test Seller Rel',
          }),
          saleListing: expect.objectContaining({
            quantity: '80',
            askingPrice: '320',
          }),
        })
      );

      // Clean up
      await prisma.tradeSeller.delete({ where: { id: tradeSeller.id } });
      await prisma.saleListing.delete({ where: { id: saleListing.id } });
      await prisma.user.delete({ where: { id: seller.id } });
    });

    it('should return 404 for non-existent trade', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/trade-operations/non-existent-id')
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
        .get(`/api/trade-operations/${testTradeId}`)
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}`)
        .set('Authorization', authToken)
        .expect(200);
    });

    it('should allow involved parties access', async () => {
      // Test that buyer can see their own trade
      const buyerToken = 'Bearer buyer-involved-token';
      
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}`)
        .set('Authorization', buyerToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny non-involved parties', async () => {
      const otherUser = await prisma.user.create({
        data: {
          email: 'test-other@test.com',
          name: 'Test Other',
          role: 'BUYER',
        },
      });

      await request(app.getHttpServer())
        .get(`/api/trade-operations/${testTradeId}`)
        .set('Authorization', 'Bearer other-user-token')
        .expect(403);

      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });
});