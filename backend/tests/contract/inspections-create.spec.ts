import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/inspections - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tradeOperationId: string;
  let saleListingId: string;

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
        email: 'test-admin-inspect@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Inspect',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-inspect@test.com',
        name: 'Test Buyer Inspect',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-inspect@test.com',
        name: 'Test Seller Inspect',
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
    saleListingId = saleListing.id;

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-INSPECT-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'INSPECTION_PENDING',
        status: 'ACTIVE',
      },
    });
    tradeOperationId = trade.id;

    // Add seller to trade
    await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        requestedQuantity: 50,
        offeredQuantity: 50,
        unit: 'TON',
        status: 'CONFIRMED',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.inspectionRequest.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-INSPECT-001' },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: 'test-seller-inspect@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-inspect@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ['test-admin-inspect@agrotrade.com', 'test-buyer-inspect@test.com', 'test-seller-inspect@test.com'] },
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should create inspection request for sale listing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
          address: '123 Farm Road, Sofia',
          requestedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Urgent inspection needed for large order',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
          address: '123 Farm Road, Sofia',
          status: 'PENDING',
          requestedDate: expect.any(String),
          saleListing: expect.objectContaining({
            id: saleListingId,
            product: expect.objectContaining({
              name: expect.any(String),
            }),
            seller: expect.objectContaining({
              name: 'Test Seller Inspect',
            }),
          }),
          createdAt: expect.any(String),
        }),
      });
    });

    it('should create inspection without trade operation', async () => {
      // Direct inspection request not linked to trade
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'MEDIUM',
          latitude: 42.6977,
          longitude: 23.3219,
          address: '456 Farm Avenue',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        tradeOperationId: null,
        saleListingId: saleListingId,
        priority: 'MEDIUM',
        status: 'PENDING',
      });

      // Clean up
      await prisma.inspectionRequest.delete({ where: { id: response.body.data.id } });
    });

    it('should validate priority levels', async () => {
      for (const priority of ['LOW', 'MEDIUM', 'HIGH', 'URGENT']) {
        const response = await request(app.getHttpServer())
          .post('/api/inspections')
          .set('Authorization', authToken)
          .send({
            saleListingId: saleListingId,
            priority: priority,
            latitude: 42.6977,
            longitude: 23.3219,
          })
          .expect(201);

        expect(response.body.data.priority).toBe(priority);

        // Clean up
        await prisma.inspectionRequest.delete({ where: { id: response.body.data.id } });
      }
    });

    it('should auto-assign inspector if available', async () => {
      // Create inspector user
      const inspector = await prisma.user.create({
        data: {
          email: 'test-inspector@test.com',
          name: 'Test Inspector',
          role: 'FARMER', // Inspectors might have FARMER role with special permissions
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'URGENT',
          latitude: 42.6977,
          longitude: 23.3219,
          inspectorId: inspector.id,
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        inspectorId: inspector.id,
        inspector: expect.objectContaining({
          id: inspector.id,
          name: 'Test Inspector',
        }),
      });

      // Clean up
      await prisma.inspectionRequest.delete({ where: { id: response.body.data.id } });
      await prisma.user.delete({ where: { id: inspector.id } });
    });

    it('should prevent duplicate active inspections', async () => {
      // Create first inspection
      await prisma.inspectionRequest.create({
        data: {
          saleListingId: saleListingId,
          priority: 'MEDIUM',
          latitude: 42.6977,
          longitude: 23.3219,
          status: 'PENDING',
        },
      });

      // Try to create duplicate
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_INSPECTION',
          message: expect.stringContaining('already has an active inspection'),
        }),
      });

      // Clean up
      await prisma.inspectionRequest.deleteMany({
        where: { saleListingId: saleListingId },
      });
    });

    it('should validate sale listing exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: 'non-existent-listing',
          priority: 'LOW',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'SALE_LISTING_NOT_FOUND',
        }),
      });
    });

    it('should validate coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'MEDIUM',
          latitude: 200, // Invalid latitude
          longitude: 500, // Invalid longitude
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('Invalid coordinates'),
        }),
      });
    });

    it('should validate requested date is future', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'LOW',
          latitude: 42.6977,
          longitude: 23.3219,
          requestedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('must be in the future'),
        }),
      });
    });

    it('should schedule URGENT priority immediately', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'URGENT',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(201);

      // For URGENT, should auto-schedule
      expect(response.body.data.scheduledDate).toBeTruthy();
      
      // Scheduled date should be within 24 hours
      const scheduled = new Date(response.body.data.scheduledDate);
      const now = new Date();
      const hoursDiff = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeLessThanOrEqual(24);

      // Clean up
      await prisma.inspectionRequest.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/inspections')
        .send({
          saleListingId: saleListingId,
          priority: 'MEDIUM',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'MEDIUM',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(201);
    });

    it('should allow trade operation admin', async () => {
      const tradeAdminToken = 'Bearer trade-admin-token';
      
      await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', tradeAdminToken)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(201);
    });
  });

  describe('Request Validation', () => {
    it('should require saleListingId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          priority: 'MEDIUM',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('saleListingId'),
        }),
      });
    });

    it('should require location', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'MEDIUM',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('latitude'),
        }),
      });
    });

    it('should validate priority enum', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          saleListingId: saleListingId,
          priority: 'INVALID_PRIORITY',
          latitude: 42.6977,
          longitude: 23.3219,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });
  });
});