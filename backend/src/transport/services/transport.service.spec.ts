import { Test, TestingModule } from "@nestjs/testing";
import { TransportService } from './transport.service';

import { PrismaService } from "../../prisma/prisma.service";
import { TransportCostService } from "./transport-cost.service";
import { TradeEventsService } from "../../trade-events/trade-events.service";
import {
  TransportRequestStatus,
  BidStatus,
  TransportJobStatus,
  UrgencyLevel,
  TradePhase,
  TruckType,
  Prisma,
} from "@prisma/client";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";

// ─── Helpers ────────────────────────────────────────────────────────────────

const futureDate = (offsetMs: number) => new Date(Date.now() + offsetMs);
const pastDate = (offsetMs: number) => new Date(Date.now() - offsetMs);

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ─── Factories ───────────────────────────────────────────────────────────────

function makeRequest(overrides: Partial<any> = {}): any {
  return {
    id: "request-1",
    tradeOperationId: "trade-1",
    status: TransportRequestStatus.OPEN,
    biddingDeadline: futureDate(48 * HOUR),
    totalWeight: 100,
    estimatedDistance: 200,
    urgencyLevel: UrgencyLevel.STANDARD,
    requiredVehicleType: TruckType.FLATBED,
    pickupPoints: [
      {
        sellerId: "seller-1",
        location: { lat: 42.5, lng: 23.5 },
        quantity: 100,
      },
    ],
    deliveryPoint: { location: { lat: 42.6977, lng: 23.3219 } },
    bids: [],
    tradeOperation: {
      buyListing: {
        product: { name: "Soft Wheat" },
        buyer: { name: "Buyer Co" },
      },
      sellers: [],
    },
    ...overrides,
  };
}

function makeBid(overrides: Partial<any> = {}): any {
  return {
    id: "bid-1",
    transportRequestId: "request-1",
    tradeOperationId: "trade-1",
    transporterId: "transporter-1",
    bidAmount: new Prisma.Decimal(2500),
    vehicleCapacity: 20,
    proposedRoute: {},
    status: BidStatus.PENDING,
    ...overrides,
  };
}

function makeJob(overrides: Partial<any> = {}): any {
  return {
    id: "job-1",
    jobNumber: "JOB-TEST",
    transportRequestId: "request-1",
    tradeOperationId: "trade-1",
    transporterId: "transporter-1",
    status: TransportJobStatus.ASSIGNED,
    pickupsCompleted: [],
    allPickupsComplete: false,
    pickupPhotos: [],
    deliveryPhotos: [],
    estimatedArrival: null,
    transportRequest: {
      pickupPoints: [
        { sellerId: "seller-1", location: { lat: 42.5, lng: 23.5 }, quantity: 50 },
      ],
    },
    ...overrides,
  };
}

// ─── Mock setup ──────────────────────────────────────────────────────────────

const mockPrisma: any = {
  tradeOperation: { findUnique: jest.fn(), update: jest.fn() },
  transportRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  transportBid: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    aggregate: jest.fn(),
  },
  transportJob: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
};
mockPrisma.$transaction = jest.fn((cb: any) => cb(mockPrisma));

const mockTransportCostService = { estimateCost: jest.fn() };
const mockTradeEventsService = { record: jest.fn().mockResolvedValue({}) };

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("TransportService", () => {
  let service: TransportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: TransportCostService, useValue: mockTransportCostService },
        { provide: TradeEventsService, useValue: mockTradeEventsService },
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
  });

  afterEach(() => jest.clearAllMocks());

  // ══════════════════════════════════════════════════════════════════════════
  // autoCreateTransportRequestForTrade
  // ══════════════════════════════════════════════════════════════════════════
  describe("autoCreateTransportRequestForTrade", () => {
    it("returns existing request without re-creating", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue({ id: "existing-1" });

      const result = await service.autoCreateTransportRequestForTrade("trade-1");

      expect(result).toEqual({ id: "existing-1" });
      expect(mockPrisma.tradeOperation.findUnique).not.toHaveBeenCalled();
    });

    it("creates request with correct totalWeight from sellers", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        id: "trade-1",
        sellers: [
          { agreedQuantity: new Prisma.Decimal(50), requestedQuantity: new Prisma.Decimal(50) },
          { agreedQuantity: new Prisma.Decimal(30), requestedQuantity: new Prisma.Decimal(30) },
        ],
      });

      const spy = jest
        .spyOn(service, "createTransportRequest")
        .mockResolvedValue({ id: "req-new", totalWeight: 80 } as any);

      await service.autoCreateTransportRequestForTrade("trade-1");

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          tradeOperationId: "trade-1",
          totalWeight: 80,
          urgencyLevel: UrgencyLevel.STANDARD,
        }),
      );
    });

    it("returns null when totalWeight is 0 (no sellers)", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        id: "trade-1",
        sellers: [],
      });

      const result = await service.autoCreateTransportRequestForTrade("trade-1");

      expect(result).toBeNull();
    });

    it("throws NotFoundException when trade operation missing", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(null);

      await expect(
        service.autoCreateTransportRequestForTrade("bad-trade"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // createTransportRequest
  // ══════════════════════════════════════════════════════════════════════════
  describe("createTransportRequest", () => {
    const baseDto = {
      tradeOperationId: "trade-1",
      totalWeight: 50,
      biddingDeadline: futureDate(48 * HOUR).toISOString(),
    };

    const validTradeOp = {
      id: "trade-1",
      buyListing: {
        buyerId: "buyer-1",
        buyer: { name: "Buyer Co" },
        deliveryAddress: { latitude: 42.6977, longitude: 23.3219, street: "Sofia" },
        product: { name: "Soft Wheat" },
      },
      sellers: [
        {
          sellerId: "seller-1",
          saleListingId: "listing-1",
          seller: { name: "Seller 1" },
          saleListing: {
            address: { latitude: 42.5, longitude: 23.5, street: "Farm 1" },
          },
          agreedQuantity: new Prisma.Decimal(50),
          requestedQuantity: new Prisma.Decimal(50),
          unit: "TON",
          status: "ACCEPTED",
        },
      ],
    };

    it("creates request and updates trade phase to TRANSPORT_MATCHING", async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(validTradeOp);
      mockTransportCostService.estimateCost.mockResolvedValue({
        totalDistance: 120.5,
        totalCost: 1807.5,
      });
      mockPrisma.transportRequest.create.mockResolvedValue({
        id: "req-1",
        requestNumber: "TR-XYZ",
        totalWeight: 50,
        estimatedDistance: 120.5,
        status: TransportRequestStatus.OPEN,
      });
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      const result = await service.createTransportRequest(baseDto);

      expect(result.estimatedDistance).toBe(120.5);
      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: "trade-1" },
        data: expect.objectContaining({
          phase: TradePhase.TRANSPORT_MATCHING,
          estimatedTransportCost: expect.any(Prisma.Decimal),
          totalDistanceKm: 120.5,
        }),
      });
    });

    it("still creates request when cost estimation fails (graceful degradation)", async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(validTradeOp);
      mockTransportCostService.estimateCost.mockRejectedValue(new Error("Cost service down"));
      mockPrisma.transportRequest.create.mockResolvedValue({
        id: "req-1",
        estimatedDistance: undefined,
        status: TransportRequestStatus.OPEN,
      });
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      const result = await service.createTransportRequest(baseDto);

      expect(result).toBeDefined();
      expect(mockPrisma.transportRequest.create).toHaveBeenCalled();
    });

    it("throws NotFoundException when trade operation not found", async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue(null);

      await expect(service.createTransportRequest(baseDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws BadRequestException when no accepted sellers", async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        ...validTradeOp,
        sellers: [],
      });

      await expect(service.createTransportRequest(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws BadRequestException when delivery address has no coordinates", async () => {
      mockPrisma.tradeOperation.findUnique.mockResolvedValue({
        ...validTradeOp,
        buyListing: {
          ...validTradeOp.buyListing,
          deliveryAddress: { street: "No coords" },
        },
      });

      await expect(service.createTransportRequest(baseDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getTransportRequestById
  // ══════════════════════════════════════════════════════════════════════════
  describe("getTransportRequestById", () => {
    it("throws NotFoundException when request not found", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);

      await expect(service.getTransportRequestById("bad-id")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns correct truckTracking when no accepted bids", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(makeRequest({ bids: [] }));
      mockTransportCostService.estimateCost.mockResolvedValue({ totalCost: 1000, totalDistance: 200 });

      const result = await service.getTransportRequestById("request-1");

      expect(result.truckTracking).toMatchObject({
        trucksNeeded: 5, // 100t / 20t per truck
        trucksReserved: 0,
        trucksRemaining: 5,
        fulfillmentPercentage: 0,
        isFullyAssigned: false,
      });
    });

    it("calculates fulfillment correctly with accepted bid truckCount", async () => {
      const request = makeRequest({
        totalWeight: 40,
        bids: [
          { id: "bid-1", status: BidStatus.ACCEPTED, vehicleCapacity: 40, proposedRoute: { truckCount: 2 } },
        ],
      });
      mockPrisma.transportRequest.findUnique.mockResolvedValue(request);
      mockTransportCostService.estimateCost.mockResolvedValue({ totalCost: 500, totalDistance: 100 });

      const result = await service.getTransportRequestById("request-1");

      // 40t / 20t = 2 trucks needed, 2 reserved → fully assigned
      expect(result.truckTracking.isFullyAssigned).toBe(true);
      expect(result.truckTracking.fulfillmentPercentage).toBe(100);
    });

    it("attaches estimatedCostFromPlatform when estimatedDistance is set", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(makeRequest());
      mockTransportCostService.estimateCost.mockResolvedValue({ totalCost: 3000, totalDistance: 200 });

      const result = await service.getTransportRequestById("request-1");

      expect(result.estimatedCostFromPlatform).toBe(3000);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // createTransportBid
  // ══════════════════════════════════════════════════════════════════════════
  describe("createTransportBid", () => {
    const bidDto: any = {
      transportRequestId: "request-1",
      bidAmount: 2500,
      truckCount: 3,
      estimatedDuration: 6,
      vehicleType: TruckType.FLATBED,
      vehicleCapacity: 20,
      expiresAt: futureDate(48 * HOUR).toISOString(),
    };

    it("creates bid and embeds truckCount into proposedRoute", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.transportBid.findFirst.mockResolvedValue(null);
      mockPrisma.transportBid.create.mockResolvedValue(makeBid({ proposedRoute: { truckCount: 3 } }));

      await service.submitBid("transporter-1", bidDto);

      expect(mockPrisma.transportBid.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            proposedRoute: expect.objectContaining({ truckCount: 3 }),
          }),
        }),
      );
    });

    it("throws NotFoundException when request not found", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.createTransportBid("transporter-1", bidDto),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when request is not OPEN", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(
        makeRequest({ status: TransportRequestStatus.ASSIGNED }),
      );

      await expect(
        service.createTransportBid("transporter-1", bidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when bidding deadline has passed", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(
        makeRequest({ biddingDeadline: pastDate(1000) }),
      );

      await expect(
        service.createTransportBid("transporter-1", bidDto),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws BadRequestException when transporter already has an active bid", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(makeRequest());
      mockPrisma.transportBid.findFirst.mockResolvedValue(makeBid());

      await expect(
        service.createTransportBid("transporter-1", bidDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // acceptTransportBid  ($transaction pattern)
  // ══════════════════════════════════════════════════════════════════════════
  describe("acceptTransportBid", () => {
    it("accepts bid, rejects others, creates job and updates trade phase", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(makeBid());
      mockPrisma.transportBid.update.mockResolvedValue(
        makeBid({ status: BidStatus.ACCEPTED }),
      );
      mockPrisma.transportBid.updateMany.mockResolvedValue({ count: 2 });
      mockPrisma.transportRequest.update.mockResolvedValue({});
      mockPrisma.transportJob.create.mockResolvedValue(
        makeJob({ status: TransportJobStatus.ASSIGNED }),
      );
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      const result = await service.acceptTransportBid("bid-1", "admin-1");

      expect(result.acceptedBid.status).toBe(BidStatus.ACCEPTED);
      expect(result.transportJob).toBeDefined();
      expect(mockPrisma.transportBid.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: "bid-1" } }),
          data: { status: BidStatus.REJECTED, evaluatedAt: expect.any(Date) },
        }),
      );
      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: "trade-1" },
        data: expect.objectContaining({ phase: TradePhase.IN_TRANSIT }),
      });
    });

    it("throws NotFoundException when bid not found", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(null);

      await expect(service.acceptTransportBid("bad-bid", "admin-1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("throws BadRequestException when bid is not PENDING", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(
        makeBid({ status: BidStatus.REJECTED }),
      );

      await expect(service.acceptTransportBid("bid-1", "admin-1")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // rejectTransportBid
  // ══════════════════════════════════════════════════════════════════════════
  describe("rejectTransportBid", () => {
    it("rejects a pending bid", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(makeBid());
      mockPrisma.transportBid.update.mockResolvedValue(
        makeBid({ status: BidStatus.REJECTED }),
      );

      const result = await service.rejectTransportBid("bid-1", "admin-1", "Too expensive");

      expect(result.status).toBe(BidStatus.REJECTED);
      expect(mockPrisma.transportBid.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: BidStatus.REJECTED, evaluatedAt: expect.any(Date) },
        }),
      );
    });

    it("throws NotFoundException when bid not found", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectTransportBid("bad-bid", "admin-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws BadRequestException when bid is not PENDING", async () => {
      mockPrisma.transportBid.findUnique.mockResolvedValue(
        makeBid({ status: BidStatus.ACCEPTED }),
      );

      await expect(
        service.rejectTransportBid("bid-1", "admin-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // startTransportJob
  // ══════════════════════════════════════════════════════════════════════════
  describe("startTransportJob", () => {
    it("starts an assigned job", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(makeJob());
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ status: TransportJobStatus.STARTED, startedAt: new Date() }),
      );

      const result = await service.startTransportJob("job-1", "transporter-1");

      expect(result.status).toBe(TransportJobStatus.STARTED);
    });

    it("throws NotFoundException when job not found", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(null);

      await expect(
        service.startTransportJob("bad-job", "transporter-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when wrong transporter", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ transporterId: "other-transporter" }),
      );

      await expect(
        service.startTransportJob("job-1", "transporter-1"),
      ).rejects.toThrow(ForbiddenException);
    });

    it("throws BadRequestException when job already started", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ status: TransportJobStatus.STARTED }),
      );

      await expect(
        service.startTransportJob("job-1", "transporter-1"),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // updateTransportJobStatus
  // ══════════════════════════════════════════════════════════════════════════
  describe("updateTransportJobStatus", () => {
    it("updates status and trade phase when DELIVERING", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(makeJob({ status: TransportJobStatus.STARTED }));
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ status: TransportJobStatus.DELIVERING }),
      );
      mockPrisma.tradeOperation.update.mockResolvedValue({});

      await service.updateTransportJobStatus("job-1", "transporter-1", {
        status: TransportJobStatus.DELIVERING,
      } as any);

      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: "trade-1" },
        data: { phase: TradePhase.DELIVERED },
      });
    });

    it("does NOT update trade phase for non-DELIVERING statuses", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(makeJob());
      mockPrisma.transportJob.update.mockResolvedValue(makeJob({ status: TransportJobStatus.PICKING_UP }));

      await service.updateTransportJobStatus("job-1", "transporter-1", {
        status: TransportJobStatus.PICKING_UP,
      } as any);

      expect(mockPrisma.tradeOperation.update).not.toHaveBeenCalled();
    });

    it("throws ForbiddenException for wrong transporter", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ transporterId: "other" }),
      );

      await expect(
        service.updateTransportJobStatus("job-1", "transporter-1", {
          status: TransportJobStatus.PICKING_UP,
        } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // completePickup
  // ══════════════════════════════════════════════════════════════════════════
  describe("completePickup", () => {
    const pickupDto = {
      sellerId: "seller-1",
      quantityPickedUp: 50,
      completedAt: new Date().toISOString(),
      notes: "All good",
      pickupPhotos: ["photo-url-1"],
    };

    it("marks allPickupsComplete when last pickup done", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(makeJob());
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ allPickupsComplete: true, status: TransportJobStatus.DELIVERING }),
      );

      const result = await service.completePickup("job-1", "transporter-1", pickupDto as any);

      expect(result.allPickupsComplete).toBe(true);
      expect(result.status).toBe(TransportJobStatus.DELIVERING);
    });

    it("keeps PICKING_UP status when pickups remain", async () => {
      const jobWithTwoPickups = makeJob({
        transportRequest: {
          pickupPoints: [
            { sellerId: "seller-1", location: { lat: 42.5, lng: 23.5 }, quantity: 50 },
            { sellerId: "seller-2", location: { lat: 42.6, lng: 23.6 }, quantity: 50 },
          ],
        },
      });
      mockPrisma.transportJob.findUnique.mockResolvedValue(jobWithTwoPickups);
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ allPickupsComplete: false, status: TransportJobStatus.PICKING_UP }),
      );

      const result = await service.completePickup("job-1", "transporter-1", pickupDto as any);

      expect(result.allPickupsComplete).toBe(false);
      expect(result.status).toBe(TransportJobStatus.PICKING_UP);
    });

    it("throws ForbiddenException for wrong transporter", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ transporterId: "other" }),
      );

      await expect(
        service.completePickup("job-1", "transporter-1", pickupDto as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // completeDelivery  ($transaction pattern)
  // ══════════════════════════════════════════════════════════════════════════
  describe("completeDelivery", () => {
    const deliveryDto = {
      completedAt: new Date().toISOString(),
      deliveryPhotos: ["delivery-photo.jpg"],
      proofOfDelivery: "signed-pod",
      customerRating: 5,
    };

    it("completes delivery, updates trade to COMPLETED and closes request", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ allPickupsComplete: true }),
      );
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ status: TransportJobStatus.COMPLETED }),
      );
      mockPrisma.tradeOperation.update.mockResolvedValue({});
      mockPrisma.transportRequest.update.mockResolvedValue({});

      const result = await service.completeDelivery("job-1", "transporter-1", deliveryDto as any);

      expect(result.status).toBe(TransportJobStatus.COMPLETED);
      expect(mockPrisma.tradeOperation.update).toHaveBeenCalledWith({
        where: { id: "trade-1" },
        data: { phase: TradePhase.COMPLETED },
      });
      expect(mockPrisma.transportRequest.update).toHaveBeenCalledWith({
        where: { id: "request-1" },
        data: { status: TransportRequestStatus.COMPLETED },
      });
    });

    it("throws BadRequestException when pickups not complete", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ allPickupsComplete: false }),
      );

      await expect(
        service.completeDelivery("job-1", "transporter-1", deliveryDto as any),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws ForbiddenException for wrong transporter", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ transporterId: "other", allPickupsComplete: true }),
      );

      await expect(
        service.completeDelivery("job-1", "transporter-1", deliveryDto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it("sets onTimeDelivery=true when no estimatedArrival", async () => {
      mockPrisma.transportJob.findUnique.mockResolvedValue(
        makeJob({ allPickupsComplete: true, estimatedArrival: null }),
      );
      mockPrisma.transportJob.update.mockResolvedValue(
        makeJob({ status: TransportJobStatus.COMPLETED }),
      );
      mockPrisma.tradeOperation.update.mockResolvedValue({});
      mockPrisma.transportRequest.update.mockResolvedValue({});

      await service.completeDelivery("job-1", "transporter-1", deliveryDto as any);

      expect(mockPrisma.transportJob.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ onTimeDelivery: true }),
        }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getTransportBids
  // ══════════════════════════════════════════════════════════════════════════
  describe("getTransportBids", () => {
    it("returns bids with competitiveness ranking", async () => {
      const bids = [
        makeBid({ id: "bid-1", bidAmount: new Prisma.Decimal(1000) }),
        makeBid({ id: "bid-2", bidAmount: new Prisma.Decimal(1050) }),
        makeBid({ id: "bid-3", bidAmount: new Prisma.Decimal(1500) }),
      ];
      mockPrisma.transportBid.findMany.mockResolvedValue(bids);
      mockPrisma.transportBid.count.mockResolvedValue(3);

      const result = await service.getTransportBids({} as any);

      expect(result.data[0].competitiveness).toBe("LOWEST");
      expect(result.data[1].competitiveness).toBe("COMPETITIVE"); // ratio 1.05 < 1.1
      expect(result.data[2].competitiveness).toBe("OVERPRICED"); // ratio 1.5 > 1.25
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // getTransportDataForTradeOperation
  // ══════════════════════════════════════════════════════════════════════════
  describe("getTransportDataForTradeOperation", () => {
    it("returns request, bids and job when all exist", async () => {
      const mockReqWithJob = {
        ...makeRequest(),
        bids: [makeBid()],
        transportJob: makeJob(),
      };
      mockPrisma.transportRequest.findUnique.mockResolvedValue(mockReqWithJob);

      const result = await service.getTransportDataForTradeOperation("trade-1");

      expect(result.request).toBeDefined();
      expect(result.bids).toHaveLength(1);
      expect(result.job).toBeDefined();
    });

    it("returns empty bids and null job when no request exists", async () => {
      mockPrisma.transportRequest.findUnique.mockResolvedValue(null);

      const result = await service.getTransportDataForTradeOperation("trade-1");

      expect(result.request).toBeNull();
      expect(result.bids).toEqual([]);
      expect(result.job).toBeNull();
    });
  });
});
