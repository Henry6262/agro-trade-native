import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { TradeStatus, TradePhase } from '@prisma/client';

describe('PATCH /api/trade-operations/:id - Update Trade Contract Test', () => {
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

    tradeOperationId = response.body.tradeOperationId;
  }, 30000);

  describe('Update Trade Operation', () => {
    it('should update trade status and phase', async () => {
      const response = await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          status: TradeStatus.ACTIVE,
          phase: TradePhase.SELLER_MATCHING,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: tradeOperationId,
        status: TradeStatus.ACTIVE,
        phase: TradePhase.SELLER_MATCHING,
      });

      // Verify DB update
      const updated = await env.prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId }
      });
      expect(updated?.phase).toBe(TradePhase.SELLER_MATCHING);
    });

    it('should update selling price and total revenue', async () => {
      const response = await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellingPrice: 395,
        })
        .expect(200);

      // Verify profit estimation reflects new price
      expect(response.body.profit).toHaveProperty('margin');
    });

    it('should validate phase transitions during update', async () => {
      // Transition INITIATION -> IN_TRANSIT is invalid
      await request(env.app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          phase: TradePhase.IN_TRANSIT,
        })
        .expect(400);
    });

    it('should return 404 for non-existent trade', async () => {
      await request(env.app.getHttpServer())
        .patch('/api/trade-operations/non-existent-id')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ status: TradeStatus.ACTIVE })
        .expect(404);
    });
  });
});
