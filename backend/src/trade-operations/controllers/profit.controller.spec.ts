import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('ProfitController (e2e)', () => {
  let app: INestApplication;
  const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTcwNDAwMDAwMH0.mock-signature';
  const authToken = `Bearer ${mockAdminToken}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/profit/:tradeOperationId/calculate (GET)', () => {
    it('should calculate profit for trade operation', async () => {
      const tradeOpId = 'trade-op-789';

      const response = await request(app.getHttpServer())
        .get(`/api/profit/${tradeOpId}/calculate`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('profit');
      expect(response.body.profit).toHaveProperty('grossProfit');
      expect(response.body.profit).toHaveProperty('netProfit');
      expect(response.body.profit).toHaveProperty('profitMargin');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body.breakdown).toHaveProperty('revenue');
      expect(response.body.breakdown).toHaveProperty('purchaseCosts');
      expect(response.body.breakdown).toHaveProperty('transportCosts');
    });

    it('should fail without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/profit/trade-op-789/calculate')
        .expect(401);
    });
  });

  describe('/api/profit/:tradeOperationId/impact (POST)', () => {
    it('should calculate profit impact of price change', async () => {
      const tradeOpId = 'trade-op-789';
      const impactDto = {
        newPrice: 375,
        quantity: 100,
        offerType: 'BUYER',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/impact`)
        .set('Authorization', authToken)
        .send(impactDto)
        .expect(201);

      expect(response.body).toHaveProperty('estimatedProfit');
      expect(response.body).toHaveProperty('profitMargin');
      expect(response.body).toHaveProperty('profitChange');
      expect(response.body).toHaveProperty('viability');
    });

    it('should warn about low profit margins', async () => {
      const tradeOpId = 'trade-op-789';
      const impactDto = {
        newPrice: 390, // High price that reduces margin
        quantity: 100,
        offerType: 'BUYER',
      };

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/impact`)
        .set('Authorization', authToken)
        .send(impactDto)
        .expect(201);

      expect(response.body).toHaveProperty('warning');
      expect(response.body.viability).toBe('MARGINAL');
    });
  });

  describe('/api/profit/:tradeOperationId/optimize (POST)', () => {
    it('should optimize profit margins', async () => {
      const tradeOpId = 'trade-op-789';
      const optimizeDto = {
        targetMargin: 8,
        constraints: {
          maxBuyerPrice: 380,
          minSellerPrice: 340,
          maxTransportCost: 15,
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/optimize`)
        .set('Authorization', authToken)
        .send(optimizeDto)
        .expect(201);

      expect(response.body).toHaveProperty('optimizedPrices');
      expect(response.body.optimizedPrices).toHaveProperty('buyerPrice');
      expect(response.body.optimizedPrices).toHaveProperty('sellerPrices');
      expect(response.body).toHaveProperty('expectedProfit');
      expect(response.body).toHaveProperty('expectedMargin');
      expect(response.body.expectedMargin).toBeGreaterThanOrEqual(7);
    });
  });

  describe('/api/profit/validate-margins (POST)', () => {
    it('should validate multiple profit margins', async () => {
      const validateDto = {
        operations: [
          {
            tradeOperationId: 'trade-op-1',
            sellingPrice: 375,
            purchasePrice: 350,
            transportCost: 10,
            quantity: 100,
          },
          {
            tradeOperationId: 'trade-op-2',
            sellingPrice: 360,
            purchasePrice: 340,
            transportCost: 12,
            quantity: 80,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/profit/validate-margins')
        .set('Authorization', authToken)
        .send(validateDto)
        .expect(201);

      expect(response.body).toHaveProperty('validations');
      expect(response.body.validations).toBeInstanceOf(Array);
      expect(response.body.validations[0]).toHaveProperty('tradeOperationId');
      expect(response.body.validations[0]).toHaveProperty('isViable');
      expect(response.body.validations[0]).toHaveProperty('profitMargin');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.summary).toHaveProperty('totalViable');
    });
  });

  describe('/api/profit/cumulative (GET)', () => {
    it('should get cumulative profit across operations', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profit/cumulative')
        .set('Authorization', authToken)
        .query({ 
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('totalCosts');
      expect(response.body).toHaveProperty('totalProfit');
      expect(response.body).toHaveProperty('averageMargin');
      expect(response.body).toHaveProperty('operationCount');
      expect(response.body).toHaveProperty('breakdown');
    });
  });

  describe('/api/profit/forecast (POST)', () => {
    it('should forecast profit for future operations', async () => {
      const forecastDto = {
        expectedOperations: [
          {
            product: 'Wheat',
            expectedQuantity: 500,
            expectedBuyerPrice: 375,
            expectedSellerPrice: 350,
            estimatedTransportCost: 12,
          },
          {
            product: 'Corn',
            expectedQuantity: 300,
            expectedBuyerPrice: 320,
            expectedSellerPrice: 295,
            estimatedTransportCost: 10,
          },
        ],
        period: '2024-Q1',
      };

      const response = await request(app.getHttpServer())
        .post('/api/profit/forecast')
        .set('Authorization', authToken)
        .send(forecastDto)
        .expect(201);

      expect(response.body).toHaveProperty('forecastedProfit');
      expect(response.body).toHaveProperty('forecastedMargin');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body.breakdown).toBeInstanceOf(Array);
    });
  });

  describe('/api/profit/benchmarks (GET)', () => {
    it('should get profit benchmarks and targets', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/profit/benchmarks')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('minimumMargin', 5);
      expect(response.body).toHaveProperty('targetMargin', 7);
      expect(response.body).toHaveProperty('optimalMargin', 10);
      expect(response.body).toHaveProperty('industryAverage');
      expect(response.body).toHaveProperty('currentPerformance');
    });
  });
});