import request from 'supertest';
import { TestEnvironment } from '../../test/setup/test-environment';
import { UserRole } from '@prisma/client';

describe('POST /api/transport/bids - Transport Bids Contract Test', () => {
  let env: TestEnvironment;
  let testData: any;
  let transportRequestId: string;

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

    // 1. Create a trade operation
    const createResponse = await request(env.app.getHttpServer())
      .post('/api/trade-operations')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [],
      })
      .expect(201);

    const tradeOperationId = createResponse.body.tradeOperationId;

    // 2. Add a buyer address (REQUIRED for transport request)
    const buyerAddress = await env.prisma.address.create({
      data: {
        user: { connect: { id: testData.users.buyer.id } },
        addressType: 'OTHER',
        street: "Buyer Street",
        country: "Bulgaria",
        latitude: 42.6977,
        longitude: 23.3219,
      }
    });
    
    // Update buyListing to use this address
    await env.prisma.buyListing.update({
      where: { id: testData.buyListing.id },
      data: { deliveryAddressId: buyerAddress.id }
    });

    // 3. Add accepted seller with address (REQUIRED for transport request)
    const sellerAddress = await env.prisma.address.create({
      data: {
        user: { connect: { id: testData.users.seller1.id } },
        addressType: 'FARM',
        street: "Seller Street",
        country: "Bulgaria",
        latitude: 42.1,
        longitude: 23.2,
      }
    });
    
    // Update sale listing with address
    await env.prisma.saleListing.update({
      where: { id: testData.saleListings[0].id },
      data: { addressId: sellerAddress.id }
    });

    await env.prisma.tradeSeller.create({
      data: {
        tradeOperationId,
        sellerId: testData.users.seller1.id,
        saleListingId: testData.saleListings[0].id,
        requestedQuantity: 50,
        offeredQuantity: 50,
        unit: 'TON',
        status: 'ACCEPTED',
        agreedPrice: 340,
        agreedQuantity: 50,
      }
    });

    // 4. Transition trade to TRANSPORT_MATCHING phase
    await env.prisma.tradeOperation.update({
      where: { id: tradeOperationId },
      data: { phase: 'TRANSPORT_MATCHING' }
    });

    // 5. Create a transport request
    const transportReqResponse = await request(env.app.getHttpServer())
      .post('/api/transport/requests')
      .set('Authorization', `Bearer ${env.tokens.admin}`)
      .send({
        tradeOperationId: tradeOperationId,
        totalWeight: 50,
        requiredVehicleType: 'FLATBED',
        biddingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      });
    
    expect(transportReqResponse.status).toBe(201);

    transportRequestId = transportReqResponse.body.id;
  }, 30000);

  describe('Transport Bid Contract', () => {
    it('should submit a transport bid', async () => {
      const response = await request(env.app.getHttpServer())
        .post('/api/transport/bids')
        .set('Authorization', `Bearer ${env.tokens.transporter}`)
        .send({
          transportRequestId: transportRequestId,
          amount: 2500,
          estimatedDays: 2,
          vehicleDetails: '25-ton Flatbed Truck',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        transportRequestId: transportRequestId,
        transporterId: testData.users.transporter.id,
        amount: 2500,
        status: 'PENDING',
      });
    });

    it('should validate bid amount is positive', async () => {
      await request(env.app.getHttpServer())
        .post('/api/transport/bids')
        .set('Authorization', `Bearer ${env.tokens.transporter}`)
        .send({
          transportRequestId: transportRequestId,
          amount: -100,
          estimatedDays: 2,
        })
        .expect(400);
    });

    it('should return 404 for non-existent transport request', async () => {
      await request(env.app.getHttpServer())
        .post('/api/transport/bids')
        .set('Authorization', `Bearer ${env.tokens.transporter}`)
        .send({
          transportRequestId: 'non-existent-id',
          amount: 2000,
          estimatedDays: 1,
        })
        .expect(404);
    });
  });
});
