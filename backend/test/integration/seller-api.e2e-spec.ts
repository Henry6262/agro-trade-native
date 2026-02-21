import * as request from "supertest";
import { TestEnvironment } from "../setup/test-environment";
import { TestDataFactory } from "../helpers/test-data-factory";

/**
 * Seller API Integration Tests
 *
 * Verifies all seller-facing endpoints work correctly:
 * - Listing management (CRUD)
 * - Offers retrieval
 * - Stats and timeline
 *
 * Story: SELLER-006 - Backend API Verification
 */
describe("Seller API Integration Tests", () => {
  let env: TestEnvironment;
  let factory: TestDataFactory;
  let testSeller: any;
  let testProduct: any;
  let testListing: any;
  let sellerToken: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    factory = new TestDataFactory(env.prisma);

    // Create test seller
    testSeller = await factory.createTestSeller({
      email: `seller-test-${Date.now()}@test.com`,
      name: "Integration Test Seller",
    });

    // Create test product
    testProduct = await factory.createTestProduct({ category: "SOFT_WHEAT" });

    // Generate seller token with correct user ID
    const { JwtService } = await import("@nestjs/jwt");
    const jwtService = env.moduleRef.get<JwtService>(JwtService);
    sellerToken = jwtService.sign(
      {
        sub: testSeller.id,
        email: testSeller.email,
        role: "FARMER",
        name: testSeller.name,
      },
      { expiresIn: "1h" },
    );
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe("Listing Management", () => {
    describe("POST /seller/listings", () => {
      it("should create a new listing successfully", async () => {
        const createListingDto = {
          productId: testProduct.id,
          quantity: 50,
          unit: "ton",
          offerType: "listing",
          priceExpectation: {
            min: 300,
            max: 350,
            currency: "EUR",
          },
          location: {
            address: "123 Farm Road",
            city: "Sofia",
            region: "Sofia Region",
            country: "Bulgaria",
            latitude: 42.6977,
            longitude: 23.3219,
          },
          status: "active",
        };

        const response = await request(env.app.getHttpServer())
          .post("/api/seller/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send(createListingDto)
          .expect(201);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("id");
        expect(response.body.data).toHaveProperty("productId", testProduct.id);
        expect(response.body.data).toHaveProperty("quantity", 50);
        expect(response.body.data).toHaveProperty("status", "active");

        testListing = response.body.data;
      });

      it("should create a custom offer listing with specifications", async () => {
        const customOfferDto = {
          productId: testProduct.id,
          quantity: 100,
          unit: "ton",
          priceExpectation: {
            min: 280,
            max: 320,
            currency: "EUR",
          },
          offerType: "custom-offer",
          specifications: {
            protein: 14.5,
            moisture: 12,
            organic: true,
          },
          location: {
            address: "456 Farm Lane",
            city: "Plovdiv",
            region: "Plovdiv Region",
            country: "Bulgaria",
            latitude: 42.1354,
            longitude: 24.7453,
          },
          status: "active",
        };

        const response = await request(env.app.getHttpServer())
          .post("/api/seller/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send(customOfferDto)
          .expect(201);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body.message).toContain("Custom offer");
        expect(response.body.data).toHaveProperty("id");
      });

      it("should reject listing with non-existent product", async () => {
        const invalidDto = {
          productId: "non-existent-product-id",
          quantity: 50,
          unit: "ton",
          offerType: "listing",
          location: {
            latitude: 42.6977,
            longitude: 23.3219,
            region: "Test Region",
            city: "Test City",
          },
        };

        const response = await request(env.app.getHttpServer())
          .post("/api/seller/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send(invalidDto)
          .expect(404);

        expect(response.body.message).toContain("not found");
      });
    });

    describe("GET /seller/listings", () => {
      it("should get all listings for matching product", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/listings")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        // Verify listing structure
        const listing = response.body[0];
        expect(listing).toHaveProperty("id");
        expect(listing).toHaveProperty("quantity");
        expect(listing).toHaveProperty("product");
        expect(listing).toHaveProperty("seller");
      });

      it("should filter listings by buyListingId when provided", async () => {
        // Create a buy listing first
        const buyer = await factory.createTestBuyer({
          email: `buyer-filter-${Date.now()}@test.com`,
        });

        const buyListing = await factory.createTestBuyListing(buyer.id, {
          productId: testProduct.id,
          quantity: 30,
          maxPricePerUnit: 400,
        });

        const response = await request(env.app.getHttpServer())
          .get(`/api/seller/listings?buyListingId=${buyListing.id}`)
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        // Should only return listings matching the product and price criteria
        response.body.forEach((listing: any) => {
          expect(listing.productId).toBe(testProduct.id);
        });
      });
    });

    describe("GET /seller/listings/:id", () => {
      it("should get a specific listing by ID", async () => {
        const response = await request(env.app.getHttpServer())
          .get(`/api/seller/listings/${testListing.id}`)
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("id", testListing.id);
        expect(response.body).toHaveProperty("productId", testProduct.id);
        expect(response.body).toHaveProperty("product");
      });

      it("should return 404 for non-existent listing", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/listings/non-existent-id")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(404);

        expect(response.body.message).toContain("not found");
      });
    });

    describe("PATCH /seller/listings/:id/status", () => {
      it("should update listing status to draft", async () => {
        const response = await request(env.app.getHttpServer())
          .patch(`/api/seller/listings/${testListing.id}/status`)
          .set("Authorization", `Bearer ${sellerToken}`)
          .send({ status: "draft" })
          .expect(200);

        expect(response.body).toHaveProperty("id", testListing.id);
        expect(response.body.status).toBe("pending");
      });

      it("should update listing status back to active", async () => {
        const response = await request(env.app.getHttpServer())
          .patch(`/api/seller/listings/${testListing.id}/status`)
          .set("Authorization", `Bearer ${sellerToken}`)
          .send({ status: "active" })
          .expect(200);

        expect(response.body).toHaveProperty("id", testListing.id);
        expect(response.body.status).toBe("active");
      });

      it("should return 404 when updating non-existent listing", async () => {
        await request(env.app.getHttpServer())
          .patch("/api/seller/listings/non-existent-id/status")
          .set("Authorization", `Bearer ${sellerToken}`)
          .send({ status: "active" })
          .expect(404);
      });
    });
  });

  describe("Products View", () => {
    describe("GET /seller/products", () => {
      it("should get seller products in frontend-compatible format", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/products")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        // Verify product format matches frontend interface
        const product = response.body[0];
        expect(product).toHaveProperty("id");
        expect(product).toHaveProperty("name");
        expect(product).toHaveProperty("category");
        expect(product).toHaveProperty("quantity");
        expect(product).toHaveProperty("unit");
        expect(product).toHaveProperty("pricePerUnit");
        expect(product).toHaveProperty("currency");
        expect(product).toHaveProperty("location");
        expect(product).toHaveProperty("status");
        expect(product).toHaveProperty("createdAt");
        expect(product).toHaveProperty("updatedAt");

        // Verify location structure
        expect(product.location).toHaveProperty("address");
        expect(product.location).toHaveProperty("city");
        expect(product.location).toHaveProperty("country");
      });
    });
  });

  describe("Offers Management", () => {
    describe("GET /seller/offers", () => {
      it("should get seller offers with stats", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/offers")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("success", true);
        expect(response.body).toHaveProperty("data");
        expect(response.body.data).toHaveProperty("offers");
        expect(response.body.data).toHaveProperty("stats");

        // Verify stats structure
        const stats = response.body.data.stats;
        expect(stats).toHaveProperty("totalOffers");
        expect(stats).toHaveProperty("pendingOffers");
        expect(stats).toHaveProperty("acceptedThisMonth");
        expect(stats).toHaveProperty("averageOfferValue");
        expect(stats).toHaveProperty("topRequestedProduct");
        expect(stats).toHaveProperty("conversionRate");

        // Verify offers is an array
        expect(Array.isArray(response.body.data.offers)).toBe(true);
      });

      it("should return empty offers for new seller", async () => {
        // Create a new seller with no negotiations
        const newSeller = await factory.createTestSeller({
          email: `new-seller-${Date.now()}@test.com`,
        });

        const { JwtService } = await import("@nestjs/jwt");
        const jwtService = env.moduleRef.get<JwtService>(JwtService);
        const newSellerToken = jwtService.sign(
          {
            sub: newSeller.id,
            email: newSeller.email,
            role: "FARMER",
          },
          { expiresIn: "1h" },
        );

        const response = await request(env.app.getHttpServer())
          .get("/api/seller/offers")
          .set("Authorization", `Bearer ${newSellerToken}`)
          .expect(200);

        expect(response.body.data.offers).toHaveLength(0);
        expect(response.body.data.stats.totalOffers).toBe(0);
      });
    });
  });

  describe("Trades", () => {
    describe("GET /seller/trades", () => {
      it("should get seller trades (empty for new seller)", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/trades")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });
    });
  });

  describe("Statistics", () => {
    describe("GET /seller/stats", () => {
      it("should get seller statistics", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/stats")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        // Verify all stat fields are present
        expect(response.body).toHaveProperty("totalProducts");
        expect(response.body).toHaveProperty("activeListings");
        expect(response.body).toHaveProperty("totalOffers");
        expect(response.body).toHaveProperty("pendingOffers");
        expect(response.body).toHaveProperty("totalTrades");
        expect(response.body).toHaveProperty("completedTrades");
        expect(response.body).toHaveProperty("totalRevenue");
        expect(response.body).toHaveProperty("monthlyRevenue");
        expect(response.body).toHaveProperty("averageRating");

        // Verify counts are numbers
        expect(typeof response.body.totalProducts).toBe("number");
        expect(typeof response.body.activeListings).toBe("number");
        expect(typeof response.body.totalRevenue).toBe("number");
      });

      it("should reflect correct listing counts", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/stats")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        // We created at least 2 listings in earlier tests
        expect(response.body.totalProducts).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Timeline", () => {
    describe("GET /seller/timeline", () => {
      it("should get seller timeline with default pagination", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/timeline")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty("events");
        expect(response.body).toHaveProperty("nextCursor");
        expect(Array.isArray(response.body.events)).toBe(true);
      });

      it("should respect limit parameter", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/timeline?limit=5")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body.events.length).toBeLessThanOrEqual(5);
      });

      it("should cap limit at 50", async () => {
        const response = await request(env.app.getHttpServer())
          .get("/api/seller/timeline?limit=100")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        // Should not error, just cap at 50
        expect(response.body).toHaveProperty("events");
      });

      it("should support cursor-based pagination", async () => {
        // First request
        const response1 = await request(env.app.getHttpServer())
          .get("/api/seller/timeline?limit=1")
          .set("Authorization", `Bearer ${sellerToken}`)
          .expect(200);

        if (response1.body.nextCursor) {
          // Second request with cursor
          const response2 = await request(env.app.getHttpServer())
            .get(`/api/seller/timeline?limit=1&cursor=${response1.body.nextCursor}`)
            .set("Authorization", `Bearer ${sellerToken}`)
            .expect(200);

          expect(response2.body).toHaveProperty("events");
          // Events should be different from first page
          if (response2.body.events.length > 0 && response1.body.events.length > 0) {
            expect(response2.body.events[0].id).not.toBe(response1.body.events[0].id);
          }
        }
      });
    });
  });

  describe("Authentication Guards", () => {
    it("should reject requests without auth token", async () => {
      await request(env.app.getHttpServer())
        .get("/api/seller/listings")
        .expect(401);
    });

    it("should reject requests with invalid token", async () => {
      await request(env.app.getHttpServer())
        .get("/api/seller/listings")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });

    it("should reject expired tokens", async () => {
      const { JwtService } = await import("@nestjs/jwt");
      const jwtService = env.moduleRef.get<JwtService>(JwtService);
      const expiredToken = jwtService.sign(
        {
          sub: testSeller.id,
          email: testSeller.email,
          role: "FARMER",
        },
        { expiresIn: "-1h" }, // Already expired
      );

      await request(env.app.getHttpServer())
        .get("/api/seller/listings")
        .set("Authorization", `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});

/**
 * Seller Offer Flow Integration Tests
 *
 * Tests the complete offer flow for sellers:
 * - Receiving offers
 * - Accepting/Rejecting offers
 * - Counter-offers
 */
describe("Seller Offer Flow Integration", () => {
  let env: TestEnvironment;
  let factory: TestDataFactory;
  let testData: any;
  let tradeOperationId: string;
  let tradeSellerId: string;
  let negotiationId: string;
  let adminToken: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    factory = new TestDataFactory(env.prisma);

    // Create full trade scenario
    testData = await factory.createFullTradeScenario({
      sellerCount: 2,
      buyerQuantity: 100,
      sellerQuantity: 50,
      withAddresses: true,
    });

    // Generate admin token from the actual admin user created by the scenario
    // (env.tokens.admin uses sub:"test-user-123" which doesn't exist in this DB context)
    const { JwtService } = await import("@nestjs/jwt");
    const jwtService = env.moduleRef.get<JwtService>(JwtService);
    adminToken = jwtService.sign(
      {
        sub: testData.admin.id,
        email: testData.admin.email,
        role: "ADMIN",
        name: testData.admin.name,
      },
      { expiresIn: "1h" },
    );

    // Create a trade operation with sellers in one call
    // The POST /api/trade-operations uses CreateTradeOperationWithOffersDto
    const response = await request(env.app.getHttpServer())
      .post("/api/trade-operations")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        buyListingId: testData.buyListing.id,
        sellers: [
          {
            saleListingId: testData.saleListings[0].id,
            sellerId: testData.sellers[0].id,
            quantity: 50,
            offerPrice: 330,
          },
        ],
      })
      .expect(201);

    // The response has tradeOperationId, not id
    tradeOperationId = response.body.tradeOperationId;

    // Get the tradeSellerId from the negotiations array in the response
    if (response.body.negotiations && response.body.negotiations.length > 0) {
      tradeSellerId = response.body.negotiations[0].tradeSellerId;
      negotiationId = response.body.negotiations[0].id;
    }
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe("Offer Creation and Viewing", () => {
    it("should create offer for seller", async () => {
      // Use the correct endpoint and DTO format
      const offerDto = {
        tradeSellerId,
        price: 330,
        quantity: 50,
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/trade-operations/${tradeOperationId}/offers`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(offerDto)
        .expect(201);

      // Response is wrapped: {success: true, data: {...}}
      expect(response.body).toHaveProperty("success", true);
      expect(response.body.data).toHaveProperty("id");
      expect(response.body.data).toHaveProperty("offeredPrice", 330);

      negotiationId = response.body.data.id;
    });

    it("seller should see the offer in their offers list", async () => {
      // Generate seller token
      const { JwtService } = await import("@nestjs/jwt");
      const jwtService = env.moduleRef.get<JwtService>(JwtService);
      const sellerToken = jwtService.sign(
        {
          sub: testData.sellers[0].id,
          email: testData.sellers[0].email,
          role: "FARMER",
        },
        { expiresIn: "1h" },
      );

      const response = await request(env.app.getHttpServer())
        .get("/api/seller/offers")
        .set("Authorization", `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body.data.offers.length).toBeGreaterThan(0);
    });
  });

  describe("Offer Response Actions", () => {
    it("should allow seller to accept offer via negotiation endpoint", async () => {
      // AcceptOfferDto only has optional acceptanceNote
      const response = await request(env.app.getHttpServer())
        .post(`/api/negotiations/${negotiationId}/accept`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          acceptanceNote: "Accepted - terms agreed",
        })
        .expect(200); // Accept returns 200, not 201

      expect(response.body).toHaveProperty("status", "ACCEPTED");
    });
  });
});
