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
  calculateProfitImpact: jest.fn().mockResolvedValue({
    estimatedProfit: 2200,
    profitMargin: 6.5,
    profitChange: -150,
    viability: "VIABLE",
  }),
  optimizeProfitMargins: jest.fn().mockResolvedValue({
    optimizedPrices: {
      buyerPrice: 375,
      sellerPrices: [{ sellerId: "seller-1", price: 345 }],
    },
    expectedProfit: 2800,
    expectedMargin: 8.2,
  }),
  validateMargins: jest.fn().mockResolvedValue({
    validations: [
      {
        tradeOperationId: "trade-op-1",
        isViable: true,
        profitMargin: 7.2,
      },
    ],
    summary: {
      totalViable: 1,
    },
  }),
  getCumulativeProfit: jest.fn().mockResolvedValue({
    totalRevenue: 120000,
    totalCosts: 110000,
    totalProfit: 10000,
    averageMargin: 8.3,
    operationCount: 5,
    breakdown: {},
  }),
  forecastProfit: jest.fn().mockResolvedValue({
    forecastedProfit: 15000,
    forecastedMargin: 8.5,
    confidence: 0.85,
    breakdown: [],
  }),
  getBenchmarks: jest.fn().mockResolvedValue({
    minimumMargin: 5,
    targetMargin: 7,
    optimalMargin: 10,
    industryAverage: 7.5,
    currentPerformance: 8.0,
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
      expect(response.body).toHaveProperty("breakdown");
      expect(response.body.breakdown).toHaveProperty("revenue");
      expect(response.body.breakdown).toHaveProperty("purchaseCosts");
      expect(response.body.breakdown).toHaveProperty("transportCosts");
      expect(mockProfitService.calculateProfit).toHaveBeenCalledTimes(1);
    });
  });

  describe("/api/profit/:tradeOperationId/impact (POST)", () => {
    it("should calculate profit impact of price change", async () => {
      const tradeOpId = "trade-op-789";
      const impactDto = {
        newPrice: 375,
        quantity: 100,
        offerType: "BUYER",
      };

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/impact`)
        .send(impactDto)
        .expect(201);

      expect(response.body).toHaveProperty("estimatedProfit");
      expect(response.body).toHaveProperty("profitMargin");
      expect(response.body).toHaveProperty("profitChange");
      expect(response.body).toHaveProperty("viability");
    });

    it("should warn about low profit margins", async () => {
      const tradeOpId = "trade-op-789";
      const impactDto = {
        newPrice: 390,
        quantity: 100,
        offerType: "BUYER",
      };

      mockProfitService.calculateProfitImpact.mockResolvedValueOnce({
        estimatedProfit: 500,
        profitMargin: 2.5,
        profitChange: -1850,
        viability: "MARGINAL",
        warning: "Profit margin is below minimum threshold",
      });

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/impact`)
        .send(impactDto)
        .expect(201);

      expect(response.body).toHaveProperty("warning");
      expect(response.body.viability).toBe("MARGINAL");
    });
  });

  describe("/api/profit/:tradeOperationId/optimize (POST)", () => {
    it("should optimize profit margins", async () => {
      const tradeOpId = "trade-op-789";
      const optimizeDto = {
        targetMargin: 8,
        constraints: {
          maxBuyerPrice: 380,
          minSellerPrice: 340,
          maxTransportCost: 15,
        },
      };

      const response = await request(app.getHttpServer())
        .post(`/api/profit/${tradeOpId}/optimize`)
        .send(optimizeDto)
        .expect(201);

      expect(response.body).toHaveProperty("optimizedPrices");
      expect(response.body.optimizedPrices).toHaveProperty("buyerPrice");
      expect(response.body.optimizedPrices).toHaveProperty("sellerPrices");
      expect(response.body).toHaveProperty("expectedProfit");
      expect(response.body).toHaveProperty("expectedMargin");
      expect(response.body.expectedMargin).toBeGreaterThanOrEqual(7);
    });
  });

  describe("/api/profit/validate-margins (POST)", () => {
    it("should validate multiple profit margins", async () => {
      const validateDto = {
        operations: [
          {
            tradeOperationId: "trade-op-1",
            sellingPrice: 375,
            purchasePrice: 350,
            transportCost: 10,
            quantity: 100,
          },
          {
            tradeOperationId: "trade-op-2",
            sellingPrice: 360,
            purchasePrice: 340,
            transportCost: 12,
            quantity: 80,
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/api/profit/validate-margins")
        .send(validateDto)
        .expect(201);

      expect(response.body).toHaveProperty("validations");
      expect(response.body.validations).toBeInstanceOf(Array);
      expect(response.body.validations[0]).toHaveProperty("tradeOperationId");
      expect(response.body.validations[0]).toHaveProperty("isViable");
      expect(response.body.validations[0]).toHaveProperty("profitMargin");
      expect(response.body).toHaveProperty("summary");
      expect(response.body.summary).toHaveProperty("totalViable");
    });
  });

  describe("/api/profit/cumulative (GET)", () => {
    it("should get cumulative profit across operations", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/profit/cumulative")
        .query({
          startDate: "2024-01-01",
          endDate: "2024-01-31",
        })
        .expect(200);

      expect(response.body).toHaveProperty("totalRevenue");
      expect(response.body).toHaveProperty("totalCosts");
      expect(response.body).toHaveProperty("totalProfit");
      expect(response.body).toHaveProperty("averageMargin");
      expect(response.body).toHaveProperty("operationCount");
      expect(response.body).toHaveProperty("breakdown");
    });
  });

  describe("/api/profit/forecast (POST)", () => {
    it("should forecast profit for future operations", async () => {
      const forecastDto = {
        expectedOperations: [
          {
            product: "Wheat",
            expectedQuantity: 500,
            expectedBuyerPrice: 375,
            expectedSellerPrice: 350,
            estimatedTransportCost: 12,
          },
          {
            product: "Corn",
            expectedQuantity: 300,
            expectedBuyerPrice: 320,
            expectedSellerPrice: 295,
            estimatedTransportCost: 10,
          },
        ],
        period: "2024-Q1",
      };

      const response = await request(app.getHttpServer())
        .post("/api/profit/forecast")
        .send(forecastDto)
        .expect(201);

      expect(response.body).toHaveProperty("forecastedProfit");
      expect(response.body).toHaveProperty("forecastedMargin");
      expect(response.body).toHaveProperty("confidence");
      expect(response.body).toHaveProperty("breakdown");
      expect(response.body.breakdown).toBeInstanceOf(Array);
    });
  });

  describe("/api/profit/benchmarks (GET)", () => {
    it("should get profit benchmarks and targets", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/profit/benchmarks")
        .expect(200);

      expect(response.body).toHaveProperty("minimumMargin", 5);
      expect(response.body).toHaveProperty("targetMargin", 7);
      expect(response.body).toHaveProperty("optimalMargin", 10);
      expect(response.body).toHaveProperty("industryAverage");
      expect(response.body).toHaveProperty("currentPerformance");
    });
  });
});
