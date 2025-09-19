import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@prisma/client';

describe('TradeOperationController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  // Mock JWT token for admin user
  const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwNDAwMDAwMH0.mock-signature';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        // Mock Prisma methods
        tradeOperation: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        buyListing: {
          findUnique: jest.fn(),
        },
        saleListing: {
          findMany: jest.fn(),
        },
        tradeSeller: {
          create: jest.fn(),
          findMany: jest.fn(),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    authToken = `Bearer ${mockAdminToken}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/trade-operations (POST)', () => {
    it('should create a new trade operation', async () => {
      const createDto = {
        buyListingId: 'buy-listing-123',
        targetProfitMargin: 7.5,
      };

      const mockBuyListing = {
        id: 'buy-listing-123',
        buyerId: 'buyer-456',
        product: 'Wheat',
        variety: 'Grade A',
        quantity: 100,
        unit: 'tons',
        maxPricePerUnit: 380,
        location: { city: 'Sofia' },
      };

      const mockTradeOperation = {
        id: 'trade-op-789',
        buyListingId: 'buy-listing-123',
        status: 'PENDING',
        targetProfitMargin: 7.5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.buyListing.findUnique as jest.Mock).mockResolvedValue(mockBuyListing);
      (prisma.tradeOperation.create as jest.Mock).mockResolvedValue(mockTradeOperation);

      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.targetProfitMargin).toBe(7.5);
      expect(response.body.status).toBe('PENDING');
    });

    it('should fail without authentication', async () => {
      const createDto = {
        buyListingId: 'buy-listing-123',
      };

      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .send(createDto)
        .expect(401);
    });

    it('should validate profit margin range', async () => {
      const createDto = {
        buyListingId: 'buy-listing-123',
        targetProfitMargin: 25, // Too high
      };

      await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send(createDto)
        .expect(400);
    });
  });

  describe('/api/trade-operations/:id/find-sellers (GET)', () => {
    it('should find matching sellers for trade operation', async () => {
      const tradeOpId = 'trade-op-789';
      const mockSellers = [
        {
          id: 'seller-1',
          sellerId: 'user-seller-1',
          product: 'Wheat',
          variety: 'Grade A',
          quantity: 50,
          askingPrice: 350,
          location: { city: 'Plovdiv' },
        },
        {
          id: 'seller-2',
          sellerId: 'user-seller-2',
          product: 'Wheat',
          variety: 'Grade A',
          quantity: 60,
          askingPrice: 345,
          location: { city: 'Burgas' },
        },
      ];

      (prisma.tradeOperation.findUnique as jest.Mock).mockResolvedValue({
        id: tradeOpId,
        buyListing: {
          product: 'Wheat',
          variety: 'Grade A',
          quantity: 100,
        },
      });
      (prisma.saleListing.findMany as jest.Mock).mockResolvedValue(mockSellers);

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOpId}/find-sellers`)
        .set('Authorization', authToken)
        .query({ maxDistance: 100 })
        .expect(200);

      expect(response.body).toHaveProperty('sellers');
      expect(response.body.sellers).toHaveLength(2);
      expect(response.body).toHaveProperty('totalQuantityAvailable');
      expect(response.body).toHaveProperty('averagePrice');
    });
  });

  describe('/api/trade-operations/:id/select-sellers (POST)', () => {
    it('should select sellers for trade operation', async () => {
      const tradeOpId = 'trade-op-789';
      const selectDto = {
        sellers: [
          { sellerId: 'user-seller-1', requestedQuantity: 50 },
          { sellerId: 'user-seller-2', requestedQuantity: 50 },
        ],
      };

      const mockTradeSellers = selectDto.sellers.map((s, i) => ({
        id: `trade-seller-${i}`,
        tradeOperationId: tradeOpId,
        sellerId: s.sellerId,
        requestedQuantity: s.requestedQuantity,
        status: 'PENDING',
      }));

      (prisma.tradeSeller.create as jest.Mock).mockImplementation((args) => 
        Promise.resolve(mockTradeSellers[0])
      );

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOpId}/select-sellers`)
        .set('Authorization', authToken)
        .send(selectDto)
        .expect(201);

      expect(response.body).toHaveProperty('selectedSellers');
      expect(response.body).toHaveProperty('totalQuantity', 100);
    });
  });

  describe('/api/trade-operations/:id/optimize-transport (POST)', () => {
    it('should optimize transport for trade operation', async () => {
      const tradeOpId = 'trade-op-789';

      const mockTradeOp = {
        id: tradeOpId,
        buyListing: {
          location: { lat: 42.6977, lng: 23.3219 },
        },
        sellers: [
          {
            seller: { location: { lat: 42.1354, lng: 24.7453 } },
            requestedQuantity: 50,
          },
        ],
      };

      (prisma.tradeOperation.findUnique as jest.Mock).mockResolvedValue(mockTradeOp);

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOpId}/optimize-transport`)
        .set('Authorization', authToken)
        .send({ algorithm: 'TSP_NEAREST' })
        .expect(201);

      expect(response.body).toHaveProperty('route');
      expect(response.body).toHaveProperty('totalDistance');
      expect(response.body).toHaveProperty('estimatedCost');
      expect(response.body).toHaveProperty('estimatedDuration');
    });
  });

  describe('/api/trade-operations (GET)', () => {
    it('should list all trade operations', async () => {
      const mockOperations = [
        {
          id: 'trade-op-1',
          status: 'PENDING',
          estimatedProfit: 2500,
          profitMargin: 6.5,
        },
        {
          id: 'trade-op-2',
          status: 'COMPLETED',
          estimatedProfit: 3200,
          profitMargin: 8.2,
        },
      ];

      (prisma.tradeOperation.findMany as jest.Mock).mockResolvedValue(mockOperations);

      const response = await request(app.getHttpServer())
        .get('/api/trade-operations')
        .set('Authorization', authToken)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});