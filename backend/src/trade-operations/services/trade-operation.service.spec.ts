import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma, TradeEventType, TradePhase, TradeStatus } from "@prisma/client";
import { TradeOperationService } from "./trade-operation.service";
import { PrismaService } from "../../prisma/prisma.service";
import { RealtimeService } from "../../realtime/realtime.service";
import { TradeEventsService } from "../../trade-events/trade-events.service";
import { EscrowService } from "../../escrow/escrow.service";
import { InvestmentsService } from "../../investments/investments.service";
import { TransportCostService } from "../../transport/services/transport-cost.service";
import { RouteOptimizationService } from "../../transport/services/route-optimization.service";

const makeTrade = (overrides: Partial<any> = {}) => ({
  id: "trade-1",
  phase: TradePhase.INITIATION,
  status: TradeStatus.ACTIVE,
  sellingPrice: new Prisma.Decimal(150),
  estimatedTransportCost: new Prisma.Decimal(100),
  buyListing: {
    buyerId: "buyer-1",
    quantity: new Prisma.Decimal(10),
  },
  sellers: [],
  metadata: {},
  incoterm: "DDP",
  ...overrides,
});

const makePrismaMock = () => {
  const mock: any = {
    buyListing: {
      findUnique: jest.fn(),
    },
    tradeOperation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    tradeSeller: {
      create: jest.fn(),
    },
    saleListing: {
      findUnique: jest.fn(),
    },
  };
  // $transaction passes the same mock client into the callback
  mock.$transaction = jest.fn().mockImplementation((fn: (tx: any) => Promise<any>) => fn(mock));
  return mock;
};

const realtimeMock = { emitToUser: jest.fn() };
const tradeEventsMock = { record: jest.fn().mockResolvedValue(undefined) };
const escrowMock = {
  createEscrow: jest.fn().mockResolvedValue({ txHash: "0xabc" }),
  releaseFunds: jest.fn().mockResolvedValue(undefined),
};
const investmentsMock = {
  executeAutoSwap: jest.fn().mockResolvedValue(undefined),
};
const configMock = {
  get: jest.fn().mockReturnValue("admin-wallet"),
};
const transportCostMock = { estimateCost: jest.fn() };
const routeOptimizationMock = { optimizeRoute: jest.fn() };

async function buildModule() {
  const prisma = makePrismaMock();
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TradeOperationService,
      { provide: PrismaService, useValue: prisma },
      { provide: RealtimeService, useValue: realtimeMock },
      { provide: TradeEventsService, useValue: tradeEventsMock },
      { provide: EscrowService, useValue: escrowMock },
      { provide: InvestmentsService, useValue: investmentsMock },
      { provide: ConfigService, useValue: configMock },
      { provide: TransportCostService, useValue: transportCostMock },
      { provide: RouteOptimizationService, useValue: routeOptimizationMock },
    ],
  }).compile();

  return {
    service: module.get(TradeOperationService),
    prisma,
  };
}

describe("TradeOperationService", () => {
  let service: TradeOperationService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    const ctx = await buildModule();
    service = ctx.service;
    prisma = ctx.prisma;
    jest.clearAllMocks();
  });

  it("creates a trade operation and records an event", async () => {
    prisma.buyListing.findUnique.mockResolvedValue({
      id: "buy-1",
      status: "ACTIVE",
      buyer: { id: "buyer-1" },
    });
    prisma.tradeOperation.create.mockResolvedValue({
      id: "trade-1",
      operationNumber: "TR-1",
    });

    const result = await service.create(
      {
        buyListingId: "buy-1",
        sellingPrice: 450,
        notes: "internal note",
      } as any,
      "admin-1",
    );

    expect(result.id).toBe("trade-1");
    expect(prisma.tradeOperation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          buyListingId: "buy-1",
          adminId: "admin-1",
          status: TradeStatus.ACTIVE,
          phase: TradePhase.INITIATION,
          sellingPrice: 450,
          currency: "EUR",
          notes: expect.objectContaining({
            create: expect.objectContaining({
              content: "internal note",
              authorId: "admin-1",
            }),
          }),
        }),
      }),
    );
    expect(tradeEventsMock.record).toHaveBeenCalledWith(
      expect.objectContaining({
        tradeOperationId: "trade-1",
        eventType: TradeEventType.LISTING_CREATED,
      }),
    );
  });

  it("throws when creating a trade for a missing buy listing", async () => {
    prisma.buyListing.findUnique.mockResolvedValue(null);

    await expect(
      service.create({ buyListingId: "missing", sellingPrice: 100 } as any, "admin-1"),
    ).rejects.toThrow(NotFoundException);
  });

  it("updates phase for a valid transition and emits realtime updates", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        buyListing: { buyerId: "buyer-1" },
        sellers: [],
      }),
    );
    prisma.tradeOperation.update.mockResolvedValue(
      makeTrade({ phase: TradePhase.SELLER_MATCHING }),
    );

    const result = await service.updatePhase("trade-1", TradePhase.SELLER_MATCHING);

    expect(result.phase).toBe(TradePhase.SELLER_MATCHING);
    expect(realtimeMock.emitToUser).toHaveBeenCalledWith(
      "buyer-1",
      "trade:updated",
      expect.objectContaining({ phase: TradePhase.SELLER_MATCHING }),
    );
  });

  it("rejects invalid phase transitions", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        phase: TradePhase.COMPLETED,
        buyListing: { buyerId: "buyer-1" },
      }),
    );

    await expect(
      service.updatePhase("trade-1", TradePhase.INITIATION),
    ).rejects.toThrow(BadRequestException);
  });

  it("blocks inspection and transport matching phases until all sellers accepted", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        phase: TradePhase.SELLER_NEGOTIATION,
        buyListing: { buyerId: "buyer-1" },
        sellers: [{ status: "PENDING" }],
      }),
    );

    await expect(
      service.updatePhase("trade-1", TradePhase.INSPECTION_PENDING),
    ).rejects.toThrow(BadRequestException);
  });

  it("calculates profit from trade revenue, seller costs, and transport costs", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        sellingPrice: new Prisma.Decimal(200),
        estimatedTransportCost: new Prisma.Decimal(150),
        buyListing: {
          quantity: new Prisma.Decimal(10),
        },
        sellers: [
          {
            agreedQuantity: new Prisma.Decimal(4),
            requestedQuantity: new Prisma.Decimal(4),
            agreedPrice: new Prisma.Decimal(100),
          },
          {
            agreedQuantity: new Prisma.Decimal(6),
            requestedQuantity: new Prisma.Decimal(6),
            agreedPrice: new Prisma.Decimal(120),
          },
        ],
      }),
    );

    const result = await service.calculateProfit("trade-1");

    expect(result).toEqual({
      revenue: 2000,
      purchaseCost: 1120,
      transportCost: 150,
      netProfit: 730,
      margin: 36.5,
      isViable: true,
    });
  });

  it("requires the correct buyer for pickup confirmation", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        buyListing: { buyerId: "buyer-1" },
      }),
    );

    await expect(
      service.buyerConfirmPickup("trade-1", "buyer-2"),
    ).rejects.toThrow(ForbiddenException);
  });

  it("requires the correct buyer for delivery confirmation", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        buyListing: { buyerId: "buyer-1" },
      }),
    );

    await expect(
      service.buyerConfirmDelivery("trade-1", "buyer-2"),
    ).rejects.toThrow(ForbiddenException);
  });

  // ── finalizeTrade ────────────────────────────────────────────────────────────

  it("finalizeTrade throws when trade is not in DELIVERED phase", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({ phase: TradePhase.IN_TRANSIT, sellers: [] }),
    );

    await expect(service.finalizeTrade("trade-1")).rejects.toThrow(BadRequestException);
    await expect(service.finalizeTrade("trade-1")).rejects.toThrow(/DELIVERED/);
  });

  it("finalizeTrade throws when profit margin is below minimum", async () => {
    // DELIVERED trade with no sellingPrice → margin = 0%
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        phase: TradePhase.DELIVERED,
        sellingPrice: new Prisma.Decimal(100),
        estimatedTransportCost: new Prisma.Decimal(0),
        sellers: [
          {
            agreedQuantity: new Prisma.Decimal(1),
            requestedQuantity: new Prisma.Decimal(1),
            agreedPrice: new Prisma.Decimal(100), // cost = revenue → 0% margin
          },
        ],
        buyListing: { quantity: new Prisma.Decimal(1) },
      }),
    );

    await expect(service.finalizeTrade("trade-1")).rejects.toThrow(BadRequestException);
    await expect(service.finalizeTrade("trade-1")).rejects.toThrow(/margin/i);
  });

  it("finalizeTrade completes trade and returns profit when trade is DELIVERED with sufficient margin", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        phase: TradePhase.DELIVERED,
        sellingPrice: new Prisma.Decimal(200),
        estimatedTransportCost: new Prisma.Decimal(10),
        sellers: [
          {
            agreedQuantity: new Prisma.Decimal(10),
            requestedQuantity: new Prisma.Decimal(10),
            agreedPrice: new Prisma.Decimal(15), // cost = 150, revenue = 200, margin = 20%
          },
        ],
        buyListing: { quantity: new Prisma.Decimal(10) },
      }),
    );
    prisma.tradeOperation.update.mockResolvedValue(
      makeTrade({ phase: TradePhase.COMPLETED, status: TradeStatus.COMPLETED }),
    );

    const result = await service.finalizeTrade("trade-1");

    expect(result.success).toBe(true);
    expect(result.finalProfit).toBeDefined();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.tradeOperation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phase: TradePhase.COMPLETED,
          status: TradeStatus.COMPLETED,
        }),
      }),
    );
  });

  // ── addSellersToTrade duplicate prevention ───────────────────────────────────

  it("addSellersToTrade throws when same saleListingId is already attached", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        sellers: [{ saleListingId: "listing-1", sellerId: "seller-1" }],
        buyListing: { buyerId: "buyer-1", productId: "product-1" },
      }),
    );

    await expect(
      service.addSellersToTrade("trade-1", {
        sellers: [{ saleListingId: "listing-1", sellerId: "seller-1", requestedQuantity: 5 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("addSellersToTrade throws when same sellerId is already attached via different listing", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        sellers: [{ saleListingId: "listing-1", sellerId: "seller-1" }],
        buyListing: { buyerId: "buyer-1", productId: "product-1" },
      }),
    );
    prisma.saleListing.findUnique.mockResolvedValue({
      id: "listing-2",
      sellerId: "seller-1", // same seller, different listing
      productId: "product-1",
      quantity: 10,
      unit: "kg",
    });

    await expect(
      service.addSellersToTrade("trade-1", {
        sellers: [{ saleListingId: "listing-2", sellerId: "seller-1", requestedQuantity: 5 }],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it("addSellersToTrade rejects duplicates within the same request batch", async () => {
    prisma.tradeOperation.findUnique.mockResolvedValue(
      makeTrade({
        sellers: [],
        buyListing: { buyerId: "buyer-1", productId: "product-1" },
      }),
    );
    prisma.saleListing.findUnique.mockResolvedValue({
      id: "listing-1",
      sellerId: "seller-1",
      productId: "product-1",
      quantity: 10,
      unit: "kg",
    });
    prisma.tradeSeller.create.mockResolvedValue({ id: "ts-1" });

    await expect(
      service.addSellersToTrade("trade-1", {
        sellers: [
          { saleListingId: "listing-1", sellerId: "seller-1", requestedQuantity: 5 },
          { saleListingId: "listing-1", sellerId: "seller-1", requestedQuantity: 3 }, // duplicate
        ],
      } as any),
    ).rejects.toThrow(BadRequestException);
  });
});
