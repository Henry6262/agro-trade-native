import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('POST /api/scenarios/generate - Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
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

  describe('Scenario Generation Contract', () => {
    it('should generate multiple pricing scenarios', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/scenarios/generate')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: tradeOperationId,
          scenarioCount: 10,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        scenarios: expect.any(Array),
        optimal: expect.any(Object),
        statistics: expect.objectContaining({
          viableCount: expect.any(Number),
          averageMargin: expect.any(Number),
        }),
        recommendations: expect.any(Array),
      });
      
      expect(response.body.scenarios.length).toBeGreaterThan(0);
    });

    it('should include quality factors in generation', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/scenarios/generate')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: tradeOperationId,
          includeQualityFactors: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should return 404 for non-existent trade operation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/scenarios/generate')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: 'non-existent-id',
        })
        .expect(404);
    });
  });
});
