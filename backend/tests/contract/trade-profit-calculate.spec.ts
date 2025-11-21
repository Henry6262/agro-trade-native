import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/trade-operations/:id/calculate-profit - Contract Test', () => {
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
        email: 'test-admin-calc@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Calc',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    // Create test trade operation
    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-calc@test.com',
        name: 'Test Buyer Calc',
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
        operationNumber: 'TRADE-CALC-001',
        adminId: adminId,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        currency: 'EUR',
      },
    });
    testTradeId = trade.id;

    // Create sellers for the trade
    const seller1 = await prisma.user.create({
      data: {
        email: 'test-seller1-calc@test.com',
        name: 'Test Seller1 Calc',
        role: 'FARMER',
      },
    });

    const seller2 = await prisma.user.create({
      data: {
        email: 'test-seller2-calc@test.com',
        name: 'Test Seller2 Calc',
        role: 'FARMER',
      },
    });

    await prisma.tradeSeller.create({
      data: {
        tradeOperationId: testTradeId,
        sellerId: seller1.id,
        requestedQuantity: 60,
        unit: 'TON',
        status: 'NEGOTIATING',
        location: {
          latitude: 42.1,
          longitude: 23.2,
          address: 'Farm 1',
        },
      },
    });

    await prisma.tradeSeller.create({
      data: {
        tradeOperationId: testTradeId,
        sellerId: seller2.id,
        requestedQuantity: 40,
        unit: 'TON',
        status: 'NEGOTIATING',
        location: {
          latitude: 42.3,
          longitude: 23.4,
          address: 'Farm 2',
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: testTradeId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: 'TRADE-CALC-001' },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-calc@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-calc@agrotrade.com',
            'test-buyer-calc@test.com',
            'test-seller1-calc@test.com',
            'test-seller2-calc@test.com',
          ],
        },
      },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should calculate profit with proposed prices', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 60 },
            { sellerId: 's2', price: 355, quantity: 40 },
          ],
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          tradeOperationId: testTradeId,
          calculation: expect.objectContaining({
            revenue: expect.objectContaining({
              buyerPrice: 380,
              quantity: 100,
              totalRevenue: 38000,
            }),
            costs: expect.objectContaining({
              purchases: expect.objectContaining({
                sellers: expect.arrayContaining([
                  expect.objectContaining({
                    sellerId: 's1',
                    price: 350,
                    quantity: 60,
                    totalCost: 21000,
                  }),
                  expect.objectContaining({
                    sellerId: 's2',
                    price: 355,
                    quantity: 40,
                    totalCost: 14200,
                  }),
                ]),
                totalPurchaseCost: 35200,
                avgPrice: 352,
              }),
              transport: expect.objectContaining({
                estimatedDistance: expect.any(Number),
                ratePerKm: 0.15,
                estimatedCost: expect.any(Number),
                breakdown: expect.objectContaining({
                  distanceCost: expect.any(Number),
                  loadingCosts: expect.any(Number),
                }),
              }),
              totalCosts: expect.any(Number),
            }),
            profit: expect.objectContaining({
              grossProfit: 2800,
              transportCost: expect.any(Number),
              netProfit: expect.any(Number),
              profitMargin: expect.any(Number),
            }),
            metrics: expect.objectContaining({
              marginPercentage: expect.any(Number),
              profitPerUnit: expect.any(Number),
              breakEvenPrice: expect.any(Number),
            }),
          }),
          isViable: expect.any(Boolean),
          warnings: expect.any(Array),
        }),
      });
    });

    it('should validate minimum profit margin', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 360,
          sellerPrices: [
            { sellerId: 's1', price: 355, quantity: 60 },
            { sellerId: 's2', price: 358, quantity: 40 },
          ],
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        isViable: false,
        warnings: expect.arrayContaining([
          expect.stringContaining('below minimum margin'),
        ]),
      });
    });

    it('should handle bulk discount for large orders', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 340, quantity: 120 },
          ],
          transportOptions: {
            quantity: 120,
            vehicleType: 'FLATBED',
          },
        })
        .expect(200);

      expect(response.body.data.calculation.costs.transport).toMatchObject({
        bulkDiscount: expect.any(Number),
      });
    });

    it('should apply vehicle type multipliers', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 60 },
            { sellerId: 's2', price: 355, quantity: 40 },
          ],
          transportOptions: {
            vehicleType: 'REFRIGERATED',
          },
        })
        .expect(200);

      expect(response.body.data.calculation.costs.transport).toMatchObject({
        vehicleType: 'REFRIGERATED',
        vehicleMultiplier: 1.3,
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('sellerPrices'),
        }),
      });
    });

    it('should validate price ranges', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: -100,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 60 },
          ],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('price'),
        }),
      });
    });

    it('should handle quantity mismatch', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 30 },
            { sellerId: 's2', price: 355, quantity: 40 },
          ],
        })
        .expect(200);

      expect(response.body.data.warnings).toContainEqual(
        expect.stringContaining('quantity mismatch')
      );
    });

    it('should store profit estimation snapshot', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 60 },
            { sellerId: 's2', price: 355, quantity: 40 },
          ],
          saveEstimation: true,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        estimationId: expect.any(String),
      });

      // Verify estimation was saved
      const estimation = await prisma.profitEstimation.findUnique({
        where: { id: response.body.data.estimationId },
      });
      expect(estimation).toBeTruthy();

      // Clean up
      if (estimation) {
        await prisma.profitEstimation.delete({ where: { id: estimation.id } });
      }
    });

    it('should return 404 for non-existent trade', async () => {
      await request(app.getHttpServer())
        .post('/api/trade-operations/non-existent-id/calculate-profit')
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [],
        })
        .expect(404);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .send({
          buyerPrice: 380,
          sellerPrices: [],
        })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${testTradeId}/calculate-profit`)
        .set('Authorization', 'Bearer buyer-token')
        .send({
          buyerPrice: 380,
          sellerPrices: [],
        })
        .expect(403);
    });
  });
});