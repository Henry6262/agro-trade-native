import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus, TradePhase } from '@prisma/client';

describe('Expiration Handling - Integration Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string = 'Bearer admin-token';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'EXPIRE' } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'EXPIRE' } } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: { contains: 'EXPIRE' } },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'expire-test' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: { contains: 'expire-test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'expire-test' } },
    });
    await app.close();
  });

  describe('48-Hour Expiration Cycle', () => {
    it('should handle negotiations approaching expiration', async () => {
      // Setup
      const admin = await prisma.user.create({
        data: {
          email: 'admin-expire-test@agrotrade.com',
          name: 'Expire Test Admin',
          role: 'ADMIN',
        },
      });

      const buyer = await prisma.user.create({
        data: {
          email: 'buyer-expire-test@test.com',
          name: 'Expire Test Buyer',
          role: 'BUYER',
        },
      });

      const seller = await prisma.user.create({
        data: {
          email: 'seller-expire-test@test.com',
          name: 'Expire Test Seller',
          role: 'FARMER',
        },
      });

      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 100,
          unit: 'TON',
          maxPricePerUnit: 380,
          status: 'ACTIVE',
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: product!.id,
          quantity: 100,
          unit: 'TON',
          askingPrice: 350,
          status: 'ACTIVE',
        },
      });

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `EXPIRE-${Date.now()}`,
          adminId: admin.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 7,
          sellingPrice: 375,
          totalRevenue: 37500,
          currency: 'EUR',
        },
      });

      const tradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: seller.id,
          saleListingId: saleListing.id,
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'NEGOTIATING',
        },
      });

      // Create negotiations with different expiration times
      const nearExpiry = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 340,
            quantity: 100,
            terms: 'Near expiry',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours left
        },
      });

      const midExpiry = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 335,
            quantity: 100,
            terms: 'Mid expiry',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours left
        },
      });

      const farExpiry = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade.id,
          tradeSellerId: tradeSeller.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 338,
            quantity: 100,
            terms: 'Far expiry',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 47 * 60 * 60 * 1000), // 47 hours left
        },
      });

      // Check expiring negotiations
      const expiringResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/negotiations/expiring?hours=12`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(expiringResponse.body.data).toMatchObject({
        expiringSoon: [
          expect.objectContaining({
            id: nearExpiry.id,
            hoursRemaining: expect.closeTo(6, 0.5),
            urgency: 'HIGH',
            recommendedAction: 'Follow up immediately',
          }),
        ],
        summary: {
          total: 3,
          expiringSoon: 1,
          expired: 0,
        },
      });

      // Get notifications for expiring negotiations
      const notificationResponse = await request(app.getHttpServer())
        .get(`/api/notifications/expiration-warnings`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(notificationResponse.body.data).toMatchObject({
        warnings: expect.arrayContaining([
          expect.objectContaining({
            negotiationId: nearExpiry.id,
            type: 'EXPIRATION_WARNING',
            message: expect.stringContaining('expires in 6 hours'),
            priority: 'HIGH',
          }),
        ]),
      });
    });

    it('should automatically mark expired negotiations', async () => {
      // Create expired negotiation
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const tradeSeller = await prisma.tradeSeller.findFirst();
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });

      const expiredNego = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade!.id,
          tradeSellerId: tradeSeller!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 342,
            quantity: 50,
            terms: 'Will expire',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() - 1000), // Already expired
        },
      });

      // Run expiration check job
      const jobResponse = await request(app.getHttpServer())
        .post('/api/jobs/process-expirations')
        .set('Authorization', adminToken)
        .expect(200);

      expect(jobResponse.body.data).toMatchObject({
        processed: 1,
        expired: 1,
        notifications: 1,
      });

      // Verify negotiation marked as expired
      const updated = await prisma.offerNegotiation.findUnique({
        where: { id: expiredNego.id },
      });
      expect(updated?.status).toBe('EXPIRED');
      expect(updated?.concludedAt).toBeTruthy();

      // Verify TradeSeller status updated
      const updatedTradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSeller!.id },
      });
      expect(updatedTradeSeller?.status).toBe('EXPIRED');

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: expiredNego.id } });
    });
  });

  describe('Grace Period and Extensions', () => {
    it('should allow extending expiration before deadline', async () => {
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });
      const tradeSeller = await prisma.tradeSeller.findFirst({ where: { tradeOperationId: trade!.id } });

      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade!.id,
          tradeSellerId: tradeSeller!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 345,
            quantity: 60,
            terms: 'Extension test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours left
        },
      });

      // Request extension
      const extensionResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/extend`)
        .set('Authorization', adminToken)
        .send({
          hours: 24,
          reason: 'Seller requested more time to review',
        })
        .expect(200);

      expect(extensionResponse.body.data).toMatchObject({
        id: negotiation.id,
        previousExpiry: expect.any(String),
        newExpiry: expect.any(String),
        extensionHours: 24,
        totalExtensions: 1,
      });

      // Verify new expiration
      const extended = await prisma.offerNegotiation.findUnique({
        where: { id: negotiation.id },
      });
      const newExpiry = new Date(extended!.expiresAt);
      const hoursUntilExpiry = (newExpiry.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursUntilExpiry).toBeGreaterThan(27); // 4 + 24
      expect(hoursUntilExpiry).toBeLessThan(29);

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: negotiation.id } });
    });

    it('should limit number of extensions', async () => {
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });
      const tradeSeller = await prisma.tradeSeller.findFirst();

      const negotiation = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade!.id,
          tradeSellerId: tradeSeller!.id,
          status: NegotiationStatus.PENDING,
          currentOffer: {
            price: 348,
            quantity: 70,
            terms: 'Multi extension test',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
          extensionCount: 2, // Already extended twice
        },
      });

      // Try to extend again (should fail)
      const extensionResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiation.id}/extend`)
        .set('Authorization', adminToken)
        .send({
          hours: 24,
          reason: 'Third extension attempt',
        })
        .expect(400);

      expect(extensionResponse.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'MAX_EXTENSIONS_REACHED',
          message: expect.stringContaining('Maximum extensions'),
        }),
      });

      // Clean up
      await prisma.offerNegotiation.delete({ where: { id: negotiation.id } });
    });
  });

  describe('Bulk Expiration Processing', () => {
    it('should handle multiple expirations efficiently', async () => {
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });
      
      // Create 10 expired negotiations
      const expiredNegos = await Promise.all(
        Array(10).fill(0).map(async (_, i) => {
          const seller = await prisma.user.create({
            data: {
              email: `bulk-expire-${i}@test.com`,
              name: `Bulk Seller ${i}`,
              role: 'FARMER',
            },
          });

          const listing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: (await prisma.product.findFirst())!.id,
              quantity: 50,
              unit: 'TON',
              askingPrice: 340 + i,
              status: 'ACTIVE',
            },
          });

          const tradeSeller = await prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade!.id,
              sellerId: seller.id,
              saleListingId: listing.id,
              requestedQuantity: 50,
              offeredQuantity: 50,
              unit: 'TON',
              status: 'NEGOTIATING',
            },
          });

          return prisma.offerNegotiation.create({
            data: {
              tradeOperationId: trade!.id,
              tradeSellerId: tradeSeller.id,
              status: NegotiationStatus.PENDING,
              currentOffer: {
                price: 340 + i,
                quantity: 50,
                terms: `Bulk test ${i}`,
              },
              offerHistory: [],
              expiresAt: new Date(Date.now() - (i + 1) * 60 * 60 * 1000), // Various past times
            },
          });
        })
      );

      // Process all expirations
      const processResponse = await request(app.getHttpServer())
        .post('/api/jobs/process-expirations')
        .set('Authorization', adminToken)
        .expect(200);

      expect(processResponse.body.data).toMatchObject({
        processed: expect.any(Number),
        expired: 10,
        notifications: 10,
        processingTime: expect.any(Number), // ms
      });

      // Verify all marked as expired
      const updatedNegos = await prisma.offerNegotiation.findMany({
        where: { id: { in: expiredNegos.map(n => n.id) } },
      });
      
      expect(updatedNegos.every(n => n.status === 'EXPIRED')).toBe(true);

      // Get summary
      const summaryResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade!.id}/expiration-summary`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(summaryResponse.body.data).toMatchObject({
        recentlyExpired: expect.any(Number),
        requiresAction: expect.arrayContaining([
          expect.objectContaining({
            negotiationId: expect.any(String),
            sellerName: expect.any(String),
            expiredAgo: expect.any(String), // e.g., "2 hours ago"
            suggestedAction: expect.any(String),
          }),
        ]),
      });
    });
  });

  describe('Expiration Recovery', () => {
    it('should allow reactivating expired negotiations with new offer', async () => {
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });
      const tradeSeller = await prisma.tradeSeller.findFirst();

      // Create expired negotiation
      const expired = await prisma.offerNegotiation.create({
        data: {
          tradeOperationId: trade!.id,
          tradeSellerId: tradeSeller!.id,
          status: NegotiationStatus.EXPIRED,
          currentOffer: {
            price: 350,
            quantity: 80,
            terms: 'Expired offer',
          },
          offerHistory: [],
          expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          concludedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });

      // Try to reactivate with new offer
      const reactivateResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${expired.id}/reactivate`)
        .set('Authorization', adminToken)
        .send({
          newPrice: 355,
          newQuantity: 80,
          newTerms: 'Improved offer after expiration',
          reason: 'Seller showed renewed interest',
        })
        .expect(201);

      expect(reactivateResponse.body.data).toMatchObject({
        id: expect.any(String), // New negotiation ID
        status: 'PENDING',
        currentOffer: {
          price: 355,
          quantity: 80,
          terms: 'Improved offer after expiration',
        },
        previousNegotiationId: expired.id,
        expiresAt: expect.any(String), // New 48-hour expiration
      });

      // Verify old negotiation remains expired
      const oldNego = await prisma.offerNegotiation.findUnique({
        where: { id: expired.id },
      });
      expect(oldNego?.status).toBe('EXPIRED');

      // Clean up
      await prisma.offerNegotiation.deleteMany({
        where: { 
          OR: [
            { id: expired.id },
            { id: reactivateResponse.body.data.id }
          ]
        },
      });
    });
  });
});