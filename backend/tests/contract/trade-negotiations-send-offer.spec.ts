import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('POST /api/trade-operations/:id/offers - Send Offers Contract Test', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tradeOperationId: string;
  let tradeSellerId: string;
  let sellerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Setup test data
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin-offers@agrotrade.com',
        name: 'Test Admin Offers',
        role: 'ADMIN',
      },
    });

    const buyer = await prisma.user.create({
      data: {
        email: 'test-buyer-offers@test.com',
        name: 'Test Buyer Offers',
        role: 'BUYER',
      },
    });

    const seller = await prisma.user.create({
      data: {
        email: 'test-seller-offers@test.com',
        name: 'Test Seller Offers',
        role: 'FARMER',
      },
    });
    sellerId = seller.id;

    const product = await prisma.product.findFirst();
    
    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: buyer.id,
        productId: product!.id,
        quantity: 100,
        unit: 'TON',
        maxPricePerUnit: 400,
        status: 'ACTIVE',
      },
    });

    const saleListing = await prisma.saleListing.create({
      data: {
        sellerId: seller.id,
        productId: product!.id,
        quantity: 80,
        unit: 'TON',
        askingPrice: 350,
        status: 'ACTIVE',
      },
    });

    const trade = await prisma.tradeOperation.create({
      data: {
        operationNumber: 'TRADE-OFFER-TEST-001',
        adminId: admin.id,
        buyListingId: buyListing.id,
        phase: 'SELLER_NEGOTIATION',
        status: 'ACTIVE',
        profitMargin: 7.5,
        sellingPrice: 380,
        totalRevenue: 38000,
        currency: 'EUR',
      },
    });
    tradeOperationId = trade.id;

    const tradeSeller = await prisma.tradeSeller.create({
      data: {
        tradeOperationId: trade.id,
        sellerId: seller.id,
        saleListingId: saleListing.id,
        requestedQuantity: 50,
        offeredQuantity: 50,
        unit: 'TON',
        status: 'INVITED',
      },
    });
    tradeSellerId = tradeSeller.id;
  });

  afterAll(async () => {
    // Clean up
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperationId: tradeOperationId },
    });
    await prisma.tradeOperation.deleteMany({
      where: { id: tradeOperationId },
    });
    await prisma.saleListing.deleteMany({
      where: { sellerId: sellerId },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: 'test-buyer-offers@test.com' } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { 
          in: [
            'test-admin-offers@agrotrade.com', 
            'test-buyer-offers@test.com', 
            'test-seller-offers@test.com'
          ] 
        },
      },
    });
    await app.close();
  });

  describe('Send Initial Offer', () => {
    it('should create new negotiation with PENDING status', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 325,
          quantity: 50,
          terms: 'Payment on delivery, quality inspection required',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          tradeOperationId: tradeOperationId,
          tradeSellerId: tradeSellerId,
          status: 'PENDING',
          currentOffer: {
            price: 325,
            quantity: 50,
            terms: 'Payment on delivery, quality inspection required',
          },
          offerHistory: expect.arrayContaining([
            expect.objectContaining({
              price: 325,
              quantity: 50,
              terms: 'Payment on delivery, quality inspection required',
              createdAt: expect.any(String),
            }),
          ]),
          expiresAt: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });

      // Verify TradeSeller status updated
      const tradeSeller = await prisma.tradeSeller.findUnique({
        where: { id: tradeSellerId },
      });
      expect(tradeSeller?.status).toBe('NEGOTIATING');
    });

    it('should reject duplicate offer to same seller', async () => {
      // First offer should succeed
      await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 320,
          quantity: 50,
          terms: 'Standard terms',
        })
        .expect(201);

      // Second offer to same seller should fail
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 330,
          quantity: 50,
          terms: 'Updated terms',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'NEGOTIATION_EXISTS',
          message: expect.stringContaining('already exists'),
        }),
      });
    });

    it('should validate seller belongs to trade operation', async () => {
      // Create a seller not in the trade
      const otherSeller = await prisma.user.create({
        data: {
          email: 'other-seller-offers@test.com',
          name: 'Other Seller',
          role: 'FARMER',
        },
      });

      const otherListing = await prisma.saleListing.create({
        data: {
          sellerId: otherSeller.id,
          productId: (await prisma.product.findFirst())!.id,
          quantity: 100,
          unit: 'TON',
          askingPrice: 340,
          status: 'ACTIVE',
        },
      });

      const otherTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: 'other-trade-id', // Different trade
          sellerId: otherSeller.id,
          saleListingId: otherListing.id,
          requestedQuantity: 50,
          offeredQuantity: 50,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: otherTradeSeller.id,
          price: 320,
          quantity: 50,
          terms: 'Standard terms',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_TRADE_SELLER',
          message: expect.stringContaining('not part of this trade'),
        }),
      });

      // Clean up
      await prisma.tradeSeller.delete({ where: { id: otherTradeSeller.id } });
      await prisma.saleListing.delete({ where: { id: otherListing.id } });
      await prisma.user.delete({ where: { id: otherSeller.id } });
    });

    it('should set expiration time to 48 hours by default', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 315,
          quantity: 50,
          terms: 'Standard terms',
        })
        .expect(201);

      const expiresAt = new Date(response.body.data.expiresAt);
      const now = new Date();
      const hoursUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      expect(hoursUntilExpiry).toBeGreaterThan(47);
      expect(hoursUntilExpiry).toBeLessThanOrEqual(48);
    });

    it('should validate price is positive', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: -100,
          quantity: 50,
          terms: 'Invalid price',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('price must be positive'),
        }),
      });
    });

    it('should validate quantity is positive', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 320,
          quantity: 0,
          terms: 'Invalid quantity',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('quantity must be positive'),
        }),
      });
    });

    it('should require all mandatory fields', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          // Missing price and quantity
          terms: 'Incomplete offer',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('required'),
        }),
      });
    });

    it('should validate trade operation exists', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/trade-operations/non-existent-id/offers')
        .send({
          tradeSellerId: tradeSellerId,
          price: 320,
          quantity: 50,
          terms: 'Standard terms',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'TRADE_NOT_FOUND',
        }),
      });
    });

    it('should validate trade operation is active', async () => {
      // Create a cancelled trade
      const cancelledTrade = await prisma.tradeOperation.create({
        data: {
          operationNumber: 'TRADE-CANCELLED-001',
          adminId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))!.id,
          buyListingId: (await prisma.buyListing.findFirst())!.id,
          phase: 'SELLER_NEGOTIATION',
          status: 'CANCELLED',
          profitMargin: 5,
          sellingPrice: 350,
          totalRevenue: 35000,
          currency: 'EUR',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${cancelledTrade.id}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 320,
          quantity: 50,
          terms: 'Standard terms',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.objectContaining({
          code: 'TRADE_NOT_ACTIVE',
          message: expect.stringContaining('not active'),
        }),
      });

      // Clean up
      await prisma.tradeOperation.delete({ where: { id: cancelledTrade.id } });
    });

    it('should calculate profit impact', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers`)
        .send({
          tradeSellerId: tradeSellerId,
          price: 330,
          quantity: 50,
          terms: 'Higher price offer',
        })
        .expect(201);

      expect(response.body.data).toMatchObject({
        profitImpact: expect.objectContaining({
          estimatedProfit: expect.any(Number),
          profitMargin: expect.any(Number),
          priceChange: expect.any(Number),
        }),
      });

      // Profit should be lower with higher purchase price
      expect(response.body.data.profitImpact.profitMargin).toBeLessThan(7.5);
    });
  });

  describe('Batch Send Offers', () => {
    it('should send offers to multiple sellers', async () => {
      // Create additional sellers
      const seller2 = await prisma.user.create({
        data: {
          email: 'test-seller2-batch@test.com',
          name: 'Test Seller2 Batch',
          role: 'FARMER',
        },
      });

      const saleListing2 = await prisma.saleListing.create({
        data: {
          sellerId: seller2.id,
          productId: (await prisma.product.findFirst())!.id,
          quantity: 60,
          unit: 'TON',
          askingPrice: 345,
          status: 'ACTIVE',
        },
      });

      const tradeSeller2 = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: tradeOperationId,
          sellerId: seller2.id,
          saleListingId: saleListing2.id,
          requestedQuantity: 50,
          offeredQuantity: 60,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers/batch`)
        .send({
          offers: [
            {
              tradeSellerId: tradeSellerId,
              price: 320,
              quantity: 50,
              terms: 'Offer to seller 1',
            },
            {
              tradeSellerId: tradeSeller2.id,
              price: 340,
              quantity: 50,
              terms: 'Offer to seller 2',
            },
          ],
        })
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          created: 2,
          failed: 0,
          negotiations: expect.arrayContaining([
            expect.objectContaining({
              tradeSellerId: tradeSellerId,
              status: 'PENDING',
            }),
            expect.objectContaining({
              tradeSellerId: tradeSeller2.id,
              status: 'PENDING',
            }),
          ]),
        },
      });

      // Clean up
      await prisma.offerNegotiation.deleteMany({
        where: { tradeSellerId: { in: [tradeSellerId, tradeSeller2.id] } },
      });
      await prisma.tradeSeller.delete({ where: { id: tradeSeller2.id } });
      await prisma.saleListing.delete({ where: { id: saleListing2.id } });
      await prisma.user.delete({ where: { id: seller2.id } });
    });

    it('should handle partial failures in batch', async () => {
      // Create one valid and one invalid offer
      const response = await request(app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/offers/batch`)
        .send({
          offers: [
            {
              tradeSellerId: tradeSellerId,
              price: 320,
              quantity: 50,
              terms: 'Valid offer',
            },
            {
              tradeSellerId: 'invalid-id',
              price: 340,
              quantity: 50,
              terms: 'Invalid seller',
            },
          ],
        })
        .expect(207); // Multi-status response

      expect(response.body).toMatchObject({
        success: true,
        data: {
          created: 1,
          failed: 1,
          negotiations: expect.arrayContaining([
            expect.objectContaining({
              tradeSellerId: tradeSellerId,
              status: 'PENDING',
            }),
          ]),
          errors: expect.arrayContaining([
            expect.objectContaining({
              tradeSellerId: 'invalid-id',
              error: expect.stringContaining('not found'),
            }),
          ]),
        },
      });
    });
  });
});