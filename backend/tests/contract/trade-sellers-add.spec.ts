import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('POST /api/trade-operations/:id/sellers - Add Sellers Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();
  }, 90000);

  afterAll(async () => {
    await env.teardown();
  }, 90000);

  beforeEach(async () => {
    await env.prisma.offerRound.deleteMany({});
    await env.prisma.offerNegotiation.deleteMany({});
    await env.prisma.tradeSeller.deleteMany({});
    await env.prisma.tradeOperation.deleteMany({});

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
  }, 90000);

  describe('Request/Response Contract', () => {
    it('should add multiple sellers to trade operation', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [
            {
              sellerId: testData.users.seller1.id,
              saleListingId: testData.saleListings[0].id,
              requestedQuantity: 50,
            },
            {
              sellerId: testData.users.seller2.id,
              saleListingId: testData.saleListings[1].id,
              requestedQuantity: 40,
            }
          ],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('success'),
        sellersAdded: expect.any(Array),
      });
      expect(response.body.sellersAdded).toHaveLength(2);
      expect(response.body.sellersAdded[0]).toMatchObject({
        sellerId: testData.users.seller1.id,
        saleListingId: testData.saleListings[0].id,
        status: 'INVITED',
      });
    });

    it('should return 404 for non-existent trade operation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations/non-existent-id/sellers')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }],
        })
        .expect(404);
    });

    it('should prevent adding the same listing twice', async () => {
      // 1. Add once
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }],
        })
        .expect(201);

      // 2. Try to add again
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 5,
          }],
        })
        .expect(400);
    });

    it('should validate quantity is positive', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: -5,
          }],
        })
        .expect(400);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }],
        })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }],
        })
        .expect(403);
    });
  });
});
