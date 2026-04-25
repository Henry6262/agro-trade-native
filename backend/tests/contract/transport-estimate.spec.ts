import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('POST /api/trade-operations/calculate-transport - Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;

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
  }, 30000);

  describe('Request/Response Contract', () => {
    it('should calculate transport costs for sellers to buyer address', async () => {
      // Need a buyer address ID - seedTestData creates a buyer but we need their address
      const buyer = await env.prisma.user.findUnique({
        where: { id: testData.users.buyer.id },
        include: { addresses: true }
      });
      
      const buyerAddress = await env.prisma.address.create({
        data: {
          user: { connect: { id: buyer!.id } },
          addressType: 'OTHER',
          street: "Buyer Street",
          country: "Bulgaria",
          latitude: 42.6977,
          longitude: 23.3219,
        }
      });

      // Also need an address for the seller
      await env.prisma.address.create({
        data: {
          user: { connect: { id: testData.users.seller1.id } },
          addressType: 'FARM',
          street: "Seller Street",
          country: "Bulgaria",
          latitude: 42.1,
          longitude: 23.2,
        }
      });

      const response = await request(env.app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellerIds: [testData.users.seller1.id],
          buyerAddressId: buyerAddress.id,
        });
      
      if (response.status !== 200) {
        console.log('DEBUG calculate-transport Failure:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        totalCost: expect.any(Number),
        currency: 'EUR',
        results: expect.arrayContaining([
          expect.objectContaining({
            sellerId: testData.users.seller1.id,
            distance: expect.any(Number),
            transportCost: expect.any(Number),
          })
        ])
      });
    });

    it('should reject requests with empty seller list', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellerIds: [],
          buyerAddressId: 'some-id',
        })
        .expect(400);
    });

    it('should reject requests without buyerAddressId', async () => {
      await request(env.app.getHttpServer())
        .post('/api/trade-operations/calculate-transport')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          sellerIds: [testData.users.seller1.id],
        })
        .expect(400);
    });
  });
});
