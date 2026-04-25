import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { MockAuthService } from "../src/auth/services/mock-auth.service";
import { JwtService } from "@nestjs/jwt";

describe("Matching Dashboard - Offer Creation Workflow (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockAuth: MockAuthService;
  let adminToken: string;
  let adminUser: any;
  let testBuyerId: string;
  let testBuyListingId: string;
  let testSellerIds: string[] = [];
  let testSaleListingIds: string[] = [];
  let testProductId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    mockAuth = new MockAuthService(app.get(JwtService));

    await setupTestData();
  }, 30000);

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // 1. Create/Get Product
    const product = await prisma.product.upsert({
      where: { category: "CORN_MAIZE" },
      update: {},
      create: {
        name: "Test Corn " + Date.now(),
        displayName: "Test Corn",
        category: "CORN_MAIZE",
      },
    });
    testProductId = product.id;

    // 2. Create Admin for Auth
    adminUser = await prisma.user.create({
      data: {
        email: "admin-matching-" + Date.now() + "@test.com",
        name: "Admin",
        role: "ADMIN",
      },
    });
    adminToken = mockAuth.sign(adminUser);

    // 3. Create Buyer & Buy Listing
    const buyer = await prisma.user.create({
      data: {
        email: "buyer-matching-" + Date.now() + "@test.com",
        name: "Buyer",
        role: "BUYER",
      },
    });
    testBuyerId = buyer.id;

    const buyerAddress = await prisma.address.create({
      data: {
        user: { connect: { id: testBuyerId } },
        addressType: "DELIVERY",
        country: "Bulgaria",
        latitude: 42.6977,
        longitude: 23.3219,
      },
    });

    const buyListing = await prisma.buyListing.create({
      data: {
        buyerId: testBuyerId,
        productId: testProductId,
        quantity: 100,
        unit: "TON",
        maxPricePerUnit: 400,
        status: "ACTIVE",
        deliveryAddressId: buyerAddress.id,
      },
    });
    testBuyListingId = buyListing.id;

    // 4. Create Sellers & Sale Listings
    for (let i = 1; i <= 2; i++) {
      const seller = await prisma.user.create({
        data: {
          email: `seller-matching-${i}-${Date.now()}@test.com`,
          name: `Seller ${i}`,
          role: "FARMER",
        },
      });
      testSellerIds.push(seller.id);

      const sellerAddress = await prisma.address.create({
        data: {
          user: { connect: { id: seller.id } },
          addressType: "FARM",
          country: "Bulgaria",
          latitude: 42.1 + i,
          longitude: 24.1 + i,
        },
      });

      const saleListing = await prisma.saleListing.create({
        data: {
          sellerId: seller.id,
          productId: testProductId,
          quantity: 100,
          unit: "TON",
          askingPrice: 300,
          status: "ACTIVE",
          addressId: sellerAddress.id,
        },
      });
      testSaleListingIds.push(saleListing.id);
    }
  }

  async function cleanupTestData() {
    // Delete in reverse order
    const tradeOpIds = (await prisma.tradeOperation.findMany({
        where: { buyListingId: testBuyListingId },
        select: { id: true }
    })).map(t => t.id);

    await prisma.offerNegotiation.deleteMany({ where: { tradeOperationId: { in: tradeOpIds } } });
    await prisma.tradeSeller.deleteMany({ where: { tradeOperationId: { in: tradeOpIds } } });
    await prisma.tradeOperation.deleteMany({ where: { id: { in: tradeOpIds } } });
    
    if (testBuyListingId) {
        await prisma.buyListing.deleteMany({ where: { id: testBuyListingId } });
    }
    
    const validSaleIds = testSaleListingIds.filter(Boolean);
    if (validSaleIds.length > 0) {
        await prisma.saleListing.deleteMany({ where: { id: { in: validSaleIds } } });
    }

    const userIds = [testBuyerId, ...testSellerIds, adminUser?.id].filter(Boolean);
    if (userIds.length > 0) {
        await prisma.address.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }

    if (testProductId) {
        await prisma.product.deleteMany({ where: { id: testProductId } });
    }
  }

  describe("Complete Offer Creation Flow", () => {
    it("should successfully create trade operation with sellers (matching PricingModal flow)", async () => {
      const payload = {
        buyListingId: testBuyListingId,
        adminId: adminUser.id,
        sellers: [
          {
            sellerId: testSellerIds[0],
            saleListingId: testSaleListingIds[0],
            requestedQuantity: 50,
            offerPrice: 350,
          },
          {
            sellerId: testSellerIds[1],
            saleListingId: testSaleListingIds[1],
            requestedQuantity: 50,
            offerPrice: 340,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty("tradeOperationId");
      expect(response.body.negotiations).toHaveLength(2);
      expect(response.body.phase).toBe("SELLER_NEGOTIATION");
    });

    it("should handle negative profit scenario (low offer prices)", async () => {
      // Create a trade that results in low margin
      const payload = {
        buyListingId: testBuyListingId,
        adminId: adminUser.id,
        sellers: [
          {
            sellerId: testSellerIds[0],
            saleListingId: testSaleListingIds[0],
            requestedQuantity: 50,
            offerPrice: 395, // Very high purchase price -> low margin
          }
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(payload)
        .expect(201);

      const tradeId = response.body.tradeOperationId;
      
      // Get profit metrics
      const profitRes = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeId}/profit`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      // It might be viable or not depending on default selling price, 
      // but we expect the numbers to be calculated
      expect(profitRes.body).toHaveProperty("netProfit");
    });

    it("should return validation error when buyListingId is missing", () => {
      return request(app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          sellers: [],
        })
        .expect(400);
    });
  });
});
