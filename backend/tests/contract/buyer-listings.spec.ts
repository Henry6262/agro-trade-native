import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/buyer/listings/active - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Create test admin user and get auth token
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });

    // Mock auth token (in real app, would login to get token)
    authToken = 'Bearer mock-admin-token';
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'test-admin@agrotrade.com' },
    });
    await app.close();
  });

  describe('Response Contract', () => {
    it('should return active buy listings with correct schema', async () => {
      // Create test data
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer@test.com',
          name: 'Test Buyer',
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
          maxPricePerUnit: 300,
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/buyer/listings/active')
        .set('Authorization', authToken)
        .expect(200);

      // Verify response schema
      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            productId: expect.any(String),
            buyerId: expect.any(String),
            quantity: expect.any(Number),
            unit: expect.stringMatching(/^(TON|KG|LITER|PIECE)$/),
            maxPricePerUnit: expect.any(Number),
            status: 'ACTIVE',
            neededBy: expect.any(String),
            product: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              category: expect.any(String),
            }),
            buyer: expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String),
              email: expect.any(String),
            }),
            hasTradeOperation: expect.any(Boolean),
          }),
        ]),
        pagination: expect.objectContaining({
          total: expect.any(Number),
          page: expect.any(Number),
          limit: expect.any(Number),
          totalPages: expect.any(Number),
        }),
      });

      // Clean up
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should filter out buy listings with existing trade operations', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer2@test.com',
          name: 'Test Buyer 2',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();
      
      // Create buy listing with trade operation
      const buyListingWithTrade = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 50,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

      await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-TEST-001',
          adminId: admin!.id,
          buyListingId: buyListingWithTrade.id,
          phase: 'SELLER_MATCHING',
          status: 'ACTIVE',
        },
      });

      // Create buy listing without trade operation
      const buyListingWithoutTrade = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 75,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .get('/api/buyer/listings/active')
        .set('Authorization', authToken)
        .expect(200);

      // Should only return listing without trade operation
      const listings = response.body.data;
      const listingIds = listings.map((l: any) => l.id);
      
      expect(listingIds).toContain(buyListingWithoutTrade.id);
      expect(listingIds).not.toContain(buyListingWithTrade.id);

      // Clean up
      await prisma.tradeOperation.deleteMany({
        where: { buyListingId: buyListingWithTrade.id },
      });
      await prisma.buyListing.deleteMany({
        where: { buyerId: buyer.id },
      });
      await prisma.user.delete({ where: { id: buyer.id } });
    });

    it('should support pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/buyer/listings/active?page=1&limit=10')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
      });
    });

    it('should support filtering by product', async () => {
      const product = await prisma.product.findFirst();
      
      const response = await request(app.getHttpServer())
        .get(`/api/buyer/listings/active?productId=${product!.id}`)
        .set('Authorization', authToken)
        .expect(200);

      const listings = response.body.data;
      if (listings.length > 0) {
        listings.forEach((listing: any) => {
          expect(listing.productId).toBe(product!.id);
        });
      }
    });

    it('should return 401 for unauthorized requests', async () => {
      await request(app.getHttpServer())
        .get('/api/buyer/listings/active')
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'test-buyer-auth@test.com',
          name: 'Test Buyer Auth',
          role: 'BUYER',
        },
      });

      await request(app.getHttpServer())
        .get('/api/buyer/listings/active')
        .set('Authorization', 'Bearer buyer-token')
        .expect(403);

      await prisma.user.delete({ where: { id: buyer.id } });
    });
  });

  describe('Query Parameters Contract', () => {
    it('should validate query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/buyer/listings/active?page=invalid&limit=abc')
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          message: expect.any(String),
          code: 'VALIDATION_ERROR',
        }),
      });
    });
  });
});