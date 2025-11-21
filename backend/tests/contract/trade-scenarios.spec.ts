import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/trade-operations/:id/price-scenarios - Contract Test', () => {
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
        email: 'test-admin-scenarios@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Scenarios',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    // Create test trade operation with multiple sellers
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-scenarios@test.com',
        name: 'Test Buyer Scenarios',
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
        deliveryAddress: {
          latitude: 42.5,
          longitude: 23.6,
          address: 'Delivery Location',
        },
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-SCENARIOS-001',
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        currency: 'EUR',
      },
    });
    testTradeId = trade.id;

    // Create sellers
    const seller1 = await prisma.user.create({
      data: {
        email: 'test-seller1-scenarios@test.com',
        name: 'Test Seller1 Scenarios',
        role: 'FARMER',
      },
    });

    const seller2 = await prisma.user.create({
      data: {
        email: 'test-seller2-scenarios@test.com',
        name: 'Test Seller2 Scenarios',
        role: 'FARMER',
      },
    });

    await prisma.tradeSeller.createMany({
      data: [
        {
          tradeOperationId: testTradeId,
          sellerId: seller1.id,
          requestedQuantity: 60,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
        {
          tradeOperationId: testTradeId,
          sellerId: seller2.id,
          requestedQuantity: 40,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      ],
    });

    // Create transport cost settings for scenario calculations
    await prisma.transportCostSettings.create({
      data: {
        id: 'scenario-settings',
        baseRatePerKm: 0.15,
        vehicleMultipliers: {},
        distanceTiers: [],
        loadingCostPerTon: 0.5,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.transportCostSettings.deleteMany();
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: testTradeId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-SCENARIOS-001' },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-scenarios@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            'test-admin-scenarios@agrotrade.com',
            'test-buyer-scenarios@test.com',
            'test-seller1-scenarios@test.com',
            'test-seller2-scenarios@test.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should generate price scenarios within specified ranges', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          tradeOperationId: testTradeId,
          scenarios: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              buyerPrice: expect.any(Number),
              sellerPrices: expect.arrayContaining([
                expect.objectContaining({
                  price: expect.any(Number),
                  quantity: expect.any(Number),
                }),
              ]),
              totalRevenue: expect.any(Number),
              totalCost: expect.any(Number),
              transportCost: expect.any(Number),
              estimatedProfit: expect.any(Number),
              profitMargin: expect.any(Number),
              isViable: expect.any(Boolean),
              score: expect.any(Number),
            }),
          ]),
          bestScenario: expect.objectContaining({
            id: expect.any(String),
            estimatedProfit: expect.any(Number),
            profitMargin: expect.any(Number),
            reasoning: expect.any(String),
          }),
          statistics: expect.objectContaining({
            totalScenarios: expect.any(Number),
            viableScenarios: expect.any(Number),
            avgProfit: expect.any(Number),
            maxProfit: expect.any(Number),
            minProfit: expect.any(Number),
            avgMargin: expect.any(Number),
          }),
        }),
      });
    });

    it('should filter scenarios by minimum margin', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 10 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          filters: {
            minMargin: 7.0,
          },
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      scenarios.forEach((scenario: any) => {
        if (scenario.isViable) {
          expect(scenario.profitMargin).toBeGreaterThanOrEqual(7.0);
        }
      });
    });

    it('should rank scenarios by multiple criteria', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 10 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          rankingCriteria: {
            profitWeight: 0.4,
            marginWeight: 0.3,
            buyerAcceptanceWeight: 0.2,
            sellerAcceptanceWeight: 0.1,
          },
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        scenarios: expect.any(Array),
        ranking: expect.objectContaining({
          criteria: expect.objectContaining({
            profitWeight: 0.4,
            marginWeight: 0.3,
            buyerAcceptanceWeight: 0.2,
            sellerAcceptanceWeight: 0.1,
          }),
        }),
      });

      // Verify scenarios are sorted by score
      const scores = response.body.data.scenarios.map((s: any) => s.score);
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);
    });

    it('should calculate acceptance probabilities', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 10 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          includeAcceptanceProbability: true,
        })
        .expect(200);

      expect(response.body.data.scenarios[0]).toMatchObject({
        acceptanceProbability: expect.objectContaining({
          buyer: expect.any(Number),
          sellers: expect.arrayContaining([
            expect.objectContaining({
              sellerId: expect.any(String),
              probability: expect.any(Number),
            }),
          ]),
          overall: expect.any(Number),
        }),
      });
    });

    it('should handle fixed seller prices', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          fixedSellerPrices: [
            { sellerId: 's1', price: 350 },
            { sellerId: 's2', price: 355 },
          ],
        })
        .expect(200);

      // All scenarios should have same seller prices
      response.body.data.scenarios.forEach((scenario: any) => {
        expect(scenario.sellerPrices).toContainEqual(
          expect.objectContaining({ price: 350 })
        );
        expect(scenario.sellerPrices).toContainEqual(
          expect.objectContaining({ price: 355 })
        );
      });
    });

    it('should handle fixed buyer price', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 380,
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(200);

      // All scenarios should have same buyer price
      response.body.data.scenarios.forEach((scenario: any) => {
        expect(scenario.buyerPrice).toBe(380);
      });
    });

    it('should include transport cost variations', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 380, max: 380, step: 1 },
          sellerPriceRange: { min: 350, max: 350, step: 1 },
          transportOptions: [
            { vehicleType: 'FLATBED', urgency: 'NORMAL' },
            { vehicleType: 'REFRIGERATED', urgency: 'NORMAL' },
            { vehicleType: 'FLATBED', urgency: 'EXPRESS' },
          ],
        })
        .expect(200);

      expect(response.body.data.scenarios).toHaveLength(3);
      
      const transportCosts = response.body.data.scenarios.map((s: any) => s.transportCost);
      const uniqueCosts = [...new Set(transportCosts)];
      expect(uniqueCosts.length).toBeGreaterThan(1); // Different transport costs
    });

    it('should generate sensitivity analysis', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 10 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          includeSensitivityAnalysis: true,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        sensitivityAnalysis: expect.objectContaining({
          buyerPriceImpact: expect.objectContaining({
            priceChange: expect.any(Number),
            profitChange: expect.any(Number),
            elasticity: expect.any(Number),
          }),
          sellerPriceImpact: expect.objectContaining({
            priceChange: expect.any(Number),
            profitChange: expect.any(Number),
            elasticity: expect.any(Number),
          }),
          transportCostImpact: expect.objectContaining({
            costChange: expect.any(Number),
            profitChange: expect.any(Number),
          }),
          breakPoints: expect.objectContaining({
            minBuyerPrice: expect.any(Number),
            maxSellerPrice: expect.any(Number),
            maxTransportCost: expect.any(Number),
          }),
        }),
      });
    });

    it('should limit number of scenarios', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 1 }, // 21 prices
          sellerPriceRange: { min: 345, max: 360, step: 1 }, // 16 prices
          maxScenarios: 50,
        })
        .expect(200);

      expect(response.body.data.scenarios.length).toBeLessThanOrEqual(50);
      expect(response.body.data.statistics.totalScenarios).toBeLessThanOrEqual(50);
    });

    it('should provide execution time metrics', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        metrics: expect.objectContaining({
          executionTime: expect.any(Number),
          scenariosPerSecond: expect.any(Number),
        }),
      });
    });

    it('should validate price range parameters', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 390, max: 370, step: 5 }, // Invalid: min > max
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('price range'),
        }),
      });
    });

    it('should validate step size', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 0 }, // Invalid step
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
      });
    });

    it('should cache scenario results', async () => {
      const requestData = {
        buyerPriceRange: { min: 370, max: 380, step: 5 },
        sellerPriceRange: { min: 345, max: 355, step: 5 },
      };

      const response1 = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send(requestData)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send(requestData)
        .expect(200);

      expect(response2.body.data.metrics.cached).toBe(true);
      expect(response2.body.data.metrics.executionTime).toBeLessThan(
        response1.body.data.metrics.executionTime
      );
    });

    it('should export scenarios in different formats', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 380, step: 10 },
          sellerPriceRange: { min: 345, max: 355, step: 10 },
          exportFormat: 'csv',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        scenarios: expect.any(Array),
        export: expect.objectContaining({
          format: 'csv',
          downloadUrl: expect.any(String),
        }),
      });
    });

    it('should return 404 for non-existent trade', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations/non-existent-id/price-scenarios')
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(404);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/price-scenarios`)
        .set('Authorization', 'Bearer buyer-token')
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
        })
        .expect(403);
    });
  });
});