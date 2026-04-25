import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('/api/buyer/listings - Buyer Listings Contract Test', () => {
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

  describe('GET /api/buyer/listings', () => {
    it('should list buyer listings for the authenticated user', async () => {
      const response = await request(env.app.getHttpServer())
        .get('/api/buyer/listings')
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        id: testData.buyListing.id,
        productId: testData.product.id,
        status: 'ACTIVE',
      });
    });

    it('should only return listings belonging to the buyer', async () => {
      // Create another buyer and listing
      const otherBuyer = await env.prisma.user.create({
        data: {
          email: 'other-buyer@test.com',
          name: 'Other Buyer',
          role: 'BUYER',
          isActive: true,
          onboardingCompleted: true,
        }
      });
      
      await env.prisma.buyListing.create({
        data: {
          buyerId: otherBuyer.id,
          productId: testData.product.id,
          quantity: 200,
          unit: 'TON',
          status: 'ACTIVE',
        }
      });

      const response = await request(env.app.getHttpServer())
        .get('/api/buyer/listings')
        .set('Authorization', `Bearer ${env.tokens.buyer}`)
        .expect(200);

      // Should only see their own listing (1 from seedTestData)
      expect(response.body).toHaveLength(1);
      expect(response.body[0].buyerId).toBe(testData.users.buyer.id);
    });
  });
});
