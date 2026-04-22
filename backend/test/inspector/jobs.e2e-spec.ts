import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";

describe("Inspector Jobs API (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /api/inspector/jobs", () => {
    it("should return list of available verification jobs", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs")
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("data");
          expect(Array.isArray(res.body.data)).toBe(true);

          if (res.body.data.length > 0) {
            const job = res.body.data[0];
            expect(job).toHaveProperty("id");
            expect(job).toHaveProperty("sellerListingId");
            expect(job).toHaveProperty("priority");
            expect(job).toHaveProperty("status");
            expect(job).toHaveProperty("location");
            expect(job).toHaveProperty("productDetails");
            expect(job).toHaveProperty("estimatedDuration");
          }
        });
    });

    it("should filter jobs by priority", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs?priority=HIGH")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          if (res.body.data.length > 0) {
            res.body.data.forEach((job: any) => {
              expect(job.priority).toBe("HIGH");
            });
          }
        });
    });

    it("should filter jobs by status", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs?status=PENDING")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          if (res.body.data.length > 0) {
            res.body.data.forEach((job: any) => {
              expect(job.status).toBe("PENDING");
            });
          }
        });
    });

    it("should filter jobs by location and radius", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs?lat=42.6977&lng=23.3219&radius=50")
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          // Jobs should be within 50km radius
          if (res.body.data.length > 0) {
            res.body.data.forEach((job: any) => {
              expect(job.distance).toBeLessThanOrEqual(50);
            });
          }
        });
    });

    it("should return proper error for invalid parameters", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs?priority=INVALID")
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error");
        });
    });
  });

  describe("GET /api/inspector/jobs/:id", () => {
    it("should return specific job details", () => {
      const jobId = "job-001";
      return request(app.getHttpServer())
        .get(`/api/inspector/jobs/${jobId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("id", jobId);
          expect(res.body.data).toHaveProperty("sellerListingId");
          expect(res.body.data).toHaveProperty("priority");
          expect(res.body.data).toHaveProperty("location");
          expect(res.body.data.location).toHaveProperty("latitude");
          expect(res.body.data.location).toHaveProperty("longitude");
          expect(res.body.data.location).toHaveProperty("address");
        });
    });

    it("should return 404 for non-existent job", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/jobs/non-existent")
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error", "Job not found");
        });
    });
  });

  describe("POST /api/inspector/location", () => {
    it("should update inspector location", () => {
      const locationUpdate = {
        inspectorId: "inspector-001",
        jobId: "job-001",
        coordinates: {
          latitude: 42.6977,
          longitude: 23.3219,
          accuracy: 10,
          heading: 45,
          speed: 15.5,
        },
        timestamp: new Date().toISOString(),
        batteryLevel: 85,
        networkType: "cellular",
        isMoving: true,
      };

      return request(app.getHttpServer())
        .post("/api/inspector/location")
        .send(locationUpdate)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty("message", "Location updated");
        });
    });

    it("should validate location data", () => {
      const invalidLocation = {
        inspectorId: "inspector-001",
        coordinates: {
          latitude: "invalid", // Should be number
          longitude: 23.3219,
        },
      };

      return request(app.getHttpServer())
        .post("/api/inspector/location")
        .send(invalidLocation)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error");
        });
    });
  });

  describe("GET /api/inspector/profile", () => {
    it("should return inspector profile", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/profile")
        .set("Authorization", "Bearer valid-token") // Mock auth
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("id");
          expect(res.body.data).toHaveProperty("userId");
          expect(res.body.data).toHaveProperty("employeeId");
          expect(res.body.data).toHaveProperty("specializations");
          expect(res.body.data).toHaveProperty("certifications");
          expect(res.body.data).toHaveProperty("isAvailable");
          expect(res.body.data).toHaveProperty("totalJobsCompleted");
          expect(res.body.data).toHaveProperty("averageRating");
        });
    });

    it("should return 401 for unauthorized request", () => {
      return request(app.getHttpServer())
        .get("/api/inspector/profile")
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error", "Unauthorized");
        });
    });
  });
});
