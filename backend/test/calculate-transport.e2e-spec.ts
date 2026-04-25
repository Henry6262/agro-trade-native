import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { MockAuthService } from "../src/auth/services/mock-auth.service";
import { JwtService } from "@nestjs/jwt";

describe("Calculate Transport (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockAuth: MockAuthService;
  let adminToken: string;
  let testBuyerAddress: any;
  let testSellerAddresses: any[];

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

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Clean before starting
    await cleanupTestData();

    // Create a test admin for auth
    const admin = await prisma.user.create({
      data: {
        email: "test-admin-calc@example.com",
        name: "Test Admin",
        role: "ADMIN",
        password: "hashed_password",
      },
    });
    adminToken = mockAuth.sign(admin);

    // Create a test buyer
    const buyer = await prisma.user.create({
      data: {
        email: "test-buyer-calc@example.com",
        name: "Test Buyer",
        role: "BUYER",
        password: "hashed_password",
      },
    });

    const buyerAddress = await prisma.address.create({
      data: {
        user: { connect: { id: buyer.id } },
        addressType: "DELIVERY",
        country: "Bulgaria",
        latitude: 42.6977,
        longitude: 23.3219,
      },
    });

    testBuyerAddress = buyerAddress;

    // Create test sellers
    const seller1 = await prisma.user.create({
      data: {
        email: "test-seller1-calc@example.com",
        name: "Test Seller 1",
        role: "FARMER",
        password: "hashed_password",
      },
    });

    const seller2 = await prisma.user.create({
      data: {
        email: "test-seller2-calc@example.com",
        name: "Test Seller 2",
        role: "FARMER",
        password: "hashed_password",
      },
    });

    // Create addresses for sellers
    const seller1Address = await prisma.address.create({
      data: {
        user: { connect: { id: seller1.id } },
        addressType: "FARM",
        country: "Bulgaria",
        latitude: 42.1354,
        longitude: 24.7453,
      },
    });

    const seller2Address = await prisma.address.create({
      data: {
        user: { connect: { id: seller2.id } },
        addressType: "FARM",
        country: "Bulgaria",
        latitude: 43.2141,
        longitude: 27.9147,
      },
    });

    testSellerAddresses = [seller1Address, seller2Address];

    // Ensure cost settings exist
    await prisma.transportCostSettings.upsert({
      where: { id: "test-settings" },
      create: {
        id: "test-settings",
        baseRatePerKm: 0.15,
        isActive: true,
      },
      update: {
        baseRatePerKm: 0.15,
        isActive: true,
      },
    });
  }

  async function cleanupTestData() {
    await prisma.address.deleteMany({
      where: {
        user: {
          email: {
            in: [
              "test-admin-calc@example.com",
              "test-buyer-calc@example.com",
              "test-seller1-calc@example.com",
              "test-seller2-calc@example.com",
            ],
          },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "test-admin-calc@example.com",
            "test-buyer-calc@example.com",
            "test-seller1-calc@example.com",
            "test-seller2-calc@example.com",
          ],
        },
      },
    });
  }

  describe("POST /api/transport/estimate", () => {
    it("should calculate transport costs successfully", () => {
      return request(app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pickupPoints: [
            {
              lat: testSellerAddresses[0].latitude,
              lng: testSellerAddresses[0].longitude,
              quantity: 40,
            },
            {
              lat: testSellerAddresses[1].latitude,
              lng: testSellerAddresses[1].longitude,
              quantity: 60,
            },
          ],
          deliveryPoint: {
            lat: testBuyerAddress.latitude,
            lng: testBuyerAddress.longitude,
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("totalCost");
          expect(res.body).toHaveProperty("totalDistance");
          expect(res.body.totalCost).toBeGreaterThan(0);
          expect(res.body.totalDistance).toBeGreaterThan(0);
        });
    });

    it("should return 400 when pickupPoints is empty", () => {
      return request(app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pickupPoints: [],
          deliveryPoint: {
            lat: testBuyerAddress.latitude,
            lng: testBuyerAddress.longitude,
          },
        })
        .expect(400);
    });

    it("should return 400 when deliveryPoint is missing", () => {
      return request(app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pickupPoints: [
            {
              lat: testSellerAddresses[0].latitude,
              lng: testSellerAddresses[0].longitude,
              quantity: 40,
            },
          ],
        })
        .expect(400);
    });

    it("should calculate costs accurately based on distance", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/transport/estimate")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          pickupPoints: [
            {
              lat: testSellerAddresses[0].latitude,
              lng: testSellerAddresses[0].longitude,
              quantity: 40,
            },
          ],
          deliveryPoint: {
            lat: testBuyerAddress.latitude,
            lng: testBuyerAddress.longitude,
          },
        })
        .expect(201);

      // Verify cost calculation logic
      // Total cost includes base rate * distance + loading costs
      expect(response.body.totalCost).toBeGreaterThan(response.body.totalDistance * 0.15);
    });
  });
});
