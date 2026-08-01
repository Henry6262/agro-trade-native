import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { ProfitController } from "./profit.controller";
import { ProfitCalculationService } from "../services/profit-calculation.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";

// ---------------------------------------------------------------------------
// Isolated unit/integration spec — does NOT boot AppModule or need a real DB.
// All external dependencies are replaced with jest mocks.
// ---------------------------------------------------------------------------

const mockProfitService = {
  calculateProfit: jest.fn().mockResolvedValue({
    profit: {
      grossProfit: 2500,
      netProfit: 2350,
      profitMargin: 7.5,
    },
    revenue: {
      totalRevenue: 38000,
      sellingPrice: 380,
      quantity: 100,
    },
    costs: {
      purchases: {
        totalCost: 35000,
        avgPrice: 350,
        breakdown: [
          { sellerId: "seller-1", price: 350, quantity: 50 },
          { sellerId: "seller-2", price: 350, quantity: 50 },
        ],
      },
      transport: {
        estimatedCost: 650,
      },
      totalCosts: 35650,
    },
  }),
};

describe("ProfitController (isolated)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProfitController],
      providers: [
        { provide: ProfitCalculationService, useValue: mockProfitService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/api/profit/:tradeOperationId/calculate (GET)", () => {
    it("should calculate profit for trade operation", async () => {
      const tradeOpId = "trade-op-789";

      const response = await request(app.getHttpServer())
        .get(`/api/profit/${tradeOpId}/calculate`)
        .expect(200);

      expect(response.body).toHaveProperty("profit");
      expect(response.body.profit).toHaveProperty("grossProfit");
      expect(response.body.profit).toHaveProperty("netProfit");
      expect(response.body.profit).toHaveProperty("profitMargin");
      expect(response.body).toHaveProperty("revenue");
      expect(response.body).toHaveProperty("costs");
      expect(response.body.costs).toHaveProperty("purchases");
      expect(response.body.costs).toHaveProperty("transport");
      expect(mockProfitService.calculateProfit).toHaveBeenCalledTimes(1);
    });
  });

});
