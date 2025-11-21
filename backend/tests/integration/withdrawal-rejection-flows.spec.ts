import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { NegotiationStatus, TradePhase } from '@prisma/client';

describe('Withdrawal and Rejection Flows - Integration Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string = 'Bearer admin-token';
  let sellerToken: string = 'Bearer seller-token';

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
      where: { tradeOperation: { operationNumber: { contains: 'WR-FLOW' } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'WR-FLOW' } } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: { contains: 'WR-FLOW' } },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'wr-test' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: { contains: 'wr-test' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'wr-test' } },
    });
    await app.close();
  });

  describe('Strategic Withdrawal Scenarios', () => {
    it('should handle admin withdrawing after multiple counter offers', async () => {
      // Setup
      const admin = await prisma.user.create({
        data: {
          email: 'admin-wr-test@agrotrade.com',
          name: 'WR Test Admin',
          role: 'ADMIN',
        },
      });

      const buyer = await prisma.user.create({
        data: {
          email: 'buyer-wr-test@test.com',
          name: 'WR Test Buyer',
          role: 'BUYER',
        },
      });

      const seller = await prisma.user.create({
        data: {
          email: 'seller-wr-test@test.com',
          name: 'WR Test Seller',
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
          operationNumber: `WR-FLOW-${Date.now()}`,
          adminId: admin.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 8,
          sellingPrice: 380,
          totalRevenue: 38000,
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

      // Initial offer
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSeller.id,
          price: 330,
          quantity: 100,
          terms: 'Initial offer',
        })
        .expect(201);

      const negotiationId = offerResponse.body.data.id;

      // Seller counters high
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 365,
          quantity: 100,
          terms: 'Premium product',
        })
        .expect(201);

      // Admin counters back
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', adminToken)
        .send({
          price: 340,
          quantity: 100,
          terms: 'Best we can do',
        })
        .expect(201);

      // Seller still insists on high price
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/counter`)
        .set('Authorization', sellerToken)
        .send({
          price: 360,
          quantity: 100,
          terms: 'Final offer',
        })
        .expect(201);

      // Admin withdraws due to no agreement
      const withdrawResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/withdraw`)
        .set('Authorization', adminToken)
        .send({
          reason: 'Unable to reach agreeable price after multiple rounds',
        })
        .expect(200);

      expect(withdrawResponse.body.data).toMatchObject({
        status: 'WITHDRAWN',
        withdrawalReason: 'Unable to reach agreeable price after multiple rounds',
        negotiationMetrics: {
          rounds: 4,
          priceRange: { min: 330, max: 365 },
          negotiationDuration: expect.any(Number),
        },
      });

      // Verify can start fresh negotiation with different terms
      const freshOfferResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: tradeSeller.id,
          price: 345,
          quantity: 80, // Different quantity
          terms: 'Revised offer with reduced quantity',
        })
        .expect(201);

      expect(freshOfferResponse.body.success).toBe(true);
    });

    it('should handle bulk withdrawal when changing strategy', async () => {
      // Create trade with multiple active negotiations
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 300,
          unit: 'TON',
          maxPricePerUnit: 390,
          status: 'ACTIVE',
        },
      });

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `WR-FLOW-BULK-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 7,
          sellingPrice: 385,
          totalRevenue: 115500,
          currency: 'EUR',
        },
      });

      // Create 3 sellers with active negotiations
      const sellers = await Promise.all(
        Array(3).fill(0).map(async (_, i) => {
          const seller = await prisma.user.create({
            data: {
              email: `bulk-wr-seller${i}@test.com`,
              name: `Bulk Seller ${i}`,
              role: 'FARMER',
            },
          });

          const listing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 100,
              unit: 'TON',
              askingPrice: 355 + i * 5,
              status: 'ACTIVE',
            },
          });

          const tradeSeller = await prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: seller.id,
              saleListingId: listing.id,
              requestedQuantity: 100,
              offeredQuantity: 100,
              unit: 'TON',
              status: 'NEGOTIATING',
            },
          });

          const negotiation = await prisma.offerNegotiation.create({
            data: {
              tradeOperationId: trade.id,
              tradeSellerId: tradeSeller.id,
              status: i === 0 ? NegotiationStatus.COUNTERED : NegotiationStatus.PENDING,
              currentOffer: {
                price: 350 + i * 5,
                quantity: 100,
                terms: `Negotiation ${i}`,
              },
              counterOffer: i === 0 ? {
                price: 360,
                quantity: 100,
                terms: 'Counter offer',
                receivedAt: new Date().toISOString(),
              } : undefined,
              offerHistory: [],
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
          });

          return { seller, listing, tradeSeller, negotiation };
        })
      );

      // Bulk withdraw all negotiations
      const bulkWithdrawResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/negotiations/withdraw-all`)
        .set('Authorization', adminToken)
        .send({
          reason: 'Changing procurement strategy to different region',
          notifySellers: true,
        })
        .expect(200);

      expect(bulkWithdrawResponse.body.data).toMatchObject({
        withdrawn: 3,
        notifications: 3,
        tradeStatus: 'CANCELLED',
        message: 'All negotiations withdrawn and trade cancelled',
      });

      // Verify all negotiations withdrawn
      const negotiations = await prisma.offerNegotiation.findMany({
        where: { tradeOperationId: trade.id },
      });
      expect(negotiations.every(n => n.status === 'WITHDRAWN')).toBe(true);

      // Verify trade cancelled
      const cancelledTrade = await prisma.tradeOperation.findUnique({
        where: { id: trade.id },
      });
      expect(cancelledTrade?.status).toBe('CANCELLED');
    });
  });

  describe('Rejection Patterns and Recovery', () => {
    it('should track rejection reasons and suggest improvements', async () => {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const product = await prisma.product.findFirst();
      
      // Create multiple negotiations that get rejected
      const rejectionReasons = [
        { price: 320, reason: 'Price too low for quality' },
        { price: 325, reason: 'Payment terms not acceptable' },
        { price: 318, reason: 'Price below market rate' },
      ];

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `WR-FLOW-REJECT-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 9,
          sellingPrice: 370,
          totalRevenue: 37000,
          currency: 'EUR',
        },
      });

      const rejections = await Promise.all(
        rejectionReasons.map(async (data, i) => {
          const seller = await prisma.user.create({
            data: {
              email: `reject-seller${i}@test.com`,
              name: `Reject Seller ${i}`,
              role: 'FARMER',
            },
          });

          const listing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 100,
              unit: 'TON',
              askingPrice: 345,
              status: 'ACTIVE',
            },
          });

          const tradeSeller = await prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: seller.id,
              saleListingId: listing.id,
              requestedQuantity: 100,
              offeredQuantity: 100,
              unit: 'TON',
              status: 'NEGOTIATING',
            },
          });

          const negotiation = await prisma.offerNegotiation.create({
            data: {
              tradeOperationId: trade.id,
              tradeSellerId: tradeSeller.id,
              status: NegotiationStatus.REJECTED,
              currentOffer: {
                price: data.price,
                quantity: 100,
                terms: 'Standard terms',
              },
              rejectionReason: data.reason,
              offerHistory: [],
              concludedAt: new Date(),
              expiresAt: new Date(Date.now() - 1000),
            },
          });

          return negotiation;
        })
      );

      // Analyze rejection patterns
      const analysisResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/rejection-analysis`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(analysisResponse.body.data).toMatchObject({
        totalRejections: 3,
        commonReasons: expect.arrayContaining([
          expect.objectContaining({
            reason: 'Price',
            count: 2,
            percentage: 66.67,
          }),
          expect.objectContaining({
            reason: 'Payment terms',
            count: 1,
            percentage: 33.33,
          }),
        ]),
        averageOfferedPrice: expect.closeTo(321, 1),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            issue: 'Price consistently too low',
            suggestion: 'Consider increasing initial offer by 5-10%',
            potentialImpact: 'Higher acceptance rate',
          }),
        ]),
      });
    });

    it('should handle cascade rejections in multi-seller scenario', async () => {
      // When one key seller rejects, others may follow
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const product = await prisma.product.findFirst();

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `WR-FLOW-CASCADE-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 8,
          sellingPrice: 375,
          totalRevenue: 75000,
          currency: 'EUR',
        },
      });

      // Create lead seller and followers
      const leadSeller = await prisma.user.create({
        data: {
          email: 'lead-seller-wr@test.com',
          name: 'Market Leader Seller',
          role: 'FARMER',
        },
      });

      const followers = await Promise.all(
        Array(2).fill(0).map((_, i) =>
          prisma.user.create({
            data: {
              email: `follower-seller${i}@test.com`,
              name: `Follower Seller ${i}`,
              role: 'FARMER',
            },
          })
        )
      );

      // Create negotiations
      const allSellers = [leadSeller, ...followers];
      const negotiations = await Promise.all(
        allSellers.map(async (seller, i) => {
          const listing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 100,
              unit: 'TON',
              askingPrice: 340 + i * 5,
              status: 'ACTIVE',
            },
          });

          const tradeSeller = await prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: seller.id,
              saleListingId: listing.id,
              requestedQuantity: 100,
              offeredQuantity: 100,
              unit: 'TON',
              status: 'NEGOTIATING',
            },
          });

          const negotiation = await prisma.offerNegotiation.create({
            data: {
              tradeOperationId: trade.id,
              tradeSellerId: tradeSeller.id,
              status: NegotiationStatus.PENDING,
              currentOffer: {
                price: 335,
                quantity: 100,
                terms: 'Group offer',
              },
              offerHistory: [],
              expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
            },
          });

          return { seller, tradeSeller, negotiation };
        })
      );

      // Lead seller rejects
      const leadRejectResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[0].negotiation.id}/reject`)
        .set('Authorization', sellerToken)
        .send({
          reason: 'Market leader sets higher standard',
        })
        .expect(200);

      expect(leadRejectResponse.body.data).toMatchObject({
        cascadeRisk: {
          level: 'HIGH',
          message: 'Lead seller rejection may influence others',
          potentialImpact: 2, // Two followers
        },
      });

      // Followers also reject
      for (let i = 1; i < negotiations.length; i++) {
        await request(app.getHttpServer())
          .post(`/api/negotiations/${negotiations[i].negotiation.id}/reject`)
          .set('Authorization', sellerToken)
          .send({
            reason: 'Following market leader',
          })
          .expect(200);
      }

      // Check cascade detection
      const cascadeAnalysisResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/cascade-analysis`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(cascadeAnalysisResponse.body.data).toMatchObject({
        cascadeDetected: true,
        pattern: 'LEADER_FOLLOWER',
        leadRejection: expect.objectContaining({
          sellerId: leadSeller.id,
          reason: 'Market leader sets higher standard',
        }),
        followerRejections: 2,
        recommendation: 'Focus on negotiating with market leaders first',
      });
    });
  });

  describe('Recovery Strategies After Rejection/Withdrawal', () => {
    it('should suggest alternative sellers after rejection', async () => {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const product = await prisma.product.findFirst();

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `WR-FLOW-RECOVERY-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 7.5,
          sellingPrice: 378,
          totalRevenue: 37800,
          currency: 'EUR',
        },
      });

      // Create rejected seller
      const rejectedSeller = await prisma.user.create({
        data: {
          email: 'rejected-seller-recovery@test.com',
          name: 'Rejected Seller',
          role: 'FARMER',
        },
      });

      const rejectedListing = await prisma.saleListing.create({
        data: {
          sellerId: rejectedSeller.id,
          productId: product!.id,
          quantity: 100,
          unit: 'TON',
          askingPrice: 355,
          status: 'ACTIVE',
        },
      });

      const rejectedTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: rejectedSeller.id,
          saleListingId: rejectedListing.id,
          requestedQuantity: 100,
          offeredQuantity: 100,
          unit: 'TON',
          status: 'REJECTED',
        },
      });

      // Create pool of alternative sellers
      const alternatives = await Promise.all(
        Array(3).fill(0).map(async (_, i) => {
          const seller = await prisma.user.create({
            data: {
              email: `alt-seller${i}-recovery@test.com`,
              name: `Alternative Seller ${i}`,
              role: 'FARMER',
            },
          });

          const listing = await prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 80 + i * 20,
              unit: 'TON',
              askingPrice: 345 + i * 3,
              status: 'ACTIVE',
            },
          });

          return { seller, listing };
        })
      );

      // Get recovery suggestions
      const recoveryResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/recovery-suggestions`)
        .set('Authorization', adminToken)
        .send({
          rejectedSellerId: rejectedSeller.id,
          requiredQuantity: 100,
        })
        .expect(200);

      expect(recoveryResponse.body.data).toMatchObject({
        alternatives: expect.arrayContaining([
          expect.objectContaining({
            sellerId: expect.any(String),
            name: expect.any(String),
            quantity: expect.any(Number),
            price: expect.any(Number),
            priceComparison: expect.any(String), // e.g., "-10 EUR vs rejected"
            profitImpact: expect.any(Number),
            recommendation: expect.any(String),
          }),
        ]),
        bestAlternative: expect.objectContaining({
          sellerId: alternatives[0].seller.id, // Lowest price
          reason: 'Best price and sufficient quantity',
        }),
      });
    });

    it('should implement progressive recovery after multiple failures', async () => {
      const trade = await prisma.tradeOperation.findFirst({ where: { status: 'ACTIVE' } });
      
      // Track failure pattern
      const failureMetrics = {
        rejections: 3,
        withdrawals: 1,
        averageNegotiationDuration: 12, // hours
        priceGap: 25, // EUR difference
      };

      // Get progressive recovery plan
      const recoveryPlanResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade!.id}/progressive-recovery`)
        .set('Authorization', adminToken)
        .send(failureMetrics)
        .expect(200);

      expect(recoveryPlanResponse.body.data).toMatchObject({
        phase1: {
          action: 'Adjust pricing strategy',
          details: 'Increase initial offer by 7-10%',
          duration: '24 hours',
        },
        phase2: {
          action: 'Expand seller pool',
          details: 'Search in adjacent regions',
          duration: '48 hours',
        },
        phase3: {
          action: 'Consider alternative products',
          details: 'Similar quality substitutes',
          duration: '72 hours',
        },
        escalation: {
          trigger: 'If 80% quantity not secured',
          action: 'Review trade viability',
        },
      });
    });
  });
});