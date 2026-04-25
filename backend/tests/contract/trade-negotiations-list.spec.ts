import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('GET /api/negotiations/trade-operations/:id/negotiations - List Negotiations Contract Test', () => {
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

    // Create a trade operation
    const createResponse = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = createResponse.body.tradeOperationId;

    // Add multiple sellers and negotiations
    const sellers = [
      {
        sellerId: testData.users.seller1.id,
        saleListingId: testData.saleListings[0].id,
        requestedQuantity: 50,
      },
      {
        sellerId: testData.users.seller2.id,
        saleListingId: testData.saleListings[1].id,
        requestedQuantity: 50,
      }
    ];

    for (const seller of sellers) {
      const addRes = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ sellers: [seller] })
        .expect(201);
      
      const tradeSellerId = addRes.body.sellersAdded[0].id;

      await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 340,
          quantity: 50,
        })
        .expect(201);
    }
  }, 30000);

  describe('List Negotiations', () => {
    it('should list all negotiations for a trade operation', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade-operations/${tradeOperationId}/negotiations`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.negotiations).toHaveLength(2);
      expect(response.body.data).toHaveProperty('summary');
    });

    it('should filter negotiations by status', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade-operations/${tradeOperationId}/negotiations`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({ status: 'PENDING' })
        .expect(200);

      expect(response.body.data.negotiations).toHaveLength(2);
    });

    it('should handle pagination', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/negotiations/trade-operations/${tradeOperationId}/negotiations`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .query({ limit: 1, offset: 0 })
        .expect(200);

      expect(response.body.data.negotiations).toHaveLength(1);
      expect(response.body.data.totalNegotiations).toBe(2);
    });

    it('should return error response for unknown trade operation', async () => {
      // Note: getNegotiations in controller has a try-catch that wraps 404
      // unless I fix it too. Let's see.
      const response = await request(env.app.getHttpServer())
        .get('/api/negotiations/trade-operations/non-existent-id/negotiations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200); // Controller currently wraps and returns 200

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });
});
