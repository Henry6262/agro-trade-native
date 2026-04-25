import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/withdraw - Withdraw Offer Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let negotiationId: string;
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

    // Add a seller and create a negotiation
    const addSellerResponse = await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/sellers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 50,
          },
        ],
      })
      .expect(201);

    const tradeSellerId = addSellerResponse.body.sellersAdded[0].id;

    const offerResponse = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId: tradeSellerId,
        price: 335,
        quantity: 50,
      })
      .expect(201);

    negotiationId = offerResponse.body.data.id;
  }, 30000);

  describe('Withdraw Offer', () => {
    it('should withdraw offer and update status to WITHDRAWN', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/withdraw`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          reason: 'Changed negotiation strategy',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: negotiationId,
        status: 'WITHDRAWN',
      });
    });

    it('should return 404 for non-existent negotiation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/negotiations/non-existent-id/withdraw')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          reason: 'Not found',
        })
        .expect(404);
    });

    it('should only allow admin to withdraw negotiations', async () => {
      // Buyer trying to withdraw should get 403
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/withdraw`)
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .send({
          reason: 'Buyer trying to withdraw',
        })
        .expect(403);
    });
  });
});
