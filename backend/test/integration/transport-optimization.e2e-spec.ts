import request from "supertest";
import { TestEnvironment } from "../setup/test-environment";

describe("Transport Optimization Integration Tests", () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();

    // Create a base trade operation
    const response = await request(env.app.getHttpServer())
      .post("/api/trade-operations")
      .set("Authorization", `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        adminId: testData.users.admin.id,
        sellers: [],
      })
      .expect(201);

    tradeOperationId = response.body.id || response.body.tradeOperationId;

    // Add sellers
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

  afterAll(async () => {
    await env.teardown();
  });

  describe("Transport Cost Estimation", () => {
    it("should estimate transport costs for single destination", async () => {
      const estimationDto = {
        pickupPoints: [
          {
            lat: 48.8566,
            lng: 2.3522,
            quantity: 100,
          }
        ],
        deliveryPoint: {
          lat: 45.4642,
          lng: 9.19,
        },
        vehicleType: "FLATBED",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body).toHaveProperty("totalDistance");
      expect(response.body).toHaveProperty("totalCost");
      expect(response.body).toHaveProperty("breakdown");
      expect(response.body.breakdown).toHaveProperty("distanceCost");
      expect(response.body.breakdown).toHaveProperty("loadingCosts");
    });

    it("should estimate costs for multiple pickup locations", async () => {
      const estimationDto = {
        pickupPoints: [
          {
            lat: 48.1351,
            lng: -1.6869,
            quantity: 60,
          },
          {
            lat: 47.2184,
            lng: -1.5536,
            quantity: 40,
          },
        ],
        deliveryPoint: {
          lat: 45.4642,
          lng: 9.19,
        },
        vehicleType: "FLATBED",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body).toHaveProperty("route");
      expect(response.body.route).toHaveProperty("pickupSequence");
      expect(Array.isArray(response.body.route.pickupSequence)).toBe(true);
      expect(response.body.route.pickupSequence).toHaveLength(2);
      expect(response.body).toHaveProperty("totalCost");
    });

    it("should apply vehicle-specific rates", async () => {
      const results = [];
      const types = ["FLATBED", "REFRIGERATED"];

      for (const vehicleType of types) {
        const response = await request(env.app.getHttpServer())
          .post("/api/transport/estimate")
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send({
            pickupPoints: [{ lat: 48.8566, lng: 2.3522, quantity: 50 }],
            deliveryPoint: { lat: 45.4642, lng: 9.19 },
            vehicleType,
          })
          .expect(201);

        results.push({
          vehicleType,
          totalCost: response.body.totalCost,
        });
      }

      const flatbed = results.find(r => r.vehicleType === "FLATBED")!.totalCost;
      const refrigerated = results.find(r => r.vehicleType === "REFRIGERATED")!.totalCost;
      expect(refrigerated).toBeGreaterThan(flatbed);
    });
  });

  describe("Route Optimization Algorithms", () => {
    it("should optimize route using tsp_2opt algorithm", async () => {
      const response = await request(env.app.getHttpServer())
        .post("/api/transport/optimize-route")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          warehouseLocation: { lat: 48.8566, lng: 2.3522 },
          pickups: [
            { lat: 48.1351, lng: -1.6869, quantity: 60, id: "p1" },
            { lat: 47.2184, lng: -1.5536, quantity: 40, id: "p2" },
          ],
          deliveryLocation: { lat: 45.4642, lng: 9.19 },
          algorithm: "tsp_2opt"
        })
        .expect(201);

      expect(response.body).toHaveProperty("optimizedRoute");
      expect(response.body.optimizedRoute).toHaveProperty("algorithm", "tsp_2opt");
      expect(response.body.optimizedRoute).toHaveProperty("sequence");
      expect(response.body).toHaveProperty("comparison");
    });
  });

  describe("Transport Request Management", () => {
    it("should list transport requests", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/transport/requests")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should get transport requests available for transporter", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/transport/requests/available")
        .set("Authorization", `Bearer ${env.tokens.transporter}`)
        .expect(200);

      expect(response.body).toHaveProperty("data");
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
