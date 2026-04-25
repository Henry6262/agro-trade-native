import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { NegotiationStatus } from '@prisma/client';

describe('POST /api/negotiations/:id/accept - Accept Offer Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let negotiationId: string;
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

    // Add a seller and create a negotiation
    const addSellerResponse = await request(env.app.getHttpServer())
      .post(`/api/trade-operations/${tradeOperationId}/sellers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 50,
          },
        ],
      })
      .expect(201);

    const tradeSellerId = addSellerResponse.body.sellersAdded[0].id;

    const offerResponse = await request(env.app.getHttpServer())
      .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeSellerId: tradeSellerId,
        price: 335,
        quantity: 50,
      })
      .expect(201);

    negotiationId = offerResponse.body.data.id;
  }, 30000);

  describe('Accept Offer', () => {
    it('should accept offer and update status to ACCEPTED', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({
          acceptanceNote: 'Terms agreed, proceeding with purchase',
        })
        .expect(200);

      // Response is direct object for accept. 
      // Note: Decimal fields (finalPrice, finalQuantity) are returned as Strings in JSON
      expect(response.body).toMatchObject({
        id: negotiationId,
        status: 'ACCEPTED',
        finalPrice: "335",
        finalQuantity: "50",
      });

      // Verify database updates
      const updated = await env.prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(updated?.status).toBe('ACCEPTED');
    });

    it('should update TradeSeller with agreed price and status', async () => {
      await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({})
        .expect(200);

      // Get negotiation to find tradeSellerId
      const nego = await env.prisma.offerNegotiation.findUnique({
        where: { id: negotiationId },
      });
      expect(nego).not.toBeNull();
      if (!nego) throw new Error('Negotiation not found');

      // Verify TradeSeller updated
      const updatedTradeSeller = await env.prisma.tradeSeller.findUnique({
        where: { id: nego.tradeSellerId },
      });
      expect(updatedTradeSeller).not.toBeNull();
      if (!updatedTradeSeller) throw new Error('TradeSeller not found');

      expect(updatedTradeSeller).toMatchObject({
        status: 'ACCEPTED',
        agreedPrice: expect.any(Object), // Decimal object in prisma
        agreedQuantity: expect.any(Object), // Decimal object in prisma
      });
      
      expect(updatedTradeSeller.agreedPrice.toNumber()).toBe(335);
      expect(updatedTradeSeller.agreedQuantity.toNumber()).toBe(50);
    });

    it('should calculate final profit impact', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('profitImpact');
      expect(response.body.profitImpact).toMatchObject({
        estimatedProfit: expect.any(Number),
        profitMargin: expect.any(Number),
      });
    });

    it('should include phaseTransition when all sellers have accepted', async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('phaseTransition');
      expect(response.body.phaseTransition).toMatchObject({
        allSellersAccepted: true,
        nextPhase: 'INSPECTION_REQUIRED',
      });
    });

    it('should return 404 for non-existent negotiation', async () => {
      await request(env.app.getHttpServer())
        .post('/api/negotiations/non-existent-id/accept')
        .set('Authorization', `Bearer ${env.tokens.admin}`)
        .send({})
        .expect(404);
    });
  });
});
