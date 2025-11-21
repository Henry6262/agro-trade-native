import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TradePhase } from '@prisma/client';

describe('Multi-Seller Coordination - Integration Test', () => {
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
    // Clean up
    await prisma.offerNegotiation.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'MULTI-SELLER' } } },
    });
    await prisma.tradeSeller.deleteMany({
      where: { tradeOperation: { operationNumber: { contains: 'MULTI-SELLER' } } },
    });
    await prisma.tradeOperation.deleteMany({
      where: { operationNumber: { contains: 'MULTI-SELLER' } },
    });
    await prisma.saleListing.deleteMany({
      where: { seller: { email: { contains: 'multi-seller' } } },
    });
    await prisma.buyListing.deleteMany({
      where: { buyer: { email: { contains: 'multi-seller' } } },
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'multi-seller' } },
    });
    await app.close();
  });

  describe('Large Order Distribution Across Multiple Sellers', () => {
    it('should coordinate 500 ton order across 5 sellers', async () => {
      // Setup: Large buyer order
      const admin = await prisma.user.create({
        data: {
          email: 'admin-multi-seller@agrotrade.com',
          name: 'Multi Seller Admin',
          role: 'ADMIN',
        },
      });

      const buyer = await prisma.user.create({
        data: {
          email: 'buyer-multi-seller@test.com',
          name: 'Large Order Buyer',
          role: 'BUYER',
        },
      });

      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer.id,
          productId: product!.id,
          quantity: 500, // Large order
          unit: 'TON',
          maxPricePerUnit: 400,
          status: 'ACTIVE',
        },
      });

      // Create 5 sellers with varying capacities and prices
      const sellerData = [
        { name: 'Small Farm 1', capacity: 50, price: 340 },
        { name: 'Medium Farm 2', capacity: 100, price: 335 },
        { name: 'Large Farm 3', capacity: 150, price: 330 },
        { name: 'Medium Farm 4', capacity: 120, price: 338 },
        { name: 'Small Farm 5', capacity: 80, price: 342 },
      ];

      const sellers = await Promise.all(
        sellerData.map((data, index) =>
          prisma.user.create({
            data: {
              email: `seller${index + 1}-multi-seller@test.com`,
              name: data.name,
              role: 'FARMER',
            },
          })
        )
      );

      const saleListings = await Promise.all(
        sellers.map((seller, index) =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: sellerData[index].capacity,
              unit: 'TON',
              askingPrice: sellerData[index].price,
              status: 'ACTIVE',
            },
          })
        )
      );

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `MULTI-SELLER-${Date.now()}`,
          adminId: admin.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 8,
          sellingPrice: 375,
          totalRevenue: 187500, // 500 * 375
          currency: 'EUR',
        },
      });

      // Add all sellers to trade
      const tradeSellers = await Promise.all(
        sellers.map((seller, index) =>
          prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: seller.id,
              saleListingId: saleListings[index].id,
              requestedQuantity: sellerData[index].capacity,
              offeredQuantity: sellerData[index].capacity,
              unit: 'TON',
              status: 'INVITED',
            },
          })
        )
      );

      // Step 1: Optimize seller selection based on price
      const optimizationResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/optimize-sellers`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(optimizationResponse.body.data).toMatchObject({
        recommendedSellers: expect.arrayContaining([
          expect.objectContaining({
            name: 'Large Farm 3',
            price: 330,
            quantity: 150,
            costContribution: 49500, // 150 * 330
          }),
          expect.objectContaining({
            name: 'Medium Farm 2',
            price: 335,
            quantity: 100,
            costContribution: 33500,
          }),
        ]),
        totalQuantity: 500,
        averagePrice: expect.any(Number),
        estimatedTotalCost: expect.any(Number),
        estimatedProfit: expect.any(Number),
      });

      // Step 2: Send batch offers to recommended sellers
      const recommendedSellerIds = optimizationResponse.body.data.recommendedSellers
        .map(rs => tradeSellers.find(ts => 
          saleListings.find(sl => sl.sellerId === ts.sellerId)?.askingPrice === rs.price
        )?.id);

      const batchOfferResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers/batch`)
        .set('Authorization', adminToken)
        .send({
          offers: recommendedSellerIds.map((tsId, index) => ({
            tradeSellerId: tsId,
            price: optimizationResponse.body.data.recommendedSellers[index].price - 5, // Negotiate lower
            quantity: optimizationResponse.body.data.recommendedSellers[index].quantity,
            terms: 'Bulk order discount requested',
          })),
        })
        .expect(201);

      expect(batchOfferResponse.body.data.created).toBeGreaterThanOrEqual(3);

      // Step 3: Simulate seller responses
      const negotiations = batchOfferResponse.body.data.negotiations;
      
      // Large Farm 3 accepts (best price)
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[0].id}/accept`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          acceptanceNote: 'Accepting bulk order',
        })
        .expect(200);

      // Medium Farm 2 counters
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[1].id}/counter`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          price: 333, // Small increase
          quantity: 100,
          terms: 'Can do 333 for bulk',
        })
        .expect(201);

      // Accept counter
      await request(app.getHttpServer())
        .post(`/api/negotiations/${negotiations[1].id}/accept`)
        .set('Authorization', adminToken)
        .send({
          acceptanceNote: 'Accepting counter',
        })
        .expect(200);

      // Continue until 500 tons secured
      // ... additional negotiations

      // Step 4: Verify quantity allocation
      const allocationResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/allocation`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(allocationResponse.body.data).toMatchObject({
        totalRequested: 500,
        totalSecured: expect.any(Number),
        allocations: expect.arrayContaining([
          expect.objectContaining({
            seller: expect.any(String),
            quantity: expect.any(Number),
            price: expect.any(Number),
            status: 'ACCEPTED',
          }),
        ]),
        shortfall: expect.any(Number),
      });
    });
  });

  describe('Dynamic Seller Addition', () => {
    it('should add sellers dynamically when initial sellers insufficient', async () => {
      // Create trade with insufficient initial sellers
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 200,
          unit: 'TON',
          maxPricePerUnit: 380,
          status: 'ACTIVE',
        },
      });

      // Start with only 2 sellers (insufficient)
      const initialSellers = await Promise.all([
        prisma.user.create({
          data: {
            email: 'initial1-multi-seller@test.com',
            name: 'Initial Seller 1',
            role: 'FARMER',
          },
        }),
        prisma.user.create({
          data: {
            email: 'initial2-multi-seller@test.com',
            name: 'Initial Seller 2',
            role: 'FARMER',
          },
        }),
      ]);

      const initialListings = await Promise.all(
        initialSellers.map(seller =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 60, // Only 120 tons total
              unit: 'TON',
              askingPrice: 345,
              status: 'ACTIVE',
            },
          })
        )
      );

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `MULTI-SELLER-DYNAMIC-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 7,
          sellingPrice: 370,
          totalRevenue: 74000,
          currency: 'EUR',
        },
      });

      // Add initial sellers
      const initialTradeSellers = await Promise.all(
        initialListings.map((listing, index) =>
          prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: initialSellers[index].id,
              saleListingId: listing.id,
              requestedQuantity: 60,
              offeredQuantity: 60,
              unit: 'TON',
              status: 'NEGOTIATING',
              agreedQuantity: 60,
              agreedPrice: 345,
            },
          })
        )
      );

      // Check quantity gap
      const gapResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/quantity-gap`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(gapResponse.body.data).toMatchObject({
        required: 200,
        secured: 120,
        gap: 80,
        needsMoreSellers: true,
      });

      // Find additional sellers
      const availableResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/available-sellers?quantity=80`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(availableResponse.body.data.sellers).toBeInstanceOf(Array);
      
      // Add new sellers dynamically
      const newSeller = await prisma.user.create({
        data: {
          email: 'dynamic-multi-seller@test.com',
          name: 'Dynamic Seller',
          role: 'FARMER',
        },
      });

      const newListing = await prisma.saleListing.create({
        data: {
          sellerId: newSeller.id,
          productId: product!.id,
          quantity: 80,
          unit: 'TON',
          askingPrice: 348,
          status: 'ACTIVE',
        },
      });

      // Add to trade
      const addSellerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/sellers`)
        .set('Authorization', adminToken)
        .send({
          sellerId: newSeller.id,
          saleListingId: newListing.id,
          requestedQuantity: 80,
        })
        .expect(201);

      expect(addSellerResponse.body.data).toMatchObject({
        status: 'INVITED',
        requestedQuantity: 80,
      });

      // Send offer to new seller
      const offerResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: addSellerResponse.body.data.id,
          price: 346,
          quantity: 80,
          terms: 'Additional quantity needed',
        })
        .expect(201);

      // Accept to complete quantity
      await request(app.getHttpServer())
        .post(`/api/negotiations/${offerResponse.body.data.id}/accept`)
        .set('Authorization', 'Bearer seller-token')
        .send({})
        .expect(200);

      // Verify full quantity secured
      const finalGapResponse = await request(app.getHttpServer())
        .get(`/api/trade-operations/${trade.id}/quantity-gap`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(finalGapResponse.body.data).toMatchObject({
        required: 200,
        secured: 200,
        gap: 0,
        needsMoreSellers: false,
      });
    });
  });

  describe('Seller Replacement on Rejection', () => {
    it('should automatically suggest replacements when seller rejects', async () => {
      // Setup trade with multiple potential sellers
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 150,
          unit: 'TON',
          maxPricePerUnit: 360,
          status: 'ACTIVE',
        },
      });

      // Create pool of sellers
      const sellerPool = await Promise.all(
        Array(5).fill(0).map((_, i) =>
          prisma.user.create({
            data: {
              email: `pool-seller${i}-multi@test.com`,
              name: `Pool Seller ${i}`,
              role: 'FARMER',
            },
          })
        )
      );

      const listings = await Promise.all(
        sellerPool.map((seller, i) =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: 50 + i * 10,
              unit: 'TON',
              askingPrice: 335 + i * 2,
              status: 'ACTIVE',
            },
          })
        )
      );

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `MULTI-SELLER-REPLACE-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 6,
          sellingPrice: 365,
          totalRevenue: 54750,
          currency: 'EUR',
        },
      });

      // Initially select first 3 sellers
      const selectedSellers = await Promise.all(
        listings.slice(0, 3).map((listing, i) =>
          prisma.tradeSeller.create({
            data: {
              tradeOperationId: trade.id,
              sellerId: sellerPool[i].id,
              saleListingId: listing.id,
              requestedQuantity: 50,
              offeredQuantity: listing.quantity,
              unit: 'TON',
              status: 'INVITED',
            },
          })
        )
      );

      // Send offers
      const offers = await Promise.all(
        selectedSellers.map(ts =>
          request(app.getHttpServer())
            .post(`/api/trade-operations/${trade.id}/offers`)
            .set('Authorization', adminToken)
            .send({
              tradeSellerId: ts.id,
              price: 333,
              quantity: 50,
              terms: 'Standard offer',
            })
            .expect(201)
        )
      );

      // First seller rejects
      const rejectResponse = await request(app.getHttpServer())
        .post(`/api/negotiations/${offers[0].body.data.id}/reject`)
        .set('Authorization', 'Bearer seller-token')
        .send({
          reason: 'Price too low',
        })
        .expect(200);

      // System should suggest replacements
      expect(rejectResponse.body.data.replacementSuggestions).toMatchObject({
        available: true,
        suggestions: expect.arrayContaining([
          expect.objectContaining({
            sellerId: expect.any(String),
            quantity: expect.any(Number),
            askingPrice: expect.any(Number),
            priceComparison: expect.any(String), // e.g., "+2 EUR vs rejected"
          }),
        ]),
      });

      // Add replacement seller
      const replacement = rejectResponse.body.data.replacementSuggestions.suggestions[0];
      const replacementListing = listings.find(l => l.sellerId === replacement.sellerId);
      
      const newTradeSeller = await prisma.tradeSeller.create({
        data: {
          tradeOperationId: trade.id,
          sellerId: replacement.sellerId,
          saleListingId: replacementListing!.id,
          requestedQuantity: 50,
          offeredQuantity: replacement.quantity,
          unit: 'TON',
          status: 'INVITED',
        },
      });

      // Send offer to replacement
      const replacementOffer = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/offers`)
        .set('Authorization', adminToken)
        .send({
          tradeSellerId: newTradeSeller.id,
          price: replacement.askingPrice - 2,
          quantity: 50,
          terms: 'Replacement seller offer',
        })
        .expect(201);

      expect(replacementOffer.body.success).toBe(true);
    });
  });

  describe('Profit Optimization Across Sellers', () => {
    it('should balance quantity allocation for optimal profit', async () => {
      // Create scenario where cheapest seller has limited quantity
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const buyer = await prisma.user.findFirst({ where: { role: 'BUYER' } });
      const product = await prisma.product.findFirst();

      const buyListing = await prisma.buyListing.create({
        data: {
          buyerId: buyer!.id,
          productId: product!.id,
          quantity: 300,
          unit: 'TON',
          maxPricePerUnit: 380,
          status: 'ACTIVE',
        },
      });

      // Sellers with inverse price/quantity relationship
      const sellerConfigs = [
        { quantity: 50, price: 320 },  // Cheap but limited
        { quantity: 200, price: 340 }, // Expensive but abundant
        { quantity: 100, price: 330 }, // Middle ground
      ];

      const sellers = await Promise.all(
        sellerConfigs.map((config, i) =>
          prisma.user.create({
            data: {
              email: `profit-seller${i}@test.com`,
              name: `Profit Seller ${i}`,
              role: 'FARMER',
            },
          })
        )
      );

      const listings = await Promise.all(
        sellers.map((seller, i) =>
          prisma.saleListing.create({
            data: {
              sellerId: seller.id,
              productId: product!.id,
              quantity: sellerConfigs[i].quantity,
              unit: 'TON',
              askingPrice: sellerConfigs[i].price,
              status: 'ACTIVE',
            },
          })
        )
      );

      const trade = await prisma.tradeOperation.create({
        data: {
          operationNumber: `MULTI-SELLER-PROFIT-${Date.now()}`,
          adminId: admin!.id,
          buyListingId: buyListing.id,
          phase: TradePhase.SELLER_NEGOTIATION,
          status: 'ACTIVE',
          profitMargin: 10,
          sellingPrice: 370,
          totalRevenue: 111000,
          currency: 'EUR',
        },
      });

      // Get profit optimization
      const optimizeResponse = await request(app.getHttpServer())
        .post(`/api/trade-operations/${trade.id}/optimize-profit`)
        .set('Authorization', adminToken)
        .send({
          targetMargin: 10,
          maxSellers: 3,
        })
        .expect(200);

      expect(optimizeResponse.body.data).toMatchObject({
        optimalAllocation: expect.arrayContaining([
          expect.objectContaining({
            sellerId: expect.any(String),
            quantity: 50,
            price: 320,
            contribution: 16000, // 50 * 320
            reason: 'Lowest price, take full quantity',
          }),
          expect.objectContaining({
            sellerId: expect.any(String),
            quantity: 100,
            price: 330,
            contribution: 33000,
            reason: 'Good price/quantity balance',
          }),
          expect.objectContaining({
            sellerId: expect.any(String),
            quantity: 150, // Remainder
            price: 340,
            contribution: 51000,
            reason: 'Complete order despite higher price',
          }),
        ]),
        totalCost: 100000, // 16000 + 33000 + 51000
        estimatedProfit: 11000, // 111000 - 100000
        profitMargin: 9.91, // (11000/111000) * 100
        meetsTarget: false, // Slightly below 10%
      });
    });
  });
});