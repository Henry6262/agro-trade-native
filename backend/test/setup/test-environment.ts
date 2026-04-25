import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { AppModule } from "../../src/app.module";
import { PrismaService } from "../../src/prisma/prisma.service";
import { MockAuthService } from "../../src/auth/services/mock-auth.service";
import { JwtService } from "@nestjs/jwt";

export class TestEnvironment {
  public app: INestApplication;
  public prisma: PrismaService;
  public mockAuth: MockAuthService;
  public moduleRef: TestingModule;
  public tokens: {
    admin: string;
    buyer: string;
    seller: string;
    transporter: string;
  };

  async setup() {
    // Create testing module
    this.moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create application
    this.app = this.moduleRef.createNestApplication();

    // Add global prefix (matching main.ts)
    this.app.setGlobalPrefix("api");

    // Add global pipes
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Initialize app
    await this.app.init();

    // Get services
    this.prisma = this.moduleRef.get<PrismaService>(PrismaService);
    const jwtService = this.moduleRef.get<JwtService>(JwtService);

    // Create mock auth service
    this.mockAuth = new MockAuthService(jwtService);
    this.tokens = this.mockAuth.getMockTokens();

    return this;
  }

  async teardown() {
    // Clean up database
    await this.cleanDatabase();

    // Close app
    await this.app.close();
  }

  async cleanDatabase() {
    // Clean tables in correct order to avoid foreign key constraints
    const tablesToClean = [
      "offerRound",
      "offerNegotiation",
      "tradeNote",
      "tradeEvent",
      "tradeStateHistory",
      "investmentPosition",
      "userInvestmentPreference",
      "inspectionRequest",
      "transportJob",
      "transportBid",
      "transportRequest",
      "tradeSeller",
      "tradeTransporter",
      "profitEstimation",
      "transportCostCalculation",
      "tradeOperation",
      "offer",
      "listingSpec",
      "saleListing",
      "buyListing",
      "truck",
      "driverDocument",
      "driver",
      "companyDocument",
      "companyAdmin",
      "transportCompany",
      "company",
      "phoneOtp",
      "user",
      "address",
      "city",
      "region",
      "productSpecTemplate",
      "specificationType",
      "product",
      "transportCostSettings",
    ];

    for (const table of tablesToClean) {
      try {
        if ((this.prisma as any)[table]) {
          await (this.prisma as any)[table].deleteMany({});
        }
      } catch (error) {
        // console.error(`Failed to clean table ${table}:`, error.message);
      }
    }
  }

  async seedTestData() {
    const upsertUserByEmail = async ({
      id,
      email,
      name,
      role,
    }: {
      id: string;
      email: string;
      name: string;
      role: "ADMIN" | "BUYER" | "FARMER" | "TRANSPORTER";
    }) => {
      const existingById = await this.prisma.user.findUnique({ where: { id } });
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      const existing = existingById ?? existingByEmail;

      if (existing) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: {
            id,
            email,
            name,
            role,
            isActive: true,
            isEmailVerified: true,
            onboardingCompleted: true,
          },
        });
      }

      return this.prisma.user.create({
        data: {
          id,
          email,
          name,
          role,
          isActive: true,
          isEmailVerified: true,
          onboardingCompleted: true,
        },
      });
    };

    const testUser = await upsertUserByEmail({
      id: "test-user-123",
      email: "test@agrotrade.com",
      name: "Test User",
      role: "ADMIN",
    });

    const testBuyer = await upsertUserByEmail({
      id: "test-buyer-456",
      email: "buyer@agrotrade.com",
      name: "Test Buyer",
      role: "BUYER",
    });

    const testSeller1 = await upsertUserByEmail({
      id: "test-seller-001",
      email: "seller1@agrotrade.com",
      name: "Test Seller 1",
      role: "FARMER",
    });

    const testSeller2 = await upsertUserByEmail({
      id: "test-seller-002",
      email: "seller2@agrotrade.com",
      name: "Test Seller 2",
      role: "FARMER",
    });

    const testTransporter = await upsertUserByEmail({
      id: "test-transporter-789",
      email: "transporter@agrotrade.com",
      name: "Test Transporter",
      role: "TRANSPORTER",
    });

    // Create test product
    const testProduct = await this.prisma.product.upsert({
      where: { category: "SOFT_WHEAT" as any },
      update: {},
      create: {
        id: "test-product-wheat",
        name: "Wheat",
        category: "SOFT_WHEAT" as any,
        displayName: "Soft Wheat",
        defaultUnit: "TON",
        description: "High quality wheat",
      },
    });

    // Create test buy listing
    const buyListing = await this.prisma.buyListing.upsert({
      where: { id: "test-buy-listing-001" },
      update: {},
      create: {
        id: "test-buy-listing-001",
        buyerId: testBuyer.id,
        productId: testProduct.id,
        quantity: 100,
        unit: "TON",
        maxPricePerUnit: 380,
        status: "ACTIVE",
        neededBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    });

    // Create test sale listings
    const saleListing1 = await this.prisma.saleListing.upsert({
      where: { id: "test-sale-listing-001" },
      update: {},
      create: {
        id: "test-sale-listing-001",
        sellerId: testSeller1.id,
        productId: testProduct.id,
        quantity: 60,
        unit: "TON",
        askingPrice: 345,
        status: "ACTIVE",
        harvestDate: new Date(),
      },
    });

    const saleListing2 = await this.prisma.saleListing.upsert({
      where: { id: "test-sale-listing-002" },
      update: {},
      create: {
        id: "test-sale-listing-002",
        sellerId: testSeller2.id,
        productId: testProduct.id,
        quantity: 50,
        unit: "TON",
        askingPrice: 350,
        status: "ACTIVE",
        harvestDate: new Date(),
      },
    });

    // Create transport settings
    const transportSettings = await this.prisma.transportCostSettings.upsert({
      where: { id: "test-transport-settings" },
      update: {},
      create: {
        id: "test-transport-settings",
        baseRatePerKm: 2.0,
        flatbedMultiplier: 1.0,
        refrigeratedMultiplier: 1.3,
        tankerMultiplier: 1.2,
        containerMultiplier: 1.1,
        tier1MaxKm: 50,
        tier1Rate: 0.15,
        tier2MaxKm: 200,
        tier2Rate: 0.13,
        tier3Rate: 0.11,
        loadingCostPerTon: 0.5,
        urgencySurcharge: 0.3,
        isActive: true,
      },
    });

    return {
      users: {
        admin: testUser,
        buyer: testBuyer,
        seller1: testSeller1,
        seller2: testSeller2,
        transporter: testTransporter,
      },
      product: testProduct,
      buyListing,
      saleListings: [saleListing1, saleListing2],
      transportSettings,
    };
  }
}
