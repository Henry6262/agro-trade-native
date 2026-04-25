import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/counter - Counter Offer Contract Test', () => {
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

  describe('Counter Offer', () => {
    it('should counter an offer and update status to COUNTERED', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({
          price: 345,
          quantity: 50,
          terms: 'Revised terms from seller',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: negotiationId,
          status: 'COUNTERED',
          counterOffer: expect.objectContaining({
            price: 345,
            quantity: 50,
          }),
        }),
      });

      // Verify history
      expect(response.body.data.offerHistory).toHaveLength(2);
    });

    it('should validate counter price is positive', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({
          price: -10,
          quantity: 50,
        })
        .expect(400);
    });

    it('should add profit warning when margin is low', async () => {
      // Set selling price low to trigger margin warning on high counter
      await env.prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: { sellingPrice: 350 }
      });

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({
          price: 348, // Very small margin
          quantity: 50,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('profitImpact');
      expect(response.body.data.profitImpact).toHaveProperty('warning');
    });

    it('should return 404 for non-existent negotiation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/negotiations/non-existent-id/counter')
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({ price: 340, quantity: 50 })
        .expect(404);
    });
  });
});
