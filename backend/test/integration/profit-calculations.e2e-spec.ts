import * as request from 'supertest';
import { TestEnvironment } from '../setup/test-environment';

describe('Profit Calculations Integration Tests', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();

    // Create a base trade operation for testing
    const response = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 7.5,
      })
      .expect(201);

    tradeOperationId = response.body.id;

    // Select sellers
    await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/sellers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 60,
          },
          {
            sellerId: testData.users.seller2.id,
            saleListingId: testData.saleListings[1].id,
            requestedQuantity: 40,
          },
        ],
      })
      .expect(201);
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe('Real-time Profit Calculation', () => {
    it('should calculate profit with detailed breakdown', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty('tradeOperationId', tradeOperationId);
      
      // Revenue breakdown
      expect(response.body).toHaveProperty('revenue');
      expect(response.body.revenue).toHaveProperty('sellingPrice');
      expect(response.body.revenue).toHaveProperty('quantity');
      expect(response.body.revenue).toHaveProperty('totalRevenue');
      expect(response.body.revenue).toHaveProperty('currency', 'EUR');

      // Cost breakdown
      expect(response.body).toHaveProperty('costs');
      expect(response.body.costs).toHaveProperty('purchases');
      expect(response.body.costs.purchases).toHaveProperty('totalCost');
      expect(response.body.costs.purchases).toHaveProperty('avgPrice');
      expect(response.body.costs.purchases).toHaveProperty('breakdown');
      
      expect(response.body.costs).toHaveProperty('transport');
      expect(response.body.costs.transport).toHaveProperty('estimatedCost');
      expect(response.body.costs.transport).toHaveProperty('distance');
      expect(response.body.costs.transport).toHaveProperty('ratePerKm');
      
      expect(response.body.costs).toHaveProperty('totalCosts');

      // Profit metrics
      expect(response.body).toHaveProperty('profit');
      expect(response.body.profit).toHaveProperty('grossProfit');
      expect(response.body.profit).toHaveProperty('netProfit');
      expect(response.body.profit).toHaveProperty('profitMargin');
      expect(response.body.profit).toHaveProperty('meetsMinimumMargin');
      expect(response.body.profit).toHaveProperty('targetMarginMet');
      expect(response.body.profit).toHaveProperty('viability');

      // Verify calculation formula
      const { revenue, costs, profit } = response.body;
      const calculatedProfit = revenue.totalRevenue - costs.totalCosts;
      expect(profit.netProfit).toBeCloseTo(calculatedProfit, 2);
      
      const calculatedMargin = (profit.netProfit / revenue.totalRevenue) * 100;
      expect(profit.profitMargin).toBeCloseTo(calculatedMargin, 2);
    });

    it('should include sensitivity analysis when requested', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({ includeSensitivity: true })
        .expect(200);

      expect(response.body).toHaveProperty('sensitivityAnalysis');
      
      const sensitivity = response.body.sensitivityAnalysis;
      expect(sensitivity).toHaveProperty('priceChanges');
      expect(sensitivity.priceChanges).toHaveProperty('buyerPrice');
      expect(sensitivity.priceChanges).toHaveProperty('sellerPrice');
      expect(sensitivity.priceChanges).toHaveProperty('transportCost');
      
      // Each sensitivity should show impact
      expect(sensitivity.priceChanges.buyerPrice).toHaveProperty('increase5Percent');
      expect(sensitivity.priceChanges.buyerPrice).toHaveProperty('decrease5Percent');
    });

    it('should include risk assessment when requested', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({ includeRiskAssessment: true })
        .expect(200);

      expect(response.body).toHaveProperty('riskAssessment');
      
      const risk = response.body.riskAssessment;
      expect(risk).toHaveProperty('overallRisk');
      expect(risk).toHaveProperty('factors');
      expect(risk.factors).toHaveProperty('marginRisk');
      expect(risk.factors).toHaveProperty('priceVolatilityRisk');
      expect(risk.factors).toHaveProperty('transportRisk');
      expect(risk).toHaveProperty('recommendations');
    });
  });

  describe('Profit Estimation', () => {
    it('should estimate profit for proposed prices', async () => {
      const estimationDto = {
        buyerPrice: 375,
        sellerPrices: [
          { sellerId: testData.users.seller1.id, price: 345, quantity: 60 },
          { sellerId: testData.users.seller2.id, price: 350, quantity: 40 },
        ],
        transportCost: 1200,
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/profit/${tradeOperationId}/profit/estimate`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body).toHaveProperty('estimatedRevenue');
      expect(response.body).toHaveProperty('estimatedCosts');
      expect(response.body).toHaveProperty('estimatedProfit');
      expect(response.body).toHaveProperty('profitMargin');
      expect(response.body).toHaveProperty('viability');
      expect(response.body).toHaveProperty('recommendation');

      // Verify estimation calculation
      const revenue = 375 * 100;
      const purchaseCost = (345 * 60) + (350 * 40);
      const totalCost = purchaseCost + 1200;
      const expectedProfit = revenue - totalCost;
      const expectedMargin = (expectedProfit / revenue) * 100;

      expect(response.body.estimatedRevenue).toBe(revenue);
      expect(response.body.estimatedCosts).toBe(totalCost);
      expect(response.body.estimatedProfit).toBeCloseTo(expectedProfit, 2);
      expect(response.body.profitMargin).toBeCloseTo(expectedMargin, 2);
    });

    it('should warn when estimated margin is below minimum', async () => {
      const estimationDto = {
        buyerPrice: 355, // Lower selling price
        sellerPrices: [
          { sellerId: testData.users.seller1.id, price: 345, quantity: 60 },
          { sellerId: testData.users.seller2.id, price: 350, quantity: 40 },
        ],
        transportCost: 1500, // Higher transport cost
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/profit/${tradeOperationId}/profit/estimate`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body.profitMargin).toBeLessThan(5);
      expect(response.body.viability).toBe('UNVIABLE');
      expect(response.body).toHaveProperty('warning');
      expect(response.body.warning).toContain('below minimum');
    });

    it('should save estimation history', async () => {
      // Create multiple estimations
      for (let i = 0; i < 3; i++) {
        await request(env.app.getHttpServer())
          .post(`/api/profit/${tradeOperationId}/profit/estimate`)
          .set('Authorization', `Bearer ${env.tokens.admin}`)
          .send({
            buyerPrice: 370 + i * 5,
            sellerPrices: [
              { sellerId: testData.users.seller1.id, price: 345, quantity: 60 },
              { sellerId: testData.users.seller2.id, price: 350, quantity: 40 },
            ],
            transportCost: 1200,
          })
          .expect(201);
      }

      // Get estimation history
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit/history`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty('estimations');
      expect(response.body.estimations).toBeInstanceOf(Array);
      expect(response.body.estimations.length).toBeGreaterThanOrEqual(3);
      
      // History should be sorted by date (newest first)
      const dates = response.body.estimations.map((e: any) => new Date(e.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });
  });

  describe('Profit Comparison', () => {
    it('should compare multiple profit scenarios', async () => {
      const compareDto = {
        scenarios: [
          {
            name: 'Conservative',
            buyerPrice: 365,
            avgSellerPrice: 350,
            transportCost: 1500,
            quantity: 100,
          },
          {
            name: 'Target',
            buyerPrice: 375,
            avgSellerPrice: 347,
            transportCost: 1200,
            quantity: 100,
          },
          {
            name: 'Optimistic',
            buyerPrice: 385,
            avgSellerPrice: 345,
            transportCost: 1000,
            quantity: 100,
          },
        ],
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/profit/${tradeOperationId}/profit/compare`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send(compareDto)
        .expect(201);

      expect(response.body).toHaveProperty('scenarios');
      expect(response.body.scenarios).toHaveLength(3);
      
      // Each scenario should have complete analysis
      response.body.scenarios.forEach((scenario: any) => {
        expect(scenario).toHaveProperty('name');
        expect(scenario).toHaveProperty('revenue');
        expect(scenario).toHaveProperty('costs');
        expect(scenario).toHaveProperty('profit');
        expect(scenario).toHaveProperty('profitMargin');
        expect(scenario).toHaveProperty('viability');
      });

      expect(response.body).toHaveProperty('comparison');
      expect(response.body.comparison).toHaveProperty('best');
      expect(response.body.comparison).toHaveProperty('worst');
      expect(response.body.comparison).toHaveProperty('recommendation');

      // Optimistic should be best scenario
      expect(response.body.comparison.best.name).toBe('Optimistic');
      expect(response.body.comparison.worst.name).toBe('Conservative');
    });

    it('should rank scenarios by profitability', async () => {
      const compareDto = {
        scenarios: [
          {
            name: 'Scenario A',
            buyerPrice: 370,
            avgSellerPrice: 348,
            transportCost: 1300,
            quantity: 100,
          },
          {
            name: 'Scenario B',
            buyerPrice: 375,
            avgSellerPrice: 346,
            transportCost: 1200,
            quantity: 100,
          },
          {
            name: 'Scenario C',
            buyerPrice: 380,
            avgSellerPrice: 344,
            transportCost: 1100,
            quantity: 100,
          },
        ],
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/profit/${tradeOperationId}/profit/compare`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send(compareDto)
        .expect(201);

      expect(response.body).toHaveProperty('ranking');
      expect(response.body.ranking).toBeInstanceOf(Array);
      
      // Verify ranking is sorted by profit margin
      const margins = response.body.ranking.map((r: any) => r.profitMargin);
      for (let i = 1; i < margins.length; i++) {
        expect(margins[i - 1]).toBeGreaterThanOrEqual(margins[i]);
      }
    });
  });

  describe('Profit Impact Analysis', () => {
    it('should analyze impact of offer changes', async () => {
      // Simulate an offer
      const offerId = 'test-offer-001';
      
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit/impact/${offerId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({
          newPrice: 370,
          offerType: 'BUYER',
        })
        .expect(200);

      expect(response.body).toHaveProperty('currentProfit');
      expect(response.body).toHaveProperty('newProfit');
      expect(response.body).toHaveProperty('profitChange');
      expect(response.body).toHaveProperty('marginChange');
      expect(response.body).toHaveProperty('impact');
      expect(response.body).toHaveProperty('recommendation');

      // Should show negative impact for lower buyer price
      expect(response.body.profitChange).toBeLessThan(0);
      expect(response.body.marginChange).toBeLessThan(0);
      expect(response.body.impact).toBe('NEGATIVE');
    });

    it('should validate against minimum margin constraints', async () => {
      const offerId = 'test-offer-002';
      
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit/impact/${offerId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({
          newPrice: 355, // Very low price
          offerType: 'BUYER',
        })
        .expect(200);

      expect(response.body).toHaveProperty('violatesMinimum', true);
      expect(response.body).toHaveProperty('warning');
      expect(response.body.warning).toContain('below minimum margin');
      expect(response.body.recommendation).toBe('REJECT');
    });
  });

  describe('Profit Validation', () => {
    it('should validate profit meets business rules', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/profit/validation`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty('isValid');
      expect(response.body).toHaveProperty('validations');
      
      const validations = response.body.validations;
      expect(validations).toHaveProperty('minimumMargin');
      expect(validations.minimumMargin).toHaveProperty('required', 5);
      expect(validations.minimumMargin).toHaveProperty('actual');
      expect(validations.minimumMargin).toHaveProperty('passed');

      expect(validations).toHaveProperty('targetMargin');
      expect(validations.targetMargin).toHaveProperty('target', 7.5);
      expect(validations.targetMargin).toHaveProperty('actual');
      expect(validations.targetMargin).toHaveProperty('achieved');

      expect(validations).toHaveProperty('absoluteProfit');
      expect(validations.absoluteProfit).toHaveProperty('amount');
      expect(validations.absoluteProfit).toHaveProperty('sufficient');

      expect(response.body).toHaveProperty('recommendations');
    });

    it('should provide improvement suggestions when margin is low', async () => {
      // Create a trade operation with low margin potential
      const lowMarginResponse = await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          targetProfitMargin: 5, // Minimum margin
        })
        .expect(201);

      const lowMarginTradeId = lowMarginResponse.body.id;

      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${lowMarginTradeId}/profit/validation`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body.validations.minimumMargin.passed).toBe(true);
      expect(response.body.validations.targetMargin.achieved).toBe(false);
      
      expect(response.body).toHaveProperty('improvements');
      expect(response.body.improvements).toBeInstanceOf(Array);
      expect(response.body.improvements.length).toBeGreaterThan(0);
      
      // Should suggest specific improvements
      const suggestions = response.body.improvements.map((i: any) => i.type);
      expect(suggestions).toContain('NEGOTIATE_BUYER_PRICE');
      expect(suggestions).toContain('REDUCE_SELLER_PRICES');
      expect(suggestions).toContain('OPTIMIZE_TRANSPORT');
    });
  });
});