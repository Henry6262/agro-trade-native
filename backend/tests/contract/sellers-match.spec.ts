import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';

describe('GET /api/trade-operations/:id/matching-sellers - Match Sellers Contract Test', () => {
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
    expect(response.body.tradeOperationId).toBeTruthy();

    tradeOperationId = response.body.tradeOperationId;
    
    // Add addresses to sellers for distance calculation
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
      
      // Update listing price to ensure it matches (maxPrice * 0.95)
      await env.prisma.saleListing.update({
        where: { id: testData.saleListings[i].id },
        data: { askingPrice: 300 }
      });
    }
  }, 30000);

  describe('Response Contract', () => {
    it('should return matched sellers with scoring', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty('sellers');
      expect(response.body.sellers).toBeInstanceOf(Array);
      expect(response.body.sellers.length).toBeGreaterThan(0);
      expect(response.body.sellers[0]).toMatchObject({
        sellerId: expect.any(String),
        sellerName: expect.any(String),
        saleListingId: expect.any(String),
        availableQuantity: expect.any(Number),
        askingPrice: expect.any(Number),
        score: expect.any(Number),
        distance: expect.any(Number),
      });
    });

    it('should sort matches by score descending', async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(200);

      const sellers = response.body.sellers;
      for (let i = 1; i < sellers.length; i++) {
        expect(sellers[i - 1].score).toBeGreaterThanOrEqual(sellers[i].score);
      }
    });

    it('should return 404 for non-existent trade operation', async () => {
      await request(env.app.getHttpServer())
        .get('/api/trade-operations/non-existent-id/matching-sellers')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .expect(404);
    });
  });
});
