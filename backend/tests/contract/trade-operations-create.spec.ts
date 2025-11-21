import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/trade-operations - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test admin user
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin-create@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Create',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test-admin-create@agrotrade.com' },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should create trade operation from buy listing', async () => {
      // Setup test data
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-trade@test.com',
          name: 'Test Buyer Trade',
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
          maxPricePerUnit: 350,
          status: 'ACTIVE',
          neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({
          buyListingId: buyListing.id,
          notes: 'Test trade operation',
        })
        .expect(201);

      // Verify response schema
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          operationNumber: expect.stringMatching(/^TRADE-\d{4}-\d{2}\d{2}-\d{4}$/),
          adminId: adminId,
          buyListingId: buyListing.id,
          phase: 'INITIATION',
          status: 'ACTIVE',
          currency: 'EUR',
          initiatedAt: expect.any(String),
          metadata: expect.objectContaining({
            notes: 'Test trade operation',
          }),
          buyListing: expect.objectContaining({
            id: buyListing.id,
            productId: product!.id,
            quantity: expect.any(String),
          }),
        }),
      });

      // Verify state history created
      const stateHistory = await prisma.tradeStateHistory.findFirst({
        where: { tradeOperationId: response.body.data.id },
      });
      expect(stateHistory).toBeTruthy();

      // Clean up
      await prisma.tradeStateHistory.deleteMany({
        where: { tradeOperationId: response.body.data.id },
      });
      await prisma.tradeOperation.delete({
        where: { id: response.body.data.id },
      });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should reject duplicate trade operation for same buy listing', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-dup@test.com',
          name: 'Test Buyer Dup',
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
          status: 'ACTIVE',
        },
      });

      // Create first trade operation
      const firstTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-DUP-001',
          adminId: adminId,
          buyListingId: buyListing.id,
          phase: 'SELLER_MATCHING',
          status: 'ACTIVE',
        },
      });

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({
          buyListingId: buyListing.id,
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_TRADE_OPERATION',
          message: expect.stringContaining('already has a trade operation'),
        }),
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: firstTrade.id } });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('buyListingId'),
        }),
      });
    });

    it('should reject non-existent buy listing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({
          buyListingId: 'non-existent-id',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'BUY_LISTING_NOT_FOUND',
        }),
      });
    });

    it('should reject inactive buy listings', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-inactive@test.com',
          name: 'Test Buyer Inactive',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();
      
      const inactiveListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 25,
          unit: 'TON',
          status: 'CANCELLED',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({
          buyListingId: inactiveListing.id,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_BUY_LISTING_STATUS',
          message: expect.stringContaining('not active'),
        }),
      });

      // Clean up
      await prisma.buyListing.delete({ where: { id: inactiveListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should generate unique operation numbers', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-unique@test.com',
          name: 'Test Buyer Unique',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();
      
      const listing1 = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 10,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const listing2 = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 20,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const response1 = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({ buyListingId: listing1.id })
        .expect(201);

      const response2 = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({ buyListingId: listing2.id })
        .expect(201);

      expect(response1.body.data.operationNumber).not.toBe(response2.body.data.operationNumber);

      // Clean up
      await prisma.tradeStateHistory.deleteMany({
        where: {
          tradeOperationId: {
            in: [response1.body.data.id, response2.body.data.id],
          },
        },
      });
      await prisma.tradeOperation.deleteMany({
        where: {
          id: { in: [response1.body.data.id, response2.body.data.id] },
        },
      });
      await prisma.buyListing.deleteMany({ where: { buyerId: buyer.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send({ buyListingId: 'some-id' })
        .expect(401);
    });

    it('should require admin role', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-auth2@test.com',
          name: 'Test Buyer Auth2',
          role: 'BUYER',
        },
      });

      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', 'Bearer buyer-token')
        .send({ buyListingId: 'some-id' })
        .expect(403);

      await prisma.user.delete({ where: { id: buyer.id } });
    });
  });
});