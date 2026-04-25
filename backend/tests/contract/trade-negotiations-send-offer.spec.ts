import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { UserRole } from '@prisma/client';

describe('POST /api/negotiations/trade-operations/:id/offers - Send Offers Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;
  let tradeSellerId: string;

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

    // Create a trade operation for testing offers
    const createResponse = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = createResponse.body.tradeOperationId;

    // Add a seller to the trade
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

    tradeSellerId = addSellerResponse.body.sellersAdded[0].id;
  }, 30000);

  describe('Send Initial Offer', () => {
    it('should create new negotiation with PENDING status', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 340,
          quantity: 50,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          status: 'PENDING',
          currentOffer: expect.objectContaining({
            price: 340,
            quantity: 50,
          }),
        }),
      });
    });

    it('should update existing negotiation if one already exists for the tradeSeller (upsert)', async () => {
      // First offer
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 340,
          quantity: 50,
        })
        .expect(201);

      // Second offer - service uses upsert now
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 345,
          quantity: 50,
        })
        .expect(201);

      expect(response.body.data.currentOffer.price).toBe(345);
    });

    it('should set expiration time to 48 hours by default', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 340,
          quantity: 50,
        })
        .expect(201);

      expect(response.body.data).toHaveProperty('expiresAt');
      const expiresAt = new Date(response.body.data.expiresAt);
      const now = new Date();
      const diffHours = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(47);
      expect(diffHours).toBeLessThan(49);
    });

    it('should validate price is positive', async () => {
      // Validation error will NOT be wrapped in success: false by Nest automatically if it hits ValidationPipe first
      // unless the controller catches it. 
      // In this controller, sendOffer has a try-catch, but ValidationPipe is BEFORE it.
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: tradeSellerId,
          price: -10,
          quantity: 50,
        })
        .expect(400);
    });
  });

  describe('Batch Send Offers', () => {
    it('should send offers to multiple sellers', async () => {
      // Add another seller first
      const addSellerResponse = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [
            {
              sellerId: testData.users.seller2.id,
              saleListingId: testData.saleListings[1].id,
              requestedQuantity: 40,
            },
          ],
        })
        .expect(201);
      
      const tradeSeller2Id = addSellerResponse.body.sellersAdded[0].id;

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers/batch`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          offers: [
            {
              tradeSellerId: tradeSellerId,
              price: 340,
              quantity: 50,
            },
            {
              tradeSellerId: tradeSeller2Id,
              price: 345,
              quantity: 40,
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('created', 2);
      expect(response.body.data).toHaveProperty('failed', 0);
      expect(response.body.data.negotiations).toHaveLength(2);
    });
  });
});
