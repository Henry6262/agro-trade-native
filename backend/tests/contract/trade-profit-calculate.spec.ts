import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('GET /api/profit/:tradeOperationId/calculate - Calculate Profit Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
  }, 30000);

  afterAll(async () => {
    await env.teardown();
  });

  beforeEach(async () => {
    await env.cleanDatabase();
    testData = await env.seedTestData();

    // Create a trade operation with sellers and agreed prices to have profit data
    const response = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = response.body.tradeOperationId;

    // Add accepted seller
    await env.prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: testData.users.seller1.id,
        saleListingId: testData.saleListings[0].id,
        requestedQuantity: 50,
        offeredQuantity: 50,
        unit: 'TON',
        status: 'ACCEPTED',
        agreedPrice: 340,
        agreedQuantity: 50,
      }
    });

    // Update trade operation selling price
    await env.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { 
        sellingPrice: 380,
        totalRevenue: 19000 // 50 * 380
      }
    });
  }, 30000);

  describe('Response Contract', () => {
    it('should calculate and return profit data', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/profit/${tradeOperationId}/calculate`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty('profit');
      expect(response.body.profit).toMatchObject({
        grossProfit: expect.any(Number),
        netProfit: expect.any(Number),
        profitMargin: expect.any(Number),
      });
      
      expect(response.body).toHaveProperty('breakdown');
      expect(response.body.breakdown).toMatchObject({
        revenue: expect.any(Number),
        purchaseCosts: expect.any(Number),
        transportCosts: expect.any(Number),
      });
    });

    it('should return 404 for non-existent trade', async () => {
      await request(env.app.getHttpServer())
        .get('/api/profit/non-existent-id/calculate')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(404);
    });
  });
});
