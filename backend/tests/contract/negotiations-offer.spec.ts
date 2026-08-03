import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('Negotiations Offer Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
  }, 90000);

  afterAll(async () => {
    await env.teardown();
  }, 90000);

  beforeEach(async () => {
    await env.cleanDatabase();
    testData = await env.seedTestData();

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

  it('should create negotiation via frontend route', async () => {
    // Add seller first
    const addRes = await request(env.app.getHttpServer())
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

    const tradeSellerId = addRes.body.sellersAdded[0].id;

    const response = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId: tradeSellerId,
        price: 340,
        quantity: 50,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      status: 'PENDING',
      currentOffer: {
        price: 340,
        quantity: 50,
      },
    });
  }, 30000);

  it('should allow seller to counter an offer', async () => {
    // 1. Setup trade + seller + initial offer
    const addRes = await request(env.app.getHttpServer())
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

    const tradeSellerId = addRes.body.sellersAdded[0].id;

    const offerResponse = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({ tradeSellerId, price: 300, quantity: 50 })
      .expect(201);

    // 2. Counter as seller
    const response = await request(env.app.getHttpServer())
      .post(`/api/negotiations/${offerResponse.body.data.id}/counter`)
      .set('Authorization', `Bearer ${env.tokens.seller}`)
      .send({
        price: 320,
        quantity: 50,
      })
      .expect(201);

    expect(response.body.data.status).toBe('COUNTERED');
    expect(response.body.data.counterOffer.price).toBe(320);
  }, 30000);

  it('should allow admin to accept a counter-offer and update profit', async () => {
    // 1. Setup trade + counter
    const addRes = await request(env.app.getHttpServer())
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

    const tradeSellerId = addRes.body.sellersAdded[0].id;

    const offerResponse = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({ tradeSellerId, price: 300, quantity: 50 })
      .expect(201);

    await request(env.app.getHttpServer())
      .post(`/api/negotiations/${offerResponse.body.data.id}/counter`)
      .set('Authorization', `Bearer ${env.tokens.seller}`)
      .send({ price: 320, quantity: 50 })
      .expect(201);

    // 2. Accept as admin
    await request(env.app.getHttpServer())
      .post(`/api/negotiations/${offerResponse.body.data.id}/accept`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({})
      .expect(200);

    // 3. Verify trade status and profit
    const tradeRes = await request(env.app.getHttpServer())
      .get(`/api/trade-operations/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .expect(200);

    expect(tradeRes.body.totalPurchaseCost).toBeDefined();
    // Purchase cost should be 50 * 320 = 16000
    expect(Number(tradeRes.body.totalPurchaseCost)).toBe(16000);
  }, 30000);

  it('should validate minimum price requirements', async () => {
    const addRes = await request(env.app.getHttpServer())
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
      });
    const tradeSellerId = addRes.body.sellersAdded[0].id;

    await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId,
        price: -10, // Invalid price
        quantity: 50,
      })
      .expect(400);
  });
});
