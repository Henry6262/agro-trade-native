import request from 'supertest';
import { TestEnvironment } from '../setup/test-environment';

describe('Profit Calculations (E2E)', () => {
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
    const tradeRes = await request(env.app.getHttpServer())
      .post("/api/trade-operations")
      .set("Authorization", `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        adminId: testData.users.admin.id,
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 50,
            offerPrice: 340
          }
        ],
      })
      .expect(201);

    tradeOperationId = tradeRes.body.tradeOperationId || tradeRes.body.id;
  }, 30000);

  it('should get profit metrics for a trade operation', async () => {
    const response = await request(env.app.getHttpServer())
      .get(`/api/trade-operations/${tradeOperationId}/profit`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .expect(200);

    // TradeOperationService returns direct object, not wrapped in data
    expect(response.body).toHaveProperty('netProfit');
    expect(response.body).toHaveProperty('margin');
  });
});
