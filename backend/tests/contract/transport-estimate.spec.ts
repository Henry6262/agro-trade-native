import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/transport/estimate-cost - Contract Test', () => {
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

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin-transport@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Transport',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    // Create transport cost settings
    await prisma.transportCostSettings.create({
      data: {
        id: 'default-settings',
        baseRatePerKm: 0.15,
        vehicleMultipliers: {
          FLATBED: 1.0,
          REFRIGERATED: 1.3,
          TANKER: 1.2,
          CONTAINER: 1.1,
          CURTAIN_SIDE: 1.05,
          BOX_TRUCK: 1.0,
        },
        distanceTiers: [
          { minKm: 0, maxKm: 50, ratePerKm: 0.15 },
          { minKm: 50, maxKm: 200, ratePerKm: 0.13 },
          { minKm: 200, maxKm: null, ratePerKm: 0.11 },
        ],
        loadingCostPerTon: 0.5,
        urgencySurcharge: 0.3,
        bulkDiscountThreshold: 100,
        bulkDiscountRate: 0.1,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.transportCostSettings.deleteMany();
    await prisma.user.deleteMany({
      where: { email: 'test-admin-transport@agrotrade.com' },
    });
    await app.close();
  });

  describe('Request/Response Contract', () => {
    it('should estimate transport cost for single pickup', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 100, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          estimation: expect.objectContaining({
            totalDistance: expect.any(Number),
            totalCost: expect.any(Number),
            currency: 'EUR',
            breakdown: expect.objectContaining({
              distanceCost: expect.any(Number),
              loadingCosts: expect.any(Number),
              vehicleMultiplier: 1.0,
              appliedRate: 0.15,
            }),
            route: expect.objectContaining({
              pickupSequence: expect.arrayContaining([
                expect.objectContaining({
                  lat: 42.1,
                  lng: 23.2,
                  quantity: 100,
                  distanceToNext: expect.any(Number),
                }),
              ]),
              deliveryPoint: expect.objectContaining({
                lat: 42.5,
                lng: 23.6,
              }),
            }),
            vehicleInfo: expect.objectContaining({
              type: 'FLATBED',
              requiredCapacity: 100,
              multiplier: 1.0,
            }),
          }),
        }),
      });
    });

    it('should optimize route for multiple pickups', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 40, unit: 'TON' },
            { lat: 42.3, lng: 23.4, quantity: 30, unit: 'TON' },
            { lat: 42.2, lng: 23.5, quantity: 30, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      expect(response.body.data.estimation).toMatchObject({
        route: {
          pickupSequence: expect.any(Array),
          optimizationApplied: true,
          distanceSaved: expect.any(Number),
        },
      });

      // Verify pickup sequence is optimized (not necessarily in input order)
      const sequence = response.body.data.estimation.route.pickupSequence;
      expect(sequence).toHaveLength(3);
    });

    it('should apply distance-based pricing tiers', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.0, lng: 23.0, quantity: 50, unit: 'TON' },
          ],
          deliveryPoint: { lat: 43.5, lng: 24.5 }, // ~240km distance
          vehicleType: 'FLATBED',
        })
        .expect(200);

      expect(response.body.data.estimation.breakdown).toMatchObject({
        distanceTier: expect.objectContaining({
          tier: expect.any(Number),
          rateApplied: expect.any(Number),
        }),
      });
    });

    it('should apply vehicle type multipliers', async () => {
      const baseRequest = {
        pickupPoints: [
          { lat: 42.1, lng: 23.2, quantity: 50, unit: 'TON' },
        ],
        deliveryPoint: { lat: 42.5, lng: 23.6 },
      };

      const flatbedResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({ ...baseRequest, vehicleType: 'FLATBED' })
        .expect(200);

      const refrigeratedResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({ ...baseRequest, vehicleType: 'REFRIGERATED' })
        .expect(200);

      const flatbedCost = flatbedResponse.body.data.estimation.totalCost;
      const refrigeratedCost = refrigeratedResponse.body.data.estimation.totalCost;

      // Refrigerated should be more expensive (1.3x multiplier)
      expect(refrigeratedCost).toBeGreaterThan(flatbedCost);
      expect(refrigeratedResponse.body.data.estimation.vehicleInfo.multiplier).toBe(1.3);
    });

    it('should apply bulk discount for large quantities', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 120, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      expect(response.body.data.estimation).toMatchObject({
        breakdown: {
          bulkDiscount: expect.objectContaining({
            applied: true,
            discountRate: 0.1,
            discountAmount: expect.any(Number),
          }),
        },
      });
    });

    it('should handle express delivery surcharge', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 50, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
          urgency: 'EXPRESS',
        })
        .expect(200);

      expect(response.body.data.estimation.breakdown).toMatchObject({
        urgencySurcharge: expect.objectContaining({
          applied: true,
          surchargeRate: 0.3,
          surchargeAmount: expect.any(Number),
        }),
      });
    });

    it('should calculate loading costs', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 60, unit: 'TON' },
            { lat: 42.3, lng: 23.4, quantity: 40, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      expect(response.body.data.estimation.breakdown.loadingCosts).toBe(50); // 100 tons * 0.5€/ton
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [],
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('required'),
        }),
      });
    });

    it('should validate location coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 200, lng: 300, quantity: 50 }, // Invalid coordinates
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_COORDINATES',
        }),
      });
    });

    it('should support caching for repeated requests', async () => {
      const requestData = {
        pickupPoints: [
          { lat: 42.1, lng: 23.2, quantity: 50, unit: 'TON' },
        ],
        deliveryPoint: { lat: 42.5, lng: 23.6 },
        vehicleType: 'FLATBED',
      };

      const response1 = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send(requestData)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send(requestData)
        .expect(200);

      // Should return same result
      expect(response1.body.data.estimation.totalCost).toBe(
        response2.body.data.estimation.totalCost
      );

      // Second request should be cached
      expect(response2.body.data.estimation.cached).toBe(true);
    });

    it('should provide comparison with alternative routes', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 30, unit: 'TON' },
            { lat: 42.3, lng: 23.4, quantity: 40, unit: 'TON' },
            { lat: 42.2, lng: 23.3, quantity: 30, unit: 'TON' },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
          includeAlternatives: true,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        estimation: expect.any(Object),
        alternatives: expect.arrayContaining([
          expect.objectContaining({
            routeType: expect.any(String),
            totalDistance: expect.any(Number),
            totalCost: expect.any(Number),
            timeDifference: expect.any(Number),
          }),
        ]),
      });
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .send({
          pickupPoints: [{ lat: 42.1, lng: 23.2, quantity: 50 }],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [{ lat: 42.1, lng: 23.2, quantity: 50 }],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);
    });

    it('should allow transporter access', async () => {
      const transporter = await prisma.user.create({
        data: {
          email: 'test-transporter@test.com',
          name: 'Test Transporter',
          role: 'TRANSPORTER',
        },
      });

      await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', 'Bearer transporter-token')
        .send({
          pickupPoints: [{ lat: 42.1, lng: 23.2, quantity: 50 }],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      await prisma.user.delete({ where: { id: transporter.id } });
    });
  });
});