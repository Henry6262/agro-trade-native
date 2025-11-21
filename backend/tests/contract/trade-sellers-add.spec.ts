import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/trade-operations/:id/sellers - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let adminId: string;
  let tradeOperationId: string;
  let saleListingIds: string[] = [];

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
        email: 'test-admin-sellers@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Sellers',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    // Create buyer and trade operation
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-sellers@test.com',
        name: 'Test Buyer Sellers',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 150,
        unit: 'TON',
        status: 'ACTIVE',
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-SELLERS-001',
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'SELLER_MATCHING',
        status: 'ACTIVE',
      },
    });
    tradeOperationId = trade.id;

    // Create sellers and sale listings
    for (let i = 0; i < 3; i++) {
      const seller = await prisma.user.create({
        data: {
          email: `test-seller-add-${i}@test.com`,
          name: `Test Seller Add ${i}`,
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: 60,
          unit: 'TON',
          askingPrice: 320,
          status: 'ACTIVE',
        },
      });
      saleListingIds.push(saleListing.id);
    }
  });

  afterAll(async () => {
    // Clean up
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-SELLERS-001' },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'test-seller-add-' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-sellers@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test-seller-add-' } },
          { email: 'test-buyer-sellers@test.com' },
          { email: 'test-admin-sellers@agrotrade.com' },
        ],
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should add single seller to trade operation', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[0],
              requestedQuantity: 50,
              notes: 'Good quality match',
            },
          ],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          added: expect.arrayContaining([
            expect.objectContaining({
              tradeOperationId: tradeOperationId,
              saleListingId: saleListingIds[0],
              requestedQuantity: '50',
              status: 'INVITED',
              saleListing: expect.objectContaining({
                id: saleListingIds[0],
              }),
            }),
          ]),
          failed: [],
        }),
      });
    });

    it('should add multiple sellers to trade operation', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[1],
              requestedQuantity: 40,
            },
            {
              saleListingId: saleListingIds[2],
              requestedQuantity: 35,
            },
          ],
        })
        .expect(201);

      expect(response.body.data.added).toHaveLength(2);
      expect(response.body.data.failed).toHaveLength(0);
    });

    it('should prevent duplicate seller additions', async () => {
      // First add
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [{ saleListingId: saleListingIds[0], requestedQuantity: 30 }],
        });

      // Try duplicate
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [{ saleListingId: saleListingIds[0], requestedQuantity: 30 }],
        })
        .expect(200);

      expect(response.body.data.added).toHaveLength(0);
      expect(response.body.data.failed).toContainEqual(
        expect.objectContaining({
          saleListingId: saleListingIds[0],
          reason: expect.stringContaining('already added'),
        })
      );
    });

    it('should validate phase requirements', async () => {
      // Create trade in wrong phase
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();
      
      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 20,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const wrongPhaseTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-WRONG-PHASE',
          adminId: adminId,
          buyListingId: buyListing.id,
          phase: 'IN_TRANSIT',
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${wrongPhaseTrade.id}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [{ saleListingId: saleListingIds[0], requestedQuantity: 10 }],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TRADE_PHASE',
          message: expect.stringContaining('Cannot add sellers in IN_TRANSIT phase'),
        }),
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: wrongPhaseTrade.id } });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
    });

    it('should validate sale listing exists', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: 'non-existent-listing',
              requestedQuantity: 10,
            },
          ],
        })
        .expect(200);

      expect(response.body.data.added).toHaveLength(0);
      expect(response.body.data.failed).toContainEqual(
        expect.objectContaining({
          saleListingId: 'non-existent-listing',
          reason: expect.stringContaining('not found'),
        })
      );
    });

    it('should validate quantity limits', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[0],
              requestedQuantity: 1000, // More than available
            },
          ],
        })
        .expect(200);

      expect(response.body.data.failed).toContainEqual(
        expect.objectContaining({
          saleListingId: saleListingIds[0],
          reason: expect.stringContaining('exceeds available quantity'),
        })
      );
    });

    it('should calculate match score', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[0],
              requestedQuantity: 25,
            },
          ],
        })
        .expect(201);

      const addedSeller = response.body.data.added[0];
      expect(addedSeller.matchScore).toBeGreaterThanOrEqual(0);
      expect(addedSeller.matchScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .send({
          sellers: [{ saleListingId: saleListingIds[0], requestedQuantity: 10 }],
        })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', 'Bearer non-admin-token')
        .send({
          sellers: [{ saleListingId: saleListingIds[0], requestedQuantity: 10 }],
        })
        .expect(403);
    });
  });

  describe('Request Validation', () => {
    it('should require sellers array', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('sellers'),
        }),
      });
    });

    it('should validate seller object structure', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              // Missing saleListingId
              requestedQuantity: 10,
            },
          ],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should validate positive quantities', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[0],
              requestedQuantity: -10,
            },
          ],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('positive'),
        }),
      });
    });
  });
});