import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('POST /api/trade-operations - Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();
  }, 30000);

  afterAll(async () => {
    await env.teardown();
  });

  beforeEach(async () => {
    await env.cleanDatabase();
    // Re-seed essential data after each clean
    testData = await env.seedTestData();
  }, 30000);

  describe('Request/Response Contract', () => {
    it('should create trade operation from buy listing', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          sellers: [],
        })
        .expect(201);

      // Verify response schema (direct object, not wrapped in data)
      expect(response.body).toMatchObject({
        tradeOperationId: expect.any(String),
        operationNumber: expect.stringMatching(/^OP-\d+$/),
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
      });
    });

    it('should return existing trade operation if one already exists for the buy listing', async () => {
      // Create first one
      const firstResponse = await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          sellers: [],
        })
        .expect(201);

      const firstId = firstResponse.body.tradeOperationId;

      // Try to create again - controller returns existing one (idempotent)
      const response = await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          sellers: [],
        })
        .expect(201);

      expect(response.body.tradeOperationId).toEqual(firstId);
    });

    it('should validate required fields (missing buyListingId)', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [],
        })
        .expect(400);

      const message = Array.isArray(response.body.message) ? response.body.message.join(", ") : response.body.message;
      expect(message).toContain('buyListingId');
    });

    it('should reject non-existent buy listing', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: 'non-existent-id',
          sellers: [],
        })
        .expect(404);
    });

    it('should reject inactive buy listings', async () => {
      // Cancel the buy listing
      await env.prisma.buyListing.update({
        where: { id: testData.buyListing.id },
        data: { status: 'CANCELLED' },
      });

      await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          sellers: [],
        })
        .expect(400);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .send({ buyListingId: testData.buyListing.id, sellers: [] })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .send({ buyListingId: testData.buyListing.id, sellers: [] })
        .expect(403);
    });
  });
});
