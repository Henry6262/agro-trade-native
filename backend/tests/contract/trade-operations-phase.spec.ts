import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PATCH /api/trade-operations/:id/phase - Contract Test', () => {
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
        email: 'test-admin-phase@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Phase',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test-admin-phase@agrotrade.com' },
    });
    await app.close();
  });

  beforeEach(async () => {
    // Create fresh trade for each test
    const buyer = await prisma.user.create({
      data: {
        email: `test-buyer-${Date.now()}@test.com`,
        name: 'Test Buyer Phase',
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
        operationNumber: `TRADE-PHASE-${Date.now()}`,
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'INITIATION',
        status: 'ACTIVE',
      },
    });
    testTradeId = trade.id;
  });

  afterEach(async () => {
    // Clean up trade and related data
    if (testTradeId) {
      await prisma.tradeStateHistory.deleteMany({
        where: { tradeOperationId: testTradeId },
      });
      await prisma.tradeOperation.delete({
        where: { id: testTradeId },
      });
    }
  });

  describe('Phase Transition Contract', () => {
    it('should transition from INITIATION to SELLER_MATCHING', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'SELLER_MATCHING',
          reason: 'Ready to find sellers',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testTradeId,
          phase: 'SELLER_MATCHING',
          status: 'ACTIVE',
        }),
      });

      // Verify state history created
      const history = await prisma.tradeStateHistory.findFirst({
        where: {
          tradeOperationId: testTradeId,
          toPhase: 'SELLER_MATCHING',
        },
      });
      expect(history).toBeTruthy();
      expect(history?.reason).toBe('Ready to find sellers');
    });

    it('should validate allowed phase transitions', async () => {
      // Try invalid transition: INITIATION -> IN_TRANSIT
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'IN_TRANSIT',
          reason: 'Invalid transition',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_PHASE_TRANSITION',
          message: expect.stringContaining('Cannot transition from INITIATION to IN_TRANSIT'),
        }),
      });
    });

    it('should require sellers before TRANSPORT_MATCHING', async () => {
      // Move to SELLER_MATCHING first
      await prisma.tradeOperation.update({
        where: { id: testTradeId },
        data: { phase: 'SELLER_MATCHING' },
      });

      // Try to move to TRANSPORT_MATCHING without sellers
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'TRANSPORT_MATCHING',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'MISSING_REQUIRED_DATA',
          message: expect.stringContaining('requires confirmed sellers'),
        }),
      });
    });

    it('should allow status change with phase transition', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'CANCELLED',
          toStatus: 'CANCELLED',
          reason: 'Buyer cancelled request',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        phase: 'CANCELLED',
        status: 'CANCELLED',
      });
    });

    it('should validate status constraints by phase', async () => {
      // Move to IN_TRANSIT phase
      await prisma.tradeOperation.update({
        where: { id: testTradeId },
        data: { phase: 'IN_TRANSIT' },
      });

      // Try to set invalid status for IN_TRANSIT
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'IN_TRANSIT',
          toStatus: 'ON_HOLD',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_STATUS_FOR_PHASE',
          message: expect.stringContaining('IN_TRANSIT phase only allows ACTIVE status'),
        }),
      });
    });

    it('should reject phase change for completed trades', async () => {
      await prisma.tradeOperation.update({
        where: { id: testTradeId },
        data: {
          phase: 'COMPLETED',
          status: 'COMPLETED',
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'SELLER_MATCHING',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'TRADE_NOT_MODIFIABLE',
          message: expect.stringContaining('Cannot modify completed trade'),
        }),
      });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .send({ toPhase: 'SELLER_MATCHING' })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', 'Bearer non-admin-token')
        .send({ toPhase: 'SELLER_MATCHING' })
        .expect(403);
    });
  });

  describe('Request Validation', () => {
    it('should require toPhase field', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({})
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('toPhase'),
        }),
      });
    });

    it('should validate phase enum values', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${testTradeId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'INVALID_PHASE',
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