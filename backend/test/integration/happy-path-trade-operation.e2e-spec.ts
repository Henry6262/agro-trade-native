import request from 'supertest';
import { TestEnvironment } from '../setup/test-environment';

describe('Partial Happy Path Trade Operation (Instrumented E2E)', () => {
  let env: TestEnvironment;
  let testData: any;

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
  }, 30000);

  it('should complete partial trade operation lifecycle with instrumented shortcuts', async () => {
    // 1. Create trade operation
    const createRes = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    const tradeOperationId = createRes.body.tradeOperationId;

    // 2. Find and add sellers
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

    // 3. Send offers to both
    const negotiations = [];
    for (const seller of addRes.body.sellersAdded) {
      const offRes = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeSellerId: seller.id,
          price: 330,
          quantity: 50,
        })
        .expect(201);
      expect(offRes.body.success).not.toBe(false);
      expect(offRes.body.data ?? offRes.body).toBeDefined();
      negotiations.push(offRes.body.data ?? offRes.body);
    }

    // 4. Accept offers
    for (const nego of negotiations) {
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${nego.id}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({})
        .expect(200);
    }

    // 5. Check if phase transitioned to INSPECTION_PENDING (via auto-create)
    const getRes = await request(env.app.getHttpServer())
      .get(`/api/trade-operations/${tradeOperationId}`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .expect(200);

    // After all sellers accepted, phase should move forward
    expect(getRes.body.phase).toBe('INSPECTION_PENDING');

    // 6. Finalize (force delivered phase first for the test)
    await env.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { phase: 'DELIVERED' }
    });

    const finRes = await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/finalize`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({})
      .expect(200);

    expect(finRes.body.success).toBe(true);
    expect(finRes.body.profitMargin).toBeGreaterThan(5);
  }, 60000);
});
