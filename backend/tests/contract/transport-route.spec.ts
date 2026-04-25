import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('POST /api/trade-operations/:id/optimize-transport - Contract Test', () => {
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
    const createResponse = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = createResponse.body.tradeOperationId;

    // Add sellers and their addresses
    const sellers = [testData.users.seller1, testData.users.seller2];
    const coords = [
      { lat: 42.1, lng: 23.2 },
      { lat: 42.2, lng: 23.3 }
    ];

    for (let i = 0; i < sellers.length; i++) {
      await env.prisma.address.create({
        data: {
          user: { connect: { id: sellers[i].id } },
          addressType: 'FARM',
          street: `Seller ${i+1} Street`,
          country: "Bulgaria",
          latitude: coords[i].lat,
          longitude: coords[i].lng,
        }
      });

      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [
            {
              sellerId: sellers[i].id,
              saleListingId: testData.saleListings[i].id,
              requestedQuantity: 50,
            },
          ],
        })
        .expect(201);
    }
  }, 30000);

  describe('Transport Optimization Contract', () => {
    it('should optimize transport route for a trade operation', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ algorithm: 'TSP_NEAREST' })
        .expect(200);

      expect(response.body).toMatchObject({
        message: expect.stringContaining('optimized'),
        optimizedRoute: expect.objectContaining({
          totalDistance: expect.any(Number),
          sequence: expect.any(Array),
        })
      });
    });

    it('should support different optimization algorithms', async () => {
      const algorithms = ['TSP_NEAREST', 'GENETIC'];
      
      for (const algorithm of algorithms) {
        await request(env.app.getHttpServer())
          .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
          .set('Authorization', `Bearer ${env.tokens.admin}`)
          .send({ algorithm })
          .expect(200);
      }
    });

    it('should return 404 for non-existent trade operation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations/00000000-0000-0000-0000-000000000000/optimize-transport')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({ algorithm: 'TSP_NEAREST' })
        .expect(404);
    });
  });
});
