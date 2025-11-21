import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('GET /api/transport/optimize-route - Contract Test', () => {
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
        email: 'test-admin-route@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Test Admin Route',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: 'test-admin-route@agrotrade.com' },
    });
    await app.close();
  });

  describe('Response Contract', () => {
    it('should optimize route for multiple pickup points', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
            { id: 'p3', lat: 42.2, lng: 23.1, quantity: 30 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          optimizedRoute: expect.objectContaining({
            sequence: expect.arrayContaining([
              expect.objectContaining({
                type: 'warehouse',
                location: { lat: 42.0, lng: 23.0 },
              }),
              expect.objectContaining({
                type: 'pickup',
                id: expect.any(String),
                location: expect.objectContaining({
                  lat: expect.any(Number),
                  lng: expect.any(Number),
                }),
                quantity: expect.any(Number),
                distanceFromPrevious: expect.any(Number),
                cumulativeDistance: expect.any(Number),
              }),
              expect.objectContaining({
                type: 'delivery',
                location: { lat: 42.5, lng: 23.6 },
                distanceFromPrevious: expect.any(Number),
                cumulativeDistance: expect.any(Number),
              }),
            ]),
            totalDistance: expect.any(Number),
            totalDuration: expect.any(Number),
            algorithm: expect.stringMatching(/^(nearest_neighbor|tsp_2opt|genetic)$/),
          }),
          comparison: expect.objectContaining({
            originalDistance: expect.any(Number),
            optimizedDistance: expect.any(Number),
            distanceSaved: expect.any(Number),
            percentageSaved: expect.any(Number),
          }),
          metrics: expect.objectContaining({
            computationTime: expect.any(Number),
            numberOfPermutations: expect.any(Number),
            optimizationLevel: expect.any(String),
          }),
        }),
      });
    });

    it('should handle single pickup point', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 100 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(200);

      expect(response.body.data.optimizedRoute.sequence).toHaveLength(3); // warehouse -> pickup -> delivery
      expect(response.body.data.comparison.distanceSaved).toBe(0); // No optimization possible
    });

    it('should support constraints on route optimization', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30, priority: 'HIGH' },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
            { id: 'p3', lat: 42.2, lng: 23.1, quantity: 30 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          constraints: JSON.stringify({
            maxDistance: 200,
            maxDuration: 240,
            priorityPickupsFirst: true,
          }),
        })
        .expect(200);

      // Verify high priority pickup is first
      const pickupSequence = response.body.data.optimizedRoute.sequence.filter(
        (s: any) => s.type === 'pickup'
      );
      expect(pickupSequence[0].id).toBe('p1');
    });

    it('should provide alternative routes', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
            { id: 'p3', lat: 42.2, lng: 23.1, quantity: 30 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          includeAlternatives: true,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        optimizedRoute: expect.any(Object),
        alternatives: expect.arrayContaining([
          expect.objectContaining({
            algorithm: expect.any(String),
            totalDistance: expect.any(Number),
            sequence: expect.any(Array),
            reason: expect.any(String),
          }),
        ]),
      });
    });

    it('should calculate time windows for pickups', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          departureTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          averageSpeed: 60, // km/h
        })
        .expect(200);

      expect(response.body.data.optimizedRoute.sequence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            estimatedArrival: expect.any(String),
            estimatedDeparture: expect.any(String),
          }),
        ])
      );
    });

    it('should handle vehicle capacity constraints', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 60 },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 50 },
            { id: 'p3', lat: 42.2, lng: 23.1, quantity: 40 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          vehicleCapacity: 100,
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        optimizedRoute: expect.any(Object),
        warnings: expect.arrayContaining([
          expect.stringContaining('capacity exceeded'),
        ]),
        multiTripSuggestion: expect.objectContaining({
          requiredTrips: 2,
          trips: expect.any(Array),
        }),
      });
    });

    it('should optimize based on traffic conditions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
            { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          considerTraffic: true,
          timeOfDay: '08:00', // Rush hour
        })
        .expect(200);

      expect(response.body.data.optimizedRoute).toMatchObject({
        trafficConsidered: true,
        adjustedDuration: expect.any(Number),
      });
    });

    it('should validate required parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          pickups: JSON.stringify([]),
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

    it('should validate coordinate ranges', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 200, lng: 300 }), // Invalid
          pickups: JSON.stringify([
            { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
          ]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_COORDINATES',
        }),
      });
    });

    it('should handle large number of pickups efficiently', async () => {
      const pickups = Array.from({ length: 10 }, (_, i) => ({
        id: `p${i}`,
        lat: 42.0 + Math.random() * 0.5,
        lng: 23.0 + Math.random() * 0.5,
        quantity: 10,
      }));

      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify(pickups),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
          optimizationLevel: 'fast', // Use heuristic for speed
        })
        .expect(200);

      expect(response.body.data.metrics).toMatchObject({
        computationTime: expect.any(Number),
        optimizationLevel: 'fast',
      });

      // Should complete within reasonable time
      expect(response.body.data.metrics.computationTime).toBeLessThan(1000); // < 1 second
    });

    it('should cache optimization results', async () => {
      const queryParams = {
        warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
        pickups: JSON.stringify([
          { id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 },
          { id: 'p2', lat: 42.3, lng: 23.4, quantity: 40 },
        ]),
        delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
      };

      const response1 = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query(queryParams)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query(queryParams)
        .expect(200);

      // Second response should be cached
      expect(response2.body.data.metrics.cached).toBe(true);
      expect(response2.body.data.optimizedRoute.totalDistance).toBe(
        response1.body.data.optimizedRoute.totalDistance
      );
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([{ id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 }]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([{ id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 }]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(200);
    });

    it('should allow transporter access', async () => {
      const transporter = await prisma.user.create({
        data: {
          email: 'test-transporter-route@test.com',
          name: 'Test Transporter Route',
          role: 'TRANSPORTER',
        },
      });

      await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', 'Bearer transporter-token')
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.0, lng: 23.0 }),
          pickups: JSON.stringify([{ id: 'p1', lat: 42.1, lng: 23.2, quantity: 30 }]),
          delivery: JSON.stringify({ lat: 42.5, lng: 23.6 }),
        })
        .expect(200);

      await prisma.user.delete({ where: { id: transporter.id } });
    });
  });
});