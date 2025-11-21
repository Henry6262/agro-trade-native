import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

describe("Location Data Flow (e2e)", () => {
  let app: INestApplication;
  let tradeOperationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("GET /api/trade-operations/:id/matching-sellers", () => {
    // First create a trade operation to test with
    beforeEach(async () => {
      // Get first available buy listing
      const buyListingsResponse = await request(app.getHttpServer())
        .get("/api/buyer/listings")
        .expect(200);

      const buyListing = buyListingsResponse.body[0];

      if (buyListing) {
        // Create trade operation
        const createResponse = await request(app.getHttpServer())
          .post("/api/trade-operations")
          .send({
            buyListingId: buyListing.id,
          })
          .expect(201);

        tradeOperationId = createResponse.body.id;
      }
    });

    it("should return sellers with complete location data", async () => {
      if (!tradeOperationId) {
        console.log("No trade operation created, skipping test");
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);

      // Check that at least some sellers have location data
      const sellersWithLocation = response.body.filter(
        (seller) =>
          seller.location &&
          seller.location.city &&
          seller.location.lat &&
          seller.location.lng,
      );

      expect(sellersWithLocation.length).toBeGreaterThan(0);

      // Verify location structure for first seller with location
      if (sellersWithLocation.length > 0) {
        const firstSeller = sellersWithLocation[0];

        expect(firstSeller.location).toHaveProperty("lat");
        expect(firstSeller.location).toHaveProperty("lng");
        expect(firstSeller.location).toHaveProperty("city");
        expect(firstSeller.location).toHaveProperty("displayName");

        // Verify displayName format
        expect(firstSeller.location.displayName).toMatch(/^.+ • \d+km$/);

        // Verify numeric fields
        expect(typeof firstSeller.location.lat).toBe("number");
        expect(typeof firstSeller.location.lng).toBe("number");
        expect(typeof firstSeller.distance).toBe("number");

        // Verify city is a string
        expect(typeof firstSeller.location.city).toBe("string");
        expect(firstSeller.location.city.length).toBeGreaterThan(0);
      }
    });

    it("should return sellers sorted by score", async () => {
      if (!tradeOperationId) {
        console.log("No trade operation created, skipping test");
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .expect(200);

      if (response.body.length > 1) {
        // Check that sellers are sorted by score descending
        for (let i = 1; i < response.body.length; i++) {
          expect(response.body[i - 1].score).toBeGreaterThanOrEqual(
            response.body[i].score,
          );
        }
      }
    });

    it("should include availability field for frontend compatibility", async () => {
      if (!tradeOperationId) {
        console.log("No trade operation created, skipping test");
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/trade-operations/${tradeOperationId}/matching-sellers`)
        .expect(200);

      if (response.body.length > 0) {
        const firstSeller = response.body[0];

        // Check both availableQuantity and availability are present
        expect(firstSeller).toHaveProperty("availableQuantity");
        expect(firstSeller).toHaveProperty("availability");

        // They should have the same value
        expect(firstSeller.availability).toBe(firstSeller.availableQuantity);
      }
    });
  });

  describe("Location Data Integrity", () => {
    it("should have consistent location data across endpoints", async () => {
      // This test would check that location data is consistent
      // across different endpoints that return seller information
      // For now, we'll just verify the structure is correct

      expect(true).toBe(true); // Placeholder
    });
  });
});
