import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { InspectionStatus, InspectionPriority } from '@prisma/client';

describe('POST /api/inspections - Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;
  let saleListingId: string;

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
    saleListingId = testData.saleListings[0].id;
  }, 30000);

  describe('Request/Response Contract', () => {
    it('should create inspection request for sale listing', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
          priority: 'HIGH',
          notes: 'Urgent inspection needed',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        tradeOperationId: tradeOperationId,
        priority: 'HIGH',
        status: 'PENDING',
        saleListing: expect.objectContaining({
          id: saleListingId,
          product: expect.objectContaining({
            id: testData.product.id,
          }),
          seller: expect.objectContaining({
            id: testData.users.seller1.id,
          }),
        }),
      });
    });

    it('should validate priority enum', async () => {
      await request(env.app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
          priority: 'INVALID_PRIORITY',
        })
        .expect(400);
    });

    it('should return 404 for non-existent sale listing', async () => {
      await request(env.app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: 'non-existent-id',
        })
        .expect(404);
    });
  });

  describe('Authorization Contract', () => {
    it('should require authentication', async () => {
      await request(env.app.getHttpServer())
        .post('/api/inspections')
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingId,
        })
        .expect(401);
    });
  });
});
