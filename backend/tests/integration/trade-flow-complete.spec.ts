import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Complete Trade Flow - Integration Test (Trading Model)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  
  // IDs to track through the flow
  let adminId: string;
  let buyerId: string;
  let buyListingId: string;
  let tradeOperationId: string;
  let productId: string;
  let sellerIds: string[] = [];
  let saleListingIds: string[] = [];
  let transporterId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup base data
    const admin = await prisma.user.create({
      data: {
        email: 'flow-admin@agrotrade.com',
        password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe0Tz5pLBkF5Lx8lKnWqF3F9kK2i',
        name: 'Flow Admin',
        role: 'ADMIN',
        isEmailVerified: true,
      },
    });
    adminId = admin.id;
    authToken = 'Bearer mock-admin-token';

    const buyer = await prisma.user.create({
      data: {
        email: 'flow-buyer@test.com',
        name: 'Flow Buyer',
        role: 'BUYER',
      },
    });
    buyerId = buyer.id;

    // Create sellers
    for (let i = 0; i < 3; i++) {
      const seller = await prisma.user.create({
        data: {
          email: `flow-seller-${i}@test.com`,
          name: `Flow Seller ${i}`,
          role: 'FARMER',
        },
      });
      sellerIds.push(seller.id);
    }

    // Create transporter
    const transporter = await prisma.user.create({
      data: {
        email: 'flow-transporter@test.com',
        name: 'Flow Transporter',
        role: 'TRANSPORTER',
      },
    });
    transporterId = transporter.id;

    await prisma.truck.create({
      data: {
        ownerId: transporterId,
        plateNumber: 'FLOW123',
        capacity: 150,
        unit: 'TON',
        type: 'FLATBED',
      },
    });

    const product = await prisma.product.findFirst();
    productId = product!.id;
  });

  afterAll(async () => {
    // Clean up all test data
    await prisma.transportBid.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.inspectionRequest.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.offerRound.deleteMany({
      where: { negotiation: { tradeOperationId: tradeOperationId } },
    });
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeTransporter.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeStateHistory.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeNote.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { sellerId: { in: sellerIds } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyerId: buyerId },
    });
    await prisma.truck.deleteMany({
      where: { ownerId: transporterId },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          contains: 'flow-' 
        },
      },
    });
    await app.close();
  });

  describe('End-to-End Trade Operation Flow', () => {
    it('Step 1: Create buy listing', async () => {
      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyerId,
          productId: productId,
          quantity: 100,
          unit: 'TON',
          maxPricePerUnit: 400,
          status: 'ACTIVE',
          neededBy: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      buyListingId = buyListing.id;

      expect(buyListingId).toBeTruthy();
    });

    it('Step 2: Admin creates trade operation from buy listing with profit targets', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations')
        .set('Authorization', authToken)
        .send({
          buyListingId: buyListingId,
          notes: 'Urgent order for premium wheat',
          targetProfit: 3500, // Target €3,500 profit
          proposedSellingPrice: 380, // Propose selling at €380/ton to buyer
        })
        .expect(201);

      tradeOperationId = response.body.data.id;
      
      expect(response.body.data).toMatchObject({
        buyListingId: buyListingId,
        phase: 'INITIATION',
        status: 'ACTIVE',
        adminId: adminId,
        sellingPrice: 380,
        totalRevenue: 38000, // 100 tons * €380
      });
    });

    it('Step 3: Create sale listings from sellers', async () => {
      for (let i = 0; i < sellerIds.length; i++) {
        const saleListing = await prisma.saleListing.create({
          data: {
            sellerId: sellerIds[i],
            productId: productId,
            quantity: 50 + i * 10,
            unit: 'TON',
            askingPrice: 350 + i * 10,
            status: 'ACTIVE',
            qualityScore: 90 - i * 5,
          },
        });
        saleListingIds.push(saleListing.id);
      }

      expect(saleListingIds.length).toBe(3);
    });

    it('Step 4: Transition to SELLER_MATCHING phase', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'SELLER_MATCHING',
          reason: 'Ready to find sellers',
        })
        .expect(200);

      expect(response.body.data.phase).toBe('SELLER_MATCHING');
    });

    it('Step 5: Find matching sellers', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/sellers/match/${buyListingId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.matches.length).toBeGreaterThan(0);
      
      // Verify sellers are sorted by match score
      const scores = response.body.data.matches.map((m: any) => m.matchScore);
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
      }
    });

    it('Step 6: Add selected sellers to trade', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set('Authorization', authToken)
        .send({
          sellers: [
            {
              saleListingId: saleListingIds[0],
              requestedQuantity: 50,
            },
            {
              saleListingId: saleListingIds[1],
              requestedQuantity: 50,
            },
          ],
        })
        .expect(201);

      expect(response.body.data.added.length).toBe(2);
      expect(response.body.data.failed.length).toBe(0);
    });

    it('Step 7: Transition to SELLER_NEGOTIATION phase', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'SELLER_NEGOTIATION',
          reason: 'Starting negotiations with sellers',
        })
        .expect(200);

      expect(response.body.data.phase).toBe('SELLER_NEGOTIATION');
    });

    it('Step 8: Create and conduct negotiations with profit tracking', async () => {
      // Get trade sellers
      const trade = await prisma.tradeOperation.findUnique({
        where: { id: tradeOperationId },
        include: { sellers: true },
      });

      // Create negotiation for first seller
      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: tradeOperationId,
          tradeSellerId: trade!.sellers[0].id,
          status: 'ACTIVE',
          initialOffer: 340,
          currentOffer: 340,
          quantity: 50,
          unit: 'TON',
          expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        },
      });

      // Make initial offer
      const offer1 = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 340,
          quantity: 50,
        })
        .expect(201);

      // Verify profit impact
      expect(offer1.body.data.profitImpact).toMatchObject({
        estimatedProfit: expect.any(Number),
        profitMargin: expect.any(Number),
      });

      // Counter offer
      const offer2 = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'SELLER',
          price: 350,
          quantity: 50,
          response: 'COUNTERED',
        })
        .expect(201);

      // Accept offer
      const offer3 = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/offers`)
        .set('Authorization', authToken)
        .send({
          offeredBy: 'BUYER',
          price: 345,
          quantity: 50,
          response: 'ACCEPTED',
        })
        .expect(201);

      // Verify negotiation completed
      const updatedNego = await prisma.offerNegotiation.findUnique({
        where: { id: negotiation.id },
      });
      expect(updatedNego?.status).toBe('AGREED');
      expect(updatedNego?.finalPrice).toEqual(345);

      // Update trade operation with purchase cost
      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          totalPurchaseCost: 345 * 50, // €345/ton * 50 tons
          avgPurchasePrice: 345,
        },
      });
    });

    it('Step 9: Request inspection for unverified seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/inspections')
        .set('Authorization', authToken)
        .send({
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingIds[0],
          priority: 'HIGH',
          latitude: 42.6977,
          longitude: 23.3219,
          address: 'Test Farm Location',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        tradeOperationId: tradeOperationId,
        saleListingId: saleListingIds[0],
        priority: 'HIGH',
        status: 'PENDING',
      });
    });

    it('Step 10: Complete inspection', async () => {
      const inspection = await prisma.inspectionRequest.findFirst({
        where: { tradeOperationId: tradeOperationId },
      });

      await prisma.inspectionRequest.update({
        where: { id: inspection!.id },
        data: {
          status: 'COMPLETED',
          qualityScore: 92,
          completedDate: new Date(),
          verificationResult: {
            moisture: 12.5,
            protein: 13.2,
            impurities: 0.8,
          },
          notes: 'Product meets all quality standards',
        },
      });

      // Update seller as verified
      await prisma.tradeSeller.updateMany({
        where: {
          tradeOperationId: tradeOperationId,
          saleListingId: saleListingIds[0],
        },
        data: {
          isVerified: true,
        },
      });
    });

    it('Step 11: Transition to TRANSPORT_BIDDING', async () => {
      // First mark sellers as confirmed
      await prisma.tradeSeller.updateMany({
        where: { tradeOperationId: tradeOperationId },
        data: { 
          status: 'CONFIRMED',
          agreedQuantity: 50,
          agreedPrice: 345,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'TRANSPORT_BIDDING',
          reason: 'Sellers confirmed, ready for transport bids',
        })
        .expect(200);

      expect(response.body.data.phase).toBe('TRANSPORT_BIDDING');
    });

    it('Step 12: Calculate transport cost and submit bids', async () => {
      // First calculate transport cost
      const costEstimate = await request(app.getHttpServer())
        .post('/api/transport/estimate-cost')
        .set('Authorization', authToken)
        .send({
          pickupPoints: [
            { lat: 42.1, lng: 23.2, quantity: 50 },
            { lat: 42.3, lng: 23.4, quantity: 50 },
          ],
          deliveryPoint: { lat: 42.5, lng: 23.6 },
          vehicleType: 'FLATBED',
        })
        .expect(200);

      const estimatedTransportCost = costEstimate.body.data.estimation.totalCost;

      // Update trade with transport estimate
      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          estimatedTransportCost: estimatedTransportCost,
          totalDistanceKm: costEstimate.body.data.estimation.totalDistance,
        },
      });


      const response = await request(app.getHttpServer())
        .post('/api/transport-bids')
        .set('Authorization', 'Bearer transporter-token')
        .send({
          tradeOperationId: tradeOperationId,
          bidAmount: 2500,
          estimatedDuration: 24,
          vehicleType: 'FLATBED',
          vehicleCapacity: 150,
          specialEquipment: ['GPS Tracking'],
          insuranceCoverage: 100000,
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        tradeOperationId: tradeOperationId,
        transporterId: transporterId,
        status: 'PENDING',
      });
    });

    it('Step 13: Accept transport bid', async () => {
      const bid = await prisma.transportBid.findFirst({
        where: { tradeOperationId: tradeOperationId },
      });

      await prisma.transportBid.update({
        where: { id: bid!.id },
        data: { status: 'ACCEPTED' },
      });

      // Create trade transporter
      await prisma.tradeTransporter.create({
        data: {
          tradeOperationId: tradeOperationId,
          transporterId: transporterId,
          agreedPrice: bid!.bidAmount,
          estimatedDistance: 150,
          estimatedDuration: 24 * 60,
          status: 'CONFIRMED',
        },
      });
    });

    it('Step 14: Transition to IN_TRANSIT', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'IN_TRANSIT',
          reason: 'Transport has begun',
        })
        .expect(200);

      expect(response.body.data.phase).toBe('IN_TRANSIT');
    });

    it('Step 15: Poll for updates during transit', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/updates`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.updates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'PHASE_CHANGE' }),
          expect.objectContaining({ type: 'SELLER_ADDED' }),
          expect.objectContaining({ type: 'OFFER_UPDATE' }),
          expect.objectContaining({ type: 'INSPECTION_UPDATE' }),
          expect.objectContaining({ type: 'BID_RECEIVED' }),
        ])
      );
    });

    it('Step 16: Mark as DELIVERED', async () => {
      await prisma.tradeTransporter.updateMany({
        where: { tradeOperationId: tradeOperationId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'DELIVERED',
          reason: 'Goods delivered successfully',
        })
        .expect(200);

      expect(response.body.data.phase).toBe('DELIVERED');
    });

    it('Step 17: Complete the trade operation with profit calculation', async () => {
      // Calculate profit (Trading Model)
      const sellingPrice = 380;
      const totalRevenue = 100 * sellingPrice; // 100 tons * €380/ton = €38,000
      const totalPurchaseCost = (50 * 345) + (50 * 350); // Two sellers
      const actualTransportCost = 180; // Actual cost after delivery
      const actualProfit = totalRevenue - totalPurchaseCost - actualTransportCost;
      const profitMargin = (actualProfit / totalRevenue) * 100;

      await prisma.tradeOperation.update({
        where: { id: tradeOperationId },
        data: {
          totalValue: totalRevenue,
          totalRevenue: totalRevenue,
          totalPurchaseCost: totalPurchaseCost,
          actualTransportCost: actualTransportCost,
          actualProfit: actualProfit,
          profitMargin: profitMargin,
        },
      });

      const response = await request(app.getHttpServer())
        .patch(`/api/trade-operations/${tradeOperationId}/phase`)
        .set('Authorization', authToken)
        .send({
          toPhase: 'COMPLETED',
          toStatus: 'COMPLETED',
          reason: 'Trade completed successfully',
        })
        .expect(200);

      expect(response.body.data).toMatchObject({
        phase: 'COMPLETED',
        status: 'COMPLETED',
      });
    });

    it('Step 18: Verify complete trade details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}`)
        .set('Authorization', authToken)
        .expect(200);

      const trade = response.body.data;
      
      expect(trade).toMatchObject({
        id: tradeOperationId,
        phase: 'COMPLETED',
        status: 'COMPLETED',
        totalValue: expect.any(String),
        totalRevenue: expect.any(String),
        totalPurchaseCost: expect.any(String),
        actualProfit: expect.any(String),
        profitMargin: expect.any(Number),
      });

      expect(trade.sellers.length).toBe(2);
      expect(trade.transporters.length).toBeGreaterThan(0);
      expect(trade.inspections.length).toBeGreaterThan(0);
      expect(trade.stateHistory.length).toBeGreaterThan(0);
    });

    it('Step 19: Verify profit calculation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/profit`)
        .set('Authorization', authToken)
        .expect(200);

      const profit = response.body.data;
      
      expect(profit).toMatchObject({
        revenue: {
          sellingPrice: 380,
          quantity: 100,
          totalRevenue: 38000,
        },
        costs: {
          purchases: {
            totalCost: expect.any(Number),
            avgPrice: expect.any(Number),
          },
          transport: {
            actualCost: 180,
          },
        },
        profit: {
          netProfit: expect.any(Number),
          profitMargin: expect.any(Number),
        },
        status: {
          isEstimated: false, // Using actual values after completion
        },
      });

      // Verify minimum margin met (5%)
      expect(profit.profit.profitMargin).toBeGreaterThanOrEqual(5);
    });

    it('Step 20: Verify audit trail', async () => {
      const history = await prisma.tradeStateHistory.findMany({
        where: { tradeOperationId: tradeOperationId },
        orderBy: { changedAt: 'asc' },
      });

      const phases = history.map(h => h.toPhase);
      expect(phases).toContain('INITIATION');
      expect(phases).toContain('SELLER_MATCHING');
      expect(phases).toContain('SELLER_NEGOTIATION');
      expect(phases).toContain('TRANSPORT_BIDDING');
      expect(phases).toContain('IN_TRANSIT');
      expect(phases).toContain('DELIVERED');
      expect(phases).toContain('COMPLETED');
    });
  });
});