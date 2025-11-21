import * as request from "supertest";
import { TestEnvironment } from "../setup/test-environment";

describe("Trade Operations Integration Tests", () => {
  let env: TestEnvironment;
  let testData: any;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();
  });

  afterAll(async () => {
    await env.teardown();
  });

  describe("Trade Operation Creation", () => {
    it("should create a new trade operation with profit calculation", async () => {
      const createDto = {
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 7.5,
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        buyListingId: testData.buyListing.id,
        status: "ACTIVE",
        targetProfitMargin: 7.5,
        currency: "EUR",
      });

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("operationNumber");
      expect(response.body).toHaveProperty("sellingPrice");
      expect(response.body).toHaveProperty("totalRevenue");
    });

    it("should validate minimum profit margin", async () => {
      const createDto = {
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 3, // Below minimum of 5%
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(createDto)
        .expect(400);

      expect(response.body.message).toContain("Min");
    });

    it("should require admin role", async () => {
      const createDto = {
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 7,
      };

      await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.buyer}`)
        .send(createDto)
        .expect(403);
    });
  });

  describe("Finding Matching Sellers", () => {
    let tradeOperationId: string;

    beforeEach(async () => {
      // Create a trade operation
      const response = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          targetProfitMargin: 7,
        })
        .expect(201);

      tradeOperationId = response.body.id;
    });

    it("should find matching sellers based on product and location", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({ maxDistance: 200 })
        .expect(200);

      expect(response.body).toHaveProperty("sellers");
      expect(response.body.sellers).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty("totalQuantityAvailable");
      expect(response.body).toHaveProperty("averagePrice");
      expect(response.body).toHaveProperty("recommendedSellers");

      // Should include our test sellers
      const sellerIds = response.body.sellers.map((s: any) => s.sellerId);
      expect(sellerIds).toContain(testData.users.seller1.id);
      expect(sellerIds).toContain(testData.users.seller2.id);
    });

    it("should rank sellers by match score", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      const sellers = response.body.sellers;

      // Check that sellers are sorted by match score
      for (let i = 1; i < sellers.length; i++) {
        expect(sellers[i - 1].matchScore).toBeGreaterThanOrEqual(
          sellers[i].matchScore,
        );
      }

      // Check score components
      expect(sellers[0]).toHaveProperty("matchScore");
      expect(sellers[0]).toHaveProperty("distance");
      expect(sellers[0]).toHaveProperty("askingPrice");
    });
  });

  describe("Selecting Sellers", () => {
    let tradeOperationId: string;

    beforeEach(async () => {
      const response = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          targetProfitMargin: 7,
        })
        .expect(201);

      tradeOperationId = response.body.id;
    });

    it("should select multiple sellers for trade operation", async () => {
      const selectDto = {
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 50,
          },
          {
            sellerId: testData.users.seller2.id,
            saleListingId: testData.saleListings[1].id,
            requestedQuantity: 50,
          },
        ],
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(selectDto)
        .expect(201);

      expect(response.body).toHaveProperty("selectedSellers");
      expect(response.body.selectedSellers).toHaveLength(2);
      expect(response.body).toHaveProperty("totalQuantity", 100);
      expect(response.body).toHaveProperty("estimatedPurchaseCost");
    });

    it("should validate total quantity matches requirement", async () => {
      const selectDto = {
        sellers: [
          {
            sellerId: testData.users.seller1.id,
            saleListingId: testData.saleListings[0].id,
            requestedQuantity: 30, // Total only 30, need 100
          },
        ],
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(selectDto)
        .expect(400);

      expect(response.body.message).toContain("quantity");
    });
  });

  describe("Transport Optimization", () => {
    let tradeOperationId: string;

    beforeEach(async () => {
      // Create trade operation and select sellers
      const createResponse = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          targetProfitMargin: 7,
        })
        .expect(201);

      tradeOperationId = createResponse.body.id;

      // Select sellers
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [
            {
              sellerId: testData.users.seller1.id,
              saleListingId: testData.saleListings[0].id,
              requestedQuantity: 60,
            },
            {
              sellerId: testData.users.seller2.id,
              saleListingId: testData.saleListings[1].id,
              requestedQuantity: 40,
            },
          ],
        })
        .expect(201);
    });

    it("should optimize transport route using TSP algorithm", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({ algorithm: "TSP_NEAREST" })
        .expect(201);

      expect(response.body).toHaveProperty("route");
      expect(response.body.route).toHaveProperty("waypoints");
      expect(response.body.route).toHaveProperty("totalDistance");
      expect(response.body.route).toHaveProperty("estimatedDuration");

      expect(response.body).toHaveProperty("estimation");
      expect(response.body.estimation).toHaveProperty("totalCost");
      expect(response.body.estimation).toHaveProperty("costPerKm");
      expect(response.body.estimation).toHaveProperty("fuelCost");

      expect(response.body).toHaveProperty("optimization");
      expect(response.body.optimization).toHaveProperty(
        "algorithm",
        "TSP_NEAREST",
      );
      expect(response.body.optimization).toHaveProperty("savings");
    });

    it("should compare different optimization algorithms", async () => {
      const algorithms = ["TSP_NEAREST", "TSP_2OPT", "GENETIC"];
      const results = [];

      for (const algorithm of algorithms) {
        const response = await request(env.app.getHttpServer())
          .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send({ algorithm })
          .expect(201);

        results.push({
          algorithm,
          distance: response.body.route.totalDistance,
          cost: response.body.estimation.totalCost,
        });
      }

      // Genetic algorithm should generally produce better or equal results
      const genetic = results.find((r) => r.algorithm === "GENETIC");
      const nearest = results.find((r) => r.algorithm === "TSP_NEAREST");

      expect(genetic!.distance).toBeLessThanOrEqual(nearest!.distance);
      expect(genetic!.cost).toBeLessThanOrEqual(nearest!.cost);
    });
  });

  describe("Trade Operation Analytics", () => {
    beforeEach(async () => {
      // Create multiple trade operations
      for (let i = 0; i < 3; i++) {
        await request(env.app.getHttpServer())
          .post("/api/trade-operations")
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send({
            buyListingId: testData.buyListing.id,
            targetProfitMargin: 6 + i, // 6%, 7%, 8%
          })
          .expect(201);
      }
    });

    it("should provide analytics for all trade operations", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/trade-operations/analytics")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("totalOperations");
      expect(response.body.totalOperations).toBeGreaterThanOrEqual(3);

      expect(response.body).toHaveProperty("statusBreakdown");
      expect(response.body.statusBreakdown).toHaveProperty("ACTIVE");

      expect(response.body).toHaveProperty("profitMetrics");
      expect(response.body.profitMetrics).toHaveProperty("averageMargin");
      expect(response.body.profitMetrics).toHaveProperty(
        "totalEstimatedProfit",
      );

      expect(response.body).toHaveProperty("topProducts");
      expect(response.body).toHaveProperty("recentOperations");
    });

    it("should filter analytics by date range", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/trade-operations/analytics")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty("totalOperations");
      expect(response.body).toHaveProperty("dateRange");
      expect(response.body.dateRange).toHaveProperty("start");
      expect(response.body.dateRange).toHaveProperty("end");
    });
  });

  describe("Trade Operation Finalization", () => {
    let tradeOperationId: string;

    beforeEach(async () => {
      // Create and setup trade operation
      const createResponse = await request(env.app.getHttpServer())
        .post("/api/trade-operations")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          buyListingId: testData.buyListing.id,
          targetProfitMargin: 7.5,
        })
        .expect(201);

      tradeOperationId = createResponse.body.id;

      // Select sellers
      await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/sellers`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          sellers: [
            {
              sellerId: testData.users.seller1.id,
              saleListingId: testData.saleListings[0].id,
              requestedQuantity: 60,
            },
            {
              sellerId: testData.users.seller2.id,
              saleListingId: testData.saleListings[1].id,
              requestedQuantity: 40,
            },
          ],
        })
        .expect(201);
    });

    it("should finalize trade operation with profit validation", async () => {
      const finalizeDto = {
        finalSellingPrice: 375,
        finalPurchasePrices: [
          { sellerId: testData.users.seller1.id, price: 345 },
          { sellerId: testData.users.seller2.id, price: 350 },
        ],
        actualTransportCost: 1200,
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/finalize`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(finalizeDto)
        .expect(201);

      expect(response.body).toHaveProperty("status", "CONFIRMED");
      expect(response.body).toHaveProperty("actualProfit");
      expect(response.body).toHaveProperty("actualProfitMargin");
      expect(response.body).toHaveProperty("profitAnalysis");

      expect(response.body.profitAnalysis).toHaveProperty("targetMet");
      expect(response.body.profitAnalysis).toHaveProperty("marginDifference");
      expect(response.body.profitAnalysis).toHaveProperty("viability");

      // Calculate expected profit
      const revenue = 375 * 100; // €37,500
      const purchaseCost = 345 * 60 + 350 * 40; // €34,700
      const transportCost = 1200;
      const expectedProfit = revenue - purchaseCost - transportCost;
      const expectedMargin = (expectedProfit / revenue) * 100;

      expect(response.body.actualProfit).toBeCloseTo(expectedProfit, 2);
      expect(response.body.actualProfitMargin).toBeCloseTo(expectedMargin, 2);
    });

    it("should reject finalization if profit margin too low", async () => {
      const finalizeDto = {
        finalSellingPrice: 355, // Too low - will result in < 5% margin
        finalPurchasePrices: [
          { sellerId: testData.users.seller1.id, price: 345 },
          { sellerId: testData.users.seller2.id, price: 350 },
        ],
        actualTransportCost: 1500,
      };

      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/finalize`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(finalizeDto)
        .expect(400);

      expect(response.body.message).toContain("margin");
      expect(response.body.message).toContain("5%");
    });
  });
});
