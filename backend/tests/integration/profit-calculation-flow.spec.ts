import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Profit Calculation Flow - Integration Test (Trading Model)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let tradeOperationId: string;
  let buyListingId: string;

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
        email: 'profit-admin@test.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Profit Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'profit-buyer@test.com',
        name: 'Profit Buyer',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    // Create buy listing
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 100,
        unit: 'TON',
        maxPricePerUnit: 400,
        status: 'ACTIVE',
        neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        deliveryAddress: {
          latitude: 42.5,
          longitude: 23.6,
          address: 'Sofia Warehouse',
        },
      },
    });
    buyListingId = buyListing.id;

    // Create trade operation
    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-PROFIT-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'INITIATION',
        status: 'ACTIVE',
        currency: 'EUR',
      },
    });
    tradeOperationId = trade.id;

    // Create sellers with different locations
    const sellerData = [
      { 
        name: 'Near Seller',
        quantity: 50,
        price: 350,
        lat: 42.3,
        lng: 23.4,
        distance: 30, // 30km
      },
      {
        name: 'Medium Seller',
        quantity: 30,
        price: 345,
        lat: 42.1,
        lng: 23.2,
        distance: 60, // 60km
      },
      {
        name: 'Far Seller',
        quantity: 20,
        price: 340,
        lat: 41.8,
        lng: 23.0,
        distance: 100, // 100km
      },
    ];

    for (const data of sellerData) {
      const seller = await prisma.user.create({
        data: {
          email: `${data.name.toLowerCase().replace(' ', '-')}@test.com`,
          name: data.name,
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: data.quantity,
          unit: 'TON',
          askingPrice: data.price,
          status: 'ACTIVE',
          location: {
            latitude: data.lat,
            longitude: data.lng,
            address: `${data.name} Farm`,
          },
        },
      });

      await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: data.quantity,
          offeredQuantity: data.quantity,
          unit: 'TON',
          status: 'NEGOTIATING',
          location: {
            latitude: data.lat,
            longitude: data.lng,
            address: `${data.name} Farm`,
          },
        },
      });
    }

    // Create transport cost settings
    await prisma.transportCostSettings.create({
      data: {
        id: 'profit-test-settings',
        baseRatePerKm: 0.15,
        vehicleMultipliers: {
          FLATBED: 1.0,
          REFRIGERATED: 1.3,
        },
        distanceTiers: [
          { minKm: 0, maxKm: 50, ratePerKm: 0.15 },
          { minKm: 50, maxKm: 200, ratePerKm: 0.13 },
          { minKm: 200, maxKm: null, ratePerKm: 0.11 },
        ],
        loadingCostPerTon: 0.5,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.transportCostSettings.deleteMany();
    await prisma.profitEstimation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
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
      where: { seller: { email: { contains: '-seller@test.com' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { id: buyListingId },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'profit-' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '-seller@test.com' },
      },
    });
    await app.close();
  });

  describe('Real-time Profit Calculation Throughout Trade Lifecycle', () => {
    it('Step 1: Calculate initial profit with proposed prices', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 50 },
            { sellerId: 's2', price: 345, quantity: 30 },
            { sellerId: 's3', price: 340, quantity: 20 },
          ],
          saveEstimation: true,
        })
        .expect(200);

      const calc = response.body.data.calculation;
      
      expect(calc).toMatchObject({
        revenue: {
          buyerPrice: 380,
          quantity: 100,
          totalRevenue: 38000,
        },
        costs: {
          purchases: {
            totalPurchaseCost: 34700, // (350*50 + 345*30 + 340*20)
            avgPrice: 347,
          },
          transport: {
            estimatedCost: expect.any(Number),
          },
        },
        profit: {
          grossProfit: 3300, // 38000 - 34700
          netProfit: expect.any(Number), // Gross - transport
          profitMargin: expect.any(Number),
        },
      });

      // Verify profit margin meets minimum
      expect(calc.profit.profitMargin).toBeGreaterThanOrEqual(5);
    });

    it('Step 2: Compare multiple price scenarios', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 5 },
          sellerPriceRange: { min: 340, max: 355, step: 5 },
          includeAcceptanceProbability: true,
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      const bestScenario = response.body.data.bestScenario;
      
      // Should generate multiple scenarios
      expect(scenarios.length).toBeGreaterThan(1);
      
      // Best scenario should be profitable
      expect(bestScenario.profitMargin).toBeGreaterThanOrEqual(7); // Target margin
      
      // Should include acceptance probability
      expect(bestScenario.acceptanceProbability).toBeDefined();
    });

    it('Step 3: Calculate transport cost with route optimization', async () => {
      // Get seller locations
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      const response = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: sellers.map(s => ({
            lat: s.location.latitude,
            lng: s.location.longitude,
            quantity: s.requestedQuantity,
          })),
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      const estimation = response.body.data.estimation;
      
      expect(estimation).toMatchObject({
        totalDistance: expect.any(Number),
        totalCost: expect.any(Number),
        breakdown: {
          distanceCost: expect.any(Number),
          loadingCosts: 50, // 100 tons * 0.5
        },
        route: {
          optimizationApplied: true,
          distanceSaved: expect.any(Number),
        },
      });

      // Save transport cost calculation
      await prisma.transportCostCalculation.create({
        data: {
          id: `calc-${tradeOperationId}`,
          tradeOperationId: tradeOperationId,
          pickupPoints: estimation.route.pickupSequence,
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          optimalRoute: estimation.route.pickupSequence,
          totalDistance: estimation.totalDistance,
          baseRatePerKm: 0.15,
          distanceCost: estimation.breakdown.distanceCost,
          loadingCosts: estimation.breakdown.loadingCosts,
          totalCost: estimation.totalCost,
          calculatedAt: new Date(),
        },
      });
    });

    it('Step 4: Update trade with negotiated prices and recalculate', async () => {
      // Update sellers with agreed prices
      const sellers = await prisma.tradeSeller.findMany({
        where: { tradeOperationId: tradeOperationId },
      });

      for (const seller of sellers) {
        const agreedPrice = seller.requestedQuantity?.toNumber() === 50 ? 348 : 
                           seller.requestedQuantity?.toNumber() === 30 ? 343 : 338;
        
        await prisma.tradeSeller.update({
          where: { id: seller.id },
          data: {
            agreedPrice: agreedPrice,
            agreedQuantity: seller.requestedQuantity,
            status: 'ACCEPTED',
          },
        });
      }

      // Update trade operation
      const totalPurchaseCost = 348 * 50 + 343 * 30 + 338 * 20;
      const sellingPrice = 378;
      const totalRevenue = sellingPrice * 100;
      const transportCost = 165;
      const estimatedProfit = totalRevenue - totalPurchaseCost - transportCost;
      const profitMargin = (estimatedProfit / totalRevenue) * 100;

      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          sellingPrice: sellingPrice,
          totalRevenue: totalRevenue,
          totalPurchaseCost: totalPurchaseCost,
          avgPurchasePrice: totalPurchaseCost / 100,
          estimatedTransportCost: transportCost,
          estimatedProfit: estimatedProfit,
          profitMargin: profitMargin,
        },
      });

      // Get updated profit
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.profit).toMatchObject({
        netProfit: estimatedProfit,
        profitMargin: profitMargin,
      });
    });

    it('Step 5: Perform sensitivity analysis', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 378,
          sellerPriceRange: { min: 340, max: 350, step: 2 },
          includeSensitivityAnalysis: true,
        })
        .expect(200);

      const sensitivity = response.body.data.sensitivityAnalysis;
      
      expect(sensitivity).toMatchObject({
        buyerPriceImpact: {
          priceChange: expect.any(Number),
          profitChange: expect.any(Number),
          elasticity: expect.any(Number),
        },
        sellerPriceImpact: {
          priceChange: expect.any(Number),
          profitChange: expect.any(Number),
          elasticity: expect.any(Number),
        },
        transportCostImpact: {
          costChange: expect.any(Number),
          profitChange: expect.any(Number),
        },
        breakPoints: {
          minBuyerPrice: expect.any(Number), // Price below which profit is negative
          maxSellerPrice: expect.any(Number), // Price above which profit is negative
          maxTransportCost: expect.any(Number), // Max transport before loss
        },
      });
    });

    it('Step 6: Finalize trade and calculate actual profit', async () => {
      // Mark trade as completed with actual values
      const actualTransportCost = 172; // Slightly higher than estimated
      const totalPurchaseCost = 348 * 50 + 343 * 30 + 338 * 20;
      const totalRevenue = 378 * 100;
      const actualProfit = totalRevenue - totalPurchaseCost - actualTransportCost;
      const actualMargin = (actualProfit / totalRevenue) * 100;

      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          phase: 'COMPLETED',
          status: 'COMPLETED',
          actualTransportCost: actualTransportCost,
          actualProfit: actualProfit,
          profitMargin: actualMargin,
        },
      });

      // Get final profit report
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      const profit = response.body.data;
      
      expect(profit).toMatchObject({
        revenue: {
          totalRevenue: totalRevenue,
        },
        costs: {
          purchases: {
            totalCost: totalPurchaseCost,
          },
          transport: {
            actualCost: actualTransportCost,
          },
        },
        profit: {
          netProfit: actualProfit,
          profitMargin: actualMargin,
        },
        status: {
          isEstimated: false, // Using actual values
        },
      });

      // Verify profit margin meets target
      expect(actualMargin).toBeGreaterThanOrEqual(5);
    });

    it('Step 7: Validate profit history tracking', async () => {
      // Get all profit estimations for the trade
      const estimations = await prisma.profitEstimation.findMany({
        where: { tradeOperationId: tradeOperationId },
        orderBy: { createdAt: 'asc' },
      });

      // Should have multiple estimations from different stages
      expect(estimations.length).toBeGreaterThan(0);
      
      // Track profit improvement over negotiations
      if (estimations.length > 1) {
        const firstEstimation = estimations[0];
        const lastEstimation = estimations[estimations.length - 1];
        
        // Later estimations should generally be more accurate
        expect(lastEstimation.profitMargin).toBeDefined();
      }
    });
  });

  describe('Edge Cases and Risk Management', () => {
    it('should warn when profit margin falls below minimum', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 360, // Low selling price
          sellerPrices: [
            { sellerId: 's1', price: 355, quantity: 50 },
            { sellerId: 's2', price: 352, quantity: 30 },
            { sellerId: 's3', price: 350, quantity: 20 },
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

    it('should handle negative profit scenarios', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 340, // Selling below cost
          sellerPrices: [
            { sellerId: 's1', price: 360, quantity: 50 },
            { sellerId: 's2', price: 365, quantity: 30 },
            { sellerId: 's3', price: 362, quantity: 20 },
          ],
        })
        .expect(200);

      const calc = response.body.data.calculation;
      
      expect(calc.profit.netProfit).toBeLessThan(0);
      expect(response.body.data.isViable).toBe(false);
      expect(response.body.data.warnings).toContainEqual(
        expect.stringContaining('negative profit')
      );
    });

    it('should account for transport cost variations', async () => {
      // Test with express delivery
      const expressResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 50 },
            { sellerId: 's2', price: 345, quantity: 30 },
            { sellerId: 's3', price: 340, quantity: 20 },
          ],
          transportOptions: {
            urgency: 'EXPRESS',
          },
        })
        .expect(200);

      // Test with refrigerated transport
      const refrigeratedResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/calculate-profit`)
        .set('Authorization', authToken)
        .send({
          buyerPrice: 380,
          sellerPrices: [
            { sellerId: 's1', price: 350, quantity: 50 },
            { sellerId: 's2', price: 345, quantity: 30 },
            { sellerId: 's3', price: 340, quantity: 20 },
          ],
          transportOptions: {
            vehicleType: 'REFRIGERATED',
          },
        })
        .expect(200);

      // Express and refrigerated should have higher transport costs
      const normalTransport = 165;
      expect(expressResponse.body.data.calculation.costs.transport.estimatedCost)
        .toBeGreaterThan(normalTransport);
      expect(refrigeratedResponse.body.data.calculation.costs.transport.estimatedCost)
        .toBeGreaterThan(normalTransport);
    });
  });
});