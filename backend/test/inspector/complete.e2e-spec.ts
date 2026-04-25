import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("Inspector Complete Job API (e2e)", () => {
  let app: INestApplication;
  let authToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const prisma = moduleFixture.get<PrismaService>(PrismaService);
    await prisma.user.upsert({
      where: { email: "inspector@test.local" },
      update: {},
      create: {
        id: "test-user-123",
        email: "inspector@test.local",
        name: "Inspector Test User",
        role: "ADMIN",
        isActive: true,
        isEmailVerified: true,
        onboardingCompleted: true,
      },
    });

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({
      sub: "test-user-123",
      email: "inspector@test.local",
      role: "ADMIN",
    });
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
        .set("Authorization", `Bearer ${authToken}`)
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(verificationResult)
        .expect(200)
        .then(() => {
          return request(app.getHttpServer())
            .get(`/api/inspector/jobs/${jobId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.data).toHaveProperty("sellerListingId", "listing-123");
              expect(res.body.data).toHaveProperty("status", "COMPLETED");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidResult)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(JSON.stringify(res.body.message)).toContain("verifiedSpecs");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(resultWithoutMethods)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(JSON.stringify(res.body.message)).toContain("at least 1 elements");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(failedResult)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(JSON.stringify(res.body.message)).toContain("notes should not be empty");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(verificationResult)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("message", "Job must be in progress to complete");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(verificationResult)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 404);
          expect(res.body).toHaveProperty("message", "Job not found");
          expect(res.body).toHaveProperty("error", "Not Found");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(resultWithInvalidEvidence)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(JSON.stringify(res.body.message)).toContain("url must be a URL address");
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
        .set("Authorization", `Bearer ${authToken}`)
        .send(verificationResult)
        .expect(200)
        .then(() => {
          // Check if job status is updated
          return request(app.getHttpServer())
            .get(`/api/inspector/jobs/${jobId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .expect(200)
            .expect((res) => {
              expect(res.body.data).toHaveProperty("status", "COMPLETED");
              expect(res.body.data).toHaveProperty("completedAt");
            });
        });
    });
  });
});
