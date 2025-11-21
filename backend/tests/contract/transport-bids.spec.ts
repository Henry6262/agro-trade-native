import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/transport-bids - Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let transporterToken: string;
  let tradeOperationId: string;
  let transporterId: string;

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
        email: 'test-admin-bids@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Bids',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const transporter = await prisma.user.create({
      data: {
        email: 'test-transporter@test.com',
        name: 'Test Transporter',
        role: 'TRANSPORTER',
        phoneNumber: '+359888123456',
      },
    });
    transporterId = transporter.id;
    transporterToken = 'Bearer mock-transporter-token';

    // Create truck for transporter
    await prisma.truck.create({
      data: {
        ownerId: transporter.id,
        plateNumber: 'CA1234AB',
        capacity: 25,
        unit: 'TON',
        type: 'FLATBED',
        isAvailable: true,
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-bids@test.com',
        name: 'Test Buyer Bids',
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
        operationNumber: 'TRADE-BIDS-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'TRANSPORT_BIDDING',
        status: 'ACTIVE',
        totalValue: 35000,
      },
    });
    tradeOperationId = trade.id;

    // Add confirmed seller to trade
    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-bids@test.com',
        name: 'Test Seller Bids',
        role: 'FARMER',
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

    await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        requestedQuantity: 100,
        offeredQuantity: 100,
        agreedQuantity: 100,
        unit: 'TON',
        agreedPrice: 350,
        status: 'CONFIRMED',
      },
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.transportBid.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-BIDS-001' },
    });
    await prisma.truck.deleteMany({
      where: { ownerId: transporterId },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: 'test-seller-bids@test.com' } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-bids@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: ['test-admin-bids@agrotrade.com', 'test-transporter@test.com', 
               'test-buyer-bids@test.com', 'test-seller-bids@test.com'] 
        },
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should create transport bid for trade operation', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          specialEquipment: ['GPS Tracking', 'Temperature Monitor'],
          insuranceCoverage: 50000,
          proposedRoute: {
            type: 'LineString',
            coordinates: [[23.3219, 42.6977], [23.3500, 42.7000]],
          },
          validityHours: 48,
          notes: 'Express delivery available',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
          bidAmount: '2500',
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          specialEquipment: ['GPS Tracking', 'Temperature Monitor'],
          insuranceCoverage: '50000',
          status: 'PENDING',
          transporter: expect.objectContaining({
            id: transporterId,
            name: 'Test Transporter',
          }),
          tradeOperation: expect.objectContaining({
            id: tradeOperationId,
            operationNumber: 'TRADE-BIDS-001',
          }),
          submittedAt: expect.any(String),
          expiresAt: expect.any(String),
        }),
      });

      // Verify expiration is set correctly (48 hours from now)
      const bid = response.body.data;
      const expiresAt = new Date(bid.expiresAt);
      const submittedAt = new Date(bid.submittedAt);
      const hoursDiff = (expiresAt.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(48, 0);
    });

    it('should prevent duplicate bids from same transporter', async () => {
      // Create first bid
      await prisma.transportBid.create({
        data: {
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
          bidAmount: 2300,
          estimatedDuration: 20,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Try duplicate
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2200,
          estimatedDuration: 18,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
        })
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'DUPLICATE_BID',
          message: expect.stringContaining('already submitted a bid'),
        }),
      });

      // Clean up
      await prisma.transportBid.deleteMany({
        where: { 
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
        },
      });
    });

    it('should validate trade operation phase', async () => {
      // Create trade in wrong phase
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();
      
      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 50,
          unit: 'TON',
          status: 'ACTIVE',
        },
      });

      const wrongPhaseTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-WRONG-BID',
          adminId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          buyListingId: buyListing.id,
          phase: 'SELLER_MATCHING',
          status: 'ACTIVE',
        },
      });

      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: wrongPhaseTrade.id,
          bidAmount: 2000,
          estimatedDuration: 20,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TRADE_PHASE',
          message: expect.stringContaining('not in bidding phase'),
        }),
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: wrongPhaseTrade.id } });
      await prisma.buyListing.delete({ where: { id: buyListing.id } });
    });

    it('should validate vehicle capacity', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 3000,
          estimatedDuration: 30,
          vehicleType: 'FLATBED',
          vehicleCapacity: 10, // Less than required 100 tons
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INSUFFICIENT_CAPACITY',
          message: expect.stringContaining('Vehicle capacity insufficient'),
        }),
      });
    });

    it('should validate bid amount', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: -500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
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

    it('should validate estimated duration', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 0,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('duration must be at least 1 hour'),
        }),
      });
    });

    it('should validate vehicle type enum', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'INVALID_TYPE',
          vehicleCapacity: 120,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should allow bid updates before expiration', async () => {
      // Create initial bid
      const bid = await prisma.transportBid.create({
        data: {
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
          bidAmount: 2800,
          estimatedDuration: 26,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Update bid
      const response = await request(app.getHttpServer())
        .patch(`/api/transport-bids/${bid.id}`)
        .set('Authorization', transporterToken)
        .send({
          bidAmount: 2600,
          estimatedDuration: 22,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        id: bid.id,
        bidAmount: '2600',
        estimatedDuration: 22,
      });

      // Clean up
      await prisma.transportBid.delete({ where: { id: bid.id } });
    });

    it('should allow bid withdrawal', async () => {
      // Create bid
      const bid = await prisma.transportBid.create({
        data: {
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
          bidAmount: 2700,
          estimatedDuration: 25,
          vehicleType: 'FLATBED',
          vehicleCapacity: 25,
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Withdraw bid
      const response = await request(app.getHttpServer())
        .delete(`/api/transport-bids/${bid.id}`)
        .set('Authorization', transporterToken)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: bid.id,
          status: 'WITHDRAWN',
        }),
      });

      // Verify in database
      const withdrawnBid = await prisma.transportBid.findUnique({
        where: { id: bid.id },
      });
      expect(withdrawnBid?.status).toBe('WITHDRAWN');

      // Clean up
      await prisma.transportBid.delete({ where: { id: bid.id } });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/transport-bids')
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
        })
        .expect(401);
    });

    it('should require transporter role', async () => {
      const buyerToken = 'Bearer buyer-token';
      
      await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', buyerToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
        })
        .expect(403);
    });

    it('should allow transporters to bid', async () => {
      await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2400,
          estimatedDuration: 23,
          vehicleType: 'CURTAIN_SIDE',
          vehicleCapacity: 110,
        })
        .expect(201);
    });
  });

  describe('Request Validation', () => {
    it('should require tradeOperationId', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 120,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('tradeOperationId'),
        }),
      });
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', transporterToken)
        .send({
          tradeOperationId: tradeOperationId,
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