import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('GET /api/trade-operations/:id/profit - Contract Test', () => {
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
    it('should return profit calculation details', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          tradeOperationId: tradeOperationId,
          revenue: expect.objectContaining({
            sellingPrice: 380,
            quantity: 50, // Agreed quantity from trade seller
            totalRevenue: 19000,
          }),
          costs: expect.objectContaining({
            purchases: expect.objectContaining({
              totalCost: 17000, // 50 * 340
              avgPrice: 340,
            }),
            totalCosts: expect.any(Number),
          }),
          profit: expect.objectContaining({
            grossProfit: expect.any(Number),
            netProfit: expect.any(Number),
            profitMargin: expect.any(Number),
            currency: 'EUR',
          }),
        }),
      });
    });

    it('should return 404 for non-existent trade', async () => {
      await request(env.app.getHttpServer())
        .get('/api/trade-operations/non-existent-id/profit')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(404);
    });
  });
});
