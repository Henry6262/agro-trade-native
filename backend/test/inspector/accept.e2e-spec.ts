import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../../src/app.module";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../src/prisma/prisma.service";

describe("Inspector Accept Job API (e2e)", () => {
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

  describe("POST /api/inspector/jobs/:id/accept", () => {
    it("should accept a verification job", () => {
      const jobId = "job-001";
      const acceptData = {
        inspectorId: "inspector-001",
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("id", jobId);
          expect(res.body.data).toHaveProperty("inspectorId", "inspector-001");
          expect(res.body.data).toHaveProperty("status", "ASSIGNED");
          expect(res.body.data).toHaveProperty("acceptedAt");
        });
    });

    it("should not accept already assigned job", () => {
      const jobId = "job-assigned";
      const acceptData = {
        inspectorId: "inspector-002",
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 409);
          expect(res.body).toHaveProperty("message", "Job already assigned");
          expect(res.body).toHaveProperty("error", "Conflict");
        });
    });

    it("should validate inspector availability", () => {
      const jobId = "job-002";
      const acceptData = {
        inspectorId: "inspector-busy", // Inspector with active job
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty(
            "message",
            "Inspector already has an active job",
          );
        });
    });

    it("should return 404 for non-existent job", () => {
      const acceptData = {
        inspectorId: "inspector-001",
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post("/api/inspector/jobs/non-existent/accept")
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(404)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 404);
          expect(res.body).toHaveProperty("message", "Job not found");
          expect(res.body).toHaveProperty("error", "Not Found");
        });
    });

    it("should validate required fields", () => {
      const jobId = "job-003";
      const invalidData = {
        // Missing inspectorId
        estimatedArrival: new Date(Date.now() + 3600000).toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(JSON.stringify(res.body.message)).toContain("inspectorId");
        });
    });

    it("should validate estimated arrival time", () => {
      const jobId = "job-004";
      const acceptData = {
        inspectorId: "inspector-001",
        estimatedArrival: "invalid-date", // Invalid date format
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty("message");
        });
    });

    it("should not accept past estimated arrival time", () => {
      const jobId = "job-005";
      const acceptData = {
        inspectorId: "inspector-001",
        estimatedArrival: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/accept`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(acceptData)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty("statusCode", 400);
          expect(res.body).toHaveProperty(
            "message",
            "Estimated arrival must be in the future",
          );
        });
    });

    it("should update job status to IN_PROGRESS when inspector arrives", () => {
      const jobId = "job-006";
      const updateData = {
        inspectorId: "inspector-001",
        status: "IN_PROGRESS",
        arrivedAt: new Date().toISOString(),
      };

      return request(app.getHttpServer())
        .post(`/api/inspector/jobs/${jobId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("status", "IN_PROGRESS");
        });
    });
  });
});
