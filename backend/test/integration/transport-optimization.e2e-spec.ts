import * as request from "supertest";
import { TestEnvironment } from "../setup/test-environment";

describe("Transport Optimization Integration Tests", () => {
  let env: TestEnvironment;
  let testData: any;
  let tradeOperationId: string;

  beforeAll(async () => {
    env = new TestEnvironment();
    await env.setup();
    testData = await env.seedTestData();

    // Create a base trade operation with selected sellers for testing
    const response = await request(env.app.getHttpServer())
      .post("/api/trade-operations")
      .set("Authorization", `Bearer ${env.tokens.admin}`)
      .send({
        buyListingId: testData.buyListing.id,
        targetProfitMargin: 7.5,
      })
      .expect(201);

    tradeOperationId = response.body.id;

    // Select multiple sellers to create a multi-stop route
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
        origin: {
          latitude: 48.8566,
          longitude: 2.3522,
          address: "Paris, France",
        },
        destination: {
          latitude: 45.4642,
          longitude: 9.19,
          address: "Milan, Italy",
        },
        quantity: 100,
        vehicleType: "TRUCK",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body).toHaveProperty("distance");
      expect(response.body).toHaveProperty("duration");
      expect(response.body).toHaveProperty("costs");

      const costs = response.body.costs;
      expect(costs).toHaveProperty("baseCost");
      expect(costs).toHaveProperty("fuelSurcharge");
      expect(costs).toHaveProperty("driverCost");
      expect(costs).toHaveProperty("totalCost");

      expect(response.body).toHaveProperty("breakdown");
      expect(response.body.breakdown).toHaveProperty("costPerKm");
      expect(response.body.breakdown).toHaveProperty("costPerTon");
      expect(response.body.breakdown).toHaveProperty("costPerTonKm");

      // Verify calculation logic
      const expectedBaseCost = response.body.distance * costs.costPerKm;
      expect(costs.baseCost).toBeCloseTo(expectedBaseCost, 2);
    });

    it("should estimate costs for multiple pickup locations", async () => {
      const estimationDto = {
        origin: {
          latitude: 48.8566,
          longitude: 2.3522,
          address: "Warehouse Paris",
        },
        pickupLocations: [
          {
            latitude: 48.1351,
            longitude: -1.6869,
            address: "Farm 1 - Rennes",
            quantity: 60,
          },
          {
            latitude: 47.2184,
            longitude: -1.5536,
            address: "Farm 2 - Nantes",
            quantity: 40,
          },
        ],
        destination: {
          latitude: 45.4642,
          longitude: 9.19,
          address: "Buyer - Milan",
        },
        vehicleType: "TRUCK",
      };

      const response = await request(env.app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(estimationDto)
        .expect(201);

      expect(response.body).toHaveProperty("route");
      expect(response.body.route).toHaveProperty("totalDistance");
      expect(response.body.route).toHaveProperty("segments");
      expect(response.body.route.segments).toBeInstanceOf(Array);

      // Should have 3 segments: origin->pickup1->pickup2->destination
      expect(response.body.route.segments.length).toBeGreaterThanOrEqual(3);

      expect(response.body).toHaveProperty("costs");
      expect(response.body.costs).toHaveProperty("pickupCosts");
      expect(response.body.costs).toHaveProperty("deliveryCost");
      expect(response.body.costs).toHaveProperty("totalCost");
    });

    it("should apply vehicle-specific rates", async () => {
      const vehicleTypes = ["TRUCK", "VAN", "LORRY"];
      const results = [];

      for (const vehicleType of vehicleTypes) {
        const response = await request(env.app.getHttpServer())
          .post("/api/transport/estimate")
          .set("Authorization", `Bearer ${env.tokens.admin}`)
          .send({
            origin: { latitude: 48.8566, longitude: 2.3522 },
            destination: { latitude: 45.4642, longitude: 9.19 },
            quantity: 50,
            vehicleType,
          })
          .expect(201);

        results.push({
          vehicleType,
          costPerKm: response.body.breakdown.costPerKm,
          totalCost: response.body.costs.totalCost,
          capacity: response.body.vehicleInfo?.capacity,
        });
      }

      // Verify different vehicle types have different rates
      const truckCost =
        results.find((r) => r.vehicleType === "TRUCK")?.totalCost || 0;
      const vanCost =
        results.find((r) => r.vehicleType === "VAN")?.totalCost || 0;
      const lorryCost =
        results.find((r) => r.vehicleType === "LORRY")?.totalCost || 0;

      // Generally: VAN < TRUCK < LORRY for same distance
      expect(vanCost).toBeLessThan(lorryCost);
    });

    it("should include time-based costs", async () => {
      const response = await request(env.app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          origin: { latitude: 48.8566, longitude: 2.3522 },
          destination: { latitude: 45.4642, longitude: 9.19 },
          quantity: 100,
          vehicleType: "TRUCK",
          includeTimeCosts: true,
        })
        .expect(201);

      expect(response.body).toHaveProperty("timeCosts");

      const timeCosts = response.body.timeCosts;
      expect(timeCosts).toHaveProperty("loadingTime");
      expect(timeCosts).toHaveProperty("unloadingTime");
      expect(timeCosts).toHaveProperty("drivingTime");
      expect(timeCosts).toHaveProperty("totalTime");
      expect(timeCosts).toHaveProperty("waitingTimeCost");
      expect(timeCosts).toHaveProperty("overtimeCost");
    });
  });

  describe("Route Optimization Algorithms", () => {
    it("should optimize route using Nearest Neighbor algorithm", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({ algorithm: "TSP_NEAREST" })
        .expect(201);

      expect(response.body).toHaveProperty("route");
      expect(response.body.route).toHaveProperty("algorithm", "TSP_NEAREST");
      expect(response.body.route).toHaveProperty("waypoints");
      expect(response.body.route).toHaveProperty("sequence");
      expect(response.body.route).toHaveProperty("totalDistance");
      expect(response.body.route).toHaveProperty("estimatedDuration");

      expect(response.body).toHaveProperty("estimation");
      expect(response.body.estimation).toHaveProperty("totalCost");

      expect(response.body).toHaveProperty("optimization");
      expect(response.body.optimization).toHaveProperty("originalDistance");
      expect(response.body.optimization).toHaveProperty("optimizedDistance");
      expect(response.body.optimization).toHaveProperty("distanceSaved");
      expect(response.body.optimization).toHaveProperty("costSaved");
      expect(response.body.optimization).toHaveProperty("percentImprovement");
    });

    it("should optimize route using 2-opt algorithm", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({ algorithm: "TSP_2OPT" })
        .expect(201);

      expect(response.body.route.algorithm).toBe("TSP_2OPT");

      // 2-opt should generally produce better or equal results than nearest neighbor
      const nearestResponse = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({ algorithm: "TSP_NEAREST" })
        .expect(201);

      expect(response.body.route.totalDistance).toBeLessThanOrEqual(
        nearestResponse.body.route.totalDistance * 1.01, // Allow 1% tolerance
      );
    });

    it("should optimize route using Genetic algorithm", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          algorithm: "GENETIC",
          geneticParams: {
            populationSize: 50,
            generations: 100,
            mutationRate: 0.02,
            eliteSize: 10,
          },
        })
        .expect(201);

      expect(response.body.route.algorithm).toBe("GENETIC");
      expect(response.body).toHaveProperty("algorithmMetrics");

      const metrics = response.body.algorithmMetrics;
      expect(metrics).toHaveProperty("generations");
      expect(metrics).toHaveProperty("populationSize");
      expect(metrics).toHaveProperty("bestFitness");
      expect(metrics).toHaveProperty("convergenceGeneration");
      expect(metrics).toHaveProperty("executionTime");
    });

    it("should compare all algorithms and recommend best", async () => {
      const response = await request(env.app.getHttpServer())
        .post(`/api/trade-operations/${tradeOperationId}/optimize-transport`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({ algorithm: "COMPARE_ALL" })
        .expect(201);

      expect(response.body).toHaveProperty("comparison");
      expect(response.body.comparison).toHaveProperty("algorithms");
      expect(response.body.comparison.algorithms).toBeInstanceOf(Array);

      // Should have results for all algorithms
      const algorithmNames = response.body.comparison.algorithms.map(
        (a: any) => a.name,
      );
      expect(algorithmNames).toContain("TSP_NEAREST");
      expect(algorithmNames).toContain("TSP_2OPT");
      expect(algorithmNames).toContain("GENETIC");

      expect(response.body.comparison).toHaveProperty("best");
      expect(response.body.comparison.best).toHaveProperty("algorithm");
      expect(response.body.comparison.best).toHaveProperty("distance");
      expect(response.body.comparison.best).toHaveProperty("cost");

      expect(response.body.comparison).toHaveProperty("recommendation");
      expect(response.body.comparison.recommendation).toHaveProperty(
        "algorithm",
      );
      expect(response.body.comparison.recommendation).toHaveProperty("reason");
    });
  });

  describe("Transport Settings Management", () => {
    it("should get current transport settings", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/transport/settings")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("baseCostPerKm");
      expect(response.body).toHaveProperty("fuelSurchargePercent");
      expect(response.body).toHaveProperty("loadingTimeMinutes");
      expect(response.body).toHaveProperty("unloadingTimeMinutes");
      expect(response.body).toHaveProperty("averageSpeedKmh");
      expect(response.body).toHaveProperty("vehicleTypes");

      expect(response.body.vehicleTypes).toBeInstanceOf(Array);
      response.body.vehicleTypes.forEach((vehicle: any) => {
        expect(vehicle).toHaveProperty("type");
        expect(vehicle).toHaveProperty("capacity");
        expect(vehicle).toHaveProperty("costPerKm");
        expect(vehicle).toHaveProperty("maxDistance");
      });
    });

    it("should update transport settings", async () => {
      const updateDto = {
        baseCostPerKm: 2.5,
        fuelSurchargePercent: 18,
        loadingTimeMinutes: 45,
        unloadingTimeMinutes: 45,
        averageSpeedKmh: 70,
      };

      const response = await request(env.app.getHttpServer())
        .put("/api/transport/settings")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.baseCostPerKm).toBe(2.5);
      expect(response.body.fuelSurchargePercent).toBe(18);
      expect(response.body.loadingTimeMinutes).toBe(45);
      expect(response.body.unloadingTimeMinutes).toBe(45);
      expect(response.body.averageSpeedKmh).toBe(70);
    });

    it("should validate transport settings ranges", async () => {
      const invalidDto = {
        baseCostPerKm: -1, // Invalid: negative cost
        fuelSurchargePercent: 150, // Invalid: too high
        averageSpeedKmh: 300, // Invalid: unrealistic speed
      };

      const response = await request(env.app.getHttpServer())
        .put("/api/transport/settings")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send(invalidDto)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it("should require admin role to update settings", async () => {
      const updateDto = {
        baseCostPerKm: 3.0,
      };

      await request(env.app.getHttpServer())
        .put("/api/transport/settings")
        .set("Authorization", `Bearer ${env.tokens.buyer}`)
        .send(updateDto)
        .expect(403);
    });
  });

  describe("Cost Breakdown Analysis", () => {
    it("should provide detailed cost breakdown", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/transport/cost-breakdown")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({
          distance: 500,
          quantity: 100,
          vehicleType: "TRUCK",
        })
        .expect(200);

      expect(response.body).toHaveProperty("summary");
      expect(response.body.summary).toHaveProperty("totalCost");
      expect(response.body.summary).toHaveProperty("costPerKm");
      expect(response.body.summary).toHaveProperty("costPerTon");

      expect(response.body).toHaveProperty("components");
      const components = response.body.components;
      expect(components).toHaveProperty("baseCost");
      expect(components).toHaveProperty("fuelCost");
      expect(components).toHaveProperty("driverCost");
      expect(components).toHaveProperty("vehicleDepreciation");
      expect(components).toHaveProperty("insurance");
      expect(components).toHaveProperty("maintenance");
      expect(components).toHaveProperty("tolls");

      expect(response.body).toHaveProperty("percentages");
      const percentages = response.body.percentages;
      expect(percentages).toHaveProperty("fuel");
      expect(percentages).toHaveProperty("driver");
      expect(percentages).toHaveProperty("vehicle");
      expect(percentages).toHaveProperty("other");

      // Percentages should sum to 100
      const totalPercentage = Object.values(
        percentages as Record<string, number>,
      ).reduce((sum, val) => sum + val, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it("should compare costs across different scenarios", async () => {
      const response = await request(env.app.getHttpServer())
        .post("/api/transport/cost-breakdown/compare")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          scenarios: [
            {
              name: "Direct Route",
              distance: 500,
              quantity: 100,
              vehicleType: "TRUCK",
              stops: 1,
            },
            {
              name: "Multi-Stop",
              distance: 550,
              quantity: 100,
              vehicleType: "TRUCK",
              stops: 3,
            },
            {
              name: "Split Shipment",
              distance: 500,
              quantity: 50,
              vehicleType: "VAN",
              stops: 1,
              trips: 2,
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty("scenarios");
      expect(response.body.scenarios).toHaveLength(3);

      response.body.scenarios.forEach((scenario: any) => {
        expect(scenario).toHaveProperty("name");
        expect(scenario).toHaveProperty("totalCost");
        expect(scenario).toHaveProperty("efficiency");
        expect(scenario).toHaveProperty("timeRequired");
      });

      expect(response.body).toHaveProperty("comparison");
      expect(response.body.comparison).toHaveProperty("cheapest");
      expect(response.body.comparison).toHaveProperty("fastest");
      expect(response.body.comparison).toHaveProperty("mostEfficient");
      expect(response.body.comparison).toHaveProperty("recommendation");
    });
  });

  describe("Multi-Modal Transport", () => {
    it("should calculate costs for combined transport modes", async () => {
      const response = await request(env.app.getHttpServer())
        .post("/api/transport/multi-modal/estimate")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .send({
          segments: [
            {
              mode: "TRUCK",
              origin: { latitude: 48.8566, longitude: 2.3522 },
              destination: { latitude: 48.1351, longitude: -1.6869 },
              quantity: 100,
            },
            {
              mode: "RAIL",
              origin: { latitude: 48.1351, longitude: -1.6869 },
              destination: { latitude: 45.4642, longitude: 9.19 },
              quantity: 100,
            },
            {
              mode: "TRUCK",
              origin: { latitude: 45.4642, longitude: 9.19 },
              destination: { latitude: 45.5, longitude: 9.2 },
              quantity: 100,
            },
          ],
        })
        .expect(201);

      expect(response.body).toHaveProperty("segments");
      expect(response.body.segments).toHaveLength(3);

      response.body.segments.forEach((segment: any) => {
        expect(segment).toHaveProperty("mode");
        expect(segment).toHaveProperty("distance");
        expect(segment).toHaveProperty("cost");
        expect(segment).toHaveProperty("duration");
        expect(segment).toHaveProperty("emissions");
      });

      expect(response.body).toHaveProperty("total");
      expect(response.body.total).toHaveProperty("cost");
      expect(response.body.total).toHaveProperty("distance");
      expect(response.body.total).toHaveProperty("duration");
      expect(response.body.total).toHaveProperty("emissions");

      expect(response.body).toHaveProperty("comparison");
      expect(response.body.comparison).toHaveProperty("directTruckOnly");
      expect(response.body.comparison).toHaveProperty("savings");
      expect(response.body.comparison).toHaveProperty("emissionReduction");
    });
  });

  describe("Transport Analytics", () => {
    it("should provide transport performance analytics", async () => {
      const response = await request(env.app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/transport-analytics`)
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .expect(200);

      expect(response.body).toHaveProperty("efficiency");
      expect(response.body.efficiency).toHaveProperty("utilizationRate");
      expect(response.body.efficiency).toHaveProperty("emptyMileage");
      expect(response.body.efficiency).toHaveProperty("avgLoadFactor");

      expect(response.body).toHaveProperty("costs");
      expect(response.body.costs).toHaveProperty("totalTransportCost");
      expect(response.body.costs).toHaveProperty("costPerUnit");
      expect(response.body.costs).toHaveProperty("costAsPercentOfRevenue");

      expect(response.body).toHaveProperty("performance");
      expect(response.body.performance).toHaveProperty("onTimeDeliveryRate");
      expect(response.body.performance).toHaveProperty("avgDeliveryTime");
      expect(response.body.performance).toHaveProperty("routeEfficiency");
    });

    it("should track historical transport costs", async () => {
      const response = await request(env.app.getHttpServer())
        .get("/api/transport/analytics/history")
        .set("Authorization", `Bearer ${env.tokens.admin}`)
        .query({
          startDate: new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          endDate: new Date().toISOString(),
        })
        .expect(200);

      expect(response.body).toHaveProperty("period");
      expect(response.body).toHaveProperty("totalShipments");
      expect(response.body).toHaveProperty("totalDistance");
      expect(response.body).toHaveProperty("totalCost");
      expect(response.body).toHaveProperty("avgCostPerKm");

      expect(response.body).toHaveProperty("trends");
      expect(response.body.trends).toHaveProperty("costTrend");
      expect(response.body.trends).toHaveProperty("efficiencyTrend");
      expect(response.body.trends).toHaveProperty("volumeTrend");

      expect(response.body).toHaveProperty("breakdown");
      expect(response.body.breakdown).toHaveProperty("byVehicleType");
      expect(response.body.breakdown).toHaveProperty("byRoute");
      expect(response.body.breakdown).toHaveProperty("byMonth");
    });
  });
});
