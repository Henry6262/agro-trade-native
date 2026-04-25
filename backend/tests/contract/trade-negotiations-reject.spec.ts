import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/reject - Reject Offer Contract Test', () => {
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
      .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId: tradeSellerId,
        price: 335,
        quantity: 50,
      })
      .expect(201);

    negotiationId = offerResponse.body.data.id;
  }, 30000);

  describe('Reject Offer', () => {
    it('should reject offer and update status to REJECTED', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({
          reason: 'Price too low',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: negotiationId,
        status: 'REJECTED',
      });

      // Verify database updates
      const updated = await env.prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('REJECTED');
    });

    it('should re-activate sale listing upon rejection', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({
          reason: 'Not interested',
        })
        .expect(200);

      // Verify sale listing is ACTIVE
      const listing = await env.prisma.saleListing.findUnique({
        where: { id: testData.saleListings[0].id },
      });
      expect(listing?.status).toBe('ACTIVE');
    });

    it('should update trade seller status to REJECTED', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/reject`)
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({})
        .expect(200);

      const nego = await env.prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });

      const tradeSeller = await env.prisma.tradeSeller.findUnique({
        where: { id: nego!.tradeSellerId },
      });
      expect(tradeSeller?.status).toBe('REJECTED');
    });

    it('should return 404 for non-existent negotiation', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/negotiations/non-existent-id/reject')
        .set('Authorization', `Bearer ${env.tokens.seller}`)
        .send({})
        .expect(404);
    });
  });
});
