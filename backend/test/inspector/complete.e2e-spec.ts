import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";

describe("Inspector Complete Job API (e2e)", () => {
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

  describe("POST /api/inspector/jobs/:id/complete", () => {
    it("should submit verification results", () => {
      const jobId = "job-in-progress";
      const verificationResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: {
          moisture: "12%",
          protein: "14%",
          gluten: "28%",
        },
        verifiedSpecs: {
          moisture: "13%",
          protein: "13.5%",
          gluten: "27%",
        },
        testMethods: [
          {
            parameter: "moisture",
            method: "Laboratory Analysis",
            equipment: "Moisture Analyzer MA-100",
            standardUsed: "ISO 712",
          },
          {
            parameter: "protein",
            method: "Kjeldahl Method",
            equipment: "Protein Analyzer",
            standardUsed: "ISO 20483",
          },
        ],
        evidence: [
          {
            type: "photo",
            url: "https://example.com/photo1.jpg",
            caption: "Sample before testing",
            timestamp: new Date().toISOString(),
          },
        ],
        notes: "Sample tested according to ISO standards",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(verificationResult)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("id");
          expect(res.body.data).toHaveProperty("jobId", jobId);
          expect(res.body.data).toHaveProperty(
            "verificationStatus",
            "VERIFIED",
          );
          expect(res.body.data).toHaveProperty("verifiedSpecs");
          expect(res.body.data.verifiedSpecs).toEqual(
            verificationResult.verifiedSpecs,
          );
        });
    });

    it("should lock seller listing after verification", () => {
      const jobId = "job-to-lock";
      const verificationResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        sellerListingId: "listing-123",
        originalSpecs: {
          moisture: "12%",
        },
        verifiedSpecs: {
          moisture: "13%",
        },
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [],
        notes: "Verified",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(verificationResult)
        .expect(200)
        .then(() => {
          // Check if listing is locked
          return request(app.getHttpServer())
            .get("/api/seller/listings/listing-123")
            .expect(200)
            .expect((res) => {
              expect(res.body.data).toHaveProperty("isLocked", true);
              expect(res.body.data).toHaveProperty("lockedFields");
              expect(res.body.data.lockedFields).toContain("moisture");
            });
        });
    });

    it("should validate required verification fields", () => {
      const jobId = "job-in-progress";
      const invalidResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        // Missing required fields: verifiedSpecs, testMethods, notes
        verificationStatus: "VERIFIED",
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(invalidResult)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toContain("verifiedSpecs");
        });
    });

    it("should require at least one test method", () => {
      const jobId = "job-in-progress";
      const resultWithoutMethods = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "13%" },
        testMethods: [], // Empty array
        evidence: [],
        notes: "Test note",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(resultWithoutMethods)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty(
            "error",
            "At least one test method is required",
          );
        });
    });

    it("should require notes for FAILED status", () => {
      const jobId = "job-in-progress";
      const failedResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "20%" }, // Failed spec
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [],
        notes: "", // Empty notes
        verificationStatus: "FAILED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(failedResult)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty(
            "error",
            "Notes are required for failed verification",
          );
        });
    });

    it("should only allow completion of IN_PROGRESS jobs", () => {
      const jobId = "job-pending"; // Job not yet started
      const verificationResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "13%" },
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [],
        notes: "Test complete",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(verificationResult)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty(
            "error",
            "Job must be in progress to complete",
          );
        });
    });

    it("should return 404 for non-existent job", () => {
      const verificationResult = {
        jobId: "non-existent",
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "13%" },
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [],
        notes: "Test",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post("/api/inspector/jobs/non-existent/complete")
        .send(verificationResult)
        .expect(404)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error", "Job not found");
        });
    });

    it("should validate evidence URLs", () => {
      const jobId = "job-in-progress";
      const resultWithInvalidEvidence = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "13%" },
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [
          {
            type: "photo",
            url: "invalid-url", // Invalid URL format
            caption: "Test photo",
            timestamp: new Date().toISOString(),
          },
        ],
        notes: "Test complete",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(resultWithInvalidEvidence)
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body).toHaveProperty("error");
          expect(res.body.error).toContain("Invalid URL");
        });
    });

    it("should update job status to COMPLETED", () => {
      const jobId = "job-in-progress";
      const verificationResult = {
        jobId: jobId,
        inspectorId: "inspector-001",
        originalSpecs: { moisture: "12%" },
        verifiedSpecs: { moisture: "13%" },
        testMethods: [
          {
            parameter: "moisture",
            method: "Lab Test",
            equipment: "Analyzer",
          },
        ],
        evidence: [],
        notes: "Verification complete",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/complete`)
        .send(verificationResult)
        .expect(200)
        .then(() => {
          // Check if job status is updated
          return request(app.getHttpServer())
            .get(`/api/inspector/jobs/${jobId}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.data).toHaveProperty("status", "COMPLETED");
              expect(res.body.data).toHaveProperty("completedAt");
            });
        });
    });
  });
});
