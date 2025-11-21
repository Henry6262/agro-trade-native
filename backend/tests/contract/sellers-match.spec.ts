import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/sellers/match/:buyListingId - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let buyListingId: string;
  let productId: string;

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
        email: 'test-admin-match@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Match',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    // Create test buyer and listing
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-match@test.com',
        name: 'Test Buyer Match',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    productId = product!.id;
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: productId,
        quantity: 100,
        unit: 'TON',
        maxPricePerUnit: 350,
        status: 'ACTIVE',
        neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    buyListingId = buyListing.id;

    // Create test sellers with various match qualities
    const sellers = [];
    for (let i = 0; i < 5; i++) {
      const seller = await prisma.user.create({
        data: {
          email: `test-seller-${i}@test.com`,
          name: `Test Seller ${i}`,
          role: 'FARMER',
        },
      });
      sellers.push(seller);

      // Create sale listings with varying qualities
      await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: productId,
          quantity: 50 + i * 10,
          unit: 'TON',
          askingPrice: 300 + i * 20,
          status: 'ACTIVE',
          qualityScore: 95 - i * 5,
          harvestDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  });

  afterAll(async () => {
    // Clean up
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'test-seller-' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-match@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-seller-' } },
          { email: 'test-buyer-match@test.com' },
          { email: 'test-admin-match@agrotrade.com' },
        ],
      },
    });
    await app.close();
  });

  describe('Response Contract', () => {
    it('should return matched sellers with scoring', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          buyListing: expect.objectContaining({
            id: buyListingId,
            productId: productId,
            quantity: '100',
            maxPricePerUnit: '350',
          }),
          matches: expect.arrayContaining([
            expect.objectContaining({
              saleListingId: expect.any(String),
              sellerId: expect.any(String),
              matchScore: expect.any(Number),
              distance: expect.any(Number),
              priceMatch: expect.any(Number),
              quantityMatch: expect.any(Number),
              qualityMatch: expect.any(Number),
              verificationStatus: expect.stringMatching(/^(VERIFIED|PARTIAL|UNVERIFIED)$/),
              seller: expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
              }),
              saleListing: expect.objectContaining({
                quantity: expect.any(String),
                askingPrice: expect.any(String),
                qualityScore: expect.any(Number),
              }),
            }),
          ]),
          filters: expect.objectContaining({
            radius: expect.any(Number),
            minScore: expect.any(Number),
          }),
        }),
      });
    });

    it('should sort matches by score descending', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .set('Authorization', authToken)
        .expect(200);

      const matches = response.body.data.matches;
      for (let i = 1; i < matches.length; i++) {
        expect(matches[i - 1].matchScore).toBeGreaterThanOrEqual(matches[i].matchScore);
      }
    });

    it('should apply radius filter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?radius=50`)
        .set('Authorization', authToken)
        .expect(200);

      const matches = response.body.data.matches;
      matches.forEach((match: any) => {
        expect(match.distance).toBeLessThanOrEqual(50);
      });
    });

    it('should apply minimum score filter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?minScore=70`)
        .set('Authorization', authToken)
        .expect(200);

      const matches = response.body.data.matches;
      matches.forEach((match: any) => {
        expect(match.matchScore).toBeGreaterThanOrEqual(70);
      });
    });

    it('should filter by verification status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?verificationStatus=VERIFIED`)
        .set('Authorization', authToken)
        .expect(200);

      const matches = response.body.data.matches;
      matches.forEach((match: any) => {
        expect(match.verificationStatus).toBe('VERIFIED');
      });
    });

    it('should limit results', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?limit=3`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.matches.length).toBeLessThanOrEqual(3);
    });

    it('should calculate score components correctly', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .set('Authorization', authToken)
        .expect(200);

      const match = response.body.data.matches[0];
      
      // Verify score calculation (40% distance, 30% verification, 20% price, 10% quantity)
      const expectedScore = Math.round(
        match.distance * 0.4 +
        (match.verificationStatus === 'VERIFIED' ? 100 : match.verificationStatus === 'PARTIAL' ? 50 : 0) * 0.3 +
        match.priceMatch * 0.2 +
        match.quantityMatch * 0.1
      );
      
      expect(Math.abs(match.matchScore - expectedScore)).toBeLessThanOrEqual(5); // Allow small rounding difference
    });

    it('should return 404 for non-existent buy listing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/sellers/match/non-existent-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'BUY_LISTING_NOT_FOUND',
        }),
      });
    });

    it('should return empty matches for non-matching product', async () => {
      // Create buy listing for product with no sellers
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const differentProduct = await prisma.product.findFirst({
        where: { id: { not: productId } },
      });

      const noMatchListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: differentProduct!.id,
          quantity: 50,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${noMatchListing.id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.matches).toEqual([]);

      await prisma.buyListing.delete({ where: { id: noMatchListing.id } });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .set('Authorization', authToken)
        .expect(200);
    });
  });

  describe('Query Validation', () => {
    it('should validate radius parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?radius=invalid`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should validate minScore range', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}?minScore=150`)
        .set('Authorization', authToken)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('minScore must be between 0 and 100'),
        }),
      });
    });
  });
});