import { Test, TestingModule } from "@nestjs/testing";
import { TransportCostService } from "./transport-cost.service";
import { PrismaService } from "../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

describe("TransportCostService", () => {
  let service: TransportCostService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    transportCostSettings: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportCostService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TransportCostService>(TransportCostService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateDistance (Haversine formula)", () => {
    it("should calculate distance between two points correctly", () => {
      // Sofia to Plovdiv (approximately 132 km as the crow flies)
      const sofia = { lat: 42.6977, lng: 23.3219 };
      const plovdiv = { lat: 42.1354, lng: 24.7453 };

      const distance = service.calculateDistance(sofia, plovdiv);

      // Allow 5% margin of error (132 km +/- 7 km)
      expect(distance).toBeGreaterThan(125); // 132 - 7
      expect(distance).toBeLessThan(139); // 132 + 7
    });

    it("should return 0 for same location", () => {
      const location = { lat: 42.6977, lng: 23.3219 };
      const distance = service.calculateDistance(location, location);

      expect(distance).toBe(0);
    });

    it("should calculate long distances accurately", () => {
      // Sofia to London (approximately 2100 km)
      const sofia = { lat: 42.6977, lng: 23.3219 };
      const london = { lat: 51.5074, lng: -0.1278 };

      const distance = service.calculateDistance(sofia, london);

      // Allow 5% margin of error
      expect(distance).toBeGreaterThan(1995); // 2100 - 105
      expect(distance).toBeLessThan(2205); // 2100 + 105
    });

    it("should handle negative coordinates correctly", () => {
      // Buenos Aires to Cape Town
      const buenosAires = { lat: -34.6037, lng: -58.3816 };
      const capeTown = { lat: -33.9249, lng: 18.4241 };

      const distance = service.calculateDistance(buenosAires, capeTown);

      // These are far apart, should be more than 6000 km
      expect(distance).toBeGreaterThan(6000);
    });

    it("should calculate short distances accurately", () => {
      // Two points 1 km apart (approximately)
      const point1 = { lat: 42.6977, lng: 23.3219 };
      const point2 = { lat: 42.7067, lng: 23.3219 }; // ~1 km north

      const distance = service.calculateDistance(point1, point2);

      // Should be close to 1 km
      expect(distance).toBeGreaterThan(0.9);
      expect(distance).toBeLessThan(1.1);
    });

    it("should be symmetric (distance A to B equals B to A)", () => {
      const pointA = { lat: 42.6977, lng: 23.3219 };
      const pointB = { lat: 42.1354, lng: 24.7453 };

      const distanceAB = service.calculateDistance(pointA, pointB);
      const distanceBA = service.calculateDistance(pointB, pointA);

      expect(distanceAB).toBe(distanceBA);
    });
  });

  describe("calculateDistanceBetweenCoordinates", () => {
    it("should calculate distance using coordinate parameters", () => {
      const distance = service.calculateDistanceBetweenCoordinates(
        42.6977,
        23.3219,
        42.1354,
        24.7453,
      );

      // Should match the same result as calculateDistance
      expect(distance).toBeGreaterThan(125);
      expect(distance).toBeLessThan(139);
    });
  });

  describe("calculateTransportCosts", () => {
    const mockSettings = {
      id: "test-settings",
      baseRatePerKm: new Prisma.Decimal(0.15),
      flatbedMultiplier: 1.0,
      refrigeratedMultiplier: 1.3,
      tankerMultiplier: 1.2,
      containerMultiplier: 1.1,
      tier1MaxKm: 50,
      tier1Rate: new Prisma.Decimal(0.15),
      tier2MaxKm: 200,
      tier2Rate: new Prisma.Decimal(0.13),
      tier3Rate: new Prisma.Decimal(0.11),
      loadingCostPerTon: new Prisma.Decimal(0.5),
      urgencySurcharge: 0.3,
      isActive: true,
      effectiveFrom: new Date(),
      effectiveTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      mockPrismaService.transportCostSettings.findFirst.mockResolvedValue(
        mockSettings,
      );
    });

    it("should calculate transport costs for multiple sellers", async () => {
      const sellerAddresses = [
        { id: "seller1", lat: 42.6977, lng: 23.3219 }, // Sofia
        { id: "seller2", lat: 42.1354, lng: 24.7453 }, // Plovdiv
      ];
      const buyerAddress = { lat: 42.5048, lng: 27.4626 }; // Burgas

      const results = await service.calculateTransportCosts(
        sellerAddresses,
        buyerAddress,
      );

      expect(results).toHaveLength(2);
      expect(results[0].sellerId).toBe("seller1");
      expect(results[1].sellerId).toBe("seller2");
      expect(results[0].distance).toBeGreaterThan(0);
      expect(results[0].transportCost).toBeGreaterThan(0);
      expect(results[1].distance).toBeGreaterThan(0);
      expect(results[1].transportCost).toBeGreaterThan(0);
    });

    it("should calculate correct cost based on distance and rate", async () => {
      const sellerAddresses = [{ id: "seller1", lat: 42.6977, lng: 23.3219 }];
      const buyerAddress = { lat: 42.1354, lng: 24.7453 };

      const results = await service.calculateTransportCosts(
        sellerAddresses,
        buyerAddress,
      );

      const expectedCost = results[0].distance * 0.15; // baseRatePerKm
      const actualCost = results[0].transportCost;

      // Allow small rounding differences
      expect(Math.abs(actualCost - expectedCost)).toBeLessThan(0.01);
    });

    it("should round distance to 1 decimal place", async () => {
      const sellerAddresses = [{ id: "seller1", lat: 42.6977, lng: 23.3219 }];
      const buyerAddress = { lat: 42.1354, lng: 24.7453 };

      const results = await service.calculateTransportCosts(
        sellerAddresses,
        buyerAddress,
      );

      // Check that distance has at most 1 decimal place
      const decimalPlaces = (results[0].distance.toString().split(".")[1] || "")
        .length;
      expect(decimalPlaces).toBeLessThanOrEqual(1);
    });

    it("should round transport cost to 2 decimal places", async () => {
      const sellerAddresses = [{ id: "seller1", lat: 42.6977, lng: 23.3219 }];
      const buyerAddress = { lat: 42.1354, lng: 24.7453 };

      const results = await service.calculateTransportCosts(
        sellerAddresses,
        buyerAddress,
      );

      // Check that cost has at most 2 decimal places
      const decimalPlaces = (
        results[0].transportCost.toString().split(".")[1] || ""
      ).length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });

    it("should handle empty seller array", async () => {
      const results = await service.calculateTransportCosts([], {
        lat: 42.1354,
        lng: 24.7453,
      });

      expect(results).toHaveLength(0);
    });

    it("should use default settings when no active settings found", async () => {
      mockPrismaService.transportCostSettings.findFirst.mockResolvedValue(null);

      const sellerAddresses = [{ id: "seller1", lat: 42.6977, lng: 23.3219 }];
      const buyerAddress = { lat: 42.1354, lng: 24.7453 };

      const results = await service.calculateTransportCosts(
        sellerAddresses,
        buyerAddress,
      );

      expect(results).toHaveLength(1);
      expect(results[0].transportCost).toBeGreaterThan(0);
    });
  });

  describe("clearCache", () => {
    it("should clear the estimation cache", () => {
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
