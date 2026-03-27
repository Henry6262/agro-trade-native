import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TradeOperationService } from './trade-operation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfitCalculationService } from './profit-calculation.service';
import { PriceScenarioService } from './price-scenario.service';
import { TransportCostService } from '../../transport/services/transport-cost.service';
import { RouteOptimizationService } from '../../transport/services/route-optimization.service';
import { RealtimeService } from '../../realtime/realtime.service';
import { TradeEventsService } from '../../trade-events/trade-events.service';
import { EscrowService } from '../../escrow/escrow.service';
import { ConfigService } from '@nestjs/config';
import { TradePhase, TradeStatus } from '@prisma/client';

// ─── Mock factories ────────────────────────────────────────────────────────
const makePrismaMock = () => ({
  tradeOperation: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  buyListing: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  saleListing: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tradeSeller: { create: jest.fn() },
  offerNegotiation: { updateMany: jest.fn() },
  inspectionRequest: { create: jest.fn() },
  tradeStateHistory: { create: jest.fn() },
  $transaction: jest.fn((cb: any) => cb(makePrismaMock())),
});

const makeProfitCalcMock = () => ({
  calculateProfit: jest.fn().mockResolvedValue({
    profit: { netProfit: 1500, profitMargin: 8.5 },
    costs: {
      purchases: { totalCost: 10000, avgPrice: 500 },
      transport: { estimatedCost: 500 },
    },
  }),
});

const makePriceScenarioMock = () => ({
  generateScenarios: jest.fn().mockResolvedValue({
    scenarios: [],
    optimal: { profitMargin: 8.5 },
  }),
});

const makeRealtimeMock = () => ({ emitToUser: jest.fn() });
const makeTradeEventsMock = () => ({ record: jest.fn().mockResolvedValue(undefined) });
const makeEscrowMock = () => ({
  isConfigured: jest.fn().mockReturnValue(false),
  createEscrow: jest.fn(),
  releaseFunds: jest.fn(),
});
const makeTransportCostMock = () => ({ estimateCost: jest.fn().mockResolvedValue({ totalCost: 500 }) });
const makeRouteOptimizationMock = () => ({
  optimizeRoute: jest.fn().mockResolvedValue({
    optimizedRoute: { totalDistance: 250 },
    comparison: { distanceSaved: 50 },
  }),
});
const makeConfigMock = () => ({ get: jest.fn().mockReturnValue('') });

// ─── Helper: build service with mocks ─────────────────────────────
async function buildModule(overrides: Record<string, any> = {}) {
  const prismaMock = makePrismaMock();
  const profitCalcMock = makeProfitCalcMock();
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      TradeOperationService,
      { provide: PrismaService, useValue: overrides.prisma ?? prismaMock },
      { provide: ProfitCalculationService, useValue: overrides.profitCalc ?? profitCalcMock },
      { provide: PriceScenarioService, useValue: overrides.priceScenario ?? makePriceScenarioMock() },
      { provide: TransportCostService, useValue: overrides.transportCost ?? makeTransportCostMock() },
      { provide: RouteOptimizationService, useValue: overrides.routeOpt ?? makeRouteOptimizationMock() },
      { provide: RealtimeService, useValue: overrides.realtime ?? makeRealtimeMock() },
      { provide: TradeEventsService, useValue: overrides.tradeEvents ?? makeTradeEventsMock() },
      { provide: EscrowService, useValue: overrides.escrow ?? makeEscrowMock() },
      { provide: ConfigService, useValue: overrides.config ?? makeConfigMock() },
    ],
  }).compile();

  return {
    service: module.get<TradeOperationService>(TradeOperationService),
    prisma: module.get(PrismaService) as ReturnType<typeof makePrismaMock>,
    profitCalc: module.get(ProfitCalculationService) as ReturnType<typeof makeProfitCalcMock>,
  };
}

// ─── TEST SUITE ───────────────────────────────────────────────────────────
describe('TradeOperationService', () => {
  let service: TradeOperationService;
  let prisma: ReturnType<typeof makePrismaMock>;
  let profitCalc: ReturnType<typeof makeProfitCalcMock>;

  beforeEach(async () => {
    const ctx = await buildModule();
    service = ctx.service;
    prisma = ctx.prisma as any;
    profitCalc = ctx.profitCalc as any;
  });

  // ---- DI bootstrap ----
  it('should be defined (DI working)', () => {
    expect(service).toBeDefined();
  });

  // ---- createTradeOperation ----
  describe('createTradeOperation()', () => {
    const dto = { buyListingId: 'bl-1', targetProfitMargin: 7 } as any;
    const adminId = 'admin-1';

    it('should throw NotFoundException if buy listing not found', async () => {
      prisma.buyListing.findUnique.mockResolvedValue(null);
      await expect(service.createTradeOperation(dto, adminId))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if buy listing is not ACTIVE', async () => {
      prisma.buyListing.findUnique.mockResolvedValue({
        id: 'bl-1', status: 'CLOSED', buyer: {}, product: {},
      });
      await expect(service.createTradeOperation(dto, adminId))
        .rejects.toThrow(BadRequestException);
    });

    it('should create trade operation for valid buy listing', async () => {
      const buyListing = {
        id: 'bl-1', status: 'ACTIVE', buyerId: 'buyer-1',
        buyer: { id: 'buyer-1' }, product: { id: 'prod-1' },
        maxPricePerUnit: { toNumber: () => 10 },
        quantity: { toNumber: () => 100 },
      };
      prisma.buyListing.findUnique.mockResolvedValue(buyListing);
      prisma.tradeOperation.create.mockResolvedValue({ id: 'trade-1', operationNumber: 'OP-1' });
      const result = await service.createTradeOperation(dto, adminId);
      expect(result).toHaveProperty('id', 'trade-1');
      expect(prisma.tradeOperation.create).toHaveBeenCalledTimes(1);
    });
  });

  // ---- addSellersToTrade (NI-5: duplicate guard) ----
  describe('addSellersToTrade()', () => {
    it('should reject duplicate sellers (NI-5 regression)', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 'trade-1',
        buyListing: { quantity: { toNumber: () => 100 } },
        sellers: [{ sellerId: 'seller-1' }],
      });
      await expect(
        service.addSellersToTrade('trade-1', [
          { sellerId: 'seller-1', saleListingId: 'sl-1', requestedQuantity: 50 },
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if trade not found', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue(null);
      await expect(
        service.addSellersToTrade('missing', []),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add valid sellers and update phase when quantity met', async () => {
      const trade = {
        id: 'trade-1',
        buyListing: { quantity: { toNumber: () => 100 }, buyerId: 'buyer-1' },
        sellers: [],
      };
      prisma.tradeOperation.findUnique.mockResolvedValue(trade);
      prisma.saleListing.findUnique.mockResolvedValue({
        id: 'sl-1', quantity: { toNumber: () => 100 },
        seller: { id: 'seller-1' }, product: { name: 'Tomatoes' }, unit: 'kg',
      });
      prisma.tradeSeller.create.mockResolvedValue({ id: 'ts-1', sellerId: 'seller-1' });
      prisma.tradeOperation.update.mockResolvedValue({ ...trade, phase: 'SELLER_NEGOTIATION' });

      const result = await service.addSellersToTrade('trade-1', [
        { sellerId: 'seller-1', saleListingId: 'sl-1', requestedQuantity: 100 },
      ]);
      expect(result).toHaveLength(1);
    });
  });

  // ---- finalizeTrade (NI-1 + NI-20: phase guard + transaction) ----
  describe('finalizeTrade()', () => {
    it('should throw NotFoundException if trade missing', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue(null);
      await expect(service.finalizeTrade('missing')).rejects.toThrow(NotFoundException);
    });

    it('should reject if trade is NOT in DELIVERED phase (NI-1)', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: 'IN_TRANSIT', sellers: [], buyListing: {},
      });
      await expect(service.finalizeTrade('t-1')).rejects.toThrow(BadRequestException);
    });

    it('should reject if not all sellers accepted', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.DELIVERED,
        sellers: [{ status: 'ACCEPTED' }, { status: 'PENDING' }],
        buyListing: { id: 'bl-1' },
      });
      await expect(service.finalizeTrade('t-1')).rejects.toThrow(/all sellers/i);
    });

    it('should return success=false when margin < MIN_PROFIT_MARGIN', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.DELIVERED,
        sellers: [{ status: 'ACCEPTED' }],
        buyListing: { id: 'bl-1' },
      });
      profitCalc.calculateProfit.mockResolvedValue({
        profit: { netProfit: 100, profitMargin: 3 },
        costs: { purchases: { totalCost: 5000, avgPrice: 250 }, transport: { estimatedCost: 200 } },
      });
      const result = await service.finalizeTrade('t-1');
      expect(result.success).toBe(false);
      expect(result.profitMargin).toBe(3);
    });

    it('should use $transaction for atomicity (NI-20)', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.DELIVERED, buyListingId: 'bl-1',
        sellers: [{ status: 'ACCEPTED', saleListingId: 'sl-1', agreedQuantity: 50, requestedQuantity: 50 }],
        buyListing: { id: 'bl-1' },
      });
      const result = await service.finalizeTrade('t-1');
      expect(result.success).toBe(true);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  // ---- updateTradePhase (phase transition validation) ----
  describe('updateTradePhase()', () => {
    it('should throw NotFoundException for missing trade', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue(null);
      await expect(service.updateTradePhase('missing', TradePhase.SELLER_MATCHING))
        .rejects.toThrow(NotFoundException);
    });

    it('should reject invalid phase transition', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.COMPLETED,
        buyListing: { buyerId: 'b-1' },
      });
      await expect(service.updateTradePhase('t-1', TradePhase.INITIATION))
        .rejects.toThrow(BadRequestException);
    });

    it('should allow valid transition INITIATION -> SELLER_MATCHING', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.INITIATION,
        buyListing: { buyerId: 'b-1' },
      });
      prisma.tradeOperation.update.mockResolvedValue({ id: 't-1', phase: TradePhase.SELLER_MATCHING });
      const result = await service.updateTradePhase('t-1', TradePhase.SELLER_MATCHING);
      expect(result.phase).toBe(TradePhase.SELLER_MATCHING);
    });
  });

  // ---- cancelTradeOperation ----
  describe('cancelTradeOperation()', () => {
    it('should reject if not trade owner', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', adminId: 'admin-1', status: 'ACTIVE',
        sellers: [], negotiations: [], transportJobs: [],
      });
      await expect(service.cancelTradeOperation('t-1', 'other-admin'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject cancelling completed trade', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', adminId: 'admin-1', status: TradeStatus.COMPLETED,
        sellers: [], negotiations: [], transportJobs: [],
      });
      await expect(service.cancelTradeOperation('t-1', 'admin-1'))
        .rejects.toThrow(/completed/i);
    });

    it('should reject if active transport jobs exist', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', adminId: 'admin-1', status: 'ACTIVE',
        sellers: [], negotiations: [],
        transportJobs: [{ status: 'IN_TRANSIT' }],
      });
      await expect(service.cancelTradeOperation('t-1', 'admin-1'))
        .rejects.toThrow(/transport jobs/i);
    });
  });

  // ---- buyerConfirmDelivery ----
  describe('buyerConfirmDelivery()', () => {
    it('should reject if caller is not the buyer', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.DELIVERED,
        buyListing: { buyerId: 'buyer-1' },
      });
      await expect(service.buyerConfirmDelivery('t-1', 'wrong-buyer'))
        .rejects.toThrow(BadRequestException);
    });

    it('should reject if not in DELIVERED phase', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.IN_TRANSIT,
        buyListing: { buyerId: 'buyer-1' },
      });
      await expect(service.buyerConfirmDelivery('t-1', 'buyer-1'))
        .rejects.toThrow(BadRequestException);
    });

    it('should complete trade on valid confirmation', async () => {
      prisma.tradeOperation.findUnique.mockResolvedValue({
        id: 't-1', phase: TradePhase.DELIVERED, status: 'ACTIVE',
        metadata: {},
        buyListing: { buyerId: 'buyer-1' },
      });
      prisma.tradeOperation.update.mockResolvedValue({
        id: 't-1', phase: TradePhase.COMPLETED, status: TradeStatus.COMPLETED,
      });
      prisma.tradeStateHistory.create.mockResolvedValue({});
      const result = await service.buyerConfirmDelivery('t-1', 'buyer-1', 'All good');
      expect(result.phase).toBe(TradePhase.COMPLETED);
    });
  });

  // ---- getValidPhaseTransitions (exhaustive) ----
  describe('phase transition map', () => {
    it('COMPLETED and CANCELLED are terminal states', async () => {
      for (const terminalPhase of [TradePhase.COMPLETED, TradePhase.CANCELLED]) {
        prisma.tradeOperation.findUnique.mockResolvedValue({
          id: 't-1', phase: terminalPhase,
          buyListing: { buyerId: 'b-1' },
        });
        await expect(service.updateTradePhase('t-1', TradePhase.INITIATION))
          .rejects.toThrow(BadRequestException);
      }
    });
  });
}); // end describe TradeOperationService