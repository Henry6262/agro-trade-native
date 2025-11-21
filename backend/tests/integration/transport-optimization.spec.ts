import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Transport Cost Optimization - Integration Test (Trading Model)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tradeOperationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup base data
    const admin = await prisma.user.create({
      data: {
        email: 'transport-admin@test.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Transport Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'transport-buyer@test.com',
        name: 'Transport Buyer',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    // Create buy listing with delivery location
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 200, // Large order requiring optimization
        unit: 'TON',
        maxPricePerUnit: 390,
        status: 'ACTIVE',
        deliveryAddress: {
          latitude: 42.6977, // Sofia
          longitude: 23.3219,
          address: 'Central Warehouse Sofia',
        },
      },
    });

    // Create trade operation
    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-TRANSPORT-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'TRANSPORT_BIDDING',
        status: 'ACTIVE',
        sellingPrice: 385,
        totalRevenue: 77000, // 200 tons * €385
      },
    });
    tradeOperationId = trade.id;

    // Create multiple sellers across different regions
    const sellerLocations = [
      // Cluster 1: North region (near Pleven)
      { name: 'North Farm 1', lat: 43.4070, lng: 24.6066, quantity: 40 },
      { name: 'North Farm 2', lat: 43.4170, lng: 24.6166, quantity: 35 },
      { name: 'North Farm 3', lat: 43.3970, lng: 24.5966, quantity: 30 },
      
      // Cluster 2: South region (near Plovdiv)
      { name: 'South Farm 1', lat: 42.1354, lng: 24.7453, quantity: 45 },
      { name: 'South Farm 2', lat: 42.1454, lng: 24.7553, quantity: 25 },
      
      // Cluster 3: West region (near Pernik)
      { name: 'West Farm 1', lat: 42.6098, lng: 23.0308, quantity: 25 },
    ];

    for (const location of sellerLocations) {
      const seller = await prisma.user.create({
        data: {
          email: `${location.name.toLowerCase().replace(/ /g, '-')}@test.com`,
          name: location.name,
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: location.quantity,
          unit: 'TON',
          askingPrice: 350 + Math.random() * 10, // Vary prices slightly
          status: 'ACTIVE',
          location: {
            latitude: location.lat,
            longitude: location.lng,
            address: location.name,
          },
        },
      });

      await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: location.quantity,
          agreedQuantity: location.quantity,
          agreedPrice: 355,
          unit: 'TON',
          status: 'CONFIRMED',
          location: {
            latitude: location.lat,
            longitude: location.lng,
            address: location.name,
          },
        },
      });
    }

    // Create transport cost settings
    await prisma.transportCostSettings.create({
      data: {
        id: 'transport-opt-settings',
        baseRatePerKm: 0.15,
        vehicleMultipliers: {
          FLATBED: 1.0,
          REFRIGERATED: 1.3,
          TANKER: 1.2,
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
    await prisma.transportCostCalculation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'farm' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'transport-buyer@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'transport-' } },
          { email: { contains: 'farm' } },
        ],
      },
    });
    await app.close();
  });

  describe('Multi-Pickup Route Optimization', () => {
    it('should optimize route for clustered pickups', async () => {
      // Get all seller locations
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ 
            lat: 42.6977, // Sofia warehouse
            lng: 23.3219,
          }),
          pickups: JSON.stringify(
            sellers.map(s => ({
              id: s.id,
              lat: s.location.latitude,
              lng: s.location.longitude,
              quantity: s.agreedQuantity,
            }))
          ),
          delivery: JSON.stringify({
            lat: 42.6977,
            lng: 23.3219,
          }),
        })
        .expect(200);

      const route = response.body.data.optimizedRoute;
      
      expect(route).toMatchObject({
        totalDistance: expect.any(Number),
        totalDuration: expect.any(Number),
        algorithm: expect.any(String),
        sequence: expect.arrayContaining([
          expect.objectContaining({ type: 'warehouse' }),
          expect.objectContaining({ type: 'pickup' }),
          expect.objectContaining({ type: 'delivery' }),
        ]),
      });

      // Verify optimization saved distance
      expect(response.body.data.comparison).toMatchObject({
        originalDistance: expect.any(Number),
        optimizedDistance: expect.any(Number),
        distanceSaved: expect.any(Number),
        percentageSaved: expect.any(Number),
      });

      // Should save at least 10% distance
      expect(response.body.data.comparison.percentageSaved).toBeGreaterThanOrEqual(10);
    });

    it('should compare different optimization algorithms', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
        take: 5, // Use subset for faster testing
      });

      const pickups = sellers.map(s => ({
        id: s.id,
        lat: s.location.latitude,
        lng: s.location.longitude,
        quantity: s.agreedQuantity,
      }));

      // Test nearest neighbor algorithm
      const nnResponse = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(pickups),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          algorithm: 'nearest_neighbor',
        })
        .expect(200);

      // Test 2-opt improvement
      const twoOptResponse = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(pickups),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          algorithm: 'tsp_2opt',
        })
        .expect(200);

      // 2-opt should generally produce better or equal results
      expect(twoOptResponse.body.data.optimizedRoute.totalDistance)
        .toBeLessThanOrEqual(nnResponse.body.data.optimizedRoute.totalDistance);
    });

    it('should calculate transport costs for optimized route', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      // First optimize the route
      const routeResponse = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(
            sellers.map(s => ({
              id: s.id,
              lat: s.location.latitude,
              lng: s.location.longitude,
              quantity: s.agreedQuantity,
            }))
          ),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
        })
        .expect(200);

      const optimizedSequence = routeResponse.body.data.optimizedRoute.sequence;

      // Calculate cost for optimized route
      const costResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: optimizedSequence
            .filter((s: any) => s.type === 'pickup')
            .map((s: any) => ({
              lat: s.location.lat,
              lng: s.location.lng,
              quantity: s.quantity,
            })),
          deliveryPoint: { lat: 42.6977, lng: 23.3219 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      const estimation = costResponse.body.data.estimation;
      
      expect(estimation).toMatchObject({
        totalDistance: expect.any(Number),
        totalCost: expect.any(Number),
        breakdown: {
          distanceCost: expect.any(Number),
          loadingCosts: 100, // 200 tons * 0.5
        },
      });

      // Verify bulk discount applied (200 tons > 100 ton threshold)
      expect(estimation.breakdown.bulkDiscount).toMatchObject({
        applied: true,
        discountRate: 0.1,
        discountAmount: expect.any(Number),
      });
    });

    it('should handle vehicle capacity constraints', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      // Request optimization with limited vehicle capacity
      const response = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(
            sellers.map(s => ({
              id: s.id,
              lat: s.location.latitude,
              lng: s.location.longitude,
              quantity: s.agreedQuantity,
            }))
          ),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          vehicleCapacity: 80, // Can't carry all 200 tons in one trip
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        warnings: expect.arrayContaining([
          expect.stringContaining('capacity'),
        ]),
        multiTripSuggestion: {
          requiredTrips: 3, // 200 tons / 80 tons = 2.5, round up to 3
          trips: expect.arrayContaining([
            expect.objectContaining({
              tripNumber: 1,
              totalQuantity: expect.any(Number),
              pickups: expect.any(Array),
            }),
          ]),
        },
      });
    });

    it('should optimize for different vehicle types', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
        take: 3, // Small subset for testing
      });

      const pickupPoints = sellers.map(s => ({
        lat: s.location.latitude,
        lng: s.location.longitude,
        quantity: s.agreedQuantity,
      }));

      // Test with different vehicle types
      const vehicleTypes = ['FLATBED', 'REFRIGERATED', 'CONTAINER'];
      const costs = [];

      for (const vehicleType of vehicleTypes) {
        const response = await request(app.getHttpServer())
          .post('/api/transport/estimate-cost')
          .set('Authorization', authToken)
          .send({
            pickupPoints,
            deliveryPoint: { lat: 42.6977, lng: 23.3219 },
            vehicleType,
          })
          .expect(200);

        costs.push({
          type: vehicleType,
          cost: response.body.data.estimation.totalCost,
          multiplier: response.body.data.estimation.vehicleInfo.multiplier,
        });
      }

      // Verify different costs based on vehicle type
      const flatbedCost = costs.find(c => c.type === 'FLATBED')!.cost;
      const refrigeratedCost = costs.find(c => c.type === 'REFRIGERATED')!.cost;
      
      expect(refrigeratedCost).toBeGreaterThan(flatbedCost); // 1.3x multiplier
    });

    it('should consider time windows and urgency', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
        take: 3,
      });

      // Test with express delivery
      const expressResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: sellers.map(s => ({
            lat: s.location.latitude,
            lng: s.location.longitude,
            quantity: s.agreedQuantity,
          })),
          deliveryPoint: { lat: 42.6977, lng: 23.3219 },
          vehicleType: 'FLATBED',
          urgency: 'EXPRESS',
        })
        .expect(200);

      // Test with normal delivery
      const normalResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: sellers.map(s => ({
            lat: s.location.latitude,
            lng: s.location.longitude,
            quantity: s.agreedQuantity,
          })),
          deliveryPoint: { lat: 42.6977, lng: 23.3219 },
          vehicleType: 'FLATBED',
          urgency: 'NORMAL',
        })
        .expect(200);

      // Express should cost more (30% surcharge)
      expect(expressResponse.body.data.estimation.totalCost)
        .toBeGreaterThan(normalResponse.body.data.estimation.totalCost);
      
      expect(expressResponse.body.data.estimation.breakdown.urgencySurcharge).toMatchObject({
        applied: true,
        surchargeRate: 0.3,
      });
    });

    it('should save and retrieve optimized routes', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      // Optimize route
      const routeResponse = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(
            sellers.map(s => ({
              id: s.id,
              lat: s.location.latitude,
              lng: s.location.longitude,
              quantity: s.agreedQuantity,
            }))
          ),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
        })
        .expect(200);

      const route = routeResponse.body.data.optimizedRoute;

      // Save transport calculation
      const calculation = await prisma.transportCostCalculation.create({
        data: {
          id: `route-${tradeOperationId}`,
          tradeOperationId: tradeOperationId,
          pickupPoints: route.sequence.filter((s: any) => s.type === 'pickup'),
          deliveryPoint: { lat: 42.6977, lng: 23.3219 },
          optimalRoute: route.sequence,
          totalDistance: route.totalDistance,
          baseRatePerKm: 0.15,
          distanceCost: route.totalDistance * 0.13, // Average rate
          loadingCosts: 100,
          totalCost: route.totalDistance * 0.13 + 100,
          calculatedAt: new Date(),
        },
      });

      // Verify saved calculation
      expect(calculation.totalDistance).toBe(route.totalDistance);
      expect(calculation.optimalRoute).toEqual(route.sequence);
    });

    it('should calculate impact on overall profit', async () => {
      // Get optimized transport cost
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      const costResponse = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: sellers.map(s => ({
            lat: s.location.latitude,
            lng: s.location.longitude,
            quantity: s.agreedQuantity,
          })),
          deliveryPoint: { lat: 42.6977, lng: 23.3219 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      const transportCost = costResponse.body.data.estimation.totalCost;

      // Update trade with transport cost
      const totalPurchaseCost = 355 * 200; // €355/ton * 200 tons
      const totalRevenue = 385 * 200; // €385/ton * 200 tons
      const estimatedProfit = totalRevenue - totalPurchaseCost - transportCost;
      const profitMargin = (estimatedProfit / totalRevenue) * 100;

      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          totalPurchaseCost,
          estimatedTransportCost: transportCost,
          totalDistanceKm: costResponse.body.data.estimation.totalDistance,
          estimatedProfit,
          profitMargin,
        },
      });

      // Get profit calculation
      const profitResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      expect(profitResponse.body.data).toMatchObject({
        costs: {
          transport: {
            estimatedCost: transportCost,
          },
        },
        profit: {
          netProfit: estimatedProfit,
          profitMargin: profitMargin,
        },
      });

      // Verify profit margin is acceptable
      expect(profitMargin).toBeGreaterThanOrEqual(5); // Minimum margin
    });
  });

  describe('Transport Cost Comparison', () => {
    it('should compare direct vs optimized routes', async () => {
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
        take: 4,
      });

      const pickups = sellers.map(s => ({
        id: s.id,
        lat: s.location.latitude,
        lng: s.location.longitude,
        quantity: s.agreedQuantity,
      }));

      // Get optimized route
      const optimizedResponse = await request(app.getHttpServer())
        .get('/api/transport/optimize-route')
        .set('Authorization', authToken)
        .query({
          warehouseLocation: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          pickups: JSON.stringify(pickups),
          delivery: JSON.stringify({ lat: 42.6977, lng: 23.3219 }),
          includeAlternatives: true,
        })
        .expect(200);

      const alternatives = optimizedResponse.body.data.alternatives;
      
      // Should provide alternative routes
      expect(alternatives.length).toBeGreaterThan(0);
      
      // Each alternative should have different characteristics
      alternatives.forEach((alt: any) => {
        expect(alt).toMatchObject({
          algorithm: expect.any(String),
          totalDistance: expect.any(Number),
          reason: expect.any(String),
        });
      });
    });

    it('should identify cost-saving opportunities', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 385,
          sellerPriceRange: { min: 350, max: 360, step: 2 },
          transportOptions: [
            { vehicleType: 'FLATBED', urgency: 'NORMAL' },
            { vehicleType: 'FLATBED', urgency: 'EXPRESS' },
          ],
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      // Find scenario with best profit considering transport
      const bestNormal = scenarios.find((s: any) => 
        s.transportOptions?.urgency === 'NORMAL'
      );
      const bestExpress = scenarios.find((s: any) => 
        s.transportOptions?.urgency === 'EXPRESS'
      );

      // Normal delivery should have better profit margin
      expect(bestNormal.profitMargin).toBeGreaterThan(bestExpress.profitMargin);
    });
  });
});