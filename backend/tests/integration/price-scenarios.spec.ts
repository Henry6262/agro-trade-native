import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Price Scenario Testing - Integration Test (Trading Model)', () => {
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
        email: 'scenario-admin@test.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Scenario Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'scenario-buyer@test.com',
        name: 'Scenario Buyer',
        role: 'BUYER',
      },
    });

    const product = await prisma.product.findFirst();
    
    // Create buy listing
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 150,
        unit: 'TON',
        maxPricePerUnit: 395,
        status: 'ACTIVE',
        deliveryAddress: {
          latitude: 42.6977,
          longitude: 23.3219,
          address: 'Main Distribution Center',
        },
      },
    });

    // Create trade operation
    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-SCENARIO-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
      },
    });
    tradeOperationId = trade.id;

    // Create diverse sellers for scenario testing
    const sellerProfiles = [
      { 
        name: 'Premium Seller',
        quantity: 40,
        askingPrice: 365,
        qualityScore: 95,
        verified: true,
        distance: 30,
      },
      {
        name: 'Standard Seller 1',
        quantity: 50,
        askingPrice: 355,
        qualityScore: 85,
        verified: true,
        distance: 50,
      },
      {
        name: 'Standard Seller 2',
        quantity: 30,
        askingPrice: 350,
        qualityScore: 82,
        verified: false,
        distance: 70,
      },
      {
        name: 'Budget Seller',
        quantity: 30,
        askingPrice: 345,
        qualityScore: 78,
        verified: false,
        distance: 100,
      },
    ];

    for (const profile of sellerProfiles) {
      const seller = await prisma.user.create({
        data: {
          email: `${profile.name.toLowerCase().replace(/ /g, '-')}@test.com`,
          name: profile.name,
          role: 'FARMER',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: profile.quantity,
          unit: 'TON',
          askingPrice: profile.askingPrice,
          qualityScore: profile.qualityScore,
          isVerified: profile.verified,
          status: 'ACTIVE',
          location: {
            latitude: 42.6977 + (profile.distance / 111), // Approximate lat offset
            longitude: 23.3219 + (profile.distance / 111),
            address: `${profile.name} Farm`,
          },
        },
      });

      await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: profile.quantity,
          offeredQuantity: profile.quantity,
          unit: 'TON',
          status: 'NEGOTIATING',
          matchScore: 80 + Math.random() * 20,
          isVerified: profile.verified,
        },
      });
    }

    // Create transport settings
    await prisma.transportCostSettings.create({
      data: {
        id: 'scenario-settings',
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
        bulkDiscountThreshold: 100,
        bulkDiscountRate: 0.1,
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.transportCostSettings.deleteMany();
    await prisma.profitEstimation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'seller@test.com' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'scenario-buyer@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: 'scenario-' },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: { contains: '-seller@test.com' },
      },
    });
    await app.close();
  });

  describe('Comprehensive Price Scenario Analysis', () => {
    it('should generate and rank multiple price scenarios', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 375, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          rankingCriteria: {
            profitWeight: 0.4,
            marginWeight: 0.3,
            buyerAcceptanceWeight: 0.2,
            sellerAcceptanceWeight: 0.1,
          },
        })
        .expect(200);

      const data = response.body.data;
      
      expect(data).toMatchObject({
        scenarios: expect.any(Array),
        bestScenario: expect.objectContaining({
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
        }),
      });

      // Verify scenarios are ranked by score
      const scores = data.scenarios.map((s: any) => s.score);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    });

    it('should optimize for maximum profit margin', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 380, max: 390, step: 2 },
          sellerPriceRange: { min: 345, max: 355, step: 2 },
          filters: {
            minMargin: 7.0, // Only show scenarios with 7%+ margin
          },
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      // All viable scenarios should meet minimum margin
      scenarios.forEach((scenario: any) => {
        if (scenario.isViable) {
          expect(scenario.profitMargin).toBeGreaterThanOrEqual(7.0);
        }
      });

      // Best scenario should maximize margin
      const bestScenario = response.body.data.bestScenario;
      expect(bestScenario.profitMargin).toBeGreaterThanOrEqual(7.0);
    });

    it('should test quality vs price trade-offs', async () => {
      // Test with premium sellers only (higher quality, higher price)
      const premiumResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 385,
          sellerPriceRange: { min: 360, max: 365, step: 1 },
          filters: {
            minQualityScore: 90, // Premium quality only
          },
        })
        .expect(200);

      // Test with budget sellers only (lower quality, lower price)
      const budgetResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 385,
          sellerPriceRange: { min: 345, max: 350, step: 1 },
          filters: {
            maxQualityScore: 80, // Budget quality
          },
        })
        .expect(200);

      // Budget should have higher profit margin
      expect(budgetResponse.body.data.bestScenario.profitMargin)
        .toBeGreaterThan(premiumResponse.body.data.bestScenario.profitMargin);

      // Premium should have better quality score
      expect(premiumResponse.body.data.bestScenario.avgQualityScore)
        .toBeGreaterThan(budgetResponse.body.data.bestScenario.avgQualityScore);
    });

    it('should perform sensitivity analysis on key variables', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 380, max: 385, step: 5 },
          sellerPriceRange: { min: 350, max: 355, step: 5 },
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
          minBuyerPrice: expect.any(Number),
          maxSellerPrice: expect.any(Number),
          maxTransportCost: expect.any(Number),
        },
      });

      // Buyer price should have positive impact on profit
      expect(sensitivity.buyerPriceImpact.profitChange).toBeGreaterThan(0);
      
      // Seller price should have negative impact on profit
      expect(sensitivity.sellerPriceImpact.profitChange).toBeLessThan(0);
    });

    it('should calculate acceptance probabilities', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 375, max: 390, step: 5 },
          sellerPriceRange: { min: 345, max: 360, step: 5 },
          includeAcceptanceProbability: true,
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      scenarios.forEach((scenario: any) => {
        expect(scenario.acceptanceProbability).toMatchObject({
          buyer: expect.any(Number),
          sellers: expect.any(Array),
          overall: expect.any(Number),
        });

        // Acceptance probabilities should be between 0 and 1
        expect(scenario.acceptanceProbability.buyer).toBeGreaterThanOrEqual(0);
        expect(scenario.acceptanceProbability.buyer).toBeLessThanOrEqual(1);
        expect(scenario.acceptanceProbability.overall).toBeGreaterThanOrEqual(0);
        expect(scenario.acceptanceProbability.overall).toBeLessThanOrEqual(1);
      });

      // Higher buyer prices should have lower buyer acceptance
      const highPriceScenario = scenarios.find((s: any) => s.buyerPrice === 390);
      const lowPriceScenario = scenarios.find((s: any) => s.buyerPrice === 375);
      
      if (highPriceScenario && lowPriceScenario) {
        expect(highPriceScenario.acceptanceProbability.buyer)
          .toBeLessThan(lowPriceScenario.acceptanceProbability.buyer);
      }
    });

    it('should handle mixed seller combinations', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 385,
          mixedSellerCombinations: [
            {
              sellers: ['premium-seller', 'standard-seller-1'],
              priceRange: { min: 355, max: 365, step: 5 },
            },
            {
              sellers: ['standard-seller-2', 'budget-seller'],
              priceRange: { min: 345, max: 355, step: 5 },
            },
          ],
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      // Should have scenarios for different seller combinations
      const premiumCombo = scenarios.find((s: any) => 
        s.sellerCombination?.includes('premium-seller')
      );
      const budgetCombo = scenarios.find((s: any) => 
        s.sellerCombination?.includes('budget-seller')
      );

      expect(premiumCombo).toBeDefined();
      expect(budgetCombo).toBeDefined();

      // Budget combo should have better profit margin
      if (premiumCombo && budgetCombo) {
        expect(budgetCombo.profitMargin).toBeGreaterThan(premiumCombo.profitMargin);
      }
    });

    it('should test transport cost variations', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          fixedBuyerPrice: 385,
          sellerPriceRange: { min: 350, max: 355, step: 5 },
          transportOptions: [
            { vehicleType: 'FLATBED', urgency: 'NORMAL' },
            { vehicleType: 'REFRIGERATED', urgency: 'NORMAL' },
            { vehicleType: 'FLATBED', urgency: 'EXPRESS' },
          ],
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      // Group by transport option
      const flatbedNormal = scenarios.filter((s: any) => 
        s.transportOption?.vehicleType === 'FLATBED' && 
        s.transportOption?.urgency === 'NORMAL'
      );
      const refrigeratedNormal = scenarios.filter((s: any) => 
        s.transportOption?.vehicleType === 'REFRIGERATED'
      );
      const flatbedExpress = scenarios.filter((s: any) => 
        s.transportOption?.urgency === 'EXPRESS'
      );

      // Calculate average profit margins
      const avgMarginFlatbed = flatbedNormal.reduce((sum: number, s: any) => 
        sum + s.profitMargin, 0) / flatbedNormal.length;
      const avgMarginRefrigerated = refrigeratedNormal.reduce((sum: number, s: any) => 
        sum + s.profitMargin, 0) / refrigeratedNormal.length;
      const avgMarginExpress = flatbedExpress.reduce((sum: number, s: any) => 
        sum + s.profitMargin, 0) / flatbedExpress.length;

      // Flatbed normal should have best margin
      expect(avgMarginFlatbed).toBeGreaterThan(avgMarginRefrigerated);
      expect(avgMarginFlatbed).toBeGreaterThan(avgMarginExpress);
    });

    it('should identify risk factors', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 10 },
          sellerPriceRange: { min: 340, max: 365, step: 5 },
          includeRiskAssessment: true,
        })
        .expect(200);

      const scenarios = response.body.data.scenarios;
      
      scenarios.forEach((scenario: any) => {
        if (scenario.riskAssessment) {
          expect(scenario.riskAssessment).toMatchObject({
            priceVolatilityRisk: expect.any(Number),
            qualityRisk: expect.any(Number),
            transportRisk: expect.any(Number),
            overallRisk: expect.any(Number),
            riskLevel: expect.stringMatching(/^(LOW|MEDIUM|HIGH)$/),
          });
        }
      });

      // Low margin scenarios should have higher risk
      const lowMarginScenario = scenarios.find((s: any) => s.profitMargin < 5);
      const highMarginScenario = scenarios.find((s: any) => s.profitMargin > 10);
      
      if (lowMarginScenario && highMarginScenario) {
        expect(lowMarginScenario.riskAssessment.overallRisk)
          .toBeGreaterThan(highMarginScenario.riskAssessment.overallRisk);
      }
    });

    it('should save and compare scenario estimations', async () => {
      // Create first estimation
      const response1 = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 380, max: 385, step: 5 },
          sellerPriceRange: { min: 350, max: 355, step: 5 },
          saveEstimation: true,
        })
        .expect(200);

      const estimationId1 = response1.body.data.estimationId;
      expect(estimationId1).toBeDefined();

      // Create second estimation with different parameters
      const response2 = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 375, max: 380, step: 5 },
          sellerPriceRange: { min: 345, max: 350, step: 5 },
          saveEstimation: true,
        })
        .expect(200);

      const estimationId2 = response2.body.data.estimationId;

      // Compare estimations
      const comparison = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/compare-estimations`)
        .set('Authorization', authToken)
        .query({
          estimationIds: [estimationId1, estimationId2],
        })
        .expect(200);

      expect(comparison.body.data).toMatchObject({
        estimations: expect.arrayContaining([
          expect.objectContaining({
            id: estimationId1,
            bestProfit: expect.any(Number),
            bestMargin: expect.any(Number),
          }),
          expect.objectContaining({
            id: estimationId2,
            bestProfit: expect.any(Number),
            bestMargin: expect.any(Number),
          }),
        ]),
        recommendation: expect.any(String),
      });
    });

    it('should export scenarios for decision making', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 380, max: 385, step: 5 },
          sellerPriceRange: { min: 350, max: 355, step: 5 },
          exportFormat: 'csv',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        scenarios: expect.any(Array),
        export: {
          format: 'csv',
          downloadUrl: expect.any(String),
        },
      });
    });

    it('should handle performance with large scenario sets', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/price-scenarios`)
        .set('Authorization', authToken)
        .send({
          buyerPriceRange: { min: 370, max: 390, step: 1 }, // 21 prices
          sellerPriceRange: { min: 340, max: 360, step: 1 }, // 21 prices
          maxScenarios: 100, // Limit to prevent timeout
        })
        .expect(200);

      const executionTime = Date.now() - startTime;
      
      expect(response.body.data.metrics).toMatchObject({
        executionTime: expect.any(Number),
        scenariosPerSecond: expect.any(Number),
      });

      // Should complete within reasonable time (5 seconds)
      expect(executionTime).toBeLessThan(5000);
      
      // Should process scenarios efficiently
      expect(response.body.data.metrics.scenariosPerSecond).toBeGreaterThan(10);
    });
  });
});