import request from 'supertest';
import { TestEnvironment } from '../setup/test-environment';

describe('Negotiations (E2E)', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();
  }, 30000);

  afterAll(async () => {
    await env.teardown();
  }, 30000);

  beforeEach(async () => {
    await env.cleanDatabase();
    testData = await env.seedTestData();

    // Create a trade operation
    const response = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = response.body.tradeOperationId;
  }, 30000);

  it('should handle full negotiation flow (Offer -> Counter -> Accept)', async () => {
    // 1. Add seller
    const addRes = await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/sellers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        sellers: [{
          sellerId: testData.users.seller1.id,
          saleListingId: testData.saleListings[0].id,
          requestedQuantity: 50,
        }]
      })
      .expect(201);
    
    const tradeSellerId = addRes.body.sellersAdded[0].id;

    // 2. Admin sends offer
    const offRes = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId: tradeSellerId,
        price: 330,
        quantity: 50,
      })
      .expect(201);
    
    const negoId = offRes.body.data.id;

    // 3. Seller counters
    const countRes = await request(env.app.getHttpServer())
      .post(`/api/negotiations/${negoId}/counter`)
      .set('Authorization', `Bearer ${env.tokens.seller}`)
      .send({
        price: 345,
        quantity: 50,
        terms: 'Revised terms'
      })
      .expect(201);

    expect(countRes.body.data.status).toBe('COUNTERED');

    // 4. Admin accepts counter
    const accRes = await request(env.app.getHttpServer())
      .post(`/api/negotiations/${negoId}/accept`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({})
      .expect(200);

    expect(accRes.body.status).toBe('ACCEPTED');
    expect(accRes.body.finalPrice).toBe("345");
  });

  it('should handle batch offers', async () => {
    // 1. Add 2 sellers
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
          {
            sellerId: testData.users.seller2.id,
            saleListingId: testData.saleListings[1].id,
            requestedQuantity: 50,
          }
        ]
      })
      .expect(201);
    
    const ts1 = addRes.body.sellersAdded[0].id;
    const ts2 = addRes.body.sellersAdded[1].id;

    // 2. Batch send offers
    const batchRes = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers/batch`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        offers: [
          { tradeSellerId: ts1, price: 330, quantity: 50 },
          { tradeSellerId: ts2, price: 335, quantity: 50 }
        ]
      })
      .expect(201);

    expect(batchRes.body.success).toBe(true);
    expect(batchRes.body.data.created).toBe(2);
    expect(batchRes.body.data.negotiations).toHaveLength(2);
  });
});
