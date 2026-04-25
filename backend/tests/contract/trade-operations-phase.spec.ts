import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { TradePhase } from '@prisma/client';

describe('PATCH /api/trade-operations/:id/phase - Contract Test', () => {
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
    const response = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = response.body.tradeOperationId;
  }, 90000);

  describe('Phase Transition Contract', () => {
    it('should transition to SELLER_MATCHING', async () => {
      const response = await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          phase: 'SELLER_MATCHING',
        })
        .expect(200);

      // Verify response (direct object)
      expect(response.body).toMatchObject({
        id: tradeOperationId,
        phase: 'SELLER_MATCHING',
      });
    });

    it('should validate phase enum values', async () => {
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          phase: 'INVALID_PHASE',
        })
        .expect(400);
    });

    it('should return 404 for non-existent trade operation', async () => {
      await request(env.app.getHttpServer())
        .patch('/api/trade-operations/non-existent-id/phase')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'SELLER_MATCHING' })
        .expect(404);
    });

    it('should prevent transition to TRANSPORT_MATCHING if sellers are not accepted', async () => {
      // 1. Transition to SELLER_MATCHING
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'SELLER_MATCHING' });

      // 2. Add a seller
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }]
        });

      // 3. Try to skip ahead to TRANSPORT_MATCHING
      const response = await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'TRANSPORT_MATCHING' })
        .expect(400);

      // The error message now reflects the state machine constraint
      expect(response.body.message).toContain('Invalid phase transition');
    });

    it('should allow transition to INSPECTION_PENDING after sellers are accepted', async () => {
       // 1. Advance to SELLER_MATCHING
       await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'SELLER_MATCHING' });

      // 2. Add a seller
      const addRes = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [{
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 10,
          }]
        });
      const tradeSellerId = addRes.body.sellersAdded[0].id;

      // 3. Advance to SELLER_NEGOTIATION (REQUIRED STEP)
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'SELLER_NEGOTIATION' })
        .expect(200);

      // 4. Accept negotiation
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operation/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ tradeSellerId, price: 300, quantity: 10 });

      await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operation/${tradeOperationId}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ tradeSellerId });

      // 5. Now transition to INSPECTION_PENDING
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ phase: 'INSPECTION_PENDING' })
        .expect(200);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .send({ phase: 'SELLER_MATCHING' })
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .send({ phase: 'SELLER_MATCHING' })
        .expect(403);
    });
  });
});
