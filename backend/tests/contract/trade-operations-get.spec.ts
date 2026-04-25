import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('GET /api/trade-operations/:id - Contract Test', () => {
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
    const response = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    expect(response.body.tradeOperationId).toBeDefined();
    expect(typeof response.body.tradeOperationId).toBe('string');

    tradeOperationId = response.body.tradeOperationId;
  }, 30000);

  describe('Response Contract', () => {
    it('should return complete trade operation details', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      // Verify response schema (direct object)
      expect(response.body).toMatchObject({
        id: tradeOperationId,
        phase: expect.any(String),
        status: expect.any(String),
        sellers: expect.any(Array),
      });
    });

    it('should return 404 for non-existent trade', async () => {
      await request(env.app.getHttpServer())
        .get('/api/trade-operations/non-existent-id')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(404);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}`)
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);
    });

    it('should deny non-admin users', async () => {
      await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .expect(403);
    });
  });
});
